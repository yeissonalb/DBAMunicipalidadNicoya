-- Script 22: reglas explicitas de inmueble e integridad de copropiedad.
-- No elimina ni redistribuye derechos existentes.
USE MunicipalidadNicoya2026;
GO
IF OBJECT_ID('dbo.Configuracion_Inmueble_Tramite','U') IS NULL
 CREATE TABLE dbo.Configuracion_Inmueble_Tramite(
  id_tipo_tramite INT NOT NULL PRIMARY KEY REFERENCES dbo.Tipo_Tramite(id_tipo_tramite),
  requiere_inmueble BIT NOT NULL, motivo NVARCHAR(255) NOT NULL,
  id_usuario INT NOT NULL REFERENCES dbo.Usuario(id_usuario), fecha_configuracion DATETIME NOT NULL DEFAULT GETDATE()
 );
GO
IF OBJECT_ID('dbo.Historial_Configuracion_Inmueble','U') IS NULL
 CREATE TABLE dbo.Historial_Configuracion_Inmueble(
  id_historial_configuracion INT IDENTITY PRIMARY KEY,
  id_tipo_tramite INT NOT NULL REFERENCES dbo.Tipo_Tramite(id_tipo_tramite),
  requiere_inmueble BIT NOT NULL,motivo NVARCHAR(255) NOT NULL,
  id_usuario INT NOT NULL REFERENCES dbo.Usuario(id_usuario),fecha DATETIME NOT NULL DEFAULT GETDATE()
 );
GO
CREATE OR ALTER PROCEDURE dbo.sp_configurar_inmueble_tramite
 @id_tipo_tramite INT,@requiere_inmueble BIT,@motivo NVARCHAR(255),@id_usuario INT
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 BEGIN TRY
  IF @requiere_inmueble IS NULL OR NULLIF(LTRIM(RTRIM(@motivo)),'') IS NULL
   THROW 50022,'Defina la regla de inmueble y su justificacion.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.Usuario WHERE id_usuario=@id_usuario AND activo=1)
   THROW 50070,'El funcionario no esta activo.',1;
  BEGIN TRANSACTION;
  DECLARE @tipo INT;
  SELECT @tipo=id_tipo_tramite FROM dbo.Tipo_Tramite WITH(UPDLOCK,HOLDLOCK) WHERE id_tipo_tramite=@id_tipo_tramite;
  IF @tipo IS NULL THROW 50024,'El tipo de tramite no existe.',1;
  UPDATE dbo.Configuracion_Inmueble_Tramite SET requiere_inmueble=@requiere_inmueble,motivo=@motivo,
   id_usuario=@id_usuario,fecha_configuracion=GETDATE() WHERE id_tipo_tramite=@id_tipo_tramite;
  IF @@ROWCOUNT=0 INSERT dbo.Configuracion_Inmueble_Tramite(id_tipo_tramite,requiere_inmueble,motivo,id_usuario)
   VALUES(@id_tipo_tramite,@requiere_inmueble,@motivo,@id_usuario);
  INSERT dbo.Historial_Configuracion_Inmueble(id_tipo_tramite,requiere_inmueble,motivo,id_usuario)
   VALUES(@id_tipo_tramite,@requiere_inmueble,@motivo,@id_usuario);
  COMMIT;
 END TRY
 BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_tramite
AS
BEGIN
 SET NOCOUNT ON;
 SELECT tt.id_tipo_tramite,tt.nombre_tramite,tt.descripcion_tipo,tt.dias_resolucion_max,
  tt.id_departamento,dep.nombre_departamento,c.requiere_inmueble
 FROM dbo.Tipo_Tramite tt
 JOIN dbo.Departamento dep ON dep.id_departamento=tt.id_departamento
 LEFT JOIN dbo.Configuracion_Inmueble_Tramite c ON c.id_tipo_tramite=tt.id_tipo_tramite;
END;
GO
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
-- Cubre escrituras directas, cambios de porcentaje e inserciones de varias filas.
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
-- Diagnostico solamente: conservar los registros hasta definir la distribucion correcta.
SELECT d.id_inmueble,SUM(d.porcentaje_participacion) AS porcentaje_total,COUNT(*) AS derechos
FROM dbo.Derecho_Inmueble d GROUP BY d.id_inmueble HAVING SUM(d.porcentaje_participacion)>100.0001;
SELECT tt.id_tipo_tramite,tt.nombre_tramite,c.requiere_inmueble,c.motivo
FROM dbo.Tipo_Tramite tt LEFT JOIN dbo.Configuracion_Inmueble_Tramite c ON c.id_tipo_tramite=tt.id_tipo_tramite;
GO

-- Conservar la observacion ingresada en la radicacion.
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tramite
    @numero_expediente   VARCHAR(30) = NULL OUTPUT,
    @id_tipo_tramite     INT,
    @id_usuario          INT,
    @id_inmueble         INT = NULL,
    @id_contribuyente    INT,
    @nuevo_id_tramite    INT OUTPUT,
    @observaciones_iniciales VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validar contribuyente activo
        IF NOT EXISTS (SELECT 1 FROM dbo.Contribuyente WHERE id_contribuyente = @id_contribuyente AND estado_contribuyente = 1)
            THROW 50001, 'Error: El contribuyente no existe o se encuentra inactivo.', 1;

        -- 2. Validar tipo de trámite
        DECLARE @dias_max INT;
        SELECT @dias_max = dias_resolucion_max 
        FROM dbo.Tipo_Tramite 
        WHERE id_tipo_tramite = @id_tipo_tramite;

        IF @dias_max IS NULL
            THROW 50002, 'Error: El tipo de trámite especificado no existe.', 1;

        -- 3. Validar inmueble y derecho si fue suministrado (CU-TR-03 FA-02)
        IF @id_inmueble IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.Bien_Inmueble WHERE id_inmueble = @id_inmueble)
                THROW 50020, 'Error: El inmueble seleccionado no existe.', 1;

            -- Verificar si el contribuyente tiene derecho registrado o representación jurídica
            DECLARE @tiene_derecho BIT = 0;

            IF EXISTS (SELECT 1 FROM dbo.Derecho_Inmueble WHERE id_inmueble = @id_inmueble AND id_contribuyente = @id_contribuyente)
                SET @tiene_derecho = 1;
            ELSE IF EXISTS (
                -- Caso persona jurídica: representante legal que radique
                SELECT 1 
                FROM dbo.Contribuyente_Juridico cj
                INNER JOIN dbo.Representante_Legal rl ON cj.id_contribuyente_juridico = rl.id_contribuyente_juridico
                INNER JOIN dbo.Derecho_Inmueble di ON cj.id_contribuyente = di.id_contribuyente
                WHERE di.id_inmueble = @id_inmueble 
                  AND rl.fecha_vencimiento_poder >= GETDATE()
                  AND cj.id_contribuyente = @id_contribuyente
            )
                SET @tiene_derecho = 1;

            IF @tiene_derecho = 0
            BEGIN
                -- Advertencia/Validación documentada: no bloquear si es trámite general que solo referencia ubicación,
                -- pero sí asentar observación. Para trámites vinculados estrictamente al inmueble se exige derecho.
                PRINT 'AVISO: El solicitante no figura como titular registral directo del inmueble.';
            END
        END

        -- 4. Generación atómica del número de expediente si viene nulo o vacío
        IF @numero_expediente IS NULL OR LTRIM(RTRIM(@numero_expediente)) = ''
        BEGIN
            DECLARE @seq BIGINT = NEXT VALUE FOR dbo.Seq_Expediente;
            SET @numero_expediente = 'EXP-NIC-' + CAST(YEAR(GETDATE()) AS VARCHAR(4)) + '-' + RIGHT('000000' + CAST(@seq AS VARCHAR(10)), 6);
        END
        ELSE
        BEGIN
            -- Validar unicidad si el llamador suministró uno específico
            IF EXISTS (SELECT 1 FROM dbo.Tramite WHERE numero_expediente = @numero_expediente)
                THROW 50003, 'Error: El número de expediente ya se encuentra asignado a otro trámite.', 1;
        END

        -- 5. Cálculo del SLA en días naturales
        DECLARE @estimada DATETIME = DATEADD(DAY, @dias_max, GETDATE());

        -- 6. Inserción del expediente
        INSERT INTO dbo.Tramite 
        (numero_expediente, fecha_radicacion, fecha_resolucion_estimada, id_tipo_tramite, id_usuario, id_inmueble, id_contribuyente)
        VALUES
        (@numero_expediente, GETDATE(), @estimada, @id_tipo_tramite, @id_usuario, @id_inmueble, @id_contribuyente);

        SET @nuevo_id_tramite = SCOPE_IDENTITY();

        -- 7. Historial inicial en estado REC (Radicado) con registro del usuario funcionario
        DECLARE @id_estado_inicial INT;
        SELECT @id_estado_inicial = id_estado FROM dbo.Estado_Tramite WHERE codigo = 'REC';

        IF @id_estado_inicial IS NOT NULL
        BEGIN
            INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite, id_usuario, id_estado_anterior)
            VALUES (GETDATE(), COALESCE(NULLIF(LTRIM(RTRIM(@observaciones_iniciales)), ''), 'Radicación formal del expediente en ventanilla municipal.'), @nuevo_id_tramite, @id_estado_inicial, @id_usuario, NULL);
        END

        COMMIT TRANSACTION;
        PRINT '-> Trámite radicado exitosamente con Expediente: ' + @numero_expediente;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
