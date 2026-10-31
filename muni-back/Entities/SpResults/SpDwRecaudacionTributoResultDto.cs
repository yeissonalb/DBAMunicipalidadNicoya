using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dw_recaudacion_tributo.</summary>
    public class SpDwRecaudacionTributoResultDto
    {
        [Column("codigo_tributo")]
        public string? CodigoTributo { get; set; }

        [Column("nombre_tributo")]
        public string? NombreTributo { get; set; }

        [Column("categoria_tributo")]
        public string? CategoriaTributo { get; set; }

        [Column("periodicidad")]
        public string? Periodicidad { get; set; }

        [Column("total_principal")]
        public decimal? TotalPrincipal { get; set; }

        [Column("total_intereses")]
        public decimal? TotalIntereses { get; set; }

        [Column("total_recaudado")]
        public decimal? TotalRecaudado { get; set; }
    }
}
