using Entities.SpResults;
using Entities.Views;
using Services.genericResponse;

namespace Services.ReportesService
{
    public interface ISvReportes
    {
        // Lectura directa de vistas
        Task<BaseResponse<List<VwMorosidadContribuyente>>> ObtenerMorosidadAsync();
        Task<BaseResponse<List<VwRecaudacionPorTributo>>> ObtenerRecaudacionPorTributoAsync();
        Task<BaseResponse<List<VwRecaudacionPorDistrito>>> ObtenerRecaudacionPorDistritoAsync();

        // Reportes por SP (firmas tal como existen en la BD)
        Task<BaseResponse<List<SpReporteHistorialTramitesResultDto>>> HistorialTramitesContribuyenteAsync(int idContribuyente);
        Task<BaseResponse<List<SpReporteRecaudacionTributoResultDto>>> RecaudacionTributoAsync(DateTime? fechaInicio, DateTime? fechaFin);
        Task<BaseResponse<List<SpReporteRecaudacionDistritoResultDto>>> RecaudacionDistritoAsync(DateTime? fechaInicio, DateTime? fechaFin);
        Task<BaseResponse<List<SpReporteContribuyentesMorososResultDto>>> ContribuyentesMorososAsync();
        Task<BaseResponse<List<SpReporteSolicitudesDeptoResultDto>>> SolicitudesDepartamentoAsync();
        Task<BaseResponse<List<SpReporteEficienciaResultDto>>> EficienciaTramitesAsync();
        Task<BaseResponse<SpReporteGestionMunicipalResultDto>> GestionMunicipalAsync(string tipoReporte, string? filtroTexto);
    }
}
