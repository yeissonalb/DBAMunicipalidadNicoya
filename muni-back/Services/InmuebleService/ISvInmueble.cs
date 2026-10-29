using Entities.SpResults;
using Entities.Views;
using Services.genericResponse;
using Services.InmuebleService.Dto;

namespace Services.InmuebleService
{
    public interface ISvInmueble
    {
        Task<BaseResponse<List<VwInmueblesPropietario>>> ObtenerInmueblesPropietariosAsync();
        Task<BaseResponse<int>> RegistrarAsync(RegistrarInmuebleDto dto);
        Task<BaseResponse<List<SpConsultarInmuebleResultDto>>> ConsultarAsync(string? numeroFinca, int? idDistrito);
        Task<BaseResponse<object>> ActualizarAsync(int idInmueble, ActualizarInmuebleDto dto);
        Task<BaseResponse<object>> AsignarDerechoAsync(int idInmueble, AsignarDerechoInmuebleDto dto);
        Task<BaseResponse<List<SpInmueblesPorContribuyenteResultDto>>> ConsultarPorContribuyenteAsync(int idContribuyente);
    }
}
