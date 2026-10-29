using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_reporte_recaudacion_tributo.</summary>
    public class SpReporteRecaudacionTributoResultDto
    {
        [Column("codigo_tributo")]
        public string? CodigoTributo { get; set; }

        [Column("nombre_tributo")]
        public string? NombreTributo { get; set; }

        [Column("recibos_emitidos")]
        public int RecibosEmitidos { get; set; }

        [Column("subtotal_principal")]
        public double? SubtotalPrincipal { get; set; }

        [Column("subtotal_intereses")]
        public double? SubtotalIntereses { get; set; }

        [Column("subtotal_recargos")]
        public double? SubtotalRecargos { get; set; }

        [Column("gran_total_recaudado")]
        public double? GranTotalRecaudado { get; set; }
    }
}
