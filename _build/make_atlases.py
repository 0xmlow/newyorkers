"""Card atlases for MEME ISLAND: 527 Memes cards + NEW YORKERS crypto pieces + brand marks."""
import csv, json, os, re, sys
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'site', 'assets')
MEMES = os.path.expanduser('~/Documents/Claude/Projects/ARCHITECT/the-memes-6529')
NY = '/Users/degens/Desktop/NEW YORKERS BY MLOW/GO LIVE PACKAGE/site/assets'
TW, TH, AW, AH = 256, 384, 4096, 3840          # 16 x 10 = 160 cards per atlas
BG = (13, 13, 13)

def fit(im, w, h):
    im = im.convert('RGB'); im.thumbnail((w, h), Image.LANCZOS)
    return im

def pack(items, prefix, tw, th, cols, rows, aw, ah):
    """items: list of (id, PIL image). Returns {id: [atlas, u0, v0, u1, v1, aspect]}."""
    per = cols * rows; meta = {}
    for a in range((len(items) + per - 1) // per):
        sheet = Image.new('RGB', (aw, ah), BG)
        for i, (key, im) in enumerate(items[a * per:(a + 1) * per]):
            cx, cy = (i % cols) * tw, (i // cols) * th
            ox, oy = cx + (tw - im.width) // 2, cy + (th - im.height) // 2
            sheet.paste(im, (ox, oy))
            meta[key] = [a, round(ox / aw, 5), round(oy / ah, 5), round((ox + im.width) / aw, 5),
                         round((oy + im.height) / ah, 5), round(im.width / im.height, 4)]
        sheet.save(os.path.join(OUT, f'{prefix}{a}.jpg'), quality=80, optimize=True, progressive=True)
        print(prefix, a, os.path.getsize(os.path.join(OUT, f'{prefix}{a}.jpg')) // 1024, 'KB')
    return meta

# ---- The Memes
rows = list(csv.DictReader(open(os.path.join(MEMES, 'index.csv'))))
files = {int(f[:4]): f for f in os.listdir(os.path.join(MEMES, 'images')) if f[:4].isdigit()}
items, cards = [], []
for r in rows:
    n = int(r['card']); f = files.get(n)
    if not f: print('missing', n); continue
    try:
        im = Image.open(os.path.join(MEMES, 'images', f)); im.seek(0)
        im.draft('RGB', (TW * 2, TH * 2))
        items.append((n, fit(im, TW, TH)))
    except Exception as e:
        print('bad', n, e); continue
    cards.append({'n': n, 't': r['name'], 'a': r['artist'], 's': int(r['season'] or 0), 'm': r['meme_name'].strip(),
                  'sup': int(float(r['supply'] or 0)), 'fl': float(r['floor_price_eth'] or 0),
                  'hodl': float(r['hodl_rate'] or 0), 'anim': r['animation_format'], 'img': r['image_url'],
                  'd': re.sub(r'\s+', ' ', r['description'])[:260]})
meta = pack(items, 'memes', TW, TH, 16, 10, AW, AH)
for c in cards: c['uv'] = meta[c['n']]

# ---- NEW YORKERS
s = open(os.path.join(NY, 'data.js')).read()
P = json.loads(s[s.index('{'):s.rindex('}') + 1])['pieces']
kw = re.compile(r'\b(mint|minter|seed|wallet|chart|floor at|rug|gas|meme|crypto|bitcoin|bull|bear|token|ledger|pixel|degen|jpeg|hardware|key|whale)', re.I)
pick = [p for p in P if p.get('st') and (p['e'] in (18, 19) and p.get('f') in ('Degens', 'Hustlers', 'Builders', 'Underground', 'Villains')
        or (kw.search(p['t']) and p.get('f') in ('Degens', 'Hustlers')))]
seen, ny_items, ny = set(), [], []
for p in pick:
    f = os.path.join(NY, 't', p['st'][0] + '.jpg')
    if not os.path.exists(f) or p['t'] in seen: continue
    seen.add(p['t'])
    ny_items.append((p['n'], fit(Image.open(f), 320, 320)))
    ny.append({'n': p['n'], 't': p['t'], 'f': p.get('f'), 'e': p['e'], 'nb': p.get('nb') or p.get('b')})
    if len(ny) >= 144: break
meta = pack(ny_items, 'ny', 320, 320, 12, 12, 3840, 3840)
for c in ny: c['uv'] = meta[c['n']]
json.dump({'cards': cards, 'ny': ny}, open(os.path.join(OUT, 'data.json'), 'w'), separators=(',', ':'))
print(len(cards), 'cards', len(ny), 'new yorkers')
