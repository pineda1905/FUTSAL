using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionTorneos.Domain.Entities;

[Table("Torneos")]
public class Torneo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int UsuarioAdminId { get; set; }

    [Required]
    public int EstadoId { get; set; }

    [Required]
    public int GeneroId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column(TypeName = "varchar(255)")]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column(TypeName = "varchar(50)")]
    public string RangoEdad { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "date")]
    public DateTime FechaInicio { get; set; }

    // Propiedades de navegación
    [ForeignKey(nameof(UsuarioAdminId))]
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual Usuario UsuarioAdmin { get; set; } = null!;

    public virtual ICollection<Equipo> Equipos { get; set; } = new HashSet<Equipo>();
    public virtual ICollection<PartidoTorneo> PartidosTorneo { get; set; } = new HashSet<PartidoTorneo>();
}
