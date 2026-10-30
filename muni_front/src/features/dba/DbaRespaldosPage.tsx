import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  Info,
  Landmark,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { respaldosDbaApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/forms/FormField';
import { formatDateTime, formatNumber } from '@/lib/utils';

export function DbaRespaldosPage() {
  const queryClient = useQueryClient();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Panel Derecho del Wireframe 4 (p. 115): RESTAURAR RESPALDO (Recuperación ante Desastres)
  const [rutaBackupFull, setRutaBackupFull] = useState('');
  const [motivoRestauracion, setMotivoRestauracion] = useState(
    'Prueba periódica de contingencia y verificación de legibilidad (RESTORE VERIFYONLY)'
  );
  const [confirmCheck, setConfirmCheck] = useState(false);

  const estadoQuery = useQuery({
    queryKey: ['dba', 'estado'],
    queryFn: () => respaldosDbaApi.estado(),
  });

  const historialQuery = useQuery({
    queryKey: ['dba', 'historial', fechaInicio, fechaFin],
    queryFn: () =>
      respaldosDbaApi.historial(fechaInicio || undefined, fechaFin || undefined),
  });

  const backupFullMut = useMutation({
    mutationFn: () => respaldosDbaApi.backupFull(),
    onSuccess: (res) => {
      toast.success(res.message || 'Respaldo FULL inmediato ejecutado.');
      queryClient.invalidateQueries({ queryKey: ['dba'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const backupDiffMut = useMutation({
    mutationFn: () => respaldosDbaApi.backupDiferencial(),
    onSuccess: (res) => {
      toast.success(res.message || 'Respaldo DIFERENCIAL inmediato ejecutado.');
      queryClient.invalidateQueries({ queryKey: ['dba'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verificarIntegridadMut = useMutation({
    mutationFn: () => respaldosDbaApi.verificarIntegridad(),
    onSuccess: (res) => {
      toast.success(res.message || 'DBCC CHECKDB completado sin errores.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const simularRestauracionMut = useMutation({
    mutationFn: () => {
      if (!rutaBackupFull.trim()) {
        throw new Error('Seleccione o ingrese la ruta del archivo .bak en el servidor SQL.');
      }
      if (!confirmCheck) {
        throw new Error('Debe marcar la casilla de confirmación explícita antes de continuar.');
      }
      return respaldosDbaApi.simularRestauracion({
        rutaBackupFull: rutaBackupFull.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Simulacro de restauración ejecutado y auditado exitosamente.');
      setConfirmCheck(false);
      queryClient.invalidateQueries({ queryKey: ['dba'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const ultimoRespaldo = historialQuery.data?.[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consola Técnica DBA — Respaldos y Recuperación ante Desastres"
        subtitle="Historial de respaldos ejecutados, verificación criptográfica SHA-256 y simulacro de restauración (Wireframe #4, p. 115)"
        badge="CU-DBA-02 a CU-DBA-05"
        icon={<Landmark className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['dba'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={backupDiffMut.isPending}
              onClick={() => backupDiffMut.mutate()}
            >
              <Play className="h-4 w-4" /> Backup DIFERENCIAL
            </Button>
            <Button
              variant="gold"
              size="sm"
              disabled={backupFullMut.isPending}
              onClick={() => backupFullMut.mutate()}
            >
              <Play className="h-4 w-4" /> Generar Respaldo FULL Inmediato
            </Button>
          </>
        }
      />

      {/* Subnavegación Consola DBA */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#DCE3DE] pb-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/dba/politicas">
            <Database className="h-4 w-4" /> Políticas de Respaldo
          </Link>
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link to="/dba/respaldos">
            <Landmark className="h-4 w-4" /> Respaldos y Recuperación
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/auditoria">
            <ShieldCheck className="h-4 w-4" /> Historial y Auditoría Técnica
          </Link>
        </Button>
      </div>

      {/* 3 Tarjetas Superiores del Wireframe 4 (p. 115): DATABASE ENGINE, ÚLTIMO RESPALDO, HISTORIAL */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-[#164B35]">
          <CardHeader className="pb-2">
            <CardDescription>DATABASE ENGINE</CardDescription>
            <CardTitle className="text-lg font-extrabold text-[#164B35]">
              Microsoft SQL Server · DB_Municipalidad_Nicoya
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[#5A6B61]">
            Timeout extendido DBA: <strong>15 minutos</strong> para operaciones{' '}
            <code className="font-mono">BACKUP</code> y <code className="font-mono">DBCC</code>.
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#B6944A]">
          <CardHeader className="pb-2">
            <CardDescription>ÚLTIMO RESPALDO REGISTRADO</CardDescription>
            <CardTitle className="text-lg font-extrabold text-[#26352D]">
              {ultimoRespaldo
                ? `${ultimoRespaldo.codigoTipoDeRespaldo} · ${formatNumber(
                    ultimoRespaldo.tamanoMb,
                    2
                  )} MB`
                : 'Sin registros en el rango'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[#5A6B61]">
            {ultimoRespaldo
              ? `Fecha: ${formatDateTime(ultimoRespaldo.fechaInicio)} (${ultimoRespaldo.estadoRespaldo})`
              : 'Ejecute un respaldo inmediato para poblar el historial.'}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription>EJECUCIONES ACUMULADAS EN POLÍTICAS</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-emerald-800">
              {formatNumber(
                (estadoQuery.data ?? []).reduce(
                  (acc, e) => acc + (e.totalEjecuciones ?? 0),
                  0
                )
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[#5A6B61]">
            Archivos verificables mediante <code className="font-mono">RESTORE VERIFYONLY</code>.
          </CardContent>
        </Card>
      </div>

      {/* Layout de 2 Columnas del Wireframe 4: Izquierda Historial de Respaldos, Derecha Restauración */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Columna Izquierda (8 cols): Historial de Respaldos */}
        <div className="space-y-4 xl:col-span-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle>
                    Historial de Respaldos (<code className="font-mono">sp_consultar_historial_respaldos</code>)
                  </CardTitle>
                  <CardDescription>
                    Seleccione cualquier respaldo FULL para enviar su ruta al panel de recuperación.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {historialQuery.isLoading ? (
                <LoadingState message="Consultando bitácora de respaldos..." />
              ) : historialQuery.isError ? (
                <ErrorState
                  error={historialQuery.error}
                  onRetry={() => historialQuery.refetch()}
                />
              ) : !historialQuery.data || historialQuery.data.length === 0 ? (
                <EmptyState
                  title="No hay respaldos registrados en el periodo"
                  description="Presione 'Generar Respaldo FULL Inmediato' para ejecutar un backup real."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[#DCE3DE]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE3DE] bg-[#F5F7F4] font-bold uppercase text-[#5A6B61]">
                        <th className="px-3 py-2.5">ID</th>
                        <th className="px-3 py-2.5">Fecha Inicio / Fin</th>
                        <th className="px-3 py-2.5">Tipo / Política</th>
                        <th className="px-3 py-2.5">Ruta Archivo (.bak)</th>
                        <th className="px-3 py-2.5">Tamaño</th>
                        <th className="px-3 py-2.5">Hash SHA-256</th>
                        <th className="px-3 py-2.5">Estado</th>
                        <th className="px-3 py-2.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE3DE]">
                      {historialQuery.data.map((h) => (
                        <tr key={h.idRespaldoHistorial} className="hover:bg-[#E8F0EC]/40">
                          <td className="px-3 py-2.5 font-mono font-bold text-[#164B35]">
                            #{h.idRespaldoHistorial}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <p>{formatDateTime(h.fechaInicio)}</p>
                            <p className="text-[10px] text-[#5A6B61]">
                              Fin: {formatDateTime(h.fechaFin)}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="gold">{h.codigoTipoDeRespaldo}</Badge>
                            <p className="mt-0.5 text-[11px] font-medium">
                              {h.nombreConfiguracion}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] max-w-[200px] truncate" title={h.rutaArchivo}>
                            {h.rutaArchivo}
                          </td>
                          <td className="px-3 py-2.5 font-semibold whitespace-nowrap">
                            {formatNumber(h.tamanoMb, 2)} MB
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[10px] text-[#5A6B61] max-w-[120px] truncate" title={h.hashVerificacion}>
                            {h.hashVerificacion}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              variant={
                                h.estadoRespaldo.toUpperCase().includes('COMP') ||
                                h.estadoRespaldo.toUpperCase().includes('EXIT') ||
                                h.estadoRespaldo.toUpperCase().includes('OK')
                                  ? 'success'
                                  : 'warning'
                              }
                            >
                              {h.estadoRespaldo}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => verificarIntegridadMut.mutate()}
                                disabled={verificarIntegridadMut.isPending}
                                title="Verificar integridad DBCC CHECKDB"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Integridad
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setRutaBackupFull(h.rutaArchivo)}
                                title="Cargar ruta en el panel de restauración"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#DCE3DE] bg-white p-4 text-xs text-[#5A6B61]">
            <Info className="h-4 w-4 shrink-0 text-[#164B35] mt-0.5" />
            <div>
              <strong>Nota sobre Scripts Administrativos Adicionales (CU-DBA-06):</strong> Los
              scripts <code className="font-mono">07_monitoreo_rendimiento_salud_bd.sql</code> (DMVs
              de sesiones y bloqueos) y{' '}
              <code className="font-mono">10_mantenimiento_indices_estadisticas.sql</code> son
              scripts T-SQL directos del repositorio y no están expuestos como endpoints en{' '}
              <code className="font-mono">RespaldosDbaController</code> (documentado en{' '}
              <code className="font-mono">PENDIENTES_BACKEND.md</code>).
            </div>
          </div>
        </div>

        {/* Columna Derecha (4 cols): RESTAURAR RESPALDO — Recuperación ante Desastres (Wireframe 4) */}
        <div className="xl:col-span-4">
          <Card className="border-t-4 border-t-red-600 sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-900">
                <RotateCcw className="h-5 w-5 text-red-600" /> RESTAURAR RESPALDO (Recuperación
                ante Desastres)
              </CardTitle>
              <CardDescription>
                Ejecuta <code className="font-mono">POST /api/respaldosdba/simular-restauracion</code>{' '}
                (<code className="font-mono">sp_dba_simular_restauracion_contingencia</code>) con{' '}
                <code className="font-mono">RESTORE VERIFYONLY</code> y registro forense.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <span>
                  El procedimiento verifica que el archivo <code className="font-mono">.bak</code>{' '}
                  sea íntegro y legible por SQL Server sin sobrescribir la base de datos activa en
                  producción, y deja constancia en la bitácora de auditoría con su usuario DBA.
                </span>
              </div>

              <FormField label="Base de Datos Objetivo">
                <Input value="DB_Municipalidad_Nicoya" disabled className="bg-[#F5F7F4]" />
              </FormField>

              <FormField
                label="Ruta del Archivo .bak en el Servidor SQL Server"
                required
                hint="Seleccione un respaldo de la tabla izquierda o escriba la ruta física en el servidor."
              >
                <Input
                  placeholder="Ej. C:\Backups\MunicipalidadNicoya\DB_Muni_FULL.bak"
                  value={rutaBackupFull}
                  onChange={(e) => setRutaBackupFull(e.target.value)}
                  className="font-mono text-xs"
                />
              </FormField>

              <FormField label="Motivo Técnico / Protocolo DRP">
                <Input
                  value={motivoRestauracion}
                  onChange={(e) => setMotivoRestauracion(e.target.value)}
                />
              </FormField>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/60 p-3 text-xs font-semibold text-red-900">
                <input
                  type="checkbox"
                  checked={confirmCheck}
                  onChange={(e) => setConfirmCheck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600"
                />
                <span>
                  Confirmar la ejecución del protocolo de verificación y simulacro de restauración
                  de contingencia bajo mi responsabilidad como DBA.
                </span>
              </label>

              <Button
                variant="destructive"
                className="w-full h-11 font-bold"
                disabled={
                  !rutaBackupFull.trim() || !confirmCheck || simularRestauracionMut.isPending
                }
                onClick={() => simularRestauracionMut.mutate()}
              >
                {simularRestauracionMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ejecutando Simulacro en SQL
                    Server...
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4" /> CONFIRMAR RESTAURACIÓN / SIMULACRO
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

