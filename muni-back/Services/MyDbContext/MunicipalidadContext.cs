using Entities.Views;
using Microsoft.EntityFrameworkCore;

namespace Services.MyDbContext
{
    /// <summary>
    /// Contexto de solo lectura sobre las vistas dbo.vw_*.
    /// No se mapea ninguna tabla operativa: todas las escrituras pasan por dbo.sp_*.
    /// </summary>
    public class MunicipalidadContext : DbContext
    {
        public MunicipalidadContext(DbContextOptions<MunicipalidadContext> options) : base(options)
        {
            // Las vistas no se modifican nunca: se desactiva el tracking por defecto.
            ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
        }

        public DbSet<VwPadronContribuyente> VwPadronContribuyentes => Set<VwPadronContribuyente>();
        public DbSet<VwInmueblesPropietario> VwInmueblesPropietarios => Set<VwInmueblesPropietario>();
        public DbSet<VwTramitesSeguimiento> VwTramitesSeguimiento => Set<VwTramitesSeguimiento>();
        public DbSet<VwHistorialTramitesDetallado> VwHistorialTramitesDetallado => Set<VwHistorialTramitesDetallado>();
        public DbSet<VwEstadoCuentaContribuyente> VwEstadoCuentaContribuyente => Set<VwEstadoCuentaContribuyente>();
        public DbSet<VwFacturasPendiente> VwFacturasPendientes => Set<VwFacturasPendiente>();
        public DbSet<VwMorosidadContribuyente> VwMorosidadContribuyentes => Set<VwMorosidadContribuyente>();
        public DbSet<VwRecaudacionPorTributo> VwRecaudacionPorTributo => Set<VwRecaudacionPorTributo>();
        public DbSet<VwRecaudacionPorDistrito> VwRecaudacionPorDistrito => Set<VwRecaudacionPorDistrito>();
        public DbSet<VwAuditoriaDetallada> VwAuditoriaDetallada => Set<VwAuditoriaDetallada>();
        public DbSet<VwUsuariosRolesPermiso> VwUsuariosRolesPermisos => Set<VwUsuariosRolesPermiso>();
        public DbSet<VwEstadoRespaldo> VwEstadoRespaldos => Set<VwEstadoRespaldo>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<VwPadronContribuyente>(e => { e.HasNoKey(); e.ToView("vw_padron_contribuyentes", "dbo"); });
            modelBuilder.Entity<VwInmueblesPropietario>(e => { e.HasNoKey(); e.ToView("vw_inmuebles_propietarios", "dbo"); });
            modelBuilder.Entity<VwTramitesSeguimiento>(e => { e.HasNoKey(); e.ToView("vw_tramites_seguimiento", "dbo"); });
            modelBuilder.Entity<VwHistorialTramitesDetallado>(e => { e.HasNoKey(); e.ToView("vw_historial_tramites_detallado", "dbo"); });
            modelBuilder.Entity<VwEstadoCuentaContribuyente>(e => { e.HasNoKey(); e.ToView("vw_estado_cuenta_contribuyente", "dbo"); });
            modelBuilder.Entity<VwFacturasPendiente>(e => { e.HasNoKey(); e.ToView("vw_facturas_pendientes", "dbo"); });
            modelBuilder.Entity<VwMorosidadContribuyente>(e => { e.HasNoKey(); e.ToView("vw_morosidad_contribuyentes", "dbo"); });
            modelBuilder.Entity<VwRecaudacionPorTributo>(e => { e.HasNoKey(); e.ToView("vw_recaudacion_por_tributo", "dbo"); });
            modelBuilder.Entity<VwRecaudacionPorDistrito>(e => { e.HasNoKey(); e.ToView("vw_recaudacion_por_distrito", "dbo"); });
            modelBuilder.Entity<VwAuditoriaDetallada>(e => { e.HasNoKey(); e.ToView("vw_auditoria_detallada", "dbo"); });
            modelBuilder.Entity<VwUsuariosRolesPermiso>(e => { e.HasNoKey(); e.ToView("vw_usuarios_roles_permisos", "dbo"); });
            modelBuilder.Entity<VwEstadoRespaldo>(e => { e.HasNoKey(); e.ToView("vw_estado_respaldos", "dbo"); });

            // tamano_mb = ROUND(bigint / 1048576.0, 2) -> NUMERIC en SQL Server
            modelBuilder.Entity<VwEstadoRespaldo>().Property(p => p.TamanoMb).HasPrecision(38, 6);
        }
    }
}
