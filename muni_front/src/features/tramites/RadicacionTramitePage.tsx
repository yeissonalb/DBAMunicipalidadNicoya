import { DocumentPreviewButton } from '@/components/common/DocumentPreviewButton';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FilePlus2,
  FileText,
  FolderKanban,
  KeyRound,
  Printer,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  contribuyenteApi,
  inmuebleApi,
  tipoTramiteApi,
  tramiteApi,
} from '@/services/api';
import { useAuth } from '@/app/providers/AuthProvider';
import { consultarCedulaHacienda, type HaciendaContribuyenteInfo } from '@/services/haciendaCedulaApi';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { formatCurrencyCRC, formatDate } from '@/lib/utils';
import type { TramiteRadicadoResultadoDto } from '@/types/api';

interface StagedDocument {
  id: string;
  nombreArchivo: string;
  tipo: string;
  tamanoTexto: string;
  tamanoBytes: number;
  archivo: File;
}

export function RadicacionTramitePage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  // Paso 1: Ciudadano y Trámite
  const [cedulaBusqueda, setCedulaBusqueda] = useState('');
  const [selectedContribuyenteId, setSelectedContribuyenteId] = useState<number>(0);
  const [selectedTipoTramiteId, setSelectedTipoTramiteId] = useState<number>(0);
  const [selectedInmuebleId, setSelectedInmuebleId] = useState<string>('');
  const [observacionInicial, setObservacionInicial] = useState('');

  // Modal para registro rápido de contribuyente no registrado
  const [openNuevoContribuyenteModal, setOpenNuevoContribuyenteModal] = useState(false);
  const [tipoPersonaNuevo, setTipoPersonaNuevo] = useState<'FISICO' | 'JURIDICO'>('FISICO');
  const [cedulaNuevo, setCedulaNuevo] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [apellido1Nuevo, setApellido1Nuevo] = useState('');
  const [apellido2Nuevo, setApellido2Nuevo] = useState('');
  const [correoNuevo, setCorreoNuevo] = useState('');
  const [telefonoNuevo, setTelefonoNuevo] = useState('');
  const [direccionNuevo, setDireccionNuevo] = useState('');

  // Estado de activación asistida
  const [codigoActivacionGenerado, setCodigoActivacionGenerado] = useState<{
    codigo: string;
    expiracion: string;
  } | null>(null);

  // Archivos preparados para adjuntar al radicar
  const [stagedDocs, setStagedDocs] = useState<StagedDocument[]>([]);
  const planoInputRef = useRef<HTMLInputElement>(null);
  const documentosInputRef = useRef<HTMLInputElement>(null);

  // Verificación oficial con API del Ministerio de Hacienda
  const [haciendaInfo, setHaciendaInfo] = useState<HaciendaContribuyenteInfo | null>(null);
  const [consultandoHacienda, setConsultandoHacienda] = useState(false);

  // Resultado tras radicar (Comprobante oficial)
  const [expedienteCreado, setExpedienteCreado] = useState<TramiteRadicadoResultadoDto | null>(null);
  const [openComprobanteModal, setOpenComprobanteModal] = useState(false);

  const padronQuery = useQuery({
    queryKey: ['contribuyentes', 'padron-radicacion'],
    queryFn: () => contribuyenteApi.padron(),
  });

  const tiposTramiteQuery = useQuery({
    queryKey: ['tipos-tramite', 'radicacion'],
    queryFn: () => tipoTramiteApi.listar(),
  });

  const requisitosQuery = useQuery({
    queryKey: ['tipos-tramite', 'requisitos', selectedTipoTramiteId],
    queryFn: () => tipoTramiteApi.requisitos(selectedTipoTramiteId),
    enabled: selectedTipoTramiteId > 0,
  });

  const inmueblesContribuyenteQuery = useQuery({
    queryKey: ['inmuebles', 'por-contribuyente-rad', selectedContribuyenteId],
    queryFn: () => inmuebleApi.porContribuyente(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  // Consulta si el contribuyente actual tiene cuenta ciudadana activa
  const cuentaActivaQuery = useQuery({
    queryKey: ['contribuyente', 'cuenta-activa', selectedContribuyenteId],
    queryFn: () => contribuyenteApi.consultarCuentaActiva(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  const contribuyenteActual = (padronQuery.data ?? []).find(
    (c) => c.idContribuyente === selectedContribuyenteId
  );

  const tipoTramiteActual = (tiposTramiteQuery.data ?? []).find(
    (t) => t.idTipoTramite === selectedTipoTramiteId
  );

  useEffect(() => {
    if (contribuyenteActual) {
      setCedulaBusqueda(contribuyenteActual.identificacion);
    }
  }, [contribuyenteActual]);

  const handleBuscarCiudadano = () => {
    const q = cedulaBusqueda.trim().toLowerCase();
    if (!q) return;
    const cleanQ = q.replace(/\D/g, '');
    const match = (padronQuery.data ?? []).find((c) => {
      const cIdent = c.identificacion.toLowerCase();
      const cClean = c.identificacion.replace(/\D/g, '');
      const cNombre = c.nombreCompletoORazonSocial.toLowerCase();
      return (
        cIdent.includes(q) ||
        (cleanQ.length >= 8 && cClean === cleanQ) ||
        cNombre.includes(q)
      );
    });

    if (match) {
      setSelectedContribuyenteId(match.idContribuyente);
      setSelectedInmuebleId('');
      setCodigoActivacionGenerado(null);
      toast.success(`Ciudadano encontrado: ${match.nombreCompletoORazonSocial}`);
    } else {
      toast.warning('No se encontró en el padrón municipal. Puede registrarlo ahora mismo.');
      setCedulaNuevo(cedulaBusqueda.trim());
      setOpenNuevoContribuyenteModal(true);
    }
  };

  const handleConsultarHacienda = async () => {
    if (!cedulaBusqueda.trim()) return;
    setConsultandoHacienda(true);
    try {
      const info = await consultarCedulaHacienda(cedulaBusqueda);
      setHaciendaInfo(info);
      toast.success(`Cédula verificada en Hacienda: ${info.nombreCompleto}`);

      // Buscar si ya existe en el padrón local por cédula
      const q = info.identificacionLimpia;
      const match = (padronQuery.data ?? []).find(
        (c) => c.identificacion.replace(/\D/g, '') === q
      );
      if (match) {
        setSelectedContribuyenteId(match.idContribuyente);
        setCodigoActivacionGenerado(null);
        toast.info(`Contribuyente vinculado al padrón municipal (ID #${match.idContribuyente}).`);
      } else {
        toast.info('Contribuyente verificado en Hacienda pero aún no registrado en padrón local.');
        setCedulaNuevo(info.identificacionLimpia);
        setNombreNuevo(info.nombreCompleto);
        setOpenNuevoContribuyenteModal(true);
      }
    } catch (err) {
      setHaciendaInfo(null);
      toast.error(
        err instanceof Error ? err.message : 'Error al consultar la API del Ministerio de Hacienda.'
      );
    } finally {
      setConsultandoHacienda(false);
    }
  };

  const registrarContribuyenteMut = useMutation({
    mutationFn: async () => {
      if (tipoPersonaNuevo === 'FISICO') {
        const res = await contribuyenteApi.registrarFisico({
          cedulaIdentidad: cedulaNuevo.trim(),
          nombre: nombreNuevo.trim(),
          apellido1Fisico: apellido1Nuevo.trim() || 'Desconocido',
          apellido2Fisico: apellido2Nuevo.trim() || 'Desconocido',
          fechaNacimiento: '1990-01-01',
          correoElectronico: correoNuevo.trim() || `${cedulaNuevo.trim()}@correo.com`,
          telefono: telefonoNuevo.trim() || '26850000',
          direccionNotificaciones: direccionNuevo.trim(),
        });
        return res.data;
      } else {
        const res = await contribuyenteApi.registrarJuridico({
          cedulaJuridica: cedulaNuevo.trim(),
          razonSocial: nombreNuevo.trim(),
          nombreFantasia: nombreNuevo.trim(),
          fechaConstitucion: '2010-01-01',
          correoElectronico: correoNuevo.trim() || `${cedulaNuevo.trim()}@correo.com`,
          telefono: telefonoNuevo.trim() || '26850000',
          direccionNotificaciones: direccionNuevo.trim(),
        });
        return res.data;
      }
    },
    onSuccess: async (nuevoId) => {
      toast.success(`Contribuyente registrado exitosamente en el padrón (ID #${nuevoId}).`);
      setOpenNuevoContribuyenteModal(false);
      await queryClient.invalidateQueries({ queryKey: ['contribuyentes'] });
      setSelectedContribuyenteId(nuevoId);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generarCodigoActivacionMut = useMutation({
    mutationFn: async () => {
      if (!selectedContribuyenteId) throw new Error('Seleccione un contribuyente.');
      const res = await contribuyenteApi.generarCodigoActivacion(selectedContribuyenteId, {
        duracionHoras: 48,
        observacion: 'Emisión asistida durante radicación de trámite en ventanilla única',
      });
      return res.data;
    },
    onSuccess: (data) => {
      setCodigoActivacionGenerado({
        codigo: data.codigoActivacion,
        expiracion: data.fechaExpiracion,
      });
      toast.success(`Código de activación generado: ${data.codigoActivacion}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSeleccionarArchivos = (files: FileList | null, soloPdf = false) => {
    if (!files) return;
    const nuevos: StagedDocument[] = [];
    for (const archivo of Array.from(files)) {
      const extension = archivo.name.split('.').pop()?.toLowerCase();
      if (!(soloPdf ? ['pdf'] : ['pdf', 'jpg', 'jpeg']).includes(extension ?? '')) {
        toast.error(`Formato no permitido: ${archivo.name}`);
        continue;
      }
      if (archivo.size === 0 || archivo.size > 10 * 1024 * 1024) {
        toast.error(`El archivo debe contener datos y no superar 10 MB: ${archivo.name}`);
        continue;
      }
      nuevos.push({
        id: crypto.randomUUID(),
        nombreArchivo: archivo.name,
        tipo: extension === 'pdf' ? 'PDF' : 'JPG',
        tamanoTexto: `${(archivo.size / 1024).toFixed(1)} KB`,
        tamanoBytes: archivo.size,
        archivo,
      });
    }
    setStagedDocs((prev) => [...prev, ...nuevos]);
  };

  // Radicación formal con generación atómica en servidor
  const radicarExpedienteMut = useMutation({
    mutationFn: async () => {
      if (expedienteCreado) throw new Error('Este expediente ya fue creado. Use Reintentar archivos pendientes si corresponde.');
      if (!selectedContribuyenteId) throw new Error('Debe seleccionar un contribuyente activo.');
      if (!selectedTipoTramiteId) throw new Error('Debe seleccionar un tipo de trámite.');
      if (tipoTramiteActual?.requiereInmueble == null) throw new Error('El administrador debe configurar la regla de inmueble para este tipo de trámite.');
      if (tipoTramiteActual.requiereInmueble && !selectedInmuebleId) throw new Error('Este tipo de trámite requiere seleccionar un inmueble.');

      // No enviamos numeroExpediente para que el servidor SQL lo genere atómicamente con la secuencia Seq_Expediente
      const res = await tramiteApi.registrar({
        observacionesIniciales: observacionInicial.trim(),
        idContribuyente: selectedContribuyenteId,
        idTipoTramite: selectedTipoTramiteId,
        idInmueble: selectedInmuebleId ? Number(selectedInmuebleId) : null,
      });

      const resultado: TramiteRadicadoResultadoDto =
        typeof res.data === 'number'
          ? { idTramite: res.data, numeroExpediente: `EXP-NIC-${new Date().getFullYear()}-${res.data}` }
          : res.data;

      const nuevoIdTramite = resultado.idTramite;

      // Enviar el contenido real y conservar los archivos que fallen para reintento.
      const fallidos: StagedDocument[] = [];
      for (const doc of stagedDocs) {
        try {
          await tramiteApi.adjuntarArchivo(nuevoIdTramite, doc.archivo);
        } catch {
          fallidos.push(doc);
        }
      }
      setStagedDocs(fallidos);
      if (fallidos.length > 0) {
        toast.error(`El expediente fue creado, pero ${fallidos.length} archivo(s) no se pudieron adjuntar. Reintente desde este formulario; no radique otro expediente.`);
      }

      return resultado;
    },
    onSuccess: (resultado) => {
      setExpedienteCreado(resultado);
      setOpenComprobanteModal(true);
      toast.success(
        `Expediente ${resultado.numeroExpediente} (ID #${resultado.idTramite}) radicado exitosamente.`
      );
      queryClient.invalidateQueries({ queryKey: ['tramite'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const tieneCuentaActiva = cuentaActivaQuery.data === true;

  // Validación de titularidad de inmueble
  const inmuebleSeleccionadoEsPropio = !selectedInmuebleId
    ? true
    : (inmueblesContribuyenteQuery.data ?? []).some(
        (inm) => String(inm.idInmueble) === String(selectedInmuebleId)
      );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Radicación de Expediente Municipal"
        subtitle="CU-TR-03: Búsqueda de contribuyente, asignación atómica de expediente, cotejo de requisitos y comprobante oficial."
        badge="Ventanilla Única Municipal"
        icon={<FilePlus2 className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link to="/tramites/revision">Ir a Revisión y Cotejo</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/tramites/seguimiento">
                <FolderKanban className="h-4 w-4" /> Seguimiento
              </Link>
            </Button>
          </div>
        }
      />

      {/* FLUJO DE TRABAJO SECUENCIAL */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] p-3.5 text-xs shadow-xs">
        <div className="flex items-center gap-2 font-bold text-[#1E3A8A]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D4ED8] text-white font-mono text-[11px]">1</span>
          <span>Paso 1: Radicación y Comprobante Oficial</span>
          <Badge variant="blue">Paso Actual</Badge>
        </div>
        <ChevronRight className="hidden sm:block h-4 w-4 text-[#93C5FD]" />
        <Link
          to="/tramites/revision"
          className="flex items-center gap-2 text-[#4B5563] hover:text-[#171717] transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#D1D5DB] text-[#4B5563] font-mono text-[11px]">2</span>
          <span>Paso 2: Revisión Técnica y Cotejo Documental</span>
        </Link>
        <ChevronRight className="hidden sm:block h-4 w-4 text-[#93C5FD]" />
        <Link
          to="/tramites/seguimiento"
          className="flex items-center gap-2 text-[#4B5563] hover:text-[#171717] transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#D1D5DB] text-[#4B5563] font-mono text-[11px]">3</span>
          <span>Paso 3: Evaluación y Resolución Final</span>
        </Link>
      </div>

      {expedienteCreado && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-xs text-[#15803D] sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#15803D]" />
            <div>
              <p className="font-bold text-sm">
                Expediente oficial {expedienteCreado.numeroExpediente} generado exitosamente en SQL Server
              </p>
              <p className="mt-0.5 text-[#15803D]/90">
                El número único y seguro ante concurrencia fue asignado por la secuencia institucional.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpenComprobanteModal(true)}
            >
              <Printer className="h-4 w-4" /> Ver Comprobante
            </Button>
            <Button asChild size="sm">
              <Link to={`/tramites/revision?id=${expedienteCreado.idTramite}`}>
                Continuar a Revisión (Paso 2)
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* FORMULARIO PRINCIPAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#15803D]" />
            <CardTitle>Paso 1: Datos del Trámite y Ciudadano</CardTitle>
          </div>
          <CardDescription>
            Búsqueda de solicitante en padrón municipal, verificación con Hacienda y control de acceso al portal ciudadano.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* SECCIÓN 1: DETALLES DEL CIUDADANO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-[#171717]">1. Identificación del Solicitante</h3>
              <div className="flex items-center gap-2">
                {haciendaInfo && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                    <ShieldCheck className="h-4 w-4 text-[#15803D]" /> Verificado en Hacienda
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenNuevoContribuyenteModal(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Registrar Nuevo Contribuyente
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-5">
                <FormField label="Cédula de Identidad (Física o Jurídica)" required>
                  <div className="flex gap-1.5">
                    <Input
                      value={cedulaBusqueda}
                      onChange={(e) => {
                        setCedulaBusqueda(e.target.value);
                        setSelectedContribuyenteId(0);
                        setSelectedInmuebleId('');
                        setCodigoActivacionGenerado(null);
                        setHaciendaInfo(null);
                      }}
                      placeholder="Ej. 508570485"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBuscarCiudadano();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleBuscarCiudadano}
                      title="Buscar en padrón municipal"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      disabled={consultandoHacienda || !cedulaBusqueda.trim()}
                      onClick={handleConsultarHacienda}
                      className="whitespace-nowrap px-3 text-xs"
                      title="Verificar en tiempo real contra API Ministerio de Hacienda"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#93C5FD]" />
                      {consultandoHacienda ? '...' : 'Hacienda'}
                    </Button>
                  </div>
                </FormField>
              </div>

              <div className="md:col-span-7">
                <FormField label="Nombre Completo / Razón Social (Padrón Municipal)">
                  <Select
                    value={selectedContribuyenteId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedContribuyenteId(id);
                      setCedulaBusqueda((padronQuery.data ?? []).find(c => c.idContribuyente === id)?.identificacion ?? '');
                      setHaciendaInfo(null);
                      setSelectedInmuebleId('');
                      setCodigoActivacionGenerado(null);
                    }}
                  >
                    <option value={0}>— Seleccione un contribuyente —</option>
                    {(padronQuery.data ?? []).map((c) => (
                      <option key={c.idContribuyente} value={c.idContribuyente}>
                        {c.nombreCompletoORazonSocial} ({c.identificacion})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Tarjeta de estado de Cuenta Ciudadana */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-[#1E293B]">
                    Acceso al Portal Ciudadano Autoservicio (/portal):
                  </p>
                  <p className="text-[#64748B]">
                    {!selectedContribuyenteId
                      ? 'Seleccione un contribuyente para consultar su acceso.'
                      : cuentaActivaQuery.isLoading
                      ? 'Verificando estado de cuenta...'
                      : tieneCuentaActiva
                      ? 'El contribuyente ya tiene cuenta activa. Sus trámites se vinculan automáticamente.'
                      : 'El contribuyente NO tiene cuenta activa en el portal ciudadano.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tieneCuentaActiva ? (
                  <Badge variant="success">Cuenta Activa</Badge>
                ) : (
                  <>
                    <Badge variant="neutral">{selectedContribuyenteId ? 'Sin Cuenta' : 'Sin seleccionar'}</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!selectedContribuyenteId || cuentaActivaQuery.isLoading || cuentaActivaQuery.isError || generarCodigoActivacionMut.isPending}
                      onClick={() => generarCodigoActivacionMut.mutate()}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      {generarCodigoActivacionMut.isPending ? 'Generando...' : 'Emitir PIN de Activación'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Código de activación generado en ventanilla */}
            {codigoActivacionGenerado && (
              <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-amber-700" />
                  PIN de Activación Asistida emitido para el ciudadano:
                </p>
                <p className="text-sm font-mono font-extrabold text-amber-950">
                  {codigoActivacionGenerado.codigo}
                </p>
                <p className="text-[11px] text-amber-800">
                  Entregue este código al ciudadano. Válido por 48 horas (vence:{' '}
                  {formatDate(codigoActivacionGenerado.expiracion)}). El ciudadano puede ingresar a{' '}
                  <strong>/portal/login</strong>, pestaña &quot;Activar mi cuenta&quot;, e ingresar su cédula,
                  este PIN y su contraseña personal.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <FormField label="Correo Electrónico">
                  <Input
                    value={contribuyenteActual?.correoElectronico ?? ''}
                    readOnly
                    className="bg-[#F8FAFC]"
                  />
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField label="Teléfono de Contacto">
                  <Input
                    value={contribuyenteActual?.telefono ?? ''}
                    readOnly
                    className="bg-[#F8FAFC]"
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DETALLES DEL TRÁMITE Y SLA ESTIMADO */}
          <div className="space-y-4 border-t border-[#E5E7EB] pt-6">
            <h3 className="text-sm font-bold text-[#171717]">2. Selección de Trámite y Finca</h3>
            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <FormField label="Tipo de Trámite Activo" required>
                  <Select
                    value={selectedTipoTramiteId}
                    onChange={(e) => setSelectedTipoTramiteId(Number(e.target.value))}
                  >
                    <option value={0}>— Seleccione un tipo de trámite —</option>
                    {(tiposTramiteQuery.data ?? []).map((t) => (
                      <option key={t.idTipoTramite} value={t.idTipoTramite}>
                        {t.nombreTramite}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="md:col-span-3">
                <div className="flex h-[42px] items-center justify-center gap-2 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 text-xs font-bold text-[#1E3A8A]" title="Plazo máximo en días naturales conforme a DATEADD(DAY, dias_max, GETDATE())">
                  <Clock className="h-4 w-4 text-[#1D4ED8]" />
                  {tipoTramiteActual ? `SLA: ${tipoTramiteActual.diasSlaMaximo} días naturales` : 'Seleccione un tipo de trámite'}
                </div>
              </div>

              <div className="md:col-span-5">
                <FormField label="Finca Relacionada (Inmueble)" required={tipoTramiteActual?.requiereInmueble === true}>
                  <Select
                    value={selectedInmuebleId}
                    onChange={(e) => setSelectedInmuebleId(e.target.value)}
                  >
                    <option value="">{tipoTramiteActual?.requiereInmueble ? '— Seleccione el inmueble obligatorio —' : '— Sin inmueble seleccionado —'}</option>
                    {(inmueblesContribuyenteQuery.data ?? []).map((inm) => (
                      <option key={inm.idInmueble} value={inm.idInmueble}>
                        Finca {inm.numeroFinca} · Plano {inm.planoCatastro} (
                        {formatCurrencyCRC(inm.valorFiscal)})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </div>

            {selectedInmuebleId && !inmuebleSeleccionadoEsPropio && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Advertencia de titularidad:</strong> El inmueble indicado no registra titularidad registral directa a nombre del solicitante en el padrón de derechos. Verifique representación legal autorizada o visado.
                </span>
              </div>
            )}
          </div>

          {tipoTramiteActual && tipoTramiteActual.requiereInmueble == null && <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">La regla de inmueble está pendiente. Un administrador debe definirla en Catálogo de Trámites antes de radicar.</p>}
          {/* SECCIÓN 3: REQUISITOS DEL TRÁMITE */}
          <div className="space-y-3 border-t border-[#E5E7EB] pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#171717]">
                3. Requisitos del Catálogo — {tipoTramiteActual?.nombreTramite ?? 'Procedimiento'}
              </h3>
              <span className="text-xs text-[#6B7280]">
                Departamento competente: <strong>{tipoTramiteActual?.nombreDepartamento ?? 'Municipal'}</strong>
              </span>
            </div>

            <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              {(requisitosQuery.data ?? []).length === 0 ? (
                <p className="text-xs text-[#6B7280]">
                  {!selectedTipoTramiteId ? 'Seleccione un tipo de trámite para consultar sus requisitos.' : requisitosQuery.isLoading ? 'Consultando requisitos...' : requisitosQuery.isError ? 'No se pudieron consultar los requisitos.' : 'Este tipo de trámite no exige requisitos adicionales en catálogo.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(requisitosQuery.data ?? []).map((req) => (
                    <div
                      key={req.idRequisito}
                      className="flex items-center justify-between rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs"
                    >
                      <span className="font-semibold text-[#171717]">— {req.nombreRequisito}</span>
                      <Badge variant={req.esObligatorio ? 'success' : 'neutral'}>
                        {req.esObligatorio ? 'OBLIGATORIO' : 'OPCIONAL'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 4: DOCUMENTACIÓN ADJUNTA */}
          <div className="space-y-4 border-t border-[#E5E7EB] pt-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className="text-sm font-bold text-[#171717]">4. Carga de Documentación Inicial</h3>

            </div>

            <input ref={planoInputRef} type="file" accept=".pdf" className="hidden"
              onChange={(e) => { handleSeleccionarArchivos(e.target.files, true); e.target.value = ''; }} />
            <input ref={documentosInputRef} type="file" accept=".pdf,.jpg,.jpeg" multiple className="hidden"
              onChange={(e) => { handleSeleccionarArchivos(e.target.files); e.target.value = ''; }} />
            {expedienteCreado && stagedDocs.length > 0 && (
              <Button variant="secondary" onClick={async () => {
                const fallidos: StagedDocument[] = [];
                for (const doc of stagedDocs) {
                  try { await tramiteApi.adjuntarArchivo(expedienteCreado.idTramite, doc.archivo); }
                  catch { fallidos.push(doc); }
                }
                setStagedDocs(fallidos);
                if (fallidos.length) toast.error('Algunos archivos siguen pendientes.');
                else toast.success('Archivos adjuntados al expediente existente.');
              }}>Reintentar archivos pendientes</Button>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => planoInputRef.current?.click()}
                className="flex items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-[#93C5FD] bg-[#EFF6FF]/50 p-5 text-left transition-colors hover:bg-[#EFF6FF]"
              >
                <Upload className="h-6 w-6 shrink-0 text-[#1D4ED8]" />
                <div>
                  <p className="text-xs font-bold text-[#171717]">
                    Subir Plano Catastrado (PDF)
                  </p>
                  <p className="text-[11px] text-[#4B5563]">
                    Cargar plano o croquis georreferenciado
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => documentosInputRef.current?.click()}
                className="flex items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-[#93C5FD] bg-[#EFF6FF]/50 p-5 text-left transition-colors hover:bg-[#EFF6FF]"
              >
                <Upload className="h-6 w-6 shrink-0 text-[#1D4ED8]" />
                <div>
                  <p className="text-xs font-bold text-[#171717]">
                    Subir Documentos Complementarios (PDF, JPG)
                  </p>
                  <p className="text-[11px] text-[#4B5563]">
                    Certificaciones, personerías o requisitos adicionales
                  </p>
                </div>
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-[#171717]">Archivos Preparados para Radicación</p>
              <div className="overflow-x-auto rounded-[10px] border border-[#E5E7EB]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] font-bold uppercase text-[#4B5563]">
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Archivo</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Tamaño</th>
                      <th className="px-4 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {stagedDocs.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-500">No hay archivos preparados.</td></tr>
                    )}
                    {stagedDocs.map((doc, idx) => (
                      <tr key={doc.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-2.5 font-mono font-bold">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-[#171717]">
                          {doc.nombreArchivo}
                        </td>
                        <td className="px-4 py-2.5">{doc.tipo}</td>
                        <td className="px-4 py-2.5">{doc.tamanoTexto}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="success">Preparado</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <DocumentPreviewButton nombre={doc.nombreArchivo} obtenerArchivo={async () => doc.archivo} />
                          <button
                            type="button"
                            onClick={() =>
                              setStagedDocs((prev) => prev.filter((x) => x.id !== doc.id))
                            }
                            className="inline-flex items-center gap-1 font-semibold text-[#DC2626] hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <FormField label="Observaciones de Radicación Inicial (Asentadas en Historial)">
              <Textarea
                placeholder="Observación de ingreso en ventanilla única municipal..."
                value={observacionInicial}
                maxLength={255}
                onChange={(e) => setObservacionInicial(e.target.value)}
              />
            </FormField>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-4">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  disabled={radicarExpedienteMut.isPending || !contribuyenteActual || !tipoTramiteActual || tipoTramiteActual.requiereInmueble == null || (tipoTramiteActual.requiereInmueble && !selectedInmuebleId) || !!expedienteCreado}
                  onClick={() => radicarExpedienteMut.mutate()}
                >
                  <FilePlus2 className="h-4 w-4" />
                  {radicarExpedienteMut.isPending ? 'Radicando...' : 'RADICAR EXPEDIENTE'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setObservacionInicial('');
                    toast.info('Formulario restablecido.');
                  }}
                >
                  Cancelar
                </Button>
              </div>

              {expedienteCreado ? (
                <Button asChild>
                  <Link to={`/tramites/revision?id=${expedienteCreado.idTramite}`}>
                    Siguiente Paso: Ir a Revisión y Cotejo (Paso 2)
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="secondary" asChild>
                  <Link to="/tramites/revision">
                    Ver Expedientes en Revisión <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL: REGISTRO RÁPIDO DE CONTRIBUYENTE (CU-01) */}
      <Modal
        open={openNuevoContribuyenteModal}
        onClose={() => setOpenNuevoContribuyenteModal(false)}
        title="Registrar Nuevo Contribuyente en Padrón (CU-01)"
        description="Si el ciudadano no figura en el padrón, regístrelo para continuar la radicación sin duplicados."
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={tipoPersonaNuevo === 'FISICO' ? 'default' : 'outline'}
              onClick={() => setTipoPersonaNuevo('FISICO')}
            >
              Persona Física
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tipoPersonaNuevo === 'JURIDICO' ? 'default' : 'outline'}
              onClick={() => setTipoPersonaNuevo('JURIDICO')}
            >
              Persona Jurídica
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Número de Cédula" required>
              <Input
                value={cedulaNuevo}
                onChange={(e) => setCedulaNuevo(e.target.value)}
                placeholder="Ej. 5-0123-0456"
              />
            </FormField>
            <FormField label={tipoPersonaNuevo === 'FISICO' ? 'Nombre' : 'Razón Social'} required>
              <Input
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Nombre oficial"
              />
            </FormField>
          </div>

          {tipoPersonaNuevo === 'FISICO' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Primer Apellido" required>
                <Input
                  value={apellido1Nuevo}
                  onChange={(e) => setApellido1Nuevo(e.target.value)}
                  placeholder="Primer apellido"
                />
              </FormField>
              <FormField label="Segundo Apellido">
                <Input
                  value={apellido2Nuevo}
                  onChange={(e) => setApellido2Nuevo(e.target.value)}
                  placeholder="Segundo apellido"
                />
              </FormField>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Correo Electrónico">
              <Input
                type="email"
                value={correoNuevo}
                onChange={(e) => setCorreoNuevo(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </FormField>
            <FormField label="Teléfono">
              <Input
                value={telefonoNuevo}
                onChange={(e) => setTelefonoNuevo(e.target.value)}
                placeholder="8888-8888"
              />
            </FormField>
          </div>

          <FormField label="Dirección para Notificaciones">
            <Input
              value={direccionNuevo}
              onChange={(e) => setDireccionNuevo(e.target.value)}
              placeholder="Dirección exacta en Nicoya"
            />
          </FormField>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenNuevoContribuyenteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={registrarContribuyenteMut.isPending || !cedulaNuevo.trim() || !nombreNuevo.trim()}
              onClick={() => registrarContribuyenteMut.mutate()}
            >
              {registrarContribuyenteMut.isPending ? 'Guardando...' : 'Guardar y Continuar Radicación'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: COMPROBANTE OFICIAL DE RADICACIÓN (PASO 8) */}
      <Modal
        open={openComprobanteModal}
        onClose={() => setOpenComprobanteModal(false)}
        title="Comprobante Oficial de Radicación de Trámite"
        description="Constancia de presentación oficial en Ventanilla Única Municipal de Nicoya."
        maxWidth="max-w-2xl"
      >
        {expedienteCreado && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-xs space-y-4 print:border-none print:p-0">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <img src="/images/escudo-nicoya.jpg" alt="" className="h-12 w-12 object-contain" />
                  <div>
                    <h2 className="text-base font-extrabold text-[#1E3A8A]">
                      MUNICIPALIDAD DE NICOYA
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      Departamento de Gestión de Trámites y Ventanilla Única
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="blue" className="text-xs font-mono">
                    {expedienteCreado.numeroExpediente}
                  </Badge>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    ID Registro: #{expedienteCreado.idTramite}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-[#64748B]">Solicitante / Contribuyente:</p>
                  <p className="font-bold text-[#0F172A] text-sm">
                    {contribuyenteActual?.nombreCompletoORazonSocial}
                  </p>
                  <p className="font-mono text-[#475569]">
                    Cédula: {contribuyenteActual?.identificacion}
                  </p>
                  <p className="text-[#64748B]">
                    Correo: {contribuyenteActual?.correoElectronico || 'No registrado'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#64748B]">Trámite Solicitado:</p>
                  <p className="font-bold text-[#0F172A] text-sm">
                    {tipoTramiteActual?.nombreTramite}
                  </p>
                  <p className="text-[#64748B]">
                    Departamento: {tipoTramiteActual?.nombreDepartamento}
                  </p>
                  <p className="text-[#64748B]">
                    Finca: {(inmueblesContribuyenteQuery.data ?? []).find(i => String(i.idInmueble) === selectedInmuebleId)?.numeroFinca || 'No aplica'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-b py-3 text-xs bg-slate-50 p-3 rounded-lg">
                <div>
                  <p className="font-semibold text-[#64748B]">Fecha de Radicación:</p>
                  <p className="font-bold text-[#0F172A]">{formatDate(new Date())}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#64748B]">Plazo estimado de atención:</p>
                  <p className="font-bold text-[#0F172A]">
                    {tipoTramiteActual?.diasSlaMaximo ?? 10} días naturales
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#64748B]">Funcionario Receptor:</p>
                  <p className="font-bold text-[#0F172A]">
                    {session?.nombreCompleto || session?.userName || 'Ventanilla'}
                  </p>
                </div>
              </div>

              {/* Información sobre seguimiento y portal */}
              <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-700" />
                  Consulta y seguimiento ciudadano:
                </p>
                <p>
                  El ciudadano puede consultar el estado de su expediente ingresando al Portal Ciudadano en{' '}
                  <strong>/portal</strong> con su cédula.
                </p>
                {codigoActivacionGenerado && (
                  <p className="font-bold text-amber-900 mt-1">
                    PIN de activación asistida: {codigoActivacionGenerado.codigo} (Válido por 48h)
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" /> Imprimir Comprobante
              </Button>
              <Button
                type="button"
                onClick={() => setOpenComprobanteModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
