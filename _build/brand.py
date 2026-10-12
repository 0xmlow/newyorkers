"""brand.py: run the Blender brand pass over recipe files, a few Blenders at a time.

Text stickers ({"text": ...}) are drawn here with PIL (Blender's Python has none) into work/stickers/lbl_<hash>.png
and the recipe is handed to brand_pass.py with {"img": "lbl_<hash>"} instead. One Blender per recipe, so a
model that breaks Blender loses only itself.

  python3 _build/brand.py _build/brand/<file>.json [more.json ...] [--only a,b] [--force] [--preview <dir>] [-j 3]
"""
import json, os, sys, hashlib, subprocess, tempfile, concurrent.futures as cf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); sys.path.insert(0, HERE)
import stickers as S
BL = "/Applications/Blender.app/Contents/MacOS/Blender"
argv = sys.argv[1:]; files = [a for a in argv if a.endswith(".json")]
opt = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
only = set(opt("--only", "").split(",")) - {""}; J = int(opt("-j", "3")); prev = opt("--preview")
R = {}
for f in files: R.update(json.load(open(f)))
if only: R = {k: v for k, v in R.items() if k in only}
os.makedirs(S.OUT, exist_ok=True)
for name, rc in R.items():
    for st in rc.get("stickers", []) + rc.get("adds", []):
        if "text" in st:
            key = json.dumps({k: st.get(k) for k in ("text", "bg", "fg", "font", "pw", "ph", "border", "eye", "glow")}, sort_keys=True)
            lid = "lbl_" + hashlib.sha1(key.encode()).hexdigest()[:10]; p = os.path.join(S.OUT, lid + ".png")
            if not os.path.exists(p):
                S.label(st["text"], st.get("bg", S.CREAM), st.get("fg", S.INK), st.get("font", "sans"), st.get("pw", 1024), st.get("ph", 256),
                        border=st.get("border"), eye=st.get("eye", True), glow=bool(st.get("glow"))).save(p)
            st["img"] = lid
        if "img" in st and not os.path.exists(os.path.join(S.OUT, st["img"] + ".png")):
            if st["img"] in S.FIXED: S.FIXED[st["img"]]().save(os.path.join(S.OUT, st["img"] + ".png"))
            else: sys.exit(f"{name}: no sticker {st['img']}")
    if not os.path.exists(os.path.join(ROOT, "work", "glb_pass", rc["src"] + ".glb")): print("NOSRC", name, rc["src"]); rc["skip"] = 1
R = {k: v for k, v in R.items() if not v.get("skip")}
tmp = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(R, tmp); tmp.close()
def run(name):
    cmd = [BL, "-b", "-P", os.path.join(HERE, "brand_pass.py"), "--", tmp.name, name] + (["--force"] if "--force" in argv else []) + (["--preview", prev] if prev else [])
    r = subprocess.run(cmd, capture_output=True, text=True)
    lines = [l for l in r.stdout.splitlines() if l.startswith(("BRAND", "HAVE", "  sticker"))]
    if not any(l.startswith(("BRAND", "HAVE")) for l in lines): lines.append(f"FAIL {name}: " + (r.stderr.strip().splitlines() or r.stdout.strip().splitlines() or ["?"])[-1][:200])
    return "\n".join(lines)
with cf.ThreadPoolExecutor(J) as ex:
    for out in ex.map(run, list(R)): print(out, flush=True)
os.unlink(tmp.name)
