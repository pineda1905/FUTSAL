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

        // Relación con UsuarioAdmin
        builder.HasOne(t => t.UsuarioAdmin)
            .WithMany(u => u.TorneosCreados)
            .HasForeignKey(t => t.UsuarioAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relación con EstadoTorneo
        builder.HasOne(t => t.EstadoTorneo)
            .WithMany(e => e.Torneos)
            .HasForeignKey(t => t.EstadoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relación con CategoriaGenero
        builder.HasOne(t => t.CategoriaGenero)
            .WithMany(c => c.Torneos)
            .HasForeignKey(t => t.GeneroId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
