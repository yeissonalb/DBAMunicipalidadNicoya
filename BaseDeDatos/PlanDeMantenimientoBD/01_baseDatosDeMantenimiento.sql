/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO: PlanDeMantenimiento\01_baseDatosDeMantenimiento.sql
   ============================================================================ */

USE master;
GO

IF DB_ID('MaintenanceDB') IS NULL
BEGIN
    CREATE DATABASE MaintenanceDB
    ON PRIMARY
    (
        NAME = 'MaintenanceDB_Data',
        FILENAME = 'C:\SQLData\MaintenanceDB_Data.mdf',
        SIZE = 64MB,
        MAXSIZE = 2GB,
        FILEGROWTH = 16MB
    )
    LOG ON
    (
        NAME = 'MaintenanceDB_Log',
        FILENAME = 'C:\SQLLOG\MaintenanceDB_Log.ldf',
        SIZE = 32MB,
        MAXSIZE = 1GB,
        FILEGROWTH = 8MB
    );
    PRINT '-> Base de datos MaintenanceDB creada exitosamente para centralizar planes y auditoría de mantenimiento.';
END
ELSE
BEGIN
    PRINT '-> Base de datos MaintenanceDB ya existe en el servidor.';
END
GO
