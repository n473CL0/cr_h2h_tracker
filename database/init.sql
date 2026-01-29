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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_tags ON matches(player_1_tag, player_2_tag);
CREATE INDEX IF NOT EXISTS idx_users_tag ON users(player_tag);

-- Initial Mock Data (Optional)
-- INSERT INTO users (username, player_tag) VALUES ('PlayerOne', '#P990V0');