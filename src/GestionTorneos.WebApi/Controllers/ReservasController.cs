using GestionTorneos.Application.DTOs.Reservas;
using GestionTorneos.Application.Interfaces.Services;
using GestionTorneos.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace GestionTorneos.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservasController : ControllerBase
{
    private readonly IReservaService _reservaService;

    public ReservasController(IReservaService reservaService)
    {
        _reservaService = reservaService;
    }

    /// <summary>
    /// Lista todas las reservas activas (no canceladas).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservaResponseDTO>>> GetActivas(CancellationToken ct)
    {
        var reservasActivas = await _reservaService.GetActivasAsync(ct);
        return Ok(reservasActivas);
    }

    /// <summary>
    /// Obtiene una reserva por su identificador.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ReservaResponseDTO>> GetById(int id, CancellationToken ct)
    {
        try
        {
            var reserva = await _reservaService.GetByIdAsync(id, ct);
            return Ok(reserva);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Crea una nueva reserva validando que no supere los 10 días de anticipación.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReservaResponseDTO>> CrearReserva([FromBody] ReservaCreateDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var nuevaReserva = await _reservaService.CrearReservaAsync(dto, ct);
            return CreatedAtAction(nameof(GetById), new { id = nuevaReserva.Id }, nuevaReserva);
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
    /// Actualiza los datos de una reserva existente (cancha, cliente, teléfono, horario, precio).
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ReservaResponseDTO>> ActualizarReserva(int id, [FromBody] ReservaCreateDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var reservaActualizada = await _reservaService.ActualizarReservaAsync(id, dto, ct);
            return Ok(reservaActualizada);
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
    /// Cancela una reserva existente actualizando su estado a 'Cancelada' y registrando el motivo.
    /// </summary>
    [HttpPut("{id:int}/cancelar")]
    public async Task<ActionResult<ReservaResponseDTO>> CancelarReserva(int id, [FromBody] ReservaCancelDTO dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.MotivoCancelacion))
        {
            return BadRequest(new { message = "El motivo de cancelación es obligatorio y no puede estar vacío." });
        }

        try
        {
            var reservaCancelada = await _reservaService.CancelarReservaAsync(id, dto, ct);
            return Ok(reservaCancelada);
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
