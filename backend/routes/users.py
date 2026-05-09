from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models import User, TeamMember
from utils import token_required
from uploads_helper import process_and_save, delete_upload, is_uploaded_path

users_bp = Blueprint('users', __name__)


PLAYABLE_USER_ROLES = ('player', 'player_coach')

@users_bp.route('/me', methods=['GET'])
@token_required
def get_my_profile(current_user):
    return jsonify({
        "id": current_user.id,
        "nickname": current_user.nickname,
        "custom_name": current_user.custom_name,
        "bio": current_user.bio,
        "avatar": current_user.avatar,
        "role": current_user.role,
        "stats": {
            "kills": current_user.stats.kills if current_user.stats else 0,
            "deaths": current_user.stats.deaths if current_user.stats else 0,
            "assists": current_user.stats.assists if current_user.stats else 0,
            "adr": float(current_user.stats.adr) if current_user.stats else 0.0,
            "hs_percentage": float(current_user.stats.hs_percentage) if current_user.stats else 0.0,
            "clutches": current_user.stats.clutches if current_user.stats else 0,
            "matches_played": current_user.stats.matches_played if current_user.stats else 0
        }
    }), 200

# Métricas que se pueden usar para ordenar el ranking de jugadores.
# kd se calcula sobre la marcha desde kills/deaths.
PLAYER_SORT_KEYS = ('kd', 'adr', 'hs', 'clutches', 'kills', 'assists', 'matches')

# Mínimo de partidas jugadas para entrar al ranking. Sin esto un jugador con
# 1 partida y 0 muertes te queda primero por K/D y rompe el ranking.
DEFAULT_MIN_MATCHES = 3


def _kd(kills, deaths):
    if not deaths:
        return float(kills or 0)
    return (kills or 0) / deaths


def _player_sort_value(stats, key):
    if key == 'kd':
        return _kd(stats['kills'], stats['deaths'])
    if key == 'adr':
        return stats['adr']
    if key == 'hs':
        return stats['hs_percentage']
    if key == 'clutches':
        return stats['clutches']
    if key == 'kills':
        return stats['kills']
    if key == 'assists':
        return stats['assists']
    if key == 'matches':
        return stats['matches_played']
    return 0


@users_bp.route('/players', methods=['GET'])
def list_players():
    """Listado público de players con stats agregadas y team actual.
    Incluye users con role 'player' o 'player_coach'.

    Query params:
    - sort_by: kd|adr|hs|clutches|kills|assists|matches (default: kd)
    - min_matches: int (default: 3) — filtra jugadores con menos partidas
      que el mínimo. Para que el ranking refleje rendimiento sostenido."""
    sort_by = request.args.get('sort_by', 'kd')
    if sort_by not in PLAYER_SORT_KEYS:
        return jsonify({
            "error": f"sort_by inválido. Permitidos: {', '.join(PLAYER_SORT_KEYS)}"
        }), 400

    try:
        min_matches = int(request.args.get('min_matches', DEFAULT_MIN_MATCHES))
    except (TypeError, ValueError):
        return jsonify({"error": "min_matches debe ser entero"}), 400
    if min_matches < 0:
        return jsonify({"error": "min_matches no puede ser negativo"}), 400

    users = User.query.filter(User.role.in_(PLAYABLE_USER_ROLES)).all()
    result = []
    for u in users:
        membership = TeamMember.query.filter_by(user_id=u.id).first()
        team_info = None
        if membership and membership.team:
            team_info = {
                "team_id": membership.team.id,
                "team_name": membership.team.name,
                "team_tag": membership.team.tag,
                "team_logo": membership.team.logo,
                "ingame_role": membership.ingame_role,
                "favorite_agent": membership.favorite_agent,
            }

        s = u.stats
        stats = {
            "kills": s.kills if s else 0,
            "deaths": s.deaths if s else 0,
            "assists": s.assists if s else 0,
            "clutches": s.clutches if s else 0,
            "adr": float(s.adr or 0) if s else 0.0,
            "hs_percentage": float(s.hs_percentage or 0) if s else 0.0,
            "matches_played": s.matches_played if s else 0,
            "kd": round(_kd(s.kills if s else 0, s.deaths if s else 0), 2),
        }

        if stats['matches_played'] < min_matches:
            continue

        result.append({
            "id": u.id,
            "nickname": u.nickname,
            "role": u.role,
            "avatar": u.avatar,
            "team": team_info,
            "stats": stats,
        })

    # Orden principal por la métrica pedida; desempate por matches_played
    # (más experiencia rompe empates) y luego kills.
    result.sort(key=lambda p: (
        -_player_sort_value(p["stats"], sort_by),
        -p["stats"]["matches_played"],
        -p["stats"]["kills"],
    ))
    return jsonify(result), 200


@users_bp.route('/me', methods=['PUT'])
@token_required
def update_my_profile(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos"}), 400

    try:
        if 'custom_name' in data:
            current_user.custom_name = data['custom_name']
        if 'bio' in data:
            current_user.bio = data['bio']
        # avatar NO se actualiza por aquí: ahora se sube vía
        # POST /users/me/avatar para evitar URLs externas arbitrarias.

        db.session.commit()
        return jsonify({"mensaje": "Perfil actualizado con éxito"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@users_bp.route('/me/avatar', methods=['POST'])
@token_required
def upload_my_avatar(current_user):
    """Sube y guarda un avatar. Reemplaza el anterior si era nuestro path."""
    if 'file' not in request.files:
        return jsonify({"error": "Falta el archivo (campo 'file')"}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "No se seleccionó archivo"}), 400

    try:
        new_path = process_and_save(file, 'avatars')
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    old_path = current_user.avatar
    try:
        current_user.avatar = new_path
        db.session.commit()
    except Exception:
        db.session.rollback()
        # No dejamos huérfano el archivo recién subido si el commit falla.
        delete_upload(new_path)
        current_app.logger.exception("Error guardando avatar para user %s", current_user.id)
        return jsonify({"error": "No se pudo guardar el avatar"}), 500

    # Borrar el viejo SOLO después del commit exitoso.
    if old_path and is_uploaded_path(old_path) and old_path != new_path:
        delete_upload(old_path)

    return jsonify({"avatar": new_path}), 200


@users_bp.route('/me/avatar', methods=['DELETE'])
@token_required
def delete_my_avatar(current_user):
    """Elimina el avatar del usuario. Idempotente."""
    old_path = current_user.avatar
    try:
        current_user.avatar = None
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error borrando avatar para user %s", current_user.id)
        return jsonify({"error": "No se pudo borrar el avatar"}), 500

    if old_path and is_uploaded_path(old_path):
        delete_upload(old_path)
    return jsonify({"avatar": None}), 200
