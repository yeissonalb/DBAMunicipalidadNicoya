using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_estados_tramite.</summary>
    public class SpEstadosTramiteResultDto
    {
        [Column("id_estado")]
        public int IdEstado { get; set; }

        [Column("codigo")]
        public string? Codigo { get; set; }

        [Column("nombre_estado")]
        public string? NombreEstado { get; set; }
    }
}
