using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_estado_cuenta.</summary>
    public class SpEstadoCuentaResultDto
    {
        [Column("id_contribuyente")]
        public int IdContribuyente { get; set; }

        [Column("identificacion_oficial")]
        public string? IdentificacionOficial { get; set; }

        [Column("nombre_o_razon_social")]
        public string? NombreORazonSocial { get; set; }

        [Column("numero_finca")]
        public string? NumeroFinca { get; set; }

        [Column("id_deuda_municipal")]
        public int IdDeudaMunicipal { get; set; }

        [Column("periodo_deuda")]
        public string? PeriodoDeuda { get; set; }

        [Column("nombre_tributo")]
        public string? NombreTributo { get; set; }

        [Column("monto_principal")]
        public double MontoPrincipal { get; set; }

        [Column("monto_intereses")]
        public double MontoIntereses { get; set; }

        [Column("monto_multas")]
        public double MontoMultas { get; set; }

        [Column("total_deuda")]
        public double? TotalDeuda { get; set; }

        [Column("fecha_de_vencimiento")]
        public DateTime FechaDeVencimiento { get; set; }

        [Column("codigo_estado_deuda")]
        public string? CodigoEstadoDeuda { get; set; }

        [Column("descripcion_estado_deuda")]
        public string? DescripcionEstadoDeuda { get; set; }

        [Column("id_factura")]
        public int? IdFactura { get; set; }

        [Column("clave_numerica_hacienda")]
        public string? ClaveNumericaHacienda { get; set; }

        [Column("total_a_pagar")]
        public double? TotalAPagar { get; set; }

        [Column("saldo_pendiente")]
        public double? SaldoPendiente { get; set; }

        [Column("estado_factura")]
        public string? EstadoFactura { get; set; }
    }
}
