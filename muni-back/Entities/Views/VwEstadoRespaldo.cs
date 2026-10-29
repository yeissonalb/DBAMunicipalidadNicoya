using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_estado_respaldos.</summary>
    [Keyless]
    public class VwEstadoRespaldo
    {
        [Column("id_respaldos")]
        public int IdRespaldos { get; set; }

        [Column("nombre_configuracion")]
        public string? NombreConfiguracion { get; set; }

        [Column("nombre_tipo_respaldo")]
        public string? NombreTipoRespaldo { get; set; }

        [Column("nombre_frecuencia")]
        public string? NombreFrecuencia { get; set; }

        [Column("fecha_inicio")]
        public DateTime FechaInicio { get; set; }

        [Column("fecha_fin")]
        public DateTime? FechaFin { get; set; }

        [Column("duracion_segundos")]
        public int? DuracionSegundos { get; set; }

        [Column("estado_ejecucion")]
        public string? EstadoEjecucion { get; set; }

        [Column("tamano_bytes")]
        public long TamanoBytes { get; set; }

        [Column("tamano_mb")]
        public decimal? TamanoMb { get; set; }

        [Column("ruta_archivo")]
        public string? RutaArchivo { get; set; }

        [Column("detalles_error")]
        public string? DetallesError { get; set; }
    }
}
