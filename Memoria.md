# Actualizaciones de Desarrollo

En esta sesión nos enfocamos en habilitar toda la estructura y plataforma transaccional de los usuarios en relación con la creación, visualización y gestión de equipos para competiciones.

A continuación, se detalla la lista de funciones y lógicas de negocio principales integradas al código:

## 1. Panel de Administración y Estabilidad
- **Solución del Bug Visual del Modal**: Se reparó el problema en el cual los modales de edición del Panel de Administración quedaban ocultos o superpuestos por culpa de los recortes CSS de sus contenedores padre (`clip-path`). Se empleó un sistema de "React Portals" para renderizarlos correctamente sobre el nivel raíz del documento.
- **Validación del Límite de Jugadores**: En la gestión de jugadores del Admin Panel (`AdminPlayers.jsx`), se estableció la norma inquebrantable de que **ningún equipo puede exceder los 7 jugadores**. Si el admin intenta adjudicar un octavo jugador, el sistema disparará un error bloqueando la acción.

## 2. Sistema de Autenticación Público
- **Registro de Nuevos Usuarios (`Register.jsx`)**: Se configuró la vista completa para crear cuentas indicando Nickname, Contraseña y confirmación. Incluye validaciones básicas y tras la validación, el usuario inicia sesión de forma automática y aterriza en la pantalla principal.

## 3. Experiencia Personal del Usuario (Gestión de Equipos)
- **Creación de Equipos Propios (`MyTeams.jsx`)**:
  - Los usuarios logeados disfrutan ahora de su propia página ("Mis Equipos").
  - Un usuario puede "Fundar" un equipo introduciendo Logo, Tag, Nombre y Región.
  - Al crearlo, el motor exige que asigne su papel en la organización (Role System):
    - **Solo Jugador** (Oculta sus poderes administrativos).
    - **Líder / Mánager** (Accede al control administrativo del equipo).
    - **Ambos** (Cumple función de Capitán activo).

## 4. Visualización Privada y Perfiles de Equipo
- **Protección de Navegación (`AuthRoute`)**: Se restringió la visualización profunda limitándola únicamente a los miembros de la red (usuarios que hayan iniciado sesión). Si un invitado anónimo pincha en un equipo, será dirigido a `/login`.
- **Vista Detallada de Equipos (`TeamDetail.jsx`)**: 
  - Al hacer clic en un equipo público (`TeamCard`), se entra a un HUB detallado del equipo.
  - Se diseñó un Hero Banner inmersivo con las estadísticas globales del conjunto competitivo (K/D, Rango, WinRate, Victorias).
  - Se despliega iterativamente el *Roster* de jugadores listando las cartas informativas de sus integrantes (role in-game, Agente Favorito y sus estadísticas o ratios de juego).

## 5. El Sistema de Agencia Libre y Reclutamiento
- **Solicitud de Entrada**: Cualquier usuario que NO pertenezca a ningún equipo ni sea el líder de uno puede acceder a los perfiles de los equipos mediante la vista en profundidad. Si el equipo atacado **no ha cubierto aún sus 7 cupos**, el visitante visualizará el botón verde **"Solicitar Entrada"**.
- **Envío de Petición**: El candidato aporta su perfil como "Duelist - Omen" hacia la base de talentos en espera y la tarjeta le informa visualmente que está a la espera de aprobación (`Solicitud Pendiente`).
- **Bandeja de Reclutamiento para Líderes**: Dentro de "Mis Equipos", automáticamente los líderes ven reflejada en rojo su "Bandeja de Solicitudes". Pueden cotejar a los candidatos y tienen el poder dual de ignorarlos (**Rechazar**) u oprimirlos el botón de **Aceptar**. Al aceptar, el aspirante se materializa instantáneamente en el roster de 5 a 7 jugadores del equipo.

## Entorno Local y Consumo de API Externa

### 1. Despliegue y Correcciones de Entorno (Podman/SELinux)
- **Compatibilidad con Bazzite (Fedora/SELinux)**: Se experimentaron errores de permisos (`EACCES: permission denied`) al levantar el frontend y backend debido a las políticas de SELinux de Podman sobre volúmenes montados. Se solucionó agregando el sufijo `:z` (`./frontend:/app:z`) en el archivo `docker-compose.yml` para posibilitar la lectura/escritura del host hacia los contenedores.
- **Resolución de Imágenes en Podman**: Se especificaron las rutas absolutas de los registros de imágenes (`docker.io/library/node:20-alpine` y `python:3.9-slim`) para evitar bloqueos por *prompts* interactivos al construir la composición.

### 2. Integración de API Pública para Noticias (VLR.gg)
- **Migración a la API V2**: En `vlrApi.js` se actualizó el endpoint público a la última versión alojada en Vercel (`/v2/news`). El código se ajustó para parsear correctamente la nueva estructura de respuesta (`response.data.data.segments`).
- **Mejoras UI en `NewsCard`**:
  - **Autoría**: Se agregó visualmente el nombre del autor (`Por {news.author}`) extraído desde la API.
  - **Enlaces Absolutos Clicables**: Toda la tarjeta de la noticia se ha convertido en un hipervínculo que redirige directamente a la cobertura oficial inyectando el hostname original (`https://vlr.gg...`).
- **Resiliencia (`Fallback`)**: Debido a que la API gratuita de Vercel puede sufrir caídas por límite de cuota (como el reciente error `402 Payment Required`), se garantizó que la página pueda seguir mostrando *Noticias en Modo Prueba* sin romperse mientras el servicio vuelve a estar en línea.

## Mejoras Visuales y Nuevas Funcionalidades

- **Soporte de Imágenes por URL para Logos de Equipos**: Se eliminó la restricción que limitaba los logos de los equipos a caracteres tipo emoji (`maxLength={2}`). Se añadió soporte nativo para URLs ("Logo (URL o Emoji)"), detectándolas en los inputs (`startsWith('http')`) e inyectándolas en formato imagen. Para prevenir deformaciones en el diseño gráfico, se estandarizaron dimensiones predefinidas envolviendo las imágenes con etiquetas `object-cover` y recortes en los componentes `AdminTeams.jsx`, `TeamCard.jsx`, `MatchCard.jsx`, `TeamDetail.jsx` y `MyTeams.jsx`.
- **Calendario Interactivo de Torneos (`EventCalendar.jsx`)**: Se diseñó desde cero una herramienta de calendario mensual incrustada en la Landing Page (`Home.jsx`).
  - La herramienta evalúa algorítmicamente la duración (`startDate` a `endDate`) de los torneos activos e inactivos de la base de datos y destaca dichas celdas visualmente (con colores rojo, dorado y gris).
  - Efectúa una posicionamiento dinámico mes a mes garantizando que, al iniciar la web, el calendario viaje al mes inmediato donde ocurra el evento actual sin necesidad de interacciones mecánicas.
  - Al interactuar sobre las jornadas activas, se desencadena un sistema de ventanas modales enlistando una previsualización de la agenda de competiciones acontecida ese día, otorgando el paso rápido a la tabla de posiciones con el botón de "Ir al Torneo".

## Sesión del 17/04/2026 — Gestión Avanzada de Equipos y Perfil de Usuario

### 6. Filtros Avanzados en el Calendario de Torneos
- **Filtro por Torneo**: Se añadió un selector desplegable en `EventCalendar.jsx` que permite filtrar por un torneo concreto. Al seleccionarlo, el calendario navega automáticamente al primer mes en el que comienza dicho torneo.
- **Filtro por Estado del Torneo**: Se implementó un segundo filtro que permite mostrar únicamente los torneos según su estado: *En Vivo*, *Próximamente* o *Finalizado*.

### 7. Filtros en la Vista de Equipos (`Teams.jsx`)
- **Filtro por Región**: Se habilitó un selector para filtrar equipos por región geográfica.
- **Filtro por Disponibilidad**: Se añadió un filtro que distingue entre equipos que buscan jugadores (con plazas libres) y equipos completos.
- **Ordenación**: Se permite ordenar los resultados por ranking, victorias o win rate.

### 8. Panel de Administración — Gestión de Usuarios (`AdminUsers.jsx`)
- **Nuevo Componente `AdminUsers.jsx`**: Se creó una interfaz administrativa exclusiva para gestionar las cuentas de usuario registradas en la plataforma.
- **Cambio de Roles**: Los administradores pueden asignar roles a los usuarios (`user`, `coach`, `admin`) directamente desde el panel, actualizando la información en `localStorage` (`usersDB`).
- **Eliminación de Usuarios**: Se implementó la funcionalidad de eliminar cuentas de usuario con confirmación previa. Si el usuario eliminado tenía sesión activa, ésta se cierra automáticamente.
- **Integración en `Admin.jsx`**: Se añadió una nueva pestaña "Usuarios" con icono dedicado en la navegación del panel de administración.

### 9. Edición de Equipos desde "Mis Equipos" (`MyTeams.jsx`)
- **Botón "Editar"**: En las tarjetas de equipos donde el usuario es el líder (o tiene role de Coach), aparece un botón "Editar" en la esquina superior derecha.
- **Modal Adaptativo de Edición**: Se reutilizó el modal de creación de equipos para la edición. Cuando se abre en modo edición (`isEditMode`), los campos se precargan con los datos actuales del equipo (Nombre, Tag, Región, Logo).
- **Campos Ocultos en Edición**: Los selectores de role del fundador ("Solo Jugador" / "Mánager" / "Ambos") se ocultan durante la edición para evitar conflictos con los roles ya establecidos.

### 10. Gestión de Plantilla de Equipos
- **Sección "Gestión de Plantilla"**: Al editar un equipo, se muestra en el modal una lista completa de todos los jugadores que forman parte de la alineación.
- **Roles Internos del Equipo**: Junto a cada miembro (excepto el fundador), se incluye un selector desplegable con tres opciones:
  - **Jugador**: Miembro estándar sin privilegios de gestión.
  - **Solo Coach**: Miembro con permisos de edición y gestión del equipo, sin participar como jugador activo.
  - **Jugador y Coach**: Miembro que cumple ambas funciones simultáneamente.
- **Expulsión de Jugadores**: Se añadió un botón "X" junto a cada miembro (protegiendo al fundador) que permite expulsar jugadores con confirmación de seguridad.
- **Permisos Extendidos**: Los usuarios con role "Coach" o "Jugador y Coach" dentro del equipo obtienen automáticamente acceso al botón de edición del equipo (`canEditTeam`).

### 11. Diferenciación Visual de Roles en las Tarjetas de Equipos
- **`TeamCard.jsx` (Vista General)**: En el listado de equipos, cada integrante del roster se muestra con una etiqueta de color según su role interno:
  - Dorado (`text-valorant-gold`) para Coaches.
  - Azul (`text-blue-400`) para Jugador/Coach.
  - Blanco (`text-white`) para Jugadores estándar.
- **`TeamDetail.jsx` (Vista Ampliada)**: En la vista detallada del equipo, cada tarjeta de jugador incluye una etiqueta superior con el role (`[COACH]`, `[JUG/COACH]`, `[JUGADOR]`) con colores diferenciados y bordes a juego.
- **Inclusión del Mánager/Coach**: Si el líder/fundador del equipo no estaba registrado como jugador en el roster, ahora se añade automáticamente al principio de la lista de integrantes para que sea visible en ambas vistas.

### 12. Página de Perfil de Usuario (`Profile.jsx`)
- **Nueva Vista Completa de Perfil**: Se creó la página `/profile` con las siguientes secciones:
  - **Hero / Cabecera**: Avatar (emoji editable), nombre de jugador personalizable y descripción/bio editable.
  - **Insignias / Logros**: Sistema de badges automáticos que se desbloquean según la actividad del usuario (Tiene Equipo, Líder, Competidor, 100+ Kills, Clutch Master).
  - **Estadísticas como Jugador**: Bloque visual con Kills, Deaths, Assists, K/D, ADR, HS% y Clutches. Si el usuario no tiene datos en `mockPlayers`, se inicializan en 0 y son editables.
  - **Mis Equipos**: Lista de equipos del usuario con su role interno, enlazados a la vista detallada de cada equipo.
  - **Torneos**: Torneos en los que ha participado a través de sus equipos, cruzando datos con `mockMatches` y `mockTournaments`.
  - **Historial de Partidas**: Partidas jugadas con resultados, mapa, ronda y estado (victoria/derrota/en vivo).
  - **Cerrar Sesión**: Botón rojo al final de la página con confirmación antes de desconectar.
- **Persistencia**: Los datos editables del perfil se guardan en `localStorage` bajo la clave `profileData_{username}`.
- **Integración en `App.jsx`**: Se añadió la ruta `/profile` protegida con `AuthRoute`.
- **Integración en `Navbar.jsx`**: Se reemplazó el botón "Cerrar Sesión" de la barra de navegación por un enlace al perfil del usuario que muestra su nombre de usuario. El cierre de sesión se gestiona ahora exclusivamente desde la página de perfil.