-- Instalacion consolidada. Una definicion final por objeto; no ejecutar migraciones historicas.
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\definicion_recuperada_SSMS.sql
CREATE OR ALTER TRIGGER dbo.tr_actualizar_saldo_factura_detalle
ON dbo.Detalle_Factura
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FacturasImpactadas TABLE (id_factura INT);

    INSERT INTO @FacturasImpactadas (id_factura)
    SELECT DISTINCT id_factura FROM inserted WHERE id_factura IS NOT NULL
    UNION
    SELECT DISTINCT id_factura FROM deleted WHERE id_factura IS NOT NULL;

    UPDATE f
    SET f.saldo_pendiente = CASE 
            WHEN (f.total_a_pagar - abonos.total_abonado) < 0 THEN 0
            ELSE ROUND(f.total_a_pagar - abonos.total_abonado, 2)
        END,
        f.estado_factura = CASE 
            WHEN (f.total_a_pagar - abonos.total_abonado) <= 0.001 THEN 'PAGADA'
            WHEN abonos.total_abonado > 0 THEN 'PAGADA_PARCIAL'
            ELSE 'EMITIDA'
        END
    FROM dbo.Factura f
    INNER JOIN @FacturasImpactadas fi ON f.id_factura = fi.id_factura
    CROSS APPLY (
        SELECT ISNULL(SUM(monto_aplicado_principal + monto_aplicado_interes + monto_aplicado_recargo), 0) AS total_abonado
        FROM dbo.Detalle_Factura df
        WHERE df.id_factura = f.id_factura
    ) abonos;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Contribuyente', CAST(i.id_contribuyente AS VARCHAR(50)), 
               CONCAT('Correo=', d.correo_electronico, ', Tel=', d.telefono, ', Estado=', d.estado_contribuyente),
               CONCAT('Correo=', i.correo_electronico, ', Tel=', i.telefono, ', Estado=', i.estado_contribuyente), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_contribuyente = d.id_contribuyente;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Contribuyente', CAST(d.id_contribuyente AS VARCHAR(50)), 
               CONCAT('Correo=', d.correo_electronico, ', Tel=', d.telefono), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Bien_Inmueble', CAST(i.id_inmueble AS VARCHAR(50)), 
               CONCAT('Finca=', d.numero_finca, ', ValorFiscal=', d.valor_fiscal),
               CONCAT('Finca=', i.numero_finca, ', ValorFiscal=', i.valor_fiscal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_inmueble = d.id_inmueble;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Bien_Inmueble', CAST(d.id_inmueble AS VARCHAR(50)), 
               CONCAT('Finca=', d.numero_finca, ', ValorFiscal=', d.valor_fiscal), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Derecho_Inmueble', CAST(i.id_derecho_inmueble AS VARCHAR(50)), 
               CONCAT('Inmueble=', d.id_inmueble, ', Contribuyente=', d.id_contribuyente, ', Pct=', d.porcentaje_participacion),
               CONCAT('Inmueble=', i.id_inmueble, ', Contribuyente=', i.id_contribuyente, ', Pct=', i.porcentaje_participacion), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_derecho_inmueble = d.id_derecho_inmueble;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Derecho_Inmueble', CAST(d.id_derecho_inmueble AS VARCHAR(50)), 
               CONCAT('Inmueble=', d.id_inmueble, ', Contribuyente=', d.id_contribuyente, ', Pct=', d.porcentaje_participacion), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Tramite', CAST(i.id_tramite AS VARCHAR(50)), 
               CONCAT('Usuario=', d.id_usuario, ', Inmueble=', ISNULL(CAST(d.id_inmueble AS VARCHAR(20)), 'N/A'), ', Resolucion=', ISNULL(CONVERT(VARCHAR(19), d.fecha_resolucion_final, 120), 'Pendiente')),
               CONCAT('Usuario=', i.id_usuario, ', Inmueble=', ISNULL(CAST(i.id_inmueble AS VARCHAR(20)), 'N/A'), ', Resolucion=', ISNULL(CONVERT(VARCHAR(19), i.fecha_resolucion_final, 120), 'Pendiente')), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_tramite = d.id_tramite;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Tramite', CAST(d.id_tramite AS VARCHAR(50)), 
               CONCAT('Expediente=', d.numero_expediente, ', Tipo=', d.id_tipo_tramite), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER TRIGGER dbo.tr_aud_historial_tramite_iud
ON dbo.Historial_Tramite
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Historial_Tramite', CAST(i.id_historial AS VARCHAR(50)), NULL, 
           CONCAT('Tramite=', i.id_tramite, ', Estado=', i.id_estado_tramite, ', Obs=', i.observaciones), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
    FROM inserted i;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Deudas_Municipales', CAST(i.id_deuda_municipal AS VARCHAR(50)), 
               CONCAT('Periodo=', d.periodo_deuda, ', Estado=', d.id_estado_deuda, ', Principal=', d.monto_principal, ', Intereses=', d.monto_intereses, ', Multas=', d.monto_multas),
               CONCAT('Periodo=', i.periodo_deuda, ', Estado=', i.id_estado_deuda, ', Principal=', i.monto_principal, ', Intereses=', i.monto_intereses, ', Multas=', i.monto_multas), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_deuda_municipal = d.id_deuda_municipal;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Deudas_Municipales', CAST(d.id_deuda_municipal AS VARCHAR(50)), 
               CONCAT('Periodo=', d.periodo_deuda, ', Principal=', d.monto_principal), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Factura', CAST(i.id_factura AS VARCHAR(50)), 
               CONCAT('Saldo=', d.saldo_pendiente, ', Estado=', d.estado_factura),
               CONCAT('Saldo=', i.saldo_pendiente, ', Estado=', i.estado_factura), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_factura = d.id_factura;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Factura', CAST(d.id_factura AS VARCHAR(50)), 
               CONCAT('Clave=', d.clave_numerica_hacienda, ', Total=', d.total_a_pagar), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Detalle_Factura', CAST(i.id_detalle_factura AS VARCHAR(50)), 
               CONCAT('Principal=', d.monto_aplicado_principal),
               CONCAT('Principal=', i.monto_aplicado_principal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_detalle_factura = d.id_detalle_factura;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Detalle_Factura', CAST(d.id_detalle_factura AS VARCHAR(50)), 
               CONCAT('Factura=', d.id_factura, ', Pago=', d.id_pago_municipal, ', Principal=', d.monto_aplicado_principal), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER TRIGGER dbo.tr_aud_pago_iud
ON dbo.Pago_Municipal
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Pago_Municipal', CAST(i.id_pago_municipal AS VARCHAR(50)), NULL, 
           CONCAT('Monto=', i.monto_total_pagado, ', Recibo=', i.comprobante, ', Contribuyente=', i.id_contribuyente), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
    FROM inserted i;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Usuario', CAST(i.id_usuario AS VARCHAR(50)), 
               CONCAT('User=', d.user_name, ', Activo=', d.activo),
               CONCAT('User=', i.user_name, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_usuario = d.id_usuario;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Usuario', CAST(d.id_rol_usuario AS VARCHAR(50)), 
               CONCAT('Usuario=', d.id_usuario, ', Rol=', d.id_rol), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Permiso', CAST(d.id_rol_permiso AS VARCHAR(50)), 
               CONCAT('Rol=', d.id_rol, ', Permiso=', d.id_permiso), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
    FROM inserted i INNER JOIN deleted d ON i.id_tipo_tributo = d.id_tipo_tributo;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
    FROM inserted i INNER JOIN deleted d ON i.id_tipo_tramite = d.id_tipo_tramite;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Respaldos_Config', CAST(i.id_respaldos_config AS VARCHAR(50)), 
               CONCAT('Config=', d.nombre_configuracion, ', Activo=', d.activo),
               CONCAT('Config=', i.nombre_configuracion, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_respaldos_config = d.id_respaldos_config;
    END
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
CREATE OR ALTER TRIGGER dbo.tr_log_respaldo_finalizado
ON dbo.Respaldos
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_eventos_Auditoria (id_usuario_log, tipo_evento_sistema, detalle_evento, ip_origen, fecha_evento)
    SELECT 
        dbo.fn_usuario_sesion(),
        'BACKUP_FINALIZADO',
        CONCAT('Respaldo ID=', i.id_respaldos, ', Estado=', er.nombre_estados, ', Archivo=', i.ruta_archivo, ', Bytes=', i.tamano_bytes),
        ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'),
        GETDATE()
    FROM inserted i
    INNER JOIN dbo.Estados_Respaldos er ON i.id_estados_respaldos = er.id_estados_respaldos
    WHERE i.fecha_fin IS NOT NULL;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\14_mejoras_catalogos_output.sql
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

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\19_cotejo_documental_real.sql
CREATE OR ALTER TRIGGER dbo.tr_validar_cotejo_antes_aprobacion
ON dbo.Historial_Tramite AFTER INSERT, UPDATE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS (
  SELECT 1 FROM inserted i
  JOIN dbo.Estado_Tramite e ON e.id_estado=i.id_estado_tramite
  JOIN dbo.Tramite t ON t.id_tramite=i.id_tramite
  JOIN dbo.Tipo_Tramite_Requisito tr ON tr.id_tipo_tramite=t.id_tipo_tramite
  JOIN dbo.Requisito r ON r.id_requisito=tr.id_requisito AND r.es_obligatorio=1
  OUTER APPLY (
   SELECT TOP (1) aa.id_archivo_adjunto FROM dbo.Archivo_Adjunto aa
   WHERE aa.id_tramite=t.id_tramite AND aa.id_requisito=r.id_requisito
   ORDER BY aa.id_archivo_adjunto DESC
  ) a
  OUTER APPLY (
   SELECT TOP (1) rr.estado FROM dbo.Revision_Archivo_Requisito rr
   WHERE rr.id_archivo_adjunto=a.id_archivo_adjunto ORDER BY rr.id_revision DESC
  ) rv
  WHERE e.codigo='APR' AND ISNULL(rv.estado,'PENDIENTE')<>'VALIDADO'
 ) THROW 50025, 'No se puede aprobar: faltan requisitos obligatorios validados en su ultima version.', 1;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\22_integridad_y_reglas_inmueble.sql
CREATE OR ALTER TRIGGER dbo.tr_validar_inmueble_por_tipo_tramite
ON dbo.Tramite AFTER INSERT, UPDATE
AS
BEGIN
 SET NOCOUNT ON;
 IF NOT UPDATE(id_tipo_tramite) AND NOT UPDATE(id_inmueble) RETURN;
 IF EXISTS(SELECT 1 FROM inserted i LEFT JOIN dbo.Configuracion_Inmueble_Tramite c
  ON c.id_tipo_tramite=i.id_tipo_tramite WHERE c.id_tipo_tramite IS NULL)
  THROW 50022,'El administrador debe configurar la regla de inmueble antes de radicar este tipo de tramite.',1;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.Configuracion_Inmueble_Tramite c
  ON c.id_tipo_tramite=i.id_tipo_tramite WHERE c.requiere_inmueble=1 AND i.id_inmueble IS NULL)
  THROW 50022,'El tipo de tramite seleccionado requiere un inmueble.',1;
END;
GO

USE [MunicipalidadNicoya2026];
GO

-- Fuente de la version final: Database_Backend\22_integridad_y_reglas_inmueble.sql
CREATE OR ALTER TRIGGER dbo.tr_proteger_total_derechos
ON dbo.Derecho_Inmueble AFTER INSERT, UPDATE
AS
BEGIN
 SET NOCOUNT ON;
 DECLARE @afectadas TABLE(id_inmueble INT PRIMARY KEY);
 INSERT @afectadas SELECT id_inmueble FROM inserted UNION SELECT id_inmueble FROM deleted;
 -- Misma fila de bloqueo usada por sp_asignar_derecho_inmueble.
 DECLARE @bloqueadas INT;
 SELECT @bloqueadas=COUNT(*) FROM dbo.Bien_Inmueble bi WITH(UPDLOCK,HOLDLOCK)
 JOIN @afectadas a ON a.id_inmueble=bi.id_inmueble;
 IF EXISTS(SELECT d.id_inmueble FROM dbo.Derecho_Inmueble d WITH(UPDLOCK,HOLDLOCK)
  JOIN @afectadas a ON a.id_inmueble=d.id_inmueble GROUP BY d.id_inmueble
  HAVING SUM(d.porcentaje_participacion)>100.0001)
  THROW 50007,'La suma de derechos vigentes no puede superar el 100%.',1;
 IF EXISTS(SELECT d.id_inmueble,d.id_contribuyente FROM dbo.Derecho_Inmueble d WITH(UPDLOCK,HOLDLOCK)
  JOIN @afectadas a ON a.id_inmueble=d.id_inmueble
  GROUP BY d.id_inmueble,d.id_contribuyente HAVING COUNT(*)>1)
  THROW 50007,'No se admite duplicar el derecho del mismo contribuyente en la finca.',1;
END;
GO
