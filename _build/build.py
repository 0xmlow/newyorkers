"""build.py: assemble SAME DIFFERENCE into site/ (forked from THE EVICTION, itself ON RECORD's engine).

Reads the census from the site repo (api/pieces.json), deals twelve New Yorkers to each room by the
neighbourhood the room stands in, clones what the gallery needs into site/assets (APFS clones, so no
disk is spent), writes assets/data.js, bundles _build/src with the museum's esbuild and three r185, and
writes site/index.html from shell.html.

  python3 _build/build.py           # everything
  python3 _build/build.py --js      # only rebundle the code and rewrite index.html
"""
import json, os, re, shutil, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DESK = os.path.dirname(ROOT)
SITE_REPO = os.path.join(DESK, "NEW YORKERS SITE")
MARKS = os.path.join(DESK, "THE MARKS GALLERY 2026-10-09")
# the cast and the CC0 props are ON LOCATION's: Tripo eye flower GLBs and Poly Haven models already passed and Draco packed
ONLOC = os.path.join(DESK, "ON LOCATION 2026-10-10", "work")
MUSEUM = os.path.join(SITE_REPO, "_build", "museum")
OUT = os.path.join(ROOT, "site")
A = os.path.join(OUT, "assets")
N_PER = 24   # twelve for the walls, the rest for the art the rooms show off (tv, postcards, posters, docket, flock)
# the set: where each film was shot, so the walls hold New Yorkers from that block
HOODS = {}   # SAME DIFFERENCE hangs its own pairs, not census rows (PAIRS below)

MUSEUM_PROPS = ["h_taxi", "lamppost", "mailbox", "h_subway_car", "dog", "water_tower", "fire_escape", "stoop", "storm_drain", "utility_pole"]
SRCS = lambda: sorted(os.path.join(HERE, "src", f) for f in os.listdir(os.path.join(HERE, "src")) if f.endswith(".js"))

def clone(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src): return
    if os.path.exists(dst): os.remove(dst)
    if subprocess.call(["cp", "-c", src, dst]) != 0: shutil.copy2(src, dst)

def assets():
    P = json.load(open(os.path.join(SITE_REPO, "api", "pieces.json")))
    used, cast = set(), {}
    for room, hoods in HOODS.items():
        pick = []
        for h in hoods:
            for p in sorted((p for p in P if p.get("neighborhood") == h and p.get("image")), key=lambda p: p["n"]):
                f = p["image"].split("/assets/")[-1]
                if p["n"] in used or not os.path.exists(os.path.join(SITE_REPO, "assets", f)): continue
                if len(pick) >= N_PER: break
                used.add(p["n"]); pick.append({"n": p["n"], "t": p["title"], "h": p["neighborhood"], "b": p.get("borough", ""), "f": os.path.basename(f), "s": (p.get("story") or "")[:160]})
                clone(os.path.join(SITE_REPO, "assets", f), os.path.join(A, "art", os.path.basename(f)))
        # spread across the census, not the first twelve numbers in a row
        cast[room] = pick
    walls = sorted(f[:-4] for f in os.listdir(os.path.join(A, "walls")) if f.endswith(".jpg")) if os.path.isdir(os.path.join(A, "walls")) else []
    eggs = count_eggs()
    VD = os.path.join(A, "video"); vids = sorted(f[:-4] for f in os.listdir(VD) if f.endswith(".mp4")) if os.path.isdir(VD) else []
    # the pairs whose diptych has been cut (python3 _build/panels.py), and the finished posters
    pairs = [{k: p[k] for k in ("id", "room", "a", "b", "quip")} for p in json.load(open(os.path.join(ROOT, "pairs.json"))) if os.path.exists(os.path.join(A, "pairs", p["id"] + "_a.jpg"))]
    PD = os.path.join(ROOT, "posters", "final"); posters = []
    if os.path.isdir(PD):
        man = json.load(open(os.path.join(PD, "manifest.json"))) if os.path.exists(os.path.join(PD, "manifest.json")) else {}
        for f in sorted(os.listdir(PD)):
            if f.endswith(".jpg"):
                clone(os.path.join(PD, f), os.path.join(A, "posters", f)); m = man.get(f, {})
                posters.append({"f": f, "t": m.get("title", f[:-4].replace("_", " ").upper()), "s": m.get("tagline", "")})
    eggs = sorted({e for e in eggs if not e.endswith("_")} | {"pair_" + p["id"] for p in pairs} | {f"poster_{k}" for k in range(min(26, len(posters)))})
    open(os.path.join(A, "data.js"), "w").write("window.EGG_N=" + str(len(eggs)) + ";\nwindow.CAST=" + json.dumps(cast, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.WALLS=" + json.dumps(walls) + ";\nwindow.VIDEOS=" + json.dumps(vids) + ";\nwindow.PAIRS=" + json.dumps(pairs, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.POSTERS=" + json.dumps(posters, ensure_ascii=False, separators=(",", ":")) + ";\n")
    S = os.path.join(SITE_REPO, "assets", "museum")
    for s in ["asphalt", "brick", "plaster", "terrazzo", "concrete", "marble", "cobble", "planks"]:
        for k in "cnr": clone(os.path.join(S, "surfaces", f"{s}_{k}.jpg"), os.path.join(A, "tex", f"{s}_{k}.jpg"))
    clone(os.path.join(S, "hdri", "night.hdr"), os.path.join(A, "env", "night.hdr"))
    for p in MUSEUM_PROPS:
        clone(os.path.join(S, "props", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    for p in ["hydrant", "pigeon", "rat", "cat"]:   # THE MARKS heroes, reused
        clone(os.path.join(MARKS, "work", "glb_pass", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    clone(os.path.join(SITE_REPO, "assets", "brand", "logos", "n3w-01.png"), os.path.join(A, "logo.png"))
    # only the models some set names: recipe sources (*_cut, *_src_*) and spare Poly Haven downloads stay in work/
    used = used_models()
    shutil.rmtree(os.path.join(A, "glb"), ignore_errors=True)   # so a model dropped from every set leaves the package too
    for p in MUSEUM_PROPS:
        clone(os.path.join(S, "props", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    for p in ["hydrant", "pigeon", "rat", "cat"]:
        clone(os.path.join(MARKS, "work", "glb_pass", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    for f in sorted(os.listdir(os.path.join(ONLOC, "glb_pass"))):
        if f.endswith(".glb") and f[:-4] in used:
            src = os.path.join(ONLOC, "glb_pass", f); dz = os.path.join(ONLOC, "glb_draco", f)
            # the Draco copy when it is current (python3 _build/draco.py makes them), the plain pass when it is not
            clone(dz if os.path.exists(dz) and os.path.getmtime(dz) >= os.path.getmtime(src) else src, os.path.join(A, "glb", f))
    for f in ("draco_decoder.wasm", "draco_wasm_wrapper.js", "draco_decoder.js"):
        clone(os.path.join(MUSEUM, "node_modules", "three", "examples", "jsm", "libs", "draco", "gltf", f), os.path.join(A, "draco", f))
    print("assets: pairs", len(pairs), "posters", len(posters), "eggs", len(eggs))

def used_models():
    """Every model file a set can ask for: any quoted name in the code, with or without its ph_ prefix."""
    src = SRCS()
    txt = "\n".join(open(f).read() for f in src); q = set(re.findall(r"['\"`]([A-Za-z0-9_]+)['\"`]", txt))
    return {f[:-4] for f in os.listdir(os.path.join(ONLOC, "glb_pass")) if f.endswith(".glb") and (f[:-4] in q or (f.startswith("ph_") and f[3:-4] in q))}

def count_eggs():
    """Every egg id in the code: c.egg('id', ...) calls and the egg: [hint, 'id', line] of props, in build.js and every batch file."""
    srcs = SRCS()
    txt = "\n".join(open(f).read() for f in srcs)
    return sorted(set(re.findall(r"c\.egg\('(\w+)'", txt)) | set(re.findall(r"egg: \['(?:[^'\\]|\\.)*', '(\w+)'", txt)) | set(re.findall(r"egg: '(\w+)'", txt)) | set(re.findall(r"openPair\(c, [\w.]+, \['(\w+)'", txt)))

def bundle():
    env = dict(os.environ, NODE_PATH=os.path.join(MUSEUM, "node_modules"))
    r = subprocess.run([os.path.join(MUSEUM, "node_modules", ".bin", "esbuild"), os.path.join(HERE, "src", "main.js"), "--bundle", "--format=esm",
                        "--minify", "--target=es2022", f"--outfile={os.path.join(OUTA, 'gallery.js')}", "--log-level=warning"], env=env)
    if r.returncode: sys.exit("esbuild failed")
    html = open(os.path.join(HERE, "shell.html")).read().replace("@@V@@", time.strftime("%Y%m%d%H%M%S"))
    bad = re.findall(r"[–—→]", html)
    if bad: sys.exit(f"house rule: dashes or arrows in the page: {bad}")
    open(os.path.join(OUTD, "index.html"), "w").write(html)
    print("bundle:", os.path.getsize(os.path.join(OUTA, "gallery.js")) // 1024, "KB", "into", OUTD)

# --out <dir>: bundle into a dev copy made by devsite.py instead of site/ (so parallel builders do not overwrite each other)
OUTD = os.path.abspath(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else OUT
OUTA = os.path.join(OUTD, "assets")

if __name__ == "__main__":
    if "--js" not in sys.argv: assets()
    bundle()
