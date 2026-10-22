# language: es
@1003 @Aceptacion @Reservas @Alquiler @API
Característica: Registro de reserva convencional dentro de la ventana de 10 días
  Como administrador de la sucursal
  Quiero agendar alquileres de canchas por horas para clientes que se comunican por WhatsApp o teléfono
  Para garantizar que la disponibilidad se respete y no existan colisiones de horario.

  Criterios de Aceptación:
  - Dado un administrador autenticado en el sistema.
  - Cuando intenta registrar una reserva de cancha con fecha de inicio entre hoy y un máximo de 10 días de anticipación.
  - El sistema crea la reserva con Estado 'Confirmada', tarifa correspondiente ($10/hr) y código de respuesta HTTP 201 Created con cabecera Location.

  Escenario: Registro exitoso de reserva convencional para fecha válida dentro de 10 días
    Dado que el usuario administrador se encuentra autenticado con un token JWT válido
    Y existe una cancha de fútbol sala registrada y activa con ID <canchaId>
    Cuando el administrador envía una solicitud POST a "/api/Reservas" con los datos:
      | canchaId         | <canchaId>                  |
      | usuarioAdminId   | 1                           |
      | nombreCliente    | Carlos Alvarenga            |
      | telefonoWhatsApp | +503 7123-4567              |
      | fechaHoraInicio  | <fechaInicioEn3Dias>        |
      | fechaHoraFin     | <fechaFinEn3DiasMas1Hora>   |
      | precioTotal      | 10.00                       |
    Entonces la respuesta del servidor tiene código de estado 201 Created
    Y la cabecera "Location" contiene la URL del recurso creado "/api/Reservas/<reservaId>"
    Y el cuerpo de la respuesta contiene "nombreEstado" igual a "Confirmada"
    Y el identificador de reserva "id" generado es mayor a 0
