using Entities.SpResults;
using Services.genericResponse;
using Services.UsuarioService.Dto;

namespace Services.UsuarioService
{
    public interface ISvUsuario
    {
        Task<BaseResponse<int>> RegistrarAsync(RegistrarUsuarioDto dto);
        Task<BaseResponse<List<SpConsultarUsuarioResultDto>>> ConsultarAsync(string? userName);
        Task<BaseResponse<object>> ActualizarAsync(int idUsuario, ActualizarUsuarioDto dto);
        Task<BaseResponse<object>> CambiarEstadoAsync(int idUsuario, bool activo);
    }
}
