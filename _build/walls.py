"""walls.py: download the per room wall murals (Nano Banana Pro on Krea) into work/walls and write site/assets/walls/<room>.jpg at 2048.
usage: python3 _build/walls.py room=url [room=url ...]"""
import os, sys, urllib.request
from PIL import Image
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(HERE, "work/walls"), exist_ok=True); os.makedirs(os.path.join(HERE, "site/assets/walls"), exist_ok=True)
for a in sys.argv[1:]:
    room, url = a.split("=", 1); raw = os.path.join(HERE, "work/walls", room + os.path.splitext(url)[1])
    urllib.request.urlretrieve(urllib.request.Request(url, headers={"User-Agent": "marks-gallery"}).full_url, raw)
    im = Image.open(raw).convert("RGB"); im = im.resize((2048, round(2048 * im.height / im.width)), Image.LANCZOS)
    im.save(os.path.join(HERE, "site/assets/walls", room + ".jpg"), quality=84, optimize=True, progressive=True); print(room, im.size)
