namespace GestionTorneos.Domain.Entities;

public class PartidoTorneo
{
    public int Id { get; set; }
    public int TorneoId { get; set; }
    public string Fase { get; set; } = string.Empty;
    public int? EquipoLocalId { get; set; }
    public int? EquipoVisitaId { get; set; }
    public int? GolesLocal { get; set; }
    public int? GolesVisita { get; set; }
    public int? GanadorId { get; set; }

    // Propiedades de navegación
    public virtual Torneo Torneo { get; set; } = null!;
    public virtual Equipo? EquipoLocal { get; set; }
    public virtual Equipo? EquipoVisita { get; set; }
    public virtual Equipo? Ganador { get; set; }
}
