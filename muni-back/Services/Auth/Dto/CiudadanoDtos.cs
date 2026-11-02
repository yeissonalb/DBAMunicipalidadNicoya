using System.ComponentModel.DataAnnotations;

namespace Services.Auth.Dto
{
    /// <summary>Inicio de sesión del portal ciudadano: cédula física o jurídica + contraseña.</summary>
    public class LoginCiudadanoDto
    {
        [Required, StringLength(20)]
        public string Identificacion { get; set; } = string.Empty;

        [Required, StringLength(200)]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// Activación asistida de cuenta ciudadana (CU-01 / CU-TR-03).
    /// Requiere un código de un solo uso emitido previamente por un funcionario autorizado.
    /// </summary>
    public class ActivarCuentaCiudadanaDto
    {
        [Required, StringLength(20)]
        public string Identificacion { get; set; } = string.Empty;

        [Required, StringLength(64)]
        public string CodigoActivacion { get; set; } = string.Empty;

        public string? CorreoElectronico { get; set; }

        [Required, StringLength(200, MinimumLength = 8)]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>Solicitud de generación de PIN / código de activación asistida por funcionario.</summary>
    public class GenerarCodigoActivacionDto
    {
        public int IdContribuyente { get; set; }

        [Range(1, 168)]
        public int? DuracionHoras { get; set; } = 48;

        public string? CedulaRepresentante { get; set; }

        [StringLength(255)]
        public string? Observacion { get; set; }
    }

    /// <summary>Resultado de emisión de código de activación asistida.</summary>
    public class CodigoActivacionGeneradoDto
    {
        public int IdContribuyente { get; set; }
        public string CodigoActivacion { get; set; } = string.Empty;
        public DateTime FechaExpiracion { get; set; }
    }

    /// <summary>Datos del contribuyente autenticado que viajan en el JWT del portal.</summary>
    public class CiudadanoTokenDto
    {
        public int IdContribuyente { get; set; }
        public string Identificacion { get; set; } = string.Empty;
        public string? NombreORazonSocial { get; set; }
        public string? TipoPersona { get; set; }
        public string? CorreoElectronico { get; set; }
        public string? Telefono { get; set; }
    }

    public class LoginCiudadanoResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiraUtc { get; set; }
        public CiudadanoTokenDto Ciudadano { get; set; } = new();
    }
}
