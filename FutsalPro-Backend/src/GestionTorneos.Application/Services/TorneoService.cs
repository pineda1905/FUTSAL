using GestionTorneos.Application.DTOs;
using GestionTorneos.Domain.Entities;
using GestionTorneos.Domain.Exceptions;
using GestionTorneos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GestionTorneos.Application.Services;

public class TorneoService : ITorneoService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TorneoService> _logger;

    public TorneoService(ApplicationDbContext context, ILogger<TorneoService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Torneo> CrearTorneoAsync(TorneoCreateDTO dto, CancellationToken cancellationToken = default)
    {
        if (dto == null)
        {
            throw new ArgumentException("Los datos para la creación del torneo son requeridos.");
        }

        // a) Valida que FechaInicio esté entre 15 y 30 días a partir de la fecha actual (DateTime.Now).
        var ahora = DateTime.Now;
        var diasDiferencia = (dto.FechaInicio.Date - ahora.Date).TotalDays;

        if (diasDiferencia < 14 || diasDiferencia > 31)
        {
            throw new ArgumentException($"La fecha de inicio debe tener entre 15 y 30 días de anticipación a partir de hoy (DateTime.Now). Valor recibido: {dto.FechaInicio:yyyy-MM-dd}.");
        }

        if (dto.Equipos == null || !dto.Equipos.Any(e => !string.IsNullOrWhiteSpace(e)))
        {
            throw new ArgumentException("El torneo debe incluir al menos un equipo participante.");
        }

        // b) Guarda el torneo y sus equipos asociados en la BD.
        var torneo = new Torneo
        {
            UsuarioAdminId = dto.UsuarioAdminId,
            EstadoId = dto.EstadoId,
            GeneroId = dto.GeneroId,
            Nombre = dto.Nombre.Trim(),
            RangoEdad = dto.RangoEdad.Trim(),
            FechaInicio = dto.FechaInicio.Date
        };

        foreach (var nombreEquipo in dto.Equipos)
        {
            if (!string.IsNullOrWhiteSpace(nombreEquipo))
            {
                torneo.Equipos.Add(new Equipo
                {
                    NombreEquipo = nombreEquipo.Trim(),
                    NombreRepresentante = "Por Asignar"
                });
            }
        }

        await _context.Torneos.AddAsync(torneo, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // c) Simulación de Fixture: Genera automáticamente los registros vacíos en la tabla PartidosTorneo
        // para la fase de 'Cuartos de Final' emparejando a los equipos creados (si son impares, deja EquipoVisitaId como NULL para simular el Pase Directo).
        var equiposCreados = torneo.Equipos.ToList();

        for (int i = 0; i < equiposCreados.Count; i += 2)
        {
            var equipoLocal = equiposCreados[i];
            var tieneVisita = (i + 1) < equiposCreados.Count;
            var equipoVisita = tieneVisita ? equiposCreados[i + 1] : null;

            var partido = new PartidoTorneo
            {
                TorneoId = torneo.Id,
                Fase = "Cuartos de Final",
                EquipoLocalId = equipoLocal.Id,
                EquipoVisitaId = equipoVisita?.Id,
                GolesLocal = null,
                GolesVisita = null,
                GanadorId = null
            };

            _context.PartidosTorneo.Add(partido);
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Torneo {TorneoId} '{Nombre}' creado exitosamente con {EquiposCount} equipos y fixture de Cuartos de Final generado.",
            torneo.Id, torneo.Nombre, equiposCreados.Count);

        // Retornar entidad con sus relaciones cargadas
        return await _context.Torneos
            .Include(t => t.Equipos)
            .Include(t => t.PartidosTorneo)
            .FirstAsync(t => t.Id == torneo.Id, cancellationToken);
    }

    public async Task<PartidoTorneo> ActualizarResultadoAsync(int partidoId, PartidoUpdateDTO dto, CancellationToken cancellationToken = default)
    {
        if (dto == null)
        {
            throw new ArgumentException("Los datos del resultado del partido son requeridos.");
        }

        // Valida que los goles se hayan proporcionado
        if (!dto.GolesLocal.HasValue || !dto.GolesVisita.HasValue)
        {
            throw new ArgumentException("Los goles del equipo local y visitante deben ser proporcionados.");
        }

        if (dto.GolesLocal.Value < 0 || dto.GolesVisita.Value < 0)
        {
            throw new ArgumentException("Los goles no pueden ser valores negativos.");
        }

        var partido = await _context.PartidosTorneo
            .Include(p => p.EquipoLocal)
            .Include(p => p.EquipoVisita)
            .FirstOrDefaultAsync(p => p.Id == partidoId, cancellationToken);

        if (partido == null)
        {
            throw new NotFoundException($"No se encontró el partido con ID {partidoId}.");
        }

        partido.GolesLocal = dto.GolesLocal.Value;
        partido.GolesVisita = dto.GolesVisita.Value;

        // Determina el GanadorId comparando los goles
        if (dto.GolesLocal.Value > dto.GolesVisita.Value)
        {
            partido.GanadorId = partido.EquipoLocalId;
        }
        else if (dto.GolesVisita.Value > dto.GolesLocal.Value)
        {
            partido.GanadorId = partido.EquipoVisitaId;
        }
        else
        {
            // En caso de empate en el marcador regular, se utiliza el GanadorId provisto (por ejemplo, desempate/penales)
            partido.GanadorId = dto.GanadorId;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Resultado actualizado para el partido {PartidoId}: Local {GolesLocal} - Visita {GolesVisita}. GanadorId: {GanadorId}",
            partido.Id, partido.GolesLocal, partido.GolesVisita, partido.GanadorId);

        return partido;
    }

    public async Task<PartidoTorneo> ActualizarResultadoAsync(PartidoUpdateDTO dto, CancellationToken cancellationToken = default)
    {
        if (dto == null || !dto.PartidoId.HasValue)
        {
            throw new ArgumentException("El identificador del partido (PartidoId) es requerido.");
        }

        return await ActualizarResultadoAsync(dto.PartidoId.Value, dto, cancellationToken);
    }

    public async Task<Torneo?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Torneos
            .AsNoTracking()
            .Include(t => t.Equipos)
            .Include(t => t.PartidosTorneo)
                .ThenInclude(p => p.EquipoLocal)
            .Include(t => t.PartidosTorneo)
                .ThenInclude(p => p.EquipoVisita)
            .Include(t => t.PartidosTorneo)
                .ThenInclude(p => p.Ganador)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Torneo>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Torneos
            .AsNoTracking()
            .Include(t => t.Equipos)
            .Include(t => t.PartidosTorneo)
                .ThenInclude(p => p.EquipoLocal)
            .Include(t => t.PartidosTorneo)
                .ThenInclude(p => p.EquipoVisita)
            .Include(t => t.PartidosTorneo)
                .ThenInclude(p => p.Ganador)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<PartidoTorneo>> ObtenerPartidosPorTorneoAsync(int torneoId, CancellationToken cancellationToken = default)
    {
        return await _context.PartidosTorneo
            .AsNoTracking()
            .Include(p => p.EquipoLocal)
            .Include(p => p.EquipoVisita)
            .Include(p => p.Ganador)
            .Where(p => p.TorneoId == torneoId)
            .ToListAsync(cancellationToken);
    }

    public async Task<Torneo> ActualizarTorneoAsync(int id, TorneoCreateDTO dto, CancellationToken cancellationToken = default)
    {
        if (dto == null)
        {
            throw new ArgumentException("Los datos del torneo son obligatorios.");
        }

        var torneo = await _context.Torneos
            .Include(t => t.Equipos)
            .Include(t => t.PartidosTorneo)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (torneo == null)
        {
            throw new NotFoundException($"No se encontró el torneo con ID {id}.");
        }

        var ahora = DateTime.Now;
        var diasDiferencia = (dto.FechaInicio.Date - ahora.Date).TotalDays;
        if (diasDiferencia < 14 || diasDiferencia > 31)
        {
            throw new ArgumentException($"La fecha de inicio debe tener entre 15 y 30 días de anticipación a partir de hoy (DateTime.Now). Valor recibido: {dto.FechaInicio:yyyy-MM-dd}.");
        }

        torneo.Nombre = dto.Nombre.Trim();
        torneo.RangoEdad = dto.RangoEdad.Trim();
        torneo.FechaInicio = dto.FechaInicio.Date;
        if (dto.GeneroId > 0) torneo.GeneroId = dto.GeneroId;
        if (dto.EstadoId > 0) torneo.EstadoId = dto.EstadoId;

        await _context.SaveChangesAsync(cancellationToken);
        return torneo;
    }
}
