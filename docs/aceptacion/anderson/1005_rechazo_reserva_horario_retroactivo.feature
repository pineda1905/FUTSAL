# language: es
@1005 @Aceptacion @Reservas @ValidacionFecha @API
Característica: Rechazo de reserva en horario retroactivo
  Como administrador del sistema
  Quiero que el sistema impida programar reservas en fechas u horas pasadas
  Para asegurar la coherencia temporal de la agenda y evitar fraudes o inconsistencias operativas.

  Criterios de Aceptación:
  - El sistema no permite agendar reservas cuya fecha y hora de inicio sea anterior al momento exacto en que se procesa la solicitud.
  - Al recibir una fecha retroactiva, la solicitud es rechazada con código HTTP 400 Bad Request.
  - El mensaje de error devuelto debe indicar con precisión: "La fecha y hora de inicio no puede ser anterior al momento actual."

  Escenario: Intento de agendar reserva con fecha de inicio en el pasado
    Dado que el usuario administrador se encuentra autenticado con un token JWT válido
    Y existe una cancha registrada con ID <canchaId>
    Cuando el administrador envía una solicitud POST a "/api/Reservas" con una fecha retroactiva:
      | canchaId         | <canchaId>                  |
      | usuarioAdminId   | 1                           |
      | nombreCliente    | David Castillo              |
      | telefonoWhatsApp | +503 7000-1122              |
      | fechaHoraInicio  | <fechaInicioEnElPasado>     |
      | fechaHoraFin     | <fechaFinEnElPasadoMas1Hora>|
      | precioTotal      | 10.00                       |
    Entonces la respuesta del servidor tiene código de estado 400 Bad Request
    Y el cuerpo de la respuesta contiene el mensaje "La fecha y hora de inicio no puede ser anterior al momento actual."
