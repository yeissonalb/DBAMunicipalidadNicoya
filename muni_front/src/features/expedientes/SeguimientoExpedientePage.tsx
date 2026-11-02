import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tramiteApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';
import { DocumentPreviewButton } from '@/components/common/DocumentPreviewButton';

export function SeguimientoExpedientePage() {
 const qc=useQueryClient(); const [params,setParams]=useSearchParams(); const id=Number(params.get('id')) || 0;
 const [buscar,setBuscar]=useState(''); const [codigo,setCodigo]=useState(''); const [observacion,setObservacion]=useState('');
 const [modal,setModal]=useState(false); const [numero,setNumero]=useState(''); const [resultado,setResultado]=useState(''); const [detalle,setDetalle]=useState('');
 const lista=useQuery({queryKey:['tramite','bandeja-seguimiento'],queryFn:()=>tramiteApi.seguimiento()});
 const consulta=useQuery({queryKey:['tramite','seguimiento',id],queryFn:()=>tramiteApi.consultar(id),enabled:id>0});
 const historial=useQuery({queryKey:['tramite','historial-real',id],queryFn:()=>tramiteApi.historial(id),enabled:id>0});
 const archivos=useQuery({queryKey:['tramite','archivos-seguimiento',id],queryFn:()=>tramiteApi.archivosRevision(id),enabled:id>0});
 const estados=useQuery({queryKey:['catalogos','estados-tramite'],queryFn:()=>tramiteApi.estados()});
 const t=consulta.data?.[0]; const cerrado=Boolean(t?.fechaCierre); const finalSinCierre=!cerrado && /aprobado|rechazado/i.test(t?.estadoActual || '');
 const movimientos=[...(historial.data ?? [])].sort((a,b)=>new Date(b.fechaCambio).getTime()-new Date(a.fechaCambio).getTime() || (b.idHistorial ?? 0)-(a.idHistorial ?? 0));
 const actual=movimientos[0]?.codigoEstado || '';
 useEffect(()=>{setCodigo('');setObservacion('');setModal(false);setNumero('');setResultado('');setDetalle('');},[id]);
 const cambiar=useMutation({mutationFn:()=>tramiteApi.cambiarEstado(id,{codigoEstado:codigo,observaciones:observacion.trim()}),onSuccess:()=>{toast.success('Cambio de estado registrado.');setCodigo('');setObservacion('');qc.invalidateQueries({queryKey:['tramite']});},onError:(e:Error)=>toast.error(e.message)});
 const resolver=useMutation({mutationFn:()=>tramiteApi.emitirResolucion(id,{codigoEstado:resultado as 'APR'|'RECH',numeroResolucion:numero.trim(),detalleResolucion:detalle.trim()}),onSuccess:()=>{toast.success('Resolución formal registrada y expediente cerrado.');setModal(false);qc.invalidateQueries({queryKey:['tramite']});},onError:(e:Error)=>toast.error(e.message)});
 const filtrar=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const encontrados=(lista.data ?? []).filter(t=>filtrar([t.numeroExpediente,t.contribuyente,t.numeroFinca,(t as typeof t & {cedulaSolicitante?:string}).cedulaSolicitante].join(' ')).includes(filtrar(buscar.trim())));
 return <div className="space-y-6">
  <PageHeader title="Seguimiento y trazabilidad" subtitle="Historial real y resolución formal de cada expediente." />
  <Card><CardHeader><CardTitle>Seleccionar expediente</CardTitle></CardHeader><CardContent className="space-y-3">
   <Input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="Expediente, solicitante, cédula o finca" aria-label="Buscar expediente" />
   {lista.isLoading ? <LoadingState message="Consultando expedientes..." /> : lista.isError ? <ErrorState error={lista.error} onRetry={()=>lista.refetch()} /> : <div className="max-h-64 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Expediente</th><th className="p-2">Solicitante</th><th className="p-2">Estado</th><th className="p-2">Acción</th></tr></thead><tbody>{encontrados.map(e=><tr key={e.idTramite} className="border-t"><td className="p-2">{e.numeroExpediente}</td><td className="p-2">{e.contribuyente}</td><td className="p-2">{e.estadoActual}</td><td className="p-2"><Button variant="secondary" onClick={()=>setParams({id:String(e.idTramite)})}>Ver seguimiento</Button></td></tr>)}</tbody></table>{!encontrados.length && <p>No hay resultados.</p>}</div>}
  </CardContent></Card>
  {!id ? <p>Seleccione un expediente.</p> : consulta.isLoading ? <LoadingState message="Cargando expediente..." /> : consulta.isError ? <ErrorState error={consulta.error} onRetry={()=>consulta.refetch()} /> : !t ? <p>No se encontró el expediente.</p> : <>
   <Card><CardHeader><CardTitle>{t.numeroExpediente} · {t.nombreTramite}</CardTitle></CardHeader><CardContent className="space-y-3">
    <p>Solicitante: <strong>{t.contribuyente}</strong> · Finca: {t.numeroFinca || 'No aplica'}</p>
    <Badge variant={cerrado?'success':'blue'}>{t.estadoActual}</Badge>
    {cerrado && <p>Expediente cerrado el {new Date(t.fechaCierre!).toLocaleString('es-CR')}.</p>}
    {finalSinCierre && <p>Estado final sin cierre formal. Debe regularizarse mediante Emitir Resolución.</p>}
    <div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link to={`/tramites/revision?id=${id}`}>Ver revisión y cotejo</Link></Button><Button disabled={cerrado} onClick={()=>{setNumero('');setResultado('');setDetalle('');setModal(true);}}>Emitir resolución</Button></div>
    <div className="grid gap-3 sm:grid-cols-4">{[{code:'REC',nombre:'Radicación'},{code:'REV',nombre:'Revisión técnica'},{code:'EVA',nombre:'Evaluación jurídica'},{code:'FINAL',nombre:'Resolución'}].map(et=>{
     const registrada=movimientos.some(m=>et.code==='FINAL'?['APR','RECH'].includes(m.codigoEstado || ''):m.codigoEstado===et.code);
     const esActual=et.code==='FINAL'?['APR','RECH'].includes(actual):actual===et.code;
     return <div key={et.code} className="rounded border p-3"><p className="font-semibold">{et.nombre}</p><p>{et.code==='FINAL' && cerrado?'Completada':esActual?'Estado actual':registrada?'Registrada en historial':'Sin registro'}</p></div>;
    })}</div>
    <p className="text-xs">Las etapas reflejan registros reales. No se presume una inspección por haber alcanzado otro estado.</p>
   </CardContent></Card>
   <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Historial de cambios</CardTitle></CardHeader><CardContent className="space-y-4">
    {historial.isLoading?<LoadingState message="Consultando historial..." />:historial.isError?<ErrorState error={historial.error} onRetry={()=>historial.refetch()} />:movimientos.map((m,i)=><div key={m.idHistorial ?? i} className="border-l-2 pl-3"><p className="font-semibold">{m.nombreEstado} ({m.codigoEstado})</p><p className="text-xs">{new Date(m.fechaCambio).toLocaleString('es-CR')}</p><p>{m.observaciones}</p></div>)}
   </CardContent></Card><Card><CardHeader><CardTitle>Actualizar estado</CardTitle></CardHeader><CardContent className="space-y-4">
    {estados.isError && <ErrorState error={estados.error} onRetry={()=>estados.refetch()} />}
    <Select value={codigo} disabled={cerrado || finalSinCierre || estados.isLoading} onChange={e=>setCodigo(e.target.value)}><option value="">— Seleccione un estado —</option>{(estados.data ?? []).filter(e=>e.codigoEstado && !['APR','RECH','REC',actual].includes(e.codigoEstado)).map(e=><option key={e.idEstado} value={e.codigoEstado}>{e.nombreEstado} ({e.codigoEstado})</option>)}</Select>
    <Textarea maxLength={255} value={observacion} disabled={cerrado || finalSinCierre} onChange={e=>setObservacion(e.target.value)} placeholder="Motivo real del cambio" />
    <Button disabled={cerrado || finalSinCierre || !codigo || !observacion.trim() || cambiar.isPending} onClick={()=>cambiar.mutate()}>Guardar cambio de estado</Button>
   </CardContent></Card></div>
   <Card><CardHeader><CardTitle>Documentos del expediente</CardTitle></CardHeader><CardContent className="space-y-3">
    {archivos.isLoading?<LoadingState message="Consultando documentos..." />:archivos.isError?<ErrorState error={archivos.error} onRetry={()=>archivos.refetch()} />:!archivos.data?.length?<p>No hay documentos.</p>:archivos.data.map(a=><div key={`${id}-${a.idArchivoAdjunto}`} className="flex flex-wrap justify-between gap-2 border-b py-2"><span>{a.nombreOriginal} · {a.nombreRequisito || 'Adjunto general'}</span><div className="flex gap-2"><DocumentPreviewButton nombre={a.nombreOriginal || ''} obtenerArchivo={()=>tramiteApi.obtenerArchivoBlob(id,a.idArchivoAdjunto)} /><Button variant="secondary" onClick={async()=>{try{await tramiteApi.descargarArchivoBlob(id,a.idArchivoAdjunto,a.nombreOriginal || 'documento');}catch(e){toast.error(e instanceof Error?e.message:'No se pudo descargar.');}}}>Descargar</Button></div></div>)}
   </CardContent></Card>
  </>}
  <Modal open={modal} onClose={()=>{if(!resolver.isPending)setModal(false);}} title={`Resolución formal · ${t?.numeroExpediente || ''}`}><div className="space-y-4">
   <FormField label="Número de resolución" required><Input maxLength={60} value={numero} onChange={e=>setNumero(e.target.value)} /></FormField>
   <FormField label="Resultado" required><Select value={resultado} onChange={e=>setResultado(e.target.value)}><option value="">— Seleccione —</option><option value="APR">Aprobado</option><option value="RECH">Rechazado</option></Select></FormField>
   <FormField label="Fundamento de la resolución" required><Textarea maxLength={170} value={detalle} onChange={e=>setDetalle(e.target.value)} /></FormField>
   <Button disabled={cerrado || !numero.trim() || !resultado || !detalle.trim() || resolver.isPending} onClick={()=>resolver.mutate()}>Emitir resolución oficial</Button>
  </div></Modal>
 </div>;
}
