from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Auth ---
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    invite_token: str 
    player_tag: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- User Creation (Internal/CRUD) ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    player_tag: Optional[str] = None

# --- Password Reset ---
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# --- User & Profile ---
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    player_tag: Optional[str] = None
    trophies: int = 0
    clan_name: Optional[str] = None
    onboarding_completed: bool = False
    
    # NEW: Social Context
    friendship_status: Optional[str] = "none" # 'self', 'friend', 'pending', 'none'
    
    class Config:
        from_attributes = True

class LinkTagRequest(BaseModel):
    player_tag: str

# --- Invites ---
class InviteCreate(BaseModel):
    target_tag: Optional[str] = None

class InviteResponse(BaseModel):
    token: str
    target_tag: Optional[str] = None
    creator_username: str

# --- Match/Stats ---
class MatchResponse(BaseModel):
    battle_id: str
    player_1_tag: str
    player_2_tag: str
    winner_tag: Optional[str]
    battle_time: datetime
    game_mode: str
    crowns_1: int
    crowns_2: int

    class Config:
        from_attributes = True

# --- New Stats Schemas ---
class LeaderboardEntry(BaseModel):
    username: str
    player_tag: str
    win_rate: float
    total_matches: int

class LeaderboardResponse(BaseModel):
    domination: List[LeaderboardEntry] # > 60%
    rivals: List[LeaderboardEntry]     # 40-60% or 0 matches
    nemesis: List[LeaderboardEntry]    # < 40%

class H2HStatsResponse(BaseModel):
    friend_username: str
    total_matches: int
    win_rate: float
    total_crowns_user: int
    total_crowns_friend: int
    streak: str  # e.g., "3 Wins", "1 Loss"
    last_5_results: List[str] # ["W", "L", "W", "D", "L"]

# --- Feedback ---
class FeedbackCreate(BaseModel):
    feedback_type: str
    title: str
    description: str

class FeedbackResponse(FeedbackCreate):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True