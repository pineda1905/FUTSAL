namespace GestionTorneos.Domain.Entities;

public class CategoriaGenero
{
    public int Id { get; set; }
    public string NombreCategoria { get; set; } = string.Empty;

    // Propiedades de navegación
    public virtual ICollection<Torneo> Torneos { get; set; } = new HashSet<Torneo>();
}
