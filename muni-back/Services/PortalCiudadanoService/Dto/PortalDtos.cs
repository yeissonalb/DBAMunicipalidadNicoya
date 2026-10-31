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
}
