using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.SpResults
{
    /// <summary>Recordset devuelto por dbo.sp_dw_recaudacion_ubicacion.</summary>
    public class SpDwRecaudacionUbicacionResultDto
    {
        [Column("distrito")]
        public string? Distrito { get; set; }

        [Column("zona_rural_urbana")]
        public string? ZonaRuralUrbana { get; set; }

        [Column("total_principal")]
        public decimal? TotalPrincipal { get; set; }

        [Column("total_intereses")]
        public decimal? TotalIntereses { get; set; }

        [Column("total_recaudado")]
        public decimal? TotalRecaudado { get; set; }

        [Column("total_pagos_distrito")]
        public int? TotalPagosDistrito { get; set; }
    }
}
