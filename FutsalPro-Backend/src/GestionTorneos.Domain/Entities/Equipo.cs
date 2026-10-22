using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionTorneos.Domain.Entities;

[Table("Equipos")]
public class Equipo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int TorneoId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column(TypeName = "varchar(255)")]
    public string NombreEquipo { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column(TypeName = "varchar(255)")]
    public string NombreRepresentante { get; set; } = string.Empty;

    // Propiedades de navegación
    [ForeignKey(nameof(TorneoId))]
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual Torneo Torneo { get; set; } = null!;

    [InverseProperty(nameof(PartidoTorneo.EquipoLocal))]
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual ICollection<PartidoTorneo> PartidosLocal { get; set; } = new HashSet<PartidoTorneo>();

    [InverseProperty(nameof(PartidoTorneo.EquipoVisita))]
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual ICollection<PartidoTorneo> PartidosVisita { get; set; } = new HashSet<PartidoTorneo>();

    [InverseProperty(nameof(PartidoTorneo.Ganador))]
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual ICollection<PartidoTorneo> PartidosGanados { get; set; } = new HashSet<PartidoTorneo>();
}
