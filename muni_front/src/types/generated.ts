// ============================================================================
// ARCHIVO GENERADO por muni-back/tools/generar_entities.py. NO EDITAR A MANO.
// Recordsets de las vistas dbo.vw_* y de los procedimientos dbo.sp_* tal como
// los devuelve la API (camelCase). Los valores de texto pueden venir en null.
// ============================================================================

/** Vista dbo.vw_padron_contribuyentes */
export interface VwPadronContribuyente {
  /** id_contribuyente */
  idContribuyente: number;
  /** tipo_persona */
  tipoPersona: string | null;
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** nombre_fantasia */
  nombreFantasia: string | null;
  /** correo_electronico */
  correoElectronico: string | null;
  /** telefono */
  telefono: string | null;
  /** direccion_notificaciones */
  direccionNotificaciones: string | null;
  /** fecha_registro */
  fechaRegistro: string;
  /** estado_contribuyente */
  estadoContribuyente: boolean;
  /** estado_descripcion */
  estadoDescripcion: string | null;
}

/** Vista dbo.vw_inmuebles_propietarios */
export interface VwInmueblesPropietario {
  /** id_inmueble */
  idInmueble: number;
  /** numero_finca */
  numeroFinca: string | null;
  /** nombre_distrito */
  nombreDistrito: string | null;
  /** codigo_distrital */
  codigoDistrital: string | null;
  /** codigo_uso */
  codigoUso: string | null;
  /** uso_suelo */
  usoSuelo: string | null;
  /** direccion_exacta */
  direccionExacta: string | null;
  /** area_terreno_m2 */
  areaTerrenoM2: number;
  /** area_construccion_m2 */
  areaConstruccionM2: number;
  /** valor_fiscal */
  valorFiscal: number;
  /** plano_catastrado */
  planoCatastrado: string | null;
  /** id_contribuyente */
  idContribuyente: number;
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** porcentaje_participacion */
  porcentajeParticipacion: number;
  /** fecha_adquisicion */
  fechaAdquisicion: string;
  /** valor_fiscal_proporcional */
  valorFiscalProporcional: number | null;
}

/** Vista dbo.vw_tramites_seguimiento */
export interface VwTramitesSeguimiento {
  /** id_tramite */
  idTramite: number;
  /** numero_expediente */
  numeroExpediente: string | null;
  /** fecha_radicacion */
  fechaRadicacion: string;
  /** fecha_resolucion_estimada */
  fechaResolucionEstimada: string | null;
  /** fecha_resolucion_final */
  fechaResolucionFinal: string | null;
  /** nombre_tramite */
  nombreTramite: string | null;
  /** dias_resolucion_max */
  diasResolucionMax: number;
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** id_contribuyente */
  idContribuyente: number;
  /** cedula_solicitante */
  cedulaSolicitante: string | null;
  /** solicitante */
  solicitante: string | null;
  /** funcionario_analista */
  funcionarioAnalista: string | null;
  /** numero_finca */
  numeroFinca: string | null;
  /** estado_actual */
  estadoActual: string | null;
  /** dias_transcurridos */
  diasTranscurridos: number | null;
  /** dias_restantes_sla */
  diasRestantesSla: number | null;
  /** fuera_plazo */
  fueraPlazo: boolean | null;
}

/** Vista dbo.vw_historial_tramites_detallado */
export interface VwHistorialTramitesDetallado {
  /** id_historial */
  idHistorial: number;
  /** id_tramite */
  idTramite: number;
  /** numero_expediente */
  numeroExpediente: string | null;
  /** nombre_tramite */
  nombreTramite: string | null;
  /** fecha_cambio */
  fechaCambio: string;
  /** codigo_estado */
  codigoEstado: string | null;
  /** nombre_estado */
  nombreEstado: string | null;
  /** observaciones */
  observaciones: string | null;
}

/** Vista dbo.vw_estado_cuenta_contribuyente */
export interface VwEstadoCuentaContribuyente {
  /** id_contribuyente */
  idContribuyente: number;
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** numero_finca */
  numeroFinca: string | null;
  /** id_deuda_municipal */
  idDeudaMunicipal: number;
  /** periodo_deuda */
  periodoDeuda: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** monto_principal */
  montoPrincipal: number;
  /** monto_intereses */
  montoIntereses: number;
  /** monto_multas */
  montoMultas: number;
  /** total_deuda */
  totalDeuda: number | null;
  /** fecha_de_vencimiento */
  fechaDeVencimiento: string;
  /** codigo_estado_deuda */
  codigoEstadoDeuda: string | null;
  /** descripcion_estado_deuda */
  descripcionEstadoDeuda: string | null;
  /** id_factura */
  idFactura: number | null;
  /** clave_numerica_hacienda */
  claveNumericaHacienda: string | null;
  /** total_a_pagar */
  totalAPagar: number | null;
  /** saldo_pendiente */
  saldoPendiente: number | null;
  /** estado_factura */
  estadoFactura: string | null;
}

/** Vista dbo.vw_facturas_pendientes */
export interface VwFacturasPendiente {
  /** id_factura */
  idFactura: number;
  /** clave_numerica_hacienda */
  claveNumericaHacienda: string | null;
  /** fecha_emision */
  fechaEmision: string;
  /** subtotal */
  subtotal: number;
  /** descuentos */
  descuentos: number;
  /** total_a_pagar */
  totalAPagar: number;
  /** saldo_pendiente */
  saldoPendiente: number;
  /** estado_factura */
  estadoFactura: string | null;
  /** id_deuda_municipal */
  idDeudaMunicipal: number;
  /** periodo_deuda */
  periodoDeuda: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** numero_finca */
  numeroFinca: string | null;
  /** nombre_distrito */
  nombreDistrito: string | null;
  /** dias_mora */
  diasMora: number | null;
}

/** Vista dbo.vw_morosidad_contribuyentes */
export interface VwMorosidadContribuyente {
  /** id_contribuyente */
  idContribuyente: number;
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** telefono */
  telefono: string | null;
  /** correo_electronico */
  correoElectronico: string | null;
  /** numero_finca */
  numeroFinca: string | null;
  /** nombre_distrito */
  nombreDistrito: string | null;
  /** id_deuda_municipal */
  idDeudaMunicipal: number;
  /** periodo_deuda */
  periodoDeuda: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** monto_principal */
  montoPrincipal: number;
  /** monto_intereses */
  montoIntereses: number;
  /** monto_multas */
  montoMultas: number;
  /** deuda_total */
  deudaTotal: number | null;
  /** fecha_de_vencimiento */
  fechaDeVencimiento: string;
  /** dias_mora */
  diasMora: number | null;
}

/** Vista dbo.vw_recaudacion_por_tributo */
export interface VwRecaudacionPorTributo {
  /** id_tipo_tributo */
  idTipoTributo: number;
  /** codigo_tributo */
  codigoTributo: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** periodicidad */
  periodicidad: string | null;
  /** cantidad_transacciones */
  cantidadTransacciones: number;
  /** total_principal_recaudado */
  totalPrincipalRecaudado: number | null;
  /** total_intereses_recaudados */
  totalInteresesRecaudados: number | null;
  /** total_recargos_recaudados */
  totalRecargosRecaudados: number | null;
  /** total_recaudado_general */
  totalRecaudadoGeneral: number | null;
}

/** Vista dbo.vw_recaudacion_por_distrito */
export interface VwRecaudacionPorDistrito {
  /** id_distrito */
  idDistrito: number;
  /** codigo_distrital */
  codigoDistrital: string | null;
  /** nombre_distrito */
  nombreDistrito: string | null;
  /** transacciones_pago */
  transaccionesPago: number;
  /** principal_recaudado */
  principalRecaudado: number | null;
  /** intereses_recaudados */
  interesesRecaudados: number | null;
  /** recargos_recaudados */
  recargosRecaudados: number | null;
  /** recaudacion_distrital_total */
  recaudacionDistritalTotal: number | null;
}

/** Vista dbo.vw_auditoria_detallada */
export interface VwAuditoriaDetallada {
  /** id_auditoria */
  idAuditoria: number;
  /** fecha_hora */
  fechaHora: string;
  /** operacion_dml */
  operacionDml: string | null;
  /** tabla_afectada */
  tablaAfectada: string | null;
  /** id_registro_afectado */
  idRegistroAfectado: string | null;
  /** valores_anteriores */
  valoresAnteriores: string | null;
  /** valores_nuevos */
  valoresNuevos: string | null;
  /** direccion_ip */
  direccionIp: string | null;
  /** id_usuario */
  idUsuario: number | null;
  /** usuario_ejecutor */
  usuarioEjecutor: string | null;
  /** nombre_departamento */
  nombreDepartamento: string | null;
}

/** Vista dbo.vw_usuarios_roles_permisos */
export interface VwUsuariosRolesPermiso {
  /** id_usuario */
  idUsuario: number;
  /** user_name */
  userName: string | null;
  /** nombre_completo */
  nombreCompleto: string | null;
  /** email_usuario */
  emailUsuario: string | null;
  /** activo */
  activo: boolean;
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** id_rol */
  idRol: number;
  /** nombre_rol */
  nombreRol: string | null;
  /** id_permiso */
  idPermiso: number;
  /** modulo */
  modulo: string | null;
  /** accion */
  accion: string | null;
}

/** Vista dbo.vw_estado_respaldos */
export interface VwEstadoRespaldo {
  /** id_respaldos */
  idRespaldos: number;
  /** nombre_configuracion */
  nombreConfiguracion: string | null;
  /** nombre_tipo_respaldo */
  nombreTipoRespaldo: string | null;
  /** nombre_frecuencia */
  nombreFrecuencia: string | null;
  /** fecha_inicio */
  fechaInicio: string;
  /** fecha_fin */
  fechaFin: string | null;
  /** duracion_segundos */
  duracionSegundos: number | null;
  /** estado_ejecucion */
  estadoEjecucion: string | null;
  /** tamano_bytes */
  tamanoBytes: number;
  /** tamano_mb */
  tamanoMb: number | null;
  /** ruta_archivo */
  rutaArchivo: string | null;
  /** detalles_error */
  detallesError: string | null;
}

/** Recordset de dbo.sp_autenticar_usuario */
export interface SpAutenticarUsuarioResultDto {
  /** id_usuario */
  idUsuario: number;
  /** user_name */
  userName: string | null;
  /** nombre_completo */
  nombreCompleto: string | null;
  /** email */
  email: string | null;
  /** id_departamento */
  idDepartamento: number;
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** nombre_rol */
  nombreRol: string | null;
}

/** Recordset de dbo.sp_consultar_usuario */
export interface SpConsultarUsuarioResultDto {
  /** id_usuario */
  idUsuario: number;
  /** user_name */
  userName: string | null;
  /** nombre_usuario */
  nombreUsuario: string | null;
  /** apellido1_usuario */
  apellido1Usuario: string | null;
  /** apellido2_usuario */
  apellido2Usuario: string | null;
  /** email_usuario */
  emailUsuario: string | null;
  /** activo */
  activo: boolean;
  /** nombre_departamento */
  nombreDepartamento: string | null;
}

/** Recordset de dbo.sp_consultar_roles_permisos_usuario */
export interface SpRolesPermisosUsuarioResultDto {
  /** id_usuario */
  idUsuario: number;
  /** user_name */
  userName: string | null;
  /** nombre_completo */
  nombreCompleto: string | null;
  /** email_usuario */
  emailUsuario: string | null;
  /** activo */
  activo: boolean;
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** id_rol */
  idRol: number;
  /** nombre_rol */
  nombreRol: string | null;
  /** id_permiso */
  idPermiso: number;
  /** modulo */
  modulo: string | null;
  /** accion */
  accion: string | null;
}

/** Recordset de dbo.sp_consultar_contribuyente */
export interface SpConsultarContribuyenteResultDto {
  /** id_contribuyente */
  idContribuyente: number;
  /** tipo_persona */
  tipoPersona: string | null;
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** nombre_fantasia */
  nombreFantasia: string | null;
  /** correo_electronico */
  correoElectronico: string | null;
  /** telefono */
  telefono: string | null;
  /** direccion_notificaciones */
  direccionNotificaciones: string | null;
  /** fecha_registro */
  fechaRegistro: string;
  /** estado_contribuyente */
  estadoContribuyente: boolean;
  /** estado_descripcion */
  estadoDescripcion: string | null;
}

/** Recordset de dbo.sp_consultar_inmueble */
export interface SpConsultarInmuebleResultDto {
  /** id_inmueble */
  idInmueble: number;
  /** numero_finca */
  numeroFinca: string | null;
  /** direccion_exacta */
  direccionExacta: string | null;
  /** area_terreno_m2 */
  areaTerrenoM2: number;
  /** area_construccion_m2 */
  areaConstruccionM2: number;
  /** valor_fiscal */
  valorFiscal: number;
  /** plano_catastrado */
  planoCatastrado: string | null;
  /** id_tipo_uso_inmueble */
  idTipoUsoInmueble: number;
  /** id_distrito */
  idDistrito: number;
  /** nombre_distrito */
  nombreDistrito: string | null;
  /** codigo_uso */
  codigoUso: string | null;
  /** uso_suelo */
  usoSuelo: string | null;
}

/** Recordset de dbo.sp_consultar_inmuebles_por_contribuyente */
export interface SpInmueblesPorContribuyenteResultDto {
  /** id_inmueble */
  idInmueble: number;
  /** numero_finca */
  numeroFinca: string | null;
  /** nombre_distrito */
  nombreDistrito: string | null;
  /** codigo_distrital */
  codigoDistrital: string | null;
  /** codigo_uso */
  codigoUso: string | null;
  /** uso_suelo */
  usoSuelo: string | null;
  /** direccion_exacta */
  direccionExacta: string | null;
  /** area_terreno_m2 */
  areaTerrenoM2: number;
  /** area_construccion_m2 */
  areaConstruccionM2: number;
  /** valor_fiscal */
  valorFiscal: number;
  /** plano_catastrado */
  planoCatastrado: string | null;
  /** id_contribuyente */
  idContribuyente: number;
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** porcentaje_participacion */
  porcentajeParticipacion: number;
  /** fecha_adquisicion */
  fechaAdquisicion: string;
  /** valor_fiscal_proporcional */
  valorFiscalProporcional: number | null;
}

/** Recordset de dbo.sp_consultar_distritos */
export interface SpDistritoResultDto {
  /** id_distrito */
  idDistrito: number;
  /** codigo_distrital */
  codigoDistrital: string | null;
  /** nombre_distrito */
  nombreDistrito: string | null;
}

/** Recordset de dbo.sp_consultar_tipos_uso_inmueble */
export interface SpTipoUsoInmuebleResultDto {
  /** id_tipo_uso_inmueble */
  idTipoUsoInmueble: number;
  /** codigo_uso */
  codigoUso: string | null;
  /** descripcion */
  descripcion: string | null;
}

/** Recordset de dbo.sp_consultar_tipos_tramite */
export interface SpTiposTramiteResultDto {
  /** id_tipo_tramite */
  idTipoTramite: number;
  /** nombre_tramite */
  nombreTramite: string | null;
  /** descripcion_tipo */
  descripcionTipo: string | null;
  /** dias_resolucion_max */
  diasResolucionMax: number;
  /** id_departamento */
  idDepartamento: number;
  /** nombre_departamento */
  nombreDepartamento: string | null;
}

/** Recordset de dbo.sp_consultar_requisitos_por_tipo_tramite */
export interface SpRequisitosTramiteResultDto {
  /** id_requisito */
  idRequisito: number;
  /** nombre_requisito */
  nombreRequisito: string | null;
  /** descripcion */
  descripcion: string | null;
  /** es_obligatorio */
  esObligatorio: boolean;
}

/** Recordset de dbo.sp_consultar_tramite */
export interface SpConsultarTramiteResultDto {
  /** id_tramite */
  idTramite: number;
  /** numero_expediente */
  numeroExpediente: string | null;
  /** fecha_radicacion */
  fechaRadicacion: string;
  /** fecha_resolucion_estimada */
  fechaResolucionEstimada: string | null;
  /** fecha_resolucion_final */
  fechaResolucionFinal: string | null;
  /** nombre_tramite */
  nombreTramite: string | null;
  /** dias_resolucion_max */
  diasResolucionMax: number;
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** id_contribuyente */
  idContribuyente: number;
  /** cedula_solicitante */
  cedulaSolicitante: string | null;
  /** solicitante */
  solicitante: string | null;
  /** funcionario_analista */
  funcionarioAnalista: string | null;
  /** numero_finca */
  numeroFinca: string | null;
  /** estado_actual */
  estadoActual: string | null;
  /** dias_transcurridos */
  diasTranscurridos: number | null;
  /** dias_restantes_sla */
  diasRestantesSla: number | null;
  /** fuera_plazo */
  fueraPlazo: boolean | null;
}

/** Recordset de dbo.sp_consultar_estados_tramite */
export interface SpEstadosTramiteResultDto {
  /** id_estado */
  idEstado: number;
  /** codigo */
  codigo: string | null;
  /** nombre_estado */
  nombreEstado: string | null;
}

/** Recordset de dbo.sp_consultar_historial_tramite */
export interface SpHistorialTramiteResultDto {
  /** id_historial */
  idHistorial: number;
  /** id_tramite */
  idTramite: number;
  /** numero_expediente */
  numeroExpediente: string | null;
  /** nombre_tramite */
  nombreTramite: string | null;
  /** fecha_cambio */
  fechaCambio: string;
  /** codigo_estado */
  codigoEstado: string | null;
  /** nombre_estado */
  nombreEstado: string | null;
  /** observaciones */
  observaciones: string | null;
}

/** Recordset de dbo.sp_consultar_tramites_por_contribuyente */
export interface SpTramitesPorContribuyenteResultDto {
  /** id_tramite */
  idTramite: number;
  /** numero_expediente */
  numeroExpediente: string | null;
  /** fecha_radicacion */
  fechaRadicacion: string;
  /** fecha_resolucion_estimada */
  fechaResolucionEstimada: string | null;
  /** fecha_resolucion_final */
  fechaResolucionFinal: string | null;
  /** nombre_tramite */
  nombreTramite: string | null;
  /** dias_resolucion_max */
  diasResolucionMax: number;
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** id_contribuyente */
  idContribuyente: number;
  /** cedula_solicitante */
  cedulaSolicitante: string | null;
  /** solicitante */
  solicitante: string | null;
  /** funcionario_analista */
  funcionarioAnalista: string | null;
  /** numero_finca */
  numeroFinca: string | null;
  /** estado_actual */
  estadoActual: string | null;
  /** dias_transcurridos */
  diasTranscurridos: number | null;
  /** dias_restantes_sla */
  diasRestantesSla: number | null;
  /** fuera_plazo */
  fueraPlazo: boolean | null;
}

/** Recordset de dbo.sp_consultar_tipos_tributo */
export interface SpTiposTributoResultDto {
  /** id_tipo_tributo */
  idTipoTributo: number;
  /** codigo_tributo */
  codigoTributo: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** base_calculo */
  baseCalculo: string | null;
  /** tarifa */
  tarifa: number | null;
  /** monto_fijo */
  montoFijo: number | null;
  /** periodicidad */
  periodicidad: string | null;
}

/** Recordset de dbo.sp_consultar_deudas_contribuyente */
export interface SpDeudasContribuyenteResultDto {
  /** id_contribuyente */
  idContribuyente: number;
  /** numero_finca */
  numeroFinca: string | null;
  /** id_deuda_municipal */
  idDeudaMunicipal: number;
  /** periodo_deuda */
  periodoDeuda: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** monto_principal */
  montoPrincipal: number;
  /** monto_intereses */
  montoIntereses: number;
  /** monto_multas */
  montoMultas: number;
  /** monto_total */
  montoTotal: number | null;
  /** fecha_de_vencimiento */
  fechaDeVencimiento: string;
  /** codigo_estado_deuda */
  codigoEstadoDeuda: string | null;
  /** descripcion_estado_deuda */
  descripcionEstadoDeuda: string | null;
}

/** Recordset de dbo.sp_consultar_factura */
export interface SpConsultarFacturaResultDto {
  /** id_factura */
  idFactura: number;
  /** clave_numerica_hacienda */
  claveNumericaHacienda: string | null;
  /** fecha_emision */
  fechaEmision: string;
  /** subtotal */
  subtotal: number;
  /** descuentos */
  descuentos: number;
  /** total_a_pagar */
  totalAPagar: number;
  /** saldo_pendiente */
  saldoPendiente: number;
  /** estado_factura */
  estadoFactura: string | null;
  /** id_deuda_municipal */
  idDeudaMunicipal: number;
  /** periodo_deuda */
  periodoDeuda: string | null;
  /** numero_finca */
  numeroFinca: string | null;
}

/** Recordset de dbo.sp_consultar_facturas_contribuyente */
export interface SpFacturasContribuyenteResultDto {
  /** id_factura */
  idFactura: number;
  /** clave_numerica_hacienda */
  claveNumericaHacienda: string | null;
  /** fecha_emision */
  fechaEmision: string;
  /** subtotal */
  subtotal: number;
  /** descuentos */
  descuentos: number;
  /** total_a_pagar */
  totalAPagar: number;
  /** saldo_pendiente */
  saldoPendiente: number;
  /** estado_factura */
  estadoFactura: string | null;
  /** periodo_deuda */
  periodoDeuda: string | null;
  /** numero_finca */
  numeroFinca: string | null;
}

/** Recordset de dbo.sp_consultar_medios_pago */
export interface SpMediosPagoResultDto {
  /** id_medio_pago */
  idMedioPago: number;
  /** nombre_medio_pago */
  nombreMedioPago: string | null;
}

/** Recordset de dbo.sp_consultar_estado_cuenta */
export interface SpEstadoCuentaResultDto {
  /** id_contribuyente */
  idContribuyente: number;
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** numero_finca */
  numeroFinca: string | null;
  /** id_deuda_municipal */
  idDeudaMunicipal: number;
  /** periodo_deuda */
  periodoDeuda: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** monto_principal */
  montoPrincipal: number;
  /** monto_intereses */
  montoIntereses: number;
  /** monto_multas */
  montoMultas: number;
  /** total_deuda */
  totalDeuda: number | null;
  /** fecha_de_vencimiento */
  fechaDeVencimiento: string;
  /** codigo_estado_deuda */
  codigoEstadoDeuda: string | null;
  /** descripcion_estado_deuda */
  descripcionEstadoDeuda: string | null;
  /** id_factura */
  idFactura: number | null;
  /** clave_numerica_hacienda */
  claveNumericaHacienda: string | null;
  /** total_a_pagar */
  totalAPagar: number | null;
  /** saldo_pendiente */
  saldoPendiente: number | null;
  /** estado_factura */
  estadoFactura: string | null;
}

/** Recordset de dbo.sp_consultar_auditoria */
export interface SpConsultarAuditoriaResultDto {
  /** id_auditoria */
  idAuditoria: number;
  /** fecha_hora */
  fechaHora: string;
  /** operacion_dml */
  operacionDml: string | null;
  /** tabla_afectada */
  tablaAfectada: string | null;
  /** id_registro_afectado */
  idRegistroAfectado: string | null;
  /** valores_anteriores */
  valoresAnteriores: string | null;
  /** valores_nuevos */
  valoresNuevos: string | null;
  /** direccion_ip */
  direccionIp: string | null;
  /** id_usuario */
  idUsuario: number | null;
  /** usuario_ejecutor */
  usuarioEjecutor: string | null;
  /** nombre_departamento */
  nombreDepartamento: string | null;
}

/** Recordset de dbo.sp_filtrar_auditoria */
export interface SpFiltrarAuditoriaResultDto {
  /** id_auditoria */
  idAuditoria: number;
  /** fecha_hora */
  fechaHora: string;
  /** operacion_dml */
  operacionDml: string | null;
  /** tabla_afectada */
  tablaAfectada: string | null;
  /** id_registro_afectado */
  idRegistroAfectado: string | null;
  /** valores_anteriores */
  valoresAnteriores: string | null;
  /** valores_nuevos */
  valoresNuevos: string | null;
  /** direccion_ip */
  direccionIp: string | null;
  /** id_usuario */
  idUsuario: number | null;
  /** usuario_ejecutor */
  usuarioEjecutor: string | null;
  /** nombre_departamento */
  nombreDepartamento: string | null;
}

/** Recordset de dbo.sp_consultar_historial_respaldos */
export interface SpHistorialRespaldosResultDto {
  /** id_respaldos */
  idRespaldos: number;
  /** nombre_configuracion */
  nombreConfiguracion: string | null;
  /** nombre_tipo_respaldo */
  nombreTipoRespaldo: string | null;
  /** nombre_frecuencia */
  nombreFrecuencia: string | null;
  /** fecha_inicio */
  fechaInicio: string;
  /** fecha_fin */
  fechaFin: string | null;
  /** duracion_segundos */
  duracionSegundos: number | null;
  /** estado_ejecucion */
  estadoEjecucion: string | null;
  /** tamano_bytes */
  tamanoBytes: number;
  /** tamano_mb */
  tamanoMb: number | null;
  /** ruta_archivo */
  rutaArchivo: string | null;
  /** detalles_error */
  detallesError: string | null;
}

/** Recordset de dbo.sp_reporte_historial_tramites_contribuyente */
export interface SpReporteHistorialTramitesResultDto {
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** numero_expediente */
  numeroExpediente: string | null;
  /** nombre_tramite */
  nombreTramite: string | null;
  /** fecha_radicacion */
  fechaRadicacion: string;
  /** fecha_resolucion_final */
  fechaResolucionFinal: string | null;
  /** fecha_cambio */
  fechaCambio: string;
  /** nombre_estado */
  nombreEstado: string | null;
  /** observaciones */
  observaciones: string | null;
}

/** Recordset de dbo.sp_reporte_recaudacion_tributo */
export interface SpReporteRecaudacionTributoResultDto {
  /** codigo_tributo */
  codigoTributo: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** recibos_emitidos */
  recibosEmitidos: number;
  /** subtotal_principal */
  subtotalPrincipal: number | null;
  /** subtotal_intereses */
  subtotalIntereses: number | null;
  /** subtotal_recargos */
  subtotalRecargos: number | null;
  /** gran_total_recaudado */
  granTotalRecaudado: number | null;
}

/** Recordset de dbo.sp_reporte_recaudacion_distrito */
export interface SpReporteRecaudacionDistritoResultDto {
  /** codigo_distrital */
  codigoDistrital: string | null;
  /** nombre_distrito */
  nombreDistrito: string | null;
  /** pagos_recibidos */
  pagosRecibidos: number;
  /** recaudado_principal */
  recaudadoPrincipal: number | null;
  /** recaudado_intereses */
  recaudadoIntereses: number | null;
  /** recaudado_recargos */
  recaudadoRecargos: number | null;
  /** total_distrito */
  totalDistrito: number | null;
}

/** Recordset de dbo.sp_reporte_contribuyentes_morosos */
export interface SpReporteContribuyentesMorososResultDto {
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** telefono */
  telefono: string | null;
  /** correo_electronico */
  correoElectronico: string | null;
  /** facturas_pendientes */
  facturasPendientes: number;
  /** deuda_acumulada_total */
  deudaAcumuladaTotal: number | null;
  /** maximos_dias_morosidad */
  maximosDiasMorosidad: number | null;
}

/** Recordset de dbo.sp_reporte_solicitudes_departamento */
export interface SpReporteSolicitudesDeptoResultDto {
  /** codigo_interno */
  codigoInterno: string | null;
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** total_solicitudes_recibidas */
  totalSolicitudesRecibidas: number;
  /** total_resueltas */
  totalResueltas: number | null;
  /** total_en_tramite */
  totalEnTramite: number | null;
}

/** Recordset de dbo.sp_reporte_eficiencia_tramites */
export interface SpReporteEficienciaResultDto {
  /** nombre_tramite */
  nombreTramite: string | null;
  /** sla_comprometido */
  slaComprometido: number;
  /** volumen_tramites */
  volumenTramites: number;
  /** promedio_dias_resolucion */
  promedioDiasResolucion: number | null;
  /** total_fuera_plazo */
  totalFueraPlazo: number | null;
  /** tasa_exito_sla_porcentaje */
  tasaExitoSlaPorcentaje: number | null;
}

/** Recordset de dbo.sp_consultar_roles */
export interface SpRolResultDto {
  /** id_rol */
  idRol: number;
  /** nombre_rol */
  nombreRol: string | null;
}

/** Recordset de dbo.sp_consultar_permisos */
export interface SpPermisoResultDto {
  /** id_permiso */
  idPermiso: number;
  /** modulo */
  modulo: string | null;
  /** accion */
  accion: string | null;
}

/** Recordset de dbo.sp_consultar_requisitos */
export interface SpRequisitoResultDto {
  /** id_requisito */
  idRequisito: number;
  /** nombre_requisito */
  nombreRequisito: string | null;
  /** descripcion */
  descripcion: string | null;
  /** es_obligatorio */
  esObligatorio: boolean;
}

/** Recordset de dbo.sp_consultar_departamentos */
export interface SpDepartamentoResultDto {
  /** id_departamento */
  idDepartamento: number;
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** codigo_interno */
  codigoInterno: string | null;
}

/** Recordset de dbo.sp_consultar_frecuencias */
export interface SpFrecuenciaResultDto {
  /** id_frecuencia */
  idFrecuencia: number;
  /** nombre_frecuencia */
  nombreFrecuencia: string | null;
  /** intervalo_horas */
  intervaloHoras: number;
  /** descripcion_frecuencia */
  descripcionFrecuencia: string | null;
}

/** Recordset de dbo.sp_consultar_tipos_respaldo */
export interface SpTipoRespaldoResultDto {
  /** id_tipo_de_respaldo */
  idTipoDeRespaldo: number;
  /** nombre_tipo_respaldo */
  nombreTipoRespaldo: string | null;
  /** descripcion */
  descripcion: string | null;
}

/** Recordset de dbo.sp_consultar_configuraciones_respaldo */
export interface SpConfiguracionRespaldoResultDto {
  /** id_respaldos_config */
  idRespaldosConfig: number;
  /** nombre_configuracion */
  nombreConfiguracion: string | null;
  /** hora_ejecucion */
  horaEjecucion: string;
  /** origen */
  origen: string | null;
  /** retencion_dias */
  retencionDias: number;
  /** cifrado */
  cifrado: string | null;
  /** ruta_destino */
  rutaDestino: string | null;
  /** activo */
  activo: boolean;
  /** fecha_creacion */
  fechaCreacion: string;
  /** fecha_modificacion */
  fechaModificacion: string | null;
  /** id_frecuencia */
  idFrecuencia: number;
  /** nombre_frecuencia */
  nombreFrecuencia: string | null;
  /** id_tipo_de_respaldo */
  idTipoDeRespaldo: number;
  /** nombre_tipo_respaldo */
  nombreTipoRespaldo: string | null;
}

/** Recordset de dbo.sp_autenticar_ciudadano */
export interface SpCiudadanoAutenticadoResultDto {
  /** id_contribuyente */
  idContribuyente: number;
  /** identificacion_oficial */
  identificacionOficial: string | null;
  /** nombre_o_razon_social */
  nombreORazonSocial: string | null;
  /** tipo_persona */
  tipoPersona: string | null;
  /** correo_electronico */
  correoElectronico: string | null;
  /** telefono */
  telefono: string | null;
}

/** Recordset de dbo.sp_consultar_archivos_tramite */
export interface SpArchivoTramiteResultDto {
  /** id_archivo_adjunto */
  idArchivoAdjunto: number;
  /** id_tramite */
  idTramite: number;
  /** nombre_original */
  nombreOriginal: string | null;
  /** ruta_almacenamiento */
  rutaAlmacenamiento: string | null;
  /** peso_bytes */
  pesoBytes: number;
  /** fecha_subida */
  fechaSubida: string;
  /** id_requisito */
  idRequisito: number | null;
  /** nombre_requisito */
  nombreRequisito: string | null;
}

/** Recordset de dbo.sp_consultar_requisitos_tramite */
export interface SpRequisitoTramiteEstadoResultDto {
  /** id_requisito */
  idRequisito: number;
  /** nombre_requisito */
  nombreRequisito: string | null;
  /** descripcion */
  descripcion: string | null;
  /** es_obligatorio */
  esObligatorio: boolean;
  /** presentado */
  presentado: boolean;
  /** cantidad_archivos */
  cantidadArchivos: number;
  /** fecha_ultima_presentacion */
  fechaUltimaPresentacion: string | null;
}

/** Recordset de dbo.sp_consultar_permisos_por_rol */
export interface SpPermisoRolResultDto {
  /** id_permiso */
  idPermiso: number;
  /** modulo */
  modulo: string | null;
  /** accion */
  accion: string | null;
}

/** Recordset de dbo.sp_consultar_asignaciones_roles */
export interface SpAsignacionRolResultDto {
  /** id_usuario */
  idUsuario: number;
  /** user_name */
  userName: string | null;
  /** id_rol */
  idRol: number;
  /** nombre_rol */
  nombreRol: string | null;
}

/** Recordset de dbo.sp_dw_estado */
export interface SpDwEstadoResultDto {
  /** dw_instalado */
  dwInstalado: boolean;
  /** ultima_carga_inicio */
  ultimaCargaInicio: string | null;
  /** ultima_carga_fin */
  ultimaCargaFin: string | null;
  /** ultima_carga_estado */
  ultimaCargaEstado: string | null;
  /** filas_fact_recaudacion */
  filasFactRecaudacion: number;
  /** filas_fact_morosidad */
  filasFactMorosidad: number;
  /** filas_fact_eficiencia */
  filasFactEficiencia: number;
}

/** Recordset de dbo.sp_dw_ejecutar_etl */
export interface SpDwValidacionEtlResultDto {
  /** id_carga */
  idCarga: number;
  /** control */
  control: string | null;
  /** total_oltp */
  totalOltp: number | null;
  /** total_dw */
  totalDw: number | null;
  /** resultado */
  resultado: string | null;
}

/** Recordset de dbo.sp_dw_historial_cargas */
export interface SpDwHistorialCargaResultDto {
  /** id_carga */
  idCarga: number;
  /** fecha_inicio */
  fechaInicio: string;
  /** fecha_fin */
  fechaFin: string | null;
  /** duracion_segundos */
  duracionSegundos: number | null;
  /** estado */
  estado: string | null;
  /** detalle */
  detalle: string | null;
  /** ejecutado_por */
  ejecutadoPor: string | null;
}

/** Recordset de dbo.sp_dw_recaudacion_periodo */
export interface SpDwRecaudacionPeriodoResultDto {
  /** anio */
  anio: number | null;
  /** trimestre */
  trimestre: number | null;
  /** mes */
  mes: number | null;
  /** nombre_mes */
  nombreMes: string | null;
  /** total_recaudado_principal */
  totalRecaudadoPrincipal: number | null;
  /** total_recaudado_intereses */
  totalRecaudadoIntereses: number | null;
  /** total_descuentos_aplicados */
  totalDescuentosAplicados: number | null;
  /** total_recaudado_general */
  totalRecaudadoGeneral: number | null;
  /** transacciones_registradas */
  transaccionesRegistradas: number | null;
}

/** Recordset de dbo.sp_dw_recaudacion_tributo */
export interface SpDwRecaudacionTributoResultDto {
  /** codigo_tributo */
  codigoTributo: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** categoria_tributo */
  categoriaTributo: string | null;
  /** periodicidad */
  periodicidad: string | null;
  /** total_principal */
  totalPrincipal: number | null;
  /** total_intereses */
  totalIntereses: number | null;
  /** total_recaudado */
  totalRecaudado: number | null;
}

/** Recordset de dbo.sp_dw_recaudacion_ubicacion */
export interface SpDwRecaudacionUbicacionResultDto {
  /** distrito */
  distrito: string | null;
  /** zona_rural_urbana */
  zonaRuralUrbana: string | null;
  /** total_principal */
  totalPrincipal: number | null;
  /** total_intereses */
  totalIntereses: number | null;
  /** total_recaudado */
  totalRecaudado: number | null;
  /** total_pagos_distrito */
  totalPagosDistrito: number | null;
}

/** Recordset de dbo.sp_dw_morosidad */
export interface SpDwMorosidadResultDto {
  /** anio */
  anio: number | null;
  /** mes */
  mes: number | null;
  /** nombre_mes */
  nombreMes: string | null;
  /** distrito */
  distrito: string | null;
  /** zona_rural_urbana */
  zonaRuralUrbana: string | null;
  /** nombre_tributo */
  nombreTributo: string | null;
  /** saldo_vencido */
  saldoVencido: number | null;
  /** cantidad_contribuyentes_morosos */
  cantidadContribuyentesMorosos: number | null;
}

/** Recordset de dbo.sp_dw_eficiencia_tramites */
export interface SpDwEficienciaTramitesResultDto {
  /** nombre_tramite */
  nombreTramite: string | null;
  /** plazo_compromiso_sla */
  plazoCompromisoSla: number | null;
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** estado_final */
  estadoFinal: string | null;
  /** dias_promedio_consumidos */
  diasPromedioConsumidos: number | null;
  /** cantidad_tramites */
  cantidadTramites: number | null;
  /** estado_cumplimiento */
  estadoCumplimiento: string | null;
}

/** Recordset de dbo.sp_dw_indicadores_departamento */
export interface SpDwIndicadoresDepartamentoResultDto {
  /** nombre_departamento */
  nombreDepartamento: string | null;
  /** volumen_total_gestionado */
  volumenTotalGestionado: number | null;
  /** promedio_dias_resolucion_area */
  promedioDiasResolucionArea: number | null;
  /** tramites_aprobados */
  tramitesAprobados: number | null;
  /** tramites_rechazados */
  tramitesRechazados: number | null;
}

/** Recordset de dbo.sp_dba_monitor_resumen */
export interface SpDbaMonitorResumenResultDto {
  /** servidor */
  servidor: string | null;
  /** version_motor */
  versionMotor: string | null;
  /** edicion */
  edicion: string | null;
  /** base_datos */
  baseDatos: string | null;
  /** inicio_servicio */
  inicioServicio: string | null;
  /** minutos_activo */
  minutosActivo: number | null;
  /** cpus */
  cpus: number | null;
  /** cpu_sql_pct */
  cpuSqlPct: number | null;
  /** cpu_otros_pct */
  cpuOtrosPct: number | null;
  /** memoria_sql_mb */
  memoriaSqlMb: number | null;
  /** memoria_total_mb */
  memoriaTotalMb: number | null;
  /** memoria_disponible_mb */
  memoriaDisponibleMb: number | null;
  /** memoria_uso_pct */
  memoriaUsoPct: number | null;
  /** conexiones_usuario */
  conexionesUsuario: number | null;
  /** solicitudes_activas */
  solicitudesActivas: number | null;
  /** sesiones_bloqueadas */
  sesionesBloqueadas: number | null;
  /** transacciones_activas */
  transaccionesActivas: number | null;
  /** datos_mb */
  datosMb: number | null;
  /** datos_usado_mb */
  datosUsadoMb: number | null;
  /** log_mb */
  logMb: number | null;
  /** log_usado_pct */
  logUsadoPct: number | null;
  /** ultimo_backup_full */
  ultimoBackupFull: string | null;
  /** ultimo_backup_diferencial */
  ultimoBackupDiferencial: string | null;
}

/** Recordset de dbo.sp_dba_monitor_sesiones */
export interface SpDbaMonitorSesionResultDto {
  /** session_id */
  sessionId: number;
  /** login_name */
  loginName: string | null;
  /** host_name */
  hostName: string | null;
  /** direccion_ip */
  direccionIp: string | null;
  /** programa */
  programa: string | null;
  /** estado */
  estado: string | null;
  /** comando */
  comando: string | null;
  /** base_datos */
  baseDatos: string | null;
  /** tipo_espera */
  tipoEspera: string | null;
  /** bloqueada_por */
  bloqueadaPor: number | null;
  /** es_bloqueante */
  esBloqueante: boolean;
  /** segundos_ejecucion */
  segundosEjecucion: number | null;
  /** consulta_lenta */
  consultaLenta: boolean;
  /** cpu_ms */
  cpuMs: number | null;
  /** lecturas_logicas */
  lecturasLogicas: number | null;
  /** consulta */
  consulta: string | null;
  /** ultima_solicitud */
  ultimaSolicitud: string | null;
  /** es_sesion_actual */
  esSesionActual: boolean;
}

/** Recordset de dbo.sp_dba_monitor_archivos */
export interface SpDbaMonitorArchivoResultDto {
  /** base_datos */
  baseDatos: string | null;
  /** archivo_logico */
  archivoLogico: string | null;
  /** tipo */
  tipo: string | null;
  /** ruta_fisica */
  rutaFisica: string | null;
  /** tamano_mb */
  tamanoMb: number | null;
  /** usado_mb */
  usadoMb: number | null;
  /** maximo_mb */
  maximoMb: number | null;
  /** volumen */
  volumen: string | null;
  /** volumen_total_mb */
  volumenTotalMb: number | null;
  /** volumen_libre_mb */
  volumenLibreMb: number | null;
  /** volumen_libre_pct */
  volumenLibrePct: number | null;
}

/** Recordset de dbo.sp_dba_monitor_fragmentacion */
export interface SpDbaFragmentacionResultDto {
  /** tabla */
  tabla: string | null;
  /** indice */
  indice: string | null;
  /** tipo_indice */
  tipoIndice: string | null;
  /** fragmentacion_pct */
  fragmentacionPct: number | null;
  /** paginas */
  paginas: number | null;
  /** accion_recomendada */
  accionRecomendada: string | null;
}

/** Recordset de dbo.sp_dba_ejecutar_mantenimiento */
export interface SpDbaMantenimientoResultDto {
  /** orden */
  orden: number;
  /** tarea */
  tarea: string | null;
  /** estado */
  estado: string | null;
  /** detalle */
  detalle: string | null;
  /** duracion_segundos */
  duracionSegundos: number | null;
}

/** Recordset de dbo.sp_dba_historial_mantenimiento */
export interface SpDbaHistorialMantenimientoResultDto {
  /** id */
  id: number | null;
  /** base_datos */
  baseDatos: string | null;
  /** objeto */
  objeto: string | null;
  /** indice */
  indice: string | null;
  /** tipo_comando */
  tipoComando: string | null;
  /** comando */
  comando: string | null;
  /** inicio */
  inicio: string | null;
  /** fin */
  fin: string | null;
  /** duracion_segundos */
  duracionSegundos: number | null;
  /** numero_error */
  numeroError: number | null;
  /** mensaje_error */
  mensajeError: string | null;
}
