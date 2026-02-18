
import firebase_admin
from firebase_admin import credentials, firestore
from ffbb_api_client_v2 import FFBBAPIClientV2, TokenManager
from datetime import datetime
import re
import sys

# Copy logic from verify_match_times.py
def normalize_team_name(name):
    return name.lower().replace("-", " ").replace(" ", "")

def extract_team_number_local(team_str):
    match = re.search(r'[MF](\d+)', team_str)
    if match: return match.group(1)
    match = re.search(r' (\d+)$', team_str)
    if match: return match.group(1)
    if " 1" in team_str: return "1"
    return "1" 

def extract_team_number_ffbb(team_name):
    if clean_match := re.search(r' - (\d+)$', team_name):
        return clean_match.group(1)
    if clean_match := re.search(r' (\d+)$', team_name):
        return clean_match.group(1)
    return "1" 

def debug_match():
    # Init Firebase
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    except: pass
    db = firestore.client()

    # Init FFBB
    tokens = TokenManager.get_tokens(use_cache=False)
    client = FFBBAPIClientV2.create(api_bearer_token=tokens.api_token, meilisearch_bearer_token=tokens.meilisearch_token)

    # Specific Target: 2026-02-28, U11 M1 vs CLERMONT BASKET - 1
    # Firestore ID from previous logs: KlUeQK7SeKGtuyFJ9QWK (allegedly)
    # Or just search by criteria if ID uncertain
    
    print("--- DEBUGGING 2026-02-28 ---")
    
    # 1. Fetch FFBB Data for that date
    org = client.get_organisme(9326) # SCBA
    candidates = []
    
    print(f"Scanning {len(org.engagements)} engagements...")
    for eng in org.engagements:
        poule_id = eng.idPoule.id if hasattr(eng.idPoule, 'id') else str(eng.idPoule)
        # Optimization: verify_match_times pre-fetches all. we just want to see if we find it.
        try:
            poule = client.get_poule(poule_id)
            if poule.rencontres:
                for m in poule.rencontres:
                    d = getattr(m, 'date_rencontre', '')
                    if "2026-02-28" in str(d):
                        candidates.append(m)
        except: pass
        
    print(f"\nFound {len(candidates)} FFBB matches on 2026-02-28:")
    for m in candidates:
        print(f"  FFBB Match: {m.nomEquipe1} vs {m.nomEquipe2}")
        print(f"     Time: {m.date_rencontre}")
        
        # Test extraction logic
        n1 = normalize_team_name(m.nomEquipe1)
        n2 = normalize_team_name(m.nomEquipe2)
        
        is_n1_us = "stadeclermontois" in n1
        is_n2_us = "stadeclermontois" in n2
        
        ffbb_team_num = "?"
        if is_n1_us: ffbb_team_num = extract_team_number_ffbb(m.nomEquipe1)
        elif is_n2_us: ffbb_team_num = extract_team_number_ffbb(m.nomEquipe2)
        
        print(f"     Us? {is_n1_us or is_n2_us} (Team {ffbb_team_num})")

    # 2. Check Firestore Doc
    print("\nChecking Firestore...")
    matches = db.collection("matches").where("dateISO", "==", "2026-02-28").stream()
    found_any = False
    for doc in matches:
        d = doc.to_dict()
        t = d.get("team", "")
        o = d.get("opponent", "")
        time = d.get("time", "")
        is_home = d.get("isHome", None) # boolean or None
        
        if "U11" in t and "CLERMONT" in o.upper():
            found_any = True
            print(f"\nFirestore Match: {t} vs {o}")
            print(f"  Time: {time}")
            print(f"  isHome: {is_home}")
            print(f"  ID: {doc.id}")
            
            local_team_num = extract_team_number_local(t)
            print(f"  Local Team Num extracted: {local_team_num}")

            # Simulate matching logic
            print("  --- SIMULATING MATCHING ---")
            for m in candidates:
                n1 = normalize_team_name(m.nomEquipe1)
                n2 = normalize_team_name(m.nomEquipe2)
                opp_norm = normalize_team_name(o)
                
                is_n1_us = "stadeclermontois" in n1
                is_n2_us = "stadeclermontois" in n2
                
                ffbb_team_num = None
                if is_n1_us: ffbb_team_num = extract_team_number_ffbb(m.nomEquipe1)
                elif is_n2_us: ffbb_team_num = extract_team_number_ffbb(m.nomEquipe2)
                
                match_opp = (opp_norm in n1) or (opp_norm in n2)
                print(f"  vs {m.nomEquipe1}/{m.nomEquipe2}: OppMatch={match_opp}, FFBB_Team={ffbb_team_num}, Local_Team={local_team_num}")
                
                if match_opp:
                     if ffbb_team_num and ffbb_team_num != local_team_num:
                         print("     -> SKIPPED (Team Num Mismatch)")
                     else:
                         print("     -> MATCH FOUND!")

if __name__ == "__main__":
    debug_match()
