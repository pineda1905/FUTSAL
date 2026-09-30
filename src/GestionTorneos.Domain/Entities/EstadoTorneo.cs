namespace GestionTorneos.Domain.Entities;

public class EstadoTorneo
{
    public int Id { get; set; }
    public string NombreEstado { get; set; } = string.Empty;

    // Propiedades de navegación
    public virtual ICollection<Torneo> Torneos { get; set; } = new HashSet<Torneo>();
}
