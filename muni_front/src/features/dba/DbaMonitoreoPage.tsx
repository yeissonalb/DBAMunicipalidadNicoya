import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Landmark,
  Loader2,
  MemoryStick,
  RefreshCw,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import { monitoreoDbaApi } from '@/services/api';
import type { SpDbaMantenimientoResultDto, SpDbaMonitorSesionResultDto } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatDateTime, formatNumber } from '@/lib/utils';

type Pestana = 'sesiones' | 'archivos' | 'indices' | 'mantenimiento';

const TH =
  'border-b border-sigemun-border bg-sigemun-bg text-[11px] font-bold uppercase tracking-[0.08em] text-sigemun-muted';

/** CU-DBA-04 (monitoreo con DMVs) y CU-DBA-06 (mantenimiento de índices y estadísticas). */
export function DbaMonitoreoPage() {
  const queryClient = useQueryClient();
  const [pestana, setPestana] = useState<Pestana>('sesiones');
  const [umbral, setUmbral] = useState(5);
  const [verTodasLasBases, setVerTodasLasBases] = useState(false);
  const [sesionATerminar, setSesionATerminar] = useState<SpDbaMonitorSesionResultDto | null>(null);
  const [opciones, setOpciones] = useState({
    optimizarIndices: false,
    actualizarEstadisticas: false,
    purgarRespaldos: false,
  });
  const [resultadoMant, setResultadoMant] = useState<SpDbaMantenimientoResultDto[] | null>(null);

  const resumenQuery = useQuery({
    queryKey: ['monitoreo', 'resumen'],
    queryFn: () => monitoreoDbaApi.resumen(),
    refetchInterval: 30_000,
  });
  const sesionesQuery = useQuery({
    queryKey: ['monitoreo', 'sesiones', umbral],
    queryFn: () => monitoreoDbaApi.sesiones(umbral),
    enabled: pestana === 'sesiones',
    refetchInterval: pestana === 'sesiones' ? 15_000 : false,
  });
  const archivosQuery = useQuery({
    queryKey: ['monitoreo', 'archivos'],
    queryFn: () => monitoreoDbaApi.archivos(),
    enabled: pestana === 'archivos',
  });
  const fragmentacionQuery = useQuery({
    queryKey: ['monitoreo', 'fragmentacion'],
    queryFn: () => monitoreoDbaApi.fragmentacion(),
    enabled: pestana === 'indices' || pestana === 'mantenimiento',
  });
  const historialMantQuery = useQuery({
    queryKey: ['monitoreo', 'historial-mantenimiento'],
    queryFn: () => monitoreoDbaApi.historialMantenimiento(),
    enabled: pestana === 'mantenimiento',
  });

  const terminarMut = useMutation({
    mutationFn: (id: number) => monitoreoDbaApi.terminarSesion(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Sesión terminada.');
      setSesionATerminar(null);
      queryClient.invalidateQueries({ queryKey: ['monitoreo'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const mantenimientoMut = useMutation({
    mutationFn: () => monitoreoDbaApi.ejecutarMantenimiento(opciones),
    onSuccess: (res) => {
      setResultadoMant(res.data ?? []);
      toast.success(res.message || 'Mantenimiento finalizado.');
      queryClient.invalidateQueries({ queryKey: ['monitoreo'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const r = resumenQuery.data;
  const archivosVisibles = (archivosQuery.data ?? []).filter(
    (a) => verTodasLasBases || (r?.baseDatos != null && a.baseDatos === r.baseDatos),
  );
  const actualizando = queryClient.isFetching({ queryKey: ['monitoreo'] }) > 0;

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Monitoreo y mantenimiento"
        subtitle="Salud del servidor SQL Server, sesiones activas, almacenamiento e índices."
        badge={r?.baseDatos ?? 'SQL Server'}
        icon={<Activity className="h-6 w-6" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={actualizando}
            title="Volver a consultar las métricas; no modifica datos ni termina sesiones"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['monitoreo'] })}
          >
            <RefreshCw className={`h-4 w-4 ${actualizando ? 'animate-spin' : ''}`} /> {actualizando ? 'Recargando...' : 'Recargar métricas'}
          </Button>
        }
      />

      <nav
        className="grid gap-3 rounded-2xl border border-sigemun-border bg-white p-3 shadow-card sm:grid-cols-3"
        aria-label="Consola DBA"
      >
        <Button variant="outline" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/dba/politicas">
            <Database className="h-4 w-4" /> Políticas de respaldo
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/dba/respaldos">
            <Landmark className="h-4 w-4" /> Respaldos y recuperación
          </Link>
        </Button>
        <Button variant="default" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/dba/monitoreo">
            <Activity className="h-4 w-4" /> Monitoreo y mantenimiento
          </Link>
        </Button>
      </nav>

      <p className="text-sm text-sigemun-muted">
        Servidor: recursos del equipo donde se ejecuta SQL Server. Motor: actividad de la instancia,
        incluidas otras bases. Base municipal: archivos e índices de {r?.baseDatos ?? 'la base configurada'}.
        Estas métricas no representan únicamente el consumo del aplicativo. El resumen se actualiza cada 30 segundos.
      </p>
      {/* Resumen del servidor */}
      {resumenQuery.isLoading ? (
        <LoadingState message="Leyendo vistas de administración dinámica (DMV)..." />
      ) : resumenQuery.isError ? (
        <ErrorState error={resumenQuery.error} onRetry={() => resumenQuery.refetch()} />
      ) : r ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              icon={<Cpu className="h-4 w-4" />}
              titulo="CPU de SQL Server"
              valor={r.cpuSqlPct != null ? `${formatNumber(r.cpuSqlPct)}%` : 'No disponible'}
              detalle={`Motor · Otros procesos: ${r.cpuOtrosPct == null ? 'sin medición' : `${formatNumber(r.cpuOtrosPct)}%`} · ${r.cpus ?? '—'} CPU del servidor`}
              alerta={(r.cpuSqlPct ?? 0) >= 80}
            />
            <Kpi
              icon={<MemoryStick className="h-4 w-4" />}
              titulo="Servidor · Memoria total en uso"
              valor={r.memoriaUsoPct != null ? `${formatNumber(r.memoriaUsoPct, 1)}%` : '—'}
              detalle={`Incluye Windows y otros programas. Motor SQL: ${r.memoriaSqlMb == null ? 'sin medición' : `${formatNumber(r.memoriaSqlMb)} MB`}; servidor libre: ${formatNumber(r.memoriaDisponibleMb)} MB`}
              alerta={(r.memoriaUsoPct ?? 0) >= 90}
            />
            <Kpi
              icon={<Users className="h-4 w-4" />}
              titulo="Motor · Sesiones de usuario"
              valor={formatNumber(r.conexionesUsuario)}
              detalle={`${r.solicitudesActivas ?? 0} solicitudes en ejecución (incluye procesos internos) · ${r.sesionesBloqueadas ?? 0} bloqueadas · ${r.transaccionesActivas ?? 0} transacciones`}
              alerta={(r.sesionesBloqueadas ?? 0) > 0}
            />
            <Kpi
              icon={<HardDrive className="h-4 w-4" />}
              titulo="Base municipal · Datos usados / asignados"
              valor={`${formatNumber(r.datosUsadoMb, 1)} / ${formatNumber(r.datosMb, 1)} MB`}
              detalle={`Log ${formatNumber(r.logMb, 1)} MB (${formatNumber(r.logUsadoPct, 1)}% usado)`}
              alerta={(r.logUsadoPct ?? 0) >= 80}
            />
          </div>
          <Card>
            <CardContent className="grid gap-2 pt-5 text-xs text-sigemun-muted sm:grid-cols-2 sm:pt-5 xl:grid-cols-4">
              <p>
                <strong className="text-sigemun-text">Servidor:</strong> {r.servidor}
              </p>
              <p>
                <strong className="text-sigemun-text">Motor:</strong> {r.edicion} {r.versionMotor}
              </p>
              <p>
                <strong className="text-sigemun-text">Activo desde:</strong>{' '}
                {formatDateTime(r.inicioServicio)} ({formatNumber((r.minutosActivo ?? 0) / 60, 1)} h)
              </p>
              <p>
                <strong className="text-sigemun-text">Último FULL / DIFF:</strong>{' '}
                {r.ultimoBackupFull ? formatDateTime(r.ultimoBackupFull) : 'nunca'} /{' '}
                {r.ultimoBackupDiferencial ? formatDateTime(r.ultimoBackupDiferencial) : 'nunca'}
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}

      <nav
        className="grid gap-2 rounded-2xl border border-sigemun-border bg-white p-3 shadow-card sm:grid-cols-4"
        aria-label="Secciones de monitoreo"
      >
        {(
          [
            ['sesiones', 'Sesiones y bloqueos', <Users key="i" className="h-4 w-4" />],
            ['archivos', 'Archivos y discos', <HardDrive key="i" className="h-4 w-4" />],
            ['indices', 'Fragmentación de índices', <Database key="i" className="h-4 w-4" />],
            ['mantenimiento', 'Mantenimiento', <Wrench key="i" className="h-4 w-4" />],
          ] as [Pestana, string, ReactNode][]
        ).map(([id, label, icon]) => (
          <Button
            key={id}
            variant={pestana === id ? 'default' : 'outline'}
            className="h-auto justify-start px-3 py-2.5 text-xs"
            onClick={() => setPestana(id)}
          >
            {icon} {label}
          </Button>
        ))}
      </nav>

      {/* SESIONES */}
      {pestana === 'sesiones' && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 border-b border-sigemun-border bg-sigemun-surface sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Sesiones de usuario de la instancia</CardTitle>
              <CardDescription>
                Incluye conexiones de SSMS, la API y otros programas. Se actualiza cada 15 s. Las consultas que superan el umbral se marcan como lentas.
              </CardDescription>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold">
              Umbral consulta lenta (s)
              <Input
                type="number"
                min={1}
                value={umbral}
                onChange={(e) => setUmbral(Math.max(1, Number(e.target.value) || 1))}
                className="h-8 w-20 text-xs"
              />
            </label>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {sesionesQuery.isLoading ? (
              <LoadingState message="Consultando sys.dm_exec_sessions..." />
            ) : sesionesQuery.isError ? (
              <ErrorState error={sesionesQuery.error} onRetry={() => sesionesQuery.refetch()} />
            ) : (
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1100px] text-left text-xs">
                  <thead>
                    <tr className={`sticky top-0 ${TH}`}>
                      <th className="px-3 py-2.5">SPID</th>
                      <th className="px-3 py-2.5">Login / Equipo</th>
                      <th className="px-3 py-2.5">Programa</th>
                      <th className="px-3 py-2.5">Estado / Espera</th>
                      <th className="px-3 py-2.5">Bloqueo</th>
                      <th className="px-3 py-2.5">Tiempo / CPU</th>
                      <th className="px-3 py-2.5">Consulta</th>
                      <th className="px-3 py-2.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sigemun-border">
                    {(sesionesQuery.data ?? []).map((s) => (
                      <tr
                        key={s.sessionId}
                        className={
                          s.bloqueadaPor
                            ? 'bg-red-50'
                            : s.esBloqueante
                              ? 'bg-amber-50'
                              : 'even:bg-sigemun-surface'
                        }
                      >
                        <td className="px-3 py-2 font-mono font-bold text-sigemun-primary">
                          {s.sessionId}
                          {s.esSesionActual && (
                            <Badge variant="info" className="ml-1">
                              actual
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold">{s.loginName}</p>
                          <p className="text-[10px] text-sigemun-muted">
                            {s.hostName} {s.direccionIp ? `· ${s.direccionIp}` : ''}
                          </p>
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2" title={s.programa ?? undefined}>
                          {s.programa}
                        </td>
                        <td className="px-3 py-2">
                          <p>{s.estado}</p>
                          <p className="text-[10px] text-sigemun-muted">{s.tipoEspera || s.comando || ''}</p>
                        </td>
                        <td className="px-3 py-2">
                          {s.bloqueadaPor ? (
                            <Badge variant="danger">Bloqueada por {s.bloqueadaPor}</Badge>
                          ) : s.esBloqueante ? (
                            <Badge variant="warning">Bloqueante</Badge>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {s.segundosEjecucion != null ? (
                            <Badge variant={s.consultaLenta ? 'danger' : 'outline'}>
                              {formatNumber(s.segundosEjecucion)} s
                            </Badge>
                          ) : (
                            '—'
                          )}
                          <p className="text-[10px] text-sigemun-muted">
                            CPU {formatNumber(s.cpuMs)} ms · {formatNumber(s.lecturasLogicas)} lect.
                          </p>
                        </td>
                        <td
                          className="max-w-[280px] truncate px-3 py-2 font-mono text-[10px]"
                          title={s.consulta ?? undefined}
                        >
                          {s.consulta || '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={s.esSesionActual}
                            title={s.esSesionActual ? 'No puede terminar la sesión de la API' : 'Terminar sesión (KILL)'}
                            onClick={() => setSesionATerminar(s)}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Terminar
                          </Button>
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

      {/* ARCHIVOS */}
      {pestana === 'archivos' && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
            <CardTitle className="text-base">Archivos de datos y log · {verTodasLasBases ? 'Bases relacionadas' : r?.baseDatos ?? 'Base municipal'}</CardTitle>
            <CardDescription>
              Tamaño asignado y usado por archivo. El espacio libre corresponde al disco del servidor,
              compartido con Windows y otros programas. «No disponible» no significa cero.
            </CardDescription>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={verTodasLasBases} onChange={(e) => setVerTodasLasBases(e.target.checked)} />
              Incluir Data Warehouse y base de mantenimiento
            </label>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {archivosQuery.isLoading ? (
              <LoadingState message="Consultando sys.database_files..." />
            ) : archivosQuery.isError ? (
              <ErrorState error={archivosQuery.error} onRetry={() => archivosQuery.refetch()} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-xs">
                  <thead>
                    <tr className={TH}>
                      <th className="px-3 py-2.5">Base / Archivo</th>
                      <th className="px-3 py-2.5">Tipo</th>
                      <th className="px-3 py-2.5">Ruta física</th>
                      <th className="px-3 py-2.5">Tamaño</th>
                      <th className="px-3 py-2.5">Usado</th>
                      <th className="px-3 py-2.5">Máximo</th>
                      <th className="px-3 py-2.5">Volumen libre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sigemun-border">
                    {archivosVisibles.map((a, i) => (
                      <tr key={`${a.baseDatos}-${a.archivoLogico}-${i}`} className="even:bg-sigemun-surface">
                        <td className="px-3 py-2">
                          <p className="font-semibold">{a.archivoLogico}</p>
                          <p className="text-[10px] text-sigemun-muted">{a.baseDatos}</p>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={a.tipo === 'LOG' ? 'accent' : 'outline'}>{a.tipo}</Badge>
                        </td>
                        <td className="max-w-[280px] truncate px-3 py-2 font-mono text-[10px]" title={a.rutaFisica ?? undefined}>
                          {a.rutaFisica}
                        </td>
                        <td className="px-3 py-2">{formatNumber(a.tamanoMb, 1)} MB</td>
                        <td className="px-3 py-2">{a.usadoMb != null ? `${formatNumber(a.usadoMb, 1)} MB` : 'No disponible'}</td>
                        <td className="px-3 py-2">{a.maximoMb != null ? `${formatNumber(a.maximoMb, 0)} MB` : 'Ilimitado'}</td>
                        <td className="px-3 py-2">
                          {a.volumenLibrePct != null ? (
                            <Badge variant={a.volumenLibrePct < 15 ? 'danger' : 'success'}>
                              {a.volumen} {formatNumber(a.volumenLibrePct, 1)}% ({formatNumber((a.volumenLibreMb ?? 0) / 1024, 1)} GB)
                            </Badge>
                          ) : (
                            '—'
                          )}
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

      {/* ÍNDICES */}
      {(pestana === 'indices' || pestana === 'mantenimiento') && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
            <CardTitle className="text-base">Fragmentación de índices</CardTitle>
            <CardDescription>
              Se muestran todos los índices, incluso los que tienen 0 %. La recomendación proviene de SQL Server; los índices pequeños pueden quedar sin intervención.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {fragmentacionQuery.isLoading ? (
              <LoadingState message="Consultando sys.dm_db_index_physical_stats..." />
            ) : fragmentacionQuery.isError ? (
              <ErrorState error={fragmentacionQuery.error} onRetry={() => fragmentacionQuery.refetch()} />
            ) : (fragmentacionQuery.data ?? []).length === 0 ? (
              <p className="p-4 text-xs text-sigemun-muted">La consulta no devolvió índices para esta base.</p>
            ) : (
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead>
                    <tr className={`sticky top-0 ${TH}`}>
                      <th className="px-3 py-2.5">Tabla</th>
                      <th className="px-3 py-2.5">Índice</th>
                      <th className="px-3 py-2.5">Tipo</th>
                      <th className="px-3 py-2.5">Fragmentación</th>
                      <th className="px-3 py-2.5">Páginas</th>
                      <th className="px-3 py-2.5">Recomendación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sigemun-border">
                    {(fragmentacionQuery.data ?? []).map((f, i) => (
                      <tr key={`${f.tabla}-${f.indice}-${i}`} className="even:bg-sigemun-surface">
                        <td className="px-3 py-2 font-semibold">{f.tabla}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{f.indice}</td>
                        <td className="px-3 py-2">{f.tipoIndice}</td>
                        <td className="px-3 py-2">
                          <Badge variant={f.accionRecomendada?.startsWith('REBUILD') ? 'danger' : f.accionRecomendada?.startsWith('REORGANIZE') ? 'warning' : 'outline'}>
                            {formatNumber(f.fragmentacionPct, 1)}%
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{formatNumber(f.paginas)}</td>
                        <td className="px-3 py-2">{f.accionRecomendada?.startsWith('NINGUNA') ? (f.accionRecomendada.includes('(') ? 'Sin intervención (índice pequeño)' : 'Sin intervención') : f.accionRecomendada}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MANTENIMIENTO */}
      {pestana === 'mantenimiento' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ejecutar plan de mantenimiento</CardTitle>
              <CardDescription>
                Seleccione explícitamente las tareas que desea ejecutar sobre la base municipal.
                La optimización puede bloquear operaciones y tardar varios minutos. Las recomendaciones se calculan en la base de datos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-5 text-sm">
                {(
                  [
                    ['optimizarIndices', 'Optimizar índices'],
                    ['actualizarEstadisticas', 'Actualizar estadísticas'],
                    ['purgarRespaldos', 'Purgar respaldos vencidos (según retención)'],
                  ] as [keyof typeof opciones, string][]
                ).map(([k, label]) => (
                  <label key={k} className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opciones[k]}
                      onChange={(e) => setOpciones((o) => ({ ...o, [k]: e.target.checked }))}
                      className="h-4 w-4 rounded border-sigemun-border text-sigemun-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <Button
                disabled={
                  mantenimientoMut.isPending ||
                  (!opciones.optimizarIndices && !opciones.actualizarEstadisticas && !opciones.purgarRespaldos)
                }
                onClick={() => mantenimientoMut.mutate()}
              >
                {mantenimientoMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ejecutando mantenimiento...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4" /> Ejecutar ahora
                  </>
                )}
              </Button>

              {resultadoMant && (
                <div className="overflow-x-auto rounded-lg border border-sigemun-border">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={TH}>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Tarea</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Duración</th>
                        <th className="px-3 py-2">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sigemun-border">
                      {resultadoMant.map((t) => (
                        <tr key={t.orden}>
                          <td className="px-3 py-2">{t.orden}</td>
                          <td className="px-3 py-2 font-semibold">{t.tarea}</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={
                                /OK|EXIT|COMPLET/i.test(t.estado ?? '')
                                  ? 'success'
                                  : /ADVERT/i.test(t.estado ?? '')
                                    ? 'warning'
                                    : /OMIT/i.test(t.estado ?? '')
                                      ? 'outline'
                                      : 'danger'
                              }
                            >
                              {t.estado}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            {t.duracionSegundos != null ? `${t.duracionSegundos} s` : '—'}
                          </td>
                          <td className="px-3 py-2 text-sigemun-muted">{t.detalle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
              <CardTitle className="text-base">Historial de mantenimiento</CardTitle>
              <CardDescription>
                Últimos comandos registrados en MaintenanceDB.dbo.CommandLog (vacío si no está instalado).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {historialMantQuery.isLoading ? (
                <LoadingState message="Consultando CommandLog..." />
              ) : historialMantQuery.isError ? (
                <ErrorState error={historialMantQuery.error} onRetry={() => historialMantQuery.refetch()} />
              ) : (historialMantQuery.data ?? []).length === 0 ? (
                <p className="p-4 text-xs text-sigemun-muted">Sin registros de mantenimiento.</p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead>
                      <tr className={`sticky top-0 ${TH}`}>
                        <th className="px-3 py-2.5">Inicio</th>
                        <th className="px-3 py-2.5">Tipo</th>
                        <th className="px-3 py-2.5">Objeto / Índice</th>
                        <th className="px-3 py-2.5">Duración</th>
                        <th className="px-3 py-2.5">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sigemun-border">
                      {(historialMantQuery.data ?? []).map((h, i) => (
                        <tr key={h.id ?? i} className="even:bg-sigemun-surface">
                          <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(h.inicio)}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline">{h.tipoComando}</Badge>
                          </td>
                          <td className="px-3 py-2" title={h.comando ?? undefined}>
                            <p className="font-semibold">{h.objeto || h.baseDatos}</p>
                            <p className="font-mono text-[10px] text-sigemun-muted">{h.indice}</p>
                          </td>
                          <td className="px-3 py-2">
                            {h.duracionSegundos != null ? `${h.duracionSegundos} s` : '—'}
                          </td>
                          <td className="px-3 py-2">
                            {h.numeroError ? (
                              <Badge variant="danger" title={h.mensajeError ?? undefined}>
                                Error {h.numeroError}
                              </Badge>
                            ) : (
                              <Badge variant="success">OK</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Modal
        open={Boolean(sesionATerminar)}
        onClose={() => setSesionATerminar(null)}
        title={`Terminar sesión ${sesionATerminar?.sessionId ?? ''}`}
        description="Se ejecutará KILL sobre la sesión. Las transacciones abiertas se revertirán."
      >
        {sesionATerminar && (
          <div className="space-y-4 text-sm">
            <p>
              Login <strong>{sesionATerminar.loginName}</strong> desde{' '}
              <strong>{sesionATerminar.hostName || 'equipo desconocido'}</strong>
              {sesionATerminar.programa ? ` (${sesionATerminar.programa})` : ''}.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSesionATerminar(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={terminarMut.isPending}
                onClick={() => terminarMut.mutate(sesionATerminar.sessionId)}
              >
                {terminarMut.isPending ? 'Terminando...' : 'Terminar sesión'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Kpi({
  icon,
  titulo,
  valor,
  detalle,
  alerta,
}: {
  icon: ReactNode;
  titulo: string;
  valor: string;
  detalle: string;
  alerta?: boolean;
}) {
  return (
    <Card className={`border-l-4 ${alerta ? 'border-l-red-600' : 'border-l-sigemun-primary'}`}>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          {icon} {titulo}
        </CardDescription>
        <CardTitle className={`text-2xl font-extrabold ${alerta ? 'text-red-700' : 'text-sigemun-primary'}`}>
          {valor}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-sigemun-muted">{detalle}</CardContent>
    </Card>
  );
}
