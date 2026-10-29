using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_usuarios_roles_permisos.</summary>
    [Keyless]
    public class VwUsuariosRolesPermiso
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
