using GestionTorneos.Application.DTOs;
using GestionTorneos.Application.Services;
using GestionTorneos.Domain.Entities;
using GestionTorneos.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestionTorneos.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TorneosController : ControllerBase
{
    private readonly ITorneoService _torneoService;
    private readonly ILogger<TorneosController> _logger;

    public TorneosController(ITorneoService torneoService, ILogger<TorneosController> logger)
    {
        _torneoService = torneoService;
        _logger = logger;
    }

    /// <summary>
    /// Lista todos los torneos activos incluyendo sus equipos participantes.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Torneo>>> GetTorneosActivos(CancellationToken ct)
    {
        try
        {
            var torneos = await _torneoService.ObtenerTodosAsync(ct);
            return Ok(torneos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener el listado de torneos activos.");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene el detalle de un torneo por su identificador.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Torneo>> GetById(int id, CancellationToken ct)
    {
        try
        {
            var torneo = await _torneoService.ObtenerPorIdAsync(id, ct);
            if (torneo == null)
            {
                return NotFound(new { message = $"No se encontró el torneo con ID {id}." });
            }

            return Ok(torneo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener el torneo con ID {TorneoId}.", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Crea un nuevo torneo y genera automáticamente el fixture de Cuartos de Final.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Torneo>> CrearTorneo([FromBody] TorneoCreateDTO dto, CancellationToken ct)
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
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Regla de validación infringida al crear torneo: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (BusinessRuleException ex)
        {
            _logger.LogWarning(ex, "Regla de negocio infringida al crear torneo: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al crear torneo.");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Actualiza el resultado (goles) de un partido de torneo y determina automáticamente al ganador.
    /// </summary>
    [HttpPut("partidos/{partidoId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PartidoTorneo>> ActualizarResultado(int partidoId, [FromBody] PartidoUpdateDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var partidoActualizado = await _torneoService.ActualizarResultadoAsync(partidoId, dto, ct);
            return Ok(partidoActualizado);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Parámetros inválidos al actualizar resultado del partido {PartidoId}: {Message}", partidoId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Partido no encontrado {PartidoId}: {Message}", partidoId, ex.Message);
            return NotFound(new { message = ex.Message });
        }
        catch (BusinessRuleException ex)
        {
            _logger.LogWarning(ex, "Regla de negocio infringida al actualizar partido {PartidoId}: {Message}", partidoId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al actualizar resultado del partido {PartidoId}.", partidoId);
            return BadRequest(new { message = ex.Message });
        }
    }
}
