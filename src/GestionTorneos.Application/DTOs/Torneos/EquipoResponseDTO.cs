namespace GestionTorneos.Application.DTOs.Torneos;

public class EquipoResponseDTO
{
    public int Id { get; set; }
    public int TorneoId { get; set; }
    public string NombreEquipo { get; set; } = string.Empty;
    public string NombreRepresentante { get; set; } = string.Empty;
}
