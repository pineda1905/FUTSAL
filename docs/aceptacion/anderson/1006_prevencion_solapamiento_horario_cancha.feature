# language: es
@1006 @Aceptacion @Reservas @Solapamiento @API
Característica: Prevención de solapamiento de horarios en la misma cancha
  Como administrador de la sucursal
  Quiero que el sistema bloquee reservas que colisionen en fecha y horario sobre la misma cancha
  Para garantizar la exclusividad del uso de la pista y evitar duplicidades de alquiler.

  Criterios de Aceptación:
  - No se permite registrar dos reservas activas (no canceladas) cuyos intervalos horarios se crucen total o parcialmente en la misma cancha.
  - El solapamiento se evalúa con la condición: `FechaHoraInicio < r.FechaHoraFin && FechaHoraFin > r.FechaHoraInicio`.
  - Las reservas con estado 'Cancelada' quedan excluidas de esta restricción y permiten que su bloque horario vuelva a alquilarse.
  - Si existe conflicto con una reserva activa, la API responde con código HTTP 400 Bad Request y el mensaje: "La cancha seleccionada ya cuenta con una reserva activa en el rango horario solicitado."

  Escenario: Rechazo de reserva por solapamiento con una reserva activa preexistente
    Dado que existe una cancha con ID <canchaId>
    Y dicha cancha ya cuenta con una reserva activa en el rango de 18:00 a 19:00 horas
    Cuando el administrador intenta agendar en la misma cancha para el rango de 18:30 a 19:30 horas
    Entonces la solicitud POST a "/api/Reservas" es rechazada con código de estado 400 Bad Request
    Y el cuerpo de la respuesta contiene el mensaje "La cancha seleccionada ya cuenta con una reserva activa en el rango horario solicitado."

  Escenario: Aceptación de reserva en horario liberado por una reserva previamente cancelada
    Dado que existe una cancha con ID <canchaId>
    Y existe una reserva previa en dicha cancha de 20:00 a 21:00 pero se encuentra en Estado "Cancelada"
    Cuando el administrador intenta agendar una nueva reserva en esa misma cancha de 20:00 a 21:00 horas
    Entonces la solicitud POST a "/api/Reservas" es procesada exitosamente con código de estado 201 Created
    Y la nueva reserva es asignada con Estado "Confirmada"
