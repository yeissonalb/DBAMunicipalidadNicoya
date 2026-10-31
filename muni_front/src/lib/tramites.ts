import type { SpEstadosTramiteResultDto } from '@/types/api';

/** Códigos de dbo.Estado_Tramite que cierran el expediente (sp_registrar_resolucion_tramite). */
export const ESTADOS_FINALES = ['APR', 'RECH'] as const;

export function esCodigoFinal(codigo: string | null | undefined): boolean {
  return Boolean(codigo && (ESTADOS_FINALES as readonly string[]).includes(codigo));
}

/**
 * vw_tramites_seguimiento expone el estado vigente por NOMBRE (fn_ultimo_estado_tramite).
 * Se traduce a su código con el catálogo sp_consultar_estados_tramite.
 */
export function codigoEstadoPorNombre(
  nombre: string | null | undefined,
  estados: SpEstadosTramiteResultDto[] | undefined
): string {
  if (!nombre) return 'REC';
  return estados?.find((e) => e.nombreEstado === nombre)?.codigo ?? 'REC';
}

/** Un trámite está cerrado cuando la BD registró su fecha de resolución final. */
export function tramiteCerrado(t: { fechaResolucionFinal: string | null } | null | undefined): boolean {
  return Boolean(t?.fechaResolucionFinal);
}
