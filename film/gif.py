#!/usr/bin/env python3
"""gif.py: the mint GIF. A 6 s loop: sealed, smashed, the New Yorker and the fire, rewound back to sealed.
    python3 gif.py out.gif [census_no] [state]"""
import sys, os, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Rig, Writer
out = sys.argv[1]; no = int(sys.argv[2]) if len(sys.argv) > 2 else 1467; st = int(sys.argv[3]) if len(sys.argv) > 3 else 1
FPS, DUR, S = 20, 6.0, 1080
tmp = out + '.mp4'
g = Rig(size=(S, S))
cam = {'p': [0.55, 0.42, 6.3], 'l': [0, -0.32, 0.15], 'fov': 40}
g.ev(f"window.__cam={json.dumps(cam)}")
g.ev(f"window.__breakglass.film.prep({no},{st})")
import time
for _ in range(100):
    if g.ev("window.__breakglass.film.ready()"): break
    time.sleep(0.05)
w = Writer(tmp, (S, S), FPS, crf=14)
try:
    for f in range(int(DUR * FPS)):
        t = f / FPS
        if f == int(1.0 * FPS): g.ev("window.__breakglass.film.smash({x:0.05,y:0.06})")
        if f == int(4.15 * FPS): g.ev("window.__breakglass.film.rearm()")
        g.ev(f"window.__tick({1 / FPS})")
        w.write(g.grab())
finally:
    w.close(); g.close()
pal = out + '.pal.png'
for side, colors in ((720, int(os.environ.get("BG_GIF_COLORS", 192))),):   # v2 media used 144 to stay under the first GIF (12.51 MB)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-vf', f'scale={side}:{side}:flags=lanczos,palettegen=max_colors={colors}:stats_mode=full', pal], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-i', pal, '-lavfi', f'scale={side}:{side}:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle', '-loop', '0', out], check=True)
os.remove(pal)
print(out, round(os.path.getsize(out) / 1e6, 2), 'MB;', tmp)
