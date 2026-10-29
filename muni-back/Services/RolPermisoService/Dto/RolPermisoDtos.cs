using System.ComponentModel.DataAnnotations;

namespace Services.RolPermisoService.Dto
{
    public class RegistrarRolDto
    {
        [Required, StringLength(50)]
        public string NombreRol { get; set; } = string.Empty;
    }

    public class RegistrarPermisoDto
    {
        [Required, StringLength(50)]
        public string Modulo { get; set; } = string.Empty;

        [Required, StringLength(20)]
        public string Accion { get; set; } = string.Empty;
    }

    public class AsignarRolUsuarioDto
    {
        [Range(1, int.MaxValue)]
        public int IdUsuario { get; set; }

        [Range(1, int.MaxValue)]
        public int IdRol { get; set; }
    }

    public class AsignarPermisoRolDto
    {
        [Range(1, int.MaxValue)]
        public int IdRol { get; set; }

        [Range(1, int.MaxValue)]
        public int IdPermiso { get; set; }
    }
}
