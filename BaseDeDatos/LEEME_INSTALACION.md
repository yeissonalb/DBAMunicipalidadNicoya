# Instalacion limpia del proyecto

Este conjunto consolida las definiciones finales por funcion. No ejecute las antiguas migraciones 13-27 sobre esta instalacion.

## Requisitos

- Motor **SQL Server 2022 (16.x) o posterior**; SSMS por si solo no instala el motor. Para las funciones DBA completas utilice Developer/Standard/Enterprise. Express no incluye SQL Server Agent.
- Ejecutar la instalacion con una cuenta administradora de la instancia. Los logins y roles SQL se conservan segun el script de seguridad del proyecto.
- Crear `C:\SQLData` y `C:\SQLLOG` en cada computadora y conceder acceso al servicio SQL Server. Los scripts usan esas rutas fijas.
- Los respaldos utilizan `C:\Backups_Nicoya2026`. Los archivos adjuntos del aplicativo se configuran aparte en la API.

## Ejecucion

1. Conservar respaldos y detener la API antes de una reinstalacion.
2. El borrado es una operacion separada: no lo realiza el instalador. Nunca ejecutar el borrado sobre bases con informacion que se quiera conservar.
3. Abrir `Scripts_Ordinarios/MunicipalidadNicoya2026_MASTER.sql` en SSMS y activar **Consulta > Modo SQLCMD**. Este MASTER contiene el codigo completo, no depende de rutas absolutas ni de archivos `:r`.
4. Ejecutar una sola vez. `:ON ERROR EXIT` detiene el proceso ante el primer error; no continuar manualmente saltando errores. Si falla, conservar el mensaje y corregirlo antes de reinstalar.
5. El MASTER crea las tres bases, sus objetos y los catalogos/usuarios. No carga contribuyentes, inmuebles, deudas, pagos, documentos ni tramites ficticios; el Data Warehouse comienza sin hechos.
6. Configurar en cada computadora el servidor SQL y credenciales de su API. No copiar el nombre del servidor de otra maquina. Ejecutar la API y el frontend.
7. Configurar con `dbo.sp_configurar_inmueble_tramite` la regla de inmueble de cada tipo de tramite, usando un usuario administrador y las reglas aprobadas del proyecto. El instalador no inventa estas reglas; sin configuracion, la radicacion se bloquea deliberadamente.
8. Ejecutar `Scripts_Ordinarios/11_Validacion_Instalacion.sql` y comprobar que no reporte objetos faltantes ni restricciones o triggers desactivados.
9. Probar autenticacion y un flujo nuevo de contribuyente, inmueble, tramite y pago. Ejecutar ETL despues de tener operaciones.

## Distribucion

| Archivo | Contenido |
|---|---|
| 01_Creacion_Base_Filegroups.sql | Base operativa y filegroups |
| 02_Creacion_Tablas.sql | Tablas, claves, restricciones, indices de tablas y secuencia operativa |
| 03_Funciones_Negocio.sql | Funciones operativas y analiticas, con contexto USE explicito |
| 04_Vistas_Consultas.sql | Vistas operativas y analiticas |
| 05_Procedimientos_Operacionales.sql | Procedimientos operativos, portal, caja, ETL y monitoreo |
| 06_Triggers_Auditoria_Negocio.sql | Triggers finales de auditoria e integridad |
| 07_Seguridad_SQLServer.sql | Logins, usuarios, roles y permisos |
| 08_Estrategia_Respaldos_DBA.sql | Procedimientos de respaldo/verificacion y jobs optativos |
| 09_Datos_Semilla_Pruebas.sql | Catalogos y usuarios institucionales; sin transacciones de prueba |
| 10_Consultas_Validacion_Joins.sql | Procedimientos de consulta con joins |
| DataWareHouse/DWH_Structure.sql | Base analitica y sus nueve tablas |
| PlanDeMantenimientoBD | Base de mantenimiento y rutinas existentes |

Los antiguos DWH_ETL y DWH_Vistas_Analiticas solo indican la nueva ubicacion; no reinstalan versiones anteriores. La rectificacion puntual del tramite 1 (antiguo script 27) queda exclusivamente en la copia historica, fuera del instalador.

## SQL Server Agent

Los jobs quedan fuera de la configuracion predeterminada: existen dos estrategias historicas de programacion y activarlas juntas duplicaria tareas. Para programar trabajos, elegir una estrategia, establecer `Nicoya_Configurar_Jobs=1` mediante `sys.sp_set_session_context` y ejecutar su archivo en esa misma sesion. No activar ambos juegos para las mismas tareas. Los procedimientos manuales de respaldo y mantenimiento no requieren que se creen los jobs.

## Alcance de la comprobacion

La revision estatica de sintaxis y de llamadas de la API no sustituye una instalacion real. No se han eliminado ni reinstalado las bases del servidor durante la consolidacion. Antes de distribuir como version final, ejecutar el MASTER en una instancia de prueba y completar las pruebas funcionales.

## Cambios de instalacion adicionales

Los logins SQL ya existentes conservan su contrasena; el instalador no cierra sus sesiones ni cambia propietarios de otras bases. Los tamanos de respaldos se consultan en msdb en vez de registrarse como 100 MB o 20 MB fijos. La comprobacion de definiciones cubre los 112 procedimientos invocados literalmente por los servicios de la API; no equivale a probar sus parametros y ejecucion en una instancia nueva.
