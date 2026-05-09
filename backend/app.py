import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import text
from extensions import db
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
CORS(app)

# Margen pre-procesamiento: el archivo ENTRA con hasta 1MB; el helper lo
# recomprime hasta <=500KB antes de guardar. Pillow se encarga del resize.
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

# Las carpetas de uploads se crean al arrancar — no asumimos que el volumen
# montado las traiga. ensure_upload_dirs es idempotente.
ensure_upload_dirs()

# Clave para firmar/verificar JWT. DEBE venir de variable de entorno.
# Sin SECRET_KEY válida, la app NO arranca: un fallback hardcodeado permitiría
# a cualquiera firmar tokens válidos.
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError(
        "SECRET_KEY no definida o demasiado corta (mínimo 32 chars). "
        "Generá una con: python -c 'import secrets; print(secrets.token_urlsafe(64))'"
    )
app.config['SECRET_KEY'] = SECRET_KEY

# CONFIGURACIÓN DE LA BASE DE DATOS
user = os.getenv('MYSQL_USER', 'torneos_user')
password = os.getenv('MYSQL_PASSWORD', 'torneos_pass')
host = os.getenv('MYSQL_HOST', 'db') 
database = os.getenv('MYSQL_DATABASE', 'torneos_db')
port = os.getenv('MYSQL_PORT', '3306')

# Conexión para SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar la extensión con la app
db.init_app(app)

# Registrar Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(teams_bp, url_prefix='/api/teams')
app.register_blueprint(tournaments_bp, url_prefix='/api/tournaments')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(stats_bp, url_prefix='/api/stats')

scraper = NewsScraper()

@app.route('/')
def home():
    return jsonify({"mensaje": "El servidor Backend está funcionando correctamente."})

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    """Sirve los archivos subidos. Público sin auth — los avatares, logos
    y banners se muestran en páginas públicas."""
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
        # Consulta simple "SELECT 1" para testear
        db.session.execute(text("SELECT 1"))
        return jsonify({"estado": "Éxito", "mensaje": "Conexión a MySQL exitosa"})
    except Exception as e:
        return jsonify({"estado": "Error", "mensaje": f"No se pudo conectar a la BD: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
