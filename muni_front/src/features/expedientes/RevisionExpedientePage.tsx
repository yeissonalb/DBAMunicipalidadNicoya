import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tramiteApi, type CotejoRequisito } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/ui/modal';

const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const etiquetas: Record<string, string> = {
  PENDIENTE: 'Sin documento', PRESENTADO: 'Presentado · Sin revisar',
  VALIDADO: 'Validado', SUBSANAR: 'Requiere corrección',
};

export function RevisionExpedientePage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const id = Number(params.get('id')) || 0;
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('');
  const [codigoEstado, setCodigoEstado] = useState('');
  const [observacion, setObservacion] = useState('');
  const [requisito, setRequisito] = useState<CotejoRequisito | null>(null);
  const [decision, setDecision] = useState<'VALIDADO' | 'SUBSANAR'>('SUBSANAR');
  const [motivo, setMotivo] = useState('');
  const [descargando, setDescargando] = useState(false);
  const [vista, setVista] = useState<{ nombre: string; url: string; imagen: boolean } | null>(null);
  const [cargandoVista, setCargandoVista] = useState(false);
  const solicitudVista = useRef(0);
  useEffect(() => {
    setVista(null);
    setCargandoVista(false);
    return () => { solicitudVista.current += 1; };
  }, [id]);
  useEffect(() => {
    return () => { if (vista) URL.revokeObjectURL(vista.url); };
  }, [vista]);
  const cerrarVista = () => {
    solicitudVista.current += 1;
    setVista(null);
    setCargandoVista(false);
  };
  const puedeVisualizar = (nombre: string) => /\.(pdf|png|jpe?g|gif|webp)$/i.test(nombre);
  const visualizar = async (archivoId: number, nombre: string) => {
    if (!puedeVisualizar(nombre)) {
      toast.info('Este formato requiere descarga para abrirlo.');
      return;
    }
    const solicitud = ++solicitudVista.current;
    setCargandoVista(true);
    try {
      const blob = await tramiteApi.obtenerArchivoBlob(id, archivoId);
      if (solicitud !== solicitudVista.current) return;
      const extension = nombre.split('.').pop()!.toLowerCase();
      const tipos: Record<string, string> = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
      const url = URL.createObjectURL(new Blob([blob], { type: tipos[extension] }));
      setVista({ nombre, url, imagen: extension !== 'pdf' });
    } catch (e) {
      if (solicitud === solicitudVista.current) toast.error(e instanceof Error ? e.message : 'No se pudo visualizar el documento.');
    } finally {
      if (solicitud === solicitudVista.current) setCargandoVista(false);
    }
  };
  const listado = useQuery({ queryKey: ['tramite', 'bandeja-revision'], queryFn: () => tramiteApi.seguimiento() });
  const detalle = useQuery({ queryKey: ['tramite', 'revision', id], queryFn: () => tramiteApi.consultar(id), enabled: id > 0 });
  const cotejo = useQuery({ queryKey: ['tramite', 'cotejo', id], queryFn: () => tramiteApi.cotejo(id), enabled: id > 0 });
  const archivos = useQuery({ queryKey: ['tramite', 'archivos-revision', id], queryFn: () => tramiteApi.archivosRevision(id), enabled: id > 0 });
  const estados = useQuery({ queryKey: ['catalogos', 'estados-tramite'], queryFn: () => tramiteApi.estados() });
  const tramite = detalle.data?.[0];
  const cerrado = Boolean(tramite?.fechaCierre);
  useEffect(() => { setCodigoEstado(''); setObservacion(''); setRequisito(null); setMotivo(''); }, [id]);
  const resultados = (listado.data ?? []).filter(t => {
    const raw = t as typeof t & { cedulaSolicitante?: string };
    const campos = [t.numeroExpediente, t.contribuyente, raw.cedulaSolicitante, t.numeroFinca];
    const q = normalizar(filtro);
    const digitos = q.replace(/\D/g, '');
    return !q || campos.some(v => v && (normalizar(v).includes(q) ||
      (digitos.length >= 5 && normalizar(v).replace(/\D/g, '').includes(digitos))));
  });
  const guardarRevision = useMutation({
    mutationFn: async () => {
      if (!requisito?.idArchivoAdjunto || !motivo.trim()) throw new Error('Seleccione un documento y justifique el resultado.');
      return tramiteApi.revisarArchivo(id, { idArchivoAdjunto: requisito.idArchivoAdjunto, estado: decision, observacion: motivo.trim() });
    },
    onSuccess: () => { toast.success('Revisión registrada sobre el archivo real.'); setRequisito(null); setMotivo(''); qc.invalidateQueries({ queryKey: ['tramite'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const cambiarEstado = useMutation({
    mutationFn: () => {
      if (!codigoEstado || !observacion.trim()) throw new Error('Seleccione estado e ingrese la observación.');
      return tramiteApi.cambiarEstado(id, { codigoEstado, observaciones: observacion.trim() });
    },
    onSuccess: () => { toast.success('Cambio de estado registrado.'); setObservacion(''); setCodigoEstado(''); qc.invalidateQueries({ queryKey: ['tramite'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const descargar = async (archivoId: number, nombre: string) => {
    setDescargando(true);
    try { await tramiteApi.descargarArchivoBlob(id, archivoId, nombre); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'No se pudo descargar el archivo.'); }
    finally { setDescargando(false); }
  };
  return <div className="space-y-6">
    <PageHeader title="Revisión y cotejo de expedientes" subtitle="Busque al solicitante o expediente y revise sus documentos reales." />
    <Card><CardHeader><CardTitle>Buscar expediente</CardTitle></CardHeader><CardContent className="space-y-4">
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setFiltro(busqueda); }}>
        <Input aria-label="Buscar por expediente, nombre, cédula o finca" className="min-w-60 flex-1" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Expediente, nombre, cédula o finca" />
        <Button type="submit">Buscar</Button><Button type="button" variant="secondary" onClick={() => { setBusqueda(''); setFiltro(''); }}>Ver todos</Button>
      </form>
      {listado.isLoading ? <LoadingState message="Consultando expedientes..." /> : listado.isError ? <ErrorState error={listado.error} onRetry={() => listado.refetch()} /> : <div className="max-h-80 overflow-auto">
        <table className="w-full text-left text-sm"><thead><tr><th className="p-2">Expediente</th><th className="p-2">Solicitante / cédula</th><th className="p-2">Tipo</th><th className="p-2">Estado</th><th className="p-2">Fecha</th><th className="p-2">Acción</th></tr></thead><tbody>
          {resultados.map(t => <tr key={t.idTramite} className={id === t.idTramite ? 'bg-blue-50 border-t' : 'border-t'}>
            <td className="p-2 font-mono">{t.numeroExpediente}</td><td className="p-2">{t.contribuyente}<br /><span className="text-xs">{(t as typeof t & { cedulaSolicitante?: string }).cedulaSolicitante}</span></td><td className="p-2">{t.nombreTramite}</td><td className="p-2">{t.estadoActual}</td><td className="p-2">{t.fechaSolicitud ? new Date(t.fechaSolicitud).toLocaleDateString('es-CR') : '—'}</td>
            <td className="p-2"><Button variant="secondary" onClick={() => setParams({ id: String(t.idTramite) })}>Revisar</Button></td>
          </tr>)}
          {!resultados.length && <tr><td colSpan={6} className="p-4">No hay expedientes con ese criterio.</td></tr>}
        </tbody></table>
      </div>}
    </CardContent></Card>
    {!id ? <p>Seleccione un resultado para iniciar la revisión.</p> : detalle.isLoading ? <LoadingState message="Cargando expediente..." /> : detalle.isError ? <ErrorState error={detalle.error} onRetry={() => detalle.refetch()} /> : !tramite ? <p>No se encontró el expediente seleccionado.</p> : <>
      <Card><CardHeader><CardTitle>{tramite.numeroExpediente} · {tramite.nombreTramite}</CardTitle></CardHeader><CardContent className="space-y-2">
        <p><strong>Solicitante:</strong> {tramite.contribuyente}</p><p><strong>Finca:</strong> {tramite.numeroFinca || 'No aplica'}</p><p><strong>Estado:</strong> {tramite.estadoActual}</p>
        {cerrado && <p>Expediente cerrado: solo consulta.</p>}
        <Button asChild variant="secondary"><Link to={`/tramites/seguimiento?id=${id}`}>Ver seguimiento del expediente</Link></Button>
      </CardContent></Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Requisitos y revisión documental</CardTitle></CardHeader><CardContent className="space-y-3">
          <p className="text-sm">Presentar un archivo no equivale a validarlo. Una nueva versión necesita una nueva revisión.</p>
          {cotejo.isLoading ? <LoadingState message="Consultando cotejo..." /> : cotejo.isError ? <ErrorState error={cotejo.error} onRetry={() => cotejo.refetch()} /> : !cotejo.data?.length ? <p>No hay requisitos configurados.</p> : cotejo.data.map(r => <div key={r.idRequisito} className="rounded-lg border p-4 space-y-2">
            <p className="font-semibold">{r.nombreRequisito} {r.esObligatorio ? '(Obligatorio)' : '(Opcional)'}</p>
            <Badge variant={r.estadoRevision === 'VALIDADO' ? 'success' : r.estadoRevision === 'SUBSANAR' ? 'danger' : 'warning'}>{etiquetas[r.estadoRevision] || r.estadoRevision}</Badge>
            {r.nombreOriginal && <p className="text-sm break-all">Última versión: {r.nombreOriginal}</p>}
            {r.observacion && <p className="text-sm">{r.observacion}</p>}
            {r.fechaRevision && <p className="text-xs">Revisó {r.usuarioRevisor} · {new Date(r.fechaRevision).toLocaleString('es-CR')}</p>}
            {r.idArchivoAdjunto && <div className="flex flex-wrap gap-2">
              {puedeVisualizar(r.nombreOriginal || '') && <Button variant="secondary" disabled={cargandoVista} onClick={() => visualizar(r.idArchivoAdjunto!, r.nombreOriginal!)}>Visualizar</Button>}
              <Button variant="secondary" disabled={descargando} onClick={() => descargar(r.idArchivoAdjunto!, r.nombreOriginal || 'documento')}>Descargar</Button>
              <Button disabled={cerrado} onClick={() => { setRequisito(r); setDecision('VALIDADO'); setMotivo(''); }}>Validar</Button>
              <Button variant="secondary" disabled={cerrado} onClick={() => { setRequisito(r); setDecision('SUBSANAR'); setMotivo(''); }}>Solicitar corrección</Button>
            </div>}
          </div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Actualizar estado</CardTitle></CardHeader><CardContent className="space-y-4">
          {estados.isError && <ErrorState error={estados.error} onRetry={() => estados.refetch()} />}
          <FormField label="Siguiente estado" required><Select value={codigoEstado} disabled={cerrado || estados.isLoading || estados.isError} onChange={e => setCodigoEstado(e.target.value)}>
            <option value="">— Seleccione un estado —</option>
            {(estados.data ?? []).filter(e => e.codigoEstado && !['APR', 'RECH', 'REC'].includes(e.codigoEstado)).map(e => <option key={e.idEstado} value={e.codigoEstado}>{e.nombreEstado} ({e.codigoEstado})</option>)}
          </Select></FormField>
          <FormField label="Observación para el historial" required><Textarea maxLength={255} value={observacion} disabled={cerrado} onChange={e => setObservacion(e.target.value)} placeholder="Describa el motivo real del cambio de estado" /></FormField>
          <Button disabled={cerrado || !codigoEstado || !observacion.trim() || cambiarEstado.isPending} onClick={() => cambiarEstado.mutate()}>Registrar cambio de estado</Button>
          <p className="text-sm">Las resoluciones finales se registran desde Seguimiento. Solicitar una corrección documental deja su motivo en el historial ciudadano.</p>
        </CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Documentos del expediente</CardTitle></CardHeader><CardContent className="space-y-2">
        {archivos.isLoading ? <LoadingState message="Consultando documentos..." /> : archivos.isError ? <ErrorState error={archivos.error} onRetry={() => archivos.refetch()} /> : !archivos.data?.length ? <p>No hay documentos adjuntos.</p> : archivos.data.map(a => <div key={a.idArchivoAdjunto} className="flex justify-between gap-3 border-b py-2">
          <span>{a.nombreOriginal} · {a.nombreRequisito || 'Documento complementario'}</span>
          <div className="flex flex-wrap gap-2">
            {puedeVisualizar(a.nombreOriginal || '') && <Button variant="secondary" disabled={cargandoVista} onClick={() => visualizar(a.idArchivoAdjunto, a.nombreOriginal!)}>Visualizar</Button>}
            <Button variant="secondary" disabled={descargando} onClick={() => descargar(a.idArchivoAdjunto, a.nombreOriginal || 'documento')}>Descargar</Button>
          </div>
        </div>)}
      </CardContent></Card>
    </>}
    <Modal open={Boolean(vista) || cargandoVista} onClose={cerrarVista} title={vista?.nombre || 'Cargando documento...'} maxWidth="max-w-4xl">
      {cargandoVista ? <LoadingState message="Cargando vista previa..." /> : vista && <div className="space-y-3">
        {vista.imagen
          ? <img src={vista.url} alt={vista.nombre} className="mx-auto max-h-[65vh] max-w-full object-contain" />
          : <iframe src={vista.url} title={`Vista previa de ${vista.nombre}`} className="h-[65vh] w-full rounded border" />}
        <p className="text-sm">Si el navegador no muestra el documento, cierre esta ventana y use Descargar.</p>
      </div>}
    </Modal>
    <Modal open={Boolean(requisito)} onClose={() => { if (!guardarRevision.isPending) setRequisito(null); }} title={decision === 'VALIDADO' ? 'Validar documento' : 'Solicitar corrección'}>
      <div className="space-y-4"><p>{requisito?.nombreRequisito}</p><p className="text-sm break-all">Archivo: {requisito?.nombreOriginal}</p>
        <FormField label="Justificación" required><Textarea maxLength={255} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Indique qué revisó o qué debe corregir el solicitante" /></FormField>
        <Button disabled={!motivo.trim() || guardarRevision.isPending} onClick={() => guardarRevision.mutate()}>Confirmar revisión</Button>
      </div>
    </Modal>
  </div>;
}
