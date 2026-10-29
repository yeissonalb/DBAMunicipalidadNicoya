using System.ComponentModel.DataAnnotations;

namespace Services.AuditoriaService.Dto
{
    public class RegistrarTipoAccionAuditoriaDto
    {
        [Required, StringLength(20)]
        public string Codigo { get; set; } = string.Empty;
    }

    public class RegistrarAuditoriaDto
    {
        [Required, StringLength(50)]
        public string TablaAfectada { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string IdRegistroAfectado { get; set; } = string.Empty;

        // La columna destino Logs_Acciones_Auditoria.valores_* es NVARCHAR(255)
        [StringLength(255)]
        public string? ValoresAnteriores { get; set; }

        [StringLength(255)]
        public string? ValoresNuevos { get; set; }

        /// <summary>Código existente en dbo.Tipo_Accion_Auditoria (INSERT, UPDATE, DELETE...).</summary>
        [Required, StringLength(20)]
        public string CodigoAccion { get; set; } = string.Empty;
    }
}
