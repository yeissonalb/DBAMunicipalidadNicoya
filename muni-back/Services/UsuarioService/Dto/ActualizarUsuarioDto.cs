using System.ComponentModel.DataAnnotations;

namespace Services.UsuarioService.Dto
{
    public class ActualizarUsuarioDto
    {
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
