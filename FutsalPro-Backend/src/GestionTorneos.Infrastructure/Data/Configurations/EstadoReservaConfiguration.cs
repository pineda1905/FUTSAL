using GestionTorneos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionTorneos.Infrastructure.Data.Configurations;

public class EstadoReservaConfiguration : IEntityTypeConfiguration<EstadoReserva>
{
    public void Configure(EntityTypeBuilder<EstadoReserva> builder)
    {
        builder.ToTable("EstadosReserva");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.NombreEstado)
            .IsRequired()
            .HasMaxLength(50)
            .IsUnicode(false);
    }
}
