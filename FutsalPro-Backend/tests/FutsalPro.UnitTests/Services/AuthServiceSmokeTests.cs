using FluentAssertions;
using GestionTorneos.Application.Services;
using GestionTorneos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace FutsalPro.UnitTests.Services;

/// <summary>
/// Prueba de humo: verifica que AuthService compila y puede instanciarse
/// con un DbContext InMemory, sin necesitar una base de datos real.
/// </summary>
public class AuthServiceSmokeTests
{
    [Fact]
    public void AuthService_SePuedeInstanciar_ConDbContextInMemory()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("SmokeTestDb")
            .Options;

        using var context       = new ApplicationDbContext(options);
        var configMock          = new Mock<IConfiguration>();
        var loggerMock          = new Mock<ILogger<AuthService>>();

        configMock.Setup(c => c["Jwt:Key"])    .Returns("EstaEsUnaClaveSuperSecretaYLargaParaFutsalPro2026");
        configMock.Setup(c => c["Jwt:Issuer"]) .Returns("FutsalProAPI");

        // Act
        var sut = new AuthService(context, configMock.Object, loggerMock.Object);

        // Assert — si llegamos aquí el proyecto compila y las dependencias resuelven
        sut.Should().NotBeNull();
    }
}
