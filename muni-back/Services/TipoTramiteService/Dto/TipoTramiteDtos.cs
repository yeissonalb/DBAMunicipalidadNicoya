using System.ComponentModel.DataAnnotations;

namespace Services.TipoTramiteService.Dto
{
    public class TipoTramiteDto
    {
        [Required, StringLength(100)]
        public string NombreTramite { get; set; } = string.Empty;

        [Required, StringLength(255)]
        public string DescripcionTipo { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int DiasResolucionMax { get; set; }

        [Range(1, int.MaxValue)]
        public int IdDepartamento { get; set; }
    }

    public class RegistrarRequisitoDto
    {
        [Required, StringLength(255)]
        public string NombreRequisito { get; set; } = string.Empty;

        [Required, StringLength(500)]
        public string Descripcion { get; set; } = string.Empty;

        public bool EsObligatorio { get; set; } = true;
    }
}
