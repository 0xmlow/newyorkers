"""The photoreal pass, two halves.
    python3 pr_pass.py upload slots.json      # slots.json: the flora_create_asset(sources=[...]) response; uploads DELIVERABLES/film/clean/segNN.mp4 in order, prints asset ids and urls
    python3 pr_pass.py fetch runs.json DIR    # runs.json: {"segNN": "https://...mp4", ...}; downloads into DIR/segNN.mp4
"""
import json, os, sys, subprocess, urllib.request
H = os.path.dirname(os.path.abspath(__file__)); CLEAN = os.path.join(H, '..', 'DELIVERABLES', 'film', 'clean')
if sys.argv[1] == 'upload':
    slots = json.load(open(sys.argv[2])); assets = slots.get('assets', slots); out = {}
    for a in assets:
        i = a.get('index', 0); f = os.path.join(CLEAN, 'seg%02d.mp4' % i)
        if not os.path.exists(f): print('missing', f); continue
        d = os.path.join(H, 'cache', 'slot%02d.json' % i); json.dump(a, open(d, 'w'))
        r = subprocess.run([sys.executable, os.path.join(H, 'flora_upload.py'), d, f], capture_output=True, text=True)
        print('seg%02d' % i, a['asset_id'], r.stdout.strip() or r.stderr.strip()[-120:]); out['seg%02d' % i] = {'asset_id': a['asset_id'], 'url': a['url']}
    json.dump(out, open(os.path.join(H, 'cache', 'pr_uploads.json'), 'w'), indent=1)
elif sys.argv[1] == 'fetch':
    runs = json.load(open(sys.argv[2])); D = sys.argv[3]; os.makedirs(D, exist_ok=True)
    for k, url in runs.items():
        p = os.path.join(D, k + '.mp4')
        if os.path.exists(p): continue
        urllib.request.urlretrieve(url, p); print(k, os.path.getsize(p) // 1024, 'KB', flush=True)
