/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 01: CREACIÓN DE BASE DE DATOS Y FILEGROUPS
   ============================================================================ */

USE master;
GO
-- 0. Recreación limpia de la base de datos si ya existe
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'MunicipalidadNicoya2026')
BEGIN
    ALTER DATABASE MunicipalidadNicoya2026 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MunicipalidadNicoya2026;
    PRINT '-> Base de datos anterior eliminada para recreación limpia.';
END
GO

-- 1. Creación de la Base de Datos principal 
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

-- ============================================================================
-- CREACIÓN DE FILEGROUPS 
-- ============================================================================

-- Filegroup: FG_Contribuyentes (Contribuyente, Contribuyente_Fisico, Contribuyente_Juridico, Representante_Legal)
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

-- Filegroup: FG_Inmuebles (Distrito, Tipo_Uso_Inmueble, Bien_Inmueble, Derecho_Inmueble)
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

-- Filegroup: FG_Tramites (Departamento, Tipo_Tramite, Requisito, Tipo_Tramite_Requisito, Estado_Tramite, Tramite, Historial_Tramite, Archivo_Adjunto)
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

-- Filegroup: FG_Tributos (Tipo_Tributo, Estado_Deuda, Deudas_Municipales, Factura, Medio_Pago, Pago_Municipal, Detalle_Factura)
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

-- Filegroup: FG_Seguridad (Usuario, Rol, Rol_Usuario, Permiso, Rol_Permiso)
ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Seguridad;
GO
ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Seguridad',
    FILENAME = 'C:\SQLData\Nicoya2026_Seguridad.ndf',
    SIZE = 16MB,
    MAXSIZE = 512MB,
    FILEGROWTH = 16MB
) TO FILEGROUP FG_Seguridad;
GO

-- Filegroup: FG_Auditoria_DBA (Tipo_Accion_Auditoria, Logs_Acciones_Auditoria, Logs_eventos_Auditoria, Estados_Respaldos, Tipo_de_respaldo, Frecuencia, Respaldos_Config, Respaldos, Restauracion)
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