# Historias de Usuario — FutsalPro (Grupo 5)

> **Fuente:** `FutsalPro_Pruebas_Aceptación_Grupo5.xlsx` (ubicado en Desktop del usuario)  
> **Proyecto Azure DevOps:** [Testeo](https://dev.azure.com/daxascencio1/Testeo) — organización `daxascencio1`  
> **Proceso del proyecto:** **Scrum** (tipos detectados: Epic · Feature · Product Backlog Item · Test Case · Task)  
> **Integrantes:** Carlos Pérez Shupan · Anderson Pineda · Dax Ascencio · Franklin Pérez  
> **Generado:** 2026-10-22  

---

## 1. Epics en Azure DevOps (Testeo)

| ADO ID | Título | Estado |
|--------|--------|--------|
| [#84](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/84) | Epic: Autenticación | New |
| [#85](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/85) | Epic: Reservas | New |
| [#86](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/86) | Epic: Torneos y Fixture | New |
| [#87](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/87) | Epic: App Móvil (Espectador) | New |

---

## 2. Product Backlog Items (PBIs) en Azure DevOps

| ADO ID | Título PBI | Responsable | Estado |
|--------|------------|-------------|--------|
| [#30](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/30) | PBI #101: Gestión y Alquiler Convencional de Canchas de Fútbol Sala | Anderson Pineda | Committed |
| [#31](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/31) | PBI #102: Cancelación de Reservas con Justificación Obligatoria | Carlos Perez | Committed |
| [#32](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/32) | PBI #103: Configuración de Torneos y Fixture Automático de Cuartos de Final | Fran | Committed |
| [#33](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/33) | PBI #104: Registro y Actualización de Marcadores Arbitrales con Ganadores | Fran | Committed |
| [#34](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/34) | PBI #105: Autenticación Administrativa JWT y Seguridad de Endpoints | Carlos Perez | Committed |
| [#35](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/35) | PBI #106: Consulta Pública de Disponibilidad en App Móvil y Enlace a WhatsApp | dax ascencio | Committed |

---

## 3. Tabla de Historias de Usuario (del Excel)

> **Leyenda "¿Ya existe en Azure?":**  
> ✅ = existe como PBI independiente  
> ⚠️ = cubierto parcialmente (escenario de otro PBI)  
> ❌ = no existe aún  
> 🔁 = posible duplicado  

| ID Excel | Título | Descripción | Resultado Esperado / Criterios | Epic | Responsable | ¿Ya existe en Azure? |
|----------|--------|-------------|-------------------------------|------|-------------|----------------------|
| **1001** | HU: Inicio de sesión de Administrador | El administrador ingresa con credenciales válidas para gestionar el sistema. | Autenticación exitosa, emisión de token JWT con rol Administrador y redirección al panel web admin. | Autenticación | Carlos Perez | ⚠️ [PBI #105 (#34)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/34) — Escenario 1 |
| **1002** | HU: Bloqueo de acceso con credenciales inválidas | El sistema rechaza intentos de ingreso de usuarios no autorizados o contraseñas erróneas. | Mensaje de error: 'Credenciales inválidas' + HTTP 401 Unauthorized. | Autenticación | Carlos Perez | ⚠️ [PBI #105 (#34)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/34) — Escenario 2 |
| **1003** | HU: Registrar reserva convencional dentro de 10 días | El administrador agenda una reserva por hora para un cliente que contactó por WhatsApp. | Reserva creada con Estado 'Confirmada' y visible en la agenda administrativa. | Reservas | Anderson Pineda | ⚠️ [PBI #101 (#30)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/30) — Escenario 1 |
| **1004** | HU: Rechazo de reserva con más de 10 días de anticipación | El sistema no permite agendar reservas que superen la ventana máxima de 10 días. | Mensaje: 'No es posible reservar con más de 10 días de anticipación.' (HTTP 400). | Reservas | Anderson Pineda | ⚠️ [PBI #101 (#30)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/30) — Escenario 3 |
| **1005** | HU: Rechazo de reserva en horario retroactivo | El sistema no permite programar reservas en el pasado. | Rechazo con mensaje: 'La fecha y hora de inicio no puede ser anterior al momento actual.' | Reservas | Anderson Pineda | ⚠️ [PBI #101 (#30)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/30) — Escenario 3 (variante) |
| **1006** | HU: Prevención de solapamiento de horarios en la misma cancha | No se permite registrar dos reservas activas que choquen en la misma cancha y horario. | Mensaje: 'La cancha seleccionada ya cuenta con una reserva activa en el rango horario solicitado.' | Reservas | Anderson Pineda | ⚠️ [PBI #101 (#30)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/30) — Escenario 2 |
| **1007** | HU: Modificación de reserva activa existente | El administrador actualiza datos del cliente o modifica el horario dentro de bloques disponibles. | Reserva actualizada reflejando nuevos datos en el panel. | Reservas | Anderson Pineda | ❌ No existe como caso independiente en Azure |
| **1008** | HU: Cancelación de reserva con motivo obligatorio | El administrador cancela una reserva ingresando obligatoriamente la justificación. | La reserva pasa a 'Cancelada', se persiste el motivo y la cancha queda disponible. | Reservas | Carlos Perez | ⚠️ [PBI #102 (#31)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/31) — Escenario 1 |
| **1009** | HU: Rechazo de cancelación sin motivo de cancelación | El sistema no permite cancelar una reserva si no se ingresa un motivo. | Alerta: 'El motivo de cancelación es obligatorio y no puede estar vacío.' | Reservas | Carlos Perez | ⚠️ [PBI #102 (#31)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/31) — Escenario 2 |
| **1010** | HU: Bloqueo de cancelación sobre reserva ya cancelada | El sistema impide volver a cancelar un registro ya cancelado. | Rechazo con mensaje: 'La reserva ya se encuentra cancelada.' | Reservas | Carlos Perez | ⚠️ [PBI #102 (#31)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/31) — Escenario 3 |
| **1011** | Consulta pública de disponibilidad en App Móvil | El cliente espectador consulta bloques horarios sin iniciar sesión y sin ver datos privados. | Bloques marcados como 'Disponible' o 'Reservado', sin exponer nombres de clientes ni teléfonos. | App Móvil (Espectador) | Dax Ascencio | ⚠️ [PBI #106 (#35)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/35) — Escenario 1 |
| **1012** | Redirección mediante Deep Link hacia WhatsApp | El cliente presiona el botón flotante de reserva rápida para contactar a administración. | Abre WhatsApp con chat preconfigurado y mensaje inicial de solicitud de reserva. *(Número a confirmar: `+503 7000-0001`)* | App Móvil (Espectador) | Dax Ascencio | ⚠️ [PBI #106 (#35)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/35) — Escenario 3 |
| **1013** | Creación de torneo con categoría y fecha válida | El administrador registra un nuevo torneo con fecha anticipada (15–30 días) y 8 equipos. | Torneo en Estado 'Programado', equipos vinculados y llaves de Cuartos de Final generadas automáticamente. | Torneos y Fixture | Fran | ⚠️ [PBI #103 (#32)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/32) — Escenario 1 |
| **1014** | Rechazo de torneo fuera del rango de anticipación | El sistema valida que no se programen torneos con < 15 días o > 30 días de anticipación. | Mensaje: 'La fecha de inicio debe tener entre 15 y 30 días de anticipación.' (HTTP 400). | Torneos y Fixture | Fran | ⚠️ [PBI #103 (#32)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/32) — Escenario 3 |
| **1015** | Generación automática de llaves para 8 equipos (Cuartos) | Al inscribir 8 equipos, el sistema crea 4 partidos emparejados en Cuartos de Final. | 4 registros en PartidosTorneo con Fase 'Cuartos de Final' emparejando 1vs2, 3vs4, 5vs6, 7vs8. | Torneos y Fixture | Fran | ⚠️ [PBI #103 (#32)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/32) — Escenario 1 |
| **1016** | Manejo de llaves con equipos impares (Pase Directo / Bye) | Con 7 equipos inscritos, el último recibe pase directo automático a la siguiente fase. | Partido #4 con EquipoLocalId asignado y EquipoVisitaId = NULL (Bye 3-0). | Torneos y Fixture | Fran | ⚠️ [PBI #103 (#32)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/32) — Escenario 2 |
| **1017** | Registro de marcadores arbitrales y asignación de ganador local/visita | El administrador ingresa el resultado oficial al finalizar un encuentro. | Sistema registra marcador, actualiza GanadorId automáticamente al equipo con más goles. | Torneos y Fixture | Fran | ⚠️ [PBI #104 (#33)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/33) — Escenario 1 |
| **1018** | Definición de ganador por penales en partidos empatados — **⚠️ POSIBLE DUPLICADO DE 1019** | En empate en tiempo regular, el sistema permite registrar al equipo ganador definido por penales. | Sistema persiste empate en goles regulares y guarda GanadorId del vencedor por penales para la siguiente ronda. | Torneos y Fixture | Franklin Pérez *(Fran, coordinar)* | 🔁 **POSIBLE DUPLICADO DE 1019** — Cubierto en [PBI #104 (#33)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/33) Escenario 2 |
| **1019** | Definición de desempate/penales en partido igualado — **⚠️ POSIBLE DUPLICADO DE 1018** | En empate en tiempo regular, el administrador selecciona el ganador definido en tanda de penales. | Sistema guarda marcador 2-2 y registra GanadorId para la siguiente ronda. **[Defecto documentado]:** GanadorId ajeno al partido retorna 200 OK (sin validación). | Torneos y Fixture | Dax Ascencio | 🔁 **POSIBLE DUPLICADO DE 1018** — Ver [`1019_desempate_penales_partido.feature`](aceptacion/dax/1019_desempate_penales_partido.feature) |
| **1020** | HU: Validación para marcar torneo como Finalizado | El sistema impide dar por finalizado un torneo si hay partidos pendientes sin resultado. | Rechazo con mensaje: 'No se puede marcar el torneo como Finalizado. Aún hay partidos pendientes de jugar o sin ganador definido.' | Torneos y Fixture | Fran | ⚠️ [PBI #104 (#33)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/33) — Escenario 3 |
| **1021** | Cancelación administrativa de torneo con motivo obligatorio | El administrador cancela un torneo ingresando una causa justificada. | Torneo pasa a estado 'Cancelado' (EstadoId=4) y se almacena la justificación. Sin motivo → 400 Bad Request. | Torneos y Fixture | Dax Ascencio | ❌ **No existe como PBI independiente** (diferente a cancelar reserva). Pendiente crear. |
| **1022** | Visualización de fixture y marcadores en tiempo real (App Móvil) | El espectador consulta las llaves del torneo y marcadores actualizados desde su teléfono móvil. | Árbol de llaves interactivo con cruces de Cuartos de Final, marcadores actualizados (ej. 4-2, 1-3) y equipos clasificados visualmente destacados. | App Móvil (Espectador) | Dax Ascencio | ⚠️ [PBI #106 (#35)](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/35) — Escenario 2 |

---

## 4. Análisis de duplicados: 1018 vs 1019

> **ADVERTENCIA:** 1018 y 1019 describen el **mismo escenario funcional** — registrar el ganador por penales tras empate en goles regulares vía `PUT /api/Torneos/partidos/{id}`.

| Aspecto | 1018 | 1019 |
|---------|------|------|
| Área funcional | Marcadores y Resultados | Torneos y Fixture |
| Endpoint | `PUT /api/Torneos/partidos/{id}` | `PUT /api/Torneos/partidos/{id}` |
| Acción | Ingresar marcador empatado + seleccionar ganador por penales | Ingresar marcador empatado + seleccionar ganador por penales |
| Escenario negativo | No especifica validación de GanadorId ajeno | Documenta defecto: GanadorId ajeno retorna 200 OK |
| Responsable | Franklin Pérez (Fran) | Dax Ascencio |
| Archivo .feature | ❌ No existe en repo | ✅ [`1019_desempate_penales_partido.feature`](aceptacion/dax/1019_desempate_penales_partido.feature) |
| **Acción recomendada** | Consolidar en un único PBI y cerrar el duplicado | Mantener este como versión canónica |

**Próximo paso:** Coordinar con Franklin Pérez para confirmar si 1018 es duplicado. Si lo es, cerrar 1018 en Azure Boards y agregar comentario de trazabilidad.

---

## 5. Work Items adicionales en Testeo (muestra completa)

| ADO ID | Tipo | Título | Responsable | Estado |
|--------|------|--------|-------------|--------|
| [#23](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/23) | Feature | Feature 1: Gestión de Reservas y Alquileres de Canchas por Hora | Anderson Pineda | New |
| #24–#29 | Feature | Features adicionales (pendiente detallar) | — | — |
| [#21](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/21) | Test Case | TC1001: Inicio de sesión administrativo y emisión de token JWT (200 OK) | Carlos Perez | Design |
| [#60](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/60) | Test Case | TC1002: Bloqueo de acceso con credenciales inválidas (401 Unauthorized) | Carlos Perez | Design |
| [#70](https://dev.azure.com/daxascencio1/Testeo/_workitems/edit/70) | Test Case | TC1012: Actualización de marcador arbitral y asignación automática de ganador | Fran | Design |
| #36–#59, #61–#69 | Test Case | Test Cases adicionales (IDs 36–83, detalle pendiente) | — | Design |

---

## 6. Pendientes / Acciones recomendadas

> **Estas acciones requieren aprobación. NO se ha creado ni modificado nada en Azure DevOps.**

- [ ] **Copiar el Excel al repositorio** en `docs/excel/FutsalPro_Pruebas_Aceptación_Grupo5.xlsx` (actualmente solo en el Desktop).
- [ ] **Resolver duplicado 1018/1019** — coordinar con Franklin Pérez. Si es duplicado, cerrar 1018 y dejar trazabilidad en comentario de Azure Boards.
- [ ] **Crear PBI independiente para 1021** (Cancelación de torneo con motivo) — diferente a cancelar reserva.
- [ ] **Crear PBI independiente para 1007** (Modificación de reserva activa) — no existe en Azure.
- [ ] **Vincular PBIs #30–#35 a sus Epics #84–#87** mediante relaciones padre-hijo en Azure DevOps.
- [ ] **Detallar Features #24–#29** y Test Cases #36–#83.
- [ ] **Confirmar número de WhatsApp oficial** (actualmente `+503 7000-0001` en código fuente) para completar criterio de 1012.
