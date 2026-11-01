using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_padron_contribuyentes.</summary>
    [Keyless]
    public class VwPadronContribuyente
    {
        [Column("id_contribuyente")]
        public int IdContribuyente { get; set; }

        [Column("tipo_persona")]
        public string? TipoPersona { get; set; }

        [Column("identificacion_oficial")]
        public string? IdentificacionOficial { get; set; }

        [Column("nombre_o_razon_social")]
        public string? NombreORazonSocial { get; set; }

        [Column("nombre_fantasia")]
        public string? NombreFantasia { get; set; }

        [Column("correo_electronico")]
        public string? CorreoElectronico { get; set; }

        [Column("telefono")]
        public string? Telefono { get; set; }

        [Column("direccion_notificaciones")]
        public string? DireccionNotificaciones { get; set; }

        [Column("fecha_registro")]
        public DateTime FechaRegistro { get; set; }

        [Column("estado_contribuyente")]
        public bool EstadoContribuyente { get; set; }

        [Column("estado_descripcion")]
        public string? EstadoDescripcion { get; set; }
    }
}
