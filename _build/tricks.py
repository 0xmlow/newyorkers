"""tricks.py <out>: one headless shot per room standing where its trick works (the viewpoint, the mark, the click),
so the trick is proved by a picture and not by the code. Three Chromes at a time, as check_all.py does."""
import os, subprocess, sys, concurrent.futures as cf
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.abspath(sys.argv[1]); os.makedirs(OUT, exist_ok=True)
# id: (stand x, z, look at x, z, pitch, wait ms, extra js run before waiting)
T = {
    'kusama_a': (13.6, -2.6, 13.6, -6, 0.15, 2500, ''), 'kusama_b': (4.6, 5.6, 12, -3, -0.03, 2500, ''),
    'basquiat_a': (17.2, 4.8, 7.2, -2.2, -0.22, 2500, ''), 'basquiat_b': (4.5, -1.6, 0.14, -1.6, 0.08, 4000, ''),
    'haring_a': (10, 2, 0.14, -3, 0.05, 6000, "__clickables.filter(m=>m.userData.hint==='Draw on the black paper').slice(0,2).forEach(m=>m.userData.click());"),
    'haring_b': (11.4, 2.2, 16.6, -2.0, 0.08, 2500, ''), 'hokusai_a': (13.6, 0.2, 10, -3.4, -0.05, 3000, ''),
    'hokusai_b': (10, -4.6, 10, -8, -0.25, 7000, ''), 'lichtenstein_a': (16.4, 6.4, 9, -2.5, 0.08, 2500, ''),
    'lichtenstein_b': (10, 1.0, 10, -8, 0.0, 3000, ''), 'dali_a': (10, -0.5, 10, -6, -0.05, 900, "__clickables.find(m=>m.userData.hint==='Push the tub').userData.click();"),
    'dali_b': (10, 1.2, 10, -3, -0.5, 2500, ''), 'warhol_a': (10, 2.6, 10, -7.4, 0.12, 4500, ''),
    'warhol_b': (10, 0.4, 10, -8, 0.05, 3000, ''), 'vangogh_a': (10, 2.0, 10, -8, 0.05, 5500, ''),
    'vangogh_b': (10, 3, 10, -8, 0.55, 7000, ''), 'picasso_a': (10, 1.6, 10, -8, 0.05, 3000, ''),
    'picasso_b': (4.2, 2.4, 10, -3.2, 0.12, 2500, ''), 'banksy_a': (16.2, -0.6, 11.4, -4.6, 0.05, 2500, ''),
    'banksy_b': (5, 2.4, 0.16, 2.0, 0.05, 3000, ''),
}
def js(i, v):
    x, z, tx, tz, p, ms, pre = v
    return (f"(async()=>{{const R=__ROOMS.find(r=>r.id==='{i}');const P=__P;const set=()=>{{P.x=R.x0+{x};P.z={z};P.yaw=Math.atan2(-({tx}-{x}),-({tz}-({z})));P.pitch={p};}};"
            f"for(let k=0;k<20;k++){{set();await new Promise(r=>setTimeout(r,50));}}{pre}const t0=performance.now();while(performance.now()-t0<{ms}){{set();await new Promise(r=>setTimeout(r,30));}}return 1}})()")
def go(k_i):
    k, i = k_i; w = k % 3
    r = subprocess.run([sys.executable, os.path.join(HERE, "shot.py"), OUT, f"{i}=room={i}", "--http", str(4380 + w), "--port", str(9490 + w), "--wait", "12", "--eval", js(i, T[i])], capture_output=True, text=True)
    p = os.path.join(OUT, i + ".png")
    if os.path.exists(p):
        from PIL import Image; Image.open(p).convert("RGB").resize((960, 540)).save(p[:-4] + ".jpg", quality=82); os.remove(p)
    return i, [l for l in r.stdout.splitlines() if l.startswith(("EXC", "error"))]
ids = sys.argv[2:] or list(T)
with cf.ThreadPoolExecutor(2) as ex:
    for i, errs in ex.map(go, enumerate(ids)): print(i, errs[:3] or "ok", flush=True)
