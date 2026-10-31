using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_asignaciones_roles.</summary>
    public class SpAsignacionRolResultDto
    {
        [Column("id_usuario")]
        public int IdUsuario { get; set; }

        [Column("user_name")]
        public string? UserName { get; set; }

        [Column("id_rol")]
        public int IdRol { get; set; }

        [Column("nombre_rol")]
        public string? NombreRol { get; set; }
    }
}
