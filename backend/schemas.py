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