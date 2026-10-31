#!/usr/bin/env python3
"""Genera los modelos de Entities (Views/ y SpResults/) a partir de definiciones
de columnas tomadas del script real MunicipalidadNicoya2026.
Formato de columna: "nombre_sql:tipo" con sufijo "?" si admite NULL.
Tipos: int, long, double, decimal, bool, DateTime, TimeSpan, string (string siempre es string?)."""
import json, os, sys

ROOT = sys.argv[1]

PADRON = ["id_contribuyente:int", "tipo_persona:string", "identificacion_oficial:string",
          "nombre_o_razon_social:string", "nombre_fantasia:string", "correo_electronico:string",
          "telefono:string", "direccion_notificaciones:string", "fecha_registro:DateTime",
          "estado_contribuyente:bool", "estado_descripcion:string"]
INMUEBLES_PROP = ["id_inmueble:int", "numero_finca:string", "nombre_distrito:string", "codigo_distrital:string",
                  "codigo_uso:string", "uso_suelo:string", "direccion_exacta:string", "area_terreno_m2:double",
                  "area_construccion_m2:double", "valor_fiscal:double", "plano_catastrado:string",
                  "id_contribuyente:int", "identificacion_oficial:string", "nombre_o_razon_social:string",
                  "porcentaje_participacion:double", "fecha_adquisicion:DateTime", "valor_fiscal_proporcional:double?"]
TRAMITES_SEG = ["id_tramite:int", "numero_expediente:string", "fecha_radicacion:DateTime",
                "fecha_resolucion_estimada:DateTime?", "fecha_resolucion_final:DateTime?", "nombre_tramite:string",
                "dias_resolucion_max:int", "nombre_departamento:string", "id_contribuyente:int",
                "cedula_solicitante:string", "solicitante:string", "funcionario_analista:string",
                "numero_finca:string", "estado_actual:string", "dias_transcurridos:int?",
                "dias_restantes_sla:int?", "fuera_plazo:bool?"]
HISTORIAL = ["id_historial:int", "id_tramite:int", "numero_expediente:string", "nombre_tramite:string",
             "fecha_cambio:DateTime", "codigo_estado:string", "nombre_estado:string", "observaciones:string"]
ESTADO_CUENTA = ["id_contribuyente:int", "identificacion_oficial:string", "nombre_o_razon_social:string",
                 "numero_finca:string", "id_deuda_municipal:int", "periodo_deuda:string", "nombre_tributo:string",
                 "monto_principal:double", "monto_intereses:double", "monto_multas:double", "total_deuda:double?",
                 "fecha_de_vencimiento:DateTime", "codigo_estado_deuda:string", "descripcion_estado_deuda:string",
                 "id_factura:int?", "clave_numerica_hacienda:string", "total_a_pagar:double?",
                 "saldo_pendiente:double?", "estado_factura:string"]
FACT_PEND = ["id_factura:int", "clave_numerica_hacienda:string", "fecha_emision:DateTime", "subtotal:double",
             "descuentos:double", "total_a_pagar:double", "saldo_pendiente:double", "estado_factura:string",
             "id_deuda_municipal:int", "periodo_deuda:string", "nombre_tributo:string", "numero_finca:string",
             "nombre_distrito:string", "dias_mora:int?"]
MOROSIDAD = ["id_contribuyente:int", "identificacion_oficial:string", "nombre_o_razon_social:string",
             "telefono:string", "correo_electronico:string", "numero_finca:string", "nombre_distrito:string",
             "id_deuda_municipal:int", "periodo_deuda:string", "nombre_tributo:string", "monto_principal:double",
             "monto_intereses:double", "monto_multas:double", "deuda_total:double?",
             "fecha_de_vencimiento:DateTime", "dias_mora:int?"]
RECAUD_TRIB = ["id_tipo_tributo:int", "codigo_tributo:string", "nombre_tributo:string", "periodicidad:string",
               "cantidad_transacciones:int", "total_principal_recaudado:double?",
               "total_intereses_recaudados:double?", "total_recargos_recaudados:double?",
               "total_recaudado_general:double?"]
RECAUD_DIST = ["id_distrito:int", "codigo_distrital:string", "nombre_distrito:string", "transacciones_pago:int",
               "principal_recaudado:double?", "intereses_recaudados:double?", "recargos_recaudados:double?",
               "recaudacion_distrital_total:double?"]
AUDITORIA = ["id_auditoria:int", "fecha_hora:DateTime", "operacion_dml:string", "tabla_afectada:string",
             "id_registro_afectado:string", "valores_anteriores:string", "valores_nuevos:string",
             "direccion_ip:string", "id_usuario:int?", "usuario_ejecutor:string", "nombre_departamento:string"]
USR_ROLES = ["id_usuario:int", "user_name:string", "nombre_completo:string", "email_usuario:string",
             "activo:bool", "nombre_departamento:string", "id_rol:int", "nombre_rol:string",
             "id_permiso:int", "modulo:string", "accion:string"]
RESPALDOS = ["id_respaldos:int", "nombre_configuracion:string", "nombre_tipo_respaldo:string",
             "nombre_frecuencia:string", "fecha_inicio:DateTime", "fecha_fin:DateTime?",
             "duracion_segundos:int?", "estado_ejecucion:string", "tamano_bytes:long", "tamano_mb:decimal?",
             "ruta_archivo:string", "detalles_error:string"]

VIEWS = {
    "VwPadronContribuyente": ("vw_padron_contribuyentes", PADRON),
    "VwInmueblesPropietario": ("vw_inmuebles_propietarios", INMUEBLES_PROP),
    "VwTramitesSeguimiento": ("vw_tramites_seguimiento", TRAMITES_SEG),
    "VwHistorialTramitesDetallado": ("vw_historial_tramites_detallado", HISTORIAL),
    "VwEstadoCuentaContribuyente": ("vw_estado_cuenta_contribuyente", ESTADO_CUENTA),
    "VwFacturasPendiente": ("vw_facturas_pendientes", FACT_PEND),
    "VwMorosidadContribuyente": ("vw_morosidad_contribuyentes", MOROSIDAD),
    "VwRecaudacionPorTributo": ("vw_recaudacion_por_tributo", RECAUD_TRIB),
    "VwRecaudacionPorDistrito": ("vw_recaudacion_por_distrito", RECAUD_DIST),
    "VwAuditoriaDetallada": ("vw_auditoria_detallada", AUDITORIA),
    "VwUsuariosRolesPermiso": ("vw_usuarios_roles_permisos", USR_ROLES),
    "VwEstadoRespaldo": ("vw_estado_respaldos", RESPALDOS),
}

# (clase, procedimiento que la produce, columnas)
SP_RESULTS = {
    "SpAutenticarUsuarioResultDto": ("sp_autenticar_usuario", [
        "id_usuario:int", "user_name:string", "nombre_completo:string", "email:string",
        "id_departamento:int", "nombre_departamento:string", "nombre_rol:string"]),
    "SpConsultarUsuarioResultDto": ("sp_consultar_usuario", [
        "id_usuario:int", "user_name:string", "nombre_usuario:string", "apellido1_usuario:string",
        "apellido2_usuario:string", "email_usuario:string", "activo:bool", "nombre_departamento:string"]),
    "SpRolesPermisosUsuarioResultDto": ("sp_consultar_roles_permisos_usuario", USR_ROLES),
    "SpConsultarContribuyenteResultDto": ("sp_consultar_contribuyente", PADRON),
    "SpConsultarInmuebleResultDto": ("sp_consultar_inmueble", [
        "id_inmueble:int", "numero_finca:string", "direccion_exacta:string", "area_terreno_m2:double",
        "area_construccion_m2:double", "valor_fiscal:double", "plano_catastrado:string",
        "id_tipo_uso_inmueble:int", "id_distrito:int", "nombre_distrito:string", "codigo_uso:string",
        "uso_suelo:string"]),
    "SpInmueblesPorContribuyenteResultDto": ("sp_consultar_inmuebles_por_contribuyente", INMUEBLES_PROP),
    "SpDistritoResultDto": ("sp_consultar_distritos", [
        "id_distrito:int", "codigo_distrital:string", "nombre_distrito:string"]),
    "SpTipoUsoInmuebleResultDto": ("sp_consultar_tipos_uso_inmueble", [
        "id_tipo_uso_inmueble:int", "codigo_uso:string", "descripcion:string"]),
    "SpTiposTramiteResultDto": ("sp_consultar_tipos_tramite", [
        "id_tipo_tramite:int", "nombre_tramite:string", "descripcion_tipo:string", "dias_resolucion_max:int",
        "id_departamento:int", "nombre_departamento:string"]),
    "SpRequisitosTramiteResultDto": ("sp_consultar_requisitos_por_tipo_tramite", [
        "id_requisito:int", "nombre_requisito:string", "descripcion:string", "es_obligatorio:bool"]),
    "SpConsultarTramiteResultDto": ("sp_consultar_tramite", TRAMITES_SEG),
    "SpEstadosTramiteResultDto": ("sp_consultar_estados_tramite", [
        "id_estado:int", "codigo:string", "nombre_estado:string"]),
    "SpHistorialTramiteResultDto": ("sp_consultar_historial_tramite", HISTORIAL),
    "SpTramitesPorContribuyenteResultDto": ("sp_consultar_tramites_por_contribuyente", TRAMITES_SEG),
    "SpTiposTributoResultDto": ("sp_consultar_tipos_tributo", [
        "id_tipo_tributo:int", "codigo_tributo:string", "nombre_tributo:string", "base_calculo:string",
        "tarifa:double?", "monto_fijo:double?", "periodicidad:string"]),
    "SpDeudasContribuyenteResultDto": ("sp_consultar_deudas_contribuyente", [
        "id_contribuyente:int", "numero_finca:string", "id_deuda_municipal:int", "periodo_deuda:string",
        "nombre_tributo:string", "monto_principal:double", "monto_intereses:double", "monto_multas:double",
        "monto_total:double?", "fecha_de_vencimiento:DateTime", "codigo_estado_deuda:string",
        "descripcion_estado_deuda:string"]),
    "SpConsultarFacturaResultDto": ("sp_consultar_factura", [
        "id_factura:int", "clave_numerica_hacienda:string", "fecha_emision:DateTime", "subtotal:double",
        "descuentos:double", "total_a_pagar:double", "saldo_pendiente:double", "estado_factura:string",
        "id_deuda_municipal:int", "periodo_deuda:string", "numero_finca:string"]),
    "SpFacturasContribuyenteResultDto": ("sp_consultar_facturas_contribuyente", [
        "id_factura:int", "clave_numerica_hacienda:string", "fecha_emision:DateTime", "subtotal:double",
        "descuentos:double", "total_a_pagar:double", "saldo_pendiente:double", "estado_factura:string",
        "periodo_deuda:string", "numero_finca:string"]),
    "SpMediosPagoResultDto": ("sp_consultar_medios_pago", [
        "id_medio_pago:int", "nombre_medio_pago:string"]),
    "SpEstadoCuentaResultDto": ("sp_consultar_estado_cuenta", ESTADO_CUENTA),
    "SpConsultarAuditoriaResultDto": ("sp_consultar_auditoria", AUDITORIA),
    "SpFiltrarAuditoriaResultDto": ("sp_filtrar_auditoria", AUDITORIA),
    "SpHistorialRespaldosResultDto": ("sp_consultar_historial_respaldos", RESPALDOS),
    "SpReporteHistorialTramitesResultDto": ("sp_reporte_historial_tramites_contribuyente", [
        "identificacion_oficial:string", "nombre_o_razon_social:string", "numero_expediente:string",
        "nombre_tramite:string", "fecha_radicacion:DateTime", "fecha_resolucion_final:DateTime?",
        "fecha_cambio:DateTime", "nombre_estado:string", "observaciones:string"]),
    "SpReporteRecaudacionTributoResultDto": ("sp_reporte_recaudacion_tributo", [
        "codigo_tributo:string", "nombre_tributo:string", "recibos_emitidos:int", "subtotal_principal:double?",
        "subtotal_intereses:double?", "subtotal_recargos:double?", "gran_total_recaudado:double?"]),
    "SpReporteRecaudacionDistritoResultDto": ("sp_reporte_recaudacion_distrito", [
        "codigo_distrital:string", "nombre_distrito:string", "pagos_recibidos:int", "recaudado_principal:double?",
        "recaudado_intereses:double?", "recaudado_recargos:double?", "total_distrito:double?"]),
    "SpReporteContribuyentesMorososResultDto": ("sp_reporte_contribuyentes_morosos", [
        "identificacion_oficial:string", "nombre_o_razon_social:string", "telefono:string",
        "correo_electronico:string", "facturas_pendientes:int", "deuda_acumulada_total:double?",
        "maximos_dias_morosidad:int?"]),
    "SpReporteSolicitudesDeptoResultDto": ("sp_reporte_solicitudes_departamento", [
        "codigo_interno:string", "nombre_departamento:string", "total_solicitudes_recibidas:int",
        "total_resueltas:int?", "total_en_tramite:int?"]),
    "SpReporteEficienciaResultDto": ("sp_reporte_eficiencia_tramites", [
        "nombre_tramite:string", "sla_comprometido:int", "volumen_tramites:int",
        "promedio_dias_resolucion:int?", "total_fuera_plazo:int?", "tasa_exito_sla_porcentaje:decimal?"]),
    "SpRolResultDto": ("sp_consultar_roles", ["id_rol:int", "nombre_rol:string"]),
    "SpPermisoResultDto": ("sp_consultar_permisos", ["id_permiso:int", "modulo:string", "accion:string"]),
    "SpRequisitoResultDto": ("sp_consultar_requisitos", [
        "id_requisito:int", "nombre_requisito:string", "descripcion:string", "es_obligatorio:bool"]),
    "SpDepartamentoResultDto": ("sp_consultar_departamentos", [
        "id_departamento:int", "nombre_departamento:string", "codigo_interno:string"]),
    "SpFrecuenciaResultDto": ("sp_consultar_frecuencias", [
        "id_frecuencia:int", "nombre_frecuencia:string", "intervalo_horas:int", "descripcion_frecuencia:string"]),
    "SpTipoRespaldoResultDto": ("sp_consultar_tipos_respaldo", [
        "id_tipo_de_respaldo:int", "nombre_tipo_respaldo:string", "descripcion:string"]),
    "SpConfiguracionRespaldoResultDto": ("sp_consultar_configuraciones_respaldo", [
        "id_respaldos_config:int", "nombre_configuracion:string", "hora_ejecucion:TimeSpan", "origen:string",
        "retencion_dias:int", "cifrado:string", "ruta_destino:string", "activo:bool", "fecha_creacion:DateTime",
        "fecha_modificacion:DateTime?", "id_frecuencia:int", "nombre_frecuencia:string",
        "id_tipo_de_respaldo:int", "nombre_tipo_respaldo:string"]),
    # ---- Script 15 ----
    "SpCiudadanoAutenticadoResultDto": ("sp_autenticar_ciudadano", [
        "id_contribuyente:int", "identificacion_oficial:string", "nombre_o_razon_social:string",
        "tipo_persona:string", "correo_electronico:string", "telefono:string"]),
    "SpArchivoTramiteResultDto": ("sp_consultar_archivos_tramite", [
        "id_archivo_adjunto:int", "id_tramite:int", "nombre_original:string", "ruta_almacenamiento:string",
        "peso_bytes:double", "fecha_subida:DateTime", "id_requisito:int?", "nombre_requisito:string"]),
    "SpRequisitoTramiteEstadoResultDto": ("sp_consultar_requisitos_tramite", [
        "id_requisito:int", "nombre_requisito:string", "descripcion:string", "es_obligatorio:bool",
        "presentado:bool", "cantidad_archivos:int", "fecha_ultima_presentacion:DateTime?"]),
    "SpPermisoRolResultDto": ("sp_consultar_permisos_por_rol", ["id_permiso:int", "modulo:string", "accion:string"]),
    "SpAsignacionRolResultDto": ("sp_consultar_asignaciones_roles", [
        "id_usuario:int", "user_name:string", "id_rol:int", "nombre_rol:string"]),
    "SpDwEstadoResultDto": ("sp_dw_estado", [
        "dw_instalado:bool", "ultima_carga_inicio:DateTime?", "ultima_carga_fin:DateTime?",
        "ultima_carga_estado:string", "filas_fact_recaudacion:int", "filas_fact_morosidad:int",
        "filas_fact_eficiencia:int"]),
    "SpDwValidacionEtlResultDto": ("sp_dw_ejecutar_etl", [
        "id_carga:int", "control:string", "total_oltp:decimal?", "total_dw:decimal?", "resultado:string"]),
    "SpDwHistorialCargaResultDto": ("sp_dw_historial_cargas", [
        "id_carga:int", "fecha_inicio:DateTime", "fecha_fin:DateTime?", "duracion_segundos:int?",
        "estado:string", "detalle:string", "ejecutado_por:string"]),
    "SpDwRecaudacionPeriodoResultDto": ("sp_dw_recaudacion_periodo", [
        "anio:int?", "trimestre:int?", "mes:int?", "nombre_mes:string", "total_recaudado_principal:decimal?",
        "total_recaudado_intereses:decimal?", "total_descuentos_aplicados:decimal?",
        "total_recaudado_general:decimal?", "transacciones_registradas:int?"]),
    "SpDwRecaudacionTributoResultDto": ("sp_dw_recaudacion_tributo", [
        "codigo_tributo:string", "nombre_tributo:string", "categoria_tributo:string", "periodicidad:string",
        "total_principal:decimal?", "total_intereses:decimal?", "total_recaudado:decimal?"]),
    "SpDwRecaudacionUbicacionResultDto": ("sp_dw_recaudacion_ubicacion", [
        "distrito:string", "zona_rural_urbana:string", "total_principal:decimal?", "total_intereses:decimal?",
        "total_recaudado:decimal?", "total_pagos_distrito:int?"]),
    "SpDwMorosidadResultDto": ("sp_dw_morosidad", [
        "anio:int?", "mes:int?", "nombre_mes:string", "distrito:string", "zona_rural_urbana:string",
        "nombre_tributo:string", "saldo_vencido:decimal?", "cantidad_contribuyentes_morosos:int?"]),
    "SpDwEficienciaTramitesResultDto": ("sp_dw_eficiencia_tramites", [
        "nombre_tramite:string", "plazo_compromiso_sla:int?", "nombre_departamento:string", "estado_final:string",
        "dias_promedio_consumidos:int?", "cantidad_tramites:int?", "estado_cumplimiento:string"]),
    "SpDwIndicadoresDepartamentoResultDto": ("sp_dw_indicadores_departamento", [
        "nombre_departamento:string", "volumen_total_gestionado:int?", "promedio_dias_resolucion_area:int?",
        "tramites_aprobados:int?", "tramites_rechazados:int?"]),
    "SpDbaMonitorResumenResultDto": ("sp_dba_monitor_resumen", [
        "servidor:string", "version_motor:string", "edicion:string", "base_datos:string",
        "inicio_servicio:DateTime?", "minutos_activo:int?", "cpus:int?", "cpu_sql_pct:int?", "cpu_otros_pct:int?",
        "memoria_sql_mb:decimal?", "memoria_total_mb:decimal?", "memoria_disponible_mb:decimal?",
        "memoria_uso_pct:decimal?", "conexiones_usuario:int?", "solicitudes_activas:int?",
        "sesiones_bloqueadas:int?", "transacciones_activas:int?", "datos_mb:decimal?", "datos_usado_mb:decimal?",
        "log_mb:decimal?", "log_usado_pct:decimal?", "ultimo_backup_full:DateTime?",
        "ultimo_backup_diferencial:DateTime?"]),
    "SpDbaMonitorSesionResultDto": ("sp_dba_monitor_sesiones", [
        "session_id:int", "login_name:string", "host_name:string", "direccion_ip:string", "programa:string",
        "estado:string", "comando:string", "base_datos:string", "tipo_espera:string", "bloqueada_por:int?",
        "es_bloqueante:bool", "segundos_ejecucion:int?", "consulta_lenta:bool", "cpu_ms:int?",
        "lecturas_logicas:long?", "consulta:string", "ultima_solicitud:DateTime?", "es_sesion_actual:bool"]),
    "SpDbaMonitorArchivoResultDto": ("sp_dba_monitor_archivos", [
        "base_datos:string", "archivo_logico:string", "tipo:string", "ruta_fisica:string", "tamano_mb:decimal?",
        "usado_mb:decimal?", "maximo_mb:decimal?", "volumen:string", "volumen_total_mb:decimal?",
        "volumen_libre_mb:decimal?", "volumen_libre_pct:decimal?"]),
    "SpDbaFragmentacionResultDto": ("sp_dba_monitor_fragmentacion", [
        "tabla:string", "indice:string", "tipo_indice:string", "fragmentacion_pct:decimal?", "paginas:long?",
        "accion_recomendada:string"]),
    "SpDbaMantenimientoResultDto": ("sp_dba_ejecutar_mantenimiento", [
        "orden:int", "tarea:string", "estado:string", "detalle:string", "duracion_segundos:int?"]),
    "SpDbaHistorialMantenimientoResultDto": ("sp_dba_historial_mantenimiento", [
        "id:int?", "base_datos:string", "objeto:string", "indice:string", "tipo_comando:string", "comando:string",
        "inicio:DateTime?", "fin:DateTime?", "duracion_segundos:int?", "numero_error:int?",
        "mensaje_error:string"]),
}


def pascal(name: str) -> str:
    return "".join(p[:1].upper() + p[1:] for p in name.split("_") if p)


def prop(col: str) -> str:
    name, typ = col.split(":")
    nullable = typ.endswith("?")
    base = typ.rstrip("?")
    if base == "string":
        cs = "string?"
    else:
        cs = base + ("?" if nullable else "")
    return f'        [Column("{name}")]\n        public {cs} {pascal(name)} {{ get; set; }}\n'


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\r\n") as fh:
        fh.write(text)


for cls, (view, cols) in VIEWS.items():
    body = "\n".join(prop(c) for c in cols)
    write(f"{ROOT}/Entities/Views/{cls}.cs", f"""using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{{
    /// <summary>Mapeo de solo lectura de la vista dbo.{view}.</summary>
    [Keyless]
    public class {cls}
    {{
{body}    }}
}}
""")

for cls, (sp, cols) in SP_RESULTS.items():
    body = "\n".join(prop(c) for c in cols)
    write(f"{ROOT}/Entities/SpResults/{cls}.cs", f"""using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{{
    /// <summary>Recordset devuelto por dbo.{sp}.</summary>
    public class {cls}
    {{
{body}    }}
}}
""")

# Dump para el verificador
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "entity_columns.json"), "w") as fh:
    json.dump({"views": {c: [v, [x.split(':')[0] for x in cols]] for c, (v, cols) in VIEWS.items()},
               "sp": {c: [s, [x.split(':')[0] for x in cols]] for c, (s, cols) in SP_RESULTS.items()}}, fh, indent=1)
print("ok", len(VIEWS), len(SP_RESULTS))

# ---------------------------------------------------------------------------
# Tipos TypeScript para el frontend (muni_front/src/types/generated.ts).
# Mismos nombres que serializa ASP.NET (camelCase de la propiedad C#).
# ---------------------------------------------------------------------------
def camel(name: str) -> str:
    p = pascal(name)
    return p[:1].lower() + p[1:]


def ts_prop(col: str) -> str:
    name, typ = col.split(":")
    nullable = typ.endswith("?")
    base = typ.rstrip("?")
    ts = {"int": "number", "long": "number", "double": "number", "decimal": "number", "bool": "boolean",
          "DateTime": "string", "TimeSpan": "string", "string": "string"}[base]
    if base == "string" or nullable:
        ts += " | null"
    return f"  /** {name} */\n  {camel(name)}: {ts};\n"


front = os.path.join(ROOT, "..", "muni_front", "src", "types")
if os.path.isdir(front):
    out = ["// ============================================================================",
           "// ARCHIVO GENERADO por muni-back/tools/generar_entities.py. NO EDITAR A MANO.",
           "// Recordsets de las vistas dbo.vw_* y de los procedimientos dbo.sp_* tal como",
           "// los devuelve la API (camelCase). Los valores de texto pueden venir en null.",
           "// ============================================================================", ""]
    for cls, (view, cols) in VIEWS.items():
        out.append(f"/** Vista dbo.{view} */")
        out.append(f"export interface {cls} {{")
        out.append("".join(ts_prop(c) for c in cols).rstrip("\n"))
        out.append("}\n")
    for cls, (sp, cols) in SP_RESULTS.items():
        out.append(f"/** Recordset de dbo.{sp} */")
        out.append(f"export interface {cls} {{")
        out.append("".join(ts_prop(c) for c in cols).rstrip("\n"))
        out.append("}\n")
    with open(os.path.join(front, "generated.ts"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(out))
    print("ts ok", os.path.join(front, "generated.ts"))
