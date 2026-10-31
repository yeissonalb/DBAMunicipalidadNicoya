using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dba_monitor_sesiones.</summary>
    public class SpDbaMonitorSesionResultDto
    {
        [Column("session_id")]
        public int SessionId { get; set; }

        [Column("login_name")]
        public string? LoginName { get; set; }

        [Column("host_name")]
        public string? HostName { get; set; }

        [Column("direccion_ip")]
        public string? DireccionIp { get; set; }

        [Column("programa")]
        public string? Programa { get; set; }

        [Column("estado")]
        public string? Estado { get; set; }

        [Column("comando")]
        public string? Comando { get; set; }

        [Column("base_datos")]
        public string? BaseDatos { get; set; }

        [Column("tipo_espera")]
        public string? TipoEspera { get; set; }

        [Column("bloqueada_por")]
        public int? BloqueadaPor { get; set; }

        [Column("es_bloqueante")]
        public bool EsBloqueante { get; set; }

        [Column("segundos_ejecucion")]
        public int? SegundosEjecucion { get; set; }

        [Column("consulta_lenta")]
        public bool ConsultaLenta { get; set; }

        [Column("cpu_ms")]
        public int? CpuMs { get; set; }

        [Column("lecturas_logicas")]
        public long? LecturasLogicas { get; set; }

        [Column("consulta")]
        public string? Consulta { get; set; }

        [Column("ultima_solicitud")]
        public DateTime? UltimaSolicitud { get; set; }

        [Column("es_sesion_actual")]
        public bool EsSesionActual { get; set; }
    }
}
