using System.ComponentModel.DataAnnotations;

namespace GestionTorneos.Application.DTOs.Torneos;

public class TorneoCreateDTO
{
    [Required(ErrorMessage = "El ID del administrador es obligatorio.")]
    public int UsuarioAdminId { get; set; }

    [Required(ErrorMessage = "La categoría de género es obligatoria.")]
    public int GeneroId { get; set; }

    [Required(ErrorMessage = "El nombre del torneo es obligatorio.")]
    [StringLength(255, ErrorMessage = "El nombre no puede superar los 255 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El rango de edad es obligatorio.")]
    [StringLength(50, ErrorMessage = "El rango de edad no puede superar los 50 caracteres.")]
    public string RangoEdad { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de inicio es obligatoria.")]
    public DateTime FechaInicio { get; set; }
}
