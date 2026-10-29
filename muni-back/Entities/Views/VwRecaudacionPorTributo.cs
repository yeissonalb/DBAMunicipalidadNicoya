using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_recaudacion_por_tributo.</summary>
    [Keyless]
    public class VwRecaudacionPorTributo
    {
        [Column("id_tipo_tributo")]
        public int IdTipoTributo { get; set; }

        [Column("codigo_tributo")]
        public string? CodigoTributo { get; set; }

        [Column("nombre_tributo")]
        public string? NombreTributo { get; set; }

        [Column("periodicidad")]
        public string? Periodicidad { get; set; }

        [Column("cantidad_transacciones")]
        public int CantidadTransacciones { get; set; }

        [Column("total_principal_recaudado")]
        public double? TotalPrincipalRecaudado { get; set; }

        [Column("total_intereses_recaudados")]
        public double? TotalInteresesRecaudados { get; set; }

        [Column("total_recargos_recaudados")]
        public double? TotalRecargosRecaudados { get; set; }

        [Column("total_recaudado_general")]
        public double? TotalRecaudadoGeneral { get; set; }
    }
}
