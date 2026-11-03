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

    IF @Directory IS NULL THROW 50022,N'Configure la carpeta de respaldo de la instancia.',1;
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
                DECLARE @nuevo_id_respaldo INT,@config_real INT,@bytes_reales BIGINT;
                SET @config_real=NULL; SET @bytes_reales=0;
                SELECT TOP(1) @config_real=c.id_respaldos_config
                FROM MunicipalidadNicoya2026.dbo.Respaldos_Config c
                JOIN MunicipalidadNicoya2026.dbo.Tipo_de_respaldo t ON t.id_tipo_de_respaldo=c.id_tipo_de_respaldo
                WHERE c.origen=@DBName AND c.activo=1 AND t.nombre_tipo_respaldo=
                    CASE @BackupType WHEN 'FULL' THEN 'Full' WHEN 'DIFF' THEN 'Diferencial' WHEN 'LOG' THEN 'Log' END
                ORDER BY c.id_respaldos_config;
                SELECT TOP(1) @bytes_reales=CONVERT(BIGINT,bs.compressed_backup_size)
                FROM msdb.dbo.backupset bs JOIN msdb.dbo.backupmediafamily mf ON mf.media_set_id=bs.media_set_id
                WHERE bs.database_name=@DBName AND mf.physical_device_name=@FileName
                ORDER BY bs.backup_finish_date DESC,bs.backup_set_id DESC;
                IF @config_real IS NOT NULL
                EXEC MunicipalidadNicoya2026.dbo.sp_registrar_ejecucion_respaldo
                    @id_respaldo_config = @config_real,
                    @ruta_archivo = @FileName,
                    @tamano_bytes = @bytes_reales,
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

USE msdb;
GO

IF TRY_CONVERT(int,SESSION_CONTEXT(N'Nicoya_Configurar_Jobs'))=1 AND CONVERT(int,SERVERPROPERTY('EngineEdition'))<>4
BEGIN
PRINT 'Configurando Jobs automáticos de Backup en msdb...';

-- Job Backup FULL Semanal
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'DatabaseBackup - Nicoya2026 - FULL')
    EXEC sp_delete_job @job_name = N'DatabaseBackup - Nicoya2026 - FULL';
END;
GO

IF TRY_CONVERT(int,SESSION_CONTEXT(N'Nicoya_Configurar_Jobs'))=1 AND CONVERT(int,SERVERPROPERTY('EngineEdition'))<>4
BEGIN
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
END;
GO

IF TRY_CONVERT(int,SESSION_CONTEXT(N'Nicoya_Configurar_Jobs'))=1 AND CONVERT(int,SERVERPROPERTY('EngineEdition'))<>4
BEGIN
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'DatabaseBackup - Nicoya2026 - DIFF')
    EXEC sp_delete_job @job_name = N'DatabaseBackup - Nicoya2026 - DIFF';
END;
GO

IF TRY_CONVERT(int,SESSION_CONTEXT(N'Nicoya_Configurar_Jobs'))=1 AND CONVERT(int,SERVERPROPERTY('EngineEdition'))<>4
BEGIN
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
END;
GO

IF TRY_CONVERT(int,SESSION_CONTEXT(N'Nicoya_Configurar_Jobs'))=1 AND CONVERT(int,SERVERPROPERTY('EngineEdition'))<>4
BEGIN
PRINT '-> PlanDeMantenimiento: Backups configurados exitosamente.';
END;
GO
