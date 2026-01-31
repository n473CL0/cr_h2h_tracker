import os
import hashlib
import requests
import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Body, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

import models, schemas, database

# --- Configuration & Secrets Management ---
def get_env_variable(var_name: str, default: str = None, required: bool = False):
    value = os.getenv(var_name, default)
    if required and not value:
        raise ValueError(f"CRITICAL: Environment variable {var_name} is missing.")
    return value

SECRET_KEY = get_env_variable("SECRET_KEY", "dev_unsafe_secret", required=False)
CR_API_KEY = get_env_variable("CR_API_KEY", required=False) # Warning: Sync won't work without this
FRONTEND_URL = get_env_variable("FRONTEND_URL", "http://localhost:3000")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 
API_BASE = "https://api.clashroyale.com/v1"

# Mail Configuration
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "no_mail_configured"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM = os.getenv("MAIL_FROM", "noreply@clashfriends.com"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="ClashFriends API")

# --- Security: CORS ---
# Only allow requests from the specific Frontend URL (and localhost for dev)
origins = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- Helpers ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_reset_token(email: str):
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": email, "type": "reset", "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def fetch_cr_player(tag: str):
    if not CR_API_KEY:
        print("⚠️ CR_API_KEY missing. Cannot fetch player data.")
        return None
        
    clean_tag = tag.replace("#", "%23")
    try:
        resp = requests.get(f"{API_BASE}/players/{clean_tag}", headers={"Authorization": f"Bearer {CR_API_KEY}"})
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"CR API Error: {e}")
    return None

def generate_battle_id(battle_time: str, p1_tag: str, p2_tag: str) -> str:
    t1 = p1_tag.replace("#", "").upper()
    t2 = p2_tag.replace("#", "").upper()
    tags = sorted([t1, t2])
    raw_string = f"{battle_time}-{tags[0]}-{tags[1]}"
    return hashlib.md5(raw_string.encode()).hexdigest()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- Core Sync Logic (Production Optimized) ---

async def sync_matches_for_user(db: Session, user: models.User, registered_tags: set):
    if not user.player_tag or not CR_API_KEY:
        return False

    headers = {"Authorization": f"Bearer {CR_API_KEY}"}
    clean_tag = user.player_tag.replace("#", "%23")
    url = f"{API_BASE}/players/{clean_tag}/battlelog"
    
    try:
        response = await asyncio.to_thread(requests.get, url, headers=headers, timeout=10)
        
        if response.status_code == 429:
            print(f"⚠️ Rate Limit Hit for {user.username}. Skipping.")
            return False

        if response.status_code != 200:
            return False
        
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
                
                b_time = datetime.strptime(battle_time_str, "%Y%m%dT%H%M%S.%fZ").replace(tzinfo=timezone.utc)
                
                match_record = models.Match(
                    battle_id=battle_id,
                    player_1_tag=p1_tag,
                    player_2_tag=p2_tag,
                    winner_tag=winner,
                    battle_time=b_time,
                    game_mode=b.get("type", "Unknown"),
                    crowns_1=crowns_1,
                    crowns_2=crowns_2
                )
                db.add(match_record)
            except (KeyError, IndexError):
                continue
        
        db.commit()
        return True
            
    except Exception as e:
        print(f"Error syncing {user.username}: {e}")
        db.rollback()
        return False

async def run_sync_cycle(db: Session):
    users_with_tags = db.query(models.User).filter(models.User.player_tag.isnot(None)).all()
    if not users_with_tags:
        return
        
    registered_tags = {u.player_tag for u in users_with_tags}
    print(f"🔄 Starting Batch Sync for {len(users_with_tags)} users...")
    
    for user in users_with_tags:
        try:
            await sync_matches_for_user(db, user, registered_tags)
        except Exception as e:
            print(f"Critical failure for user {user.player_tag}: {e}")
        
        # Throttling to respect API Limits
        await asyncio.sleep(0.5)

@app.on_event("startup")
async def start_periodic_sync():
    async def loop():
        await asyncio.sleep(5) # Grace period
        while True:
            print("🔄 Starting Background Sync...")
            db = database.SessionLocal()
            try:
                await run_sync_cycle(db)
            except Exception as e:
                print(f"Background Sync Fatal Error: {e}")
            finally:
                db.close()
            print("✅ Sync Complete. Sleeping 30 mins.")
            await asyncio.sleep(1800) 
            
    asyncio.create_task(loop())

# --- Auth Endpoints ---

@app.post("/auth/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserSignup, db: Session = Depends(get_db)):
    if not user.invite_token:
        raise HTTPException(status_code=403, detail="Registration is invite-only.")

    invite = db.query(models.Invite).filter(models.Invite.token == user.invite_token).first()
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid invite token.")

    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    cr_username = "New User"
    formatted_tag = None
    trophies = 0
    clan_name = None
    
    if user.player_tag:
        formatted_tag = user.player_tag.upper()
        if not formatted_tag.startswith("#"):
            formatted_tag = f"#{formatted_tag}"
            
        if db.query(models.User).filter(models.User.player_tag == formatted_tag).first():
            raise HTTPException(status_code=400, detail="This Player Tag is already linked to another account")
            
        cr_data = fetch_cr_player(formatted_tag)
        if cr_data:
            cr_username = cr_data.get("name", "New User")
            trophies = cr_data.get("trophies", 0)
            clan_name = cr_data.get("clan", {}).get("name")

    hashed_pw = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        username=cr_username,
        player_tag=formatted_tag,
        trophies=trophies,
        clan_name=clan_name,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    uid1, uid2 = sorted([new_user.id, invite.creator_id])
    if uid1 != uid2:
        if not db.query(models.Friendship).filter_by(user_id_1=uid1, user_id_2=uid2).first():
            friendship = models.Friendship(user_id_1=uid1, user_id_2=uid2)
            db.add(friendship)
            invite.used_count += 1
            db.commit()

    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/forgot-password")
async def forgot_password(
    req: schemas.PasswordResetRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        return {"message": "If this email is registered, a reset link has been sent."}
    
    reset_token = create_reset_token(req.email)
    
    # SECURITY: Use the environment variable, do not assume localhost
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    message = MessageSchema(
        subject="ClashFriends Password Reset",
        recipients=[req.email],
        body=f"""
        <p>Hello {user.username},</p>
        <p>Click below to reset your password:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>Link expires in 15 minutes.</p>
        """,
        subtype=MessageType.html
    )

    try:
        fm = FastMail(conf)
        background_tasks.add_task(fm.send_message, message)
    except Exception as e:
        print(f"Mail Error: {e}")
    
    return {"message": "If this email is registered, a reset link has been sent."}

@app.post("/auth/reset-password")
def reset_password(req: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        token_type = payload.get("type")
        
        if not email or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
            
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

# --- Sync Endpoint (With Cooldown) ---

manual_sync_cooldowns = {}

@app.post("/sync/{player_tag}")
async def manual_sync_battles(player_tag: str, db: Session = Depends(get_db)):
    formatted_tag = player_tag.upper()
    if not formatted_tag.startswith("#"):
        formatted_tag = f"#{formatted_tag}"
        
    last_sync = manual_sync_cooldowns.get(formatted_tag)
    if last_sync and datetime.now() - last_sync < timedelta(minutes=2):
        raise HTTPException(status_code=429, detail="Please wait 2 minutes before syncing again.")

    user = db.query(models.User).filter(models.User.player_tag == formatted_tag).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    manual_sync_cooldowns[formatted_tag] = datetime.now()
        
    cr_data = fetch_cr_player(formatted_tag)
    if cr_data:
        user.username = cr_data.get("name", user.username)
        user.trophies = cr_data.get("trophies", user.trophies)
        user.clan_name = cr_data.get("clan", {}).get("name")
        db.commit()

    all_users = db.query(models.User).filter(models.User.player_tag.isnot(None)).all()
    registered_tags = {u.player_tag for u in all_users}
    
    await sync_matches_for_user(db, user, registered_tags)
    return {"status": "success"}

# --- Invites & Search Endpoints ---

@app.get("/invites/{tag_or_token}", response_model=schemas.InviteResponse)
def get_invite_details(tag_or_token: str, db: Session = Depends(get_db)):
    invite = db.query(models.Invite).filter(models.Invite.token == tag_or_token).first()
    
    if not invite:
        formatted = tag_or_token.upper()
        if not formatted.startswith("#"): 
            formatted = f"#{formatted}"
        invite = db.query(models.Invite).filter(models.Invite.target_tag == formatted).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    return {
        "token": invite.token,
        "target_tag": invite.target_tag,
        "creator_username": invite.creator.username
    }

@app.post("/invites/", response_model=schemas.InviteResponse)
def create_invite(
    req: schemas.InviteCreate,
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    import secrets
    target_tag = None
    if req.target_tag:
        target_tag = req.target_tag.upper()
        if not target_tag.startswith("#"): target_tag = f"#{target_tag}"
        existing = db.query(models.Invite).filter_by(creator_id=current_user.id, target_tag=target_tag).first()
        if existing:
             return {"token": existing.token, "target_tag": existing.target_tag, "creator_username": current_user.username}
    
    token = secrets.token_urlsafe(8)
    invite = models.Invite(token=token, creator_id=current_user.id, target_tag=target_tag)
    db.add(invite)
    db.commit()
    return {"token": token, "target_tag": target_tag, "creator_username": current_user.username}

@app.get("/search/player")
def search_player(
    query: str, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = query.strip().upper()
    tag = query if query.startswith("#") else f"#{query}"

    found_user = db.query(models.User).filter(models.User.player_tag == tag).first()
    if found_user:
        uid1, uid2 = sorted([current_user.id, found_user.id])
        is_friend = db.query(models.Friendship).filter_by(user_id_1=uid1, user_id_2=uid2).first()
        return {
            "status": "friend" if is_friend else "user_found",
            "user": found_user,
            "can_invite": False
        }

    cr_data = fetch_cr_player(tag)
    if cr_data:
        return {"status": "api_found", "tag": tag, "name": cr_data.get("name"), "can_invite": True}

    return {"status": "not_found", "can_invite": False}

@app.put("/users/link-tag", response_model=schemas.UserResponse)
def link_player_tag(
    req: schemas.LinkTagRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    formatted_tag = req.player_tag.upper()
    if not formatted_tag.startswith("#"): formatted_tag = f"#{formatted_tag}"
        
    existing = db.query(models.User).filter(models.User.player_tag == formatted_tag).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Tag already linked to another user")

    cr_data = fetch_cr_player(formatted_tag)
    if not cr_data:
        raise HTTPException(status_code=404, detail="Invalid Clash Royale Tag")

    current_user.player_tag = formatted_tag
    current_user.username = cr_data.get("name", current_user.username)
    current_user.trophies = cr_data.get("trophies", 0)
    current_user.clan_name = cr_data.get("clan", {}).get("name")
    
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/matches", response_model=List[schemas.MatchResponse])
def get_my_matches(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.player_tag: return []
    return db.query(models.Match).filter(
        or_(models.Match.player_1_tag == current_user.player_tag, models.Match.player_2_tag == current_user.player_tag)
    ).order_by(models.Match.battle_time.desc()).limit(50).all()

@app.post("/friends/add")
def add_friend_internal(
    payload: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_id = payload.get("user_id_2")
    uid1, uid2 = sorted([current_user.id, target_id])
    if db.query(models.Friendship).filter_by(user_id_1=uid1, user_id_2=uid2).first():
        return {"status": "already_friends"}
    new_friendship = models.Friendship(user_id_1=uid1, user_id_2=uid2)
    db.add(new_friendship)
    db.commit()
    return {"status": "success"}

@app.get("/users/{user_id}/friends")
def get_friends_list(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id != current_user.id: raise HTTPException(status_code=403, detail="Not authorized")
    fs = db.query(models.Friendship).filter(or_(models.Friendship.user_id_1 == user_id, models.Friendship.user_id_2 == user_id)).all()
    friend_ids = [f.user_id_2 if f.user_id_1 == user_id else f.user_id_1 for f in fs]
    return db.query(models.User).filter(models.User.id.in_(friend_ids)).all()
