-- Ejecutar despues de scripts 17 y 19. No corrige automaticamente registros previos.
USE MunicipalidadNicoya2026;
GO
CREATE OR ALTER PROCEDURE dbo.sp_cambiar_estado_tramite
    @id_tramite       INT,
    @codigo_estado    VARCHAR(20),
    @observaciones    VARCHAR(255),
    @id_usuario       INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @codigo_estado IN ('APR', 'RECH')
        THROW 50026, 'Use la resolucion formal para aprobar o rechazar y cerrar el expediente.', 1;
    BEGIN TRY
        -- 1. Validar observación obligatoria
        IF @observaciones IS NULL OR LTRIM(RTRIM(@observaciones)) = ''
            THROW 50022, 'Error: Es obligatorio ingresar una justificación u observación técnica del cambio de estado.', 1;

        -- 2. Validar existencia del trámite
        IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite)
            THROW 50007, 'Error: El expediente de trámite no existe.', 1;

        -- 3. Bloquear modificación si ya tiene resolución definitiva cerrada
        IF EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite = @id_tramite AND fecha_resolucion_final IS NOT NULL)
            THROW 50018, 'Error: El expediente ya cuenta con resolución final definitiva y no admite nuevos cambios de estado.', 1;

        -- 4. Obtener estado destino
        DECLARE @id_estado_nuevo INT;
        SELECT @id_estado_nuevo = id_estado FROM dbo.Estado_Tramite WHERE codigo = @codigo_estado;

        IF @id_estado_nuevo IS NULL
            THROW 50008, 'Error: Código de estado de trámite no reconocido.', 1;

        -- 5. Obtener estado actual
        DECLARE @id_estado_actual INT, @codigo_actual VARCHAR(20);
        SELECT TOP 1 
            @id_estado_actual = ht.id_estado_tramite,
            @codigo_actual = et.codigo
        FROM dbo.Historial_Tramite ht
        INNER JOIN dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado
        WHERE ht.id_tramite = @id_tramite
        ORDER BY ht.id_historial DESC;

        -- 6. Validar requisitos obligatorios antes de aprobar (CU-TR-08 FA-01)
        IF @codigo_estado = 'APR'
        BEGIN
            DECLARE @id_tipo_tramite INT;
            SELECT @id_tipo_tramite = id_tipo_tramite FROM dbo.Tramite WHERE id_tramite = @id_tramite;

            -- Verificar si faltan requisitos obligatorios sin presentar
            IF EXISTS (
                SELECT 1
                FROM dbo.Tipo_Tramite_Requisito ttr
                INNER JOIN dbo.Requisito r ON r.id_requisito = ttr.id_requisito
                WHERE ttr.id_tipo_tramite = @id_tipo_tramite
                  AND r.es_obligatorio = 1
                  AND NOT EXISTS (
                      SELECT 1 
                      FROM dbo.Archivo_Adjunto aa 
                      WHERE aa.id_tramite = @id_tramite 
                        AND aa.id_requisito = ttr.id_requisito
                  )
            )
            BEGIN
                THROW 50025, 'Error: No es posible aprobar el trámite porque faltan requisitos documentales obligatorios por presentar.', 1;
            END
        END

        -- 7. Registrar cambio en historial
        INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite, id_usuario, id_estado_anterior)
        VALUES (GETDATE(), @observaciones, @id_tramite, @id_estado_nuevo, @id_usuario, @id_estado_actual);

        PRINT '-> Transición registrada: de ' + ISNULL(@codigo_actual, 'INICIAL') + ' a ' + @codigo_estado;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_registrar_resolucion_tramite
 @id_tramite INT, @codigo_estado VARCHAR(20), @observaciones VARCHAR(255), @id_usuario INT=NULL
AS
BEGIN
 SET NOCOUNT ON;
 SET XACT_ABORT ON;
 BEGIN TRY
  IF @codigo_estado IS NULL OR @codigo_estado NOT IN ('APR','RECH')
   THROW 50026, 'La resolucion solo admite APR o RECH.', 1;
  IF NULLIF(LTRIM(RTRIM(@observaciones)),'') IS NULL
   THROW 50022, 'Debe fundamentar la resolucion.', 1;
  IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario=@id_usuario AND activo=1)
   THROW 50070, 'Se requiere un funcionario activo para resolver.', 1;
  BEGIN TRANSACTION;
  DECLARE @encontrado INT, @cierre DATETIME, @anterior INT, @destino INT;
  SELECT @encontrado=id_tramite, @cierre=fecha_resolucion_final
  FROM dbo.Tramite WITH (UPDLOCK,HOLDLOCK) WHERE id_tramite=@id_tramite;
  IF @encontrado IS NULL THROW 50024, 'El expediente no existe.', 1;
  IF @cierre IS NOT NULL THROW 50018, 'El expediente ya tiene resolucion final.', 1;
  SELECT @destino=id_estado FROM dbo.Estado_Tramite WHERE codigo=@codigo_estado;
  IF @destino IS NULL THROW 50008, 'El estado final no esta configurado.', 1;
  SELECT TOP (1) @anterior=id_estado_tramite FROM dbo.Historial_Tramite
  WHERE id_tramite=@id_tramite ORDER BY id_historial DESC;
  -- El trigger del script 19 exige cotejo de la ultima version de los requisitos.
  INSERT dbo.Historial_Tramite(fecha_cambio,observaciones,id_tramite,id_estado_tramite,id_usuario,id_estado_anterior)
  VALUES(GETDATE(),@observaciones,@id_tramite,@destino,@id_usuario,@anterior);
  UPDATE dbo.Tramite SET fecha_resolucion_final=GETDATE() WHERE id_tramite=@id_tramite;
  COMMIT;
 END TRY
 BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO

SELECT name, modify_date FROM sys.procedures
WHERE name IN ('sp_cambiar_estado_tramite','sp_registrar_resolucion_tramite');
GO
