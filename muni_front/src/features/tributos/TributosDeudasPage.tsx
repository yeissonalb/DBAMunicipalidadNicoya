import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Calculator,
  FilePlus,
  Loader2,
  Plus,
  RefreshCw,
  Scale,
  Search,
} from 'lucide-react';
import {
  contribuyenteApi,
  facturacionPagoApi,
  tributoDeudaApi,
} from '@/services/api';
import type { SpDeudasContribuyenteResultDto } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { formatCurrencyCRC, formatDate, formatNumber } from '@/lib/utils';

const registrarDeudaSchema = z.object({
  periodoDeuda: z.string().trim().min(2, 'Periodo requerido (ej. I Trimestre 2026)').max(150),
  montoPrincipal: z.coerce.number().positive('Monto principal debe ser mayor a 0'),
  montoIntereses: z.coerce.number().min(0, 'No puede ser negativo'),
  montoMultas: z.coerce.number().min(0, 'No puede ser negativo'),
  fechaDeVencimiento: z.string().min(1, 'Fecha de vencimiento requerida'),
  idInmueble: z.coerce.number().int().min(1, 'Indique el ID del inmueble'),
  idTipoTributo: z.coerce.number().int().min(1, 'Seleccione el tipo de tributo'),
  codigoEstadoDeuda: z.string().min(1),
});

type RegistrarDeudaForm = z.infer<typeof registrarDeudaSchema>;

function generarClaveHacienda50(idDeuda: number): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const consecutivo = String(idDeuda).padStart(10, '0');
  const rand = String(Math.floor(10000000 + Math.random() * 90000000));
  const base = `506${dd}${mm}${yy}00301014200000001${consecutivo}1${rand}`;
  return base.slice(0, 50).padEnd(50, '0');
}

export function TributosDeudasPage() {
  const queryClient = useQueryClient();
  const [selectedContribuyenteId, setSelectedContribuyenteId] = useState<number>(1);
  const [openDeudaModal, setOpenDeudaModal] = useState(false);
  const [facturarDeudaTarget, setFacturarDeudaTarget] =
    useState<SpDeudasContribuyenteResultDto | null>(null);
  const [claveHacienda, setClaveHacienda] = useState('');
  const [descuentosFactura, setDescuentosFactura] = useState<string>('0');
  const [tasaInteresOpcional, setTasaInteresOpcional] = useState<string>('');

  const tiposTributoQuery = useQuery({
    queryKey: ['tributos', 'tipos'],
    queryFn: () => tributoDeudaApi.tiposTributo(),
  });

  const estadoCuentaGeneralQuery = useQuery({
    queryKey: ['facturacion', 'estado-cuenta-general'],
    queryFn: () => facturacionPagoApi.estadoCuentaGeneral(),
  });

  const padronQuery = useQuery({
    queryKey: ['contribuyentes', 'padron-tributos'],
    queryFn: () => contribuyenteApi.padron(),
  });

  const deudasContribuyenteQuery = useQuery({
    queryKey: ['tributos', 'deudas-contribuyente', selectedContribuyenteId],
    queryFn: () => tributoDeudaApi.deudasContribuyente(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  const estadoCuentaIndividualQuery = useQuery({
    queryKey: ['facturacion', 'estado-cuenta-indiv', selectedContribuyenteId],
    queryFn: () => facturacionPagoApi.estadoCuentaContribuyente(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  // vw_estado_cuenta_contribuyente trae una fila por deuda (y por copropietario):
  // se agrupa por contribuyente solo para presentar el consolidado.
  const resumenPorContribuyente = useMemo(() => {
    const mapa = new Map<
      number,
      {
        idContribuyente: number;
        contribuyente: string;
        identificacion: string;
        fincas: Set<string>;
        deudas: Set<number>;
        deudasPendientesOVencidas: number;
        totalDeudasRegistradas: number;
        montoTotalDeudas: number;
        montoPendienteDeuda: number;
        totalFacturado: number;
        totalPagadoHistorico: number;
        cantidadInmuebles: number;
      }
    >();
    for (const r of estadoCuentaGeneralQuery.data ?? []) {
      let c = mapa.get(r.idContribuyente);
      if (!c) {
        c = {
          idContribuyente: r.idContribuyente,
          contribuyente: r.nombreORazonSocial ?? '—',
          identificacion: r.identificacionOficial ?? '',
          fincas: new Set(),
          deudas: new Set(),
          deudasPendientesOVencidas: 0,
          totalDeudasRegistradas: 0,
          montoTotalDeudas: 0,
          montoPendienteDeuda: 0,
          totalFacturado: 0,
          totalPagadoHistorico: 0,
          cantidadInmuebles: 0,
        };
        mapa.set(r.idContribuyente, c);
      }
      if (r.numeroFinca) c.fincas.add(r.numeroFinca);
      if (c.deudas.has(r.idDeudaMunicipal)) continue;
      c.deudas.add(r.idDeudaMunicipal);
      c.totalDeudasRegistradas += 1;
      if (r.codigoEstadoDeuda === 'PEND' || r.codigoEstadoDeuda === 'VENC') c.deudasPendientesOVencidas += 1;
      c.montoTotalDeudas += r.totalDeuda ?? 0;
      if (r.idFactura) {
        c.totalFacturado += r.totalAPagar ?? 0;
        c.totalPagadoHistorico += Math.max(0, (r.totalAPagar ?? 0) - (r.saldoPendiente ?? 0));
        c.montoPendienteDeuda += r.saldoPendiente ?? 0;
      } else if (r.codigoEstadoDeuda !== 'PAG') {
        c.montoPendienteDeuda += r.totalDeuda ?? 0;
      }
    }
    return Array.from(mapa.values()).map((c) => ({ ...c, cantidadInmuebles: c.fincas.size }));
  }, [estadoCuentaGeneralQuery.data]);

  const deudaForm = useForm<RegistrarDeudaForm>({
    resolver: zodResolver(registrarDeudaSchema),
    defaultValues: {
      periodoDeuda: 'II Trimestre 2026',
      montoPrincipal: 45000,
      montoIntereses: 0,
      montoMultas: 0,
      fechaDeVencimiento: '2026-06-30',
      idInmueble: 1,
      idTipoTributo: 1,
      codigoEstadoDeuda: 'PEND',
    },
  });

  const registrarDeudaMut = useMutation({
    mutationFn: (dto: RegistrarDeudaForm) => tributoDeudaApi.registrarDeuda(dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Deuda municipal registrada'} (ID #${res.data})`);
      setOpenDeudaModal(false);
      queryClient.invalidateQueries({ queryKey: ['tributos'] });
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const recalcularMut = useMutation({
    mutationFn: (idDeuda: number) =>
      tributoDeudaApi.recalcularIntereses(
        idDeuda,
        tasaInteresOpcional.trim()
          ? { tasaInteresMensual: Number(tasaInteresOpcional) }
          : undefined
      ),
    onSuccess: (res) => {
      toast.success(
        res.message || 'Recargos e intereses recalculados directamente por SQL Server.'
      );
      queryClient.invalidateQueries({ queryKey: ['tributos'] });
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cambiarEstadoDeudaMut = useMutation({
    mutationFn: ({
      idDeuda,
      codigo,
    }: {
      idDeuda: number;
      codigo: 'PEND' | 'PAG' | 'VENC' | 'ARR';
    }) => tributoDeudaApi.actualizarEstadoDeuda(idDeuda, { codigoEstadoDeuda: codigo }),
    onSuccess: (res) => {
      toast.success(res.message || 'Estado de deuda actualizado.');
      queryClient.invalidateQueries({ queryKey: ['tributos'] });
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generarFacturaMut = useMutation({
    mutationFn: () => {
      if (!facturarDeudaTarget) throw new Error('Seleccione una deuda.');
      return facturacionPagoApi.generarFactura({
        idDeudaMunicipal: facturarDeudaTarget.idDeudaMunicipal,
        claveNumericaHacienda: claveHacienda.trim(),
        descuentos: Number(descuentosFactura) || 0,
      });
    },
    onSuccess: (res) => {
      toast.success(`${res.message || 'Factura emitida'} (ID Factura #${res.data})`);
      setFacturarDeudaTarget(null);
      queryClient.invalidateQueries({ queryKey: ['tributos'] });
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Tributos, deudas y estado de cuenta"
        subtitle="Administre cargos municipales, saldos pendientes, recargos y facturación de los contribuyentes."
        badge={`${tiposTributoQuery.data?.length ?? 0} tributos activos`}
        icon={<Scale className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['tributos'] });
                queryClient.invalidateQueries({ queryKey: ['facturacion'] });
              }}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button size="sm" onClick={() => setOpenDeudaModal(true)}>
              <Plus className="h-4 w-4" /> Registrar deuda
            </Button>
          </>
        }
      />

      {/* Catálogo de Tipos de Tributo (sp_consultar_tipos_tributo) */}
      <section>
        <div className="mb-4">
          <p className="section-label">Catálogo tributario</p>
          <h2 className="mt-1 text-lg font-bold text-[#26352D]">Tributos municipales</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {(tiposTributoQuery.data ?? []).map((t) => (
          <Card key={t.idTipoTributo} className="flex h-full flex-col overflow-hidden border-[#C9D9D0] hover:shadow-elevated">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="gold">{t.codigoTributo}</Badge>
                <span className="text-[11px] font-semibold text-[#5A6B61]">{t.periodicidad}</span>
              </div>
              <CardTitle className="mt-3 min-h-10 text-sm leading-snug">{t.nombreTributo}</CardTitle>
            </CardHeader>
            <CardContent className="mt-auto space-y-1.5 text-xs text-[#5A6B61]">
              <p>
                <strong>Base de cálculo:</strong> {t.baseCalculo}
              </p>
              {t.tarifa !== null && (
                <p>
                  <strong>Tarifa:</strong> {formatNumber(t.tarifa, 4)}
                </p>
              )}
              {t.montoFijo !== null && (
                <p>
                  <strong>Monto fijo:</strong> {formatCurrencyCRC(t.montoFijo)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      </section>

      {/* Estado de Cuenta Consolidado General (vw_estado_cuenta_contribuyente) */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
          <CardTitle>Estado de cuenta consolidado</CardTitle>
          <CardDescription>
            Haga clic en un contribuyente para inspeccionar el desglose de sus deudas, intereses y
            facturas abajo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {estadoCuentaGeneralQuery.isLoading ? (
            <LoadingState message="Consultando estado de cuenta general..." />
          ) : estadoCuentaGeneralQuery.isError ? (
            <ErrorState
              error={estadoCuentaGeneralQuery.error}
              onRetry={() => estadoCuentaGeneralQuery.refetch()}
            />
          ) : (
            <div className="overflow-x-auto" role="region" aria-label="Estado de cuenta consolidado" tabIndex={0}>
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                    <th className="px-3 py-2.5">ID</th>
                    <th className="px-3 py-2.5">Contribuyente</th>
                    <th className="px-3 py-2.5">Fincas</th>
                    <th className="px-3 py-2.5">Deudas Pend./Venc.</th>
                    <th className="px-3 py-2.5">Total Deudas</th>
                    <th className="px-3 py-2.5">Saldo Pendiente</th>
                    <th className="px-3 py-2.5">Total Facturado</th>
                    <th className="px-3 py-2.5">Total Pagado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {resumenPorContribuyente.map((c) => {
                    const isSelected = c.idContribuyente === selectedContribuyenteId;
                    return (
                      <tr
                        key={c.idContribuyente}
                        onClick={() => setSelectedContribuyenteId(c.idContribuyente)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#E8F0EC] shadow-[inset_4px_0_0_#164B35]' : 'even:bg-[#FAFCFB] hover:bg-[#F5F7F4]'
                        }`}
                      >
                        <td className="px-3 py-2.5 font-mono font-bold text-[#164B35]">
                          #{c.idContribuyente}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-[#26352D]">{c.contribuyente}</p>
                          <p className="font-mono text-[11px] text-[#5A6B61]">
                            {c.identificacion}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">{c.cantidadInmuebles}</td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={
                              c.deudasPendientesOVencidas > 0 ? 'warning' : 'success'
                            }
                          >
                            {c.deudasPendientesOVencidas} de {c.totalDeudasRegistradas}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 font-medium">
                          {formatCurrencyCRC(c.montoTotalDeudas)}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-amber-800">
                          {formatCurrencyCRC(c.montoPendienteDeuda)}
                        </td>
                        <td className="px-3 py-2.5">{formatCurrencyCRC(c.totalFacturado)}</td>
                        <td className="px-3 py-2.5 font-semibold text-emerald-800">
                          {formatCurrencyCRC(c.totalPagadoHistorico)}
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

      {/* Deudas del Contribuyente Seleccionado + Recálculo BD */}
      <Card className="overflow-hidden border-[#D7C28E]">
        <CardHeader className="flex flex-col gap-4 border-b border-[#E9DFC4] bg-[#FBF7EE] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>
              Deudas Municipales del Contribuyente #{selectedContribuyenteId}
            </CardTitle>
            <CardDescription>Consulte cargos, recalcule recargos autorizados y genere facturas.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedContribuyenteId}
              onChange={(e) => setSelectedContribuyenteId(Number(e.target.value))}
              className="w-64"
            >
              {(padronQuery.data ?? []).map((p) => (
                <option key={p.idContribuyente} value={p.idContribuyente}>
                  #{p.idContribuyente} — {p.nombreORazonSocial}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              step="0.001"
              placeholder="Tasa mensual opc. (ej. 0.02)"
              value={tasaInteresOpcional}
              onChange={(e) => setTasaInteresOpcional(e.target.value)}
              className="w-48"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-6">
          {deudasContribuyenteQuery.isLoading ? (
            <LoadingState message="Consultando deudas del contribuyente..." />
          ) : !deudasContribuyenteQuery.data || deudasContribuyenteQuery.data.length === 0 ? (
            <EmptyState title="Este contribuyente no registra deudas municipales" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#DCE3DE]" role="region" aria-label="Deudas del contribuyente" tabIndex={0}>
              <table className="w-full min-w-[1250px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                    <th className="px-3 py-2.5">Deuda ID</th>
                    <th className="px-3 py-2.5">Tributo / Periodo</th>
                    <th className="px-3 py-2.5">Finca</th>
                    <th className="px-3 py-2.5">Vencimiento / Mora</th>
                    <th className="px-3 py-2.5">Principal</th>
                    <th className="px-3 py-2.5">Intereses</th>
                    <th className="px-3 py-2.5">Multas</th>
                    <th className="px-3 py-2.5">Monto Total (BD)</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5 text-right">Acciones BD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {deudasContribuyenteQuery.data.map((d) => (
                    <tr key={d.idDeudaMunicipal} className="even:bg-[#FAFCFB] transition-colors hover:bg-[#E8F0EC]/55">
                      <td className="px-3 py-2.5 font-mono font-bold text-[#164B35]">
                        #{d.idDeudaMunicipal}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-[#26352D]">{d.nombreTributo}</p>
                        <p className="text-[#5A6B61]">{d.periodoDeuda}</p>
                      </td>
                      <td className="px-3 py-2.5 font-mono">{d.numeroFinca}</td>
                      <td className="px-3 py-2.5">
                        <p>{formatDate(d.fechaDeVencimiento)}</p>
                        {d.codigoEstadoDeuda !== 'PAG' &&
                          new Date(d.fechaDeVencimiento).getTime() < Date.now() && (
                            <span className="font-bold text-red-600">Vencida</span>
                          )}
                      </td>
                      <td className="px-3 py-2.5">{formatCurrencyCRC(d.montoPrincipal)}</td>
                      <td className="px-3 py-2.5 text-amber-800">
                        {formatCurrencyCRC(d.montoIntereses)}
                      </td>
                      <td className="px-3 py-2.5 text-red-700">
                        {formatCurrencyCRC(d.montoMultas)}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-[#164B35]">
                        {formatCurrencyCRC(d.montoTotal)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Select
                          value={d.codigoEstadoDeuda ?? ''}
                          onChange={(e) =>
                            cambiarEstadoDeudaMut.mutate({
                              idDeuda: d.idDeudaMunicipal,
                              codigo: e.target.value as 'PEND' | 'PAG' | 'VENC' | 'ARR',
                            })
                          }
                          className="h-8 text-xs w-28"
                        >
                          <option value="PEND">PEND</option>
                          <option value="VENC">VENC</option>
                          <option value="ARR">ARR</option>
                          <option value="PAG">PAG</option>
                        </Select>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => recalcularMut.mutate(d.idDeudaMunicipal)}
                            disabled={recalcularMut.isPending}
                            title="Recalcular intereses y recargos"
                          >
                            <Calculator className="h-3.5 w-3.5" /> Recalcular
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => {
                              setFacturarDeudaTarget(d);
                              setClaveHacienda(generarClaveHacienda50(d.idDeudaMunicipal));
                              setDescuentosFactura('0');
                            }}
                            title="Emitir factura electrónica"
                          >
                            <FilePlus className="h-3.5 w-3.5" /> Facturar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Resumen Estado de Cuenta Individual (sp_consultar_estado_cuenta) */}
          {estadoCuentaIndividualQuery.data && estadoCuentaIndividualQuery.data.length > 0 && (
            <div className="mt-4 rounded-lg border border-[#DCE3DE] bg-[#F5F7F4] p-3 text-xs text-[#5A6B61]">
              <Search className="mr-1.5 inline h-3.5 w-3.5 text-[#164B35]" />
              {estadoCuentaIndividualQuery.data.length} registro(s) relacionados entre deudas y
              facturas para este contribuyente.
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL: REGISTRAR NUEVA DEUDA MUNICIPAL (CU-PC-02) */}
      <Modal
        open={openDeudaModal}
        onClose={() => setOpenDeudaModal(false)}
        title="Registrar nueva deuda municipal"
        description="Complete los datos del cargo y su periodo fiscal."
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={deudaForm.handleSubmit((dto) => registrarDeudaMut.mutate(dto))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField
            label="Tipo de Tributo"
            required
            className="sm:col-span-2"
            error={deudaForm.formState.errors.idTipoTributo?.message}
          >
            <Select {...deudaForm.register('idTipoTributo')}>
              {(tiposTributoQuery.data ?? []).map((t) => (
                <option key={t.idTipoTributo} value={t.idTipoTributo}>
                  {t.codigoTributo} — {t.nombreTributo}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="ID Bien Inmueble (Finca)"
            required
            error={deudaForm.formState.errors.idInmueble?.message}
          >
            <Input type="number" min={1} {...deudaForm.register('idInmueble')} />
          </FormField>

          <FormField
            label="Periodo Fiscal / Trimestre"
            required
            error={deudaForm.formState.errors.periodoDeuda?.message}
          >
            <Input placeholder="Ej. II Trimestre 2026" {...deudaForm.register('periodoDeuda')} />
          </FormField>

          <FormField
            label="Fecha de Vencimiento"
            required
            error={deudaForm.formState.errors.fechaDeVencimiento?.message}
          >
            <Input type="date" {...deudaForm.register('fechaDeVencimiento')} />
          </FormField>

          <FormField
            label="Estado Inicial"
            required
            error={deudaForm.formState.errors.codigoEstadoDeuda?.message}
          >
            <Select {...deudaForm.register('codigoEstadoDeuda')}>
              <option value="PEND">PEND — Pendiente</option>
              <option value="VENC">VENC — Vencida</option>
              <option value="ARR">ARR — Arreglo de Pago</option>
            </Select>
          </FormField>

          <FormField
            label="Monto Principal (₡ CRC)"
            required
            error={deudaForm.formState.errors.montoPrincipal?.message}
          >
            <Input type="number" step="0.01" {...deudaForm.register('montoPrincipal')} />
          </FormField>

          <FormField
            label="Intereses Iniciales (₡ CRC)"
            error={deudaForm.formState.errors.montoIntereses?.message}
          >
            <Input type="number" step="0.01" {...deudaForm.register('montoIntereses')} />
          </FormField>

          <FormField
            label="Multas Iniciales (₡ CRC)"
            error={deudaForm.formState.errors.montoMultas?.message}
          >
            <Input type="number" step="0.01" {...deudaForm.register('montoMultas')} />
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenDeudaModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrarDeudaMut.isPending}>
              {registrarDeudaMut.isPending ? 'Registrando...' : 'Registrar Deuda'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: GENERAR FACTURA ELECTRÓNICA (CU-PC-06) */}
      <Modal
        open={Boolean(facturarDeudaTarget)}
        onClose={() => setFacturarDeudaTarget(null)}
        title={`Emitir Factura Electrónica — Deuda #${facturarDeudaTarget?.idDeudaMunicipal ?? ''}`}
        description="El subtotal y el total se calcularán automáticamente al emitir la factura."
      >
        {facturarDeudaTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#F5F7F4] p-3 text-xs space-y-1">
              <p>
                <strong>Tributo:</strong> {facturarDeudaTarget.nombreTributo} (
                {facturarDeudaTarget.periodoDeuda})
              </p>
              <p>
                <strong>Finca:</strong> {facturarDeudaTarget.numeroFinca}
              </p>
              <p>
                <strong>Monto total:</strong>{' '}
                <span className="font-bold text-[#164B35]">
                  {formatCurrencyCRC(facturarDeudaTarget.montoTotal)}
                </span>
              </p>
            </div>

            <FormField label="Clave Numérica Ministerio de Hacienda (50 dígitos)" required>
              <Input
                maxLength={50}
                value={claveHacienda}
                onChange={(e) => setClaveHacienda(e.target.value)}
                className="font-mono text-xs"
              />
            </FormField>

            <FormField label="Descuentos Aplicables (₡ CRC)" required>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={descuentosFactura}
                onChange={(e) => setDescuentosFactura(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFacturarDeudaTarget(null)}>
                Cancelar
              </Button>
              <Button
                disabled={generarFacturaMut.isPending || !claveHacienda.trim()}
                onClick={() => generarFacturaMut.mutate()}
              >
                {generarFacturaMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generando Factura...
                  </>
                ) : (
                  'Emitir factura'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

