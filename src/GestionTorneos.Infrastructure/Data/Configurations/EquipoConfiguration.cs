using GestionTorneos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionTorneos.Infrastructure.Data.Configurations;

public class EquipoConfiguration : IEntityTypeConfiguration<Equipo>
{
    public void Configure(EntityTypeBuilder<Equipo> builder)
    {
        builder.ToTable("Equipos");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.NombreEquipo)
            .IsRequired()
            .HasMaxLength(255)
            .IsUnicode(false);

        builder.Property(e => e.NombreRepresentante)
            .IsRequired()
            .HasMaxLength(255)
            .IsUnicode(false);

        builder.HasOne(e => e.Torneo)
            .WithMany(t => t.Equipos)
            .HasForeignKey(e => e.TorneoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
