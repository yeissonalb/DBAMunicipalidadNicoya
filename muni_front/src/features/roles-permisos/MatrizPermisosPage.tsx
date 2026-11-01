import { Fragment, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check,
  CheckCheck,
  Database,
  Eye,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  ROLES,
  SYSTEM_CRUD_MODULES,
  getDefaultRoleCrudPermission,
  getRbacOverrides,
  isRoleCrudAllowed,
  normalizeRoleName,
  saveRbacOverrides,
  type CrudActionCode,
  type CrudModuleKey,
  type RbacOverrideMap,
} from '@/features/auth/permissions';
import { auditoriaApi, rolPermisoApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/common/StateFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/forms/FormField';

const MATRIX_ACTIONS: Array<{
  code: CrudActionCode;
  shortLabel: string;
  label: string;
  sqlVerb: string;
}> = [
  {
    code: 'CONSULTAR',
    shortLabel: 'R · Leer',
    label: 'Consultar / Ver (Read)',
    sqlVerb: 'SELECT',
  },
  {
    code: 'CREAR',
    shortLabel: 'C · Crear',
    label: 'Crear / Registrar (Create)',
    sqlVerb: 'INSERT',
  },
  {
    code: 'MODIFICAR',
    shortLabel: 'U · Editar',
    label: 'Modificar / Actualizar (Update)',
    sqlVerb: 'UPDATE',
  },
  {
    code: 'ELIMINAR',
    shortLabel: 'D · Eliminar',
    label: 'Eliminar / Anular (Delete)',
    sqlVerb: 'DELETE',
  },
];

export function MatrizPermisosPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const isDba = (session?.roles ?? []).some((r) => normalizeRoleName(r) === ROLES.DBA);

  const [selectedRoleName, setSelectedRoleName] = useState<string>(ROLES.ANALISTA_TRAMITES);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [busquedaModulo, setBusquedaModulo] = useState<string>('');
  const [overrides, setOverrides] = useState<RbacOverrideMap>(() => getRbacOverrides());
  const [draftChanges, setDraftChanges] = useState<RbacOverrideMap>({});
  const [openSecurityDialog, setOpenSecurityDialog] = useState(false);

  // Modales de catálogo para crear nuevo rol o permiso en SQL Server
  const [openRolModal, setOpenRolModal] = useState(false);
  const [nuevoNombreRol, setNuevoNombreRol] = useState('');
  const [openPermisoModal, setOpenPermisoModal] = useState(false);
  const [nuevoModulo, setNuevoModulo] = useState<string>('Contribuyentes');
  const [nuevaAccion, setNuevaAccion] = useState<CrudActionCode>('CONSULTAR');

  const rolesQuery = useQuery({
    queryKey: ['seguridad', 'roles'],
    queryFn: () => rolPermisoApi.roles(),
  });

  const permisosQuery = useQuery({
    queryKey: ['seguridad', 'permisos'],
    queryFn: () => rolPermisoApi.permisos(),
  });

  const matrizQuery = useQuery({
    queryKey: ['seguridad', 'matriz'],
    queryFn: () => rolPermisoApi.matriz(),
  });

  useEffect(() => {
    if (rolesQuery.data && rolesQuery.data.length > 0) {
      const exists = rolesQuery.data.some((r) => r.nombreRol === selectedRoleName);
      if (!exists) {
        setSelectedRoleName(rolesQuery.data[0].nombreRol);
      }
    }
  }, [rolesQuery.data, selectedRoleName]);

  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const m of SYSTEM_CRUD_MODULES) {
      set.add(m.category);
    }
    return Array.from(set);
  }, []);

  const modulosFiltrados = useMemo(() => {
    const q = busquedaModulo.trim().toLowerCase();
    return SYSTEM_CRUD_MODULES.filter((m) => {
      const matchCat = categoriaFiltro === 'TODAS' || m.category === categoriaFiltro;
      const matchText =
        !q ||
        m.label.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.key.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [categoriaFiltro, busquedaModulo]);

  const modulosAgrupados = useMemo(() => {
    const map = new Map<string, typeof SYSTEM_CRUD_MODULES>();
    for (const mod of modulosFiltrados) {
      const list = map.get(mod.category) ?? [];
      list.push(mod);
      map.set(mod.category, list);
    }
    return Array.from(map.entries());
  }, [modulosFiltrados]);

  // Usuarios activos que tienen asignado el rol seleccionado
  const activeUsersForRole = useMemo(() => {
    const set = new Set<number>();
    for (const row of matrizQuery.data ?? []) {
      if (row.nombreRol === selectedRoleName && row.usuarioActivo) {
        set.add(row.idUsuario);
      }
    }
    return set.size;
  }, [matrizQuery.data, selectedRoleName]);

  // Determinar si un permiso está activo según borrador + overrides + configuración del rol
  const isPermissionChecked = (
    rolName: string,
    moduloKey: CrudModuleKey,
    accionCode: CrudActionCode
  ): boolean => {
    const canonical = normalizeRoleName(rolName);
    const exactKey = `${rolName}::${moduloKey}::${accionCode}`;
    const canonicalKey = `${canonical}::${moduloKey}::${accionCode}`;

    if (exactKey in draftChanges) return draftChanges[exactKey];
    if (canonicalKey in draftChanges) return draftChanges[canonicalKey];

    return isRoleCrudAllowed(rolName, moduloKey, accionCode, overrides);
  };

  // Determinar si una fila está restringida por segregación de funciones DBA
  const isCellRestricted = (rolName: string, moduloKey: CrudModuleKey): boolean => {
    const modDef = SYSTEM_CRUD_MODULES.find((m) => m.key === moduloKey);
    // Si el usuario actual NO es DBA, no puede alterar los módulos de Gobernanza exclusiva DBA
    if (!isDba && modDef?.dbaExclusiveGovernance) {
      return true;
    }
    // El Cajero por segregación contable nunca debe administrar respaldos del motor SQL Server
    if (
      normalizeRoleName(rolName) === ROLES.CAJERO &&
      (moduloKey === 'DbaPoliticas' || moduloKey === 'DbaRespaldos')
    ) {
      return true;
    }
    return false;
  };

  const setRoleModuleActionDraft = (
    moduloKey: CrudModuleKey,
    accionCode: CrudActionCode,
    nextVal: boolean
  ) => {
    const canonical = normalizeRoleName(selectedRoleName);
    const exactKey = `${selectedRoleName}::${moduloKey}::${accionCode}`;
    const canonicalKey = `${canonical}::${moduloKey}::${accionCode}`;

    setDraftChanges((prev) => ({
      ...prev,
      [exactKey]: nextVal,
      [canonicalKey]: nextVal,
    }));
  };

  const handleToggleCell = (moduloKey: CrudModuleKey, accionCode: CrudActionCode) => {
    if (isCellRestricted(selectedRoleName, moduloKey)) {
      toast.warning(
        'Celda restringida: Solo el Administrador de Base de Datos (DBA) puede gobernar permisos de Motor SQL, Data Warehouse y Auditoría Forense.'
      );
      return;
    }
    const currentVal = isPermissionChecked(selectedRoleName, moduloKey, accionCode);
    const nextVal = !currentVal;

    // Si se habilita CREAR, MODIFICAR o ELIMINAR, habilitar automáticamente CONSULTAR para que el módulo sea visible
    if (nextVal && accionCode !== 'CONSULTAR') {
      setRoleModuleActionDraft(moduloKey, 'CONSULTAR', true);
    }
    // Si se desmarca CONSULTAR, desmarcar también CREAR, MODIFICAR y ELIMINAR de ese módulo
    if (!nextVal && accionCode === 'CONSULTAR') {
      setRoleModuleActionDraft(moduloKey, 'CREAR', false);
      setRoleModuleActionDraft(moduloKey, 'MODIFICAR', false);
      setRoleModuleActionDraft(moduloKey, 'ELIMINAR', false);
    }

    setRoleModuleActionDraft(moduloKey, accionCode, nextVal);
  };

  const handleSetRowPreset = (
    moduloKey: CrudModuleKey,
    preset: 'FULL_CRUD' | 'READ_ONLY' | 'NONE'
  ) => {
    if (isCellRestricted(selectedRoleName, moduloKey)) {
      toast.warning('Este módulo está gobernado exclusivamente por el rol DBA.');
      return;
    }
    for (const act of MATRIX_ACTIONS) {
      const val =
        preset === 'FULL_CRUD'
          ? true
          : preset === 'READ_ONLY'
          ? act.code === 'CONSULTAR'
          : false;
      setRoleModuleActionDraft(moduloKey, act.code, val);
    }
  };

  const handleResetRoleToFactoryDefaults = () => {
    const canonical = normalizeRoleName(selectedRoleName);
    const nextDraft: RbacOverrideMap = { ...draftChanges };
    for (const mod of SYSTEM_CRUD_MODULES) {
      if (isCellRestricted(selectedRoleName, mod.key)) continue;
      for (const act of MATRIX_ACTIONS) {
        const defVal = getDefaultRoleCrudPermission(canonical, mod.key, act.code);
        nextDraft[`${selectedRoleName}::${mod.key}::${act.code}`] = defVal;
        nextDraft[`${canonical}::${mod.key}::${act.code}`] = defVal;
      }
    }
    setDraftChanges(nextDraft);
    toast.info(`Valores por defecto de fábrica preparados para "${selectedRoleName}".`);
  };

  const hasUnsavedChanges = Object.keys(draftChanges).length > 0;

  // Estadísticas de permisos activos para el rol seleccionado
  const roleStats = useMemo(() => {
    let modulosVisibles = 0;
    let totalPermisosActivos = 0;
    for (const mod of SYSTEM_CRUD_MODULES) {
      if (isPermissionChecked(selectedRoleName, mod.key, 'CONSULTAR')) {
        modulosVisibles++;
      }
      for (const act of MATRIX_ACTIONS) {
        if (isPermissionChecked(selectedRoleName, mod.key, act.code)) {
          totalPermisosActivos++;
        }
      }
    }
    return {
      modulosVisibles,
      totalModulos: SYSTEM_CRUD_MODULES.length,
      totalPermisosActivos,
      maxPermisos: SYSTEM_CRUD_MODULES.length * MATRIX_ACTIONS.length,
    };
  }, [selectedRoleName, overrides, draftChanges]);

  const aplicarCambiosMut = useMutation({
    mutationFn: async () => {
      const targetRole = (rolesQuery.data ?? []).find((r) => r.nombreRol === selectedRoleName);
      const allPermisos = permisosQuery.data ?? [];

      // 1. Sincronizar con SQL Server (sp_asignar_permiso_rol) los permisos habilitados que existan en dbo.Permiso
      if (targetRole) {
        for (const [compoundKey, enabled] of Object.entries(draftChanges)) {
          if (!enabled) continue;
          const [rolePart, modKey, accKey] = compoundKey.split('::');
          if (rolePart !== selectedRoleName) continue;
          const matchedPerm = allPermisos.find(
            (p) =>
              p.modulo.toLowerCase().includes(modKey.toLowerCase().slice(0, 5)) &&
              p.accion.toUpperCase().includes(accKey.slice(0, 4))
          );
          if (matchedPerm) {
            try {
              await rolPermisoApi.asignarPermiso({
                idRol: targetRole.idRol,
                idPermiso: matchedPerm.idPermiso,
              });
            } catch {
              // Ignorar si ya estaba asignado en BD
            }
          }
        }
      }

      // 2. Guardar estado en la matriz institucional activa y notificar en vivo a Sidebar, Dashboard y Rutas
      const nextOverrides: RbacOverrideMap = {
        ...overrides,
        ...draftChanges,
      };
      saveRbacOverrides(nextOverrides);
      setOverrides(nextOverrides);

      try {
        await auditoriaApi.registrar({
          tablaAfectada: 'Rol_Permiso',
          idRegistroAfectado: String(targetRole?.idRol ?? 0),
          codigoAccion: 'UPDATE',
          valoresAnteriores: JSON.stringify({ rol: selectedRoleName, estado: 'Previo' }),
          valoresNuevos: JSON.stringify(draftChanges),
        });
      } catch {
        // Continuar si la bitácora no requiere registro adicional
      }
    },
    onSuccess: () => {
      toast.success(
        `Matriz CRUD actualizada para "${selectedRoleName}". La visibilidad de módulos y acciones se actualizó inmediatamente.`
      );
      setDraftChanges({});
      setOpenSecurityDialog(false);
      queryClient.invalidateQueries({ queryKey: ['seguridad'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setOpenSecurityDialog(false);
    },
  });

  const registrarRolMut = useMutation({
    mutationFn: () => rolPermisoApi.registrarRol({ nombreRol: nuevoNombreRol.trim() }),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Rol creado'} (ID #${res.data})`);
      setNuevoNombreRol('');
      setOpenRolModal(false);
      queryClient.invalidateQueries({ queryKey: ['seguridad'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const registrarPermisoMut = useMutation({
    mutationFn: () =>
      rolPermisoApi.registrarPermiso({
        modulo: nuevoModulo.trim(),
        accion: nuevaAccion.trim().toUpperCase(),
      }),
    onSuccess: (res) => {
      toast.success(`${res.message || 'Permiso creado'} (ID #${res.data})`);
      setOpenPermisoModal(false);
      queryClient.invalidateQueries({ queryKey: ['seguridad'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centro de Seguridad y Gobernanza — Matriz de Permisos CRUD (RBAC)"
        subtitle="Control granular de Consultar (R), Crear (C), Modificar (U) y Eliminar/Anular (D) sobre las 17 operaciones del sistema. Cada rol solo ve los módulos donde tiene activo 'Consultar'."
        badge={isDba ? 'Modo Gobernanza DBA' : 'Modo Administración del Sistema'}
        icon={<Lock className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['seguridad'] })}
            >
              <RefreshCw className="h-4 w-4" /> Sincronizar SQL
            </Button>
            <Button variant="secondary" onClick={() => setOpenPermisoModal(true)}>
              <Plus className="h-4 w-4" /> Nuevo Permiso BD
            </Button>
            <Button variant="secondary" onClick={() => setOpenRolModal(true)}>
              <Plus className="h-4 w-4" /> Nuevo Rol BD
            </Button>
          </>
        }
      />

      {/* Aviso de Gobernanza Compartida Admin / DBA */}
      <div className="flex flex-col justify-between gap-3 rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-xs text-[#1E3A8A] sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-5 w-5 shrink-0 text-[#1D4ED8]" />
          <div>
            <p className="font-bold">
              Visibilidad Estricta por Rol y Gobernanza de Base de Datos
            </p>
            <p className="mt-0.5 text-[#1E3A8A]/90">
              Si desmarca la columna <strong>Consultar / Ver (R)</strong> en cualquier módulo, ese
              módulo desaparece inmediatamente del menú lateral y del panel principal para ese rol.
              Los módulos de <strong>Data Warehouse</strong>, <strong>Auditoría Forense</strong> y{' '}
              <strong>Respaldos SQL Server</strong> son gobernados exclusivamente por el{' '}
              <strong>DBA</strong>.
            </p>
          </div>
        </div>
        <Badge variant={isDba ? 'success' : 'blue'}>
          {isDba ? 'DBA Autorizado en Todo' : 'Admin (BD gobernada por DBA)'}
        </Badge>
      </div>

      {/* Selector de Rol, Filtros de Módulo y Acciones de Seguridad */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Rol a Parametrizar:">
                <Select
                  value={selectedRoleName}
                  onChange={(e) => {
                    setSelectedRoleName(e.target.value);
                    setDraftChanges({});
                  }}
                >
                  {(rolesQuery.data ?? []).map((r) => (
                    <option key={r.idRol} value={r.nombreRol}>
                      {r.nombreRol}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Filtrar por Área / Categoría:">
                <Select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  <option value="TODAS">Todas las áreas ({SYSTEM_CRUD_MODULES.length} módulos)</option>
                  {categoriasDisponibles.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Buscar Operación o Módulo:">
                <SearchInput
                  value={busquedaModulo}
                  onChange={setBusquedaModulo}
                  placeholder="Ej. Inmuebles, Facturación, DBA..."
                />
              </FormField>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleResetRoleToFactoryDefaults}
              >
                <RotateCcw className="h-4 w-4" /> Valores de Fábrica
              </Button>
              <Button
                variant="secondary"
                disabled={!hasUnsavedChanges}
                onClick={() => {
                  setDraftChanges({});
                  toast.info('Cambios en borrador descartados.');
                }}
              >
                Descartar Borrador
              </Button>
              <Button
                disabled={!hasUnsavedChanges}
                onClick={() => setOpenSecurityDialog(true)}
              >
                <ShieldCheck className="h-4 w-4" /> Aplicar Cambios ({Object.keys(draftChanges).length / 2})
              </Button>
            </div>
          </div>

          {/* Resumen de cobertura CRUD del rol seleccionado */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue">
                <Eye className="h-3.5 w-3.5" /> {roleStats.modulosVisibles} de{' '}
                {roleStats.totalModulos} Módulos Visibles para {selectedRoleName}
              </Badge>
              <Badge variant="neutral">
                <CheckCheck className="h-3.5 w-3.5" /> {roleStats.totalPermisosActivos} de{' '}
                {roleStats.maxPermisos} Privilegios CRUD Activos
              </Badge>
              <Badge variant="neutral">
                <Users className="h-3.5 w-3.5" /> {activeUsersForRole} Usuarios con este Rol
              </Badge>
            </div>
            <Badge variant={hasUnsavedChanges ? 'warning' : 'success'}>
              {hasUnsavedChanges
                ? 'Estado: Modificado — Pendiente de Confirmación en 3 Pasos'
                : 'Estado: Sincronizado y Activo'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabla Completa de la Matriz de Permisos CRUD (17 Módulos x 4 Operaciones CRUD) */}
      {matrizQuery.isLoading ? (
        <LoadingState message="Cargando matriz de seguridad RBAC desde SQL Server..." />
      ) : matrizQuery.isError ? (
        <ErrorState error={matrizQuery.error} onRetry={() => matrizQuery.refetch()} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Matriz CRUD Completa por Módulo y Operación — Rol: {selectedRoleName}
            </CardTitle>
            <CardDescription>
              Active o desactive los permisos de <strong>Consultar (Read)</strong>,{' '}
              <strong>Crear (Create)</strong>, <strong>Modificar (Update)</strong> y{' '}
              <strong>Eliminar/Anular (Delete)</strong> para cada entidad del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                    <th className="min-w-[290px] px-5 py-3.5">
                      Módulo / Entidad del Sistema ({modulosFiltrados.length})
                    </th>
                    {MATRIX_ACTIONS.map((act) => (
                      <th key={act.code} className="min-w-[165px] px-3 py-3.5 text-center">
                        <div className="font-bold text-[#171717]">{act.label}</div>
                        <div className="mt-0.5 font-mono text-[10px] text-[#1D4ED8]">
                          {act.shortLabel} ({act.sqlVerb})
                        </div>
                      </th>
                    ))}
                    <th className="min-w-[150px] px-4 py-3.5 text-right">Atajo de Fila</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {modulosAgrupados.map(([categoryName, mods]) => (
                    <Fragment key={categoryName}>
                      <tr className="bg-[#0F172A] text-white">
                        <td
                          colSpan={6}
                          className="px-5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#93C5FD]"
                        >
                          {categoryName} ({mods.length} módulos)
                        </td>
                      </tr>
                      {mods.map((mod) => {
                        const restrictedRow = isCellRestricted(selectedRoleName, mod.key);
                        const isVisibleForRole = isPermissionChecked(
                          selectedRoleName,
                          mod.key,
                          'CONSULTAR'
                        );

                        return (
                          <tr
                            key={mod.key}
                            className={`transition-colors ${
                              isVisibleForRole ? 'bg-white hover:bg-[#F8FAFC]' : 'bg-[#F8FAFC]/60'
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-[#171717]">
                                  {mod.label}
                                </span>
                                {mod.dbaExclusiveGovernance && (
                                  <Badge variant="blue" className="text-[10px]">
                                    Gobernanza DBA
                                  </Badge>
                                )}
                                <Badge variant={isVisibleForRole ? 'success' : 'neutral'}>
                                  {isVisibleForRole ? 'Visible en Menú' : 'Oculto para este Rol'}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-[11px] text-[#6B7280]">{mod.subtitle}</p>
                            </td>

                            {MATRIX_ACTIONS.map((act) => {
                              const checked = isPermissionChecked(
                                selectedRoleName,
                                mod.key,
                                act.code
                              );
                              const draftKey = `${selectedRoleName}::${mod.key}::${act.code}`;
                              const isModified = draftKey in draftChanges;
                              const actionDesc = mod.crudDescriptions[act.code];

                              if (restrictedRow) {
                                return (
                                  <td key={act.code} className="px-3 py-3.5 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span
                                        title="Restringido por segregación de funciones / Gobernanza DBA"
                                        className="inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </span>
                                      <span className="max-w-[145px] text-[10px] leading-tight text-[#9CA3AF]">
                                        {actionDesc}
                                      </span>
                                    </div>
                                  </td>
                                );
                              }

                              return (
                                <td key={act.code} className="px-3 py-3.5 text-center">
                                  <div className="flex flex-col items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCell(mod.key, act.code)}
                                      aria-pressed={checked}
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-[8px] border transition-all ${
                                        checked
                                          ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-xs'
                                          : 'border-[#D1D5DB] bg-white text-transparent hover:border-[#1D4ED8]'
                                      } ${isModified ? 'ring-2 ring-[#B45309]/50' : ''}`}
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <span
                                      className={`max-w-[150px] text-[10px] leading-tight ${
                                        checked
                                          ? 'font-semibold text-[#171717]'
                                          : 'text-[#6B7280]'
                                      }`}
                                    >
                                      {actionDesc}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}

                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              {restrictedRow ? (
                                <span className="text-[11px] font-medium text-[#9CA3AF]">
                                  Exclusivo DBA
                                </span>
                              ) : (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    title="Habilitar todo el CRUD de este módulo"
                                    onClick={() => handleSetRowPreset(mod.key, 'FULL_CRUD')}
                                    className="rounded-[6px] border border-[#D1D5DB] bg-white px-2 py-1 text-[10px] font-semibold text-[#171717] hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                                  >
                                    CRUD
                                  </button>
                                  <button
                                    type="button"
                                    title="Dejar únicamente permiso de Lectura (Consultar)"
                                    onClick={() => handleSetRowPreset(mod.key, 'READ_ONLY')}
                                    className="rounded-[6px] border border-[#D1D5DB] bg-white px-2 py-1 text-[10px] font-semibold text-[#1E3A8A] hover:border-[#1D4ED8]"
                                  >
                                    Lectura
                                  </button>
                                  <button
                                    type="button"
                                    title="Revocar todos los permisos y ocultar módulo"
                                    onClick={() => handleSetRowPreset(mod.key, 'NONE')}
                                    className="rounded-[6px] border border-[#FECACA] bg-[#FEF2F2] p-1 text-[#DC2626] hover:bg-[#FEE2E2]"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nota inferior de Mínimo Privilegio */}
      <div className="flex items-start gap-3 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] p-4 text-xs text-[#B45309]">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold">Principio de Mínimo Privilegio (Least Privilege):</p>
          <p className="mt-0.5">
            Los cambios realizados en esta matriz afectan de forma inmediata a los{' '}
            <strong>{activeUsersForRole} usuarios activos</strong> vinculados al rol{' '}
            <strong>{selectedRoleName}</strong>. Cada rol verá únicamente en la barra lateral, en el
            panel principal y dentro de cada pantalla las acciones CRUD aquí habilitadas.
          </p>
        </div>
      </div>

      {/* DIÁLOGO OBLIGATORIO DE 3 PASOS DE ADVERTENCIA DE SEGURIDAD */}
      <ConfirmDialog
        open={openSecurityDialog}
        onClose={() => setOpenSecurityDialog(false)}
        multiStepSecurity
        title={`Aplicar Cambios en la Matriz RBAC — Rol: ${selectedRoleName}`}
        confirmLabel="Aplicar Cambios de Seguridad Definitivamente"
        isPending={aplicarCambiosMut.isPending}
        onConfirm={() => aplicarCambiosMut.mutate()}
        impactSummary={
          <div className="space-y-1.5">
            <p>
              <strong>Rol parametrizado:</strong> {selectedRoleName} ({activeUsersForRole} usuarios
              activos)
            </p>
            <ul className="max-h-44 overflow-y-auto list-disc pl-5 pt-1 text-[11px] text-[#4B5563]">
              {Object.entries(draftChanges)
                .filter(([k]) => k.startsWith(`${selectedRoleName}::`))
                .map(([k, val]) => {
                  const [, mod, acc] = k.split('::');
                  return (
                    <li key={k}>
                      Módulo <strong>{mod}</strong> · Acción <strong>{acc}</strong>:{' '}
                      <span
                        className={val ? 'font-bold text-[#15803D]' : 'font-bold text-[#DC2626]'}
                      >
                        {val ? 'CONCEDER ACCESO' : 'REVOCAR ACCESO'}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        }
      />

      {/* MODAL: CREAR NUEVO ROL */}
      <Modal
        open={openRolModal}
        onClose={() => setOpenRolModal(false)}
        title="Registrar Nuevo Rol en el Catálogo (dbo.Rol)"
      >
        <div className="space-y-4">
          <FormField label="Nombre del Rol" required>
            <Input
              placeholder="Ej. Inspector de Patentes"
              value={nuevoNombreRol}
              onChange={(e) => setNuevoNombreRol(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenRolModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!nuevoNombreRol.trim() || registrarRolMut.isPending}
              onClick={() => registrarRolMut.mutate()}
            >
              Guardar Rol
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CREAR NUEVO PERMISO */}
      <Modal
        open={openPermisoModal}
        onClose={() => setOpenPermisoModal(false)}
        title="Registrar Nuevo Permiso en el Catálogo (dbo.Permiso)"
      >
        <div className="space-y-4">
          <FormField label="Módulo del Sistema" required>
            <Select value={nuevoModulo} onChange={(e) => setNuevoModulo(e.target.value)}>
              {SYSTEM_CRUD_MODULES.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.key} — {m.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Operación CRUD" required>
            <Select
              value={nuevaAccion}
              onChange={(e) => setNuevaAccion(e.target.value as CrudActionCode)}
            >
              <option value="CONSULTAR">CONSULTAR (Leer / Ver)</option>
              <option value="CREAR">CREAR (Registrar)</option>
              <option value="MODIFICAR">MODIFICAR (Editar / Actualizar)</option>
              <option value="ELIMINAR">ELIMINAR (Anular / Eliminar)</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenPermisoModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!nuevoModulo.trim() || registrarPermisoMut.isPending}
              onClick={() => registrarPermisoMut.mutate()}
            >
              Guardar Permiso
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
