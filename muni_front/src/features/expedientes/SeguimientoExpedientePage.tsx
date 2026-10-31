import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  FolderKanban,
  History,
  Loader2,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import { tramiteApi } from '@/services/api';
import { BACKEND_ORIGIN } from '@/services/httpClient';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/forms/FormField';
import { formatBytes, formatDate, formatDateTime } from '@/lib/utils';
import { codigoEstadoPorNombre, esCodigoFinal } from '@/lib/tramites';

const STEPPER_STATES = [
  { code: 'REC', label: '1. Radicado / Recibido' },
  { code: 'REV', label: '2. En Revisión' },
  { code: 'DOC', label: '3. Subsanación Doc.' },
  { code: 'EVA', label: '4. Evaluación Técnica' },
  { code: 'FINAL', label: '5. Resolución Final' },
];

export function SeguimientoExpedientePage() {
  const queryClient = useQueryClient();
  const [busquedaExpediente, setBusquedaExpediente] = useState('');
  const [busquedaContribuyenteId, setBusquedaContribuyenteId] = useState('');
  const [selectedIdTramite, setSelectedIdTramite] = useState<number | null>(null);
  const [showBitacoraGlobal, setShowBitacoraGlobal] = useState(false);

  // Actualizar estado desde el panel derecho del Wireframe 10
  const [nuevoEstado, setNuevoEstado] = useState('REV');
  const [observaciones, setObservaciones] = useState('');

  const seguimientoQuery = useQuery({
    queryKey: ['tramites', 'seguimiento'],
    queryFn: () => tramiteApi.seguimiento(),
  });

  const estadosQuery = useQuery({
    queryKey: ['tramites', 'estados'],
    queryFn: () => tramiteApi.estados(),
  });

  const bitacoraDetalladaQuery = useQuery({
    queryKey: ['tramites', 'historial-detallado'],
    queryFn: () => tramiteApi.historialDetallado(),
    enabled: showBitacoraGlobal,
  });

  const listaFiltrada = (seguimientoQuery.data ?? []).filter((t) => {
    const matchExp =
      !busquedaExpediente.trim() ||
      (t.numeroExpediente ?? '').toLowerCase().includes(busquedaExpediente.trim().toLowerCase()) ||
      (t.nombreTramite ?? '').toLowerCase().includes(busquedaExpediente.trim().toLowerCase()) ||
      (t.solicitante || '').toLowerCase().includes(busquedaExpediente.trim().toLowerCase());
    const matchContrib =
      !busquedaContribuyenteId.trim() ||
      String(t.idContribuyente) === busquedaContribuyenteId.trim();
    return matchExp && matchContrib;
  });

  const activeTramite =
    listaFiltrada.find((t) => t.idTramite === selectedIdTramite) ??
    listaFiltrada[0] ??
    null;

  // Documentos del expediente guardados en la BD (sp_consultar_archivos_tramite)
  const archivosQuery = useQuery({
    queryKey: ['tramites', 'archivos', activeTramite?.idTramite],
    queryFn: () => tramiteApi.archivos(activeTramite!.idTramite),
    enabled: Boolean(activeTramite?.idTramite),
  });

  // vw_historial_tramites_detallado no trae al solicitante: se toma del seguimiento
  const solicitantePorTramite = new Map(
    (seguimientoQuery.data ?? []).map((t) => [t.idTramite, t.solicitante])
  );

  const historialIndividualQuery = useQuery({
    queryKey: ['tramites', 'historial', activeTramite?.idTramite],
    queryFn: () => tramiteApi.historial(activeTramite!.idTramite),
    enabled: Boolean(activeTramite?.idTramite),
  });

  const cambiarEstadoMut = useMutation({
    mutationFn: () => {
      if (!activeTramite) throw new Error('Seleccione un expediente.');
      if (!observaciones.trim()) throw new Error('Ingrese las observaciones del cambio.');
      return tramiteApi.cambiarEstado(activeTramite.idTramite, {
        codigoEstado: nuevoEstado,
        observaciones: observaciones.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Estado actualizado.');
      setObservaciones('');
      queryClient.invalidateQueries({ queryKey: ['tramites'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAdjuntar = async (file: File) => {
    if (!activeTramite) return;
    try {
      const res = await tramiteApi.adjuntarArchivo(activeTramite.idTramite, file, null);
      toast.success(`${res.message || 'Archivo adjuntado.'} (${res.data.nombreOriginal})`);
      queryClient.invalidateQueries({ queryKey: ['tramites', 'archivos', activeTramite.idTramite] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al adjuntar archivo.');
    }
  };

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Seguimiento de expedientes"
        subtitle="Consulte el avance, historial, documentos y estado actual de cada trámite municipal."
        badge={`${listaFiltrada.length} expedientes`}
        icon={<FolderKanban className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant={showBitacoraGlobal ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowBitacoraGlobal((s) => !s)}
            >
              <History className="h-4 w-4" />{' '}
              {showBitacoraGlobal ? 'Ver Vista por Expediente' : 'Ver Bitácora Global'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['tramites'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
          </>
        }
      />

      {/* Barra de Búsqueda */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-[#164B35]" /> Buscar expedientes
          </CardTitle>
          <CardDescription>Filtre la bandeja por expediente, tipo de trámite o contribuyente.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#26352D]">
                Expediente, trámite o contribuyente
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#607168]" />
                <Input
                  placeholder="Ej. EXP-NIC-2026-0001 o Visado..."
                  value={busquedaExpediente}
                  onChange={(e) => setBusquedaExpediente(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#26352D]">
                ID del contribuyente
              </label>
              <Input
                type="number"
                min={1}
                placeholder="ID Contribuyente"
                value={busquedaContribuyenteId}
                onChange={(e) => setBusquedaContribuyenteId(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {seguimientoQuery.isLoading ? (
        <LoadingState message="Consultando seguimiento de expedientes..." />
      ) : seguimientoQuery.isError ? (
        <ErrorState error={seguimientoQuery.error} onRetry={() => seguimientoQuery.refetch()} />
      ) : showBitacoraGlobal ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
            <CardTitle>Bitácora global de cambios</CardTitle>
            <CardDescription>Movimientos y transiciones registrados para todos los expedientes.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <div className="overflow-x-auto" role="region" aria-label="Bitácora global" tabIndex={0}>
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                    <th className="px-3 py-2.5">Fecha Cambio</th>
                    <th className="px-3 py-2.5">Expediente</th>
                    <th className="px-3 py-2.5">Trámite</th>
                    <th className="px-3 py-2.5">Contribuyente</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {(bitacoraDetalladaQuery.data ?? []).map((row) => (
                    <tr key={row.idHistorial} className="even:bg-[#FAFCFB] transition-colors hover:bg-[#E8F0EC]/55">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {formatDateTime(row.fechaCambio)}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#164B35]">
                        {row.numeroExpediente}
                      </td>
                      <td className="px-3 py-2.5">{row.nombreTramite}</td>
                      <td className="px-3 py-2.5">{solicitantePorTramite.get(row.idTramite) || '—'}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={esCodigoFinal(row.codigoEstado) ? 'success' : 'gold'}>
                          {row.codigoEstado} — {row.nombreEstado}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-[#5A6B61]">{row.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : listaFiltrada.length === 0 ? (
        <EmptyState title="No se encontraron expedientes con ese criterio" />
      ) : (
        <>
          {/* Tabla de Expedientes para seleccionar */}
          <div className="overflow-x-auto rounded-2xl border border-[#DCE3DE] bg-white shadow-card" role="region" aria-label="Bandeja de expedientes" tabIndex={0}>
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                  <th className="px-4 py-3">Expediente</th>
                  <th className="px-4 py-3">Tipo de Trámite</th>
                  <th className="px-4 py-3">Contribuyente</th>
                  <th className="px-4 py-3">Finca</th>
                  <th className="px-4 py-3">Funcionario</th>
                  <th className="px-4 py-3">Días / SLA</th>
                  <th className="px-4 py-3">Estado Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3DE]">
                {listaFiltrada.map((t) => {
                  const isSelected = activeTramite?.idTramite === t.idTramite;
                  return (
                    <tr
                      key={t.idTramite}
                      onClick={() => setSelectedIdTramite(t.idTramite)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#E8F0EC] shadow-[inset_4px_0_0_#164B35]' : 'even:bg-[#FAFCFB] hover:bg-[#F5F7F4]'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[#164B35]">
                        {t.numeroExpediente}
                      </td>
                      <td className="px-4 py-3 font-semibold">{t.nombreTramite}</td>
                      <td className="px-4 py-3">
                        {t.solicitante || `#${t.idContribuyente}`}
                      </td>
                      <td className="px-4 py-3 font-mono">{t.numeroFinca || '—'}</td>
                      <td className="px-4 py-3">{t.funcionarioAnalista}</td>
                      <td className="px-4 py-3">
                        {t.diasTranscurridos ?? 0} / {t.diasResolucionMax} d
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            codigoEstadoPorNombre(t.estadoActual, estadosQuery.data) === 'APR'
                              ? 'success'
                              : codigoEstadoPorNombre(t.estadoActual, estadosQuery.data) === 'RECH'
                              ? 'danger'
                              : 'gold'
                          }
                        >
                          {t.estadoActual}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detalle del Expediente Seleccionado (Wireframe 10: Stepper + 3 Paneles Inferiores) */}
          {activeTramite && (
            <div className="flex flex-col" style={{ gap: '2rem' }}>
              {/* Stepper Horizontal del Wireframe 10 */}
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
                  <CardTitle className="text-base">
                    Ruta del expediente · {activeTramite.numeroExpediente}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 sm:pt-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {STEPPER_STATES.map((step) => {
                      const currentCode = codigoEstadoPorNombre(activeTramite.estadoActual, estadosQuery.data);
                      const isFinal = currentCode === 'APR' || currentCode === 'RECH';
                      const isCurrent =
                        step.code === currentCode || (step.code === 'FINAL' && isFinal);
                      return (
                        <div
                          key={step.code}
                          className={`rounded-xl border p-3 text-center text-xs ${
                            isCurrent
                              ? 'border-[#164B35] bg-[#164B35] text-white font-bold shadow-xs'
                              : 'border-[#DCE3DE] bg-[#F5F7F4] text-[#5A6B61]'
                          }`}
                        >
                          {isCurrent ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-[#B6944A]" />
                          ) : (
                            <Clock className="mx-auto h-4 w-4" />
                          )}
                          <p className="mt-1">{step.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 3 Columnas Inferiores del Wireframe 10 */}
              <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '2rem' }}>
                {/* Columna 1 (5 cols): Historial de Cambio (Línea de Tiempo) */}
                <Card className="h-full overflow-hidden">
                  <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
                    <CardTitle className="text-base">Historial de cambios</CardTitle>
                    <CardDescription>Movimientos registrados para este expediente.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 sm:pt-6">
                    {!historialIndividualQuery.data ||
                    historialIndividualQuery.data.length === 0 ? (
                      <p className="text-xs text-[#5A6B61]">
                        Sin movimientos registrados para este expediente.
                      </p>
                    ) : (
                      <div className="relative border-l-2 border-[#164B35]/30 pl-4 space-y-4">
                        {historialIndividualQuery.data.map((h) => (
                          <div key={h.idHistorial} className="relative text-xs">
                            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#164B35]" />
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#164B35]">
                                {h.codigoEstado} — {h.nombreEstado}
                              </span>
                              <span className="text-[11px] text-[#5A6B61]">
                                {formatDate(h.fechaCambio)}
                              </span>
                            </div>
                            <p className="mt-1 text-[#26352D]">{h.observaciones}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Columna 2 (3 cols): Archivos Adjuntos */}
                <Card className="h-full overflow-hidden">
                  <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
                    <CardTitle className="text-base">Archivos adjuntos</CardTitle>
                    <CardDescription>Documentos del expediente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6 sm:pt-6">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#DCE3DE] bg-[#F5F7F4] p-4 text-center hover:border-[#164B35]">
                      <Upload className="h-5 w-5 text-[#164B35]" />
                      <span className="mt-1.5 text-xs font-semibold text-[#164B35]">
                        Adjuntar Documento
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleAdjuntar(f);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {archivosQuery.isLoading ? (
                      <p className="text-[11px] text-[#5A6B61]">Consultando documentos...</p>
                    ) : (archivosQuery.data ?? []).length === 0 ? (
                      <p className="text-[11px] text-[#5A6B61]">Este expediente aún no tiene documentos.</p>
                    ) : (
                      (archivosQuery.data ?? []).map((a) => (
                        <div
                          key={a.idArchivoAdjunto}
                          className="flex items-center justify-between rounded-lg border border-[#DCE3DE] p-2.5 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate font-semibold">{a.nombreOriginal}</p>
                            <p className="text-[10px] text-[#5A6B61]">
                              {a.nombreRequisito ?? 'Adjunto general'} · {formatBytes(a.pesoBytes)} ·{' '}
                              {formatDate(a.fechaSubida)}
                            </p>
                          </div>
                          <a
                            href={`${BACKEND_ORIGIN}/${a.rutaAlmacenamiento}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#164B35] hover:underline"
                            title="Abrir documento"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      ))
                    )}

                    <p className="text-[11px] text-[#5A6B61]">
                      <FileText className="mr-1 inline h-3 w-3" /> Los documentos se vinculan de forma segura al expediente.
                    </p>
                  </CardContent>
                </Card>

                {/* Columna 3 (4 cols): Actualizar Estado del Trámite */}
                <Card className="h-full overflow-hidden border-[#D7C28E]">
                  <CardHeader className="border-b border-[#E9DFC4] bg-[#FBF7EE]">
                    <CardTitle className="text-base">Actualizar estado</CardTitle>
                    <CardDescription>Registre el avance y las observaciones de la gestión.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6 sm:pt-6">
                    <FormField label="Nuevo Estado" required>
                      <Select
                        value={nuevoEstado}
                        onChange={(e) => setNuevoEstado(e.target.value)}
                      >
                        {(estadosQuery.data ?? []).map((e) => (
                          <option key={e.idEstado} value={e.codigo ?? ''}>
                            {e.codigo} — {e.nombreEstado}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="Observaciones" required>
                      <Textarea
                        maxLength={255}
                        placeholder="Indique el detalle del avance..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                      />
                    </FormField>

                    <Button
                      className="w-full"
                      disabled={cambiarEstadoMut.isPending}
                      onClick={() => cambiarEstadoMut.mutate()}
                    >
                      {cambiarEstadoMut.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                        </>
                      ) : (
                        'Guardar Cambio de Estado'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

