#!/usr/bin/env python3
"""arcade.html and assets/arcade/: THE ARCADE, six playable New Yorkers games on the site.

The games are built in ARCADE 2026-09-09/ (its build/inject.py writes them; this script never edits those
sources). Each is one self contained HTML file: art inlined, no CDN, no network call of its own. This script
copies the three games plus ranked.html (the games link to it with a relative href) and the two covers into
assets/arcade/, appends a score bridge before </body> of each game, and writes arcade.html in the site shell.

The bridge: when a daily run ends, a bar at the foot of the game offers SUBMIT TO THE DAILY BOARD. It asks
for a 2 to 16 character name (letters, digits, dot, underscore; the last one is kept in localStorage) and posts
{game, score, name} to /api/score (functions/api/score.js, D1 table from _build/api/schema_scores.sql).
The hook watches each game's end screen (#end for THE DOOR and THE LAST TRAIN, #out for BODEGA COUNTER)
losing its "hide" class, which is what endNight(), finish() and showReceipt() all do, so it fires however the
run ended: by a call, by a click listener bound at boot, or by the skip button. Wrapping the function by name
missed the listener path (BODEGA's skip button), which is why it is an observer. Scores: THE DOOR stats().score,
THE LAST TRAIN myScore(), BODEGA COUNTER the receipt total R.total in cents (she has no score; the tab is the
number, and it is deterministic from the name typed, so her board is a joke board). Practice runs never reach
the board, daily runs do. The build fails if a game loses its end element or a name the score reads.

NEW YORKERS PINBALL (2026-10-07): three three.js tables, CYCLONE, EXPRESS and THE DEUCE, built in
ARCADE 2026-09-09/pinball (node build.mjs writes ARCADE 2026-09-09/pinball-*.html, make_covers.py the covers,
read its README). They are copied as built, with no bridge and no place on the daily board: putting them on
the board would extend the daily New Yorker prize to three more games, which is MLow's call, not a build step.
Each table already exposes what a bridge needs (begin(), gameOver(), PB.score, PB.daily, and its #over screen
losing the hidden attribute), so the board is a small change here when he decides.

THE GARDEN (2026-10-27): MLow's own cabinets, the Blossom games that were missing from the arcade. REDBEARD:
MEME GARDEN, MLOW FOOSBALL, BLOSSOM MAXWIN and MLOW'S MOOD ROOM are single self contained files kept in ARCADE 2026-09-09/garden
(SOURCES.md there says where each came from) and copied as built; the only change is the dashes in text a player
reads (titles, share card titles, the foosball score line), which become colons or "to". BLOOM RUN already ships
as its own page from _build/bloomrun, so its card points at assets/bloomrun/game.html and links to /bloomrun.
No board for any of them. BLOSSOM FLAP and THE BLOSSOM TRAIL (2026-10-28) had no copy on this Mac; they came off
their SuperRare tokens (0xB93d...9f28 #4 and #1) by IPFS, each checked against the animation_sha256 in its metadata,
and their cards link to the token.

Part of build_all.sh before build_seo.py; build_deploy.py ships arcade.html and syncs assets/arcade."""
import os, re, json, shutil, hashlib, subprocess, tempfile
from page_shell import shell, esc, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
SRC = os.path.join(ROOT, "ARCADE 2026-09-09")
DST = os.path.join(SITE, "assets", "arcade")
URL = cfg()["siteUrl"]

# "end" is the end screen element each game unhides when a run is over (endNight, finish, showReceipt all do
# `$("end"|"out").classList.remove("hide")`). The bridge watches that class, so it fires however the game got
# there: by name, by a click listener bound at boot, or by a skip button. "needs" are the top level names the
# score expression reads; the build fails if a game stops declaring one.
GAMES = [
    {"id": "door", "file": "the-door.html", "name": "THE DOOR", "cover": "the-door-cover.png",
     "line": "Five doors a night, the same five for everyone. The bouncer has rules and will not tell you what they are.",
     "how": "Dress for the line, read the denial, try again. Two attempts a door.",
     "end": "end", "score": "stats().score", "daily": "S.daily", "needs": ["function stats", "var S"], "label": "SCORE", "money": False},
    {"id": "lasttrain", "file": "the-last-train.html", "name": "THE LAST TRAIN", "cover": "the-last-train-cover.png",
     "line": "2am at Bedford Av. Every fare splits between the pot and everyone already aboard. Last one through takes the night.",
     "how": "Push on, or wait. The doors lock at a time you are not told.",
     "end": "end", "score": "myScore()", "daily": "S.daily", "needs": ["function myScore", "var S"], "label": "SCORE", "money": False},
    {"id": "bodega", "file": "bodega-counter.html", "name": "BODEGA COUNTER", "cover": None,
     "line": "Hand her a name. She reads you in seven beats, prints the receipt, and the cat decides.",
     "how": "No stakes, no way to lose. The cat keeps her own books, so this one has no board.",
     "end": "out", "score": "R.total", "daily": "true", "needs": ["var R"], "label": "YOUR TAB", "money": True, "board": False},
]
PINBALL = [
    {"id": "cyclone", "file": "pinball-cyclone.html", "name": "CYCLONE", "cover": "pinball-cyclone-cover.png", "pinball": True, "board": False,
     "line": "Coney Island after dark. Ride the Cyclone, jump the Parachute, and the Wonder Wheel throws whatever lands on it.",
     "how": "Count the eight New Yorkers of the boardwalk. Three balls."},
    {"id": "express", "file": "pinball-express.html", "name": "EXPRESS", "cover": "pinball-express-cover.png", "pinball": True, "board": False,
     "line": "Rush hour under the city. A train runs the El all game, and the doors shut on you in front of the tunnel.",
     "how": "Count the eight New Yorkers underground. Three balls."},
    {"id": "deuce", "file": "pinball-deuce.html", "name": "THE DEUCE", "cover": "pinball-deuce-cover.png", "pinball": True, "board": False,
     "line": "42nd Street after midnight. The eye in the middle of the table watches the ball, and opens when you hit it.",
     "how": "Count the eight New Yorkers of Times Square. Three balls."},
]
# "fix" pairs are exact replacements for dashes a player reads; each must match once or the build stops.
# PHONE (2026-10-28): every garden game gets MOBILE_CSS plus its own "mcss" before </head>. iOS ignores
# user-scalable=no, so touch-action is what stops a fast double tap zooming the page and a drag scrolling it; the
# callout and selection rules stop a held on screen button from opening the iOS magnifier. Canvas rules are per game,
# so a page that has to scroll (the Mood Room) only locks its drawing canvas.
MOBILE_CSS = ("html{-webkit-tap-highlight-color:transparent}"
              "button,[role=button],a,label{touch-action:manipulation;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}")
GARDEN = [
    {"id": "bloomrun", "site": "assets/bloomrun/game.html", "page": "bloomrun.html", "name": "BLOOM RUN", "cover": "../bloomrun/poster.png",
     "line": "Drive the art taxi from SoHo to the Brooklyn Bridge. Twenty levels of traffic, fLOWers and close calls.",
     "how": "Arrows or drag to steer, down to brake, space to bloom. Eight lives."},
    {"id": "flap", "file": "blossom-flap.html", "name": "BLOSSOM FLAP", "cover": "blossom-flap-cover.jpg", "mcss": "canvas{touch-action:none}", "dashes": True, "token": "https://superrare.com/artwork/eth/0xB93d1Cc47FB627D77eBDcF34a21a168841Bc9f28/4",
     "line": "Fly the evil eye through a floating New York skyline. Catch blossoms to push back the rising flood.",
     "how": "Tap, click or space to flap. Eight levels from SEED to WILDGROWTH, in Garden or Hard.",
     "fix": [("The flood is rising \u2014 every", "The flood is rising: every", 1),
             ("Session board \u2014 hosted API hookup pending", "Session board \u2014 kept on this device", 1)]},
    {"id": "trail", "file": "blossom-trail.html", "name": "THE BLOSSOM TRAIL", "cover": "blossom-trail-cover.jpg", "dashes": True, "token": "https://superrare.com/artwork/eth/0xB93d1Cc47FB627D77eBDcF34a21a168841Bc9f28/1",
     "line": "1848: dysentery. 2026: gas fees. Lead five blossoms across 2,026 blocks to the Genesis Garden.",
     "how": "An Oregon Trail for the onchain age. Markets turn, FUD storms roll in, not every petal makes it."},
    {"id": "redbeard", "file": "redbeard-meme-garden.html", "name": "REDBEARD: MEME GARDEN", "cover": "redbeard-meme-garden-cover.jpg",
     "line": "Five levels of puzzle platforming through MLow's art portals. Six meme fossils are hidden in the garden.",
     "how": "Ride the coloured currents, keep your air, find the fossils. Four characters.",
     "fix": [("REDBEARD \u2014 MEME GARDEN", "REDBEARD: MEME GARDEN", 3)],
     "mcss": "[data-key]{touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}"},
    {"id": "foosball", "file": "mlow-foosball.html", "name": "MLOW FOOSBALL", "cover": "mlow-foosball-cover.jpg", "mcss": "#gl,canvas{touch-action:none}",
     "line": "Daylight against the Vault on a table grown out of the Blossom garden. Every goal bursts into petals.",
     "how": "Mouse or W and S to slide, click or space to kick, 1 to 4 picks a rod. First to five.",
     "fix": [("MLOW FOOSBALL \u2014 The Garden Table", "MLOW FOOSBALL: The Garden Table", 2), ('<span class="key">1 \u2013 4</span>', '<span class="key">1 to 4</span>', 1),
             ('<div id="endScore">5 \u2014 3</div>', '<div id="endScore">5 to 3</div>', 1), ("' \u2014 '", "' to '", 2)]},
    {"id": "maxwin", "file": "blossom-maxwin-casino.html", "name": "BLOSSOM MAXWIN", "cover": "blossom-maxwin-cover.jpg", "dashes": True,
     "line": "A 3D garden casino where the reels are MLow's paintings. Bloom or bust, pop a cap, find a grail.",
     "how": "You bet petals, never money. Every pull pops a cap with a fact inside. The art always wins."},
    {"id": "mood", "file": "mood-room.html", "name": "MLOW'S MOOD ROOM", "cover": "mood-room-cover.jpg", "mcss": "#draw-canvas{touch-action:none}",
     "line": "Pick a mood, draw on the canvas, flip the cards, click for sparks. MLow's first interactive room, from NYU.",
     "how": "No score, no way to lose. Play with it."},
]
ALL = GAMES + PINBALL
EXTRA = ["ranked.html"]
COVERS = ["the-door-cover.png", "the-last-train-cover.png"] + [g["cover"] for g in PINBALL] + [g["cover"] for g in GARDEN if g.get("file") and g["cover"]] + ["arcade-hall.webp", "arcade-hall-960.webp", "arcade-carpet.webp"] + [f"attract-{i}.mp4" for i in ("flap", "trail", "bloomrun", "redbeard", "maxwin", "foosball", "cyclone", "mood")]

BRIDGE = r"""
<script>
/* NEW YORKERS ARCADE score bridge. Appended by _build/build_arcade.py; the game above is untouched.
   When a daily run ends, a bar offers to put the score on the day's board at /api/score. */
(function(){
"use strict";
var GAME = "%(id)s", LABEL = "%(label)s", MONEY = %(money)s, KEY = "ny_arcade_name", bar = null;
function readName(){ try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
function keepName(n){ try { localStorage.setItem(KEY, n); } catch (e) {} }
function fmt(s){ return MONEY ? "$" + (s / 100).toFixed(2) : String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; }); }
function ensureBar(){
  if (bar) return bar;
  bar = document.createElement("div");
  bar.id = "nyArcadeBar";
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:rgba(8,13,22,.96);border-top:1px solid #282C36;font:600 12px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#ECE8DD";
  document.body.appendChild(bar);
  return bar;
}
function say(html){ ensureBar().innerHTML = html; }
function submit(score){
  score = Math.max(0, Math.min(10000000, Math.round(Number(score) || 0)));
  var b = ensureBar();
  b.innerHTML = "";
  var txt = document.createElement("span"); txt.textContent = LABEL + " " + fmt(score);
  var btn = document.createElement("button"); btn.textContent = "Submit to the daily board";
  btn.style.cssText = "font:inherit;color:#fff;background:#4692C2;border:1px solid #4692C2;padding:10px 14px;cursor:pointer;letter-spacing:.12em;text-transform:uppercase";
  btn.onclick = function(){
    var name = window.prompt("Your name for the board. 2 to 16 letters, numbers, dot or underscore.", readName());
    if (name === null) return;
    name = String(name).trim();
    if (!/^[A-Za-z0-9._]{2,16}$/.test(name)) {
      say("<span>That name will not do. Letters, numbers, dot, underscore, 2 to 16.</span>");
      setTimeout(function(){ submit(score); }, 2200);
      return;
    }
    keepName(name);
    btn.disabled = true; btn.textContent = "Sending";
    fetch("/api/score", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ game: GAME, score: score, name: name }) })
      .then(function(r){ return r.json().then(function(j){ return { ok: r.ok && j && j.ok, j: j || {} }; }); })
      .then(function(o){
        if (!o.ok) { say("<span>" + esc(o.j.error || "The board did not take it.") + "</span>"); return; }
        say("<span>On the board as " + esc(name) + (o.j.rank ? ", No. " + o.j.rank + " today" : "") + ". The top score at midnight gets a New Yorker.</span>");
        try { window.parent.postMessage({ ny: "score", game: GAME, score: score, name: name }, "*"); } catch (e) {}
      })
      .catch(function(){ say("<span>No board reachable from here. Play it at n3wyorkers.com/arcade.</span>"); });
  };
  b.appendChild(txt); b.appendChild(btn);
}
window.NY_ARCADE_SUBMIT = submit;
window.NY_ARCADE_HIDE = function(){ if (bar) { bar.remove(); bar = null; } };
})();
</script>
<script>
/* The hook: the game's end screen losing its "hide" class. Fires however the run ended. Daily runs only;
   practice is replayable and would farm the board. The bar goes when the end screen hides again. */
(function(){
"use strict";
var end = document.getElementById("%(end)s");
if (!end) return;
var shown = !end.classList.contains("hide");
function check(){
  var now = !end.classList.contains("hide");
  if (now && !shown) { try { if (%(daily)s) window.NY_ARCADE_SUBMIT(%(score)s); } catch (e) {} }
  if (!now && shown) { try { window.NY_ARCADE_HIDE(); } catch (e) {} }
  shown = now;
}
new MutationObserver(check).observe(end, { attributes: true, attributeFilter: ["class"] });
})();
</script>
"""


def check_js(js, what):
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as t:
        t.write(js); p = t.name
    r = subprocess.run(["node", "--check", p], capture_output=True, text=True); os.unlink(p)
    if r.returncode: raise SystemExit(f"arcade: {what} does not parse\n" + r.stderr)


def place_game(g):
    s = open(os.path.join(SRC, g["file"]), encoding="utf-8").read()
    if g.get("pinball"):
        # a pinball table ships exactly as built (its own build gates dashes, URLs and script parsing)
        if "function begin(" not in s or "window.__ART" not in s: raise SystemExit(f"arcade: {g['file']} is not a built pinball table")
        open(os.path.join(DST, g["file"]), "w", encoding="utf-8").write(s)
        return hashlib.sha256(s.encode()).hexdigest()[:10]
    if not re.search(rf'\bid="{g["end"]}"', s):
        raise SystemExit(f"arcade: {g['file']} has no element id=\"{g['end']}\"; the end screen hook needs updating")
    for need in g["needs"]:
        if not re.search(rf"^{need}\b", s, re.M):
            raise SystemExit(f"arcade: {g['file']} no longer declares `{need}` at top level; the score expression needs updating")
    if "NY_ARCADE_SUBMIT" in s: raise SystemExit(f"arcade: {g['file']} already carries the bridge; copy from the clean source")
    # the X player card comment carried placeholder URLs; the files have a home now
    s = s.replace("https://REPLACE.ME/", f"{URL}/assets/arcade/")
    # a game with no board (Bodega) ships clean: nothing to submit, so no bridge
    bridge = "" if not g.get("board", True) else BRIDGE % {"id": g["id"], "label": g["label"], "money": "true" if g["money"] else "false",
                       "end": g["end"], "score": g["score"], "daily": g["daily"]}
    for blk in re.findall(r"<script>([\s\S]*?)</script>", bridge):
        check_js(blk, f"{g['id']} bridge")
    i = s.rfind("</body>")
    if i < 0: raise SystemExit(f"arcade: {g['file']} has no </body>")
    s = s[:i] + bridge + s[i:]
    for bad in ("—", "–"):
        if bad in bridge: raise SystemExit("arcade: a dash character made it into the bridge")
    open(os.path.join(DST, g["file"]), "w", encoding="utf-8").write(s)
    return hashlib.sha256(s.encode()).hexdigest()[:10]


def place_garden(g):
    if not g.get("file"):  # a site page that ships from its own builder: version it by the file it plays
        return hashlib.sha256(open(os.path.join(SITE, g["site"]), "rb").read()).hexdigest()[:10]
    s = open(os.path.join(SRC, "garden", g["file"]), encoding="utf-8").read()
    for a, b, n in g.get("fix", []):
        if s.count(a) != n: raise SystemExit(f"arcade: {g['file']} has {s.count(a)} of {a!r}, expected {n}; check the copy")
        s = s.replace(a, b)
    if g.get("dashes"):  # a game with dashes all through its text: sentences take a comma, labels a dot
        s = re.sub(r'(?m)^(\s*"[^"\n]*?) \u2014 ', r"\1, ", s)
        s = re.sub(r'(?m)^(\s*"[^"\n]*?) \u2014 ', r"\1, ", s)
        s = s.replace(" \u2014 ", " \u00b7 ").replace("\u2014", ", ")
    css = '<style id="ny-mobile">' + MOBILE_CSS + g.get("mcss", "") + "</style>"
    if "</head>" not in s: raise SystemExit(f"arcade: {g['file']} has no </head> for the phone rules")
    s = s.replace("</head>", css + "</head>", 1)
    vis = re.sub(r"/\*[\s\S]*?\*/|(?<![:\"'])//[^\n]*", "", re.sub(r"data:[^\"')]+", "", s))
    left = [vis[max(0, m.start() - 30):m.start() + 30] for m in re.finditer("[\u2014\u2013]", vis)]
    if left: raise SystemExit(f"arcade: {g['file']} still shows a dash: {left[:3]}")
    open(os.path.join(DST, g["file"]), "w", encoding="utf-8").write(s)
    return hashlib.sha256(s.encode()).hexdigest()[:10]


os.makedirs(DST, exist_ok=True)
vers = {g["id"]: place_game(g) for g in ALL}
vers.update({g["id"]: place_garden(g) for g in GARDEN})
for f in EXTRA + COVERS:
    if f.startswith("../"): continue
    src = os.path.join(SRC, f) if f.endswith(".html") else os.path.join(SRC, "media", f)
    if not os.path.exists(src): raise SystemExit("arcade: missing source " + src)
    shutil.copy2(src, os.path.join(DST, f))
keep = {g["file"] for g in ALL} | {g["file"] for g in GARDEN if g.get("file")} | set(EXTRA) | set(COVERS)
for f in os.listdir(DST):
    if f not in keep: os.remove(os.path.join(DST, f)); print("  pruned", f)

# ---------- the page ----------
# THE FLOOR (2026-10-28): MLow asked for an arcade that feels like a real one, and to hide THE DOOR, THE LAST
# TRAIN, BODEGA COUNTER and two of the pinball tables for now. Hidden games still build and ship (old links keep
# working), they just get no cabinet. Every game on the floor is a cabinet: a lit marquee in its line colour, a
# CRT screen with scanlines over its cover, a control panel, and a coin door whose button starts the game. The
# hall behind the sign and the carpet under the cabinets were made in Adobe Firefly (Nano Banana 2) on
# 2026-10-28; the raw PNGs are in ARCADE 2026-09-09/media/firefly, the carpet is mirror tiled so it never seams.
# The Mood Room cover is a real drawing made in the room by mood_room_cover_capture.py in that same folder.
HIDDEN = {"door", "lasttrain", "bodega", "express", "deuce"}
FLOOR = ["flap", "trail", "bloomrun", "redbeard", "maxwin", "foosball", "cyclone", "mood"]
LINE = {"flap": "--sky", "trail": "--gold", "bloomrun": "--amber", "redbeard": "--coral", "maxwin": "--harbor",
        "foosball": "--mist", "cyclone": "--coral", "mood": "--sky"}
GENRE = {"flap": "FLAPPER", "trail": "TRAIL", "bloomrun": "DRIVER", "redbeard": "PLATFORMER", "maxwin": "GARDEN CASINO",
         "foosball": "TABLE SPORT", "cyclone": "PINBALL", "mood": "DRAWING TOY"}
# ATTRACT MODE (2026-10-28): each screen plays a short muted loop of its own game while the cabinet is on screen,
# like a real cabinet left alone. Recipes in ARCADE 2026-09-09/media/attract (README there).
BYID = {g["id"]: g for g in ALL + GARDEN}
CABS = [BYID[i] for i in FLOOR]
assert all(g["id"] not in HIDDEN for g in CABS)
for g in ALL + GARDEN:
    if g["id"] not in HIDDEN and g["id"] not in FLOOR: raise SystemExit(f"arcade: {g['id']} is neither on the floor nor hidden")


def src_of(g):
    if g.get("site"): return f"{g['site']}?v={vers[g['id']]}"
    return f"assets/arcade/{g['file']}?v={vers[g['id']]}"


def cover_of(g):
    return f"assets/arcade/{g['cover']}"


desc = ("THE MLOW ARCADE at NEW YORKERS: free games by MLow, open all night in the browser. BLOSSOM FLAP, THE BLOSSOM TRAIL, "
        "BLOOM RUN, REDBEARD: MEME GARDEN, BLOSSOM MAXWIN, MLOW FOOSBALL, CYCLONE pinball and MLOW'S MOOD ROOM.")
TICK = " · ".join(["FREE PLAY ALL NIGHT", "NO WALLET", "NO QUARTERS"] + [g["name"] for g in CABS] + ["TWO OF THESE ARE MINTED ON SUPERRARE", "THE ART ALWAYS WINS"])

extra_css = """
.arc{--neon:var(--sky);background:var(--ink);overflow:clip}
.arc .hall{position:relative;min-height:min(92vh,860px);display:grid;place-items:center;text-align:center;padding:clamp(70px,9vw,120px) 16px clamp(90px,10vw,140px);isolation:isolate}
.arc .hall:before{content:"";position:absolute;inset:0;z-index:-2;background:url(assets/arcade/arcade-hall.webp) center 40%/cover no-repeat;transform:scale(1.04);animation:arcDrift 24s ease-in-out infinite alternate}
.arc .hall:after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse 60% 55% at 50% 42%,rgba(8,13,22,.15),rgba(8,13,22,.78) 70%,var(--ink)),linear-gradient(180deg,rgba(8,13,22,.55),transparent 30%,transparent 62%,var(--ink))}
@media (max-width:700px){.arc .hall:before{background-image:url(assets/arcade/arcade-hall-960.webp)}}
@keyframes arcDrift{from{transform:scale(1.04) translate3d(0,0,0)}to{transform:scale(1.1) translate3d(-1.2%,-1%,0)}}
.arc .sign{font-family:var(--sign);text-transform:uppercase;line-height:.86;margin:0;font-weight:400;font-size:clamp(54px,11.5vw,164px);letter-spacing:.02em;color:#F4FBFF;
  text-shadow:0 0 4px #fff,0 0 12px var(--sky),0 0 28px var(--sky),0 0 60px var(--harbor),0 0 110px var(--harbor)}
.arc .sign span{display:block}
.arc .sign .two{font-size:.62em;letter-spacing:.14em;color:#FFF3F0;text-shadow:0 0 4px #fff,0 0 12px var(--coral),0 0 30px var(--coral),0 0 70px var(--brick)}
.arc .sign .flk{animation:arcFlicker 7s infinite}
@keyframes arcFlicker{0%,18%,22%,25%,53%,57%,100%{opacity:1}20%,24%,55%{opacity:.35}}
.arc .over{font-family:var(--mono);font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin:0 0 22px;text-shadow:0 0 12px rgba(236,201,129,.5)}
.arc .lede{max-width:31em;margin:28px auto 0;font-family:var(--serif);font-style:italic;font-weight:400;color:var(--cloud);font-size:clamp(17px,1.7vw,21px);line-height:1.5;text-wrap:balance;text-shadow:0 2px 14px #000}
.arc .booth{display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:30px}
.arc .led{font-family:var(--mono);font-weight:600;font-size:14px;letter-spacing:.2em;color:#FF8A6E;background:#120806;border:1px solid #3A1A12;border-radius:6px;padding:12px 16px;
  box-shadow:inset 0 0 18px rgba(0,0,0,.9),0 0 0 3px #0A0A0C,0 0 22px rgba(220,111,87,.25);text-shadow:0 0 6px #FF5A3A,0 0 14px rgba(255,90,58,.6);min-width:150px}
.arc .led b{font-weight:600;color:#FFC7B8}
.arc .coin{font-family:var(--sign);font-size:18px;letter-spacing:.08em;color:#1A1206;border:0;cursor:pointer;padding:15px 24px 13px;border-radius:999px;
  background:radial-gradient(circle at 30% 25%,#FFF1C9,var(--gold) 38%,#B98A3A 78%,#7A5A22);box-shadow:0 0 0 3px #3A2A10,0 0 0 5px var(--gold2),0 10px 30px rgba(236,201,129,.35);animation:arcBlink 1.2s steps(2,start) infinite}
.arc .coin:hover{animation:none;filter:brightness(1.1)}
.arc .coin:active{transform:translateY(2px)}
@keyframes arcBlink{to{box-shadow:0 0 0 3px #3A2A10,0 0 0 5px var(--gold2),0 0 42px rgba(236,201,129,.75)}}
.arc .ticker{position:relative;margin-top:-1px;background:#050608;border-top:2px solid #1B1F28;border-bottom:2px solid #1B1F28;overflow:hidden;white-space:nowrap;padding:12px 0}
.arc .ticker:before{content:"";position:absolute;inset:0;background:radial-gradient(circle,rgba(0,0,0,0) 0 1px,#050608 1.4px) 0 0/4px 4px;pointer-events:none;z-index:2}
.arc .ticker div{display:inline-block;font-family:var(--mono);font-weight:600;font-size:15px;letter-spacing:.24em;color:var(--gold);text-shadow:0 0 8px rgba(236,201,129,.8);animation:arcTick 60s linear infinite;padding-left:100%}
@keyframes arcTick{to{transform:translateX(-100%)}}
.arc .floor{position:relative;padding:clamp(56px,7vw,100px) 0 clamp(80px,9vw,130px);
  background:linear-gradient(180deg,var(--ink),rgba(8,13,22,.55) 14%,rgba(8,13,22,.62) 86%,var(--ink)),url(assets/arcade/arcade-carpet.webp) 0 0/520px 520px}
.arc .floor .head{text-align:center;margin-bottom:clamp(36px,5vw,64px)}
.arc .floor .head h2{font-family:"Bungee Inline",var(--sign);font-weight:400;font-size:clamp(32px,4.6vw,60px);letter-spacing:.04em;margin:12px 0 0;color:#FFF3F0;
  text-shadow:0 0 4px #fff,0 0 14px var(--coral),0 0 34px var(--coral),0 0 70px var(--brick)}
.arc .floor .head p{font-family:var(--mono);font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin:0}
.arc .rows{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(18px,2.4vw,34px);align-items:stretch}
@media (max-width:1180px){.arc .rows{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:620px){.arc .rows{grid-template-columns:minmax(0,1fr);max-width:400px;margin:0 auto}}
.cab{--lc:var(--sky);position:relative;display:flex;flex-direction:column;filter:drop-shadow(0 30px 40px rgba(0,0,0,.65));transition:transform .35s var(--ease)}
.cab:hover{transform:translateY(-6px)}
.cab .shell{flex:1;display:flex;flex-direction:column;position:relative;border-radius:16px 16px 6px 6px;padding:0 12px 14px;
  background:linear-gradient(90deg,#05070B,#121A26 8%,#0C121B 50%,#121A26 92%,#05070B);border:1px solid #1E2A38;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03)}
.cab .shell:before{content:"";position:absolute;left:-1px;right:-1px;top:68px;bottom:-1px;border-radius:0 0 6px 6px;pointer-events:none;
  box-shadow:inset 3px 0 0 color-mix(in srgb,var(--lc) 70%,transparent),inset -3px 0 0 color-mix(in srgb,var(--lc) 70%,transparent)}
.cab .marq{position:relative;margin:0 -12px;height:68px;border-radius:15px 15px 0 0;display:grid;place-items:center;overflow:hidden;padding:0 14px;
  background:radial-gradient(ellipse 70% 120% at 50% 100%,color-mix(in srgb,var(--lc) 55%,#fff 0%),color-mix(in srgb,var(--lc) 30%,#05070B) 70%,#05070B);border-bottom:3px solid #05070B}
.cab .marq:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.28),transparent 45%);pointer-events:none}
.cab .marq b{position:relative;font-family:"Bungee Inline",var(--sign);font-weight:400;font-size:clamp(15px,1.4vw,19px);letter-spacing:.05em;line-height:1.08;text-align:center;color:#fff;
  text-shadow:0 2px 0 rgba(0,0,0,.6),0 0 14px color-mix(in srgb,var(--lc) 90%,#fff),0 0 30px color-mix(in srgb,var(--lc) 60%,transparent)}
.cab .bulbs{position:absolute;inset:6px 8px;border-radius:10px 10px 0 0;pointer-events:none;
  --dot:radial-gradient(circle,#FFF6D8 0 1.6px,color-mix(in srgb,var(--gold) 70%,transparent) 2.4px,transparent 3.4px);
  background:var(--dot) 0 0/12px 8px repeat-x,var(--dot) 6px 100%/12px 8px repeat-x;animation:arcBulbs 1.1s steps(2) infinite;opacity:.95}
@keyframes arcBulbs{to{background-position:6px 0,0 100%}}
.cab .bezel{position:relative;margin-top:14px;padding:12px;border-radius:12px;background:linear-gradient(180deg,#020305,#0A0E14);box-shadow:inset 0 0 0 2px #1A2230,inset 0 6px 18px rgba(0,0,0,.8)}
.cab .crt{position:relative;display:block;width:100%;aspect-ratio:16/9;border-radius:12px/16px;overflow:hidden;cursor:pointer;border:0;padding:0;background:#000;
  box-shadow:0 0 0 2px #000,0 0 26px color-mix(in srgb,var(--lc) 35%,transparent)}
.cab .crt img,.cab .crt video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;filter:saturate(1.15) contrast(1.05);transition:transform .6s var(--ease),filter .3s}
.cab .crt video{opacity:0;transition:opacity .5s}
.cab .crt.live video{opacity:1;animation:arcPower .55s var(--ease)}
@keyframes arcPower{0%{transform:scaleY(.01) scaleX(.6);filter:brightness(4)}45%{transform:scaleY(1) scaleX(1);filter:brightness(1.8)}100%{transform:none;filter:saturate(1.15) contrast(1.05)}}
.cab .crt .att{position:absolute;bottom:9px;left:10px;z-index:2;font-family:var(--mono);font-weight:600;font-size:10px;letter-spacing:.2em;color:#FFE9A8;background:rgba(5,6,8,.72);padding:4px 7px;border-radius:3px;text-shadow:0 0 6px rgba(236,201,129,.9);animation:arcBlink2 1s steps(2,start) infinite}
.cab:hover .crt .att{opacity:0;animation:none}
.cab .crt:after{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(0,0,0,.65)),linear-gradient(125deg,rgba(255,255,255,.14),transparent 32%)}
.cab .crt .ps{position:absolute;left:0;right:0;bottom:12px;z-index:2;font-family:var(--sign);font-size:15px;letter-spacing:.14em;color:#fff;text-shadow:0 0 10px var(--lc),0 2px 0 #000;opacity:0;transition:opacity .2s}
.cab:hover .crt .ps,.cab .crt:focus-visible .ps{opacity:1;animation:arcBlink2 .9s steps(2,start) infinite}
.cab:hover .crt img,.cab:hover .crt video{transform:scale(1.04);filter:saturate(1.3) contrast(1.1)}
@keyframes arcBlink2{to{opacity:.15}}
.cab .crt:focus-visible{outline:3px solid var(--gold);outline-offset:3px}
.cab .panel{position:relative;margin:14px -6px 0;height:54px;border-radius:6px;transform:perspective(320px) rotateX(28deg);transform-origin:top;
  background:linear-gradient(180deg,#1A2433,#0D131C);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 6px 10px rgba(0,0,0,.5);display:flex;align-items:center;gap:14px;padding:0 18px}
.cab .stick{position:relative;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--lc) 40%,color-mix(in srgb,var(--lc) 50%,#000));box-shadow:0 6px 0 -2px #000,0 0 14px color-mix(in srgb,var(--lc) 60%,transparent);transition:transform .2s}
.cab .stick:after{content:"";position:absolute;left:50%;top:22px;width:6px;height:12px;margin-left:-3px;background:#222;border-radius:2px}
.cab:hover .stick{transform:translateX(-4px) rotate(-12deg)}
.cab .b{width:18px;height:18px;border-radius:50%;box-shadow:inset 0 -3px 0 rgba(0,0,0,.35),0 3px 0 #000}
.cab .b1{background:var(--coral);margin-left:auto}.cab .b2{background:var(--gold)}.cab .b3{background:var(--sky)}
.cab .panel em{font-style:normal;font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.16em;color:var(--slate);border:1px solid #2A3646;border-radius:3px;padding:2px 5px;margin-left:4px}
.cab .plate{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 12px;padding-bottom:10px;border-bottom:1px dashed #223042}
.cab .plate .no{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.18em;color:var(--gold)}
.cab .plate .genre{font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.18em;color:color-mix(in srgb,var(--lc) 85%,#fff);border:1px solid color-mix(in srgb,var(--lc) 45%,transparent);border-radius:999px;padding:3px 9px}
.cab .door{flex:1;display:flex;flex-direction:column;margin-top:6px;border-radius:6px;padding:14px 14px 16px;background:linear-gradient(180deg,#0B1018,#070A10);border:1px solid #1A2230}
.cab .card-txt{font-family:var(--sans);font-size:15px;line-height:1.5;letter-spacing:-.005em;color:var(--cloud);margin:0;text-wrap:pretty}
.cab .how{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--slate);margin:10px 0 0;line-height:1.7;padding-bottom:4px}
.cab .slots{display:flex;gap:10px;margin-top:auto;padding-top:14px}
.cab .slot{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;font-family:var(--sign);font-size:15px;letter-spacing:.08em;cursor:pointer;text-decoration:none;
  color:#1A1206;background:linear-gradient(180deg,#FFE3A0,var(--gold) 45%,#B98A3A);border:0;border-radius:8px;padding:12px 10px 10px;box-shadow:0 0 0 2px #3A2A10,0 4px 0 #3A2A10;transition:transform .12s,filter .2s}
.cab .slot:before{content:"";width:4px;height:18px;border-radius:3px;background:#1A1206;box-shadow:0 0 6px rgba(255,90,58,.9),inset 0 0 0 1px #FF5A3A}
.cab .slot:hover{filter:brightness(1.08)}.cab .slot:active{transform:translateY(3px);box-shadow:0 0 0 2px #3A2A10,0 1px 0 #3A2A10}
.cab .slot.alt{flex:0 0 auto;background:linear-gradient(180deg,#1B2533,#0F1620);color:var(--cloud);box-shadow:0 0 0 1px #2A3646,0 4px 0 #05070B;font-size:12px;padding:12px 12px 10px}
.cab .slot.alt:before{display:none}
.cab .base{height:14px;margin:0 6px;border-radius:0 0 6px 6px;background:#04060A;box-shadow:0 10px 20px rgba(0,0,0,.6)}
.cab .tag{position:absolute;top:80px;right:20px;z-index:3;font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.16em;color:#1A1206;background:var(--gold);padding:4px 8px;border-radius:3px;transform:rotate(4deg);box-shadow:0 4px 10px rgba(0,0,0,.5)}
.arc .exit{text-align:center;padding:clamp(40px,5vw,70px) 16px 0}
.arc .exit p{font-family:var(--sign);font-size:clamp(20px,2.6vw,32px);letter-spacing:.06em;color:var(--cloud);margin:0;text-shadow:0 0 18px rgba(236,201,129,.35)}
.arc .exit small{display:block;margin-top:12px;font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--slate)}
@media (prefers-reduced-motion:reduce){.arc .hall:before,.arc .sign .flk,.arc .coin,.arc .ticker div,.cab:hover .crt .ps,.cab .bulbs,.cab .crt .att,.cab .crt.live video{animation:none}.arc .ticker div{padding-left:16px}}
#arcModal{position:fixed;inset:0;z-index:1000;background:#020305;display:flex;flex-direction:column}
#arcModal[hidden]{display:none}
/* the site mint bar sits on the top layer of every page; on a phone it covered the bottom of every game (JUMP, BRAKE, the rods) */
html.arc-playing #ny-mintbar{display:none!important}
#arcModal .mhead{display:flex;align-items:center;gap:12px;padding:10px 16px;padding-top:calc(10px + env(safe-area-inset-top));background:#050608;border-bottom:2px solid #1B1F28;font-family:var(--mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase}
#arcModal .mhead span{flex:1;color:var(--gold);text-shadow:0 0 8px rgba(236,201,129,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#arcModal .mhead a,#arcModal .mhead button{font:inherit;color:var(--cloud);background:#0F1620;border:1px solid #2A3646;border-radius:6px;padding:8px 12px;cursor:pointer;text-decoration:none;letter-spacing:.14em}
#arcModal iframe{flex:1;width:100%;border:0;display:block;background:#020305}
"""


def cab(g):
    second = (f'<a class="slot alt" href="{g["token"]}" target="_blank" rel="noopener">Token</a>' if g.get("token")
              else f'<a class="slot alt" href="{g["page"]}">Page</a>' if g.get("page")
              else f'<a class="slot alt" href="{src_of(g)}" target="_blank" rel="noopener">Tab</a>')
    tag = '<span class="tag">MINTED</span>' if g.get("token") else ""
    name = esc(g["name"])
    n = FLOOR.index(g["id"]) + 1
    return f"""<article class="cab" data-game="{g['id']}" style="--lc:var({LINE[g['id']]})">{tag}<div class="shell">
<div class="marq"><i class="bulbs" aria-hidden="true"></i><b>{name}</b></div>
<div class="bezel"><button type="button" class="crt" data-play="{src_of(g)}" data-name="{name}" aria-label="Play {name}"><img src="{cover_of(g)}" alt="{name} by MLow" loading="lazy" decoding="async"><video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-src="assets/arcade/attract-{g['id']}.mp4"></video><span class="att" aria-hidden="true">INSERT COIN</span><span class="ps">PRESS START</span></button></div>
<div class="panel" aria-hidden="true"><span class="stick"></span><span class="b b1"></span><span class="b b2"></span><span class="b b3"></span><em>1P</em></div>
<div class="door"><div class="plate"><span class="no">No. {n:02d}</span><span class="genre">{GENRE[g['id']]}</span></div><p class="card-txt">{esc(g['line'])}</p><p class="how">{esc(g['how'])}</p>
<div class="slots"><button type="button" class="slot" data-play="{src_of(g)}" data-name="{name}">Play</button>{second}</div></div>
</div><div class="base"></div></article>"""


body = f"""<main class="arc">
<section class="hall">
<div>
<p class="over">NEW YORKERS · OPEN ALL NIGHT</p>
<h1 class="sign"><span class="flk">MLOW</span><span class="two">ARCADE</span></h1>
<p class="lede">Eight cabinets, all of them MLow's. A flood to outrun, a trail to survive, a cab to drive, a casino where you bet petals. Free play, phone or desk, no wallet.</p>
<div class="booth"><div class="led" aria-live="polite">CREDIT <b id="credits">00</b></div><button type="button" class="coin" id="insertCoin">INSERT COIN</button></div>
</div>
</section>
<div class="ticker" aria-hidden="true"><div>{esc(TICK)} · {esc(TICK)}</div></div>
<section class="floor" id="floor">
<div class="wrap">
<div class="head"><p>THE FLOOR · PICK A CABINET</p><h2>Free play tonight</h2></div>
<div class="rows">{"".join(cab(g) for g in CABS)}</div>
<div class="exit"><p>The art always wins.</p><small>Every game is one file with everything inside it. Blossom Flap and The Blossom Trail are minted on SuperRare.</small></div>
</div>
</section>
</main>
<div id="arcModal" hidden><div class="mhead"><span id="mTitle"></span><a id="mNew" href="arcade.html" target="_blank" rel="noopener">New tab</a><button type="button" id="mClose">Exit</button></div><iframe id="mFrame" title="MLOW ARCADE game" allow="fullscreen; clipboard-write; autoplay"></iframe></div>"""

script = """<script>
(function(){
"use strict";
var credits = 0, cEl = document.getElementById("credits"), ac = null;
function pad(n){ return (n < 10 ? "0" : "") + n; }
function chime(){
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    var t = ac.currentTime;
    [988, 1319].forEach(function(f, i){
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.08); g.gain.exponentialRampToValueAtTime(0.06, t + i * 0.08 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.16);
      o.connect(g); g.connect(ac.destination); o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.18);
    });
  } catch (e) {}
}
function addCredit(){ credits = Math.min(99, credits + 1); if (cEl) cEl.textContent = pad(credits); chime(); }
var coin = document.getElementById("insertCoin");
if (coin) coin.addEventListener("click", function(){
  addCredit();
  var f = document.getElementById("floor"); if (f) f.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
});
var modal = document.getElementById("arcModal"), frame = document.getElementById("mFrame"), title = document.getElementById("mTitle"), fresh = document.getElementById("mNew");
/* while a game is open the loops stop: they cost decode and battery under a game that fills the screen.
   The loops are stored at 60 fps because Chrome caps the whole page, games included, at a playing video's rate
   (15 fps loops held every game to 15 fps; see ARCADE 2026-09-09/media/attract/README.md). */
function loops(on){
  document.querySelectorAll(".cab video").forEach(function(v){
    if (!on) { v.pause(); return; }
    if (!v.src || calm) return;
    var r = v.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) { var p = v.play(); if (p && p.catch) p.catch(function(){}); }
  });
}
function openGame(src, name){
  addCredit(); loops(false);
  title.textContent = "NOW PLAYING · " + name; fresh.href = src; frame.src = src; modal.hidden = false;
  document.documentElement.style.overflow = "hidden"; document.documentElement.classList.add("arc-playing");
}
function closeGame(){ modal.hidden = true; frame.src = "about:blank"; document.documentElement.style.overflow = ""; document.documentElement.classList.remove("arc-playing"); loops(true); }
/* ATTRACT MODE: a screen plays its loop only while its cabinet is on screen; reduced motion keeps the still cover */
var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
var WORDS = ["INSERT COIN", "FREE PLAY", "PRESS START", "1 CREDIT 1 PLAY", "HIGH SCORE ?"];
document.querySelectorAll(".cab .crt").forEach(function(crt, i){
  var v = crt.querySelector("video"), att = crt.querySelector(".att"), w = i % WORDS.length;
  if (att) setInterval(function(){ w = (w + 1) % WORDS.length; att.textContent = WORDS[w]; }, 2600 + i * 170);
  if (!v || calm || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (e.isIntersecting) {
        if (!modal.hidden) return;
        if (!v.src) { v.src = v.getAttribute("data-src"); v.addEventListener("playing", function(){ crt.classList.add("live"); }, { once: true }); }
        var p = v.play(); if (p && p.catch) p.catch(function(){});
      } else { v.pause(); }
    });
  }, { threshold: 0.35 }).observe(crt);
});
document.querySelectorAll("[data-play]").forEach(function(b){ b.addEventListener("click", function(){ openGame(b.getAttribute("data-play"), b.getAttribute("data-name")); }); });
document.getElementById("mClose").addEventListener("click", closeGame);
document.addEventListener("keydown", function(e){ if (e.key === "Escape" && !modal.hidden) closeGame(); });
})();
</script>"""
check_js(re.search(r"<script>([\s\S]*?)</script>", script).group(1), "arcade.html inline script")
for bad in ("—", "–"):
    if bad in body or bad in script: raise SystemExit("arcade: a dash made it into the page")

jsonld = {"@context": "https://schema.org", "@type": "CollectionPage", "@id": URL + "/arcade", "name": "THE MLOW ARCADE",
          "url": URL + "/arcade", "description": desc, "isPartOf": {"@id": URL + "/#site"},
          "hasPart": [{"@type": "VideoGame", "name": g["name"], "url": f"{URL}/" + (g["page"][:-5] if g.get("page") else f"assets/arcade/{g['file'][:-5]}"),
                       "image": f"{URL}/{cover_of(g)}".replace("/arcade/../", "/"), "description": g["line"], "author": {"@type": "Person", "name": "MLow"},
                       "genre": "Arcade", "gamePlatform": "Web browser", "playMode": "SinglePlayer"} for g in CABS]}
FONTS = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bungee+Inline&family=Bungee&display=swap">'
page = shell(title="The MLow Arcade · NEW YORKERS by MLow", description=desc, body=body, path="arcade.html", active="ARCADE",
             extra_css=extra_css, extra_head=FONTS, jsonld=jsonld, scripts_after=script,
             keywords=["MLow arcade", "NEW YORKERS arcade", "BLOSSOM FLAP", "BLOSSOM TRAIL", "BLOOM RUN", "REDBEARD MEME GARDEN", "BLOSSOM MAXWIN",
                       "MLOW FOOSBALL", "CYCLONE pinball", "MLow Mood Room", "Blossom games", "free browser games", "playable NFT"])
open(os.path.join(SITE, "arcade.html"), "w", encoding="utf-8").write(page)
sizes = {g["id"]: os.path.getsize(os.path.join(DST, g["file"])) // 1024 for g in ALL + [g for g in GARDEN if g.get("file")]}
print(f"arcade.html: {len(CABS)} cabinets on the floor, {len(HIDDEN)} hidden ({', '.join(sorted(HIDDEN))}); files in assets/arcade ({', '.join(f'{k} {v} KB' for k, v in sizes.items())}), scripts parse")
