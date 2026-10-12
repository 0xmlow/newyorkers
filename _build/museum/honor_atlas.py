#!/usr/bin/env python3
"""Room 183, the Hall of Fame: every honorary portrait on the site, packed into atlases for the museum.

Reads _build/honoraries/honoraries.json and assets/honoraries/<l>.jpg (both written by
_build/honoraries/sync.py). Writes
  assets/museum/honor/a<i>.webp     2048 square, 8 by 14 tiles of 256 by 144 (16:9), the desktop sheets
  assets/museum/honor/a<i>s.webp    1024 square, the same layout, for phones
  assets/museum/honor/hang.json     one row per work in hang order: id, name, handle, title, cat, large file, w/h, bio
  src/honor.ts                      the count and the category string the room lays itself out by
A work that is not 16:9 (the ten upright portraits) sits in its tile on the dark mat, uncropped.

Hang order: MLow first (the room puts slot 0 at eye level on the bay the visitor arrives facing), then by the page's
categories in the page's order, so a bay of the rotunda holds one trade.
Run from _build/museum after the honoraries change: python3 honor_atlas.py. Runs in build_all.sh.
"""
import json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(SITE, "assets", "honoraries")
OUT = os.path.join(SITE, "assets", "museum", "honor")
COLS, ROWS, TW, TH = 8, 14, 256, 144
PER = COLS * ROWS
MAT = (11, 12, 16)

D = json.load(open(os.path.join(SITE, "_build", "honoraries", "honoraries.json")))
order = {c["code"]: i for i, c in enumerate(D["cats"])}
people = sorted(D["people"], key=lambda p: (p["id"] != "mlow", order.get(p["cat"], 99)))
rows = []
for p in people:
    for w in p["works"]:
        rows.append({"id": p["id"], "n": p["name"], "h": p.get("handle") or "", "t": w["title"], "c": p["cat"], "l": w["l"], "ar": round(w["w"] / w["h"], 4), "b": (p.get("bio") or "").strip()})
N = len(rows)
os.makedirs(OUT, exist_ok=True)


def tile(path):
    im = Image.open(path).convert("RGB")
    t = Image.new("RGB", (TW * 2, TH * 2), MAT)  # work at 2x, then one downscale for clean edges
    s = min(t.width / im.width, t.height / im.height)
    if abs(im.width / im.height - TW / TH) < 0.03:  # 16:9 within a few pixels: fill exactly
        im = im.resize((t.width, t.height), Image.LANCZOS)
        t.paste(im, (0, 0))
    else:
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        t.paste(im, ((t.width - im.width) // 2, (t.height - im.height) // 2))
    return t.resize((TW, TH), Image.LANCZOS)


missing = []
for a in range((N + PER - 1) // PER):
    sheet = Image.new("RGB", (COLS * TW, COLS * TW), MAT)
    for k in range(PER):
        i = a * PER + k
        if i >= N:
            break
        f = os.path.join(SRC, rows[i]["l"])
        if not os.path.exists(f):
            missing.append(rows[i]["l"])
            continue
        sheet.paste(tile(f), ((k % COLS) * TW, (k // COLS) * TH))
    sheet.save(os.path.join(OUT, f"a{a}.webp"), quality=84, method=6)
    sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(os.path.join(OUT, f"a{a}s.webp"), quality=82, method=6)
    print(f"atlas {a}: {min(PER, N - a * PER)} works")
json.dump(rows, open(os.path.join(OUT, "hang.json"), "w"), ensure_ascii=False, separators=(",", ":"))
cats = "".join(r["c"] for r in rows)
names = {c["code"]: c["name"] for c in D["cats"]}
with open(os.path.join(HERE, "src", "honor.ts"), "w") as f:
    f.write("/* Written by honor_atlas.py from the honoraries page. Do not edit: rerun the script. */\n")
    f.write(f"export const HONOR_N = {N};\nexport const HONOR_PER = {PER};\nexport const HONOR_COLS = {COLS};\nexport const HONOR_ROWS = {ROWS};\n")
    f.write(f"export const HONOR_CATS = {json.dumps(cats)};\nexport const HONOR_CAT_NAMES: Record<string, string> = {json.dumps(names)};\n")
print(f"{N} works, {(N + PER - 1) // PER} atlases, hang.json and src/honor.ts written")
if missing:
    print("MISSING", len(missing), missing[:5]); sys.exit(1)
