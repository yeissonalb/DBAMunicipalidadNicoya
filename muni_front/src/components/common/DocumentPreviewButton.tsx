import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface Props { nombre: string; obtenerArchivo: () => Promise<Blob>; }
export function DocumentPreviewButton({ nombre, obtenerArchivo }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const solicitud = useRef(0);
  const extension = nombre.split('.').pop()?.toLowerCase() || '';
  const tipos: Record<string, string> = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
  useEffect(() => () => { solicitud.current += 1; }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const cerrar = () => { solicitud.current += 1; setAbierto(false); setUrl(null); setCargando(false); };
  const abrir = async () => {
    const actual = ++solicitud.current;
    setAbierto(true); setCargando(true); setUrl(null);
    try {
      const archivo = await obtenerArchivo();
      if (actual !== solicitud.current) return;
      setUrl(URL.createObjectURL(new Blob([archivo], { type: tipos[extension] })));
    } catch (e) {
      if (actual === solicitud.current) {
        setAbierto(false);
        toast.error(e instanceof Error ? e.message : 'No se pudo visualizar el documento.');
      }
    } finally { if (actual === solicitud.current) setCargando(false); }
  };
  if (!tipos[extension]) return null;
  return <>
    <Button type="button" variant="secondary" disabled={cargando} onClick={abrir}>Visualizar</Button>
    <Modal open={abierto} onClose={cerrar} title={nombre} maxWidth="max-w-4xl">
      {cargando ? <p>Cargando documento...</p> : url && <div className="space-y-3">
        {extension === 'pdf'
          ? <iframe src={url} title={`Vista previa de ${nombre}`} className="h-[65vh] w-full rounded border" />
          : <img src={url} alt={nombre} className="mx-auto max-h-[65vh] max-w-full object-contain" />}
        <p className="text-sm">Si su navegador no muestra el archivo, cierre esta ventana y use Descargar.</p>
      </div>}
    </Modal>
  </>;
}
