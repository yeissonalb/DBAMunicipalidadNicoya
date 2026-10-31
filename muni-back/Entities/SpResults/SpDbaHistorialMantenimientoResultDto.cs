using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dba_historial_mantenimiento.</summary>
    public class SpDbaHistorialMantenimientoResultDto
    {
        [Column("id")]
        public int? Id { get; set; }

        [Column("base_datos")]
        public string? BaseDatos { get; set; }

        [Column("objeto")]
        public string? Objeto { get; set; }

        [Column("indice")]
        public string? Indice { get; set; }

        [Column("tipo_comando")]
        public string? TipoComando { get; set; }

        [Column("comando")]
        public string? Comando { get; set; }

        [Column("inicio")]
        public DateTime? Inicio { get; set; }

        [Column("fin")]
        public DateTime? Fin { get; set; }

        [Column("duracion_segundos")]
        public int? DuracionSegundos { get; set; }

        [Column("numero_error")]
        public int? NumeroError { get; set; }

        [Column("mensaje_error")]
        public string? MensajeError { get; set; }
    }
}
