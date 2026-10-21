# language: es
@1021 @Aceptacion @Torneos @Cancelacion @API
Característica: Cancelación administrativa de torneo con motivo obligatorio
  Como administrador del sistema
  Quiero cancelar un torneo indicando obligatoriamente una causa justificada
  Para suspender formalmente la competición y que quede constancia del motivo para los participantes.

  Criterios de Aceptación:
  - Al cambiar el estado de un torneo a "Cancelado" (EstadoId = 4), es mandatorio proveer el campo "motivoCancelacion".
  - Si se proporciona un motivo válido, el torneo actualiza su estado a Cancelado (EstadoId = 4) y persiste la justificación retornando 200 OK.
  - Si el motivo se envía nulo, vacío o con puros espacios en blanco, la solicitud es rechazada con código 400 Bad Request y mensaje: "Para cancelar el torneo es obligatorio ingresar una justa razón (motivo de cancelación).".

  Escenario: Cancelación exitosa de un torneo con motivo justificado
    Dado que existe un torneo registrado con identificador <torneoId> en estado activo o programado
    Cuando el administrador envía una solicitud PUT a "/api/Torneos/<torneoId>" con:
      | estadoId          | 4                                         |
      | motivoCancelacion | Reparación de iluminación de la sucursal  |
    Entonces la respuesta tiene código de estado 200 OK
    Y el torneo pasa a tener "estadoId" igual a 4 (Cancelado)

  Escenario: Rechazo de cancelación cuando el motivo está vacío o ausente
    Dado que existe un torneo registrado con identificador <torneoId>
    Cuando el administrador envía una solicitud PUT a "/api/Torneos/<torneoId>" con:
      | estadoId          | 4  |
      | motivoCancelacion |    |
    Entonces la respuesta tiene código de estado 400 Bad Request
    Y el cuerpo de la respuesta contiene el mensaje "Para cancelar el torneo es obligatorio ingresar una justa razón (motivo de cancelación)."
