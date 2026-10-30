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
  const [pendingPermissionIds, setPendingPermissionIds] = useState<number[]>([]);

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

  // Permisos ya asignados al rol seleccionado en la BD (según vw_usuarios_roles_permisos)
  const existingPermIdsForRole = useMemo(() => {
    const set = new Set<number>();
    for (const row of matrizQuery.data ?? []) {
      if (row.idRol === selectedRolId && row.idPermiso) {
        set.add(row.idPermiso);
      }
    }
    return set;
  }, [matrizQuery.data, selectedRolId]);

  // Agrupar el catálogo de permisos por Módulo y Acción para construir la matriz (Wireframe 7, p. 117)
  const { modulesList, actionsList, permLookup } = useMemo(() => {
    const modules = new Set<string>();
    const actions = new Set<string>();
    const lookup = new Map<string, number>();

    for (const p of permisosQuery.data ?? []) {
      modules.add(p.modulo);
      actions.add(p.accion.toUpperCase());
      lookup.set(`${p.modulo}::${p.accion.toUpperCase()}`, p.idPermiso);
    }

    return {
      modulesList: Array.from(modules).sort(),
      actionsList: Array.from(actions),
      permLookup: lookup,
    };
  }, [permisosQuery.data]);

  const togglePendingPerm = (idPermiso: number) => {
    if (existingPermIdsForRole.has(idPermiso)) return;
    setPendingPermissionIds((prev) =>
      prev.includes(idPermiso) ? prev.filter((id) => id !== idPermiso) : [...prev, idPermiso]
    );
  };

  const guardarCambiosMut = useMutation({
    mutationFn: async () => {
      if (pendingPermissionIds.length === 0) {
        throw new Error('Seleccione al menos un permiso nuevo para conceder al rol.');
      }
      for (const idPermiso of pendingPermissionIds) {
        await rolPermisoApi.asignarPermiso({
          idRol: selectedRolId,
          idPermiso,
        });
      }
      return pendingPermissionIds.length;
    },
    onSuccess: (count) => {
      toast.success(`Se concedieron ${count} permiso(s) al rol #${selectedRolId} en SQL Server.`);
      setPendingPermissionIds([]);
      queryClient.invalidateQueries({ queryKey: ['rolpermiso'] });
    },
    onError: (err: Error) => toast.error(err.message),
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
    <div className="space-y-6">
      <PageHeader
        title="Centro de Seguridad y Matriz de Permisos (RBAC)"
        subtitle="Configuración de autorizaciones por módulo y acción bajo el Principio de Mínimo Privilegio (Wireframe #7, p. 117)"
        badge="CU-AS-03 a CU-AS-05"
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
              <Plus className="h-4 w-4" /> Nuevo Permiso
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpenRolModal(true)}>
              <Plus className="h-4 w-4" /> Nuevo Rol
            </Button>
            <Button
              size="sm"
              disabled={pendingPermissionIds.length === 0 || guardarCambiosMut.isPending}
              onClick={() => guardarCambiosMut.mutate()}
            >
              {guardarCambiosMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Guardar Cambios de Permisos (
                  {pendingPermissionIds.length})
                </>
              )}
            </Button>
          </>
        }
      />

      {/* Subnavegación superior (Wireframes 6 y 7) */}
      <div className="flex items-center gap-2 border-b border-[#DCE3DE] pb-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/seguridad/usuarios">
            <UserCheck className="h-4 w-4" /> Usuarios y Roles
          </Link>
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link to="/seguridad/matriz">
            <Sliders className="h-4 w-4" /> Matriz de Permisos (RBAC)
          </Link>
        </Button>
      </div>

      {/* Selector de Rol y Nota Técnica */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="w-full sm:w-96">
              <label className="mb-1 block text-xs font-bold text-[#164B35]">
                Seleccionar Rol para Configurar Matriz (<code className="font-mono">sp_consultar_roles</code>)
              </label>
              <Select
                value={selectedRolId}
                onChange={(e) => {
                  setSelectedRolId(Number(e.target.value));
                  setPendingPermissionIds([]);
                }}
              >
                {(rolesQuery.data ?? []).map((r) => (
                  <option key={r.idRol} value={r.idRol}>
                    #{r.idRol} — {r.nombreRol}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-[#B6944A]/40 bg-[#FBF7EE] px-4 py-2.5 text-xs text-[#967736] max-w-xl">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Principio de Mínimo Privilegio:</strong> Marque los permisos adicionales que
                desea conceder a <strong>{activeRolName}</strong> y presione{' '}
                <em>Guardar Cambios de Permisos</em> (<code className="font-mono">POST /api/rolpermiso/asignar-permiso</code>).
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matriz Módulo vs Acción (Wireframe 7, p. 117) */}
      {permisosQuery.isLoading || matrizQuery.isLoading ? (
        <LoadingState message="Construyendo matriz de seguridad RBAC desde SQL Server..." />
      ) : permisosQuery.isError ? (
        <ErrorState error={permisosQuery.error} onRetry={() => permisosQuery.refetch()} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Autorizaciones — {activeRolName}</CardTitle>
            <CardDescription>
              Catálogo oficial de permisos (<code className="font-mono">sp_consultar_permisos</code>)
              cruzado con <code className="font-mono">vw_usuarios_roles_permisos</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#DCE3DE] bg-[#F5F7F4] text-[11px] font-bold uppercase tracking-wider text-[#5A6B61]">
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
                    <tr key={mod} className="hover:bg-[#E8F0EC]/40">
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
                        const isPending = pendingPermissionIds.includes(permId);

                        return (
                          <td key={act} className="px-4 py-3 text-center">
                            {alreadyGranted ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
                                title={`Permiso #${permId} ya concedido en BD`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                              </span>
                            ) : (
                              <label className="inline-flex cursor-pointer items-center justify-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={isPending}
                                  onChange={() => togglePendingPerm(permId)}
                                  className="h-4 w-4 rounded border-[#DCE3DE] text-[#164B35] focus:ring-[#164B35]"
                                />
                                <span className="text-[11px] text-[#5A6B61]">
                                  {isPending ? 'Por guardar' : `Conceder (#${permId})`}
                                </span>
                              </label>
                            )}
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
                Nota: El backend expone <code className="font-mono">sp_asignar_permiso_rol</code>{' '}
                para conceder permisos; no existe endpoint de revocación (<code className="font-mono">DELETE</code>)
                en <code className="font-mono">RolPermisoController</code> (documentado en{' '}
                <code className="font-mono">PENDIENTES_BACKEND.md</code>).
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista Detallada de la Matriz Usuario-Rol-Permiso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Vista Consolidada de Accesos (<code className="font-mono">vw_usuarios_roles_permisos</code>)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-[#DCE3DE]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="sticky top-0 bg-[#F5F7F4] border-b border-[#DCE3DE] font-bold uppercase text-[#5A6B61]">
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
                  <tr key={`${row.idUsuario}-${row.idRol}-${row.idPermiso}-${idx}`}>
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
        title="Registrar Nuevo Rol del Sistema"
        description="Ejecuta POST /api/rolpermiso/rol (dbo.sp_registrar_rol)"
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
        title="Registrar Nuevo Permiso Modular"
        description="Ejecuta POST /api/rolpermiso/permiso (dbo.sp_registrar_permiso)"
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
