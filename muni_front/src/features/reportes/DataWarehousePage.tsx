import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Building,
  Clock,
  Database,
  Download,
  Loader2,
  MapPin,
  Play,
  RefreshCw,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import { dataWarehouseApi } from '@/services/api';
import { useAuth } from '@/app/providers/AuthProvider';
import { MODULE_PERMISSIONS } from '@/features/auth/permissions';
import type { SpDwValidacionEtlResultDto } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { ChartCard } from '@/components/charts/ChartCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { exportToCsv, formatCurrencyCRC, formatDateTime, formatNumber } from '@/lib/utils';

type Vista = 'periodo' | 'tributo' | 'ubicacion' | 'morosidad' | 'eficiencia' | 'departamento';

const VISTAS: { id: Vista; label: string; icon: ReactNode }[] = [
  { id: 'periodo', label: 'Recaudación por periodo', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'tributo', label: 'Recaudación por tributo', icon: <Database className="h-4 w-4" /> },
  { id: 'ubicacion', label: 'Recaudación por distrito', icon: <MapPin className="h-4 w-4" /> },
  { id: 'morosidad', label: 'Morosidad', icon: <AlertTriangle className="h-4 w-4" /> },
  { id: 'eficiencia', label: 'Eficiencia de trámites', icon: <Clock className="h-4 w-4" /> },
  { id: 'departamento', label: 'Indicadores por departamento', icon: <Building className="h-4 w-4" /> },
];

function estadoBadge(estado: string | null | undefined) {
  const e = (estado ?? '').toUpperCase();
  if (e.includes('EXIT') || e.includes('OK') || e.includes('COMPLET')) return 'success' as const;
  if (e.includes('ERROR') || e.includes('FALL')) return 'danger' as const;
  if (e.includes('CURSO') || e.includes('EJEC')) return 'info' as const;
  return 'warning' as const;
}

/**
 * Inteligencia de negocio sobre el Data Mart MunicipalidadNicoyaDataMart2026.
 * Consulta: Admin, Auditor, DBA · Ejecutar ETL: Admin, DBA.
 */
export function DataWarehousePage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const puedeEjecutarEtl = hasRole(MODULE_PERMISSIONS.DATA_WAREHOUSE_ETL);
  const [vista, setVista] = useState<Vista>('periodo');
  const [confirmarEtl, setConfirmarEtl] = useState(false);
  const [ultimaValidacion, setUltimaValidacion] = useState<SpDwValidacionEtlResultDto[] | null>(null);

  const estadoQuery = useQuery({
    queryKey: ['dw', 'estado'],
    queryFn: () => dataWarehouseApi.estado(),
  });
  const instalado = Boolean(estadoQuery.data?.dwInstalado);

  const historialQuery = useQuery({
    queryKey: ['dw', 'historial'],
    queryFn: () => dataWarehouseApi.historialCargas(),
  });

  // Las consultas del Data Mart solo se lanzan si la base existe (si no, el backend responde 404 / 50034)
  const consultaQuery = useQuery({
    queryKey: ['dw', 'consulta', vista],
    enabled: instalado,
    queryFn: async (): Promise<Record<string, unknown>[]> => {
      switch (vista) {
        case 'periodo':
          return (await dataWarehouseApi.recaudacionPeriodo()) as unknown as Record<string, unknown>[];
        case 'tributo':
          return (await dataWarehouseApi.recaudacionTributo()) as unknown as Record<string, unknown>[];
        case 'ubicacion':
          return (await dataWarehouseApi.recaudacionUbicacion()) as unknown as Record<string, unknown>[];
        case 'morosidad':
          return (await dataWarehouseApi.morosidad()) as unknown as Record<string, unknown>[];
        case 'eficiencia':
          return (await dataWarehouseApi.eficienciaTramites()) as unknown as Record<string, unknown>[];
        case 'departamento':
          return (await dataWarehouseApi.indicadoresDepartamento()) as unknown as Record<
            string,
            unknown
          >[];
      }
    },
  });

  const etlMut = useMutation({
    mutationFn: () => dataWarehouseApi.ejecutarEtl(),
    onSuccess: (res) => {
      setUltimaValidacion(res.data ?? []);
      toast.success(res.message || 'Carga ETL finalizada.');
      setConfirmarEtl(false);
      queryClient.invalidateQueries({ queryKey: ['dw'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setConfirmarEtl(false);
      queryClient.invalidateQueries({ queryKey: ['dw', 'historial'] });
    },
  });

  const filas = consultaQuery.data ?? [];
  const grafico = construirGrafico(vista, filas);

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Data Warehouse e inteligencia de negocio"
        subtitle="Indicadores históricos consolidados en el Data Mart municipal mediante el proceso ETL."
        badge={instalado ? 'Data Mart disponible' : 'Data Mart no instalado'}
        icon={<Warehouse className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['dw'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            {puedeEjecutarEtl && (
              <Button
                size="sm"
                disabled={!instalado || etlMut.isPending}
                onClick={() => setConfirmarEtl(true)}
              >
                {etlMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ejecutando ETL...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Ejecutar carga ETL
                  </>
                )}
              </Button>
            )}
          </>
        }
      />

      {/* Estado del Data Mart */}
      {estadoQuery.isLoading ? (
        <LoadingState message="Consultando estado del Data Mart..." />
      ) : estadoQuery.isError ? (
        <ErrorState error={estadoQuery.error} onRetry={() => estadoQuery.refetch()} />
      ) : !instalado ? (
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-start gap-3 pt-6 text-sm text-sigemun-primary sm:pt-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">La base MunicipalidadNicoyaDataMart2026 no existe en este servidor.</p>
              <p className="mt-1 text-xs">
                Ejecute en orden los scripts de <code className="font-mono">BaseDeDatos/DataWareHouse</code>:{' '}
                <code className="font-mono">DWH_Structure.sql</code>, <code className="font-mono">DWH_ETL.sql</code> y{' '}
                <code className="font-mono">DWH_Vistas_Analiticas.sql</code>; luego vuelva a esta pantalla.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-l-4 border-l-sigemun-primary">
            <CardHeader className="pb-2">
              <CardDescription>Última carga ETL</CardDescription>
              <CardTitle className="text-lg font-extrabold text-sigemun-primary">
                {estadoQuery.data?.ultimaCargaInicio
                  ? formatDateTime(estadoQuery.data.ultimaCargaInicio)
                  : 'Sin cargas registradas'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              {estadoQuery.data?.ultimaCargaEstado ? (
                <Badge variant={estadoBadge(estadoQuery.data.ultimaCargaEstado)}>
                  {estadoQuery.data.ultimaCargaEstado}
                </Badge>
              ) : (
                <span className="text-sigemun-muted">Ejecute la primera carga.</span>
              )}
            </CardContent>
          </Card>
          {[
            ['Hechos de recaudación', estadoQuery.data?.filasFactRecaudacion],
            ['Hechos de morosidad', estadoQuery.data?.filasFactMorosidad],
            ['Hechos de eficiencia', estadoQuery.data?.filasFactEficiencia],
          ].map(([label, valor]) => (
            <Card key={label as string} className="border-l-4 border-l-sigemun-medium">
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl font-extrabold text-sigemun-text">
                  {formatNumber(valor as number)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-sigemun-muted">filas en el Data Mart</CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resultado de la última validación ETL ejecutada desde esta pantalla */}
      {ultimaValidacion && ultimaValidacion.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
            <CardTitle className="text-base">Validación de la carga #{ultimaValidacion[0].idCarga}</CardTitle>
            <CardDescription>Comparación de totales entre la base operativa (OLTP) y el Data Mart.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <TablaGenerica
              filas={ultimaValidacion as unknown as Record<string, unknown>[]}
              columnas={[
                ['control', 'Control'],
                ['totalOltp', 'Total OLTP'],
                ['totalDw', 'Total DW'],
                ['resultado', 'Resultado'],
              ]}
            />
          </CardContent>
        </Card>
      )}

      {/* Consultas analíticas */}
      {instalado && (
        <>
          <nav
            className="grid gap-2 rounded-2xl border border-sigemun-border bg-white p-3 shadow-card sm:grid-cols-3 xl:grid-cols-6"
            aria-label="Consultas del Data Mart"
          >
            {VISTAS.map((v) => (
              <Button
                key={v.id}
                variant={vista === v.id ? 'default' : 'outline'}
                className="h-auto justify-start px-3 py-2.5 text-xs"
                onClick={() => setVista(v.id)}
              >
                {v.icon} {v.label}
              </Button>
            ))}
          </nav>

          {consultaQuery.isLoading ? (
            <LoadingState message="Consultando el Data Mart..." />
          ) : consultaQuery.isError ? (
            <ErrorState error={consultaQuery.error} onRetry={() => consultaQuery.refetch()} />
          ) : filas.length === 0 ? (
            <EmptyState
              title="El Data Mart no tiene datos para esta consulta"
              description="Ejecute una carga ETL para poblar las tablas de hechos."
            />
          ) : (
            <>
              {grafico && (
                <ChartCard title={grafico.titulo} subtitle={grafico.subtitulo}>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={grafico.datos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D9E6F2" />
                        <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(val: number) =>
                            grafico.moneda ? formatCurrencyCRC(val) : formatNumber(val, 1)
                          }
                        />
                        <Legend />
                        {grafico.series.map((s) => (
                          <Bar
                            key={s.clave}
                            dataKey={s.clave}
                            name={s.nombre}
                            fill={s.color}
                            radius={[6, 6, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}

              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-sigemun-border bg-sigemun-surface">
                  <div>
                    <CardTitle className="text-base">
                      {VISTAS.find((v) => v.id === vista)?.label}
                    </CardTitle>
                    <CardDescription>{filas.length} fila(s)</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCsv(`dw_${vista}.csv`, filas)}
                  >
                    <Download className="h-4 w-4" /> CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0 sm:p-0">
                  <TablaGenerica filas={filas} />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Historial de cargas ETL */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
          <CardTitle className="text-base">Historial de cargas ETL</CardTitle>
          <CardDescription>Registro de cada ejecución (dbo.Control_Cargas_ETL).</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {historialQuery.isLoading ? (
            <LoadingState message="Consultando historial de cargas..." />
          ) : historialQuery.isError ? (
            <ErrorState error={historialQuery.error} onRetry={() => historialQuery.refetch()} />
          ) : (historialQuery.data ?? []).length === 0 ? (
            <p className="p-4 text-xs text-sigemun-muted">Todavía no se ha ejecutado ninguna carga.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-sigemun-border bg-sigemun-bg text-[11px] font-bold uppercase tracking-[0.08em] text-sigemun-muted">
                    <th className="px-3 py-2.5">Carga</th>
                    <th className="px-3 py-2.5">Inicio</th>
                    <th className="px-3 py-2.5">Duración</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5">Ejecutado por</th>
                    <th className="px-3 py-2.5">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sigemun-border">
                  {(historialQuery.data ?? []).map((h) => (
                    <tr key={h.idCarga} className="even:bg-sigemun-surface">
                      <td className="px-3 py-2.5 font-mono font-bold text-sigemun-primary">#{h.idCarga}</td>
                      <td className="px-3 py-2.5">{formatDateTime(h.fechaInicio)}</td>
                      <td className="px-3 py-2.5">
                        {h.duracionSegundos != null ? `${h.duracionSegundos} s` : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={estadoBadge(h.estado)}>{h.estado}</Badge>
                      </td>
                      <td className="px-3 py-2.5">{h.ejecutadoPor || '—'}</td>
                      <td className="max-w-md px-3 py-2.5 text-xs text-sigemun-muted">{h.detalle || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={confirmarEtl}
        onClose={() => !etlMut.isPending && setConfirmarEtl(false)}
        title="Ejecutar carga ETL"
        description="Se extraerán los datos de MunicipalidadNicoya2026 hacia el Data Mart."
      >
        <div className="space-y-4 text-sm">
          <p>
            La carga recalcula las dimensiones y tablas de hechos. Puede tardar varios minutos según
            el volumen de datos; no cierre esta ventana mientras se ejecuta.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={etlMut.isPending} onClick={() => setConfirmarEtl(false)}>
              Cancelar
            </Button>
            <Button disabled={etlMut.isPending} onClick={() => etlMut.mutate()}>
              {etlMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Ejecutando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Ejecutar ahora
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers de presentación
// ---------------------------------------------------------------------------

const ETIQUETAS: Record<string, string> = {
  anio: 'Año',
  trimestre: 'Trimestre',
  mes: 'Mes',
  nombreMes: 'Mes',
  totalRecaudadoPrincipal: 'Principal',
  totalRecaudadoIntereses: 'Intereses',
  totalDescuentosAplicados: 'Descuentos',
  totalRecaudadoGeneral: 'Total recaudado',
  transaccionesRegistradas: 'Transacciones',
  codigoTributo: 'Código',
  nombreTributo: 'Tributo',
  categoriaTributo: 'Categoría',
  periodicidad: 'Periodicidad',
  totalPrincipal: 'Principal',
  totalIntereses: 'Intereses',
  totalRecaudado: 'Total recaudado',
  distrito: 'Distrito',
  zonaRuralUrbana: 'Zona',
  totalPagosDistrito: 'Pagos',
  saldoVencido: 'Saldo vencido',
  cantidadContribuyentesMorosos: 'Contribuyentes morosos',
  nombreTramite: 'Trámite',
  plazoCompromisoSla: 'SLA (días)',
  nombreDepartamento: 'Departamento',
  estadoFinal: 'Estado final',
  diasPromedioConsumidos: 'Días promedio',
  cantidadTramites: 'Trámites',
  estadoCumplimiento: 'Cumplimiento',
  volumenTotalGestionado: 'Volumen gestionado',
  promedioDiasResolucionArea: 'Días promedio resolución',
  tramitesAprobados: 'Aprobados',
  tramitesRechazados: 'Rechazados',
};

const CAMPOS_MONEDA = new Set([
  'totalRecaudadoPrincipal',
  'totalRecaudadoIntereses',
  'totalDescuentosAplicados',
  'totalRecaudadoGeneral',
  'totalPrincipal',
  'totalIntereses',
  'totalRecaudado',
  'saldoVencido',
]);

function formatearCelda(clave: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'number') {
    if (CAMPOS_MONEDA.has(clave)) return formatCurrencyCRC(valor);
    return Number.isInteger(valor) ? formatNumber(valor) : formatNumber(valor, 2);
  }
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return String(valor);
}

function TablaGenerica({
  filas,
  columnas,
}: {
  filas: Record<string, unknown>[];
  columnas?: [string, string][];
}) {
  const cols: [string, string][] =
    columnas ?? Object.keys(filas[0] ?? {}).map((k) => [k, ETIQUETAS[k] ?? k]);
  return (
    <div className="max-h-[480px] overflow-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="sticky top-0 border-b border-sigemun-border bg-sigemun-bg text-[11px] font-bold uppercase tracking-[0.08em] text-sigemun-muted">
            {cols.map(([k, label]) => (
              <th key={k} className="whitespace-nowrap px-3 py-2.5">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sigemun-border">
          {filas.map((f, idx) => (
            <tr key={idx} className="even:bg-sigemun-surface">
              {cols.map(([k]) => (
                <td key={k} className="whitespace-nowrap px-3 py-2">
                  {formatearCelda(k, f[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface GraficoDw {
  titulo: string;
  subtitulo?: string;
  moneda: boolean;
  datos: Record<string, unknown>[];
  series: { clave: string; nombre: string; color: string }[];
}

function construirGrafico(vista: Vista, filas: Record<string, unknown>[]): GraficoDw | null {
  if (filas.length === 0) return null;
  const num = (v: unknown) => (typeof v === 'number' ? v : 0);
  switch (vista) {
    case 'periodo':
      return {
        titulo: 'Recaudación mensual',
        moneda: true,
        datos: filas.map((f) => ({
          etiqueta: `${f.nombreMes ?? f.mes} ${f.anio ?? ''}`.trim(),
          principal: num(f.totalRecaudadoPrincipal),
          intereses: num(f.totalRecaudadoIntereses),
        })),
        series: [
          { clave: 'principal', nombre: 'Principal (₡)', color: '#1E5A9C' },
          { clave: 'intereses', nombre: 'Intereses (₡)', color: '#3E8FD6' },
        ],
      };
    case 'tributo':
      return {
        titulo: 'Recaudación por tributo',
        moneda: true,
        datos: filas.map((f) => ({ etiqueta: f.codigoTributo ?? f.nombreTributo, total: num(f.totalRecaudado) })),
        series: [{ clave: 'total', nombre: 'Total recaudado (₡)', color: '#1E5A9C' }],
      };
    case 'ubicacion':
      return {
        titulo: 'Recaudación por distrito',
        moneda: true,
        datos: filas.map((f) => ({ etiqueta: f.distrito, total: num(f.totalRecaudado) })),
        series: [{ clave: 'total', nombre: 'Total recaudado (₡)', color: '#1E5A9C' }],
      };
    case 'morosidad': {
      const porDistrito = new Map<string, number>();
      for (const f of filas) {
        const k = String(f.distrito ?? '—');
        porDistrito.set(k, (porDistrito.get(k) ?? 0) + num(f.saldoVencido));
      }
      return {
        titulo: 'Saldo vencido por distrito',
        subtitulo: 'Suma de todos los periodos y tributos',
        moneda: true,
        datos: Array.from(porDistrito, ([etiqueta, saldo]) => ({ etiqueta, saldo })),
        series: [{ clave: 'saldo', nombre: 'Saldo vencido (₡)', color: '#B91C1C' }],
      };
    }
    case 'eficiencia':
      return null;
    case 'departamento':
      return {
        titulo: 'Resultados por departamento',
        moneda: false,
        datos: filas.map((f) => ({
          etiqueta: f.nombreDepartamento,
          aprobados: num(f.tramitesAprobados),
          rechazados: num(f.tramitesRechazados),
        })),
        series: [
          { clave: 'aprobados', nombre: 'Aprobados', color: '#1E5A9C' },
          { clave: 'rechazados', nombre: 'Rechazados', color: '#3E8FD6' },
        ],
      };
  }
}
