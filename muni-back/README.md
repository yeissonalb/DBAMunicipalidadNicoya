# muni-back — API Municipalidad de Nicoya 2026

Backend **.NET 9 / ASP.NET Core Web API** para la base `MunicipalidadNicoya2026`.
Es una capa delgada (*Thin Gateway*): **toda la lógica de negocio está en SQL Server**.

| Operación | Cómo se hace |
|---|---|
| Escrituras / mutaciones | `ExecuteSqlRawAsync("EXEC dbo.sp_… @p = @p, …")` |
| Lecturas masivas | `DbSet` de las 12 vistas `dbo.vw_*` (`[Keyless]` + `ToView`) |
| Consultas puntuales y reportes | `SqlQueryRaw<TDto>("EXEC dbo.sp_…")` |
| IDs generados | Parámetros `INT OUTPUT` |
| Errores de negocio | `THROW 50XXX` → `SqlExceptionMiddleware` → código HTTP |

No existe ningún `_context.Tabla.Add/Where`: el contexto solo mapea las vistas.

---

## 1. Puesta en marcha

1. **Base de datos.** Ejecute `../BaseDeDatos/Scripts_Ordinarios/MunicipalidadNicoya2026_MASTER.sql`.
2. **Scripts del backend (obligatorios, en este orden):**
   - `../BaseDeDatos/Database_Backend/13_sp_autenticar_usuario.sql`: crea el procedimiento de login.
   - `../BaseDeDatos/Database_Backend/14_mejoras_catalogos_output.sql`:
     - identidad del usuario en auditoría (`SESSION_CONTEXT`);
     - `OUTPUT` en rol, permiso, tipo de trámite y requisito;
     - 7 catálogos de consulta;
     - representante legal por id del padrón;
     - 404 en las actualizaciones;
     - 409 en duplicados.

   - `../BaseDeDatos/Database_Backend/15_portal_ciudadano_dw_monitoreo.sql`:
     - portal ciudadano (`dbo.Cuenta_Ciudadana`, activación, login y consultas con validación de pertenencia);
     - listado de archivos y estado de requisitos de un trámite;
     - consulta y revocación de roles y permisos;
     - Data Warehouse (estado, ETL, consultas) y monitoreo/mantenimiento DBA.

   Sin el 14, los endpoints de registro de rol, permiso, tipo de trámite y requisito, y los de catálogo, fallan porque esos SP no tienen el `OUTPUT` ni existen. Sin el 15 fallan el portal ciudadano, las revocaciones, `tramite/{id}/archivos`, `datawarehouse/*` y `monitoreodba/*`.
   - **Opcionales:** `../BaseDeDatos/DataWareHouse/DWH_Structure.sql`, `DWH_ETL.sql` y `DWH_Vistas_Analiticas.sql` (sin ellos `datawarehouse/estado` responde `dwInstalado: false` y las consultas 404 / 50034); `../BaseDeDatos/PlanDeMantenimientoBD/01`–`04` (sin MaintenanceDB el mantenimiento usa una rutina integrada y el historial sale vacío).
3. **Compilar y ejecutar:**

```bash
cd muni-back
dotnet restore
dotnet build
dotnet run --project MunicipalidadAPI --launch-profile http
```

4. Abra **http://localhost:5080/swagger**.
5. En Swagger, inicie sesión:
   - Ejecute `POST /api/auth/login`.
   - Copie el `token` de la respuesta.
   - Haga clic en **Authorize** y pegue **solo el token**, sin escribir `Bearer `. El esquema es HTTP bearer y Swagger agrega el prefijo; si usted también lo escribe, el encabezado queda `Bearer Bearer …` y la API responde 401.

La cadena de conexión y la clave JWT están en `MunicipalidadAPI/appsettings.json`.

### Usuarios de prueba (datos semilla)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin_nicoya` | `password` | Administrador del Sistema |
| `analista_curb` | `4` | Analista de Plataforma y Trámites |
| `cajero_caja1` | `password123` | Cajero de Recaudación |
| `auditor_muni` | `admin` | Auditor Interno |
| `dba_sys` | — | DBA |

`dba_sys` tiene en la semilla un hash **MD5**, no SHA-256, así que no puede iniciar sesión. Descomente el `UPDATE` que está al final de `13_sp_autenticar_usuario.sql`; con eso su contraseña queda como `password`.

**Portal ciudadano:** el contribuyente activa su cuenta con `POST /api/auth/ciudadano/activar` (cédula + correo registrado en el padrón + contraseña nueva) y luego entra con `POST /api/auth/ciudadano/login`. Ejemplo semilla: `5-0321-0456` / `maria.gonzalez@gmail.com`. El token lleva el rol `Ciudadano` y el claim `id_contribuyente`; solo sirve para `api/portal/*`.

---

## 2. Estructura

```
muni-back.sln
├── Entities/            Modelos sin lógica
│   ├── Views/           12 vistas [Keyless]
│   └── SpResults/       DTO de recordsets de SP (generados por tools/generar_entities.py)
├── Services/            Acceso a datos (solo SP y vistas)
│   ├── genericResponse/BaseResponse.cs
│   ├── MyDbContext/MunicipalidadContext.cs
│   ├── Common/          Sp.cs (SqlParameter tipados) + StoredProcedureExtensions.cs
│   └── Auth/, UsuarioService/, RolPermisoService/, ContribuyenteService/, InmuebleService/,
│       CatalogosInmuebleService/, TipoTramiteService/, TramiteService/, TributoDeudaService/,
│       FacturacionPagoService/, ReportesService/, AuditoriaService/, RespaldosDbaService/,
│       CatalogosGeneralesService/, PortalCiudadanoService/, DataWarehouseService/,
│       MonitoreoDbaService/
│   (Common/SessionContextInterceptor.cs: envía el id_usuario del JWT a SQL Server)
├── MunicipalidadAPI/    Controladores, JWT, CORS, Swagger, middleware, wwwroot/uploads/tramites
└── tools/               Generador de Entities y verificador de firmas SP
```

---

## 3. Endpoints

Todas las rutas empiezan con `/api/`. Salvo los dos login y la activación ciudadana, todas requieren `Authorization: Bearer <token>`.

El rol **Administrador del Sistema** está incluido en todos los controladores internos (tal como están los `[Authorize]` del código). La columna *Rol* muestra los roles reales de cada ruta.

### Seguridad

| Rol | Ruta | Procedimiento / vista |
|---|---|---|
| Anónimo | `POST auth/login` | `sp_autenticar_usuario` |
| Anónimo | `POST auth/ciudadano/activar` | `sp_activar_cuenta_ciudadana` (15) |
| Anónimo | `POST auth/ciudadano/login` | `sp_autenticar_ciudadano` (15) |
| Cualquier token | `GET auth/me` | Datos del token |
| Admin | `GET usuario?userName=` | `sp_consultar_usuario` |
| Admin | `POST usuario` | `sp_registrar_usuario` (OUTPUT) |
| Admin | `PUT usuario/{id}` | `sp_actualizar_usuario` |
| Admin | `PATCH usuario/{id}/estado` | `sp_cambiar_estado_usuario` |
| Admin | `GET rolpermiso/matriz` | `vw_usuarios_roles_permisos` |
| Admin | `GET rolpermiso/roles` | `sp_consultar_roles` (14) |
| Admin | `GET rolpermiso/permisos` | `sp_consultar_permisos` (14) |
| Admin | `POST rolpermiso/rol` | `sp_registrar_rol` (OUTPUT, 14) |
| Admin | `POST rolpermiso/permiso` | `sp_registrar_permiso` (OUTPUT, 14) |
| Cualquier funcionario | `GET catalogosgenerales/departamentos` | `sp_consultar_departamentos` (14) |
| Admin | `POST rolpermiso/asignar-rol` | `sp_asignar_rol_usuario` |
| Admin | `POST rolpermiso/asignar-permiso` | `sp_asignar_permiso_rol` |
| Admin | `GET rolpermiso/usuario/{id}` | `sp_consultar_roles_permisos_usuario` |
| Admin | `GET rolpermiso/rol/{idRol}/permisos` | `sp_consultar_permisos_por_rol` (15) |
| Admin | `GET rolpermiso/asignaciones` | `sp_consultar_asignaciones_roles` (15) |
| Admin | `DELETE rolpermiso/usuario/{idUsuario}/rol/{idRol}` | `sp_revocar_rol_usuario` (15; 409 si es el último administrador) |
| Admin | `DELETE rolpermiso/rol/{idRol}/permiso/{idPermiso}` | `sp_revocar_permiso_rol` (15) |

### Contribuyentes e inmuebles (GCBI)

| Rol | Ruta | Procedimiento / vista |
|---|---|---|
| Admin, Cajero, Analista | `GET contribuyente` | `vw_padron_contribuyentes` |
| Admin, Cajero, Analista | `GET contribuyente/buscar?criterio=` | `sp_consultar_contribuyente` |
| Admin, Cajero | `POST contribuyente/fisico` | `sp_registrar_contribuyente_fisico` (OUTPUT) |
| Admin, Cajero | `POST contribuyente/juridico` | `sp_registrar_contribuyente_juridico` (OUTPUT) |
| Admin, Cajero | `PUT contribuyente/{id}` | `sp_actualizar_contribuyente` |
| Admin, Cajero | `POST contribuyente/{idContribuyente}/representante-legal` | `sp_registrar_representante_legal` (id del padrón, 14) |
| Admin, Analista | `GET inmueble` | `vw_inmuebles_propietarios` |
| Admin, Analista | `GET inmueble/buscar?numeroFinca=&idDistrito=` | `sp_consultar_inmueble` |
| Admin, Analista | `POST inmueble` | `sp_registrar_inmueble` (OUTPUT) |
| Admin, Analista | `PUT inmueble/{id}` | `sp_actualizar_inmueble` |
| Admin, Analista | `POST inmueble/{id}/derechos` | `sp_asignar_derecho_inmueble` |
| Admin, Analista | `GET inmueble/contribuyente/{id}` | `sp_consultar_inmuebles_por_contribuyente` |
| Admin, Analista | `GET catalogosinmueble/distritos` | `sp_consultar_distritos` |
| Admin, Analista | `GET catalogosinmueble/tipos-uso` | `sp_consultar_tipos_uso_inmueble` |

### Trámites (GTA)

| Rol | Ruta | Procedimiento / vista |
|---|---|---|
| Admin, Analista | `GET tipotramite` | `sp_consultar_tipos_tramite` |
| Admin, Analista | `POST tipotramite` | `sp_registrar_tipo_tramite` (OUTPUT, 14) |
| Admin, Analista | `PUT tipotramite/{id}` | `sp_actualizar_tipo_tramite` |
| Admin, Analista | `GET tipotramite/requisitos` | `sp_consultar_requisitos` (14) |
| Admin, Analista | `POST tipotramite/requisito` | `sp_registrar_requisito` (OUTPUT, 14) |
| Admin, Analista | `POST tipotramite/{id}/requisitos/{idReq}` | `sp_configurar_requisito_tramite` |
| Admin, Analista | `GET tipotramite/{id}/requisitos` | `sp_consultar_requisitos_por_tipo_tramite` |
| Admin, Analista | `GET tramite` | `vw_tramites_seguimiento` |
| Admin, Analista | `GET tramite/historial-detallado` | `vw_historial_tramites_detallado` |
| Admin, Analista | `GET tramite/buscar?numeroExpediente=&idContribuyente=` | `sp_consultar_tramite` |
| Admin, Analista | `POST tramite` | `sp_registrar_tramite` (OUTPUT; `@id_usuario` sale del JWT) |
| Admin, Analista | `PUT tramite/{id}` | `sp_actualizar_tramite` |
| Admin, Analista | `POST tramite/adjuntar-archivo` (multipart) | Archivo a disco + `sp_adjuntar_archivo_tramite` |
| Admin, Analista | `POST tramite/requisito-presentado` (multipart) | Archivo a disco + `sp_registrar_requisito_presentado` |
| Admin, Analista | `POST tramite/{id}/estado` | `sp_cambiar_estado_tramite` |
| Admin, Analista | `GET tramite/estados` | `sp_consultar_estados_tramite` |
| Admin, Analista | `GET tramite/{id}/historial` | `sp_consultar_historial_tramite` |
| Admin, Analista | `POST tramite/{id}/resolucion` | `sp_registrar_resolucion_tramite` |
| Admin, Analista | `GET tramite/contribuyente/{id}` | `sp_consultar_tramites_por_contribuyente` |
| Admin, Analista | `GET tramite/{id}/archivos` | `sp_consultar_archivos_tramite` (15) |
| Admin, Analista | `GET tramite/{id}/requisitos-estado` | `sp_consultar_requisitos_tramite` (15) |

### Cobros y pagos (CPG)

| Rol | Ruta | Procedimiento / vista |
|---|---|---|
| Cajero, Admin | `GET tributodeuda/tipos-tributo` | `sp_consultar_tipos_tributo` |
| Cajero, Admin | `GET tributodeuda/facturas-pendientes` | `vw_facturas_pendientes` |
| Cajero, Admin | `POST tributodeuda/deuda` | `sp_registrar_deuda_municipal` (OUTPUT) |
| Cajero, Admin | `GET tributodeuda/contribuyente/{id}/deudas` | `sp_consultar_deudas_contribuyente` |
| Cajero, Admin | `PATCH tributodeuda/deuda/{id}/estado` | `sp_actualizar_estado_deuda` |
| Cajero, Admin | `POST tributodeuda/deuda/{id}/recalcular` | `sp_calcular_recargos_intereses` |
| Admin, Cajero | `GET facturacionpago/estado-cuenta` | `vw_estado_cuenta_contribuyente` |
| Admin, Cajero | `GET facturacionpago/contribuyente/{id}/estado-cuenta` | `sp_consultar_estado_cuenta` |
| Admin, Cajero | `POST facturacionpago/factura` | `sp_generar_factura` (OUTPUT) |
| Admin, Cajero | `GET facturacionpago/factura?claveNumericaHacienda=&idFactura=` | `sp_consultar_factura` |
| Admin, Cajero | `GET facturacionpago/contribuyente/{id}/facturas` | `sp_consultar_facturas_contribuyente` |
| Admin, Cajero | `GET facturacionpago/medios-pago` | `sp_consultar_medios_pago` |
| Admin, Cajero | `POST facturacionpago/pago` | `sp_registrar_pago_municipal` (OUTPUT) |
| Admin, Cajero | `POST facturacionpago/pago/{idPago}/aplicar` | `sp_aplicar_pago_factura` |

### Reportes (GRI)

| Rol | Ruta | Procedimiento / vista |
|---|---|---|
| Auditor, Admin | `GET reportes/morosidad` | `vw_morosidad_contribuyentes` |
| Auditor, Admin | `GET reportes/recaudacion-tributo` | `vw_recaudacion_por_tributo` |
| Auditor, Admin | `GET reportes/recaudacion-distrito` | `vw_recaudacion_por_distrito` |
| Auditor, Admin | `GET reportes/historial-tramites/{idContribuyente}` | `sp_reporte_historial_tramites_contribuyente` |
| Auditor, Admin | `GET reportes/recaudacion-tributo/periodo?fechaInicio=&fechaFin=` | `sp_reporte_recaudacion_tributo` |
| Auditor, Admin | `GET reportes/recaudacion-distrito/periodo?fechaInicio=&fechaFin=` | `sp_reporte_recaudacion_distrito` |
| Auditor, Admin | `GET reportes/contribuyentes-morosos` | `sp_reporte_contribuyentes_morosos` |
| Auditor, Admin | `GET reportes/solicitudes-departamento` | `sp_reporte_solicitudes_departamento` |
| Auditor, Admin | `GET reportes/eficiencia-tramites` | `sp_reporte_eficiencia_tramites` |
| Auditor, Admin | `GET reportes/gestion-municipal?tipoReporte=PADRON\|INMUEBLES\|MOROSOS\|AUDITORIA&filtroTexto=` | `sp_reporte_gestion_municipal` |

### Auditoría (RAA)

| Rol | Ruta | Procedimiento / vista |
|---|---|---|
| Admin, Auditor, DBA | `GET auditoria` | `vw_auditoria_detallada` |
| Admin, Auditor, DBA | `GET auditoria/recientes` | `sp_consultar_auditoria` |
| Admin, Auditor, DBA | `GET auditoria/filtrar?tablaAfectada=&idUsuario=&fechaInicio=&fechaFin=` | `sp_filtrar_auditoria` |
| Admin, Auditor, DBA | `GET auditoria/registro?tablaAfectada=&idRegistroAfectado=` | `sp_consultar_auditoria_registro` |
| Admin, Auditor, DBA | `POST auditoria/tipo-accion` | `sp_registrar_tipo_accion_auditoria` |
| Admin, Auditor, DBA | `POST auditoria` | `sp_registrar_auditoria` (`@id_usuario` del JWT, IP de la conexión) |

### Respaldos (DBA)

| Rol | Ruta | Procedimiento / vista |
|---|---|---|
| Admin, DBA | `GET respaldosdba/estado` | `vw_estado_respaldos` |
| Admin, DBA | `GET respaldosdba/frecuencias` | `sp_consultar_frecuencias` (14) |
| Admin, DBA | `GET respaldosdba/tipos-respaldo` | `sp_consultar_tipos_respaldo` (14) |
| Admin, DBA | `GET respaldosdba/configuraciones` | `sp_consultar_configuraciones_respaldo` (14) |
| Admin, DBA | `GET respaldosdba/historial?fechaInicio=&fechaFin=` | `sp_consultar_historial_respaldos` |
| Admin, DBA | `POST respaldosdba/configuracion` | `sp_registrar_configuracion_respaldo` (OUTPUT) |
| Admin, DBA | `PUT respaldosdba/configuracion/{id}` | `sp_actualizar_configuracion_respaldo` |
| Admin, DBA | `POST respaldosdba/backup-full` | `sp_dba_ejecutar_backup_full` |
| Admin, DBA | `POST respaldosdba/backup-diferencial` | `sp_dba_ejecutar_backup_diferencial` |
| Admin, DBA | `POST respaldosdba/verificar-integridad` | `sp_dba_verificar_integridad_dbcc` |
| Admin, DBA | `POST respaldosdba/simular-restauracion` | `sp_dba_simular_restauracion_contingencia` (`@id_usuario_dba` del JWT) |

### Monitoreo y mantenimiento (DBA, script 15)

| Rol | Ruta | Procedimiento |
|---|---|---|
| Admin, DBA | `GET monitoreodba/resumen` | `sp_dba_monitor_resumen` (CPU, memoria, conexiones, espacio, últimos backups) |
| Admin, DBA | `GET monitoreodba/sesiones?umbralSegundos=5` | `sp_dba_monitor_sesiones` (bloqueos y consultas lentas) |
| Admin, DBA | `POST monitoreodba/sesiones/{id}/terminar` | `sp_dba_terminar_sesion` (`KILL`; no permite la sesión propia ni de sistema) |
| Admin, DBA | `GET monitoreodba/archivos` | `sp_dba_monitor_archivos` |
| Admin, DBA | `GET monitoreodba/fragmentacion` | `sp_dba_monitor_fragmentacion` |
| Admin, DBA | `POST monitoreodba/mantenimiento` | `sp_dba_ejecutar_mantenimiento` (índices, estadísticas, purga de respaldos) |
| Admin, DBA | `GET monitoreodba/mantenimiento/historial` | `sp_dba_historial_mantenimiento` (MaintenanceDB.dbo.CommandLog) |

### Data Warehouse (script 15 + `BaseDeDatos/DataWareHouse`)

| Rol | Ruta | Procedimiento |
|---|---|---|
| Admin, Auditor, DBA | `GET datawarehouse/estado` | `sp_dw_estado` |
| Admin, DBA | `POST datawarehouse/etl` | `sp_dw_ejecutar_etl` → `MunicipalidadNicoyaDataMart2026.dbo.sp_etl_ejecutar_carga_periodica` |
| Admin, Auditor, DBA | `GET datawarehouse/historial-cargas` | `sp_dw_historial_cargas` |
| Admin, Auditor, DBA | `GET datawarehouse/recaudacion-periodo`, `recaudacion-tributo`, `recaudacion-ubicacion`, `morosidad`, `eficiencia-tramites`, `indicadores-departamento` | `sp_dw_*` sobre las vistas del Data Mart |

### Portal ciudadano (token `Ciudadano`, script 15)

El id del contribuyente sale siempre del token; cada SP verifica que el trámite o la factura le pertenezca (404 / 50030–50031 si no).

| Ruta | Procedimiento |
|---|---|
| `GET portal/tramites` | `sp_consultar_tramites_por_contribuyente` |
| `GET portal/tramites/{id}/historial` | `sp_ciudadano_historial_tramite` |
| `GET portal/tramites/{id}/requisitos` | `sp_ciudadano_requisitos_tramite` |
| `GET portal/tramites/{id}/archivos` | `sp_ciudadano_archivos_tramite` |
| `POST portal/tramites/{id}/requisitos/{idReq}/archivo` (multipart, campo `Archivo`) | Archivo a disco + `sp_ciudadano_adjuntar_requisito` |
| `GET portal/inmuebles` | `sp_consultar_inmuebles_por_contribuyente` |
| `GET portal/estado-cuenta` | `sp_consultar_estado_cuenta` |
| `GET portal/facturas` | `sp_consultar_facturas_contribuyente` |
| `POST portal/facturas/{id}/pago-sinpe` | `sp_ciudadano_pagar_factura_sinpe` (pago simulado: el ciudadano registra el comprobante) |

Formato de todas las respuestas: `{ "success": bool, "message": string, "data": ... }`.

---

## 4. Errores de SQL Server → HTTP

| `ex.Number` | HTTP | Origen |
|---|---|---|
| 50001–50020 | 400 | `THROW` de negocio (50001–50012; 50003, 50004 y 50006 ya no se usan desde el script 14). Script 15: 50013–50018 (montos de pago, factura sin saldo, sesión no terminable, requisito ajeno, trámite resuelto) |
| 50021–50040 | 404 | Script 14: registro inexistente al actualizar (50021–50028) y contribuyente jurídico inexistente (50029). Script 15: trámite o factura ajenos (50030–50031), rol/permiso no asignado (50032–50033), DW no instalado (50034), sesión inexistente (50035) |
| 50041–50060 | 409 | Script 14: rol, permiso o tipo de trámite duplicado (50041–50043). Script 15: último administrador (50044), cuenta ciudadana ya activa (50045), comprobante SINPE repetido (50047) |
| 50061–50080 | 403 | Autenticación: `sp_autenticar_usuario` (50061 credenciales, 50062 inactivo, 50063 sin rol); portal ciudadano (50064 credenciales, 50065 cuenta inactiva, 50066 datos de activación no coinciden) |
| 2627 / 2601 | 409 | UNIQUE o PK duplicada (*agregado*) |
| 547 | 400 | FOREIGN KEY o CHECK (*agregado*) |
| 2628 / 8152 | 400 | Texto truncado (*agregado*) |
| Otro | 500 | Se registra en el log |

Las filas marcadas como *agregado* no venían en la especificación. Las incluí porque varios SP no validan antes de insertar; por ejemplo, `sp_registrar_tipo_tramite` con un nombre repetido. Sin ellas, esos casos responderían 500.

Si el SP hace `PRINT` antes del `THROW`, el middleware toma el primer error real (severidad > 10), así que el mensaje no se mezcla con los PRINT.

---

## 5. Diferencias entre la especificación y la BD real

En todos los casos se respetó la **BD real**: con la firma de la especificación, SQL Server rechaza la llamada.

| Especificación | BD real | Qué se hizo |
|---|---|---|
| `sp_autenticar_usuario` | No existía | Se creó en `BaseDeDatos/Database_Backend/13_sp_autenticar_usuario.sql` |
| `sp_registrar_rol`, `_permiso`, `_tipo_tramite` y `_requisito` con `OUTPUT` | Sin `OUTPUT` | **Resuelto con el script 14** (`@nuevo_id_* INT = NULL OUTPUT`) |
| `sp_registrar_configuracion_respaldo` sin `OUTPUT` | Tiene `@nuevo_id_config OUTPUT` | Se devuelve el id generado |
| `sp_generar_factura` con `@id_usuario` | No lo recibe | No se envía |
| `sp_registrar_pago_municipal` con `@id_usuario` | No lo recibe | No se envía |
| `sp_adjuntar_archivo_tramite(@nombre_archivo, @ruta_archivo, @extension, @peso_bytes, @id_usuario)` | `(@id_tramite, @nombre_original, @ruta_almacenamiento, @peso_bytes, @id_requisito)` | Se usa la firma real; la extensión va dentro del nombre |
| `sp_filtrar_auditoria(…, @id_tipo_accion)` | `(@tabla_afectada, @id_usuario, @fecha_inicio, @fecha_fin)` | Se usa la firma real |
| `sp_reporte_contribuyentes_morosos(@dias_mora_minimos)` | Sin parámetros | Sin parámetros |
| `sp_reporte_solicitudes_departamento` y `sp_reporte_eficiencia_tramites` con fechas | Sin parámetros | Sin parámetros |
| `sp_reporte_gestion_municipal(@anio)` | `(@tipo_reporte, @filtro_texto)` y recordset variable | Se valida el tipo y se materializa con el DTO correspondiente |
| `Entities` solo con `System.ComponentModel.Annotations` | `[Keyless]` vive en otro paquete | Se agregó `Microsoft.EntityFrameworkCore.Abstractions 9.0.0` |
| `SvAuth` "genera el JWT" | `AuthHelpers` está en la API, que Services no puede referenciar | `SvAuth` valida contra la BD y `AuthController` firma el token con `AuthHelpers.CreateToken` |

---

## 6. Mejoras de los scripts 14 y 15 y limitaciones pendientes

### Resuelto con el script 14

1. **Auditoría con el usuario real.**
   - `SessionContextInterceptor` antepone a **cada** comando de EF esta línea:

     ```sql
     EXEC sp_set_session_context @key = N'id_usuario', @value = @__sesion_id_usuario;
     ```
   - Va en el mismo lote que el SP. Esto importa porque EF abre y cierra la conexión entre comandos: un `sp_set_session_context` enviado aparte se perdería.
   - Los triggers leen el valor con `dbo.fn_usuario_sesion()`. Esa función valida que el id exista, para no violar la FK, y si no hay valor vuelve a `SYSTEM_USER`.
   - En el login no hay token, así que se envía `NULL`. Así nunca queda el id de otra petición en una conexión reutilizada.
2. **IDs generados** al registrar rol, permiso, tipo de trámite y requisito, más los 4 catálogos: roles, permisos, requisitos y departamentos.
3. **404 en actualizaciones con id inexistente** (50021–50026). La validación es `IF NOT EXISTS` **antes** del `UPDATE`, no `@@ROWCOUNT` después: estas tablas tienen triggers `AFTER UPDATE` y así el resultado no depende de lo que haga el trigger.
4. **409 en duplicados de rol y permiso.** Antes se ignoraban en silencio.
5. **Representante legal.** `sp_registrar_representante_legal` acepta `@id_contribuyente`, el id del padrón, y resuelve internamente `id_contribuyente_juridico`. Si el contribuyente no es persona jurídica, responde 404 (50029). `@id_contribuyente_juridico` sigue aceptándose como opcional.
6. **"No existe" de contribuyente e inmueble pasa al rango 404:** 50003 → 50027 y 50006 → 50028.
7. **Catálogos DBA:** frecuencias, tipos de respaldo y configuraciones. Las configuraciones incluyen el `id_respaldos_config` que necesita el `PUT`.

### Resuelto con el script 15

1. **Portal ciudadano** con sesión propia (rol `Ciudadano`, sin fila en `dbo.Usuario`). El token tiene `NameIdentifier = ciudadano:{id}`; como no es numérico, `SessionContextInterceptor` envía `NULL` y la auditoría registra `SYSTEM_USER`.
2. **Analista con lectura del padrón** (`GET contribuyente`, `GET contribuyente/buscar`); la escritura sigue siendo de Admin y Cajero.
3. **Listado de adjuntos y estado de requisitos** de un trámite ya existente.
4. **Revocación** de roles (no deja sin administradores al sistema) y de permisos; consultas que incluyen roles sin permisos y roles sin usuarios.
5. **Data Warehouse:** el ETL se ejecuta con `INSERT … EXEC` para capturar la validación y cada carga queda en `dbo.Control_Cargas_ETL`.
6. **Monitoreo DMV y mantenimiento** (CU-DBA-04, CU-DBA-06), con o sin MaintenanceDB.

### Pendiente (decisiones de la especificación, no errores)

1. **Seguridad tal como la pide la especificación:**
   - SHA-256 sin sal;
   - credenciales en texto plano en `appsettings.json`;
   - conexión con un usuario `db_owner`;
   - archivos de `wwwroot/uploads` accesibles sin token;
   - errores 500 con el texto técnico de SQL.

   Conviene endurecerlo antes de pasar a producción.
2. **Columnas `VARCHAR` en los SP y `NVARCHAR` en las tablas.** Los caracteres fuera de Latin-1 se pierden.

---

## 7. Cómo verificar

1. `dotnet build`: debe compilar sin errores.
2. **Verificación de firmas**, si cambia la BD:

   ```bash
   cd muni-back
   python tools/verificar_firmas_sp.py ..\BaseDeDatos\Scripts_Ordinarios\02_Creacion_Tablas.sql ..\BaseDeDatos\Scripts_Ordinarios\04_Vistas_Consultas.sql ..\BaseDeDatos\Scripts_Ordinarios\05_Procedimientos_Operacionales.sql ..\BaseDeDatos\Scripts_Ordinarios\08_Estrategia_Respaldos_DBA.sql ..\BaseDeDatos\Database_Backend\13_sp_autenticar_usuario.sql ..\BaseDeDatos\Database_Backend\14_mejoras_catalogos_output.sql ..\BaseDeDatos\Database_Backend\15_portal_ciudadano_dw_monitoreo.sql Services tools\entity_columns.json
   ```

   El script compara cada llamada `EXEC` contra la firma T-SQL (nombres, obligatorios, `OUTPUT`, tipos y tamaños `VARCHAR`). También compara cada DTO o vista contra las columnas reales del `SELECT`.

   Resultado actual: **109 llamadas, 68 modelos, 0 errores**.

   Si cambia un recordset, actualice `tools/generar_entities.py` y ejecútelo (`python tools/generar_entities.py .`): regenera los DTO de C# y `muni_front/src/types/generated.ts`, de modo que el frontend usa exactamente los mismos nombres de campo.
3. **Pruebas de humo en Swagger** (también están en `MunicipalidadAPI.http`):
   - Login con `admin_nicoya` / `password` → 200 con token.
   - Login con una contraseña errónea → **403**, `sqlErrorCode: 50061`.
   - `GET /api/contribuyente` → 200 con el padrón.
   - `POST /api/contribuyente/fisico` con la cédula `5-0321-0456`, que ya existe → **400**, `sqlErrorCode: 50001`.
   - Con el token de `cajero_caja1`, `GET /api/tramite` → **403** (trámites es de Admin y Analista).
   - Con `analista_curb` / `4`:
     - `POST /api/tramite/adjuntar-archivo` con un PDF → 201. El archivo queda en `wwwroot/uploads/tramites/`.
     - Lo mismo con un `idTramite` inexistente → 400 (547). El archivo se borra del disco.
   - Con el admin, ejecute `PUT /api/usuario/9999` → **404**, `sqlErrorCode: 50021`.
   - Con el admin, ejecute `PUT /api/contribuyente/9999` → **404**, `sqlErrorCode: 50027`.
   - Con el admin, ejecute `POST /api/contribuyente/4/representante-legal` → 201 (el 4 es jurídico en la semilla). Con `/1/` → **404**, 50029, porque el 1 es persona física.
   - Con el admin, ejecute `PUT /api/contribuyente/1`. Después revise en SSMS:

     ```sql
     SELECT TOP 1 * FROM vw_auditoria_detallada ORDER BY id_auditoria DESC
     ```

     `usuario_ejecutor` debe ser `admin_nicoya`, no `SISTEMA_INTERNO`.
   - Con `cajero_caja1` / `password123`, ejecute en orden:
     1. `POST facturacionpago/factura`
     2. `POST facturacionpago/pago`
     3. `POST facturacionpago/pago/{id}/aplicar`
     4. `GET facturacionpago/factura?idFactura=`

     El `saldoPendiente` debe bajar: lo recalcula el trigger de la BD.
