namespace GestionTorneos.Domain.Entities;

public class Rol
{
    public int Id { get; set; }
    public string NombreRol { get; set; } = string.Empty;

    // Propiedades de navegación
    public virtual ICollection<Usuario> Usuarios { get; set; } = new HashSet<Usuario>();
}
