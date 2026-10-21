# Resumen de Pruebas de Aceptación - Dax Jerry Ascencio Guevara

**Proyecto:** FutsalPro  
**Responsable:** Dax Jerry Ascencio Guevara  
**Estándar de Pruebas:** ISO/IEC/IEEE 29119  
**Ruta de Artefactos:** `docs/aceptacion/dax/`

---

## Matriz de Casos de Aceptación

| ID | Historia de Usuario | Criterio de Aceptación Principal | Estado |
|---|---|---|---|
| **1011** | Como cliente o espectador no autenticado, quiero consultar el calendario y bloques horarios disponibles desde la app móvil, para conocer la disponibilidad con privacidad. | Acceso público sin login (fricción cero); bloques clasificados como "Disponible" o "Reservado" sin exponer nombres, teléfonos ni datos personales de clientes. | **Planificado** |
| **1012** | Como cliente espectador, quiero presionar el botón de reserva rápida para contactar a administración por WhatsApp con un mensaje predeterminado. | Redirección por deep link a WhatsApp con número oficial y mensaje inicial precargado con fecha y requisitos. *(Nota: pendiente de confirmar con quien lo implementó; número de WhatsApp como dato a confirmar)* | **Planificado** |
| **1019** | Como administrador del torneo, quiero registrar al equipo ganador por penales en un empate regular, para habilitar al clasificado en la siguiente ronda. | Persistencia de empate en goles regulares y registro del `GanadorId` del equipo vencedor en penales (`PUT /api/Torneos/partidos/{id}`). *(Nota: posible duplicado de 1018, coordinar con Franklin)* | **Planificado** |
| **1021** | Como administrador del sistema, quiero cancelar un torneo registrando obligatoriamente una causa justificada, para suspenderlo formalmente. | Cambio a `EstadoId = 4` y almacenamiento del motivo obligatorio. Si el motivo está vacío o ausente, la API responde `400 Bad Request`. | **Planificado** |
| **1022** | Como espectador de torneos, quiero consultar el árbol interactivo de llaves y marcadores desde mi móvil, para seguir los cruces y clasificados en tiempo real. | Visualización de llaves de Cuartos de Final con marcadores actualizados y equipos clasificados; actualización mediante sondeo (polling) o refresco. | **Planificado** |

> **Nota:** Ningún caso ha sido marcado como aprobado. Los estados permanecerán como **Planificado** hasta que sean ejecutados y validados manualmente en dispositivo o mediante el cliente REST.

---

## Estructura de Archivos Generados

```
docs/aceptacion/dax/
├── 1011_consulta_disponibilidad_movil.feature
├── 1012_deeplink_whatsapp.feature
├── 1019_desempate_penales_partido.feature
├── 1021_cancelar_torneo_motivo.feature
├── 1022_fixture_tiempo_real_movil.feature
├── RESUMEN.md
├── api/
│   ├── 1019_desempate_penales.http
│   └── 1021_cancelar_torneo.http
└── evidencias/
    ├── 1011.md
    ├── 1012.md
    ├── 1019.md
    ├── 1021.md
    └── 1022.md
```
