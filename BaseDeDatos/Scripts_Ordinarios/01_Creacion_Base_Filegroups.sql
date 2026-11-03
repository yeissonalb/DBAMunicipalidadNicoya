-- Rutas fijas del proyecto: C:\SQLData y C:\SQLLOG.
GO

USE master;
GO

IF DB_ID(N'MunicipalidadNicoya2026') IS NOT NULL THROW 50022,N'La base municipal ya existe. Este instalador es para bases nuevas.',1;
GO

CREATE DATABASE MunicipalidadNicoya2026
ON PRIMARY
(
    NAME = 'Nicoya2026_Primary',
    FILENAME = 'C:\SQLData\Nicoya2026_Primary.mdf',
    SIZE = 128MB,
    MAXSIZE = 5GB,
    FILEGROWTH = 32MB
)
LOG ON
(
    NAME = 'Nicoya2026_Log',
    FILENAME = 'C:\SQLLOG\Nicoya2026_Log.ldf',
    SIZE = 64MB,
    MAXSIZE = 4GB,
    FILEGROWTH = 16MB
);
GO

PRINT 'Base de datos MunicipalidadNicoya2026 creada con éxito.';
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Contribuyentes;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Contribuyentes',
    FILENAME = 'C:\SQLData\Nicoya2026_Contribuyentes.ndf',
    SIZE = 64MB,
    MAXSIZE = 1GB,
    FILEGROWTH = 32MB
) TO FILEGROUP FG_Contribuyentes;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Inmuebles;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Inmuebles',
    FILENAME = 'C:\SQLData\Nicoya2026_Inmuebles.ndf',
    SIZE = 64MB,
    MAXSIZE = 1GB,
    FILEGROWTH = 32MB
) TO FILEGROUP FG_Inmuebles;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Tramites;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Tramites',
    FILENAME = 'C:\SQLData\Nicoya2026_Tramites.ndf',
    SIZE = 128MB,
    MAXSIZE = 2GB,
    FILEGROWTH = 64MB
) TO FILEGROUP FG_Tramites;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Tributos;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Tributos',
    FILENAME = 'C:\SQLData\Nicoya2026_Tributos.ndf',
    SIZE = 256MB,
    MAXSIZE = 4GB,
    FILEGROWTH = 64MB
) TO FILEGROUP FG_Tributos;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Seguridad;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Seguridad',
    FILENAME = 'C:\SQLData\Nicoya2026_Seguridad.ndf',
    SIZE = 16MB,
    MAXSIZE = 2GB,
    FILEGROWTH = 64MB
) TO FILEGROUP FG_Seguridad;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Auditoria_DBA;
GO

ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Auditoria_DBA',
    FILENAME = 'C:\SQLData\Nicoya2026_Auditoria_DBA.ndf',
    SIZE = 128MB,
    MAXSIZE = 2GB,
    FILEGROWTH = 64MB
) TO FILEGROUP FG_Auditoria_DBA;
GO

PRINT 'Filegroups creados y vinculados a MunicipalidadNicoya2026 correctamente.';
GO
