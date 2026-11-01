using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_historial_tramite.</summary>
    public class SpHistorialTramiteResultDto
    {
        [Column("id_historial")]
        public int IdHistorial { get; set; }

        [Column("id_tramite")]
        public int IdTramite { get; set; }

        [Column("numero_expediente")]
        public string? NumeroExpediente { get; set; }

        [Column("nombre_tramite")]
        public string? NombreTramite { get; set; }

        [Column("fecha_cambio")]
        public DateTime FechaCambio { get; set; }

        [Column("codigo_estado")]
        public string? CodigoEstado { get; set; }

        [Column("nombre_estado")]
        public string? NombreEstado { get; set; }

        [Column("observaciones")]
        public string? Observaciones { get; set; }
    }
}
