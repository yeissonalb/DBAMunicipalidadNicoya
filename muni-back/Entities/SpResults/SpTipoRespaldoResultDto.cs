using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_tipos_respaldo.</summary>
    public class SpTipoRespaldoResultDto
    {
        [Column("id_tipo_de_respaldo")]
        public int IdTipoDeRespaldo { get; set; }

        [Column("nombre_tipo_respaldo")]
        public string? NombreTipoRespaldo { get; set; }

        [Column("descripcion")]
        public string? Descripcion { get; set; }
    }
}
