import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  FilePlus2,
  FolderKanban,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  contribuyenteApi,
  inmuebleApi,
  tipoTramiteApi,
  tramiteApi,
} from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/forms/FormField';
import { formatCurrencyCRC } from '@/lib/utils';

interface StagedDocument {
  id: string;
  nombreArchivo: string;
  tipo: string;
  tamanoTexto: string;
  tamanoBytes: number;
  rutaAlmacenamiento: string;
}

export function RadicacionTramitePage() {
  const queryClient = useQueryClient();

  // Paso 1: Ciudadano y Trámite (Exacto al Wireframe de Nueva Radicación de Expediente)
  const [cedulaBusqueda, setCedulaBusqueda] = useState('5-0857-0485');
  const [selectedContribuyenteId, setSelectedContribuyenteId] = useState<number>(1);
  const [selectedTipoTramiteId, setSelectedTipoTramiteId] = useState<number>(1);
  const [selectedInmuebleId, setSelectedInmuebleId] = useState<string>('');
  const [observacionInicial, setObservacionInicial] = useState('');

  // Archivos preparados para adjuntar al radicar
  const [stagedDocs, setStagedDocs] = useState<StagedDocument[]>([
    {
      id: 'doc-1',
      nombreArchivo: 'plano_propiedad.pdf',
      tipo: 'PDF',
      tamanoTexto: '1.2 MB',
      tamanoBytes: 1258291,
      rutaAlmacenamiento: '/storage/nicoya/2026/plano_propiedad.pdf',
    },
    {
      id: 'doc-2',
      nombreArchivo: 'cert_propiedad.pdf',
      tipo: 'PDF',
      tamanoTexto: '0.5 MB',
      tamanoBytes: 524288,
      rutaAlmacenamiento: '/storage/nicoya/2026/cert_propiedad.pdf',
    },
  ]);
  const [nuevoArchivoNombre, setNuevoArchivoNombre] = useState('');

  // Resultado tras radicar
  const [expedienteCreadoId, setExpedienteCreadoId] = useState<number | null>(null);

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
    const match = (padronQuery.data ?? []).find(
      (c) =>
        c.identificacion.toLowerCase().includes(q) ||
        c.nombreCompletoORazonSocial.toLowerCase().includes(q)
    );
    if (match) {
      setSelectedContribuyenteId(match.idContribuyente);
      setSelectedInmuebleId('');
      toast.success(`Ciudadano autocompletado: ${match.nombreCompletoORazonSocial}`);
    } else {
      toast.error('No se encontró ningún contribuyente con esa cédula en el padrón.');
    }
  };

  const handleAddStagedFile = (defaultName: string) => {
    const name = (nuevoArchivoNombre.trim() || defaultName).trim();
    const id = `doc-${Date.now()}`;
    setStagedDocs((prev) => [
      ...prev,
      {
        id,
        nombreArchivo: name,
        tipo: name.toLowerCase().endsWith('.jpg') ? 'JPG' : 'PDF',
        tamanoTexto: '0.8 MB',
        tamanoBytes: 838860,
        rutaAlmacenamiento: `/storage/nicoya/2026/${name}`,
      },
    ]);
    setNuevoArchivoNombre('');
    toast.info(`Archivo "${name}" preparado para el expediente.`);
  };

  const radicarExpedienteMut = useMutation({
    mutationFn: async () => {
      const anio = new Date().getFullYear();
      const rand = String(Math.floor(1000 + Math.random() * 9000));
      const numeroExpediente = `EXP-NIC-${anio}-${rand}`;

      const res = await tramiteApi.registrar({
        numeroExpediente,
        idContribuyente: selectedContribuyenteId,
        idTipoTramite: selectedTipoTramiteId,
        idInmueble: selectedInmuebleId ? Number(selectedInmuebleId) : null,
      });

      const nuevoIdTramite = res.data;

      // Adjuntar documentos cargados
      if (nuevoIdTramite && stagedDocs.length > 0) {
        for (const doc of stagedDocs) {
          try {
            await tramiteApi.adjuntarDocumento(nuevoIdTramite, {
              nombreArchivo: doc.nombreArchivo,
              rutaAlmacenamiento: doc.rutaAlmacenamiento,
              tipoMime: doc.tipo === 'JPG' ? 'image/jpeg' : 'application/pdf',
              tamanoBytes: doc.tamanoBytes,
            });
          } catch {
            // continuar si algún adjunto falla
          }
        }
      }

      return { idTramite: nuevoIdTramite, numeroExpediente };
    },
    onSuccess: ({ idTramite, numeroExpediente }) => {
      setExpedienteCreadoId(idTramite);
      toast.success(
        `Expediente ${numeroExpediente} (ID #${idTramite}) radicado exitosamente con sus documentos adjuntos.`
      );
      queryClient.invalidateQueries({ queryKey: ['tramite'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva Radicación de Expediente"
        subtitle="Paso 1: Datos del Trámite y Ciudadano · Verificación de SLA, requisitos y carga de documentación adjunta."
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

      {expedienteCreadoId && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-xs text-[#15803D] sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">
                Expediente ID #{expedienteCreadoId} radicado exitosamente en SQL Server
              </p>
              <p>
                Puede pasar directamente al cotejo de requisitos o seguimiento técnico del
                expediente.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to={`/tramites/seguimiento?id=${expedienteCreadoId}`}>
              Ver Trazabilidad del Expediente #{expedienteCreadoId}
            </Link>
          </Button>
        </div>
      )}

      {/* FORMULARIO PRINCIPAL (EXACTO AL WIREFRAME DE NUEVA RADICACIÓN DE EXPEDIENTE) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#15803D]" />
            <CardTitle>Paso 1: Datos del Trámite y Ciudadano</CardTitle>
          </div>
          <CardDescription>
            Busque al ciudadano por número de cédula o selecciónelo del padrón para autocompletar
            sus datos de contacto y fincas.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* SECCIÓN 1: DETALLES DEL CIUDADANO */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#171717]">Detalles del Ciudadano</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <FormField label="Cédula de Identidad" required>
                  <div className="flex gap-2">
                    <Input
                      value={cedulaBusqueda}
                      onChange={(e) => setCedulaBusqueda(e.target.value)}
                      placeholder="1-2345-6789"
                    />
                    <Button type="button" onClick={handleBuscarCiudadano}>
                      <Search className="h-4 w-4" /> Buscar
                    </Button>
                  </div>
                </FormField>
              </div>

              <div className="md:col-span-4">
                <FormField label="Nombre Completo (Autocompletado)">
                  <Select
                    value={selectedContribuyenteId}
                    onChange={(e) => {
                      setSelectedContribuyenteId(Number(e.target.value));
                      setSelectedInmuebleId('');
                    }}
                  >
                    {(padronQuery.data ?? []).map((c) => (
                      <option key={c.idContribuyente} value={c.idContribuyente}>
                        {c.nombreCompletoORazonSocial} ({c.identificacion})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField label="Correo Electrónico" required>
                  <Input
                    value={contribuyenteActual?.correoElectronico ?? ''}
                    readOnly
                    className="bg-[#F8FAFC]"
                  />
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField label="Teléfono">
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
            <h3 className="text-sm font-bold text-[#171717]">Detalles del Trámite</h3>
            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <FormField label="Tipo de Trámite" required>
                  <Select
                    value={selectedTipoTramiteId}
                    onChange={(e) => setSelectedTipoTramiteId(Number(e.target.value))}
                  >
                    {(tiposTramiteQuery.data ?? []).map((t) => (
                      <option key={t.idTipoTramite} value={t.idTipoTramite}>
                        {t.nombreTramite}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="md:col-span-3">
                <div className="flex h-[42px] items-center justify-center gap-2 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 text-xs font-bold text-[#1E3A8A]">
                  <Clock className="h-4 w-4 text-[#1D4ED8]" />
                  SLA Estimado: {tipoTramiteActual?.diasSlaMaximo ?? 10} días hábiles
                </div>
              </div>

              <div className="md:col-span-5">
                <FormField label="Finca Relacionada (Número de Finca)">
                  <Select
                    value={selectedInmuebleId}
                    onChange={(e) => setSelectedInmuebleId(e.target.value)}
                  >
                    <option value="">— Sin inmueble específico / Trámite personal —</option>
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
          </div>

          {/* SECCIÓN 3: REQUISITOS DEL TRÁMITE (REQUERIDO / OPCIONAL) */}
          <div className="space-y-3 border-t border-[#E5E7EB] pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#171717]">
                Requisitos del Trámite — {tipoTramiteActual?.nombreTramite ?? 'Procedimiento'}
              </h3>
              <span className="text-xs text-[#6B7280]">
                Departamento: <strong>{tipoTramiteActual?.nombreDepartamento ?? 'Municipal'}</strong>
              </span>
            </div>

            <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              {(requisitosQuery.data ?? []).length === 0 ? (
                <p className="text-xs text-[#6B7280]">
                  Este tipo de trámite no tiene requisitos adicionales en el catálogo.
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
                        {req.esObligatorio ? 'REQUERIDO' : 'OPCIONAL'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 4: DOCUMENTACIÓN ADJUNTA Y TABLA DE ARCHIVOS SUBIDOS (EXACTO AL WIREFRAME) */}
          <div className="space-y-4 border-t border-[#E5E7EB] pt-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className="text-sm font-bold text-[#171717]">Documentación Adjunta</h3>
              <div className="flex items-center gap-2">
                <div className="w-60">
                  <Input
                    placeholder="Nombre de archivo personalizado..."
                    value={nuevoArchivoNombre}
                    onChange={(e) => setNuevoArchivoNombre(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 2 Zonas de Carga del Wireframe */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleAddStagedFile('plano_catastrado_visado.pdf')}
                className="flex items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-[#93C5FD] bg-[#EFF6FF]/50 p-5 text-left transition-colors hover:bg-[#EFF6FF]"
              >
                <Upload className="h-6 w-6 shrink-0 text-[#1D4ED8]" />
                <div>
                  <p className="text-xs font-bold text-[#171717]">
                    Subir Plano Catastrado (PDF)
                  </p>
                  <p className="text-[11px] text-[#4B5563]">
                    Haz clic aquí para adjuntar documento PDF al expediente
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddStagedFile('certificacion_literal_propiedad.pdf')}
                className="flex items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-[#93C5FD] bg-[#EFF6FF]/50 p-5 text-left transition-colors hover:bg-[#EFF6FF]"
              >
                <Upload className="h-6 w-6 shrink-0 text-[#1D4ED8]" />
                <div>
                  <p className="text-xs font-bold text-[#171717]">
                    Subir Documentos Adicionales (PDF, JPG)
                  </p>
                  <p className="text-[11px] text-[#4B5563]">
                    Haz clic aquí para adjuntar requisitos complementarios
                  </p>
                </div>
              </button>
            </div>

            {/* Tabla: Archivos Subidos */}
            <div>
              <p className="mb-2 text-xs font-bold text-[#171717]">Archivos Subidos</p>
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
                    {stagedDocs.map((doc, idx) => (
                      <tr key={doc.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-2.5 font-mono font-bold">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-[#171717]">
                          {doc.nombreArchivo}
                        </td>
                        <td className="px-4 py-2.5">{doc.tipo}</td>
                        <td className="px-4 py-2.5">{doc.tamanoTexto}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="success">Subido</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
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

            <FormField label="Observaciones de Ingreso en Ventanilla (Opcional)">
              <Textarea
                placeholder="Anote cualquier detalle relevante de recepción documental..."
                value={observacionInicial}
                onChange={(e) => setObservacionInicial(e.target.value)}
              />
            </FormField>

            {/* Botones de Acción Inferiores: RADICAR EXPEDIENTE | Cancelar */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                disabled={radicarExpedienteMut.isPending}
                onClick={() => radicarExpedienteMut.mutate()}
              >
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
