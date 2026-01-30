import os
import hashlib
import requests
from typing import List
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
import models, schemas, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CR_API_KEY = os.getenv("CR_API_KEY")
API_BASE = "https://api.clashroyale.com/v1"

def get_headers():
    return {"Authorization": f"Bearer {CR_API_KEY}"}

def generate_battle_id(battle_time: str, p1_tag: str, p2_tag: str) -> str:
    # Strip # and uppercase to ensure consistent hashing
    t1 = p1_tag.replace("#", "").upper()
    t2 = p2_tag.replace("#", "").upper()
    tags = sorted([t1, t2])
    raw_string = f"{battle_time}-{tags[0]}-{tags[1]}"
    return hashlib.md5(raw_string.encode()).hexdigest()

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(models.User.player_tag == user.player_tag).first()
    if existing_user:
        return existing_user
    new_user = models.User(username=user.username, player_tag=user.player_tag)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/{player_tag}", response_model=schemas.UserResponse)
def get_user_by_tag(player_tag: str, db: Session = Depends(database.get_db)):
    formatted_tag = player_tag.upper() if player_tag.startswith("#") else f"#{player_tag.upper()}"
    user = db.query(models.User).filter(models.User.player_tag == formatted_tag).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/{user_id}/friends", response_model=List[schemas.UserResponse])
def get_user_friends(user_id: int, db: Session = Depends(database.get_db)):
    friendships = db.query(models.Friendship).filter(
        (models.Friendship.user_id_1 == user_id) | (models.Friendship.user_id_2 == user_id)
    ).all()
    friend_ids = [f.user_id_2 if f.user_id_1 == user_id else f.user_id_1 for f in friendships]
    return db.query(models.User).filter(models.User.id.in_(friend_ids)).all()

@app.post("/friends/")
def add_friend(friend_data: dict, db: Session = Depends(database.get_db)):
    # Extract numeric IDs, not tags
    u1 = friend_data.get("user_id_1")
    u2 = friend_data.get("user_id_2")

    if not isinstance(u1, int) or not isinstance(u2, int):
        raise HTTPException(status_code=400, detail="User IDs must be integers")

    if u1 == u2:
        raise HTTPException(status_code=400, detail="Cannot add self")
    
    id1, id2 = sorted([u1, u2])
    
    # Query using integer IDs
    existing = db.query(models.Friendship).filter(
        models.Friendship.user_id_1 == id1, 
        models.Friendship.user_id_2 == id2
    ).first()
    
    if existing:
        return {"status": "success", "message": "Already friends"}

    new_friendship = models.Friendship(user_id_1=id1, user_id_2=id2)
    db.add(new_friendship)
    db.commit()
    return {"status": "success"}

@app.get("/players/{player_tag}/matches", response_model=List[schemas.MatchResponse])
def get_player_matches(player_tag: str, db: Session = Depends(database.get_db)):
    return db.query(models.Match).filter(
        (models.Match.player_1_tag == player_tag) | (models.Match.player_2_tag == player_tag)
    ).order_by(models.Match.battle_time.desc()).limit(50).all()

@app.post("/sync/{player_tag}")
def sync_battles(player_tag: str, db: Session = Depends(database.get_db)):
    clean_tag = player_tag.replace("#", "%23")
    url = f"{API_BASE}/players/{clean_tag}/battlelog"
    
    try:
        response = requests.get(url, headers=get_headers())
        battles = response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    saved_count = 0
    for b in battles:
        # REMOVED: if b.get("type") not in ["PvP", "2v2", "ClanWar"]: continue
        # This now allows all match types (friendly, tournaments, etc.) to be saved
            
        try:
            p1_tag = b["team"][0]["tag"]
            p2_tag = b["opponent"][0]["tag"]
            
            battle_time_str = b["battleTime"]
            battle_id = generate_battle_id(battle_time_str, p1_tag, p2_tag)

            if db.query(models.Match).filter(models.Match.battle_id == battle_id).first():
                continue

            match_record = models.Match(
                battle_id=battle_id,
                player_1_tag=p1_tag,
                player_2_tag=p2_tag,
                winner_tag=p1_tag if b["team"][0]["crowns"] > b["opponent"][0]["crowns"] else (p2_tag if b["opponent"][0]["crowns"] > b["team"][0]["crowns"] else None),
                battle_time=datetime.strptime(battle_time_str, "%Y%m%dT%H%M%S.%fZ"),
                game_mode=b.get("type", "Unknown"), # Captures the specific mode for the UI
                crowns_1=b["team"][0]["crowns"],
                crowns_2=b["opponent"][0]["crowns"]
            )
            
            db.add(match_record)
            saved_count += 1
        except (KeyError, IndexError):
            continue

    db.commit()
    return {"status": "success", "new_matches_synced": saved_count}

@app.get("/search/{player_tag}")
def discover_player(player_tag: str, db: Session = Depends(database.get_db)):
    """
    Search for a player. If not in DB, fetch from CR API and create a record.
    """
    safe_tag = player_tag.upper() if player_tag.startswith("#") else f"#{player_tag.upper()}"
    
    # 1. Check local DB
    user = db.query(models.User).filter(models.User.player_tag == safe_tag).first()
    if user:
        return user

    # 2. Not in DB? Fetch from Official API
    clean_tag = safe_tag.replace("#", "%23")
    url = f"{API_BASE}/players/{clean_tag}"
    
    try:
        response = requests.get(url, headers=get_headers())
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Player not found in Clash Royale")
        
        cr_data = response.json()
        
        # 3. Save them as a "System User" so we can track matches
        new_user = models.User(username=cr_data["name"], player_tag=safe_tag)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}")