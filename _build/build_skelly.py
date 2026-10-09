#!/usr/bin/env python3
"""skelly.html, SKELLY CUP: NEW YORKERS riders on Bryan Brinkman's Marble Run.

Marble Run (marblerun.fun, by Bryan Brinkman) races 100 marbles forever, five to a race, from
seeds anyone can verify. Skully (skelly) is the New York street game of bottle caps flicked across
a chalk board with a skull in the middle. Five lanes become five boroughs, every marble gets a painted
New Yorker as its rider, and every champion gets a portrait.

The page is a walk down one Brooklyn block at night, every section a real New York surface painted
on FLORA in the NEW YORKERS hand (design plates and sprites cut by MARBLE RUN x NEW YORKERS
2026-10-08/design/process_design.py into assets/skelly/ui):
  THE BOARD      the chalk skully board on wet asphalt; flick real marbles across it
  BODEGA TV      Bryan's live race playing inside the bodega CRT under a sleeping cat; WATCH BIG dollies in
  THE GATE       the race card on chalked asphalt, bottle cap lanes, the board on a stadium scoreboard
  STILL ALIVE    a subway tile wall of the hundred riders, greying out as heats eliminate them
  THE WALL       Champion's Portraits wheatpasted on brick, scrolling sideways
  HALL OF FAME   a deli letterboard under a striped awning
  THE STOOP      the rules on a brownstone stoop
  THE ENGINE     Bryan's provably fair engine drawn as a subway map, his honorary beside it
  THE RIDERS     a hundred transit cards
A subway line down the right edge is the scroll map. All of it is free: nothing staked, nothing paid
out, no odds. Bryan's API page says Marble Run is not a betting product, and this page holds that line.

Reads  _build/skelly/cast.json, _build/skelly/champions.json, api/pieces.json, assets/skelly/ui/bodega.json
Writes assets/skelly/riders.json, skelly.html
Live: marblerun.fun in the browser (one WebSocket, /api/hall-of-fame, /api/state on a new tournament);
picks and crowd heat via our /api/skelly (functions/api/skelly.js, D1).
"""
import json, os
from page_shell import shell, cfg, esc

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
OUT = os.path.join(SITE, "assets", "skelly")
UI = "assets/skelly/ui/"
os.makedirs(OUT, exist_ok=True)
URL = cfg()["siteUrl"]

cast = json.load(open(os.path.join(HERE, "skelly", "cast.json")))["cast"]
champs = json.load(open(os.path.join(HERE, "skelly", "champions.json")))
PIECES = {p["n"]: p for p in json.load(open(os.path.join(SITE, "api", "pieces.json")))}
TV = json.load(open(os.path.join(SITE, "assets", "skelly", "ui", "bodega.json")))
assert len(cast) == 100 and len({c["marbleId"] for c in cast}) == 100, "need one rider per marble"
for ch in champs:
    assert os.path.exists(os.path.join(SITE, ch["image"])), "missing portrait " + ch["image"]
for f in ("hero.jpg", "bodega.jpg", "stoop.jpg", "brick.jpg", "chalk.jpg", "marble.png", "pigeon.png", "flower.png", "nazar.png", "cup.png",
          "cap-red.png", "cap-blue.png", "cap-yellow.png", "cap-green.png", "cap-cream.png"):
    assert os.path.exists(os.path.join(SITE, UI, f)), "missing design asset " + f

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
TILT = [-2.2, 1.6, -1.1, 2.4, -1.8, 1.2, -2.6, 1.9]

champ_html = "".join(f"""
    <figure class="paste{' fresh' if ch is latest else ''}" style="--r:{TILT[i % len(TILT)]}deg">
      <a href="{esc(ch['image'])}" target="_blank" rel="noopener"><img src="{esc(ch['thumb'])}" alt="{esc(ch['title'])}" loading="lazy" width="640" height="360"></a>
      <figcaption><small>TOURNAMENT {ch['tournamentId']} · {esc(ch['borough']).upper()} LANE{' · FRESH PAINT' if ch is latest else ''}</small><b>{esc(ch['title'])}</b>
      <span>{esc(ch['marble'])}, ridden by <a href="n/{ch['piece']}">{esc(ch['rider'])}</a>.</span>
      <code title="Master seed, revealed by Marble Run when the tournament closed">SEED {esc(ch['seed'][:32])}<br>{esc(ch['seed'][32:])}</code></figcaption>
    </figure>""" for i, ch in enumerate(sorted(champs, key=lambda c: -c["tournamentId"])))

wanted = f"""
    <figure class="paste wanted" style="--r:1.4deg">
      <div class="wframe"><span>?</span><em>UNPAINTED</em></div>
      <figcaption><small>TOURNAMENT {next_t} · RUNNING NOW</small><b>Wanted: one champion.</b>
      <span>Whoever wins tournament {next_t} gets painted and pasted right here. Blow on the final and your seed is folded into the number printed under it, forever.</span></figcaption>
    </figure>"""

cards_html = "".join(f"""<a href="n/{c['piece']}" class="tcard" id="r{c['marbleId']}"><span class="tc-art"><img src="{esc(thumb(c['image']))}" alt="" loading="lazy" width="320" height="180"></span><span class="tc-strip"></span><span class="tc-no">{c['marbleId']:03d}</span><b>{esc(c['marble'])}{(' <i>' + '★' * titles[c['marble']] + '</i>') if c['marble'] in titles else ''}</b><small>{esc(c['title'])}</small></a>"""
                     for c in sorted(cast, key=lambda c: c["marbleId"]))

alive_html = "".join(f"""<a href="#r{c['marbleId']}" class="tile" data-id="{c['marbleId']}" title="{esc(c['marble'])}"><img src="{esc(thumb(c['image']))}" alt="" loading="lazy" width="96" height="54"><span>{esc(c['marble'])}</span></a>"""
                     for c in sorted(cast, key=lambda c: c["marbleId"]))

STOPS = [("board", "THE BOARD", "#ffcc00"), ("tv", "BODEGA TV", "#d9534f"), ("gate", "THE GATE", "#5bc0de"), ("alive", "STILL ALIVE", "#f0ad4e"),
         ("wall", "THE WALL", "#5cb85c"), ("hall", "HALL OF FAME", "#ede0c8"), ("stoop", "THE STOOP", "#d9534f"), ("engine", "THE ENGINE", "#5bc0de"), ("riders", "THE RIDERS", "#f0ad4e")]
line_html = "".join(f'<a href="#{k}" data-k="{k}" style="--c:{c}"><i></i><span>{n}</span></a>' for k, n, c in STOPS)

extra_head = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bungee&family=Bungee+Shade&family=Rock+Salt&display=swap">\n'
              f'<link rel="preload" as="image" href="{UI}hero.jpg">')

css = """
:root{--sk-y:#ffcc00;--sk-r:#d9534f;--sk-b:#5bc0de;--sk-o:#f0ad4e;--sk-g:#5cb85c;--sk-c:#ede0c8;--sk-ink:#0b0b0d;--sk-paper:#f3efe4}
body.skelly{background:var(--sk-ink)}
body.skelly main.wrap{max-width:none;padding:0}
.sk-grain{position:fixed;inset:-50%;z-index:70;pointer-events:none;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");animation:grain 1.2s steps(6) infinite}
@keyframes grain{0%{transform:translate(0,0)}20%{transform:translate(-3%,2%)}40%{transform:translate(2%,-3%)}60%{transform:translate(-2%,-1%)}80%{transform:translate(3%,3%)}}
.sk-cursor{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;z-index:80;pointer-events:none;background:url(UI_marble.png) center/contain no-repeat;transition:width .2s,height .2s,margin .2s;display:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5))}
.sk-cursor.big{width:64px;height:64px;margin:-32px 0 0 -32px}
@media (pointer:fine){body.skelly.cur .sk-cursor{display:block}body.skelly.cur,body.skelly.cur a,body.skelly.cur button{cursor:none}}
.inner{max-width:1360px;margin:0 auto;padding:0 clamp(16px,4vw,48px)}
.sec{position:relative;padding:clamp(70px,10vw,130px) 0;overflow:hidden;overflow:clip}
@media (max-width:700px){.float{display:none}#board.sec{min-height:0;padding-top:110px}.hero-t{margin-top:16px}.flick-hint{top:auto;bottom:12px;font-size:12px}.cards{grid-template-columns:repeat(2,1fr)!important;gap:10px}.steps li{margin-left:calc(var(--i) * 8px)}.cred{flex-wrap:wrap}}
.sign{font-family:Bungee,"Space Grotesk",sans-serif;font-weight:400;letter-spacing:.5px;line-height:.95;margin:0}
.chalk{font-family:"Rock Salt",cursive;font-weight:400}
.kick{font:600 11px/1 "IBM Plex Mono",monospace;letter-spacing:3px;text-transform:uppercase;color:var(--sk-y);display:flex;align-items:center;gap:10px;margin-bottom:16px}
.kick i{display:inline-flex;width:24px;height:24px;border-radius:50%;align-items:center;justify-content:center;font:900 12px/1 "Space Grotesk",sans-serif;color:#111;font-style:normal}
.lede{font:500 clamp(17px,1.6vw,21px)/1.5 "Space Grotesk",sans-serif;max-width:720px;opacity:.86}
[data-rv]{opacity:0;transform:translateY(40px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
[data-rv].in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){[data-rv]{opacity:1;transform:none;transition:none}.sk-grain{animation:none}}
.float{position:absolute;pointer-events:none;z-index:2;will-change:transform;filter:drop-shadow(0 18px 24px rgba(0,0,0,.55))}

/* ---------- ticker ---------- */
.sk-tick{position:relative;z-index:5;background:var(--sk-y);color:#111;overflow:hidden;white-space:nowrap;font:700 13px/34px "IBM Plex Mono",monospace;letter-spacing:1px;border-bottom:3px solid #111}
.sk-tick div{display:inline-block;padding-left:100%;animation:skt 70s linear infinite}
.sk-tick span{margin-right:28px}.sk-tick span::after{content:"●";margin-left:28px;color:var(--sk-r)}
@keyframes skt{to{transform:translateX(-100%)}}
@media (prefers-reduced-motion:reduce){.sk-tick div{animation:none;padding-left:16px}}

/* ---------- subway line scroll map ---------- */
.sk-line{position:fixed;right:18px;top:50%;transform:translateY(-50%);z-index:40;display:flex;flex-direction:column;gap:14px;padding:12px 0}
.sk-line::before{content:"";position:absolute;right:7px;top:0;bottom:0;width:4px;border-radius:2px;background:linear-gradient(var(--sk-y),var(--sk-r),var(--sk-b),var(--sk-o),var(--sk-g),var(--sk-c),var(--sk-r),var(--sk-b),var(--sk-o))}
.sk-line a{position:relative;display:flex;align-items:center;justify-content:flex-end;gap:10px;color:#fff;text-decoration:none;font:700 10px "IBM Plex Mono",monospace;letter-spacing:1.5px}
.sk-line a span{position:absolute;right:28px;opacity:0;transform:translateX(6px);transition:.25s;background:#111;padding:3px 7px;border-radius:2px;white-space:nowrap}
.sk-line a:hover span,.sk-line a.on span{opacity:1;transform:none}
.sk-line a i{width:18px;height:18px;border-radius:50%;background:#111;border:4px solid var(--c);transition:.25s;flex:none;position:relative;z-index:1}
.sk-line a.on i{background:var(--c);transform:scale(1.25)}
@media (max-width:1100px){.sk-line{display:none}}

/* ---------- 1 THE BOARD ---------- */
#board{min-height:min(100vh,980px);padding:0;display:flex;align-items:flex-end;isolation:isolate}
.board-bg{position:absolute;inset:-8% 0 -8% 0;background:url(UI_hero.jpg) center/cover no-repeat;z-index:-2;will-change:transform}
.board-bg::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 55% at 50% 52%,rgba(8,8,10,.86),rgba(8,8,10,.35) 65%,rgba(8,8,10,.15)),linear-gradient(transparent 55%,var(--sk-ink))}
#flick{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1;touch-action:pan-y}
.board-in{position:relative;z-index:3;width:100%;padding-bottom:clamp(36px,6vw,70px);pointer-events:none}
.board-in a,.board-in button{pointer-events:auto}
.hero-t{font:900 clamp(74px,15.5vw,240px)/.78 Fraunces,serif;letter-spacing:-.04em;margin:0;text-shadow:0 10px 50px rgba(0,0,0,.6)}
.hero-t .w{display:inline-block;overflow:hidden;vertical-align:bottom}
.hero-t .l{display:inline-block;transform:translateY(110%) rotate(8deg);animation:drop .9s cubic-bezier(.2,.8,.2,1.15) forwards}
.hero-t .y{color:var(--sk-y)}
@keyframes drop{to{transform:none}}
.hero-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:end;margin-top:18px}
@media (max-width:860px){.hero-row{grid-template-columns:1fr}}
.hero-dek{font:600 clamp(18px,2vw,24px)/1.35 "Space Grotesk",sans-serif;max-width:720px;margin:0}
.hero-dek em{font-style:normal;color:var(--sk-y)}
.cred{display:inline-flex;gap:10px;align-items:center;margin-top:16px;padding:9px 14px 9px 9px;border-radius:999px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.25);font:700 12px "IBM Plex Mono",monospace;color:#fff;text-decoration:none;backdrop-filter:blur(6px)}
.cred img{width:26px;height:26px}
.cred b{color:var(--sk-y)}
.gatebox{text-align:right;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.18);border-radius:6px;padding:14px 18px;backdrop-filter:blur(6px)}
@media (max-width:860px){.gatebox{text-align:left}}
.gatebox small{display:block;font:700 11px "IBM Plex Mono",monospace;letter-spacing:3px;opacity:.7}
.gatebox strong{display:block;font:400 clamp(60px,8vw,104px)/.9 Bungee,monospace;color:var(--sk-y);font-variant-numeric:tabular-nums}
.gatebox.last strong{color:var(--sk-r);animation:blink .45s ease-in-out infinite alternate}
@keyframes blink{to{opacity:.3}}
.flick-hint{position:absolute;z-index:2;left:50%;top:18%;transform:translateX(-50%);font-family:"Rock Salt",cursive;font-size:clamp(14px,1.6vw,20px);color:rgba(255,255,255,.75);pointer-events:none;transition:opacity .6s;text-shadow:0 2px 10px #000;white-space:nowrap}
.statbar{display:grid;grid-template-columns:repeat(5,1fr);margin-top:26px;border:2px solid #111;background:#111;gap:2px}
@media (max-width:860px){.statbar{grid-template-columns:repeat(2,1fr)}.statbar div:last-child{grid-column:span 2}}
.statbar div{background:var(--sk-paper);color:#111;padding:12px 14px}
.statbar b{display:block;font:400 clamp(26px,3vw,40px)/1 Bungee,sans-serif}
.statbar span{font:700 10px "IBM Plex Mono",monospace;letter-spacing:1.5px;opacity:.65}
.prog{height:8px;background:#111;position:relative;border:2px solid #111;border-top:0}
.prog i{position:absolute;left:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,var(--sk-y) 0 18px,#111 18px 20px);transition:width .8s}

/* ---------- 2 BODEGA TV ---------- */
#tv{padding-top:clamp(40px,6vw,80px)}
.tvhead{display:flex;justify-content:space-between;align-items:end;gap:18px;flex-wrap:wrap;margin-bottom:22px}
.sign.big{font-size:clamp(48px,8vw,118px)}
.sign.big .y{color:var(--sk-y)}.sign.big .r{color:var(--sk-r)}.sign.big .b{color:var(--sk-b)}
.btn{font:700 12px "IBM Plex Mono",monospace;letter-spacing:1.5px;padding:12px 16px;border-radius:3px;border:2px solid #111;background:var(--sk-y);color:#111;cursor:pointer;text-decoration:none;display:inline-block;box-shadow:4px 4px 0 #111;transition:transform .15s,box-shadow .15s}
.btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #111}
.btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.5);box-shadow:none}
.bodega{position:relative;aspect-ratio:16/9;border-radius:8px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.6);transform-origin:var(--ox) var(--oy);transition:transform 1.1s cubic-bezier(.7,0,.2,1)}
.bodega>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.screen{position:absolute;left:TV_L%;top:TV_T%;width:TV_W%;height:TV_H%;border-radius:7%/9%;overflow:hidden;background:#000;box-shadow:inset 0 0 40px rgba(0,0,0,.9)}
.screen iframe{position:absolute;left:50%;top:50%;width:160%;height:160%;border:0;transform:translate(-50%,-50%) scale(.625)}
.screen::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(transparent 0 2px,rgba(0,0,0,.18) 2px 3px),radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.14),transparent 45%),radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55));border-radius:inherit}
.bodega.big{transform:scale(var(--z)) translate(var(--tx),var(--ty))}
.bodega.big .screen::after{opacity:.35}
.tv-onair{position:absolute;left:2%;top:4%;z-index:3;font:700 11px "IBM Plex Mono",monospace;background:var(--sk-r);color:#fff;padding:5px 9px;letter-spacing:2px}
.tv-onair::before{content:"● ";animation:blink .8s infinite alternate}
.tv-cred{position:absolute;right:2%;bottom:3.5%;z-index:3;font:700 10px "IBM Plex Mono",monospace;background:rgba(0,0,0,.7);color:#fff;padding:5px 9px;text-decoration:none;letter-spacing:1px}
.under{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:22px;margin-top:26px}
@media (max-width:900px){.under{grid-template-columns:1fr}}
.wars{background:#141418;border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:20px}
.war{display:grid;grid-template-columns:44px 120px 1fr 44px;gap:12px;align-items:center;margin:10px 0;font:700 14px "Space Grotesk",sans-serif}
.war img{width:44px;height:44px}
.war .bar{height:16px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}
.war .bar i{display:block;height:100%;transition:width .8s}
.war b{font:400 20px Bungee,sans-serif;text-align:right}
.receipt{background:var(--sk-paper);color:#222;font:12px/1.5 "IBM Plex Mono",monospace;padding:18px 18px 22px;position:relative;box-shadow:0 20px 40px rgba(0,0,0,.4);transform:rotate(.8deg);align-self:start}
#skLog{max-height:300px;overflow:auto}
.receipt::after{content:"";position:absolute;left:0;right:0;bottom:-12px;height:12px;background:linear-gradient(-45deg,transparent 6px,var(--sk-ink) 6px),linear-gradient(45deg,transparent 6px,var(--sk-ink) 6px);background-size:12px 12px}
.receipt h4{font:700 13px "IBM Plex Mono",monospace;text-align:center;margin:0 0 4px;letter-spacing:2px}
.receipt .rh{text-align:center;border-bottom:1px dashed #999;padding-bottom:8px;margin-bottom:8px;font-size:11px}
.receipt p{margin:0 0 7px;border-bottom:1px dotted #ccc;padding-bottom:6px}
.receipt p b{color:#000}

/* ---------- 3 THE GATE ---------- */
#gate{background:url(UI_chalk.jpg) center/cover fixed}
#gate::before{content:"";position:absolute;inset:0;background:linear-gradient(var(--sk-ink),rgba(11,11,13,.55) 15%,rgba(11,11,13,.55) 85%,var(--sk-ink))}
#gate .inner{position:relative}
.gategrid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.9fr);gap:26px;align-items:start}
@media (max-width:960px){.gategrid{grid-template-columns:1fr}}
.racehead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px}
.racehead b{font:400 clamp(30px,4vw,52px)/1 Bungee,sans-serif}
.phase{font:700 11px "IBM Plex Mono",monospace;padding:6px 10px;border-radius:2px;background:var(--sk-g);color:#111;letter-spacing:1.5px}
.phase.run{background:var(--sk-r);color:#fff;animation:blink .6s infinite alternate}.phase.done{background:#888;color:#111}
.meta{font:11px "IBM Plex Mono",monospace;opacity:.6;word-break:break-all;margin-bottom:14px}
.lanes{display:grid;gap:10px}
.lane{position:relative;overflow:hidden;display:grid;grid-template-columns:62px 78px 1fr auto;align-items:center;gap:14px;padding:10px 14px 10px 10px;border:2px dashed rgba(255,255,255,.35);border-radius:6px;background:rgba(8,8,10,.62);color:inherit;font:inherit;text-align:left;width:100%;cursor:pointer;backdrop-filter:blur(3px);transition:transform .2s,border-color .2s,background .2s}
.lane:hover:not([disabled]){transform:translateX(6px);border-color:var(--sk-y)}
.lane[disabled]{cursor:default}
.lane.picked{border:2px solid var(--sk-y);background:rgba(255,204,0,.12)}
.lane.won{border:2px solid var(--sk-g);background:rgba(92,184,92,.16)}
.lane .cap{width:62px;height:62px;transition:transform .5s}
.lane:hover .cap,.lane.picked .cap{transform:rotate(-30deg) scale(1.08)}
.lane .art{width:78px;height:56px;border-radius:3px;object-fit:cover}
.lane .nm{font:400 20px/1 Bungee,sans-serif}
.lane small{display:block;font-size:12px;opacity:.75;line-height:1.35;margin-top:4px}
.lane .form{font:700 10px "IBM Plex Mono",monospace;letter-spacing:.8px;opacity:.8;margin-top:4px;display:block}
.lane .rk{font:400 34px Bungee,sans-serif;min-width:40px;text-align:right}
.lane .heat{position:absolute;left:0;bottom:0;height:4px;background:var(--sk-r);transition:width .6s}
.tag{font:700 9px "IBM Plex Mono",monospace;padding:2px 6px;border-radius:2px;margin-left:6px;vertical-align:middle;letter-spacing:1px}
.tag.hot{background:var(--sk-r);color:#fff}.tag.champ{background:var(--sk-y);color:#111}.tag.cold{background:var(--sk-b);color:#111}
.callrow{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:14px}
.callrow input{font:600 16px "Space Grotesk",sans-serif;padding:14px;border-radius:4px;border:2px solid rgba(255,255,255,.4);background:rgba(0,0,0,.6);color:#fff}
.blow{grid-column:1/-1;padding:18px;font:400 clamp(22px,3vw,30px)/1 Bungee,sans-serif;background:var(--sk-y);color:#111;border:3px solid #111;border-radius:6px;cursor:pointer;box-shadow:6px 6px 0 #111;transition:transform .15s,box-shadow .15s}
.blow:hover:not([disabled]){transform:translate(-2px,-2px);box-shadow:8px 8px 0 #111}
.blow[disabled]{background:#3a3c42;color:#8d8a82;box-shadow:none;cursor:default}
.snd{font:700 11px "IBM Plex Mono",monospace;border:2px solid rgba(255,255,255,.4);border-radius:4px;background:transparent;color:#fff;padding:0 14px;cursor:pointer}
.fine{font-size:12px;opacity:.7;margin-top:10px;line-height:1.5}
.scoreboard{background:#050505;border:6px solid #1d1d22;border-radius:8px;padding:16px;box-shadow:inset 0 0 30px rgba(0,0,0,.9),0 30px 60px rgba(0,0,0,.5)}
.scoreboard h3{font:400 15px Bungee,sans-serif;color:var(--sk-o);margin:0 0 12px;letter-spacing:1px}
.led{font:600 15px "IBM Plex Mono",monospace;color:#ffb347;text-shadow:0 0 6px rgba(255,160,40,.85),0 0 16px rgba(255,120,0,.35);width:100%;border-collapse:collapse}
.led td,.led th{padding:5px 4px;border-bottom:1px solid #1a1a1a;text-align:left}
.led th{font-size:10px;opacity:.6;letter-spacing:1.5px}
.you{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;text-align:center}
.you div{background:#0e0e10;border:1px solid #222;border-radius:4px;padding:10px 4px}
.you b{display:block;font:400 30px/1 Bungee,sans-serif;color:#ffb347;text-shadow:0 0 8px rgba(255,160,40,.7)}
.you span{font:700 9px "IBM Plex Mono",monospace;letter-spacing:1px;opacity:.6}

/* ---------- 4 STILL ALIVE: subway tile wall ---------- */
#alive{background-color:#e9e6dc;color:#111;background-image:linear-gradient(rgba(0,0,0,.09) 2px,transparent 2px),linear-gradient(90deg,rgba(0,0,0,.09) 2px,transparent 2px);background-size:64px 32px}
.mosaic{display:inline-block;padding:14px 26px;background:#1c3f2f;border:10px solid transparent;border-image:repeating-linear-gradient(45deg,#c9a24a 0 10px,#7b2d26 10px 20px,#e9e6dc 20px 30px) 10;color:#e9e6dc;font:400 clamp(36px,6vw,86px)/1 "Bungee Shade",Bungee,sans-serif;letter-spacing:2px}
#alive .lede{opacity:1;color:#222;margin-top:18px}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px;margin-top:26px}
.tile{position:relative;display:block;background:#fff;border:2px solid #cfcabd;padding:4px;color:#111;text-decoration:none;transition:opacity .5s,filter .5s,transform .25s}
.tile:hover{transform:scale(1.08);z-index:2}
.tile img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.tile span{display:block;font:700 9px/1.2 "IBM Plex Mono",monospace;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile.out{opacity:.28;filter:grayscale(1)}
.tile.out::after{content:"OUT";position:absolute;left:6px;top:6px;font:400 11px Bungee,sans-serif;background:#111;color:var(--sk-r);padding:1px 5px}
.tile.racing{border-color:var(--sk-r);box-shadow:0 0 0 3px var(--sk-r)}
.tile.racing::before{content:"AT THE GATE";position:absolute;right:6px;top:6px;z-index:1;font:700 8px "IBM Plex Mono",monospace;background:var(--sk-r);color:#fff;padding:1px 4px}

/* ---------- 5 THE WALL: wheatpaste on brick ---------- */
#wall{background:#2a1610 url(UI_brick.jpg) center/cover}
#wall::before{content:"";position:absolute;inset:0;background:linear-gradient(var(--sk-ink),rgba(11,11,13,.25) 18%,rgba(11,11,13,.25) 82%,var(--sk-ink))}
#wall .inner{position:relative}
.pin{position:relative}
@media (min-width:900px){.pin{height:var(--h,300vh)}.pin .stick{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;justify-content:center;overflow:hidden}}
.track{display:flex;gap:46px;padding:20px clamp(16px,4vw,48px) 40px;will-change:transform}
@media (max-width:899px){.track{flex-direction:column;gap:30px}}
.paste{flex:none;width:min(560px,82vw);margin:0;background:var(--sk-paper);color:#141414;padding:12px 12px 16px;transform:rotate(var(--r));box-shadow:0 26px 50px rgba(0,0,0,.55);position:relative}
.paste::before,.paste::after{content:"";position:absolute;width:90px;height:26px;background:rgba(240,230,200,.75);top:-12px;box-shadow:0 2px 4px rgba(0,0,0,.25)}
.paste::before{left:-20px;transform:rotate(-30deg)}.paste::after{right:-20px;transform:rotate(28deg)}
.paste img{width:100%;display:block;filter:contrast(1.04) saturate(1.05)}
.paste figcaption{display:flex;flex-direction:column;gap:4px;padding-top:10px}
.paste small{font:700 10px "IBM Plex Mono",monospace;letter-spacing:1.5px;opacity:.6}
.paste b{font:400 22px/1.05 Bungee,sans-serif}
.paste span{font-size:14px}.paste span a{color:#7b2d26}
.paste code{font-size:9px;opacity:.5;word-break:break-all;line-height:1.4}
.paste.fresh{box-shadow:0 0 0 4px var(--sk-y),0 26px 50px rgba(0,0,0,.55)}
.wframe{aspect-ratio:16/9;border:4px dashed #b19a5a;display:flex;flex-direction:column;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#efe8d4 0 14px,#e6dcc0 14px 28px)}
.wframe span{font:400 120px/1 Bungee,sans-serif;color:#7b2d26}
.wframe em{font:700 12px "IBM Plex Mono",monospace;letter-spacing:4px;font-style:normal;opacity:.7}

/* ---------- 6 HALL OF FAME: awning + letterboard ---------- */
#hall{padding-top:0}
.awning{height:90px;background:repeating-linear-gradient(90deg,#c0392b 0 70px,#f3efe4 70px 140px);position:relative;box-shadow:0 18px 30px rgba(0,0,0,.5)}
.awning::after{content:"";position:absolute;left:0;right:0;bottom:-26px;height:26px;background:radial-gradient(circle at 35px 0,#c0392b 34px,transparent 35px) 0 0/140px 26px,radial-gradient(circle at 105px 0,#f3efe4 34px,transparent 35px) 0 0/140px 26px}
.awning span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#111;color:var(--sk-y);font:400 clamp(20px,3vw,34px)/1 Bungee,sans-serif;padding:8px 22px;white-space:nowrap;letter-spacing:2px}
.letterboard{margin:70px auto 0;max-width:900px;background:#141414;background-image:repeating-linear-gradient(#141414 0 7px,#0a0a0a 7px 9px);border:14px solid #5a3b22;border-radius:6px;padding:26px 30px;box-shadow:0 30px 60px rgba(0,0,0,.6),inset 0 0 30px rgba(0,0,0,.8)}
.lb{width:100%;border-collapse:collapse;font:700 clamp(15px,1.8vw,21px)/1.25 "IBM Plex Mono",monospace;color:#f5f2ea;text-transform:uppercase;letter-spacing:2px}
.lb td{padding:8px 6px;vertical-align:top}
.lb small{display:block;font-size:11px;letter-spacing:1px;opacity:.6;text-transform:none}
.lb .st{color:var(--sk-y)}
.lb .note{font-size:12px;opacity:.6;letter-spacing:1px;text-transform:none}

/* ---------- 7 THE STOOP ---------- */
#stoop{min-height:min(100vh,900px);background:#0d0b0a url(UI_stoop.jpg) right center/cover}
#stoop::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,8,10,.92) 30%,rgba(8,8,10,.35) 62%,transparent),linear-gradient(var(--sk-ink),transparent 14%,transparent 86%,var(--sk-ink))}
#stoop .inner{position:relative}
.steps{list-style:none;padding:0;margin:26px 0 0;max-width:620px;counter-reset:s}
.steps li{counter-increment:s;position:relative;padding:16px 18px 16px 74px;background:rgba(20,16,14,.82);border-top:3px solid #5d4a3b;margin-left:calc(var(--i) * 26px);margin-bottom:8px;box-shadow:0 10px 0 #2a2019}
.steps li::before{content:counter(s);position:absolute;left:16px;top:12px;font:400 38px/1 Bungee,sans-serif;color:var(--sk-y)}
.steps b{display:block;font:400 18px Bungee,sans-serif;margin-bottom:4px}
.steps span{font-size:15px;opacity:.85;line-height:1.45}

/* ---------- 8 THE ENGINE: Bryan's, as a subway map ---------- */
.enggrid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.8fr);gap:40px;align-items:start}
@media (max-width:960px){.enggrid{grid-template-columns:1fr}}
.map{position:relative;margin-top:30px;padding-left:46px}
.map::before{content:"";position:absolute;left:15px;top:10px;bottom:10px;width:10px;border-radius:5px;background:linear-gradient(var(--sk-y),var(--sk-r) 33%,var(--sk-b) 66%,var(--sk-g))}
.stn{position:relative;margin-bottom:26px}
.stn::before{content:"";position:absolute;left:-41px;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;border:5px solid #111;box-shadow:0 0 0 3px #fff}
.stn b{font:400 20px Bungee,sans-serif;display:block}
.stn span{font-size:15px;opacity:.82;line-height:1.5;display:block;max-width:640px}
.stn code{font-size:12px;color:var(--sk-y)}
.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.links a{font:700 11px "IBM Plex Mono",monospace;letter-spacing:1px;padding:9px 12px;border:2px solid rgba(255,255,255,.35);border-radius:999px;color:#fff;text-decoration:none;transition:.2s}
.links a:hover{border-color:var(--sk-y);color:var(--sk-y)}
.placard{display:block;background:var(--sk-paper);color:#111;text-decoration:none;border-radius:4px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.6);transform:rotate(1.2deg);transition:transform .3s}
.placard:hover{transform:rotate(0) scale(1.02)}
.placard img{width:100%;display:block}
.placard div{padding:14px 16px}
.placard small{font:700 10px "IBM Plex Mono",monospace;letter-spacing:2px;opacity:.6}
.placard b{display:block;font:400 26px/1.05 Bungee,sans-serif;margin:4px 0}

/* ---------- 9 THE RIDERS: transit cards ---------- */
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:18px;margin-top:30px;perspective:900px}
.tcard{position:relative;display:block;aspect-ratio:1.586;border-radius:10px;overflow:hidden;color:#111;text-decoration:none;background:linear-gradient(135deg,#ffd23f,#f2b705);box-shadow:0 12px 24px rgba(0,0,0,.45);transform-style:preserve-3d;transition:transform .15s ease-out}
.tc-art{position:absolute;right:0;top:0;bottom:0;width:58%}
.tc-art img{width:100%;height:100%;object-fit:cover;display:block;clip-path:polygon(18% 0,100% 0,100% 100%,0 100%)}
.tc-strip{position:absolute;left:0;right:0;bottom:16%;height:13%;background:#111;opacity:.88}
.tc-no{position:absolute;left:10px;top:8px;font:700 10px "IBM Plex Mono",monospace;letter-spacing:1px}
.tcard b{position:absolute;left:10px;top:24px;width:44%;font:400 15px/1 Bungee,sans-serif}
.tcard b i{display:block;font-style:normal;color:#7b2d26;font-size:12px;margin-top:3px}
.tcard small{position:absolute;left:10px;right:10px;bottom:3%;font:600 9px/1.2 "Space Grotesk",sans-serif;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tcard::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.45) 48%,transparent 60%);transform:translateX(var(--sx,-100%));transition:transform .2s;pointer-events:none}

/* ---------- foot, splash, confetti ---------- */
.foot-fine{padding:40px 0 80px;font-size:14px;opacity:.75;line-height:1.6}
.pigeon-walk{position:absolute;bottom:18px;left:-140px;width:110px;animation:walk 26s linear infinite;pointer-events:none}
@keyframes walk{0%{transform:translateX(0)}48%{transform:translateX(calc(100vw + 280px))}48.01%{transform:translateX(calc(100vw + 280px)) scaleX(-1)}100%{transform:translateX(0) scaleX(-1)}}
@media (prefers-reduced-motion:reduce){.pigeon-walk{animation:none;left:20px}}
.sk-splash{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .25s}
.sk-splash.on{opacity:1;pointer-events:auto}
.sk-splash .in{max-width:780px;width:100%;text-align:center;color:#fff}
.sk-splash img{width:100%;max-height:52vh;object-fit:cover;border-radius:4px;border:8px solid var(--sk-paper);transform:rotate(-1.5deg)}
.sk-splash h3{font:400 clamp(44px,9vw,104px)/.9 Bungee,sans-serif;margin:18px 0 8px;color:var(--sk-y)}
.sk-splash.rekt h3{color:var(--sk-r)}
.sk-splash p{font-size:18px;margin:6px 0}
.sk-splash .acts{display:flex;gap:12px;justify-content:center;margin-top:16px;flex-wrap:wrap}
.sk-splash .acts a,.sk-splash .acts button{font:700 13px "IBM Plex Mono",monospace;padding:12px 16px;border-radius:3px;border:2px solid #111;background:var(--sk-y);color:#111;cursor:pointer;text-decoration:none;box-shadow:4px 4px 0 #000}
.sk-splash .acts button.x{background:transparent;color:#fff;border-color:rgba(255,255,255,.5);box-shadow:none}
.sk-conf{position:fixed;inset:0;pointer-events:none;z-index:91}
""".replace("UI_", UI).replace("TV_L", str(TV["left"])).replace("TV_T", str(TV["top"])).replace("TV_W", str(TV["width"])).replace("TV_H", str(TV["height"]))

def kick(n, c, label):
    return f'<div class="kick"><i style="background:{c}">{n}</i>{label}</div>'

body = f"""
<div class="sk-grain" aria-hidden="true"></div>
<div class="sk-cursor" id="skCur" aria-hidden="true"></div>
<nav class="sk-line" aria-label="Sections">{line_html}</nav>
<div class="sk-tick" aria-hidden="true"><div id="skTick"><span>SKELLY CUP IS LIVE</span><span>100 MARBLES · 5 BOROUGHS · A CHAMPION EVERY 100 MINUTES · FOREVER</span><span>ENGINE BY BRYAN BRINKMAN · MARBLERUN.FUN</span><span>EVERY CHAMPION GETS PAINTED</span><span>FREE TO PLAY · NOTHING STAKED · NOT A BET</span></div></div>
<main class="wrap">

<section class="sec" id="board">
  <div class="board-bg" data-par=".25"></div>
  <canvas id="flick" aria-label="Flick marbles across the chalk board"></canvas>
  <div class="flick-hint" id="flickHint">drag a marble. let it rip.</div>
  <div class="board-in inner">
    {kick("1", "var(--sk-y)", "THE BOARD · A BROOKLYN STREET, AFTER DARK")}
    <h1 class="hero-t" aria-label="SKELLY CUP"><span class="w">SKELLY</span> <span class="w y">CUP</span></h1>
    <div class="hero-row">
      <div>
        <p class="hero-dek">A hundred marbles. <em>A hundred painted New Yorkers</em> riding them. Five lanes, five boroughs, a race every four minutes, a champion every hundred, <em>forever</em>. Every champion gets painted.</p>
        <a class="cred" href="https://marblerun.fun" target="_blank" rel="noopener"><img src="{UI}marble.png" alt="">THE ENGINE: <b>MARBLE RUN</b> BY BRYAN BRINKMAN ↗</a>
      </div>
      <div class="gatebox" id="skGate"><small id="skGateLbl">NEXT GATE</small><strong id="skClock">--</strong></div>
    </div>
    <div class="statbar">
      <div><b id="stT">T{next_t}</b><span>TOURNAMENT</span></div>
      <div><b id="stR">0/25</b><span>RACES RUN</span></div>
      <div><b id="stA">100</b><span>STILL ALIVE</span></div>
      <div><b id="stS">0</b><span>SEEDS BLOWN</span></div>
      <div><b id="stC">{len(champs)}</b><span>CHAMPIONS PAINTED</span></div>
    </div>
    <div class="prog"><i id="skProg" style="width:0"></i></div>
  </div>
</section>

<section class="sec" id="tv">
  <img class="float" src="{UI}flower.png" alt="" style="width:130px;right:4%;top:1%" data-par="-.18">
  <img class="float" src="{UI}nazar.png" alt="" style="width:64px;left:1.5%;top:52%" data-par=".22">
  <div class="inner">
    <div class="tvhead" data-rv>
      <div>{kick("2", "var(--sk-r)", "BODEGA TV · ALWAYS ON")}<h2 class="sign big">THE CAT IS <span class="y">ASLEEP</span>.<br>THE RACE <span class="r">IS NOT</span>.</h2></div>
      <button class="btn" id="watchBig" type="button">WATCH BIG ⤢</button>
    </div>
    <div class="bodega" id="bodega" data-rv>
      <img src="{UI}bodega.jpg" alt="A bodega counter at night: an old CRT television with a sleeping orange cat on top, eye-flowers on the shelves" width="1920" height="1080">
      <div class="screen" id="screen"><iframe src="https://marblerun.fun/" title="Marble Run by Bryan Brinkman, live" loading="lazy" allow="autoplay"></iframe></div>
      <span class="tv-onair">LIVE</span>
      <a class="tv-cred" href="https://marblerun.fun" target="_blank" rel="noopener">MARBLE RUN BY BRYAN BRINKMAN ↗</a>
    </div>
    <div class="under">
      <div class="wars" data-rv>{kick("", "transparent", "BOROUGH WARS · THIS TOURNAMENT")}<div id="skBoros"></div>
        <div class="fine">The lane a marble draws is its borough for that race. Win 5, second 3, third 1. Pick your borough and scream.</div></div>
      <div class="receipt" data-rv><h4>THE WIRE</h4><div class="rh">SKELLY CUP DELI &amp; GRILL · OPEN 24 HRS<br>race feed courtesy of marblerun.fun</div><div id="skLog"><p>Tuning in to Bryan's feed...</p></div></div>
    </div>
  </div>
</section>

<section class="sec" id="gate">
  <div class="inner">
    <div data-rv>{kick("3", "var(--sk-b)", "THE GATE · CHALK ON ASPHALT")}<h2 class="sign big">CALL IT <span class="b">BEFORE</span><br>THE GATE DROPS</h2></div>
    <div class="gategrid" style="margin-top:30px">
      <div data-rv>
        <div class="racehead"><b id="skTitle">Waiting on the gate</b><span class="phase" id="skPhase">--</span></div>
        <div class="meta" id="skMeta"></div>
        <div class="lanes" id="skLanes"></div>
        <div class="callrow"><input id="skName" maxlength="16" placeholder="Your name on the board" autocomplete="nickname"><button class="snd" id="skSnd" aria-pressed="false">SOUND OFF</button>
          <button class="blow" id="skBlow" disabled>BLOW ON IT</button></div>
        <div class="fine">Tap a lane to call it. Then blow on it: 32 random bytes from your phone go straight into Bryan's race seed and get printed in the result forever. The red bar under a lane is the crowd. Free. Nothing staked. Not a bet.</div>
      </div>
      <div class="scoreboard" data-rv>
        <h3>YOUR CARD</h3>
        <div class="you"><div><b id="yCalls">0</b><span>CALLS</span></div><div><b id="yHits">0</b><span>WINNERS</span></div><div><b id="yStreak">0</b><span>STREAK</span></div><div><b id="yBest">0</b><span>BEST</span></div></div>
        <div class="fine led" id="yLine" style="text-shadow:none;color:#ccc">Call a race to start a streak. Three winners in a row and the ticker knows your name.</div>
        <h3 style="margin-top:20px">THE BOARD · T<span id="bT">{next_t}</span></h3>
        <table class="led"><thead><tr><th>#</th><th>NAME</th><th>PTS</th><th>W</th></tr></thead><tbody id="skBoard"><tr><td colspan="4">LOADING</td></tr></tbody></table>
        <div class="fine">5 for the winner, 2 for second, 1 when your blown seed made it into the race. Scored from Bryan's published results, not from anything your phone says.</div>
      </div>
    </div>
  </div>
</section>

<section class="sec" id="alive">
  <div class="inner">
    <div data-rv>{kick("4", "var(--sk-o)", "STILL ALIVE · NEXT STOP, THE FINAL")}<h2 class="mosaic" id="aliveN">100 ALIVE</h2>
    <p class="lede">Heat winners go through. Everybody else goes home until the next tournament. Watch the wall fade from a hundred to five to one. When they're gone, they're gone.</p></div>
    <div class="tiles" id="skAlive">{alive_html}</div>
  </div>
</section>

<section class="sec" id="wall">
  <div class="inner" data-rv>{kick("5", "var(--sk-g)", "THE WALL · CHAMPION'S PORTRAITS")}<h2 class="sign big">EVERY CHAMPION<br>GETS <span class="y">PAINTED</span></h2>
    <p class="lede" style="margin-top:14px">Pasted up on the brick, rider as the subject, and under each one the master seed Bryan's engine reveals when the tournament closes: proof nobody chose the winner. Not us, not Bryan, not you.</p></div>
  <div class="pin" id="pin"><div class="stick"><div class="track" id="track">{wanted}{champ_html}</div></div></div>
</section>

<section class="sec" id="hall">
  <div class="awning"><span>HALL OF FAME · EST. TOURNAMENT 1</span></div>
  <div class="inner"><div class="letterboard" data-rv><table class="lb"><tbody id="skHof"><tr><td>LOADING THE HALL FROM MARBLE RUN...</td></tr></tbody></table></div></div>
</section>

<section class="sec" id="stoop">
  <div class="inner">
    <div data-rv>{kick("7", "var(--sk-r)", "THE STOOP · HOUSE RULES")}<h2 class="sign big">RULES OF<br>THE <span class="y">STOOP</span></h2></div>
    <ol class="steps">
      <li style="--i:4" data-rv><b>Read the gate.</b><span>Every race is announced thirty seconds before it drops: five marbles, five riders, five boroughs. The clock is the only clock that matters.</span></li>
      <li style="--i:3" data-rv><b>Call it.</b><span>One lane, before the gate. After the gate the server says no. Nobody calls a race they already saw.</span></li>
      <li style="--i:2" data-rv><b>Blow on it.</b><span>Your phone sends 32 random bytes into the race seed. If they show up in Bryan's published seeds, you get a point and a receipt forever.</span></li>
      <li style="--i:1" data-rv><b>Ride the streak.</b><span>Winners stack. Seconds count. The board resets every tournament, your best streak never does.</span></li>
      <li style="--i:0" data-rv><b>Get painted.</b><span>Champions get portraits. Ride with them to the end and blow on the final.</span></li>
    </ol>
  </div>
</section>

<section class="sec" id="engine">
  <img class="float" src="{UI}cup.png" alt="" style="width:110px;left:2%;bottom:4%" data-par="-.2">
  <div class="inner enggrid">
    <div>
      <div data-rv>{kick("8", "var(--sk-b)", "THE ENGINE · MARBLE RUN BY BRYAN BRINKMAN")}<h2 class="sign big">THE ENGINE<br>IS <span class="y">BRYAN'S</span></h2>
      <p class="lede" style="margin-top:14px">Every marble, every course, every frame of physics here is Marble Run by Bryan Brinkman. We painted the riders and drew the chalk. Bryan built the thing nobody can rig, and opened it to everyone with a free public API.</p></div>
      <div class="map">
        <div class="stn" data-rv><b>Two numbers decide a race.</b><span>A track seed builds the course, a race seed drives the physics. Same two numbers, same finish, on any machine. The sim is open source.</span></div>
        <div class="stn" data-rv><b>The house seed locks first.</b><span>Each tournament commits a 256 bit master seed by publishing only its hash, <code>sha256(seed ‖ salt)</code>. It is revealed at the end and anyone can check it.</span></div>
        <div class="stn" data-rv><b>The public half lands last.</b><span>At the gate a drand randomness beacon pulse and every seed blown in by players get hashed into the race. Nobody, Bryan included, knows the result before the gate.</span></div>
        <div class="stn" data-rv><b>Replay anything.</b><span>Take any race from the history, load the sim, run the seeds. The marbles finish in the same order. That is the whole trick, and it is beautiful.</span></div>
      </div>
      <div class="links" data-rv>
        <a href="https://marblerun.fun" target="_blank" rel="noopener">MARBLERUN.FUN ↗</a>
        <a href="https://marblerun.fun/api" target="_blank" rel="noopener">THE API ↗</a>
        <a href="https://github.com/bryanbrinkman/marblefun" target="_blank" rel="noopener">THE SOURCE ↗</a>
        <a href="https://marblerun.fun/champions" target="_blank" rel="noopener">HIS HALL OF CHAMPIONS ↗</a>
        <a href="https://x.com/bryanbrinkman" target="_blank" rel="noopener">@BRYANBRINKMAN ↗</a>
        <a href="https://bryanbrinkman.com" target="_blank" rel="noopener">BRYANBRINKMAN.COM ↗</a>
      </div>
    </div>
    <a class="placard" href="h/bryan-brinkman" data-rv>
      <img src="assets/cards/bryan-brinkman-636923ce.jpg" alt="Bryan Brinkman, painted by MLow" loading="lazy">
      <div><small>NEW YORKERS HONORARY</small><b>Bryan Brinkman</b><span class="fine" style="opacity:.8">Painted by MLow: NimBuds at the Warehouse. Artist, builder of Marble Run, the engine under every race on this page.</span></div>
    </a>
  </div>
</section>

<section class="sec" id="riders">
  <div class="inner">
    <div data-rv>{kick("9", "var(--sk-o)", "THE RIDERS · SWIPE IN")}<h2 class="sign big">A HUNDRED<br><span class="y">RIDERS</span></h2>
    <p class="lede" style="margin-top:14px">Every Marble Run marble keeps the name Bryan gave it. Each one rides with a New Yorker from the census. Stars are titles. Tap a card to meet the rider.</p></div>
    <div class="cards" id="cards">{cards_html}</div>
    <p class="foot-fine">Race data, seeds, courses and the simulation are Bryan Brinkman's <a href="https://marblerun.fun/api" rel="noopener">Marble Run API</a>, read live and verifiable by anyone. SKELLY CUP is a free game: no entry, no stake, no odds, no money paid out. Points and portraits are for glory. Art, not an investment.</p>
  </div>
  <img class="pigeon-walk" src="{UI}pigeon.png" alt="">
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
  var UI = B + "assets/skelly/ui/", CAP = {RED:"cap-red", BLUE:"cap-blue", YELLOW:"cap-yellow", GREEN:"cap-green", CREAM:"cap-cream"};
  var BCAP = {Brooklyn:"cap-red", Manhattan:"cap-blue", Queens:"cap-yellow", "Staten Island":"cap-green", "The Bronx":"cap-cream"};
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
    if (!h || !h.titleTable) { setTimeout(function(){ fetch(API + "/api/hall-of-fame").then(function(r){ return r.json(); }).then(hof).catch(function(){}); }, 20000); return; }
    HOF = {}; (h.titleTable || []).forEach(function(t){ HOF[t.id] = t.titles; });
    var rows = (h.titleTable || []).map(function(t, i){ var r = R[t.id]; return "<tr><td>" + (i === 0 ? "👑" : (i + 1) + ".") + "</td><td>" + esc(t.name) + (r ? "<small>" + esc(r.t) + "</small>" : "") + "</td><td class=st>" + "★".repeat(t.titles) + "</td><td>T" + t.lastTournamentId + "</td></tr>"; }).join("");
    $("skHof").innerHTML = rows + "<tr><td colspan=4 class=note>" + (h.tournamentsCompleted || 0) + " tournaments · " + (h.racesRun || 0) + " races · " + (h.distinctChampions || 0) + " different champions · straight from marblerun.fun</td></tr>";
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
    standings.forEach(function(s){ var el = document.querySelector('.tile[data-id="' + s.id + '"]'); if (el) { el.classList.toggle("out", s.status !== "alive"); el.classList.toggle("racing", racing.indexOf(s.id) >= 0); } });
  }

  function boros(){
    var b = {Brooklyn:0, Manhattan:0, Queens:0, "Staten Island":0, "The Bronx":0};
    all().forEach(function(r){ (r.result || []).forEach(function(x){ var n = BORO[x.lane]; if (n) b[n] += x.rank === 1 ? 5 : x.rank === 2 ? 3 : x.rank === 3 ? 1 : 0; }); });
    var max = Math.max.apply(null, [1].concat(Object.values(b)));
    $("skBoros").innerHTML = Object.keys(b).sort(function(x, y){ return b[y] - b[x]; }).map(function(n, i){ return '<div class="war"><img src="' + UI + BCAP[n] + '.png" alt=""><span>' + (i === 0 ? "👑 " : "") + n + '</span><span class="bar"><i style="width:' + (b[n] / max * 100) + '%;background:' + BCOL[n] + '"></i></span><b>' + b[n] + '</b></div>'; }).join("");
  }

  function paint(){
    if (!race) return;
    var k = key(race.key), m = mine[k] || {}, open = race.status === "announced";
    var order = {}; (race.result || []).forEach(function(x){ order[x.marbleId] = x.rank; });
    var rr = race.roster.map(function(x){ var q = rec(x.marbleId); return {id: x.marbleId, rate: q.n ? q.w / q.n : -1}; });
    var best = rr.slice().sort(function(a, b){ return b.rate - a.rate; })[0];
    $("skTitle").textContent = (ROUND[race.roundKey] || race.roundTitle || race.roundKey) + (race.roundKey === "final" ? "" : " " + (race.indexInRound + 1));
    var ph = $("skPhase"); ph.textContent = open ? "AT THE GATE" : race.status === "running" ? "THEY'RE OFF" : "OFFICIAL"; ph.className = "phase" + (open ? "" : race.status === "running" ? " run" : " done");
    $("skMeta").textContent = "tournament " + tid + " · " + race.key + " · track " + race.trackSeed + (race.raceSeed ? " · race seed " + race.raceSeed : " · race seed not born yet");
    $("skLanes").innerHTML = race.roster.map(function(x){
      var r = R[x.marbleId] || {}, q = rec(x.marbleId), t = HOF[x.marbleId] || 0, heat = crowdTotal ? Math.round((crowd[x.marbleId] || 0) / crowdTotal * 100) : 0;
      var tags = (t ? '<span class="tag champ">' + "★".repeat(t) + '</span>' : "") + (best && best.id === x.marbleId && best.rate > 0 ? '<span class="tag hot">HOT</span>' : "") + (heat >= 40 ? '<span class="tag cold">CROWD FAVE</span>' : "");
      var cls = "lane" + (m.pick === x.marbleId ? " picked" : "") + (order[x.marbleId] === 1 ? " won" : "");
      return '<button class="' + cls + '" data-id="' + x.marbleId + '"' + (open ? "" : " disabled") + '>' +
        '<img class="cap" src="' + UI + (CAP[x.lane] || "cap-cream") + '.png" alt="">' + (r.i ? '<img class="art" src="' + B + esc(r.i) + '" alt="">' : '<span></span>') +
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
    var b = e.target.closest(".lane"); if (!b || b.disabled || !race || race.status !== "announced") return;
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
      $("skBoard").innerHTML = j.top.length ? j.top.slice(0, 15).map(function(x, i){ return "<tr><td>" + (i === 0 ? "👑" : i + 1) + "</td><td>" + esc(x.name).toUpperCase() + "</td><td>" + x.points + "</td><td>" + x.winners + "</td></tr>"; }).join("") + '<tr><td colspan="4">' + j.players + " ON THE BOARD</td></tr>" : '<tr><td colspan="4">NOBODY ON THE BOARD YET. FIRST CALL TAKES THE CROWN.</td></tr>';
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
      g.className = "gatebox" + (t <= 10 ? " last" : "");
      if (t <= 10 && t > 0 && lastCallShown !== race.key) { lastCallShown = race.key; var mm = mine[key(race.key)]; if (!mm || mm.pick == null) { log("<b>⏰ LAST CALL on " + race.key + ".</b> Ten seconds. Pick a lane."); } }
      if (t <= 3 && t >= 1) beep(440 + (4 - t) * 120, .09);
    } else { g.className = "gatebox"; $("skGateLbl").textContent = race.status === "running" ? "ON THE TRACK" : "NEXT GATE SOON"; $("skClock").textContent = race.status === "running" ? "LIVE" : "--"; }
  }, 250);
  connect();
})();
</script>
"""



design_js = r"""
<script>
/* SKELLY CUP design layer: marble cursor, flickable marbles on the chalk board, parallax, reveals,
   the subway line scroll map, WATCH BIG dolly into the bodega TV, the sideways wheatpaste wall, card tilt. */
(function(){
  var B = (window.NY && NY.BASE) || "", UI = B + "assets/skelly/ui/";
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia && matchMedia("(pointer: fine)").matches;
  document.body.classList.add("skelly"); if (FINE && !RM) document.body.classList.add("cur");
  var $ = function(id){ return document.getElementById(id); };

  /* hero letters drop in one by one */
  document.querySelectorAll(".hero-t .w").forEach(function(w, wi){
    var t = w.textContent; w.textContent = "";
    t.split("").forEach(function(ch, i){ var s = document.createElement("span"); s.className = "l"; s.textContent = ch; s.style.animationDelay = (RM ? 0 : (wi * 6 + i) * 0.06) + "s"; w.appendChild(s); });
  });

  /* marble cursor */
  var cur = $("skCur"), mx = -100, my = -100, cx = -100, cy = -100;
  if (FINE && !RM) {
    addEventListener("pointermove", function(e){ mx = e.clientX; my = e.clientY; var h = e.target.closest && e.target.closest("a,button,.lane,.tcard,input"); cur.classList.toggle("big", !!h); }, {passive: true});
    (function loop(){ cx += (mx - cx) * .25; cy += (my - cy) * .25; cur.style.transform = "translate(" + cx + "px," + cy + "px) rotate(" + (cx * .8) + "deg)"; requestAnimationFrame(loop); })();
  }

  /* reveals */
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, {rootMargin: "0px 0px -10% 0px"});
  document.querySelectorAll("[data-rv]").forEach(function(el, i){ el.style.transitionDelay = (i % 4) * 0.07 + "s"; io.observe(el); });

  /* subway line: which stop are we at */
  var stops = {}; document.querySelectorAll(".sk-line a").forEach(function(a){ stops[a.dataset.k] = a; });
  var so = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting && stops[e.target.id]) { for (var k in stops) stops[k].classList.toggle("on", k === e.target.id); } }); }, {rootMargin: "-45% 0px -50% 0px"});
  Object.keys(stops).forEach(function(k){ var s = $(k); if (s) so.observe(s); });

  /* parallax + the sideways wall, one scroll handler */
  var par = Array.prototype.slice.call(document.querySelectorAll("[data-par]")), pin = $("pin"), track = $("track"), ticking = false;
  function sizePin(){ if (!pin || !track) return; if (innerWidth < 900) { pin.style.removeProperty("--h"); track.style.transform = ""; return; } var extra = Math.max(0, track.scrollWidth - innerWidth); pin.style.setProperty("--h", (extra + innerHeight) + "px"); }
  function onScroll(){
    ticking = false; var vh = innerHeight;
    if (!RM) par.forEach(function(el){ var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; var d = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.par); el.style.transform = "translate3d(0," + d.toFixed(1) + "px,0)"; });
    if (pin && track && innerWidth >= 900) { var r = pin.getBoundingClientRect(), span = pin.offsetHeight - vh, p = Math.min(1, Math.max(0, -r.top / (span || 1))); track.style.transform = "translate3d(" + (-p * Math.max(0, track.scrollWidth - innerWidth)).toFixed(1) + "px,0,0)"; }
    if (big && Math.abs(scrollY - bigY) > 60) unbig();
  }
  addEventListener("scroll", function(){ if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});
  addEventListener("resize", function(){ sizePin(); onScroll(); });
  addEventListener("load", function(){ sizePin(); onScroll(); });
  sizePin(); onScroll();

  /* WATCH BIG: dolly the camera into the bodega TV until the race fills the screen */
  var bod = $("bodega"), scr = $("screen"), btn = $("watchBig"), big = false, bigY = 0;
  function unbig(){ big = false; bod.style.transform = ""; bod.style.zIndex = ""; btn.textContent = "WATCH BIG ⤢"; }
  btn.onclick = function(){
    if (big) return unbig();
    bod.scrollIntoView({block: "center", behavior: RM ? "auto" : "smooth"});
    setTimeout(function(){
      var b = bod.getBoundingClientRect(), s = scr.getBoundingClientRect();
      var z = Math.min(innerWidth * .94 / s.width, innerHeight * .86 / s.height);
      var bcx = b.left + b.width / 2, bcy = b.top + b.height / 2, scx = s.left + s.width / 2, scy = s.top + s.height / 2;
      var tx = innerWidth / 2 - bcx - (scx - bcx) * z, ty = innerHeight / 2 - bcy - (scy - bcy) * z;
      bod.style.transformOrigin = "50% 50%"; bod.style.zIndex = 50;
      bod.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + z + ")";
      big = true; bigY = scrollY; btn.textContent = "BACK TO THE BODEGA ⤡";
    }, RM ? 0 : 450);
  };
  addEventListener("keydown", function(e){ if (e.key === "Escape" && big) unbig(); });

  /* transit card tilt and shine */
  document.querySelectorAll(".tcard").forEach(function(c){
    if (!FINE || RM) return;
    c.addEventListener("pointermove", function(e){ var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = "rotateY(" + (x * 18) + "deg) rotateX(" + (-y * 18) + "deg) translateZ(10px)"; c.style.setProperty("--sx", (x * 200) + "%"); });
    c.addEventListener("pointerleave", function(){ c.style.transform = ""; c.style.setProperty("--sx", "-100%"); });
  });

  /* THE BOARD: flick glass marbles across the chalk like a skully cap */
  var cv = $("flick"), g = cv.getContext("2d"), img = new Image(), dpr = Math.min(2, devicePixelRatio || 1), W = 0, H = 0, ms = [], drag = null, flicked = false;
  img.src = UI + "marble.png";
  function size(){ var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function seed(){ ms = []; var n = innerWidth < 700 ? 3 : 6, R = innerWidth < 700 ? 22 : 30;
    for (var i = 0; i < n; i++) ms.push({x: W * (.12 + .76 * Math.random()), y: H * (.13 + .12 * Math.random()), vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, r: R * (.8 + Math.random() * .45), a: Math.random() * 6, hue: Math.random() * 360}); }
  function ready(){ size(); if (W > 50 && H > 50 && !ms.length) seed(); ms.forEach(function(m){ m.x = Math.min(Math.max(m.x, m.r), W - m.r); m.y = Math.min(Math.max(m.y, m.r), H - m.r); }); }
  ready(); addEventListener("resize", ready); addEventListener("load", ready); setTimeout(ready, 400);
  function at(e){ var r = cv.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now()}; }
  cv.addEventListener("pointerdown", function(e){ var p = at(e);
    for (var i = ms.length - 1; i >= 0; i--) { var m = ms[i]; if (Math.hypot(p.x - m.x, p.y - m.y) < m.r * 1.5) { drag = {m: m, hist: [p]}; m.vx = m.vy = 0; cv.setPointerCapture(e.pointerId); e.preventDefault(); return; } }
  });
  cv.addEventListener("pointermove", function(e){ if (!drag) return; var p = at(e); drag.m.x = p.x; drag.m.y = p.y; drag.hist.push(p); if (drag.hist.length > 6) drag.hist.shift(); });
  function release(){ if (!drag) return; var h = drag.hist, a = h[0], b = h[h.length - 1], dt = Math.max(16, b.t - a.t) / 16;
    drag.m.vx = Math.max(-40, Math.min(40, (b.x - a.x) / dt * 1.4)); drag.m.vy = Math.max(-40, Math.min(40, (b.y - a.y) / dt * 1.4)); drag = null;
    if (!flicked) { flicked = true; var hint = $("flickHint"); if (hint) hint.style.opacity = 0; if (window.NY && NY.hit) NY.hit("skelly", "flick"); } }
  cv.addEventListener("pointerup", release); cv.addEventListener("pointercancel", release);
  var vis = true; new IntersectionObserver(function(es){ vis = es[0].isIntersecting; }).observe(cv);
  (function step(){
    requestAnimationFrame(step); if (!vis || !img.complete || !ms.length) return;
    g.clearRect(0, 0, W, H);
    for (var i = 0; i < ms.length; i++) { var m = ms[i]; if (drag && drag.m === m) continue;
      m.x += m.vx; m.y += m.vy; m.vx *= .985; m.vy *= .985; m.a += (m.vx) / m.r;
      if (m.x < m.r) { m.x = m.r; m.vx = Math.abs(m.vx) * .7; } if (m.x > W - m.r) { m.x = W - m.r; m.vx = -Math.abs(m.vx) * .7; }
      if (m.y < m.r) { m.y = m.r; m.vy = Math.abs(m.vy) * .7; } if (m.y > H - m.r) { m.y = H - m.r; m.vy = -Math.abs(m.vy) * .7; } }
    for (var i = 0; i < ms.length; i++) for (var j = i + 1; j < ms.length; j++) { var a = ms[i], b = ms[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), md = a.r + b.r;
      if (d > 0 && d < md) { var nx = dx / d, ny = dy / d, o = (md - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
        var p = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (p > 0) { a.vx -= p * nx * .95; a.vy -= p * ny * .95; b.vx += p * nx * .95; b.vy += p * ny * .95; } } }
    ms.forEach(function(m){
      g.save(); g.globalAlpha = .45; g.fillStyle = "#000"; g.beginPath(); g.ellipse(m.x + m.r * .25, m.y + m.r * .55, m.r * .95, m.r * .45, 0, 0, 7); g.fill(); g.restore();
      g.save(); g.translate(m.x, m.y); g.rotate(m.a); g.filter = "hue-rotate(" + m.hue + "deg)"; g.drawImage(img, -m.r, -m.r, m.r * 2, m.r * 2); g.restore();
    });
  })();
})();
</script>
"""

og = latest and latest["og"]
page = shell(title="SKELLY CUP · 100 marbles, 5 boroughs, a champion every 100 minutes · NEW YORKERS by MLow",
             description="Bryan Brinkman's Marble Run with a hundred painted New Yorkers riding. A race every four minutes, a champion every hundred, and every champion gets painted. Call it free, blow on the seed, ride the streak. Not a bet.",
             body=body, path="skelly.html", active="SKELLY", extra_css=css, scripts_after=js + design_js, extra_head=extra_head,
             image=(URL + "/" + og) if og else None,
             keywords=["Marble Run", "Bryan Brinkman", "marble racing", "skelly", "NYC street games", "provably fair", "NEW YORKERS by MLow"],
             jsonld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "SKELLY CUP · NEW YORKERS by MLow", "url": f"{URL}/skelly",
                      "isPartOf": {"@id": URL + "/#site"}, "description": "NEW YORKERS riders on Bryan Brinkman's Marble Run, with a portrait for every champion.",
                      "isBasedOn": {"@type": "SoftwareApplication", "name": "Marble Run", "url": "https://marblerun.fun", "author": {"@type": "Person", "name": "Bryan Brinkman", "url": "https://bryanbrinkman.com"}}}])
open(os.path.join(SITE, "skelly.html"), "w", encoding="utf-8").write(page)
print(f"wrote skelly.html: {len(riders)} riders, {len(champs)} champion portraits, next frame T{next_t}")
