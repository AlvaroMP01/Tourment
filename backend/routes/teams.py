from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models import Team, TeamMember, JoinRequest, User
from utils import token_required

teams_bp = Blueprint('teams', __name__)

# Plazas máximas por equipo (miembros con occupies_slot=True)
MAX_TEAM_SLOTS = 7

# Campos editables por PUT /teams/<id>
TEAM_EDITABLE_FIELDS = ('name', 'tag', 'logo', 'region')


def _team_founder_user_id(team_id):
    """El 'manager' efectivo de un equipo es el primer miembro (founder).
    El campo team_role no es suficiente: el coach fundador queda como 'manager'
    pero el player_coach fundador queda como 'player_coach'. El criterio robusto
    es ordenar por joined_at, luego id."""
    first = (TeamMember.query
             .filter_by(team_id=team_id)
             .order_by(TeamMember.joined_at.asc(), TeamMember.id.asc())
             .first())
    return first.user_id if first else None


def _can_manage_team(user, team_id):
    """Admin global o founder del equipo."""
    return user.role == 'admin' or _team_founder_user_id(team_id) == user.id


def _count_occupied_slots(team_id):
    return TeamMember.query.filter_by(team_id=team_id, occupies_slot=True).count()

@teams_bp.route('', methods=['GET'])
def get_teams():
    teams = Team.query.all()
    return jsonify([{
        "id": t.id,
        "name": t.name,
        "tag": t.tag,
        "logo": t.logo,
        "region": t.region,
        "member_count": len(t.members)
    } for t in teams]), 200

@teams_bp.route('', methods=['POST'])
@token_required
def create_team(current_user):
    data = request.get_json()
    
    # 1. Validar que el usuario tiene permiso para crear equipos
    if current_user.role not in ['coach', 'player_coach']:
        return jsonify({"error": "Solo los Coaches o Player/Coaches pueden crear equipos"}), 403

    # 2. Validar que no pertenezca ya a otro equipo
    if TeamMember.query.filter_by(user_id=current_user.id).first():
        return jsonify({"error": "Ya perteneces a un equipo. Solo puedes tener un equipo."}), 400

    if not data or not data.get('name') or not data.get('tag'):
        return jsonify({"error": "Nombre y Tag son obligatorios"}), 400
    
    try:
        # 3. Crear el equipo
        new_team = Team(
            name=data['name'],
            tag=data['tag'],
            logo=data.get('logo'),
            region=data.get('region')
        )
        db.session.add(new_team)
        db.session.flush() 

        # 4. Determinar role y si ocupa plaza según su role
        # Si es COACH, es el manager y NO ocupa plaza.
        # Si es PLAYER_COACH, es el manager (o player_coach) y SÍ ocupa plaza.
        if current_user.role == 'coach':
            role = 'manager'
            occupies = False
        else: # player_coach
            role = 'player_coach'
            occupies = True

        leader_member = TeamMember(
            team_id=new_team.id,
            user_id=current_user.id,
            team_role=role,
            occupies_slot=occupies
        )
        db.session.add(leader_member)
        
        db.session.commit()
        return jsonify({"mensaje": "Equipo creado con éxito", "team_id": new_team.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@teams_bp.route('/<int:team_id>', methods=['GET'])
def get_team_detail(team_id):
    team = Team.query.get_or_404(team_id)
    founder_id = _team_founder_user_id(team_id)

    # Ordeno por joined_at ascendente para que el founder quede primero en la UI
    sorted_members = sorted(team.members, key=lambda m: (m.joined_at, m.id))
    members = [{
        "user_id": m.user_id,
        "nickname": m.user.nickname,
        "role": m.team_role,
        "ingame_role": m.ingame_role,
        "favorite_agent": m.favorite_agent,
        "occupies_slot": m.occupies_slot,
        "joined_at": m.joined_at.isoformat() if m.joined_at else None,
        "is_founder": m.user_id == founder_id,
    } for m in sorted_members]

    return jsonify({
        "id": team.id,
        "name": team.name,
        "tag": team.tag,
        "logo": team.logo,
        "region": team.region,
        "founder_user_id": founder_id,
        "occupied_slots": _count_occupied_slots(team_id),
        "max_slots": MAX_TEAM_SLOTS,
        "members": members
    }), 200

@teams_bp.route('/my', methods=['GET'])
@token_required
def get_my_teams(current_user):
    memberships = TeamMember.query.filter_by(user_id=current_user.id).all()
    teams = []
    for m in memberships:
        t = m.team
        teams.append({
            "id": t.id,
            "name": t.name,
            "tag": t.tag,
            "logo": t.logo,
            "region": t.region,
            "role": m.team_role
        })
    return jsonify(teams), 200

@teams_bp.route('/<int:team_id>/join', methods=['POST'])
@token_required
def request_to_join(current_user, team_id):
    team = Team.query.get_or_404(team_id)
    
    # 1. Solo los jugadores pueden solicitar unirse
    if current_user.role != 'player':
        return jsonify({"error": "Solo los Jugadores pueden solicitar unirse a equipos"}), 403

    # 2. Verificar si ya es miembro o ya envió solicitud
    existing_member = TeamMember.query.filter_by(team_id=team_id, user_id=current_user.id).first()
    if existing_member:
        return jsonify({"error": "Ya eres miembro de este equipo"}), 400
        
    existing_request = JoinRequest.query.filter_by(team_id=team_id, user_id=current_user.id).first()
    if existing_request:
        return jsonify({"error": "Ya hay una solicitud pendiente"}), 400

    # 3. Verificar si el usuario ya pertenece a OTRO equipo (regla de un solo equipo)
    if TeamMember.query.filter_by(user_id=current_user.id).first():
        return jsonify({"error": "Ya perteneces a un equipo. Solo puedes pertenecer a uno."}), 400

    try:
        new_request = JoinRequest(
            team_id=team_id,
            user_id=current_user.id,
            ingame_role=request.get_json().get('ingame_role'),
            favorite_agent=request.get_json().get('favorite_agent')
        )
        db.session.add(new_request)
        db.session.commit()
        return jsonify({"mensaje": "Solicitud de unión enviada"}), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error en request_to_join")
        return jsonify({"error": "No se pudo enviar la solicitud"}), 500


# ----------------------------------------------------------------------
# Edición / borrado de equipo (admin o founder)
# ----------------------------------------------------------------------

@teams_bp.route('/<int:team_id>', methods=['PUT'])
@token_required
def update_team(current_user, team_id):
    team = Team.query.get_or_404(team_id)
    if not _can_manage_team(current_user, team_id):
        return jsonify({"error": "Solo el fundador del equipo o un admin puede editarlo"}), 403

    data = request.get_json() or {}
    touched = False
    for field in TEAM_EDITABLE_FIELDS:
        if field in data:
            value = data[field]
            if field in ('name', 'tag') and (not isinstance(value, str) or not value.strip()):
                return jsonify({"error": f"'{field}' no puede ser vacío"}), 400
            setattr(team, field, value)
            touched = True

    if not touched:
        return jsonify({"error": "Nada para actualizar"}), 400

    try:
        db.session.commit()
        return jsonify({"mensaje": "Equipo actualizado"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error update_team %s", team_id)
        return jsonify({"error": "No se pudo actualizar el equipo"}), 500


@teams_bp.route('/<int:team_id>', methods=['DELETE'])
@token_required
def delete_team(current_user, team_id):
    team = Team.query.get_or_404(team_id)
    if not _can_manage_team(current_user, team_id):
        return jsonify({"error": "Solo el fundador del equipo o un admin puede borrarlo"}), 403

    try:
        db.session.delete(team)
        db.session.commit()
        return jsonify({"mensaje": "Equipo borrado"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error delete_team %s", team_id)
        return jsonify({"error": "No se pudo borrar el equipo"}), 500


# ----------------------------------------------------------------------
# Gestión de Join Requests (admin o founder)
# ----------------------------------------------------------------------

@teams_bp.route('/<int:team_id>/join-requests', methods=['GET'])
@token_required
def list_join_requests(current_user, team_id):
    Team.query.get_or_404(team_id)
    if not _can_manage_team(current_user, team_id):
        return jsonify({"error": "No autorizado"}), 403

    status_filter = request.args.get('status', 'pending')
    q = JoinRequest.query.filter_by(team_id=team_id)
    if status_filter != 'all':
        q = q.filter_by(status=status_filter)

    return jsonify([{
        "id": r.id,
        "user_id": r.user_id,
        "nickname": r.user.nickname if hasattr(r, 'user') and r.user else None,
        "ingame_role": r.ingame_role,
        "favorite_agent": r.favorite_agent,
        "status": r.status,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in q.all()]), 200


@teams_bp.route('/<int:team_id>/join-requests/<int:request_id>/accept', methods=['POST'])
@token_required
def accept_join_request(current_user, team_id, request_id):
    Team.query.get_or_404(team_id)
    if not _can_manage_team(current_user, team_id):
        return jsonify({"error": "No autorizado"}), 403

    join_req = JoinRequest.query.filter_by(id=request_id, team_id=team_id).first()
    if not join_req:
        return jsonify({"error": "Solicitud no encontrada en este equipo"}), 404
    if join_req.status != 'pending':
        return jsonify({"error": f"La solicitud ya fue procesada (status={join_req.status})"}), 409

    # El solicitante puede haberse unido a otro equipo entre la solicitud y la aceptación
    if TeamMember.query.filter_by(user_id=join_req.user_id).first():
        join_req.status = 'rejected'
        db.session.commit()
        return jsonify({"error": "El usuario ya pertenece a un equipo. Solicitud rechazada automáticamente."}), 409

    # Validar el límite de plazas al ACEPTAR (no al solicitar)
    if _count_occupied_slots(team_id) >= MAX_TEAM_SLOTS:
        return jsonify({"error": f"El equipo ya alcanzó el límite de {MAX_TEAM_SLOTS} plazas"}), 409

    try:
        new_member = TeamMember(
            team_id=team_id,
            user_id=join_req.user_id,
            team_role='player',
            ingame_role=join_req.ingame_role,
            favorite_agent=join_req.favorite_agent,
            occupies_slot=True,
        )
        db.session.add(new_member)
        join_req.status = 'accepted'
        db.session.commit()
        return jsonify({"mensaje": "Solicitud aceptada", "member_user_id": join_req.user_id}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error accept_join_request team=%s req=%s", team_id, request_id)
        return jsonify({"error": "No se pudo aceptar la solicitud"}), 500


@teams_bp.route('/<int:team_id>/join-requests/<int:request_id>/reject', methods=['POST'])
@token_required
def reject_join_request(current_user, team_id, request_id):
    Team.query.get_or_404(team_id)
    if not _can_manage_team(current_user, team_id):
        return jsonify({"error": "No autorizado"}), 403

    join_req = JoinRequest.query.filter_by(id=request_id, team_id=team_id).first()
    if not join_req:
        return jsonify({"error": "Solicitud no encontrada en este equipo"}), 404
    if join_req.status != 'pending':
        return jsonify({"error": f"La solicitud ya fue procesada (status={join_req.status})"}), 409

    try:
        join_req.status = 'rejected'
        db.session.commit()
        return jsonify({"mensaje": "Solicitud rechazada"}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No se pudo rechazar la solicitud"}), 500


# ----------------------------------------------------------------------
# Expulsar miembro / abandonar equipo
# ----------------------------------------------------------------------

@teams_bp.route('/<int:team_id>/members/<int:user_id>', methods=['DELETE'])
@token_required
def remove_team_member(current_user, team_id, user_id):
    Team.query.get_or_404(team_id)

    is_admin = current_user.role == 'admin'
    is_founder = _team_founder_user_id(team_id) == current_user.id
    is_self = current_user.id == user_id

    if not (is_admin or is_founder or is_self):
        return jsonify({"error": "No autorizado"}), 403

    member = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
    if not member:
        return jsonify({"error": "El usuario no pertenece a este equipo"}), 404

    # No se puede expulsar al founder. Si quiere irse, debe borrar el equipo.
    if _team_founder_user_id(team_id) == user_id:
        return jsonify({
            "error": "No se puede expulsar al fundador del equipo. Para disolver el equipo usá DELETE /teams/<id>."
        }), 409

    try:
        db.session.delete(member)
        db.session.commit()
        return jsonify({"mensaje": "Miembro removido del equipo"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error remove_team_member team=%s user=%s", team_id, user_id)
        return jsonify({"error": "No se pudo remover el miembro"}), 500

