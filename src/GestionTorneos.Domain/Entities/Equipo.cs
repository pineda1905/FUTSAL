namespace GestionTorneos.Domain.Entities;

public class Equipo
{
    public int Id { get; set; }
    public int TorneoId { get; set; }
    public string NombreEquipo { get; set; } = string.Empty;
    public string NombreRepresentante { get; set; } = string.Empty;

    // Propiedades de navegación
    public virtual Torneo Torneo { get; set; } = null!;
    public virtual ICollection<PartidoTorneo> PartidosLocal { get; set; } = new HashSet<PartidoTorneo>();
    public virtual ICollection<PartidoTorneo> PartidosVisita { get; set; } = new HashSet<PartidoTorneo>();
    public virtual ICollection<PartidoTorneo> PartidosGanados { get; set; } = new HashSet<PartidoTorneo>();
}
