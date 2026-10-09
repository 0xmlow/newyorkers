"""One SKELLY CUP contestant piece per BrinkWorks holder: the person racing their own marble.

BrinkWorks pass #N holds Marble Run marble #N (MLow holds #044, Dimensional). For each marble we take its
best race from the ledger (a win if it has one, else its best finish), and that race's seed decides the
scene: where in the race's borough, what time, and what the holder is doing. The seed is recorded with the
piece. References: an existing NEW YORKERS honorary when the holder has one (keeps the approved likeness),
else their ENS or X avatar, else nothing but the marble's rider painting for the hand (an invented New Yorker
built from their name, as in waves 20 and 26). Always the rider's census painting as the style reference.

Writes contest/plan.json. Pure planning, spends nothing.
"""
import json, os, re

H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(H)
C = json.load(open(os.path.join(ROOT, 'holders', 'contestants.json')))
CAST = {c['marbleId']: c for c in json.load(open(os.path.join(ROOT, 'cast.json')))['cast']}
RACES = json.load(open(os.path.join(ROOT, 'ledger', 'races.json')))
HON = {p['id']: p for p in json.load(open(os.path.join(ROOT, '..', 'NEW YORKERS SITE', '_build', 'honoraries', 'honoraries.json')))['people']}
AV = os.path.join(ROOT, 'holders', 'avatars')

BORO = {'RED': 'Brooklyn', 'BLUE': 'Manhattan', 'YELLOW': 'Queens', 'GREEN': 'Staten Island', 'CREAM': 'The Bronx'}
COLOUR = {'RED': 'red', 'BLUE': 'sky blue', 'YELLOW': 'amber yellow', 'GREEN': 'green', 'CREAM': 'cream and pearl'}
LOC = {
    'Brooklyn': [('the Coney Island boardwalk', 'Coney Island'), ('the DUMBO cobblestones under the Manhattan Bridge', 'DUMBO'),
                 ('a Bed-Stuy brownstone block', 'Bed-Stuy'), ('the Prospect Park bandshell', 'Prospect Park'), ('a Williamsburg rooftop', 'Williamsburg')],
    'Manhattan': [('Times Square at three in the morning', 'Times Square'), ('a Chinatown alley on Doyers Street', 'Doyers Street'),
                  ('under the Washington Square arch', 'Washington Square'), ('a Harlem stoop on Strivers Row', 'Strivers Row'), ('the Fulton Street subway platform', 'Fulton Street')],
    'Queens': [('the Unisphere in Flushing Meadows', 'the Unisphere'), ('the elevated 7 train platform in Jackson Heights', 'Jackson Heights'),
               ('the Rockaway boardwalk', 'Rockaway'), ('Astoria Park under the Hell Gate Bridge', 'Astoria Park'), ('Main Street in Flushing', 'Flushing')],
    'Staten Island': [('the deck of the Staten Island Ferry', 'the Ferry'), ('the St. George terminal', 'St. George'),
                      ('the Fort Wadsworth overlook under the Verrazzano', 'Fort Wadsworth'), ('the gardens of Snug Harbor', 'Snug Harbor'), ('a Tottenville front yard', 'Tottenville')],
    'The Bronx': [('the gates of Yankee Stadium', 'Yankee Stadium'), ('the Arthur Avenue market', 'Arthur Avenue'),
                  ('the Grand Concourse', 'the Concourse'), ('Orchard Beach', 'Orchard Beach'), ('a Fordham Road corner', 'Fordham Road')],
}
TIME = ['at dawn', 'at golden hour', 'on a rainy night, every surface wet and shining', 'on a snowy night', 'at noon in a heat wave', 'at neon midnight']
ACT = [('flicks the colossal marble forward with one thumb like a skully cap', '{m}, Flicked Across {s}'), ('hoists the marble overhead in triumph', '{m} Held High at {s}'),
       ('kneels on the chalk beside the marble, one hand on the glass', 'Kneeling With {m} at {s}'), ('rides on top of the rolling marble, arms out', 'Riding {m} at {s}'),
       ('sprints alongside the marble as it rolls, mid stride', 'Chasing {m} Past {s}'), ('leans in and blows on the marble for luck', 'Blowing on {m} at {s}')]

def best_race(mid):
    rs = [(r, x) for r in RACES for x in (r.get('results') or []) if x['marbleId'] == mid]
    if not rs: return None, None
    rs.sort(key=lambda t: (t[1]['rank'], -(t[0]['tournamentId']), t[1].get('timeSec') or 999))
    return rs[0]

def slug(s): return re.sub(r'[^a-z0-9]+', '', s.lower()) or 'holder'

plan = []
for c in C:
    if c.get('status') == 'burned': continue
    mid = c['marbleId']; rider = CAST[mid]
    r, x = best_race(mid)
    seed = r['raceSeed'] if r else 0
    lane = x['lane'] if x else 'CREAM'
    boro = BORO.get(lane, 'Manhattan')
    loc, short = LOC[boro][seed % 5]; when = TIME[(seed // 5) % 6]; act, verb = ACT[(seed // 30) % 6]
    hon = HON.get(c.get('honoree') or '')
    if hon:
        ref = 'https://n3wyorkers.com/assets/honoraries/' + hon['works'][0]['s']; kind = 'honoree'
        who = f"the same person as in the first reference image, keeping their exact face, hair and likeness, dressed for the scene"
    elif os.path.exists(os.path.join(AV, f'{mid:03d}.jpg')):
        ref = c['avatar'] + ('?fallback=false' if 'unavatar' in c['avatar'] else ''); kind = 'avatar'
        who = "the character from the first reference image, their avatar come to life as a full New Yorker with the same face, colours, hat, glasses and signature details, a whole person with a body"
    else:
        ref = ''; kind = 'invented'
        who = (f"an invented New Yorker who embodies the name {c['name']}, a memorable character with a distinctive outfit and attitude"
               if not c['name'].startswith('Holder ') else "an anonymous New Yorker, an on chain ghost in a deep hooded jacket and mirrored glasses, face half in shadow, unmistakable swagger")
    result = (f"won {r['raceKey']} of tournament {r['tournamentId']}" if x and x['rank'] == 1 else f"finished {x['rank']} in {r['raceKey']} of tournament {r['tournamentId']}") if r else 'has not raced yet'
    prompt = (f"Paint in the exact painterly hand, palette and iridescent eye-flower motifs of the {'second' if ref else 'only'} reference image. "
              f"SKELLY CUP, a New York marble race. {who[0].upper() + who[1:]}, standing on the left third, mid thigh up, low camera. "
              f"Setting: {loc} {when}. The person {act}: a colossal glass marble swirled {COLOUR.get(lane, 'glass')}, taller than a person, glowing from within. "
              f"Five long chalk lanes in red, blue, yellow, green and cream run across the ground, the {COLOUR.get(lane, '')} lane brightest, bottle caps scattered on the chalk. "
              f"A crowd of New Yorkers cheering behind, eye-flowers blooming from the city and dripping paint, a blue evil eye charm somewhere in the scene. "
              f"Monumental, cinematic, joyful, a champion's moment. ABSOLUTELY NO letters, words, numbers, logos or writing anywhere in the image.")
    title = verb.format(m=c['marble'], s=short)
    plan.append(dict(marbleId=mid, marble=c['marble'], name=c['name'], handle=c.get('handle', ''), honoree=c.get('honoree', ''), kind=kind,
                     wallet=c['wallet'], ens=c.get('ens', ''), slug=slug(c['name']), title=title, borough=boro, lane=lane,
                     race=(dict(tournamentId=r['tournamentId'], raceKey=r['raceKey'], raceSeed=r['raceSeed'], trackSeed=r['trackSeed'], rank=x['rank']) if r else None),
                     result=result, refs=[u for u in (ref, rider['image']) if u], prompt=prompt))
json.dump(plan, open(os.path.join(H, 'plan.json'), 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print(len(plan), 'pieces', Counter(p['kind'] for p in plan), 'never raced:', sum(1 for p in plan if not p['race']))
