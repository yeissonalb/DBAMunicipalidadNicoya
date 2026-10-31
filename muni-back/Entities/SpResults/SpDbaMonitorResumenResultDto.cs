using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dba_monitor_resumen.</summary>
    public class SpDbaMonitorResumenResultDto
    {
        [Column("servidor")]
        public string? Servidor { get; set; }

        [Column("version_motor")]
        public string? VersionMotor { get; set; }

        [Column("edicion")]
        public string? Edicion { get; set; }

        [Column("base_datos")]
        public string? BaseDatos { get; set; }

        [Column("inicio_servicio")]
        public DateTime? InicioServicio { get; set; }

        [Column("minutos_activo")]
        public int? MinutosActivo { get; set; }

        [Column("cpus")]
        public int? Cpus { get; set; }

        [Column("cpu_sql_pct")]
        public int? CpuSqlPct { get; set; }

        [Column("cpu_otros_pct")]
        public int? CpuOtrosPct { get; set; }

        [Column("memoria_sql_mb")]
        public decimal? MemoriaSqlMb { get; set; }

        [Column("memoria_total_mb")]
        public decimal? MemoriaTotalMb { get; set; }

        [Column("memoria_disponible_mb")]
        public decimal? MemoriaDisponibleMb { get; set; }

        [Column("memoria_uso_pct")]
        public decimal? MemoriaUsoPct { get; set; }

        [Column("conexiones_usuario")]
        public int? ConexionesUsuario { get; set; }

        [Column("solicitudes_activas")]
        public int? SolicitudesActivas { get; set; }

        [Column("sesiones_bloqueadas")]
        public int? SesionesBloqueadas { get; set; }

        [Column("transacciones_activas")]
        public int? TransaccionesActivas { get; set; }

        [Column("datos_mb")]
        public decimal? DatosMb { get; set; }

        [Column("datos_usado_mb")]
        public decimal? DatosUsadoMb { get; set; }

        [Column("log_mb")]
        public decimal? LogMb { get; set; }

        [Column("log_usado_pct")]
        public decimal? LogUsadoPct { get; set; }

        [Column("ultimo_backup_full")]
        public DateTime? UltimoBackupFull { get; set; }

        [Column("ultimo_backup_diferencial")]
        public DateTime? UltimoBackupDiferencial { get; set; }
    }
}
