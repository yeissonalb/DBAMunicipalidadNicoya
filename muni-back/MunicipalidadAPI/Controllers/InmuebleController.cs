using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.InmuebleService;
using Services.InmuebleService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Analista}")]
    public class InmuebleController : ControllerBase
    {
        private readonly ISvInmueble _svInmueble;

        public InmuebleController(ISvInmueble svInmueble) => _svInmueble = svInmueble;

        /// <summary>Inmuebles con propietarios (vw_inmuebles_propietarios).</summary>
        [HttpGet]
        public async Task<IActionResult> ListarConPropietarios() => Ok(await _svInmueble.ObtenerInmueblesPropietariosAsync());

        /// <summary>sp_consultar_inmueble (filtros opcionales).</summary>
        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar([FromQuery] string? numeroFinca, [FromQuery] int? idDistrito)
            => Ok(await _svInmueble.ConsultarAsync(numeroFinca, idDistrito));

        /// <summary>sp_registrar_inmueble.</summary>
        [HttpPost]
        public async Task<IActionResult> Registrar([FromBody] RegistrarInmuebleDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svInmueble.RegistrarAsync(dto));

        /// <summary>sp_actualizar_inmueble.</summary>
        [HttpPut("{idInmueble:int}")]
        public async Task<IActionResult> Actualizar(int idInmueble, [FromBody] ActualizarInmuebleDto dto)
            => Ok(await _svInmueble.ActualizarAsync(idInmueble, dto));

        /// <summary>sp_asignar_derecho_inmueble (copropiedad; la BD valida que no exceda 100%).</summary>
        [HttpPost("{idInmueble:int}/derechos")]
        public async Task<IActionResult> AsignarDerecho(int idInmueble, [FromBody] AsignarDerechoInmuebleDto dto)
            => Ok(await _svInmueble.AsignarDerechoAsync(idInmueble, dto));

        /// <summary>sp_consultar_inmuebles_por_contribuyente.</summary>
        [HttpGet("contribuyente/{idContribuyente:int}")]
        public async Task<IActionResult> PorContribuyente(int idContribuyente)
            => Ok(await _svInmueble.ConsultarPorContribuyenteAsync(idContribuyente));
    }
}
