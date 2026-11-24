#!/usr/bin/env python3
"""ph_tex.py: scanned CC0 texture sets from Poly Haven (polyhaven.com, CC0) at 1k, as WebP, into site/assets/tex/ph/.
  python3 tools/ph_tex.py weathered_planks terrazzo_tiles ...
Each id gives <id>_c.webp (colour, sRGB), <id>_n.webp (OpenGL normal), <id>_r.webp (roughness)."""
import json, os, sys, io, urllib.request
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "site", "assets", "tex", "ph"); os.makedirs(OUT, exist_ok=True)
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "gardens-gallery"}), timeout=60).read()
for pid in sys.argv[1:]:
    f = json.loads(get(f"https://api.polyhaven.com/files/{pid}"))
    for key, suf in (("Diffuse", "c"), ("nor_gl", "n"), ("Rough", "r")):
        dst = os.path.join(OUT, f"{pid}_{suf}.webp")
        if os.path.exists(dst): continue
        try: url = f[key]["1k"]["jpg"]["url"]
        except KeyError: print("MISSING", pid, key); continue
        im = Image.open(io.BytesIO(get(url)))
        im = im.convert("RGB") if suf != "r" else im.convert("L")
        im.save(dst, "WEBP", quality=82, method=6)
    print("ok", pid, sum(os.path.getsize(os.path.join(OUT, f"{pid}_{s}.webp")) for s in "cnr" if os.path.exists(os.path.join(OUT, f"{pid}_{s}.webp"))) // 1024, "KB")
