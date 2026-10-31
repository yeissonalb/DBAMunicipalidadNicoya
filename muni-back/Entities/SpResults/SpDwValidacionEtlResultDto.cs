using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dw_ejecutar_etl.</summary>
    public class SpDwValidacionEtlResultDto
    {
        [Column("id_carga")]
        public int IdCarga { get; set; }

        [Column("control")]
        public string? Control { get; set; }

        [Column("total_oltp")]
        public decimal? TotalOltp { get; set; }

        [Column("total_dw")]
        public decimal? TotalDw { get; set; }

        [Column("resultado")]
        public string? Resultado { get; set; }
    }
}
