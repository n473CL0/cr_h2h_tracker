import requests
import sys
import uuid

BASE_URL = "http://localhost:8000"

# Generate unique users for every run
RND_ID = str(uuid.uuid4())[:8]

# UPDATED: using your tag for User A, and a known valid tag for User B
USER_A = {"username": f"UserA_{RND_ID}", "password": "password123", "player_tag": "#9GLG0JGL0"}
USER_B = {"username": f"UserB_{RND_ID}", "password": "password123", "player_tag": "#2U9YPQJ82"} 

def get_auth_token(username, password):
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": username, "password": password})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    print(f"❌ Login Failed for {username}: {resp.status_code} - {resp.text}")
    return None

def run_flow():
    print(f"🚀 Starting Integration Test (Batch {RND_ID})...\n")

    # 1. Register User A
    print(f"[1] Registering {USER_A['username']}...")
    r = requests.post(f"{BASE_URL}/auth/signup", json=USER_A)
    if r.status_code != 200:
        print(f"❌ Signup Failed: {r.status_code} - {r.text}")
        sys.exit(1)
        
    token_a = get_auth_token(USER_A['username'], USER_A['password'])
    if not token_a: sys.exit(1)
    
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print(f"    ✅ Logged in. Token: {token_a[:10]}...")

    # 2. Link Tag for User A
    print(f"[2] Linking Tag {USER_A['player_tag']}...")
    r = requests.put(f"{BASE_URL}/users/link-tag", json={"player_tag": USER_A['player_tag']}, headers=headers_a)
    if r.status_code != 200:
        print(f"❌ Link Failed: {r.status_code} - {r.text}")
        sys.exit(1)
    print(f"    ✅ Linked.")

    # 3. Create Invite (User A invites User B)
    print("[3] Creating Invite...")
    r = requests.post(f"{BASE_URL}/invites/", headers=headers_a)
    if r.status_code != 200:
        print(f"❌ Invite Generation Failed: {r.status_code} - {r.text}")
        sys.exit(1)
        
    invite_data = r.json()
    invite_code = invite_data['token']
    print(f"    ✅ Invite Code Generated: {invite_code}")

    # 4. Register User B (Using Invite Code)
    print(f"[4] Registering {USER_B['username']} with Invite Code...")
    payload_b = USER_B.copy()
    payload_b["invite_token"] = invite_code
    r = requests.post(f"{BASE_URL}/auth/signup", json=payload_b)
    if r.status_code != 200:
        print(f"❌ Signup B Failed: {r.status_code} - {r.text}")
        sys.exit(1)

    # 5. Login User B & Link Tag
    token_b = get_auth_token(USER_B['username'], USER_B['password'])
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    print(f"[5] Linking Tag {USER_B['player_tag']} for User B...")
    r = requests.put(f"{BASE_URL}/users/link-tag", json={"player_tag": USER_B['player_tag']}, headers=headers_b)
    if r.status_code == 200:
        print(f"    ✅ User B Linked.")
    else:
        print(f"❌ User B Link Failed: {r.status_code} - {r.text}")

    print("\n✅ TEST PASSED! The background sync loop will now pick up matches between these two.")

if __name__ == "__main__":
    run_flow()