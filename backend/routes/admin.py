"""Endpoints de administración global. Todos requieren role='admin'."""
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models import User
from utils import admin_required

admin_bp = Blueprint('admin', __name__)

# Roles válidos para asignar manualmente desde el panel admin.
# Incluye los privilegiados (admin, tournament_manager) que NO se permiten en
# el self-register público.
ASSIGNABLE_ROLES = ('admin', 'tournament_manager', 'player', 'coach', 'player_coach')


def _admin_count():
    return User.query.filter_by(role='admin').count()


def _serialize_user(u):
    return {
        "id": u.id,
        "nickname": u.nickname,
        "custom_name": u.custom_name,
        "role": u.role,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users(current_user):
    users = User.query.order_by(User.id.asc()).all()
    return jsonify([_serialize_user(u) for u in users]), 200


@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(current_user, user_id):
    target = User.query.get_or_404(user_id)

    data = request.get_json() or {}
    new_role = data.get('role')
    if new_role not in ASSIGNABLE_ROLES:
        return jsonify({"error": f"role inválido. Válidos: {', '.join(ASSIGNABLE_ROLES)}"}), 400

    if target.role == new_role:
        return jsonify({"mensaje": "Sin cambios", "user": _serialize_user(target)}), 200

    # Nunca dejar el sistema sin admins. Si estamos degradando al último admin → bloquear.
    if target.role == 'admin' and new_role != 'admin' and _admin_count() <= 1:
        return jsonify({"error": "No se puede degradar al último admin del sistema"}), 409

    # Auto-degradación: prevenir que un admin se quite a sí mismo el rol por error.
    # Si lo querés hacer, debe ser otro admin quien lo haga.
    if target.id == current_user.id and new_role != 'admin':
        return jsonify({"error": "No podés cambiar tu propio rol. Pedile a otro admin."}), 403

    try:
        target.role = new_role
        db.session.commit()
        return jsonify({"mensaje": "Rol actualizado", "user": _serialize_user(target)}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error update_user_role user=%s", user_id)
        return jsonify({"error": "No se pudo actualizar el rol"}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(current_user, user_id):
    target = User.query.get_or_404(user_id)

    if target.id == current_user.id:
        return jsonify({"error": "No podés borrar tu propia cuenta desde acá"}), 403

    if target.role == 'admin' and _admin_count() <= 1:
        return jsonify({"error": "No se puede borrar al último admin del sistema"}), 409

    try:
        db.session.delete(target)
        db.session.commit()
        return jsonify({"mensaje": "Usuario borrado"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error delete_user user=%s", user_id)
        return jsonify({"error": "No se pudo borrar el usuario"}), 500
