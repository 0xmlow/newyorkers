"""walls.py: the per room wallpapers (ImageGen, tools/run_walls.sh into work/walls_raw) as site/assets/walls/<room>.jpg.
The model is asked for edges that tile; it does not always manage, so the last 8 percent of the width is crossfaded
into the first, which makes the seam invisible at the cost of a slightly soft band at the join.
usage: python3 _build/walls.py"""
import os, glob
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(HERE, "site/assets/walls"), exist_ok=True)
for f in sorted(glob.glob(os.path.join(HERE, "work/walls_raw/*.png"))):
    room = os.path.splitext(os.path.basename(f))[0]; out = os.path.join(HERE, "site/assets/walls", room + ".jpg")
    if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(f): continue
    a = np.asarray(Image.open(f).convert("RGB")).astype(np.float32); w = a.shape[1]; b = int(w * 0.08)
    k = np.linspace(0, 1, b)[None, :, None]
    a[:, :b] = a[:, :b] * k + a[:, w - b:] * (1 - k)          # the left edge now carries the right edge's colour
    a = a[:, : w - b]                                          # and the right band, now duplicated, goes
    im = Image.fromarray(a.clip(0, 255).astype(np.uint8)); im = im.resize((2048, round(2048 * im.height / im.width)), Image.LANCZOS)
    im.save(out, quality=84, optimize=True, progressive=True); print(room, im.size)
