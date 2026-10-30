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
      return registroPuntualQuery.data ?? [];
    }
    if (useServerFilter) {
      return filtrarQuery.data ?? [];
    }
    return detalladaQuery.data ?? [];
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
        title="Bitácora y Auditoría Forense del Sistema (Audit LOG & Security Center)"
        subtitle="Trazabilidad de transacciones, direcciones IP y comparativa forense de valores anteriores vs nuevos (Wireframe #5, p. 115)"
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
              <Plus className="h-4 w-4" /> Tipo Acción
            </Button>
            <Button size="sm" onClick={() => setOpenEventoModal(true)}>
              <Plus className="h-4 w-4" /> Registrar Auditoría
            </Button>
          </>
        }
      />

      {/* Panel de Filtros Avanzados (Wireframe 5, p. 115) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#164B35]" /> Filtros de Auditoría Forense (
            <code className="font-mono">GET /api/auditoria/filtrar</code> y{' '}
            <code className="font-mono">/registro</code>)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352D]">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352D]">Fecha Fin</label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352D]">
                Tabla Afectada
              </label>
              <Input
                placeholder="Ej. Tramite, Factura..."
                value={tablaFiltro}
                onChange={(e) => setTablaFiltro(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352D]">
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
              <label className="mb-1 block text-xs font-semibold text-[#26352D]">
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
              <label className="mb-1 block text-xs font-semibold text-[#26352D]">
                Dirección IP
              </label>
              <Input
                placeholder="Ej. 127.0.0.1"
                value={ipCliente}
                onChange={(e) => setIpCliente(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE3DE] pt-3">
            {/* Historial puntual de un registro */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#164B35]">
                Historial puntual de registro:
              </span>
              <Input
                placeholder="Tabla (ej. Factura)"
                value={registroTabla}
                onChange={(e) => setRegistroTabla(e.target.value)}
                className="h-8 w-36 text-xs"
              />
              <Input
                placeholder="ID Registro (ej. 1)"
                value={registroId}
                onChange={(e) => setRegistroId(e.target.value)}
                className="h-8 w-32 text-xs"
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
                <Search className="h-3.5 w-3.5" /> Consultar Registro
              </Button>
            </div>

            <div className="flex gap-2">
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
                Restablecer Vista Detallada
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setConsultarRegistroActivo(false);
                  setUseServerFilter(true);
                }}
              >
                <Filter className="h-3.5 w-3.5" /> Filtrar Auditoría (SP)
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
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Tabla de Eventos (7 cols) */}
          <div className="xl:col-span-7">
            <div className="overflow-x-auto rounded-xl border border-[#DCE3DE] bg-white shadow-card max-h-[600px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="sticky top-0 border-b border-[#DCE3DE] bg-[#F5F7F4] font-bold uppercase text-[#5A6B61]">
                    <th className="px-3.5 py-3">ID</th>
                    <th className="px-3.5 py-3">Fecha y Hora</th>
                    <th className="px-3.5 py-3">Usuario / IP</th>
                    <th className="px-3.5 py-3">Acción</th>
                    <th className="px-3.5 py-3">Tabla / Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {filteredRows.map((r) => {
                    const isSelected = selectedEvent?.idAuditoria === r.idAuditoria;
                    return (
                      <tr
                        key={r.idAuditoria}
                        onClick={() => setSelectedAuditId(r.idAuditoria)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#E8F0EC]' : 'hover:bg-[#F5F7F4]'
                        }`}
                      >
                        <td className="px-3.5 py-2.5 font-mono font-bold text-[#164B35]">
                          #{r.idAuditoria}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {formatDateTime(r.fechaEvento)}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <p className="font-semibold text-[#26352D]">{r.userName}</p>
                          <p className="font-mono text-[10px] text-[#5A6B61]">{r.direccionIp}</p>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <Badge
                            variant={
                              r.tipoAccion.includes('DELETE')
                                ? 'danger'
                                : r.tipoAccion.includes('INSERT')
                                ? 'success'
                                : 'gold'
                            }
                          >
                            {r.tipoAccion}
                          </Badge>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <p className="font-mono font-bold text-[#26352D]">{r.tablaAfectada}</p>
                          <p className="font-mono text-[11px] text-[#5A6B61]">
                            Reg. #{r.idRegistroAfectado}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel Derecho (5 cols): Detalle — Comparativa de Cambios (Wireframe 5) */}
          <div className="xl:col-span-5">
            {selectedEvent && (
              <Card className="border-t-4 border-t-[#164B35] sticky top-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowLeftRight className="h-4 w-4 text-[#164B35]" /> Detalle — Comparativa de
                    Cambios (#{selectedEvent.idAuditoria})
                  </CardTitle>
                  <CardDescription>
                    Tabla: <strong>{selectedEvent.tablaAfectada}</strong> · Registro:{' '}
                    <strong>#{selectedEvent.idRegistroAfectado}</strong> · IP:{' '}
                    <code className="font-mono">{selectedEvent.direccionIp}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-[#F5F7F4] p-3 text-xs space-y-1">
                    <p>
                      <strong>Funcionario:</strong>{' '}
                      {selectedEvent.nombreFuncionario || selectedEvent.userName} (
                      {selectedEvent.userName})
                    </p>
                    {selectedEvent.nombreDepartamento && (
                      <p>
                        <strong>Departamento:</strong> {selectedEvent.nombreDepartamento}
                      </p>
                    )}
                    <p>
                      <strong>Fecha exacta:</strong> {formatDateTime(selectedEvent.fechaEvento)}
                    </p>
                  </div>

                  {/* Comparativa Lado a Lado: Valores Anteriores vs Valores Nuevos */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                      <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                        Valores Anteriores (Before)
                      </p>
                      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-amber-950 max-h-60 overflow-y-auto">
                        {formatDiffContent(selectedEvent.valoresAnteriores)}
                      </pre>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                      <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                        Valores Nuevos (After)
                      </p>
                      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-emerald-950 max-h-60 overflow-y-auto">
                        {formatDiffContent(selectedEvent.valoresNuevos)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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

