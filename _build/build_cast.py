#!/usr/bin/env python3
"""Build assets/cast.json: the whole census, small enough to hold in a page.

data.js is 5 MB because it carries every prompt and every story. The homepage
and the flywheel only need enough to show a face, name it and link to it, so
this writes the same 7,541 people at about a twelfth of the size. The story
is deliberately left out: it is the single largest field and the record page
already tells it. Rerun whenever data.js is rebuilt.
"""
import json, os, re, collections

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
DATA = os.path.join(SITE, 'assets', 'data.js')
OUT = os.path.join(SITE, 'assets', 'cast.json')

# data.js carries free text in the borough field: "Manhattan (Harlem)", "NYC",
# "Bronx / Queens", "Baltimore (archetype)". The flywheel sorts people into the
# five boroughs, so fold the variants down and let everything else be citywide.
BOROUGHS = ('Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island')
def borough(raw):
    v = (raw or '').strip()
    if not v:
        return ''
    head = re.split(r'\s*[/(]', v)[0].strip()
    for b in BOROUGHS:
        if head == b:
            return b
    hits = [b for b in BOROUGHS if b in v]
    return hits[0] if len(hits) == 1 else ''

s = open(DATA).read()
D, _ = json.JSONDecoder().raw_decode(s[s.index('{'):])

rows, skipped = [], 0
for x in D['pieces']:
    st = x.get('st') or []
    if not x.get('n') or not st:
        skipped += 1
        continue
    rows.append([x['n'], x['t'], st[0], x.get('f') or '',
                 borough(x.get('b')), x.get('e') or 0, x.get('loc') or ''])

rows.sort(key=lambda r: r[0])
payload = {
    'fields': ['n', 'title', 'thumb', 'family', 'borough', 'era', 'place'],
    'count': len(rows),
    'cast': rows,
}
with open(OUT, 'w') as f:
    json.dump(payload, f, separators=(',', ':'), ensure_ascii=False)

print(f"cast.json  {len(rows)} people, {os.path.getsize(OUT)/1024:.0f} KB, {skipped} skipped")
print(f"  families {dict(collections.Counter(r[3] for r in rows).most_common())}")
print(f"  boroughs {dict(collections.Counter(r[4] or 'citywide' for r in rows).most_common())}")
