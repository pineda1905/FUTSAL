using GestionTorneos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionTorneos.Infrastructure.Data.Configurations;

public class CategoriaGeneroConfiguration : IEntityTypeConfiguration<CategoriaGenero>
{
    public void Configure(EntityTypeBuilder<CategoriaGenero> builder)
    {
        builder.ToTable("CategoriasGenero");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.NombreCategoria)
            .IsRequired()
            .HasMaxLength(50)
            .IsUnicode(false);
    }
}
