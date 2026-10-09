"""Put the SKELLY CUP art on the site (MLow 2026-10-09).

THE RIDERS cards: every BrinkWorks holder's contest painting, found on the honoraries page by title, so the card
shows the same crop as the honoree card and links to h/<id>, where their other honoraries live.
THE TAPE: one painting per race, scaled to 960 wide into assets/skelly/races/.
Run after make_wave36.py, collect.py and honoraries/sync.py. Writes _build/skelly/holders.json and race_art.json.
"""
import json, os, re
from PIL import Image

H = os.path.dirname(os.path.abspath(__file__)); RUN = os.path.dirname(H); ROOT = os.path.dirname(RUN)
SITE = f"{ROOT}/NEW YORKERS SITE"
plan = json.load(open(f"{H}/plan.json"))
people = json.load(open(f"{SITE}/_build/honoraries/honoraries.json"))["people"]
by_title = {}
for e in people:
    for w in e["works"]:
        by_title.setdefault(w["title"], (e, w))


def race_line(r):
    rnd, i = r["raceKey"].split(":")
    what = {"heats": f"heat {int(i) + 1}", "semis": f"semi {int(i) + 1}", "final": "the final"}.get(rnd, r["raceKey"])
    return ("Won " if r["rank"] == 1 else f"Finished {r['rank']} in ") + f"{what}, tournament {r['tournamentId']}"


holders, miss = {}, []
for e in plan:
    hit = by_title.get(e["title"])
    if not hit:
        miss.append(e["marbleId"]); continue
    card, w = hit
    holders[e["marbleId"]] = dict(name=card["name"], id=card["id"], x=card.get("x", ""), s="assets/honoraries/" + w["s"],
                                  l="assets/honoraries/" + w["l"], t=e["title"], seed=e["race"]["raceSeed"], res=race_line(e["race"]),
                                  more=len(card["works"]) - 1, kind=e["kind"])
json.dump(holders, open(f"{SITE}/_build/skelly/holders.json", "w"), indent=0, ensure_ascii=False)
print(len(holders), "holder cards;", "not on the honoraries page yet:", miss)

rplan = {r["key"]: r for r in json.load(open(f"{RUN}/races/all.json"))}  # every finished race, not just the unpainted plan
OUT = f"{SITE}/assets/skelly/races"; os.makedirs(OUT, exist_ok=True)
art = []
for key, r in rplan.items():
    src = f"{RUN}/races/out/{key.replace(':', '_')}.jpg"
    if not os.path.exists(src) or not os.path.getsize(src):
        continue
    rnd, idx = r["raceKey"].split(":")
    f = f"T{r['tournamentId']}-{rnd}-{int(idx) + 1}.jpg"
    if not os.path.exists(f"{OUT}/{f}"):
        im = Image.open(src).convert("RGB"); im.thumbnail((960, 960), Image.LANCZOS)
        im.save(f"{OUT}/{f}", "JPEG", quality=76, optimize=True, progressive=True)
    art.append(dict(f="assets/skelly/races/" + f, t=r["tournamentId"], rnd=rnd, i=int(idx) + 1, title=r["title"], winner=r["winner"],
                    wid=r["winnerId"], lane=r["lane"], boro=r["borough"], seed=r["raceSeed"], time=r.get("timeSec"), finish=r["finish"]))
ORDER = {"final": 0, "semis": 1, "heats": 2}
art.sort(key=lambda a: (-a["t"], ORDER.get(a["rnd"], 3), a["i"]))
json.dump(art, open(f"{SITE}/_build/skelly/race_art.json", "w"), indent=0, ensure_ascii=False)
mb = sum(os.path.getsize(f"{OUT}/{x}") for x in os.listdir(OUT)) / 1e6
print(len(art), "race paintings,", f"{mb:.1f} MB")
