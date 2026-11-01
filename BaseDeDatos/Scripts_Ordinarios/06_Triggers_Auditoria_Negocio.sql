/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 06: TRIGGERS DE AUDITORÍA Y REGLAS DE NEGOCIO (TRG-01 A TRG-18)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- TRG-18: REGLA DE NEGOCIO CRÍTICA (Saldo y Estado de Factura)
-- Recalcula automáticamente el saldo pendiente y conmuta el estado de la factura
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_actualizar_saldo_factura_detalle
ON dbo.Detalle_Factura
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Obtener las facturas impactadas
    DECLARE @FacturasImpactadas TABLE (id_factura INT);

    INSERT INTO @FacturasImpactadas (id_factura)
    SELECT DISTINCT id_factura FROM inserted WHERE id_factura IS NOT NULL
    UNION
    SELECT DISTINCT id_factura FROM deleted WHERE id_factura IS NOT NULL;

    -- Recalcular saldo y estado por cada factura afectada
    UPDATE f
    SET f.saldo_pendiente = CASE 
            WHEN (f.total_a_pagar - abonos.total_abonado) < 0 THEN 0
            ELSE (f.total_a_pagar - abonos.total_abonado)
        END,
        f.estado_factura = CASE 
            WHEN (f.total_a_pagar - abonos.total_abonado) <= 0.001 THEN 'Cancelada'
            ELSE 'Pendiente'
        END
    FROM dbo.Factura f
    INNER JOIN @FacturasImpactadas fi ON f.id_factura = fi.id_factura
    CROSS APPLY (
        SELECT ISNULL(SUM(monto_aplicado_principal + monto_aplicado_interes + monto_aplicado_recargo), 0) AS total_abonado
        FROM dbo.Detalle_Factura df
        WHERE df.id_factura = f.id_factura
    ) abonos;

    -- Actualizar estado de deuda a Pagada si la factura se canceló
    UPDATE dm
    SET dm.id_estado_deuda = ed_pag.id_estado_deuda
    FROM dbo.Deudas_Municipales dm
    INNER JOIN dbo.Factura f ON dm.id_deuda_municipal = f.id_deuda_municipal
    INNER JOIN @FacturasImpactadas fi ON f.id_factura = fi.id_factura
    CROSS JOIN (SELECT id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda = 'PAG') ed_pag
    WHERE f.estado_factura = 'Cancelada';
END;
GO

-- ============================================================================
-- TRG-01: tr_aud_contribuyente_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_contribuyente_iud
ON dbo.Contribuyente
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Contribuyente', CAST(i.id_contribuyente AS VARCHAR(50)), NULL, 
               CONCAT('Correo=', i.correo_electronico, ', Tel=', i.telefono), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Contribuyente', CAST(i.id_contribuyente AS VARCHAR(50)), 
               CONCAT('Correo=', d.correo_electronico, ', Tel=', d.telefono, ', Estado=', d.estado_contribuyente),
               CONCAT('Correo=', i.correo_electronico, ', Tel=', i.telefono, ', Estado=', i.estado_contribuyente), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_contribuyente = d.id_contribuyente;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Contribuyente', CAST(d.id_contribuyente AS VARCHAR(50)), 
               CONCAT('Correo=', d.correo_electronico, ', Tel=', d.telefono), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-02: tr_aud_bien_inmueble_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_bien_inmueble_iud
ON dbo.Bien_Inmueble
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Bien_Inmueble', CAST(i.id_inmueble AS VARCHAR(50)), NULL, 
               CONCAT('Finca=', i.numero_finca, ', ValorFiscal=', i.valor_fiscal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Bien_Inmueble', CAST(i.id_inmueble AS VARCHAR(50)), 
               CONCAT('Finca=', d.numero_finca, ', ValorFiscal=', d.valor_fiscal),
               CONCAT('Finca=', i.numero_finca, ', ValorFiscal=', i.valor_fiscal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_inmueble = d.id_inmueble;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Bien_Inmueble', CAST(d.id_inmueble AS VARCHAR(50)), 
               CONCAT('Finca=', d.numero_finca, ', ValorFiscal=', d.valor_fiscal), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-03: tr_aud_derecho_inmueble_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_derecho_inmueble_iud
ON dbo.Derecho_Inmueble
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Derecho_Inmueble', CAST(i.id_derecho_inmueble AS VARCHAR(50)), NULL, 
               CONCAT('Inmueble=', i.id_inmueble, ', Contribuyente=', i.id_contribuyente, ', Pct=', i.porcentaje_participacion), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Derecho_Inmueble', CAST(i.id_derecho_inmueble AS VARCHAR(50)), 
               CONCAT('Inmueble=', d.id_inmueble, ', Contribuyente=', d.id_contribuyente, ', Pct=', d.porcentaje_participacion),
               CONCAT('Inmueble=', i.id_inmueble, ', Contribuyente=', i.id_contribuyente, ', Pct=', i.porcentaje_participacion), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_derecho_inmueble = d.id_derecho_inmueble;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Derecho_Inmueble', CAST(d.id_derecho_inmueble AS VARCHAR(50)), 
               CONCAT('Inmueble=', d.id_inmueble, ', Contribuyente=', d.id_contribuyente, ', Pct=', d.porcentaje_participacion), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-04: tr_aud_tramite_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_tramite_iud
ON dbo.Tramite
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Tramite', CAST(i.id_tramite AS VARCHAR(50)), NULL, 
               CONCAT('Expediente=', i.numero_expediente, ', Tipo=', i.id_tipo_tramite, ', Contribuyente=', i.id_contribuyente), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Tramite', CAST(i.id_tramite AS VARCHAR(50)), 
               CONCAT('Usuario=', d.id_usuario, ', Inmueble=', ISNULL(CAST(d.id_inmueble AS VARCHAR(20)), 'N/A'), ', Resolucion=', ISNULL(CONVERT(VARCHAR(19), d.fecha_resolucion_final, 120), 'Pendiente')),
               CONCAT('Usuario=', i.id_usuario, ', Inmueble=', ISNULL(CAST(i.id_inmueble AS VARCHAR(20)), 'N/A'), ', Resolucion=', ISNULL(CONVERT(VARCHAR(19), i.fecha_resolucion_final, 120), 'Pendiente')), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_tramite = d.id_tramite;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Tramite', CAST(d.id_tramite AS VARCHAR(50)), 
               CONCAT('Expediente=', d.numero_expediente, ', Tipo=', d.id_tipo_tramite), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-05: tr_aud_historial_tramite_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_historial_tramite_iud
ON dbo.Historial_Tramite
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Historial_Tramite', CAST(i.id_historial AS VARCHAR(50)), NULL, 
           CONCAT('Tramite=', i.id_tramite, ', Estado=', i.id_estado_tramite, ', Obs=', i.observaciones), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
    FROM inserted i;
END;
GO

-- ============================================================================
-- TRG-06: tr_aud_deuda_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_deuda_iud
ON dbo.Deudas_Municipales
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Deudas_Municipales', CAST(i.id_deuda_municipal AS VARCHAR(50)), NULL, 
               CONCAT('Periodo=', i.periodo_deuda, ', Principal=', i.monto_principal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Deudas_Municipales', CAST(i.id_deuda_municipal AS VARCHAR(50)), 
               CONCAT('Periodo=', d.periodo_deuda, ', Estado=', d.id_estado_deuda, ', Principal=', d.monto_principal, ', Intereses=', d.monto_intereses, ', Multas=', d.monto_multas),
               CONCAT('Periodo=', i.periodo_deuda, ', Estado=', i.id_estado_deuda, ', Principal=', i.monto_principal, ', Intereses=', i.monto_intereses, ', Multas=', i.monto_multas), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_deuda_municipal = d.id_deuda_municipal;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Deudas_Municipales', CAST(d.id_deuda_municipal AS VARCHAR(50)), 
               CONCAT('Periodo=', d.periodo_deuda, ', Principal=', d.monto_principal), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-07: tr_aud_factura_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_factura_iud
ON dbo.Factura
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Factura', CAST(i.id_factura AS VARCHAR(50)), NULL, 
               CONCAT('Clave=', i.clave_numerica_hacienda, ', Total=', i.total_a_pagar, ', Estado=', i.estado_factura), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Factura', CAST(i.id_factura AS VARCHAR(50)), 
               CONCAT('Saldo=', d.saldo_pendiente, ', Estado=', d.estado_factura),
               CONCAT('Saldo=', i.saldo_pendiente, ', Estado=', i.estado_factura), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_factura = d.id_factura;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Factura', CAST(d.id_factura AS VARCHAR(50)), 
               CONCAT('Clave=', d.clave_numerica_hacienda, ', Total=', d.total_a_pagar), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-08: tr_aud_detalle_factura_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_detalle_factura_iud
ON dbo.Detalle_Factura
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Detalle_Factura', CAST(i.id_detalle_factura AS VARCHAR(50)), NULL, 
               CONCAT('Factura=', i.id_factura, ', Pago=', i.id_pago_municipal, ', Principal=', i.monto_aplicado_principal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Detalle_Factura', CAST(i.id_detalle_factura AS VARCHAR(50)), 
               CONCAT('Principal=', d.monto_aplicado_principal),
               CONCAT('Principal=', i.monto_aplicado_principal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_detalle_factura = d.id_detalle_factura;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Detalle_Factura', CAST(d.id_detalle_factura AS VARCHAR(50)), 
               CONCAT('Factura=', d.id_factura, ', Pago=', d.id_pago_municipal, ', Principal=', d.monto_aplicado_principal), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-09: tr_aud_pago_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_pago_iud
ON dbo.Pago_Municipal
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Pago_Municipal', CAST(i.id_pago_municipal AS VARCHAR(50)), NULL, 
           CONCAT('Monto=', i.monto_total_pagado, ', Recibo=', i.comprobante, ', Contribuyente=', i.id_contribuyente), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
    FROM inserted i;
END;
GO

-- ============================================================================
-- TRG-10: tr_aud_usuario_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_usuario_iud
ON dbo.Usuario
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Usuario', CAST(i.id_usuario AS VARCHAR(50)), NULL, 
               CONCAT('User=', i.user_name, ', Email=', i.email_usuario, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Usuario', CAST(i.id_usuario AS VARCHAR(50)), 
               CONCAT('User=', d.user_name, ', Activo=', d.activo),
               CONCAT('User=', i.user_name, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_usuario = d.id_usuario;
    END
END;
GO

-- ============================================================================
-- TRG-11: tr_aud_rol_usuario_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_rol_usuario_iud
ON dbo.Rol_Usuario
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Usuario', CAST(i.id_rol_usuario AS VARCHAR(50)), NULL, 
               CONCAT('Usuario=', i.id_usuario, ', Rol=', i.id_rol), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Usuario', CAST(d.id_rol_usuario AS VARCHAR(50)), 
               CONCAT('Usuario=', d.id_usuario, ', Rol=', d.id_rol), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-12: tr_aud_rol_permiso_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_rol_permiso_iud
ON dbo.Rol_Permiso
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Permiso', CAST(i.id_rol_permiso AS VARCHAR(50)), NULL, 
               CONCAT('Rol=', i.id_rol, ', Permiso=', i.id_permiso), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Permiso', CAST(d.id_rol_permiso AS VARCHAR(50)), 
               CONCAT('Rol=', d.id_rol, ', Permiso=', d.id_permiso), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-13: tr_aud_tipo_tributo_update
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_tipo_tributo_update
ON dbo.Tipo_Tributo
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Tipo_Tributo', CAST(i.id_tipo_tributo AS VARCHAR(50)), 
           CONCAT('Nombre=', d.nombre_tributo, ', Tarifa=', d.tarifa, ', Fijo=', d.monto_fijo, ', Periodo=', d.periodicidad),
           CONCAT('Nombre=', i.nombre_tributo, ', Tarifa=', i.tarifa, ', Fijo=', i.monto_fijo, ', Periodo=', i.periodicidad), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
    FROM inserted i INNER JOIN deleted d ON i.id_tipo_tributo = d.id_tipo_tributo;
END;
GO

-- ============================================================================
-- TRG-14: tr_aud_tipo_tramite_update
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_tipo_tramite_update
ON dbo.Tipo_Tramite
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Tipo_Tramite', CAST(i.id_tipo_tramite AS VARCHAR(50)), 
           CONCAT('Nombre=', d.nombre_tramite, ', SLA_Dias=', d.dias_resolucion_max),
           CONCAT('Nombre=', i.nombre_tramite, ', SLA_Dias=', i.dias_resolucion_max), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
    FROM inserted i INNER JOIN deleted d ON i.id_tipo_tramite = d.id_tipo_tramite;
END;
GO

-- ============================================================================
-- TRG-15: tr_aud_respaldos_config_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_respaldos_config_iud
ON dbo.Respaldos_Config
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Respaldos_Config', CAST(i.id_respaldos_config AS VARCHAR(50)), NULL, 
               CONCAT('Config=', i.nombre_configuracion, ', Ruta=', i.ruta_destino, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Respaldos_Config', CAST(i.id_respaldos_config AS VARCHAR(50)), 
               CONCAT('Config=', d.nombre_configuracion, ', Activo=', d.activo),
               CONCAT('Config=', i.nombre_configuracion, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_respaldos_config = d.id_respaldos_config;
    END
END;
GO

-- ============================================================================
-- TRG-16: tr_log_respaldo_finalizado
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_log_respaldo_finalizado
ON dbo.Respaldos
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_eventos_Auditoria (id_usuario_log, tipo_evento_sistema, detalle_evento, ip_origen, fecha_evento)
    SELECT 
        NULL,
        'BACKUP_FINALIZADO',
        CONCAT('Respaldo ID=', i.id_respaldos, ', Estado=', er.nombre_estados, ', Archivo=', i.ruta_archivo, ', Bytes=', i.tamano_bytes),
        ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'),
        GETDATE()
    FROM inserted i
    INNER JOIN dbo.Estados_Respaldos er ON i.id_estados_respaldos = er.id_estados_respaldos
    WHERE i.fecha_fin IS NOT NULL;
END;
GO

-- ============================================================================
-- TRG-17: tr_log_restauracion_finalizada
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_log_restauracion_finalizada
ON dbo.Restauracion
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_eventos_Auditoria (id_usuario_log, tipo_evento_sistema, detalle_evento, ip_origen, fecha_evento)
    SELECT 
        i.id_usuario,
        'RESTORE_FINALIZADO',
        CONCAT('Restauracion ID=', i.id_restauracion, ', Destino=', i.destino, ', Motivo=', i.motivo, ', Estado=', er.nombre_estados),
        ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'),
        GETDATE()
    FROM inserted i
    INNER JOIN dbo.Estados_Respaldos er ON i.id_estados_respaldos = er.id_estados_respaldos
    WHERE i.fecha_fin_restauracion IS NOT NULL;
END;
GO

PRINT '-> 18 Triggers de auditoría y reglas de negocio creados exitosamente.';
GO
