from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from sqlalchemy.dialects.postgresql import insert as pg_insert
import models, schemas

# --- User Logic ---
def get_user_by_tag(db: Session, player_tag: str):
    return db.query(models.User).filter(models.User.player_tag == player_tag).first()

def create_user(db: Session, user: schemas.UserCreate):
    # Ensure tag is formatted correctly (uppercase, starts with #)
    formatted_tag = user.player_tag.upper()
    if not formatted_tag.startswith("#"):
        formatted_tag = f"#{formatted_tag}"
    
    db_user = models.User(username=user.username, player_tag=formatted_tag)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Match Logic ---
def get_matches_for_player(db: Session, player_tag: str, limit: int = 50):
    """
    Optimized query to find matches where the player was EITHER 
    player_1 OR player_2, sorted by most recent.
    """
    return db.query(models.Match).filter(
        or_(
            models.Match.player_1_tag == player_tag,
            models.Match.player_2_tag == player_tag
        )
    ).order_by(desc(models.Match.battle_time)).limit(limit).all()

def get_social_feed(db: Session, current_user: models.User, limit: int = 50):
    """
    Returns matches where BOTH participants are in the user's circle (self + friends).
    """
    # 1. Get friend IDs
    friendships = db.query(models.Friendship).filter(
        or_(models.Friendship.user_id_1 == current_user.id, 
            models.Friendship.user_id_2 == current_user.id)
    ).all()
    
    friend_ids = []
    for f in friendships:
        friend_ids.append(f.user_id_2 if f.user_id_1 == current_user.id else f.user_id_1)
        
    # 2. Get tags (Self + Friends)
    # We always include the current user to see matches they played against friends
    target_ids = friend_ids + [current_user.id]
    
    users_in_circle = db.query(models.User).filter(models.User.id.in_(target_ids)).all()
    circle_tags = {u.player_tag for u in users_in_circle if u.player_tag}
    
    if len(circle_tags) < 2:
        return []

    # 3. Query matches where both P1 and P2 are in the circle
    return db.query(models.Match).filter(
        and_(
            models.Match.player_1_tag.in_(circle_tags),
            models.Match.player_2_tag.in_(circle_tags)
        )
    ).order_by(desc(models.Match.battle_time)).limit(limit).all()

def upsert_matches(db: Session, matches_data: list[dict]):
    """
    Bulk insert matches. Ignores duplicates based on the 'battle_id' 
    unique constraint using PostgreSQL's ON CONFLICT DO NOTHING.
    """
    if not matches_data:
        return

    stmt = pg_insert(models.Match).values(matches_data)
    
    # Define what to do on conflict (duplicate battle_id): do nothing
    do_nothing_stmt = stmt.on_conflict_do_nothing(
        index_elements=['battle_id']
    )
    
    db.execute(do_nothing_stmt)
    db.commit()