import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check,
  Download,
  FileText,
  FolderKanban,
  Plus,
  Search,
} from 'lucide-react';
import { catalogosGeneralesApi, tramiteApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/forms/FormField';
import { formatDateTime } from '@/lib/utils';

const FLUJO_STEPS = [
  { num: 1, title: 'Radicado' },
  { num: 2, title: 'Inspección de Campo' },
  { num: 3, title: 'Revisión Técnica' },
  { num: 4, title: 'Resolución Final' },
];

function resolveActiveStep(estadoActual?: string): number {
  const u = (estadoActual || '').toUpperCase();
  if (u.includes('APR') || u.includes('RES') || u.includes('FIN') || u.includes('RECH')) return 4;
  if (u.includes('REV') || u.includes('TEC') || u.includes('ANA')) return 3;
  if (u.includes('INSP') || u.includes('CAMP')) return 2;
  return 1;
}

export function SeguimientoExpedientePage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const initialId = Number(searchParams.get('id')) || 1;
  const [idTramiteInput, setIdTramiteInput] = useState(String(initialId));
  const [idTramiteActivo, setIdTramiteActivo] = useState<number>(initialId);

  useEffect(() => {
    const paramId = Number(searchParams.get('id'));
    if (paramId > 0) {
      setIdTramiteInput(String(paramId));
      setIdTramiteActivo(paramId);
    }
  }, [searchParams]);

  // Panel Derecho del Wireframe: Actualizar Estado del Trámite
  const [idEstadoDrawer, setIdEstadoDrawer] = useState<number>(2);
  const [observacionDrawer, setObservacionDrawer] = useState('');

  // Modales para Inspección y Resolución
  const [openInspeccionModal, setOpenInspeccionModal] = useState(false);
  const [fechaInspeccion, setFechaInspeccion] = useState(new Date().toISOString().slice(0, 10));
  const [resultadoInspeccion, setResultadoInspeccion] = useState('');
  const [latitudInsp, setLatitudInsp] = useState('10.1483');
  const [longitudInsp, setLongitudInsp] = useState('-85.4520');

  const [openResolucionModal, setOpenResolucionModal] = useState(false);
  const [numeroResolucion, setNumeroResolucion] = useState(
    `RES-NIC-${new Date().getFullYear()}-001`
  );
  const [tipoResolucion, setTipoResolucion] = useState('APROBADO');
  const [detalleResolucion, setDetalleResolucion] = useState('');

  const tramiteQuery = useQuery({
    queryKey: ['tramite', 'seguimiento', idTramiteActivo],
    queryFn: () => tramiteApi.consultar(idTramiteActivo),
    enabled: idTramiteActivo > 0,
  });

  const estadosTramiteQuery = useQuery({
    queryKey: ['catalogos', 'estados-tramite'],
    queryFn: () => catalogosGeneralesApi.estadosTramite(),
  });

  const tramite = tramiteQuery.data?.[0] ?? null;
  const activeStep = resolveActiveStep(tramite?.estadoActual);

  const cambiarEstadoMut = useMutation({
    mutationFn: () => {
      if (!observacionDrawer.trim()) {
        throw new Error('Las observaciones técnicas son obligatorias.');
      }
      return tramiteApi.cambiarEstado(idTramiteActivo, {
        idEstado: idEstadoDrawer,
        observacion: observacionDrawer.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Estado del trámite actualizado.');
      setObservacionDrawer('');
      queryClient.invalidateQueries({ queryKey: ['tramite'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const registrarInspeccionMut = useMutation({
    mutationFn: () =>
      tramiteApi.registrarInspeccion(idTramiteActivo, {
        fechaInspeccion,
        resultado: resultadoInspeccion.trim(),
        coordenadaLat: Number(latitudInsp),
        coordenadaLon: Number(longitudInsp),
      }),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Inspección registrada'} (ID #${res.data})`);
      setOpenInspeccionModal(false);
      setResultadoInspeccion('');
      queryClient.invalidateQueries({ queryKey: ['tramite'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const emitirResolucionMut = useMutation({
    mutationFn: () =>
      tramiteApi.emitirResolucion(idTramiteActivo, {
        numeroResolucion: numeroResolucion.trim(),
        tipoResolucion: tipoResolucion.trim(),
        detalleResolucion: detalleResolucion.trim(),
      }),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Resolución emitida'} (ID #${res.data})`);
      setOpenResolucionModal(false);
      setDetalleResolucion('');
      queryClient.invalidateQueries({ queryKey: ['tramite'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seguimiento y Trazabilidad de Expedientes"
        subtitle="Línea de progreso en 4 etapas, historial cronológico de cambios, archivos adjuntos y actualización de estado."
        badge={tramite?.numeroExpediente || `ID #${idTramiteActivo}`}
        icon={<FolderKanban className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-28">
              <Input
                type="number"
                min={1}
                value={idTramiteInput}
                onChange={(e) => setIdTramiteInput(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setIdTramiteActivo(Math.max(1, Number(idTramiteInput) || 1))}
            >
              <Search className="h-4 w-4" /> Buscar
            </Button>
            <Button variant="secondary" onClick={() => setOpenInspeccionModal(true)}>
              <Plus className="h-4 w-4" /> Inspección
            </Button>
            <Button onClick={() => setOpenResolucionModal(true)}>
              <Plus className="h-4 w-4" /> Emitir Resolución
            </Button>
          </div>
        }
      />

      {tramiteQuery.isLoading ? (
        <LoadingState message="Cargando trazabilidad del expediente..." />
      ) : tramiteQuery.isError ? (
        <ErrorState error={tramiteQuery.error} onRetry={() => tramiteQuery.refetch()} />
      ) : !tramite ? (
        <EmptyState title={`No existe el expediente con ID #${idTramiteActivo}`} />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* COLUMNA PRINCIPAL (8 COLS): STEPPER DE 4 ETAPAS + HISTORIAL DE CAMBIOS + ARCHIVOS ADJUNTOS */}
          <div className="space-y-6 xl:col-span-8">
            {/* Tarjeta Superior: Procedimiento + Stepper Horizontal (Exacto al Wireframe) */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280]">Procedimiento</p>
                    <h2 className="mt-0.5 text-xl font-extrabold text-[#171717]">
                      {tramite.nombreTramite}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-[#4B5563]">
                      Ciudadano: <strong className="text-[#171717]">{tramite.contribuyente}</strong>{' '}
                      · Expediente: <span className="font-mono">{tramite.numeroExpediente}</span>
                    </p>
                  </div>
                  <Badge variant="blue">{tramite.estadoActual}</Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Stepper Horizontal de 4 Etapas */}
                <div className="relative flex items-start justify-between">
                  <div className="absolute left-8 right-8 top-5 h-0.5 bg-[#D1D5DB]" />
                  <div
                    className="absolute left-8 top-5 h-0.5 bg-[#1D4ED8] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ((activeStep - 1) / (FLUJO_STEPS.length - 1)) * 85)}%`,
                    }}
                  />

                  {FLUJO_STEPS.map((st) => {
                    const isCompleted = st.num < activeStep;
                    const isCurrent = st.num === activeStep;
                    return (
                      <div
                        key={st.num}
                        className="relative z-10 flex flex-col items-center text-center"
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold ${
                            isCompleted
                              ? 'border-[#15803D] bg-[#15803D] text-white'
                              : isCurrent
                              ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white ring-4 ring-[#1D4ED8]/20'
                              : 'border-[#D1D5DB] bg-white text-[#6B7280]'
                          }`}
                        >
                          {isCompleted ? <Check className="h-5 w-5" /> : st.num}
                        </div>
                        <p className="mt-2.5 text-xs font-bold text-[#171717]">{st.title}</p>
                        <div className="mt-1">
                          <Badge
                            variant={
                              isCompleted ? 'success' : isCurrent ? 'blue' : 'neutral'
                            }
                          >
                            {isCompleted
                              ? 'Completado'
                              : isCurrent
                              ? 'En Progreso'
                              : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 2 Tarjetas Inferiores del Wireframe: Historial de Cambios + Archivos Adjuntos */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Cambios</CardTitle>
                  <CardDescription>Trazabilidad cronológica del expediente</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="relative border-l-2 border-[#1D4ED8]/30 ml-3 space-y-5">
                    <li className="ml-5">
                      <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-[#1D4ED8]" />
                      <p className="font-mono text-xs font-bold text-[#171717]">
                        {formatDateTime(tramite.fechaSolicitud)}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-[#1E3A8A]">
                        Estado: {tramite.estadoActual}
                      </p>
                      <p className="text-xs text-[#4B5563]">
                        Responsable: {tramite.contribuyente} / Analista Municipal
                      </p>
                    </li>
                    {tramite.fechaCierre && (
                      <li className="ml-5">
                        <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-[#15803D]" />
                        <p className="font-mono text-xs font-bold text-[#171717]">
                          {formatDateTime(tramite.fechaCierre)}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-[#15803D]">
                          Resolución Final y Cierre de Expediente
                        </p>
                      </li>
                    )}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Archivos Adjuntos</CardTitle>
                  <CardDescription>Documentos digitales del expediente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      name: `Plano_Catastrado_${tramite.numeroExpediente}.pdf`,
                      size: '1.2 MB · PDF',
                    },
                    {
                      name: `Certificacion_Propiedad_${tramite.numeroExpediente}.pdf`,
                      size: '0.6 MB · PDF',
                    },
                  ].map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#FEF2F2] text-[#DC2626]">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#171717]">{file.name}</p>
                          <p className="text-[11px] text-[#6B7280]">{file.size}</p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() =>
                          toast.success(`Descargando archivo adjunto: ${file.name}`)
                        }
                        title="Descargar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* COLUMNA DERECHA (4 COLS): PANEL ACTUALIZAR ESTADO DEL TRÁMITE (EXACTO AL WIREFRAME) */}
          <div className="xl:col-span-4">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Actualizar Estado del Trámite</CardTitle>
                <CardDescription>
                  Expediente activo: <strong>{tramite.numeroExpediente}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <FormField label="Estado del Trámite" required>
                  <Select
                    value={idEstadoDrawer}
                    onChange={(e) => setIdEstadoDrawer(Number(e.target.value))}
                  >
                    {(estadosTramiteQuery.data ?? []).map((est) => (
                      <option key={est.idEstado} value={est.idEstado}>
                        {est.nombreEstado} ({est.codigoEstado})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Observaciones Técnicas (obligatorio)" required>
                  <Textarea
                    value={observacionDrawer}
                    onChange={(e) => setObservacionDrawer(e.target.value)}
                    placeholder="Observaciones técnicas..."
                  />
                </FormField>

                <Button
                  className="w-full"
                  disabled={!observacionDrawer.trim() || cambiarEstadoMut.isPending}
                  onClick={() => cambiarEstadoMut.mutate()}
                >
                  {cambiarEstadoMut.isPending
                    ? 'Guardando...'
                    : 'Guardar Cambio de Estado'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR INSPECCIÓN DE CAMPO */}
      <Modal
        open={openInspeccionModal}
        onClose={() => setOpenInspeccionModal(false)}
        title={`Registrar Inspección Técnica — Expediente #${idTramiteActivo}`}
      >
        <div className="space-y-4">
          <FormField label="Fecha de Inspección (dd/MM/yyyy)" required>
            <Calendar value={fechaInspeccion} onChange={setFechaInspeccion} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Latitud GPS" required>
              <Input value={latitudInsp} onChange={(e) => setLatitudInsp(e.target.value)} />
            </FormField>
            <FormField label="Longitud GPS" required>
              <Input value={longitudInsp} onChange={(e) => setLongitudInsp(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Resultado / Dictamen de Inspección" required>
            <Textarea
              value={resultadoInspeccion}
              onChange={(e) => setResultadoInspeccion(e.target.value)}
              placeholder="Describa los hallazgos verificados en sitio..."
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenInspeccionModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!resultadoInspeccion.trim() || registrarInspeccionMut.isPending}
              onClick={() => registrarInspeccionMut.mutate()}
            >
              Guardar Inspección
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: EMITIR RESOLUCIÓN ADMINISTRATIVA */}
      <Modal
        open={openResolucionModal}
        onClose={() => setOpenResolucionModal(false)}
        title={`Emitir Resolución Final — Expediente #${idTramiteActivo}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Número de Resolución" required>
              <Input
                value={numeroResolucion}
                onChange={(e) => setNumeroResolucion(e.target.value)}
              />
            </FormField>
            <FormField label="Tipo de Resolución" required>
              <Select
                value={tipoResolucion}
                onChange={(e) => setTipoResolucion(e.target.value)}
              >
                <option value="APROBADO">APROBADO</option>
                <option value="RECHAZADO">RECHAZADO</option>
                <option value="PREVENIDO">PREVENIDO</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Detalle / Por Tanto de la Resolución" required>
            <Textarea
              value={detalleResolucion}
              onChange={(e) => setDetalleResolucion(e.target.value)}
              placeholder="Redacte el fundamento técnico y legal de la resolución..."
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenResolucionModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !numeroResolucion.trim() ||
                !detalleResolucion.trim() ||
                emitirResolucionMut.isPending
              }
              onClick={() => emitirResolucionMut.mutate()}
            >
              Emitir Resolución Oficial
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

