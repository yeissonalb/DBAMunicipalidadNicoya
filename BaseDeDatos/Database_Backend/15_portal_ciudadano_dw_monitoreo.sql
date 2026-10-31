/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 15: PENDIENTES DEL BACKEND / FRONTEND (HITO 3)
   ----------------------------------------------------------------------------
   Requiere: Scripts_Ordinarios (MASTER) + 13 + 14 ya ejecutados.
   Opcional : DataWareHouse\*.sql (MunicipalidadNicoyaDataMart2026) y
              PlanDeMantenimientoBD\*.sql (MaintenanceDB). Si no existen, los SP
              de este script responden con un error controlado o con un
              mecanismo alterno, nunca con un error 500.
   Re-ejecutable (CREATE OR ALTER / IF NOT EXISTS).

   A. Portal ciudadano (wireframe p. 113)
      Tabla  dbo.Cuenta_Ciudadana
      SP     sp_activar_cuenta_ciudadana, sp_autenticar_ciudadano,
             sp_ciudadano_historial_tramite, sp_ciudadano_requisitos_tramite,
             sp_ciudadano_archivos_tramite, sp_ciudadano_adjuntar_requisito,
             sp_ciudadano_pagar_factura_sinpe

   B. Expedientes: archivos y requisitos de un trámite existente
      SP     sp_consultar_archivos_tramite, sp_consultar_requisitos_tramite

   C. Seguridad RBAC: revocación y consultas completas
      SP     sp_revocar_rol_usuario, sp_revocar_permiso_rol,
             sp_consultar_permisos_por_rol, sp_consultar_asignaciones_roles

   D. Data Warehouse (CU-DW-01..05) desde la API
      Tabla  dbo.Control_Cargas_ETL (bitácora CU-DW-05)
      SP     sp_dw_estado, sp_dw_ejecutar_etl, sp_dw_historial_cargas,
             sp_dw_recaudacion_periodo, sp_dw_recaudacion_tributo,
             sp_dw_recaudacion_ubicacion, sp_dw_morosidad,
             sp_dw_eficiencia_tramites, sp_dw_indicadores_departamento

   E. Monitoreo y mantenimiento DBA (CU-DBA-04, CU-DBA-06)
      SP     sp_dba_monitor_resumen, sp_dba_monitor_sesiones,
             sp_dba_monitor_archivos, sp_dba_monitor_fragmentacion,
             sp_dba_terminar_sesion, sp_dba_ejecutar_mantenimiento,
             sp_dba_historial_mantenimiento

   Códigos de error nuevos (rangos del SqlExceptionMiddleware):
     400: 50013 monto inválido · 50014 monto supera saldo · 50015 factura no pendiente
          50016 sesión no terminable · 50017 requisito no corresponde al trámite
          50018 trámite ya resuelto
     404: 50030 trámite no pertenece al contribuyente · 50031 factura no pertenece
          50032 rol no asignado · 50033 permiso no asignado
          50034 Data Warehouse no instalado · 50035 sesión inexistente
     409: 50044 último administrador · 50045 cuenta ciudadana ya activa
          50047 comprobante SINPE duplicado
     403: 50064 credenciales ciudadanas · 50065 cuenta ciudadana inactiva
          50066 datos de activación no coinciden con el padrón
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- A. PORTAL CIUDADANO
-- ============================================================================

IF OBJECT_ID('dbo.Cuenta_Ciudadana', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Cuenta_Ciudadana
    (
        id_cuenta_ciudadana INT            IDENTITY(1,1) NOT NULL,
        id_contribuyente    INT            NOT NULL,
        password_hash       NVARCHAR(255)  NOT NULL,
        activa              BIT            NOT NULL CONSTRAINT DF_Cuenta_Ciudadana_activa DEFAULT (1),
        fecha_activacion    DATETIME       NOT NULL CONSTRAINT DF_Cuenta_Ciudadana_fecha DEFAULT (GETDATE()),
        ultimo_acceso       DATETIME       NULL,
        CONSTRAINT PK_Cuenta_Ciudadana PRIMARY KEY (id_cuenta_ciudadana),
        CONSTRAINT UQ_Cuenta_Ciudadana_contribuyente UNIQUE (id_contribuyente),
        CONSTRAINT FK_Cuenta_Ciudadana_Contribuyente FOREIGN KEY (id_contribuyente) REFERENCES dbo.Contribuyente(id_contribuyente)
    ) ON FG_Seguridad;
    PRINT '-> Tabla dbo.Cuenta_Ciudadana creada.';
END
GO

-- A.1 Activación de cuenta (autoservicio): la cédula y el correo deben coincidir con el padrón
CREATE OR ALTER PROCEDURE dbo.sp_activar_cuenta_ciudadana
    @identificacion      VARCHAR(20),
    @correo_electronico  VARCHAR(100),
    @password_hash       VARCHAR(255),
    @nuevo_id_cuenta     INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_contribuyente INT;

        SELECT @id_contribuyente = c.id_contribuyente
        FROM dbo.Contribuyente c
        LEFT JOIN dbo.Contribuyente_Fisico cf ON c.id_contribuyente = cf.id_contribuyente
        LEFT JOIN dbo.Contribuyente_Juridico cj ON c.id_contribuyente = cj.id_contribuyente
        WHERE ISNULL(cf.cedula_identidad, cj.cedula_juridica) = @identificacion
          AND LOWER(c.correo_electronico) = LOWER(@correo_electronico)
          AND c.estado_contribuyente = 1;

        IF @id_contribuyente IS NULL
            THROW 50066, N'Error: La cédula y el correo no coinciden con un contribuyente activo del padrón municipal.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Cuenta_Ciudadana WHERE id_contribuyente = @id_contribuyente)
            THROW 50045, N'Error: Este contribuyente ya tiene una cuenta ciudadana activada.', 1;

        INSERT INTO dbo.Cuenta_Ciudadana (id_contribuyente, password_hash, activa, fecha_activacion)
        VALUES (@id_contribuyente, @password_hash, 1, GETDATE());

        SET @nuevo_id_cuenta = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- A.2 Autenticación ciudadana (cédula + contraseña SHA-256)
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

-- A.3 Historial de un trámite propio
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

-- ============================================================================
-- B. ARCHIVOS Y REQUISITOS DE UN TRÁMITE (también usados por el portal)
-- ============================================================================

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

-- Versiones del portal: validan que el trámite sea del contribuyente autenticado
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

-- A.4 Subir requisito faltante desde el portal
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

-- A.5 Pago en línea SINPE Móvil (simulado: el ciudadano reporta el comprobante)
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

-- ============================================================================
-- C. SEGURIDAD RBAC
-- ============================================================================

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

-- Todas las asignaciones usuario-rol (incluye roles sin permisos, que la vista no muestra)
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

-- ============================================================================
-- D. DATA WAREHOUSE
-- ============================================================================

IF OBJECT_ID('dbo.Control_Cargas_ETL', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Control_Cargas_ETL
    (
        id_carga          INT             IDENTITY(1,1) NOT NULL,
        fecha_inicio      DATETIME        NOT NULL CONSTRAINT DF_Control_ETL_inicio DEFAULT (GETDATE()),
        fecha_fin         DATETIME        NULL,
        estado            NVARCHAR(20)    NOT NULL,
        detalle           NVARCHAR(2000)  NULL,
        id_usuario        INT             NULL,
        CONSTRAINT PK_Control_Cargas_ETL PRIMARY KEY (id_carga),
        CONSTRAINT CK_Control_ETL_estado CHECK (estado IN ('En Ejecución', 'Exitoso', 'Con Diferencias', 'Fallido')),
        CONSTRAINT FK_Control_ETL_Usuario FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario(id_usuario)
    ) ON FG_Auditoria_DBA;
    PRINT '-> Tabla dbo.Control_Cargas_ETL creada.';
END
GO

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

-- CU-DW-04 ejecución bajo demanda + CU-DW-05 bitácora y conciliación
CREATE OR ALTER PROCEDURE dbo.sp_dw_ejecutar_etl
    @id_usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF DB_ID(N'MunicipalidadNicoyaDataMart2026') IS NULL
        THROW 50034, N'Error: El Data Warehouse (MunicipalidadNicoyaDataMart2026) no está instalado. Ejecute los scripts de BaseDeDatos/DataWareHouse.', 1;

    DECLARE @id_carga INT;
    INSERT INTO dbo.Control_Cargas_ETL (fecha_inicio, estado, id_usuario)
    VALUES (GETDATE(), 'En Ejecución', @id_usuario);
    SET @id_carga = SCOPE_IDENTITY();

    CREATE TABLE #validaciones
    (
        control        NVARCHAR(100),
        total_oltp     DECIMAL(18,2),
        total_dw       DECIMAL(18,2),
        resultado      NVARCHAR(50)
    );

    BEGIN TRY
        -- El orquestador devuelve los 3 recordsets de validación (CU-DW-05)
        INSERT INTO #validaciones (control, total_oltp, total_dw, resultado)
        EXEC (N'EXEC MunicipalidadNicoyaDataMart2026.dbo.sp_etl_ejecutar_carga_periodica;');

        DECLARE @diferencias INT = (SELECT COUNT(*) FROM #validaciones WHERE resultado NOT LIKE 'CORRECTO%');

        UPDATE dbo.Control_Cargas_ETL
        SET fecha_fin = GETDATE(),
            estado = CASE WHEN @diferencias = 0 THEN 'Exitoso' ELSE 'Con Diferencias' END,
            detalle = LEFT((SELECT STRING_AGG(CONCAT(control, ': ', resultado), ' | ') FROM #validaciones), 2000)
        WHERE id_carga = @id_carga;
    END TRY
    BEGIN CATCH
        DECLARE @msg NVARCHAR(2000) = LEFT(ERROR_MESSAGE(), 2000);
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        UPDATE dbo.Control_Cargas_ETL
        SET fecha_fin = GETDATE(), estado = 'Fallido', detalle = @msg
        WHERE id_carga = @id_carga;
        THROW;
    END CATCH

    SELECT
        @id_carga AS id_carga,
        v.control,
        v.total_oltp,
        v.total_dw,
        v.resultado
    FROM #validaciones v;
END;
GO

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
            CAST(dias_promedio_consumidos AS INT) AS dias_promedio_consumidos,
            CAST(cantidad_tramites AS INT) AS cantidad_tramites,
            CAST(estado_cumplimiento AS NVARCHAR(30)) AS estado_cumplimiento
        FROM MunicipalidadNicoyaDataMart2026.dbo.vw_dw_eficiencia_tramites
        ORDER BY nombre_tramite;';
END;
GO

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
            CAST(promedio_dias_resolucion_area AS INT) AS promedio_dias_resolucion_area,
            CAST(tramites_aprobados AS INT) AS tramites_aprobados,
            CAST(tramites_rechazados AS INT) AS tramites_rechazados
        FROM MunicipalidadNicoyaDataMart2026.dbo.vw_dw_indicadores_departamento
        ORDER BY volumen_total_gestionado DESC;';
END;
GO

-- ============================================================================
-- E. MONITOREO Y MANTENIMIENTO DBA (requiere VIEW SERVER STATE: usr_dba_nicoya es sysadmin)
-- ============================================================================

-- CU-DBA-04: indicadores generales de salud
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

-- CU-DBA-04: conexiones activas, consultas lentas y bloqueos
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

-- CU-DBA-04 (e): crecimiento de archivos y espacio libre en los volúmenes
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

-- CU-DBA-06 (a): diagnóstico de fragmentación
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
                WHEN ips.avg_fragmentation_in_percent >= 5 THEN N'REORGANIZE'
                ELSE N'NINGUNA'
             END AS NVARCHAR(40)) AS accion_recomendada
    FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
    INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
    WHERE i.name IS NOT NULL
      AND OBJECTPROPERTY(ips.object_id, 'IsUserTable') = 1
    ORDER BY ips.avg_fragmentation_in_percent DESC, ips.page_count DESC;
END;
GO

-- CU-DBA-04 (paso 4): terminar la sesión causante de un bloqueo
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

-- CU-DBA-06: plan de mantenimiento bajo demanda
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

    -- Índices fragmentados (>= 5 % y más de 8 páginas) antes del mantenimiento
    SELECT @antes = COUNT(*)
    FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
    INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
    WHERE i.name IS NOT NULL AND ips.avg_fragmentation_in_percent >= 5 AND ips.page_count > 8;

    -- 1) Índices
    IF @optimizar_indices = 1
    BEGIN
        SET @inicio = SYSDATETIME();
        BEGIN TRY
            IF @usar_maintenance = 1
            BEGIN
                -- SQL dinámico: el SP compila aunque MaintenanceDB no exista en el servidor
                EXEC (N'EXEC MaintenanceDB.dbo.IndexOptimize @Databases = N''MunicipalidadNicoya2026'', @UpdateStatistics = N''N'';');
            END
            ELSE
            BEGIN
                DECLARE @cmd NVARCHAR(MAX) = N'';
                SELECT @cmd += N'ALTER INDEX ' + QUOTENAME(i.name) + N' ON '
                             + QUOTENAME(OBJECT_SCHEMA_NAME(ips.object_id)) + N'.' + QUOTENAME(OBJECT_NAME(ips.object_id))
                             + CASE WHEN ips.avg_fragmentation_in_percent >= 30 THEN N' REBUILD;' ELSE N' REORGANIZE;' END
                             + CHAR(10)
                FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
                INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
                WHERE i.name IS NOT NULL AND ips.avg_fragmentation_in_percent >= 5 AND ips.page_count > 8;

                IF LEN(@cmd) > 0 EXEC sp_executesql @cmd;
            END

            SELECT @despues = COUNT(*)
            FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
            INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
            WHERE i.name IS NOT NULL AND ips.avg_fragmentation_in_percent >= 5 AND ips.page_count > 8;

            INSERT INTO #resultado (tarea, estado, detalle, duracion_segundos)
            VALUES (N'Reorganización / reconstrucción de índices', N'Completado',
                    CONCAT(N'Índices fragmentados antes: ', @antes, N' · después: ', @despues,
                           CASE WHEN @usar_maintenance = 1 THEN N' (MaintenanceDB.IndexOptimize)' ELSE N' (rutina integrada)' END),
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

PRINT '-> Script 15 aplicado: portal ciudadano, archivos/requisitos, revocación RBAC, Data Warehouse y monitoreo DBA.';
GO
