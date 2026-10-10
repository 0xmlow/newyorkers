"""build.py: assemble THE MARKS gallery into site/.

Reads THE MARKS from the site repo (api/marks.json, the 480 px thumbs and the loops), clones what the
gallery needs into site/assets (APFS clones, so no disk is spent), writes assets/data.js, bundles
_build/src with the museum's esbuild and three r185, and writes site/index.html from shell.html.

  python3 _build/build.py           # everything
  python3 _build/build.py --js      # only rebundle the code and rewrite index.html
"""
import json, os, re, shutil, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE_REPO = os.path.join(os.path.dirname(ROOT), "NEW YORKERS SITE")
MUSEUM = os.path.join(SITE_REPO, "_build", "museum")
OUT = os.path.join(ROOT, "site")
A = os.path.join(OUT, "assets")

def clone(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src): return
    if os.path.exists(dst): os.remove(dst)
    if subprocess.call(["cp", "-c", src, dst]) != 0: shutil.copy2(src, dst)

def assets():
    m = json.load(open(os.path.join(SITE_REPO, "api", "marks.json")))
    U, C = [], []
    for x in m["uncounted"]:
        n = x["census"]; lp = os.path.exists(os.path.join(SITE_REPO, "assets", "marks", "loops", f"{n}.mp4"))
        U.append({"n": x["mark"], "c": n, "t": x["title"], "b": x.get("borough", ""), "h": x.get("neighborhood", ""), "e": x.get("era", ""), "lp": lp})
        if lp: clone(os.path.join(SITE_REPO, "assets", "marks", "loops", f"{n}.mp4"), os.path.join(A, "loops", f"{n}.mp4"))
    for x in m["eraClosers"]:
        C.append({"n": 0, "c": x["census"], "t": x["title"], "e": x.get("era", ""), "closer": True, "lp": False})
    for x in U + C:
        clone(os.path.join(SITE_REPO, "assets", "marks", "th", f"{x['c']}.jpg"), os.path.join(A, "art", "th", f"{x['c']}.jpg"))
    walls = sorted(f[:-4] for f in os.listdir(os.path.join(A, "walls")) if f.endswith(".jpg")) if os.path.isdir(os.path.join(A, "walls")) else []
    open(os.path.join(A, "data.js"), "w").write("window.MARKS=" + json.dumps({"u": U, "c": C}, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.WALLS=" + json.dumps(walls) + ";\n")
    # surfaces, night sky, the cab topper, museum props we reuse
    S = os.path.join(SITE_REPO, "assets", "museum")
    for s in ["asphalt", "brick", "plaster", "terrazzo", "concrete", "marble", "cobble", "planks"]:
        for k in "cnr": clone(os.path.join(S, "surfaces", f"{s}_{k}.jpg"), os.path.join(A, "tex", f"{s}_{k}.jpg"))
    clone(os.path.join(S, "hdri", "night.hdr"), os.path.join(A, "env", "night.hdr"))
    clone(os.path.join(S, "taxi", "topper.jpg"), os.path.join(A, "env", "topper.jpg"))
    for p in ["h_taxi", "h_subway_car", "lamppost", "mailbox", "storm_drain"]:
        clone(os.path.join(S, "props", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    clone(os.path.join(SITE_REPO, "assets", "brand", "logos", "n3w-01.png"), os.path.join(A, "logo.png"))
    # the hero GLBs: Tripo H3.1 on Krea, then the museum's Blender prop pass (work/glb_pass)
    for f in sorted(os.listdir(os.path.join(ROOT, "work", "glb_pass"))):
        if f.endswith(".glb"): clone(os.path.join(ROOT, "work", "glb_pass", f), os.path.join(A, "glb", f))
    print(f"assets: {len(U)} uncounted ({sum(u['lp'] for u in U)} loops), {len(C)} closers")

def bundle():
    env = dict(os.environ, NODE_PATH=os.path.join(MUSEUM, "node_modules"))
    r = subprocess.run([os.path.join(MUSEUM, "node_modules", ".bin", "esbuild"), os.path.join(HERE, "src", "main.js"), "--bundle", "--format=esm",
                        "--minify", "--target=es2022", f"--outfile={os.path.join(A, 'gallery.js')}", "--log-level=warning"], env=env)
    if r.returncode: sys.exit("esbuild failed")
    tally = ''.join('<svg viewBox="0 0 46 40"><g stroke="#f4ead2" stroke-width="3" stroke-linecap="round"><path d="M6 4v32M15 4v32M24 4v32M33 4v32"/><path d="M1 30L42 8" stroke="#f5c542"/></g></svg>' for _ in range(5))
    html = open(os.path.join(HERE, "shell.html")).read().replace("@@TALLY@@", tally).replace("@@V@@", time.strftime("%Y%m%d%H%M%S"))
    bad = re.findall(r"[–—→]", html)
    if bad: sys.exit(f"house rule: dashes or arrows in the page: {bad}")
    open(os.path.join(OUT, "index.html"), "w").write(html)
    print("bundle:", os.path.getsize(os.path.join(A, "gallery.js")) // 1024, "KB")

if __name__ == "__main__":
    if "--js" not in sys.argv: assets()
    bundle()
