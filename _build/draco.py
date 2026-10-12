#!/usr/bin/env python3
"""draco.py: Draco compress every model for the package. Reads work/glb_raw/<name>.glb (build_data.py clones them there from
the museum kit, ON LOCATION and THE MARKS), writes site/assets/glb/<name>.glb with the same textures and compressed geometry,
through the gltf-transform CLI (npx @gltf-transform/cli@4). Position 14 bits, normals 10, texcoords 12: no visible change in
r128, which reads them through DRACOLoader with the decoder in assets/draco. A manifest keeps a source size per output so
only new or changed models run again. Never `optimize`: its simplify and instancing break r128 (MEME MUSEUM, 2026-10-09)."""
import os, json, subprocess, concurrent.futures as cf, sys
H = os.path.dirname(os.path.abspath(__file__)); GAL = os.path.dirname(H)
SRC = os.path.join(GAL, "work", "glb_raw"); OUT = os.path.join(GAL, "site", "assets", "glb"); MAN = os.path.join(GAL, "work", "draco_manifest.json")
os.makedirs(OUT, exist_ok=True)
man = json.load(open(MAN)) if os.path.exists(MAN) else {}
names = sorted(f[:-4] for f in os.listdir(SRC) if f.endswith(".glb"))
todo = [n for n in names if man.get(n) != os.path.getsize(os.path.join(SRC, n + ".glb")) or not os.path.exists(os.path.join(OUT, n + ".glb"))]
def run(n):
    src, dst = os.path.join(SRC, n + ".glb"), os.path.join(OUT, n + ".glb")
    r = subprocess.run(["npx", "-y", "@gltf-transform/cli@4", "draco", src, dst, "--quantize-position", "14", "--quantize-normal", "10", "--quantize-texcoord", "12"], capture_output=True, text=True)
    if r.returncode or not os.path.exists(dst):
        import shutil; shutil.copy2(src, dst); return (n, os.path.getsize(src), os.path.getsize(dst), "COPIED (draco failed: " + (r.stderr or r.stdout)[-120:].strip() + ")")
    return (n, os.path.getsize(src), os.path.getsize(dst), "ok")
with cf.ThreadPoolExecutor(4) as ex:
    for n, a, b, why in ex.map(run, todo):
        man[n] = a; print(f"  {n}: {a // 1024} to {b // 1024} KB {why if why != 'ok' else ''}".rstrip())
for f in os.listdir(OUT):
    if f.endswith(".glb") and f[:-4] not in names: os.remove(os.path.join(OUT, f)); print("  dropped", f)
json.dump(man, open(MAN, "w"))
tot_a = sum(os.path.getsize(os.path.join(SRC, n + ".glb")) for n in names); tot_b = sum(os.path.getsize(os.path.join(OUT, n + ".glb")) for n in names)
print(f"models: {len(names)}, {len(todo)} compressed now, {tot_a / 1e6:.0f} MB raw to {tot_b / 1e6:.0f} MB")
