using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_inmuebles_propietarios.</summary>
    [Keyless]
    public class VwInmueblesPropietario
    {
        [Column("id_inmueble")]
        public int IdInmueble { get; set; }

        [Column("numero_finca")]
        public string? NumeroFinca { get; set; }

        [Column("nombre_distrito")]
        public string? NombreDistrito { get; set; }

        [Column("codigo_distrital")]
        public string? CodigoDistrital { get; set; }

        [Column("codigo_uso")]
        public string? CodigoUso { get; set; }

        [Column("uso_suelo")]
        public string? UsoSuelo { get; set; }

        [Column("direccion_exacta")]
        public string? DireccionExacta { get; set; }

        [Column("area_terreno_m2")]
        public double AreaTerrenoM2 { get; set; }

        [Column("area_construccion_m2")]
        public double AreaConstruccionM2 { get; set; }

        [Column("valor_fiscal")]
        public double ValorFiscal { get; set; }

        [Column("plano_catastrado")]
        public string? PlanoCatastrado { get; set; }

        [Column("id_contribuyente")]
        public int IdContribuyente { get; set; }

        [Column("identificacion_oficial")]
        public string? IdentificacionOficial { get; set; }

        [Column("nombre_o_razon_social")]
        public string? NombreORazonSocial { get; set; }

        [Column("porcentaje_participacion")]
        public double PorcentajeParticipacion { get; set; }

        [Column("fecha_adquisicion")]
        public DateTime FechaAdquisicion { get; set; }

        [Column("valor_fiscal_proporcional")]
        public double? ValorFiscalProporcional { get; set; }
    }
}
