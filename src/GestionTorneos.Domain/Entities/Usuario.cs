namespace GestionTorneos.Domain.Entities;

public class Usuario
{
    public int Id { get; set; }
    public int RolId { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    // Propiedades de navegación
    public virtual Rol Rol { get; set; } = null!;
    public virtual ICollection<Reserva> ReservasCreadas { get; set; } = new HashSet<Reserva>();
    public virtual ICollection<Torneo> TorneosCreados { get; set; } = new HashSet<Torneo>();
}
