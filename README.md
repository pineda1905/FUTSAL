# ⚽ FUTSALPRO - Sistema Integral de Gestión de Canchas y Torneos

Plataforma integral para administración deportiva de fútbol sala, gestión y reserva de canchas por hora, y organización de torneos con llaves automáticas y visualización en tiempo real.

---

## 📁 Estructura del Monorepositorio

El repositorio contiene todos los componentes del ecosistema FutsalPro:

```text
FUTSAL_APP/
├── FutsalPro-Backend/        # API REST en ASP.NET Core 8 (.NET 8 + EF Core)
│   ├── src/                  # Solución en Clean Architecture (Domain, Application, Infrastructure, WebApi)
│   ├── Dockerfile            # Contenedor Docker para despliegue
│   └── GestionTorneos.sln    # Archivo de solución .NET
│
├── FutsalPro-AppMovil/       # Aplicación Móvil en React Native con Expo
│   ├── src/                  # Pantallas (Reservas, Torneos, Llaves de eliminación)
│   ├── App.js                # Punto de entrada y navegación
│   └── package.json          # Dependencias móviles
│
└── FutsalPro-WebAdmin/       # Panel de Control Web Administrativo en React + Vite
    ├── src/                  # Gestión de Torneos, Reservas, Autenticación
    ├── index.html            # SPA entry point
    └── package.json          # Dependencias frontend
```

---

## 🚀 Guía de Inicio Rápido

### 1. Backend (`FutsalPro-Backend`)
- **Tecnología**: .NET 8, C#, Entity Framework Core, SQL Server (MonsterASP).
- **Ejecutar localmente**:
  ```bash
  cd FutsalPro-Backend
  dotnet restore
  dotnet run --project src/GestionTorneos.WebApi
  ```
- **Documentación Interactiva Swagger**: `http://localhost:5000/swagger` o `https://futsal-k08n.onrender.com/swagger`

---

### 2. Panel Administrativo Web (`FutsalPro-WebAdmin`)
- **Tecnología**: React, Vite, Tailwind CSS, Axios.
- **Ejecutar localmente**:
  ```bash
  cd FutsalPro-WebAdmin
  npm install
  npm run dev
  ```
- Abre en tu navegador en `http://localhost:5173`.

---

### 3. Aplicación Móvil (`FutsalPro-AppMovil`)
- **Tecnología**: React Native, Expo, React Navigation, Axios.
- **Ejecutar localmente**:
  ```bash
  cd FutsalPro-AppMovil
  npm install
  npx expo start
  ```
- Escanea el código QR con la app **Expo Go** en Android o iOS, o presiona `a` para emulador Android o `w` para versión Web.

---

## 🔄 Sincronización en Tiempo Real

- Los torneos creados o editados en el **Panel Web Admin** se persisten directamente en la base de datos central de producción.
- La **App Móvil** se actualiza automáticamente mediante sondeo en vivo (polling) cada pocos segundos y soporte para *pull-to-refresh* (deslizar para actualizar).
