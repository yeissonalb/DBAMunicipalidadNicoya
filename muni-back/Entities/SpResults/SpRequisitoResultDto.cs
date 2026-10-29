using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_requisitos.</summary>
    public class SpRequisitoResultDto
    {
        [Column("id_requisito")]
        public int IdRequisito { get; set; }

        [Column("nombre_requisito")]
        public string? NombreRequisito { get; set; }

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        [Column("es_obligatorio")]
        public bool EsObligatorio { get; set; }
    }
}
