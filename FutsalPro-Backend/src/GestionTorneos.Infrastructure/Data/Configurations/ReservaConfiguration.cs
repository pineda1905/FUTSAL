using GestionTorneos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionTorneos.Infrastructure.Data.Configurations;

public class ReservaConfiguration : IEntityTypeConfiguration<Reserva>
{
    public void Configure(EntityTypeBuilder<Reserva> builder)
    {
        builder.ToTable("Reservas");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.NombreCliente)
            .IsRequired()
            .HasMaxLength(255)
            .IsUnicode(false);

        builder.Property(r => r.TelefonoWhatsApp)
            .IsRequired()
            .HasMaxLength(50)
            .IsUnicode(false);

        builder.Property(r => r.FechaHoraInicio)
            .IsRequired();

        builder.Property(r => r.FechaHoraFin)
            .IsRequired();

        builder.Property(r => r.PrecioTotal)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(r => r.MotivoCancelacion)
            .HasMaxLength(500)
            .IsUnicode(false)
            .IsRequired(false);

        builder.Property(r => r.FechaRegistro)
            .HasDefaultValueSql("GETDATE()")
            .ValueGeneratedOnAdd();

        // Relaciones con DeleteBehavior.Restrict para evitar ciclos de eliminación en SQL Server
        builder.HasOne(r => r.Cancha)
            .WithMany(c => c.Reservas)
            .HasForeignKey(r => r.CanchaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.UsuarioAdmin)
            .WithMany(u => u.ReservasCreadas)
            .HasForeignKey(r => r.UsuarioAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.EstadoReserva)
            .WithMany(e => e.Reservas)
            .HasForeignKey(r => r.EstadoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Índice compuesto para optimizar consultas de solapamiento de horarios
        builder.HasIndex(r => new { r.CanchaId, r.FechaHoraInicio, r.FechaHoraFin })
            .HasDatabaseName("IX_Reservas_Cancha_Horario");
    }
}
