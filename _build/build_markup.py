#!/usr/bin/env python3
"""markup.html: "Mark up a New Yorker". Pick any piece in the census, draw over it with thirteen brushes in
NYC moods and the subway line colours, sign it with an X handle, save it as a PNG with the N3W YORKERS and
MLOW marks on the strip under the art, post it on X.

The tool is edited in its own repository, MARKUP/markup (pushed to github.com/0xmlow/newyorkers on the
mark-up branch), the same way MOSH LAB is. Its app/ folder is plain HTML, CSS and JavaScript with no build
step, and app/index.html runs on its own against n3wyorkers.com. This script:

  copies app/markup.js, markup.css and logos.js into assets/markup/ with a version on each reference,
  lifts the page body out of app/index.html (between the MARKUP BODY markers) into _build/markup/body.html,
  writes the data the tool reads at runtime, both public so the standalone copy can read them too:
    assets/markup/idx.js      one row per piece [id, n, title, thumb, era], about 530 KB
    assets/markup/cards.json  the museum's sourced room lines from api/rooms.json, each fronted by the lead
                              New Yorker assign_hang.mjs gave that room (so it runs after the hang)
  and writes the page inside the site shell.

If the MARKUP repository is not on this machine the last copy in assets/markup/ and _build/markup/body.html
stands, so the site still builds anywhere. The drawing engine is ported from MLow's moodroom
(github.com/0xmlow/moodroom, 2026-04-05). Deep links: markup.html#n=<id>, the id census.html#n= takes.
"""
import hashlib, json, os, random, re, shutil, subprocess
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
URL = cfg()["siteUrl"]
REPO = os.path.join(os.path.dirname(SITE), "MARKUP", "markup")
SRC = os.path.join(REPO, "app")
DST = os.path.join(SITE, "assets", "markup")
BODY = os.path.join(HERE, "markup", "body.html")
FILES = ("markup.js", "markup.css", "logos.js")
os.makedirs(DST, exist_ok=True); os.makedirs(os.path.dirname(BODY), exist_ok=True)

# ---------- the tool, from its repository ----------
commit = ""
if os.path.isdir(SRC):
    for f in FILES:
        shutil.copy2(os.path.join(SRC, f), os.path.join(DST, f))
    page_src = open(os.path.join(SRC, "index.html"), encoding="utf-8").read()
    m = re.search(r"<!-- MARKUP BODY START[^>]*-->\n(.*?)<!-- MARKUP BODY END -->", page_src, re.S)
    if not m: raise SystemExit("markup: the MARKUP BODY markers are missing from app/index.html")
    open(BODY, "w", encoding="utf-8").write(m.group(1))
    commit = subprocess.run(["git", "-C", REPO, "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
    if subprocess.run(["git", "-C", REPO, "status", "--porcelain", "app"], capture_output=True, text=True).stdout.strip():
        print("  markup: NOTE app/ has uncommitted changes; the site gets them, the mark-up branch does not yet")
else:
    print("  markup: MARKUP/markup not found, the last copy in assets/markup stands")
for f in FILES:
    if not os.path.exists(os.path.join(DST, f)): raise SystemExit(f"markup: assets/markup/{f} missing")
ver = {f: hashlib.sha256(open(os.path.join(DST, f), "rb").read()).hexdigest()[:10] for f in FILES}
body = open(BODY, encoding="utf-8").read()

# ---------- the data ----------
data = json.loads(open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read().split("=", 1)[1].strip().rstrip(";"))
P = data["pieces"]
by_n = {p["n"]: p for p in P}
idx = [[p["id"], p["n"], p["t"], p["st"][0], p["e"]] for p in P if p.get("st")]
idx_js = "window.MK_IDX=" + json.dumps(idx, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(os.path.join(DST, "idx.js"), "w", encoding="utf-8").write(idx_js)
ver["idx.js"] = hashlib.sha256(idx_js.encode()).hexdigest()[:10]

rooms = json.load(open(os.path.join(SITE, "api", "rooms.json"), encoding="utf-8"))
owned_src = open(os.path.join(HERE, "museum", "src", "hang_owned.ts"), encoding="utf-8").read()
owned = json.loads("{" + owned_src.split("= {", 1)[1].split("};", 1)[0].rstrip().rstrip(",") + "}")
cards = []
for r in rooms:
    lead = next((by_n[n] for n in owned.get(r["id"], []) if n in by_n), None)
    if not r.get("learn") or not lead: continue
    cards.append({"r": r["id"], "nm": r["name"], "a": r.get("area", ""), "y": r.get("year", ""), "f": r["learn"],
                  "s": (r.get("source") or {}).get("name", ""), "c": r.get("color", "#ECC981"),
                  "p": lead["id"], "pn": lead["n"], "pt": lead["t"], "th": lead["st"][0]})
open(os.path.join(DST, "cards.json"), "w", encoding="utf-8").write(json.dumps(cards, ensure_ascii=False, separators=(",", ":")))

# A default piece for a bare /markup visit: stable for the build, picked from Era I, the founding census.
random.seed(len(P))
default_id = random.choice([p for p in P if p["e"] == 1 and p["id"].isdigit()])["id"]

# ---------- the page ----------
head = (f'<link rel="stylesheet" href="assets/markup/markup.css?v={ver["markup.css"]}">\n'
        f'<script src="assets/markup/idx.js?v={ver["idx.js"]}" defer></script>')
js = (f'<script>window.MK_CONFIG = {{ base: window.NY_BASE || "", site: {json.dumps(URL)}, defaultId: {json.dumps(default_id)} }};</script>\n'
      f'<script src="assets/markup/logos.js?v={ver["logos.js"]}"></script>\n'
      f'<script src="assets/markup/markup.js?v={ver["markup.js"]}"></script>')

page = shell(title="Mark up a New Yorker · NEW YORKERS by MLow",
             description="Pick any piece in the NEW YORKERS census and draw on it: thirteen brushes, the colours of the subway lines, a mood for every hour of the city. Sign it with your handle, save it as a PNG and post it on X.",
             body=body, path="markup.html", active=None, extra_head=head, scripts_after=js,
             keywords=["NEW YORKERS", "MLow", "draw on art", "mark up", "drawing tool", "New York City art", "subway colours"],
             jsonld={"@context": "https://schema.org", "@type": "WebApplication", "name": "Mark up a New Yorker", "url": URL + "/markup.html",
                     "applicationCategory": "DesignApplication", "operatingSystem": "Any", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
                     "description": "Draw over any NEW YORKERS painting by MLow with thirteen brushes in NYC moods, sign it, then save or post the result.",
                     "creator": {"@type": "Person", "name": "MLow"}, "isPartOf": {"@id": URL + "/#collection"}})
open(os.path.join(SITE, "markup.html"), "w", encoding="utf-8").write(page)
print(f"markup.html: written from MARKUP {commit or '(last copy)'}, {len(idx)} pieces indexed, {len(cards)} room cards, default NO. {default_id}")
