using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dw_historial_cargas.</summary>
    public class SpDwHistorialCargaResultDto
    {
        [Column("id_carga")]
        public int IdCarga { get; set; }

        [Column("fecha_inicio")]
        public DateTime FechaInicio { get; set; }

        [Column("fecha_fin")]
        public DateTime? FechaFin { get; set; }

        [Column("duracion_segundos")]
        public int? DuracionSegundos { get; set; }

        [Column("estado")]
        public string? Estado { get; set; }

        [Column("detalle")]
        public string? Detalle { get; set; }

        [Column("ejecutado_por")]
        public string? EjecutadoPor { get; set; }
    }
}
