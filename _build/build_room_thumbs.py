#!/usr/bin/env python3
"""Room thumbnails for the museum menu and the home page tiles.
Reads the latest MUSEUM EXPORTS/<date>/new-yorkers-museum-NN-id.png posters (1600x900) and writes
assets/museum/rooms/<id>.jpg (640x360, q82; the menu tile is about 300 px wide so this is already retina). Rooms without a poster get a
flat card in the room colour so the menu never shows a broken image. Rerun after any export run."""
import json, os, glob, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
ROOT = os.path.dirname(SITE)
OUT = os.path.join(SITE, "assets", "museum", "rooms")
os.makedirs(OUT, exist_ok=True)
rooms = json.load(open(os.path.join(HERE, "rooms.json")))
exports = sorted(glob.glob(os.path.join(ROOT, "MUSEUM EXPORTS", "*")))
if not exports: sys.exit("no MUSEUM EXPORTS folder")
made, flat = 0, []
for r in rooms:
    src = None
    for ex in reversed(exports):
        cands = glob.glob(os.path.join(ex, f"new-yorkers-museum-*-{r['id']}.png"))
        if cands: src = cands[0]; break
    for w, suffix in ((640, ""),):
        dst = os.path.join(OUT, f"{r['id']}{suffix}.jpg")
        if src:
            im = Image.open(src).convert("RGB")
            # crop to 16:9 from the centre in case a poster is not
            W, H = im.size
            if abs(W / H - 16 / 9) > 0.01:
                nh = int(W * 9 / 16); top = max(0, (H - nh) // 2); im = im.crop((0, top, W, top + nh))
            im = im.resize((w, w * 9 // 16), Image.LANCZOS)
        else:
            im = Image.new("RGB", (w, w * 9 // 16), r["color"] or "#141820")
            d = ImageDraw.Draw(im); d.rectangle((0, 0, w, w * 9 // 16), outline="#0D0D0D", width=4)
            if w == 640: flat.append(r["id"])
        im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
    made += 1
total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(f"{made} rooms -> {OUT} ({total/1e6:.1f} MB), flat cards: {flat}")
