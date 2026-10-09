"""One painting per Marble Run race: the winner's rider taking the race, scene chosen by the race seed.

MLow chose the cheap per-winner route (2026-10-09): Seedream 5.0 Lite images-to-image at 2k, about $0.04,
one reference, the winning marble's census rider. The race seed picks the place in the winner's borough lane,
the time and the moment; the round sets the scale (heats are street scenes, semis bigger, finals monumental).
Writes races/plan.json with every race in the ledger that has no painting yet (races/done.json).
"""
# 2026-10-09: MLow abolished the text rule; painted signage (Yankee Stadium, Domino, Cyclone) stays. Real places on purpose.
import json, os

H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(H)
CAST = {c['marbleId']: c for c in json.load(open(os.path.join(ROOT, 'cast.json')))['cast']}
RACES = json.load(open(os.path.join(ROOT, 'ledger', 'races.json')))
DONE = json.load(open(os.path.join(H, 'done.json'))) if os.path.exists(os.path.join(H, 'done.json')) else {}

BORO = {'RED': 'Brooklyn', 'BLUE': 'Manhattan', 'YELLOW': 'Queens', 'GREEN': 'Staten Island', 'CREAM': 'The Bronx'}
COLOUR = {'RED': 'red', 'BLUE': 'sky blue', 'YELLOW': 'amber yellow', 'GREEN': 'green', 'CREAM': 'cream and pearl'}
PLACES = {
    'Brooklyn': ['a Coney Island side street under the Cyclone', 'a Crown Heights stoop block', 'the Williamsburg waterfront at the old Domino sugar refinery',
                 'a Bushwick graffiti wall', 'the Brighton Beach boardwalk', 'Atlantic Avenue at a bodega corner'],
    'Manhattan': ['a Lower East Side tenement block', 'the subway stairs at Union Square', 'a Midtown avenue between towers', 'Canal Street',
                  'a Harlem street outside a barber shop', 'the High Line'],
    'Queens': ['a Jackson Heights street under the 7 train', 'the Rockaway beach at low tide', 'an Astoria diner corner', 'Flushing Meadows by the Unisphere',
               'a Sunnyside rooftop', 'a Corona street with fruit carts'],
    'Staten Island': ['the ferry deck at St. George', 'a quiet Staten Island cul de sac', 'the Verrazzano shoreline', 'a pizzeria parking lot on Hylan Boulevard',
                      'the boardwalk at South Beach', 'the old Snug Harbor courtyard'],
    'The Bronx': ['the Grand Concourse', 'a stickball street in the South Bronx', 'Arthur Avenue', 'the steps outside Yankee Stadium',
                  'City Island docks', 'a Mott Haven rooftop'],
}
TIME = ['at dawn', 'at golden hour', 'on a rainy night', 'on a snowy evening', 'at noon in summer', 'at neon midnight', 'in morning fog', 'under a full moon']
MOMENT = ['the rider punches the air as the marble crosses a chalk finish line', 'the rider carries the marble on one shoulder like a trophy',
          'the rider is lifted by the crowd beside the marble', 'the rider stands calm with one hand on the marble while confetti falls',
          'the rider sprays a bottle of seltzer over the marble in celebration', 'the rider kneels and kisses the glass of the marble']
SCALE = {'heats': 'a lively street scene', 'semis': 'a big night, crowds packed along the block', 'final': 'monumental, the whole city watching, a champion crowned'}

plan = []
for r in RACES:
    key = f"{r['tournamentId']}:{r['raceKey']}"
    if key in DONE or not r.get('results'): continue
    w = r['results'][0]; rider = CAST[w['marbleId']]; seed = r['raceSeed']
    boro = BORO.get(w['lane'], 'Manhattan')
    place = PLACES[boro][seed % 6]; when = TIME[(seed // 6) % 8]; moment = MOMENT[(seed // 48) % 6]
    rnd = r['roundKey']
    prompt = (f"Same painterly hand, palette, main character and eye-flower motifs as the reference image; that character just won a New York marble race. {place[0].upper() + place[1:]} {when}, {SCALE.get(rnd, SCALE['heats'])}. "
              f"{moment[0].upper() + moment[1:]}: a big glass marble swirled {COLOUR.get(w['lane'], 'glass')}, as tall as a person. "
              f"Five chalk lanes in red, blue, yellow, green and cream across the ground, the {COLOUR.get(w['lane'], '')} lane brightest, bottle caps on the chalk, "
              f"eye-flowers dripping paint. NO letters, words, numbers, logos or writing anywhere.")
    label = {'heats': 'Heat', 'semis': 'Semi', 'final': 'The Final'}.get(rnd, rnd)
    title = f"{w['marbleName']} Takes {label}{'' if rnd == 'final' else ' ' + str(r['indexInRound'] + 1)}, Tournament {r['tournamentId']}"
    plan.append(dict(key=key, tournamentId=r['tournamentId'], raceKey=r['raceKey'], raceSeed=seed, trackSeed=r['trackSeed'], winner=w['marbleName'],
                     winnerId=w['marbleId'], lane=w['lane'], borough=boro, timeSec=w.get('timeSec'), finish=[x['marbleName'] for x in r['results']],
                     rider=rider['piece'], riderTitle=rider['title'], ref=rider['image'], title=title, prompt=prompt))
json.dump(plan, open(os.path.join(H, 'plan.json'), 'w'), indent=1, ensure_ascii=False)
print(len(plan), 'races to paint; about $%.2f at $0.042' % (len(plan) * 0.042))
