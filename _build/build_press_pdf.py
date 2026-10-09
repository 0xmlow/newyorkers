#!/usr/bin/env python3
"""assets/press/new-yorkers-press-sheet.pdf: the one page press sheet editors ask for (MLow 2026-10-06).

Laid out as HTML from the live numbers (assets/counts.js, api/collectors.json, the honoraries hang, rooms.json)
and the release ledger (_build/releases.json), then printed to a single US Letter page by headless Chrome over
the DevTools protocol, the same way the museum shots are taken. Fonts are the local OFL files, so the PDF never
depends on a network font. Rerun after anything it quotes changes; build_all runs it. No dashes, by house rule:
the script refuses to write a sheet that contains one."""
import base64, json, os, re, subprocess, sys, tempfile, time, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, "museum"))
import websocket  # vendored beside shot_room.py

A = lambda *p: os.path.join(SITE, "assets", *p)
FD = os.path.join(HERE, "honoraries", "fonts")
OUT = A("press", "new-yorkers-press-sheet.pdf")
WORK = os.path.join(HERE, "press_sheet"); os.makedirs(WORK, exist_ok=True)

cj = open(A("counts.js"), encoding="utf-8").read(); K = json.loads(cj[cj.index("{"):cj.rindex("}") + 1])
C = K["counts"]
col = json.load(open(os.path.join(SITE, "api", "collectors.json")))["meta"]
hang = json.load(open(A("museum", "honor", "hang.json")))
REL = json.load(open(os.path.join(HERE, "releases.json")))["releases"]
d = open(A("data.js")).read(); D = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
byn = {p.get("n"): p for p in D["pieces"]}
num = lambda n: f"{n:,}"
roman = D["story"]["eras"][-1]["roman"]

facts = [("Characters in the census", num(C["pieces"])), ("Paintings, every state", num(C["states"])),
         ("Eras", f"{roman} and counting"), ("Walkable museum rooms", num(K["rooms"])),
         ("Honorary portraits", num(len(hang))), ("Collectors on chain", num(col["collectors"])),
         ("On New York City taxis", "5,000+ cabs"), ("Shown on the street", "50 exhibitions, 16 countries")]
# one line per release, from the ledger's own fields; the census format sentence opens with its own name, so it is said plainly
FMT = {"census": "ERC-721 tokens on OpenSea, dynamic by metadata; each carries a stack of states in its own viewer"}
def rline(r):
    size = f'{r["count"]:,}' + (" and counting" if r.get("countIsOpen") else "")
    return f'{size}. {FMT.get(r["id"], r["format"].split(".")[0])}. {r["platform"]}. {r["when"]}'
rel = "".join(f'<div class="rel"><b>{r["name"]}</b><span>{rline(r)}</span></div>' for r in REL)
p4400 = byn.get(4400)
imgs = [(A("keystone", "1l.jpg"), "KEYSTONE NO. 1 · THE BODEGA MATRIARCH"),
        (A("t", p4400["st"][0] + ".jpg") if p4400 else A("keystone", "2l.jpg"), f"NO. 4400 · {p4400['t'].upper()}" if p4400 else "KEYSTONE NO. 2"),
        (A("press", "rooms", "honoraries.jpg"), "THE MUSEUM · ROOM 183, THE HALL OF FAME")]
def small(p, i):  # the sheet prints the pictures about two inches wide: 900 px keeps the PDF small enough to email
    from PIL import Image
    q = os.path.join(WORK, f"img{i}.jpg"); im = Image.open(p).convert("RGB"); im.thumbnail((900, 900)); im.save(q, quality=82); return q
fig = "".join(f'<figure><img src="file://{small(p, i)}"><figcaption>{c}</figcaption></figure>' for i, (p, c) in enumerate(imgs))
asof = col.get("asOf", "").split(" at ")[0]

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:F;src:url("file://{FD}/Fraunces.ttf")}}
@font-face{{font-family:G;src:url("file://{FD}/SpaceGrotesk.ttf")}}
@font-face{{font-family:M;src:url("file://{FD}/IBMPlexMono-Medium.ttf")}}
@page{{size:Letter;margin:0}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:8.5in;height:11in;padding:.5in .55in;font-family:G;color:#080D16;background:#EEE6D3;display:flex;flex-direction:column}}
header{{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #080D16;padding-bottom:10px}}
header img{{height:26px}}
.k{{font-family:M;font-size:8.5px;letter-spacing:.2em;text-transform:uppercase;color:#4692C2}}
h1{{font-family:F;font-weight:800;font-size:64px;line-height:.95;margin:16px 0 6px;letter-spacing:-.01em}}
.line{{font-family:F;font-style:italic;font-size:21px;margin-bottom:12px}}
p.body{{font-size:11.5px;line-height:1.6;margin-bottom:8px;color:#222}}
.grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0 12px}}
.grid div{{background:#fff;border:1px solid #d9d4c7;border-radius:6px;padding:7px 9px}}
.grid span{{display:block;font-family:M;font-size:7px;letter-spacing:.14em;text-transform:uppercase;color:#5a6470}}
.grid b{{display:block;font-family:F;font-size:19px;margin-top:2px}}
h2{{font-family:M;font-size:9px;letter-spacing:.22em;text-transform:uppercase;margin:4px 0 6px;color:#080D16}}
.rel{{display:flex;gap:10px;font-size:10.5px;line-height:1.45;padding:6px 0;border-bottom:1px solid #d9d4c7}}
.rel b{{flex:0 0 1.55in;font-family:M;font-size:9px;letter-spacing:.06em}}
.figs{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0 10px}}
figure img{{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:5px;display:block}}
figcaption{{font-family:M;font-size:7.5px;letter-spacing:.12em;margin-top:4px;color:#444}}
footer{{margin-top:auto;border-top:3px solid #080D16;padding-top:9px;display:flex;justify-content:space-between;gap:16px;font-family:M;font-size:8px;letter-spacing:.1em;line-height:1.7;text-transform:uppercase}}
footer b{{color:#4692C2}}
</style></head><body>
<header><img src="file://{A('brand','logo_black.png')}"><span class="k">Press sheet · as of {asof}</span></header>
<div class="k" style="margin-top:14px">A living census of the greatest city on earth</div>
<h1>NEW YORKERS</h1>
<div class="line">Every New Yorker gets a portrait. Even the villains.</div>
<p class="body">NEW YORKERS by MLow is a living, painted census of New York City: {num(C["pieces"])} characters and counting, from the Subway Samaritan to the Rat King to Midnight itself, in a psychedelic style where flowers bloom with human eyes because the city is watching back. Every one has a number, a story and a place on the map of the five boroughs, and all of it is free to explore at n3wyorkers.com, along with a walkable museum of {K["rooms"]} New York rooms and a sourced reading room on the city's history.</p>
<p class="body">MLow's work has run on more than 5,000 New York City taxis and in 50 group exhibitions with Art Crush Gallery on public screens across 16 countries in 2026. The collection is sold in named releases, each announced in advance, and no New Yorker is ever sold twice.</p>
<div class="grid">{"".join(f'<div><span>{a}</span><b>{b}</b></div>' for a, b in facts)}</div>
<h2>The releases</h2>{rel}
<div class="figs">{fig}</div>
<footer><div><b>Contact</b><br>X @degens · Instagram and TikTok @0xmlow<br>Interviews, studio visits, 2560 px masters on request</div>
<div><b>Online</b><br>n3wyorkers.com · press room n3wyorkers.com/press<br>Artist mlow.xyz · Prints mlow.nyc</div>
<div><b>Credit line</b><br>NEW YORKERS by MLow,<br>courtesy of the artist<br>Art, not an investment</div></footer>
</body></html>"""
if re.search("[—–]", html): sys.exit("press sheet: a dash got in; house rule says no")
src = os.path.join(WORK, "sheet.html"); open(src, "w", encoding="utf-8").write(html)

CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; port = 9421
chrome = subprocess.Popen([CH, "--headless=new", f"--remote-debugging-port={port}", "--user-data-dir=" + tempfile.mkdtemp(prefix="presspdf-"),
                           "--allow-file-access-from-files", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    H = f"http://127.0.0.1:{port}"
    for _ in range(80):
        try: urllib.request.urlopen(H + "/json/version"); break
        except Exception: time.sleep(.25)
    tab = json.load(urllib.request.urlopen(urllib.request.Request(H + "/json/new?about:blank", method="PUT")))
    ws = websocket.create_connection(tab["webSocketDebuggerUrl"], max_size=None, suppress_origin=True); n = [0]
    def send(m, **p):
        n[0] += 1; ws.send(json.dumps({"id": n[0], "method": m, "params": p}))
        while True:
            x = json.loads(ws.recv())
            if x.get("id") == n[0]: return x.get("result", {})
    send("Page.enable"); send("Page.navigate", url="file://" + src); time.sleep(2.5)
    pdf = send("Page.printToPDF", printBackground=True, paperWidth=8.5, paperHeight=11, marginTop=0, marginBottom=0, marginLeft=0, marginRight=0, preferCSSPageSize=True)
    data = base64.b64decode(pdf["data"])
    pages = len(re.findall(rb"/Type\s*/Page[^s]", data))
    if pages != 1: sys.exit(f"press sheet: came out at {pages} pages, it must be one")
    open(OUT, "wb").write(data)
    print(f"press sheet: 1 page, {len(data)//1024} KB, as of {asof}")
finally:
    chrome.kill()
