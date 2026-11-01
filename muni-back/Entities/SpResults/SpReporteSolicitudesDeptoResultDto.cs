using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_reporte_solicitudes_departamento.</summary>
    public class SpReporteSolicitudesDeptoResultDto
    {
        [Column("codigo_interno")]
        public string? CodigoInterno { get; set; }

        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }

        [Column("total_solicitudes_recibidas")]
        public int TotalSolicitudesRecibidas { get; set; }

        [Column("total_resueltas")]
        public int? TotalResueltas { get; set; }

        [Column("total_en_tramite")]
        public int? TotalEnTramite { get; set; }
    }
}
