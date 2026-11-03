/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 07: SEGURIDAD DE SERVIDOR Y BASE DE DATOS (LOGINS, USUARIOS, ROLES, PRIVILEGIOS)
   ============================================================================ */

USE master;

GO

PRINT '=======================================================';
PRINT '   CONFIGURACIÓN DE SEGURIDAD A NIVEL DE SQL SERVER   ';
PRINT '=======================================================';

GO

-- 0. LIMPIEZA PREVIA DE LOGINS DE SERVIDOR
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_dba_nicoya')
    CREATE LOGIN usr_dba_nicoya WITH PASSWORD = N'NicoyaDBA2026!#Strong', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;

ALTER SERVER ROLE sysadmin ADD MEMBER usr_dba_nicoya;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_administrador')
    CREATE LOGIN usr_administrador WITH PASSWORD = N'AdminNicoya2026!#Sec', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;


IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_cajero')
    CREATE LOGIN usr_cajero WITH PASSWORD = N'CajaNicoya2026!#Pay', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;


IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_analista')
    CREATE LOGIN usr_analista WITH PASSWORD = N'AnalistaNicoya2026!#Gov', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;


IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_auditor')
    CREATE LOGIN usr_auditor WITH PASSWORD = N'AuditorNicoya2026!#Log', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;


GO

PRINT '-> Logins de SQL Server creados con éxito.';

GO

-- 2. CONFIGURACIÓN DENTRO DE LA BASE DE DATOS MunicipalidadNicoya2026
-- ============================================================================
USE MunicipalidadNicoya2026;

GO

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_dba_nicoya') DROP USER usr_dba_nicoya;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_administrador') DROP USER usr_administrador;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_cajero') DROP USER usr_cajero;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_analista') DROP USER usr_analista;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_auditor') DROP USER usr_auditor;

GO

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_administrador' AND type = 'R') DROP ROLE rol_administrador;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_cajero' AND type = 'R') DROP ROLE rol_cajero;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_analista_tramites' AND type = 'R') DROP ROLE rol_analista_tramites;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_auditor' AND type = 'R') DROP ROLE rol_auditor;

GO

CREATE ROLE rol_administrador;
CREATE ROLE rol_cajero;
CREATE ROLE rol_analista_tramites;
CREATE ROLE rol_auditor;

GO

CREATE USER usr_dba_nicoya FOR LOGIN usr_dba_nicoya;
CREATE USER usr_administrador FOR LOGIN usr_administrador;
CREATE USER usr_cajero FOR LOGIN usr_cajero;
CREATE USER usr_analista FOR LOGIN usr_analista;
CREATE USER usr_auditor FOR LOGIN usr_auditor;

GO

ALTER ROLE db_owner ADD MEMBER usr_dba_nicoya;

ALTER ROLE rol_administrador ADD MEMBER usr_administrador;
ALTER ROLE rol_cajero ADD MEMBER usr_cajero;
ALTER ROLE rol_analista_tramites ADD MEMBER usr_analista;
ALTER ROLE rol_auditor ADD MEMBER usr_auditor;

GO

-- 3. CONCESIÓN DE PRIVILEGIOS GRANULARES POR ROL (MÍNIMOS PRIVILEGIOS)
-- ============================================================================

-- 3.1 Permisos para ROL ADMINISTRADOR (Gestión de usuarios, padrón e inmuebles)
GRANT SELECT, INSERT, UPDATE ON dbo.Contribuyente TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Contribuyente_Fisico TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Contribuyente_Juridico TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Representante_Legal TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Bien_Inmueble TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Derecho_Inmueble TO rol_administrador;
GRANT SELECT ON dbo.vw_padron_contribuyentes TO rol_administrador;
GRANT SELECT ON dbo.vw_inmuebles_propietarios TO rol_administrador;
GRANT SELECT ON dbo.vw_usuarios_roles_permisos TO rol_administrador;

GRANT EXECUTE ON dbo.sp_registrar_contribuyente_fisico TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_contribuyente_juridico TO rol_administrador;
GRANT EXECUTE ON dbo.sp_actualizar_contribuyente TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_inmueble TO rol_administrador;
GRANT EXECUTE ON dbo.sp_actualizar_inmueble TO rol_administrador;
GRANT EXECUTE ON dbo.sp_asignar_derecho_inmueble TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_usuario TO rol_administrador;
GRANT EXECUTE ON dbo.sp_actualizar_usuario TO rol_administrador;
GRANT EXECUTE ON dbo.sp_cambiar_estado_usuario TO rol_administrador;
GRANT EXECUTE ON dbo.sp_asignar_rol_usuario TO rol_administrador;
GRANT EXECUTE ON dbo.sp_asignar_permiso_rol TO rol_administrador;

GO

GRANT SELECT ON dbo.vw_estado_cuenta_contribuyente TO rol_cajero;
GRANT SELECT ON dbo.vw_facturas_pendientes TO rol_cajero;
GRANT SELECT ON dbo.Medio_Pago TO rol_cajero;
GRANT SELECT ON dbo.Factura TO rol_cajero;

GRANT EXECUTE ON dbo.sp_consultar_contribuyente TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_deudas_contribuyente TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_factura TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_facturas_contribuyente TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_medios_pago TO rol_cajero;
GRANT EXECUTE ON dbo.sp_registrar_pago_municipal TO rol_cajero;
GRANT EXECUTE ON dbo.sp_aplicar_pago_factura TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_estado_cuenta TO rol_cajero;
GRANT EXECUTE ON dbo.sp_generar_factura TO rol_cajero;

GO

GRANT SELECT ON dbo.vw_tramites_seguimiento TO rol_analista_tramites;
GRANT SELECT ON dbo.vw_historial_tramites_detallado TO rol_analista_tramites;
GRANT SELECT ON dbo.Tipo_Tramite TO rol_analista_tramites;
GRANT SELECT ON dbo.Requisito TO rol_analista_tramites;
GRANT SELECT ON dbo.Estado_Tramite TO rol_analista_tramites;
GRANT SELECT ON dbo.Archivo_Adjunto TO rol_analista_tramites;

GRANT EXECUTE ON dbo.sp_registrar_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_actualizar_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_registrar_requisito_presentado TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_adjuntar_archivo_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_cambiar_estado_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_estados_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_historial_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_registrar_resolucion_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_tramites_por_contribuyente TO rol_analista_tramites;

GO

GRANT SELECT ON dbo.vw_auditoria_detallada TO rol_auditor;
GRANT SELECT ON dbo.vw_estado_respaldos TO rol_auditor;
GRANT SELECT ON dbo.vw_morosidad_contribuyentes TO rol_auditor;
GRANT SELECT ON dbo.vw_recaudacion_por_tributo TO rol_auditor;
GRANT SELECT ON dbo.vw_recaudacion_por_distrito TO rol_auditor;
GRANT SELECT ON dbo.Logs_Acciones_Auditoria TO rol_auditor;
GRANT SELECT ON dbo.Logs_eventos_Auditoria TO rol_auditor;

GRANT EXECUTE ON dbo.sp_consultar_auditoria TO rol_auditor;
GRANT EXECUTE ON dbo.sp_filtrar_auditoria TO rol_auditor;
GRANT EXECUTE ON dbo.sp_consultar_auditoria_registro TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_historial_tramites_contribuyente TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_recaudacion_tributo TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_recaudacion_distrito TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_contribuyentes_morosos TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_solicitudes_departamento TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_eficiencia_tramites TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_gestion_municipal TO rol_auditor;

-- Principio de inmutabilidad: Se deniega expresamente modificación o eliminación de pistas de auditoría
DENY INSERT, UPDATE, DELETE ON dbo.Logs_Acciones_Auditoria TO rol_auditor;
DENY INSERT, UPDATE, DELETE ON dbo.Logs_eventos_Auditoria TO rol_auditor;

GO

PRINT '-> Configuración de seguridad, logins, roles y permisos de base de datos finalizada.';

GO


-- Permisos para los objetos nuevos (roles de BD del script 07)
-- ============================================================================
GRANT EXECUTE ON dbo.sp_consultar_roles         TO rol_administrador;
GRANT EXECUTE ON dbo.sp_consultar_permisos      TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_rol           TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_permiso       TO rol_administrador;
GRANT EXECUTE ON dbo.sp_consultar_departamentos TO rol_administrador;
GRANT EXECUTE ON dbo.sp_consultar_departamentos TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_requisitos    TO rol_analista_tramites;
-- Los catálogos de respaldo los usa el DBA (usr_dba_nicoya es db_owner: no requiere GRANT)

GO


IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_cajero')
    GRANT EXECUTE ON dbo.sp_cajero_aplicar_pago TO rol_cajero;

GO


IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name='rol_analista_tramites')
BEGIN
 GRANT EXECUTE ON dbo.sp_consultar_cotejo_requisitos TO rol_analista_tramites;
 GRANT EXECUTE ON dbo.sp_revisar_archivo_requisito TO rol_analista_tramites;
END;

GO


IF EXISTS(SELECT 1 FROM sys.database_principals WHERE name='rol_cajero')
BEGIN
 GRANT EXECUTE ON dbo.sp_caja_facturas_pendientes TO rol_cajero;
 GRANT EXECUTE ON dbo.sp_caja_reportes_pendientes TO rol_cajero;
 GRANT EXECUTE ON dbo.sp_cajero_aplicar_pago TO rol_cajero;
END;

GO
