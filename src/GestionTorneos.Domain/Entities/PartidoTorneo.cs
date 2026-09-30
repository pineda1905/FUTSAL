using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionTorneos.Domain.Entities;

[Table("PartidosTorneo")]
public class PartidoTorneo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int TorneoId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column(TypeName = "varchar(50)")]
    public string Fase { get; set; } = string.Empty;

    public int? EquipoLocalId { get; set; }

    public int? EquipoVisitaId { get; set; }

    public int? GolesLocal { get; set; }

    public int? GolesVisita { get; set; }

    public int? GanadorId { get; set; }

    // Propiedades de navegación
    [ForeignKey(nameof(TorneoId))]
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual Torneo Torneo { get; set; } = null!;

    [ForeignKey(nameof(EquipoLocalId))]
    public virtual Equipo? EquipoLocal { get; set; }

    [ForeignKey(nameof(EquipoVisitaId))]
    public virtual Equipo? EquipoVisita { get; set; }

    [ForeignKey(nameof(GanadorId))]
    public virtual Equipo? Ganador { get; set; }
}
