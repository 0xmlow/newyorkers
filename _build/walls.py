"""walls.py: the per set wall textures (Nano Banana Pro on Krea, fetched into work/walls by fetch.py) as site/assets/walls/<room>.jpg at 2048.
usage: python3 _build/walls.py"""
import os, glob
from PIL import Image
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(HERE, "site/assets/walls"), exist_ok=True)
for f in sorted(glob.glob(os.path.join(HERE, "work/walls/*.*"))):
    room = os.path.splitext(os.path.basename(f))[0]; out = os.path.join(HERE, "site/assets/walls", room + ".jpg")
    if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(f): continue
    im = Image.open(f).convert("RGB"); im = im.resize((2048, round(2048 * im.height / im.width)), Image.LANCZOS)
    im.save(out, quality=84, optimize=True, progressive=True); print(room, im.size)
