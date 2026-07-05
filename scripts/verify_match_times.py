from shared import (
    CLUB_MAPPING, init_firebase, init_ffbb, normalize_team_name,
    extract_team_number_local, extract_team_number_ffbb,
    extract_category_local, extract_gender_local
)
import argparse
import time
from datetime import datetime

# Cache
POULE_CACHE = {} # poule_id -> list of matches

def verify_times(db, ffbb_client, fix=False):
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
    client = init_ffbb()

    verify_times(db, client, fix=args.fix)
