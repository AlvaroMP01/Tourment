from decimal import Decimal
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models import Tournament, Match, Team, TeamMember, MatchPlayerStat, UserStat
from utils import token_required, role_required

tournaments_bp = Blueprint('tournaments', __name__)

# Roles autorizados para gestionar torneos (crear/programar matches/reportar resultados)
TOURNAMENT_MANAGER_ROLES = ('admin', 'tournament_manager')

@tournaments_bp.route('', methods=['GET'])
def get_tournaments():
    tournaments = Tournament.query.all()
    return jsonify([{
        "id": t.id,
        "name": t.name,
        "start_date": t.start_date.isoformat(),
        "end_date": t.end_date.isoformat(),
        "status": t.status
    } for t in tournaments]), 200

@tournaments_bp.route('/<int:tournament_id>', methods=['GET'])
def get_tournament_detail(tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    return jsonify({
        "id": tournament.id,
        "name": tournament.name,
        "start_date": tournament.start_date.isoformat(),
        "end_date": tournament.end_date.isoformat(),
        "status": tournament.status,
        "matches": [
            {
                "id": m.id,
                "team1_id": m.team1_id,
                "team2_id": m.team2_id,
                "score": f"{m.score_team1}:{m.score_team2}",
                "map": m.map_name,
                "round": m.round_name,
                "status": m.status,
                "date": m.match_date.isoformat() if m.match_date else None
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
    try:
        new_tournament = Tournament(
            name=data['name'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            status=data.get('status', 'upcoming')
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

    editable = ('name', 'start_date', 'end_date', 'status')
    touched = False
    for f in editable:
        if f in data:
            if f == 'status' and data[f] not in ('upcoming', 'live', 'finished'):
                return jsonify({"error": "status inválido"}), 400
            if f == 'name' and (not isinstance(data[f], str) or not data[f].strip()):
                return jsonify({"error": "name no puede ser vacío"}), 400
            setattr(tournament, f, data[f])
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
    try:
        db.session.delete(tournament)
        db.session.commit()
        return jsonify({"mensaje": "Torneo borrado"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Error delete_tournament %s", tournament_id)
        return jsonify({"error": "No se pudo borrar el torneo"}), 500

@tournaments_bp.route('/<int:tournament_id>/matches', methods=['POST'])
@token_required
@role_required(*TOURNAMENT_MANAGER_ROLES)
def create_match(current_user, tournament_id):
    data = request.get_json() or {}
    if not data.get('team1_id') or not data.get('team2_id'):
        return jsonify({"error": "team1_id y team2_id son obligatorios"}), 400
    try:
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
