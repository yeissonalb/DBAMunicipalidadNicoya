# Matriz de Funcionalidades y Endpoints — SIGEMUN (`muni_front`)

Esta matriz relaciona cada funcionalidad implementada en el frontend con su servicio en `src/services/api.ts`, el endpoint real en `muni-back` y su estado.

| Módulo | Funcionalidad en UI | Servicio Frontend (`api.ts`) | Endpoint Backend | Estado |
|---|---|---|---|---|
| **Autenticación** | Iniciar sesión con usuario y contraseña | `authApi.login` | `POST /api/auth/login` | Implementado en código |
| **Autenticación** | Verificar perfil y claims del token activo | `authApi.me` | `GET /api/auth/me` | Implementado en código |
| **Catálogos** | Listar departamentos municipales | `catalogosGeneralesApi.departamentos` | `GET /api/catalogosgenerales/departamentos` | Implementado en código |
| **Usuarios** | Consultar y filtrar funcionarios | `usuarioApi.consultar` | `GET /api/usuario` | Implementado en código |
| **Usuarios** | Crear nuevo funcionario municipal | `usuarioApi.registrar` | `POST /api/usuario` | Implementado en código |
| **Usuarios** | Actualizar datos de funcionario | `usuarioApi.actualizar` | `PUT /api/usuario/{idUsuario}` | Implementado en código |
| **Usuarios** | Activar / desactivar funcionario | `usuarioApi.cambiarEstado` | `PATCH /api/usuario/{idUsuario}/estado` | Implementado en código |
| **Seguridad RBAC** | Consultar vista matricial de seguridad | `rolPermisoApi.matriz` | `GET /api/rolpermiso/matriz` | Implementado en código |
| **Seguridad RBAC** | Consultar catálogo de roles | `rolPermisoApi.listarRoles` | `GET /api/rolpermiso/roles` | Implementado en código |
| **Seguridad RBAC** | Consultar catálogo de permisos | `rolPermisoApi.listarPermisos` | `GET /api/rolpermiso/permisos` | Implementado en código |
| **Seguridad RBAC** | Crear nuevo rol | `rolPermisoApi.registrarRol` | `POST /api/rolpermiso/rol` | Implementado en código |
| **Seguridad RBAC** | Crear nuevo permiso modular | `rolPermisoApi.registrarPermiso` | `POST /api/rolpermiso/permiso` | Implementado en código |
| **Seguridad RBAC** | Asignar rol a funcionario | `rolPermisoApi.asignarRol` | `POST /api/rolpermiso/asignar-rol` | Implementado en código |
| **Seguridad RBAC** | Conceder permiso a un rol | `rolPermisoApi.asignarPermiso` | `POST /api/rolpermiso/asignar-permiso` | Implementado en código |
| **Seguridad RBAC** | Consultar roles y permisos de un usuario | `rolPermisoApi.rolesPermisosUsuario` | `GET /api/rolpermiso/usuario/{idUsuario}` | Implementado en código |
| **Contribuyentes** | Consultar padrón completo | `contribuyenteApi.padron` | `GET /api/contribuyente` | Implementado en código |
| **Contribuyentes** | Buscar contribuyentes por criterio | `contribuyenteApi.buscar` | `GET /api/contribuyente/buscar` | Implementado en código |
| **Contribuyentes** | Registrar persona física | `contribuyenteApi.registrarFisico` | `POST /api/contribuyente/fisico` | Implementado en código |
| **Contribuyentes** | Registrar persona jurídica | `contribuyenteApi.registrarJuridico` | `POST /api/contribuyente/juridico` | Implementado en código |
| **Contribuyentes** | Actualizar contacto y estado | `contribuyenteApi.actualizar` | `PUT /api/contribuyente/{idContribuyente}` | Implementado en código |
| **Contribuyentes** | Registrar representante legal | `contribuyenteApi.registrarRepresentanteLegal` | `POST /api/contribuyente/{idContribuyente}/representante-legal` | Implementado en código |
| **Inmuebles** | Listar inmuebles con propietarios | `inmuebleApi.listarConPropietarios` | `GET /api/inmueble` | Implementado en código |
| **Inmuebles** | Buscar inmuebles por finca / distrito | `inmuebleApi.buscar` | `GET /api/inmueble/buscar` | Implementado en código |
| **Inmuebles** | Registrar nuevo bien inmueble | `inmuebleApi.registrar` | `POST /api/inmueble` | Implementado en código |
| **Inmuebles** | Actualizar datos catastrales | `inmuebleApi.actualizar` | `PUT /api/inmueble/{idInmueble}` | Implementado en código |
| **Inmuebles** | Asignar derecho de copropiedad | `inmuebleApi.asignarDerecho` | `POST /api/inmueble/{idInmueble}/derechos` | Implementado en código |
| **Inmuebles** | Consultar inmuebles de un contribuyente | `inmuebleApi.porContribuyente` | `GET /api/inmueble/contribuyente/{idContribuyente}` | Implementado en código |
| **Catálogos Inmueble** | Consultar los 7 distritos de Nicoya | `catalogosInmuebleApi.distritos` | `GET /api/catalogosinmueble/distritos` | Implementado en código |
| **Catálogos Inmueble** | Consultar tipos de uso de suelo | `catalogosInmuebleApi.tiposUso` | `GET /api/catalogosinmueble/tipos-uso` | Implementado en código |
| **Tipos de Trámite** | Listar tipos de trámite y SLA | `tipoTramiteApi.consultar` | `GET /api/tipotramite` | Implementado en código |
| **Tipos de Trámite** | Registrar nuevo tipo de trámite | `tipoTramiteApi.registrar` | `POST /api/tipotramite` | Implementado en código |
| **Tipos de Trámite** | Actualizar tipo de trámite | `tipoTramiteApi.actualizar` | `PUT /api/tipotramite/{idTipoTramite}` | Implementado en código |
| **Tipos de Trámite** | Listar catálogo general de requisitos | `tipoTramiteApi.catalogoRequisitos` | `GET /api/tipotramite/requisitos` | Implementado en código |
| **Tipos de Trámite** | Registrar nuevo requisito | `tipoTramiteApi.registrarRequisito` | `POST /api/tipotramite/requisito` | Implementado en código |
| **Tipos de Trámite** | Asociar requisito a tipo de trámite | `tipoTramiteApi.configurarRequisito` | `POST /api/tipotramite/{idTipoTramite}/requisitos/{idRequisito}` | Implementado en código |
| **Tipos de Trámite** | Consultar requisitos de un tipo de trámite | `tipoTramiteApi.requisitosPorTipo` | `GET /api/tipotramite/{idTipoTramite}/requisitos` | Implementado en código |
| **Trámites / Exp.** | Consultar vista de seguimiento | `tramiteApi.seguimiento` | `GET /api/tramite` | Implementado en código |
| **Trámites / Exp.** | Consultar bitácora detallada global | `tramiteApi.historialDetallado` | `GET /api/tramite/historial-detallado` | Implementado en código |
| **Trámites / Exp.** | Buscar expediente por número / contribuyente | `tramiteApi.buscar` | `GET /api/tramite/buscar` | Implementado en código |
| **Trámites / Exp.** | Radicar nuevo trámite | `tramiteApi.registrar` | `POST /api/tramite` | Implementado en código |
| **Trámites / Exp.** | Actualizar funcionario/inmueble de trámite | `tramiteApi.actualizar` | `PUT /api/tramite/{idTramite}` | Implementado en código |
| **Trámites / Exp.** | Subir archivo adjunto al expediente | `tramiteApi.adjuntarArchivo` | `POST /api/tramite/adjuntar-archivo` | Implementado en código |
| **Trámites / Exp.** | Acreditar requisito documental con archivo | `tramiteApi.requisitoPresentado` | `POST /api/tramite/requisito-presentado` | Implementado en código |
| **Trámites / Exp.** | Cambiar estado operativo del trámite | `tramiteApi.cambiarEstado` | `POST /api/tramite/{idTramite}/estado` | Implementado en código |
| **Trámites / Exp.** | Consultar catálogo de estados de trámite | `tramiteApi.estados` | `GET /api/tramite/estados` | Implementado en código |
| **Trámites / Exp.** | Consultar historial de un expediente | `tramiteApi.historial` | `GET /api/tramite/{idTramite}/historial` | Implementado en código |
| **Trámites / Exp.** | Emitir resolución final (`APR` / `RECH`) | `tramiteApi.resolucion` | `POST /api/tramite/{idTramite}/resolucion` | Implementado en código |
| **Trámites / Exp.** | Consultar trámites por contribuyente | `tramiteApi.porContribuyente` | `GET /api/tramite/contribuyente/{idContribuyente}` | Implementado en código |
| **Tributos y Deudas** | Consultar catálogo de tipos de tributo | `tributoDeudaApi.tiposTributo` | `GET /api/tributodeuda/tipos-tributo` | Implementado en código |
| **Tributos y Deudas** | Consultar facturas pendientes de cobro | `tributoDeudaApi.facturasPendientes` | `GET /api/tributodeuda/facturas-pendientes` | Implementado en código |
| **Tributos y Deudas** | Registrar nueva deuda municipal | `tributoDeudaApi.registrarDeuda` | `POST /api/tributodeuda/deuda` | Implementado en código |
| **Tributos y Deudas** | Consultar deudas de un contribuyente | `tributoDeudaApi.deudasContribuyente` | `GET /api/tributodeuda/contribuyente/{idContribuyente}/deudas` | Implementado en código |
| **Tributos y Deudas** | Actualizar estado de deuda | `tributoDeudaApi.actualizarEstadoDeuda` | `PATCH /api/tributodeuda/deuda/{idDeudaMunicipal}/estado` | Implementado en código |
| **Tributos y Deudas** | Recalcular intereses y recargos en BD | `tributoDeudaApi.recalcularIntereses` | `POST /api/tributodeuda/deuda/{idDeudaMunicipal}/recalcular` | Implementado en código |
| **Facturación / Caja** | Consultar estado de cuenta consolidado | `facturacionPagoApi.estadoCuentaGeneral` | `GET /api/facturacionpago/estado-cuenta` | Implementado en código |
| **Facturación / Caja** | Consultar estado de cuenta por contribuyente | `facturacionPagoApi.estadoCuentaContribuyente` | `GET /api/facturacionpago/contribuyente/{idContribuyente}/estado-cuenta` | Implementado en código |
| **Facturación / Caja** | Emitir factura electrónica Hacienda | `facturacionPagoApi.generarFactura` | `POST /api/facturacionpago/factura` | Implementado en código |
| **Facturación / Caja** | Consultar factura por clave Hacienda o ID | `facturacionPagoApi.consultarFactura` | `GET /api/facturacionpago/factura` | Implementado en código |
| **Facturación / Caja** | Consultar facturas de un contribuyente | `facturacionPagoApi.facturasContribuyente` | `GET /api/facturacionpago/contribuyente/{idContribuyente}/facturas` | Implementado en código |
| **Facturación / Caja** | Listar medios de pago autorizados | `facturacionPagoApi.mediosPago` | `GET /api/facturacionpago/medios-pago` | Implementado en código |
| **Facturación / Caja** | Registrar pago municipal en caja | `facturacionPagoApi.registrarPago` | `POST /api/facturacionpago/pago` | Implementado en código |
| **Facturación / Caja** | Aplicar pago a factura y actualizar saldo | `facturacionPagoApi.aplicarPago` | `POST /api/facturacionpago/pago/{idPagoMunicipal}/aplicar` | Implementado en código |
| **Reportes** | Consultar vista de morosidad | `reportesApi.morosidad` | `GET /api/reportes/morosidad` | Implementado en código |
| **Reportes** | Consultar recaudación por tributo (vista) | `reportesApi.recaudacionTributo` | `GET /api/reportes/recaudacion-tributo` | Implementado en código |
| **Reportes** | Consultar recaudación por distrito (vista) | `reportesApi.recaudacionDistrito` | `GET /api/reportes/recaudacion-distrito` | Implementado en código |
| **Reportes** | Consultar historial de trámites por contribuyente | `reportesApi.historialTramites` | `GET /api/reportes/historial-tramites/{idContribuyente}` | Implementado en código |
| **Reportes** | Consultar recaudación por tributo y periodo | `reportesApi.recaudacionTributoPeriodo` | `GET /api/reportes/recaudacion-tributo/periodo` | Implementado en código |
| **Reportes** | Consultar recaudación por distrito y periodo | `reportesApi.recaudacionDistritoPeriodo` | `GET /api/reportes/recaudacion-distrito/periodo` | Implementado en código |
| **Reportes** | Consultar SP de contribuyentes morosos | `reportesApi.contribuyentesMorosos` | `GET /api/reportes/contribuyentes-morosos` | Implementado en código |
| **Reportes** | Consultar solicitudes por departamento | `reportesApi.solicitudesDepartamento` | `GET /api/reportes/solicitudes-departamento` | Implementado en código |
| **Reportes** | Consultar eficiencia de trámites y SLA | `reportesApi.eficienciaTramites` | `GET /api/reportes/eficiencia-tramites` | Implementado en código |
| **Reportes** | Consultar reporte consolidado de gestión | `reportesApi.gestionMunicipal` | `GET /api/reportes/gestion-municipal` | Implementado en código |
| **Auditoría** | Consultar vista detallada de auditoría | `auditoriaApi.detallada` | `GET /api/auditoria` | Implementado en código |
| **Auditoría** | Consultar últimos 500 eventos | `auditoriaApi.recientes` | `GET /api/auditoria/recientes` | Implementado en código |
| **Auditoría** | Filtrar bitácora por tabla, usuario y fechas | `auditoriaApi.filtrar` | `GET /api/auditoria/filtrar` | Implementado en código |
| **Auditoría** | Consultar historial de un registro puntual | `auditoriaApi.registro` | `GET /api/auditoria/registro` | Implementado en código |
| **Auditoría** | Registrar código de tipo de acción | `auditoriaApi.registrarTipoAccion` | `POST /api/auditoria/tipo-accion` | Implementado en código |
| **Auditoría** | Registrar evento en bitácora | `auditoriaApi.registrar` | `POST /api/auditoria` | Implementado en código |
| **Consola DBA** | Consultar monitor de estado de respaldos | `respaldosDbaApi.estado` | `GET /api/respaldosdba/estado` | Implementado en código |
| **Consola DBA** | Consultar catálogo de frecuencias | `respaldosDbaApi.frecuencias` | `GET /api/respaldosdba/frecuencias` | Implementado en código |
| **Consola DBA** | Consultar catálogo de tipos de respaldo | `respaldosDbaApi.tiposRespaldo` | `GET /api/respaldosdba/tipos-respaldo` | Implementado en código |
| **Consola DBA** | Consultar políticas de respaldo | `respaldosDbaApi.configuraciones` | `GET /api/respaldosdba/configuraciones` | Implementado en código |
| **Consola DBA** | Consultar historial de respaldos ejecutados | `respaldosDbaApi.historial` | `GET /api/respaldosdba/historial` | Implementado en código |
| **Consola DBA** | Crear nueva política de respaldo | `respaldosDbaApi.registrarConfiguracion` | `POST /api/respaldosdba/configuracion` | Implementado en código |
| **Consola DBA** | Actualizar política de respaldo | `respaldosDbaApi.actualizarConfiguracion` | `PUT /api/respaldosdba/configuracion/{idRespaldosConfig}` | Implementado en código |
| **Consola DBA** | Ejecutar respaldo `FULL` inmediato | `respaldosDbaApi.backupFull` | `POST /api/respaldosdba/backup-full` | Implementado en código |
| **Consola DBA** | Ejecutar respaldo `DIFERENCIAL` inmediato | `respaldosDbaApi.backupDiferencial` | `POST /api/respaldosdba/backup-diferencial` | Implementado en código |
| **Consola DBA** | Verificar integridad `DBCC CHECKDB` | `respaldosDbaApi.verificarIntegridad` | `POST /api/respaldosdba/verificar-integridad` | Implementado en código |
| **Consola DBA** | Simular restauración de contingencia | `respaldosDbaApi.simularRestauracion` | `POST /api/respaldosdba/simular-restauracion` | Implementado en código |

