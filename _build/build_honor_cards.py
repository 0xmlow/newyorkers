#!/usr/bin/env python3
"""The Honorary card: every honoree's portrait as a trading card they can post to X.

X's post intent cannot attach an image, so the card travels two ways:
  1. a share page per person, h/<id>.html, whose og:image is the card set on a landscape
     field. Post the link and X unfurls it as a big card in the timeline;
  2. the card itself as a file, which the page offers to save, and which phones hand to the
     X app through the native share sheet, attached.

Writes assets/cards/<id>-<hash>.jpg (the 5:7 card) and <id>-<hash>-og.jpg (1200x630), named by a
hash of everything drawn on them so the immutable cache never serves an old card, and
_build/honoraries/cards.json for build_honoraries.py. Runs after sync.py, before build_honoraries.py.
No card carries a date or a total, on purpose: both go stale the day the next wave lands.
"""
import os, json, hashlib, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
SRC = os.path.join(SITE, "assets", "honoraries")
OUT = os.path.join(SITE, "assets", "cards")
FD = os.path.join(HERE, "honoraries", "fonts")
VERSION = "3"  # bump to redraw every card after a layout change
os.makedirs(OUT, exist_ok=True)

D = json.load(open(os.path.join(HERE, "honoraries", "honoraries.json")))
INK, PAPER, CLOUD, SLATE = (13, 13, 13), (244, 241, 234), (240, 244, 248), (136, 153, 170)
ACCS = [(215, 255, 31), (255, 46, 99), (0, 229, 255), (255, 176, 32), (179, 136, 255)]
ACC = {c["code"]: ACCS[i % len(ACCS)] for i, c in enumerate(D["cats"])}
# The N3W YORKERS logos are MLow's own ChatGPT image gen lockups (the 2026-08-25 shortlist), never the
# round 3 SVG redraw he rejected. honoraries/logos_chatgpt holds ten of them, trimmed and squared onto
# their own background. The logo rotates across the cards by a hash of the person, so the set reads
# as a series; a thin rule in the category accent ties the tile to the card.
LOGOS = os.path.join(HERE, "honoraries", "logos_chatgpt")
CONCEPTS = sorted(f for f in os.listdir(LOGOS) if f.endswith(".png"))


def logo(p, size):
    k = int(hashlib.sha256(p["id"].encode()).hexdigest(), 16) % len(CONCEPTS)
    im = Image.open(os.path.join(LOGOS, CONCEPTS[k])).convert("RGBA").resize((size, size), Image.LANCZOS)
    r = size // 12
    ImageDraw.Draw(im).rounded_rectangle((1, 1, size - 2, size - 2), r, outline=ACC[p["cat"]], width=max(3, size // 45))
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), r, fill=255)
    im.putalpha(m)
    return im


TYPE = {"A": "ARTIST", "C": "COLLECTOR", "B": "FOUNDER", "W": "MEDIA", "M": "MUSIC", "F": "FILM AND STAGE",
        "X": "FASHION", "S": "SPORT", "D": "FOOD", "P": "CIVIC"}


def font(name, size, var=None, axes=None):
    f = ImageFont.truetype(os.path.join(FD, name), size)
    if var:
        f.set_variation_by_name(var)
    if axes:
        f.set_variation_by_axes(axes)
    return f


def fit(draw, text, name, start, width, lo=24, **kw):
    """Largest size of this face that keeps the text inside width."""
    s = start
    while s > lo:
        f = font(name, s, **kw)
        if draw.textlength(text, font=f) <= width:
            return f
        s -= 2
    return font(name, lo, **kw)


def wrap(draw, text, f, width, lines):
    words, out, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=f) <= width:
            cur = t
        else:
            out.append(cur)
            cur = w
    out.append(cur)
    if len(out) > lines:  # the bios are two sentences; if one will not fit, end on a whole word
        out = out[:lines]
        while out[-1] and draw.textlength(out[-1] + "...", font=f) > width:
            out[-1] = out[-1].rsplit(" ", 1)[0]
        out[-1] = out[-1].rstrip(",.;:") + "..."
    return [l for l in out if l]


def eye(im, cx, cy, r):
    """The MLow evil eye, drawn, so the card needs no image asset."""
    d = ImageDraw.Draw(im)
    for rr, col in ((r, (26, 61, 153)), (r * .64, CLOUD), (r * .42, (0, 229, 255)), (r * .22, INK)):
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=col)


def cover(img, w, h):
    iw, ih = img.size
    s = max(w / iw, h / ih)
    img = img.resize((round(iw * s), round(ih * s)), Image.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def holo(w, h):
    """Keystone foil: a diagonal spectrum, the one thing on the card that is not a brand colour."""
    g = Image.new("RGB", (w, h))
    px = g.load()
    stops = [(255, 46, 99), (255, 176, 32), (215, 255, 31), (0, 229, 255), (179, 136, 255), (255, 46, 99)]
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            t = ((x + y) / (w + h) * 2.0) % 1.0 * (len(stops) - 1)
            i, f = int(t), t - int(t)
            a, b = stops[i], stops[i + 1]
            c = tuple(int(a[k] + (b[k] - a[k]) * f) for k in range(3))
            px[x, y] = c
            if x + 1 < w: px[x + 1, y] = c
            if y + 1 < h:
                px[x, y + 1] = c
                if x + 1 < w: px[x + 1, y + 1] = c
    return g


W, H = 1080, 1512
R = 46
HOLO = None


def card(p):
    global HOLO
    w0 = p["works"][0]
    keystone = any(w.get("key") for w in p["works"])
    acc = ACC[p["cat"]]
    im = Image.new("RGB", (W, H), INK)
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, W - 1, H - 1), R, fill=255)
    if keystone:
        HOLO = HOLO or holo(W, H)
        im.paste(HOLO, (0, 0))
    else:
        im.paste(Image.new("RGB", (W, H), acc), (0, 0))
    d = ImageDraw.Draw(im)
    B = 26  # the coloured frame
    d.rounded_rectangle((B, B, W - B, H - B), R - 18, fill=INK)

    # header: name, type line, eye
    X0, X1 = 64, W - 64
    eye(im, X1 - 34, 104, 34)
    nf = fit(d, p["name"], "Fraunces.ttf", 76, X1 - X0 - 96, 40, var="Black")
    d.text((X0, 112), p["name"], font=nf, fill=CLOUD, anchor="ls")
    mono = font("IBMPlexMono-Medium.ttf", 23)
    tl = f"HONORARY NEW YORKER  ·  {TYPE[p['cat']]}"
    d.text((X0, 158), tl, font=mono, fill=acc, anchor="ls")

    # the painting, as near to whole as a 16:10 window allows
    AX0, AY0, AX1, AY1 = X0 - 8, 186, X1 + 8, 186 + 604
    d.rounded_rectangle((AX0 - 6, AY0 - 6, AX1 + 6, AY1 + 6), 16, fill=PAPER)
    art = cover(Image.open(os.path.join(SRC, w0["l"])).convert("RGB"), AX1 - AX0, AY1 - AY0)
    am = Image.new("L", art.size, 0)
    ImageDraw.Draw(am).rounded_rectangle((0, 0, art.width - 1, art.height - 1), 11, fill=255)
    im.paste(art, (AX0, AY0), am)

    # title plate
    PY0 = AY1 + 26
    d.rounded_rectangle((X0 - 8, PY0, X1 + 8, PY0 + 92), 14, fill=PAPER)
    title = w0.get("title") or p["name"]
    tf = fit(d, f"“{title}”", "Fraunces-Italic.ttf", 40, X1 - X0 - 40, 24, var="SemiBold Italic")
    d.text((W // 2, PY0 + 46), f"“{title}”", font=tf, fill=INK, anchor="mm")

    # chips: census number and keystone
    CY = PY0 + 128
    chips = ["PAINTED BY MLOW"]
    nums = [w["num"] for w in p["works"] if w.get("num") is not None]
    if nums:
        chips.append(f"NO. {nums[0]:04d}")
    if keystone:
        chips.append("KEYSTONE")
    cf = font("IBMPlexMono-Medium.ttf", 21)
    x = X0
    for c in chips:
        tw = d.textlength(c, font=cf)
        hot = c == "KEYSTONE"
        d.rounded_rectangle((x, CY - 20, x + tw + 32, CY + 20), 20, fill=acc if not hot else (255, 46, 99), outline=None)
        d.text((x + 16, CY + 1), c, font=cf, fill=INK, anchor="lm")
        x += tw + 44

    # flavour text: the bio
    BY0 = CY + 44
    BY1 = H - 246
    d.rounded_rectangle((X0 - 8, BY0, X1 + 8, BY1), 14, outline=(42, 48, 64), width=2)
    bio = p.get("bio") or "Painted into NEW YORKERS by MLow, one of the people who make this city what it is."
    bf = font("SpaceGrotesk.ttf", 34, var="Regular")
    lines = wrap(d, bio, bf, X1 - X0 - 40, 5)
    lh = 48
    y = BY0 + (BY1 - BY0 - lh * len(lines)) // 2 + 34
    for l in lines:
        d.text((X0 + 14, y), l, font=bf, fill=(221, 227, 234), anchor="ls")
        y += lh

    # footer: handle, wordmark, site
    LS = 188
    LY = H - B - 22 - LS
    lg = logo(p, LS)
    im.paste(lg, (X1 + 8 - LS, LY), lg)
    FY = LY + LS // 2
    hd = p["handle"] or ""
    if hd:
        d.text((X0, FY - 20), hd, font=fit(d, hd, "IBMPlexMono-Medium.ttf", 28, X1 - X0 - LS - 40, 18), fill=CLOUD, anchor="lm")
    d.text((X0, FY + (26 if hd else 0)), "N3WYORKERS.COM", font=font("IBMPlexMono-Medium.ttf", 21), fill=SLATE, anchor="lm")

    out = Image.new("RGB", (W, H), INK)
    out.paste(im, (0, 0), mask)
    return out


def og(p, c):
    """1200x630 for the X timeline: the card on the left, the name on the right."""
    acc = ACC[p["cat"]]
    o = Image.new("RGB", (1200, 630), INK)
    # the painting, blurred and dark, as the field
    bg = cover(Image.open(os.path.join(SRC, p["works"][0]["l"])).convert("RGB"), 1200, 630).filter(ImageFilter.GaussianBlur(28))
    o = Image.blend(o, bg, .38)
    ch = 574
    cw = round(W * ch / H)
    sm = c.resize((cw, ch), Image.LANCZOS)
    mk = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(mk).rounded_rectangle((0, 0, cw - 1, ch - 1), 20, fill=255)
    sh = Image.new("L", (1200, 630), 0)
    ImageDraw.Draw(sh).rounded_rectangle((60, 40, 60 + cw, 40 + ch), 22, fill=190)
    o.paste((0, 0, 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(18)))
    o.paste(sm, (52, 28), mk)
    d = ImageDraw.Draw(o)
    X = 52 + cw + 60
    MW = 1200 - X - 56
    d.text((X, 150), "HONORARY NEW YORKER", font=font("IBMPlexMono-Medium.ttf", 24), fill=acc, anchor="ls")
    name = p["name"]
    nf = fit(d, name, "Fraunces.ttf", 92, MW, 40, var="Black")
    lines = [name]
    if d.textlength(name, font=nf) > MW or nf.size < 58:  # two lines read better than tiny type
        nf = font("Fraunces.ttf", 72, var="Black")
        lines = wrap(d, name, nf, MW, 2)
        if any(d.textlength(l, font=nf) > MW for l in lines):
            nf = fit(d, max(lines, key=len), "Fraunces.ttf", 72, MW, 36, var="Black")
    y = 150 + nf.size + 22
    for l in lines:
        d.text((X, y), l, font=nf, fill=CLOUD, anchor="ls")
        y += int(nf.size * 1.02)
    if p["handle"]:
        d.text((X, y + 18), p["handle"], font=fit(d, p["handle"], "IBMPlexMono-Medium.ttf", 34, MW, 20), fill=(0, 229, 255), anchor="ls")
    d.text((X, 540), "Painted by MLow", font=font("SpaceGrotesk.ttf", 28, var="Regular"), fill=(201, 210, 220), anchor="ls")
    d.text((X, 578), "N3WYORKERS.COM", font=font("IBMPlexMono-Medium.ttf", 20), fill=SLATE, anchor="ls")
    lg = logo(p, 170)
    o.paste(lg, (1200 - 48 - 170, 630 - 40 - 170), lg)
    return o


def main():
    out, keep = {}, set()
    for p in D["people"]:
        w0 = p["works"][0]
        sig = json.dumps([VERSION, p["name"], p["handle"], p["cat"], p.get("bio"), w0["l"], w0.get("title"),
                          [(w.get("num"), w.get("key")) for w in p["works"]]], ensure_ascii=False)
        h = hashlib.sha256(sig.encode()).hexdigest()[:8]
        cn, on = f'{p["id"]}-{h}.jpg', f'{p["id"]}-{h}-og.jpg'
        keep |= {cn, on}
        cp, op = os.path.join(OUT, cn), os.path.join(OUT, on)
        if not (os.path.exists(cp) and os.path.exists(op)):
            c = card(p)
            c.save(cp, "JPEG", quality=88, optimize=True, progressive=True)
            og(p, c).save(op, "JPEG", quality=85, optimize=True, progressive=True)
        out[p["id"]] = {"card": cn, "og": on}
    for f in os.listdir(OUT):
        if f.endswith(".jpg") and f not in keep:
            os.remove(os.path.join(OUT, f))
    json.dump(out, open(os.path.join(HERE, "honoraries", "cards.json"), "w"), indent=0)
    mb = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) / 1e6
    print(f"honor cards: {len(out)} people, {len(keep)} images, {mb:.0f} MB")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:  # preview a few: build_honor_cards.py mlow jay-z
        want = set(sys.argv[1:])
        for p in D["people"]:
            if p["id"] in want:
                c = card(p)
                c.save(os.path.join(os.environ.get("PREVIEW", "/tmp"), f"card-{p['id']}.jpg"), quality=88)
                og(p, c).save(os.path.join(os.environ.get("PREVIEW", "/tmp"), f"og-{p['id']}.jpg"), quality=85)
                print("wrote", p["id"])
    else:
        main()
