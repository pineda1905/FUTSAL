# Resumen de Pruebas de Aceptación - Anderson Pineda

**Proyecto:** FutsalPro  
**Responsable:** Anderson Pineda  
**Estándar de Pruebas:** ISO/IEC/IEEE 29119  
**Ruta de Artefactos:** `docs/aceptacion/anderson/`

---

## Matriz de Casos de Aceptación

| ID | Historia de Usuario | Criterio de Aceptación Principal | Estado |
|---|---|---|---|
| **1003** | Como administrador de la sucursal, quiero agendar alquileres de canchas por horas para clientes que se comunican por WhatsApp o teléfono, para garantizar que la disponibilidad se respete y no existan colisiones de horario. | Reserva creada con estado "Confirmada", tarifa de $10/hr y visible en la agenda administrativa (`POST /api/Reservas` retorna 201 Created). | **Planificado** |
| **1004** | Como administrador del sistema, quiero que el sistema valide la anticipación máxima permitida para las reservas, para evitar bloqueos de canchas a fechas excesivamente lejanas. | El sistema no permite agendar reservas que superen la ventana máxima de 10 días de anticipación (Retorna HTTP 400 Bad Request con mensaje descriptivo de límite máximo). | **Planificado** |
| **1005** | Como administrador del sistema, quiero que el sistema impida programar reservas en fechas u horas pasadas, para mantener la coherencia cronológica de la agenda. | Rechazo estricto con mensaje: "La fecha y hora de inicio no puede ser anterior al momento actual." (HTTP 400 Bad Request). | **Planificado** |
| **1006** | Como administrador de la sucursal, quiero que el sistema bloquee reservas que coincidan en horario sobre la misma cancha, para evitar conflictos y doble reservación. | No se permite registrar dos reservas activas con solapamiento en la misma cancha. Mensaje: "La cancha seleccionada ya cuenta con una reserva activa en el rango horario solicitado." (HTTP 400 Bad Request). Si la reserva previa está Cancelada, permite el registro (201 Created). | **Planificado** |
| **1007** | Como administrador de la sucursal, quiero actualizar los datos del cliente o cambiar el horario de una reserva activa, para atender cambios solicitados por los clientes dentro de los bloques disponibles. | Reserva actualizada exitosamente reflejando nuevos datos de cliente y horario en el panel y en BD (`PUT /api/Reservas/{id}` retorna HTTP 200 OK). | **Planificado** |
| **1020** | Como administrador de torneos, quiero que el sistema impida marcar un torneo como Finalizado si existen partidos pendientes de jugar o sin ganador definido, para garantizar la integridad deportiva de la competencia. | Rechazo con mensaje: "No se puede marcar el torneo como Finalizado. Aún hay N partido(s) pendiente(s) de jugar o sin ganador definido. Todos los partidos deben completarse o cancelarse el torneo con una justa razón." (HTTP 400 Bad Request). | **Planificado** |

> **Nota:** Ningún caso ha sido marcado como aprobado. Los estados permanecerán como **Planificado** hasta que sean ejecutados y validados manualmente en el entorno local o mediante el cliente REST.

---

## Estructura de Archivos Generados

```
docs/aceptacion/anderson/
├── 1003_registrar_reserva_convencional_10_dias.feature
├── 1004_rechazo_reserva_mas_de_10_dias.feature
├── 1005_rechazo_reserva_horario_retroactivo.feature
├── 1006_prevencion_solapamiento_horario_cancha.feature
├── 1007_modificacion_reserva_activa_existente.feature
├── 1020_validacion_marcar_torneo_finalizado.feature
├── RESUMEN.md
├── api/
│   ├── 1003_crear_reserva_valida.http
│   ├── 1004_reserva_mas_10_dias.http
│   ├── 1005_reserva_retroactiva.http
│   ├── 1006_solapamiento_horario.http
│   ├── 1007_modificar_reserva.http
│   └── 1020_finalizar_torneo_pendientes.http
└── evidencias/
    ├── 1003.md
    ├── 1004.md
    ├── 1005.md
    ├── 1006.md
    ├── 1007.md
    └── 1020.md
```
