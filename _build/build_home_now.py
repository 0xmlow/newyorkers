#!/usr/bin/env python3
"""Pictures for the home page's NEW ON THE SITE cards (MLow 2026-10-06: give every card an image).

Writes assets/home/now-<key>.jpg at 960x540 from each section's own art, so the pictures stay true to what
the card opens: a wall of census New Yorkers for the mint, the founding Keystone piece, Keystone works
collectors hold, the Hall of Fame film still, a strip of the poster wall,
and a New Yorker with marker scribbled over it for MARK IT UP. Rerun is cheap; build_all runs it."""
import json, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); A = os.path.join(SITE, "assets")
OUT = os.path.join(A, "home"); os.makedirs(OUT, exist_ok=True)
W, H = 960, 540
INK, CLOUD, ACID, CYAN, PINK = (8,13,22), (236,232,221), (236,201,129), (97,201,226), (220,111,87)
FD = os.path.join(HERE, "honoraries", "fonts")
mono = lambda s: ImageFont.truetype(os.path.join(FD, "IBMPlexMono-Medium.ttf"), s)


def cover(path, w, h):
    im = Image.open(path).convert("RGB"); iw, ih = im.size; r = w / h
    if iw / ih > r: nw = round(ih * r); im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
    else: nh = round(iw / r); im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)


def save(im, key):
    im.convert("RGB").save(os.path.join(OUT, f"now-{key}.jpg"), "JPEG", quality=84, optimize=True, progressive=True)


def tag(im, text, color=ACID, fg=INK, xy=(22, 22)):
    d = ImageDraw.Draw(im); f = mono(20); tw = d.textlength(text, font=f)
    d.rounded_rectangle((xy[0], xy[1], xy[0] + tw + 28, xy[1] + 40), 8, fill=color)
    d.text((xy[0] + 14, xy[1] + 20), text, font=f, fill=fg, anchor="lm")


d = open(os.path.join(A, "data.js")).read(); D = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
pool = [p for p in D["pieces"] if (p.get("e") or 0) >= 2 and p.get("st") and 1.7 < (p.get("ar") or 0) < 1.85
        and os.path.exists(os.path.join(A, "t", p["st"][0] + ".jpg"))]
random.Random("home-now-mint").shuffle(pool)

# 01 minting now: a three by three wall of census New Yorkers
im = Image.new("RGB", (W, H), INK); cw, ch = W // 3, H // 3
for i, p in enumerate(pool[:9]):
    im.paste(cover(os.path.join(A, "t", p["st"][0] + ".jpg"), cw - 4, ch - 4), ((i % 3) * cw + 2, (i // 3) * ch + 2))
tag(im, "MINTING NOW · OPENSEA"); save(im, "mint")

# 02 keystone: the founding piece, full bleed
im = cover(os.path.join(A, "keystone", "1l.jpg"), W, H); tag(im, "KEYSTONE · NO. 1", CLOUD); save(im, "keystone")

# 03 collectors: six Keystone works that collectors hold
ks = sorted(f for f in os.listdir(os.path.join(A, "collectors")) if f.startswith("k") and f.endswith(".jpg"))
random.Random("home-now-board").shuffle(ks)
im = Image.new("RGB", (W, H), INK); cw, ch = W // 3, H // 2; dr = ImageDraw.Draw(im)
for i, f in enumerate(ks[:6]):
    x, y = (i % 3) * cw, (i // 3) * ch
    im.paste(cover(os.path.join(A, "collectors", f), cw - 6, ch - 6), (x + 3, y + 3))
tag(im, "HELD BY COLLECTORS"); save(im, "collectors")  # no rank numbers: these six are not the top six

# 04 room 183: the Hall of Fame film still, else the room thumbnail
src = os.path.join(A, "film", "hall-of-fame", "poster.jpg")
im = cover(src if os.path.exists(src) else os.path.join(A, "museum", "rooms", "honoraries.jpg"), W, H)
tag(im, "ROOM 183 · THE HALL OF FAME", CLOUD); save(im, "honoraries")

# 05 poster wall: four posters side by side on the wall colour
ps = sorted(f for f in os.listdir(os.path.join(A, "posters")) if f.endswith("l.jpg"))
random.Random("home-now-posters").shuffle(ps)
im = Image.new("RGB", (W, H), (24, 26, 32)); pw, ph = 210, 315; gap = (W - 4 * pw) // 5
for i, f in enumerate(ps[:4]):
    pi = cover(os.path.join(A, "posters", f), pw, ph); x = gap + i * (pw + gap); y = (H - ph) // 2 + (12 if i % 2 else -12)
    sh = Image.new("RGBA", (pw + 40, ph + 40), (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle((20, 24, pw + 20, ph + 24), fill=(0, 0, 0, 150))
    im.paste(sh.filter(ImageFilter.GaussianBlur(10)), (x - 20, y - 20), sh.filter(ImageFilter.GaussianBlur(10)))
    im.paste(pi, (x, y))
save(im, "posters")

# 06 mark it up: a New Yorker with marker over it, the way the page leaves it
p = pool[9]; im = cover(os.path.join(A, "t", p["st"][0] + ".jpg"), W, H).convert("RGBA")
ink = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dr = ImageDraw.Draw(ink)
rnd = random.Random("home-now-markup")
for color, n in ((ACID, 3), (PINK, 2), (CYAN, 2)):
    for _ in range(n):
        x, y = rnd.randint(80, W - 200), rnd.randint(80, H - 160); pts = [(x, y)]
        for _ in range(14): x += rnd.randint(-10, 34); y += rnd.randint(-26, 26); pts.append((x, y))
        dr.line(pts, fill=color + (235,), width=9, joint="curve")
dr.ellipse((W * 0.55, H * 0.18, W * 0.88, H * 0.62), outline=ACID + (235,), width=8)
im = Image.alpha_composite(im, ink); tag(im, "MARK IT UP", PINK, CLOUD); save(im, "markup")
print("home now cards: 6 written to assets/home")
