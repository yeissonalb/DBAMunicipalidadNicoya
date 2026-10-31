# Auditoría Técnica y Funcional del Backend — SIGEMUN (`muni-back`)

**Proyecto:** SIGEMUN — Sistema de Gestión para la Municipalidad de Nicoya  
**Curso:** Administración de Bases de Datos — Hito 3 (UNA, Campus Nicoya)  
**Fecha de auditoría:** Octubre 2026  
**Fuentes inspeccionadas:**
- **Fuente A:** `Municipalidad Nicoya G-04 Documentación.pdf` (264 páginas revisadas íntegramente: requisitos funcionales/administrativos pp. 53–109, diagramas pp. 110–112, wireframes pp. 113–120, casos de uso pp. 120–222, inventario de SP/triggers/funciones/vistas/DW pp. 223–264).
- **Fuente B:** `muni-back/` (.NET 9 / ASP.NET Core Web API, `Program.cs`, 14 controladores, middlewares, servicios, entidades y `tools/entity_columns.json`).
- **Fuente C:** `BaseDeDatos/` (`Scripts_Ordinarios/`, `Database_Backend/` scripts 01–14, `DataWareHouse/`, `PlanDeMantenimientoBD/`).


> **Nota (actualización):** esta auditoría describe el backend *antes* del script `15_portal_ciudadano_dw_monitoreo.sql`. Las limitaciones que menciona (portal ciudadano, acceso del Analista al padrón, listado de adjuntos, revocaciones, Data Warehouse y monitoreo DBA) ya están resueltas; ver [`PENDIENTES_BACKEND.md`](./PENDIENTES_BACKEND.md).

---

## 1. Arquitectura General y Configuración del Backend

| Aspecto | Implementación Real en `muni-back` |
|---|---|
| **Framework** | .NET 9 (`net9.0`), ASP.NET Core Web API + Entity Framework Core 9 (SQL Server) |
| **Puerto por defecto** | `http://localhost:5080` (`https://localhost:7221`) — Base URL API: `http://localhost:5080/api` |
| **Base de datos** | SQL Server — `MunicipalidadNicoya2026` (`DefaultConnection` en `appsettings.json`) |
| **Autenticación** | JWT Bearer (`HS256`, `Issuer: MunicipalidadNicoyaAPI`, `Audience: MunicipalidadNicoyaClient`, expiración por defecto `120` min) |
| **CORS (`ReactApp`)** | Orígenes permitidos en `Program.cs`: `http://localhost:3000` y `http://localhost:5173`, `AllowAnyHeader()`, `AllowAnyMethod()` |
| **Envoltorio de Respuesta** | Todos los endpoints devuelven `BaseResponse<T>`: `{ "success": bool, "message": string, "data": T }` |
| **Manejo de Excepciones SQL** | `SqlExceptionMiddleware` intercepta `SqlException` y traduce códigos `THROW` de negocio a códigos HTTP semánticos |
| **Archivos Estáticos** | `app.UseStaticFiles()` sirve `wwwroot/uploads/tramites/<guid>.<ext>` |

---

## 2. Mecanismo de Autenticación y Roles Reales (`Roles.cs`)

### 2.1 Roles Oficiales en Código (`MunicipalidadAPI/Constantes/Roles.cs`)
Los atributos `[Authorize(Roles = ...)]` validan coincidencia exacta con los nombres de la tabla `dbo.Rol`:

| Constante C# | Valor Exacto en JWT (`ClaimTypes.Role`) | Descripción Operativa |
|---|---|---|
| `Roles.Admin` | `"Administrador del Sistema"` | Acceso administrativo total. **Autorizado en los 14 controladores del backend.** |
| `Roles.Analista` | `"Analista de Plataforma y Trámites"` | Gestión de inmuebles, catálogos de inmueble, tipos de trámite, requisitos y expedientes/trámites. |
| `Roles.Cajero` | `"Cajero de Recaudación"` | Gestión de padrón de contribuyentes, tributos/deudas, facturación y cobro de pagos municipales. |
| `Roles.Auditor` | `"Auditor Interno"` | Consulta de reportes municipales, análisis tributario y centro de auditoría forense. |
| `Roles.Dba` | `"DBA Administrador de Base de Datos"` | Consola técnica DBA (políticas, respaldos FULL/DIFF, DBCC CHECKDB, simulacro de restauración) y auditoría. |

> **Hallazgo clave de auditoría (Discrepancia `README.md` vs Controladores C#):**  
> Aunque `muni-back/README.md` indica que ciertos controladores son exclusivos de `Analista`, `Cajero` o `DBA`, en el código real de los 14 controladores el rol `"Administrador del Sistema"` (`Roles.Admin`) está incluido en **todos** los atributos `[Authorize]`. Adicionalmente, el rol `"Analista de Plataforma y Trámites"` **no** está incluido en `ContribuyenteController` (`[Authorize(Roles = "Administrador del Sistema,Cajero de Recaudación")]`), lo que impide al Analista buscar contribuyentes directamente en `/api/contribuyente/buscar` al radicar un trámite (documentado en `PENDIENTES_BACKEND.md`).

### 2.2 Flujo de Login (`POST /api/auth/login`)
1. Recibe `LoginDto` (`{ username, password }`).
2. `SvAuth` calcula el hash `SHA-256` en hexadecimal minúscula (`PasswordHasher.Sha256`) y ejecuta `dbo.sp_autenticar_usuario` pasando tanto el texto plano (para semillas legadas) como el hash SHA-256.
3. Si el usuario existe y `activo = 1`, consulta `dbo.sp_consultar_roles_permisos_usuario` para obtener todos los roles asignados.
4. Genera el token JWT con claims `sub`, `name`, `email`, `id_usuario`, `id_departamento`, `departamento` y múltiples claims `ClaimTypes.Role`.
5. Devuelve `BaseResponse<LoginResponseDto>`:
   ```json
   {
     "success": true,
     "message": "Inicio de sesión exitoso.",
     "data": {
       "token": "eyJhbG...",
       "expiraUtc": "2026-10-30T03:00:00Z",
       "usuario": {
         "idUsuario": 1,
         "userName": "admin_nicoya",
         "nombreCompleto": "Carlos Alvarado Solano",
         "email": "calvarado@muninicoya.go.cr",
         "idDepartamento": 1,
         "nombreDepartamento": "Alcaldía y Administración General",
         "rol": "Administrador del Sistema",
         "roles": ["Administrador del Sistema"]
       }
     }
   }
   ```

---

## 3. Traducción de Errores (`SqlExceptionMiddleware` y Validaciones)

| Origen / Código SQL | HTTP Status | Estructura de Respuesta | Causa / Regla de Negocio |
|---|---|---|---|
| `ModelState` inválido | `400 Bad Request` | `{ success: false, message: "Uno o más campos no cumplen las validaciones de formato.", data: { Campo: ["error"] } }` | DataAnnotations en DTOs de entrada |
| `50001` – `50020` | `400 Bad Request` | `{ success: false, message: ex.Message, data: { sqlErrorCode } }` | Reglas de negocio (ej. copropiedad > 100%, transición de estado inválida, monto negativo, poder vencido) |
| `547` | `400 Bad Request` | `{ success: false, message: ex.Message, data: { sqlErrorCode: 547 } }` | Violación de `CHECK` o `FOREIGN KEY` en SQL Server |
| `2628`, `8152` | `400 Bad Request` | `{ success: false, message: ex.Message, data: { sqlErrorCode } }` | Longitud de texto excedida |
| `50021` – `50040` | `404 Not Found` | `{ success: false, message: ex.Message, data: { sqlErrorCode } }` | Registro padre o entidad no encontrada (ej. `50021` contribuyente jurídico no existe) |
| `50041` – `50060`, `2627`, `2601` | `409 Conflict` | `{ success: false, message: ex.Message, data: { sqlErrorCode } }` | Duplicado (`UNIQUE` constraint o `THROW 50041/50042/50043` de script 14) |
| `50061` – `50080` | `403 Forbidden` | `{ success: false, message: ex.Message, data: { sqlErrorCode } }` | Operación denegada por regla de seguridad de BD |
| Otros errores SQL | `500 Internal Server Error` | `{ success: false, message: "Error al ejecutar la operación en la base de datos: ...", data: { sqlErrorCode } }` | Error inesperado de motor o ruta de archivo inválida en servidor SQL |

---

## 4. Inventario Completo de Controladores y Endpoints (63 Endpoints)

### 4.1 `AuthController` (`/api/auth`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `POST` | `/api/auth/login` | Público (`[AllowAnonymous]`) | Body: `LoginDto` (`username`: req max 50, `password`: req max 200) | `LoginResponseDto` (`token`, `expiraUtc`, `usuario`) | `sp_autenticar_usuario` + `sp_consultar_roles_permisos_usuario` |
| `GET` | `/api/auth/me` | Cualquier autenticado (`[Authorize]`) | Headers: `Authorization: Bearer` | `UsuarioTokenDto` (`idUsuario`, `userName`, `nombreCompleto`, `email`, `idDepartamento`, `nombreDepartamento`, `rol`, `roles`) | Claims del JWT |

### 4.2 `CatalogosGeneralesController` (`/api/catalogosgenerales`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/catalogosgenerales/departamentos` | Cualquier autenticado (`[Authorize]`) | Ninguno | `SpDepartamentoResultDto[]` (`idDepartamento`, `codigoDepartamento`, `nombreDepartamento`, `descripcion`, `ubicacionFisica`, `telefonoDepartamento`, `correoDepartamento`, `estadoDepartamento`) | `sp_consultar_departamentos` (Script 14) |

### 4.3 `UsuarioController` (`/api/usuario`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/usuario` | `Admin` | Query: `userName?` (string) | `SpConsultarUsuarioResultDto[]` (`idUsuario`, `userName`, `nombreUsuario`, `apellido1Usuario`, `apellido2Usuario`, `emailUsuario`, `activo`, `fechaCreacion`, `idDepartamento`, `nombreDepartamento`) | `sp_consultar_usuario` |
| `POST` | `/api/usuario` | `Admin` | Body: `RegistrarUsuarioDto` (`userName`: req max 50, `password`: req 6..200, `nombreUsuario`: req max 50, `apellido1Usuario`: req max 50, `apellido2Usuario`: req max 50, `emailUsuario`: req email max 100, `idDepartamento`: req >= 1) | `int` (nuevo `idUsuario`) | `sp_registrar_usuario` |
| `PUT` | `/api/usuario/{idUsuario}` | `Admin` | Route: `idUsuario` (int)<br>Body: `ActualizarUsuarioDto` (`nombreUsuario`, `apellido1Usuario`, `apellido2Usuario`, `emailUsuario`, `idDepartamento`) | `object` (`null`) | `sp_actualizar_usuario` |
| `PATCH` | `/api/usuario/{idUsuario}/estado` | `Admin` | Route: `idUsuario` (int)<br>Body: `CambiarEstadoUsuarioDto` (`activo`: bool req) | `object` (`null`) | `sp_cambiar_estado_usuario` |

### 4.4 `RolPermisoController` (`/api/rolpermiso`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/rolpermiso/matriz` | `Admin` | Ninguno | `VwUsuariosRolesPermiso[]` (`idUsuario`, `userName`, `nombreCompleto`, `emailUsuario`, `usuarioActivo`, `nombreDepartamento`, `idRol`, `nombreRol`, `idPermiso`, `modulo`, `accion`) | `vw_usuarios_roles_permisos` |
| `GET` | `/api/rolpermiso/roles` | `Admin` | Ninguno | `SpRolResultDto[]` (`idRol`, `nombreRol`) | `sp_consultar_roles` (Script 14) |
| `GET` | `/api/rolpermiso/permisos` | `Admin` | Ninguno | `SpPermisoResultDto[]` (`idPermiso`, `modulo`, `accion`) | `sp_consultar_permisos` (Script 14) |
| `POST` | `/api/rolpermiso/rol` | `Admin` | Body: `RegistrarRolDto` (`nombreRol`: req max 50) | `int` (`idRol`, 409 si duplicado) | `sp_registrar_rol` |
| `POST` | `/api/rolpermiso/permiso` | `Admin` | Body: `RegistrarPermisoDto` (`modulo`: req max 50, `accion`: req max 20) | `int` (`idPermiso`, 409 si duplicado) | `sp_registrar_permiso` |
| `POST` | `/api/rolpermiso/asignar-rol` | `Admin` | Body: `AsignarRolUsuarioDto` (`idUsuario`: int, `idRol`: int) | `object` (`null`) | `sp_asignar_rol_usuario` |
| `POST` | `/api/rolpermiso/asignar-permiso` | `Admin` | Body: `AsignarPermisoRolDto` (`idRol`: int, `idPermiso`: int) | `object` (`null`) | `sp_asignar_permiso_rol` |
| `GET` | `/api/rolpermiso/usuario/{idUsuario}` | `Admin` | Route: `idUsuario` (int) | `SpRolesPermisosUsuarioResultDto[]` (`idUsuario`, `userName`, `idRol`, `nombreRol`, `idPermiso`, `modulo`, `accion`) | `sp_consultar_roles_permisos_usuario` |

### 4.5 `ContribuyenteController` (`/api/contribuyente`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/contribuyente` | `Admin`, `Cajero` | Ninguno | `VwPadronContribuyente[]` (`idContribuyente`, `tipoContribuyente`, `identificacion`, `nombreCompletoORazonSocial`, `nombreFantasia`, `correoElectronico`, `telefono`, `direccionNotificaciones`, `fechaRegistro`, `estadoContribuyente`) | `vw_padron_contribuyentes` |
| `GET` | `/api/contribuyente/buscar` | `Admin`, `Cajero` | Query: `criterio?` (string max 100) | `SpConsultarContribuyenteResultDto[]` (`idContribuyente`, `correoElectronico`, `telefono`, `direccionNotificaciones`, `fechaRegistro`, `estadoContribuyente`, `tipoPersona`, `identificacion`, `nombreORazonSocial`) | `sp_consultar_contribuyente` |
| `POST` | `/api/contribuyente/fisico` | `Admin`, `Cajero` | Body: `RegistrarContribuyenteFisicoDto` (`cedulaIdentidad`: req max 20, `nombre`: req max 50, `apellido1Fisico`: req max 50, `apellido2Fisico`: req max 50, `fechaNacimiento`: DateTime, `correoElectronico`: req email max 100, `telefono`: req max 20, `direccionNotificaciones`: req max 255) | `int` (`idContribuyente`) | `sp_registrar_contribuyente_fisico` |
| `POST` | `/api/contribuyente/juridico` | `Admin`, `Cajero` | Body: `RegistrarContribuyenteJuridicoDto` (`cedulaJuridica`: req max 20, `razonSocial`: req max 255, `nombreFantasia?`: max 150, `fechaConstitucion`: DateTime, `correoElectronico`: req email max 100, `telefono`: req max 20, `direccionNotificaciones`: req max 255) | `int` (`idContribuyente`) | `sp_registrar_contribuyente_juridico` |
| `PUT` | `/api/contribuyente/{idContribuyente}` | `Admin`, `Cajero` | Route: `idContribuyente` (int)<br>Body: `ActualizarContribuyenteDto` (`correoElectronico`, `telefono`, `direccionNotificaciones`, `estadoContribuyente`: bool) | `object` (`null`) | `sp_actualizar_contribuyente` |
| `POST` | `/api/contribuyente/{idContribuyente}/representante-legal` | `Admin`, `Cajero` | Route: `idContribuyente` (int — id del padrón jurídico)<br>Body: `RegistrarRepresentanteLegalDto` (`nombreRepresentante`, `apellido1Representante`, `apellido2Representante`, `tomoFolioRegistro`, `cedulaRepresentante`, `fechaVencimientoPoder`) | `object` (`null`) | `sp_registrar_representante_legal` (Script 14) |

### 4.6 `InmuebleController` (`/api/inmueble`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/inmueble` | `Admin`, `Analista` | Ninguno | `VwInmueblesPropietario[]` (`idInmueble`, `numeroFinca`, `planoCatastrado`, `direccionExacta`, `areaTerrenoM2`, `areaConstruccionM2`, `valorFiscal`, `fechaRegistroInmueble`, `nombreDistrito`, `tipoUso`, `idContribuyente`, `propietario`, `porcentajeParticipacion`) | `vw_inmuebles_propietarios` |
| `GET` | `/api/inmueble/buscar` | `Admin`, `Analista` | Query: `numeroFinca?` (string), `idDistrito?` (int) | `SpConsultarInmuebleResultDto[]` (`idInmueble`, `numeroFinca`, `planoCatastrado`, `direccionExacta`, `areaTerrenoM2`, `areaConstruccionM2`, `valorFiscal`, `fechaRegistroInmueble`, `nombreDistrito`, `tipoUso`) | `sp_consultar_inmueble` |
| `POST` | `/api/inmueble` | `Admin`, `Analista` | Body: `RegistrarInmuebleDto` (`numeroFinca`: req max 30, `direccionExacta`: req max 255, `areaTerrenoM2`: double > 0, `areaConstruccionM2`: double >= 0, `valorFiscal`: double > 0, `planoCatastrado`: req max 30, `idTipoUsoInmueble`: int >= 1, `idDistrito`: int >= 1) | `int` (`idInmueble`) | `sp_registrar_inmueble` |
| `PUT` | `/api/inmueble/{idInmueble}` | `Admin`, `Analista` | Route: `idInmueble` (int)<br>Body: `ActualizarInmuebleDto` (`direccionExacta`, `areaTerrenoM2`, `areaConstruccionM2`, `valorFiscal`, `planoCatastrado`, `idTipoUsoInmueble`) | `object` (`null`) | `sp_actualizar_inmueble` |
| `POST` | `/api/inmueble/{idInmueble}/derechos` | `Admin`, `Analista` | Route: `idInmueble` (int)<br>Body: `AsignarDerechoInmuebleDto` (`idContribuyente`: int, `porcentajeParticipacion`: double 0.01..100) | `object` (`null`) | `sp_asignar_derecho_inmueble` + trigger `trg_validar_porcentaje_copropiedad` |
| `GET` | `/api/inmueble/contribuyente/{idContribuyente}` | `Admin`, `Analista` | Route: `idContribuyente` (int) | `SpInmueblesPorContribuyenteResultDto[]` (`idInmueble`, `numeroFinca`, `planoCatastrado`, `direccionExacta`, `valorFiscal`, `nombreDistrito`, `tipoUso`, `porcentajeParticipacion`) | `sp_consultar_inmuebles_por_contribuyente` |

### 4.7 `CatalogosInmuebleController` (`/api/catalogosinmueble`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/catalogosinmueble/distritos` | `Admin`, `Analista` | Ninguno | `SpDistritoResultDto[]` (`idDistrito`, `codigoDistrito`, `nombreDistrito`, `areaKm2`, `poblacionEstimada`, `ubicacionCabecera`) | `sp_consultar_distritos` |
| `GET` | `/api/catalogosinmueble/tipos-uso` | `Admin`, `Analista` | Ninguno | `SpTipoUsoInmuebleResultDto[]` (`idTipoUsoInmueble`, `codigoTipoUso`, `descripcionUso`, `permiteActividadComercial`) | `sp_consultar_tipos_uso_inmueble` |

### 4.8 `TipoTramiteController` (`/api/tipotramite`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/tipotramite` | `Admin`, `Analista` | Ninguno | `SpTiposTramiteResultDto[]` (`idTipoTramite`, `nombreTramite`, `descripcionTipo`, `diasResolucionMax`, `idDepartamento`, `nombreDepartamento`) | `sp_consultar_tipos_tramite` |
| `POST` | `/api/tipotramite` | `Admin`, `Analista` | Body: `TipoTramiteDto` (`nombreTramite`: req max 100, `descripcionTipo`: req max 255, `diasResolucionMax`: int 1..365, `idDepartamento`: int >= 1) | `int` (`idTipoTramite`) | `sp_registrar_tipo_tramite` (Script 14) |
| `PUT` | `/api/tipotramite/{idTipoTramite}` | `Admin`, `Analista` | Route: `idTipoTramite` (int)<br>Body: `TipoTramiteDto` | `object` (`null`) | `sp_actualizar_tipo_tramite` |
| `GET` | `/api/tipotramite/requisitos` | `Admin`, `Analista` | Ninguno | `SpRequisitoResultDto[]` (`idRequisito`, `nombreRequisito`, `descripcion`, `esObligatorio`) | `sp_consultar_requisitos` (Script 14) |
| `POST` | `/api/tipotramite/requisito` | `Admin`, `Analista` | Body: `RegistrarRequisitoDto` (`nombreRequisito`: req max 255, `descripcion`: req max 500, `esObligatorio`: bool) | `int` (`idRequisito`) | `sp_registrar_requisito` (Script 14) |
| `POST` | `/api/tipotramite/{idTipoTramite}/requisitos/{idRequisito}` | `Admin`, `Analista` | Route: `idTipoTramite` (int), `idRequisito` (int) | `object` (`null`) | `sp_configurar_requisito_tramite` |
| `GET` | `/api/tipotramite/{idTipoTramite}/requisitos` | `Admin`, `Analista` | Route: `idTipoTramite` (int) | `SpRequisitosTramiteResultDto[]` (`idRequisito`, `nombreRequisito`, `descripcion`, `esObligatorio`) | `sp_consultar_requisitos_por_tipo_tramite` |

### 4.9 `TramiteController` (`/api/tramite`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/tramite` | `Admin`, `Analista` | Ninguno | `VwTramitesSeguimiento[]` (`idTramite`, `numeroExpediente`, `fechaSolicitud`, `fechaCierre`, `nombreTramite`, `diasResolucionMax`, `nombreDepartamento`, `codigoEstado`, `nombreEstado`, `esEstadoFinal`, `idContribuyente`, `contribuyente`, `funcionarioAsignado`, `numeroFinca`, `diasTranscurridos`) | `vw_tramites_seguimiento` |
| `GET` | `/api/tramite/historial-detallado` | `Admin`, `Analista` | Ninguno | `VwHistorialTramitesDetallado[]` (`idHistorialTramite`, `idTramite`, `numeroExpediente`, `nombreTramite`, `fechaCambio`, `observaciones`, `codigoEstado`, `nombreEstado`, `esEstadoFinal`, `contribuyente`) | `vw_historial_tramites_detallado` |
| `GET` | `/api/tramite/buscar` | `Admin`, `Analista` | Query: `numeroExpediente?` (string), `idContribuyente?` (int) | `SpConsultarTramiteResultDto[]` (`idTramite`, `numeroExpediente`, `fechaSolicitud`, `fechaCierre`, `nombreTramite`, `diasResolucionMax`, `funcionarioAsignado`, `idContribuyente`, `numeroFinca`, `ultimoEstado`) | `sp_consultar_tramite` |
| `POST` | `/api/tramite` | `Admin`, `Analista` | Body: `RegistrarTramiteDto` (`numeroExpediente`: req max 30, `idTipoTramite`: int, `idInmueble?`: int, `idContribuyente`: int). `@id_usuario` se extrae del JWT. | `int` (`idTramite`) | `sp_registrar_tramite` |
| `PUT` | `/api/tramite/{idTramite}` | `Admin`, `Analista` | Route: `idTramite` (int)<br>Body: `ActualizarTramiteDto` (`idUsuarioAsignado?`: int, `idInmueble?`: int) | `object` (`null`) | `sp_actualizar_tramite` |
| `POST` | `/api/tramite/adjuntar-archivo` | `Admin`, `Analista` | `multipart/form-data`: `IdTramite` (int req), `IdRequisito?` (int), `Archivo` (`IFormFile` req, máx 10 MB, `.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx`) | `ArchivoAdjuntadoDto` (`idTramite`, `idRequisito`, `nombreOriginal`, `nombreAlmacenado`, `rutaRelativa`, `extension`, `pesoBytes`) | `sp_adjuntar_archivo_tramite` + disco `wwwroot/uploads/tramites/` |
| `POST` | `/api/tramite/requisito-presentado` | `Admin`, `Analista` | `multipart/form-data`: `IdTramite` (int req), `IdRequisito` (int req), `Archivo` (`IFormFile` req) | `ArchivoAdjuntadoDto` | `sp_registrar_requisito_presentado` + disco `wwwroot/uploads/tramites/` |
| `POST` | `/api/tramite/{idTramite}/estado` | `Admin`, `Analista` | Route: `idTramite` (int)<br>Body: `CambiarEstadoTramiteDto` (`codigoEstado`: req max 20 [`REC`, `REV`, `DOC`, `EVA`, `APR`, `RECH`], `observaciones`: req max 255) | `object` (`null`) | `sp_cambiar_estado_tramite` + `trg_historial_estado_tramite` |
| `GET` | `/api/tramite/estados` | `Admin`, `Analista` | Ninguno | `SpEstadosTramiteResultDto[]` (`idEstadoTramite`, `codigoEstado`, `nombreEstado`, `descripcionEstado`, `esEstadoFinal`) | `sp_consultar_estados_tramite` |
| `GET` | `/api/tramite/{idTramite}/historial` | `Admin`, `Analista` | Route: `idTramite` (int) | `SpHistorialTramiteResultDto[]` (`idHistorialTramite`, `fechaCambio`, `codigoEstado`, `nombreEstado`, `observaciones`, `esEstadoFinal`) | `sp_consultar_historial_tramite` |
| `POST` | `/api/tramite/{idTramite}/resolucion` | `Admin`, `Analista` | Route: `idTramite` (int)<br>Body: `ResolucionTramiteDto` (`codigoEstado`: `"APR"` o `"RECH"`, `observaciones`: req max 255) | `object` (`null`) | `sp_registrar_resolucion_tramite` |
| `GET` | `/api/tramite/contribuyente/{idContribuyente}` | `Admin`, `Analista` | Route: `idContribuyente` (int) | `SpTramitesPorContribuyenteResultDto[]` (`idTramite`, `numeroExpediente`, `fechaSolicitud`, `fechaCierre`, `nombreTramite`, `numeroFinca`, `estadoActual`) | `sp_consultar_tramites_por_contribuyente` |

### 4.10 `TributoDeudaController` (`/api/tributodeuda`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/tributodeuda/tipos-tributo` | `Cajero`, `Admin` | Ninguno | `SpTiposTributoResultDto[]` (`idTipoTributo`, `codigoTributo`, `nombreTributo`, `periodicidad`, `formulaCalculo`, `tasaBase`, `idDepartamento`, `nombreDepartamento`) | `sp_consultar_tipos_tributo` |
| `GET` | `/api/tributodeuda/facturas-pendientes` | `Cajero`, `Admin` | Ninguno | `VwFacturasPendiente[]` (`idFactura`, `claveNumericaHacienda`, `fechaEmision`, `subtotal`, `descuentos`, `totalFactura`, `estadoFactura`, `idDeudaMunicipal`, `periodoDeuda`, `fechaDeVencimiento`, `diasMora`, `nombreTributo`, `numeroFinca`, `idContribuyente`, `contribuyente`, `totalAbonado`, `saldoPendiente`) | `vw_facturas_pendientes` |
| `POST` | `/api/tributodeuda/deuda` | `Cajero`, `Admin` | Body: `RegistrarDeudaMunicipalDto` (`periodoDeuda`: req max 150, `montoPrincipal`: double > 0, `montoIntereses`: double >= 0, `montoMultas`: double >= 0, `fechaDeVencimiento`: DateTime, `idInmueble`: int, `idTipoTributo`: int, `codigoEstadoDeuda`: string default `"PEND"`) | `int` (`idDeudaMunicipal`) | `sp_registrar_deuda_municipal` |
| `GET` | `/api/tributodeuda/contribuyente/{idContribuyente}/deudas` | `Cajero`, `Admin` | Route: `idContribuyente` (int) | `SpDeudasContribuyenteResultDto[]` (`idDeudaMunicipal`, `periodoDeuda`, `montoPrincipal`, `montoIntereses`, `montoMultas`, `montoTotal`, `fechaDeVencimiento`, `diasMora`, `numeroFinca`, `nombreTributo`, `codigoEstadoDeuda`, `descripcionEstado`) | `sp_consultar_deudas_contribuyente` |
| `PATCH` | `/api/tributodeuda/deuda/{idDeudaMunicipal}/estado` | `Cajero`, `Admin` | Route: `idDeudaMunicipal` (int)<br>Body: `ActualizarEstadoDeudaDto` (`codigoEstadoDeuda`: `"PEND"`, `"PAG"`, `"VENC"`, `"ARR"`) | `object` (`null`) | `sp_actualizar_estado_deuda` |
| `POST` | `/api/tributodeuda/deuda/{idDeudaMunicipal}/recalcular` | `Cajero`, `Admin` | Route: `idDeudaMunicipal` (int)<br>Body opcional: `CalcularRecargosDto?` (`tasaInteresMensual?`: double) | `object` (`null`) | `sp_calcular_recargos_intereses` |

### 4.11 `FacturacionPagoController` (`/api/facturacionpago`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/facturacionpago/estado-cuenta` | `Admin`, `Cajero` | Ninguno | `VwEstadoCuentaContribuyente[]` (`idContribuyente`, `identificacion`, `contribuyente`, `correoElectronico`, `telefono`, `cantidadInmuebles`, `totalDeudasRegistradas`, `deudasPendientesOVencidas`, `montoTotalDeudas`, `montoPendienteDeuda`, `totalFacturado`, `totalPagadoHistorico`) | `vw_estado_cuenta_contribuyente` |
| `GET` | `/api/facturacionpago/contribuyente/{idContribuyente}/estado-cuenta` | `Admin`, `Cajero` | Route: `idContribuyente` (int) | `SpEstadoCuentaResultDto[]` (`idContribuyente`, `correoElectronico`, `telefono`, `idInmueble`, `numeroFinca`, `idDeudaMunicipal`, `periodoDeuda`, `nombreTributo`, `montoPrincipal`, `montoIntereses`, `montoMultas`, `totalDeuda`, `fechaDeVencimiento`, `estadoDeuda`, `idFactura`, `totalFactura`, `estadoFactura`, `totalPagadoFactura`, `saldoFactura`) | `sp_consultar_estado_cuenta` |
| `POST` | `/api/facturacionpago/factura` | `Admin`, `Cajero` | Body: `GenerarFacturaDto` (`idDeudaMunicipal`: int, `claveNumericaHacienda`: req max 50, `descuentos`: double >= 0) | `int` (`idFactura`) | `sp_generar_factura` |
| `GET` | `/api/facturacionpago/factura` | `Admin`, `Cajero` | Query: `claveNumericaHacienda?` (string), `idFactura?` (int) | `SpConsultarFacturaResultDto[]` (`idFactura`, `claveNumericaHacienda`, `fechaEmision`, `subtotal`, `descuentos`, `totalFactura`, `estadoFactura`, `idDeudaMunicipal`, `periodoDeuda`, `nombreTributo`, `numeroFinca`, `totalAplicado`, `saldoPendiente`) | `sp_consultar_factura` |
| `GET` | `/api/facturacionpago/contribuyente/{idContribuyente}/facturas` | `Admin`, `Cajero` | Route: `idContribuyente` (int) | `SpFacturasContribuyenteResultDto[]` (`idFactura`, `claveNumericaHacienda`, `fechaEmision`, `subtotal`, `descuentos`, `totalFactura`, `estadoFactura`, `periodoDeuda`, `nombreTributo`, `numeroFinca`) | `sp_consultar_facturas_contribuyente` |
| `GET` | `/api/facturacionpago/medios-pago` | `Admin`, `Cajero` | Ninguno | `SpMediosPagoResultDto[]` (`idMedioPago`, `codigoMedioPago`, `nombreMedioPago`, `requiereReferencia`, `comisionPorcentaje`, `activo`) | `sp_consultar_medios_pago` |
| `POST` | `/api/facturacionpago/pago` | `Admin`, `Cajero` | Body: `RegistrarPagoMunicipalDto` (`montoTotalPagado`: double > 0, `comprobante`: req max 50, `idMedioPago`: int, `idContribuyente`: int) | `int` (`idPagoMunicipal`) | `sp_registrar_pago_municipal` |
| `POST` | `/api/facturacionpago/pago/{idPagoMunicipal}/aplicar` | `Admin`, `Cajero` | Route: `idPagoMunicipal` (int)<br>Body: `AplicarPagoFacturaDto` (`idFactura`: int, `montoPrincipal`: double >= 0, `montoInteres`: double >= 0, `montoRecargo`: double >= 0) | `object` (`null`) | `sp_aplicar_pago_factura` + `trg_actualizar_saldo_factura` |

### 4.12 `ReportesController` (`/api/reportes`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/reportes/morosidad` | `Auditor`, `Admin` | Ninguno | `VwMorosidadContribuyente[]` (`idDeudaMunicipal`, `idContribuyente`, `identificacion`, `contribuyente`, `correoElectronico`, `telefono`, `numeroFinca`, `nombreDistrito`, `nombreTributo`, `periodoDeuda`, `montoPrincipal`, `montoIntereses`, `montoMultas`, `totalDeuda`, `fechaDeVencimiento`, `diasMora`, `codigoEstadoDeuda`) | `vw_morosidad_contribuyentes` |
| `GET` | `/api/reportes/recaudacion-tributo` | `Auditor`, `Admin` | Ninguno | `VwRecaudacionPorTributo[]` (`idTipoTributo`, `codigoTributo`, `nombreTributo`, `periodicidad`, `cantidadDeudasEmitidas`, `cantidadFacturasEmitidas`, `totalPrincipalRecaudado`, `totalInteresRecaudado`, `totalRecargoRecaudado`, `totalGeneralRecaudado`) | `vw_recaudacion_por_tributo` |
| `GET` | `/api/reportes/recaudacion-distrito` | `Auditor`, `Admin` | Ninguno | `VwRecaudacionPorDistrito[]` (`idDistrito`, `codigoDistrito`, `nombreDistrito`, `cantidadInmuebles`, `valorFiscalTotalDistrito`, `cantidadDeudas`, `totalFacturadoDistrito`, `totalRecaudadoDistrito`) | `vw_recaudacion_por_distrito` |
| `GET` | `/api/reportes/historial-tramites/{idContribuyente}` | `Auditor`, `Admin` | Route: `idContribuyente` (int) | `SpReporteHistorialTramitesResultDto[]` (`idTramite`, `numeroExpediente`, `nombreTramite`, `fechaSolicitud`, `fechaCierre`, `numeroFinca`, `estadoActual`, `diasEnGestion`) | `sp_reporte_historial_tramites_contribuyente` |
| `GET` | `/api/reportes/recaudacion-tributo/periodo` | `Auditor`, `Admin` | Query: `fechaInicio?` (DateTime), `fechaFin?` (DateTime) | `SpReporteRecaudacionTributoResultDto[]` (`codigoTributo`, `nombreTributo`, `pagosAplicados`, `recaudadoPrincipal`, `recaudadoInteres`, `recaudadoRecargo`, `totalRecaudado`) | `sp_reporte_recaudacion_tributo` |
| `GET` | `/api/reportes/recaudacion-distrito/periodo` | `Auditor`, `Admin` | Query: `fechaInicio?` (DateTime), `fechaFin?` (DateTime) | `SpReporteRecaudacionDistritoResultDto[]` (`codigoDistrito`, `nombreDistrito`, `inmueblesConPago`, `totalRecaudado`) | `sp_reporte_recaudacion_distrito` |
| `GET` | `/api/reportes/contribuyentes-morosos` | `Auditor`, `Admin` | Ninguno | `SpReporteContribuyentesMorososResultDto[]` (`idContribuyente`, `correoElectronico`, `telefono`, `idDeudaMunicipal`, `periodoDeuda`, `nombreTributo`, `numeroFinca`, `fechaDeVencimiento`, `diasMora`, `montoPrincipal`, `montoIntereses`, `montoMultas`, `totalAdeudado`, `codigoEstadoDeuda`) | `sp_reporte_contribuyentes_morosos` |
| `GET` | `/api/reportes/solicitudes-departamento` | `Auditor`, `Admin` | Ninguno | `SpReporteSolicitudesDeptoResultDto[]` (`codigoDepartamento`, `nombreDepartamento`, `totalTramitesRecibidos`, `tramitesCerrados`, `tramitesAbiertos`, `promedioDiasResolucion`) | `sp_reporte_solicitudes_departamento` |
| `GET` | `/api/reportes/eficiencia-tramites` | `Auditor`, `Admin` | Ninguno | `SpReporteEficienciaResultDto[]` (`nombreTramite`, `diasSlaMaximo`, `totalSolicitudes`, `solicitudesResueltas`, `promedioDiasReales`, `resueltosFueraSla`) | `sp_reporte_eficiencia_tramites` |
| `GET` | `/api/reportes/gestion-municipal` | `Auditor`, `Admin` | Query: `tipoReporte` (`PADRON`, `INMUEBLES`, `MOROSOS`, `AUDITORIA`), `filtroTexto?` (string) | `SpReporteGestionMunicipalResultDto` (`tipoReporte`, `filtroTexto`, `totalRegistros`, `registros`) | `sp_reporte_gestion_municipal` |

### 4.13 `AuditoriaController` (`/api/auditoria`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/auditoria` | `Admin`, `Auditor`, `Dba` | Ninguno | `VwAuditoriaDetallada[]` (`idAuditoria`, `fechaEvento`, `tablaAfectada`, `idRegistroAfectado`, `tipoAccion`, `valoresAnteriores`, `valoresNuevos`, `direccionIp`, `idUsuario`, `userName`, `nombreFuncionario`, `nombreDepartamento`) | `vw_auditoria_detallada` |
| `GET` | `/api/auditoria/recientes` | `Admin`, `Auditor`, `Dba` | Ninguno | `SpConsultarAuditoriaResultDto[]` (`idAuditoria`, `fechaEvento`, `tablaAfectada`, `idRegistroAfectado`, `tipoAccion`, `valoresAnteriores`, `valoresNuevos`, `direccionIp`, `userName`) | `sp_consultar_auditoria` (TOP 500) |
| `GET` | `/api/auditoria/filtrar` | `Admin`, `Auditor`, `Dba` | Query: `tablaAfectada?`, `idUsuario?`, `fechaInicio?`, `fechaFin?` | `SpFiltrarAuditoriaResultDto[]` (`idAuditoria`, `fechaEvento`, `tablaAfectada`, `idRegistroAfectado`, `tipoAccion`, `valoresAnteriores`, `valoresNuevos`, `direccionIp`, `userName`) | `sp_filtrar_auditoria` |
| `GET` | `/api/auditoria/registro` | `Admin`, `Auditor`, `Dba` | Query req: `tablaAfectada`, `idRegistroAfectado` | `SpConsultarAuditoriaResultDto[]` | `sp_consultar_auditoria_registro` |
| `POST` | `/api/auditoria/tipo-accion` | `Admin`, `Auditor`, `Dba` | Body: `RegistrarTipoAccionAuditoriaDto` (`codigo`: req max 20) | `object` (`null`) | `sp_registrar_tipo_accion_auditoria` |
| `POST` | `/api/auditoria` | `Admin`, `Auditor`, `Dba` | Body: `RegistrarAuditoriaDto` (`tablaAfectada`, `idRegistroAfectado`, `valoresAnteriores?`, `valoresNuevos?`, `codigoAccion`). `@id_usuario` del JWT, `@direccion_ip` de HTTP. | `object` (`null`) | `sp_registrar_auditoria` |

### 4.14 `RespaldosDbaController` (`/api/respaldosdba`)
| Método | Ruta | Roles Autorizados | DTO Entrada / Parámetros | DTO Respuesta (`data`) | Objeto BD |
|---|---|---|---|---|---|
| `GET` | `/api/respaldosdba/estado` | `Admin`, `Dba` | Ninguno | `VwEstadoRespaldo[]` (`idRespaldosConfig`, `nombreConfiguracion`, `tipoRespaldo`, `frecuencia`, `horaEjecucion`, `retencionDias`, `rutaDestino`, `configuracionActiva`, `totalEjecuciones`, `ultimaEjecucion`, `ultimoTamanoMb`, `horasDesdeUltimoRespaldo`) | `vw_estado_respaldos` |
| `GET` | `/api/respaldosdba/frecuencias` | `Admin`, `Dba` | Ninguno | `SpFrecuenciaResultDto[]` (`idFrecuencia`, `codigoFrecuencia`) | `sp_consultar_frecuencias` (Script 14) |
| `GET` | `/api/respaldosdba/tipos-respaldo` | `Admin`, `Dba` | Ninguno | `SpTipoRespaldoResultDto[]` (`idTipoDeRespaldo`, `codigoTipoDeRespaldo`) | `sp_consultar_tipos_respaldo` (Script 14) |
| `GET` | `/api/respaldosdba/configuraciones` | `Admin`, `Dba` | Ninguno | `SpConfiguracionRespaldoResultDto[]` (`idRespaldosConfig`, `nombreConfiguracion`, `horaEjecucion`, `origen`, `retencionDias`, `cifrado`, `rutaDestino`, `activo`, `idFrecuencia`, `codigoFrecuencia`, `idTipoDeRespaldo`, `codigoTipoDeRespaldo`) | `sp_consultar_configuraciones_respaldo` (Script 14) |
| `GET` | `/api/respaldosdba/historial` | `Admin`, `Dba` | Query: `fechaInicio?`, `fechaFin?` | `SpHistorialRespaldosResultDto[]` (`idRespaldoHistorial`, `fechaInicio`, `fechaFin`, `rutaArchivo`, `tamanoMb`, `hashVerificacion`, `nombreConfiguracion`, `codigoTipoDeRespaldo`, `estadoRespaldo`, `usuarioEjecutor`) | `sp_consultar_historial_respaldos` |
| `POST` | `/api/respaldosdba/configuracion` | `Admin`, `Dba` | Body: `RegistrarConfiguracionRespaldoDto` (`nombreConfiguracion`, `horaEjecucion`: `"HH:mm:ss"`, `origen`, `retencionDias`, `cifrado`, `rutaDestino`, `idFrecuencia`, `idTipoDeRespaldo`) | `int` (`idRespaldosConfig`) | `sp_registrar_configuracion_respaldo` |
| `PUT` | `/api/respaldosdba/configuracion/{idRespaldosConfig}` | `Admin`, `Dba` | Route: `idRespaldosConfig` (int)<br>Body: `ActualizarConfiguracionRespaldoDto` (`nombreConfiguracion`, `horaEjecucion`: `"HH:mm:ss"`, `retencionDias`, `rutaDestino`, `activo`) | `object` (`null`) | `sp_actualizar_configuracion_respaldo` |
| `POST` | `/api/respaldosdba/backup-full` | `Admin`, `Dba` | Body opcional: `EjecutarBackupDto?` (`rutaCarpeta?`: string max 200) | `object` (`null`) | `sp_dba_ejecutar_backup_full` |
| `POST` | `/api/respaldosdba/backup-diferencial` | `Admin`, `Dba` | Body opcional: `EjecutarBackupDto?` (`rutaCarpeta?`: string max 200) | `object` (`null`) | `sp_dba_ejecutar_backup_diferencial` |
| `POST` | `/api/respaldosdba/verificar-integridad` | `Admin`, `Dba` | Ninguno | `object` (`null`) | `sp_dba_verificar_integridad_dbcc` |
| `POST` | `/api/respaldosdba/simular-restauracion` | `Admin`, `Dba` | Body: `SimularRestauracionDto` (`rutaBackupFull`: req max 255). `@id_usuario_dba` del JWT. | `object` (`null`) | `sp_dba_simular_restauracion_contingencia` |

---

## 5. Funcionalidades de Archivos (`TramiteController` y `ArchivoTramitePolicy`)

- **Endpoints:** `POST /api/tramite/adjuntar-archivo` y `POST /api/tramite/requisito-presentado` (`multipart/form-data`).
- **Tamaño máximo:** `10 MB` (`10,485,760` bytes).
- **Extensiones permitidas:** `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, `.xls`, `.xlsx`.
- **Almacenamiento físico:** `wwwroot/uploads/tramites/<guid>.<ext>`, servido estáticamente en `http://localhost:5080/uploads/tramites/<guid>.<ext>`.
- **Atomicidad:** Si el SP (`sp_adjuntar_archivo_tramite` o `sp_registrar_requisito_presentado`) falla en SQL Server, `SvTramite` elimina el archivo recién creado en disco para no dejar archivos huérfanos.
- **Limitación detectada:** No existe un endpoint `GET` en `TramiteController` que consulte las tablas `dbo.Archivo_Adjunto` ni `dbo.Tramite_Requisito_Presentado` de un expediente existente; solo se retornan los metadatos (`ArchivoAdjuntadoDto`) en el momento de subir el archivo (documentado en `PENDIENTES_BACKEND.md`).

---

## 6. Matriz de Estado de Módulos (Código vs API vs Bloqueos)

| Módulo / Funcionalidad | Estado en Backend (`muni-back`) | Estado en Frontend (`muni_front`) | Observaciones / Dependencias |
|---|---|---|---|
| **Autenticación JWT y Sesión (`/api/auth`)** | Implementado en código | Implementado e integrado | Requiere haber ejecutado `13_sp_autenticar_usuario.sql` en SQL Server |
| **Catálogo de Departamentos (`/api/catalogosgenerales`)** | Implementado en código | Implementado e integrado | Requiere haber ejecutado `14_mejoras_catalogos_output.sql` |
| **Gestión de Usuarios (`/api/usuario`)** | Implementado en código | Implementado e integrado | Roles: `Administrador del Sistema` |
| **Roles, Permisos y Matriz RBAC (`/api/rolpermiso`)** | Implementado en código | Implementado e integrado | Soporta asignación de roles/permisos; no existe SP de revocación (`DELETE`) |
| **Padrón de Contribuyentes (`/api/contribuyente`)** | Implementado en código | Implementado e integrado | Autorizado para `Admin` y `Cajero` (`Analista` no incluido en `[Authorize]`) |
| **Bienes Inmuebles y Copropiedad (`/api/inmueble`)** | Implementado en código | Implementado e integrado | Validación de copropiedad <= 100% delegada a trigger SQL |
| **Tipos de Trámite y Requisitos (`/api/tipotramite`)** | Implementado en código | Implementado e integrado | Requiere Script 14 para `GET /requisitos` y `POST` con `OUTPUT` |
| **Radicación, Expedientes y Archivos (`/api/tramite`)** | Implementado en código | Implementado e integrado | Subida de archivos funcional; falta `GET` de archivos históricos por trámite |
| **Tributos y Deudas (`/api/tributodeuda`)** | Implementado en código | Implementado e integrado | Cálculo de intereses/recargos ejecutado en SQL Server |
| **Facturación y Pagos (`/api/facturacionpago`)** | Implementado en código | Implementado e integrado | Subtotales, totales y saldos calculados por SP y trigger SQL |
| **Reportes y Análisis Tributario (`/api/reportes`)** | Implementado en código | Implementado e integrado | 10 endpoints operativos entre vistas y SPs |
| **Auditoría Forense (`/api/auditoria`)** | Implementado en código | Implementado e integrado | Incluye comparativa `valoresAnteriores` vs `valoresNuevos` |
| **Consola Técnica DBA (`/api/respaldosdba`)** | Implementado en código | Implementado e integrado | 11 endpoints (políticas, FULL, DIFF, DBCC CHECKDB, simulacro de restauración) |
| **Portal Ciudadano en Línea (Wireframe 2, p. 113)** | **No disponible en API** | Interfaz implementada con aviso explícito de bloqueo | `dbo.Usuario` solo autentica funcionarios municipales; no existe rol ni endpoints de autoservicio ciudadano |
| **Data Warehouse / ETL (`sp_etl_*`, `vw_dw_*`)** | **Solo en BD (No expuesto en API)** | Documentado en UI de Reportes/DBA sin simular ETL | `muni-back` no expone controladores para `MunicipalidadNicoyaDataMart2026` |
| **Monitoreo DMV y Mantenimiento Índices (Scripts 07 y 10)** | **Solo en BD (No expuesto en API)** | Documentado en Consola DBA | `RespaldosDbaController` solo expone respaldos y `DBCC CHECKDB` |

