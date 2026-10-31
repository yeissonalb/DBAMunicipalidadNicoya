using Entities.SpResults;
using Services.genericResponse;
using Services.PortalCiudadanoService.Dto;
using Services.TramiteService.Dto;

namespace Services.PortalCiudadanoService
{
    /// <summary>
    /// Consultas y operaciones del portal ciudadano. Todas reciben el id_contribuyente tomado del
    /// JWT (nunca del cliente), y la BD valida que el recurso pertenezca a ese contribuyente.
    /// </summary>
    public interface ISvPortalCiudadano
    {
        Task<BaseResponse<List<SpTramitesPorContribuyenteResultDto>>> MisTramitesAsync(int idContribuyente);
        Task<BaseResponse<List<SpHistorialTramiteResultDto>>> HistorialTramiteAsync(int idContribuyente, int idTramite);
        Task<BaseResponse<List<SpRequisitoTramiteEstadoResultDto>>> RequisitosTramiteAsync(int idContribuyente, int idTramite);
        Task<BaseResponse<List<SpArchivoTramiteResultDto>>> ArchivosTramiteAsync(int idContribuyente, int idTramite);
        Task<BaseResponse<ArchivoAdjuntadoDto>> AdjuntarRequisitoAsync(int idContribuyente, int idTramite, int idRequisito, ArchivoEntrada archivo, string webRootPath);
        Task<BaseResponse<List<SpInmueblesPorContribuyenteResultDto>>> MisInmueblesAsync(int idContribuyente);
        Task<BaseResponse<List<SpEstadoCuentaResultDto>>> EstadoCuentaAsync(int idContribuyente);
        Task<BaseResponse<List<SpFacturasContribuyenteResultDto>>> MisFacturasAsync(int idContribuyente);
        Task<BaseResponse<int>> PagarFacturaSinpeAsync(int idContribuyente, int idFactura, PagoSinpeDto dto);
    }
}
