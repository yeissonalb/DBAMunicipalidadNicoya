using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_tipos_tributo.</summary>
    public class SpTiposTributoResultDto
    {
        [Column("id_tipo_tributo")]
        public int IdTipoTributo { get; set; }

        [Column("codigo_tributo")]
        public string? CodigoTributo { get; set; }

        [Column("nombre_tributo")]
        public string? NombreTributo { get; set; }

        [Column("base_calculo")]
        public string? BaseCalculo { get; set; }

        [Column("tarifa")]
        public double? Tarifa { get; set; }

        [Column("monto_fijo")]
        public double? MontoFijo { get; set; }

        [Column("periodicidad")]
        public string? Periodicidad { get; set; }
    }
}
