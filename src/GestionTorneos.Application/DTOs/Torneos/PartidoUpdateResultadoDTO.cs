using System.ComponentModel.DataAnnotations;

namespace GestionTorneos.Application.DTOs.Torneos;

public class PartidoUpdateResultadoDTO
{
    [Required(ErrorMessage = "Los goles del equipo local son obligatorios.")]
    [Range(0, 99, ErrorMessage = "Los goles deben ser un número positivo.")]
    public int GolesLocal { get; set; }

    [Required(ErrorMessage = "Los goles del equipo visitante son obligatorios.")]
    [Range(0, 99, ErrorMessage = "Los goles deben ser un número positivo.")]
    public int GolesVisita { get; set; }

    /// <summary>
    /// En caso de empate en tiempo regular o definición por penales, el administrador asigna el GanadorId explícitamente.
    /// </summary>
    public int? GanadorId { get; set; }
}
