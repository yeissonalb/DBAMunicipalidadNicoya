using Entities.SpResults;
using Entities.Views;
using Services.AuditoriaService.Dto;
using Services.genericResponse;

namespace Services.AuditoriaService
{
    public interface ISvAuditoria
    {
        Task<BaseResponse<List<VwAuditoriaDetallada>>> ObtenerAuditoriaDetalladaAsync();
        Task<BaseResponse<object>> RegistrarTipoAccionAsync(RegistrarTipoAccionAuditoriaDto dto);
        Task<BaseResponse<object>> RegistrarAuditoriaAsync(RegistrarAuditoriaDto dto, int idUsuario, string direccionIp);
        Task<BaseResponse<List<SpConsultarAuditoriaResultDto>>> ConsultarAuditoriaAsync();
        Task<BaseResponse<List<SpFiltrarAuditoriaResultDto>>> FiltrarAuditoriaAsync(string? tablaAfectada, int? idUsuario, DateTime? fechaInicio, DateTime? fechaFin);
        Task<BaseResponse<List<SpConsultarAuditoriaResultDto>>> ConsultarAuditoriaRegistroAsync(string tablaAfectada, string idRegistroAfectado);
    }
}
