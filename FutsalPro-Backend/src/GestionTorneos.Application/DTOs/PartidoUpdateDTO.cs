using System.ComponentModel.DataAnnotations;

namespace GestionTorneos.Application.DTOs;

public class PartidoUpdateDTO
{
    public int? PartidoId { get; set; }

    [Required(ErrorMessage = "Los goles del equipo local son obligatorios.")]
    [Range(0, 100, ErrorMessage = "Los goles no pueden ser negativos.")]
    public int? GolesLocal { get; set; }

    [Required(ErrorMessage = "Los goles del equipo visitante son obligatorios.")]
    [Range(0, 100, ErrorMessage = "Los goles no pueden ser negativos.")]
    public int? GolesVisita { get; set; }

    public int? GanadorId { get; set; }
}
