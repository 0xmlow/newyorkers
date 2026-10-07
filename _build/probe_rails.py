import json, os, time, sys
from cdp import Page
H = os.path.dirname(os.path.abspath(__file__))
p = Page.open('http://127.0.0.1:4207/index.html?film=1', 960, 540); time.sleep(4)
p.eval(open(os.path.join(H, 'capture_lib.js')).read()); p.eval('__cap.boot(960,540)'); print('sculptures', p.eval('__cap.loadAll()', timeout=900))
p.eval(open(os.path.join(H, 'probe_rails.js')).read())
idx = list(range(20)) if len(sys.argv) < 2 else [int(a) for a in sys.argv[1:]]
for i in idx:
    t0 = time.time(); r = p.eval(f'__probeRails([{i}])', timeout=900)
    for k, v in r.items(): print(i, k, f'{time.time()-t0:.0f}s', json.dumps(v), flush=True)
p.close()
