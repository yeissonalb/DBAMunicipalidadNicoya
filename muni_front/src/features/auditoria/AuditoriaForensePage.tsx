import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { auditoriaApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { exportToCsv, formatDateTime } from '@/lib/utils';
import type { VwAuditoriaDetallada } from '@/types/api';

interface AuditRowNormalized {
  idAuditoria: number;
  fechaEvento: string;
  tablaAfectada: string;
  idRegistroAfectado: string;
  tipoAccion: string;
  valoresAnteriores?: string | null;
  valoresNuevos?: string | null;
  direccionIp: string;
  userName: string;
  nombreFuncionario?: string;
  nombreDepartamento?: string;
}

/** vw_auditoria_detallada / sp_consultar_auditoria / sp_filtrar_auditoria → fila de la tabla. */
function normalizarAuditoria(r: VwAuditoriaDetallada): AuditRowNormalized {
  return {
    idAuditoria: r.idAuditoria,
    fechaEvento: r.fechaHora,
    tablaAfectada: r.tablaAfectada ?? '',
    idRegistroAfectado: r.idRegistroAfectado ?? '',
    tipoAccion: r.operacionDml ?? '',
    valoresAnteriores: r.valoresAnteriores,
    valoresNuevos: r.valoresNuevos,
    direccionIp: r.direccionIp ?? '',
    userName: r.usuarioEjecutor ?? 'SISTEMA_INTERNO',
    nombreFuncionario: r.usuarioEjecutor ?? undefined,
    nombreDepartamento: r.nombreDepartamento ?? undefined,
  };
}

function formatDiffContent(raw: string | null | undefined): string {
  if (!raw) return '(Sin valores registrados / NULL)';
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

export function AuditoriaForensePage() {
  const queryClient = useQueryClient();

  // Filtros del Wireframe 5 (p. 115 inf.): Rango fechas, Usuario, Tabla afectada, Tipo acción, IP
  const [tablaFiltro, setTablaFiltro] = useState('');
  const [idUsuarioFiltro, setIdUsuarioFiltro] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoAccionCliente, setTipoAccionCliente] = useState('');
  const [ipCliente, setIpCliente] = useState('');
  const [useServerFilter, setUseServerFilter] = useState(false);

  // Consulta de historial de un registro puntual (GET /api/auditoria/registro)
  const [registroTabla, setRegistroTabla] = useState('');
  const [registroId, setRegistroId] = useState('');
  const [consultarRegistroActivo, setConsultarRegistroActivo] = useState(false);

  // Selección para comparativa lado a lado (Valores anteriores vs Valores nuevos)
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);

  // Modales de registro manual de auditoría y tipo de acción
  const [openTipoAccionModal, setOpenTipoAccionModal] = useState(false);
  const [nuevoCodigoAccion, setNuevoCodigoAccion] = useState('');
  const [openEventoModal, setOpenEventoModal] = useState(false);
  const [evTabla, setEvTabla] = useState('Tramite');
  const [evIdRegistro, setEvIdRegistro] = useState('1');
  const [evCodigoAccion, setEvCodigoAccion] = useState('UPDATE');
  const [evAnteriores, setEvAnteriores] = useState('');
  const [evNuevos, setEvNuevos] = useState('');

  const detalladaQuery = useQuery({
    queryKey: ['auditoria', 'detallada'],
    queryFn: () => auditoriaApi.detallada(),
    enabled: !useServerFilter && !consultarRegistroActivo,
  });

  const filtrarQuery = useQuery({
    queryKey: ['auditoria', 'filtrar', tablaFiltro, idUsuarioFiltro, fechaInicio, fechaFin],
    queryFn: () =>
      auditoriaApi.filtrar({
        tablaAfectada: tablaFiltro.trim() || undefined,
        idUsuario: idUsuarioFiltro ? Number(idUsuarioFiltro) : undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
      }),
    enabled: useServerFilter && !consultarRegistroActivo,
  });

  const registroPuntualQuery = useQuery({
    queryKey: ['auditoria', 'registro', registroTabla, registroId],
    queryFn: () => auditoriaApi.registro(registroTabla.trim(), registroId.trim()),
    enabled:
      consultarRegistroActivo &&
      registroTabla.trim().length > 0 &&
      registroId.trim().length > 0,
  });

  const baseRows: AuditRowNormalized[] = useMemo(() => {
    if (consultarRegistroActivo) {
      return (registroPuntualQuery.data ?? []).map(normalizarAuditoria);
    }
    if (useServerFilter) {
      return (filtrarQuery.data ?? []).map(normalizarAuditoria);
    }
    return (detalladaQuery.data ?? []).map(normalizarAuditoria);
  }, [
    consultarRegistroActivo,
    useServerFilter,
    registroPuntualQuery.data,
    filtrarQuery.data,
    detalladaQuery.data,
  ]);

  const filteredRows = useMemo(() => {
    return baseRows.filter((r) => {
      const matchAccion =
        !tipoAccionCliente ||
        r.tipoAccion.toUpperCase().includes(tipoAccionCliente.toUpperCase());
      const matchIp =
        !ipCliente.trim() ||
        r.direccionIp.toLowerCase().includes(ipCliente.trim().toLowerCase());
      const matchTabla =
        useServerFilter ||
        !tablaFiltro.trim() ||
        r.tablaAfectada.toLowerCase().includes(tablaFiltro.trim().toLowerCase());
      return matchAccion && matchIp && matchTabla;
    });
  }, [baseRows, tipoAccionCliente, ipCliente, useServerFilter, tablaFiltro]);

  const selectedEvent =
    filteredRows.find((r) => r.idAuditoria === selectedAuditId) ?? filteredRows[0] ?? null;

  const registrarTipoAccionMut = useMutation({
    mutationFn: () =>
      auditoriaApi.registrarTipoAccion({ codigo: nuevoCodigoAccion.trim().toUpperCase() }),
    onSuccess: (res) => {
      toast.success(res.message || 'Tipo de acción registrado.');
      setNuevoCodigoAccion('');
      setOpenTipoAccionModal(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const registrarEventoMut = useMutation({
    mutationFn: () =>
      auditoriaApi.registrar({
        tablaAfectada: evTabla.trim(),
        idRegistroAfectado: evIdRegistro.trim(),
        codigoAccion: evCodigoAccion.trim().toUpperCase(),
        valoresAnteriores: evAnteriores.trim() || null,
        valoresNuevos: evNuevos.trim() || null,
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Evento de auditoría registrado.');
      setOpenEventoModal(false);
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isLoading =
    detalladaQuery.isLoading || filtrarQuery.isLoading || registroPuntualQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bitácora y Auditoría Forense"
        subtitle="Supervise la actividad del sistema, identifique el origen de cada operación y compare los cambios registrados."
        badge="CU-AU-01 y CU-AU-02"
        icon={<ShieldCheck className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['auditoria'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv(
                  'auditoria_forense_nicoya.csv',
                  filteredRows as unknown as Record<string, unknown>[]
                )
              }
              disabled={filteredRows.length === 0}
            >
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpenTipoAccionModal(true)}
            >
              <Plus className="h-4 w-4" /> Tipo de acción
            </Button>
            <Button size="sm" onClick={() => setOpenEventoModal(true)}>
              <Plus className="h-4 w-4" /> Registrar evento
            </Button>
          </>
        }
      />

      {/* Panel de Filtros Avanzados (Wireframe 5, p. 115) */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-sigemun-border bg-gradient-to-r from-sigemun-bg to-white pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sigemun-sky-muted text-sigemun-primary">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Consulta avanzada de eventos</CardTitle>
              <CardDescription className="mt-1 leading-relaxed">
                Combine fechas, usuario, entidad, acción o dirección IP para localizar movimientos específicos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5 sm:pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-semibold text-sigemun-text">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-sigemun-text">Fecha Fin</label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-sigemun-text">
                Tabla Afectada
              </label>
              <Input
                placeholder="Ej. Tramite, Factura..."
                value={tablaFiltro}
                onChange={(e) => setTablaFiltro(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-sigemun-text">
                ID Usuario
              </label>
              <Input
                type="number"
                min={1}
                placeholder="Ej. 1"
                value={idUsuarioFiltro}
                onChange={(e) => setIdUsuarioFiltro(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-sigemun-text">
                Tipo de Acción
              </label>
              <Select
                value={tipoAccionCliente}
                onChange={(e) => setTipoAccionCliente(e.target.value)}
              >
                <option value="">Todas las acciones</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-sigemun-text">
                Dirección IP
              </label>
              <Input
                placeholder="Ej. 127.0.0.1"
                value={ipCliente}
                onChange={(e) => setIpCliente(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-sigemun-border bg-sigemun-surface p-4 lg:flex-row lg:items-end lg:justify-between">
            {/* Historial puntual de un registro */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-full text-xs font-semibold text-sigemun-primary lg:w-auto">
                Consultar historial de un registro
              </span>
              <Input
                placeholder="Tabla (ej. Factura)"
                value={registroTabla}
                onChange={(e) => setRegistroTabla(e.target.value)}
                className="h-10 w-full text-xs sm:w-44"
              />
              <Input
                placeholder="ID Registro (ej. 1)"
                value={registroId}
                onChange={(e) => setRegistroId(e.target.value)}
                className="h-10 w-full text-xs sm:w-40"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={!registroTabla.trim() || !registroId.trim()}
                onClick={() => {
                  setConsultarRegistroActivo(true);
                  setUseServerFilter(false);
                }}
              >
                <Search className="h-3.5 w-3.5" /> Consultar registro
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTablaFiltro('');
                  setIdUsuarioFiltro('');
                  setFechaInicio('');
                  setFechaFin('');
                  setTipoAccionCliente('');
                  setIpCliente('');
                  setUseServerFilter(false);
                  setConsultarRegistroActivo(false);
                }}
              >
                Restablecer
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setConsultarRegistroActivo(false);
                  setUseServerFilter(true);
                }}
              >
                <Filter className="h-3.5 w-3.5" /> Aplicar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla + Panel Comparativo Lado a Lado (Wireframe 5, p. 115) */}
      {isLoading ? (
        <LoadingState message="Consultando bitácora forense en SQL Server..." />
      ) : detalladaQuery.isError ? (
        <ErrorState error={detalladaQuery.error} onRetry={() => detalladaQuery.refetch()} />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="No se encontraron eventos de auditoría con los filtros aplicados" />
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col gap-3 border-b border-sigemun-border bg-gradient-to-r from-sigemun-bg to-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Eventos registrados</CardTitle>
                <CardDescription className="mt-1">
                  Seleccione una fila para inspeccionar la evidencia y comparar sus valores.
                </CardDescription>
              </div>
              <Badge variant="success">{filteredRows.length} evento(s)</Badge>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              <div
                className="max-h-[34rem] overflow-auto"
                role="region"
                aria-label="Eventos de auditoría"
                tabIndex={0}
              >
                <table className="w-full min-w-[1120px] text-left text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-sigemun-border bg-sigemun-surface text-[11px] font-bold uppercase tracking-[0.08em] text-sigemun-muted">
                      <th scope="col" className="px-6 py-3.5">Evento</th>
                      <th scope="col" className="px-4 py-3.5">Fecha y hora</th>
                      <th scope="col" className="px-4 py-3.5">Usuario</th>
                      <th scope="col" className="px-4 py-3.5">Departamento</th>
                      <th scope="col" className="px-4 py-3.5">Acción</th>
                      <th scope="col" className="px-4 py-3.5">Entidad</th>
                      <th scope="col" className="px-4 py-3.5">Registro</th>
                      <th scope="col" className="px-6 py-3.5">Dirección IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sigemun-border">
                    {filteredRows.map((r) => {
                      const isSelected = selectedEvent?.idAuditoria === r.idAuditoria;
                      return (
                        <tr
                          key={r.idAuditoria}
                          onClick={() => setSelectedAuditId(r.idAuditoria)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-sigemun-sky-muted shadow-[inset_4px_0_0_var(--sigemun-primary)]'
                              : 'hover:bg-sigemun-bg'
                          }`}
                        >
                          <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-sigemun-primary">
                            #{r.idAuditoria}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sigemun-muted">
                            {formatDateTime(r.fechaEvento)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-sigemun-text">{r.userName}</td>
                          <td className="px-4 py-4 text-sigemun-muted">
                            {r.nombreDepartamento || 'No especificado'}
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              variant={
                                r.tipoAccion.includes('DELETE')
                                  ? 'danger'
                                  : r.tipoAccion.includes('INSERT')
                                    ? 'success'
                                    : 'accent'
                              }
                            >
                              {r.tipoAccion || 'Sin clasificar'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 font-mono font-semibold text-sigemun-text">
                            {r.tablaAfectada || '—'}
                          </td>
                          <td className="px-4 py-4 font-mono text-sigemun-muted">
                            #{r.idRegistroAfectado || '—'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-sigemun-muted">
                            {r.direccionIp || 'No disponible'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {selectedEvent && (
            <Card className="overflow-hidden border-t-4 border-t-sigemun-primary">
              <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowLeftRight className="h-5 w-5 text-sigemun-primary" /> Comparativa del evento #{selectedEvent.idAuditoria}
                </CardTitle>
                <CardDescription>
                  Evidencia registrada antes y después de la operación seleccionada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-5 sm:pt-6">
                <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-sigemun-border bg-sigemun-bg sm:grid-cols-2 xl:grid-cols-4">
                  <div className="border-b border-sigemun-border p-4 sm:border-r xl:border-b-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sigemun-muted">Funcionario</p>
                    <p className="mt-1 text-sm font-semibold text-sigemun-text">{selectedEvent.nombreFuncionario || selectedEvent.userName}</p>
                  </div>
                  <div className="border-b border-sigemun-border p-4 xl:border-b-0 xl:border-r">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sigemun-muted">Fecha exacta</p>
                    <p className="mt-1 text-sm font-semibold text-sigemun-text">{formatDateTime(selectedEvent.fechaEvento)}</p>
                  </div>
                  <div className="border-b border-sigemun-border p-4 sm:border-b-0 sm:border-r">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sigemun-muted">Entidad y registro</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-sigemun-text">{selectedEvent.tablaAfectada} · #{selectedEvent.idRegistroAfectado}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sigemun-muted">Origen</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-sigemun-text">{selectedEvent.direccionIp || 'No disponible'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/50">
                    <div className="border-b border-amber-200 bg-amber-100/60 px-4 py-3">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-amber-900">Valores anteriores</p>
                    </div>
                    <pre className="max-h-72 min-h-36 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-amber-950">
                      {formatDiffContent(selectedEvent.valoresAnteriores)}
                    </pre>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <div className="border-b border-emerald-200 bg-emerald-100/60 px-4 py-3">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">Valores nuevos</p>
                    </div>
                    <pre className="max-h-72 min-h-36 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-emerald-950">
                      {formatDiffContent(selectedEvent.valoresNuevos)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* MODAL: REGISTRAR TIPO DE ACCIÓN DE AUDITORÍA */}
      <Modal
        open={openTipoAccionModal}
        onClose={() => setOpenTipoAccionModal(false)}
        title="Registrar Código de Tipo de Acción de Auditoría"
        description="Ejecuta POST /api/auditoria/tipo-accion (dbo.sp_registrar_tipo_accion_auditoria)"
      >
        <div className="space-y-4">
          <FormField label="Código de Acción (máx. 20 caracteres)" required>
            <Input
              maxLength={20}
              placeholder="Ej. EXPORT, BACKUP, RESTORE..."
              value={nuevoCodigoAccion}
              onChange={(e) => setNuevoCodigoAccion(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenTipoAccionModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!nuevoCodigoAccion.trim() || registrarTipoAccionMut.isPending}
              onClick={() => registrarTipoAccionMut.mutate()}
            >
              Registrar Código
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: REGISTRAR EVENTO DE AUDITORÍA */}
      <Modal
        open={openEventoModal}
        onClose={() => setOpenEventoModal(false)}
        title="Registrar Evento en Bitácora de Auditoría (CU-AU-02)"
        description="Ejecuta POST /api/auditoria (dbo.sp_registrar_auditoria). El usuario se toma del JWT y la IP de la conexión HTTP."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tabla Afectada" required>
              <Input value={evTabla} onChange={(e) => setEvTabla(e.target.value)} />
            </FormField>
            <FormField label="ID Registro Afectado" required>
              <Input value={evIdRegistro} onChange={(e) => setEvIdRegistro(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Código de Acción Existente" required>
            <Input
              placeholder="INSERT, UPDATE, DELETE..."
              value={evCodigoAccion}
              onChange={(e) => setEvCodigoAccion(e.target.value)}
            />
          </FormField>
          <FormField label="Valores Anteriores (Opcional)">
            <Textarea
              value={evAnteriores}
              onChange={(e) => setEvAnteriores(e.target.value)}
              placeholder='Ej. {"estado": "PEND"}'
            />
          </FormField>
          <FormField label="Valores Nuevos (Opcional)">
            <Textarea
              value={evNuevos}
              onChange={(e) => setEvNuevos(e.target.value)}
              placeholder='Ej. {"estado": "PAG"}'
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenEventoModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={registrarEventoMut.isPending}
              onClick={() => registrarEventoMut.mutate()}
            >
              Registrar en Bitácora
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

