import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  FileText,
  Globe,
  HardDrive,
  LayoutDashboard,
  Lock,
  Receipt,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { canPerformCrud } from '@/features/auth/permissions';
import {
  contribuyenteApi,
  facturacionPagoApi,
  inmuebleApi,
  tipoTramiteApi,
} from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrencyCRC, formatNumber } from '@/lib/utils';

export function DashboardPage() {
  const { session } = useAuth();
  const roles = session?.roles ?? [];
  const [, setRbacTick] = useState(0);

  useEffect(() => {
    const onRbacChange = () => setRbacTick((t) => t + 1);
    window.addEventListener('sigemun-rbac-updated', onRbacChange);
    return () => window.removeEventListener('sigemun-rbac-updated', onRbacChange);
  }, []);

  const canSeeContribuyentes = canPerformCrud(roles, 'Contribuyentes', 'CONSULTAR');
  const canSeeInmuebles = canPerformCrud(roles, 'Inmuebles', 'CONSULTAR');
  const canSeeFacturacion =
    canPerformCrud(roles, 'FacturacionPagos', 'CONSULTAR') ||
    canPerformCrud(roles, 'TributosDeudas', 'CONSULTAR');
  const canSeeTramites =
    canPerformCrud(roles, 'TramitesRadicacion', 'CONSULTAR') ||
    canPerformCrud(roles, 'CatalogoTramites', 'CONSULTAR');

  const padronQuery = useQuery({
    queryKey: ['dashboard', 'padron'],
    queryFn: () => contribuyenteApi.padron(),
    enabled: canSeeContribuyentes,
  });

  const inmueblesQuery = useQuery({
    queryKey: ['dashboard', 'inmuebles'],
    queryFn: () => inmuebleApi.catastro(),
    enabled: canSeeInmuebles,
  });

  const estadoCuentaQuery = useQuery({
    queryKey: ['dashboard', 'estado-cuenta'],
    queryFn: () => facturacionPagoApi.estadoCuentaGeneral(),
    enabled: canSeeFacturacion,
  });

  const tiposTramiteQuery = useQuery({
    queryKey: ['dashboard', 'tipos-tramite'],
    queryFn: () => tipoTramiteApi.listar(),
    enabled: canSeeTramites,
  });

  const totalPendienteCobro =
    estadoCuentaQuery.data?.reduce((acc, row) => acc + (row.montoPendienteDeuda ?? 0), 0) ?? 0;

  const totalRecaudado =
    estadoCuentaQuery.data?.reduce((acc, row) => acc + (row.totalPagadoHistorico ?? 0), 0) ?? 0;

  // Cada módulo únicamente es visible si el rol actual tiene permiso CONSULTAR en la Matriz RBAC
  const moduleCards = [
    {
      title: 'Padrón de Contribuyentes y Bienes Inmuebles',
      subtitle: 'Personas Físicas, Jurídicas y API Ministerio de Hacienda',
      description:
        'Registro de contribuyentes con consulta de cédula en vivo a Hacienda, representantes legales y copropiedad (% participación).',
      to: '/contribuyentes',
      icon: <Users className="h-5 w-5" />,
      allowed: canSeeContribuyentes,
    },
    {
      title: 'Catastro Municipal y Fincas',
      subtitle: 'Inventario de Propiedades y Avalúos Fiscales',
      description:
        'Administración de fincas, planos catastrados, uso de suelo y actualización de valores fiscales en los 7 distritos.',
      to: '/inmuebles',
      icon: <Building2 className="h-5 w-5" />,
      allowed: canSeeInmuebles,
    },
    {
      title: 'Nueva Radicación y Seguimiento de Expedientes',
      subtitle: 'Ventanilla Única y Gestión Técnica de Trámites',
      description:
        'Búsqueda por cédula en Padrón y Hacienda, SLA estimado, requisitos obligatorios/opcionales y flujo de 4 etapas.',
      to: '/tramites/radicacion',
      icon: <FileText className="h-5 w-5" />,
      allowed: canPerformCrud(roles, 'TramitesRadicacion', 'CONSULTAR'),
    },
    {
      title: 'Revisión Técnica y Cotejo de Requisitos',
      subtitle: 'Validación Documental de Expedientes',
      description:
        'Cotejo de planos y certificaciones, control de plazos SLA y actualización operativa de estado técnico.',
      to: '/tramites/revision',
      icon: <ClipboardCheck className="h-5 w-5" />,
      allowed: canPerformCrud(roles, 'ExpedientesRevision', 'CONSULTAR'),
    },
    {
      title: 'Estado de Cuenta Integral y Gestión de Cobro',
      subtitle: 'Tributos, Intereses Moratorios y Estatus Legal',
      description:
        'Consulta de deuda principal, intereses, emisión de certificación oficial y actualización de estatus legal.',
      to: '/tributos-deudas',
      icon: <Scale className="h-5 w-5" />,
      allowed: canPerformCrud(roles, 'TributosDeudas', 'CONSULTAR'),
    },
    {
      title: 'Caja y Facturación Municipal',
      subtitle: 'Recaudación y Comprobante Electrónico Hacienda',
      description:
        'Selección de saldos pendientes, clave numérica de 50 dígitos y registro de pago (Efectivo, Tarjeta, SINPE Móvil, Transferencia).',
      to: '/pagos-municipales',
      icon: <Receipt className="h-5 w-5" />,
      allowed: canPerformCrud(roles, 'FacturacionPagos', 'CONSULTAR'),
    },
    {
      title: 'Administración de Usuarios y Roles',
      subtitle: 'Gestión de Funcionarios y Perfiles RBAC',
      description:
        'Creación de usuarios institucionales, asignación de roles e interruptor de estado activo.',
      to: '/seguridad/usuarios',
      icon: <Users className="h-5 w-5" />,
      allowed: canPerformCrud(roles, 'UsuariosRoles', 'CONSULTAR'),
    },
    {
      title: 'Matriz de Permisos (RBAC) — CRUD Completo',
      subtitle: 'Centro de Seguridad y Gobernanza Institucional',
      description:
        'Parametrización de permisos Consultar, Crear, Modificar y Eliminar en todos los módulos con confirmación de 3 pasos.',
      to: '/seguridad/matriz-permisos',
      icon: <Lock className="h-5 w-5" />,
      allowed: canPerformCrud(roles, 'MatrizPermisos', 'CONSULTAR'),
    },
    {
      title: 'Data Warehouse y Análisis Tributario',
      subtitle: 'Tablero de Recaudación Distrital y Cartera Morosa',
      description:
        'Indicadores ejecutivos por distrito (Nicoya, Mansión, San Antonio, Quebrada Honda, Sámara, Nosara, Belén) y tributos.',
      to: '/reportes',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      allowed: canPerformCrud(roles, 'ReportesDwh', 'CONSULTAR'),
    },
    {
      title: 'Bitácora y Auditoría Forense',
      subtitle: 'Trazabilidad e Inspección Lado a Lado (Data Diff)',
      description:
        'Filtros por fecha, tabla, acción (INSERT/UPDATE/DELETE) e IP, con comparativa de Valores Anteriores vs Nuevos.',
      to: '/auditoria',
      icon: <ShieldCheck className="h-5 w-5" />,
      allowed: canPerformCrud(roles, 'AuditoriaForense', 'CONSULTAR'),
    },
    {
      title: 'Consola Técnica DBA (SQL Server)',
      subtitle: 'Políticas de Respaldo, SHA-256 y Recuperación',
      description:
        'Estado del motor SQL, políticas FULL/DIFF/LOG, cifrado AES-256 y pruebas con RESTORE VERIFYONLY.',
      to: '/dba/politicas',
      icon: <Database className="h-5 w-5" />,
      allowed:
        canPerformCrud(roles, 'DbaPoliticas', 'CONSULTAR') ||
        canPerformCrud(roles, 'DbaRespaldos', 'CONSULTAR'),
    },
    {
      title: 'Portal Ciudadano en Línea',
      subtitle: 'Atención al Contribuyente (Oficina Virtual)',
      description:
        'Consulta de trámites en curso con barra de progreso de 4 etapas, inmuebles inscritos, estado de cuenta y requisitos.',
      to: '/portal-ciudadano',
      icon: <Globe className="h-5 w-5" />,
      allowed: canPerformCrud(roles, 'PortalCiudadano', 'CONSULTAR'),
    },
  ].filter((m) => m.allowed);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido(a), ${session?.nombreFuncionario || session?.userName}`}
        subtitle="Sistema de Gestión Municipal de Nicoya (SIGEMUN) — Módulos habilitados según su rol institucional."
        badge={roles.join(' · ') || 'Sesión Activa'}
        icon={<LayoutDashboard className="h-6 w-6" />}
        actions={
          <>
            {canPerformCrud(roles, 'PortalCiudadano', 'CONSULTAR') && (
              <Button variant="secondary" asChild>
                <Link to="/portal-ciudadano">
                  <Globe className="h-4 w-4" /> Portal Ciudadano
                </Link>
              </Button>
            )}
            {canPerformCrud(roles, 'MatrizPermisos', 'CONSULTAR') && (
              <Button asChild>
                <Link to="/seguridad/matriz-permisos">
                  <Lock className="h-4 w-4" /> Matriz de Permisos (CRUD)
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Indicadores Ejecutivos (Únicamente los autorizados para el rol actual) */}
      {(canSeeContribuyentes || canSeeInmuebles || canSeeFacturacion || canSeeTramites) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {canSeeContribuyentes && (
            <Card>
              <div className="h-1.5 w-full bg-[#1D4ED8]" />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
                  <span>Padrón Municipal</span>
                  <Users className="h-4 w-4 text-[#1D4ED8]" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-[#171717]">
                  {formatNumber(padronQuery.data?.length ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 text-xs text-[#6B7280]">
                Contribuyentes activos registrados en SQL Server
              </CardContent>
            </Card>
          )}

          {canSeeInmuebles && (
            <Card>
              <div className="h-1.5 w-full bg-[#1E3A8A]" />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
                  <span>Fincas en Catastro</span>
                  <Building2 className="h-4 w-4 text-[#1E3A8A]" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-[#171717]">
                  {formatNumber(inmueblesQuery.data?.length ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 text-xs text-[#6B7280]">
                Propiedades geolocalizadas en los 7 distritos
              </CardContent>
            </Card>
          )}

          {canSeeFacturacion && (
            <Card>
              <div className="h-1.5 w-full bg-[#DC2626]" />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
                  <span>Saldo Pendiente Cobro</span>
                  <Scale className="h-4 w-4 text-[#DC2626]" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-[#171717]">
                  {formatCurrencyCRC(totalPendienteCobro)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 text-xs text-[#6B7280]">
                Recaudado histórico: {formatCurrencyCRC(totalRecaudado)}
              </CardContent>
            </Card>
          )}

          {canSeeTramites && (
            <Card>
              <div className="h-1.5 w-full bg-[#15803D]" />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
                  <span>Catálogo de Trámites</span>
                  <ClipboardCheck className="h-4 w-4 text-[#15803D]" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-[#171717]">
                  {formatNumber(tiposTramiteQuery.data?.length ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 text-xs text-[#6B7280]">
                Procedimientos municipales con control de SLA
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tarjetas de Módulos Autorizados para el Rol Actual */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {moduleCards.map((m) => (
          <Card key={m.to} className="flex flex-col justify-between transition-all hover:border-[#1D4ED8]">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]">
                  {m.icon}
                </div>
                <Badge variant="success">Acceso Autorizado</Badge>
              </div>
              <CardTitle className="pt-2 text-base">{m.title}</CardTitle>
              <CardDescription className="text-xs font-semibold text-[#1E3A8A]">
                {m.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between space-y-4">
              <p className="text-xs leading-relaxed text-[#4B5563]">{m.description}</p>
              <div>
                <Button asChild className="w-full">
                  <Link to={m.to}>
                    Abrir módulo <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accesos Rápidos de Consola Técnica DBA si el rol tiene permiso de Respaldos DBA */}
      {canPerformCrud(roles, 'DbaRespaldos', 'CONSULTAR') && (
        <Card className="border-[#BFDBFE] bg-[#EFF6FF]/40">
          <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#1E3A8A] text-white">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#171717]">
                  Consola de Administración de Base de Datos Activa
                </h3>
                <p className="text-xs text-[#4B5563]">
                  Tiene acceso directo a Políticas de Respaldo, Simulacro de Restauración (RESTORE VERIFYONLY),
                  Data Warehouse y gobernanza de la Matriz de Permisos.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" asChild>
                <Link to="/dba/respaldos">Respaldos y DRP</Link>
              </Button>
              <Button asChild>
                <Link to="/seguridad/matriz-permisos">Gobernar Matriz RBAC</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
