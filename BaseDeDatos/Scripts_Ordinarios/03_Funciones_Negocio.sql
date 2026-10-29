/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 03: FUNCIONES ESCALARES Y DE NEGOCIO (FUN-01 A FUN-18)
   ============================================================================ */
USE MunicipalidadNicoya2026;
GO
-- ============================================================================
-- FUN-01: fn_calcular_total_deuda
-- Calcula el importe total de una obligación (Principal + Intereses + Multas)
-- ============================================================================
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

-- ============================================================================
-- FUN-02: fn_calcular_dias_mora
-- Calcula los días de mora transcurridos a partir de la fecha de vencimiento
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_calcular_dias_mora ( @id_deuda_municipal INT )
RETURNS INT
AS
BEGIN
    DECLARE @dias INT = 0;
    DECLARE @fecha_venc DATETIME;

    SELECT @fecha_venc = fecha_de_vencimiento
    FROM dbo.Deudas_Municipales
    WHERE id_deuda_municipal = @id_deuda_municipal;

    IF @fecha_venc IS NOT NULL AND @fecha_venc < GETDATE()
    BEGIN
        SET @dias = DATEDIFF(DAY, @fecha_venc, GETDATE());
    END

    RETURN @dias;
END;
GO

-- ============================================================================
-- FUN-03: fn_total_aplicado_factura
-- Suma los montos amortizados a principal, interés y recargo sobre una factura
-- ============================================================================
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

-- ============================================================================
-- FUN-04: fn_saldo_calculado_factura
-- Calcula el saldo pendiente real de una factura (Total a pagar - Aplicaciones)
-- ============================================================================
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

-- ============================================================================
-- FUN-05: fn_total_deuda_contribuyente
-- Calcula el monto total pendiente de un contribuyente ponderado por su copropiedad
-- ============================================================================
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

-- ============================================================================
-- FUN-06: fn_total_pagado_contribuyente_periodo
-- Monto monetario total cancelado por un contribuyente en un rango de fechas
-- ============================================================================
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

-- ============================================================================
-- FUN-07: fn_dias_transcurridos_tramite
-- Días transcurridos desde radicación hasta resolución final o a la fecha actual
-- ============================================================================
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

-- ============================================================================
-- FUN-08: fn_dias_restantes_tramite
-- Días restantes respecto al plazo legal máximo (SLA) del tipo de trámite
-- ============================================================================
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

-- ============================================================================
-- FUN-09: fn_tramite_fuera_plazo
-- Retorna 1 si el trámite superó el plazo máximo legal (SLA), 0 en caso contrario
-- ============================================================================
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

-- ============================================================================
-- FUN-10: fn_porcentaje_cumplimiento_plazo
-- Porcentaje de trámites resueltos en tiempo en un rango de fechas
-- ============================================================================
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

-- ============================================================================
-- FUN-11: fn_ultimo_estado_tramite
-- Obtiene el nombre del estado vigente más reciente a partir del historial
-- ============================================================================
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

-- ============================================================================
-- FUN-12: fn_valor_fiscal_proporcional
-- Valor fiscal tasado atribuible al contribuyente según su cuota de copropiedad
-- ============================================================================
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

-- ============================================================================
-- FUN-13: fn_tiene_permiso
-- Determina si un usuario tiene autorización para un módulo y acción específicos
-- ============================================================================
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

-- ============================================================================
-- FUN-14: fn_es_contribuyente_fisico
-- Determina si el contribuyente corresponde a una persona física (1) o jurídica (0)
-- ============================================================================
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

-- ============================================================================
-- FUN-15: fn_representante_legal_vigente
-- Determina si la personería del representante legal se encuentra vigente
-- ============================================================================
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

-- ============================================================================
-- FUN-16: fn_horas_desde_ultimo_respaldo
-- Horas transcurridas desde el último respaldo finalizado exitosamente
-- ============================================================================
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

-- ============================================================================
-- FUN-17: fn_proximo_respaldo_programado
-- Estima la próxima fecha y hora de ejecución de una directiva de respaldo
-- ============================================================================
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
-- ============================================================================
-- FUN-18: fn_porcentaje_respaldos_exitosos
-- Porcentaje de respaldos completados sin error dentro de una ventana de días
-- ============================================================================
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

PRINT '18 Funciones escalares y de negocio compiladas exitosamente.';
GO
