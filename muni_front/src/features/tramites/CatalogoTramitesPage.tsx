import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Edit3, FileCheck2, Link2, Plus, RefreshCw } from 'lucide-react';
import { catalogosGeneralesApi, tipoTramiteApi } from '@/services/api';
import type { SpTiposTramiteResultDto } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';

const tipoTramiteSchema = z.object({
  nombreTramite: z.string().trim().min(2, 'Nombre requerido').max(100),
  descripcionTipo: z.string().trim().min(3, 'Descripción requerida').max(255),
  diasResolucionMax: z.coerce.number().int().min(1, 'Mínimo 1 día').max(365, 'Máximo 365 días'),
  idDepartamento: z.coerce.number().int().min(1, 'Seleccione un departamento'),
});

const requisitoSchema = z.object({
  nombreRequisito: z.string().trim().min(2, 'Nombre requerido').max(255),
  descripcion: z.string().trim().min(3, 'Descripción requerida').max(500),
  esObligatorio: z.boolean(),
});

type TipoTramiteForm = z.infer<typeof tipoTramiteSchema>;
type RequisitoForm = z.infer<typeof requisitoSchema>;

export function CatalogoTramitesPage() {
  const queryClient = useQueryClient();
  const [selectedTipoId, setSelectedTipoId] = useState<number>(1);
  const [selectedRequisitoToLink, setSelectedRequisitoToLink] = useState<number>(0);
  const [openTipoModal, setOpenTipoModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<SpTiposTramiteResultDto | null>(null);
  const [openRequisitoModal, setOpenRequisitoModal] = useState(false);

  const tiposQuery = useQuery({
    queryKey: ['tipotramite', 'lista'],
    queryFn: () => tipoTramiteApi.consultar(),
  });

  const requisitosCatalogoQuery = useQuery({
    queryKey: ['tipotramite', 'requisitos-catalogo'],
    queryFn: () => tipoTramiteApi.catalogoRequisitos(),
  });

  const requisitosPorTipoQuery = useQuery({
    queryKey: ['tipotramite', 'requisitos', selectedTipoId],
    queryFn: () => tipoTramiteApi.requisitosPorTipo(selectedTipoId),
    enabled: selectedTipoId > 0,
  });

  const departamentosQuery = useQuery({
    queryKey: ['catalogos', 'departamentos'],
    queryFn: () => catalogosGeneralesApi.departamentos(),
  });

  const tipoForm = useForm<TipoTramiteForm>({
    resolver: zodResolver(tipoTramiteSchema),
    defaultValues: {
      nombreTramite: '',
      descripcionTipo: '',
      diasResolucionMax: 15,
      idDepartamento: 1,
    },
  });

  const reqForm = useForm<RequisitoForm>({
    resolver: zodResolver(requisitoSchema),
    defaultValues: {
      nombreRequisito: '',
      descripcion: '',
      esObligatorio: true,
    },
  });

  const guardarTipoMut = useMutation({
    mutationFn: (dto: TipoTramiteForm) =>
      editingTipo
        ? tipoTramiteApi.actualizar(editingTipo.idTipoTramite, dto)
        : tipoTramiteApi.registrar(dto),
    onSuccess: (res) => {
      toast.success(res.message || 'Tipo de trámite guardado.');
      setOpenTipoModal(false);
      setEditingTipo(null);
      tipoForm.reset();
      queryClient.invalidateQueries({ queryKey: ['tipotramite'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const crearReqMut = useMutation({
    mutationFn: (dto: RequisitoForm) => tipoTramiteApi.registrarRequisito(dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Requisito registrado'} (ID #${res.data})`);
      setOpenRequisitoModal(false);
      reqForm.reset();
      queryClient.invalidateQueries({ queryKey: ['tipotramite'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const vincularReqMut = useMutation({
    mutationFn: ({ idTipo, idReq }: { idTipo: number; idReq: number }) =>
      tipoTramiteApi.configurarRequisito(idTipo, idReq),
    onSuccess: (res) => {
      toast.success(res.message || 'Requisito vinculado al tipo de trámite.');
      queryClient.invalidateQueries({ queryKey: ['tipotramite', 'requisitos', selectedTipoId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Catálogo de trámites y requisitos"
        subtitle="Configure los servicios municipales, sus plazos de atención y la documentación necesaria."
        badge={`${tiposQuery.data?.length ?? 0} tipos de trámite`}
        icon={<FileCheck2 className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['tipotramite'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                reqForm.reset({ nombreRequisito: '', descripcion: '', esObligatorio: true });
                setOpenRequisitoModal(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nuevo Requisito
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTipo(null);
                tipoForm.reset({
                  nombreTramite: '',
                  descripcionTipo: '',
                  diasResolucionMax: 15,
                  idDepartamento: departamentosQuery.data?.[0]?.idDepartamento ?? 1,
                });
                setOpenTipoModal(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nuevo Tipo de Trámite
            </Button>
          </>
        }
      />

      {tiposQuery.isLoading ? (
        <LoadingState message="Consultando catálogo de tipos de trámite..." />
      ) : tiposQuery.isError ? (
        <ErrorState error={tiposQuery.error} onRetry={() => tiposQuery.refetch()} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '2rem' }}>
          {/* Lista de Tipos de Trámite */}
          <div>
            <Card className="h-full overflow-hidden">
              <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
                <CardTitle>Tipos de trámite</CardTitle>
                <CardDescription>
                  Seleccione un trámite para consultar y configurar sus requisitos.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 sm:pt-6">
                <div className="space-y-3">
                  {(tiposQuery.data ?? []).map((t) => {
                    const isSelected = t.idTipoTramite === selectedTipoId;
                    return (
                      <div
                        key={t.idTipoTramite}
                        onClick={() => setSelectedTipoId(t.idTipoTramite)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          isSelected
                            ? 'border-[#164B35] bg-[#E8F0EC]/60 shadow-sm ring-1 ring-[#164B35]/10'
                            : 'border-[#DCE3DE] bg-white hover:border-[#AFC2B8] hover:bg-[#FAFCFB]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#164B35]">
                                #{t.idTipoTramite}
                              </span>
                              <h4 className="text-sm font-bold text-[#26352D]">
                                {t.nombreTramite}
                              </h4>
                              <Badge variant="gold">SLA: {t.diasResolucionMax} días</Badge>
                            </div>
                            <p className="mt-1 text-xs text-[#5A6B61]">{t.descripcionTipo}</p>
                            <p className="mt-2 text-xs font-medium text-[#164B35]">
                              Departamento responsable: {t.nombreDepartamento}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTipo(t);
                              tipoForm.reset({
                                nombreTramite: t.nombreTramite,
                                descripcionTipo: t.descripcionTipo,
                                diasResolucionMax: t.diasResolucionMax,
                                idDepartamento: t.idDepartamento,
                              });
                              setOpenTipoModal(true);
                            }}
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Editar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuración de Requisitos por Tipo */}
          <div>
            <Card className="h-full overflow-hidden border-[#D7C28E]">
              <CardHeader className="border-b border-[#E9DFC4] bg-[#FBF7EE]">
                <CardTitle>Requisitos del trámite seleccionado</CardTitle>
                <CardDescription>Asocie documentos del catálogo al servicio municipal activo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6 sm:pt-6">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Select
                    value={selectedRequisitoToLink}
                    onChange={(e) => setSelectedRequisitoToLink(Number(e.target.value))}
                  >
                    <option value={0}>Seleccione requisito del catálogo...</option>
                    {(requisitosCatalogoQuery.data ?? []).map((r) => (
                      <option key={r.idRequisito} value={r.idRequisito}>
                        #{r.idRequisito} · {r.nombreRequisito}{' '}
                        {r.esObligatorio ? '(Oblig.)' : '(Opc.)'}
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    disabled={!selectedRequisitoToLink || vincularReqMut.isPending}
                    onClick={() =>
                      vincularReqMut.mutate({
                        idTipo: selectedTipoId,
                        idReq: selectedRequisitoToLink,
                      })
                    }
                  >
                    <Link2 className="h-4 w-4" /> Asociar requisito
                  </Button>
                </div>

                <div className="space-y-2 pt-2">
                  {(requisitosPorTipoQuery.data ?? []).length === 0 ? (
                    <p className="text-xs text-[#5A6B61]">
                      No hay requisitos configurados para este tipo de trámite.
                    </p>
                  ) : (
                    (requisitosPorTipoQuery.data ?? []).map((r) => (
                      <div
                        key={r.idRequisito}
                        className="rounded-xl border border-[#DCE3DE] bg-[#FAFCFB] p-4 text-sm transition-colors hover:border-[#C6D4CC]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#26352D]">
                            #{r.idRequisito} · {r.nombreRequisito}
                          </span>
                          <Badge variant={r.esObligatorio ? 'gold' : 'outline'}>
                            {r.esObligatorio ? 'Obligatorio' : 'Opcional'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-[#5A6B61]">{r.descripcion}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR TIPO DE TRÁMITE */}
      <Modal
        open={openTipoModal}
        onClose={() => setOpenTipoModal(false)}
        title={editingTipo ? `Editar tipo de trámite #${editingTipo.idTipoTramite}` : 'Nuevo tipo de trámite'}
      >
        <form
          onSubmit={tipoForm.handleSubmit((dto) => guardarTipoMut.mutate(dto))}
          className="space-y-4"
        >
          <FormField
            label="Nombre del Trámite"
            required
            error={tipoForm.formState.errors.nombreTramite?.message}
          >
            <Input {...tipoForm.register('nombreTramite')} />
          </FormField>

          <FormField
            label="Descripción"
            required
            error={tipoForm.formState.errors.descripcionTipo?.message}
          >
            <Input {...tipoForm.register('descripcionTipo')} />
          </FormField>

          <FormField
            label="Días Máximos de Resolución (SLA)"
            required
            error={tipoForm.formState.errors.diasResolucionMax?.message}
          >
            <Input type="number" min={1} max={365} {...tipoForm.register('diasResolucionMax')} />
          </FormField>

          <FormField
            label="Departamento Responsable"
            required
            error={tipoForm.formState.errors.idDepartamento?.message}
          >
            <Select {...tipoForm.register('idDepartamento')}>
              {(departamentosQuery.data ?? []).map((d) => (
                <option key={d.idDepartamento} value={d.idDepartamento}>
                  {d.nombreDepartamento} ({d.codigoDepartamento})
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenTipoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardarTipoMut.isPending}>
              {guardarTipoMut.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NUEVO REQUISITO EN CATÁLOGO */}
      <Modal
        open={openRequisitoModal}
        onClose={() => setOpenRequisitoModal(false)}
        title="Registrar nuevo requisito documental"
      >
        <form
          onSubmit={reqForm.handleSubmit((dto) => crearReqMut.mutate(dto))}
          className="space-y-4"
        >
          <FormField
            label="Nombre del Requisito"
            required
            error={reqForm.formState.errors.nombreRequisito?.message}
          >
            <Input {...reqForm.register('nombreRequisito')} />
          </FormField>

          <FormField
            label="Descripción / Especificación"
            required
            error={reqForm.formState.errors.descripcion?.message}
          >
            <Input {...reqForm.register('descripcion')} />
          </FormField>

          <label className="flex items-center gap-2 text-sm font-medium text-[#26352D]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#DCE3DE]"
              {...reqForm.register('esObligatorio')}
            />
            Es un requisito obligatorio para la admisibilidad
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenRequisitoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearReqMut.isPending}>
              {crearReqMut.isPending ? 'Registrando...' : 'Registrar Requisito'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

