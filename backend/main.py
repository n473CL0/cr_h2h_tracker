import os
import hashlib
import requests
import asyncio
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Body, BackgroundTasks, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

# Import local modules
import models
import schemas
import database
import crud

# --- Configuration ---
def get_env(key, default=None):
    val = os.getenv(key)
    # Check if value is None OR an empty string
    if not val or val.strip() == "":
        if default is not None:
            return default
        print(f"⚠️  Warning: {key} is missing in environment variables.")
        return None
    return val

SECRET_KEY = get_env("SECRET_KEY", "dev_unsafe_secret")
CR_API_KEY = get_env("CR_API_KEY") 
FRONTEND_URL = get_env("FRONTEND_URL", "http://localhost:3000")
API_BASE = "https://proxy.royaleapi.dev/v1"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Mail Config
mail_conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "user"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "pass"),
    MAIL_FROM=os.getenv("MAIL_FROM", "noreply@clashfriends.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False 
)

# Database & App Init
models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="ClashFriends API")

# CORS Security
origins = [
    "http://localhost:3000",
    "https://diligent-creativity-production-045b.up.railway.app",
    "https://clashfriends.com",
    "https://www.clashfriends.com" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Helpers
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_hash(password):
    return pwd_context.hash(password)

def create_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- External API Helpers ---
def fetch_cr_player(tag: str):
    if not CR_API_KEY:
        return None
    clean_tag = tag.replace("#", "%23")
    try:
        resp = requests.get(f"{API_BASE}/players/{clean_tag}", headers={"Authorization": f"Bearer {CR_API_KEY}"}, timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"CR API Fail: {e}")
    return None

def generate_battle_id(battle_time, p1, p2):
    # Unique ID based on time and sorted player tags
    t1, t2 = sorted([p1.replace("#",""), p2.replace("#","")])
    raw = f"{battle_time}-{t1}-{t2}"
    return hashlib.md5(raw.encode()).hexdigest()

# --- Dependencies ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    auth_exception = HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise auth_exception
    except JWTError:
        raise auth_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None: raise auth_exception
    return user

# --- Background Sync Logic ---
async def sync_user_matches(db: Session, user: models.User, known_tags: set):
    if not user.player_tag or not CR_API_KEY: return
    
    clean_tag = user.player_tag.replace("#", "%23")
    url = f"{API_BASE}/players/{clean_tag}/battlelog"
    headers = {"Authorization": f"Bearer {CR_API_KEY}"}
    
    try:
        # Run synchronous request in thread to avoid blocking loop
        resp = await asyncio.to_thread(requests.get, url, headers=headers, timeout=10)
        
        if resp.status_code == 429:
            print(f"⚠️ Rate Limit. Skipping {user.username}")
            return
        if resp.status_code != 200:
            return

        battles = resp.json()
        matches_to_add = []
        
        for b in battles:
            try:
                # Basic parsing
                p1_tag = b["team"][0]["tag"]
                p2_tag = b["opponent"][0]["tag"]
                
                # Only save if we know one of the players (optimization)
                if p1_tag not in known_tags and p2_tag not in known_tags:
                    continue

                b_time_str = b["battleTime"]
                bid = generate_battle_id(b_time_str, p1_tag, p2_tag)
                
                # Determine winner
                c1 = b["team"][0]["crowns"]
                c2 = b["opponent"][0]["crowns"]
                winner = p1_tag if c1 > c2 else (p2_tag if c2 > c1 else None)
                
                matches_to_add.append({
                    "battle_id": bid,
                    "player_1_tag": p1_tag,
                    "player_2_tag": p2_tag,
                    "winner_tag": winner,
                    "battle_time": datetime.strptime(b_time_str, "%Y%m%dT%H%M%S.%fZ").replace(tzinfo=timezone.utc),
                    "game_mode": b.get("type", "Ladder"),
                    "crowns_1": c1,
                    "crowns_2": c2
                })
            except Exception:
                continue # Skip bad records
        
        # Use bulk upsert logic
        if matches_to_add:
            crud.upsert_matches(db, matches_to_add)
            
    except Exception as e:
        print(f"Sync error for {user.username}: {e}")

async def background_sync_task():
    await asyncio.sleep(5) # Startup buffer
    while True:
        print("🔄 Running Background Sync...")
        db = database.SessionLocal()
        try:
            users = db.query(models.User).filter(models.User.player_tag != None).all()
            known_tags = {u.player_tag for u in users}
            
            for user in users:
                await sync_user_matches(db, user, known_tags)
                await asyncio.sleep(0.5) # Throttle requests
                
        except Exception as e:
            print(f"Fatal Sync Error: {e}")
        finally:
            db.close()
        
        print("✅ Sync finished. Sleeping 30m.")
        await asyncio.sleep(1800)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(background_sync_task())

# --- Routes: Auth ---
@app.post("/auth/signup", response_model=schemas.UserResponse)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    # Invite Check
    if not user_data.invite_token:
        raise HTTPException(400, "Invite token required")
    invite = db.query(models.Invite).filter_by(token=user_data.invite_token).first()
    if not invite:
        raise HTTPException(400, "Invalid invite")
    
    if db.query(models.User).filter_by(email=user_data.email).first():
        raise HTTPException(400, "Email exists")
    
    # CR Data Fetch
    cr_name = "New User"
    clean_tag = None
    if user_data.player_tag:
        clean_tag = user_data.player_tag.upper()
        if not clean_tag.startswith("#"): clean_tag = f"#{clean_tag}"
        
        # Check uniqueness
        if db.query(models.User).filter_by(player_tag=clean_tag).first():
            raise HTTPException(400, "Tag already registered")
            
        info = fetch_cr_player(clean_tag)
        if info: cr_name = info.get("name", cr_name)

    new_user = models.User(
        email=user_data.email,
        username=cr_name,
        player_tag=clean_tag,
        hashed_password=get_hash(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-friend inviter
    u1, u2 = sorted([new_user.id, invite.creator_id])
    if u1 != u2:
        db.add(models.Friendship(user_id_1=u1, user_id_2=u2))
        invite.used_count += 1
        db.commit()
        
    return new_user

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(401, "Bad credentials")
    
    token = create_token({"sub": user.email}, timedelta(days=7))
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/forgot-password")
async def forgot_password(req: schemas.PasswordResetRequest, tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=req.email).first()
    if user:
        reset_token = create_token({"sub": user.email, "type": "reset"}, timedelta(minutes=15))
        link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        
        msg = MessageSchema(
            subject="Reset Password",
            recipients=[user.email],
            body=f"<a href='{link}'>Click here to reset</a>",
            subtype=MessageType.html
        )
        try:
            fm = FastMail(mail_conf)
            tasks.add_task(fm.send_message, msg)
        except Exception as e:
            print(f"Mail failed: {e}")
            
    return {"message": "If account exists, email sent"}

@app.post("/auth/reset-password")
def reset_password(req: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset": raise Exception()
        email = payload.get("sub")
    except:
        raise HTTPException(400, "Invalid token")
        
    user = db.query(models.User).filter_by(email=email).first()
    if not user: raise HTTPException(404, "User not found")
    
    user.hashed_password = get_hash(req.new_password)
    db.commit()
    return {"message": "Password updated"}

# --- Routes: Core ---
@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(current: models.User = Depends(get_current_user)):
    current.friendship_status = "self"
    return current

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_public_profile(user_id: int, current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current.id:
        status_val = "self"
    elif crud.get_friendship(db, current.id, user.id):
        status_val = "friend"
    elif user.player_tag and crud.check_pending_invite(db, current.id, user.player_tag):
        status_val = "pending"
    else:
        status_val = "none"
        
    user.friendship_status = status_val
    return user

@app.get("/matches", response_model=List[schemas.MatchResponse])
def get_matches(
    skip: int = 0,
    limit: int = 50,
    current: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not current.player_tag: return []
    return crud.get_matches_for_player(db, current.player_tag, skip=skip, limit=limit)

@app.get("/users/{user_id}/matches", response_model=List[schemas.MatchResponse])
def get_user_matches(
    user_id: int, 
    skip: int = 0,
    limit: int = 50,
    current: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.player_tag:
        return []
        
    return crud.get_matches_for_player(db, user.player_tag, skip=skip, limit=limit)

@app.get("/feed", response_model=List[schemas.MatchResponse])
def get_social_feed(
    skip: int = 0,
    limit: int = 20,
    current: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    return crud.get_social_feed(db, current, skip=skip, limit=limit)

@app.post("/users/onboarding", response_model=schemas.UserResponse)
def complete_onboarding(current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    current.onboarding_completed = True
    db.commit()
    db.refresh(current)
    current.friendship_status = "self"
    return current

# Manual Sync Rate Limit
sync_cooldowns = {}

@app.post("/sync/{player_tag}")
async def force_sync(player_tag: str, db: Session = Depends(get_db)):
    tag = player_tag.upper()
    if not tag.startswith("#"): tag = f"#{tag}"
    
    last = sync_cooldowns.get(tag)
    if last and (datetime.now() - last).seconds < 120:
        raise HTTPException(429, "Wait 2 mins")
    
    user = db.query(models.User).filter_by(player_tag=tag).first()
    if not user: raise HTTPException(404, "User not found")
    
    sync_cooldowns[tag] = datetime.now()
    
    # Refresh Profile
    data = fetch_cr_player(tag)
    if data:
        user.username = data.get("name", user.username)
        user.trophies = data.get("trophies", user.trophies)
        db.commit()
    
    # Run Sync
    all_tags = {u.player_tag for u in db.query(models.User).filter(models.User.player_tag != None).all()}
    await sync_user_matches(db, user, all_tags)
    
    return {"status": "synced"}

@app.put("/users/link-tag")
def link_tag(req: schemas.LinkTagRequest, current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    tag = req.player_tag.upper()
    if not tag.startswith("#"): tag = f"#{tag}"
    
    # Ensure tag not taken by OTHER user
    existing = db.query(models.User).filter(models.User.player_tag == tag).first()
    if existing and existing.id != current.id:
        raise HTTPException(400, "Tag taken")
        
    data = fetch_cr_player(tag)
    if not data: raise HTTPException(404, "Invalid CR Tag")
    
    current.player_tag = tag
    current.username = data.get("name", current.username)
    current.trophies = data.get("trophies", 0)
    current.clan_name = data.get("clan", {}).get("name")
    db.commit()
    return current

# --- Routes: Social ---
@app.get("/invites/{token}", response_model=schemas.InviteResponse)
def get_invite(token: str, db: Session = Depends(get_db)):
    inv = db.query(models.Invite).filter_by(token=token).first()
    if not inv: raise HTTPException(404, "Not found")
    return {"token": inv.token, "target_tag": inv.target_tag, "creator_username": inv.creator.username}

@app.post("/invites/", response_model=schemas.InviteResponse)
def create_invite(req: schemas.InviteCreate, current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = secrets.token_urlsafe(8)
    inv = models.Invite(token=token, creator_id=current.id, target_tag=req.target_tag)
    db.add(inv)
    db.commit()
    return {"token": token, "target_tag": inv.target_tag, "creator_username": current.username}

@app.get("/search/player")
def search(query: str, current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = query.strip().upper()
    if not q.startswith("#"): q = f"#{q}"
    
    # Check DB first
    user = db.query(models.User).filter_by(player_tag=q).first()
    if user:
        u1, u2 = sorted([current.id, user.id])
        is_friend = db.query(models.Friendship).filter_by(user_id_1=u1, user_id_2=u2).first() is not None
        return {"status": "friend" if is_friend else "user_found", "user": user, "can_invite": False}
    
    # Check CR API
    data = fetch_cr_player(q)
    if data:
        return {"status": "api_found", "tag": q, "name": data.get("name"), "can_invite": True}
        
    return {"status": "not_found", "can_invite": False}

@app.post("/friends/add")
def add_friend(payload: dict = Body(...), current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_id = payload.get("user_id_2")
    if not target_id: raise HTTPException(400, "Missing ID")
    
    u1, u2 = sorted([current.id, target_id])
    if u1 == u2: return {"status": "error"}
    
    if not db.query(models.Friendship).filter_by(user_id_1=u1, user_id_2=u2).first():
        db.add(models.Friendship(user_id_1=u1, user_id_2=u2))
        db.commit()
    return {"status": "success"}

@app.get("/users/{uid}/friends")
def get_friends(uid: int, current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if uid != current.id: raise HTTPException(403, "Forbidden")
    fs = db.query(models.Friendship).filter(or_(models.Friendship.user_id_1 == uid, models.Friendship.user_id_2 == uid)).all()
    ids = [f.user_id_2 if f.user_id_1 == uid else f.user_id_1 for f in fs]
    return db.query(models.User).filter(models.User.id.in_(ids)).all()

# --- Routes: Stats ---
@app.get("/stats/leaderboard", response_model=schemas.LeaderboardResponse)
def get_leaderboard(current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_leaderboard_stats(db, current)

@app.get("/stats/h2h/{friend_id}", response_model=schemas.H2HStatsResponse)
def get_h2h(friend_id: int, current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    friend = db.query(models.User).filter(models.User.id == friend_id).first()
    if not friend:
        raise HTTPException(404, "Friend not found")
        
    stats = crud.get_h2h_stats(db, current, friend)
    if not stats:
        # Fallback if no tags linked yet
        return schemas.H2HStatsResponse(
            friend_username=friend.username,
            total_matches=0, win_rate=0.0, total_crowns_user=0, total_crowns_friend=0,
            streak="None", last_5_results=[]
        )
    return stats

@app.post("/feedback", response_model=schemas.FeedbackResponse)
def create_feedback(
    feedback: schemas.FeedbackCreate, 
    current: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    db_feedback = models.Feedback(
        user_id=current.id,
        feedback_type=feedback.feedback_type,
        title=feedback.title,
        description=feedback.description
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback