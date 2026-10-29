/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 10: PROCEDIMIENTOS ETL Y CONTROL DE CALIDAD DE DATOS (IDW-01 A IDW-14)
   ============================================================================ */

USE MunicipalidadNicoyaDataMart2026;
GO

-- ============================================================================
-- IDW-02: sp_etl_cargar_dim_tiempo
-- Genera o actualiza el calendario dimensional para un rango de años
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_tiempo
    @anio_inicio INT = 2025,
    @anio_fin    INT = 2028
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @fecha_actual DATE = DATEFROMPARTS(@anio_inicio, 1, 1);
    DECLARE @fecha_limite DATE = DATEFROMPARTS(@anio_fin, 12, 31);

    WHILE @fecha_actual <= @fecha_limite
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.DIM_TIEMPO WHERE fecha = @fecha_actual)
        BEGIN
            INSERT INTO dbo.DIM_TIEMPO
            (fecha, anio, trimestre, mes, nombre_mes, dia, dia_semana, nombre_dia, es_fin_semana)
            VALUES
            (
                @fecha_actual,
                YEAR(@fecha_actual),
                DATEPART(QUARTER, @fecha_actual),
                MONTH(@fecha_actual),
                DATENAME(MONTH, @fecha_actual),
                DAY(@fecha_actual),
                DATEPART(WEEKDAY, @fecha_actual),
                DATENAME(WEEKDAY, @fecha_actual),
                CASE WHEN DATEPART(WEEKDAY, @fecha_actual) IN (1, 7) THEN 1 ELSE 0 END
            );
        END
        SET @fecha_actual = DATEADD(DAY, 1, @fecha_actual);
    END
    PRINT '-> DIM_TIEMPO poblada y actualizada correctamente.';
END;
GO

-- ============================================================================
-- IDW-04: sp_etl_cargar_dim_ubicacion
-- Transforma y clasifica distritos del cantón de Nicoya
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_ubicacion
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_UBICACION (id_distrito_origen, distrito, zona_rural_urbana)
    SELECT 
        d.id_distrito,
        d.nombre_distrito,
        CASE 
            WHEN d.nombre_distrito = 'Nicoya' THEN 'Urbana'
            ELSE 'Rural'
        END AS zona_rural_urbana
    FROM MunicipalidadNicoya2026.dbo.Distrito d
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_UBICACION du WHERE du.id_distrito_origen = d.id_distrito
    );
    PRINT '-> DIM_UBICACION sincronizada.';
END;
GO

-- ============================================================================
-- IDW-05: sp_etl_cargar_dim_tributo
-- Transforma tributos y deriva categoría analítica
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_tributo
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_TRIBUTO (id_tipo_tributo_origen, codigo_tributo, nombre_tributo, categoria_tributo, periodicidad)
    SELECT 
        tt.id_tipo_tributo,
        tt.codigo_tributo,
        tt.nombre_tributo,
        CASE 
            WHEN tt.nombre_tributo LIKE '%Impuesto%' OR tt.codigo_tributo LIKE 'IBI%' THEN 'Impuesto'
            WHEN tt.nombre_tributo LIKE '%Patente%' THEN 'Patente'
            WHEN tt.nombre_tributo LIKE '%Tasa%' OR tt.nombre_tributo LIKE '%Recolec%' OR tt.nombre_tributo LIKE '%Aseo%' THEN 'Tasa'
            ELSE 'Canon/Servicio'
        END AS categoria_tributo,
        tt.periodicidad
    FROM MunicipalidadNicoya2026.dbo.Tipo_Tributo tt
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_TRIBUTO dt WHERE dt.id_tipo_tributo_origen = tt.id_tipo_tributo
    );
    PRINT '-> DIM_TRIBUTO sincronizada.';
END;
GO

-- ============================================================================
-- IDW-07: sp_etl_cargar_dim_departamento
-- Sincroniza unidades departamentales
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_departamento
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_DEPARTAMENTO (id_departamento_origen, nombre_departamento, codigo_interno)
    SELECT 
        dep.id_departamento,
        dep.nombre_departamento,
        dep.id_departamento AS codigo_interno
    FROM MunicipalidadNicoya2026.dbo.Departamento dep
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_DEPARTAMENTO dd WHERE dd.id_departamento_origen = dep.id_departamento
    );
    PRINT '-> DIM_DEPARTAMENTO sincronizada.';
END;
GO

-- ============================================================================
-- IDW-06: sp_etl_cargar_dim_tramite
-- Carga catálogo dimensional de trámites con SLA y departamento
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_tramite
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_TRAMITE (id_tipo_tramite_origen, nombre_tramite, departamento_responsable, plazo_dias_resolucion)
    SELECT 
        tt.id_tipo_tramite,
        tt.nombre_tramite,
        dep.nombre_departamento,
        tt.dias_resolucion_max
    FROM MunicipalidadNicoya2026.dbo.Tipo_Tramite tt
    INNER JOIN MunicipalidadNicoya2026.dbo.Departamento dep ON tt.id_departamento = dep.id_departamento
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_TRAMITE dt WHERE dt.id_tipo_tramite_origen = tt.id_tipo_tramite
    );
    PRINT '-> DIM_TRAMITE sincronizada.';
END;
GO

-- ============================================================================
-- IDW-03: sp_etl_cargar_dim_contribuyente
-- Sincroniza contribuyentes y deriva ubicación territorial preferente
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_contribuyente
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_CONTRIBUYENTE (id_contribuyente_origen, tipo_persona, distrito_residencia, fecha_registro)
    SELECT 
        c.id_contribuyente,
        CASE 
            WHEN cf.id_contribuyente_fisico IS NOT NULL THEN 'Física'
            ELSE 'Jurídica'
        END AS tipo_persona,
        ISNULL(dist_pref.nombre_distrito, 'Nicoya') AS distrito_residencia,
        CAST(c.fecha_registro AS DATE)
    FROM MunicipalidadNicoya2026.dbo.Contribuyente c
    LEFT JOIN MunicipalidadNicoya2026.dbo.Contribuyente_Fisico cf ON c.id_contribuyente = cf.id_contribuyente
    OUTER APPLY (
        SELECT TOP 1 d.nombre_distrito
        FROM MunicipalidadNicoya2026.dbo.Derecho_Inmueble di
        INNER JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
        INNER JOIN MunicipalidadNicoya2026.dbo.Distrito d ON bi.id_distrito = d.id_distrito
        WHERE di.id_contribuyente = c.id_contribuyente
        ORDER BY di.porcentaje_participacion DESC
    ) dist_pref
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_CONTRIBUYENTE dc WHERE dc.id_contribuyente_origen = c.id_contribuyente
    );
    PRINT '-> DIM_CONTRIBUYENTE sincronizada.';
END;
GO

-- ============================================================================
-- IDW-08: sp_etl_cargar_fact_recaudacion
-- Carga consolidada incremental de recaudaciones operacionales
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_fact_recaudacion
AS
BEGIN
    SET NOCOUNT ON;
    TRUNCATE TABLE dbo.FACT_RECAUDACION;
    INSERT INTO dbo.FACT_RECAUDACION (id_tiempo, id_contribuyente_dw, id_ubicacion_dw, id_tributo_dw, monto_recaudado, monto_intereses, monto_descuento)
    SELECT 
        dt.id_tiempo,
        dc.id_contribuyente_dw,
        du.id_ubicacion_dw,
        dtrib.id_tributo_dw,
        SUM(df.monto_aplicado_principal),
        SUM(df.monto_aplicado_interes + df.monto_aplicado_recargo),
        SUM(f.descuentos)
    FROM MunicipalidadNicoya2026.dbo.Detalle_Factura df
    INNER JOIN MunicipalidadNicoya2026.dbo.Pago_Municipal pm ON df.id_pago_municipal = pm.id_pago_municipal
    INNER JOIN MunicipalidadNicoya2026.dbo.Factura f ON df.id_factura = f.id_factura
    INNER JOIN MunicipalidadNicoya2026.dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
    INNER JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.DIM_TIEMPO dt ON CAST(pm.fecha_pago AS DATE) = dt.fecha
    INNER JOIN dbo.DIM_CONTRIBUYENTE dc ON pm.id_contribuyente = dc.id_contribuyente_origen
    INNER JOIN dbo.DIM_UBICACION du ON bi.id_distrito = du.id_distrito_origen
    INNER JOIN dbo.DIM_TRIBUTO dtrib ON dm.id_tipo_tributo = dtrib.id_tipo_tributo_origen
    GROUP BY dt.id_tiempo, dc.id_contribuyente_dw, du.id_ubicacion_dw, dtrib.id_tributo_dw;

    PRINT '-> FACT_RECAUDACION cargada exitosamente.';
END;
GO

-- ============================================================================
-- IDW-09: sp_etl_cargar_fact_morosidad
-- Foto analítica de saldos vencidos y recuento de morosos
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_fact_morosidad
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id_tiempo_hoy INT;
    SELECT @id_tiempo_hoy = id_tiempo FROM dbo.DIM_TIEMPO WHERE fecha = CAST(GETDATE() AS DATE);

    IF @id_tiempo_hoy IS NULL
    BEGIN
        EXEC dbo.sp_etl_cargar_dim_tiempo;
        SELECT @id_tiempo_hoy = id_tiempo FROM dbo.DIM_TIEMPO WHERE fecha = CAST(GETDATE() AS DATE);
    END

    TRUNCATE TABLE dbo.FACT_MOROSIDAD;
    INSERT INTO dbo.FACT_MOROSIDAD (id_tiempo, id_ubicacion_dw, id_tributo_dw, saldo_vencido, cantidad_contribuyentes_morosos)
    SELECT 
        @id_tiempo_hoy,
        du.id_ubicacion_dw,
        dtrib.id_tributo_dw,
        SUM(dm.monto_principal + dm.monto_intereses + dm.monto_multas),
        COUNT(DISTINCT di.id_contribuyente)
    FROM MunicipalidadNicoya2026.dbo.Deudas_Municipales dm
    INNER JOIN MunicipalidadNicoya2026.dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    INNER JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
    INNER JOIN MunicipalidadNicoya2026.dbo.Derecho_Inmueble di ON bi.id_inmueble = di.id_inmueble
    INNER JOIN dbo.DIM_UBICACION du ON bi.id_distrito = du.id_distrito_origen
    INNER JOIN dbo.DIM_TRIBUTO dtrib ON dm.id_tipo_tributo = dtrib.id_tipo_tributo_origen
    WHERE ed.codigo_estado_deuda = 'VENC' OR (ed.codigo_estado_deuda = 'PEND' AND dm.fecha_de_vencimiento < GETDATE())
    GROUP BY du.id_ubicacion_dw, dtrib.id_tributo_dw;

    PRINT '-> FACT_MOROSIDAD cargada exitosamente.';
END;
GO

-- ============================================================================
-- IDW-10: sp_etl_cargar_fact_eficiencia_tramites
-- Carga consolidada de métricas de resolución y desempeño de trámites
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_fact_eficiencia_tramites
AS
BEGIN
    SET NOCOUNT ON;
    TRUNCATE TABLE dbo.FACT_EFICIENCIA_TRAMITES;
    INSERT INTO dbo.FACT_EFICIENCIA_TRAMITES (id_tiempo, id_tramite_dw, id_departamento_dw, dias_resolucion, estado_final, cantidad_tramites)
    SELECT 
        dt.id_tiempo,
        dtram.id_tramite_dw,
        ddep.id_departamento_dw,
        AVG(DATEDIFF(DAY, t.fecha_radicacion, t.fecha_resolucion_final)),
        et.nombre_estado,
        COUNT(t.id_tramite)
    FROM MunicipalidadNicoya2026.dbo.Tramite t
    INNER JOIN MunicipalidadNicoya2026.dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    INNER JOIN MunicipalidadNicoya2026.dbo.Historial_Tramite ht ON t.id_tramite = ht.id_tramite
    INNER JOIN MunicipalidadNicoya2026.dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado
    INNER JOIN dbo.DIM_TIEMPO dt ON CAST(t.fecha_resolucion_final AS DATE) = dt.fecha
    INNER JOIN dbo.DIM_TRAMITE dtram ON t.id_tipo_tramite = dtram.id_tipo_tramite_origen
    INNER JOIN dbo.DIM_DEPARTAMENTO ddep ON tt.id_departamento = ddep.id_departamento_origen
    WHERE t.fecha_resolucion_final IS NOT NULL
      AND et.codigo IN ('APR', 'RECH')
    GROUP BY dt.id_tiempo, dtram.id_tramite_dw, ddep.id_departamento_dw, et.nombre_estado;

    PRINT '-> FACT_EFICIENCIA_TRAMITES cargada exitosamente.';
END;
GO

-- ============================================================================
-- IDW-11, IDW-12, IDW-13: PROCEDIMIENTOS DE VALIDACIÓN Y CONTROL DE CALIDAD
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_validar_recaudacion
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @total_origen DECIMAL(12,2);
    DECLARE @total_destino DECIMAL(12,2);

    SELECT @total_origen = SUM(monto_aplicado_principal + monto_aplicado_interes + monto_aplicado_recargo)
    FROM MunicipalidadNicoya2026.dbo.Detalle_Factura;

    SELECT @total_destino = SUM(monto_recaudado + monto_intereses)
    FROM dbo.FACT_RECAUDACION;

    SELECT 
        'Validación Recaudación' AS Control,
        ISNULL(@total_origen, 0) AS Total_OLTP,
        ISNULL(@total_destino, 0) AS Total_DataMart,
        CASE WHEN ABS(ISNULL(@total_origen, 0) - ISNULL(@total_destino, 0)) < 1 THEN 'CORRECTO (CUADRADO)' ELSE 'DIFERENCIA DETECTADA' END AS Resultado_Validacion;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_etl_validar_morosidad
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @saldo_origen DECIMAL(12,2);
    DECLARE @saldo_destino DECIMAL(12,2);

    SELECT @saldo_origen = SUM(monto_principal + monto_intereses + monto_multas)
    FROM MunicipalidadNicoya2026.dbo.Deudas_Municipales dm
    INNER JOIN MunicipalidadNicoya2026.dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    WHERE ed.codigo_estado_deuda = 'VENC' OR (ed.codigo_estado_deuda = 'PEND' AND dm.fecha_de_vencimiento < GETDATE());

    SELECT @saldo_destino = SUM(saldo_vencido)
    FROM dbo.FACT_MOROSIDAD;

    SELECT 
        'Validación Morosidad' AS Control,
        ISNULL(@saldo_origen, 0) AS Total_Mora_OLTP,
        ISNULL(@saldo_destino, 0) AS Total_Mora_DataMart,
        CASE WHEN ABS(ISNULL(@saldo_origen, 0) - ISNULL(@saldo_destino, 0)) < 1 THEN 'CORRECTO (CUADRADO)' ELSE 'DIFERENCIA DETECTADA' END AS Resultado_Validacion;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_etl_validar_eficiencia_tramites
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @tramites_oltp INT;
    DECLARE @tramites_dw INT;

    SELECT @tramites_oltp = COUNT(*) 
    FROM MunicipalidadNicoya2026.dbo.Tramite 
    WHERE fecha_resolucion_final IS NOT NULL;

    SELECT @tramites_dw = SUM(cantidad_tramites) 
    FROM dbo.FACT_EFICIENCIA_TRAMITES;

    SELECT 
        'Validación Trámites' AS Control,
        ISNULL(@tramites_oltp, 0) AS Resueltos_OLTP,
        ISNULL(@tramites_dw, 0) AS Total_DataMart,
        CASE WHEN ISNULL(@tramites_oltp, 0) = ISNULL(@tramites_dw, 0) THEN 'CORRECTO (CUADRADO)' ELSE 'DIFERENCIA DETECTADA' END AS Resultado_Validacion;
END;
GO

-- ============================================================================
-- IDW-14: sp_etl_ejecutar_carga_periodica (Orquestador Maestro ETL)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_ejecutar_carga_periodica
AS
BEGIN
    SET NOCOUNT ON;
    PRINT '=======================================================';
    PRINT ' INICIANDO CARGA ETL INTEGRAL HACIA EL DATA WAREHOUSE ';
    PRINT '=======================================================';
    
    BEGIN TRY
        -- 1. Sincronización de Dimensiones en orden de dependencias
        EXEC dbo.sp_etl_cargar_dim_tiempo;
        EXEC dbo.sp_etl_cargar_dim_ubicacion;
        EXEC dbo.sp_etl_cargar_dim_tributo;
        EXEC dbo.sp_etl_cargar_dim_departamento;
        EXEC dbo.sp_etl_cargar_dim_tramite;
        EXEC dbo.sp_etl_cargar_dim_contribuyente;

        -- 2. Carga de Hechos (Facts)
        EXEC dbo.sp_etl_cargar_fact_recaudacion;
        EXEC dbo.sp_etl_cargar_fact_morosidad;
        EXEC dbo.sp_etl_cargar_fact_eficiencia_tramites;

        -- 3. Validaciones de Cuadre
        PRINT '--- Controles de Calidad de Datos ---';
        EXEC dbo.sp_etl_validar_recaudacion;
        EXEC dbo.sp_etl_validar_morosidad;
        EXEC dbo.sp_etl_validar_eficiencia_tramites;

        PRINT '=======================================================';
        PRINT '   PROCESO ETL CONCLUIDO SATISFACTORIAMENTE           ';
        PRINT '=======================================================';
    END TRY
    BEGIN CATCH
        PRINT 'Error durante el flujo ETL: ' + ERROR_MESSAGE();
        THROW;
    END CATCH
END;
GO

PRINT '-> 14 Procedimientos ETL y controles de calidad compilados con éxito.';
GO
