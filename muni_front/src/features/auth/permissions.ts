/**
 * Gobernanza RBAC Unificada y Matriz CRUD Granular de todo el sistema SIGEMUN.
 * Nombres exactos de dbo.Rol (11_Datos_Semilla_Pruebas.sql y MunicipalidadAPI.Constantes.Roles).
 */
export const ROLES = {
  ADMIN: 'Administrador del Sistema',
  ANALISTA_TRAMITES: 'Analista de Plataforma y Trámites',
  CAJERO: 'Cajero de Recaudación',
  AUDITOR: 'Auditor Interno',
  DBA: 'DBA Administrador de Base de Datos',
  CATASTRO: 'Analista de Plataforma y Trámites',
  CIUDADANO: 'Ciudadano Contribuyente',
} as const;

export type RolSistema = (typeof ROLES)[keyof typeof ROLES] | string;

export type CrudActionCode = 'CONSULTAR' | 'CREAR' | 'MODIFICAR' | 'ELIMINAR';

export type CrudModuleKey =
  | 'Contribuyentes'
  | 'RepresentantesLegales'
  | 'Inmuebles'
  | 'DerechosPropiedad'
  | 'TramitesRadicacion'
  | 'ExpedientesRevision'
  | 'ExpedientesSeguimiento'
  | 'CatalogoTramites'
  | 'TributosDeudas'
  | 'FacturacionPagos'
  | 'PortalCiudadano'
  | 'UsuariosRoles'
  | 'MatrizPermisos'
  | 'ReportesDwh'
  | 'AuditoriaForense'
  | 'DbaPoliticas'
  | 'DbaRespaldos';

export interface CrudModuleDefinition {
  key: CrudModuleKey;
  category: string;
  label: string;
  subtitle: string;
  crudDescriptions: {
    CONSULTAR: string;
    CREAR: string;
    MODIFICAR: string;
    ELIMINAR: string;
  };
  dbaExclusiveGovernance?: boolean;
}

/**
 * Catálogo completo de TODAS las operaciones CRUD que existen dentro del sistema SIGEMUN.
 */
export const SYSTEM_CRUD_MODULES: CrudModuleDefinition[] = [
  {
    key: 'Contribuyentes',
    category: 'Catastro y Ciudadanos',
    label: 'Padrón de Contribuyentes (Personas Físicas y Jurídicas)',
    subtitle: 'Gestión de cédulas, API Ministerio de Hacienda, contacto y domicilio fiscal',
    crudDescriptions: {
      CONSULTAR: 'Ver padrón y consultar cédulas en Hacienda',
      CREAR: 'Registrar Persona Física o Jurídica',
      MODIFICAR: 'Editar correo, teléfono, dirección y distrito',
      ELIMINAR: 'Inactivar o dar de baja contribuyente',
    },
  },
  {
    key: 'RepresentantesLegales',
    category: 'Catastro y Ciudadanos',
    label: 'Representantes Legales y Personería Jurídica',
    subtitle: 'Vinculación de apoderados y cargos de representación (dbo.Representante_Legal)',
    crudDescriptions: {
      CONSULTAR: 'Consultar representantes de sociedades',
      CREAR: 'Vincular nuevo representante legal',
      MODIFICAR: 'Actualizar cargo y fechas de vigencia',
      ELIMINAR: 'Revocar o finalizar representación legal',
    },
  },
  {
    key: 'Inmuebles',
    category: 'Catastro y Ciudadanos',
    label: 'Catastro Municipal y Bienes Inmuebles (Fincas)',
    subtitle: 'Fincas, planos catastrados, zonas de uso de suelo y avalúos fiscales',
    crudDescriptions: {
      CONSULTAR: 'Ver inventario de fincas y avalúos',
      CREAR: 'Inscribir nueva finca en catastro',
      MODIFICAR: 'Actualizar valor fiscal (avalúo) y uso de suelo',
      ELIMINAR: 'Desactivar o dar de baja finca catastral',
    },
  },
  {
    key: 'DerechosPropiedad',
    category: 'Catastro y Ciudadanos',
    label: 'Derechos de Copropiedad (Contribuyente_Inmueble)',
    subtitle: 'Asociación de propietarios a fincas y porcentaje de participación (%)',
    crudDescriptions: {
      CONSULTAR: 'Ver copropietarios y porcentajes por finca',
      CREAR: 'Asociar inmueble a contribuyente',
      MODIFICAR: 'Ajustar porcentaje de participación (%)',
      ELIMINAR: 'Desvincular derecho de propiedad',
    },
  },
  {
    key: 'TramitesRadicacion',
    category: 'Gestión de Trámites y Expedientes',
    label: 'Radicación de Expedientes y Carga Documental',
    subtitle: 'Ingreso en ventanilla única, requisitos y subida de archivos PDF/JPG',
    crudDescriptions: {
      CONSULTAR: 'Consultar expedientes radicados y adjuntos',
      CREAR: 'Radicar nuevo expediente y subir documentos',
      MODIFICAR: 'Editar datos iniciales del expediente',
      ELIMINAR: 'Eliminar documento adjunto o anular radicación',
    },
  },
  {
    key: 'ExpedientesRevision',
    category: 'Gestión de Trámites y Expedientes',
    label: 'Revisión Técnica y Cotejo de Requisitos',
    subtitle: 'Validación técnica de planos, certificaciones y cumplimiento documental',
    crudDescriptions: {
      CONSULTAR: 'Ver checklist de requisitos del expediente',
      CREAR: 'Registrar dictamen de validación documental',
      MODIFICAR: 'Cambiar estado de requisito (Validado / Subsanar)',
      ELIMINAR: 'Rechazar o invalidar requisito presentado',
    },
  },
  {
    key: 'ExpedientesSeguimiento',
    category: 'Gestión de Trámites y Expedientes',
    label: 'Seguimiento, Trazabilidad SLA y Resoluciones',
    subtitle: 'Flujo de 4 etapas (Radicado, Revisión, Inspección, Resolución) y bitácora',
    crudDescriptions: {
      CONSULTAR: 'Ver línea de tiempo e historial de cambios',
      CREAR: 'Registrar nuevo avance en bitácora de etapas',
      MODIFICAR: 'Actualizar estado del trámite y observaciones',
      ELIMINAR: 'Archivar o anular expediente administrativo',
    },
  },
  {
    key: 'CatalogoTramites',
    category: 'Gestión de Trámites y Expedientes',
    label: 'Catálogo de Tipos de Trámite, SLA y Requisitos',
    subtitle: 'Parametrización de procedimientos municipales y plazos máximos hábiles',
    crudDescriptions: {
      CONSULTAR: 'Consultar catálogo de trámites y requisitos',
      CREAR: 'Crear nuevo tipo de trámite o requisito',
      MODIFICAR: 'Modificar días de SLA o obligatoriedad',
      ELIMINAR: 'Desactivar tipo de trámite o requisito',
    },
  },
  {
    key: 'TributosDeudas',
    category: 'Hacienda y Recaudación',
    label: 'Estado de Cuenta Integral, Tributos y Gestión de Cobro',
    subtitle: 'Deuda principal, intereses moratorios, certificaciones y cobro judicial',
    crudDescriptions: {
      CONSULTAR: 'Consultar deudas y emitir certificación oficial',
      CREAR: 'Generar liquidación o cargo tributario',
      MODIFICAR: 'Actualizar estatus legal (Arreglo / Cobro Judicial)',
      ELIMINAR: 'Condonar, prescribir o anular cargo tributario',
    },
  },
  {
    key: 'FacturacionPagos',
    category: 'Hacienda y Recaudación',
    label: 'Caja Municipal, Pagos y Facturación Electrónica Hacienda',
    subtitle: 'Cobro en Efectivo, Tarjeta, SINPE Móvil, Transferencia y clave de 50 dígitos',
    crudDescriptions: {
      CONSULTAR: 'Ver saldos pendientes, recibos y facturas',
      CREAR: 'Registrar pago en caja y emitir factura Hacienda',
      MODIFICAR: 'Conciliar comprobante bancario o medio de pago',
      ELIMINAR: 'Anular recibo de pago o nota de crédito',
    },
  },
  {
    key: 'PortalCiudadano',
    category: 'Atención Ciudadana',
    label: 'Portal Ciudadano en Línea (Oficina Virtual)',
    subtitle: 'Autogestión de trámites en curso, estado de cuenta, requisitos y SINPE Móvil',
    crudDescriptions: {
      CONSULTAR: 'Consultar mis trámites, fincas y estado de cuenta',
      CREAR: 'Subir requisito faltante y pagar en línea (SINPE)',
      MODIFICAR: 'Actualizar datos de notificación ciudadana',
      ELIMINAR: 'Desistir o cancelar solicitud en línea',
    },
  },
  {
    key: 'UsuariosRoles',
    category: 'Gobernanza y Seguridad (RBAC)',
    label: 'Administración de Usuarios Institucionales y Roles',
    subtitle: 'Cuentas de funcionarios, departamentos y asignación de perfiles RBAC',
    crudDescriptions: {
      CONSULTAR: 'Listar usuarios institucionales y roles asignados',
      CREAR: 'Crear nuevo usuario institucional',
      MODIFICAR: 'Editar datos del funcionario y asignar roles',
      ELIMINAR: 'Bloquear o desactivar cuenta de usuario',
    },
  },
  {
    key: 'MatrizPermisos',
    category: 'Gobernanza y Seguridad (RBAC)',
    label: 'Matriz de Permisos (RBAC) y Catálogo de Seguridad',
    subtitle: 'Parametrización CRUD por rol con triple confirmación de seguridad',
    crudDescriptions: {
      CONSULTAR: 'Visualizar matriz de permisos por rol',
      CREAR: 'Registrar nuevo rol o permiso en SQL Server',
      MODIFICAR: 'Conceder privilegios CRUD en la matriz',
      ELIMINAR: 'Revocar privilegios o restablecer matriz',
    },
  },
  {
    key: 'ReportesDwh',
    category: 'Consola DBA y Auditoría',
    label: 'Data Warehouse y Analítica Tributaria Ejecutiva',
    subtitle: 'Recaudación por distrito, cartera morosa y KPIs (Gobernado por DBA)',
    dbaExclusiveGovernance: true,
    crudDescriptions: {
      CONSULTAR: 'Visualizar tableros e indicadores del Data Warehouse',
      CREAR: 'Generar corte analítico o exportación ejecutiva',
      MODIFICAR: 'Parametrizar dimensiones y filtros del DWH',
      ELIMINAR: 'Depurar o reiniciar vistas materializadas',
    },
  },
  {
    key: 'AuditoriaForense',
    category: 'Consola DBA y Auditoría',
    label: 'Bitácora de Auditoría Forense (Data Diff JSON)',
    subtitle: 'Trazabilidad inmutable INSERT/UPDATE/DELETE e inspección lado a lado',
    dbaExclusiveGovernance: true,
    crudDescriptions: {
      CONSULTAR: 'Inspeccionar bitácora forense y Data Diff JSON',
      CREAR: 'Registrar evento manual de auditoría de seguridad',
      MODIFICAR: 'Clasificar severidad de evento auditado',
      ELIMINAR: 'Archivar lote histórico de bitácora (Solo DBA)',
    },
  },
  {
    key: 'DbaPoliticas',
    category: 'Consola DBA y Auditoría',
    label: 'Consola DBA: Motor SQL Server y Políticas de Respaldo',
    subtitle: 'Configuración de respaldos FULL, DIFF y LOG con cifrado AES-256',
    dbaExclusiveGovernance: true,
    crudDescriptions: {
      CONSULTAR: 'Monitorear estado del motor SQL y políticas',
      CREAR: 'Crear nueva política de respaldo automático',
      MODIFICAR: 'Modificar frecuencia, ruta y retención (días)',
      ELIMINAR: 'Desactivar o eliminar política de respaldo',
    },
  },
  {
    key: 'DbaRespaldos',
    category: 'Consola DBA y Auditoría',
    label: 'Consola DBA: Respaldos, SHA-256 y Recuperación (DRP)',
    subtitle: 'Ejecución de respaldos inmediatos y simulacro RESTORE VERIFYONLY',
    dbaExclusiveGovernance: true,
    crudDescriptions: {
      CONSULTAR: 'Consultar catálogo de archivos .bak y hashes SHA-256',
      CREAR: 'Ejecutar respaldo inmediato en SQL Server',
      MODIFICAR: 'Ejecutar prueba de restauración RESTORE VERIFYONLY',
      ELIMINAR: 'Purgar archivo de respaldo expirado',
    },
  },
];

export const RBAC_OVERRIDES_STORAGE_KEY = 'sigemun_rbac_overrides_v2';

export interface RbacOverrideMap {
  /** Clave: `${nombreRol}::${moduloKey}::${accion}` -> boolean */
  [key: string]: boolean;
}

export function getRbacOverrides(): RbacOverrideMap {
  try {
    const raw = localStorage.getItem(RBAC_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RbacOverrideMap;
  } catch {
    return {};
  }
}

export function saveRbacOverrides(map: RbacOverrideMap): void {
  localStorage.setItem(RBAC_OVERRIDES_STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event('sigemun-rbac-updated'));
}

/**
 * Normaliza el nombre de un rol de SQL Server al identificador canónico de ROLES.
 */
export function normalizeRoleName(rol: string): string {
  const r = (rol || '').trim();
  const lower = r.toLowerCase();
  if (lower.includes('dba') || lower.includes('base de datos')) return ROLES.DBA;
  if (lower.includes('administrador del sistema') || lower === 'admin') return ROLES.ADMIN;
  if (lower.includes('cajero') || lower.includes('recaudaci')) return ROLES.CAJERO;
  if (lower.includes('analista') || lower.includes('trámite') || lower.includes('tramite')) {
    return ROLES.ANALISTA_TRAMITES;
  }
  if (lower.includes('auditor')) return ROLES.AUDITOR;
  if (lower.includes('ciudadano') || lower.includes('cliente')) return ROLES.CIUDADANO;
  return r;
}

/**
 * Define los permisos CRUD por defecto de fábrica para cada rol del sistema,
 * garantizando que cada rol únicamente vea y opere los módulos que le corresponden.
 */
export function getDefaultRoleCrudPermission(
  rolName: string,
  moduleKey: CrudModuleKey,
  action: CrudActionCode
): boolean {
  const canonical = normalizeRoleName(rolName);

  switch (canonical) {
    case ROLES.ADMIN: {
      // El Administrador del Sistema gestiona usuarios, matriz RBAC y módulos municipales,
      // pero NO interviene en decisiones de Base de Datos (DbaPoliticas / DbaRespaldos)
      // salvo que el DBA se lo habilite explícitamente en la Matriz de Permisos.
      if (moduleKey === 'DbaPoliticas' || moduleKey === 'DbaRespaldos') {
        return false;
      }
      if (moduleKey === 'ReportesDwh' || moduleKey === 'AuditoriaForense') {
        return action === 'CONSULTAR';
      }
      return true;
    }

    case ROLES.DBA: {
      // El DBA tiene acceso exclusivo a Administración de BD, Respaldos, Data Warehouse,
      // Auditoría Forense y Matriz de Permisos (RBAC).
      if (
        moduleKey === 'DbaPoliticas' ||
        moduleKey === 'DbaRespaldos' ||
        moduleKey === 'ReportesDwh' ||
        moduleKey === 'AuditoriaForense' ||
        moduleKey === 'MatrizPermisos'
      ) {
        return true;
      }
      return false;
    }

    case ROLES.ANALISTA_TRAMITES: {
      // El Analista de Plataforma y Trámites solo ve y opera Catastro/Contribuyentes y Trámites/Expedientes
      if (
        moduleKey === 'Contribuyentes' ||
        moduleKey === 'RepresentantesLegales' ||
        moduleKey === 'Inmuebles' ||
        moduleKey === 'DerechosPropiedad' ||
        moduleKey === 'ExpedientesRevision' ||
        moduleKey === 'ExpedientesSeguimiento' ||
        moduleKey === 'CatalogoTramites'
      ) {
        return action !== 'ELIMINAR';
      }
      if (moduleKey === 'TramitesRadicacion') {
        return true;
      }
      return false;
    }

    case ROLES.CAJERO: {
      // El Cajero de Recaudación solo ve Caja/Facturación, Estado de Cuenta/Deudas y consulta de Contribuyentes
      if (moduleKey === 'FacturacionPagos') {
        return action === 'CONSULTAR' || action === 'CREAR' || action === 'MODIFICAR';
      }
      if (moduleKey === 'TributosDeudas') {
        return action === 'CONSULTAR' || action === 'CREAR' || action === 'MODIFICAR';
      }
      if (moduleKey === 'Contribuyentes') {
        return action === 'CONSULTAR';
      }
      return false;
    }

    case ROLES.AUDITOR: {
      // El Auditor Interno solo ve Auditoría Forense y Data Warehouse en modo lectura (CONSULTAR)
      if (moduleKey === 'AuditoriaForense' || moduleKey === 'ReportesDwh') {
        return action === 'CONSULTAR';
      }
      return false;
    }

    case ROLES.CIUDADANO: {
      if (moduleKey === 'PortalCiudadano') {
        return action === 'CONSULTAR' || action === 'CREAR';
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Verifica si un rol específico tiene un permiso CRUD activo (considerando overrides de la Matriz RBAC).
 */
export function isRoleCrudAllowed(
  rolName: string,
  moduleKey: CrudModuleKey,
  action: CrudActionCode,
  customOverrides?: RbacOverrideMap
): boolean {
  const overrides = customOverrides ?? getRbacOverrides();
  const canonical = normalizeRoleName(rolName);

  const exactKey = `${rolName}::${moduleKey}::${action}`;
  if (exactKey in overrides) return overrides[exactKey];

  const canonicalKey = `${canonical}::${moduleKey}::${action}`;
  if (canonicalKey in overrides) return overrides[canonicalKey];

  return getDefaultRoleCrudPermission(canonical, moduleKey, action);
}

/**
 * Verifica si alguno de los roles del usuario autenticado tiene permiso para ejecutar `action` en `moduleKey`.
 */
export function canPerformCrud(
  userRoles: string[],
  moduleKey: CrudModuleKey,
  action: CrudActionCode = 'CONSULTAR'
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  const overrides = getRbacOverrides();
  return userRoles.some((rol) => isRoleCrudAllowed(rol, moduleKey, action, overrides));
}

export const MODULE_PERMISSIONS = {
  DASHBOARD: [
    ROLES.ADMIN,
    ROLES.DBA,
    ROLES.CAJERO,
    ROLES.ANALISTA_TRAMITES,
    ROLES.AUDITOR,
    ROLES.CIUDADANO,
  ],
  PORTAL_CIUDADANO: [ROLES.CIUDADANO, ROLES.ADMIN],
  CONTRIBUYENTES: [ROLES.ADMIN, ROLES.ANALISTA_TRAMITES, ROLES.CAJERO],
  INMUEBLES: [ROLES.ADMIN, ROLES.ANALISTA_TRAMITES],
  TRAMITES: [ROLES.ADMIN, ROLES.ANALISTA_TRAMITES],
  TRAMITES_EXPEDIENTES: [ROLES.ADMIN, ROLES.ANALISTA_TRAMITES],
  CATALOGO_TRAMITES_WRITE: [ROLES.ADMIN, ROLES.ANALISTA_TRAMITES],
  TRIBUTOS_DEUDAS: [ROLES.ADMIN, ROLES.CAJERO],
  FACTURACION_PAGOS: [ROLES.ADMIN, ROLES.CAJERO],
  TRIBUTOS_PAGOS: [ROLES.ADMIN, ROLES.CAJERO],
  AUDITORIA: [ROLES.DBA, ROLES.AUDITOR, ROLES.ADMIN],
  AUDITORIA_READ: [ROLES.DBA, ROLES.AUDITOR, ROLES.ADMIN],
  AUDITORIA_WRITE: [ROLES.DBA, ROLES.ADMIN],
  REPORTES: [ROLES.DBA, ROLES.AUDITOR, ROLES.ADMIN],
  USUARIOS_ROLES: [ROLES.ADMIN],
  MATRIZ_PERMISOS: [ROLES.DBA, ROLES.ADMIN],
  DBA_RESPALDOS: [ROLES.DBA],
  DBA_CONSOLA: [ROLES.DBA],
} as const;

/**
 * Mapea una lista de roles permitidos o clave de módulo a la evaluación dinámica de la Matriz RBAC.
 */
export function hasAnyRole(userRoles: string[], allowedRoles: readonly string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRoles || userRoles.length === 0) return false;

  // Primero revisamos si el permiso está gobernado dinámicamente en la Matriz de Permisos CRUD
  const moduleKeysByRoleList: Array<{
    ref: readonly string[];
    keys: CrudModuleKey[];
  }> = [
    { ref: MODULE_PERMISSIONS.PORTAL_CIUDADANO, keys: ['PortalCiudadano'] },
    {
      ref: MODULE_PERMISSIONS.CONTRIBUYENTES,
      keys: ['Contribuyentes', 'RepresentantesLegales'],
    },
    { ref: MODULE_PERMISSIONS.INMUEBLES, keys: ['Inmuebles', 'DerechosPropiedad'] },
    {
      ref: MODULE_PERMISSIONS.TRAMITES,
      keys: [
        'TramitesRadicacion',
        'ExpedientesRevision',
        'ExpedientesSeguimiento',
        'CatalogoTramites',
      ],
    },
    {
      ref: MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES,
      keys: [
        'TramitesRadicacion',
        'ExpedientesRevision',
        'ExpedientesSeguimiento',
        'CatalogoTramites',
      ],
    },
    { ref: MODULE_PERMISSIONS.TRIBUTOS_DEUDAS, keys: ['TributosDeudas'] },
    { ref: MODULE_PERMISSIONS.FACTURACION_PAGOS, keys: ['FacturacionPagos'] },
    {
      ref: MODULE_PERMISSIONS.TRIBUTOS_PAGOS,
      keys: ['FacturacionPagos', 'TributosDeudas'],
    },
    { ref: MODULE_PERMISSIONS.USUARIOS_ROLES, keys: ['UsuariosRoles'] },
    { ref: MODULE_PERMISSIONS.MATRIZ_PERMISOS, keys: ['MatrizPermisos'] },
    { ref: MODULE_PERMISSIONS.REPORTES, keys: ['ReportesDwh'] },
    { ref: MODULE_PERMISSIONS.AUDITORIA, keys: ['AuditoriaForense'] },
    { ref: MODULE_PERMISSIONS.AUDITORIA_READ, keys: ['AuditoriaForense'] },
    { ref: MODULE_PERMISSIONS.DBA_RESPALDOS, keys: ['DbaPoliticas', 'DbaRespaldos'] },
    { ref: MODULE_PERMISSIONS.DBA_CONSOLA, keys: ['DbaPoliticas', 'DbaRespaldos'] },
  ];

  const matchedGroup = moduleKeysByRoleList.find((g) => g.ref === allowedRoles);
  if (matchedGroup) {
    return matchedGroup.keys.some((k) => canPerformCrud(userRoles, k, 'CONSULTAR'));
  }

  const normalizedUserRoles = userRoles.map(normalizeRoleName);
  const normalizedAllowed = allowedRoles.map(normalizeRoleName);

  return normalizedUserRoles.some((r) => normalizedAllowed.includes(r));
}

export function getDefaultRouteForRoles(roles: string[]): string {
  if (!roles || roles.length === 0) return '/dashboard';
  const normalized = roles.map(normalizeRoleName);
  if (normalized.includes(ROLES.CIUDADANO) && normalized.length === 1) {
    return '/portal-ciudadano';
  }
  return '/dashboard';
}
