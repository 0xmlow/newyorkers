"""check_all.py <out_dir>: every set rendered on its own in headless Chrome (a fresh browser per set, since one
browser fails shader validation after about ten set loads), three at a time. Writes <out>/<id>.jpg and prints each
set's console errors. Round twelve's final check."""
import json, os, re, subprocess, sys, concurrent.futures as cf
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.abspath(sys.argv[1]); os.makedirs(OUT, exist_ok=True)
ids = re.findall(r"[{,] id: '(\w+)'", open(os.path.join(HERE, "src", "rooms.js")).read())
def go(k_id):
    k, i = k_id; w = k % 3
    r = subprocess.run([sys.executable, os.path.join(HERE, "shot.py"), OUT, f"{i}=room={i}", "--http", str(4270 + w), "--port", str(9380 + w), "--wait", "15"], capture_output=True, text=True)
    errs = [l for l in r.stdout.splitlines() if l.startswith(("EXC", "error", "LOG"))]
    p = os.path.join(OUT, i + ".png")
    if os.path.exists(p):
        from PIL import Image; Image.open(p).convert("RGB").resize((960, 540)).save(p[:-4] + ".jpg", quality=80); os.remove(p)
    else: errs.append("NO SHOT")
    return i, errs
bad = 0
with cf.ThreadPoolExecutor(3) as ex:
    for i, errs in ex.map(go, enumerate(ids)):
        print(i, "ok" if not errs else errs[:4], flush=True); bad += bool(errs)
print(f"{len(ids)} sets, {bad} with errors")
