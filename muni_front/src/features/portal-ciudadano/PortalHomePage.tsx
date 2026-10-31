import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CreditCard,
  ExternalLink,
  FileDown,
  FileText,
  Loader2,
  LogOut,
  Receipt,
  Upload,
  WalletCards,
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
    <div className="flex min-h-screen flex-col bg-sigemun-bg">
      <header className="border-b border-white/10 bg-sigemun-navy text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/images/logo2.png" alt="" className="h-12 w-12 rounded-2xl object-contain shadow-md ring-1 ring-white/25" />
            <div>
              <p className="text-lg font-extrabold tracking-wide">Portal Ciudadano</p>
              <p className="text-xs text-sigemun-sky">Municipalidad de Nicoya · Guanacaste</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-2 pl-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{ciudadano?.nombreORazonSocial}</p>
              <p className="font-mono text-[11px] text-white/65">Cédula {ciudadano?.identificacion}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6" aria-label="Secciones del portal">
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
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                pestana === id
                  ? 'border-white bg-white text-sigemun-primary shadow-md'
                  : 'border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
        {pestana === 'tramites' && <MisTramites />}
        {pestana === 'inmuebles' && <MisInmuebles />}
        {pestana === 'cuenta' && ciudadano && <EstadoCuenta ciudadano={ciudadano} />}
      </main>

      <footer className="border-t border-sigemun-border bg-white py-4 text-center text-[11px] text-sigemun-muted">
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
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:gap-8">
      <input ref={inputRef} type="file" accept={ACEPTADOS} className="hidden" onChange={onArchivo} />

      {/* Lista */}
      <aside className="overflow-hidden rounded-2xl border border-sigemun-border bg-white shadow-card lg:sticky lg:top-6">
        <div className="border-b border-sigemun-border bg-gradient-to-r from-sigemun-bg to-white p-5">
          <p className="text-base font-bold text-sigemun-text">Mis expedientes</p>
          <p className="mt-1 text-xs text-sigemun-muted">{tramites.length} trámite(s) asociado(s) a su cuenta</p>
        </div>
        <div className="space-y-2 p-3">
          {tramites.map((t) => (
          <button
            key={t.idTramite}
            type="button"
            onClick={() => setIdSel(t.idTramite)}
            className={`group w-full rounded-xl border p-4 text-left transition-all ${
              t.idTramite === activo?.idTramite
                ? 'border-sigemun-primary bg-sigemun-sky-muted shadow-[inset_3px_0_0_var(--sigemun-primary)]'
                : 'border-transparent bg-sigemun-bg hover:border-sigemun-border hover:bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs font-bold text-sigemun-primary">{t.numeroExpediente}</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-sigemun-text">{t.nombreTramite}</p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-sigemun-muted transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant={t.fechaResolucionFinal ? 'success' : 'accent'}>{t.estadoActual}</Badge>
              {t.fueraPlazo && !t.fechaResolucionFinal && <Badge variant="danger">Fuera de plazo</Badge>}
            </div>
          </button>
          ))}
        </div>
      </aside>

      {/* Detalle */}
      {activo && (
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-sigemun-border bg-gradient-to-r from-white via-white to-sigemun-bg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl">{activo.nombreTramite}</CardTitle>
                  <CardDescription className="mt-2 leading-relaxed">
                Expediente <span className="font-mono font-semibold">{activo.numeroExpediente}</span> ·{' '}
                {activo.nombreDepartamento} · radicado el {formatDate(activo.fechaRadicacion)}
                {activo.numeroFinca ? ` · finca ${activo.numeroFinca}` : ''}
                  </CardDescription>
                </div>
                <Badge variant={cerrado ? 'success' : 'accent'}>{activo.estadoActual}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5 sm:pt-6">
              {/* Progreso */}
              <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Progreso del trámite">
                {ETAPAS.map((nombre, i) => {
                  const hecho = i < etapa || (cerrado && i === 3);
                  const actual = i === etapa && !cerrado;
                  return (
                    <li key={nombre} className={`flex min-h-24 flex-col items-center justify-center rounded-xl border p-3 text-center ${
                      hecho
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : actual
                          ? 'border-sigemun-sky bg-sigemun-bg'
                          : 'border-sigemun-border bg-sigemun-surface'
                    }`}>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          hecho
                            ? 'bg-sigemun-primary text-white'
                            : actual
                              ? 'bg-sigemun-medium text-white ring-4 ring-sigemun-medium/20'
                              : 'bg-sigemun-sky-muted text-sigemun-muted'
                        }`}
                      >
                        {hecho ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className={`mt-1.5 text-[11px] font-semibold ${actual ? 'text-sigemun-primary' : 'text-sigemun-text'}`}>
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
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
                <CardTitle className="text-base">Requisitos</CardTitle>
                <CardDescription>PDF, imagen u Office · máximo 10 MB.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {requisitosQuery.isLoading ? (
                  <LoadingState message="Consultando requisitos..." />
                ) : requisitosQuery.isError ? (
                  <ErrorState error={requisitosQuery.error} onRetry={() => requisitosQuery.refetch()} />
                ) : (requisitosQuery.data ?? []).length === 0 ? (
                  <p className="text-xs text-sigemun-muted">Este trámite no tiene requisitos definidos.</p>
                ) : (
                  (requisitosQuery.data ?? []).map((r) => {
                    const subiendo = subirMut.isPending && requisitoDestino === r.idRequisito;
                    return (
                      <div key={r.idRequisito} className="flex flex-col items-start justify-between gap-3 rounded-xl border border-sigemun-border bg-white p-4 transition-colors hover:bg-sigemun-surface sm:flex-row">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-sigemun-text">
                            {r.nombreRequisito}
                            {r.esObligatorio && <span className="ml-1 text-red-600">*</span>}
                          </p>
                          {r.descripcion && <p className="text-[11px] text-sigemun-muted">{r.descripcion}</p>}
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
                  <p className="text-[11px] text-sigemun-muted">El trámite ya fue resuelto; no admite más documentos.</p>
                )}
              </CardContent>
            </Card>

            {/* Historial */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
                <CardTitle className="text-base">Historial</CardTitle>
              </CardHeader>
              <CardContent>
                {historialQuery.isLoading ? (
                  <LoadingState message="Consultando historial..." />
                ) : historialOrdenado.length === 0 ? (
                  <p className="text-xs text-sigemun-muted">Sin movimientos registrados.</p>
                ) : (
                  <ol className="relative space-y-4 border-l border-sigemun-border pl-4">
                    {historialOrdenado.map((h) => (
                      <li key={h.idHistorial} className="relative text-xs">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-sigemun-primary" />
                        <p className="font-semibold text-sigemun-text">{h.nombreEstado}</p>
                        <p className="text-[10px] text-sigemun-muted">{formatDateTime(h.fechaCambio)}</p>
                        {h.observaciones && <p className="mt-0.5 text-sigemun-muted">{h.observaciones}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documentos */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
              <CardTitle className="text-base">Documentos del expediente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(archivosQuery.data ?? []).length === 0 ? (
                <p className="text-xs text-sigemun-muted">Aún no hay documentos.</p>
              ) : (
                (archivosQuery.data ?? []).map((a) => (
                  <div key={a.idArchivoAdjunto} className="flex items-center justify-between rounded-lg border border-sigemun-border p-2.5 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold">{a.nombreOriginal}</p>
                      <p className="text-[10px] text-sigemun-muted">
                        {a.nombreRequisito ?? 'Adjunto general'} · {formatBytes(a.pesoBytes)} · {formatDate(a.fechaSubida)}
                      </p>
                    </div>
                    <a
                      href={`${BACKEND_ORIGIN}/${a.rutaAlmacenamiento}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sigemun-primary hover:underline"
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
    <div className="rounded-xl border border-sigemun-border bg-sigemun-bg p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sigemun-muted">{titulo}</p>
      <p className="mt-0.5 text-sm font-semibold text-sigemun-text">{valor}</p>
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
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      {(q.data ?? []).map((i) => (
        <Card key={i.idInmueble} className="overflow-hidden shadow-elevated">
          <CardHeader className="border-b border-sigemun-border bg-gradient-to-r from-sigemun-bg via-white to-white">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sigemun-primary text-sigemun-sky shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.12em] text-sigemun-muted">
                  Propiedad registrada
                </CardDescription>
                <CardTitle className="mt-1 font-mono text-lg text-sigemun-primary">
                  Finca {i.numeroFinca}
                </CardTitle>
                <p className="mt-1 text-sm text-sigemun-muted">
                  {i.nombreDistrito} · {i.usoSuelo}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5 sm:pt-6">
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <Dato titulo="Participación" valor={`${formatNumber(i.porcentajeParticipacion, 2)}%`} />
              <Dato titulo="Valor fiscal (su parte)" valor={formatCurrencyCRC(i.valorFiscalProporcional ?? i.valorFiscal)} />
              <Dato titulo="Área de terreno" valor={`${formatNumber(i.areaTerrenoM2, 2)} m²`} />
              <Dato titulo="Área de construcción" valor={`${formatNumber(i.areaConstruccionM2, 2)} m²`} />
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-sigemun-border bg-sigemun-surface px-4 py-3 text-xs text-sigemun-muted sm:flex-row sm:items-center sm:justify-between">
              <span>{i.direccionExacta}</span>
              {i.planoCatastrado && (
                <span className="shrink-0 rounded-full bg-sigemun-sky-muted px-3 py-1 font-mono font-semibold text-sigemun-primary">
                  Plano {i.planoCatastrado}
                </span>
              )}
            </div>
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
        <Card className="overflow-hidden border-red-100 bg-gradient-to-br from-white to-red-50/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="font-semibold text-sigemun-muted">Saldo pendiente</CardDescription>
              <CardTitle className="mt-2 text-2xl font-extrabold text-red-700">{formatCurrencyCRC(totalAdeudado)}</CardTitle>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <CircleDollarSign className="h-6 w-6" />
            </div>
          </CardHeader>
        </Card>
        <Card className="overflow-hidden border-amber-100 bg-gradient-to-br from-white to-amber-50/70">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="font-semibold text-sigemun-muted">Obligaciones pendientes</CardDescription>
              <CardTitle className="mt-2 text-2xl font-extrabold text-sigemun-primary">{pendientes.length}</CardTitle>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-sigemun-primary">
              <WalletCards className="h-6 w-6" />
            </div>
          </CardHeader>
        </Card>
        <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="font-semibold text-sigemun-muted">Obligaciones vencidas</CardDescription>
              <CardTitle className="mt-2 text-2xl font-extrabold text-sigemun-primary">{vencidas}</CardTitle>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-sigemun-primary">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-sigemun-border bg-gradient-to-r from-sigemun-bg to-white">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sigemun-primary text-sigemun-sky">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Facturas municipales</CardTitle>
              <CardDescription className="mt-1">Consulte sus facturas, pague con SINPE Móvil o descargue el comprobante.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {(facturasQuery.data ?? []).length === 0 ? (
            <p className="p-4 text-xs text-sigemun-muted">No tiene facturas emitidas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-sigemun-border bg-sigemun-bg text-[11px] font-bold uppercase tracking-[0.08em] text-sigemun-muted">
                    <th className="px-3 py-2.5">Factura</th>
                    <th className="px-3 py-2.5">Emisión</th>
                    <th className="px-3 py-2.5">Periodo / Finca</th>
                    <th className="px-3 py-2.5">Total</th>
                    <th className="px-3 py-2.5">Saldo</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sigemun-border">
                  {(facturasQuery.data ?? []).map((f) => (
                    <tr key={f.idFactura} className="transition-colors even:bg-sigemun-surface hover:bg-sigemun-bg">
                      <td className="px-3 py-2.5 font-mono font-bold text-sigemun-primary">#{f.idFactura}</td>
                      <td className="px-3 py-2.5">{formatDate(f.fechaEmision)}</td>
                      <td className="px-3 py-2.5">
                        <p>{f.periodoDeuda ?? '—'}</p>
                        <p className="font-mono text-[11px] text-sigemun-muted">{f.numeroFinca ?? ''}</p>
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
        <CardHeader className="border-b border-sigemun-border bg-gradient-to-r from-sigemun-bg to-white">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sigemun-sky-muted text-sigemun-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Detalle de obligaciones</CardTitle>
              <CardDescription className="mt-1">Desglose de tributos, periodos, vencimientos y montos registrados.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {deudas.length === 0 ? (
            <p className="p-4 text-xs text-sigemun-muted">Está al día: no registra obligaciones.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-sigemun-border bg-sigemun-bg text-[11px] font-bold uppercase tracking-[0.08em] text-sigemun-muted">
                    <th className="px-3 py-2.5">Tributo / Periodo</th>
                    <th className="px-3 py-2.5">Finca</th>
                    <th className="px-3 py-2.5">Vencimiento</th>
                    <th className="px-3 py-2.5">Principal</th>
                    <th className="px-3 py-2.5">Intereses + multas</th>
                    <th className="px-3 py-2.5">Total</th>
                    <th className="px-3 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sigemun-border">
                  {deudas.map((d) => {
                    const vencida =
                      new Date(d.fechaDeVencimiento).getTime() < Date.now() &&
                      !['PAG', 'ANU'].includes((d.codigoEstadoDeuda ?? '').toUpperCase());
                    return (
                      <tr key={d.idDeudaMunicipal} className="transition-colors even:bg-sigemun-surface hover:bg-sigemun-bg">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold">{d.nombreTributo}</p>
                          <p className="text-[11px] text-sigemun-muted">{d.periodoDeuda}</p>
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
        title="Pago en línea con SINPE Móvil"
        description={`Factura #${facturaPago?.idFactura ?? ''} · Registro seguro de transferencia`}
        maxWidth="max-w-xl"
      >
        {facturaPago && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (montoValido && comprobante.trim()) pagoMut.mutate();
            }}
          >
            <div className="flex flex-col gap-4 rounded-2xl border border-sigemun-border bg-gradient-to-br from-sigemun-bg to-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sigemun-primary text-sigemun-sky shadow-sm">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sigemun-muted">Saldo pendiente de la factura</p>
                  <p className="mt-0.5 text-2xl font-extrabold text-sigemun-primary">
                    {formatCurrencyCRC(facturaPago.saldoPendiente)}
                  </p>
                </div>
              </div>
              <Badge variant="accent">Abono parcial permitido</Badge>
            </div>

            <div className="rounded-xl border border-sigemun-border p-4 sm:p-5">
              <div className="space-y-4">
                <FormField label="Número de comprobante SINPE" required>
                  <Input
                    maxLength={50}
                    value={comprobante}
                    onChange={(e) => setComprobante(e.target.value)}
                    placeholder="Ej. 2026103100123456"
                    className="h-11"
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
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="h-11 text-base font-semibold"
                  />
                </FormField>
              </div>
              <p className="mt-4 rounded-lg bg-sigemun-bg px-3 py-2.5 text-[11px] leading-relaxed text-sigemun-muted">
                Realice primero la transferencia al SINPE Móvil institucional y luego registre aquí el comprobante emitido por su banco.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-sigemun-border pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={pagoMut.isPending} onClick={() => setFacturaPago(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="sm:min-w-40" disabled={!montoValido || !comprobante.trim() || pagoMut.isPending}>
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
body{font-family:Segoe UI,Arial,sans-serif;color:#243746;margin:32px}
h1{font-size:20px;margin:0;color:#1E5A9C}.sub{color:#526B7A;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
th,td{border-bottom:1px solid #D9E6F2;padding:8px;text-align:left}th{background:#F1F8FE;font-size:11px;text-transform:uppercase}
.n{text-align:right}.tot td{font-weight:700}.box{border:1px solid #D9E6F2;border-radius:8px;padding:12px;margin-top:16px;font-size:13px}
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
