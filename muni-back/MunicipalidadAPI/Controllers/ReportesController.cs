using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.genericResponse;
using Services.ReportesService;
using Services.ReportesService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.Auditor},{Roles.Admin}")]
    public class ReportesController : ControllerBase
    {
        private readonly ISvReportes _svReportes;

        public ReportesController(ISvReportes svReportes) => _svReportes = svReportes;

        // ---------- Vistas ----------

        /// <summary>vw_morosidad_contribuyentes.</summary>
        [HttpGet("morosidad")]
        public async Task<IActionResult> Morosidad() => Ok(await _svReportes.ObtenerMorosidadAsync());

        /// <summary>vw_recaudacion_por_tributo (acumulado histórico).</summary>
        [HttpGet("recaudacion-tributo")]
        public async Task<IActionResult> RecaudacionPorTributo() => Ok(await _svReportes.ObtenerRecaudacionPorTributoAsync());

        /// <summary>vw_recaudacion_por_distrito (acumulado histórico).</summary>
        [HttpGet("recaudacion-distrito")]
        public async Task<IActionResult> RecaudacionPorDistrito() => Ok(await _svReportes.ObtenerRecaudacionPorDistritoAsync());

        // ---------- Procedimientos ----------

        /// <summary>sp_reporte_historial_tramites_contribuyente.</summary>
        [HttpGet("historial-tramites/{idContribuyente:int}")]
        public async Task<IActionResult> HistorialTramites(int idContribuyente)
            => Ok(await _svReportes.HistorialTramitesContribuyenteAsync(idContribuyente));

        /// <summary>sp_reporte_recaudacion_tributo (rango de fechas opcional).</summary>
        [HttpGet("recaudacion-tributo/periodo")]
        public async Task<IActionResult> RecaudacionTributoPeriodo([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
            => Ok(await _svReportes.RecaudacionTributoAsync(fechaInicio, fechaFin));

        /// <summary>sp_reporte_recaudacion_distrito (rango de fechas opcional).</summary>
        [HttpGet("recaudacion-distrito/periodo")]
        public async Task<IActionResult> RecaudacionDistritoPeriodo([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
            => Ok(await _svReportes.RecaudacionDistritoAsync(fechaInicio, fechaFin));

        /// <summary>sp_reporte_contribuyentes_morosos.</summary>
        [HttpGet("contribuyentes-morosos")]
        public async Task<IActionResult> ContribuyentesMorosos() => Ok(await _svReportes.ContribuyentesMorososAsync());

        /// <summary>sp_reporte_solicitudes_departamento.</summary>
        [HttpGet("solicitudes-departamento")]
        public async Task<IActionResult> SolicitudesDepartamento() => Ok(await _svReportes.SolicitudesDepartamentoAsync());

        /// <summary>sp_reporte_eficiencia_tramites.</summary>
        [HttpGet("eficiencia-tramites")]
        public async Task<IActionResult> EficienciaTramites() => Ok(await _svReportes.EficienciaTramitesAsync());

        /// <summary>sp_reporte_gestion_municipal. tipoReporte: PADRON, INMUEBLES, MOROSOS o AUDITORIA.</summary>
        [HttpGet("gestion-municipal")]
        public async Task<IActionResult> GestionMunicipal([FromQuery] string tipoReporte, [FromQuery] string? filtroTexto)
        {
            var tipo = tipoReporte?.Trim().ToUpperInvariant();
            if (string.IsNullOrEmpty(tipo) || !TiposReporteGestion.Todos.Contains(tipo))
            {
                return BadRequest(new BaseResponse<object>
                {
                    Success = false,
                    Message = $"tipoReporte inválido. Valores permitidos: {string.Join(", ", TiposReporteGestion.Todos)}."
                });
            }

            return Ok(await _svReportes.GestionMunicipalAsync(tipo, filtroTexto));
        }
    }
}
