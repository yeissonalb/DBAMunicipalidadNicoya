using Entities.SpResults;
using Services.genericResponse;

namespace Services.DataWarehouseService
{
    public interface ISvDataWarehouse
    {
        Task<BaseResponse<SpDwEstadoResultDto?>> EstadoAsync();
        Task<BaseResponse<List<SpDwValidacionEtlResultDto>>> EjecutarEtlAsync(int idUsuario);
        Task<BaseResponse<List<SpDwHistorialCargaResultDto>>> HistorialCargasAsync();
        Task<BaseResponse<List<SpDwRecaudacionPeriodoResultDto>>> RecaudacionPeriodoAsync();
        Task<BaseResponse<List<SpDwRecaudacionTributoResultDto>>> RecaudacionTributoAsync();
        Task<BaseResponse<List<SpDwRecaudacionUbicacionResultDto>>> RecaudacionUbicacionAsync();
        Task<BaseResponse<List<SpDwMorosidadResultDto>>> MorosidadAsync();
        Task<BaseResponse<List<SpDwEficienciaTramitesResultDto>>> EficienciaTramitesAsync();
        Task<BaseResponse<List<SpDwIndicadoresDepartamentoResultDto>>> IndicadoresDepartamentoAsync();
    }
}
