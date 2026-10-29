using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_reporte_contribuyentes_morosos.</summary>
    public class SpReporteContribuyentesMorososResultDto
    {
        [Column("identificacion_oficial")]
        public string? IdentificacionOficial { get; set; }

        [Column("nombre_o_razon_social")]
        public string? NombreORazonSocial { get; set; }

        [Column("telefono")]
        public string? Telefono { get; set; }

        [Column("correo_electronico")]
        public string? CorreoElectronico { get; set; }

        [Column("facturas_pendientes")]
        public int FacturasPendientes { get; set; }

        [Column("deuda_acumulada_total")]
        public double? DeudaAcumuladaTotal { get; set; }

        [Column("maximos_dias_morosidad")]
        public int? MaximosDiasMorosidad { get; set; }
    }
}
