export interface HaciendaActividadEconomica {
  estado: string;
  tipo: string;
  codigo: string;
  descripcion: string;
}

export interface HaciendaSituacionTributaria {
  moroso: string;
  omiso: string;
  estado: string;
  administracionTributaria: string;
}

export interface HaciendaRegimen {
  codigo: number;
  descripcion: string;
}

export interface HaciendaCedulaRawResponse {
  nombre: string;
  tipoIdentificacion: string;
  regimen?: HaciendaRegimen;
  situacion?: HaciendaSituacionTributaria;
  actividades?: HaciendaActividadEconomica[];
}

export interface HaciendaContribuyenteInfo {
  identificacionLimpia: string;
  nombreCompleto: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  codigoTipoIdentificacion: string;
  idTipoIdentificacionSugerido: number;
  esPersonaJuridica: boolean;
  regimenDescripcion: string;
  estadoTributario: string;
  moroso: boolean;
  omiso: boolean;
  administracionTributaria: string;
  actividades: HaciendaActividadEconomica[];
}

/**
 * Normaliza una cédula eliminando guiones y espacios para consultar el API de Hacienda.
 */
export function limpiarCedulaHacienda(input: string): string {
  return (input || '').replace(/[^0-9A-Za-z]/g, '').trim();
}

/**
 * Separa un nombre completo costarricense devuelto por el Ministerio de Hacienda
 * (formato usual: "NOMBRE1 [NOMBRE2] PRIMER_APELLIDO SEGUNDO_APELLIDO")
 * en { nombre, primerApellido, segundoApellido }.
 */
export function separarNombreCostarricense(nombreCompleto: string): {
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
} {
  const limpio = (nombreCompleto || '').trim().replace(/\s+/g, ' ');
  if (!limpio) {
    return { nombre: '', primerApellido: '', segundoApellido: '' };
  }

  const partes = limpio.split(' ');
  if (partes.length === 1) {
    return { nombre: partes[0], primerApellido: '', segundoApellido: '' };
  }
  if (partes.length === 2) {
    return { nombre: partes[0], primerApellido: partes[1], segundoApellido: '' };
  }

  const segundoApellido = partes[partes.length - 1];
  const primerApellido = partes[partes.length - 2];
  const nombre = partes.slice(0, partes.length - 2).join(' ');

  return {
    nombre,
    primerApellido,
    segundoApellido,
  };
}

/**
 * Consulta en tiempo real la API oficial del Ministerio de Hacienda de Costa Rica:
 * GET https://api.hacienda.go.cr/fe/ae?identificacion={cedula}
 */
export async function consultarCedulaHacienda(
  identificacion: string
): Promise<HaciendaContribuyenteInfo> {
  const clean = limpiarCedulaHacienda(identificacion);
  if (!clean || clean.length < 9) {
    throw new Error(
      'Ingrese un número de cédula válido (mínimo 9 dígitos sin guiones, ej. 508570485 o 3101123456).'
    );
  }

  let data: HaciendaCedulaRawResponse | null = null;

  // Intento 1: Llamada directa al endpoint público oficial del Ministerio de Hacienda
  try {
    const res = await fetch(
      `https://api.hacienda.go.cr/fe/ae?identificacion=${encodeURIComponent(clean)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );
    if (res.ok) {
      data = (await res.json()) as HaciendaCedulaRawResponse;
    } else if (res.status === 400 || res.status === 404) {
      throw new Error(
        `No se encontró ningún contribuyente en el Ministerio de Hacienda con la identificación ${clean}.`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('No se encontró')) {
      throw err;
    }
    // Intento 2: Respaldo vía proxy local Vite (/hacienda-api/fe/ae)
    const proxyRes = await fetch(
      `/hacienda-api/fe/ae?identificacion=${encodeURIComponent(clean)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );
    if (!proxyRes.ok) {
      throw new Error(
        `No fue posible consultar la cédula ${clean} en el Ministerio de Hacienda (HTTP ${proxyRes.status}).`
      );
    }
    data = (await proxyRes.json()) as HaciendaCedulaRawResponse;
  }

  if (!data || !data.nombre) {
    throw new Error(
      `El Ministerio de Hacienda no devolvió datos registrados para la identificación ${clean}.`
    );
  }

  const codigoTipo = data.tipoIdentificacion || (clean.startsWith('3') ? '02' : '01');
  const esJuridica = codigoTipo === '02';
  const idTipoSugerido =
    codigoTipo === '01' ? 1 : codigoTipo === '02' ? 2 : codigoTipo === '03' ? 3 : 4;

  const { nombre, primerApellido, segundoApellido } = esJuridica
    ? { nombre: data.nombre.trim(), primerApellido: '', segundoApellido: '' }
    : separarNombreCostarricense(data.nombre);

  return {
    identificacionLimpia: clean,
    nombreCompleto: data.nombre.trim(),
    nombre,
    primerApellido,
    segundoApellido,
    codigoTipoIdentificacion: codigoTipo,
    idTipoIdentificacionSugerido: idTipoSugerido,
    esPersonaJuridica: esJuridica,
    regimenDescripcion: data.regimen?.descripcion || 'Régimen Tradicional / No especificado',
    estadoTributario: data.situacion?.estado || 'Inscrito',
    moroso: (data.situacion?.moroso || '').toUpperCase() === 'SI',
    omiso: (data.situacion?.omiso || '').toUpperCase() === 'SI',
    administracionTributaria:
      data.situacion?.administracionTributaria?.trim() ||
      'Administración Tributaria de Guanacaste',
    actividades: Array.isArray(data.actividades) ? data.actividades : [],
  };
}

