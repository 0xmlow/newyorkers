"""build.py: assemble TEN STYLES. ONE CITY. into site/.

Reads work/cast.json (art.py dealt twelve restyled New Yorkers to each room from the Krea 3 style passes), clones what the gallery needs into site/assets (APFS clones, so no
disk is spent), writes assets/data.js, bundles _build/src with the museum's esbuild and three r185, and
writes site/index.html from shell.html.

  python3 _build/build.py           # everything
  python3 _build/build.py --js      # only rebundle the code and rewrite index.html
"""
import hashlib, json, os, re, shutil, subprocess, sys, time

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
CASTGLB = os.path.join(ROOT, "work", "glb_pass")   # the FLORA cast: GPT Image 2.5 concepts, Tripo H3.1, _build/cast_pass.py
SEWERS = os.path.join(DESK, "LIVE FROM THE SEWERS 2026-10-23")
HONOR = []

def clone(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src): return
    if os.path.exists(dst): os.remove(dst)
    if subprocess.call(["cp", "-c", src, dst]) != 0: shutil.copy2(src, dst)

def assets():
    cast = json.load(open(os.path.join(ROOT, "work", "cast.json")))
    for room, pick in cast.items():
        for p in pick: clone(os.path.join(ROOT, "work", "art", p["f"]), os.path.join(A, "art", p["f"]))
    # the vault: every restyled piece of each style, an atlas for the wall and a 448 copy for the card
    V = os.path.join(ROOT, "work", "vault"); vault = {}
    for f in sorted(os.listdir(V)):
        if f.endswith(".json"):
            st = f[:-5]; vault[st] = json.load(open(os.path.join(V, f)))
            clone(os.path.join(V, f"atlas_{st}.jpg"), os.path.join(A, "vault", f"atlas_{st}.jpg"))
            for it in vault[st]["items"]: clone(os.path.join(V, st, it[3]), os.path.join(A, "vault", st, it[3]))
    subprocess.call([sys.executable, os.path.join(HERE, "walls.py")])
    walls = sorted(f[:-4] for f in os.listdir(os.path.join(A, "walls")) if f.endswith(".jpg")) if os.path.isdir(os.path.join(A, "walls")) else []
    eggs = count_eggs()
    open(os.path.join(A, "data.js"), "w").write("window.EGG_N=" + str(len(eggs)) + ";\nwindow.CAST=" + json.dumps(cast, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.WALLS=" + json.dumps(walls) + ";\nwindow.VAULT=" + json.dumps(vault, ensure_ascii=False, separators=(",", ":")) + ";\n")
    S = os.path.join(SITE_REPO, "assets", "museum")
    for s in ["asphalt", "brick", "plaster", "terrazzo", "concrete", "marble", "cobble", "planks", "ashlar", "pavers", "boardwalk", "grass", "patina", "steel"]:
        for k in "cnr": clone(os.path.join(S, "surfaces", f"{s}_{k}.jpg"), os.path.join(A, "tex", f"{s}_{k}.jpg"))
    for f in os.listdir(os.path.join(SEWERS, "site", "assets", "tex")):
        if f.endswith(".jpg") and not os.path.exists(os.path.join(A, "tex", f)): clone(os.path.join(SEWERS, "site", "assets", "tex", f), os.path.join(A, "tex", f))
    clone(os.path.join(S, "hdri", "night.hdr"), os.path.join(A, "env", "night.hdr"))
    for k in ("day", "golden"): clone(os.path.join(S, "hdri", k + ".hdr"), os.path.join(A, "env", k + ".hdr"))
    os.makedirs(os.path.join(A, "ceil"), exist_ok=True)
    for f in os.listdir(os.path.join(ROOT, "work", "ceil_raw")) if os.path.isdir(os.path.join(ROOT, "work", "ceil_raw")) else []:
        if f.endswith(".png"):
            from PIL import Image
            Image.open(os.path.join(ROOT, "work", "ceil_raw", f)).convert("RGB").resize((1024, 1024)).save(os.path.join(A, "ceil", f[:-4] + ".jpg"), quality=84)
    for p in ["h_taxi", "lamppost", "mailbox", "h_subway_car", "gull", "life_ring", "dog"]:
        clone(os.path.join(S, "props", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    clone(os.path.join(SITE_REPO, "assets", "brand", "logos", "n3w-01.png"), os.path.join(A, "logo.png"))
    # only the models some set names: recipe sources (*_cut, *_src_*) and spare Poly Haven downloads stay in work/
    used = used_models()
    shutil.rmtree(os.path.join(A, "glb"), ignore_errors=True)   # so a model dropped from every set leaves the package too
    for p in ["h_taxi", "lamppost", "mailbox", "h_subway_car", "gull", "life_ring", "dog"]:
        clone(os.path.join(S, "props", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    for p in ["hydrant", "pigeon", "rat", "cat", "turnstile"]:
        clone(os.path.join(MARKS, "work", "glb_pass", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    for f in sorted(os.listdir(os.path.join(ONLOC, "glb_pass"))):
        if f.endswith(".glb") and f[:-4] in used:
            src = os.path.join(ONLOC, "glb_pass", f); dz = os.path.join(ONLOC, "glb_draco", f)
            # the Draco copy when it is current (python3 _build/draco.py makes them), the plain pass when it is not
            clone(dz if os.path.exists(dz) and os.path.getmtime(dz) >= os.path.getmtime(src) else src, os.path.join(A, "glb", f))
    for f in sorted(os.listdir(CASTGLB)):
        if f.endswith(".glb"): clone(os.path.join(CASTGLB, f), os.path.join(A, "glb", f))
    if os.path.exists(os.path.join(ONLOC, "glb_pass", "liberty_statue_v2.glb")): clone(os.path.join(ONLOC, "glb_pass", "liberty_statue_v2.glb"), os.path.join(A, "glb", "liberty_statue_v2.glb"))
    # the lean copies (_build/lean_pass.py: decimated cast, Draco everywhere) replace an original only while it is the one they came from
    LEAN = os.path.join(ROOT, "work", "glb_lean"); man = json.load(open(os.path.join(LEAN, "manifest.json"))) if os.path.exists(os.path.join(LEAN, "manifest.json")) else {}
    lean = stale = 0
    for n, sha in man.items():
        dst = os.path.join(A, "glb", n + ".glb")
        if not os.path.exists(dst): continue
        if hashlib.sha1(open(dst, "rb").read()).hexdigest() != sha: stale += 1; print("lean copy stale, shipping the original:", n); continue
        os.remove(dst); clone(os.path.join(LEAN, n + ".glb"), dst); lean += 1
    print(f"models: {lean} lean copies shipped, {stale} stale")
    for f in ("draco_decoder.wasm", "draco_wasm_wrapper.js", "draco_decoder.js"):
        clone(os.path.join(MUSEUM, "node_modules", "three", "examples", "jsm", "libs", "draco", "gltf", f), os.path.join(A, "draco", f))
    print("assets:", {k: len(v) for k, v in cast.items()})

def used_models():
    """Every model file a set can ask for: any quoted name in the code, with or without its ph_ prefix."""
    src = [os.path.join(HERE, "src", f) for f in os.listdir(os.path.join(HERE, "src")) if f.endswith(".js")]
    txt = "\n".join(open(f).read() for f in src); q = set(re.findall(r"['\"`]([A-Za-z0-9_]+)['\"`]", txt))
    return {f[:-4] for f in os.listdir(os.path.join(ONLOC, "glb_pass")) if f.endswith(".glb") and (f[:-4] in q or (f.startswith("ph_") and f[3:-4] in q))}

def count_eggs():
    """Every egg id in the code: c.egg('id', ...) calls and the egg: [hint, 'id', line] of props, in build.js and every batch file."""
    srcs = [os.path.join(HERE, "src", f) for f in os.listdir(os.path.join(HERE, "src")) if f.endswith(".js") and f != "main.js"]
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
