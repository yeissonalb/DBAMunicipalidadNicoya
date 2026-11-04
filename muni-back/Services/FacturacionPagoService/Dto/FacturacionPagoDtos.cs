using System.ComponentModel.DataAnnotations;

namespace Services.FacturacionPagoService.Dto
{
    public class GenerarFacturaDto
    {
        [Range(1, int.MaxValue)]
        public int IdDeudaMunicipal { get; set; }

        [Required(ErrorMessage = "La clave numérica de Hacienda es obligatoria.")]
        [RegularExpression(@"^[0-9]{50}$",
            ErrorMessage = "La clave numérica de Hacienda debe contener exactamente 50 dígitos, sin letras, espacios ni símbolos.")]
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

    /// <summary>Cobro en ventanilla de caja municipal (CU-PC-04 y CU-PC-05).</summary>
    public class CajeroCobroDirectoDto
    {
        [Range(1, int.MaxValue)]
        public int IdFactura { get; set; }

        [Required, Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a cero.")]
        public decimal MontoPago { get; set; }

        [Range(1, int.MaxValue)]
        public int IdMedioPago { get; set; }

        [Required, StringLength(50)]
        public string Comprobante { get; set; } = string.Empty;

        public int? IdReporteAsociado { get; set; }
    }

    public class CajeroCobroResultadoDto
    {
        public int IdPagoMunicipal { get; set; }
        public string Comprobante { get; set; } = string.Empty;
        public decimal MontoPagado { get; set; }
        public DateTime FechaPago { get; set; }
    }
}
