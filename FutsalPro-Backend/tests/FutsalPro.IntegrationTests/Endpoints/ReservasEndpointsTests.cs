using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using FutsalPro.IntegrationTests.Infrastructure;
using GestionTorneos.Application.DTOs.Reservas;
using Xunit;

namespace FutsalPro.IntegrationTests.Endpoints;

/// <summary>
/// Pruebas de integración para los endpoints de Reservas conforme al estándar ISO/IEC/IEEE 29119.
/// Casos IT-CP05 a IT-CP14 + Casos frontera temporales (IT-CP14-F01 e IT-CP14-F02).
/// Responsable: Anderson Pineda
/// </summary>
public class ReservasEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ReservasEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        // Autenticación con token JWT de prueba generado por la factoría
        var token = factory.GenerateTestJwtToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    /// <summary>
    /// Helper para crear una reserva válida aislada y retornar su DTO persistido.
    /// </summary>
    private async Task<ReservaResponseDTO> CrearReservaAuxiliarAsync(int canchaId, DateTime inicio, DateTime fin)
    {
        var dto = new ReservaCreateDTO
        {
            CanchaId = canchaId,
            UsuarioAdminId = 1,
            NombreCliente = "Cliente Auxiliar " + Guid.NewGuid().ToString()[..6],
            TelefonoWhatsApp = "+503 7000-0000",
            FechaHoraInicio = inicio,
            FechaHoraFin = fin,
            PrecioTotal = 10.00m
        };

        var response = await _client.PostAsJsonAsync("/api/Reservas", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var creada = await response.Content.ReadFromJsonAsync<ReservaResponseDTO>(JsonOptions);
        creada.Should().NotBeNull();
        return creada!;
    }

    [Fact(DisplayName = "IT-CP05: GetActivas_RetornaSoloReservasNoCanceladas_200OK")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP05")]
    [Trait("Responsable", "Anderson")]
    public async Task GetActivas_RetornaSoloReservasNoCanceladas_200OK()
    {
        // Act
        var response = await _client.GetAsync("/api/Reservas");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var reservas = await response.Content.ReadFromJsonAsync<List<ReservaResponseDTO>>(JsonOptions);
        reservas.Should().NotBeNull();
        reservas!.Should().OnlyContain(r => r.NombreEstado != "Cancelada");
    }

    [Fact(DisplayName = "IT-CP06: GetById_ReservaExistente_RetornaReserva_200OK")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP06")]
    [Trait("Responsable", "Anderson")]
    public async Task GetById_ReservaExistente_RetornaReserva_200OK()
    {
        // Arrange
        var inicio = DateTime.Now.AddDays(2).Date.AddHours(10);
        var fin = inicio.AddHours(1);
        var reservaCreada = await CrearReservaAuxiliarAsync(1, inicio, fin);

        // Act
        var response = await _client.GetAsync($"/api/Reservas/{reservaCreada.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = await response.Content.ReadFromJsonAsync<ReservaResponseDTO>(JsonOptions);
        dto.Should().NotBeNull();
        dto!.Id.Should().Be(reservaCreada.Id);
        dto.NombreCliente.Should().Be(reservaCreada.NombreCliente);
    }

    [Fact(DisplayName = "IT-CP07: GetById_IdInexistente_RetornaNotFound_404NotFound")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP07")]
    [Trait("Responsable", "Anderson")]
    public async Task GetById_IdInexistente_RetornaNotFound_404NotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/Reservas/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact(DisplayName = "IT-CP08: CrearReserva_DatosValidosDentroDe10Dias_RetornaCreated_201Created")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP08")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_DatosValidosDentroDe10Dias_RetornaCreated_201Created()
    {
        // Arrange: Uso de fecha relativa (+3 días) en lugar de la fecha fija obsoleta 2026-10-15 del Excel
        var inicio = DateTime.Now.AddDays(3).Date.AddHours(15);
        var dto = new ReservaCreateDTO
        {
            CanchaId = 2,
            UsuarioAdminId = 1,
            NombreCliente = "Carlos Alvarenga",
            TelefonoWhatsApp = "+503 7123-4567",
            FechaHoraInicio = inicio,
            FechaHoraFin = inicio.AddHours(1),
            PrecioTotal = 10.00m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Reservas", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();

        var creada = await response.Content.ReadFromJsonAsync<ReservaResponseDTO>(JsonOptions);
        creada.Should().NotBeNull();
        creada!.Id.Should().BeGreaterThan(0);
        creada.NombreEstado.Should().Be("Confirmada");
    }

    [Fact(DisplayName = "IT-CP09: CrearReserva_AnticipacionMayorA10Dias_RetornaBadRequest_400BadRequest")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP09")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_AnticipacionMayorA10Dias_RetornaBadRequest_400BadRequest()
    {
        // Arrange: Fecha a 11 días en el futuro
        var inicio = DateTime.Now.AddDays(11).Date.AddHours(18);
        var dto = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "Mario Mendoza",
            TelefonoWhatsApp = "+503 7987-6543",
            FechaHoraInicio = inicio,
            FechaHoraFin = inicio.AddHours(1),
            PrecioTotal = 10.00m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Reservas", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("No es posible reservar con más de 10 días de anticipación");
    }

    [Fact(DisplayName = "IT-CP10: CrearReserva_FechaInicioRetroactiva_RetornaBadRequest_400BadRequest")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP10")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_FechaInicioRetroactiva_RetornaBadRequest_400BadRequest()
    {
        // Arrange: Fecha en el pasado (-3 horas)
        var dto = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "David Castillo",
            TelefonoWhatsApp = "+503 7000-1122",
            FechaHoraInicio = DateTime.Now.AddHours(-3),
            FechaHoraFin = DateTime.Now.AddHours(-2),
            PrecioTotal = 10.00m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Reservas", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("La fecha y hora de inicio no puede ser anterior al momento actual.");
    }

    [Fact(DisplayName = "IT-CP11: CrearReserva_FechaFinMenorOIgualAInicio_RetornaBadRequest_400BadRequest")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP11")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_FechaFinMenorOIgualAInicio_RetornaBadRequest_400BadRequest()
    {
        // Arrange: Fecha relativa (+4 días) donde fin <= inicio (sustituye fecha fija 2026-10-16 del Excel)
        var inicio = DateTime.Now.AddDays(4).Date.AddHours(14);
        var dto = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "Roberto Gómez",
            TelefonoWhatsApp = "+503 7222-3333",
            FechaHoraInicio = inicio,
            FechaHoraFin = inicio, // Fecha fin igual a inicio
            PrecioTotal = 10.00m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Reservas", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("La fecha y hora de fin debe ser posterior a la fecha y hora de inicio.");
    }

    [Fact(DisplayName = "IT-CP12: CrearReserva_CanchaInexistente_RetornaNotFound_404NotFound")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP12")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_CanchaInexistente_RetornaNotFound_404NotFound()
    {
        // Arrange: CanchaId = 9999 no existe
        var inicio = DateTime.Now.AddDays(2).Date.AddHours(11);
        var dto = new ReservaCreateDTO
        {
            CanchaId = 9999,
            UsuarioAdminId = 1,
            NombreCliente = "Cliente Sin Cancha",
            TelefonoWhatsApp = "+503 7444-5555",
            FechaHoraInicio = inicio,
            FechaHoraFin = inicio.AddHours(1),
            PrecioTotal = 10.00m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Reservas", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("La cancha con ID 9999 no existe.");
    }

    [Fact(DisplayName = "IT-CP13: CrearReserva_HorarioSolapadoConReservaActiva_RetornaBadRequest_400BadRequest")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP13")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_HorarioSolapadoConReservaActiva_RetornaBadRequest_400BadRequest()
    {
        // Arrange: Crear reserva activa previa de 18:00 a 20:00 en Cancha 2
        var fecha = DateTime.Now.AddDays(5).Date;
        await CrearReservaAuxiliarAsync(2, fecha.AddHours(18), fecha.AddHours(20));

        // Intento de reserva solapada de 19:00 a 21:00 en la misma Cancha 2
        var dtoSolapado = new ReservaCreateDTO
        {
            CanchaId = 2,
            UsuarioAdminId = 1,
            NombreCliente = "Intento Solapado",
            TelefonoWhatsApp = "+503 7999-0000",
            FechaHoraInicio = fecha.AddHours(19),
            FechaHoraFin = fecha.AddHours(21),
            PrecioTotal = 20.00m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Reservas", dtoSolapado);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("La cancha seleccionada ya cuenta con una reserva activa en el rango horario solicitado.");
    }

    [Fact(DisplayName = "IT-CP14: ActualizarReserva_HorarioYDatosValidos_RetornaOk_200OK")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP14")]
    [Trait("Responsable", "Anderson")]
    public async Task ActualizarReserva_HorarioYDatosValidos_RetornaOk_200OK()
    {
        // Arrange: Crear reserva previa en Cancha 1
        var fecha = DateTime.Now.AddDays(6).Date;
        var reservaOriginal = await CrearReservaAuxiliarAsync(1, fecha.AddHours(16), fecha.AddHours(17));

        var dtoUpdate = new ReservaCreateDTO
        {
            CanchaId = 1,
            UsuarioAdminId = 1,
            NombreCliente = "Cliente Modificado",
            TelefonoWhatsApp = "+503 7888-9999",
            FechaHoraInicio = fecha.AddHours(16), // Mismo horario, no debe auto-colisionar
            FechaHoraFin = fecha.AddHours(17).AddMinutes(30),
            PrecioTotal = 15.00m
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/Reservas/{reservaOriginal.Id}", dtoUpdate);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var actualizado = await response.Content.ReadFromJsonAsync<ReservaResponseDTO>(JsonOptions);
        actualizado.Should().NotBeNull();
        actualizado!.NombreCliente.Should().Be("Cliente Modificado");
        actualizado.TelefonoWhatsApp.Should().Be("+503 7888-9999");
        actualizado.PrecioTotal.Should().Be(15.00m);
    }

    [Fact(DisplayName = "IT-CP14-F01: CrearReserva_ExactamenteA10Dias_PermiteCreacion_201Created")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP14-F01")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_ExactamenteA10Dias_PermiteCreacion_201Created()
    {
        // Arrange: Caso frontera válido - programado justo dentro del límite de 10 días
        var inicio = DateTime.Now.AddDays(10).AddSeconds(-5);
        var dto = new ReservaCreateDTO
        {
            CanchaId = 2,
            UsuarioAdminId = 1,
            NombreCliente = "Cliente Frontera Exacto",
            TelefonoWhatsApp = "+503 7666-5555",
            FechaHoraInicio = inicio,
            FechaHoraFin = inicio.AddHours(1),
            PrecioTotal = 10.00m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Reservas", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var creada = await response.Content.ReadFromJsonAsync<ReservaResponseDTO>(JsonOptions);
        creada.Should().NotBeNull();
        creada!.NombreEstado.Should().Be("Confirmada");
    }

    [Fact(DisplayName = "IT-CP14-F02: CrearReserva_A10DiasMas1Minuto_RechazaReserva_400BadRequest")]
    [Trait("Modulo", "Reservas")]
    [Trait("CasoId", "CP14-F02")]
    [Trait("Responsable", "Anderson")]
    public async Task CrearReserva_A10DiasMas1Minuto_RechazaReserva_400BadRequest()
    {
        // Arrange: Caso frontera inválido - programado a 10 días + 1 minuto
        var inicio = DateTime.Now.AddDays(10).AddMinutes(1);
        var dto = new ReservaCreateDTO
        {
            CanchaId = 2,
            UsuarioAdminId = 1,
            NombreCliente = "Cliente Frontera Excedido",
            TelefonoWhatsApp = "+503 7666-5555",
            FechaHoraInicio = inicio,
            FechaHoraFin = inicio.AddHours(1),
            PrecioTotal = 10.00m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Reservas", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("No es posible reservar con más de 10 días de anticipación");
    }
}
