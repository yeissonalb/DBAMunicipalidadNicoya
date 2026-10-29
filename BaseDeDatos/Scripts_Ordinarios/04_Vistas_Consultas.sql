/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 04: VISTAS DE CONSULTA Y GESTIÓN MUNICIPAL (VISC-01 A VISC-12)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- VISC-01: vw_padron_contribuyentes
-- Consolidación del padrón general con datos físicos y jurídicos unificados
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_padron_contribuyentes
AS
SELECT 
    c.id_contribuyente,
    CASE 
        WHEN cf.id_contribuyente_fisico IS NOT NULL THEN 'Física'
        WHEN cj.id_contribuyente_juridico IS NOT NULL THEN 'Jurídica'
        ELSE 'Indeterminado'
    END AS tipo_persona,
    ISNULL(cf.cedula_identidad, cj.cedula_juridica) AS identificacion_oficial,
    CASE 
        WHEN cf.id_contribuyente_fisico IS NOT NULL 
            THEN RTRIM(LTRIM(CONCAT(cf.nombre, ' ', cf.apellido1_fisico, ' ', cf.apellido2_fisico)))
        WHEN cj.id_contribuyente_juridico IS NOT NULL 
            THEN cj.razon_social
        ELSE 'Sin Identificar'
    END AS nombre_o_razon_social,
    cj.nombre_fantasia,
    c.correo_electronico,
    c.telefono,
    c.direccion_notificaciones,
    c.fecha_registro,
    c.estado_contribuyente,
    CASE WHEN c.estado_contribuyente = 1 THEN 'Activo' ELSE 'Inactivo' END AS estado_descripcion
FROM dbo.Contribuyente c
LEFT JOIN dbo.Contribuyente_Fisico cf ON c.id_contribuyente = cf.id_contribuyente
LEFT JOIN dbo.Contribuyente_Juridico cj ON c.id_contribuyente = cj.id_contribuyente;
GO

-- ============================================================================
-- VISC-02: vw_inmuebles_propietarios
-- Relación de bienes inmuebles catastrados con sus titulares y cuotas
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_inmuebles_propietarios
AS
SELECT 
    bi.id_inmueble,
    bi.numero_finca,
    d.nombre_distrito,
    d.codigo_distrital,
    tui.codigo_uso,
    tui.descripcion AS uso_suelo,
    bi.direccion_exacta,
    bi.area_terreno_m2,
    bi.area_construccion_m2,
    bi.valor_fiscal,
    bi.plano_catastrado,
    c.id_contribuyente,
    p.identificacion_oficial,
    p.nombre_o_razon_social,
    di.porcentaje_participacion,
    di.fecha_adquisicion,
    dbo.fn_valor_fiscal_proporcional(bi.id_inmueble, c.id_contribuyente) AS valor_fiscal_proporcional
FROM dbo.Bien_Inmueble bi
INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
INNER JOIN dbo.Tipo_Uso_Inmueble tui ON bi.id_tipo_uso_inmueble = tui.id_tipo_uso_inmueble
INNER JOIN dbo.Derecho_Inmueble di ON bi.id_inmueble = di.id_inmueble
INNER JOIN dbo.Contribuyente c ON di.id_contribuyente = c.id_contribuyente
INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente;
GO

-- ============================================================================
-- VISC-03: vw_tramites_seguimiento
-- Seguimiento ejecutivo de expedientes con estado vigente del historial
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_tramites_seguimiento
AS
SELECT 
    t.id_tramite,
    t.numero_expediente,
    t.fecha_radicacion,
    t.fecha_resolucion_estimada,
    t.fecha_resolucion_final,
    tt.nombre_tramite,
    tt.dias_resolucion_max,
    dep.nombre_departamento,
    c.id_contribuyente,
    p.identificacion_oficial AS cedula_solicitante,
    p.nombre_o_razon_social AS solicitante,
    u.user_name AS funcionario_analista,
    bi.numero_finca,
    dbo.fn_ultimo_estado_tramite(t.id_tramite) AS estado_actual,
    dbo.fn_dias_transcurridos_tramite(t.id_tramite) AS dias_transcurridos,
    dbo.fn_dias_restantes_tramite(t.id_tramite) AS dias_restantes_sla,
    dbo.fn_tramite_fuera_plazo(t.id_tramite) AS fuera_plazo
FROM dbo.Tramite t
INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
INNER JOIN dbo.Departamento dep ON tt.id_departamento = dep.id_departamento
INNER JOIN dbo.Usuario u ON t.id_usuario = u.id_usuario
INNER JOIN dbo.Contribuyente c ON t.id_contribuyente = c.id_contribuyente
INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
LEFT JOIN dbo.Bien_Inmueble bi ON t.id_inmueble = bi.id_inmueble;
GO

-- ============================================================================
-- VISC-04: vw_historial_tramites_detallado
-- Trazabilidad cronológica de eventos y revisiones por expediente
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_historial_tramites_detallado
AS
SELECT 
    ht.id_historial,
    t.id_tramite,
    t.numero_expediente,
    tt.nombre_tramite,
    ht.fecha_cambio,
    et.codigo AS codigo_estado,
    et.nombre_estado,
    ht.observaciones
FROM dbo.Historial_Tramite ht
INNER JOIN dbo.Tramite t ON ht.id_tramite = t.id_tramite
INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
INNER JOIN dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado;
GO

-- ============================================================================
-- VISC-05: vw_estado_cuenta_contribuyente
-- Estado de cuenta integral: inmuebles, deudas, facturación y pagos
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_estado_cuenta_contribuyente
AS
SELECT 
    c.id_contribuyente,
    p.identificacion_oficial,
    p.nombre_o_razon_social,
    bi.numero_finca,
    dm.id_deuda_municipal,
    dm.periodo_deuda,
    tt.nombre_tributo,
    dm.monto_principal,
    dm.monto_intereses,
    dm.monto_multas,
    dbo.fn_calcular_total_deuda(dm.id_deuda_municipal) AS total_deuda,
    dm.fecha_de_vencimiento,
    ed.codigo_estado_deuda,
    ed.descripcion_estado_deuda,
    f.id_factura,
    f.clave_numerica_hacienda,
    f.total_a_pagar,
    f.saldo_pendiente,
    f.estado_factura
FROM dbo.Contribuyente c
INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
INNER JOIN dbo.Deudas_Municipales dm ON bi.id_inmueble = dm.id_inmueble
INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
LEFT JOIN dbo.Factura f ON dm.id_deuda_municipal = f.id_deuda_municipal;
GO

-- ============================================================================
-- VISC-06: vw_facturas_pendientes
-- Facturas con saldos pendientes por recaudar
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_facturas_pendientes
AS
SELECT 
    f.id_factura,
    f.clave_numerica_hacienda,
    f.fecha_emision,
    f.subtotal,
    f.descuentos,
    f.total_a_pagar,
    f.saldo_pendiente,
    f.estado_factura,
    dm.id_deuda_municipal,
    dm.periodo_deuda,
    tt.nombre_tributo,
    bi.numero_finca,
    d.nombre_distrito,
    dbo.fn_calcular_dias_mora(dm.id_deuda_municipal) AS dias_mora
FROM dbo.Factura f
INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
INNER JOIN dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
WHERE f.saldo_pendiente > 0 AND f.estado_factura = 'Pendiente';
GO

-- ============================================================================
-- VISC-07: vw_morosidad_contribuyentes
-- Contribuyentes con obligaciones vencidas e importes de mora
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_morosidad_contribuyentes
AS
SELECT 
    c.id_contribuyente,
    p.identificacion_oficial,
    p.nombre_o_razon_social,
    c.telefono,
    c.correo_electronico,
    bi.numero_finca,
    d.nombre_distrito,
    dm.id_deuda_municipal,
    dm.periodo_deuda,
    tt.nombre_tributo,
    dm.monto_principal,
    dm.monto_intereses,
    dm.monto_multas,
    dbo.fn_calcular_total_deuda(dm.id_deuda_municipal) AS deuda_total,
    dm.fecha_de_vencimiento,
    dbo.fn_calcular_dias_mora(dm.id_deuda_municipal) AS dias_mora
FROM dbo.Contribuyente c
INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
INNER JOIN dbo.Deudas_Municipales dm ON bi.id_inmueble = dm.id_inmueble
INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
WHERE ed.codigo_estado_deuda = 'VENC' OR (ed.codigo_estado_deuda = 'PEND' AND dm.fecha_de_vencimiento < GETDATE());
GO

-- ============================================================================
-- VISC-08: vw_recaudacion_por_tributo
-- Recaudación efectiva desglosada por concepto tributario
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_recaudacion_por_tributo
AS
SELECT 
    tt.id_tipo_tributo,
    tt.codigo_tributo,
    tt.nombre_tributo,
    tt.periodicidad,
    COUNT(DISTINCT df.id_detalle_factura) AS cantidad_transacciones,
    SUM(df.monto_aplicado_principal) AS total_principal_recaudado,
    SUM(df.monto_aplicado_interes) AS total_intereses_recaudados,
    SUM(df.monto_aplicado_recargo) AS total_recargos_recaudados,
    SUM(df.monto_aplicado_principal + df.monto_aplicado_interes + df.monto_aplicado_recargo) AS total_recaudado_general
FROM dbo.Detalle_Factura df
INNER JOIN dbo.Factura f ON df.id_factura = f.id_factura
INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
GROUP BY tt.id_tipo_tributo, tt.codigo_tributo, tt.nombre_tributo, tt.periodicidad;
GO

-- ============================================================================
-- VISC-09: vw_recaudacion_por_distrito
-- Ingresos municipales clasificados geográficamente por distrito cantonal
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_recaudacion_por_distrito
AS
SELECT 
    d.id_distrito,
    d.codigo_distrital,
    d.nombre_distrito,
    COUNT(DISTINCT df.id_detalle_factura) AS transacciones_pago,
    SUM(df.monto_aplicado_principal) AS principal_recaudado,
    SUM(df.monto_aplicado_interes) AS intereses_recaudados,
    SUM(df.monto_aplicado_recargo) AS recargos_recaudados,
    SUM(df.monto_aplicado_principal + df.monto_aplicado_interes + df.monto_aplicado_recargo) AS recaudacion_distrital_total
FROM dbo.Detalle_Factura df
INNER JOIN dbo.Factura f ON df.id_factura = f.id_factura
INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
INNER JOIN dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
GROUP BY d.id_distrito, d.codigo_distrital, d.nombre_distrito;
GO

-- ============================================================================
-- VISC-10: vw_auditoria_detallada
-- Pistas de auditoría enriquecidas con datos del usuario e IP
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_auditoria_detallada
AS
SELECT 
    la.id_auditoria,
    la.fecha_hora,
    ta.codigo AS operacion_dml,
    la.tabla_afectada,
    la.id_registro_afectado,
    la.valores_anteriores,
    la.valores_nuevos,
    la.direccion_ip,
    u.id_usuario,
    ISNULL(u.user_name, 'SISTEMA_INTERNO') AS usuario_ejecutor,
    dep.nombre_departamento
FROM dbo.Logs_Acciones_Auditoria la
INNER JOIN dbo.Tipo_Accion_Auditoria ta ON la.id_tipo_accion = ta.id_tipo_accion
LEFT JOIN dbo.Usuario u ON la.id_usuario = u.id_usuario
LEFT JOIN dbo.Departamento dep ON u.id_departamento = dep.id_departamento;
GO

-- ============================================================================
-- VISC-11: vw_usuarios_roles_permisos
-- Matriz de seguridad: funcionarios, perfiles y privilegios asignados
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_usuarios_roles_permisos
AS
SELECT 
    u.id_usuario,
    u.user_name,
    CONCAT(u.nombre_usuario, ' ', u.apellido1_usuario, ' ', u.apellido2_usuario) AS nombre_completo,
    u.email_usuario,
    u.activo,
    dep.nombre_departamento,
    r.id_rol,
    r.nombre_rol,
    p.id_permiso,
    p.modulo,
    p.accion
FROM dbo.Usuario u
INNER JOIN dbo.Departamento dep ON u.id_departamento = dep.id_departamento
INNER JOIN dbo.Rol_Usuario ru ON u.id_usuario = ru.id_usuario
INNER JOIN dbo.Rol r ON ru.id_rol = r.id_rol
INNER JOIN dbo.Rol_Permiso rp ON r.id_rol = rp.id_rol
INNER JOIN dbo.Permiso p ON rp.id_permiso = p.id_permiso;
GO

-- ============================================================================
-- VISC-12: vw_estado_respaldos
-- Monitor operacional para DBA del subsistema de backups y recuperaciones
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_estado_respaldos
AS
SELECT 
    r.id_respaldos,
    rc.nombre_configuracion,
    tr.nombre_tipo_respaldo,
    f.nombre_frecuencia,
    r.fecha_inicio,
    r.fecha_fin,
    DATEDIFF(SECOND, r.fecha_inicio, r.fecha_fin) AS duracion_segundos,
    er.nombre_estados AS estado_ejecucion,
    r.tamano_bytes,
    ROUND(r.tamano_bytes / 1048576.0, 2) AS tamano_mb,
    r.ruta_archivo,
    r.detalles_error
FROM dbo.Respaldos r
INNER JOIN dbo.Respaldos_Config rc ON r.id_respaldo_config = rc.id_respaldos_config
INNER JOIN dbo.Tipo_de_respaldo tr ON rc.id_tipo_de_respaldo = tr.id_tipo_de_respaldo
INNER JOIN dbo.Frecuencia f ON rc.id_frecuencia = f.id_frecuencia
INNER JOIN dbo.Estados_Respaldos er ON r.id_estados_respaldos = er.id_estados_respaldos;
GO

PRINT '-> 12 Vistas de consulta creadas exitosamente.';
GO
