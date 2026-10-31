import { httpClient, unwrapFullResponse, unwrapResponse } from './httpClient';
import type {
  ActualizarConfiguracionRespaldoDto,
  ActualizarContribuyenteDto,
  ActualizarEstadoDeudaDto,
  ActualizarInmuebleDto,
  ActualizarTramiteDto,
  ActualizarUsuarioDto,
  AplicarPagoFacturaDto,
  ArchivoAdjuntadoDto,
  AsignarDerechoInmuebleDto,
  AsignarPermisoRolDto,
  AsignarRolUsuarioDto,
  CalcularRecargosDto,
  CambiarEstadoTramiteDto,
  CambiarEstadoUsuarioDto,
  EjecutarBackupDto,
  GenerarFacturaDto,
  LoginDto,
  LoginResponseDto,
  RegistrarAuditoriaDto,
  RegistrarConfiguracionRespaldoDto,
  RegistrarContribuyenteFisicoDto,
  RegistrarContribuyenteJuridicoDto,
  RegistrarDeudaMunicipalDto,
  RegistrarInmuebleDto,
  RegistrarPagoMunicipalDto,
  RegistrarPermisoDto,
  RegistrarRepresentanteLegalDto,
  RegistrarRequisitoDto,
  RegistrarRolDto,
  RegistrarTipoAccionAuditoriaDto,
  RegistrarTramiteDto,
  RegistrarUsuarioDto,
  ResolucionTramiteDto,
  SimularRestauracionDto,
  EjecutarMantenimientoDto,
  SpArchivoTramiteResultDto,
  SpAsignacionRolResultDto,
  SpDbaFragmentacionResultDto,
  SpDbaHistorialMantenimientoResultDto,
  SpDbaMantenimientoResultDto,
  SpDbaMonitorArchivoResultDto,
  SpDbaMonitorResumenResultDto,
  SpDbaMonitorSesionResultDto,
  SpDwEficienciaTramitesResultDto,
  SpDwEstadoResultDto,
  SpDwHistorialCargaResultDto,
  SpDwIndicadoresDepartamentoResultDto,
  SpDwMorosidadResultDto,
  SpDwRecaudacionPeriodoResultDto,
  SpDwRecaudacionTributoResultDto,
  SpDwRecaudacionUbicacionResultDto,
  SpDwValidacionEtlResultDto,
  SpPermisoRolResultDto,
  SpRequisitoTramiteEstadoResultDto,
  SpConfiguracionRespaldoResultDto,
  SpConsultarAuditoriaResultDto,
  SpConsultarContribuyenteResultDto,
  SpConsultarFacturaResultDto,
  SpConsultarInmuebleResultDto,
  SpConsultarTramiteResultDto,
  SpConsultarUsuarioResultDto,
  SpDepartamentoResultDto,
  SpDeudasContribuyenteResultDto,
  SpDistritoResultDto,
  SpEstadoCuentaResultDto,
  SpEstadosTramiteResultDto,
  SpFacturasContribuyenteResultDto,
  SpFiltrarAuditoriaResultDto,
  SpFrecuenciaResultDto,
  SpHistorialRespaldosResultDto,
  SpHistorialTramiteResultDto,
  SpInmueblesPorContribuyenteResultDto,
  SpMediosPagoResultDto,
  SpPermisoResultDto,
  SpReporteContribuyentesMorososResultDto,
  SpReporteEficienciaResultDto,
  SpReporteGestionMunicipalResultDto,
  SpReporteHistorialTramitesResultDto,
  SpReporteRecaudacionDistritoResultDto,
  SpReporteRecaudacionTributoResultDto,
  SpReporteSolicitudesDeptoResultDto,
  SpRequisitoResultDto,
  SpRequisitosTramiteResultDto,
  SpRolesPermisosUsuarioResultDto,
  SpRolResultDto,
  SpTipoRespaldoResultDto,
  SpTiposTramiteResultDto,
  SpTiposTributoResultDto,
  SpTipoUsoInmuebleResultDto,
  SpTramitesPorContribuyenteResultDto,
  TipoReporteGestion,
  TipoTramiteDto,
  UsuarioTokenDto,
  VwAuditoriaDetallada,
  VwEstadoCuentaContribuyente,
  VwEstadoRespaldo,
  VwFacturasPendiente,
  VwHistorialTramitesDetallado,
  VwInmueblesPropietario,
  VwMorosidadContribuyente,
  VwPadronContribuyente,
  VwRecaudacionPorDistrito,
  VwRecaudacionPorTributo,
  VwTramitesSeguimiento,
  VwUsuariosRolesPermiso,
} from '@/types/api';

// ============================================================================
// 1. AuthController (/api/auth)
// ============================================================================
export const authApi = {
  login: (dto: LoginDto) => unwrapResponse<LoginResponseDto>(httpClient.post('/auth/login', dto)),
  me: () => unwrapResponse<UsuarioTokenDto>(httpClient.get('/auth/me')),
};

// ============================================================================
// 2. CatalogosGeneralesController (/api/catalogosgenerales)
// ============================================================================
export const catalogosGeneralesApi = {
  departamentos: () =>
    unwrapResponse<SpDepartamentoResultDto[]>(httpClient.get('/catalogosgenerales/departamentos')),
};

// ============================================================================
// 3. UsuarioController (/api/usuario)
// ============================================================================
export const usuarioApi = {
  consultar: (userName?: string) =>
    unwrapResponse<SpConsultarUsuarioResultDto[]>(
      httpClient.get('/usuario', { params: userName ? { userName } : undefined })
    ),
  registrar: (dto: RegistrarUsuarioDto) =>
    unwrapFullResponse<number>(httpClient.post('/usuario', dto)),
  actualizar: (idUsuario: number, dto: ActualizarUsuarioDto) =>
    unwrapFullResponse<unknown>(httpClient.put(`/usuario/${idUsuario}`, dto)),
  cambiarEstado: (idUsuario: number, dto: CambiarEstadoUsuarioDto) =>
    unwrapFullResponse<unknown>(httpClient.patch(`/usuario/${idUsuario}/estado`, dto)),
};

// ============================================================================
// 4. RolPermisoController (/api/rolpermiso)
// ============================================================================
export const rolPermisoApi = {
  matriz: () => unwrapResponse<VwUsuariosRolesPermiso[]>(httpClient.get('/rolpermiso/matriz')),
  listarRoles: () => unwrapResponse<SpRolResultDto[]>(httpClient.get('/rolpermiso/roles')),
  listarPermisos: () =>
    unwrapResponse<SpPermisoResultDto[]>(httpClient.get('/rolpermiso/permisos')),
  registrarRol: (dto: RegistrarRolDto) =>
    unwrapFullResponse<number>(httpClient.post('/rolpermiso/rol', dto)),
  registrarPermiso: (dto: RegistrarPermisoDto) =>
    unwrapFullResponse<number>(httpClient.post('/rolpermiso/permiso', dto)),
  asignarRol: (dto: AsignarRolUsuarioDto) =>
    unwrapFullResponse<unknown>(httpClient.post('/rolpermiso/asignar-rol', dto)),
  asignarPermiso: (dto: AsignarPermisoRolDto) =>
    unwrapFullResponse<unknown>(httpClient.post('/rolpermiso/asignar-permiso', dto)),
  rolesPermisosUsuario: (idUsuario: number) =>
    unwrapResponse<SpRolesPermisosUsuarioResultDto[]>(
      httpClient.get(`/rolpermiso/usuario/${idUsuario}`)
    ),
  // Script 15
  permisosPorRol: (idRol: number) =>
    unwrapResponse<SpPermisoRolResultDto[]>(httpClient.get(`/rolpermiso/rol/${idRol}/permisos`)),
  asignaciones: () =>
    unwrapResponse<SpAsignacionRolResultDto[]>(httpClient.get('/rolpermiso/asignaciones')),
  revocarRol: (idUsuario: number, idRol: number) =>
    unwrapFullResponse<unknown>(httpClient.delete(`/rolpermiso/usuario/${idUsuario}/rol/${idRol}`)),
  revocarPermiso: (idRol: number, idPermiso: number) =>
    unwrapFullResponse<unknown>(httpClient.delete(`/rolpermiso/rol/${idRol}/permiso/${idPermiso}`)),
};

// ============================================================================
// 5. ContribuyenteController (/api/contribuyente)
// ============================================================================
export const contribuyenteApi = {
  padron: () => unwrapResponse<VwPadronContribuyente[]>(httpClient.get('/contribuyente')),
  buscar: (criterio?: string) =>
    unwrapResponse<SpConsultarContribuyenteResultDto[]>(
      httpClient.get('/contribuyente/buscar', { params: criterio ? { criterio } : undefined })
    ),
  registrarFisico: (dto: RegistrarContribuyenteFisicoDto) =>
    unwrapFullResponse<number>(httpClient.post('/contribuyente/fisico', dto)),
  registrarJuridico: (dto: RegistrarContribuyenteJuridicoDto) =>
    unwrapFullResponse<number>(httpClient.post('/contribuyente/juridico', dto)),
  actualizar: (idContribuyente: number, dto: ActualizarContribuyenteDto) =>
    unwrapFullResponse<unknown>(httpClient.put(`/contribuyente/${idContribuyente}`, dto)),
  registrarRepresentanteLegal: (idContribuyente: number, dto: RegistrarRepresentanteLegalDto) =>
    unwrapFullResponse<unknown>(
      httpClient.post(`/contribuyente/${idContribuyente}/representante-legal`, dto)
    ),
};

// ============================================================================
// 6. InmuebleController (/api/inmueble) y CatalogosInmuebleController
// ============================================================================
export const inmuebleApi = {
  listarConPropietarios: () =>
    unwrapResponse<VwInmueblesPropietario[]>(httpClient.get('/inmueble')),
  buscar: (numeroFinca?: string, idDistrito?: number) =>
    unwrapResponse<SpConsultarInmuebleResultDto[]>(
      httpClient.get('/inmueble/buscar', {
        params: {
          ...(numeroFinca ? { numeroFinca } : {}),
          ...(idDistrito ? { idDistrito } : {}),
        },
      })
    ),
  registrar: (dto: RegistrarInmuebleDto) =>
    unwrapFullResponse<number>(httpClient.post('/inmueble', dto)),
  actualizar: (idInmueble: number, dto: ActualizarInmuebleDto) =>
    unwrapFullResponse<unknown>(httpClient.put(`/inmueble/${idInmueble}`, dto)),
  asignarDerecho: (idInmueble: number, dto: AsignarDerechoInmuebleDto) =>
    unwrapFullResponse<unknown>(httpClient.post(`/inmueble/${idInmueble}/derechos`, dto)),
  porContribuyente: (idContribuyente: number) =>
    unwrapResponse<SpInmueblesPorContribuyenteResultDto[]>(
      httpClient.get(`/inmueble/contribuyente/${idContribuyente}`)
    ),
};

export const catalogosInmuebleApi = {
  distritos: () =>
    unwrapResponse<SpDistritoResultDto[]>(httpClient.get('/catalogosinmueble/distritos')),
  tiposUso: () =>
    unwrapResponse<SpTipoUsoInmuebleResultDto[]>(httpClient.get('/catalogosinmueble/tipos-uso')),
};

// ============================================================================
// 7. TipoTramiteController (/api/tipotramite)
// ============================================================================
export const tipoTramiteApi = {
  consultar: () => unwrapResponse<SpTiposTramiteResultDto[]>(httpClient.get('/tipotramite')),
  registrar: (dto: TipoTramiteDto) =>
    unwrapFullResponse<number>(httpClient.post('/tipotramite', dto)),
  actualizar: (idTipoTramite: number, dto: TipoTramiteDto) =>
    unwrapFullResponse<unknown>(httpClient.put(`/tipotramite/${idTipoTramite}`, dto)),
  catalogoRequisitos: () =>
    unwrapResponse<SpRequisitoResultDto[]>(httpClient.get('/tipotramite/requisitos')),
  registrarRequisito: (dto: RegistrarRequisitoDto) =>
    unwrapFullResponse<number>(httpClient.post('/tipotramite/requisito', dto)),
  configurarRequisito: (idTipoTramite: number, idRequisito: number) =>
    unwrapFullResponse<unknown>(
      httpClient.post(`/tipotramite/${idTipoTramite}/requisitos/${idRequisito}`)
    ),
  requisitosPorTipo: (idTipoTramite: number) =>
    unwrapResponse<SpRequisitosTramiteResultDto[]>(
      httpClient.get(`/tipotramite/${idTipoTramite}/requisitos`)
    ),
};

// ============================================================================
// 8. TramiteController (/api/tramite)
// ============================================================================
export const tramiteApi = {
  seguimiento: () => unwrapResponse<VwTramitesSeguimiento[]>(httpClient.get('/tramite')),
  historialDetallado: () =>
    unwrapResponse<VwHistorialTramitesDetallado[]>(httpClient.get('/tramite/historial-detallado')),
  buscar: (numeroExpediente?: string, idContribuyente?: number) =>
    unwrapResponse<SpConsultarTramiteResultDto[]>(
      httpClient.get('/tramite/buscar', {
        params: {
          ...(numeroExpediente ? { numeroExpediente } : {}),
          ...(idContribuyente ? { idContribuyente } : {}),
        },
      })
    ),
  registrar: (dto: RegistrarTramiteDto) =>
    unwrapFullResponse<number>(httpClient.post('/tramite', dto)),
  actualizar: (idTramite: number, dto: ActualizarTramiteDto) =>
    unwrapFullResponse<unknown>(httpClient.put(`/tramite/${idTramite}`, dto)),
  adjuntarArchivo: (idTramite: number, archivo: File, idRequisito?: number | null) => {
    const formData = new FormData();
    formData.append('IdTramite', String(idTramite));
    if (idRequisito) formData.append('IdRequisito', String(idRequisito));
    formData.append('Archivo', archivo);
    return unwrapFullResponse<ArchivoAdjuntadoDto>(
      httpClient.post('/tramite/adjuntar-archivo', formData)
    );
  },
  requisitoPresentado: (idTramite: number, idRequisito: number, archivo: File) => {
    const formData = new FormData();
    formData.append('IdTramite', String(idTramite));
    formData.append('IdRequisito', String(idRequisito));
    formData.append('Archivo', archivo);
    return unwrapFullResponse<ArchivoAdjuntadoDto>(
      httpClient.post('/tramite/requisito-presentado', formData)
    );
  },
  cambiarEstado: (idTramite: number, dto: CambiarEstadoTramiteDto) =>
    unwrapFullResponse<unknown>(httpClient.post(`/tramite/${idTramite}/estado`, dto)),
  estados: () => unwrapResponse<SpEstadosTramiteResultDto[]>(httpClient.get('/tramite/estados')),
  historial: (idTramite: number) =>
    unwrapResponse<SpHistorialTramiteResultDto[]>(httpClient.get(`/tramite/${idTramite}/historial`)),
  resolucion: (idTramite: number, dto: ResolucionTramiteDto) =>
    unwrapFullResponse<unknown>(httpClient.post(`/tramite/${idTramite}/resolucion`, dto)),
  porContribuyente: (idContribuyente: number) =>
    unwrapResponse<SpTramitesPorContribuyenteResultDto[]>(
      httpClient.get(`/tramite/contribuyente/${idContribuyente}`)
    ),
  // Script 15
  archivos: (idTramite: number) =>
    unwrapResponse<SpArchivoTramiteResultDto[]>(httpClient.get(`/tramite/${idTramite}/archivos`)),
  requisitosEstado: (idTramite: number) =>
    unwrapResponse<SpRequisitoTramiteEstadoResultDto[]>(
      httpClient.get(`/tramite/${idTramite}/requisitos-estado`)
    ),
};

// ============================================================================
// 9. TributoDeudaController (/api/tributodeuda)
// ============================================================================
export const tributoDeudaApi = {
  tiposTributo: () =>
    unwrapResponse<SpTiposTributoResultDto[]>(httpClient.get('/tributodeuda/tipos-tributo')),
  facturasPendientes: () =>
    unwrapResponse<VwFacturasPendiente[]>(httpClient.get('/tributodeuda/facturas-pendientes')),
  registrarDeuda: (dto: RegistrarDeudaMunicipalDto) =>
    unwrapFullResponse<number>(httpClient.post('/tributodeuda/deuda', dto)),
  deudasContribuyente: (idContribuyente: number) =>
    unwrapResponse<SpDeudasContribuyenteResultDto[]>(
      httpClient.get(`/tributodeuda/contribuyente/${idContribuyente}/deudas`)
    ),
  actualizarEstadoDeuda: (idDeudaMunicipal: number, dto: ActualizarEstadoDeudaDto) =>
    unwrapFullResponse<unknown>(
      httpClient.patch(`/tributodeuda/deuda/${idDeudaMunicipal}/estado`, dto)
    ),
  recalcularIntereses: (idDeudaMunicipal: number, dto?: CalcularRecargosDto) =>
    unwrapFullResponse<unknown>(
      httpClient.post(`/tributodeuda/deuda/${idDeudaMunicipal}/recalcular`, dto ?? {})
    ),
};

// ============================================================================
// 10. FacturacionPagoController (/api/facturacionpago)
// ============================================================================
export const facturacionPagoApi = {
  estadoCuentaGeneral: () =>
    unwrapResponse<VwEstadoCuentaContribuyente[]>(httpClient.get('/facturacionpago/estado-cuenta')),
  estadoCuentaContribuyente: (idContribuyente: number) =>
    unwrapResponse<SpEstadoCuentaResultDto[]>(
      httpClient.get(`/facturacionpago/contribuyente/${idContribuyente}/estado-cuenta`)
    ),
  generarFactura: (dto: GenerarFacturaDto) =>
    unwrapFullResponse<number>(httpClient.post('/facturacionpago/factura', dto)),
  consultarFactura: (claveNumericaHacienda?: string, idFactura?: number) =>
    unwrapResponse<SpConsultarFacturaResultDto[]>(
      httpClient.get('/facturacionpago/factura', {
        params: {
          ...(claveNumericaHacienda ? { claveNumericaHacienda } : {}),
          ...(idFactura ? { idFactura } : {}),
        },
      })
    ),
  facturasContribuyente: (idContribuyente: number) =>
    unwrapResponse<SpFacturasContribuyenteResultDto[]>(
      httpClient.get(`/facturacionpago/contribuyente/${idContribuyente}/facturas`)
    ),
  mediosPago: () =>
    unwrapResponse<SpMediosPagoResultDto[]>(httpClient.get('/facturacionpago/medios-pago')),
  registrarPago: (dto: RegistrarPagoMunicipalDto) =>
    unwrapFullResponse<number>(httpClient.post('/facturacionpago/pago', dto)),
  aplicarPago: (idPagoMunicipal: number, dto: AplicarPagoFacturaDto) =>
    unwrapFullResponse<unknown>(
      httpClient.post(`/facturacionpago/pago/${idPagoMunicipal}/aplicar`, dto)
    ),
};

// ============================================================================
// 11. ReportesController (/api/reportes)
// ============================================================================
export const reportesApi = {
  morosidad: () => unwrapResponse<VwMorosidadContribuyente[]>(httpClient.get('/reportes/morosidad')),
  recaudacionTributo: () =>
    unwrapResponse<VwRecaudacionPorTributo[]>(httpClient.get('/reportes/recaudacion-tributo')),
  recaudacionDistrito: () =>
    unwrapResponse<VwRecaudacionPorDistrito[]>(httpClient.get('/reportes/recaudacion-distrito')),
  historialTramites: (idContribuyente: number) =>
    unwrapResponse<SpReporteHistorialTramitesResultDto[]>(
      httpClient.get(`/reportes/historial-tramites/${idContribuyente}`)
    ),
  recaudacionTributoPeriodo: (fechaInicio?: string, fechaFin?: string) =>
    unwrapResponse<SpReporteRecaudacionTributoResultDto[]>(
      httpClient.get('/reportes/recaudacion-tributo/periodo', {
        params: {
          ...(fechaInicio ? { fechaInicio } : {}),
          ...(fechaFin ? { fechaFin } : {}),
        },
      })
    ),
  recaudacionDistritoPeriodo: (fechaInicio?: string, fechaFin?: string) =>
    unwrapResponse<SpReporteRecaudacionDistritoResultDto[]>(
      httpClient.get('/reportes/recaudacion-distrito/periodo', {
        params: {
          ...(fechaInicio ? { fechaInicio } : {}),
          ...(fechaFin ? { fechaFin } : {}),
        },
      })
    ),
  contribuyentesMorosos: () =>
    unwrapResponse<SpReporteContribuyentesMorososResultDto[]>(
      httpClient.get('/reportes/contribuyentes-morosos')
    ),
  solicitudesDepartamento: () =>
    unwrapResponse<SpReporteSolicitudesDeptoResultDto[]>(
      httpClient.get('/reportes/solicitudes-departamento')
    ),
  eficienciaTramites: () =>
    unwrapResponse<SpReporteEficienciaResultDto[]>(
      httpClient.get('/reportes/eficiencia-tramites')
    ),
  gestionMunicipal: (tipoReporte: TipoReporteGestion, filtroTexto?: string) =>
    unwrapResponse<SpReporteGestionMunicipalResultDto>(
      httpClient.get('/reportes/gestion-municipal', {
        params: {
          tipoReporte,
          ...(filtroTexto ? { filtroTexto } : {}),
        },
      })
    ),
};

// ============================================================================
// 12. AuditoriaController (/api/auditoria)
// ============================================================================
export const auditoriaApi = {
  detallada: () => unwrapResponse<VwAuditoriaDetallada[]>(httpClient.get('/auditoria')),
  recientes: () =>
    unwrapResponse<SpConsultarAuditoriaResultDto[]>(httpClient.get('/auditoria/recientes')),
  filtrar: (params: {
    tablaAfectada?: string;
    idUsuario?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }) =>
    unwrapResponse<SpFiltrarAuditoriaResultDto[]>(
      httpClient.get('/auditoria/filtrar', {
        params: {
          ...(params.tablaAfectada ? { tablaAfectada: params.tablaAfectada } : {}),
          ...(params.idUsuario ? { idUsuario: params.idUsuario } : {}),
          ...(params.fechaInicio ? { fechaInicio: params.fechaInicio } : {}),
          ...(params.fechaFin ? { fechaFin: params.fechaFin } : {}),
        },
      })
    ),
  registro: (tablaAfectada: string, idRegistroAfectado: string) =>
    unwrapResponse<SpConsultarAuditoriaResultDto[]>(
      httpClient.get('/auditoria/registro', {
        params: { tablaAfectada, idRegistroAfectado },
      })
    ),
  registrarTipoAccion: (dto: RegistrarTipoAccionAuditoriaDto) =>
    unwrapFullResponse<unknown>(httpClient.post('/auditoria/tipo-accion', dto)),
  registrar: (dto: RegistrarAuditoriaDto) =>
    unwrapFullResponse<unknown>(httpClient.post('/auditoria', dto)),
};

// ============================================================================
// 13. RespaldosDbaController (/api/respaldosdba)
// ============================================================================
export const respaldosDbaApi = {
  estado: () => unwrapResponse<VwEstadoRespaldo[]>(httpClient.get('/respaldosdba/estado')),
  frecuencias: () =>
    unwrapResponse<SpFrecuenciaResultDto[]>(httpClient.get('/respaldosdba/frecuencias')),
  tiposRespaldo: () =>
    unwrapResponse<SpTipoRespaldoResultDto[]>(httpClient.get('/respaldosdba/tipos-respaldo')),
  configuraciones: () =>
    unwrapResponse<SpConfiguracionRespaldoResultDto[]>(
      httpClient.get('/respaldosdba/configuraciones')
    ),
  historial: (fechaInicio?: string, fechaFin?: string) =>
    unwrapResponse<SpHistorialRespaldosResultDto[]>(
      httpClient.get('/respaldosdba/historial', {
        params: {
          ...(fechaInicio ? { fechaInicio } : {}),
          ...(fechaFin ? { fechaFin } : {}),
        },
      })
    ),
  registrarConfiguracion: (dto: RegistrarConfiguracionRespaldoDto) =>
    unwrapFullResponse<number>(httpClient.post('/respaldosdba/configuracion', dto)),
  actualizarConfiguracion: (idRespaldosConfig: number, dto: ActualizarConfiguracionRespaldoDto) =>
    unwrapFullResponse<unknown>(
      httpClient.put(`/respaldosdba/configuracion/${idRespaldosConfig}`, dto)
    ),
  backupFull: (dto?: EjecutarBackupDto) =>
    unwrapFullResponse<unknown>(httpClient.post('/respaldosdba/backup-full', dto ?? {})),
  backupDiferencial: (dto?: EjecutarBackupDto) =>
    unwrapFullResponse<unknown>(httpClient.post('/respaldosdba/backup-diferencial', dto ?? {})),
  verificarIntegridad: () =>
    unwrapFullResponse<unknown>(httpClient.post('/respaldosdba/verificar-integridad')),
  simularRestauracion: (dto: SimularRestauracionDto) =>
    unwrapFullResponse<unknown>(httpClient.post('/respaldosdba/simular-restauracion', dto)),
};

// ============================================================================
// 14. DataWarehouseController (/api/datawarehouse) — script 15
// ============================================================================
export const dataWarehouseApi = {
  estado: () => unwrapResponse<SpDwEstadoResultDto | null>(httpClient.get('/datawarehouse/estado')),
  ejecutarEtl: () =>
    unwrapFullResponse<SpDwValidacionEtlResultDto[]>(
      httpClient.post('/datawarehouse/etl', undefined, { timeout: 15 * 60 * 1000 })
    ),
  historialCargas: () =>
    unwrapResponse<SpDwHistorialCargaResultDto[]>(httpClient.get('/datawarehouse/historial-cargas')),
  recaudacionPeriodo: () =>
    unwrapResponse<SpDwRecaudacionPeriodoResultDto[]>(httpClient.get('/datawarehouse/recaudacion-periodo')),
  recaudacionTributo: () =>
    unwrapResponse<SpDwRecaudacionTributoResultDto[]>(httpClient.get('/datawarehouse/recaudacion-tributo')),
  recaudacionUbicacion: () =>
    unwrapResponse<SpDwRecaudacionUbicacionResultDto[]>(
      httpClient.get('/datawarehouse/recaudacion-ubicacion')
    ),
  morosidad: () => unwrapResponse<SpDwMorosidadResultDto[]>(httpClient.get('/datawarehouse/morosidad')),
  eficienciaTramites: () =>
    unwrapResponse<SpDwEficienciaTramitesResultDto[]>(httpClient.get('/datawarehouse/eficiencia-tramites')),
  indicadoresDepartamento: () =>
    unwrapResponse<SpDwIndicadoresDepartamentoResultDto[]>(
      httpClient.get('/datawarehouse/indicadores-departamento')
    ),
};

// ============================================================================
// 15. MonitoreoDbaController (/api/monitoreodba) — script 15
// ============================================================================
export const monitoreoDbaApi = {
  resumen: () => unwrapResponse<SpDbaMonitorResumenResultDto | null>(httpClient.get('/monitoreodba/resumen')),
  sesiones: (umbralSegundos = 5) =>
    unwrapResponse<SpDbaMonitorSesionResultDto[]>(
      httpClient.get('/monitoreodba/sesiones', { params: { umbralSegundos } })
    ),
  archivos: () => unwrapResponse<SpDbaMonitorArchivoResultDto[]>(httpClient.get('/monitoreodba/archivos')),
  fragmentacion: () =>
    unwrapResponse<SpDbaFragmentacionResultDto[]>(httpClient.get('/monitoreodba/fragmentacion')),
  terminarSesion: (sessionId: number) =>
    unwrapFullResponse<unknown>(httpClient.post(`/monitoreodba/sesiones/${sessionId}/terminar`)),
  ejecutarMantenimiento: (dto: EjecutarMantenimientoDto) =>
    unwrapFullResponse<SpDbaMantenimientoResultDto[]>(
      httpClient.post('/monitoreodba/mantenimiento', dto, { timeout: 30 * 60 * 1000 })
    ),
  historialMantenimiento: () =>
    unwrapResponse<SpDbaHistorialMantenimientoResultDto[]>(
      httpClient.get('/monitoreodba/mantenimiento/historial')
    ),
};

