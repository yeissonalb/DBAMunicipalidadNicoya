using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dw_recaudacion_periodo.</summary>
    public class SpDwRecaudacionPeriodoResultDto
    {
        [Column("anio")]
        public int? Anio { get; set; }

        [Column("trimestre")]
        public int? Trimestre { get; set; }

        [Column("mes")]
        public int? Mes { get; set; }

        [Column("nombre_mes")]
        public string? NombreMes { get; set; }

        [Column("total_recaudado_principal")]
        public decimal? TotalRecaudadoPrincipal { get; set; }

        [Column("total_recaudado_intereses")]
        public decimal? TotalRecaudadoIntereses { get; set; }

        [Column("total_descuentos_aplicados")]
        public decimal? TotalDescuentosAplicados { get; set; }

        [Column("total_recaudado_general")]
        public decimal? TotalRecaudadoGeneral { get; set; }

        [Column("transacciones_registradas")]
        public int? TransaccionesRegistradas { get; set; }
    }
}
