import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileDown,
  FileText,
  Loader2,
  LogOut,
  Receipt,
  Upload,
} from 'lucide-react';
import { usePortalAuth } from './PortalAuth';
import { portalApi } from '@/services/portalApi';
import { BACKEND_ORIGIN } from '@/services/httpClient';
import type {
  CiudadanoTokenDto,
  SpEstadoCuentaResultDto,
  SpFacturasContribuyenteResultDto,
  SpHistorialTramiteResultDto,
  SpTramitesPorContribuyenteResultDto,
} from '@/types/api';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { formatBytes, formatCurrencyCRC, formatDate, formatDateTime, formatNumber } from '@/lib/utils';

type Pestana = 'tramites' | 'inmuebles' | 'cuenta';

const ACEPTADOS = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';

// Etapas del wireframe (p. 113) sobre los estados de dbo.Estado_Tramite
const ETAPAS = ['Radicado', 'Revisión', 'Inspección / evaluación', 'Resolución'] as const;
const ETAPA_POR_CODIGO: Record<string, number> = { REC: 0, REV: 1, DOC: 1, EVA: 2, APR: 3, RECH: 3 };

function etapaActual(historial: SpHistorialTramiteResultDto[] | undefined, t: SpTramitesPorContribuyenteResultDto) {
  if (t.fechaResolucionFinal) return 3;
  const ultimo = [...(historial ?? [])].sort((a, b) => b.fechaCambio.localeCompare(a.fechaCambio))[0];
  return ETAPA_POR_CODIGO[ultimo?.codigoEstado ?? 'REC'] ?? 0;
}

export function PortalHomePage() {
  const { ciudadano, logout } = usePortalAuth();
  const [pestana, setPestana] = useState<Pestana>('tramites');

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F4]">
      <header className="bg-[#123F2D] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/images/logo2.png" alt="" className="h-10 w-10 rounded-xl object-contain ring-1 ring-white/25" />
            <div>
              <p className="text-base font-extrabold tracking-wide">Portal Ciudadano</p>
              <p className="text-[11px] text-[#D4B872]">Municipalidad de Nicoya</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{ciudadano?.nombreORazonSocial}</p>
              <p className="font-mono text-[11px] text-white/70">Cédula {ciudadano?.identificacion}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Secciones del portal">
          {(
            [
              ['tramites', 'Mis trámites', <FileText key="i" className="h-4 w-4" />],
              ['inmuebles', 'Mis inmuebles', <Building2 key="i" className="h-4 w-4" />],
              ['cuenta', 'Estado de cuenta y facturas', <Receipt key="i" className="h-4 w-4" />],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                pestana === id ? 'bg-[#F5F7F4] text-[#164B35]' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {pestana === 'tramites' && <MisTramites />}
        {pestana === 'inmuebles' && <MisInmuebles />}
        {pestana === 'cuenta' && ciudadano && <EstadoCuenta ciudadano={ciudadano} />}
      </main>

      <footer className="border-t border-[#DCE3DE] bg-white py-4 text-center text-[11px] text-[#5A6B61]">
        Municipalidad de Nicoya · Guanacaste, Costa Rica
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MIS TRÁMITES
// ---------------------------------------------------------------------------

function MisTramites() {
  const queryClient = useQueryClient();
  const [idSel, setIdSel] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [requisitoDestino, setRequisitoDestino] = useState<number | null>(null);

  const tramitesQuery = useQuery({ queryKey: ['portal', 'tramites'], queryFn: () => portalApi.tramites() });
  const tramites = tramitesQuery.data ?? [];
  const activo = tramites.find((t) => t.idTramite === idSel) ?? tramites[0];

  const historialQuery = useQuery({
    queryKey: ['portal', 'historial', activo?.idTramite],
    queryFn: () => portalApi.historial(activo!.idTramite),
    enabled: Boolean(activo),
  });
  const requisitosQuery = useQuery({
    queryKey: ['portal', 'requisitos', activo?.idTramite],
    queryFn: () => portalApi.requisitos(activo!.idTramite),
    enabled: Boolean(activo),
  });
  const archivosQuery = useQuery({
    queryKey: ['portal', 'archivos', activo?.idTramite],
    queryFn: () => portalApi.archivos(activo!.idTramite),
    enabled: Boolean(activo),
  });

  const subirMut = useMutation({
    mutationFn: ({ idRequisito, archivo }: { idRequisito: number; archivo: File }) =>
      portalApi.subirRequisito(activo!.idTramite, idRequisito, archivo),
    onSuccess: (res) => {
      toast.success(res.message || 'Requisito enviado.');
      queryClient.invalidateQueries({ queryKey: ['portal', 'requisitos', activo?.idTramite] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'archivos', activo?.idTramite] });
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setRequisitoDestino(null),
  });

  const elegirArchivo = (idRequisito: number) => {
    setRequisitoDestino(idRequisito);
    inputRef.current?.click();
  };

  const onArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo || requisitoDestino == null) {
      setRequisitoDestino(null);
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      toast.error('El archivo supera el máximo de 10 MB.');
      setRequisitoDestino(null);
      return;
    }
    subirMut.mutate({ idRequisito: requisitoDestino, archivo });
  };

  if (tramitesQuery.isLoading) return <LoadingState message="Consultando sus trámites..." />;
  if (tramitesQuery.isError) return <ErrorState error={tramitesQuery.error} onRetry={() => tramitesQuery.refetch()} />;
  if (tramites.length === 0)
    return (
      <EmptyState
        title="No tiene trámites registrados"
        description="Cuando la Municipalidad radique una solicitud a su nombre aparecerá aquí."
      />
    );

  const etapa = activo ? etapaActual(historialQuery.data, activo) : 0;
  const cerrado = Boolean(activo?.fechaResolucionFinal);
  const historialOrdenado = [...(historialQuery.data ?? [])].sort((a, b) => b.fechaCambio.localeCompare(a.fechaCambio));

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <input ref={inputRef} type="file" accept={ACEPTADOS} className="hidden" onChange={onArchivo} />

      {/* Lista */}
      <div className="space-y-2">
        {tramites.map((t) => (
          <button
            key={t.idTramite}
            type="button"
            onClick={() => setIdSel(t.idTramite)}
            className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
              t.idTramite === activo?.idTramite
                ? 'border-[#164B35] bg-[#E8F0EC]'
                : 'border-[#DCE3DE] bg-white hover:bg-[#FAFCFB]'
            }`}
          >
            <p className="font-mono text-xs font-bold text-[#164B35]">{t.numeroExpediente}</p>
            <p className="mt-0.5 text-sm font-semibold text-[#26352D]">{t.nombreTramite}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant={t.fechaResolucionFinal ? 'success' : 'gold'}>{t.estadoActual}</Badge>
              {t.fueraPlazo && !t.fechaResolucionFinal && <Badge variant="danger">Fuera de plazo</Badge>}
            </div>
          </button>
        ))}
      </div>

      {/* Detalle */}
      {activo && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{activo.nombreTramite}</CardTitle>
              <CardDescription>
                Expediente <span className="font-mono font-semibold">{activo.numeroExpediente}</span> ·{' '}
                {activo.nombreDepartamento} · radicado el {formatDate(activo.fechaRadicacion)}
                {activo.numeroFinca ? ` · finca ${activo.numeroFinca}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Progreso */}
              <ol className="grid grid-cols-4 gap-2" aria-label="Progreso del trámite">
                {ETAPAS.map((nombre, i) => {
                  const hecho = i < etapa || (cerrado && i === 3);
                  const actual = i === etapa && !cerrado;
                  return (
                    <li key={nombre} className="flex flex-col items-center text-center">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          hecho
                            ? 'bg-[#164B35] text-white'
                            : actual
                              ? 'bg-[#B6944A] text-white ring-4 ring-[#B6944A]/20'
                              : 'bg-[#E8F0EC] text-[#5A6B61]'
                        }`}
                      >
                        {hecho ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className={`mt-1.5 text-[11px] font-semibold ${actual ? 'text-[#967736]' : 'text-[#26352D]'}`}>
                        {nombre}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="grid gap-3 text-xs sm:grid-cols-3">
                <Dato titulo="Estado actual" valor={activo.estadoActual ?? '—'} />
                <Dato
                  titulo={cerrado ? 'Resuelto el' : 'Fecha estimada'}
                  valor={formatDate(cerrado ? activo.fechaResolucionFinal : activo.fechaResolucionEstimada)}
                />
                <Dato
                  titulo="Plazo"
                  valor={
                    cerrado
                      ? `${activo.diasTranscurridos ?? 0} días de gestión`
                      : activo.diasRestantesSla != null
                        ? activo.diasRestantesSla >= 0
                          ? `${activo.diasRestantesSla} días restantes`
                          : `${Math.abs(activo.diasRestantesSla)} días de atraso`
                        : '—'
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            {/* Requisitos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requisitos</CardTitle>
                <CardDescription>PDF, imagen u Office · máximo 10 MB.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {requisitosQuery.isLoading ? (
                  <LoadingState message="Consultando requisitos..." />
                ) : requisitosQuery.isError ? (
                  <ErrorState error={requisitosQuery.error} onRetry={() => requisitosQuery.refetch()} />
                ) : (requisitosQuery.data ?? []).length === 0 ? (
                  <p className="text-xs text-[#5A6B61]">Este trámite no tiene requisitos definidos.</p>
                ) : (
                  (requisitosQuery.data ?? []).map((r) => {
                    const subiendo = subirMut.isPending && requisitoDestino === r.idRequisito;
                    return (
                      <div key={r.idRequisito} className="flex items-start justify-between gap-3 rounded-lg border border-[#DCE3DE] p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#26352D]">
                            {r.nombreRequisito}
                            {r.esObligatorio && <span className="ml-1 text-red-600">*</span>}
                          </p>
                          {r.descripcion && <p className="text-[11px] text-[#5A6B61]">{r.descripcion}</p>}
                          <div className="mt-1">
                            {r.presentado ? (
                              <Badge variant="success">
                                Presentado · {r.cantidadArchivos} archivo(s)
                                {r.fechaUltimaPresentacion ? ` · ${formatDate(r.fechaUltimaPresentacion)}` : ''}
                              </Badge>
                            ) : (
                              <Badge variant={r.esObligatorio ? 'danger' : 'warning'}>Pendiente</Badge>
                            )}
                          </div>
                        </div>
                        {!cerrado && (
                          <Button
                            variant={r.presentado ? 'outline' : 'default'}
                            size="sm"
                            disabled={subirMut.isPending}
                            onClick={() => elegirArchivo(r.idRequisito)}
                          >
                            {subiendo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                            {r.presentado ? 'Reemplazar' : 'Subir requisito'}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
                {cerrado && (
                  <p className="text-[11px] text-[#5A6B61]">El trámite ya fue resuelto; no admite más documentos.</p>
                )}
              </CardContent>
            </Card>

            {/* Historial */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historial</CardTitle>
              </CardHeader>
              <CardContent>
                {historialQuery.isLoading ? (
                  <LoadingState message="Consultando historial..." />
                ) : historialOrdenado.length === 0 ? (
                  <p className="text-xs text-[#5A6B61]">Sin movimientos registrados.</p>
                ) : (
                  <ol className="relative space-y-4 border-l border-[#DCE3DE] pl-4">
                    {historialOrdenado.map((h) => (
                      <li key={h.idHistorial} className="relative text-xs">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#164B35]" />
                        <p className="font-semibold text-[#26352D]">{h.nombreEstado}</p>
                        <p className="text-[10px] text-[#5A6B61]">{formatDateTime(h.fechaCambio)}</p>
                        {h.observaciones && <p className="mt-0.5 text-[#5A6B61]">{h.observaciones}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos del expediente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(archivosQuery.data ?? []).length === 0 ? (
                <p className="text-xs text-[#5A6B61]">Aún no hay documentos.</p>
              ) : (
                (archivosQuery.data ?? []).map((a) => (
                  <div key={a.idArchivoAdjunto} className="flex items-center justify-between rounded-lg border border-[#DCE3DE] p-2.5 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold">{a.nombreOriginal}</p>
                      <p className="text-[10px] text-[#5A6B61]">
                        {a.nombreRequisito ?? 'Adjunto general'} · {formatBytes(a.pesoBytes)} · {formatDate(a.fechaSubida)}
                      </p>
                    </div>
                    <a
                      href={`${BACKEND_ORIGIN}/${a.rutaAlmacenamiento}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#164B35] hover:underline"
                      title="Abrir documento"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-[#F4F7F5] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#607168]">{titulo}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#26352D]">{valor}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MIS INMUEBLES
// ---------------------------------------------------------------------------

function MisInmuebles() {
  const q = useQuery({ queryKey: ['portal', 'inmuebles'], queryFn: () => portalApi.inmuebles() });
  if (q.isLoading) return <LoadingState message="Consultando sus propiedades..." />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if ((q.data ?? []).length === 0)
    return <EmptyState title="No tiene inmuebles registrados a su nombre" />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(q.data ?? []).map((i) => (
        <Card key={i.idInmueble}>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-base text-[#164B35]">Finca {i.numeroFinca}</CardTitle>
            <CardDescription>
              {i.nombreDistrito} · {i.usoSuelo}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs">
            <Dato titulo="Participación" valor={`${formatNumber(i.porcentajeParticipacion, 2)}%`} />
            <Dato titulo="Valor fiscal (su parte)" valor={formatCurrencyCRC(i.valorFiscalProporcional ?? i.valorFiscal)} />
            <Dato titulo="Terreno" valor={`${formatNumber(i.areaTerrenoM2, 2)} m²`} />
            <Dato titulo="Construcción" valor={`${formatNumber(i.areaConstruccionM2, 2)} m²`} />
            <p className="col-span-2 text-[11px] text-[#5A6B61]">
              {i.direccionExacta}
              {i.planoCatastrado ? ` · Plano ${i.planoCatastrado}` : ''}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ESTADO DE CUENTA Y FACTURAS
// ---------------------------------------------------------------------------

function EstadoCuenta({ ciudadano }: { ciudadano: CiudadanoTokenDto }) {
  const queryClient = useQueryClient();
  const [facturaPago, setFacturaPago] = useState<SpFacturasContribuyenteResultDto | null>(null);
  const [comprobante, setComprobante] = useState('');
  const [monto, setMonto] = useState('');

  const cuentaQuery = useQuery({ queryKey: ['portal', 'estado-cuenta'], queryFn: () => portalApi.estadoCuenta() });
  const facturasQuery = useQuery({ queryKey: ['portal', 'facturas'], queryFn: () => portalApi.facturas() });

  const deudas = useMemo(() => {
    // sp_consultar_estado_cuenta repite la deuda por cada factura asociada
    const map = new Map<number, SpEstadoCuentaResultDto>();
    for (const d of cuentaQuery.data ?? []) if (!map.has(d.idDeudaMunicipal)) map.set(d.idDeudaMunicipal, d);
    return Array.from(map.values());
  }, [cuentaQuery.data]);

  const pendientes = deudas.filter((d) => !['PAG', 'ANU'].includes((d.codigoEstadoDeuda ?? '').toUpperCase()));
  const totalAdeudado = (facturasQuery.data ?? []).reduce((acc, f) => acc + (f.saldoPendiente ?? 0), 0);
  const vencidas = pendientes.filter((d) => new Date(d.fechaDeVencimiento).getTime() < Date.now()).length;

  const pagoMut = useMutation({
    mutationFn: () =>
      portalApi.pagarSinpe(facturaPago!.idFactura, { comprobante: comprobante.trim(), monto: Number(monto) }),
    onSuccess: (res) => {
      toast.success(res.message || 'Pago registrado.');
      setFacturaPago(null);
      queryClient.invalidateQueries({ queryKey: ['portal', 'facturas'] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'estado-cuenta'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const montoNum = Number(monto);
  const montoValido = monto !== '' && montoNum > 0 && facturaPago != null && montoNum <= facturaPago.saldoPendiente;

  if (cuentaQuery.isLoading || facturasQuery.isLoading) return <LoadingState message="Consultando su estado de cuenta..." />;
  if (cuentaQuery.isError) return <ErrorState error={cuentaQuery.error} onRetry={() => cuentaQuery.refetch()} />;
  if (facturasQuery.isError) return <ErrorState error={facturasQuery.error} onRetry={() => facturasQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="pb-2">
            <CardDescription>Saldo pendiente en facturas</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-red-700">{formatCurrencyCRC(totalAdeudado)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-[#B6944A]">
          <CardHeader className="pb-2">
            <CardDescription>Obligaciones pendientes</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-[#967736]">{pendientes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-[#164B35]">
          <CardHeader className="pb-2">
            <CardDescription>Vencidas</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-[#164B35]">{vencidas}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
          <CardTitle className="text-base">Facturas</CardTitle>
          <CardDescription>Pague en línea con SINPE Móvil o descargue el comprobante.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {(facturasQuery.data ?? []).length === 0 ? (
            <p className="p-4 text-xs text-[#5A6B61]">No tiene facturas emitidas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                    <th className="px-3 py-2.5">Factura</th>
                    <th className="px-3 py-2.5">Emisión</th>
                    <th className="px-3 py-2.5">Periodo / Finca</th>
                    <th className="px-3 py-2.5">Total</th>
                    <th className="px-3 py-2.5">Saldo</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {(facturasQuery.data ?? []).map((f) => (
                    <tr key={f.idFactura} className="even:bg-[#FAFCFB]">
                      <td className="px-3 py-2.5 font-mono font-bold text-[#164B35]">#{f.idFactura}</td>
                      <td className="px-3 py-2.5">{formatDate(f.fechaEmision)}</td>
                      <td className="px-3 py-2.5">
                        <p>{f.periodoDeuda ?? '—'}</p>
                        <p className="font-mono text-[11px] text-[#5A6B61]">{f.numeroFinca ?? ''}</p>
                      </td>
                      <td className="px-3 py-2.5">{formatCurrencyCRC(f.totalAPagar)}</td>
                      <td className="px-3 py-2.5 font-semibold">{formatCurrencyCRC(f.saldoPendiente)}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={f.saldoPendiente > 0 ? 'warning' : 'success'}>{f.estadoFactura}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1.5">
                          {f.saldoPendiente > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setFacturaPago(f);
                                setComprobante('');
                                setMonto(String(f.saldoPendiente));
                              }}
                            >
                              <CreditCard className="h-3.5 w-3.5" /> Pagar en línea
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              abrirComprobante(
                                f,
                                ciudadano,
                                (cuentaQuery.data ?? []).filter((d) => d.idFactura === f.idFactura)
                              )
                            }
                          >
                            <FileDown className="h-3.5 w-3.5" /> Comprobante
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
          <CardTitle className="text-base">Detalle de obligaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {deudas.length === 0 ? (
            <p className="p-4 text-xs text-[#5A6B61]">Está al día: no registra obligaciones.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                    <th className="px-3 py-2.5">Tributo / Periodo</th>
                    <th className="px-3 py-2.5">Finca</th>
                    <th className="px-3 py-2.5">Vencimiento</th>
                    <th className="px-3 py-2.5">Principal</th>
                    <th className="px-3 py-2.5">Intereses + multas</th>
                    <th className="px-3 py-2.5">Total</th>
                    <th className="px-3 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {deudas.map((d) => {
                    const vencida =
                      new Date(d.fechaDeVencimiento).getTime() < Date.now() &&
                      !['PAG', 'ANU'].includes((d.codigoEstadoDeuda ?? '').toUpperCase());
                    return (
                      <tr key={d.idDeudaMunicipal} className="even:bg-[#FAFCFB]">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold">{d.nombreTributo}</p>
                          <p className="text-[11px] text-[#5A6B61]">{d.periodoDeuda}</p>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">{d.numeroFinca ?? '—'}</td>
                        <td className="px-3 py-2.5">
                          {formatDate(d.fechaDeVencimiento)}
                          {vencida && (
                            <Badge variant="danger" className="ml-1">
                              <Clock className="mr-0.5 h-3 w-3" /> Vencida
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5">{formatCurrencyCRC(d.montoPrincipal)}</td>
                        <td className="px-3 py-2.5">{formatCurrencyCRC(d.montoIntereses + d.montoMultas)}</td>
                        <td className="px-3 py-2.5 font-semibold">{formatCurrencyCRC(d.totalDeuda)}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline">{d.descripcionEstadoDeuda ?? d.codigoEstadoDeuda}</Badge>
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

      <Modal
        open={Boolean(facturaPago)}
        onClose={() => !pagoMut.isPending && setFacturaPago(null)}
        title={`Pagar factura #${facturaPago?.idFactura ?? ''} con SINPE Móvil`}
        description="Realice la transferencia desde su banco y registre aquí el número de comprobante."
      >
        {facturaPago && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (montoValido && comprobante.trim()) pagoMut.mutate();
            }}
          >
            <div className="rounded-lg bg-[#F4F7F5] p-3 text-xs text-[#26352D]">
              <p>
                Saldo pendiente: <strong>{formatCurrencyCRC(facturaPago.saldoPendiente)}</strong>
              </p>
              <p className="mt-1 text-[#5A6B61]">
                SINPE Móvil institucional de la Municipalidad de Nicoya. Puede abonar un monto parcial.
              </p>
            </div>
            <FormField label="Número de comprobante SINPE" required>
              <Input
                maxLength={50}
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="Ej. 2026103100123456"
              />
            </FormField>
            <FormField
              label="Monto transferido (₡)"
              required
              error={
                monto !== '' && !montoValido
                  ? 'El monto debe ser mayor que cero y no superar el saldo pendiente.'
                  : undefined
              }
            >
              <Input type="number" min={0} step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={pagoMut.isPending} onClick={() => setFacturaPago(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!montoValido || !comprobante.trim() || pagoMut.isPending}>
                {pagoMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Registrar pago
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comprobante imprimible (se guarda como PDF desde el diálogo de impresión)
// ---------------------------------------------------------------------------

function escapar(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function abrirComprobante(
  f: SpFacturasContribuyenteResultDto,
  c: CiudadanoTokenDto,
  lineas: SpEstadoCuentaResultDto[]
) {
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) {
    toast.error('El navegador bloqueó la ventana del comprobante. Permita ventanas emergentes.');
    return;
  }
  const filas = lineas
    .map(
      (l) =>
        `<tr><td>${escapar(l.nombreTributo)}</td><td>${escapar(l.periodoDeuda)}</td><td>${escapar(
          l.numeroFinca ?? '—'
        )}</td><td class="n">${escapar(formatCurrencyCRC(l.totalDeuda))}</td></tr>`
    )
    .join('');
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Comprobante factura ${f.idFactura}</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;color:#26352D;margin:32px}
h1{font-size:20px;margin:0;color:#164B35}.sub{color:#5A6B61;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
th,td{border-bottom:1px solid #DCE3DE;padding:8px;text-align:left}th{background:#F4F7F5;font-size:11px;text-transform:uppercase}
.n{text-align:right}.tot td{font-weight:700}.box{border:1px solid #DCE3DE;border-radius:8px;padding:12px;margin-top:16px;font-size:13px}
@media print{button{display:none}}
</style></head><body>
<h1>Municipalidad de Nicoya</h1><div class="sub">Comprobante de factura · emitido desde el Portal Ciudadano el ${escapar(
    formatDateTime(new Date().toISOString())
  )}</div>
<div class="box"><strong>Contribuyente:</strong> ${escapar(c.nombreORazonSocial)}<br><strong>Identificación:</strong> ${escapar(
    c.identificacion
  )}<br><strong>Factura:</strong> #${f.idFactura} · <strong>Emisión:</strong> ${escapar(formatDate(f.fechaEmision))}<br>
<strong>Clave Hacienda:</strong> ${escapar(f.claveNumericaHacienda ?? '—')}<br><strong>Estado:</strong> ${escapar(f.estadoFactura)}</div>
<table><thead><tr><th>Tributo</th><th>Periodo</th><th>Finca</th><th class="n">Monto</th></tr></thead><tbody>
${filas || '<tr><td colspan="4">Sin detalle de obligaciones asociado.</td></tr>'}
<tr class="tot"><td colspan="3">Subtotal</td><td class="n">${escapar(formatCurrencyCRC(f.subtotal))}</td></tr>
<tr class="tot"><td colspan="3">Descuentos</td><td class="n">${escapar(formatCurrencyCRC(f.descuentos))}</td></tr>
<tr class="tot"><td colspan="3">Total a pagar</td><td class="n">${escapar(formatCurrencyCRC(f.totalAPagar))}</td></tr>
<tr class="tot"><td colspan="3">Saldo pendiente</td><td class="n">${escapar(formatCurrencyCRC(f.saldoPendiente))}</td></tr>
</tbody></table>
<p style="margin-top:24px"><button onclick="window.print()">Imprimir / Guardar como PDF</button></p>
</body></html>`);
  w.document.close();
  w.focus();
}
