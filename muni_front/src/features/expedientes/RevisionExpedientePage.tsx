import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FolderKanban,
  Search,
} from 'lucide-react';
import { catalogosGeneralesApi, tipoTramiteApi, tramiteApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/forms/FormField';

export function RevisionExpedientePage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialId = Number(searchParams.get('id')) || 1;
  const [idTramiteInput, setIdTramiteInput] = useState(String(initialId));
  const [idTramiteActivo, setIdTramiteActivo] = useState<number>(initialId);

  useEffect(() => {
    const pId = Number(searchParams.get('id'));
    if (pId > 0) {
      setIdTramiteInput(String(pId));
      setIdTramiteActivo(pId);
    }
  }, [searchParams]);

  // Panel Derecho del Wireframe: Acción Operativa: Actualizar Estado del Trámite
  const [idEstadoSeleccionado, setIdEstadoSeleccionado] = useState<number>(2);
  const [observacionTecnica, setObservacionTecnica] = useState(
    'Observaciones técnicas pasando a etapa de Inspección de Campo tras cotejo documental satisfactorio.'
  );

  const tramiteQuery = useQuery({
    queryKey: ['tramite', 'revision', idTramiteActivo],
    queryFn: () => tramiteApi.consultar(idTramiteActivo),
    enabled: idTramiteActivo > 0,
  });

  const estadosTramiteQuery = useQuery({
    queryKey: ['catalogos', 'estados-tramite'],
    queryFn: () => catalogosGeneralesApi.estadosTramite(),
  });

  const tiposTramiteQuery = useQuery({
    queryKey: ['tipos-tramite', 'all'],
    queryFn: () => tipoTramiteApi.listar(),
  });

  const tramite = tramiteQuery.data?.[0] ?? null;

  const tipoTramiteMatch = tiposTramiteQuery.data?.find(
    (t) => t.nombreTramite === tramite?.nombreTramite
  );

  const requisitosQuery = useQuery({
    queryKey: ['tipos-tramite', 'requisitos', tipoTramiteMatch?.idTipoTramite],
    queryFn: () => tipoTramiteApi.requisitos(tipoTramiteMatch!.idTipoTramite),
    enabled: Boolean(tipoTramiteMatch?.idTipoTramite),
  });

  const cambiarEstadoMut = useMutation({
    mutationFn: () => {
      if (!observacionTecnica.trim()) {
        throw new Error('Las observaciones técnicas son obligatorias.');
      }
      return tramiteApi.cambiarEstado(idTramiteActivo, {
        idEstado: idEstadoSeleccionado,
        observacion: observacionTecnica.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.message || 'Cambio de estado registrado en el historial del expediente.'
      );
      queryClient.invalidateQueries({ queryKey: ['tramite'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verificarReqMut = useMutation({
    mutationFn: ({ idRequisito, cumplido }: { idRequisito: number; cumplido: boolean }) =>
      tramiteApi.verificarRequisito(idTramiteActivo, { idRequisito, cumplido }),
    onSuccess: (res) => {
      toast.success(res.message || 'Cotejo de requisito registrado en SQL Server.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          tramite
            ? `Expediente ${tramite.numeroExpediente} (${tramite.nombreTramite})`
            : 'Revisión Técnica y Cotejo de Requisitos'
        }
        subtitle="Validación documental de requisitos y actualización operativa del estado del trámite."
        badge={tramite?.estadoActual || 'Cotejo Técnico'}
        icon={<ClipboardCheck className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-28">
              <Input
                type="number"
                min={1}
                value={idTramiteInput}
                onChange={(e) => setIdTramiteInput(e.target.value)}
                placeholder="ID Trámite"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setIdTramiteActivo(Math.max(1, Number(idTramiteInput) || 1))}
            >
              <Search className="h-4 w-4" /> Cargar Expediente
            </Button>
            <Button asChild>
              <Link to={`/tramites/seguimiento?id=${idTramiteActivo}`}>
                <FolderKanban className="h-4 w-4" /> Ver Trazabilidad Completa
              </Link>
            </Button>
          </div>
        }
      />

      {/* FLUJO DE TRABAJO SECUENCIAL (SISTEMA DE EXPEDIENTES SIGEMUN) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] p-3.5 text-xs shadow-xs">
        <Link
          to="/tramites/radicacion"
          className="flex items-center gap-2 text-[#4B5563] hover:text-[#171717] transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#D1D5DB] text-[#4B5563] font-mono text-[11px]">1</span>
          <span>Paso 1: Radicación de Expediente</span>
        </Link>
        <ChevronRight className="hidden sm:block h-4 w-4 text-[#93C5FD]" />
        <div className="flex items-center gap-2 font-bold text-[#1E3A8A]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D4ED8] text-white font-mono text-[11px]">2</span>
          <span>Paso 2: Revisión Técnica y Cotejo</span>
          <Badge variant="blue">Paso Actual</Badge>
        </div>
        <ChevronRight className="hidden sm:block h-4 w-4 text-[#93C5FD]" />
        <Link
          to={`/tramites/seguimiento?id=${idTramiteActivo}`}
          className="flex items-center gap-2 text-[#4B5563] hover:text-[#171717] transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#D1D5DB] text-[#4B5563] font-mono text-[11px]">3</span>
          <span>Paso 3: Seguimiento y Resolución Final</span>
        </Link>
      </div>

      {tramiteQuery.isLoading ? (
        <LoadingState message="Consultando expediente en SQL Server..." />
      ) : tramiteQuery.isError ? (
        <ErrorState error={tramiteQuery.error} onRetry={() => tramiteQuery.refetch()} />
      ) : !tramite ? (
        <EmptyState
          title={`No se encontró el expediente con ID #${idTramiteActivo}`}
          description="Ingrese un ID válido o radique un nuevo expediente."
        />
      ) : (
        <>
          {/* BARRA RESUMEN SUPERIOR EXACTA AL WIREFRAME */}
          <Card>
            <CardContent className="flex flex-col justify-between gap-4 pt-6 sm:flex-row sm:items-center">
              <div className="text-sm">
                <span className="text-[#4B5563]">Ciudadano: </span>
                <strong className="font-bold text-[#171717]">{tramite.contribuyente}</strong>
              </div>
              <div className="text-sm">
                <span className="text-[#4B5563]">Finca ID: </span>
                <strong className="font-mono font-bold text-[#171717]">
                  {tramite.numeroFinca || 'No aplica'}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#1D4ED8]" />
                <span className="text-sm text-[#4B5563]">SLA:</span>
                <Badge variant="blue">{tramite.diasSlaMaximo} días hábiles máx.</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 2 TARJETAS PRINCIPALES DEL WIREFRAME: COTEJO DE REQUISITOS (IZQUIERDA) + ACCIÓN OPERATIVA (DERECHA) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Tarjeta Izquierda: Cotejo de Requisitos */}
            <Card className="lg:col-span-6">
              <CardHeader>
                <CardTitle>Cotejo de Requisitos</CardTitle>
                <CardDescription>
                  Valide cada documento presentado por el ciudadano para el procedimiento{' '}
                  <strong>{tramite.nombreTramite}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!requisitosQuery.data || requisitosQuery.data.length === 0 ? (
                  <p className="text-xs text-[#6B7280]">
                    No se encontraron requisitos configurados para este trámite.
                  </p>
                ) : (
                  requisitosQuery.data.map((req) => (
                    <div
                      key={req.idRequisito}
                      className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#15803D] text-white">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#171717]">
                            {req.nombreRequisito} (PDF validado)
                          </p>
                          <p className="text-[11px] text-[#6B7280]">
                            {req.esObligatorio ? 'Requisito Obligatorio' : 'Requisito Opcional'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          onClick={() =>
                            verificarReqMut.mutate({
                              idRequisito: req.idRequisito,
                              cumplido: false,
                            })
                          }
                        >
                          Pendiente
                        </Button>
                        <Button
                          onClick={() =>
                            verificarReqMut.mutate({
                              idRequisito: req.idRequisito,
                              cumplido: true,
                            })
                          }
                        >
                          Validar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Tarjeta Derecha: Acción Operativa: Actualizar Estado del Trámite */}
            <Card className="lg:col-span-6">
              <CardHeader>
                <CardTitle>Acción Operativa: Actualizar Estado del Trámite</CardTitle>
                <CardDescription>
                  Seleccione la siguiente etapa del flujo y registre el dictamen técnico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Seleccionar Siguiente Estado" required>
                  <Select
                    value={idEstadoSeleccionado}
                    onChange={(e) => setIdEstadoSeleccionado(Number(e.target.value))}
                  >
                    {(estadosTramiteQuery.data ?? []).map((est) => (
                      <option key={est.idEstado} value={est.idEstado}>
                        {est.nombreEstado} ({est.codigoEstado})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Observaciones Técnicas (obligatorio)" required>
                  <Textarea
                    value={observacionTecnica}
                    onChange={(e) => setObservacionTecnica(e.target.value)}
                    placeholder="Ingrese las observaciones técnicas..."
                  />
                </FormField>

                <Button
                  className="w-full"
                  disabled={!observacionTecnica.trim() || cambiarEstadoMut.isPending}
                  onClick={() => cambiarEstadoMut.mutate()}
                >
                  {cambiarEstadoMut.isPending
                    ? 'Registrando Cambio...'
                    : 'Registrar Cambio de Estado'}
                </Button>

                <div className="border-t border-[#E5E7EB] pt-3">
                  <Button asChild className="w-full">
                    <Link to={`/tramites/seguimiento?id=${idTramiteActivo}`}>
                      Siguiente Paso: Ir a Seguimiento y Resolución (Paso 3)
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

