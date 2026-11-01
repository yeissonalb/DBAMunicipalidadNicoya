using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_roles_permisos_usuario.</summary>
    public class SpRolesPermisosUsuarioResultDto
    {
        [Column("id_usuario")]
        public int IdUsuario { get; set; }

        [Column("user_name")]
        public string? UserName { get; set; }

        [Column("nombre_completo")]
        public string? NombreCompleto { get; set; }

        [Column("email_usuario")]
        public string? EmailUsuario { get; set; }

        [Column("activo")]
        public bool Activo { get; set; }

        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }

        [Column("id_rol")]
        public int IdRol { get; set; }

        [Column("nombre_rol")]
        public string? NombreRol { get; set; }

        [Column("id_permiso")]
        public int IdPermiso { get; set; }

        [Column("modulo")]
        public string? Modulo { get; set; }

        [Column("accion")]
        public string? Accion { get; set; }
    }
}
