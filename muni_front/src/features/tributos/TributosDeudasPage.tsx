import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  AlertCircle,
  Calculator,
  FileCheck2,
  FilePlus,
  Loader2,
  Plus,
  RefreshCw,
  Scale,
  User,
} from 'lucide-react';
import {
  auditoriaApi,
  contribuyenteApi,
  facturacionPagoApi,
  tributoDeudaApi,
} from '@/services/api';
import type { SpDeudasContribuyenteResultDto } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/forms/FormField';
import { formatCurrencyCRC, formatDate, formatNumber } from '@/lib/utils';

const registrarDeudaSchema = z.object({
  periodoDeuda: z.string().trim().min(2, 'Periodo requerido (ej. II Trimestre 2026)').max(150),
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

function getEstatusLegalLabel(codigo: string, diasMora: number | null | undefined): string {
  if (codigo === 'PAG') return 'Cancelada / Condonada';
  if (codigo === 'ARR') return 'Arreglo de Pago';
  if (codigo === 'VENC') return (diasMora ?? 0) > 15 ? 'En Cobro Judicial' : 'Cobro Administrativo';
  return 'Cobro Administrativo';
}

export function TributosDeudasPage() {
  const queryClient = useQueryClient();
  const [selectedContribuyenteId, setSelectedContribuyenteId] = useState<number>(1);
  const [selectedDeudaId, setSelectedDeudaId] = useState<number | null>(null);
  const [openDeudaModal, setOpenDeudaModal] = useState(false);
  const [facturarDeudaTarget, setFacturarDeudaTarget] =
    useState<SpDeudasContribuyenteResultDto | null>(null);
  const [claveHacienda, setClaveHacienda] = useState('');
  const [descuentosFactura, setDescuentosFactura] = useState<string>('0');
  const [tasaInteresOpcional, setTasaInteresOpcional] = useState<string>('');

  // Panel Derecho del Wireframe: Actualizar Estatus Legal (CU-PC-08)
  const [nuevoEstatusLegal, setNuevoEstatusLegal] = useState<string>('VENC');
  const [etiquetaLegalHumana, setEtiquetaLegalHumana] = useState<string>('En Cobro Judicial');
  const [numeroResolucion, setNumeroResolucion] = useState<string>('RES-ALC-2026-089');
  const [justificacionLegal, setJustificacionLegal] = useState<string>('');
  const [openConfirmLegalDialog, setOpenConfirmLegalDialog] = useState(false);

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

  const contribuyenteSeleccionado = useMemo(() => {
    const found = (padronQuery.data ?? []).find(
      (p) => p.idContribuyente === selectedContribuyenteId
    );
    if (found) return found;
    const fromGen = (estadoCuentaGeneralQuery.data ?? []).find(
      (c) => c.idContribuyente === selectedContribuyenteId
    );
    if (fromGen) {
      return {
        idContribuyente: fromGen.idContribuyente,
        identificacion: fromGen.identificacion,
        nombreCompletoORazonSocial: fromGen.contribuyente,
      };
    }
    return {
      idContribuyente: selectedContribuyenteId,
      identificacion: '1-1234-5678',
      nombreCompletoORazonSocial: 'Juan Pérez Rodríguez',
    };
  }, [padronQuery.data, estadoCuentaGeneralQuery.data, selectedContribuyenteId]);

  const deudasList = deudasContribuyenteQuery.data ?? [];
  const selectedDeuda =
    deudasList.find((d) => d.idDeudaMunicipal === selectedDeudaId) ?? deudasList[0] ?? null;

  // 3 KPIs Superiores del Wireframe: Deuda Principal, Intereses y Multas Moratorias, Saldo Total Adeudado
  const kpiDeudaPrincipal = deudasList
    .filter((d) => d.codigoEstadoDeuda !== 'PAG')
    .reduce((acc, d) => acc + (d.montoPrincipal ?? 0), 0);

  const kpiInteresesMultas = deudasList
    .filter((d) => d.codigoEstadoDeuda !== 'PAG')
    .reduce((acc, d) => acc + (d.montoIntereses ?? 0) + (d.montoMultas ?? 0), 0);

  const kpiSaldoTotalAdeudado = deudasList
    .filter((d) => d.codigoEstadoDeuda !== 'PAG')
    .reduce((acc, d) => acc + (d.montoTotal ?? 0), 0);

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
    mutationFn: async () => {
      if (!selectedDeuda) throw new Error('Seleccione una deuda de la tabla.');
      const res = await tributoDeudaApi.actualizarEstadoDeuda(selectedDeuda.idDeudaMunicipal, {
        codigoEstadoDeuda: nuevoEstatusLegal as 'PEND' | 'PAG' | 'VENC' | 'ARR',
      });
      try {
        await auditoriaApi.registrar({
          tablaAfectada: 'Deuda_Municipal',
          idRegistroAfectado: String(selectedDeuda.idDeudaMunicipal),
          codigoAccion: 'UPDATE',
          valoresAnteriores: JSON.stringify({
            codigoEstadoDeuda: selectedDeuda.codigoEstadoDeuda,
          }),
          valoresNuevos: JSON.stringify({
            codigoEstadoDeuda: nuevoEstatusLegal,
            estatusLegal: etiquetaLegalHumana,
            numeroResolucion,
            justificacionLegal,
          }),
        });
      } catch {
        // continuar si auditoría opcional falla
      }
      return res;
    },
    onSuccess: (res) => {
      toast.success(
        `${res.message || 'Estatus legal actualizado'} (${etiquetaLegalHumana} — ${numeroResolucion})`
      );
      setOpenConfirmLegalDialog(false);
      setJustificacionLegal('');
      queryClient.invalidateQueries({ queryKey: ['tributos'] });
      queryClient.invalidateQueries({ queryKey: ['facturacion'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setOpenConfirmLegalDialog(false);
    },
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

  const handleEmitirCertificacionOficial = () => {
    const texto = [
      '====================================================================',
      '        MUNICIPALIDAD DE NICOYA — CERTIFICACIÓN DE ESTADO DE CUENTA ',
      '====================================================================',
      `Fecha de Emisión        : ${formatDate(new Date())}`,
      `Contribuyente           : ${contribuyenteSeleccionado.nombreCompletoORazonSocial}`,
      `Cédula / Identificación : ${contribuyenteSeleccionado.identificacion}`,
      `Deuda Principal         : ${formatCurrencyCRC(kpiDeudaPrincipal)}`,
      `Intereses y Multas      : ${formatCurrencyCRC(kpiInteresesMultas)}`,
      `Saldo Total Adeudado    : ${formatCurrencyCRC(kpiSaldoTotalAdeudado)}`,
      '====================================================================',
    ].join('\r\n');
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificacion_Cobro_${contribuyenteSeleccionado.identificacion}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Certificación oficial de estado de cuenta emitida.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estado de Cuenta Integral y Gestión de Cobro"
        subtitle="Taxpayer Account & Debt Status — Administración de tributos, intereses moratorios, certificaciones y estatus legal."
        badge={`${tiposTributoQuery.data?.length ?? 0} tributos activos`}
        icon={<Scale className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['tributos'] });
                queryClient.invalidateQueries({ queryKey: ['facturacion'] });
              }}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button onClick={() => setOpenDeudaModal(true)}>
              <Plus className="h-4 w-4" /> Registrar Deuda
            </Button>
          </>
        }
      />

      {/* BANNER SUPERIOR AZUL INSTITUCIONAL DEL CONTRIBUYENTE (Exacto al Wireframe) */}
      <div className="rounded-[12px] border border-[#1E3A8A] bg-[#1E3A8A] p-5 text-white shadow-card">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-200">Cédula:</p>
                <p className="font-mono text-base font-bold text-white">
                  {contribuyenteSeleccionado.identificacion}
                </p>
              </div>
            </div>

            <div className="hidden h-8 w-px bg-white/20 sm:block" />

            <div>
              <p className="text-xs font-medium text-blue-200">Contribuyente:</p>
              <p className="text-base font-bold text-white">
                {contribuyenteSeleccionado.nombreCompletoORazonSocial}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-[10px] bg-white/10 px-3 py-1.5 text-xs">
              <span className="text-blue-100">Deuda:</span>
              <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#FEF2F2] px-2.5 py-0.5 font-bold text-[#DC2626]">
                <AlertCircle className="h-3.5 w-3.5" />
                {kpiSaldoTotalAdeudado > 0 ? 'En Cobro Administrativo' : 'Al Día'}
              </span>
            </div>

            <div className="w-64 text-[#171717]">
              <Select
                value={selectedContribuyenteId}
                onChange={(e) => {
                  setSelectedContribuyenteId(Number(e.target.value));
                  setSelectedDeudaId(null);
                }}
              >
                {(padronQuery.data ?? []).map((p) => (
                  <option key={p.idContribuyente} value={p.idContribuyente}>
                    #{p.idContribuyente} — {p.nombreCompletoORazonSocial}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* 3 TARJETAS KPI DEL WIREFRAME: DEUDA PRINCIPAL | INTERESES Y MULTAS | SALDO TOTAL ADEUDADO */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
              Deuda Principal
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#171717]">
              {formatCurrencyCRC(kpiDeudaPrincipal)}
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
              Intereses y Multas Moratorias
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#B45309]">
              {formatCurrencyCRC(kpiInteresesMultas)}
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
              Saldo Total Adeudado
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#1E3A8A]">
              {formatCurrencyCRC(kpiSaldoTotalAdeudado)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LAYOUT DE 2 COLUMNAS DEL WIREFRAME: IZQUIERDA TABLA DE DEUDAS (8 COLS) + DERECHA PANEL ESTATUS LEGAL (4 COLS) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Columna Izquierda: Tabla de Obligaciones y Certificación Oficial */}
        <div className="space-y-6 xl:col-span-8">
          <Card>
            <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle>Obligaciones y Saldos por Periodo</CardTitle>
                <CardDescription>
                  Seleccione una obligación para actualizar su estatus legal en el panel derecho o
                  emitir factura.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-40">
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Tasa opc. (0.02)"
                    value={tasaInteresOpcional}
                    onChange={(e) => setTasaInteresOpcional(e.target.value)}
                  />
                </div>
                <Button onClick={handleEmitirCertificacionOficial}>
                  <FileCheck2 className="h-4 w-4" /> Emitir Certificación Oficial
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {deudasContribuyenteQuery.isLoading ? (
                <div className="p-6">
                  <LoadingState message="Consultando deudas del contribuyente..." />
                </div>
              ) : deudasList.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="Este contribuyente no registra deudas municipales" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] font-bold uppercase text-[#4B5563]">
                        <th className="px-3.5 py-3">Periodo</th>
                        <th className="px-3.5 py-3">Tributo</th>
                        <th className="px-3.5 py-3">Finca</th>
                        <th className="px-3.5 py-3">Vencimiento</th>
                        <th className="px-3.5 py-3">Días de Mora</th>
                        <th className="px-3.5 py-3">Saldo Pendiente</th>
                        <th className="px-3.5 py-3">Estatus Legal</th>
                        <th className="px-3.5 py-3 text-right">Operación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {deudasList.map((d) => {
                        const isSelected = selectedDeuda?.idDeudaMunicipal === d.idDeudaMunicipal;
                        const legalLabel = getEstatusLegalLabel(
                          d.codigoEstadoDeuda,
                          d.diasMora
                        );
                        return (
                          <tr
                            key={d.idDeudaMunicipal}
                            onClick={() => {
                              setSelectedDeudaId(d.idDeudaMunicipal);
                              setNuevoEstatusLegal(d.codigoEstadoDeuda);
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#EFF6FF] shadow-[inset_3px_0_0_#1D4ED8]'
                                : 'hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <td className="px-3.5 py-3 font-mono font-semibold text-[#171717]">
                              {d.periodoDeuda}
                            </td>
                            <td className="px-3.5 py-3 font-semibold text-[#171717]">
                              {d.nombreTributo}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[#1E3A8A]">
                              {d.numeroFinca}
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              {formatDate(d.fechaDeVencimiento)}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-[#DC2626]">
                              {d.diasMora ?? 0}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-[#171717]">
                              {formatCurrencyCRC(d.montoTotal)}
                            </td>
                            <td className="px-3.5 py-3">
                              <Badge
                                variant={
                                  d.codigoEstadoDeuda === 'PAG'
                                    ? 'success'
                                    : d.codigoEstadoDeuda === 'ARR'
                                    ? 'blue'
                                    : d.codigoEstadoDeuda === 'VENC'
                                    ? 'danger'
                                    : 'warning'
                                }
                              >
                                {legalLabel} ({d.codigoEstadoDeuda})
                              </Badge>
                            </td>
                            <td
                              className="px-3.5 py-3 text-right whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-1.5">
                                <Button
                                  variant="secondary"
                                  onClick={() => recalcularMut.mutate(d.idDeudaMunicipal)}
                                  disabled={recalcularMut.isPending}
                                  title="Recalcular intereses moratorios"
                                >
                                  <Calculator className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  onClick={() => {
                                    setFacturarDeudaTarget(d);
                                    setClaveHacienda(generarClaveHacienda50(d.idDeudaMunicipal));
                                    setDescuentosFactura('0');
                                  }}
                                  title="Emitir factura electrónica Hacienda"
                                >
                                  <FilePlus className="h-3.5 w-3.5" /> Facturar
                                </Button>
                              </div>
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

          {/* Catálogo de Tipos de Tributo */}
          <Card>
            <CardHeader>
              <CardTitle>Catálogo Oficial de Tributos Municipales</CardTitle>
              <CardDescription>
                Tasas base, fórmulas de cálculo y periodicidad definidas en SQL Server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(tiposTributoQuery.data ?? []).map((t) => (
                  <div
                    key={t.idTipoTributo}
                    className="rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-3.5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="blue">{t.codigoTributo}</Badge>
                      <span className="font-semibold text-[#6B7280]">{t.periodicidad}</span>
                    </div>
                    <p className="font-bold text-[#171717]">{t.nombreTributo}</p>
                    <p className="text-[#4B5563]">
                      <strong>Tasa Base:</strong> {formatNumber(t.tasaBase, 4)} ·{' '}
                      {t.nombreDepartamento}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha (4 cols): Actualizar Estatus Legal (CU-PC-08 del Wireframe) */}
        <div className="xl:col-span-4">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Actualizar Estatus Legal</CardTitle>
              <CardDescription>
                CU-PC-08 · Deuda seleccionada:{' '}
                <strong>
                  {selectedDeuda
                    ? `#${selectedDeuda.idDeudaMunicipal} (${selectedDeuda.nombreTributo})`
                    : 'Ninguna'}
                </strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <FormField label="Nuevo Estado" required>
                <Select
                  value={`${nuevoEstatusLegal}::${etiquetaLegalHumana}`}
                  onChange={(e) => {
                    const [code, label] = e.target.value.split('::');
                    setNuevoEstatusLegal(code);
                    setEtiquetaLegalHumana(label);
                  }}
                >
                  <option value="VENC::En Cobro Judicial">En Cobro Judicial (VENC)</option>
                  <option value="PEND::Cobro Administrativo">Cobro Administrativo (PEND)</option>
                  <option value="ARR::Arreglo de Pago">Arreglo de Pago (ARR)</option>
                  <option value="PAG::Prescrita">Prescrita (PAG)</option>
                  <option value="PAG::Condonada">Condonada (PAG)</option>
                </Select>
              </FormField>

              <FormField label="Número de Resolución" required>
                <Input
                  placeholder="Ej. RES-ALC-2026-089"
                  value={numeroResolucion}
                  onChange={(e) => setNumeroResolucion(e.target.value)}
                />
              </FormField>

              <FormField label="Justificación legal" required>
                <Textarea
                  placeholder="Indique el fundamento legal o administrativo del cambio..."
                  value={justificacionLegal}
                  onChange={(e) => setJustificacionLegal(e.target.value)}
                />
              </FormField>

              <Button
                className="w-full"
                disabled={
                  !selectedDeuda ||
                  !numeroResolucion.trim() ||
                  !justificacionLegal.trim() ||
                  cambiarEstadoDeudaMut.isPending
                }
                onClick={() => setOpenConfirmLegalDialog(true)}
              >
                Confirmar Cambio Legal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIÁLOGO DE 3 ADVERTENCIAS DE SEGURIDAD PARA CAMBIO DE ESTATUS LEGAL */}
      <ConfirmDialog
        open={openConfirmLegalDialog}
        onClose={() => setOpenConfirmLegalDialog(false)}
        multiStepSecurity
        title="Confirmación de Seguridad — Cambio de Estatus Legal de Deuda"
        confirmLabel="Confirmar Cambio Legal en SQL Server"
        isPending={cambiarEstadoDeudaMut.isPending}
        onConfirm={() => cambiarEstadoDeudaMut.mutate()}
        impactSummary={
          selectedDeuda && (
            <div className="space-y-1">
              <p>
                <strong>Deuda Municipal:</strong> #{selectedDeuda.idDeudaMunicipal} —{' '}
                {selectedDeuda.nombreTributo} ({selectedDeuda.periodoDeuda})
              </p>
              <p>
                <strong>Nuevo Estatus Legal:</strong> {etiquetaLegalHumana} (Código BD:{' '}
                {nuevoEstatusLegal})
              </p>
              <p>
                <strong>Resolución:</strong> {numeroResolucion}
              </p>
            </div>
          )
        }
      />

      {/* MODAL: REGISTRAR NUEVA DEUDA MUNICIPAL */}
      <Modal
        open={openDeudaModal}
        onClose={() => setOpenDeudaModal(false)}
        title="Registrar Nueva Deuda Municipal"
        description="Complete los datos del cargo y su fecha de vencimiento (dd/MM/yyyy)."
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
            label="Fecha de Vencimiento (dd/MM/yyyy)"
            required
            error={deudaForm.formState.errors.fechaDeVencimiento?.message}
          >
            <Calendar
              value={deudaForm.watch('fechaDeVencimiento')}
              onChange={(iso) =>
                deudaForm.setValue('fechaDeVencimiento', iso, { shouldValidate: true })
              }
            />
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
            <Button type="button" variant="secondary" onClick={() => setOpenDeudaModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrarDeudaMut.isPending}>
              {registrarDeudaMut.isPending ? 'Registrando...' : 'Registrar Deuda'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: GENERAR FACTURA ELECTRÓNICA */}
      <Modal
        open={Boolean(facturarDeudaTarget)}
        onClose={() => setFacturarDeudaTarget(null)}
        title={`Emitir Factura Electrónica — Deuda #${facturarDeudaTarget?.idDeudaMunicipal ?? ''}`}
        description="El subtotal y el total se calcularán automáticamente al emitir la factura."
      >
        {facturarDeudaTarget && (
          <div className="space-y-4">
            <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-3.5 text-xs space-y-1">
              <p>
                <strong>Tributo:</strong> {facturarDeudaTarget.nombreTributo} (
                {facturarDeudaTarget.periodoDeuda})
              </p>
              <p>
                <strong>Finca:</strong> {facturarDeudaTarget.numeroFinca}
              </p>
              <p>
                <strong>Monto total:</strong>{' '}
                <span className="font-bold text-[#1E3A8A]">
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
              <Button variant="secondary" onClick={() => setFacturarDeudaTarget(null)}>
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
                  'Emitir Factura'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
