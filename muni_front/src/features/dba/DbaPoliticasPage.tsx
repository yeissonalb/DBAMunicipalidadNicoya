import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Activity,
  CheckCircle2,
  Database,
  Edit3,
  HardDrive,
  Landmark,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { respaldosDbaApi } from '@/services/api';
import type { SpConfiguracionRespaldoResultDto, VwEstadoRespaldo } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { ensureTimeSpanFormat, formatDateTime, formatNumber } from '@/lib/utils';

const crearPoliticaSchema = z.object({
  nombreConfiguracion: z.string().trim().min(3, 'Nombre requerido').max(255),
  horaEjecucion: z.string().min(4, 'Hora requerida (HH:mm:ss)'),
  origen: z.string().trim().min(2, 'Base de datos origen requerida').max(255),
  retencionDias: z.coerce.number().int().min(1, 'Mínimo 1 día').max(3650),
  cifrado: z.string().trim().min(2, 'Especifique el cifrado').max(200),
  rutaDestino: z.string().trim().min(3, 'Ruta en servidor SQL requerida').max(255),
  idFrecuencia: z.coerce.number().int().min(1, 'Seleccione frecuencia'),
  idTipoDeRespaldo: z.coerce.number().int().min(1, 'Seleccione tipo de respaldo'),
});

const actualizarPoliticaSchema = z.object({
  nombreConfiguracion: z.string().trim().min(3, 'Nombre requerido').max(255),
  horaEjecucion: z.string().min(4, 'Hora requerida'),
  retencionDias: z.coerce.number().int().min(1).max(3650),
  rutaDestino: z.string().trim().min(3).max(255),
  activo: z.boolean(),
});

type CrearPoliticaForm = z.infer<typeof crearPoliticaSchema>;
type ActualizarPoliticaForm = z.infer<typeof actualizarPoliticaSchema>;

export function DbaPoliticasPage() {
  const queryClient = useQueryClient();
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SpConfiguracionRespaldoResultDto | null>(null);
  const [openBackupModal, setOpenBackupModal] = useState(false);
  const [backupTipo, setBackupTipo] = useState<'FULL' | 'DIFF'>('FULL');
  const [rutaCarpetaOpcional, setRutaCarpetaOpcional] = useState('');
  const [lastDbccStatus, setLastDbccStatus] = useState<string | null>(null);

  const estadoRespaldosQuery = useQuery({
    queryKey: ['dba', 'estado'],
    queryFn: () => respaldosDbaApi.estado(),
  });

  const configuracionesQuery = useQuery({
    queryKey: ['dba', 'configuraciones'],
    queryFn: () => respaldosDbaApi.configuraciones(),
  });

  const frecuenciasQuery = useQuery({
    queryKey: ['dba', 'frecuencias'],
    queryFn: () => respaldosDbaApi.frecuencias(),
  });

  const tiposRespaldoQuery = useQuery({
    queryKey: ['dba', 'tipos-respaldo'],
    queryFn: () => respaldosDbaApi.tiposRespaldo(),
  });

  const createForm = useForm<CrearPoliticaForm>({
    resolver: zodResolver(crearPoliticaSchema),
    defaultValues: {
      nombreConfiguracion: 'Política Nocturna SQL Nicoya',
      horaEjecucion: '02:00:00',
      origen: 'MunicipalidadNicoya2026',
      retencionDias: 30,
      cifrado: 'AES_256 + SHA-256 Checksum',
      rutaDestino: 'C:\\Backups\\MunicipalidadNicoya\\',
      idFrecuencia: 1,
      idTipoDeRespaldo: 1,
    },
  });

  const editForm = useForm<ActualizarPoliticaForm>({
    resolver: zodResolver(actualizarPoliticaSchema),
  });

  const crearPoliticaMut = useMutation({
    mutationFn: (dto: CrearPoliticaForm) =>
      respaldosDbaApi.registrarConfiguracion({
        ...dto,
        horaEjecucion: ensureTimeSpanFormat(dto.horaEjecucion),
      }),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Política de respaldo registrada'} (ID #${res.data})`);
      setOpenCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['dba'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const actualizarPoliticaMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarPoliticaForm }) =>
      respaldosDbaApi.actualizarConfiguracion(id, {
        ...dto,
        horaEjecucion: ensureTimeSpanFormat(dto.horaEjecucion),
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Política actualizada.');
      setEditingPolicy(null);
      queryClient.invalidateQueries({ queryKey: ['dba'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const ejecutarBackupMut = useMutation({
    mutationFn: () => {
      const payload = rutaCarpetaOpcional.trim()
        ? { rutaCarpeta: rutaCarpetaOpcional.trim() }
        : undefined;
      return backupTipo === 'FULL'
        ? respaldosDbaApi.backupFull(payload)
        : respaldosDbaApi.backupDiferencial(payload);
    },
    onSuccess: (res) => {
      toast.success(res.message || `Respaldo ${backupTipo} ejecutado en SQL Server.`);
      setOpenBackupModal(false);
      queryClient.invalidateQueries({ queryKey: ['dba'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const dbccMut = useMutation({
    mutationFn: () => respaldosDbaApi.verificarIntegridad(),
    onSuccess: (res) => {
      const msg = res.message || 'DBCC CHECKDB finalizado sin errores de consistencia.';
      setLastDbccStatus(`${msg} (${new Date().toLocaleTimeString('es-CR')})`);
      toast.success(msg);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalTamanoMb = (estadoRespaldosQuery.data ?? []).reduce(
    (acc, r) => acc + (r.tamanoMb ?? 0),
    0
  );

  // vw_estado_respaldos lista ejecuciones; se resume por nombre de política
  const resumenPorPolitica = (() => {
    const map = new Map<string, { ultima: VwEstadoRespaldo; total: number }>();
    for (const ej of estadoRespaldosQuery.data ?? []) {
      const k = ej.nombreConfiguracion ?? '';
      const prev = map.get(k);
      if (!prev) map.set(k, { ultima: ej, total: 1 });
      else {
        prev.total += 1;
        if (ej.fechaInicio > prev.ultima.fechaInicio) prev.ultima = ej;
      }
    }
    return map;
  })();

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Políticas de respaldo"
        subtitle="Configure la programación, retención, cifrado y destino de los respaldos institucionales."
        badge={`${configuracionesQuery.data?.filter((c) => c.activo).length ?? 0} políticas activas`}
        icon={<Database className="h-6 w-6" />}
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
              variant="accent"
              size="sm"
              onClick={() => {
                setBackupTipo('FULL');
                setOpenBackupModal(true);
              }}
            >
              <Play className="h-4 w-4" /> Ejecutar respaldo
            </Button>
            <Button size="sm" onClick={() => setOpenCreateModal(true)}>
              <Plus className="h-4 w-4" /> Nueva política
            </Button>
          </>
        }
      />

      {/* Subnavegación Consola DBA (Wireframes 3, 4 y 5) */}
      <nav className="grid gap-3 rounded-2xl border border-sigemun-border bg-white p-3 shadow-card sm:grid-cols-2 xl:grid-cols-4" aria-label="Consola DBA">
        <Button variant="default" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/dba/politicas">
            <Database className="h-4 w-4" /> Políticas de respaldo
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/dba/respaldos">
            <Landmark className="h-4 w-4" /> Respaldos y recuperación
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/dba/monitoreo">
            <Activity className="h-4 w-4" /> Monitoreo y mantenimiento
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/auditoria">
            <ShieldCheck className="h-4 w-4" /> Auditoría técnica
          </Link>
        </Button>
      </nav>

      {/* Tarjetas Superiores del Wireframe 3 (p. 114) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="h-full border-l-4 border-l-sigemun-primary">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-sigemun-primary" /> Volumen del último ciclo
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-sigemun-primary">
              {formatNumber(totalTamanoMb, 2)} MB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-sigemun-muted">
              Políticas configuradas:{' '}
              <strong>{configuracionesQuery.data?.length ?? 0}</strong> (Activas:{' '}
              <strong>
                {configuracionesQuery.data?.filter((c) => c.activo).length ?? 0}
              </strong>
              )
            </p>
          </CardContent>
        </Card>

        <Card className="h-full border-l-4 border-l-sigemun-medium">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-sigemun-primary" /> Integridad de la base de datos
            </CardDescription>
            <CardTitle className="text-base font-bold text-sigemun-text">
              {lastDbccStatus || 'Listo para verificación en demanda'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              size="sm"
              disabled={dbccMut.isPending}
              onClick={() => dbccMut.mutate()}
            >
              {dbccMut.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando integridad...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verificar integridad
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription>Servicio de base de datos</CardDescription>
            <CardTitle className="text-lg font-extrabold text-emerald-900">
              SQL Server conectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-sigemun-muted">
              El historial conserva la verificación de integridad de cada respaldo.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Políticas Respaldos_Config (Wireframe 3) */}
      {configuracionesQuery.isLoading ? (
        <LoadingState message="Consultando políticas de respaldo en SQL Server..." />
      ) : configuracionesQuery.isError ? (
        <ErrorState
          error={configuracionesQuery.error}
          onRetry={() => configuracionesQuery.refetch()}
        />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
            <CardTitle>Políticas configuradas</CardTitle>
            <CardDescription>Programación, retención, destino y estado de las políticas de respaldo.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <div className="overflow-x-auto" role="region" aria-label="Políticas de respaldo" tabIndex={0}>
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead>
                  <tr className="border-b border-sigemun-border bg-sigemun-bg text-[11px] font-bold uppercase tracking-[0.08em] text-sigemun-muted">
                    <th className="px-3.5 py-3">ID</th>
                    <th className="px-3.5 py-3">Nombre de Política</th>
                    <th className="px-3.5 py-3">Tipo / Frecuencia</th>
                    <th className="px-3.5 py-3">Hora Ejecución</th>
                    <th className="px-3.5 py-3">Retención / Cifrado</th>
                    <th className="px-3.5 py-3">Ruta Destino (Servidor SQL)</th>
                    <th className="px-3.5 py-3">Última Ejecución</th>
                    <th className="px-3.5 py-3">Estado</th>
                    <th className="px-3.5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sigemun-border">
                  {(configuracionesQuery.data ?? []).map((cfg) => {
                    const monitor = resumenPorPolitica.get(cfg.nombreConfiguracion ?? '');
                    return (
                      <tr key={cfg.idRespaldosConfig} className="even:bg-sigemun-surface transition-colors hover:bg-sigemun-sky-muted/55">
                        <td className="px-3.5 py-3 font-mono font-bold text-sigemun-primary">
                          #{cfg.idRespaldosConfig}
                        </td>
                        <td className="px-3.5 py-3">
                          <p className="font-bold text-sigemun-text">{cfg.nombreConfiguracion}</p>
                          <p className="font-mono text-[11px] text-sigemun-muted">BD: {cfg.origen}</p>
                        </td>
                        <td className="px-3.5 py-3">
                          <Badge variant="accent">{cfg.nombreTipoRespaldo}</Badge>
                          <p className="mt-0.5 font-semibold text-sigemun-primary">
                            {cfg.nombreFrecuencia}
                          </p>
                        </td>
                        <td className="px-3.5 py-3 font-mono font-semibold">{cfg.horaEjecucion}</td>
                        <td className="px-3.5 py-3">
                          <p className="font-semibold">{cfg.retencionDias} días</p>
                          <p className="text-[11px] text-sigemun-muted">{cfg.cifrado}</p>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[11px] text-sigemun-muted">
                          {cfg.rutaDestino}
                        </td>
                        <td className="px-3.5 py-3">
                          {monitor ? (
                            <div>
                              <p>{formatDateTime(monitor.ultima.fechaInicio)}</p>
                              <p className="text-[11px] text-sigemun-muted">
                                {monitor.ultima.estadoEjecucion} ·{' '}
                                {formatNumber(monitor.ultima.tamanoMb, 2)} MB · {monitor.total} ejec.
                              </p>
                            </div>
                          ) : (
                            <span className="text-sigemun-muted">Sin ejecuciones</span>
                          )}
                        </td>
                        <td className="px-3.5 py-3">
                          <Badge variant={cfg.activo ? 'success' : 'danger'}>
                            {cfg.activo ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPolicy(cfg);
                              editForm.reset({
                                nombreConfiguracion: cfg.nombreConfiguracion ?? '',
                                horaEjecucion: cfg.horaEjecucion,
                                retencionDias: cfg.retencionDias,
                                rutaDestino: cfg.rutaDestino ?? '',
                                activo: cfg.activo,
                              });
                            }}
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Editar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL: NUEVA POLÍTICA DE RESPALDO */}
      <Modal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Registrar nueva política de respaldo"
        description="Defina la frecuencia, retención y ubicación segura de los archivos."
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={createForm.handleSubmit((dto) => crearPoliticaMut.mutate(dto))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField
            label="Nombre de la Política"
            required
            className="sm:col-span-2"
            error={createForm.formState.errors.nombreConfiguracion?.message}
          >
            <Input {...createForm.register('nombreConfiguracion')} />
          </FormField>

          <FormField
            label="Tipo de Respaldo"
            required
            error={createForm.formState.errors.idTipoDeRespaldo?.message}
          >
            <Select {...createForm.register('idTipoDeRespaldo')}>
              {(tiposRespaldoQuery.data ?? []).map((t) => (
                <option key={t.idTipoDeRespaldo} value={t.idTipoDeRespaldo}>
                  {t.nombreTipoRespaldo}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Frecuencia de Ejecución"
            required
            error={createForm.formState.errors.idFrecuencia?.message}
          >
            <Select {...createForm.register('idFrecuencia')}>
              {(frecuenciasQuery.data ?? []).map((f) => (
                <option key={f.idFrecuencia} value={f.idFrecuencia}>
                  {f.nombreFrecuencia}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Hora de Ejecución (HH:mm:ss)"
            required
            error={createForm.formState.errors.horaEjecucion?.message}
          >
            <Input type="time" step="1" {...createForm.register('horaEjecucion')} />
          </FormField>

          <FormField
            label="Retención (Días)"
            required
            error={createForm.formState.errors.retencionDias?.message}
          >
            <Input type="number" min={1} {...createForm.register('retencionDias')} />
          </FormField>

          <FormField
            label="Base de Datos Origen"
            required
            error={createForm.formState.errors.origen?.message}
          >
            <Input {...createForm.register('origen')} />
          </FormField>

          <FormField
            label="Algoritmo de Cifrado / Checksum"
            required
            error={createForm.formState.errors.cifrado?.message}
          >
            <Input {...createForm.register('cifrado')} />
          </FormField>

          <FormField
            label="Ruta de Destino en el Servidor SQL Server"
            required
            className="sm:col-span-2"
            error={createForm.formState.errors.rutaDestino?.message}
          >
            <Input {...createForm.register('rutaDestino')} />
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearPoliticaMut.isPending}>
              {crearPoliticaMut.isPending ? 'Registrando...' : 'Registrar Política'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDITAR POLÍTICA */}
      <Modal
        open={Boolean(editingPolicy)}
        onClose={() => setEditingPolicy(null)}
        title={`Editar política #${editingPolicy?.idRespaldosConfig ?? ''}`}
      >
        {editingPolicy && (
          <form
            onSubmit={editForm.handleSubmit((dto) =>
              actualizarPoliticaMut.mutate({ id: editingPolicy.idRespaldosConfig, dto })
            )}
            className="space-y-4"
          >
            <FormField
              label="Nombre de la Configuración"
              required
              error={editForm.formState.errors.nombreConfiguracion?.message}
            >
              <Input {...editForm.register('nombreConfiguracion')} />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Hora Ejecución"
                required
                error={editForm.formState.errors.horaEjecucion?.message}
              >
                <Input type="time" step="1" {...editForm.register('horaEjecucion')} />
              </FormField>
              <FormField
                label="Retención (Días)"
                required
                error={editForm.formState.errors.retencionDias?.message}
              >
                <Input type="number" min={1} {...editForm.register('retencionDias')} />
              </FormField>
            </div>

            <FormField
              label="Ruta Destino"
              required
              error={editForm.formState.errors.rutaDestino?.message}
            >
              <Input {...editForm.register('rutaDestino')} />
            </FormField>

            <label className="flex items-center gap-2 text-sm font-medium text-sigemun-text">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sigemun-border"
                {...editForm.register('activo')}
              />
              Política Activa
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingPolicy(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizarPoliticaMut.isPending}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: EJECUTAR RESPALDO INMEDIATO CON CONFIRMACIÓN */}
      <Modal
        open={openBackupModal}
        onClose={() => setOpenBackupModal(false)}
        title="Ejecutar respaldo inmediato"
        description="Esta operación generará un respaldo y registrará su resultado en el historial técnico."
      >
        <div className="space-y-4">
          <FormField label="Tipo de Respaldo a Ejecutar" required>
            <Select
              value={backupTipo}
              onChange={(e) => setBackupTipo(e.target.value as 'FULL' | 'DIFF')}
            >
              <option value="FULL">FULL — Respaldo completo</option>
              <option value="DIFF">
                DIFERENCIAL — Respaldo diferencial
              </option>
            </Select>
          </FormField>

          <FormField
            label="Ruta de Carpeta en Servidor SQL (Opcional)"
            hint="Si se deja en blanco, SQL Server utilizará la carpeta por defecto definida en el procedimiento almacenado."
          >
            <Input
              placeholder="Ej. C:\Backups\MunicipalidadNicoya"
              value={rutaCarpetaOpcional}
              onChange={(e) => setRutaCarpetaOpcional(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenBackupModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={ejecutarBackupMut.isPending}
              onClick={() => ejecutarBackupMut.mutate()}
            >
              {ejecutarBackupMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Ejecutando BACKUP...
                </>
              ) : (
                `Confirmar y Ejecutar Backup ${backupTipo}`
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

