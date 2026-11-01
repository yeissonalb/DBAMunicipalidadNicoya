using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.TipoTramiteService;
using Services.TipoTramiteService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Analista}")]
    public class TipoTramiteController : ControllerBase
    {
        private readonly ISvTipoTramite _svTipoTramite;

        public TipoTramiteController(ISvTipoTramite svTipoTramite) => _svTipoTramite = svTipoTramite;

        /// <summary>sp_consultar_tipos_tramite.</summary>
        [HttpGet]
        public async Task<IActionResult> Consultar() => Ok(await _svTipoTramite.ConsultarTiposTramiteAsync());

        /// <summary>sp_registrar_tipo_tramite (devuelve el id generado; 409 si el nombre existe).</summary>
        [HttpPost]
        public async Task<IActionResult> Registrar([FromBody] TipoTramiteDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svTipoTramite.RegistrarTipoTramiteAsync(dto));

        /// <summary>sp_actualizar_tipo_tramite.</summary>
        [HttpPut("{idTipoTramite:int}")]
        public async Task<IActionResult> Actualizar(int idTipoTramite, [FromBody] TipoTramiteDto dto)
            => Ok(await _svTipoTramite.ActualizarTipoTramiteAsync(idTipoTramite, dto));

        /// <summary>sp_consultar_requisitos: catálogo completo (script 14).</summary>
        [HttpGet("requisitos")]
        public async Task<IActionResult> CatalogoRequisitos() => Ok(await _svTipoTramite.ConsultarRequisitosAsync());

        /// <summary>sp_registrar_requisito (devuelve el id generado).</summary>
        [HttpPost("requisito")]
        public async Task<IActionResult> RegistrarRequisito([FromBody] RegistrarRequisitoDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svTipoTramite.RegistrarRequisitoAsync(dto));

        /// <summary>sp_configurar_requisito_tramite.</summary>
        [HttpPost("{idTipoTramite:int}/requisitos/{idRequisito:int}")]
        public async Task<IActionResult> ConfigurarRequisito(int idTipoTramite, int idRequisito)
            => Ok(await _svTipoTramite.ConfigurarRequisitoTramiteAsync(idTipoTramite, idRequisito));

        /// <summary>sp_consultar_requisitos_por_tipo_tramite.</summary>
        [HttpGet("{idTipoTramite:int}/requisitos")]
        public async Task<IActionResult> Requisitos(int idTipoTramite)
            => Ok(await _svTipoTramite.ConsultarRequisitosPorTipoAsync(idTipoTramite));
    }
}
