"""Writes site/assets/art.json: the 24 works ChatGPT chose plus the ones added in the port, each with its room.
Reads NEW YORKERS SITE/assets/data.js for titles, stories and the image hash; copies the 1000 px thumbs (APFS clone)."""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "..", "site")
SRC = os.path.join(HERE, "..", "..", "NEW YORKERS SITE", "assets")
s = open(os.path.join(SRC, "data.js")).read(); d = json.loads(s[s.index("{"):s.rindex("}") + 1])
by = {p["n"]: p for p in d["pieces"]}
ROOMS = {
 # the working floor, before: artists, lofts, studios, openings
 "loft": [791, 888, 47, 5413, 39, 43, 819, 985, 577, 984, 3338, 5302,
          1408, 1401, 1255, 3640, 1865, 2275, 3170, 1022],
 # the sales suite: the discovery, the residences
 "sales": [785, 937, 1209, 4388, 42, 1432, 1732, 3184, 2666, 1740],
 # the holdouts: the art did not leave, it was moved
 "basement": [30, 830, 1321, 40, 864, 4865, 1955, 3430, 1635, 989, 3316, 2379,
              3885, 1075, 3935, 1540, 1749, 3348, 3426, 787],
 # common ground
 "roof": [4913, 805, 2162, 2142, 3820, 1777, 3943, 2990],
}
old = {a["number"]: a for a in json.load(open(os.path.join(SITE, "assets", "art.json")))}
out = []
for room, nums in ROOMS.items():
    for n in nums:
        p = by[n]; f = p["st"][0] + ".jpg"
        o = old.get(n)
        if o: f = o["file"]
        dst = os.path.join(SITE, "assets", f)
        if not os.path.exists(dst): subprocess.run(["cp", "-c", os.path.join(SRC, "t", f), dst], check=True)
        a = dict(o or {}); a.update(id=str(n), number=n, title=p["t"], story=p.get("story", ""), aspect=p.get("ar") or 1.776,
                                    file=f, room=room, place=p.get("nb") or p.get("b") or "")
        a.pop("source", None); out.append(a)
assert len({a["number"] for a in out}) == len(out)
json.dump(out, open(os.path.join(SITE, "assets", "art.json"), "w"), indent=1, ensure_ascii=False)
print(len(out), {r: len(v) for r, v in ROOMS.items()})

# collection.html: the plain index of every work, by room, for anyone who cannot or will not walk
from html import escape as E
NAMES = {"loft": "The working floor", "sales": "The sales suite", "basement": "The holdouts", "roof": "Common ground"}
head = open(os.path.join(SITE, "collection.html")).read(); head = head[:head.index("<a href=")]
body = ['<a href="./">Back to the museum</a><p>NEW YORKERS BY MLOW</p><h1>The people before the property.</h1>',
        f'<p>{len(out)} New Yorkers by MLow. No piece disappears from this list, whatever happens upstairs.</p>']
for room in ROOMS:
    body.append(f'<h3>{E(NAMES[room])}</h3><main>')
    for a in out:
        if a["room"] == room:
            body.append(f'<article><img loading="lazy" src="assets/{a["file"]}" alt="{E(a["title"])}" width="1000" height="563"><p>NEW YORKERS No. {a["number"]}'
                        f'{" · " + E(a["place"]) if a["place"] else ""}</p><h2><a href="/n/{a["number"]}" target="_top">{E(a["title"])}</a></h2><p>{E(a["story"])}</p></article>')
    body.append('</main>')
body.append('<footer><a href="credits.html">Credits</a></footer>')
head = head.replace("img{width:100%;height:auto}", "img{width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}h3{font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:56px 0 20px}")
open(os.path.join(SITE, "collection.html"), "w").write(head + "".join(body))
