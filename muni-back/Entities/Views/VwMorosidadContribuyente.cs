using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_morosidad_contribuyentes.</summary>
    [Keyless]
    public class VwMorosidadContribuyente
    {
        [Column("id_contribuyente")]
        public int IdContribuyente { get; set; }

        [Column("identificacion_oficial")]
        public string? IdentificacionOficial { get; set; }

        [Column("nombre_o_razon_social")]
        public string? NombreORazonSocial { get; set; }

        [Column("telefono")]
        public string? Telefono { get; set; }

        [Column("correo_electronico")]
        public string? CorreoElectronico { get; set; }

        [Column("numero_finca")]
        public string? NumeroFinca { get; set; }

        [Column("nombre_distrito")]
        public string? NombreDistrito { get; set; }

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

        [Column("deuda_total")]
        public double? DeudaTotal { get; set; }

        [Column("fecha_de_vencimiento")]
        public DateTime FechaDeVencimiento { get; set; }

        [Column("dias_mora")]
        public int? DiasMora { get; set; }
    }
}
