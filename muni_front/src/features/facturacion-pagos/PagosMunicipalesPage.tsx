import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Banknote,
  Landmark,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  Smartphone,
} from 'lucide-react';
import { facturacionPagoApi, tributoDeudaApi } from '@/services/api';
import type { VwFacturasPendiente } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { formatCurrencyCRC, formatDate } from '@/lib/utils';

export function PagosMunicipalesPage() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [selectedFacturaId, setSelectedFacturaId] = useState<number | null>(null);

  // Estado del formulario de pago (Wireframe 12 panel derecho)
  const [selectedMedioPagoId, setSelectedMedioPagoId] = useState<number>(1);
  const [comprobante, setComprobante] = useState<string>('');
  const [montoPrincipalInput, setMontoPrincipalInput] = useState<string>('');
  const [montoInteresInput, setMontoInteresInput] = useState<string>('0');
  const [montoRecargoInput, setMontoRecargoInput] = useState<string>('0');
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  // Buscador puntual de factura por clave Hacienda o ID (GET /api/facturacionpago/factura)
  const [consultaClaveHacienda, setConsultaClaveHacienda] = useState('');

  const facturasPendientesQuery = useQuery({
    queryKey: ['facturacion', 'facturas-pendientes'],
    queryFn: () => tributoDeudaApi.facturasPendientes(),
  });

  const mediosPagoQuery = useQuery({
    queryKey: ['facturacion', 'medios-pago'],
    queryFn: () => facturacionPagoApi.mediosPago(),
  });

  const consultarFacturaPuntualQuery = useQuery({
    queryKey: ['facturacion', 'consulta-factura', consultaClaveHacienda],
    queryFn: () => facturacionPagoApi.consultarFactura(consultaClaveHacienda.trim()),
    enabled: consultaClaveHacienda.trim().length >= 3,
  });

  const facturasFiltradas = (facturasPendientesQuery.data ?? []).filter((f) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    return (
      f.claveNumericaHacienda.toLowerCase().includes(q) ||
      (f.contribuyente || '').toLowerCase().includes(q) ||
      f.numeroFinca.toLowerCase().includes(q) ||
      f.nombreTributo.toLowerCase().includes(q) ||
      String(f.idFactura) === q
    );
  });

  const selectedFactura: VwFacturasPendiente | null =
    facturasFiltradas.find((f) => f.idFactura === selectedFacturaId) ??
    facturasFiltradas[0] ??
    null;

  const selectFacturaAndPrefill = (f: VwFacturasPendiente) => {
    setSelectedFacturaId(f.idFactura);
    setMontoPrincipalInput(String(f.saldoPendiente));
    setMontoInteresInput('0');
    setMontoRecargoInput('0');
    setComprobante(`COMP-NIC-${new Date().getFullYear()}-${f.idFactura}`);
  };

  // Monto total de la aplicación (suma exacta de los rubros que se imputarán al SP)
  const principalNum = Number(montoPrincipalInput) || 0;
  const interesNum = Number(montoInteresInput) || 0;
  const recargoNum = Number(montoRecargoInput) || 0;
  const montoTotalPagar = Number((principalNum + interesNum + recargoNum).toFixed(2));

  const registrarYAplicarPagoMut = useMutation({
    mutationFn: async () => {
      if (!selectedFactura) throw new Error('Seleccione una factura pendiente.');
      if (montoTotalPagar <= 0) throw new Error('El monto a pagar debe ser mayor a cero.');
      if (!comprobante.trim()) throw new Error('Ingrese el número de comprobante o referencia.');

      // 1) Registrar pago en caja (POST /api/facturacionpago/pago -> sp_registrar_pago_municipal)
      const pagoRes = await facturacionPagoApi.registrarPago({
        idContribuyente: selectedFactura.idContribuyente,
        idMedioPago: selectedMedioPagoId,
        montoTotalPagado: montoTotalPagar,
        comprobante: comprobante.trim(),
      });

      const nuevoIdPago = pagoRes.data;

      // 2) Aplicar el pago a la factura (POST /api/facturacionpago/pago/{id}/aplicar -> sp_aplicar_pago_factura)
      await facturacionPagoApi.aplicarPago(nuevoIdPago, {
        idFactura: selectedFactura.idFactura,
        montoPrincipal: principalNum,
        montoInteres: interesNum,
        montoRecargo: recargoNum,
      });

      return nuevoIdPago;
    },
    onSuccess: (idPago) => {
      toast.success(
        `Pago #${idPago} registrado y aplicado exitosamente a la Factura #${selectedFactura?.idFactura}. El trigger de BD actualizó el saldo.`
      );
      setOpenConfirmModal(false);
      setComprobante('');
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
      queryClient.invalidateQueries({ queryKey: ['tributos'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setOpenConfirmModal(false);
    },
  });

  const getMedioIcon = (nombre: string) => {
    const u = nombre.toUpperCase();
    if (u.includes('EFECTIVO')) return <Banknote className="h-4 w-4" />;
    if (u.includes('TARJETA')) return <CreditCard className="h-4 w-4" />;
    if (u.includes('SINPE')) return <Smartphone className="h-4 w-4" />;
    return <Landmark className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Caja y pagos municipales"
        subtitle="Consulte facturas pendientes, registre el medio de pago y aplique el cobro al saldo correspondiente."
        badge={`${facturasFiltradas.length} facturas pendientes`}
        icon={<Receipt className="h-6 w-6" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['facturacion'] })}
          >
            <RefreshCw className="h-4 w-4" /> Actualizar caja
          </Button>
        }
      />

      {facturasPendientesQuery.isLoading ? (
        <LoadingState message="Consultando facturas con saldo pendiente en SQL Server..." />
      ) : facturasPendientesQuery.isError ? (
        <ErrorState
          error={facturasPendientesQuery.error}
          onRetry={() => facturasPendientesQuery.refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '2rem' }}>
          {/* Panel Izquierdo (7 cols): Saldos pendientes por facturar / Facturas Pendientes (Wireframe 12) */}
          <div className="contents">
            <Card className="overflow-hidden lg:col-span-2">
              <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
                <CardTitle>Facturas pendientes de cobro</CardTitle>
                <CardDescription>
                  Seleccione una factura para consultar su saldo y preparar el registro del pago.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6 sm:pt-6">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#607168]" />
                  <Input
                    placeholder="Buscar por contribuyente, finca, tributo, ID factura o clave Hacienda..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {facturasFiltradas.length === 0 ? (
                  <EmptyState
                    title="No hay facturas pendientes de cobro"
                    description="Puede generar nuevas facturas desde el módulo de Tributos y Deudas."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#DCE3DE]" role="region" aria-label="Facturas pendientes" tabIndex={0}>
                    <table className="w-full min-w-[1100px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                          <th className="px-3 py-2.5">Factura</th>
                          <th className="px-3 py-2.5">Contribuyente / Finca</th>
                          <th className="px-3 py-2.5">Tributo / Periodo</th>
                          <th className="px-3 py-2.5">Vencimiento</th>
                          <th className="px-3 py-2.5">Total Factura</th>
                          <th className="px-3 py-2.5">Abonado</th>
                          <th className="px-3 py-2.5">Saldo Pendiente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE3DE]">
                        {facturasFiltradas.map((f) => {
                          const isSelected = selectedFactura?.idFactura === f.idFactura;
                          return (
                            <tr
                              key={f.idFactura}
                              onClick={() => selectFacturaAndPrefill(f)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-[#E8F0EC] shadow-[inset_4px_0_0_#164B35]' : 'even:bg-[#FAFCFB] hover:bg-[#F5F7F4]'
                              }`}
                            >
                              <td className="px-3 py-2.5 font-mono font-bold text-[#164B35]">
                                #{f.idFactura}
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="font-semibold text-[#26352D]">
                                  {f.contribuyente || `ID #${f.idContribuyente}`}
                                </p>
                                <p className="font-mono text-[11px] text-[#5A6B61]">
                                  Finca: {f.numeroFinca}
                                </p>
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="font-medium">{f.nombreTributo}</p>
                                <p className="text-[#5A6B61]">{f.periodoDeuda}</p>
                              </td>
                              <td className="px-3 py-2.5">
                                <p>{formatDate(f.fechaDeVencimiento)}</p>
                                {(f.diasMora ?? 0) > 0 && (
                                  <Badge variant="danger" className="mt-0.5 text-[10px]">
                                    {f.diasMora} d mora
                                  </Badge>
                                )}
                              </td>
                              <td className="px-3 py-2.5">{formatCurrencyCRC(f.totalFactura)}</td>
                              <td className="px-3 py-2.5 text-emerald-700">
                                {formatCurrencyCRC(f.totalAbonado)}
                              </td>
                              <td className="px-3 py-2.5 font-bold text-amber-900">
                                {formatCurrencyCRC(f.saldoPendiente)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Resumen de la Factura Seleccionada (Tal como en el Wireframe 12) */}
                {selectedFactura && (
                  <div className="space-y-3 rounded-xl border border-[#164B35]/30 bg-[#E8F0EC]/40 p-5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE3DE] pb-2">
                      <span className="font-bold text-[#164B35]">
                        Factura Seleccionada #{selectedFactura.idFactura} · Estado:{' '}
                        {selectedFactura.estadoFactura}
                      </span>
                      <span className="font-mono text-[11px] text-[#5A6B61]">
                        Clave Hacienda: {selectedFactura.claveNumericaHacienda}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
                      <div>
                        <p className="text-[#5A6B61]">Subtotal</p>
                        <p className="font-bold text-[#26352D]">
                          {formatCurrencyCRC(selectedFactura.subtotal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#5A6B61]">Descuentos</p>
                        <p className="font-bold text-[#26352D]">
                          {formatCurrencyCRC(selectedFactura.descuentos)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#5A6B61]">Total Abonado</p>
                        <p className="font-bold text-emerald-800">
                          {formatCurrencyCRC(selectedFactura.totalAbonado)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#5A6B61]">Saldo por pagar</p>
                        <p className="text-sm font-extrabold text-[#164B35]">
                          {formatCurrencyCRC(selectedFactura.saldoPendiente)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consulta de Factura por Clave Numérica Hacienda (sp_consultar_factura) */}
            <Card className="h-full overflow-hidden">
              <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
                <CardTitle className="text-base">Verificar comprobante electrónico</CardTitle>
                <CardDescription>Consulte una factura mediante su clave numérica de Hacienda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6 sm:pt-6">
                <Input
                  placeholder="Pegue aquí la Clave Numérica de Hacienda para consultar..."
                  value={consultaClaveHacienda}
                  onChange={(e) => setConsultaClaveHacienda(e.target.value)}
                  className="font-mono text-xs"
                />
                {consultarFacturaPuntualQuery.data &&
                  consultarFacturaPuntualQuery.data.length > 0 && (
                    <div className="rounded-lg bg-[#F5F7F4] p-3 text-xs">
                      {consultarFacturaPuntualQuery.data.map((fc) => (
                        <div key={fc.idFactura} className="flex justify-between">
                          <span>
                            Factura #{fc.idFactura} · {fc.nombreTributo} ({fc.periodoDeuda})
                          </span>
                          <span className="font-bold text-[#164B35]">
                            Saldo: {formatCurrencyCRC(fc.saldoPendiente)} ({fc.estadoFactura})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Panel Derecho (5 cols): Registro de Pago en Caja (Wireframe 12) */}
          <div className="contents">
            <Card className="h-full overflow-hidden border-[#BBD3C6]">
              <CardHeader className="border-b border-[#DCE3DE] bg-[#F2F7F4]">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#164B35]" /> Registrar pago en caja
                </CardTitle>
                <CardDescription>Seleccione el medio de pago y distribuya el monto aplicado a la factura.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6 sm:pt-6">
                {/* Botones de Método de Pago como en el Wireframe 12 */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#26352D]">
                    Método de pago autorizado
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(mediosPagoQuery.data ?? []).map((mp) => {
                      const active = mp.idMedioPago === selectedMedioPagoId;
                      return (
                        <button
                          key={mp.idMedioPago}
                          type="button"
                          onClick={() => setSelectedMedioPagoId(mp.idMedioPago)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all ${
                            active
                              ? 'border-[#164B35] bg-[#164B35] text-white shadow-xs'
                              : 'border-[#DCE3DE] bg-white text-[#26352D] hover:bg-[#E8F0EC]'
                          }`}
                        >
                          {getMedioIcon(mp.nombreMedioPago)}
                          <span className="truncate">{mp.nombreMedioPago}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <FormField
                  label="Número de Comprobante Bancario / Recibo de Caja"
                  required
                  hint="Ingrese el identificador del comprobante o recibo (máximo 50 caracteres)."
                >
                  <Input
                    maxLength={50}
                    placeholder="Ej. SINPE-9928374 o REC-CAJA1-0042"
                    value={comprobante}
                    onChange={(e) => setComprobante(e.target.value)}
                  />
                </FormField>

                <div className="rounded-xl border border-[#DCE3DE] bg-[#F5F7F4]/70 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#164B35]">
                      Imputación a Factura #{selectedFactura?.idFactura ?? '—'}
                    </p>
                    {selectedFactura && (
                      <button
                        type="button"
                        onClick={() => selectFacturaAndPrefill(selectedFactura)}
                        className="text-[11px] font-semibold text-[#164B35] underline"
                      >
                        Usar saldo exacto ({formatCurrencyCRC(selectedFactura.saldoPendiente)})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormField label="Principal (₡)" required>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={montoPrincipalInput}
                        onChange={(e) => setMontoPrincipalInput(e.target.value)}
                      />
                    </FormField>
                    <FormField label="Intereses (₡)">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={montoInteresInput}
                        onChange={(e) => setMontoInteresInput(e.target.value)}
                      />
                    </FormField>
                    <FormField label="Recargos (₡)">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={montoRecargoInput}
                        onChange={(e) => setMontoRecargoInput(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#DCE3DE] pt-2.5 text-sm">
                    <span className="font-bold text-[#26352D]">Total a Registrar y Aplicar:</span>
                    <span className="text-base font-extrabold text-[#164B35]">
                      {formatCurrencyCRC(montoTotalPagar)}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full h-11"
                  disabled={!selectedFactura || montoTotalPagar <= 0 || !comprobante.trim()}
                  onClick={() => setOpenConfirmModal(true)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Registrar Pago y Aplicar a Factura
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE PAGO */}
      <Modal
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="Confirmar Registro y Aplicación de Pago Municipal"
        description="Verifique cuidadosamente los datos antes de registrar el cobro."
      >
        {selectedFactura && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
              <span>
                Esta operación registrará el pago, lo aplicará a la factura seleccionada y
                actualizará automáticamente su saldo pendiente.
              </span>
            </div>

            <div className="rounded-lg border border-[#DCE3DE] bg-[#F5F7F4] p-3.5 text-xs space-y-1.5">
              <p>
                <strong>Contribuyente:</strong> {selectedFactura.contribuyente} (#
                {selectedFactura.idContribuyente})
              </p>
              <p>
                <strong>Factura Destino:</strong> #{selectedFactura.idFactura} (
                {selectedFactura.nombreTributo} — {selectedFactura.periodoDeuda})
              </p>
              <p>
                <strong>Comprobante:</strong> <span className="font-mono">{comprobante}</span>
              </p>
              <p>
                <strong>Monto Total a Cobrar:</strong>{' '}
                <span className="text-sm font-extrabold text-[#164B35]">
                  {formatCurrencyCRC(montoTotalPagar)}
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenConfirmModal(false)}
                disabled={registrarYAplicarPagoMut.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => registrarYAplicarPagoMut.mutate()}
                disabled={registrarYAplicarPagoMut.isPending}
              >
                {registrarYAplicarPagoMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Procesando transacción...
                  </>
                ) : (
                  'Confirmar Pago Definitivo'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

