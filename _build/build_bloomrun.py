#!/usr/bin/env python3
"""bloomrun.html: BLOOM RUN, MLow's taxi game, as a NEW YORKERS page.

The game is edited as source in _build/bloomrun/src/game.src.html. This script inlines everything it
needs (the MLOW mark, the eye, the fLOWers sign panel, the N3W YORKERS lockups, the seven Blossom
icons as SVG paths, and ASCII subsets of the site's three fonts) into ONE file, _build/bloomrun/game.html,
which makes no outside requests. That file is both what the site serves and the artifact to pin to
IPFS, so it must stay self contained: the build refuses any http(s) reference that is not a link.

Asset prep (fonts, logos, Blossom paths) is _build/bloomrun/prep_assets.py; rerun it only when a
source changes. History: v1 came byte for byte from github.com/0xmlow/bloomrun on 2026-09-29; v2,
the same day, is the eight level route rebuilt here at MLow's request.

Then the page: the game in an iframe inside the site shell, with the poster as the share card.
Part of build_all.sh, before build_seo.py.
"""
import os, re, json, shutil, hashlib, base64, subprocess, tempfile
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
URL = cfg()["siteUrl"]
BR = os.path.join(HERE, "bloomrun"); SRC = os.path.join(BR, "src")
DST = os.path.join(SITE, "assets", "bloomrun")

# ---------- compile the single file game ----------
def datauri(path):
    ext = path.rsplit(".", 1)[1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "woff": "font/woff", "webp": "image/webp"}[ext]
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

s = open(os.path.join(SRC, "game.src.html"), encoding="utf-8").read()
s = re.sub(r"__IMG:([\w.]+)__", lambda m: datauri(os.path.join(SRC, "img", m.group(1))), s)
s = s.replace("__BLOSSOMS__", open(os.path.join(SRC, "blossoms.json")).read().strip())
# v3: NEW YORKERS art from prep_art.py. Every census painting, relic and Open Eye power up rides inline.
art = json.load(open(os.path.join(SRC, "art.json")))
AD = os.path.join(SRC, "art")
# v5: "st" is the census New Yorker's painting (from art/pt), no longer the 3D sticker render
art["uri"] = {kind: {os.path.splitext(f)[0]: datauri(os.path.join(AD, d, f)) for f in sorted(os.listdir(os.path.join(AD, d)))}
              for kind, d in (("st", "pt"), ("relic", "relic"), ("eye", "eye"))}
missing = [x["n"] for x in art["stickers"] if str(x["n"]) not in art["uri"]["st"]]
if missing: raise SystemExit(f"bloomrun: stickers without art {missing[:5]}")
s = s.replace("__ART__", json.dumps(art, separators=(",", ":"), ensure_ascii=False))
faces = [("BR Fraunces", "fraunces.woff", "normal"), ("BR Fraunces Italic", "fraunces-italic.woff", "normal"),
         ("BR Grotesk", "grotesk.woff", "normal"), ("BR Plex", "plexmono.woff", "normal")]
s = s.replace("/*__FONTS__*/", "\n".join(
    f"@font-face{{font-family:'{n}';src:url({datauri(os.path.join(SRC, 'fonts', f))}) format('woff');font-style:{st};font-display:block}}"
    for n, f, st in faces))

left = re.findall(r"__[A-Z]+(?::[\w.]+)?__", s)
if left: raise SystemExit(f"bloomrun: unfilled placeholders {left}")
for bad in ("\u2014", "\u2013"):
    if bad in s: raise SystemExit("bloomrun: a dash character made it into the game; the brand rule forbids it")
# self contained: the only URLs allowed are link targets the player clicks (the share intent, the site)
urls = set(re.findall(r"https?://[^\s\"'`)<>]+", s))
allowed = ("https://n3wyorkers.com/bloomrun", "https://n3wyorkers.com/n/", "https://x.com/intent/post")
stray = [u for u in urls if not u.startswith(allowed)]
if stray: raise SystemExit(f"bloomrun: the game would reach outside itself: {stray}")
# the script must parse; a broken build here looks fine until someone taps Start
js = re.search(r"<script>\n(.*)</script>", s, re.S).group(1)
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as t: t.write(js)
r = subprocess.run(["node", "--check", t.name], capture_output=True, text=True); os.unlink(t.name)
if r.returncode: raise SystemExit("bloomrun: game script does not parse\n" + r.stderr)
open(os.path.join(BR, "game.html"), "w", encoding="utf-8").write(s)

os.makedirs(DST, exist_ok=True)
for f in ("game.html", "poster.png"):
    shutil.copy2(os.path.join(BR, f), os.path.join(DST, f))
# the files keep their names, so browsers and X only see a new one if the URL changes with it
v = hashlib.sha256(s.encode() + open(os.path.join(BR, "poster.png"), "rb").read()).hexdigest()[:10]

# ---------- the page ----------
desc = ("BLOOM RUN, a NEW YORKERS game by MLow. Drive the MLow art taxi through all five boroughs in twenty levels, "
        "count the census New Yorkers, beat the red lights, find the relics, and challenge a friend on the same traffic.")
extra_css = """
.br{max-width:760px;margin:0 auto;padding:40px 16px 72px;text-align:center}
.br .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.3em;color:#8899AA;text-transform:uppercase}
.br h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(34px,7vw,60px);margin:12px 0 10px;letter-spacing:.02em}
.br h1 em{color:#00E5FF}
.br p{color:#AAB6C4;line-height:1.6;max-width:560px;margin:0 auto 22px}
.br .frame{width:min(540px,100%);height:min(86vh,760px);min-height:540px;margin:0 auto;border:1px solid #223;border-radius:14px;overflow:hidden;
  box-shadow:0 0 60px rgba(41,98,255,.25);background:#0D0D0D}
.br iframe{width:100%;height:100%;border:0;display:block}
@media (min-width:900px){ .br{max-width:1400px;padding-top:14px} .br .frame{width:min(1360px,97vw);height:max(600px,calc(100vh - 190px));border-radius:16px;background:#050409} }
.br .under{margin-top:26px} .br .under h1{font-size:clamp(30px,5vw,48px);margin:8px 0 10px}
.br .how{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.12em;color:#8899AA;margin-top:18px;line-height:1.8}
.br .how a{color:#2962FF;text-decoration:none}
.br .route{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;margin:30px auto 0;max-width:600px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;color:#667788;text-transform:uppercase}
.br .route b{color:#F0F4F8;font-weight:500}
"""
route = ["Wall Street", "SoHo", "Canal Street", "Lower East Side", "Flatiron", "Midtown Rush", "Times Square", "Central Park South", "Harlem, 125th Street",
         "Brooklyn Bridge", "DUMBO", "Williamsburg", "Coney Island", "Astoria", "Jackson Heights", "Flushing, Main Street", "Rockaway Beach",
         "The Bronx, 161st Street", "Arthur Avenue", "St. George"]
body = f"""<main class="br">
  <div class="frame"><iframe id="brFrame" src="assets/bloomrun/game.html?v={v}" title="BLOOM RUN by MLow" allow="fullscreen; clipboard-write"></iframe></div>
  <div class="how">Arrows or drag to steer. Down to brake. Space to bloom. H or double tap to honk. P to pause.<br><a href="assets/bloomrun/game.html?v={v}" target="_blank" rel="noopener">Play full screen</a></div>
  <div class="under">
    <div class="eyebrow">A NEW YORKERS game by MLow</div>
    <h1>BLOOM <em>RUN</em></h1>
    <p>One taxi, one rooftop sign, eight million eyes. Drive the MLow art taxi through all five boroughs. Every New Yorker who sees the sign is an impression. Pass close to the census New Yorkers to count them, beat the red lights, find each block\u2019s relic and bloom the avenue. Then send a friend your exact traffic and see who counts more.</p>
  </div>
  <div class="route">{"".join(f"<span><b>{i+1}</b> {n}</span>" for i, n in enumerate(route))}</div>
</main>"""

jsonld = {"@context": "https://schema.org", "@type": "VideoGame", "@id": URL + "/bloomrun",
          "name": "BLOOM RUN", "url": URL + "/bloomrun", "description": desc,
          "author": {"@type": "Person", "name": "MLow"}, "genre": "Arcade", "playMode": "SinglePlayer",
          "gamePlatform": "Web browser", "numberOfPlayers": 1, "numberOfLevels": 20, "image": f"{URL}/assets/bloomrun/poster.png?v={v}",
          "isPartOf": {"@id": URL + "/#site"}}

page = shell(title="BLOOM RUN · a NEW YORKERS game by MLow", description=desc,
             body=body, path="bloomrun.html", active="BLOOM RUN", extra_css=extra_css, jsonld=jsonld,
             image=f"{URL}/assets/bloomrun/poster.png?v={v}",
             keywords=["BLOOM RUN", "MLow", "NEW YORKERS", "NYC taxi game", "Times Square", "Blossom", "browser game", "arcade"],
             # a shared challenge link lands on this page as ?c=...; hand it to the game inside the frame
             scripts_after="<script>(function(){var q=new URLSearchParams(location.search),f=document.getElementById('brFrame');if(!f)return;var u=new URL(f.getAttribute('src'),location.href),n=0;"
                           "['c','level'].forEach(function(k){var v=q.get(k);if(v&&/^[A-Za-z0-9_-]{1,400}$/.test(v)){u.searchParams.set(k,v);n++;}});if(n)f.src=u.href;})();</script>")
open(os.path.join(SITE, "bloomrun.html"), "w", encoding="utf-8").write(page)
print(f"bloomrun.html: game {os.path.getsize(os.path.join(DST, 'game.html')) // 1024} KB, self contained, script parses, v={v}")
