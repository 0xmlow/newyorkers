"""Holder snapshot for an Ethereum NFT contract, via Blockscout (no key).

  python3 snapshot_holders.py <contract> <label>
  python3 snapshot_holders.py 0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4 newyorkers

Writes snapshots/<label>_<YYYY-MM-DD>.json: one row per wallet with token count,
plus an even split of a token allocation if --alloc N is given. Read only.
The Brinkworks contract address is not known yet; get it from Bryan.
"""
import argparse, datetime, json, os, time, urllib.parse, urllib.request

BASE = 'https://eth.blockscout.com/api/v2'
UA = {'User-Agent': 'Mozilla/5.0 skelly-cup-snapshot/0.1'}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return json.load(r)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('contract'); ap.add_argument('label')
    ap.add_argument('--alloc', type=int, default=0, help='tokens to split across holders')
    ap.add_argument('--weighted', action='store_true', help='split by tokens held instead of evenly')
    ap.add_argument('--exclude', nargs='*', default=[], help='wallets to leave out (team, marketplaces)')
    a = ap.parse_args()

    meta = get(f'{BASE}/tokens/{a.contract}')
    rows, params = [], {}
    while True:
        q = ('?' + urllib.parse.urlencode(params)) if params else ''
        page = get(f'{BASE}/tokens/{a.contract}/holders{q}')
        for it in page.get('items', []):
            rows.append({'wallet': it['address']['hash'], 'ens': it['address'].get('ens_domain_name'), 'held': int(it['value'])})
        params = page.get('next_page_params')
        if not params:
            break
        time.sleep(0.5)

    skip = {w.lower() for w in a.exclude}
    rows = [r for r in rows if r['wallet'].lower() not in skip]
    rows.sort(key=lambda r: -r['held'])
    if a.alloc and rows:
        total = sum(r['held'] for r in rows)
        for r in rows:
            r['alloc'] = a.alloc * r['held'] // total if a.weighted else a.alloc // len(rows)

    os.makedirs('snapshots', exist_ok=True)
    day = datetime.date.today().isoformat()
    out = os.path.join('snapshots', f'{a.label}_{day}.json')
    json.dump({'contract': a.contract, 'name': meta.get('name'), 'totalSupply': meta.get('total_supply'),
               'takenAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'holders': len(rows), 'rows': rows},
              open(out, 'w'), indent=1)
    print(f"{meta.get('name')}: {len(rows)} holders, {sum(r['held'] for r in rows)} tokens -> {out}")

if __name__ == '__main__':
    main()
