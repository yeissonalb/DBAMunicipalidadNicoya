import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { BaseResponse } from '@/types/api';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5080/api';
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api$/i, '');

export const SESSION_STORAGE_KEY = 'sigemun_auth_session_v1';

export interface StoredSession {
  token: string;
  expiraUtc: string;
  usuario: {
    idUsuario: number;
    userName: string;
    nombreCompleto?: string | null;
    email?: string | null;
    idDepartamento: number;
    nombreDepartamento?: string | null;
    rol: string;
    roles: string[];
  };
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token) return null;
    if (parsed.expiraUtc && new Date(parsed.expiraUtc).getTime() <= Date.now()) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredSession(session: StoredSession | null) {
  if (!session) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly sqlErrorCode?: number;
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    sqlErrorCode?: number,
    validationErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.sqlErrorCode = sqlErrorCode;
    this.validationErrors = validationErrors;
  }
}

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    Accept: 'application/json',
  },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = getStoredSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

/**
 * Convierte un error de axios en ApiClientError con el mensaje de BaseResponse.
 * Lo comparten el cliente institucional y el del portal ciudadano.
 */
export function toApiClientError(error: AxiosError<BaseResponse<any>>): ApiClientError {
  if (!error.response) {
    return new ApiClientError(
      `No se pudo establecer conexión con el servidor backend (${API_BASE_URL}). Verifique que muni-back esté en ejecución y CORS habilitado.`,
      0
    );
  }

  const { status, data } = error.response;

  let message = data?.message || '';
  let sqlErrorCode: number | undefined;
  let validationErrors: Record<string, string[]> | undefined;

  if (data?.data && typeof data.data === 'object') {
    if ('sqlErrorCode' in data.data && typeof data.data.sqlErrorCode === 'number') {
      sqlErrorCode = data.data.sqlErrorCode;
    } else if (!Array.isArray(data.data)) {
      // ModelState dictionary: Record<string, string[]>
      const fieldMessages: string[] = [];
      const map: Record<string, string[]> = {};
      for (const [key, val] of Object.entries(data.data)) {
        if (Array.isArray(val)) {
          map[key] = val.map(String);
          fieldMessages.push(`${key}: ${val.join(', ')}`);
        }
      }
      if (fieldMessages.length > 0) {
        validationErrors = map;
        message = `${message ? message + ' ' : ''}(${fieldMessages.join(' | ')})`;
      }
    }
  }

  if (!message) {
    if (status === 401) message = 'Sesión no válida o expirada. Inicie sesión nuevamente.';
    else if (status === 403)
      message = 'Acceso denegado (403). Su rol actual no posee permisos en el backend para este recurso.';
    else if (status === 404) message = 'El recurso solicitado no fue encontrado (404).';
    else if (status === 409) message = 'Conflicto de integridad: el registro ya existe en la base de datos (409).';
    else message = `Error en la solicitud al servidor (HTTP ${status}).`;
  }

  return new ApiClientError(message, status, sqlErrorCode, validationErrors);
}

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BaseResponse<any>>) => {
    if (error.response?.status === 401) {
      // Si no es el intento de login mismo, limpiar sesión y notificar expiración
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        setStoredSession(null);
        window.dispatchEvent(new CustomEvent('sigemun:unauthorized'));
      }
    }
    return Promise.reject(toApiClientError(error));
  }
);

export async function unwrapResponse<T>(promise: Promise<{ data: BaseResponse<T> }>): Promise<T> {
  const response = await promise;
  if (response.data && response.data.success === false) {
    throw new ApiClientError(response.data.message || 'La operación no pudo completarse.', 400);
  }
  return response.data.data;
}

export async function unwrapFullResponse<T>(
  promise: Promise<{ data: BaseResponse<T> }>
): Promise<BaseResponse<T>> {
  const response = await promise;
  if (response.data && response.data.success === false) {
    throw new ApiClientError(response.data.message || 'La operación no pudo completarse.', 400);
  }
  return response.data;
}

