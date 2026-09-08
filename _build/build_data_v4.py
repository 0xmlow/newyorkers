#!/usr/bin/env python3
"""NEW YORKERS site data build v4: the whole collection, eras I to XIX (renumbered 2026-09-04, eras XVIII and XIX added 2026-09-06).

v3 + eras VIII to XV read straight from the SEEDREAM5_* working folders
(images/ at 2560x1440), stories from the drop sheets (2267-3066) and the
v4 story files (3067-5466), a fifteen chapter story block, monuments from
every era's hero list, sets from every era's roster, and smaller atlas tiles
so the 3D field stays under ~20MB for all 5,400+ pieces.

Run:  python3 build_data_v4.py            (thumbs are cached; safe to rerun)
"""
import csv, json, os, re, sys, hashlib, glob
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
ARCHIVE_ERAS = {2: "02_THE EYE FLOWER ERA 767-816", 3: "03_THE CITY EXPANDS 817-966",
                4: "04_THE BRAND BATCH 967-1166", 5: "05_THE MASTERWORKS 1167-1466",
                6: "06_THE MYTHOS 1467-1866", 7: "07_THE DEEP CITY 1867-2266"}
# working folders for the eras that came after the archive was built
WORK_ERAS = {8: "SEEDREAM5_2267-2666", 9: "SEEDREAM5_2667-3066", 10: "SEEDREAM5_3067-3466",
             11: "SEEDREAM5_3467-3966", 12: "SEEDREAM5_3967-4366", 13: "SEEDREAM5_4367-4766",
             14: "SEEDREAM5_4767-4966", 15: "SEEDREAM5_4967-5466",
             16: "SEEDREAM5_5491-6490", 17: "SEEDREAM5_6491-6990",
             18: "SEEDREAM5_6991-7490", 19: "SEEDREAM5_7491-7990"}

ERA_BOUNDS = [(766,1),(816,2),(966,3),(1166,4),(1466,5),(1866,6),(2266,7),(2666,8),(3066,9),
              (3466,10),(3966,11),(4366,12),(4766,13),(4966,14),(5466,15),(6490,16),(6990,17),(7490,18),(7990,19)]
def era_of(num):
    for hi, e in ERA_BOUNDS:
        if num <= hi: return e
    return ERA_BOUNDS[-1][1]

def tkey(rel):
    return "h" + hashlib.md5(rel.encode()).hexdigest()[:10]

def clean_title(t):
    t = re.sub(r"[\[\]]", "", t)
    return re.sub(r"\s{2,}", " ", t).strip()

def nodash(s):
    return (s or "").replace("—", ":").replace("–", ",")

def load_json(p, default=None):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return default

# ---------------- era 1 (archive, subject level) ----------------
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

pieces, used_rows = [], set()
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
        "story": nodash(descriptions.get(s["subject_id"], "")),
        "srcs": [("A", rel) for _, rel in states], "g": gifs, "v": vids,
    })
n_era1 = len(pieces)

# ---------------- eras 2 to 7 (archive) ----------------
stories_gen = {}
for i in range(6):
    p = os.path.join(BUILD, "stories", f"stories_{i}.json")
    if os.path.exists(p): stories_gen.update(json.load(open(p)))
for tag in ("a", "b"):
    p = os.path.join(BUILD, "stories", f"stories_fixes_{tag}.json")
    if os.path.exists(p): stories_gen.update(json.load(open(p)))

for e, d in ARCHIVE_ERAS.items():
    rj = json.load(open(os.path.join(ARCHIVE, d, "roster.json")))
    roster = {int(c["num"]): c for c in rj["characters"]}
    art = os.path.join(ARCHIVE, d, "art")
    for f in sorted(os.listdir(art)):
        m = re.match(r"^(\d+)\s+(.+)\.(png|jpg|jpeg)$", f, re.I)
        if not m: continue
        num = int(m.group(1)); c = roster.get(num, {})
        pieces.append({
            "id": str(num), "n": num, "t": clean_title(c.get("name", m.group(2))), "f": c.get("family",""),
            "b": "", "e": era_of(num), "cat": "", "story": nodash(stories_gen.get(str(num), "")),
            "p": c.get("prompt",""), "set": c.get("set",""),
            "srcs": [("A", os.path.relpath(os.path.join(art, f), ARCHIVE))], "g": [], "v": [],
        })

# ---------------- eras 8 to 15 (working folders) ----------------
# stories: drop sheets carry real two sentence stories for 2267-3066; v4 story files for 3067+
def parse_dropsheet(path):
    txt = open(path).read()
    out = {}
    for n, name, body in re.findall(r"^\*\*(\d{4}) ([^*]+)\*\*[^\n]*\n+([^\n*][^\n]*)", txt, re.M):
        if "color story" in body: continue           # prompt, not a story
        out[n] = body.strip()
    return out
stories_v4 = {}
for e in (8, 9):
    for f in glob.glob(os.path.join(ROOT, WORK_ERAS[e], "CHARACTERS *.md")):
        if "backup" in f: continue
        stories_v4.update(parse_dropsheet(f))
for f in sorted(glob.glob(os.path.join(BUILD, "stories", "stories_v4_*.json"))):
    stories_v4.update(load_json(f, {}) or {})
print("stories available for eras VIII+:", len(stories_v4))

def norm_family(f):
    f = (f or "").strip()
    fixes = {"deep city": "Places", "Deep City": "Places", "": ""}
    if f in fixes: return fixes[f]
    return f[0].upper() + f[1:]

# eras XIV and XV shipped as arcs without a family; the arc decides the tribe
FAMILY_BY_SET = {
    "THE SECOND SKIN": "Design", "THE WATCHERS": "Underground", "NEW WAYS TO MOVE": "Hustlers",
    "THE GADGET BAZAAR": "Builders", "THE MELTING POT PROTOCOLS": "Transplants", "VIRAL": "Degens",
    "THE ICONS AWAKE": "Places", "MYSTERY AND ILLUSION": "Underground",
    "THE CITY ANSWERS": "Places", "THE WEATHER MACHINE": "Places", "THE NIGHT SHIFT": "Heroes",
    "THE SIXTH BOROUGH": "Transplants", "SACRED GEOMETRY": "Citizens", "THE FOOD CHAIN": "Hustlers",
    "THE MARKET": "Hustlers", "THE REPAIR SHOP": "Builders", "THE ARCHIVE": "Stoop",
    "THE BODY MODIFIED": "Design", "THE SOUND OF IT": "Degens", "THE COMMUTE IMPOSSIBLE": "Underground",
    "FASHION WEEK THAT NEVER ENDS": "Design", "THE ALGORITHM'S CITY": "Villains", "THE GREEN INVASION": "Strays",
    "THE KIDS": "Citizens", "THE ELDERS": "Stoop", "THE CROWD": "Citizens", "THE THRESHOLD": "Transplants",
    "THE CITY DREAMS ITSELF": "Underground",
    # XVI, the twenty houses (character_bible.json house_name)
    "THE SEAM": "Builders", "THE LEASE": "Citizens", "THE FEED": "Degens", "THE NIGHT KITCHEN": "Hustlers",
    "THE CARE": "Heroes", "THE REPAIR": "Builders", "THE PAPERS": "Transplants", "THE WATER": "Places",
    "RAISED BY FEEDS": "Citizens", "THE HOLD MUSIC": "Villains", "THE CHURCH OF UP ONLY": "Degens",
    "THE LAST THIRD PLACE": "Stoop", "THE HANDS": "Builders", "THE BODY": "Citizens", "THE PROOF": "Underground",
    "THE ARRIVAL": "Transplants", "THE LONG SHIFT": "Heroes", "THE INHERITANCE": "Stoop",
    # XVII, the ten rooms
    "THE APPETIZING COUNTER": "Builders", "THE RED SAUCE": "Citizens", "THE SLICE": "Hustlers",
    "THE COUNTER": "Stoop", "THE LIST": "Design", "THE OYSTER AND THE CHOP": "Places",
    "THE FOUR IN THE MORNING": "Underground", "THE CART AND THE WINDOW": "Hustlers",
    "THE LAST CALL": "Degens", "THE ROOM WHERE IT HAPPENED": "Process",
    # XVIII, The MLow Show (crypto art culture in ten houses)
    "THE GREEN ROOM": "Process", "THE MINT": "Builders", "THE VAULT": "Hustlers", "THE TRASH BLOCK": "Degens",
    "THE MACHINE STUDIO": "Builders", "THE PAINTER'S FLOOR": "Design", "THE LENS": "Process",
    "THE DEPTH STAGE": "Design", "THE CHAIN": "Underground", "THE DEGEN FLOOR": "Degens",
    # XIX, The Trait Layer
    "THE NINETY SECONDS": "Builders", "THE NUMBER": "Degens", "THE SECOND FACE": "Design", "THE RULE": "Villains",
    "THE OPEN TAB": "Degens", "THE VANISHING": "Villains", "THE HANGING": "Places", "THE TWELVE WORDS": "Underground",
    "THE THIRTY HOUR DAY": "Heroes", "THE LONG RECORD": "Stoop",
}

era_sets = {}      # era -> [(name, lo, hi)]
era_heroes = {}    # era -> [nums]
for e, d in WORK_ERAS.items():
    folder = os.path.join(ROOT, d)
    rj = load_json(os.path.join(folder, "roster.json"), {}) or {}
    chars = rj.get("characters", rj if isinstance(rj, list) else [])
    roster = {int(c["num"]): c for c in chars}
    cfg = load_json(os.path.join(folder, "krea-config.json"), {}) or {}
    era_heroes[e] = list((cfg.get("hero") or {}).get("nums") or [])
    # arcs (XIV, XV) become sets
    arcs = cfg.get("arcs") or {}
    sets = []
    for k, v in arcs.items():
        lo, hi = map(int, k.split("-")); sets.append((v.split(",")[0].strip().title(), lo, hi))
    # briefs (XIV, XV) carry names when the roster does not
    briefs = {}
    for bf in glob.glob(os.path.join(folder, "_build", "briefs*.jsonl")):
        for line in open(bf):
            line = line.strip().rstrip(",")
            if not line: continue
            try: o = json.loads(line)
            except Exception: continue
            briefs[int(o["num"])] = o
    # character bible (XVI, XVII): houses are the sets, the moment and place are the studio note
    bible = {}
    for c in (load_json(os.path.join(folder, "character_bible.json"), []) or []):
        bible[int(c["num"])] = c
    if bible and not sets:
        houses = {}
        for num, c in sorted(bible.items()):
            h = houses.setdefault(c["house_name"], [c["house_name"].title(), num, num])
            h[1] = min(h[1], num); h[2] = max(h[2], num)
        sets = [tuple(h) for h in houses.values()]
    # roster sets (X to XIII) -> contiguous ranges per set name
    if not sets:
        cur = None
        for num in sorted(roster):
            sname = (roster[num].get("set") or "").strip()
            if not sname: cur = None; continue
            if cur and cur[0] == sname and num == cur[2] + 1: cur[2] = num
            else:
                cur = [sname, num, num]; sets.append(cur)
        sets = [(s[0].title(), s[1], s[2]) for s in sets if s[2] > s[1]]
    era_sets[e] = sets
    img_dir = os.path.join(folder, "images")
    for f in sorted(os.listdir(img_dir)):
        m = re.match(r"^(\d+)\s+(.+)\.(png|jpg|jpeg)$", f, re.I)
        if not m: continue
        num = int(m.group(1)); c = roster.get(num, {}); b = briefs.get(num, {})
        bc = bible.get(num)
        if bc:
            mom = (bc.get("moment") or "").strip().rstrip(".")
            place = (bc.get("place") or "").strip().rstrip(".")
            frag = mom + ((", " + place) if place and place.lower() not in mom.lower() else "")
            b = {"name": bc.get("title"), "frag": frag[0].upper() + frag[1:] if frag else ""}
        sname = (c.get("set") or "").strip().title()
        if not sname:
            for nm, lo, hi in sets:
                if lo <= num <= hi: sname = nm; break
        fam = norm_family(c.get("family", "")) or FAMILY_BY_SET.get(sname.upper(), "")
        if not fam and sname: print("no family for set", sname)
        pieces.append({
            "id": str(num), "n": num, "t": clean_title(c.get("name") or b.get("name") or m.group(2)),
            "f": fam, "b": "", "e": era_of(num), "cat": "",
            "story": nodash(stories_v4.get(str(num), "")),
            "p": c.get("prompt") or b.get("frag") or "", "set": sname,
            "srcs": [("W", os.path.relpath(os.path.join(img_dir, f), ROOT))], "g": [], "v": [],
        })

pieces.sort(key=lambda p: (p["n"] is None, p["n"] if p["n"] is not None else 0, p["id"]))
by_id = {p["id"]: p for p in pieces}
print("characters:", len(pieces), "era1:", n_era1)

# ---------------- motion association (era 1 archive motion) ----------------
match = {r["key"]: r for r in json.load(open(os.path.join(BUILD, "motion_match.json"))) if "err" not in r}
loop_titles = {}
for i in range(2):
    p = os.path.join(BUILD, f"loop_titles_{i}.json")
    if os.path.exists(p): loop_titles.update(json.load(open(p)))
motion = []
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
print("motion entries:", len(motion))

# ---------------- glitch editions (MOSHED VARIANTS, ERC-7160 appendable state) ----------------
GL = load_json(os.path.join(BUILD, "glitch_index.json"), {}) or {}
n_gl = 0
for p in pieces:
    g = GL.get(p["id"])
    if g and g.get("mp4"):
        p["gl"] = {"mp4": g["mp4"], "st": g.get("st"), "fam": g.get("fam"), "tag": g.get("tag")}; n_gl += 1
print("glitch editions attached:", n_gl)

# ---------------- curation ----------------
cur = json.load(open(os.path.join(BUILD, "curation.json")))
rejected = set(cur.get("rejected", []))
kept = [p for p in pieces if p["id"] not in rejected]
cut_pieces = [p for p in pieces if p["id"] in rejected]
print("kept:", len(kept), "cut:", len(cut_pieces))

# ---------------- thumbnails ----------------
os.makedirs(THUMB_DIR, exist_ok=True); os.makedirs(ATLAS_DIR, exist_ok=True)
def src_abs(tag, rel):
    return os.path.join(ARCHIVE if tag == "A" else ROOT, rel)
jobs = []
for p in pieces:
    for tag, rel in p["srcs"]:
        dst = os.path.join(THUMB_DIR, tkey(rel) + ".jpg")
        if not os.path.exists(dst): jobs.append((src_abs(tag, rel), dst))

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
    print("thumb jobs:", len(jobs))
    with Pool(10) as pool:
        errs = [x for x in pool.map(make_thumb, jobs, chunksize=8) if x]
    print("thumb errors:", len(errs), errs[:3])

    from PIL import Image, ImageDraw, ImageFilter
    import numpy as np

    def rawtile(path):
        return np.asarray(Image.open(path).convert("RGB").resize((32,18),Image.LANCZOS), dtype=np.float32)
    dropped_states = 0
    for p in pieces:
        keys = [tkey(rel) for _, rel in p["srcs"]]
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
        try:
            with Image.open(os.path.join(THUMB_DIR, p["st"][0] + ".jpg")) as im: p["ar"] = round(im.size[0]/im.size[1], 3)
        except Exception: p["ar"] = 1.778

    # ---------------- atlases (96px tiles, 42x42 grid = 4032px) ----------------
    TILE, GRID = 96, 42; PER = GRID*GRID
    n_atlas = (len(kept)+PER-1)//PER
    sig = hashlib.md5(json.dumps([p["st"][0] for p in kept]).encode()).hexdigest()[:8]
    sig_path = os.path.join(ATLAS_DIR, "d.sig")
    if os.path.exists(sig_path) and open(sig_path).read().strip() == sig and all(os.path.exists(os.path.join(ATLAS_DIR, f"d{a}.jpg")) for a in range(n_atlas)):
        print("atlases up to date")
    else:
        for old in glob.glob(os.path.join(ATLAS_DIR, "d*.jpg")): os.remove(old)
        for a in range(n_atlas):
            sheet = Image.new("RGB", (TILE*GRID,)*2, (13,13,13))
            for i in range(PER):
                gi = a*PER+i
                if gi >= len(kept): break
                p = kept[gi]
                try:
                    im = Image.open(os.path.join(THUMB_DIR, p["st"][0] + ".jpg")).convert("RGB")
                    w,h = im.size; s0 = min(w,h)
                    im = im.crop(((w-s0)//2,(h-s0)//2,(w+s0)//2,(h+s0)//2)).resize((TILE,TILE), Image.LANCZOS)
                    dr = ImageDraw.Draw(im); dr.rectangle([0,0,TILE-1,TILE-1], outline=(42,48,64), width=1)
                    sheet.paste(im, ((i%GRID)*TILE, (i//GRID)*TILE))
                except Exception as e: print("tile err", p["id"], e)
            out = os.path.join(ATLAS_DIR, f"d{a}.jpg")
            sheet.save(out, "JPEG", quality=80, optimize=True)
            print("wrote", out, os.path.getsize(out)//1024, "KB")
        open(sig_path, "w").write(sig)

    # ---------------- sticker pins ----------------
    os.makedirs(STICKER_DIR, exist_ok=True)
    PIN_IDS = ["767","1467","1477","1000","1800","2000","2103","942","1866","550","1500","2266",
               "2300","3000","3100","3500","4000","4400","4850","5000","5466","5491","6490","6491","6990","6991","7490","7491","7990"]
    def pin(src, dst, size=420, ring=(41,98,255)):
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

    # ---------------- gif+mp4 twins ----------------
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
    motion = merged

    # ---------------- story block: fifteen chapters ----------------
    story = json.load(open(os.path.join(BUILD, "story_block.json")))
    story["eras"] = story["eras"][:7] + [
        {"i": 8, "range": [2267, 2666], "roman": "VIII", "title": "The Fabric", "sub": "The Weave",
         "desc": "The Second Glance wedding, the 56 card Minor Arcana, all 59 community boards, and the Guarantor, the devil number villain who earns a second look."},
        {"i": 9, "range": [2667, 3066], "roman": "IX", "title": "The Bloom", "sub": "The Trip",
         "desc": "The Painter waters a blank canvas and the whole city goes trippy. Harbor Lights, the Scents of New York, Street Games, and the Full Bloom at 3000 when every eye flower opens at once."},
        {"i": 10, "range": [3067, 3466], "roman": "X", "title": "The Look", "sub": "The Style",
         "desc": "After the Bloom went citywide the city started dressing for the flowers. The Houses, the Diaspora Blocks, the Uniforms, the Landmark Crowns, the Soles. Self presentation as love, armor and survival."},
        {"i": 11, "range": [3467, 3966], "roman": "XI", "title": "The Waking", "sub": "The Machines",
         "desc": "The eye flowers open in things that were never alive. Traffic cones, turnstiles, griddles, screens and church bells wake up and discover they were watching all along."},
        {"i": 12, "range": [3967, 4366], "roman": "XII", "title": "The Arrival", "sub": "The Future",
         "desc": "Time coupes land on the Brooklyn Bridge, androids wear cashmere, and the city absorbs whatever arrives, the way it always has."},
        {"i": 13, "range": [4367, 4766], "roman": "XIII", "title": "The Deep City", "sub": "The Strata",
         "desc": "Cast iron facades step down from their buildings. The buried, structural, stacked New York comes forward with its ghosts and its craft."},
        {"i": 14, "range": [4767, 4966], "roman": "XIV", "title": "The Second Skin", "sub": "The Layer",
         "desc": "An augmented layer painted over the real city. The Watchers, new ways to move, the Gadget Bazaar, the Melting Pot Protocols, Viral, the Icons Awake, Mystery and Illusion."},
        {"i": 15, "range": [4967, 5466], "roman": "XV", "title": "The City That Answers Back", "sub": "The Reply",
         "desc": "Infrastructure with opinions. The grid asks for a minute, the traffic light waits, the water main remembers the creek. The city finally answers, and the census closes on The Answer at 5466."},
        {"i": 16, "range": [5491, 6490], "roman": "XVI", "title": "The Twenty Houses", "sub": "The Work",
         "desc": "One thousand New Yorkers built as people who can walk out of the frame: a name, a want, a flaw, a signature. Twenty houses of fifty, each a working world with its own thesis. The Seam, the Lease, the Feed, the Care, the Hands, the Inheritance."},
        {"i": 17, "range": [6491, 6990], "roman": "XVII", "title": "The Ten Rooms", "sub": "The Reservation",
         "desc": "Five hundred New Yorkers inside the institutions the city is defined by. The appetizing counter, the red sauce room, the slice, the stool, the list, the oyster bar, four in the morning, the cart, last call, and the small badly lit room where the culture got made."},
        {"i": 18, "range": [6991, 7490], "roman": "XVIII", "title": "The MLow Show", "sub": "The Homage",
         "desc": "Five hundred New Yorkers from crypto art culture in ten houses, opening with an homage to every guest of The MLow Show. The green room, the mint, the vault, the trash block, the machine studio, the painter's floor, the lens, the depth stage, the chain and the degen floor. The honoree is named in the title and never painted."},
        {"i": 19, "range": [7491, 7990], "roman": "XIX", "title": "The Trait Layer", "sub": "The Traits",
         "desc": "Five hundred New Yorkers of the ninety seconds, the number, the second face, the rule, the open tab, the vanishing, the hanging, the twelve words, the thirty hour day and the long record. Each carries one of thirty one painted traits, worn the way the city wears everything: as a fact."},
    ]
    # monuments: the fourteen originals plus every era's hundred marks and closers
    ms = list(story["milestones"])
    extra_m = [2300, 2400, 2500, 2600, 2665, 2666, 2700, 2800, 2900, 3000, 3065, 3066,
               3100, 3200, 3300, 3400, 3465, 3466]
    for e in sorted(era_heroes): extra_m += era_heroes[e]
    for n in extra_m:
        if str(n) in by_id and n not in ms: ms.append(n)
    # A hundred mark is ALWAYS a monument. Ruled 2026-09-07 after an audit found only 44 of the 74
    # painted hundred marks carried the tag, so 500, 600, 800, 900, 1100 and the whole 5500 to 6100
    # run showed no MONUMENT badge on the census.
    for n in range(100, 8001, 100):
        if str(n) in by_id and n not in ms: ms.append(n)
    story["milestones"] = sorted(ms)
    # sets from every era
    sets = list(story["sets"])
    KNOWN_SETS = [
        ("wedding", "The Second Glance Wedding", 2272, 2300, "A love thread pays off in twenty nine frames and one ceremony."),
        ("arcana", "The Minor Arcana", 2301, 2356, "Fifty six cards. Slices are Hustlers, Coffees are Stoop, Swipes are Underground, Scaffolds are Builders."),
        ("boards", "The Community Boards", 2401, 2459, "All fifty nine boards. Every corner of the city gets a seat."),
        ("harbor", "Harbor Lights", 2768, 2779, "The water at night, twelve ways."),
        ("scents", "Scents of New York", 2867, 2878, "Twelve smells you would know blindfolded."),
        ("games", "Street Games", 2901, 2912, "Skelly, stoopball, double dutch. The sidewalk as a board."),
        ("houses", "The Houses", 3067, 3078, "Invented borough ateliers. Fordham Road to Flatbush Avenue, dressing the block."),
        ("diaspora", "The Diaspora Blocks", 3101, 3124, "Twenty four real immigrant enclaves, painted as fashion."),
        ("uniforms", "The Uniforms", 3149, 3160, "The booth coat, the courier bag, the work clothes as couture."),
        ("crowns", "The Landmark Crowns", 3201, 3224, "The skyline worn on the head."),
        ("soles", "The Soles", 3225, 3236, "Sneaker culture. The line before sunrise, the pair he never wore."),
        ("wild", "The Wild Ones", 3259, 3266, "The city's animals dressed for the Bloom."),
        ("openeyes", "The Open Eyes", 3301, 3312, "The eye flower as the subject, not the witness."),
    ]
    have = {s["key"] for s in sets}
    for key, name, lo, hi, hook in KNOWN_SETS:
        if key not in have and str(lo) in by_id: sets.append({"key": key, "name": name, "range": [lo, hi], "hook": hook})
    for e in sorted(era_sets):
        for name, lo, hi in era_sets[e]:
            key = re.sub(r"[^a-z0-9]+", "", name.lower())[:18] + str(lo)
            if str(lo) in by_id and str(hi) in by_id and hi - lo >= 5:
                sets.append({"key": key, "name": name, "range": [lo, hi], "hook": f"Era {story['eras'][e-1]['roman']}, {hi-lo+1} pieces."})
    story["sets"] = sets
    # threads: extend the canon lines with the later era stops that memory records
    for t in story["threads"]:
        add = {"love": [2300, 3423], "redemption": [2666, 3425], "succession": [2269, 3417],
               "watcher": [3466, 5466, 6490, 6990, 7490, 7990], "memory": [3170, 3180], "court": [3175, 3417]}.get(t["key"], [])
        for n in add:
            if str(n) in by_id and n not in t["nums"]: t["nums"].append(n)
    story["oneBreath"] = story.get("oneBreath", "")
    story["drop"]["census"] = f"The census is numbered to {max(p['n'] for p in kept if p['n'])} and counting. Not every number is painted yet. That is the point."
    NE = len(story["eras"])
    story["eraSamples"] = {str(e): [p["st"][0] for p in kept if p["e"]==e][:5] for e in range(1, NE+1)}
    story["eraCounts"] = {str(e): sum(1 for p in kept if p["e"]==e) for e in range(1, NE+1)}
    story["eraHeroes"] = {str(e): [n for n in story["milestones"] if story["eras"][e-1]["range"][0] <= n <= story["eras"][e-1]["range"][1]] for e in range(1, NE+1)}

    n_states = sum(len(p["st"]) for p in kept)
    # The 96 Era I works that were painted before the numbering existed are worked into the main
    # collection on the lowest free numbers (MLow's ruling, 2026-09-07). Their ids stay as they are,
    # because the story and location files are keyed by id and renaming would orphan them.
    # Deterministic: sorted by id, filling free numbers from 1 upward, so a rebuild gives the same result.
    _taken = {p["n"] for p in kept if p.get("n") is not None}
    _free = (n for n in range(1, 7991) if n not in _taken)
    for _p in sorted([p for p in kept if p.get("n") is None], key=lambda x: x["id"]):
        _p["n"] = next(_free)
    print("  numbered the unnumbered Era I works:", sum(1 for p in kept if p.get("n") is not None), "now carry a number")

    counts = {
        "pieces": len(kept), "era1": n_era1, "states": n_states, "eras": NE,
        "maxNum": max(p["n"] for p in kept if p["n"]),
        "multiState": sum(1 for p in kept if len(p["st"])>1),
        "gifs": sum(len(p["g"]) for p in kept) + sum(1 for m in motion if not m["pid"] and m["kind"]=="gif"),
        "videos": sum(len(p["v"]) for p in kept) + sum(1 for m in motion if not m["pid"] and m["kind"]=="video"),
        "motionAttached": sum(1 for m in motion if m["pid"]),
        "loopReel": sum(1 for m in motion if not m["pid"]),
        "cut": len(cut_pieces), "stories": sum(1 for p in kept if p.get("story")),
        "atlases": n_atlas, "atlasGrid": GRID, "atlasPrefix": "d",
        "families": len({p["f"] for p in kept if p["f"]}),
        "monuments": len(story["milestones"]), "sets": len(story["sets"]), "glitch": n_gl,
    }
    data = {"counts": counts, "pieces": kept, "cutPieces": cut_pieces,
            "motion": motion, "edges": None, "story": story, "stickers": stickers}

    # ---------------- network edges ----------------
    idset = {p["id"] for p in kept}
    edges = []
    def chain(nums, typ):
        for a, b in zip(nums, nums[1:]):
            if str(a) in idset and str(b) in idset: edges.append([str(a), str(b), typ])
    for t in story["threads"]: chain(t["nums"], "thread:" + t["key"])
    chain([1468,1467,1469,1470,1477,2017,2144,2266,2275,2667,3000,3466,3500,3900,5466,5491,6490,6491,6990,6991,7490,7491,7990], "spine")
    chain(story["milestones"], "monument")
    for s in story["sets"]:
        if s["range"][1] - s["range"][0] <= 60: chain(list(range(s["range"][0], s["range"][1]+1)), "set:" + s["key"])
    for a, b in [[806,1489],[806,1488],[891,1494],[1055,1607],[898,2155],[1151,1730],[1865,1866],[2266,2267],[1866,3180],[2666,3425],[2300,3423]]:
        e=[str(a),str(b),"callback"]
        if e not in edges and str(a) in idset and str(b) in idset: edges.append(e)
    data["edges"] = edges
    counts["edges"] = len(edges)

    with open(os.path.join(ASSETS, "data.js"), "w") as f:
        f.write("window.NY_DATA = "); json.dump(data, f, separators=(",",":")); f.write(";\n")
    print("wrote data.js", os.path.getsize(os.path.join(ASSETS,"data.js"))//1024, "KB")
    print(json.dumps(counts))
