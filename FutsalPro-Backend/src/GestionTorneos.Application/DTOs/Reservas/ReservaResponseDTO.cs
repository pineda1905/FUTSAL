namespace GestionTorneos.Application.DTOs.Reservas;

public class ReservaResponseDTO
{
    public int Id { get; set; }
    public int CanchaId { get; set; }
    public string NombreCancha { get; set; } = string.Empty;
    public int UsuarioAdminId { get; set; }
    public string NombreUsuarioAdmin { get; set; } = string.Empty;
    public int EstadoId { get; set; }
    public string NombreEstado { get; set; } = string.Empty;
    public string NombreCliente { get; set; } = string.Empty;
    public string TelefonoWhatsApp { get; set; } = string.Empty;
    public DateTime FechaHoraInicio { get; set; }
    public DateTime FechaHoraFin { get; set; }
    public decimal PrecioTotal { get; set; }
    public string? MotivoCancelacion { get; set; }
    public DateTime FechaRegistro { get; set; }
}
