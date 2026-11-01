using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_tipos_uso_inmueble.</summary>
    public class SpTipoUsoInmuebleResultDto
    {
        [Column("id_tipo_uso_inmueble")]
        public int IdTipoUsoInmueble { get; set; }

        [Column("codigo_uso")]
        public string? CodigoUso { get; set; }

        [Column("descripcion")]
        public string? Descripcion { get; set; }
    }
}
