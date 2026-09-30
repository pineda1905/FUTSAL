namespace GestionTorneos.Domain.Entities;

public class Torneo
{
    public int Id { get; set; }
    public int UsuarioAdminId { get; set; }
    public int EstadoId { get; set; }
    public int GeneroId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string RangoEdad { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }

    // Propiedades de navegación
    public virtual Usuario UsuarioAdmin { get; set; } = null!;
    public virtual EstadoTorneo EstadoTorneo { get; set; } = null!;
    public virtual CategoriaGenero CategoriaGenero { get; set; } = null!;
    public virtual ICollection<Equipo> Equipos { get; set; } = new HashSet<Equipo>();
    public virtual ICollection<PartidoTorneo> Partidos { get; set; } = new HashSet<PartidoTorneo>();
}
