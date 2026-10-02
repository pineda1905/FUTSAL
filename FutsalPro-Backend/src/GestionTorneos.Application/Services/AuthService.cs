using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GestionTorneos.Application.DTOs.Auth;
using GestionTorneos.Domain.Exceptions;
using GestionTorneos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace GestionTorneos.Application.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AuthResponseDTO> LoginAsync(LoginDTO dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Intento de autenticación para el usuario: {Email}", dto.Email);

        var emailNormalized = dto.Email.Trim().ToLower();

        // 1. Buscar usuario en base de datos con su rol
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalized, cancellationToken);

        if (usuario == null)
        {
            _logger.LogWarning("Intento de autenticación fallido: usuario no encontrado ({Email})", dto.Email);
            throw new BusinessRuleException("Credenciales inválidas. Verifique correo o contraseña.");
        }

        // 2. Verificar el PasswordHash
        if (!VerificarPassword(dto.Password, usuario.PasswordHash))
        {
            _logger.LogWarning("Intento de autenticación fallido: contraseña incorrecta ({Email})", dto.Email);
            throw new BusinessRuleException("Credenciales inválidas. Verifique correo o contraseña.");
        }

        // 3. Generar Token JWT
        var token = GenerarTokenJwt(usuario.Id, usuario.NombreCompleto, usuario.Email, usuario.Rol?.NombreRol ?? "Admin");

        _logger.LogInformation("Autenticación exitosa para el usuario {Email}", dto.Email);

        return new AuthResponseDTO
        {
            Token = token,
            NombreUsuario = usuario.NombreCompleto,
            Rol = usuario.Rol?.NombreRol ?? "Admin"
        };
    }

    private string GenerarTokenJwt(int usuarioId, string nombreCompleto, string email, string rol)
    {
        var jwtKey = _configuration["Jwt:Key"] 
            ?? throw new InvalidOperationException("La clave JWT ('Jwt:Key') no está configurada en appsettings.json.");
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "FutsalProAPI";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, usuarioId.ToString()),
            new Claim(ClaimTypes.Name, nombreCompleto),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, rol),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            Issuer = jwtIssuer,
            Audience = jwtIssuer,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    private static bool VerificarPassword(string passwordIngresada, string passwordHashAlmacenado)
    {
        if (string.IsNullOrWhiteSpace(passwordIngresada) || string.IsNullOrWhiteSpace(passwordHashAlmacenado))
            return false;

        // Comprobación directa (útil para semillas de prueba iniciales)
        if (passwordIngresada == passwordHashAlmacenado)
            return true;

        // Comprobación mediante SHA-256 (Hexadecimal y Base64)
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(passwordIngresada));
        
        var hex = Convert.ToHexString(bytes);
        if (string.Equals(hex, passwordHashAlmacenado, StringComparison.OrdinalIgnoreCase))
            return true;

        var base64 = Convert.ToBase64String(bytes);
        if (string.Equals(base64, passwordHashAlmacenado, StringComparison.Ordinal))
            return true;

        return false;
    }
}
