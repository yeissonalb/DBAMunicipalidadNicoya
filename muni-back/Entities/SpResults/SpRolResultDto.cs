using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_roles.</summary>
    public class SpRolResultDto
    {
        [Column("id_rol")]
        public int IdRol { get; set; }

        [Column("nombre_rol")]
        public string? NombreRol { get; set; }
    }
}
