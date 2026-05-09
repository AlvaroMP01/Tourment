import math
import random
from decimal import Decimal, InvalidOperation
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func
from extensions import db
from models import Tournament, Match, Team, TeamMember, MatchPlayerStat, UserStat, TournamentRegistration
from utils import token_required, role_required, try_get_user_from_request
from uploads_helper import process_and_save, delete_upload, is_uploaded_path

tournaments_bp = Blueprint('tournaments', __name__)

# Roles autorizados para gestionar torneos (crear/programar matches/reportar resultados)
TOURNAMENT_MANAGER_ROLES = ('admin', 'tournament_manager')


def _team_founder_user_id(team_id):
    """Founder = primer miembro por joined_at, luego id. Mismo criterio que en
    routes/teams.py — duplicado acá para evitar import cruzado."""
    first = (TeamMember.query
             .filter_by(team_id=team_id)
             .order_by(TeamMember.joined_at.asc(), TeamMember.id.asc())
             .first())
    return first.user_id if first else None


def _is_tournament_manager(user):
    return user.role in TOURNAMENT_MANAGER_ROLES


def _ensure_registration(tournament_id, team_id, user_id, status='accepted'):
    """Atajo Opción 2: si el admin agrega un team a un match sin inscripción
    previa, se crea la inscripción auto-aceptada. Si ya existe (cualquier
    status), no se toca para no pisar decisiones explícitas."""
    existing = TournamentRegistration.query.filter_by(
        tournament_id=tournament_id, team_id=team_id
    ).first()
    if existing:
        return existing
    reg = TournamentRegistration(
        tournament_id=tournament_id,
        team_id=team_id,
        status=status,
        requested_by_user_id=user_id,
    )
    db.session.add(reg)
    return reg

# Monedas aceptadas para prize_currency. Por ahora solo EUR (MVP España).
# Cuando se internacionalice, expandir y resolver conversión en stats.
ALLOWED_CURRENCIES = ('EUR',)


def _normalize_prize(amount, currency):
    """Valida y normaliza prize_amount + prize_currency.
    Devuelve ((amount_decimal_or_None, currency_or_None), None) en éxito,
    o (None, error_str) en fallo.

    Reglas:
    - amount null/empty/0 → (None, None) — torneo sin premio.
    - amount > 0 → currency obligatorio y en whitelist."""
    if amount in ('', None):
        return (None, None), None
    try:
        amount_dec = Decimal(str(amount))
    except (InvalidOperation, ValueError):
        return None, "prize_amount debe ser numérico"
    if amount_dec < 0:
        return None, "prize_amount no puede ser negativo"
    if amount_dec == 0:
        return (None, None), None
    if not currency:
        return None, "prize_currency es obligatorio cuando hay prize_amount"
    if currency not in ALLOWED_CURRENCIES:
        return None, f"Moneda '{currency}' no soportada (permitidas: {', '.join(ALLOWED_CURRENCIES)})"
    return (amount_dec, currency), None

@tournaments_bp.route('', methods=['GET'])
def get_tournaments():
    # Conteo de inscripciones aceptadas por torneo en una sola query (evita N+1).
    # outerjoin para que torneos sin inscripciones sigan apareciendo con count=0.
    counts_sq = (db.session.query(
            TournamentRegistration.tournament_id.label('tid'),
            func.count(TournamentRegistration.id).label('cnt'),
        )
        .filter(TournamentRegistration.status == 'accepted')
        .group_by(TournamentRegistration.tournament_id)
        .subquery())

    rows = (db.session.query(Tournament, func.coalesce(counts_sq.c.cnt, 0))
            .outerjoin(counts_sq, Tournament.id == counts_sq.c.tid)
            .all())

    return jsonify([{
        "id": t.id,
        "name": t.name,
        "start_date": t.start_date.isoformat(),
        "end_date": t.end_date.isoformat(),
        "status": t.status,
        "image": t.image,
        "prize_amount": float(t.prize_amount) if t.prize_amount is not None else None,
        "prize_currency": t.prize_currency,
        "description": t.description,
        "accepted_teams_count": int(cnt),
    } for t, cnt in rows]), 200

@tournaments_bp.route('/<int:tournament_id>', methods=['GET'])
def get_tournament_detail(tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    return jsonify({
        "id": tournament.id,
        "name": tournament.name,
        "start_date": tournament.start_date.isoformat(),
        "end_date": tournament.end_date.isoformat(),
        "status": tournament.status,
        "image": tournament.image,
        "prize_amount": float(tournament.prize_amount) if tournament.prize_amount is not None else None,
        "prize_currency": tournament.prize_currency,
        "description": tournament.description,
        "bracket_size": tournament.bracket_size,
        "matches": [
            {
                "id": m.id,
                "team1_id": m.team1_id,
                "team2_id": m.team2_id,
                "score": f"{m.score_team1}:{m.score_team2}",
                "map": m.map_name,
                "round": m.round_name,
                "status": m.status,
                "date": m.match_date.isoformat() if m.match_date else None,
                "bracket_round": m.bracket_round,
                "bracket_position": m.bracket_position,
                "next_match_id": m.next_match_id,
                "next_match_slot": m.next_match_slot,
            } for m in tournament.matches
        ]
    }), 200

@tournaments_bp.route('', methods=['POST'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def create_tournament(current_user):
    data = request.get_json() or {}
    if not data.get('name') or not data.get('start_date') or not data.get('end_date'):
        return jsonify({"error": "name, start_date y end_date son obligatorios"}), 400

    prize_norm, err = _normalize_prize(data.get('prize_amount'), data.get('prize_currency'))
    if err:
        return jsonify({"error": err}), 400
    prize_amount, prize_currency = prize_norm

    try:
        # image se sube por separado vía POST /tournaments/<id>/image para
        # evitar URLs externas arbitrarias.
        new_tournament = Tournament(
            name=data['name'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            status=data.get('status', 'upcoming'),
            prize_amount=prize_amount,
            prize_currency=prize_currency,
            description=data.get('description') or None,
        )
        db.session.add(new_tournament)
        db.session.commit()
        return jsonify({"mensaje": "Torneo creado", "id": new_tournament.id}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No se pudo crear el torneo"}), 500


@tournaments_bp.route('/<int:tournament_id>', methods=['PUT'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def update_tournament(current_user, tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    data = request.get_json() or {}

    # image se gestiona por POST/DELETE /tournaments/<id>/image para evitar
    # URLs externas arbitrarias.
    editable = ('name', 'start_date', 'end_date', 'status', 'description')
    touched = False
    for f in editable:
        if f in data:
            if f == 'status' and data[f] not in ('upcoming', 'live', 'finished'):
                return jsonify({"error": "status inválido"}), 400
            if f == 'name' and (not isinstance(data[f], str) or not data[f].strip()):
                return jsonify({"error": "name no puede ser vacío"}), 400
            # Para campos opcionales string, vacío == NULL (limpiar el campo)
            value = data[f]
            if f == 'description' and isinstance(value, str) and not value.strip():
                value = None
            setattr(tournament, f, value)
            touched = True

    # prize_amount y prize_currency se procesan juntos (son atómicos).
    if 'prize_amount' in data or 'prize_currency' in data:
        prize_norm, err = _normalize_prize(data.get('prize_amount'), data.get('prize_currency'))
        if err:
            return jsonify({"error": err}), 400
        tournament.prize_amount, tournament.prize_currency = prize_norm
        touched = True

    if not touched:
        return jsonify({"error": "Nada para actualizar"}), 400

    try:
        db.session.commit()
        return jsonify({"mensaje": "Torneo actualizado"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error update_tournament %s", tournament_id)
        return jsonify({"error": "No se pudo actualizar el torneo"}), 500


@tournaments_bp.route('/<int:tournament_id>', methods=['DELETE'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def delete_tournament(current_user, tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)

    # Capturo la imagen antes del delete: el archivo físico no cae por CASCADE.
    old_image = tournament.image

    try:
        db.session.delete(tournament)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error delete_tournament %s", tournament_id)
        return jsonify({"error": "No se pudo borrar el torneo"}), 500

    if old_image and is_uploaded_path(old_image):
        delete_upload(old_image)
    return jsonify({"mensaje": "Torneo borrado"}), 200

@tournaments_bp.route('/<int:tournament_id>/matches', methods=['POST'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def create_match(current_user, tournament_id):
    # Si el torneo tiene un bracket generado, no se permite crear matches sueltos
    # — todos los partidos los maneja el bracket.
    tournament = Tournament.query.get_or_404(tournament_id)
    if tournament.bracket_size is not None:
        return jsonify({
            "error": "El torneo tiene un bracket activo. Borrá el bracket antes de crear matches manuales."
        }), 409

    data = request.get_json() or {}
    if not data.get('team1_id') or not data.get('team2_id'):
        return jsonify({"error": "team1_id y team2_id son obligatorios"}), 400
    if data['team1_id'] == data['team2_id']:
        return jsonify({"error": "Un equipo no puede jugar contra sí mismo"}), 400

    # Validar que los teams existan antes de tocar la registration
    for tid in (data['team1_id'], data['team2_id']):
        if not Team.query.get(tid):
            return jsonify({"error": f"team_id {tid} no existe"}), 400

    try:
        # Atajo Opción 2: si el admin agrega un team que no estaba inscrito,
        # se crea la inscripción auto-aceptada en su nombre.
        _ensure_registration(tournament_id, data['team1_id'], current_user.id, status='accepted')
        _ensure_registration(tournament_id, data['team2_id'], current_user.id, status='accepted')

        new_match = Match(
            tournament_id=tournament_id,
            team1_id=data['team1_id'],
            team2_id=data['team2_id'],
            map_name=data.get('map_name'),
            round_name=data.get('round_name'),
            status=data.get('status', 'scheduled'),
            match_date=data.get('match_date')
        )
        db.session.add(new_match)
        db.session.commit()
        return jsonify({"mensaje": "Partida programada", "id": new_match.id}), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error create_match tournament=%s", tournament_id)
        return jsonify({"error": "No se pudo programar la partida"}), 500

@tournaments_bp.route('/<int:tournament_id>/matches/<int:match_id>', methods=['PUT'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def update_match(current_user, tournament_id, match_id):
    """Edita metadatos de un match. NO permite editar score si ya está reportado
    (status='finished') — para corregir resultados se requiere otro flujo."""
    match = Match.query.filter_by(id=match_id, tournament_id=tournament_id).first_or_404()

    if match.status == 'finished':
        return jsonify({
            "error": "El match ya fue reportado. Las ediciones post-reporte requieren un flujo de corrección dedicado."
        }), 409

    # Matches del bracket no se editan a mano: cambiar team1/team2 rompe el árbol.
    # Si admin necesita cambios, debe borrar el bracket entero y regenerarlo.
    if match.bracket_round is not None:
        return jsonify({
            "error": "Este match es parte del bracket — no se puede editar individualmente. "
                     "Borrá el bracket completo si necesitás regenerarlo."
        }), 409

    data = request.get_json() or {}
    editable = ('team1_id', 'team2_id', 'map_name', 'round_name', 'match_date', 'status')

    touched = False
    for f in editable:
        if f in data:
            if f == 'status' and data[f] not in ('scheduled', 'live', 'finished'):
                return jsonify({"error": "status inválido"}), 400
            # No permitir setear status='finished' por acá: eso pasa al reportar resultados
            if f == 'status' and data[f] == 'finished':
                return jsonify({
                    "error": "Para marcar un match como finished usá POST /matches/<id>/results"
                }), 400
            setattr(match, f, data[f])
            touched = True

    if not touched:
        return jsonify({"error": "Nada para actualizar"}), 400

    try:
        db.session.commit()
        return jsonify({"mensaje": "Match actualizado"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error update_match %s", match_id)
        return jsonify({"error": "No se pudo actualizar el match"}), 500


@tournaments_bp.route('/<int:tournament_id>/matches/<int:match_id>', methods=['DELETE'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def delete_match(current_user, tournament_id, match_id):
    """Borra un match. Bloquea borrado si ya está finished — los stats agregados
    de cada jugador ya fueron sumados a UserStat y borrar acá los desincronizaría
    (los MatchPlayerStat se borrarían por CASCADE pero UserStat no se rebobina)."""
    match = Match.query.filter_by(id=match_id, tournament_id=tournament_id).first_or_404()

    if match.status == 'finished':
        return jsonify({
            "error": "No se puede borrar un match ya reportado. Sus stats afectan UserStat."
        }), 409

    # Matches del bracket no se borran de a uno: rompe el árbol. Borrar bracket entero.
    if match.bracket_round is not None:
        return jsonify({
            "error": "Este match es parte del bracket — borrá el bracket entero desde DELETE /tournaments/<id>/bracket."
        }), 409

    try:
        db.session.delete(match)
        db.session.commit()
        return jsonify({"mensaje": "Match borrado"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error delete_match %s", match_id)
        return jsonify({"error": "No se pudo borrar el match"}), 500


@tournaments_bp.route('/<int:tournament_id>/matches', methods=['GET'])
def get_tournament_matches(tournament_id):
    matches = Match.query.filter_by(tournament_id=tournament_id).all()
    return jsonify([{
        "id": m.id,
        "team1_id": m.team1_id,
        "team2_id": m.team2_id,
        "score": f"{m.score_team1}:{m.score_team2}",
        "map": m.map_name,
        "round": m.round_name,
        "status": m.status,
        "date": m.match_date.isoformat() if m.match_date else None
    } for m in matches]), 200


def _apply_player_stats_to_aggregate(user_stat: UserStat, kills, deaths, assists, clutches, adr, hs_percentage):
    """Suma deltas a UserStat. ADR/HS% son promedios ponderados por matches_played."""
    user_stat.kills = (user_stat.kills or 0) + kills
    user_stat.deaths = (user_stat.deaths or 0) + deaths
    user_stat.assists = (user_stat.assists or 0) + assists
    user_stat.clutches = (user_stat.clutches or 0) + clutches

    prev_matches = user_stat.matches_played or 0
    new_matches = prev_matches + 1
    prev_adr = Decimal(user_stat.adr or 0)
    prev_hs = Decimal(user_stat.hs_percentage or 0)

    user_stat.adr = (prev_adr * prev_matches + Decimal(str(adr))) / new_matches
    user_stat.hs_percentage = (prev_hs * prev_matches + Decimal(str(hs_percentage))) / new_matches
    user_stat.matches_played = new_matches


def _validate_player_stat_payload(p):
    """Valida y normaliza una entrada de stats de jugador. Devuelve (dict, None) o (None, error)."""
    required_int_fields = ('user_id', 'kills', 'deaths', 'assists', 'clutches')
    for f in required_int_fields:
        if f not in p:
            return None, f"Falta el campo '{f}' en una entrada de player stats"
        try:
            p[f] = int(p[f])
        except (TypeError, ValueError):
            return None, f"'{f}' debe ser entero"
        if p[f] < 0:
            return None, f"'{f}' no puede ser negativo"

    for f in ('adr', 'hs_percentage'):
        if f not in p:
            return None, f"Falta el campo '{f}' en una entrada de player stats"
        try:
            val = float(p[f])
        except (TypeError, ValueError):
            return None, f"'{f}' debe ser numérico"
        if val < 0:
            return None, f"'{f}' no puede ser negativo"
        if f == 'hs_percentage' and val > 100:
            return None, "'hs_percentage' no puede ser mayor a 100"
        p[f] = val

    return p, None


@tournaments_bp.route('/<int:tournament_id>/matches/<int:match_id>/results', methods=['POST'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def report_match_results(current_user, tournament_id, match_id):
    """Reporta el resultado de una partida y las stats por jugador.
    Idempotente: si el match ya está 'finished', rechaza."""
    match = Match.query.filter_by(id=match_id, tournament_id=tournament_id).first()
    if not match:
        return jsonify({"error": "Partida no encontrada en este torneo"}), 404

    if match.status == 'finished':
        return jsonify({"error": "Esta partida ya fue reportada. Para correcciones se requiere otro endpoint."}), 409

    # En brackets, los slots arrancan vacíos hasta que avance alguien.
    if match.team1_id is None or match.team2_id is None:
        return jsonify({"error": "El match no tiene los dos equipos asignados todavía."}), 409

    data = request.get_json() or {}

    if 'score_team1' not in data or 'score_team2' not in data:
        return jsonify({"error": "score_team1 y score_team2 son obligatorios"}), 400
    try:
        score1 = int(data['score_team1'])
        score2 = int(data['score_team2'])
    except (TypeError, ValueError):
        return jsonify({"error": "Los scores deben ser enteros"}), 400
    if score1 < 0 or score2 < 0:
        return jsonify({"error": "Los scores no pueden ser negativos"}), 400

    players_payload = data.get('players')
    if not isinstance(players_payload, list) or len(players_payload) == 0:
        return jsonify({"error": "Se requiere una lista 'players' con al menos una entrada"}), 400

    # Pre-cargo los user_ids autorizados (miembros de team1 o team2)
    allowed_user_ids = {
        m.user_id for m in TeamMember.query.filter(
            TeamMember.team_id.in_([match.team1_id, match.team2_id])
        ).all()
    }

    seen_user_ids = set()
    validated = []
    for raw in players_payload:
        if not isinstance(raw, dict):
            return jsonify({"error": "Cada entrada de 'players' debe ser un objeto"}), 400
        p, err = _validate_player_stat_payload(dict(raw))
        if err:
            return jsonify({"error": err}), 400
        if p['user_id'] not in allowed_user_ids:
            return jsonify({"error": f"user_id {p['user_id']} no es miembro de team1 ni team2"}), 400
        if p['user_id'] in seen_user_ids:
            return jsonify({"error": f"user_id {p['user_id']} duplicado en el reporte"}), 400
        seen_user_ids.add(p['user_id'])
        validated.append(p)

    # En matches del bracket NO se pueden reportar empates (alguien tiene que avanzar).
    if match.next_match_id is not None and score1 == score2:
        return jsonify({"error": "Un match del bracket no puede terminar en empate"}), 400

    try:
        match.score_team1 = score1
        match.score_team2 = score2
        match.status = 'finished'

        for p in validated:
            mps = MatchPlayerStat(
                match_id=match.id,
                user_id=p['user_id'],
                kills=p['kills'],
                deaths=p['deaths'],
                assists=p['assists'],
                clutches=p['clutches'],
                adr=p['adr'],
                hs_percentage=p['hs_percentage'],
            )
            db.session.add(mps)

            user_stat = UserStat.query.get(p['user_id'])
            if not user_stat:
                # El usuario existe (validado por allowed_user_ids) pero no tiene fila en user_stats
                user_stat = UserStat(user_id=p['user_id'])
                db.session.add(user_stat)
                db.session.flush()

            _apply_player_stats_to_aggregate(
                user_stat,
                kills=p['kills'],
                deaths=p['deaths'],
                assists=p['assists'],
                clutches=p['clutches'],
                adr=p['adr'],
                hs_percentage=p['hs_percentage'],
            )

        # Avance automático del ganador en el bracket. Solo si el match es parte
        # del bracket (next_match_id seteado). El slot destino lo dice next_match_slot.
        if match.next_match_id is not None and match.next_match_slot in ('team1', 'team2'):
            winner_team_id = match.team1_id if score1 > score2 else match.team2_id
            next_match = Match.query.get(match.next_match_id)
            if next_match is not None:
                if match.next_match_slot == 'team1':
                    next_match.team1_id = winner_team_id
                else:
                    next_match.team2_id = winner_team_id

        db.session.commit()
        return jsonify({
            "mensaje": "Resultado reportado",
            "match_id": match.id,
            "players_recorded": len(validated)
        }), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error reportando resultado de match %s", match_id)
        return jsonify({"error": "No se pudo registrar el resultado"}), 500


# ----------------------------------------------------------------------
# Imagen de torneo: upload / delete (admin o tournament_manager)
# ----------------------------------------------------------------------

@tournaments_bp.route('/<int:tournament_id>/image', methods=['POST'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def upload_tournament_image(current_user, tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)

    if 'file' not in request.files:
        return jsonify({"error": "Falta el archivo (campo 'file')"}), 400
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "No se seleccionó archivo"}), 400

    try:
        new_path = process_and_save(file, 'tournament_images')
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    old_path = tournament.image
    try:
        tournament.image = new_path
        db.session.commit()
    except Exception:
        db.session.rollback()
        delete_upload(new_path)
        current_app.logger.exception("Error guardando imagen tournament %s", tournament_id)
        return jsonify({"error": "No se pudo guardar la imagen"}), 500

    if old_path and is_uploaded_path(old_path) and old_path != new_path:
        delete_upload(old_path)
    return jsonify({"image": new_path}), 200


@tournaments_bp.route('/<int:tournament_id>/image', methods=['DELETE'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def delete_tournament_image(current_user, tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    old_path = tournament.image
    try:
        tournament.image = None
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error borrando imagen tournament %s", tournament_id)
        return jsonify({"error": "No se pudo borrar la imagen"}), 500

    if old_path and is_uploaded_path(old_path):
        delete_upload(old_path)
    return jsonify({"image": None}), 200


@tournaments_bp.route('/<int:tournament_id>/matches/<int:match_id>/stats', methods=['GET'])
def get_match_stats(tournament_id, match_id):
    """Stats por jugador de una partida (público — para vista de match detail)."""
    match = Match.query.filter_by(id=match_id, tournament_id=tournament_id).first_or_404()
    return jsonify({
        "match_id": match.id,
        "status": match.status,
        "score": f"{match.score_team1}:{match.score_team2}",
        "players": [{
            "user_id": s.user_id,
            "kills": s.kills,
            "deaths": s.deaths,
            "assists": s.assists,
            "clutches": s.clutches,
            "adr": float(s.adr or 0),
            "hs_percentage": float(s.hs_percentage or 0),
        } for s in match.player_stats]
    }), 200


# ----------------------------------------------------------------------
# Inscripción de equipos a torneos (Opción 2: founder self-service +
# atajo del admin vía create_match).
# ----------------------------------------------------------------------

def _serialize_registration(reg):
    return {
        "id": reg.id,
        "tournament_id": reg.tournament_id,
        "team_id": reg.team_id,
        "team_name": reg.team.name if reg.team else None,
        "team_tag": reg.team.tag if reg.team else None,
        "team_logo": reg.team.logo if reg.team else None,
        "status": reg.status,
        "requested_by_user_id": reg.requested_by_user_id,
        "created_at": reg.created_at.isoformat() if reg.created_at else None,
    }


@tournaments_bp.route('/<int:tournament_id>/register', methods=['POST'])
@token_required
def register_team_to_tournament(current_user, tournament_id):
    """Founder solicita inscribir su equipo en un torneo.
    El team_id viene en el body. Solo se permite si:
    - el torneo está 'upcoming'
    - el solicitante es el founder del team
    - no hay una inscripción previa para ese (tournament, team)"""
    tournament = Tournament.query.get_or_404(tournament_id)
    if tournament.status != 'upcoming':
        return jsonify({"error": "Solo se puede inscribir en torneos 'upcoming'"}), 409

    data = request.get_json() or {}
    team_id = data.get('team_id')
    if not team_id:
        return jsonify({"error": "team_id es obligatorio"}), 400

    team = Team.query.get(team_id)
    if not team:
        return jsonify({"error": "Equipo no encontrado"}), 404

    if _team_founder_user_id(team_id) != current_user.id and current_user.role != 'admin':
        return jsonify({"error": "Solo el fundador del equipo (o un admin) puede inscribirlo"}), 403

    existing = TournamentRegistration.query.filter_by(
        tournament_id=tournament_id, team_id=team_id
    ).first()
    if existing:
        return jsonify({
            "error": f"Este equipo ya tiene una inscripción en este torneo (status={existing.status})"
        }), 409

    try:
        reg = TournamentRegistration(
            tournament_id=tournament_id,
            team_id=team_id,
            status='pending',
            requested_by_user_id=current_user.id,
        )
        db.session.add(reg)
        db.session.commit()
        return jsonify({"mensaje": "Solicitud de inscripción enviada", "registration": _serialize_registration(reg)}), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error register_team_to_tournament t=%s team=%s", tournament_id, team_id)
        return jsonify({"error": "No se pudo registrar la solicitud"}), 500


@tournaments_bp.route('/<int:tournament_id>/registrations', methods=['GET'])
def list_tournament_registrations(tournament_id):
    """Lista de inscripciones. Público devuelve solo 'accepted'.
    Admin/tournament_manager (con token válido) ve todos los status.
    Acepta ?status=pending|accepted|rejected|all."""
    Tournament.query.get_or_404(tournament_id)

    user = try_get_user_from_request()
    is_manager = bool(user and _is_tournament_manager(user))

    # Si NO es manager, forzamos status='accepted' (sin importar lo que pida).
    if not is_manager:
        regs = (TournamentRegistration.query
                .filter_by(tournament_id=tournament_id, status='accepted')
                .all())
        return jsonify([_serialize_registration(r) for r in regs]), 200

    status_filter = request.args.get('status', 'all')
    q = TournamentRegistration.query.filter_by(tournament_id=tournament_id)
    if status_filter != 'all':
        q = q.filter_by(status=status_filter)
    return jsonify([_serialize_registration(r) for r in q.all()]), 200


@tournaments_bp.route('/<int:tournament_id>/registrations/<int:reg_id>/accept', methods=['POST'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def accept_tournament_registration(current_user, tournament_id, reg_id):
    reg = TournamentRegistration.query.filter_by(id=reg_id, tournament_id=tournament_id).first_or_404()
    if reg.status != 'pending':
        return jsonify({"error": f"La inscripción ya fue procesada (status={reg.status})"}), 409
    try:
        reg.status = 'accepted'
        db.session.commit()
        return jsonify({"mensaje": "Inscripción aceptada", "registration": _serialize_registration(reg)}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error accept_registration t=%s reg=%s", tournament_id, reg_id)
        return jsonify({"error": "No se pudo aceptar la inscripción"}), 500


@tournaments_bp.route('/<int:tournament_id>/registrations/<int:reg_id>/reject', methods=['POST'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def reject_tournament_registration(current_user, tournament_id, reg_id):
    reg = TournamentRegistration.query.filter_by(id=reg_id, tournament_id=tournament_id).first_or_404()
    if reg.status != 'pending':
        return jsonify({"error": f"La inscripción ya fue procesada (status={reg.status})"}), 409
    try:
        reg.status = 'rejected'
        db.session.commit()
        return jsonify({"mensaje": "Inscripción rechazada", "registration": _serialize_registration(reg)}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error reject_registration t=%s reg=%s", tournament_id, reg_id)
        return jsonify({"error": "No se pudo rechazar la inscripción"}), 500


@tournaments_bp.route('/<int:tournament_id>/registrations/<int:reg_id>', methods=['DELETE'])
@token_required
def delete_tournament_registration(current_user, tournament_id, reg_id):
    """Founder retira (solo si está pending y es su equipo) o admin/tournament_manager
    remueve cualquier estado. Si hay matches del torneo con ese team_id, se bloquea
    para evitar dejar matches con un team 'no inscrito'."""
    reg = TournamentRegistration.query.filter_by(id=reg_id, tournament_id=tournament_id).first_or_404()

    is_manager = _is_tournament_manager(current_user)
    is_founder = _team_founder_user_id(reg.team_id) == current_user.id

    if not is_manager:
        if not is_founder:
            return jsonify({"error": "No autorizado"}), 403
        if reg.status != 'pending':
            return jsonify({"error": "Solo se puede retirar una inscripción pendiente"}), 409

    # Bloqueo: si el team ya tiene matches en este torneo, no se puede borrar.
    has_matches = Match.query.filter(
        Match.tournament_id == tournament_id,
        ((Match.team1_id == reg.team_id) | (Match.team2_id == reg.team_id))
    ).first() is not None
    if has_matches:
        return jsonify({
            "error": "No se puede eliminar la inscripción: el equipo ya tiene partidas en este torneo"
        }), 409

    try:
        db.session.delete(reg)
        db.session.commit()
        return jsonify({"mensaje": "Inscripción eliminada"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error delete_registration t=%s reg=%s", tournament_id, reg_id)
        return jsonify({"error": "No se pudo eliminar la inscripción"}), 500


# ----------------------------------------------------------------------
# Bracket de eliminación directa (single-elim).
# Tamaños permitidos: 4, 8 o 16 equipos (potencias de 2 estrictas).
# El admin/manager genera el bracket cuando los equipos aceptados coinciden
# con uno de esos tamaños. Una vez generado, los matches se llenan
# automáticamente al reportar resultados (ver report_match_results).
# ----------------------------------------------------------------------

ALLOWED_BRACKET_SIZES = (4, 8, 16)


def _bracket_round_name(size, round_num):
    """Nombre humano de la ronda según el tamaño del bracket.
    round_num=1 es la primera ronda; el último es la final."""
    rounds_count = int(math.log2(size))
    rounds_from_final = rounds_count - round_num
    names = {0: 'Final', 1: 'Semifinal', 2: 'Cuartos', 3: 'Octavos'}
    return names.get(rounds_from_final, f'Ronda {round_num}')


@tournaments_bp.route('/<int:tournament_id>/bracket', methods=['POST'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def generate_bracket(current_user, tournament_id):
    """Genera un bracket de eliminación directa para el torneo.
    Reglas:
      - El torneo NO debe tener bracket previo (bracket_size IS NULL).
      - El torneo NO debe tener matches ya creados (para no mezclar manuales con bracket).
      - La cantidad de equipos aceptados debe ser exactamente 4, 8 o 16.
      - El emparejamiento es aleatorio (random shuffle).
    """
    tournament = Tournament.query.get_or_404(tournament_id)

    if tournament.bracket_size is not None:
        return jsonify({"error": "El torneo ya tiene un bracket generado"}), 409

    existing_matches = Match.query.filter_by(tournament_id=tournament_id).first()
    if existing_matches is not None:
        return jsonify({
            "error": "El torneo tiene matches creados manualmente. Borralos antes de generar un bracket."
        }), 409

    accepted = (TournamentRegistration.query
                .filter_by(tournament_id=tournament_id, status='accepted')
                .all())
    n_teams = len(accepted)

    if n_teams not in ALLOWED_BRACKET_SIZES:
        return jsonify({
            "error": (
                f"El torneo tiene {n_teams} equipos inscritos. "
                f"El bracket requiere exactamente {', '.join(str(s) for s in ALLOWED_BRACKET_SIZES)}."
            )
        }), 409

    size = n_teams
    rounds_count = int(math.log2(size))

    team_ids = [r.team_id for r in accepted]
    random.shuffle(team_ids)

    try:
        # Crear todos los matches del bracket. Por ronda: round 1 tiene size/2,
        # round 2 tiene size/4, etc. Total = size - 1 matches.
        matches_by_round = {}
        for r in range(1, rounds_count + 1):
            count_in_round = size // (2 ** r)
            matches_by_round[r] = []
            for pos in range(1, count_in_round + 1):
                m = Match(
                    tournament_id=tournament_id,
                    bracket_round=r,
                    bracket_position=pos,
                    round_name=_bracket_round_name(size, r),
                    status='scheduled',
                )
                # Round 1: setear los teams desde el shuffle. Las rondas siguientes
                # arrancan con team1/team2 = NULL — se llenan al reportar el ganador.
                if r == 1:
                    m.team1_id = team_ids[(pos - 1) * 2]
                    m.team2_id = team_ids[(pos - 1) * 2 + 1]
                matches_by_round[r].append(m)
                db.session.add(m)

        # Flush para obtener IDs antes de linkear next_match_id.
        db.session.flush()

        # Linkear: para cada match de round r (no la última), su ganador avanza
        # al match de round r+1 en posición ceil(pos/2). Slot team1 si pos impar,
        # team2 si pos par. La final (último round) tiene next_match_id=NULL.
        for r in range(1, rounds_count):
            for idx, m in enumerate(matches_by_round[r]):
                pos = idx + 1
                next_pos = (pos + 1) // 2
                next_match = matches_by_round[r + 1][next_pos - 1]
                m.next_match_id = next_match.id
                m.next_match_slot = 'team1' if pos % 2 == 1 else 'team2'

        tournament.bracket_size = size
        db.session.commit()

        return jsonify({
            "mensaje": "Bracket generado",
            "bracket_size": size,
            "rounds": rounds_count,
            "matches_created": size - 1,
        }), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error generate_bracket t=%s", tournament_id)
        return jsonify({"error": "No se pudo generar el bracket"}), 500


@tournaments_bp.route('/<int:tournament_id>/bracket', methods=['DELETE'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def delete_bracket(current_user, tournament_id):
    """Borra el bracket: limpia bracket_size y elimina TODOS los matches del torneo.
    Bloqueo: si algún match ya está finished, no se puede borrar (sus stats ya
    afectaron UserStat — ver el mismo bloqueo en delete_match)."""
    tournament = Tournament.query.get_or_404(tournament_id)

    if tournament.bracket_size is None:
        return jsonify({"error": "El torneo no tiene bracket"}), 409

    finished_match = (Match.query
                      .filter_by(tournament_id=tournament_id, status='finished')
                      .first())
    if finished_match is not None:
        return jsonify({
            "error": "No se puede borrar el bracket: ya hay partidos reportados con stats aplicadas."
        }), 409

    try:
        # Borrar primero los matches que apuntan como next_match_id a otros
        # quedaría feo por la FK. SET NULL on delete del FK lo resuelve, pero
        # para ser explícito limpiamos en orden inverso de rondas.
        matches = (Match.query
                   .filter_by(tournament_id=tournament_id)
                   .order_by(Match.bracket_round.desc().nullslast())
                   .all())
        for m in matches:
            db.session.delete(m)
        tournament.bracket_size = None
        db.session.commit()
        return jsonify({"mensaje": "Bracket eliminado"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error delete_bracket t=%s", tournament_id)
        return jsonify({"error": "No se pudo borrar el bracket"}), 500
