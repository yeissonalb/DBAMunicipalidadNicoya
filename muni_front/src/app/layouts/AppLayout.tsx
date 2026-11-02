import * as React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Globe,
  Activity,
  BarChart3,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Receipt,
  Scale,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { canPerformCrud, normalizeRoleName, ROLES, type CrudModuleKey } from '@/features/auth/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    label: 'Monitoreo y Mantenimiento DBA',
    to: '/dba/monitoreo',
    icon: <Activity className="h-4 w-4" />,
    moduleKey: 'DbaRespaldos',
  },
  {
    section: 'Consola DBA y Auditoría',
    label: 'Data Warehouse (BI & ETL)',
    to: '/datawarehouse',
    icon: <BarChart3 className="h-4 w-4" />,
    moduleKey: 'ReportesDwh',
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
    section: 'Atención Interna',
    label: 'Consulta y Atención a Contribuyentes',
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
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [rbacTick, setRbacTick] = React.useState(0);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onRbacChange = () => setRbacTick((t) => t + 1);
    window.addEventListener('sigemun-rbac-updated', onRbacChange);
    return () => window.removeEventListener('sigemun-rbac-updated', onRbacChange);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userRoles = React.useMemo(() => session?.roles ?? [], [session?.roles]);

  const isCitizenOnly = React.useMemo(() => {
    const normalized = userRoles.map(normalizeRoleName);
    return (
      normalized.includes(ROLES.CIUDADANO) &&
      !normalized.includes(ROLES.ADMIN) &&
      !normalized.includes(ROLES.DBA)
    );
  }, [userRoles]);

  // Filtrar estrictamente los módulos a los que el rol actual tiene permiso de CONSULTAR
  const groupedSections = React.useMemo(() => {
    void rbacTick;
    const map = new Map<string, NavItem[]>();
    for (const item of NAV_ITEMS) {
      // Si el rol es exclusivamente Ciudadano / Contribuyente, únicamente se le permite el Portal Ciudadano
      if (isCitizenOnly) {
        if (item.to !== '/portal-ciudadano') continue;
      } else {
        if (item.to === '/') {
          const list = map.get(item.section) ?? [];
          list.push(item);
          map.set(item.section, list);
          continue;
        }
      }

      const authorized =
        !item.moduleKey || canPerformCrud(userRoles, item.moduleKey, 'CONSULTAR');
      if (!authorized) continue;

      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    }
    return Array.from(map.entries());
  }, [userRoles, rbacTick, isCitizenOnly]);

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

      {/* SIDEBAR INSTITUCIONAL FIJO AL HACER SCROLL */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#1E293B] bg-[#0F172A] text-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen',
          mobileOpen ? 'translate-x-0 w-[268px]' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'w-[268px]'
        )}
      >
        {/* Cabecera con Escudo Oficial de la Municipalidad de Nicoya */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
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

        {/* Contenedor Unificado: Navegación + Tarjeta de Usuario inmediatamente abajo (Sin espacio vacío) */}
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          <nav className="space-y-5" aria-label="Navegación principal del sistema">
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

          {/* Tarjeta de sesión activa ubicada inmediatamente al final de los links (Elimina el largo espaciado) */}
          <div className="mt-5 rounded-[10px] border border-white/10 bg-[#0B1120] p-3.5 shadow-sm">
            <div className="mb-2.5 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-xs font-bold text-white shadow-xs ring-2 ring-[#1D4ED8]/30">
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
              className="flex h-[36px] w-full items-center justify-center gap-2 rounded-[10px] border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white transition-colors hover:bg-[#DC2626] hover:border-[#DC2626]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión segura
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOPBAR INSTITUCIONAL */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 shadow-xs sm:px-8">
          <div className="flex items-center gap-3">
            {/* Botón para dispositivos móviles */}
            <Button
              variant="secondary"
              size="icon"
              className="lg:hidden"
              aria-label="Abrir menú de navegación"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Botón para Ocultar / Mostrar la Barra de Navegación (Desktop) */}
            <Button
              variant="secondary"
              size="icon"
              className="hidden lg:inline-flex"
              title={sidebarCollapsed ? 'Mostrar barra de navegación' : 'Ocultar barra de navegación'}
              aria-label={sidebarCollapsed ? 'Mostrar barra de navegación' : 'Ocultar barra de navegación'}
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>

            {/* Logo Nicoya Azul alargado y proporcionado + Título de cabecera */}
            <div className="flex items-center gap-3">
              <img
                src="/images/nicoya-azul.jpg"
                alt="Nicoya Azul"
                className="hidden h-10 w-auto max-w-[155px] rounded-[6px] object-contain sm:block"
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

          {/* Menú de Usuario Visual (Círculo de Usuario para Actualizar Credenciales / Restablecer Contraseña) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-full border border-[#D1D5DB] bg-white p-1.5 pr-3 text-left transition-all hover:border-[#1D4ED8] hover:bg-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]/30"
              title="Cuenta de Usuario · Configuración de Credenciales"
              aria-expanded={userDropdownOpen}
            >
              {/* Círculo de Usuario Oficial con indicador en vivo */}
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#1D4ED8] text-xs font-bold text-white shadow-xs">
                {(session?.nombreFuncionario || session?.userName || 'MN')
                  .slice(0, 2)
                  .toUpperCase()}
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#15803D] ring-2 ring-white"
                  title="Sesión activa"
                />
              </div>

              <div className="hidden flex-col md:flex">
                <span className="text-xs font-bold leading-tight text-[#171717]">
                  {session?.nombreFuncionario || session?.userName}
                </span>
                <span className="text-[10px] font-medium leading-tight text-[#4B5563]">
                  {userRoles[0] || 'Usuario Municipal'}
                </span>
              </div>

              <ChevronDown className="h-4 w-4 text-[#6B7280]" />
            </button>

            {/* Menú Desplegable Visual de Cuenta y Credenciales */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white py-1.5 shadow-xl z-50">
                <div className="border-b border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
                  <p className="text-xs font-bold text-[#171717]">
                    {session?.nombreFuncionario || session?.userName}
                  </p>
                  <p className="font-mono text-[11px] text-[#4B5563]">@{session?.userName}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {userRoles.map((r) => (
                      <span
                        key={r}
                        className="rounded-[4px] bg-[#EFF6FF] px-1.5 py-0.5 text-[9px] font-bold text-[#1E3A8A]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="py-1 text-xs">
                  <div className="flex items-center justify-between px-4 py-2 text-[#4B5563] hover:bg-[#F8FAFC] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#1D4ED8]" /> Mi Perfil
                    </span>
                    <Badge variant="neutral" className="text-[9px]">Ver</Badge>
                  </div>

                  <div className="flex items-center justify-between px-4 py-2 text-[#4B5563] hover:bg-[#F8FAFC] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#1E3A8A]" /> Actualizar Credenciales
                    </span>
                    <Badge variant="blue" className="text-[9px]">Próximamente</Badge>
                  </div>

                  <div className="flex items-center justify-between px-4 py-2 text-[#4B5563] hover:bg-[#F8FAFC] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#B45309]" /> Restablecer Contraseña
                    </span>
                    <Badge variant="blue" className="text-[9px]">Próximamente</Badge>
                  </div>
                </div>

                <div className="border-t border-[#E5E7EB] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2]"
                  >
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              </div>
            )}
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
