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
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual ICollection<Reserva> ReservasCreadas { get; set; } = new HashSet<Reserva>();
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual ICollection<Torneo> TorneosCreados { get; set; } = new HashSet<Torneo>();
}
