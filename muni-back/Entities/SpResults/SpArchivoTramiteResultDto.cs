using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_archivos_tramite.</summary>
    public class SpArchivoTramiteResultDto
    {
        [Column("id_archivo_adjunto")]
        public int IdArchivoAdjunto { get; set; }

        [Column("id_tramite")]
        public int IdTramite { get; set; }

        [Column("nombre_original")]
        public string? NombreOriginal { get; set; }

        [Column("ruta_almacenamiento")]
        public string? RutaAlmacenamiento { get; set; }

        [Column("peso_bytes")]
        public double PesoBytes { get; set; }

        [Column("fecha_subida")]
        public DateTime FechaSubida { get; set; }

        [Column("id_requisito")]
        public int? IdRequisito { get; set; }

        [Column("nombre_requisito")]
        public string? NombreRequisito { get; set; }
    }
}
