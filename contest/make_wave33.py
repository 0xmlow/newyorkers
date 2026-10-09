"""Wave 33, SKELLY CUP: every BrinkWorks holder's contest painting as an honorary (MLow 2026-10-09).

Holders with no honorary become new honorees (category C, factual bio from the race ledger). The 13 who already
have one get the contest painting added to their existing card, behind their portrait (kind "skelly").
Heroes are hard links to contest/out (JPEG bytes under a .png name, like the masters), so the wave costs no disk.
Writes HONORARY PFPS 2026-09-14/WAVE 33 2026-10-09 SKELLY CUP/ and site_entries.json, plus the roles and bios
for the new people in NEW YORKERS SITE/_build/honoraries. Run collect.py, sync.py, build_honoraries.py after.
"""
import json, os, re

H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(H))
W = f"{ROOT}/HONORARY PFPS 2026-09-14/WAVE 33 2026-10-09 SKELLY CUP"
HON = f"{ROOT}/NEW YORKERS SITE/_build/honoraries"
plan = json.load(open(f"{H}/plan.json"))
status = {c["marbleId"]: c["status"] for c in json.load(open(f"{H}/../holders/contestants.json"))}
cards = {e["id"]: e for e in json.load(open(f"{HON}/honoraries.json"))["people"]}
roles = json.load(open(f"{HON}/roles.json")); bios = json.load(open(f"{HON}/bios.json"))
norm = lambda n: re.sub(r"[^a-z0-9]+", "", n.lower())


def race_line(e):
    r = e["race"]; rnd, i = r["raceKey"].split(":")
    what = {"heats": f"heat {int(i) + 1}", "semis": f"semi {int(i) + 1}", "final": "the final"}.get(rnd, r["raceKey"])
    verb = "Won" if r["rank"] == 1 else f"Finished {r['rank']} in"
    return f"{verb} {what} of tournament {r['tournamentId']}, race seed {r['raceSeed']}"


os.makedirs(W, exist_ok=True)
entries, new = {}, 0
for e in plan:
    m = e["marbleId"]; src = f"{H}/out/{m}.jpg"
    if not os.path.exists(src):
        print("not painted yet:", m, e["name"]); continue
    if e["honoree"]:
        name = cards[e["honoree"]]["name"]; handle = ""  # the existing card keeps its own handle
    elif status[m] == "anon":
        name = f"Patron #{m:03d}"; handle = ""
    else:
        name = e["name"]; handle = "@" + e["handle"] if e["handle"] else ""
    setting = re.search(r"Setting: (.*?)\.", e["prompt"]).group(1)
    setting = setting[0].lower() + setting[1:]
    bio = (f"Holds BrinkWorks pass #{m:03d}, so marble {m}, {e['marble']}, races in Bryan Brinkman's Marble Run under that wallet. "
           f"{race_line(e)}, painted for the SKELLY CUP at {setting}")
    d = f"{W}/{e['slug']}"; os.makedirs(d, exist_ok=True)
    hero = f"{d}/{e['title'].replace('/', ' ')}, for {name}.png"
    for f in os.listdir(d):  # a refire replaces the old link
        if f.endswith(".png") and f != os.path.basename(hero): os.remove(f"{d}/{f}")
    if os.path.exists(hero) and os.stat(hero).st_ino != os.stat(src).st_ino: os.remove(hero)  # source was refetched
    if not os.path.exists(hero): os.link(src, hero)
    entries[e["slug"]] = [name, handle, "C", e["title"], bio, m, e["honoree"]]
    if not e["honoree"]:
        roles.setdefault(name.lower(), "C")
        bios.setdefault(norm(name), bio); new += 1
# keys the collector gives the 13 existing honorees' second painting ("name|33" or a bare key): same category as the card
MAN = f"{ROOT}/HONORARIES HYPE FILM 2026-09-26/_work/manifest.json"
if os.path.exists(MAN):
    man = json.load(open(MAN)); cat = {}
    for p in man:
        if p["wave"] != 33 and p["key"] in roles: cat.setdefault(norm(p["disp"]), roles[p["key"]])
    for p in man:
        if p["wave"] == 33 and p["key"] not in roles and norm(p["disp"]) in cat: roles[p["key"]] = cat[norm(p["disp"])]
json.dump(entries, open(f"{W}/site_entries.json", "w"), indent=1, ensure_ascii=False)
json.dump(roles, open(f"{HON}/roles.json", "w"), indent=1, ensure_ascii=False)
json.dump(bios, open(f"{HON}/bios.json", "w"), indent=1, ensure_ascii=False)
print(len(entries), "paintings;", new, "new honorees;", len(entries) - new, "added to existing cards")
