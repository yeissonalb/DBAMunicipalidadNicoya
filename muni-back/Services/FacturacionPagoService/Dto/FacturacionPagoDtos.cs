using System.ComponentModel.DataAnnotations;

namespace Services.FacturacionPagoService.Dto
{
    public class GenerarFacturaDto
    {
        [Range(1, int.MaxValue)]
        public int IdDeudaMunicipal { get; set; }

        [Required, StringLength(50)]
        public string ClaveNumericaHacienda { get; set; } = string.Empty;

        public double Descuentos { get; set; } = 0;
    }

    public class RegistrarPagoMunicipalDto
    {
        [Required]
        public double? MontoTotalPagado { get; set; }

        [Required, StringLength(50)]
        public string Comprobante { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int IdMedioPago { get; set; }

        [Range(1, int.MaxValue)]
        public int IdContribuyente { get; set; }
    }

    public class AplicarPagoFacturaDto
    {
        [Range(1, int.MaxValue)]
        public int IdFactura { get; set; }

        [Required]
        public double? MontoPrincipal { get; set; }

        public double MontoInteres { get; set; } = 0;

        public double MontoRecargo { get; set; } = 0;
    }
}
