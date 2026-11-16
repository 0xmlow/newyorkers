"""tools/cc0_pass.py: the CC0 downloads (ambientCG 2K materials and Poly Haven 2k HDRIs on /Volumes/mlow2026/cc0, both CC0,
downloaded 2026-11-15 with MLow's OK) into what the engine reads: work/cc0tex/acg_<name>_{c,n,r}.jpg at 1024 (colour,
OpenGL normal, roughness, the triplet surf() loads) and work/cc0env/<short>.hdr. build.py copies both into site/assets."""
import os, zipfile, io, shutil
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SRC = "/Volumes/mlow2026/cc0"
OUT = os.path.join(R, "work", "cc0tex"); ENV = os.path.join(R, "work", "cc0env"); os.makedirs(OUT, exist_ok=True); os.makedirs(ENV, exist_ok=True)
for z in sorted(f for f in os.listdir(os.path.join(SRC, "acg")) if f.endswith(".zip") and not f.startswith("._")):
    name = "acg_" + z[:-4].lower(); zf = zipfile.ZipFile(os.path.join(SRC, "acg", z))
    for key, suf in (("_Color.", "c"), ("_NormalGL.", "n"), ("_Roughness.", "r")):
        m = [n for n in zf.namelist() if key in n and n.lower().endswith(".jpg")]
        if not m: print("missing", z, key); continue
        im = Image.open(io.BytesIO(zf.read(m[0]))).convert("RGB" if suf != "r" else "L").resize((1024, 1024), Image.LANCZOS)
        im.convert("RGB").save(os.path.join(OUT, f"{name}_{suf}.jpg"), quality=88)
    print("tex", name)
for src, short in (("modern_buildings_night", "nightcity"), ("cobblestone_street_night", "cobblenight"), ("christmas_photo_studio_01", "xmasstudio")):
    shutil.copyfile(os.path.join(SRC, "hdri", src + ".hdr"), os.path.join(ENV, short + ".hdr")); print("env", short)
