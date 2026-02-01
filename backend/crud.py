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

# --- Social Logic ---
def get_friendship(db: Session, user_id_1: int, user_id_2: int):
    """
    Checks if a friendship exists between two users.
    Order of IDs in the DB doesn't matter, we check both directions.
    """
    return db.query(models.Friendship).filter(
        or_(
            and_(models.Friendship.user_id_1 == user_id_1, models.Friendship.user_id_2 == user_id_2),
            and_(models.Friendship.user_id_1 == user_id_2, models.Friendship.user_id_2 == user_id_1)
        )
    ).first()

def check_pending_invite(db: Session, creator_id: int, target_tag: str):
    """
    Checks if the creator has an active invite specifically targeting this tag.
    """
    if not target_tag:
        return False
    return db.query(models.Invite).filter(
        models.Invite.creator_id == creator_id,
        models.Invite.target_tag == target_tag
    ).first() is not None

def get_friends_users(db: Session, user_id: int):
    """
    Helper to return a list of User objects who are friends with the given user_id.
    """
    friendships = db.query(models.Friendship).filter(
        or_(models.Friendship.user_id_1 == user_id, 
            models.Friendship.user_id_2 == user_id)
    ).all()
    
    friend_ids = [f.user_id_2 if f.user_id_1 == user_id else f.user_id_1 for f in friendships]
    return db.query(models.User).filter(models.User.id.in_(friend_ids)).all()

# --- Match Logic ---
def get_matches_for_player(db: Session, player_tag: str, skip: int = 0, limit: int = 50):
    """
    Optimized query to find matches where the player was EITHER 
    player_1 OR player_2, sorted by most recent.
    """
    return db.query(models.Match).filter(
        or_(
            models.Match.player_1_tag == player_tag,
            models.Match.player_2_tag == player_tag
        )
    ).order_by(desc(models.Match.battle_time)).offset(skip).limit(limit).all()

def get_social_feed(db: Session, current_user: models.User, skip: int = 0, limit: int = 20):
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
    ).order_by(desc(models.Match.battle_time)).offset(skip).limit(limit).all()

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

# --- Advanced Stats Logic ---
def get_leaderboard_stats(db: Session, current_user: models.User):
    if not current_user.player_tag:
        return {"domination": [], "rivals": [], "nemesis": []}

    # 1. Get all friends with tags
    friends = get_friends_users(db, current_user.id)
    friends_map = {f.player_tag: f for f in friends if f.player_tag}
    
    if not friends_map:
        return {"domination": [], "rivals": [], "nemesis": []}
    
    # 2. Get all matches for current user (no limit, within reasonable history)
    # Optimization: Only fetch matches where opponent is in friends_map
    # But querying ALL user matches is simpler and usually fast enough for user-scale data
    all_matches = db.query(models.Match).filter(
        or_(
            models.Match.player_1_tag == current_user.player_tag,
            models.Match.player_2_tag == current_user.player_tag
        )
    ).all()

    # 3. Aggregation
    stats = {tag: {'wins': 0, 'total': 0} for tag in friends_map}
    
    for m in all_matches:
        opponent = None
        is_winner = (m.winner_tag == current_user.player_tag)
        
        if m.player_1_tag == current_user.player_tag:
            opponent = m.player_2_tag
        else:
            opponent = m.player_1_tag
            
        if opponent in stats:
            stats[opponent]['total'] += 1
            if is_winner:
                stats[opponent]['wins'] += 1

    # 4. Categorization
    result = {"domination": [], "rivals": [], "nemesis": []}
    
    for tag, data in stats.items():
        friend_user = friends_map[tag]
        total = data['total']
        win_rate = (data['wins'] / total * 100) if total > 0 else 0.0
        
        entry = schemas.LeaderboardEntry(
            username=friend_user.username,
            player_tag=friend_user.player_tag,
            win_rate=round(win_rate, 1),
            total_matches=total
        )
        
        if total == 0:
            result["rivals"].append(entry) # Neutral/Unranked
        elif win_rate > 60:
            result["domination"].append(entry)
        elif win_rate < 40:
            result["nemesis"].append(entry)
        else:
            result["rivals"].append(entry)
            
    return result

def get_h2h_stats(db: Session, user: models.User, friend: models.User):
    if not user.player_tag or not friend.player_tag:
        return None
        
    # 1. Get matches between specific pair
    matches = db.query(models.Match).filter(
        or_(
            and_(models.Match.player_1_tag == user.player_tag, models.Match.player_2_tag == friend.player_tag),
            and_(models.Match.player_1_tag == friend.player_tag, models.Match.player_2_tag == user.player_tag)
        )
    ).order_by(desc(models.Match.battle_time)).all()
    
    total = len(matches)
    if total == 0:
        return schemas.H2HStatsResponse(
            friend_username=friend.username,
            total_matches=0, win_rate=0.0, total_crowns_user=0, total_crowns_friend=0,
            streak="None", last_5_results=[]
        )
        
    wins = 0
    crowns_user = 0
    crowns_friend = 0
    last_5_codes = []
    
    # Process for totals
    for i, m in enumerate(matches):
        # Determine roles
        if m.player_1_tag == user.player_tag:
            u_crowns = m.crowns_1
            f_crowns = m.crowns_2
        else:
            u_crowns = m.crowns_2
            f_crowns = m.crowns_1
            
        crowns_user += u_crowns
        crowns_friend += f_crowns
        
        result_code = "D"
        if m.winner_tag == user.player_tag:
            wins += 1
            result_code = "W"
        elif m.winner_tag == friend.player_tag:
            result_code = "L"
            
        if i < 5:
            last_5_codes.append(result_code)
            
    # Calculate Streak
    current_streak_type = last_5_codes[0] # W, L, or D
    streak_count = 0
    for code in last_5_codes:
        if code == current_streak_type:
            streak_count += 1
        else:
            break
            
    streak_label = "None"
    if current_streak_type == "W": streak_label = f"{streak_count} Win{'s' if streak_count > 1 else ''}"
    elif current_streak_type == "L": streak_label = f"{streak_count} Loss{'es' if streak_count > 1 else ''}"
    elif current_streak_type == "D": streak_label = f"{streak_count} Draw{'s' if streak_count > 1 else ''}"

    return schemas.H2HStatsResponse(
        friend_username=friend.username,
        total_matches=total,
        win_rate=round((wins / total * 100), 1),
        total_crowns_user=crowns_user,
        total_crowns_friend=crowns_friend,
        streak=streak_label,
        last_5_results=last_5_codes
    )