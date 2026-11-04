import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { facturacionPagoApi, type CajaFactura, type CajaReporte } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/forms/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrencyCRC, formatDate } from '@/lib/utils';

export function PagosMunicipalesPage() {
 const qc = useQueryClient();
 const [busqueda,setBusqueda] = useState('');
 const [idFactura,setIdFactura] = useState<number | null>(null);
 const [reporte,setReporte] = useState<CajaReporte | null>(null);
 const [medio,setMedio] = useState(0);
 const [monto,setMonto] = useState('');
 const [comprobante,setComprobante] = useState('');
 const [verificado,setVerificado] = useState(false);
 const [confirmar,setConfirmar] = useState(false);
 const [recibo,setRecibo] = useState<{ id: number; monto: number; factura: number; saldo: number } | null>(null);
 const facturas = useQuery({queryKey:['facturacion','caja-facturas'],queryFn:()=>facturacionPagoApi.cajaFacturas()});
 const reportes = useQuery({queryKey:['facturacion','caja-reportes'],queryFn:()=>facturacionPagoApi.cajaReportes()});
 const medios = useQuery({queryKey:['facturacion','medios-pago'],queryFn:()=>facturacionPagoApi.mediosPago()});
 const seleccionada = (facturas.data ?? []).find(f=>f.idFactura===idFactura);
 const numero = Number(monto);
 const medioElegido = (medios.data ?? []).find(m=>m.idMedioPago===medio);
 const medioBancario = /SINPE|TRANSFER/i.test(medioElegido?.nombreMedioPago || '');
 const montoValido = monto.trim()!=='' && Number.isFinite(numero) && numero>0 && numero<=(seleccionada?.saldoPendiente ?? 0) && Math.abs(numero*100-Math.round(numero*100))<0.000001;
 const puedeCobrar = Boolean(seleccionada && medioElegido && montoValido && comprobante.trim() && verificado && (!reporte || medioBancario));
 const seleccionar = (f: CajaFactura, r: CajaReporte | null = null) => {
  setIdFactura(f.idFactura);setReporte(r);setMedio(0);setMonto(r ? String(r.monto) : '');
  setComprobante(r?.comprobante ?? '');setVerificado(false);setConfirmar(false);setRecibo(null);
 };
 const cargarReporte = (r: CajaReporte) => {
  const f = (facturas.data ?? []).find(f=>f.idFactura===r.idFactura);
  if (!f) {toast.error('La factura del reporte no tiene saldo disponible o no pudo consultarse.');return;}
  seleccionar(f,r);
 };
 const cobrar = useMutation({
  mutationFn: async () => {
   if (!puedeCobrar || !seleccionada) throw new Error('Revise factura, monto, medio, comprobante y confirmación de recepción.');
   const f=seleccionada;
   const res = await facturacionPagoApi.cobroCaja({idFactura:f.idFactura,montoPago:numero,idMedioPago:medio,comprobante:comprobante.trim(),idReporteAsociado:reporte?.idReporteTransferencia ?? null});
   return {id:res.data.idPagoMunicipal,monto:res.data.montoPagado,factura:f.idFactura,saldo:Number((f.saldoPendiente-numero).toFixed(2))};
  },
  onSuccess: r=>{
   setRecibo(r);setConfirmar(false);setIdFactura(null);setReporte(null);setMonto('');setComprobante('');setMedio(0);setVerificado(false);
   toast.success(`Pago #${r.id} aplicado a factura #${r.factura}.`);
   qc.invalidateQueries({queryKey:['facturacion']});qc.invalidateQueries({queryKey:['tributos']});
  },
  onError:(e:Error)=>{toast.error(e.message);setConfirmar(false);qc.invalidateQueries({queryKey:['facturacion']});},
 });
 const filtradas=(facturas.data ?? []).filter(f=>[String(f.idFactura),f.contribuyentes,f.numeroFinca,f.nombreTributo,f.periodoDeuda].some(v=>v.toLowerCase().includes(busqueda.trim().toLowerCase())));
 return <div className="space-y-6">
  <PageHeader title="Caja y pagos municipales" subtitle="Seleccione una factura existente o verifique un reporte ciudadano antes de aplicar el pago." actions={<Button variant="secondary" disabled={cobrar.isPending} onClick={()=>qc.invalidateQueries({queryKey:['facturacion']})}>Recargar datos</Button>} />
  {recibo && <Card><CardContent className="pt-6 space-y-2"><p className="font-semibold">Pago #{recibo.id} registrado y aplicado</p><p>Factura #{recibo.factura} · Abono: {formatCurrencyCRC(recibo.monto)} · Saldo resultante: {formatCurrencyCRC(recibo.saldo)}</p></CardContent></Card>}
  <Card><CardHeader><CardTitle>Transferencias pendientes de verificación</CardTitle></CardHeader><CardContent className="space-y-3">
   <p className="text-sm">El reporte ciudadano no acredita por sí mismo la recepción del dinero. Selecciónelo, verifique la recepción y confirme su aplicación.</p>
   {reportes.isLoading ? <LoadingState message="Consultando reportes..." /> : reportes.isError ? <ErrorState error={reportes.error} onRetry={()=>reportes.refetch()} /> : !reportes.data?.length ? <p>No hay reportes pendientes.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Reporte / factura</th><th className="p-2">Contribuyente</th><th className="p-2">Referencia</th><th className="p-2">Monto</th><th className="p-2">Fecha</th><th className="p-2">Acción</th></tr></thead><tbody>
    {reportes.data.map(r=><tr key={r.idReporteTransferencia} className="border-t"><td className="p-2">#{r.idReporteTransferencia} / #{r.idFactura}</td><td className="p-2">{r.contribuyente} (#{r.idContribuyente})</td><td className="p-2">{r.comprobante}</td><td className="p-2">{formatCurrencyCRC(r.monto)}</td><td className="p-2">{formatDate(r.fechaReporte)}</td><td className="p-2"><Button disabled={cobrar.isPending || facturas.isLoading || facturas.isError} onClick={()=>cargarReporte(r)}>Revisar reporte</Button></td></tr>)}
   </tbody></table></div>}
  </CardContent></Card>
  <div className="grid gap-6 xl:grid-cols-3"><Card className="xl:col-span-2"><CardHeader><CardTitle>Facturas pendientes de cobro</CardTitle></CardHeader><CardContent className="space-y-4">
   <Input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por factura, contribuyente, finca, tributo o periodo" aria-label="Buscar factura pendiente" />
   {facturas.isLoading ? <LoadingState message="Consultando facturas..." /> : facturas.isError ? <ErrorState error={facturas.error} onRetry={()=>facturas.refetch()} /> : !filtradas.length ? <EmptyState title="No hay facturas pendientes con ese criterio" /> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Factura / titular</th><th className="p-2">Tributo / finca</th><th className="p-2">Vencimiento</th><th className="p-2">Total</th><th className="p-2">Abonado</th><th className="p-2">Saldo</th><th className="p-2">Acción</th></tr></thead><tbody>
    {filtradas.map(f=><tr key={f.idFactura} className={idFactura===f.idFactura?'border-t bg-blue-50':'border-t'}><td className="p-2">#{f.idFactura}<br />{f.contribuyentes}</td><td className="p-2">{f.nombreTributo}<br />{f.periodoDeuda}<br />{f.numeroFinca}</td><td className="p-2">{formatDate(f.fechaDeVencimiento)}</td><td className="p-2">{formatCurrencyCRC(f.totalAPagar)}</td><td className="p-2">{formatCurrencyCRC(f.totalAPagar-f.saldoPendiente)}</td><td className="p-2">{formatCurrencyCRC(f.saldoPendiente)}</td><td className="p-2"><Button variant="secondary" disabled={cobrar.isPending} onClick={()=>seleccionar(f)}>Seleccionar</Button></td></tr>)}
   </tbody></table></div>}
  </CardContent></Card>
  <Card><CardHeader><CardTitle>Registrar y aplicar pago</CardTitle></CardHeader><CardContent className="space-y-4">
   {!seleccionada ? <p>Seleccione explícitamente una factura o un reporte pendiente.</p> : <>
    <p className="font-semibold">Factura #{seleccionada.idFactura} · Saldo {formatCurrencyCRC(seleccionada.saldoPendiente)}</p>
    <p className="text-sm">{reporte ? `Reporte #${reporte.idReporteTransferencia} de ${reporte.contribuyente}` : seleccionada.contribuyentes}</p>
    {medios.isError && <ErrorState error={medios.error} onRetry={()=>medios.refetch()} />}
    <FormField label="Medio de pago" required><Select value={medio} disabled={cobrar.isPending || medios.isLoading} onChange={e=>setMedio(Number(e.target.value))}><option value={0}>— Seleccione un medio —</option>{(medios.data ?? []).filter(m=>!reporte || /SINPE|TRANSFER/i.test(m.nombreMedioPago)).map(m=><option key={m.idMedioPago} value={m.idMedioPago}>{m.nombreMedioPago}</option>)}</Select></FormField>
    <FormField label="Monto recibido (₡)" required><Input type="number" min="0.01" step="0.01" max={seleccionada.saldoPendiente} value={monto} disabled={Boolean(reporte) || cobrar.isPending} onChange={e=>{setMonto(e.target.value);setVerificado(false);}} /></FormField>
    <FormField label="Comprobante o referencia" required><Input value={comprobante} maxLength={50} disabled={Boolean(reporte) || cobrar.isPending} onChange={e=>{setComprobante(e.target.value);setVerificado(false);}} /></FormField>
    {reporte && <p className="text-xs">Monto y referencia se toman del reporte y deben coincidir con lo recibido. No se modifican durante su aplicación.</p>}
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={verificado} disabled={cobrar.isPending} onChange={e=>setVerificado(e.target.checked)} />Confirmo que verifiqué la recepción del dinero correspondiente.</label>
    <p>Saldo después del abono: {montoValido ? formatCurrencyCRC(seleccionada.saldoPendiente-numero) : '—'}</p>
    <Button disabled={!puedeCobrar || cobrar.isPending} onClick={()=>setConfirmar(true)}>Confirmar y aplicar pago</Button>
   </>}
  </CardContent></Card></div>
  <ConfirmDialog open={confirmar} onClose={()=>{if(!cobrar.isPending)setConfirmar(false);}} title="Confirmar aplicación del pago" description="Se registrará el dinero recibido y se aplicará a la factura existente en una sola operación." confirmLabel="Confirmar pago" isPending={cobrar.isPending} onConfirm={()=>cobrar.mutate()} impactSummary={<div className="space-y-2"><p>Factura #{idFactura} · {reporte?.contribuyente || seleccionada?.contribuyentes}</p><p>Referencia: {comprobante}</p><p>Monto: {formatCurrencyCRC(numero || 0)}</p><p>Saldo resultante: {formatCurrencyCRC((seleccionada?.saldoPendiente ?? 0)-(numero || 0))}</p></div>} />
 </div>;
}
