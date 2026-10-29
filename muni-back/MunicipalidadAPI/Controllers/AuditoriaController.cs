using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.AuditoriaService;
using Services.AuditoriaService.Dto;
using Services.genericResponse;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Auditor},{Roles.Dba}")]
    public class AuditoriaController : ControllerBase
    {
        private readonly ISvAuditoria _svAuditoria;

        public AuditoriaController(ISvAuditoria svAuditoria) => _svAuditoria = svAuditoria;

        /// <summary>Bitácora completa (vw_auditoria_detallada).</summary>
        [HttpGet]
        public async Task<IActionResult> Detallada() => Ok(await _svAuditoria.ObtenerAuditoriaDetalladaAsync());

        /// <summary>sp_consultar_auditoria (últimos 500 registros).</summary>
        [HttpGet("recientes")]
        public async Task<IActionResult> Recientes() => Ok(await _svAuditoria.ConsultarAuditoriaAsync());

        /// <summary>sp_filtrar_auditoria (todos los filtros son opcionales).</summary>
        [HttpGet("filtrar")]
        public async Task<IActionResult> Filtrar(
            [FromQuery] string? tablaAfectada, [FromQuery] int? idUsuario,
            [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
            => Ok(await _svAuditoria.FiltrarAuditoriaAsync(tablaAfectada, idUsuario, fechaInicio, fechaFin));

        /// <summary>sp_consultar_auditoria_registro: historial de un registro puntual.</summary>
        [HttpGet("registro")]
        public async Task<IActionResult> Registro([FromQuery] string tablaAfectada, [FromQuery] string idRegistroAfectado)
        {
            if (string.IsNullOrWhiteSpace(tablaAfectada) || string.IsNullOrWhiteSpace(idRegistroAfectado))
                return BadRequest(new BaseResponse<object> { Success = false, Message = "tablaAfectada e idRegistroAfectado son requeridos." });

            return Ok(await _svAuditoria.ConsultarAuditoriaRegistroAsync(tablaAfectada, idRegistroAfectado));
        }

        /// <summary>sp_registrar_tipo_accion_auditoria.</summary>
        [HttpPost("tipo-accion")]
        public async Task<IActionResult> RegistrarTipoAccion([FromBody] RegistrarTipoAccionAuditoriaDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svAuditoria.RegistrarTipoAccionAsync(dto));

        /// <summary>sp_registrar_auditoria. @id_usuario sale del JWT y @direccion_ip de la conexión.</summary>
        [HttpPost]
        public async Task<IActionResult> Registrar([FromBody] RegistrarAuditoriaDto dto)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "0.0.0.0";
            return StatusCode(StatusCodes.Status201Created,
                await _svAuditoria.RegistrarAuditoriaAsync(dto, AuthHelpers.GetIdUsuario(User), ip));
        }
    }
}
