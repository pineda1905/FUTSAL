using FluentAssertions;
using GestionTorneos.Application.DTOs.Reservas;
using GestionTorneos.Application.Services;
using GestionTorneos.Domain.Entities;
using GestionTorneos.Domain.Exceptions;
using GestionTorneos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FutsalPro.UnitTests.Services.Reservas;

/// <summary>
/// Pruebas unitarias para ReservaService conforme al estándar ISO/IEC/IEEE 29119.
/// Casos UT-2001 a UT-2008: Validaciones de creación de reservas.
/// Responsable: Anderson Pineda
/// </summary>
public class ReservaService_CrearTests
{
    private readonly Mock<ILogger<ReservaService>> _loggerMock = new();

    /// <summary>
    /// Crea un DbContext aislado con base de datos InMemory única por prueba.
    /// </summary>
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var context = new ApplicationDbContext(options);

        // Sembrado básico de datos de catálogo indispensables
        if (!context.EstadosReserva.Any())
        {
            context.EstadosReserva.AddRange(
                new EstadoReserva { Id = 1, NombreEstado = "Confirmada" },
                new EstadoReserva { Id = 2, NombreEstado = "Cancelada" }
            );
            context.SaveChanges();
        }

        if (!context.Canchas.Any())
        {
            context.Canchas.AddRange(
                new Cancha { Id = 1, Nombre = "Cancha Sintética 1" },
                new Cancha { Id = 2, Nombre = "Cancha Sintética 2" }
            );
            context.SaveChanges();
        }

        if (!context.Usuarios.Any())
        {
            context.Usuarios.Add(new Usuario
            {
                Id = 1,
                RolId = 1,
                NombreCompleto = "Anderson Administrador",
                Email = "anderson@futsalpro.com",
                PasswordHash = "hash123"
            });
            context.SaveChanges();
        }

        return context;
    }

    [Fact(DisplayName = "UT-2001: CrearReserva_DatosValidos_CreaReservaConEstadoConfirmada")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "2001")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_DatosValidos_CreaReservaConEstadoConfirmada()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new ReservaService(context, _loggerMock.Object);

        var dto = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "Carlos Alvarenga",
            TelefonoWhatsApp = "+503 7123-4567",
            FechaHoraInicio = DateTime.Now.AddDays(2).Date.AddHours(18),
            FechaHoraFin = DateTime.Now.AddDays(2).Date.AddHours(19),
            PrecioTotal = 10.00m
        };

        // Act
        var result = await service.CrearReservaAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.NombreCliente.Should().Be("Carlos Alvarenga");
        result.NombreEstado.Should().Be("Confirmada");
        result.PrecioTotal.Should().Be(10.00m);

        var enBaseDatos = await context.Reservas.FindAsync(result.Id);
        enBaseDatos.Should().NotBeNull();
        enBaseDatos!.NombreCliente.Should().Be("Carlos Alvarenga");
    }

    [Fact(DisplayName = "UT-2002: CrearReserva_AnticipacionMayorA10Dias_LanzaBusinessRuleException")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "2002")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_AnticipacionMayorA10Dias_LanzaBusinessRuleException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new ReservaService(context, _loggerMock.Object);

        // Fecha de inicio a 11 días en el futuro (supera el límite de 10 días)
        var dto = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "Mario Mendoza",
            TelefonoWhatsApp = "+503 7987-6543",
            FechaHoraInicio = DateTime.Now.AddDays(11),
            FechaHoraFin = DateTime.Now.AddDays(11).AddHours(1),
            PrecioTotal = 10.00m
        };

        // Act
        var act = async () => await service.CrearReservaAsync(dto);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*No es posible reservar con más de 10 días de anticipación*");
    }

    [Fact(DisplayName = "UT-2003: CrearReserva_FechaInicioRetroactiva_LanzaBusinessRuleException")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "2003")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_FechaInicioRetroactiva_LanzaBusinessRuleException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new ReservaService(context, _loggerMock.Object);

        // Fecha de inicio en el pasado (2 horas antes del momento actual)
        var dto = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "David Castillo",
            TelefonoWhatsApp = "+503 7000-1122",
            FechaHoraInicio = DateTime.Now.AddHours(-2),
            FechaHoraFin = DateTime.Now.AddHours(-1),
            PrecioTotal = 10.00m
        };

        // Act
        var act = async () => await service.CrearReservaAsync(dto);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("La fecha y hora de inicio no puede ser anterior al momento actual.");
    }

    [Fact(DisplayName = "UT-2004: CrearReserva_FechaFinMenorOIgualAInicio_LanzaBusinessRuleException")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "2004")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_FechaFinMenorOIgualAInicio_LanzaBusinessRuleException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new ReservaService(context, _loggerMock.Object);

        var inicio = DateTime.Now.AddDays(3).Date.AddHours(16);
        // Fecha fin igual a fecha de inicio
        var dto = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "Roberto Gómez",
            TelefonoWhatsApp = "+503 7222-3333",
            FechaHoraInicio = inicio,
            FechaHoraFin = inicio,
            PrecioTotal = 10.00m
        };

        // Act
        var act = async () => await service.CrearReservaAsync(dto);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("La fecha y hora de fin debe ser posterior a la fecha y hora de inicio.");
    }

    [Fact(DisplayName = "UT-2005: CrearReserva_CanchaInexistente_LanzaNotFoundException")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "2005")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_CanchaInexistente_LanzaNotFoundException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new ReservaService(context, _loggerMock.Object);

        // CanchaId = 999 no existe en la base de datos InMemory
        var dto = new ReservaCreateDTO
        {
            CanchaId = 999,
            UsuarioAdminId = 1,
            NombreCliente = "Cliente Cancha Fantasma",
            TelefonoWhatsApp = "+503 7444-5555",
            FechaHoraInicio = DateTime.Now.AddDays(2).Date.AddHours(10),
            FechaHoraFin = DateTime.Now.AddDays(2).Date.AddHours(11),
            PrecioTotal = 10.00m
        };

        // Act
        var act = async () => await service.CrearReservaAsync(dto);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("La cancha con ID 999 no existe.");
    }

    [Fact(DisplayName = "UT-2006: CrearReserva_HorarioSolapadoConReservaActiva_LanzaBusinessRuleException")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "2006")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_HorarioSolapadoConReservaActiva_LanzaBusinessRuleException()
    {
        // Arrange: Poblar contexto con reserva PREVIA ACTIVA en Cancha 1 (18:00 a 20:00)
        using var context = CreateInMemoryDbContext();
        var fechaBase = DateTime.Now.AddDays(4).Date;

        var reservaPreviaActiva = new Reserva
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            EstadoId = 1, // Confirmada (Activa)
            NombreCliente = "Cliente Previo Activo",
            TelefonoWhatsApp = "+503 7111-0000",
            FechaHoraInicio = fechaBase.AddHours(18),
            FechaHoraFin = fechaBase.AddHours(20),
            PrecioTotal = 20.00m,
            FechaRegistro = DateTime.Now
        };
        await context.Reservas.AddAsync(reservaPreviaActiva);
        await context.SaveChangesAsync();

        var service = new ReservaService(context, _loggerMock.Object);

        // DTO con horario que se cruza parcialmente (19:00 a 21:00) en la misma Cancha 1
        var dtoSolapado = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "Nuevo Cliente Solapado",
            TelefonoWhatsApp = "+503 7999-8888",
            FechaHoraInicio = fechaBase.AddHours(19),
            FechaHoraFin = fechaBase.AddHours(21),
            PrecioTotal = 20.00m
        };

        // Act
        var act = async () => await service.CrearReservaAsync(dtoSolapado);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("La cancha seleccionada ya cuenta con una reserva activa en el rango horario solicitado.");
    }

    [Fact(DisplayName = "UT-2007: CrearReserva_MismoHorarioConReservaCancelada_PermiteCreacionExitosa")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "2007")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_MismoHorarioConReservaCancelada_PermiteCreacionExitosa()
    {
        // Arrange: Poblar contexto con reserva PREVIA CANCELADA en Cancha 1 (18:00 a 20:00)
        using var context = CreateInMemoryDbContext();
        var fechaBase = DateTime.Now.AddDays(4).Date;

        var reservaPreviaCancelada = new Reserva
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            EstadoId = 2, // Cancelada
            NombreCliente = "Cliente que canceló",
            TelefonoWhatsApp = "+503 7111-0000",
            FechaHoraInicio = fechaBase.AddHours(18),
            FechaHoraFin = fechaBase.AddHours(20),
            PrecioTotal = 20.00m,
            MotivoCancelacion = "Lluvia intensa",
            FechaRegistro = DateTime.Now
        };
        await context.Reservas.AddAsync(reservaPreviaCancelada);
        await context.SaveChangesAsync();

        var service = new ReservaService(context, _loggerMock.Object);

        // DTO intentando reservar exactamente en el mismo horario liberado
        var dto = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "Nuevo Cliente en Horario Liberado",
            TelefonoWhatsApp = "+503 7777-6666",
            FechaHoraInicio = fechaBase.AddHours(18),
            FechaHoraFin = fechaBase.AddHours(20),
            PrecioTotal = 20.00m
        };

        // Act
        var result = await service.CrearReservaAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.NombreEstado.Should().Be("Confirmada");
        result.NombreCliente.Should().Be("Nuevo Cliente en Horario Liberado");
    }

    [Fact(DisplayName = "UT-2008: CrearReserva_UsuarioAdminInexistente_LanzaNotFoundException")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "2008")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_UsuarioAdminInexistente_LanzaNotFoundException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new ReservaService(context, _loggerMock.Object);

        // UsuarioAdminId = 999 no existe en la base de datos InMemory
        var dto = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 999,
            NombreCliente = "Cliente Sin Admin",
            TelefonoWhatsApp = "+503 7000-9999",
            FechaHoraInicio = DateTime.Now.AddDays(2).Date.AddHours(14),
            FechaHoraFin = DateTime.Now.AddDays(2).Date.AddHours(15),
            PrecioTotal = 10.00m
        };

        // Act
        var act = async () => await service.CrearReservaAsync(dto);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("El usuario administrador con ID 999 no existe.");
    }
}
