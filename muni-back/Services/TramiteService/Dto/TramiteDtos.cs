using System.ComponentModel.DataAnnotations;

namespace Services.TramiteService.Dto
{
    public class RegistrarTramiteDto
    {
        [Required, StringLength(30)]
        public string NumeroExpediente { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int IdTipoTramite { get; set; }

        public int? IdInmueble { get; set; }

        [Range(1, int.MaxValue)]
        public int IdContribuyente { get; set; }
    }

    public class ActualizarTramiteDto
    {
        /// <summary>Funcionario asignado. Si se omite, se asigna el usuario autenticado (JWT).</summary>
        public int? IdUsuarioAsignado { get; set; }

        public int? IdInmueble { get; set; }
    }

    public class CambiarEstadoTramiteDto
    {
        /// <summary>Código de dbo.Estado_Tramite: REC, REV, DOC, EVA, APR, RECH.</summary>
        [Required, StringLength(20)]
        public string CodigoEstado { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Observaciones { get; set; }
    }

    public class ResolucionTramiteDto
    {
        [Required, RegularExpression("^(APR|RECH)$", ErrorMessage = "La resolución solo admite APR o RECH.")]
        public string CodigoEstado { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Observaciones { get; set; }
    }

    /// <summary>Archivo ya recibido por el controlador, desacoplado de ASP.NET (IFormFile).</summary>
    public class ArchivoEntrada
    {
        public string NombreOriginal { get; set; } = string.Empty;
        public long PesoBytes { get; set; }
        public Stream Contenido { get; set; } = Stream.Null;
    }

    /// <summary>Metadatos del archivo almacenado en wwwroot/uploads/tramites/.</summary>
    public class ArchivoAdjuntadoDto
    {
        public int IdTramite { get; set; }
        public int? IdRequisito { get; set; }
        public string NombreOriginal { get; set; } = string.Empty;
        public string NombreAlmacenado { get; set; } = string.Empty;
        public string RutaRelativa { get; set; } = string.Empty;
        public string Extension { get; set; } = string.Empty;
        public long PesoBytes { get; set; }
    }
}
