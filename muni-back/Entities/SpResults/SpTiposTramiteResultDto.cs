using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_tipos_tramite.</summary>
    public class SpTiposTramiteResultDto
    {
        [Column("id_tipo_tramite")]
        public int IdTipoTramite { get; set; }

        [Column("nombre_tramite")]
        public string? NombreTramite { get; set; }

        [Column("descripcion_tipo")]
        public string? DescripcionTipo { get; set; }

        [Column("dias_resolucion_max")]
        public int DiasResolucionMax { get; set; }

        [Column("id_departamento")]
        public int IdDepartamento { get; set; }

        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }
    }
}
