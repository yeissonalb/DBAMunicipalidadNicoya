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

export function DashboardPage() {
  const { user, hasRole } = useAuth();

  const canTramites = hasRole(MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES);
  const canPagos = hasRole(MODULE_PERMISSIONS.TRIBUTOS_PAGOS);
  const canInmuebles = hasRole(MODULE_PERMISSIONS.INMUEBLES);
  const canReportes = hasRole(MODULE_PERMISSIONS.REPORTES);
  const canAuditoria = hasRole(MODULE_PERMISSIONS.AUDITORIA);
  const canDba = hasRole(MODULE_PERMISSIONS.DBA_CONSOLA);
  const canAdmin = hasRole(MODULE_PERMISSIONS.USUARIOS_ROLES);

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
        subtitle={`Panel Ejecutivo Institucional · Departamento: ${
          user?.nombreDepartamento || 'Municipalidad de Nicoya'
        }`}
        badge={user?.rol || 'Sesión Activa'}
        icon={<Landmark className="h-6 w-6" />}
      />

      {/* KPI Summary Cards Dynamically Loaded from Authorized Endpoints */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canTramites && (
          <Card className="border-l-4 border-l-[#164B35]">
            <CardHeader className="pb-2">
              <CardDescription>Expedientes Municipales (vw_tramites_seguimiento)</CardDescription>
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
              <CardDescription>Fincas Registradas (vw_inmuebles_propietarios)</CardDescription>
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
              <CardDescription>Recaudación Histórica (vw_estado_cuenta)</CardDescription>
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
              <CardDescription>Recaudación Cantonal (vw_recaudacion_por_distrito)</CardDescription>
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
              <CardDescription>Funcionarios del Sistema (sp_consultar_usuario)</CardDescription>
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
              <CardDescription>Políticas de Respaldo DBA (vw_estado_respaldos)</CardDescription>
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
          <CardTitle>Módulos Autorizados para su Perfil ({user?.roles.join(', ')})</CardTitle>
          <CardDescription>
            Seleccione un módulo operativo conectado a los controladores de{' '}
            <code className="font-mono text-[#164B35]">muni-back</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hasRole(MODULE_PERMISSIONS.CONTRIBUYENTES) && (
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Últimos Eventos Registrados en Bitácora de Auditoría</CardTitle>
              <CardDescription>
                Fuente en tiempo real: <code className="font-mono">GET /api/auditoria/recientes</code>
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/auditoria">Ver Bitácora Completa</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE3DE] text-[#5A6B61]">
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Usuario</th>
                    <th className="py-2 pr-4">Acción</th>
                    <th className="py-2 pr-4">Tabla Afectada</th>
                    <th className="py-2 pr-4">Registro ID</th>
                    <th className="py-2">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {auditoriaRecienteQuery.data.slice(0, 6).map((ev) => (
                    <tr key={ev.idAuditoria}>
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(ev.fechaEvento)}</td>
                      <td className="py-2 pr-4 font-semibold text-[#164B35]">{ev.userName}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{ev.tipoAccion}</Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono">{ev.tablaAfectada}</td>
                      <td className="py-2 pr-4 font-mono">{ev.idRegistroAfectado}</td>
                      <td className="py-2 font-mono text-[#5A6B61]">{ev.direccionIp}</td>
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
  badge,
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
          <Badge variant="gold">{badge}</Badge>
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

