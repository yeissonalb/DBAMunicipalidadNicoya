import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Building2,
  Check,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  Lock,
  Receipt,
  Search,
  ShieldCheck,
  Smartphone,
  Upload,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { normalizeRoleName, ROLES } from '@/features/auth/permissions';
import { consultarCedulaHacienda, type HaciendaContribuyenteInfo } from '@/services/haciendaCedulaApi';
import {
  contribuyenteApi,
  facturacionPagoApi,
  inmuebleApi,
  tipoTramiteApi,
  tramiteApi,
  tributoDeudaApi,
} from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/forms/FormField';
import { formatCurrencyCRC, formatDate } from '@/lib/utils';

const STEPPER_STAGES = [
  { key: 'RAD', label: 'Radicado' },
  { key: 'REV', label: 'Revisión Técnica' },
  { key: 'INSP', label: 'Inspección' },
  { key: 'RES', label: 'Resolución' },
];

function getStageIndex(estado: string | undefined): number {
  const u = (estado || '').toUpperCase();
  if (u.includes('APR') || u.includes('RES') || u.includes('FIN') || u.includes('RECH')) return 3;
  if (u.includes('INSP') || u.includes('CAMP')) return 2;
  if (u.includes('REV') || u.includes('TEC') || u.includes('ANA') || u.includes('SUB')) return 1;
  return 0;
}

export function PortalCiudadanoPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const userRoles = session?.roles ?? [];
  const isCitizen = useMemo(() => {
    const roles = userRoles.map(normalizeRoleName);
    return (
      roles.includes(ROLES.CIUDADANO) &&
      !roles.includes(ROLES.ADMIN) &&
      !roles.includes(ROLES.DBA)
    );
  }, [userRoles]);

  const [activeTab, setActiveTab] = useState<
    'resumen' | 'inmuebles' | 'estado-cuenta' | 'requisitos'
  >('resumen');

  // Búsqueda y selección de contribuyente (por defecto ID 1 o por cédula)
  const [selectedContribuyenteId, setSelectedContribuyenteId] = useState<number>(1);
  const [cedulaFiltro, setCedulaFiltro] = useState<string>('');
  const [selectedTramiteId, setSelectedTramiteId] = useState<number>(1);
  const [selectedTipoTramiteReq, setSelectedTipoTramiteReq] = useState<number>(1);

  // Información oficial en tiempo real desde el Ministerio de Hacienda (API Cédulas)
  const [haciendaInfo, setHaciendaInfo] = useState<HaciendaContribuyenteInfo | null>(null);

  // Modales interactivos del Portal Ciudadano
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [nombreArchivoSubir, setNombreArchivoSubir] = useState('requisito_pendiente_firmado.pdf');
  const [openSinpeModal, setOpenSinpeModal] = useState(false);
  const [telefonoSinpe, setTelefonoSinpe] = useState('8888-1234');
  const [comprobanteSinpe, setComprobanteSinpe] = useState(
    `SINPE-${Math.floor(100000 + Math.random() * 900000)}`
  );

  const padronQuery = useQuery({
    queryKey: ['portal-ciudadano', 'padron'],
    queryFn: () => contribuyenteApi.padron(),
  });

  // Aislamiento de datos: si el usuario autenticado es Ciudadano, vincular automáticamente a su perfil
  useEffect(() => {
    if (!isCitizen || !padronQuery.data || padronQuery.data.length === 0) return;
    const loginUser = (session?.userName || '').toLowerCase();
    const cleanUserCed = loginUser.replace(/\D/g, '');

    const matched = padronQuery.data.find((p) => {
      const pClean = (p.identificacion || '').replace(/\D/g, '');
      return (
        (cleanUserCed && pClean && pClean === cleanUserCed) ||
        (p.correoElectronico && p.correoElectronico.toLowerCase() === loginUser) ||
        (session?.nombreFuncionario &&
          p.nombreCompletoORazonSocial
            .toLowerCase()
            .includes(session.nombreFuncionario.toLowerCase()))
      );
    });

    if (matched && matched.idContribuyente !== selectedContribuyenteId) {
      setSelectedContribuyenteId(matched.idContribuyente);
    }
  }, [isCitizen, padronQuery.data, session, selectedContribuyenteId]);

  const contribuyenteDetalleQuery = useQuery({
    queryKey: ['portal-ciudadano', 'contribuyente', selectedContribuyenteId],
    queryFn: () => contribuyenteApi.consultar(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  const deudasQuery = useQuery({
    queryKey: ['portal-ciudadano', 'deudas', selectedContribuyenteId],
    queryFn: () => tributoDeudaApi.deudasContribuyente(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  const estadoCuentaQuery = useQuery({
    queryKey: ['portal-ciudadano', 'estado-cuenta', selectedContribuyenteId],
    queryFn: () => facturacionPagoApi.estadoCuentaContribuyente(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  const inmueblesQuery = useQuery({
    queryKey: ['portal-ciudadano', 'inmuebles', selectedContribuyenteId],
    queryFn: () => inmuebleApi.porContribuyente(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  // Consultar únicamente los trámites de este contribuyente
  const tramitesContribuyenteQuery = useQuery({
    queryKey: ['portal-ciudadano', 'tramites-por-contribuyente', selectedContribuyenteId],
    queryFn: () => tramiteApi.porContribuyente(selectedContribuyenteId),
    enabled: selectedContribuyenteId > 0,
  });

  const tramitesContribuyenteList = tramitesContribuyenteQuery.data ?? [];

  // Sincronizar el trámite activo con el primero de su lista si existe
  useEffect(() => {
    if (tramitesContribuyenteList.length > 0) {
      const first = tramitesContribuyenteList[0];
      if (first.idTramite && first.idTramite !== selectedTramiteId) {
        setSelectedTramiteId(first.idTramite);
      }
    }
  }, [tramitesContribuyenteList, selectedTramiteId]);

  const tramiteActivoQuery = useQuery({
    queryKey: ['portal-ciudadano', 'tramite', selectedTramiteId],
    queryFn: () => tramiteApi.consultar(selectedTramiteId),
    enabled: selectedTramiteId > 0,
  });

  const tiposTramiteQuery = useQuery({
    queryKey: ['portal-ciudadano', 'tipos-tramite'],
    queryFn: () => tipoTramiteApi.listar(),
  });

  const requisitosTipoQuery = useQuery({
    queryKey: ['portal-ciudadano', 'requisitos-tipo', selectedTipoTramiteReq],
    queryFn: () => tipoTramiteApi.requisitos(selectedTipoTramiteReq),
    enabled: selectedTipoTramiteReq > 0,
  });

  const contribuyenteActual = useMemo(() => {
    const fromDet = contribuyenteDetalleQuery.data?.[0];
    if (fromDet) return fromDet;
    const fromPadron = (padronQuery.data ?? []).find(
      (p) => p.idContribuyente === selectedContribuyenteId
    );
    if (fromPadron) {
      return {
        idContribuyente: fromPadron.idContribuyente,
        identificacion: fromPadron.identificacion,
        nombreCompleto: fromPadron.nombreCompletoORazonSocial,
        correoElectronico: fromPadron.correoElectronico,
        telefono: fromPadron.telefono,
        distrito: fromPadron.nombreDistrito,
      };
    }
    return {
      idContribuyente: 1,
      identificacion: '5-0857-0485',
      nombreCompleto: 'Carlos Ruiz G.',
      correoElectronico: 'carlos.ruiz@correo.cr',
      telefono: '8888-0485',
      distrito: 'Nicoya',
    };
  }, [contribuyenteDetalleQuery.data, padronQuery.data, selectedContribuyenteId]);

  // Consulta automática y no invasiva a la API de Hacienda con la cédula del contribuyente activo
  useEffect(() => {
    const idNum = contribuyenteActual?.identificacion;
    if (!idNum) return;
    const clean = idNum.replace(/\D/g, '');
    if (clean.length >= 9) {
      consultarCedulaHacienda(clean)
        .then((info) => setHaciendaInfo(info))
        .catch(() => setHaciendaInfo(null));
    }
  }, [contribuyenteActual?.identificacion]);

  const tramiteActual = tramiteActivoQuery.data?.[0] ?? {
    idTramite: selectedTramiteId,
    numeroExpediente: `EXP-NIC-2026-${String(selectedTramiteId).padStart(4, '0')}`,
    nombreTramite: 'Permiso de Construcción',
    estadoActual: 'En Revisión Técnica',
    fechaSolicitud: new Date().toISOString(),
    diasSlaMaximo: 15,
    numeroFinca: '5-123456-000',
  };

  const activeStageIdx = getStageIndex(tramiteActual.estadoActual);

  const deudasPendientes = useMemo(() => {
    const list = deudasQuery.data ?? [];
    return list.filter((d) => d.codigoEstadoDeuda !== 'PAG');
  }, [deudasQuery.data]);

  const saldoTotalPorPagar = useMemo(() => {
    if (deudasPendientes.length > 0) {
      return deudasPendientes.reduce((acc, d) => acc + (d.montoTotal ?? 0), 0);
    }
    return 45000;
  }, [deudasPendientes]);

  const claveFacturaHacienda = useMemo(() => {
    const conClave = (estadoCuentaQuery.data ?? []).find((x) => x.claveNumericaHacienda);
    if (conClave?.claveNumericaHacienda) return conClave.claveNumericaHacienda;
    return '50631102600301014200000001000020260234056719928374';
  }, [estadoCuentaQuery.data]);

  const handleBuscarPorCedula = () => {
    if (!cedulaFiltro.trim()) return;
    const q = cedulaFiltro.trim().toLowerCase();
    const match = (padronQuery.data ?? []).find(
      (c) =>
        c.identificacion.toLowerCase().includes(q) ||
        c.nombreCompletoORazonSocial.toLowerCase().includes(q)
    );
    if (match) {
      setSelectedContribuyenteId(match.idContribuyente);
      toast.success(`Perfil ciudadano cargado: ${match.nombreCompletoORazonSocial}`);
    } else {
      toast.info('No se encontró coincidencia exacta en el padrón; seleccione de la lista.');
    }
  };

  const subirDocumentoMut = useMutation({
    mutationFn: () =>
      tramiteApi.adjuntarDocumento(tramiteActual.idTramite, {
        nombreArchivo: nombreArchivoSubir.trim(),
        rutaAlmacenamiento: `/storage/portal_ciudadano/${tramiteActual.numeroExpediente}/${nombreArchivoSubir.trim()}`,
        tipoMime: 'application/pdf',
        tamanoBytes: 425984,
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Requisito adjuntado exitosamente al expediente.');
      setOpenUploadModal(false);
      queryClient.invalidateQueries({ queryKey: ['portal-ciudadano'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleDescargarComprobantePdf = () => {
    const contenido = [
      '===================================================================',
      '               MUNICIPALIDAD DE NICOYA — SIGEMUN 2026              ',
      '         COMPROBANTE OFICIAL DE TRÁMITE EN PORTAL CIUDADANO        ',
      '===================================================================',
      `Fecha de emisión   : ${formatDate(new Date())}`,
      `Contribuyente      : ${contribuyenteActual.nombreCompleto}`,
      `Cédula / ID        : ${contribuyenteActual.identificacion}`,
      `Expediente         : ${tramiteActual.numeroExpediente}`,
      `Procedimiento      : ${tramiteActual.nombreTramite}`,
      `Estado Actual      : ${tramiteActual.estadoActual}`,
      `Finca Relacionada  : ${tramiteActual.numeroFinca || 'No aplica'}`,
      '===================================================================',
      'De la Patria por Nuestra Voluntad — Gobierno Local de Nicoya',
    ].join('\r\n');

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comprobante_${tramiteActual.numeroExpediente}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Comprobante descargado: ${tramiteActual.numeroExpediente}`);
  };

  const pagarSinpeMut = useMutation({
    mutationFn: async () => {
      const res = await facturacionPagoApi.registrarPago({
        idContribuyente: contribuyenteActual.idContribuyente,
        idMedioPago: 3, // SINPE Móvil
        montoTotalPagado: saldoTotalPorPagar,
        comprobante: comprobanteSinpe.trim(),
      });
      return res.data;
    },
    onSuccess: (idPago) => {
      toast.success(
        `Pago en línea por SINPE Móvil registrado exitosamente (Recibo #${idPago}).`
      );
      setOpenSinpeModal(false);
      queryClient.invalidateQueries({ queryKey: ['portal-ciudadano'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      {/* CABECERA OFICIAL DEL WIREFRAME: PORTAL CIUDADANO EN LÍNEA */}
      <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-card">
        <div className="flex flex-col justify-between gap-4 border-b border-[#E5E7EB] bg-white px-6 py-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <img
              src="/images/escudo-nicoya.jpg"
              alt="Escudo Municipalidad de Nicoya"
              className="h-14 w-14 rounded-full border border-[#D1D5DB] bg-white object-contain p-1"
            />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#171717] sm:text-2xl">
                PORTAL CIUDADANO EN LÍNEA
              </h1>
              <p className="text-sm font-medium text-[#4B5563]">
                Oficina virtual municipal · Municipalidad de Nicoya
              </p>
            </div>
          </div>

          {/* Tarjeta del Contribuyente Activo (Esquina superior derecha del Wireframe 1) */}
          <div className="flex items-center gap-3 rounded-[12px] border border-[#D1D5DB] bg-[#F8FAFC] px-4 py-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-xs font-bold text-white">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#171717]">
                {contribuyenteActual.nombreCompleto}
              </p>
              <p className="font-mono text-xs font-semibold text-[#4B5563]">
                Cédula: {contribuyenteActual.identificacion}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de bienvenida, selector de contribuyente y pestañas del Portal */}
        <div className="flex flex-col justify-between gap-4 bg-[#F8FAFC] px-6 py-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-[#171717]">¡Bienvenido contribuyente!</h2>
            <div className="mt-2 flex flex-wrap gap-2" role="tablist">
              {[
                { id: 'resumen', label: 'Mis Trámites' },
                { id: 'inmuebles', label: 'Mis Inmuebles' },
                { id: 'estado-cuenta', label: 'Estado de Cuenta y Facturas' },
                { id: 'requisitos', label: 'Consultar Requisitos de Trámites' },
              ].map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(t.id as typeof activeTab)}
                    className={`rounded-[10px] px-3.5 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#171717] text-white'
                        : 'border border-[#D1D5DB] bg-white text-[#171717] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Identificación del perfil del ciudadano o selector de funcionario */}
          {isCitizen ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-2 text-xs font-semibold text-[#1E3A8A]">
              <ShieldCheck className="h-4 w-4 text-[#1D4ED8]" />
              <span>
                Contribuyente Autenticado:{' '}
                <strong>{contribuyenteActual.nombreCompleto}</strong> (ID{' '}
                {contribuyenteActual.identificacion})
              </span>
              {haciendaInfo && (
                <Badge variant={haciendaInfo.moroso ? 'danger' : 'success'}>
                  Hacienda: {haciendaInfo.estadoTributario}{' '}
                  {haciendaInfo.moroso ? '· MOROSO' : '· AL DÍA'}
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-48">
                <Input
                  placeholder="Buscar por cédula..."
                  value={cedulaFiltro}
                  onChange={(e) => setCedulaFiltro(e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={handleBuscarPorCedula}>
                <Search className="h-4 w-4" /> Consultar
              </Button>
              {padronQuery.data && padronQuery.data.length > 0 && (
                <div className="w-60">
                  <Select
                    value={selectedContribuyenteId}
                    onChange={(e) => setSelectedContribuyenteId(Number(e.target.value))}
                  >
                    {padronQuery.data.map((p) => (
                      <option key={p.idContribuyente} value={p.idContribuyente}>
                        {p.identificacion} — {p.nombreCompletoORazonSocial}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VISTA 1 (WIREFRAME PRINCIPAL): MIS TRÁMITES EN CURSO + ESTADO DE CUENTA Y TRIBUTOS */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Tarjeta Izquierda (7 cols): Mi trámite en Curso */}
          <Card className="lg:col-span-7">
            <CardHeader className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-lg">Mi trámite en Curso</CardTitle>
                <CardDescription>
                  Seguimiento en tiempo real de las etapas de su solicitud municipal
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#4B5563]">Expediente</span>
                {tramitesContribuyenteList.length > 1 ? (
                  <div className="min-w-[210px]">
                    <Select
                      value={selectedTramiteId}
                      onChange={(e) => setSelectedTramiteId(Number(e.target.value))}
                    >
                      {tramitesContribuyenteList.map((tr) => (
                        <option key={tr.idTramite} value={tr.idTramite}>
                          {tr.numeroExpediente} — {tr.nombreTramite}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <Badge variant="blue">{tramiteActual.numeroExpediente}</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <div>
                  <p className="font-mono text-xs font-bold uppercase text-[#1D4ED8]">
                    Expediente : {tramiteActual.numeroExpediente}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-[#171717]">
                    {tramiteActual.nombreTramite}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#4B5563]">
                    Fecha de radicación: {formatDate(tramiteActual.fechaSolicitud)} · Plazo SLA:{' '}
                    {tramiteActual.diasSlaMaximo} días hábiles
                  </p>
                </div>
                <Badge
                  variant={
                    tramiteActual.estadoActual.toUpperCase().includes('APR')
                      ? 'success'
                      : tramiteActual.estadoActual.toUpperCase().includes('RECH')
                      ? 'danger'
                      : 'blue'
                  }
                >
                  {tramiteActual.estadoActual.toUpperCase().includes('APR')
                    ? 'Estado: Finalizado (Aprobado)'
                    : tramiteActual.estadoActual.toUpperCase().includes('RECH')
                    ? 'Estado: Finalizado (Rechazado)'
                    : `Estado: ${tramiteActual.estadoActual}`}
                </Badge>
              </div>

              {/* Barra de Progreso Horizontal de 4 Etapas (Exacta al Wireframe) */}
              <div className="py-4">
                <div className="relative flex items-center justify-between">
                  {/* Línea conectora de fondo */}
                  <div className="absolute left-6 right-6 top-5 h-0.5 bg-[#D1D5DB]" />
                  <div
                    className="absolute left-6 top-5 h-0.5 bg-[#1D4ED8] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (activeStageIdx / (STEPPER_STAGES.length - 1)) * 88)}%`,
                    }}
                  />

                  {STEPPER_STAGES.map((st, idx) => {
                    const completed = idx <= activeStageIdx;
                    const isCurrent = idx === activeStageIdx;
                    return (
                      <div
                        key={st.key}
                        className="relative z-10 flex flex-col items-center text-center"
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                            completed
                              ? 'border-[#171717] bg-[#171717] text-white'
                              : 'border-[#D1D5DB] bg-white text-[#6B7280]'
                          } ${isCurrent ? 'ring-4 ring-[#1D4ED8]/20' : ''}`}
                        >
                          {completed ? <Check className="h-5 w-5" /> : idx + 1}
                        </div>
                        <span
                          className={`mt-2.5 max-w-[110px] text-xs font-semibold ${
                            completed ? 'text-[#171717]' : 'text-[#6B7280]'
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botones inferiores del Wireframe: Descargar Comprobante PDF | Subir Requisito Faltante */}
              <div className="flex flex-col gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleDescargarComprobantePdf}
                >
                  <Download className="h-4 w-4" />
                  Descargar Comprobante PDF
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => setOpenUploadModal(true)}
                >
                  <Upload className="h-4 w-4" />
                  Subir Requisito Faltante
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta Derecha (5 cols): Estado de Cuenta y Tributos */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-lg">Estado de Cuenta y Tributos</CardTitle>
              <CardDescription>
                Resumen de obligaciones municipales y comprobante electrónico
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                  Saldo por Pagar
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#171717]">
                  {formatCurrencyCRC(saldoTotalPorPagar)}
                </p>
              </div>

              {/* Desglose de tributos pendientes */}
              <div className="space-y-2.5 border-b border-[#E5E7EB] pb-4 text-sm">
                {deudasPendientes.length > 0 ? (
                  deudasPendientes.slice(0, 4).map((d) => (
                    <div
                      key={d.idDeudaMunicipal}
                      className="flex items-center justify-between py-1"
                    >
                      <div>
                        <span className="font-semibold text-[#171717]">{d.nombreTributo}</span>
                        <span className="ml-2 text-xs text-[#6B7280]">({d.periodoDeuda})</span>
                      </div>
                      <span className="font-mono font-bold text-[#171717]">
                        {formatCurrencyCRC(d.montoTotal)}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between py-1">
                      <span className="font-medium text-[#171717]">Recolección de Basura</span>
                      <span className="font-mono font-bold text-[#171717]">
                        {formatCurrencyCRC(28500)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="font-medium text-[#171717]">Bienes Inmuebles</span>
                      <span className="font-mono font-bold text-[#171717]">
                        {formatCurrencyCRC(16500)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Clave numérica Hacienda */}
              <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-3.5">
                <p className="text-xs font-bold text-[#171717]">
                  Factura Electrónica Hacienda key:
                </p>
                <p className="mt-1 break-all font-mono text-xs text-[#4B5563]">
                  Key: {claveFacturaHacienda}
                </p>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => setOpenSinpeModal(true)}
              >
                <Smartphone className="h-4 w-4" />
                Pagar en Línea (SINPE Móvil)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VISTA 2: MIS INMUEBLES */}
      {activeTab === 'inmuebles' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#1D4ED8]" /> Mis Bienes Inmuebles Inscritos
            </CardTitle>
            <CardDescription>
              Propiedades asociadas a la cédula {contribuyenteActual.identificacion} en el Catastro
              Municipal de Nicoya
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                    <th className="px-4 py-3.5">Número de Finca</th>
                    <th className="px-4 py-3.5">Plano Catastro</th>
                    <th className="px-4 py-3.5">Distrito</th>
                    <th className="px-4 py-3.5">Uso / Zona</th>
                    <th className="px-4 py-3.5">Área (m²)</th>
                    <th className="px-4 py-3.5">Valor Fiscal</th>
                    <th className="px-4 py-3.5">% Participación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {(inmueblesQuery.data ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#6B7280]">
                        No se registran propiedades asociadas a este contribuyente.
                      </td>
                    </tr>
                  ) : (
                    (inmueblesQuery.data ?? []).map((inm) => (
                      <tr key={inm.idInmueble} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#1E3A8A]">
                          {inm.numeroFinca}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs">{inm.planoCatastro}</td>
                        <td className="px-4 py-3.5">{inm.nombreDistrito}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant="blue">{inm.descripcionUso}</Badge>
                        </td>
                        <td className="px-4 py-3.5">{inm.areaMetros} m²</td>
                        <td className="px-4 py-3.5 font-semibold">
                          {formatCurrencyCRC(inm.valorFiscal)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#15803D]">
                          {inm.porcentajeParticipacion}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VISTA 3: ESTADO DE CUENTA Y FACTURAS DETALLADO */}
      {activeTab === 'estado-cuenta' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#1D4ED8]" /> Detalle de Deudas y Facturas Electrónicas
            </CardTitle>
            <CardDescription>
              Consulte los periodos pendientes, fechas de vencimiento (dd/MM/yyyy) e intereses.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                    <th className="px-4 py-3.5">Tributo</th>
                    <th className="px-4 py-3.5">Periodo</th>
                    <th className="px-4 py-3.5">Finca</th>
                    <th className="px-4 py-3.5">Vencimiento</th>
                    <th className="px-4 py-3.5">Principal</th>
                    <th className="px-4 py-3.5">Intereses / Multas</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-4 py-3.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {(deudasQuery.data ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-xs text-[#6B7280]">
                        El contribuyente se encuentra al día con sus obligaciones municipales.
                      </td>
                    </tr>
                  ) : (
                    (deudasQuery.data ?? []).map((d) => (
                      <tr key={d.idDeudaMunicipal} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3.5 font-semibold text-[#171717]">
                          {d.nombreTributo}
                        </td>
                        <td className="px-4 py-3.5">{d.periodoDeuda}</td>
                        <td className="px-4 py-3.5 font-mono text-xs">{d.numeroFinca}</td>
                        <td className="px-4 py-3.5">{formatDate(d.fechaDeVencimiento)}</td>
                        <td className="px-4 py-3.5">{formatCurrencyCRC(d.montoPrincipal)}</td>
                        <td className="px-4 py-3.5 text-[#B45309]">
                          {formatCurrencyCRC((d.montoIntereses ?? 0) + (d.montoMultas ?? 0))}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#171717]">
                          {formatCurrencyCRC(d.montoTotal)}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              d.codigoEstadoDeuda === 'PAG'
                                ? 'success'
                                : d.codigoEstadoDeuda === 'VENC'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {d.codigoEstadoDeuda}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VISTA 4: CONSULTA DE REQUISITOS POR TIPO DE TRÁMITE */}
      {activeTab === 'requisitos' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#1D4ED8]" /> Seleccione el Trámite a Consultar
              </CardTitle>
              <CardDescription>
                Consulte qué requisitos documentales necesita antes de acudir o presentar su
                solicitud.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Procedimiento Municipal">
                <Select
                  value={selectedTipoTramiteReq}
                  onChange={(e) => setSelectedTipoTramiteReq(Number(e.target.value))}
                >
                  {(tiposTramiteQuery.data ?? []).map((tt) => (
                    <option key={tt.idTipoTramite} value={tt.idTipoTramite}>
                      {tt.nombreTramite} (SLA: {tt.diasSlaMaximo} días)
                    </option>
                  ))}
                </Select>
              </FormField>

              {tiposTramiteQuery.data
                ?.filter((tt) => tt.idTipoTramite === selectedTipoTramiteReq)
                .map((tt) => (
                  <div
                    key={tt.idTipoTramite}
                    className="rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#171717]">{tt.nombreTramite}</span>
                      <Badge variant="blue">SLA Máximo: {tt.diasSlaMaximo} días hábiles</Badge>
                    </div>
                    <p className="text-[#4B5563]">{tt.descripcion}</p>
                    <p className="font-semibold text-[#1E3A8A]">
                      Departamento responsable: {tt.nombreDepartamento}
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-[#15803D]" /> Requisitos Oficiales del Trámite
              </CardTitle>
              <CardDescription>
                Documentos exigidos por la Municipalidad de Nicoya según el catálogo oficial
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(requisitosTipoQuery.data ?? []).length === 0 ? (
                <p className="text-xs text-[#6B7280]">
                  Seleccione un tipo de trámite para visualizar sus requisitos obligatorios y
                  opcionales.
                </p>
              ) : (
                <div className="space-y-3">
                  {(requisitosTipoQuery.data ?? []).map((req, idx) => (
                    <div
                      key={req.idRequisito}
                      className="flex items-center justify-between rounded-[10px] border border-[#E5E7EB] bg-white p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-bold text-[#1E3A8A]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#171717]">
                            {req.nombreRequisito}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            Formato aceptado: PDF digital o copia certificada en ventanilla
                          </p>
                        </div>
                      </div>
                      <Badge variant={req.esObligatorio ? 'success' : 'neutral'}>
                        {req.esObligatorio ? 'REQUERIDO' : 'OPCIONAL'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: SUBIR REQUISITO FALTANTE */}
      <Modal
        open={openUploadModal}
        onClose={() => setOpenUploadModal(false)}
        title={`Subir Requisito Faltante — ${tramiteActual.numeroExpediente}`}
        description="Adjunte el documento PDF solicitado por el analista técnico."
      >
        <div className="space-y-4">
          <FormField label="Nombre del Archivo PDF" required>
            <Input
              value={nombreArchivoSubir}
              onChange={(e) => setNombreArchivoSubir(e.target.value)}
              placeholder="Ej. plano_catastrado_visado.pdf"
            />
          </FormField>

          <div className="rounded-[10px] border-2 border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-[#1D4ED8]" />
            <p className="mt-2 text-xs font-semibold text-[#171717]">
              Documento listo para adjuntar al expediente #{tramiteActual.idTramite}
            </p>
            <p className="mt-1 text-[11px] text-[#6B7280]">
              Se registrará en dbo.Documento_Tramite mediante sp_adjuntar_documento_tramite
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenUploadModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!nombreArchivoSubir.trim() || subirDocumentoMut.isPending}
              onClick={() => subirDocumentoMut.mutate()}
            >
              {subirDocumentoMut.isPending ? 'Subiendo...' : 'Confirmar Carga de Requisito'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: PAGAR EN LÍNEA (SINPE MÓVIL) */}
      <Modal
        open={openSinpeModal}
        onClose={() => setOpenSinpeModal(false)}
        title="Pago en Línea — SINPE Móvil Municipal"
        description="Transfiera al número oficial de la Municipalidad de Nicoya y registre su comprobante."
      >
        <div className="space-y-4">
          <div className="rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-xs text-[#1E3A8A] space-y-1">
            <p>
              <strong>Beneficiario:</strong> Municipalidad de Nicoya (Cédula Jurídica 3-014-042088)
            </p>
            <p>
              <strong>Monto Total a Cancelar:</strong>{' '}
              <span className="font-bold">{formatCurrencyCRC(saldoTotalPorPagar)}</span>
            </p>
          </div>

          <FormField label="Teléfono Origen SINPE Móvil" required>
            <Input
              value={telefonoSinpe}
              onChange={(e) => setTelefonoSinpe(e.target.value)}
              placeholder="8888-8888"
            />
          </FormField>

          <FormField label="Número de Comprobante SINPE (Referencia Bancaria)" required>
            <Input
              value={comprobanteSinpe}
              onChange={(e) => setComprobanteSinpe(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenSinpeModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!comprobanteSinpe.trim() || pagarSinpeMut.isPending}
              onClick={() => pagarSinpeMut.mutate()}
            >
              {pagarSinpeMut.isPending ? 'Procesando...' : 'Confirmar Pago SINPE'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
