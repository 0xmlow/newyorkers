#!/usr/bin/env python3
"""skelly.html, SKELLY CUP: NEW YORKERS riders on Bryan Brinkman's Marble Run.

Marble Run (marblerun.fun, by Bryan Brinkman) races 100 marbles forever, five to a race, from
seeds anyone can verify. Skelly is the New York street game of bottle caps on a chalk board. Five
lanes become five boroughs, every marble gets a painted New Yorker as its rider, and every
champion gets a portrait. The page is loud on purpose: a ticker, a gate clock, last call, the
bracket shrinking from 100, crowd heat per lane, streaks, finish splashes. All of it is free.
Nothing is staked, nothing pays out in money, and no odds are shown: Bryan's API page says Marble
Run is not a betting product, and this page holds the same line.

Reads  _build/skelly/cast.json        the 100 riders, one census piece per marble
       _build/skelly/champions.json   the Champion's Portraits (written by publish_portraits.py)
       api/pieces.json                each rider's story line
       assets/skelly/*.jpg            the portraits
Writes assets/skelly/riders.json      marble id to rider: name, piece, title, thumb, story, borough
       skelly.html

Live data: marblerun.fun in the browser (one WebSocket, plus /api/hall-of-fame and /api/state on
a new tournament). Picks and crowd heat: our /api/skelly (functions/api/skelly.js, D1).
"""
import json, os
from page_shell import shell, cfg, esc

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
OUT = os.path.join(SITE, "assets", "skelly")
os.makedirs(OUT, exist_ok=True)
URL = cfg()["siteUrl"]

cast = json.load(open(os.path.join(HERE, "skelly", "cast.json")))["cast"]
champs = json.load(open(os.path.join(HERE, "skelly", "champions.json")))
PIECES = {p["n"]: p for p in json.load(open(os.path.join(SITE, "api", "pieces.json")))}
assert len(cast) == 100 and len({c["marbleId"] for c in cast}) == 100, "need one rider per marble"
for ch in champs:
    assert os.path.exists(os.path.join(SITE, ch["image"])), "missing portrait " + ch["image"]

def thumb(u):
    return u.split("n3wyorkers.com/", 1)[-1]

def first_line(s):
    s = (s or "").strip()
    return (s.split(". ")[0].rstrip(".") + ".") if s else ""

riders = {c["marbleId"]: {"m": c["marble"], "n": c["piece"], "t": c["title"], "i": thumb(c["image"]),
                          "s": first_line(PIECES.get(c["piece"], {}).get("story")), "b": c.get("borough") or ""} for c in cast}
json.dump(riders, open(os.path.join(OUT, "riders.json"), "w"), ensure_ascii=False, separators=(",", ":"))

latest = max(champs, key=lambda c: c["tournamentId"]) if champs else None
next_t = (latest["tournamentId"] + 1) if latest else 1
titles = {}
for ch in champs:
    titles[ch["marble"]] = titles.get(ch["marble"], 0) + 1

champ_html = "".join(f"""
  <figure class="sk-champ{' fresh' if ch is latest else ''}">
    <a href="{esc(ch['image'])}" target="_blank" rel="noopener"><img src="{esc(ch['thumb'])}" alt="{esc(ch['title'])}" loading="lazy" width="1280" height="720"></a>
    <figcaption><small>TOURNAMENT {ch['tournamentId']} · {esc(ch['borough']).upper()} LANE{' · FRESH PAINT' if ch is latest else ''}</small><b>{esc(ch['title'])}</b>
    <span>{esc(ch['marble'])}, ridden by <a href="n/{ch['piece']}">{esc(ch['rider'])}</a>.</span>
    <code title="Master seed, revealed by Marble Run when the tournament closed">SEED {esc(ch['seed'])}</code></figcaption>
  </figure>""" for ch in sorted(champs, key=lambda c: -c["tournamentId"]))

empty_frame = f"""
  <figure class="sk-champ sk-empty">
    <div class="sk-frame"><span>?</span><em>UNPAINTED</em></div>
    <figcaption><small>TOURNAMENT {next_t} · RUNNING NOW</small><b>This frame is empty.</b>
    <span>Whoever wins tournament {next_t} gets painted next. Blow on the final and your seed is part of the number printed under it, forever.</span></figcaption>
  </figure>"""

cast_html = "".join(f"""<a href="n/{c['piece']}" class="sk-r" id="r{c['marbleId']}"><img src="{esc(thumb(c['image']))}" alt="" loading="lazy" width="320" height="180"><b>{esc(c['marble'])}{(' <i>' + '★' * titles[c['marble']] + '</i>') if c['marble'] in titles else ''}</b><small>{esc(c['title'])}</small></a>"""
                    for c in sorted(cast, key=lambda c: c["marbleId"]))

alive_html = "".join(f"""<a href="#r{c['marbleId']}" class="sk-a" data-id="{c['marbleId']}" title="{esc(c['marble'])}"><img src="{esc(thumb(c['image']))}" alt="" loading="lazy" width="64" height="36"><span>{esc(c['marble'])}</span></a>"""
                     for c in sorted(cast, key=lambda c: c["marbleId"]))

css = """
.sk-tick{position:relative;background:#ffcc00;color:#111;overflow:hidden;white-space:nowrap;font:700 12px/30px "IBM Plex Mono",monospace;letter-spacing:1px;border-bottom:2px solid #111}
.sk-tick div{display:inline-block;padding-left:100%;animation:skt 60s linear infinite}
.sk-tick span{margin-right:42px}
@keyframes skt{to{transform:translateX(-100%)}}
@media (prefers-reduced-motion:reduce){.sk-tick div{animation:none;padding-left:16px}}
.sk-hero{padding:26px 0 6px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end}
@media (max-width:820px){.sk-hero{grid-template-columns:1fr}}
.sk-hero h1{font:900 clamp(52px,11vw,140px)/.82 Fraunces,serif;margin:0;letter-spacing:-3px}
.sk-hero h1 span{color:#ffcc00}
.sk-hero .dek{font:600 clamp(16px,2.2vw,22px)/1.3 "Space Grotesk",sans-serif;margin:14px 0 0;max-width:760px}
.sk-cred{display:inline-flex;gap:8px;align-items:center;margin-top:14px;padding:7px 12px;border:1px solid rgba(127,127,127,.4);border-radius:999px;font:600 12px "IBM Plex Mono",monospace;color:inherit;text-decoration:none}
.sk-cred b{color:#ffcc00}
.sk-gate{text-align:right}
.sk-gate small{display:block;font:600 11px "IBM Plex Mono",monospace;letter-spacing:2px;opacity:.65}
.sk-gate strong{display:block;font:900 clamp(56px,9vw,110px)/.9 "IBM Plex Mono",monospace;color:#ffcc00}
.sk-gate.last strong{color:#ff4d2e;animation:skp .5s ease-in-out infinite alternate}
@keyframes skp{to{opacity:.35}}
@media (max-width:820px){.sk-gate{text-align:left}}
.sk-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:rgba(127,127,127,.25);border:1px solid rgba(127,127,127,.25);margin:20px 0}
@media (max-width:820px){.sk-stats{grid-template-columns:repeat(2,1fr)}.sk-stats div:last-child{grid-column:span 2}}
.sk-stats div{background:var(--bg,#0d0d0d);padding:12px 14px}
.sk-stats b{display:block;font:900 30px/1 Fraunces,serif}
.sk-stats span{font:600 10px "IBM Plex Mono",monospace;letter-spacing:1.5px;opacity:.6}
.sk-prog{height:6px;background:rgba(127,127,127,.25);margin:-14px 0 18px;position:relative}
.sk-prog i{position:absolute;left:0;top:0;bottom:0;background:#ffcc00;transition:width .6s}
.sk-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(320px,1fr);gap:18px;margin:6px 0 18px}
@media (max-width:900px){.sk-grid{grid-template-columns:1fr}}
.sk-tv{position:relative;aspect-ratio:16/10;background:#000;border:6px solid #2b2d33;border-radius:10px;overflow:hidden}
.sk-tv iframe{width:100%;height:100%;border:0}
.sk-tv .bug{position:absolute;left:10px;top:8px;font:700 11px "IBM Plex Mono",monospace;background:#ff4d2e;color:#fff;padding:3px 7px;letter-spacing:1px;z-index:2}
.sk-tv .credit{position:absolute;right:10px;bottom:8px;font:600 10px "IBM Plex Mono",monospace;background:rgba(0,0,0,.6);color:#fff;padding:3px 7px;z-index:2;text-decoration:none}
.sk-card{border:1px solid rgba(127,127,127,.25);border-radius:4px;padding:14px;margin-bottom:16px}
.sk-card h2,.sk-k{font:600 11px/1 "IBM Plex Mono",monospace;letter-spacing:2px;text-transform:uppercase;color:#ffcc00;margin:0 0 12px}
.sk-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.sk-head b{font:900 26px/1 Fraunces,serif}
.sk-phase{font:700 11px "IBM Plex Mono",monospace;padding:3px 7px;border-radius:2px;background:#3ddc84;color:#111}
.sk-phase.run{background:#ff4d2e;color:#fff}.sk-phase.done{background:#9a978e}
.sk-meta{font:11px "IBM Plex Mono",monospace;opacity:.55;margin-top:6px;word-break:break-all}
.sk-lanes{display:grid;gap:8px;margin-top:12px}
.sk-lane{position:relative;overflow:hidden;display:grid;grid-template-columns:58px 1fr auto;align-items:center;gap:10px;padding:8px 10px;border:1px solid rgba(127,127,127,.3);border-radius:4px;background:transparent;color:inherit;font:inherit;text-align:left;width:100%;cursor:pointer}
.sk-lane:hover:not([disabled]){border-color:#ffcc00}
.sk-lane[disabled]{cursor:default}
.sk-lane.picked{border-color:#ffcc00;box-shadow:0 0 0 1px #ffcc00 inset}
.sk-lane.won{border-color:#3ddc84;background:rgba(61,220,132,.1)}
.sk-lane .heat{position:absolute;left:0;bottom:0;height:3px;background:#ff4d2e;transition:width .6s}
.sk-rider{position:relative;width:54px;height:54px}
.sk-rider img{width:54px;height:54px;object-fit:cover;border-radius:3px;display:block}
.sk-rider i{position:absolute;right:-5px;bottom:-5px;width:22px;height:22px;border-radius:50%;box-shadow:inset -4px -5px 8px rgba(0,0,0,.45),inset 3px 3px 6px rgba(255,255,255,.35)}
.sk-lane .nm{font-weight:700;font-size:16px}
.sk-lane small{opacity:.65;font-size:12px;display:block;line-height:1.3}
.sk-lane .form{font:600 10px "IBM Plex Mono",monospace;opacity:.8;margin-top:3px;letter-spacing:.5px}
.sk-lane .rk{font:900 24px Fraunces,serif;text-align:right;min-width:30px}
.sk-lane .tag{font:700 9px "IBM Plex Mono",monospace;padding:2px 5px;border-radius:2px;margin-left:4px;vertical-align:middle}
.tag.hot{background:#ff4d2e;color:#fff}.tag.champ{background:#ffcc00;color:#111}.tag.cold{background:#5bc0de;color:#111}
.sk-name{display:flex;gap:8px;margin-top:12px}
.sk-name input{flex:1;font:inherit;padding:10px;border-radius:4px;border:1px solid rgba(127,127,127,.4);background:transparent;color:inherit}
.sk-btns{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}
.sk-blow{padding:14px;font:900 22px/1 Fraunces,serif;background:#ffcc00;color:#111;border:0;border-radius:4px;cursor:pointer}
.sk-blow[disabled]{background:#3a3c42;color:#9a978e;cursor:default}
.sk-snd{padding:0 14px;border:1px solid rgba(127,127,127,.4);border-radius:4px;background:transparent;color:inherit;font:600 11px "IBM Plex Mono",monospace;cursor:pointer}
.sk-note{font-size:12px;opacity:.65;margin-top:8px;line-height:1.45}
.sk-you{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center}
.sk-you b{display:block;font:900 30px/1 Fraunces,serif;color:#ffcc00}
.sk-you span{font:600 9px "IBM Plex Mono",monospace;letter-spacing:1px;opacity:.6}
.sk-board{width:100%;border-collapse:collapse;font-size:14px}
.sk-board td,.sk-board th{padding:6px 6px 6px 0;border-bottom:1px solid rgba(127,127,127,.2);text-align:left}
.sk-board th{font:600 10px "IBM Plex Mono",monospace;letter-spacing:1px;opacity:.6}
.sk-bars{display:grid;gap:7px}.sk-bar{display:grid;grid-template-columns:110px 1fr 36px;gap:8px;align-items:center;font-size:13px}.sk-bar div{height:12px;border-radius:2px;transition:width .6s}
.sk-log{max-height:260px;overflow:auto;font-size:13px}.sk-log p{margin:0 0 7px;opacity:.8}.sk-log p b{opacity:1}
.sk-sec{margin:44px 0}
.sk-sec h2.big{font:900 clamp(32px,5vw,58px)/.95 Fraunces,serif;margin:0 0 8px}
.sk-sec h2.big span{color:#ffcc00}
.sk-fine{font-size:15px;opacity:.78;max-width:780px;line-height:1.55}
.sk-alive{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px;margin-top:14px}
.sk-a{position:relative;display:block;color:inherit;text-decoration:none;transition:opacity .4s,filter .4s}
.sk-a img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:2px;display:block}
.sk-a span{display:block;font:600 9px/1.2 "IBM Plex Mono",monospace;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sk-a.out{opacity:.22;filter:grayscale(1)}
.sk-a.out::after{content:"OUT";position:absolute;left:4px;top:4px;font:700 9px "IBM Plex Mono",monospace;background:#111;color:#ff4d2e;padding:1px 4px}
.sk-a.racing img{outline:2px solid #ff4d2e}
.sk-champs{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.sk-champ{margin:0}.sk-champ img{width:100%;height:auto;display:block;border-radius:3px}
.sk-champ.fresh img{outline:3px solid #ffcc00}
.sk-champ figcaption{display:flex;flex-direction:column;gap:4px;padding-top:9px}
.sk-champ small{font:600 10px "IBM Plex Mono",monospace;letter-spacing:1.5px;opacity:.65}
.sk-champ b{font:900 23px/1.05 Fraunces,serif}
.sk-champ code{font-size:10px;opacity:.5;word-break:break-all}
.sk-frame{aspect-ratio:16/9;border:3px dashed rgba(255,204,0,.6);border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
.sk-frame span{font:900 90px/1 Fraunces,serif;color:#ffcc00}
.sk-frame em{font:700 12px "IBM Plex Mono",monospace;letter-spacing:3px;font-style:normal;opacity:.7}
.sk-hof{width:100%;border-collapse:collapse;font-size:15px;max-width:640px}
.sk-hof td{padding:7px 8px 7px 0;border-bottom:1px solid rgba(127,127,127,.2)}
.sk-rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;counter-reset:r}
.sk-rules li{list-style:none;border:1px solid rgba(127,127,127,.25);border-radius:4px;padding:14px;counter-increment:r}
.sk-rules li::before{content:counter(r);display:block;font:900 40px/1 Fraunces,serif;color:#ffcc00;margin-bottom:6px}
.sk-rules b{display:block;font-size:16px;margin-bottom:4px}
.sk-engine{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(260px,1fr);gap:24px;align-items:start}
@media (max-width:820px){.sk-engine{grid-template-columns:1fr}}
.sk-engine ol{padding-left:20px;line-height:1.55}.sk-engine li{margin-bottom:8px}
.sk-bryan{border:1px solid rgba(127,127,127,.3);border-radius:4px;overflow:hidden}
.sk-bryan img{width:100%;display:block}
.sk-bryan div{padding:12px 14px}.sk-bryan b{font:900 22px Fraunces,serif;display:block}
.sk-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.sk-links a{font:600 11px "IBM Plex Mono",monospace;padding:6px 9px;border:1px solid rgba(127,127,127,.4);border-radius:3px;color:inherit;text-decoration:none}
.sk-links a:hover{border-color:#ffcc00}
.sk-cast{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.sk-r{color:inherit;text-decoration:none}.sk-r img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:3px;display:block}
.sk-r b{display:block;margin-top:5px;font-size:14px}.sk-r b i{color:#ffcc00;font-style:normal}.sk-r small{display:block;font-size:11px;opacity:.6;line-height:1.3}
.sk-splash{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .25s}
.sk-splash.on{opacity:1;pointer-events:auto}
.sk-splash .in{max-width:760px;width:100%;text-align:center;color:#fff}
.sk-splash img{width:100%;max-height:52vh;object-fit:cover;border-radius:4px}
.sk-splash h3{font:900 clamp(40px,8vw,88px)/.9 Fraunces,serif;margin:14px 0 6px;color:#ffcc00}
.sk-splash.rekt h3{color:#ff4d2e}
.sk-splash p{font-size:17px;margin:6px 0}
.sk-splash .acts{display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap}
.sk-splash .acts a,.sk-splash .acts button{font:700 13px "IBM Plex Mono",monospace;padding:10px 14px;border-radius:3px;border:0;background:#ffcc00;color:#111;cursor:pointer;text-decoration:none}
.sk-splash .acts button.x{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4)}
.sk-conf{position:fixed;inset:0;pointer-events:none;z-index:61}
"""

body = f"""
<div class="sk-tick" aria-hidden="true"><div id="skTick"><span>SKELLY CUP IS LIVE</span><span>100 MARBLES · 5 BOROUGHS · ONE CHAMPION EVERY 100 MINUTES · FOREVER</span><span>ENGINE BY BRYAN BRINKMAN · MARBLERUN.FUN</span><span>EVERY CHAMPION GETS PAINTED</span><span>FREE TO PLAY · NOTHING STAKED · NOT A BET</span></div></div>
<main class="wrap">
<section class="sk-hero">
  <div>
    <h1>SKELLY <span>CUP</span></h1>
    <p class="dek">A hundred marbles, a hundred painted New Yorkers riding them, five lanes, five boroughs. A race every four minutes. A champion every hundred. It never stops, and every champion gets painted.</p>
    <a class="sk-cred" href="https://marblerun.fun" target="_blank" rel="noopener">THE ENGINE <b>MARBLE RUN</b> BY BRYAN BRINKMAN ↗</a>
  </div>
  <div class="sk-gate" id="skGate"><small id="skGateLbl">NEXT GATE</small><strong id="skClock">--</strong></div>
</section>

<div class="sk-stats">
  <div><b id="stT">T{next_t}</b><span>TOURNAMENT</span></div>
  <div><b id="stR">0/25</b><span>RACES RUN</span></div>
  <div><b id="stA">100</b><span>STILL ALIVE</span></div>
  <div><b id="stS">0</b><span>SEEDS BLOWN</span></div>
  <div><b id="stC">{len(champs)}</b><span>CHAMPIONS PAINTED</span></div>
</div>
<div class="sk-prog"><i id="skProg" style="width:0"></i></div>

<div class="sk-grid">
  <section>
    <div class="sk-tv"><span class="bug">BODEGA TV · LIVE</span><a class="credit" href="https://marblerun.fun" target="_blank" rel="noopener">MARBLE RUN BY BRYAN BRINKMAN ↗</a><iframe src="https://marblerun.fun/" title="Marble Run by Bryan Brinkman, live" loading="lazy" allow="autoplay"></iframe></div>
    <div class="sk-card" style="margin-top:16px"><h2>Borough Wars, this tournament</h2><div class="sk-bars" id="skBoros"></div>
      <div class="sk-note">The lane a marble draws is its borough for that race. Win 5, second 3, third 1. Pick your borough and scream.</div></div>
    <div class="sk-card"><h2>The wire</h2><div class="sk-log" id="skLog"><p>Tuning in to Bryan's feed...</p></div></div>
  </section>
  <aside>
    <div class="sk-card">
      <div class="sk-head"><b id="skTitle">Waiting on the gate</b><span class="sk-phase" id="skPhase">--</span></div>
      <div class="sk-meta" id="skMeta"></div>
      <div class="sk-lanes" id="skLanes"></div>
      <div class="sk-name"><input id="skName" maxlength="16" placeholder="Your name on the board" autocomplete="nickname"></div>
      <div class="sk-btns"><button class="sk-blow" id="skBlow" disabled>BLOW ON IT</button><button class="sk-snd" id="skSnd" aria-pressed="false">SOUND OFF</button></div>
      <div class="sk-note">Tap a lane to call it. Then blow on it: 32 random bytes from your phone go straight into Bryan's race seed and get printed in the result forever. The red bar is the crowd. Free. Nothing staked. Not a bet.</div>
    </div>
    <div class="sk-card"><h2>Your card</h2>
      <div class="sk-you"><div><b id="yCalls">0</b><span>CALLS</span></div><div><b id="yHits">0</b><span>WINNERS</span></div><div><b id="yStreak">0</b><span>STREAK</span></div><div><b id="yBest">0</b><span>BEST</span></div></div>
      <div class="sk-note" id="yLine">Call a race to start a streak. Three winners in a row and the ticker knows your name.</div></div>
    <div class="sk-card"><h2>The board, tournament <span id="bT">{next_t}</span></h2>
      <table class="sk-board"><thead><tr><th>#</th><th>Name</th><th>Pts</th><th>Winners</th></tr></thead><tbody id="skBoard"><tr><td colspan="4">Loading</td></tr></tbody></table>
      <div class="sk-note">5 for the winner, 2 for second, 1 when your blown seed made it into the race. Scored from Bryan's published results, not from anything your phone says.</div></div>
  </aside>
</div>

<section class="sk-sec">
  <h2 class="big">STILL <span id="aliveN">ALIVE</span></h2>
  <p class="sk-fine">Heat winners go through. Everybody else goes home until the next tournament. Watch the field shrink from a hundred to five to one. When they're gone, they're gone.</p>
  <div class="sk-alive" id="skAlive">{alive_html}</div>
</section>

<section class="sk-sec">
  <h2 class="big">THE CHAMPION'S <span>PORTRAITS</span></h2>
  <p class="sk-fine">Every champion gets a painting. The rider is the subject, and the master seed Bryan's engine reveals when the tournament closes is printed under it: the proof nobody chose the winner, not us, not Bryan, not you. Blow on a final and your seed is folded into that race forever.</p>
  <div class="sk-champs">{empty_frame}{champ_html}</div>
</section>

<section class="sk-sec">
  <h2 class="big">HALL OF <span>FAME</span></h2>
  <table class="sk-hof"><tbody id="skHof"><tr><td>Loading the hall from Marble Run...</td></tr></tbody></table>
</section>

<section class="sk-sec">
  <h2 class="big">RULES OF THE <span>STOOP</span></h2>
  <ol class="sk-rules">
    <li><b>Read the gate.</b>Every race is announced thirty seconds before it drops: five marbles, five riders, five boroughs. The clock up top is the only clock that matters.</li>
    <li><b>Call it.</b>Tap one lane before the gate. One call per race. After the gate, the server says no. Nobody calls a race they already saw.</li>
    <li><b>Blow on it.</b>Your phone sends 32 random bytes into the race seed. If they show up in Bryan's published seeds, you get a point and a receipt forever.</li>
    <li><b>Ride the streak.</b>Winners stack. Seconds count. Your board resets every tournament, your best streak never does.</li>
    <li><b>Get painted.</b>Champions get portraits. Ride with them to the end and blow on the final.</li>
  </ol>
</section>

<section class="sk-sec sk-engine">
  <div>
    <h2 class="big">THE ENGINE IS <span>BRYAN'S</span></h2>
    <p class="sk-fine">Every marble, every course, every frame of physics on this page is Marble Run by Bryan Brinkman. We painted the riders and drew the chalk. Bryan built the thing that cannot be rigged, and he opened it to everyone with a free public API.</p>
    <ol class="sk-fine">
      <li><b>Two numbers decide a race.</b> A track seed builds the course, a race seed drives the physics. Same two numbers, same finish, on any machine. The sim is open source.</li>
      <li><b>The house seed is locked first.</b> Each tournament commits a 256 bit master seed by publishing only its hash. It is revealed at the end and anyone can check it matches.</li>
      <li><b>The public half arrives last.</b> At the gate, a drand randomness beacon pulse and every seed blown in by players get hashed into the race. Nobody, Bryan included, knows the result before the gate.</li>
      <li><b>Replay anything.</b> Take any race from the history, load the sim, run the seeds. The marbles finish in the same order. That is the whole trick, and it is beautiful.</li>
    </ol>
    <div class="sk-links">
      <a href="https://marblerun.fun" target="_blank" rel="noopener">MARBLERUN.FUN ↗</a>
      <a href="https://marblerun.fun/api" target="_blank" rel="noopener">THE API ↗</a>
      <a href="https://github.com/bryanbrinkman/marblefun" target="_blank" rel="noopener">THE SOURCE ↗</a>
      <a href="https://marblerun.fun/champions" target="_blank" rel="noopener">HIS HALL OF CHAMPIONS ↗</a>
      <a href="https://x.com/bryanbrinkman" target="_blank" rel="noopener">@BRYANBRINKMAN ↗</a>
      <a href="https://bryanbrinkman.com" target="_blank" rel="noopener">BRYANBRINKMAN.COM ↗</a>
    </div>
  </div>
  <a class="sk-bryan" href="h/bryan-brinkman" style="color:inherit;text-decoration:none">
    <img src="assets/cards/bryan-brinkman-636923ce.jpg" alt="Bryan Brinkman, painted by MLow" loading="lazy">
    <div><b>Bryan Brinkman</b><span class="sk-note">Counted in the NEW YORKERS honoraries: NimBuds at the Warehouse. Artist, builder of Marble Run.</span></div>
  </a>
</section>

<section class="sk-sec">
  <h2 class="big">THE HUNDRED <span>RIDERS</span></h2>
  <p class="sk-fine">Every Marble Run marble keeps the name Bryan gave it. Each one rides with a New Yorker from the census. Stars are titles.</p>
  <div class="sk-cast">{cast_html}</div>
</section>

<section class="sk-sec">
  <p class="sk-fine">Race data, seeds, courses and the simulation are Bryan Brinkman's <a href="https://marblerun.fun/api" rel="noopener">Marble Run API</a>, read live and verifiable by anyone. SKELLY CUP is a free game: no entry, no stake, no odds, no money paid out. Points and portraits are for glory. Art, not an investment.</p>
</section>
</main>
<div class="sk-splash" id="skSplash" role="dialog" aria-live="assertive"><div class="in"><img id="spImg" alt=""><h3 id="spH"></h3><p id="spP"></p><div class="acts" id="spActs"></div></div></div>
<canvas class="sk-conf" id="skConf"></canvas>
"""

js = r"""
<script>
(function(){
  var API = "https://marblerun.fun", B = (window.NY && NY.BASE) || "";
  var BORO = {RED:"Brooklyn", BLUE:"Manhattan", YELLOW:"Queens", GREEN:"Staten Island", CREAM:"The Bronx"};
  var BCOL = {Brooklyn:"#d9534f", Manhattan:"#5bc0de", Queens:"#f0ad4e", "Staten Island":"#5cb85c", "The Bronx":"#ede0c8"};
  var ROUND = {heats:"HEAT", semis:"SEMI", final:"THE FINAL"};
  var $ = function(id){ return document.getElementById(id); };
  var esc = function(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); };
  var get = function(k, d){ try { var v = localStorage.getItem("skelly:" + k); return v ? JSON.parse(v) : d; } catch(e) { return d; } };
  var put = function(k, v){ try { localStorage.setItem("skelly:" + k, JSON.stringify(v)); } catch(e) {} };
  var R = {}, HOF = {}, rounds = [], standings = [], race = null, tid = null, skew = 0, crowd = {}, crowdTotal = 0;
  var mine = get("mine", {}), me = get("me", {calls:0, hits:0, streak:0, best:0}), sound = get("sound", false), lastCallShown = null;

  fetch(B + "assets/skelly/riders.json").then(function(r){ return r.json(); }).then(function(j){ R = j; paint(); }).catch(function(){});
  fetch(API + "/api/hall-of-fame").then(function(r){ return r.json(); }).then(hof).catch(function(){ $("skHof").innerHTML = "<tr><td>The hall is on marblerun.fun/champions.</td></tr>"; });
  $("skName").value = get("name", "");
  $("skName").addEventListener("change", function(){ put("name", $("skName").value.trim()); });
  paintMe();

  /* ---------- sound: off by default, three ticks and a bell ---------- */
  var AC = null;
  function beep(f, d, v){ if (!sound) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = "square"; g.gain.value = v || .05; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.stop(AC.currentTime + d); } catch(e) {} }
  function sndLabel(){ $("skSnd").textContent = sound ? "SOUND ON" : "SOUND OFF"; $("skSnd").setAttribute("aria-pressed", sound ? "true" : "false"); }
  $("skSnd").onclick = function(){ sound = !sound; put("sound", sound); sndLabel(); beep(880, .15); };
  sndLabel();

  /* ---------- ticker ---------- */
  var tickBase = $("skTick").innerHTML, tickLive = [];
  function tick(s){ tickLive.unshift("<span>" + s + "</span>"); tickLive = tickLive.slice(0, 6); $("skTick").innerHTML = tickLive.join("") + tickBase; }

  function log(h){ var p = document.createElement("p"); p.innerHTML = h; var L = $("skLog"); if (L.firstChild && /Tuning in/.test(L.firstChild.textContent)) L.innerHTML = ""; L.prepend(p); while (L.children.length > 60) L.lastChild.remove(); }
  function key(k){ return tid + ":" + k; }
  function all(){ var a = []; rounds.forEach(function(rd){ (rd.races || []).forEach(function(r){ a.push(r); }); }); return a; }
  function find(k){ var a = all(); for (var i = 0; i < a.length; i++) if (a[i].key === k) return a[i]; return null; }
  function rec(id){ var w = 0, n = 0; all().forEach(function(r){ (r.result || []).forEach(function(x){ if (x.marbleId === id) { n++; if (x.rank === 1) w++; } }); }); return {w: w, n: n}; }
  function rname(id){ var r = R[id]; return r ? r.t : ""; }

  function hof(h){
    HOF = {}; (h.titleTable || []).forEach(function(t){ HOF[t.id] = t.titles; });
    var rows = (h.titleTable || []).map(function(t, i){ var r = R[t.id]; return "<tr><td>" + (i === 0 ? "👑" : "") + "</td><td><b>" + esc(t.name) + "</b>" + (r ? "<br><small>" + esc(r.t) + "</small>" : "") + "</td><td>" + "★".repeat(t.titles) + "</td><td>T" + t.lastTournamentId + "</td></tr>"; }).join("");
    $("skHof").innerHTML = "<tr><td colspan=4 class=sk-note>" + (h.tournamentsCompleted || 0) + " tournaments, " + (h.racesRun || 0) + " races, " + (h.distinctChampions || 0) + " different champions so far.</td></tr>" + rows;
    paint();
  }

  function stats(){
    var a = all(), done = a.filter(function(r){ return r.result; }).length, seeds = 0;
    a.forEach(function(r){ seeds += (r.clientSeeds || []).length; });
    var alive = standings.filter(function(s){ return s.status === "alive"; }).length || 100;
    $("stT").textContent = "T" + (tid || "?"); $("stR").textContent = done + "/25"; $("stA").textContent = alive; $("stS").textContent = seeds;
    $("skProg").style.width = (done / 25 * 100) + "%";
    $("aliveN").textContent = alive === 1 ? "ONE LEFT" : alive + " ALIVE";
    var racing = race && race.status !== "done" ? race.roster.map(function(x){ return x.marbleId; }) : [];
    standings.forEach(function(s){ var el = document.querySelector('.sk-a[data-id="' + s.id + '"]'); if (el) { el.classList.toggle("out", s.status !== "alive"); el.classList.toggle("racing", racing.indexOf(s.id) >= 0); } });
  }

  function boros(){
    var b = {Brooklyn:0, Manhattan:0, Queens:0, "Staten Island":0, "The Bronx":0};
    all().forEach(function(r){ (r.result || []).forEach(function(x){ var n = BORO[x.lane]; if (n) b[n] += x.rank === 1 ? 5 : x.rank === 2 ? 3 : x.rank === 3 ? 1 : 0; }); });
    var max = Math.max.apply(null, [1].concat(Object.values(b)));
    $("skBoros").innerHTML = Object.keys(b).sort(function(x, y){ return b[y] - b[x]; }).map(function(n, i){ return '<div class="sk-bar"><span>' + (i === 0 ? "👑 " : "") + n + '</span><div style="width:' + (b[n] / max * 100) + '%;background:' + BCOL[n] + '"></div><span>' + b[n] + '</span></div>'; }).join("");
  }

  function paint(){
    if (!race) return;
    var k = key(race.key), m = mine[k] || {}, open = race.status === "announced";
    var order = {}; (race.result || []).forEach(function(x){ order[x.marbleId] = x.rank; });
    var rr = race.roster.map(function(x){ var q = rec(x.marbleId); return {id: x.marbleId, rate: q.n ? q.w / q.n : -1}; });
    var best = rr.slice().sort(function(a, b){ return b.rate - a.rate; })[0];
    $("skTitle").textContent = (ROUND[race.roundKey] || race.roundTitle || race.roundKey) + (race.roundKey === "final" ? "" : " " + (race.indexInRound + 1));
    var ph = $("skPhase"); ph.textContent = open ? "AT THE GATE" : race.status === "running" ? "THEY'RE OFF" : "OFFICIAL"; ph.className = "sk-phase" + (open ? "" : race.status === "running" ? " run" : " done");
    $("skMeta").textContent = "tournament " + tid + " · " + race.key + " · track " + race.trackSeed + (race.raceSeed ? " · race seed " + race.raceSeed : " · race seed not born yet");
    $("skLanes").innerHTML = race.roster.map(function(x){
      var r = R[x.marbleId] || {}, q = rec(x.marbleId), t = HOF[x.marbleId] || 0, heat = crowdTotal ? Math.round((crowd[x.marbleId] || 0) / crowdTotal * 100) : 0;
      var tags = (t ? '<span class="tag champ">' + "★".repeat(t) + '</span>' : "") + (best && best.id === x.marbleId && best.rate > 0 ? '<span class="tag hot">HOT</span>' : "") + (heat >= 40 ? '<span class="tag cold">CROWD FAVE</span>' : "");
      var cls = "sk-lane" + (m.pick === x.marbleId ? " picked" : "") + (order[x.marbleId] === 1 ? " won" : "");
      return '<button class="' + cls + '" data-id="' + x.marbleId + '"' + (open ? "" : " disabled") + '>' +
        '<span class="sk-rider">' + (r.i ? '<img src="' + B + esc(r.i) + '" alt="">' : "") + '<i style="background:' + x.color + '"></i></span>' +
        '<span><span class="nm">' + esc(x.marbleName) + '</span>' + tags + '<small>for ' + (BORO[x.lane] || x.lane) + ' · ' + esc(r.t || "") + '</small>' +
        '<span class="form">' + (q.n ? q.w + " WIN" + (q.w === 1 ? "" : "S") + " IN " + q.n + " THIS TOURNAMENT" : "FIRST RUN THIS TOURNAMENT") + (crowdTotal ? " · " + heat + "% OF CALLS" : "") + '</span></span>' +
        '<span class="rk">' + (order[x.marbleId] ? (order[x.marbleId] === 1 ? "🏁" : order[x.marbleId]) : "") + '</span>' +
        '<span class="heat" style="width:' + heat + '%"></span></button>';
    }).join("");
    $("skBlow").disabled = !(open && m.pick != null && !m.seed);
    $("skBlow").textContent = m.seed ? "BLOWN ON 💨" : m.pick != null ? "BLOW ON IT" : "CALL A LANE FIRST";
    stats();
  }

  function paintMe(){
    $("yCalls").textContent = me.calls; $("yHits").textContent = me.hits; $("yStreak").textContent = me.streak + (me.streak >= 2 ? "🔥" : ""); $("yBest").textContent = me.best;
    $("yLine").textContent = me.streak >= 3 ? "ON FIRE. " + me.streak + " winners straight. Do not stop now." : me.streak ? "Streak alive. The next gate decides if you're a genius." : me.calls ? "Shake it off. Next gate in under four minutes." : "Call a race to start a streak. Three winners in a row and the ticker knows your name.";
  }

  function send(m){
    var name = $("skName").value.trim();
    if (!/^[A-Za-z0-9._]{2,16}$/.test(name)) { if (window.NY && NY.toast) NY.toast("Put your name on the board first: 2 to 16 letters, numbers, dot or underscore."); $("skName").focus(); return; }
    put("name", name);
    fetch(B + "api/skelly", {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({tournamentId: tid, raceKey: race.key, marbleId: m.pick, name: name, seed: m.seed || null})})
      .then(function(r){ return r.json(); }).then(function(j){ if (!j.ok && window.NY && NY.toast) NY.toast(j.error || "Call not saved."); else crowdPoll(); }).catch(function(){});
  }

  $("skLanes").addEventListener("click", function(e){
    var b = e.target.closest(".sk-lane"); if (!b || b.disabled || !race || race.status !== "announced") return;
    var k = key(race.key), m = mine[k] || (mine[k] = {});
    if (m.pick == null) { me.calls++; put("me", me); paintMe(); }
    m.pick = +b.dataset.id; put("mine", mine); paint(); send(m); beep(660, .08);
    if (window.NY && NY.hit) NY.hit("skelly", "pick");
  });

  $("skBlow").addEventListener("click", function(){
    if (!race || race.status !== "announced") return;
    var k = key(race.key), m = mine[k]; if (!m || m.pick == null) return;
    var seed = Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(32)), function(b){ return b.toString(16).padStart(2, "0"); }).join("");
    $("skBlow").disabled = true; beep(320, .3, .04);
    fetch(API + "/api/race/" + encodeURIComponent(race.key) + "/client-seed", {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({seed: seed})})
      .then(function(r){ return r.json().then(function(j){ return {ok: r.ok, j: j}; }); })
      .then(function(x){ if (x.ok && x.j.accepted !== false) { m.seed = seed; put("mine", mine); send(m); log("<b>💨 You blew on " + race.key + ".</b> Seed " + seed.slice(0, 10) + "... is in, " + (x.j.count || "?") + " blown so far."); } else log("Seed not taken. One per connection per race."); paint(); })
      .catch(function(){ log("Seed did not reach the gate."); paint(); });
    if (window.NY && NY.hit) NY.hit("skelly", "blow");
  });

  function crowdPoll(){
    if (!tid || !race || race.status !== "announced") return;
    fetch(B + "api/skelly?t=" + tid + "&crowd=" + encodeURIComponent(race.key)).then(function(r){ return r.json(); }).then(function(j){ if (j.ok && j.raceKey === race.key) { crowd = j.crowd || {}; crowdTotal = j.total || 0; paint(); } }).catch(function(){});
  }
  setInterval(crowdPoll, 8000);

  function board(){
    if (!tid) return; $("bT").textContent = tid;
    fetch(B + "api/skelly?t=" + tid).then(function(r){ return r.json(); }).then(function(j){
      if (!j.ok) { $("skBoard").innerHTML = '<tr><td colspan="4">The board opens soon.</td></tr>'; return; }
      $("skBoard").innerHTML = j.top.length ? j.top.slice(0, 15).map(function(x, i){ return "<tr><td>" + (i === 0 ? "👑" : i + 1) + "</td><td>" + esc(x.name) + "</td><td>" + x.points + "</td><td>" + x.winners + "</td></tr>"; }).join("") + '<tr><td colspan="4" class="sk-note">' + j.players + " on the board this tournament.</td></tr>" : '<tr><td colspan="4">Nobody on the board yet. First call takes the crown.</td></tr>';
    }).catch(function(){ $("skBoard").innerHTML = '<tr><td colspan="4">The board opens soon.</td></tr>'; });
  }

  /* ---------- the finish ---------- */
  var conf = $("skConf"), cx = conf.getContext("2d"), bits = [];
  function confetti(){
    conf.width = innerWidth; conf.height = innerHeight; var cols = ["#ffcc00", "#d9534f", "#5bc0de", "#f0ad4e", "#5cb85c", "#ede0c8"];
    for (var i = 0; i < 160; i++) bits.push({x: Math.random() * conf.width, y: -20 - Math.random() * conf.height * .5, v: 2 + Math.random() * 4, s: 4 + Math.random() * 6, c: cols[i % 6], w: Math.random() * 6});
    (function fr(){ cx.clearRect(0, 0, conf.width, conf.height); bits = bits.filter(function(b){ return b.y < conf.height + 20; }); bits.forEach(function(b){ b.y += b.v; b.w += .1; cx.fillStyle = b.c; cx.fillRect(b.x + Math.sin(b.w) * 8, b.y, b.s, b.s * .6); }); if (bits.length) requestAnimationFrame(fr); else cx.clearRect(0, 0, conf.width, conf.height); })();
  }
  function splash(o){
    var s = $("skSplash"); s.className = "sk-splash on" + (o.rekt ? " rekt" : "");
    $("spImg").src = o.img || ""; $("spImg").hidden = !o.img; $("spH").textContent = o.h; $("spP").innerHTML = o.p;
    $("spActs").innerHTML = (o.share ? '<a target="_blank" rel="noopener" href="https://x.com/intent/post?text=' + encodeURIComponent(o.share) + '&url=' + encodeURIComponent(location.origin + location.pathname) + '">POST IT ON X</a>' : "") + '<button class="x" type="button">NEXT GATE</button>';
    s.querySelector("button.x").onclick = function(){ s.className = "sk-splash"; };
    clearTimeout(splash.t); splash.t = setTimeout(function(){ s.className = "sk-splash"; }, o.hold || 9000);
  }
  $("skSplash").addEventListener("click", function(e){ if (e.target.id === "skSplash") this.className = "sk-splash"; });

  function finish(r, res){
    var w = res[0], wr = R[w.marbleId] || {}, boro = BORO[w.lane] || w.lane, k = key(r.key), m = mine[k] || {};
    var rates = r.roster.map(function(x){ var q = rec(x.marbleId); return {id: x.marbleId, rate: q.n > 1 ? q.w / q.n : .2}; });
    var upset = rates.slice().sort(function(a, b){ return a.rate - b.rate; })[0].id === w.marbleId && rates.some(function(q){ return q.rate > .4; });
    var mineRank = m.pick != null ? (res.filter(function(x){ return x.marbleId === m.pick; })[0] || {}).rank : null;
    var head = (upset ? "UPSET! " : "") + boro.toUpperCase() + " TAKES " + (ROUND[r.roundKey] || r.roundKey).toUpperCase() + (r.roundKey === "final" ? "" : " " + (r.indexInRound + 1));
    tick((upset ? "UPSET · " : "") + esc(w.marbleName).toUpperCase() + " WINS " + r.key.toUpperCase() + " FOR " + boro.toUpperCase());
    log("<b>🏁 " + esc(w.marbleName) + "</b>" + (wr.t ? ", ridden by " + esc(wr.t) + "," : "") + " wins " + r.key + " for " + boro + (w.timeSec ? " in " + w.timeSec.toFixed(2) + "s" : "") + "." + (upset ? " <b>UPSET.</b>" : ""));
    var stuck = res.filter(function(x){ return x.timeSec == null; }); if (stuck.length) log("🪨 " + stuck.map(function(x){ return esc(x.marbleName); }).join(", ") + " got stuck on the track. DNF.");
    if (mineRank === 1) {
      me.hits++; me.streak++; me.best = Math.max(me.best, me.streak); put("me", me); paintMe(); confetti(); beep(1320, .5, .06);
      if (me.streak >= 3) tick((get("name", "") || "SOMEBODY").toUpperCase() + " IS ON A " + me.streak + " RACE HEATER 🔥");
      splash({img: wr.i ? B + wr.i : "", h: "YOU CALLED IT", p: "<b>" + esc(w.marbleName) + "</b> takes " + r.key + " for " + boro + ". " + (me.streak >= 2 ? "That's " + me.streak + " straight. 🔥" : "Streak started."), share: "I called " + w.marbleName + " in " + r.key + " on SKELLY CUP 🏁 " + boro + " takes it. " + (me.streak >= 2 ? me.streak + " straight 🔥 " : "") + "Marble Run by @bryanbrinkman, riders by @degens"});
    } else if (mineRank) {
      if (mineRank !== 2) { me.streak = 0; } put("me", me); paintMe();
      var pr = R[m.pick] || {};
      splash({rekt: mineRank !== 2, img: wr.i ? B + wr.i : "", h: mineRank === 2 ? "SO CLOSE" : "REKT", p: (pr.m ? esc(pr.m) : "Your marble") + " finished " + (mineRank === 2 ? "second. Two points, streak alive." : mineRank + ". " + esc(w.marbleName) + " takes it for " + boro + ". Next gate in under four minutes."), hold: 5000});
    } else if (r.roundKey !== "heats" || upset) {
      splash({img: wr.i ? B + wr.i : "", h: head, p: esc(w.marbleName) + (wr.t ? ", ridden by " + esc(wr.t) : "") + ". You didn't call this one. The next gate is coming.", hold: 6000});
    }
  }

  function boot(s){
    skew = s.serverNow - Date.now(); tid = s.tournament && s.tournament.id; rounds = s.rounds || []; standings = s.standings || [];
    race = s.current && s.current.raceKey ? find(s.current.raceKey) : null;
    boros(); paint(); board(); stats(); crowdPoll();
    if (race) tick("TOURNAMENT " + tid + " · " + (race.key || "").toUpperCase() + " · " + standings.filter(function(x){ return x.status === "alive"; }).length + " STILL ALIVE");
  }
  function upsert(r){ var f = find(r.key); if (f) { for (var k in r) f[k] = r[k]; return f; } return r; }

  function connect(delay){
    delay = delay || 1000;
    var ws = new WebSocket("wss://marblerun.fun/ws");
    ws.onopen = function(){ delay = 1000; };
    ws.onclose = function(){ setTimeout(function(){ connect(Math.min(delay * 2, 30000)); }, delay); };
    ws.onmessage = function(e){
      var m = JSON.parse(e.data); if (m.serverNow) skew = m.serverNow - Date.now();
      if (m.type === "snapshot") boot(m);
      else if (m.type === "round_built") { rounds = rounds.filter(function(r){ return r.key !== m.round.key; }).concat(m.round); log("<b>" + esc(m.round.title || m.round.key).toUpperCase() + " IS SET.</b> " + (m.round.races || []).length + " races. The field gets meaner."); tick((m.round.title || m.round.key).toUpperCase() + " SET"); }
      else if (m.type === "race_announced") {
        m.race.status = "announced"; race = upsert(m.race); crowd = {}; crowdTotal = 0; lastCallShown = null;
        log("<b>" + race.key + " at the gate:</b> " + race.roster.map(function(x){ return esc(x.marbleName) + " (" + (BORO[x.lane] || x.lane) + ")"; }).join(", "));
        tick(race.key.toUpperCase() + " AT THE GATE · " + race.roster.map(function(x){ return esc(x.marbleName).toUpperCase(); }).join(" · "));
        paint(); crowdPoll(); beep(520, .12);
      }
      else if (m.type === "race_start") {
        if (race && race.key === m.raceKey) {
          race.status = "running"; race.raceSeed = m.raceSeed; race.clientSeeds = m.clientSeeds || [];
          var mySeed = (mine[key(m.raceKey)] || {}).seed;
          log("<b>THEY'RE OFF.</b> " + race.clientSeeds.length + " seeds blown in, beacon " + (m.beacon ? m.beacon.source + " round " + m.beacon.round : "none") + "." + (mySeed && race.clientSeeds.indexOf(mySeed) >= 0 ? " <b>Your seed is in it. Verified.</b>" : ""));
          tick(m.raceKey.toUpperCase() + " IS OFF · " + race.clientSeeds.length + " SEEDS BLOWN");
          paint(); beep(1040, .6, .07);
        }
      }
      else if (m.type === "race_result") {
        var r = find(m.raceKey) || race; if (!r) return; r.status = "done"; r.result = m.result;
        if (m.standings) standings = m.standings;
        finish(r, m.result); boros(); paint(); setTimeout(board, 8000);
      }
      else if (m.type === "tournament_complete") {
        var c = R[m.champion.id] || {};
        log("<b>👑 " + esc(m.champion.name) + " TAKES TOURNAMENT " + tid + ".</b> Master seed " + esc((m.masterSeedHex || "").slice(0, 16)) + "... revealed. A new Champion's Portrait is owed.");
        tick("👑 " + esc(m.champion.name).toUpperCase() + " IS CHAMPION OF TOURNAMENT " + tid + " · THE PORTRAIT GETS PAINTED");
        confetti();
        splash({img: c.i ? B + c.i : "", h: "👑 " + m.champion.name.toUpperCase(), p: "Champion of tournament " + tid + (c.t ? ", ridden by " + esc(c.t) : "") + ". This one gets painted. Master seed " + esc((m.masterSeedHex || "").slice(0, 12)) + "... A new tournament drops in thirty seconds. A hundred marbles. Zero eliminated.", share: m.champion.name + " just won tournament " + tid + " of SKELLY CUP 👑 and gets a portrait. Marble Run by @bryanbrinkman, riders by @degens", hold: 15000});
        fetch(API + "/api/hall-of-fame").then(function(x){ return x.json(); }).then(hof).catch(function(){});
        setTimeout(function(){ fetch(API + "/api/state").then(function(x){ return x.json(); }).then(boot).catch(function(){}); }, 40000);
      }
    };
  }

  setInterval(function(){
    if (!race || !race.scheduledStart) return;
    var t = Math.round((race.scheduledStart - (Date.now() + skew)) / 1000), g = $("skGate");
    if (race.status === "announced") {
      $("skGateLbl").textContent = t <= 10 ? "LAST CALL" : "GATE DROPS IN";
      $("skClock").textContent = t > 0 ? "0:" + String(t).padStart(2, "0") : "GATE";
      g.className = "sk-gate" + (t <= 10 ? " last" : "");
      if (t <= 10 && t > 0 && lastCallShown !== race.key) { lastCallShown = race.key; var mm = mine[key(race.key)]; if (!mm || mm.pick == null) { log("<b>⏰ LAST CALL on " + race.key + ".</b> Ten seconds. Pick a lane."); } }
      if (t <= 3 && t >= 1) beep(440 + (4 - t) * 120, .09);
    } else { g.className = "sk-gate"; $("skGateLbl").textContent = race.status === "running" ? "ON THE TRACK" : "NEXT GATE SOON"; $("skClock").textContent = race.status === "running" ? "LIVE" : "..."; }
  }, 250);
  connect();
})();
</script>
"""

og = latest and latest["og"]
page = shell(title="SKELLY CUP · 100 marbles, 5 boroughs, a champion every 100 minutes · NEW YORKERS by MLow",
             description="Bryan Brinkman's Marble Run with a hundred painted New Yorkers riding. A race every four minutes, a champion every hundred, and every champion gets painted. Call it free, blow on the seed, ride the streak. Not a bet.",
             body=body, path="skelly.html", active="SKELLY", extra_css=css, scripts_after=js,
             image=(URL + "/" + og) if og else None,
             keywords=["Marble Run", "Bryan Brinkman", "marble racing", "skelly", "NYC street games", "provably fair", "NEW YORKERS by MLow"],
             jsonld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "SKELLY CUP · NEW YORKERS by MLow", "url": f"{URL}/skelly",
                      "isPartOf": {"@id": URL + "/#site"}, "description": "NEW YORKERS riders on Bryan Brinkman's Marble Run, with a portrait for every champion.",
                      "isBasedOn": {"@type": "SoftwareApplication", "name": "Marble Run", "url": "https://marblerun.fun", "author": {"@type": "Person", "name": "Bryan Brinkman", "url": "https://bryanbrinkman.com"}}}])
open(os.path.join(SITE, "skelly.html"), "w", encoding="utf-8").write(page)
print(f"wrote skelly.html: {len(riders)} riders, {len(champs)} champion portraits, next frame T{next_t}")
