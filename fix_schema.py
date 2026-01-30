import os

# --- 1. Correct content for backend/models.py ---
MODELS_PY = """from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, Index, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    player_tag = Column(String(15), unique=True, nullable=True, index=True)
    
    # Auth Fields
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    # Relationships
    invites_created = relationship("Invite", back_populates="creator")

class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    max_uses = Column(Integer, default=1)
    used_count = Column(Integer, default=0)

    creator = relationship("User", back_populates="invites_created")

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user_id_1 = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    user_id_2 = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id_1', 'user_id_2', name='unique_friendship'),
        CheckConstraint('user_id_1 != user_id_2', name='no_self_friending'),
        Index('idx_friendships_user_2', 'user_id_2'),
    )

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(String(50), unique=True, nullable=False)
    
    player_1_tag = Column(String(15), ForeignKey("users.player_tag"), nullable=False)
    player_2_tag = Column(String(15), ForeignKey("users.player_tag"), nullable=False)
    
    winner_tag = Column(String(15))
    battle_time = Column(DateTime(timezone=True), nullable=False)
    game_mode = Column(String(50))
    crowns_1 = Column(Integer, default=0)
    crowns_2 = Column(Integer, default=0)

    __table_args__ = (
        Index('idx_matches_player_1', 'player_1_tag', 'player_2_tag'),
        Index('idx_matches_player_2', 'player_2_tag'),
        Index('idx_matches_time', 'battle_time'),
    )
"""

# --- 2. Correct content for database/init.sql ---
INIT_SQL = """CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    player_tag VARCHAR(15) UNIQUE,
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invites (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id_1 INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_friendship UNIQUE (user_id_1, user_id_2),
    CONSTRAINT no_self_friending CHECK (user_id_1 != user_id_2)
);

CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    battle_id VARCHAR(50) NOT NULL UNIQUE,
    player_1_tag VARCHAR(15) NOT NULL REFERENCES users(player_tag),
    player_2_tag VARCHAR(15) NOT NULL REFERENCES users(player_tag),
    winner_tag VARCHAR(15),
    battle_time TIMESTAMP WITH TIME ZONE NOT NULL,
    game_mode VARCHAR(50),
    crowns_1 INTEGER DEFAULT 0,
    crowns_2 INTEGER DEFAULT 0
);
"""

def update_file(path, content):
    if os.path.exists(path):
        print(f"✅ Updating {path}...")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
    else:
        print(f"⚠️  Warning: {path} not found. Skipping.")

if __name__ == "__main__":
    print("🚀 Applying Schema Fixes...")
    update_file("backend/models.py", MODELS_PY)
    update_file("database/init.sql", INIT_SQL)
    print("\n✅ Files updated.")
    print("\nIMPORTANT: Run these commands now to reset your DB:")
    print("  1. docker-compose down -v")
    print("  2. docker-compose up -d --build")