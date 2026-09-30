using GestionTorneos.Application.DTOs.Torneos;
using GestionTorneos.Application.Interfaces.Services;
using GestionTorneos.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace GestionTorneos.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TorneosController : ControllerBase
{
    private readonly ITorneoService _torneoService;

    public TorneosController(ITorneoService torneoService)
    {
        _torneoService = torneoService;
    }

    /// <summary>
    /// Lista todos los torneos registrados (acceso público para espectadores y panel admin).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TorneoResponseDTO>>> GetAll(CancellationToken ct)
    {
        var torneos = await _torneoService.GetAllAsync(ct);
        return Ok(torneos);
    }

    /// <summary>
    /// Obtiene el detalle de un torneo específico, sus equipos y el fixture de llaves.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TorneoResponseDTO>> GetById(int id, CancellationToken ct)
    {
        try
        {
            var torneo = await _torneoService.GetByIdAsync(id, ct);
            return Ok(torneo);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Crea un nuevo torneo validando que la fecha de inicio esté entre 7 y 20 días de anticipación.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TorneoResponseDTO>> CrearTorneo([FromBody] TorneoCreateDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var nuevoTorneo = await _torneoService.CrearTorneoAsync(dto, ct);
            return CreatedAtAction(nameof(GetById), new { id = nuevoTorneo.Id }, nuevoTorneo);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Inscribe un equipo en un torneo (máximo 16 equipos por torneo).
    /// </summary>
    [HttpPost("{id:int}/equipos")]
    public async Task<ActionResult<EquipoResponseDTO>> RegistrarEquipo(int id, [FromBody] EquipoCreateDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var equipo = await _torneoService.RegistrarEquipoAsync(id, dto, ct);
            return CreatedAtAction(nameof(GetById), new { id }, equipo);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Genera automáticamente el fixture de eliminación directa (Octavos, Cuartos o Semifinales) y gestiona pases directos.
    /// </summary>
    [HttpPost("{id:int}/generar-fixture")]
    public async Task<ActionResult<IEnumerable<PartidoResponseDTO>>> GenerarFixture(int id, CancellationToken ct)
    {
        try
        {
            var partidos = await _torneoService.GenerarFixtureAsync(id, ct);
            return Ok(partidos);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Actualiza el marcador final de un partido e impulsa el avance del ganador en el árbol de llaves.
    /// </summary>
    [HttpPut("partidos/{partidoId:int}/marcador")]
    public async Task<ActionResult<PartidoResponseDTO>> ActualizarMarcador(int partidoId, [FromBody] PartidoUpdateResultadoDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var partido = await _torneoService.ActualizarMarcadorAsync(partidoId, dto, ct);
            return Ok(partido);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
