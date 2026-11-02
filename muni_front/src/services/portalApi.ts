import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  API_BASE_URL,
  toApiClientError,
  unwrapFullResponse,
  unwrapResponse,
} from './httpClient';
import type {
  ActivarCuentaCiudadanaDto,
  ArchivoAdjuntadoDto,
  BaseResponse,
  CiudadanoTokenDto,
  LoginCiudadanoDto,
  LoginCiudadanoResponseDto,
  PagoSinpeDto,
  ReportarTransferenciaDto,
  SpArchivoTramiteResultDto,
  SpEstadoCuentaResultDto,
  SpFacturasContribuyenteResultDto,
  SpHistorialTramiteResultDto,
  SpInmueblesPorContribuyenteResultDto,
  SpRequisitoTramiteEstadoResultDto,
  SpTramitesPorContribuyenteResultDto,
} from '@/types/api';

// ============================================================================
// Sesión del portal ciudadano: independiente de la sesión institucional
// (otra clave de almacenamiento y otro cliente HTTP), para que un funcionario
// y un ciudadano nunca compartan token en el mismo navegador.
// ============================================================================

export const PORTAL_SESSION_KEY = 'sigemun_portal_session_v1';

export interface PortalSession {
  token: string;
  expiraUtc: string;
  ciudadano: CiudadanoTokenDto;
}

export function getPortalSession(): PortalSession | null {
  try {
    const raw = sessionStorage.getItem(PORTAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalSession;
    if (!parsed?.token) return null;
    if (parsed.expiraUtc && new Date(parsed.expiraUtc).getTime() <= Date.now()) {
      sessionStorage.removeItem(PORTAL_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setPortalSession(session: PortalSession | null) {
  try {
    if (!session) sessionStorage.removeItem(PORTAL_SESSION_KEY);
    else sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
  } catch {
    // almacenamiento no disponible: la sesión vive solo en memoria (PortalAuthProvider)
  }
}

export const portalHttp = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: { Accept: 'application/json' },
});

portalHttp.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = getPortalSession();
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

portalHttp.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BaseResponse<any>>) => {
    const url = error.config?.url ?? '';
    const esAuth = url.includes('/auth/ciudadano/');
    if (!esAuth && (error.response?.status === 401 || error.response?.status === 403)) {
      // Token vencido o de otro tipo (funcionario): cerrar la sesión del portal
      setPortalSession(null);
      window.dispatchEvent(new CustomEvent('sigemun:portal-unauthorized'));
    }
    return Promise.reject(toApiClientError(error));
  }
);

export const portalAuthApi = {
  login: (dto: LoginCiudadanoDto) =>
    unwrapResponse<LoginCiudadanoResponseDto>(portalHttp.post('/auth/ciudadano/login', dto)),
  activar: (dto: ActivarCuentaCiudadanaDto) =>
    unwrapFullResponse<number>(portalHttp.post('/auth/ciudadano/activar', dto)),
};

export const portalApi = {
  tramites: () =>
    unwrapResponse<SpTramitesPorContribuyenteResultDto[]>(portalHttp.get('/portal/tramites')),
  historial: (idTramite: number) =>
    unwrapResponse<SpHistorialTramiteResultDto[]>(portalHttp.get(`/portal/tramites/${idTramite}/historial`)),
  requisitos: (idTramite: number) =>
    unwrapResponse<SpRequisitoTramiteEstadoResultDto[]>(
      portalHttp.get(`/portal/tramites/${idTramite}/requisitos`)
    ),
  archivos: (idTramite: number) =>
    unwrapResponse<SpArchivoTramiteResultDto[]>(portalHttp.get(`/portal/tramites/${idTramite}/archivos`)),
  obtenerArchivoBlob: async (idTramite: number, idArchivo: number): Promise<Blob> => {
    const respuesta = await portalHttp.get(`/portal/tramites/${idTramite}/archivos/${idArchivo}/descargar`, { responseType: 'blob' });
    return respuesta.data;
  },
  descargarArchivoBlob: async (idTramite: number, idArchivo: number, nombreOriginal: string) => {
    const resp = await portalHttp.get(`/portal/tramites/${idTramite}/archivos/${idArchivo}/descargar`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([resp.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreOriginal);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  subirRequisito: (idTramite: number, idRequisito: number, archivo: File) => {
    const form = new FormData();
    form.append('Archivo', archivo);
    return unwrapFullResponse<ArchivoAdjuntadoDto>(
      portalHttp.post(`/portal/tramites/${idTramite}/requisitos/${idRequisito}/archivo`, form, {
        timeout: 120000,
      })
    );
  },
  inmuebles: () =>
    unwrapResponse<SpInmueblesPorContribuyenteResultDto[]>(portalHttp.get('/portal/inmuebles')),
  estadoCuenta: () =>
    unwrapResponse<SpEstadoCuentaResultDto[]>(portalHttp.get('/portal/estado-cuenta')),
  facturas: () =>
    unwrapResponse<SpFacturasContribuyenteResultDto[]>(portalHttp.get('/portal/facturas')),
  reportarTransferencia: (idFactura: number, dto: ReportarTransferenciaDto) =>
    unwrapFullResponse<number>(portalHttp.post(`/portal/facturas/${idFactura}/reportar-transferencia`, dto)),
  pagarSinpe: (idFactura: number, dto: PagoSinpeDto) =>
    unwrapFullResponse<number>(portalHttp.post(`/portal/facturas/${idFactura}/pago-sinpe`, dto)),
};
