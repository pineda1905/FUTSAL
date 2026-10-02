namespace GestionTorneos.Application.DTOs.Torneos;

public class TorneoResponseDTO
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int UsuarioAdminId { get; set; }
    public string NombreAdmin { get; set; } = string.Empty;
    public int EstadoId { get; set; }
    public string NombreEstado { get; set; } = string.Empty;
    public int GeneroId { get; set; }
    public string NombreGenero { get; set; } = string.Empty;
    public string RangoEdad { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public int TotalEquipos { get; set; }
    public List<EquipoResponseDTO> Equipos { get; set; } = new();
    public List<PartidoResponseDTO> Partidos { get; set; } = new();
}
