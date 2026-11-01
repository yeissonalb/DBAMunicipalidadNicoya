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
