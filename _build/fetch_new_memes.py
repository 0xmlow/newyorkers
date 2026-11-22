"""The Memes minted after the 527 card snapshot: fetch from the 6529 API, atlas into site/assets/memes4.jpg
(atlas slot 5 in the island, after memes0-3 and ny0), and add them to data.json as 'fresh'. Rerun to refresh."""
import json, os, re, urllib.request, io
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'site', 'assets'); C = os.path.join(H, 'cache', 'new_memes'); os.makedirs(C, exist_ok=True)
API = 'https://api.6529.io/api/nfts?contract=0x33FD426905F149f8376e227d0C9D3340AaD17aF1&page_size=100&sort_direction=DESC'
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'meme-island-builder'}), timeout=30).read()
rows = [r for r in json.loads(get(API))['data'] if r['id'] > 527]; rows.sort(key=lambda r: r['id'])
TW, TH, AW, AH, COLS = 256, 384, 4096, 3840, 16
sheet = Image.new('RGB', (AW, AH), (13, 13, 13)); fresh = []
for i, r in enumerate(rows):
    f = os.path.join(C, f"{r['id']}.jpg")
    if not os.path.exists(f):
        try: im = Image.open(io.BytesIO(get(r['thumbnail']))); im.seek(0); im.convert('RGB').save(f, quality=90)
        except Exception as e: print('skip', r['id'], e); continue
    im = Image.open(f).convert('RGB'); im.thumbnail((TW, TH), Image.LANCZOS)
    cx, cy = (i % COLS) * TW, (i // COLS) * TH; ox, oy = cx + (TW - im.width) // 2, cy + (TH - im.height) // 2; sheet.paste(im, (ox, oy))
    md = r.get('metadata') or {}; attrs = {a.get('trait_type'): a.get('value') for a in (md.get('attributes') or []) if isinstance(a, dict)}
    fresh.append({'n': r['id'], 't': r['name'], 'a': r.get('artist_seize_handle') or r.get('artist') or '', 'art': r.get('artist') or '', 's': int(attrs.get('Type - Season') or attrs.get('Season') or 0) if str(attrs.get('Type - Season') or attrs.get('Season') or '0').isdigit() else 0,
                  'm': str(attrs.get('Meme Name') or ''), 'sup': r.get('supply') or 0, 'fl': r.get('floor_price') or 0, 'anim': '', 'img': r.get('image'), 'mint': (r.get('mint_date') or '')[:10],
                  'd': re.sub(r'\s+', ' ', r.get('description') or '')[:260], 'uv': [5, round(ox / AW, 5), round(oy / AH, 5), round((ox + im.width) / AW, 5), round((oy + im.height) / AH, 5), round(im.width / im.height, 4)]})
sheet.save(os.path.join(OUT, 'memes4.jpg'), quality=80, optimize=True, progressive=True)
p = os.path.join(OUT, 'data.json'); d = json.load(open(p)); d['fresh'] = fresh; json.dump(d, open(p, 'w'), separators=(',', ':'))
print(len(fresh), 'fresh cards', fresh[0]['n'] if fresh else '', '..', fresh[-1]['n'] if fresh else '', os.path.getsize(os.path.join(OUT, 'memes4.jpg')) // 1024, 'KB')
