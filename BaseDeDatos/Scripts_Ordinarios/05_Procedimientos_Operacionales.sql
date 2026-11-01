/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 05: PROCEDIMIENTOS ALMACENADOS OPERACIONALES Y DE GESTIÓN
   (MÓDULOS: GCBI, GTA, CPG, AURP, RAA, GRI)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- 1. GESTIÓN DE CONTRIBUYENTES Y BIENES INMUEBLES (GCBI-01 A GCBI-12)
-- ============================================================================

-- GCBI-01: sp_registrar_contribuyente_fisico
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

-- GCBI-02: sp_registrar_contribuyente_juridico
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

-- GCBI-03: sp_consultar_contribuyente
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

-- GCBI-04: sp_actualizar_contribuyente
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_contribuyente
    @id_contribuyente INT,
    @correo_electronico VARCHAR(100),
    @telefono VARCHAR(20),
    @direccion_notificaciones VARCHAR(255),
    @estado_contribuyente BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE dbo.Contribuyente
        SET correo_electronico = @correo_electronico,
            telefono = @telefono,
            direccion_notificaciones = @direccion_notificaciones,
            estado_contribuyente = @estado_contribuyente
        WHERE id_contribuyente = @id_contribuyente;

        IF @@ROWCOUNT = 0
            THROW 50003, 'Error: El contribuyente especificado no existe.', 1;

        PRINT '-> Padrón de contribuyente actualizado correctamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GCBI-05: sp_registrar_representante_legal
CREATE OR ALTER PROCEDURE dbo.sp_registrar_representante_legal
    @nombre_representante    VARCHAR(50),
    @apellido1_representante VARCHAR(50),
    @apellido2_representante VARCHAR(50),
    @tomo_folio_registro     VARCHAR(30),
    @cedula_representante    VARCHAR(20),
    @fecha_vencimiento_poder DATETIME,
    @id_contribuyente_juridico INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Contribuyente_Juridico WHERE id_contribuyente_juridico = @id_contribuyente_juridico)
            THROW 50004, 'Error: No existe el contribuyente jurídico indicado.', 1;

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

-- GCBI-06: sp_registrar_inmueble
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

-- GCBI-07: sp_consultar_inmueble
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

-- GCBI-08: sp_actualizar_inmueble
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
        UPDATE dbo.Bien_Inmueble
        SET direccion_exacta = @direccion_exacta,
            area_terreno_m2 = @area_terreno_m2,
            area_construccion_m2 = @area_construccion_m2,
            valor_fiscal = @valor_fiscal,
            plano_catastrado = @plano_catastrado,
            id_tipo_uso_inmueble = @id_tipo_uso_inmueble
        WHERE id_inmueble = @id_inmueble;

        IF @@ROWCOUNT = 0
            THROW 50006, 'Error: Inmueble no encontrado.', 1;

        PRINT '-> Inmueble actualizado exitosamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GCBI-09: sp_asignar_derecho_inmueble
CREATE OR ALTER PROCEDURE dbo.sp_asignar_derecho_inmueble
    @id_inmueble INT,
    @id_contribuyente INT,
    @porcentaje_participacion FLOAT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @suma_actual FLOAT = 0;
        SELECT @suma_actual = ISNULL(SUM(porcentaje_participacion), 0)
        FROM dbo.Derecho_Inmueble
        WHERE id_inmueble = @id_inmueble;

        IF (@suma_actual + @porcentaje_participacion) > 100.0001
            THROW 50007, 'Error: La suma de derechos para el inmueble excede el 100%.', 1;

        INSERT INTO dbo.Derecho_Inmueble (id_inmueble, id_contribuyente, porcentaje_participacion, fecha_adquisicion)
        VALUES (@id_inmueble, @id_contribuyente, @porcentaje_participacion, GETDATE());

        PRINT '-> Derecho de copropiedad asignado correctamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GCBI-10: sp_consultar_inmuebles_por_contribuyente
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

-- GCBI-11: sp_consultar_distritos
CREATE OR ALTER PROCEDURE dbo.sp_consultar_distritos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_distrito, codigo_distrital, nombre_distrito
    FROM dbo.Distrito
    ORDER BY id_distrito;
END;
GO

-- GCBI-12: sp_consultar_tipos_uso_inmueble
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_uso_inmueble
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_uso_inmueble, codigo_uso, descripcion
    FROM dbo.Tipo_Uso_Inmueble
    ORDER BY id_tipo_uso_inmueble;
END;
GO

-- ============================================================================
-- 2. GESTIÓN DE TRÁMITES Y PERMISOS (GTA-01 A GTA-16)
-- ============================================================================

-- GTA-01: sp_registrar_tipo_tramite
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tipo_tramite
    @nombre_tramite      VARCHAR(100),
    @descripcion_tipo    VARCHAR(255),
    @dias_resolucion_max INT,
    @id_departamento     INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Tipo_Tramite (nombre_tramite, descripcion_tipo, dias_resolucion_max, id_departamento)
    VALUES (@nombre_tramite, @descripcion_tipo, @dias_resolucion_max, @id_departamento);
    PRINT '-> Tipo de trámite creado.';
END;
GO

-- GTA-02: sp_actualizar_tipo_tramite
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_tipo_tramite
    @id_tipo_tramite     INT,
    @nombre_tramite      VARCHAR(100),
    @descripcion_tipo    VARCHAR(255),
    @dias_resolucion_max INT,
    @id_departamento     INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Tipo_Tramite
    SET nombre_tramite = @nombre_tramite,
        descripcion_tipo = @descripcion_tipo,
        dias_resolucion_max = @dias_resolucion_max,
        id_departamento = @id_departamento
    WHERE id_tipo_tramite = @id_tipo_tramite;
    PRINT '-> Tipo de trámite actualizado.';
END;
GO

-- GTA-03: sp_consultar_tipos_tramite
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_tramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT tt.*, dep.nombre_departamento
    FROM dbo.Tipo_Tramite tt
    INNER JOIN dbo.Departamento dep ON tt.id_departamento = dep.id_departamento;
END;
GO

-- GTA-04: sp_registrar_requisito
CREATE OR ALTER PROCEDURE dbo.sp_registrar_requisito
    @nombre_requisito VARCHAR(255),
    @descripcion      VARCHAR(500),
    @es_obligatorio   BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Requisito (nombre_requisito, descripcion, es_obligatorio)
    VALUES (@nombre_requisito, @descripcion, @es_obligatorio);
    PRINT '-> Requisito creado con ID: ' + CAST(SCOPE_IDENTITY() AS VARCHAR(10));
END;
GO

-- GTA-05: sp_configurar_requisito_tramite
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

-- GTA-06: sp_consultar_requisitos_por_tipo_tramite
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

-- GTA-07: sp_registrar_tramite
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tramite
    @numero_expediente   VARCHAR(30),
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

        DECLARE @dias_max INT;
        SELECT @dias_max = dias_resolucion_max FROM dbo.Tipo_Tramite WHERE id_tipo_tramite = @id_tipo_tramite;

        DECLARE @estimada DATETIME = DATEADD(DAY, @dias_max, GETDATE());

        INSERT INTO dbo.Tramite 
        (numero_expediente, fecha_radicacion, fecha_resolucion_estimada, id_tipo_tramite, id_usuario, id_inmueble, id_contribuyente)
        VALUES
        (@numero_expediente, GETDATE(), @estimada, @id_tipo_tramite, @id_usuario, @id_inmueble, @id_contribuyente);

        SET @nuevo_id_tramite = SCOPE_IDENTITY();

        -- Inicializar historial en estado REC (Recibido / Radicado)
        DECLARE @id_estado_inicial INT;
        SELECT @id_estado_inicial = id_estado FROM dbo.Estado_Tramite WHERE codigo = 'REC';

        IF @id_estado_inicial IS NOT NULL
        BEGIN
            INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite)
            VALUES (GETDATE(), 'Radicación inicial del expediente', @nuevo_id_tramite, @id_estado_inicial);
        END

        COMMIT TRANSACTION;
        PRINT '-> Trámite radicado exitosamente con ID: ' + CAST(@nuevo_id_tramite AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- GTA-08: sp_consultar_tramite
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

-- GTA-09: sp_actualizar_tramite
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_tramite
    @id_tramite   INT,
    @id_usuario   INT,
    @id_inmueble  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Tramite
    SET id_usuario = @id_usuario,
        id_inmueble = @id_inmueble
    WHERE id_tramite = @id_tramite;
    PRINT '-> Trámite actualizado.';
END;
GO

-- GTA-10: sp_registrar_requisito_presentado (Alias/Especialización de adjuntar archivo con requisito)
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

-- GTA-11: sp_adjuntar_archivo_tramite
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

-- GTA-12: sp_cambiar_estado_tramite
CREATE OR ALTER PROCEDURE dbo.sp_cambiar_estado_tramite
    @id_tramite       INT,
    @codigo_estado    VARCHAR(20),
    @observaciones    VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estado FROM dbo.Estado_Tramite WHERE codigo = @codigo_estado;

        IF @id_estado IS NULL
            THROW 50008, 'Error: Código de estado de trámite no reconocido.', 1;

        INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite)
        VALUES (GETDATE(), @observaciones, @id_tramite, @id_estado);

        PRINT '-> Transición de estado registrada en el historial del expediente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GTA-13: sp_consultar_estados_tramite
CREATE OR ALTER PROCEDURE dbo.sp_consultar_estados_tramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_estado, codigo, nombre_estado
    FROM dbo.Estado_Tramite
    ORDER BY id_estado;
END;
GO

-- GTA-14: sp_consultar_historial_tramite
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

-- GTA-15: sp_registrar_resolucion_tramite
CREATE OR ALTER PROCEDURE dbo.sp_registrar_resolucion_tramite
    @id_tramite       INT,
    @codigo_estado    VARCHAR(20), -- APR o RECH
    @observaciones    VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        EXEC dbo.sp_cambiar_estado_tramite @id_tramite = @id_tramite, @codigo_estado = @codigo_estado, @observaciones = @observaciones;

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

-- GTA-16: sp_consultar_tramites_por_contribuyente
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

-- ============================================================================
-- 3. CONTROL DE COBROS Y PAGOS (CPG-01 A CPG-12)
-- ============================================================================

-- CPG-01: sp_consultar_tipos_tributo
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_tributo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_tributo, codigo_tributo, nombre_tributo, base_calculo, tarifa, monto_fijo, periodicidad
    FROM dbo.Tipo_Tributo;
END;
GO

-- CPG-02: sp_registrar_deuda_municipal
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

-- CPG-03: sp_consultar_deudas_contribuyente
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

-- CPG-04: sp_actualizar_estado_deuda
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_estado_deuda
    @id_deuda_municipal INT,
    @codigo_estado_deuda VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda = @codigo_estado_deuda;

        IF @id_estado IS NULL
            THROW 50010, 'Error: Estado de deuda no encontrado.', 1;

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

-- CPG-05: sp_generar_factura
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

-- CPG-06: sp_consultar_factura
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

-- CPG-07: sp_consultar_facturas_contribuyente
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

-- CPG-08: sp_consultar_medios_pago
CREATE OR ALTER PROCEDURE dbo.sp_consultar_medios_pago
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_medio_pago, nombre_medio_pago
    FROM dbo.Medio_Pago;
END;
GO

-- CPG-09: sp_registrar_pago_municipal
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

-- CPG-10: sp_aplicar_pago_factura
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

-- CPG-11: sp_calcular_recargos_intereses
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

-- CPG-12: sp_consultar_estado_cuenta
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

-- ============================================================================
-- 4. ADMINISTRACIÓN DE USUARIOS, ROLES Y PERMISOS (AURP-01 A AURP-09)
-- ============================================================================

-- AURP-01: sp_registrar_usuario
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

-- AURP-02: sp_consultar_usuario
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

-- AURP-03: sp_actualizar_usuario
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
    UPDATE dbo.Usuario
    SET nombre_usuario = @nombre_usuario,
        apellido1_usuario = @apellido1_usuario,
        apellido2_usuario = @apellido2_usuario,
        email_usuario = @email_usuario,
        id_departamento = @id_departamento
    WHERE id_usuario = @id_usuario;
    PRINT '-> Usuario actualizado.';
END;
GO

-- AURP-04: sp_cambiar_estado_usuario
CREATE OR ALTER PROCEDURE dbo.sp_cambiar_estado_usuario
    @id_usuario INT,
    @activo     BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Usuario
    SET activo = @activo
    WHERE id_usuario = @id_usuario;
    PRINT '-> Estado de cuenta de usuario modificado.';
END;
GO

-- AURP-05: sp_registrar_rol
CREATE OR ALTER PROCEDURE dbo.sp_registrar_rol
    @nombre_rol VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE nombre_rol = @nombre_rol)
    BEGIN
        INSERT INTO dbo.Rol (nombre_rol) VALUES (@nombre_rol);
        PRINT '-> Rol registrado.';
    END
END;
GO

-- AURP-06: sp_registrar_permiso
CREATE OR ALTER PROCEDURE dbo.sp_registrar_permiso
    @modulo VARCHAR(50),
    @accion VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Permiso WHERE modulo = @modulo AND accion = @accion)
    BEGIN
        INSERT INTO dbo.Permiso (modulo, accion) VALUES (@modulo, @accion);
        PRINT '-> Permiso registrado.';
    END
END;
GO

-- AURP-07: sp_asignar_rol_usuario
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

-- AURP-08: sp_asignar_permiso_rol
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

-- AURP-09: sp_consultar_roles_permisos_usuario
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

-- ============================================================================
-- 5. REGISTRO DE ACCIONES Y AUDITORÍA (RAA-01 A RAA-05)
-- ============================================================================

-- RAA-01: sp_registrar_tipo_accion_auditoria
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

-- RAA-02: sp_registrar_auditoria
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

-- RAA-03: sp_consultar_auditoria
CREATE OR ALTER PROCEDURE dbo.sp_consultar_auditoria
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 500 *
    FROM dbo.vw_auditoria_detallada
    ORDER BY fecha_hora DESC;
END;
GO

-- RAA-04: sp_filtrar_auditoria
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

-- RAA-05: sp_consultar_auditoria_registro
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

-- ============================================================================
-- 6. GENERACIÓN DE REPORTES E INDICADORES (GRI-01 A GRI-07)
-- ============================================================================

-- GRI-01: sp_reporte_historial_tramites_contribuyente
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

-- GRI-02: sp_reporte_recaudacion_tributo
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

-- GRI-03: sp_reporte_recaudacion_distrito
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

-- GRI-04: sp_reporte_contribuyentes_morosos
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

-- GRI-05: sp_reporte_solicitudes_departamento
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

-- GRI-06: sp_reporte_eficiencia_tramites
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

-- GRI-07: sp_reporte_gestion_municipal
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

PRINT '-> Procedimientos almacenados operacionales (GCBI, GTA, CPG, AURP, RAA, GRI) creados exitosamente.';
GO
