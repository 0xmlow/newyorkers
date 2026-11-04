"""shots_c.py <out>: the ten SHOW halls, one browser at a time (the disk is short): the entrance view and a view back at the vault."""
import os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.abspath(sys.argv[1]); os.makedirs(OUT, exist_ok=True)
ids = re.findall(r"\{ id: '(\w+)'", open(os.path.join(HERE, "src", "rooms.js")).read())
only = sys.argv[2].split(",") if len(sys.argv) > 2 else None
for i, rid in enumerate(ids):
    if not rid.endswith("_c") or (only and rid not in only): continue
    x0 = i * 20
    shots = [f"{rid}=cam={x0 + 10},6.6,0,-0.02", f"{rid}_v=cam={x0 + 10},1.2,3.14159,0.05", f"{rid}_w=cam={x0 + 3.2},-2.6,1.2,0"]
    errs = []   # one browser per shot: a second load in the same headless browser comes back blank on this machine
    for s in shots:
        r = subprocess.run([sys.executable, os.path.join(HERE, "shot.py"), OUT, s, "--http", "4391", "--port", "9501", "--wait", "16"], capture_output=True, text=True)
        errs += [l for l in r.stdout.splitlines() if l.startswith(("EXC", "error", "LOG"))]
    print(rid, "ok" if not errs else errs[:5], flush=True)
    from PIL import Image
    for s in shots:
        n = s.split("=")[0]; p = os.path.join(OUT, n + ".png")
        if os.path.exists(p) and os.path.getsize(p): Image.open(p).convert("RGB").resize((960, 540)).save(p[:-4] + ".jpg", quality=78); os.remove(p)
