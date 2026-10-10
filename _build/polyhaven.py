"""polyhaven.py: CC0 models from Poly Haven (polyhaven.com, CC0, no attribution required, credited anyway in the README).
Downloads each asset's 1k glTF with its bin and textures into work/ph_raw/<id>/, runs the museum's prop pass
(ph_pass.py, which is prop_pass.py reading the glTF) into work/glb_pass/ph_<id>.glb, then deletes the raw files.
  python3 _build/polyhaven.py id[:tris] ...      (default 20000 tris)"""
import json, os, sys, subprocess, urllib.request, shutil, concurrent.futures as cf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
RAW = os.path.join(ROOT, "work", "ph_raw"); OUT = os.path.join(ROOT, "work", "glb_pass")
BL = "/Applications/Blender.app/Contents/MacOS/Blender"
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "on-location-gallery"}), timeout=60).read()
def fetch(spec):
    pid = spec.split(":")[0]
    if os.path.exists(os.path.join(OUT, f"ph_{pid}.glb")): return pid, "have"
    try: f = json.loads(get(f"https://api.polyhaven.com/files/{pid}"))["gltf"]["1k"]["gltf"]
    except Exception as e: return pid, f"missing {e}"
    d = os.path.join(RAW, pid); os.makedirs(d, exist_ok=True)
    try:
        open(os.path.join(d, f"{pid}_1k.gltf"), "wb").write(get(f["url"]))
        for rel, inc in f["include"].items():
            p = os.path.join(d, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(get(inc["url"]))
    except Exception as e: shutil.rmtree(d, ignore_errors=True); return pid, f"download {e}"   # a dropped connection skips one asset, not the batch
    return pid, "ok"
specs = sys.argv[1:]
with cf.ThreadPoolExecutor(3) as ex:
    got = dict(ex.map(fetch, specs))
todo = [s if ":" in s else s + ":12000" for s in specs if got.get(s.split(":")[0]) == "ok"]
for k, v in got.items():
    if v not in ("ok", "have"): print("SKIP", k, v[:80])
if todo:
    tmp = os.path.join(ROOT, "work", "ph_tmp"); os.makedirs(tmp, exist_ok=True)
    # one asset per Blender run: a single asset that fails aborts the whole run and silently loses the rest
    for spec in todo:
        r = subprocess.run([BL, "-b", "-P", os.path.join(HERE, "ph_pass.py"), "--", RAW, tmp, spec], capture_output=True, text=True)
        ok = [l for l in r.stdout.splitlines() if l.startswith("PASS")]
        print(ok[0] if ok else f"FAIL {spec}")
    for f in os.listdir(tmp): os.replace(os.path.join(tmp, f), os.path.join(OUT, "ph_" + f))
    shutil.rmtree(tmp, ignore_errors=True)
shutil.rmtree(RAW, ignore_errors=True)
