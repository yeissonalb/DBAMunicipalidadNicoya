using System.ComponentModel.DataAnnotations;

namespace Services.InmuebleService.Dto
{
    public class RegistrarInmuebleDto
    {
        [Required, StringLength(30)]
        public string NumeroFinca { get; set; } = string.Empty;

        [Required, StringLength(255)]
        public string DireccionExacta { get; set; } = string.Empty;

        [Required]
        public double? AreaTerrenoM2 { get; set; }

        [Required]
        public double? AreaConstruccionM2 { get; set; }

        [Required]
        public double? ValorFiscal { get; set; }

        [Required, StringLength(30)]
        public string PlanoCatastrado { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int IdTipoUsoInmueble { get; set; }

        [Range(1, int.MaxValue)]
        public int IdDistrito { get; set; }
    }

    public class ActualizarInmuebleDto
    {
        [Required, StringLength(255)]
        public string DireccionExacta { get; set; } = string.Empty;

        [Required]
        public double? AreaTerrenoM2 { get; set; }

        [Required]
        public double? AreaConstruccionM2 { get; set; }

        [Required]
        public double? ValorFiscal { get; set; }

        [Required, StringLength(30)]
        public string PlanoCatastrado { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int IdTipoUsoInmueble { get; set; }
    }

    public class AsignarDerechoInmuebleDto
    {
        [Range(1, int.MaxValue)]
        public int IdContribuyente { get; set; }

        [Required]
        public double? PorcentajeParticipacion { get; set; }
    }
}
