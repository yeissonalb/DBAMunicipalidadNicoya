using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dw_eficiencia_tramites.</summary>
    public class SpDwEficienciaTramitesResultDto
    {
        [Column("nombre_tramite")]
        public string? NombreTramite { get; set; }

        [Column("plazo_compromiso_sla")]
        public int? PlazoCompromisoSla { get; set; }

        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }

        [Column("estado_final")]
        public string? EstadoFinal { get; set; }

        [Column("dias_promedio_consumidos")]
        public int? DiasPromedioConsumidos { get; set; }

        [Column("cantidad_tramites")]
        public int? CantidadTramites { get; set; }

        [Column("estado_cumplimiento")]
        public string? EstadoCumplimiento { get; set; }
    }
}
