using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_auditoria_detallada.</summary>
    [Keyless]
    public class VwAuditoriaDetallada
    {
        [Column("id_auditoria")]
        public int IdAuditoria { get; set; }

        [Column("fecha_hora")]
        public DateTime FechaHora { get; set; }

        [Column("operacion_dml")]
        public string? OperacionDml { get; set; }

        [Column("tabla_afectada")]
        public string? TablaAfectada { get; set; }

        [Column("id_registro_afectado")]
        public string? IdRegistroAfectado { get; set; }

        [Column("valores_anteriores")]
        public string? ValoresAnteriores { get; set; }

        [Column("valores_nuevos")]
        public string? ValoresNuevos { get; set; }

        [Column("direccion_ip")]
        public string? DireccionIp { get; set; }

        [Column("id_usuario")]
        public int? IdUsuario { get; set; }

        [Column("usuario_ejecutor")]
        public string? UsuarioEjecutor { get; set; }

        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }
    }
}
