/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ARCHIVO: DataWareHouse\DWH_Vistas_Analiticas.sql
   ============================================================================
   VISTAS ANALÍTICAS DEL DATA WAREHOUSE PARA EL BACKEND (NestJS / reportes.service.ts)
   Consolida hechos y dimensiones para su exposición directa en endpoints de BI.
   ============================================================================ */

USE MunicipalidadNicoyaDataMart2026;
GO

SET NOCOUNT ON;
GO

-- 1. vw_dw_recaudacion_periodo: Recaudación mensual y anual
CREATE OR ALTER VIEW dbo.vw_dw_recaudacion_periodo
AS
SELECT 
    dt.anio,
    dt.trimestre,
    dt.mes,
    dt.nombre_mes,
    SUM(fr.monto_recaudado) AS total_recaudado_principal,
    SUM(fr.monto_intereses) AS total_recaudado_intereses,
    SUM(fr.monto_descuento) AS total_descuentos_aplicados,
    SUM(fr.monto_recaudado + fr.monto_intereses) AS total_recaudado_general,
    COUNT(fr.id_recaudacion) AS transacciones_registradas
FROM dbo.FACT_RECAUDACION fr
INNER JOIN dbo.DIM_TIEMPO dt ON fr.id_tiempo = dt.id_tiempo
GROUP BY dt.anio, dt.trimestre, dt.mes, dt.nombre_mes;
GO

-- 2. vw_dw_recaudacion_tributo: Recaudación por concepto y categoría analítica
CREATE OR ALTER VIEW dbo.vw_dw_recaudacion_tributo
AS
SELECT 
    dtr.codigo_tributo,
    dtr.nombre_tributo,
    dtr.categoria_tributo,
    dtr.periodicidad,
    SUM(fr.monto_recaudado) AS total_principal,
    SUM(fr.monto_intereses) AS total_intereses,
    SUM(fr.monto_recaudado + fr.monto_intereses) AS total_recaudado
FROM dbo.FACT_RECAUDACION fr
INNER JOIN dbo.DIM_TRIBUTO dtr ON fr.id_tributo_dw = dtr.id_tributo_dw
GROUP BY dtr.codigo_tributo, dtr.nombre_tributo, dtr.categoria_tributo, dtr.periodicidad;
GO

-- 3. vw_dw_recaudacion_ubicacion: Recaudación territorial por distrito y zona
CREATE OR ALTER VIEW dbo.vw_dw_recaudacion_ubicacion
AS
SELECT 
    du.distrito,
    du.zona_rural_urbana,
    SUM(fr.monto_recaudado) AS total_principal,
    SUM(fr.monto_intereses) AS total_intereses,
    SUM(fr.monto_recaudado + fr.monto_intereses) AS total_recaudado,
    COUNT(fr.id_recaudacion) AS total_pagos_distrito
FROM dbo.FACT_RECAUDACION fr
INNER JOIN dbo.DIM_UBICACION du ON fr.id_ubicacion_dw = du.id_ubicacion_dw
GROUP BY du.distrito, du.zona_rural_urbana;
GO

-- 4. vw_dw_morosidad: Saldos vencidos y conteo de contribuyentes morosos
CREATE OR ALTER VIEW dbo.vw_dw_morosidad
AS
SELECT 
    dt.anio,
    dt.mes,
    dt.nombre_mes,
    du.distrito,
    du.zona_rural_urbana,
    dtr.nombre_tributo,
    fm.saldo_vencido,
    fm.cantidad_contribuyentes_morosos
FROM dbo.FACT_MOROSIDAD fm
INNER JOIN dbo.DIM_TIEMPO dt ON fm.id_tiempo = dt.id_tiempo
INNER JOIN dbo.DIM_UBICACION du ON fm.id_ubicacion_dw = du.id_ubicacion_dw
INNER JOIN dbo.DIM_TRIBUTO dtr ON fm.id_tributo_dw = dtr.id_tributo_dw;
GO

-- 5. vw_dw_eficiencia_tramites: SLA y días promedio de resolución
CREATE OR ALTER VIEW dbo.vw_dw_eficiencia_tramites
AS
SELECT 
    dtram.nombre_tramite,
    dtram.plazo_dias_resolucion AS plazo_compromiso_sla,
    ddep.nombre_departamento,
    fet.estado_final,
    fet.dias_resolucion AS dias_promedio_consumidos,
    fet.cantidad_tramites,
    CASE 
        WHEN fet.dias_resolucion <= dtram.plazo_dias_resolucion THEN 'Dentro del Plazo SLA'
        ELSE 'Superó Plazo SLA'
    END AS estado_cumplimiento
FROM dbo.FACT_EFICIENCIA_TRAMITES fet
INNER JOIN dbo.DIM_TRAMITE dtram ON fet.id_tramite_dw = dtram.id_tramite_dw
INNER JOIN dbo.DIM_DEPARTAMENTO ddep ON fet.id_departamento_dw = ddep.id_departamento_dw;
GO

-- 6. vw_dw_indicadores_departamento: Resumen por unidad administrativa
CREATE OR ALTER VIEW dbo.vw_dw_indicadores_departamento
AS
SELECT 
    ddep.nombre_departamento,
    SUM(fet.cantidad_tramites) AS volumen_total_gestionado,
    AVG(fet.dias_resolucion) AS promedio_dias_resolucion_area,
    SUM(CASE WHEN fet.estado_final = 'Aprobado' THEN fet.cantidad_tramites ELSE 0 END) AS tramites_aprobados,
    SUM(CASE WHEN fet.estado_final = 'Rechazado' THEN fet.cantidad_tramites ELSE 0 END) AS tramites_rechazados
FROM dbo.FACT_EFICIENCIA_TRAMITES fet
INNER JOIN dbo.DIM_DEPARTAMENTO ddep ON fet.id_departamento_dw = ddep.id_departamento_dw
GROUP BY ddep.nombre_departamento;
GO

PRINT '-> DataWareHouse\DWH_Vistas_Analiticas.sql creado con éxito para el Backend.';
GO

