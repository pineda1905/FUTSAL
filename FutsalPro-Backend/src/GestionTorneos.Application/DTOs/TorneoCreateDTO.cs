using System.ComponentModel.DataAnnotations;

namespace GestionTorneos.Application.DTOs;

public class TorneoCreateDTO
{
    [Required(ErrorMessage = "El ID del administrador es obligatorio.")]
    public int UsuarioAdminId { get; set; }

    [Required(ErrorMessage = "El ID del estado es obligatorio.")]
    public int EstadoId { get; set; } = 1;

    [Required(ErrorMessage = "El ID del género es obligatorio.")]
    public int GeneroId { get; set; }

    [Required(ErrorMessage = "El nombre del torneo es obligatorio.")]
    [StringLength(255, ErrorMessage = "El nombre no puede superar los 255 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El rango de edad es obligatorio.")]
    [StringLength(50, ErrorMessage = "El rango de edad no puede superar los 50 caracteres.")]
    public string RangoEdad { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de inicio es obligatoria.")]
    public DateTime FechaInicio { get; set; }

    public List<string> Equipos { get; set; } = new();

    // Propiedad alias para mayor compatibilidad
    public List<string>? NombresEquipos
    {
        get => Equipos;
        set { if (value != null) Equipos = value; }
    }
}
