# Mapa de Rutas y Control de Acceso (RBAC) — SIGEMUN (`muni_front`)

Todas las rutas privadas están protegidas por `ProtectedRoute.tsx`, que valida tanto la sesión JWT activa como la pertenencia del usuario autenticado a los roles exigidos por los controladores de `muni-back`.

---

## 1. Tabla Completa de Rutas React

| Ruta React | Componente Principal | Wireframe Ref. | Acceso / Roles Autorizados (`Roles.cs`) | Controladores Consumidos |
|---|---|---|---|---|
| `/login` | `LoginPage.tsx` | WF #1 (p. 113, 114, 116) | Público (`AllowAnonymous`) | `AuthController` |
| `/dashboard` | `DashboardPage.tsx` | Panel General | Todos los roles autenticados | `Auth`, `Tramite`, `Inmueble`, `FacturacionPago`, `Reportes`, `Auditoria`, `RespaldosDba`, `Usuario` (según rol) |
| `/portal-ciudadano` | `PortalCiudadanoPage.tsx` | WF #2 (p. 113) | Todos los roles autenticados (página informativa con enlace al portal) | *Ninguno* |
| `/portal/login` | `PortalLoginPage.tsx` | WF #2 (p. 113) | Público (contribuyentes) | `POST /api/auth/ciudadano/login`, `POST /api/auth/ciudadano/activar` |
| `/portal` | `PortalHomePage.tsx` | WF #2 (p. 113) | Token ciudadano (`Ciudadano`) | `GET/POST /api/portal/*` |
| `/datawarehouse` | `DataWarehousePage.tsx` | WF #13 (p. 120) | `Admin`, `Auditor`, `DBA` (ETL: `Admin`, `DBA`) | `GET/POST /api/datawarehouse/*` |
| `/dba/monitoreo` | `DbaMonitoreoPage.tsx` | CU-DBA-04/06 | `Admin`, `DBA` | `GET/POST /api/monitoreodba/*` |
| `/contribuyentes` | `ContribuyentesPage.tsx` | WF #11 (p. 119 sup.) | `Administrador del Sistema`, `Cajero de Recaudación` | `ContribuyenteController` |
| `/inmuebles` | `InmueblesPage.tsx` | WF #11 (p. 119 sup.) | `Administrador del Sistema`, `Analista de Plataforma y Trámites` | `InmuebleController`, `CatalogosInmuebleController`, `ContribuyenteController` (si es Admin) |
| `/tramites/radicar` | `RadicacionTramitePage.tsx` | WF #8 (p. 117 inf.) | `Administrador del Sistema`, `Analista de Plataforma y Trámites` | `TramiteController`, `TipoTramiteController`, `InmuebleController` |
| `/tramites/catalogo` | `CatalogoTramitesPage.tsx` | Complementaria (`CU-TR-01/02`) | `Administrador del Sistema`, `Analista de Plataforma y Trámites` | `TipoTramiteController`, `CatalogosGeneralesController` |
| `/expedientes/revision` | `RevisionExpedientePage.tsx` | WF #9 (p. 118 sup.) | `Administrador del Sistema`, `Analista de Plataforma y Trámites` | `TramiteController`, `TipoTramiteController` |
| `/expedientes/seguimiento` | `SeguimientoExpedientePage.tsx` | WF #10 (p. 118 inf.) | `Administrador del Sistema`, `Analista de Plataforma y Trámites` | `TramiteController` |
| `/pagos` | `PagosMunicipalesPage.tsx` | WF #12 (p. 119 inf.) | `Administrador del Sistema`, `Cajero de Recaudación` | `FacturacionPagoController`, `TributoDeudaController` |
| `/tributos` | `TributosDeudasPage.tsx` | Complementaria (`CU-PC-01..06`) | `Administrador del Sistema`, `Cajero de Recaudación` | `TributoDeudaController`, `FacturacionPagoController`, `ContribuyenteController` |
| `/reportes` | `ReportesAnalisisPage.tsx` | WF #13 (p. 120) | `Administrador del Sistema`, `Auditor Interno` | `ReportesController` |
| `/auditoria` y `/dba/auditoria` | `AuditoriaForensePage.tsx` | WF #5 (p. 115 inf.) | `Administrador del Sistema`, `Auditor Interno`, `DBA Administrador de Base de Datos` | `AuditoriaController` |
| `/seguridad/usuarios` | `UsuariosRolesPage.tsx` | WF #6 (p. 116) | `Administrador del Sistema` | `UsuarioController`, `RolPermisoController`, `CatalogosGeneralesController` |
| `/seguridad/matriz` | `MatrizPermisosPage.tsx` | WF #7 (p. 117 sup.) | `Administrador del Sistema` | `RolPermisoController` |
| `/dba/politicas` | `DbaPoliticasPage.tsx` | WF #3 (p. 114) | `Administrador del Sistema`, `DBA Administrador de Base de Datos` | `RespaldosDbaController` |
| `/dba/respaldos` | `DbaRespaldosPage.tsx` | WF #4 (p. 115 sup.) | `Administrador del Sistema`, `DBA Administrador de Base de Datos` | `RespaldosDbaController` |

---

## 2. Redirección Inicial por Rol (`getDefaultRouteForRoles`)

Al autenticarse en `/login`, el sistema redirige automáticamente al funcionario a su bandeja principal:
- `Administrador del Sistema` -> `/dashboard`
- `Analista de Plataforma y Trámites` -> `/expedientes/seguimiento`
- `Cajero de Recaudación` -> `/pagos`
- `DBA Administrador de Base de Datos` -> `/dba/politicas`
- `Auditor Interno` -> `/reportes`

