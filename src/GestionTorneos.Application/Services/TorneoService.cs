using GestionTorneos.Application.DTOs.Torneos;
using GestionTorneos.Application.Interfaces.Services;
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

    private const string ESTADO_PROGRAMADO = "Programado";
    private const string ESTADO_ACTIVO = "Activo";
    private const string ESTADO_FINALIZADO = "Finalizado";

    private const string FASE_OCTAVOS = "Octavos de Final";
    private const string FASE_CUARTOS = "Cuartos de Final";
    private const string FASE_SEMIFINALES = "Semifinales";

    public TorneoService(ApplicationDbContext context, ILogger<TorneoService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<TorneoResponseDTO>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Torneos
            .AsNoTracking()
            .Include(t => t.UsuarioAdmin)
            .Include(t => t.EstadoTorneo)
            .Include(t => t.CategoriaGenero)
            .Include(t => t.Equipos)
            .Include(t => t.Partidos)
                .ThenInclude(p => p.EquipoLocal)
            .Include(t => t.Partidos)
                .ThenInclude(p => p.EquipoVisita)
            .Include(t => t.Partidos)
                .ThenInclude(p => p.Ganador)
            .Select(t => MapToResponseDTO(t))
            .ToListAsync(cancellationToken);
    }

    public async Task<TorneoResponseDTO> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var torneo = await _context.Torneos
            .AsNoTracking()
            .Include(t => t.UsuarioAdmin)
            .Include(t => t.EstadoTorneo)
            .Include(t => t.CategoriaGenero)
            .Include(t => t.Equipos)
            .Include(t => t.Partidos)
                .ThenInclude(p => p.EquipoLocal)
            .Include(t => t.Partidos)
                .ThenInclude(p => p.EquipoVisita)
            .Include(t => t.Partidos)
                .ThenInclude(p => p.Ganador)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (torneo == null)
        {
            throw new NotFoundException($"No se encontró el torneo con ID {id}.");
        }

        return MapToResponseDTO(torneo);
    }

    public async Task<TorneoResponseDTO> CrearTorneoAsync(TorneoCreateDTO dto, CancellationToken cancellationToken = default)
    {
        // 1. Regla de Negocio: Validaciones de Tiempo (Mínimo 7 días y máximo 20 días de anticipación)
        var hoy = DateTime.Today;
        var fechaInicio = dto.FechaInicio.Date;
        var diasDiferencia = (fechaInicio - hoy).TotalDays;

        if (diasDiferencia < 7 || diasDiferencia > 20)
        {
            throw new BusinessRuleException(
                $"Los torneos deben solicitarse con un mínimo de 7 días y un máximo de 20 días de anticipación respecto a la fecha actual ({hoy:yyyy-MM-dd}).");
        }

        // 2. Validar que exista el administrador
        var adminExiste = await _context.Usuarios
            .AnyAsync(u => u.Id == dto.UsuarioAdminId, cancellationToken);

        if (!adminExiste)
        {
            throw new NotFoundException($"El usuario administrador con ID {dto.UsuarioAdminId} no existe.");
        }

        // 3. Validar que exista la categoría de género
        var generoExiste = await _context.CategoriasGenero
            .AnyAsync(g => g.Id == dto.GeneroId, cancellationToken);

        if (!generoExiste)
        {
            throw new NotFoundException($"La categoría de género con ID {dto.GeneroId} no existe.");
        }

        // 4. Obtener estado inicial 'Programado'
        var estadoProgramado = await _context.EstadosTorneo
            .FirstOrDefaultAsync(e => e.NombreEstado == ESTADO_PROGRAMADO, cancellationToken)
            ?? throw new BusinessRuleException($"El estado '{ESTADO_PROGRAMADO}' no está configurado en el catálogo de base de datos.");

        var nuevoTorneo = new Torneo
        {
            UsuarioAdminId = dto.UsuarioAdminId,
            EstadoId = estadoProgramado.Id,
            GeneroId = dto.GeneroId,
            Nombre = dto.Nombre.Trim(),
            RangoEdad = dto.RangoEdad.Trim(),
            FechaInicio = fechaInicio
        };

        _context.Torneos.Add(nuevoTorneo);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Torneo '{Nombre}' creado exitosamente con ID {Id}.", nuevoTorneo.Nombre, nuevoTorneo.Id);

        return await GetByIdAsync(nuevoTorneo.Id, cancellationToken);
    }

    public async Task<EquipoResponseDTO> RegistrarEquipoAsync(int torneoId, EquipoCreateDTO dto, CancellationToken cancellationToken = default)
    {
        var torneo = await _context.Torneos
            .Include(t => t.Equipos)
            .Include(t => t.EstadoTorneo)
            .FirstOrDefaultAsync(t => t.Id == torneoId, cancellationToken)
            ?? throw new NotFoundException($"No se encontró el torneo con ID {torneoId}.");

        if (torneo.EstadoTorneo.NombreEstado == ESTADO_FINALIZADO)
        {
            throw new BusinessRuleException("No es posible inscribir equipos en un torneo finalizado.");
        }

        // Regla de Negocio: Límite máximo de 16 equipos por torneo
        if (torneo.Equipos.Count >= 16)
        {
            throw new BusinessRuleException("El torneo ha alcanzado el límite máximo permitido de 16 equipos.");
        }

        // Validar unicidad del nombre en el torneo
        var nombreExiste = torneo.Equipos.Any(e => e.NombreEquipo.Equals(dto.NombreEquipo.Trim(), StringComparison.OrdinalIgnoreCase));
        if (nombreExiste)
        {
            throw new BusinessRuleException($"Ya existe un equipo registrado con el nombre '{dto.NombreEquipo}' en este torneo.");
        }

        var nuevoEquipo = new Equipo
        {
            TorneoId = torneoId,
            NombreEquipo = dto.NombreEquipo.Trim(),
            NombreRepresentante = dto.NombreRepresentante.Trim()
        };

        _context.Equipos.Add(nuevoEquipo);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Equipo '{Nombre}' registrado en el torneo {TorneoId}.", nuevoEquipo.NombreEquipo, torneoId);

        return new EquipoResponseDTO
        {
            Id = nuevoEquipo.Id,
            TorneoId = nuevoEquipo.TorneoId,
            NombreEquipo = nuevoEquipo.NombreEquipo,
            NombreRepresentante = nuevoEquipo.NombreRepresentante
        };
    }

    public async Task<IEnumerable<PartidoResponseDTO>> GenerarFixtureAsync(int torneoId, CancellationToken cancellationToken = default)
    {
        var torneo = await _context.Torneos
            .Include(t => t.Equipos)
            .Include(t => t.Partidos)
            .FirstOrDefaultAsync(t => t.Id == torneoId, cancellationToken)
            ?? throw new NotFoundException($"No se encontró el torneo con ID {torneoId}.");

        if (torneo.Partidos.Any())
        {
            throw new BusinessRuleException("El fixture de partidos para este torneo ya ha sido generado previamente.");
        }

        var totalEquipos = torneo.Equipos.Count;
        if (totalEquipos < 2)
        {
            throw new BusinessRuleException("Se requieren al menos 2 equipos inscritos para generar las llaves del torneo.");
        }

        if (totalEquipos > 16)
        {
            throw new BusinessRuleException("El torneo supera el límite máximo de 16 equipos.");
        }

        // Determinar fase inicial según cantidad de equipos (Octavos, Cuartos o Semifinales)
        string faseInicial;
        if (totalEquipos > 8)
        {
            faseInicial = FASE_OCTAVOS;
        }
        else if (totalEquipos > 4)
        {
            faseInicial = FASE_CUARTOS;
        }
        else
        {
            faseInicial = FASE_SEMIFINALES;
        }

        var equiposLista = torneo.Equipos.OrderBy(e => e.Id).ToList();
        var nuevosPartidos = new List<PartidoTorneo>();

        for (int i = 0; i < equiposLista.Count; i += 2)
        {
            var local = equiposLista[i];
            Equipo? visita = (i + 1 < equiposLista.Count) ? equiposLista[i + 1] : null;

            var partido = new PartidoTorneo
            {
                TorneoId = torneoId,
                Fase = faseInicial,
                EquipoLocalId = local.Id,
                EquipoVisitaId = visita?.Id,
                GolesLocal = null,
                GolesVisita = null,
                GanadorId = null
            };

            // Regla de Negocio: Manejo de llaves impares (Pase directo automático)
            if (visita == null)
            {
                partido.GolesLocal = 3;
                partido.GolesVisita = 0;
                partido.GanadorId = local.Id;
            }

            nuevosPartidos.Add(partido);
        }

        _context.PartidosTorneo.AddRange(nuevosPartidos);

        // Actualizar estado del torneo a 'Activo'
        var estadoActivo = await _context.EstadosTorneo
            .FirstOrDefaultAsync(e => e.NombreEstado == ESTADO_ACTIVO, cancellationToken);
        if (estadoActivo != null)
        {
            torneo.EstadoId = estadoActivo.Id;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Fixture generado para torneo {TorneoId} con fase inicial '{Fase}'.", torneoId, faseInicial);

        var torneoActualizado = await GetByIdAsync(torneoId, cancellationToken);
        return torneoActualizado.Partidos;
    }

    public async Task<PartidoResponseDTO> ActualizarMarcadorAsync(int partidoId, PartidoUpdateResultadoDTO dto, CancellationToken cancellationToken = default)
    {
        var partido = await _context.PartidosTorneo
            .Include(p => p.Torneo)
            .Include(p => p.EquipoLocal)
            .Include(p => p.EquipoVisita)
            .FirstOrDefaultAsync(p => p.Id == partidoId, cancellationToken)
            ?? throw new NotFoundException($"No se encontró el partido con ID {partidoId}.");

        // Manejo de pase directo
        if (partido.EquipoVisitaId == null)
        {
            partido.GolesLocal = 3;
            partido.GolesVisita = 0;
            partido.GanadorId = partido.EquipoLocalId;
        }
        else
        {
            partido.GolesLocal = dto.GolesLocal;
            partido.GolesVisita = dto.GolesVisita;

            if (dto.GolesLocal > dto.GolesVisita)
            {
                partido.GanadorId = partido.EquipoLocalId;
            }
            else if (dto.GolesVisita > dto.GolesLocal)
            {
                partido.GanadorId = partido.EquipoVisitaId;
            }
            else
            {
                // En empate, validar el ganador indicado (desempate o penales)
                if (!dto.GanadorId.HasValue || (dto.GanadorId != partido.EquipoLocalId && dto.GanadorId != partido.EquipoVisitaId))
                {
                    throw new BusinessRuleException("En caso de empate en goles, debe especificar un GanadorId válido entre el equipo local y el visitante.");
                }
                partido.GanadorId = dto.GanadorId;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Evaluar si todos los partidos de la fase actual han finalizado para generar la siguiente llave
        await EvaluarSiguienteFaseAsync(partido.TorneoId, partido.Fase, cancellationToken);

        var partidoActualizado = await _context.PartidosTorneo
            .AsNoTracking()
            .Include(p => p.EquipoLocal)
            .Include(p => p.EquipoVisita)
            .Include(p => p.Ganador)
            .FirstAsync(p => p.Id == partidoId, cancellationToken);

        return MapPartidoToDTO(partidoActualizado);
    }

    private async Task EvaluarSiguienteFaseAsync(int torneoId, string faseActual, CancellationToken cancellationToken)
    {
        var partidosFase = await _context.PartidosTorneo
            .Where(p => p.TorneoId == torneoId && p.Fase == faseActual)
            .ToListAsync(cancellationToken);

        // Si aún hay partidos sin ganador en la fase, esperar a que terminen
        if (partidosFase.Any(p => !p.GanadorId.HasValue))
        {
            return;
        }

        // Obtener lista de ganadores ordenados
        var ganadoresIds = partidosFase
            .Select(p => p.GanadorId!.Value)
            .ToList();

        string? siguienteFase = faseActual switch
        {
            FASE_OCTAVOS => FASE_CUARTOS,
            FASE_CUARTOS => FASE_SEMIFINALES,
            _ => null
        };

        if (siguienteFase != null)
        {
            // Validar que no existan ya partidos en la siguiente fase
            var yaGenerada = await _context.PartidosTorneo
                .AnyAsync(p => p.TorneoId == torneoId && p.Fase == siguienteFase, cancellationToken);

            if (!yaGenerada && ganadoresIds.Count >= 2)
            {
                var nuevosPartidos = new List<PartidoTorneo>();
                for (int i = 0; i < ganadoresIds.Count; i += 2)
                {
                    var localId = ganadoresIds[i];
                    int? visitaId = (i + 1 < ganadoresIds.Count) ? ganadoresIds[i + 1] : null;

                    var nuevoPartido = new PartidoTorneo
                    {
                        TorneoId = torneoId,
                        Fase = siguienteFase,
                        EquipoLocalId = localId,
                        EquipoVisitaId = visitaId,
                        GolesLocal = visitaId == null ? 3 : null,
                        GolesVisita = visitaId == null ? 0 : null,
                        GanadorId = visitaId == null ? localId : null
                    };

                    nuevosPartidos.Add(nuevoPartido);
                }

                _context.PartidosTorneo.AddRange(nuevosPartidos);
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Generada automáticamente la fase '{SiguienteFase}' para el torneo {TorneoId}.", siguienteFase, torneoId);
            }
        }
        else if (faseActual == FASE_SEMIFINALES)
        {
            // Regla de Negocio de IdeaPrincipal.md:
            // "La Final no forma parte del árbol automatizado; se gestionará operativamente como una reserva de hora convencional."
            // Se actualiza el torneo a 'Finalizado'.
            var torneo = await _context.Torneos.FindAsync(new object[] { torneoId }, cancellationToken);
            var estadoFinalizado = await _context.EstadosTorneo
                .FirstOrDefaultAsync(e => e.NombreEstado == ESTADO_FINALIZADO, cancellationToken);

            if (torneo != null && estadoFinalizado != null)
            {
                torneo.EstadoId = estadoFinalizado.Id;
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Torneo {TorneoId} concluido en su etapa automatizada de Semifinales. Marcado como Finalizado.", torneoId);
            }
        }
    }

    private static TorneoResponseDTO MapToResponseDTO(Torneo t)
    {
        return new TorneoResponseDTO
        {
            Id = t.Id,
            Nombre = t.Nombre,
            UsuarioAdminId = t.UsuarioAdminId,
            NombreAdmin = t.UsuarioAdmin?.NombreCompleto ?? string.Empty,
            EstadoId = t.EstadoId,
            NombreEstado = t.EstadoTorneo?.NombreEstado ?? string.Empty,
            GeneroId = t.GeneroId,
            NombreGenero = t.CategoriaGenero?.NombreCategoria ?? string.Empty,
            RangoEdad = t.RangoEdad,
            FechaInicio = t.FechaInicio,
            TotalEquipos = t.Equipos.Count,
            Equipos = t.Equipos.Select(e => new EquipoResponseDTO
            {
                Id = e.Id,
                TorneoId = e.TorneoId,
                NombreEquipo = e.NombreEquipo,
                NombreRepresentante = e.NombreRepresentante
            }).ToList(),
            Partidos = t.Partidos.Select(p => MapPartidoToDTO(p)).ToList()
        };
    }

    private static PartidoResponseDTO MapPartidoToDTO(PartidoTorneo p)
    {
        return new PartidoResponseDTO
        {
            Id = p.Id,
            TorneoId = p.TorneoId,
            Fase = p.Fase,
            EquipoLocalId = p.EquipoLocalId,
            NombreEquipoLocal = p.EquipoLocal?.NombreEquipo,
            EquipoVisitaId = p.EquipoVisitaId,
            NombreEquipoVisita = p.EquipoVisita?.NombreEquipo,
            GolesLocal = p.GolesLocal,
            GolesVisita = p.GolesVisita,
            GanadorId = p.GanadorId,
            NombreGanador = p.Ganador?.NombreEquipo
        };
    }
}
