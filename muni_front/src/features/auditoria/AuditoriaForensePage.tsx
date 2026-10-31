import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  Download,
  Eye,
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
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { exportToCsv, formatDateTime } from '@/lib/utils';
import type { SpConsultarAuditoriaResultDto, VwAuditoriaDetallada } from '@/types/api';

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

/**
 * Normaliza las filas de la vista SQL dbo.vw_auditoria_detallada y los procedimientos almacenados
 * sp_consultar_auditoria / sp_filtrar_auditoria, soportando tanto fechaHora/operacionDml/usuarioEjecutor
 * como fechaEvento/tipoAccion/userName.
 */
function normalizarAuditoria(
  r: VwAuditoriaDetallada | SpConsultarAuditoriaResultDto
): AuditRowNormalized {
  return {
    idAuditoria: r.idAuditoria,
    fechaEvento: r.fechaHora || r.fechaEvento || '',
    tablaAfectada: r.tablaAfectada ?? '',
    idRegistroAfectado: r.idRegistroAfectado ?? '',
    tipoAccion: r.operacionDml || r.tipoAccion || '',
    valoresAnteriores: r.valoresAnteriores,
    valoresNuevos: r.valoresNuevos,
    direccionIp: r.direccionIp ?? '',
    userName: r.usuarioEjecutor || r.userName || 'SISTEMA_INTERNO',
    nombreFuncionario: (r as VwAuditoriaDetallada).nombreFuncionario || r.usuarioEjecutor || r.userName,
    nombreDepartamento: (r as VwAuditoriaDetallada).nombreDepartamento,
  };
}

function formatDiffContent(raw: string | null | undefined): string {
  if (!raw) return 'NULL — (Sin estado previo, inserción nueva)';
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

export function AuditoriaForensePage() {
  const queryClient = useQueryClient();

  // Filtros del Wireframe de Bitácora y Auditoría Forense
  const [tablaFiltro, setTablaFiltro] = useState('');
  const [idUsuarioFiltro, setIdUsuarioFiltro] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoAccionCliente, setTipoAccionCliente] = useState('');
  const [ipCliente, setIpCliente] = useState('');
  const [useServerFilter, setUseServerFilter] = useState(false);

  // Consulta de historial de un registro puntual
  const [registroTabla, setRegistroTabla] = useState('');
  const [registroId, setRegistroId] = useState('');
  const [consultarRegistroActivo, setConsultarRegistroActivo] = useState(false);

  // Selección para comparativa lado a lado (Valores anteriores vs Valores nuevos)
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);

  // Modales de registro manual
  const [openTipoAccionModal, setOpenTipoAccionModal] = useState(false);
  const [nuevoCodigoAccion, setNuevoCodigoAccion] = useState('');
  const [openEventoModal, setOpenEventoModal] = useState(false);
  const [evTabla, setEvTabla] = useState('Deudas');
  const [evIdRegistro, setEvIdRegistro] = useState('1');
  const [evCodigoAccion, setEvCodigoAccion] = useState('UPDATE');
  const [evAnteriores, setEvAnteriores] = useState(
    '{\n  "id_deuda": 1,\n  "estado_deuda": "Vencida",\n  "intereses_mora": 24500.00,\n  "resolucion_legal": null\n}'
  );
  const [evNuevos, setEvNuevos] = useState(
    '{\n  "id_deuda": 1,\n  "estado_deuda": "En Cobro Judicial",\n  "intereses_mora": 24500.00,\n  "resolucion_legal": "RES-ALC-2026-089"\n}'
  );

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
        title="Bitácora y Auditoría Forense del Sistema (Audit Log & Security Center)"
        subtitle="Trazabilidad inmutable de transacciones SQL, direcciones IP y comparativa forense de Valores Anteriores vs Valores Nuevos."
        badge="Seguridad y Trazabilidad"
        icon={<ShieldCheck className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['auditoria'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button
              variant="secondary"
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
            <Button variant="secondary" onClick={() => setOpenTipoAccionModal(true)}>
              <Plus className="h-4 w-4" /> Tipo Acción
            </Button>
            <Button onClick={() => setOpenEventoModal(true)}>
              <Plus className="h-4 w-4" /> Registrar Auditoría
            </Button>
          </>
        }
      />

      {/* Barra Superior de Filtros (Exacta al Wireframe de Auditoría Forense) */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <FormField label="Fecha Inicio (dd/MM/yyyy)">
              <Calendar value={fechaInicio} onChange={setFechaInicio} />
            </FormField>

            <FormField label="Fecha Fin (dd/MM/yyyy)">
              <Calendar value={fechaFin} onChange={setFechaFin} />
            </FormField>

            <FormField label="Usuario (ID)">
              <Input
                type="number"
                min={1}
                placeholder="Todos los usuarios"
                value={idUsuarioFiltro}
                onChange={(e) => setIdUsuarioFiltro(e.target.value)}
              />
            </FormField>

            <FormField label="Tabla Afectada">
              <Input
                placeholder="Ej. Deudas, Tramite..."
                value={tablaFiltro}
                onChange={(e) => setTablaFiltro(e.target.value)}
              />
            </FormField>

            <FormField label="Tipo de Acción">
              <Select
                value={tipoAccionCliente}
                onChange={(e) => setTipoAccionCliente(e.target.value)}
              >
                <option value="">INSERT / UPDATE / DELETE</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
              </Select>
            </FormField>

            <FormField label="Dirección IP">
              <Input
                placeholder="Ej. 192.168.10.45"
                value={ipCliente}
                onChange={(e) => setIpCliente(e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#171717]">
                Historial puntual de registro:
              </span>
              <div className="w-40">
                <Input
                  placeholder="Tabla (ej. Factura)"
                  value={registroTabla}
                  onChange={(e) => setRegistroTabla(e.target.value)}
                />
              </div>
              <div className="w-36">
                <Input
                  placeholder="ID Registro (ej. 1)"
                  value={registroId}
                  onChange={(e) => setRegistroId(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                disabled={!registroTabla.trim() || !registroId.trim()}
                onClick={() => {
                  setConsultarRegistroActivo(true);
                  setUseServerFilter(false);
                }}
              >
                <Search className="h-4 w-4" /> Consultar Registro
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
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
                onClick={() => {
                  setConsultarRegistroActivo(false);
                  setUseServerFilter(true);
                }}
              >
                <Filter className="h-4 w-4" /> Filtrar Auditoría
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Eventos + Inspección Forense Lado a Lado (Data Diff del Wireframe) */}
      {isLoading ? (
        <LoadingState message="Consultando bitácora forense en SQL Server..." />
      ) : detalladaQuery.isError ? (
        <ErrorState error={detalladaQuery.error} onRetry={() => detalladaQuery.refetch()} />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="No se encontraron eventos de auditoría con los filtros aplicados" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Registrados en Bitácora</CardTitle>
              <CardDescription>
                Seleccione cualquier fila o presione <strong>[Ver Detalle / Diff]</strong> para
                inspeccionar los valores anteriores y nuevos abajo.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[440px]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="sticky top-0 border-b border-[#E5E7EB] bg-[#F8FAFC] font-bold uppercase text-[#4B5563]">
                      <th className="px-4 py-3.5">ID Evento</th>
                      <th className="px-4 py-3.5">Fecha y Hora Exacta</th>
                      <th className="px-4 py-3.5">Usuario</th>
                      <th className="px-4 py-3.5">Departamento / Rol</th>
                      <th className="px-4 py-3.5">Tabla Afectada</th>
                      <th className="px-4 py-3.5">ID Registro</th>
                      <th className="px-4 py-3.5">Acción</th>
                      <th className="px-4 py-3.5">Dirección IP</th>
                      <th className="px-4 py-3.5 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredRows.map((r) => {
                      const isSelected = selectedEvent?.idAuditoria === r.idAuditoria;
                      return (
                        <tr
                          key={r.idAuditoria}
                          onClick={() => setSelectedAuditId(r.idAuditoria)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#EFF6FF] shadow-[inset_3px_0_0_#1D4ED8]'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-[#171717]">
                            AUD-{r.idAuditoria}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(r.fechaEvento)}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-[#1E3A8A]">
                            {r.userName}
                          </td>
                          <td className="px-4 py-3">
                            {r.nombreDepartamento || r.nombreFuncionario || 'Municipalidad'}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#171717]">
                            {r.tablaAfectada}
                          </td>
                          <td className="px-4 py-3 font-mono text-[#4B5563]">
                            #{r.idRegistroAfectado}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                r.tipoAccion.includes('DELETE')
                                  ? 'danger'
                                  : r.tipoAccion.includes('INSERT')
                                  ? 'success'
                                  : 'blue'
                              }
                            >
                              {r.tipoAccion}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-[#6B7280]">{r.direccionIp}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center gap-1 font-semibold text-[#1D4ED8] hover:underline">
                              <Eye className="h-3.5 w-3.5" /> [Ver Detalle / Diff]
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* PANEL INFERIOR EXACTO AL WIREFRAME: INSPECCIÓN FORENSE DE DATOS (DATA DIFF) */}
          {selectedEvent && (
            <Card className="border-2 border-[#1D4ED8]/30">
              <CardHeader className="bg-[#F8FAFC]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ArrowLeftRight className="h-5 w-5 text-[#1D4ED8]" />
                      Inspección Forense de Datos — Evento AUD-{selectedEvent.idAuditoria} (Data
                      Diff)
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Tabla: <strong>{selectedEvent.tablaAfectada}</strong> | Registro:{' '}
                      <strong>#{selectedEvent.idRegistroAfectado}</strong> | Ejecutado por:{' '}
                      <strong>{selectedEvent.userName}</strong> desde IP{' '}
                      <code className="font-mono">{selectedEvent.direccionIp}</code>
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      selectedEvent.tipoAccion.includes('DELETE')
                        ? 'danger'
                        : selectedEvent.tipoAccion.includes('INSERT')
                        ? 'success'
                        : 'blue'
                    }
                  >
                    Acción: {selectedEvent.tipoAccion}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
                {/* Columna Izquierda: VALORES ANTERIORES (BEFORE) en Rojo suave */}
                <div className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-4">
                  <p className="mb-2 border-b border-[#FECACA] pb-2 text-xs font-extrabold uppercase tracking-wider text-[#DC2626]">
                    Valores Anteriores (Before)
                  </p>
                  <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[#171717]">
                    {formatDiffContent(selectedEvent.valoresAnteriores)}
                  </pre>
                </div>

                {/* Columna Derecha: VALORES NUEVOS (AFTER) en Verde suave */}
                <div className="rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] p-4">
                  <p className="mb-2 border-b border-[#BBF7D0] pb-2 text-xs font-extrabold uppercase tracking-wider text-[#15803D]">
                    Valores Nuevos (After)
                  </p>
                  <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[#171717]">
                    {formatDiffContent(selectedEvent.valoresNuevos)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* MODAL: REGISTRAR TIPO DE ACCIÓN */}
      <Modal
        open={openTipoAccionModal}
        onClose={() => setOpenTipoAccionModal(false)}
        title="Registrar Código de Tipo de Acción de Auditoría"
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
            <Button variant="secondary" onClick={() => setOpenTipoAccionModal(false)}>
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
        title="Registrar Evento en Bitácora de Auditoría"
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
          <FormField label="Valores Anteriores (JSON)">
            <Textarea
              value={evAnteriores}
              onChange={(e) => setEvAnteriores(e.target.value)}
            />
          </FormField>
          <FormField label="Valores Nuevos (JSON)">
            <Textarea
              value={evNuevos}
              onChange={(e) => setEvNuevos(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenEventoModal(false)}>
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
