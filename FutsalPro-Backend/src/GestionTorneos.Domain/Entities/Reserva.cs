namespace GestionTorneos.Domain.Entities;

public class Reserva
{
    public int Id { get; set; }
    public int CanchaId { get; set; }
    public int UsuarioAdminId { get; set; }
    public int EstadoId { get; set; }

    public string NombreCliente { get; set; } = string.Empty;
    public string TelefonoWhatsApp { get; set; } = string.Empty;
    public DateTime FechaHoraInicio { get; set; }
    public DateTime FechaHoraFin { get; set; }
    public decimal PrecioTotal { get; set; }
    public string? MotivoCancelacion { get; set; }
    public DateTime FechaRegistro { get; set; }

    // Propiedades de navegación
    public virtual Cancha Cancha { get; set; } = null!;
    public virtual Usuario UsuarioAdmin { get; set; } = null!;
    public virtual EstadoReserva EstadoReserva { get; set; } = null!;
}
