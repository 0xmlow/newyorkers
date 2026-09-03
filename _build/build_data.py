#!/usr/bin/env python3
"""Build the NEW YORKERS site data layer, thumbnails, and texture atlases.

Reads from NEW YORKERS MASTER ARCHIVE (copies, never touches working files).
Writes into NEW YORKERS SITE/assets/.
"""
import csv, json, os, re, sys
from multiprocessing import Pool

ROOT = "/Users/degens/Desktop/NEW YORKERS BY MLOW"
ARCHIVE = os.path.join(ROOT, "NEW YORKERS MASTER ARCHIVE")
SITE = os.path.join(ROOT, "NEW YORKERS SITE")
ASSETS = os.path.join(SITE, "assets")
THUMB_DIR = os.path.join(ASSETS, "t")
ATLAS_DIR = os.path.join(ASSETS, "atlas")

ERA1 = os.path.join(ARCHIVE, "01_THE ORIGINALS 001-766")
ERA_DIRS = {
    2: "02_THE EYE FLOWER ERA 767-816",
    3: "03_THE CITY EXPANDS 817-966",
    4: "04_THE BRAND BATCH 967-1166",
    5: "05_THE MASTERWORKS 1167-1466",
    6: "06_THE MYTHOS 1467-1866",
    7: "07_THE DEEP CITY 1867-2266",
}

def era_of(num):
    if num <= 766: return 1
    if num <= 816: return 2
    if num <= 966: return 3
    if num <= 1166: return 4
    if num <= 1466: return 5
    if num <= 1866: return 6
    return 7

# ---------- index era 1 files ----------
era1_index = {}  # filename -> relpath from ARCHIVE
for root, dirs, files in os.walk(ERA1):
    for f in files:
        if f.startswith("."): continue
        era1_index[f] = os.path.relpath(os.path.join(root, f), ARCHIVE)

# ---------- parse manifest for era 1 + unnumbered ----------
manifest = list(csv.DictReader(open(os.path.join(ARCHIVE, "MASTER MANIFEST.csv"))))
canon = [r for r in manifest if r["keep"] == "canonical"]

def parse_num(s):
    s = (s or "").strip()
    return int(s) if s.isdigit() else None

era1_groups = {}   # num -> dict
unnumbered = {}    # key -> dict
motion = []        # standalone unnumbered gif/video pieces
gif_total = vid_total = 0

era1_rows = []
for r in canon:
    num = parse_num(r["num"])
    if num is not None and num > 766:
        continue  # eras 2-7 come from rosters/art folders
    r["_num"] = num
    r["_rel"] = era1_index.get(r["new_filename"])
    era1_rows.append(r)
    if r["media"] == "gif": gif_total += 1
    if r["media"] == "video": vid_total += 1

# pass 1: images define the subjects
for r in era1_rows:
    if r["media"] != "image" or r["_rel"] is None: continue
    if r["_num"] is not None:
        g = era1_groups.setdefault(r["_num"], {"num": r["_num"], "name": r["name"], "family": r["family"],
                                               "borough": r["borough"], "imgs": [], "gifs": [], "vids": []})
    else:
        g = unnumbered.setdefault((r["family"], r["name"]), {"name": r["name"], "family": r["family"],
                                                             "borough": r["borough"], "imgs": [], "gifs": [], "vids": []})
    g["imgs"].append(r["_rel"])

# pass 2: attach motion media to subjects, or collect as standalone motion pieces
for r in era1_rows:
    if r["media"] not in ("gif", "video") or r["_rel"] is None: continue
    key_list = "gifs" if r["media"] == "gif" else "vids"
    if r["_num"] is not None and r["_num"] in era1_groups:
        era1_groups[r["_num"]][key_list].append(r["_rel"])
    elif (r["family"], r["name"]) in unnumbered:
        unnumbered[(r["family"], r["name"])][key_list].append(r["_rel"])
    else:
        motion.append({"t": r["name"], "f": r["family"], "src": r["_rel"], "kind": r["media"]})

def pick_primary(imgs):
    if not imgs: return None
    pref = [p for p in imgs if re.search(r"_01\.(png|jpg|jpeg)$", p, re.I)]
    return sorted(pref)[0] if pref else sorted(imgs)[0]

# ---------- eras 2-7 from art folders + rosters ----------
roster_by_num = {}
style_by_era = {}
for era, d in ERA_DIRS.items():
    rj = json.load(open(os.path.join(ARCHIVE, d, "roster.json")))
    if "style_block" in rj: style_by_era[era] = rj["style_block"]
    for c in rj["characters"]:
        roster_by_num[int(c["num"])] = c

era_files = {}  # num -> relpath
for era, d in ERA_DIRS.items():
    art = os.path.join(ARCHIVE, d, "art")
    for f in sorted(os.listdir(art)):
        m = re.match(r"^(\d+)\s+(.+)\.(png|jpg|jpeg)$", f, re.I)
        if not m: continue
        era_files[int(m.group(1))] = os.path.relpath(os.path.join(art, f), ARCHIVE)

# ---------- assemble numbered pieces ----------
pieces = []
missing = []
all_nums = sorted(set(list(era1_groups.keys()) + list(era_files.keys())))
for num in all_nums:
    if num <= 766:
        g = era1_groups[num]
        src = pick_primary(g["imgs"])
        if not src:
            missing.append(num); continue
        pieces.append({
            "n": num, "t": g["name"], "f": g["family"], "b": g["borough"], "e": 1,
            "src": src, "var": max(0, len(g["imgs"]) - 1),
            "g": g["gifs"], "v": g["vids"],
        })
    else:
        src = era_files.get(num)
        if not src:
            missing.append(num); continue
        c = roster_by_num.get(num, {})
        name = c.get("name") or re.match(r"^\d+\s+(.+)\.\w+$", os.path.basename(src)).group(1)
        pieces.append({
            "n": num, "t": name, "f": c.get("family", ""), "b": "", "e": era_of(num),
            "src": src, "var": 0, "g": [], "v": [],
            "p": c.get("prompt", ""),
        })

# unnumbered browse-only items
extras = []
for i, ((fam, name), g) in enumerate(sorted(unnumbered.items())):
    src = pick_primary(g["imgs"])
    if not src: continue
    extras.append({"id": f"u{i:03d}", "t": name, "f": fam, "b": g["borough"], "e": 1,
                   "src": src, "g": g["gifs"], "v": g["vids"]})

print(f"numbered pieces: {len(pieces)}  (missing: {len(missing)} {missing[:20]})")
print(f"unnumbered extras: {len(extras)}  gifs total rows: {gif_total}  vids: {vid_total}")

# ---------- thumbnails ----------
os.makedirs(THUMB_DIR, exist_ok=True)
os.makedirs(ATLAS_DIR, exist_ok=True)

jobs = []
for p in pieces:
    jobs.append((os.path.join(ARCHIVE, p["src"]), os.path.join(THUMB_DIR, f'{p["n"]}.jpg')))
for x in extras:
    jobs.append((os.path.join(ARCHIVE, x["src"]), os.path.join(THUMB_DIR, f'{x["id"]}.jpg')))

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
        errs = [e for e in pool.map(make_thumb, jobs, chunksize=20) if e]
    print("thumb errors:", errs[:10], f"({len(errs)} total)")

    # ---------- atlases: 128px center-crop tiles, 32x32 per 4096 atlas ----------
    from PIL import Image
    TILE, GRID = 128, 32
    PER = GRID * GRID
    n_atlas = (len(pieces) + PER - 1) // PER
    for a in range(n_atlas):
        out = os.path.join(ATLAS_DIR, f"a{a}.jpg")
        if os.path.exists(out):
            print("atlas exists", out); continue
        sheet = Image.new("RGB", (TILE * GRID, TILE * GRID), (13, 13, 13))
        for i in range(PER):
            gi = a * PER + i
            if gi >= len(pieces): break
            p = pieces[gi]
            tp = os.path.join(THUMB_DIR, f'{p["n"]}.jpg')
            try:
                im = Image.open(tp).convert("RGB")
                w, h = im.size
                s = min(w, h)
                im = im.crop(((w - s)//2, (h - s)//2, (w + s)//2, (h + s)//2)).resize((TILE, TILE), Image.LANCZOS)
                # hairline divider border so near-black artworks stay legible on the ink ground
                from PIL import ImageDraw
                dr = ImageDraw.Draw(im)
                dr.rectangle([0, 0, TILE - 1, TILE - 1], outline=(42, 48, 64), width=2)
                sheet.paste(im, ((i % GRID) * TILE, (i // GRID) * TILE))
            except Exception as e:
                print("atlas tile err", p["n"], e)
        sheet.save(out, "JPEG", quality=82, optimize=True)
        print("wrote", out)

    # ---------- aspect ratios for detail planes ----------
    for p in pieces:
        tp = os.path.join(THUMB_DIR, f'{p["n"]}.jpg')
        try:
            with Image.open(tp) as im:
                p["ar"] = round(im.size[0] / im.size[1], 3)
        except Exception:
            p["ar"] = 1.778

    # ---------- story data (quoted from THE STORY OF NEW YORKERS.md, 2026-08-12) ----------
    story = {
        "oneLine": "Every New Yorker gets a portrait. Even the villains.",
        "oneBreath": "The city has been watching you your whole life. It turns out it was taking notes, and the notes are beautiful.",
        "thesis": "Every piece in this collection is about one thing: what it means to be seen in a city of eight million.",
        "marks": [
            {"name": "The Eye Flower", "meaning": "The city's attention. It blooms wherever a moment is truly witnessed. Its iris is human because the city's eyes are its people."},
            {"name": "The Blue Evil Eye", "meaning": "Protection. It watches so you can stop watching your back. It never moves, never blinks in stills. It is MLow's sovereign mark."},
            {"name": "The Circle Grid Flower Sigil", "meaning": "Community. The Blossom mark. It appears where people have built something together. The Sigil Writer paints them at 4am and has never been seen."},
        ],
        "eras": [
            {"i": 1, "range": [1, 766], "roman": "I", "title": "The Originals", "sub": "The People", "desc": "The founding census. Legends, neighbors, places, villains. The city assembled its cast."},
            {"i": 2, "range": [767, 816], "roman": "II", "title": "The Eye Flower Era", "sub": "The Awakening", "desc": "The flowers arrive. The city starts visibly watching. Myth enters the frame: the Rat King is crowned, the Trash Mountain rises."},
            {"i": 3, "range": [817, 966], "roman": "III", "title": "The City Expands", "sub": "The Working City", "desc": "The heroes and lost trades. The city remembers who built it and who keeps it alive at 4am."},
            {"i": 4, "range": [967, 1166], "roman": "IV", "title": "The Brand Batch", "sub": "The Marks", "desc": "Protection and community arrive as symbols. The evil eye starts watching from every frame. Number 1000, The Subway Samaritan, states the whole thesis: strangers save strangers here."},
            {"i": 5, "range": [1167, 1466], "roman": "V", "title": "The Masterworks", "sub": "The Feelings", "desc": "Every character gets its own color story and its own decisive moment. The collection learns chiaroscuro and grief and joy: the Oath Ceremony, the Orange Sky, the Angel of the Waters."},
            {"i": 6, "range": [1467, 1866], "roman": "VI", "title": "The Mythos", "sub": "The Meaning", "desc": "The origin stories, the illusions, the hidden city. The world explains itself. Love arcs pay off. The Rat King marries the Pigeon Queen and the kingdoms of above and below unite."},
            {"i": 7, "range": [1867, 2266], "roman": "VII", "title": "The Deep City", "sub": "The Time", "desc": "The collection swallows the calendar and the clock: the Hours, the Months, the Moons, the Decades, the Lines, the Tarot. History enters: the Boatlift, the Miracle on the Hudson. The chapter closes with the Curtain Call, and then refuses to close."},
        ],
        "spine": [
            {"n": 1468, "title": "The Seed Beneath the City", "text": "Before everything, one glowing seed sleeps below the tunnels. Its roots thread the subway lines. The city grows on top of it and has always felt slightly alive because of it."},
            {"n": 1467, "title": "The First Eye Flower", "text": "A century ago, a dreamer's tear fell through a subway grate. The seed answered. One impossible flower grew where it landed and looked back at the city."},
            {"n": 1469, "title": "The Gardener of the First Bloom", "text": "Somebody watered that grate every night in 1926 and told no one. Devotion is the collection's oldest job."},
            {"n": 1470, "title": "The Spread", "text": "Bees carry iris pollen along the elevated lines. Blooms open when headlights pass. The flower district learns to harvest them. The library saves the seeds. Kids trade them like marbles."},
            {"n": 1477, "title": "The Protection Economy", "text": "The Talisman Maker births every evil eye in the city from molten blue glass. The factory hangs them like a protective galaxy. The basket dog delivers them."},
            {"n": 2017, "title": "The Alignment", "text": "One night each May, every eye flower in the city opens at once and looks up. The calendar and the mythos agree."},
            {"n": 2144, "title": "The Revelation", "text": "The map room's secret drawer opens: every bloom in the city plotted forms one enormous iris around the first grate. The city is not covered in eyes. The city IS an eye."},
            {"n": 2266, "title": "The Continuation", "text": "The painter touches a blank canvas and a bud pushes up through the wet primer from inside the painting. The collection cannot end, because the city keeps making New Yorkers."},
        ],
        "threads": [
            {"key": "love", "name": "The Love Thread", "desc": "Love in this collection is a route map. A stranger across the platform becomes a poster, a reply, a proposal on the same fire escape, the same booth fifty years later.", "nums": [1151, 1730, 1731, 1253, 1686, 1163, 1627, 1632, 1633]},
            {"key": "watcher", "name": "The Watcher Lineage", "desc": "The Window Watcher sees everything. The watched become the watchers. The final watcher is the person holding the token.", "nums": [942, 1713, 1507, 2103, 1866]},
            {"key": "court", "name": "The Court of Two Kingdoms", "desc": "The comedy engine. Above and below, reconciled by marriage and a shared bagel.", "nums": [767, 1481, 1482, 1485, 1800, 2149, 2150, 2153]},
            {"key": "kindness", "name": "The Kindness Files", "desc": "The proof thread. When someone asks what the collection believes, point here.", "nums": [1000, 1937, 1939, 1940, 1596, 1942]},
            {"key": "memory", "name": "The Memory Thread", "desc": "Loss, held gently. The city loses things and refuses to lose their meaning.", "nums": [775, 1889, 1894, 2061, 1832, 1438, 1439, 1900]},
            {"key": "redemption", "name": "The Villain Redemptions", "desc": "Villains here are weather: survived, joked about, occasionally forgiven.", "nums": [806, 1489, 1488, 891, 1494, 1055, 1607, 898, 2155]},
            {"key": "succession", "name": "The Succession Thread", "desc": "The city renews itself. Nothing ends; it gets handed down.", "nums": [1727, 1961, 1635, 2260, 2148, 2264]},
        ],
        "milestones": [1000, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2265, 2266],
        "sets": [
            {"key": "hours", "name": "The Hours", "range": [1977, 2000], "hook": "Own your hour. Everyone has one that belongs to them."},
            {"key": "months", "name": "The Months", "range": [2001, 2012], "hook": "Own your month. Everyone has a birthday."},
            {"key": "moons", "name": "The Moons", "range": [2013, 2024], "hook": "Twelve full moons over the city, named the old way."},
            {"key": "seasons", "name": "The Seasons", "range": [2025, 2028], "hook": "Four New York seasons, none of them subtle."},
            {"key": "elements", "name": "The Elements", "range": [2029, 2038], "hook": "Steam, steel, glass, brick. The city's periodic table."},
            {"key": "decades", "name": "The Decades", "range": [2039, 2051], "hook": "The Gilded Dusk to the Twenty Twenties. Time as a neighbor."},
            {"key": "neverbuilt", "name": "The Never Built City", "range": [2052, 2056], "hook": "The highways, domes and runways the city talked itself out of."},
            {"key": "lost", "name": "The Lost Buildings", "range": [2057, 2064], "hook": "Dreamland, the Singer Tower, the Crystal Palace. Gone, not forgotten."},
            {"key": "lines", "name": "The Subway Lines", "range": [2067, 2092], "hook": "Own your line. Everyone has a home line."},
            {"key": "bridges", "name": "The Bridges", "range": [2093, 2099], "hook": "Seven crossings, seven characters."},
            {"key": "tarot", "name": "The New York Tarot", "range": [2101, 2122], "hook": "Twenty two cards. The Fool gets on at the airport."},
        ],
        "drop": {
            "headline": "Drops at NFT NYC, September 2026",
            "body": "The collection mints as dynamic tokens on Transient Labs ERC-7160. The artist appends chapters, the collector pins the state they love. Chapters are eras. The sets are quests. The milestones are the grails. The story is the mechanic.",
        },
        "artist": "MLow is a New York City artist working in AI generated art, NFT collections on Ethereum, and physical metal and giclee prints. His public art has covered 5,000+ NYC taxis with Somo and Art Crush Gallery.",
    }

    counts = {
        "pieces": len(pieces), "extras": len(extras), "motion": len(motion),
        "gifs": sum(len(p["g"]) for p in pieces) + sum(len(x["g"]) for x in extras) + sum(1 for m in motion if m["kind"] == "gif"),
        "videos": sum(len(p["v"]) for p in pieces) + sum(len(x["v"]) for x in extras) + sum(1 for m in motion if m["kind"] == "video"),
        "atlases": n_atlas, "atlasGrid": GRID, "atlasTile": TILE,
        "minNum": pieces[0]["n"], "maxNum": pieces[-1]["n"],
    }

    data = {"counts": counts, "pieces": pieces, "extras": extras, "motion": motion, "story": story}
    out = os.path.join(ASSETS, "data.js")
    with open(out, "w") as f:
        f.write("window.NY_DATA = ")
        json.dump(data, f, separators=(",", ":"))
        f.write(";\n")
    print("wrote", out, os.path.getsize(out) // 1024, "KB")
    print("counts", counts)
