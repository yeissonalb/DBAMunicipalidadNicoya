-- Protege las asignaciones realizadas mediante el procedimiento.
-- No modifica ni elimina derechos existentes. Ejecutar en SSMS.
USE MunicipalidadNicoya2026;
GO
CREATE OR ALTER PROCEDURE dbo.sp_asignar_derecho_inmueble
    @id_inmueble INT,
    @id_contribuyente INT,
    @porcentaje_participacion FLOAT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        IF @porcentaje_participacion IS NULL
           OR @porcentaje_participacion <= 0
           OR @porcentaje_participacion > 100
            THROW 50013, 'El porcentaje debe ser mayor que cero y no superar 100.', 1;

        BEGIN TRANSACTION;

        -- La fila de la finca actua como bloqueo comun, incluso sin derechos.
        DECLARE @finca INT;
        SELECT @finca = id_inmueble
        FROM dbo.Bien_Inmueble WITH (UPDLOCK, HOLDLOCK)
        WHERE id_inmueble = @id_inmueble;

        IF @finca IS NULL
            THROW 50007, 'El inmueble no existe.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.Contribuyente
            WHERE id_contribuyente = @id_contribuyente
        )
            THROW 50007, 'El contribuyente no existe.', 1;

        IF EXISTS (
            SELECT 1 FROM dbo.Derecho_Inmueble WITH (UPDLOCK, HOLDLOCK)
            WHERE id_inmueble = @id_inmueble
              AND id_contribuyente = @id_contribuyente
        )
            THROW 50007, 'El contribuyente ya tiene un derecho en esta finca. Debe actualizarlo mediante el flujo correspondiente.', 1;

        DECLARE @suma_actual FLOAT;
        SELECT @suma_actual = ISNULL(SUM(porcentaje_participacion), 0)
        FROM dbo.Derecho_Inmueble WITH (UPDLOCK, HOLDLOCK)
        WHERE id_inmueble = @id_inmueble;

        IF @suma_actual + @porcentaje_participacion > 100.0001
            THROW 50007, 'La suma de derechos para el inmueble excede el 100%.', 1;

        INSERT INTO dbo.Derecho_Inmueble
            (id_inmueble, id_contribuyente, porcentaje_participacion, fecha_adquisicion)
        VALUES
            (@id_inmueble, @id_contribuyente, @porcentaje_participacion, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
-- Debe devolver una fila con el procedimiento actualizado.
SELECT name, modify_date
FROM sys.procedures
WHERE object_id = OBJECT_ID('dbo.sp_asignar_derecho_inmueble');
GO
