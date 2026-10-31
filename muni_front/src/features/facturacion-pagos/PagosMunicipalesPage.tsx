import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  Receipt,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { facturacionPagoApi, tributoDeudaApi } from '@/services/api';
import type { VwFacturasPendiente } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/forms/FormField';
import { formatCurrencyCRC, formatDate } from '@/lib/utils';

export function PagosMunicipalesPage() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [filtroTributo, setFiltroTributo] = useState('TODOS');
  const [selectedFacturaId, setSelectedFacturaId] = useState<number | null>(null);

  // Estado del formulario de pago (Panel derecho del Wireframe Caja y Facturación Municipal)
  const [selectedMedioPagoId, setSelectedMedioPagoId] = useState<number>(1);
  const [comprobante, setComprobante] = useState<string>('');
  const [montoPrincipalInput, setMontoPrincipalInput] = useState<string>('');
  const [montoInteresInput, setMontoInteresInput] = useState<string>('0');
  const [montoRecargoInput, setMontoRecargoInput] = useState<string>('0');
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  // Buscador puntual de factura por clave Hacienda
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

  const tributosUnicos = Array.from(
    new Set((facturasPendientesQuery.data ?? []).map((f) => f.nombreTributo))
  );

  const facturasFiltradas = (facturasPendientesQuery.data ?? []).filter((f) => {
    if (filtroTributo !== 'TODOS' && f.nombreTributo !== filtroTributo) return false;
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

  const principalNum = Number(montoPrincipalInput) || (selectedFactura?.saldoPendiente ?? 0);
  const interesNum = Number(montoInteresInput) || 0;
  const recargoNum = Number(montoRecargoInput) || 0;
  const montoTotalPagar = Number((principalNum + interesNum + recargoNum).toFixed(2));

  const registrarYAplicarPagoMut = useMutation({
    mutationFn: async () => {
      if (!selectedFactura) throw new Error('Seleccione una factura pendiente.');
      if (montoTotalPagar <= 0) throw new Error('El monto a pagar debe ser mayor a cero.');
      if (!comprobante.trim()) throw new Error('Ingrese el número de comprobante o referencia.');

      const pagoRes = await facturacionPagoApi.registrarPago({
        idContribuyente: selectedFactura.idContribuyente,
        idMedioPago: selectedMedioPagoId,
        montoTotalPagado: montoTotalPagar,
        comprobante: comprobante.trim(),
      });

      const nuevoIdPago = pagoRes.data;

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
        `Pago #${idPago} registrado y aplicado exitosamente a la Factura #${selectedFactura?.idFactura}.`
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
    <div className="space-y-6">
      <PageHeader
        title="Caja y Facturación Municipal"
        subtitle="Selección de saldos pendientes por facturar, clave numérica de Hacienda (50 dígitos) y registro de pago en ventanilla."
        badge={`${facturasFiltradas.length} saldos pendientes`}
        icon={<Receipt className="h-6 w-6" />}
        actions={
          <Button
            variant="secondary"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['facturacion'] })}
          >
            <RefreshCw className="h-4 w-4" /> Actualizar Caja
          </Button>
        }
      />

      {facturasPendientesQuery.isLoading ? (
        <LoadingState message="Consultando saldos y facturas pendientes en SQL Server..." />
      ) : facturasPendientesQuery.isError ? (
        <ErrorState
          error={facturasPendientesQuery.error}
          onRetry={() => facturasPendientesQuery.refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* COLUMNA IZQUIERDA (8 COLS): SALDOS PENDIENTES POR FACTURAR + RESUMEN Y CLAVE HACIENDA */}
          <div className="space-y-6 xl:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Saldos Pendientes por Facturar</CardTitle>
                <CardDescription>
                  Marque una obligación pendiente para cargar su importe y clave numérica de
                  Hacienda en la caja recaudadora.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <SearchInput
                      value={busqueda}
                      onChange={setBusqueda}
                      placeholder="Buscar por contribuyente, finca, tributo o clave..."
                    />
                  </div>
                  <div className="w-full sm:w-56">
                    <Select
                      value={filtroTributo}
                      onChange={(e) => setFiltroTributo(e.target.value)}
                    >
                      <option value="TODOS">Filtrar: Todos los tributos</option>
                      {tributosUnicos.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {facturasFiltradas.length === 0 ? (
                  <EmptyState
                    title="No hay facturas pendientes de cobro"
                    description="Puede emitir nuevas facturas desde el módulo de Estado de Cuenta y Cobro."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-[10px] border border-[#E5E7EB]">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] font-bold uppercase text-[#4B5563]">
                          <th className="px-3.5 py-3 w-10 text-center">Sel.</th>
                          <th className="px-3.5 py-3">Tributo</th>
                          <th className="px-3.5 py-3">Finca</th>
                          <th className="px-3.5 py-3">Vencimiento</th>
                          <th className="px-3.5 py-3">Principal (₡)</th>
                          <th className="px-3.5 py-3">Abonado (₡)</th>
                          <th className="px-3.5 py-3 text-right">Total Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {facturasFiltradas.map((f) => {
                          const isSelected = selectedFactura?.idFactura === f.idFactura;
                          return (
                            <tr
                              key={f.idFactura}
                              onClick={() => selectFacturaAndPrefill(f)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                              }`}
                            >
                              <td className="px-3.5 py-3 text-center">
                                <span
                                  className={`inline-flex h-5 w-5 items-center justify-center rounded-[6px] border ${
                                    isSelected
                                      ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                                      : 'border-[#D1D5DB] bg-white text-transparent'
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              </td>
                              <td className="px-3.5 py-3">
                                <p className="font-bold text-[#171717]">
                                  {f.nombreTributo} {f.periodoDeuda}
                                </p>
                                <p className="text-[11px] text-[#6B7280]">
                                  {f.contribuyente || `Contribuyente #${f.idContribuyente}`} ·
                                  Factura #{f.idFactura}
                                </p>
                              </td>
                              <td className="px-3.5 py-3 font-mono font-semibold text-[#1E3A8A]">
                                {f.numeroFinca}
                              </td>
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                {formatDate(f.fechaDeVencimiento)}
                              </td>
                              <td className="px-3.5 py-3">{formatCurrencyCRC(f.subtotal)}</td>
                              <td className="px-3.5 py-3 text-[#15803D]">
                                {formatCurrencyCRC(f.totalAbonado)}
                              </td>
                              <td className="px-3.5 py-3 text-right font-extrabold text-[#171717]">
                                {formatCurrencyCRC(f.saldoPendiente)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TARJETA INFERIOR IZQUIERDA DEL WIREFRAME: SUBTOTAL, INTERESES, TOTAL A PAGAR Y CLAVE NUMÉRICA HACIENDA */}
            {selectedFactura && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2 border-b border-[#E5E7EB] pb-4 text-sm">
                    <div className="flex items-center justify-between text-[#4B5563]">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-[#171717]">
                        {formatCurrencyCRC(selectedFactura.subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#4B5563]">
                      <span>Intereses / Recargos:</span>
                      <span className="font-semibold text-[#171717]">
                        {formatCurrencyCRC(interesNum + recargoNum)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-lg font-extrabold text-[#171717]">
                      <span>Total a Pagar</span>
                      <span>Total a Pagar: {formatCurrencyCRC(montoTotalPagar)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#171717]">
                      Clave Numérica Hacienda (Factura Electrónica)
                    </label>
                    <div className="rounded-[10px] border border-[#D1D5DB] bg-[#F8FAFC] px-4 py-3 font-mono text-xs font-semibold text-[#171717]">
                      {selectedFactura.claveNumericaHacienda}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Verificador puntual de comprobante electrónico */}
            <Card>
              <CardHeader>
                <CardTitle>Verificar Comprobante Electrónico por Clave Hacienda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Pegue aquí la Clave Numérica de Hacienda de 50 dígitos..."
                  value={consultaClaveHacienda}
                  onChange={(e) => setConsultaClaveHacienda(e.target.value)}
                  className="font-mono text-xs"
                />
                {consultarFacturaPuntualQuery.data &&
                  consultarFacturaPuntualQuery.data.length > 0 && (
                    <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-xs">
                      {consultarFacturaPuntualQuery.data.map((fc) => (
                        <div key={fc.idFactura} className="flex justify-between">
                          <span>
                            Factura #{fc.idFactura} · {fc.nombreTributo} ({fc.periodoDeuda})
                          </span>
                          <Badge variant="blue">
                            Saldo: {formatCurrencyCRC(fc.saldoPendiente)} ({fc.estadoFactura})
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* COLUMNA DERECHA (4 COLS): REGISTRO DE PAGO (EXACTO AL WIREFRAME) */}
          <div className="xl:col-span-4">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Registro de Pago</CardTitle>
                <CardDescription>
                  Factura seleccionada: <strong>#{selectedFactura?.idFactura ?? '—'}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Píldoras de Método de Pago (Efectivo, Tarjeta, SINPE Móvil, Transferencia) */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#171717]">
                    Método de pago
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(mediosPagoQuery.data ?? []).map((mp) => {
                      const active = mp.idMedioPago === selectedMedioPagoId;
                      return (
                        <button
                          key={mp.idMedioPago}
                          type="button"
                          onClick={() => setSelectedMedioPagoId(mp.idMedioPago)}
                          className={`flex h-[42px] items-center justify-center gap-2 rounded-[10px] border px-3 text-xs font-semibold transition-all ${
                            active
                              ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1E3A8A] ring-2 ring-[#1D4ED8]/20'
                              : 'border-[#D1D5DB] bg-white text-[#171717] hover:bg-[#F9FAFB]'
                          }`}
                        >
                          {getMedioIcon(mp.nombreMedioPago)}
                          <span className="truncate">{mp.nombreMedioPago}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <FormField label="Monto Recibido / Principal (₡)" required>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="₡ 0.00"
                    value={montoPrincipalInput || (selectedFactura?.saldoPendiente ?? '')}
                    onChange={(e) => setMontoPrincipalInput(e.target.value)}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
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

                <FormField label="Comprobante Bancario" required>
                  <Input
                    maxLength={50}
                    placeholder="Comprobante Bancario o Recibo"
                    value={comprobante}
                    onChange={(e) => setComprobante(e.target.value)}
                  />
                </FormField>

                {selectedFactura && !comprobante && (
                  <button
                    type="button"
                    onClick={() => selectFacturaAndPrefill(selectedFactura)}
                    className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                  >
                    Autocompletar monto y comprobante de Factura #{selectedFactura.idFactura}
                  </button>
                )}

                <Button
                  type="button"
                  className="w-full"
                  disabled={!selectedFactura || montoTotalPagar <= 0 || !comprobante.trim()}
                  onClick={() => setOpenConfirmModal(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Registrar Pago y Emitir Factura
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN DE PAGO */}
      <ConfirmDialog
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="Confirmar Registro y Aplicación de Pago Municipal"
        description="El pago se registrará en dbo.Pago_Municipal y se imputará a la factura seleccionada."
        confirmLabel="Confirmar Pago Definitivo"
        isPending={registrarYAplicarPagoMut.isPending}
        onConfirm={() => registrarYAplicarPagoMut.mutate()}
        impactSummary={
          selectedFactura && (
            <div className="space-y-1.5">
              <p>
                <strong>Contribuyente:</strong> {selectedFactura.contribuyente} (#
                {selectedFactura.idContribuyente})
              </p>
              <p>
                <strong>Factura Destino:</strong> #{selectedFactura.idFactura} —{' '}
                {selectedFactura.nombreTributo} ({selectedFactura.periodoDeuda})
              </p>
              <p>
                <strong>Comprobante:</strong> <code className="font-mono">{comprobante}</code>
              </p>
              <p>
                <strong>Total a Cobrar:</strong>{' '}
                <span className="font-extrabold text-[#1E3A8A]">
                  {formatCurrencyCRC(montoTotalPagar)}
                </span>
              </p>
            </div>
          )
        }
      />
    </div>
  );
}
