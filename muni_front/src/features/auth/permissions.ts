// ============================================================================
// Constantes exactas de roles según muni-back/MunicipalidadAPI/Constantes/Roles.cs
// ============================================================================

export const ROLES = {
  ADMIN: 'Administrador del Sistema',
  ANALISTA: 'Analista de Plataforma y Trámites',
  CAJERO: 'Cajero de Recaudación',
  AUDITOR: 'Auditor Interno',
  DBA: 'DBA Administrador de Base de Datos',
} as const;

export type SystemRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Permisos exactos de cada controlador C# en muni-back:
 * - UsuarioController: Admin
 * - RolPermisoController: Admin
 * - ContribuyenteController: Admin, Cajero
 * - InmuebleController: Admin, Analista
 * - CatalogosInmuebleController: Admin, Analista
 * - TipoTramiteController: Admin, Analista
 * - TramiteController: Admin, Analista
 * - TributoDeudaController: Cajero, Admin
 * - FacturacionPagoController: Admin, Cajero
 * - ReportesController: Auditor, Admin
 * - AuditoriaController: Admin, Auditor, Dba
 * - RespaldosDbaController: Admin, Dba
 */
export const MODULE_PERMISSIONS = {
  DASHBOARD: [ROLES.ADMIN, ROLES.ANALISTA, ROLES.CAJERO, ROLES.AUDITOR, ROLES.DBA],
  PORTAL_CIUDADANO: [ROLES.ADMIN, ROLES.ANALISTA, ROLES.CAJERO, ROLES.AUDITOR, ROLES.DBA],
  USUARIOS_ROLES: [ROLES.ADMIN],
  CONTRIBUYENTES: [ROLES.ADMIN, ROLES.CAJERO],
  INMUEBLES: [ROLES.ADMIN, ROLES.ANALISTA],
  TRAMITES_EXPEDIENTES: [ROLES.ADMIN, ROLES.ANALISTA],
  TRIBUTOS_PAGOS: [ROLES.ADMIN, ROLES.CAJERO],
  REPORTES: [ROLES.ADMIN, ROLES.AUDITOR],
  AUDITORIA: [ROLES.ADMIN, ROLES.AUDITOR, ROLES.DBA],
  DBA_CONSOLA: [ROLES.ADMIN, ROLES.DBA],
} as const;

export function hasAnyRole(userRoles: string[] | undefined, allowedRoles: readonly string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (allowedRoles.length === 0) return true;
  return userRoles.some((r) => allowedRoles.includes(r));
}

export function getDefaultRouteForRoles(roles: string[]): string {
  if (roles.includes(ROLES.ADMIN)) return '/dashboard';
  if (roles.includes(ROLES.ANALISTA)) return '/expedientes/seguimiento';
  if (roles.includes(ROLES.CAJERO)) return '/pagos';
  if (roles.includes(ROLES.DBA)) return '/dba/politicas';
  if (roles.includes(ROLES.AUDITOR)) return '/reportes';
  return '/dashboard';
}

