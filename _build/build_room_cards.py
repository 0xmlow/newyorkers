#!/usr/bin/env python3
"""Share cards for the museum rooms: the picture X, iMessage and Discord show when someone posts a room.

MLow 2026-10-06: a museum link is museum.html#room=<id>, and a crawler never sees the hash, so every room
posted on X showed the same museum card. The museum's share buttons now hand out rooms/<id>?walk (the room's
own page, which sends a person straight into the room), and this gives each of those pages a card of the room.

Source per room: the newest 1600x900 poster in MUSEUM EXPORTS (the same one the menu thumbnails come from),
else og/room_src/<id>.jpg (headless renders for rooms that never had an export), else the room is left to the
banner rotation in build_og.py. Writes assets/og/rooms/<id>-<hash>.jpg at 1200x630 and og/room_cards.json,
which build_og.py reads. Skips a card whose source and design have not changed."""
import glob, hashlib, io, json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
FD = os.path.join(HERE, "honoraries", "fonts")
OUT = os.path.join(SITE, "assets", "og", "rooms"); os.makedirs(OUT, exist_ok=True)
MAN = os.path.join(HERE, "og", "room_cards.json")
W, H = 1200, 630
DESIGN = "rc2"  # bump when the layout changes, so every card re-renders
INK, CLOUD, SLATE, ACID = (8,13,22), (236,232,221), (136, 153, 170), (236,201,129)
rooms = json.load(open(os.path.join(HERE, "rooms.json")))
exports = sorted(glob.glob(os.path.join(ROOT, "MUSEUM EXPORTS", "*")))
eye = Image.open(os.path.join(SITE, "assets", "brand", "eye_truecolor.png")).convert("RGBA")


def font(name, size, var=None):
    f = ImageFont.truetype(os.path.join(FD, name), size)
    if var: f.set_variation_by_name(var)
    return f


def source(rid):
    for ex in reversed(exports):
        c = glob.glob(os.path.join(ex, f"new-yorkers-museum-*-{rid}.png"))
        if c: return c[0]
    p = os.path.join(HERE, "og", "room_src", rid + ".jpg")
    return p if os.path.exists(p) else None


def fit(d, text, name, start, width, lo, var=None):
    s = start
    while s > lo:
        f = font(name, s, var)
        if d.textlength(text, font=f) <= width: return f
        s -= 2
    return font(name, lo, var)


def render(r, src):
    im = Image.open(src).convert("RGB")
    w, h = im.size; ratio = W / H
    if w / h > ratio: nw = round(h * ratio); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = round(w / ratio); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im = im.resize((W, H), Image.LANCZOS).convert("RGBA")
    # a dark band rising from the bottom so the type always reads, whatever the room looks like
    grad = Image.new("L", (1, H), 0)
    for y in range(H):
        t = max(0.0, (y - H * 0.42) / (H * 0.58)); grad.putpixel((0, y), int(235 * t ** 1.4))
    shade = Image.new("RGBA", (W, H), INK + (0,)); shade.putalpha(grad.resize((W, H)))
    im = Image.alpha_composite(im, shade)
    d = ImageDraw.Draw(im)
    X = 56
    kicker = f"ROOM {r['index']} · THE MUSEUM · {r['area']}"
    kf = fit(d, kicker, "IBMPlexMono-Medium.ttf", 22, W - 2 * X, 14)
    nf = fit(d, r["name"], "Fraunces.ttf", 92, W - 2 * X, 46, var="Bold")
    d.text((X, H - 150), r["name"], font=nf, fill=CLOUD, anchor="ls")
    d.text((X, H - 104), kicker, font=kf, fill=ACID, anchor="ls")
    foot = font("IBMPlexMono-Medium.ttf", 20)
    d.text((X + 46, H - 46), "NEW YORKERS BY MLOW · WALK INSIDE AT N3WYORKERS.COM", font=foot, fill=SLATE, anchor="lm")
    e = eye.resize((34, 34), Image.LANCZOS); im.alpha_composite(e, (X, H - 63))
    b = io.BytesIO(); im.convert("RGB").save(b, "JPEG", quality=86, optimize=True, progressive=True, subsampling=0)
    return b.getvalue()


old = json.load(open(MAN)) if os.path.exists(MAN) else {}
man, made, kept, none = {}, 0, 0, []
for r in rooms:
    src = source(r["id"])
    if not src: none.append(r["id"]); continue
    key = hashlib.sha256(f"{DESIGN}|{r['name']}|{r['area']}|{r['index']}|{os.path.getsize(src)}|{int(os.path.getmtime(src))}".encode()).hexdigest()[:12]
    prev = old.get(r["id"])
    if prev and prev.get("key") == key and os.path.exists(os.path.join(OUT, prev["file"])):
        man[r["id"]] = prev; kept += 1; continue
    data = render(r, src)
    name = f"{r['id']}-{hashlib.sha256(data).hexdigest()[:10]}.jpg"
    open(os.path.join(OUT, name), "wb").write(data)
    man[r["id"]] = {"file": name, "key": key, "alt": f"{r['name']}, room {r['index']} of THE MUSEUM, NEW YORKERS by MLow"}
    made += 1
live = {m["file"] for m in man.values()}
for f in os.listdir(OUT):
    if f.endswith(".jpg") and f not in live: os.remove(os.path.join(OUT, f))
json.dump(man, open(MAN, "w"), indent=1)
print(f"room cards: {made} rendered, {kept} unchanged, {len(none)} without a source{(' ' + str(none)) if none else ''}")
