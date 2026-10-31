using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dba_ejecutar_mantenimiento.</summary>
    public class SpDbaMantenimientoResultDto
    {
        [Column("orden")]
        public int Orden { get; set; }

        [Column("tarea")]
        public string? Tarea { get; set; }

        [Column("estado")]
        public string? Estado { get; set; }

        [Column("detalle")]
        public string? Detalle { get; set; }

        [Column("duracion_segundos")]
        public int? DuracionSegundos { get; set; }
    }
}
