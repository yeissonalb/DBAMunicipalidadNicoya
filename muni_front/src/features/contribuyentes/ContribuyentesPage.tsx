import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Building,
  Download,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { contribuyenteApi } from '@/services/api';
import type { VwPadronContribuyente } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { exportToCsv, formatDate } from '@/lib/utils';

const fisicoSchema = z.object({
  cedulaIdentidad: z.string().trim().min(5, 'Cédula requerida').max(20, 'Máximo 20 caracteres'),
  nombre: z.string().trim().min(1, 'Nombre requerido').max(50),
  apellido1Fisico: z.string().trim().min(1, 'Primer apellido requerido').max(50),
  apellido2Fisico: z.string().trim().min(1, 'Segundo apellido requerido').max(50),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  correoElectronico: z.string().trim().email('Correo electrónico inválido').max(100),
  telefono: z.string().trim().min(4, 'Teléfono requerido').max(20),
  direccionNotificaciones: z.string().trim().min(3, 'Dirección requerida').max(255),
});

const juridicoSchema = z.object({
  cedulaJuridica: z.string().trim().min(5, 'Cédula jurídica requerida').max(20),
  razonSocial: z.string().trim().min(2, 'Razón social requerida').max(255),
  nombreFantasia: z.string().trim().max(150).optional(),
  fechaConstitucion: z.string().min(1, 'Fecha de constitución requerida'),
  correoElectronico: z.string().trim().email('Correo electrónico inválido').max(100),
  telefono: z.string().trim().min(4, 'Teléfono requerido').max(20),
  direccionNotificaciones: z.string().trim().min(3, 'Dirección requerida').max(255),
});

const actualizarSchema = z.object({
  correoElectronico: z.string().trim().email('Correo electrónico inválido').max(100),
  telefono: z.string().trim().min(4, 'Teléfono requerido').max(20),
  direccionNotificaciones: z.string().trim().min(3, 'Dirección requerida').max(255),
  estadoContribuyente: z.boolean(),
});

const representanteSchema = z.object({
  nombreRepresentante: z.string().trim().min(1, 'Nombre requerido').max(50),
  apellido1Representante: z.string().trim().min(1, 'Primer apellido requerido').max(50),
  apellido2Representante: z.string().trim().min(1, 'Segundo apellido requerido').max(50),
  tomoFolioRegistro: z.string().trim().min(1, 'Tomo/Folio requerido').max(30),
  cedulaRepresentante: z.string().trim().min(5, 'Cédula requerida').max(20),
  fechaVencimientoPoder: z.string().min(1, 'Fecha de vencimiento del poder requerida'),
});

type FisicoForm = z.infer<typeof fisicoSchema>;
type JuridicoForm = z.infer<typeof juridicoSchema>;
type ActualizarForm = z.infer<typeof actualizarSchema>;
type RepresentanteForm = z.infer<typeof representanteSchema>;

export function ContribuyentesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'padron' | 'fisico' | 'juridico'>('padron');
  const [criterioBusqueda, setCriterioBusqueda] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | 'FISICO' | 'JURIDICO'>('TODOS');

  // Modales de edición y representante legal
  const [editingContribuyente, setEditingContribuyente] = useState<VwPadronContribuyente | null>(
    null
  );
  const [repLegalTarget, setRepLegalTarget] = useState<VwPadronContribuyente | null>(null);

  const padronQuery = useQuery({
    queryKey: ['contribuyentes', 'padron'],
    queryFn: () => contribuyenteApi.padron(),
  });

  const buscarQuery = useQuery({
    queryKey: ['contribuyentes', 'buscar', searchApplied],
    queryFn: () => contribuyenteApi.buscar(searchApplied),
    enabled: searchApplied.trim().length > 0,
  });

  // Formulario Persona Física
  const fisicoForm = useForm<FisicoForm>({
    resolver: zodResolver(fisicoSchema),
    defaultValues: {
      cedulaIdentidad: '',
      nombre: '',
      apellido1Fisico: '',
      apellido2Fisico: '',
      fechaNacimiento: '1985-05-15',
      correoElectronico: '',
      telefono: '',
      direccionNotificaciones: '',
    },
  });

  // Formulario Persona Jurídica
  const juridicoForm = useForm<JuridicoForm>({
    resolver: zodResolver(juridicoSchema),
    defaultValues: {
      cedulaJuridica: '',
      razonSocial: '',
      nombreFantasia: '',
      fechaConstitucion: '2018-01-15',
      correoElectronico: '',
      telefono: '',
      direccionNotificaciones: '',
    },
  });

  // Formulario Actualizar
  const editForm = useForm<ActualizarForm>({
    resolver: zodResolver(actualizarSchema),
  });

  // Formulario Representante Legal
  const repForm = useForm<RepresentanteForm>({
    resolver: zodResolver(representanteSchema),
    defaultValues: {
      nombreRepresentante: '',
      apellido1Representante: '',
      apellido2Representante: '',
      tomoFolioRegistro: '',
      cedulaRepresentante: '',
      fechaVencimientoPoder: '2028-12-31',
    },
  });

  const registrarFisicoMut = useMutation({
    mutationFn: (dto: FisicoForm) => contribuyenteApi.registrarFisico(dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Contribuyente físico registrado'} (ID #${res.data})`);
      fisicoForm.reset();
      setActiveTab('padron');
      queryClient.invalidateQueries({ queryKey: ['contribuyentes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const registrarJuridicoMut = useMutation({
    mutationFn: (dto: JuridicoForm) =>
      contribuyenteApi.registrarJuridico({
        ...dto,
        nombreFantasia: dto.nombreFantasia || null,
      }),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Contribuyente jurídico registrado'} (ID #${res.data})`);
      juridicoForm.reset();
      setActiveTab('padron');
      queryClient.invalidateQueries({ queryKey: ['contribuyentes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const actualizarMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarForm }) =>
      contribuyenteApi.actualizar(id, dto),
    onSuccess: (res) => {
      toast.success(res.message || 'Contribuyente actualizado correctamente.');
      setEditingContribuyente(null);
      queryClient.invalidateQueries({ queryKey: ['contribuyentes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const registrarRepMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: RepresentanteForm }) =>
      contribuyenteApi.registrarRepresentanteLegal(id, dto),
    onSuccess: (res) => {
      toast.success(res.message || 'Representante legal registrado en la base de datos.');
      setRepLegalTarget(null);
      repForm.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEditModal = (row: VwPadronContribuyente) => {
    setEditingContribuyente(row);
    editForm.reset({
      correoElectronico: row.correoElectronico ?? '',
      telefono: row.telefono ?? '',
      direccionNotificaciones: row.direccionNotificaciones ?? '',
      estadoContribuyente: row.estadoContribuyente,
    });
  };

  // Combinar resultados cuando se usa búsqueda sp_consultar_contribuyente o vw_padron_contribuyentes
  const listaBase: VwPadronContribuyente[] =
    searchApplied.trim().length > 0
      ? // sp_consultar_contribuyente devuelve exactamente las columnas de vw_padron_contribuyentes
        (buscarQuery.data ?? [])
      : padronQuery.data ?? [];

  const listaFiltrada = listaBase.filter((item) => {
    if (tipoFiltro === 'TODOS') return true;
    const t = (item.tipoPersona || '').toUpperCase();
    if (tipoFiltro === 'FISICO') return t.includes('FÍS') || t.includes('FIS');
    if (tipoFiltro === 'JURIDICO') return t.includes('JUR');
    return true;
  });

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Padrón de contribuyentes"
        subtitle="Administre personas físicas, organizaciones y representantes legales del cantón."
        badge={`${padronQuery.data?.length ?? 0} registros`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['contribuyentes'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv('padron_contribuyentes_nicoya.csv', listaFiltrada as unknown as Record<string, unknown>[])
              }
              disabled={listaFiltrada.length === 0}
            >
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </>
        }
      />

      <nav className="grid gap-3 rounded-2xl border border-sigemun-border bg-white p-3 shadow-card sm:grid-cols-3" aria-label="Secciones del padrón">
        <Button
          variant={activeTab === 'padron' ? 'default' : 'outline'}
          className="h-auto justify-start px-4 py-3"
          onClick={() => setActiveTab('padron')}
        >
          <Users className="h-4 w-4" /> Consultar padrón
        </Button>
        <Button
          variant={activeTab === 'fisico' ? 'default' : 'outline'}
          className="h-auto justify-start px-4 py-3"
          onClick={() => setActiveTab('fisico')}
        >
          <UserPlus className="h-4 w-4" /> Registrar persona física
        </Button>
        <Button
          variant={activeTab === 'juridico' ? 'default' : 'outline'}
          className="h-auto justify-start px-4 py-3"
          onClick={() => setActiveTab('juridico')}
        >
          <Building className="h-4 w-4" /> Registrar persona jurídica
        </Button>
      </nav>

      {/* TAB 1: PADRÓN GENERAL Y BÚSQUEDA */}
      {activeTab === 'padron' && (
        <div className="flex flex-col" style={{ gap: '1.5rem' }}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4 text-sigemun-primary" /> Buscar contribuyentes
              </CardTitle>
              <CardDescription>Consulte por identificación, nombre, razón social o correo electrónico.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 sm:pt-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_auto] lg:items-end">
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-semibold text-sigemun-text">
                    Criterio de búsqueda
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-sigemun-muted" />
                    <Input
                      placeholder="Cédula de identidad/jurídica, nombre, razón social o correo..."
                      value={criterioBusqueda}
                      onChange={(e) => setCriterioBusqueda(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSearchApplied(criterioBusqueda);
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full">
                  <label className="mb-2 block text-sm font-semibold text-sigemun-text">
                    Tipo de persona
                  </label>
                  <Select
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value as typeof tipoFiltro)}
                  >
                    <option value="TODOS">Todos los tipos</option>
                    <option value="FISICO">Persona Física</option>
                    <option value="JURIDICO">Persona Jurídica</option>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => setSearchApplied(criterioBusqueda)}>
                    <Search className="h-4 w-4" /> Buscar
                  </Button>
                  {searchApplied && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCriterioBusqueda('');
                        setSearchApplied('');
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {padronQuery.isLoading || buscarQuery.isLoading ? (
            <LoadingState message="Consultando padrón de contribuyentes en SQL Server..." />
          ) : padronQuery.isError ? (
            <ErrorState error={padronQuery.error} onRetry={() => padronQuery.refetch()} />
          ) : buscarQuery.isError ? (
            <ErrorState error={buscarQuery.error} onRetry={() => buscarQuery.refetch()} />
          ) : listaFiltrada.length === 0 ? (
            <EmptyState
              title="No se encontraron contribuyentes"
              description="Intente con otro criterio de búsqueda o registre un nuevo contribuyente."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-sigemun-border bg-white shadow-card" role="region" aria-label="Listado de contribuyentes" tabIndex={0}>
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-sigemun-border bg-sigemun-bg text-[11px] font-bold uppercase tracking-[0.08em] text-sigemun-muted">
                    <th scope="col" className="px-5 py-4">ID</th>
                    <th scope="col" className="px-4 py-4">Tipo</th>
                    <th scope="col" className="px-4 py-4">Identificación</th>
                    <th scope="col" className="px-4 py-4">Nombre o razón social</th>
                    <th scope="col" className="px-4 py-4">Contacto</th>
                    <th scope="col" className="px-4 py-4">Dirección de notificaciones</th>
                    <th scope="col" className="px-4 py-4">Registro</th>
                    <th scope="col" className="px-4 py-4">Estado</th>
                    <th scope="col" className="px-5 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sigemun-border">
                  {listaFiltrada.map((c) => {
                    const isJuridica = (c.tipoPersona || '').toUpperCase().includes('JUR');
                    return (
                      <tr key={c.idContribuyente} className="even:bg-sigemun-surface transition-colors hover:bg-sigemun-sky-muted/55">
                        <td className="px-5 py-4 font-mono font-bold text-sigemun-primary">
                          #{c.idContribuyente}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isJuridica ? 'accent' : 'info'}>
                            {c.tipoPersona}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold">
                          {c.identificacionOficial || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sigemun-text">
                            {c.nombreORazonSocial || '—'}
                          </p>
                          {c.nombreFantasia && (
                            <p className="text-xs text-sigemun-muted">
                              Fantasía: {c.nombreFantasia}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <p className="font-medium text-sigemun-text">{c.correoElectronico}</p>
                          <p className="text-sigemun-muted">{c.telefono}</p>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-xs text-sigemun-muted">
                          {c.direccionNotificaciones}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {formatDate(c.fechaRegistro)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={c.estadoContribuyente ? 'success' : 'danger'}>
                            {c.estadoContribuyente ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(c)}
                              title="Editar contacto y estado"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Editar
                            </Button>
                            {isJuridica && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setRepLegalTarget(c)}
                                title="Registrar representante legal"
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Rep. Legal
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTRAR PERSONA FÍSICA */}
      {activeTab === 'fisico' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Registrar Contribuyente — Persona Física (CU-01)</CardTitle>
            <CardDescription>
              Ejecuta <code className="font-mono">POST /api/contribuyente/fisico</code> (
              <code className="font-mono">dbo.sp_registrar_contribuyente_fisico</code>)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={fisicoForm.handleSubmit((v) => registrarFisicoMut.mutate(v))}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <FormField
                label="Cédula de Identidad"
                required
                error={fisicoForm.formState.errors.cedulaIdentidad?.message}
              >
                <Input
                  placeholder="Ej. 5-0412-0891"
                  {...fisicoForm.register('cedulaIdentidad')}
                />
              </FormField>

              <FormField
                label="Fecha de Nacimiento"
                required
                error={fisicoForm.formState.errors.fechaNacimiento?.message}
              >
                <Input type="date" {...fisicoForm.register('fechaNacimiento')} />
              </FormField>

              <FormField
                label="Nombre"
                required
                error={fisicoForm.formState.errors.nombre?.message}
              >
                <Input placeholder="Nombre" {...fisicoForm.register('nombre')} />
              </FormField>

              <FormField
                label="Primer Apellido"
                required
                error={fisicoForm.formState.errors.apellido1Fisico?.message}
              >
                <Input placeholder="Primer apellido" {...fisicoForm.register('apellido1Fisico')} />
              </FormField>

              <FormField
                label="Segundo Apellido"
                required
                error={fisicoForm.formState.errors.apellido2Fisico?.message}
              >
                <Input placeholder="Segundo apellido" {...fisicoForm.register('apellido2Fisico')} />
              </FormField>

              <FormField
                label="Teléfono"
                required
                error={fisicoForm.formState.errors.telefono?.message}
              >
                <Input placeholder="Ej. 8888-9999" {...fisicoForm.register('telefono')} />
              </FormField>

              <FormField
                label="Correo Electrónico"
                required
                className="sm:col-span-2"
                error={fisicoForm.formState.errors.correoElectronico?.message}
              >
                <Input
                  type="email"
                  placeholder="correo@ejemplo.cr"
                  {...fisicoForm.register('correoElectronico')}
                />
              </FormField>

              <FormField
                label="Dirección Exacta para Notificaciones"
                required
                className="sm:col-span-2"
                error={fisicoForm.formState.errors.direccionNotificaciones?.message}
              >
                <Input
                  placeholder="Barrio, distrito y señas en Nicoya..."
                  {...fisicoForm.register('direccionNotificaciones')}
                />
              </FormField>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab('padron')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={registrarFisicoMut.isPending}>
                  {registrarFisicoMut.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Registrar Persona Física
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: REGISTRAR PERSONA JURÍDICA */}
      {activeTab === 'juridico' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Registrar Contribuyente — Persona Jurídica (CU-02)</CardTitle>
            <CardDescription>
              Ejecuta <code className="font-mono">POST /api/contribuyente/juridico</code> (
              <code className="font-mono">dbo.sp_registrar_contribuyente_juridico</code>)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={juridicoForm.handleSubmit((v) => registrarJuridicoMut.mutate(v))}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <FormField
                label="Cédula Jurídica"
                required
                error={juridicoForm.formState.errors.cedulaJuridica?.message}
              >
                <Input
                  placeholder="Ej. 3-101-765432"
                  {...juridicoForm.register('cedulaJuridica')}
                />
              </FormField>

              <FormField
                label="Fecha de Constitución"
                required
                error={juridicoForm.formState.errors.fechaConstitucion?.message}
              >
                <Input type="date" {...juridicoForm.register('fechaConstitucion')} />
              </FormField>

              <FormField
                label="Razón Social"
                required
                className="sm:col-span-2"
                error={juridicoForm.formState.errors.razonSocial?.message}
              >
                <Input
                  placeholder="Nombre legal de la sociedad o entidad"
                  {...juridicoForm.register('razonSocial')}
                />
              </FormField>

              <FormField
                label="Nombre de Fantasía / Comercial (Opcional)"
                error={juridicoForm.formState.errors.nombreFantasia?.message}
              >
                <Input
                  placeholder="Nombre comercial"
                  {...juridicoForm.register('nombreFantasia')}
                />
              </FormField>

              <FormField
                label="Teléfono"
                required
                error={juridicoForm.formState.errors.telefono?.message}
              >
                <Input placeholder="Ej. 2685-0000" {...juridicoForm.register('telefono')} />
              </FormField>

              <FormField
                label="Correo Electrónico"
                required
                className="sm:col-span-2"
                error={juridicoForm.formState.errors.correoElectronico?.message}
              >
                <Input
                  type="email"
                  placeholder="facturacion@empresa.cr"
                  {...juridicoForm.register('correoElectronico')}
                />
              </FormField>

              <FormField
                label="Domicilio Social / Dirección de Notificaciones"
                required
                className="sm:col-span-2"
                error={juridicoForm.formState.errors.direccionNotificaciones?.message}
              >
                <Input
                  placeholder="Dirección exacta en Nicoya..."
                  {...juridicoForm.register('direccionNotificaciones')}
                />
              </FormField>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab('padron')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={registrarJuridicoMut.isPending}>
                  {registrarJuridicoMut.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Registrar Persona Jurídica
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* MODAL: ACTUALIZAR CONTRIBUYENTE */}
      <Modal
        open={Boolean(editingContribuyente)}
        onClose={() => setEditingContribuyente(null)}
        title={`Actualizar Contribuyente #${editingContribuyente?.idContribuyente ?? ''}`}
        description={
          editingContribuyente?.nombreORazonSocial || editingContribuyente?.identificacionOficial || ''
        }
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
              label="Dirección de Notificaciones"
              required
              error={editForm.formState.errors.direccionNotificaciones?.message}
            >
              <Input {...editForm.register('direccionNotificaciones')} />
            </FormField>

            <label className="flex items-center gap-2.5 text-sm font-medium text-sigemun-text">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sigemun-border text-sigemun-primary"
                {...editForm.register('estadoContribuyente')}
              />
              Contribuyente Activo en el Padrón Municipal
            </label>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingContribuyente(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizarMut.isPending}>
                {actualizarMut.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: REGISTRAR REPRESENTANTE LEGAL (CU-03) */}
      <Modal
        open={Boolean(repLegalTarget)}
        onClose={() => setRepLegalTarget(null)}
        title={`Registrar Representante Legal (CU-03)`}
        description={`Persona Jurídica #${repLegalTarget?.idContribuyente}: ${
          repLegalTarget?.nombreORazonSocial ?? ''
        }`}
      >
        {repLegalTarget && (
          <form
            onSubmit={repForm.handleSubmit((dto) =>
              registrarRepMut.mutate({ id: repLegalTarget.idContribuyente, dto })
            )}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <FormField
              label="Cédula del Representante"
              required
              error={repForm.formState.errors.cedulaRepresentante?.message}
            >
              <Input placeholder="5-0000-0000" {...repForm.register('cedulaRepresentante')} />
            </FormField>

            <FormField
              label="Tomo / Folio / Asiento Registro"
              required
              error={repForm.formState.errors.tomoFolioRegistro?.message}
            >
              <Input placeholder="Tomo 2025 Folio 44" {...repForm.register('tomoFolioRegistro')} />
            </FormField>

            <FormField
              label="Nombre"
              required
              error={repForm.formState.errors.nombreRepresentante?.message}
            >
              <Input {...repForm.register('nombreRepresentante')} />
            </FormField>

            <FormField
              label="Primer Apellido"
              required
              error={repForm.formState.errors.apellido1Representante?.message}
            >
              <Input {...repForm.register('apellido1Representante')} />
            </FormField>

            <FormField
              label="Segundo Apellido"
              required
              error={repForm.formState.errors.apellido2Representante?.message}
            >
              <Input {...repForm.register('apellido2Representante')} />
            </FormField>

            <FormField
              label="Fecha Vencimiento del Poder"
              required
              error={repForm.formState.errors.fechaVencimientoPoder?.message}
            >
              <Input type="date" {...repForm.register('fechaVencimientoPoder')} />
            </FormField>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setRepLegalTarget(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={registrarRepMut.isPending}>
                {registrarRepMut.isPending ? 'Registrando...' : 'Registrar Representante'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

