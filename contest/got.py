"""got.py <kind> run:uuid ... : record finished outputs (media.flora.ai node-inputs uuid) and download them.
kind = contest (keys are marble ids via runs.json) or race (keys via ../races/inflight.json)."""
import json, sys, os, urllib.request
kind = sys.argv[1]; pairs = [a.split(':', 1) for a in sys.argv[2:]]
H = os.path.dirname(os.path.abspath(__file__))
if kind == 'contest':
    rmap = {v: k for k, v in json.load(open(os.path.join(H, 'runs.json'))).items()}; out = os.path.join(H, 'out'); store = os.path.join(H, 'got.json')
else:
    rmap = {v: k for k, v in json.load(open(os.path.join(H, '..', 'races', 'inflight.json'))).items()}; out = os.path.join(H, '..', 'races', 'out'); store = os.path.join(H, '..', 'races', 'got.json')
os.makedirs(out, exist_ok=True)
got = json.load(open(store)) if os.path.exists(store) else {}
for run, uid in pairs:
    run = run if run.startswith('run_') else 'run_' + run
    key = rmap.get(run)
    if key is None: print('unknown run', run); continue
    url = f'https://media.flora.ai/node-inputs/2026/10/9/anonymous/{uid}' + ('' if '.' in uid else '.png')
    fn = os.path.join(out, key.replace(':', '_') + '.jpg')
    if not os.path.exists(fn):
        try: data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()
        except Exception as e: print('FAILED', run, uid, e); continue
        open(fn, 'wb').write(data)
    got[key] = {'run': run, 'url': url}
json.dump(got, open(store, 'w'), indent=0); print(len(got), kind, 'outputs saved')
