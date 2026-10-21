using FluentAssertions;
using GestionTorneos.Application.DTOs;
using GestionTorneos.Application.Services;
using GestionTorneos.Domain.Entities;
using GestionTorneos.Domain.Exceptions;
using GestionTorneos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FutsalPro.UnitTests.Services.Torneos;

/// <summary>
/// Pruebas unitarias para TorneoService conforme al estándar ISO/IEC/IEEE 29119.
/// Casos UT-2020 a UT-2025: Resultados de partidos, penales, finalización y cancelación de torneos.
/// </summary>
public class TorneoService_ResultadosTests
{
    private readonly Mock<ILogger<TorneoService>> _loggerMock = new();

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact(DisplayName = "UT-2020: TorneoService_ActualizarResultado_GolesLocalMayor_AsignaGanadorLocal")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "2020")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarResultado_GolesLocalMayor_AsignaGanadorLocal()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var torneo = new Torneo
        {
            Nombre = "Torneo Apertura",
            RangoEdad = "Libre",
            FechaInicio = DateTime.Now.AddDays(20),
            UsuarioAdminId = 1,
            EstadoId = 2,
            GeneroId = 1
        };
        context.Torneos.Add(torneo);
        await context.SaveChangesAsync();

        var local = new Equipo { TorneoId = torneo.Id, NombreEquipo = "Equipo A", NombreRepresentante = "Rep A" };
        var visita = new Equipo { TorneoId = torneo.Id, NombreEquipo = "Equipo B", NombreRepresentante = "Rep B" };
        context.Equipos.AddRange(local, visita);
        await context.SaveChangesAsync();

        var partido = new PartidoTorneo
        {
            TorneoId = torneo.Id,
            Fase = "Cuartos de Final",
            EquipoLocalId = local.Id,
            EquipoVisitaId = visita.Id
        };
        context.PartidosTorneo.Add(partido);
        await context.SaveChangesAsync();

        var service = new TorneoService(context, _loggerMock.Object);
        var dto = new PartidoUpdateDTO
        {
            GolesLocal = 3,
            GolesVisita = 1
        };

        // Act
        var resultado = await service.ActualizarResultadoAsync(partido.Id, dto);

        // Assert
        resultado.Should().NotBeNull();
        resultado.GanadorId.Should().Be(local.Id, "el equipo local anotó más goles");
        resultado.GolesLocal.Should().Be(3);
        resultado.GolesVisita.Should().Be(1);

        var partidoEnDb = await context.PartidosTorneo.FindAsync(partido.Id);
        partidoEnDb!.GanadorId.Should().Be(local.Id);
    }

    [Fact(DisplayName = "UT-2021: TorneoService_ActualizarResultado_GolesVisitaMayor_AsignaGanadorVisita")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "2021")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarResultado_GolesVisitaMayor_AsignaGanadorVisita()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var torneo = new Torneo
        {
            Nombre = "Torneo Clausura",
            RangoEdad = "Sub-20",
            FechaInicio = DateTime.Now.AddDays(18),
            UsuarioAdminId = 1,
            EstadoId = 2,
            GeneroId = 1
        };
        context.Torneos.Add(torneo);
        await context.SaveChangesAsync();

        var local = new Equipo { TorneoId = torneo.Id, NombreEquipo = "Tigres", NombreRepresentante = "Rep 1" };
        var visita = new Equipo { TorneoId = torneo.Id, NombreEquipo = "Leones", NombreRepresentante = "Rep 2" };
        context.Equipos.AddRange(local, visita);
        await context.SaveChangesAsync();

        var partido = new PartidoTorneo
        {
            TorneoId = torneo.Id,
            Fase = "Semifinal",
            EquipoLocalId = local.Id,
            EquipoVisitaId = visita.Id
        };
        context.PartidosTorneo.Add(partido);
        await context.SaveChangesAsync();

        var service = new TorneoService(context, _loggerMock.Object);
        var dto = new PartidoUpdateDTO
        {
            GolesLocal = 1,
            GolesVisita = 4
        };

        // Act
        var resultado = await service.ActualizarResultadoAsync(partido.Id, dto);

        // Assert
        resultado.Should().NotBeNull();
        resultado.GanadorId.Should().Be(visita.Id, "el equipo visitante anotó más goles");
        resultado.GolesLocal.Should().Be(1);
        resultado.GolesVisita.Should().Be(4);

        var partidoEnDb = await context.PartidosTorneo.FindAsync(partido.Id);
        partidoEnDb!.GanadorId.Should().Be(visita.Id);
    }

    [Fact(DisplayName = "UT-2022: TorneoService_ActualizarResultado_EmpateConPenales_AsignaGanadorIdProvisto")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "2022")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarResultado_EmpateConPenales_AsignaGanadorIdProvisto()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var torneo = new Torneo
        {
            Nombre = "Torneo Relámpago",
            RangoEdad = "Libre",
            FechaInicio = DateTime.Now.AddDays(16),
            UsuarioAdminId = 1,
            EstadoId = 2,
            GeneroId = 1
        };
        context.Torneos.Add(torneo);
        await context.SaveChangesAsync();

        var local = new Equipo { TorneoId = torneo.Id, NombreEquipo = "Halcones", NombreRepresentante = "Rep H" };
        var visita = new Equipo { TorneoId = torneo.Id, NombreEquipo = "Águilas", NombreRepresentante = "Rep A" };
        context.Equipos.AddRange(local, visita);
        await context.SaveChangesAsync();

        var partido = new PartidoTorneo
        {
            TorneoId = torneo.Id,
            Fase = "Final",
            EquipoLocalId = local.Id,
            EquipoVisitaId = visita.Id
        };
        context.PartidosTorneo.Add(partido);
        await context.SaveChangesAsync();

        var service = new TorneoService(context, _loggerMock.Object);
        var dto = new PartidoUpdateDTO
        {
            GolesLocal = 2,
            GolesVisita = 2,
            GanadorId = local.Id // Ganador definido en tanda de penales
        };

        // Act
        var resultado = await service.ActualizarResultadoAsync(partido.Id, dto);

        // Assert
        resultado.Should().NotBeNull();
        resultado.GolesLocal.Should().Be(2);
        resultado.GolesVisita.Should().Be(2);
        resultado.GanadorId.Should().Be(local.Id, "en caso de empate debe asignarse el GanadorId enviado por penales");

        var partidoEnDb = await context.PartidosTorneo.FindAsync(partido.Id);
        partidoEnDb!.GanadorId.Should().Be(local.Id);
    }

    [Fact(DisplayName = "UT-2023: TorneoService_ActualizarTorneo_FinalizarConPartidosPendientes_LanzaBusinessRuleException")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "2023")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarTorneo_FinalizarConPartidosPendientes_LanzaBusinessRuleException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var torneo = new Torneo
        {
            Nombre = "Torneo Nocturno",
            RangoEdad = "Libre",
            FechaInicio = DateTime.Now.AddDays(25),
            UsuarioAdminId = 1,
            EstadoId = 2, // En Curso
            GeneroId = 1
        };
        context.Torneos.Add(torneo);
        await context.SaveChangesAsync();

        var local = new Equipo { TorneoId = torneo.Id, NombreEquipo = "Equipo X", NombreRepresentante = "Rep X" };
        var visita = new Equipo { TorneoId = torneo.Id, NombreEquipo = "Equipo Y", NombreRepresentante = "Rep Y" };
        context.Equipos.AddRange(local, visita);
        await context.SaveChangesAsync();

        // Partido pendiente sin jugar ni ganador
        var partidoPendiente = new PartidoTorneo
        {
            TorneoId = torneo.Id,
            Fase = "Cuartos de Final",
            EquipoLocalId = local.Id,
            EquipoVisitaId = visita.Id,
            GolesLocal = null,
            GolesVisita = null,
            GanadorId = null
        };
        context.PartidosTorneo.Add(partidoPendiente);
        await context.SaveChangesAsync();

        var service = new TorneoService(context, _loggerMock.Object);
        var dto = new TorneoCreateDTO
        {
            EstadoId = 3, // Intentar marcar como Finalizado
            Nombre = torneo.Nombre,
            RangoEdad = torneo.RangoEdad,
            FechaInicio = torneo.FechaInicio,
            GeneroId = torneo.GeneroId,
            UsuarioAdminId = torneo.UsuarioAdminId
        };

        // Act
        Func<Task> act = async () => await service.ActualizarTorneoAsync(torneo.Id, dto);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*No se puede marcar el torneo como Finalizado. Aún hay*partido(s) pendiente(s) de jugar o sin ganador definido.*");
    }

    [Fact(DisplayName = "UT-2024: TorneoService_ActualizarTorneo_CancelarSinMotivo_LanzaBusinessRuleException")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "2024")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarTorneo_CancelarSinMotivo_LanzaBusinessRuleException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var torneo = new Torneo
        {
            Nombre = "Torneo Empresarial",
            RangoEdad = "Libre",
            FechaInicio = DateTime.Now.AddDays(20),
            UsuarioAdminId = 1,
            EstadoId = 1, // Abierto
            GeneroId = 1
        };
        context.Torneos.Add(torneo);
        await context.SaveChangesAsync();

        var service = new TorneoService(context, _loggerMock.Object);
        var dto = new TorneoCreateDTO
        {
            EstadoId = 4, // Cancelado
            MotivoCancelacion = "   ", // Vacío / sin motivo
            Nombre = torneo.Nombre,
            RangoEdad = torneo.RangoEdad,
            FechaInicio = torneo.FechaInicio,
            GeneroId = torneo.GeneroId,
            UsuarioAdminId = torneo.UsuarioAdminId
        };

        // Act
        Func<Task> act = async () => await service.ActualizarTorneoAsync(torneo.Id, dto);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Para cancelar el torneo es obligatorio ingresar una justa razón (motivo de cancelación).");
    }

    [Fact(DisplayName = "UT-2025: TorneoService_ActualizarEquipo_EquipoInexistente_LanzaNotFoundException")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "2025")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarEquipo_EquipoInexistente_LanzaNotFoundException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new TorneoService(context, _loggerMock.Object);
        const int idInexistente = 99999;

        // Act
        Func<Task> act = async () => await service.ActualizarEquipoAsync(idInexistente, "Nuevo Nombre Equipo");

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"No se encontró el equipo con ID {idInexistente}.");
    }
}
