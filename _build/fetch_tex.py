"""CC0 PBR sets from Poly Haven at 1k (diffuse, GL normal, roughness) into site/assets/tex. Credit: Poly Haven, CC0."""
import json, os, urllib.request
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, "..", "site", "assets", "tex"); os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "skelly-spiral/0.1 (NEW YORKERS x Marble Run)"}
SETS = {"ramp": "concrete_floor_01", "wall": "grey_plaster", "plaza": "concrete_pavement", "street": "asphalt_02",
        "void": "granite_tile", "paddock": "hangar_concrete_floor", "facade": "concrete_tile_facade", "brick": "brick_wall_003"}
for key, pid in SETS.items():
    files = json.load(urllib.request.urlopen(urllib.request.Request(f"https://api.polyhaven.com/files/{pid}", headers=UA), timeout=40))
    for slot, names in (("d", ("Diffuse", "diff")), ("n", ("nor_gl",)), ("r", ("Rough", "rough"))):
        ent = next((files[n] for n in names if n in files), None)
        if not ent: print(pid, "no", slot); continue
        url = ent["1k"]["jpg"]["url"]; dst = os.path.join(OUT, f"{key}_{slot}.jpg")
        if not os.path.exists(dst): open(dst, "wb").write(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())
    print(key, pid)
