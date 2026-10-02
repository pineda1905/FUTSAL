using GestionTorneos.Application.DTOs.Auth;
using GestionTorneos.Application.Services;
using GestionTorneos.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace GestionTorneos.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Autenticación de administradores y generación de token JWT.
    /// </summary>
    /// <param name="dto">Credenciales de acceso (Email y Contraseña)</param>
    /// <param name="ct">Token de cancelación</param>
    /// <returns>Token JWT, nombre de usuario y rol</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDTO>> Login([FromBody] LoginDTO dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var response = await _authService.LoginAsync(dto, ct);
            return Ok(response);
        }
        catch (BusinessRuleException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error interno del servidor durante la autenticación.", detalle = ex.Message });
        }
    }
}
