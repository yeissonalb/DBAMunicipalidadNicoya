using System.ComponentModel.DataAnnotations;

namespace Services.ContribuyenteService.Dto
{
    public class RegistrarContribuyenteFisicoDto
    {
        [Required, StringLength(20)]
        public string CedulaIdentidad { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Nombre { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Apellido1Fisico { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Apellido2Fisico { get; set; } = string.Empty;

        [Required]
        public DateTime? FechaNacimiento { get; set; }

        [Required, EmailAddress, StringLength(100)]
        public string CorreoElectronico { get; set; } = string.Empty;

        [Required, StringLength(20)]
        public string Telefono { get; set; } = string.Empty;

        [Required, StringLength(255)]
        public string DireccionNotificaciones { get; set; } = string.Empty;
    }

    public class RegistrarContribuyenteJuridicoDto
    {
        [Required, StringLength(20)]
        public string CedulaJuridica { get; set; } = string.Empty;

        [Required, StringLength(255)]
        public string RazonSocial { get; set; } = string.Empty;

        [StringLength(150)]
        public string? NombreFantasia { get; set; }

        [Required]
        public DateTime? FechaConstitucion { get; set; }

        [Required, EmailAddress, StringLength(100)]
        public string CorreoElectronico { get; set; } = string.Empty;

        [Required, StringLength(20)]
        public string Telefono { get; set; } = string.Empty;

        [Required, StringLength(255)]
        public string DireccionNotificaciones { get; set; } = string.Empty;
    }

    public class ActualizarContribuyenteDto
    {
        [Required, EmailAddress, StringLength(100)]
        public string CorreoElectronico { get; set; } = string.Empty;

        [Required, StringLength(20)]
        public string Telefono { get; set; } = string.Empty;

        [Required, StringLength(255)]
        public string DireccionNotificaciones { get; set; } = string.Empty;

        [Required]
        public bool? EstadoContribuyente { get; set; }
    }

    public class RegistrarRepresentanteLegalDto
    {
        [Required, StringLength(50)]
        public string NombreRepresentante { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Apellido1Representante { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Apellido2Representante { get; set; } = string.Empty;

        [Required, StringLength(30)]
        public string TomoFolioRegistro { get; set; } = string.Empty;

        [Required, StringLength(20)]
        public string CedulaRepresentante { get; set; } = string.Empty;

        [Required]
        public DateTime? FechaVencimientoPoder { get; set; }

        // El id del contribuyente (padrón) viaja en la ruta: POST api/contribuyente/{idContribuyente}/representante-legal.
        // La BD (script 14) resuelve id_contribuyente_juridico y responde 404 (50029) si no es persona jurídica.
    }
}
