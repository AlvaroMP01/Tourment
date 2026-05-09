import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import text
from werkzeug.middleware.proxy_fix import ProxyFix
from extensions import db, limiter
from models import User, Team, Tournament, Match, TeamMember, UserStat, JoinRequest, UserAchievement, TournamentRegistration
from news_scraper import NewsScraper
from routes.auth import auth_bp
from routes.teams import teams_bp
from routes.tournaments import tournaments_bp
from routes.users import users_bp
from routes.admin import admin_bp
from routes.stats import stats_bp
from uploads_helper import UPLOAD_ROOT, ensure_upload_dirs

app = Flask(__name__)

# Sin ProxyFix, request.remote_addr apunta al proxy de Railway y el rate-limit
# por IP compartiría bucket entre todos los usuarios.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

# CORS restrictivo: CORS(app) sin origins permite cualquier origen y abriría
# la API a XSS de terceros con credentials.
_allowed_origins_env = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173')
_allowed_origins = [o.strip() for o in _allowed_origins_env.split(',') if o.strip()]
CORS(app, origins=_allowed_origins, supports_credentials=True)

limiter.init_app(app)

# El archivo entra con hasta 1MB; el helper lo recomprime a <=500KB.
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

ensure_upload_dirs()

# Sin SECRET_KEY válida la app NO arranca: un fallback hardcodeado permitiría
# a cualquiera firmar tokens JWT válidos.
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError(
        "SECRET_KEY no definida o demasiado corta (mínimo 32 chars). "
        "Genera una con: python -c 'import secrets; print(secrets.token_urlsafe(64))'"
    )
app.config['SECRET_KEY'] = SECRET_KEY

user = os.getenv('MYSQL_USER', 'torneos_user')
password = os.getenv('MYSQL_PASSWORD', 'torneos_pass')
host = os.getenv('MYSQL_HOST', 'db')
database = os.getenv('MYSQL_DATABASE', 'torneos_db')
port = os.getenv('MYSQL_PORT', '3306')

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(teams_bp, url_prefix='/api/teams')
app.register_blueprint(tournaments_bp, url_prefix='/api/tournaments')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(stats_bp, url_prefix='/api/stats')

scraper = NewsScraper()

@app.route('/')
def home():
    return jsonify({
        "mensaje": "Tourment Backend está funcionando.",
        "api_index": "/api",
    })


@app.route('/health')
def health():
    """Liveness probe. No comprueba DB a propósito: si la DB cae, queremos
    que el backend siga vivo en vez de que Railway lo reinicie en loop."""
    return jsonify({"status": "ok"}), 200


API_INDEX = {
    "name": "Tourment API",
    "version": "1.0.0",
    "description": "API REST de la plataforma de torneos de VALORANT.",
    "auth": (
        "Endpoints marcados con 'auth' requieren header 'Authorization: Bearer <token>'. "
        "El token se obtiene de POST /api/auth/login."
    ),
    "groups": {
        "system": [
            {"method": "GET", "path": "/health", "auth": False, "description": "Liveness probe (Railway). Devuelve {status: ok}"},
            {"method": "GET", "path": "/api",    "auth": False, "description": "Este índice de endpoints"},
        ],
        "auth": [
            {"method": "POST", "path": "/api/auth/register", "auth": False, "description": "Crear cuenta (rol: player|coach|player_coach)"},
            {"method": "POST", "path": "/api/auth/login",    "auth": False, "description": "Login. Devuelve token JWT. Rate-limit: 5/min, 20/hour por IP"},
        ],
        "users": [
            {"method": "GET",    "path": "/api/users/me",            "auth": True,  "description": "Datos del usuario autenticado"},
            {"method": "PUT",    "path": "/api/users/me",            "auth": True,  "description": "Editar perfil propio"},
            {"method": "POST",   "path": "/api/users/me/avatar",     "auth": True,  "description": "Subir avatar (multipart, campo 'file')"},
            {"method": "DELETE", "path": "/api/users/me/avatar",     "auth": True,  "description": "Borrar avatar propio"},
            {"method": "GET",    "path": "/api/users/players",       "auth": False, "description": "Ranking público de jugadores. Query: sort_by, min_matches"},
        ],
        "teams": [
            {"method": "GET",    "path": "/api/teams",                   "auth": False, "description": "Lista pública de equipos. Query: sort_by"},
            {"method": "GET",    "path": "/api/teams/<id>",              "auth": True,  "description": "Detalle de un equipo"},
            {"method": "GET",    "path": "/api/teams/my",                "auth": True,  "description": "Equipos a los que pertenece el usuario"},
            {"method": "POST",   "path": "/api/teams",                   "auth": True,  "description": "Crear equipo (coach o player_coach)"},
            {"method": "PUT",    "path": "/api/teams/<id>",              "auth": True,  "description": "Editar equipo (founder o admin)"},
            {"method": "DELETE", "path": "/api/teams/<id>",              "auth": True,  "description": "Disolver equipo"},
            {"method": "POST",   "path": "/api/teams/<id>/logo",         "auth": True,  "description": "Subir logo (multipart)"},
            {"method": "DELETE", "path": "/api/teams/<id>/logo",         "auth": True,  "description": "Borrar logo"},
            {"method": "POST",   "path": "/api/teams/<id>/join",         "auth": True,  "description": "Solicitar unirse a un equipo"},
            {"method": "GET",    "path": "/api/teams/<id>/join-requests","auth": True,  "description": "Solicitudes pendientes (founder/admin)"},
            {"method": "POST",   "path": "/api/teams/<id>/join-requests/<reqId>/accept", "auth": True, "description": "Aceptar solicitud"},
            {"method": "POST",   "path": "/api/teams/<id>/join-requests/<reqId>/reject", "auth": True, "description": "Rechazar solicitud"},
            {"method": "DELETE", "path": "/api/teams/<id>/members/<userId>",             "auth": True, "description": "Expulsar miembro"},
        ],
        "tournaments": [
            {"method": "GET",    "path": "/api/tournaments",          "auth": False, "description": "Lista pública (incluye accepted_teams_count)"},
            {"method": "GET",    "path": "/api/tournaments/<id>",     "auth": False, "description": "Detalle de un torneo (incluye matches y bracket_size)"},
            {"method": "POST",   "path": "/api/tournaments",          "auth": "manager", "description": "Crear torneo"},
            {"method": "PUT",    "path": "/api/tournaments/<id>",     "auth": "manager", "description": "Editar torneo"},
            {"method": "DELETE", "path": "/api/tournaments/<id>",     "auth": "manager", "description": "Borrar torneo"},
            {"method": "POST",   "path": "/api/tournaments/<id>/image",  "auth": "manager", "description": "Subir imagen del torneo"},
            {"method": "DELETE", "path": "/api/tournaments/<id>/image",  "auth": "manager", "description": "Borrar imagen"},
            {"method": "POST",   "path": "/api/tournaments/<id>/register", "auth": True, "description": "Founder solicita inscribir su equipo"},
            {"method": "GET",    "path": "/api/tournaments/<id>/registrations", "auth": False, "description": "Inscripciones (público ve solo accepted)"},
            {"method": "POST",   "path": "/api/tournaments/<id>/registrations/<regId>/accept", "auth": "manager", "description": "Aceptar inscripción"},
            {"method": "POST",   "path": "/api/tournaments/<id>/registrations/<regId>/reject", "auth": "manager", "description": "Rechazar inscripción"},
            {"method": "DELETE", "path": "/api/tournaments/<id>/registrations/<regId>",        "auth": True,      "description": "Retirar inscripción (founder pending o manager)"},
        ],
        "matches": [
            {"method": "GET",    "path": "/api/tournaments/<id>/matches",                "auth": False, "description": "Lista de partidas del torneo"},
            {"method": "POST",   "path": "/api/tournaments/<id>/matches",                "auth": "manager", "description": "Programar partida (bloqueado si torneo tiene bracket)"},
            {"method": "PUT",    "path": "/api/tournaments/<id>/matches/<matchId>",      "auth": "manager", "description": "Editar metadatos (bloqueado en bracket)"},
            {"method": "DELETE", "path": "/api/tournaments/<id>/matches/<matchId>",      "auth": "manager", "description": "Borrar partida (bloqueado en bracket)"},
            {"method": "POST",   "path": "/api/tournaments/<id>/matches/<matchId>/results", "auth": "manager", "description": "Reportar resultado + stats por jugador"},
            {"method": "GET",    "path": "/api/tournaments/<id>/matches/<matchId>/stats",   "auth": False, "description": "Stats públicas de una partida"},
        ],
        "bracket": [
            {"method": "POST",   "path": "/api/tournaments/<id>/bracket", "auth": "manager", "description": "Generar bracket single-elim. Requiere 4|8|16 equipos accepted"},
            {"method": "DELETE", "path": "/api/tournaments/<id>/bracket", "auth": "manager", "description": "Borrar bracket (bloqueado si algún match está finished)"},
        ],
        "stats": [
            {"method": "GET", "path": "/api/stats/overview", "auth": False, "description": "Stats globales para Hero/landing"},
        ],
        "news": [
            {"method": "GET", "path": "/api/news", "auth": False, "description": "Noticias del feed RSS de VLR.gg. Query: limit (default 20, max 50)"},
        ],
        "admin": [
            {"method": "GET",    "path": "/api/admin/users",            "auth": "admin", "description": "Lista de usuarios"},
            {"method": "PUT",    "path": "/api/admin/users/<id>/role",  "auth": "admin", "description": "Cambiar rol de un usuario"},
            {"method": "DELETE", "path": "/api/admin/users/<id>",       "auth": "admin", "description": "Borrar usuario"},
        ],
    },
    "examples": [
        "GET /api/news?limit=5  →  últimas 5 noticias (público, sin auth)",
        "GET /api/tournaments  →  lista de torneos (público)",
        "GET /api/stats/overview  →  contadores globales (público)",
    ],
}


@app.route('/api')
def api_index():
    return jsonify(API_INDEX)


@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_ROOT, filename)

@app.errorhandler(413)
def handle_too_large(e):
    return jsonify({
        "error": "El archivo supera el tamaño máximo permitido (1MB)."
    }), 413

NEWS_DEFAULT_LIMIT = 20
NEWS_MAX_LIMIT = 50

@app.route('/api/news')
def get_news():
    try:
        limit = int(request.args.get('limit', NEWS_DEFAULT_LIMIT))
    except (TypeError, ValueError):
        limit = NEWS_DEFAULT_LIMIT
    limit = max(1, min(limit, NEWS_MAX_LIMIT))
    news = scraper.get_latest_news(limit=limit)
    return jsonify(news)

@app.route('/test-db')
def test_db():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({"estado": "Éxito", "mensaje": "Conexión a MySQL exitosa"})
    except Exception as e:
        return jsonify({"estado": "Error", "mensaje": f"No se pudo conectar a la BD: {str(e)}"}), 500

if __name__ == '__main__':
    # Solo dev local — en prod arranca Gunicorn desde el Dockerfile.
    # debug=True filtra stacktraces y paths: NUNCA en producción.
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ('1', 'true', 'yes')
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
