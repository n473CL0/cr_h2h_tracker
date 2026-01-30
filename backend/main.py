import os
import hashlib
import requests
import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from passlib.context import CryptContext
from jose import JWTError, jwt

import models, schemas, database

# --- Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 Days
CR_API_KEY = os.getenv("CR_API_KEY")
API_BASE = "https://api.clashroyale.com/v1"

# --- Setup ---
models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="ClashFriends API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- Helpers ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    # FIX: Use timezone-aware UTC
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Dependencies ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def generate_battle_id(battle_time: str, p1_tag: str, p2_tag: str) -> str:
    # Consistent ID generation
    t1 = p1_tag.replace("#", "").upper()
    t2 = p2_tag.replace("#", "").upper()
    tags = sorted([t1, t2])
    raw_string = f"{battle_time}-{tags[0]}-{tags[1]}"
    return hashlib.md5(raw_string.encode()).hexdigest()

# --- Background Sync Logic ---
async def run_sync_cycle(db: Session):
    """
    Fetches battles for ALL linked users.
    Only saves if BOTH players are in our DB.
    """
    users_with_tags = db.query(models.User).filter(models.User.player_tag.isnot(None)).all()
    if not users_with_tags:
        return
        
    registered_tags = {u.player_tag for u in users_with_tags}
    headers = {"Authorization": f"Bearer {CR_API_KEY}"}
    
    for user in users_with_tags:
        clean_tag = user.player_tag.replace("#", "%23")
        url = f"{API_BASE}/players/{clean_tag}/battlelog"
        
        try:
            response = await asyncio.to_thread(requests.get, url, headers=headers)
            if response.status_code != 200:
                continue
            
            battles = response.json()
            
            for b in battles:
                try:
                    p1_tag = b["team"][0]["tag"]
                    p2_tag = b["opponent"][0]["tag"]
                    
                    if p1_tag not in registered_tags or p2_tag not in registered_tags:
                        continue
                    
                    battle_time_str = b["battleTime"]
                    battle_id = generate_battle_id(battle_time_str, p1_tag, p2_tag)
                    
                    if db.query(models.Match).filter(models.Match.battle_id == battle_id).first():
                        continue

                    crowns_1 = b["team"][0]["crowns"]
                    crowns_2 = b["opponent"][0]["crowns"]
                    winner = None
                    if crowns_1 > crowns_2: winner = p1_tag
                    elif crowns_2 > crowns_1: winner = p2_tag
                    
                    match_record = models.Match(
                        battle_id=battle_id,
                        player_1_tag=p1_tag,
                        player_2_tag=p2_tag,
                        winner_tag=winner,
                        # FIX: Make parsed time timezone-aware
                        battle_time=datetime.strptime(battle_time_str, "%Y%m%dT%H%M%S.%fZ").replace(tzinfo=timezone.utc),
                        game_mode=b.get("type", "Unknown"),
                        crowns_1=crowns_1,
                        crowns_2=crowns_2
                    )
                    db.add(match_record)
                except (KeyError, IndexError):
                    continue
            db.commit()
            
        except Exception as e:
            print(f"Sync Error for {user.username}: {e}")
            db.rollback()

@app.on_event("startup")
async def start_periodic_sync():
    async def loop():
        while True:
            print("🔄 Starting Background Sync...")
            db = database.SessionLocal()
            try:
                await run_sync_cycle(db)
            finally:
                db.close()
            print("✅ Sync Complete. Sleeping 10 mins.")
            await asyncio.sleep(600) 
            
    asyncio.create_task(loop())

# --- Auth Endpoints ---

@app.post("/auth/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserSignup, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_pw = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 3. Handle Invites (Viral Flow)
    if user.invite_token:
        invite = db.query(models.Invite).filter(models.Invite.token == user.invite_token).first()
        # FIX: Compare with aware datetime
        if invite and (invite.expires_at is None or invite.expires_at > datetime.now(timezone.utc)):
            uid1, uid2 = sorted([new_user.id, invite.creator_id])
            if uid1 != uid2:
                friendship = models.Friendship(user_id_1=uid1, user_id_2=uid2)
                db.add(friendship)
                invite.used_count += 1
                db.commit()

    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Invite Endpoint ---

@app.post("/invites/")
def create_invite(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    import secrets
    token = secrets.token_urlsafe(8)
    # FIX: Use timezone-aware UTC
    invite = models.Invite(
        token=token, 
        creator_id=current_user.id, 
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    )
    db.add(invite)
    db.commit()
    return {"token": token, "expires_at": invite.expires_at}

# --- User Endpoints ---

@app.put("/users/link-tag", response_model=schemas.UserResponse)
def link_player_tag(
    req: schemas.LinkTagRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    formatted_tag = req.player_tag.upper()
    if not formatted_tag.startswith("#"):
        formatted_tag = f"#{formatted_tag}"
        
    existing = db.query(models.User).filter(models.User.player_tag == formatted_tag).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Tag already linked to another user")

    clean_tag = formatted_tag.replace("#", "%23")
    resp = requests.get(f"{API_BASE}/players/{clean_tag}", headers={"Authorization": f"Bearer {CR_API_KEY}"})
    if resp.status_code != 200:
        raise HTTPException(status_code=404, detail="Invalid Clash Royale Tag")

    current_user.player_tag = formatted_tag
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- Friends & Matches (Protected) ---

@app.get("/matches", response_model=List[schemas.MatchResponse])
def get_my_matches(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.player_tag:
        return []
    
    return db.query(models.Match).filter(
        or_(
            models.Match.player_1_tag == current_user.player_tag,
            models.Match.player_2_tag == current_user.player_tag
        )
    ).order_by(models.Match.battle_time.desc()).limit(50).all()

@app.post("/friends/add")
def add_friend_by_tag(
    tag: schemas.LinkTagRequest, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_tag = tag.player_tag.upper() if tag.player_tag.startswith("#") else f"#{tag.player_tag.upper()}"
    
    friend = db.query(models.User).filter(models.User.player_tag == target_tag).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User with this tag not found on ClashFriends")
        
    if friend.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
        
    uid1, uid2 = sorted([current_user.id, friend.id])
    
    if db.query(models.Friendship).filter_by(user_id_1=uid1, user_id_2=uid2).first():
        return {"status": "already_friends"}
        
    new_friendship = models.Friendship(user_id_1=uid1, user_id_2=uid2)
    db.add(new_friendship)
    db.commit()
    return {"status": "success", "friend_username": friend.username}