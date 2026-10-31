using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.CatalogosGeneralesService;

namespace MunicipalidadAPI.Controllers
{
    /// <summary>Catálogos compartidos por varios módulos (cualquier funcionario autenticado; no el portal ciudadano).</summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CatalogosGeneralesController : ControllerBase
    {
        private readonly ISvCatalogosGenerales _svCatalogos;

        public CatalogosGeneralesController(ISvCatalogosGenerales svCatalogos) => _svCatalogos = svCatalogos;

        /// <summary>sp_consultar_departamentos (script 14).</summary>
        [HttpGet("departamentos")]
        public async Task<IActionResult> Departamentos()
        {
            if (User.IsInRole(Roles.Ciudadano)) return Forbid();
            return Ok(await _svCatalogos.ConsultarDepartamentosAsync());
        }
    }
}
