# Pruebas de Rendimiento: Carga y Estrés — Módulo Reservas (FutsalPro)

Este directorio contiene las pruebas de carga y estrés para el módulo de **Reservas** de FutsalPro, enfocadas en la capacidad de respuesta, concurrencia y límites del backend bajo el estándar **ISO/IEC/IEEE 29119**.

---

> [!CAUTION]
> ### REGLA DE SEGURIDAD CRÍTICA
> **NUNCA ejecutes estas pruebas contra `https://futsal-k08n.onrender.com` ni contra la base de datos de MonsterASP.**
> Ambos servicios operan bajo planes gratuitos con recursos compartidos y límites estrictos de cuota/conexiones; una prueba de carga o estrés contra ellos causaría la denegación de servicio (DoS) inmediata y la suspensión de la cuenta.
>
> ⚠️ **AVISO SOBRE `appsettings.Development.json`:**
> El archivo `src/GestionTorneos.WebApi/appsettings.Development.json` contiene la cadena de conexión de MonsterASP (`db70759.public.databaseasp.net`).
> **Antes de iniciar la Web API local para ejecutar estas pruebas**, debes sobreescribir la conexión hacia una base de datos local (ej. LocalDB o SQL Server Express local) utilizando variables de entorno de .NET:
> ```powershell
> $env:ConnectionStrings__DefaultConnection="Server=(localdb)\mssqllocaldb;Database=FutsalPro_Test;Trusted_Connection=True;"
> dotnet run --project FutsalPro-Backend/src/GestionTorneos.WebApi
> ```

---

## 1. Consideración de Arquitectura de la Prueba (Co-locación)

> [!NOTE]
> **API y Generador de Carga (k6 / JMeter) comparten la misma máquina local.**  
> Al correr k6 y la Web API en el mismo equipo, la CPU, memoria RAM y el stack de red (puertos TCP e interfaces de loopback) compiten entre ambos procesos. Los resultados deben interpretarse considerando esta contención de hardware local.

---

## 2. Herramientas y Requisitos

1. **k6 (Recomendado):** Motor de pruebas de rendimiento ligero y basado en JavaScript (Go runtime).
   * Instalación en Windows vía PowerShell:
     ```powershell
     winget install k6 --source winget
     # o con Chocolatey:
     choco install k6
     ```
2. **Apache JMeter (Opcional):** Para ejecución visual en GUI o por línea de comandos headless con archivo `.jmx`.

---

## 3. Scripts Disponibles en este Directorio

| Archivo | Tipo de Prueba | Configuración de Carga | Umbrales y Objetivos |
|---|---|---|---|
| `load_test.js` | **Carga** (k6) | Rampa 0→50 VUs (30s) → 100 VUs (30s) → Carga sostenida de 100 VUs (2 min) → Bajada 100→0 VUs (30s). | `p(95) < 500 ms`, `tasa de fallos < 1%`. |
| `stress_test.js` | **Estrés** (k6) | Rampa progresiva a 100, 300, 600 y hasta 1000 VUs para identificar el punto de quiebre (*Breaking Point*). | `p(95) < 2000 ms`, `tasa de fallos < 5%`. |
| `reservas_performance.jmx` | **JMeter** | Plan XML parametrizable con login administrativo y peticiones concurrentes a `/api/Reservas`. | Mismo flujo validando código 200 OK. |

---

## 4. Instrucciones de Ejecución Paso a Paso

### Paso 1: Iniciar la Web API localmente
Asegúrate de iniciar el backend apuntando a una base de datos local y verificar el puerto (por defecto `http://localhost:62974` según `launchSettings.json` o `http://localhost:5000`):
```powershell
# Desde la raíz del repositorio
$env:ConnectionStrings__DefaultConnection="Server=(localdb)\mssqllocaldb;Database=FutsalPro_Test;Trusted_Connection=True;"
dotnet run --project FutsalPro-Backend/src/GestionTorneos.WebApi
```

### Paso 2: Ejecutar la Prueba de Carga con k6
Ejecuta `load_test.js` suministrando las credenciales administrativas de prueba mediante variables de entorno:
```powershell
cd PerformanceTests/reservas

# Si la API corre en http://localhost:62974
k6 run -e BASE_URL="http://localhost:62974" `
       -e AUTH_EMAIL="anderson@futsalpro.com" `
       -e AUTH_PASSWORD="TuPasswordSeguro123!" `
       load_test.js

# Si corre en http://localhost:5000
k6 run -e BASE_URL="http://localhost:5000" `
       -e AUTH_EMAIL="anderson@futsalpro.com" `
       -e AUTH_PASSWORD="TuPasswordSeguro123!" `
       load_test.js
```

### Paso 3: Ejecutar la Prueba de Estrés con k6
Para empujar el servidor hasta encontrar la saturación de conexiones del pool de EF Core o CPU:
```powershell
k6 run -e BASE_URL="http://localhost:62974" `
       -e AUTH_EMAIL="anderson@futsalpro.com" `
       -e AUTH_PASSWORD="TuPasswordSeguro123!" `
       stress_test.js
```

### Paso 4: Ejecución con Apache JMeter (Headless CLI)
```powershell
jmeter -n -t reservas_performance.jmx `
       -Jhost=localhost -Jport=62974 -Jprotocol=http `
       -JauthEmail=anderson@futsalpro.com -JauthPassword=TuPasswordSeguro123! `
       -Jthreads=50 -Jrampup=30 -Jloops=20 `
       -l resultados_reservas.jtl -e -o reporte_html_reservas
```

---

## 5. Cómo Interpretar las Métricas de Rendimiento

Al finalizar la prueba, k6 y JMeter generan un resumen de métricas clave. A continuación se detalla cómo analizarlas bajo el estándar de calidad:

### A. Percentil 95 (p95 / `http_req_duration`)
* **¿Qué es?** Representa el tiempo máximo en el que se resolvió el 95% de todas las solicitudes ejecutadas. Deja fuera el 5% de casos atípicos (outliers o latencias puntuales del sistema operativo).
* **¿Por qué p95 y no el Promedio?** El promedio matemático oculta picos de degradación severos. Si 99 peticiones tardan 50 ms y 1 tarda 10 segundos, el promedio parecerá aceptable, pero el p95 revelará inmediatamente que los usuarios sufren demoras significativas.
* **Criterio de Aceptación:**
  * **Carga:** `p(95) < 500 ms` (Excelente rendimiento de lectura en Entity Framework Core y SQL Server).
  * **Estrés:** Si el p95 supera los `2000 ms`, indica que el servidor ha alcanzado saturación en su cola de hilos o contención de lectura en la base de datos.

### B. Tasa de Error (Error Rate / `http_req_failed`)
* **¿Qué es?** El porcentaje de solicitudes que terminaron con un código de respuesta inesperado (ej. HTTP 500 Internal Server Error, 503 Service Unavailable, 401 Unauthorized o fallos de conexión por socket exhaust).
* **Criterio de Aceptación:**
  * **Carga:** `http_req_failed < 1%` (`rate < 0.01`). En condiciones de carga esperada (100 VUs), la aplicación no debe presentar fallos.
  * **Estrés:** El punto exacto de VUs donde la tasa de error pasa del 1% al 5% o más define el **Punto de Quiebre (*Breaking Point*)** de la infraestructura evaluada.

### C. Rendimiento y Throughput (`http_reqs` / RPS)
* **¿Qué es?** La cantidad total de solicitudes procesadas por segundo (*Requests Per Second* o *RPS*) que el backend es capaz de despachar.
* **Diagnóstico de Saturación:**
  * Si al aumentar los usuarios virtuales de 100 a 300 el RPS se duplica o triplica, el sistema escala linealmente.
  * Si al pasar a 600 o 1000 VUs el RPS se estanca o decae mientras la latencia (p95) se dispara, se ha alcanzado el límite de procesamiento concurrente del servidor.
