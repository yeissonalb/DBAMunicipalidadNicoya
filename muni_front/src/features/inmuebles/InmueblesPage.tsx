import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Building2,
  Calculator,
  Edit3,
  Plus,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import {
  catalogosGeneralesApi,
  catalogosInmuebleApi,
  contribuyenteApi,
  inmuebleApi,
} from '@/services/api';
import type { VwCatastroInmueble } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { formatCurrencyCRC, formatDate, formatNumber } from '@/lib/utils';

const registrarInmuebleSchema = z.object({
  numeroFinca: z.string().trim().min(3, 'Número de finca requerido').max(50),
  planoCatastro: z.string().trim().min(3, 'Plano catastrado requerido').max(50),
  areaMetros: z.coerce.number().positive('Área debe ser mayor a 0'),
  valorFiscal: z.coerce.number().positive('Valor fiscal debe ser mayor a 0'),
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
  idDistrito: z.coerce.number().int().min(1),
  idUsoSuelo: z.coerce.number().int().min(1),
  idZonaHomogenea: z.coerce.number().int().min(1),
  idTopografia: z.coerce.number().int().min(1),
  idFormaPredio: z.coerce.number().int().min(1),
  idUbicacionManzana: z.coerce.number().int().min(1),
});

const actualizarInmuebleSchema = z.object({
  areaMetros: z.coerce.number().positive('Área debe ser mayor a 0'),
  valorFiscal: z.coerce.number().positive('Valor fiscal debe ser mayor a 0'),
  idUsoSuelo: z.coerce.number().int().min(1),
  idZonaHomogenea: z.coerce.number().int().min(1),
  activo: z.boolean(),
});

const asociarPropietarioSchema = z.object({
  idContribuyente: z.coerce.number().int().min(1, 'Seleccione contribuyente'),
  porcentajeParticipacion: z.coerce
    .number()
    .gt(0, 'Debe ser mayor a 0%')
    .lte(100, 'No puede exceder 100%'),
});

const registrarAvaluoSchema = z.object({
  fechaAvaluo: z.string().min(1, 'Fecha requerida'),
  valorTerreno: z.coerce.number().min(0),
  valorConstruccion: z.coerce.number().min(0),
  idPerito: z.coerce.number().int().min(1, 'Seleccione perito valuador'),
  idEstadoAvaluo: z.coerce.number().int().min(1, 'Seleccione estado del avalúo'),
});

type RegistrarInmuebleForm = z.infer<typeof registrarInmuebleSchema>;
type ActualizarInmuebleForm = z.infer<typeof actualizarInmuebleSchema>;
type AsociarPropietarioForm = z.infer<typeof asociarPropietarioSchema>;
type RegistrarAvaluoForm = z.infer<typeof registrarAvaluoSchema>;

export function InmueblesPage() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [selectedContribuyenteId, setSelectedContribuyenteId] = useState<string>('');

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editingInmueble, setEditingInmueble] = useState<VwCatastroInmueble | null>(null);
  const [asociarInmuebleTarget, setAsociarInmuebleTarget] = useState<VwCatastroInmueble | null>(
    null
  );
  const [avaluoInmuebleTarget, setAvaluoInmuebleTarget] = useState<VwCatastroInmueble | null>(null);

  const distritosQuery = useQuery({
    queryKey: ['catalogos', 'distritos'],
    queryFn: () => catalogosGeneralesApi.distritos(),
  });
  const usosSueloQuery = useQuery({
    queryKey: ['catalogos-inm', 'usos-suelo'],
    queryFn: () => catalogosInmuebleApi.usosSuelo(),
  });
  const zonasQuery = useQuery({
    queryKey: ['catalogos-inm', 'zonas-homogeneas'],
    queryFn: () => catalogosInmuebleApi.zonasHomogeneas(),
  });
  const topografiasQuery = useQuery({
    queryKey: ['catalogos-inm', 'topografias'],
    queryFn: () => catalogosInmuebleApi.topografias(),
  });
  const formasQuery = useQuery({
    queryKey: ['catalogos-inm', 'formas-predio'],
    queryFn: () => catalogosInmuebleApi.formasPredio(),
  });
  const ubicacionesQuery = useQuery({
    queryKey: ['catalogos-inm', 'ubicaciones-manzana'],
    queryFn: () => catalogosInmuebleApi.ubicacionesManzana(),
  });
  const peritosQuery = useQuery({
    queryKey: ['catalogos-inm', 'peritos'],
    queryFn: () => catalogosInmuebleApi.peritos(),
  });
  const estadosAvaluoQuery = useQuery({
    queryKey: ['catalogos-inm', 'estados-avaluo'],
    queryFn: () => catalogosInmuebleApi.estadosAvaluo(),
  });

  const catastroQuery = useQuery({
    queryKey: ['inmuebles', 'catastro'],
    queryFn: () => inmuebleApi.catastro(),
  });

  const padronQuery = useQuery({
    queryKey: ['contribuyentes', 'padron-select'],
    queryFn: () => contribuyenteApi.padron(),
  });

  const inmueblesPorContribuyenteQuery = useQuery({
    queryKey: ['inmuebles', 'por-contribuyente', selectedContribuyenteId],
    queryFn: () => inmuebleApi.porContribuyente(Number(selectedContribuyenteId)),
    enabled: Boolean(selectedContribuyenteId),
  });

  const createForm = useForm<RegistrarInmuebleForm>({
    resolver: zodResolver(registrarInmuebleSchema),
    defaultValues: {
      numeroFinca: '',
      planoCatastro: '',
      areaMetros: 250,
      valorFiscal: 25000000,
      latitud: 10.1483,
      longitud: -85.452,
      idDistrito: 1,
      idUsoSuelo: 1,
      idZonaHomogenea: 1,
      idTopografia: 1,
      idFormaPredio: 1,
      idUbicacionManzana: 1,
    },
  });

  const editForm = useForm<ActualizarInmuebleForm>({
    resolver: zodResolver(actualizarInmuebleSchema),
  });

  const asociarForm = useForm<AsociarPropietarioForm>({
    resolver: zodResolver(asociarPropietarioSchema),
    defaultValues: {
      idContribuyente: 0,
      porcentajeParticipacion: undefined,
    },
  });

  const avaluoForm = useForm<RegistrarAvaluoForm>({
    resolver: zodResolver(registrarAvaluoSchema),
    defaultValues: {
      fechaAvaluo: new Date().toISOString().slice(0, 10),
      valorTerreno: 18000000,
      valorConstruccion: 14000000,
      idPerito: 1,
      idEstadoAvaluo: 1,
    },
  });

  const crearMut = useMutation({
    mutationFn: (dto: RegistrarInmuebleForm) => inmuebleApi.registrar(dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Inmueble registrado'} (ID #${res.data})`);
      createForm.reset();
      setOpenCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const editarMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarInmuebleForm }) =>
      inmuebleApi.actualizar(id, dto),
    onSuccess: (res) => {
      toast.success(res.message || 'Inmueble actualizado.');
      setEditingInmueble(null);
      queryClient.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const asociarMut = useMutation({
    mutationFn: ({ idInmueble, dto }: { idInmueble: number; dto: AsociarPropietarioForm }) =>
      inmuebleApi.asociarPropietario(idInmueble, dto),
    onSuccess: (res) => {
      toast.success(res.message || 'Propietario asociado al inmueble.');
      setAsociarInmuebleTarget(null);
      queryClient.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const avaluoMut = useMutation({
    mutationFn: ({ idInmueble, dto }: { idInmueble: number; dto: RegistrarAvaluoForm }) =>
      inmuebleApi.registrarAvaluo(idInmueble, dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Avalúo registrado'} (ID Avalúo #${res.data})`);
      setAvaluoInmuebleTarget(null);
      queryClient.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const catastroFiltrado = (catastroQuery.data ?? []).filter((f) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    return (
      f.numeroFinca.toLowerCase().includes(q) ||
      f.planoCatastro.toLowerCase().includes(q) ||
      f.nombreDistrito.toLowerCase().includes(q) ||
      (f.propietarios || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catastro Municipal y Bienes Inmuebles"
        subtitle="Fincas inscritas, planos catastrados, uso de suelo, copropiedad y avalúos periciales."
        badge={`${catastroQuery.data?.length ?? 0} fincas registradas`}
        icon={<Building2 className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['inmuebles'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button onClick={() => setOpenCreateModal(true)}>
              <Plus className="h-4 w-4" /> Registrar Nuevo Inmueble
            </Button>
          </>
        }
      />

      {/* Barra de Búsqueda y Filtro por Contribuyente */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <label className="mb-1.5 block text-xs font-semibold text-[#171717]">
                Búsqueda Rápida en Catastro
              </label>
              <SearchInput
                value={busqueda}
                onChange={setBusqueda}
                placeholder="Buscar por número de finca, plano catastro, distrito o propietario..."
              />
            </div>
            <div className="lg:col-span-5">
              <label className="mb-1.5 block text-xs font-semibold text-[#171717]">
                Consultar Propiedades por Contribuyente
              </label>
              <Select
                value={selectedContribuyenteId}
                onChange={(e) => setSelectedContribuyenteId(e.target.value)}
              >
                <option value="">— Ver todo el catastro municipal —</option>
                {(padronQuery.data ?? []).map((p) => (
                  <option key={p.idContribuyente} value={p.idContribuyente}>
                    #{p.idContribuyente} · {p.identificacion} — {p.nombreCompletoORazonSocial}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {selectedContribuyenteId && (
            <div className="rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] p-4">
              <p className="mb-2 text-xs font-bold text-[#1E3A8A]">
                Propiedades asociadas al Contribuyente #{selectedContribuyenteId}:
              </p>
              {inmueblesPorContribuyenteQuery.isLoading ? (
                <p className="text-xs text-[#4B5563]">Consultando propiedades...</p>
              ) : (inmueblesPorContribuyenteQuery.data ?? []).length === 0 ? (
                <p className="text-xs text-[#6B7280]">
                  Este contribuyente no tiene inmuebles asociados aún.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(inmueblesPorContribuyenteQuery.data ?? []).map((inm) => (
                    <div
                      key={inm.idInmueble}
                      className="rounded-[10px] border border-[#D1D5DB] bg-white p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#1E3A8A]">
                          Finca {inm.numeroFinca}
                        </span>
                        <Badge variant="success">{inm.porcentajeParticipacion}% derecho</Badge>
                      </div>
                      <p className="mt-1 text-[#4B5563]">
                        Plano: <span className="font-mono">{inm.planoCatastro}</span> ·{' '}
                        {inm.nombreDistrito}
                      </p>
                      <p className="mt-0.5 font-bold text-[#171717]">
                        Valor fiscal: {formatCurrencyCRC(inm.valorFiscal)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Catastro de Inmuebles */}
      {catastroQuery.isLoading ? (
        <LoadingState message="Cargando catastro de bienes inmuebles..." />
      ) : catastroQuery.isError ? (
        <ErrorState error={catastroQuery.error} onRetry={() => catastroQuery.refetch()} />
      ) : catastroFiltrado.length === 0 ? (
        <EmptyState title="No se encontraron fincas con los filtros aplicados" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado Oficial de Fincas y Derechos de Propiedad</CardTitle>
            <CardDescription>
              Gestione copropietarios, avalúos periciales (con actualización automática de valor
              fiscal por trigger) y datos catastrales.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] font-bold uppercase text-[#4B5563]">
                    <th className="px-4 py-3.5">ID</th>
                    <th className="px-4 py-3.5">Finca / Plano Catastro</th>
                    <th className="px-4 py-3.5">Distrito / Uso / Zona</th>
                    <th className="px-4 py-3.5">Área (m²)</th>
                    <th className="px-4 py-3.5">Valor Fiscal</th>
                    <th className="px-4 py-3.5">Último Avalúo</th>
                    <th className="px-4 py-3.5">Copropietarios (% Derecho)</th>
                    <th className="px-4 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {catastroFiltrado.map((inm) => (
                    <tr key={inm.idInmueble} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#171717]">
                        #{inm.idInmueble}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-[#1E3A8A]">{inm.numeroFinca}</p>
                        <p className="font-mono text-[11px] text-[#6B7280]">{inm.planoCatastro}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#171717]">{inm.nombreDistrito}</p>
                        <p className="text-[11px] text-[#6B7280]">
                          {inm.usoSuelo} · {inm.zonaHomogenea}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-medium">
                        {formatNumber(inm.areaMetros, 2)} m²
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#171717]">
                        {formatCurrencyCRC(inm.valorFiscal)}
                      </td>
                      <td className="px-4 py-3.5">
                        {inm.ultimoValorTotalAvaluado ? (
                          <div>
                            <p className="font-semibold text-[#15803D]">
                              {formatCurrencyCRC(inm.ultimoValorTotalAvaluado)}
                            </p>
                            <p className="text-[11px] text-[#6B7280]">
                              {formatDate(inm.fechaUltimoAvaluo)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[#9CA3AF]">Sin avalúo</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="truncate font-medium text-[#171717]">
                          {inm.propietarios || 'Sin propietarios asociados'}
                        </p>
                        <Badge
                          variant={
                            (inm.porcentajeTotalRegistrado ?? 0) === 100 ? 'success' : 'warning'
                          }
                          className="mt-1"
                        >
                          {formatNumber(inm.porcentajeTotalRegistrado ?? 0, 2)}% asignado
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingInmueble(inm);
                              const usoMatch = usosSueloQuery.data?.find(
                                (u) => u.descripcion === inm.usoSuelo
                              );
                              const zonaMatch = zonasQuery.data?.find(
                                (z) => z.nombreZona === inm.zonaHomogenea
                              );
                              editForm.reset({
                                areaMetros: inm.areaMetros,
                                valorFiscal: inm.valorFiscal,
                                idUsoSuelo: usoMatch?.idUsoSuelo ?? 1,
                                idZonaHomogenea: zonaMatch?.idZonaHomogenea ?? 1,
                                activo: inm.inmuebleActivo,
                              });
                            }}
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setAsociarInmuebleTarget(inm)}
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Propietario
                          </Button>
                          <Button onClick={() => setAvaluoInmuebleTarget(inm)}>
                            <Calculator className="h-3.5 w-3.5" /> Avalúo
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: REGISTRAR INMUEBLE */}
      <Modal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Registrar Nuevo Bien Inmueble (dbo.Inmueble)"
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={createForm.handleSubmit((dto) => crearMut.mutate(dto))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField
            label="Número de Finca"
            required
            error={createForm.formState.errors.numeroFinca?.message}
          >
            <Input placeholder="Ej. 5-198234-000" {...createForm.register('numeroFinca')} />
          </FormField>

          <FormField
            label="Plano Catastrado"
            required
            error={createForm.formState.errors.planoCatastro?.message}
          >
            <Input placeholder="Ej. G-2091823-2026" {...createForm.register('planoCatastro')} />
          </FormField>

          <FormField
            label="Área en Metros Cuadrados (m²)"
            required
            error={createForm.formState.errors.areaMetros?.message}
          >
            <Input type="number" step="0.01" {...createForm.register('areaMetros')} />
          </FormField>

          <FormField
            label="Valor Fiscal Inicial (₡ CRC)"
            required
            error={createForm.formState.errors.valorFiscal?.message}
          >
            <Input type="number" step="0.01" {...createForm.register('valorFiscal')} />
          </FormField>

          <FormField label="Latitud" required error={createForm.formState.errors.latitud?.message}>
            <Input type="number" step="0.000001" {...createForm.register('latitud')} />
          </FormField>

          <FormField
            label="Longitud"
            required
            error={createForm.formState.errors.longitud?.message}
          >
            <Input type="number" step="0.000001" {...createForm.register('longitud')} />
          </FormField>

          <FormField label="Distrito" required>
            <Select {...createForm.register('idDistrito')}>
              {(distritosQuery.data ?? []).map((d) => (
                <option key={d.idDistrito} value={d.idDistrito}>
                  {d.codigoDistrito} — {d.nombreDistrito}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Uso de Suelo" required>
            <Select {...createForm.register('idUsoSuelo')}>
              {(usosSueloQuery.data ?? []).map((u) => (
                <option key={u.idUsoSuelo} value={u.idUsoSuelo}>
                  {u.codigoUso} — {u.descripcion}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Zona Homogénea" required>
            <Select {...createForm.register('idZonaHomogenea')}>
              {(zonasQuery.data ?? []).map((z) => (
                <option key={z.idZonaHomogenea} value={z.idZonaHomogenea}>
                  {z.nombreZona} ({formatCurrencyCRC(z.valorBaseMetro)}/m²)
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Topografía" required>
            <Select {...createForm.register('idTopografia')}>
              {(topografiasQuery.data ?? []).map((t) => (
                <option key={t.idTopografia} value={t.idTopografia}>
                  {t.codigoTopografia} (Factor: {t.factorCorreccion})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Forma del Predio" required>
            <Select {...createForm.register('idFormaPredio')}>
              {(formasQuery.data ?? []).map((f) => (
                <option key={f.idFormaPredio} value={f.idFormaPredio}>
                  {f.codigoForma} (Factor: {f.factorCorreccion})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Ubicación en Manzana" required>
            <Select {...createForm.register('idUbicacionManzana')}>
              {(ubicacionesQuery.data ?? []).map((ub) => (
                <option key={ub.idUbicacionManzana} value={ub.idUbicacionManzana}>
                  {ub.codigoUbicacion} (Factor: {ub.factorCorreccion})
                </option>
              ))}
            </Select>
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearMut.isPending}>
              {crearMut.isPending ? 'Registrando...' : 'Registrar Inmueble'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDITAR INMUEBLE */}
      <Modal
        open={Boolean(editingInmueble)}
        onClose={() => setEditingInmueble(null)}
        title={`Actualizar Finca ${editingInmueble?.numeroFinca ?? ''}`}
      >
        {editingInmueble && (
          <form
            onSubmit={editForm.handleSubmit((dto) =>
              editarMut.mutate({ id: editingInmueble.idInmueble, dto })
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Área (m²)"
                required
                error={editForm.formState.errors.areaMetros?.message}
              >
                <Input type="number" step="0.01" {...editForm.register('areaMetros')} />
              </FormField>
              <FormField
                label="Valor Fiscal (₡)"
                required
                error={editForm.formState.errors.valorFiscal?.message}
              >
                <Input type="number" step="0.01" {...editForm.register('valorFiscal')} />
              </FormField>
            </div>

            <FormField label="Uso de Suelo" required>
              <Select {...editForm.register('idUsoSuelo')}>
                {(usosSueloQuery.data ?? []).map((u) => (
                  <option key={u.idUsoSuelo} value={u.idUsoSuelo}>
                    {u.codigoUso} — {u.descripcion}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Zona Homogénea" required>
              <Select {...editForm.register('idZonaHomogenea')}>
                {(zonasQuery.data ?? []).map((z) => (
                  <option key={z.idZonaHomogenea} value={z.idZonaHomogenea}>
                    {z.nombreZona}
                  </option>
                ))}
              </Select>
            </FormField>

            <label className="flex items-center gap-2 text-sm font-medium text-[#171717]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#D1D5DB] accent-[#171717]"
                {...editForm.register('activo')}
              />
              Inmueble Activo
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingInmueble(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editarMut.isPending}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: ASOCIAR COPROPIETARIO */}
      <Modal
        open={Boolean(asociarInmuebleTarget)}
        onClose={() => setAsociarInmuebleTarget(null)}
        title={`Asociar Propietario — Finca ${asociarInmuebleTarget?.numeroFinca ?? ''}`}
      >
        {asociarInmuebleTarget && (
          <form
            onSubmit={asociarForm.handleSubmit((dto) =>
              asociarMut.mutate({ idInmueble: asociarInmuebleTarget.idInmueble, dto })
            )}
            className="space-y-4"
          >
            <FormField
              label="Contribuyente Propietario"
              required
              error={asociarForm.formState.errors.idContribuyente?.message}
            >
              <Select {...asociarForm.register('idContribuyente')}>
                <option value={0}>— Seleccione un contribuyente —</option>
                {(padronQuery.data ?? []).map((p) => (
                  <option key={p.idContribuyente} value={p.idContribuyente}>
                    #{p.idContribuyente} · {p.identificacion} — {p.nombreCompletoORazonSocial}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Porcentaje de Participación (%)"
              required
              error={asociarForm.formState.errors.porcentajeParticipacion?.message}
            >
              <Input
                type="number"
                step="0.01"
                min={0.01}
                max={100}
                {...asociarForm.register('porcentajeParticipacion')}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAsociarInmuebleTarget(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={asociarMut.isPending}>
                Guardar Asociación
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: REGISTRAR AVALÚO PERICIAL */}
      <Modal
        open={Boolean(avaluoInmuebleTarget)}
        onClose={() => setAvaluoInmuebleTarget(null)}
        title={`Registrar Avalúo — Finca ${avaluoInmuebleTarget?.numeroFinca ?? ''}`}
        description="El trigger de base de datos actualizará automáticamente el valor fiscal del inmueble al aprobar el avalúo."
      >
        {avaluoInmuebleTarget && (
          <form
            onSubmit={avaluoForm.handleSubmit((dto) =>
              avaluoMut.mutate({ idInmueble: avaluoInmuebleTarget.idInmueble, dto })
            )}
            className="space-y-4"
          >
            <FormField
              label="Fecha del Avalúo (dd/MM/yyyy)"
              required
              error={avaluoForm.formState.errors.fechaAvaluo?.message}
            >
              <Calendar
                value={avaluoForm.watch('fechaAvaluo')}
                onChange={(iso) =>
                  avaluoForm.setValue('fechaAvaluo', iso, { shouldValidate: true })
                }
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Valor del Terreno (₡)" required>
                <Input type="number" step="0.01" {...avaluoForm.register('valorTerreno')} />
              </FormField>
              <FormField label="Valor de Construcción (₡)" required>
                <Input type="number" step="0.01" {...avaluoForm.register('valorConstruccion')} />
              </FormField>
            </div>

            <FormField label="Perito Valuador" required>
              <Select {...avaluoForm.register('idPerito')}>
                {(peritosQuery.data ?? []).map((p) => (
                  <option key={p.idPerito} value={p.idPerito}>
                    {p.codigoCarné} — {p.nombreCompleto} ({p.especialidad})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Estado del Avalúo" required>
              <Select {...avaluoForm.register('idEstadoAvaluo')}>
                {(estadosAvaluoQuery.data ?? []).map((ea) => (
                  <option key={ea.idEstadoAvaluo} value={ea.idEstadoAvaluo}>
                    {ea.codigoEstado}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAvaluoInmuebleTarget(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={avaluoMut.isPending}>
                Registrar Avalúo
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
