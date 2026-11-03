-- Instalacion consolidada. Una definicion final por objeto; no ejecutar migraciones historicas.
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_contribuyente_fisico
    @cedula_identidad    VARCHAR(20),
    @nombre              VARCHAR(50),
    @apellido1_fisico    VARCHAR(50),
    @apellido2_fisico    VARCHAR(50),
    @fecha_nacimiento    DATETIME,
    @correo_electronico  VARCHAR(100),
    @telefono            VARCHAR(20),
    @direccion_notificaciones VARCHAR(255),
    @nuevo_id_contribuyente INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.Contribuyente_Fisico WHERE cedula_identidad = @cedula_identidad)
        BEGIN
            THROW 50001, 'Error: Ya existe una persona física registrada con dicha cédula de identidad.', 1;
        END

        INSERT INTO dbo.Contribuyente (correo_electronico, telefono, direccion_notificaciones, fecha_registro, estado_contribuyente)
        VALUES (@correo_electronico, @telefono, @direccion_notificaciones, GETDATE(), 1);

        SET @nuevo_id_contribuyente = SCOPE_IDENTITY();

        INSERT INTO dbo.Contribuyente_Fisico (cedula_identidad, nombre, apellido1_fisico, apellido2_fisico, fecha_nacimiento, id_contribuyente)
        VALUES (@cedula_identidad, @nombre, @apellido1_fisico, @apellido2_fisico, @fecha_nacimiento, @nuevo_id_contribuyente);

        COMMIT TRANSACTION;
        PRINT '-> Contribuyente físico registrado exitosamente con ID: ' + CAST(@nuevo_id_contribuyente AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_contribuyente_juridico
    @cedula_juridica     VARCHAR(20),
    @razon_social        VARCHAR(255),
    @nombre_fantasia     VARCHAR(150),
    @fecha_constitucion  DATETIME,
    @correo_electronico  VARCHAR(100),
    @telefono            VARCHAR(20),
    @direccion_notificaciones VARCHAR(255),
    @nuevo_id_contribuyente INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.Contribuyente_Juridico WHERE cedula_juridica = @cedula_juridica)
        BEGIN
            THROW 50002, 'Error: Ya existe una persona jurídica con dicha cédula jurídica.', 1;
        END

        INSERT INTO dbo.Contribuyente (correo_electronico, telefono, direccion_notificaciones, fecha_registro, estado_contribuyente)
        VALUES (@correo_electronico, @telefono, @direccion_notificaciones, GETDATE(), 1);

        SET @nuevo_id_contribuyente = SCOPE_IDENTITY();

        INSERT INTO dbo.Contribuyente_Juridico (cedula_juridica, razon_social, nombre_fantasia, fecha_constitucion, id_contribuyente)
        VALUES (@cedula_juridica, @razon_social, @nombre_fantasia, @fecha_constitucion, @nuevo_id_contribuyente);

        COMMIT TRANSACTION;
        PRINT '-> Contribuyente jurídico registrado exitosamente con ID: ' + CAST(@nuevo_id_contribuyente AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_contribuyente
    @criterio VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_padron_contribuyentes
    WHERE @criterio IS NULL
       OR identificacion_oficial LIKE '%' + @criterio + '%'
       OR nombre_o_razon_social LIKE '%' + @criterio + '%'
       OR correo_electronico LIKE '%' + @criterio + '%';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_contribuyente
    @id_contribuyente         INT,
    @correo_electronico       VARCHAR(100),
    @telefono                 VARCHAR(20),
    @direccion_notificaciones VARCHAR(255),
    @estado_contribuyente     BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Contribuyente WHERE id_contribuyente = @id_contribuyente)
            THROW 50027, N'Error: El contribuyente especificado no existe.', 1;

        UPDATE dbo.Contribuyente
        SET correo_electronico = @correo_electronico,
            telefono = @telefono,
            direccion_notificaciones = @direccion_notificaciones,
            estado_contribuyente = @estado_contribuyente
        WHERE id_contribuyente = @id_contribuyente;

        PRINT '-> Padrón de contribuyente actualizado correctamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_representante_legal
    @nombre_representante      VARCHAR(50),
    @apellido1_representante   VARCHAR(50),
    @apellido2_representante   VARCHAR(50),
    @tomo_folio_registro       VARCHAR(30),
    @cedula_representante      VARCHAR(20),
    @fecha_vencimiento_poder   DATETIME,
    @id_contribuyente_juridico INT = NULL,
    @id_contribuyente          INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @id_contribuyente_juridico IS NULL AND @id_contribuyente IS NOT NULL
            SELECT @id_contribuyente_juridico = id_contribuyente_juridico
            FROM dbo.Contribuyente_Juridico
            WHERE id_contribuyente = @id_contribuyente;

        IF @id_contribuyente_juridico IS NULL
           OR NOT EXISTS (SELECT 1 FROM dbo.Contribuyente_Juridico WHERE id_contribuyente_juridico = @id_contribuyente_juridico)
            THROW 50029, N'Error: No existe un contribuyente jurídico con el identificador indicado.', 1;

        INSERT INTO dbo.Representante_Legal
        (nombre_representante, apellido1_representante, apellido2_representante, tomo_folio_registro, cedula_representante, fecha_vencimiento_poder, id_contribuyente_juridico)
        VALUES
        (@nombre_representante, @apellido1_representante, @apellido2_representante, @tomo_folio_registro, @cedula_representante, @fecha_vencimiento_poder, @id_contribuyente_juridico);

        PRINT '-> Representante legal registrado exitosamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_inmueble
    @numero_finca         VARCHAR(30),
    @direccion_exacta     VARCHAR(255),
    @area_terreno_m2      FLOAT,
    @area_construccion_m2 FLOAT,
    @valor_fiscal         FLOAT,
    @plano_catastrado     VARCHAR(30),
    @id_tipo_uso_inmueble INT,
    @id_distrito          INT,
    @nuevo_id_inmueble    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Bien_Inmueble WHERE numero_finca = @numero_finca)
            THROW 50005, 'Error: El número de finca ya está catastrado.', 1;

        INSERT INTO dbo.Bien_Inmueble
        (numero_finca, direccion_exacta, area_terreno_m2, area_construccion_m2, valor_fiscal, plano_catastrado, id_tipo_uso_inmueble, id_distrito)
        VALUES
        (@numero_finca, @direccion_exacta, @area_terreno_m2, @area_construccion_m2, @valor_fiscal, @plano_catastrado, @id_tipo_uso_inmueble, @id_distrito);

        SET @nuevo_id_inmueble = SCOPE_IDENTITY();
        PRINT '-> Inmueble registrado con ID: ' + CAST(@nuevo_id_inmueble AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_inmueble
    @numero_finca VARCHAR(30) = NULL,
    @id_distrito  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        bi.*,
        d.nombre_distrito,
        tui.codigo_uso,
        tui.descripcion AS uso_suelo
    FROM dbo.Bien_Inmueble bi
    INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
    INNER JOIN dbo.Tipo_Uso_Inmueble tui ON bi.id_tipo_uso_inmueble = tui.id_tipo_uso_inmueble
    WHERE (@numero_finca IS NULL OR bi.numero_finca LIKE '%' + @numero_finca + '%')
      AND (@id_distrito IS NULL OR bi.id_distrito = @id_distrito);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_inmueble
    @id_inmueble          INT,
    @direccion_exacta     VARCHAR(255),
    @area_terreno_m2      FLOAT,
    @area_construccion_m2 FLOAT,
    @valor_fiscal         FLOAT,
    @plano_catastrado     VARCHAR(30),
    @id_tipo_uso_inmueble INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Bien_Inmueble WHERE id_inmueble = @id_inmueble)
            THROW 50028, N'Error: Inmueble no encontrado.', 1;

        UPDATE dbo.Bien_Inmueble
        SET direccion_exacta = @direccion_exacta,
            area_terreno_m2 = @area_terreno_m2,
            area_construccion_m2 = @area_construccion_m2,
            valor_fiscal = @valor_fiscal,
            plano_catastrado = @plano_catastrado,
            id_tipo_uso_inmueble = @id_tipo_uso_inmueble
        WHERE id_inmueble = @id_inmueble;

        PRINT '-> Inmueble actualizado exitosamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\18_proteger_asigacion_derechos.sql
CREATE OR ALTER PROCEDURE dbo.sp_asignar_derecho_inmueble
    @id_inmueble INT,
    @id_contribuyente INT,
    @porcentaje_participacion FLOAT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        IF @porcentaje_participacion IS NULL
           OR @porcentaje_participacion <= 0
           OR @porcentaje_participacion > 100
            THROW 50013, 'El porcentaje debe ser mayor que cero y no superar 100.', 1;

        BEGIN TRANSACTION;

        -- La fila de la finca actua como bloqueo comun, incluso sin derechos.
        DECLARE @finca INT;
        SELECT @finca = id_inmueble
        FROM dbo.Bien_Inmueble WITH (UPDLOCK, HOLDLOCK)
        WHERE id_inmueble = @id_inmueble;

        IF @finca IS NULL
            THROW 50007, 'El inmueble no existe.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.Contribuyente
            WHERE id_contribuyente = @id_contribuyente
        )
            THROW 50007, 'El contribuyente no existe.', 1;

        IF EXISTS (
            SELECT 1 FROM dbo.Derecho_Inmueble WITH (UPDLOCK, HOLDLOCK)
            WHERE id_inmueble = @id_inmueble
              AND id_contribuyente = @id_contribuyente
        )
            THROW 50007, 'El contribuyente ya tiene un derecho en esta finca. Debe actualizarlo mediante el flujo correspondiente.', 1;

        DECLARE @suma_actual FLOAT;
        SELECT @suma_actual = ISNULL(SUM(porcentaje_participacion), 0)
        FROM dbo.Derecho_Inmueble WITH (UPDLOCK, HOLDLOCK)
        WHERE id_inmueble = @id_inmueble;

        IF @suma_actual + @porcentaje_participacion > 100.0001
            THROW 50007, 'La suma de derechos para el inmueble excede el 100%.', 1;

        INSERT INTO dbo.Derecho_Inmueble
            (id_inmueble, id_contribuyente, porcentaje_participacion, fecha_adquisicion)
        VALUES
            (@id_inmueble, @id_contribuyente, @porcentaje_participacion, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_inmuebles_por_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_inmuebles_propietarios
    WHERE id_contribuyente = @id_contribuyente;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_distritos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_distrito, codigo_distrital, nombre_distrito
    FROM dbo.Distrito
    ORDER BY id_distrito;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_uso_inmueble
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_uso_inmueble, codigo_uso, descripcion
    FROM dbo.Tipo_Uso_Inmueble
    ORDER BY id_tipo_uso_inmueble;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tipo_tramite
    @nombre_tramite        VARCHAR(100),
    @descripcion_tipo      VARCHAR(255),
    @dias_resolucion_max   INT,
    @id_departamento       INT,
    @nuevo_id_tipo_tramite INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Tipo_Tramite WHERE nombre_tramite = @nombre_tramite)
            THROW 50043, N'Error: Ya existe un tipo de trámite con ese nombre.', 1;

        INSERT INTO dbo.Tipo_Tramite (nombre_tramite, descripcion_tipo, dias_resolucion_max, id_departamento)
        VALUES (@nombre_tramite, @descripcion_tipo, @dias_resolucion_max, @id_departamento);

        SET @nuevo_id_tipo_tramite = SCOPE_IDENTITY();
        PRINT '-> Tipo de trámite creado con ID: ' + CAST(@nuevo_id_tipo_tramite AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_tipo_tramite
    @id_tipo_tramite     INT,
    @nombre_tramite      VARCHAR(100),
    @descripcion_tipo    VARCHAR(255),
    @dias_resolucion_max INT,
    @id_departamento     INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Tipo_Tramite WHERE id_tipo_tramite = @id_tipo_tramite)
            THROW 50023, N'Error: El tipo de trámite especificado no existe.', 1;

        UPDATE dbo.Tipo_Tramite
        SET nombre_tramite = @nombre_tramite,
            descripcion_tipo = @descripcion_tipo,
            dias_resolucion_max = @dias_resolucion_max,
            id_departamento = @id_departamento
        WHERE id_tipo_tramite = @id_tipo_tramite;

        PRINT '-> Tipo de trámite actualizado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\22_integridad_y_reglas_inmueble.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_tramite
AS
BEGIN
 SET NOCOUNT ON;
 SELECT tt.id_tipo_tramite,tt.nombre_tramite,tt.descripcion_tipo,tt.dias_resolucion_max,
  tt.id_departamento,dep.nombre_departamento,c.requiere_inmueble
 FROM dbo.Tipo_Tramite tt
 JOIN dbo.Departamento dep ON dep.id_departamento=tt.id_departamento
 LEFT JOIN dbo.Configuracion_Inmueble_Tramite c ON c.id_tipo_tramite=tt.id_tipo_tramite;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_requisito
    @nombre_requisito   VARCHAR(255),
    @descripcion        VARCHAR(500),
    @es_obligatorio     BIT = 1,
    @nuevo_id_requisito INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO dbo.Requisito (nombre_requisito, descripcion, es_obligatorio)
        VALUES (@nombre_requisito, @descripcion, @es_obligatorio);

        SET @nuevo_id_requisito = SCOPE_IDENTITY();
        PRINT '-> Requisito creado con ID: ' + CAST(@nuevo_id_requisito AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_configurar_requisito_tramite
    @id_tipo_tramite INT,
    @id_requisito    INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tipo_Tramite_Requisito WHERE id_tipo_tramite = @id_tipo_tramite AND id_requisito = @id_requisito)
    BEGIN
        INSERT INTO dbo.Tipo_Tramite_Requisito (id_tipo_tramite, id_requisito)
        VALUES (@id_tipo_tramite, @id_requisito);
        PRINT '-> Requisito asociado al tipo de trámite.';
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_requisitos_por_tipo_tramite
    @id_tipo_tramite INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.id_requisito, r.nombre_requisito, r.descripcion, r.es_obligatorio
    FROM dbo.Tipo_Tramite_Requisito ttr
    INNER JOIN dbo.Requisito r ON ttr.id_requisito = r.id_requisito
    WHERE ttr.id_tipo_tramite = @id_tipo_tramite;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\22_integridad_y_reglas_inmueble.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tramite
    @numero_expediente   VARCHAR(30) = NULL OUTPUT,
    @id_tipo_tramite     INT,
    @id_usuario          INT,
    @id_inmueble         INT = NULL,
    @id_contribuyente    INT,
    @nuevo_id_tramite    INT OUTPUT,
    @observaciones_iniciales VARCHAR(255) = NULL
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
            VALUES (GETDATE(), COALESCE(NULLIF(LTRIM(RTRIM(@observaciones_iniciales)), ''), 'Radicación formal del expediente en ventanilla municipal.'), @nuevo_id_tramite, @id_estado_inicial, @id_usuario, NULL);
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

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tramite
    @numero_expediente VARCHAR(30) = NULL,
    @id_contribuyente INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_tramites_seguimiento
    WHERE (@numero_expediente IS NULL OR numero_expediente LIKE '%' + @numero_expediente + '%')
      AND (@id_contribuyente IS NULL OR id_contribuyente = @id_contribuyente);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_tramite
    @id_tramite   INT,
    @id_usuario   INT,
    @id_inmueble  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite)
            THROW 50024, N'Error: El trámite especificado no existe.', 1;

        UPDATE dbo.Tramite
        SET id_usuario = @id_usuario,
            id_inmueble = @id_inmueble
        WHERE id_tramite = @id_tramite;

        PRINT '-> Trámite actualizado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_requisito_presentado
    @id_tramite INT,
    @id_requisito INT,
    @nombre_archivo VARCHAR(255),
    @ruta_almacenamiento VARCHAR(255),
    @peso_bytes FLOAT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Archivo_Adjunto (nombre_original, ruta_almacenamiento, peso_bytes, fecha_subida, id_tramite, id_requisito)
    VALUES (@nombre_archivo, @ruta_almacenamiento, @peso_bytes, GETDATE(), @id_tramite, @id_requisito);
    PRINT '-> Requisito documental acreditado y guardado.';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_adjuntar_archivo_tramite
    @id_tramite INT,
    @nombre_original VARCHAR(255),
    @ruta_almacenamiento VARCHAR(255),
    @peso_bytes FLOAT,
    @id_requisito INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Archivo_Adjunto (nombre_original, ruta_almacenamiento, peso_bytes, fecha_subida, id_tramite, id_requisito)
    VALUES (@nombre_original, @ruta_almacenamiento, @peso_bytes, GETDATE(), @id_tramite, @id_requisito);
    PRINT '-> Archivo adjuntado al expediente.';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\20_cierre_formal_tramites.sql
CREATE OR ALTER PROCEDURE dbo.sp_cambiar_estado_tramite
    @id_tramite       INT,
    @codigo_estado    VARCHAR(20),
    @observaciones    VARCHAR(255),
    @id_usuario       INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @codigo_estado IN ('APR', 'RECH')
        THROW 50026, 'Use la resolucion formal para aprobar o rechazar y cerrar el expediente.', 1;
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
                INNER JOIN dbo.Requisito r ON r.id_requisito = ttr.id_requisito
                WHERE ttr.id_tipo_tramite = @id_tipo_tramite
                  AND r.es_obligatorio = 1
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

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_estados_tramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_estado, codigo, nombre_estado
    FROM dbo.Estado_Tramite
    ORDER BY id_estado;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_historial_tramite
    @id_tramite INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_historial_tramites_detallado
    WHERE id_tramite = @id_tramite
    ORDER BY fecha_cambio ASC, id_historial ASC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\20_cierre_formal_tramites.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_resolucion_tramite
 @id_tramite INT, @codigo_estado VARCHAR(20), @observaciones VARCHAR(255), @id_usuario INT=NULL
AS
BEGIN
 SET NOCOUNT ON;
 SET XACT_ABORT ON;
 BEGIN TRY
  IF @codigo_estado IS NULL OR @codigo_estado NOT IN ('APR','RECH')
   THROW 50026, 'La resolucion solo admite APR o RECH.', 1;
  IF NULLIF(LTRIM(RTRIM(@observaciones)),'') IS NULL
   THROW 50022, 'Debe fundamentar la resolucion.', 1;
  IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario=@id_usuario AND activo=1)
   THROW 50070, 'Se requiere un funcionario activo para resolver.', 1;
  BEGIN TRANSACTION;
  DECLARE @encontrado INT, @cierre DATETIME, @anterior INT, @destino INT;
  SELECT @encontrado=id_tramite, @cierre=fecha_resolucion_final
  FROM dbo.Tramite WITH (UPDLOCK,HOLDLOCK) WHERE id_tramite=@id_tramite;
  IF @encontrado IS NULL THROW 50024, 'El expediente no existe.', 1;
  IF @cierre IS NOT NULL THROW 50018, 'El expediente ya tiene resolucion final.', 1;
  SELECT @destino=id_estado FROM dbo.Estado_Tramite WHERE codigo=@codigo_estado;
  IF @destino IS NULL THROW 50008, 'El estado final no esta configurado.', 1;
  SELECT TOP (1) @anterior=id_estado_tramite FROM dbo.Historial_Tramite
  WHERE id_tramite=@id_tramite ORDER BY id_historial DESC;
  -- El trigger del script 19 exige cotejo de la ultima version de los requisitos.
  INSERT dbo.Historial_Tramite(fecha_cambio,observaciones,id_tramite,id_estado_tramite,id_usuario,id_estado_anterior)
  VALUES(GETDATE(),@observaciones,@id_tramite,@destino,@id_usuario,@anterior);
  UPDATE dbo.Tramite SET fecha_resolucion_final=GETDATE() WHERE id_tramite=@id_tramite;
  COMMIT;
 END TRY
 BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tramites_por_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_tramites_seguimiento
    WHERE id_contribuyente = @id_contribuyente;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_tributo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_tributo, codigo_tributo, nombre_tributo, base_calculo, tarifa, monto_fijo, periodicidad
    FROM dbo.Tipo_Tributo;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_deuda_municipal
    @periodo_deuda       VARCHAR(150),
    @monto_principal     FLOAT,
    @monto_intereses     FLOAT = 0,
    @monto_multas        FLOAT = 0,
    @fecha_de_vencimiento DATETIME,
    @id_inmueble         INT,
    @id_tipo_tributo     INT,
    @codigo_estado_deuda VARCHAR(20) = 'PEND',
    @nuevo_id_deuda      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda = @codigo_estado_deuda;

        IF @id_estado IS NULL
            THROW 50009, 'Error: Código de estado de deuda no válido.', 1;

        INSERT INTO dbo.Deudas_Municipales
        (periodo_deuda, monto_principal, monto_intereses, monto_multas, fecha_de_vencimiento, id_inmueble, id_tipo_tributo, id_estado_deuda)
        VALUES
        (@periodo_deuda, @monto_principal, @monto_intereses, @monto_multas, @fecha_de_vencimiento, @id_inmueble, @id_tipo_tributo, @id_estado);

        SET @nuevo_id_deuda = SCOPE_IDENTITY();
        PRINT '-> Deuda municipal liquidada con ID: ' + CAST(@nuevo_id_deuda AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_deudas_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        c.id_contribuyente,
        bi.numero_finca,
        dm.id_deuda_municipal,
        dm.periodo_deuda,
        tt.nombre_tributo,
        dm.monto_principal,
        dm.monto_intereses,
        dm.monto_multas,
        dbo.fn_calcular_total_deuda(dm.id_deuda_municipal) AS monto_total,
        dm.fecha_de_vencimiento,
        ed.codigo_estado_deuda,
        ed.descripcion_estado_deuda
    FROM dbo.Contribuyente c
    INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
    INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Deudas_Municipales dm ON bi.id_inmueble = dm.id_inmueble
    INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
    INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    WHERE c.id_contribuyente = @id_contribuyente;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_estado_deuda
    @id_deuda_municipal  INT,
    @codigo_estado_deuda VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda = @codigo_estado_deuda;

        IF @id_estado IS NULL
            THROW 50010, 'Error: Estado de deuda no encontrado.', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.Deudas_Municipales WHERE id_deuda_municipal = @id_deuda_municipal)
            THROW 50025, N'Error: La deuda municipal especificada no existe.', 1;

        UPDATE dbo.Deudas_Municipales
        SET id_estado_deuda = @id_estado
        WHERE id_deuda_municipal = @id_deuda_municipal;

        PRINT '-> Estado de deuda actualizado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_generar_factura
    @id_deuda_municipal INT,
    @clave_numerica_hacienda VARCHAR(50),
    @descuentos FLOAT = 0,
    @nuevo_id_factura INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @subtotal FLOAT;
        SELECT @subtotal = dbo.fn_calcular_total_deuda(@id_deuda_municipal);

        DECLARE @total_a_pagar FLOAT = @subtotal - @descuentos;
        IF @total_a_pagar < 0 SET @total_a_pagar = 0;

        INSERT INTO dbo.Factura 
        (clave_numerica_hacienda, fecha_emision, subtotal, descuentos, total_a_pagar, saldo_pendiente, estado_factura, id_deuda_municipal)
        VALUES 
        (@clave_numerica_hacienda, GETDATE(), @subtotal, @descuentos, @total_a_pagar, @total_a_pagar, 'Pendiente', @id_deuda_municipal);

        SET @nuevo_id_factura = SCOPE_IDENTITY();
        PRINT '-> Factura emitida con ID: ' + CAST(@nuevo_id_factura AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_factura
    @clave_numerica_hacienda VARCHAR(50) = NULL,
    @id_factura INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT f.*, dm.periodo_deuda, bi.numero_finca
    FROM dbo.Factura f
    INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
    INNER JOIN dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
    WHERE (@id_factura IS NULL OR f.id_factura = @id_factura)
      AND (@clave_numerica_hacienda IS NULL OR f.clave_numerica_hacienda = @clave_numerica_hacienda);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_facturas_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        f.id_factura,
        f.clave_numerica_hacienda,
        f.fecha_emision,
        f.subtotal,
        f.descuentos,
        f.total_a_pagar,
        f.saldo_pendiente,
        f.estado_factura,
        dm.periodo_deuda,
        bi.numero_finca
    FROM dbo.Contribuyente c
    INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
    INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Deudas_Municipales dm ON bi.id_inmueble = dm.id_inmueble
    INNER JOIN dbo.Factura f ON dm.id_deuda_municipal = f.id_deuda_municipal
    WHERE c.id_contribuyente = @id_contribuyente;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_medios_pago
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_medio_pago, nombre_medio_pago
    FROM dbo.Medio_Pago;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_pago_municipal
    @monto_total_pagado FLOAT,
    @comprobante        VARCHAR(50),
    @id_medio_pago      INT,
    @id_contribuyente   INT,
    @nuevo_id_pago      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Pago_Municipal WHERE comprobante = @comprobante)
            THROW 50011, 'Error: Ya existe un recibo/comprobante con dicha referencia bancaria.', 1;

        INSERT INTO dbo.Pago_Municipal (monto_total_pagado, fecha_pago, comprobante, id_medio_pago, id_contribuyente)
        VALUES (@monto_total_pagado, GETDATE(), @comprobante, @id_medio_pago, @id_contribuyente);

        SET @nuevo_id_pago = SCOPE_IDENTITY();
        PRINT '-> Pago municipal recibido exitosamente con ID: ' + CAST(@nuevo_id_pago AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_aplicar_pago_factura
    @id_pago_municipal   INT,
    @id_factura          INT,
    @monto_principal     FLOAT,
    @monto_interes       FLOAT = 0,
    @monto_recargo       FLOAT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.Detalle_Factura
        (id_factura, id_pago_municipal, monto_aplicado_principal, monto_aplicado_interes, monto_aplicado_recargo)
        VALUES
        (@id_factura, @id_pago_municipal, @monto_principal, @monto_interes, @monto_recargo);

        COMMIT TRANSACTION;
        PRINT '-> Pago aplicado a la factura en Detalle_Factura con éxito.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_calcular_recargos_intereses
    @id_deuda_municipal INT,
    @tasa_interes_mensual FLOAT = 0.015 -- 1.5% mensual según Código de Normas y Procedimientos Tributarios
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @dias INT = dbo.fn_calcular_dias_mora(@id_deuda_municipal);
        DECLARE @principal FLOAT;

        SELECT @principal = monto_principal FROM dbo.Deudas_Municipales WHERE id_deuda_municipal = @id_deuda_municipal;

        IF @dias > 0
        BEGIN
            DECLARE @intereses FLOAT = @principal * (@tasa_interes_mensual / 30.0) * @dias;
            DECLARE @multa FLOAT = @principal * 0.05; -- 5% recargo administrativo

            UPDATE dbo.Deudas_Municipales
            SET monto_intereses = ROUND(@intereses, 2),
                monto_multas = ROUND(@multa, 2)
            WHERE id_deuda_municipal = @id_deuda_municipal;

            PRINT '-> Intereses y recargos recalculados exitosamente.';
        END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_estado_cuenta
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_estado_cuenta_contribuyente
    WHERE id_contribuyente = @id_contribuyente;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_usuario
    @user_name         VARCHAR(50),
    @password_hash     VARCHAR(255),
    @nombre_usuario    VARCHAR(50),
    @apellido1_usuario VARCHAR(50),
    @apellido2_usuario VARCHAR(50),
    @email_usuario     VARCHAR(100),
    @id_departamento   INT,
    @nuevo_id_usuario  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Usuario WHERE user_name = @user_name OR email_usuario = @email_usuario)
            THROW 50012, 'Error: Ya existe un usuario con dicho nombre de usuario o correo corporativo.', 1;

        INSERT INTO dbo.Usuario (user_name, password_hash, nombre_usuario, apellido1_usuario, apellido2_usuario, email_usuario, activo, id_departamento)
        VALUES (@user_name, @password_hash, @nombre_usuario, @apellido1_usuario, @apellido2_usuario, @email_usuario, 1, @id_departamento);

        SET @nuevo_id_usuario = SCOPE_IDENTITY();
        PRINT '-> Usuario creado con ID: ' + CAST(@nuevo_id_usuario AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_usuario
    @user_name VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.id_usuario, u.user_name, u.nombre_usuario, u.apellido1_usuario, u.apellido2_usuario, u.email_usuario, u.activo, dep.nombre_departamento
    FROM dbo.Usuario u
    INNER JOIN dbo.Departamento dep ON u.id_departamento = dep.id_departamento
    WHERE (@user_name IS NULL OR u.user_name LIKE '%' + @user_name + '%');
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_usuario
    @id_usuario        INT,
    @nombre_usuario    VARCHAR(50),
    @apellido1_usuario VARCHAR(50),
    @apellido2_usuario VARCHAR(50),
    @email_usuario     VARCHAR(100),
    @id_departamento   INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario)
            THROW 50021, N'Error: El usuario especificado no existe.', 1;

        UPDATE dbo.Usuario
        SET nombre_usuario = @nombre_usuario,
            apellido1_usuario = @apellido1_usuario,
            apellido2_usuario = @apellido2_usuario,
            email_usuario = @email_usuario,
            id_departamento = @id_departamento
        WHERE id_usuario = @id_usuario;

        PRINT '-> Usuario actualizado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_cambiar_estado_usuario
    @id_usuario INT,
    @activo     BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario)
            THROW 50022, N'Error: El usuario especificado no existe.', 1;

        UPDATE dbo.Usuario
        SET activo = @activo
        WHERE id_usuario = @id_usuario;

        PRINT '-> Estado de cuenta de usuario modificado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_rol
    @nombre_rol    VARCHAR(50),
    @nuevo_id_rol  INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Rol WHERE nombre_rol = @nombre_rol)
            THROW 50041, N'Error: Ya existe un rol con ese nombre.', 1;

        INSERT INTO dbo.Rol (nombre_rol) VALUES (@nombre_rol);
        SET @nuevo_id_rol = SCOPE_IDENTITY();
        PRINT '-> Rol registrado con ID: ' + CAST(@nuevo_id_rol AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_permiso
    @modulo            VARCHAR(50),
    @accion            VARCHAR(20),
    @nuevo_id_permiso  INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Permiso WHERE modulo = @modulo AND accion = @accion)
            THROW 50042, N'Error: Ya existe ese permiso (módulo + acción).', 1;

        INSERT INTO dbo.Permiso (modulo, accion) VALUES (@modulo, @accion);
        SET @nuevo_id_permiso = SCOPE_IDENTITY();
        PRINT '-> Permiso registrado con ID: ' + CAST(@nuevo_id_permiso AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_asignar_rol_usuario
    @id_usuario INT,
    @id_rol     INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Rol_Usuario WHERE id_usuario = @id_usuario AND id_rol = @id_rol)
    BEGIN
        INSERT INTO dbo.Rol_Usuario (id_usuario, id_rol) VALUES (@id_usuario, @id_rol);
        PRINT '-> Rol asignado a usuario.';
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_asignar_permiso_rol
    @id_rol     INT,
    @id_permiso INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Rol_Permiso WHERE id_rol = @id_rol AND id_permiso = @id_permiso)
    BEGIN
        INSERT INTO dbo.Rol_Permiso (id_rol, id_permiso) VALUES (@id_rol, @id_permiso);
        PRINT '-> Permiso concedido a rol.';
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_roles_permisos_usuario
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_usuarios_roles_permisos
    WHERE id_usuario = @id_usuario;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tipo_accion_auditoria
    @codigo VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tipo_Accion_Auditoria WHERE codigo = @codigo)
    BEGIN
        INSERT INTO dbo.Tipo_Accion_Auditoria (codigo) VALUES (@codigo);
        PRINT '-> Tipo de acción de auditoría registrado.';
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_registrar_auditoria
    @tabla_afectada      VARCHAR(50),
    @id_registro_afectado VARCHAR(50),
    @valores_anteriores  VARCHAR(MAX),
    @valores_nuevos      VARCHAR(MAX),
    @direccion_ip        VARCHAR(45),
    @id_usuario          INT = NULL,
    @codigo_accion       VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id_tipo INT;
    SELECT @id_tipo = id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = @codigo_accion;

    IF @id_tipo IS NOT NULL
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria
        (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        VALUES
        (@tabla_afectada, @id_registro_afectado, @valores_anteriores, @valores_nuevos, @direccion_ip, GETDATE(), @id_usuario, @id_tipo);
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_auditoria
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 500 *
    FROM dbo.vw_auditoria_detallada
    ORDER BY fecha_hora DESC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_filtrar_auditoria
    @tabla_afectada VARCHAR(50) = NULL,
    @id_usuario INT = NULL,
    @fecha_inicio DATETIME = NULL,
    @fecha_fin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_auditoria_detallada
    WHERE (@tabla_afectada IS NULL OR tabla_afectada = @tabla_afectada)
      AND (@id_usuario IS NULL OR id_usuario = @id_usuario)
      AND (@fecha_inicio IS NULL OR fecha_hora >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR fecha_hora <= @fecha_fin)
    ORDER BY fecha_hora DESC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_auditoria_registro
    @tabla_afectada VARCHAR(50),
    @id_registro_afectado VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_auditoria_detallada
    WHERE tabla_afectada = @tabla_afectada
      AND id_registro_afectado = @id_registro_afectado
    ORDER BY fecha_hora DESC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_reporte_historial_tramites_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.identificacion_oficial,
        p.nombre_o_razon_social,
        t.numero_expediente,
        tt.nombre_tramite,
        t.fecha_radicacion,
        t.fecha_resolucion_final,
        ht.fecha_cambio,
        et.nombre_estado,
        ht.observaciones
    FROM dbo.Contribuyente c
    INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
    INNER JOIN dbo.Tramite t ON c.id_contribuyente = t.id_contribuyente
    INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    INNER JOIN dbo.Historial_Tramite ht ON t.id_tramite = ht.id_tramite
    INNER JOIN dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado
    WHERE c.id_contribuyente = @id_contribuyente
    ORDER BY t.numero_expediente, ht.fecha_cambio ASC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_reporte_recaudacion_tributo
    @fecha_inicio DATETIME = NULL,
    @fecha_fin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        tt.codigo_tributo,
        tt.nombre_tributo,
        COUNT(DISTINCT df.id_detalle_factura) AS recibos_emitidos,
        SUM(df.monto_aplicado_principal) AS subtotal_principal,
        SUM(df.monto_aplicado_interes) AS subtotal_intereses,
        SUM(df.monto_aplicado_recargo) AS subtotal_recargos,
        SUM(df.monto_aplicado_principal + df.monto_aplicado_interes + df.monto_aplicado_recargo) AS gran_total_recaudado
    FROM dbo.Detalle_Factura df
    INNER JOIN dbo.Pago_Municipal pm ON df.id_pago_municipal = pm.id_pago_municipal
    INNER JOIN dbo.Factura f ON df.id_factura = f.id_factura
    INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
    INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
    WHERE (@fecha_inicio IS NULL OR pm.fecha_pago >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR pm.fecha_pago <= @fecha_fin)
    GROUP BY tt.codigo_tributo, tt.nombre_tributo;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_reporte_recaudacion_distrito
    @fecha_inicio DATETIME = NULL,
    @fecha_fin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        d.codigo_distrital,
        d.nombre_distrito,
        COUNT(DISTINCT df.id_detalle_factura) AS pagos_recibidos,
        SUM(df.monto_aplicado_principal) AS recaudado_principal,
        SUM(df.monto_aplicado_interes) AS recaudado_intereses,
        SUM(df.monto_aplicado_recargo) AS recaudado_recargos,
        SUM(df.monto_aplicado_principal + df.monto_aplicado_interes + df.monto_aplicado_recargo) AS total_distrito
    FROM dbo.Detalle_Factura df
    INNER JOIN dbo.Pago_Municipal pm ON df.id_pago_municipal = pm.id_pago_municipal
    INNER JOIN dbo.Factura f ON df.id_factura = f.id_factura
    INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
    INNER JOIN dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
    WHERE (@fecha_inicio IS NULL OR pm.fecha_pago >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR pm.fecha_pago <= @fecha_fin)
    GROUP BY d.codigo_distrital, d.nombre_distrito;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_reporte_contribuyentes_morosos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        identificacion_oficial,
        nombre_o_razon_social,
        telefono,
        correo_electronico,
        COUNT(DISTINCT id_deuda_municipal) AS facturas_pendientes,
        SUM(deuda_total) AS deuda_acumulada_total,
        MAX(dias_mora) AS maximos_dias_morosidad
    FROM dbo.vw_morosidad_contribuyentes
    GROUP BY identificacion_oficial, nombre_o_razon_social, telefono, correo_electronico
    ORDER BY deuda_acumulada_total DESC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_reporte_solicitudes_departamento
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        dep.codigo_interno,
        dep.nombre_departamento,
        COUNT(t.id_tramite) AS total_solicitudes_recibidas,
        SUM(CASE WHEN t.fecha_resolucion_final IS NOT NULL THEN 1 ELSE 0 END) AS total_resueltas,
        SUM(CASE WHEN t.fecha_resolucion_final IS NULL THEN 1 ELSE 0 END) AS total_en_tramite
    FROM dbo.Departamento dep
    INNER JOIN dbo.Tipo_Tramite tt ON dep.id_departamento = tt.id_departamento
    LEFT JOIN dbo.Tramite t ON tt.id_tipo_tramite = t.id_tipo_tramite
    GROUP BY dep.codigo_interno, dep.nombre_departamento;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_reporte_eficiencia_tramites
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        tt.nombre_tramite,
        tt.dias_resolucion_max AS sla_comprometido,
        COUNT(t.id_tramite) AS volumen_tramites,
        AVG(dbo.fn_dias_transcurridos_tramite(t.id_tramite)) AS promedio_dias_resolucion,
        SUM(CASE WHEN dbo.fn_tramite_fuera_plazo(t.id_tramite) = 1 THEN 1 ELSE 0 END) AS total_fuera_plazo,
        ROUND((SUM(CASE WHEN dbo.fn_tramite_fuera_plazo(t.id_tramite) = 0 THEN 1 ELSE 0 END) * 100.0) / COUNT(t.id_tramite), 2) AS tasa_exito_sla_porcentaje
    FROM dbo.Tipo_Tramite tt
    INNER JOIN dbo.Tramite t ON tt.id_tipo_tramite = t.id_tipo_tramite
    GROUP BY tt.nombre_tramite, tt.dias_resolucion_max;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\05_Procedimientos_Operacionales.sql
CREATE OR ALTER PROCEDURE dbo.sp_reporte_gestion_municipal
    @tipo_reporte VARCHAR(50),
    @filtro_texto VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @tipo_reporte = 'PADRON'
        EXEC dbo.sp_consultar_contribuyente @criterio = @filtro_texto;
    ELSE IF @tipo_reporte = 'INMUEBLES'
        EXEC dbo.sp_consultar_inmueble @numero_finca = @filtro_texto;
    ELSE IF @tipo_reporte = 'MOROSOS'
        EXEC dbo.sp_reporte_contribuyentes_morosos;
    ELSE IF @tipo_reporte = 'AUDITORIA'
        EXEC dbo.sp_consultar_auditoria;
    ELSE
        PRINT 'Tipo de reporte parametrizado no reconocido.';
END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_tiempo
@anio_inicio INT=2025, @anio_fin INT=2028
AS
BEGIN
 SET NOCOUNT ON;

 IF @anio_inicio < 1900 OR @anio_fin > 2100 OR @anio_inicio > @anio_fin
  THROW 50022,N'Rango de calendario inválido (1900 a 2100).',1;
 SET LANGUAGE Spanish;
 SET DATEFIRST 1;
 DECLARE @fecha DATE=DATEFROMPARTS(@anio_inicio,1,1), @limite DATE=DATEFROMPARTS(@anio_fin,12,31);
 WHILE @fecha<=@limite
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM dbo.DIM_TIEMPO WHERE fecha=@fecha)
   INSERT dbo.DIM_TIEMPO(fecha,anio,trimestre,mes,nombre_mes,dia,dia_semana,nombre_dia,es_fin_semana)
   VALUES(@fecha,YEAR(@fecha),DATEPART(QUARTER,@fecha),MONTH(@fecha),DATENAME(MONTH,@fecha),DAY(@fecha),
    DATEPART(WEEKDAY,@fecha),DATENAME(WEEKDAY,@fecha),CASE WHEN DATEPART(WEEKDAY,@fecha)>=6 THEN 1 ELSE 0 END);
  SET @fecha=DATEADD(DAY,1,@fecha);
 END;
 UPDATE dbo.DIM_TIEMPO SET nombre_mes=DATENAME(MONTH,fecha),nombre_dia=DATENAME(WEEKDAY,fecha),
  dia_semana=DATEPART(WEEKDAY,fecha),es_fin_semana=CASE WHEN DATEPART(WEEKDAY,fecha)>=6 THEN 1 ELSE 0 END
 WHERE anio BETWEEN @anio_inicio AND @anio_fin;

END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_ubicacion

AS
BEGIN
 SET NOCOUNT ON;

 UPDATE du SET distrito=d.nombre_distrito
 FROM dbo.DIM_UBICACION du JOIN MunicipalidadNicoya2026.dbo.Distrito d ON d.id_distrito=du.id_distrito_origen;
 INSERT dbo.DIM_UBICACION(id_distrito_origen,distrito,zona_rural_urbana)
 SELECT d.id_distrito,d.nombre_distrito,'Pendiente' FROM MunicipalidadNicoya2026.dbo.Distrito d
 WHERE NOT EXISTS(SELECT 1 FROM dbo.DIM_UBICACION du WHERE du.id_distrito_origen=d.id_distrito);

END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_tributo

AS
BEGIN
 SET NOCOUNT ON;

 UPDATE dt SET codigo_tributo=t.codigo_tributo,nombre_tributo=t.nombre_tributo,periodicidad=t.periodicidad
 FROM dbo.DIM_TRIBUTO dt JOIN MunicipalidadNicoya2026.dbo.Tipo_Tributo t ON t.id_tipo_tributo=dt.id_tipo_tributo_origen;
 INSERT dbo.DIM_TRIBUTO(id_tipo_tributo_origen,codigo_tributo,nombre_tributo,categoria_tributo,periodicidad)
 SELECT t.id_tipo_tributo,t.codigo_tributo,t.nombre_tributo,'Pendiente',t.periodicidad
 FROM MunicipalidadNicoya2026.dbo.Tipo_Tributo t
 WHERE NOT EXISTS(SELECT 1 FROM dbo.DIM_TRIBUTO dt WHERE dt.id_tipo_tributo_origen=t.id_tipo_tributo);

END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_departamento

AS
BEGIN
 SET NOCOUNT ON;

 -- codigo_interno del DW original es INT; mantiene la clave técnica de origen,
 -- sin convertir el código textual operacional ni alterar el esquema aprobado.
 UPDATE dd SET nombre_departamento=d.nombre_departamento,codigo_interno=d.id_departamento
 FROM dbo.DIM_DEPARTAMENTO dd JOIN MunicipalidadNicoya2026.dbo.Departamento d ON d.id_departamento=dd.id_departamento_origen;
 INSERT dbo.DIM_DEPARTAMENTO(id_departamento_origen,nombre_departamento,codigo_interno)
 SELECT d.id_departamento,d.nombre_departamento,d.id_departamento FROM MunicipalidadNicoya2026.dbo.Departamento d
 WHERE NOT EXISTS(SELECT 1 FROM dbo.DIM_DEPARTAMENTO dd WHERE dd.id_departamento_origen=d.id_departamento);

END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_tramite

AS
BEGIN
 SET NOCOUNT ON;

 UPDATE dt SET nombre_tramite=t.nombre_tramite,departamento_responsable=d.nombre_departamento,
  plazo_dias_resolucion=t.dias_resolucion_max
 FROM dbo.DIM_TRAMITE dt JOIN MunicipalidadNicoya2026.dbo.Tipo_Tramite t ON t.id_tipo_tramite=dt.id_tipo_tramite_origen
 JOIN MunicipalidadNicoya2026.dbo.Departamento d ON d.id_departamento=t.id_departamento;
 INSERT dbo.DIM_TRAMITE(id_tipo_tramite_origen,nombre_tramite,departamento_responsable,plazo_dias_resolucion)
 SELECT t.id_tipo_tramite,t.nombre_tramite,d.nombre_departamento,t.dias_resolucion_max
 FROM MunicipalidadNicoya2026.dbo.Tipo_Tramite t JOIN MunicipalidadNicoya2026.dbo.Departamento d ON d.id_departamento=t.id_departamento
 WHERE NOT EXISTS(SELECT 1 FROM dbo.DIM_TRAMITE dt WHERE dt.id_tipo_tramite_origen=t.id_tipo_tramite);

END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_contribuyente

AS
BEGIN
 SET NOCOUNT ON;

 IF EXISTS(SELECT 1 FROM MunicipalidadNicoya2026.dbo.Contribuyente c
  WHERE (CASE WHEN EXISTS(SELECT 1 FROM MunicipalidadNicoya2026.dbo.Contribuyente_Fisico f WHERE f.id_contribuyente=c.id_contribuyente) THEN 1 ELSE 0 END
       + CASE WHEN EXISTS(SELECT 1 FROM MunicipalidadNicoya2026.dbo.Contribuyente_Juridico j WHERE j.id_contribuyente=c.id_contribuyente) THEN 1 ELSE 0 END)<>1)
  THROW 50022,N'Hay contribuyentes sin subtipo o con ambos subtipos. Corrija el padrón antes de cargar.',1;
 UPDATE dc SET tipo_persona=CASE WHEN EXISTS(SELECT 1 FROM MunicipalidadNicoya2026.dbo.Contribuyente_Fisico f
   WHERE f.id_contribuyente=c.id_contribuyente) THEN 'Física' ELSE 'Jurídica' END,fecha_registro=CAST(c.fecha_registro AS DATE)
 FROM dbo.DIM_CONTRIBUYENTE dc JOIN MunicipalidadNicoya2026.dbo.Contribuyente c ON c.id_contribuyente=dc.id_contribuyente_origen;
 INSERT dbo.DIM_CONTRIBUYENTE(id_contribuyente_origen,tipo_persona,distrito_residencia,fecha_registro)
 SELECT c.id_contribuyente,CASE WHEN EXISTS(SELECT 1 FROM MunicipalidadNicoya2026.dbo.Contribuyente_Fisico f
  WHERE f.id_contribuyente=c.id_contribuyente) THEN 'Física' ELSE 'Jurídica' END,NULL,CAST(c.fecha_registro AS DATE)
 FROM MunicipalidadNicoya2026.dbo.Contribuyente c
 WHERE NOT EXISTS(SELECT 1 FROM dbo.DIM_CONTRIBUYENTE dc WHERE dc.id_contribuyente_origen=c.id_contribuyente);

END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_fact_recaudacion

AS
BEGIN
 SET NOCOUNT ON;

 TRUNCATE TABLE dbo.FACT_RECAUDACION;
 ;WITH Rec AS (
 SELECT df.id_detalle_factura,df.id_factura,CAST(pm.fecha_pago AS DATE) fecha,
 pm.id_contribuyente,bi.id_distrito,dm.id_tipo_tributo,
 CAST(COALESCE(df.monto_aplicado_principal,0) AS DECIMAL(18,2)) principal,
 CAST(COALESCE(df.monto_aplicado_interes,0) AS DECIMAL(18,2))
  +CAST(COALESCE(df.monto_aplicado_recargo,0) AS DECIMAL(18,2)) intereses,
 CAST(COALESCE(f.descuentos,0) AS DECIMAL(18,2)) descuento,
 ROW_NUMBER() OVER(PARTITION BY f.id_factura ORDER BY pm.fecha_pago,df.id_detalle_factura) primera_aplicacion
 FROM MunicipalidadNicoya2026.dbo.Detalle_Factura df
 JOIN MunicipalidadNicoya2026.dbo.Pago_Municipal pm ON pm.id_pago_municipal=df.id_pago_municipal
 JOIN MunicipalidadNicoya2026.dbo.Factura f ON f.id_factura=df.id_factura
 JOIN MunicipalidadNicoya2026.dbo.Deudas_Municipales dm ON dm.id_deuda_municipal=f.id_deuda_municipal
 JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON bi.id_inmueble=dm.id_inmueble
 WHERE UPPER(COALESCE(f.estado_factura,''))<>'ANULADA'
)
 INSERT dbo.FACT_RECAUDACION(id_tiempo,id_contribuyente_dw,id_ubicacion_dw,id_tributo_dw,monto_recaudado,monto_intereses,monto_descuento)
 SELECT dt.id_tiempo,dc.id_contribuyente_dw,du.id_ubicacion_dw,tr.id_tributo_dw,
 SUM(r.principal),SUM(r.intereses),SUM(CASE WHEN r.primera_aplicacion=1 THEN r.descuento ELSE 0 END)
 FROM Rec r JOIN dbo.DIM_TIEMPO dt ON dt.fecha=r.fecha
 JOIN dbo.DIM_CONTRIBUYENTE dc ON dc.id_contribuyente_origen=r.id_contribuyente
 JOIN dbo.DIM_UBICACION du ON du.id_distrito_origen=r.id_distrito
 JOIN dbo.DIM_TRIBUTO tr ON tr.id_tipo_tributo_origen=r.id_tipo_tributo
 GROUP BY dt.id_tiempo,dc.id_contribuyente_dw,du.id_ubicacion_dw,tr.id_tributo_dw;

END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_fact_morosidad

AS
BEGIN
 SET NOCOUNT ON;

 DECLARE @hoy INT=(SELECT id_tiempo FROM dbo.DIM_TIEMPO WHERE fecha=CAST(GETDATE() AS DATE));
 IF @hoy IS NULL THROW 50022,N'Falta la fecha actual en DIM_TIEMPO.',1;
 TRUNCATE TABLE dbo.FACT_MOROSIDAD;
 ;WITH Aplicado AS (
 SELECT f.id_deuda_municipal,SUM(CAST(COALESCE(df.monto_aplicado_principal,0) AS DECIMAL(18,2))
  +CAST(COALESCE(df.monto_aplicado_interes,0) AS DECIMAL(18,2))
  +CAST(COALESCE(df.monto_aplicado_recargo,0) AS DECIMAL(18,2))) pagado
 FROM MunicipalidadNicoya2026.dbo.Factura f
 JOIN MunicipalidadNicoya2026.dbo.Detalle_Factura df ON df.id_factura=f.id_factura
 WHERE UPPER(COALESCE(f.estado_factura,''))<>'ANULADA'
 GROUP BY f.id_deuda_municipal
), DescuentoDeuda AS (
 SELECT id_deuda_municipal,SUM(CAST(COALESCE(descuentos,0) AS DECIMAL(18,2))) descuento
 FROM MunicipalidadNicoya2026.dbo.Factura WHERE UPPER(COALESCE(estado_factura,''))<>'ANULADA'
 GROUP BY id_deuda_municipal
), Deuda AS (
 SELECT dm.id_deuda_municipal,dm.id_inmueble,bi.id_distrito,dm.id_tipo_tributo,
 CAST(COALESCE(dm.monto_principal,0) AS DECIMAL(18,2))
 +CAST(COALESCE(dm.monto_intereses,0) AS DECIMAL(18,2))
 +CAST(COALESCE(dm.monto_multas,0) AS DECIMAL(18,2))-COALESCE(a.pagado,0)-COALESCE(dd.descuento,0) saldo
 FROM MunicipalidadNicoya2026.dbo.Deudas_Municipales dm
 JOIN MunicipalidadNicoya2026.dbo.Estado_Deuda ed ON ed.id_estado_deuda=dm.id_estado_deuda
 JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON bi.id_inmueble=dm.id_inmueble
 LEFT JOIN Aplicado a ON a.id_deuda_municipal=dm.id_deuda_municipal
 LEFT JOIN DescuentoDeuda dd ON dd.id_deuda_municipal=dm.id_deuda_municipal
 WHERE ed.codigo_estado_deuda IN('PEND','VENC') AND dm.fecha_de_vencimiento<CAST(GETDATE() AS DATE)
), Vencida AS (SELECT * FROM Deuda WHERE saldo>0)
, Totales AS (
 SELECT id_distrito,id_tipo_tributo,SUM(saldo) saldo FROM Vencida GROUP BY id_distrito,id_tipo_tributo
 ), Personas AS (
 SELECT v.id_distrito,v.id_tipo_tributo,COUNT(DISTINCT di.id_contribuyente) personas
 FROM Vencida v JOIN MunicipalidadNicoya2026.dbo.Derecho_Inmueble di ON di.id_inmueble=v.id_inmueble
 GROUP BY v.id_distrito,v.id_tipo_tributo
 )
 INSERT dbo.FACT_MOROSIDAD(id_tiempo,id_ubicacion_dw,id_tributo_dw,saldo_vencido,cantidad_contribuyentes_morosos)
 SELECT @hoy,u.id_ubicacion_dw,tr.id_tributo_dw,t.saldo,COALESCE(p.personas,0)
 FROM Totales t JOIN dbo.DIM_UBICACION u ON u.id_distrito_origen=t.id_distrito
 JOIN dbo.DIM_TRIBUTO tr ON tr.id_tipo_tributo_origen=t.id_tipo_tributo
 LEFT JOIN Personas p ON p.id_distrito=t.id_distrito AND p.id_tipo_tributo=t.id_tipo_tributo;

END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_fact_eficiencia_tramites

AS
BEGIN
 SET NOCOUNT ON;

 TRUNCATE TABLE dbo.FACT_EFICIENCIA_TRAMITES;
 ;WITH Cierre AS (
 SELECT t.id_tramite,t.id_tipo_tramite,tt.id_departamento,
 CAST(t.fecha_resolucion_final AS DATE) fecha,
 DATEDIFF(DAY,t.fecha_radicacion,t.fecha_resolucion_final) dias,et.codigo,
 CASE et.codigo WHEN 'APR' THEN 'Aprobado' WHEN 'RECH' THEN 'Rechazado' END estado
 FROM MunicipalidadNicoya2026.dbo.Tramite t
 JOIN MunicipalidadNicoya2026.dbo.Tipo_Tramite tt ON tt.id_tipo_tramite=t.id_tipo_tramite
 CROSS APPLY(SELECT TOP(1) ht.id_estado_tramite FROM MunicipalidadNicoya2026.dbo.Historial_Tramite ht
  WHERE ht.id_tramite=t.id_tramite ORDER BY ht.fecha_cambio DESC,ht.id_historial DESC) ultimo
 JOIN MunicipalidadNicoya2026.dbo.Estado_Tramite et ON et.id_estado=ultimo.id_estado_tramite
 WHERE t.fecha_resolucion_final IS NOT NULL AND et.codigo IN('APR','RECH')
)
 INSERT dbo.FACT_EFICIENCIA_TRAMITES(id_tiempo,id_tramite_dw,id_departamento_dw,dias_resolucion,estado_final,cantidad_tramites)
 SELECT dt.id_tiempo,tr.id_tramite_dw,d.id_departamento_dw,c.dias,c.estado,1
 FROM Cierre c JOIN dbo.DIM_TIEMPO dt ON dt.fecha=c.fecha
 JOIN dbo.DIM_TRAMITE tr ON tr.id_tipo_tramite_origen=c.id_tipo_tramite
 JOIN dbo.DIM_DEPARTAMENTO d ON d.id_departamento_origen=c.id_departamento;
 -- Una fila por trámite cerrado. Permite promedios exactos sin cambiar tipos de tablas.

END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_validar_recaudacion

AS
BEGIN
 SET NOCOUNT ON;
 DECLARE @origen DECIMAL(18,2),@destino DECIMAL(18,2);
 ;WITH Rec AS (
 SELECT df.id_detalle_factura,df.id_factura,CAST(pm.fecha_pago AS DATE) fecha,
 pm.id_contribuyente,bi.id_distrito,dm.id_tipo_tributo,
 CAST(COALESCE(df.monto_aplicado_principal,0) AS DECIMAL(18,2)) principal,
 CAST(COALESCE(df.monto_aplicado_interes,0) AS DECIMAL(18,2))
  +CAST(COALESCE(df.monto_aplicado_recargo,0) AS DECIMAL(18,2)) intereses,
 CAST(COALESCE(f.descuentos,0) AS DECIMAL(18,2)) descuento,
 ROW_NUMBER() OVER(PARTITION BY f.id_factura ORDER BY pm.fecha_pago,df.id_detalle_factura) primera_aplicacion
 FROM MunicipalidadNicoya2026.dbo.Detalle_Factura df
 JOIN MunicipalidadNicoya2026.dbo.Pago_Municipal pm ON pm.id_pago_municipal=df.id_pago_municipal
 JOIN MunicipalidadNicoya2026.dbo.Factura f ON f.id_factura=df.id_factura
 JOIN MunicipalidadNicoya2026.dbo.Deudas_Municipales dm ON dm.id_deuda_municipal=f.id_deuda_municipal
 JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON bi.id_inmueble=dm.id_inmueble
 WHERE UPPER(COALESCE(f.estado_factura,''))<>'ANULADA'
)
 SELECT @origen=COALESCE(SUM(principal+intereses),0) FROM Rec;
 SELECT @destino=COALESCE(SUM(monto_recaudado+monto_intereses),0) FROM dbo.FACT_RECAUDACION;
 SELECT 'Validación recaudacion' AS Control,@origen AS Total_OLTP,@destino AS Total_DataMart,
 CASE WHEN ABS(@origen-@destino)<0.01 THEN 'CORRECTO (CUADRADO)' ELSE 'DIFERENCIA DETECTADA' END AS Resultado_Validacion;
END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_validar_morosidad

AS
BEGIN
 SET NOCOUNT ON;
 DECLARE @origen DECIMAL(18,2),@destino DECIMAL(18,2);
 ;WITH Aplicado AS (
 SELECT f.id_deuda_municipal,SUM(CAST(COALESCE(df.monto_aplicado_principal,0) AS DECIMAL(18,2))
  +CAST(COALESCE(df.monto_aplicado_interes,0) AS DECIMAL(18,2))
  +CAST(COALESCE(df.monto_aplicado_recargo,0) AS DECIMAL(18,2))) pagado
 FROM MunicipalidadNicoya2026.dbo.Factura f
 JOIN MunicipalidadNicoya2026.dbo.Detalle_Factura df ON df.id_factura=f.id_factura
 WHERE UPPER(COALESCE(f.estado_factura,''))<>'ANULADA'
 GROUP BY f.id_deuda_municipal
), DescuentoDeuda AS (
 SELECT id_deuda_municipal,SUM(CAST(COALESCE(descuentos,0) AS DECIMAL(18,2))) descuento
 FROM MunicipalidadNicoya2026.dbo.Factura WHERE UPPER(COALESCE(estado_factura,''))<>'ANULADA'
 GROUP BY id_deuda_municipal
), Deuda AS (
 SELECT dm.id_deuda_municipal,dm.id_inmueble,bi.id_distrito,dm.id_tipo_tributo,
 CAST(COALESCE(dm.monto_principal,0) AS DECIMAL(18,2))
 +CAST(COALESCE(dm.monto_intereses,0) AS DECIMAL(18,2))
 +CAST(COALESCE(dm.monto_multas,0) AS DECIMAL(18,2))-COALESCE(a.pagado,0)-COALESCE(dd.descuento,0) saldo
 FROM MunicipalidadNicoya2026.dbo.Deudas_Municipales dm
 JOIN MunicipalidadNicoya2026.dbo.Estado_Deuda ed ON ed.id_estado_deuda=dm.id_estado_deuda
 JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON bi.id_inmueble=dm.id_inmueble
 LEFT JOIN Aplicado a ON a.id_deuda_municipal=dm.id_deuda_municipal
 LEFT JOIN DescuentoDeuda dd ON dd.id_deuda_municipal=dm.id_deuda_municipal
 WHERE ed.codigo_estado_deuda IN('PEND','VENC') AND dm.fecha_de_vencimiento<CAST(GETDATE() AS DATE)
), Vencida AS (SELECT * FROM Deuda WHERE saldo>0)

 SELECT @origen=COALESCE(SUM(saldo),0) FROM Vencida;
 SELECT @destino=COALESCE(SUM(saldo_vencido),0) FROM dbo.FACT_MOROSIDAD;
 SELECT 'Validación morosidad' AS Control,@origen AS Total_OLTP,@destino AS Total_DataMart,
 CASE WHEN ABS(@origen-@destino)<0.01 THEN 'CORRECTO (CUADRADO)' ELSE 'DIFERENCIA DETECTADA' END AS Resultado_Validacion;
END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_validar_eficiencia_tramites

AS
BEGIN
 SET NOCOUNT ON;
 DECLARE @origen DECIMAL(18,2),@destino DECIMAL(18,2);
 ;WITH Cierre AS (
 SELECT t.id_tramite,t.id_tipo_tramite,tt.id_departamento,
 CAST(t.fecha_resolucion_final AS DATE) fecha,
 DATEDIFF(DAY,t.fecha_radicacion,t.fecha_resolucion_final) dias,et.codigo,
 CASE et.codigo WHEN 'APR' THEN 'Aprobado' WHEN 'RECH' THEN 'Rechazado' END estado
 FROM MunicipalidadNicoya2026.dbo.Tramite t
 JOIN MunicipalidadNicoya2026.dbo.Tipo_Tramite tt ON tt.id_tipo_tramite=t.id_tipo_tramite
 CROSS APPLY(SELECT TOP(1) ht.id_estado_tramite FROM MunicipalidadNicoya2026.dbo.Historial_Tramite ht
  WHERE ht.id_tramite=t.id_tramite ORDER BY ht.fecha_cambio DESC,ht.id_historial DESC) ultimo
 JOIN MunicipalidadNicoya2026.dbo.Estado_Tramite et ON et.id_estado=ultimo.id_estado_tramite
 WHERE t.fecha_resolucion_final IS NOT NULL AND et.codigo IN('APR','RECH')
)
 SELECT @origen=COUNT(*) FROM Cierre;
 SELECT @destino=COALESCE(SUM(cantidad_tramites),0) FROM dbo.FACT_EFICIENCIA_TRAMITES;
 SELECT 'Validación eficiencia_tramites' AS Control,@origen AS Total_OLTP,@destino AS Total_DataMart,
 CASE WHEN ABS(@origen-@destino)<0.01 THEN 'CORRECTO (CUADRADO)' ELSE 'DIFERENCIA DETECTADA' END AS Resultado_Validacion;
END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_etl_ejecutar_carga_periodica
@emitir_validaciones BIT=1,
 @rec_oltp DECIMAL(18,2)=NULL OUTPUT,@rec_dw DECIMAL(18,2)=NULL OUTPUT,
 @mora_oltp DECIMAL(18,2)=NULL OUTPUT,@mora_dw DECIMAL(18,2)=NULL OUTPUT,
 @tram_oltp DECIMAL(18,2)=NULL OUTPUT,@tram_dw DECIMAL(18,2)=NULL OUTPUT
AS
BEGIN
 SET NOCOUNT ON;

 SET XACT_ABORT ON;
 SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
 DECLARE @propia BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END,@lock INT;
 BEGIN TRY
  IF @propia=1 BEGIN TRANSACTION;
  EXEC @lock=sys.sp_getapplock @Resource='Nicoya_ETL_integral',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=0;
  IF @lock<0 THROW 50022,N'Ya existe una carga ETL en ejecución. Espere a que termine.',1;
  DECLARE @min INT=YEAR(GETDATE()),@max INT=YEAR(GETDATE());
  SELECT @min=CASE WHEN MIN(anio)<@min THEN MIN(anio) ELSE @min END,
         @max=CASE WHEN MAX(anio)>@max THEN MAX(anio) ELSE @max END
  FROM(SELECT YEAR(fecha_pago) anio FROM MunicipalidadNicoya2026.dbo.Pago_Municipal
       UNION ALL SELECT YEAR(fecha_resolucion_final) FROM MunicipalidadNicoya2026.dbo.Tramite WHERE fecha_resolucion_final IS NOT NULL) fechas;
  EXEC dbo.sp_etl_cargar_dim_tiempo @min,@max;
  EXEC dbo.sp_etl_cargar_dim_ubicacion;
  EXEC dbo.sp_etl_cargar_dim_tributo;
  EXEC dbo.sp_etl_cargar_dim_departamento;
  EXEC dbo.sp_etl_cargar_dim_tramite;
  EXEC dbo.sp_etl_cargar_dim_contribuyente;
  IF EXISTS(SELECT 1 FROM MunicipalidadNicoya2026.dbo.Tramite WHERE fecha_resolucion_final<fecha_radicacion)
   THROW 50022,N'Hay trámites con resolución anterior a radicación.',1;
  IF EXISTS(SELECT 1 FROM MunicipalidadNicoya2026.dbo.Tramite t
   OUTER APPLY(SELECT TOP(1) et.codigo FROM MunicipalidadNicoya2026.dbo.Historial_Tramite h
    JOIN MunicipalidadNicoya2026.dbo.Estado_Tramite et ON et.id_estado=h.id_estado_tramite
    WHERE h.id_tramite=t.id_tramite ORDER BY h.fecha_cambio DESC,h.id_historial DESC) u
   WHERE (t.fecha_resolucion_final IS NOT NULL AND COALESCE(u.codigo,'') NOT IN('APR','RECH'))
      OR (t.fecha_resolucion_final IS NULL AND u.codigo IN('APR','RECH')))
   THROW 50022,N'Hay trámites con estado final y fecha de cierre inconsistentes. Corrija el origen.',1;
  EXEC dbo.sp_etl_cargar_fact_recaudacion;
  EXEC dbo.sp_etl_cargar_fact_morosidad;
  EXEC dbo.sp_etl_cargar_fact_eficiencia_tramites;
  ;WITH Rec AS (
 SELECT df.id_detalle_factura,df.id_factura,CAST(pm.fecha_pago AS DATE) fecha,
 pm.id_contribuyente,bi.id_distrito,dm.id_tipo_tributo,
 CAST(COALESCE(df.monto_aplicado_principal,0) AS DECIMAL(18,2)) principal,
 CAST(COALESCE(df.monto_aplicado_interes,0) AS DECIMAL(18,2))
  +CAST(COALESCE(df.monto_aplicado_recargo,0) AS DECIMAL(18,2)) intereses,
 CAST(COALESCE(f.descuentos,0) AS DECIMAL(18,2)) descuento,
 ROW_NUMBER() OVER(PARTITION BY f.id_factura ORDER BY pm.fecha_pago,df.id_detalle_factura) primera_aplicacion
 FROM MunicipalidadNicoya2026.dbo.Detalle_Factura df
 JOIN MunicipalidadNicoya2026.dbo.Pago_Municipal pm ON pm.id_pago_municipal=df.id_pago_municipal
 JOIN MunicipalidadNicoya2026.dbo.Factura f ON f.id_factura=df.id_factura
 JOIN MunicipalidadNicoya2026.dbo.Deudas_Municipales dm ON dm.id_deuda_municipal=f.id_deuda_municipal
 JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON bi.id_inmueble=dm.id_inmueble
 WHERE UPPER(COALESCE(f.estado_factura,''))<>'ANULADA'
)
  SELECT @rec_oltp=COALESCE(SUM(principal+intereses),0) FROM Rec;
  SELECT @rec_dw=COALESCE(SUM(monto_recaudado+monto_intereses),0) FROM dbo.FACT_RECAUDACION;
  ;WITH Aplicado AS (
 SELECT f.id_deuda_municipal,SUM(CAST(COALESCE(df.monto_aplicado_principal,0) AS DECIMAL(18,2))
  +CAST(COALESCE(df.monto_aplicado_interes,0) AS DECIMAL(18,2))
  +CAST(COALESCE(df.monto_aplicado_recargo,0) AS DECIMAL(18,2))) pagado
 FROM MunicipalidadNicoya2026.dbo.Factura f
 JOIN MunicipalidadNicoya2026.dbo.Detalle_Factura df ON df.id_factura=f.id_factura
 WHERE UPPER(COALESCE(f.estado_factura,''))<>'ANULADA'
 GROUP BY f.id_deuda_municipal
), DescuentoDeuda AS (
 SELECT id_deuda_municipal,SUM(CAST(COALESCE(descuentos,0) AS DECIMAL(18,2))) descuento
 FROM MunicipalidadNicoya2026.dbo.Factura WHERE UPPER(COALESCE(estado_factura,''))<>'ANULADA'
 GROUP BY id_deuda_municipal
), Deuda AS (
 SELECT dm.id_deuda_municipal,dm.id_inmueble,bi.id_distrito,dm.id_tipo_tributo,
 CAST(COALESCE(dm.monto_principal,0) AS DECIMAL(18,2))
 +CAST(COALESCE(dm.monto_intereses,0) AS DECIMAL(18,2))
 +CAST(COALESCE(dm.monto_multas,0) AS DECIMAL(18,2))-COALESCE(a.pagado,0)-COALESCE(dd.descuento,0) saldo
 FROM MunicipalidadNicoya2026.dbo.Deudas_Municipales dm
 JOIN MunicipalidadNicoya2026.dbo.Estado_Deuda ed ON ed.id_estado_deuda=dm.id_estado_deuda
 JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON bi.id_inmueble=dm.id_inmueble
 LEFT JOIN Aplicado a ON a.id_deuda_municipal=dm.id_deuda_municipal
 LEFT JOIN DescuentoDeuda dd ON dd.id_deuda_municipal=dm.id_deuda_municipal
 WHERE ed.codigo_estado_deuda IN('PEND','VENC') AND dm.fecha_de_vencimiento<CAST(GETDATE() AS DATE)
), Vencida AS (SELECT * FROM Deuda WHERE saldo>0)

  SELECT @mora_oltp=COALESCE(SUM(saldo),0) FROM Vencida;
  SELECT @mora_dw=COALESCE(SUM(saldo_vencido),0) FROM dbo.FACT_MOROSIDAD;
  ;WITH Cierre AS (
 SELECT t.id_tramite,t.id_tipo_tramite,tt.id_departamento,
 CAST(t.fecha_resolucion_final AS DATE) fecha,
 DATEDIFF(DAY,t.fecha_radicacion,t.fecha_resolucion_final) dias,et.codigo,
 CASE et.codigo WHEN 'APR' THEN 'Aprobado' WHEN 'RECH' THEN 'Rechazado' END estado
 FROM MunicipalidadNicoya2026.dbo.Tramite t
 JOIN MunicipalidadNicoya2026.dbo.Tipo_Tramite tt ON tt.id_tipo_tramite=t.id_tipo_tramite
 CROSS APPLY(SELECT TOP(1) ht.id_estado_tramite FROM MunicipalidadNicoya2026.dbo.Historial_Tramite ht
  WHERE ht.id_tramite=t.id_tramite ORDER BY ht.fecha_cambio DESC,ht.id_historial DESC) ultimo
 JOIN MunicipalidadNicoya2026.dbo.Estado_Tramite et ON et.id_estado=ultimo.id_estado_tramite
 WHERE t.fecha_resolucion_final IS NOT NULL AND et.codigo IN('APR','RECH')
)
  SELECT @tram_oltp=COUNT(*) FROM Cierre;
  SELECT @tram_dw=COALESCE(SUM(cantidad_tramites),0) FROM dbo.FACT_EFICIENCIA_TRAMITES;
  IF ABS(@rec_oltp-@rec_dw)>=0.01 OR ABS(@mora_oltp-@mora_dw)>=0.01 OR @tram_oltp<>@tram_dw
   THROW 50022,N'La conciliación ETL no coincide. La carga se revierte para conservar el Data Mart anterior.',1;
  IF @propia=1 COMMIT;
  IF @emitir_validaciones=1
   SELECT 'Validación Recaudación' Control,@rec_oltp Total_OLTP,@rec_dw Total_DataMart,'CORRECTO (CUADRADO)' Resultado_Validacion
   UNION ALL SELECT 'Validación Morosidad',@mora_oltp,@mora_dw,'CORRECTO (CUADRADO)'
   UNION ALL SELECT 'Validación Trámites',@tram_oltp,@tram_dw,'CORRECTO (CUADRADO)';
 END TRY
 BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK;
  THROW;
 END CATCH;

END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\13_sp_autenticar_usuario.sql
CREATE OR ALTER PROCEDURE dbo.sp_autenticar_usuario
    @user_name     VARCHAR(50),
    @password_hash VARCHAR(255)   -- SHA-256 hexadecimal en minúsculas
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_usuario INT,
            @hash_guardado NVARCHAR(255),
            @activo BIT;

    SELECT @id_usuario    = id_usuario,
           @hash_guardado = password_hash,
           @activo        = activo
    FROM dbo.Usuario
    WHERE user_name = @user_name;

    -- Mismo mensaje para usuario inexistente o contraseña errónea (no revela qué falló)
    IF @id_usuario IS NULL OR LOWER(@hash_guardado) <> LOWER(@password_hash)
        THROW 50061, N'Error: Usuario o contraseña incorrectos.', 1;

    IF @activo = 0
        THROW 50062, N'Error: La cuenta de usuario se encuentra inactiva.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.Rol_Usuario WHERE id_usuario = @id_usuario)
        THROW 50063, N'Error: El usuario no tiene roles asignados en el sistema.', 1;

    -- Una fila por rol asignado
    SELECT
        u.id_usuario,
        u.user_name,
        CONCAT(u.nombre_usuario, ' ', u.apellido1_usuario, ' ', u.apellido2_usuario) AS nombre_completo,
        u.email_usuario AS email,
        u.id_departamento,
        d.nombre_departamento,
        r.nombre_rol
    FROM dbo.Usuario u
    INNER JOIN dbo.Departamento d ON u.id_departamento = d.id_departamento
    INNER JOIN dbo.Rol_Usuario ru ON u.id_usuario = ru.id_usuario
    INNER JOIN dbo.Rol r          ON ru.id_rol = r.id_rol
    WHERE u.id_usuario = @id_usuario
    ORDER BY r.id_rol;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_internal_audit_logger
    @tabla VARCHAR(50),
    @id_reg VARCHAR(50),
    @val_ant VARCHAR(MAX),
    @val_nue VARCHAR(MAX),
    @cod_op VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ip VARCHAR(45) = ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1');
    DECLARE @id_usr INT = dbo.fn_usuario_sesion();   -- antes: solo el login SQL
    DECLARE @id_tipo INT;
    SELECT @id_tipo = id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = @cod_op;

    IF @id_tipo IS NOT NULL
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria
        (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        VALUES
        (@tabla, @id_reg, @val_ant, @val_nue, @ip, GETDATE(), @id_usr, @id_tipo);
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_roles
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_rol, nombre_rol
    FROM dbo.Rol
    ORDER BY id_rol;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_permisos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_permiso, modulo, accion
    FROM dbo.Permiso
    ORDER BY modulo, accion;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_requisitos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_requisito, nombre_requisito, descripcion, es_obligatorio
    FROM dbo.Requisito
    ORDER BY id_requisito;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_departamentos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_departamento, nombre_departamento, codigo_interno
    FROM dbo.Departamento
    ORDER BY id_departamento;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_frecuencias
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_frecuencia, nombre_frecuencia, intervalo_horas, descripcion_frecuencia
    FROM dbo.Frecuencia
    ORDER BY intervalo_horas;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_respaldo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_de_respaldo, nombre_tipo_respaldo, descripcion
    FROM dbo.Tipo_de_respaldo
    ORDER BY id_tipo_de_respaldo;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_configuraciones_respaldo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        rc.id_respaldos_config,
        rc.nombre_configuracion,
        rc.hora_ejecucion,
        rc.origen,
        rc.retencion_dias,
        rc.cifrado,
        rc.ruta_destino,
        rc.activo,
        rc.fecha_creacion,
        rc.fecha_modificacion,
        rc.id_frecuencia,
        f.nombre_frecuencia,
        rc.id_tipo_de_respaldo,
        tr.nombre_tipo_respaldo
    FROM dbo.Respaldos_Config rc
    INNER JOIN dbo.Frecuencia f ON rc.id_frecuencia = f.id_frecuencia
    INNER JOIN dbo.Tipo_de_respaldo tr ON rc.id_tipo_de_respaldo = tr.id_tipo_de_respaldo
    ORDER BY rc.id_respaldos_config;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\definicion_recuperada_SSMS.sql
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

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_autenticar_ciudadano
    @identificacion VARCHAR(20),
    @password_hash  VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_contribuyente INT, @hash NVARCHAR(255), @activa BIT, @estado BIT;

    SELECT @id_contribuyente = c.id_contribuyente,
           @hash             = cc.password_hash,
           @activa           = cc.activa,
           @estado           = c.estado_contribuyente
    FROM dbo.Cuenta_Ciudadana cc
    INNER JOIN dbo.Contribuyente c ON cc.id_contribuyente = c.id_contribuyente
    LEFT JOIN dbo.Contribuyente_Fisico cf ON c.id_contribuyente = cf.id_contribuyente
    LEFT JOIN dbo.Contribuyente_Juridico cj ON c.id_contribuyente = cj.id_contribuyente
    WHERE ISNULL(cf.cedula_identidad, cj.cedula_juridica) = @identificacion;

    IF @id_contribuyente IS NULL OR LOWER(@hash) <> LOWER(@password_hash)
        THROW 50064, N'Error: Cédula o contraseña incorrectas.', 1;

    IF @activa = 0 OR @estado = 0
        THROW 50065, N'Error: La cuenta ciudadana se encuentra inactiva. Comuníquese con la Municipalidad.', 1;

    UPDATE dbo.Cuenta_Ciudadana SET ultimo_acceso = GETDATE() WHERE id_contribuyente = @id_contribuyente;

    SELECT
        p.id_contribuyente,
        p.identificacion_oficial,
        p.nombre_o_razon_social,
        p.tipo_persona,
        p.correo_electronico,
        p.telefono
    FROM dbo.vw_padron_contribuyentes p
    WHERE p.id_contribuyente = @id_contribuyente;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_ciudadano_historial_tramite
    @id_contribuyente INT,
    @id_tramite       INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite AND id_contribuyente = @id_contribuyente)
        THROW 50030, N'Error: El trámite no existe o no pertenece al contribuyente.', 1;

    SELECT *
    FROM dbo.vw_historial_tramites_detallado
    WHERE id_tramite = @id_tramite
    ORDER BY fecha_cambio ASC, id_historial ASC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_archivos_tramite
    @id_tramite INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite)
        THROW 50024, N'Error: El trámite especificado no existe.', 1;

    SELECT
        aa.id_archivo_adjunto,
        aa.id_tramite,
        aa.nombre_original,
        aa.ruta_almacenamiento,
        aa.peso_bytes,
        aa.fecha_subida,
        aa.id_requisito,
        r.nombre_requisito
    FROM dbo.Archivo_Adjunto aa
    LEFT JOIN dbo.Requisito r ON aa.id_requisito = r.id_requisito
    WHERE aa.id_tramite = @id_tramite
    ORDER BY aa.fecha_subida DESC, aa.id_archivo_adjunto DESC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_requisitos_tramite
    @id_tramite INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_tipo_tramite INT;
    SELECT @id_tipo_tramite = id_tipo_tramite FROM dbo.Tramite WHERE id_tramite = @id_tramite;

    IF @id_tipo_tramite IS NULL
        THROW 50024, N'Error: El trámite especificado no existe.', 1;

    SELECT
        r.id_requisito,
        r.nombre_requisito,
        r.descripcion,
        r.es_obligatorio,
        CAST(CASE WHEN ar.cantidad > 0 THEN 1 ELSE 0 END AS BIT) AS presentado,
        ISNULL(ar.cantidad, 0) AS cantidad_archivos,
        ar.ultima_presentacion AS fecha_ultima_presentacion
    FROM dbo.Tipo_Tramite_Requisito ttr
    INNER JOIN dbo.Requisito r ON ttr.id_requisito = r.id_requisito
    OUTER APPLY (
        SELECT COUNT(*) AS cantidad, MAX(aa.fecha_subida) AS ultima_presentacion
        FROM dbo.Archivo_Adjunto aa
        WHERE aa.id_tramite = @id_tramite AND aa.id_requisito = r.id_requisito
    ) ar
    WHERE ttr.id_tipo_tramite = @id_tipo_tramite
    ORDER BY r.es_obligatorio DESC, r.id_requisito;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_ciudadano_requisitos_tramite
    @id_contribuyente INT,
    @id_tramite       INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite AND id_contribuyente = @id_contribuyente)
        THROW 50030, N'Error: El trámite no existe o no pertenece al contribuyente.', 1;

    EXEC dbo.sp_consultar_requisitos_tramite @id_tramite = @id_tramite;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_ciudadano_archivos_tramite
    @id_contribuyente INT,
    @id_tramite       INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite AND id_contribuyente = @id_contribuyente)
        THROW 50030, N'Error: El trámite no existe o no pertenece al contribuyente.', 1;

    EXEC dbo.sp_consultar_archivos_tramite @id_tramite = @id_tramite;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_ciudadano_adjuntar_requisito
    @id_contribuyente    INT,
    @id_tramite          INT,
    @id_requisito        INT,
    @nombre_original     VARCHAR(255),
    @ruta_almacenamiento VARCHAR(255),
    @peso_bytes          FLOAT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_tipo_tramite INT, @fecha_final DATETIME;

        SELECT @id_tipo_tramite = id_tipo_tramite, @fecha_final = fecha_resolucion_final
        FROM dbo.Tramite
        WHERE id_tramite = @id_tramite AND id_contribuyente = @id_contribuyente;

        IF @id_tipo_tramite IS NULL
            THROW 50030, N'Error: El trámite no existe o no pertenece al contribuyente.', 1;

        IF @fecha_final IS NOT NULL
            THROW 50018, N'Error: El trámite ya fue resuelto y no admite nuevos documentos.', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.Tipo_Tramite_Requisito WHERE id_tipo_tramite = @id_tipo_tramite AND id_requisito = @id_requisito)
            THROW 50017, N'Error: El requisito indicado no corresponde a este tipo de trámite.', 1;

        INSERT INTO dbo.Archivo_Adjunto (nombre_original, ruta_almacenamiento, peso_bytes, fecha_subida, id_tramite, id_requisito)
        VALUES (@nombre_original, @ruta_almacenamiento, @peso_bytes, GETDATE(), @id_tramite, @id_requisito);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_ciudadano_pagar_factura_sinpe
    @id_contribuyente INT,
    @id_factura       INT,
    @comprobante      VARCHAR(50),
    @monto            FLOAT,
    @nuevo_id_pago    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @saldo FLOAT, @estado NVARCHAR(20), @id_medio INT;

        SELECT @saldo = f.saldo_pendiente, @estado = f.estado_factura
        FROM dbo.Factura f
        INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
        INNER JOIN dbo.Derecho_Inmueble di ON dm.id_inmueble = di.id_inmueble
        WHERE f.id_factura = @id_factura AND di.id_contribuyente = @id_contribuyente;

        IF @saldo IS NULL
            THROW 50031, N'Error: La factura no existe o no pertenece al contribuyente.', 1;

        IF @estado <> 'Pendiente' OR @saldo <= 0
            THROW 50015, N'Error: La factura no tiene saldo pendiente de pago.', 1;

        IF @monto IS NULL OR @monto <= 0
            THROW 50013, N'Error: El monto del pago debe ser mayor que cero.', 1;

        IF @monto > @saldo + 0.001
            THROW 50014, N'Error: El monto del pago supera el saldo pendiente de la factura.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Pago_Municipal WHERE comprobante = @comprobante)
            THROW 50047, N'Error: El comprobante SINPE ya fue registrado anteriormente.', 1;

        SELECT TOP 1 @id_medio = id_medio_pago FROM dbo.Medio_Pago WHERE nombre_medio_pago LIKE 'SINPE%' ORDER BY id_medio_pago;
        IF @id_medio IS NULL
        BEGIN
            INSERT INTO dbo.Medio_Pago (nombre_medio_pago) VALUES ('SINPE Móvil Institucional');
            SET @id_medio = SCOPE_IDENTITY();
        END

        BEGIN TRANSACTION;

        INSERT INTO dbo.Pago_Municipal (monto_total_pagado, fecha_pago, comprobante, id_medio_pago, id_contribuyente)
        VALUES (@monto, GETDATE(), @comprobante, @id_medio, @id_contribuyente);

        SET @nuevo_id_pago = SCOPE_IDENTITY();

        -- El trigger tr_actualizar_saldo_factura_detalle recalcula saldo y estado
        INSERT INTO dbo.Detalle_Factura (id_factura, id_pago_municipal, monto_aplicado_principal, monto_aplicado_interes, monto_aplicado_recargo)
        VALUES (@id_factura, @nuevo_id_pago, @monto, 0, 0);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_permisos_por_rol
    @id_rol INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.id_permiso, p.modulo, p.accion
    FROM dbo.Rol_Permiso rp
    INNER JOIN dbo.Permiso p ON rp.id_permiso = p.id_permiso
    WHERE rp.id_rol = @id_rol
    ORDER BY p.modulo, p.accion;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_asignaciones_roles
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ru.id_usuario, u.user_name, ru.id_rol, r.nombre_rol
    FROM dbo.Rol_Usuario ru
    INNER JOIN dbo.Usuario u ON ru.id_usuario = u.id_usuario
    INNER JOIN dbo.Rol r ON ru.id_rol = r.id_rol
    ORDER BY u.user_name, r.nombre_rol;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_revocar_rol_usuario
    @id_usuario INT,
    @id_rol     INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Rol_Usuario WHERE id_usuario = @id_usuario AND id_rol = @id_rol)
            THROW 50032, N'Error: El usuario no tiene asignado ese rol.', 1;

        -- Nunca dejar el sistema sin un administrador activo
        IF EXISTS (SELECT 1 FROM dbo.Rol WHERE id_rol = @id_rol AND nombre_rol = N'Administrador del Sistema')
           AND NOT EXISTS (
                SELECT 1
                FROM dbo.Rol_Usuario ru
                INNER JOIN dbo.Usuario u ON ru.id_usuario = u.id_usuario
                WHERE ru.id_rol = @id_rol AND ru.id_usuario <> @id_usuario AND u.activo = 1)
            THROW 50044, N'Error: No se puede revocar el último Administrador del Sistema activo.', 1;

        DELETE FROM dbo.Rol_Usuario WHERE id_usuario = @id_usuario AND id_rol = @id_rol;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_revocar_permiso_rol
    @id_rol     INT,
    @id_permiso INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Rol_Permiso WHERE id_rol = @id_rol AND id_permiso = @id_permiso)
            THROW 50033, N'Error: El rol no tiene concedido ese permiso.', 1;

        DELETE FROM dbo.Rol_Permiso WHERE id_rol = @id_rol AND id_permiso = @id_permiso;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dw_estado
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @instalado BIT = CASE WHEN DB_ID(N'MunicipalidadNicoyaDataMart2026') IS NULL THEN 0 ELSE 1 END;
    DECLARE @f_rec INT = 0, @f_mor INT = 0, @f_efi INT = 0;

    IF @instalado = 1
    BEGIN
        EXEC sp_executesql
            N'SELECT @r = (SELECT COUNT(*) FROM MunicipalidadNicoyaDataMart2026.dbo.FACT_RECAUDACION),
                     @m = (SELECT COUNT(*) FROM MunicipalidadNicoyaDataMart2026.dbo.FACT_MOROSIDAD),
                     @e = (SELECT COUNT(*) FROM MunicipalidadNicoyaDataMart2026.dbo.FACT_EFICIENCIA_TRAMITES);',
            N'@r INT OUTPUT, @m INT OUTPUT, @e INT OUTPUT',
            @r = @f_rec OUTPUT, @m = @f_mor OUTPUT, @e = @f_efi OUTPUT;
    END

    SELECT
        @instalado AS dw_instalado,
        ult.fecha_inicio AS ultima_carga_inicio,
        ult.fecha_fin AS ultima_carga_fin,
        ult.estado AS ultima_carga_estado,
        @f_rec AS filas_fact_recaudacion,
        @f_mor AS filas_fact_morosidad,
        @f_efi AS filas_fact_eficiencia
    FROM (SELECT 1 AS uno) base
    OUTER APPLY (SELECT TOP 1 fecha_inicio, fecha_fin, estado FROM dbo.Control_Cargas_ETL ORDER BY id_carga DESC) ult;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\26_compatibilidad_estado_inicial_etl.sql
CREATE OR ALTER PROCEDURE dbo.sp_dw_ejecutar_etl
@id_usuario INT=NULL
AS
BEGIN
 SET NOCOUNT ON;

 SET XACT_ABORT ON;
 SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
 IF @@TRANCOUNT<>0 THROW 50022,N'Inicie la carga sin una transacción externa.',1;
 IF DB_ID('MunicipalidadNicoyaDataMart2026') IS NULL THROW 50034,N'El Data Mart no existe.',1;
 DECLARE @id INT,@r DECIMAL(18,2),@rd DECIMAL(18,2),@m DECIMAL(18,2),@md DECIMAL(18,2),@t DECIMAL(18,2),@td DECIMAL(18,2);
 -- Recupera el literal permitido, incluso en instalaciones con texto heredado mal codificado.
 -- No modifica el CHECK ni los datos. Solo admite el literal inicial esperado.
 INSERT dbo.Control_Cargas_ETL(fecha_inicio,estado,id_usuario) VALUES(GETDATE(),N'En Ejecución',@id_usuario);
 SET @id=SCOPE_IDENTITY();
 BEGIN TRY
  BEGIN TRANSACTION;
  EXEC MunicipalidadNicoyaDataMart2026.dbo.sp_etl_ejecutar_carga_periodica
   @emitir_validaciones=0,@rec_oltp=@r OUTPUT,@rec_dw=@rd OUTPUT,
   @mora_oltp=@m OUTPUT,@mora_dw=@md OUTPUT,@tram_oltp=@t OUTPUT,@tram_dw=@td OUTPUT;
  UPDATE dbo.Control_Cargas_ETL SET fecha_fin=GETDATE(),estado='Exitoso',
   detalle='Carga transaccional conciliada: recaudación, saldos vencidos y trámites. Clasificaciones derivadas pendientes de aprobación.' WHERE id_carga=@id;
  COMMIT;
 END TRY
 BEGIN CATCH
  DECLARE @error NVARCHAR(2000)=LEFT(ERROR_MESSAGE(),2000);
  IF XACT_STATE()<>0 ROLLBACK;
  UPDATE dbo.Control_Cargas_ETL SET fecha_fin=GETDATE(),estado='Fallido',detalle=@error WHERE id_carga=@id;
  THROW;
 END CATCH;
 SELECT @id id_carga,N'Validación Recaudación' control,@r total_oltp,@rd total_dw,N'CORRECTO (CUADRADO)' resultado
 UNION ALL SELECT @id,N'Validación Morosidad',@m,@md,N'CORRECTO (CUADRADO)'
 UNION ALL SELECT @id,N'Validación Trámites',@t,@td,N'CORRECTO (CUADRADO)';

END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dw_historial_cargas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 50
        c.id_carga,
        c.fecha_inicio,
        c.fecha_fin,
        DATEDIFF(SECOND, c.fecha_inicio, c.fecha_fin) AS duracion_segundos,
        c.estado,
        c.detalle,
        u.user_name AS ejecutado_por
    FROM dbo.Control_Cargas_ETL c
    LEFT JOIN dbo.Usuario u ON c.id_usuario = u.id_usuario
    ORDER BY c.id_carga DESC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dw_recaudacion_periodo
AS
BEGIN
    SET NOCOUNT ON;
    IF DB_ID(N'MunicipalidadNicoyaDataMart2026') IS NULL
        THROW 50034, N'Error: El Data Warehouse (MunicipalidadNicoyaDataMart2026) no está instalado.', 1;

    EXEC sp_executesql N'
        SELECT
            CAST(anio AS INT) AS anio,
            CAST(trimestre AS INT) AS trimestre,
            CAST(mes AS INT) AS mes,
            CAST(nombre_mes AS NVARCHAR(20)) AS nombre_mes,
            CAST(total_recaudado_principal AS DECIMAL(18,2)) AS total_recaudado_principal,
            CAST(total_recaudado_intereses AS DECIMAL(18,2)) AS total_recaudado_intereses,
            CAST(total_descuentos_aplicados AS DECIMAL(18,2)) AS total_descuentos_aplicados,
            CAST(total_recaudado_general AS DECIMAL(18,2)) AS total_recaudado_general,
            CAST(transacciones_registradas AS INT) AS transacciones_registradas
        FROM MunicipalidadNicoyaDataMart2026.dbo.vw_dw_recaudacion_periodo
        ORDER BY anio, mes;';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dw_recaudacion_tributo
AS
BEGIN
    SET NOCOUNT ON;
    IF DB_ID(N'MunicipalidadNicoyaDataMart2026') IS NULL
        THROW 50034, N'Error: El Data Warehouse (MunicipalidadNicoyaDataMart2026) no está instalado.', 1;

    EXEC sp_executesql N'
        SELECT
            CAST(codigo_tributo AS NVARCHAR(20)) AS codigo_tributo,
            CAST(nombre_tributo AS NVARCHAR(100)) AS nombre_tributo,
            CAST(categoria_tributo AS NVARCHAR(50)) AS categoria_tributo,
            CAST(periodicidad AS NVARCHAR(20)) AS periodicidad,
            CAST(total_principal AS DECIMAL(18,2)) AS total_principal,
            CAST(total_intereses AS DECIMAL(18,2)) AS total_intereses,
            CAST(total_recaudado AS DECIMAL(18,2)) AS total_recaudado
        FROM MunicipalidadNicoyaDataMart2026.dbo.vw_dw_recaudacion_tributo
        ORDER BY total_recaudado DESC;';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dw_recaudacion_ubicacion
AS
BEGIN
    SET NOCOUNT ON;
    IF DB_ID(N'MunicipalidadNicoyaDataMart2026') IS NULL
        THROW 50034, N'Error: El Data Warehouse (MunicipalidadNicoyaDataMart2026) no está instalado.', 1;

    EXEC sp_executesql N'
        SELECT
            CAST(distrito AS NVARCHAR(50)) AS distrito,
            CAST(zona_rural_urbana AS NVARCHAR(10)) AS zona_rural_urbana,
            CAST(total_principal AS DECIMAL(18,2)) AS total_principal,
            CAST(total_intereses AS DECIMAL(18,2)) AS total_intereses,
            CAST(total_recaudado AS DECIMAL(18,2)) AS total_recaudado,
            CAST(total_pagos_distrito AS INT) AS total_pagos_distrito
        FROM MunicipalidadNicoyaDataMart2026.dbo.vw_dw_recaudacion_ubicacion
        ORDER BY total_recaudado DESC;';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dw_morosidad
AS
BEGIN
    SET NOCOUNT ON;
    IF DB_ID(N'MunicipalidadNicoyaDataMart2026') IS NULL
        THROW 50034, N'Error: El Data Warehouse (MunicipalidadNicoyaDataMart2026) no está instalado.', 1;

    EXEC sp_executesql N'
        SELECT
            CAST(anio AS INT) AS anio,
            CAST(mes AS INT) AS mes,
            CAST(nombre_mes AS NVARCHAR(20)) AS nombre_mes,
            CAST(distrito AS NVARCHAR(50)) AS distrito,
            CAST(zona_rural_urbana AS NVARCHAR(10)) AS zona_rural_urbana,
            CAST(nombre_tributo AS NVARCHAR(100)) AS nombre_tributo,
            CAST(saldo_vencido AS DECIMAL(18,2)) AS saldo_vencido,
            CAST(cantidad_contribuyentes_morosos AS INT) AS cantidad_contribuyentes_morosos
        FROM MunicipalidadNicoyaDataMart2026.dbo.vw_dw_morosidad
        ORDER BY anio, mes, distrito;';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dw_eficiencia_tramites
AS
BEGIN
    SET NOCOUNT ON;
    IF DB_ID(N'MunicipalidadNicoyaDataMart2026') IS NULL
        THROW 50034, N'Error: El Data Warehouse (MunicipalidadNicoyaDataMart2026) no está instalado.', 1;

    EXEC sp_executesql N'
        SELECT
            CAST(nombre_tramite AS NVARCHAR(100)) AS nombre_tramite,
            CAST(plazo_compromiso_sla AS INT) AS plazo_compromiso_sla,
            CAST(nombre_departamento AS NVARCHAR(50)) AS nombre_departamento,
            CAST(estado_final AS NVARCHAR(20)) AS estado_final,
            CAST(dias_promedio_consumidos AS DECIMAL(18,2)) AS dias_promedio_consumidos,
            CAST(cantidad_tramites AS INT) AS cantidad_tramites,
            CAST(estado_cumplimiento AS NVARCHAR(30)) AS estado_cumplimiento
        FROM MunicipalidadNicoyaDataMart2026.dbo.vw_dw_eficiencia_tramites
        ORDER BY nombre_tramite;';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dw_indicadores_departamento
AS
BEGIN
    SET NOCOUNT ON;
    IF DB_ID(N'MunicipalidadNicoyaDataMart2026') IS NULL
        THROW 50034, N'Error: El Data Warehouse (MunicipalidadNicoyaDataMart2026) no está instalado.', 1;

    EXEC sp_executesql N'
        SELECT
            CAST(nombre_departamento AS NVARCHAR(50)) AS nombre_departamento,
            CAST(volumen_total_gestionado AS INT) AS volumen_total_gestionado,
            CAST(promedio_dias_resolucion_area AS DECIMAL(18,2)) AS promedio_dias_resolucion_area,
            CAST(tramites_aprobados AS INT) AS tramites_aprobados,
            CAST(tramites_rechazados AS INT) AS tramites_rechazados
        FROM MunicipalidadNicoyaDataMart2026.dbo.vw_dw_indicadores_departamento
        ORDER BY volumen_total_gestionado DESC;';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dba_monitor_resumen
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @cpu_sql INT = NULL, @cpu_idle INT = NULL;

    BEGIN TRY
        SELECT TOP 1
            @cpu_sql  = x.record.value('(./Record/SchedulerMonitorEvent/SystemHealth/ProcessUtilization)[1]', 'int'),
            @cpu_idle = x.record.value('(./Record/SchedulerMonitorEvent/SystemHealth/SystemIdle)[1]', 'int')
        FROM (
            SELECT CONVERT(XML, rb.record) AS record, rb.[timestamp]
            FROM sys.dm_os_ring_buffers rb
            WHERE rb.ring_buffer_type = N'RING_BUFFER_SCHEDULER_MONITOR'
              AND rb.record LIKE N'%<SystemHealth>%'
        ) x
        ORDER BY x.[timestamp] DESC;
    END TRY
    BEGIN CATCH
        SET @cpu_sql = NULL;
    END CATCH

    DECLARE @datos_mb DECIMAL(18,2), @datos_usado_mb DECIMAL(18,2), @log_mb DECIMAL(18,2), @log_pct DECIMAL(5,2);

    SELECT @datos_mb       = CAST(SUM(CASE WHEN type = 0 THEN size END) * 8 / 1024.0 AS DECIMAL(18,2)),
           @datos_usado_mb = CAST(SUM(CASE WHEN type = 0 THEN FILEPROPERTY(name, 'SpaceUsed') END) * 8 / 1024.0 AS DECIMAL(18,2)),
           @log_mb         = CAST(SUM(CASE WHEN type = 1 THEN size END) * 8 / 1024.0 AS DECIMAL(18,2))
    FROM sys.database_files;

    SELECT @log_pct = CAST(used_log_space_in_percent AS DECIMAL(5,2)) FROM sys.dm_db_log_space_usage;

    SELECT
        CAST(@@SERVERNAME AS NVARCHAR(128)) AS servidor,
        CAST(SERVERPROPERTY('ProductVersion') AS NVARCHAR(50)) AS version_motor,
        CAST(SERVERPROPERTY('Edition') AS NVARCHAR(128)) AS edicion,
        CAST(DB_NAME() AS NVARCHAR(128)) AS base_datos,
        si.sqlserver_start_time AS inicio_servicio,
        CAST(DATEDIFF(MINUTE, si.sqlserver_start_time, GETDATE()) AS INT) AS minutos_activo,
        CAST(si.cpu_count AS INT) AS cpus,
        @cpu_sql AS cpu_sql_pct,
        CASE WHEN @cpu_idle IS NULL OR @cpu_sql IS NULL THEN NULL ELSE CAST(100 - @cpu_idle - @cpu_sql AS INT) END AS cpu_otros_pct,
        CAST(pm.physical_memory_in_use_kb / 1024.0 AS DECIMAL(18,2)) AS memoria_sql_mb,
        CAST(sm.total_physical_memory_kb / 1024.0 AS DECIMAL(18,2)) AS memoria_total_mb,
        CAST(sm.available_physical_memory_kb / 1024.0 AS DECIMAL(18,2)) AS memoria_disponible_mb,
        CAST(100.0 * (sm.total_physical_memory_kb - sm.available_physical_memory_kb) / NULLIF(sm.total_physical_memory_kb, 0) AS DECIMAL(5,2)) AS memoria_uso_pct,
        CAST((SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) AS INT) AS conexiones_usuario,
        CAST((SELECT COUNT(*) FROM sys.dm_exec_requests WHERE session_id > 50 AND session_id <> @@SPID) AS INT) AS solicitudes_activas,
        CAST((SELECT COUNT(*) FROM sys.dm_exec_requests WHERE blocking_session_id <> 0) AS INT) AS sesiones_bloqueadas,
        CAST((SELECT COUNT(*) FROM sys.dm_tran_active_transactions) AS INT) AS transacciones_activas,
        @datos_mb AS datos_mb,
        @datos_usado_mb AS datos_usado_mb,
        @log_mb AS log_mb,
        @log_pct AS log_usado_pct,
        (SELECT MAX(b.backup_finish_date) FROM msdb.dbo.backupset b WHERE b.database_name = DB_NAME() AND b.type = 'D') AS ultimo_backup_full,
        (SELECT MAX(b.backup_finish_date) FROM msdb.dbo.backupset b WHERE b.database_name = DB_NAME() AND b.type = 'I') AS ultimo_backup_diferencial
    FROM sys.dm_os_sys_info si
    CROSS JOIN sys.dm_os_process_memory pm
    CROSS JOIN sys.dm_os_sys_memory sm;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dba_monitor_sesiones
    @umbral_segundos INT = 5
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CAST(s.session_id AS INT) AS session_id,
        CAST(s.login_name AS NVARCHAR(128)) AS login_name,
        CAST(s.host_name AS NVARCHAR(128)) AS host_name,
        CAST(c.client_net_address AS NVARCHAR(48)) AS direccion_ip,
        CAST(s.program_name AS NVARCHAR(128)) AS programa,
        CAST(s.status AS NVARCHAR(30)) AS estado,
        CAST(r.command AS NVARCHAR(32)) AS comando,
        CAST(DB_NAME(COALESCE(r.database_id, s.database_id)) AS NVARCHAR(128)) AS base_datos,
        CAST(r.wait_type AS NVARCHAR(60)) AS tipo_espera,
        CAST(r.blocking_session_id AS INT) AS bloqueada_por,
        CAST(CASE WHEN EXISTS (SELECT 1 FROM sys.dm_exec_requests rb WHERE rb.blocking_session_id = s.session_id) THEN 1 ELSE 0 END AS BIT) AS es_bloqueante,
        CAST(ISNULL(r.total_elapsed_time, 0) / 1000 AS INT) AS segundos_ejecucion,
        CAST(CASE WHEN ISNULL(r.total_elapsed_time, 0) / 1000 >= @umbral_segundos THEN 1 ELSE 0 END AS BIT) AS consulta_lenta,
        CAST(ISNULL(r.cpu_time, s.cpu_time) AS INT) AS cpu_ms,
        CAST(ISNULL(r.logical_reads, s.logical_reads) AS BIGINT) AS lecturas_logicas,
        CAST(LEFT(t.text, 500) AS NVARCHAR(500)) AS consulta,
        s.last_request_start_time AS ultima_solicitud,
        CAST(CASE WHEN s.session_id = @@SPID THEN 1 ELSE 0 END AS BIT) AS es_sesion_actual
    FROM sys.dm_exec_sessions s
    LEFT JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
    OUTER APPLY (SELECT TOP 1 ec.client_net_address FROM sys.dm_exec_connections ec WHERE ec.session_id = s.session_id) c
    OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) t
    WHERE s.is_user_process = 1
    ORDER BY es_bloqueante DESC, segundos_ejecucion DESC, s.session_id;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dba_monitor_archivos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CAST(DB_NAME(mf.database_id) AS NVARCHAR(128)) AS base_datos,
        CAST(mf.name AS NVARCHAR(128)) AS archivo_logico,
        CAST(mf.type_desc AS NVARCHAR(60)) AS tipo,
        CAST(mf.physical_name AS NVARCHAR(260)) AS ruta_fisica,
        CAST(mf.size * 8 / 1024.0 AS DECIMAL(18,2)) AS tamano_mb,
        CAST(CASE WHEN mf.database_id = DB_ID() THEN FILEPROPERTY(mf.name, 'SpaceUsed') * 8 / 1024.0 END AS DECIMAL(18,2)) AS usado_mb,
        CAST(CASE WHEN mf.max_size IN (-1, 268435456) THEN NULL ELSE mf.max_size * 8 / 1024.0 END AS DECIMAL(18,2)) AS maximo_mb,
        CAST(vs.volume_mount_point AS NVARCHAR(256)) AS volumen,
        CAST(vs.total_bytes / 1048576.0 AS DECIMAL(18,2)) AS volumen_total_mb,
        CAST(vs.available_bytes / 1048576.0 AS DECIMAL(18,2)) AS volumen_libre_mb,
        CAST(100.0 * vs.available_bytes / NULLIF(vs.total_bytes, 0) AS DECIMAL(5,2)) AS volumen_libre_pct
    FROM sys.master_files mf
    CROSS APPLY sys.dm_os_volume_stats(mf.database_id, mf.file_id) vs
    WHERE DB_NAME(mf.database_id) IN (N'MunicipalidadNicoya2026', N'MunicipalidadNicoyaDataMart2026', N'MaintenanceDB')
    ORDER BY base_datos, mf.type, mf.file_id;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\23_monitoreo_dba_criterios_indices.sql
CREATE OR ALTER PROCEDURE dbo.sp_dba_monitor_fragmentacion
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CAST(OBJECT_SCHEMA_NAME(ips.object_id) + N'.' + OBJECT_NAME(ips.object_id) AS NVARCHAR(256)) AS tabla,
        CAST(i.name AS NVARCHAR(128)) AS indice,
        CAST(i.type_desc AS NVARCHAR(60)) AS tipo_indice,
        CAST(ips.avg_fragmentation_in_percent AS DECIMAL(6,2)) AS fragmentacion_pct,
        CAST(ips.page_count AS BIGINT) AS paginas,
        CAST(CASE
                WHEN ips.page_count <= 8 THEN N'NINGUNA (índice pequeño)'
                WHEN ips.avg_fragmentation_in_percent >= 30 THEN N'REBUILD'
                WHEN ips.avg_fragmentation_in_percent > 20 THEN N'REORGANIZE'
                ELSE N'NINGUNA'
             END AS NVARCHAR(40)) AS accion_recomendada
    FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
    INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
    WHERE i.name IS NOT NULL
      AND OBJECTPROPERTY(ips.object_id, 'IsUserTable') = 1
    ORDER BY ips.avg_fragmentation_in_percent DESC, ips.page_count DESC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dba_terminar_sesion
    @session_id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @session_id IS NULL OR @session_id <= 50 OR @session_id = @@SPID
        THROW 50016, N'Error: No se puede terminar una sesión del sistema ni la sesión actual.', 1;

    IF NOT EXISTS (SELECT 1 FROM sys.dm_exec_sessions WHERE session_id = @session_id AND is_user_process = 1)
        THROW 50035, N'Error: La sesión indicada no existe o ya finalizó.', 1;

    DECLARE @sql NVARCHAR(50) = N'KILL ' + CAST(@session_id AS NVARCHAR(10)) + N';';
    EXEC (@sql);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\23_monitoreo_dba_criterios_indices.sql
CREATE OR ALTER PROCEDURE dbo.sp_dba_ejecutar_mantenimiento
    @optimizar_indices        BIT = 1,
    @actualizar_estadisticas  BIT = 1,
    @purgar_respaldos         BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    CREATE TABLE #resultado
    (
        orden              INT IDENTITY(1,1),
        tarea              NVARCHAR(100),
        estado             NVARCHAR(20),
        detalle            NVARCHAR(1000),
        duracion_segundos  INT
    );

    DECLARE @inicio DATETIME2, @antes INT, @despues INT, @usar_maintenance BIT;
    SET @usar_maintenance = CASE WHEN OBJECT_ID(N'MaintenanceDB.dbo.IndexOptimize', N'P') IS NULL THEN 0 ELSE 1 END;

    -- Índices fragmentados (> 20 % y más de 8 páginas; CU-DBA-06) antes del mantenimiento
    SELECT @antes = COUNT(*)
    FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
    INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
    WHERE i.name IS NOT NULL AND ips.avg_fragmentation_in_percent > 20 AND ips.page_count > 8;

    -- 1) Índices
    IF @optimizar_indices = 1
    BEGIN
        SET @inicio = SYSDATETIME();
        BEGIN TRY
            -- Selección idéntica al diagnóstico: >20 % y más de 8 páginas.
                DECLARE @cmd NVARCHAR(MAX) = N'';
                SELECT @cmd += N'ALTER INDEX ' + QUOTENAME(i.name) + N' ON '
                             + QUOTENAME(OBJECT_SCHEMA_NAME(ips.object_id)) + N'.' + QUOTENAME(OBJECT_NAME(ips.object_id))
                             + CASE WHEN ips.avg_fragmentation_in_percent >= 30 THEN N' REBUILD;' ELSE N' REORGANIZE;' END
                             + CHAR(10)
                FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
                INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
                WHERE i.name IS NOT NULL AND ips.avg_fragmentation_in_percent > 20 AND ips.page_count > 8;

                IF LEN(@cmd) > 0 EXEC sp_executesql @cmd;

            SELECT @despues = COUNT(*)
            FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
            INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
            WHERE i.name IS NOT NULL AND ips.avg_fragmentation_in_percent > 20 AND ips.page_count > 8;

            INSERT INTO #resultado (tarea, estado, detalle, duracion_segundos)
            VALUES (N'Reorganización / reconstrucción de índices', N'Completado',
                    CONCAT(N'Índices fragmentados antes: ', @antes, N' · después: ', @despues,
                           N' (rutina integrada; criterio documental >20 %)'),
                    DATEDIFF(SECOND, @inicio, SYSDATETIME()));
        END TRY
        BEGIN CATCH
            INSERT INTO #resultado (tarea, estado, detalle, duracion_segundos)
            VALUES (N'Reorganización / reconstrucción de índices', N'Fallido', LEFT(ERROR_MESSAGE(), 1000), DATEDIFF(SECOND, @inicio, SYSDATETIME()));
        END CATCH
    END

    -- 2) Estadísticas
    IF @actualizar_estadisticas = 1
    BEGIN
        SET @inicio = SYSDATETIME();
        BEGIN TRY
            EXEC sp_updatestats;
            INSERT INTO #resultado (tarea, estado, detalle, duracion_segundos)
            VALUES (N'Actualización de estadísticas', N'Completado', N'sp_updatestats ejecutado sobre MunicipalidadNicoya2026.', DATEDIFF(SECOND, @inicio, SYSDATETIME()));
        END TRY
        BEGIN CATCH
            INSERT INTO #resultado (tarea, estado, detalle, duracion_segundos)
            VALUES (N'Actualización de estadísticas', N'Fallido', LEFT(ERROR_MESSAGE(), 1000), DATEDIFF(SECOND, @inicio, SYSDATETIME()));
        END CATCH
    END

    -- 3) Purga de respaldos expirados según retencion_dias de cada directiva activa
    IF @purgar_respaldos = 1
    BEGIN
        SET @inicio = SYSDATETIME();
        DECLARE @ruta NVARCHAR(260), @retencion INT, @limite NVARCHAR(19), @procesadas INT = 0, @errores NVARCHAR(1000) = N'';

        DECLARE cur_cfg CURSOR LOCAL FAST_FORWARD FOR
            SELECT DISTINCT ruta_destino, retencion_dias FROM dbo.Respaldos_Config WHERE activo = 1;
        OPEN cur_cfg;
        FETCH NEXT FROM cur_cfg INTO @ruta, @retencion;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @limite = CONVERT(NVARCHAR(19), DATEADD(DAY, -@retencion, GETDATE()), 126);
            BEGIN TRY
                EXEC master.dbo.xp_delete_file 0, @ruta, N'bak', @limite, 0;
                SET @procesadas += 1;
            END TRY
            BEGIN CATCH
                SET @errores = LEFT(@errores + @ruta + N': ' + ERROR_MESSAGE() + N' ', 1000);
            END CATCH
            FETCH NEXT FROM cur_cfg INTO @ruta, @retencion;
        END
        CLOSE cur_cfg;
        DEALLOCATE cur_cfg;

        INSERT INTO #resultado (tarea, estado, detalle, duracion_segundos)
        VALUES (N'Purga de respaldos expirados',
                CASE WHEN @errores = N'' THEN N'Completado' ELSE N'Con advertencias' END,
                CONCAT(N'Carpetas procesadas: ', @procesadas, CASE WHEN @errores = N'' THEN N'' ELSE N'. ' + @errores END),
                DATEDIFF(SECOND, @inicio, SYSDATETIME()));
    END

    SELECT orden, tarea, estado, detalle, duracion_segundos
    FROM #resultado
    ORDER BY orden;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\15_portal_ciudadano_dw_monitoreo.sql
CREATE OR ALTER PROCEDURE dbo.sp_dba_historial_mantenimiento
AS
BEGIN
    SET NOCOUNT ON;

    IF OBJECT_ID(N'MaintenanceDB.dbo.CommandLog', N'U') IS NULL
    BEGIN
        -- Misma forma de recordset, vacía, si el plan de mantenimiento no está instalado
        SELECT
            CAST(NULL AS INT) AS id,
            CAST(NULL AS NVARCHAR(128)) AS base_datos,
            CAST(NULL AS NVARCHAR(128)) AS objeto,
            CAST(NULL AS NVARCHAR(128)) AS indice,
            CAST(NULL AS NVARCHAR(60)) AS tipo_comando,
            CAST(NULL AS NVARCHAR(400)) AS comando,
            CAST(NULL AS DATETIME2) AS inicio,
            CAST(NULL AS DATETIME2) AS fin,
            CAST(NULL AS INT) AS duracion_segundos,
            CAST(NULL AS INT) AS numero_error,
            CAST(NULL AS NVARCHAR(400)) AS mensaje_error
        WHERE 1 = 0;
        RETURN;
    END

    EXEC sp_executesql N'
        SELECT TOP 200
            CAST(ID AS INT) AS id,
            CAST(DatabaseName AS NVARCHAR(128)) AS base_datos,
            CAST(ObjectName AS NVARCHAR(128)) AS objeto,
            CAST(IndexName AS NVARCHAR(128)) AS indice,
            CAST(CommandType AS NVARCHAR(60)) AS tipo_comando,
            CAST(LEFT(Command, 400) AS NVARCHAR(400)) AS comando,
            StartTime AS inicio,
            EndTime AS fin,
            CAST(DATEDIFF(SECOND, StartTime, EndTime) AS INT) AS duracion_segundos,
            CAST(ErrorNumber AS INT) AS numero_error,
            CAST(LEFT(ErrorMessage, 400) AS NVARCHAR(400)) AS mensaje_error
        FROM MaintenanceDB.dbo.CommandLog
        ORDER BY ID DESC;';
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\21_caja_reportes_y_abonos.sql
CREATE OR ALTER PROCEDURE dbo.sp_cajero_aplicar_pago
 @id_factura INT,@monto_pago DECIMAL(18,2),@id_medio_pago INT,
 @comprobante VARCHAR(50),@id_usuario_cajero INT,@id_reporte_asociado INT=NULL,
 @nuevo_id_pago INT OUTPUT
AS
BEGIN
 SET NOCOUNT ON;
 SET XACT_ABORT ON;
 BEGIN TRY
  IF @monto_pago IS NULL OR @monto_pago<=0 THROW 50013,'El monto debe ser mayor que cero.',1;
  SET @comprobante=LTRIM(RTRIM(@comprobante));
  IF NULLIF(@comprobante,'') IS NULL THROW 50013,'Debe ingresar la referencia o comprobante.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.Usuario WHERE id_usuario=@id_usuario_cajero AND activo=1)
   THROW 50070,'El funcionario no esta activo.',1;
  DECLARE @medio VARCHAR(100);
  SELECT @medio=nombre_medio_pago FROM dbo.Medio_Pago WHERE id_medio_pago=@id_medio_pago;
  IF @medio IS NULL THROW 50071,'Seleccione un medio de pago valido.',1;
  BEGIN TRANSACTION;
  DECLARE @saldo DECIMAL(18,2),@total DECIMAL(18,2),@estado VARCHAR(30),@deuda INT,@finca INT,
   @contribuyente INT,@cantidad INT;
  SELECT @saldo=CAST(saldo_pendiente AS DECIMAL(18,2)),@total=CAST(total_a_pagar AS DECIMAL(18,2)),
   @estado=estado_factura,@deuda=id_deuda_municipal
  FROM dbo.Factura WITH(UPDLOCK,HOLDLOCK) WHERE id_factura=@id_factura;
  IF @saldo IS NULL THROW 50072,'La factura no existe.',1;
  IF UPPER(@estado)='ANULADA' OR @saldo<=0 THROW 50015,'La factura no admite pagos.',1;
  IF @monto_pago>@saldo THROW 50014,'El pago supera el saldo pendiente.',1;
  SELECT @finca=id_inmueble FROM dbo.Deudas_Municipales WHERE id_deuda_municipal=@deuda;
  IF @id_reporte_asociado IS NOT NULL
  BEGIN
   DECLARE @rFactura INT,@rMonto DECIMAL(18,2),@rReferencia VARCHAR(50),@rEstado VARCHAR(30);
   SELECT @rFactura=id_factura,@contribuyente=id_contribuyente,@rMonto=monto,
    @rReferencia=comprobante,@rEstado=estado
   FROM dbo.Reporte_Transferencia_Ciudadana WITH(UPDLOCK,HOLDLOCK)
   WHERE id_reporte_transferencia=@id_reporte_asociado;
   IF @rFactura IS NULL OR @rFactura<>@id_factura OR @rEstado<>'PENDIENTE_VERIFICACION'
    THROW 50073,'El reporte no pertenece a la factura o ya fue procesado.',1;
   IF @rMonto<>@monto_pago OR @rReferencia<>@comprobante
    THROW 50073,'Monto y comprobante deben coincidir con el reporte seleccionado.',1;
   IF UPPER(@medio) NOT LIKE '%SINPE%' AND UPPER(@medio) NOT LIKE '%TRANSFER%'
    THROW 50073,'Un reporte bancario requiere medio SINPE o transferencia.',1;
   IF NOT EXISTS(SELECT 1 FROM dbo.Derecho_Inmueble WHERE id_inmueble=@finca AND id_contribuyente=@contribuyente)
    THROW 50073,'El contribuyente del reporte no esta vinculado al inmueble.',1;
  END
  ELSE
  BEGIN
   SELECT @cantidad=COUNT(DISTINCT id_contribuyente),@contribuyente=MIN(id_contribuyente)
   FROM dbo.Derecho_Inmueble WHERE id_inmueble=@finca;
   IF @cantidad<>1 THROW 50073,'Para copropiedad o ausencia de titular debe identificar al pagador mediante un reporte verificado.',1;
  END;
  IF EXISTS(SELECT 1 FROM dbo.Pago_Municipal WITH(UPDLOCK,HOLDLOCK) WHERE comprobante=@comprobante)
   THROW 50011,'El comprobante ya fue registrado. No se creo otro pago.',1;
  -- Distribucion del abono: intereses, recargos y principal; descuentos sobre principal.
  DECLARE @interes DECIMAL(18,2),@recargo DECIMAL(18,2),@principal DECIMAL(18,2),
   @abonadoI DECIMAL(18,2),@abonadoR DECIMAL(18,2),@abonadoP DECIMAL(18,2);
  SELECT @interes=CAST(monto_intereses AS DECIMAL(18,2)),@recargo=CAST(monto_multas AS DECIMAL(18,2))
  FROM dbo.Deudas_Municipales WHERE id_deuda_municipal=@deuda;
  SET @principal=@total-@interes-@recargo;
  SELECT @abonadoI=CAST(ISNULL(SUM(monto_aplicado_interes),0) AS DECIMAL(18,2)),
   @abonadoR=CAST(ISNULL(SUM(monto_aplicado_recargo),0) AS DECIMAL(18,2)),
   @abonadoP=CAST(ISNULL(SUM(monto_aplicado_principal),0) AS DECIMAL(18,2))
  FROM dbo.Detalle_Factura WHERE id_factura=@id_factura;
  SET @interes=@interes-@abonadoI; SET @recargo=@recargo-@abonadoR; SET @principal=@principal-@abonadoP;
  IF @interes<0 OR @recargo<0 OR @principal<0 OR ABS(@interes+@recargo+@principal-@saldo)>0.01
   THROW 50074,'La composicion de la factura requiere revision antes de aplicar el pago.',1;
  DECLARE @aplicaI DECIMAL(18,2),@aplicaR DECIMAL(18,2),@aplicaP DECIMAL(18,2),@resto DECIMAL(18,2);
  SET @aplicaI=CASE WHEN @monto_pago<@interes THEN @monto_pago ELSE @interes END;
  SET @resto=@monto_pago-@aplicaI;
  SET @aplicaR=CASE WHEN @resto<@recargo THEN @resto ELSE @recargo END;
  SET @aplicaP=@resto-@aplicaR;
  INSERT dbo.Pago_Municipal(monto_total_pagado,fecha_pago,comprobante,id_medio_pago,id_contribuyente)
  VALUES(@monto_pago,GETDATE(),@comprobante,@id_medio_pago,@contribuyente);
  SET @nuevo_id_pago=SCOPE_IDENTITY();
  INSERT dbo.Detalle_Factura(id_factura,id_pago_municipal,monto_aplicado_principal,monto_aplicado_interes,monto_aplicado_recargo)
  VALUES(@id_factura,@nuevo_id_pago,@aplicaP,@aplicaI,@aplicaR);
  IF @id_reporte_asociado IS NOT NULL
   UPDATE dbo.Reporte_Transferencia_Ciudadana SET estado='APLICADO',id_usuario_verificador=@id_usuario_cajero,
    fecha_verificacion=GETDATE(),id_pago_municipal=@nuevo_id_pago
   WHERE id_reporte_transferencia=@id_reporte_asociado;
  IF NOT EXISTS(SELECT 1 FROM dbo.Factura WHERE id_deuda_municipal=@deuda AND saldo_pendiente>0 AND UPPER(estado_factura)<>'ANULADA')
  BEGIN
   DECLARE @pag INT;
   SELECT @pag=id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda='PAG';
   IF @pag IS NULL THROW 50010,'No esta configurado el estado PAG para la deuda.',1;
   UPDATE dbo.Deudas_Municipales SET id_estado_deuda=@pag WHERE id_deuda_municipal=@deuda;
  END;
  COMMIT;
 END TRY
 BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\19_cotejo_documental_real.sql
CREATE OR ALTER PROCEDURE dbo.sp_consultar_cotejo_requisitos @id_tramite INT
AS
BEGIN
 SET NOCOUNT ON;
 IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite=@id_tramite)
  THROW 50024, 'El expediente no existe.', 1;
 SELECT r.id_requisito, r.nombre_requisito, r.es_obligatorio,
        a.id_archivo_adjunto, a.nombre_original,
        CAST(CASE WHEN a.id_archivo_adjunto IS NULL THEN 'PENDIENTE'
             ELSE ISNULL(rv.estado, 'PRESENTADO') END AS VARCHAR(20)) AS estado_revision,
        rv.observacion, rv.fecha_revision, u.user_name AS usuario_revisor
 FROM dbo.Tramite t
 INNER JOIN dbo.Tipo_Tramite_Requisito tr ON tr.id_tipo_tramite=t.id_tipo_tramite
 INNER JOIN dbo.Requisito r ON r.id_requisito=tr.id_requisito
 OUTER APPLY (
  SELECT TOP (1) aa.id_archivo_adjunto, aa.nombre_original
  FROM dbo.Archivo_Adjunto aa
  WHERE aa.id_tramite=t.id_tramite AND aa.id_requisito=r.id_requisito
  ORDER BY aa.id_archivo_adjunto DESC
 ) a
 OUTER APPLY (
  SELECT TOP (1) rr.estado, rr.observacion, rr.fecha_revision, rr.id_usuario
  FROM dbo.Revision_Archivo_Requisito rr
  WHERE rr.id_archivo_adjunto=a.id_archivo_adjunto ORDER BY rr.id_revision DESC
 ) rv
 LEFT JOIN dbo.Usuario u ON u.id_usuario=rv.id_usuario
 WHERE t.id_tramite=@id_tramite
 ORDER BY r.es_obligatorio DESC, r.id_requisito;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\19_cotejo_documental_real.sql
CREATE OR ALTER PROCEDURE dbo.sp_revisar_archivo_requisito
 @id_tramite INT, @id_archivo_adjunto INT, @estado VARCHAR(20),
 @observacion VARCHAR(255), @id_usuario INT
AS
BEGIN
 SET NOCOUNT ON;
 SET XACT_ABORT ON;
 BEGIN TRY
  IF @estado IS NULL OR @estado NOT IN ('VALIDADO','SUBSANAR')
   THROW 50008, 'Resultado de revision no permitido.', 1;
  IF NULLIF(LTRIM(RTRIM(@observacion)), '') IS NULL
   THROW 50022, 'Debe justificar la revision.', 1;
  IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario=@id_usuario AND activo=1)
   THROW 50070, 'El funcionario no esta activo.', 1;
  BEGIN TRANSACTION;
  DECLARE @tipo INT, @final DATETIME, @req INT;
  SELECT @tipo=id_tipo_tramite, @final=fecha_resolucion_final
  FROM dbo.Tramite WITH (UPDLOCK,HOLDLOCK) WHERE id_tramite=@id_tramite;
  IF @tipo IS NULL THROW 50024, 'El expediente no existe.', 1;
  IF @final IS NOT NULL THROW 50018, 'El expediente esta cerrado.', 1;
  SELECT @req=id_requisito FROM dbo.Archivo_Adjunto
  WHERE id_archivo_adjunto=@id_archivo_adjunto AND id_tramite=@id_tramite;
  IF @req IS NULL OR NOT EXISTS (
   SELECT 1 FROM dbo.Tipo_Tramite_Requisito WHERE id_tipo_tramite=@tipo AND id_requisito=@req
  ) THROW 50024, 'El archivo no corresponde a un requisito del expediente.', 1;
  IF EXISTS (SELECT 1 FROM dbo.Archivo_Adjunto WITH (UPDLOCK,HOLDLOCK)
   WHERE id_tramite=@id_tramite AND id_requisito=@req AND id_archivo_adjunto>@id_archivo_adjunto)
   THROW 50024, 'Existe una version mas reciente. Actualice el cotejo antes de revisar.', 1;
  INSERT dbo.Revision_Archivo_Requisito(id_archivo_adjunto,estado,observacion,id_usuario)
  VALUES(@id_archivo_adjunto,@estado,@observacion,@id_usuario);
  -- La solicitud de correccion queda visible en el historial ciudadano.
  IF @estado='SUBSANAR'
  BEGIN
   DECLARE @nombre VARCHAR(255), @mensaje VARCHAR(255);
   SELECT @nombre=nombre_requisito FROM dbo.Requisito WHERE id_requisito=@req;
   SET @mensaje=LEFT(CONCAT('Corregir ',@nombre,': ',@observacion),255);
   EXEC dbo.sp_cambiar_estado_tramite @id_tramite=@id_tramite,
    @codigo_estado='DOC',@observaciones=@mensaje,@id_usuario=@id_usuario;
  END;
  COMMIT;
 END TRY
 BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\21_caja_reportes_y_abonos.sql
CREATE OR ALTER PROCEDURE dbo.sp_caja_facturas_pendientes
AS
BEGIN
 SET NOCOUNT ON;
 SELECT f.id_factura,f.id_deuda_municipal,
  ISNULL(pr.contribuyentes, 'Sin propietario asociado') AS contribuyentes,
  bi.numero_finca,tt.nombre_tributo,dm.periodo_deuda,dm.fecha_de_vencimiento,
  CAST(f.total_a_pagar AS DECIMAL(18,2)) AS total_a_pagar,
  CAST(f.saldo_pendiente AS DECIMAL(18,2)) AS saldo_pendiente,f.estado_factura
 FROM dbo.Factura f
 JOIN dbo.Deudas_Municipales dm ON dm.id_deuda_municipal=f.id_deuda_municipal
 JOIN dbo.Bien_Inmueble bi ON bi.id_inmueble=dm.id_inmueble
 JOIN dbo.Tipo_Tributo tt ON tt.id_tipo_tributo=dm.id_tipo_tributo
 OUTER APPLY (
  SELECT STRING_AGG(CAST(CONCAT(p.nombre_o_razon_social,' (#',p.id_contribuyente,')') AS NVARCHAR(MAX)), ', ') AS contribuyentes
  FROM (SELECT DISTINCT id_contribuyente FROM dbo.Derecho_Inmueble WHERE id_inmueble=bi.id_inmueble) di
  JOIN dbo.vw_padron_contribuyentes p ON p.id_contribuyente=di.id_contribuyente
 ) pr
 WHERE f.saldo_pendiente>0 AND UPPER(f.estado_factura)<>'ANULADA'
 ORDER BY f.id_factura DESC;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\21_caja_reportes_y_abonos.sql
CREATE OR ALTER PROCEDURE dbo.sp_caja_reportes_pendientes
AS
BEGIN
 SET NOCOUNT ON;
 SELECT r.id_reporte_transferencia,r.id_factura,r.id_contribuyente,
  CAST(ISNULL(p.nombre_o_razon_social,'Contribuyente no disponible') AS NVARCHAR(4000)) AS contribuyente,
  r.comprobante,CAST(r.monto AS DECIMAL(18,2)) AS monto,r.fecha_reporte,r.estado
 FROM dbo.Reporte_Transferencia_Ciudadana r
 LEFT JOIN dbo.vw_padron_contribuyentes p ON p.id_contribuyente=r.id_contribuyente
 WHERE r.estado='PENDIENTE_VERIFICACION'
 ORDER BY r.fecha_reporte,r.id_reporte_transferencia;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\22_integridad_y_reglas_inmueble.sql
CREATE OR ALTER PROCEDURE dbo.sp_configurar_inmueble_tramite
 @id_tipo_tramite INT,@requiere_inmueble BIT,@motivo NVARCHAR(255),@id_usuario INT
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 BEGIN TRY
  IF @requiere_inmueble IS NULL OR NULLIF(LTRIM(RTRIM(@motivo)),'') IS NULL
   THROW 50022,'Defina la regla de inmueble y su justificacion.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.Usuario WHERE id_usuario=@id_usuario AND activo=1)
   THROW 50070,'El funcionario no esta activo.',1;
  BEGIN TRANSACTION;
  DECLARE @tipo INT;
  SELECT @tipo=id_tipo_tramite FROM dbo.Tipo_Tramite WITH(UPDLOCK,HOLDLOCK) WHERE id_tipo_tramite=@id_tipo_tramite;
  IF @tipo IS NULL THROW 50024,'El tipo de tramite no existe.',1;
  UPDATE dbo.Configuracion_Inmueble_Tramite SET requiere_inmueble=@requiere_inmueble,motivo=@motivo,
   id_usuario=@id_usuario,fecha_configuracion=GETDATE() WHERE id_tipo_tramite=@id_tipo_tramite;
  IF @@ROWCOUNT=0 INSERT dbo.Configuracion_Inmueble_Tramite(id_tipo_tramite,requiere_inmueble,motivo,id_usuario)
   VALUES(@id_tipo_tramite,@requiere_inmueble,@motivo,@id_usuario);
  INSERT dbo.Historial_Configuracion_Inmueble(id_tipo_tramite,requiere_inmueble,motivo,id_usuario)
   VALUES(@id_tipo_tramite,@requiere_inmueble,@motivo,@id_usuario);
  COMMIT;
 END TRY
 BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\definicion_recuperada_SSMS.sql
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

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\definicion_recuperada_SSMS.sql
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
