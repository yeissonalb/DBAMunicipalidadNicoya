namespace Services.MonitoreoDbaService.Dto
{
    /// <summary>Tareas del plan de mantenimiento bajo demanda (CU-DBA-06).</summary>
    public class EjecutarMantenimientoDto
    {
        public bool OptimizarIndices { get; set; } = true;
        public bool ActualizarEstadisticas { get; set; } = true;

        /// <summary>Borra archivos .bak más antiguos que retencion_dias en cada ruta de respaldo activa.</summary>
        public bool PurgarRespaldos { get; set; } = false;
    }
}
