using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_usuario.</summary>
    public class SpConsultarUsuarioResultDto
    {
        [Column("id_usuario")]
        public int IdUsuario { get; set; }

        [Column("user_name")]
        public string? UserName { get; set; }

        [Column("nombre_usuario")]
        public string? NombreUsuario { get; set; }

        [Column("apellido1_usuario")]
        public string? Apellido1Usuario { get; set; }

        [Column("apellido2_usuario")]
        public string? Apellido2Usuario { get; set; }

        [Column("email_usuario")]
        public string? EmailUsuario { get; set; }

        [Column("activo")]
        public bool Activo { get; set; }

        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }
    }
}
