#!/usr/bin/env python3
"""marks.html: THE MARKS, release one. 150 of the uncounted plus the nine era closers not in KEYSTONE.

THE MARKS was merged on 2026-10-09 (MLow): the 150 New Yorkers curated from the 5,555 left off the count
when THE CENSUS RELEASE was cut to 1,111, plus the era closers. Nine closers were already in KEYSTONE, so
they stay there; reserved.json holds the release's numbers and is the only list this page draws from.

Inputs
  ../THE MARKS 2026-10-07/MARKS_150.csv               mark order, census numbers, the eleven former THE ONES
  ../THE MARKS 2026-10-07/character_sheets/*cast.json  loglines for the eleven and the closers
  assets/data.js, assets/geo.js                         titles, places, thumbs, map coordinates
  assets/marks/                                         Krea plates (site_kit/raw in the MARKS folder) and the loops
Outputs
  marks.html, api/marks.json, assets/marks/th/<n>.jpg (480 px thumbs, made once)

Design (second pass, 2026-10-09, MLow: "creative, New York culture throughout, custom, awwwards"): the page is
one night in the city, every section a New York object painted on Krea (site_kit/raw2): subway doors open on a
newsstand, a tabloid front page, car cards, a deli counter where you take a number (the mint), a platform
you ride sideways past the Marks, the census ledger, a POST NO BILLS wall (the four layers, a street clock, a
tear off flyer), an MTA style map, a Broadway marquee and playbills (the eleven), a roll gate at last call (the
closers), a three card monte box (the fair shuffle) and a stack of parking signs (the release). None of the
mechanics are on chain yet; the copy says so. Run after build_data and before build_seo; part of build_all.sh.
"""
import csv, json, os, hashlib, math, re
from page_shell import shell, esc, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
MK = os.path.join(ROOT, "THE MARKS 2026-10-07")
A = os.path.join(SITE, "assets", "marks")
URL = cfg()["siteUrl"]

def load_js(p):
    s = open(os.path.join(SITE, "assets", p), encoding="utf-8").read()
    return json.loads(s[s.index("=") + 1:].rstrip().rstrip(";"))
D = load_js("data.js"); G = load_js("geo.js")
byn = {p["n"]: p for p in D["pieces"] if p.get("n") is not None}
geo = {g["id"]: g for g in G["pieces"]}
REL = next(r for r in json.load(open(os.path.join(HERE, "releases.json")))["releases"] if r["id"] == "marks")
RES = {x["id"]: x for x in json.load(open(os.path.join(HERE, "reserved.json")))["reservations"]}
ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"]
ERAS = {e["i"]: e for e in (D.get("story") or {}).get("eras", []) if isinstance(e, dict) and "i" in e}

rows = list(csv.DictReader(open(os.path.join(MK, "MARKS_150.csv"))))
cast11 = {c["census"]: c for c in json.load(open(os.path.join(MK, "character_sheets", "cast.json")))["characters"]}
closer_cast = {c["census"]: c for c in json.load(open(os.path.join(MK, "character_sheets", "era_closers", "cast.json")))["characters"]}
closers = sorted(set(RES["the_marks"]["numbers"]) - {int(r["census_number"]) for r in rows})
assert len(rows) == 150 and len(closers) == REL["count"] - 150, (len(rows), closers)
in_keystone = sorted(set(closer_cast) & set(RES["keystone"]["numbers"]))

def boro(p, fallback=""):
    return fallback or (p.get("b") or "Citywide").split(" (")[0]

def thumb(p):
    """480 px copy of the census thumb, made once into assets/marks/th"""
    out = os.path.join(A, "th", f"{p['n']}.jpg")
    if not os.path.exists(out):
        from PIL import Image
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im = Image.open(os.path.join(SITE, "assets", "t", p["st"][0] + ".jpg")).convert("RGB")
        im.thumbnail((480, 480 * 3), Image.LANCZOS); im.save(out, quality=78, optimize=True, progressive=True)
    return f"assets/marks/th/{p['n']}.jpg"

def short(t):
    """later eras title a piece as 'Name, a woman who ...'; the card shows the name, the alt keeps all of it"""
    for k in (", a ", ", an ", ", the "):
        if k in t and len(t) > 34: return t.split(k)[0]
    return t

def item(n, kind, mark=None, borough="", ones=False):
    p = byn[n]; g = geo.get(p["id"], {})
    c = cast11.get(n) if kind == "u" else closer_cast.get(n)
    loop = os.path.exists(os.path.join(A, "loops", f"{n}.mp4"))
    e = p.get("e") or 0
    return {"n": n, "k": kind, "m": mark, "t": short(p["t"]), "full": p["t"], "id": p["id"], "b": boro(p, borough), "nb": p.get("nb") or p.get("loc") or "",
            "era": ROMAN[e] if e < len(ROMAN) else str(e), "f": p.get("f", ""), "th": thumb(p), "alt": (f"assets/t/{p['st'][1]}.jpg" if len(p.get("st") or []) > 1 else None),
            "lp": f"assets/marks/loops/{n}.mp4" if loop else None, "gl": (p.get("gl") or {}).get("mp4"), "ones": ones,
            "lat": g.get("lat"), "lon": g.get("lon"), "s": (c or {}).get("logline") or (p.get("story") or "")}

ITEMS = [item(int(r["census_number"]), "u", int(r["mark"]), r["borough"], bool(r.get("was_the_ones"))) for r in rows]
ITEMS += [item(n, "c") for n in closers]
U = [x for x in ITEMS if x["k"] == "u"]; C = [x for x in ITEMS if x["k"] == "c"]
ELEVEN = [x for x in U if x["ones"]]
LOOPS = [x for x in U if x["lp"]]
BOROS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Citywide"]
bcount = {b: sum(1 for x in U if x["b"] == b) for b in BOROS}
# the list commitment: anyone can recompute this from the page or api/marks.json
LIST = ",".join(str(x["n"]) for x in U)
LIST_HASH = hashlib.sha256(LIST.encode()).hexdigest()
_sh = open(os.path.join(MK, "mint_kit", "reveal", "SHUFFLE.md")).read()
_f = lambda k: re.search(r"\| " + k + r" \| (\S+) \|", _sh).group(1)
SHUFFLE = {"algorithm": "sha256(seed || blockhash), Fisher Yates from the end, reveal.py in the kit", "seed": _f("seed \(32 bytes, hex\)"),
           "seedSha256": _f("seed sha256"), "block": int(_f("block")), "blockHash": _f("block hash"),
           "tokenMap": [{"token": int(x["token"]), "census": int(x["census"]), "mark": int(x["mark"])}
                        for x in csv.DictReader(open(os.path.join(MK, "mint_kit", "reveal", "TOKEN_MAP.csv")))]}
assert len(SHUFFLE["tokenMap"]) == 150
_st = os.path.join(MK, "mainnet", "state.json")
CONTRACT = (json.load(open(_st)).get("contract") if os.path.exists(_st) else None) or None   # set by mainnet/go_live.py once deployed
RARE_MINTER = "0x5fa112EFeD8297bec0010b312208d223E0cE891E"        # RareMinter on mainnet (rare-sdk addresses.js); mintDirectSale lives here
MARKET_SETTINGS = "0x61DBF87164d33FD3695256DC8Ba74D3B1d304170"    # MarketplaceSettings on mainnet; getMarketplaceFeePercentage() = 3
MINT = {"contract": CONTRACT, "minter": RARE_MINTER, "settings": MARKET_SETTINGS, "priceWei": "69000000000000000", "price": "0.069", "max": 150, "perTx": 5,
        "map": [[r["token"], r["mark"], r["census"]] for r in SHUFFLE["tokenMap"]]} if CONTRACT else None
MINT_HTML = f"""
<section class="s-mint" id="mint">
  <div class="wrap">
    <p class="kick" data-rv>Now minting · instant reveal</p>
    <h2 class="big" data-rv>Mint a Mark.</h2>
    <p class="sub" data-rv>0.069 ETH on SuperRare's contracts. The order was shuffled once before the drop and published below. Your ticket is the next number on the roll, and it opens the moment it mints. Nothing is sealed, nobody waits.</p>
    <div class="mt" data-rv>
      <div class="mt-count"><b><span id="mt-n">…</span> of 150</b> minted · <span id="mt-left">…</span> left<div class="mt-track"><i id="mt-bar"></i></div></div>
      <p class="mt-next" id="mt-next">Next ticket</p>
      <div class="mt-row"><label>How many <select id="mt-qty"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label><button type="button" class="btn" id="mt-go">MINT · 0.069 ETH</button></div>
      <p class="mt-total" id="mt-total"></p>
      <p class="mt-st" id="mt-st" aria-live="polite"></p>
      <div class="mt-got" id="mt-got"></div>
      <p class="fine">Contract <a href="https://etherscan.io/address/{CONTRACT}">{CONTRACT}</a>. Mints go through SuperRare's RareMinter at <a href="https://etherscan.io/address/{RARE_MINTER}#writeContract">{RARE_MINTER}</a>, which adds its 3% fee. No wallet in this browser? Any wallet can call mintDirectSale on that contract, or run <code>rare listing release mint --contract {CONTRACT} --quantity 1</code>. Art, not an investment.</p>
    </div>
  </div>
</section>
""" if CONTRACT else ""

# ---------- the map, projected from geo.js ----------
LON0, LON1, LAT0, LAT1 = -74.27, -73.69, 40.49, 40.92
KX = math.cos(math.radians(40.7))
W = 1000; H = round(W * (LAT1 - LAT0) / ((LON1 - LON0) * KX))
def xy(lon, lat): return ((lon - LON0) / (LON1 - LON0) * W, (LAT1 - lat) / (LAT1 - LAT0) * H)
paths = []
for b in G["boro"]:
    d = []
    for ring in b["r"]:
        pts, last = [], None
        for lon, lat in ring:
            x, y = xy(lon, lat)
            if last and abs(x - last[0]) + abs(y - last[1]) < 2.2: continue
            pts.append(f"{x:.0f} {y:.0f}"); last = (x, y)
        if len(pts) > 3: d.append("M" + "L".join(pts) + "Z")
    paths.append(f'<path class="bo" data-b="{esc(b["n"])}" d="{"".join(d)}"/>')
for x in ITEMS:
    if x["lat"] is not None: x["x"], x["y"] = [round(v, 1) for v in xy(x["lon"], x["lat"])]
    for k in ("lat", "lon"): x.pop(k, None)

# ---------- api ----------
os.makedirs(os.path.join(SITE, "api"), exist_ok=True)
json.dump({"release": "THE MARKS", "count": REL["count"], "status": REL["status"], "platform": REL["platform"],
           "uncounted": [{"mark": x["m"], "census": x["n"], "title": x["t"], "borough": x["b"], "neighborhood": x["nb"], "era": x["era"],
                          "record": f"{URL}/n/{x['id']}", "wasTheOnes": x["ones"]} for x in U],
           "eraClosers": [{"census": x["n"], "title": x["t"], "era": x["era"], "record": f"{URL}/n/{x['id']}"} for x in C],
           "listCommitment": {"algorithm": "sha256", "of": "the 150 census numbers in mark order, comma separated, no spaces", "hash": LIST_HASH},
           "contract": CONTRACT, "chain": "ethereum mainnet" if CONTRACT else None, "shuffle": SHUFFLE, "note": "Instant reveal. The 150 were shuffled once before the drop with the seed and block above; token 1 is the first mint. Every Mark opens the moment it is minted."},
          open(os.path.join(SITE, "api", "marks.json"), "w"), ensure_ascii=False, indent=1)

def v(rel):
    """content hash so the immutable cache rule on assets/marks never serves an old plate"""
    return f"{rel}?v={hashlib.sha256(open(os.path.join(SITE, rel), 'rb').read()).hexdigest()[:8]}"

# ---------- the night, section by section ----------
def short_story(s, n=110):
    s = (s or "").strip().rstrip(".")
    return s if len(s) <= n else s[:n].rsplit(" ", 1)[0] + "…"

def tally_svg(n, cls="tl"):
    """n strokes drawn as chalk tally groups: four uprights and a slash"""
    out = []
    for g in range(0, n, 5):
        k = min(5, n - g); s = []
        for i in range(min(k, 4)):
            s.append(f'<path d="M{6 + i * 9} 4 L{5 + i * 9 + (i % 2)} 40"/>')
        if k == 5: s.append('<path class="sl" d="M0 33 L40 10"/>')
        out.append(f'<svg class="{cls}" viewBox="-2 0 44 44" aria-hidden="true">{"".join(s)}</svg>')
    return "".join(out)

LINEC = {"Bronx": "var(--l7)", "Manhattan": "var(--lN)", "Brooklyn": "var(--l1)", "Queens": "var(--lA)", "Staten Island": "var(--lB)", "Citywide": "var(--lG)"}
LETTER = {"Bronx": "X", "Manhattan": "M", "Brooklyn": "B", "Queens": "Q", "Staten Island": "S", "Citywide": "C"}
RIDE_ORDER = ["Bronx", "Manhattan", "Brooklyn", "Queens", "Staten Island", "Citywide"]
STATION = {"Bronx": "149 ST · THE BRONX", "Manhattan": "TIMES SQ · MANHATTAN", "Brooklyn": "ATLANTIC AV · BROOKLYN",
           "Queens": "JACKSON HTS · QUEENS", "Staten Island": "ST GEORGE · STATEN ISLAND", "Citywide": "ALL STOPS · CITYWIDE"}

def ride_pick(b, k=4):
    xs = [x for x in U if x["b"] == b]
    xs.sort(key=lambda x: (not x["lp"], not x["gl"], x["m"]))
    return sorted(xs[:k], key=lambda x: x["m"])

def media(x, cls=""):
    mv = x["lp"] or x["gl"]
    vid = f'<video muted loop playsinline preload="none" data-src="{esc(mv)}"></video>' if mv else ""
    return f'<img src="{esc(x["th"])}" alt="{esc(x["full"])}, by MLow" loading="lazy" decoding="async">{vid}'

def poster(x):
    tag = "MOVES" if x["lp"] else ("GLITCH" if x["gl"] else "")
    return (f'<a class="post" href="n/{esc(x["id"])}" data-cur="Open" data-mv="{1 if (x["lp"] or x["gl"]) else 0}">'
            f'<span class="frame">{media(x)}{f"<b class=tag>{tag}</b>" if tag else ""}</span>'
            f'<span class="cc"><i>MARK {x["m"]:03d}</i><strong>{esc(x["t"])}</strong><small>{esc(x["nb"] or x["b"])}</small></span></a>')

track = []
for b in RIDE_ORDER:
    if not bcount.get(b): continue
    track.append(f'<div class="stn" style="--lc:{LINEC[b]}"><div class="tab"><span class="bul">{LETTER[b]}</span><b>{esc(b.upper())}</b><small>{esc(STATION[b])}</small><em>{bcount[b]} Marks</em></div></div>')
    track += [poster(x) for x in ride_pick(b)]
track.append('<a class="stn end" href="#ledger" data-cur="Ledger"><div class="tab"><span class="bul">150</span><b>END OF THE LINE</b><small>EVERY MARK IS IN THE LEDGER</small><em>Open the ledger</em></div></a>')

def row(x):
    place = esc(x["nb"] or x["b"])
    return (f'<a class="lr" href="n/{esc(x["id"])}" data-b="{esc(x["b"])}" data-th="{esc(x["th"])}" data-lp="{esc(x["lp"] or "")}" data-ones="{1 if x["ones"] else 0}" data-mv="{1 if (x["lp"] or x["gl"]) else 0}">'
            f'<span class="no">{x["m"]:03d}</span><span class="nm">{esc(x["t"])}{" <sup>ONCE THE ONES</sup>" if x["ones"] else ""}</span>'
            f'<span class="pl">{place}</span><span class="bo" style="--lc:{LINEC.get(x["b"], "var(--lG)")}">{LETTER.get(x["b"], "C")}</span>'
            f'<span class="er">{x["era"]}</span><span class="tk">{tally_svg(1, "tl s")}</span></a>')

tabs = "".join(f'<button type="button" class="tabb" data-f="b:{esc(b)}" style="--lc:{LINEC[b]}"><span class="bul">{LETTER[b]}</span>{esc(b)} <i>{bcount[b]}</i></button>' for b in BOROS if bcount[b])

def playbill(x):
    return (f'<article class="pb" tabindex="0" data-cur="Flip"><div class="pb-in">'
            f'<div class="pb-f"><header>THE MARKS <small>PRESENTS</small></header><div class="pb-art">{media(x)}</div>'
            f'<footer><strong>{esc(x["t"])}</strong><small>MARK {x["m"]:03d} · NO. {x["n"]:04d} · {esc(x["nb"] or x["b"])}</small></footer></div>'
            f'<div class="pb-b"><header>WHO\'S WHO IN THE CAST</header><h4>{esc(x["t"])}</h4><p>{esc(x["s"])}</p>'
            f'<p class="was">Counted first as one of THE ONES. Sent back to the pool. Left off the count. Now a Mark.</p><a href="n/{esc(x["id"])}">Read the record</a></div>'
            f'</div></article>')

def closer(x):
    return (f'<a class="cl" href="n/{esc(x["id"])}" data-cur="Mint"><span class="cl-art">{media(x)}</span>'
            f'<span class="cl-tx"><i>ERA {x["era"]} CLOSER · NO. {x["n"]:04d}</i><strong>{esc(x["t"])}</strong><small>{esc(short_story(x["s"], 140))}</small></span></a>')

stickers = sorted(f for f in os.listdir(os.path.join(SITE, "assets", "stickers")) if f.endswith(".png"))[:8]
logos = [f"assets/brand/logos/n3w-{i:02d}-s.jpg" for i in (3, 7, 11) if os.path.exists(os.path.join(SITE, "assets", "brand", "logos", f"n3w-{i:02d}-s.jpg"))]
ZIP = " ★ ".join(["EXTRA", "5,555 NEW YORKERS LEFT OFF THE COUNT", "150 GET THE MARK", "REVEALED THE MOMENT IT MINTS", "NOBODY PICKS, NOT EVEN THE ARTIST",
                  f"{len(C)} ERA CLOSERS AT LAST CALL", "ELEVEN WERE THE ONES", "THE CITY KEEPS MARKING THEM", "ART, NOT AN INVESTMENT"]) + " ★ "
STOPS = [("street", "Street"), ("trailer", "The trailer"), ("paper", "The paper"), ("deli", "The deli"), ("platform", "The platform"), ("ledger", "The ledger"), ("wall", "Post no bills"),
         ("map", "The line"), ("cast", "Broadway"), ("last", "Last call"), ("monte", "No monte"), ("signs", "The signs")]
SIGNS = [("red", "NO SEALED CARDS", "EVERY MARK OPENS ON MINT"),
         ("green", f"{REL['count']} MARKS", f"150 UNCOUNTED · {len(C)} CLOSERS"),
         ("green", "ONES OF ONE", "ONE OWNER EACH · ANYTIME"),
         ("red", "NO NEW YORKER", "SOLD TWICE · EVER"),
         ("green", "SUPERRARE", "ONLY · DATES ANNOUNCED FIRST"),
         ("green", "0.069 ETH", "EVERY MARK · CLOSERS 0.269"),
         ("green", "ART", "NOT AN INVESTMENT")]
signs = "".join(f'<div class="sg {c}" data-rv><b>{esc(a)}</b><small>{esc(b)}</small>{"<i class=ar></i>" if i % 2 else ""}</div>' for i, (c, a, b) in enumerate(SIGNS))

FILM = "assets/film/the-marks"  # THE MARKS trailer as HLS + teaser + poster, encode_film.sh marks (gitignored)

body = f"""
<div class="doors" id="doors" aria-hidden="true"><img class="dl" src="{v('assets/marks/door-l.jpg')}" alt=""><img class="dr" src="{v('assets/marks/door-r.jpg')}" alt=""><p>Stand clear of the closing doors, please</p></div>
<div class="grain" aria-hidden="true"></div>
<div class="cur" id="cur" aria-hidden="true"><img src="assets/ui/flower.png" alt=""><span></span></div>
<nav class="line" id="line" aria-label="Stops on this page">{''.join(f'<a href="#{i}" data-s="{i}"><i></i><span>{esc(t)}</span></a>' for i, t in STOPS)}</nav>

<main class="mk-page">
<section class="s-hero" id="street">
  <picture><source media="(max-width:760px)" srcset="{v('assets/marks/newsstand-s.jpg')}"><img class="hero-bg" src="{v('assets/marks/newsstand.jpg')}" alt="A New York newsstand at night, every paper on the rack reads LEFT OFF THE COUNT, eye flowers dripping down the kiosk"></picture>
  <div class="zipper" aria-label="News: {esc(ZIP)}"><div class="zt"><span>{esc(ZIP)}</span><span aria-hidden="true">{esc(ZIP)}</span></div></div>
  <div class="hero-in">
    <p class="eyebrow" data-rv>Release one of NEW YORKERS by MLow</p>
    <h1 class="mega"><span class="ln"><span>THE</span></span><span class="ln"><span>MARKS</span></span></h1>
    <p class="hand" data-rv>150 of the uncounted <svg viewBox="0 0 120 40" aria-hidden="true"><path d="M2 30 C40 4 80 4 112 24 M100 14 L113 25 L98 32"/></svg></p>
    <div class="htally" aria-label="{REL['count']} tally marks, one for every Mark">{tally_svg(REL['count'], 'tl h')}</div>
    <p class="lede" data-rv>Made, numbered, then left off the count. They mint in a shuffled order, open the moment they mint, and the city keeps marking them after that.</p>
    <div class="cta" data-rv>{'<a class="btn" href="#mint">Mint a Mark · 0.069 ETH</a><a class="btn ghost" href="#deli">Take a number</a>' if CONTRACT else '<a class="btn" href="#deli">Take a number</a><a class="btn ghost" href="#platform">Ride the line</a>'}<a class="btn pink" href="night">Walk the night</a><a class="btn ghost" href="printlab#marks">Every Mark as a print</a></div>
  </div>
  <a class="cue" href="#paper"><img src="assets/ui/token.png" alt="">Scroll</a>
</section>

{MINT_HTML}
<section class="s-trailer" id="trailer">
  <div class="wrap">
    <p class="kick" data-rv>Now showing</p>
    <h2 class="big" data-rv>The trailer</h2>
    <div class="screen" data-rv>
      <div class="bulbs" aria-hidden="true"></div>
      <div class="scr"><video id="tr" muted loop playsinline preload="none" poster="{FILM}/poster.jpg" data-teaser="{FILM}/teaser.mp4" aria-label="THE MARKS, the trailer, a film by MLow"></video>
        <button class="tr-play" id="trp" type="button" data-cur="Play" aria-label="Play the trailer with sound"><i></i><span>WATCH WITH SOUND <b>0:56</b></span></button></div>
    </div>
    <p class="sub tr-sub" data-rv>6,666 New Yorkers were made. 5,555 never made the count. 150 are coming back on SuperRare. Every shot is a Mark or an era closer, the city they live in moving for the first time.</p>
  </div>
</section>

<section class="s-walk" id="walk" style="padding:72px 16px;text-align:center">
  <div class="wrap" style="max-width:1100px;margin:0 auto">
    <p class="kick" data-rv>Now open</p>
    <h2 class="big" data-rv>Walk the night</h2>
    <a href="night" data-rv style="display:block;margin:22px auto 18px;border-radius:16px;overflow:hidden;border:1px solid rgba(245,197,66,.45);box-shadow:0 0 60px rgba(255,79,163,.18)"><img src="assets/night/poster.jpg" alt="An alley off Canal Street at 2 a.m., EYE FLOWER NOODLES in neon, a three card monte box that says NOBODY PICKS" loading="lazy" width="1200" height="630" style="display:block;width:100%;height:auto"></a>
    <p class="sub" data-rv>THE MARKS as a place you can walk through. Seven rooms of one New York night: the avenue at 3 a.m., the Uncounted Deli, Uncounted St station, the Department of the Uncounted, an alley off Canal, the Uncounted Theatre and the roof. Every Mark on the walls, every one moving when you face it. Take a number, ride the turnstile, lose at three card monte, break the seal on the roof.</p>
    <div class="cta" data-rv style="justify-content:center"><a class="btn" href="night">Walk in</a></div>
  </div>
</section>

<section class="s-paper" id="paper">
  <article class="paper" data-rv>
    <header class="mast"><span>LATE CITY FINAL</span><h2>The Daily Mark</h2><span>NEW YORK · ONE TALLY</span></header>
    <h2 class="hed">5,555 left off the count. 150 get the mark.</h2>
    <p class="dek">Seen, made, numbered, and then not counted. Inside the release that carries the tally instead of the number.</p>
    <div class="cols">
      <figure><img src="{v('assets/marks/hero-s.jpg')}" alt="A census taker's ledger, chalk tally marks down the last column" loading="lazy"><figcaption>THE LEDGER. Four strokes and a slash, the way a census taker counts. Made for THE MARKS.</figcaption></figure>
      <div class="copy">
        <p class="drop">When THE CENSUS RELEASE was cut from 6,666 to 1,111, five thousand five hundred and fifty five New Yorkers were left off the count. They had been seen. They had been made. They had been given a number. Then they were not counted.</p>
        <p>THE MARKS are 150 of them, chosen across every era from II to XIX, all thirteen families and all five boroughs, with a floor under the Bronx and Staten Island.</p>
        <blockquote>A census taker counts in tally marks. Four strokes and a slash.</blockquote>
        <p>That is the whole idea. These New Yorkers carry the mark instead of the number, and after the mint the city keeps marking them: every hand a Mark passes through adds a stroke.</p>
        <p>Eleven of them were THE ONES once. Counted first, sent back to the pool when KEYSTONE took that release's place, and left off again. They are the cast. Nine era closers, the last New Yorker made in their era, close the release at last call.</p>
        <p class="by">By the census desk · Art, not an investment</p>
      </div>
    </div>
  </article>
</section>

<section class="s-car" id="car" aria-label="Car cards">
  <div class="car"><img src="{v('assets/marks/car.jpg')}" alt="Inside a New York subway car, the car card frames above the windows" loading="lazy">
    <div class="cards"><span>SEEN.</span><span>MADE.</span><span>NUMBERED.</span><span class="not">NOT COUNTED.</span></div>
    <i class="win w1"></i><i class="win w2"></i>
  </div>
  <p class="next"><b>NEXT STOP</b> THE DELI · TAKE A NUMBER</p>
</section>

<section class="s-deli" id="deli">
  <div class="wrap head"><p class="kick">Layer one · The ticket</p><h2 class="big">Take a number.</h2>
    <p class="sub">Every Mark opens the moment it mints. The order was shuffled once before the drop and published, so your ticket number decides which New Yorker you get. Pull a ticket, then hold the wax.</p></div>
  <div class="deli">
    <div class="deli-img"><picture><source media="(max-width:760px)" srcset="{v('assets/marks/deli-s.jpg')}"><img class="deli-bg" src="{v('assets/marks/deli.jpg')}" alt="The Uncounted Delicatessen at night, a NOW SERVING sign over the counter, a cat asleep on the case"></picture>
    <div class="led" aria-live="polite"><span id="led">- - -</span></div>
    <button type="button" class="disp" id="take" data-cur="Pull"><img src="{v('assets/marks/dispenser.webp')}" alt="Take a number"><span class="tix" id="tix"><small>THE MARKS</small><b id="tixn">000</b><i>KEEP THIS TICKET</i></span></button></div>
    <div class="stage" id="stage">
      <div class="sc" id="sc">
        <div class="face front"><img src="{v('assets/marks/card.webp')}" alt="A sealed census card: NEW YORKERS, THE MARKS, one tally stroke, a red wax seal"><button type="button" class="wax" id="wax" aria-label="Hold to break the seal" data-cur="Hold"><img class="w0" src="{v('assets/marks/seal.webp')}" alt=""><img class="w1" src="{v('assets/marks/seal-broken.webp')}" alt=""><svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/></svg></button></div>
        <div class="face back"><img id="rv-img" alt=""><video id="rv-vid" muted loop playsinline></video><div class="rv"><i id="rv-pl"></i><strong id="rv-t"></strong><small id="rv-p"></small><a id="rv-a" class="btn ghost">Open the record</a></div></div>
      </div>
    </div>
    <p class="hint" id="hint">Pull a ticket</p>
  </div>
  <p class="wrap fine">A preview. It pulls a random Mark; on SuperRare the published shuffle order decides, not this counter. <button type="button" class="link" id="again" hidden>Take another number</button></p>
</section>

<section class="s-plat" id="platform">
  <div class="plat-pin">
    <div class="plat-head"><p class="kick">The uncounted</p><h2 class="big">Ride the line.</h2><p class="now" id="now">NOW ARRIVING · <b>THE BRONX</b></p></div>
    <div class="plat-view"><div class="track" id="track">{''.join(track)}</div></div>
    <div class="edge"><img class="pigeon" src="assets/ui/pigeon.png" alt=""></div>
  </div>
</section>

<section class="s-ledger" id="ledger">
  <img class="cat" src="{v('assets/marks/cat.webp')}" alt="The bodega cat, sitting on the ledger">
  <div class="wrap">
    <p class="kick dark">The ledger</p><h2 class="big dark">All 150, in the census taker's hand.</h2>
    <p class="sub dark">The whole list is public before the seal so the shuffle can be checked later. Which one you get is not. Hover a name to see the piece.</p>
    <div class="tabs" id="tabs"><button type="button" class="tabb on" data-f="all">All <i>150</i></button>{tabs}<button type="button" class="tabb" data-f="mv">Moving <i>{sum(1 for x in U if x['lp'] or x['gl'])}</i></button><button type="button" class="tabb" data-f="ones">Once THE ONES <i>{len(ELEVEN)}</i></button></div>
    <div class="book less" id="book"><div class="lh"><span>MARK</span><span>NAME</span><span>WHERE</span><span>LINE</span><span>ERA</span><span>COUNT</span></div>{''.join(row(x) for x in U)}</div>
    <div class="more-w"><button type="button" class="btn ghost" id="more">Turn the page: all 150</button></div>
  </div>
  <div class="peek" id="peek" aria-hidden="true"><img alt=""><video muted loop playsinline></video></div>
</section>

<section class="s-wall" id="wall">
  <div class="wrap head"><p class="kick">What makes a Mark different</p><h2 class="big">Post no bills.</h2>
    <p class="sub">KEYSTONE grows by the artist's hand. THE CENSUS RELEASE changes on Fridays. A Mark changes by what happens to it. These are being built now, what ships is announced before the mint, and none of it is on chain yet.</p></div>
  <div class="board">
    {''.join(f'<img class="stk s{i}" src="assets/stickers/{esc(f)}" alt="" loading="lazy">' for i, f in enumerate(stickers[:6]))}
    {''.join(f'<img class="stk lg l{i}" src="{esc(f)}" alt="" loading="lazy">' for i, f in enumerate(logos))}
    <article class="bill b-seal" data-rv><p class="no">No. 1</p><img src="{v('assets/marks/seal.webp')}" alt="" loading="lazy"><h3>One seed.<br>No picks.</h3><p>A shuffle seed is committed in public before the mint and mixed with a named future Ethereum block. Nobody, the artist included, decides who gets which.</p></article>
    <article class="bill b-count" id="count" data-rv><p class="no">No. 2 · Have you seen this New Yorker?</p>
      <div class="cd-ph"><img id="cd-img" alt="" loading="lazy"><svg class="chalkx" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M14 18 L20 86"/><path d="M34 14 L36 88"/><path d="M54 16 L53 84"/><path d="M74 12 L76 86"/><path d="M4 74 L96 24"/></svg><div class="cd-t" id="cd-t"></div></div>
      <h3>Every hand adds a stroke.</h3><p>Mint, sale or gift, each one chalks a stroke into the corner. The fifth opens THE MARKED. Tear a tab.</p>
      <div class="tear" id="tear"><button type="button" data-ev="Sold">SELL</button><button type="button" data-ev="Gifted">GIFT</button><button type="button" data-ev="Sold">SELL</button><button type="button" data-ev="Sold">SELL</button></div>
      <ol class="cd-log" id="cd-log"></ol><button type="button" class="link" id="cd-r">Paste a new flyer</button></article>
    <article class="bill b-clock" id="clock" data-rv><p class="no">No. 3 · The city's clock</p>
      <div class="ck-ph" id="ck-ph" data-s="day"><img id="ck-img" alt="" loading="lazy"><i class="rain"></i></div>
      <h3>Day, night, rain.</h3><p>The token reads New York time and weather and shows the state the city is in right now.</p>
      <div class="ck-b"><button type="button" data-s="day">DAY</button><button type="button" data-s="night">NIGHT</button><button type="button" data-s="rain">RAIN</button></div></article>
    <a class="bill b-line" href="#map" data-rv><p class="no">No. 4 · Service change</p><h3>Hold a borough, draw a line.</h3><p>Marks held together in one borough draw a line between them. Complete it and every Mark on it opens a state.</p><span class="minimap">{''.join(f'<i style="--lc:{LINEC[b]}">{LETTER[b]}</i>' for b in RIDE_ORDER)}</span></a>
    <div class="post-clock" aria-label="New York time"><img src="{v('assets/marks/clock.webp')}" alt="A New York street clock" loading="lazy"><svg class="hands" viewBox="0 0 100 100" aria-hidden="true"><line id="hh" x1="50" y1="50" x2="50" y2="28"/><line id="mh" x1="50" y1="50" x2="50" y2="16"/><circle cx="50" cy="50" r="3"/></svg><p id="ck-now">New York</p></div>
    <img class="hyd" src="assets/ui/hydrant.png" alt="" loading="lazy">
  </div>
</section>

<section class="s-map" id="map">
  <div class="wrap">
    <header class="mapbar"><span class="bul" style="--lc:var(--lN)">M</span><b>THE MARKS · SUBWAY MAP</b><small>Every Mark at its stop</small></header>
    <h2 class="big ink">Where the uncounted live.</h2>
    <p class="sub ink">Six lines, one for each borough and one for the city at large. Every station is a Mark; coral stations are the era closers, ringed stations are the eleven. Pick a line.</p>
    <div class="lines" id="lines">{''.join(f'<button type="button" data-b="{esc(b)}" style="--lc:{LINEC[b]}"><span class="bul">{LETTER[b]}</span>{esc(b)}</button>' for b in RIDE_ORDER if bcount.get(b))}</div>
    <div class="map"><img class="tower" src="assets/ui/tower.png" alt="" loading="lazy"><svg viewBox="0 0 {W} {H}" id="mapsvg" role="img" aria-label="Map of New York City with every Mark at its place">{''.join(paths)}<g id="routes"></g><g id="dots"></g></svg><div class="tip" id="tip" hidden></div></div>
  </div>
</section>

<section class="s-cast" id="cast">
  <div class="marquee"><picture><source media="(max-width:760px)" srcset="{v('assets/marks/marquee-s.jpg')}"><img src="{v('assets/marks/marquee.jpg')}" alt="A Broadway marquee at night with THE MARKS in neon" loading="lazy"></picture>
    <div class="board" aria-label="Now playing: The Eleven"><span class="r1">NOW PLAYING</span><span class="r2">THE ELEVEN</span><span class="r3">COUNTED FIRST · LEFT OFF TWICE</span></div></div>
  <div class="wrap"><p class="kick">The main cast</p><h2 class="big">The eleven who were counted first.</h2><p class="sub">Each was one of THE ONES. Each has a character sheet and a written bible, and their story runs through the whole release. Flip a playbill.</p></div>
  <div class="bills" id="bills">{''.join(playbill(x) for x in ELEVEN)}</div>
</section>

<section class="s-last" id="last">
  <div class="last-pin">
    <h2 class="neon" aria-label="Last call"><span>LAST</span> <span>CALL</span></h2>
    <div class="shop"><div class="window">{''.join(closer(x) for x in C)}</div><img class="gate" id="gate" src="{v('assets/marks/gate.jpg')}" alt="A steel roll gate covered in chalk tally marks, rolling up"></div>
  </div>
  <div class="wrap"><p class="sub">The era closers: the last New Yorker made in an era. Each one is a separate one of one at 0.269 ETH on SuperRare, revealed the moment it mints, no reserve, no bidding, one at a time at last call. {len(C)} are in THE MARKS. The other nine ({', '.join(map(str, in_keystone))}) were already in <a href="keystone">KEYSTONE</a> and stay there, because no New Yorker is sold twice.</p></div>
</section>

<section class="s-monte" id="monte">
  <div class="wrap">
    <p class="kick">The fair shuffle</p><h2 class="big">This is not three card monte.</h2>
    <div class="monte">
      <div class="table"><img src="{v('assets/marks/box.webp')}" alt="A cardboard box on the sidewalk" loading="lazy"><div class="cards3"><i></i><i></i><i></i></div><p class="sign">Nobody picks.<br>Not even MLow.</p></div>
      <ol class="steps">
        <li><b>The list</b>The 150 were fixed first. Their hash is on the receipt.</li>
        <li><b>The shuffle</b>Before the drop, public code shuffled the 150 once with a seed and the hash of mainnet block {SHUFFLE['block']:,}. Both are on the receipt. Anyone can run it and get the same order.</li>
        <li><b>The mint</b>Ticket 1 is the first mint, ticket 150 the last. Every Mark opens the moment it mints. Nothing is sealed, nobody waits.</li>
      </ol>
      <div class="receipt"><p class="rh">THE UNCOUNTED DELI<br>NEW YORK, NY</p><p>--------------------------------</p><p>LIST OF 150 ........ FIXED</p><p>ALGORITHM ......... SHA-256</p><code>{LIST_HASH}</code><p>SEED ............... PUBLISHED</p><code>{SHUFFLE['seed']}</code><p>BLOCK ......... {SHUFFLE['block']:,}</p><code>{SHUFFLE['blockHash']}</code><p>SHUFFLED BEFORE THE MINT</p><p>--------------------------------</p><p class="rh">THANK YOU<br>WE ARE HAPPY TO COUNT YOU</p><a href="api/marks.json">api/marks.json</a></div>
    </div>
  </div>
</section>

<section class="s-signs" id="signs">
  <div class="wrap signs-w">
    <div class="pole">{signs}</div>
    <div class="rel-copy">
      <p class="kick">The release</p><h2 class="big">Read the signs.</h2>
      <table class="rec">
        <tr><td>Size</td><td>{REL['count']}: 150 uncounted, {len(C)} era closers</td></tr>
        <tr><td>Format</td><td>{esc(REL['format'])}</td></tr>
        <tr><td>Platform</td><td>{esc(REL['platform'])}</td></tr>
        {f'<tr><td>Contract</td><td><a href="https://etherscan.io/address/{CONTRACT}">{CONTRACT}</a></td></tr>' if CONTRACT else ''}
        <tr><td>When</td><td>{esc(REL['when'])}</td></tr>
        <tr><td>Price</td><td>{esc(REL['price'])}</td></tr>
        <tr><td>Changed</td><td>{esc(REL['detail'])}</td></tr>
      </table>
      <div class="taxis"><a class="taxi" href="census"><span>ON DUTY</span><b>THE WHOLE CENSUS</b></a><a class="taxi" href="keystone"><span>ON DUTY</span><b>KEYSTONE</b></a></div>
    </div>
  </div>
</section>
</main>
"""

ALLD = [{k: x[k] for k in ("n", "m", "t", "id", "b", "nb", "th", "x", "y", "ones", "era", "lp") if k in x and x[k] is not None} for x in ITEMS]
DATA = json.dumps({"u": [d for d in ALLD if d.get("m")], "c": [d for d in ALLD if not d.get("m")], "lc": LINEC, "mint": MINT}, ensure_ascii=False, separators=(",", ":"))
CSS = r"""
body{background:#06090f}
.mk-page{overflow-x:clip}
:root{--paper:#EEE6D3;--news:#E9E1CC;--ink2:#141A22;--chalk:#ECE8DD;--anton:"Anton","Bungee",Impact,sans-serif;--doto:"Doto","IBM Plex Mono",monospace;--neon:"Monoton","Bungee",sans-serif;--hand:"Rock Salt",cursive;--hel:"Helvetica Neue",Helvetica,Arial,sans-serif}
.mk-page section{position:relative}
.wrap{max-width:1240px;margin:0 auto;padding:0 24px}
.kick{font:600 12px/1 var(--hel);letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin:0 0 14px;display:flex;align-items:center;gap:12px}
.kick:before{content:"";width:34px;height:2px;background:currentColor}
.kick.dark{color:var(--brick)}
.big{font:400 clamp(44px,7.4vw,112px)/.9 var(--anton);text-transform:uppercase;letter-spacing:-.005em;margin:0 0 18px;color:var(--cloud)}
.big.dark,.big.ink{color:var(--ink2)}
.sub{max-width:640px;font-size:clamp(16px,1.35vw,19px);line-height:1.55;color:var(--slate)}
.sub.dark,.sub.ink{color:#3b4652}
.sub a{color:var(--gold)}
.link{background:none;border:0;color:var(--gold);font:600 13px var(--hel);letter-spacing:.06em;text-decoration:underline;text-underline-offset:4px;cursor:pointer;padding:0}
/* chalk tally */
.tl{width:30px;height:30px;overflow:visible}
.tl path{stroke:var(--chalk);stroke-width:3.4;stroke-linecap:round;fill:none;filter:url(#chalkf);stroke-dasharray:50;stroke-dashoffset:50;animation:draw .35s ease-out forwards}
.tl .sl{stroke:var(--coral)}
.tl.s{width:18px;height:18px}.tl.s path{stroke:#2a2f36;animation:none;stroke-dashoffset:0}
@keyframes draw{to{stroke-dashoffset:0}}
/* doors */
.doors{position:fixed;inset:0;z-index:300;display:flex;pointer-events:none}
.doors img{width:50%;height:100%;object-fit:cover;transition:transform 1.25s cubic-bezier(.7,0,.2,1)}
.doors .dl{object-position:right center}.doors .dr{object-position:left center}
.doors p{position:absolute;left:50%;bottom:9vh;transform:translateX(-50%);font:700 13px var(--hel);letter-spacing:.3em;text-transform:uppercase;color:#111;background:#F2C230;padding:10px 16px;border-radius:3px;white-space:nowrap;transition:opacity .4s}
.doors.open .dl{transform:translateX(-101%)}.doors.open .dr{transform:translateX(101%)}.doors.open p{opacity:0}
.doors.gone{display:none}
/* grain + cursor + line nav */
.grain{position:fixed;inset:-50%;z-index:200;pointer-events:none;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");animation:grain 1s steps(6) infinite}
@keyframes grain{0%{transform:translate(0,0)}20%{transform:translate(-3%,2%)}40%{transform:translate(2%,-4%)}60%{transform:translate(-4%,-1%)}80%{transform:translate(3%,3%)}}
.cur{position:fixed;left:0;top:0;z-index:250;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;transition:width .3s,height .3s,margin .3s,opacity .3s;opacity:0;display:grid;place-items:center}
.cur img{width:100%;height:100%;transition:transform .5s;filter:drop-shadow(0 4px 10px rgba(0,0,0,.5))}
.cur span{position:absolute;font:700 11px var(--hel);letter-spacing:.18em;text-transform:uppercase;color:var(--ink);background:var(--gold);padding:5px 9px;border-radius:99px;top:100%;margin-top:4px;opacity:0;transition:opacity .2s;white-space:nowrap}
.cur.on{opacity:1}.cur.big{width:84px;height:84px;margin:-42px 0 0 -42px}.cur.big img{transform:rotate(90deg)}.cur.big span{opacity:1}
@media (hover:hover) and (pointer:fine){.mk-page a,.mk-page button{cursor:none}}
.line{position:fixed;right:18px;top:50%;transform:translateY(-50%);z-index:90;display:flex;flex-direction:column;gap:14px;padding:10px 0}
.line:before{content:"";position:absolute;left:50%;top:0;bottom:0;width:4px;margin-left:-2px;background:var(--gold);border-radius:4px;opacity:.55}
.line a{position:relative;display:block;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #111;transition:transform .25s}
.line a span{position:absolute;right:24px;top:50%;transform:translate(6px,-50%);opacity:0;white-space:nowrap;font:700 11px var(--hel);letter-spacing:.14em;text-transform:uppercase;color:#111;background:#fff;padding:5px 9px;border-radius:3px;transition:opacity .2s,transform .2s;pointer-events:none}
.line a:hover span,.line a.on span{opacity:1;transform:translate(0,-50%)}
.line a.on{transform:scale(1.35);background:var(--gold)}
/* reveal */
[data-rv]{opacity:0;transform:translateY(34px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
[data-rv].in{opacity:1;transform:none}
/* 1 hero */
.s-hero{min-height:100svh;display:flex;align-items:flex-end;isolation:isolate;overflow:clip}
.hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:62% 50%;z-index:-2;transform:scale(calc(1.08 + var(--p,0)*.12)) translateY(calc(var(--p,0)*6%))}
.s-hero:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(6,9,15,.92),rgba(6,9,15,.55) 42%,rgba(6,9,15,0) 70%),linear-gradient(0deg,#06090f 0%,transparent 35%)}
.zipper{position:absolute;top:0;left:0;right:0;height:46px;background:#0b0b0b;border-bottom:3px solid #222;overflow:hidden;display:flex;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.6)}
.zipper:before,.zipper:after{content:"";position:absolute;top:0;bottom:0;width:80px;z-index:1}
.zipper:before{left:0;background:linear-gradient(90deg,#0b0b0b,transparent)}.zipper:after{right:0;background:linear-gradient(-90deg,#0b0b0b,transparent)}
.zt{display:flex;white-space:nowrap;animation:zip 60s linear infinite;font:800 22px/1 var(--doto);letter-spacing:.06em;color:#FFB347;text-shadow:0 0 8px rgba(255,160,60,.9),0 0 18px rgba(255,120,40,.5)}
.zt span{padding-right:40px}
@keyframes zip{to{transform:translateX(-50%)}}
.hero-in{position:relative;max-width:1240px;width:100%;margin:0 auto;padding:110px 24px 8vh}
.eyebrow{font:600 12px var(--hel);letter-spacing:.32em;text-transform:uppercase;color:var(--gold)}
.mega{font:400 clamp(100px,15.5vw,250px)/.8 var(--anton);margin:.08em 0 0;letter-spacing:-.015em;color:var(--cloud);text-transform:uppercase}
.mega .ln{display:block;overflow:hidden;padding-bottom:.04em}
.mega .ln span{display:block;transform:translateY(105%);transition:transform 1.2s cubic-bezier(.2,.8,.1,1)}
.mega .ln:nth-child(2) span{transition-delay:.12s;color:var(--cloud);text-shadow:0 10px 50px rgba(0,0,0,.65)}
.ready .mega .ln span{transform:none}
.mega .ln:first-child{font-size:.42em;line-height:.9;color:var(--gold)}
.hand{font:400 clamp(18px,2vw,26px) var(--hand);color:var(--chalk);margin:10px 0 0;display:flex;align-items:center;gap:10px;transform:rotate(-3deg)}
.hand svg{width:110px;height:36px}.hand path{fill:none;stroke:var(--chalk);stroke-width:2.5;stroke-linecap:round}
.htally{display:flex;flex-wrap:wrap;gap:2px 5px;max-width:720px;margin:12px 0 12px}
.htally .tl{width:19px;height:21px}
.lede{max-width:520px;font-size:clamp(17px,1.5vw,21px);line-height:1.5;color:var(--cloud)}
.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
.cue{position:absolute;right:56px;bottom:40px;display:flex;flex-direction:column;align-items:center;gap:8px;font:700 10px var(--hel);letter-spacing:.3em;color:var(--slate);text-decoration:none;text-transform:uppercase}
.cue img{width:54px;animation:spin 6s linear infinite}
@keyframes spin{to{transform:rotateY(360deg)}}
/* 1b the trailer: a movie screen under a marquee */
.s-trailer{padding:12vh 0 14vh;background:linear-gradient(#06090f,rgba(6,9,15,.88) 22%,rgba(6,9,15,.9) 78%,#06090f),url(@@marquee@@) center 30%/cover}
.s-trailer .big{margin-bottom:26px}
.screen{position:relative;padding:18px;background:#120b07;border-radius:6px;box-shadow:0 0 0 2px #3a2614,0 50px 120px -30px rgba(0,0,0,.95),0 0 80px rgba(255,170,60,.12)}
.bulbs{position:absolute;inset:4px;border-radius:4px;pointer-events:none;background:radial-gradient(circle,#FFD58A 0 2.5px,transparent 3.5px) 0 0/22px 22px;-webkit-mask:linear-gradient(#000 0 0) top/100% 10px no-repeat,linear-gradient(#000 0 0) bottom/100% 10px no-repeat,linear-gradient(#000 0 0) left/10px 100% no-repeat,linear-gradient(#000 0 0) right/10px 100% no-repeat;mask:linear-gradient(#000 0 0) top/100% 10px no-repeat,linear-gradient(#000 0 0) bottom/100% 10px no-repeat,linear-gradient(#000 0 0) left/10px 100% no-repeat,linear-gradient(#000 0 0) right/10px 100% no-repeat;filter:drop-shadow(0 0 4px #FFB347);animation:bulb 1.6s steps(2) infinite}
@keyframes bulb{50%{opacity:.55}}
.scr{position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;border-radius:2px}
.scr video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}
.tr-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:14px;background:var(--gold);color:#111;border:0;border-radius:99px;padding:16px 26px 16px 18px;font:800 13px/1 var(--hel);letter-spacing:.2em;box-shadow:0 18px 50px rgba(0,0,0,.6);transition:transform .25s}
.tr-play:hover{transform:translate(-50%,-50%) scale(1.06)}
.tr-play i{width:38px;height:38px;border-radius:50%;background:#111;position:relative;flex:none}
.tr-play i:after{content:"";position:absolute;left:15px;top:11px;border-left:13px solid var(--gold);border-top:8px solid transparent;border-bottom:8px solid transparent}
.tr-play b{font-weight:800;opacity:.6;margin-left:4px}
.tr-play[hidden]{display:none}
.tr-sub{margin-top:26px}
@media (max-width:760px){.screen{padding:10px}.bulbs{display:none}.tr-play{padding:12px 18px 12px 12px;font-size:11px;letter-spacing:.14em}.tr-play i{width:30px;height:30px}.tr-play i:after{left:11px;top:8px;border-left-width:11px;border-top-width:7px;border-bottom-width:7px}}
/* 2 the paper */
.s-paper{padding:12vh 24px 14vh;background:radial-gradient(100% 60% at 50% 0%,#101826,#06090f)}
.paper{max-width:1180px;margin:0 auto;background:var(--news);color:#16191d;padding:clamp(22px,4vw,56px);box-shadow:0 60px 120px -40px rgba(0,0,0,.9);transform:rotate(-1deg);position:relative}
.paper:before{content:"";position:absolute;inset:0;background:url(@@wheat@@);background-size:420px;mix-blend-mode:multiply;opacity:.45;pointer-events:none}
.mast{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:20px;border-bottom:4px double #16191d;padding-bottom:12px}
.mast span{font:700 11px var(--hel);letter-spacing:.2em}.mast span:last-child{text-align:right}
.mast h2{font:400 clamp(40px,6vw,86px)/1 "UnifrakturMaguntia",Fraunces,serif;margin:0;text-align:center}
.hed{font:400 clamp(46px,7.6vw,116px)/.88 var(--anton);text-transform:uppercase;margin:22px 0 14px;letter-spacing:-.01em}
.dek{font:italic 400 clamp(18px,1.7vw,24px)/1.35 Fraunces,serif;max-width:820px;margin:0 0 26px;border-bottom:1px solid #16191d;padding-bottom:20px}
.cols{display:grid;grid-template-columns:1.1fr 1fr;gap:36px}
.cols figure{margin:0}.cols figure img{width:100%;aspect-ratio:2/1.3;object-fit:cover;display:block;filter:contrast(1.05) saturate(.9)}
.cols figcaption{font:600 11px/1.5 var(--hel);letter-spacing:.06em;margin-top:8px;color:#3a3f46}
.copy{column-count:2;column-gap:26px;font:400 16px/1.55 Fraunces,serif}
.copy p{margin:0 0 12px}
.copy .drop:first-letter{float:left;font:400 78px/.8 var(--anton);margin:6px 8px 0 0}
.copy blockquote{margin:14px 0;padding:12px 0;border-top:3px solid #16191d;border-bottom:1px solid #16191d;font:400 26px/1.05 var(--anton);text-transform:uppercase;break-inside:avoid}
.copy .by{font:700 11px var(--hel);letter-spacing:.14em;text-transform:uppercase;color:var(--brick)}
/* 3 car cards */
.s-car{padding:0 0 10vh;background:#06090f}
.car{position:relative;max-width:1600px;margin:0 auto}
.car>img{width:100%;height:auto;display:block;aspect-ratio:2/1;object-fit:cover}
.cards{position:absolute;left:7.6%;right:7.8%;top:6.1%;height:13%;display:grid;grid-template-columns:repeat(4,1fr);gap:1.2%}
.cards span{display:grid;place-items:center;background:linear-gradient(180deg,#F4EEDF,#E4DBC6);font:400 clamp(16px,3vw,48px)/1 var(--anton);color:#16191d;letter-spacing:.01em;box-shadow:inset 0 0 0 2px rgba(0,0,0,.15);opacity:0;transform:translateY(-12px);transition:opacity .6s,transform .6s}
.cards span.not{background:var(--coral);color:#fff}
.car.in .cards span{opacity:1;transform:none}
.car.in .cards span:nth-child(2){transition-delay:.25s}.car.in .cards span:nth-child(3){transition-delay:.5s}.car.in .cards span:nth-child(4){transition-delay:.9s}
.win{position:absolute;top:22%;height:28.5%;overflow:hidden;border-radius:2%;mix-blend-mode:screen;pointer-events:none}
.w1{left:12.8%;width:33.4%}.w2{left:53.8%;width:33.4%}
.win:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 140px,rgba(255,190,90,.55) 140px 190px,transparent 190px 420px);filter:blur(6px);animation:tunnel .9s linear infinite}
@keyframes tunnel{from{transform:translateX(0)}to{transform:translateX(-420px)}}
.next{text-align:center;font:700 clamp(12px,1.2vw,15px) var(--doto);letter-spacing:.2em;color:#FF5A3C;text-shadow:0 0 10px rgba(255,80,50,.7);background:#0b0b0b;max-width:720px;margin:-2vh auto 0;padding:14px 18px;border-radius:6px;border:2px solid #222}
.next b{color:#FFB347;margin-right:10px}
/* 4 deli */
.s-deli{padding:12vh 0 8vh;background:linear-gradient(#06090f,#0d0b09)}
.head{margin-bottom:40px}
.deli{position:relative;max-width:1600px;margin:0 auto}
.deli-img{position:relative;aspect-ratio:2720/1536}
.deli-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.deli:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(13,11,9,.6),transparent 30%);pointer-events:none}
.led{position:absolute;left:45.6%;top:10.6%;width:15.3%;height:6.8%;display:grid;place-items:center;background:#120404;border-radius:3px}
.led span{font:900 clamp(14px,2.4vw,40px)/1 var(--doto);color:#FF3B2F;letter-spacing:.08em;text-shadow:0 0 6px #ff2a1a,0 0 18px rgba(255,40,20,.7)}
.disp{position:absolute;right:2%;top:13%;width:14%;background:none;border:0;padding:0;z-index:3;transition:transform .2s}
.disp img{width:100%;display:block;filter:drop-shadow(0 18px 24px rgba(0,0,0,.6))}
.disp:hover{transform:rotate(-4deg) scale(1.03)}
.tix{position:absolute;left:12%;top:86%;width:44%;padding:10px 6px;background:#F7F3EA;color:#1a1a1a;text-align:center;border-radius:2px;box-shadow:0 8px 18px rgba(0,0,0,.45);transform-origin:top center;transform:scaleY(0) rotate(0);opacity:0;transition:transform .7s cubic-bezier(.3,1.4,.4,1),opacity .2s;z-index:-1;-webkit-mask:radial-gradient(circle 5px at 0 50%,transparent 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 5px at 100% 50%,transparent 98%,#000) right/51% 100% no-repeat;mask:radial-gradient(circle 5px at 0 50%,transparent 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 5px at 100% 50%,transparent 98%,#000) right/51% 100% no-repeat}
.tix small{display:block;font:700 9px var(--hel);letter-spacing:.2em;color:var(--brick)}
.tix b{display:block;font:400 clamp(22px,2.6vw,40px)/1 var(--anton)}
.tix i{display:block;font:600 8px var(--hel);letter-spacing:.14em;font-style:normal}
.took .tix{transform:translateY(40%) rotate(-8deg) scaleY(1);opacity:1}
.stage{position:absolute;right:13.5%;top:30%;width:19%;perspective:1600px;z-index:2;opacity:0;transform:translateY(40px) scale(.9);transition:opacity .8s,transform .8s cubic-bezier(.2,.8,.2,1);pointer-events:none}
.deli.ready .stage{opacity:1;transform:none;pointer-events:auto}
.sc{position:relative;aspect-ratio:2/3;transform-style:preserve-3d;transition:transform 1.1s cubic-bezier(.2,.8,.2,1)}
.sc.open{transform:rotateY(180deg) scale(1.15)}
.face{position:absolute;inset:0;backface-visibility:hidden;border-radius:12px;overflow:hidden;box-shadow:0 40px 70px -24px rgba(0,0,0,.95),0 0 0 1px rgba(236,201,129,.25)}
.face>img{width:100%;height:100%;object-fit:cover;display:block}
.back{transform:rotateY(180deg);background:var(--card)}
#rv-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s}#rv-vid.on{opacity:1}
.rv{position:absolute;left:0;right:0;bottom:0;padding:50px 14px 14px;background:linear-gradient(0deg,rgba(8,13,22,.96),rgba(8,13,22,.6) 65%,transparent);display:flex;flex-direction:column;gap:4px}
.rv i{font:600 10px 'IBM Plex Mono',monospace;color:var(--gold);font-style:normal;letter-spacing:.1em}
.rv strong{font:400 clamp(16px,1.6vw,24px)/1 var(--anton);text-transform:uppercase}
.rv small{color:var(--slate);font-size:12px}
.rv .btn{align-self:flex-start;margin-top:8px;transform:scale(.8);transform-origin:left}
.wax{position:absolute;left:50%;top:78.5%;width:44%;aspect-ratio:1;transform:translate(-50%,-50%);border:0;background:none;padding:0;touch-action:none}
.wax img{position:absolute;inset:0;width:100%;height:100%;transition:transform .5s,opacity .3s;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}
.wax .w1{opacity:0}
.wax.hold .w0{animation:shake .12s infinite}
@keyframes shake{0%,100%{transform:rotate(-2deg) scale(1.03)}50%{transform:rotate(2deg) scale(1.06)}}
.wax.broke .w0{opacity:0}.wax.broke .w1{opacity:0;transform:scale(1.3) rotate(10deg);transition:transform .9s,opacity .9s .3s}
.ring{position:absolute;inset:-10%;width:120%;height:120%;transform:rotate(-90deg);pointer-events:none}
.ring circle{fill:none;stroke:var(--gold);stroke-width:4;stroke-dasharray:289;stroke-dashoffset:289}
.wax.hold .ring circle{transition:stroke-dashoffset .8s linear;stroke-dashoffset:0}
.hint{position:absolute;right:3%;top:52%;font:400 clamp(14px,1.4vw,20px) var(--hand);color:var(--chalk);transform:rotate(-6deg);text-shadow:0 2px 8px #000;z-index:3;pointer-events:none}
.fine{margin-top:18px;color:var(--slate);font-size:14px}
/* 5 platform */
.s-plat{background:#0b0d10}
.plat-pin{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;flex-direction:column;background:url(@@tile@@) 0 0/132px auto;box-shadow:inset 0 0 220px 60px rgba(0,0,0,.75)}
.plat-pin:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,9,15,.88),rgba(6,9,15,.15) 30%,rgba(6,9,15,.05) 70%,rgba(6,9,15,.6));pointer-events:none}
.plat-head{position:relative;padding:96px 24px 0;max-width:1240px;width:100%;margin:0 auto;display:flex;align-items:flex-end;gap:30px;flex-wrap:wrap}
.plat-head .big{margin:0}
.now{margin:0 0 10px auto;font:700 13px var(--doto);letter-spacing:.18em;color:#FF5A3C;text-shadow:0 0 8px rgba(255,80,50,.7);background:#0b0b0b;padding:10px 14px;border-radius:4px;border:2px solid #222}
.now b{color:#FFB347}
.plat-view{position:relative;flex:1;display:flex;align-items:center;min-height:0}
.track{position:relative;display:flex;align-items:center;gap:56px;padding:0 10vw;will-change:transform}
.track:before{content:"";position:absolute;left:0;right:0;top:-34px;height:30px;background:url(@@mosaic@@) 0 0/auto 100% repeat-x;opacity:.95}
.stn{flex:none;position:relative}
.tab{width:340px;padding:30px 26px;background:#F3EDDF;color:#111;border:14px solid transparent;border-image:url(@@mosaic@@) 30 round;box-shadow:0 20px 40px -10px rgba(0,0,0,.8);text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}
.tab .bul{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:var(--lc,var(--gold));color:#111;font:700 28px var(--hel)}
.tab b{font:700 30px/1 var(--hel);letter-spacing:.02em}
.tab small{font:700 11px var(--hel);letter-spacing:.2em;color:#555}
.tab em{font:400 15px var(--hand);font-style:normal;color:var(--brick)}
.stn.end .tab{text-decoration:none}
.post{flex:none;width:clamp(230px,24vw,330px);text-decoration:none;color:var(--cloud);display:block;transform:rotate(var(--r,0deg))}
.post:nth-child(3n){--r:.8deg}.post:nth-child(3n+1){--r:-.6deg}
.frame{display:block;position:relative;aspect-ratio:4/5;padding:12px;background:#111;border-radius:4px;box-shadow:0 0 0 3px #2a2a2a,0 30px 50px -16px rgba(0,0,0,.9);overflow:hidden}
.frame img,.frame video{position:absolute;inset:12px;width:calc(100% - 24px);height:calc(100% - 24px);object-fit:cover;transition:opacity .4s,transform .8s}
.frame video{opacity:0}.post.play .frame video{opacity:1}
.post:hover .frame img{transform:scale(1.05)}
.frame:after{content:"";position:absolute;inset:12px;background:linear-gradient(115deg,rgba(255,255,255,.18),transparent 35%);pointer-events:none}
.tag{position:absolute;right:20px;top:20px;border:0;font:700 10px var(--hel);letter-spacing:.16em;background:var(--coral);color:#fff;padding:5px 8px;border-radius:3px;z-index:2}
.cc{display:block;margin-top:14px;padding:10px 12px;background:#F3EDDF;color:#111;border-radius:2px}
.cc i{font:700 10px var(--doto);font-style:normal;letter-spacing:.14em;color:var(--brick)}
.cc strong{display:block;font:400 21px/1 var(--anton);text-transform:uppercase;margin:4px 0 2px}
.cc small{font:600 11px var(--hel);letter-spacing:.06em;color:#555}
.edge{position:relative;height:56px;background:var(--platform);box-shadow:0 -6px 0 #1a1a1a}
.edge:after{content:"";position:absolute;left:0;right:0;top:100%;height:40px;background:#050505}
.pigeon{position:absolute;bottom:42px;left:0;width:64px;animation:walk 26s linear infinite}
@keyframes walk{0%{transform:translateX(-80px)}49%{transform:translateX(calc(100vw + 10px))}50%{transform:translateX(calc(100vw + 10px)) scaleX(-1)}100%{transform:translateX(-80px) scaleX(-1)}}
/* 6 ledger */
.s-ledger{padding:16vh 0 12vh;background:var(--paper);color:var(--ink2);position:relative}
.s-ledger:before{content:"";position:absolute;inset:0;background:url(@@wheat@@);background-size:520px;mix-blend-mode:multiply;opacity:.35;pointer-events:none}
.cat{position:absolute;right:6%;top:-128px;width:150px;z-index:3;filter:drop-shadow(0 10px 14px rgba(0,0,0,.4));cursor:pointer;transition:transform .3s}
.cat:hover{transform:rotate(-4deg)}
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin:26px 0 24px}
.tabb{display:inline-flex;align-items:center;gap:8px;font:700 12px var(--hel);letter-spacing:.06em;color:var(--ink2);background:transparent;border:2px solid var(--ink2);border-radius:99px;padding:7px 14px 7px 8px;transition:background .2s,color .2s}
.tabb .bul,.bo,.lines .bul,.mapbar .bul{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--lc,var(--gold));color:#111;font:700 13px var(--hel)}
.tabb i{font-style:normal;opacity:.6}
.tabb.on,.tabb:hover{background:var(--ink2);color:var(--paper)}
.tabb[data-f=all]{padding-left:14px}
.book{position:relative;background:#F7F1E3 linear-gradient(transparent 0 calc(100% - 1px),#B9CFE0 0) 0 0/100% 40px;border:1px solid #c9bfa8;box-shadow:0 40px 80px -30px rgba(0,0,0,.45);padding:0 0 10px}
.book:before{content:"";position:absolute;left:84px;top:0;bottom:0;width:2px;background:#D98C7E;opacity:.8}
.lh,.lr{display:grid;grid-template-columns:76px 1.6fr 1.2fr 50px 56px 50px;align-items:center;gap:12px;padding:0 18px 0 8px;height:40px}
.lh{background:var(--ink2);color:var(--paper);font:700 11px var(--hel);letter-spacing:.18em;height:44px}
.lr{color:var(--ink2);text-decoration:none;transition:background .2s,padding .3s}
.lr:hover{background:rgba(236,201,129,.35);padding-left:16px}
.lr .no{font:400 22px var(--hand);color:var(--brick);text-align:center}
.lr .nm{font:500 17px Fraunces,serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lr .nm sup{font:700 9px var(--hel);letter-spacing:.1em;color:var(--coral);margin-left:6px}
.lr .pl{font:400 14px var(--hand);color:#4b5560;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}
.lr .er{font:600 12px 'IBM Plex Mono',monospace;color:#6a7480}
.lr[hidden]{display:none}
.book.less .lr:nth-of-type(n+31){display:none}
.more-w{text-align:center;margin-top:30px}
.peek img,.peek video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.peek video{opacity:0;transition:opacity .3s}.peek.mv video{opacity:1}
.peek{position:fixed;left:0;top:0;width:220px;aspect-ratio:4/5;background:#111;overflow:hidden;pointer-events:none;z-index:150;border:8px solid #fff;box-shadow:0 30px 60px -10px rgba(0,0,0,.6);opacity:0;transform:translate(-50%,-50%) rotate(-4deg) scale(.8);transition:opacity .25s,transform .25s}
.peek.on{opacity:1;transform:translate(-50%,-50%) rotate(-4deg) scale(1)}
/* 7 the wall */
.s-wall{padding:14vh 0 0;background:#0b0f12}
.board{position:relative;margin:0 auto;max-width:1700px;min-height:1340px;background:url(@@plywood@@) center/cover;padding:80px 4% 160px;display:grid;grid-template-columns:repeat(4,1fr);gap:40px 3%;align-items:start;box-shadow:inset 0 30px 60px rgba(0,0,0,.6)}
.bill{position:relative;color:#16191d;background:#EDE6D4;padding:22px 20px 24px;box-shadow:0 18px 30px -12px rgba(0,0,0,.8);text-decoration:none;display:block;transform:rotate(var(--r,0));z-index:2}
.bill:after{content:"";position:absolute;inset:0;background:url(@@wheat@@);background-size:300px;mix-blend-mode:multiply;opacity:.7;pointer-events:none}
.bill h3{font:400 clamp(30px,2.6vw,44px)/.92 var(--anton);text-transform:uppercase;margin:12px 0 10px}
.bill p{font:400 15px/1.45 Fraunces,serif;margin:0 0 10px}
.bill .no{font:700 10px var(--hel);letter-spacing:.2em;text-transform:uppercase;color:var(--brick)}
.b-seal{--r:-2.5deg;background:#16191d;color:var(--chalk);margin-top:40px}.b-seal h3{color:var(--gold);font-size:clamp(40px,3.6vw,64px)}.b-seal img{width:70%;display:block;margin:6px auto 0;filter:drop-shadow(0 10px 14px rgba(0,0,0,.6))}.b-seal .no{color:var(--coral)}.b-seal:after{opacity:.35}
.b-count{--r:1.5deg;background:#F5F1E6}
.b-clock{--r:-1deg;background:var(--gold);margin-top:90px}
.b-line{--r:2.2deg;background:#16191d;color:var(--chalk);margin-top:20px}.b-line h3{color:#fff}.b-line .no{color:var(--gold)}.b-line:after{opacity:.3}
.minimap{display:flex;gap:6px;margin-top:10px}.minimap i{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--lc);color:#111;font:700 14px var(--hel);font-style:normal}
.cd-ph,.ck-ph{position:relative;aspect-ratio:4/3.4;overflow:hidden;background:#111;margin-top:10px}
.cd-ph img,.ck-ph img{width:100%;height:100%;object-fit:cover;display:block;transition:filter 1s}
.cd-t{position:absolute;right:8px;bottom:6px;display:flex;gap:2px}.cd-t .tl{width:32px;height:32px}
.chalkx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0}
.chalkx path{stroke:var(--chalk);stroke-width:7;stroke-linecap:round;fill:none;vector-effect:non-scaling-stroke;stroke-dasharray:120;stroke-dashoffset:120;opacity:.9}
.marked .chalkx{opacity:1}.marked .chalkx path{animation:draw 1.1s ease-out forwards}.marked .chalkx path:nth-child(5){stroke:var(--coral);animation-delay:.6s}
.tear{display:grid;grid-template-columns:repeat(4,1fr);margin:12px -20px -24px;border-top:2px dashed #999}
.tear button{position:relative;height:84px;border:0;border-right:1px dashed #999;background:#F5F1E6;font:700 13px var(--hel);letter-spacing:.14em;writing-mode:vertical-rl;transform-origin:top center;transition:transform .7s cubic-bezier(.5,0,.7,.4),opacity .7s;color:#16191d}
.tear button:hover{background:#fff}
.tear button.torn{transform:translateY(240px) rotate(28deg);opacity:0;pointer-events:none}
.cd-log{list-style:none;padding:0;margin:34px 0 8px;font:12px 'IBM Plex Mono',monospace;color:#555;max-height:90px;overflow:auto;position:relative;z-index:1}
.cd-log b{color:var(--brick)}
.ck-ph[data-s=night] img{filter:brightness(.48) saturate(1.3) hue-rotate(-14deg) contrast(1.1)}
.ck-ph[data-s=night]:after{content:"";position:absolute;inset:0;background:radial-gradient(60% 50% at 70% 20%,rgba(236,201,129,.25),transparent 70%)}
.ck-ph[data-s=rain] img{filter:brightness(.7) saturate(.8)}
.rain{position:absolute;inset:-20%;opacity:0;pointer-events:none;background:repeating-linear-gradient(105deg,transparent 0 9px,rgba(236,232,221,.4) 9px 10px,transparent 10px 23px);animation:rain .45s linear infinite}
.ck-ph[data-s=rain] .rain{opacity:.6}
@keyframes rain{to{transform:translate(-14px,46px)}}
.ck-b{display:flex;gap:6px;position:relative;z-index:1}
.ck-b button{flex:1;font:700 11px var(--hel);letter-spacing:.14em;border:2px solid #16191d;background:transparent;padding:8px 0;border-radius:99px;color:#16191d}
.ck-b button.on{background:#16191d;color:var(--gold)}
.post-clock{position:absolute;left:46%;bottom:0;width:120px;z-index:3}
.post-clock>img{width:100%;display:block;filter:drop-shadow(0 30px 30px rgba(0,0,0,.7))}
.hands{position:absolute;left:50%;top:23.6%;width:52%;transform:translate(-50%,-50%)}
.hands line{stroke:#111;stroke-linecap:round}#hh{stroke-width:6}#mh{stroke-width:3.5}.hands circle{fill:var(--brick)}
.post-clock p{position:absolute;left:115%;bottom:40%;width:200px;font:400 15px var(--hand);color:var(--chalk);transform:rotate(-4deg)}
.hyd{position:absolute;right:6%;bottom:0;width:110px;z-index:3;filter:drop-shadow(0 20px 20px rgba(0,0,0,.6))}
.stk{position:absolute;width:96px;z-index:1;transform:rotate(var(--r,8deg));filter:drop-shadow(0 4px 4px rgba(0,0,0,.5));border-radius:50%}
.stk.lg{border-radius:6px;width:110px}
.s0{left:2%;top:4%;--r:-12deg}.s1{left:23%;top:58%;--r:9deg}.s2{left:48%;top:3%;--r:-6deg}.s3{right:24%;top:56%;--r:14deg}.s4{right:1%;top:8%;--r:-9deg}.s5{left:70%;bottom:6%;--r:5deg}
.l0{left:11%;bottom:5%;--r:-5deg}.l1{left:36%;top:44%;--r:7deg}.l2{right:12%;bottom:22%;--r:-10deg}
/* 8 map */
.s-map{padding:14vh 0;background:#EAE3D1;color:var(--ink2)}
.mapbar{display:flex;align-items:center;gap:14px;background:#111;color:#fff;padding:14px 18px;border-radius:4px;margin-bottom:34px}
.mapbar b{font:700 18px var(--hel);letter-spacing:.04em}.mapbar small{margin-left:auto;font:600 12px var(--hel);color:#aaa;letter-spacing:.1em}
.lines{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0}
.lines button{display:inline-flex;align-items:center;gap:8px;font:700 13px var(--hel);background:#fff;border:2px solid #111;border-radius:99px;padding:6px 14px 6px 6px;color:#111;transition:background .2s,color .2s}
.lines button.on{background:#111;color:#fff}
.map{position:relative;max-width:980px;margin:0 auto;background:#BCD9DE;border:3px solid #111;border-radius:6px;overflow:hidden}
.map svg{width:100%;height:auto;display:block}
.tower{position:absolute;right:3%;top:3%;width:70px;z-index:2}
.bo{fill:#F4EFE2;stroke:#8FA7AB;stroke-width:1.2}
#routes path[data-b=Citywide]{stroke-dasharray:2 12;stroke-width:5!important}
#routes path{fill:none;stroke-width:7;stroke-linejoin:round;stroke-linecap:round;transition:opacity .4s}
.map.iso #routes path:not(.on){opacity:.12}
.dot{fill:#fff;stroke:#111;stroke-width:2.5;cursor:pointer;transition:r .2s,opacity .3s}
.dot.c{fill:var(--coral)}.dot.o{stroke-width:5}
.map.iso .dot:not(.hl){opacity:.2}
.tip{position:absolute;width:200px;pointer-events:none;background:#fff;border:3px solid #111;border-radius:6px;overflow:hidden;transform:translate(-50%,calc(-100% - 14px));z-index:3}
.tip img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
.tip div{padding:8px 10px;font:600 12px var(--hel)}.tip b{display:block;font:400 18px/1 var(--anton);text-transform:uppercase;margin:2px 0}
/* 9 cast */
.s-cast{padding:0 0 14vh;background:#0b0608}
.marquee{position:relative;max-width:1800px;margin:0 auto 60px}
.marquee img{width:100%;display:block}
.marquee .board{position:absolute;left:8.6%;right:8.6%;top:55.6%;height:16.6%;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:.4vw;background:none;padding:0;min-height:0;box-shadow:none}
.marquee .board span{font:400 clamp(12px,2.1vw,38px)/1 var(--anton);color:#151515;letter-spacing:.06em;text-transform:uppercase}
.marquee .board .r2{font-size:clamp(18px,3.4vw,62px);color:var(--brick)}
.marquee .board .r3{font-size:clamp(9px,1.2vw,20px)}
.bills{display:flex;gap:28px;overflow-x:auto;padding:20px 6vw 40px;scroll-snap-type:x mandatory;scrollbar-width:thin}
.pb{flex:none;width:260px;aspect-ratio:5.5/8.5;perspective:1400px;scroll-snap-align:center;outline:none}
.pb-in{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.pb:hover .pb-in,.pb:focus .pb-in,.pb.flip .pb-in{transform:rotateY(180deg)}
.pb-f,.pb-b{position:absolute;inset:0;backface-visibility:hidden;background:#fff;color:#111;display:flex;flex-direction:column;box-shadow:0 30px 50px -16px rgba(0,0,0,.9)}
.pb-f header,.pb-b header{background:#F2C230;font:400 26px/1 var(--anton);letter-spacing:.04em;padding:12px 14px 10px;display:flex;justify-content:space-between;align-items:baseline}
.pb-f header small{font:700 9px var(--hel);letter-spacing:.2em}
.pb-art{flex:1;overflow:hidden;border-top:3px solid #111;border-bottom:3px solid #111}
.pb-art{position:relative}.pb-art img,.pb-art video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.pb-art video{opacity:0;transition:opacity .4s}.pb.play .pb-art video{opacity:1}
.pb-f footer{padding:10px 14px 12px}
.pb-f footer strong{display:block;font:400 20px/1 var(--anton);text-transform:uppercase}
.pb-f footer small{font:600 10px var(--hel);letter-spacing:.06em;color:#555}
.pb-b{transform:rotateY(180deg)}
.pb-b header{font-size:14px;letter-spacing:.16em}
.pb-b h4{font:400 28px/1 var(--anton);text-transform:uppercase;margin:16px 14px 8px}
.pb-b p{font:400 14px/1.5 Fraunces,serif;margin:0 14px 10px}
.pb-b .was{font:italic 13px Fraunces,serif;color:var(--brick)}
.pb-b a{margin:auto 14px 14px;font:700 11px var(--hel);letter-spacing:.14em;text-transform:uppercase;color:#111}
/* 10 last call */
.s-last{height:auto;background:#0a0606}
.last-pin{position:sticky;top:0;height:100vh;margin-bottom:120vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3vh;overflow:hidden}
.neon{font:400 clamp(48px,9vw,140px)/1 var(--neon);color:#FFD0C8;margin:0;letter-spacing:.04em;text-shadow:0 0 6px #fff,0 0 14px var(--coral),0 0 34px var(--coral),0 0 80px #ff3b2f}
.neon span:last-child{animation:flick 4s infinite}
@keyframes flick{0%,18%,22%,62%,64%,100%{opacity:1}20%,63%{opacity:.25}}
.shop{position:relative;width:min(1200px,92vw);aspect-ratio:2.1/1;border:16px solid #3a1414;border-top-width:26px;background:#2a1205;box-shadow:0 0 0 4px #111,0 40px 80px -20px #000;overflow:hidden}
.window{position:absolute;inset:0;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;gap:12px;padding:16px;background:radial-gradient(80% 90% at 50% 20%,rgba(255,190,110,.55),rgba(120,50,10,.6) 70%,#1a0a04)}
.cl{position:relative;display:block;overflow:hidden;border-radius:3px;color:#fff;text-decoration:none;box-shadow:0 10px 20px rgba(0,0,0,.6)}
.cl:first-child{grid-column:span 2;grid-row:span 2}
.cl-art,.cl-art img,.cl-art video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cl-art video{opacity:0;transition:opacity .4s}.cl.play .cl-art video{opacity:1}
.cl-tx{position:absolute;left:0;right:0;bottom:0;padding:34px 12px 10px;background:linear-gradient(0deg,rgba(0,0,0,.92),rgba(0,0,0,.5) 60%,transparent);display:flex;flex-direction:column;gap:3px}
.cl-tx small{max-height:0;overflow:hidden;opacity:0;transition:max-height .5s,opacity .4s}
.cl:hover .cl-tx small{max-height:90px;opacity:1}
.cl-tx i{font:700 9px var(--hel);letter-spacing:.14em;font-style:normal;color:var(--gold)}
.cl-tx strong{font:400 clamp(14px,1.4vw,22px)/1 var(--anton);text-transform:uppercase}
.cl-tx small{font-size:12px;line-height:1.35;color:#ddd}
.gate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:translateY(calc(var(--g,0) * -100%));box-shadow:0 20px 30px #000;z-index:2}
.s-last .wrap{position:relative;padding:4vh 24px 12vh;text-align:center}.s-last .sub{margin:0 auto}
/* 11 monte */
.s-monte{padding:14vh 0;background:#15181c url(@@chalk@@) 0 0/512px}
.monte{display:grid;grid-template-columns:1.1fr 1fr .8fr;gap:44px;align-items:center;margin-top:30px}
.table{position:relative}
.table>img{width:100%;display:block;filter:drop-shadow(0 30px 30px rgba(0,0,0,.6))}
.cards3{position:absolute;left:14%;right:14%;top:26%;height:48%}
.cards3 i{position:absolute;top:0;width:24%;aspect-ratio:2/3;background:url(@@card@@) center/cover;border-radius:6px;box-shadow:0 10px 16px rgba(0,0,0,.5);animation:monte 3.2s cubic-bezier(.6,0,.4,1) infinite}
.cards3 i:nth-child(1){left:0;--a:0%;--b:150%;--c:300%}
.cards3 i:nth-child(2){left:0;--a:150%;--b:300%;--c:0%;animation-delay:-.4s}
.cards3 i:nth-child(3){left:0;--a:300%;--b:0%;--c:150%;animation-delay:-.8s}
@keyframes monte{0%,20%{transform:translateX(var(--a))}40%,55%{transform:translateX(var(--b)) translateY(-8%)}75%,100%{transform:translateX(var(--c))}}
.sign{position:absolute;left:-4%;bottom:-12%;background:#C8A272;color:#1a1a1a;font:400 clamp(14px,1.4vw,19px)/1.3 var(--hand);padding:14px 18px;transform:rotate(-5deg);box-shadow:0 10px 20px rgba(0,0,0,.5)}
.steps{list-style:none;padding:0;margin:0;counter-reset:s;display:flex;flex-direction:column;gap:18px}
.steps li{counter-increment:s;color:var(--cloud);line-height:1.5;padding-left:52px;position:relative}
.steps li:before{content:counter(s);position:absolute;left:0;top:0;display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--gold);color:#111;font:700 16px var(--hel)}
.steps b{display:block;font:400 26px/1 var(--anton);text-transform:uppercase;margin-bottom:6px}
.receipt{background:#FBFAF5;color:#222;font:12px/1.5 'IBM Plex Mono',monospace;padding:22px 18px 30px;transform:rotate(2deg);box-shadow:0 20px 40px rgba(0,0,0,.6);-webkit-mask:linear-gradient(#000,#000) top/100% calc(100% - 10px) no-repeat,conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/16px 10px repeat-x;mask:linear-gradient(#000,#000) top/100% calc(100% - 10px) no-repeat,conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/16px 10px repeat-x}
.receipt p{margin:0;white-space:nowrap;overflow:hidden}
.receipt .rh{text-align:center;font-weight:600;white-space:normal}
.receipt code{display:block;word-break:break-all;font-size:11px;margin:4px 0 6px;padding:6px;background:#eee}
.receipt a{display:block;text-align:center;margin-top:10px;color:#222}
/* 12 signs */
.s-mint{padding:10vh 0 8vh;background:linear-gradient(#06090f,#0b0f14)}
.mt{max-width:720px;margin:0 auto;padding:22px 24px 18px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.04)}
.mt-count{font:600 15px/1.4 var(--hel);letter-spacing:.02em}.mt-count b{font-family:var(--anton);font-weight:400;font-size:28px;letter-spacing:.02em}
.mt-track{height:6px;border-radius:3px;background:rgba(255,255,255,.12);margin:10px 0 14px;overflow:hidden}.mt-track i{display:block;height:100%;width:0;background:#F26D5B;transition:width .6s}
.mt-next{font:15px/1.4 var(--hel);opacity:.9;margin:0 0 14px}
.mt-row{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.mt-row label{font:600 12px/1 var(--hel);letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:8px}
.mt-row select{font:600 16px var(--hel);padding:10px 12px;border-radius:8px;background:#141A22;color:#fff;border:1px solid rgba(255,255,255,.2)}
.mt-total{font:14px/1.4 var(--hel);opacity:.8;margin:10px 0 0}
.mt-st{font:14px/1.5 var(--hel);min-height:1.5em;margin:8px 0 0}.mt-st.bad{color:#ff7b6b}.mt-st.ok{color:#9be28f}.mt-st.wait{opacity:.8}
.mt-got{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:12px}
.mt-card{display:flex;gap:10px;align-items:center;padding:8px;border-radius:10px;background:rgba(255,255,255,.06);color:inherit;text-decoration:none}.mt-card img{width:56px;height:56px;object-fit:cover;border-radius:6px}.mt-card span{display:flex;flex-direction:column;gap:2px}.mt-card small{font:600 11px var(--hel);letter-spacing:.1em;opacity:.7}.mt-card b{font:600 14px/1.2 var(--hel)}.mt-card i{font:12px var(--hel);opacity:.7;font-style:normal}
.mt .fine{font:12px/1.5 var(--hel);opacity:.65;margin:14px 0 0}.mt .fine code{font-family:var(--doto);font-size:12px}
.s-signs{padding:14vh 0 12vh;background:linear-gradient(#0b0f14,#06090f)}
.signs-w{display:grid;grid-template-columns:minmax(260px,360px) 1fr;gap:70px;align-items:start}
.pole{position:relative;display:flex;flex-direction:column;gap:12px;align-items:center;padding:20px 0 60px}
.pole:before{content:"";position:absolute;left:50%;top:-40px;bottom:-12vh;width:16px;margin-left:-8px;background:linear-gradient(90deg,#4a4f55,#9aa2ab 40%,#5a6068);border-radius:3px}
.sg{position:relative;width:100%;background:#fff;border-radius:10px;padding:16px 14px;text-align:center;box-shadow:0 10px 20px rgba(0,0,0,.5),inset 0 0 0 3px #fff,inset 0 0 0 5px currentColor;color:#C1272D}
.sg.green{color:#1F7A3A}
.sg b{display:block;font:800 clamp(22px,2.2vw,30px)/1 var(--hel);letter-spacing:.01em}
.sg small{display:block;font:700 12px var(--hel);letter-spacing:.08em;margin-top:6px}
.sg .ar{position:absolute;left:14px;top:50%;width:26px;height:4px;background:currentColor;margin-top:-2px}
.sg .ar:after{content:"";position:absolute;left:-2px;top:-6px;border:8px solid transparent;border-right-color:currentColor;transform:translateX(-12px)}
.sg:nth-child(2n){transform:rotate(-1.2deg)}.sg:nth-child(3n){transform:rotate(1.4deg)}
.rel-copy .rec{width:100%;border-collapse:collapse;margin:16px 0 26px}
.rel-copy .rec td{border-top:1px solid var(--divider);padding:13px 10px;vertical-align:top;line-height:1.5;color:var(--cloud)}
.rel-copy .rec td:first-child{font:700 11px var(--hel);color:var(--slate);letter-spacing:.14em;text-transform:uppercase;width:110px}
.taxis{display:flex;flex-wrap:wrap;gap:18px}
.taxi{display:flex;flex-direction:column;align-items:center;text-decoration:none;min-width:220px;padding:12px 20px 14px;border-radius:14px 14px 6px 6px;background:linear-gradient(#FFD23F,#E9B600);color:#111;box-shadow:0 16px 30px -8px rgba(0,0,0,.7),inset 0 -6px 0 rgba(0,0,0,.15);transition:transform .2s,box-shadow .2s}
.taxi span{font:700 10px var(--hel);letter-spacing:.3em;background:#111;color:#FFD23F;padding:3px 10px;border-radius:3px;margin-bottom:6px}
.taxi b{font:400 24px/1 var(--anton);letter-spacing:.03em}
.taxi:hover{transform:translateY(-4px);box-shadow:0 24px 40px -8px rgba(255,200,40,.35)}
/* phones */
@media (max-width:900px){
 .line{display:none}
 .cols,.monte,.signs-w{grid-template-columns:1fr}
 .copy{column-count:1}
 .board{grid-template-columns:1fr 1fr;min-height:0;padding-bottom:220px}
 .post-clock{left:6%;width:110px}.hyd{width:80px}
 .lh,.lr{grid-template-columns:44px 1fr 28px 40px}
 .lh span:nth-child(3),.lr .pl,.lh span:nth-child(6),.lr .tk{display:none}
 .book:before{left:52px}
 .window{grid-template-columns:repeat(3,1fr)}
 .cl:first-child{grid-column:span 3;grid-row:span 1}
 .shop{aspect-ratio:auto;height:78vh}
}
@media (max-width:760px){
 .mega{font-size:clamp(96px,30vw,160px)}
 .hero-in{padding-bottom:9vh}
 .cue{display:none}
 .zt{font-size:17px}.zipper{height:38px}
 .disp{width:24%;top:6%;right:1%}
 .stage{position:relative;right:auto;top:auto;width:64%;margin:56px auto 0;opacity:1;transform:none;pointer-events:auto}
 .hint{position:relative;display:block;text-align:center;right:auto;top:auto;margin:18px 0 0}
 .last-pin{margin-bottom:0}
 .sc.open{transform:rotateY(180deg)}
 .hero-in .hand{flex-wrap:wrap}
 .plat-pin{position:relative;height:auto;padding-bottom:0}
 .plat-view{overflow-x:auto;scroll-snap-type:x mandatory;padding:30px 0 40px}
 .track{padding:0 20px;gap:22px}
 .post,.stn{scroll-snap-align:center}
 .tab{width:260px}
 .board{grid-template-columns:1fr;padding:40px 6% 200px}
 .bill{margin-top:0!important}
 .stk{width:64px}.stk.lg{width:74px}
 .s-last{height:auto}
 .last-pin{position:relative;height:auto;padding:12vh 0 4vh}
 .gate{display:none}
 .s-last .wrap{margin-top:0}
 .cat{width:110px;top:-96px}
}
@media (prefers-reduced-motion:reduce){
 .zt,.grain,.pigeon,.cards3 i,.win:before,.cue img,.neon span{animation:none}
 .tl path{animation:none;stroke-dashoffset:0}
 [data-rv]{opacity:1;transform:none}
 .mega .ln span{transform:none}
 .doors{display:none}
}
"""

JS = r"""
(function(){
"use strict";
const M=JSON.parse(document.getElementById("marks-data").textContent);
const U=M.u, ALL=U.concat(M.c), RM=matchMedia("(prefers-reduced-motion: reduce)").matches, FINE=matchMedia("(hover:hover) and (pointer:fine)").matches;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
const pick=()=>U[Math.floor(Math.random()*U.length)], pad=(n,k)=>String(n).padStart(k,"0");
function tally(n){let o="";for(let g=0;g<n;g+=5){const k=Math.min(5,n-g);let s="";for(let i=0;i<Math.min(k,4);i++)s+=`<path d="M${6+i*9} 4 L${5+i*9+(i%2)} 40"/>`;if(k===5)s+='<path class="sl" d="M0 33 L40 10"/>';o+=`<svg class="tl" viewBox="-2 0 44 44">${s}</svg>`;}return o;}

/* ---- the doors open once a session, then the title rises ---- */
const doors=$("#doors"), start=()=>document.body.classList.add("ready");
let seen=false; try{seen=sessionStorage.getItem("mk_doors")==="1";}catch(e){}
if(RM||seen){doors.classList.add("gone"); start();}
else{ setTimeout(()=>{doors.classList.add("open"); setTimeout(start,350); setTimeout(()=>doors.classList.add("gone"),1400); try{sessionStorage.setItem("mk_doors","1");}catch(e){}},700); }
$$(".htally path").forEach((p,i)=>p.style.animationDelay=(RM?0:1.4+i*.01)+"s");

/* ---- reveal on scroll ---- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}}),{threshold:.18});
$$("[data-rv],.car").forEach(el=>io.observe(el));

/* ---- cursor ---- */
const cur=$("#cur");
if(FINE&&!RM){ let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y;
  addEventListener("pointermove",e=>{x=e.clientX;y=e.clientY;cur.classList.add("on");
    const t=e.target.closest&&e.target.closest("[data-cur],a,button"); cur.classList.toggle("big",!!t); cur.querySelector("span").textContent=t?(t.dataset.cur||(t.tagName==="A"?"Go":"Tap")):"";},{passive:true});
  document.addEventListener("pointerleave",()=>cur.classList.remove("on"));
  (function loop(){cx+=(x-cx)*.2;cy+=(y-cy)*.2;cur.style.transform=`translate(${cx}px,${cy}px)`;requestAnimationFrame(loop);})(); }

/* ---- the line: which stop are we at ---- */
const stops=$$("#line a"), secs=stops.map(a=>document.getElementById(a.dataset.s));
const sio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){stops.forEach(a=>a.classList.toggle("on",a.dataset.s===e.target.id));}}),{rootMargin:"-45% 0px -50% 0px"});
secs.forEach(s=>s&&sio.observe(s));

/* ---- scroll driven: hero parallax, the platform ride, the roll gate ---- */
const hero=$(".s-hero"), plat=$("#platform"), pin=$(".plat-pin"), track=$("#track"), last=$("#last"), gate=$("#gate"), nowB=$("#now b");
const stns=$$(".stn"); let trackW=0;
function size(){ if(innerWidth>760){ trackW=track.scrollWidth; plat.style.height=(trackW-innerWidth+innerHeight)+"px"; } else { plat.style.height=""; track.style.transform=""; } }
size(); addEventListener("resize",size); addEventListener("load",size);
function onScroll(){ const y=scrollY, vh=innerHeight;
  hero.style.setProperty("--p",Math.min(1,y/vh).toFixed(3));
  if(innerWidth>760){ const r=plat.getBoundingClientRect(), span=plat.offsetHeight-vh, p=Math.min(1,Math.max(0,-r.top/span));
    const dx=p*(trackW-innerWidth); track.style.transform=`translate3d(${-dx}px,0,0)`;
    let at=stns[0]; stns.forEach(s=>{ if(s.offsetLeft-dx<innerWidth*.6) at=s; }); const nm=at&&at.querySelector("b"); if(nm&&nowB.textContent!==nm.textContent) nowB.textContent=nm.textContent; }
  if(innerWidth>760){ const r=last.getBoundingClientRect(), span=last.offsetHeight-vh, p=Math.min(1,Math.max(0,(-r.top)/span)); gate.style.setProperty("--g",Math.min(1,p*1.6).toFixed(3)); }
}
let tk=false; addEventListener("scroll",()=>{if(!tk){tk=true;requestAnimationFrame(()=>{onScroll();tk=false;});}},{passive:true}); onScroll();

/* ---- videos play when hovered, or when in view on touch ---- */
function play(el,on){ const v=el.querySelector("video"); if(!v||RM)return; if(on){ if(!v.src) v.src=v.dataset.src; v.play().then(()=>el.classList.add("play")).catch(()=>{}); } else { v.pause(); el.classList.remove("play"); } }
const movers=$$(".post[data-mv='1'],.cl,.pb");
if(FINE) movers.forEach(el=>{el.addEventListener("pointerenter",()=>play(el,true)); el.addEventListener("pointerleave",()=>play(el,false));});
else { const vio=new IntersectionObserver(es=>es.forEach(e=>play(e.target,e.intersectionRatio>.6)),{threshold:[0,.6]}); movers.forEach(el=>vio.observe(el)); }

/* ---- THE TRAILER: a muted teaser loops on the screen in view; play swaps in the film with sound (HLS) ---- */
(function(){ const v=$("#tr"), b=$("#trp"); if(!v||!b) return; const SRC="assets/film/the-marks/master.m3u8"; let full=false;
  if(!RM){ const tio=new IntersectionObserver(es=>es.forEach(e=>{ if(full) return; if(e.isIntersecting){ if(!v.src) v.src=v.dataset.teaser; v.play().catch(()=>{}); } else v.pause(); }),{threshold:.35}); tio.observe(v); }
  function go(){ b.hidden=true; v.controls=true; v.muted=false; v.loop=false; v.currentTime=0; v.play().catch(()=>{}); }
  b.onclick=()=>{ full=true; v.pause();
    if(v.canPlayType("application/vnd.apple.mpegurl")){ v.src=SRC; go(); return; }
    const sc=document.createElement("script"); sc.src="https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.15/hls.min.js";
    sc.onload=()=>{ if(window.Hls&&Hls.isSupported()){ const hl=new Hls({capLevelToPlayerSize:true}); hl.loadSource(SRC); hl.attachMedia(v); hl.on(Hls.Events.MANIFEST_PARSED,go); } else { v.src=SRC; go(); } };
    sc.onerror=()=>{ v.src=SRC; go(); }; document.head.appendChild(sc); };
})();

/* ---- THE DELI: take a number, then hold the wax ---- */
const deli=$(".deli"), take=$("#take"), led=$("#led"), sc=$("#sc"), wax=$("#wax"), hint=$("#hint"), again=$("#again");
let cur1=null, rolling=false, t=null;
take.onclick=()=>{ if(rolling||deli.classList.contains("ready"))return; rolling=true; cur1=pick();
  $("#tixn").textContent=pad(cur1.m,3); take.classList.remove("took"); void take.offsetWidth; take.classList.add("took"); hint.textContent="";
  let i=0; const end=RM?1:22; const iv=setInterval(()=>{ i++; led.textContent=i>=end?("MARK "+pad(cur1.m,3)):("MARK "+pad(1+Math.floor(Math.random()*150),3));
    if(i>=end){clearInterval(iv); rolling=false; deli.classList.add("ready"); hint.textContent="Now hold the wax"; } },70); };
function reveal(){ const x=cur1||pick();
  $("#rv-img").src=x.th; $("#rv-img").alt=x.t+", by MLow";
  const rvv=$("#rv-vid"); rvv.classList.remove("on"); if(x.lp&&!RM){ rvv.src=x.lp; rvv.play().then(()=>rvv.classList.add("on")).catch(()=>{}); } else { rvv.pause(); rvv.removeAttribute("src"); } $("#rv-pl").textContent=`MARK ${pad(x.m,3)} · NO. ${pad(x.n,4)}`;
  $("#rv-t").textContent=x.t; $("#rv-p").textContent=[x.nb,x.b].filter((v,i,a)=>v&&a.indexOf(v)===i).join(", "); $("#rv-a").href="n/"+x.id;
  wax.classList.remove("hold"); wax.classList.add("broke"); hint.textContent="";
  setTimeout(()=>{sc.classList.add("open"); again.hidden=false;},RM?0:450); }
wax.addEventListener("pointerdown",e=>{ if(wax.classList.contains("broke"))return; e.preventDefault(); wax.classList.add("hold"); t=setTimeout(reveal,RM?0:800); });
["pointerup","pointerleave","pointercancel"].forEach(ev=>wax.addEventListener(ev,()=>{ if(!wax.classList.contains("broke")) wax.classList.remove("hold"); clearTimeout(t); }));
wax.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();reveal();}});
again.onclick=()=>{ sc.classList.remove("open"); again.hidden=true; setTimeout(()=>{wax.classList.remove("broke"); deli.classList.remove("ready"); take.classList.remove("took"); led.textContent="- - -"; hint.textContent="Pull a ticket";},700); };

/* ---- the ledger ---- */
const book=$("#book"), rows=$$(".lr"), more=$("#more"), peek=$("#peek");
more.onclick=()=>{book.classList.remove("less"); more.parentNode.hidden=true;};
$$("#tabs .tabb").forEach(b=>b.onclick=()=>{ $$("#tabs .tabb").forEach(x=>x.classList.toggle("on",x===b)); const f=b.dataset.f; if(f!=="all") more.onclick();
  rows.forEach(r=>r.hidden=!(f==="all"||(f==="mv"&&r.dataset.mv==="1")||(f==="ones"&&r.dataset.ones==="1")||(f.startsWith("b:")&&r.dataset.b===f.slice(2)))); });
const pimg=peek.querySelector("img"), pvid=peek.querySelector("video");
if(FINE){ rows.forEach(r=>{ r.addEventListener("pointerenter",()=>{pimg.src=r.dataset.th; peek.classList.add("on"); peek.classList.remove("mv"); if(r.dataset.lp&&!RM){ pvid.src=r.dataset.lp; pvid.play().then(()=>peek.classList.add("mv")).catch(()=>{}); } else { pvid.pause(); pvid.removeAttribute("src"); } }); r.addEventListener("pointerleave",()=>{peek.classList.remove("on"); pvid.pause();}); });
  book.addEventListener("pointermove",e=>{peek.style.left=(e.clientX+150)+"px"; peek.style.top=e.clientY+"px";},{passive:true}); }
$(".cat").addEventListener("click",()=>{ const r=rows[Math.floor(Math.random()*rows.length)]; more.onclick(); r.scrollIntoView({block:"center",behavior:RM?"auto":"smooth"}); r.style.background="rgba(236,201,129,.6)"; setTimeout(()=>r.style.background="",1600); });

/* ---- THE COUNT: tear a tab ---- */
const cd=$("#count"), ct=$("#cd-t"), log=$("#cd-log"); let cx=pick(), n=1;
const w8=()=>"0x"+Math.random().toString(16).slice(2,6)+"…"+Math.random().toString(16).slice(2,6);
function cdSet(){ $("#cd-img").src=cx.th; $("#cd-img").alt=cx.t; ct.innerHTML=tally(n); cd.classList.toggle("marked",n>=5); }
$$("#tear button").forEach(b=>b.onclick=()=>{ if(n>=5||b.classList.contains("torn"))return; b.classList.add("torn"); n++;
  const li=document.createElement("li"); li.innerHTML=`<b>${b.dataset.ev}</b> to ${w8()} · stroke ${n}${n===5?" · THE MARKED opens":""}`; log.prepend(li); cdSet(); });
$("#cd-r").onclick=()=>{ n=1; cx=pick(); $$("#tear button").forEach(b=>b.classList.remove("torn")); log.innerHTML=`<li><b>Minted</b> · stroke 1 · ${esc(cx.t)}</li>`; cdSet(); };
$("#cd-r").onclick();

/* ---- THE CLOCK: real New York time on the street clock ---- */
const ck=$("#ck-ph"); $("#ck-img").src=pick().th; let live="day";
function setS(s){ck.dataset.s=s; $$("#clock [data-s]").forEach(b=>b.classList.toggle("on",b.dataset.s===s));}
function tick(){ const d=new Date(), parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"numeric",hour12:false}).formatToParts(d);
  const h=+parts.find(p=>p.type==="hour").value%24, m=+parts.find(p=>p.type==="minute").value;
  $("#hh").setAttribute("transform",`rotate(${(h%12)*30+m*.5} 50 50)`); $("#mh").setAttribute("transform",`rotate(${m*6} 50 50)`);
  if(live!=="rain") live=(h>=7&&h<19)?"day":"night";
  $("#ck-now").textContent=`${((h+11)%12)+1}:${pad(m,2)} in New York. It is ${live} on the token.`; }
tick(); setS(live); setInterval(tick,20000);
fetch("https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=precipitation").then(r=>r.json()).then(j=>{ if(j&&j.current&&j.current.precipitation>0){live="rain";tick();setS("rain");} }).catch(()=>{});
$$("#clock [data-s]").forEach(b=>b.onclick=()=>setS(b.dataset.s));

/* ---- THE LINE: an MTA style map, a route per borough ---- */
const NS="http://www.w3.org/2000/svg", svg=$("#mapsvg"), g=$("#dots"), rg=$("#routes"), tip=$("#tip"), map=$(".map");
const byB={}; ALL.forEach(x=>{ if(x.x==null)return; (byB[x.b]=byB[x.b]||[]).push(x); });
Object.keys(byB).forEach(b=>{ const left=byB[b].slice(), path=[left.splice(left.reduce((a,x,i)=>x.x<left[a].x?i:a,0),1)[0]];
  while(left.length){const p=path[path.length-1]; let bi=0,bd=1e9; left.forEach((q,i)=>{const d=(q.x-p.x)**2+(q.y-p.y)**2; if(d<bd){bd=d;bi=i;}}); path.push(left.splice(bi,1)[0]);}
  const el=document.createElementNS(NS,"path"); el.setAttribute("d","M"+path.map(p=>p.x+" "+p.y).join(" L")); el.setAttribute("stroke",(M.lc[b]||"#ECC981").replace(/var\((--[^)]+)\)/,(m,v)=>getComputedStyle(document.documentElement).getPropertyValue(v).trim()||"#ECC981")); el.dataset.b=b; rg.appendChild(el); });
ALL.forEach(x=>{ if(x.x==null)return; const c=document.createElementNS(NS,"circle"); c.setAttribute("cx",x.x); c.setAttribute("cy",x.y); c.setAttribute("r",x.ones?8:5.5);
  c.setAttribute("class","dot"+(x.m?"":" c")+(x.ones?" o":"")); c.__x=x; g.appendChild(c); });
g.addEventListener("pointerover",e=>{const x=e.target.__x; if(!x)return; const r=svg.getBoundingClientRect(), k=r.width/svg.viewBox.baseVal.width;
  tip.innerHTML=`<img src="${x.th}" alt=""><div>${x.m?"MARK "+pad(x.m,3):"ERA "+x.era+" CLOSER"}<b>${esc(x.t)}</b>${esc(x.nb||x.b)}</div>`; tip.style.left=(x.x*k)+"px"; tip.style.top=(x.y*k)+"px"; tip.hidden=false;});
g.addEventListener("pointerout",()=>tip.hidden=true);
g.addEventListener("click",e=>{const x=e.target.__x; if(x) location.href="n/"+x.id;});
let sel=null;
$$("#lines button").forEach(b=>b.onclick=()=>{ sel=sel===b.dataset.b?null:b.dataset.b; $$("#lines button").forEach(x=>x.classList.toggle("on",x.dataset.b===sel)); map.classList.toggle("iso",!!sel);
  rg.querySelectorAll("path").forEach(p=>{ const on=p.dataset.b===sel; p.classList.toggle("on",on); if(on&&!RM){const L=p.getTotalLength(); p.style.transition="none"; p.style.strokeDasharray=L; p.style.strokeDashoffset=L; p.getBoundingClientRect(); p.style.transition="stroke-dashoffset 2s ease-in-out"; p.style.strokeDashoffset=0;} });
  g.querySelectorAll(".dot").forEach(c=>c.classList.toggle("hl",c.__x.b===sel)); });

/* ---- playbills flip on tap ---- */
$$(".pb").forEach(p=>p.addEventListener("click",e=>{ if(e.target.closest("a"))return; if(!FINE) p.classList.toggle("flip"); }));

/* ---- mint: RareMinter direct sale, instant reveal. Plain JSON-RPC and the wallet's own provider, no library. ---- */
(function(){
const K=M.mint; if(!K||!K.contract) return;
const RPCS=["https://ethereum-rpc.publicnode.com","https://cloudflare-eth.com"];
const byMark=new Map(U.map(x=>[x.m,x]));
function hex(v){return "0x"+BigInt(v).toString(16);}
function w(v){return BigInt(v).toString(16).padStart(64,"0");}
async function rpc(method,params){let err;for(const u of RPCS){try{const r=await fetch(u,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});const j=await r.json();if(j.error)throw new Error(j.error.message);return j.result;}catch(e){err=e;}}throw err;}
const call=(to,data)=>rpc("eth_call",[{to,data},"latest"]);
const price=BigInt(K.priceWei);
let supply=null, feePct=null;
const el={n:$("#mt-n"),left:$("#mt-left"),next:$("#mt-next"),btn:$("#mt-go"),qty:$("#mt-qty"),st:$("#mt-st"),tot:$("#mt-total"),bar:$("#mt-bar"),got:$("#mt-got")};
const fmt=v=>(Number(v)/1e18).toFixed(5).replace(/0+$/,"").replace(/\.$/,"");
const markOf=t=>{const r=K.map.find(z=>z[0]===t);return r?byMark.get(r[1]):null;};
async function refresh(){try{const s=Number(BigInt(await call(K.contract,"0x18160ddd")));supply=s;el.n.textContent=s;el.left.textContent=Math.max(0,K.max-s);el.bar.style.width=(100*s/K.max)+"%";
  if(s>=K.max){el.next.textContent="Sold out. Every Mark is spoken for.";el.btn.disabled=true;el.btn.textContent="SOLD OUT";return;}
  const x=markOf(s+1);el.next.innerHTML=`Next ticket: <b>No. ${pad(s+1,3)}</b>${x?", "+esc(x.t):""}`;}catch(e){}}
async function feeFor(total){try{if(feePct===null)feePct=BigInt(await call(K.settings,"0x83475921"));return total*feePct/100n;}catch(e){return total*3n/100n;}}
async function total(){const q=BigInt(el.qty.value||1),t=price*q,f=await feeFor(t);return {q,t,f,v:t+f};}
async function showTotal(){const o=await total();el.tot.textContent=`${fmt(o.v)} ETH for ${o.q}: 0.069 each plus the 3% marketplace fee, plus gas.`;}
function say(s,cls){el.st.textContent=s;el.st.className="mt-st "+(cls||"");}
function reason(e){const c=e&&(e.code!=null?e.code:(e.cause&&e.cause.code));const m=String((e&&(e.message||e.reason||e.shortMessage))||"");
  if(c===4001||/reject|denied|declined/i.test(m))return "You declined it in your wallet.";
  if(c===-32002)return "Your wallet already has a request open. Finish or dismiss it, then try again.";
  if(/insufficient/i.test(m))return "Not enough ETH in that wallet for the price, the fee and gas.";
  if(/not started/i.test(m))return "The sale has not opened yet.";
  if(/mint limit|transaction limit|exceeded/i.test(m))return "That is over the limit for one transaction.";
  return m?m.slice(0,160):"The wallet gave no reason.";}
el.qty.addEventListener("change",showTotal);
el.btn.addEventListener("click",async()=>{
  const eth=window.ethereum; if(!eth){say("No wallet found in this browser. Open this page inside your wallet's browser, or use the contract link below.","bad");return;}
  el.btn.disabled=true;
  try{
    say("Check your wallet: it should ask you to connect.");
    const acc=await eth.request({method:"eth_requestAccounts"}); const from=acc&&acc[0]; if(!from)throw new Error("Your wallet did not share an address.");
    const cid=await eth.request({method:"eth_chainId"});
    if(parseInt(cid,16)!==1){say("Switching your wallet to Ethereum mainnet.");try{await eth.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x1"}]});}catch(e){throw new Error("Switch your wallet to Ethereum mainnet and try again.");}}
    const o=await total();
    const data="0xd647ed3c"+w(K.contract)+w(0)+w(price)+w(o.q)+w(0xa0)+w(0);   /* mintDirectSale(contract, ETH, price, qty, proof[]) */
    say(`Confirm in your wallet: ${fmt(o.v)} ETH for ${o.q}.`);
    const tx=await eth.request({method:"eth_sendTransaction",params:[{from,to:K.minter,value:hex(o.v),data}]});
    say("Sent. Waiting for the block.","wait"); el.got.innerHTML=`<p class="fine"><a href="https://etherscan.io/tx/${tx}">${tx.slice(0,12)}… on Etherscan</a></p>`;
    let rc=null; for(let i=0;i<120&&!rc;i++){await new Promise(r=>setTimeout(r,5000)); try{rc=await rpc("eth_getTransactionReceipt",[tx]);}catch(e){}}
    if(!rc){say("Still pending. Watch it on Etherscan; your Marks show here when it lands.","wait");}
    else if(rc.status==="0x1"){await refresh();
      const ids=[]; (rc.logs||[]).forEach(l=>{if(l.address.toLowerCase()===K.contract.toLowerCase()&&l.topics[0]==="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"&&l.topics.length===4)ids.push(Number(BigInt(l.topics[3])));});
      say("Minted."+(ids.length?" You got "+ids.map(i=>"No. "+pad(i,3)).join(", ")+".":""),"ok");
      el.got.innerHTML=ids.map(i=>{const x=markOf(i);return `<a class="mt-card" href="https://superrare.com/artwork/eth/${K.contract}/${i}">${x&&x.th?`<img src="${x.th}" alt="">`:""}<span><small>TICKET ${pad(i,3)}</small><b>${esc(x?x.t:"Mark")}</b><i>${esc(x?(x.nb||x.b||""):"")}</i></span></a>`;}).join("")+`<p class="fine"><a href="https://etherscan.io/tx/${tx}">The transaction on Etherscan</a></p>`;}
    else say("The transaction failed on chain. Nothing was charged beyond gas.","bad");
  }catch(e){say(reason(e),"bad");}
  el.btn.disabled=supply!==null&&supply>=K.max;
});
refresh(); showTotal(); setInterval(refresh,20000);
})();
})();
"""

FILTER = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="chalkf"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></svg>'
for k, f in {"newsstand": "newsstand.jpg", "wheat": "wheat.webp", "tile": "../ui/tile.webp", "mosaic": "../ui/mosaic.webp", "plywood": "plywood.jpg", "marquee": "marquee-s.jpg", "chalk": "chalk.webp", "card": "card.webp"}.items():
    CSS = CSS.replace(f"@@{k}@@", v(os.path.normpath(f"assets/marks/{f}")))
FONTS_X = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Doto:wght@700;900&family=Monoton&family=UnifrakturMaguntia&family=Bungee&family=Rock+Salt&display=swap">'
ld = [{"@context": "https://schema.org", "@type": "CollectionPage", "@id": URL + "/marks", "name": "THE MARKS · NEW YORKERS by MLow", "url": URL + "/marks",
       "isPartOf": {"@id": URL + "/#site"}, "description": "150 New Yorkers made, numbered and left off the count, minting at 0.069 ETH in a published shuffled order and revealed the moment they mint, plus nine era closers, separate one of ones at 0.269 ETH on SuperRare.",
       "mainEntity": {"@type": "ItemList", "name": "THE MARKS", "numberOfItems": len(ITEMS),
                      "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": x["t"], "url": f"{URL}/n/{x['id']}"} for i, x in enumerate(ITEMS)]}},
      {"@context": "https://schema.org", "@type": "VideoObject", "name": "THE MARKS, the trailer", "creator": {"@type": "Person", "name": "MLow"},
       "description": "6,666 New Yorkers were made. 5,555 never made the count. 150 are coming back on SuperRare. A film by MLow.",
       "thumbnailUrl": f"{URL}/{FILM}/poster.jpg", "contentUrl": f"{URL}/{FILM}/1080/index.m3u8", "embedUrl": f"{URL}/marks#trailer",
       "duration": "PT56S", "uploadDate": "2026-10-09"}]
page = shell(title="THE MARKS · 150 of the uncounted · NEW YORKERS by MLow",
             description="THE MARKS: 150 New Yorkers who were made, numbered and then left off the count. They mint at 0.069 ETH in a published shuffled order, open the moment they mint, and keep getting marked by the city. Plus nine era closers, separate one of ones at 0.269 ETH on SuperRare.",
             body=FILTER + body, path="marks.html", active="MARKS", extra_css=CSS, extra_head=FONTS_X, jsonld=ld,
             image=f"{URL}/assets/marks/newsstand.jpg",
             keywords=["THE MARKS", "NEW YORKERS by MLow", "instant reveal", "SuperRare", "dynamic NFT", "NYC art", "MLow"],
             scripts_after=f'<script type="application/json" id="marks-data">{DATA}</script>\n<script>{JS}</script>')
open(os.path.join(SITE, "marks.html"), "w", encoding="utf-8").write(page)
NPOST = sum(1 for t in track if t.startswith('<a class="post"'))
print(f"marks.html: {len(U)} uncounted, {len(C)} era closers, {len(LOOPS)} loops, {sum(1 for x in U if x['gl'])} glitch, "
      f"{NPOST} on the platform; list hash {LIST_HASH[:12]}")
