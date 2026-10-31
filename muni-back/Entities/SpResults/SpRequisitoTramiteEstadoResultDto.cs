using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_requisitos_tramite.</summary>
    public class SpRequisitoTramiteEstadoResultDto
    {
        [Column("id_requisito")]
        public int IdRequisito { get; set; }

        [Column("nombre_requisito")]
        public string? NombreRequisito { get; set; }

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        [Column("es_obligatorio")]
        public bool EsObligatorio { get; set; }

        [Column("presentado")]
        public bool Presentado { get; set; }

        [Column("cantidad_archivos")]
        public int CantidadArchivos { get; set; }

        [Column("fecha_ultima_presentacion")]
        public DateTime? FechaUltimaPresentacion { get; set; }
    }
}
