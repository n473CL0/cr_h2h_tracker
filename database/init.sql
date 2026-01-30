-- 1. Users Table
-- Stores the local account linked to a Clash Royale player tag
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    player_tag VARCHAR(15) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Friendships Table
-- Stores the bidirectional link between two players
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id_1 INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_friendship UNIQUE(user_id_1, user_id_2),
    CONSTRAINT no_self_friending CHECK (user_id_1 != user_id_2)
);

-- 3. Matches Table
-- Stores the historical record of specific battles
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    battle_id VARCHAR(50) UNIQUE NOT NULL, -- From CR API 'battleTime' + 'tag' hash
    player_1_tag VARCHAR(15) NOT NULL,
    player_2_tag VARCHAR(15) NOT NULL,
    winner_tag VARCHAR(15),
    battle_time TIMESTAMP WITH TIME ZONE NOT NULL,
    game_mode VARCHAR(50),
    crowns_1 INTEGER DEFAULT 0,
    crowns_2 INTEGER DEFAULT 0
);

-- 4. Performance Indexes (Optimized)
-- Composite index for match lookup when searching by P1
CREATE INDEX IF NOT EXISTS idx_matches_player_1 ON matches(player_1_tag, player_2_tag);

-- Index for match lookup when searching by P2 (Critical for "all my matches")
CREATE INDEX IF NOT EXISTS idx_matches_player_2 ON matches(player_2_tag);

-- Index for sorting matches by time (Critical for "Recent Matches" feeds)
CREATE INDEX IF NOT EXISTS idx_matches_time ON matches(battle_time DESC);

-- Index for reverse friendship lookups (Who added me?)
CREATE INDEX IF NOT EXISTS idx_friendships_user_2 ON friendships(user_id_2);


-- ========================================================
-- 5. Auth & Viral Features (Added Updates)
-- ========================================================

-- Update Users: Support Auth & Verified Status
-- Make player_tag nullable so users can sign up before linking CR account
ALTER TABLE users ALTER COLUMN player_tag DROP NOT NULL;

-- Add standard auth columns
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- Create Invites Table
-- Manages tokens for viral growth and friend linking
CREATE TABLE IF NOT EXISTS invites (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);

-- Strict Match Constraints
-- Matches are only saved if BOTH players are registered users
ALTER TABLE matches 
    ADD CONSTRAINT fk_matches_player_1 
    FOREIGN KEY (player_1_tag) 
    REFERENCES users(player_tag) 
    ON UPDATE CASCADE;

ALTER TABLE matches 
    ADD CONSTRAINT fk_matches_player_2 
    FOREIGN KEY (player_2_tag) 
    REFERENCES users(player_tag) 
    ON UPDATE CASCADE;