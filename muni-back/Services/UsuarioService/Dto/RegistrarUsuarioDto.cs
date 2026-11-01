using System.ComponentModel.DataAnnotations;

namespace Services.UsuarioService.Dto
{
    public class RegistrarUsuarioDto
    {
        [Required, StringLength(50)]
        public string UserName { get; set; } = string.Empty;

        /// <summary>Contraseña en texto plano: el backend la convierte a SHA-256 antes de enviarla al SP.</summary>
        [Required, StringLength(200, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Apellido1Usuario { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Apellido2Usuario { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(100)]
        public string EmailUsuario { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int IdDepartamento { get; set; }
    }
}
