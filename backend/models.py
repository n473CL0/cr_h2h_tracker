from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.sql import func
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    player_tag = Column(String(15), unique=True, index=True) # Tag like #ABC1234
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    trophies = Column(Integer, default=0)
    clan_name = Column(String(100), nullable=True)
    
    # NEW: Onboarding tracking
    onboarding_completed = Column(Boolean, default=False, nullable=False)

    invites = relationship("Invite", back_populates="creator")

class Invite(Base):
    __tablename__ = "invites"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    target_tag = Column(String(15), nullable=True) # Optional: Invite specific player
    max_uses = Column(Integer, default=1)
    used_count = Column(Integer, default=0)

    creator = relationship("User", back_populates="invites")

class Friendship(Base):
    __tablename__ = "friendships"
    id = Column(Integer, primary_key=True, index=True)
    user_id_1 = Column(Integer, ForeignKey("users.id"))
    user_id_2 = Column(Integer, ForeignKey("users.id"))

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(String(50), unique=True, index=True)
    
    player_1_tag = Column(String(15), index=True)
    player_2_tag = Column(String(15), index=True)
    
    winner_tag = Column(String(15), nullable=True)
    battle_time = Column(DateTime, nullable=False)
    game_mode = Column(String(50))
    crowns_1 = Column(Integer, default=0)
    crowns_2 = Column(Integer, default=0)

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    feedback_type = Column(String(50), nullable=False) # 'bug', 'feature', 'other'
    title = Column(String(100), nullable=False)
    description = Column(String(1000), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())