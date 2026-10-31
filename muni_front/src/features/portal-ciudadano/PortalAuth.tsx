import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  getPortalSession,
  portalAuthApi,
  setPortalSession,
  type PortalSession,
} from '@/services/portalApi';
import type { CiudadanoTokenDto, LoginCiudadanoDto } from '@/types/api';

interface PortalAuthValue {
  ciudadano: CiudadanoTokenDto | null;
  isAuthenticated: boolean;
  login: (dto: LoginCiudadanoDto) => Promise<CiudadanoTokenDto>;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthValue | undefined>(undefined);

/** Sesión del contribuyente en el portal (independiente de la sesión de funcionarios). */
export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<PortalSession | null>(() => getPortalSession());

  const logout = useCallback(() => {
    setPortalSession(null);
    setSession(null);
    queryClient.removeQueries({ queryKey: ['portal'] });
  }, [queryClient]);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('sigemun:portal-unauthorized', onUnauthorized);
    return () => window.removeEventListener('sigemun:portal-unauthorized', onUnauthorized);
  }, [logout]);

  // Cierre automático al vencer el JWT
  useEffect(() => {
    if (!session?.expiraUtc) return;
    const ms = new Date(session.expiraUtc).getTime() - Date.now();
    if (ms <= 0) {
      logout();
      return;
    }
    const t = window.setTimeout(logout, ms);
    return () => window.clearTimeout(t);
  }, [session?.expiraUtc, logout]);

  const login = useCallback(
    async (dto: LoginCiudadanoDto) => {
      const res = await portalAuthApi.login(dto);
      const nueva: PortalSession = { token: res.token, expiraUtc: res.expiraUtc, ciudadano: res.ciudadano };
      queryClient.removeQueries({ queryKey: ['portal'] });
      setPortalSession(nueva);
      setSession(nueva);
      return res.ciudadano;
    },
    [queryClient]
  );

  const value = useMemo<PortalAuthValue>(
    () => ({
      ciudadano: session?.ciudadano ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function usePortalAuth(): PortalAuthValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth debe usarse dentro de PortalAuthProvider');
  return ctx;
}

/** Envuelve las rutas del portal con su propio proveedor de sesión. */
export function PortalRoot() {
  return (
    <PortalAuthProvider>
      <Outlet />
    </PortalAuthProvider>
  );
}

export function PortalProtected({ children }: { children: ReactNode }) {
  const { isAuthenticated } = usePortalAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/portal/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
