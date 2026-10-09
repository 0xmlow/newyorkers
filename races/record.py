import json, sys, os
keys = open('next_keys.txt').read().split(','); ids = sys.argv[1:]; assert len(keys) == len(ids), (len(keys), len(ids))
d = json.load(open('inflight.json')) if os.path.exists('inflight.json') else {}
for k, r in zip(keys, ids): d[k] = r
json.dump(d, open('inflight.json', 'w'), indent=0); print(len(d), 'race runs recorded')
