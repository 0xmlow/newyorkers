import json, os, sys, time
from cdp import Page
H = os.path.dirname(os.path.abspath(__file__))
p = Page.open('http://127.0.0.1:4207/index.html?film=1', 960, 540); time.sleep(4)
p.eval(open(os.path.join(H, 'capture_lib.js')).read()); p.eval('__cap.boot(960,540)'); print('sculptures', p.eval('__cap.loadAll()', timeout=900), flush=True)
p.eval(open(os.path.join(H, 'probe_near.js')).read())
for i in [int(a) for a in sys.argv[1:]]:
    r = p.eval(f'__probeNear({i})', timeout=900); print(i, len(r)); [print('  ', x) for x in r[:40]]
    sys.stdout.flush()
p.close()
