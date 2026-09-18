#!/usr/bin/env python3
"""keystone.html: KEYSTONE 111, the founding 111 hung along one spiral ramp (Three.js).

The design is hand made and lives in _build/keystone/src.html. It was delivered as a standalone
folder (KEYSTONE 111 MARKETING KIT 2026-09-18/06_3D_GALLERY) with its own img/ and a CDN copy of
Three.js. This script turns that file into a page of the census site:

  - IMG points at assets/keystone/ ({id}s.jpg 640 wide for the wall, {id}l.jpg 1280 wide on open)
  - Three.js comes from assets/three.min.js (the same r128 the museum ships) instead of cdnjs
  - the logo goes home to index.html and "See it in the census" opens the piece's own record page,
    n/<site id>.html. The site keys records by data.js id, not by census number: the three Era I
    leads NO. 1, 2 and 3 are x000, x001 and x002, so every piece is resolved here by its number
  - head gets the site's icon, theme colour and Open Graph tags; build_seo.py adds the rest

To take a new design drop: copy the new index.html over _build/keystone/src.html and rerun.
Images are synced from the marketing kit folder when it is present; when it is not, whatever
already sits in assets/keystone/ stands, and the build fails only if a file is missing.
Run before build_seo.py; part of build_all.sh.
"""
import json, os, re, shutil, sys
from page_shell import cfg, esc

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
SRC = os.path.join(HERE, "keystone", "src.html")
IMG_SRC = os.path.join(os.path.dirname(SITE), "KEYSTONE 111 MARKETING KIT 2026-09-18", "06_3D_GALLERY", "img")
IMG_DST = os.path.join(SITE, "assets", "keystone")
URL = cfg()["siteUrl"]

s = open(SRC, encoding="utf-8").read()
m = re.search(r"var K111 = (\[.*?\]);\n</script>", s, re.S)
if not m: raise SystemExit("keystone: K111 array not found in src.html")
k = json.loads(m.group(1))

# ---------- resolve every piece to its record page ----------
d = open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read()
D = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
byn = {p["n"]: p for p in D["pieces"] if p.get("n") is not None}
missing = []
for piece in k:
    p = byn.get(piece["n"])
    if not p: missing.append((piece["n"], piece["t"])); continue
    if piece["t"].strip().lower() != p["t"].strip().lower():
        print(f"  note: NO. {piece['n']} is titled {piece['t']!r} here and {p['t']!r} in data.js")
    piece["sid"] = p["id"]
if missing: raise SystemExit("keystone: no record in data.js for " + ", ".join(f"NO. {n} {t}" for n, t in missing))

# ---------- images ----------
if os.path.isdir(IMG_SRC):
    os.makedirs(IMG_DST, exist_ok=True)
    copied = 0
    for f in os.listdir(IMG_SRC):
        if not f.endswith(".jpg"): continue
        a, b = os.path.join(IMG_SRC, f), os.path.join(IMG_DST, f)
        if not os.path.exists(b) or os.path.getsize(a) != os.path.getsize(b):
            shutil.copy2(a, b); copied += 1
    if copied: print(f"  synced {copied} images from the marketing kit")
lost = [f"{p['id']}{sz}.jpg" for p in k for sz in ("s", "l") if not os.path.exists(os.path.join(IMG_DST, f"{p['id']}{sz}.jpg"))]
if lost: raise SystemExit(f"keystone: {len(lost)} images missing from assets/keystone, e.g. {lost[:4]}")

# ---------- rewrite the page ----------
s = s.replace(m.group(1), json.dumps(k, ensure_ascii=False, separators=(",", ":")), 1)
subs = [
    ("var IMG = 'img/';", "var IMG = 'assets/keystone/';"),
    ('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>', '<script src="assets/three.min.js"></script>'),
    ('<a href="https://n3wyorkers.com" target="_blank" rel="noopener" aria-label="NEW YORKERS by MLow">', '<a href="index.html" aria-label="NEW YORKERS home">'),
    ('<a class="out" id="kLink" href="https://n3wyorkers.com/n/1" target="_blank" rel="noopener">', '<a class="out" id="kLink" href="n/x000.html">'),
    ("kLink').href='https://n3wyorkers.com/n/'+d.n", "kLink').href='n/'+d.sid+'.html'"),
    ("<title>Keystone 111</title>", "<title>NEW YORKERS · Keystone 111</title>"),
]
for old, new in subs:
    if s.count(old) != 1: raise SystemExit(f"keystone: expected exactly one match for {old[:60]!r}, found {s.count(old)}. The design changed; update build_keystone.py")
    s = s.replace(old, new, 1)
if "n3wyorkers.com" in s.replace(URL, ""): print("  note: the page still carries an absolute n3wyorkers.com link")

desc = "KEYSTONE 111: the 111 founding NEW YORKERS, hung along one continuous spiral. Drag to travel the ramp, click a piece to step up to it."
head = "\n".join([
    f'<meta property="og:type" content="website">',
    f'<meta property="og:title" content="NEW YORKERS · Keystone 111">',
    f'<meta property="og:description" content="{esc(desc)}">',
    f'<meta property="og:image" content="{URL}/assets/keystone/1l.jpg">',
    f'<meta property="og:url" content="{URL}/keystone">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:site" content="@degens">',
    '<meta name="theme-color" content="#0D0D0D">',
    '<link rel="icon" type="image/png" href="assets/brand/eye_truecolor.png">',
    '<link rel="apple-touch-icon" href="assets/brand/eye_truecolor.png">',
])
s = re.sub(r'<meta name="description" content="[^"]*">', lambda _: f'<meta name="description" content="{esc(desc)}">\n' + head, s, count=1)

out = os.path.join(SITE, "keystone.html")
open(out, "w", encoding="utf-8").write(s)
print(f"keystone.html: {len(k)} pieces on the ramp, {len(k) * 2} images in assets/keystone, {os.path.getsize(out) // 1024} KB")
