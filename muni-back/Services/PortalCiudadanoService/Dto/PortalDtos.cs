using System.ComponentModel.DataAnnotations;

namespace Services.PortalCiudadanoService.Dto
{
    /// <summary>Pago en línea SINPE Móvil reportado por el contribuyente (simulado).</summary>
    public class PagoSinpeDto
    {
        /// <summary>Número de comprobante / referencia SINPE que generó la app bancaria.</summary>
        [Required, StringLength(50, MinimumLength = 4)]
        public string Comprobante { get; set; } = string.Empty;

        [Required]
        public double? Monto { get; set; }
    }

    /// <summary>Reporte ciudadano de transferencia bancaria / SINPE (pendiente de verificación en Caja).</summary>
    public class ReportarTransferenciaDto
    {
        [Required, StringLength(50, MinimumLength = 4)]
        public string Comprobante { get; set; } = string.Empty;

        [Required, Range(0.01, double.MaxValue, ErrorMessage = "El monto reportado debe ser mayor a cero.")]
        public decimal Monto { get; set; }

        [StringLength(20)]
        public string? TelefonoOrigen { get; set; }

        [StringLength(255)]
        public string? Observaciones { get; set; }
    }
}
