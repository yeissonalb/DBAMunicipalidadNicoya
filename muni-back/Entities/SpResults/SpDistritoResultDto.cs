using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_distritos.</summary>
    public class SpDistritoResultDto
    {
        [Column("id_distrito")]
        public int IdDistrito { get; set; }

        [Column("codigo_distrital")]
        public string? CodigoDistrital { get; set; }

        [Column("nombre_distrito")]
        public string? NombreDistrito { get; set; }
    }
}
