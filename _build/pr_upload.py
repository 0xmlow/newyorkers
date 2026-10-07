"""Host clean segments publicly (Krea presigned upload) so FLORA can ingest them by URL. Appends to cache/pr_urls.json."""
import json, os, subprocess, sys
H = os.path.dirname(os.path.abspath(__file__)); DB = os.path.join(H, 'cache', 'pr_urls.json')
url, segs = sys.argv[1], sys.argv[2:]
db = json.load(open(DB)) if os.path.exists(DB) else {}
for s in segs:
    f = os.path.join(H, '..', 'DELIVERABLES', 'film', 'clean', f'seg{int(s):02d}.mp4')
    r = subprocess.run(['curl', '-s', '-X', 'POST', url, '-F', f'file=@{f}'], capture_output=True, text=True).stdout.strip()
    assert r.startswith('https://'), r; db[s] = r; print(s, r)
json.dump(db, open(DB, 'w'), indent=1)
