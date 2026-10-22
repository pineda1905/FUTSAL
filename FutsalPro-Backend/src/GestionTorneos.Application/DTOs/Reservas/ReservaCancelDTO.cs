using System.ComponentModel.DataAnnotations;

namespace GestionTorneos.Application.DTOs.Reservas;

public class ReservaCancelDTO
{
    [Required(ErrorMessage = "El motivo de cancelación es obligatorio.")]
    [StringLength(500, MinimumLength = 3, ErrorMessage = "El motivo debe tener entre 3 y 500 caracteres.")]
    public string MotivoCancelacion { get; set; } = string.Empty;
}
