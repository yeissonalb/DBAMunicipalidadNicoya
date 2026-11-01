using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_consultar_factura.</summary>
    public class SpConsultarFacturaResultDto
    {
        [Column("id_factura")]
        public int IdFactura { get; set; }

        [Column("clave_numerica_hacienda")]
        public string? ClaveNumericaHacienda { get; set; }

        [Column("fecha_emision")]
        public DateTime FechaEmision { get; set; }

        [Column("subtotal")]
        public double Subtotal { get; set; }

        [Column("descuentos")]
        public double Descuentos { get; set; }

        [Column("total_a_pagar")]
        public double TotalAPagar { get; set; }

        [Column("saldo_pendiente")]
        public double SaldoPendiente { get; set; }

        [Column("estado_factura")]
        public string? EstadoFactura { get; set; }

        [Column("id_deuda_municipal")]
        public int IdDeudaMunicipal { get; set; }

        [Column("periodo_deuda")]
        public string? PeriodoDeuda { get; set; }

        [Column("numero_finca")]
        public string? NumeroFinca { get; set; }
    }
}
