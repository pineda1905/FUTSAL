using GestionTorneos.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GestionTorneos.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets del Módulo de Operaciones
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<EstadoReserva> EstadosReserva => Set<EstadoReserva>();
    public DbSet<Cancha> Canchas => Set<Cancha>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Reserva> Reservas => Set<Reserva>();

    // DbSets del Módulo de Torneos
    public DbSet<Torneo> Torneos => Set<Torneo>();
    public DbSet<Equipo> Equipos => Set<Equipo>();
    public DbSet<PartidoTorneo> PartidosTorneo => Set<PartidoTorneo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplica todas las configuraciones IEntityTypeConfiguration del ensamblado
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
