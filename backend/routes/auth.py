from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models import User, UserStat
from werkzeug.security import generate_password_hash, check_password_hash
from utils import SELF_REGISTRABLE_ROLES
import jwt
import datetime

auth_bp = Blueprint('auth', __name__)

MIN_PASSWORD_LENGTH = 8
TOKEN_TTL = datetime.timedelta(hours=12)


def _jwt_secret():
    secret = current_app.config.get('SECRET_KEY')
    if not secret:
        raise RuntimeError("SECRET_KEY no configurada")
    return secret


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    nickname = (data.get('nickname') or '').strip()
    password = data.get('password') or ''

    if not nickname or not password:
        return jsonify({"error": "Nickname y contraseña son obligatorios"}), 400

    if len(password) < MIN_PASSWORD_LENGTH:
        return jsonify({"error": f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres"}), 400

    if User.query.filter_by(nickname=nickname).first():
        return jsonify({"error": "El nickname ya está en uso"}), 400

    # Whitelist de roles auto-asignables. Si el cliente intenta colar 'admin'
    # o 'tournament_manager', se ignora y queda 'player'.
    requested_role = data.get('role') or data.get('starting_role') or 'player'
    role = requested_role if requested_role in SELF_REGISTRABLE_ROLES else 'player'

    try:
        new_user = User(
            nickname=nickname,
            password_hash=generate_password_hash(password),
            custom_name=data.get('custom_name'),
            role=role
        )
        db.session.add(new_user)
        db.session.flush()

        new_stats = UserStat(user_id=new_user.id)
        db.session.add(new_stats)

        db.session.commit()

        return jsonify({"mensaje": "Usuario registrado con éxito", "user_id": new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception("Error en /register")
        return jsonify({"error": "No se pudo crear el usuario"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    nickname = (data.get('nickname') or '').strip()
    password = data.get('password') or ''

    if not nickname or not password:
        return jsonify({"error": "Nickname y contraseña son obligatorios"}), 400

    user = User.query.filter_by(nickname=nickname).first()

    # Mismo mensaje y mismo coste aproximado en ambos paths para no filtrar
    # si un nickname existe o no (timing/enumeración).
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Credenciales incorrectas"}), 401

    now = datetime.datetime.utcnow()
    token = jwt.encode({
        'user_id': user.id,
        'iat': now,
        'exp': now + TOKEN_TTL
    }, _jwt_secret(), algorithm='HS256')

    return jsonify({
        "mensaje": "Login exitoso",
        "token": token,
        "user": {
            "id": user.id,
            "nickname": user.nickname,
            "role": user.role
        }
    }), 200

