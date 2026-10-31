using Entities.SpResults;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.genericResponse;
using Services.MonitoreoDbaService.Dto;
using Services.MyDbContext;

namespace Services.MonitoreoDbaService
{
    /// <summary>Telemetría (CU-DBA-04) y mantenimiento (CU-DBA-06). La lógica vive en dbo.sp_dba_*.</summary>
    public class SvMonitoreoDba : ISvMonitoreoDba
    {
        private static readonly TimeSpan TimeoutMantenimiento = TimeSpan.FromMinutes(30);

        private readonly MunicipalidadContext _context;

        public SvMonitoreoDba(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<SpDbaMonitorResumenResultDto?>> ResumenAsync()
        {
            var data = await _context.Database.QuerySpAsync<SpDbaMonitorResumenResultDto>("dbo.sp_dba_monitor_resumen");
            return Respuesta.Ok(data.FirstOrDefault());
        }

        public async Task<BaseResponse<List<SpDbaMonitorSesionResultDto>>> SesionesAsync(int umbralSegundos)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDbaMonitorSesionResultDto>(
                "dbo.sp_dba_monitor_sesiones",
                Sp.Int("@umbral_segundos", umbralSegundos)));

        public async Task<BaseResponse<List<SpDbaMonitorArchivoResultDto>>> ArchivosAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDbaMonitorArchivoResultDto>("dbo.sp_dba_monitor_archivos"));

        public async Task<BaseResponse<List<SpDbaFragmentacionResultDto>>> FragmentacionAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDbaFragmentacionResultDto>("dbo.sp_dba_monitor_fragmentacion"));

        public async Task<BaseResponse<object>> TerminarSesionAsync(int sessionId)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_dba_terminar_sesion",
                Sp.Int("@session_id", sessionId));

            return Respuesta.Ok($"Sesión {sessionId} terminada.");
        }

        public async Task<BaseResponse<List<SpDbaMantenimientoResultDto>>> EjecutarMantenimientoAsync(EjecutarMantenimientoDto dto)
        {
            var anterior = _context.Database.GetCommandTimeout();
            _context.Database.SetCommandTimeout(TimeoutMantenimiento);
            try
            {
                var data = await _context.Database.QuerySpAsync<SpDbaMantenimientoResultDto>(
                    "dbo.sp_dba_ejecutar_mantenimiento",
                    Sp.Bit("@optimizar_indices", dto.OptimizarIndices),
                    Sp.Bit("@actualizar_estadisticas", dto.ActualizarEstadisticas),
                    Sp.Bit("@purgar_respaldos", dto.PurgarRespaldos));

                var fallidas = data.Count(t => string.Equals(t.Estado, "Fallido", StringComparison.OrdinalIgnoreCase));
                return Respuesta.Ok(data, fallidas == 0
                    ? "Plan de mantenimiento completado."
                    : $"Plan de mantenimiento finalizado con {fallidas} tarea(s) fallida(s).");
            }
            finally
            {
                _context.Database.SetCommandTimeout(anterior);
            }
        }

        public async Task<BaseResponse<List<SpDbaHistorialMantenimientoResultDto>>> HistorialMantenimientoAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDbaHistorialMantenimientoResultDto>("dbo.sp_dba_historial_mantenimiento"));
    }
}
