# 🚀 Guía de Inicio Rápido - Valorant Tournament Platform

## 📋 Prerequisitos

- **Docker & Docker Compose** (Para el modo rápido con todo incluido)
- **Node.js & npm** (Para desarrollo rápido en el Frontend)
- **Python 3.x & venv** (Para desarrollo rápido en el Backend)
- **MySQL** (Si desarrollas de forma local sin Docker para el backend)

---

## 🛠️ Métodos de Ejecución

Tienes dos formas de trabajar: el método "Todo en Uno" (ideal para probar la aplicación completa) y el método "Modo Desarrollador" (ideal para cuando estás programando y quieres ver los cambios al instante).

### 🐳 Método 1: Todo en Uno (Recomendado para Probar)
Usa Docker para levantar la base de datos, el backend y el frontend con un solo comando.

```bash
# Construir y levantar todos los servicios
docker-compose up --build
```

**Acceso:**
- **Frontend (App Web):** [http://localhost](http://localhost) (vía Nginx)
- **Backend (API):** [http://localhost:5000](http://localhost:5000)
- **Base de Datos (MySQL):** `localhost:3306`
- **Gestión de DB (phpMyAdmin):** [http://localhost:8080](http://localhost:8080)

---

### 🔑 Configuración inicial obligatoria

#### 1. Variables de entorno

El `.env` del proyecto **debe** tener estas variables — si faltan, el backend no arranca:

```bash
# Genera con: python -c 'import secrets; print(secrets.token_urlsafe(64))'
SECRET_KEY=<string-largo-aleatorio>

# Credenciales del admin que va a crearse con seed.py
ADMIN_NICKNAME=admin
ADMIN_PASSWORD=<password-de-al-menos-8-chars>
```

`SECRET_KEY` firma los JWT. Si la cambiás, todos los tokens emitidos quedan inválidos (los usuarios tendrán que volver a loguearse).

#### 2. Crear el usuario admin (idempotente)

El esquema NO inserta el admin (Werkzeug usa hashes con sal — no se puede hardcodear en SQL). Una vez levantado el backend, ejecutá:

```bash
docker exec backend python seed.py
```

Comportamiento:
- Si no existe → lo crea con `role='admin'`.
- Si existe y ya es admin → no hace nada.
- Si existe pero NO es admin → avisa y sale con error.
- Para forzar reset de password o promoción: `docker exec -e ADMIN_FORCE_RESET=1 backend python seed.py`

---

### ⚡ Método 2: Modo Desarrollador (Recomendado para Programar)
Usa este método cuando estés modificando código. Permite **Hot Reload** (los cambios se ven al instante sin reiniciar todo).

> [!IMPORTANT]
> **Nota:** Si usas este método, asegúrate de tener el servicio de la base de datos corriendo (ya sea con `docker compose up db` o instalado localmente).

#### 1. Levantar el Backend
Abre una terminal y ejecuta:
```bash
cd backend
source venv/bin/activate  # En Linux/Mac
# En Windows usa: venv\Scripts\activate
python app.py
```
**Acceso:** [http://localhost:5000](http://localhost:5000)

#### 2. Levantar el Frontend
Abre **otra** terminal y ejecuta:
```bash
cd frontend
npm install  # Solo la primera vez
npm run dev
```
**Acceso:** [http://localhost:5173](http://localhost:5173)

---

## 🔍 Comandos Útiles (Docker)

| Acción | Comando |
| :--- | :--- |
| **Levantar todo** | `docker-compose up --build` |
| **Detener todo** | `docker-compose down` |
| **Levantar solo DB** | `docker-compose up db` |
| **Ver logs (Frontend)** | `docker-compose logs -f frontend` |
| **Ver logs (Backend)** | `docker-compose logs -f backend` |
| **Reconstruir un servicio** | `docker-compose build <servicio>` |

---

## 🗺️ Estructura de la Aplicación

- **/** - Página de inicio con torneos destacados
- **/tournaments** - Lista de todos los torneos
- **/teams** - Directorio de equipos
- **/news** - Noticias de VALORANT (VLR.gg API)
- **/login** & **/register** - Acceso y creación de cuenta

## 🛡️ Características de Seguridad Implementadas
- **JWT Authentication**: Tokens para sesiones seguras.
- **Role-Based Access Control (RBAC)**: Permisos diferenciados para Admin, Tournament Manager y Usuarios.
- **Contextual Team Roles**: Roles dinámicos dentro de los equipos (Coach, Player, etc.).

## 🛠️ Solución de Problemas

- **Error de conexión a la DB**: Verifica que el servicio de MySQL esté activo. Si usas Docker, revisa los logs con `docker-compose logs db`.
- **Puerto ocupado**: Si el frontend no carga, verifica que el puerto `5173` no esté siendo usado por otro proceso.
- **Error de permisos en Docker**: Ejecuta Docker Desktop como administrador.

## 🚀 Próximos Pasos

1. Explora todas las páginas de la aplicación
2. Revisa el código en `/frontend/src`
3. Personaliza los colores en `tailwind.config.js`
4. Añade más datos de ejemplo en `mockData.js`
5. Conecta con el backend real cuando esté listo

## 📄 Documentación Adicional

- [Frontend README](frontend/README.md) - Documentación detallada del frontend
- [Walkthrough](/.gemini/antigravity/brain/5fd3780a-b8c3-4885-8649-cc80d92b7f71/walkthrough.md) - Guía completa de características

## 🆘 Soporte

Para más información sobre el proyecto, consulta el [README principal](README.md).
