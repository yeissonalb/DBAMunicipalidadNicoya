-- Migracion incremental: cotejo de archivos reales. Ejecutar despues de 17.
-- No borra documentos ni modifica revisiones anteriores.
USE MunicipalidadNicoya2026;
GO
IF OBJECT_ID('dbo.Revision_Archivo_Requisito', 'U') IS NULL
BEGIN
 CREATE TABLE dbo.Revision_Archivo_Requisito (
  id_revision INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  id_archivo_adjunto INT NOT NULL REFERENCES dbo.Archivo_Adjunto(id_archivo_adjunto),
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('VALIDADO','SUBSANAR')),
  observacion VARCHAR(255) NOT NULL,
  fecha_revision DATETIME NOT NULL DEFAULT GETDATE(),
  id_usuario INT NOT NULL REFERENCES dbo.Usuario(id_usuario)
 );
 CREATE INDEX IX_RevisionArchivo_Ultima ON dbo.Revision_Archivo_Requisito(id_archivo_adjunto, id_revision DESC);
END;
GO
CREATE OR ALTER PROCEDURE dbo.sp_consultar_cotejo_requisitos @id_tramite INT
AS
BEGIN
 SET NOCOUNT ON;
 IF NOT EXISTS (SELECT 1 FROM dbo.Tramite WHERE id_tramite=@id_tramite)
  THROW 50024, 'El expediente no existe.', 1;
 SELECT r.id_requisito, r.nombre_requisito, r.es_obligatorio,
        a.id_archivo_adjunto, a.nombre_original,
        CAST(CASE WHEN a.id_archivo_adjunto IS NULL THEN 'PENDIENTE'
             ELSE ISNULL(rv.estado, 'PRESENTADO') END AS VARCHAR(20)) AS estado_revision,
        rv.observacion, rv.fecha_revision, u.user_name AS usuario_revisor
 FROM dbo.Tramite t
 INNER JOIN dbo.Tipo_Tramite_Requisito tr ON tr.id_tipo_tramite=t.id_tipo_tramite
 INNER JOIN dbo.Requisito r ON r.id_requisito=tr.id_requisito
 OUTER APPLY (
  SELECT TOP (1) aa.id_archivo_adjunto, aa.nombre_original
  FROM dbo.Archivo_Adjunto aa
  WHERE aa.id_tramite=t.id_tramite AND aa.id_requisito=r.id_requisito
  ORDER BY aa.id_archivo_adjunto DESC
 ) a
 OUTER APPLY (
  SELECT TOP (1) rr.estado, rr.observacion, rr.fecha_revision, rr.id_usuario
  FROM dbo.Revision_Archivo_Requisito rr
  WHERE rr.id_archivo_adjunto=a.id_archivo_adjunto ORDER BY rr.id_revision DESC
 ) rv
 LEFT JOIN dbo.Usuario u ON u.id_usuario=rv.id_usuario
 WHERE t.id_tramite=@id_tramite
 ORDER BY r.es_obligatorio DESC, r.id_requisito;
END;
GO
CREATE OR ALTER PROCEDURE dbo.sp_revisar_archivo_requisito
 @id_tramite INT, @id_archivo_adjunto INT, @estado VARCHAR(20),
 @observacion VARCHAR(255), @id_usuario INT
AS
BEGIN
 SET NOCOUNT ON;
 SET XACT_ABORT ON;
 BEGIN TRY
  IF @estado IS NULL OR @estado NOT IN ('VALIDADO','SUBSANAR')
   THROW 50008, 'Resultado de revision no permitido.', 1;
  IF NULLIF(LTRIM(RTRIM(@observacion)), '') IS NULL
   THROW 50022, 'Debe justificar la revision.', 1;
  IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario=@id_usuario AND activo=1)
   THROW 50070, 'El funcionario no esta activo.', 1;
  BEGIN TRANSACTION;
  DECLARE @tipo INT, @final DATETIME, @req INT;
  SELECT @tipo=id_tipo_tramite, @final=fecha_resolucion_final
  FROM dbo.Tramite WITH (UPDLOCK,HOLDLOCK) WHERE id_tramite=@id_tramite;
  IF @tipo IS NULL THROW 50024, 'El expediente no existe.', 1;
  IF @final IS NOT NULL THROW 50018, 'El expediente esta cerrado.', 1;
  SELECT @req=id_requisito FROM dbo.Archivo_Adjunto
  WHERE id_archivo_adjunto=@id_archivo_adjunto AND id_tramite=@id_tramite;
  IF @req IS NULL OR NOT EXISTS (
   SELECT 1 FROM dbo.Tipo_Tramite_Requisito WHERE id_tipo_tramite=@tipo AND id_requisito=@req
  ) THROW 50024, 'El archivo no corresponde a un requisito del expediente.', 1;
  IF EXISTS (SELECT 1 FROM dbo.Archivo_Adjunto WITH (UPDLOCK,HOLDLOCK)
   WHERE id_tramite=@id_tramite AND id_requisito=@req AND id_archivo_adjunto>@id_archivo_adjunto)
   THROW 50024, 'Existe una version mas reciente. Actualice el cotejo antes de revisar.', 1;
  INSERT dbo.Revision_Archivo_Requisito(id_archivo_adjunto,estado,observacion,id_usuario)
  VALUES(@id_archivo_adjunto,@estado,@observacion,@id_usuario);
  -- La solicitud de correccion queda visible en el historial ciudadano.
  IF @estado='SUBSANAR'
  BEGIN
   DECLARE @nombre VARCHAR(255), @mensaje VARCHAR(255);
   SELECT @nombre=nombre_requisito FROM dbo.Requisito WHERE id_requisito=@req;
   SET @mensaje=LEFT(CONCAT('Corregir ',@nombre,': ',@observacion),255);
   EXEC dbo.sp_cambiar_estado_tramite @id_tramite=@id_tramite,
    @codigo_estado='DOC',@observaciones=@mensaje,@id_usuario=@id_usuario;
  END;
  COMMIT;
 END TRY
 BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO
-- Evita aprobar por la mera presencia de un archivo, incluso desde otra pantalla.
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
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name='rol_analista_tramites')
BEGIN
 GRANT EXECUTE ON dbo.sp_consultar_cotejo_requisitos TO rol_analista_tramites;
 GRANT EXECUTE ON dbo.sp_revisar_archivo_requisito TO rol_analista_tramites;
END;
GO
SELECT name,type_desc FROM sys.objects WHERE name IN
 ('Revision_Archivo_Requisito','sp_consultar_cotejo_requisitos',
  'sp_revisar_archivo_requisito','tr_validar_cotejo_antes_aprobacion');
GO
EXEC dbo.sp_consultar_cotejo_requisitos @id_tramite=8;
GO
