using Entities.SpResults;
using Entities.Views;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;
using Services.ReportesService.Dto;

namespace Services.ReportesService
{
    public class SvReportes : ISvReportes
    {
        private readonly MunicipalidadContext _context;

        public SvReportes(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<VwMorosidadContribuyente>>> ObtenerMorosidadAsync()
            => Respuesta.Ok(await _context.VwMorosidadContribuyentes.ToListAsync());

        public async Task<BaseResponse<List<VwRecaudacionPorTributo>>> ObtenerRecaudacionPorTributoAsync()
            => Respuesta.Ok(await _context.VwRecaudacionPorTributo.ToListAsync());

        public async Task<BaseResponse<List<VwRecaudacionPorDistrito>>> ObtenerRecaudacionPorDistritoAsync()
            => Respuesta.Ok(await _context.VwRecaudacionPorDistrito.ToListAsync());

        public async Task<BaseResponse<List<SpReporteHistorialTramitesResultDto>>> HistorialTramitesContribuyenteAsync(int idContribuyente)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpReporteHistorialTramitesResultDto>(
                "dbo.sp_reporte_historial_tramites_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente)));

        public async Task<BaseResponse<List<SpReporteRecaudacionTributoResultDto>>> RecaudacionTributoAsync(DateTime? fechaInicio, DateTime? fechaFin)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpReporteRecaudacionTributoResultDto>(
                "dbo.sp_reporte_recaudacion_tributo",
                Sp.DateTime("@fecha_inicio", fechaInicio),
                Sp.DateTime("@fecha_fin", fechaFin)));

        public async Task<BaseResponse<List<SpReporteRecaudacionDistritoResultDto>>> RecaudacionDistritoAsync(DateTime? fechaInicio, DateTime? fechaFin)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpReporteRecaudacionDistritoResultDto>(
                "dbo.sp_reporte_recaudacion_distrito",
                Sp.DateTime("@fecha_inicio", fechaInicio),
                Sp.DateTime("@fecha_fin", fechaFin)));

        // En la BD real este SP no recibe parámetros (la especificación mencionaba @dias_mora_minimos).
        public async Task<BaseResponse<List<SpReporteContribuyentesMorososResultDto>>> ContribuyentesMorososAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpReporteContribuyentesMorososResultDto>(
                "dbo.sp_reporte_contribuyentes_morosos"));

        // En la BD real este SP no recibe parámetros (la especificación mencionaba @fecha_inicio/@fecha_fin).
        public async Task<BaseResponse<List<SpReporteSolicitudesDeptoResultDto>>> SolicitudesDepartamentoAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpReporteSolicitudesDeptoResultDto>(
                "dbo.sp_reporte_solicitudes_departamento"));

        // En la BD real este SP no recibe parámetros (la especificación mencionaba @fecha_inicio/@fecha_fin).
        public async Task<BaseResponse<List<SpReporteEficienciaResultDto>>> EficienciaTramitesAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpReporteEficienciaResultDto>(
                "dbo.sp_reporte_eficiencia_tramites"));

        /// <summary>
        /// dbo.sp_reporte_gestion_municipal(@tipo_reporte, @filtro_texto) delega en otros SPs y su
        /// recordset cambia según el tipo, así que se materializa con el DTO correspondiente.
        /// El tipo ya viene validado por el controlador (un tipo desconocido no devuelve recordset).
        /// </summary>
        public async Task<BaseResponse<SpReporteGestionMunicipalResultDto>> GestionMunicipalAsync(string tipoReporte, string? filtroTexto)
        {
            var tipo = tipoReporte.Trim().ToUpperInvariant();

            SqlParameter[] Parametros() => new[]
            {
                Sp.VarChar("@tipo_reporte", tipo, 50),
                Sp.VarChar("@filtro_texto", filtroTexto, 100)
            };

            const string sp = "dbo.sp_reporte_gestion_municipal";

            IEnumerable<object> registros = tipo switch
            {
                TiposReporteGestion.Padron => await _context.Database.QuerySpAsync<SpConsultarContribuyenteResultDto>(sp, Parametros()),
                TiposReporteGestion.Inmuebles => await _context.Database.QuerySpAsync<SpConsultarInmuebleResultDto>(sp, Parametros()),
                TiposReporteGestion.Morosos => await _context.Database.QuerySpAsync<SpReporteContribuyentesMorososResultDto>(sp, Parametros()),
                TiposReporteGestion.Auditoria => await _context.Database.QuerySpAsync<SpConsultarAuditoriaResultDto>(sp, Parametros()),
                _ => throw new ArgumentException($"Tipo de reporte no soportado: {tipoReporte}", nameof(tipoReporte))
            };

            var lista = registros.ToList();
            return Respuesta.Ok(new SpReporteGestionMunicipalResultDto
            {
                TipoReporte = tipo,
                FiltroTexto = filtroTexto,
                TotalRegistros = lista.Count,
                Registros = lista
            });
        }
    }
}
