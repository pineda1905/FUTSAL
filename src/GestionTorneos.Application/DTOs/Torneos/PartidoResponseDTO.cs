namespace GestionTorneos.Application.DTOs.Torneos;

public class PartidoResponseDTO
{
    public int Id { get; set; }
    public int TorneoId { get; set; }
    public string Fase { get; set; } = string.Empty;
    public int? EquipoLocalId { get; set; }
    public string? NombreEquipoLocal { get; set; }
    public int? EquipoVisitaId { get; set; }
    public string? NombreEquipoVisita { get; set; }
    public int? GolesLocal { get; set; }
    public int? GolesVisita { get; set; }
    public int? GanadorId { get; set; }
    public string? NombreGanador { get; set; }
    public bool Finalizado => GanadorId.HasValue;
}
