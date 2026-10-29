using System.ComponentModel.DataAnnotations;

namespace Services.UsuarioService.Dto
{
    public class CambiarEstadoUsuarioDto
    {
        [Required]
        public bool? Activo { get; set; }
    }
}
