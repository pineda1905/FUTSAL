using GestionTorneos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionTorneos.Infrastructure.Data.Configurations;

public class TorneoConfiguration : IEntityTypeConfiguration<Torneo>
{
    public void Configure(EntityTypeBuilder<Torneo> builder)
    {
        builder.ToTable("Torneos");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Nombre)
            .IsRequired()
            .HasMaxLength(255)
            .IsUnicode(false);

        builder.Property(t => t.RangoEdad)
            .IsRequired()
            .HasMaxLength(50)
            .IsUnicode(false);

        builder.Property(t => t.FechaInicio)
            .HasColumnType("date")
            .IsRequired();

        // Relaciones con DeleteBehavior.Restrict
        builder.HasOne(t => t.UsuarioAdmin)
            .WithMany(u => u.TorneosCreados)
            .HasForeignKey(t => t.UsuarioAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.EstadoTorneo)
            .WithMany(e => e.Torneos)
            .HasForeignKey(t => t.EstadoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.CategoriaGenero)
            .WithMany(g => g.Torneos)
            .HasForeignKey(t => t.GeneroId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
