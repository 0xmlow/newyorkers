"""build.py: assemble CLOUDS AND DIRT into site/.

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
N_PER = 12
# the set: where each film was shot, so the walls hold New Yorkers from that block
HOODS = {
    "lobby": ["Chelsea", "Hell's Kitchen"], "dirt": ["Elmhurst", "Jackson Heights", "Forest Hills", "Rego Park"], "library": ["Flushing", "Astoria"], "crush": ["Hell's Kitchen", "Midtown"],
    "hudson": ["Chelsea", "Midtown"], "studio": ["Long Island City"], "empathy": ["Upper East Side", "Murray Hill"], "carousel": ["Central Park"],
    "veecon": ["Flatiron", "Gramercy"], "attention": ["Financial District"], "jets": ["Washington Heights", "Astoria"], "clouds": ["Midtown", "Tribeca"],
}
# the honoraries on the walls: MLow's portraits of the man, of VeeFriends, and of a VaynerMedia alumna. [room, id, which work]
HONOR = [("empathy", "gary-vaynerchuk", 0), ("empathy", "gary-vaynerchuk", 1), ("carousel", "veefriends", 0), ("hudson", "erikalee", 0)]

def clone(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src): return
    if os.path.exists(dst): os.remove(dst)
    if subprocess.call(["cp", "-c", src, dst]) != 0: shutil.copy2(src, dst)

def assets():
    P = json.load(open(os.path.join(SITE_REPO, "api", "pieces.json")))
    H = json.load(open(os.path.join(SITE_REPO, "_build", "honoraries", "honoraries.json")))["people"]
    used, cast = set(), {}
    for room, hoods in HOODS.items():
        pick = []
        for rm, hid, wi in HONOR:
            if rm != room: continue
            h = next(x for x in H if x["id"].replace("-", "") == hid.replace("-", "")); w = h["works"][wi]
            clone(os.path.join(SITE_REPO, "assets", "honoraries", w["l"]), os.path.join(A, "art", w["l"]))
            pick.append({"n": "HONORARY", "t": w["title"], "h": "Honorary New Yorker", "b": "", "f": w["l"], "s": h["bio"], "honor": hid, "who": h["name"]})
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
    open(os.path.join(A, "data.js"), "w").write("window.EGG_N=" + str(len(eggs)) + ";\nwindow.CAST=" + json.dumps(cast, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.WALLS=" + json.dumps(walls) + ";\n")
    S = os.path.join(SITE_REPO, "assets", "museum")
    for s in ["asphalt", "brick", "plaster", "terrazzo", "concrete", "marble", "cobble", "planks"]:
        for k in "cnr": clone(os.path.join(S, "surfaces", f"{s}_{k}.jpg"), os.path.join(A, "tex", f"{s}_{k}.jpg"))
    clone(os.path.join(S, "hdri", "night.hdr"), os.path.join(A, "env", "night.hdr"))
    for p in ["h_taxi", "lamppost", "mailbox", "h_subway_car", "gull", "life_ring", "dog"]:
        clone(os.path.join(S, "props", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    clone(os.path.join(SITE_REPO, "assets", "brand", "logos", "n3w-01.png"), os.path.join(A, "logo.png"))
    # only the models some set names: recipe sources (*_cut, *_src_*) and spare Poly Haven downloads stay in work/
    used = used_models()
    shutil.rmtree(os.path.join(A, "glb"), ignore_errors=True)   # so a model dropped from every set leaves the package too
    for p in ["h_taxi", "lamppost", "mailbox", "h_subway_car", "gull", "life_ring", "dog"]:
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
    print("assets:", {k: len(v) for k, v in cast.items()})

def used_models():
    """Every model file a set can ask for: any quoted name in the code, with or without its ph_ prefix."""
    src = [os.path.join(HERE, "src", f) for f in ("build.js", "main.js", "crowd.js")]
    txt = "\n".join(open(f).read() for f in src); q = set(re.findall(r"['\"`]([A-Za-z0-9_]+)['\"`]", txt))
    return {f[:-4] for f in os.listdir(os.path.join(ONLOC, "glb_pass")) if f.endswith(".glb") and (f[:-4] in q or (f.startswith("ph_") and f[3:-4] in q))}

def count_eggs():
    """Every egg id in the code: c.egg('id', ...) calls and the egg: [hint, 'id', line] of props, in build.js and every batch file."""
    srcs = [os.path.join(HERE, "src", "build.js")]
    txt = "\n".join(open(f).read() for f in srcs)
    return sorted(set(re.findall(r"c\.egg\('(\w+)'", txt)) | set(re.findall(r"egg: \['(?:[^'\\]|\\.)*', '(\w+)'", txt)) | set(re.findall(r"egg: '(\w+)'", txt)))

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
