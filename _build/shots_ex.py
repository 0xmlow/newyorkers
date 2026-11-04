"""shots_ex.py <out>: each third pass exhibit, pressed where it has a button, one browser per shot."""
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.abspath(sys.argv[1]); os.makedirs(OUT, exist_ok=True)
S = [("machine", "cam=10,4.5,0,0.08", "__click('Restyle: Keith Haring')"), ("machine2", "cam=10,-1.0,3.14159,0.05", ""), ("kusama", "cam=71,0.6,-1.0,-0.15", ""), ("basquiat", "cam=133.5,-3.2,-0.45,0.05", ""), ("haring", "cam=190,5.5,0,0.1", "__click('Press play')"),
     ("hokusai", "cam=250,-3.7,0,-0.35", "__click('Pull the next block',4)"), ("lichtenstein", "cam=302,-3.9,1.5708,0", ""), ("dali", "cam=369.6,-2.65,-1.5708,0.05", ""),
     ("warhol", "cam=430,5.5,0,0.15", "__click('Play the Inevitable')"), ("vangogh", "cam=490,5.5,0,0.05", "__click('Lights down')"), ("picasso", "cam=550,-2.4,0,0", ""),
     ("banksy", "cam=603.7,4.6,3.14159,0", "__click('Confirm the sale')"), ("luna", "cam=630,6.6,0,0.08", "")]
only = sys.argv[2].split(",") if len(sys.argv) > 2 else None
from PIL import Image
for n, q, ev in S:
    if only and n not in only: continue
    js = f"new Promise(r => setTimeout(r, 4000)).then(() => {{ const ok = {('window.' + ev) if ev else 'true'}; return new Promise(r => setTimeout(() => r(ok), 5000)); }})"
    r = subprocess.run([sys.executable, os.path.join(HERE, "shot.py"), OUT, f"{n}={q}", "--http", "4391", "--port", "9501", "--wait", "14", "--eval", js], capture_output=True, text=True)
    errs = [l for l in r.stdout.splitlines() if l.startswith(("EXC", "error", "LOG"))]
    ev_ = [l for l in r.stdout.splitlines() if "eval:" in l]
    print(n, ev_[0].split("eval:")[1].strip() if ev_ else "", "ok" if not errs else errs[:4], flush=True)
    p = os.path.join(OUT, n + ".png")
    if os.path.exists(p) and os.path.getsize(p): Image.open(p).convert("RGB").resize((960, 540)).save(p[:-4] + ".jpg", quality=78); os.remove(p)
