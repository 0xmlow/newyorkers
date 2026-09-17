#!/usr/bin/env python3
"""Swap a piece's lead image for a likeness redo without a full data rebuild.

likeness_swaps.json maps a piece id to a new master (path under the project root) and the state key it
replaces. The new image gets its own thumb key, so no URL that Cloudflare caches for a year changes content.
The new one leads and the replaced original follows it as the second state. The 3D field's atlas sheets are repainted for the swapped
tiles and written under a new prefix for the same cache reason. build_data_v4.py applies the same swaps
(apply_swaps) so a --data build keeps them. Idempotent."""
import json, os, hashlib
from PIL import Image, ImageDraw
ROOT = "/Users/degens/Desktop/NEW YORKERS BY MLOW"
SITE = os.path.join(ROOT, "NEW YORKERS SITE")
T = os.path.join(SITE, "assets", "t"); ATLAS = os.path.join(SITE, "assets", "atlas")
SW = json.load(open(os.path.join(SITE, "_build", "likeness_swaps.json")))

def key(rel): return "h" + hashlib.md5(rel.encode()).hexdigest()[:10]

def make_thumbs():
    for i, w in SW.items():
        dst = os.path.join(T, key(w["src"]) + ".jpg")
        if not os.path.exists(dst):
            im = Image.open(os.path.join(ROOT, w["src"])).convert("RGB"); im.thumbnail((1000, 1000), Image.LANCZOS)
            im.save(dst, "JPEG", quality=78, optimize=True)

def apply_swaps(pieces):
    n = 0
    for p in pieces:
        w = SW.get(p["id"])
        if not w or not p.get("st"): continue
        k = key(w["src"])
        # the original stays on the piece as its second state, so it is still one tap away
        p["st"] = [k, w["replaces"]] + [x for x in p["st"] if x not in (k, w["replaces"])]
        # the replaced original is the Canal Street knockoff: still in the strip, never the default
        if w.get("canal"): p["cs"] = {"k": w["replaces"], "name": w["canal"]}
        with Image.open(os.path.join(T, k + ".jpg")) as im: p["ar"] = round(im.size[0] / im.size[1], 3)
        n += 1
    return n

if __name__ == "__main__":
    make_thumbs()
    path = os.path.join(SITE, "assets", "data.js")
    s = open(path).read()
    head, body = s[:s.index("{")], s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1]
    data = json.loads(body); C = data["counts"]
    n = apply_swaps(data["pieces"])
    # atlas: tiles follow data.pieces order, TILE 96 on a GRID x GRID sheet
    TILE, GRID = 96, C["atlasGrid"]; PER = GRID * GRID
    sig = hashlib.md5(json.dumps(sorted((i, w["src"]) for i, w in SW.items())).encode()).hexdigest()[:6]
    base = "d"; new = "d" + sig + "_"
    idx = {p["id"]: gi for gi, p in enumerate(data["pieces"])}
    for a in range(C["atlases"]):
        dst = os.path.join(ATLAS, f"{new}{a}.jpg")
        if os.path.exists(dst): continue
        sheet = Image.open(os.path.join(ATLAS, f"{base}{a}.jpg")).convert("RGB")
        for i in SW:
            gi = idx.get(i)
            if gi is None or gi // PER != a: continue
            im = Image.open(os.path.join(T, data["pieces"][gi]["st"][0] + ".jpg")).convert("RGB")
            w, h = im.size; s0 = min(w, h)
            im = im.crop(((w-s0)//2, (h-s0)//2, (w+s0)//2, (h+s0)//2)).resize((TILE, TILE), Image.LANCZOS)
            ImageDraw.Draw(im).rectangle([0, 0, TILE-1, TILE-1], outline=(42, 48, 64), width=1)
            sheet.paste(im, (((gi % PER) % GRID) * TILE, ((gi % PER) // GRID) * TILE))
        sheet.save(dst, "JPEG", quality=80, optimize=True)
    C["atlasPrefix"] = new
    C["states"] = sum(len(p.get("st") or []) for p in data["pieces"])
    open(path, "w").write(head + json.dumps(data, separators=(",", ":")) + ";\n")
    print("likeness swaps applied:", n, "| atlas prefix:", new)
