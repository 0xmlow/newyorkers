"""auto_got.py run:uuid.jpg ... : route each finished run to contest or race downloads via got.py's maps."""
import json, sys, os, subprocess
H = os.path.dirname(os.path.abspath(__file__))
C = set(json.load(open(os.path.join(H, 'runs.json'))).values())
R = set(json.load(open(os.path.join(H, '..', 'races', 'inflight.json'))).values())
c, r, u = [], [], []
for a in sys.argv[1:]:
    run = a.split(':')[0]; run = run if run.startswith('run_') else 'run_' + run
    (c if run in C else r if run in R else u).append(a)
if c: subprocess.run([sys.executable, os.path.join(H, 'got.py'), 'contest'] + c)
if r: subprocess.run([sys.executable, os.path.join(H, 'got.py'), 'race'] + r)
if u: print('unknown', u)
