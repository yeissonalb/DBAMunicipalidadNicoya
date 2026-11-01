using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_reporte_eficiencia_tramites.</summary>
    public class SpReporteEficienciaResultDto
    {
        [Column("nombre_tramite")]
        public string? NombreTramite { get; set; }

        [Column("sla_comprometido")]
        public int SlaComprometido { get; set; }

        [Column("volumen_tramites")]
        public int VolumenTramites { get; set; }

        [Column("promedio_dias_resolucion")]
        public int? PromedioDiasResolucion { get; set; }

        [Column("total_fuera_plazo")]
        public int? TotalFueraPlazo { get; set; }

        [Column("tasa_exito_sla_porcentaje")]
        public decimal? TasaExitoSlaPorcentaje { get; set; }
    }
}
