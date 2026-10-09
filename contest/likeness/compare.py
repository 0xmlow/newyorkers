"""compare.py: sheets of [reference | before | after] per marble, for judging the likeness pass by eye."""
import json, os, sys, io, urllib.request
from PIL import Image, ImageDraw
H = os.path.dirname(os.path.abspath(__file__)); C = os.path.dirname(H)
keys = {k["marble"]: k for k in json.load(open(f"{H}/keys.json"))}; got = json.load(open(f"{H}/got.json"))
os.makedirs(f"{H}/refs", exist_ok=True); os.makedirs(f"{H}/sheets", exist_ok=True)
def ref(m):
    p = f"{H}/refs/{m}.png"
    if not os.path.exists(p):
        try:
            im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(keys[m]["ref"], headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()))
            im.seek(0); im.convert("RGB").resize((300, 300)).save(p)
        except Exception as e: Image.new("RGB", (300, 300), "gray").save(p)
    return Image.open(p)
ms = sorted([m for m in got if os.path.exists(f"{H}/out/{m}.jpg")], key=int)
per = 6
for s in range(0, len(ms), per):
    rows = ms[s:s + per]; sheet = Image.new("RGB", (300 + 534 * 2 + 20, len(rows) * 310), "black"); d = ImageDraw.Draw(sheet)
    for i, m in enumerate(rows):
        y = i * 310
        sheet.paste(ref(m), (0, y))
        for j, src in enumerate([f"{C}/out/{m}.jpg", f"{H}/out/{m}.jpg"]):
            im = Image.open(src).convert("RGB"); im.thumbnail((534, 300)); sheet.paste(im, (310 + j * 544, y))
        d.rectangle([0, y, 150, y + 22], fill="black"); d.text((6, y + 5), f"#{m} {keys[m]['name'][:16]} {keys[m]['kind'][0]}", fill="yellow")
    sheet.save(f"{H}/sheets/sheet_{s // per:02d}.jpg", quality=82)
print(len(ms), "compared in", (len(ms) + per - 1) // per, "sheets")
