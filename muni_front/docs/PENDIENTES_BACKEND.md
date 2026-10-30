# Pendientes, Limitaciones y Hallazgos del Backend — SIGEMUN (`muni-back`)

De conformidad con las reglas del proyecto (**prohibición absoluta de modificar `muni-back/` o `BaseDeDatos/`**), en este documento se registran de forma transparente todos los hallazgos técnicos, discrepancias de permisos y funcionalidades de base de datos que no cuentan con exposición en la Web API actual.

---

## 1. Bloqueos Arquitectónicos y de Seguridad

### 1.1 Ausencia de Autenticación y Endpoints para el Portal Ciudadano (Wireframe 2, PDF p. 113)
- **Descripción del requerimiento documental:** La página 113 del documento académico (`Municipalidad Nicoya G-04 Documentación.pdf`) define el wireframe **"PORTAL CIUDADANO EN LÍNEA - Oficina virtual municipal"**, donde un contribuyente/ciudadano consulta sus trámites en curso, sus bienes inmuebles, su estado de cuenta tributario, descarga comprobantes PDF, sube requisitos faltantes y realiza pagos por SINPE Móvil.
- **Estado real en `muni-back` y `BaseDeDatos`:**
  1. La tabla `dbo.Usuario` y el procedimiento `dbo.sp_autenticar_usuario` autentican exclusivamente **funcionarios municipales** (vinculados obligatoriamente a `dbo.Departamento` y `dbo.Rol_Usuario`).
  2. La tabla `dbo.Contribuyente` no posee credenciales de acceso ni vínculo con `dbo.Usuario`.
  3. Todos los endpoints de `TramiteController`, `InmuebleController`, `TributoDeudaController` y `FacturacionPagoController` exigen roles internos (`Admin`, `Analista`, `Cajero`).
- **Manejo en `muni_front`:**
  - Cumpliendo la directriz estricta (*"No utilizar endpoints administrativos para simular un portal ciudadano. Si el portal ciudadano requiere una autenticación que no está implementada, documentar el bloqueo"*), se implementó la pantalla `/portal-ciudadano` respetando fielmente la estructura del wireframe de la página 113, incorporando un **banner institucional de bloqueo técnico** que explica la ausencia de autenticación ciudadana en la API y evita consumir endpoints administrativos para simular autoservicio.

---

## 2. Discrepancias de Autorización por Rol (`[Authorize]`)

### 2.1 `Analista de Plataforma y Trámites` sin acceso a `ContribuyenteController` ni `UsuarioController`
- **Archivo afectado:** `muni-back/MunicipalidadAPI/Controllers/ContribuyenteController.cs` (línea 11).
- **Detalle técnico:** `ContribuyenteController` tiene `[Authorize(Roles = "Administrador del Sistema,Cajero de Recaudación")]`. Sin embargo, `TramiteController` (`POST /api/tramite`) e `InmuebleController` (`POST /api/inmueble/{id}/derechos`) están autorizados para `"Analista de Plataforma y Trámites"` y requieren obligatoriamente un `idContribuyente`.
- **Impacto:** Cuando un usuario inicia sesión únicamente con el rol `Analista de Plataforma y Trámites` (ej. `analista_curb`), la llamada a `GET /api/contribuyente/buscar` o `GET /api/contribuyente` devuelve `403 Forbidden`.
- **Manejo en `muni_front`:**
  - En las pantallas de Radicación de Trámites e Inmuebles, el frontend intenta cargar/buscar contribuyentes desde `/api/contribuyente/buscar` (lo cual funciona perfectamente para `Administrador del Sistema`). Si la API responde `403 Forbidden` porque el usuario activo es exclusivamente `Analista`, el frontend captura el `403` de forma elegante, extrae los contribuyentes conocidos desde las vistas a las que el Analista sí tiene permiso (`GET /api/inmueble` -> `vw_inmuebles_propietarios` y `GET /api/tramite` -> `vw_tramites_seguimiento`), y permite además ingresar el `ID de Contribuyente` manualmente mostrando un aviso informativo claro.

### 2.2 Discrepancia entre `muni-back/README.md` y los atributos `[Authorize]` reales
- **Detalle técnico:** La tabla de roles de `muni-back/README.md` indica que ciertos controladores son exclusivos de un único rol (ej. `Tramite` solo `Analista`, `FacturacionPago` solo `Cajero`, `RespaldosDba` solo `DBA`). En el código C# real, `Roles.Admin` (`"Administrador del Sistema"`) está incluido en **los 14 controladores**.
- **Manejo en `muni_front`:** El sistema de permisos del frontend (`src/features/auth/permissions.ts`) refleja los contratos reales de los controladores C#, permitiendo que `"Administrador del Sistema"` acceda a todos los módulos autorizados por la API y que cada rol especializado (`Analista`, `Cajero`, `Auditor`, `DBA`) vea exactamente los módulos que el backend le autoriza.

---

## 3. Operaciones de Base de Datos sin Endpoint en la API

### 3.1 Data Warehouse y Procesos ETL (`CU-DW-01` a `CU-DW-05`, PDF p. 120)
- **Estado en BD:** La carpeta `BaseDeDatos/DataWareHouse/` contiene los scripts de creación de `DW_Municipalidad_Nicoya`, tablas dimensionales (`DIM_Tiempo`, `DIM_Distrito`, `DIM_Contribuyente`, `DIM_Tributo`, `DIM_Tipo_Tramite`, `DIM_Departamento`), tablas de hechos (`FACT_Recaudacion_Tributaria`, `FACT_Tramites_Municipales`), procedimientos ETL (`sp_etl_dim_*`, `sp_etl_fact_*`) y vistas analíticas (`vw_dw_*`).
- **Estado en API:** `muni-back` se conecta únicamente a `DB_Municipalidad_Nicoya` y no expone ningún controlador ni endpoint para ejecutar los procedimientos `sp_etl_*` ni consultar `vw_dw_*`.
- **Manejo en `muni_front`:** La pantalla de **Análisis Tributario y Reportes** (`/reportes`, Wireframe p. 120) se alimenta al 100% de los 10 endpoints reales de `ReportesController` (`vw_morosidad_contribuyentes`, `vw_recaudacion_por_tributo`, `vw_recaudacion_por_distrito`, `sp_reporte_*`), y documenta explícitamente que la capa OLAP/ETL reside en SQL Server sin simular botones de carga ETL falsos.

### 3.2 Consulta de Archivos Adjuntos de un Expediente Existente
- **Estado en BD y API:** `TramiteController` permite subir archivos mediante `POST /api/tramite/adjuntar-archivo` y `POST /api/tramite/requisito-presentado`, devolviendo `ArchivoAdjuntadoDto` con la `rutaRelativa` (`uploads/tramites/<guid>.<ext>`). Sin embargo, no existe un endpoint `GET /api/tramite/{idTramite}/archivos` ni `GET /api/tramite/{idTramite}/requisitos-presentados` para listar los archivos adjuntados en sesiones anteriores.
- **Manejo en `muni_front`:** El frontend conserva y muestra en tiempo real los archivos subidos durante la gestión del expediente con enlace directo de descarga (`http://localhost:5080/<rutaRelativa>`), y documenta la falta del endpoint de listado histórico de adjuntos.

### 3.3 Revocación de Roles y Permisos en Matriz RBAC (`RolPermisoController`)
- **Estado en BD y API:** `RolPermisoController` expone `POST /api/rolpermiso/asignar-rol` (`sp_asignar_rol_usuario`) y `POST /api/rolpermiso/asignar-permiso` (`sp_asignar_permiso_rol`), pero no existe procedimiento almacenado ni endpoint `DELETE` para revocar un rol ya asignado a un usuario o quitar un permiso ya concedido a un rol.
- **Manejo en `muni_front`:** En la Matriz de Permisos (`/seguridad/matriz`), los permisos ya concedidos al rol se muestran como activos/bloqueados en base de datos, y el administrador puede marcar nuevos permisos pendientes y guardarlos mediante `POST /api/rolpermiso/asignar-permiso`, informando claramente que la revocación requiere soporte adicional en el backend.

### 3.4 Monitoreo DMV y Mantenimiento de Índices/Estadísticas (`CU-DBA-04`, `CU-DBA-06`)
- **Estado en BD y API:** Los scripts `07_monitoreo_rendimiento_salud_bd.sql` y `10_mantenimiento_indices_estadisticas.sql` son scripts T-SQL administrativos directos y no están encapsulados en endpoints de `RespaldosDbaController`.
- **Manejo en `muni_front`:** La Consola Técnica DBA (`/dba/politicas`, `/dba/respaldos`, `/dba/auditoria`) integra todos los endpoints reales de `RespaldosDbaController` (`estado`, `configuraciones`, `historial`, `backup-full`, `backup-diferencial`, `verificar-integridad`, `simular-restauracion`) e indica qué métricas provienen de `vw_estado_respaldos` y `sp_dba_verificar_integridad_dbcc`.

---

## 4. Requisitos de Despliegue en Base de Datos para el Backend

1. **Ejecución obligatoria de `13_sp_autenticar_usuario.sql` y `14_mejoras_catalogos_output.sql`:**
   - El backend depende de los procedimientos creados en los scripts `13` y `14` de `BaseDeDatos/Database_Backend/`.
   - El usuario semilla `dba_sys` tiene originalmente un hash MD5 de 32 caracteres en `04_datos_semilla.sql`; para autenticarse con `dba_sys` es necesario descomentar y ejecutar el bloque `UPDATE dbo.Usuario SET password_hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' WHERE user_name = 'dba_sys'` incluido al final de `13_sp_autenticar_usuario.sql`.
2. **Parámetros ignorados en SPs de Reportes y Auditoría:**
   - En `SvReportes.cs`, los procedimientos `sp_reporte_contribuyentes_morosos`, `sp_reporte_solicitudes_departamento` y `sp_reporte_eficiencia_tramites` no reciben parámetros en la BD real (a diferencia de lo mencionado en el documento del Hito 2).
   - En `SvAuditoria.cs`, `sp_filtrar_auditoria` filtra por `@tabla_afectada`, `@id_usuario`, `@fecha_inicio` y `@fecha_fin` (no recibe `@id_tipo_accion` ni `@direccion_ip` en el SP, por lo que el filtrado adicional por tipo de acción e IP del wireframe 5 se complementa en el cliente sobre el resultado del endpoint).

