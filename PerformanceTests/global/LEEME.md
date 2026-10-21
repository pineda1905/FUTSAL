# Pruebas de Rendimiento Global: Carga y Estrés (FutsalPro)

Este directorio contiene las pruebas de carga y estrés para el backend de **FutsalPro**, enfocadas en los endpoints de lectura crítica (Torneos, Fixture con Polling y Reservas) precedidos por autenticación administrativa.

---

> [!CAUTION]
> ### REGLA DE SEGURIDAD CRÍTICA
> **NUNCA ejecutes estas pruebas contra `https://futsal-k08n.onrender.com` ni contra la base de datos de MonsterASP.**
> Ambos servicios operan bajo planes gratuitos con recursos compartidos y límites estrictos de cuota/conexiones; una prueba de estrés contra ellos causaría la denegación de servicio (DoS) inmediata y la suspensión de la cuenta.
>
> ⚠️ **AVISO SOBRE `appsettings.Development.json`:**
> Se verificó el archivo `src/GestionTorneos.WebApi/appsettings.Development.json` y **actualmente contiene la cadena de conexión de MonsterASP** (`db70759.public.databaseasp.net`).
> **Antes de iniciar la Web API local para ejecutar estas pruebas**, debes sobreescribir la conexión hacia una base de datos local (ej. LocalDB o SQL Server Express local) utilizando variables de entorno de .NET:
> ```powershell
> $env:ConnectionStrings__DefaultConnection="Server=(localdb)\mssqllocaldb;Database=FutsalPro_Test;Trusted_Connection=True;"
> dotnet run --project src/GestionTorneos.WebApi
> ```

---

## 1. Consideración de Arquitectura de la Prueba (Co-locación)

> [!NOTE]
> **API y Generador de Carga (k6) comparten la misma máquina local.**  
> Al correr k6 y la Web API en el mismo equipo, la CPU, memoria RAM y el stack de red (puertos TCP e interfaces de loopback) compiten entre ambos procesos. Los resultados deben interpretarse considerando esta contención de hardware local.

---

## 2. Herramientas y Requisitos

1. **k6 (Recomendado):** Herramienta de pruebas de carga moderna y ligera.
   * Instalación en Windows (winget o chocolatey):
     ```powershell
     winget install k6 --source winget
     # o bien
     choco install k6
     ```
2. **Apache JMeter (Opcional):** Para usuarios que prefieran JMeter GUI o ejecución headless `.jmx`.

---

## 3. Scripts Disponibles

| Archivo | Tipo de Prueba | Descripción |
|---|---|---|
| `load_test.js` | Carga | Rampa 0→50 VUs (30s), 50→100 VUs (30s), 100 VUs (2 min), 100→0 VUs (30s). Umbrales: `p95 < 500ms`, `errores < 1%`. |
| `stress_test.js` | Estrés | Rampa progresiva hasta 1000 VUs (100 / 300 / 600 / 1000 VUs) para hallar el punto de quiebre. |
| `global_performance.jmx` | JMeter | Plan de prueba XML para JMeter 5.x replicando el mismo flujo de lectura. |

---

## 4. Instrucciones de Ejecución

Ambos scripts de k6 requieren las credenciales administrativas pasadas por variables de entorno (para no quemar contraseñas en el repositorio) y validan estrictamente que la URL apunte a `localhost` o `127.0.0.1`.

### Paso 1: Iniciar la Web API localmente
Asegúrate de que la API esté corriendo en el puerto indicado en `launchSettings.json` (por defecto `http://localhost:62974`):
```powershell
cd c:\Users\Windows 11\.antigravity-ide\FUTSAL\FutsalPro-Backend
dotnet run --project src/GestionTorneos.WebApi
```

### Paso 2: Ejecutar la Prueba de Carga con k6
```powershell
k6 run `
  -e BASE_URL="http://localhost:62974" `
  -e AUTH_EMAIL="anderson@futsalpro.com" `
  -e AUTH_PASSWORD="TuPasswordLocal123!" `
  load_test.js
```

### Paso 3: Ejecutar la Prueba de Estrés con k6
```powershell
k6 run `
  -e BASE_URL="http://localhost:62974" `
  -e AUTH_EMAIL="anderson@futsalpro.com" `
  -e AUTH_PASSWORD="TuPasswordLocal123!" `
  stress_test.js
```

### Ejecución con JMeter (Línea de comandos sin interfaz gráfica)
```powershell
jmeter -n -t global_performance.jmx `
  -Jhost=localhost -Jport=62974 -Jprotocol=http `
  -JauthEmail="anderson@futsalpro.com" -JauthPassword="TuPasswordLocal123!" `
  -l resultados_jmeter.jtl -e -o reporte_html/
```
> **Nota sobre el archivo `.jmx`:** El archivo XML fue generado bajo el estándar de Apache JMeter 5.x. **No pudo ser validado mediante ejecución automática por consola en este entorno debido a que JMeter no se encuentra instalado en la máquina local.**

---

## 5. Guía de Interpretación de Métricas

### A. Percentil 95 (p95 / `http_req_duration`)
* **¿Qué es?** Es el tiempo en el cual el 95% de las solicitudes se completaron; únicamente el 5% tardó más que ese valor.
* **¿Por qué usar p95 en lugar del promedio?** El promedio oculta picos atípicos (latencia de cola). El p95 garantiza que la gran mayoría de los usuarios disfruten de una respuesta rápida.
* **Objetivo:** En la prueba de carga debe ser `< 500 ms`. En estrés, si supera los 2000 ms, indica saturación de la base de datos o del pool de hilos de ASP.NET Core.

### B. Tasa de Error (`http_req_failed`)
* **¿Qué es?** Porcentaje de peticiones que devolvieron códigos HTTP distintos a 2xx (o fallos de conexión por socket exhausto).
* **Objetivo:** En carga debe ser `< 1%`. Si en estrés supera el 5%, se ha alcanzado la zona de degradación del servidor.

### C. Throughput (RPS / `http_reqs`)
* **¿Qué es?** Solicitudes por segundo que el servidor es capaz de procesar y despachar de forma exitosa.
* **Comportamiento esperado:** A medida que suben los VUs, el throughput debe aumentar proporcionalmente hasta llegar a una meseta (capacidad máxima de concurrencia).

### D. Punto de Quiebre (Breaking Point)
* **¿Cuándo ocurre?** Cuando al aumentar la cantidad de VUs el throughput se estanca o decae abruptamente, mientras la latencia (p95/p99) se dispara exponencialmente o empiezan a generarse errores HTTP 500, 503 o Connection Refused / Timeout.

---

## 6. Registro de Resultados Obtenidos

Completa esta tabla al ejecutar las pruebas en tu máquina local:

| Tipo de Prueba | VUs Máx | Duración Total | p95 (ms) | Tasa de Error (%) | Throughput (req/s) | Punto de Quiebre / Observaciones |
|---|---|---|---|---|---|---|
| **Carga (`load_test.js`)** | 100 | 3 min 30 s | *(llenar)* | *(llenar)* | *(llenar)* | *(llenar)* |
| **Estrés (`stress_test.js`)** | 1000 | 9 min | *(llenar)* | *(llenar)* | *(llenar)* | *(llenar)* |
| **JMeter (`global_performance.jmx`)** | 50 | 2 min | *(llenar)* | *(llenar)* | *(llenar)* | *(llenar)* |
