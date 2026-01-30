from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional, List

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

class UserSignup(BaseModel):
    username: str
    password: str
    email: Optional[EmailStr] = None
    invite_token: Optional[str] = None  # Optional invite code

class UserLogin(BaseModel):
    username: str
    password: str

# --- User Operations ---
class LinkTagRequest(BaseModel):
    player_tag: str

class UserResponse(BaseModel):
    id: int
    username: str
    player_tag: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Match Schemas (Unchanged) ---
class MatchResponse(BaseModel):
    battle_id: str
    player_1_tag: str
    player_2_tag: str
    winner_tag: Optional[str] = None
    battle_time: datetime
    game_mode: str
    crowns_1: int
    crowns_2: int

    model_config = ConfigDict(from_attributes=True)