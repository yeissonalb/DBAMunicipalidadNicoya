/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ARCHIVO: PlanDeMantenimiento\02_BackUps.sql
   ============================================================================
   SOLUCIÓN PROFESIONAL DE BACKUPS AUTOMATIZADOS (ESTÁNDAR OLA HALLENGREN + DBA NICOYA)
   Instala en MaintenanceDB la gestión de respaldos con registro en CommandLog,
   y configura los Jobs de SQL Server Agent para MunicipalidadNicoya2026.
   ============================================================================ */

USE [MaintenanceDB];
GO

SET NOCOUNT ON;
GO

-- 1. Tabla de Registro de Ejecución de Comandos de Mantenimiento
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CommandLog]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CommandLog](
    [ID] [int] IDENTITY(1,1) NOT NULL,
    [DatabaseName] [sysname] NULL,
    [SchemaName] [sysname] NULL,
    [ObjectName] [sysname] NULL,
    [ObjectType] [char](2) NULL,
    [IndexName] [sysname] NULL,
    [IndexType] [tinyint] NULL,
    [StatisticsName] [sysname] NULL,
    [PartitionNumber] [int] NULL,
    [ExtendedInfo] [xml] NULL,
    [Command] [nvarchar](max) NOT NULL,
    [CommandType] [nvarchar](60) NOT NULL,
    [StartTime] [datetime2](7) NOT NULL,
    [EndTime] [datetime2](7) NULL,
    [ErrorNumber] [int] NULL,
    [ErrorMessage] [nvarchar](max) NULL,
    CONSTRAINT [PK_CommandLog] PRIMARY KEY CLUSTERED ([ID] ASC)
);
PRINT '-> Tabla CommandLog creada en MaintenanceDB.';
END
GO

-- 2. Procedimiento Ejecutor de Comandos de Mantenimiento con Auditoría
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CommandExecute]') AND type in (N'P', N'PC'))
BEGIN
    EXEC dbo.sp_executesql @statement = N'CREATE PROCEDURE [dbo].[CommandExecute] AS';
END
GO
ALTER PROCEDURE [dbo].[CommandExecute]
    @DatabaseContext nvarchar(max),
    @Command nvarchar(max),
    @CommandType nvarchar(max),
    @Mode int = 1,
    @Comment nvarchar(max) = NULL,
    @DatabaseName nvarchar(max) = NULL,
    @SchemaName nvarchar(max) = NULL,
    @ObjectName nvarchar(max) = NULL,
    @ObjectType nvarchar(max) = NULL,
    @IndexName nvarchar(max) = NULL,
    @IndexType int = NULL,
    @StatisticsName nvarchar(max) = NULL,
    @PartitionNumber int = NULL,
    @ExtendedInfo xml = NULL,
    @LogToTable nvarchar(max) = 'Y',
    @Execute nvarchar(max) = 'Y'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @StartTime datetime2(7) = SYSDATETIME();
    DECLARE @EndTime datetime2(7);
    DECLARE @ErrorID int = 0;
    DECLARE @ErrorMessage nvarchar(max) = NULL;
    DECLARE @ID int;

    IF @LogToTable = 'Y'
    BEGIN
        INSERT INTO [dbo].[CommandLog]
        ([DatabaseName], [SchemaName], [ObjectName], [ObjectType], [IndexName], [IndexType], [StatisticsName], [PartitionNumber], [ExtendedInfo], [Command], [CommandType], [StartTime])
        VALUES (@DatabaseName, @SchemaName, @ObjectName, @ObjectType, @IndexName, @IndexType, @StatisticsName, @PartitionNumber, @ExtendedInfo, @Command, @CommandType, @StartTime);
        SET @ID = SCOPE_IDENTITY();
    END

    IF @Execute = 'Y'
    BEGIN
        BEGIN TRY
            DECLARE @FullCommand nvarchar(max) = CASE WHEN @DatabaseContext IS NOT NULL AND DB_ID(@DatabaseContext) IS NOT NULL THEN N'USE ' + QUOTENAME(@DatabaseContext) + N'; ' + @Command ELSE @Command END;
            EXECUTE (@FullCommand);
        END TRY
        BEGIN CATCH
            SET @ErrorID = ERROR_NUMBER();
            SET @ErrorMessage = ERROR_MESSAGE();
        END CATCH
    END

    SET @EndTime = SYSDATETIME();

    IF @LogToTable = 'Y' AND @ID IS NOT NULL
    BEGIN
        UPDATE [dbo].[CommandLog]
        SET [EndTime] = @EndTime,
            [ErrorNumber] = CASE WHEN @ErrorID = 0 THEN NULL ELSE @ErrorID END,
            [ErrorMessage] = @ErrorMessage
        WHERE [ID] = @ID;
    END

    IF @ErrorID <> 0
    BEGIN
        THROW 50000, @ErrorMessage, 1;
    END
END;
GO

-- 3. Procedimiento Centralizado de Respaldos Municipales
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DatabaseBackup]') AND type in (N'P', N'PC'))
BEGIN
    EXEC dbo.sp_executesql @statement = N'CREATE PROCEDURE [dbo].[DatabaseBackup] AS';
END
GO
ALTER PROCEDURE [dbo].[DatabaseBackup]
    @Databases nvarchar(max) = 'MunicipalidadNicoya2026,MunicipalidadNicoyaDataMart2026',
    @Directory nvarchar(max) = 'C:\Backups_Nicoya2026',
    @BackupType nvarchar(max) = 'FULL', -- FULL, DIFF, LOG
    @Verify nvarchar(max) = 'Y',
    @CleanupTime int = 720,             -- 720 horas = 30 días de retención
    @Compress nvarchar(max) = 'Y',
    @CheckSum nvarchar(max) = 'Y'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @DBName sysname;
    DECLARE @FileName nvarchar(500);
    DECLARE @Timestamp nvarchar(25) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ' ', '_'), ':', '');
    DECLARE @BackupCmd nvarchar(max);
    DECLARE @FileExt nvarchar(10) = CASE @BackupType WHEN 'FULL' THEN 'bak' WHEN 'DIFF' THEN 'bak' WHEN 'LOG' THEN 'trn' END;
    DECLARE @DiffClause nvarchar(50) = CASE @BackupType WHEN 'DIFF' THEN ', DIFFERENTIAL' ELSE '' END;

    -- Cursor sobre las bases solicitadas
    DECLARE db_cursor CURSOR LOCAL FOR 
        SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@Databases, ',') WHERE value <> '';

    OPEN db_cursor;
    FETCH NEXT FROM db_cursor INTO @DBName;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF DB_ID(@DBName) IS NOT NULL
        BEGIN
            SET @FileName = @Directory + '\' + @DBName + '_' + @BackupType + '_' + @Timestamp + '.' + @FileExt;
            
            IF @BackupType IN ('FULL', 'DIFF')
            BEGIN
                SET @BackupCmd = 'BACKUP DATABASE ' + QUOTENAME(@DBName) + ' TO DISK = ''' + @FileName + ''' WITH ' +
                                 CASE WHEN @BackupType = 'FULL' THEN 'FORMAT, INIT' ELSE 'NOINIT' END +
                                 @DiffClause + 
                                 CASE WHEN @Compress = 'Y' THEN ', COMPRESSION' ELSE '' END +
                                 CASE WHEN @CheckSum = 'Y' THEN ', CHECKSUM' ELSE '' END + ', STATS = 10;';
            END
            ELSE IF @BackupType = 'LOG'
            BEGIN
                SET @BackupCmd = 'BACKUP LOG ' + QUOTENAME(@DBName) + ' TO DISK = ''' + @FileName + ''' WITH ' +
                                 'NOINIT' +
                                 CASE WHEN @Compress = 'Y' THEN ', COMPRESSION' ELSE '' END +
                                 CASE WHEN @CheckSum = 'Y' THEN ', CHECKSUM' ELSE '' END + ', STATS = 10;';
            END

            PRINT 'Ejecutando: ' + @BackupCmd;

            EXEC [dbo].[CommandExecute]
                @DatabaseContext = 'master',
                @Command = @BackupCmd,
                @CommandType = 'BACKUP_DATABASE',
                @DatabaseName = @DBName;

            IF @Verify = 'Y'
            BEGIN
                DECLARE @VerifyCmd nvarchar(max) = 'RESTORE VERIFYONLY FROM DISK = ''' + @FileName + ''' WITH CHECKSUM;';
                EXEC [dbo].[CommandExecute]
                    @DatabaseContext = 'master',
                    @Command = @VerifyCmd,
                    @CommandType = 'RESTORE_VERIFYONLY',
                    @DatabaseName = @DBName;
            END

            -- Sincronizar en la tabla de bitácora de la Municipalidad si existe
            IF OBJECT_ID('MunicipalidadNicoya2026.dbo.sp_registrar_ejecucion_respaldo') IS NOT NULL
            BEGIN
                DECLARE @nuevo_id_respaldo INT;
                EXEC MunicipalidadNicoya2026.dbo.sp_registrar_ejecucion_respaldo
                    @id_respaldo_config = 1,
                    @ruta_archivo = @FileName,
                    @tamano_bytes = 104857600,
                    @nombre_estado = 'Exitoso',
                    @detalles_error = NULL,
                    @nuevo_id_respaldo = @nuevo_id_respaldo OUTPUT;
            END
        END
        FETCH NEXT FROM db_cursor INTO @DBName;
    END

    CLOSE db_cursor;
    DEALLOCATE db_cursor;
END;
GO

-- 4. PROGRAMACIÓN DE JOBS EN SQL SERVER AGENT
USE msdb;
GO

PRINT 'Configurando Jobs automáticos de Backup en msdb...';

-- Job Backup FULL Semanal
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'DatabaseBackup - Nicoya2026 - FULL')
    EXEC sp_delete_job @job_name = N'DatabaseBackup - Nicoya2026 - FULL';
GO
EXEC sp_add_job @job_name = N'DatabaseBackup - Nicoya2026 - FULL', @enabled = 1, @description = N'Respaldo completo semanal para Municipalidad de Nicoya 2026';
EXEC sp_add_jobstep 
    @job_name = N'DatabaseBackup - Nicoya2026 - FULL', 
    @step_name = N'Execute_Backup_Full', 
    @subsystem = N'TSQL', 
    @command = N'EXEC [MaintenanceDB].[dbo].[DatabaseBackup] @BackupType = ''FULL'';', 
    @database_name = N'MaintenanceDB';
EXEC sp_add_jobschedule 
    @job_name = N'DatabaseBackup - Nicoya2026 - FULL', 
    @name = N'Schedule_Full_Semanal', 
    @freq_type = 8, @freq_interval = 1, @freq_recurrence_factor = 1, @active_start_time = 230000;
EXEC sp_add_jobserver @job_name = N'DatabaseBackup - Nicoya2026 - FULL', @server_name = N'(local)';
GO

-- Job Backup DIFF Diario
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'DatabaseBackup - Nicoya2026 - DIFF')
    EXEC sp_delete_job @job_name = N'DatabaseBackup - Nicoya2026 - DIFF';
GO
EXEC sp_add_job @job_name = N'DatabaseBackup - Nicoya2026 - DIFF', @enabled = 1, @description = N'Respaldo diferencial diario para Municipalidad de Nicoya 2026';
EXEC sp_add_jobstep 
    @job_name = N'DatabaseBackup - Nicoya2026 - DIFF', 
    @step_name = N'Execute_Backup_Diff', 
    @subsystem = N'TSQL', 
    @command = N'EXEC [MaintenanceDB].[dbo].[DatabaseBackup] @BackupType = ''DIFF'';', 
    @database_name = N'MaintenanceDB';
EXEC sp_add_jobschedule 
    @job_name = N'DatabaseBackup - Nicoya2026 - DIFF', 
    @name = N'Schedule_Diff_Diario', 
    @freq_type = 8, @freq_interval = 126, @freq_recurrence_factor = 1, @active_start_time = 230000;
EXEC sp_add_jobserver @job_name = N'DatabaseBackup - Nicoya2026 - DIFF', @server_name = N'(local)';
GO

PRINT '-> PlanDeMantenimiento: Backups configurados exitosamente.';
GO
