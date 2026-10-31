import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileCheck,
  Gavel,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
} from 'lucide-react';
import { tramiteApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { formatBytes, formatDate } from '@/lib/utils';
import { BACKEND_ORIGIN } from '@/services/httpClient';
import { codigoEstadoPorNombre, esCodigoFinal, tramiteCerrado } from '@/lib/tramites';

export function RevisionExpedientePage() {
  const queryClient = useQueryClient();
  const [selectedTramiteId, setSelectedTramiteId] = useState<number | null>(null);
  const [codigoEstadoNuevo, setCodigoEstadoNuevo] = useState<string>('REV');
  const [observacionesEstado, setObservacionesEstado] = useState<string>('');

  // Modal de resolución final (APR / RECH)
  const [openResolucionModal, setOpenResolucionModal] = useState(false);
  const [resolucionTipo, setResolucionTipo] = useState<'APR' | 'RECH'>('APR');
  const [observacionesResolucion, setObservacionesResolucion] = useState('');

  const tramitesQuery = useQuery({
    queryKey: ['tramites', 'seguimiento'],
    queryFn: () => tramiteApi.seguimiento(),
  });

  const estadosQuery = useQuery({
    queryKey: ['tramites', 'estados'],
    queryFn: () => tramiteApi.estados(),
  });

  const activeTramite =
    tramitesQuery.data?.find((t) => t.idTramite === selectedTramiteId) ??
    tramitesQuery.data?.[0] ??
    null;

  // Requisitos del tipo de trámite con el indicador de presentación (sp_consultar_requisitos_tramite)
  const requisitosQuery = useQuery({
    queryKey: ['tramites', 'requisitos-estado', activeTramite?.idTramite],
    queryFn: () => tramiteApi.requisitosEstado(activeTramite!.idTramite),
    enabled: Boolean(activeTramite?.idTramite),
  });

  // Todos los documentos del expediente, incluidos los de sesiones anteriores (sp_consultar_archivos_tramite)
  const archivosQuery = useQuery({
    queryKey: ['tramites', 'archivos', activeTramite?.idTramite],
    queryFn: () => tramiteApi.archivos(activeTramite!.idTramite),
    enabled: Boolean(activeTramite?.idTramite),
  });

  const codigoActual = codigoEstadoPorNombre(activeTramite?.estadoActual, estadosQuery.data);
  const cerrado = tramiteCerrado(activeTramite);

  const historialQuery = useQuery({
    queryKey: ['tramites', 'historial', activeTramite?.idTramite],
    queryFn: () => tramiteApi.historial(activeTramite!.idTramite),
    enabled: Boolean(activeTramite?.idTramite),
  });

  const cambiarEstadoMut = useMutation({
    mutationFn: () => {
      if (!activeTramite) throw new Error('Seleccione un expediente.');
      if (!observacionesEstado.trim()) {
        throw new Error('Ingrese las observaciones técnicas del cambio de estado.');
      }
      return tramiteApi.cambiarEstado(activeTramite.idTramite, {
        codigoEstado: codigoEstadoNuevo,
        observaciones: observacionesEstado.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Estado del trámite actualizado.');
      setObservacionesEstado('');
      queryClient.invalidateQueries({ queryKey: ['tramites'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resolucionMut = useMutation({
    mutationFn: () => {
      if (!activeTramite) throw new Error('Seleccione un expediente.');
      if (!observacionesResolucion.trim()) {
        throw new Error('Ingrese la fundamentación técnica/legal de la resolución.');
      }
      return tramiteApi.resolucion(activeTramite.idTramite, {
        codigoEstado: resolucionTipo,
        observaciones: observacionesResolucion.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Resolución final registrada y expediente cerrado.');
      setOpenResolucionModal(false);
      setObservacionesResolucion('');
      queryClient.invalidateQueries({ queryKey: ['tramites'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleUploadRequisito = async (idRequisito: number, file: File) => {
    if (!activeTramite) return;
    try {
      const res = await tramiteApi.requisitoPresentado(activeTramite.idTramite, idRequisito, file);
      toast.success(`${res.message} (${res.data.nombreOriginal})`);
      queryClient.invalidateQueries({ queryKey: ['tramites'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al acreditar requisito.');
    }
  };

  if (tramitesQuery.isLoading) {
    return <LoadingState message="Cargando bandeja de revisión de expedientes..." />;
  }

  if (tramitesQuery.isError) {
    return <ErrorState error={tramitesQuery.error} onRetry={() => tramitesQuery.refetch()} />;
  }

  if (!tramitesQuery.data || tramitesQuery.data.length === 0) {
    return (
      <EmptyState
        title="No hay expedientes registrados"
        description="Radique un nuevo expediente desde el módulo de Radicación de Trámites."
      />
    );
  }

  const slaRestante = activeTramite?.diasRestantesSla ?? 0;

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Revisión y resolución de expedientes"
        subtitle={activeTramite
          ? `${activeTramite.numeroExpediente} · ${activeTramite.nombreTramite}`
          : 'Seleccione un expediente para comenzar la revisión.'}
        badge={activeTramite?.estadoActual || 'En revisión'}
        icon={<ClipboardCheck className="h-6 w-6" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tramites'] })}
          >
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
        }
      />

      {/* Selector de Expediente y Resumen Superior del Wireframe 9 */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
          <CardTitle className="text-base">Expediente en revisión</CardTitle>
          <CardDescription>Seleccione un elemento de la bandeja para consultar su información y continuar la gestión.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-4">
              <label className="mb-2 block text-sm font-semibold text-sigemun-text">
                Seleccionar expediente
              </label>
              <Select
                value={activeTramite?.idTramite ?? ''}
                onChange={(e) => setSelectedTramiteId(Number(e.target.value))}
              >
                {tramitesQuery.data.map((t) => (
                  <option key={t.idTramite} value={t.idTramite}>
                    {t.numeroExpediente} · {t.nombreTramite} ({t.estadoActual || 'Recibido'})
                  </option>
                ))}
              </Select>
            </div>

            {activeTramite && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-8">
                <div className="rounded-xl border border-sigemun-border bg-sigemun-bg p-4">
                  <p className="section-label">Contribuyente</p>
                  <p className="mt-1.5 truncate text-sm font-bold text-sigemun-text">
                    {activeTramite.solicitante || `ID #${activeTramite.idContribuyente}`}
                  </p>
                </div>
                <div className="rounded-xl border border-sigemun-border bg-sigemun-bg p-4">
                  <p className="section-label">Finca asociada</p>
                  <p className="mt-1.5 font-mono text-sm font-bold text-sigemun-primary">
                    {activeTramite.numeroFinca || 'No aplica'}
                  </p>
                </div>
                <div className="rounded-xl border border-sigemun-border bg-sigemun-bg p-4">
                  <p className="section-label">Estado actual</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge
                      variant={
                        codigoActual === 'APR'
                          ? 'success'
                          : codigoActual === 'RECH'
                          ? 'danger'
                          : 'accent'
                      }
                    >
                      {codigoActual} — {activeTramite.estadoActual}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-xl border border-sigemun-border bg-sigemun-bg p-4">
                  <p className="section-label">Plazo de atención</p>
                  <p
                    className={`mt-0.5 text-xs font-bold ${
                      slaRestante < 0 ? 'text-red-600' : 'text-sigemun-primary'
                    }`}
                  >
                    <Clock className="mr-1 inline h-3.5 w-3.5" />
                    {slaRestante >= 0
                      ? `${slaRestante} días restantes (de ${activeTramite.diasResolucionMax})`
                      : `Vencido por ${Math.abs(slaRestante)} días`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/*Dos Columnas del Wireframe 9: Izquierda Requisitos e Historial, Derecha Acción Operativa */}
      {activeTramite && (
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '2rem' }}>
          {/* Izquierda (7 cols): Lista de Chequeo de Requisitos y Bitácora */}
          <div className="contents">
            <Card className="order-1 h-full overflow-hidden lg:col-start-1 lg:row-start-1">
              <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-sigemun-primary" /> Verificación de Requisitos del
                  Expediente
                </CardTitle>
                <CardDescription>
                  Departamento: {activeTramite.nombreDepartamento} · Funcionario asignado:{' '}
                  <strong>{activeTramite.funcionarioAnalista}</strong> · Radicación:{' '}
                  {formatDate(activeTramite.fechaRadicacion)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6 sm:pt-6">
                {!requisitosQuery.data || requisitosQuery.data.length === 0 ? (
                  <p className="text-xs text-sigemun-muted">
                    No hay requisitos parametrizados para este tipo de trámite.
                  </p>
                ) : (
                  requisitosQuery.data.map((req) => (
                    <div
                      key={req.idRequisito}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-sigemun-border bg-sigemun-bg/50 p-3.5 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-sigemun-text">
                            #{req.idRequisito} · {req.nombreRequisito}
                          </span>
                          <Badge variant={req.esObligatorio ? 'accent' : 'outline'}>
                            {req.esObligatorio ? 'Obligatorio' : 'Opcional'}
                          </Badge>
                          <Badge variant={req.presentado ? 'success' : 'warning'}>
                            {req.presentado
                              ? `Presentado (${req.cantidadArchivos})`
                              : 'Pendiente'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-sigemun-muted">{req.descripcion}</p>
                      </div>

                      <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-sigemun-primary bg-white px-3 py-1.5 text-xs font-semibold text-sigemun-primary hover:bg-sigemun-sky-muted">
                        <Upload className="h-3.5 w-3.5" /> Acreditar Archivo
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadRequisito(req.idRequisito, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  ))
                )}

                <div className="border-t border-sigemun-border pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-sigemun-muted">
                    Documentos del expediente ({archivosQuery.data?.length ?? 0})
                  </p>
                  {archivosQuery.isLoading ? (
                    <p className="text-xs text-sigemun-muted">Consultando documentos...</p>
                  ) : !archivosQuery.data || archivosQuery.data.length === 0 ? (
                    <p className="text-xs text-sigemun-muted">El expediente aún no tiene documentos.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {archivosQuery.data.map((a) => (
                        <li
                          key={a.idArchivoAdjunto}
                          className="flex items-center justify-between gap-3 rounded-lg border border-sigemun-border bg-white px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-sigemun-text">{a.nombreOriginal}</p>
                            <p className="text-[11px] text-sigemun-muted">
                              {a.nombreRequisito ?? 'Adjunto general'} · {formatBytes(a.pesoBytes)} ·{' '}
                              {formatDate(a.fechaSubida)}
                            </p>
                          </div>
                          <a
                            href={`${BACKEND_ORIGIN}/${a.rutaAlmacenamiento}`}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 font-semibold text-sigemun-primary hover:underline"
                          >
                            Abrir
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bitácora resumida del expediente */}
            <Card className="order-3 h-full overflow-hidden lg:col-start-1 lg:row-start-2">
              <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
                <CardTitle className="text-base">
                  Historial de Movimientos del Expediente #{activeTramite.idTramite}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 sm:pt-6">
                {!historialQuery.data || historialQuery.data.length === 0 ? (
                  <p className="text-xs text-sigemun-muted">Sin movimientos registrados.</p>
                ) : (
                  <div className="space-y-2.5">
                    {historialQuery.data.map((h) => (
                      <div
                        key={h.idHistorial}
                        className="flex items-start justify-between gap-3 rounded-lg border border-sigemun-border p-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={esCodigoFinal(h.codigoEstado) ? 'success' : 'accent'}>
                              {h.codigoEstado} — {h.nombreEstado}
                            </Badge>
                            <span className="text-sigemun-muted">{formatDate(h.fechaCambio)}</span>
                          </div>
                          <p className="mt-1.5 text-sigemun-text">{h.observaciones}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Derecha (5 cols): Acción Operativa — Actualizar Estado y Resolución Final */}
          <div className="contents">
            <Card className="order-2 h-full overflow-hidden border-sigemun-sky lg:col-start-2 lg:row-start-1">
              <CardHeader className="border-b border-sigemun-border bg-sigemun-bg">
                <CardTitle>Actualizar estado del trámite</CardTitle>
                <CardDescription>Registre el resultado de la revisión y avance el expediente a su siguiente etapa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6 sm:pt-6">
                <FormField label="Seleccionar Siguiente Estado" required>
                  <Select
                    value={codigoEstadoNuevo}
                    onChange={(e) => setCodigoEstadoNuevo(e.target.value)}
                    disabled={cerrado}
                  >
                    {(estadosQuery.data ?? []).map((est) => (
                      <option key={est.idEstado} value={est.codigo ?? ''}>
                        {est.codigo} — {est.nombreEstado}{' '}
                        {esCodigoFinal(est.codigo) ? '(Estado Final)' : ''}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField
                  label="Observaciones Técnicas / Criterio del Analista"
                  required
                  hint="Máximo 255 caracteres. Quedará registrado en la bitácora del expediente."
                >
                  <Textarea
                    maxLength={255}
                    placeholder="Detalle el resultado de la revisión documental o inspección..."
                    value={observacionesEstado}
                    onChange={(e) => setObservacionesEstado(e.target.value)}
                    disabled={cerrado}
                  />
                </FormField>

                <Button
                  type="button"
                  className="w-full"
                  disabled={cambiarEstadoMut.isPending || cerrado}
                  onClick={() => cambiarEstadoMut.mutate()}
                >
                  {cambiarEstadoMut.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Registrando transición...
                    </>
                  ) : (
                    'Registrar Cambio de Estado'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Panel de Resolución Final y Cierre (CU-TR-07) */}
            <Card className="order-4 flex h-full flex-col overflow-hidden border-sigemun-sky lg:col-start-2 lg:row-start-2">
              <CardHeader className="border-b border-sigemun-border bg-sigemun-bg">
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-sigemun-primary" /> Resolución final
                </CardTitle>
                <CardDescription>Apruebe o rechace la solicitud y cierre formalmente el expediente.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5 pt-6 sm:pt-6">
                {cerrado ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                    Este expediente ya se encuentra cerrado con estado final{' '}
                    <strong>{activeTramite.estadoActual}</strong> (Fecha de cierre:{' '}
                    {formatDate(activeTramite.fechaResolucionFinal)}).
                  </div>
                ) : (
                  <>
                    <div className="flex flex-1 items-center">
                      <div className="w-full rounded-2xl border border-sigemun-border bg-sigemun-bg p-5">
                        <p className="text-sm font-bold text-sigemun-text">Antes de emitir la resolución</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-white p-3 ring-1 ring-sigemun-border">
                            <p className="section-label">Estado actual</p>
                            <p className="mt-1 text-sm font-semibold text-sigemun-primary">
                              {activeTramite.estadoActual || 'En revisión'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-white p-3 ring-1 ring-sigemun-border">
                            <p className="section-label">Requisitos</p>
                            <p className="mt-1 text-sm font-semibold text-sigemun-primary">
                              {requisitosQuery.data?.filter((r) => r.presentado).length ?? 0} de{' '}
                              {requisitosQuery.data?.length ?? 0} presentados
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-sigemun-primary">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>La decisión cerrará el expediente y quedará registrada en su historial.</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          setResolucionTipo('APR');
                          setOpenResolucionModal(true);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Aprobar (APR)
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setResolucionTipo('RECH');
                          setOpenResolucionModal(true);
                        }}
                      >
                        <XCircle className="h-4 w-4" /> Rechazar (RECH)
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE RESOLUCIÓN FINAL */}
      <Modal
        open={openResolucionModal}
        onClose={() => setOpenResolucionModal(false)}
        title={`Confirmar Resolución Final (${
          resolucionTipo === 'APR' ? 'APROBADO' : 'RECHAZADO'
        })`}
        description={`Expediente ${activeTramite?.numeroExpediente ?? ''} — Esta acción cerrará formalmente el trámite.`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <span>
              Al confirmar, se registrará la resolución y la fecha de cierre definitiva del expediente.
            </span>
          </div>

          <FormField label="Resolución y Fundamentación Oficial" required>
            <Textarea
              maxLength={255}
              placeholder="Indique el número de resolución administrativa y justificación..."
              value={observacionesResolucion}
              onChange={(e) => setObservacionesResolucion(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenResolucionModal(false)}>
              Cancelar
            </Button>
            <Button
              variant={resolucionTipo === 'APR' ? 'default' : 'destructive'}
              disabled={resolucionMut.isPending}
              onClick={() => resolucionMut.mutate()}
            >
              {resolucionMut.isPending ? 'Procesando cierre...' : 'Confirmar y Cerrar Expediente'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
