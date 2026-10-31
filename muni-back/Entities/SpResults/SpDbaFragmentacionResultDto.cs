using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dba_monitor_fragmentacion.</summary>
    public class SpDbaFragmentacionResultDto
    {
        [Column("tabla")]
        public string? Tabla { get; set; }

        [Column("indice")]
        public string? Indice { get; set; }

        [Column("tipo_indice")]
        public string? TipoIndice { get; set; }

        [Column("fragmentacion_pct")]
        public decimal? FragmentacionPct { get; set; }

        [Column("paginas")]
        public long? Paginas { get; set; }

        [Column("accion_recomendada")]
        public string? AccionRecomendada { get; set; }
    }
}
