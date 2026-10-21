# language: es
@1012 @Aceptacion @AppMovil @Espectador
Característica: Redirección mediante Deep Link hacia WhatsApp
  Como cliente o espectador de la app móvil
  Quiero presionar el botón de reserva rápida para contactar a administración por WhatsApp
  Para solicitar un turno o consultar dudas con un mensaje preconfigurado sin tener que copiar manualmente el número.

  > **Nota de Implementación:** Pendiente de confirmar con quien lo implementó.
  > **Dato a confirmar:** Número oficial de WhatsApp de la cancha (en código fuente figura: `+503 7000-0001` / `50370000001`).

  Criterios de Aceptación:
  - Al pulsar el botón flotante "Reservar Ahora" / "Consultar Disponibilidad por WhatsApp", la aplicación invoca el esquema deep link `whatsapp://send` (o fallback web `https://wa.me/`).
  - Se abre la aplicación oficial de WhatsApp con el chat de la cancha preconfigurado.
  - El mensaje inicial incluye la fecha consultada y el texto predeterminado de solicitud de reserva.

  Escenario: Redirección exitosa hacia WhatsApp con mensaje inicial
    Dado que el usuario se encuentra en la pantalla de "Reservas" de la app móvil FutsalPro
    Y ha seleccionado una fecha en el calendario (ej. fecha actual o futura)
    Cuando presiona el botón "Reservar Turno por WhatsApp" o "Consultar Disponibilidad por WhatsApp"
    Entonces el sistema operativo abre la aplicación externa de WhatsApp
    Y se abre el chat dirigido al número telefónico de la administración (dato a confirmar: `+503 7000-0001`)
    Y el campo de texto contiene el mensaje inicial precargado con la fecha seleccionada y requisitos de reserva
