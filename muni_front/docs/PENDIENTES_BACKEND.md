# Pendientes del Backend — estado de resolución

Este documento registraba los hallazgos que el frontend no podía resolver sin tocar `muni-back/` ni `BaseDeDatos/`.
**Todos quedaron resueltos** con el script `BaseDeDatos/Database_Backend/15_portal_ciudadano_dw_monitoreo.sql`
y los cambios correspondientes en la API y en este frontend.

| # | Pendiente | Estado | Solución |
|---|-----------|--------|----------|
| 1.1 | Portal ciudadano sin autenticación (wireframe p. 113) | ✅ Resuelto | Tabla `dbo.Cuenta_Ciudadana`, `sp_activar_cuenta_ciudadana`, `sp_autenticar_ciudadano` y SP `sp_ciudadano_*` que validan que cada recurso pertenezca al contribuyente del token. Endpoints `POST /api/auth/ciudadano/activar`, `POST /api/auth/ciudadano/login` y `api/portal/*`. Frontend en `/portal/login` y `/portal`. |
| 2.1 | Analista sin acceso al padrón | ✅ Resuelto | `ContribuyenteController`: lectura (`GET`) para Admin, Cajero y Analista; escritura (`POST`/`PUT`) solo Admin y Cajero. Permiso `PADRON_LECTURA` en `permissions.ts`. |
| 2.2 | README de roles desactualizado | ✅ Resuelto | `muni-back/README.md` refleja los `[Authorize]` reales (Admin incluido en todos los módulos). |
| 3.1 | Data Warehouse / ETL sin endpoints | ✅ Resuelto | `DataWarehouseController` (`api/datawarehouse/*`) sobre `MunicipalidadNicoyaDataMart2026`. Pantalla `/datawarehouse`. |
| 3.2 | No se podían listar adjuntos de un expediente | ✅ Resuelto | `GET /api/tramite/{id}/archivos` y `GET /api/tramite/{id}/requisitos-estado`. Usados en Revisión y Seguimiento. |
| 3.3 | Sin revocación de roles/permisos | ✅ Resuelto | `DELETE /api/rolpermiso/usuario/{idUsuario}/rol/{idRol}` (impide quitar el último administrador) y `DELETE /api/rolpermiso/rol/{idRol}/permiso/{idPermiso}`. Consulta de permisos por rol y de asignaciones. Matriz y Usuarios permiten revocar. |
| 3.4 | Monitoreo DMV y mantenimiento sin endpoints | ✅ Resuelto | `MonitoreoDbaController` (`api/monitoreodba/*`): resumen, sesiones (con KILL), archivos, fragmentación, ejecutar mantenimiento e historial. Pantalla `/dba/monitoreo`. |

## Requisitos de despliegue

1. Base operativa `MunicipalidadNicoya2026`: scripts `Scripts_Ordinarios/01` a `09` (o el `MASTER`).
2. Scripts del backend, en orden: `Database_Backend/13_sp_autenticar_usuario.sql`, `14_mejoras_catalogos_output.sql`, `15_portal_ciudadano_dw_monitoreo.sql`.
3. Opcional — Data Warehouse: `DataWareHouse/DWH_Structure.sql`, `DWH_ETL.sql`, `DWH_Vistas_Analiticas.sql`. Sin ellos la pantalla de Data Warehouse muestra cómo instalarlo y no falla.
4. Opcional — Plan de mantenimiento (MaintenanceDB / Ola Hallengren): `PlanDeMantenimientoBD/01` a `04`. Sin él, el mantenimiento usa la rutina integrada (REBUILD/REORGANIZE) y el historial aparece vacío.

## Observaciones que se mantienen (no son errores)

- `sp_reporte_contribuyentes_morosos`, `sp_reporte_solicitudes_departamento` y `sp_reporte_eficiencia_tramites` no reciben parámetros en la BD real.
- `sp_filtrar_auditoria` filtra por tabla, usuario y rango de fechas; el filtro por tipo de acción e IP del wireframe 5 se aplica en el cliente.
- El pago SINPE del portal es **simulado**: el ciudadano registra el número de comprobante de una transferencia hecha desde su banco; no hay integración con una pasarela bancaria. La BD rechaza comprobantes repetidos (409) y montos mayores al saldo (400).
