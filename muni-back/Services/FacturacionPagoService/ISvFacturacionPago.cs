using Entities.SpResults;
using Entities.Views;
using Services.FacturacionPagoService.Dto;
using Services.genericResponse;

namespace Services.FacturacionPagoService
{
    public interface ISvFacturacionPago
    {
        Task<BaseResponse<List<VwEstadoCuentaContribuyente>>> ObtenerEstadoCuentaGeneralAsync();
        Task<BaseResponse<int>> GenerarFacturaAsync(GenerarFacturaDto dto);
        Task<BaseResponse<List<SpConsultarFacturaResultDto>>> ConsultarFacturaAsync(string? claveNumericaHacienda, int? idFactura);
        Task<BaseResponse<List<SpFacturasContribuyenteResultDto>>> ConsultarFacturasContribuyenteAsync(int idContribuyente);
        Task<BaseResponse<List<SpMediosPagoResultDto>>> ConsultarMediosPagoAsync();
        Task<BaseResponse<int>> RegistrarPagoAsync(RegistrarPagoMunicipalDto dto);
        Task<BaseResponse<object>> AplicarPagoFacturaAsync(int idPagoMunicipal, AplicarPagoFacturaDto dto);
        Task<BaseResponse<List<SpEstadoCuentaResultDto>>> ConsultarEstadoCuentaAsync(int idContribuyente);
    }
}
