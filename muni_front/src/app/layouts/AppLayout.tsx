import * as React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Globe,
  HardDrive,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Receipt,
  Scale,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { canPerformCrud, type CrudModuleKey } from '@/features/auth/permissions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  moduleKey?: CrudModuleKey;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    section: 'Resumen Institucional',
    label: 'Panel Principal',
    to: '/',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    section: 'Catastro y Ciudadanos',
    label: 'Padrón de Contribuyentes',
    to: '/contribuyentes',
    icon: <Users className="h-4 w-4" />,
    moduleKey: 'Contribuyentes',
  },
  {
    section: 'Catastro y Ciudadanos',
    label: 'Bienes Inmuebles',
    to: '/inmuebles',
    icon: <Building2 className="h-4 w-4" />,
    moduleKey: 'Inmuebles',
  },
  {
    section: 'Gestión de Trámites',
    label: 'Radicación de Expediente',
    to: '/tramites/radicacion',
    icon: <FileText className="h-4 w-4" />,
    moduleKey: 'TramitesRadicacion',
  },
  {
    section: 'Gestión de Trámites',
    label: 'Revisión y Cotejo',
    to: '/tramites/revision',
    icon: <ClipboardCheck className="h-4 w-4" />,
    moduleKey: 'ExpedientesRevision',
  },
  {
    section: 'Gestión de Trámites',
    label: 'Seguimiento y Trazabilidad',
    to: '/tramites/seguimiento',
    icon: <FolderKanban className="h-4 w-4" />,
    moduleKey: 'ExpedientesSeguimiento',
  },
  {
    section: 'Gestión de Trámites',
    label: 'Catálogo de Trámites y SLA',
    to: '/tramites/catalogo',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    moduleKey: 'CatalogoTramites',
  },
  {
    section: 'Hacienda y Recaudación',
    label: 'Estado de Cuenta y Cobro',
    to: '/tributos-deudas',
    icon: <Scale className="h-4 w-4" />,
    moduleKey: 'TributosDeudas',
  },
  {
    section: 'Hacienda y Recaudación',
    label: 'Caja y Facturación',
    to: '/pagos-municipales',
    icon: <Receipt className="h-4 w-4" />,
    moduleKey: 'FacturacionPagos',
  },
  {
    section: 'Gobernanza y Seguridad (RBAC)',
    label: 'Usuarios y Roles',
    to: '/seguridad/usuarios',
    icon: <Users className="h-4 w-4" />,
    moduleKey: 'UsuariosRoles',
  },
  {
    section: 'Gobernanza y Seguridad (RBAC)',
    label: 'Matriz de Permisos (RBAC)',
    to: '/seguridad/matriz-permisos',
    icon: <Lock className="h-4 w-4" />,
    moduleKey: 'MatrizPermisos',
  },
  {
    section: 'Consola DBA y Auditoría',
    label: 'Data Warehouse y Analítica',
    to: '/reportes',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    moduleKey: 'ReportesDwh',
  },
  {
    section: 'Consola DBA y Auditoría',
    label: 'Auditoría Forense',
    to: '/auditoria',
    icon: <ShieldCheck className="h-4 w-4" />,
    moduleKey: 'AuditoriaForense',
  },
  {
    section: 'Consola DBA y Auditoría',
    label: 'Políticas de Respaldo SQL',
    to: '/dba/politicas',
    icon: <Database className="h-4 w-4" />,
    moduleKey: 'DbaPoliticas',
  },
  {
    section: 'Consola DBA y Auditoría',
    label: 'Respaldos y Recuperación',
    to: '/dba/respaldos',
    icon: <HardDrive className="h-4 w-4" />,
    moduleKey: 'DbaRespaldos',
  },
  {
    section: 'Atención Ciudadana',
    label: 'Portal Ciudadano en Línea',
    to: '/portal-ciudadano',
    icon: <Globe className="h-4 w-4" />,
    moduleKey: 'PortalCiudadano',
  },
];

export function AppLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [rbacTick, setRbacTick] = React.useState(0);

  React.useEffect(() => {
    const onRbacChange = () => setRbacTick((t) => t + 1);
    window.addEventListener('sigemun-rbac-updated', onRbacChange);
    return () => window.removeEventListener('sigemun-rbac-updated', onRbacChange);
  }, []);

  const userRoles = React.useMemo(() => session?.roles ?? [], [session?.roles]);

  // Filtrar estrictamente los módulos a los que el rol actual tiene permiso de CONSULTAR
  const groupedSections = React.useMemo(() => {
    void rbacTick;
    const map = new Map<string, NavItem[]>();
    for (const item of NAV_ITEMS) {
      const authorized =
        !item.moduleKey || canPerformCrud(userRoles, item.moduleKey, 'CONSULTAR');
      if (!authorized) continue;

      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    }
    return Array.from(map.entries());
  }, [userRoles, rbacTick]);

  const currentNav = NAV_ITEMS.find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#171717]">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F172A]/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR INSTITUCIONAL ESTANDARIZADO */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-[#1E293B] bg-[#0F172A] text-white transition-transform duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Cabecera con Escudo Oficial de la Municipalidad de Nicoya */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/escudo-nicoya.jpg"
              alt="Escudo Oficial Municipalidad de Nicoya"
              className="h-11 w-11 rounded-[10px] border border-white/20 bg-white object-contain p-0.5 shadow-xs"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#93C5FD]">
                Gobierno Local
              </p>
              <p className="truncate text-sm font-bold leading-tight text-white">
                Municipalidad de Nicoya
              </p>
              <p className="truncate text-[11px] text-slate-400">SIGEMUN · Guanacaste</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú lateral"
            className="rounded-[10px] p-1 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegación por Módulos (Solo visibles los permitidos para el rol) */}
        <nav
          className="flex-1 space-y-5 overflow-y-auto px-3 py-4"
          aria-label="Navegación principal del sistema"
        >
          {groupedSections.map(([sectionTitle, items]) => (
            <div key={sectionTitle}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {sectionTitle}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-[#1D4ED8] font-semibold text-white shadow-xs'
                          : 'text-slate-300 hover:bg-white/8 hover:text-white'
                      )
                    }
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Tarjeta inferior de sesión activa */}
        <div className="border-t border-white/10 bg-[#0B1120] p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1E3A8A] text-xs font-bold text-white">
              {(session?.nombreFuncionario || session?.userName || 'MN')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">
                {session?.nombreFuncionario || session?.userName}
              </p>
              <p className="truncate font-mono text-[11px] text-slate-400">
                @{session?.userName} · ID #{session?.idUsuario}
              </p>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1">
            {userRoles.map((r) => (
              <span
                key={r}
                className="rounded-[6px] border border-[#1D4ED8]/40 bg-[#1E3A8A]/50 px-2 py-0.5 text-[10px] font-semibold text-[#BFDBFE]"
              >
                {r}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex h-[38px] w-full items-center justify-center gap-2 rounded-[10px] border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white transition-colors hover:bg-[#DC2626] hover:border-[#DC2626]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión segura
          </button>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOPBAR INSTITUCIONAL */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 shadow-xs sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              className="lg:hidden"
              aria-label="Abrir menú de navegación"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <img
                src="/images/nicoya-azul.jpg"
                alt="Nicoya Azul"
                className="hidden h-9 w-9 rounded-[8px] object-cover sm:block"
              />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1D4ED8]">
                  Sistema de Gestión Municipal · Nicoya
                </p>
                <p className="text-sm font-bold text-[#171717]">
                  {currentNav?.label ?? 'Plataforma Institucional SIGEMUN'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="success" className="hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
              SQL Server Conectado
            </Badge>
            <div className="hidden items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-xs md:flex">
              <span className="font-semibold text-[#171717]">
                {session?.nombreFuncionario || session?.userName}
              </span>
              <span className="text-[#9CA3AF]">|</span>
              <span className="font-medium text-[#1E3A8A]">
                {userRoles[0] || 'Usuario Municipal'}
              </span>
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>

        {/* PIE DE PÁGINA INSTITUCIONAL */}
        <footer className="border-t border-[#E5E7EB] bg-white px-6 py-4 text-xs text-[#6B7280]">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <img
                src="/images/escudo-nicoya.jpg"
                alt="Escudo de Nicoya"
                className="h-5 w-5 object-contain"
              />
              <span className="font-semibold text-[#171717]">Municipalidad de Nicoya</span>
              <span>— De la Patria por Nuestra Voluntad (1848)</span>
            </div>
            <span>SIGEMUN 2026 · Estándar Institucional Unificado</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
