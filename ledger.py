"""The Seed Ledger. Archives every completed Marble Run race and champion locally.

Two GETs per run (history + champions), well under Bryan's 30 per minute limit.
Run it every 30 minutes or so; /api/history keeps the newest 200 races, about 13 hours.
Writes ledger/races.json, ledger/champions.json, ledger/marbles.json (all time stats).
"""
import json, os, urllib.request

API = 'https://marblerun.fun'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'ledger')
UA = {'User-Agent': 'skelly-cup-ledger/0.1 (NEW YORKERS x Marble Run)'}

def get(path):
    with urllib.request.urlopen(urllib.request.Request(API + path, headers=UA), timeout=20) as r:
        return json.load(r)

def load(name, default):
    try:
        return json.load(open(os.path.join(OUT, name)))
    except FileNotFoundError:
        return default

def save(name, data):
    tmp = os.path.join(OUT, name + '.tmp')
    json.dump(data, open(tmp, 'w'), indent=1)
    os.replace(tmp, os.path.join(OUT, name))

def main():
    os.makedirs(OUT, exist_ok=True)
    races = {f"{r['tournamentId']}:{r['raceKey']}": r for r in load('races.json', [])}
    before = len(races)
    for r in get('/api/history?limit=200')['races']:
        races[f"{r['tournamentId']}:{r['raceKey']}"] = r
    ordered = sorted(races.values(), key=lambda r: (r['tournamentId'], r.get('scheduledStart') or 0))
    save('races.json', ordered)

    champs = get('/api/champions?limit=200')
    save('champions.json', champs)

    stats = {}
    for r in ordered:
        for x in r.get('results') or []:
            s = stats.setdefault(str(x['marbleId']), {'name': x['marbleName'], 'races': 0, 'wins': 0, 'podiums': 0, 'dnf': 0, 'titles': 0})
            s['races'] += 1
            s['wins'] += x['rank'] == 1
            s['podiums'] += x['rank'] <= 3
            s['dnf'] += x.get('timeSec') is None
    for c in champs.get('champions', []):
        s = stats.setdefault(str(c['champion_marble_id']), {'name': c['champion_name'], 'races': 0, 'wins': 0, 'podiums': 0, 'dnf': 0, 'titles': 0})
        s['titles'] += 1
    save('marbles.json', stats)

    seeds = sum(len(r.get('clientSeeds') or []) for r in ordered)
    print(f'{len(ordered)} races archived ({len(ordered) - before} new), {seeds} blown seeds, {len(champs.get("champions", []))} champions')

if __name__ == '__main__':
    main()
