import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Building2,
  Edit3,
  Eye,
  Link2,
  Plus,
  RefreshCw,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  catalogosGeneralesApi,
  contribuyenteApi,
  inmuebleApi,
} from '@/services/api';
import type { VwPadronContribuyente } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/forms/FormField';
import { formatCurrencyCRC, formatDate } from '@/lib/utils';

const personaFisicaSchema = z.object({
  identificacion: z.string().trim().min(5, 'Identificación requerida (mín. 5 dígitos)').max(50),
  correoElectronico: z.string().trim().email('Correo electrónico inválido').max(150),
  telefono: z.string().trim().min(4, 'Teléfono requerido').max(50),
  direccionExacta: z.string().trim().min(5, 'Dirección exacta requerida').max(300),
  idDistrito: z.coerce.number().int().min(1, 'Seleccione un distrito'),
  idTipoIdentificacion: z.coerce.number().int().min(1, 'Seleccione tipo de identificación'),
  nombre: z.string().trim().min(2, 'Nombre requerido').max(100),
  primerApellido: z.string().trim().min(2, 'Primer apellido requerido').max(100),
  segundoApellido: z.string().trim().max(100),
  fechaDeNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  idGenero: z.coerce.number().int().min(1, 'Seleccione género'),
  idEstadoCivil: z.coerce.number().int().min(1, 'Seleccione estado civil'),
});

const personaJuridicaSchema = z.object({
  identificacion: z.string().trim().min(5, 'Cédula jurídica requerida').max(50),
  correoElectronico: z.string().trim().email('Correo electrónico inválido').max(150),
  telefono: z.string().trim().min(4, 'Teléfono requerido').max(50),
  direccionExacta: z.string().trim().min(5, 'Dirección requerida').max(300),
  idDistrito: z.coerce.number().int().min(1, 'Seleccione un distrito'),
  idTipoIdentificacion: z.coerce.number().int().min(1, 'Seleccione tipo de identificación'),
  razonSocial: z.string().trim().min(3, 'Razón social requerida').max(200),
  nombreComercial: z.string().trim().min(2, 'Nombre comercial requerido').max(200),
  fechaDeConstitucion: z.string().min(1, 'Fecha de constitución requerida'),
  idActividadEconomica: z.coerce.number().int().min(1, 'Seleccione actividad económica'),
});

const representanteSchema = z.object({
  idPersonaJuridica: z.coerce.number().int().min(1, 'ID de Persona Jurídica requerido'),
  idPersonaFisica: z.coerce.number().int().min(1, 'ID de Persona Física requerido'),
  idCargoRepresentacion: z.coerce.number().int().min(1, 'Seleccione cargo'),
  fechaDeInicio: z.string().min(1, 'Fecha de inicio requerida'),
  fechaFin: z.string().optional(),
});

const actualizarContribuyenteSchema = z.object({
  correoElectronico: z.string().trim().email('Correo inválido').max(150),
  telefono: z.string().trim().min(4, 'Teléfono requerido').max(50),
  direccionExacta: z.string().trim().min(5, 'Dirección requerida').max(300),
  idDistrito: z.coerce.number().int().min(1),
  activo: z.boolean(),
});

type PersonaFisicaForm = z.infer<typeof personaFisicaSchema>;
type PersonaJuridicaForm = z.infer<typeof personaJuridicaSchema>;
type RepresentanteForm = z.infer<typeof representanteSchema>;
type ActualizarContribuyenteForm = z.infer<typeof actualizarContribuyenteSchema>;

export function ContribuyentesPage() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [filtroDistrito, setFiltroDistrito] = useState<string>('TODOS');
  const [tipoPersonaTab, setTipoPersonaTab] = useState<'TODAS' | 'FISICA' | 'JURIDICA'>('TODAS');
  const [selectedContribuyenteId, setSelectedContribuyenteId] = useState<number>(1);

  // Panel Derecho del Wireframe: Asociar Inmueble (dbo.Contribuyente_Inmueble)
  const [asociarIdInmueble, setAsociarIdInmueble] = useState<number>(1);
  const [asociarPlanoOpcional, setAsociarPlanoOpcional] = useState<string>('');
  const [asociarPorcentaje, setAsociarPorcentaje] = useState<string>('100');

  // Modales
  const [openFisicaModal, setOpenFisicaModal] = useState(false);
  const [openJuridicaModal, setOpenJuridicaModal] = useState(false);
  const [openRepModal, setOpenRepModal] = useState(false);
  const [editingContribuyente, setEditingContribuyente] = useState<VwPadronContribuyente | null>(
    null
  );

  // Catálogos
  const distritosQuery = useQuery({
    queryKey: ['catalogos', 'distritos'],
    queryFn: () => catalogosGeneralesApi.distritos(),
  });
  const tiposIdQuery = useQuery({
    queryKey: ['catalogos', 'tipos-identificacion'],
    queryFn: () => catalogosGeneralesApi.tiposIdentificacion(),
  });
  const generosQuery = useQuery({
    queryKey: ['catalogos', 'generos'],
    queryFn: () => catalogosGeneralesApi.generos(),
  });
  const estadosCivilesQuery = useQuery({
    queryKey: ['catalogos', 'estados-civiles'],
    queryFn: () => catalogosGeneralesApi.estadosCiviles(),
  });
  const actividadesQuery = useQuery({
    queryKey: ['catalogos', 'actividades-economicas'],
    queryFn: () => catalogosGeneralesApi.actividadesEconomicas(),
  });
  const cargosQuery = useQuery({
    queryKey: ['catalogos', 'cargos-representacion'],
    queryFn: () => catalogosGeneralesApi.cargosRepresentacion(),
  });

  const padronQuery = useQuery({
    queryKey: ['contribuyentes', 'padron'],
    queryFn: () => contribuyenteApi.padron(),
  });

  const catastroGeneralQuery = useQuery({
    queryKey: ['inmuebles', 'catastro-asociar'],
    queryFn: () => inmuebleApi.catastro(),
  });

  const detalleContribuyenteQuery = useQuery({
    queryKey: ['contribuyentes', 'detalle', selectedContribuyenteId],
    queryFn: () => contribuyenteApi.consultar(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  const inmueblesContribuyenteQuery = useQuery({
    queryKey: ['contribuyentes', 'inmuebles-propios', selectedContribuyenteId],
    queryFn: () => inmuebleApi.porContribuyente(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  const padronFiltrado = useMemo(() => {
    const rows = padronQuery.data ?? [];
    return rows.filter((r) => {
      const matchDistrito = filtroDistrito === 'TODOS' || r.nombreDistrito === filtroDistrito;
      const matchTipo =
        tipoPersonaTab === 'TODAS' ||
        (tipoPersonaTab === 'FISICA' && r.tipoPersona.toLowerCase().includes('fís')) ||
        (tipoPersonaTab === 'JURIDICA' && r.tipoPersona.toLowerCase().includes('jur'));
      const q = busqueda.trim().toLowerCase();
      const matchTexto =
        !q ||
        r.identificacion.toLowerCase().includes(q) ||
        r.nombreCompletoORazonSocial.toLowerCase().includes(q) ||
        r.correoElectronico.toLowerCase().includes(q) ||
        String(r.idContribuyente) === q;
      return matchDistrito && matchTipo && matchTexto;
    });
  }, [padronQuery.data, filtroDistrito, tipoPersonaTab, busqueda]);

  const activeContribuyente = useMemo(() => {
    const found = (padronQuery.data ?? []).find(
      (c) => c.idContribuyente === selectedContribuyenteId
    );
    return found ?? padronFiltrado[0] ?? null;
  }, [padronQuery.data, padronFiltrado, selectedContribuyenteId]);

  const fisicaForm = useForm<PersonaFisicaForm>({
    resolver: zodResolver(personaFisicaSchema),
    defaultValues: {
      identificacion: '',
      correoElectronico: '',
      telefono: '',
      direccionExacta: '',
      idDistrito: 1,
      idTipoIdentificacion: 1,
      nombre: '',
      primerApellido: '',
      segundoApellido: '',
      fechaDeNacimiento: '1990-01-15',
      idGenero: 1,
      idEstadoCivil: 1,
    },
  });

  const juridicaForm = useForm<PersonaJuridicaForm>({
    resolver: zodResolver(personaJuridicaSchema),
    defaultValues: {
      identificacion: '',
      correoElectronico: '',
      telefono: '',
      direccionExacta: '',
      idDistrito: 1,
      idTipoIdentificacion: 2,
      razonSocial: '',
      nombreComercial: '',
      fechaDeConstitucion: '2020-05-10',
      idActividadEconomica: 1,
    },
  });

  const repForm = useForm<RepresentanteForm>({
    resolver: zodResolver(representanteSchema),
    defaultValues: {
      idPersonaJuridica: 1,
      idPersonaFisica: 1,
      idCargoRepresentacion: 1,
      fechaDeInicio: new Date().toISOString().slice(0, 10),
      fechaFin: '',
    },
  });

  const editForm = useForm<ActualizarContribuyenteForm>({
    resolver: zodResolver(actualizarContribuyenteSchema),
  });

  const registrarFisicaMut = useMutation({
    mutationFn: (dto: PersonaFisicaForm) => contribuyenteApi.registrarPersonaFisica(dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Persona física registrada'} (ID #${res.data})`);
      fisicaForm.reset();
      setOpenFisicaModal(false);
      queryClient.invalidateQueries({ queryKey: ['contribuyentes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const registrarJuridicaMut = useMutation({
    mutationFn: (dto: PersonaJuridicaForm) => contribuyenteApi.registrarPersonaJuridica(dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Persona jurídica registrada'} (ID #${res.data})`);
      juridicaForm.reset();
      setOpenJuridicaModal(false);
      queryClient.invalidateQueries({ queryKey: ['contribuyentes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const registrarRepMut = useMutation({
    mutationFn: (dto: RepresentanteForm) =>
      contribuyenteApi.registrarRepresentanteLegal({
        ...dto,
        fechaFin: dto.fechaFin ? dto.fechaFin : null,
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Representante legal vinculado exitosamente.');
      setOpenRepModal(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const actualizarMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarContribuyenteForm }) =>
      contribuyenteApi.actualizar(id, dto),
    onSuccess: (res) => {
      toast.success(res.message || 'Contribuyente actualizado.');
      setEditingContribuyente(null);
      queryClient.invalidateQueries({ queryKey: ['contribuyentes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const asociarInmuebleMut = useMutation({
    mutationFn: () => {
      if (!activeContribuyente) throw new Error('Seleccione un contribuyente.');
      const pct = Number(asociarPorcentaje);
      if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
        throw new Error('El porcentaje de participación debe estar entre 0.01% y 100%.');
      }
      return inmuebleApi.asociarPropietario(asociarIdInmueble, {
        idContribuyente: activeContribuyente.idContribuyente,
        porcentajeParticipacion: pct,
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.message || 'Inmueble asociado exitosamente con su porcentaje de participación.'
      );
      queryClient.invalidateQueries({ queryKey: ['contribuyentes'] });
      queryClient.invalidateQueries({ queryKey: ['inmuebles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Padrón de Contribuyentes y Bienes Inmuebles"
        subtitle="Gestión de Personas Físicas, Personas Jurídicas, Representantes Legales y Derechos de Copropiedad."
        badge={`${padronQuery.data?.length ?? 0} contribuyentes`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['contribuyentes'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button variant="secondary" onClick={() => setOpenRepModal(true)}>
              <UserCheck className="h-4 w-4" /> Representante Legal
            </Button>
            <Button variant="secondary" onClick={() => setOpenJuridicaModal(true)}>
              <Building2 className="h-4 w-4" /> + Persona Jurídica
            </Button>
            <Button onClick={() => setOpenFisicaModal(true)}>
              <UserPlus className="h-4 w-4" /> + Persona Física
            </Button>
          </>
        }
      />

      {/* SECCIÓN SUPERIOR DEL WIREFRAME: TARJETA DEL CONTRIBUYENTE SELECCIONADO + BIENES INMUEBLES Y PANEL DERECHO ASOCIAR INMUEBLE */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Columna Izquierda / Central (8 cols) */}
        <div className="space-y-6 xl:col-span-8">
          {/* Tarjeta Superior: Persona Física | Persona Jurídica y Datos del Contribuyente */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'TODAS', label: 'Todos' },
                    { id: 'FISICA', label: 'Persona Física' },
                    { id: 'JURIDICA', label: 'Persona Jurídica' },
                  ].map((tab) => {
                    const active = tipoPersonaTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTipoPersonaTab(tab.id as typeof tipoPersonaTab)}
                        className={`rounded-[10px] px-3.5 py-2 text-xs font-bold transition-colors ${
                          active
                            ? 'bg-[#171717] text-white'
                            : 'border border-[#D1D5DB] bg-white text-[#171717] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <Badge variant={activeContribuyente?.activo !== false ? 'success' : 'danger'}>
                  {activeContribuyente?.activo !== false ? 'Al Día · Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {activeContribuyente ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-[#6B7280]">Cédula / Identificación</p>
                    <p className="mt-0.5 font-mono text-base font-bold text-[#171717]">
                      {activeContribuyente.identificacion}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-[#6B7280]">
                      Nombre Completo / Razón Social
                    </p>
                    <p className="mt-0.5 text-base font-bold text-[#171717]">
                      {activeContribuyente.nombreCompletoORazonSocial}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#6B7280]">Tipo de Contribuyente</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#1E3A8A]">
                      {activeContribuyente.tipoPersona}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-[#6B7280]">Correo Electrónico</p>
                    <p className="mt-0.5 text-sm font-medium text-[#171717]">
                      {activeContribuyente.correoElectronico}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#6B7280]">Teléfono</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-[#171717]">
                      {activeContribuyente.telefono}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#6B7280]">Distrito</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#171717]">
                      {activeContribuyente.nombreDistrito}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#6B7280]">
                  Seleccione un contribuyente del padrón inferior.
                </p>
              )}

              {detalleContribuyenteQuery.data?.[0]?.actividadEconomica && (
                <div className="mt-4 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-xs text-[#1E3A8A]">
                  <strong>Actividad Económica:</strong>{' '}
                  {detalleContribuyenteQuery.data[0].actividadEconomica} ·{' '}
                  <strong>Constitución:</strong>{' '}
                  {formatDate(detalleContribuyenteQuery.data[0].fechaNacimientoOConstitucion)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarjeta Media del Wireframe: Bienes Inmuebles y Derechos de Propiedad */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bienes Inmuebles y Derechos de Propiedad</CardTitle>
                <CardDescription>
                  Propiedades registradas a nombre de{' '}
                  <strong>
                    {activeContribuyente?.nombreCompletoORazonSocial ?? 'este contribuyente'}
                  </strong>
                </CardDescription>
              </div>
              <Badge variant="blue">
                {inmueblesContribuyenteQuery.data?.length ?? 0} finca(s)
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {inmueblesContribuyenteQuery.isLoading ? (
                <div className="p-6">
                  <LoadingState message="Consultando propiedades del contribuyente..." />
                </div>
              ) : (inmueblesContribuyenteQuery.data ?? []).length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="Sin propiedades asociadas"
                    description="Utilice el panel derecho 'Asociar Inmueble' para registrar derechos de propiedad."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] font-bold uppercase text-[#4B5563]">
                        <th className="px-4 py-3.5">#</th>
                        <th className="px-4 py-3.5">Número de Finca</th>
                        <th className="px-4 py-3.5">Plano Catastro</th>
                        <th className="px-4 py-3.5">Distrito</th>
                        <th className="px-4 py-3.5">Valor Fiscal (₡)</th>
                        <th className="px-4 py-3.5">Tipo de Uso</th>
                        <th className="px-4 py-3.5">Porcentaje de Participación (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {(inmueblesContribuyenteQuery.data ?? []).map((inm, idx) => (
                        <tr key={inm.idInmueble} className="hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3 font-mono font-bold text-[#6B7280]">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#1E3A8A]">
                            Finca {inm.numeroFinca}
                          </td>
                          <td className="px-4 py-3 font-mono text-[#4B5563]">
                            Plano {inm.planoCatastro}
                          </td>
                          <td className="px-4 py-3 font-medium text-[#171717]">
                            {inm.nombreDistrito}
                          </td>
                          <td className="px-4 py-3 font-bold text-[#171717]">
                            {formatCurrencyCRC(inm.valorFiscal)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="neutral">{inm.descripcionUso}</Badge>
                          </td>
                          <td className="px-4 py-3 font-bold text-[#15803D]">
                            {inm.porcentajeParticipacion}%
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

        {/* Columna Derecha (4 cols): Asociar Inmueble (Exacta al Wireframe) */}
        <div className="xl:col-span-4">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-[#1D4ED8]" /> Asociar Inmueble
              </CardTitle>
              <CardDescription>
                Vincular finca en copropiedad a{' '}
                <strong>{activeContribuyente?.nombreCompletoORazonSocial ?? '—'}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <FormField label="Número de Finca (Catastro Municipal)" required>
                <Select
                  value={asociarIdInmueble}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setAsociarIdInmueble(id);
                    const found = (catastroGeneralQuery.data ?? []).find(
                      (f) => f.idInmueble === id
                    );
                    if (found) {
                      setAsociarPlanoOpcional(found.planoCatastro);
                    }
                  }}
                >
                  {(catastroGeneralQuery.data ?? []).map((f) => (
                    <option key={f.idInmueble} value={f.idInmueble}>
                      Finca {f.numeroFinca} — {f.nombreDistrito}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Plano Catastro (opcional)">
                <Input
                  placeholder="Ej. G-1234567-2026"
                  value={asociarPlanoOpcional}
                  onChange={(e) => setAsociarPlanoOpcional(e.target.value)}
                />
              </FormField>

              <FormField
                label="Porcentaje de Participación (%)"
                required
                hint="La suma de derechos sobre una misma finca no puede superar el 100%."
              >
                <Input
                  type="number"
                  min={0.01}
                  max={100}
                  step="0.01"
                  value={asociarPorcentaje}
                  onChange={(e) => setAsociarPorcentaje(e.target.value)}
                />
              </FormField>

              <Button
                type="button"
                className="w-full"
                disabled={!activeContribuyente || asociarInmuebleMut.isPending}
                onClick={() => asociarInmuebleMut.mutate()}
              >
                <Plus className="h-4 w-4" />
                {asociarInmuebleMut.isPending ? 'Guardando...' : 'Guardar Asociación'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TABLA GENERAL DEL PADRÓN DE CONTRIBUYENTES */}
      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Listado General del Padrón Municipal</CardTitle>
            <CardDescription>
              Haga clic en cualquier fila para inspeccionar sus bienes inmuebles y datos arriba.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <SearchInput
                value={busqueda}
                onChange={setBusqueda}
                placeholder="Buscar por cédula o nombre..."
              />
            </div>
            <div className="w-48">
              <Select
                value={filtroDistrito}
                onChange={(e) => setFiltroDistrito(e.target.value)}
              >
                <option value="TODOS">Todos los distritos</option>
                {(distritosQuery.data ?? []).map((d) => (
                  <option key={d.idDistrito} value={d.nombreDistrito}>
                    {d.nombreDistrito}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {padronQuery.isLoading ? (
            <div className="p-6">
              <LoadingState message="Cargando padrón de contribuyentes..." />
            </div>
          ) : padronQuery.isError ? (
            <div className="p-6">
              <ErrorState error={padronQuery.error} onRetry={() => padronQuery.refetch()} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] font-bold uppercase text-[#4B5563]">
                    <th className="px-4 py-3.5">ID</th>
                    <th className="px-4 py-3.5">Cédula / ID</th>
                    <th className="px-4 py-3.5">Nombre Completo / Razón Social</th>
                    <th className="px-4 py-3.5">Tipo Persona</th>
                    <th className="px-4 py-3.5">Distrito</th>
                    <th className="px-4 py-3.5">Contacto</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {padronFiltrado.map((row) => {
                    const isSelected = activeContribuyente?.idContribuyente === row.idContribuyente;
                    return (
                      <tr
                        key={row.idContribuyente}
                        onClick={() => setSelectedContribuyenteId(row.idContribuyente)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#EFF6FF] shadow-[inset_3px_0_0_#1D4ED8]'
                            : 'hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-[#171717]">
                          #{row.idContribuyente}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-[#1E3A8A]">
                          {row.identificacion}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#171717]">
                          {row.nombreCompletoORazonSocial}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              row.tipoPersona.toLowerCase().includes('jur') ? 'blue' : 'neutral'
                            }
                          >
                            {row.tipoPersona}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{row.nombreDistrito}</td>
                        <td className="px-4 py-3">
                          <p>{row.correoElectronico}</p>
                          <p className="font-mono text-[#6B7280]">{row.telefono}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={row.activo ? 'success' : 'danger'}>
                            {row.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td
                          className="px-4 py-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="secondary"
                              onClick={() => setSelectedContribuyenteId(row.idContribuyente)}
                            >
                              <Eye className="h-3.5 w-3.5" /> Ver
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingContribuyente(row);
                                const dMatch = distritosQuery.data?.find(
                                  (d) => d.nombreDistrito === row.nombreDistrito
                                );
                                editForm.reset({
                                  correoElectronico: row.correoElectronico,
                                  telefono: row.telefono,
                                  direccionExacta: row.direccionExacta,
                                  idDistrito: dMatch?.idDistrito ?? 1,
                                  activo: row.activo,
                                });
                              }}
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Editar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: REGISTRAR PERSONA FÍSICA */}
      <Modal
        open={openFisicaModal}
        onClose={() => setOpenFisicaModal(false)}
        title="Registrar Contribuyente — Persona Física"
        description="Complete los campos de las tablas dbo.Contribuyente y dbo.Persona_Fisica."
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={fisicaForm.handleSubmit((dto) => registrarFisicaMut.mutate(dto))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField
            label="Tipo de Identificación"
            required
            error={fisicaForm.formState.errors.idTipoIdentificacion?.message}
          >
            <Select {...fisicaForm.register('idTipoIdentificacion')}>
              {(tiposIdQuery.data ?? []).map((t) => (
                <option key={t.idTipoIdentificacion} value={t.idTipoIdentificacion}>
                  {t.codigoTipoIdentificacion} — {t.descripcion}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Número de Identificación"
            required
            error={fisicaForm.formState.errors.identificacion?.message}
          >
            <Input placeholder="Ej. 5-0412-0891" {...fisicaForm.register('identificacion')} />
          </FormField>

          <FormField
            label="Nombre"
            required
            error={fisicaForm.formState.errors.nombre?.message}
          >
            <Input placeholder="Nombre" {...fisicaForm.register('nombre')} />
          </FormField>

          <FormField
            label="Primer Apellido"
            required
            error={fisicaForm.formState.errors.primerApellido?.message}
          >
            <Input placeholder="Primer apellido" {...fisicaForm.register('primerApellido')} />
          </FormField>

          <FormField
            label="Segundo Apellido"
            error={fisicaForm.formState.errors.segundoApellido?.message}
          >
            <Input placeholder="Segundo apellido" {...fisicaForm.register('segundoApellido')} />
          </FormField>

          <FormField
            label="Fecha de Nacimiento (dd/MM/yyyy)"
            required
            error={fisicaForm.formState.errors.fechaDeNacimiento?.message}
          >
            <Calendar
              value={fisicaForm.watch('fechaDeNacimiento')}
              onChange={(iso) =>
                fisicaForm.setValue('fechaDeNacimiento', iso, { shouldValidate: true })
              }
            />
          </FormField>

          <FormField
            label="Género"
            required
            error={fisicaForm.formState.errors.idGenero?.message}
          >
            <Select {...fisicaForm.register('idGenero')}>
              {(generosQuery.data ?? []).map((g) => (
                <option key={g.idGenero} value={g.idGenero}>
                  {g.codigoGenero}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Estado Civil"
            required
            error={fisicaForm.formState.errors.idEstadoCivil?.message}
          >
            <Select {...fisicaForm.register('idEstadoCivil')}>
              {(estadosCivilesQuery.data ?? []).map((ec) => (
                <option key={ec.idEstadoCivil} value={ec.idEstadoCivil}>
                  {ec.codigoEstadoCivil}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Correo Electrónico"
            required
            error={fisicaForm.formState.errors.correoElectronico?.message}
          >
            <Input
              type="email"
              placeholder="ciudadano@correo.cr"
              {...fisicaForm.register('correoElectronico')}
            />
          </FormField>

          <FormField
            label="Teléfono"
            required
            error={fisicaForm.formState.errors.telefono?.message}
          >
            <Input placeholder="8888-0000" {...fisicaForm.register('telefono')} />
          </FormField>

          <FormField
            label="Distrito del Cantón de Nicoya"
            required
            className="sm:col-span-2"
            error={fisicaForm.formState.errors.idDistrito?.message}
          >
            <Select {...fisicaForm.register('idDistrito')}>
              {(distritosQuery.data ?? []).map((d) => (
                <option key={d.idDistrito} value={d.idDistrito}>
                  {d.codigoDistrito} — {d.nombreDistrito}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Dirección Exacta"
            required
            className="sm:col-span-2"
            error={fisicaForm.formState.errors.direccionExacta?.message}
          >
            <Textarea
              placeholder="Señas exactas de residencia en Nicoya..."
              {...fisicaForm.register('direccionExacta')}
            />
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenFisicaModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrarFisicaMut.isPending}>
              {registrarFisicaMut.isPending ? 'Guardando...' : 'Guardar Persona Física'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: REGISTRAR PERSONA JURÍDICA */}
      <Modal
        open={openJuridicaModal}
        onClose={() => setOpenJuridicaModal(false)}
        title="Registrar Contribuyente — Persona Jurídica"
        description="Complete los campos de las tablas dbo.Contribuyente y dbo.Persona_Juridica."
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={juridicaForm.handleSubmit((dto) => registrarJuridicaMut.mutate(dto))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField
            label="Tipo de Identificación"
            required
            error={juridicaForm.formState.errors.idTipoIdentificacion?.message}
          >
            <Select {...juridicaForm.register('idTipoIdentificacion')}>
              {(tiposIdQuery.data ?? []).map((t) => (
                <option key={t.idTipoIdentificacion} value={t.idTipoIdentificacion}>
                  {t.codigoTipoIdentificacion} — {t.descripcion}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Cédula Jurídica"
            required
            error={juridicaForm.formState.errors.identificacion?.message}
          >
            <Input placeholder="Ej. 3-101-784512" {...juridicaForm.register('identificacion')} />
          </FormField>

          <FormField
            label="Razón Social"
            required
            className="sm:col-span-2"
            error={juridicaForm.formState.errors.razonSocial?.message}
          >
            <Input
              placeholder="Ej. Inversiones Agroindustriales del Golfo S.A."
              {...juridicaForm.register('razonSocial')}
            />
          </FormField>

          <FormField
            label="Nombre Comercial"
            required
            error={juridicaForm.formState.errors.nombreComercial?.message}
          >
            <Input
              placeholder="Ej. AgroGolfo Nicoya"
              {...juridicaForm.register('nombreComercial')}
            />
          </FormField>

          <FormField
            label="Fecha de Constitución (dd/MM/yyyy)"
            required
            error={juridicaForm.formState.errors.fechaDeConstitucion?.message}
          >
            <Calendar
              value={juridicaForm.watch('fechaDeConstitucion')}
              onChange={(iso) =>
                juridicaForm.setValue('fechaDeConstitucion', iso, { shouldValidate: true })
              }
            />
          </FormField>

          <FormField
            label="Actividad Económica (CIIU)"
            required
            className="sm:col-span-2"
            error={juridicaForm.formState.errors.idActividadEconomica?.message}
          >
            <Select {...juridicaForm.register('idActividadEconomica')}>
              {(actividadesQuery.data ?? []).map((a) => (
                <option key={a.idActividadEconomica} value={a.idActividadEconomica}>
                  {a.codigoCiiu} — {a.descripcion}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Correo Electrónico"
            required
            error={juridicaForm.formState.errors.correoElectronico?.message}
          >
            <Input
              type="email"
              placeholder="facturacion@empresa.cr"
              {...juridicaForm.register('correoElectronico')}
            />
          </FormField>

          <FormField
            label="Teléfono"
            required
            error={juridicaForm.formState.errors.telefono?.message}
          >
            <Input placeholder="2685-0000" {...juridicaForm.register('telefono')} />
          </FormField>

          <FormField
            label="Distrito"
            required
            className="sm:col-span-2"
            error={juridicaForm.formState.errors.idDistrito?.message}
          >
            <Select {...juridicaForm.register('idDistrito')}>
              {(distritosQuery.data ?? []).map((d) => (
                <option key={d.idDistrito} value={d.idDistrito}>
                  {d.codigoDistrito} — {d.nombreDistrito}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Dirección Exacta"
            required
            className="sm:col-span-2"
            error={juridicaForm.formState.errors.direccionExacta?.message}
          >
            <Textarea
              placeholder="Domicilio social exacto..."
              {...juridicaForm.register('direccionExacta')}
            />
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenJuridicaModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrarJuridicaMut.isPending}>
              {registrarJuridicaMut.isPending ? 'Guardando...' : 'Guardar Persona Jurídica'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VINCULAR REPRESENTANTE LEGAL */}
      <Modal
        open={openRepModal}
        onClose={() => setOpenRepModal(false)}
        title="Vincular Representante Legal (dbo.Representante_Legal)"
        description="Asocia una Persona Física existente como representante legal de una Persona Jurídica."
      >
        <form
          onSubmit={repForm.handleSubmit((dto) => registrarRepMut.mutate(dto))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="ID Persona Jurídica"
              required
              error={repForm.formState.errors.idPersonaJuridica?.message}
            >
              <Input type="number" min={1} {...repForm.register('idPersonaJuridica')} />
            </FormField>
            <FormField
              label="ID Persona Física"
              required
              error={repForm.formState.errors.idPersonaFisica?.message}
            >
              <Input type="number" min={1} {...repForm.register('idPersonaFisica')} />
            </FormField>
          </div>

          <FormField
            label="Cargo de Representación"
            required
            error={repForm.formState.errors.idCargoRepresentacion?.message}
          >
            <Select {...repForm.register('idCargoRepresentacion')}>
              {(cargosQuery.data ?? []).map((c) => (
                <option key={c.idCargoRepresentacion} value={c.idCargoRepresentacion}>
                  {c.nombreCargo}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Fecha de Inicio (dd/MM/yyyy)"
              required
              error={repForm.formState.errors.fechaDeInicio?.message}
            >
              <Calendar
                value={repForm.watch('fechaDeInicio')}
                onChange={(iso) =>
                  repForm.setValue('fechaDeInicio', iso, { shouldValidate: true })
                }
              />
            </FormField>
            <FormField label="Fecha Fin (Opcional)">
              <Calendar
                value={repForm.watch('fechaFin') ?? ''}
                onChange={(iso) => repForm.setValue('fechaFin', iso)}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenRepModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrarRepMut.isPending}>
              {registrarRepMut.isPending ? 'Vinculando...' : 'Guardar Representante'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: EDITAR CONTRIBUYENTE */}
      <Modal
        open={Boolean(editingContribuyente)}
        onClose={() => setEditingContribuyente(null)}
        title={`Editar Contribuyente #${editingContribuyente?.idContribuyente ?? ''}`}
      >
        {editingContribuyente && (
          <form
            onSubmit={editForm.handleSubmit((dto) =>
              actualizarMut.mutate({ id: editingContribuyente.idContribuyente, dto })
            )}
            className="space-y-4"
          >
            <FormField
              label="Correo Electrónico"
              required
              error={editForm.formState.errors.correoElectronico?.message}
            >
              <Input type="email" {...editForm.register('correoElectronico')} />
            </FormField>

            <FormField
              label="Teléfono"
              required
              error={editForm.formState.errors.telefono?.message}
            >
              <Input {...editForm.register('telefono')} />
            </FormField>

            <FormField
              label="Distrito"
              required
              error={editForm.formState.errors.idDistrito?.message}
            >
              <Select {...editForm.register('idDistrito')}>
                {(distritosQuery.data ?? []).map((d) => (
                  <option key={d.idDistrito} value={d.idDistrito}>
                    {d.codigoDistrito} — {d.nombreDistrito}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Dirección Exacta"
              required
              error={editForm.formState.errors.direccionExacta?.message}
            >
              <Textarea {...editForm.register('direccionExacta')} />
            </FormField>

            <label className="flex items-center gap-2 text-sm font-medium text-[#171717]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#D1D5DB] accent-[#171717]"
                {...editForm.register('activo')}
              />
              Contribuyente Activo
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingContribuyente(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizarMut.isPending}>
                {actualizarMut.isPending ? 'Actualizando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
