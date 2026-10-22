using System.ComponentModel.DataAnnotations;

namespace GestionTorneos.Application.DTOs.Torneos;

public class EquipoCreateDTO
{
    [Required(ErrorMessage = "El nombre del equipo es obligatorio.")]
    [StringLength(255, ErrorMessage = "El nombre del equipo no puede superar los 255 caracteres.")]
    public string NombreEquipo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre del representante es obligatorio.")]
    [StringLength(255, ErrorMessage = "El nombre del representante no puede superar los 255 caracteres.")]
    public string NombreRepresentante { get; set; } = string.Empty;
}
