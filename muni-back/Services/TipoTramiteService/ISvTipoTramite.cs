using Entities.SpResults;
using Services.genericResponse;
using Services.TipoTramiteService.Dto;

namespace Services.TipoTramiteService
{
    public interface ISvTipoTramite
    {
        Task<BaseResponse<object>> ConfigurarInmuebleAsync(int idTipo, ReglaInmuebleDto dto, int idUsuario);
        Task<BaseResponse<int>> RegistrarTipoTramiteAsync(TipoTramiteDto dto);
        Task<BaseResponse<object>> ActualizarTipoTramiteAsync(int idTipoTramite, TipoTramiteDto dto);
        Task<BaseResponse<List<SpTiposTramiteResultDto>>> ConsultarTiposTramiteAsync();
        Task<BaseResponse<int>> RegistrarRequisitoAsync(RegistrarRequisitoDto dto);
        Task<BaseResponse<List<SpRequisitoResultDto>>> ConsultarRequisitosAsync();
        Task<BaseResponse<object>> ConfigurarRequisitoTramiteAsync(int idTipoTramite, int idRequisito);
        Task<BaseResponse<List<SpRequisitosTramiteResultDto>>> ConsultarRequisitosPorTipoAsync(int idTipoTramite);
    }
}
