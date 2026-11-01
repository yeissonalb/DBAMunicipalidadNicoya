using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_medios_pago.</summary>
    public class SpMediosPagoResultDto
    {
        [Column("id_medio_pago")]
        public int IdMedioPago { get; set; }

        [Column("nombre_medio_pago")]
        public string? NombreMedioPago { get; set; }
    }
}
