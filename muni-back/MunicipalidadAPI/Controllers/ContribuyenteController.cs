using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.Auth;
using Services.Auth.Dto;
using Services.ContribuyenteService;
using Services.ContribuyenteService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContribuyenteController : ControllerBase
    {
        // Solo personal institucional autorizado puede consultar el padrón o registrar contribuyentes
        private const string PersonalMunicipal = $"{Roles.Admin},{Roles.Cajero},{Roles.Analista}";

        private readonly ISvContribuyente _svContribuyente;
        private readonly ISvAuth _svAuth;

        public ContribuyenteController(ISvContribuyente svContribuyente, ISvAuth svAuth)
        {
            _svContribuyente = svContribuyente;
            _svAuth = svAuth;
        }

        /// <summary>Padrón completo (vw_padron_contribuyentes). Reservado a funcionarios.</summary>
        [HttpGet]
        [Authorize(Roles = PersonalMunicipal)]
        public async Task<IActionResult> Padron() => Ok(await _svContribuyente.ObtenerPadronAsync());

        /// <summary>sp_consultar_contribuyente: busca por cédula, nombre/razón social o correo.</summary>
        [HttpGet("buscar")]
        [Authorize(Roles = PersonalMunicipal)]
        public async Task<IActionResult> Buscar([FromQuery] string? criterio)
            => Ok(await _svContribuyente.ConsultarAsync(criterio));

        /// <summary>sp_registrar_contribuyente_fisico (CU-01).</summary>
        [HttpPost("fisico")]
        [Authorize(Roles = PersonalMunicipal)]
        public async Task<IActionResult> RegistrarFisico([FromBody] RegistrarContribuyenteFisicoDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svContribuyente.RegistrarFisicoAsync(dto));

        /// <summary>sp_registrar_contribuyente_juridico (CU-01).</summary>
        [HttpPost("juridico")]
        [Authorize(Roles = PersonalMunicipal)]
        public async Task<IActionResult> RegistrarJuridico([FromBody] RegistrarContribuyenteJuridicoDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svContribuyente.RegistrarJuridicoAsync(dto));

        /// <summary>sp_actualizar_contribuyente.</summary>
        [HttpPut("{idContribuyente:int}")]
        [Authorize(Roles = PersonalMunicipal)]
        public async Task<IActionResult> Actualizar(int idContribuyente, [FromBody] ActualizarContribuyenteDto dto)
            => Ok(await _svContribuyente.ActualizarAsync(idContribuyente, dto));

        /// <summary>sp_registrar_representante_legal. idContribuyente es el id del padrón (debe ser persona jurídica).</summary>
        [HttpPost("{idContribuyente:int}/representante-legal")]
        [Authorize(Roles = PersonalMunicipal)]
        public async Task<IActionResult> RegistrarRepresentanteLegal(int idContribuyente, [FromBody] RegistrarRepresentanteLegalDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svContribuyente.RegistrarRepresentanteLegalAsync(idContribuyente, dto));

        /// <summary>Genera un código de activación asistida para que el ciudadano active su cuenta en el portal.</summary>
        [HttpPost("{idContribuyente:int}/codigo-activacion")]
        [Authorize(Roles = $"{Roles.Admin},{Roles.Analista}")]
        public async Task<IActionResult> GenerarCodigoActivacion(int idContribuyente, [FromBody] GenerarCodigoActivacionDto dto)
        {
            dto.IdContribuyente = idContribuyente;
            return Ok(await _svAuth.GenerarCodigoActivacionAsync(dto, AuthHelpers.GetIdUsuario(User)));
        }

        /// <summary>Consulta si el contribuyente cuenta con cuenta ciudadana activa en el portal.</summary>
        [HttpGet("{idContribuyente:int}/cuenta-activa")]
        [Authorize(Roles = PersonalMunicipal)]
        public async Task<IActionResult> ConsultarCuentaActiva(int idContribuyente)
            => Ok(await _svAuth.ConsultarEstadoCuentaCiudadanaAsync(idContribuyente));
    }
}
