using Entities.SpResults;
using Entities.Views;
using Services.genericResponse;
using Services.TramiteService.Dto;

namespace Services.TramiteService
{
    public interface ISvTramite
    {
        Task<BaseResponse<List<VwTramitesSeguimiento>>> ObtenerSeguimientoAsync();
        Task<BaseResponse<List<VwHistorialTramitesDetallado>>> ObtenerHistorialDetalladoAsync();
        Task<BaseResponse<int>> RegistrarAsync(RegistrarTramiteDto dto, int idUsuario);
        Task<BaseResponse<List<SpConsultarTramiteResultDto>>> ConsultarAsync(string? numeroExpediente, int? idContribuyente);
        Task<BaseResponse<object>> ActualizarAsync(int idTramite, ActualizarTramiteDto dto, int idUsuarioSesion);

        /// <summary>Guarda el archivo en disco y registra sus metadatos con dbo.sp_registrar_requisito_presentado.</summary>
        Task<BaseResponse<ArchivoAdjuntadoDto>> RegistrarRequisitoPresentadoAsync(int idTramite, int idRequisito, ArchivoEntrada archivo, string webRootPath);

        /// <summary>Guarda el archivo en disco y registra sus metadatos con dbo.sp_adjuntar_archivo_tramite.</summary>
        Task<BaseResponse<ArchivoAdjuntadoDto>> AdjuntarArchivoAsync(int idTramite, int? idRequisito, ArchivoEntrada archivo, string webRootPath);

        Task<BaseResponse<List<SpArchivoTramiteResultDto>>> ConsultarArchivosAsync(int idTramite);
        Task<BaseResponse<List<SpRequisitoTramiteEstadoResultDto>>> ConsultarRequisitosEstadoAsync(int idTramite);
        Task<BaseResponse<object>> CambiarEstadoAsync(int idTramite, CambiarEstadoTramiteDto dto);
        Task<BaseResponse<List<SpEstadosTramiteResultDto>>> ConsultarEstadosAsync();
        Task<BaseResponse<List<SpHistorialTramiteResultDto>>> ConsultarHistorialAsync(int idTramite);
        Task<BaseResponse<object>> RegistrarResolucionAsync(int idTramite, ResolucionTramiteDto dto);
        Task<BaseResponse<List<SpTramitesPorContribuyenteResultDto>>> ConsultarPorContribuyenteAsync(int idContribuyente);
    }
}
