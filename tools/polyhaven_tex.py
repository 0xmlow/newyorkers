#!/usr/bin/env python3
"""polyhaven_tex.py id=name ...: CC0 scanned texture sets from Poly Haven into site/assets/tex/ at 1k.
The terminal's light is baked into colour (the lightmap holds colour times light), so the scan's colour is not used
as colour: <name>_d.jpg is its luminance, rescaled so its mean is mid grey, and the shader multiplies it over the bake
as a detail layer. <name>_n.jpg (OpenGL normal) bends the floor reflections, <name>_r.jpg (512) scales their strength.
usage: python3 tools/polyhaven_tex.py grey_tiles=floor asphalt_02=asphalt"""
import sys, os, json, urllib.request, io
from PIL import Image, ImageStat
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(HERE, "site", "assets", "tex"); os.makedirs(OUT, exist_ok=True)
def get(url): return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "mlow-gallery/1.0"}), timeout=60).read()
for arg in sys.argv[1:]:
    pid, name = (arg.split("=") + [None])[:2]; name = name or pid
    f = json.loads(get(f"https://api.polyhaven.com/files/{pid}"))
    def pick(*keys):
        for key in keys:
            r = (f.get(key) or {}).get("1k") or {}; u = (r.get("jpg") or r.get("png") or {}).get("url")
            if u: return u
    srcs = {"d": pick("Diffuse", "diffuse"), "n": pick("nor_gl"), "r": pick("Rough", "rough")}
    for k, u in srcs.items():
        if not u: print(pid, "missing", k); continue
        im = Image.open(io.BytesIO(get(u)))
        if k == "d":
            g = im.convert("L"); m = ImageStat.Stat(g).mean[0] or 1
            g = g.point(lambda v: max(0, min(255, int(v * 128 / m)))); g.save(os.path.join(OUT, f"{name}_d.jpg"), quality=84, optimize=True)
        elif k == "r":
            im.convert("L").resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, f"{name}_r.jpg"), quality=84, optimize=True)
        else:
            im.convert("RGB").save(os.path.join(OUT, f"{name}_n.jpg"), quality=88, optimize=True)
    print(name, "ok", {k: bool(v) for k, v in srcs.items()})
