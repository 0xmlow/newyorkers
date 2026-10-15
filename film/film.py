#!/usr/bin/env python3
"""film.py: render the BREAK GLASS hype film picture, frame exact.  python3 film.py out.mp4 [draft]"""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Rig, Writer
HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'cues.json')))
out = sys.argv[1]; draft = len(sys.argv) > 2 and sys.argv[2] == 'draft'
t_end = float(sys.argv[3]) if len(sys.argv) > 3 else C['dur']
t_start_shot = 0.0
FPS = 30; size = (960, 540) if draft else (1920, 1080)
g = Rig(size=(1920, 1080))
if draft: g.send('Emulation.setDeviceMetricsOverride', width=1920, height=1080, deviceScaleFactor=0.5, mobile=False)
g.ev(f"window.__CUES={json.dumps(C)}")
g.ev(open(os.path.join(HERE, 'film.js')).read())
smashes = [p['t'] for p in C['pulls']] + [C['final']]
w = Writer(out, size, FPS, crf=18 if draft else 15)
log = []; t0 = time.time()
try:
    N = int(round(t_end * FPS))
    for f in range(N):
        t = f / FPS
        if any(t - 1 / FPS < s <= t + 1e-6 for s in smashes):
            for _ in range(200):
                if g.ev("window.__breakglass.film.ready()"): break
                time.sleep(0.05)
        st = g.ev(f"JSON.stringify(window.__frame({t}, {1 / FPS}))")
        img = g.grab()
        if img.shape[1] != size[0]: import cv2; img = cv2.resize(img, size, interpolation=cv2.INTER_AREA)
        w.write(img); log.append((f, st))
        if f % 60 == 0: print(f'{f}/{N}  {time.time() - t0:.0f}s  {st}', flush=True)
finally:
    w.close(); g.close()
    json.dump(log, open(out + '.log.json', 'w'))
    for l in dict.fromkeys(g.logs): print(l)
print('done', out, f'{time.time() - t0:.0f}s')
