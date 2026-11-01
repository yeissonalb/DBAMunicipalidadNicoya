using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_configuraciones_respaldo.</summary>
    public class SpConfiguracionRespaldoResultDto
    {
        [Column("id_respaldos_config")]
        public int IdRespaldosConfig { get; set; }

        [Column("nombre_configuracion")]
        public string? NombreConfiguracion { get; set; }

        [Column("hora_ejecucion")]
        public TimeSpan HoraEjecucion { get; set; }

        [Column("origen")]
        public string? Origen { get; set; }

        [Column("retencion_dias")]
        public int RetencionDias { get; set; }

        [Column("cifrado")]
        public string? Cifrado { get; set; }

        [Column("ruta_destino")]
        public string? RutaDestino { get; set; }

        [Column("activo")]
        public bool Activo { get; set; }

        [Column("fecha_creacion")]
        public DateTime FechaCreacion { get; set; }

        [Column("fecha_modificacion")]
        public DateTime? FechaModificacion { get; set; }

        [Column("id_frecuencia")]
        public int IdFrecuencia { get; set; }

        [Column("nombre_frecuencia")]
        public string? NombreFrecuencia { get; set; }

        [Column("id_tipo_de_respaldo")]
        public int IdTipoDeRespaldo { get; set; }

        [Column("nombre_tipo_respaldo")]
        public string? NombreTipoRespaldo { get; set; }
    }
}
