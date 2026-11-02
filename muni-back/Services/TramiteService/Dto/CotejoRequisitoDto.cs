using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Services.TramiteService.Dto;
public class RevisarArchivoDto
{
    [Range(1, int.MaxValue)] public int IdArchivoAdjunto { get; set; }
    [Required, RegularExpression("^(VALIDADO|SUBSANAR)$")] public string Estado { get; set; } = "";
    [Required, StringLength(255)] public string Observacion { get; set; } = "";
}
public class CotejoRequisitoDto
{
    [Column("id_requisito")] public int IdRequisito { get; set; }
    [Column("nombre_requisito")] public string NombreRequisito { get; set; } = "";
    [Column("es_obligatorio")] public bool EsObligatorio { get; set; }
    [Column("id_archivo_adjunto")] public int? IdArchivoAdjunto { get; set; }
    [Column("nombre_original")] public string? NombreOriginal { get; set; }
    [Column("estado_revision")] public string EstadoRevision { get; set; } = "";
    [Column("observacion")] public string? Observacion { get; set; }
    [Column("fecha_revision")] public DateTime? FechaRevision { get; set; }
    [Column("usuario_revisor")] public string? UsuarioRevisor { get; set; }
}
