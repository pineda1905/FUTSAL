using FluentAssertions;
using FutsalPro.IntegrationTests.Infrastructure;

namespace FutsalPro.IntegrationTests.Controllers;

/// <summary>
/// Prueba de humo de integración: verifica que la fábrica levanta el host,
/// la BD InMemory se inicializa y el cliente HTTP puede crearse sin errores.
/// No realiza llamadas reales a SQL Server.
/// </summary>
public class ApiSmokeTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public ApiSmokeTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client  = factory.CreateClient();
    }

    [Fact]
    public void Factory_CreaHttpClient_Exitosamente()
    {
        // Assert — si llegamos aquí el host levanta con InMemory DB
        _client.Should().NotBeNull();
        _client.BaseAddress.Should().NotBeNull();
    }

    [Fact]
    public void Factory_GeneraJwtToken_NoNuloNiVacio()
    {
        var token = _factory.GenerateTestJwtToken();

        token.Should().NotBeNullOrWhiteSpace();
        // Un JWT tiene exactamente 2 puntos (3 partes: header.payload.signature)
        token.Split('.').Should().HaveCount(3);
    }
}
