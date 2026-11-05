using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Services.genericResponse;
using Services.RespaldosDbaService.Dto;

namespace Services.RespaldosDbaService;

public partial class SvRespaldosDba
{
    private const string BaseRestauracion = "MunicipalidadNicoya2026";

    public async Task<BaseResponse<object>> RestaurarAsync(RestaurarRespaldoDto dto)
    {
        if (dto.ConfirmacionBase != BaseRestauracion)
            throw new InvalidOperationException("Escriba el nombre exacto de la base para confirmar su reemplazo.");
        // La conexión administrativa nunca debe usar la base que se va a reemplazar.
        var cadena = Environment.GetEnvironmentVariable("SIGEMUN_RESTORE_CONNECTION_STRING")
            ?? _context.Database.GetConnectionString();
        var builder = new SqlConnectionStringBuilder(cadena)
        { InitialCatalog = "master", Pooling = false, ConnectRetryCount = 0 };
        await using var conexion = new SqlConnection(builder.ConnectionString);
        await conexion.OpenAsync();

        async Task Ejecutar(string sql, string? ruta = null)
        {
            await using var cmd = new SqlCommand(sql, conexion) { CommandTimeout = 900 };
            if (ruta is not null) cmd.Parameters.Add("@ruta", SqlDbType.NVarChar, 255).Value = ruta;
            await cmd.ExecuteNonQueryAsync();
        }
        async Task<DataRow> Cabecera(string ruta, int tipo)
        {
            if (string.IsNullOrWhiteSpace(ruta))
                throw new InvalidOperationException("Indique el archivo FULL guardado en el servidor SQL.");
            await using var cmd = new SqlCommand("RESTORE HEADERONLY FROM DISK = @ruta;", conexion)
            { CommandTimeout = 900 };
            cmd.Parameters.Add("@ruta", SqlDbType.NVarChar, 255).Value = ruta;
            await using var reader = await cmd.ExecuteReaderAsync();
            var tabla = new DataTable(); tabla.Load(reader);
            // Un único conjunto evita recuperar silenciosamente una versión distinta de la elegida.
            if (tabla.Rows.Count != 1)
                throw new InvalidOperationException("Seleccione un archivo con un solo conjunto de respaldo.");
            var fila = tabla.Rows[0];
            if (Convert.ToString(fila["DatabaseName"]) != BaseRestauracion ||
                Convert.ToInt32(fila["BackupType"]) != tipo)
                throw new InvalidOperationException(tipo == 1
                    ? "El archivo debe ser un respaldo FULL de MunicipalidadNicoya2026."
                    : "El segundo archivo debe ser un respaldo DIFERENCIAL de MunicipalidadNicoya2026.");
            return fila;
        }

        // Bloqueo por instancia: dos procesos de la API no pueden restaurar simultáneamente.
        await Ejecutar("""
            DECLARE @resultado int;
            EXEC @resultado = sys.sp_getapplock @Resource=N'SIGEMUN_RESTAURAR_MUNICIPAL',
                @LockMode='Exclusive', @LockOwner='Session', @LockTimeout=0;
            IF @resultado < 0 THROW 50001, N'Ya hay una restauración en curso.', 1;
            """);
        var full = await Cabecera(dto.RutaBackupFull.Trim(), 1);
        var diferencial = dto.RutaBackupDiferencial?.Trim();
        if (!string.IsNullOrEmpty(diferencial))
        {
            var diff = await Cabecera(diferencial, 5);
            if (Convert.ToDecimal(diff["DatabaseBackupLSN"]) != Convert.ToDecimal(full["CheckpointLSN"]) ||
                !Equals(diff["FamilyGUID"], full["FamilyGUID"]))
                throw new InvalidOperationException("El diferencial no corresponde al FULL seleccionado.");
        }
        await Ejecutar("RESTORE VERIFYONLY FROM DISK = @ruta WITH FILE=1, CHECKSUM;", dto.RutaBackupFull.Trim());
        if (!string.IsNullOrEmpty(diferencial))
            await Ejecutar("RESTORE VERIFYONLY FROM DISK = @ruta WITH FILE=1, CHECKSUM;", diferencial);

        // Validaciones anteriores no cambian la base. A partir de aquí se reemplazan sus datos.
        bool accesoExclusivo = false;
        Exception? fallo = null;
        try
        {
            await Ejecutar("ALTER DATABASE [MunicipalidadNicoya2026] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;");
            accesoExclusivo = true;
            await Ejecutar(string.IsNullOrEmpty(diferencial)
                ? "RESTORE DATABASE [MunicipalidadNicoya2026] FROM DISK=@ruta WITH FILE=1, REPLACE, RECOVERY, CHECKSUM;"
                : "RESTORE DATABASE [MunicipalidadNicoya2026] FROM DISK=@ruta WITH FILE=1, REPLACE, NORECOVERY, CHECKSUM;",
                dto.RutaBackupFull.Trim());
            if (!string.IsNullOrEmpty(diferencial))
                await Ejecutar("RESTORE DATABASE [MunicipalidadNicoya2026] FROM DISK=@ruta WITH FILE=1, RECOVERY, CHECKSUM;", diferencial);
        }
        catch (Exception ex) { fallo = ex; }
        finally
        {
            if (accesoExclusivo)
            {
                try { await Ejecutar("ALTER DATABASE [MunicipalidadNicoya2026] SET MULTI_USER WITH ROLLBACK IMMEDIATE;"); }
                catch (Exception ex)
                {
                    fallo = new InvalidOperationException(
                        "La recuperación no quedó disponible. Revise el estado de MunicipalidadNicoya2026 en SSMS. " +
                        (fallo?.Message ?? "") + " " + ex.Message, fallo ?? ex);
                }
            }
            // Descarta conexiones de EF invalidadas por el reemplazo de la base.
            SqlConnection.ClearAllPools();
        }
        if (fallo is not null)
            throw new InvalidOperationException("No se completó la restauración. " + fallo.Message, fallo);
        await Ejecutar("""
            IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name=N'MunicipalidadNicoya2026'
                AND state_desc='ONLINE' AND user_access_desc='MULTI_USER')
                THROW 50001, N'La base no quedó en línea y multiusuario.', 1;
            """);
        return Respuesta.Ok("Restauración completada: MunicipalidadNicoya2026 recuperó los datos del respaldo. Inicie sesión nuevamente.");
    }
}
