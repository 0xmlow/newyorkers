"""_cast/picks.txt -> cast.json. Run from anywhere; then run build_riders.py."""
import json, os
H = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(H, '..', '..', 'NEW YORKERS SITE', 'api')
P = {x['n']: x for x in json.load(open(os.path.join(SITE, 'pieces.json')))}
M = json.load(open(os.path.join(SITE, 'minted.json'))); mi = M['census']; pool = set(map(int, M['pool']))
names = {m['id']: m['name'] for m in json.load(open(os.path.join(H, 'marbles_state.json')))['marbles']}
cast, seen = [], set()
for line in open(os.path.join(H, 'picks.txt')).read().strip().split('\n'):
    mid, n, why = line.split('|', 2); mid, n = int(mid), int(n); x = P[n]
    assert n not in seen, f'piece {n} cast twice'; seen.add(n)
    o = mi.get(str(n)) or {}
    cast.append({'marbleId': mid, 'marble': names[mid], 'piece': n, 'title': x['title'], 'borough': x['borough'], 'family': x['family'],
                 'era': x['era'], 'image': x['image'], 'url': x['url'], 'why': why, 'weak': 'WEAK' in why, 'minted': bool(o),
                 'holder': o.get('o'), 'holderX': o.get('x'), 'inRelease': n in pool})
assert len(cast) == 100 and len({c['marbleId'] for c in cast}) == 100, 'need exactly one rider per marble'
json.dump({'note': 'DRAFT casting for MLow to cut. One census piece per Marble Run marble.', 'cast': cast},
          open(os.path.join(H, '..', 'cast.json'), 'w'), indent=1, ensure_ascii=False)
print(len(cast), 'riders,', sum(c['minted'] for c in cast), 'with holders')
