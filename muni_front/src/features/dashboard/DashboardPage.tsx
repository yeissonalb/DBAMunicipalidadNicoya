import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Database,
  FilePlus2,
  FileSpreadsheet,
  FolderKanban,
  Landmark,
  Receipt,
  Scale,
  ShieldCheck,
  Sliders,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { MODULE_PERMISSIONS, ROLES } from '@/features/auth/permissions';
import {
  auditoriaApi,
  facturacionPagoApi,
  inmuebleApi,
  reportesApi,
  respaldosDbaApi,
  tramiteApi,
  usuarioApi,
} from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrencyCRC, formatDateTime, formatNumber } from '@/lib/utils';

const ROLE_DASHBOARD_COPY: Record<string, string> = {
  [ROLES.ADMIN]: 'Visión ejecutiva de la operación municipal, seguridad y continuidad institucional',
  [ROLES.ANALISTA]: 'Gestión de expedientes, revisión técnica, catastro y trazabilidad de trámites',
  [ROLES.CAJERO]: 'Atención al contribuyente, recaudación, facturación y control de obligaciones',
  [ROLES.AUDITOR]: 'Supervisión de indicadores, cartera, cumplimiento y trazabilidad institucional',
  [ROLES.DBA]: 'Continuidad operativa, integridad de datos, respaldos y auditoría técnica',
};

export function DashboardPage() {
  const { user, hasRole } = useAuth();

  const activeRole =
    user?.roles.find((role) => ROLE_DASHBOARD_COPY[role]) || user?.rol || 'Perfil institucional';
  const dashboardDescription =
    ROLE_DASHBOARD_COPY[activeRole] || 'Resumen de operación y accesos autorizados para su sesión';

  const canTramites = hasRole(MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES);
  const canPagos = hasRole(MODULE_PERMISSIONS.TRIBUTOS_PAGOS);
  const canContribuyentes = hasRole(MODULE_PERMISSIONS.CONTRIBUYENTES);
  const canInmuebles = hasRole(MODULE_PERMISSIONS.INMUEBLES);
  const canReportes = hasRole(MODULE_PERMISSIONS.REPORTES);
  const canAuditoria = hasRole(MODULE_PERMISSIONS.AUDITORIA);
  const canDba = hasRole(MODULE_PERMISSIONS.DBA_CONSOLA);
  const canAdmin = hasRole(MODULE_PERMISSIONS.USUARIOS_ROLES);
  const visibleKpiCount = [
    canTramites,
    canInmuebles,
    canPagos,
    canReportes,
    canAdmin,
    canDba,
  ].filter(Boolean).length;
  const kpiGridColumns =
    visibleKpiCount >= 3
      ? 'lg:grid-cols-3'
      : visibleKpiCount === 2
        ? 'lg:grid-cols-2'
        : 'lg:grid-cols-1';
  const visibleModuleCount =
    Number(canContribuyentes) +
    Number(canInmuebles) +
    Number(canTramites) * 3 +
    Number(canPagos) * 2 +
    Number(canReportes) +
    Number(canAuditoria) +
    Number(canAdmin) * 2 +
    Number(canDba) * 2;
  const moduleGridColumns =
    visibleModuleCount === 2 || activeRole === ROLES.ANALISTA
      ? 'lg:grid-cols-2'
      : 'lg:grid-cols-3';

  const tramitesQuery = useQuery({
    queryKey: ['dashboard', 'tramites'],
    queryFn: () => tramiteApi.seguimiento(),
    enabled: canTramites,
  });

  const inmueblesQuery = useQuery({
    queryKey: ['dashboard', 'inmuebles'],
    queryFn: () => inmuebleApi.listarConPropietarios(),
    enabled: canInmuebles,
  });

  const estadoCuentaQuery = useQuery({
    queryKey: ['dashboard', 'estado-cuenta'],
    queryFn: () => facturacionPagoApi.estadoCuentaGeneral(),
    enabled: canPagos,
  });

  const recaudacionDistritoQuery = useQuery({
    queryKey: ['dashboard', 'recaudacion-distrito'],
    queryFn: () => reportesApi.recaudacionDistrito(),
    enabled: canReportes,
  });

  const respaldosEstadoQuery = useQuery({
    queryKey: ['dashboard', 'respaldos-estado'],
    queryFn: () => respaldosDbaApi.estado(),
    enabled: canDba,
  });

  const auditoriaRecienteQuery = useQuery({
    queryKey: ['dashboard', 'auditoria-recientes'],
    queryFn: () => auditoriaApi.recientes(),
    enabled: canAuditoria,
  });

  const usuariosQuery = useQuery({
    queryKey: ['dashboard', 'usuarios'],
    queryFn: () => usuarioApi.consultar(),
    enabled: canAdmin,
  });

  const totalTramites = tramitesQuery.data?.length ?? 0;
  const tramitesEnCurso =
    tramitesQuery.data?.filter((t) => !t.esEstadoFinal).length ?? 0;
  const totalInmueblesUnicos = new Set(
    (inmueblesQuery.data ?? []).map((i) => i.idInmueble)
  ).size;
  const totalPagadoHistorico = (estadoCuentaQuery.data ?? []).reduce(
    (acc, c) => acc + (c.totalPagadoHistorico ?? 0),
    0
  );
  const totalPendienteDeuda = (estadoCuentaQuery.data ?? []).reduce(
    (acc, c) => acc + (c.montoPendienteDeuda ?? 0),
    0
  );
  const totalRecaudadoCantonal = (recaudacionDistritoQuery.data ?? []).reduce(
    (acc, d) => acc + (d.totalRecaudadoDistrito ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido(a), ${user?.nombreCompleto || user?.userName || 'Funcionario'}`}
        subtitle={`${dashboardDescription} · Departamento: ${
          user?.nombreDepartamento || 'Municipalidad de Nicoya'
        }`}
        badge={activeRole}
        icon={
          <img
            src="/images/logo2.png"
            alt="Identidad visual de la Municipalidad de Nicoya"
            className="h-10 w-10 rounded-xl object-contain shadow-sm"
          />
        }
      />

      {/* KPI Summary Cards Dynamically Loaded from Authorized Endpoints */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${kpiGridColumns}`}>
        {canTramites && (
          <Card className="border-l-4 border-l-[#164B35]">
            <CardHeader className="pb-2">
              <CardDescription>Expedientes municipales</CardDescription>
              <CardTitle className="text-2xl font-extrabold text-[#164B35]">
                {tramitesQuery.isLoading ? '...' : formatNumber(totalTramites)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#5A6B61]">
                En gestión activa: <strong>{formatNumber(tramitesEnCurso)}</strong> expediente(s)
              </p>
            </CardContent>
          </Card>
        )}

        {canInmuebles && (
          <Card className="border-l-4 border-l-[#B6944A]">
            <CardHeader className="pb-2">
              <CardDescription>Fincas registradas</CardDescription>
              <CardTitle className="text-2xl font-extrabold text-[#26352D]">
                {inmueblesQuery.isLoading ? '...' : formatNumber(totalInmueblesUnicos)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#5A6B61]">
                Derechos catastrales: <strong>{formatNumber(inmueblesQuery.data?.length ?? 0)}</strong>
              </p>
            </CardContent>
          </Card>
        )}

        {canPagos && (
          <Card className="border-l-4 border-l-emerald-600">
            <CardHeader className="pb-2">
              <CardDescription>Recaudación histórica</CardDescription>
              <CardTitle className="text-xl font-extrabold text-emerald-800">
                {estadoCuentaQuery.isLoading ? '...' : formatCurrencyCRC(totalPagadoHistorico)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#5A6B61]">
                Saldo pendiente por cobrar:{' '}
                <strong className="text-amber-700">{formatCurrencyCRC(totalPendienteDeuda)}</strong>
              </p>
            </CardContent>
          </Card>
        )}

        {canReportes && (
          <Card className="border-l-4 border-l-sky-600">
            <CardHeader className="pb-2">
              <CardDescription>Recaudación cantonal</CardDescription>
              <CardTitle className="text-xl font-extrabold text-sky-900">
                {recaudacionDistritoQuery.isLoading
                  ? '...'
                  : formatCurrencyCRC(totalRecaudadoCantonal)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#5A6B61]">
                Distritos monitoreados:{' '}
                <strong>{formatNumber(recaudacionDistritoQuery.data?.length ?? 0)}</strong>
              </p>
            </CardContent>
          </Card>
        )}

        {canAdmin && (
          <Card className="border-l-4 border-l-[#164B35]">
            <CardHeader className="pb-2">
              <CardDescription>Funcionarios del sistema</CardDescription>
              <CardTitle className="text-2xl font-extrabold text-[#164B35]">
                {usuariosQuery.isLoading ? '...' : formatNumber(usuariosQuery.data?.length ?? 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#5A6B61]">
                Activos:{' '}
                <strong>
                  {formatNumber(usuariosQuery.data?.filter((u) => u.activo).length ?? 0)}
                </strong>
              </p>
            </CardContent>
          </Card>
        )}

        {canDba && (
          <Card className="border-l-4 border-l-[#B6944A]">
            <CardHeader className="pb-2">
              <CardDescription>Políticas de respaldo</CardDescription>
              <CardTitle className="text-2xl font-extrabold text-[#26352D]">
                {respaldosEstadoQuery.isLoading
                  ? '...'
                  : formatNumber(respaldosEstadoQuery.data?.length ?? 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#5A6B61]">
                Políticas activas:{' '}
                <strong>
                  {formatNumber(
                    respaldosEstadoQuery.data?.filter((r) => r.configuracionActiva).length ?? 0
                  )}
                </strong>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role-Based Quick Access Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Herramientas disponibles para su perfil</CardTitle>
          <CardDescription>
            Accesos habilitados para {activeRole}, de acuerdo con los permisos de su sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${moduleGridColumns}`}>
            {canContribuyentes && (
              <QuickModuleCard
                title="Padrón de Contribuyentes"
                description="Personas físicas, jurídicas, representantes legales y búsqueda multicriterio."
                to="/contribuyentes"
                icon={<Users className="h-5 w-5" />}
                badge="WF-11"
              />
            )}
            {hasRole(MODULE_PERMISSIONS.INMUEBLES) && (
              <QuickModuleCard
                title="Bienes Inmuebles y Copropiedad"
                description="Registro catastral de fincas, distritos de Nicoya y asignación de derechos."
                to="/inmuebles"
                icon={<Building2 className="h-5 w-5" />}
                badge="WF-11"
              />
            )}
            {hasRole(MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES) && (
              <>
                <QuickModuleCard
                  title="Radicación de Trámites"
                  description="Apertura de expedientes municipales, requisitos y subida de adjuntos."
                  to="/tramites/radicar"
                  icon={<FilePlus2 className="h-5 w-5" />}
                  badge="WF-8"
                />
                <QuickModuleCard
                  title="Revisión y Resolución"
                  description="Evaluación técnica de expedientes, avance de estado y resolución APR/RECH."
                  to="/expedientes/revision"
                  icon={<ClipboardCheck className="h-5 w-5" />}
                  badge="WF-9"
                />
                <QuickModuleCard
                  title="Seguimiento y Trazabilidad"
                  description="Línea de tiempo de estados, SLA transcurrido y bitácora detallada."
                  to="/expedientes/seguimiento"
                  icon={<FolderKanban className="h-5 w-5" />}
                  badge="WF-10"
                />
              </>
            )}
            {hasRole(MODULE_PERMISSIONS.TRIBUTOS_PAGOS) && (
              <>
                <QuickModuleCard
                  title="Pagos Municipales y Caja"
                  description="Facturación electrónica Hacienda, cobro por medio de pago y aplicación."
                  to="/pagos"
                  icon={<Receipt className="h-5 w-5" />}
                  badge="WF-12"
                />
                <QuickModuleCard
                  title="Tributos, Deudas y Mora"
                  description="Cargos tributarios, recálculo de intereses en BD y estado de cuenta."
                  to="/tributos"
                  icon={<Scale className="h-5 w-5" />}
                  badge="Tributos"
                />
              </>
            )}
            {hasRole(MODULE_PERMISSIONS.REPORTES) && (
              <QuickModuleCard
                title="Análisis Tributario y Reportes"
                description="Recaudación por distrito y tributo, cartera morosa y eficiencia SLA."
                to="/reportes"
                icon={<FileSpreadsheet className="h-5 w-5" />}
                badge="WF-13"
              />
            )}
            {hasRole(MODULE_PERMISSIONS.AUDITORIA) && (
              <QuickModuleCard
                title="Auditoría Forense (Audit Log)"
                description="Bitácora de eventos, filtros por tabla/usuario y comparativa de cambios."
                to="/auditoria"
                icon={<ShieldCheck className="h-5 w-5" />}
                badge="WF-5"
              />
            )}
            {hasRole([ROLES.ADMIN]) && (
              <>
                <QuickModuleCard
                  title="Usuarios y Roles (RBAC)"
                  description="Administración de funcionarios municipales, estados y asignación de roles."
                  to="/seguridad/usuarios"
                  icon={<UserCheck className="h-5 w-5" />}
                  badge="WF-6"
                />
                <QuickModuleCard
                  title="Centro de Seguridad y Matriz"
                  description="Matriz de permisos por rol y módulo bajo el Principio de Mínimo Privilegio."
                  to="/seguridad/matriz"
                  icon={<Sliders className="h-5 w-5" />}
                  badge="WF-7"
                />
              </>
            )}
            {hasRole(MODULE_PERMISSIONS.DBA_CONSOLA) && (
              <>
                <QuickModuleCard
                  title="Consola DBA — Políticas"
                  description="Configuración de políticas de respaldo, retención, cifrado y DBCC CHECKDB."
                  to="/dba/politicas"
                  icon={<Database className="h-5 w-5" />}
                  badge="WF-3"
                />
                <QuickModuleCard
                  title="Consola DBA — Recuperación"
                  description="Historial de respaldos FULL/DIFF y simulacro de restauración ante desastres."
                  to="/dba/respaldos"
                  icon={<Landmark className="h-5 w-5" />}
                  badge="WF-4"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Events if Authorized */}
      {canAuditoria && auditoriaRecienteQuery.data && auditoriaRecienteQuery.data.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-4 border-b border-[#DCE3DE] bg-gradient-to-r from-[#F2F7F4] to-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#164B35] text-[#E2C982] shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Actividad reciente</CardTitle>
                <CardDescription className="mt-1">
                  Últimos eventos registrados en la bitácora de auditoría.
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full bg-white sm:w-auto">
              <Link to="/auditoria">
                Ver bitácora completa <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <div className="overflow-x-auto" role="region" aria-label="Actividad reciente de auditoría" tabIndex={0}>
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE3DE] bg-[#FAFCFB] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                    <th scope="col" className="px-6 py-3.5">Fecha y hora</th>
                    <th scope="col" className="px-4 py-3.5">Usuario</th>
                    <th scope="col" className="px-4 py-3.5">Acción</th>
                    <th scope="col" className="px-4 py-3.5">Entidad afectada</th>
                    <th scope="col" className="px-4 py-3.5">Registro</th>
                    <th scope="col" className="px-6 py-3.5">Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {auditoriaRecienteQuery.data.slice(0, 6).map((ev) => (
                    <tr key={ev.idAuditoria} className="group transition-colors hover:bg-[#F2F7F4]">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-[#26352D]">
                        {ev.fechaEvento ? formatDateTime(ev.fechaEvento) : 'Fecha no disponible'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F0EC] text-xs font-bold text-[#164B35]">
                            {(ev.userName || 'S').slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-semibold text-[#164B35]">{ev.userName || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={ev.tipoAccion ? 'gold' : 'outline'}>
                          {ev.tipoAccion || 'Sin clasificar'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 font-medium text-[#26352D]">
                        {(ev.tablaAfectada || 'Sin entidad').replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-lg bg-[#F2F5F3] px-2.5 py-1 font-mono text-xs font-semibold text-[#42534A]">
                          #{ev.idRegistroAfectado ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#607168]">
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                          {ev.direccionIp === '<local machine>'
                            ? 'Servidor local'
                            : ev.direccionIp || 'No disponible'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickModuleCard({
  title,
  description,
  to,
  icon,
}: {
  title: string;
  description: string;
  to: string;
  icon: React.ReactNode;
  badge: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col justify-between rounded-xl border border-[#DCE3DE] bg-[#F5F7F4]/60 p-4 transition-all hover:border-[#164B35] hover:bg-white hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#164B35] text-[#B6944A]">
            {icon}
          </div>
          <Badge variant="success">Disponible</Badge>
        </div>
        <h3 className="mt-3 text-sm font-bold text-[#26352D] group-hover:text-[#164B35]">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[#5A6B61]">{description}</p>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#164B35]">
        <span>Abrir módulo</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

