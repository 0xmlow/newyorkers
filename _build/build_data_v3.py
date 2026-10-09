#!/usr/bin/env python3
"""NEW YORKERS site data build v3.

v2 + state deduplication (raw color L1, calibrated vs verified flip sets),
motion association (filename numbers + content matching + agent titles),
cut pieces removed from the field, content-stable thumb keys, sticker pins.
"""
import csv, json, os, re, sys, hashlib
from multiprocessing import Pool

ROOT = "/Users/degens/Desktop/NEW YORKERS BY MLOW"
ARCHIVE = os.path.join(ROOT, "NEW YORKERS MASTER ARCHIVE")
SITE = os.path.join(ROOT, "NEW YORKERS SITE")
ASSETS = os.path.join(SITE, "assets")
THUMB_DIR = os.path.join(ASSETS, "t")
ATLAS_DIR = os.path.join(ASSETS, "atlas")
MT_DIR = os.path.join(ASSETS, "mt")
STICKER_DIR = os.path.join(ASSETS, "stickers")
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

def tkey(rel):
    return "h" + hashlib.md5(rel.encode()).hexdigest()[:10]

def clean_title(t):
    t = re.sub(r"[\[\]]", "", t)
    return re.sub(r"\s{2,}", " ", t).strip()

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

# ---------- era 1 characters ----------
pieces, used_rows, motion_claimed = [], set(), {}
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
    if not states: continue
    for r in claimed: used_rows.add(id(r))
    num = int(s["num"]) if s["num"] else None
    pid = str(num) if num is not None else f"x{unnum_i:03d}"
    if num is None: unnum_i += 1
    pieces.append({
        "id": pid, "n": num, "t": clean_title(s["name"]), "f": s["family"], "b": s.get("borough",""),
        "e": 1, "cat": s.get("cultural_category",""),
        "story": descriptions.get(s["subject_id"], ""),
        "srcs": [rel for _, rel in states], "g": gifs, "v": vids,
    })

motion_pool = []  # unclaimed era-1 motion rows
for r in canon:
    num = r["num"].strip()
    if num.isdigit() and int(num) > 766: continue
    if r["media"] in ("gif", "video") and id(r) not in used_rows:
        rel = era1_index.get(r["new_filename"])
        if rel: motion_pool.append(rel)

n_era1 = len(pieces)

# ---------- eras 2-7 ----------
stories_gen = {}
for i in range(6):
    p = os.path.join(BUILD, "stories", f"stories_{i}.json")
    if os.path.exists(p): stories_gen.update(json.load(open(p)))
for tag in ("a", "b"):
    p = os.path.join(BUILD, "stories", f"stories_fixes_{tag}.json")
    if os.path.exists(p):
        fixes = json.load(open(p)); stories_gen.update(fixes)
        print(f"story fixes merged ({tag}):", len(fixes))

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
            "b": "", "e": era_of(num), "cat": "", "story": stories_gen.get(str(num), ""),
            "p": c.get("prompt",""),
            "srcs": [os.path.relpath(os.path.join(art, f), ARCHIVE)], "g": [], "v": [],
        })

pieces.sort(key=lambda p: (p["n"] is None, p["n"] if p["n"] is not None else 0, p["id"]))
by_id = {p["id"]: p for p in pieces}
print("characters:", len(pieces), "era1:", n_era1)

# ---------- motion association ----------
match = {r["key"]: r for r in json.load(open(os.path.join(BUILD, "motion_match.json"))) if "err" not in r}
loop_titles = {}
for i in range(2):
    p = os.path.join(BUILD, f"loop_titles_{i}.json")
    if os.path.exists(p): loop_titles.update(json.load(open(p)))

motion = []   # every archive motion file: key, src, kind, pid, t
seen_rel = set()
for key, r in match.items():
    rel = r["rel"]; base = os.path.basename(rel)
    kind = "gif" if rel.lower().endswith(".gif") else "video"
    pid = None
    m = re.match(r"^(\d{1,4})_", base)
    if m and str(int(m.group(1))) in by_id: pid = str(int(m.group(1)))
    elif r["d"] < 0.20 and (r["d2"] - r["d"]) > 0.2: pid = r["best"]
    if pid and pid in by_id:
        p = by_id[pid]
        lst = p["g"] if kind == "gif" else p["v"]
        if rel not in lst: lst.append(rel)
        title = p["t"]
    else:
        title = loop_titles.get(key, "") or base.rsplit(".",1)[0].replace("_"," ").replace("-"," ").title()
    motion.append({"key": key, "src": rel, "kind": kind, "pid": pid, "t": title, "w": r["w"], "h": r["h"]})
    seen_rel.add(rel)
print("motion entries:", len(motion), "attached:", sum(1 for m in motion if m["pid"]),
      "loop reel:", sum(1 for m in motion if not m["pid"]))

# ---------- curation split ----------
cur = json.load(open(os.path.join(BUILD, "curation.json")))
rejected = set(cur.get("rejected", []))
kept = [p for p in pieces if p["id"] not in rejected]
cut_pieces = [p for p in pieces if p["id"] in rejected]
print("kept:", len(kept), "cut:", len(cut_pieces), sorted(rejected))

# ---------- thumbnails (content-stable keys) ----------
os.makedirs(THUMB_DIR, exist_ok=True); os.makedirs(ATLAS_DIR, exist_ok=True)
jobs = []
for p in pieces:
    for k, rel in enumerate(p["srcs"]):
        dst = os.path.join(THUMB_DIR, tkey(rel) + ".jpg")
        legacy = os.path.join(THUMB_DIR, f'{p["id"]}_s{k}.jpg')
        if not os.path.exists(dst) and os.path.exists(legacy):
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
    print("thumb jobs:", len(jobs), "errors:", len(errs))

    from PIL import Image, ImageDraw, ImageFilter
    import numpy as np

    # ---------- state dedup: raw color L1 on 32x18 tiles, keep if >= 8 vs all kept ----------
    def rawtile(path):
        return np.asarray(Image.open(path).convert("RGB").resize((32,18),Image.LANCZOS), dtype=np.float32)
    dropped_states = 0
    for p in pieces:
        keys = [tkey(rel) for rel in p["srcs"]]
        if len(keys) > 1:
            kept_keys, tiles = [], []
            for kk in keys:
                try: t = rawtile(os.path.join(THUMB_DIR, kk + ".jpg"))
                except Exception: continue
                if any(t.shape == t2.shape and float(np.mean(np.abs(t - t2))) < 8.0 for t2 in tiles):
                    dropped_states += 1; continue
                tiles.append(t); kept_keys.append(kk)
            keys = kept_keys or keys[:1]
        p["st"] = keys
        del p["srcs"]
    print("duplicate states dropped:", dropped_states)

    for p in pieces:
        tp = os.path.join(THUMB_DIR, p["st"][0] + ".jpg")
        try:
            with Image.open(tp) as im: p["ar"] = round(im.size[0]/im.size[1], 3)
        except Exception: p["ar"] = 1.778

    # ---------- atlases from KEPT pieces only ----------
    TILE, GRID = 128, 32; PER = GRID*GRID
    n_atlas = (len(kept)+PER-1)//PER
    for a in range(n_atlas):
        out = os.path.join(ATLAS_DIR, f"c{a}.jpg")
        if os.path.exists(out): print("atlas exists", out); continue
        sheet = Image.new("RGB", (TILE*GRID,)*2, (8,13,22))
        for i in range(PER):
            gi = a*PER+i
            if gi >= len(kept): break
            p = kept[gi]
            try:
                im = Image.open(os.path.join(THUMB_DIR, p["st"][0] + ".jpg")).convert("RGB")
                w,h = im.size; s0 = min(w,h)
                im = im.crop(((w-s0)//2,(h-s0)//2,(w+s0)//2,(h+s0)//2)).resize((TILE,TILE), Image.LANCZOS)
                dr = ImageDraw.Draw(im); dr.rectangle([0,0,TILE-1,TILE-1], outline=(42,48,64), width=2)
                sheet.paste(im, ((i%GRID)*TILE, (i//GRID)*TILE))
            except Exception as e: print("tile err", p["id"], e)
        sheet.save(out, "JPEG", quality=82, optimize=True)
        print("wrote", out)

    # ---------- sticker pins ----------
    os.makedirs(STICKER_DIR, exist_ok=True)
    PIN_IDS = ["767","1467","1477","1000","1800","2000","2103","942","1866","550","1500","2266"]
    def pin(src, dst, size=420, ring=(70,146,194)):
        im=Image.open(src).convert("RGB")
        a=np.asarray(im,dtype=np.float32)/255.0
        sat=a.max(axis=2)-a.min(axis=2); score=sat*a.max(axis=2)
        s=Image.fromarray((score*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(24))
        sn=np.asarray(s,dtype=np.float32); h,w=sn.shape
        r=int(min(w,h)*0.28)
        sn[:r,:]=0; sn[-r:,:]=0; sn[:,:r]=0; sn[:,-r:]=0
        cy,cx=np.unravel_index(np.argmax(sn),sn.shape)
        crop=im.crop((cx-r,cy-r,cx+r,cy+r)).resize((size,size),Image.LANCZOS)
        mask=Image.new("L",(size,size),0)
        ImageDraw.Draw(mask).ellipse([6,6,size-6,size-6],fill=255)
        out=Image.new("RGBA",(size,size),(0,0,0,0))
        out.paste(crop,(0,0),mask)
        ImageDraw.Draw(out).ellipse([3,3,size-3,size-3],outline=ring+(255,),width=6)
        out.save(dst)
    stickers = []
    for pid in PIN_IDS:
        p = by_id.get(pid)
        if not p: continue
        dst = os.path.join(STICKER_DIR, f"pin_{pid}.png")
        if not os.path.exists(dst):
            try: pin(os.path.join(THUMB_DIR, p["st"][0] + ".jpg"), dst)
            except Exception as e: print("pin err", pid, e); continue
        stickers.append({"id": pid, "t": p["t"], "f": f"pin_{pid}.png"})
    print("stickers:", len(stickers))

    # ---------- merge gif+mp4 twins in the motion list (same animation, two encodings) ----------
    tiles_m = {}
    for m in motion:
        try: tiles_m[m["key"]] = rawtile(os.path.join(MT_DIR, m["key"] + ".jpg"))
        except Exception: pass
    merged, consumed = [], set()
    for i, m in enumerate(motion):
        if m["key"] in consumed: continue
        twin = None
        for m2 in motion[i+1:]:
            if m2["key"] in consumed or m2["kind"] == m["kind"]: continue
            if (m.get("pid") or None) != (m2.get("pid") or None): continue
            ta, tb = tiles_m.get(m["key"]), tiles_m.get(m2["key"])
            if ta is None or tb is None or ta.shape != tb.shape: continue
            if float(np.mean(np.abs(ta - tb))) < 8.0: twin = m2; break
        if twin:
            consumed.add(twin["key"])
            gif_e = m if m["kind"] == "gif" else twin
            vid_e = twin if m["kind"] == "gif" else m
            gif_e["alt"] = vid_e["src"]
            merged.append(gif_e)
        else:
            merged.append(m)
    print("motion cards after twin merge:", len(merged), "(from", len(motion), ")")
    motion = merged

    # ---------- era samples for the lineage visual ----------
    era_samples = {}
    for e in range(1,8):
        ids = [p["id"] for p in kept if p["e"]==e][:0] or None
    era_samples = {str(e): [p["st"][0] for p in kept if p["e"]==e][:5] for e in range(1,8)}
    era_counts = {str(e): sum(1 for p in kept if p["e"]==e) for e in range(1,8)}

    # ---------- story + counts ----------
    story = json.load(open(os.path.join(BUILD, "story_block.json")))
    story["eraSamples"] = era_samples
    story["eraCounts"] = era_counts

    n_states = sum(len(p["st"]) for p in kept)
    counts = {
        "pieces": len(kept), "era1": n_era1, "states": n_states,
        "multiState": sum(1 for p in kept if len(p["st"])>1),
        "gifs": sum(len(p["g"]) for p in kept) + sum(1 for m in motion if not m["pid"] and m["kind"]=="gif"),
        "videos": sum(len(p["v"]) for p in kept) + sum(1 for m in motion if not m["pid"] and m["kind"]=="video"),
        "motionAttached": sum(1 for m in motion if m["pid"]),
        "loopReel": sum(1 for m in motion if not m["pid"]),
        "cut": len(cut_pieces),
        "atlases": n_atlas, "atlasGrid": GRID,
    }
    data = {"counts": counts, "pieces": kept, "cutPieces": cut_pieces,
            "motion": motion, "edges": None, "story": story, "stickers": stickers}

    # ---------- network edges ----------
    idset = {p["id"] for p in kept}
    edges = []
    def chain(nums, typ):
        for a, b in zip(nums, nums[1:]):
            if str(a) in idset and str(b) in idset: edges.append([str(a), str(b), typ])
    THREADS = {"love":[1151,1730,1731,1253,1686,1163,1627,1632,1633],
               "watcher":[942,1713,1507,2103,1866],
               "court":[767,1481,1482,1485,1800,2149,2150,2153],
               "kindness":[1000,1937,1939,1940,1596,1942],
               "memory":[775,1889,1894,2061,1832,1438,1439,1900],
               "redemption":[806,1489,1488,891,1494,1055,1607,898,2155],
               "succession":[1727,1961,1635,2260,2148,2264]}
    for k, nums in THREADS.items(): chain(nums, "thread:"+k)
    chain([1468,1467,1469,1470,1477,2017,2144,2266], "spine")
    chain([1000,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2265,2266], "monument")
    for k, lo, hi in [("hours",1977,2000),("months",2001,2012),("moons",2013,2024),("seasons",2025,2028),
                      ("elements",2029,2038),("decades",2039,2051),("neverbuilt",2052,2056),("lost",2057,2064),
                      ("lines",2067,2092),("bridges",2093,2099),("tarot",2101,2122)]:
        chain(list(range(lo,hi+1)), "set:"+k)
    for a, b in [[806,1489],[806,1488],[891,1494],[1055,1607],[898,2155],[1151,1730],[1865,1866]]:
        e=[str(a),str(b),"callback"]
        if e not in edges and str(a) in idset and str(b) in idset: edges.append(e)
    data["edges"] = edges
    counts["edges"] = len(edges)

    with open(os.path.join(ASSETS, "data.js"), "w") as f:
        f.write("window.NY_DATA = "); json.dump(data, f, separators=(",",":")); f.write(";\n")
    print("wrote data.js", os.path.getsize(os.path.join(ASSETS,"data.js"))//1024, "KB")
    print(counts)
