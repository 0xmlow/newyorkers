"""poster.py <gallery dir> <shot.jpg> <TITLE> <subtitle>: the share card (1200 by 630) from a room screenshot, with the
house logo and the title set in the house serif, written to <gallery>/site/assets/poster.jpg. The HUD band at the
bottom of a headless shot is cropped away."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
G, shot, title, sub = sys.argv[1:5]; G = os.path.abspath(G)
im = Image.open(shot).convert("RGB"); w, h = im.size
im = im.crop((0, int(h * 0.1), w, int(h * 0.82)))   # the HUD's top line and the bottom buttons go
im = im.resize((1200, int(1200 * im.height / im.width)), Image.LANCZOS)
card = Image.new("RGB", (1200, 630), "#0b0c10"); card.paste(im, (0, (630 - im.height) // 2))
shade = Image.new("L", (1200, 630), 0); sd = ImageDraw.Draw(shade);
for y in range(630): sd.line([(0, y), (1200, y)], fill=int(max(0, (y - 330) / 300) * 220))
card = Image.composite(Image.new("RGB", (1200, 630), "#0b0c10"), card, shade)
d = ImageDraw.Draw(card); fonts = os.path.join(G, "site", "fonts")
try: F1 = ImageFont.truetype(os.path.join(fonts, "Fraunces.ttf"), 64); F1.set_variation_by_axes([900]) if hasattr(F1, "set_variation_by_axes") else None
except Exception: F1 = ImageFont.truetype(os.path.join(fonts, "Fraunces.ttf"), 64)
F2 = ImageFont.truetype(os.path.join(fonts, "SpaceGrotesk.ttf"), 24); F3 = ImageFont.truetype(os.path.join(fonts, "IBMPlexMono-Medium.ttf"), 16)
d.text((48, 440), title, font=F1, fill="#f4ead2"); d.text((50, 520), sub, font=F2, fill="#d8cfb8"); d.text((50, 572), "NEW YORKERS BY MLOW · A WALKABLE GALLERY · N3WYORKERS.COM", font=F3, fill="#f5c542")
logo = Image.open(os.path.join(G, "site", "assets", "logo.png")).convert("RGBA").resize((96, 96)); card.paste(logo, (1056, 486), logo)
out = os.path.join(G, "site", "assets", "poster.jpg"); card.save(out, quality=86); print(out)
