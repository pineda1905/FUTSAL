# language: es
@1004 @Aceptacion @Reservas @ReglaNegocio @API
Característica: Rechazo de reserva con más de 10 días de anticipación
  Como administrador del sistema
  Quiero que el sistema valide la anticipación máxima permitida para las reservas
  Para evitar bloqueos de canchas a fechas excesivamente lejanas y garantizar una rotación justa.

  Criterios de Aceptación:
  - El sistema no permite agendar reservas que superen la ventana estricta de 10 días de anticipación contados a partir del momento actual.
  - Al enviar una fecha de inicio superior a 10 días, el sistema rechaza la solicitud con código HTTP 400 Bad Request.
  - El mensaje descriptivo debe indicar: "No es posible reservar con más de 10 días de anticipación. Límite máximo permitido: <fechaLimite>."

  Escenario: Intento de agendar reserva superando los 10 días de anticipación
    Dado que el usuario administrador se encuentra autenticado con un token JWT válido
    Y existe una cancha de fútbol sala registrada con ID <canchaId>
    Cuando el administrador intenta crear una reserva enviando una solicitud POST a "/api/Reservas" con:
      | canchaId         | <canchaId>                  |
      | usuarioAdminId   | 1                           |
      | nombreCliente    | Mario Mendoza               |
      | telefonoWhatsApp | +503 7987-6543              |
      | fechaHoraInicio  | <fechaInicioEn11Dias>       |
      | fechaHoraFin     | <fechaFinEn11DiasMas1Hora>  |
      | precioTotal      | 10.00                       |
    Entonces la respuesta del servidor tiene código de estado 400 Bad Request
    Y el cuerpo de la respuesta contiene un mensaje de error que inicia con "No es posible reservar con más de 10 días de anticipación"
