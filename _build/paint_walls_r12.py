"""paint_walls_r12.py: brand check on two older wall images (round twelve).
The Odd Couple wall had a real Yankees pennant, Knicks and Giants posters and photos with real looking faces;
the Llewyn wall had a Bob Dylan album and a Joan Baez poster. Painted over with NEW YORKERS versions, eye flowers
on every face, the way earlier rounds painted plates. Coordinates are fractions of the 2048 x 1143 image."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
EF = Image.open(os.path.join(ROOT, "work", "stickers", "eyeflower.png")).convert("RGBA")
FONT = os.path.join(ROOT, "site", "fonts", "SpaceGrotesk.ttf")
def box(im, b): W, H = im.size; return [int(b[0] * W / 2000), int(b[1] * H / 1116), int(b[2] * W / 2000), int(b[3] * H / 1116)]
def flower(im, b):
    x0, y0, x1, y1 = box(im, b); s = min(x1 - x0, y1 - y0); e = EF.resize((s, s), Image.LANCZOS); im.alpha_composite(e, ((x0 + x1 - s) // 2, (y0 + y1 - s) // 2))
def poster(im, b, bg, fg, lines, ef=True):
    x0, y0, x1, y1 = box(im, b); d = ImageDraw.Draw(im); d.rectangle([x0, y0, x1, y1], fill=bg, outline="#f4ead2", width=max(3, (x1 - x0) // 40))
    w, h = x1 - x0, y1 - y0
    if ef: s = int(min(w, h) * 0.55); im.alpha_composite(EF.resize((s, s), Image.LANCZOS), (x0 + (w - s) // 2, y0 + int(h * 0.3)))
    for k, (t, frac) in enumerate(lines):
        ft = ImageFont.truetype(FONT, int(h * 0.11)); 
        while d.textlength(t, font=ft) > w * 0.86: ft = ImageFont.truetype(FONT, ft.size - 2)
        d.text((x0 + (w - d.textlength(t, font=ft)) / 2, y0 + h * frac), t, font=ft, fill=fg)
def pennant(im, b):
    x0, y0, x1, y1 = box(im, b); d = ImageDraw.Draw(im)
    d.rectangle([x0, y0, x1, y1], fill=None)
    # cover the old pennant with wall colour first, sampled just below it
    col = im.getpixel((x0 + 20, y1 + 30)); d.rectangle([x0, y0, x1, y1], fill=col)
    d.polygon([(x0 + 40, y0 + 10), (x1, (y0 + y1) // 2), (x0 + 40, y1 - 10)], fill="#1d4ed8"); d.rectangle([x0 + 20, y0 + 10, x0 + 46, y1 - 10], fill="#f4ead2")
    s = int((y1 - y0) * 0.62); im.alpha_composite(EF.resize((s, s), Image.LANCZOS), (x0 + 60, (y0 + y1 - s) // 2))
    ft = ImageFont.truetype(FONT, int((y1 - y0) * 0.22)); d.text((x0 + 70 + s, (y0 + y1) / 2 - (y1 - y0) * 0.14), "N3W COUNTERS", font=ft, fill="#ffffff")
def patch(im, b, src_dx):
    """cover a strip with the wall beside it (brick from src_dx pixels to the right)"""
    x0, y0, x1, y1 = box(im, b); dx = int(src_dx * im.size[0] / 2000); im.paste(im.crop((x0 + dx, y0, x1 + dx, y1)), (x0, y0))

def oddcouple(im):
    pennant(im, (1035, 128, 1550, 312))
    poster(im, (1030, 595, 1285, 940), "#ff7a1a", "#0b1020", [("N3W HOOPS", 0.06), ("COUNTED", 0.84)])
    poster(im, (1210, 725, 1415, 1005), "#1d4ed8", "#ffffff", [("N3W BALL CLUB", 0.06), ("SINCE 1111", 0.84)])
    for b in [(1745, 115, 1895, 300), (1745, 420, 1890, 600), (1100, 355, 1250, 535), (135, 720, 265, 900), (858, 465, 925, 585), (85, 465, 165, 585)]: flower(im, b)
def llewyn(im):
    patch(im, (0, 170, 88, 800), 420)
    poster(im, (127, 700, 330, 908), "#1a1410", "#f4ead2", [("MLow", 0.05), ("HOOTENANNY", 0.84)])
for name, fn in (("oddcouple", oddcouple), ("llewyn", llewyn)):
    for d in (os.path.join(ROOT, "work", "walls"), os.path.join(ROOT, "site", "assets", "walls")):
        p = os.path.join(d, name + ".jpg"); im = Image.open(p).convert("RGBA"); fn(im)
        im.convert("RGB").save(p, quality=86 if "work" in d else 80); print("painted", p)
