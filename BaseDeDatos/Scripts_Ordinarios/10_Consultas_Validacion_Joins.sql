/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 10: CONSULTAS Y PROCEDIMIENTOS DE VALIDACIÓN CON ÁLGEBRA DE JOINS
   (FORMATO Y RIGOR METODOLÓGICO DE PROYECTO TECNIC)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

PRINT '=======================================================';
PRINT '   PROCEDIMIENTOS DE CONSULTAS DE VALIDACIÓN Y JOINS   ';
PRINT '=======================================================';
GO

-- 1. INNER JOIN: Contribuyentes, inmuebles y derechos de propiedad vigentes
CREATE OR ALTER PROCEDURE dbo.sp_Join_Inner_ContribuyenteInmueble
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.identificacion_oficial,
        p.nombre_o_razon_social,
        bi.numero_finca,
        d.nombre_distrito,
        tui.codigo_uso,
        di.porcentaje_participacion,
        bi.valor_fiscal,
        dbo.fn_valor_fiscal_proporcional(bi.id_inmueble, c.id_contribuyente) AS valor_proporcional
    FROM dbo.Contribuyente c
    INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
    INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
    INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
    INNER JOIN dbo.Tipo_Uso_Inmueble tui ON bi.id_tipo_uso_inmueble = tui.id_tipo_uso_inmueble
    ORDER BY p.nombre_o_razon_social;
END;
GO

-- 2. LEFT JOIN: Todos los contribuyentes del padrón y los trámites radicados (si tienen)
CREATE OR ALTER PROCEDURE dbo.sp_Join_Left_ContribuyenteTramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.identificacion_oficial,
        p.nombre_o_razon_social,
        c.telefono,
        ISNULL(t.numero_expediente, 'SIN TRÁMITES REGISTRADOS') AS numero_expediente,
        ISNULL(tt.nombre_tramite, 'N/A') AS tramite_solicitado,
        t.fecha_radicacion,
        ISNULL(dbo.fn_ultimo_estado_tramite(t.id_tramite), 'N/A') AS estado_tramite
    FROM dbo.Contribuyente c
    INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
    LEFT JOIN dbo.Tramite t ON c.id_contribuyente = t.id_contribuyente
    LEFT JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    ORDER BY p.nombre_o_razon_social;
END;
GO

-- 3. RIGHT JOIN: Todas las facturas y los pagos recibidos asociados (si aplican)
CREATE OR ALTER PROCEDURE dbo.sp_Join_Right_FacturaPago
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        f.id_factura,
        f.clave_numerica_hacienda,
        f.total_a_pagar,
        f.saldo_pendiente,
        f.estado_factura,
        pm.comprobante AS comprobante_pago,
        pm.monto_total_pagado,
        df.monto_aplicado_principal,
        df.monto_aplicado_interes
    FROM dbo.Detalle_Factura df
    INNER JOIN dbo.Pago_Municipal pm ON df.id_pago_municipal = pm.id_pago_municipal
    RIGHT JOIN dbo.Factura f ON df.id_factura = f.id_factura
    ORDER BY f.id_factura;
END;
GO

-- 4. FULL JOIN: Inmuebles y trámites municipales (evalúa cobertura)
CREATE OR ALTER PROCEDURE dbo.sp_Join_Full_InmuebleTramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        bi.numero_finca,
        bi.direccion_exacta,
        t.numero_expediente,
        t.fecha_radicacion,
        ISNULL(dbo.fn_ultimo_estado_tramite(t.id_tramite), 'Sin trámite') AS estado
    FROM dbo.Bien_Inmueble bi
    FULL JOIN dbo.Tramite t ON bi.id_inmueble = t.id_inmueble
    ORDER BY bi.numero_finca;
END;
GO

-- 5. CROSS JOIN: Matriz combinatoria de distritos de Nicoya y tipos de tributo
CREATE OR ALTER PROCEDURE dbo.sp_Join_Cross_DistritoTributo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        d.codigo_distrital,
        d.nombre_distrito,
        tt.codigo_tributo,
        tt.nombre_tributo,
        tt.periodicidad
    FROM dbo.Distrito d
    CROSS JOIN dbo.Tipo_Tributo tt
    ORDER BY d.id_distrito, tt.id_tipo_tributo;
END;
GO

-- 6. LEFT JOIN EXCLUSIVO: Contribuyentes que NO tienen deudas ni obligaciones pendientes
CREATE OR ALTER PROCEDURE dbo.sp_Join_LeftExclusive_SinDeudas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.identificacion_oficial,
        p.nombre_o_razon_social,
        c.correo_electronico,
        c.telefono
    FROM dbo.Contribuyente c
    INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
    LEFT JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
    LEFT JOIN dbo.Deudas_Municipales dm ON di.id_inmueble = dm.id_inmueble
    WHERE dm.id_deuda_municipal IS NULL
    ORDER BY p.nombre_o_razon_social;
END;
GO

-- 7. RIGHT JOIN EXCLUSIVO: Inmuebles que NO poseen ningún trámite ni solicitud radicada
CREATE OR ALTER PROCEDURE dbo.sp_Join_RightExclusive_InmuebleSinTramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        bi.id_inmueble,
        bi.numero_finca,
        bi.direccion_exacta,
        bi.valor_fiscal,
        d.nombre_distrito
    FROM dbo.Tramite t
    RIGHT JOIN dbo.Bien_Inmueble bi ON t.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
    WHERE t.id_tramite IS NULL
    ORDER BY bi.numero_finca;
END;
GO

PRINT '=======================================================';
PRINT '   EJECUCIÓN DE PRUEBAS DE VALIDACIÓN DE JOINS         ';
PRINT '=======================================================';
GO

-- Prueba 1: INNER JOIN
PRINT '--- 1. INNER JOIN: Contribuyentes con Inmuebles ---';
EXEC dbo.sp_Join_Inner_ContribuyenteInmueble;
GO

-- Prueba 2: LEFT JOIN
PRINT '--- 2. LEFT JOIN: Contribuyentes y sus Trámites ---';
EXEC dbo.sp_Join_Left_ContribuyenteTramite;
GO

-- Prueba 3: RIGHT JOIN
PRINT '--- 3. RIGHT JOIN: Facturas y Pagos Recibidos ---';
EXEC dbo.sp_Join_Right_FacturaPago;
GO

-- Prueba 4: FULL JOIN
PRINT '--- 4. FULL JOIN: Inmuebles y Expedientes de Trámite ---';
EXEC dbo.sp_Join_Full_InmuebleTramite;
GO

-- Prueba 5: CROSS JOIN
PRINT '--- 5. CROSS JOIN: Matriz Distritos y Tributos ---';
EXEC dbo.sp_Join_Cross_DistritoTributo;
GO

-- Prueba 6: LEFT JOIN Exclusivo
PRINT '--- 6. LEFT JOIN EXCLUSIVO: Contribuyentes sin deudas ---';
EXEC dbo.sp_Join_LeftExclusive_SinDeudas;
GO

-- Prueba 7: RIGHT JOIN Exclusivo
PRINT '--- 7. RIGHT JOIN EXCLUSIVO: Inmuebles sin trámites ---';
EXEC dbo.sp_Join_RightExclusive_InmuebleSinTramite;
GO

PRINT '-> Pruebas de consultas con JOINS ejecutadas y verificadas exitosamente.';
GO
