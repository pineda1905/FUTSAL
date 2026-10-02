using GestionTorneos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionTorneos.Infrastructure.Data.Configurations;

public class PartidoTorneoConfiguration : IEntityTypeConfiguration<PartidoTorneo>
{
    public void Configure(EntityTypeBuilder<PartidoTorneo> builder)
    {
        builder.ToTable("PartidosTorneo");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Fase)
            .IsRequired()
            .HasMaxLength(50)
            .IsUnicode(false);

        builder.Property(p => p.GolesLocal)
            .IsRequired(false);

        builder.Property(p => p.GolesVisita)
            .IsRequired(false);

        // Relación con Torneo
        builder.HasOne(p => p.Torneo)
            .WithMany(t => t.PartidosTorneo)
            .HasForeignKey(p => p.TorneoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relaciones con Equipo (Local, Visita, Ganador) con Restrict para evitar ciclos en SQL Server
        builder.HasOne(p => p.EquipoLocal)
            .WithMany(e => e.PartidosLocal)
            .HasForeignKey(p => p.EquipoLocalId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne(p => p.EquipoVisita)
            .WithMany(e => e.PartidosVisita)
            .HasForeignKey(p => p.EquipoVisitaId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne(p => p.Ganador)
            .WithMany(e => e.PartidosGanados)
            .HasForeignKey(p => p.GanadorId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);
    }
}
