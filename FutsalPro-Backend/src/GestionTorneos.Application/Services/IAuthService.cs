using GestionTorneos.Application.DTOs.Auth;

namespace GestionTorneos.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDTO> LoginAsync(LoginDTO dto, CancellationToken cancellationToken = default);
}
