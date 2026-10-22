namespace GestionTorneos.Domain.Entities;

public class Cancha
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    // Propiedades de navegación
    public virtual ICollection<Reserva> Reservas { get; set; } = new HashSet<Reserva>();
}
