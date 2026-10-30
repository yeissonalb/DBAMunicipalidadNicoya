import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/services/api';
import {
  getStoredSession,
  setStoredSession,
  type StoredSession,
} from '@/services/httpClient';
import type { LoginDto, UsuarioTokenDto } from '@/types/api';
import { hasAnyRole } from '@/features/auth/permissions';

interface AuthContextValue {
  user: UsuarioTokenDto | null;
  token: string | null;
  expiraUtc: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<UsuarioTokenDto>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasRole: (allowedRoles: readonly string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<StoredSession | null>(() => getStoredSession());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const logout = useCallback(() => {
    setStoredSession(null);
    setSessionState(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = getStoredSession();
    if (!current?.token) return;
    try {
      const me = await authApi.me();
      const updated: StoredSession = {
        ...current,
        usuario: me,
      };
      setStoredSession(updated);
      setSessionState(updated);
    } catch {
      // Si el token expiró o es inválido, el interceptor o este bloque limpiará la sesión
    }
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
    };
    window.addEventListener('sigemun:unauthorized', onUnauthorized);
    return () => window.removeEventListener('sigemun:unauthorized', onUnauthorized);
  }, [logout]);

  // Verificar expiración automática del JWT
  useEffect(() => {
    if (!session?.expiraUtc) return;
    const msRemaining = new Date(session.expiraUtc).getTime() - Date.now();
    if (msRemaining <= 0) {
      logout();
      return;
    }
    const timer = window.setTimeout(() => {
      logout();
    }, msRemaining);
    return () => window.clearTimeout(timer);
  }, [session?.expiraUtc, logout]);

  const login = useCallback(async (credentials: LoginDto): Promise<UsuarioTokenDto> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      const normalizedRoles =
        res.usuario.roles && res.usuario.roles.length > 0
          ? res.usuario.roles
          : res.usuario.rol
          ? [res.usuario.rol]
          : [];
      const newSession: StoredSession = {
        token: res.token,
        expiraUtc: res.expiraUtc,
        usuario: {
          ...res.usuario,
          roles: normalizedRoles,
        },
      };
      setStoredSession(newSession);
      setSessionState(newSession);
      return newSession.usuario;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasRole = useCallback(
    (allowedRoles: readonly string[]) => {
      if (!session?.usuario) return false;
      const roles =
        session.usuario.roles?.length > 0
          ? session.usuario.roles
          : session.usuario.rol
          ? [session.usuario.rol]
          : [];
      return hasAnyRole(roles, allowedRoles);
    },
    [session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.usuario ?? null,
      token: session?.token ?? null,
      expiraUtc: session?.expiraUtc ?? null,
      isAuthenticated: Boolean(session?.token && session?.usuario),
      isLoading,
      login,
      logout,
      refreshProfile,
      hasRole,
    }),
    [session, isLoading, login, logout, refreshProfile, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return ctx;
}

