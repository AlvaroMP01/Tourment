-- Migración: soporte de brackets de eliminación directa.
-- Aplicar a una DB existente (que ya fue creada con schema.sql original).
-- Idempotente NO — correr UNA sola vez. Si ya tienes errores de "duplicate column",
-- significa que ya se aplicó.
--
-- Cómo correr:
--   podman exec -i mysql mysql -u torneos_user -ptorneos_pass torneos_db < backend/migrations/0001_bracket_support.sql

USE torneos_db;

-- 1) Tournament: tamaño del bracket si se generó
ALTER TABLE tournaments
    ADD COLUMN bracket_size INT DEFAULT NULL AFTER description;

-- 2) Match: aflojar NOT NULL en team1_id/team2_id
--    (los slots de rondas posteriores arrancan vacíos hasta que avance un ganador)
ALTER TABLE matches
    MODIFY COLUMN team1_id INT NULL,
    MODIFY COLUMN team2_id INT NULL;

-- 3) Match: campos de bracket
ALTER TABLE matches
    ADD COLUMN bracket_round    INT DEFAULT NULL AFTER match_date,
    ADD COLUMN bracket_position INT DEFAULT NULL AFTER bracket_round,
    ADD COLUMN next_match_id    INT DEFAULT NULL AFTER bracket_position,
    ADD COLUMN next_match_slot  ENUM('team1', 'team2') DEFAULT NULL AFTER next_match_id;

-- 4) FK del next_match_id (auto-referencia a matches.id)
ALTER TABLE matches
    ADD CONSTRAINT fk_matches_next_match
    FOREIGN KEY (next_match_id) REFERENCES matches(id) ON DELETE SET NULL;
