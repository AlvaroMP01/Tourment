from functools import wraps
from flask import request, current_app, jsonify
import jwt
from extensions import db
from models import User

# Roles que un usuario puede elegir al registrarse.
# admin y tournament_manager NO están — solo se asignan manualmente por un admin.
SELF_REGISTRABLE_ROLES = {'player', 'coach', 'player_coach'}


def _get_secret():
    secret = current_app.config.get('SECRET_KEY')
    if not secret:
        raise RuntimeError("SECRET_KEY no configurada en la app")
    return secret


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({"error": "Token ausente o mal formado. Formato esperado: Bearer <token>"}), 401

        token = parts[1]

        try:
            data = jwt.decode(token, _get_secret(), algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

        user_id = data.get('user_id')
        if user_id is None:
            return jsonify({"error": "Token inválido"}), 401

        current_user = User.query.get(user_id)
        if not current_user:
            return jsonify({"error": "Usuario no encontrado"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def role_required(*allowed_roles):
    """Restringe un endpoint a usuarios con uno de los roles indicados.
    Debe usarse DESPUÉS de @token_required."""
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role not in allowed_roles:
                return jsonify({"error": "Permisos insuficientes"}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator


def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({"error": "Permisos de administrador requeridos"}), 403
        return f(current_user, *args, **kwargs)
    return decorated
