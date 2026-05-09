"""Inyección de datos de prueba para Tourment.

Crea/actualiza:
- 1 admin (`admin`)                           — controlado por ADMIN_PASSWORD
- 1 tournament_manager (`tm_carlos`)
- 4 coaches: `coach_red` (coach), `coach_blue` (player_coach),
              `coach_green` (coach), `coach_yellow` (player_coach)
- 19 players: `player_01` ... `player_19`
- 4 teams: "Red Phoenix" [RPX], "Blue Wolves" [BWV],
           "Green Hawks" [GHK], "Yellow Tigers" [YTG] con rosters armados
- 2 tournaments:
    * "Torneo de Pruebas 2026" (upcoming) con 3 matches sueltos entre Red/Blue
    * "Bracket de Pruebas 2026" (upcoming) con los 4 teams inscritos (accepted),
       SIN matches — listo para que admin genere bracket desde la UI

Uso:
    docker exec backend python seed.py

Env vars:
    ADMIN_NICKNAME       (default: 'admin')
    ADMIN_PASSWORD       (obligatoria, mínimo 8 chars)
    ADMIN_FORCE_RESET    (=1 para resetear password/role del admin existente)
    SEED_USER_PASSWORD   (default: 'password123', mínimo 8 chars)
                         se aplica al resto de usuarios de prueba.

Idempotente:
- Cada paso verifica existencia antes de crear; re-correr no duplica datos.
- NO se siembran matches `finished` a propósito: reportar resultados muta
  agregados en `UserStat` y romper la idempotencia es trivial al re-correr.
  Para testear el flujo de reporte, hacelo desde el panel admin.
"""
import os
import sys
from datetime import date, datetime, timedelta

from app import app
from extensions import db
from models import User, UserStat, Team, TeamMember, Tournament, Match, TournamentRegistration
from werkzeug.security import generate_password_hash


MIN_PASSWORD_LENGTH = 8
DEFAULT_USER_PASSWORD = 'password123'
MAX_TEAM_SLOTS = 7


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------

def _get_user_by_nickname(nickname):
    return User.query.filter_by(nickname=nickname).first()


def upsert_test_user(nickname, role, password):
    """Crea un usuario de prueba si no existe. Si existe, no lo toca.
    Devuelve (user, created)."""
    existing = _get_user_by_nickname(nickname)
    if existing:
        return existing, False

    user = User(
        nickname=nickname,
        password_hash=generate_password_hash(password),
        role=role,
    )
    db.session.add(user)
    db.session.flush()
    db.session.add(UserStat(user_id=user.id))
    return user, True


def add_player_to_team(team, player, ingame_role, favorite_agent):
    """Agrega un player como miembro del team si no pertenece a otro y hay plaza.
    Devuelve True si lo agregó, False si lo skipeó."""
    if TeamMember.query.filter_by(user_id=player.id).first():
        return False
    occupied = TeamMember.query.filter_by(team_id=team.id, occupies_slot=True).count()
    if occupied >= MAX_TEAM_SLOTS:
        return False

    db.session.add(TeamMember(
        team_id=team.id,
        user_id=player.id,
        team_role='player',
        ingame_role=ingame_role,
        favorite_agent=favorite_agent,
        occupies_slot=True,
    ))
    return True


# ----------------------------------------------------------------------
# Steps
# ----------------------------------------------------------------------

def seed():
    nickname = os.getenv('ADMIN_NICKNAME', 'admin').strip()
    password = os.getenv('ADMIN_PASSWORD', '')
    force_reset = os.getenv('ADMIN_FORCE_RESET') == '1'

    if not password:
        print("ERROR: ADMIN_PASSWORD no definida. Exportala antes de correr este script.", file=sys.stderr)
        sys.exit(1)

    if len(password) < MIN_PASSWORD_LENGTH:
        print(f"ERROR: ADMIN_PASSWORD muy corta (mínimo {MIN_PASSWORD_LENGTH} chars).", file=sys.stderr)
        sys.exit(1)

    existing = _get_user_by_nickname(nickname)

    if existing and not force_reset:
        if existing.role != 'admin':
            print(f"WARN: usuario '{nickname}' existe con role='{existing.role}', no es admin. "
                  "Usá ADMIN_FORCE_RESET=1 para forzar promoción y reset de contraseña.")
            sys.exit(2)
        print(f"OK: admin '{nickname}' ya existe. Sin cambios.")
        return existing

    if existing and force_reset:
        existing.password_hash = generate_password_hash(password)
        existing.role = 'admin'
        db.session.commit()
        print(f"OK: admin '{nickname}' actualizado (password reset y role=admin).")
        return existing

    new_admin = User(
        nickname=nickname,
        password_hash=generate_password_hash(password),
        role='admin',
    )
    db.session.add(new_admin)
    db.session.flush()
    db.session.add(UserStat(user_id=new_admin.id))
    db.session.commit()
    print(f"OK: admin '{nickname}' creado con id={new_admin.id}.")
    return new_admin


def seed_tournament_manager(password):
    user, created = upsert_test_user('tm_carlos', 'tournament_manager', password)
    db.session.commit()
    print(f"  {'CREATED' if created else 'EXISTS '}: tournament_manager 'tm_carlos'")
    return user


def seed_coaches(password):
    coach_red, c1 = upsert_test_user('coach_red', 'coach', password)
    coach_blue, c2 = upsert_test_user('coach_blue', 'player_coach', password)
    coach_green, c3 = upsert_test_user('coach_green', 'coach', password)
    coach_yellow, c4 = upsert_test_user('coach_yellow', 'player_coach', password)
    db.session.commit()
    print(f"  {'CREATED' if c1 else 'EXISTS '}: 'coach_red'    (role=coach)")
    print(f"  {'CREATED' if c2 else 'EXISTS '}: 'coach_blue'   (role=player_coach)")
    print(f"  {'CREATED' if c3 else 'EXISTS '}: 'coach_green'  (role=coach)")
    print(f"  {'CREATED' if c4 else 'EXISTS '}: 'coach_yellow' (role=player_coach)")
    return coach_red, coach_blue, coach_green, coach_yellow


def seed_players(password, count=10):
    players = []
    created_count = 0
    for i in range(1, count + 1):
        nickname = f'player_{i:02d}'
        user, created = upsert_test_user(nickname, 'player', password)
        players.append(user)
        if created:
            created_count += 1
    db.session.commit()
    print(f"  {created_count} players creados, {count - created_count} ya existían (player_01..player_{count:02d})")
    return players


def seed_team(name, tag, region, logo, founder):
    """Crea un team con su founder como primer miembro. Si el team ya existe,
    no toca a sus miembros. Si el founder ya pertenece a otro team (regla de
    un team por usuario), salta y devuelve None."""
    existing = Team.query.filter_by(name=name).first()
    if existing:
        print(f"  EXISTS : team '{name}' [{tag}]")
        return existing

    if TeamMember.query.filter_by(user_id=founder.id).first():
        print(f"  SKIP   : founder '{founder.nickname}' ya pertenece a otro team — no se crea '{name}'")
        return None

    team = Team(name=name, tag=tag, region=region, logo=logo)
    db.session.add(team)
    db.session.flush()

    # Mismo criterio que routes/teams.py:create_team
    if founder.role == 'coach':
        team_role = 'manager'
        occupies = False
    elif founder.role == 'player_coach':
        team_role = 'player_coach'
        occupies = True
    else:
        # Defensivo: el seed solo llama esto con coach/player_coach
        team_role = 'manager'
        occupies = False

    db.session.add(TeamMember(
        team_id=team.id,
        user_id=founder.id,
        team_role=team_role,
        occupies_slot=occupies,
    ))
    print(f"  CREATED: team '{name}' [{tag}] (founder={founder.nickname}, team_role={team_role})")
    return team


def seed_team_rosters(red, blue, green, yellow, players):
    """Llena los 4 teams con players de prueba. Cada player solo se asigna
    si no pertenece ya a otro team. El team puede tener miembros desde un
    seed previo: en ese caso simplemente no agrega nada.

    Distribución (asume players ordenados player_01..player_18):
    - Red Phoenix    (coach, 0 plazas ocupadas) → players[0:5]   = player_01..05
    - Blue Wolves    (player_coach, 1 plaza)    → players[5:9]   = player_06..09
    - player[9] = player_10 queda libre (para testear join_request)
    - Green Hawks    (coach, 0 plazas ocupadas) → players[10:15] = player_11..15
    - Yellow Tigers  (player_coach, 1 plaza)    → players[15:19] = player_16..19
    """
    red_roster = [
        ('Duelist', 'Jett'),
        ('Initiator', 'Sova'),
        ('Controller', 'Omen'),
        ('Sentinel', 'Killjoy'),
        ('Duelist', 'Phoenix'),
    ]
    blue_roster = [
        # coach_blue es player_coach y ocupa 1 plaza, así que metemos 4 players
        ('Duelist', 'Raze'),
        ('Initiator', 'Skye'),
        ('Controller', 'Brimstone'),
        ('Sentinel', 'Cypher'),
    ]
    green_roster = [
        ('Duelist', 'Neon'),
        ('Initiator', 'Fade'),
        ('Controller', 'Astra'),
        ('Sentinel', 'Sage'),
        ('Duelist', 'Yoru'),
    ]
    yellow_roster = [
        # coach_yellow es player_coach y ocupa 1 plaza, así que metemos 4 players
        ('Duelist', 'Reyna'),
        ('Initiator', 'KAY/O'),
        ('Controller', 'Viper'),
        ('Sentinel', 'Chamber'),
    ]

    if red:
        for player, (igr, agent) in zip(players[:5], red_roster):
            if add_player_to_team(red, player, igr, agent):
                print(f"  + {player.nickname:<12} → Red Phoenix    ({igr}, {agent})")

    if blue:
        for player, (igr, agent) in zip(players[5:9], blue_roster):
            if add_player_to_team(blue, player, igr, agent):
                print(f"  + {player.nickname:<12} → Blue Wolves    ({igr}, {agent})")

    if green:
        for player, (igr, agent) in zip(players[10:15], green_roster):
            if add_player_to_team(green, player, igr, agent):
                print(f"  + {player.nickname:<12} → Green Hawks    ({igr}, {agent})")

    if yellow:
        for player, (igr, agent) in zip(players[15:19], yellow_roster):
            if add_player_to_team(yellow, player, igr, agent):
                print(f"  + {player.nickname:<12} → Yellow Tigers  ({igr}, {agent})")

    db.session.commit()


def seed_tournament(name='Torneo de Pruebas 2026'):
    existing = Tournament.query.filter_by(name=name).first()
    if existing:
        print(f"  EXISTS : tournament '{name}' (status={existing.status})")
        return existing

    today = date.today()
    t = Tournament(
        name=name,
        start_date=today,
        end_date=today + timedelta(days=14),
        status='upcoming',
        image='🏆',
        prize_amount=10000,
        prize_currency='EUR',
        description='Torneo amistoso para validar el flujo completo de la plataforma. Red Phoenix vs Blue Wolves a 3 mapas.',
    )
    db.session.add(t)
    db.session.commit()
    print(f"  CREATED: tournament '{name}' (upcoming, {today} → {today + timedelta(days=14)})")
    return t


def seed_bracket_tournament(teams, name='Bracket de Pruebas 2026'):
    """Crea un torneo upcoming con N teams inscritos (accepted) y SIN matches.
    Pensado para que admin/manager pueda generar el bracket desde la UI.
    Idempotente: si el torneo ya existe, no toca matches ni inscripciones.
    """
    teams = [t for t in teams if t is not None]
    if not teams:
        print("  SKIP   : no hay teams válidos para inscribir, no se crea torneo de bracket")
        return None

    existing = Tournament.query.filter_by(name=name).first()
    if existing:
        print(f"  EXISTS : tournament '{name}' (status={existing.status})")
        return existing

    today = date.today()
    t = Tournament(
        name=name,
        start_date=today,
        end_date=today + timedelta(days=7),
        status='upcoming',
        image='🥇',
        prize_amount=5000,
        prize_currency='EUR',
        description=f'Torneo listo para generar bracket de eliminación directa con {len(teams)} equipos. Probá el botón "Generar bracket" en la pestaña Bracket.',
    )
    db.session.add(t)
    db.session.flush()

    for team in teams:
        db.session.add(TournamentRegistration(
            tournament_id=t.id,
            team_id=team.id,
            status='accepted',
        ))
    db.session.commit()
    print(f"  CREATED: tournament '{name}' (upcoming, {today} → {today + timedelta(days=7)})")
    print(f"           {len(teams)} team(s) inscritos (accepted): {', '.join(tm.name for tm in teams)}")
    print(f"           SIN matches — generá el bracket desde la UI")
    return t


def seed_matches(tournament, red, blue):
    """Siembra matches scheduled/live entre los 2 teams. NO siembra finished:
    reportar resultados muta UserStat agregado y romper idempotencia al
    re-correr es trivial. El flujo de reporte se testea desde el panel admin."""
    if not tournament or not red or not blue:
        print("  SKIP   : faltan tournament/team(s), no se crean matches")
        return

    existing = Match.query.filter_by(tournament_id=tournament.id).count()
    if existing > 0:
        print(f"  EXISTS : tournament ya tiene {existing} match(es) — skip")
        return

    # Creamos las inscripciones (ambos teams accepted) antes de los matches
    # para que la UI muestre los equipos como inscritos. Idempotente.
    for team in (red, blue):
        existing_reg = TournamentRegistration.query.filter_by(
            tournament_id=tournament.id, team_id=team.id
        ).first()
        if not existing_reg:
            db.session.add(TournamentRegistration(
                tournament_id=tournament.id,
                team_id=team.id,
                status='accepted',
            ))
    db.session.commit()

    now = datetime.utcnow()
    matches_data = [
        dict(map_name='Ascent', round_name='Jornada 1', status='scheduled', match_date=now + timedelta(days=2)),
        dict(map_name='Bind',   round_name='Jornada 2', status='scheduled', match_date=now + timedelta(days=5)),
        dict(map_name='Haven',  round_name='Semifinal', status='live',      match_date=now + timedelta(hours=1)),
    ]
    for d in matches_data:
        db.session.add(Match(
            tournament_id=tournament.id,
            team1_id=red.id,
            team2_id=blue.id,
            **d,
        ))
    db.session.commit()
    print(f"  CREATED: {len(matches_data)} match(es) entre Red Phoenix y Blue Wolves")
    print(f"           (2 scheduled, 1 live — listos para testear /reportar)")
    print(f"           Inscripciones (accepted) creadas para ambos teams")


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------

def main():
    user_password = os.getenv('SEED_USER_PASSWORD', DEFAULT_USER_PASSWORD)
    if len(user_password) < MIN_PASSWORD_LENGTH:
        print(f"ERROR: SEED_USER_PASSWORD muy corta (mínimo {MIN_PASSWORD_LENGTH} chars).", file=sys.stderr)
        sys.exit(1)

    with app.app_context():
        print("=== seed: admin ===")
        seed()

        print("\n=== seed: tournament_manager ===")
        seed_tournament_manager(user_password)

        print("\n=== seed: coaches ===")
        coach_red, coach_blue, coach_green, coach_yellow = seed_coaches(user_password)

        print("\n=== seed: players ===")
        players = seed_players(user_password, count=19)

        print("\n=== seed: teams ===")
        red = seed_team('Red Phoenix',   'RPX', 'Sevilla',  '🔥', coach_red)
        blue = seed_team('Blue Wolves',  'BWV', 'Málaga',   '🐺', coach_blue)
        green = seed_team('Green Hawks', 'GHK', 'Granada',  '🦅', coach_green)
        yellow = seed_team('Yellow Tigers', 'YTG', 'Cádiz', '🐯', coach_yellow)

        print("\n=== seed: rosters ===")
        seed_team_rosters(red, blue, green, yellow, players)

        print("\n=== seed: tournament (matches sueltos) ===")
        tournament = seed_tournament()

        print("\n=== seed: matches ===")
        seed_matches(tournament, red, blue)

        print("\n=== seed: tournament (bracket-ready) ===")
        seed_bracket_tournament([red, blue, green, yellow])

        print("\n=== resumen de credenciales ===")
        print(f"  admin         password=ADMIN_PASSWORD (env)")
        print(f"  resto         password='{user_password}' (override con SEED_USER_PASSWORD)")
        print(f"  --")
        print(f"  tm_carlos     role=tournament_manager")
        print(f"  coach_red     role=coach          (founder Red Phoenix)")
        print(f"  coach_blue    role=player_coach   (founder Blue Wolves, ocupa plaza)")
        print(f"  coach_green   role=coach          (founder Green Hawks)")
        print(f"  coach_yellow  role=player_coach   (founder Yellow Tigers, ocupa plaza)")
        print(f"  player_01..05 → Red Phoenix")
        print(f"  player_06..09 → Blue Wolves")
        print(f"  player_10     → libre (para testear flujo de join_request)")
        print(f"  player_11..15 → Green Hawks")
        print(f"  player_16..19 → Yellow Tigers")


if __name__ == '__main__':
    main()
