using System.ComponentModel.DataAnnotations;

namespace Services.TributoDeudaService.Dto
{
    public class RegistrarDeudaMunicipalDto
    {
        [Required, StringLength(150)]
        public string PeriodoDeuda { get; set; } = string.Empty;

        [Required]
        public double? MontoPrincipal { get; set; }

        public double MontoIntereses { get; set; } = 0;

        public double MontoMultas { get; set; } = 0;

        [Required]
        public DateTime? FechaDeVencimiento { get; set; }

        [Range(1, int.MaxValue)]
        public int IdInmueble { get; set; }

        [Range(1, int.MaxValue)]
        public int IdTipoTributo { get; set; }

        /// <summary>Código de dbo.Estado_Deuda: PEND, PAG, VENC, ARR.</summary>
        [Required, StringLength(20)]
        public string CodigoEstadoDeuda { get; set; } = "PEND";
    }

    public class ActualizarEstadoDeudaDto
    {
        [Required, StringLength(20)]
        public string CodigoEstadoDeuda { get; set; } = string.Empty;
    }

    public class CalcularRecargosDto
    {
        /// <summary>Opcional. Si se omite, el SP usa su DEFAULT (0.015 = 1.5% mensual).</summary>
        public double? TasaInteresMensual { get; set; }
    }
}
