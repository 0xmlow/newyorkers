#!/usr/bin/env python3
"""MoMLOW v2: the data, atlases, posters, loops, textures, HDRIs and props for the museum after MoMA.

Reads the census from the site repo (NEW YORKERS SITE/api/pieces.json, minted.json, eras.json), asks the curator
(curator.py, taste.json) to gate and rank every piece, and writes into site/assets:

  data.json         every show on every floor with its works in hanging order (title, number, era, borough, story,
                    thumb file, who collected it, sharpness), the curator's note per show, the eras, the posters, the loops
  atlas/a<k>.jpg    12 x 12 tiles of 320 x 180, one per hung work, for the far hang (the full painting streams in near you)
  posters/          the lobby and facade banners (MLow's movie posters) and the store wall (his street posters)
  loops/            motion loops and glitch editions as mp4, for the media gallery screens
  tex/              CC0 photo surfaces from the museum kit    hdri/   the kit's day, golden hour and night skies
  glb/              MLow's Tripo heroes, the kit's CC0 props, ON LOCATION's NEW YORKERS props (Draco), the draco decoder
  taxi/screens.jpg  the MLOW topper screens atlas              logo.png, mlow_logo.png, flower.png, nazar.png
  CURATOR.md        the curator's report (what it learned, what it hung first, what it refused)

Paintings themselves are not copied: ../t/ on n3wyorkers.com, https://n3wyorkers.com/assets/t/ when opened on its own.
"""
import json, os, shutil, subprocess, time, collections, glob, re, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from curator import Curator, TASTE

H = os.path.dirname(os.path.abspath(__file__)); GAL = os.path.dirname(H); ROOT = os.path.dirname(GAL)
SITE = os.path.join(ROOT, "NEW YORKERS SITE"); OUT = os.path.join(GAL, "site", "assets")
ONLOC = os.path.join(ROOT, "ON LOCATION 2026-10-10", "site", "assets"); MARKS = os.path.join(ROOT, "THE MARKS GALLERY 2026-10-09", "work", "glb_pass")
POSTERS = os.path.join(ROOT, "ALL-NEW-YORKERS-POSTERS")
J = lambda p: json.load(open(p, encoding="utf-8"))
os.makedirs(OUT, exist_ok=True)

P = J(os.path.join(SITE, "api", "pieces.json")); E = J(os.path.join(SITE, "api", "eras.json"))
M = J(os.path.join(SITE, "api", "minted.json"))["census"]
by_n = {p["n"]: p for p in P}
cur = Curator(P)
open(os.path.join(GAL, "CURATOR.md"), "w", encoding="utf-8").write(cur.report())

def rec(p):
    f = p["image"].split("/assets/t/")[-1]; m = M.get(str(p["n"]))
    return {"n": p["n"], "t": p["title"], "e": p["era"], "b": p.get("borough") or "", "h": p.get("neighborhood") or p.get("location") or "",
            "s": (p.get("story") or "").strip(), "f": f, "m": (m.get("x") or m.get("o") or "") if m else None, "set": p.get("set") or "",
            "fam": p.get("family") or "", "q": round(cur.qc[p["n"]]["sharp"]), "ts": round(cur.score[p["n"]], 2)}

used = set()
shows = collections.OrderedDict()
def show(key, name, floor, why, pool, cap, theme=None):
    ranked = [p for p in cur.rank(pool, theme) if p["n"] not in used]
    minted = [p for p in ranked if str(p["n"]) in M]; rest = [p for p in ranked if str(p["n"]) not in M]
    # the curator's order, but what has been collected leads: the collected wall is the strongest wall
    pick = (minted[:max(2, cap // 3)] + rest)[:cap]
    for p in pick: used.add(p["n"])
    shows[key] = {"name": name, "floor": floor, "why": why, "works": [rec(p) for p in pick]}

def era(*i): return [p for p in P if p["era"] in i]
def fam(*f): return [p for p in P if p.get("family") in f]

# the lobby: the strongest pieces in the census, on the title wall, and the guard by the desk
show("guard", "The desk", 0, "The MoMA Guard, No. 625, stands next to his own portrait. He never moves.", [by_n[625]], 1)
show("lobby", "The lobby wall", 0, "Four anchors from the founding eras: what the curator would hang first.", era(1, 2, 3, 4, 5, 6), 4)
# floor 2, the contemporary floor: the newest eras
show("f2_west", "The Trait Layer and The MLow Show", 2, "Eras XVIII and XIX, the newest work, hung the way MoMA hangs its contemporary floor: big, few, and lit from above.", era(18, 19), 50)
show("f2_east", "The Twenty Houses and The Ten Rooms", 2, "Eras XVI and XVII: a thousand houses and five hundred rooms, the census at its widest.", era(16, 17), 50)
show("f2_north", "The City That Answers Back", 2, "Era XV. The city starts talking.", era(15), 30)
for b, cap in [("Manhattan", 8), ("Brooklyn", 8), ("Queens", 8), ("Bronx", 8), ("Staten Island", 4)]:
    show("boro_" + b.split()[0].lower(), b, 2, f"{b}, on the atrium wall.", [p for p in P if (p.get("borough") or "").startswith(b)], cap)
# floor 3, where MoMA keeps photography, architecture and design: places, design, builders, the sets
show("f3_west", "Places", 3, "The Places family: the city as the sitter.", fam("Places"), 50)
show("f3_east", "Design and Builders", 3, "The people who drew it and the people who built it.", fam("Design", "Builders"), 50)
sets = collections.Counter(p.get("set") for p in P if p.get("set"))
show("f3_north", "The Sets", 3, "One piece from each of the biggest sets, hung together so the series read as series.", [p for p in P if p.get("set") in {s for s, c in sets.most_common(24)}], 24)
# floor 4, the middle eras
show("f4_west", "The Mythos and The Deep City", 4, "Eras VI and VII: the Rat King is crowned and the city goes underground.", era(6, 7), 50)
show("f4_east", "The Fabric and The Bloom", 4, "Eras VIII and IX: the texture of the place, then the flowers.", era(8, 9), 50)
show("f4_north", "The Look, The Waking, The Arrival", 4, "Eras X to XII.", era(10, 11, 12), 30)
# floor 5, the founding floor, where MoMA keeps its Starry Night
show("f5_west", "The Originals", 5, "Era I. The founding census: legends, neighbours, places, villains. The MoMA keeps Van Gogh here; we keep the first 766.", era(1), 50)
show("f5_east", "The Eye Flower Era and The City Expands", 5, "Eras II and III: the flowers arrive, the trades come back.", era(2, 3), 50)
show("f5_north", "The Brand Batch and The Masterworks", 5, "Eras IV and V.", era(4, 5), 30)
# floor 6, the special exhibition: the curator's themes
for t in TASTE["themes"]:
    show(t["key"], t["name"], 6, t["why"], cur.theme_pool(t["key"]), 20, theme=t["key"])
# the families that have no floor of their own hang along the sixth floor corridor
show("f6_families", "The Families", 6, "The families that do not have a floor: Citizens, Degens, Underground, Stoop, Hustlers, Heroes, Villains, Transplants, Process.", fam("Citizens", "Degens", "Underground", "Stoop", "Hustlers", "Heroes", "Villains", "Transplants", "Process"), 36)
# the garden wall: everyone who has been collected, in the order they were (no gate: the record is the record)
counted = sorted((by_n[int(k)] for k in M if int(k) in by_n), key=lambda p: M[str(p["n"])]["t"])
shows["counted"] = {"name": "The Counted", "floor": 0, "why": "Every New Yorker anyone has collected, in the order it happened. The curator has no say here.", "works": [rec(p) for p in counted]}

works = [w for s in shows.values() for w in s["works"]]
print("shows:", {k: len(v["works"]) for k, v in shows.items()}, "total", len(works), "refused", len(cur.refused))

# ---- atlases: 320 x 180 tiles, 12 x 12 per sheet ----
G, TW, TH = 12, 320, 180
AT = os.path.join(OUT, "atlas"); os.makedirs(AT, exist_ok=True)
for old in glob.glob(os.path.join(AT, "*.jpg")): os.remove(old)
sheets = (len(works) + G * G - 1) // (G * G)
for k in range(sheets):
    sheet = Image.new("RGB", (G * TW, G * TH), (14, 18, 26))
    for i, w in enumerate(works[k * G * G:(k + 1) * G * G]):
        im = Image.open(os.path.join(SITE, "assets", "t", w["f"])).convert("RGB")
        if im.size != (TW, TH): im = im.resize((TW, TH), Image.LANCZOS)
        sheet.paste(im, ((i % G) * TW, (i // G) * TH)); w["a"] = k; w["i"] = i
    sheet.save(os.path.join(AT, f"a{k}.jpg"), "JPEG", quality=76, optimize=True, progressive=True)
print("atlases:", sheets, [f"{os.path.getsize(os.path.join(AT, f'a{k}.jpg')) // 1024} KB" for k in range(sheets)])

# ---- posters: the movie posters as banners, the street posters for the store ----
PO = os.path.join(OUT, "posters"); os.makedirs(PO, exist_ok=True)
for old in glob.glob(os.path.join(PO, "*.jpg")): os.remove(old)
def tall(src, dst, h):
    im = Image.open(src).convert("RGB"); im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    im.save(dst, "JPEG", quality=84, optimize=True, progressive=True)
banners = []
for i, f in enumerate(sorted(glob.glob(os.path.join(POSTERS, "MOVIE-*.png")))):
    name = re.sub(r"^MOVIE-\d+-", "", os.path.basename(f))[:-4].replace("-", " ")
    tall(f, os.path.join(PO, f"banner_{i:02d}.jpg"), 1024); banners.append({"f": f"banner_{i:02d}.jpg", "t": name})
hero = os.path.join(POSTERS, "LAUNCH-hero-poster.png")
if os.path.exists(hero): tall(hero, os.path.join(PO, "hero.jpg"), 1024)
store = []
for i, f in enumerate(sorted(glob.glob(os.path.join(SITE, "assets", "posters", "street*s.jpg")))):
    tall(f, os.path.join(PO, f"store_{i:02d}.jpg"), 480); store.append(f"store_{i:02d}.jpg")
print("posters:", len(banners), "banners,", len(store), "store")

# ---- loops: motion loops for the pieces the curator rates highest, and the glitch editions ----
LO = os.path.join(OUT, "loops"); os.makedirs(LO, exist_ok=True)
for old in glob.glob(os.path.join(LO, "*.mp4")): os.remove(old)
loops = []
motion, glitch = {}, {}
for f in glob.glob(os.path.join(SITE, "n", "*.html")):
    n = os.path.basename(f)[:-5]
    if not n.isdigit(): continue
    try: s = open(f, encoding="utf-8", errors="ignore").read()
    except Exception: continue
    m = re.search(r'assets/motion/([0-9a-f]+\.mp4)', s); g = re.search(r'assets/glitch/([0-9a-f]+\.mp4)', s)
    if m: motion[int(n)] = m.group(1)
    if g: glitch[int(n)] = g.group(1)
ranked = cur.rank(P)
for p in ranked:
    if len([l for l in loops if l["k"] == "motion"]) >= 10: break
    if p["n"] in motion and cur.ok(p):
        src = os.path.join(SITE, "assets", "motion", motion[p["n"]])
        if os.path.getsize(src) > 3.2e6: continue
        dst = f"m_{p['n']}.mp4"; shutil.copy2(src, os.path.join(LO, dst)); loops.append({"n": p["n"], "t": p["title"], "f": dst, "k": "motion", "tag": "motion loop"})
GI = J(os.path.join(SITE, "_build", "glitch_index.json"))
for p in ranked:
    if len([l for l in loops if l["k"] == "glitch"]) >= 6: break
    if p["n"] in glitch and cur.ok(p):
        src = os.path.join(SITE, "assets", "glitch", glitch[p["n"]])
        if os.path.getsize(src) > 2.6e6: continue
        dst = f"g_{p['n']}.mp4"; shutil.copy2(src, os.path.join(LO, dst)); gi = GI.get(str(p["n"]), {})
        loops.append({"n": p["n"], "t": p["title"], "f": dst, "k": "glitch", "tag": (gi.get("fam", "") + ". " + gi.get("tag", "")).strip(". ")})
print("loops:", len(loops), f"{sum(os.path.getsize(os.path.join(LO, l['f'])) for l in loops) / 1e6:.0f} MB")

# ---- data.json ----
data = {"built": time.strftime("%Y-%m-%d %H:%M"), "grid": G, "tile": [TW, TH],
        "eras": {e["i"]: {"r": e["roman"], "t": e["title"], "s": e["sub"], "n": e["count"]} for e in E},
        "shows": shows, "posters": {"banners": banners, "store": store, "hero": "hero.jpg" if os.path.exists(hero) else None}, "loops": loops,
        "taste": {"positives": len(cur.positives), "refused": len(cur.refused), "top": [k for v, k in sorted(((v, k) for k, v in cur.weights.items() if ":" not in k), reverse=True)[:24]]},
        "counts": {"works": len(works), "counted": len(shows["counted"]["works"]), "census": len(P), "eras": len(E), "hung": len(works) - len(shows["counted"]["works"])}}
open(os.path.join(OUT, "data.json"), "w", encoding="utf-8").write(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
print("data.json", os.path.getsize(os.path.join(OUT, "data.json")) // 1024, "KB")

# ---- textures, skies, props ----
def clone(a, b):
    if not os.path.exists(a): print("  missing", a); return
    os.makedirs(os.path.dirname(b), exist_ok=True)
    if os.path.exists(b) and os.path.getsize(a) == os.path.getsize(b): return
    if subprocess.run(["cp", "-c", a, b], capture_output=True).returncode != 0: shutil.copy2(a, b)
S = os.path.join(SITE, "assets", "museum")
RAW = os.path.join(GAL, "work", "glb_raw"); os.makedirs(RAW, exist_ok=True)   # models land here raw; draco.py compresses them into site/assets/glb
for s in ["terrazzo", "planks", "plaster", "marble", "concrete", "asphalt", "pavers", "brick", "grass", "steel", "ashlar", "cobble"]:
    for k in "cnr": clone(os.path.join(S, "surfaces", f"{s}_{k}.jpg"), os.path.join(OUT, "tex", f"{s}_{k}.jpg"))
for h in ["day", "golden", "night"]: clone(os.path.join(S, "hdri", f"{h}.hdr"), os.path.join(OUT, "hdri", f"{h}.hdr"))
clone(os.path.join(S, "taxi", "screens.jpg"), os.path.join(OUT, "taxi", "screens.jpg"))
KIT = ["h_taxi", "h_taxi_camry", "h_taxi_escape", "h_taxi_nv200", "h_taxi_sienna", "lamppost", "mailbox", "hydrant", "pigeon", "gull", "dog", "museum_bench", "quiet_bench",
       "bronze_figure", "mlow_eye_monument", "noguchi_stone_1", "noguchi_stone_2", "noguchi_stone_3", "equestrian", "bust_plinth", "track_light", "blossom_01", "blossom_03", "blossom_06",
       "mlow_wordmark_relief", "rope_stanchion", "vitrine", "liberty_statue", "mobile", "sauropod_skeleton", "h_subway_car", "h_carousel_horse", "h_clock_bear", "h_clock_elephant",
       "h_clock_goat", "h_clock_hippo", "h_clock_kangaroo", "h_clock_penguin", "water_tower", "fire_escape", "cp_fountain", "nutcracker", "armillary", "caryatid", "sealion_swim",
       "swan", "koi", "turtle", "penn_newsstand", "penn_stanchion", "penn_turnstile", "hf_lamp", "hf_railing", "hf_pedestal", "torchere", "utility_pole", "storm_drain", "cp_vitrine", "cp_gaslamp",
       "h_irt_kiosk", "h_yellin_lantern", "h_ferry", "h_tug", "blue_whale", "bell", "sarcophagus", "globe_stand", "stoop", "fence", "cp_carriage", "cp_globe", "cp_palm", "cp_press", "cp_statue", "cp_bench",
       "penn_eagle", "penn_census_desk", "penn_shoeshine", "penn_luggage", "penn_baggage_wagon", "penn_lamp", "penn_capital", "barney_greengrass", "blossom_02", "blossom_04", "blossom_05", "blossom_07",
       "blossom_icons", "hook", "porthole", "ships_wheel", "buoy", "cleat", "lobster_trap", "life_ring", "corinthian_capital", "ionic_capital", "newel_urn", "palm_urn", "lantern", "h_forklift", "captains_hat"]
for p in KIT: clone(os.path.join(S, "props", f"{p}.glb"), os.path.join(RAW, f"{p}.glb"))
for t in ["tree_plane", "tree_willow", "tree_ginkgo"]: clone(os.path.join(S, "trees", f"{t}.glb"), os.path.join(RAW, f"{t}.glb"))
ONL = ["nyb_coffeecart", "hotdog", "nyb_barrier", "nyb_aframe_sign", "ph_planter_box_01", "ph_potted_plant_01", "ph_potted_plant_02", "ph_modular_street_seating", "ph_metal_trash_can",
       "ph_concrete_road_barrier", "ph_CashRegister_01", "ph_Shelf_01", "ph_wooden_display_shelves_01", "ph_WoodenTable_01", "ph_dining_chair_02", "ph_bar_chair_round_01", "ph_Sofa_01",
       "ph_marble_bust_01", "ph_gothic_statue", "ph_bronze_whale_statue", "ph_modern_ceiling_lamp_01", "ph_mounted_fluorescent_lights", "ph_security_light", "cabbie", "pigeonlady", "mlowtar",
       "ph_round_wooden_table_01", "ph_mid_century_lounge_chair", "ph_modern_arm_chair_01", "ph_hand_truck", "ph_wooden_crate_01", "ph_steel_frame_shelves_03", "ph_postcard_set_01",
       "ph_fancy_picture_frame_01", "ph_ornate_mirror_01", "ph_vintage_grandfather_clock_01", "ph_portable_searchlight", "ph_shrub_01", "ph_shrub_02",
       "boxer", "dancer", "actress", "folksinger", "broker", "hustler", "bartender", "writer", "usher", "agent", "auggie", "felix", "lensman", "maitre", "wiseguy", "workgirl",
       "nyb_afterhours_phone", "nyb_diehard_phone", "nyb_devils_lion", "nyb_crown_bust", "nyb_bigbusiness_planter", "nyb_chainlink", "nyb_annie_chandelier", "nyb_disco_chandelier", "nyb_hydrant_gold", "nyb_hydrant_pink",
       "ph_modular_fire_escape", "ph_water_manhole_cover", "ph_painted_wooden_bench"]
for p in ONL: clone(os.path.join(ONLOC, "glb", f"{p}.glb"), os.path.join(RAW, f"{p}.glb"))
# the visitors: whole cast members cut light by _build/crowd_pass.py (2,500 tris, 512 px), kept in _build/crowd
for f in sorted(os.listdir(os.path.join(H, "crowd"))):
    if f.endswith(".glb"): clone(os.path.join(H, "crowd", f), os.path.join(RAW, f))
# the same cast rigged (UPGRADE ALL ROOMS 2026-10-28/rig, copied into _build/rig): skinned, no Draco, straight into assets/glb/rig
for f in sorted(os.listdir(os.path.join(H, "rig"))):
    if f.endswith(".glb"): clone(os.path.join(H, "rig", f), os.path.join(OUT, "glb", "rig", f))
for p in ["cat", "rat", "newsstand", "turnstile", "taker", "monte", "dispenser", "stamp", "seal", "tower"]: clone(os.path.join(MARKS, f"{p}.glb"), os.path.join(RAW, f"marks_{p}.glb"))
for f in ["draco_decoder.js", "draco_decoder.wasm", "draco_wasm_wrapper.js"]: clone(os.path.join(ONLOC, "draco", f), os.path.join(OUT, "draco", f))
clone(os.path.join(SITE, "assets", "brand", "logos", "n3w-01.png"), os.path.join(OUT, "logo.png"))
for u in ["flower.png", "nazar.png", "tile.webp", "mosaic.webp", "mosaic-eye.webp", "brick.webp", "roofs.webp", "pigeon.png", "pizza.png", "token.png"]: clone(os.path.join(SITE, "assets", "ui", u), os.path.join(OUT, u))
subprocess.run([sys.executable, os.path.join(H, "draco.py")], check=False)
size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
print(f"site/assets: {size / 1e6:.1f} MB")
