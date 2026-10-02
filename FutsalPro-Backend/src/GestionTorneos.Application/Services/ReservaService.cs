using GestionTorneos.Application.DTOs.Reservas;
using GestionTorneos.Application.Interfaces.Services;
using GestionTorneos.Domain.Entities;
using GestionTorneos.Domain.Exceptions;
using GestionTorneos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GestionTorneos.Application.Services;

public class ReservaService : IReservaService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReservaService> _logger;

    private const string ESTADO_CANCELADA = "Cancelada";
    private const string ESTADO_CONFIRMADA = "Confirmada";

    public ReservaService(ApplicationDbContext context, ILogger<ReservaService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<ReservaResponseDTO>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Reservas
            .AsNoTracking()
            .Include(r => r.Cancha)
            .Include(r => r.UsuarioAdmin)
            .Include(r => r.EstadoReserva)
            .Select(r => MapToResponseDTO(r))
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ReservaResponseDTO>> GetActivasAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Reservas
            .AsNoTracking()
            .Include(r => r.Cancha)
            .Include(r => r.UsuarioAdmin)
            .Include(r => r.EstadoReserva)
            .Where(r => r.EstadoReserva.NombreEstado != ESTADO_CANCELADA)
            .Select(r => MapToResponseDTO(r))
            .ToListAsync(cancellationToken);
    }

    public async Task<ReservaResponseDTO> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var reserva = await _context.Reservas
            .AsNoTracking()
            .Include(r => r.Cancha)
            .Include(r => r.UsuarioAdmin)
            .Include(r => r.EstadoReserva)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (reserva == null)
        {
            throw new NotFoundException($"No se encontró la reserva con ID {id}.");
        }

        return MapToResponseDTO(reserva);
    }

    public async Task<ReservaResponseDTO> CrearReservaAsync(ReservaCreateDTO dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Iniciando creación de reserva para cliente '{Cliente}' en la cancha #{CanchaId}", 
            dto.NombreCliente, dto.CanchaId);

        var ahora = DateTime.Now;

        // REGLA DE NEGOCIO OBLIGATORIA: FechaHoraInicio no superior a 10 días desde el momento actual
        var limiteMaximo = ahora.AddDays(10);
        if (dto.FechaHoraInicio > limiteMaximo)
        {
            throw new BusinessRuleException(
                $"No es posible reservar con más de 10 días de anticipación. Límite máximo permitido: {limiteMaximo:dd/MM/yyyy HH:mm}.");
        }

        // Validación de coherencia temporal
        if (dto.FechaHoraInicio < ahora)
        {
            throw new BusinessRuleException("La fecha y hora de inicio no puede ser anterior al momento actual.");
        }

        if (dto.FechaHoraFin <= dto.FechaHoraInicio)
        {
            throw new BusinessRuleException("La fecha y hora de fin debe ser posterior a la fecha y hora de inicio.");
        }

        // Validación de existencia de Cancha
        var canchaExiste = await _context.Canchas.AnyAsync(c => c.Id == dto.CanchaId, cancellationToken);
        if (!canchaExiste)
        {
            throw new NotFoundException($"La cancha con ID {dto.CanchaId} no existe.");
        }

        // Validación de existencia de Usuario Administrador
        var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.Id == dto.UsuarioAdminId, cancellationToken);
        if (!usuarioExiste)
        {
            throw new NotFoundException($"El usuario administrador con ID {dto.UsuarioAdminId} no existe.");
        }

        // Validación preventiva: solapamiento de horario en la misma cancha
        var horarioSolapado = await _context.Reservas
            .Include(r => r.EstadoReserva)
            .AnyAsync(r => 
                r.CanchaId == dto.CanchaId &&
                r.EstadoReserva.NombreEstado != ESTADO_CANCELADA &&
                dto.FechaHoraInicio < r.FechaHoraFin && 
                dto.FechaHoraFin > r.FechaHoraInicio, 
                cancellationToken);

        if (horarioSolapado)
        {
            throw new BusinessRuleException("La cancha seleccionada ya cuenta con una reserva activa en el rango horario solicitado.");
        }

        // Obtener estado inicial (por defecto 'Confirmada' o el primer estado activo registrado)
        var estadoInicial = await _context.EstadosReserva
            .FirstOrDefaultAsync(e => e.NombreEstado == ESTADO_CONFIRMADA, cancellationToken)
            ?? await _context.EstadosReserva.FirstOrDefaultAsync(cancellationToken);

        if (estadoInicial == null)
        {
            throw new BusinessRuleException("No existen estados de reserva configurados en el sistema.");
        }

        var nuevaReserva = new Reserva
        {
            CanchaId = dto.CanchaId,
            UsuarioAdminId = dto.UsuarioAdminId,
            EstadoId = estadoInicial.Id,
            NombreCliente = dto.NombreCliente.Trim(),
            TelefonoWhatsApp = dto.TelefonoWhatsApp.Trim(),
            FechaHoraInicio = dto.FechaHoraInicio,
            FechaHoraFin = dto.FechaHoraFin,
            PrecioTotal = dto.PrecioTotal,
            FechaRegistro = DateTime.Now
        };

        await _context.Reservas.AddAsync(nuevaReserva, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Reserva #{ReservaId} creada exitosamente.", nuevaReserva.Id);

        return await GetByIdAsync(nuevaReserva.Id, cancellationToken);
    }

    public async Task<ReservaResponseDTO> ActualizarReservaAsync(int id, ReservaCreateDTO dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Iniciando actualización de la reserva #{ReservaId}", id);

        var reserva = await _context.Reservas
            .Include(r => r.EstadoReserva)
            .Include(r => r.Cancha)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (reserva == null)
        {
            throw new NotFoundException($"No se encontró la reserva con ID {id}.");
        }

        var ahora = DateTime.Now;
        var limiteMaximo = ahora.AddDays(10);
        if (dto.FechaHoraInicio > limiteMaximo)
        {
            throw new BusinessRuleException(
                $"No es posible reservar con más de 10 días de anticipación. Límite máximo permitido: {limiteMaximo:dd/MM/yyyy HH:mm}.");
        }

        if (dto.FechaHoraInicio < ahora)
        {
            throw new BusinessRuleException("La fecha y hora de inicio no puede ser anterior al momento actual.");
        }

        if (dto.FechaHoraFin <= dto.FechaHoraInicio)
        {
            throw new BusinessRuleException("La fecha y hora de fin debe ser posterior a la fecha y hora de inicio.");
        }

        // Validar solapamiento excluyendo la propia reserva que se edita
        var horarioSolapado = await _context.Reservas
            .Include(r => r.EstadoReserva)
            .AnyAsync(r =>
                r.Id != id &&
                r.CanchaId == dto.CanchaId &&
                r.EstadoReserva.NombreEstado != ESTADO_CANCELADA &&
                dto.FechaHoraInicio < r.FechaHoraFin &&
                dto.FechaHoraFin > r.FechaHoraInicio,
                cancellationToken);

        if (horarioSolapado)
        {
            throw new BusinessRuleException("La cancha seleccionada ya cuenta con una reserva activa en el rango horario solicitado.");
        }

        reserva.CanchaId = dto.CanchaId;
        reserva.NombreCliente = dto.NombreCliente.Trim();
        reserva.TelefonoWhatsApp = dto.TelefonoWhatsApp.Trim();
        reserva.FechaHoraInicio = dto.FechaHoraInicio;
        reserva.FechaHoraFin = dto.FechaHoraFin;
        reserva.PrecioTotal = dto.PrecioTotal;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Reserva #{ReservaId} actualizada exitosamente.", id);

        return await GetByIdAsync(reserva.Id, cancellationToken);
    }

    public async Task<ReservaResponseDTO> CancelarReservaAsync(int id, ReservaCancelDTO dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Iniciando proceso de cancelación de la reserva #{ReservaId}", id);

        // REGLA DE NEGOCIO OBLIGATORIA: Validar que MotivoCancelacion no venga nulo ni vacío
        if (string.IsNullOrWhiteSpace(dto.MotivoCancelacion))
        {
            throw new BusinessRuleException("El motivo de cancelación es obligatorio y no puede estar vacío.");
        }

        var reserva = await _context.Reservas
            .Include(r => r.EstadoReserva)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (reserva == null)
        {
            throw new NotFoundException($"No se encontró la reserva con ID {id}.");
        }

        if (reserva.EstadoReserva.NombreEstado.Equals(ESTADO_CANCELADA, StringComparison.OrdinalIgnoreCase))
        {
            throw new BusinessRuleException("La reserva ya se encuentra cancelada.");
        }

        // REGLA DE NEGOCIO OBLIGATORIA: Actualizar el EstadoId al ID correspondiente a 'Cancelada'
        var estadoCancelada = await _context.EstadosReserva
            .FirstOrDefaultAsync(e => e.NombreEstado == ESTADO_CANCELADA, cancellationToken);

        if (estadoCancelada == null)
        {
            throw new BusinessRuleException($"El estado '{ESTADO_CANCELADA}' no se encuentra registrado en el catálogo de estados.");
        }

        reserva.EstadoId = estadoCancelada.Id;
        reserva.MotivoCancelacion = dto.MotivoCancelacion.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Reserva #{ReservaId} cancelada exitosamente.", reserva.Id);

        return await GetByIdAsync(reserva.Id, cancellationToken);
    }

    private static ReservaResponseDTO MapToResponseDTO(Reserva r) => new()
    {
        Id = r.Id,
        CanchaId = r.CanchaId,
        NombreCancha = r.Cancha?.Nombre ?? string.Empty,
        UsuarioAdminId = r.UsuarioAdminId,
        NombreUsuarioAdmin = r.UsuarioAdmin?.NombreCompleto ?? string.Empty,
        EstadoId = r.EstadoId,
        NombreEstado = r.EstadoReserva?.NombreEstado ?? string.Empty,
        NombreCliente = r.NombreCliente,
        TelefonoWhatsApp = r.TelefonoWhatsApp,
        FechaHoraInicio = r.FechaHoraInicio,
        FechaHoraFin = r.FechaHoraFin,
        PrecioTotal = r.PrecioTotal,
        MotivoCancelacion = r.MotivoCancelacion,
        FechaRegistro = r.FechaRegistro
    };
}
