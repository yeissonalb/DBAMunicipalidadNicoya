import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
} from 'lucide-react';
import { reportesApi } from '@/services/api';
import type { TipoReporteGestion } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { ChartCard } from '@/components/charts/ChartCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { exportToCsv, formatCurrencyCRC, formatDate, formatDateTime, formatNumber } from '@/lib/utils';

const CHART_COLORS = ['#164B35', '#B6944A', '#2E7D5B', '#D4B872', '#0F3626', '#967736', '#4C9A77'];

export function ReportesAnalisisPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'tributario' | 'morosidad' | 'eficiencia' | 'gestion'
  >('tributario');

  // Filtros de periodo fiscal y distrito (Wireframe 13, p. 120)
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [distritoSeleccionado, setDistritoSeleccionado] = useState<string>('TODOS');

  // Historial de trámites por contribuyente (GET /api/reportes/historial-tramites/{id})
  const [idContribuyenteHistorial, setIdContribuyenteHistorial] = useState<string>('1');

  // Explorador Gestión Municipal (GET /api/reportes/gestion-municipal)
  const [tipoGestion, setTipoGestion] = useState<TipoReporteGestion>('PADRON');
  const [filtroTextoGestion, setFiltroTextoGestion] = useState('');

  // Consultas a los 10 endpoints de ReportesController
  const recaudacionDistritoQuery = useQuery({
    queryKey: ['reportes', 'recaudacion-distrito'],
    queryFn: () => reportesApi.recaudacionDistrito(),
  });

  const recaudacionTributoQuery = useQuery({
    queryKey: ['reportes', 'recaudacion-tributo'],
    queryFn: () => reportesApi.recaudacionTributo(),
  });

  const recaudacionDistritoPeriodoQuery = useQuery({
    queryKey: ['reportes', 'recaudacion-distrito-periodo', fechaInicio, fechaFin],
    queryFn: () =>
      reportesApi.recaudacionDistritoPeriodo(fechaInicio || undefined, fechaFin || undefined),
    enabled: Boolean(fechaInicio || fechaFin),
  });

  const recaudacionTributoPeriodoQuery = useQuery({
    queryKey: ['reportes', 'recaudacion-tributo-periodo', fechaInicio, fechaFin],
    queryFn: () =>
      reportesApi.recaudacionTributoPeriodo(fechaInicio || undefined, fechaFin || undefined),
    enabled: Boolean(fechaInicio || fechaFin),
  });

  const morosidadVistaQuery = useQuery({
    queryKey: ['reportes', 'morosidad-vista'],
    queryFn: () => reportesApi.morosidad(),
  });

  const contribuyentesMorososSpQuery = useQuery({
    queryKey: ['reportes', 'contribuyentes-morosos-sp'],
    queryFn: () => reportesApi.contribuyentesMorosos(),
    enabled: activeTab === 'morosidad',
  });

  const solicitudesDeptoQuery = useQuery({
    queryKey: ['reportes', 'solicitudes-departamento'],
    queryFn: () => reportesApi.solicitudesDepartamento(),
    enabled: activeTab === 'eficiencia',
  });

  const eficienciaTramitesQuery = useQuery({
    queryKey: ['reportes', 'eficiencia-tramites'],
    queryFn: () => reportesApi.eficienciaTramites(),
    enabled: activeTab === 'eficiencia',
  });

  const historialContribuyenteQuery = useQuery({
    queryKey: ['reportes', 'historial-tramites', idContribuyenteHistorial],
    queryFn: () => reportesApi.historialTramites(Number(idContribuyenteHistorial)),
    enabled: activeTab === 'eficiencia' && Number(idContribuyenteHistorial) > 0,
  });

  const gestionMunicipalQuery = useQuery({
    queryKey: ['reportes', 'gestion-municipal', tipoGestion, filtroTextoGestion],
    queryFn: () =>
      reportesApi.gestionMunicipal(tipoGestion, filtroTextoGestion.trim() || undefined),
    enabled: activeTab === 'gestion',
  });

  // Saldo moroso por distrito (vw_morosidad_contribuyentes) para contrastar con lo recaudado
  const morosidadPorDistrito = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of morosidadVistaQuery.data ?? []) {
      const k = m.nombreDistrito ?? '—';
      map.set(k, (map.get(k) ?? 0) + (m.deudaTotal ?? 0));
    }
    return map;
  }, [morosidadVistaQuery.data]);

  // Datos combinados para gráficos (usa el SP por periodo si hay fechas o la vista general)
  const distritosChartData = useMemo(() => {
    const base =
      fechaInicio || fechaFin
        ? (recaudacionDistritoPeriodoQuery.data ?? []).map((d) => ({
            nombreDistrito: d.nombreDistrito ?? '—',
            codigoDistrito: d.codigoDistrital,
            totalRecaudado: d.totalDistrito ?? 0,
            saldoMoroso: morosidadPorDistrito.get(d.nombreDistrito ?? '—') ?? 0,
          }))
        : (recaudacionDistritoQuery.data ?? []).map((d) => ({
            nombreDistrito: d.nombreDistrito ?? '—',
            codigoDistrito: d.codigoDistrital,
            totalRecaudado: d.recaudacionDistritalTotal ?? 0,
            saldoMoroso: morosidadPorDistrito.get(d.nombreDistrito ?? '—') ?? 0,
          }));

    if (distritoSeleccionado === 'TODOS') return base;
    return base.filter((d) => d.nombreDistrito === distritoSeleccionado);
  }, [
    fechaInicio,
    fechaFin,
    recaudacionDistritoPeriodoQuery.data,
    recaudacionDistritoQuery.data,
    distritoSeleccionado,
    morosidadPorDistrito,
  ]);

  const tributosChartData = useMemo(() => {
    if (fechaInicio || fechaFin) {
      return (recaudacionTributoPeriodoQuery.data ?? []).map((t) => ({
        nombreTributo: t.nombreTributo,
        codigoTributo: t.codigoTributo,
        totalRecaudado: t.granTotalRecaudado ?? 0,
        principal: t.subtotalPrincipal,
        intereses: t.subtotalIntereses,
      }));
    }
    return (recaudacionTributoQuery.data ?? []).map((t) => ({
      nombreTributo: t.nombreTributo,
      codigoTributo: t.codigoTributo,
      totalRecaudado: t.totalRecaudadoGeneral ?? 0,
      principal: t.totalPrincipalRecaudado,
      intereses: t.totalInteresesRecaudados,
    }));
  }, [
    fechaInicio,
    fechaFin,
    recaudacionTributoPeriodoQuery.data,
    recaudacionTributoQuery.data,
  ]);

  // KPIs Superiores del Wireframe 13 (p. 120)
  const totalRecaudacionCantonal = distritosChartData.reduce(
    (acc, d) => acc + (d.totalRecaudado ?? 0),
    0
  );
  const totalCarteraMorosa = (morosidadVistaQuery.data ?? []).reduce(
    (acc, m) => acc + (m.deudaTotal ?? 0),
    0
  );
  // Cumplimiento = recaudado / (recaudado + saldo vencido pendiente)
  const totalExigible = totalRecaudacionCantonal + totalCarteraMorosa;
  const indiceCumplimiento =
    totalExigible > 0 ? Math.min(100, (totalRecaudacionCantonal / totalExigible) * 100) : 0;

  const distritosNombres = Array.from(
    new Set((recaudacionDistritoQuery.data ?? []).map((d) => d.nombreDistrito ?? '—'))
  );

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Reportes e indicadores municipales"
        subtitle="Analice la recaudación, cartera morosa y eficiencia de los servicios municipales."
        badge="Panel analítico"
        icon={<FileSpreadsheet className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['reportes'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button
              size="sm"
              onClick={() =>
                exportToCsv(
                  'recaudacion_distritos_nicoya.csv',
                  distritosChartData as unknown as Record<string, unknown>[]
                )
              }
            >
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </>
        }
      />

      {/* Pestañas de Reportes */}
      <nav className="grid gap-3 rounded-2xl border border-[#DCE3DE] bg-white p-3 shadow-card sm:grid-cols-2 xl:grid-cols-4" aria-label="Tipos de reporte">
        <Button
          variant={activeTab === 'tributario' ? 'default' : 'outline'}
          className="h-auto justify-start px-4 py-3"
          onClick={() => setActiveTab('tributario')}
        >
          <BarChart3 className="h-4 w-4" /> Análisis tributario
        </Button>
        <Button
          variant={activeTab === 'morosidad' ? 'default' : 'outline'}
          className="h-auto justify-start px-4 py-3"
          onClick={() => setActiveTab('morosidad')}
        >
          <AlertTriangle className="h-4 w-4" /> Cartera morosa (
          {morosidadVistaQuery.data?.length ?? 0})
        </Button>
        <Button
          variant={activeTab === 'eficiencia' ? 'default' : 'outline'}
          className="h-auto justify-start px-4 py-3"
          onClick={() => setActiveTab('eficiencia')}
        >
          <Clock className="h-4 w-4" /> Eficiencia y plazos
        </Button>
        <Button
          variant={activeTab === 'gestion' ? 'default' : 'outline'}
          className="h-auto justify-start px-4 py-3"
          onClick={() => setActiveTab('gestion')}
        >
          <Database className="h-4 w-4" /> Gestión municipal
        </Button>
      </nav>

      {/* TAB 1: ANÁLISIS TRIBUTARIO (Wireframe p. 120) */}
      {activeTab === 'tributario' && (
        <div className="flex flex-col" style={{ gap: '2rem' }}>
          {/* Barra de Periodo Fiscal y Píldoras de Distritos de Nicoya (Wireframe p. 120) */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
              <CardTitle className="text-base">Filtros del análisis</CardTitle>
              <CardDescription>Seleccione el periodo y los distritos incluidos en los indicadores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 sm:pt-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#26352D]">
                      Fecha de inicio
                    </label>
                    <Input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#26352D]">
                      Fecha de finalización
                    </label>
                    <Input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  {(fechaInicio || fechaFin) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFechaInicio('');
                        setFechaFin('');
                      }}
                    >
                      Ver Histórico Completo
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDistritoSeleccionado('TODOS')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      distritoSeleccionado === 'TODOS'
                        ? 'bg-[#164B35] text-white'
                        : 'bg-[#E8F0EC] text-[#164B35] hover:bg-[#D5E4DC]'
                    }`}
                  >
                    Todos los Distritos
                  </button>
                  {distritosNombres.map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setDistritoSeleccionado(nom)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        distritoSeleccionado === nom
                          ? 'bg-[#B6944A] text-white'
                          : 'bg-[#F5F7F4] text-[#26352D] hover:bg-[#E8F0EC]'
                      }`}
                    >
                      {nom}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3 Tarjetas KPI del Wireframe p. 120 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Card className="h-full border-l-4 border-l-[#164B35]">
              <CardHeader className="pb-2">
                <CardDescription>Total Recaudación Cantonal</CardDescription>
                <CardTitle className="text-2xl font-extrabold text-[#164B35]">
                  {formatCurrencyCRC(totalRecaudacionCantonal)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#5A6B61]">
                Pagos aplicados en el periodo seleccionado.
              </CardContent>
            </Card>

            <Card className="h-full border-l-4 border-l-[#B6944A]">
              <CardHeader className="pb-2">
                <CardDescription>Índice de Cumplimiento Tributario</CardDescription>
                <CardTitle className="text-2xl font-extrabold text-[#967736]">
                  {formatNumber(indiceCumplimiento, 1)}%
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#5A6B61]">
                Recaudado frente a recaudado + saldo vencido pendiente.
              </CardContent>
            </Card>

            <Card className="h-full border-l-4 border-l-red-600">
              <CardHeader className="pb-2">
                <CardDescription>Cartera Morosa Acumulada</CardDescription>
                <CardTitle className="text-2xl font-extrabold text-red-700">
                  {formatCurrencyCRC(totalCarteraMorosa)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#5A6B61]">
                Obligaciones vencidas:{' '}
                <strong>{morosidadVistaQuery.data?.length ?? 0}</strong> registro(s)
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Recharts: Barras por Distrito y Pastel por Tributo (Wireframe p. 120) */}
          {recaudacionDistritoQuery.isLoading || recaudacionTributoQuery.isLoading ? (
            <LoadingState message="Generando visualizaciones analíticas desde SQL Server..." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '2rem' }}>
              <div>
                <ChartCard
                  title="Recaudación por Distrito del Cantón de Nicoya"
                  subtitle={
                    fechaInicio || fechaFin
                      ? `Periodo: ${fechaInicio || 'inicio'} a ${fechaFin || 'hoy'}`
                      : 'Histórico acumulado por distrito'
                  }
                >
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distritosChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#DCE3DE" />
                        <XAxis dataKey="nombreDistrito" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(val: number) => formatCurrencyCRC(val)}
                        />
                        <Legend />
                        <Bar
                          dataKey="totalRecaudado"
                          name="Total Recaudado (₡)"
                          fill="#164B35"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="saldoMoroso"
                          name="Saldo moroso (₡)"
                          fill="#B6944A"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>

              <div>
                <ChartCard
                  title="Distribución por Tipo de Tributo"
                  subtitle={
                    fechaInicio || fechaFin
                      ? 'Distribución para el periodo seleccionado'
                      : 'Distribución histórica acumulada'
                  }
                >
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tributosChartData}
                          dataKey="totalRecaudado"
                          nameKey="nombreTributo"
                          cx="50%"
                          cy="50%"
                          outerRadius={88}
                          label={({ codigoTributo }) => codigoTributo}
                        >
                          {tributosChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => formatCurrencyCRC(val)} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            </div>
          )}

          {/* Tabla Resumen de Recaudación por Tributo */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
              <CardTitle className="text-base">
                Desglose Detallado de Recaudación por Tributo Municipal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              <div className="overflow-x-auto" role="region" aria-label="Recaudación por tributo" tabIndex={0}>
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                      <th className="px-3 py-2.5">Código</th>
                      <th className="px-3 py-2.5">Nombre del Tributo</th>
                      <th className="px-3 py-2.5">Principal Recaudado</th>
                      <th className="px-3 py-2.5">Intereses Recaudados</th>
                      <th className="px-3 py-2.5">Total General Recaudado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE3DE]">
                    {tributosChartData.map((t) => (
                      <tr key={t.codigoTributo} className="even:bg-[#FAFCFB] transition-colors hover:bg-[#E8F0EC]/55">
                        <td className="px-3 py-2.5 font-mono font-bold text-[#164B35]">
                          {t.codigoTributo}
                        </td>
                        <td className="px-3 py-2.5 font-semibold">{t.nombreTributo}</td>
                        <td className="px-3 py-2.5">{formatCurrencyCRC(t.principal)}</td>
                        <td className="px-3 py-2.5 text-amber-800">
                          {formatCurrencyCRC(t.intereses)}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-[#164B35]">
                          {formatCurrencyCRC(t.totalRecaudado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: CARTERA MOROSA (vw_morosidad_contribuyentes y sp_reporte_contribuyentes_morosos) */}
      {activeTab === 'morosidad' && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-4 border-b border-[#DCE3DE] bg-[#FAFCFB] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Cartera morosa de contribuyentes</CardTitle>
              <CardDescription>
                {morosidadVistaQuery.data?.length ?? 0} obligaciones vencidas correspondientes a{' '}
                {contribuyentesMorososSpQuery.data?.length ?? 0} contribuyentes reportados.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv(
                  'cartera_morosa_nicoya.csv',
                  (morosidadVistaQuery.data ?? []) as unknown as Record<string, unknown>[]
                )
              }
            >
              <Download className="h-4 w-4" /> Exportar Morosidad
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {morosidadVistaQuery.isLoading ? (
              <LoadingState message="Consultando cartera morosa..." />
            ) : morosidadVistaQuery.isError ? (
              <ErrorState
                error={morosidadVistaQuery.error}
                onRetry={() => morosidadVistaQuery.refetch()}
              />
            ) : (
              <div className="overflow-x-auto" role="region" aria-label="Cartera morosa" tabIndex={0}>
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                      <th className="px-3 py-2.5">Deuda ID</th>
                      <th className="px-3 py-2.5">Contribuyente</th>
                      <th className="px-3 py-2.5">Finca / Distrito</th>
                      <th className="px-3 py-2.5">Tributo / Periodo</th>
                      <th className="px-3 py-2.5">Vencimiento</th>
                      <th className="px-3 py-2.5">Días Mora</th>
                      <th className="px-3 py-2.5">Principal</th>
                      <th className="px-3 py-2.5">Intereses + Multas</th>
                      <th className="px-3 py-2.5">Total Deuda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE3DE]">
                    {(morosidadVistaQuery.data ?? []).map((m) => (
                      <tr key={m.idDeudaMunicipal} className="even:bg-[#FAFCFB] transition-colors hover:bg-[#E8F0EC]/55">
                        <td className="px-3 py-2.5 font-mono font-bold text-[#164B35]">
                          #{m.idDeudaMunicipal}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-[#26352D]">{m.nombreORazonSocial}</p>
                          <p className="font-mono text-[11px] text-[#5A6B61]">
                            {m.identificacionOficial}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-mono font-semibold">{m.numeroFinca}</p>
                          <p className="text-[#5A6B61]">{m.nombreDistrito}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{m.nombreTributo}</p>
                          <p className="text-[#5A6B61]">{m.periodoDeuda}</p>
                        </td>
                        <td className="px-3 py-2.5">{formatDate(m.fechaDeVencimiento)}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="danger">{m.diasMora ?? 0} días</Badge>
                        </td>
                        <td className="px-3 py-2.5">{formatCurrencyCRC(m.montoPrincipal)}</td>
                        <td className="px-3 py-2.5 text-amber-800">
                          {formatCurrencyCRC(m.montoIntereses + m.montoMultas)}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-red-700">
                          {formatCurrencyCRC(m.deudaTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: EFICIENCIA DE TRÁMITES Y SLA */}
      {activeTab === 'eficiencia' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Solicitudes por Departamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Solicitudes por departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE3DE] bg-[#F5F7F4] font-bold uppercase text-[#5A6B61]">
                        <th className="px-3 py-2">Departamento</th>
                        <th className="px-3 py-2">Recibidos</th>
                        <th className="px-3 py-2">En trámite</th>
                        <th className="px-3 py-2">Resueltos</th>
                        <th className="px-3 py-2">% Resolución</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE3DE]">
                      {(solicitudesDeptoQuery.data ?? []).map((d) => (
                        <tr key={d.codigoInterno ?? d.nombreDepartamento}>
                          <td className="px-3 py-2 font-semibold">{d.nombreDepartamento}</td>
                          <td className="px-3 py-2 font-bold text-[#164B35]">
                            {d.totalSolicitudesRecibidas ?? 0}
                          </td>
                          <td className="px-3 py-2 text-amber-700">{d.totalEnTramite ?? 0}</td>
                          <td className="px-3 py-2 text-emerald-700">{d.totalResueltas ?? 0}</td>
                          <td className="px-3 py-2">
                            {d.totalSolicitudesRecibidas > 0
                              ? `${formatNumber(((d.totalResueltas ?? 0) / d.totalSolicitudesRecibidas) * 100, 1)}%`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Eficiencia SLA por Tipo de Trámite */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cumplimiento de plazos de atención</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE3DE] bg-[#F5F7F4] font-bold uppercase text-[#5A6B61]">
                        <th className="px-3 py-2">Trámite</th>
                        <th className="px-3 py-2">SLA</th>
                        <th className="px-3 py-2">Volumen</th>
                        <th className="px-3 py-2">Prom. Real</th>
                        <th className="px-3 py-2">Fuera SLA</th>
                        <th className="px-3 py-2">% Éxito</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE3DE]">
                      {(eficienciaTramitesQuery.data ?? []).map((e) => (
                        <tr key={e.nombreTramite}>
                          <td className="px-3 py-2 font-semibold">{e.nombreTramite}</td>
                          <td className="px-3 py-2">{e.slaComprometido} d</td>
                          <td className="px-3 py-2">{e.volumenTramites}</td>
                          <td className="px-3 py-2">{formatNumber(e.promedioDiasResolucion, 1)} d</td>
                          <td className="px-3 py-2">
                            <Badge variant={(e.totalFueraPlazo ?? 0) > 0 ? 'danger' : 'success'}>
                              {e.totalFueraPlazo ?? 0}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            {e.tasaExitoSlaPorcentaje == null
                              ? '—'
                              : `${formatNumber(e.tasaExitoSlaPorcentaje, 1)}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historial de Trámites por Contribuyente */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Historial de Trámites por Contribuyente (
                  <code className="font-mono">GET /api/reportes/historial-tramites/&#123;id&#125;</code>)
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">ID Contribuyente:</span>
                <Input
                  type="number"
                  min={1}
                  value={idContribuyenteHistorial}
                  onChange={(e) => setIdContribuyenteHistorial(e.target.value)}
                  className="h-8 w-24 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent>
              {!historialContribuyenteQuery.data ||
              historialContribuyenteQuery.data.length === 0 ? (
                <p className="text-xs text-[#5A6B61]">
                  Sin trámites registrados para el contribuyente #{idContribuyenteHistorial}.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE3DE] bg-[#F5F7F4] font-bold uppercase text-[#5A6B61]">
                        <th className="px-3 py-2">Expediente</th>
                        <th className="px-3 py-2">Trámite</th>
                        <th className="px-3 py-2">Radicación</th>
                        <th className="px-3 py-2">Resolución</th>
                        <th className="px-3 py-2">Fecha cambio</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE3DE]">
                      {historialContribuyenteQuery.data.map((h, idx) => (
                        <tr key={`${h.numeroExpediente}-${idx}`}>
                          <td className="px-3 py-2 font-mono font-bold text-[#164B35]">
                            {h.numeroExpediente}
                          </td>
                          <td className="px-3 py-2">{h.nombreTramite}</td>
                          <td className="px-3 py-2">{formatDate(h.fechaRadicacion)}</td>
                          <td className="px-3 py-2">
                            {h.fechaResolucionFinal ? formatDate(h.fechaResolucionFinal) : 'En curso'}
                          </td>
                          <td className="px-3 py-2">{formatDateTime(h.fechaCambio)}</td>
                          <td className="px-3 py-2">
                            <Badge variant="gold">{h.nombreEstado}</Badge>
                          </td>
                          <td className="px-3 py-2 text-[#5A6B61]">{h.observaciones || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: EXPLORADOR DE GESTIÓN MUNICIPAL (sp_reporte_gestion_municipal) */}
      {activeTab === 'gestion' && (
        <Card>
          <CardHeader>
            <CardTitle>
              Reporte Consolidado de Gestión Municipal (
              <code className="font-mono">GET /api/reportes/gestion-municipal</code>)
            </CardTitle>
            <CardDescription>
              Ejecuta <code className="font-mono">dbo.sp_reporte_gestion_municipal</code> con
              selector de dominio (<code className="font-mono">PADRON, INMUEBLES, MOROSOS, AUDITORIA</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-64">
                <label className="mb-1 block text-xs font-semibold text-[#26352D]">
                  Tipo de Reporte (<code className="font-mono">tipoReporte</code>)
                </label>
                <Select
                  value={tipoGestion}
                  onChange={(e) => setTipoGestion(e.target.value as TipoReporteGestion)}
                >
                  <option value="PADRON">PADRON — Padrón de Contribuyentes</option>
                  <option value="INMUEBLES">INMUEBLES — Catastro de Propiedades</option>
                  <option value="MOROSOS">MOROSOS — Cartera en Mora</option>
                  <option value="AUDITORIA">AUDITORIA — Bitácora del Sistema</option>
                </Select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-[#26352D]">
                  Filtro de Texto Opcional (<code className="font-mono">filtroTexto</code>)
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5A6B61]" />
                  <Input
                    placeholder="Filtrar registros en el procedimiento almacenado..."
                    value={filtroTextoGestion}
                    onChange={(e) => setFiltroTextoGestion(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  exportToCsv(
                    `reporte_gestion_${tipoGestion.toLowerCase()}.csv`,
                    gestionMunicipalQuery.data?.registros ?? []
                  )
                }
                disabled={!gestionMunicipalQuery.data?.registros?.length}
              >
                <Download className="h-4 w-4" /> Exportar CSV
              </Button>
            </div>

            {gestionMunicipalQuery.isLoading ? (
              <LoadingState message="Ejecutando sp_reporte_gestion_municipal..." />
            ) : !gestionMunicipalQuery.data ||
              gestionMunicipalQuery.data.registros.length === 0 ? (
              <EmptyState title="Sin registros para el filtro seleccionado" />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#DCE3DE] max-h-96">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="sticky top-0 border-b border-[#DCE3DE] bg-[#F5F7F4] font-bold uppercase text-[#5A6B61]">
                      {Object.keys(gestionMunicipalQuery.data.registros[0]).map((col) => (
                        <th key={col} className="px-3 py-2.5">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE3DE]">
                    {gestionMunicipalQuery.data.registros.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#E8F0EC]/40">
                        {Object.entries(row).map(([k, v]) => (
                          <td key={k} className="px-3 py-2 whitespace-nowrap">
                            {v === null || v === undefined ? '—' : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
