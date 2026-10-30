import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileCheck2,
  FilePlus2,
  FileSpreadsheet,
  FolderKanban,
  Globe,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Scale,
  ShieldCheck,
  Sliders,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { MODULE_PERMISSIONS } from '@/features/auth/permissions';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  allowedRoles: readonly string[];
  badge?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'General y Atención',
    items: [
      {
        label: 'Inicio / Panel General',
        to: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.DASHBOARD,
      },
      {
        label: 'Portal Ciudadano',
        to: '/portal-ciudadano',
        icon: <Globe className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.PORTAL_CIUDADANO,
        badge: 'WF-2',
      },
    ],
  },
  {
    groupTitle: 'Gestión Territorial y Padrón',
    items: [
      {
        label: 'Padrón de Contribuyentes',
        to: '/contribuyentes',
        icon: <Users className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.CONTRIBUYENTES,
      },
      {
        label: 'Bienes Inmuebles y Fincas',
        to: '/inmuebles',
        icon: <Building2 className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.INMUEBLES,
      },
    ],
  },
  {
    groupTitle: 'Plataforma de Trámites',
    items: [
      {
        label: 'Radicación de Trámites',
        to: '/tramites/radicar',
        icon: <FilePlus2 className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES,
      },
      {
        label: 'Revisión y Resolución',
        to: '/expedientes/revision',
        icon: <ClipboardCheck className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES,
      },
      {
        label: 'Seguimiento de Expedientes',
        to: '/expedientes/seguimiento',
        icon: <FolderKanban className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES,
      },
      {
        label: 'Catálogo y Requisitos',
        to: '/tramites/catalogo',
        icon: <FileCheck2 className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES,
      },
    ],
  },
  {
    groupTitle: 'Hacienda y Recaudación',
    items: [
      {
        label: 'Pagos y Facturación',
        to: '/pagos',
        icon: <Receipt className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.TRIBUTOS_PAGOS,
      },
      {
        label: 'Tributos y Deudas',
        to: '/tributos',
        icon: <Scale className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.TRIBUTOS_PAGOS,
      },
    ],
  },
  {
    groupTitle: 'Control, Auditoría y BI',
    items: [
      {
        label: 'Análisis Tributario y Reportes',
        to: '/reportes',
        icon: <FileSpreadsheet className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.REPORTES,
      },
      {
        label: 'Auditoría Forense (Audit Log)',
        to: '/auditoria',
        icon: <ShieldCheck className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.AUDITORIA,
      },
    ],
  },
  {
    groupTitle: 'Seguridad RBAC (Admin)',
    items: [
      {
        label: 'Usuarios y Roles',
        to: '/seguridad/usuarios',
        icon: <UserCheck className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.USUARIOS_ROLES,
      },
      {
        label: 'Centro de Seguridad y Matriz',
        to: '/seguridad/matriz',
        icon: <Sliders className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.USUARIOS_ROLES,
      },
    ],
  },
  {
    groupTitle: 'Consola Técnica DBA',
    items: [
      {
        label: 'Políticas de Respaldo',
        to: '/dba/politicas',
        icon: <Database className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.DBA_CONSOLA,
      },
      {
        label: 'Respaldos y Recuperación',
        to: '/dba/respaldos',
        icon: <Landmark className="h-4 w-4" />,
        allowedRoles: MODULE_PERMISSIONS.DBA_CONSOLA,
      },
    ],
  },
];

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Panel General Institucional',
  '/portal-ciudadano': 'Portal Ciudadano en Línea',
  '/contribuyentes': 'Padrón de Contribuyentes',
  '/inmuebles': 'Padrón de Bienes Inmuebles y Derechos',
  '/tramites/radicar': 'Radicación de Trámites Municipales',
  '/expedientes/revision': 'Revisión y Resolución de Expedientes',
  '/expedientes/seguimiento': 'Seguimiento y Trazabilidad de Expedientes',
  '/tramites/catalogo': 'Catálogo de Tipos de Trámite y Requisitos',
  '/pagos': 'Pagos Municipales y Facturación Electrónica',
  '/tributos': 'Gestión de Tributos, Deudas y Estado de Cuenta',
  '/reportes': 'Análisis Tributario y Reportes de Gestión',
  '/auditoria': 'Bitácora y Auditoría Forense del Sistema',
  '/seguridad/usuarios': 'Administración de Usuarios y Roles (RBAC)',
  '/seguridad/matriz': 'Centro de Seguridad y Matriz de Permisos',
  '/dba/politicas': 'Consola Técnica DBA — Políticas de Respaldo',
  '/dba/respaldos': 'Consola Técnica DBA — Respaldos y Recuperación',
};

export function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasRole(item.allowedRoles)),
  })).filter((group) => group.items.length > 0);

  const currentPageTitle = ROUTE_TITLES[location.pathname] || 'SIGEMUN — Municipalidad de Nicoya';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7F4] text-[#26352D]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Institutional Dark Green Sidebar (#164B35) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#164B35] text-white shadow-xl transition-all duration-200 lg:static',
          collapsed ? 'w-20' : 'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B6944A] text-[#164B35] font-extrabold shadow-xs">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-wider text-white">SIGEMUN</span>
                  <span className="rounded bg-[#B6944A]/25 px-1.5 py-0.5 text-[10px] font-semibold text-[#D4B872]">
                    NICOYA
                  </span>
                </div>
                <p className="truncate text-[11px] text-white/70">Municipalidad de Nicoya</p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex"
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {visibleGroups.map((group) => (
            <div key={group.groupTitle}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[#D4B872]">
                  {group.groupTitle}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all',
                        isActive
                          ? 'bg-[#B6944A] text-white font-semibold shadow-xs'
                          : 'text-white/80 hover:bg-white/10 hover:text-white',
                        collapsed && 'justify-center px-2'
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom User Profile & Logout */}
        <div className="border-t border-white/10 p-3">
          {!collapsed && user && (
            <div className="mb-2 rounded-lg bg-white/5 p-2.5">
              <p className="truncate text-xs font-semibold text-white">
                {user.nombreCompleto || user.userName}
              </p>
              <p className="truncate text-[11px] text-[#D4B872]">{user.rol}</p>
              {user.nombreDepartamento && (
                <p className="mt-0.5 truncate text-[10px] text-white/60">
                  {user.nombreDepartamento}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/20 hover:text-white',
              collapsed && 'justify-center'
            )}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Institutional Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#DCE3DE] bg-white px-4 shadow-2xs sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-[#26352D] hover:bg-[#E8F0EC] lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-[#5A6B61]">
                <span>SIGEMUN</span>
                <span>/</span>
                <span className="truncate font-medium text-[#164B35]">{currentPageTitle}</span>
              </div>
              <h2 className="truncate text-sm font-bold text-[#26352D] sm:text-base">
                {currentPageTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="text-right">
                  <p className="text-xs font-bold text-[#26352D]">
                    {user.nombreCompleto || user.userName}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    <Badge variant="gold" className="text-[10px] py-0 px-2">
                      {user.rol}
                    </Badge>
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#164B35] text-xs font-bold text-[#B6944A]">
                  {(user.nombreCompleto || user.userName).slice(0, 2).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Institutional Footer */}
        <footer className="border-t border-[#DCE3DE] bg-white px-6 py-3 text-xs text-[#5A6B61]">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 sm:flex-row">
            <p>
              <strong>SIGEMUN</strong> — Sistema de Gestión Municipal · Municipalidad de Nicoya,
              Guanacaste, Costa Rica
            </p>
            <p className="text-[11px]">
              Hito 3 · Administración de Bases de Datos · Universidad Nacional (Campus Nicoya)
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

