#!/usr/bin/env python3
"""
Script d'importation et synchronisation 1-clic des matchs FFBB pour SCBA Bénévolat.

Récupère automatiquement toutes les rencontres du Stade Clermontois Basket Auvergne (9326),
leurs horaires, lieux/salles précises (nom, rue, CP, ville), et logos officiels FFBB,
puis synchronise la collection 'matches' de Firestore avec déduplication intelligente
et préservation des bénévoles déjà inscrits.
"""

import os
import sys
import re
import argparse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# Dépendances locales
try:
    from shared import init_firebase, init_ffbb
except ImportError:
    # Si exécuté depuis la racine
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from scripts.shared import init_firebase, init_ffbb

SCBA_ORGANISME_ID = 9326
SCBA_LOGO_URL = "https://api.ffbb.com/assets/2784a7b8-1c06-4334-aa6e-16a371475971"

# Caches
ORGANISME_CACHE = {}
ORGANISME_LOGOS_CACHE = {
    str(SCBA_ORGANISME_ID): SCBA_LOGO_URL,
    SCBA_ORGANISME_ID: SCBA_LOGO_URL,
}
SALLE_CACHE = {}

WEEKDAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

DEFAULT_ROLES_BASE = [
    {"name": "Buvette", "capacity": 2, "icon": "🍺"},
    {"name": "Chrono", "capacity": 1, "icon": "⏱️"},
    {"name": "Table de marque", "capacity": 1, "icon": "📋"},
    {"name": "Goûter", "capacity": 0, "icon": "🍪"},
]

def format_french_date(dt: datetime) -> str:
    """Formate une date en français (ex: 'Samedi 12 Décembre 2026')"""
    weekday = WEEKDAYS_FR[dt.weekday()]
    day = dt.day
    month = MONTHS_FR[dt.month - 1]
    year = dt.year
    return f"{weekday} {day} {month} {year}"

def normalize_string(s: str) -> str:
    if not s:
        return ""
    import unicodedata
    n = unicodedata.normalize('NFD', s.lower())
    n = "".join(c for c in n if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', n).strip()

def normalize_scba_team_name(team_raw: str, comp_name: str = "") -> str:
    """
    Normalise le nom de l'équipe SCBA au format standard de l'app (ex: 'SENIOR M1', 'SENIOR M2', 'U18 M1', etc.)
    """
    raw = (team_raw or "").upper().strip()
    comp = (comp_name or "").upper().strip()

    if "BABY" in raw or "BABY" in comp:
        return "U7 M1"
    if "MINI" in raw or "MINI" in comp:
        return "U9 M1"

    # Détection Catégories Jeunes U7 à U21
    m_cat = re.search(r'U\s*(\d+)', raw) or re.search(r'U\s*(\d+)', comp)
    if m_cat:
        cat = m_cat.group(1)
        m_num = re.search(r'[- ](\d+)$', raw)
        num = m_num.group(1) if m_num else "1"
        return f"U{cat} M{num}"

    # Détection Senior (PNM, RM2, RM3, DM1, DM2, DM3, PRM, etc.)
    m_num = re.search(r'[- ](\d+)$', raw)
    num = m_num.group(1) if m_num else None

    if not num:
        if "RM2" in comp or "DIVISION 2" in comp:
            num = "2"
        elif "RM3" in comp or "DIVISION 3" in comp or "DM2" in comp or "DM3" in comp or "PRM" in comp:
            num = "3"
        elif "PNM" in comp or "PRE NATIONALE" in comp or "PRÉ NATIONALE" in comp:
            num = "1"
        else:
            num = "1"

    return f"SENIOR M{num}"

def clean_opponent_name(opp_raw: str) -> str:
    """Nettoie le nom de l'adversaire pour un affichage plus lisible"""
    if not opp_raw:
        return "Adversaire Inconnu"

    cleaned = opp_raw.strip()
    cleaned = re.sub(r'^(IE\s*[-]?\s*|CTC\s*[-]?\s*)', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def get_cached_organisme(client, organisme_id):
    """Récupère l'organisme avec cache mémoire"""
    if not organisme_id:
        return None
    org_id_str = str(organisme_id)
    if org_id_str in ORGANISME_CACHE:
        return ORGANISME_CACHE[org_id_str]
    try:
        org = client.get_organisme(int(org_id_str))
        ORGANISME_CACHE[org_id_str] = org
        return org
    except Exception:
        ORGANISME_CACHE[org_id_str] = None
        return None

def get_club_logo_url(client, organisme_id) -> str | None:
    """Récupère l'URL du logo officiel d'un club via son organisme_id FFBB"""
    if not organisme_id:
        return None
    org_id_str = str(organisme_id)
    if org_id_str in ORGANISME_LOGOS_CACHE:
        return ORGANISME_LOGOS_CACHE[org_id_str]

    org = get_cached_organisme(client, organisme_id)
    if org and getattr(org, 'logo', None):
        logo_id = getattr(org.logo, 'id', None) or org.logo
        if logo_id:
            url = f"https://api.ffbb.com/assets/{logo_id}"
            ORGANISME_LOGOS_CACHE[org_id_str] = url
            return url

    ORGANISME_LOGOS_CACHE[org_id_str] = None
    return None

def resolve_exact_salle_address(client, salle_id, org_id, default_name="") -> str:
    """
    Résout l'adresse complète officielle de la salle (Nom - Rue, CP Ville)
    via l'organisme hôte et la base des salles FFBB / Meilisearch.
    """
    sid = str(salle_id) if salle_id else ""
    org_key = str(org_id) if org_id else ""
    cache_key = f"{sid}_{org_key}"

    if cache_key in SALLE_CACHE:
        return SALLE_CACHE[cache_key]

    org = get_cached_organisme(client, org_id) if org_id else None

    # 1. Vérifier si la salle principale de l'organisme hôte correspond
    if org and getattr(org, 'salle', None):
        o_salle = org.salle
        o_sid = str(getattr(o_salle, 'id', ''))
        if o_sid == sid or not sid:
            nom = getattr(o_salle, 'libelle', '') or default_name
            adr = getattr(o_salle, 'adresse', '') or ""
            commune = getattr(o_salle, 'commune', None)
            cp = getattr(commune, 'codePostal', '') if commune else ""
            v = getattr(commune, 'libelle', '') if commune else ""
            parts = [adr, f"{cp} {v}".strip()]
            full_addr = ", ".join([p for p in parts if p])
            full = f"{nom} - {full_addr}" if nom and full_addr else (nom or full_addr)
            if full:
                SALLE_CACHE[cache_key] = full
                return full

    # 2. Résolution de la salle spécifique + recherche de la commune via Meilisearch
    if sid:
        try:
            salle = client.get_salle(sid)
            if salle:
                nom = getattr(salle, 'libelle', '') or default_name
                adr = getattr(salle, 'adresse', '') or ""

                cp, v = "", ""
                try:
                    # Recherche par nom seul (plus fiable que nom+ville organisme)
                    res = client.search_salles(nom)
                    if res and res.hits:
                        # Chercher le hit avec le bon ID
                        matched_hit = None
                        for hit in res.hits:
                            if str(getattr(hit, 'id', '')) == sid:
                                matched_hit = hit
                                break
                        if not matched_hit:
                            matched_hit = res.hits[0]
                        commune = getattr(matched_hit, 'commune', None)
                        if commune:
                            cp = getattr(commune, 'code_postal', '') or ""
                            v = getattr(commune, 'libelle', '') or ""
                except Exception:
                    pass

                parts = [adr, f"{cp} {v}".strip()]
                full_addr = ", ".join([p for p in parts if p])
                full = f"{nom} - {full_addr}" if nom and full_addr else (nom or full_addr)
                if full:
                    SALLE_CACHE[cache_key] = full
                    return full
        except Exception:
            pass

    return default_name or "Lieu à confirmer"

def build_default_roles(team_name: str):
    """Génère la structure des rôles bénévoles attendue par Firestore"""
    is_senior = "SENIOR" in team_name.upper()
    roles = []
    role_id = 1
    for r in DEFAULT_ROLES_BASE:
        if r["name"] == "Goûter" and is_senior:
            continue
        roles.append({
            "id": str(role_id),
            "name": r["name"],
            "capacity": r["capacity"],  # 0 = illimité (convention app SCBA)
            "volunteers": [],
        })
        role_id += 1
    return roles

def fetch_all_scba_matches(client):
    """Parcourt les engagements et poules du SCBA pour extraire l'ensemble des rencontres détaillées"""
    print("🔍 Récupération des engagements SCBA depuis l'API FFBB...", file=sys.stderr)
    org = client.get_organisme(SCBA_ORGANISME_ID)
    engagements = getattr(org, 'engagements', []) or []
    print(f"✅ {len(engagements)} engagements trouvés pour le club.", file=sys.stderr)

    candidate_matches = []
    seen_match_ids = set()

    for eng in engagements:
        poule_obj = getattr(eng, 'idPoule', None)
        comp_obj = getattr(eng, 'idCompetition', None)

        poule_id = getattr(poule_obj, 'id', None) or (str(poule_obj) if poule_obj else None)
        comp_nom = getattr(comp_obj, 'nom', '') or ''

        if not poule_id:
            continue

        try:
            poule = client.get_poule(int(poule_id))
            rencontres = getattr(poule, 'rencontres', []) or []
            print(f"  • Poule {poule_id} ({comp_nom}) : {len(rencontres)} rencontres", file=sys.stderr)

            for m in rencontres:
                m_id = str(getattr(m, 'id', ''))
                if m_id in seen_match_ids:
                    continue

                nom_eq1 = getattr(m, 'nomEquipe1', '') or ''
                nom_eq2 = getattr(m, 'nomEquipe2', '') or ''
                id_org1 = str(getattr(m, 'idOrganismeEquipe1', ''))
                id_org2 = str(getattr(m, 'idOrganismeEquipe2', ''))

                is_scba_1 = id_org1 == str(SCBA_ORGANISME_ID) or "STADE CLERMONTOIS" in nom_eq1.upper() or "SCBA" in nom_eq1.upper()
                is_scba_2 = id_org2 == str(SCBA_ORGANISME_ID) or "STADE CLERMONTOIS" in nom_eq2.upper() or "SCBA" in nom_eq2.upper()

                if not (is_scba_1 or is_scba_2):
                    continue

                seen_match_ids.add(m_id)
                candidate_matches.append((m_id, comp_nom, is_scba_1, is_scba_2))
        except Exception as e:
            print(f"⚠️ Erreur lors de la lecture de la poule {poule_id}: {e}", file=sys.stderr)

    # Récupération détaillée en parallèle des rencontres pour obtenir la salle exacte
    def fetch_full_rencontre(item):
        m_id, comp_nom, is_scba_1, is_scba_2 = item
        try:
            full_r = client.get_rencontre(m_id)
            return {
                "raw_match": full_r,
                "comp_nom": comp_nom,
                "is_scba_1": is_scba_1,
                "is_scba_2": is_scba_2,
            }
        except Exception:
            return None

    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(fetch_full_rencontre, candidate_matches))

    return [r for r in results if r is not None]

def process_match(client, item):
    """Transforme une rencontre FFBB brute en objet Game prêt pour Firestore"""
    m = item["raw_match"]
    comp_nom = item["comp_nom"]
    is_home = item["is_scba_1"]

    nom_eq1 = getattr(m, 'nomEquipe1', '') or ''
    nom_eq2 = getattr(m, 'nomEquipe2', '') or ''
    id_org1 = getattr(m, 'idOrganismeEquipe1', None)
    id_org2 = getattr(m, 'idOrganismeEquipe2', None)
    ffbb_id = str(getattr(m, 'id', ''))

    # Date et Heure
    date_str = getattr(m, 'date', '') or ''
    date_rencontre = getattr(m, 'date_rencontre', '') or ''
    horaire = getattr(m, 'horaire', '') or ''

    # Extraction ISO date
    date_iso = ""
    if date_str and re.match(r'^\d{4}-\d{2}-\d{2}', date_str):
        date_iso = date_str[:10]
    elif date_rencontre and re.match(r'^\d{4}-\d{2}-\d{2}', str(date_rencontre)):
        date_iso = str(date_rencontre)[:10]

    # Extraction Time
    time_str = "15:00"
    if horaire:
        h_clean = str(horaire).replace('h', '').replace('H', '').replace(':', '').strip()
        if len(h_clean) == 4:
            time_str = f"{h_clean[:2]}:{h_clean[2:]}"
        elif len(h_clean) == 2:
            time_str = f"{h_clean}:00"
    elif date_rencontre and " " in str(date_rencontre):
        time_part = str(date_rencontre).split(" ")[1][:5]
        if ":" in time_part:
            time_str = time_part

    # Date formatée en français
    formatted_date = ""
    if date_iso:
        try:
            dt = datetime.strptime(date_iso, "%Y-%m-%d")
            formatted_date = format_french_date(dt)
        except Exception:
            formatted_date = date_iso

    # Identification Equipes & Adversaire
    if is_home:
        scba_team = normalize_scba_team_name(nom_eq1, comp_nom)
        opponent = clean_opponent_name(nom_eq2)
        opp_org_id = id_org2
    else:
        scba_team = normalize_scba_team_name(nom_eq2, comp_nom)
        opponent = clean_opponent_name(nom_eq1)
        opp_org_id = id_org1

    # Logos
    team_logo = SCBA_LOGO_URL
    opp_logo = get_club_logo_url(client, opp_org_id)

    # Salle & Lieu
    salle_id = getattr(m, 'salle', None)
    if is_home:
        location = resolve_exact_salle_address(
            client,
            salle_id=salle_id,
            org_id=SCBA_ORGANISME_ID,
            default_name="Maison des Sports, Place des Bughes, 63000 Clermont-Ferrand"
        )
    else:
        location = resolve_exact_salle_address(
            client,
            salle_id=salle_id,
            org_id=opp_org_id,
            default_name=f"Extérieur ({opponent})"
        )

    game_data = {
        "ffbbMatchId": ffbb_id,
        "team": scba_team,
        "opponent": opponent,
        "date": formatted_date,
        "dateISO": date_iso,
        "time": time_str,
        "location": location,
        "isHome": is_home,
        "competition": comp_nom,
        "teamLogo": team_logo,
    }

    if opp_logo:
        game_data["opponentLogo"] = opp_logo

    return game_data

def sync_matches_to_firestore(db, games, dry_run=False):
    """Synchronise la liste des matchs dans Firestore sans écraser les bénévoles/covoiturages"""
    print(f"\n📡 Synchronisation de {len(games)} matchs avec Firestore...")

    existing_docs = list(db.collection('matches').stream())
    print(f"📦 {len(existing_docs)} matchs actuellement dans Firestore.")

    existing_by_ffbb_id = {}
    existing_by_key = {}

    for doc in existing_docs:
        d = doc.to_dict()
        doc_id = doc.id
        if d.get("ffbbMatchId"):
            existing_by_ffbb_id[str(d["ffbbMatchId"])] = (doc_id, d)

        key = (
            d.get("dateISO"),
            normalize_string(d.get("team", "")),
            d.get("isHome"),
            normalize_string(d.get("opponent", "")[:6])
        )
        existing_by_key[key] = (doc_id, d)

    created_count = 0
    updated_count = 0
    unchanged_count = 0

    for g in games:
        ffbb_id = g.get("ffbbMatchId")
        key = (
            g.get("dateISO"),
            normalize_string(g.get("team", "")),
            g.get("isHome"),
            normalize_string(g.get("opponent", "")[:6])
        )

        matched_doc = existing_by_ffbb_id.get(ffbb_id) or existing_by_key.get(key)

        if matched_doc:
            doc_id, existing_data = matched_doc
            update_payload = {
                "ffbbMatchId": ffbb_id,
                "date": g["date"],
                "dateISO": g["dateISO"],
                "time": g["time"],
                "location": g["location"],
                "competition": g["competition"],
                "teamLogo": g["teamLogo"],
            }
            if g.get("opponentLogo"):
                update_payload["opponentLogo"] = g["opponentLogo"]

            differs = any(existing_data.get(k) != v for k, v in update_payload.items() if v is not None)

            if differs:
                if not dry_run:
                    db.collection('matches').document(doc_id).update(update_payload)
                print(f"  🔄 [UPDATE] {g['team']} vs {g['opponent']} ({g['dateISO']} {g['time']}) -> ID: {doc_id}")
                updated_count += 1
            else:
                unchanged_count += 1
        else:
            new_match_data = {
                **g,
                "roles": build_default_roles(g["team"]) if g["isHome"] else [],
                "carpool": [] if not g["isHome"] else [],
            }
            if not dry_run:
                new_ref = db.collection('matches').add(new_match_data)
                print(f"  ✨ [NEW] {g['team']} vs {g['opponent']} ({g['dateISO']} {g['time']}) -> ID: {new_ref[1].id}")
            else:
                print(f"  ✨ [NEW - DRY RUN] {g['team']} vs {g['opponent']} ({g['dateISO']} {g['time']})")
            created_count += 1

    print("\n" + "="*50)
    print(f"📊 BILAN SYNCHRONISATION {'(MODE SIMULATION - DRY RUN)' if dry_run else ''}:")
    print(f"  • Nouveaux matchs créés : {created_count}")
    print(f"  • Matchs mis à jour     : {updated_count}")
    print(f"  • Matchs inchangés      : {unchanged_count}")
    print("="*50 + "\n")

def main():
    parser = argparse.ArgumentParser(description="Synchronisation 1-clic FFBB -> SCBA Bénévolat")
    parser.add_argument("--dry-run", action="store_true", help="Prévisualiser sans écrire dans Firebase")
    parser.add_argument("--team", type=str, default=None, help="Filtrer sur une équipe (ex: 'SENIOR M1')")
    args = parser.parse_args()

    print("🚀 Démarrage de l'import automatisé FFBB...")
    client = init_ffbb()
    db = init_firebase()

    raw_items = fetch_all_scba_matches(client)
    if not raw_items:
        print("ℹ️ Aucune rencontre trouvée sur la FFBB pour le moment (poules non encore publiées).")
        return

    print(f"\n⚙️ Traitement de {len(raw_items)} rencontres...")
    games = []
    for item in raw_items:
        g = process_match(client, item)
        if args.team and args.team.upper() not in g["team"].upper():
            continue
        games.append(g)

    games.sort(key=lambda x: (x.get("dateISO", ""), x.get("time", "")))
    sync_matches_to_firestore(db, games, dry_run=args.dry_run)

if __name__ == "__main__":
    main()
