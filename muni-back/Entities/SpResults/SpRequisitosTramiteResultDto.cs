using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_requisitos_por_tipo_tramite.</summary>
    public class SpRequisitosTramiteResultDto
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
