"""share_card.py: the 1200x630 card X, iMessage and Discord show for n3wyorkers.com/only (2026-11-01).
Six of the FLORA plates as a mosaic, a dark band across the middle with the name, one line that says what it is and
the address. Legible at the size X shows a large card (about 500 pixels wide): the title is 104 px, the line 30 px.
Writes site/assets/share.jpg; build_galleries.py (card= in the only entry) publishes it as assets/only/poster.jpg.
  python3 _build/share_card.py"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
PL = os.path.join(ROOT, "work", "plates_raw"); F = os.path.join(ROOT, "site", "fonts")
W, H = 1200, 630
# the six moments people already know: the rat, the freeze, the characters, showtime, the duck, the girl and the bull
PICK = [("rat", 0.42), ("frozen", 0.5), ("times", 0.5), ("showtime", 0.55), ("duck", 0.3), ("fearless", 0.45)]
def cell(name, cx, w, h):
    im = Image.open(os.path.join(PL, name + ".png")).convert("RGB"); k = h / im.height; im = im.resize((round(im.width * k), h), Image.LANCZOS)
    x = max(0, min(im.width - w, round(im.width * cx - w / 2))); return im.crop((x, 0, x + w, h))
card = Image.new("RGB", (W, H)); cw, ch = W // 3, H // 2
for i, (n, cx) in enumerate(PICK): card.paste(cell(n, cx, cw, ch), ((i % 3) * cw, (i // 3) * ch))
# the band: dark, soft at its edges, with the gold rule of the site above and below
band = Image.new("L", (W, H), 0); d = ImageDraw.Draw(band); d.rectangle((0, 188, W, 452), fill=225); band = band.filter(ImageFilter.GaussianBlur(26))
card = Image.composite(Image.new("RGB", (W, H), (8, 9, 14)), card, band)
g = ImageDraw.Draw(card)
def font(f, size, var=None):
    ft = ImageFont.truetype(os.path.join(F, f), size)
    if var: ft.set_variation_by_axes(var)
    return ft
title = font("Fraunces.ttf", 104, [144, 900, 0, 0]); line = font("SpaceGrotesk.ttf", 30, [700]) if True else None
mono = font("IBMPlexMono-Medium.ttf", 19)
def centre(y, text, ft, fill, spacing=0):
    w = g.textlength(text, font=ft) + spacing * (len(text) - 1); x = (W - w) / 2
    if not spacing: g.text((x, y), text, font=ft, fill=fill); return
    for ch_ in text: g.text((x, y), ch_, font=ft, fill=fill); x += g.textlength(ch_, font=ft) + spacing
centre(206, "N3W YORKERS BY MLOW  ·  A WALKABLE GALLERY", mono, (245, 197, 66), spacing=3)
centre(236, "ONLY IN NEW YORK", title, (244, 234, 210))
centre(360, "17 of the city's most famous meme moments. Walk in.", line, (230, 226, 214))
centre(408, "n3wyorkers.com/only  ·  free in your browser", mono, (180, 172, 150), spacing=1)
for y in (186, 454): g.rectangle((0, y, W, y + 2), fill=(245, 197, 66))
out = os.path.join(ROOT, "site", "assets", "share.jpg"); card.save(out, "JPEG", quality=88, optimize=True, progressive=True)
print("card:", out, os.path.getsize(out) // 1024, "KB")
