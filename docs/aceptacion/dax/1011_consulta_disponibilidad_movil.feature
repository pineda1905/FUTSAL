# language: es
@1011 @Aceptacion @AppMovil @Espectador
Característica: Consulta pública de disponibilidad en App Móvil
  Como cliente o espectador no autenticado
  Quiero consultar el calendario y los bloques horarios disponibles de las canchas desde la aplicación móvil
  Para conocer la disponibilidad de las canchas sin necesidad de iniciar sesión y con total privacidad de los datos de otros clientes.

  Criterios de Aceptación:
  - El usuario puede acceder a la pestaña de disponibilidad sin requerir autenticación previa (fricción cero).
  - Los bloques horarios solo deben mostrar los estados generales ("Disponible" o "Reservado").
  - En ningún caso deben visualizarse nombres, números telefónicos ni información personal de quienes hayan reservado.

  Escenario: Consulta exitosa de disponibilidad horaria sin exposición de datos privados
    Dado que el usuario tiene abierta la aplicación móvil FutsalPro en su dispositivo o emulador
    Y no ha iniciado sesión con ninguna cuenta (acceso público como espectador)
    Cuando navega a la pantalla "Reservas" y selecciona una cancha
    Y selecciona una fecha en el calendario dentro de los próximos 10 días
    Entonces la aplicación muestra la lista o cuadrícula de turnos horarios
    Y los bloques con reservas previas se muestran identificados como "Reservado" o no disponibles
    Y no se expone el nombre, número de teléfono ni datos privados del cliente que reservó dicho turno
