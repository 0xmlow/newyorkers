#!/usr/bin/env python3
"""v3 art prep for BLOOM RUN: pulls NEW YORKERS art from the project into small embeddable sprites.

  src/art/pt/<n>.webp     the 112 census New Yorkers you count, chosen from the sticker set (NEW YORKERS 3D 2026-08-23/
                          3_STICKER_PROPS) and drawn from their paintings, 208 by 117; the game frames a round token from the centre
  src/art/relic/<L>.webp  one object per level from the 1000 object expansion (301 to 1300), themed to the block
  src/art/eye/<k>.webp    Open Eye Flower taxi relics and crowns (1301 to 2300): the power ups
  src/art.json            what the game needs to know: sticker number, title, record id, level; relic names

Stickers go to the level nearest where the piece lives on the atlas (geo.js), at most seven a level,
so the New Yorkers you count on a block are the ones the census placed there.
Rerun only when a source changes; outputs are committed.
"""
import os, re, json, csv, math
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__)); B = os.path.dirname(HERE); SITE = os.path.dirname(B); ROOT = os.path.dirname(SITE)
OUT = os.path.join(HERE, "src", "art")
for d in ("pt", "relic", "eye"): os.makedirs(os.path.join(OUT, d), exist_ok=True)

def fit(im, px):
    bb = im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    if bb: im = im.crop(bb)
    im.thumbnail((px, px), Image.LANCZOS); return im
def save(im, path, q=80):
    im.save(path, "WEBP", quality=q, method=6); return os.path.getsize(path)

# ---------- levels: where each one is on the map ----------
LEVELS = [("Wall Street",40.7061,-74.0092),("SoHo",40.7233,-74.0030),("Canal Street",40.7178,-73.9990),("Lower East Side",40.7185,-73.9885),
  ("Flatiron",40.7411,-73.9897),("Midtown Rush",40.7549,-73.9840),("Times Square",40.7580,-73.9855),("Central Park South",40.7656,-73.9760),
  ("Harlem, 125th Street",40.8100,-73.9500),("Brooklyn Bridge",40.7061,-73.9969),("DUMBO",40.7033,-73.9881),("Williamsburg",40.7143,-73.9614),
  ("Coney Island",40.5755,-73.9707),("Astoria",40.7644,-73.9235),("Jackson Heights",40.7557,-73.8831),("Flushing, Main Street",40.7580,-73.8303),
  ("Rockaway Beach",40.5834,-73.8157),("The Bronx, 161st Street",40.8296,-73.9262),("Arthur Avenue",40.8550,-73.8880),("St. George",40.6437,-74.0736)]

# ---------- stickers ----------
d = open(os.path.join(SITE, "assets", "data.js")).read(); D = json.loads(d[d.index("=")+1:].rstrip().rstrip(";"))
g = open(os.path.join(SITE, "assets", "geo.js")).read(); Gj = json.loads(g[g.index("=")+1:].rstrip().rstrip(";"))
byn = {p["n"]: p for p in D["pieces"] if p.get("n") is not None}
geo = {p["n"]: p for p in Gj["pieces"] if p.get("n") is not None}
SDIR = os.path.join(ROOT, "NEW YORKERS 3D 2026-08-23", "3_STICKER_PROPS")
rows = [r for r in csv.DictReader(open(os.path.join(SDIR, "MANIFEST.csv"))) if r["kind"] == "sticker"]

def key_ground(im):
    """The previews sit on a flat light grey studio ground with a soft shadow. Flood from the corners and
    drop everything that is ground or shadow; the white die cut border is brighter than the ground, so it stays."""
    im = im.convert("RGBA"); w, h = im.size; px = im.load()
    bg = [px[2,2], px[w-3,2], px[2,h-3], px[w-3,h-3]]
    br = sum(sum(c[:3]) for c in bg) / (3*len(bg))                 # ground brightness
    mask = Image.new("L", (w, h), 0); m = mask.load()
    stack = [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]; seen = bytearray(w*h)
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y*w+x]: continue
        seen[y*w+x] = 1; r, gg, b, a = px[x, y]; v = (r+gg+b)/3
        if v > br + 7 or max(r,gg,b) - min(r,gg,b) > 18: continue   # the white border or the art: stop
        m[x, y] = 255; stack += [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]
    alpha = Image.eval(mask, lambda v: 255 - v)
    im.putalpha(alpha); return im

stickers = []
for r in rows:
    n = int(r["number"]); p = byn.get(n)
    # v5: the painting itself, not the 3D sticker render. The stickers were paper cut outs photographed on a studio
    # ground and read as white smudges at game size. pt/ is the whole 16:9 painting; the game cuts the round portrait
    # token from its centre at draw time, so one small file serves the curb, the count card, the wall and the album.
    if not (p and p.get("st")): continue
    src = os.path.join(SITE, "assets", "t", p["st"][0] + ".jpg")
    if not os.path.exists(src): continue
    im = Image.open(src).convert("RGB"); w, h = im.size
    save(im.resize((208, 117), Image.LANCZOS), os.path.join(OUT, "pt", f"{n}.webp"), 70)
    gp = geo.get(n) or {}
    stickers.append({"n": n, "t": (p or {}).get("t") or r["title"], "id": (p or {}).get("id"), "lat": gp.get("lat"), "lon": gp.get("lon"), "nb": gp.get("nb")})
# nearest level with room, closest pairs first
cap = {i: 6 for i in range(len(LEVELS))}
pairs = sorted(((math.hypot((s["lat"] or 40.75) - la, ((s["lon"] or -73.98) - lo) * .76), k, i)
                for k, s in enumerate(stickers) for i, (_, la, lo) in enumerate(LEVELS)))
done = set()
for dist, k, i in pairs:
    if k in done or cap[i] == 0: continue
    stickers[k]["L"] = i; cap[i] -= 1; done.add(k)
for s in stickers: s.pop("lat"); s.pop("lon")

# ---------- relics: one themed object per level, and the specials ----------
OBJ = os.path.join(ROOT, "NEW_YORKERS_1000_OBJECT_EXPANSION_301-1300")
cat = {x["id"]: x for x in json.load(open(os.path.join(OBJ, "MASTER_CATALOG_301-1300.json")))}
RELIC = [581, 929, 737, 497, 629, 509, 653, 533, 485, 833, 425, 821, 521, 437, 1121, 473, 1157, 449, 689, 857]
SPECIAL = {"garage": 809, "portal": 1265, "heirloom": 1289, "rat": 350}
def objpng(i):
    x = cat[i]; return os.path.join(OBJ, x["root"], x["png"])
relics = []
for L, i in enumerate(RELIC):
    save(fit(Image.open(objpng(i)).convert("RGBA"), 84), os.path.join(OUT, "relic", f"{L}.webp"))
    relics.append({"L": L, "id": i, "name": re.sub(r" \d+$", "", cat[i]["name"])})
for k, i in SPECIAL.items():
    save(fit(Image.open(objpng(i)).convert("RGBA"), 84), os.path.join(OUT, "relic", f"{k}.webp"))

# v5: the low poly street props are gone; the game draws its street furniture as vectors
props = []

# ---------- Open Eye Flower power ups ----------
EF = os.path.join(ROOT, "NEW_YORKERS_NEXT_1000_EYE_FLOWER_MLOW_BLOSSOM_1301-2300")
ecat = json.load(open(os.path.join(EF, "MASTER_CATALOG_1301-2300.json")))
taxi = [x for x in ecat if x["family"] == "Open Eye Flower taxi relics"][:3]
crown = [x for x in ecat if x["family"].startswith("sovereign Open Eye Flower crowns")][:1]
eyes = []
for k, x in enumerate(taxi + crown):
    name = "crown" if x in crown else f"taxi{k}"
    save(fit(Image.open(os.path.join(EF, x["root"], x["png"])).convert("RGBA"), 72), os.path.join(OUT, "eye", f"{name}.webp"))
    eyes.append({"k": name, "id": x["id"], "name": re.sub(r" \d+$", "", x["name"])})

json.dump({"levels": [l[0] for l in LEVELS], "stickers": stickers, "relics": relics, "props": props, "eyes": eyes},
          open(os.path.join(HERE, "src", "art.json"), "w"), separators=(",", ":"))
tot = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
per = {i: sum(1 for s in stickers if s.get("L") == i) for i in range(len(LEVELS))}
print(f"stickers {len(stickers)} per level {per}\nrelics {len(relics)}+{len(SPECIAL)} props {len(props)} eyes {len(eyes)}  art total {tot//1024} KB")
