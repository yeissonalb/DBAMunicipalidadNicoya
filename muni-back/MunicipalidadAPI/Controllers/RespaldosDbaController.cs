using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.RespaldosDbaService;
using Services.RespaldosDbaService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Dba}")]
    public class RespaldosDbaController : ControllerBase
    {
        private readonly ISvRespaldosDba _svRespaldos;

        public RespaldosDbaController(ISvRespaldosDba svRespaldos) => _svRespaldos = svRespaldos;

        /// <summary>Monitor de respaldos (vw_estado_respaldos).</summary>
        [HttpGet("estado")]
        public async Task<IActionResult> Estado() => Ok(await _svRespaldos.ObtenerEstadoRespaldosAsync());

        /// <summary>sp_consultar_frecuencias (script 14).</summary>
        [HttpGet("frecuencias")]
        public async Task<IActionResult> Frecuencias() => Ok(await _svRespaldos.ConsultarFrecuenciasAsync());

        /// <summary>sp_consultar_tipos_respaldo (script 14).</summary>
        [HttpGet("tipos-respaldo")]
        public async Task<IActionResult> TiposRespaldo() => Ok(await _svRespaldos.ConsultarTiposRespaldoAsync());

        /// <summary>sp_consultar_configuraciones_respaldo: incluye el id para el PUT (script 14).</summary>
        [HttpGet("configuraciones")]
        public async Task<IActionResult> Configuraciones() => Ok(await _svRespaldos.ConsultarConfiguracionesAsync());

        /// <summary>sp_consultar_historial_respaldos (rango de fechas opcional).</summary>
        [HttpGet("historial")]
        public async Task<IActionResult> Historial([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
            => Ok(await _svRespaldos.ConsultarHistorialAsync(fechaInicio, fechaFin));

        /// <summary>sp_registrar_configuracion_respaldo.</summary>
        [HttpPost("configuracion")]
        public async Task<IActionResult> RegistrarConfiguracion([FromBody] RegistrarConfiguracionRespaldoDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svRespaldos.RegistrarConfiguracionAsync(dto));

        /// <summary>sp_actualizar_configuracion_respaldo.</summary>
        [HttpPut("configuracion/{idRespaldosConfig:int}")]
        public async Task<IActionResult> ActualizarConfiguracion(int idRespaldosConfig, [FromBody] ActualizarConfiguracionRespaldoDto dto)
            => Ok(await _svRespaldos.ActualizarConfiguracionAsync(idRespaldosConfig, dto));

        /// <summary>sp_dba_ejecutar_backup_full (la carpeta es del servidor SQL, no de la API).</summary>
        [HttpPost("backup-full")]
        public async Task<IActionResult> BackupFull([FromBody] EjecutarBackupDto? dto)
            => Ok(await _svRespaldos.EjecutarBackupFullAsync(dto ?? new EjecutarBackupDto()));

        /// <summary>sp_dba_ejecutar_backup_diferencial.</summary>
        [HttpPost("backup-diferencial")]
        public async Task<IActionResult> BackupDiferencial([FromBody] EjecutarBackupDto? dto)
            => Ok(await _svRespaldos.EjecutarBackupDiferencialAsync(dto ?? new EjecutarBackupDto()));

        /// <summary>sp_dba_verificar_integridad_dbcc.</summary>
        [HttpPost("verificar-integridad")]
        public async Task<IActionResult> VerificarIntegridad() => Ok(await _svRespaldos.VerificarIntegridadAsync());

        /// <summary>sp_dba_simular_restauracion_contingencia. @id_usuario_dba sale del JWT.</summary>
        [HttpPost("simular-restauracion")]
        public async Task<IActionResult> SimularRestauracion([FromBody] SimularRestauracionDto dto)
            => Ok(await _svRespaldos.SimularRestauracionAsync(dto, AuthHelpers.GetIdUsuario(User)));
    }
}
