using FluentAssertions;
using GestionTorneos.Application.DTOs.Auth;
using GestionTorneos.Application.Services;
using GestionTorneos.Domain.Entities;
using GestionTorneos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FutsalPro.UnitTests.Services.Auth;

/// <summary>
/// Pruebas unitarias para AuthService conforme al estándar ISO/IEC/IEEE 29119.
/// Caso UT-2030: Normalización de correo electrónico a minúsculas durante el inicio de sesión.
/// </summary>
public class AuthService_EmailTests
{
    private readonly Mock<ILogger<AuthService>> _loggerMock = new();

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private Mock<IConfiguration> CreateMockConfiguration()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Jwt:Key"]).Returns("EstaEsUnaClaveSuperSecretaYLargaParaFutsalPro2026");
        configMock.Setup(c => c["Jwt:Issuer"]).Returns("FutsalProAPI");
        return configMock;
    }

    [Fact(DisplayName = "UT-2030: AuthService_Login_EmailConMayusculas_NormalizaAMinusculasYAutenticaExitosamente")]
    [Trait("Modulo", "Auth")]
    [Trait("CasoId", "2030")]
    [Trait("Responsable", "Dax")]
    public async Task Login_EmailConMayusculas_NormalizaAMinusculasYAutenticaExitosamente()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var rolAdmin = new Rol { Id = 1, NombreRol = "Admin" };
        context.Roles.Add(rolAdmin);

        var usuario = new Usuario
        {
            Id = 1,
            RolId = rolAdmin.Id,
            NombreCompleto = "Anderson Administrador",
            Email = "anderson@futsalpro.com", // Almacenado en minúsculas en BD
            PasswordHash = "Admin123!"
        };
        context.Usuarios.Add(usuario);
        await context.SaveChangesAsync();

        var configuration = CreateMockConfiguration();
        var service = new AuthService(context, configuration.Object, _loggerMock.Object);

        var loginDto = new LoginDTO
        {
            Email = "   AnDeRsOn@FuTsAlPrO.cOm   ", // Con espacios y mezcla de mayúsculas/minúsculas
            Password = "Admin123!"
        };

        // Act
        var respuesta = await service.LoginAsync(loginDto);

        // Assert
        respuesta.Should().NotBeNull();
        respuesta.Token.Should().NotBeNullOrWhiteSpace("debe generar un token JWT válido");
        respuesta.NombreUsuario.Should().Be("Anderson Administrador");
        respuesta.Rol.Should().Be("Admin");
    }
}
