using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_tramites_seguimiento.</summary>
    [Keyless]
    public class VwTramitesSeguimiento
    {
        [Column("id_tramite")]
        public int IdTramite { get; set; }

        [Column("numero_expediente")]
        public string? NumeroExpediente { get; set; }

        [Column("fecha_radicacion")]
        public DateTime FechaRadicacion { get; set; }

        [Column("fecha_resolucion_estimada")]
        public DateTime? FechaResolucionEstimada { get; set; }

        [Column("fecha_resolucion_final")]
        public DateTime? FechaResolucionFinal { get; set; }

        [Column("nombre_tramite")]
        public string? NombreTramite { get; set; }

        [Column("dias_resolucion_max")]
        public int DiasResolucionMax { get; set; }

        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }

        [Column("id_contribuyente")]
        public int IdContribuyente { get; set; }

        [Column("cedula_solicitante")]
        public string? CedulaSolicitante { get; set; }

        [Column("solicitante")]
        public string? Solicitante { get; set; }

        [Column("funcionario_analista")]
        public string? FuncionarioAnalista { get; set; }

        [Column("numero_finca")]
        public string? NumeroFinca { get; set; }

        [Column("estado_actual")]
        public string? EstadoActual { get; set; }

        [Column("dias_transcurridos")]
        public int? DiasTranscurridos { get; set; }

        [Column("dias_restantes_sla")]
        public int? DiasRestantesSla { get; set; }

        [Column("fuera_plazo")]
        public bool? FueraPlazo { get; set; }
    }
}
