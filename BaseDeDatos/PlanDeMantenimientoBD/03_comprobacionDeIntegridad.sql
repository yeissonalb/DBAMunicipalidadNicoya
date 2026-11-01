/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ARCHIVO: PlanDeMantenimiento\03_comprobacionDeIntegridad.sql
   ============================================================================
   COMPROBACIÓN DE INTEGRIDAD ESTRUCTURAL (DBCC CHECKDB AUTOMATIZADO)
   Verifica la consistencia lógica y física de las páginas de datos e índices,
   registrando cualquier anomalía en MaintenanceDB.dbo.CommandLog.
   ============================================================================ */

USE [MaintenanceDB];
GO

SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DatabaseIntegrityCheck]') AND type in (N'P', N'PC'))
BEGIN
    EXEC dbo.sp_executesql @statement = N'CREATE PROCEDURE [dbo].[DatabaseIntegrityCheck] AS';
END
GO
ALTER PROCEDURE [dbo].[DatabaseIntegrityCheck]
    @Databases nvarchar(max) = 'MunicipalidadNicoya2026,MunicipalidadNicoyaDataMart2026',
    @CheckCommands nvarchar(max) = 'CHECKDB',
    @PhysicalOnly nvarchar(max) = 'N',
    @NoIndex nvarchar(max) = 'N',
    @ExtendedLogicalChecks nvarchar(max) = 'N',
    @TabLock nvarchar(max) = 'N',
    @LogToTable nvarchar(max) = 'Y'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @DBName sysname;
    DECLARE @Command nvarchar(max);

    DECLARE db_cursor CURSOR LOCAL FOR 
        SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@Databases, ',') WHERE value <> '';

    OPEN db_cursor;
    FETCH NEXT FROM db_cursor INTO @DBName;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF DB_ID(@DBName) IS NOT NULL
        BEGIN
            SET @Command = 'DBCC ' + @CheckCommands + ' (' + QUOTENAME(@DBName) + ') WITH NO_INFOMSGS, ALL_ERRORMSGS' +
                           CASE WHEN @PhysicalOnly = 'Y' THEN ', PHYSICAL_ONLY' ELSE '' END +
                           CASE WHEN @NoIndex = 'Y' THEN ', NOINDEX' ELSE '' END +
                           CASE WHEN @ExtendedLogicalChecks = 'Y' THEN ', EXTENDED_LOGICAL_CHECKS' ELSE '' END +
                           CASE WHEN @TabLock = 'Y' THEN ', TABLOCK' ELSE '' END + ';';

            DECLARE @CmdType nvarchar(60) = 'DBCC_' + @CheckCommands;
            PRINT 'Verificando integridad en ' + @DBName + '...';

            EXEC [dbo].[CommandExecute]
                @DatabaseContext = 'master',
                @Command = @Command,
                @CommandType = @CmdType,
                @DatabaseName = @DBName,
                @LogToTable = @LogToTable;

            PRINT '-> Verificación completada para ' + @DBName;
        END
        FETCH NEXT FROM db_cursor INTO @DBName;
    END

    CLOSE db_cursor;
    DEALLOCATE db_cursor;
END;
GO

-- PROGRAMACIÓN DEL JOB DE INTEGRIDAD EN SQL SERVER AGENT
USE msdb;
GO

IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'DatabaseIntegrityCheck - Nicoya2026')
    EXEC sp_delete_job @job_name = N'DatabaseIntegrityCheck - Nicoya2026';
GO

EXEC sp_add_job 
    @job_name = N'DatabaseIntegrityCheck - Nicoya2026', 
    @enabled = 1, 
    @description = N'Comprobación semanal de integridad física y lógica para Municipalidad de Nicoya 2026';

EXEC sp_add_jobstep 
    @job_name = N'DatabaseIntegrityCheck - Nicoya2026', 
    @step_name = N'Execute_Integrity_Check', 
    @subsystem = N'TSQL', 
    @command = N'EXEC [MaintenanceDB].[dbo].[DatabaseIntegrityCheck];', 
    @database_name = N'MaintenanceDB';

EXEC sp_add_jobschedule 
    @job_name = N'DatabaseIntegrityCheck - Nicoya2026', 
    @name = N'Schedule_Integridad_Sabado_02hrs', 
    @freq_type = 8, 
    @freq_interval = 64, -- Sábado
    @freq_recurrence_factor = 1, 
    @active_start_time = 020000; -- 02:00 AM

EXEC sp_add_jobserver @job_name = N'DatabaseIntegrityCheck - Nicoya2026', @server_name = N'(local)';
GO

PRINT '-> PlanDeMantenimiento: Comprobación de integridad configurada con éxito.';
GO
