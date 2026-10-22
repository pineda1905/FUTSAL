using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GestionTorneos.Domain.Entities;
using GestionTorneos.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace FutsalPro.IntegrationTests.Infrastructure;

/// <summary>
/// Fábrica de pruebas de integración que:
///  (a) reemplaza el DbContext SQL Server por InMemory (nombre único por instancia),
///  (b) siembra datos de referencia y el usuario admin de prueba,
///  (c) expone GenerateTestJwtToken usando la configuración JWT real del proyecto.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // Nombre de BD único por instancia para aislar pruebas paralelas
    private readonly string _dbName = $"FutsalProTestDb_{Guid.NewGuid()}";

    // Contraseña de prueba del admin y su hash SHA-256 (igual que AuthService)
    public const string AdminEmail    = "anderson@futsalpro.com";
    public const string AdminPassword = "Admin123!";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // ── (a) Reemplazar DbContext de SQL Server por InMemory ──────────────
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));

            if (descriptor is not null)
                services.Remove(descriptor);

            // También eliminar el descriptor del DbContext en sí si existe
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(ApplicationDbContext));
            if (dbContextDescriptor is not null)
                services.Remove(dbContextDescriptor);

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));

            // ── (b) Sembrar datos ────────────────────────────────────────────────
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.Database.EnsureCreated();
            SeedData(db);
        });

        // Entorno de pruebas: suprime la validación de conexión real
        builder.UseEnvironment("Testing");
    }

    // ── Siembra de datos ──────────────────────────────────────────────────────

    private static void SeedData(ApplicationDbContext db)
    {
        // Roles
        if (!db.Roles.Any())
        {
            db.Roles.AddRange(
                new Rol { Id = 1, NombreRol = "Admin" },
                new Rol { Id = 2, NombreRol = "Usuario" }
            );
            db.SaveChanges();
        }

        // Usuario admin de prueba (hash SHA-256 hex — idéntico al que usa AuthService)
        if (!db.Usuarios.Any())
        {
            db.Usuarios.Add(new Usuario
            {
                Id           = 1,
                RolId        = 1,
                NombreCompleto = "Anderson Admin",
                Email        = AdminEmail,
                PasswordHash = ComputeSha256Hex(AdminPassword)
            });
            db.SaveChanges();
        }

        // 2 Canchas de prueba
        if (!db.Canchas.Any())
        {
            db.Canchas.AddRange(
                new Cancha { Id = 1, Nombre = "Cancha A" },
                new Cancha { Id = 2, Nombre = "Cancha B" }
            );
            db.SaveChanges();
        }

        // Estados de reserva
        if (!db.EstadosReserva.Any())
        {
            db.EstadosReserva.AddRange(
                new EstadoReserva { Id = 1, NombreEstado = "Confirmada" },
                new EstadoReserva { Id = 2, NombreEstado = "Cancelada"  }
            );
            db.SaveChanges();
        }

        // Estados de torneo
        if (!db.Set<EstadoTorneo>().Any())
        {
            db.Set<EstadoTorneo>().AddRange(
                new EstadoTorneo { Id = 1, NombreEstado = "Abierto"     },
                new EstadoTorneo { Id = 2, NombreEstado = "En Curso"    },
                new EstadoTorneo { Id = 3, NombreEstado = "Finalizado"  }
            );
            db.SaveChanges();
        }

        // Géneros / Categorías
        if (!db.Set<CategoriaGenero>().Any())
        {
            db.Set<CategoriaGenero>().AddRange(
                new CategoriaGenero { Id = 1, NombreCategoria = "Masculino" },
                new CategoriaGenero { Id = 2, NombreCategoria = "Femenino"  },
                new CategoriaGenero { Id = 3, NombreCategoria = "Mixto"     }
            );
            db.SaveChanges();
        }
    }

    // ── (c) Generación de JWT de prueba ──────────────────────────────────────

    /// <summary>
    /// Genera un JWT válido usando la misma configuración Jwt:Key / Jwt:Issuer
    /// que usa el proyecto real, útil para autenticar endpoints protegidos.
    /// </summary>
    public string GenerateTestJwtToken(
        int    userId       = 1,
        string nombre       = "Anderson Admin",
        string email        = AdminEmail,
        string rol          = "Admin")
    {
        // Leer la configuración real del proyecto (appsettings.json del WebApi)
        var configuration = Services.GetRequiredService<IConfiguration>();

        var jwtKey    = configuration["Jwt:Key"]    ?? "EstaEsUnaClaveSuperSecretaYLargaParaFutsalPro2026";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "FutsalProAPI";

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier,   userId.ToString()),
            new Claim(ClaimTypes.Name,             nombre),
            new Claim(ClaimTypes.Email,            email),
            new Claim(ClaimTypes.Role,             rol),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject            = new ClaimsIdentity(claims),
            Expires            = DateTime.UtcNow.AddHours(1),
            Issuer             = jwtIssuer,
            Audience           = jwtIssuer,
            SigningCredentials = creds
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(tokenDescriptor));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>Genera el hash SHA-256 en hexadecimal, igual que AuthService.VerificarPassword.</summary>
    public static string ComputeSha256Hex(string input)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }
}
