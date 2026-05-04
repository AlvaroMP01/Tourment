"""Endpoint de stats globales para vistas públicas (Hero, landing).

Solo lectura, sin auth. La idea es servir contadores rápidos para mostrar
el "tamaño" de la plataforma sin tener que hacer múltiples requests.
"""
from flask import Blueprint, jsonify
from sqlalchemy import func
from extensions import db
from models import Tournament, Team, User

stats_bp = Blueprint('stats', __name__)

# Un torneo cuenta como "activo" si está por arrancar o en curso. Finalizados no.
ACTIVE_TOURNAMENT_STATUSES = ('upcoming', 'live')

# Roles que cuentan como "jugador" en el conteo público.
# coach (sin player) no cuenta porque no compite.
PLAYABLE_USER_ROLES = ('player', 'player_coach')


@stats_bp.route('/overview', methods=['GET'])
def get_overview():
    """Stats globales para el Hero / landing.

    - active_tournaments: torneos en curso o por arrancar.
    - total_teams: todos los equipos registrados.
    - total_players: usuarios con rol que compite (player o player_coach).
    - total_prize_eur: SUM(prize_amount) de torneos activos en EUR.
      Solo EUR por ahora (MVP). Multi-currency requeriría conversión.
    """
    active_tournaments = db.session.query(func.count(Tournament.id)).filter(
        Tournament.status.in_(ACTIVE_TOURNAMENT_STATUSES)
    ).scalar() or 0

    total_teams = db.session.query(func.count(Team.id)).scalar() or 0

    total_players = db.session.query(func.count(User.id)).filter(
        User.role.in_(PLAYABLE_USER_ROLES)
    ).scalar() or 0

    total_prize_eur = db.session.query(
        func.coalesce(func.sum(Tournament.prize_amount), 0)
    ).filter(
        Tournament.status.in_(ACTIVE_TOURNAMENT_STATUSES),
        Tournament.prize_currency == 'EUR',
        Tournament.prize_amount.isnot(None),
    ).scalar()

    return jsonify({
        "active_tournaments": int(active_tournaments),
        "total_teams": int(total_teams),
        "total_players": int(total_players),
        "total_prize_eur": float(total_prize_eur or 0),
    }), 200
