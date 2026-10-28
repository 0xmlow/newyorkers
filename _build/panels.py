"""panels.py: cut every raw diptych in work/raw at its seam into the two halves the gallery hangs.

ImageGen draws the seam as a thin dark line near the middle, not always on the exact centre pixel, so the
seam is found as the darkest run of columns in the middle eighth. Writes site/assets/pairs/<id>_a.jpg, <id>_b.jpg
and <id>.jpg (the whole diptych, for the card).
  python3 _build/panels.py
"""
import json, os
from PIL import Image
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW, OUT = os.path.join(ROOT, "work", "raw"), os.path.join(ROOT, "site", "assets", "pairs")
os.makedirs(OUT, exist_ok=True)
done = []
for p in json.load(open(os.path.join(ROOT, "pairs.json"))):
    src = os.path.join(RAW, p["id"] + ".png")
    if not os.path.exists(src): continue
    im = Image.open(src).convert("RGB"); w, h = im.size
    a = np.asarray(im.convert("L"), dtype=np.float32)
    lo, hi = int(w * 0.44), int(w * 0.56)
    col = a[int(h * 0.05):int(h * 0.95), lo:hi].mean(axis=0)
    k = int(col.argmin()); thr = col[k] + 18
    s0 = k
    while s0 > 0 and col[s0 - 1] < thr: s0 -= 1
    s1 = k
    while s1 < len(col) - 1 and col[s1 + 1] < thr: s1 += 1
    s0, s1 = lo + s0 - 3, lo + s1 + 4
    if s1 - s0 > 40: s0, s1 = w // 2 - 4, w // 2 + 4   # no clean seam: cut down the middle
    L, R = im.crop((0, 0, s0, h)), im.crop((s1, 0, w, h))
    for side, part in (("a", L), ("b", R)):
        part = part.resize((round(part.width * 1024 / h), 1024), Image.LANCZOS) if h != 1024 else part
        part.save(os.path.join(OUT, f"{p['id']}_{side}.jpg"), quality=86, optimize=True)
    im.save(os.path.join(OUT, p["id"] + ".jpg"), quality=84, optimize=True)
    done.append((p["id"], s0, s1))
print(len(done), "pairs cut:", " ".join(f"{i}@{a}-{b}" for i, a, b in done))
