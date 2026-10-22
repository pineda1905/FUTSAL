# Etapa de runtime (ASP.NET 8.0)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Etapa de compilación (SDK 8.0)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copiar archivos .csproj
COPY ["FutsalPro-Backend/src/GestionTorneos.WebApi/GestionTorneos.WebApi.csproj", "FutsalPro-Backend/src/GestionTorneos.WebApi/"]
COPY ["FutsalPro-Backend/src/GestionTorneos.Application/GestionTorneos.Application.csproj", "FutsalPro-Backend/src/GestionTorneos.Application/"]
COPY ["FutsalPro-Backend/src/GestionTorneos.Domain/GestionTorneos.Domain.csproj", "FutsalPro-Backend/src/GestionTorneos.Domain/"]
COPY ["FutsalPro-Backend/src/GestionTorneos.Infrastructure/GestionTorneos.Infrastructure.csproj", "FutsalPro-Backend/src/GestionTorneos.Infrastructure/"]

RUN dotnet restore "FutsalPro-Backend/src/GestionTorneos.WebApi/GestionTorneos.WebApi.csproj"

# Copiar todo el código fuente del backend y compilar
COPY FutsalPro-Backend/ FutsalPro-Backend/
WORKDIR "/src/FutsalPro-Backend/src/GestionTorneos.WebApi"
RUN dotnet build "GestionTorneos.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Etapa de publicación
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "GestionTorneos.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Imagen final ligera lista para producción en Render
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GestionTorneos.WebApi.dll"]
