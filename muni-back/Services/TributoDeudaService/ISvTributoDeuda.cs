using Entities.SpResults;
using Entities.Views;
using Services.genericResponse;
using Services.TributoDeudaService.Dto;

namespace Services.TributoDeudaService
{
    public interface ISvTributoDeuda
    {
        Task<BaseResponse<List<VwFacturasPendiente>>> ObtenerFacturasPendientesAsync();
        Task<BaseResponse<List<SpTiposTributoResultDto>>> ConsultarTiposTributoAsync();
        Task<BaseResponse<int>> RegistrarDeudaAsync(RegistrarDeudaMunicipalDto dto);
        Task<BaseResponse<List<SpDeudasContribuyenteResultDto>>> ConsultarDeudasContribuyenteAsync(int idContribuyente);
        Task<BaseResponse<object>> ActualizarEstadoDeudaAsync(int idDeudaMunicipal, ActualizarEstadoDeudaDto dto);
        Task<BaseResponse<object>> CalcularRecargosInteresesAsync(int idDeudaMunicipal, CalcularRecargosDto dto);
    }
}
