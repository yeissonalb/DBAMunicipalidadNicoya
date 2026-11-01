using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_permisos.</summary>
    public class SpPermisoResultDto
    {
        [Column("id_permiso")]
        public int IdPermiso { get; set; }

        [Column("modulo")]
        public string? Modulo { get; set; }

        [Column("accion")]
        public string? Accion { get; set; }
    }
}
