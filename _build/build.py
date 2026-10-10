"""build.py: assemble ON LOCATION into site/.

Reads the census from the site repo (api/pieces.json), deals twelve New Yorkers to each film set by the
neighbourhood the film was shot in, clones what the gallery needs into site/assets (APFS clones, so no
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
MUSEUM = os.path.join(SITE_REPO, "_build", "museum")
OUT = os.path.join(ROOT, "site")
A = os.path.join(OUT, "assets")
N_PER = 12
# the set: where each film was shot, so the walls hold New Yorkers from that block
HOODS = {
    "lobby": ["Midtown"], "taxi": ["Hell's Kitchen", "Midtown"], "big": ["Central Park", "Midtown"],
    "itch": ["Turtle Bay", "Murray Hill"], "heat": ["Bedford-Stuyvesant"], "ghost": ["Tribeca"],
    "natm": ["Upper West Side"], "coney": ["Coney Island"], "stairs": ["Highbridge", "Concourse"], "kong": ["Midtown"],
    "tiffany": ["Upper East Side", "Central Park"], "rear": ["Greenwich Village", "West Village"], "disco": ["Bay Ridge"],
    "copa": ["Upper East Side", "Murray Hill"], "walking": ["Midtown", "Hell's Kitchen"],
    "katz": ["Lower East Side"], "feast": ["Chinatown"], "westside": ["Upper West Side", "Morningside Heights"], "loft": ["SoHo"], "wallst": ["Financial District"],
    "pigeons": ["Central Park"], "rink": ["Midtown"], "moon": ["Brooklyn Heights", "Carroll Gardens"], "pelham": ["Flatiron", "Murray Hill"], "manhattan": ["Turtle Bay", "Gramercy"],
    "clover": ["Financial District", "Tribeca"], "library": ["Midtown"], "dogday": ["Sheepshead Bay", "Flatbush"], "fame": ["Hell's Kitchen", "Midtown"],
    "annie": ["Upper West Side"], "unisphere": ["Flushing Meadows", "Corona"], "mcmlow": ["Jamaica", "Richmond Hill"], "bramford": ["Upper West Side", "Central Park"],
    "apartment": ["Midtown", "Murray Hill"], "chase": ["Bensonhurst", "Bay Ridge"],
    "birdman": ["Midtown"], "network": ["Midtown", "Upper West Side"], "gems": ["Midtown"], "smoke": ["Park Slope"], "mail": ["Upper West Side"],
    "batteries": ["East Village"], "susan": ["East Village", "Lower East Side"], "dumbo": ["Downtown Brooklyn", "Brooklyn Navy Yard", "Brooklyn Heights"],
    "bronx": ["Belmont"], "kramer": ["Upper East Side"],
    "zoolander": ["Midtown", "Flatiron"], "wildstyle": ["Mott Haven", "Hunts Point", "Morrisania"], "ragingbull": ["Midtown"], "ferry": ["St. George", "The Battery"],
    "tenenbaums": ["Harlem"], "meanstreets": ["Chinatown", "Lower East Side"], "barefoot": ["Greenwich Village", "West Village"], "crooklyn": ["Bedford-Stuyvesant", "Crown Heights"],
    "legend": ["Midtown"], "llewyn": ["Greenwich Village", "West Village"],
    "fisherking": ["Midtown", "Murray Hill"], "waituntildark": ["Greenwich Village"], "tootsie": ["Midtown", "Hell's Kitchen"],
    "insideman": ["Financial District"], "prada": ["Midtown", "Chelsea"], "blackswan": ["Upper West Side", "Lincoln Square"],
    "cocktail": ["Upper East Side", "Lenox Hill"], "gangs": ["Lower East Side", "Chinatown"], "oddcouple": ["Upper West Side", "Upper East Side"],
    "ontown": ["Brooklyn Navy Yard", "DUMBO", "Fort Greene"],
    "godfather": ["Belmont", "Fordham", "Morrisania"], "crowd": ["Midtown", "Financial District"], "producers": ["Upper West Side"],
    "devils": ["Upper East Side", "Midtown"], "diehard": ["Harlem", "Upper West Side"], "dundee": ["Midtown"],
    "dolly": ["Gramercy", "Flatiron", "Chelsea"], "stuart": ["Upper East Side"], "sweetsmell": ["Hell's Kitchen", "Midtown"],
    "scent": ["Upper East Side", "Midtown"],
    "splash": ["Upper West Side", "Midtown"], "afterhours": ["SoHo", "Tribeca"], "crown": ["Upper East Side"],
    "trading": ["Financial District"], "miracle": ["Midtown"], "treebrooklyn": ["Williamsburg", "Greenpoint"],
    "gatsby": ["Corona", "Flushing Meadows", "Flushing"], "bigdaddy": ["Central Park"], "serendipity": ["Upper East Side", "Midtown"],
    "bigbusiness": ["Midtown"],
}

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
    eggs = sorted(set(re.findall(r"c\.egg\('(\w+)'", open(os.path.join(HERE, "src", "build.js")).read())))
    open(os.path.join(A, "data.js"), "w").write("window.EGG_N=" + str(len(eggs)) + ";\nwindow.CAST=" + json.dumps(cast, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.WALLS=" + json.dumps(walls) + ";\n")
    S = os.path.join(SITE_REPO, "assets", "museum")
    for s in ["asphalt", "brick", "plaster", "terrazzo", "concrete", "marble", "cobble", "planks"]:
        for k in "cnr": clone(os.path.join(S, "surfaces", f"{s}_{k}.jpg"), os.path.join(A, "tex", f"{s}_{k}.jpg"))
    clone(os.path.join(S, "hdri", "night.hdr"), os.path.join(A, "env", "night.hdr"))
    for p in ["h_taxi", "lamppost", "mailbox", "h_subway_car", "gull", "life_ring", "dog"]:
        clone(os.path.join(S, "props", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    for p in ["hydrant", "pigeon", "rat", "cat"]:   # THE MARKS heroes, reused
        clone(os.path.join(MARKS, "work", "glb_pass", f"{p}.glb"), os.path.join(A, "glb", f"{p}.glb"))
    clone(os.path.join(SITE_REPO, "assets", "brand", "logos", "n3w-01.png"), os.path.join(A, "logo.png"))
    for f in sorted(os.listdir(os.path.join(ROOT, "work", "glb_pass"))):
        if f.endswith(".glb"): clone(os.path.join(ROOT, "work", "glb_pass", f), os.path.join(A, "glb", f))
    print("assets:", {k: len(v) for k, v in cast.items()})

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
    if "--js" not in sys.argv: assets()
    bundle()
