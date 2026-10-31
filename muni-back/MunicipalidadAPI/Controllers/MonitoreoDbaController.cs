using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.MonitoreoDbaService;
using Services.MonitoreoDbaService.Dto;

namespace MunicipalidadAPI.Controllers
{
    /// <summary>Monitoreo (CU-DBA-04) y mantenimiento (CU-DBA-06) de la base de datos.</summary>
    [ApiController]
    [Route("api/monitoreodba")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Dba}")]
    public class MonitoreoDbaController : ControllerBase
    {
        private readonly ISvMonitoreoDba _svMonitoreo;

        public MonitoreoDbaController(ISvMonitoreoDba svMonitoreo) => _svMonitoreo = svMonitoreo;

        /// <summary>sp_dba_monitor_resumen: CPU, memoria, conexiones, bloqueos, espacio y últimos backups.</summary>
        [HttpGet("resumen")]
        public async Task<IActionResult> Resumen() => Ok(await _svMonitoreo.ResumenAsync());

        /// <summary>sp_dba_monitor_sesiones: conexiones activas, consultas lentas y bloqueos.</summary>
        [HttpGet("sesiones")]
        public async Task<IActionResult> Sesiones([FromQuery] int umbralSegundos = 5)
            => Ok(await _svMonitoreo.SesionesAsync(umbralSegundos < 1 ? 1 : umbralSegundos));

        /// <summary>sp_dba_monitor_archivos: archivos de datos/log y espacio libre en los volúmenes.</summary>
        [HttpGet("archivos")]
        public async Task<IActionResult> Archivos() => Ok(await _svMonitoreo.ArchivosAsync());

        /// <summary>sp_dba_monitor_fragmentacion: fragmentación de índices y acción recomendada.</summary>
        [HttpGet("fragmentacion")]
        public async Task<IActionResult> Fragmentacion() => Ok(await _svMonitoreo.FragmentacionAsync());

        /// <summary>sp_dba_terminar_sesion: termina la sesión que causa un bloqueo.</summary>
        [HttpPost("sesiones/{sessionId:int}/terminar")]
        public async Task<IActionResult> TerminarSesion(int sessionId) => Ok(await _svMonitoreo.TerminarSesionAsync(sessionId));

        /// <summary>sp_dba_ejecutar_mantenimiento: índices, estadísticas y purga de respaldos.</summary>
        [HttpPost("mantenimiento")]
        public async Task<IActionResult> Mantenimiento([FromBody] EjecutarMantenimientoDto? dto)
            => Ok(await _svMonitoreo.EjecutarMantenimientoAsync(dto ?? new EjecutarMantenimientoDto()));

        /// <summary>sp_dba_historial_mantenimiento: bitácora MaintenanceDB.dbo.CommandLog.</summary>
        [HttpGet("mantenimiento/historial")]
        public async Task<IActionResult> HistorialMantenimiento() => Ok(await _svMonitoreo.HistorialMantenimientoAsync());
    }
}
