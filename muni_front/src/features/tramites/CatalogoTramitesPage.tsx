import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Clock, FileCheck2, FileSpreadsheet, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { MODULE_PERMISSIONS, hasAnyRole } from '@/features/auth/permissions';
import { catalogosGeneralesApi, tipoTramiteApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';

const registrarTipoTramiteSchema = z.object({
  nombreTramite: z.string().trim().min(3, 'Nombre requerido').max(150),
  descripcion: z.string().trim().min(5, 'Descripción requerida').max(300),
  diasSlaMaximo: z.coerce.number().int().min(1, 'SLA debe ser al menos 1 día hábil').max(365),
  idDepartamento: z.coerce.number().int().min(1, 'Seleccione departamento responsable'),
});

const registrarRequisitoSchema = z.object({
  nombreRequisito: z.string().trim().min(3, 'Nombre del requisito requerido').max(200),
  esObligatorio: z.boolean(),
});

type RegistrarTipoTramiteForm = z.infer<typeof registrarTipoTramiteSchema>;
type RegistrarRequisitoForm = z.infer<typeof registrarRequisitoSchema>;

export function CatalogoTramitesPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const canWrite = hasAnyRole(
    session?.roles ?? [],
    MODULE_PERMISSIONS.CATALOGO_TRAMITES_WRITE
  );

  const [selectedTipoId, setSelectedTipoId] = useState<number>(1);
  const [openTipoModal, setOpenTipoModal] = useState(false);
  const [openReqModal, setOpenReqModal] = useState(false);

  const tiposQuery = useQuery({
    queryKey: ['tipos-tramite', 'listar'],
    queryFn: () => tipoTramiteApi.listar(),
  });

  const departamentosQuery = useQuery({
    queryKey: ['catalogos', 'departamentos'],
    queryFn: () => catalogosGeneralesApi.departamentos(),
  });

  const requisitosQuery = useQuery({
    queryKey: ['tipos-tramite', 'requisitos', selectedTipoId],
    queryFn: () => tipoTramiteApi.requisitos(selectedTipoId),
    enabled: selectedTipoId > 0,
  });

  const tipoForm = useForm<RegistrarTipoTramiteForm>({
    resolver: zodResolver(registrarTipoTramiteSchema),
    defaultValues: {
      nombreTramite: '',
      descripcion: '',
      diasSlaMaximo: 10,
      idDepartamento: 1,
    },
  });

  const reqForm = useForm<RegistrarRequisitoForm>({
    resolver: zodResolver(registrarRequisitoSchema),
    defaultValues: {
      nombreRequisito: '',
      esObligatorio: true,
    },
  });

  const crearTipoMut = useMutation({
    mutationFn: (dto: RegistrarTipoTramiteForm) => tipoTramiteApi.registrar(dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Tipo de trámite creado'} (ID #${res.data})`);
      tipoForm.reset();
      setOpenTipoModal(false);
      queryClient.invalidateQueries({ queryKey: ['tipos-tramite'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const crearReqMut = useMutation({
    mutationFn: (dto: RegistrarRequisitoForm) =>
      tipoTramiteApi.registrarRequisito(selectedTipoId, dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Requisito registrado'} (ID #${res.data})`);
      reqForm.reset({ nombreRequisito: '', esObligatorio: true });
      setOpenReqModal(false);
      queryClient.invalidateQueries({
        queryKey: ['tipos-tramite', 'requisitos', selectedTipoId],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const selectedTipo = (tiposQuery.data ?? []).find((t) => t.idTipoTramite === selectedTipoId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo Oficial de Trámites y Requisitos (SLA)"
        subtitle="Tipos de trámite municipales, departamentos responsables, plazos máximos SLA y requisitos obligatorios."
        badge={`${tiposQuery.data?.length ?? 0} procedimientos`}
        icon={<FileSpreadsheet className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['tipos-tramite'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            {canWrite && (
              <Button onClick={() => setOpenTipoModal(true)}>
                <Plus className="h-4 w-4" /> Nuevo Tipo de Trámite
              </Button>
            )}
          </>
        }
      />

      {tiposQuery.isLoading ? (
        <LoadingState message="Consultando catálogo de tipos de trámite..." />
      ) : tiposQuery.isError ? (
        <ErrorState error={tiposQuery.error} onRetry={() => tiposQuery.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            {(tiposQuery.data ?? []).map((tt) => {
              const active = tt.idTipoTramite === selectedTipoId;
              return (
                <Card
                  key={tt.idTipoTramite}
                  onClick={() => setSelectedTipoId(tt.idTipoTramite)}
                  className={`cursor-pointer transition-all ${
                    active
                      ? 'border-[#1D4ED8] bg-[#EFF6FF]/40 ring-1 ring-[#1D4ED8]/30'
                      : 'hover:border-[#9CA3AF]'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#1E3A8A]">
                            #{tt.idTipoTramite}
                          </span>
                          <h3 className="text-sm font-bold text-[#171717]">{tt.nombreTramite}</h3>
                        </div>
                        <p className="mt-1 text-xs text-[#4B5563]">{tt.descripcion}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="blue">
                          <Clock className="h-3 w-3" /> SLA: {tt.diasSlaMaximo} días
                        </Badge>
                        <span className="text-[11px] font-medium text-[#6B7280]">
                          {tt.nombreDepartamento} ({tt.codigoDepartamento})
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-5">
            <Card className="sticky top-20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-[#1D4ED8]" />
                    Requisitos del Trámite #{selectedTipoId}
                  </CardTitle>
                  <CardDescription>
                    {selectedTipo?.nombreTramite ?? 'Seleccione un trámite'}
                  </CardDescription>
                </div>
                {canWrite && (
                  <Button onClick={() => setOpenReqModal(true)}>
                    <Plus className="h-3.5 w-3.5" /> Requisito
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {requisitosQuery.isLoading ? (
                  <p className="text-xs text-[#6B7280]">Cargando requisitos...</p>
                ) : !requisitosQuery.data || requisitosQuery.data.length === 0 ? (
                  <EmptyState
                    title="Sin requisitos registrados"
                    description="Agregue requisitos documentales para este procedimiento."
                  />
                ) : (
                  <ul className="space-y-2.5">
                    {requisitosQuery.data.map((r) => (
                      <li
                        key={r.idRequisito}
                        className="flex items-center justify-between gap-2 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] px-3.5 py-2.5 text-xs"
                      >
                        <span className="font-medium text-[#171717]">
                          <strong className="font-mono text-[#1E3A8A]">#{r.idRequisito}</strong> —{' '}
                          {r.nombreRequisito}
                        </span>
                        <Badge variant={r.esObligatorio ? 'success' : 'neutral'}>
                          {r.esObligatorio ? 'REQUERIDO' : 'OPCIONAL'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO TIPO DE TRÁMITE */}
      <Modal
        open={openTipoModal}
        onClose={() => setOpenTipoModal(false)}
        title="Registrar Tipo de Trámite Municipal (dbo.Tipo_Tramite)"
      >
        <form
          onSubmit={tipoForm.handleSubmit((dto) => crearTipoMut.mutate(dto))}
          className="space-y-4"
        >
          <FormField
            label="Nombre del Trámite"
            required
            error={tipoForm.formState.errors.nombreTramite?.message}
          >
            <Input
              placeholder="Ej. Visado Municipal de Plano Catastrado"
              {...tipoForm.register('nombreTramite')}
            />
          </FormField>

          <FormField
            label="Departamento Responsable"
            required
            error={tipoForm.formState.errors.idDepartamento?.message}
          >
            <Select {...tipoForm.register('idDepartamento')}>
              {(departamentosQuery.data ?? []).map((d) => (
                <option key={d.idDepartamento} value={d.idDepartamento}>
                  {d.codigoDepartamento} — {d.nombreDepartamento}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Plazo Máximo de Resolución (SLA en días hábiles)"
            required
            error={tipoForm.formState.errors.diasSlaMaximo?.message}
          >
            <Input type="number" min={1} max={365} {...tipoForm.register('diasSlaMaximo')} />
          </FormField>

          <FormField
            label="Descripción"
            required
            error={tipoForm.formState.errors.descripcion?.message}
          >
            <Textarea
              placeholder="Detalle el alcance y normativa aplicable..."
              {...tipoForm.register('descripcion')}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenTipoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearTipoMut.isPending}>
              {crearTipoMut.isPending ? 'Guardando...' : 'Guardar Tipo de Trámite'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NUEVO REQUISITO */}
      <Modal
        open={openReqModal}
        onClose={() => setOpenReqModal(false)}
        title={`Agregar Requisito — ${selectedTipo?.nombreTramite ?? ''}`}
      >
        <form
          onSubmit={reqForm.handleSubmit((dto) => crearReqMut.mutate(dto))}
          className="space-y-4"
        >
          <FormField
            label="Nombre del Documento / Requisito"
            required
            error={reqForm.formState.errors.nombreRequisito?.message}
          >
            <Input
              placeholder="Ej. Certificación literal de la propiedad"
              {...reqForm.register('nombreRequisito')}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm font-medium text-[#171717]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#D1D5DB] accent-[#171717]"
              {...reqForm.register('esObligatorio')}
            />
            Es un requisito obligatorio para admitir el trámite
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenReqModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearReqMut.isPending}>
              {crearReqMut.isPending ? 'Agregando...' : 'Agregar Requisito'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
