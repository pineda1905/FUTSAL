using System.Text;
using GestionTorneos.Application.Interfaces.Services;
using GestionTorneos.Application.Services;
using GestionTorneos.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de Base de Datos (Entity Framework Core)
// builder.Configuration.GetConnectionString("DefaultConnection") lee automáticamente de appsettings.json
// y de variables de entorno de producción (ej. 'ConnectionStrings__DefaultConnection' en Render).
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DefaultConnection"]
    ?? throw new InvalidOperationException("Cadena de conexión 'DefaultConnection' no encontrada en appsettings.json ni en variables de entorno.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// 2. Configuración de Autenticación JWT
var jwtKey = builder.Configuration["Jwt:Key"] 
    ?? throw new InvalidOperationException("La clave JWT ('Jwt:Key') no se encuentra configurada en appsettings.json.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "FutsalProAPI";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtIssuer,
        ClockSkew = TimeSpan.Zero
    };
});

// 3. Registro de Servicios (Inyección de Dependencias)
builder.Services.AddScoped<IReservaService, ReservaService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITorneoService, TorneoService>();

// 4. Controladores y documentación Swagger con soporte para Bearer Token
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Gestión Torneos FUTSAL - API Integral de Reservas y Torneos",
        Version = "v1",
        Description = "API REST para gestión de canchas, alquiler de reservas por hora, torneos con llaves de eliminación directa y autenticación JWT."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese su token JWT generado en el endpoint de login."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 5. Configuración de CORS permisivo (AllowAnyOrigin, AllowAnyMethod, AllowAnyHeader)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Soporte para proxy inverso de Render (X-Forwarded-For, X-Forwarded-Proto)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// Pipeline de solicitudes HTTP
app.UseForwardedHeaders();

// Habilitar Swagger tanto en Desarrollo como en Render para verificación y pruebas interactivas
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Gestión Torneos API v1");
    c.RoutePrefix = "swagger"; // Disponible en /swagger
});

app.UseCors("AllowAll");

// IMPORTANTE: UseAuthentication siempre antes de UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
