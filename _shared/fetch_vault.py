"""fetch_vault.py: fill _shared/vault from this repository's own branches, so the three 2026-10-30 galleries build from a
clean checkout. Run once after cloning (git fetch --all first). Takes a few minutes: the census thumbnails alone are
6,218 files from the Museum branch.

  python3 _shared/fetch_vault.py            # everything the builds need, except the wrapped GLBs
  python3 _shared/fetch_vault.py --tools    # also npm install three@0.185 and esbuild into _shared/tools

The M.Texture wrapped GLBs (vault/wrapped) are MLow's own, from the WRAPPED folder on his Drive
(files named <object>__wrapped-in__<painting>.glb; drop them in as <object>.glb). They are also committed inside each
gallery's site/assets/glb, so a build without the vault copy still ships them (build.py keeps whatever is already there
when the vault lacks a file).
"""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(HERE); V = os.path.join(HERE, "vault")
def git(*a, **k): return subprocess.run(["git", *a], cwd=REPO, capture_output=True, text=True, **k).stdout
def tree(branch): return git("ls-tree", "-r", "--name-only", f"origin/{branch}").split("\n")
def show(branch, path, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst): return
    with open(dst, "wb") as f: subprocess.run(["git", "show", f"origin/{branch}:{path}"], cwd=REPO, stdout=f, check=True)
def main():
    os.makedirs(V, exist_ok=True)
    # surfaces, HDRIs, the logo, the census data from the Museum branch
    for p in tree("Museum"):
        if re.match(r"assets/museum/surfaces/\w+_[cnr]\.jpg$", p): show("Museum", p, os.path.join(V, "tex", os.path.basename(p)))
        if re.match(r"assets/museum/hdri/\w+\.hdr$", p): show("Museum", p, os.path.join(V, "env", os.path.basename(p)))
        if p in ("assets/brand/logos/n3w-01.png",): show("Museum", p, os.path.join(V, "brand", os.path.basename(p)))
        if re.match(r"assets/museum/props/(h_taxi|lamppost|mailbox|h_subway_car|gull|life_ring|dog)\.glb$", p): show("Museum", p, os.path.join(V, "glb", os.path.basename(p)))
    if not os.path.exists(os.path.join(V, "pieces.json")):
        s = git("show", "origin/Museum:assets/data.js"); s = s[s.index("{"):].rstrip().rstrip(";"); json.dump(json.loads(s)["pieces"], open(os.path.join(V, "pieces.json"), "w"))
    # the plates and depth maps of every world that has them
    for b in ("on-location", "same-difference", "live-from-the-sewers", "the-eviction", "the-marks-night", "on-record"):
        for p in tree(b):
            if re.match(r"site/assets/(plates|depth)/[\w\-]+\.(jpg|png)$", p): show(b, p, os.path.join(V, "plates", b, p.split("/")[2], os.path.basename(p)))
    # the cast and the CC0 props from ON LOCATION, the MARKS kit, the sewers cast, the fonts, the SAME DIFFERENCE posters
    for p in tree("on-location"):
        if re.match(r"site/assets/glb/[\w\-]+\.glb$", p) and "/crowd_" not in p and "/rig_" not in p: show("on-location", p, os.path.join(V, "glb", os.path.basename(p)))
        if p.startswith("site/fonts/"): show("on-location", p, os.path.join(V, "fonts", os.path.basename(p)))
    for p in tree("the-marks-night"):
        if re.match(r"site/assets/glb/(cat|hydrant|pigeon|rat|turnstile|newsstand|dispenser|stamp|seal|monte|taker|tower|storm_drain)\.glb$", p): show("the-marks-night", p, os.path.join(V, "glb", "mk_" + os.path.basename(p)))
    for p in tree("live-from-the-sewers"):
        if re.match(r"work/glb_pass/sw_\w+\.glb$", p): show("live-from-the-sewers", p, os.path.join(V, "glb", os.path.basename(p)))
        if p == "site/phone-gpu.js": show("live-from-the-sewers", p, os.path.join(V, "phone-gpu.js"))
    for p in tree("same-difference"):
        if re.match(r"posters/final/\d+_\w+\.jpg$", p): show("same-difference", p, os.path.join(V, "posters", os.path.basename(p)))
    # the census thumbnails, only the located ones, through one git cat-file batch
    P = json.load(open(os.path.join(V, "pieces.json"))); want = sorted({p["st"][0] for p in P if p.get("st") and p.get("nb")})
    os.makedirs(os.path.join(V, "t"), exist_ok=True); have = set(os.listdir(os.path.join(V, "t"))); need = [w for w in want if w + ".jpg" not in have]
    if need:
        pr = subprocess.Popen(["git", "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, cwd=REPO)
        for w in need:
            pr.stdin.write(f"origin/Museum:assets/t/{w}.jpg\n".encode()); pr.stdin.flush(); hdr = pr.stdout.readline().decode().strip()
            if hdr.endswith("missing"): continue
            size = int(hdr.split()[2]); data = pr.stdout.read(size); pr.stdout.read(1); open(os.path.join(V, "t", w + ".jpg"), "wb").write(data)
        pr.stdin.close()
    tools = os.path.join(HERE, "tools")
    if "--tools" in sys.argv or not os.path.exists(os.path.join(tools, "node_modules", "three")):
        os.makedirs(tools, exist_ok=True); subprocess.run(["npm", "init", "-y"], cwd=tools, capture_output=True); subprocess.run(["npm", "i", "three@0.185.0", "esbuild@0.28.2"], cwd=tools, check=True)
    for f in ("draco_decoder.wasm", "draco_wasm_wrapper.js", "draco_decoder.js"):
        src = os.path.join(tools, "node_modules", "three", "examples", "jsm", "libs", "draco", "gltf", f); dst = os.path.join(V, "draco", f)
        if not os.path.exists(dst): os.makedirs(os.path.dirname(dst), exist_ok=True); open(dst, "wb").write(open(src, "rb").read())
    os.makedirs(os.path.join(V, "wrapped"), exist_ok=True)
    print("vault:", {d: len(os.listdir(os.path.join(V, d))) for d in os.listdir(V) if os.path.isdir(os.path.join(V, d))})
if __name__ == "__main__": main()
