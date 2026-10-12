"""stickers.py: the NEW YORKERS sticker kit that brand_pass.py presses onto CC0 models.

Every sticker is an RGBA PNG in work/stickers/. Fixed ones are made here; a recipe can also ask for a text
label ({"text": ..., "bg": ..., "fg": ...}), which brand_pass.py makes on the fly with label() below.

  python3 _build/stickers.py          # writes the fixed kit
"""
import math, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "work", "stickers")
FONTS = os.path.join(ROOT, "site", "fonts")
LOGOS = os.path.join(os.path.dirname(ROOT), "NEW YORKERS SITE", "assets", "brand", "logos")
PINK, CYAN, GOLD, BLUE, INK, CREAM = "#ff4fa3", "#22d3ee", "#f5c542", "#1d4ed8", "#0b1020", "#f4ead2"

def font(kind, px):
    f = {"sans": "SpaceGrotesk.ttf", "serif": "Fraunces.ttf", "mono": "IBMPlexMono-Medium.ttf"}[kind]
    ft = ImageFont.truetype(os.path.join(FONTS, f), px)
    try: ft.set_variation_by_axes([700] if kind == "sans" else [900, 144] if kind == "serif" else [])
    except Exception: pass
    return ft

def eye_flower(S=512, petal="#fbe6f0", edge=PINK, bg=None):
    """The art's motif: eight petals round a nazar. Same drawing as eyeFlower() in build.js."""
    big = S * 2; im = Image.new("RGBA", (big, big), bg or (0, 0, 0, 0)); R = big * 0.46; cx = cy = big / 2
    for i in range(8):
        a = i / 8 * math.tau
        pet = Image.new("RGBA", (big, big), (0, 0, 0, 0)); d = ImageDraw.Draw(pet)
        # a gradient petal: white at the eye, the petal colour, then the pink edge
        for k in range(40, 0, -1):
            t = k / 40; col = _mix("#ffffff", petal, min(1, t / 0.6)) if t < 0.6 else _mix(petal, edge, (t - 0.6) / 0.4)
            rx, ry = R * 0.5 * t, R * 0.26 * t
            d.ellipse([cx + R * 0.55 - rx, cy - ry, cx + R * 0.55 + rx, cy + ry], fill=col)
        im.alpha_composite(pet.rotate(-math.degrees(a), center=(cx, cy), resample=Image.BICUBIC))
    d = ImageDraw.Draw(im)
    for k, col in [(0.42, BLUE), (0.32, "#ffffff"), (0.22, CYAN), (0.12, INK)]:
        d.ellipse([cx - R * k, cy - R * k, cx + R * k, cy + R * k], fill=col)
    d.ellipse([cx - R * 0.1, cy - R * 0.1, cx - R * 0.02, cy - R * 0.02], fill=(255, 255, 255, 230))
    return im.resize((S, S), Image.LANCZOS)

def nazar(S=512):
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = S / 2
    for k, col in [(0.49, "#0b3fb8"), (0.44, BLUE), (0.31, "#ffffff"), (0.22, CYAN), (0.11, INK)]:
        d.ellipse([c - S * k, c - S * k, c + S * k, c + S * k], fill=col)
    d.ellipse([c - S * 0.08, c - S * 0.08, c - S * 0.02, c - S * 0.02], fill=(255, 255, 255, 230))
    return im

def die_cut(im, pad=18, border="#ffffff"):
    """A white die cut border round any RGBA art, the way a real sticker is cut."""
    W, H = im.size; out = Image.new("RGBA", (W + pad * 2, H + pad * 2), (0, 0, 0, 0))
    a = im.split()[3].point(lambda v: 255 if v > 40 else 0)
    m = Image.new("L", out.size, 0); m.paste(a, (pad, pad)); m = m.filter(ImageFilter.MaxFilter(pad * 2 - 1 if pad * 2 % 2 else pad * 2 + 1))
    out.paste(Image.new("RGBA", out.size, border), (0, 0), m); out.alpha_composite(im, (pad, pad)); return out

def logo(n="01", S=512):
    """An N3W logo off its white ground, as a die cut sticker."""
    im = Image.open(os.path.join(LOGOS, f"n3w-{n}.png")).convert("RGBA"); im.thumbnail((S, S))
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if r > 236 and g > 236 and b > 236: px[x, y] = (255, 255, 255, 0)
    return die_cut(im.crop(im.getbbox()), 14)

def label(text, bg=CREAM, fg=INK, kind="sans", w=1024, h=256, border=None, eye=True, glow=False):
    """A text label: a sign, a decal, a can wrap. eye puts an eye flower before the words."""
    im = Image.new("RGBA", (w, h), bg if bg else (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if border: d.rectangle([6, 6, w - 7, h - 7], outline=border, width=max(4, h // 28))
    x0 = h * 0.12
    if eye: ef = eye_flower(int(h * 0.78)); im.alpha_composite(ef, (int(x0), int(h * 0.11))); x0 += h * 0.9
    lines = text.split("\n"); px = int(h * (0.62 if len(lines) == 1 else 0.36)); ft = font(kind, px)
    while px > 10 and max(d.textlength(l, font=ft) for l in lines) > w - x0 - h * 0.14: px -= 2; ft = font(kind, px)
    tw = max(d.textlength(l, font=ft) for l in lines); lh = px * 1.08; y = (h - lh * len(lines)) / 2 - px * 0.08
    for l in lines:
        xx = x0 + (w - x0 - h * 0.1 - d.textlength(l, font=ft)) / 2
        if glow:
            gl = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(gl).text((xx, y), l, font=ft, fill=fg); im.alpha_composite(gl.filter(ImageFilter.GaussianBlur(h / 20)))
        d.text((xx, y), l, font=ft, fill=fg); y += lh
    return im

def tag(text="MLow", col=PINK, S=(1024, 384)):
    """A graffiti tag: fat letters, a drop shadow, a drip or two."""
    im = Image.new("RGBA", S, (0, 0, 0, 0)); d = ImageDraw.Draw(im); ft = font("sans", int(S[1] * 0.62))
    tw = d.textlength(text, font=ft); x, y = (S[0] - tw) / 2, S[1] * 0.12
    for dx in range(-10, 11, 2):
        for dy in range(-10, 11, 2): d.text((x + dx + 12, y + dy + 12), text, font=ft, fill=INK)
    for dx in range(-6, 7, 2):
        for dy in range(-6, 7, 2): d.text((x + dx, y + dy), text, font=ft, fill="#ffffff")
    d.text((x, y), text, font=ft, fill=col)
    for k in range(6):
        xx = x + tw * (0.1 + 0.16 * k); d.rectangle([xx, S[1] * 0.7, xx + 7, S[1] * (0.78 + 0.03 * (k % 3))], fill=col)
    return im

def stamp(text="COUNTED", col="#d0202a", S=(1024, 360)):
    im = Image.new("RGBA", S, (0, 0, 0, 0)); d = ImageDraw.Draw(im); w, h = S
    d.rounded_rectangle([14, 14, w - 15, h - 15], radius=30, outline=col, width=18)
    ft = font("mono", int(h * 0.48)); tw = d.textlength(text, font=ft)
    while tw > w * 0.84: ft = font("mono", ft.size - 4); tw = d.textlength(text, font=ft)
    d.text(((w - tw) / 2, h * 0.2), text, font=ft, fill=col)
    # wear: knock holes in the ink so it reads as rubber on paper
    import random; random.seed(7); a = im.split()[3].load()
    for _ in range(9000):
        x, y = random.randrange(w), random.randrange(h)
        if a[x, y]: d.ellipse([x, y, x + random.randint(1, 4), y + random.randint(1, 4)], fill=(0, 0, 0, 0))
    return im.rotate(-8, expand=True, resample=Image.BICUBIC)

def plate(text="N3W 1111", S=(1024, 512)):
    """A New York licence plate, the old orange and blue, saying what the recipe says."""
    im = Image.new("RGBA", S, (0, 0, 0, 0)); d = ImageDraw.Draw(im); w, h = S
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=40, fill="#f2a33a", outline="#0b2a6b", width=16)
    ft = font("sans", int(h * 0.16)); t = "NEW YORK"; d.text(((w - d.textlength(t, font=ft)) / 2, h * 0.06), t, font=ft, fill="#0b2a6b")
    ft = font("sans", int(h * 0.44))
    while d.textlength(text, font=ft) > w * 0.86: ft = font("sans", ft.size - 4)
    d.text(((w - d.textlength(text, font=ft)) / 2, h * 0.3), text, font=ft, fill="#0b2a6b")
    ft = font("sans", int(h * 0.11)); t = "THE COUNTED STATE"; d.text(((w - d.textlength(t, font=ft)) / 2, h * 0.82), t, font=ft, fill="#0b2a6b")
    return im

def _mix(a, b, t):
    a, b = [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in (a, b)]
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)

FIXED = {
    "eyeflower": lambda: eye_flower(),
    "eyeflower_gold": lambda: eye_flower(petal="#fff2c0", edge=GOLD),
    "eyeflower_cyan": lambda: eye_flower(petal="#d8fbff", edge=CYAN),
    "eyeflower_die": lambda: die_cut(eye_flower(480), 16),
    "nazar": lambda: nazar(),
    "nazar_die": lambda: die_cut(nazar(480), 16),
    "logo01": lambda: logo("01"), "logo03": lambda: logo("03"), "logo05": lambda: logo("05"), "logo11": lambda: logo("11"),
    "logo12": lambda: logo("12"), "logo20": lambda: logo("20"),
    "tag_mlow": lambda: tag("MLow"), "tag_mlow_cyan": lambda: tag("MLow", CYAN), "tag_mlow_gold": lambda: tag("MLow", GOLD), "tag_n3w": lambda: tag("N3W"),
    "counted": lambda: stamp(), "counted_blue": lambda: stamp("COUNTED", BLUE), "census": lambda: stamp("CENSUS 1111", "#d0202a"),
    "plate_n3w": lambda: plate("N3W 1111"), "plate_mlow": lambda: plate("MLOW 317"),
    "label_n3w": lambda: label("N3W YORKERS", CREAM, INK, border=PINK),
    "label_bymlow": lambda: label("BY MLow", INK, "#ffffff", border=GOLD),
    "label_property": lambda: label("PROPERTY OF\nN3W YORKERS", "#ffffff", "#d0202a", border="#d0202a"),
    "label_counted_dept": lambda: label("DEPT. OF\nTHE COUNTED", "#2f6b3a", "#ffffff", border="#ffffff"),
    "neon_n3w": lambda: label("N3W", None, PINK, glow=True, eye=True),
    "neon_mlow": lambda: label("MLow", None, CYAN, glow=True, eye=False),
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or list(FIXED)
    for n in names:
        FIXED[n]().save(os.path.join(OUT, n + ".png")); print("sticker", n)
