
import firebase_admin
from firebase_admin import credentials, firestore
from ffbb_api_client_v2 import FFBBAPIClientV2, TokenManager
from ffbb_api_client_v2.config import API_FFBB_BASE_URL, DEFAULT_USER_AGENT
import requests
import argparse
import sys
import time
from datetime import datetime
import re

# --- Configuration ---

# Map Team Name (in Firestore) -> FFBB Club ID
CLUB_MAPPING = {
    "Stade Clermontois Basket Auvergne": 9326,
    "SCBA": 9326,
    "STADE CLERMONTOIS BASKET AUVERGNE": 9326,
}

# Cache
POULE_CACHE = {} # poule_id -> list of matches

def init_firebase():
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        print("Initialized Firebase with serviceAccountKey.json.")
    except Exception as e:
        print(f"Failed to init Firebase: {e}")
        sys.exit(1)
    return firestore.client()

def init_ffbb():
    try:
        tokens = TokenManager.get_tokens(use_cache=False)
        client = FFBBAPIClientV2.create(api_bearer_token=tokens.api_token, meilisearch_bearer_token=tokens.meilisearch_token)
        print("Initialized FFBB Client.")
        return client, tokens.api_token
    except Exception as e:
        print(f"Failed to init FFBB Client: {e}")
        sys.exit(1)

def normalize_team_name(name):
    return name.lower().replace("-", " ").replace(" ", "")

def extract_team_number_local(team_str):
    ts = team_str.upper().strip()
    
    # 1. Compact formats: U13M1, U15F2, SM1, SF2 (Letter(s) + OptionGender + Digit)
    # UxxM1
    m = re.search(r'U\d+[MF]\s*(\d+)', ts)
    if m: return m.group(1)
    
    # SM1, SF2
    m = re.search(r'S[MF]\s*(\d+)', ts)
    if m: return m.group(1)

    # 2. Spaced formats: "SENIOR M1", "U13 M1", "U15 F 2"
    m = re.search(r'(?:SENIOR|U\d+)\s*[MF]?\s*(\d+)', ts)
    if m: return m.group(1)
    
    # 3. Digit at very end (fallback)
    # e.g. "Clermont 2"
    m = re.search(r'\s(\d+)$', ts)
    if m: return m.group(1)

    # 4. " 1" inside string (last resort)
    if " 1" in ts: return "1"

    return "1" # Default

def extract_team_number_ffbb(team_name):
    if clean_match := re.search(r' - (\d+)$', team_name):
        return clean_match.group(1)
    if clean_match := re.search(r' (\d+)$', team_name):
        return clean_match.group(1)
    return "1" 

def extract_category_local(team_str):
    ts = team_str.upper()
    # Handle SM/SF/SENIOR
    if "SM" in ts or "SF" in ts or "SENIOR" in ts or "RM2" in ts or "RM3" in ts or "PNM" in ts:
        return "SE"
    
    # Generic Uxx extraction (U7 to U20+)
    match = re.search(r'(U\d+)', ts)
    if match:
        return match.group(1)
    return None

def extract_gender_local(team_str):
    """
    Extracts gender 'M' or 'F' from local team name.
    """
    ts = team_str.upper()
    
    # Compact: U13M1 -> M
    if re.search(r'U\d+M\d*', ts): return 'M'
    if re.search(r'U\d+F\d*', ts): return 'F'
    if re.search(r'SM\d*', ts): return 'M'
    if re.search(r'SF\d*', ts): return 'F'

    # Explicit patterns
    if re.search(r'[ -](M)\d+', ts): return 'M'
    if re.search(r'[ -](F)\d+', ts): return 'F'

    # Keywords
    if " MASC" in ts or " M " in ts or ts.endswith(" M"): return 'M'
    if " FEM" in ts or " F " in ts or ts.endswith(" F"): return 'F'
    if "SENIOR M" in ts: return 'M'
    if "SENIOR F" in ts: return 'F'
    
    return None

def verify_times(db, ffbb_client, api_token, fix=False):
    matches_ref = db.collection("matches")
    docs = matches_ref.stream()

    print(f"\n--- {'FIX MODE' if fix else 'VERIFY MODE'} ---\n")
    
    club_id = CLUB_MAPPING.get("SCBA", 9326)
    print(f"Fetching engagements for Club ID {club_id}...")
    org = ffbb_client.get_organisme(club_id)
    if not org or not org.engagements:
        print("Could not fetch club engagements.")
        return

    print("Building Match Index from FFBB (this may take a moment)...")
    ffbb_matches_by_date = {} 

    from concurrent.futures import ThreadPoolExecutor, as_completed

    def fetch_poule_matches(engagement):
        cat_code = "UNKNOWN"
        gender_code = "X"
        try:
            if hasattr(engagement, 'idCompetition'):
                comp = engagement.idCompetition
                if hasattr(comp, 'categorie'):
                    cat_code = comp.categorie.code
                if hasattr(comp, 'sexe'):
                    gender_code = comp.sexe 
        except: pass
        
        poule_id_obj = getattr(engagement, 'idPoule', None)
        if not poule_id_obj: return ([], cat_code, gender_code)
        
        poule_id = poule_id_obj.id if hasattr(poule_id_obj, 'id') else str(poule_id_obj)
        
        if poule_id in POULE_CACHE:
            return (POULE_CACHE[poule_id], cat_code, gender_code)

        try:
            poule_data = ffbb_client.get_poule(poule_id)
            matches = []
            if poule_data and poule_data.rencontres:
                matches = poule_data.rencontres
                POULE_CACHE[poule_id] = matches
            return (matches, cat_code, gender_code)
        except:
            return ([], cat_code, gender_code)

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_poule_matches, eng): eng for eng in org.engagements}
        for future in as_completed(futures):
            matches, cat_code, gender_code = future.result()
            for m in matches:
                d = getattr(m, 'date_rencontre', '')
                if d:
                    if isinstance(d, datetime):
                        date_str = d.strftime("%Y-%m-%d")
                    else:
                        date_str = str(d).split("T")[0]
                        
                    if date_str not in ffbb_matches_by_date:
                        ffbb_matches_by_date[date_str] = []
                    
                    ffbb_matches_by_date[date_str].append((m, cat_code, gender_code))

    print(f"Indexed {sum(len(v) for v in ffbb_matches_by_date.values())} matches from FFBB.")

    discrepancy_count = 0
    ok_count = 0
    skipped_count = 0
    
    for doc in docs:
        data = doc.to_dict()
        match_id = doc.id
        team_name = data.get("team", "")
        opponent_name = data.get("opponent", "")
        match_date_iso = data.get("dateISO", "") 
        local_time = data.get("time", "").strip()
        is_home_local = data.get("isHome", None)
        
        if not match_date_iso:
            continue
            
        local_time_norm = local_time.lower().replace('h', ':').strip()
        if len(local_time_norm) == 8: 
            local_time_norm = local_time_norm[:5]

        local_team_num = extract_team_number_local(team_name)
        local_category = extract_category_local(team_name)
        local_gender = extract_gender_local(team_name)
        
        candidates = ffbb_matches_by_date.get(match_date_iso, [])
        best_match = None
        
        for m, cat_code, gender_code in candidates:
            # 1. Category
            if local_category and cat_code and local_category != cat_code:
                continue

            # 2. Gender
            if local_gender:
                if local_gender == 'M' and gender_code == 'F': continue
                if local_gender == 'F' and gender_code == 'M': continue

            # 3. Opponent Fuzzy
            n1 = normalize_team_name(m.nomEquipe1)
            n2 = normalize_team_name(m.nomEquipe2)
            opp_norm = normalize_team_name(opponent_name)
            
            is_n1_us = "stadeclermontois" in n1
            is_n2_us = "stadeclermontois" in n2
            
            is_home_ffbb = is_n1_us
            ffbb_team_num = None
            if is_n1_us: ffbb_team_num = extract_team_number_ffbb(m.nomEquipe1)
            elif is_n2_us: ffbb_team_num = extract_team_number_ffbb(m.nomEquipe2)

            match_opp = (opp_norm in n1) or (opp_norm in n2)
            
            if match_opp:
                # 4. Team Num
                if ffbb_team_num and ffbb_team_num != local_team_num:
                    continue
                
                # 5. Home/Away
                if is_home_local is not None:
                    if is_home_local != is_home_ffbb:
                        continue

                best_match = m
                break
        
        if best_match:
            ffbb_time = None
            d = getattr(best_match, 'date_rencontre', None)
            
            if isinstance(d, datetime):
                ffbb_time = d.strftime("%H:%M")
            elif isinstance(d, str):
                try:
                    dt = datetime.fromisoformat(d.replace("Z", "+00:00"))
                    ffbb_time = dt.strftime("%H:%M")
                except:
                    if "T" in d:
                        ffbb_time = d.split("T")[1][:5]
            
            if ffbb_time == "00:00":
                 pass

            if ffbb_time and ffbb_time != local_time_norm:
                print(f"[{match_id}] DISCREPANCY FOUND:")
                print(f"    Match   : {team_name} vs {opponent_name} ({match_date_iso})")
                print(f"    Local   : {local_time} -> {local_time_norm}")
                print(f"    Details : Home={is_home_local}, Cat={local_category}, Gender={local_gender}, Num={local_team_num}")
                print(f"    FFBB    : {ffbb_time}")
                
                if fix:
                    matches_ref.document(match_id).update({"time": ffbb_time})
                    print(f"    -> FIXED")
                discrepancy_count += 1
            else:
                ok_count += 1
        else:
            skipped_count += 1

    print("\n--- SUMMARY ---")
    print(f"OK:          {ok_count}")
    print(f"Discrepancies: {discrepancy_count}")
    print(f"Skipped/Not Found: {skipped_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify match times against FFBB.")
    parser.add_argument("--fix", action="store_true", help="Apply fixes to Firestore.")
    args = parser.parse_args()

    db = init_firebase()
    client, api_token = init_ffbb()
    
    verify_times(db, client, api_token, fix=args.fix)
