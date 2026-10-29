using Entities.SpResults;
using Entities.Views;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;
using Services.RespaldosDbaService.Dto;

namespace Services.RespaldosDbaService
{
    public class SvRespaldosDba : ISvRespaldosDba
    {
        /// <summary>BACKUP / DBCC pueden tardar más que el timeout por defecto (30 s).</summary>
        private static readonly TimeSpan TimeoutOperacionesDba = TimeSpan.FromMinutes(15);

        private readonly MunicipalidadContext _context;

        public SvRespaldosDba(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<VwEstadoRespaldo>>> ObtenerEstadoRespaldosAsync()
            => Respuesta.Ok(await _context.VwEstadoRespaldos.ToListAsync());

        // Catálogos DBA (script 14)
        public async Task<BaseResponse<List<SpFrecuenciaResultDto>>> ConsultarFrecuenciasAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpFrecuenciaResultDto>("dbo.sp_consultar_frecuencias"));

        public async Task<BaseResponse<List<SpTipoRespaldoResultDto>>> ConsultarTiposRespaldoAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpTipoRespaldoResultDto>("dbo.sp_consultar_tipos_respaldo"));

        public async Task<BaseResponse<List<SpConfiguracionRespaldoResultDto>>> ConsultarConfiguracionesAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpConfiguracionRespaldoResultDto>("dbo.sp_consultar_configuraciones_respaldo"));

        // Este SP sí tiene OUTPUT (@nuevo_id_config) aunque la especificación no lo listaba.
        public async Task<BaseResponse<int>> RegistrarConfiguracionAsync(RegistrarConfiguracionRespaldoDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_configuracion_respaldo",
                Sp.VarChar("@nombre_configuracion", dto.NombreConfiguracion, 255),
                Sp.Time("@hora_ejecucion", dto.HoraEjecucion),
                Sp.VarChar("@origen", dto.Origen, 255),
                Sp.Int("@retencion_dias", dto.RetencionDias),
                Sp.VarChar("@cifrado", dto.Cifrado, 200),
                Sp.VarChar("@ruta_destino", dto.RutaDestino, 255),
                Sp.Int("@id_frecuencia", dto.IdFrecuencia),
                Sp.Int("@id_tipo_de_respaldo", dto.IdTipoDeRespaldo),
                Sp.OutInt("@nuevo_id_config"));

            return Respuesta.Ok(id, "Configuración de respaldo registrada.");
        }

        public async Task<BaseResponse<object>> ActualizarConfiguracionAsync(int idRespaldosConfig, ActualizarConfiguracionRespaldoDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_actualizar_configuracion_respaldo",
                Sp.Int("@id_respaldos_config", idRespaldosConfig),
                Sp.VarChar("@nombre_configuracion", dto.NombreConfiguracion, 255),
                Sp.Time("@hora_ejecucion", dto.HoraEjecucion),
                Sp.Int("@retencion_dias", dto.RetencionDias),
                Sp.VarChar("@ruta_destino", dto.RutaDestino, 255),
                Sp.Bit("@activo", dto.Activo));

            return Respuesta.Ok("Configuración de respaldo actualizada.");
        }

        public async Task<BaseResponse<List<SpHistorialRespaldosResultDto>>> ConsultarHistorialAsync(DateTime? fechaInicio, DateTime? fechaFin)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpHistorialRespaldosResultDto>(
                "dbo.sp_consultar_historial_respaldos",
                Sp.DateTime("@fecha_inicio", fechaInicio),
                Sp.DateTime("@fecha_fin", fechaFin)));

        public async Task<BaseResponse<object>> EjecutarBackupFullAsync(EjecutarBackupDto dto)
        {
            await EjecutarOperacionDbaAsync("dbo.sp_dba_ejecutar_backup_full", ParametrosRuta(dto));
            return Respuesta.Ok("Backup FULL ejecutado y registrado por la base de datos.");
        }

        public async Task<BaseResponse<object>> EjecutarBackupDiferencialAsync(EjecutarBackupDto dto)
        {
            await EjecutarOperacionDbaAsync("dbo.sp_dba_ejecutar_backup_diferencial", ParametrosRuta(dto));
            return Respuesta.Ok("Backup DIFERENCIAL ejecutado y registrado por la base de datos.");
        }

        public async Task<BaseResponse<object>> VerificarIntegridadAsync()
        {
            await EjecutarOperacionDbaAsync("dbo.sp_dba_verificar_integridad_dbcc");
            return Respuesta.Ok("DBCC CHECKDB finalizado sin errores de consistencia.");
        }

        public async Task<BaseResponse<object>> SimularRestauracionAsync(SimularRestauracionDto dto, int idUsuarioDba)
        {
            await EjecutarOperacionDbaAsync(
                "dbo.sp_dba_simular_restauracion_contingencia",
                Sp.VarChar("@ruta_backup_full", dto.RutaBackupFull, 255),
                Sp.Int("@id_usuario_dba", idUsuarioDba));

            return Respuesta.Ok("Simulacro de restauración registrado.");
        }

        /// <summary>Si no se envía ruta, se omite el parámetro para respetar el DEFAULT del SP.</summary>
        private static SqlParameter[] ParametrosRuta(EjecutarBackupDto dto)
            => string.IsNullOrWhiteSpace(dto.RutaCarpeta)
                ? Array.Empty<SqlParameter>()
                : new[] { Sp.VarChar("@ruta_carpeta", dto.RutaCarpeta, 200) };

        private async Task EjecutarOperacionDbaAsync(string procedure, params SqlParameter[] parameters)
        {
            var timeoutAnterior = _context.Database.GetCommandTimeout();
            _context.Database.SetCommandTimeout(TimeoutOperacionesDba);
            try
            {
                await _context.Database.ExecSpAsync(procedure, parameters);
            }
            finally
            {
                _context.Database.SetCommandTimeout(timeoutAnterior);
            }
        }
    }
}
