import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
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
import { monitoreoDbaApi, respaldosDbaApi } from '@/services/api';
import type { SpConfiguracionRespaldoResultDto } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { ensureTimeSpanFormat } from '@/lib/utils';

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

  const motorQuery = useQuery({
    queryKey: ['monitoreo', 'resumen'],
    queryFn: () => monitoreoDbaApi.resumen(),
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
      nombreConfiguracion: '',
      horaEjecucion: '00:00:00',
      origen: 'MunicipalidadNicoya2026',
      retencionDias: 30,
      cifrado: 'AES-256',
      rutaDestino: '',
      idFrecuencia: 0,
      idTipoDeRespaldo: 0,
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
      const msg = res.message || 'Comprobación DBCC CHECKDB finalizada.';
      setLastDbccStatus(`${msg} (${new Date().toLocaleTimeString('es-CR')})`);
      toast.success(msg);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consola Técnica DBA — Políticas de Respaldo y Motor (SQL Server)"
        subtitle="Configuración de frecuencia, retención y destino de respaldos. La configuración de cifrado no acredita su ejecución."
        badge="Superuser DBA"
        icon={<Database className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['dba'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button variant="secondary" onClick={() => setOpenCreateModal(true)}>
              <Plus className="h-4 w-4" /> Nueva Política
            </Button>
            <Button
              onClick={() => {
                setBackupTipo('FULL');
                setOpenBackupModal(true);
              }}
            >
              <Play className="h-4 w-4" /> Ejecutar Respaldo Inmediato
            </Button>
          </>
        }
      />

      {/* Subnavegación Consola DBA */}
      <nav
        className="grid gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-card sm:grid-cols-3"
        aria-label="Consola DBA"
      >
        <Button variant="default" className="justify-start" asChild>
          <Link to="/dba/politicas">
            <Database className="h-4 w-4" /> Políticas de Respaldo y Motor
          </Link>
        </Button>
        <Button variant="secondary" className="justify-start" asChild>
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

      {/* 3 Tarjetas de Estado del Motor SQL Server (Exactas al Wireframe DBA) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-[#15803D]">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#F0FDF4] text-[#15803D]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Conexión al motor SQL Server</p>
                <p className="text-lg font-extrabold text-[#171717]">{motorQuery.isLoading ? 'Consultando...' : motorQuery.isError || !motorQuery.data ? 'No disponible' : motorQuery.data.servidor}</p>
              </div>
            </div>
            <Badge variant={motorQuery.isSuccess && motorQuery.data ? "success" : "outline"}>{motorQuery.isSuccess && motorQuery.data ? "Consulta respondida" : "Sin confirmar"}</Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#1D4ED8]">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#1D4ED8]">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Almacenamiento del servidor</p>
                <p className="text-lg font-extrabold text-[#171717]">Consultar en monitoreo</p>
              </div>
            </div>
            <Button variant="outline" asChild><Link to="/dba/monitoreo">Ver discos</Link></Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#15803D]">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#F0FDF4] text-[#15803D]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Integridad de la base actual</p>
                <p className="text-lg font-extrabold text-[#171717]">{lastDbccStatus ? 'Comprobación finalizada' : 'Sin comprobar en esta sesión'}</p>
              </div>
            </div>
            <Badge variant="outline">DBCC CHECKDB</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabla: Políticas de respaldo registradas */}
      {configuracionesQuery.isLoading ? (
        <LoadingState message="Consultando políticas de respaldo en SQL Server..." />
      ) : configuracionesQuery.isError ? (
        <ErrorState
          error={configuracionesQuery.error}
          onRetry={() => configuracionesQuery.refetch()}
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Políticas de respaldo registradas</CardTitle>
              <CardDescription>
                Configuración de frecuencia, retención, cifrado declarado y ruta de
                almacenamiento
              </CardDescription>
            </div>
            <Badge variant="blue">
              {configuracionesQuery.data?.length ?? 0} políticas registradas
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                    <th className="px-4 py-3.5">Config ID ↓</th>
                    <th className="px-4 py-3.5">Nombre Política</th>
                    <th className="px-4 py-3.5">Tipo</th>
                    <th className="px-4 py-3.5">Frecuencia</th>
                    <th className="px-4 py-3.5">Retención</th>
                    <th className="px-4 py-3.5">Cifrado</th>
                    <th className="px-4 py-3.5">Ruta Destino</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {(configuracionesQuery.data ?? []).map((cfg) => {
                    return (
                      <tr key={cfg.idRespaldosConfig} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#171717]">
                          {String(cfg.idRespaldosConfig).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[#171717]">{cfg.nombreConfiguracion}</p>
                          <p className="font-mono text-[11px] text-[#6B7280]">
                            BD: {cfg.origen}

                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="blue">{cfg.nombreTipoRespaldo || 'No informado'}</Badge>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[#171717]">
                          {cfg.nombreFrecuencia || 'No informada'} ({cfg.horaEjecucion})
                        </td>
                        <td className="px-4 py-3.5">{cfg.retencionDias} días</td>
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#1E3A8A]">
                          {cfg.cifrado}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-[#4B5563]">
                          {cfg.rutaDestino}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={cfg.activo ? 'success' : 'danger'}>
                            {cfg.activo ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingPolicy(cfg);
                              editForm.reset({
                                nombreConfiguracion: cfg.nombreConfiguracion,
                                horaEjecucion: cfg.horaEjecucion,
                                retencionDias: cfg.retencionDias,
                                rutaDestino: cfg.rutaDestino,
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

      {/* Tarjeta Inferior del Wireframe DBA: Comprobar integridad de la base de datos */}
      <Card>
        <CardHeader>
          <CardTitle>Comprobar integridad de la base de datos</CardTitle>
          <CardDescription>
            DBCC CHECKDB comprueba la base de datos actual. Para verificar un archivo de respaldo, selecciónelo en Respaldos y recuperación.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Resultado de esta sesión</p>
            <p className="break-all font-mono text-sm font-semibold text-[#171717]">
              {lastDbccStatus ?? 'Todavía no se ha ejecutado esta comprobación.'}
            </p>
            {lastDbccStatus && (
              <p className="text-xs font-semibold text-[#15803D]">{lastDbccStatus}</p>
            )}
          </div>
          <Button
            disabled={dbccMut.isPending}
            onClick={() => dbccMut.mutate()}
          >
            {dbccMut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Ejecutando verificación...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Comprobar base (DBCC CHECKDB)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* MODAL: NUEVA POLÍTICA DE RESPALDO */}
      <Modal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Registrar Nueva Política de Respaldo"
        description="Defina la frecuencia, retención, cifrado AES-256 y ubicación segura."
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
            <Select {...createForm.register('idTipoDeRespaldo')}><option value="0">Seleccione un tipo</option>
              {(tiposRespaldoQuery.data ?? []).map((t) => (
                <option key={t.idTipoDeRespaldo} value={t.idTipoDeRespaldo}>
                  {t.nombreTipoRespaldo || 'No informado'}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Frecuencia de Ejecución"
            required
            error={createForm.formState.errors.idFrecuencia?.message}
          >
            <Select {...createForm.register('idFrecuencia')}><option value="0">Seleccione una frecuencia</option>
              {(frecuenciasQuery.data ?? []).map((f) => (
                <option key={f.idFrecuencia} value={f.idFrecuencia}>
                  {f.nombreFrecuencia || 'No informada'}
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
            label="Ruta de Destino en Servidor SQL"
            required
            className="sm:col-span-2"
            error={createForm.formState.errors.rutaDestino?.message}
          >
            <Input {...createForm.register('rutaDestino')} />
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearPoliticaMut.isPending}>
              {crearPoliticaMut.isPending ? 'Registrando...' : 'Guardar Política'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDITAR POLÍTICA */}
      <Modal
        open={Boolean(editingPolicy)}
        onClose={() => setEditingPolicy(null)}
        title={`Editar Política #${editingPolicy?.idRespaldosConfig ?? ''}`}
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

            <label className="flex items-center gap-2 text-sm font-medium text-[#171717]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#D1D5DB] accent-[#171717]"
                {...editForm.register('activo')}
              />
              Política Activa
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingPolicy(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizarPoliticaMut.isPending}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: EJECUTAR RESPALDO INMEDIATO */}
      <Modal
        open={openBackupModal}
        onClose={() => setOpenBackupModal(false)}
        title="Ejecutar Respaldo Inmediato en SQL Server"
        description="Solicita un respaldo físico al servidor SQL. El resultado se mostrará al finalizar."
      >
        <div className="space-y-4">
          <FormField label="Tipo de Respaldo a Ejecutar" required>
            <Select
              value={backupTipo}
              onChange={(e) => setBackupTipo(e.target.value as 'FULL' | 'DIFF')}
            >
              <option value="FULL">FULL — Respaldo Completo</option>
              <option value="DIFF">DIFF — Respaldo Diferencial</option>
            </Select>
          </FormField>

          <FormField
            label="Ruta de Carpeta en Servidor SQL (Opcional)"
            hint="Si se deja en blanco, SQL Server utilizará la carpeta por defecto configurada."
          >
            <Input
              placeholder="Ej. C:\Backups\MunicipalidadNicoya"
              value={rutaCarpetaOpcional}
              onChange={(e) => setRutaCarpetaOpcional(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenBackupModal(false)}>
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
