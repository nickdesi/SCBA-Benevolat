#!/usr/bin/env python3
"""
Exporteur JSON des matchs FFBB utilisant ffbb-data-client pour SCBA Bénévolat.
"""

import sys
import io
import os
import json
import argparse
from contextlib import redirect_stdout, redirect_stderr

# Ensure quiet execution
sys.path.append(os.path.dirname(__file__))
from import_ffbb_matches import (
    init_ffbb,
    fetch_all_scba_matches,
    process_match,
)

def main():
    parser = argparse.ArgumentParser(description="Export FFBB Matches to JSON")
    parser.add_argument("--team", type=str, default=None, help="Filtrer sur une équipe")
    args = parser.parse_args()

    # Capture any prints to avoid corrupting json stdout
    trap_io = io.StringIO()
    with redirect_stdout(trap_io), redirect_stderr(trap_io):
        try:
            client = init_ffbb()
            raw_items = fetch_all_scba_matches(client)

            games = []
            for item in raw_items:
                g = process_match(client, item)
                if args.team and args.team != "ALL" and args.team.upper() not in g["team"].upper():
                    continue
                games.append(g)

            games.sort(key=lambda x: (x.get("dateISO", ""), x.get("time", "")))

            output = {
                "matches": games,
                "count": len(games),
            }
        except Exception as e:
            output = {
                "error": str(e),
                "matches": [],
                "count": 0,
            }

    sys.stdout.write(json.dumps(output, ensure_ascii=False))

if __name__ == "__main__":
    main()
