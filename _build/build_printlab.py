#!/usr/bin/env python3
"""printlab.html: THE PRINT LAB, every piece with its own print listing on mlow.nyc, flat on one page.

A darkroom after hours: the prints hang on drying lines under the safelight, one line per release. THE MARKS
(api/marks.json), KEYSTONE 111 (api/keystone_prints.json), the curator's NEW YORKERS and the honorary portraits
(api/piece_prints.json). Each print goes to its own product at the shop once its file says live; while a
release is still a draft its prints go to the record page's order box instead (the shared NEW YORKERS Print
product, piece number on the cart line), and honorary portraits without a live listing are left off.
The counter at the foot takes any census number, for every New Yorker that has no listing of its own.
Part of build_all.sh; ships via build_deploy.py.
"""
import json, os, html
from page_shell import shell, esc, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]
J = lambda *p: json.load(open(os.path.join(*p), encoding="utf-8"))
PP = J(HERE, "api", "piece_prints.json"); KS = J(HERE, "api", "keystone_prints.json"); MK = J(SITE, "api", "marks.json")
_d = open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read()
BYN = {p["n"]: p for p in json.loads(_d[_d.index("=") + 1:].rstrip().rstrip(";"))["pieces"] if p.get("n") is not None}
HON = {p["id"]: p for p in J(HERE, "honoraries", "honoraries.json")["people"]}
SHOP = PP["shop"]
NO = set(PP.get("noprint", []))  # never sold as prints (children in the picture)

def own(handle, live):
    return f"{SHOP}/products/{handle}" if handle and live else ""

def card(href, img, no, title, sub=""):
    ext = href.startswith("http")
    tgt = ' target="_blank" rel="noopener"' if ext else ""
    return (f'<a class="pl-print" href="{esc(href)}"{tgt}><span class="pin" aria-hidden="true"></span>'
            f'<img src="{esc(img)}" alt="{esc(title)}" loading="lazy" decoding="async">'
            f'<span class="pl-cap"><small>{esc(no)}</small><b>{esc(title)}</b>{f"<i>{esc(sub)}</i>" if sub else ""}</span></a>')

live = PP["status"] == "live"
marks = []
for x in MK["uncounted"] + MK["eraClosers"]:
    n = x["census"]; hd = PP["n"].get(str(n))
    if n in NO: continue
    href = own(hd, live) or f"n/{n}#orderbox"
    sub = f"Mark {x['mark']:03d}" if x.get("mark") else "Era closer"
    marks.append(card(href, f"assets/marks/th/{n}.jpg", f"NO. {n:04d}", x["title"], sub))

kslive = KS["status"] == "live"
keys = []
for p in sorted(KS["pieces"], key=lambda r: r["pos"]):
    if p["n"] in NO: continue
    href = own(p.get("handle"), kslive) or f"n/{p['sid']}#orderbox"
    keys.append(card(href, f"assets/keystone/{p['pos']}s.jpg", f"NO. {p['n']:04d}", p["t"]))

marks_n = {x["census"] for x in MK["uncounted"] + MK["eraClosers"]}
census = []
for k, hd in PP["n"].items():
    n = int(k)
    if n in marks_n or n not in BYN or n in NO: continue
    p = BYN[n]
    census.append(card(own(hd, live) or f"n/{p['id']}#orderbox", f"assets/t/{p['st'][0]}.jpg", f"NO. {n:04d}", p["t"], p.get("b") or ""))

hons = []
for hid, works in PP["h"].items():
    p = HON.get(hid)
    if not p: continue
    for w in p["works"]:
        href = own(works.get(w.get("title") or ""), live)
        if href: hons.append(card(href, f"assets/honoraries/{w['s']}", "HONORARY", w.get("title") or p["name"], p["name"]))

def line(id_, kicker, title, blurb, cards, coll):
    more = f'<a class="btn ghost sm" href="{SHOP}/collections/{coll}" target="_blank" rel="noopener">The whole line at the shop</a>' if coll else ""
    return (f'<section class="wrap pl-line" id="{id_}"><div class="pl-head"><div><div class="kicker">{kicker}</div>'
            f'<h2 class="h-lg">{title}</h2><p class="body">{blurb}</p></div>{more}</div>'
            f'<div class="pl-wire"></div><div class="pl-grid">{"".join(cards)}</div></section>')

nm, nk, nc, nh = len(marks), len(keys), len(census), len(hons)
body = f"""
<section class="wrap pl-top">
  <div class="kicker" style="color:var(--pink)">After hours · the safelight is on</div>
  <h1 class="h-xl">THE PRINT LAB</h1>
  <p class="lede">Every NEW YORKER that has its own print, hung up to dry. Pick one off the line and it opens at the print shop, where you choose the size and the surface. Printed and signed by MLow in New York. A print does not include a token.</p>
  <nav class="pl-jump"><a class="btn" href="#marks">THE MARKS · {nm}</a><a class="btn" href="#keystone">KEYSTONE 111 · {nk}</a>{f'<a class="btn" href="#census">NEW YORKERS · {nc}</a>' if nc else ''}{f'<a class="btn" href="#honorary">HONORARY · {nh}</a>' if nh else ''}<a class="btn pink" href="#counter">Any New Yorker</a></nav>
</section>
{line("marks", "Line one", "THE MARKS", "The uncounted, painted and numbered and left off the census, and the nine era closers.", marks, "the-marks")}
{line("keystone", "Line two", "KEYSTONE 111", "The founding works of NEW YORKERS.", keys, "keystone-111")}
{line("census", "Line three", "NEW YORKERS", "The curator's picks from the whole census.", census, "new-yorkers") if nc else ""}
{line("honorary", "Line four", "HONORARY NEW YORKERS", "Gift portraits of artists, collectors and guests of The MLow Show.", hons, "honorary-new-yorkers") if nh else ""}
<section class="wrap pl-counter" id="counter">
  <div class="kicker">The counter</div>
  <h2 class="h-lg">Any New Yorker, by number.</h2>
  <p class="body">Every one of the census can be printed. Give the counter its number and it opens that New Yorker's record with the order box. Hold some already? <a href="my">My NEW YORKERS</a> lists yours, each with a print button.</p>
  <form id="plForm" class="pl-form"><label>Census number<input id="plN" type="number" min="1" inputmode="numeric" placeholder="556" required></label><button class="btn pink" type="submit">Find the print</button></form>
  <p class="body" id="plMsg" hidden></p>
</section>"""

css = """
.pl-top{padding-top:64px;padding-bottom:6px;position:relative}
.pl-top:before{content:"";position:absolute;inset:-40px 0 auto;height:420px;pointer-events:none;background:radial-gradient(ellipse at 50% 0,rgba(255,40,60,.16),transparent 70%)}
.pl-top .lede{margin-top:18px;max-width:820px}
.pl-jump{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.pl-line{padding-top:46px;padding-bottom:8px}
.pl-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap}
.pl-head .body{color:var(--slate);margin-top:8px;max-width:640px}
.pl-wire{height:2px;margin:26px 0 0;background:linear-gradient(90deg,transparent,var(--slate) 6%,var(--slate) 94%,transparent);opacity:.55}
.pl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:30px 18px;padding-top:4px}
.pl-print{position:relative;display:block;text-decoration:none;color:var(--cloud);background:#f4efe4;padding:8px 8px 0;border-radius:2px;box-shadow:0 10px 24px rgba(0,0,0,.45);transform:rotate(var(--r,0deg));transition:transform .25s ease,box-shadow .25s ease}
.pl-print:nth-child(3n){--r:-.8deg}.pl-print:nth-child(3n+1){--r:.6deg}.pl-print:nth-child(5n){--r:1.1deg}
.pl-print:hover,.pl-print:focus-visible{transform:rotate(0) translateY(-4px);box-shadow:0 18px 34px rgba(0,0,0,.55)}
.pl-print .pin{position:absolute;top:-12px;left:50%;width:14px;height:22px;margin-left:-7px;border-radius:3px;background:var(--pink);box-shadow:0 2px 4px rgba(0,0,0,.4)}
.pl-print img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;background:#111}
.pl-cap{display:flex;flex-direction:column;gap:3px;padding:9px 4px 11px;color:#14110d}
.pl-cap small{font-family:var(--mono);font-size:9.5px;letter-spacing:.22em;color:#6b6257}
.pl-cap b{font-family:var(--serif);font-size:16px;line-height:1.2;font-weight:600}
.pl-cap i{font-style:normal;font-family:var(--sans);font-size:12px;color:#6b6257}
.pl-counter{padding-top:60px;padding-bottom:90px}
.pl-counter .body{color:var(--slate);margin-top:10px;max-width:720px}
.pl-form{display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-top:20px}
.pl-form label{display:flex;flex-direction:column;gap:6px;font-family:var(--mono);font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--slate)}
.pl-form input{background:var(--ink);border:1px solid var(--divider);color:var(--cloud);font-family:var(--sans);font-size:16px;padding:11px 12px;border-radius:7px;width:180px}
@media (max-width:620px){.pl-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 12px}.pl-cap b{font-size:14px}}
"""

js = """<script>
(function(){var f=document.getElementById("plForm"),m=document.getElementById("plMsg");
 f.addEventListener("submit",function(e){e.preventDefault();var n=parseInt(document.getElementById("plN").value,10);
  if(!(n>0)){m.hidden=false;m.textContent="That is not a census number.";return;}
  location.href="n/"+n+"#orderbox";});})();
</script>"""

page = shell(title="THE PRINT LAB · prints of NEW YORKERS by MLow", path="printlab.html", active="PRINT LAB",
             description="Every NEW YORKERS print in one place: THE MARKS, KEYSTONE 111, the curator's picks and the honorary portraits, made to order and signed by MLow.",
             body=body, extra_css=css, scripts_after=js,
             jsonld={"@context": "https://schema.org", "@type": "CollectionPage", "name": "THE PRINT LAB", "url": URL + "/printlab.html",
                     "description": "Prints of NEW YORKERS by MLow: THE MARKS, KEYSTONE 111, the curator's picks and the honorary portraits.",
                     "creator": {"@type": "Person", "name": "MLow"}},
             keywords=["NEW YORKERS prints", "THE MARKS", "KEYSTONE 111", "MLow", "art prints", "print shop"])
open(os.path.join(SITE, "printlab.html"), "w", encoding="utf-8").write(page)
print(f"printlab.html: {nm} marks, {nk} keystone, {nc} curated, {nh} honorary · piece prints {PP['status']}, keystone {KS['status']}")
