#!/usr/bin/env python3
"""new-rooms.html: every room added to THE MUSEUM after the first 111, newest first, generated from rooms.json.
Runs inside build_all.sh after rooms_registry.py; build_seo.py then injects the seo block.

2026-10-06 (MLow: refresh the earlier pages): rebuilt on page_shell so it carries the site nav, footer and
mint bar like every other page, leads with the rooms that just opened, and its intro no longer names a fixed
count, because the old one described 25 rooms while the grid held 72. Room links open the room directly:
the museum skips the three room entrance for a #room= link."""
import json, os
from page_shell import shell, esc

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
ALL = json.load(open(os.path.join(HERE, "rooms.json")))
rooms = sorted([r for r in ALL if r["index"] >= 112], key=lambda r: -r["index"])
first, last = min(r["index"] for r in rooms), max(r["index"] for r in rooms)
FRESH = 4  # the newest rooms get the big cards up top


def card(r, big=False):
    return (f'<a class="card{" big" if big else ""}" href="museum.html#room={r["id"]}">'
            f'<img src="assets/museum/rooms/{r["id"]}.jpg" alt="{esc(r["name"])}, a walkable room in THE MUSEUM" loading="lazy" width="640" height="360">'
            f'<div><small>ROOM {r["index"]} · {esc(r["area"])}</small><h2>{esc(r["name"])}</h2>'
            f'<p>{esc(r["mood"] if not big else r["description"])}</p><span>Walk inside ↗</span></div></a>')


fresh = "".join(card(r, True) for r in rooms[:FRESH])
rest = "".join(card(r) for r in rooms[FRESH:])
body = f'''<main class="nr wrap">
<header><p class="kicker">THE MUSEUM · ROOMS {first} TO {last}</p>
<h1>The city behind<br>the city.</h1>
<p class="lede">{len(rooms)} rooms opened in THE MUSEUM after the first 111, and the count keeps climbing: working worlds,
landmarks, the city in motion, houses of worship, the night markets and the parks, Penn Station as it stood,
a Crystal Palace, and a Hall of Fame for every honorary New Yorker. Each one hangs the painted New Yorkers who belong there
and keeps New York time. Tap a room and you are standing in it.</p>
<p class="ctas"><a class="btn" href="museum.html#room=random">Spin for a room ↗</a><a class="btn ghost" href="museum.html">All {len(ALL)} rooms</a></p></header>
<h3 class="sec">JUST OPENED</h3>
<div class="grid fresh">{fresh}</div>
<h3 class="sec">EVERY ROOM SINCE 111, NEWEST FIRST</h3>
<div class="grid">{rest}</div>
<p class="fine">The interiors are original speculative spaces and interpretive landmark adaptations, not measured reconstructions.</p>
<div id="share"></div>
</main>'''

css = '''
.nr{padding-top:120px;padding-bottom:80px;max-width:1440px;margin:0 auto}
.nr h1{font-size:clamp(46px,7vw,96px);font-weight:700;line-height:.95;letter-spacing:-.02em;margin:18px 0 22px}
.nr .lede{font-family:var(--sans);color:#CFD3CC;max-width:760px;line-height:1.7;font-size:17px}
.nr .ctas{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0 56px}
.nr .btn.ghost{background:transparent;color:var(--cloud);border-color:var(--divider)}
.nr .sec{font:600 12px var(--sans);letter-spacing:.3em;color:var(--acid);margin:0 0 18px}
.nr .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-bottom:56px}
.nr .grid.fresh{grid-template-columns:repeat(2,1fr)}
.nr .card{background:var(--card);border:1px solid var(--divider);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .2s}
.nr .card:hover{border-color:var(--cyan);color:var(--cloud)}
.nr .card img{width:100%;aspect-ratio:16/9;object-fit:cover}
.nr .card div{padding:18px 20px 22px;display:flex;flex-direction:column;flex:1}
.nr .card small{font:10px var(--mono);letter-spacing:.12em;color:var(--slate)}
.nr .card h2{font-size:24px;font-weight:600;margin:10px 0 8px}
.nr .card.big h2{font-size:32px}
.nr .card p{font-family:var(--sans);color:#A9B3BF;line-height:1.55;font-size:14px;flex:1}
.nr .card.big p{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.nr .card span{font:600 13px var(--sans);color:var(--cyan);margin-top:14px}
.nr .fine{font:12px/1.6 var(--mono);color:var(--slate);max-width:760px;margin-bottom:28px}
@media (max-width:1000px){.nr .grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:640px){.nr{padding-top:96px}.nr .grid,.nr .grid.fresh{grid-template-columns:1fr;gap:16px}}
'''

page = shell(title="The new rooms · THE MUSEUM · NEW YORKERS by MLow",
             description=f"{len(rooms)} rooms added to THE MUSEUM after the first 111, newest first: the Hall of Fame of the honoraries, the arrival, the Crystal Palace, Penn Station as it stood, and every room since. Tap one and you are inside it.",
             body=body, path="new-rooms.html", active="MUSEUM", extra_css=css,
             scripts_after='<script>NY.shareRow&&NY.shareRow(document.getElementById("share"),{title:"The new rooms of THE MUSEUM",text:"Every room added to THE MUSEUM by MLow, newest first. Tap one and you are standing in it."});</script>')
open(os.path.join(SITE, "new-rooms.html"), "w", encoding="utf-8").write(page)
print(f"new-rooms.html: {len(rooms)} rooms ({first} to {last}), newest first")
