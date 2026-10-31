using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dw_morosidad.</summary>
    public class SpDwMorosidadResultDto
    {
        [Column("anio")]
        public int? Anio { get; set; }

        [Column("mes")]
        public int? Mes { get; set; }

        [Column("nombre_mes")]
        public string? NombreMes { get; set; }

        [Column("distrito")]
        public string? Distrito { get; set; }

        [Column("zona_rural_urbana")]
        public string? ZonaRuralUrbana { get; set; }

        [Column("nombre_tributo")]
        public string? NombreTributo { get; set; }

        [Column("saldo_vencido")]
        public decimal? SaldoVencido { get; set; }

        [Column("cantidad_contribuyentes_morosos")]
        public int? CantidadContribuyentesMorosos { get; set; }
    }
}
