import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sliders,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { catalogosGeneralesApi, rolPermisoApi, usuarioApi } from '@/services/api';
import type { SpConsultarUsuarioResultDto } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';


const crearUsuarioSchema = z.object({
  userName: z.string().trim().min(3, 'Mínimo 3 caracteres').max(50),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(200),
  nombreUsuario: z.string().trim().min(1, 'Nombre requerido').max(50),
  apellido1Usuario: z.string().trim().min(1, 'Primer apellido requerido').max(50),
  apellido2Usuario: z.string().trim().min(1, 'Segundo apellido requerido').max(50),
  emailUsuario: z.string().trim().email('Correo electrónico inválido').max(100),
  idDepartamento: z.coerce.number().int().min(1, 'Seleccione un departamento'),
});

const actualizarUsuarioSchema = z.object({
  nombreUsuario: z.string().trim().min(1, 'Nombre requerido').max(50),
  apellido1Usuario: z.string().trim().min(1, 'Primer apellido requerido').max(50),
  apellido2Usuario: z.string().trim().min(1, 'Segundo apellido requerido').max(50),
  emailUsuario: z.string().trim().email('Correo electrónico inválido').max(100),
  idDepartamento: z.coerce.number().int().min(1, 'Seleccione un departamento'),
});

type CrearUsuarioForm = z.infer<typeof crearUsuarioSchema>;
type ActualizarUsuarioForm = z.infer<typeof actualizarUsuarioSchema>;

export function UsuariosRolesPage() {
  const queryClient = useQueryClient();
  const [userNameFilter, setUserNameFilter] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SpConsultarUsuarioResultDto | null>(null);
  const [assignRoleTarget, setAssignRoleTarget] = useState<SpConsultarUsuarioResultDto | null>(null);
  const [selectedRolId, setSelectedRolId] = useState<number>(1);
  const [inspectUserTarget, setInspectUserTarget] = useState<SpConsultarUsuarioResultDto | null>(
    null
  );

  const usuariosQuery = useQuery({
    queryKey: ['usuarios', 'lista', appliedFilter],
    queryFn: () => usuarioApi.consultar(appliedFilter || undefined),
  });

  const departamentosQuery = useQuery({
    queryKey: ['catalogos', 'departamentos'],
    queryFn: () => catalogosGeneralesApi.departamentos(),
  });

  const rolesQuery = useQuery({
    queryKey: ['rolpermiso', 'roles'],
    queryFn: () => rolPermisoApi.listarRoles(),
  });

  // Asignaciones usuario-rol (sp_consultar_asignaciones_roles): incluye roles sin permisos
  const asignacionesQuery = useQuery({
    queryKey: ['rolpermiso', 'asignaciones'],
    queryFn: () => rolPermisoApi.asignaciones(),
  });

  const permisosUsuarioQuery = useQuery({
    queryKey: ['rolpermiso', 'usuario', inspectUserTarget?.idUsuario],
    queryFn: () => rolPermisoApi.rolesPermisosUsuario(inspectUserTarget!.idUsuario),
    enabled: Boolean(inspectUserTarget?.idUsuario),
  });

  // Mapa de roles por usuario
  const rolesPorUsuarioMap = useMemo(() => {
    const map = new Map<number, { idRol: number; nombreRol: string }[]>();
    for (const row of asignacionesQuery.data ?? []) {
      if (!map.has(row.idUsuario)) map.set(row.idUsuario, []);
      map.get(row.idUsuario)!.push({ idRol: row.idRol, nombreRol: row.nombreRol ?? `Rol #${row.idRol}` });
    }
    return map;
  }, [asignacionesQuery.data]);

  const createForm = useForm<CrearUsuarioForm>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      userName: '',
      password: '',
      nombreUsuario: '',
      apellido1Usuario: '',
      apellido2Usuario: '',
      emailUsuario: '',
      idDepartamento: 1,
    },
  });

  const editForm = useForm<ActualizarUsuarioForm>({
    resolver: zodResolver(actualizarUsuarioSchema),
  });

  const crearUsuarioMut = useMutation({
    mutationFn: (dto: CrearUsuarioForm) => usuarioApi.registrar(dto),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Usuario creado'} (ID #${res.data})`);
      setOpenCreateModal(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const actualizarUsuarioMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarUsuarioForm }) =>
      usuarioApi.actualizar(id, dto),
    onSuccess: (res) => {
      toast.success(res.message || 'Usuario actualizado.');
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cambiarEstadoMut = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      usuarioApi.cambiarEstado(id, { activo }),
    onSuccess: (res) => {
      toast.success(res.message || 'Estado del usuario actualizado.');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['rolpermiso'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const asignarRolMut = useMutation({
    mutationFn: ({ idUsuario, idRol }: { idUsuario: number; idRol: number }) =>
      rolPermisoApi.asignarRol({ idUsuario, idRol }),
    onSuccess: (res) => {
      toast.success(res.message || 'Rol asignado exitosamente al funcionario.');
      setAssignRoleTarget(null);
      queryClient.invalidateQueries({ queryKey: ['rolpermiso'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revocarRolMut = useMutation({
    mutationFn: ({ idUsuario, idRol }: { idUsuario: number; idRol: number }) =>
      rolPermisoApi.revocarRol(idUsuario, idRol),
    onSuccess: (res) => {
      toast.success(res.message || 'Rol revocado.');
      queryClient.invalidateQueries({ queryKey: ['rolpermiso'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rolesDelObjetivo = assignRoleTarget
    ? rolesPorUsuarioMap.get(assignRoleTarget.idUsuario) ?? []
    : [];

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Administración de usuarios"
        subtitle="Gestione las cuentas del personal municipal, sus departamentos, estados y roles asignados."
        badge={`${usuariosQuery.data?.length ?? 0} usuarios`}
        icon={<UserCheck className="h-6 w-6" />}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/seguridad/matriz">
                <Sliders className="h-4 w-4" /> Matriz de permisos
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['usuarios'] });
                queryClient.invalidateQueries({ queryKey: ['rolpermiso'] });
              }}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                createForm.reset({
                  userName: '',
                  password: '',
                  nombreUsuario: '',
                  apellido1Usuario: '',
                  apellido2Usuario: '',
                  emailUsuario: '',
                  idDepartamento: departamentosQuery.data?.[0]?.idDepartamento ?? 1,
                });
                setOpenCreateModal(true);
              }}
            >
              <UserPlus className="h-4 w-4" /> Crear usuario
            </Button>
          </>
        }
      />

      {/* Subnavegación superior del Wireframe 6 */}
      <nav className="grid gap-3 rounded-2xl border border-sigemun-border bg-white p-3 shadow-card sm:grid-cols-2" aria-label="Administración de seguridad">
        <Button variant="default" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/seguridad/usuarios">
            <UserCheck className="h-4 w-4" /> Usuarios y roles
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start px-4 py-3" asChild>
          <Link to="/seguridad/matriz">
            <Sliders className="h-4 w-4" /> Matriz de permisos
          </Link>
        </Button>
      </nav>

      {/* Filtro de búsqueda por username (sp_consultar_usuario) */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-sigemun-border bg-sigemun-surface">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-sigemun-primary" /> Buscar usuarios
          </CardTitle>
          <CardDescription>Consulte una cuenta por su nombre de usuario institucional.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-sigemun-text">
                Nombre de usuario
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-sigemun-muted" />
                <Input
                  placeholder="Ej. admin_nicoya, analista_curb, cajero_caja1..."
                  value={userNameFilter}
                  onChange={(e) => setUserNameFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setAppliedFilter(userNameFilter.trim());
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setAppliedFilter(userNameFilter.trim())}>
                <Search className="h-4 w-4" /> Buscar
              </Button>
              {appliedFilter && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setUserNameFilter('');
                    setAppliedFilter('');
                  }}
                >
                  Mostrar Todos
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios (Wireframe 6) */}
      {usuariosQuery.isLoading ? (
        <LoadingState message="Consultando funcionarios municipales en SQL Server..." />
      ) : usuariosQuery.isError ? (
        <ErrorState error={usuariosQuery.error} onRetry={() => usuariosQuery.refetch()} />
      ) : !usuariosQuery.data || usuariosQuery.data.length === 0 ? (
        <EmptyState title="No se encontraron usuarios" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sigemun-border bg-white shadow-card" role="region" aria-label="Usuarios municipales" tabIndex={0}>
          <table className="w-full min-w-[1250px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-sigemun-border bg-sigemun-bg text-[11px] font-bold uppercase tracking-[0.08em] text-sigemun-muted">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Nombre y Apellidos</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Rol(es) Asignados</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sigemun-border">
              {usuariosQuery.data.map((u) => {
                const rolesList = rolesPorUsuarioMap.get(u.idUsuario) ?? [];
                return (
                  <tr key={u.idUsuario} className="even:bg-sigemun-surface transition-colors hover:bg-sigemun-sky-muted/55">
                    <td className="px-4 py-3 font-mono font-bold text-sigemun-primary">
                      #{u.idUsuario}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-sigemun-text">
                      {u.userName}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sigemun-text">
                        {u.nombreUsuario} {u.apellido1Usuario} {u.apellido2Usuario}
                      </p>
                      <p className="text-xs text-sigemun-muted">{u.emailUsuario}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-sigemun-primary">
                      {u.nombreDepartamento}
                    </td>
                    <td className="px-4 py-3">
                      {rolesList.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rolesList.map((r) => (
                            <Badge key={r.idRol} variant="accent">
                              {r.nombreRol}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline">Sin roles</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          cambiarEstadoMut.mutate({ id: u.idUsuario, activo: !u.activo })
                        }
                        disabled={cambiarEstadoMut.isPending}
                        className="inline-flex items-center gap-2"
                        title="Activar o desactivar usuario"
                      >
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            u.activo ? 'bg-sigemun-primary' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              u.activo ? 'translate-x-4' : 'translate-x-1'
                            }`}
                          />
                        </span>
                        <Badge variant={u.activo ? 'success' : 'danger'}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(u);
                            editForm.reset({
                              nombreUsuario: u.nombreUsuario ?? '',
                              apellido1Usuario: u.apellido1Usuario ?? '',
                              apellido2Usuario: u.apellido2Usuario ?? '',
                              emailUsuario: u.emailUsuario ?? '',
                              // sp_consultar_usuario devuelve el nombre del departamento, no su id
                              idDepartamento:
                                departamentosQuery.data?.find(
                                  (d) => d.nombreDepartamento === u.nombreDepartamento
                                )?.idDepartamento ?? 1,
                            });
                          }}
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setAssignRoleTarget(u);
                            setSelectedRolId(rolesQuery.data?.[0]?.idRol ?? 1);
                          }}
                        >
                          <Shield className="h-3.5 w-3.5" /> Asignar Roles
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectUserTarget(u)}
                          title="Consultar roles y permisos efectivos"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CREAR NUEVO USUARIO */}
      <Modal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Crear nuevo usuario municipal"
        description="Registre la cuenta institucional y asigne sus datos básicos de acceso."
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={createForm.handleSubmit((dto) => crearUsuarioMut.mutate(dto))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField
            label="Nombre de Usuario (Login)"
            required
            error={createForm.formState.errors.userName?.message}
          >
            <Input placeholder="Ej. analista_catastro" {...createForm.register('userName')} />
          </FormField>

          <FormField
            label="Contraseña Inicial (mín. 6 caracteres)"
            required
            error={createForm.formState.errors.password?.message}
          >
            <Input type="password" {...createForm.register('password')} />
          </FormField>

          <FormField
            label="Nombre"
            required
            error={createForm.formState.errors.nombreUsuario?.message}
          >
            <Input {...createForm.register('nombreUsuario')} />
          </FormField>

          <FormField
            label="Primer Apellido"
            required
            error={createForm.formState.errors.apellido1Usuario?.message}
          >
            <Input {...createForm.register('apellido1Usuario')} />
          </FormField>

          <FormField
            label="Segundo Apellido"
            required
            error={createForm.formState.errors.apellido2Usuario?.message}
          >
            <Input {...createForm.register('apellido2Usuario')} />
          </FormField>

          <FormField
            label="Departamento Municipal"
            required
            error={createForm.formState.errors.idDepartamento?.message}
          >
            <Select {...createForm.register('idDepartamento')}>
              {(departamentosQuery.data ?? []).map((d) => (
                <option key={d.idDepartamento} value={d.idDepartamento}>
                  {d.nombreDepartamento} ({d.codigoInterno})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Correo Electrónico Institucional"
            required
            className="sm:col-span-2"
            error={createForm.formState.errors.emailUsuario?.message}
          >
            <Input
              type="email"
              placeholder="funcionario@muninicoya.go.cr"
              {...createForm.register('emailUsuario')}
            />
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearUsuarioMut.isPending}>
              {crearUsuarioMut.isPending ? 'Registrando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDITAR USUARIO */}
      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={`Editar usuario #${editingUser?.idUsuario ?? ''} (${editingUser?.userName ?? ''})`}
      >
        {editingUser && (
          <form
            onSubmit={editForm.handleSubmit((dto) =>
              actualizarUsuarioMut.mutate({ id: editingUser.idUsuario, dto })
            )}
            className="space-y-4"
          >
            <FormField
              label="Nombre"
              required
              error={editForm.formState.errors.nombreUsuario?.message}
            >
              <Input {...editForm.register('nombreUsuario')} />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Primer Apellido"
                required
                error={editForm.formState.errors.apellido1Usuario?.message}
              >
                <Input {...editForm.register('apellido1Usuario')} />
              </FormField>
              <FormField
                label="Segundo Apellido"
                required
                error={editForm.formState.errors.apellido2Usuario?.message}
              >
                <Input {...editForm.register('apellido2Usuario')} />
              </FormField>
            </div>

            <FormField
              label="Correo Electrónico"
              required
              error={editForm.formState.errors.emailUsuario?.message}
            >
              <Input type="email" {...editForm.register('emailUsuario')} />
            </FormField>

            <FormField
              label="Departamento"
              required
              error={editForm.formState.errors.idDepartamento?.message}
            >
              <Select {...editForm.register('idDepartamento')}>
                {(departamentosQuery.data ?? []).map((d) => (
                  <option key={d.idDepartamento} value={d.idDepartamento}>
                    {d.nombreDepartamento}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizarUsuarioMut.isPending}>
                {actualizarUsuarioMut.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: ASIGNAR ROL A USUARIO */}
      <Modal
        open={Boolean(assignRoleTarget)}
        onClose={() => setAssignRoleTarget(null)}
        title={`Roles institucionales — ${assignRoleTarget?.userName ?? ''}`}
        description="Asigne un rol nuevo o revoque uno de los roles actuales del funcionario."
      >
        {assignRoleTarget && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-sigemun-text">Roles actuales</p>
              {rolesDelObjetivo.length === 0 ? (
                <p className="text-xs text-sigemun-muted">El funcionario no tiene roles asignados.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {rolesDelObjetivo.map((r) => (
                    <span
                      key={r.idRol}
                      className="inline-flex items-center gap-1 rounded-full border border-sigemun-medium/50 bg-sigemun-bg py-0.5 pl-2.5 pr-1 text-xs font-semibold text-sigemun-primary"
                    >
                      {r.nombreRol}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        title={`Revocar ${r.nombreRol}`}
                        aria-label={`Revocar rol ${r.nombreRol}`}
                        disabled={revocarRolMut.isPending}
                        onClick={() =>
                          revocarRolMut.mutate({
                            idUsuario: assignRoleTarget.idUsuario,
                            idRol: r.idRol,
                          })
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <FormField label="Seleccionar Rol del Catálogo Oficial" required>
              <Select
                value={selectedRolId}
                onChange={(e) => setSelectedRolId(Number(e.target.value))}
              >
                {(rolesQuery.data ?? []).map((r) => (
                  <option key={r.idRol} value={r.idRol}>
                    #{r.idRol} — {r.nombreRol}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignRoleTarget(null)}>
                Cancelar
              </Button>
              <Button
                disabled={asignarRolMut.isPending}
                onClick={() =>
                  asignarRolMut.mutate({
                    idUsuario: assignRoleTarget.idUsuario,
                    idRol: selectedRolId,
                  })
                }
              >
                <Plus className="h-4 w-4" /> Asignar Rol
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: INSPECCIONAR ROLES Y PERMISOS EFECTIVOS DEL USUARIO */}
      <Modal
        open={Boolean(inspectUserTarget)}
        onClose={() => setInspectUserTarget(null)}
        title={`Permisos Efectivos — ${inspectUserTarget?.userName ?? ''}`}
        description="Roles y permisos asignados actualmente a esta cuenta."
      >
        <div className="space-y-3 text-xs">
          {permisosUsuarioQuery.isLoading ? (
            <p className="text-sigemun-muted">Consultando permisos del usuario...</p>
          ) : !permisosUsuarioQuery.data || permisosUsuarioQuery.data.length === 0 ? (
            <p className="text-sigemun-muted">
              Este usuario aún no tiene roles o permisos efectivos asignados.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-sigemun-border rounded-lg border border-sigemun-border">
              {permisosUsuarioQuery.data.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="font-bold text-sigemun-primary">{p.nombreRol}</p>
                    <p className="text-sigemun-muted">
                      Módulo: <strong>{p.modulo || 'General'}</strong>
                    </p>
                  </div>
                  <Badge variant="accent">{p.accion || 'Asignado'}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

