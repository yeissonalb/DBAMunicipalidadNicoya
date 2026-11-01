using Entities.SpResults;
using Services.genericResponse;

namespace Services.CatalogosInmuebleService
{
    public interface ISvCatalogosInmueble
    {
        Task<BaseResponse<List<SpDistritoResultDto>>> ConsultarDistritosAsync();
        Task<BaseResponse<List<SpTipoUsoInmuebleResultDto>>> ConsultarTiposUsoAsync();
    }
}
