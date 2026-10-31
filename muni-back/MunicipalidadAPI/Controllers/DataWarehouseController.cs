using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.DataWarehouseService;

namespace MunicipalidadAPI.Controllers
{
    /// <summary>
    /// Data Warehouse MunicipalidadNicoyaDataMart2026 (CU-DW-01..05). Consultas para Auditor, Admin y DBA;
    /// la ejecución bajo demanda del ETL solo para Admin y DBA. 404 (50034) si el DW no está instalado.
    /// </summary>
    [ApiController]
    [Route("api/datawarehouse")]
    [Authorize]
    public class DataWarehouseController : ControllerBase
    {
        private const string Consulta = $"{Roles.Admin},{Roles.Auditor},{Roles.Dba}";
        private const string Ejecucion = $"{Roles.Admin},{Roles.Dba}";

        private readonly ISvDataWarehouse _svDw;

        public DataWarehouseController(ISvDataWarehouse svDw) => _svDw = svDw;

        /// <summary>sp_dw_estado: instalación, última carga y filas por tabla de hechos.</summary>
        [HttpGet("estado")]
        [Authorize(Roles = Consulta)]
        public async Task<IActionResult> Estado() => Ok(await _svDw.EstadoAsync());

        /// <summary>sp_dw_ejecutar_etl: carga completa + conciliación (CU-DW-04 / CU-DW-05).</summary>
        [HttpPost("etl")]
        [Authorize(Roles = Ejecucion)]
        public async Task<IActionResult> EjecutarEtl() => Ok(await _svDw.EjecutarEtlAsync(AuthHelpers.GetIdUsuario(User)));

        /// <summary>sp_dw_historial_cargas: bitácora Control_Cargas_ETL.</summary>
        [HttpGet("historial-cargas")]
        [Authorize(Roles = Consulta)]
        public async Task<IActionResult> Historial() => Ok(await _svDw.HistorialCargasAsync());

        [HttpGet("recaudacion-periodo")]
        [Authorize(Roles = Consulta)]
        public async Task<IActionResult> RecaudacionPeriodo() => Ok(await _svDw.RecaudacionPeriodoAsync());

        [HttpGet("recaudacion-tributo")]
        [Authorize(Roles = Consulta)]
        public async Task<IActionResult> RecaudacionTributo() => Ok(await _svDw.RecaudacionTributoAsync());

        [HttpGet("recaudacion-ubicacion")]
        [Authorize(Roles = Consulta)]
        public async Task<IActionResult> RecaudacionUbicacion() => Ok(await _svDw.RecaudacionUbicacionAsync());

        [HttpGet("morosidad")]
        [Authorize(Roles = Consulta)]
        public async Task<IActionResult> Morosidad() => Ok(await _svDw.MorosidadAsync());

        [HttpGet("eficiencia-tramites")]
        [Authorize(Roles = Consulta)]
        public async Task<IActionResult> EficienciaTramites() => Ok(await _svDw.EficienciaTramitesAsync());

        [HttpGet("indicadores-departamento")]
        [Authorize(Roles = Consulta)]
        public async Task<IActionResult> IndicadoresDepartamento() => Ok(await _svDw.IndicadoresDepartamentoAsync());
    }
}
