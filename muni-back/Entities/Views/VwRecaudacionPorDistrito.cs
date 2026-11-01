using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Entities.Views
{
    /// <summary>Mapeo de solo lectura de la vista dbo.vw_recaudacion_por_distrito.</summary>
    [Keyless]
    public class VwRecaudacionPorDistrito
    {
        [Column("id_distrito")]
        public int IdDistrito { get; set; }

        [Column("codigo_distrital")]
        public string? CodigoDistrital { get; set; }

        [Column("nombre_distrito")]
        public string? NombreDistrito { get; set; }

        [Column("transacciones_pago")]
        public int TransaccionesPago { get; set; }

        [Column("principal_recaudado")]
        public double? PrincipalRecaudado { get; set; }

        [Column("intereses_recaudados")]
        public double? InteresesRecaudados { get; set; }

        [Column("recargos_recaudados")]
        public double? RecargosRecaudados { get; set; }

        [Column("recaudacion_distrital_total")]
        public double? RecaudacionDistritalTotal { get; set; }
    }
}
