# Diseño visual (estilo VALORANT)

Guía práctica del estilo UI del proyecto y **paletas/tokens** para mantener consistencia.

## Principios de estilo

- **Identidad**: “táctico / competitivo” con alto contraste.
- **Base**: fondos oscuros, superficies ligeramente más claras, **acento rojo** para acciones y foco.
- **Forma**: recortes geométricos (esquinas “cortadas”) con `clip-path`.
- **Movimiento**: hover con glow suave, escalado sutil en cards, fondos con gradiente animado.

## Tipografía

Definida en `frontend/tailwind.config.js`.

- **Display / titulares (`font-tungsten`)**: `['Druk Wide', 'Impact', 'Arial Black', 'sans-serif']`
  - Uso: `h1..h6`, títulos grandes, uppercase, tracking amplio.
- **Texto/UI (`font-din`)**: `['DIN Next', 'Arial', 'sans-serif']`
  - Uso: párrafos, labels, navegación, formularios.

## Paleta de colores (tokens)

Definida en `frontend/tailwind.config.js`.

### Core

- **Rojo primario (acción/foco)**: `#FF4655` (`valorant-red`)
- **Rojo acento (hover/variación)**: `#FD4556` (`valorant-accent`)
- **Fondo base**: `#0F1923` (`valorant-dark`)
- **Superficie 1 (cards/nav)**: `#1C252E` (`valorant-dark-secondary`)
- **Superficie 2 (inputs/hover)**: `#293641` (`valorant-dark-tertiary`)
- **Texto principal / “blanco cálido”**: `#ECE8E1` (`valorant-light`)
- **Gold (estado upcoming)**: `#F4AA3A` (`valorant-gold`)

### Mapa de uso recomendado

- **Background app**: `valorant-dark`
- **Surface (cards/modales/navbar)**: `valorant-dark-secondary`
- **Surface hover / inputs**: `valorant-dark-tertiary`
- **Primary CTA / selection**: `valorant-red`
- **Primary hover**: `valorant-accent` (o invertir a blanco/rojo según componente)
- **Text primary**: `white` en titulares + `valorant-light` en body
- **Borders**: `valorant-dark-tertiary` (normal) → `valorant-red` (hover/focus)
- **Estado live**: `valorant-red` + pulso
- **Estado upcoming**: `valorant-gold` + texto oscuro
- **Estado completed**: `valorant-dark-tertiary`

## Componentes base (UI kit)

Implementados en `frontend/src/index.css` como clases reutilizables.

### Botón principal: `.btn-valorant`

- **Estilo**: rojo sólido, uppercase, tracking amplio, recorte geométrico.
- **Hover**: overlay blanco al 10% + sombra glow roja.
- **Variante outline** (usada en Hero/CTA): combinar con `bg-transparent border-2 border-valorant-red hover:bg-valorant-red`.

### Card: `.card-valorant`

- **Estilo**: `valorant-dark-secondary` con borde `valorant-dark-tertiary`, recorte geométrico.
- **Hover**: borde `valorant-red` + glow suave.

### Input: `.input-valorant`

- **Estilo**: `valorant-dark-tertiary`, borde doble, texto claro, recorte.
- **Focus**: borde `valorant-red` + glow.

### Badges de estado

- `.badge-live`: rojo + animación de pulso.
- `.badge-upcoming`: gold + texto oscuro.
- `.badge-completed`: superficie 2 + texto claro.

### Separadores/ornamentos

- **Divider**: `.divider-glow` (gradiente horizontal con glow).
- **Texto con glow**: `.text-glow` (sombra roja).

## Layout y jerarquía visual

- **Contenedor**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Secciones**: padding vertical generoso (`py-16`, `py-20`).
- **Títulos**:
  - XXL con `font-tungsten`, `tracking-wider`, `text-white`.
  - Subrayado/banda: barra roja (`h-1 w-24/32 bg-valorant-red`).
- **Grid**: cards en `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` + `gap-6`.

## Fondos y overlays

### Fondo animado: `.bg-animated`

- Gradiente: `linear-gradient(135deg, #0F1923 0%, #1C252E 50%, #0F1923 100%)`
- Animación: desplazamiento suave (`gradientShift`).

### Patrón geométrico: `.pattern-overlay`

- Overlay de diagonales rojas muy sutil (`rgba(255, 70, 85, 0.03)`) en cuadrícula.
- Recomendado para: hero/CTA y secciones “marketing”.

### Gradientes de imagen

En cards de noticias: `bg-gradient-to-t from-valorant-dark via-transparent to-transparent` para legibilidad.

## Forma: recortes (clip-path)

Utilidades (Tailwind) definidas en `frontend/src/index.css`:

- `.clip-corner-sm`: corte de 8px
- `.clip-corner`: corte de 12px
- `.clip-corner-lg`: corte de 20px

Regla práctica:

- **Botones / tabs**: `clip-corner-sm`
- **Cards / contenedores**: `clip-corner`
- **Decoración hero / shapes**: `clip-corner-lg`

## Animación (micro-interacciones)

Definidas en `frontend/tailwind.config.js`:

- **Glow**: `animate-glow` (box-shadow rojo alternante).
- **Entrada**: `animate-slide-in`, `animate-fade-in`.
- **Ambiente**: `animate-pulse-slow` (decoraciones hero).

## Accesibilidad mínima (recomendaciones)

- **Contraste**: usa `text-white`/`text-valorant-light` sobre fondos oscuros.
- **Estados de foco**: mantener borde/halo `valorant-red` en inputs y elementos interactivos.
- **Hover ≠ único indicador**: para tabs/activos, añadir fondo rojo o subrayado (ya se hace en navbar).

## Snippet: tokens CSS (opcional)

Si quieres exponer los colores como variables además de Tailwind:

```css
:root {
  --valorant-red: #FF4655;
  --valorant-accent: #FD4556;
  --valorant-dark: #0F1923;
  --valorant-dark-secondary: #1C252E;
  --valorant-dark-tertiary: #293641;
  --valorant-light: #ECE8E1;
  --valorant-gold: #F4AA3A;
}
```

