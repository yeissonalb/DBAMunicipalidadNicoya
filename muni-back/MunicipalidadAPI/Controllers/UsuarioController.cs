using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.UsuarioService;
using Services.UsuarioService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = Roles.Admin)]
    public class UsuarioController : ControllerBase
    {
        private readonly ISvUsuario _svUsuario;

        public UsuarioController(ISvUsuario svUsuario) => _svUsuario = svUsuario;

        /// <summary>sp_consultar_usuario (filtro opcional por user_name).</summary>
        [HttpGet]
        public async Task<IActionResult> Consultar([FromQuery] string? userName)
            => Ok(await _svUsuario.ConsultarAsync(userName));

        /// <summary>sp_registrar_usuario. La contraseña se envía en texto plano y se guarda como SHA-256.</summary>
        [HttpPost]
        public async Task<IActionResult> Registrar([FromBody] RegistrarUsuarioDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svUsuario.RegistrarAsync(dto));

        /// <summary>sp_actualizar_usuario.</summary>
        [HttpPut("{idUsuario:int}")]
        public async Task<IActionResult> Actualizar(int idUsuario, [FromBody] ActualizarUsuarioDto dto)
            => Ok(await _svUsuario.ActualizarAsync(idUsuario, dto));

        /// <summary>sp_cambiar_estado_usuario.</summary>
        [HttpPatch("{idUsuario:int}/estado")]
        public async Task<IActionResult> CambiarEstado(int idUsuario, [FromBody] CambiarEstadoUsuarioDto dto)
            => Ok(await _svUsuario.CambiarEstadoAsync(idUsuario, dto.Activo!.Value));
    }
}
