using System.ComponentModel.DataAnnotations;

namespace Services.RespaldosDbaService.Dto
{
    public class RegistrarConfiguracionRespaldoDto
    {
        [Required, StringLength(255)]
        public string NombreConfiguracion { get; set; } = string.Empty;

        /// <summary>Formato "HH:mm:ss", p. ej. "23:00:00".</summary>
        [Required]
        public TimeSpan? HoraEjecucion { get; set; }

        [Required, StringLength(255)]
        public string Origen { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int RetencionDias { get; set; }

        [StringLength(200)]
        public string? Cifrado { get; set; }

        // La columna Respaldos_Config.ruta_destino es NVARCHAR(150)
        [Required, StringLength(150)]
        public string RutaDestino { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int IdFrecuencia { get; set; }

        [Range(1, int.MaxValue)]
        public int IdTipoDeRespaldo { get; set; }
    }

    public class ActualizarConfiguracionRespaldoDto
    {
        [Required, StringLength(255)]
        public string NombreConfiguracion { get; set; } = string.Empty;

        [Required]
        public TimeSpan? HoraEjecucion { get; set; }

        [Range(1, int.MaxValue)]
        public int RetencionDias { get; set; }

        [Required, StringLength(150)]
        public string RutaDestino { get; set; } = string.Empty;

        [Required]
        public bool? Activo { get; set; }
    }

    public class EjecutarBackupDto
    {
        /// <summary>Opcional. Si se omite, el SP usa su DEFAULT 'C:\Backups_Nicoya2026'.</summary>
        [StringLength(200)]
        public string? RutaCarpeta { get; set; }
    }

    public class SimularRestauracionDto
    {
        [Required, StringLength(255)]
        public string RutaBackupFull { get; set; } = string.Empty;
    }
}
