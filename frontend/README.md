# Valorant Tournament Platform - Frontend

Frontend de la plataforma de gestión de torneos de VALORANT con diseño inspirado en el juego.

## 🎨 Características

- **Diseño Valorant**: Colores, tipografía y estética inspirados en VALORANT
- **Responsive**: Diseño adaptable a todos los dispositivos
- **Animaciones**: Efectos de hover, transiciones suaves y micro-animaciones
- **Integración VLR.gg**: Noticias y datos reales del mundo competitivo de VALORANT
- **Datos de Demostración**: Torneos, equipos y jugadores ficticios para mostrar funcionalidad

## 🛠️ Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de CSS utility-first
- **React Router** - Navegación entre páginas
- **Axios** - Cliente HTTP para APIs
- **Framer Motion** - Animaciones (opcional)

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── TournamentCard.jsx
│   │   ├── TeamCard.jsx
│   │   ├── MatchCard.jsx
│   │   ├── NewsCard.jsx
│   │   └── LoadingSpinner.jsx
│   ├── pages/          # Páginas de la aplicación
│   │   ├── Home.jsx
│   │   ├── Tournaments.jsx
│   │   ├── TournamentDetail.jsx
│   │   ├── Teams.jsx
│   │   ├── Players.jsx
│   │   ├── News.jsx
│   │   └── Admin.jsx
│   ├── services/       # Servicios de API
│   │   ├── vlrApi.js
│   │   └── backendApi.js
│   ├── data/           # Datos de demostración
│   │   └── mockData.js
│   ├── App.jsx         # Componente principal
│   ├── main.jsx        # Punto de entrada
│   └── index.css       # Estilos globales
├── package.json
├── vite.config.js
├── tailwind.config.js
└── Dockerfile
```

## 🚀 Desarrollo Local

### Con Docker (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up frontend
```

La aplicación estará disponible en `http://localhost:5173`

### Sin Docker

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🎨 Paleta de Colores Valorant

- **Rojo Principal**: `#FF4655`
- **Oscuro**: `#0F1923`
- **Oscuro Secundario**: `#1C252E`
- **Oscuro Terciario**: `#293641`
- **Acento**: `#FD4556`
- **Claro**: `#ECE8E1`
- **Dorado**: `#F4AA3A`

## 📄 Páginas

### Home (`/`)
- Hero section con estadísticas
- Torneos destacados
- Top equipos
- Noticias de VLR.gg

### Torneos (`/tournaments`)
- Lista de todos los torneos
- Filtros por estado (En vivo, Próximos, Finalizados)
- Búsqueda por nombre o región

### Detalle de Torneo (`/tournaments/:id`)
- Información del torneo
- Partidos
- Bracket del torneo

### Equipos (`/teams`)
- Directorio de equipos
- Estadísticas de victorias/derrotas
- Búsqueda y filtrado

### Jugadores (`/players`)
- Tabla de clasificación
- Estadísticas (K/D, ADR, HS%, Clutches)
- Filtros por rol

### Noticias (`/news`)
- Noticias de VLR.gg API
- Filtros por categoría
- Fallback a datos de demostración

### Admin (`/admin`)
- Panel de administración (UI básica)
- Gestión de torneos, equipos, partidos y usuarios

## 🔌 Integración de APIs

### VLR.gg API
```javascript
import vlrApi from './services/vlrApi';

// Obtener noticias
const news = await vlrApi.getNews();

// Obtener partidos
const matches = await vlrApi.getMatches();

// Obtener rankings
const rankings = await vlrApi.getRankings('emea');
```

### Backend API
```javascript
import backendApi from './services/backendApi';

// Probar conexión
const status = await backendApi.testConnection();
```

## 🎯 Componentes Principales

### Componentes de UI
- `Navbar` - Navegación principal con menú responsive
- `Hero` - Sección hero con animaciones
- `TournamentCard` - Tarjeta de torneo con imagen y detalles
- `TeamCard` - Tarjeta de equipo con roster
- `MatchCard` - Tarjeta de partido con equipos y puntuación
- `NewsCard` - Tarjeta de noticia con imagen
- `LoadingSpinner` - Indicador de carga

### Clases CSS Personalizadas
- `.btn-valorant` - Botón con estilo Valorant
- `.card-valorant` - Tarjeta con bordes angulares
- `.input-valorant` - Input con estilo del juego
- `.text-glow` - Texto con efecto de brillo
- `.badge-live` - Badge para contenido en vivo
- `.divider-glow` - Divisor con efecto de brillo

## 📝 Datos de Demostración

El archivo `src/data/mockData.js` contiene:
- 4 torneos de ejemplo
- 5 equipos con rosters completos
- 4 partidos con resultados
- 5 jugadores con estadísticas
- 3 noticias de ejemplo
- Bracket de torneo de ejemplo

## 🔧 Configuración

### Variables de Entorno
Puedes configurar la URL del backend en `docker-compose.yml`:
```yaml
environment:
  - VITE_API_URL=http://backend:5000
```

### Proxy de Vite
El proxy está configurado en `vite.config.js` para redirigir `/api` al backend:
```javascript
proxy: {
  '/api': {
    target: 'http://backend:5000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

## 🎮 Características de Diseño

- **Formas Geométricas**: Bordes angulares característicos de VALORANT
- **Efectos de Brillo**: Animaciones de glow en elementos interactivos
- **Tipografía**: Fuentes bold y condensadas similares al juego
- **Animaciones**: Transiciones suaves y micro-animaciones
- **Gradientes**: Fondos con gradientes oscuros
- **Patrones**: Overlays con patrones geométricos

## 📱 Responsive Design

El diseño es completamente responsive con breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🚧 Futuras Mejoras

- [ ] Autenticación de usuarios
- [ ] Sistema de inscripción a torneos
- [ ] Chat en vivo para partidos
- [ ] Notificaciones push
- [ ] Modo oscuro/claro
- [ ] Internacionalización (i18n)
- [ ] PWA (Progressive Web App)

## 📄 Licencia

Este proyecto es parte del TFG de Álvaro Morcillo Pérez.
