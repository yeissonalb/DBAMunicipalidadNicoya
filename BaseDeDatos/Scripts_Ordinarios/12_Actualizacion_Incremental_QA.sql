/*
    SIGEMUN - Actualizacion incremental QA 01, 02, 03 y 05

    Uso en SSMS/sqlcmd:
      1. Activar Modo SQLCMD.
      2. Para validar, conservar TargetDatabase = MunicipalidadNicoya2026_PruebaRestore.
      3. Para produccion, cambiar unicamente TargetDatabase a MunicipalidadNicoya2026.

    Este script no modifica tablas ni datos existentes. No ejecuta mantenimiento,
    respaldos, purgas, restauraciones ni trabajos de SQL Server Agent.
*/
:setvar TargetDatabase "MunicipalidadNicoya2026_PruebaRestore"

USE [$(TargetDatabase)];
GO

IF DB_NAME() NOT IN (N'MunicipalidadNicoya2026', N'MunicipalidadNicoya2026_PruebaRestore')
    THROW 51000, N'Base objetivo no autorizada para esta actualizacion incremental.', 1;

IF OBJECT_ID(N'dbo.Deudas_Municipales', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Factura', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Derecho_Inmueble', N'U') IS NULL
    THROW 51001, N'La base objetivo no contiene el esquema operacional esperado de SIGEMUN.', 1;
GO

-- QA 02: dias naturales, sin negativos y sin acumulacion para PAG/ARR.
CREATE OR ALTER FUNCTION dbo.fn_calcular_dias_mora (@id_deuda_municipal INT)
RETURNS INT
AS
BEGIN
    DECLARE @dias INT = 0;
    DECLARE @fecha_venc DATETIME;
    DECLARE @codigo_estado VARCHAR(20);

    SELECT
        @fecha_venc = dm.fecha_de_vencimiento,
        @codigo_estado = ed.codigo_estado_deuda
    FROM dbo.Deudas_Municipales dm
    INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    WHERE dm.id_deuda_municipal = @id_deuda_municipal;

    IF @fecha_venc IS NOT NULL
       AND @codigo_estado IN ('PEND', 'VENC')
       AND CAST(@fecha_venc AS DATE) < CAST(GETDATE() AS DATE)
        SET @dias = DATEDIFF(DAY, CAST(@fecha_venc AS DATE), CAST(GETDATE() AS DATE));

    RETURN @dias;
END;
GO

-- QA 03 y QA 02: valida contribuyente/finca y expone dias_mora.
CREATE OR ALTER PROCEDURE dbo.sp_registrar_deuda_municipal
    @periodo_deuda        VARCHAR(150),
    @monto_principal      FLOAT,
    @monto_intereses      FLOAT = 0,
    @monto_multas         FLOAT = 0,
    @fecha_de_vencimiento DATETIME,
    @id_contribuyente     INT,
    @id_inmueble          INT,
    @id_tipo_tributo      INT,
    @codigo_estado_deuda  VARCHAR(20) = 'PEND',
    @nuevo_id_deuda       INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estado_deuda
        FROM dbo.Estado_Deuda
        WHERE codigo_estado_deuda = @codigo_estado_deuda;

        IF @id_estado IS NULL
            THROW 50009, N'Error: Codigo de estado de deuda no valido.', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.Bien_Inmueble WHERE id_inmueble = @id_inmueble)
            THROW 50028, N'El bien inmueble seleccionado no existe.', 1;

        IF NOT EXISTS
        (
            SELECT 1
            FROM dbo.Derecho_Inmueble
            WHERE id_inmueble = @id_inmueble
              AND id_contribuyente = @id_contribuyente
        )
            THROW 50014, N'La finca seleccionada no esta asociada al contribuyente indicado.', 1;

        INSERT INTO dbo.Deudas_Municipales
            (periodo_deuda, monto_principal, monto_intereses, monto_multas,
             fecha_de_vencimiento, id_inmueble, id_tipo_tributo, id_estado_deuda)
        VALUES
            (@periodo_deuda, @monto_principal, @monto_intereses, @monto_multas,
             @fecha_de_vencimiento, @id_inmueble, @id_tipo_tributo, @id_estado);

        SET @nuevo_id_deuda = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

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
        dbo.fn_calcular_dias_mora(dm.id_deuda_municipal) AS dias_mora,
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

-- QA 01: validacion defensiva de formato antes de cualquier insercion.
CREATE OR ALTER PROCEDURE dbo.sp_generar_factura
    @id_deuda_municipal INT,
    @clave_numerica_hacienda VARCHAR(8000),
    @descuentos FLOAT = 0,
    @nuevo_id_factura INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @clave_numerica_hacienda IS NULL
           OR LEN(@clave_numerica_hacienda) <> 50
           OR @clave_numerica_hacienda LIKE '%[^0-9]%'
            THROW 50001, N'La clave numerica de Hacienda debe contener exactamente 50 digitos, sin letras, espacios ni simbolos.', 1;

        DECLARE @subtotal FLOAT;
        SELECT @subtotal = dbo.fn_calcular_total_deuda(@id_deuda_municipal);

        DECLARE @total_a_pagar FLOAT = @subtotal - @descuentos;
        IF @total_a_pagar < 0 SET @total_a_pagar = 0;

        INSERT INTO dbo.Factura
            (clave_numerica_hacienda, fecha_emision, subtotal, descuentos,
             total_a_pagar, saldo_pendiente, estado_factura, id_deuda_municipal)
        VALUES
            (@clave_numerica_hacienda, GETDATE(), @subtotal, @descuentos,
             @total_a_pagar, @total_a_pagar, 'Pendiente', @id_deuda_municipal);

        SET @nuevo_id_factura = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- QA 05: conserva el recordset existente y persiste una fila por tarea real.
CREATE OR ALTER PROCEDURE dbo.sp_dba_ejecutar_mantenimiento
    @optimizar_indices       BIT = 1,
    @actualizar_estadisticas BIT = 1,
    @purgar_respaldos        BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    CREATE TABLE #resultado
    (
        orden             INT IDENTITY(1,1),
        tarea             NVARCHAR(100),
        estado            NVARCHAR(20),
        detalle           NVARCHAR(1000),
        duracion_segundos INT,
        inicio            DATETIME2,
        fin               DATETIME2,
        numero_error      INT
    );

    DECLARE @inicio DATETIME2, @antes INT, @despues INT;

    SELECT @antes = COUNT(*)
    FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
    INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
    WHERE i.name IS NOT NULL AND ips.avg_fragmentation_in_percent > 20 AND ips.page_count > 8;

    IF @optimizar_indices = 1
    BEGIN
        SET @inicio = SYSDATETIME();
        BEGIN TRY
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

            INSERT #resultado (tarea, estado, detalle, duracion_segundos, inicio, fin, numero_error)
            VALUES (N'Reorganizacion / reconstruccion de indices', N'Completado',
                    CONCAT(N'Indices fragmentados antes: ', @antes, N' - despues: ', @despues,
                           N' (criterio >20 % y mas de 8 paginas)'),
                    DATEDIFF(SECOND, @inicio, SYSDATETIME()), @inicio, SYSDATETIME(), NULL);
        END TRY
        BEGIN CATCH
            INSERT #resultado (tarea, estado, detalle, duracion_segundos, inicio, fin, numero_error)
            VALUES (N'Reorganizacion / reconstruccion de indices', N'Fallido', LEFT(ERROR_MESSAGE(),1000),
                    DATEDIFF(SECOND,@inicio,SYSDATETIME()), @inicio, SYSDATETIME(), ERROR_NUMBER());
        END CATCH
    END

    IF @actualizar_estadisticas = 1
    BEGIN
        SET @inicio = SYSDATETIME();
        BEGIN TRY
            EXEC sp_updatestats;
            INSERT #resultado (tarea, estado, detalle, duracion_segundos, inicio, fin, numero_error)
            VALUES (N'Actualizacion de estadisticas', N'Completado',
                    CONCAT(N'sp_updatestats ejecutado sobre ', DB_NAME(), N'.'),
                    DATEDIFF(SECOND,@inicio,SYSDATETIME()), @inicio, SYSDATETIME(), NULL);
        END TRY
        BEGIN CATCH
            INSERT #resultado (tarea, estado, detalle, duracion_segundos, inicio, fin, numero_error)
            VALUES (N'Actualizacion de estadisticas', N'Fallido', LEFT(ERROR_MESSAGE(),1000),
                    DATEDIFF(SECOND,@inicio,SYSDATETIME()), @inicio, SYSDATETIME(), ERROR_NUMBER());
        END CATCH
    END

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
            SET @limite = CONVERT(NVARCHAR(19), DATEADD(DAY,-@retencion,GETDATE()),126);
            BEGIN TRY
                EXEC master.dbo.xp_delete_file 0, @ruta, N'bak', @limite, 0;
                SET @procesadas += 1;
            END TRY
            BEGIN CATCH
                SET @errores = LEFT(@errores + @ruta + N': ' + ERROR_MESSAGE() + N' ',1000);
            END CATCH
            FETCH NEXT FROM cur_cfg INTO @ruta, @retencion;
        END
        CLOSE cur_cfg;
        DEALLOCATE cur_cfg;

        INSERT #resultado (tarea, estado, detalle, duracion_segundos, inicio, fin, numero_error)
        VALUES (N'Purga de respaldos expirados',
                CASE WHEN @errores=N'' THEN N'Completado' ELSE N'Con advertencias' END,
                CONCAT(N'Carpetas procesadas: ',@procesadas,CASE WHEN @errores=N'' THEN N'' ELSE N'. '+@errores END),
                DATEDIFF(SECOND,@inicio,SYSDATETIME()), @inicio, SYSDATETIME(),
                CASE WHEN @errores=N'' THEN NULL ELSE 50000 END);
    END

    IF OBJECT_ID(N'MaintenanceDB.dbo.CommandLog', N'U') IS NOT NULL
    BEGIN
        BEGIN TRY
            INSERT MaintenanceDB.dbo.CommandLog
                (DatabaseName, Command, CommandType, StartTime, EndTime, ErrorNumber, ErrorMessage)
            SELECT DB_NAME(), CONCAT(tarea,N': ',detalle),
                   CASE
                       WHEN tarea LIKE N'Reorganizacion / reconstruccion%' THEN N'INDEX_MAINTENANCE'
                       WHEN tarea LIKE N'Actualizacion de estadisticas%' THEN N'UPDATE_STATISTICS'
                       WHEN tarea=N'Purga de respaldos expirados' THEN N'BACKUP_CLEANUP'
                       ELSE N'DBA_MAINTENANCE'
                   END,
                   inicio, fin, numero_error,
                   CASE WHEN numero_error IS NULL THEN NULL ELSE detalle END
            FROM #resultado;
        END TRY
        BEGIN CATCH
            INSERT #resultado (tarea, estado, detalle, duracion_segundos, inicio, fin, numero_error)
            VALUES (N'Registro de bitacora',N'Fallido',LEFT(ERROR_MESSAGE(),1000),0,SYSDATETIME(),SYSDATETIME(),ERROR_NUMBER());
        END CATCH
    END

    SELECT orden, tarea, estado, detalle, duracion_segundos
    FROM #resultado
    ORDER BY orden;
END;
GO

PRINT N'Actualizacion incremental QA aplicada en ' + DB_NAME() + N'. No se modificaron datos existentes.';
GO
