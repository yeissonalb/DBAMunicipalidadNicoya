using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dw_indicadores_departamento.</summary>
    public class SpDwIndicadoresDepartamentoResultDto
    {
        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }

        [Column("volumen_total_gestionado")]
        public int? VolumenTotalGestionado { get; set; }

        [Column("promedio_dias_resolucion_area")]
        public int? PromedioDiasResolucionArea { get; set; }

        [Column("tramites_aprobados")]
        public int? TramitesAprobados { get; set; }

        [Column("tramites_rechazados")]
        public int? TramitesRechazados { get; set; }
    }
}
