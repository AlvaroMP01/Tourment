# 🚀 Guía de Inicio Rápido - Valorant Tournament Platform

## Prerequisitos

- Docker Desktop instalado y en ejecución
- Git (para clonar el repositorio)

## Pasos para Ejecutar

### 1. Navegar al Directorio del Proyecto

```bash
cd /home/psykopato/Documentos/gestion-torneos-videojuegos
```

### 2. Levantar los Servicios con Docker Compose

```bash
# Construir y levantar todos los servicios (Base de datos, Backend, Frontend)
docker-compose up --build
```

### 3. Acceder a la Aplicación

Una vez que los contenedores estén en ejecución:

- **Frontend (Aplicación Web)**: http://localhost:5173
- **Backend (API)**: http://localhost:5000
- **Base de Datos MySQL**: localhost:3306

## Comandos Útiles

### Levantar solo el Frontend
```bash
docker-compose up frontend
```

### Levantar solo el Backend
```bash
docker-compose up backend
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Detener todos los servicios
```bash
docker-compose down
```

### Reconstruir un servicio específico
```bash
docker-compose build frontend
docker-compose build backend
```

## Desarrollo Local (Sin Docker)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acceso: http://localhost:5173

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Acceso: http://localhost:5000

## Verificar que Todo Funciona

1. **Frontend**: Abre http://localhost:5173 - Deberías ver la página de inicio con el diseño Valorant
2. **Backend**: Abre http://localhost:5000 - Deberías ver un mensaje JSON de confirmación
3. **Base de Datos**: El backend debería conectarse automáticamente

## Estructura de Navegación

- **/** - Página de inicio con torneos destacados
- **/tournaments** - Lista de todos los torneos
- **/tournaments/1** - Detalle de un torneo específico
- **/teams** - Directorio de equipos
- **/players** - Tabla de clasificación de jugadores
- **/news** - Noticias de VALORANT (VLR.gg API)
- **/admin** - Panel de administración

## Datos de Demostración

La aplicación incluye datos de ejemplo para:
- 4 Torneos (En vivo, Próximos, Finalizados)
- 5 Equipos con rosters completos
- 4 Partidos con resultados
- 5 Jugadores con estadísticas
- 3 Noticias de ejemplo

## Características Destacadas

✨ **Diseño Valorant** - Colores, formas y animaciones inspiradas en el juego
🎮 **Responsive** - Funciona en móvil, tablet y desktop
🔌 **VLR.gg API** - Noticias reales del mundo competitivo
📊 **Estadísticas** - Rankings, K/D, ADR, y más
🏆 **Brackets** - Visualización de torneos

## Solución de Problemas

### El frontend no carga
- Verifica que el puerto 5173 no esté en uso
- Revisa los logs: `docker-compose logs frontend`

### El backend no conecta a la base de datos
- Asegúrate de que el servicio `db` esté corriendo
- Verifica las variables de entorno en `.env`

### Error de permisos en Docker
- Ejecuta Docker Desktop como administrador
- Verifica que Docker tenga permisos en el directorio del proyecto

## Próximos Pasos

1. Explora todas las páginas de la aplicación
2. Revisa el código en `/frontend/src`
3. Personaliza los colores en `tailwind.config.js`
4. Añade más datos de ejemplo en `mockData.js`
5. Conecta con el backend real cuando esté listo

## Documentación Adicional

- [Frontend README](frontend/README.md) - Documentación detallada del frontend
- [Walkthrough](/.gemini/antigravity/brain/5fd3780a-b8c3-4885-8649-cc80d92b7f71/walkthrough.md) - Guía completa de características

## Soporte

Para más información sobre el proyecto, consulta el [README principal](README.md).
