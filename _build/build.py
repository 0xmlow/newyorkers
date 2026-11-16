"""build.py: assemble THE LIGHTINGS into site/.

Reads the census from the site repo (api/pieces.json), deals twelve New Yorkers to each room by the
neighbourhood the room stands in, clones what the gallery needs into site/assets (APFS clones on the Desktop, plain copies
on the exFAT drive), writes assets/data.js, bundles _build/src with the museum's esbuild and three r185, and
writes site/index.html from shell.html.

  python3 _build/build.py           # everything
  python3 _build/build.py --js      # only rebundle the code and rewrite index.html
"""
import hashlib, json, os, re, shutil, subprocess, sys, time

# on the exFAT drive macOS leaves a ._name beside every file; none of them is ours to read or ship
_ls = os.listdir
os.listdir = lambda d=".": [f for f in _ls(d) if not f.startswith("._")]

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# the project lives on the mlow2026 drive (2026-11-15, the internal disk was full); its sources stay on the Desktop
DESK = os.path.dirname(ROOT) if os.path.isdir(os.path.join(os.path.dirname(ROOT), "NEW YORKERS SITE")) else "/Users/degens/Desktop/NEW YORKERS BY MLOW"
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
    "fifth": ["Midtown"], "channel": ["Midtown"], "rink": ["Midtown"], "tree": ["Midtown"], "top": ["Central Park", "Upper West Side"],
    "menorah": ["Upper East Side", "Central Park"], "market": ["Union Square", "Greenwich Village", "Chelsea", "Flatiron", "Gramercy"], "brooklyn": ["Prospect Heights", "Park Slope"], "window": ["Crown Heights", "Borough Park", "Midwood"],
    "dyker": ["Dyker Heights", "Bay Ridge", "Bensonhurst"],
}
CASTGLB = os.path.join(ROOT, "work", "glb_pass")   # the cast: GPT Image 2.6 concepts and Tripo H3.1 on Krea, passed by _build/cast_pass.py
SEWERS = os.path.join(DESK, "LIVE FROM THE SEWERS 2026-10-23")
HONOR = []

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
    # v4: the CC0 materials (ambientCG) and skies (Poly Haven), processed by tools/cc0_pass.py
    for d, sub in (("cc0tex", "tex"), ("cc0env", "env")):
        src = os.path.join(ROOT, "work", d)
        for f in os.listdir(src) if os.path.isdir(src) else []:
            if f.endswith((".jpg", ".hdr")): os.makedirs(os.path.join(A, sub), exist_ok=True); clone(os.path.join(src, f), os.path.join(A, sub, f))
    walls = sorted(f[:-4] for f in os.listdir(os.path.join(A, "walls")) if f.endswith(".jpg")) if os.path.isdir(os.path.join(A, "walls")) else []
    eggs = count_eggs()
    open(os.path.join(A, "data.js"), "w").write("window.EGG_N=" + str(len(eggs)) + ";\nwindow.CAST=" + json.dumps(cast, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.WALLS=" + json.dumps(walls) + ";\n")
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
    for p in ["h_taxi", "lamppost", "mailbox", "gull", "dog", "nutcracker", "h_car_camry_lo"]:
        clone(os.path.join(S, "props", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    clone(os.path.join(SITE_REPO, "assets", "brand", "logos", "n3w-01.png"), os.path.join(A, "logo.png"))
    # only the models some set names: recipe sources (*_cut, *_src_*) and spare Poly Haven downloads stay in work/
    used = used_models()
    shutil.rmtree(os.path.join(A, "glb"), ignore_errors=True)   # so a model dropped from every set leaves the package too
    for p in ["h_taxi", "lamppost", "mailbox", "gull", "dog", "nutcracker", "h_car_camry_lo"]:
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
    RIG = os.path.join(ROOT, "work", "rig")   # rigged people from _build/rig/rig_pass.py
    for f in sorted(os.listdir(RIG)) if os.path.isdir(RIG) else []:
        if f.endswith(".glb") and not f.endswith("_lite.glb"): clone(os.path.join(RIG, f), os.path.join(A, "glb", "rig_" + f))
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

def assemble():
    """build.js is three parts: the room builder (head), the engine's helpers, the lightings (body). Edit the parts, never build.js."""
    S = os.path.join(HERE, "src"); part = lambda n: open(os.path.join(S, n)).read().rstrip("\n")
    helpers = part("helpers.part.js").split("\n", 1)[1]
    open(os.path.join(S, "build.js"), "w").write(part("head.part.js") + "\n" + helpers + "\n" + part("body.part.js") + "\n" + part("dress.part.js") + "\n" + part("arch.part.js") + "\n" + part("v4.part.js") + "\n" + part("v5.part.js") + "\n" + part("plaza.part.js") + "\n")

def count_eggs():
    """Every egg id in the code: c.egg('id', ...) calls and the egg: [hint, 'id', line] of props, in build.js and every batch file."""
    srcs = [os.path.join(HERE, "src", f) for f in os.listdir(os.path.join(HERE, "src")) if f.endswith(".js") and f not in ("main.js", "build.js")]
    txt = "\n".join(open(f).read() for f in srcs)
    return sorted(set(re.findall(r"c\.egg\('(\w+)'", txt)) | set(re.findall(r"eggBox\([^']*'(\w+)'", txt)) | set(re.findall(r"egg: \['(?:[^'\\]|\\.)*', '(\w+)'", txt)) | set(re.findall(r"egg: '(\w+)'", txt)))

def bundle():
    assemble()
    env = dict(os.environ, NODE_PATH=os.path.join(MUSEUM, "node_modules"))
    r = subprocess.run([os.path.join(MUSEUM, "node_modules", ".bin", "esbuild"), os.path.join(HERE, "src", "main.js"), "--bundle", "--format=esm",
                        "--minify", "--target=es2022", f"--outfile={os.path.join(OUTA, 'gallery.js')}", "--log-level=warning"], env=env)
    if r.returncode: sys.exit("esbuild failed")
    html = open(os.path.join(HERE, "shell.html")).read().replace("@@V@@", time.strftime("%Y%m%d%H%M%S"))
    bad = re.findall(r"[–—→]", html)
    if bad: sys.exit(f"house rule: dashes or arrows in the page: {bad}")
    # the title plate every walkable gallery on the site opens on (NEW YORKERS SITE/assets/ui/title-plate.js, HANDOFF_PLATES):
    # key art from Krea (work/v2/key.jpg and key_p.jpg) as plate.webp / plate-p.webp, ENTER presses #go
    from PIL import Image
    tp = os.path.join(SITE_REPO, "assets", "ui", "title-plate.js")
    keys = [os.path.join(ROOT, "work", "v2", k) for k in ("key.jpg", "key_p.jpg")]
    if os.path.exists(tp) and all(os.path.exists(k) for k in keys):
        h = hashlib.sha256()
        for k, out in zip(keys, ("plate.webp", "plate-p.webp")):
            im = Image.open(k).convert("RGB"); im.thumbnail((1920, 1920)); im.save(os.path.join(OUTD, out), quality=84); h.update(open(k, "rb").read())
        shutil.copyfile(tp, os.path.join(OUTD, "title-plate.js"))
        tag = ('<script src="title-plate.js" data-v="' + h.hexdigest()[:10] + '" data-kick="A walkable gallery by MLow" data-title="THE LIGHTINGS" '
               'data-line="The tree, the menorahs and the city that switches itself on. Nine rooms, one night, you do the lighting."></script>\n')
        i = html.lower().rfind("</body>"); html = html[:i] + tag + html[i:]
    open(os.path.join(OUTD, "index.html"), "w").write(html)
    print("bundle:", os.path.getsize(os.path.join(OUTA, "gallery.js")) // 1024, "KB", "into", OUTD)

# --out <dir>: bundle into a dev copy made by devsite.py instead of site/ (so parallel builders do not overwrite each other)
OUTD = os.path.abspath(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else OUT
OUTA = os.path.join(OUTD, "assets")

if __name__ == "__main__":
    if "--js" not in sys.argv: assets()
    bundle()
