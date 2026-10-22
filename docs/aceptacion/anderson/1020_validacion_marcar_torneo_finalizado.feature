# language: es
@1020 @Aceptacion @Torneos @Finalizacion @ReglaNegocio @API
Característica: Validación para marcar torneo como Finalizado
  Como administrador de torneos
  Quiero que el sistema impida marcar un torneo como Finalizado si existen partidos pendientes de jugar o sin ganador definido
  Para garantizar la integridad deportiva de la competencia y asegurar que todas las llaves hayan concluido formalmente.

  Criterios de Aceptación:
  - El sistema no permite cambiar el estado de un torneo a "Finalizado" (`EstadoId = 3`) si tiene partidos sin resultado o con `GanadorId` nulo.
  - Al intentar finalizar un torneo con encuentros pendientes, la API responde con código HTTP 400 Bad Request.
  - El mensaje devuelto debe indicar: "No se puede marcar el torneo como Finalizado. Aún hay <N> partido(s) pendiente(s) de jugar o sin ganador definido. Todos los partidos deben completarse o cancelarse el torneo con una justa razón."

  Escenario: Rechazo al intentar finalizar un torneo con partidos pendientes de resultado
    Dado que existe un torneo en curso registrado con identificador <torneoId>
    Y el torneo cuenta con partidos de fixture que aún no tienen marcador ni ganador asignado
    Cuando el administrador envía una solicitud PUT a "/api/Torneos/<torneoId>" intentando actualizar el estado a Finalizado:
      | nombre            | Torneo Clausura              |
      | rangoEdad         | Libre                        |
      | fechaInicio       | <fechaInicioEn20Dias>        |
      | generoId          | 1                            |
      | usuarioAdminId    | 1                            |
      | estadoId          | 3                            |
    Entonces la respuesta del servidor tiene código de estado 400 Bad Request
    Y el cuerpo de la respuesta contiene un mensaje que inicia con "No se puede marcar el torneo como Finalizado. Aún hay"
    Y el torneo mantiene su estado previo sin modificarse a Finalizado
