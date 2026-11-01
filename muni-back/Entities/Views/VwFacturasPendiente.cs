using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_facturas_pendientes.</summary>
    [Keyless]
    public class VwFacturasPendiente
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

        [Column("nombre_tributo")]
        public string? NombreTributo { get; set; }

        [Column("numero_finca")]
        public string? NumeroFinca { get; set; }

        [Column("nombre_distrito")]
        public string? NombreDistrito { get; set; }

        [Column("dias_mora")]
        public int? DiasMora { get; set; }
    }
}
