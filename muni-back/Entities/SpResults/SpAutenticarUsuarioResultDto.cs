using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_autenticar_usuario.</summary>
    public class SpAutenticarUsuarioResultDto
    {
        [Column("id_usuario")]
        public int IdUsuario { get; set; }

        [Column("user_name")]
        public string? UserName { get; set; }

        [Column("nombre_completo")]
        public string? NombreCompleto { get; set; }

        [Column("email")]
        public string? Email { get; set; }

        [Column("id_departamento")]
        public int IdDepartamento { get; set; }

        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }

        [Column("nombre_rol")]
        public string? NombreRol { get; set; }
    }
}
