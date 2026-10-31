import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Edit3,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { catalogosGeneralesApi, rolPermisoApi, usuarioApi } from '@/services/api';
import type { SpUsuarioResultDto } from '@/types/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/forms/FormField';

const crearUsuarioSchema = z.object({
  userName: z.string().trim().min(3, 'Mínimo 3 caracteres').max(100),
  passwordTextoPlano: z.string().min(6, 'Mínimo 6 caracteres').max(200),
  nombreFuncionario: z.string().trim().min(3, 'Nombre completo requerido').max(150),
  idDepartamento: z.coerce.number().int().min(1, 'Seleccione un departamento'),
  idRolInicial: z.coerce.number().int().min(1, 'Seleccione el rol a asignar'),
});

const editarUsuarioSchema = z.object({
  nombreFuncionario: z.string().trim().min(3, 'Nombre requerido').max(150),
  idDepartamento: z.coerce.number().int().min(1, 'Seleccione departamento'),
  activo: z.boolean(),
});

type CrearUsuarioForm = z.infer<typeof crearUsuarioSchema>;
type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;

export function UsuariosRolesPage() {
  const queryClient = useQueryClient();
  const [filtroUserName, setFiltroUserName] = useState('');
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SpUsuarioResultDto | null>(null);
  const [assignRoleUser, setAssignRoleUser] = useState<SpUsuarioResultDto | null>(null);
  const [selectedRolId, setSelectedRolId] = useState<number>(1);

  // Confirmación en 3 pasos para cambios de estado o asignación de rol
  const [pendingToggleUser, setPendingToggleUser] = useState<SpUsuarioResultDto | null>(null);
  const [confirmRoleDialogOpen, setConfirmRoleDialogOpen] = useState(false);

  const usuariosQuery = useQuery({
    queryKey: ['usuarios', filtroUserName],
    queryFn: () => usuarioApi.listar(filtroUserName.trim() || undefined),
  });

  const departamentosQuery = useQuery({
    queryKey: ['catalogos', 'departamentos'],
    queryFn: () => catalogosGeneralesApi.departamentos(),
  });

  const rolesQuery = useQuery({
    queryKey: ['seguridad', 'roles'],
    queryFn: () => rolPermisoApi.roles(),
  });

  const matrizQuery = useQuery({
    queryKey: ['seguridad', 'matriz'],
    queryFn: () => rolPermisoApi.matriz(),
  });

  // Mapa de roles por usuario desde vw_usuarios_roles_permisos
  const rolesPorUsuarioMap = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const row of matrizQuery.data ?? []) {
      const prev = map.get(row.idUsuario) ?? [];
      if (row.nombreRol && !prev.includes(row.nombreRol)) {
        prev.push(row.nombreRol);
      }
      map.set(row.idUsuario, prev);
    }
    return map;
  }, [matrizQuery.data]);

  const createForm = useForm<CrearUsuarioForm>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      userName: '',
      passwordTextoPlano: '',
      nombreFuncionario: '',
      idDepartamento: 1,
      idRolInicial: 1,
    },
  });

  const editForm = useForm<EditarUsuarioForm>({
    resolver: zodResolver(editarUsuarioSchema),
  });

  // Crear usuario + asignar rol inicial automáticamente en SQL Server
  const crearUsuarioMut = useMutation({
    mutationFn: async (dto: CrearUsuarioForm) => {
      const res = await usuarioApi.registrar({
        userName: dto.userName,
        passwordTextoPlano: dto.passwordTextoPlano,
        nombreFuncionario: dto.nombreFuncionario,
        idDepartamento: dto.idDepartamento,
      });
      const nuevoIdUsuario = res.data;
      if (nuevoIdUsuario && dto.idRolInicial > 0) {
        await rolPermisoApi.asignarRol({
          idUsuario: nuevoIdUsuario,
          idRol: dto.idRolInicial,
        });
      }
      return nuevoIdUsuario;
    },
    onSuccess: (idUsuario) => {
      toast.success(
        `Usuario #${idUsuario} creado y vinculado a su rol institucional exitosamente.`
      );
      setOpenCreateModal(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['seguridad'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const actualizarUsuarioMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: EditarUsuarioForm }) =>
      usuarioApi.actualizar(id, dto),
    onSuccess: (res) => {
      toast.success(res.message || 'Datos del usuario actualizados.');
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
      setPendingToggleUser(null);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['seguridad'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingToggleUser(null);
    },
  });

  const asignarRolMut = useMutation({
    mutationFn: ({ idUsuario, idRol }: { idUsuario: number; idRol: number }) =>
      rolPermisoApi.asignarRol({ idUsuario, idRol }),
    onSuccess: (res) => {
      toast.success(res.message || 'Rol asignado exitosamente al funcionario.');
      setConfirmRoleDialogOpen(false);
      setAssignRoleUser(null);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['seguridad'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setConfirmRoleDialogOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administración de Usuarios y Roles (RBAC Security Panel)"
        subtitle="Gestione cuentas de funcionarios municipales, departamentos adscritos, estado activo y asignación de roles."
        badge={`${usuariosQuery.data?.length ?? 0} usuarios registrados`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['usuarios'] });
                queryClient.invalidateQueries({ queryKey: ['seguridad'] });
              }}
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/seguridad/matriz-permisos">
                <Lock className="h-4 w-4" /> Matriz de Permisos (RBAC)
              </Link>
            </Button>
            <Button onClick={() => setOpenCreateModal(true)}>
              <Plus className="h-4 w-4" /> Crear Nuevo Usuario
            </Button>
          </>
        }
      />

      {/* Tabla de Usuarios (Exacta al Wireframe de Administración de Usuarios y Roles) */}
      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Funcionarios y Cuentas del Sistema</CardTitle>
            <CardDescription>
              Active o suspenda el acceso mediante el interruptor de estado o asigne roles del
              catálogo oficial.
            </CardDescription>
          </div>
          <div className="w-full sm:w-80">
            <SearchInput
              value={filtroUserName}
              onChange={setFiltroUserName}
              placeholder="Filtrar por usuario (user_name)..."
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {usuariosQuery.isLoading ? (
            <div className="p-6">
              <LoadingState message="Consultando cuentas de usuario en SQL Server..." />
            </div>
          ) : usuariosQuery.isError ? (
            <div className="p-6">
              <ErrorState error={usuariosQuery.error} onRetry={() => usuariosQuery.refetch()} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                    <th className="px-4 py-3.5">ID</th>
                    <th className="px-4 py-3.5">Usuario (user_name)</th>
                    <th className="px-4 py-3.5">Nombre y Apellidos</th>
                    <th className="px-4 py-3.5">Departamento</th>
                    <th className="px-4 py-3.5">Rol Asignado</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {(usuariosQuery.data ?? []).map((u) => {
                    const userRoles = rolesPorUsuarioMap.get(u.idUsuario) ?? [];
                    return (
                      <tr key={u.idUsuario} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#171717]">
                          {u.idUsuario}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-[#1E3A8A]">
                          {u.userName}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#171717]">
                          {u.nombreFuncionario}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="neutral">{u.nombreDepartamento}</Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          {userRoles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {userRoles.map((rol) => (
                                <Badge key={rol} variant="blue">
                                  {rol}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="warning">Sin rol asignado</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {/* Interruptor visual (Switch) como en el Wireframe */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={u.activo}
                            onClick={() => setPendingToggleUser(u)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                              u.activo ? 'bg-[#15803D]' : 'bg-[#D1D5DB]'
                            }`}
                            title={u.activo ? 'Usuario Activo (Clic para desactivar)' : 'Usuario Inactivo (Clic para activar)'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                u.activo ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingUser(u);
                                editForm.reset({
                                  nombreFuncionario: u.nombreFuncionario,
                                  idDepartamento: u.idDepartamento,
                                  activo: u.activo,
                                });
                              }}
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Editar
                            </Button>
                            <Button
                              onClick={() => {
                                setAssignRoleUser(u);
                                if (rolesQuery.data?.[0]) {
                                  setSelectedRolId(rolesQuery.data[0].idRol);
                                }
                              }}
                            >
                              <UserPlus className="h-3.5 w-3.5" /> Asignar Roles
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
        </CardContent>
      </Card>

      {/* Resumen inferior hacia la Matriz de Permisos (Wireframe Admin) */}
      <Card>
        <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#1D4ED8]" /> Matriz de Permisos (RBAC)
            </CardTitle>
            <CardDescription>
              Vista rápida de capacidades por módulo (Consultar, Crear, Modificar, Anular). Para
              parametrizar un rol con el protocolo de 3 advertencias, abra el Centro de Gobernanza.
            </CardDescription>
          </div>
          <Button asChild>
            <Link to="/seguridad/matriz-permisos">Abrir Matriz Completa</Link>
          </Button>
        </CardHeader>
      </Card>

      {/* MODAL: CREAR NUEVO USUARIO + ASIGNAR ROL INICIAL */}
      <Modal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Crear Nuevo Usuario Institucional"
        description="Registra el funcionario en dbo.Usuario (con hash SHA-256) y le asigna su rol inicial en dbo.Usuario_Rol."
      >
        <form
          onSubmit={createForm.handleSubmit((dto) => crearUsuarioMut.mutate(dto))}
          className="space-y-4"
        >
          <FormField
            label="Nombre Completo del Funcionario"
            required
            error={createForm.formState.errors.nombreFuncionario?.message}
          >
            <Input
              placeholder="Ej. María Rodríguez Arias"
              {...createForm.register('nombreFuncionario')}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Usuario (user_name)"
              required
              error={createForm.formState.errors.userName?.message}
            >
              <Input placeholder="Ej. mrodriguez" {...createForm.register('userName')} />
            </FormField>

            <FormField
              label="Contraseña Inicial"
              required
              error={createForm.formState.errors.passwordTextoPlano?.message}
            >
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...createForm.register('passwordTextoPlano')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Departamento Municipal"
              required
              error={createForm.formState.errors.idDepartamento?.message}
            >
              <Select {...createForm.register('idDepartamento')}>
                {(departamentosQuery.data ?? []).map((d) => (
                  <option key={d.idDepartamento} value={d.idDepartamento}>
                    {d.codigoDepartamento} — {d.nombreDepartamento}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Rol Institucional a Asignar"
              required
              error={createForm.formState.errors.idRolInicial?.message}
            >
              <Select {...createForm.register('idRolInicial')}>
                {(rolesQuery.data ?? []).map((r) => (
                  <option key={r.idRol} value={r.idRol}>
                    {r.nombreRol}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearUsuarioMut.isPending}>
              {crearUsuarioMut.isPending ? 'Registrando...' : 'Guardar y Asignar Rol'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDITAR USUARIO */}
      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={`Editar Funcionario — @${editingUser?.userName ?? ''}`}
      >
        {editingUser && (
          <form
            onSubmit={editForm.handleSubmit((dto) =>
              actualizarUsuarioMut.mutate({ id: editingUser.idUsuario, dto })
            )}
            className="space-y-4"
          >
            <FormField
              label="Nombre y Apellidos"
              required
              error={editForm.formState.errors.nombreFuncionario?.message}
            >
              <Input {...editForm.register('nombreFuncionario')} />
            </FormField>

            <FormField
              label="Departamento"
              required
              error={editForm.formState.errors.idDepartamento?.message}
            >
              <Select {...editForm.register('idDepartamento')}>
                {(departamentosQuery.data ?? []).map((d) => (
                  <option key={d.idDepartamento} value={d.idDepartamento}>
                    {d.codigoDepartamento} — {d.nombreDepartamento}
                  </option>
                ))}
              </Select>
            </FormField>

            <label className="flex items-center gap-2 text-sm font-medium text-[#171717]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#D1D5DB] accent-[#171717]"
                {...editForm.register('activo')}
              />
              Usuario Activo
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizarUsuarioMut.isPending}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: SELECCIONAR ROL PARA ASIGNAR */}
      <Modal
        open={Boolean(assignRoleUser) && !confirmRoleDialogOpen}
        onClose={() => setAssignRoleUser(null)}
        title={`Asignar Rol a ${assignRoleUser?.nombreFuncionario ?? ''}`}
        description="Seleccione el rol del catálogo que desea vincular al funcionario."
      >
        {assignRoleUser && (
          <div className="space-y-4">
            <FormField label="Rol del Sistema (dbo.Rol)" required>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setAssignRoleUser(null)}>
                Cancelar
              </Button>
              <Button onClick={() => setConfirmRoleDialogOpen(true)}>
                Continuar con Verificación de Seguridad
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DIÁLOGO DE 3 ADVERTENCIAS DE SEGURIDAD AL ASIGNAR UN ROL */}
      <ConfirmDialog
        open={confirmRoleDialogOpen && Boolean(assignRoleUser)}
        onClose={() => setConfirmRoleDialogOpen(false)}
        multiStepSecurity
        title="Confirmación de Seguridad — Asignación de Rol RBAC"
        confirmLabel="Confirmar Asignación de Rol"
        isPending={asignarRolMut.isPending}
        onConfirm={() => {
          if (assignRoleUser) {
            asignarRolMut.mutate({ idUsuario: assignRoleUser.idUsuario, idRol: selectedRolId });
          }
        }}
        impactSummary={
          assignRoleUser && (
            <div className="space-y-1">
              <p>
                <strong>Funcionario:</strong> {assignRoleUser.nombreFuncionario} (@
                {assignRoleUser.userName})
              </p>
              <p>
                <strong>Rol a conceder:</strong>{' '}
                {rolesQuery.data?.find((r) => r.idRol === selectedRolId)?.nombreRol ??
                  `ID #${selectedRolId}`}
              </p>
            </div>
          )
        }
      />

      {/* DIÁLOGO DE 3 ADVERTENCIAS AL CAMBIAR ESTADO ACTIVO/INACTIVO DE UN USUARIO */}
      <ConfirmDialog
        open={Boolean(pendingToggleUser)}
        onClose={() => setPendingToggleUser(null)}
        multiStepSecurity
        variant={pendingToggleUser?.activo ? 'destructive' : 'default'}
        title={
          pendingToggleUser?.activo
            ? 'Suspender Acceso de Usuario al Sistema'
            : 'Reactivar Acceso de Usuario al Sistema'
        }
        confirmLabel={
          pendingToggleUser?.activo ? 'Suspender Cuenta Definitivamente' : 'Reactivar Cuenta'
        }
        isPending={cambiarEstadoMut.isPending}
        onConfirm={() => {
          if (pendingToggleUser) {
            cambiarEstadoMut.mutate({
              id: pendingToggleUser.idUsuario,
              activo: !pendingToggleUser.activo,
            });
          }
        }}
        impactSummary={
          pendingToggleUser && (
            <div className="space-y-1">
              <p>
                <strong>Usuario afectado:</strong> {pendingToggleUser.nombreFuncionario} (@
                {pendingToggleUser.userName})
              </p>
              <p>
                <strong>Nuevo estado:</strong>{' '}
                {pendingToggleUser.activo ? 'INACTIVO (Acceso denegado)' : 'ACTIVO (Acceso habilitado)'}
              </p>
            </div>
          )
        }
      />
    </div>
  );
}

