// ============================================================================
// Contratos tipados exactos del Backend SIGEMUN (muni-back .NET 9 Web API)
// ============================================================================

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
export interface SpDepartamentoResultDto {
  idDepartamento: number;
  codigoDepartamento: string;
  nombreDepartamento: string;
  descripcion?: string | null;
  ubicacionFisica?: string | null;
  telefonoDepartamento?: string | null;
  correoDepartamento?: string | null;
  estadoDepartamento: boolean;
}

// ----------------------------------------------------------------------------
// 3. Usuarios (/api/usuario)
// ----------------------------------------------------------------------------
export interface SpConsultarUsuarioResultDto {
  idUsuario: number;
  userName: string;
  nombreUsuario: string;
  apellido1Usuario: string;
  apellido2Usuario: string;
  emailUsuario: string;
  activo: boolean;
  fechaCreacion: string;
  idDepartamento: number;
  nombreDepartamento: string;
}

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
export interface VwUsuariosRolesPermiso {
  idUsuario: number;
  userName: string;
  nombreCompleto: string;
  emailUsuario: string;
  usuarioActivo: boolean;
  nombreDepartamento: string;
  idRol: number;
  nombreRol: string;
  idPermiso: number;
  modulo: string;
  accion: string;
}

export interface SpRolResultDto {
  idRol: number;
  nombreRol: string;
}

export interface SpPermisoResultDto {
  idPermiso: number;
  modulo: string;
  accion: string;
}

export interface SpRolesPermisosUsuarioResultDto {
  idUsuario: number;
  userName: string;
  idRol: number;
  nombreRol: string;
  idPermiso?: number | null;
  modulo?: string | null;
  accion?: string | null;
}

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
export interface VwPadronContribuyente {
  idContribuyente: number;
  tipoContribuyente: string;
  identificacion?: string | null;
  nombreCompletoORazonSocial?: string | null;
  nombreFantasia?: string | null;
  correoElectronico: string;
  telefono: string;
  direccionNotificaciones: string;
  fechaRegistro: string;
  estadoContribuyente: boolean;
}

export interface SpConsultarContribuyenteResultDto {
  idContribuyente: number;
  correoElectronico: string;
  telefono: string;
  direccionNotificaciones: string;
  fechaRegistro: string;
  estadoContribuyente: boolean;
  tipoPersona: string;
  identificacion?: string | null;
  nombreORazonSocial?: string | null;
}

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
export interface VwInmueblesPropietario {
  idInmueble: number;
  numeroFinca: string;
  planoCatastrado: string;
  direccionExacta: string;
  areaTerrenoM2: number;
  areaConstruccionM2: number;
  valorFiscal: number;
  fechaRegistroInmueble: string;
  nombreDistrito: string;
  tipoUso: string;
  idContribuyente?: number | null;
  propietario?: string | null;
  porcentajeParticipacion?: number | null;
}

export interface SpConsultarInmuebleResultDto {
  idInmueble: number;
  numeroFinca: string;
  planoCatastrado: string;
  direccionExacta: string;
  areaTerrenoM2: number;
  areaConstruccionM2: number;
  valorFiscal: number;
  fechaRegistroInmueble: string;
  nombreDistrito: string;
  tipoUso: string;
}

export interface SpInmueblesPorContribuyenteResultDto {
  idInmueble: number;
  numeroFinca: string;
  planoCatastrado: string;
  direccionExacta: string;
  valorFiscal: number;
  nombreDistrito: string;
  tipoUso: string;
  porcentajeParticipacion: number;
}

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

export interface SpDistritoResultDto {
  idDistrito: number;
  codigoDistrito: string;
  nombreDistrito: string;
  areaKm2: number;
  poblacionEstimada: number;
  ubicacionCabecera: string;
}

export interface SpTipoUsoInmuebleResultDto {
  idTipoUsoInmueble: number;
  codigoTipoUso: string;
  descripcionUso: string;
  permiteActividadComercial: boolean;
}

// ----------------------------------------------------------------------------
// 7. Tipos de Trámite y Requisitos (/api/tipotramite)
// ----------------------------------------------------------------------------
export interface SpTiposTramiteResultDto {
  idTipoTramite: number;
  nombreTramite: string;
  descripcionTipo: string;
  diasResolucionMax: number;
  idDepartamento: number;
  nombreDepartamento: string;
}

export interface TipoTramiteDto {
  nombreTramite: string;
  descripcionTipo: string;
  diasResolucionMax: number;
  idDepartamento: number;
}

export interface SpRequisitoResultDto {
  idRequisito: number;
  nombreRequisito: string;
  descripcion: string;
  esObligatorio: boolean;
}

export interface SpRequisitosTramiteResultDto {
  idRequisito: number;
  nombreRequisito: string;
  descripcion: string;
  esObligatorio: boolean;
}

export interface RegistrarRequisitoDto {
  nombreRequisito: string;
  descripcion: string;
  esObligatorio: boolean;
}

// ----------------------------------------------------------------------------
// 8. Trámites y Expedientes (/api/tramite)
// ----------------------------------------------------------------------------
export interface VwTramitesSeguimiento {
  idTramite: number;
  numeroExpediente: string;
  fechaSolicitud: string;
  fechaCierre?: string | null;
  nombreTramite: string;
  diasResolucionMax: number;
  nombreDepartamento: string;
  codigoEstado?: string | null;
  nombreEstado?: string | null;
  esEstadoFinal?: boolean | null;
  idContribuyente: number;
  contribuyente?: string | null;
  funcionarioAsignado: string;
  numeroFinca?: string | null;
  diasTranscurridos?: number | null;
}

export interface VwHistorialTramitesDetallado {
  idHistorialTramite: number;
  idTramite: number;
  numeroExpediente: string;
  nombreTramite: string;
  fechaCambio: string;
  observaciones: string;
  codigoEstado: string;
  nombreEstado: string;
  esEstadoFinal: boolean;
  contribuyente?: string | null;
}

export interface SpConsultarTramiteResultDto {
  idTramite: number;
  numeroExpediente: string;
  fechaSolicitud: string;
  fechaCierre?: string | null;
  nombreTramite: string;
  diasResolucionMax: number;
  funcionarioAsignado: string;
  idContribuyente: number;
  numeroFinca?: string | null;
  ultimoEstado?: string | null;
}

export interface SpEstadosTramiteResultDto {
  idEstadoTramite: number;
  codigoEstado: string;
  nombreEstado: string;
  descripcionEstado: string;
  esEstadoFinal: boolean;
}

export interface SpHistorialTramiteResultDto {
  idHistorialTramite: number;
  fechaCambio: string;
  codigoEstado: string;
  nombreEstado: string;
  observaciones: string;
  esEstadoFinal: boolean;
}

export interface SpTramitesPorContribuyenteResultDto {
  idTramite: number;
  numeroExpediente: string;
  fechaSolicitud: string;
  fechaCierre?: string | null;
  nombreTramite: string;
  numeroFinca?: string | null;
  estadoActual?: string | null;
}

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
export interface SpTiposTributoResultDto {
  idTipoTributo: number;
  codigoTributo: string;
  nombreTributo: string;
  periodicidad: string;
  formulaCalculo: string;
  tasaBase: number;
  idDepartamento: number;
  nombreDepartamento: string;
}

export interface VwFacturasPendiente {
  idFactura: number;
  claveNumericaHacienda: string;
  fechaEmision: string;
  subtotal: number;
  descuentos: number;
  totalFactura: number;
  estadoFactura: string;
  idDeudaMunicipal: number;
  periodoDeuda: string;
  fechaDeVencimiento: string;
  diasMora?: number | null;
  nombreTributo: string;
  numeroFinca: string;
  idContribuyente: number;
  contribuyente?: string | null;
  totalAbonado: number;
  saldoPendiente: number;
}

export interface SpDeudasContribuyenteResultDto {
  idDeudaMunicipal: number;
  periodoDeuda: string;
  montoPrincipal: number;
  montoIntereses: number;
  montoMultas: number;
  montoTotal: number;
  fechaDeVencimiento: string;
  diasMora?: number | null;
  numeroFinca: string;
  nombreTributo: string;
  codigoEstadoDeuda: string;
  descripcionEstado: string;
}

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
export interface VwEstadoCuentaContribuyente {
  idContribuyente: number;
  identificacion?: string | null;
  contribuyente?: string | null;
  correoElectronico: string;
  telefono: string;
  cantidadInmuebles?: number | null;
  totalDeudasRegistradas?: number | null;
  deudasPendientesOVencidas?: number | null;
  montoTotalDeudas?: number | null;
  montoPendienteDeuda?: number | null;
  totalFacturado?: number | null;
  totalPagadoHistorico?: number | null;
}

export interface SpEstadoCuentaResultDto {
  idContribuyente: number;
  correoElectronico: string;
  telefono: string;
  idInmueble: number;
  numeroFinca: string;
  idDeudaMunicipal: number;
  periodoDeuda: string;
  nombreTributo: string;
  montoPrincipal: number;
  montoIntereses: number;
  montoMultas: number;
  totalDeuda: number;
  fechaDeVencimiento: string;
  estadoDeuda: string;
  idFactura?: number | null;
  totalFactura?: number | null;
  estadoFactura?: string | null;
  totalPagadoFactura?: number | null;
  saldoFactura?: number | null;
}

export interface SpConsultarFacturaResultDto {
  idFactura: number;
  claveNumericaHacienda: string;
  fechaEmision: string;
  subtotal: number;
  descuentos: number;
  totalFactura: number;
  estadoFactura: string;
  idDeudaMunicipal: number;
  periodoDeuda: string;
  nombreTributo: string;
  numeroFinca: string;
  totalAplicado: number;
  saldoPendiente: number;
}

export interface SpFacturasContribuyenteResultDto {
  idFactura: number;
  claveNumericaHacienda: string;
  fechaEmision: string;
  subtotal: number;
  descuentos: number;
  totalFactura: number;
  estadoFactura: string;
  periodoDeuda: string;
  nombreTributo: string;
  numeroFinca: string;
}

export interface SpMediosPagoResultDto {
  idMedioPago: number;
  codigoMedioPago: string;
  nombreMedioPago: string;
  requiereReferencia: boolean;
  comisionPorcentaje: number;
  activo: boolean;
}

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
export interface VwMorosidadContribuyente {
  idDeudaMunicipal: number;
  idContribuyente: number;
  identificacion?: string | null;
  contribuyente?: string | null;
  correoElectronico: string;
  telefono: string;
  numeroFinca: string;
  nombreDistrito: string;
  nombreTributo: string;
  periodoDeuda: string;
  montoPrincipal: number;
  montoIntereses: number;
  montoMultas: number;
  totalDeuda: number;
  fechaDeVencimiento: string;
  diasMora?: number | null;
  codigoEstadoDeuda: string;
}

export interface VwRecaudacionPorTributo {
  idTipoTributo: number;
  codigoTributo: string;
  nombreTributo: string;
  periodicidad: string;
  cantidadDeudasEmitidas?: number | null;
  cantidadFacturasEmitidas?: number | null;
  totalPrincipalRecaudado: number;
  totalInteresRecaudado: number;
  totalRecargoRecaudado: number;
  totalGeneralRecaudado: number;
}

export interface VwRecaudacionPorDistrito {
  idDistrito: number;
  codigoDistrito: string;
  nombreDistrito: string;
  cantidadInmuebles?: number | null;
  valorFiscalTotalDistrito: number;
  cantidadDeudas?: number | null;
  totalFacturadoDistrito: number;
  totalRecaudadoDistrito: number;
}

export interface SpReporteHistorialTramitesResultDto {
  idTramite: number;
  numeroExpediente: string;
  nombreTramite: string;
  fechaSolicitud: string;
  fechaCierre?: string | null;
  numeroFinca?: string | null;
  estadoActual?: string | null;
  diasEnGestion?: number | null;
}

export interface SpReporteRecaudacionTributoResultDto {
  codigoTributo: string;
  nombreTributo: string;
  pagosAplicados?: number | null;
  recaudadoPrincipal: number;
  recaudadoInteres: number;
  recaudadoRecargo: number;
  totalRecaudado: number;
}

export interface SpReporteRecaudacionDistritoResultDto {
  codigoDistrito: string;
  nombreDistrito: string;
  inmueblesConPago?: number | null;
  totalRecaudado: number;
}

export interface SpReporteContribuyentesMorososResultDto {
  idContribuyente: number;
  correoElectronico: string;
  telefono: string;
  idDeudaMunicipal: number;
  periodoDeuda: string;
  nombreTributo: string;
  numeroFinca: string;
  fechaDeVencimiento: string;
  diasMora?: number | null;
  montoPrincipal: number;
  montoIntereses: number;
  montoMultas: number;
  totalAdeudado: number;
  codigoEstadoDeuda: string;
}

export interface SpReporteSolicitudesDeptoResultDto {
  codigoDepartamento: string;
  nombreDepartamento: string;
  totalTramitesRecibidos?: number | null;
  tramitesCerrados?: number | null;
  tramitesAbiertos?: number | null;
  promedioDiasResolucion?: number | null;
}

export interface SpReporteEficienciaResultDto {
  nombreTramite: string;
  diasSlaMaximo: number;
  totalSolicitudes?: number | null;
  solicitudesResueltas?: number | null;
  promedioDiasReales?: number | null;
  resueltosFueraSla?: number | null;
}

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
export interface VwAuditoriaDetallada {
  idAuditoria: number;
  fechaEvento: string;
  tablaAfectada: string;
  idRegistroAfectado: string;
  tipoAccion: string;
  valoresAnteriores?: string | null;
  valoresNuevos?: string | null;
  direccionIp: string;
  idUsuario: number;
  userName: string;
  nombreFuncionario: string;
  nombreDepartamento: string;
}

export interface SpConsultarAuditoriaResultDto {
  idAuditoria: number;
  fechaEvento: string;
  tablaAfectada: string;
  idRegistroAfectado: string;
  tipoAccion: string;
  valoresAnteriores?: string | null;
  valoresNuevos?: string | null;
  direccionIp: string;
  userName: string;
}

export type SpFiltrarAuditoriaResultDto = SpConsultarAuditoriaResultDto;

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
export interface VwEstadoRespaldo {
  idRespaldosConfig: number;
  nombreConfiguracion: string;
  tipoRespaldo: string;
  frecuencia: string;
  horaEjecucion: string;
  retencionDias: number;
  rutaDestino: string;
  configuracionActiva: boolean;
  totalEjecuciones?: number | null;
  ultimaEjecucion?: string | null;
  ultimoTamanoMb?: number | null;
  horasDesdeUltimoRespaldo?: number | null;
}

export interface SpFrecuenciaResultDto {
  idFrecuencia: number;
  codigoFrecuencia: string;
}

export interface SpTipoRespaldoResultDto {
  idTipoDeRespaldo: number;
  codigoTipoDeRespaldo: string;
}

export interface SpConfiguracionRespaldoResultDto {
  idRespaldosConfig: number;
  nombreConfiguracion: string;
  horaEjecucion: string;
  origen: string;
  retencionDias: number;
  cifrado: string;
  rutaDestino: string;
  activo: boolean;
  idFrecuencia: number;
  codigoFrecuencia: string;
  idTipoDeRespaldo: number;
  codigoTipoDeRespaldo: string;
}

export interface SpHistorialRespaldosResultDto {
  idRespaldoHistorial: number;
  fechaInicio: string;
  fechaFin?: string | null;
  rutaArchivo: string;
  tamanoMb: number;
  hashVerificacion: string;
  nombreConfiguracion: string;
  codigoTipoDeRespaldo: string;
  estadoRespaldo: string;
  usuarioEjecutor?: string | null;
}

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

export interface SimularRestauracionDto {
  rutaBackupFull: string;
}

