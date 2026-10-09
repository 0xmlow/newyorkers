#!/bin/bash
# After any change to the SKELLY CUP holder paintings (contest/out): relink wave 36, redo its face crops, collect,
# sync the honoraries, publish the MetroCards. Then build_skelly.py, build_honor_cards.py, build_honoraries.py.
set -e
C="$(cd "$(dirname "$0")" && pwd)"; ROOT="$C/../.."
python3 "$C/make_wave36.py"
( cd "$ROOT/HONORARIES HYPE FILM 2026-09-26/_work" && python3 - <<'PY'
import json, os, re
n = 0
for p in json.load(open("manifest.json")):
    if p["wave"] != 36: continue
    for f in [os.path.join("crops", re.sub(r"[^a-z0-9]+", "_", p["key"]) + ".jpg"), p.get("pfp_s", ""), p.get("hero_s", "")]:
        if f and os.path.exists(f): os.remove(f); n += 1
print("  cleared", n, "wave 36 crops and film stills")
PY
)
( cd "$ROOT/HONORARIES HYPE FILM 2026-09-26/_engine" && python3 collect.py | tail -1 )
python3 "$C/make_wave36.py"
( cd "$ROOT/NEW YORKERS SITE/_build/honoraries" && python3 sync.py | tail -1 )
python3 "$C/publish_skelly_art.py" | head -1
