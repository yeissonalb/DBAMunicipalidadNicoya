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
    /// Activación de cuenta ciudadana (autoservicio). La BD exige que la cédula y el correo
    /// coincidan con el padrón municipal (sp_activar_cuenta_ciudadana).
    /// </summary>
    public class ActivarCuentaCiudadanaDto
    {
        [Required, StringLength(20)]
        public string Identificacion { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(100)]
        public string CorreoElectronico { get; set; } = string.Empty;

        [Required, StringLength(200, MinimumLength = 8)]
        public string Password { get; set; } = string.Empty;
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
