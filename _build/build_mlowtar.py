#!/usr/bin/env python3
"""mlowtar.html: MLOWTAR SPEAKS. The fortune booth from ON LOCATION, made real: a walk up three.js booth
that reads you a fortune drawn from the census and sends you to a room of the museum, and that you can talk to.

What this writes:
  assets/mlowtar/deck.json      the whole census as a deck, one compact row per New Yorker (about 1.4 MB,
                                fetched on the first ask, never on page load):
                                [id, title, family, borough, neighborhood, era, thumbKey, hook]
                                read by the booth's own oracle in the browser and by /api/mlowtar (the Function
                                fetches it from the live origin, so the two never disagree)
  assets/mlowtar/og.jpg         the share card, from the ON LOCATION concept render when it is on this Mac
  _build/api/functions/api/_lib/mlowtar_match.js
                                a copy of assets/mlowtar/match.js so the Function scores rooms and cards with
                                the same code the browser uses
  mlowtar.html                  the page, inside the site shell

The booth model itself is the one ON LOCATION already ships, assets/movies/assets/glb/mlowtar.glb (all three
copies MLow had of it were byte identical on 2026-10-12); the page reads it from there so the GLB is not
committed twice. app.js, app.css, oracle.js and match.js in assets/mlowtar/ are hand written and versioned here
by content hash. Runs anywhere data.js exists; needs nothing else built first.
"""
import hashlib, json, os, re, shutil
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
C = cfg(); URL = C["siteUrl"]
DST = os.path.join(SITE, "assets", "mlowtar"); os.makedirs(DST, exist_ok=True)

# ---------- the deck ----------
data = json.loads(open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read().split("=", 1)[1].strip().rstrip(";"))
def hook(s):
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    if len(s) <= 96: return s
    cut = s[:96]; cut = cut[:cut.rfind(" ")] if " " in cut else cut
    return cut.rstrip(",;:") + "…"
deck = []
for p in data["pieces"]:
    if not p.get("st"): continue
    deck.append([str(p["id"]), p.get("t", ""), p.get("f", ""), p.get("b", ""), p.get("loc") or p.get("nb") or "", int(p.get("e") or 0), p["st"][0], hook(p.get("story"))])
deck_js = json.dumps(deck, ensure_ascii=False, separators=(",", ":"))
open(os.path.join(DST, "deck.json"), "w", encoding="utf-8").write(deck_js)
if os.path.exists(os.path.join(DST, "deck.js")): os.remove(os.path.join(DST, "deck.js"))   # the first cut shipped it as a script
print(f"  mlowtar: deck of {len(deck)} New Yorkers, {len(deck_js) // 1024} KB (fetched on the first ask, never on page load)")

# ---------- the matcher, shared with the Function ----------
lib = os.path.join(HERE, "api", "functions", "api", "_lib"); os.makedirs(lib, exist_ok=True)
shutil.copyfile(os.path.join(DST, "match.js"), os.path.join(lib, "mlowtar_match.js"))

# ---------- the share card ----------
og = os.path.join(DST, "og.jpg")
concept = os.path.join(ROOT, "ON LOCATION 2026-10-10", "work", "concepts", "mlowtar.jpg")
if not os.path.exists(og) and os.path.exists(concept): shutil.copyfile(concept, og)
if not os.path.exists(og): print("  mlowtar: NOTE no og.jpg (concept render not on this Mac); the site og.jpg stands")

import subprocess
subprocess.run(["python3", os.path.join(HERE, "mlowtar_stickers.py")], check=True)
subprocess.run(["python3", os.path.join(HERE, "mlowtar_sign.py")], check=True)        # the crown's letters, as outlines
for f in ("app.js", "app.css", "oracle.js", "match.js", "ticket.js", "deck.json", "stickers.json", "sign.json", "paper.jpg", "plaque.jpg", "brand/logo_white.png", "brand/logo_black.png"):
    if not os.path.exists(os.path.join(DST, f)): raise SystemExit(f"mlowtar: assets/mlowtar/{f} missing")
glb = os.path.join(SITE, "assets", "movies", "assets", "glb", "mlowtar.glb")
if not os.path.exists(glb): raise SystemExit("mlowtar: the booth GLB is missing from assets/movies/assets/glb")
_v = lambda f: hashlib.sha256(open(os.path.join(DST, f), "rb").read()).hexdigest()[:10]
_vp = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:10]
three = os.path.join(SITE, "assets", "airport", "vendor", "three.module.js")
if not os.path.exists(three): raise SystemExit("mlowtar: assets/airport/vendor/three.module.js is missing (the page imports it)")

# ---------- the page ----------
desc = ("MLOW SPEAKS: MLOWTAR, the fortune booth from the NEW YORKERS movie sets, made real. Drop a token, ask it anything. It deals a "
        "New Yorker from the census, reads your fortune off the card, prints you a one of a kind generative ticket, and sends you to a room of the museum.")
body = f"""<section class="mz" id="mz">
  <div class="mz-stage">
    <canvas id="mzc" aria-label="MLOWTAR, the fortune booth"></canvas>
    <div class="mz-tip">DROP A TOKEN IN THE SLOT · DRAG TO WALK AROUND</div>
    <div class="mz-load" id="mzLoad"><span class="kicker">MLOWTAR SPEAKS</span><b>The booth is warming up</b><i></i></div>
    <div class="mz-hud"><div><button class="mz-snd" id="mzSnd" type="button" aria-label="Toggle sound">SOUND OFF</button><button class="mz-rec" id="mzRec" type="button" title="Record the next consult as a film">RECORD</button></div><span class="mz-mode" id="mzMode">THE BOOTH</span></div>
  </div>
  <aside class="mz-panel" id="mzPanel">
    <header>
      <div class="kicker">MLOW SPEAKS</div>
      <h1>Drop a token. Ask the booth.</h1>
      <p>MLOWTAR deals a New Yorker from the census as your card, reads your fortune off it, prints you a ticket no one else will ever get, and sends you to a room of the museum. Ask it anything, then ask it again.</p>
    </header>
    <div class="mz-file" id="mzFile" hidden></div>
    <div class="mz-filed" id="mzFiled" hidden></div>
    <form class="mz-form" id="mzForm" autocomplete="off">
      <input id="mzQ" name="q" maxlength="240" placeholder="A street, a worry, a wish." aria-label="Your question for MLOWTAR">
      <button class="btn" type="submit">ASK</button>
    </form>
    <div class="mz-chips" id="mzChips"></div>
    <div class="mz-shelf" id="mzShelf" hidden><small>YOUR TICKETS · KEPT IN THIS BROWSER</small><div></div></div>
    <div class="mz-slips" id="mzSlips" aria-live="polite"></div>
  </aside>
</section>
<div class="mz-lb" id="mzLb" hidden role="dialog" aria-label="Your ticket"><div><canvas id="mzLbC" width="500" height="1150"></canvas><img alt="Your ticket"><div class="mz-lb-scan" id="mzLbScan" hidden><canvas id="mzLbQr" width="396" height="396"></canvas><span>SCAN TO REPLAY<br>this fortune, on any phone</span></div><div class="row"><button class="btn" type="button" id="mzSave">SAVE THE TICKET</button><button class="btn" type="button" id="mzLoop">SAVE THE LOOP</button><button class="btn ghost" type="button" data-close>CLOSE</button></div></div></div>
<section class="wrap mz-about">
  <div>
    <div class="kicker">WHAT IT IS</div>
    <h2>A fortune booth that only knows New York.</h2>
    <p>MLOWTAR was built as a prop for <a href="movies">ON LOCATION</a>, the walkable movie sets. It kept talking after the shoot. Answer five quick questions for the file (where the city keeps you, your hour, your order, your train, what you're carrying), then drop a token in the slot and the booth deals one of the New Yorkers in the census as your card, reads the fortune off the family, the borough and the block, and names the room of the museum you should go stand in next.</p>
    <p>Every consult prints a ticket: a generative piece drawn from your question, made of three systems MLow keeps around the studio. The bloom grid, the seal, the torn edge and the barcode come from his Memories renderers. The one bit glyphs (forty of them: a bagel, a slice, a manhole, a subway bullet, a water tower, the nazar, a pretzel, a dirty water dog, a cab, a fire escape, the Con Ed stack, a rat, the ferry, the DON'T WALK hand, the Wonder Wheel, the Unisphere, Liberty's crown, the Grand Central clock stopped at eleven eleven) are drawn in the Visualize Value idiom. The objects pressed on top are the New York stickers he made with ChatGPT, arranged fresh every time. Save it. No two are alike.</p>
  </div>
  <div>
    <div class="kicker">HOW IT WORKS</div>
    <h2>The booth writes its own slips.</h2>
    <p>No server, no model, no key: the reading is assembled in your browser from the file, the question and the card, out of banks written for the booth (ten thousand pre generated readings were checked and no two matched). The same question with the same file at the same minute gives the same slip, so a shared link replays. Hit RECORD before you ask and the booth films the whole consult as a vertical clip you can post.</p>
    <p>Your tickets stay on a shelf in your browser (the last twenty four), and on your collector profile when you have one. Save any of them as a full size PNG. Nothing you type leaves your browser unless you share the link.</p>
  </div>
  <div>
    <div class="kicker">THE SMALL PRINT</div>
    <h2>Art, not an investment.</h2>
    <p>MLOWTAR gives no financial, legal or medical advice, and it is wrong about the weather on purpose. The New Yorkers it deals are real pieces in the census; follow the card to meet them, follow the room to walk it.</p>
    <p><a href="museum">The museum</a> · <a href="census">The census</a> · <a href="counted">Get counted</a></p>
  </div>
</section>"""
head = (f'<link rel="stylesheet" href="assets/mlowtar/app.css?v={_v("app.css")}">\n'
        f'<link rel="modulepreload" href="assets/airport/vendor/three.module.js?v={_vp(three)}">\n'
        '<script type="importmap">' + json.dumps({"imports": {
            "three": "./assets/airport/vendor/three.module.js?v=" + _vp(three),
            # app.js imports these by relative path; the map rewrites the resolved URL to a versioned one, so an
            # edit to a bank reaches visitors at once instead of after Cloudflare's four hour cache floor
            **{f"./assets/mlowtar/{m}": f"./assets/mlowtar/{m}?v={_v(m)}" for m in ("oracle.js", "match.js", "ticket.js")}}}, separators=(",", ":")) + '</script>')   # an import map value must be a URL: "./" or it is ignored as a bare specifier
scripts = (f'<script src="assets/qrcode.min.js"></script>\n'
           f'<script>window.MLOWTAR_DECK_URL="assets/mlowtar/deck.json?v={_v("deck.json")}";window.MLOWTAR_SIGN_URL="assets/mlowtar/sign.json?v={_v("sign.json")}";window.MLOWTAR_LIVE=false;document.body.classList.add("mlowtar");</script>\n'
           f'<script type="module" src="assets/mlowtar/app.js?v={_v("app.js")}"></script>')
page = shell(title="MLOW SPEAKS · MLOWTAR, a fortune booth that only knows New York · NEW YORKERS by MLow", description=desc, path="mlowtar.html", active="MLOWTAR",
             image=(URL + "/assets/mlowtar/og.jpg?v=" + _v("og.jpg")) if os.path.exists(og) else None,
             keywords=["MLOWTAR", "fortune teller booth", "Zoltar", "NEW YORKERS", "MLow", "New York fortune", "virtual museum", "three.js"],
             extra_head=head, body=body, scripts_after=scripts,
             jsonld={"@context": "https://schema.org", "@type": "WebApplication", "name": "MLOWTAR SPEAKS", "url": URL + "/mlowtar.html",
                     "description": desc, "applicationCategory": "EntertainmentApplication", "operatingSystem": "Any", "browserRequirements": "WebGL",
                     "image": URL + "/assets/mlowtar/og.jpg", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
                     "creator": {"@type": "Person", "name": "MLow", "url": C["artistUrl"]},
                     "isPartOf": {"@type": "CreativeWork", "name": "NEW YORKERS by MLow", "url": URL + "/"}})
open(os.path.join(SITE, "mlowtar.html"), "w", encoding="utf-8").write(page)
print("  mlowtar: wrote mlowtar.html")
