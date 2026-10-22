using System.ComponentModel.DataAnnotations;

namespace GestionTorneos.Application.DTOs.Reservas;

public class ReservaCreateDTO
{
    [Required(ErrorMessage = "La cancha es requerida.")]
    public int CanchaId { get; set; }

    [Required(ErrorMessage = "El usuario administrador es requerido.")]
    public int UsuarioAdminId { get; set; }

    [Required(ErrorMessage = "El nombre del cliente es obligatorio.")]
    [StringLength(255, ErrorMessage = "El nombre del cliente no puede exceder los 255 caracteres.")]
    public string NombreCliente { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono de WhatsApp es obligatorio.")]
    [StringLength(50, ErrorMessage = "El teléfono no puede exceder los 50 caracteres.")]
    [Phone(ErrorMessage = "El formato del teléfono no es válido.")]
    public string TelefonoWhatsApp { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha y hora de inicio es requerida.")]
    public DateTime FechaHoraInicio { get; set; }

    [Required(ErrorMessage = "La fecha y hora de fin es requerida.")]
    public DateTime FechaHoraFin { get; set; }

    [Required(ErrorMessage = "El precio total es requerido.")]
    [Range(0.01, 99999999.99, ErrorMessage = "El precio debe ser mayor a 0.")]
    public decimal PrecioTotal { get; set; }
}
