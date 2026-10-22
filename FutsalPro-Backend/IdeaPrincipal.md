# Documento de Definición del Proyecto y Arquitectura: Sistema Móvil de Reservas y Torneos de Fútbol Sala

## 1. Visión General del Producto
El sistema evoluciona a un modelo multiplataforma que separa el consumo de información de la gestión operativa de una sucursal única de canchas de fútbol sala. Elimina la necesidad de registro de clientes para maximizar la adopción. Se manejan dos flujos operativos principales: alquiler convencional por horas y gestión de torneos de eliminación directa.

*   **Frontend Móvil (App de Espectador):** Aplicación de solo lectura orientada al cliente final. No requiere registro ni inicio de sesión (fricción cero). Su propósito es informativo y de conversión rápida.
*   **Frontend Web/PC (Panel Administrativo):** Aplicación web optimizada para pantallas de escritorio, diseñada para el uso interno en la recepción de la sucursal. Centraliza toda la escritura de datos mediante una única cuenta de acceso compartida.

## 2. Roles y Permisos

**Espectador / Invitado (Solo Lectura - App Móvil):**
*   Acceso al calendario de disponibilidad (visualiza bloques como "Disponible" o "Reservado" sin revelar datos de quien reserva).
*   Visualización de llaves de torneos activos y marcadores finales.
*   Visualización del reglamento y tarifas.
*   **Deep Linking:** Botón flotante permanente de "Reservar ahora" que redirige a WhatsApp con un mensaje predefinido para agendar con la administración.

**Administrador (Lectura y Escritura - Requiere Login en PC):**
*   Único usuario con permisos para crear, editar o eliminar (CRUD) reservas y torneos desde el panel web.
*   Ingresa manualmente los datos del cliente que solicita la reserva por teléfono o mensaje.
*   Actualiza los marcadores únicamente una vez finalizados los partidos.
*   Gestiona la inscripción de equipos y el estado del torneo.

## 3. Reglas de Negocio: Reservas Convencionales
*   **Tarifa base:** $10 por hora, independientemente del número de jugadores. Se permiten equipos de 5 en cancha (máximo 8 jugadores incluyendo cambios).
*   **Reglamento de calzado:** Prohibido el uso de tacos; uso exclusivo de zapatos de fútbol sala.
*   **Validaciones de Tiempo:** Las reservas solo pueden agendarse desde el día actual hasta un máximo de 10 días de anticipación. No se permiten reservas retroactivas.
*   **Gestión de Cancelaciones:** Toda cancelación (ej. abandono, clima, decisión administrativa) exige que el administrador ingrese un motivo de cancelación obligatorio antes de actualizar el registro en la base de datos.
*   **Arbitraje:** Las reservas de alquiler convencional por hora no incluyen ni requieren árbitro para agendarse.

## 4. Reglas de Negocio: Torneos (Eliminación Directa)
*   **Categorías de Inscripción:** Divididas por género (Femenino / Masculino) y por rango de edad (14 a 17 años / 18 años en adelante).
*   **Validaciones de Tiempo:** Los torneos deben solicitarse con un mínimo de 7 días y un máximo de 20 días de anticipación respecto a la fecha actual.
*   **Estructura del Fixture (Árbol de Eliminación):**
    *   Límite máximo de 16 equipos por torneo.
    *   La arquitectura del sistema generará llaves únicamente para Octavos, Cuartos y Semifinales.
    *   La Final no forma parte del árbol automatizado; se gestionará operativamente como una reserva de hora convencional.
*   **Manejo de Llaves Impares (Byes):** Si el torneo cuenta con equipos impares (ej. 7 equipos), el administrador asignará manualmente un resultado de 3-0 a favor del equipo real contra un "equipo inexistente", permitiéndole avanzar de ronda sin alterar la lógica del software.
*   **Arbitraje Obligatorio:** Todo partido de torneo requiere la asignación de un árbitro formal bajo las reglas de fútbol sala. La aplicación no registrará incidencias durante el partido (como tarjetas o faltas); el administrador únicamente tomará el marcador final validado por el árbitro para actualizar el sistema.

## 5. Arquitectura Full-Stack del Sistema
El ecosistema se divide oficialmente en estos cuatro bloques, garantizando una arquitectura distribuida y funcional:

1.  **Base de Datos (Nube):** SQL Server alojado en MonsterASP.
2.  **Motor de Reglas (Backend):** Web API en .NET (C#) alojada en Render. Programación de controladores con las reglas de validación de fechas (10 días vs. 7-20 días). Adaptación de las entidades en la base de datos para registrar las categorías del torneo y los motivos de cancelación obligatorios. *Nota operativa: Distribuir los endpoints de reservas convencionales y los endpoints de generación de llaves de torneo equitativamente con Franklin para optimizar los tiempos de desarrollo.*
3.  **Interfaz de Clientes (Móvil):** App React Native gestionada con **Expo Development Builds (Expo Dev Client)**. Construcción de las vistas móviles condicionales de solo lectura e integración del enlace profundo (Deep Link) hacia WhatsApp.
4.  **Interfaz de Administración (Escritorio):** Aplicación React.js empaquetada con Vite y diseñada con Tailwind CSS, protegida por autenticación para el ingreso administrativo de reservas y marcadores.

## 6. Stack Tecnológico: Frontend Web (Panel Administrativo)
Para el desarrollo de la interfaz de administración en escritorio, se utilizarán estrictamente las siguientes herramientas:

*   **El Motor (Vite):** Es la herramienta de construcción moderna que reemplaza al antiguo create-react-app. Levanta el servidor local instantáneamente y compila el código de JavaScript mucho más rápido.
*   **El Framework (React.js):** Manejará toda la lógica visual en el navegador. Se encargará de leer el token JWT, proteger las rutas para que solo los administradores entren, y renderizar las tablas dinámicas.
*   **El Diseño (Tailwind CSS):** Un framework de utilidades CSS. En lugar de escribir archivos .css gigantes, se aplicarán clases directamente en el HTML (ej. `class="bg-blue-500 text-white"`) para diseñar rápidamente el dashboard, los formularios y los modales.
*   **El Comunicador (Axios):** Es la librería estándar de JavaScript que se encargará de disparar las peticiones HTTP (GET, POST, PUT) hacia la API en Render.

## 7. Estructura y Prevención de Conflictos
Para garantizar que el proyecto no colapse, **la regla inquebrantable es el aislamiento físico.**
*   Este panel web debe vivir en su propia carpeta llamada `FutsalPro-WebAdmin`, ubicada en la raíz de su repositorio, completamente separada de la carpeta del backend en C# y de la carpeta de la app móvil.
*   Como React y Vite utilizan Node.js, descargarán una carpeta pesada llamada `node_modules`. Si esta carpeta se mezcla accidentalmente con el código de .NET o de Expo, los compiladores entrarán en conflicto.
*   La inicialización manual en la terminal para crear esta capa será estrictamente mediante el comando:
    `npm create vite@latest FutsalPro-WebAdmin -- --template react`