using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.CatalogosInmuebleService;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Analista}")]
    public class CatalogosInmuebleController : ControllerBase
    {
        private readonly ISvCatalogosInmueble _svCatalogos;

        public CatalogosInmuebleController(ISvCatalogosInmueble svCatalogos) => _svCatalogos = svCatalogos;

        /// <summary>sp_consultar_distritos.</summary>
        [HttpGet("distritos")]
        public async Task<IActionResult> Distritos() => Ok(await _svCatalogos.ConsultarDistritosAsync());

        /// <summary>sp_consultar_tipos_uso_inmueble.</summary>
        [HttpGet("tipos-uso")]
        public async Task<IActionResult> TiposUso() => Ok(await _svCatalogos.ConsultarTiposUsoAsync());
    }
}
