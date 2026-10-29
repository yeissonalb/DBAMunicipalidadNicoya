using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_reporte_recaudacion_distrito.</summary>
    public class SpReporteRecaudacionDistritoResultDto
    {
        [Column("codigo_distrital")]
        public string? CodigoDistrital { get; set; }

        [Column("nombre_distrito")]
        public string? NombreDistrito { get; set; }

        [Column("pagos_recibidos")]
        public int PagosRecibidos { get; set; }

        [Column("recaudado_principal")]
        public double? RecaudadoPrincipal { get; set; }

        [Column("recaudado_intereses")]
        public double? RecaudadoIntereses { get; set; }

        [Column("recaudado_recargos")]
        public double? RecaudadoRecargos { get; set; }

        [Column("total_distrito")]
        public double? TotalDistrito { get; set; }
    }
}
