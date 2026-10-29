using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_frecuencias.</summary>
    public class SpFrecuenciaResultDto
    {
        [Column("id_frecuencia")]
        public int IdFrecuencia { get; set; }

        [Column("nombre_frecuencia")]
        public string? NombreFrecuencia { get; set; }

        [Column("intervalo_horas")]
        public int IntervaloHoras { get; set; }

        [Column("descripcion_frecuencia")]
        public string? DescripcionFrecuencia { get; set; }
    }
}
