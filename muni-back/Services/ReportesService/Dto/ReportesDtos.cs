namespace Services.ReportesService.Dto
{
    /// <summary>Valores aceptados por @tipo_reporte en dbo.sp_reporte_gestion_municipal.</summary>
    public static class TiposReporteGestion
    {
        public const string Padron = "PADRON";
        public const string Inmuebles = "INMUEBLES";
        public const string Morosos = "MOROSOS";
        public const string Auditoria = "AUDITORIA";

        public static readonly string[] Todos = { Padron, Inmuebles, Morosos, Auditoria };
    }
}
