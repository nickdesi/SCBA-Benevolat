
import firebase_admin
from firebase_admin import credentials, firestore
from ffbb_api_client_v2 import FFBBAPIClientV2, TokenManager
from ffbb_api_client_v2.config import API_FFBB_BASE_URL, DEFAULT_USER_AGENT
import requests
import argparse
import sys
import time
from datetime import datetime

# --- Configuration ---

# Map Team Name (in Firestore) -> FFBB Club ID
# You might need to expand this list based on data
CLUB_MAPPING = {
    # Main Club
    "Stade Clermontois Basket Auvergne": 9326,
    "SCBA": 9326,
    "STADE CLERMONTOIS BASKET AUVERGNE": 9326,
    
    # Common Opponents (If we want to search their club for away games)
    # "Clermont Basket": 9283,
}

KNOWN_VENUES = {
    "Maison des Sports": "Maison des Sports, Place des Bughes, 63000 Clermont-Ferrand",
    "Gymnase Fleury": "Gymnase Fleury, Rue Pierre de Coubertin, 63000 Clermont-Ferrand",
    "Gymnase Granouillet": "Gymnase Granouillet, 45 Rue de Châteaudun, 63000 Clermont-Ferrand",
    "Gymnase Autun": "Gymnase Autun, Rue d'Autun, 63000 Clermont-Ferrand",
    "Gymnase Thevenet": "Gymnase Thevenet, Rue de la Grande Tour, 63000 Clermont-Ferrand", 
    "Complexe Sportif Paul Bourissou": "Complexe Sportif Paul Bourissou, Rue du stade, 63960 Veyre-Monton",
}

# Cache
POULE_CACHE = {} # poule_id -> list of matches
SALLE_CACHE = {} # salle_id -> address string
MATCH_DETAILS_CACHE = {} # match_id -> details

def init_firebase():
    try:
        # Try finding a service account file
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

def get_salle_address(salle_id, api_token):
    if not salle_id:
        return None
    if salle_id in SALLE_CACHE:
        return SALLE_CACHE[salle_id]

    url = f"{API_FFBB_BASE_URL}items/ffbbserver_salles/{salle_id}"
    headers = {"Authorization": f"Bearer {api_token}", "user-agent": DEFAULT_USER_AGENT}
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json().get("data", {})
            nom = data.get("libelle")
            adresse = data.get("adresse")
            cp = ""
            ville = ""
            
            carto = data.get("cartographie")
            if isinstance(carto, dict):
                cp = carto.get("code_postal", "")
                ville = carto.get("ville", "")
            
            # Fallback if carto is ID or missing
            if not cp and data.get("commune") and isinstance(data.get("commune"), dict):
                cp = data.get("commune").get("code_postal", "")
                ville = data.get("commune").get("libelle", "")
            
            full_addr = f"{adresse}"
            if cp or ville:
                full_addr += f", {cp} {ville}"
            
            if nom and nom.lower() not in full_addr.lower():
                 full_addr = f"{nom}, {full_addr}"

            SALLE_CACHE[salle_id] = full_addr
            return full_addr
    except Exception as e:
        print(f"Error fetching salle {salle_id}: {e}")
    return None

def get_match_details_address(match_id, api_token):
    if match_id in MATCH_DETAILS_CACHE:
        return MATCH_DETAILS_CACHE[match_id]

    url = f"{API_FFBB_BASE_URL}items/ffbbserver_rencontres/{match_id}"
    headers = {"Authorization": f"Bearer {api_token}", "user-agent": DEFAULT_USER_AGENT}
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json().get("data", {})
            salle_id = data.get("salle")
            if salle_id:
                address = get_salle_address(salle_id, api_token)
                MATCH_DETAILS_CACHE[match_id] = address
                return address
    except Exception as e:
        print(f"Error fetching match {match_id}: {e}")
    return None

def normalize_team_name(name):
    return name.lower().replace("-", " ").replace(" ", "")

def fix_address(db, ffbb_client, api_token, dry_run=True):
    matches_ref = db.collection("matches")
    # Fetch all future matches or all matches? Let's do all for now or filter by date?
    # User likely cares about future. But let's check all to be safe.
    docs = matches_ref.stream()

    print(f"\n--- {'DRY RUN' if dry_run else 'LIVE UPDATE'} MODE ---\n")
    
    # Pre-fetch Club Engagements
    # Assuming most matches are from SCBA
    club_id = CLUB_MAPPING.get("SCBA", 9326)
    print(f"Fetching engagements for Club ID {club_id}...")
    org = ffbb_client.get_organisme(club_id)
    if not org or not org.engagements:
        print("Could not fetch club engagements.")
        return

    # Map: Date -> [List of Matches in Club's Poules]
    # To avoid iterating all poules for every match document
    print("Building Match Index from FFBB (this may take a moment)...")
    ffbb_matches_by_date = {} # "YYYY-MM-DD" -> [MatchObj, ...]

    # We only care about poules referenced in engagements
    # To optimize, we can fetch poules lazily or pre-fetch all.
    # Given the number of engagements (31), pre-fetching might be slow but robust.
    # Let's do lazy: Fetch poule only if we haven't seen it. 
    # But we need to match by DATE. So we need to index. 
    # Let's iterate engagements, fetch poules, and index matches.
    
    total_engagements = len(org.engagements)
    print(f"Found {total_engagements} engagements. Scanning poules...")
    
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def fetch_poule_matches(engagement):
        poule_id_obj = getattr(engagement, 'idPoule', None)
        if not poule_id_obj: return []
        
        poule_id = poule_id_obj.id if hasattr(poule_id_obj, 'id') else str(poule_id_obj)
        
        if poule_id in POULE_CACHE:
            return POULE_CACHE[poule_id]

        poule_data = ffbb_client.get_poule(poule_id)
        matches = []
        if poule_data and poule_data.rencontres:
            matches = poule_data.rencontres
            POULE_CACHE[poule_id] = matches
        return matches

    # Use ThreadPool to fetch poules faster
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_poule_matches, eng): eng for eng in org.engagements}
        for future in as_completed(futures):
            matches = future.result()
            for m in matches:
                # m is RencontresHit or dict?
                # It's from GetPouleResponse, so it's a model object.
                # Access fields directly
                d = getattr(m, 'date_rencontre', '')
                if d:
                    # Check if d is datetime or string
                    if isinstance(d, datetime):
                        date_str = d.strftime("%Y-%m-%d")
                    else:
                        date_str = str(d).split("T")[0]
                        
                    if date_str not in ffbb_matches_by_date:
                        ffbb_matches_by_date[date_str] = []
                    ffbb_matches_by_date[date_str].append(m)

    print(f"Indexed {sum(len(v) for v in ffbb_matches_by_date.values())} matches from FFBB.")

    # Process Firestore Docs
    updated_count = 0
    skipped_count = 0
    
    for doc in docs:
        data = doc.to_dict()
        match_id = doc.id
        location = data.get("location", "").strip()
        team_name = data.get("team", "") # e.g. "U18 M1" or "SCBA U18"
        opponent_name = data.get("opponent", "")
        match_date = data.get("dateISO", "") # e.g. "2024-11-23"
        
        # Check if update is needed
        is_incomplete = len(location) < 15 or not any(char.isdigit() for char in location)
       
        new_location = None
        source = ""

        # Strategy 1: Known Venues
        for key, val in KNOWN_VENUES.items():
            if key.lower() in location.lower(): 
                new_location = val
                source = "Known Venue Map"
                break
        
        # Strategy 2: FFBB Match Lookup
        if not new_location and is_incomplete:
            # Look for match in ffbb_matches_by_date
            candidates = ffbb_matches_by_date.get(match_date, [])
            
            # Filter by Opponent Name (fuzzy match)
            # Firestore: "CLERMONT BASKET" vs FFBB: "CLERMONT BASKET - 2"
            
            best_match = None
            
            for m in candidates:
                # m properties: nomEquipe1, nomEquipe2
                n1 = normalize_team_name(m.nomEquipe1)
                n2 = normalize_team_name(m.nomEquipe2)
                
                opp_norm = normalize_team_name(opponent_name)
                
                # Check if opponent is in n1 or n2
                # Also check if Club ("Stade Clermontois") is in the OTHER team roughly
                # Or just opponent match is enough if unique on that date.
                
                if (opp_norm in n1) or (opp_norm in n2):
                    best_match = m
                    break
            
            if best_match:
                # Fetch details
                # best_match.id
                addr = get_match_details_address(best_match.id, api_token)
                if addr:
                    new_location = addr
                    source = f"FFBB Match ID {best_match.id}"

        # Strategy 3: FFBB Search (Fallback)
        if not new_location and is_incomplete and location:
             # Try simple search
             try:
                res = ffbb_client.search_salles(location)
                if res and res.hits:
                    top = res.hits[0]
                    # Logic to extract address from top hit...
                    # (Simplified from previous attempts)
                    carto = getattr(top, 'cartographie', None)
                    if carto and isinstance(carto, dict):
                         new_location = f"{top.libelle}, {carto.get('adresse')}, {carto.get('code_postal')} {carto.get('ville')}"
                         source = f"FFBB Search ({location})"
             except:
                 pass

        if new_location and new_location != location:
            print(f"[{match_id}] UPDATE FOUND:")
            print(f"    Date   : {match_date}")
            print(f"    Match  : {team_name} vs {opponent_name}")
            print(f"    Current: {location}")
            print(f"    New    : {new_location}")
            print(f"    Source : {source}")
            
            if not dry_run:
                matches_ref.document(match_id).update({"location": new_location})
                print(f"    -> APPLIED")
            updated_count += 1
        else:
            if is_incomplete:
                print(f"[{match_id}] SKIPPED (Incomplete):")
                print(f"    Date   : {match_date}")
                print(f"    Match  : {team_name} vs {opponent_name}")
                print(f"    Current: {location}")
                # Debug candidate matches
                candidates = ffbb_matches_by_date.get(match_date, [])
                if candidates:
                    print(f"    FFBB Candidates on {match_date}: {len(candidates)}")
                    for c in candidates:
                        print(f"      - {c.nomEquipe1} vs {c.nomEquipe2} (ID: {c.id})")
                else:
                    print(f"    No FFBB candidates found for date {match_date}")
            skipped_count += 1

    print("\n--- SUMMARY ---")
    print(f"Updated:   {updated_count}")
    print(f"Skipped:   {skipped_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix match addresses in Firestore.")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without applying them.")
    parser.add_argument("--no-dry-run", action="store_false", dest="dry_run", help="Apply changes permanently.")
    parser.set_defaults(dry_run=True)
    
    args = parser.parse_args()

    db = init_firebase()
    client, api_token = init_ffbb()
    
    fix_address(db, client, api_token, dry_run=args.dry_run)
