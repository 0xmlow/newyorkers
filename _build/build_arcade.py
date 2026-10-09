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
ALL = GAMES + PINBALL
EXTRA = ["ranked.html"]
COVERS = ["the-door-cover.png", "the-last-train-cover.png"] + [g["cover"] for g in PINBALL]

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


os.makedirs(DST, exist_ok=True)
vers = {g["id"]: place_game(g) for g in ALL}
for f in EXTRA + COVERS:
    src = os.path.join(SRC, f) if f.endswith(".html") else os.path.join(SRC, "media", f)
    if not os.path.exists(src): raise SystemExit("arcade: missing source " + src)
    shutil.copy2(src, os.path.join(DST, f))
keep = {g["file"] for g in ALL} | set(EXTRA) | set(COVERS)
for f in os.listdir(DST):
    if f not in keep: os.remove(os.path.join(DST, f)); print("  pruned", f)

# ---------- the page ----------
desc = ("THE ARCADE at NEW YORKERS by MLow: six games set in the city, free in the browser. THE DOOR, THE LAST TRAIN and "
        "BODEGA COUNTER, with a daily board, and three 3D pinball tables: CYCLONE, EXPRESS and THE DEUCE.")
extra_css = """
.arc{padding-bottom:clamp(64px,9vw,120px)}
.arc .hero{padding-top:clamp(48px,7vw,96px);padding-bottom:clamp(28px,4vw,48px)}
.arc .hero h1{margin:14px 0 18px}
.arc .hero .lede{max-width:34em;color:var(--slate)}
.arc .games{padding-bottom:clamp(48px,7vw,96px)}
.arc .card{display:flex;flex-direction:column}
.arc .cover{aspect-ratio:16/9;background:#0F1A26 center/cover no-repeat;border-bottom:1px solid var(--divider);position:relative}
.arc .cover.paper{background:var(--paper);display:flex;align-items:center;justify-content:center}
.arc .cover.paper span{font-family:var(--mono);font-weight:600;font-size:clamp(16px,2vw,22px);letter-spacing:.18em;color:#171410;text-align:center;padding:0 20px;line-height:1.5}
.arc .card .cb{display:flex;flex-direction:column;flex:1}
.arc .card .cs{flex:1}
.arc .how{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate);margin:14px 0 0;line-height:1.7}
.arc .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.arc .btn.sm{padding:12px 18px;font-size:12px}
.arc .board .rule-line{color:var(--slate);max-width:44em;margin:14px 0 30px;line-height:1.6}
.arc .board h2{margin:12px 0 0}
.arc .bd{background:var(--card);border:1px solid var(--divider);border-radius:var(--r2);padding:20px 22px}
.arc .bd h3{font-family:var(--sans);font-weight:600;font-size:13px;letter-spacing:.22em;text-transform:uppercase;margin:0 0 14px;color:var(--cloud)}
.arc .bd ol{list-style:none;margin:0;padding:0;font-family:var(--mono);font-size:13px}
.arc .bd li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid var(--divider)}
.arc .bd li:first-child{border-top:0}
.arc .bd li b{font-weight:500;color:var(--cloud);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.arc .bd li i{font-style:normal;color:var(--slate);min-width:2.2em}
.arc .bd li span{color:var(--cyan)}
.arc .bd li.empty{color:var(--slate);border-top:0}
.arc .bd li.me b{color:var(--acid)}
.arc .pin h2{margin:12px 0 0}
.arc .pin .rule-line{color:var(--slate);max-width:44em;margin:14px 0 30px;line-height:1.6}
@media (max-width:900px){.arc .grid3{grid-template-columns:1fr}}
#arcModal{position:fixed;inset:0;z-index:1000;background:#050409;display:flex;flex-direction:column}
#arcModal[hidden]{display:none}
#arcModal .mhead{display:flex;align-items:center;gap:16px;padding:10px 16px;padding-top:calc(10px + env(safe-area-inset-top));border-bottom:1px solid #282C36;background:#080D16;font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--slate)}
#arcModal .mhead span{flex:1;color:var(--cloud);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#arcModal .mhead a,#arcModal .mhead button{font:inherit;color:var(--cloud);background:none;border:1px solid #3B4152;padding:8px 12px;cursor:pointer;text-decoration:none;letter-spacing:.14em}
#arcModal iframe{flex:1;width:100%;border:0;display:block;background:#080D16}
"""


def card(g):
    src = f"assets/arcade/{g['file']}?v={vers[g['id']]}"
    cover = (f'<div class="cover" style="background-image:url(assets/arcade/{g["cover"]})"></div>' if g["cover"]
             else '<div class="cover paper"><span>BODEGA COUNTER<br>OPEN 24 HOURS<br>ATM INSIDE</span></div>')
    return f"""<article class="card" data-game="{g['id']}">{cover}<div class="cb"><div class="ct">{esc(g['name'])}</div><p class="cs">{esc(g['line'])}</p><p class="how">{esc(g['how'])}</p>
<div class="row"><button type="button" class="btn sm" data-play="{src}" data-name="{esc(g['name'])}">Play</button><a class="btn ghost sm" href="{src}" target="_blank" rel="noopener">New tab</a></div></div></article>"""


def board(g):
    return f'<div class="bd" data-board="{g["id"]}"><h3>{esc(g["name"])}</h3><ol id="bd-{g["id"]}"><li class="empty">Reading the board</li></ol></div>'


body = f"""<main class="arc">
<section class="wrap hero">
<p class="kicker">SIX GAMES · A NEW ONE WHEN THE CITY FEELS LIKE IT</p>
<h1 class="h-xl">THE ARCADE</h1>
<p class="lede">Sixty games were drawn up for the city. Six are open tonight: a door, a train, a counter, and three pinball tables. Free, no wallet, phone or desk.</p>
</section>
<section class="wrap games"><div class="grid3">{"".join(card(g) for g in GAMES)}</div></section>
<section class="wrap games pin" id="pinball">
<p class="kicker">NEW YORKERS PINBALL · THREE TABLES</p>
<h2 class="h-l">Pinball</h2>
<p class="rule-line">Three tables built in 3D from the census. Every mode puts a New Yorker on the table: finish it and they are counted, and they stay counted on your device. High scores stay on your device too.</p>
<div class="grid3">{"".join(card(g) for g in PINBALL)}</div>
</section>
<section class="wrap board" id="board">
<p class="kicker">DAILY BOARD · <span id="boardDay"></span></p>
<h2 class="h-l">The top ten, today</h2>
<p class="rule-line">The day's top score on THE DOOR and on THE LAST TRAIN gets a New Yorker. Winners are read off this board at midnight New York time. BODEGA COUNTER keeps no score, so it has no board.</p>
<div class="grid3">{"".join(board(g) for g in GAMES if g.get("board", True))}</div>
</section>
</main>
<div id="arcModal" hidden><div class="mhead"><span id="mTitle"></span><a id="mNew" href="arcade.html" target="_blank" rel="noopener">New tab</a><button type="button" id="mClose">Close</button></div><iframe id="mFrame" title="NEW YORKERS Arcade game" allow="fullscreen; clipboard-write"></iframe></div>"""

script = """<script>
(function(){
"use strict";
var GAMES = %(games)s;
var day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
var el = document.getElementById("boardDay"); if (el) el.textContent = day;
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; }); }
function fmt(g, s){ return g === "bodega" ? "$" + (s / 100).toFixed(2) : String(s).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ","); }
function myName(){ try { return localStorage.getItem("ny_arcade_name") || ""; } catch (e) { return ""; } }
function loadBoard(g){
  var ol = document.getElementById("bd-" + g); if (!ol) return;
  fetch("/api/score?game=" + encodeURIComponent(g) + "&day=" + encodeURIComponent(day), { cache: "no-store" })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      var top = (j && j.top) || [], me = myName();
      if (!top.length) { ol.innerHTML = '<li class="empty">No scores yet today. Be the first name on it.</li>'; return; }
      ol.innerHTML = top.map(function(r, i){
        return '<li' + (me && r.name === me ? ' class="me"' : "") + '><i>' + (i + 1) + '</i><b>' + esc(r.name) + '</b><span>' + fmt(g, r.score) + '</span></li>';
      }).join("");
    })
    .catch(function(){ ol.innerHTML = '<li class="empty">The board is not reachable right now.</li>'; });
}
function loadAll(){ GAMES.forEach(loadBoard); }
loadAll();
var modal = document.getElementById("arcModal"), frame = document.getElementById("mFrame"), title = document.getElementById("mTitle"), fresh = document.getElementById("mNew");
function openGame(src, name){
  title.textContent = name; fresh.href = src; frame.src = src; modal.hidden = false;
  document.documentElement.style.overflow = "hidden";
}
function closeGame(){
  modal.hidden = true; frame.src = "about:blank"; document.documentElement.style.overflow = "";
  loadAll();
}
document.querySelectorAll("[data-play]").forEach(function(b){ b.addEventListener("click", function(){ openGame(b.getAttribute("data-play"), b.getAttribute("data-name")); }); });
document.getElementById("mClose").addEventListener("click", closeGame);
document.addEventListener("keydown", function(e){ if (e.key === "Escape" && !modal.hidden) closeGame(); });
window.addEventListener("message", function(e){ var d = e.data || {}; if (d.ny === "score" && d.game) loadBoard(d.game); });
})();
</script>""" % {"games": json.dumps([g["id"] for g in GAMES if g.get("board", True)])}
check_js(re.search(r"<script>([\s\S]*?)</script>", script).group(1), "arcade.html inline script")

jsonld = {"@context": "https://schema.org", "@type": "CollectionPage", "@id": URL + "/arcade", "name": "THE ARCADE",
          "url": URL + "/arcade", "description": desc, "isPartOf": {"@id": URL + "/#site"},
          "hasPart": [{"@type": "VideoGame", "name": g["name"], "url": f"{URL}/assets/arcade/{g['file'][:-5]}", "description": g["line"],
                       "author": {"@type": "Person", "name": "MLow"}, "genre": "Arcade", "gamePlatform": "Web browser", "playMode": "SinglePlayer"}
                      for g in ALL]}
page = shell(title="The Arcade · NEW YORKERS by MLow", description=desc, body=body, path="arcade.html", active="ARCADE",
             extra_css=extra_css, jsonld=jsonld, scripts_after=script,
             keywords=["NEW YORKERS arcade", "MLow", "THE DOOR game", "THE LAST TRAIN game", "BODEGA COUNTER", "NYC browser games", "daily leaderboard", "NYC pinball", "3D pinball"])
open(os.path.join(SITE, "arcade.html"), "w", encoding="utf-8").write(page)
sizes = {g["id"]: os.path.getsize(os.path.join(DST, g["file"])) // 1024 for g in ALL}
print(f"arcade.html: {len(ALL)} games in assets/arcade ({', '.join(f'{k} {v} KB' for k, v in sizes.items())}), bridge appended, scripts parse")
