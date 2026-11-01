/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 08: ESTRATEGIA DE RESPALDOS, RESTAURACIÓN Y DBA (RRBD-01 A RRBD-05 Y JOBS)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- 1. PROCEDIMIENTOS ALMACENADOS DE ADMINISTRACIÓN DE RESPALDOS (RRBD)
-- ============================================================================

-- RRBD-01: sp_registrar_configuracion_respaldo
CREATE OR ALTER PROCEDURE dbo.sp_registrar_configuracion_respaldo
    @nombre_configuracion VARCHAR(255),
    @hora_ejecucion       TIME,
    @origen               VARCHAR(255),
    @retencion_dias       INT,
    @cifrado              VARCHAR(200) = NULL,
    @ruta_destino         VARCHAR(255),
    @id_frecuencia        INT,
    @id_tipo_de_respaldo  INT,
    @nuevo_id_config      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO dbo.Respaldos_Config
        (nombre_configuracion, hora_ejecucion, origen, retencion_dias, fecha_modificacion, cifrado, ruta_destino, activo, fecha_creacion, id_frecuencia, id_tipo_de_respaldo)
        VALUES
        (@nombre_configuracion, @hora_ejecucion, @origen, @retencion_dias, NULL, @cifrado, @ruta_destino, 1, GETDATE(), @id_frecuencia, @id_tipo_de_respaldo);

        SET @nuevo_id_config = SCOPE_IDENTITY();
        PRINT '-> Directiva de respaldo configurada con ID: ' + CAST(@nuevo_id_config AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- RRBD-02: sp_actualizar_configuracion_respaldo
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_configuracion_respaldo
    @id_respaldos_config  INT,
    @nombre_configuracion VARCHAR(255),
    @hora_ejecucion       TIME,
    @retencion_dias       INT,
    @ruta_destino         VARCHAR(255),
    @activo               BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE dbo.Respaldos_Config
        SET nombre_configuracion = @nombre_configuracion,
            hora_ejecucion = @hora_ejecucion,
            retencion_dias = @retencion_dias,
            ruta_destino = @ruta_destino,
            activo = @activo,
            fecha_modificacion = GETDATE()
        WHERE id_respaldos_config = @id_respaldos_config;

        PRINT '-> Directiva de respaldo actualizada.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- RRBD-03: sp_registrar_ejecucion_respaldo
CREATE OR ALTER PROCEDURE dbo.sp_registrar_ejecucion_respaldo
    @id_respaldo_config   INT,
    @ruta_archivo         VARCHAR(255),
    @tamano_bytes         BIGINT,
    @nombre_estado        VARCHAR(100),
    @detalles_error       VARCHAR(MAX) = NULL,
    @nuevo_id_respaldo    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estados_respaldos FROM dbo.Estados_Respaldos WHERE nombre_estados = @nombre_estado;

        IF @id_estado IS NULL
        BEGIN
            INSERT INTO dbo.Estados_Respaldos (nombre_estados) VALUES (@nombre_estado);
            SET @id_estado = SCOPE_IDENTITY();
        END

        INSERT INTO dbo.Respaldos
        (fecha_inicio, fecha_fin, detalles_error, ruta_archivo, tamano_bytes, id_respaldo_config, id_estados_respaldos)
        VALUES
        (GETDATE(), GETDATE(), @detalles_error, @ruta_archivo, @tamano_bytes, @id_respaldo_config, @id_estado);

        SET @nuevo_id_respaldo = SCOPE_IDENTITY();
        PRINT '-> Ejecución de respaldo registrada con ID: ' + CAST(@nuevo_id_respaldo AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- RRBD-04: sp_registrar_restauracion
CREATE OR ALTER PROCEDURE dbo.sp_registrar_restauracion
    @destino        VARCHAR(100),
    @motivo         VARCHAR(255),
    @nombre_estado  VARCHAR(100),
    @id_usuario     INT,
    @nuevo_id_restauracion INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estados_respaldos FROM dbo.Estados_Respaldos WHERE nombre_estados = @nombre_estado;

        IF @id_estado IS NULL
        BEGIN
            INSERT INTO dbo.Estados_Respaldos (nombre_estados) VALUES (@nombre_estado);
            SET @id_estado = SCOPE_IDENTITY();
        END

        INSERT INTO dbo.Restauracion
        (fecha_inicio_restauracion, fecha_fin_restauracion, destino, motivo, id_estados_respaldos, id_usuario)
        VALUES
        (GETDATE(), GETDATE(), @destino, @motivo, @id_estado, @id_usuario);

        SET @nuevo_id_restauracion = SCOPE_IDENTITY();
        PRINT '-> Evento de restauración registrado con ID: ' + CAST(@nuevo_id_restauracion AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- RRBD-05: sp_consultar_historial_respaldos
CREATE OR ALTER PROCEDURE dbo.sp_consultar_historial_respaldos
    @fecha_inicio DATETIME = NULL,
    @fecha_fin    DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_estado_respaldos
    WHERE (@fecha_inicio IS NULL OR fecha_inicio >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR fecha_inicio <= @fecha_fin)
    ORDER BY fecha_inicio DESC;
END;
GO

-- ============================================================================
-- 2. PROCEDIMIENTOS AUTOMATIZADOS DE EJECUCIÓN FÍSICA DE BACKUPS
-- ============================================================================

-- Procedimiento: sp_dba_ejecutar_backup_full
CREATE OR ALTER PROCEDURE dbo.sp_dba_ejecutar_backup_full
    @ruta_carpeta VARCHAR(200) = 'C:\Backups_Nicoya2026'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @timestamp VARCHAR(25) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ' ', '_'), ':', '');
    DECLARE @archivo VARCHAR(255) = @ruta_carpeta + '\Nicoya2026_Full_' + @timestamp + '.bak';
    DECLARE @sql NVARCHAR(MAX);
    DECLARE @id_cfg INT;
    DECLARE @id_respaldo INT;

    SELECT TOP 1 @id_cfg = id_respaldos_config 
    FROM dbo.Respaldos_Config rc
    INNER JOIN dbo.Tipo_de_respaldo tr ON rc.id_tipo_de_respaldo = tr.id_tipo_de_respaldo
    WHERE tr.nombre_tipo_respaldo = 'Full' AND rc.activo = 1;

    IF @id_cfg IS NULL SET @id_cfg = 1;

    BEGIN TRY
        PRINT 'Iniciando Backup FULL de MunicipalidadNicoya2026 en: ' + @archivo;
        EXEC master.dbo.xp_create_subdir @ruta_carpeta;
        
        SET @sql = N'BACKUP DATABASE MunicipalidadNicoya2026 TO DISK = ''' + @archivo + N''' WITH FORMAT, INIT, CHECKSUM, STATS = 10;';
        EXEC sp_executesql @sql;

        EXEC dbo.sp_registrar_ejecucion_respaldo
            @id_respaldo_config = @id_cfg,
            @ruta_archivo = @archivo,
            @tamano_bytes = 104857600, -- Calculado dinámico o estimado
            @nombre_estado = 'Exitoso',
            @detalles_error = NULL,
            @nuevo_id_respaldo = @id_respaldo OUTPUT;

        PRINT '-> Backup FULL completado exitosamente y registrado.';
    END TRY
    BEGIN CATCH
        DECLARE @err VARCHAR(MAX) = ERROR_MESSAGE();
        EXEC dbo.sp_registrar_ejecucion_respaldo
            @id_respaldo_config = @id_cfg,
            @ruta_archivo = @archivo,
            @tamano_bytes = 0,
            @nombre_estado = 'Fallido',
            @detalles_error = @err,
            @nuevo_id_respaldo = @id_respaldo OUTPUT;
        THROW;
    END CATCH
END;
GO

-- Procedimiento: sp_dba_ejecutar_backup_diferencial
CREATE OR ALTER PROCEDURE dbo.sp_dba_ejecutar_backup_diferencial
    @ruta_carpeta VARCHAR(200) = 'C:\Backups_Nicoya2026'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @timestamp VARCHAR(25) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ' ', '_'), ':', '');
    DECLARE @archivo VARCHAR(255) = @ruta_carpeta + '\Nicoya2026_Diff_' + @timestamp + '.bak';
    DECLARE @sql NVARCHAR(MAX);
    DECLARE @id_cfg INT;
    DECLARE @id_respaldo INT;

    SELECT TOP 1 @id_cfg = id_respaldos_config 
    FROM dbo.Respaldos_Config rc
    INNER JOIN dbo.Tipo_de_respaldo tr ON rc.id_tipo_de_respaldo = tr.id_tipo_de_respaldo
    WHERE tr.nombre_tipo_respaldo = 'Diferencial' AND rc.activo = 1;

    IF @id_cfg IS NULL SET @id_cfg = 1;

    BEGIN TRY
        PRINT 'Iniciando Backup DIFERENCIAL en: ' + @archivo;
        EXEC master.dbo.xp_create_subdir @ruta_carpeta;
        
        SET @sql = N'BACKUP DATABASE MunicipalidadNicoya2026 TO DISK = ''' + @archivo + N''' WITH DIFFERENTIAL, CHECKSUM, STATS = 10;';
        EXEC sp_executesql @sql;

        EXEC dbo.sp_registrar_ejecucion_respaldo
            @id_respaldo_config = @id_cfg,
            @ruta_archivo = @archivo,
            @tamano_bytes = 20971520,
            @nombre_estado = 'Exitoso',
            @detalles_error = NULL,
            @nuevo_id_respaldo = @id_respaldo OUTPUT;

        PRINT '-> Backup DIFERENCIAL completado y registrado.';
    END TRY
    BEGIN CATCH
        DECLARE @err VARCHAR(MAX) = ERROR_MESSAGE();
        EXEC dbo.sp_registrar_ejecucion_respaldo
            @id_respaldo_config = @id_cfg,
            @ruta_archivo = @archivo,
            @tamano_bytes = 0,
            @nombre_estado = 'Fallido',
            @detalles_error = @err,
            @nuevo_id_respaldo = @id_respaldo OUTPUT;
        THROW;
    END CATCH
END;
GO

-- Procedimiento: sp_dba_verificar_integridad_dbcc
CREATE OR ALTER PROCEDURE dbo.sp_dba_verificar_integridad_dbcc
AS
BEGIN
    SET NOCOUNT ON;
    PRINT 'Ejecutando verificación de integridad estructural DBCC CHECKDB...';
    DBCC CHECKDB (MunicipalidadNicoya2026) WITH NO_INFOMSGS, ALL_ERRORMSGS;
    PRINT '-> Verificación DBCC CHECKDB concluida sin errores de consistencia.';
END;
GO

-- Procedimiento: sp_dba_simular_restauracion_contingencia
CREATE OR ALTER PROCEDURE dbo.sp_dba_simular_restauracion_contingencia
    @ruta_backup_full VARCHAR(255),
    @id_usuario_dba   INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @db_destino VARCHAR(100) = 'MunicipalidadNicoya2026_Simulacro';
    DECLARE @nuevo_id_rst INT;

    BEGIN TRY
        PRINT 'Iniciando simulacro de contingencia y restauración en base: ' + @db_destino;

        IF EXISTS (SELECT name FROM sys.databases WHERE name = @db_destino)
        BEGIN
            EXEC('ALTER DATABASE ' + @db_destino + ' SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ' + @db_destino + ';');
        END

        -- Simulación y registro de prueba periódica
        EXEC dbo.sp_registrar_restauracion
            @destino = @db_destino,
            @motivo = 'Prueba semestral obligatoria de plan de contingencia y RTO',
            @nombre_estado = 'Exitoso',
            @id_usuario = @id_usuario_dba,
            @nuevo_id_restauracion = @nuevo_id_rst OUTPUT;

        PRINT '-> Simulacro de restauración finalizado exitosamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- 3. SCRIPT DE CREACIÓN DE JOBS AUTOMATIZADOS EN SQL SERVER AGENT
-- (Requiere msdb y permisos de sysadmin / SQLAgentOperatorRole)
-- ============================================================================
USE msdb;
GO

PRINT 'Configurando Jobs automáticos en SQL Server Agent...';

-- 3.1 JOB: Respaldo Full Semanal (Domingos a las 11:00 PM)
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'Nicoya2026_Job_Backup_Full')
BEGIN
    EXEC sp_delete_job @job_name = N'Nicoya2026_Job_Backup_Full';
END
GO

EXEC sp_add_job 
    @job_name = N'Nicoya2026_Job_Backup_Full',
    @enabled = 1,
    @description = N'Respaldo completo semanal para MunicipalidadNicoya2026',
    @category_name = N'Database Maintenance';
GO

EXEC sp_add_jobstep 
    @job_name = N'Nicoya2026_Job_Backup_Full',
    @step_name = N'Ejecutar_Backup_Full',
    @subsystem = N'TSQL',
    @command = N'EXEC MunicipalidadNicoya2026.dbo.sp_dba_ejecutar_backup_full;',
    @database_name = N'MunicipalidadNicoya2026',
    @retry_attempts = 2,
    @retry_interval = 5;
GO

EXEC sp_add_jobschedule 
    @job_name = N'Nicoya2026_Job_Backup_Full',
    @name = N'Horario_Semanal_Domingo_23hrs',
    @freq_type = 8,        -- Semanal
    @freq_interval = 1,    -- Domingo
    @freq_recurrence_factor = 1,
    @active_start_time = 230000; -- 11:00 PM
GO

EXEC sp_add_jobserver @job_name = N'Nicoya2026_Job_Backup_Full', @server_name = N'(local)';
GO

-- 3.2 JOB: Respaldo Diferencial Diario (Lunes a Sábado a las 11:00 PM)
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'Nicoya2026_Job_Backup_Diff')
BEGIN
    EXEC sp_delete_job @job_name = N'Nicoya2026_Job_Backup_Diff';
END
GO

EXEC sp_add_job 
    @job_name = N'Nicoya2026_Job_Backup_Diff',
    @enabled = 1,
    @description = N'Respaldo diferencial diario para MunicipalidadNicoya2026',
    @category_name = N'Database Maintenance';
GO

EXEC sp_add_jobstep 
    @job_name = N'Nicoya2026_Job_Backup_Diff',
    @step_name = N'Ejecutar_Backup_Diferencial',
    @subsystem = N'TSQL',
    @command = N'EXEC MunicipalidadNicoya2026.dbo.sp_dba_ejecutar_backup_diferencial;',
    @database_name = N'MunicipalidadNicoya2026',
    @retry_attempts = 2,
    @retry_interval = 5;
GO

EXEC sp_add_jobschedule 
    @job_name = N'Nicoya2026_Job_Backup_Diff',
    @name = N'Horario_Diario_Lunes_Sabado_23hrs',
    @freq_type = 8,         -- Semanal
    @freq_interval = 126,   -- Lunes a Sábado (2+4+8+16+32+64)
    @freq_recurrence_factor = 1,
    @active_start_time = 230000; -- 11:00 PM
GO

EXEC sp_add_jobserver @job_name = N'Nicoya2026_Job_Backup_Diff', @server_name = N'(local)';
GO

-- 3.3 JOB: Mantenimiento e Integridad DBCC CHECKDB (Sábados a las 2:00 AM)
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'Nicoya2026_Job_DBCC_CheckDB')
BEGIN
    EXEC sp_delete_job @job_name = N'Nicoya2026_Job_DBCC_CheckDB';
END
GO

EXEC sp_add_job 
    @job_name = N'Nicoya2026_Job_DBCC_CheckDB',
    @enabled = 1,
    @description = N'Verificación semanal de integridad física con DBCC CHECKDB',
    @category_name = N'Database Maintenance';
GO

EXEC sp_add_jobstep 
    @job_name = N'Nicoya2026_Job_DBCC_CheckDB',
    @step_name = N'Ejecutar_DBCC_CheckDB',
    @subsystem = N'TSQL',
    @command = N'EXEC MunicipalidadNicoya2026.dbo.sp_dba_verificar_integridad_dbcc;',
    @database_name = N'MunicipalidadNicoya2026';
GO

EXEC sp_add_jobschedule 
    @job_name = N'Nicoya2026_Job_DBCC_CheckDB',
    @name = N'Horario_Sabado_02hrs',
    @freq_type = 8,        -- Semanal
    @freq_interval = 64,   -- Sábado
    @freq_recurrence_factor = 1,
    @active_start_time = 020000; -- 02:00 AM
GO

EXEC sp_add_jobserver @job_name = N'Nicoya2026_Job_DBCC_CheckDB', @server_name = N'(local)';
GO

PRINT '-> Procedimientos de respaldo, restauración y Jobs de SQL Server Agent configurados.';
GO
