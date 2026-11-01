"""devsite.py <dir>: a private copy of site/ for one builder, made of links, so it costs no disk.
Everything is linked to site/ except index.html and assets/gallery.js (build.py --js --out <dir> writes those)
and assets/glb, a real folder of links to every model in site/assets/glb and work/glb_pass. Rerun it after
making new models to link them in.
  python3 _build/devsite.py /path/to/dir && python3 _build/build.py --js --out /path/to/dir
  python3 _build/shot.py <shots_dir> name=room=<id> --site /path/to/dir --http 42xx --port 93xx"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); SITE = os.path.join(ROOT, "site")
d = os.path.abspath(sys.argv[1]); A = os.path.join(d, "assets"); G = os.path.join(A, "glb"); os.makedirs(G, exist_ok=True)
def link(src, dst):
    if os.path.islink(dst) or os.path.exists(dst):
        if os.path.islink(dst): os.unlink(dst)
        else: return
    os.symlink(src, dst)
link(os.path.join(SITE, "fonts"), os.path.join(d, "fonts"))
for f in os.listdir(os.path.join(SITE, "assets")):
    if f not in ("glb", "gallery.js"): link(os.path.join(SITE, "assets", f), os.path.join(A, f))
n = 0
for src in (os.path.join(SITE, "assets", "glb"), os.path.join(ROOT, "work", "glb_pass")):
    for f in os.listdir(src):
        if f.endswith(".glb"): link(os.path.join(src, f), os.path.join(G, f)); n += 1
print("devsite", d, n, "model links")
