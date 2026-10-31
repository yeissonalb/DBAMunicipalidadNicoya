import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sliders,
  UserCheck,
} from 'lucide-react';
import { rolPermisoApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';

export function MatrizPermisosPage() {
  const queryClient = useQueryClient();
  const [selectedRolId, setSelectedRolId] = useState<number>(1);
  // Cambios pendientes: ids a conceder y a revocar respecto del estado actual en la BD
  const [pendingPermissionIds, setPendingPermissionIds] = useState<number[]>([]);
  const [pendingRevokeIds, setPendingRevokeIds] = useState<number[]>([]);

  const [openRolModal, setOpenRolModal] = useState(false);
  const [nuevoNombreRol, setNuevoNombreRol] = useState('');

  const [openPermisoModal, setOpenPermisoModal] = useState(false);
  const [nuevoModulo, setNuevoModulo] = useState('');
  const [nuevaAccion, setNuevaAccion] = useState('CONSULTAR');

  const rolesQuery = useQuery({
    queryKey: ['rolpermiso', 'roles'],
    queryFn: () => rolPermisoApi.listarRoles(),
  });

  const permisosQuery = useQuery({
    queryKey: ['rolpermiso', 'permisos'],
    queryFn: () => rolPermisoApi.listarPermisos(),
  });

  const matrizQuery = useQuery({
    queryKey: ['rolpermiso', 'matriz'],
    queryFn: () => rolPermisoApi.matriz(),
  });

  // Permisos asignados al rol seleccionado (sp_consultar_permisos_por_rol).
  // Se consulta directo porque vw_usuarios_roles_permisos omite roles sin usuarios.
  const permisosRolQuery = useQuery({
    queryKey: ['rolpermiso', 'permisos-rol', selectedRolId],
    queryFn: () => rolPermisoApi.permisosPorRol(selectedRolId),
  });

  const existingPermIdsForRole = useMemo(
    () => new Set((permisosRolQuery.data ?? []).map((p) => p.idPermiso)),
    [permisosRolQuery.data]
  );

  // Agrupar el catálogo de permisos por Módulo y Acción para construir la matriz (Wireframe 7, p. 117)
  const { modulesList, actionsList, permLookup } = useMemo(() => {
    const modules = new Set<string>();
    const actions = new Set<string>();
    const lookup = new Map<string, number>();

    for (const p of permisosQuery.data ?? []) {
      const modulo = p.modulo ?? '—';
      const accion = (p.accion ?? '').toUpperCase();
      modules.add(modulo);
      actions.add(accion);
      lookup.set(`${modulo}::${accion}`, p.idPermiso);
    }

    return {
      modulesList: Array.from(modules).sort(),
      actionsList: Array.from(actions),
      permLookup: lookup,
    };
  }, [permisosQuery.data]);

  const togglePendingPerm = (idPermiso: number) => {
    const alternar = (prev: number[]) =>
      prev.includes(idPermiso) ? prev.filter((id) => id !== idPermiso) : [...prev, idPermiso];
    if (existingPermIdsForRole.has(idPermiso)) setPendingRevokeIds(alternar);
    else setPendingPermissionIds(alternar);
  };

  const totalPendientes = pendingPermissionIds.length + pendingRevokeIds.length;

  const guardarCambiosMut = useMutation({
    mutationFn: async () => {
      if (totalPendientes === 0) {
        throw new Error('No hay cambios pendientes para este rol.');
      }
      for (const idPermiso of pendingPermissionIds) {
        await rolPermisoApi.asignarPermiso({ idRol: selectedRolId, idPermiso });
      }
      for (const idPermiso of pendingRevokeIds) {
        await rolPermisoApi.revocarPermiso(selectedRolId, idPermiso);
      }
      return { concedidos: pendingPermissionIds.length, revocados: pendingRevokeIds.length };
    },
    onSuccess: ({ concedidos, revocados }) => {
      toast.success(
        `Rol #${selectedRolId}: ${concedidos} permiso(s) concedido(s), ${revocados} revocado(s).`
      );
      setPendingPermissionIds([]);
      setPendingRevokeIds([]);
      queryClient.invalidateQueries({ queryKey: ['rolpermiso'] });
    },
    onError: (err: Error) => {
      // Si falló a mitad, refrescar para mostrar lo que sí quedó aplicado
      toast.error(err.message);
      setPendingPermissionIds([]);
      setPendingRevokeIds([]);
      queryClient.invalidateQueries({ queryKey: ['rolpermiso'] });
    },
  });

  const crearRolMut = useMutation({
    mutationFn: () => rolPermisoApi.registrarRol({ nombreRol: nuevoNombreRol.trim() }),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Rol registrado'} (ID #${res.data})`);
      setNuevoNombreRol('');
      setOpenRolModal(false);
      queryClient.invalidateQueries({ queryKey: ['rolpermiso'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const crearPermisoMut = useMutation({
    mutationFn: () =>
      rolPermisoApi.registrarPermiso({
        modulo: nuevoModulo.trim(),
        accion: nuevaAccion.trim(),
      }),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Permiso registrado'} (ID #${res.data})`);
      setNuevoModulo('');
      setOpenPermisoModal(false);
      queryClient.invalidateQueries({ queryKey: ['rolpermiso'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activeRolName =
    rolesQuery.data?.find((r) => r.idRol === selectedRolId)?.nombreRol || `Rol #${selectedRolId}`;

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Centro de seguridad y permisos"
        subtitle="Configure las autorizaciones institucionales por rol, módulo y tipo de acción."
        badge={`${rolesQuery.data?.length ?? 0} roles`}
        icon={<Sliders className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['rolpermiso'] })}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setOpenPermisoModal(true)}>
              <Plus className="h-4 w-4" /> Nuevo permiso
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpenRolModal(true)}>
              <Plus className="h-4 w-4" /> Nuevo rol
            </Button>
            <Button
              size="sm"
              disabled={totalPendientes === 0 || guardarCambiosMut.isPending}
              onClick={() => guardarCambiosMut.mutate()}
            >
              {guardarCambiosMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Guardar cambios ({totalPendientes})
                </>
              )}
            </Button>
          </>
        }
      />

      {/* Subnavegación superior (Wireframes 6 y 7) */}
      <nav className="grid gap-3 rounded-2xl border border-[#DCE3DE] bg-white p-3 shadow-card sm:grid-cols-2" aria-label="Administración de seguridad">
        <Button variant="outline" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/seguridad/usuarios">
            <UserCheck className="h-4 w-4" /> Usuarios y roles
          </Link>
        </Button>
        <Button variant="default" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/seguridad/matriz">
            <Sliders className="h-4 w-4" /> Matriz de permisos
          </Link>
        </Button>
      </nav>

      {/* Selector de Rol y Nota Técnica */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
          <CardTitle className="text-base">Rol en configuración</CardTitle>
          <CardDescription>Seleccione el perfil institucional al que desea conceder permisos.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)] lg:items-center">
            <div className="w-full">
              <label className="mb-2 block text-sm font-semibold text-[#26352D]">
                Rol institucional
              </label>
              <Select
                value={selectedRolId}
                onChange={(e) => {
                  setSelectedRolId(Number(e.target.value));
                  setPendingPermissionIds([]);
                  setPendingRevokeIds([]);
                }}
              >
                {(rolesQuery.data ?? []).map((r) => (
                  <option key={r.idRol} value={r.idRol}>
                    #{r.idRol} — {r.nombreRol}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-[#B6944A]/40 bg-[#FBF7EE] p-4 text-sm text-[#735A26]">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                <strong>Principio de mínimo privilegio:</strong> conceda únicamente las acciones
                necesarias para <strong>{activeRolName}</strong> y guarde los cambios pendientes.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matriz Módulo vs Acción (Wireframe 7, p. 117) */}
      {permisosQuery.isLoading || permisosRolQuery.isLoading ? (
        <LoadingState message="Construyendo matriz de seguridad RBAC desde SQL Server..." />
      ) : permisosQuery.isError || permisosRolQuery.isError ? (
        <ErrorState
          error={permisosQuery.error ?? permisosRolQuery.error}
          onRetry={() => {
            permisosQuery.refetch();
            permisosRolQuery.refetch();
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
            <CardTitle>Matriz de autorizaciones · {activeRolName}</CardTitle>
            <CardDescription>Permisos disponibles por módulo y acción institucional.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <div className="overflow-x-auto" role="region" aria-label="Matriz de autorizaciones" tabIndex={0}>
              <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                    <th className="px-4 py-3">Módulo del Sistema</th>
                    {actionsList.map((act) => (
                      <th key={act} className="px-4 py-3 text-center">
                        {act}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DE]">
                  {modulesList.map((mod) => (
                    <tr key={mod} className="even:bg-[#FAFCFB] transition-colors hover:bg-[#E8F0EC]/55">
                      <td className="px-4 py-3 font-bold text-[#26352D]">{mod}</td>
                      {actionsList.map((act) => {
                        const permId = permLookup.get(`${mod}::${act}`);
                        if (!permId) {
                          return (
                            <td key={act} className="px-4 py-3 text-center text-[#5A6B61]/40">
                              —
                            </td>
                          );
                        }
                        const alreadyGranted = existingPermIdsForRole.has(permId);
                        const isPending = alreadyGranted
                          ? pendingRevokeIds.includes(permId)
                          : pendingPermissionIds.includes(permId);
                        const marcado = alreadyGranted ? !isPending : isPending;
                        const etiqueta = alreadyGranted
                          ? isPending
                            ? 'Por revocar'
                            : 'Activo'
                          : isPending
                            ? 'Por conceder'
                            : `Conceder (#${permId})`;

                        return (
                          <td key={act} className="px-4 py-3 text-center">
                            <label
                              className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 ${
                                alreadyGranted && !isPending
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : alreadyGranted && isPending
                                    ? 'bg-red-100 text-red-800'
                                    : ''
                              }`}
                              title={alreadyGranted ? 'Desmarque para revocar' : 'Marque para conceder'}
                            >
                              <input
                                type="checkbox"
                                checked={marcado}
                                onChange={() => togglePendingPerm(permId)}
                                className="h-4 w-4 rounded border-[#DCE3DE] text-[#164B35] focus:ring-[#164B35]"
                              />
                              <span className="text-[11px] font-semibold">
                                {alreadyGranted && !isPending ? (
                                  <span className="inline-flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> {etiqueta}
                                  </span>
                                ) : (
                                  etiqueta
                                )}
                              </span>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[#5A6B61]">
              <Info className="h-4 w-4 text-[#164B35]" />
              <span>
                Marque una casilla para conceder el permiso o desmarque uno activo para revocarlo.
                Los cambios se aplican en SQL Server al pulsar «Guardar cambios».
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista Detallada de la Matriz Usuario-Rol-Permiso */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
          <CardTitle className="text-base">Accesos asignados</CardTitle>
          <CardDescription>Vista consolidada de usuarios, roles y permisos efectivos.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="max-h-96 overflow-auto" role="region" aria-label="Accesos asignados" tabIndex={0}>
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="sticky top-0 border-b border-[#DCE3DE] bg-[#F4F7F5] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607168]">
                  <th className="px-3 py-2">Usuario</th>
                  <th className="px-3 py-2">Funcionario</th>
                  <th className="px-3 py-2">Departamento</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Módulo</th>
                  <th className="px-3 py-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3DE]">
                {(matrizQuery.data ?? []).map((row, idx) => (
                  <tr key={`${row.idUsuario}-${row.idRol}-${row.idPermiso}-${idx}`} className="even:bg-[#FAFCFB] hover:bg-[#E8F0EC]/55">
                    <td className="px-3 py-2 font-mono font-semibold text-[#164B35]">
                      {row.userName}
                    </td>
                    <td className="px-3 py-2">{row.nombreCompleto}</td>
                    <td className="px-3 py-2 text-[#5A6B61]">{row.nombreDepartamento}</td>
                    <td className="px-3 py-2">
                      <Badge variant="gold">{row.nombreRol}</Badge>
                    </td>
                    <td className="px-3 py-2 font-medium">{row.modulo}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">{row.accion}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL: NUEVO ROL */}
      <Modal
        open={openRolModal}
        onClose={() => setOpenRolModal(false)}
        title="Registrar nuevo rol"
        description="Cree un perfil institucional para agrupar permisos."
      >
        <div className="space-y-4">
          <FormField label="Nombre del Rol" required>
            <Input
              maxLength={50}
              placeholder="Ej. Inspector de Patentes"
              value={nuevoNombreRol}
              onChange={(e) => setNuevoNombreRol(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenRolModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!nuevoNombreRol.trim() || crearRolMut.isPending}
              onClick={() => crearRolMut.mutate()}
            >
              {crearRolMut.isPending ? 'Registrando...' : 'Registrar Rol'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: NUEVO PERMISO */}
      <Modal
        open={openPermisoModal}
        onClose={() => setOpenPermisoModal(false)}
        title="Registrar nuevo permiso"
        description="Defina el módulo y la acción que podrá autorizarse a los roles."
      >
        <div className="space-y-4">
          <FormField label="Módulo del Sistema" required>
            <Input
              maxLength={50}
              placeholder="Ej. Inmuebles, Trámites, Facturación..."
              value={nuevoModulo}
              onChange={(e) => setNuevoModulo(e.target.value)}
            />
          </FormField>
          <FormField label="Acción Autorizada" required>
            <Select value={nuevaAccion} onChange={(e) => setNuevaAccion(e.target.value)}>
              <option value="CONSULTAR">CONSULTAR</option>
              <option value="CREAR">CREAR</option>
              <option value="MODIFICAR">MODIFICAR</option>
              <option value="ANULAR">ANULAR</option>
              <option value="EJECUTAR">EJECUTAR</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenPermisoModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!nuevoModulo.trim() || crearPermisoMut.isPending}
              onClick={() => crearPermisoMut.mutate()}
            >
              {crearPermisoMut.isPending ? 'Registrando...' : 'Registrar Permiso'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
