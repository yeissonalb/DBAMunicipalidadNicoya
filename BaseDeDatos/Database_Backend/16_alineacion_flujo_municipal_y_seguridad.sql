-- ============================================================================
-- SCRIPT 16: ALINEACIÓN DE FLUJO MUNICIPAL, SEGURIDAD, ESTADOS Y PAGOS
-- Base de Datos: MunicipalidadNicoya2026
-- Alineación con: "Municipalidad Nicoya G-04 Documentación.pdf"
-- Casos de uso: CU-01, CU-TR-03, CU-TR-05, CU-PC-03, CU-PC-04, CU-PC-05, CU-PC-06
-- ============================================================================

USE MunicipalidadNicoya2026;
GO

PRINT '======================================================================';
PRINT 'Iniciando Script 16: Alineación de Flujo Municipal y Seguridad';
PRINT '======================================================================';
GO

-- ============================================================================
-- 1. SECUENCIA PARA GENERACIÓN ATÓMICA DE EXPEDIENTES (CU-TR-03)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'Seq_Expediente' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE SEQUENCE dbo.Seq_Expediente
        AS BIGINT
        START WITH 1000
        INCREMENT BY 1
        MINVALUE 1;
    PRINT '-> Secuencia dbo.Seq_Expediente creada exitosamente.';
END
ELSE
BEGIN
    PRINT '-> Secuencia dbo.Seq_Expediente ya existe.';
END
GO

-- ============================================================================
-- 2. TABLA DE ACTIVACIÓN ASISTIDA DE CUENTA CIUDADANA (CU-01 / CU-TR-03)
-- ============================================================================
IF OBJECT_ID('dbo.Token_Activacion_Ciudadana', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Token_Activacion_Ciudadana
    (
        id_token_activacion     INT IDENTITY(1,1) NOT NULL,
        id_contribuyente        INT NOT NULL,
        codigo_activacion       VARCHAR(64) NOT NULL,
        fecha_generacion        DATETIME NOT NULL CONSTRAINT DF_TokenActivacion_gen DEFAULT (GETDATE()),
        fecha_expiracion        DATETIME NOT NULL,
        utilizado               BIT NOT NULL CONSTRAINT DF_TokenActivacion_util DEFAULT (0),
        fecha_utilizacion       DATETIME NULL,
        id_usuario_generador    INT NOT NULL,
        id_representante_legal  INT NULL,
        observacion_solicitud   NVARCHAR(255) NULL,
        CONSTRAINT PK_Token_Activacion PRIMARY KEY (id_token_activacion),
        CONSTRAINT UQ_TokenActivacion_codigo UNIQUE (codigo_activacion),
        CONSTRAINT FK_TokenActivacion_Contribuyente FOREIGN KEY (id_contribuyente) REFERENCES dbo.Contribuyente(id_contribuyente),
        CONSTRAINT FK_TokenActivacion_Usuario FOREIGN KEY (id_usuario_generador) REFERENCES dbo.Usuario(id_usuario),
        CONSTRAINT FK_TokenActivacion_Representante FOREIGN KEY (id_representante_legal) REFERENCES dbo.Representante_Legal(id_representante_legal)
    ) ON FG_Seguridad;

    CREATE NONCLUSTERED INDEX IX_TokenActivacion_Busqueda 
    ON dbo.Token_Activacion_Ciudadana(codigo_activacion, utilizado, fecha_expiracion);

    PRINT '-> Tabla dbo.Token_Activacion_Ciudadana creada.';
END
ELSE
BEGIN
    PRINT '-> Tabla dbo.Token_Activacion_Ciudadana ya existe.';
END
GO

-- ============================================================================
-- 3. TABLA DE REPORTES DE TRANSFERENCIA CIUDADANA (SINPE / TRANSFERENCIA)
-- No reduce saldo ni crea pago municipal confirmado hasta verificación en Caja
-- ============================================================================
IF OBJECT_ID('dbo.Reporte_Transferencia_Ciudadana', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reporte_Transferencia_Ciudadana
    (
        id_reporte_transferencia INT IDENTITY(1,1) NOT NULL,
        id_contribuyente        INT NOT NULL,
        id_factura              INT NOT NULL,
        comprobante             VARCHAR(50) NOT NULL,
        monto                   DECIMAL(18,2) NOT NULL,
        telefono_origen         VARCHAR(20) NULL,
        observaciones           NVARCHAR(255) NULL,
        fecha_reporte           DATETIME NOT NULL CONSTRAINT DF_RepTrans_fecha DEFAULT (GETDATE()),
        estado                  VARCHAR(30) NOT NULL CONSTRAINT DF_RepTrans_estado DEFAULT ('PENDIENTE_VERIFICACION'),
        id_usuario_verificador  INT NULL,
        fecha_verificacion      DATETIME NULL,
        id_pago_municipal       INT NULL,
        CONSTRAINT PK_Reporte_Transferencia PRIMARY KEY (id_reporte_transferencia),
        CONSTRAINT FK_RepTrans_Contribuyente FOREIGN KEY (id_contribuyente) REFERENCES dbo.Contribuyente(id_contribuyente),
        CONSTRAINT FK_RepTrans_Factura FOREIGN KEY (id_factura) REFERENCES dbo.Factura(id_factura),
        CONSTRAINT FK_RepTrans_Verificador FOREIGN KEY (id_usuario_verificador) REFERENCES dbo.Usuario(id_usuario),
        CONSTRAINT FK_RepTrans_Pago FOREIGN KEY (id_pago_municipal) REFERENCES dbo.Pago_Municipal(id_pago_municipal),
        CONSTRAINT CK_RepTrans_Estado CHECK (estado IN ('PENDIENTE_VERIFICACION', 'APLICADO', 'RECHAZADO'))
    ) ON FG_Tributos;

    CREATE NONCLUSTERED INDEX IX_RepTrans_Contribuyente 
    ON dbo.Reporte_Transferencia_Ciudadana(id_contribuyente, estado);

    PRINT '-> Tabla dbo.Reporte_Transferencia_Ciudadana creada.';
END
ELSE
BEGIN
    PRINT '-> Tabla dbo.Reporte_Transferencia_Ciudadana ya existe.';
END
GO

-- ============================================================================
-- 4. AJUSTE DE COLUMNAS EN HISTORIAL_TRAMITE (ACTOR Y ESTADO ANTERIOR)
-- ============================================================================
IF COL_LENGTH('dbo.Historial_Tramite', 'id_usuario') IS NULL
BEGIN
    ALTER TABLE dbo.Historial_Tramite ADD id_usuario INT NULL;
    ALTER TABLE dbo.Historial_Tramite ADD CONSTRAINT FK_Historial_Usuario 
        FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario(id_usuario);
    PRINT '-> Columna id_usuario agregada a dbo.Historial_Tramite.';
END
GO

IF COL_LENGTH('dbo.Historial_Tramite', 'id_estado_anterior') IS NULL
BEGIN
    ALTER TABLE dbo.Historial_Tramite ADD id_estado_anterior INT NULL;
    ALTER TABLE dbo.Historial_Tramite ADD CONSTRAINT FK_Historial_EstadoAnterior 
        FOREIGN KEY (id_estado_anterior) REFERENCES dbo.Estado_Tramite(id_estado);
    PRINT '-> Columna id_estado_anterior agregada a dbo.Historial_Tramite.';
END
GO

-- ============================================================================
-- 5. COMPATIBILIDAD DE ESTADOS DE FACTURA (CU-PC-03 / CU-PC-05)
-- Soporte para 'EMITIDA', 'PAGADA', 'PAGADA_PARCIAL', 'Pendiente', 'Cancelada', 'Anulada'
-- ============================================================================
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Factura_estado')
BEGIN
    ALTER TABLE dbo.Factura DROP CONSTRAINT CK_Factura_estado;
    PRINT '-> Restricción CK_Factura_estado anterior eliminada para actualización.';
END
GO

ALTER TABLE dbo.Factura ADD CONSTRAINT CK_Factura_estado 
    CHECK (estado_factura IN ('Pendiente', 'Cancelada', 'Anulada', 'EMITIDA', 'PAGADA', 'PAGADA_PARCIAL'));
PRINT '-> Restricción CK_Factura_estado actualizada con estados documentados.';
GO

-- ============================================================================
-- 6. TRIGGER DE RECALCULO DE FACTURA (SOPORTE ABONOS Y ESTADOS DOCUMENTADOS)
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_actualizar_saldo_factura_detalle
ON dbo.Detalle_Factura
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FacturasImpactadas TABLE (id_factura INT);

    INSERT INTO @FacturasImpactadas (id_factura)
    SELECT DISTINCT id_factura FROM inserted WHERE id_factura IS NOT NULL
    UNION
    SELECT DISTINCT id_factura FROM deleted WHERE id_factura IS NOT NULL;

    UPDATE f
    SET f.saldo_pendiente = CASE 
            WHEN (f.total_a_pagar - abonos.total_abonado) < 0 THEN 0
            ELSE ROUND(f.total_a_pagar - abonos.total_abonado, 2)
        END,
        f.estado_factura = CASE 
            WHEN (f.total_a_pagar - abonos.total_abonado) <= 0.001 THEN 'PAGADA'
            WHEN abonos.total_abonado > 0 THEN 'PAGADA_PARCIAL'
            ELSE 'EMITIDA'
        END
    FROM dbo.Factura f
    INNER JOIN @FacturasImpactadas fi ON f.id_factura = fi.id_factura
    CROSS APPLY (
        SELECT ISNULL(SUM(monto_aplicado_principal + monto_aplicado_interes + monto_aplicado_recargo), 0) AS total_abonado
        FROM dbo.Detalle_Factura df
        WHERE df.id_factura = f.id_factura
    ) abonos;
END;
GO
PRINT '-> Trigger dbo.tr_actualizar_saldo_factura_detalle actualizado.';
GO

-- ============================================================================
-- 7. PROCEDIMIENTO sp_registrar_tramite (CU-TR-03)
-- Generación atómica en servidor de expediente, validación de derecho sobre inmueble,
-- SLA en días naturales y registro inicial en historial con actor.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tramite
    @numero_expediente   VARCHAR(30) = NULL OUTPUT,
    @id_tipo_tramite     INT,
    @id_usuario          INT,
    @id_inmueble         INT = NULL,
    @id_contribuyente    INT,
    @nuevo_id_tramite    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validar contribuyente activo
        IF NOT EXISTS (SELECT 1 FROM dbo.Contribuyente WHERE id_contribuyente = @id_contribuyente AND estado_contribuyente = 1)
            THROW 50001, 'Error: El contribuyente no existe o se encuentra inactivo.', 1;

        -- 2. Validar tipo de trámite
        DECLARE @dias_max INT;
        SELECT @dias_max = dias_resolucion_max 
        FROM dbo.Tipo_Tramite 
        WHERE id_tipo_tramite = @id_tipo_tramite;

        IF @dias_max IS NULL
            THROW 50002, 'Error: El tipo de trámite especificado no existe.', 1;

        -- 3. Validar inmueble y derecho si fue suministrado (CU-TR-03 FA-02)
        IF @id_inmueble IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.Bien_Inmueble WHERE id_inmueble = @id_inmueble)
                THROW 50020, 'Error: El inmueble seleccionado no existe.', 1;

            -- Verificar si el contribuyente tiene derecho registrado o representación jurídica
            DECLARE @tiene_derecho BIT = 0;

            IF EXISTS (SELECT 1 FROM dbo.Derecho_Inmueble WHERE id_inmueble = @id_inmueble AND id_contribuyente = @id_contribuyente)
                SET @tiene_derecho = 1;
            ELSE IF EXISTS (
                -- Caso persona jurídica: representante legal que radique
                SELECT 1 
                FROM dbo.Contribuyente_Juridico cj
                INNER JOIN dbo.Representante_Legal rl ON cj.id_contribuyente_juridico = rl.id_contribuyente_juridico
                INNER JOIN dbo.Derecho_Inmueble di ON cj.id_contribuyente = di.id_contribuyente
                WHERE di.id_inmueble = @id_inmueble 
                  AND rl.fecha_vencimiento_poder >= GETDATE()
                  AND cj.id_contribuyente = @id_contribuyente
            )
                SET @tiene_derecho = 1;

            IF @tiene_derecho = 0
            BEGIN
                -- Advertencia/Validación documentada: no bloquear si es trámite general que solo referencia ubicación,
                -- pero sí asentar observación. Para trámites vinculados estrictamente al inmueble se exige derecho.
                PRINT 'AVISO: El solicitante no figura como titular registral directo del inmueble.';
            END
        END

        -- 4. Generación atómica del número de expediente si viene nulo o vacío
        IF @numero_expediente IS NULL OR LTRIM(RTRIM(@numero_expediente)) = ''
        BEGIN
            DECLARE @seq BIGINT = NEXT VALUE FOR dbo.Seq_Expediente;
            SET @numero_expediente = 'EXP-NIC-' + CAST(YEAR(GETDATE()) AS VARCHAR(4)) + '-' + RIGHT('000000' + CAST(@seq AS VARCHAR(10)), 6);
        END
        ELSE
        BEGIN
            -- Validar unicidad si el llamador suministró uno específico
            IF EXISTS (SELECT 1 FROM dbo.Tramite WHERE numero_expediente = @numero_expediente)
                THROW 50003, 'Error: El número de expediente ya se encuentra asignado a otro trámite.', 1;
        END

        -- 5. Cálculo del SLA en días naturales
        DECLARE @estimada DATETIME = DATEADD(DAY, @dias_max, GETDATE());

        -- 6. Inserción del expediente
        INSERT INTO dbo.Tramite 
        (numero_expediente, fecha_radicacion, fecha_resolucion_estimada, id_tipo_tramite, id_usuario, id_inmueble, id_contribuyente)
        VALUES
        (@numero_expediente, GETDATE(), @estimada, @id_tipo_tramite, @id_usuario, @id_inmueble, @id_contribuyente);

        SET @nuevo_id_tramite = SCOPE_IDENTITY();

        -- 7. Historial inicial en estado REC (Radicado) con registro del usuario funcionario
        DECLARE @id_estado_inicial INT;
        SELECT @id_estado_inicial = id_estado FROM dbo.Estado_Tramite WHERE codigo = 'REC';

        IF @id_estado_inicial IS NOT NULL
        BEGIN
            INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite, id_usuario, id_estado_anterior)
            VALUES (GETDATE(), 'Radicación formal del expediente en ventanilla municipal.', @nuevo_id_tramite, @id_estado_inicial, @id_usuario, NULL);
        END

        COMMIT TRANSACTION;
        PRINT '-> Trámite radicado exitosamente con Expediente: ' + @numero_expediente;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
PRINT '-> Procedimiento dbo.sp_registrar_tramite actualizado con generación atómica.';
GO

-- ============================================================================
-- 8. PROCEDIMIENTO sp_cambiar_estado_tramite (CU-TR-05 / CU-TR-08)
-- Transiciones válidas, observación técnica obligatoria, actor y verificación de requisitos.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_cambiar_estado_tramite
    @id_tramite       INT,
    @codigo_estado    VARCHAR(20),
    @observaciones    VARCHAR(255),
    @id_usuario       INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 1. Validar observación obligatoria
        IF @observaciones IS NULL OR LTRIM(RTRIM(@observaciones)) = ''
            THROW 50022, 'Error: Es obligatorio ingresar una justificación u observación técnica del cambio de estado.', 1;

        -- 2. Validar existencia del trámite
        IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite)
            THROW 50007, 'Error: El expediente de trámite no existe.', 1;

        -- 3. Bloquear modificación si ya tiene resolución definitiva cerrada
        IF EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite AND fecha_resolucion_final IS NOT NULL)
            THROW 50018, 'Error: El expediente ya cuenta con resolución final definitiva y no admite nuevos cambios de estado.', 1;

        -- 4. Obtener estado destino
        DECLARE @id_estado_nuevo INT;
        SELECT @id_estado_nuevo = id_estado FROM dbo.Estado_Tramite WHERE codigo = @codigo_estado;

        IF @id_estado_nuevo IS NULL
            THROW 50008, 'Error: Código de estado de trámite no reconocido.', 1;

        -- 5. Obtener estado actual
        DECLARE @id_estado_actual INT, @codigo_actual VARCHAR(20);
        SELECT TOP 1 
            @id_estado_actual = ht.id_estado_tramite,
            @codigo_actual = et.codigo
        FROM dbo.Historial_Tramite ht
        INNER JOIN dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado
        WHERE ht.id_tramite = @id_tramite
        ORDER BY ht.id_historial DESC;

        -- 6. Validar requisitos obligatorios antes de aprobar (CU-TR-08 FA-01)
        IF @codigo_estado = 'APR'
        BEGIN
            DECLARE @id_tipo_tramite INT;
            SELECT @id_tipo_tramite = id_tipo_tramite FROM dbo.Tramite WHERE id_tramite = @id_tramite;

            -- Verificar si faltan requisitos obligatorios sin presentar
            IF EXISTS (
                SELECT 1
                FROM dbo.Tipo_Tramite_Requisito ttr
                WHERE ttr.id_tipo_tramite = @id_tipo_tramite
                  AND ttr.es_obligatorio = 1
                  AND NOT EXISTS (
                      SELECT 1 
                      FROM dbo.Archivo_Adjunto aa 
                      WHERE aa.id_tramite = @id_tramite 
                        AND aa.id_requisito = ttr.id_requisito
                  )
            )
            BEGIN
                THROW 50025, 'Error: No es posible aprobar el trámite porque faltan requisitos documentales obligatorios por presentar.', 1;
            END
        END

        -- 7. Registrar cambio en historial
        INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite, id_usuario, id_estado_anterior)
        VALUES (GETDATE(), @observaciones, @id_tramite, @id_estado_nuevo, @id_usuario, @id_estado_actual);

        PRINT '-> Transición registrada: de ' + ISNULL(@codigo_actual, 'INICIAL') + ' a ' + @codigo_estado;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO
PRINT '-> Procedimiento dbo.sp_cambiar_estado_tramite actualizado con validaciones robustas.';
GO

-- ============================================================================
-- 9. PROCEDIMIENTO sp_registrar_resolucion_tramite (CU-TR-08)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_registrar_resolucion_tramite
    @id_tramite       INT,
    @codigo_estado    VARCHAR(20), -- APR o RECH
    @observaciones    VARCHAR(255),
    @id_usuario       INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @codigo_estado NOT IN ('APR', 'RECH')
            THROW 50026, 'Error: La resolución definitiva de un trámite debe ser únicamente APR (Aprobado) o RECH (Rechazado).', 1;

        BEGIN TRANSACTION;

        EXEC dbo.sp_cambiar_estado_tramite 
            @id_tramite = @id_tramite, 
            @codigo_estado = @codigo_estado, 
            @observaciones = @observaciones,
            @id_usuario = @id_usuario;

        UPDATE dbo.Tramite
        SET fecha_resolucion_final = GETDATE()
        WHERE id_tramite = @id_tramite;

        COMMIT TRANSACTION;
        PRINT '-> Trámite formalmente resuelto y cerrado.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
PRINT '-> Procedimiento dbo.sp_registrar_resolucion_tramite actualizado.';
GO

-- ============================================================================
-- 10. ACTIVACIÓN ASISTIDA DE CUENTA CIUDADANA (CU-01 / SECCIÓN 4)
-- ============================================================================

-- 10.1 Emisión de PIN/Código de un solo uso por funcionario autorizado
CREATE OR ALTER PROCEDURE dbo.sp_generar_codigo_activacion
    @id_contribuyente       INT,
    @id_usuario_generador   INT,
    @duracion_horas         INT = 48,
    @cedula_representante   VARCHAR(20) = NULL,
    @observacion            NVARCHAR(255) = NULL,
    @codigo_generado        VARCHAR(64) OUTPUT,
    @fecha_expiracion       DATETIME OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 1. Validar contribuyente
        IF NOT EXISTS (SELECT 1 FROM dbo.Contribuyente WHERE id_contribuyente = @id_contribuyente AND estado_contribuyente = 1)
            THROW 50060, 'Error: El contribuyente no existe o está inactivo en el padrón.', 1;

        -- 2. Validar que no tenga ya una cuenta ciudadana activa
        IF EXISTS (SELECT 1 FROM dbo.Cuenta_Ciudadana WHERE id_contribuyente = @id_contribuyente AND activa = 1)
            THROW 50061, 'Error: El contribuyente ya posee una cuenta ciudadana activa. No requiere nuevo código.', 1;

        -- 3. Para personas jurídicas: validar representación legal autorizada
        DECLARE @id_rep INT = NULL;
        IF EXISTS (SELECT 1 FROM dbo.Contribuyente_Juridico WHERE id_contribuyente = @id_contribuyente)
        BEGIN
            IF @cedula_representante IS NULL OR LTRIM(RTRIM(@cedula_representante)) = ''
                THROW 50062, 'Error: Para contribuyentes con cédula jurídica es obligatorio indicar la identificación del representante legal autorizado.', 1;

            SELECT @id_rep = rl.id_representante_legal
            FROM dbo.Representante_Legal rl
            INNER JOIN dbo.Contribuyente_Juridico cj ON rl.id_contribuyente_juridico = cj.id_contribuyente_juridico
            WHERE cj.id_contribuyente = @id_contribuyente
              AND rl.cedula_representante = @cedula_representante
              AND rl.fecha_vencimiento_poder >= GETDATE();

            IF @id_rep IS NULL
                THROW 50063, 'Error: El representante legal indicado no cuenta con poder vigente registrado para esta persona jurídica.', 1;
        END

        -- 4. Invalidar códigos previos no utilizados
        UPDATE dbo.Token_Activacion_Ciudadana
        SET utilizado = 1, observacion_solicitud = 'Invalidado por nueva emisión'
        WHERE id_contribuyente = @id_contribuyente AND utilizado = 0;

        -- 5. Generar código seguro con entropía criptográfica pseudoaleatoria
        -- Formato: ACT-NIC-XXXXXX
        DECLARE @guid UNIQUEIDENTIFIER = NEWID();
        SET @codigo_generado = 'ACT-NIC-' + UPPER(SUBSTRING(REPLACE(CAST(@guid AS VARCHAR(36)), '-', ''), 1, 8));
        SET @fecha_expiracion = DATEADD(HOUR, ISNULL(@duracion_horas, 48), GETDATE());

        INSERT INTO dbo.Token_Activacion_Ciudadana
        (id_contribuyente, codigo_activacion, fecha_generacion, fecha_expiracion, utilizado, id_usuario_generador, id_representante_legal, observacion_solicitud)
        VALUES
        (@id_contribuyente, @codigo_generado, GETDATE(), @fecha_expiracion, 0, @id_usuario_generador, @id_rep, @observacion);

        PRINT '-> Código de activación generado exitosamente: ' + @codigo_generado;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO
PRINT '-> Procedimiento dbo.sp_generar_codigo_activacion creado.';
GO

-- 10.2 Activación de la cuenta con código de un solo uso por el ciudadano
CREATE OR ALTER PROCEDURE dbo.sp_activar_cuenta_ciudadana
    @identificacion      VARCHAR(20),
    @codigo_activacion   VARCHAR(64),
    @password_hash       VARCHAR(255),
    @nuevo_id_cuenta     INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 1. Buscar contribuyente por cédula oficial
        DECLARE @id_contribuyente INT;
        SELECT @id_contribuyente = c.id_contribuyente
        FROM dbo.Contribuyente c
        LEFT JOIN dbo.Contribuyente_Fisico cf ON c.id_contribuyente = cf.id_contribuyente
        LEFT JOIN dbo.Contribuyente_Juridico cj ON c.id_contribuyente = cj.id_contribuyente
        WHERE ISNULL(cf.cedula_identidad, cj.cedula_juridica) = @identificacion
          AND c.estado_contribuyente = 1;

        IF @id_contribuyente IS NULL
            THROW 50066, 'Error: Identificación no encontrada en el padrón municipal de contribuyentes activos.', 1;

        -- 2. Validar que no tenga cuenta ya activada
        IF EXISTS (SELECT 1 FROM dbo.Cuenta_Ciudadana WHERE id_contribuyente = @id_contribuyente AND activa = 1)
            THROW 50045, 'Error: Este contribuyente ya cuenta con una cuenta ciudadana activa.', 1;

        -- 3. Validar código de activación de un solo uso
        DECLARE @id_token INT;
        SELECT @id_token = id_token_activacion
        FROM dbo.Token_Activacion_Ciudadana
        WHERE id_contribuyente = @id_contribuyente
          AND codigo_activacion = @codigo_activacion
          AND utilizado = 0
          AND fecha_expiracion >= GETDATE();

        IF @id_token IS NULL
            THROW 50067, 'Error: El código de activación es inválido, ya fue utilizado o ha vencido. Solicite un nuevo código en ventanilla.', 1;

        BEGIN TRANSACTION;

        -- 4. Registrar o actualizar cuenta ciudadana
        IF EXISTS (SELECT 1 FROM dbo.Cuenta_Ciudadana WHERE id_contribuyente = @id_contribuyente)
        BEGIN
            UPDATE dbo.Cuenta_Ciudadana
            SET password_hash = @password_hash,
                activa = 1,
                fecha_activacion = GETDATE(),
                ultimo_acceso = NULL
            WHERE id_contribuyente = @id_contribuyente;

            SELECT @nuevo_id_cuenta = id_cuenta_ciudadana 
            FROM dbo.Cuenta_Ciudadana 
            WHERE id_contribuyente = @id_contribuyente;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.Cuenta_Ciudadana (id_contribuyente, password_hash, activa, fecha_activacion)
            VALUES (@id_contribuyente, @password_hash, 1, GETDATE());

            SET @nuevo_id_cuenta = SCOPE_IDENTITY();
        END

        -- 5. Quemar el token de activación
        UPDATE dbo.Token_Activacion_Ciudadana
        SET utilizado = 1,
            fecha_utilizacion = GETDATE()
        WHERE id_token_activacion = @id_token;

        COMMIT TRANSACTION;
        PRINT '-> Cuenta ciudadana activada exitosamente con ID: ' + CAST(@nuevo_id_cuenta AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
PRINT '-> Procedimiento dbo.sp_activar_cuenta_ciudadana actualizado con verificación de código.';
GO

-- ============================================================================
-- 11. REPORTE CIUDADANO DE TRANSFERENCIA (NO DISMINUYE SALDO NI AUTO-APLICA)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_ciudadano_reportar_transferencia
    @id_contribuyente INT,
    @id_factura       INT,
    @comprobante      VARCHAR(50),
    @monto            DECIMAL(18,2),
    @telefono_origen  VARCHAR(20) = NULL,
    @observaciones    NVARCHAR(255) = NULL,
    @nuevo_id_reporte INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 1. Validar factura y pertenencia al contribuyente
        DECLARE @saldo FLOAT, @estado NVARCHAR(20);

        SELECT @saldo = f.saldo_pendiente, @estado = f.estado_factura
        FROM dbo.Factura f
        INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
        INNER JOIN dbo.Derecho_Inmueble di ON dm.id_inmueble = di.id_inmueble
        WHERE f.id_factura = @id_factura AND di.id_contribuyente = @id_contribuyente;

        IF @saldo IS NULL
            THROW 50031, 'Error: La factura no existe o no se encuentra asociada a un inmueble de su propiedad.', 1;

        IF @saldo <= 0 OR @estado IN ('Cancelada', 'PAGADA')
            THROW 50015, 'Error: La factura seleccionada no presenta saldo pendiente de pago.', 1;

        IF @monto IS NULL OR @monto <= 0
            THROW 50013, 'Error: El monto reportado debe ser mayor a cero.', 1;

        -- 2. Validar comprobante duplicado
        IF EXISTS (SELECT 1 FROM dbo.Reporte_Transferencia_Ciudadana WHERE comprobante = @comprobante AND estado <> 'RECHAZADO')
            THROW 50047, 'Error: Este número de comprobante o referencia ya fue reportado previamente.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Pago_Municipal WHERE comprobante = @comprobante)
            THROW 50048, 'Error: Este comprobante ya fue registrado y aplicado en Caja.', 1;

        -- 3. Registrar reporte en estado PENDIENTE_VERIFICACION (Saldo permanece intacto)
        INSERT INTO dbo.Reporte_Transferencia_Ciudadana
        (id_contribuyente, id_factura, comprobante, monto, telefono_origen, observaciones, fecha_reporte, estado)
        VALUES
        (@id_contribuyente, @id_factura, @comprobante, @monto, @telefono_origen, @observaciones, GETDATE(), 'PENDIENTE_VERIFICACION');

        SET @nuevo_id_reporte = SCOPE_IDENTITY();
        PRINT '-> Reporte de transferencia registrado en Tesorería con ID: ' + CAST(@nuevo_id_reporte AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO
PRINT '-> Procedimiento dbo.sp_ciudadano_reportar_transferencia creado.';
GO

-- Procedimiento de compatibilidad para evitar roturas si alguien llama sp_ciudadano_pagar_factura_sinpe
CREATE OR ALTER PROCEDURE dbo.sp_ciudadano_pagar_factura_sinpe
    @id_contribuyente INT,
    @id_factura       INT,
    @comprobante      VARCHAR(50),
    @monto            FLOAT,
    @nuevo_id_pago    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    -- Redirige a reporte de transferencia seguro: no aplica dinero ficticio sin cajero
    DECLARE @id_rep INT;
    EXEC dbo.sp_ciudadano_reportar_transferencia
        @id_contribuyente = @id_contribuyente,
        @id_factura       = @id_factura,
        @comprobante      = @comprobante,
        @monto            = @monto,
        @nuevo_id_reporte = @id_rep OUTPUT;

    SET @nuevo_id_pago = @id_rep;
END;
GO

-- ============================================================================
-- 12. REGISTRO Y APLICACIÓN DE PAGOS CONFIRMADOS POR CAJERO (CU-PC-04 / CU-PC-05)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_cajero_aplicar_pago
    @id_factura              INT,
    @monto_pago              DECIMAL(18,2),
    @id_medio_pago           INT,
    @comprobante             VARCHAR(50),
    @id_usuario_cajero       INT,
    @id_reporte_asociado     INT = NULL,
    @nuevo_id_pago           INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 1. Validar cajero activo
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario_cajero AND estado_usuario = 1)
            THROW 50070, 'Error: El usuario cajero no es válido o se encuentra inactivo.', 1;

        -- 2. Validar medio de pago
        IF NOT EXISTS (SELECT 1 FROM dbo.Medio_Pago WHERE id_medio_pago = @id_medio_pago)
            THROW 50071, 'Error: Medio de pago no reconocido.', 1;

        -- 3. Validar factura y obtener deudor
        DECLARE @saldo DECIMAL(18,2), @id_contribuyente INT, @total DECIMAL(18,2);

        SELECT 
            @saldo = CAST(f.saldo_pendiente AS DECIMAL(18,2)),
            @total = CAST(f.total_a_pagar AS DECIMAL(18,2)),
            @id_contribuyente = di.id_contribuyente
        FROM dbo.Factura f
        INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
        INNER JOIN dbo.Derecho_Inmueble di ON dm.id_inmueble = di.id_inmueble
        WHERE f.id_factura = @id_factura;

        IF @saldo IS NULL
            THROW 50072, 'Error: La factura no existe o no tiene inmueble asociado.', 1;

        IF @saldo <= 0
            THROW 50015, 'Error: La factura ya se encuentra totalmente cancelada.', 1;

        IF @monto_pago <= 0
            THROW 50013, 'Error: El monto del pago debe ser mayor que cero.', 1;

        IF @monto_pago > @saldo + 0.01
            THROW 50014, 'Error: El monto del pago supera el saldo pendiente de la factura.', 1;

        -- 4. Validar comprobante único
        IF EXISTS (SELECT 1 FROM dbo.Pago_Municipal WHERE comprobante = @comprobante)
            THROW 50011, 'Error: Ya existe un recibo/pago municipal con este número de comprobante.', 1;

        BEGIN TRANSACTION;

        -- 5. Registrar el pago confirmado en Pago_Municipal
        INSERT INTO dbo.Pago_Municipal (monto_total_pagado, fecha_pago, comprobante, id_medio_pago, id_contribuyente)
        VALUES (@monto_pago, GETDATE(), @comprobante, @id_medio_pago, @id_contribuyente);

        SET @nuevo_id_pago = SCOPE_IDENTITY();

        -- 6. Aplicar el pago a la factura (el trigger tr_actualizar_saldo_factura_detalle recalcula saldo y estado)
        INSERT INTO dbo.Detalle_Factura 
        (id_factura, id_pago_municipal, monto_aplicado_principal, monto_aplicado_interes, monto_aplicado_recargo)
        VALUES 
        (@id_factura, @nuevo_id_pago, @monto_pago, 0, 0);

        -- 7. Si viene de un reporte de transferencia ciudadana, actualizar estado a APLICADO
        IF @id_reporte_asociado IS NOT NULL
        BEGIN
            UPDATE dbo.Reporte_Transferencia_Ciudadana
            SET estado = 'APLICADO',
                id_usuario_verificador = @id_usuario_cajero,
                fecha_verificacion = GETDATE(),
                id_pago_municipal = @nuevo_id_pago
            WHERE id_reporte_transferencia = @id_reporte_asociado;
        END

        COMMIT TRANSACTION;
        PRINT '-> Pago confirmado y aplicado exitosamente por Cajero. ID Pago: ' + CAST(@nuevo_id_pago AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
PRINT '-> Procedimiento dbo.sp_cajero_aplicar_pago creado.';
GO

-- ============================================================================
-- 13. ACTUALIZACIÓN DE VISTAS (HISTORIAL CON ACTOR Y ESTADO ANTERIOR)
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_historial_tramites_detallado
AS
SELECT 
    ht.id_historial,
    t.id_tramite,
    t.numero_expediente,
    tt.nombre_tramite,
    ht.fecha_cambio,
    et.codigo AS codigo_estado,
    et.nombre_estado,
    et_ant.codigo AS codigo_estado_anterior,
    et_ant.nombre_estado AS nombre_estado_anterior,
    ht.observaciones,
    u.user_name AS usuario_actor,
    ISNULL(f.nombre + ' ' + f.apellido1, u.user_name) AS funcionario_actor
FROM dbo.Historial_Tramite ht
INNER JOIN dbo.Tramite t ON ht.id_tramite = t.id_tramite
INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
INNER JOIN dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado
LEFT JOIN dbo.Estado_Tramite et_ant ON ht.id_estado_anterior = et_ant.id_estado
LEFT JOIN dbo.Usuario u ON ht.id_usuario = u.id_usuario
LEFT JOIN dbo.Funcionario f ON u.id_funcionario = f.id_funcionario;
GO
PRINT '-> Vista dbo.vw_historial_tramites_detallado actualizada con actor y estado anterior.';
GO

-- ============================================================================
-- 14. PERMISOS DE SEGURIDAD RBAC EN BASE DE DATOS
-- ============================================================================
-- Asegurar que rol_analista_tramites tenga permisos en los nuevos SPs
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_analista_tramites')
BEGIN
    GRANT EXECUTE ON dbo.sp_generar_codigo_activacion TO rol_analista_tramites;
    GRANT EXECUTE ON dbo.sp_registrar_tramite TO rol_analista_tramites;
    GRANT EXECUTE ON dbo.sp_cambiar_estado_tramite TO rol_analista_tramites;
    GRANT EXECUTE ON dbo.sp_registrar_resolucion_tramite TO rol_analista_tramites;
END
GO

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_cajero')
BEGIN
    GRANT EXECUTE ON dbo.sp_cajero_aplicar_pago TO rol_cajero;
    GRANT EXECUTE ON dbo.sp_registrar_pago_municipal TO rol_cajero;
    GRANT EXECUTE ON dbo.sp_aplicar_pago_factura TO rol_cajero;
END
GO

PRINT '======================================================================';
PRINT 'Script 16 completado con éxito.';
PRINT '======================================================================';
GO

