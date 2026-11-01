using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_departamentos.</summary>
    public class SpDepartamentoResultDto
    {
        [Column("id_departamento")]
        public int IdDepartamento { get; set; }

        [Column("nombre_departamento")]
        public string? NombreDepartamento { get; set; }

        [Column("codigo_interno")]
        public string? CodigoInterno { get; set; }
    }
}
