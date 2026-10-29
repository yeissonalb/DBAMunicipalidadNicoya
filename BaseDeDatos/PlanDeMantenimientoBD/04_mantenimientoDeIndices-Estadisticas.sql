/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ARCHIVO: PlanDeMantenimiento\04_mantenimientoDeIndices-Estadisticas.sql
   ============================================================================
   MANTENIMIENTO DE ÍNDICES Y ACTUALIZACIÓN DE ESTADÍSTICAS
   Evalúa el nivel de fragmentación en MunicipalidadNicoya2026 y DataMart:
   - Fragmentación entre 5% y 30%: REORGANIZE
   - Fragmentación superior a 30%: REBUILD
   - Actualización de estadísticas de consulta (UPDATE STATISTICS)
   ============================================================================ */

USE [MaintenanceDB];
GO

SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[IndexOptimize]') AND type in (N'P', N'PC'))
BEGIN
    EXEC dbo.sp_executesql @statement = N'CREATE PROCEDURE [dbo].[IndexOptimize] AS';
END
GO
ALTER PROCEDURE [dbo].[IndexOptimize]
    @Databases nvarchar(max) = 'MunicipalidadNicoya2026,MunicipalidadNicoyaDataMart2026',
    @FragmentationLow_Threshold float = 5.0,
    @FragmentationMedium_Threshold float = 30.0,
    @UpdateStatistics nvarchar(max) = 'ALL', -- ALL, INDEX, COLUMNS
    @LogToTable nvarchar(max) = 'Y'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @DBName sysname;
    DECLARE @SQL nvarchar(max);

    DECLARE db_cursor CURSOR LOCAL FOR 
        SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@Databases, ',') WHERE value <> '';

    OPEN db_cursor;
    FETCH NEXT FROM db_cursor INTO @DBName;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF DB_ID(@DBName) IS NOT NULL
        BEGIN
            PRINT 'Optimizando índices y estadísticas para base de datos: ' + @DBName;

            -- Script dinámico para evaluar fragmentación y ejecutar Reorganize / Rebuild
            SET @SQL = '
            USE ' + QUOTENAME(@DBName) + ';
            DECLARE @TableName NVARCHAR(255);
            DECLARE @IndexName NVARCHAR(255);
            DECLARE @Frag FLOAT;
            DECLARE @Cmd NVARCHAR(MAX);

            DECLARE idx_cursor CURSOR LOCAL FOR
                SELECT 
                    OBJECT_SCHEMA_NAME(ips.object_id) + ''.'' + OBJECT_NAME(ips.object_id) AS TableName,
                    si.name AS IndexName,
                    ips.avg_fragmentation_in_percent
                FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, ''LIMITED'') ips
                INNER JOIN sys.indexes si ON ips.object_id = si.object_id AND ips.index_id = si.index_id
                WHERE ips.avg_fragmentation_in_percent >= ' + CAST(@FragmentationLow_Threshold AS NVARCHAR(10)) + '
                  AND si.name IS NOT NULL
                  AND ips.page_count > 8;

            OPEN idx_cursor;
            FETCH NEXT FROM idx_cursor INTO @TableName, @IndexName, @Frag;

            WHILE @@FETCH_STATUS = 0
            BEGIN
                IF @Frag >= ' + CAST(@FragmentationMedium_Threshold AS NVARCHAR(10)) + '
                BEGIN
                    SET @Cmd = ''ALTER INDEX '' + QUOTENAME(@IndexName) + '' ON '' + @TableName + '' REBUILD WITH (ONLINE = OFF);'';
                END
                ELSE
                BEGIN
                    SET @Cmd = ''ALTER INDEX '' + QUOTENAME(@IndexName) + '' ON '' + @TableName + '' REORGANIZE;'';
                END

                PRINT ''Ejecutando mantenimiento: '' + @Cmd;
                EXEC [MaintenanceDB].[dbo].[CommandExecute]
                    @DatabaseContext = ''' + @DBName + ''',
                    @Command = @Cmd,
                    @CommandType = ''ALTER_INDEX'',
                    @DatabaseName = ''' + @DBName + ''',
                    @ObjectName = @TableName,
                    @IndexName = @IndexName;

                FETCH NEXT FROM idx_cursor INTO @TableName, @IndexName, @Frag;
            END

            CLOSE idx_cursor;
            DEALLOCATE idx_cursor;

            -- Actualizar estadísticas de optimización del Query Optimizer
            IF ''' + @UpdateStatistics + ''' <> ''N''
            BEGIN
                DECLARE @StatsCmd NVARCHAR(MAX) = ''EXEC sp_updatestats;'';
                EXEC [MaintenanceDB].[dbo].[CommandExecute]
                    @DatabaseContext = ''' + @DBName + ''',
                    @Command = @StatsCmd,
                    @CommandType = ''UPDATE_STATISTICS'',
                    @DatabaseName = ''' + @DBName + ''';
                PRINT ''-> Estadísticas actualizadas en '' + ''' + @DBName + ''';
            END
            ';

            EXEC sp_executesql @SQL;
        END
        FETCH NEXT FROM db_cursor INTO @DBName;
    END

    CLOSE db_cursor;
    DEALLOCATE db_cursor;
END;
GO

-- PROGRAMACIÓN DEL JOB DE OPTIMIZACIÓN DE ÍNDICES EN SQL SERVER AGENT
USE msdb;
GO

IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'IndexOptimize - Nicoya2026')
    EXEC sp_delete_job @job_name = N'IndexOptimize - Nicoya2026';
GO

EXEC sp_add_job 
    @job_name = N'IndexOptimize - Nicoya2026', 
    @enabled = 1, 
    @description = N'Reorganización y reconstrucción de índices y estadísticas para Municipalidad de Nicoya 2026';

EXEC sp_add_jobstep 
    @job_name = N'IndexOptimize - Nicoya2026', 
    @step_name = N'Execute_Index_Optimize', 
    @subsystem = N'TSQL', 
    @command = N'EXEC [MaintenanceDB].[dbo].[IndexOptimize];', 
    @database_name = N'MaintenanceDB';

EXEC sp_add_jobschedule 
    @job_name = N'IndexOptimize - Nicoya2026', 
    @name = N'Schedule_Indices_Domingo_01hrs', 
    @freq_type = 8, 
    @freq_interval = 1, -- Domingo
    @freq_recurrence_factor = 1, 
    @active_start_time = 010000; -- 01:00 AM

EXEC sp_add_jobserver @job_name = N'IndexOptimize - Nicoya2026', @server_name = N'(local)';
GO

PRINT '-> PlanDeMantenimiento: Optimización de índices y estadísticas configurada exitosamente.';
GO
