using GestionTorneos.Application.DTOs.Torneos;

namespace GestionTorneos.Application.Interfaces.Services;

public interface ITorneoService
{
    Task<IEnumerable<TorneoResponseDTO>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TorneoResponseDTO> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<TorneoResponseDTO> CrearTorneoAsync(TorneoCreateDTO dto, CancellationToken cancellationToken = default);
    Task<EquipoResponseDTO> RegistrarEquipoAsync(int torneoId, EquipoCreateDTO dto, CancellationToken cancellationToken = default);
    Task<IEnumerable<PartidoResponseDTO>> GenerarFixtureAsync(int torneoId, CancellationToken cancellationToken = default);
    Task<PartidoResponseDTO> ActualizarMarcadorAsync(int partidoId, PartidoUpdateResultadoDTO dto, CancellationToken cancellationToken = default);
}
