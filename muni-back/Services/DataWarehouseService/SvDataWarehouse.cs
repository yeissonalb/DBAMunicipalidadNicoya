using Entities.SpResults;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;

namespace Services.DataWarehouseService
{
    /// <summary>
    /// Data Warehouse (CU-DW-01..05). Los SP viven en MunicipalidadNicoya2026 y consultan
    /// MunicipalidadNicoyaDataMart2026; si el DW no está instalado responden THROW 50034 (404).
    /// </summary>
    public class SvDataWarehouse : ISvDataWarehouse
    {
        private static readonly TimeSpan TimeoutEtl = TimeSpan.FromMinutes(15);

        private readonly MunicipalidadContext _context;

        public SvDataWarehouse(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<SpDwEstadoResultDto?>> EstadoAsync()
        {
            var data = await _context.Database.QuerySpAsync<SpDwEstadoResultDto>("dbo.sp_dw_estado");
            return Respuesta.Ok(data.FirstOrDefault());
        }

        public async Task<BaseResponse<List<SpDwValidacionEtlResultDto>>> EjecutarEtlAsync(int idUsuario)
        {
            var anterior = _context.Database.GetCommandTimeout();
            _context.Database.SetCommandTimeout(TimeoutEtl);
            try
            {
                var data = await _context.Database.QuerySpAsync<SpDwValidacionEtlResultDto>(
                    "dbo.sp_dw_ejecutar_etl",
                    Sp.Int("@id_usuario", idUsuario));

                var cuadra = data.All(v => v.Resultado != null && v.Resultado.StartsWith("CORRECTO", StringComparison.OrdinalIgnoreCase));
                return Respuesta.Ok(data, cuadra
                    ? "Carga ETL concluida: todas las validaciones cuadran."
                    : "Carga ETL concluida con diferencias en la conciliación. Revise el detalle.");
            }
            finally
            {
                _context.Database.SetCommandTimeout(anterior);
            }
        }

        public async Task<BaseResponse<List<SpDwHistorialCargaResultDto>>> HistorialCargasAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDwHistorialCargaResultDto>("dbo.sp_dw_historial_cargas"));

        public async Task<BaseResponse<List<SpDwRecaudacionPeriodoResultDto>>> RecaudacionPeriodoAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDwRecaudacionPeriodoResultDto>("dbo.sp_dw_recaudacion_periodo"));

        public async Task<BaseResponse<List<SpDwRecaudacionTributoResultDto>>> RecaudacionTributoAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDwRecaudacionTributoResultDto>("dbo.sp_dw_recaudacion_tributo"));

        public async Task<BaseResponse<List<SpDwRecaudacionUbicacionResultDto>>> RecaudacionUbicacionAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDwRecaudacionUbicacionResultDto>("dbo.sp_dw_recaudacion_ubicacion"));

        public async Task<BaseResponse<List<SpDwMorosidadResultDto>>> MorosidadAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDwMorosidadResultDto>("dbo.sp_dw_morosidad"));

        public async Task<BaseResponse<List<SpDwEficienciaTramitesResultDto>>> EficienciaTramitesAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDwEficienciaTramitesResultDto>("dbo.sp_dw_eficiencia_tramites"));

        public async Task<BaseResponse<List<SpDwIndicadoresDepartamentoResultDto>>> IndicadoresDepartamentoAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDwIndicadoresDepartamentoResultDto>("dbo.sp_dw_indicadores_departamento"));
    }
}
