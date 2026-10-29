using System.Collections.Generic;

namespace Entities.SpResults
{
    /// <summary>
    /// Envoltura del resultado de dbo.sp_reporte_gestion_municipal.
    /// El SP devuelve un recordset distinto según @tipo_reporte:
    ///   PADRON    -> SpConsultarContribuyenteResultDto
    ///   INMUEBLES -> SpConsultarInmuebleResultDto
    ///   MOROSOS   -> SpReporteContribuyentesMorososResultDto
    ///   AUDITORIA -> SpConsultarAuditoriaResultDto
    /// </summary>
    public class SpReporteGestionMunicipalResultDto
    {
        public string TipoReporte { get; set; } = string.Empty;
        public string? FiltroTexto { get; set; }
        public int TotalRegistros { get; set; }
        public IEnumerable<object> Registros { get; set; } = new List<object>();
    }
}
