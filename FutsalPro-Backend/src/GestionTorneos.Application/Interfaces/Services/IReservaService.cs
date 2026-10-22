using GestionTorneos.Application.DTOs.Reservas;

namespace GestionTorneos.Application.Interfaces.Services;

public interface IReservaService
{
    Task<IEnumerable<ReservaResponseDTO>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<ReservaResponseDTO>> GetActivasAsync(CancellationToken cancellationToken = default);
    Task<ReservaResponseDTO> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ReservaResponseDTO> CrearReservaAsync(ReservaCreateDTO dto, CancellationToken cancellationToken = default);
    Task<ReservaResponseDTO> ActualizarReservaAsync(int id, ReservaCreateDTO dto, CancellationToken cancellationToken = default);
    Task<ReservaResponseDTO> CancelarReservaAsync(int id, ReservaCancelDTO dto, CancellationToken cancellationToken = default);
}
