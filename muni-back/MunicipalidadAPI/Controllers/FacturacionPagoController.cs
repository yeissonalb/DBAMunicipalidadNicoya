using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.FacturacionPagoService;
using Services.FacturacionPagoService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Cajero}")]
    public class FacturacionPagoController : ControllerBase
    {
        private readonly ISvFacturacionPago _svFacturacionPago;

        public FacturacionPagoController(ISvFacturacionPago svFacturacionPago) => _svFacturacionPago = svFacturacionPago;

        /// <summary>Estado de cuenta consolidado de todos los contribuyentes (vw_estado_cuenta_contribuyente).</summary>
        [HttpGet("estado-cuenta")]
        public async Task<IActionResult> EstadoCuentaGeneral() => Ok(await _svFacturacionPago.ObtenerEstadoCuentaGeneralAsync());

        /// <summary>sp_consultar_estado_cuenta.</summary>
        [HttpGet("contribuyente/{idContribuyente:int}/estado-cuenta")]
        public async Task<IActionResult> EstadoCuenta(int idContribuyente)
            => Ok(await _svFacturacionPago.ConsultarEstadoCuentaAsync(idContribuyente));

        /// <summary>sp_generar_factura (subtotal y total los calcula la BD).</summary>
        [HttpPost("factura")]
        public async Task<IActionResult> GenerarFactura([FromBody] GenerarFacturaDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svFacturacionPago.GenerarFacturaAsync(dto));

        /// <summary>sp_consultar_factura (por clave de Hacienda y/o id).</summary>
        [HttpGet("factura")]
        public async Task<IActionResult> ConsultarFactura([FromQuery] string? claveNumericaHacienda, [FromQuery] int? idFactura)
            => Ok(await _svFacturacionPago.ConsultarFacturaAsync(claveNumericaHacienda, idFactura));

        /// <summary>sp_consultar_facturas_contribuyente.</summary>
        [HttpGet("contribuyente/{idContribuyente:int}/facturas")]
        public async Task<IActionResult> FacturasContribuyente(int idContribuyente)
            => Ok(await _svFacturacionPago.ConsultarFacturasContribuyenteAsync(idContribuyente));

        /// <summary>sp_consultar_medios_pago.</summary>
        [HttpGet("medios-pago")]
        public async Task<IActionResult> MediosPago() => Ok(await _svFacturacionPago.ConsultarMediosPagoAsync());

        /// <summary>sp_registrar_pago_municipal.</summary>
        [HttpPost("pago")]
        public async Task<IActionResult> RegistrarPago([FromBody] RegistrarPagoMunicipalDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svFacturacionPago.RegistrarPagoAsync(dto));

        /// <summary>sp_aplicar_pago_factura (el trigger de la BD recalcula saldo y estado).</summary>
        [HttpPost("pago/{idPagoMunicipal:int}/aplicar")]
        public async Task<IActionResult> AplicarPago(int idPagoMunicipal, [FromBody] AplicarPagoFacturaDto dto)
            => Ok(await _svFacturacionPago.AplicarPagoFacturaAsync(idPagoMunicipal, dto));
    }
}
