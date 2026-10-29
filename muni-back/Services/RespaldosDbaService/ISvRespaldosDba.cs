using Entities.SpResults;
using Entities.Views;
using Services.genericResponse;
using Services.RespaldosDbaService.Dto;

namespace Services.RespaldosDbaService
{
    public interface ISvRespaldosDba
    {
        Task<BaseResponse<List<VwEstadoRespaldo>>> ObtenerEstadoRespaldosAsync();
        Task<BaseResponse<List<SpFrecuenciaResultDto>>> ConsultarFrecuenciasAsync();
        Task<BaseResponse<List<SpTipoRespaldoResultDto>>> ConsultarTiposRespaldoAsync();
        Task<BaseResponse<List<SpConfiguracionRespaldoResultDto>>> ConsultarConfiguracionesAsync();
        Task<BaseResponse<int>> RegistrarConfiguracionAsync(RegistrarConfiguracionRespaldoDto dto);
        Task<BaseResponse<object>> ActualizarConfiguracionAsync(int idRespaldosConfig, ActualizarConfiguracionRespaldoDto dto);
        Task<BaseResponse<List<SpHistorialRespaldosResultDto>>> ConsultarHistorialAsync(DateTime? fechaInicio, DateTime? fechaFin);
        Task<BaseResponse<object>> EjecutarBackupFullAsync(EjecutarBackupDto dto);
        Task<BaseResponse<object>> EjecutarBackupDiferencialAsync(EjecutarBackupDto dto);
        Task<BaseResponse<object>> VerificarIntegridadAsync();
        Task<BaseResponse<object>> SimularRestauracionAsync(SimularRestauracionDto dto, int idUsuarioDba);
    }
}
