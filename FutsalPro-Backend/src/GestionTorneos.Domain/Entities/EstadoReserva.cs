namespace GestionTorneos.Domain.Entities;

public class EstadoReserva
{
    public int Id { get; set; }
    public string NombreEstado { get; set; } = string.Empty;

    // Propiedades de navegación
    public virtual ICollection<Reserva> Reservas { get; set; } = new HashSet<Reserva>();
}
