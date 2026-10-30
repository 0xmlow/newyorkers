"""build.py <gallery dir>: assemble one of the 2026-10-30 galleries into <gallery>/site/.

Shared by THE WRAPPED WING, N3W YORKERS SPACE PROGRAM and TAKE A NUMBER. Reads <gallery>/_build/spec.json (the plates
by room, the neighbourhoods each room deals its New Yorkers from, the extras), deals twelve census New Yorkers to each
room, copies what the gallery needs into site/assets (textures, the HDRI, the Draco decoder, the models the code names,
the plates and their depth maps, the fonts, the logo), writes assets/data.js, bundles _build/src with esbuild and three
r185, and writes site/index.html from _build/shell.html.

Sources (NY_SHARED, default ../_shared/vault): the census thumbnails and surfaces from the Museum branch, the plates and
depth maps from the earlier worlds, the cast and the Poly Haven props from ON LOCATION, MLow's M.Texture wrapped GLBs
from the WRAPPED folder on his Drive. fetch_vault.py fills the vault from the git branches.

  python3 _shared/build.py wrapped-wing          # everything
  python3 _shared/build.py wrapped-wing --js     # only rebundle the code and rewrite index.html
"""
import json, os, re, shutil, subprocess, sys, time, random
from PIL import Image, ImageOps, ImageEnhance

G = os.path.abspath(sys.argv[1]); HERE = os.path.join(G, "_build"); SRC = os.path.join(HERE, "src")
REPO = os.path.dirname(G); SHARED = os.environ.get("NY_SHARED", os.path.join(REPO, "_shared", "vault"))
TOOLS = os.environ.get("NY_TOOLS", os.path.join(REPO, "_shared", "tools"))
OUT = os.path.join(G, "site"); A = os.path.join(OUT, "assets")
SPEC = json.load(open(os.path.join(HERE, "spec.json")))
N_PER = SPEC.get("perRoom", 12)

def put(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src): return
    shutil.copy2(src, dst)

def room_ids():
    return re.findall(r"\{ id: '(\w+)'", open(os.path.join(SRC, "rooms.js")).read())

def art():
    """Twelve New Yorkers a room, dealt from the neighbourhoods the room stands in, spread across the census, never the same
    piece twice. The thumbnails ship at 640 px (the house web rule)."""
    P = json.load(open(os.path.join(SHARED, "pieces.json")))
    byhood = {}
    for p in P:
        if p.get("nb") and p.get("st"): byhood.setdefault(p["nb"], []).append(p)
    rnd = random.Random(SPEC.get("seed", 20261030)); used = set(); cast = {}
    for rid in room_ids():
        hoods = SPEC["hoods"].get(rid, ["Midtown"]); pool = [p for h in hoods for p in byhood.get(h, [])]
        rnd.shuffle(pool); pick = []
        for p in pool:
            if p["n"] in used: continue
            src = os.path.join(SHARED, "t", p["st"][0] + ".jpg")
            if not os.path.exists(src): continue
            f = p["st"][0] + ".jpg"; dst = os.path.join(A, "art", f)
            if not os.path.exists(dst):
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                im = Image.open(src).convert("RGB"); im.thumbnail((640, 640)); im.save(dst, quality=82, optimize=True)
            used.add(p["n"]); pick.append({"n": p["n"], "t": p["t"], "h": p.get("nb", ""), "b": (p.get("b") or "").split(" (")[0], "f": f, "s": (p.get("story") or "")[:160]})
            if len(pick) >= N_PER: break
        cast[rid] = pick
    return cast

def plates():
    """Each room's plate comes from the vault under the room's own name, with the room's own treatment (a tint, a flip,
    a desaturation) so the same photograph never reads the same twice across the worlds."""
    for rid, spec in SPEC["plates"].items():
        src = spec["from"]; world, name = src.split("/")
        pj = os.path.join(SHARED, "plates", world, "plates", name + ".jpg"); dp = os.path.join(SHARED, "plates", world, "depth", name + ".png")
        if not os.path.exists(pj) or not os.path.exists(dp): sys.exit(f"plate missing: {src}")
        od = os.path.join(A, "plates", rid + ".jpg"); odd = os.path.join(A, "depth", rid + ".png")
        im = Image.open(pj).convert("RGB"); d = Image.open(dp).convert("L")
        if spec.get("flip"): im = ImageOps.mirror(im); d = ImageOps.mirror(d)
        if "sat" in spec: im = ImageEnhance.Color(im).enhance(spec["sat"])
        if "tint" in spec:   # a colour multiplied in, for Mars and the moon
            r, g, b = spec["tint"]; im = Image.merge("RGB", [ch.point(lambda v, k=k: min(255, int(v * k))) for ch, k in zip(im.split(), (r, g, b))])
        if "bright" in spec: im = ImageEnhance.Brightness(im).enhance(spec["bright"])
        os.makedirs(os.path.dirname(od), exist_ok=True); os.makedirs(os.path.dirname(odd), exist_ok=True)
        im.save(od, quality=86, optimize=True, progressive=True); d.save(odd)

def used_models():
    """Every model file a room can ask for: any quoted name in the code, with or without its ph_ prefix."""
    txt = "\n".join(open(os.path.join(SRC, f)).read() for f in os.listdir(SRC) if f.endswith(".js"))
    q = set(re.findall(r"['\"`]([A-Za-z0-9_\-]+)['\"`]", txt))
    names = set()
    for d in ("glb", "wrapped"):
        for f in os.listdir(os.path.join(SHARED, d)):
            if not f.endswith(".glb"): continue
            n = f[:-4]
            if n in q or (n.startswith("ph_") and n[3:] in q): names.add((d, f))
    return names

def count_eggs():
    srcs = [os.path.join(SRC, f) for f in os.listdir(SRC) if f.endswith(".js") and not f.startswith("main")]
    txt = "\n".join(open(f).read() for f in srcs)
    return sorted(set(re.findall(r"c\.egg\('(\w+)'", txt)) | set(re.findall(r"egg: \['(?:[^'\\]|\\.)*', '(\w+)'", txt)) | set(re.findall(r"egg: '(\w+)'", txt)) | set(re.findall(r"cc?\.egg\(`(\w+)", txt)))

def assets():
    cast = art()
    for s in SPEC.get("surfaces", ["asphalt", "brick", "plaster", "terrazzo", "concrete", "marble", "cobble", "planks", "ashlar", "pavers", "steel", "grass"]):
        for k in "cnr": put(os.path.join(SHARED, "tex", f"{s}_{k}.jpg"), os.path.join(A, "tex", f"{s}_{k}.jpg"))
    put(os.path.join(SHARED, "env", SPEC.get("hdri", "night") + ".hdr"), os.path.join(A, "env", "night.hdr"))
    for f in ("draco_decoder.wasm", "draco_wasm_wrapper.js", "draco_decoder.js"): put(os.path.join(SHARED, "draco", f), os.path.join(A, "draco", f))
    put(os.path.join(SHARED, "brand", "n3w-01.png"), os.path.join(A, "logo.png"))
    shutil.rmtree(os.path.join(A, "glb"), ignore_errors=True)
    for d, f in sorted(used_models()): put(os.path.join(SHARED, d, f), os.path.join(A, "glb", f))
    posters = []
    if SPEC.get("posters"):
        for f in sorted(os.listdir(os.path.join(SHARED, "posters"))):
            if f.endswith(".jpg"):
                src = os.path.join(SHARED, "posters", f); dst = os.path.join(A, "posters", f); os.makedirs(os.path.dirname(dst), exist_ok=True)
                if not os.path.exists(dst): im = Image.open(src).convert("RGB"); im.thumbnail((512, 768)); im.save(dst, quality=80)
                posters.append(f)
    plates()
    eggs = count_eggs()
    open(os.path.join(A, "data.js"), "w").write("window.EGG_N=" + str(len(eggs)) + ";\nwindow.CAST=" + json.dumps(cast, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.WALLS=[];\nwindow.POSTERS=" + json.dumps(posters) + ";\n")
    print("art:", {k: len(v) for k, v in cast.items()}); print("eggs:", len(eggs), eggs); print("models:", len(os.listdir(os.path.join(A, "glb"))))

def bundle():
    env = dict(os.environ, NODE_PATH=os.path.join(TOOLS, "node_modules"))
    r = subprocess.run([os.path.join(TOOLS, "node_modules", ".bin", "esbuild"), os.path.join(SRC, "main.js"), "--bundle", "--format=esm", "--minify", "--target=es2022", f"--outfile={os.path.join(A, 'gallery.js')}", "--log-level=warning"], env=env)
    if r.returncode: sys.exit("esbuild failed")
    html = open(os.path.join(HERE, "shell.html")).read().replace("@@V@@", time.strftime("%Y%m%d%H%M%S"))
    bad = re.findall(r"[–—→]", html)
    if bad: sys.exit(f"house rule: dashes or arrows in the page: {bad}")
    open(os.path.join(OUT, "index.html"), "w").write(html)
    print("bundle:", os.path.getsize(os.path.join(A, "gallery.js")) // 1024, "KB")

if __name__ == "__main__":
    if "--js" not in sys.argv: assets()
    bundle()
