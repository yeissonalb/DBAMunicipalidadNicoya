using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.TributoDeudaService;
using Services.TributoDeudaService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.Cajero},{Roles.Admin}")]
    public class TributoDeudaController : ControllerBase
    {
        private readonly ISvTributoDeuda _svTributoDeuda;

        public TributoDeudaController(ISvTributoDeuda svTributoDeuda) => _svTributoDeuda = svTributoDeuda;

        /// <summary>sp_consultar_tipos_tributo.</summary>
        [HttpGet("tipos-tributo")]
        public async Task<IActionResult> TiposTributo() => Ok(await _svTributoDeuda.ConsultarTiposTributoAsync());

        /// <summary>Facturas con saldo pendiente (vw_facturas_pendientes).</summary>
        [HttpGet("facturas-pendientes")]
        public async Task<IActionResult> FacturasPendientes() => Ok(await _svTributoDeuda.ObtenerFacturasPendientesAsync());

        /// <summary>sp_registrar_deuda_municipal.</summary>
        [HttpPost("deuda")]
        public async Task<IActionResult> RegistrarDeuda([FromBody] RegistrarDeudaMunicipalDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svTributoDeuda.RegistrarDeudaAsync(dto));

        /// <summary>sp_consultar_deudas_contribuyente.</summary>
        [HttpGet("contribuyente/{idContribuyente:int}/deudas")]
        public async Task<IActionResult> DeudasContribuyente(int idContribuyente)
            => Ok(await _svTributoDeuda.ConsultarDeudasContribuyenteAsync(idContribuyente));

        /// <summary>sp_actualizar_estado_deuda (PEND, PAG, VENC, ARR).</summary>
        [HttpPatch("deuda/{idDeudaMunicipal:int}/estado")]
        public async Task<IActionResult> ActualizarEstado(int idDeudaMunicipal, [FromBody] ActualizarEstadoDeudaDto dto)
            => Ok(await _svTributoDeuda.ActualizarEstadoDeudaAsync(idDeudaMunicipal, dto));

        /// <summary>sp_calcular_recargos_intereses (el cálculo lo hace la BD).</summary>
        [HttpPost("deuda/{idDeudaMunicipal:int}/recalcular")]
        public async Task<IActionResult> Recalcular(int idDeudaMunicipal, [FromBody] CalcularRecargosDto? dto)
            => Ok(await _svTributoDeuda.CalcularRecargosInteresesAsync(idDeudaMunicipal, dto ?? new CalcularRecargosDto()));
    }
}
