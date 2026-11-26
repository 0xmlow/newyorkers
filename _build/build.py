"""build.py: assemble THE GARDEN into site/.

Deals census New Yorkers from the Garden's own blocks to the concourse hang, writes assets/data.js,
splits the Firefly sheet into assets/ff/*.webp, and bundles _build/src with the museum's esbuild and three r185.

  python3 _build/build.py          # everything
  python3 _build/build.py --js     # only the code and index.html
"""
import json, os, re, shutil, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); DESK = os.path.dirname(ROOT)
SITE_REPO = os.path.join(DESK, "NEW YORKERS SITE"); MUSEUM = os.path.join(SITE_REPO, "_build", "museum")
OUT = os.path.join(ROOT, "site"); A = os.path.join(OUT, "assets")
# the Garden stands on Seventh Avenue between 31st and 33rd: its New Yorkers come from Midtown, then Chelsea and Hell's Kitchen
HOODS = ["Midtown", "Chelsea", "Hell's Kitchen", "Murray Hill"]
N_HANG = 64

def clone(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src): return
    if os.path.exists(dst): os.remove(dst)
    if subprocess.call(["cp", "-c", src, dst]) != 0: shutil.copy2(src, dst)

def hang():
    P = json.load(open(os.path.join(SITE_REPO, "api", "pieces.json")))
    pool = []
    for h in HOODS:
        ps = sorted((p for p in P if p.get("neighborhood") == h and p.get("image")), key=lambda p: p["n"])
        step = max(1, len(ps) // (N_HANG // len(HOODS)))   # spread across the census, not the first numbers in a row
        pool += ps[::step][: N_HANG // len(HOODS)]
    out = []
    for p in pool:
        f = p["image"].split("/assets/")[-1]; src = os.path.join(SITE_REPO, "assets", f)
        if not os.path.exists(src): continue
        clone(src, os.path.join(A, "art", os.path.basename(f)))
        out.append({"n": p["n"], "t": p["title"], "h": p["neighborhood"], "f": os.path.basename(f), "s": (p.get("story") or "")[:180], "u": p.get("url", "")})
    return out

def eggs():
    txt = "\n".join(open(os.path.join(HERE, "src", f)).read() for f in os.listdir(os.path.join(HERE, "src")) if f.endswith(".js"))
    return sorted(set(re.findall(r"egg\('(\w+)'", txt)) | set(re.findall(r"egg: '(\w+)'", txt)))

# Firefly sometimes paints the thing in a room: keep only the art (fractions of width and height)
CROP = {"banner": (0.13, 0.05, 0.87, 0.94), "stage_led": (0.02, 0.04, 0.98, 0.86)}

def ff():
    """Firefly masters (work/ff_raw/*.png|jpg) to assets/ff/<name>.webp, long side 2048."""
    from PIL import Image
    src = os.path.join(ROOT, "work", "ff_raw"); names = []
    for f in sorted(os.listdir(src)):
        if not f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")): continue
        n = os.path.splitext(f)[0]; dst = os.path.join(A, "ff", n + ".webp"); names.append(n)
        if os.path.exists(dst) and os.path.getmtime(dst) >= max(os.path.getmtime(os.path.join(src, f)), os.path.getmtime(__file__)): continue
        im = Image.open(os.path.join(src, f)).convert("RGB")
        c = CROP.get(n) or (CROP["banner"] if n.startswith("banner") else None)
        if c: W, H = im.size; im = im.crop((int(c[0] * W), int(c[1] * H), int(c[2] * W), int(c[3] * H)))
        im.thumbnail((2048, 2048)); im.save(dst, quality=86, method=5)
    return names

def bundle():
    env = dict(os.environ, NODE_PATH=os.path.join(MUSEUM, "node_modules"))
    r = subprocess.run([os.path.join(MUSEUM, "node_modules", ".bin", "esbuild"), os.path.join(HERE, "src", "main.js"), "--bundle", "--format=esm",
                        "--minify", "--target=es2022", f"--outfile={os.path.join(A, 'gallery.js')}", "--log-level=warning"], env=env)
    if r.returncode: sys.exit("esbuild failed")
    html = open(os.path.join(HERE, "shell.html")).read().replace("@@V@@", time.strftime("%Y%m%d%H%M%S"))
    bad = re.findall(r"[–—→]", html)
    if bad: sys.exit(f"house rule: dashes or arrows in the page: {bad}")
    open(os.path.join(OUT, "index.html"), "w").write(html)
    print("bundle:", os.path.getsize(os.path.join(A, "gallery.js")) // 1024, "KB")

if __name__ == "__main__":
    if "--js" not in sys.argv:
        h = hang(); names = ff()
        open(os.path.join(A, "data.js"), "w").write("window.HANG=" + json.dumps(h, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.FF=" + json.dumps(names) + ";\n")
        print("hang:", len(h), "ff:", names)
    e = eggs(); open(os.path.join(A, "eggs.js"), "w").write("window.EGG_N=" + str(len(e)) + ";\n"); print("eggs:", len(e))
    bundle()
