using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using FutsalPro.IntegrationTests.Infrastructure;
using GestionTorneos.Application.DTOs;
using GestionTorneos.Domain.Entities;
using Xunit;

namespace FutsalPro.IntegrationTests.Endpoints;

/// <summary>
/// Pruebas de integración para los endpoints de Torneos y Resultados de partidos conforme al estándar ISO/IEC/IEEE 29119.
/// Casos CP24 a CP30: Validación de creación de torneos, fixtures con bye, resultados de partidos, goles negativos, penales y finalización con pendientes.
/// </summary>
public class TorneosResultadosEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public TorneosResultadosEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        // Autenticación con token JWT de prueba
        var token = factory.GenerateTestJwtToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    /// <summary>
    /// Método auxiliar para crear un torneo aislado con sus partidos en cada prueba.
    /// Garantiza la independencia de las pruebas y la obtención de IDs reales de partidos.
    /// </summary>
    private async Task<Torneo> CrearTorneoDePruebaAsync(string nombre, List<string> equipos)
    {
        var dto = new TorneoCreateDTO
        {
            Nombre = nombre,
            RangoEdad = "Libre",
            FechaInicio = DateTime.Now.AddDays(20),
            GeneroId = 1,
            UsuarioAdminId = 1,
            EstadoId = 1,
            Equipos = equipos
        };

        var response = await _client.PostAsJsonAsync("/api/Torneos", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var torneo = await response.Content.ReadFromJsonAsync<Torneo>(JsonOptions);
        torneo.Should().NotBeNull();
        return torneo!;
    }

    [Fact(DisplayName = "IT-CP24: CrearTorneo_SinEquipos_RetornaBadRequest")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "CP24")]
    [Trait("Responsable", "Dax")]
    public async Task CrearTorneo_SinEquipos_RetornaBadRequest()
    {
        // Arrange
        var dto = new TorneoCreateDTO
        {
            Nombre = "Torneo Sin Equipos " + Guid.NewGuid().ToString()[..6],
            RangoEdad = "Libre",
            FechaInicio = DateTime.Now.AddDays(20),
            GeneroId = 1,
            UsuarioAdminId = 1,
            EstadoId = 1,
            Equipos = new List<string>() // Lista vacía
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Torneos", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("El torneo debe incluir al menos un equipo participante.");
    }

    [Fact(DisplayName = "IT-CP25: CrearTorneo_Con7Equipos_GeneraFixtureConPaseDirectoBye")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "CP25")]
    [Trait("Responsable", "Dax")]
    public async Task CrearTorneo_Con7Equipos_GeneraFixtureConPaseDirectoBye()
    {
        // Arrange
        var equipos = new List<string>
        {
            "Equipo 1", "Equipo 2", "Equipo 3", "Equipo 4",
            "Equipo 5", "Equipo 6", "Equipo 7"
        };
        var dto = new TorneoCreateDTO
        {
            Nombre = "Torneo Impar 7 Equipos " + Guid.NewGuid().ToString()[..6],
            RangoEdad = "Sub-23",
            FechaInicio = DateTime.Now.AddDays(22),
            GeneroId = 1,
            UsuarioAdminId = 1,
            EstadoId = 1,
            Equipos = equipos
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Torneos", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var torneo = await response.Content.ReadFromJsonAsync<Torneo>(JsonOptions);

        torneo.Should().NotBeNull();
        torneo!.PartidosTorneo.Should().HaveCount(4, "7 equipos emparejados de dos en dos generan 4 llaves en Cuartos de Final");

        // El 4to partido debe tener EquipoVisitaId en null para simular el pase directo (bye)
        var partidoBye = torneo.PartidosTorneo.FirstOrDefault(p => p.EquipoVisitaId == null);
        partidoBye.Should().NotBeNull("el equipo impar debe avanzar directamente por pase directo (bye)");
        partidoBye!.EquipoLocalId.Should().NotBeNull();
    }

    [Fact(DisplayName = "IT-CP26: ActualizarResultado_LocalYVisitaGanador_DeterminaGanadoresCorrectamente")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "CP26")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarResultado_LocalYVisitaGanador_DeterminaGanadoresCorrectamente()
    {
        // Arrange: Crear torneo dentro de la prueba para obtener IDs reales
        var equipos = new List<string> { "Águilas", "Halcones", "Leones", "Tigres" };
        var torneo = await CrearTorneoDePruebaAsync("Torneo Resultados L/V " + Guid.NewGuid().ToString()[..6], equipos);

        var partidos = torneo.PartidosTorneo.OrderBy(p => p.Id).ToList();
        partidos.Should().HaveCount(2);

        var partidoLocalGana = partidos[0];
        var partidoVisitaGana = partidos[1];

        // Act 1: Actualizar primer partido donde gana Local
        var dtoLocalGana = new PartidoUpdateDTO
        {
            GolesLocal = 4,
            GolesVisita = 2
        };
        var respLocal = await _client.PutAsJsonAsync($"/api/Torneos/partidos/{partidoLocalGana.Id}", dtoLocalGana);

        // Act 2: Actualizar segundo partido donde gana Visita
        var dtoVisitaGana = new PartidoUpdateDTO
        {
            GolesLocal = 1,
            GolesVisita = 3
        };
        var respVisita = await _client.PutAsJsonAsync($"/api/Torneos/partidos/{partidoVisitaGana.Id}", dtoVisitaGana);

        // Assert
        respLocal.StatusCode.Should().Be(HttpStatusCode.OK);
        var res1 = await respLocal.Content.ReadFromJsonAsync<PartidoTorneo>(JsonOptions);
        res1!.GanadorId.Should().Be(partidoLocalGana.EquipoLocalId, "el equipo local anotó más goles (4 > 2)");

        respVisita.StatusCode.Should().Be(HttpStatusCode.OK);
        var res2 = await respVisita.Content.ReadFromJsonAsync<PartidoTorneo>(JsonOptions);
        res2!.GanadorId.Should().Be(partidoVisitaGana.EquipoVisitaId, "el equipo visitante anotó más goles (3 > 1)");
    }

    [Fact(DisplayName = "IT-CP27: ActualizarResultado_GolesNegativos_RetornaBadRequest")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "CP27")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarResultado_GolesNegativos_RetornaBadRequest()
    {
        // Arrange: Crear torneo dentro de la prueba para obtener ID de partido real
        var equipos = new List<string> { "Equipo Alfa", "Equipo Beta" };
        var torneo = await CrearTorneoDePruebaAsync("Torneo Goles Negativos " + Guid.NewGuid().ToString()[..6], equipos);
        var partido = torneo.PartidosTorneo.First();

        var dtoInvalido = new PartidoUpdateDTO
        {
            GolesLocal = -1, // Goles negativos no permitidos
            GolesVisita = 2
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/Torneos/partidos/{partido.Id}", dtoInvalido);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, "el modelo rechaza goles negativos por validación [Range(0, 100)]");
    }

    [Fact(DisplayName = "IT-CP28: ActualizarResultado_EmpateConGanadorPorPenales_RetornaOkYAsignaGanador")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "CP28")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarResultado_EmpateConGanadorPorPenales_RetornaOkYAsignaGanador()
    {
        // Arrange: Crear torneo dentro de la prueba para obtener IDs reales
        var equipos = new List<string> { "Rojos", "Azules" };
        var torneo = await CrearTorneoDePruebaAsync("Torneo Penales " + Guid.NewGuid().ToString()[..6], equipos);
        var partido = torneo.PartidosTorneo.First();

        // En caso de empate 2-2, se define ganador por penales indicando el ID del equipo vencedor
        var dtoEmpateConPenales = new PartidoUpdateDTO
        {
            GolesLocal = 2,
            GolesVisita = 2,
            GanadorId = partido.EquipoLocalId
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/Torneos/partidos/{partido.Id}", dtoEmpateConPenales);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var partidoActualizado = await response.Content.ReadFromJsonAsync<PartidoTorneo>(JsonOptions);
        partidoActualizado.Should().NotBeNull();
        partidoActualizado!.GolesLocal.Should().Be(2);
        partidoActualizado.GolesVisita.Should().Be(2);
        partidoActualizado.GanadorId.Should().Be(partido.EquipoLocalId, "en empate regular debe prevalecer el ganador definido por penales");
    }

    /// <summary>
    /// IT-CP29: EVIDENCIA DE DEFECTO PARA AZURE BOARDS
    /// El backend actual (TorneoService.cs línea 147) asigna `partido.GanadorId = dto.GanadorId;` directamente
    /// en caso de empate SIN validar si el GanadorId corresponde al EquipoLocalId o EquipoVisitaId del partido.
    /// Este test documenta y confirma este comportamiento permisivo actual.
    /// </summary>
    [Fact(DisplayName = "IT-CP29: ActualizarResultado_EmpateGanadorIdNoPerteneceAlPartido_DocumentaComportamientoPermisivo")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "CP29")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarResultado_EmpateGanadorIdNoPerteneceAlPartido_DocumentaComportamientoPermisivo()
    {
        // Arrange: Crear torneo dentro de la prueba
        var equipos = new List<string> { "Equipo Uno", "Equipo Dos" };
        var torneo = await CrearTorneoDePruebaAsync("Torneo Defecto Ganador " + Guid.NewGuid().ToString()[..6], equipos);
        var partido = torneo.PartidosTorneo.First();

        const int ganadorAjenoId = 99999; // ID de equipo que no pertenece a este partido

        var dtoEmpateConGanadorAjeno = new PartidoUpdateDTO
        {
            GolesLocal = 1,
            GolesVisita = 1,
            GanadorId = ganadorAjenoId
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/Torneos/partidos/{partido.Id}", dtoEmpateConGanadorAjeno);

        // Assert
        // DEFECTO REGISTRADO: El código no valida pertenencia y responde 200 OK asignando el ID ajeno
        response.StatusCode.Should().Be(HttpStatusCode.OK, "comportamiento actual del sistema (defecto reportado para Azure Boards)");
        var partidoActualizado = await response.Content.ReadFromJsonAsync<PartidoTorneo>(JsonOptions);
        partidoActualizado!.GanadorId.Should().Be(ganadorAjenoId, "evidencia del defecto: el backend permitió asignar un GanadorId ajeno al partido");
    }

    [Fact(DisplayName = "IT-CP30: ActualizarTorneo_FinalizarConPartidosPendientes_RetornaBadRequest")]
    [Trait("Modulo", "Torneos")]
    [Trait("CasoId", "CP30")]
    [Trait("Responsable", "Dax")]
    public async Task ActualizarTorneo_FinalizarConPartidosPendientes_RetornaBadRequest()
    {
        // Arrange: Crear torneo con partidos pendientes (sin jugar ni ganador)
        var equipos = new List<string> { "Pumas", "Jaguares", "Lobos", "Coyotes" };
        var torneo = await CrearTorneoDePruebaAsync("Torneo Incompleto " + Guid.NewGuid().ToString()[..6], equipos);

        var dtoFinalizar = new TorneoCreateDTO
        {
            EstadoId = 3, // Intentar pasar a Finalizado teniendo partidos pendientes
            Nombre = torneo.Nombre,
            RangoEdad = torneo.RangoEdad,
            FechaInicio = torneo.FechaInicio,
            GeneroId = torneo.GeneroId,
            UsuarioAdminId = torneo.UsuarioAdminId
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/Torneos/{torneo.Id}", dtoFinalizar);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("No se puede marcar el torneo como Finalizado. Aún hay");
    }
}
