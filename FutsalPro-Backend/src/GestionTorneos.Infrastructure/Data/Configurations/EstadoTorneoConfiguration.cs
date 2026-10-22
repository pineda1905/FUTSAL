using GestionTorneos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionTorneos.Infrastructure.Data.Configurations;

public class EstadoTorneoConfiguration : IEntityTypeConfiguration<EstadoTorneo>
{
    public void Configure(EntityTypeBuilder<EstadoTorneo> builder)
    {
        builder.ToTable("EstadosTorneo");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.NombreEstado)
            .IsRequired()
            .HasMaxLength(50)
            .IsUnicode(false);
    }
}
