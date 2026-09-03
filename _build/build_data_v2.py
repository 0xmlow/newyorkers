#!/usr/bin/env python3
"""NEW YORKERS site data build v2.

Character-level catalogue (era 1 = 344 subjects from catalog_subjects.json with all
finished states; eras 2-7 = 1,500 roster pieces), stories merged from
descriptions.json + generated stories batches, curation, network edges,
thumbnails for every state, texture atlases.
"""
import csv, json, os, re, sys
from multiprocessing import Pool

ROOT = "/Users/degens/Desktop/NEW YORKERS BY MLOW"
ARCHIVE = os.path.join(ROOT, "NEW YORKERS MASTER ARCHIVE")
SITE = os.path.join(ROOT, "NEW YORKERS SITE")
ASSETS = os.path.join(SITE, "assets")
THUMB_DIR = os.path.join(ASSETS, "t")
ATLAS_DIR = os.path.join(ASSETS, "atlas")
BUILD = os.path.join(SITE, "_build")
NY_REF = os.path.join(ROOT, "new-yorkers", "references", "data")

ERA1 = os.path.join(ARCHIVE, "01_THE ORIGINALS 001-766")
ERA_DIRS = {2: "02_THE EYE FLOWER ERA 767-816", 3: "03_THE CITY EXPANDS 817-966",
            4: "04_THE BRAND BATCH 967-1166", 5: "05_THE MASTERWORKS 1167-1466",
            6: "06_THE MYTHOS 1467-1866", 7: "07_THE DEEP CITY 1867-2266"}

def era_of(num):
    for hi, e in ((766,1),(816,2),(966,3),(1166,4),(1466,5),(1866,6)):
        if num <= hi: return e
    return 7

# ---------- indices ----------
era1_index = {}
for root, dirs, files in os.walk(ERA1):
    for f in files:
        if not f.startswith("."):
            era1_index[f] = os.path.relpath(os.path.join(root, f), ARCHIVE)

manifest = list(csv.DictReader(open(os.path.join(ARCHIVE, "MASTER MANIFEST.csv"))))
canon = [r for r in manifest if r["keep"] == "canonical"]
by_orig = {}
for r in canon:
    by_orig.setdefault(r["original_filename"], []).append(r)

subjects = json.load(open(os.path.join(NY_REF, "catalog_subjects.json")))
descriptions = json.load(open(os.path.join(NY_REF, "descriptions.json")))

# ---------- era 1 characters from subject catalogue ----------
pieces = []
used_rows = set()
unnum_i = 0
for s in sorted(subjects, key=lambda s: (s["num"] is None, int(s["num"]) if s["num"] else 0, s["subject_id"])):
    states, gifs, vids, claimed = [], [], [], []
    for orig in s["files"]:
        for r in by_orig.get(orig, []):
            rel = era1_index.get(r["new_filename"])
            if rel is None: continue
            claimed.append(r)
            if r["media"] == "image": states.append((r["new_filename"], rel))
            elif r["media"] == "gif": gifs.append(rel)
            elif r["media"] == "video": vids.append(rel)
    states.sort()
    if not states: continue  # stateless subjects release their media claims to the motion room
    for r in claimed: used_rows.add(id(r))
    num = int(s["num"]) if s["num"] else None
    pid = str(num) if num is not None else f"x{unnum_i:03d}"
    if num is None: unnum_i += 1
    pieces.append({
        "id": pid, "n": num, "t": s["name"], "f": s["family"], "b": s.get("borough",""),
        "e": 1, "cat": s.get("cultural_category",""),
        "story": descriptions.get(s["subject_id"], ""),
        "srcs": [rel for _, rel in states], "g": gifs, "v": vids,
    })

# manifest era-1 motion rows not claimed by any subject -> standalone motion room
motion = []
for r in canon:
    num = r["num"].strip()
    if num.isdigit() and int(num) > 766: continue
    if r["media"] in ("gif", "video") and id(r) not in used_rows:
        rel = era1_index.get(r["new_filename"])
        if rel: motion.append({"t": r["name"] or "Untitled", "f": r["family"], "src": rel, "kind": r["media"]})

n_era1 = len(pieces)

# ---------- eras 2-7 from rosters ----------
stories_gen = {}
for i in range(6):
    p = os.path.join(BUILD, "stories", f"stories_{i}.json")
    if os.path.exists(p):
        try: stories_gen.update(json.load(open(p)))
        except Exception as e: print("story batch parse fail", p, e)
print("generated stories loaded:", len(stories_gen))

for e, d in ERA_DIRS.items():
    rj = json.load(open(os.path.join(ARCHIVE, d, "roster.json")))
    roster = {int(c["num"]): c for c in rj["characters"]}
    art = os.path.join(ARCHIVE, d, "art")
    for f in sorted(os.listdir(art)):
        m = re.match(r"^(\d+)\s+(.+)\.(png|jpg|jpeg)$", f, re.I)
        if not m: continue
        num = int(m.group(1)); c = roster.get(num, {})
        pieces.append({
            "id": str(num), "n": num, "t": c.get("name", m.group(2)), "f": c.get("family",""),
            "b": "", "e": era_of(num), "cat": "",
            "story": stories_gen.get(str(num), ""),
            "p": c.get("prompt",""),
            "srcs": [os.path.relpath(os.path.join(art, f), ARCHIVE)], "g": [], "v": [],
        })

pieces.sort(key=lambda p: (p["n"] is None, p["n"] if p["n"] is not None else 0, p["id"]))
print("characters:", len(pieces), "(era1:", n_era1, ")")
missing_story = [p["id"] for p in pieces if not p["story"]]
print("missing stories:", len(missing_story), missing_story[:10])

# ---------- curation ----------
cur = json.load(open(os.path.join(BUILD, "curation.json")))
rejected = set(cur.get("rejected", []))
for p in pieces:
    if p["id"] in rejected: p["cut"] = True
print("cut:", sum(1 for p in pieces if p.get("cut")))

# ---------- thumbnails for every state ----------
os.makedirs(THUMB_DIR, exist_ok=True); os.makedirs(ATLAS_DIR, exist_ok=True)
jobs = []
for p in pieces:
    for k, rel in enumerate(p["srcs"]):
        dst = os.path.join(THUMB_DIR, f'{p["id"]}_s{k}.jpg')
        legacy = os.path.join(THUMB_DIR, f'{p["id"]}.jpg')
        if not os.path.exists(dst) and k == 0 and os.path.exists(legacy):
            os.link(legacy, dst); continue
        jobs.append((os.path.join(ARCHIVE, rel), dst))

def make_thumb(job):
    src, dst = job
    if os.path.exists(dst): return None
    from PIL import Image
    try:
        im = Image.open(src).convert("RGB")
        im.thumbnail((1000, 1000), Image.LANCZOS)
        im.save(dst, "JPEG", quality=78, optimize=True)
        return None
    except Exception as e:
        return f"{src}: {e}"

if __name__ == "__main__":
    with Pool(8) as pool:
        errs = [x for x in pool.map(make_thumb, jobs, chunksize=16) if x]
    print("thumb jobs:", len(jobs), "errors:", errs[:5], len(errs))

    from PIL import Image, ImageDraw
    for p in pieces:
        tp = os.path.join(THUMB_DIR, f'{p["id"]}_s0.jpg')
        try:
            with Image.open(tp) as im: p["ar"] = round(im.size[0]/im.size[1], 3)
        except Exception: p["ar"] = 1.778

    # ---------- atlases ----------
    TILE, GRID = 128, 32; PER = GRID*GRID
    n_atlas = (len(pieces)+PER-1)//PER
    for a in range(n_atlas):
        out = os.path.join(ATLAS_DIR, f"b{a}.jpg")
        if os.path.exists(out): print("atlas exists", out); continue
        sheet = Image.new("RGB", (TILE*GRID,)*2, (13,13,13))
        for i in range(PER):
            gi = a*PER+i
            if gi >= len(pieces): break
            p = pieces[gi]
            try:
                im = Image.open(os.path.join(THUMB_DIR, f'{p["id"]}_s0.jpg')).convert("RGB")
                w,h = im.size; s = min(w,h)
                im = im.crop(((w-s)//2,(h-s)//2,(w+s)//2,(h+s)//2)).resize((TILE,TILE), Image.LANCZOS)
                dr = ImageDraw.Draw(im); dr.rectangle([0,0,TILE-1,TILE-1], outline=(42,48,64), width=2)
                sheet.paste(im, ((i%GRID)*TILE, (i//GRID)*TILE))
            except Exception as e: print("tile err", p["id"], e)
        sheet.save(out, "JPEG", quality=82, optimize=True)
        print("wrote", out)

    # ---------- network edges ----------
    idset = {p["id"] for p in pieces}
    edges = []
    def chain(nums, typ):
        for a, b in zip(nums, nums[1:]):
            if str(a) in idset and str(b) in idset: edges.append([str(a), str(b), typ])
    THREADS = {
        "love": [1151,1730,1731,1253,1686,1163,1627,1632,1633],
        "watcher": [942,1713,1507,2103,1866],
        "court": [767,1481,1482,1485,1800,2149,2150,2153],
        "kindness": [1000,1937,1939,1940,1596,1942],
        "memory": [775,1889,1894,2061,1832,1438,1439,1900],
        "redemption": [806,1489,1488,891,1494,1055,1607,898,2155],
        "succession": [1727,1961,1635,2260,2148,2264],
    }
    for k, nums in THREADS.items(): chain(nums, "thread:"+k)
    chain([1468,1467,1469,1470,1477,2017,2144,2266], "spine")
    MILESTONES = [1000,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2265,2266]
    chain(MILESTONES, "monument")
    SETS = [("hours",1977,2000),("months",2001,2012),("moons",2013,2024),("seasons",2025,2028),
            ("elements",2029,2038),("decades",2039,2051),("neverbuilt",2052,2056),("lost",2057,2064),
            ("lines",2067,2092),("bridges",2093,2099),("tarot",2101,2122)]
    for k, lo, hi in SETS: chain(list(range(lo,hi+1)), "set:"+k)
    for a, b in [[806,1489],[806,1488],[891,1494],[1055,1607],[898,2155],[1151,1730],[1865,1866]]:
        e=[str(a),str(b),"callback"]
        if e not in edges and str(a) in idset and str(b) in idset: edges.append(e)
    print("edges:", len(edges))

    # ---------- story block ----------
    story = json.load(open(os.path.join(BUILD, "story_block.json")))

    n_states = sum(len(p["srcs"]) for p in pieces)
    counts = {
        "pieces": len(pieces), "era1": n_era1, "states": n_states,
        "multiState": sum(1 for p in pieces if len(p["srcs"])>1),
        "gifs": sum(len(p["g"]) for p in pieces) + sum(1 for m in motion if m["kind"]=="gif"),
        "videos": sum(len(p["v"]) for p in pieces) + sum(1 for m in motion if m["kind"]=="video"),
        "motionRoom": len(motion), "cut": sum(1 for p in pieces if p.get("cut")),
        "atlases": n_atlas, "atlasGrid": GRID, "edges": len(edges),
    }
    for p in pieces:
        p["s"] = len(p.pop("srcs"))
    data = {"counts": counts, "pieces": pieces, "motion": motion, "edges": edges, "story": story}
    with open(os.path.join(ASSETS, "data.js"), "w") as f:
        f.write("window.NY_DATA = "); json.dump(data, f, separators=(",",":")); f.write(";\n")
    print("wrote data.js", os.path.getsize(os.path.join(ASSETS,"data.js"))//1024, "KB")
    print(counts)
