# language: es
@1022 @Aceptacion @AppMovil @Torneos @Espectador
Característica: Visualización de fixture y marcadores en tiempo real (App Móvil)
  Como espectador o aficionado del torneo
  Quiero consultar el árbol de llaves y los marcadores actualizados desde mi teléfono móvil
  Para dar seguimiento a los cruces de Cuartos de Final y conocer los equipos clasificados sin necesidad de recargar la aplicación manualmente.

  Criterios de Aceptación:
  - El usuario puede navegar a la pestaña "Torneos" y seleccionar un torneo activo (ej. "Copa Relámpago").
  - Se visualiza el esquema de llaves mostrando los cruces de Cuartos de Final con los nombres de los equipos y sus marcadores actuales (ej. 4-2, 1-3).
  - La aplicación consulta periódicamente la API o permite pull-to-refresh reflejando marcadores actualizados y equipos ganadores en tiempo real.

  Escenario: Visualización exitosa de llaves de Cuartos de Final y marcadores actualizados
    Dado que el usuario tiene abierta la aplicación FutsalPro en su dispositivo o emulador móvil
    Cuando accede a la pestaña "Torneos"
    Y selecciona un torneo que cuenta con partidos registrados
    Entonces la aplicación renderiza el árbol interactivo de llaves correspondiente a "Cuartos de Final"
    Y muestra cada enfrentamiento con el nombre del equipo local, equipo visitante y sus respectivos goles
    Y los equipos ganadores o clasificados se destacan visualmente frente a los eliminados
    Y al actualizarse los datos en el servidor, los nuevos marcadores se reflejan en la vista del usuario
