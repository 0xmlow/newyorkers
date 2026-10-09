"""Chosen Champion's Portraits -> the site build.

Reads portraits/portraits.json (one entry per tournament: which file was chosen and its title),
ledger/champions.json and cast.json. Writes, inside NEW YORKERS SITE:
  assets/skelly/champ-T<n>.jpg     1920 wide, the full view
  assets/skelly/champ-T<n>-t.jpg   640 wide, the card
  assets/skelly/og-T<n>.jpg        1200x630 share card
  _build/skelly/champions.json     what build_skelly.py renders
  _build/skelly/cast.json          the current casting
The 2560 masters stay here in portraits/. Web sizes only, the disk is nearly full.
"""
import json, os, shutil
from PIL import Image

H = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(H, '..', 'NEW YORKERS SITE')
ASSETS = os.path.join(SITE, 'assets', 'skelly'); DATA = os.path.join(SITE, '_build', 'skelly')
BORO = {"RED": "Brooklyn", "BLUE": "Manhattan", "YELLOW": "Queens", "GREEN": "Staten Island", "CREAM": "The Bronx"}

def save(im, path, w, h=None):
    im = im.convert('RGB')
    if h:  # cover crop to an exact box
        s = max(w / im.width, h / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        l, t = (im.width - w) // 2, (im.height - h) // 2; im = im.crop((l, t, l + w, t + h))
    else:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(path, 'JPEG', quality=84, optimize=True, progressive=True)

def main():
    os.makedirs(ASSETS, exist_ok=True); os.makedirs(DATA, exist_ok=True)
    chosen = json.load(open(os.path.join(H, 'portraits', 'portraits.json')))
    hist = {h['tournamentId']: h for h in json.load(open(os.path.join(H, 'ledger', 'champions.json')))['history']}
    cast = {c['marbleId']: c for c in json.load(open(os.path.join(H, 'cast.json')))['cast']}
    out = []
    for p in chosen:
        t = p['tournamentId']; h = hist[t]; r = cast[h['champion']['id']]
        im = Image.open(os.path.join(H, 'portraits', p['file']))
        save(im, os.path.join(ASSETS, f'champ-T{t}.jpg'), 1920)
        save(im, os.path.join(ASSETS, f'champ-T{t}-t.jpg'), 640)
        save(im, os.path.join(ASSETS, f'og-T{t}.jpg'), 1200, 630)
        out.append({'tournamentId': t, 'title': p['title'], 'marble': h['champion']['name'], 'marbleId': h['champion']['id'],
                    'borough': BORO.get(h['final'][0]['lane'], h['final'][0]['lane']), 'piece': r['piece'], 'rider': r['title'],
                    'seed': h['masterSeedHex'], 'image': f'assets/skelly/champ-T{t}.jpg', 'thumb': f'assets/skelly/champ-T{t}-t.jpg',
                    'og': f'assets/skelly/og-T{t}.jpg'})
    json.dump(out, open(os.path.join(DATA, 'champions.json'), 'w'), indent=1, ensure_ascii=False)
    shutil.copy(os.path.join(H, 'cast.json'), os.path.join(DATA, 'cast.json'))
    size = sum(os.path.getsize(os.path.join(ASSETS, f)) for f in os.listdir(ASSETS))
    print(f'{len(out)} portraits published, assets/skelly is {size / 1e6:.1f} MB')

if __name__ == '__main__':
    main()
