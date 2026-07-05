"""
Shared utilities for scripts.
Common Firebase/FFBB initialization and team name parsing functions.
"""
import firebase_admin
from firebase_admin import credentials, firestore
from ffbb_data_client import FFBBDataClient, TokenManager
import sys
import os
import re

# Map Team Name (in Firestore) -> FFBB Club ID
CLUB_MAPPING = {
    "Stade Clermontois Basket Auvergne": 9326,
    "SCBA": 9326,
    "STADE CLERMONTOIS BASKET AUVERGNE": 9326,
}

def init_firebase():
    try:
        key_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', 'serviceAccountKey.json')
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        print(f"Initialized Firebase with {key_path}.")
    except Exception as e:
        print(f"Failed to init Firebase: {e}")
        sys.exit(1)
    return firestore.client()

def init_ffbb():
    try:
        tokens = TokenManager.get_tokens(use_cache=False)
        client = FFBBDataClient.create(api_bearer_token=tokens.api_token, meilisearch_bearer_token=tokens.meilisearch_token)
        print("Initialized FFBB Client.")
        return client
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
