using Entities.SpResults;
using Services.genericResponse;

namespace Services.CatalogosGeneralesService
{
    public interface ISvCatalogosGenerales
    {
        Task<BaseResponse<List<SpDepartamentoResultDto>>> ConsultarDepartamentosAsync();
    }
}
