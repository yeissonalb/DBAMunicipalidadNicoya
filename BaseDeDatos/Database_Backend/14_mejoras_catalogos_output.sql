/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 14: MEJORAS PARA EL BACKEND (CATÁLOGOS, OUTPUT, 404, IDENTIDAD)
   ----------------------------------------------------------------------------
   Requiere: scripts 01-13 ya ejecutados.  Es re-ejecutable (CREATE OR ALTER).

   A. Identidad del usuario de la API en auditoría (SESSION_CONTEXT)
      - dbo.fn_usuario_sesion(): id del funcionario de la API (SESSION_CONTEXT
        'id_usuario'); si no existe, cae al login SQL (SYSTEM_USER) como antes.
      - Los 13 triggers de auditoría, tr_log_respaldo_finalizado y
        sp_internal_audit_logger se recrean para usar dbo.fn_usuario_sesion()
        en lugar de NULL.
      La API envía, en el MISMO lote de cada comando:
        EXEC sp_set_session_context @key = N'id_usuario', @value = @id;

   B. IDs generados (INT OUTPUT con DEFAULT NULL, compatible con llamadas viejas)
      sp_registrar_rol            -> @nuevo_id_rol
      sp_registrar_permiso        -> @nuevo_id_permiso
      sp_registrar_tipo_tramite   -> @nuevo_id_tipo_tramite
      sp_registrar_requisito      -> @nuevo_id_requisito

   C. Catálogos de consulta
      sp_consultar_roles, sp_consultar_permisos,
      sp_consultar_requisitos, sp_consultar_departamentos

   D. Actualizaciones que antes "no hacían nada" con un id inexistente
      (rango 50021-50040 -> HTTP 404 en la API)
        50021 sp_actualizar_usuario
        50022 sp_cambiar_estado_usuario
        50023 sp_actualizar_tipo_tramite
        50024 sp_actualizar_tramite
        50025 sp_actualizar_estado_deuda
        50026 sp_actualizar_configuracion_respaldo
      Se valida con IF NOT EXISTS ANTES del UPDATE (no con @@ROWCOUNT después),
      porque estas tablas tienen triggers AFTER UPDATE y así el resultado no
      depende de lo que el trigger ejecute.

   E. Duplicados explícitos (rango 50041-50060 -> HTTP 409)
        50041 rol ya existe             (antes: se ignoraba en silencio)
        50042 permiso ya existe         (antes: se ignoraba en silencio)
        50043 tipo de trámite ya existe (antes: error 2627 de UNIQUE)

   F. sp_registrar_representante_legal acepta @id_contribuyente (id del padrón)
      y resuelve id_contribuyente_juridico. 50029 -> 404 si no es jurídico.

   G. Códigos "no existe" movidos al rango 404:
        50003 -> 50027 sp_actualizar_contribuyente
        50006 -> 50028 sp_actualizar_inmueble

   H. Catálogos DBA: sp_consultar_frecuencias, sp_consultar_tipos_respaldo,
      sp_consultar_configuraciones_respaldo
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- A.1 Función de identidad de sesión
-- ============================================================================
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

-- ============================================================================
-- A.2 Triggers de auditoría recreados con dbo.fn_usuario_sesion()
--     (copia fiel de 06_Triggers_Auditoria_Negocio.sql; único cambio: el
--      id_usuario que antes era NULL ahora es dbo.fn_usuario_sesion())
-- ============================================================================

-- ============================================================================
-- PROCEDIMIENTO AUXILIAR INTERNO PARA REGISTRO DE AUDITORÍA
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_internal_audit_logger
    @tabla VARCHAR(50),
    @id_reg VARCHAR(50),
    @val_ant VARCHAR(MAX),
    @val_nue VARCHAR(MAX),
    @cod_op VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ip VARCHAR(45) = ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1');
    DECLARE @id_usr INT = dbo.fn_usuario_sesion();   -- antes: solo el login SQL
    DECLARE @id_tipo INT;
    SELECT @id_tipo = id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = @cod_op;

    IF @id_tipo IS NOT NULL
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria
        (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        VALUES
        (@tabla, @id_reg, @val_ant, @val_nue, @ip, GETDATE(), @id_usr, @id_tipo);
    END
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
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
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
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
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
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
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
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), dbo.fn_usuario_sesion(),
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

-- ============================================================================
-- B. Registros con OUTPUT
-- ============================================================================

-- AURP-05: sp_registrar_rol
CREATE OR ALTER PROCEDURE dbo.sp_registrar_rol
    @nombre_rol    VARCHAR(50),
    @nuevo_id_rol  INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Rol WHERE nombre_rol = @nombre_rol)
            THROW 50041, N'Error: Ya existe un rol con ese nombre.', 1;

        INSERT INTO dbo.Rol (nombre_rol) VALUES (@nombre_rol);
        SET @nuevo_id_rol = SCOPE_IDENTITY();
        PRINT '-> Rol registrado con ID: ' + CAST(@nuevo_id_rol AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- AURP-06: sp_registrar_permiso
CREATE OR ALTER PROCEDURE dbo.sp_registrar_permiso
    @modulo            VARCHAR(50),
    @accion            VARCHAR(20),
    @nuevo_id_permiso  INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Permiso WHERE modulo = @modulo AND accion = @accion)
            THROW 50042, N'Error: Ya existe ese permiso (módulo + acción).', 1;

        INSERT INTO dbo.Permiso (modulo, accion) VALUES (@modulo, @accion);
        SET @nuevo_id_permiso = SCOPE_IDENTITY();
        PRINT '-> Permiso registrado con ID: ' + CAST(@nuevo_id_permiso AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GTA-01: sp_registrar_tipo_tramite
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tipo_tramite
    @nombre_tramite        VARCHAR(100),
    @descripcion_tipo      VARCHAR(255),
    @dias_resolucion_max   INT,
    @id_departamento       INT,
    @nuevo_id_tipo_tramite INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Tipo_Tramite WHERE nombre_tramite = @nombre_tramite)
            THROW 50043, N'Error: Ya existe un tipo de trámite con ese nombre.', 1;

        INSERT INTO dbo.Tipo_Tramite (nombre_tramite, descripcion_tipo, dias_resolucion_max, id_departamento)
        VALUES (@nombre_tramite, @descripcion_tipo, @dias_resolucion_max, @id_departamento);

        SET @nuevo_id_tipo_tramite = SCOPE_IDENTITY();
        PRINT '-> Tipo de trámite creado con ID: ' + CAST(@nuevo_id_tipo_tramite AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GTA-04: sp_registrar_requisito
CREATE OR ALTER PROCEDURE dbo.sp_registrar_requisito
    @nombre_requisito   VARCHAR(255),
    @descripcion        VARCHAR(500),
    @es_obligatorio     BIT = 1,
    @nuevo_id_requisito INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO dbo.Requisito (nombre_requisito, descripcion, es_obligatorio)
        VALUES (@nombre_requisito, @descripcion, @es_obligatorio);

        SET @nuevo_id_requisito = SCOPE_IDENTITY();
        PRINT '-> Requisito creado con ID: ' + CAST(@nuevo_id_requisito AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- C. Catálogos de consulta
-- ============================================================================

CREATE OR ALTER PROCEDURE dbo.sp_consultar_roles
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_rol, nombre_rol
    FROM dbo.Rol
    ORDER BY id_rol;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_consultar_permisos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_permiso, modulo, accion
    FROM dbo.Permiso
    ORDER BY modulo, accion;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_consultar_requisitos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_requisito, nombre_requisito, descripcion, es_obligatorio
    FROM dbo.Requisito
    ORDER BY id_requisito;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_consultar_departamentos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_departamento, nombre_departamento, codigo_interno
    FROM dbo.Departamento
    ORDER BY id_departamento;
END;
GO

-- ============================================================================
-- D. Actualizaciones con validación de existencia (50021-50026 -> 404)
-- ============================================================================

-- AURP-03: sp_actualizar_usuario
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_usuario
    @id_usuario        INT,
    @nombre_usuario    VARCHAR(50),
    @apellido1_usuario VARCHAR(50),
    @apellido2_usuario VARCHAR(50),
    @email_usuario     VARCHAR(100),
    @id_departamento   INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario)
            THROW 50021, N'Error: El usuario especificado no existe.', 1;

        UPDATE dbo.Usuario
        SET nombre_usuario = @nombre_usuario,
            apellido1_usuario = @apellido1_usuario,
            apellido2_usuario = @apellido2_usuario,
            email_usuario = @email_usuario,
            id_departamento = @id_departamento
        WHERE id_usuario = @id_usuario;

        PRINT '-> Usuario actualizado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- AURP-04: sp_cambiar_estado_usuario
CREATE OR ALTER PROCEDURE dbo.sp_cambiar_estado_usuario
    @id_usuario INT,
    @activo     BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario)
            THROW 50022, N'Error: El usuario especificado no existe.', 1;

        UPDATE dbo.Usuario
        SET activo = @activo
        WHERE id_usuario = @id_usuario;

        PRINT '-> Estado de cuenta de usuario modificado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GTA-02: sp_actualizar_tipo_tramite
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_tipo_tramite
    @id_tipo_tramite     INT,
    @nombre_tramite      VARCHAR(100),
    @descripcion_tipo    VARCHAR(255),
    @dias_resolucion_max INT,
    @id_departamento     INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Tipo_Tramite WHERE id_tipo_tramite = @id_tipo_tramite)
            THROW 50023, N'Error: El tipo de trámite especificado no existe.', 1;

        UPDATE dbo.Tipo_Tramite
        SET nombre_tramite = @nombre_tramite,
            descripcion_tipo = @descripcion_tipo,
            dias_resolucion_max = @dias_resolucion_max,
            id_departamento = @id_departamento
        WHERE id_tipo_tramite = @id_tipo_tramite;

        PRINT '-> Tipo de trámite actualizado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GTA-09: sp_actualizar_tramite
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_tramite
    @id_tramite   INT,
    @id_usuario   INT,
    @id_inmueble  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite)
            THROW 50024, N'Error: El trámite especificado no existe.', 1;

        UPDATE dbo.Tramite
        SET id_usuario = @id_usuario,
            id_inmueble = @id_inmueble
        WHERE id_tramite = @id_tramite;

        PRINT '-> Trámite actualizado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- CPG-04: sp_actualizar_estado_deuda
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_estado_deuda
    @id_deuda_municipal  INT,
    @codigo_estado_deuda VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda = @codigo_estado_deuda;

        IF @id_estado IS NULL
            THROW 50010, 'Error: Estado de deuda no encontrado.', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.Deudas_Municipales WHERE id_deuda_municipal = @id_deuda_municipal)
            THROW 50025, N'Error: La deuda municipal especificada no existe.', 1;

        UPDATE dbo.Deudas_Municipales
        SET id_estado_deuda = @id_estado
        WHERE id_deuda_municipal = @id_deuda_municipal;

        PRINT '-> Estado de deuda actualizado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- RRBD-02: sp_actualizar_configuracion_respaldo
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_configuracion_respaldo
    @id_respaldos_config  INT,
    @nombre_configuracion VARCHAR(255),
    @hora_ejecucion       TIME,
    @retencion_dias       INT,
    @ruta_destino         VARCHAR(255),
    @activo               BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Respaldos_Config WHERE id_respaldos_config = @id_respaldos_config)
            THROW 50026, N'Error: La configuración de respaldo especificada no existe.', 1;

        UPDATE dbo.Respaldos_Config
        SET nombre_configuracion = @nombre_configuracion,
            hora_ejecucion = @hora_ejecucion,
            retencion_dias = @retencion_dias,
            ruta_destino = @ruta_destino,
            activo = @activo,
            fecha_modificacion = GETDATE()
        WHERE id_respaldos_config = @id_respaldos_config;

        PRINT '-> Directiva de respaldo actualizada.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- F. Representante legal por id del padrón (id_contribuyente)
--    El frontend solo conoce id_contribuyente (vw_padron_contribuyentes);
--    el SP resuelve internamente id_contribuyente_juridico.
--    Se mantiene @id_contribuyente_juridico (ahora opcional) por compatibilidad.
--      50029 -> 404 si no existe el contribuyente jurídico (50004 deja de usarse)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_registrar_representante_legal
    @nombre_representante      VARCHAR(50),
    @apellido1_representante   VARCHAR(50),
    @apellido2_representante   VARCHAR(50),
    @tomo_folio_registro       VARCHAR(30),
    @cedula_representante      VARCHAR(20),
    @fecha_vencimiento_poder   DATETIME,
    @id_contribuyente_juridico INT = NULL,
    @id_contribuyente          INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @id_contribuyente_juridico IS NULL AND @id_contribuyente IS NOT NULL
            SELECT @id_contribuyente_juridico = id_contribuyente_juridico
            FROM dbo.Contribuyente_Juridico
            WHERE id_contribuyente = @id_contribuyente;

        IF @id_contribuyente_juridico IS NULL
           OR NOT EXISTS (SELECT 1 FROM dbo.Contribuyente_Juridico WHERE id_contribuyente_juridico = @id_contribuyente_juridico)
            THROW 50029, N'Error: No existe un contribuyente jurídico con el identificador indicado.', 1;

        INSERT INTO dbo.Representante_Legal
        (nombre_representante, apellido1_representante, apellido2_representante, tomo_folio_registro, cedula_representante, fecha_vencimiento_poder, id_contribuyente_juridico)
        VALUES
        (@nombre_representante, @apellido1_representante, @apellido2_representante, @tomo_folio_registro, @cedula_representante, @fecha_vencimiento_poder, @id_contribuyente_juridico);

        PRINT '-> Representante legal registrado exitosamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- G. "No existe" de contribuyente e inmueble pasa al rango 404
--      50003 -> 50027 (sp_actualizar_contribuyente)
--      50006 -> 50028 (sp_actualizar_inmueble)
--    Igual que en D: IF NOT EXISTS antes del UPDATE (las tablas tienen triggers).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_contribuyente
    @id_contribuyente         INT,
    @correo_electronico       VARCHAR(100),
    @telefono                 VARCHAR(20),
    @direccion_notificaciones VARCHAR(255),
    @estado_contribuyente     BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Contribuyente WHERE id_contribuyente = @id_contribuyente)
            THROW 50027, N'Error: El contribuyente especificado no existe.', 1;

        UPDATE dbo.Contribuyente
        SET correo_electronico = @correo_electronico,
            telefono = @telefono,
            direccion_notificaciones = @direccion_notificaciones,
            estado_contribuyente = @estado_contribuyente
        WHERE id_contribuyente = @id_contribuyente;

        PRINT '-> Padrón de contribuyente actualizado correctamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_actualizar_inmueble
    @id_inmueble          INT,
    @direccion_exacta     VARCHAR(255),
    @area_terreno_m2      FLOAT,
    @area_construccion_m2 FLOAT,
    @valor_fiscal         FLOAT,
    @plano_catastrado     VARCHAR(30),
    @id_tipo_uso_inmueble INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Bien_Inmueble WHERE id_inmueble = @id_inmueble)
            THROW 50028, N'Error: Inmueble no encontrado.', 1;

        UPDATE dbo.Bien_Inmueble
        SET direccion_exacta = @direccion_exacta,
            area_terreno_m2 = @area_terreno_m2,
            area_construccion_m2 = @area_construccion_m2,
            valor_fiscal = @valor_fiscal,
            plano_catastrado = @plano_catastrado,
            id_tipo_uso_inmueble = @id_tipo_uso_inmueble
        WHERE id_inmueble = @id_inmueble;

        PRINT '-> Inmueble actualizado exitosamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- H. Catálogos de respaldos (DBA)
--    sp_consultar_configuraciones_respaldo expone id_respaldos_config, que
--    hace falta para PUT /api/respaldosdba/configuracion/{id}.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_consultar_frecuencias
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_frecuencia, nombre_frecuencia, intervalo_horas, descripcion_frecuencia
    FROM dbo.Frecuencia
    ORDER BY intervalo_horas;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_respaldo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_de_respaldo, nombre_tipo_respaldo, descripcion
    FROM dbo.Tipo_de_respaldo
    ORDER BY id_tipo_de_respaldo;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_consultar_configuraciones_respaldo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        rc.id_respaldos_config,
        rc.nombre_configuracion,
        rc.hora_ejecucion,
        rc.origen,
        rc.retencion_dias,
        rc.cifrado,
        rc.ruta_destino,
        rc.activo,
        rc.fecha_creacion,
        rc.fecha_modificacion,
        rc.id_frecuencia,
        f.nombre_frecuencia,
        rc.id_tipo_de_respaldo,
        tr.nombre_tipo_respaldo
    FROM dbo.Respaldos_Config rc
    INNER JOIN dbo.Frecuencia f ON rc.id_frecuencia = f.id_frecuencia
    INNER JOIN dbo.Tipo_de_respaldo tr ON rc.id_tipo_de_respaldo = tr.id_tipo_de_respaldo
    ORDER BY rc.id_respaldos_config;
END;
GO

-- ============================================================================
-- Permisos para los objetos nuevos (roles de BD del script 07)
-- ============================================================================
GRANT EXECUTE ON dbo.sp_consultar_roles         TO rol_administrador;
GRANT EXECUTE ON dbo.sp_consultar_permisos      TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_rol           TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_permiso       TO rol_administrador;
GRANT EXECUTE ON dbo.sp_consultar_departamentos TO rol_administrador;
GRANT EXECUTE ON dbo.sp_consultar_departamentos TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_requisitos    TO rol_analista_tramites;
-- Los catálogos de respaldo los usa el DBA (usr_dba_nicoya es db_owner: no requiere GRANT)
GO

PRINT '-> Script 14 aplicado: identidad de sesión, OUTPUT, catálogos, representante legal y validaciones 404.';
GO
