using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_reporte_historial_tramites_contribuyente.</summary>
    public class SpReporteHistorialTramitesResultDto
    {
        [Column("identificacion_oficial")]
        public string? IdentificacionOficial { get; set; }

        [Column("nombre_o_razon_social")]
        public string? NombreORazonSocial { get; set; }

        [Column("numero_expediente")]
        public string? NumeroExpediente { get; set; }

        [Column("nombre_tramite")]
        public string? NombreTramite { get; set; }

        [Column("fecha_radicacion")]
        public DateTime FechaRadicacion { get; set; }

        [Column("fecha_resolucion_final")]
        public DateTime? FechaResolucionFinal { get; set; }

        [Column("fecha_cambio")]
        public DateTime FechaCambio { get; set; }

        [Column("nombre_estado")]
        public string? NombreEstado { get; set; }

        [Column("observaciones")]
        public string? Observaciones { get; set; }
    }
}
