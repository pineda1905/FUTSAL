using GestionTorneos.Application.DTOs;
using GestionTorneos.Domain.Entities;

namespace GestionTorneos.Application.Services;

public interface ITorneoService
{
    Task<Torneo> CrearTorneoAsync(TorneoCreateDTO dto, CancellationToken cancellationToken = default);
    Task<PartidoTorneo> ActualizarResultadoAsync(int partidoId, PartidoUpdateDTO dto, CancellationToken cancellationToken = default);
    Task<PartidoTorneo> ActualizarResultadoAsync(PartidoUpdateDTO dto, CancellationToken cancellationToken = default);
    Task<Torneo?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Torneo> ActualizarTorneoAsync(int id, TorneoCreateDTO dto, CancellationToken cancellationToken = default);
    Task<IEnumerable<Torneo>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<PartidoTorneo>> ObtenerPartidosPorTorneoAsync(int torneoId, CancellationToken cancellationToken = default);
}
