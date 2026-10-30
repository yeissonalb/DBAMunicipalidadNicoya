import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Building2,
  Download,
  Edit3,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { catalogosInmuebleApi, contribuyenteApi, inmuebleApi } from '@/services/api';
import { useAuth } from '@/app/providers/AuthProvider';
import { MODULE_PERMISSIONS } from '@/features/auth/permissions';
import type { VwInmueblesPropietario } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { exportToCsv, formatCurrencyCRC, formatNumber } from '@/lib/utils';

const registrarInmuebleSchema = z.object({
  numeroFinca: z.string().trim().min(1, 'Número de finca requerido').max(30),
  planoCatastrado: z.string().trim().min(1, 'Plano catastrado requerido').max(30),
  direccionExacta: z.string().trim().min(3, 'Dirección exacta requerida').max(255),
  areaTerrenoM2: z.coerce.number().positive('El área de terreno debe ser mayor a 0'),
  areaConstruccionM2: z.coerce.number().min(0, 'No puede ser negativa'),
  valorFiscal: z.coerce.number().positive('El valor fiscal debe ser mayor a 0'),
  idDistrito: z.coerce.number().int().min(1, 'Seleccione un distrito de Nicoya'),
  idTipoUsoInmueble: z.coerce.number().int().min(1, 'Seleccione el tipo de uso'),
});

const actualizarInmuebleSchema = z.object({
  planoCatastrado: z.string().trim().min(1, 'Plano catastrado requerido').max(30),
  direccionExacta: z.string().trim().min(3, 'Dirección exacta requerida').max(255),
  areaTerrenoM2: z.coerce.number().positive('Mayor a 0'),
  areaConstruccionM2: z.coerce.number().min(0, 'Mayor o igual a 0'),
  valorFiscal: z.coerce.number().positive('Mayor a 0'),
  idTipoUsoInmueble: z.coerce.number().int().min(1, 'Seleccione el tipo de uso'),
});

const asignarDerechoSchema = z.object({
  idInmueble: z.coerce.number().int().min(1, 'Seleccione un inmueble'),
  idContribuyente: z.coerce.number().int().min(1, 'Indique el ID del contribuyente'),
  porcentajeParticipacion: z.coerce
    .number()
    .min(0.01, 'Mínimo 0.01%')
    .max(100, 'No puede superar el 100%'),
});

type RegistrarInmuebleForm = z.infer<typeof registrarInmuebleSchema>;
type ActualizarInmuebleForm = z.infer<typeof actualizarInmuebleSchema>;
type AsignarDerechoForm = z.infer<typeof asignarDerechoSchema>;

export function InmueblesPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canReadPadron = hasRole(MODULE_PERMISSIONS.CONTRIBUYENTES);

  const [fincaFiltro, setFincaFiltro] = useState('');
  const [distritoFiltro, setDistritoFiltro] = useState<string>('');
  const [contribuyenteFiltroId, setContribuyenteFiltroId] = useState<string>('');
  const [openRegistrarModal, setOpenRegistrarModal] = useState(false);
  const [editingInmueble, setEditingInmueble] = useState<VwInmueblesPropietario | null>(null);

  const inmueblesPropietariosQuery = useQuery({
    queryKey: ['inmuebles', 'propietarios'],
    queryFn: () => inmuebleApi.listarConPropietarios(),
  });

  const distritosQuery = useQuery({
    queryKey: ['catalogos', 'distritos'],
    queryFn: () => catalogosInmuebleApi.distritos(),
  });

  const tiposUsoQuery = useQuery({
    queryKey: ['catalogos', 'tipos-uso'],
    queryFn: () => catalogosInmuebleApi.tiposUso(),
  });

  const padronQuery = useQuery({
    queryKey: ['contribuyentes', 'padron-selector'],
    queryFn: () => contribuyenteApi.padron(),
    enabled: canReadPadron,
  });

  const porContribuyenteQuery = useQuery({
    queryKey: ['inmuebles', 'por-contribuyente', contribuyenteFiltroId],
    queryFn: () => inmuebleApi.porContribuyente(Number(contribuyenteFiltroId)),
    enabled: Number(contribuyenteFiltroId) > 0,
  });

  const regForm = useForm<RegistrarInmuebleForm>({
    resolver: zodResolver(registrarInmuebleSchema),
    defaultValues: {
      numeroFinca: '',
      planoCatastrado: '',
      direccionExacta: '',
      areaTerrenoM2: 250,
      areaConstruccionM2: 120,
      valorFiscal: 25000000,
      idDistrito: 1,
      idTipoUsoInmueble: 1,
    },
  });

  const editForm = useForm<ActualizarInmuebleForm>({
    resolver: zodResolver(actualizarInmuebleSchema),
  });

  const derechoForm = useForm<AsignarDerechoForm>({
    resolver: zodResolver(asignarDerechoSchema),
    defaultValues: {
      idInmueble: 0,
      idContribuyente: 0,
      porcentajeParticipacion: 100,
    },
  });

  const registrarMut = useMutation({
    mutationFn: (dto: RegistrarInmuebleForm) => inmuebleApi.registrar(dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Inmueble registrado'} (ID #${res.data})`);
      setOpenRegistrarModal(false);
      regForm.reset();
      queryClient.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const actualizarMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarInmuebleForm }) =>
      inmuebleApi.actualizar(id, dto),
    onSuccess: (res) => {
      toast.success(res.message || 'Inmueble actualizado.');
      setEditingInmueble(null);
      queryClient.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const asignarDerechoMut = useMutation({
    mutationFn: (dto: AsignarDerechoForm) =>
      inmuebleApi.asignarDerecho(dto.idInmueble, {
        idContribuyente: dto.idContribuyente,
        porcentajeParticipacion: dto.porcentajeParticipacion,
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Derecho de propiedad asignado.');
      queryClient.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (row: VwInmueblesPropietario) => {
    setEditingInmueble(row);
    const matchingUso = tiposUsoQuery.data?.find((u) => u.descripcionUso === row.tipoUso);
    editForm.reset({
      planoCatastrado: row.planoCatastrado,
      direccionExacta: row.direccionExacta,
      areaTerrenoM2: row.areaTerrenoM2,
      areaConstruccionM2: row.areaConstruccionM2,
      valorFiscal: row.valorFiscal,
      idTipoUsoInmueble: matchingUso?.idTipoUsoInmueble ?? 1,
    });
  };

  // Lista única de inmuebles para el selector de asignación de derechos
  const inmueblesUnicos = Array.from(
    new Map(
      (inmueblesPropietariosQuery.data ?? []).map((item) => [item.idInmueble, item])
    ).values()
  );

  // Filtrado de tabla
  const rows = (inmueblesPropietariosQuery.data ?? []).filter((r) => {
    const matchFinca =
      !fincaFiltro.trim() ||
      r.numeroFinca.toLowerCase().includes(fincaFiltro.trim().toLowerCase()) ||
      r.planoCatastrado.toLowerCase().includes(fincaFiltro.trim().toLowerCase()) ||
      (r.propietario || '').toLowerCase().includes(fincaFiltro.trim().toLowerCase());

    const selectedDistritoObj = distritosQuery.data?.find(
      (d) => String(d.idDistrito) === distritoFiltro
    );
    const matchDistrito =
      !distritoFiltro ||
      !selectedDistritoObj ||
      r.nombreDistrito.toLowerCase() === selectedDistritoObj.nombreDistrito.toLowerCase();

    const matchContribuyente =
      !contribuyenteFiltroId ||
      String(r.idContribuyente ?? '') === contribuyenteFiltroId.trim();

    return matchFinca && matchDistrito && matchContribuyente;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bienes Inmuebles y Derechos de Propiedad"
        subtitle="Catastro municipal de fincas, distritos de Nicoya y control de copropiedad <= 100% (Wireframe #11, p. 119)"
        badge="CU-06 a CU-08"
        icon={<Building2 className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['inmuebles'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv('inmuebles_propietarios_nicoya.csv', rows as unknown as Record<string, unknown>[])
              }
              disabled={rows.length === 0}
            >
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
            <Button size="sm" onClick={() => setOpenRegistrarModal(true)}>
              <Plus className="h-4 w-4" /> Registrar Nuevo Inmueble
            </Button>
          </>
        }
      />

      {/* Layout de 2 columnas del Wireframe 11: Tabla a la izquierda, Panel "Asociar Inmueble" a la derecha */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Columna Izquierda (8 cols): Filtros + Tabla de Bienes Inmuebles y Derechos */}
        <div className="space-y-4 xl:col-span-8">
          <Card>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#26352D]">
                    Número de Finca / Plano / Propietario
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5A6B61]" />
                    <Input
                      placeholder="Ej. 5-123456-000 o G-..."
                      value={fincaFiltro}
                      onChange={(e) => setFincaFiltro(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#26352D]">
                    Distrito de Nicoya (<code className="font-mono">sp_consultar_distritos</code>)
                  </label>
                  <Select
                    value={distritoFiltro}
                    onChange={(e) => setDistritoFiltro(e.target.value)}
                  >
                    <option value="">Todos los distritos</option>
                    {(distritosQuery.data ?? []).map((d) => (
                      <option key={d.idDistrito} value={d.idDistrito}>
                        {d.codigoDistrito} — {d.nombreDistrito}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#26352D]">
                    Filtrar por ID Contribuyente
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ej. 1"
                    value={contribuyenteFiltroId}
                    onChange={(e) => setContribuyenteFiltroId(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {inmueblesPropietariosQuery.isLoading ? (
            <LoadingState message="Cargando catastro de bienes inmuebles y propietarios..." />
          ) : inmueblesPropietariosQuery.isError ? (
            <ErrorState
              error={inmueblesPropietariosQuery.error}
              onRetry={() => inmueblesPropietariosQuery.refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No se encontraron bienes inmuebles"
              description="Ajuste los filtros o registre un nuevo bien inmueble."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#DCE3DE] bg-white shadow-card">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE3DE] bg-[#F5F7F4] text-[11px] font-bold uppercase tracking-wider text-[#5A6B61]">
                    <th className="px-3.5 py-3">Finca / Plano</th>
                    <th className="px-3.5 py-3">Distrito / Uso</th>
                    <th className="px-3.5 py-3">Áreas (m²)</th>
                    <th className="px-3.5 py-3">Valor Fiscal</th>
                    <th className="px-3.5 py-3">Propietario / Derecho</th>
                    <th className="px-3.5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {rows.map((r, idx) => (
                    <tr
                      key={`${r.idInmueble}-${r.idContribuyente ?? 'none'}-${idx}`}
                      className="hover:bg-[#E8F0EC]/40"
                    >
                      <td className="px-3.5 py-3">
                        <p className="font-mono font-bold text-[#164B35]">{r.numeroFinca}</p>
                        <p className="font-mono text-[11px] text-[#5A6B61]">
                          Plano: {r.planoCatastrado}
                        </p>
                      </td>
                      <td className="px-3.5 py-3">
                        <p className="font-semibold text-[#26352D]">{r.nombreDistrito}</p>
                        <Badge variant="outline" className="mt-0.5 text-[10px]">
                          {r.tipoUso}
                        </Badge>
                      </td>
                      <td className="px-3.5 py-3">
                        <p>Terreno: {formatNumber(r.areaTerrenoM2, 2)} m²</p>
                        <p className="text-[#5A6B61]">
                          Const.: {formatNumber(r.areaConstruccionM2, 2)} m²
                        </p>
                      </td>
                      <td className="px-3.5 py-3 font-semibold text-[#26352D]">
                        {formatCurrencyCRC(r.valorFiscal)}
                      </td>
                      <td className="px-3.5 py-3">
                        {r.propietario ? (
                          <div>
                            <p className="font-semibold text-[#26352D]">
                              {r.propietario}{' '}
                              <span className="font-mono text-[11px] text-[#5A6B61]">
                                (#{r.idContribuyente})
                              </span>
                            </p>
                            <Badge variant="gold" className="mt-0.5">
                              {formatNumber(r.porcentajeParticipacion, 2)}% participación
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="warning">Sin propietario asignado</Badge>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(r)}
                            title="Actualizar datos catastrales"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              derechoForm.setValue('idInmueble', r.idInmueble);
                              if (r.idContribuyente) {
                                derechoForm.setValue('idContribuyente', r.idContribuyente);
                              }
                            }}
                            title="Seleccionar finca para asignar copropiedad"
                          >
                            <Link2 className="h-3.5 w-3.5" /> Derecho
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {Number(contribuyenteFiltroId) > 0 && porContribuyenteQuery.data && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Resultado directo de{' '}
                  <code className="font-mono">
                    GET /api/inmueble/contribuyente/{contribuyenteFiltroId}
                  </code>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#5A6B61]">
                  Inmuebles asociados al contribuyente #{contribuyenteFiltroId}:{' '}
                  <strong>{porContribuyenteQuery.data.length}</strong> registro(s).
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Derecha (4 cols): Panel "Asociar Inmueble / Asignar Derecho" (Wireframe 11) */}
        <div className="space-y-4 xl:col-span-4">
          <Card className="border-t-4 border-t-[#B6944A]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-[#164B35]" /> Asociar Inmueble / Derecho (CU-07)
              </CardTitle>
              <CardDescription>
                Ejecuta <code className="font-mono">POST /api/inmueble/&#123;id&#125;/derechos</code>.
                El trigger SQL <code className="font-mono">trg_validar_porcentaje_copropiedad</code>{' '}
                impide exceder el 100% sobre una misma finca.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={derechoForm.handleSubmit((v) => asignarDerechoMut.mutate(v))}
                className="space-y-4"
              >
                <FormField
                  label="Finca / Bien Inmueble"
                  required
                  error={derechoForm.formState.errors.idInmueble?.message}
                >
                  <Select {...derechoForm.register('idInmueble')}>
                    <option value={0}>Seleccione una finca...</option>
                    {inmueblesUnicos.map((inm) => (
                      <option key={inm.idInmueble} value={inm.idInmueble}>
                        #{inm.idInmueble} · Finca {inm.numeroFinca} ({inm.nombreDistrito})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField
                  label="Contribuyente Propietario"
                  required
                  error={derechoForm.formState.errors.idContribuyente?.message}
                  hint={
                    canReadPadron
                      ? 'Seleccione del padrón o ingrese el ID'
                      : 'Ingrese el ID del contribuyente (su rol Analista consulta propietarios desde la vista de inmuebles)'
                  }
                >
                  {canReadPadron && padronQuery.data ? (
                    <Select {...derechoForm.register('idContribuyente')}>
                      <option value={0}>Seleccione un contribuyente...</option>
                      {padronQuery.data.map((c) => (
                        <option key={c.idContribuyente} value={c.idContribuyente}>
                          #{c.idContribuyente} · {c.identificacion} —{' '}
                          {c.nombreCompletoORazonSocial}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type="number"
                      min={1}
                      placeholder="ID del contribuyente (ej. 1)"
                      {...derechoForm.register('idContribuyente')}
                    />
                  )}
                </FormField>

                <FormField
                  label="Porcentaje de Participación (%)"
                  required
                  error={derechoForm.formState.errors.porcentajeParticipacion?.message}
                  hint="Entre 0.01% y 100%. La suma de copropietarios no puede superar 100%."
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    {...derechoForm.register('porcentajeParticipacion')}
                  />
                </FormField>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={asignarDerechoMut.isPending}
                >
                  {asignarDerechoMut.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Validando en SQL Server...
                    </>
                  ) : (
                    'Asignar Derecho de Propiedad'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Catálogo de Distritos de Nicoya */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distritos Oficiales del Cantón de Nicoya</CardTitle>
              <CardDescription>
                Catálogo cargado desde <code className="font-mono">GET /api/catalogosinmueble/distritos</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-xs">
                {(distritosQuery.data ?? []).map((d) => (
                  <div
                    key={d.idDistrito}
                    className="flex items-center justify-between rounded-lg bg-[#F5F7F4] px-3 py-1.5"
                  >
                    <span className="font-semibold text-[#26352D]">
                      {d.codigoDistrito} · {d.nombreDistrito}
                    </span>
                    <span className="text-[#5A6B61]">{formatNumber(d.areaKm2, 1)} km²</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL: REGISTRAR NUEVO INMUEBLE (CU-06) */}
      <Modal
        open={openRegistrarModal}
        onClose={() => setOpenRegistrarModal(false)}
        title="Registrar Nuevo Bien Inmueble (CU-06)"
        description="Ejecuta POST /api/inmueble (dbo.sp_registrar_inmueble)"
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={regForm.handleSubmit((dto) => registrarMut.mutate(dto))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField
            label="Número de Finca ( Folio Real )"
            required
            error={regForm.formState.errors.numeroFinca?.message}
          >
            <Input placeholder="Ej. 5-198234-000" {...regForm.register('numeroFinca')} />
          </FormField>

          <FormField
            label="Plano Catastrado"
            required
            error={regForm.formState.errors.planoCatastrado?.message}
          >
            <Input placeholder="Ej. G-1029384-2024" {...regForm.register('planoCatastrado')} />
          </FormField>

          <FormField
            label="Distrito de Nicoya"
            required
            error={regForm.formState.errors.idDistrito?.message}
          >
            <Select {...regForm.register('idDistrito')}>
              {(distritosQuery.data ?? []).map((d) => (
                <option key={d.idDistrito} value={d.idDistrito}>
                  {d.nombreDistrito} ({d.codigoDistrito})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Tipo de Uso de Suelo"
            required
            error={regForm.formState.errors.idTipoUsoInmueble?.message}
          >
            <Select {...regForm.register('idTipoUsoInmueble')}>
              {(tiposUsoQuery.data ?? []).map((u) => (
                <option key={u.idTipoUsoInmueble} value={u.idTipoUsoInmueble}>
                  {u.descripcionUso} ({u.codigoTipoUso})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Área de Terreno (m²)"
            required
            error={regForm.formState.errors.areaTerrenoM2?.message}
          >
            <Input type="number" step="0.01" {...regForm.register('areaTerrenoM2')} />
          </FormField>

          <FormField
            label="Área de Construcción (m²)"
            required
            error={regForm.formState.errors.areaConstruccionM2?.message}
          >
            <Input type="number" step="0.01" {...regForm.register('areaConstruccionM2')} />
          </FormField>

          <FormField
            label="Valor Fiscal Imponible (₡ CRC)"
            required
            className="sm:col-span-2"
            error={regForm.formState.errors.valorFiscal?.message}
          >
            <Input type="number" step="0.01" {...regForm.register('valorFiscal')} />
          </FormField>

          <FormField
            label="Dirección Exacta de la Propiedad"
            required
            className="sm:col-span-2"
            error={regForm.formState.errors.direccionExacta?.message}
          >
            <Input
              placeholder="Ubicación exacta, referencias y colindancias..."
              {...regForm.register('direccionExacta')}
            />
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenRegistrarModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrarMut.isPending}>
              {registrarMut.isPending ? 'Registrando...' : 'Registrar Inmueble'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ACTUALIZAR INMUEBLE (CU-08) */}
      <Modal
        open={Boolean(editingInmueble)}
        onClose={() => setEditingInmueble(null)}
        title={`Actualizar Finca ${editingInmueble?.numeroFinca ?? ''}`}
        description={`ID Inmueble #${editingInmueble?.idInmueble ?? ''} · Distrito ${
          editingInmueble?.nombreDistrito ?? ''
        }`}
        maxWidth="max-w-xl"
      >
        {editingInmueble && (
          <form
            onSubmit={editForm.handleSubmit((dto) =>
              actualizarMut.mutate({ id: editingInmueble.idInmueble, dto })
            )}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <FormField
              label="Plano Catastrado"
              required
              error={editForm.formState.errors.planoCatastrado?.message}
            >
              <Input {...editForm.register('planoCatastrado')} />
            </FormField>

            <FormField
              label="Tipo de Uso de Suelo"
              required
              error={editForm.formState.errors.idTipoUsoInmueble?.message}
            >
              <Select {...editForm.register('idTipoUsoInmueble')}>
                {(tiposUsoQuery.data ?? []).map((u) => (
                  <option key={u.idTipoUsoInmueble} value={u.idTipoUsoInmueble}>
                    {u.descripcionUso}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Área de Terreno (m²)"
              required
              error={editForm.formState.errors.areaTerrenoM2?.message}
            >
              <Input type="number" step="0.01" {...editForm.register('areaTerrenoM2')} />
            </FormField>

            <FormField
              label="Área de Construcción (m²)"
              required
              error={editForm.formState.errors.areaConstruccionM2?.message}
            >
              <Input type="number" step="0.01" {...editForm.register('areaConstruccionM2')} />
            </FormField>

            <FormField
              label="Valor Fiscal (₡ CRC)"
              required
              className="sm:col-span-2"
              error={editForm.formState.errors.valorFiscal?.message}
            >
              <Input type="number" step="0.01" {...editForm.register('valorFiscal')} />
            </FormField>

            <FormField
              label="Dirección Exacta"
              required
              className="sm:col-span-2"
              error={editForm.formState.errors.direccionExacta?.message}
            >
              <Input {...editForm.register('direccionExacta')} />
            </FormField>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingInmueble(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizarMut.isPending}>
                {actualizarMut.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

