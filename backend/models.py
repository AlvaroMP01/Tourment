from datetime import datetime
from extensions import db

from datetime import datetime
from extensions import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(50), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # role único del usuario (unifica system_role + starting_role)
    # admin: control total
    # tournament_manager: gestiona torneos, no equipos (según reglas actuales)
    # player: puede unirse a 1 equipo, ocupa plaza
    # coach: crea 1 equipo, es coach, no ocupa plaza, no puede unirse a otros
    # player_coach: crea 1 equipo, es coach y jugador, ocupa plaza, no puede unirse a otros
    role = db.Column(db.Enum('admin', 'tournament_manager', 'player', 'coach', 'player_coach'), default='player')

    custom_name = db.Column(db.String(100))
    bio = db.Column(db.Text)
    avatar = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    stats = db.relationship('UserStat', backref='user', uselist=False, cascade="all, delete-orphan")
    team_memberships = db.relationship('TeamMember', backref='user', cascade="all, delete-orphan")
    achievements = db.relationship('UserAchievement', backref='user', cascade="all, delete-orphan")

class UserStat(db.Model):
    __tablename__ = 'user_stats'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    # Sumables (deltas por match)
    kills = db.Column(db.Integer, default=0)
    deaths = db.Column(db.Integer, default=0)
    assists = db.Column(db.Integer, default=0)
    clutches = db.Column(db.Integer, default=0)
    # Promedios ponderados por matches_played
    adr = db.Column(db.Numeric(5, 2), default=0.00)
    hs_percentage = db.Column(db.Numeric(5, 2), default=0.00)
    matches_played = db.Column(db.Integer, default=0)

class Team(db.Model):
    __tablename__ = 'teams'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    tag = db.Column(db.String(10), nullable=False)
    logo = db.Column(db.String(255))
    region = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    members = db.relationship('TeamMember', backref='team', cascade="all, delete-orphan")
    matches_as_team1 = db.relationship('Match', foreign_keys='Match.team1_id', backref='team1', cascade="all, delete-orphan")
    matches_as_team2 = db.relationship('Match', foreign_keys='Match.team2_id', backref='team2', cascade="all, delete-orphan")

class TeamMember(db.Model):
    __tablename__ = 'team_members'
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Roles dentro del equipo
    # manager: el creador
    # player: jugador
    # coach: entrenador
    # player_coach: ambos
    team_role = db.Column(db.Enum('manager', 'player', 'coach', 'player_coach'), default='player')
    
    ingame_role = db.Column(db.String(50))
    favorite_agent = db.Column(db.String(50))
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Optimización para conteo de plazas ocupadas
    occupies_slot = db.Column(db.Boolean, default=True)

    # Unique constraint: a user can only be in a team once
    __table_args__ = (db.UniqueConstraint('team_id', 'user_id', name='_team_user_uc'),)

class JoinRequest(db.Model):
    __tablename__ = 'join_requests'
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    ingame_role = db.Column(db.String(50))
    favorite_agent = db.Column(db.String(50))
    status = db.Column(db.Enum('pending', 'accepted', 'rejected'), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
    team = db.relationship('Team', foreign_keys=[team_id])

class Tournament(db.Model):
    __tablename__ = 'tournaments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('upcoming', 'live', 'finished'), default='upcoming')
    image = db.Column(db.String(255))     # URL o emoji
    prize = db.Column(db.String(100))     # string libre
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    matches = db.relationship('Match', backref='tournament', cascade="all, delete-orphan")

class Match(db.Model):
    __tablename__ = 'matches'
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id', ondelete='SET NULL'))
    team1_id = db.Column(db.Integer, db.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False)
    team2_id = db.Column(db.Integer, db.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False)
    score_team1 = db.Column(db.Integer, default=0)
    score_team2 = db.Column(db.Integer, default=0)
    map_name = db.Column(db.String(50))
    round_name = db.Column(db.String(50))
    status = db.Column(db.Enum('scheduled', 'live', 'finished'), default='scheduled')
    match_date = db.Column(db.DateTime)

    player_stats = db.relationship('MatchPlayerStat', backref='match', cascade="all, delete-orphan")


class MatchPlayerStat(db.Model):
    """Stats de un jugador en una partida concreta. Source of truth.
    UserStat es el agregado denormalizado que se actualiza desde acá."""
    __tablename__ = 'match_player_stats'
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    kills = db.Column(db.Integer, default=0)
    deaths = db.Column(db.Integer, default=0)
    assists = db.Column(db.Integer, default=0)
    adr = db.Column(db.Numeric(5, 2), default=0.00)
    hs_percentage = db.Column(db.Numeric(5, 2), default=0.00)
    clutches = db.Column(db.Integer, default=0)

    __table_args__ = (db.UniqueConstraint('match_id', 'user_id', name='_match_user_stat_uc'),)

class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    badge_name = db.Column(db.String(100), primary_key=True)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

