"""polyhaven_tex.py: CC0 PBR texture sets from Poly Haven (polyhaven.com, CC0) as public/tex/<name>_{c,n,r}.jpg.
Colour and normal at 1024, roughness at 512, the museum convention. Adapted from CLOUDS AND DIRT V2's tool.
usage: python3 tools/polyhaven_tex.py id[=name] ...   e.g. wood_floor_worn=floor"""
import sys, os, json, urllib.request, io
from PIL import Image
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(HERE, "public", "tex"); os.makedirs(OUT, exist_ok=True)
def get(url): return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "mlow-gallery/1.0"}), timeout=60).read()
for arg in sys.argv[1:]:
    pid, name = (arg.split("=") + [None])[:2]; name = name or pid
    f = json.loads(get(f"https://api.polyhaven.com/files/{pid}"))
    def pick(key):
        d = f.get(key) or {}; r = d.get("1k") or {}; return (r.get("jpg") or r.get("png") or {}).get("url")
    srcs = {"c": pick("Diffuse") or pick("diffuse"), "n": pick("nor_gl") or pick("nor_dx"), "r": pick("Rough") or pick("rough")}
    for k, u in srcs.items():
        if not u: print(pid, "missing", k); continue
        im = Image.open(io.BytesIO(get(u))).convert("RGB")
        if k == "r": im = im.convert("L").convert("RGB").resize((512, 512), Image.LANCZOS)
        else: im = im.resize((1024, 1024), Image.LANCZOS)
        im.save(os.path.join(OUT, f"{name}_{k}.jpg"), quality=86 if k == "c" else 88, optimize=True)
    print(name, "ok", {k: bool(v) for k, v in srcs.items()})
