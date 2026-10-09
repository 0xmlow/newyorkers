"""Which champions still need a portrait, and the brief to paint each one.

Run after ledger.py. Reads ledger/champions.json, cast.json and portraits/portraits.json
(the ones already painted), writes portraits/queue.json and prints it.

Every brief is the house recipe that painted tournaments 1 to 5 on 2026-10-08:
Seedream 5 Pro images-to-image on FLORA, 16:9 at 2k, ONE reference (the rider's own census
painting, re-hosted on media.flora.ai), rider mid thigh up on the left third, the champion
marble as a colossus in its lane colour, five chalk lanes on the ground, and the no lettering
line, which T1 and T3 needed on their second try. Run portraits through 00_TOOLS/textgate/gate
before anything ships.
"""
import json, os

H = os.path.dirname(os.path.abspath(__file__))
LANE = {"RED": ("red", "Brooklyn"), "BLUE": ("sky blue", "Manhattan"), "YELLOW": ("amber yellow", "Queens"),
        "GREEN": ("green", "Staten Island"), "CREAM": ("cream and pearl", "The Bronx")}
NO_TEXT = "ABSOLUTELY NO letters, words, numbers or writing anywhere in the image, no logos or brand marks."

def main():
    champs = json.load(open(os.path.join(H, 'ledger', 'champions.json')))['history']
    cast = {c['marbleId']: c for c in json.load(open(os.path.join(H, 'cast.json')))['cast']}
    done_path = os.path.join(H, 'portraits', 'portraits.json')
    done = {p['tournamentId'] for p in json.load(open(done_path))} if os.path.exists(done_path) else set()
    titles = {}
    queue = []
    for h in sorted(champs, key=lambda h: h['tournamentId']):
        mid = h['champion']['id']; titles[mid] = titles.get(mid, 0) + 1
        if h['tournamentId'] in done:
            continue
        r = cast[mid]; win = h['final'][0]; colour, boro = LANE.get(win['lane'], ('glass', win['lane']))
        nth = titles[mid]
        brief = (f"Paint a new scene in the exact painterly hand, palette and eye-flower motifs of the reference image, "
                 f"with the same character or place as the reference ({r['title']}). "
                 + (f"Title number {nth} for this marble. " if nth > 1 else "")
                 + f"Set in {boro}, low camera. The rider stands on the left third, mid thigh up, celebrating. "
                 f"A colossal glass marble swirled {colour}, taller than a person, sits in the world like a monument, the champion. "
                 f"Chalked on the ground: five straight chalk lanes in red, blue, yellow, green and cream, the {win['lane'].lower()} lane brightest. "
                 f"Eye-flowers bloom and drip, a blue evil eye somewhere in the scene. Monumental, cinematic, triumphant. {NO_TEXT}")
        queue.append({'tournamentId': h['tournamentId'], 'marble': h['champion']['name'], 'marbleId': mid, 'titleNumber': nth,
                      'lane': win['lane'], 'borough': boro, 'rider': r['piece'], 'riderTitle': r['title'], 'reference': r['image'],
                      'masterSeed': h['masterSeedHex'], 'model': 'is2i-gengateway-seedream-5-pro-is2i',
                      'params': {'aspect_ratio': '16:9', 'resolution': '2k'}, 'prompt': brief})
    json.dump(queue, open(os.path.join(H, 'portraits', 'queue.json'), 'w'), indent=1)
    print(f'{len(queue)} portrait(s) owed' + ''.join(f"\n  T{q['tournamentId']} {q['marble']} (rider {q['rider']})" for q in queue))

if __name__ == '__main__':
    main()
