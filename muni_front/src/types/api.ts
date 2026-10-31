// ============================================================================
// Contratos tipados exactos del Backend SIGEMUN (muni-back .NET 9 Web API)
// ============================================================================

// Recordsets exactos de la API (generados desde muni-back)
export * from './generated';

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ----------------------------------------------------------------------------
// 1. Autenticación (/api/auth)
// ----------------------------------------------------------------------------
export interface LoginDto {
  username: string;
  password: string;
}

export interface UsuarioTokenDto {
  idUsuario: number;
  userName: string;
  nombreCompleto?: string | null;
  email?: string | null;
  idDepartamento: number;
  nombreDepartamento?: string | null;
  rol: string;
  roles: string[];
}

export interface LoginResponseDto {
  token: string;
  expiraUtc: string;
  usuario: UsuarioTokenDto;
}

// ----------------------------------------------------------------------------
// 2. Catálogos Generales (/api/catalogosgenerales)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// 3. Usuarios (/api/usuario)
// ----------------------------------------------------------------------------

export interface RegistrarUsuarioDto {
  userName: string;
  password: string;
  nombreUsuario: string;
  apellido1Usuario: string;
  apellido2Usuario: string;
  emailUsuario: string;
  idDepartamento: number;
}

export interface ActualizarUsuarioDto {
  nombreUsuario: string;
  apellido1Usuario: string;
  apellido2Usuario: string;
  emailUsuario: string;
  idDepartamento: number;
}

export interface CambiarEstadoUsuarioDto {
  activo: boolean;
}

// ----------------------------------------------------------------------------
// 4. Roles y Permisos (/api/rolpermiso)
// ----------------------------------------------------------------------------




export interface RegistrarRolDto {
  nombreRol: string;
}

export interface RegistrarPermisoDto {
  modulo: string;
  accion: string;
}

export interface AsignarRolUsuarioDto {
  idUsuario: number;
  idRol: number;
}

export interface AsignarPermisoRolDto {
  idRol: number;
  idPermiso: number;
}

// ----------------------------------------------------------------------------
// 5. Contribuyentes (/api/contribuyente)
// ----------------------------------------------------------------------------


export interface RegistrarContribuyenteFisicoDto {
  cedulaIdentidad: string;
  nombre: string;
  apellido1Fisico: string;
  apellido2Fisico: string;
  fechaNacimiento: string;
  correoElectronico: string;
  telefono: string;
  direccionNotificaciones: string;
}

export interface RegistrarContribuyenteJuridicoDto {
  cedulaJuridica: string;
  razonSocial: string;
  nombreFantasia?: string | null;
  fechaConstitucion: string;
  correoElectronico: string;
  telefono: string;
  direccionNotificaciones: string;
}

export interface ActualizarContribuyenteDto {
  correoElectronico: string;
  telefono: string;
  direccionNotificaciones: string;
  estadoContribuyente: boolean;
}

export interface RegistrarRepresentanteLegalDto {
  nombreRepresentante: string;
  apellido1Representante: string;
  apellido2Representante: string;
  tomoFolioRegistro: string;
  cedulaRepresentante: string;
  fechaVencimientoPoder: string;
}

// ----------------------------------------------------------------------------
// 6. Inmuebles y Catálogos (/api/inmueble, /api/catalogosinmueble)
// ----------------------------------------------------------------------------



export interface RegistrarInmuebleDto {
  numeroFinca: string;
  direccionExacta: string;
  areaTerrenoM2: number;
  areaConstruccionM2: number;
  valorFiscal: number;
  planoCatastrado: string;
  idTipoUsoInmueble: number;
  idDistrito: number;
}

export interface ActualizarInmuebleDto {
  direccionExacta: string;
  areaTerrenoM2: number;
  areaConstruccionM2: number;
  valorFiscal: number;
  planoCatastrado: string;
  idTipoUsoInmueble: number;
}

export interface AsignarDerechoInmuebleDto {
  idContribuyente: number;
  porcentajeParticipacion: number;
}



// ----------------------------------------------------------------------------
// 7. Tipos de Trámite y Requisitos (/api/tipotramite)
// ----------------------------------------------------------------------------

export interface TipoTramiteDto {
  nombreTramite: string;
  descripcionTipo: string;
  diasResolucionMax: number;
  idDepartamento: number;
}



export interface RegistrarRequisitoDto {
  nombreRequisito: string;
  descripcion: string;
  esObligatorio: boolean;
}

// ----------------------------------------------------------------------------
// 8. Trámites y Expedientes (/api/tramite)
// ----------------------------------------------------------------------------






export interface RegistrarTramiteDto {
  numeroExpediente: string;
  idTipoTramite: number;
  idInmueble?: number | null;
  idContribuyente: number;
}

export interface ActualizarTramiteDto {
  idUsuarioAsignado?: number | null;
  idInmueble?: number | null;
}

export interface CambiarEstadoTramiteDto {
  codigoEstado: string;
  observaciones: string;
}

export interface ResolucionTramiteDto {
  codigoEstado: 'APR' | 'RECH';
  observaciones: string;
}

export interface ArchivoAdjuntadoDto {
  idTramite: number;
  idRequisito?: number | null;
  nombreOriginal: string;
  nombreAlmacenado: string;
  rutaRelativa: string;
  extension: string;
  pesoBytes: number;
}

// ----------------------------------------------------------------------------
// 9. Tributos y Deudas (/api/tributodeuda)
// ----------------------------------------------------------------------------



export interface RegistrarDeudaMunicipalDto {
  periodoDeuda: string;
  montoPrincipal: number;
  montoIntereses: number;
  montoMultas: number;
  fechaDeVencimiento: string;
  idInmueble: number;
  idTipoTributo: number;
  codigoEstadoDeuda: string;
}

export interface ActualizarEstadoDeudaDto {
  codigoEstadoDeuda: 'PEND' | 'PAG' | 'VENC' | 'ARR';
}

export interface CalcularRecargosDto {
  tasaInteresMensual?: number | null;
}

// ----------------------------------------------------------------------------
// 10. Facturación y Pagos (/api/facturacionpago)
// ----------------------------------------------------------------------------





export interface GenerarFacturaDto {
  idDeudaMunicipal: number;
  claveNumericaHacienda: string;
  descuentos: number;
}

export interface RegistrarPagoMunicipalDto {
  montoTotalPagado: number;
  comprobante: string;
  idMedioPago: number;
  idContribuyente: number;
}

export interface AplicarPagoFacturaDto {
  idFactura: number;
  montoPrincipal: number;
  montoInteres: number;
  montoRecargo: number;
}

// ----------------------------------------------------------------------------
// 11. Reportes (/api/reportes)
// ----------------------------------------------------------------------------









export type TipoReporteGestion = 'PADRON' | 'INMUEBLES' | 'MOROSOS' | 'AUDITORIA';

export interface SpReporteGestionMunicipalResultDto {
  tipoReporte: TipoReporteGestion;
  filtroTexto?: string | null;
  totalRegistros: number;
  registros: Record<string, unknown>[];
}

// ----------------------------------------------------------------------------
// 12. Auditoría (/api/auditoria)
// ----------------------------------------------------------------------------



export interface RegistrarTipoAccionAuditoriaDto {
  codigo: string;
}

export interface RegistrarAuditoriaDto {
  tablaAfectada: string;
  idRegistroAfectado: string;
  valoresAnteriores?: string | null;
  valoresNuevos?: string | null;
  codigoAccion: string;
}

// ----------------------------------------------------------------------------
// 13. Consola Técnica DBA (/api/respaldosdba)
// ----------------------------------------------------------------------------





export interface RegistrarConfiguracionRespaldoDto {
  nombreConfiguracion: string;
  horaEjecucion: string; // TimeSpan format "HH:mm:ss"
  origen: string;
  retencionDias: number;
  cifrado: string;
  rutaDestino: string;
  idFrecuencia: number;
  idTipoDeRespaldo: number;
}

export interface ActualizarConfiguracionRespaldoDto {
  nombreConfiguracion: string;
  horaEjecucion: string; // TimeSpan format "HH:mm:ss"
  retencionDias: number;
  rutaDestino: string;
  activo: boolean;
}

export interface EjecutarBackupDto {
  rutaCarpeta?: string | null;
}

/** POST /api/monitoreodba/mantenimiento */
export interface EjecutarMantenimientoDto {
  optimizarIndices: boolean;
  actualizarEstadisticas: boolean;
  purgarRespaldos: boolean;
}

// ============================================================================
// Portal ciudadano (POST /api/auth/ciudadano/*, /api/portal/*) — script 15
// ============================================================================
export interface LoginCiudadanoDto {
  identificacion: string;
  password: string;
}

export interface ActivarCuentaCiudadanaDto {
  identificacion: string;
  correoElectronico: string;
  password: string;
}

export interface CiudadanoTokenDto {
  idContribuyente: number;
  identificacion: string;
  nombreORazonSocial: string | null;
  tipoPersona: string | null;
  correoElectronico: string | null;
  telefono: string | null;
}

export interface LoginCiudadanoResponseDto {
  token: string;
  expiraUtc: string;
  ciudadano: CiudadanoTokenDto;
}

export interface PagoSinpeDto {
  comprobante: string;
  monto: number;
}

export interface SimularRestauracionDto {
  rutaBackupFull: string;
}

