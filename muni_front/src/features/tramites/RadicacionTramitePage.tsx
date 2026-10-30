import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FilePlus2,
  FileText,
  Info,
  Loader2,
  Search,
  Upload,
} from 'lucide-react';
import {
  contribuyenteApi,
  inmuebleApi,
  tipoTramiteApi,
  tramiteApi,
} from '@/services/api';
import { BACKEND_ORIGIN } from '@/services/httpClient';
import { useAuth } from '@/app/providers/AuthProvider';
import { MODULE_PERMISSIONS } from '@/features/auth/permissions';
import type { ArchivoAdjuntadoDto } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/forms/FormField';
import { formatBytes } from '@/lib/utils';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function validateClientFile(file: File): string | null {
  if (file.size <= 0) return 'El archivo está vacío.';
  if (file.size > MAX_FILE_BYTES) return 'El archivo supera el límite máximo de 10 MB.';
  const dotIdx = file.name.lastIndexOf('.');
  const ext = dotIdx >= 0 ? file.name.slice(dotIdx).toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Extensión no permitida (${ext}). Permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  return null;
}

const radicarSchema = z.object({
  numeroExpediente: z
    .string()
    .trim()
    .min(3, 'Ingrese el número de expediente')
    .max(30, 'Máximo 30 caracteres'),
  idContribuyente: z.coerce.number().int().min(1, 'Seleccione o ingrese el ID del contribuyente'),
  idTipoTramite: z.coerce.number().int().min(1, 'Seleccione el tipo de trámite'),
  idInmueble: z.string().optional(),
});

type RadicarForm = z.infer<typeof radicarSchema>;

export function RadicacionTramitePage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canReadPadron = hasRole(MODULE_PERMISSIONS.CONTRIBUYENTES);

  const [criterioContribuyente, setCriterioContribuyente] = useState('');
  const [radicadoIdTramite, setRadicadoIdTramite] = useState<number | null>(null);
  const [archivosSubidos, setArchivosSubidos] = useState<ArchivoAdjuntadoDto[]>([]);
  const [selectedRequisitoUpload, setSelectedRequisitoUpload] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const defaultExpediente = useMemo(() => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `EXP-NIC-${year}-${rand}`;
  }, []);

  const form = useForm<RadicarForm>({
    resolver: zodResolver(radicarSchema),
    defaultValues: {
      numeroExpediente: defaultExpediente,
      idContribuyente: 1,
      idTipoTramite: 1,
      idInmueble: '',
    },
  });

  const watchedTipoTramite = Number(form.watch('idTipoTramite'));
  const watchedContribuyente = Number(form.watch('idContribuyente'));

  const tiposTramiteQuery = useQuery({
    queryKey: ['tipotramite', 'lista'],
    queryFn: () => tipoTramiteApi.consultar(),
  });

  const requisitosPorTipoQuery = useQuery({
    queryKey: ['tipotramite', 'requisitos', watchedTipoTramite],
    queryFn: () => tipoTramiteApi.requisitosPorTipo(watchedTipoTramite),
    enabled: watchedTipoTramite > 0,
  });

  const padronQuery = useQuery({
    queryKey: ['contribuyentes', 'padron-radicacion'],
    queryFn: () => contribuyenteApi.padron(),
    enabled: canReadPadron,
  });

  const inmueblesAllQuery = useQuery({
    queryKey: ['inmuebles', 'all-radicacion'],
    queryFn: () => inmuebleApi.listarConPropietarios(),
  });

  const inmueblesContribuyenteQuery = useQuery({
    queryKey: ['inmuebles', 'contribuyente', watchedContribuyente],
    queryFn: () => inmuebleApi.porContribuyente(watchedContribuyente),
    enabled: watchedContribuyente > 0,
  });

  // Contribuyentes extraídos de vistas autorizadas si el usuario es Analista (sin permiso a /api/contribuyente)
  const contribuyentesConocidos = useMemo(() => {
    if (canReadPadron && padronQuery.data) {
      return padronQuery.data.map((c) => ({
        idContribuyente: c.idContribuyente,
        nombre: `${c.nombreCompletoORazonSocial || 'Sin nombre'} (${c.identificacion || c.tipoContribuyente})`,
        correo: c.correoElectronico,
        telefono: c.telefono,
      }));
    }
    const map = new Map<number, { idContribuyente: number; nombre: string }>();
    for (const row of inmueblesAllQuery.data ?? []) {
      if (row.idContribuyente && row.propietario) {
        map.set(row.idContribuyente, {
          idContribuyente: row.idContribuyente,
          nombre: row.propietario,
        });
      }
    }
    return Array.from(map.values());
  }, [canReadPadron, padronQuery.data, inmueblesAllQuery.data]);

  const tipoSeleccionado = tiposTramiteQuery.data?.find(
    (t) => t.idTipoTramite === watchedTipoTramite
  );

  const radicarMut = useMutation({
    mutationFn: (values: RadicarForm) =>
      tramiteApi.registrar({
        numeroExpediente: values.numeroExpediente,
        idTipoTramite: values.idTipoTramite,
        idContribuyente: values.idContribuyente,
        idInmueble: values.idInmueble ? Number(values.idInmueble) : null,
      }),
    onSuccess: (res) => {
      setRadicadoIdTramite(res.data);
      toast.success(
        `${res.message || 'Expediente radicado exitosamente'} (ID Trámite #${res.data})`
      );
      queryClient.invalidateQueries({ queryKey: ['tramites'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleFileUpload = async (file: File, mode: 'requisito' | 'adjunto') => {
    if (!radicadoIdTramite) {
      toast.error('Primero debe radicar el expediente (Paso 1) para obtener el ID del trámite.');
      return;
    }
    const validationError = validateClientFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingFile(true);
    try {
      const reqId = selectedRequisitoUpload ? Number(selectedRequisitoUpload) : undefined;
      if (mode === 'requisito') {
        if (!reqId) {
          toast.error('Seleccione el requisito que desea acreditar con este documento.');
          return;
        }
        const res = await tramiteApi.requisitoPresentado(radicadoIdTramite, reqId, file);
        setArchivosSubidos((prev) => [res.data, ...prev]);
        toast.success(res.message || 'Requisito documental acreditado.');
      } else {
        const res = await tramiteApi.adjuntarArchivo(radicadoIdTramite, file, reqId ?? null);
        setArchivosSubidos((prev) => [res.data, ...prev]);
        toast.success(res.message || 'Archivo adjuntado al expediente.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo.');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Radicación de Trámites — Nueva Radicación de Expediente"
        subtitle="Apertura de expediente municipal, verificación de requisitos y carga de documentación adjunta (Wireframe #8, p. 117)"
        badge="CU-TR-03 a CU-TR-05"
        icon={<FilePlus2 className="h-6 w-6" />}
      />

      {!canReadPadron && (
        <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs text-sky-900">
          <Info className="h-4 w-4 shrink-0 text-sky-700 mt-0.5" />
          <div>
            <strong>Nota de permisos del rol Analista:</strong> En{' '}
            <code className="font-mono">muni-back</code>, <code className="font-mono">ContribuyenteController</code>{' '}
            está restringido a <code className="font-mono">Admin</code> y <code className="font-mono">Cajero</code>.
            El selector de contribuyentes carga automáticamente los propietarios desde{' '}
            <code className="font-mono">vw_inmuebles_propietarios</code> y permite indicar cualquier{' '}
            <code className="font-mono">idContribuyente</code> directamente.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda (7 cols): Paso 1 - Datos del trámite y contribuyente */}
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader className="border-b border-[#DCE3DE] bg-[#F5F7F4]/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Paso 1: Datos del Trámite y Contribuyente</CardTitle>
                  <CardDescription>
                    Ejecuta <code className="font-mono">POST /api/tramite</code> (
                    <code className="font-mono">dbo.sp_registrar_tramite</code>). El funcionario se
                    asigna automáticamente desde el JWT.
                  </CardDescription>
                </div>
                {radicadoIdTramite && (
                  <Badge variant="success">Radicado ID #{radicadoIdTramite}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <form
                onSubmit={form.handleSubmit((v) => radicarMut.mutate(v))}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Número de Expediente Oficial"
                    required
                    error={form.formState.errors.numeroExpediente?.message}
                  >
                    <Input
                      placeholder="EXP-NIC-2026-0001"
                      {...form.register('numeroExpediente')}
                    />
                  </FormField>

                  <FormField
                    label="Tipo de Trámite Municipal"
                    required
                    error={form.formState.errors.idTipoTramite?.message}
                  >
                    <Select {...form.register('idTipoTramite')}>
                      {(tiposTramiteQuery.data ?? []).map((t) => (
                        <option key={t.idTipoTramite} value={t.idTipoTramite}>
                          {t.nombreTramite} (SLA: {t.diasResolucionMax} días)
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                {/* SLA & Departamento Banner */}
                {tipoSeleccionado && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#B6944A]/40 bg-[#FBF7EE] px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-2 text-[#967736]">
                      <Clock className="h-4 w-4" />
                      <span>
                        <strong>SLA Estimado:</strong> {tipoSeleccionado.diasResolucionMax} días
                        hábiles máximos
                      </span>
                    </div>
                    <span className="font-semibold text-[#164B35]">
                      Depto.: {tipoSeleccionado.nombreDepartamento}
                    </span>
                  </div>
                )}

                {/* Selección / Búsqueda de Contribuyente */}
                <div className="rounded-xl border border-[#DCE3DE] bg-[#F5F7F4]/50 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#164B35]">
                    Detalles del Ciudadano / Contribuyente Solicitante
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-[#26352D]">
                        Filtrar / Seleccionar Contribuyente
                      </label>
                      <div className="relative mb-2">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5A6B61]" />
                        <Input
                          placeholder="Filtrar por nombre o identificación..."
                          value={criterioContribuyente}
                          onChange={(e) => setCriterioContribuyente(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Select
                        value={watchedContribuyente}
                        onChange={(e) =>
                          form.setValue('idContribuyente', Number(e.target.value))
                        }
                      >
                        <option value={0}>Seleccione un contribuyente...</option>
                        {contribuyentesConocidos
                          .filter(
                            (c) =>
                              !criterioContribuyente.trim() ||
                              c.nombre
                                .toLowerCase()
                                .includes(criterioContribuyente.trim().toLowerCase()) ||
                              String(c.idContribuyente) === criterioContribuyente.trim()
                          )
                          .map((c) => (
                            <option key={c.idContribuyente} value={c.idContribuyente}>
                              #{c.idContribuyente} — {c.nombre}
                            </option>
                          ))}
                      </Select>
                    </div>

                    <FormField
                      label="ID Contribuyente"
                      required
                      error={form.formState.errors.idContribuyente?.message}
                    >
                      <Input
                        type="number"
                        min={1}
                        {...form.register('idContribuyente')}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Finca Relacionada */}
                <FormField
                  label="Finca / Bien Inmueble Relacionado (Opcional)"
                  hint="Cargado automáticamente para el contribuyente seleccionado (sp_consultar_inmuebles_por_contribuyente)"
                  error={form.formState.errors.idInmueble?.message}
                >
                  <Select {...form.register('idInmueble')}>
                    <option value="">Sin inmueble específico asociado</option>
                    {(inmueblesContribuyenteQuery.data ?? []).map((inm) => (
                      <option key={inm.idInmueble} value={inm.idInmueble}>
                        Finca {inm.numeroFinca} · Plano {inm.planoCatastrado} ({inm.nombreDistrito})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const year = new Date().getFullYear();
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      form.reset({
                        numeroExpediente: `EXP-NIC-${year}-${rand}`,
                        idContribuyente: 1,
                        idTipoTramite: 1,
                        idInmueble: '',
                      });
                      setRadicadoIdTramite(null);
                      setArchivosSubidos([]);
                    }}
                  >
                    Limpiar / Nuevo Expediente
                  </Button>
                  <Button type="submit" disabled={radicarMut.isPending}>
                    {radicarMut.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Radicando en SQL Server...
                      </>
                    ) : (
                      <>
                        <FilePlus2 className="h-4 w-4" /> Radicar Expediente
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Requisitos del Trámite Seleccionado */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Requisitos Configurados para el Tipo de Trámite
              </CardTitle>
              <CardDescription>
                Fuente: <code className="font-mono">GET /api/tipotramite/{watchedTipoTramite}/requisitos</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requisitosPorTipoQuery.isLoading ? (
                <p className="text-xs text-[#5A6B61]">Consultando requisitos...</p>
              ) : !requisitosPorTipoQuery.data || requisitosPorTipoQuery.data.length === 0 ? (
                <p className="text-xs text-[#5A6B61]">
                  Este tipo de trámite no tiene requisitos específicos asociados en el catálogo.
                </p>
              ) : (
                <div className="space-y-2">
                  {requisitosPorTipoQuery.data.map((req) => {
                    const acreditado = archivosSubidos.some(
                      (a) => a.idRequisito === req.idRequisito
                    );
                    return (
                      <div
                        key={req.idRequisito}
                        className="flex items-start justify-between gap-3 rounded-lg border border-[#DCE3DE] bg-[#F5F7F4]/60 p-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#26352D]">
                              #{req.idRequisito} · {req.nombreRequisito}
                            </span>
                            <Badge variant={req.esObligatorio ? 'gold' : 'outline'}>
                              {req.esObligatorio ? 'Obligatorio' : 'Opcional'}
                            </Badge>
                            {acreditado && <Badge variant="success">Acreditado</Badge>}
                          </div>
                          <p className="mt-1 text-[#5A6B61]">{req.descripcion}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequisitoUpload(String(req.idRequisito))}
                        >
                          Seleccionar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha (5 cols): Paso 2 - Documentación Adjunta y Requisitos Presentados */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="border-t-4 border-t-[#164B35]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#164B35]" /> Paso 2: Documentación Adjunta
              </CardTitle>
              <CardDescription>
                Sube archivos reales en <code className="font-mono">multipart/form-data</code> a{' '}
                <code className="font-mono">POST /api/tramite/requisito-presentado</code> o{' '}
                <code className="font-mono">POST /api/tramite/adjuntar-archivo</code> (máx. 10 MB).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="ID Trámite Destino"
                hint="Se completa automáticamente al radicar el expediente o puede ingresar un ID existente."
              >
                <Input
                  type="number"
                  min={1}
                  placeholder="ID del trámite (ej. 1)"
                  value={radicadoIdTramite ?? ''}
                  onChange={(e) =>
                    setRadicadoIdTramite(e.target.value ? Number(e.target.value) : null)
                  }
                />
              </FormField>

              <FormField
                label="Requisito Documental Asociado (Opcional para adjunto general)"
              >
                <Select
                  value={selectedRequisitoUpload}
                  onChange={(e) => setSelectedRequisitoUpload(e.target.value)}
                >
                  <option value="">— Documento general del expediente —</option>
                  {(requisitosPorTipoQuery.data ?? []).map((r) => (
                    <option key={r.idRequisito} value={r.idRequisito}>
                      #{r.idRequisito} · {r.nombreRequisito}{' '}
                      {r.esObligatorio ? '(Obligatorio)' : '(Opcional)'}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Subir como Requisito Presentado */}
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#164B35]/40 bg-[#E8F0EC]/40 p-4 text-center transition-colors hover:bg-[#E8F0EC]">
                  <CheckCircle2 className="h-6 w-6 text-[#164B35]" />
                  <span className="mt-2 text-xs font-bold text-[#164B35]">
                    Acreditar Requisito
                  </span>
                  <span className="mt-0.5 text-[10px] text-[#5A6B61]">
                    POST /requisito-presentado
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    disabled={uploadingFile}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, 'requisito');
                      e.target.value = '';
                    }}
                  />
                </label>

                {/* Subir como Archivo Adjunto General */}
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#B6944A]/50 bg-[#FBF7EE]/60 p-4 text-center transition-colors hover:bg-[#FBF7EE]">
                  <FileText className="h-6 w-6 text-[#967736]" />
                  <span className="mt-2 text-xs font-bold text-[#967736]">
                    Adjuntar Anexo General
                  </span>
                  <span className="mt-0.5 text-[10px] text-[#5A6B61]">
                    POST /adjuntar-archivo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    disabled={uploadingFile}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, 'adjunto');
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {uploadingFile && (
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#164B35]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Subiendo archivo al servidor...
                </div>
              )}

              <p className="text-[11px] text-[#5A6B61]">
                Formatos permitidos: <code className="font-mono">.pdf, .jpg, .jpeg, .png, .doc, .docx, .xls, .xlsx</code> (máx. 10 MB).
              </p>

              {/* Lista de Archivos Subidos */}
              <div className="border-t border-[#DCE3DE] pt-3">
                <p className="mb-2 text-xs font-bold text-[#26352D]">
                  Archivos Subidos en esta Sesión ({archivosSubidos.length})
                </p>
                {archivosSubidos.length === 0 ? (
                  <p className="text-xs text-[#5A6B61]">
                    Aún no se han adjuntado archivos en esta sesión.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {archivosSubidos.map((a, i) => (
                      <div
                        key={`${a.nombreAlmacenado}-${i}`}
                        className="flex items-center justify-between rounded-lg border border-[#DCE3DE] bg-[#F5F7F4] px-3 py-2 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-semibold text-[#26352D]">
                            {a.nombreOriginal}
                          </p>
                          <p className="text-[11px] text-[#5A6B61]">
                            {formatBytes(a.pesoBytes)} · Trámite #{a.idTramite}{' '}
                            {a.idRequisito ? `· Req. #${a.idRequisito}` : ''}
                          </p>
                        </div>
                        <a
                          href={`${BACKEND_ORIGIN}/${a.rutaRelativa}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-[#164B35] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0F3626]"
                        >
                          Abrir <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

