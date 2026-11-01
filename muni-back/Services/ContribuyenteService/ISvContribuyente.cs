using Entities.SpResults;
using Entities.Views;
using Services.ContribuyenteService.Dto;
using Services.genericResponse;

namespace Services.ContribuyenteService
{
    public interface ISvContribuyente
    {
        Task<BaseResponse<List<VwPadronContribuyente>>> ObtenerPadronAsync();
        Task<BaseResponse<int>> RegistrarFisicoAsync(RegistrarContribuyenteFisicoDto dto);
        Task<BaseResponse<int>> RegistrarJuridicoAsync(RegistrarContribuyenteJuridicoDto dto);
        Task<BaseResponse<List<SpConsultarContribuyenteResultDto>>> ConsultarAsync(string? criterio);
        Task<BaseResponse<object>> ActualizarAsync(int idContribuyente, ActualizarContribuyenteDto dto);
        Task<BaseResponse<object>> RegistrarRepresentanteLegalAsync(int idContribuyente, RegistrarRepresentanteLegalDto dto);
    }
}
