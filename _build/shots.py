"""Stills of every scene, rendered headless at 2560x1440 from the tour rails. Writes DELIVERABLES/shots/."""
import base64, json, os, sys, time
from cdp import Page
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'DELIVERABLES', 'shots'); os.makedirs(OUT, exist_ok=True)
LIB = open(os.path.join(H, 'capture_lib.js')).read()
p = Page.open('http://127.0.0.1:4207/index.html?cap=1', 2560, 1440)
time.sleep(4); p.eval(LIB)
print('boot', p.eval('__cap.boot(2560,1440)'))
print('sculptures loaded', p.eval('__cap.loadAll()', timeout=900))
D = (2026, 10, 7)
# (file, tour index, position along the rail, local time, weather, prep js)
SHOTS = [
  ('01_arrivals', 0, 0.82, (*D, 17, 50), None, ''), ('02_great_wave', 1, 0.55, (*D, 17, 30), None, ''),
  ('03_floor_mountain', 2, 0.35, (*D, 16, 0), None, ''), ('04_sculpture_rows', 3, 0.5, (*D, 15, 30), None, ''),
  ('05_factory_seize', 4, 0.7, (*D, 11, 0), None, 'g.seize()'), ('06_brain', 5, 0.75, (*D, 13, 0), None, ''),
  ('07_lighthouse', 6, 0.55, (*D, 17, 55), None, ''), ('08_vault', 7, 0.7, (*D, 12, 0), None, 'g.openVault()'),
  ('09_open_metaverse_portal', 8, 0.6, (*D, 14, 30), None, ''), ('10_wagmi_wheel', 9, 0.6, (*D, 18, 25), None, ''),
  ('11_survive_bunker', 10, 0.35, (*D, 12, 30), None, ''), ('12_survive_row', 11, 0.5, (*D, 16, 30), None, ''),
  ('13_bank', 12, 0.6, (*D, 10, 30), None, ''), ('14_summer_jpg', 13, 0.5, (*D, 12, 0), None, ''),
  ('15_census_walk', 14, 0.4, (*D, 9, 30), None, ''), ('16_bodega', 15, 0.8, (*D, 15, 0), None, ''),
  ('17_gm_beach_dawn', 16, 0.5, (*D, 7, 0), None, ''), ('18_colossus', 18, 0.65, (*D, 17, 45), None, ''),
  ('19_aerial_golden', 19, 0.05, (*D, 17, 40), None, ''), ('20_aerial_night', 19, 0.45, (*D, 22, 0), None, ''),
  ('21_fireworks', 17, 0.6, (2026, 10, 31, 21, 30), None, 'g.FW.show = 30'), ('22_harbor_fog', 2, 0.1, (*D, 8, 30), 'HARBOR FOG', ''),
  ('23_rain', 12, 0.2, (*D, 14, 0), 'RAIN', ''), ('24_snow', 11, 0.5, (2026, 12, 20, 13, 0), 'SNOW', ''),
]
only = sys.argv[1:] or None
for f, i, u, when, wx, prep in SHOTS:
    if only and not any(o in f for o in only): continue
    t0 = time.time()
    p.eval(f'__cap.set({json.dumps(list(when))}, {json.dumps(wx)}, {json.dumps(prep)})')
    p.eval('__cap.railAt(%d, 0, 1); __cap.settle(150)' % i)  # sky and weather settle at the rail start
    if 'fireworks' in f: p.eval('__cap.settle(240)')
    p.eval('__cap.railAt(%d, %f)' % (i, u))
    d = p.eval('__cap.grab(0.92)')
    open(os.path.join(OUT, f + '.jpg'), 'wb').write(base64.b64decode(d.split(',', 1)[1]))
    print(f, round(time.time() - t0, 1), 's', flush=True)
p.close()
