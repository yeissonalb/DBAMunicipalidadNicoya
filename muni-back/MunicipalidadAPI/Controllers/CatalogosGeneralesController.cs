using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.CatalogosGeneralesService;

namespace MunicipalidadAPI.Controllers
{
    /// <summary>Catálogos compartidos por varios módulos (cualquier usuario autenticado).</summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CatalogosGeneralesController : ControllerBase
    {
        private readonly ISvCatalogosGenerales _svCatalogos;

        public CatalogosGeneralesController(ISvCatalogosGenerales svCatalogos) => _svCatalogos = svCatalogos;

        /// <summary>sp_consultar_departamentos (script 14).</summary>
        [HttpGet("departamentos")]
        public async Task<IActionResult> Departamentos() => Ok(await _svCatalogos.ConsultarDepartamentosAsync());
    }
}
