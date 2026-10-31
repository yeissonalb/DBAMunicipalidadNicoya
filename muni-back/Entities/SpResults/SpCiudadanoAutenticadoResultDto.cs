using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_autenticar_ciudadano.</summary>
    public class SpCiudadanoAutenticadoResultDto
    {
        [Column("id_contribuyente")]
        public int IdContribuyente { get; set; }

        [Column("identificacion_oficial")]
        public string? IdentificacionOficial { get; set; }

        [Column("nombre_o_razon_social")]
        public string? NombreORazonSocial { get; set; }

        [Column("tipo_persona")]
        public string? TipoPersona { get; set; }

        [Column("correo_electronico")]
        public string? CorreoElectronico { get; set; }

        [Column("telefono")]
        public string? Telefono { get; set; }
    }
}
