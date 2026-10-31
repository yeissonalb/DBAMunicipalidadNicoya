using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.ContribuyenteService;
using Services.ContribuyenteService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Los roles se definen por acción: varios [Authorize] se combinan con AND, por eso la clase
    // solo exige un usuario autenticado y cada método declara quién puede usarlo.
    [Authorize]
    public class ContribuyenteController : ControllerBase
    {
        private const string Lectura = $"{Roles.Admin},{Roles.Cajero},{Roles.Analista}";
        private const string Escritura = $"{Roles.Admin},{Roles.Cajero}";

        private readonly ISvContribuyente _svContribuyente;

        public ContribuyenteController(ISvContribuyente svContribuyente) => _svContribuyente = svContribuyente;

        /// <summary>Padrón completo (vw_padron_contribuyentes). El Analista también consulta (radicación de trámites).</summary>
        [HttpGet]
        [Authorize(Roles = Lectura)]
        public async Task<IActionResult> Padron() => Ok(await _svContribuyente.ObtenerPadronAsync());

        /// <summary>sp_consultar_contribuyente: busca por cédula, nombre/razón social o correo.</summary>
        [HttpGet("buscar")]
        [Authorize(Roles = Lectura)]
        public async Task<IActionResult> Buscar([FromQuery] string? criterio)
            => Ok(await _svContribuyente.ConsultarAsync(criterio));

        /// <summary>sp_registrar_contribuyente_fisico.</summary>
        [HttpPost("fisico")]
        [Authorize(Roles = Escritura)]
        public async Task<IActionResult> RegistrarFisico([FromBody] RegistrarContribuyenteFisicoDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svContribuyente.RegistrarFisicoAsync(dto));

        /// <summary>sp_registrar_contribuyente_juridico.</summary>
        [HttpPost("juridico")]
        [Authorize(Roles = Escritura)]
        public async Task<IActionResult> RegistrarJuridico([FromBody] RegistrarContribuyenteJuridicoDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svContribuyente.RegistrarJuridicoAsync(dto));

        /// <summary>sp_actualizar_contribuyente.</summary>
        [HttpPut("{idContribuyente:int}")]
        [Authorize(Roles = Escritura)]
        public async Task<IActionResult> Actualizar(int idContribuyente, [FromBody] ActualizarContribuyenteDto dto)
            => Ok(await _svContribuyente.ActualizarAsync(idContribuyente, dto));

        /// <summary>sp_registrar_representante_legal. idContribuyente es el id del padrón (debe ser persona jurídica).</summary>
        [HttpPost("{idContribuyente:int}/representante-legal")]
        [Authorize(Roles = Escritura)]
        public async Task<IActionResult> RegistrarRepresentanteLegal(int idContribuyente, [FromBody] RegistrarRepresentanteLegalDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svContribuyente.RegistrarRepresentanteLegalAsync(idContribuyente, dto));
    }
}
