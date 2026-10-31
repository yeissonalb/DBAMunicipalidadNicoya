using Entities.SpResults;
using Services.genericResponse;
using Services.MonitoreoDbaService.Dto;

namespace Services.MonitoreoDbaService
{
    public interface ISvMonitoreoDba
    {
        Task<BaseResponse<SpDbaMonitorResumenResultDto?>> ResumenAsync();
        Task<BaseResponse<List<SpDbaMonitorSesionResultDto>>> SesionesAsync(int umbralSegundos);
        Task<BaseResponse<List<SpDbaMonitorArchivoResultDto>>> ArchivosAsync();
        Task<BaseResponse<List<SpDbaFragmentacionResultDto>>> FragmentacionAsync();
        Task<BaseResponse<object>> TerminarSesionAsync(int sessionId);
        Task<BaseResponse<List<SpDbaMantenimientoResultDto>>> EjecutarMantenimientoAsync(EjecutarMantenimientoDto dto);
        Task<BaseResponse<List<SpDbaHistorialMantenimientoResultDto>>> HistorialMantenimientoAsync();
    }
}
