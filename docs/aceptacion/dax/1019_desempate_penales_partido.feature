# language: es
@1019 @Aceptacion @Torneos @Marcadores @API
Característica: Definición de desempate / penales en partido igualado
  Como administrador del torneo
  Quiero registrar el marcador regular empatado y seleccionar al equipo ganador definido por penales
  Para clasificar al equipo vencedor a la siguiente fase de la competencia.

  Criterios de Aceptación:
  - En caso de empate en goles regulares (ej. 2 - 2), el administrador debe proveer el `GanadorId` correspondiente a la definición por penales.
  - El sistema persiste tanto el empate en goles regulares como el ID del equipo ganador en `PartidosTorneo`.
  - [Escenario Negativo / Defecto Detectado]: Si se envía un `GanadorId` correspondiente a un equipo ajeno al partido, el sistema debería rechazar la operación; no obstante, se documenta el comportamiento actual para reporte de defecto.

  Escenario: Definición exitosa de ganador por penales tras empate en tiempo regular
    Dado que existe un partido de torneo registrado con identificador <partidoId>
    Y el partido enfrenta a dos equipos válidos con IDs <equipoLocalId> y <equipoVisitaId>
    Cuando el administrador envía una solicitud PUT a "/api/Torneos/partidos/<partidoId>" con:
      | golesLocal | 2                |
      | golesVisita| 2                |
      | ganadorId  | <equipoLocalId>  |
    Entonces la respuesta tiene código de estado 200 OK
    Y el cuerpo de la respuesta contiene "golesLocal" igual a 2 y "golesVisita" igual a 2
    Y el campo "ganadorId" del partido corresponde a <equipoLocalId>

  Escenario: Envío de GanadorId perteneciente a un equipo ajeno al partido (Defecto Azure Boards)
    Dado que existe un partido de torneo registrado con identificador <partidoId>
    Cuando el administrador envía una solicitud PUT a "/api/Torneos/partidos/<partidoId>" con:
      | golesLocal | 1        |
      | golesVisita| 1        |
      | ganadorId  | 99999    |
    Entonces la respuesta evidencia el comportamiento permisivo actual retornando código 200 OK
    Y se constata la ausencia de validación de pertenencia de equipo para registro de defecto en Azure Boards
