import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
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
import { Calendar } from '@/components/ui/Calendar';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/forms/FormField';
import { formatDateTime, formatNumber } from '@/lib/utils';

export function DbaRespaldosPage() {
  const queryClient = useQueryClient();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Panel Derecho: RESTAURAR RESPALDO (Recuperación ante Desastres)
  const [rutaBackupFull, setRutaBackupFull] = useState('');
  const [motivoRestauracion, setMotivoRestauracion] = useState(
    'Prueba periódica de contingencia y verificación de legibilidad (RESTORE VERIFYONLY)'
  );
  const [openRestoreConfirm, setOpenRestoreConfirm] = useState(false);

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
      return respaldosDbaApi.simularRestauracion({
        rutaBackupFull: rutaBackupFull.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Solicitud completada. Revise el registro de verificación; requiere el procedimiento actualizado por el script 24.');
      setOpenRestoreConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['dba'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setOpenRestoreConfirm(false);
    },
  });

  const ultimoRespaldo = historialQuery.data?.[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consola Técnica DBA — Respaldos y Recuperación ante Desastres"
        subtitle="Historial de respaldos y comprobación de legibilidad mediante RESTORE VERIFYONLY."
        badge="Operaciones Críticas SQL"
        icon={<Landmark className="h-6 w-6" />}
        actions={
          <>
            <Button variant="secondary" disabled={verificarIntegridadMut.isPending} onClick={() => verificarIntegridadMut.mutate()}>
              <CheckCircle2 className="h-4 w-4" /> Comprobar base (DBCC CHECKDB)
            </Button>
            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['dba'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button
              variant="secondary"
              disabled={backupDiffMut.isPending}
              onClick={() => backupDiffMut.mutate()}
            >
              <Play className="h-4 w-4" /> Backup DIFERENCIAL
            </Button>
            <Button
              disabled={backupFullMut.isPending}
              onClick={() => backupFullMut.mutate()}
            >
              <Play className="h-4 w-4" /> Generar Respaldo FULL Inmediato
            </Button>
          </>
        }
      />

      {/* Subnavegación Consola DBA */}
      <nav
        className="grid gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-card sm:grid-cols-3"
        aria-label="Consola DBA"
      >
        <Button variant="secondary" className="justify-start" asChild>
          <Link to="/dba/politicas">
            <Database className="h-4 w-4" /> Políticas de Respaldo y Motor
          </Link>
        </Button>
        <Button variant="default" className="justify-start" asChild>
          <Link to="/dba/respaldos">
            <Landmark className="h-4 w-4" /> Historial y Recuperación (DRP)
          </Link>
        </Button>
        <Button variant="secondary" className="justify-start" asChild>
          <Link to="/auditoria">
            <ShieldCheck className="h-4 w-4" /> Bitácora y Auditoría Forense
          </Link>
        </Button>
      </nav>

      {/* 3 Tarjetas Superiores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-[#1D4ED8]">
          <CardHeader className="pb-2">
            <CardDescription>DATABASE ENGINE</CardDescription>
            <CardTitle className="text-base font-extrabold text-[#171717]">
              Microsoft SQL Server · MunicipalidadNicoya2026
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-xs text-[#6B7280]">
            Timeout extendido DBA: <strong>15 minutos</strong> para operaciones{' '}
            <code className="font-mono">BACKUP</code> y <code className="font-mono">DBCC</code>.
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#1E3A8A]">
          <CardHeader className="pb-2">
            <CardDescription>ÚLTIMO RESPALDO REGISTRADO</CardDescription>
            <CardTitle className="text-base font-extrabold text-[#171717]">
              {ultimoRespaldo
                ? `${ultimoRespaldo.nombreTipoRespaldo ?? 'Tipo no informado'} · ${formatNumber(
                    ultimoRespaldo.tamanoMb,
                    2
                  )} MB`
                : 'Sin registros en el rango'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-xs text-[#6B7280]">
            {ultimoRespaldo
              ? `Fecha: ${formatDateTime(ultimoRespaldo.fechaInicio)} (${ultimoRespaldo.estadoEjecucion ?? 'Sin estado informado'})`
              : 'Ejecute un respaldo inmediato para poblar el historial.'}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#15803D]">
          <CardHeader className="pb-2">
            <CardDescription>REGISTROS DE EJECUCIÓN CONSULTADOS</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-[#15803D]">
              {estadoQuery.isLoading ? 'Cargando...' : estadoQuery.isError ? 'No disponible' : formatNumber(estadoQuery.data?.length ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-xs text-[#6B7280]">
            Archivos verificables mediante <code className="font-mono">RESTORE VERIFYONLY</code>.
          </CardContent>
        </Card>
      </div>

      {/* Layout de 2 Columnas: Izquierda Historial de Respaldos, Derecha Restauración */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <Card>
            <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <CardTitle>Historial de Respaldos Ejecutados</CardTitle>
                <CardDescription>
                  Seleccione cualquier respaldo para enviar su ruta al panel de recuperación.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-40">
                  <Calendar
                    value={fechaInicio}
                    onChange={setFechaInicio}
                    placeholder="Desde dd/MM/yyyy"
                  />
                </div>
                <div className="w-40">
                  <Calendar
                    value={fechaFin}
                    onChange={setFechaFin}
                    placeholder="Hasta dd/MM/yyyy"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {historialQuery.isLoading ? (
                <div className="p-6">
                  <LoadingState message="Consultando bitácora de respaldos..." />
                </div>
              ) : historialQuery.isError ? (
                <div className="p-6">
                  <ErrorState
                    error={historialQuery.error}
                    onRetry={() => historialQuery.refetch()}
                  />
                </div>
              ) : !historialQuery.data || historialQuery.data.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No hay respaldos registrados en el periodo"
                    description="Presione 'Generar Respaldo FULL Inmediato' para ejecutar un backup real."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] font-bold uppercase text-[#4B5563]">
                        <th className="px-3.5 py-3">ID</th>
                        <th className="px-3.5 py-3">Fecha Inicio / Fin</th>
                        <th className="px-3.5 py-3">Tipo / Política</th>
                        <th className="px-3.5 py-3">Ruta Archivo (.bak)</th>
                        <th className="px-3.5 py-3">Tamaño</th>
                        <th className="px-3.5 py-3">Detalle de ejecución</th>
                        <th className="px-3.5 py-3">Estado</th>
                        <th className="px-3.5 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {historialQuery.data.map((h) => (
                        <tr key={h.idRespaldos} className="hover:bg-[#F8FAFC]">
                          <td className="px-3.5 py-3 font-mono font-bold text-[#171717]">
                            #{h.idRespaldos}
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <p className="font-medium text-[#171717]">{formatDateTime(h.fechaInicio)}</p>
                            <p className="text-[11px] text-[#6B7280]">
                              Fin: {formatDateTime(h.fechaFin)}
                            </p>
                          </td>
                          <td className="px-3.5 py-3">
                            <Badge variant="blue">{h.nombreTipoRespaldo ?? 'No informado'}</Badge>
                            <p className="mt-0.5 text-[11px] font-medium text-[#4B5563]">
                              {h.nombreConfiguracion}
                            </p>
                          </td>
                          <td
                            className="px-3.5 py-3 font-mono text-[11px] max-w-[180px] truncate"
                            title={h.rutaArchivo}
                          >
                            {h.rutaArchivo}
                          </td>
                          <td className="px-3.5 py-3 font-semibold whitespace-nowrap">
                            {formatNumber(h.tamanoMb, 2)} MB
                          </td>
                          <td
                            className="px-3.5 py-3 font-mono text-[10px] text-[#6B7280] max-w-[120px] truncate"
                            title={h.detallesError ?? undefined}
                          >
                            {h.detallesError || 'Sin detalle adicional'}
                          </td>
                          <td className="px-3.5 py-3">
                            <Badge
                              variant={
                                (h.estadoEjecucion ?? '').toUpperCase().includes('COMP') ||
                                (h.estadoEjecucion ?? '').toUpperCase().includes('EXIT') ||
                                (h.estadoEjecucion ?? '').toUpperCase().includes('OK')
                                  ? 'success'
                                  : 'warning'
                              }
                            >
                              {h.estadoEjecucion || 'Sin estado informado'}
                            </Badge>
                          </td>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">

                              <Button
                                onClick={() => setRutaBackupFull(h.rutaArchivo)}
                                title="Cargar ruta en el panel de restauración"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Seleccionar
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
        </div>

        {/* Columna Derecha (4 cols): RESTAURAR RESPALDO */}
        <div className="xl:col-span-4">
          <Card className="border-t-4 border-t-[#DC2626] sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[#DC2626]">
                <RotateCcw className="h-5 w-5" /> VERIFICAR ARCHIVO DE RESPALDO
              </CardTitle>
              <CardDescription>
                Comprueba el archivo mediante <code className="font-mono">RESTORE VERIFYONLY</code>{' '}
                y registro forense.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] p-3 text-xs text-[#B45309]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Verifica que el archivo <code className="font-mono">.bak</code> sea íntegro y
                  legible por SQL Server sin sobrescribir la base de datos activa en producción.
                </span>
              </div>

              <FormField label="Base de Datos Objetivo">
                <Input value="MunicipalidadNicoya2026" disabled />
              </FormField>

              <FormField
                label="Ruta del Archivo .bak en el Servidor SQL"
                required
                hint="Seleccione un respaldo de la tabla izquierda o escriba la ruta física."
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

              <Button
                variant="destructive"
                className="w-full"
                disabled={!rutaBackupFull.trim() || simularRestauracionMut.isPending}
                onClick={() => setOpenRestoreConfirm(true)}
              >
                {simularRestauracionMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ejecutando en SQL Server...
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4" /> VERIFICAR RESPALDO
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIÁLOGO DE 3 PASOS DE SEGURIDAD PARA RESTAURACIÓN DBA */}
      <ConfirmDialog
        open={openRestoreConfirm}
        onClose={() => setOpenRestoreConfirm(false)}
        variant="default"
        title="Comprobar archivo de respaldo"
        description="Requiere aplicar el script 24. Ejecuta RESTORE VERIFYONLY WITH CHECKSUM sobre el archivo indicado. No restaura ni sobrescribe la base actual. Esta comprobación no sustituye una prueba real de restauración."
        confirmLabel="Verificar archivo"
        isPending={simularRestauracionMut.isPending}
        onConfirm={() => simularRestauracionMut.mutate()}
        impactSummary={
          <div className="space-y-1">
            <p>
              <strong>Archivo .bak seleccionado:</strong>{' '}
              <code className="font-mono">{rutaBackupFull}</code>
            </p>
            <p>
              <strong>Justificación DRP:</strong> {motivoRestauracion}
            </p>
          </div>
        }
      />
    </div>
  );
}
