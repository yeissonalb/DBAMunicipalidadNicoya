-- Instalacion consolidada. Una definicion final por objeto; no ejecutar migraciones historicas.
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_calcular_total_deuda ( @id_deuda_municipal INT )
RETURNS FLOAT
AS
BEGIN
    DECLARE @total FLOAT = 0;

    SELECT @total = ISNULL(monto_principal, 0) + ISNULL(monto_intereses, 0) + ISNULL(monto_multas, 0)
    FROM dbo.Deudas_Municipales
    WHERE id_deuda_municipal = @id_deuda_municipal;

    RETURN ISNULL(@total, 0);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_calcular_dias_mora ( @id_deuda_municipal INT )
RETURNS INT
AS
BEGIN
    DECLARE @dias INT = 0;
    DECLARE @fecha_venc DATETIME;
    DECLARE @codigo_estado VARCHAR(20);

    SELECT
        @fecha_venc = dm.fecha_de_vencimiento,
        @codigo_estado = ed.codigo_estado_deuda
    FROM dbo.Deudas_Municipales dm
    INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    WHERE dm.id_deuda_municipal = @id_deuda_municipal;

    -- La regla vigente usa días naturales. PAG y ARR no continúan acumulando mora.
    IF @fecha_venc IS NOT NULL
       AND @codigo_estado IN ('PEND', 'VENC')
       AND CAST(@fecha_venc AS DATE) < CAST(GETDATE() AS DATE)
    BEGIN
        SET @dias = DATEDIFF(DAY, CAST(@fecha_venc AS DATE), CAST(GETDATE() AS DATE));
    END

    RETURN @dias;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_total_aplicado_factura ( @id_factura INT )
RETURNS FLOAT
AS
BEGIN
    DECLARE @total FLOAT = 0;

    SELECT @total = SUM(ISNULL(monto_aplicado_principal, 0) + ISNULL(monto_aplicado_interes, 0) + ISNULL(monto_aplicado_recargo, 0))
    FROM dbo.Detalle_Factura
    WHERE id_factura = @id_factura;

    RETURN ISNULL(@total, 0);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_saldo_calculado_factura ( @id_factura INT )
RETURNS FLOAT
AS
BEGIN
    DECLARE @total_a_pagar FLOAT = 0;
    DECLARE @aplicado FLOAT = 0;
    DECLARE @saldo FLOAT = 0;

    SELECT @total_a_pagar = total_a_pagar
    FROM dbo.Factura
    WHERE id_factura = @id_factura;

    SET @aplicado = dbo.fn_total_aplicado_factura(@id_factura);
    SET @saldo = @total_a_pagar - @aplicado;

    IF @saldo < 0
        SET @saldo = 0;

    RETURN @saldo;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_total_deuda_contribuyente ( @id_contribuyente INT )
RETURNS FLOAT
AS
BEGIN
    DECLARE @total FLOAT = 0;

    SELECT @total = SUM(
        (ISNULL(dm.monto_principal, 0) + ISNULL(dm.monto_intereses, 0) + ISNULL(dm.monto_multas, 0)) 
        * (di.porcentaje_participacion / 100.0)
    )
    FROM dbo.Derecho_Inmueble di
    INNER JOIN dbo.Deudas_Municipales dm ON di.id_inmueble = dm.id_inmueble
    INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    WHERE di.id_contribuyente = @id_contribuyente
      AND ed.codigo_estado_deuda IN ('PEND', 'VENC');

    RETURN ISNULL(@total, 0);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_total_pagado_contribuyente_periodo ( @id_contribuyente INT, @fecha_inicio DATETIME, @fecha_fin DATETIME )
RETURNS FLOAT
AS
BEGIN
    DECLARE @total FLOAT = 0;

    SELECT @total = SUM(ISNULL(monto_total_pagado, 0))
    FROM dbo.Pago_Municipal
    WHERE id_contribuyente = @id_contribuyente
      AND fecha_pago >= @fecha_inicio
      AND fecha_pago <= @fecha_fin;

    RETURN ISNULL(@total, 0);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_dias_transcurridos_tramite ( @id_tramite INT )
RETURNS INT
AS
BEGIN
    DECLARE @dias INT = 0;
    DECLARE @fecha_rad DATETIME;
    DECLARE @fecha_fin DATETIME;

    SELECT @fecha_rad = fecha_radicacion, @fecha_fin = fecha_resolucion_final
    FROM dbo.Tramite
    WHERE id_tramite = @id_tramite;

    IF @fecha_rad IS NOT NULL
    BEGIN
        SET @dias = DATEDIFF(DAY, @fecha_rad, ISNULL(@fecha_fin, GETDATE()));
    END

    RETURN @dias;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_dias_restantes_tramite ( @id_tramite INT )
RETURNS INT
AS
BEGIN
    DECLARE @restantes INT = 0;
    DECLARE @dias_max INT = 0;
    DECLARE @transcurridos INT = 0;

    SELECT @dias_max = tt.dias_resolucion_max
    FROM dbo.Tramite t
    INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    WHERE t.id_tramite = @id_tramite;

    SET @transcurridos = dbo.fn_dias_transcurridos_tramite(@id_tramite);
    SET @restantes = @dias_max - @transcurridos;

    RETURN @restantes;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_tramite_fuera_plazo (  @id_tramite INT )
RETURNS BIT
AS
BEGIN
    DECLARE @fuera BIT = 0;
    DECLARE @dias_restantes INT;

    SET @dias_restantes = dbo.fn_dias_restantes_tramite(@id_tramite);

    IF @dias_restantes < 0
        SET @fuera = 1;

    RETURN @fuera;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_porcentaje_cumplimiento_plazo ( @fecha_inicio DATETIME, @fecha_fin DATETIME )
RETURNS FLOAT
AS
BEGIN
    DECLARE @total_resueltos INT = 0;
    DECLARE @a_tiempo INT = 0;
    DECLARE @porcentaje FLOAT = 0;

    SELECT 
        @total_resueltos = COUNT(*),
        @a_tiempo = SUM(CASE WHEN t.fecha_resolucion_final <= ISNULL(t.fecha_resolucion_estimada, DATEADD(DAY, tt.dias_resolucion_max, t.fecha_radicacion)) THEN 1 ELSE 0 END)
    FROM dbo.Tramite t
    INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    WHERE t.fecha_resolucion_final IS NOT NULL
      AND t.fecha_resolucion_final >= @fecha_inicio
      AND t.fecha_resolucion_final <= @fecha_fin;

    IF @total_resueltos > 0
        SET @porcentaje = (@a_tiempo * 100.0) / @total_resueltos;

    RETURN @porcentaje;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_ultimo_estado_tramite ( @id_tramite INT )
RETURNS VARCHAR(50)
AS
BEGIN
    DECLARE @estado VARCHAR(50) = 'SIN ESTADO';

    SELECT TOP 1 @estado = et.nombre_estado
    FROM dbo.Historial_Tramite ht
    INNER JOIN dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado
    WHERE ht.id_tramite = @id_tramite
    ORDER BY ht.fecha_cambio DESC, ht.id_historial DESC;

    RETURN @estado;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_valor_fiscal_proporcional ( @id_inmueble INT, @id_contribuyente INT )
RETURNS FLOAT
AS
BEGIN
    DECLARE @proporcional FLOAT = 0;

    SELECT @proporcional = bi.valor_fiscal * (di.porcentaje_participacion / 100.0)
    FROM dbo.Bien_Inmueble bi
    INNER JOIN dbo.Derecho_Inmueble di ON bi.id_inmueble = di.id_inmueble
    WHERE bi.id_inmueble = @id_inmueble
      AND di.id_contribuyente = @id_contribuyente;

    RETURN ISNULL(@proporcional, 0);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_tiene_permiso ( @id_usuario INT,  @modulo VARCHAR(50), @accion VARCHAR(20) ) 
RETURNS BIT
AS
BEGIN
    DECLARE @tiene BIT = 0;

    IF EXISTS (
        SELECT 1
        FROM dbo.Rol_Usuario ru
        INNER JOIN dbo.Rol_Permiso rp ON ru.id_rol = rp.id_rol
        INNER JOIN dbo.Permiso p ON rp.id_permiso = p.id_permiso
        WHERE ru.id_usuario = @id_usuario
          AND p.modulo = @modulo
          AND p.accion = @accion
    )
    BEGIN
        SET @tiene = 1;
    END

    RETURN @tiene;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_es_contribuyente_fisico ( @id_contribuyente INT )
RETURNS BIT
AS
BEGIN
    DECLARE @es_fisico BIT = 0;

    IF EXISTS (SELECT 1 FROM dbo.Contribuyente_Fisico WHERE id_contribuyente = @id_contribuyente)
        SET @es_fisico = 1;

    RETURN @es_fisico;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_representante_legal_vigente ( @id_representante_legal INT )
RETURNS BIT
AS
BEGIN
    DECLARE @vigente BIT = 0;

    IF EXISTS (
        SELECT 1
        FROM dbo.Representante_Legal
        WHERE id_representante_legal = @id_representante_legal
          AND fecha_vencimiento_poder >= GETDATE()
    )
        SET @vigente = 1;

    RETURN @vigente;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_horas_desde_ultimo_respaldo()
RETURNS INT
AS
BEGIN
    DECLARE @horas INT = 9999;
    DECLARE @ultima_fecha DATETIME;

    SELECT @ultima_fecha = MAX(r.fecha_fin)
    FROM dbo.Respaldos r
    INNER JOIN dbo.Estados_Respaldos er ON r.id_estados_respaldos = er.id_estados_respaldos
    WHERE er.nombre_estados = 'Exitoso'
      AND r.fecha_fin IS NOT NULL;

    IF @ultima_fecha IS NOT NULL
        SET @horas = DATEDIFF(HOUR, @ultima_fecha, GETDATE());

    RETURN @horas;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_proximo_respaldo_programado
(
    @id_respaldos_config INT
)
RETURNS DATETIME
AS
BEGIN
    DECLARE @proximo DATETIME;
    DECLARE @hora TIME;
    DECLARE @intervalo INT;
    DECLARE @ultimo_inicio DATETIME;

    SELECT 
        @hora = rc.hora_ejecucion,  @intervalo = f.intervalo_horas
    FROM dbo.Respaldos_Config rc
    INNER JOIN dbo.Frecuencia f ON rc.id_frecuencia = f.id_frecuencia
    WHERE rc.id_respaldos_config = @id_respaldos_config;

    SELECT @ultimo_inicio = MAX(fecha_inicio)
    FROM dbo.Respaldos
    WHERE id_respaldo_config = @id_respaldos_config;

    IF @ultimo_inicio IS NULL
        SET @proximo = CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(@hora AS DATETIME);
    ELSE
        SET @proximo = DATEADD(HOUR, @intervalo, @ultimo_inicio);

    RETURN @proximo;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Scripts_Ordinarios\03_Funciones_Negocio.sql
CREATE OR ALTER FUNCTION dbo.fn_porcentaje_respaldos_exitosos
(
    @dias INT
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @total INT = 0;
    DECLARE @exitosos INT = 0;
    DECLARE @pct FLOAT = 0;

    SELECT 
        @total = COUNT(*),
        @exitosos = SUM(CASE WHEN er.nombre_estados = 'Exitoso' THEN 1 ELSE 0 END)
    FROM dbo.Respaldos r
    INNER JOIN dbo.Estados_Respaldos er ON r.id_estados_respaldos = er.id_estados_respaldos
    WHERE r.fecha_inicio >= DATEADD(DAY, -@dias, GETDATE());

    IF @total > 0
        SET @pct = (@exitosos * 100.0) / @total;

    RETURN @pct;
END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: DataWareHouse\DWH_Structure.sql
CREATE OR ALTER FUNCTION dbo.fn_dw_total_recaudacion_periodo
(
    @fecha_inicio DATE,
    @fecha_fin DATE
)
RETURNS DECIMAL(12,2)
AS
BEGIN
    DECLARE @total DECIMAL(12,2) = 0;
    SELECT @total = SUM(fr.monto_recaudado + fr.monto_intereses)
    FROM dbo.FACT_RECAUDACION fr
    INNER JOIN dbo.DIM_TIEMPO dt ON fr.id_tiempo = dt.id_tiempo
    WHERE dt.fecha >= @fecha_inicio AND dt.fecha <= @fecha_fin;
    RETURN ISNULL(@total, 0);
END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: DataWareHouse\DWH_Structure.sql
CREATE OR ALTER FUNCTION dbo.fn_dw_total_recaudacion_distrito
(
    @distrito VARCHAR(50)
)
RETURNS DECIMAL(12,2)
AS
BEGIN
    DECLARE @total DECIMAL(12,2) = 0;
    SELECT @total = SUM(fr.monto_recaudado + fr.monto_intereses)
    FROM dbo.FACT_RECAUDACION fr
    INNER JOIN dbo.DIM_UBICACION du ON fr.id_ubicacion_dw = du.id_ubicacion_dw
    WHERE du.distrito = @distrito;
    RETURN ISNULL(@total, 0);
END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER FUNCTION dbo.fn_dw_porcentaje_morosidad(@id_tiempo INT)
RETURNS FLOAT AS BEGIN
 DECLARE @grupos INT,@personas INT,@poblacion INT;
 SELECT @grupos=COUNT(*),@personas=COALESCE(MAX(cantidad_contribuyentes_morosos),0)
 FROM dbo.FACT_MOROSIDAD WHERE id_tiempo=@id_tiempo;
 SELECT @poblacion=COUNT(*) FROM dbo.DIM_CONTRIBUYENTE;
 -- El esquema agregado no permite conocer la intersección de personas entre grupos.
 -- NULL significa no calculable; no inventar un porcentaje sumando conteos.
 IF @grupos>1 OR @poblacion=0 OR @personas>@poblacion RETURN NULL;
 IF @grupos=0 RETURN NULL;
 RETURN @personas*100.0/@poblacion;
END;
GO

USE [MunicipalidadNicoyaDataMart2026];
GO

-- Fuente de la version final: Database_Backend\25_corregir_etl_sin_cambiar_modelo.sql
CREATE OR ALTER FUNCTION dbo.fn_dw_promedio_dias_resolucion(@id_tramite_dw INT=NULL,@id_departamento_dw INT=NULL)
RETURNS FLOAT AS BEGIN
 DECLARE @promedio FLOAT;
 SELECT @promedio=SUM(CAST(dias_resolucion AS FLOAT)*cantidad_tramites)/NULLIF(SUM(cantidad_tramites),0)
 FROM dbo.FACT_EFICIENCIA_TRAMITES
 WHERE (@id_tramite_dw IS NULL OR id_tramite_dw=@id_tramite_dw)
 AND (@id_departamento_dw IS NULL OR id_departamento_dw=@id_departamento_dw);
 RETURN COALESCE(@promedio,0);
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER FUNCTION dbo.fn_usuario_sesion()
RETURNS INT
AS
BEGIN
    DECLARE @id INT = NULL;

    -- 1) Usuario enviado por la API (solo si existe, para no violar la FK)
    SELECT @id = u.id_usuario
    FROM dbo.Usuario u
    WHERE u.id_usuario = TRY_CAST(SESSION_CONTEXT(N'id_usuario') AS INT);

    -- 2) Respaldo: comportamiento original (login SQL = user_name)
    IF @id IS NULL
        SELECT @id = u.id_usuario
        FROM dbo.Usuario u
        WHERE u.user_name = SYSTEM_USER;

    RETURN @id;
END;
GO
