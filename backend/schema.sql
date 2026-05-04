-- Esquema de Base de Datos para Gestión de Torneos de Videojuegos
-- Basado en las entidades y relaciones descritas en Memoria.md

CREATE DATABASE IF NOT EXISTS torneos_db;
USE torneos_db;

-- 1. Usuarios y Perfiles (Admin Panel, Auth, Profile)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'tournament_manager', 'player', 'coach', 'player_coach') DEFAULT 'player', -- role único del usuario
    avatar VARCHAR(255), -- Emoji o URL
    custom_name VARCHAR(100),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Estadísticas de Usuarios (agregado denormalizado, NO se edita a mano)
-- Counters sumables + promedios ponderados por matches_played.
-- Source of truth: tabla match_player_stats.
CREATE TABLE IF NOT EXISTS user_stats (
    user_id INT PRIMARY KEY,
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    assists INT DEFAULT 0,
    clutches INT DEFAULT 0,
    adr DECIMAL(5,2) DEFAULT 0.00,
    hs_percentage DECIMAL(5,2) DEFAULT 0.00,
    matches_played INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Equipos (Gestión de Equipos, AdminTeams)
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tag VARCHAR(10) NOT NULL,
    logo VARCHAR(255), -- URL o Emoji
    region VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Miembros del Equipo (Roster, Límite 7 jugadores, Roles Internos)
CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    team_role ENUM('player', 'coach', 'player_coach', 'manager') DEFAULT 'player', -- Roles dentro del equipo
    ingame_role VARCHAR(50), -- Ej. Duelist, Sentinel
    favorite_agent VARCHAR(50), -- Ej. Omen, Jett
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    occupies_slot BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(team_id, user_id) -- Un usuario no puede estar dos veces en el mismo equipo
);

-- 5. Solicitudes de Reclutamiento (Agencia Libre)
CREATE TABLE IF NOT EXISTS join_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    ingame_role VARCHAR(50),
    favorite_agent VARCHAR(50),
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Torneos (EventCalendar)
CREATE TABLE IF NOT EXISTS tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('upcoming', 'live', 'finished') DEFAULT 'upcoming',
    image VARCHAR(255), -- emoji o path interno (/uploads/...)
    prize_amount DECIMAL(10,2) DEFAULT NULL, -- monto del premio. NULL si no hay premio.
    prize_currency CHAR(3) DEFAULT NULL, -- ISO 4217. Solo 'EUR' permitido en API por ahora.
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Historial de Partidas (Matches)
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT, -- Puede ser NULL si es un amistoso
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    score_team1 INT DEFAULT 0,
    score_team2 INT DEFAULT 0,
    map_name VARCHAR(50),
    round_name VARCHAR(50), -- Ej. "Semifinal", "Jornada 1"
    status ENUM('scheduled', 'live', 'finished') DEFAULT 'scheduled',
    match_date DATETIME,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
    FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 7b. Stats por jugador-en-partida (source of truth de las estadísticas)
CREATE TABLE IF NOT EXISTS match_player_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    user_id INT NOT NULL,
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    assists INT DEFAULT 0,
    adr DECIMAL(5,2) DEFAULT 0.00,
    hs_percentage DECIMAL(5,2) DEFAULT 0.00,
    clutches INT DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(match_id, user_id)
);

-- 8. Insignias / Logros de Usuario (Profile Badges)
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INT NOT NULL,
    badge_name VARCHAR(100) NOT NULL, -- Ej. 'Tiene Equipo', 'Líder', 'Clutch Master'
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Para importar el sql 
-- podman exec -i mysql mysql -u torneos_user -ptorneos_pass torneos_db < backend/schema.sql