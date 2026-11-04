"""shots_d.py <out> [names]: the ten Impossible Rooms, each caught doing its thing, one browser per shot."""
import os, subprocess, sys, re
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.abspath(sys.argv[1]); os.makedirs(OUT, exist_ok=True)
ids = re.findall(r"\{ id: '(\w+)'", open(os.path.join(HERE, "src/rooms.js")).read()); X = {k: i * 20 for i, k in enumerate(ids)}
walk = "(()=>{let k=0;const P=window.__P,x0=P.x;const iv=setInterval(()=>{k++;P.x=x0+Math.sin(k*0.05)*5;P.z=2+Math.cos(k*0.037)*4.5;if(k>220)clearInterval(iv)},30);return true})()"
S = {"kusama_d": ("10,5.5,0,0.05", "new Promise(r=>setTimeout(()=>r(true),24000))"),
     "basquiat_d": ("10,1.0,0,0.08", ""), "haring_d": ("10,6.5,0,-0.45", walk), "hokusai_d": ("11.0,5.6,0,0.12", ""),
     "lichtenstein_d": ("10,6,0,0.1", ""), "dali_d": ("10,-4.5,0,0.05", ""), "warhol_d": ("10,3,0,0.05", ""),
     "vangogh_d": ("12,4,0.4,0.35", ""), "picasso_d": ("12.5,3.5,0.5,0.05", ""), "banksy_d": ("10,2,0,0.05", "")}
only = sys.argv[2].split(",") if len(sys.argv) > 2 else None
from PIL import Image
for n, (q, ev) in S.items():
    if only and n not in only: continue
    x, z, yaw, pit = q.split(","); cam = f"cam={X[n] + float(x):g},{z},{yaw},{pit}"
    js = f"new Promise(r => setTimeout(r, 4000)).then(() => Promise.resolve({ev or 'true'})).then(ok => new Promise(r => setTimeout(() => r(ok), 6000)))"
    r = subprocess.run([sys.executable, os.path.join(HERE, "shot.py"), OUT, f"{n}={cam}", "--http", "4391", "--port", "9501", "--wait", "14", "--eval", js], capture_output=True, text=True, timeout=200)
    errs = [l for l in r.stdout.splitlines() if l.startswith(("EXC", "error", "LOG"))]
    print(n, "ok" if not errs else errs[:4], flush=True)
    p = os.path.join(OUT, n + ".png")
    if os.path.exists(p) and os.path.getsize(p): Image.open(p).convert("RGB").resize((960, 540)).save(p[:-4] + ".jpg", quality=78); os.remove(p)
    else: print("blank", n)
