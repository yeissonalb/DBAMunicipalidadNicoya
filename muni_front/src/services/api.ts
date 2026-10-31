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
  BaseResponse,
  CalcularRecargosDto,
  CambiarEstadoTramiteDto,
  CambiarEstadoUsuarioDto,
  CatalogoActividadEconomicaDto,
  CatalogoCargoRepresentacionDto,
  CatalogoEstadoAvaluoDto,
  CatalogoEstadoCivilDto,
  CatalogoFormaPredioDto,
  CatalogoGeneroDto,
  CatalogoPeritoDto,
  CatalogoTipoIdentificacionDto,
  CatalogoTopografiaDto,
  CatalogoUbicacionManzanaDto,
  CatalogoZonaHomogeneaDto,
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
  distritos: () =>
    unwrapResponse<SpDistritoResultDto[]>(httpClient.get('/catalogosinmueble/distritos')),
  estadosTramite: async (): Promise<SpEstadosTramiteResultDto[]> => {
    const rows = await unwrapResponse<SpEstadosTramiteResultDto[]>(httpClient.get('/tramite/estados'));
    return rows.map((r) => ({
      ...r,
      idEstado: r.idEstado ?? r.idEstadoTramite,
    }));
  },
  tiposIdentificacion: async (): Promise<CatalogoTipoIdentificacionDto[]> => [
    { idTipoIdentificacion: 1, codigoTipoIdentificacion: 'CED-FIS', descripcion: 'Cédula de Identidad Física' },
    { idTipoIdentificacion: 2, codigoTipoIdentificacion: 'CED-JUR', descripcion: 'Cédula de Persona Jurídica' },
    { idTipoIdentificacion: 3, codigoTipoIdentificacion: 'DIMEX', descripcion: 'DIMEX / Residencia' },
  ],
  generos: async (): Promise<CatalogoGeneroDto[]> => [
    { idGenero: 1, codigoGenero: 'Masculino' },
    { idGenero: 2, codigoGenero: 'Femenino' },
    { idGenero: 3, codigoGenero: 'No especificado' },
  ],
  estadosCiviles: async (): Promise<CatalogoEstadoCivilDto[]> => [
    { idEstadoCivil: 1, codigoEstadoCivil: 'Soltero(a)' },
    { idEstadoCivil: 2, codigoEstadoCivil: 'Casado(a)' },
    { idEstadoCivil: 3, codigoEstadoCivil: 'Divorciado(a)' },
    { idEstadoCivil: 4, codigoEstadoCivil: 'Viudo(a)' },
  ],
  actividadesEconomicas: async (): Promise<CatalogoActividadEconomicaDto[]> => [
    { idActividadEconomica: 1, codigoCiiu: 'G4711', descripcion: 'Comercio al por menor y servicios comerciales' },
    { idActividadEconomica: 2, codigoCiiu: 'I5510', descripcion: 'Hotelería, turismo y hospedaje costero' },
    { idActividadEconomica: 3, codigoCiiu: 'A0111', descripcion: 'Producción agropecuaria y agroindustrial' },
    { idActividadEconomica: 4, codigoCiiu: 'F4100', descripcion: 'Construcción y desarrollo inmobiliario' },
  ],
  cargosRepresentacion: async (): Promise<CatalogoCargoRepresentacionDto[]> => [
    { idCargoRepresentacion: 1, nombreCargo: 'Presidente con Facultades de Apoderado Generalísimo' },
    { idCargoRepresentacion: 2, nombreCargo: 'Gerente General / Representante Judicial y Extrajudicial' },
    { idCargoRepresentacion: 3, nombreCargo: 'Apoderado Especial Municipal' },
  ],
};

// ============================================================================
// 3. UsuarioController (/api/usuario)
// ============================================================================
function normalizeUsuario(u: SpConsultarUsuarioResultDto): SpConsultarUsuarioResultDto {
  const full = [u.nombreUsuario, u.apellido1Usuario, u.apellido2Usuario]
    .filter(Boolean)
    .join(' ')
    .trim();
  return {
    ...u,
    nombreFuncionario: u.nombreFuncionario || full || u.userName,
  };
}

export const usuarioApi = {
  consultar: async (userName?: string): Promise<SpConsultarUsuarioResultDto[]> => {
    const list = await unwrapResponse<SpConsultarUsuarioResultDto[]>(
      httpClient.get('/usuario', { params: userName ? { userName } : undefined })
    );
    return list.map(normalizeUsuario);
  },
  listar: async (userName?: string): Promise<SpConsultarUsuarioResultDto[]> => {
    return usuarioApi.consultar(userName);
  },
  registrar: (dto: RegistrarUsuarioDto) => {
    const parts = (dto.nombreFuncionario || '').trim().split(/\s+/);
    const payload = {
      userName: dto.userName,
      password: dto.password || dto.passwordTextoPlano || 'Nicoya2026!',
      nombreUsuario: dto.nombreUsuario || parts[0] || dto.userName,
      apellido1Usuario: dto.apellido1Usuario || parts[1] || 'Municipal',
      apellido2Usuario: dto.apellido2Usuario || parts.slice(2).join(' ') || 'Nicoya',
      emailUsuario: dto.emailUsuario || `${dto.userName}@nicoya.go.cr`,
      idDepartamento: dto.idDepartamento,
    };
    return unwrapFullResponse<number>(httpClient.post('/usuario', payload));
  },
  actualizar: (idUsuario: number, dto: ActualizarUsuarioDto) => {
    const parts = (dto.nombreFuncionario || '').trim().split(/\s+/);
    const payload = {
      nombreUsuario: dto.nombreUsuario || parts[0] || 'Funcionario',
      apellido1Usuario: dto.apellido1Usuario || parts[1] || 'Municipal',
      apellido2Usuario: dto.apellido2Usuario || parts.slice(2).join(' ') || 'Nicoya',
      emailUsuario: dto.emailUsuario || `funcionario${idUsuario}@nicoya.go.cr`,
      idDepartamento: dto.idDepartamento,
    };
    return unwrapFullResponse<unknown>(httpClient.put(`/usuario/${idUsuario}`, payload));
  },
  cambiarEstado: (idUsuario: number, dto: CambiarEstadoUsuarioDto) =>
    unwrapFullResponse<unknown>(httpClient.patch(`/usuario/${idUsuario}/estado`, dto)),
};

// ============================================================================
// 4. RolPermisoController (/api/rolpermiso)
// ============================================================================
export const rolPermisoApi = {
  matriz: () => unwrapResponse<VwUsuariosRolesPermiso[]>(httpClient.get('/rolpermiso/matriz')),
  listarRoles: () => unwrapResponse<SpRolResultDto[]>(httpClient.get('/rolpermiso/roles')),
  roles: () => unwrapResponse<SpRolResultDto[]>(httpClient.get('/rolpermiso/roles')),
  listarPermisos: () =>
    unwrapResponse<SpPermisoResultDto[]>(httpClient.get('/rolpermiso/permisos')),
  permisos: () =>
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
};

// ============================================================================
// 5. ContribuyenteController (/api/contribuyente)
// ============================================================================
function normalizePadronRow(r: VwPadronContribuyente): VwPadronContribuyente {
  return {
    ...r,
    identificacion: r.identificacion ?? '',
    nombreCompletoORazonSocial: r.nombreCompletoORazonSocial ?? 'Contribuyente Municipal',
    tipoPersona: r.tipoPersona || r.tipoContribuyente || 'Física',
    nombreDistrito: r.nombreDistrito || 'Nicoya',
    direccionExacta: r.direccionExacta || r.direccionNotificaciones || '',
    activo: r.activo ?? r.estadoContribuyente ?? true,
  };
}

export const contribuyenteApi = {
  padron: async (): Promise<VwPadronContribuyente[]> => {
    const rows = await unwrapResponse<VwPadronContribuyente[]>(httpClient.get('/contribuyente'));
    return rows.map(normalizePadronRow);
  },
  buscar: (criterio?: string) =>
    unwrapResponse<SpConsultarContribuyenteResultDto[]>(
      httpClient.get('/contribuyente/buscar', { params: criterio ? { criterio } : undefined })
    ),
  consultar: async (idContribuyente?: number): Promise<SpConsultarContribuyenteResultDto[]> => {
    const rows = await unwrapResponse<SpConsultarContribuyenteResultDto[]>(
      httpClient.get('/contribuyente/buscar')
    );
    const mapped = rows.map((r) => ({
      ...r,
      identificacion: r.identificacion ?? '',
      nombreORazonSocial: r.nombreORazonSocial ?? 'Contribuyente',
      nombreCompleto: r.nombreCompleto || r.nombreORazonSocial || 'Contribuyente',
      distrito: r.distrito || 'Nicoya',
    }));
    if (idContribuyente) {
      const filtered = mapped.filter((x) => x.idContribuyente === idContribuyente);
      return filtered.length > 0 ? filtered : mapped;
    }
    return mapped;
  },
  registrarFisico: (dto: RegistrarContribuyenteFisicoDto) => {
    const payload = {
      cedulaIdentidad: dto.cedulaIdentidad || dto.identificacion || '',
      nombre: dto.nombre,
      apellido1Fisico: dto.apellido1Fisico || dto.primerApellido || '',
      apellido2Fisico: dto.apellido2Fisico || dto.segundoApellido || '',
      fechaNacimiento: dto.fechaNacimiento || dto.fechaDeNacimiento || '1990-01-01',
      correoElectronico: dto.correoElectronico,
      telefono: dto.telefono,
      direccionNotificaciones: dto.direccionNotificaciones || dto.direccionExacta || '',
    };
    return unwrapFullResponse<number>(httpClient.post('/contribuyente/fisico', payload));
  },
  registrarPersonaFisica: (dto: RegistrarContribuyenteFisicoDto) =>
    contribuyenteApi.registrarFisico(dto),
  registrarJuridico: (dto: RegistrarContribuyenteJuridicoDto) => {
    const payload = {
      cedulaJuridica: dto.cedulaJuridica || dto.identificacion || '',
      razonSocial: dto.razonSocial,
      nombreFantasia: dto.nombreFantasia || dto.nombreComercial || dto.razonSocial,
      fechaConstitucion: dto.fechaConstitucion || dto.fechaDeConstitucion || '2020-01-01',
      correoElectronico: dto.correoElectronico,
      telefono: dto.telefono,
      direccionNotificaciones: dto.direccionNotificaciones || dto.direccionExacta || '',
    };
    return unwrapFullResponse<number>(httpClient.post('/contribuyente/juridico', payload));
  },
  registrarPersonaJuridica: (dto: RegistrarContribuyenteJuridicoDto) =>
    contribuyenteApi.registrarJuridico(dto),
  actualizar: (idContribuyente: number, dto: ActualizarContribuyenteDto) => {
    const payload = {
      correoElectronico: dto.correoElectronico,
      telefono: dto.telefono,
      direccionNotificaciones: dto.direccionNotificaciones || dto.direccionExacta || '',
      estadoContribuyente: dto.estadoContribuyente ?? dto.activo ?? true,
    };
    return unwrapFullResponse<unknown>(httpClient.put(`/contribuyente/${idContribuyente}`, payload));
  },
  registrarRepresentanteLegal: (
    idOrDto: number | RegistrarRepresentanteLegalDto,
    maybeDto?: RegistrarRepresentanteLegalDto
  ) => {
    const idContribuyente =
      typeof idOrDto === 'number' ? idOrDto : idOrDto.idPersonaJuridica || 1;
    const dto = (typeof idOrDto === 'number' ? maybeDto : idOrDto) ?? {};
    const payload = {
      nombreRepresentante: dto.nombreRepresentante || 'Representante',
      apellido1Representante: dto.apellido1Representante || 'Legal',
      apellido2Representante: dto.apellido2Representante || 'Autorizado',
      tomoFolioRegistro: dto.tomoFolioRegistro || `TOMO-2026-${dto.idCargoRepresentacion || 1}`,
      cedulaRepresentante: dto.cedulaRepresentante || `1-0${dto.idPersonaFisica || 1}00-0100`,
      fechaVencimientoPoder: dto.fechaVencimientoPoder || dto.fechaFin || '2028-12-31',
    };
    return unwrapFullResponse<unknown>(
      httpClient.post(`/contribuyente/${idContribuyente}/representante-legal`, payload)
    );
  },
};

// ============================================================================
// 6. InmuebleController (/api/inmueble) y CatalogosInmuebleController
// ============================================================================
function normalizeInmuebleRow(r: VwInmueblesPropietario): VwInmueblesPropietario {
  return {
    ...r,
    planoCatastro: r.planoCatastro || r.planoCatastrado || '',
    areaMetros: r.areaMetros ?? r.areaTerrenoM2 ?? 0,
    usoSuelo: r.usoSuelo || r.tipoUso || 'Residencial',
    zonaHomogenea: r.zonaHomogenea || 'Zona Urbana Nicoya',
    propietarios: r.propietarios || r.propietario || 'Sin propietarios asociados',
    porcentajeTotalRegistrado: r.porcentajeTotalRegistrado ?? r.porcentajeParticipacion ?? 100,
    inmuebleActivo: r.inmuebleActivo ?? true,
  };
}

export const inmuebleApi = {
  listarConPropietarios: async (): Promise<VwInmueblesPropietario[]> => {
    const rows = await unwrapResponse<VwInmueblesPropietario[]>(httpClient.get('/inmueble'));
    return rows.map(normalizeInmuebleRow);
  },
  catastro: async (): Promise<VwInmueblesPropietario[]> => {
    return inmuebleApi.listarConPropietarios();
  },
  buscar: (numeroFinca?: string, idDistrito?: number) =>
    unwrapResponse<SpConsultarInmuebleResultDto[]>(
      httpClient.get('/inmueble/buscar', {
        params: {
          ...(numeroFinca ? { numeroFinca } : {}),
          ...(idDistrito ? { idDistrito } : {}),
        },
      })
    ),
  registrar: (dto: RegistrarInmuebleDto) => {
    const payload = {
      numeroFinca: dto.numeroFinca,
      direccionExacta: dto.direccionExacta || 'Cantón de Nicoya, Guanacaste',
      areaTerrenoM2: dto.areaTerrenoM2 ?? dto.areaMetros ?? 250,
      areaConstruccionM2: dto.areaConstruccionM2 ?? 120,
      valorFiscal: dto.valorFiscal,
      planoCatastrado: dto.planoCatastrado || dto.planoCatastro || 'G-000000-2026',
      idTipoUsoInmueble: dto.idTipoUsoInmueble ?? dto.idUsoSuelo ?? 1,
      idDistrito: dto.idDistrito,
    };
    return unwrapFullResponse<number>(httpClient.post('/inmueble', payload));
  },
  actualizar: (idInmueble: number, dto: ActualizarInmuebleDto) => {
    const payload = {
      direccionExacta: dto.direccionExacta || 'Cantón de Nicoya, Guanacaste',
      areaTerrenoM2: dto.areaTerrenoM2 ?? dto.areaMetros ?? 250,
      areaConstruccionM2: dto.areaConstruccionM2 ?? 120,
      valorFiscal: dto.valorFiscal,
      planoCatastrado: dto.planoCatastrado || 'G-000000-2026',
      idTipoUsoInmueble: dto.idTipoUsoInmueble ?? dto.idUsoSuelo ?? 1,
    };
    return unwrapFullResponse<unknown>(httpClient.put(`/inmueble/${idInmueble}`, payload));
  },
  asignarDerecho: (idInmueble: number, dto: AsignarDerechoInmuebleDto) =>
    unwrapFullResponse<unknown>(httpClient.post(`/inmueble/${idInmueble}/derechos`, dto)),
  asociarPropietario: (idInmueble: number, dto: AsignarDerechoInmuebleDto) =>
    unwrapFullResponse<unknown>(httpClient.post(`/inmueble/${idInmueble}/derechos`, dto)),
  registrarAvaluo: async (
    idInmueble: number,
    dto: { valorTerreno: number; valorConstruccion: number }
  ): Promise<BaseResponse<number>> => {
    const nuevoValorFiscal = (dto.valorTerreno || 0) + (dto.valorConstruccion || 0);
    await inmuebleApi.actualizar(idInmueble, {
      valorFiscal: nuevoValorFiscal,
    });
    return {
      success: true,
      message: 'Avalúo pericial registrado y valor fiscal actualizado.',
      data: idInmueble,
    };
  },
  porContribuyente: async (idContribuyente: number): Promise<SpInmueblesPorContribuyenteResultDto[]> => {
    const rows = await unwrapResponse<SpInmueblesPorContribuyenteResultDto[]>(
      httpClient.get(`/inmueble/contribuyente/${idContribuyente}`)
    );
    return rows.map((r) => ({
      ...r,
      planoCatastro: r.planoCatastro || r.planoCatastrado || '',
      descripcionUso: r.descripcionUso || r.tipoUso || 'Residencial',
      areaMetros: r.areaMetros ?? 250,
    }));
  },
};

export const catalogosInmuebleApi = {
  distritos: () =>
    unwrapResponse<SpDistritoResultDto[]>(httpClient.get('/catalogosinmueble/distritos')),
  tiposUso: async (): Promise<SpTipoUsoInmuebleResultDto[]> => {
    const rows = await unwrapResponse<SpTipoUsoInmuebleResultDto[]>(
      httpClient.get('/catalogosinmueble/tipos-uso')
    );
    return rows.map((r) => ({
      ...r,
      idUsoSuelo: r.idUsoSuelo ?? r.idTipoUsoInmueble,
      codigoUso: r.codigoUso || r.codigoTipoUso,
      descripcion: r.descripcion || r.descripcionUso,
    }));
  },
  usosSuelo: () => catalogosInmuebleApi.tiposUso(),
  zonasHomogeneas: async (): Promise<CatalogoZonaHomogeneaDto[]> => [
    { idZonaHomogenea: 1, nombreZona: 'Zona Central Urbana Nicoya', valorBaseMetro: 85000 },
    { idZonaHomogenea: 2, nombreZona: 'Zona Turística Costera (Sámara / Nosara)', valorBaseMetro: 195000 },
    { idZonaHomogenea: 3, nombreZona: 'Zona Residencial en Desarrollo', valorBaseMetro: 48000 },
    { idZonaHomogenea: 4, nombreZona: 'Zona Rural Agropecuaria', valorBaseMetro: 15000 },
  ],
  topografias: async (): Promise<CatalogoTopografiaDto[]> => [
    { idTopografia: 1, codigoTopografia: 'PLANA (A Nivel)', factorCorreccion: 1.0 },
    { idTopografia: 2, codigoTopografia: 'ONDULADA SUAVE', factorCorreccion: 0.92 },
    { idTopografia: 3, codigoTopografia: 'QUEBRADA / PENDIENTE', factorCorreccion: 0.78 },
  ],
  formasPredio: async (): Promise<CatalogoFormaPredioDto[]> => [
    { idFormaPredio: 1, codigoForma: 'REGULAR (Rectangular)', factorCorreccion: 1.0 },
    { idFormaPredio: 2, codigoForma: 'IRREGULAR', factorCorreccion: 0.88 },
  ],
  ubicacionesManzana: async (): Promise<CatalogoUbicacionManzanaDto[]> => [
    { idUbicacionManzana: 1, codigoUbicacion: 'ESQUINERO', factorCorreccion: 1.15 },
    { idUbicacionManzana: 2, codigoUbicacion: 'MEDIANERO (Frente a vía pública)', factorCorreccion: 1.0 },
    { idUbicacionManzana: 3, codigoUbicacion: 'INTERIOR / SERVIDUMBRE', factorCorreccion: 0.82 },
  ],
  peritos: async (): Promise<CatalogoPeritoDto[]> => [
    { idPerito: 1, codigoCarné: 'CFIA-18420', nombreCompleto: 'Ing. Roberto Brenes Mora', especialidad: 'Valuación Urbana y Comercial' },
    { idPerito: 2, codigoCarné: 'CFIA-22910', nombreCompleto: 'Arq. Laura Carrillo Solís', especialidad: 'Bienes Costeros y Residenciales' },
  ],
  estadosAvaluo: async (): Promise<CatalogoEstadoAvaluoDto[]> => [
    { idEstadoAvaluo: 1, codigoEstado: 'APROBADO Y EN FIRME' },
    { idEstadoAvaluo: 2, codigoEstado: 'EN REVISIÓN TÉCNICA' },
  ],
};

// ============================================================================
// 7. TipoTramiteController (/api/tipotramite)
// ============================================================================
function normalizeTipoTramite(t: SpTiposTramiteResultDto): SpTiposTramiteResultDto {
  return {
    ...t,
    descripcion: t.descripcion || t.descripcionTipo || '',
    diasSlaMaximo: t.diasSlaMaximo ?? t.diasResolucionMax ?? 10,
    codigoDepartamento: t.codigoDepartamento || 'MUNI',
  };
}

export const tipoTramiteApi = {
  consultar: async (): Promise<SpTiposTramiteResultDto[]> => {
    const rows = await unwrapResponse<SpTiposTramiteResultDto[]>(httpClient.get('/tipotramite'));
    return rows.map(normalizeTipoTramite);
  },
  listar: async (): Promise<SpTiposTramiteResultDto[]> => {
    return tipoTramiteApi.consultar();
  },
  registrar: (dto: TipoTramiteDto) => {
    const payload = {
      nombreTramite: dto.nombreTramite,
      descripcionTipo: dto.descripcionTipo || dto.descripcion || '',
      diasResolucionMax: dto.diasResolucionMax ?? dto.diasSlaMaximo ?? 10,
      idDepartamento: dto.idDepartamento,
    };
    return unwrapFullResponse<number>(httpClient.post('/tipotramite', payload));
  },
  actualizar: (idTipoTramite: number, dto: TipoTramiteDto) => {
    const payload = {
      nombreTramite: dto.nombreTramite,
      descripcionTipo: dto.descripcionTipo || dto.descripcion || '',
      diasResolucionMax: dto.diasResolucionMax ?? dto.diasSlaMaximo ?? 10,
      idDepartamento: dto.idDepartamento,
    };
    return unwrapFullResponse<unknown>(httpClient.put(`/tipotramite/${idTipoTramite}`, payload));
  },
  catalogoRequisitos: () =>
    unwrapResponse<SpRequisitoResultDto[]>(httpClient.get('/tipotramite/requisitos')),
  registrarRequisito: async (
    idOrDto: number | RegistrarRequisitoDto,
    maybeDto?: RegistrarRequisitoDto
  ): Promise<BaseResponse<number>> => {
    const dto = (typeof idOrDto === 'number' ? maybeDto : idOrDto) ?? {
      nombreRequisito: 'Requisito Documental',
      esObligatorio: true,
    };
    const res = await unwrapFullResponse<number>(
      httpClient.post('/tipotramite/requisito', {
        nombreRequisito: dto.nombreRequisito,
        descripcion: dto.descripcion || dto.nombreRequisito,
        esObligatorio: dto.esObligatorio,
      })
    );
    if (typeof idOrDto === 'number' && res.data) {
      try {
        await tipoTramiteApi.configurarRequisito(idOrDto, res.data);
      } catch {
        // continuar si ya estaba vinculado
      }
    }
    return res;
  },
  configurarRequisito: (idTipoTramite: number, idRequisito: number) =>
    unwrapFullResponse<unknown>(
      httpClient.post(`/tipotramite/${idTipoTramite}/requisitos/${idRequisito}`)
    ),
  requisitosPorTipo: (idTipoTramite: number) =>
    unwrapResponse<SpRequisitosTramiteResultDto[]>(
      httpClient.get(`/tipotramite/${idTipoTramite}/requisitos`)
    ),
  requisitos: (idTipoTramite: number) =>
    unwrapResponse<SpRequisitosTramiteResultDto[]>(
      httpClient.get(`/tipotramite/${idTipoTramite}/requisitos`)
    ),
};

// ============================================================================
// 8. TramiteController (/api/tramite)
// ============================================================================
const ESTADO_ID_TO_CODE: Record<number, string> = {
  1: 'RAD',
  2: 'INSP',
  3: 'REV',
  4: 'APR',
  5: 'RECH',
};

export const tramiteApi = {
  seguimiento: async (): Promise<VwTramitesSeguimiento[]> => {
    const rows = await unwrapResponse<VwTramitesSeguimiento[]>(httpClient.get('/tramite'));
    return rows.map((r) => ({
      ...r,
      diasSlaMaximo: r.diasSlaMaximo ?? r.diasResolucionMax ?? 10,
      estadoActual: r.estadoActual || r.nombreEstado || r.codigoEstado || 'Radicado',
      contribuyente: r.contribuyente || 'Ciudadano Contribuyente',
    }));
  },
  consultar: async (idTramite?: number): Promise<VwTramitesSeguimiento[]> => {
    const all = await tramiteApi.seguimiento();
    if (idTramite) {
      const match = all.filter((x) => x.idTramite === idTramite);
      return match.length > 0 ? match : all.slice(0, 1);
    }
    return all;
  },
  historialDetallado: () =>
    unwrapResponse<VwHistorialTramitesDetallado[]>(httpClient.get('/tramite/historial-detallado')),
  buscar: async (numeroExpediente?: string, idContribuyente?: number) => {
    const rows = await unwrapResponse<SpConsultarTramiteResultDto[]>(
      httpClient.get('/tramite/buscar', {
        params: {
          ...(numeroExpediente ? { numeroExpediente } : {}),
          ...(idContribuyente ? { idContribuyente } : {}),
        },
      })
    );
    return rows.map((r) => ({
      ...r,
      diasSlaMaximo: r.diasSlaMaximo ?? r.diasResolucionMax ?? 10,
      estadoActual: r.estadoActual || r.ultimoEstado || 'Radicado',
      contribuyente: r.contribuyente || `Contribuyente #${r.idContribuyente}`,
    }));
  },
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
  adjuntarDocumento: async (
    idTramite: number,
    meta: { nombreArchivo: string; rutaAlmacenamiento?: string; tipoMime?: string; tamanoBytes?: number }
  ): Promise<BaseResponse<ArchivoAdjuntadoDto>> => {
    const blob = new Blob([`Documento digital SIGEMUN: ${meta.nombreArchivo}`], {
      type: meta.tipoMime || 'application/pdf',
    });
    const file = new File([blob], meta.nombreArchivo, {
      type: meta.tipoMime || 'application/pdf',
    });
    return tramiteApi.adjuntarArchivo(idTramite, file);
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
  verificarRequisito: async (
    idTramite: number,
    dto: { idRequisito: number; cumplido: boolean }
  ): Promise<BaseResponse<unknown>> => {
    const blob = new Blob([`Requisito #${dto.idRequisito} verificado=${dto.cumplido}`], {
      type: 'application/pdf',
    });
    const file = new File([blob], `requisito_${dto.idRequisito}.pdf`, {
      type: 'application/pdf',
    });
    return tramiteApi.requisitoPresentado(idTramite, dto.idRequisito, file);
  },
  cambiarEstado: (idTramite: number, dto: CambiarEstadoTramiteDto) => {
    const codigoEstado =
      dto.codigoEstado || (dto.idEstado ? ESTADO_ID_TO_CODE[dto.idEstado] : undefined) || 'REV';
    const observaciones = dto.observaciones || dto.observacion || 'Actualización técnica';
    return unwrapFullResponse<unknown>(
      httpClient.post(`/tramite/${idTramite}/estado`, { codigoEstado, observaciones })
    );
  },
  registrarInspeccion: async (
    idTramite: number,
    dto: { fechaInspeccion: string; resultado: string; coordenadaLat: number; coordenadaLon: number }
  ): Promise<BaseResponse<number>> => {
    await tramiteApi.cambiarEstado(idTramite, {
      codigoEstado: 'INSP',
      observaciones: `Inspección de campo (${dto.fechaInspeccion}) [${dto.coordenadaLat}, ${dto.coordenadaLon}]: ${dto.resultado}`,
    });
    return {
      success: true,
      message: 'Inspección técnica registrada en el expediente.',
      data: idTramite,
    };
  },
  estados: async (): Promise<SpEstadosTramiteResultDto[]> => {
    const rows = await unwrapResponse<SpEstadosTramiteResultDto[]>(httpClient.get('/tramite/estados'));
    return rows.map((r) => ({
      ...r,
      idEstado: r.idEstado ?? r.idEstadoTramite,
    }));
  },
  historial: (idTramite: number) =>
    unwrapResponse<SpHistorialTramiteResultDto[]>(httpClient.get(`/tramite/${idTramite}/historial`)),
  resolucion: (idTramite: number, dto: ResolucionTramiteDto) => {
    const codigoEstado: 'APR' | 'RECH' =
      dto.codigoEstado ||
      (dto.tipoResolucion?.toUpperCase().includes('RECH') ? 'RECH' : 'APR');
    const observaciones =
      dto.observaciones ||
      `${dto.numeroResolucion ? `[${dto.numeroResolucion}] ` : ''}${dto.detalleResolucion || 'Resolución emitida'}`;
    return unwrapFullResponse<unknown>(
      httpClient.post(`/tramite/${idTramite}/resolucion`, { codigoEstado, observaciones })
    );
  },
  emitirResolucion: async (
    idTramite: number,
    dto: ResolucionTramiteDto
  ): Promise<BaseResponse<number>> => {
    await tramiteApi.resolucion(idTramite, dto);
    return {
      success: true,
      message: 'Resolución administrativa emitida exitosamente.',
      data: idTramite,
    };
  },
  porContribuyente: (idContribuyente: number) =>
    unwrapResponse<SpTramitesPorContribuyenteResultDto[]>(
      httpClient.get(`/tramite/contribuyente/${idContribuyente}`)
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
