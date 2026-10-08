"""Stills of every scene, rendered headless from the tour rails. Writes DELIVERABLES/shots/ and a contact sheet."""
import base64, json, os, sys, time
from cdp import Page
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'DELIVERABLES', 'shots'); os.makedirs(OUT, exist_ok=True)
LIB = open(os.path.join(H, 'capture_lib.js')).read()
W, HH = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1920, 1080)
p = Page.open('http://127.0.0.1:4208/index.html?cap=1', W, HH); time.sleep(4); p.eval(LIB)
print('boot', p.eval('__cap.boot(%d,%d)' % (W, HH))); print('models', p.eval('__cap.loadAll()', timeout=600))
p.eval('__cap.prep("g.W.freezer.open = true; g.W.freezerLight.intensity = 3;")')
SHOTS = [('01_stairs', 0, 0.7, ''), ('02_window_well', 1, 0.6, ''), ('03_tv_den', 2, 0.45, ''), ('04_wrong_room', 3, 0.7, ''), ('05_card_room', 4, 0.5, ''), ('06_laundry_penrose', 5, 0.95, ''), ('07_pc', 6, 0.7, ''),
         ('08_hallway', 7, 0.3, ''), ('09_bagel', 8, 0.45, ''), ('10_bagel_hole', 8, 0.98, ''), ('11_wave', 9, 0.6, ''), ('12_rat_court', 10, 0.5, 'g.state.idle = 8; g.step(1/60, 240)'), ('13_freezer', 11, 0.5, ''), ('14_dryer', 12, 0.9, '')]
only = sys.argv[3:] if len(sys.argv) > 3 else None
for f, i, u, prep in SHOTS:
    if only and not any(o in f for o in only): continue
    t0 = time.time(); p.eval('__cap.railAt(%d, 0); __cap.settle(30)' % i)
    if prep: p.eval('__cap.prep(%s)' % json.dumps(prep))
    p.eval('__cap.railAt(%d, %f)' % (i, u)); d = p.eval('__cap.grab(0.9)')
    open(os.path.join(OUT, f + '.jpg'), 'wb').write(base64.b64decode(d.split(',', 1)[1])); print(f, round(time.time() - t0, 1), 's', flush=True)
p.close()
from PIL import Image, ImageDraw
fs = sorted(x for x in os.listdir(OUT) if x.endswith('.jpg')); ims = [Image.open(os.path.join(OUT, x)) for x in fs]; cols = 4; w, h = 480, 270
S = Image.new('RGB', (cols * w, ((len(ims) + cols - 1) // cols) * (h + 20)), (13, 13, 13)); d = ImageDraw.Draw(S)
for k, (x, im) in enumerate(zip(fs, ims)): cx, cy = (k % cols) * w, (k // cols) * (h + 20); S.paste(im.resize((w, h)), (cx, cy + 20)); d.text((cx + 6, cy + 4), x[:-4], fill=(255, 107, 0))
S.save(os.path.join(H, 'cache', 'contact.jpg'), quality=85); print('contact', S.size)
