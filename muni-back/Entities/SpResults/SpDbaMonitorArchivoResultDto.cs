using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dba_monitor_archivos.</summary>
    public class SpDbaMonitorArchivoResultDto
    {
        [Column("base_datos")]
        public string? BaseDatos { get; set; }

        [Column("archivo_logico")]
        public string? ArchivoLogico { get; set; }

        [Column("tipo")]
        public string? Tipo { get; set; }

        [Column("ruta_fisica")]
        public string? RutaFisica { get; set; }

        [Column("tamano_mb")]
        public decimal? TamanoMb { get; set; }

        [Column("usado_mb")]
        public decimal? UsadoMb { get; set; }

        [Column("maximo_mb")]
        public decimal? MaximoMb { get; set; }

        [Column("volumen")]
        public string? Volumen { get; set; }

        [Column("volumen_total_mb")]
        public decimal? VolumenTotalMb { get; set; }

        [Column("volumen_libre_mb")]
        public decimal? VolumenLibreMb { get; set; }

        [Column("volumen_libre_pct")]
        public decimal? VolumenLibrePct { get; set; }
    }
}
