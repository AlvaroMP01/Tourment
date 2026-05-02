from flask import Blueprint, request, jsonify
from extensions import db
from models import User, TeamMember
from utils import token_required

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

@users_bp.route('/players', methods=['GET'])
def list_players():
    """Listado público de players con stats agregadas y team actual.
    Incluye users con role 'player' o 'player_coach'. Ordenado por
    matches_played DESC, luego kills DESC (los más activos arriba)."""
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
        }

        result.append({
            "id": u.id,
            "nickname": u.nickname,
            "role": u.role,
            "avatar": u.avatar,
            "team": team_info,
            "stats": stats,
        })

    result.sort(key=lambda p: (-p["stats"]["matches_played"], -p["stats"]["kills"]))
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
        if 'avatar' in data:
            current_user.avatar = data['avatar']
        
        db.session.commit()
        return jsonify({"mensaje": "Perfil actualizado con éxito"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
