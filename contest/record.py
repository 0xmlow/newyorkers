"""record.py "<marble ids comma list>" run_1 run_2 ...  -> runs.json + done.json (in flight counts as done for emit)."""
import json, sys
ms = [m for m in sys.argv[1].split(',')]; ids = sys.argv[2:]; assert len(ms) == len(ids), (len(ms), len(ids))
runs = json.load(open('runs.json')); d = json.load(open('done.json'))
for m, r in zip(ms, ids): runs[m] = r; d.setdefault(m, {'run': r})
json.dump(runs, open('runs.json', 'w'), indent=0); json.dump(d, open('done.json', 'w'), indent=0); print(len(runs), 'runs recorded')
