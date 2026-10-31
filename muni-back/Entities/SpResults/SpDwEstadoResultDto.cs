using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dw_estado.</summary>
    public class SpDwEstadoResultDto
    {
        [Column("dw_instalado")]
        public bool DwInstalado { get; set; }

        [Column("ultima_carga_inicio")]
        public DateTime? UltimaCargaInicio { get; set; }

        [Column("ultima_carga_fin")]
        public DateTime? UltimaCargaFin { get; set; }

        [Column("ultima_carga_estado")]
        public string? UltimaCargaEstado { get; set; }

        [Column("filas_fact_recaudacion")]
        public int FilasFactRecaudacion { get; set; }

        [Column("filas_fact_morosidad")]
        public int FilasFactMorosidad { get; set; }

        [Column("filas_fact_eficiencia")]
        public int FilasFactEficiencia { get; set; }
    }
}
