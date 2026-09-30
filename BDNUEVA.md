# Estructura de Base de Datos: Entorno MonsterASP y DBeaver

Este documento define la estructura de la base de datos relacional del sistema FutsalPro. Refleja la adaptación a la infraestructura real en la nube y las herramientas de desarrollo utilizadas.

## 1. Contexto de Infraestructura
*   **Hosting:** MonsterASP.NET (Capa gratuita).
*   **Datacenter:** Europa.
*   **Nombre de la Base de Datos:** Asignado dinámicamente por el proveedor (Ej. `db70759`). Por restricciones del hosting compartido, el nombre no es modificable.
*   **Herramienta de Gestión:** **DBeaver** es el cliente SQL oficial utilizado para administrar la base de datos de forma remota, configurado con `trustServerCertificate=true` para permitir la conexión segura.

## 2. Script de Tablas y Datos Semilla (SQL Server)

*Nota: Este script está diseñado para ejecutarse directamente en DBeaver sobre la base de datos ya existente en MonsterASP. Se han omitido intencionalmente los comandos `CREATE DATABASE` y `USE` por restricciones de permisos en el hosting.*

```sql
-- ==========================================
-- 1. TABLAS DE CATÁLOGOS (Sin dependencias)
-- ==========================================
CREATE TABLE Roles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreRol VARCHAR(50) NOT NULL
);
GO

CREATE TABLE EstadosReserva (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreEstado VARCHAR(50) NOT NULL
);
GO

CREATE TABLE EstadosTorneo (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreEstado VARCHAR(50) NOT NULL
);
GO

CREATE TABLE CategoriasGenero (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreCategoria VARCHAR(50) NOT NULL
);
GO

CREATE TABLE Canchas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL
);
GO

-- ==========================================
-- 2. TABLAS DE INFRAESTRUCTURA Y OPERACIÓN
-- ==========================================
CREATE TABLE Usuarios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RolId INT NOT NULL,
    NombreCompleto VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (RolId) REFERENCES Roles(Id)
);
GO

CREATE TABLE Reservas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CanchaId INT NOT NULL,
    UsuarioAdminId INT NOT NULL,
    EstadoId INT NOT NULL,
    NombreCliente VARCHAR(255) NOT NULL,
    TelefonoWhatsApp VARCHAR(50) NOT NULL,
    FechaHoraInicio DATETIME NOT NULL,
    FechaHoraFin DATETIME NOT NULL,
    PrecioTotal DECIMAL(10,2) NOT NULL,
    MotivoCancelacion VARCHAR(500) NULL,
    FechaRegistro DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Reservas_Canchas FOREIGN KEY (CanchaId) REFERENCES Canchas(Id),
    CONSTRAINT FK_Reservas_Usuarios FOREIGN KEY (UsuarioAdminId) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Reservas_Estados FOREIGN KEY (EstadoId) REFERENCES EstadosReserva(Id)
);
GO

-- ==========================================
-- 3. TABLAS DE TORNEOS (MOTOR DEPORTIVO)
-- ==========================================
CREATE TABLE Torneos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioAdminId INT NOT NULL,
    EstadoId INT NOT NULL,
    GeneroId INT NOT NULL,
    Nombre VARCHAR(255) NOT NULL,
    RangoEdad VARCHAR(50) NOT NULL,
    FechaInicio DATE NOT NULL,
    CONSTRAINT FK_Torneos_Usuarios FOREIGN KEY (UsuarioAdminId) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Torneos_Estados FOREIGN KEY (EstadoId) REFERENCES EstadosTorneo(Id),
    CONSTRAINT FK_Torneos_Genero FOREIGN KEY (GeneroId) REFERENCES CategoriasGenero(Id)
);
GO

CREATE TABLE Equipos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TorneoId INT NOT NULL,
    NombreEquipo VARCHAR(255) NOT NULL,
    NombreRepresentante VARCHAR(255) NOT NULL,
    CONSTRAINT FK_Equipos_Torneos FOREIGN KEY (TorneoId) REFERENCES Torneos(Id)
);
GO

CREATE TABLE PartidosTorneo (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TorneoId INT NOT NULL,
    Fase VARCHAR(50) NOT NULL,
    EquipoLocalId INT NULL,
    EquipoVisitaId INT NULL,
    GolesLocal INT NULL,
    GolesVisita INT NULL,
    GanadorId INT NULL,
    CONSTRAINT FK_Partidos_Torneos FOREIGN KEY (TorneoId) REFERENCES Torneos(Id),
    CONSTRAINT FK_Partidos_Local FOREIGN KEY (EquipoLocalId) REFERENCES Equipos(Id),
    CONSTRAINT FK_Partidos_Visita FOREIGN KEY (EquipoVisitaId) REFERENCES Equipos(Id),
    CONSTRAINT FK_Partidos_Ganador FOREIGN KEY (GanadorId) REFERENCES Equipos(Id)
);
GO

-- ==========================================
-- 4. INSERTAR DATOS SEMILLA (SEED DATA)
-- ==========================================
INSERT INTO Roles (NombreRol) VALUES ('Administrador'), ('Operador');
INSERT INTO EstadosReserva (NombreEstado) VALUES ('Pendiente'), ('Confirmada'), ('Cancelada');
INSERT INTO EstadosTorneo (NombreEstado) VALUES ('Programado'), ('Activo'), ('Finalizado');
INSERT INTO CategoriasGenero (NombreCategoria) VALUES ('Masculino'), ('Femenino');
INSERT INTO Canchas (Nombre) VALUES ('Cancha 1 (Sintética Pro)'), ('Cancha 2 (Tabloncillo)');
GO

INSERT INTO Usuarios (RolId, NombreCompleto, Email, PasswordHash) VALUES 
(1, 'Anderson Pineda', 'anderson@futsalpro.com', 'hash_admin_123'),
(2, 'Franklin Pérez', 'franklin@futsalpro.com', 'hash_operador_456');
GO

-- Reserva Confirmada (EstadoId = 2)
INSERT INTO Reservas (CanchaId, UsuarioAdminId, EstadoId, NombreCliente, TelefonoWhatsApp, FechaHoraInicio, FechaHoraFin, PrecioTotal)
VALUES (1, 1, 2, 'Carlos Martínez', '+503 7000-0001', '20260920 18:00:00', '20260920 19:00:00', 10.00);

-- Reserva Cancelada (EstadoId = 3) con motivo
INSERT INTO Reservas (CanchaId, UsuarioAdminId, EstadoId, NombreCliente, TelefonoWhatsApp, FechaHoraInicio, FechaHoraFin, PrecioTotal, MotivoCancelacion)
VALUES (2, 2, 3, 'Luis Fernando', '+503 7000-0002', '20260921 19:00:00', '20260921 20:00:00', 10.00, 'Suspendido por clima severo');
GO

-- Torneo Masculino (GeneroId = 1), Programado (EstadoId = 1)
INSERT INTO Torneos (UsuarioAdminId, EstadoId, GeneroId, Nombre, RangoEdad, FechaInicio)
VALUES (1, 1, 1, 'Copa Relámpago Apertura', '18 años en adelante', '20261001');
GO

-- Equipos para el TorneoId = 1 (Llave de 7 equipos para simular "Pase Directo")
INSERT INTO Equipos (TorneoId, NombreEquipo, NombreRepresentante) VALUES 
(1, 'Los Galácticos', 'Mario Silva'),
(1, 'Sporting FC', 'Daniel López'),
(1, 'Real Bañil', 'Jorge Méndez'),
(1, 'Atlético Central', 'Kevin Cruz'),
(1, 'Los Troncos', 'Miguel Ángel'),
(1, 'Deportivo Sur', 'Hugo Sánchez'),
(1, 'La Selecta', 'Raúl Díaz');
GO

-- Cuartos de Final (Partido con Pase Directo en el último)
INSERT INTO PartidosTorneo (TorneoId, Fase, EquipoLocalId, EquipoVisitaId) VALUES 
(1, 'Cuartos de Final', 1, 2),
(1, 'Cuartos de Final', 3, 4),
(1, 'Cuartos de Final', 5, 6),
(1, 'Cuartos de Final', 7, NULL); 
GO
```