# language: es
@1007 @Aceptacion @Reservas @Edicion @API
Característica: Modificación de reserva activa existente
  Como administrador de la sucursal
  Quiero actualizar los datos del cliente, teléfono o reprogramar el horario de una reserva activa
  Para atender cambios solicitados por los clientes manteniendo la integridad y disponibilidad del sistema.

  Criterios de Aceptación:
  - El administrador puede modificar una reserva activa existente indicando su ID a través de una petición HTTP PUT.
  - La modificación permite actualizar el nombre del cliente, número de WhatsApp, horario de inicio y fin, cancha y precio total.
  - El sistema valida las mismas reglas temporales que en la creación (no mayor a 10 días, no retroactivo, fecha fin posterior a inicio).
  - La validación de solapamiento excluye a la propia reserva que se está editando (`r.Id != id`).
  - Al completar la actualización, el sistema responde con código HTTP 200 OK y devuelve el DTO con la información actualizada.

  Escenario: Modificación exitosa de datos de cliente y horario en reserva activa
    Dado que existe una reserva activa registrada con identificador <reservaId>
    Y el administrador requiere ajustar el teléfono del cliente y desplazar el horario 1 hora
    Cuando el administrador envía una solicitud PUT a "/api/Reservas/<reservaId>" con los nuevos datos:
      | canchaId         | <canchaId>             |
      | usuarioAdminId   | 1                      |
      | nombreCliente    | Carlos Alvarenga Jr.   |
      | telefonoWhatsApp | +503 7888-9999         |
      | fechaHoraInicio  | <nuevoHorarioInicio>   |
      | fechaHoraFin     | <nuevoHorarioFin>      |
      | precioTotal      | 15.00                  |
    Entonces la respuesta del servidor tiene código de estado 200 OK
    Y el cuerpo de la respuesta contiene "nombreCliente" igual a "Carlos Alvarenga Jr."
    Y el campo "telefonoWhatsApp" se actualiza a "+503 7888-9999"
    Y el campo "precioTotal" refleja el nuevo valor 15.00
