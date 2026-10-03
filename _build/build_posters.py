#!/usr/bin/env python3
"""posters.html: every poster, card and meme ChatGPT made for NEW YORKERS, on one wall.

Four kinds, each a filter:
  STREET POSTERS  the 80 one liner posters and the launch poster; they belong to the city, not a piece
  MOVIE POSTERS   one per piece, from piece_extras.json; each opens its census record
  CARDS           the Keystone Legendary cards (piece) and the honorary cards (person, opens h/<id>)
  MEMES           the piece memes, then the top 50 pack, which belongs to no piece
Piece work reuses the thumbs attach_piece_extras.py already made in assets/t. The rest is rendered here
into assets/posters as {slug}s.jpg (640 wide, the wall) and {slug}l.jpg (1600 long side, the lightbox).
Sources live in CHATGPT ART 2026-09-30 as APFS clones of ChatGPT's files. Skips what is current.
"""
import csv, json, os, re
from PIL import Image
from page_shell import shell, esc, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
ART = os.path.join(ROOT, "CHATGPT ART 2026-09-30")
OUT = os.path.join(SITE, "assets", "posters"); os.makedirs(OUT, exist_ok=True)
C = cfg(); URL = C["siteUrl"]


def render(src, slug):
    for tag, size in (("s", 640), ("l", 1600)):
        dst = os.path.join(OUT, f"{slug}{tag}.jpg")
        if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(src): continue
        im = Image.open(src).convert("RGB")
        if tag == "s": im.thumbnail((size, size * 3), Image.LANCZOS)
        else: im.thumbnail((size, size), Image.LANCZOS)
        im.save(dst, "JPEG", quality=82 if tag == "s" else 86, optimize=True, progressive=True)
    return f"assets/posters/{slug}s.jpg", f"assets/posters/{slug}l.jpg"


s = open(os.path.join(SITE, "assets", "data.js")).read()
DATA = json.loads(s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1])
byn = {p["n"]: p for p in DATA["pieces"] if p.get("n") is not None}
items = []

# street posters, in their own order, the launch poster first
heads = {int(k): v for k, v in json.load(open(os.path.join(ART, "street_posters", "headlines.json"))).items()}
sm, lg = render(os.path.join(ART, "street_posters", "LAUNCH-hero-poster.png"), "launch")
items.append({"k": "street", "s": sm, "l": lg, "t": "The city is watching.", "sub": "The launch poster"})
for f in sorted(os.listdir(os.path.join(ART, "street_posters"))):
    m = re.match(r"CLASSIC-new-yorkers-poster-(\d+)\.png$", f)
    if not m: continue
    n = int(m.group(1)); sm, lg = render(os.path.join(ART, "street_posters", f), f"street{n:02d}")
    items.append({"k": "street", "s": sm, "l": lg, "t": heads[n].capitalize() if heads[n].isupper() else heads[n], "sub": f"Street poster {n}"})

# piece work: posters, Keystone cards, memes, each tied to a census record
EX = json.load(open(os.path.join(HERE, "piece_extras.json")))["items"]
seen = set()
for kind, label in (("poster", "movie"), ("card", "card"), ("meme", "meme")):
    for p in sorted((p for p in DATA["pieces"] if p.get("fx")), key=lambda p: p["n"]):
        for f in p["fx"]:
            if f["t"] != kind: continue
            u = f"assets/t/{f['k']}.jpg"
            items.append({"k": label, "s": u, "l": u, "t": p["t"], "sub": f"NO. {p['n']:04d}" + (", Keystone Legendary" if kind == "card" else ""), "id": p["id"]})
            seen.add(f["k"])

# honorary cards, made by build_honor_cards.py from ChatGPT's canonical set
CG = json.load(open(os.path.join(HERE, "honoraries", "chatgpt_cards.json")))["people"]
CARDS = json.load(open(os.path.join(HERE, "honoraries", "cards.json")))
PEOPLE = {p["id"]: p for p in json.load(open(os.path.join(HERE, "honoraries", "honoraries.json")))["people"]}
for pid in sorted(CG, key=lambda i: CG[i]["card"]):
    if pid not in PEOPLE: continue
    u = f"assets/cards/{CARDS[pid]['card']}"
    items.append({"k": "card", "s": u, "l": u, "t": PEOPLE[pid]["name"], "sub": "Honorary New Yorker", "h": pid})

# the top 50 memes: no piece, just the city
for r in csv.DictReader(open(os.path.join(ART, "memes_top50", "catalog.csv"))):
    sm, lg = render(os.path.join(ART, "memes_top50", r["file"]), "meme" + os.path.splitext(r["file"])[0][:2])
    items.append({"k": "meme", "s": sm, "l": lg, "t": r["line_1"].capitalize(), "sub": r["line_2"].capitalize()})

# stale renders out
keep = {os.path.basename(i[x]) for i in items for x in ("s", "l") if i[x].startswith("assets/posters/")}
for f in os.listdir(OUT):
    if f.endswith(".jpg") and f not in keep: os.remove(os.path.join(OUT, f))

count = {k: sum(1 for i in items if i["k"] == k) for k in ("street", "movie", "card", "meme")}
TABS = [("all", "Everything", len(items)), ("street", "Street posters", count["street"]), ("movie", "Movie posters", count["movie"]),
        ("card", "Cards", count["card"]), ("meme", "Memes", count["meme"])]

body = f"""
<section class="wrap" style="padding-top:64px;padding-bottom:8px">
  <div class="kicker" style="color:var(--acid)">Off the wall</div>
  <h1 class="h-xl" style="margin-top:14px;max-width:1000px">Posters, cards and memes.</h1>
  <p class="lede" style="margin-top:16px;max-width:820px">The census, pasted up. Street posters for the whole city, a movie poster for a New Yorker, a card for a Keystone or an honoree, a meme for when the train is late. Tap any one to open it. The ones made from a painting take you to it.</p>
  <div class="ptabs" role="tablist">{"".join(f'<button type="button" role="tab" data-k="{k}" aria-selected="{"true" if k == "all" else "false"}">{esc(t)} <span>{n}</span></button>' for k, t, n in TABS)}</div>
</section>
<section class="wrap" style="padding-top:18px;padding-bottom:90px"><div class="pwall" id="pwall"></div></section>
<div class="plb" id="plb" hidden>
  <button type="button" class="px" aria-label="Close">×</button>
  <button type="button" class="pv pp" aria-label="Previous">‹</button>
  <figure><img id="plbImg" alt=""><figcaption><b id="plbT"></b><span id="plbS"></span><a id="plbA" class="btn" hidden></a></figcaption></figure>
  <button type="button" class="pv pn" aria-label="Next">›</button>
</div>
"""

css = """
.ptabs{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px}
.ptabs button{background:transparent;border:1px solid var(--divider);color:var(--cloud);font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;padding:9px 14px;border-radius:999px;cursor:pointer}
.ptabs button span{color:var(--slate);margin-left:6px}
.ptabs button[aria-selected=true]{background:var(--blue);border-color:var(--blue);color:#fff}
.ptabs button[aria-selected=true] span{color:#dfe7ff}
.ptabs button:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.pwall{columns:5 220px;column-gap:14px}
.pwall a{display:block;break-inside:avoid;margin:0 0 14px;border-radius:10px;overflow:hidden;border:1px solid var(--divider);background:var(--card);cursor:zoom-in;text-decoration:none}
.pwall img{display:block;width:100%;height:auto}
.pwall .cap{padding:9px 11px 11px;font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--slate)}
.pwall .cap b{display:block;font-family:var(--sans);font-size:13px;letter-spacing:0;text-transform:none;color:var(--cloud);font-weight:500;margin-bottom:3px}
.plb{position:fixed;inset:0;z-index:2147483600;background:rgba(8,8,10,.94);display:flex;align-items:center;justify-content:center;padding:24px 70px}
.plb[hidden]{display:none}
.plb figure{margin:0;display:flex;flex-direction:column;align-items:center;max-width:100%;max-height:100%}
.plb img{max-width:100%;max-height:calc(100vh - 190px);border-radius:10px;box-shadow:0 20px 80px rgba(0,0,0,.7)}
.plb figcaption{margin-top:14px;text-align:center;font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--slate);display:flex;flex-direction:column;align-items:center;gap:6px}
.plb figcaption b{font-family:var(--serif);font-size:22px;letter-spacing:0;text-transform:none;color:var(--cloud);font-weight:500}
.plb figcaption .btn{margin-top:6px}
.plb button.px,.plb button.pv{position:absolute;background:transparent;border:1px solid var(--divider);color:var(--cloud);border-radius:999px;width:44px;height:44px;font-size:22px;cursor:pointer}
.plb button.px{top:18px;right:18px}.plb button.pp{left:14px;top:50%}.plb button.pn{right:14px;top:50%}
@media (max-width:620px){.plb{padding:16px 10px 70px}.plb button.pp,.plb button.pn{top:auto;bottom:14px}.plb button.pp{left:calc(50% - 56px)}.plb button.pn{right:calc(50% - 56px)}.pwall{columns:2 150px;column-gap:10px}.pwall a{margin-bottom:10px}}
"""

js = """<script>
(function(){
var I=__ITEMS__, wall=document.getElementById('pwall'), lb=document.getElementById('plb'), cur=[], at=0, B=window.NY_BASE||'';
var KIND={street:'Street poster',movie:'Movie poster',card:'Card',meme:'Meme'};
function draw(k){
  cur=I.filter(function(x){return k==='all'||x.k===k;}); wall.innerHTML='';
  cur.forEach(function(x,i){
    var a=document.createElement('a'); a.href=B+x.l;
    a.innerHTML='<img loading="lazy" decoding="async" alt="">'+'<div class="cap"><b></b>'+KIND[x.k]+(x.sub?' · '+x.sub:'')+'</div>';
    a.querySelector('img').src=B+x.s; a.querySelector('img').alt=x.t+', '+KIND[x.k].toLowerCase(); a.querySelector('b').textContent=x.t;
    a.addEventListener('click',function(e){e.preventDefault();open(i);}); wall.appendChild(a);
  });
}
function open(i){
  at=(i+cur.length)%cur.length; var x=cur[at];
  document.getElementById('plbImg').src=B+x.l; document.getElementById('plbImg').alt=x.t;
  document.getElementById('plbT').textContent=x.t; document.getElementById('plbS').textContent=KIND[x.k]+(x.sub?' · '+x.sub:'');
  var A=document.getElementById('plbA');
  if(x.id){A.hidden=false;A.href=B+'census.html#n='+x.id;A.textContent='Open the painting';}
  else if(x.h){A.hidden=false;A.href=B+'h/'+x.h+'.html';A.textContent='The honoree';}
  else A.hidden=true;
  lb.hidden=false; document.body.style.overflow='hidden';
}
function close(){lb.hidden=true;document.body.style.overflow='';}
lb.querySelector('.px').onclick=close; lb.querySelector('.pp').onclick=function(){open(at-1);}; lb.querySelector('.pn').onclick=function(){open(at+1);};
lb.addEventListener('click',function(e){if(e.target===lb)close();});
document.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')close();else if(e.key==='ArrowLeft')open(at-1);else if(e.key==='ArrowRight')open(at+1);});
var tabs=document.querySelectorAll('.ptabs button');
function pick(k){tabs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.k===k?'true':'false');});draw(k);try{history.replaceState(null,'',k==='all'?location.pathname:'#'+k);}catch(e){}}
tabs.forEach(function(b){b.onclick=function(){pick(b.dataset.k);};});
var h=location.hash.slice(1); pick(['street','movie','card','meme'].indexOf(h)>=0?h:'all');
})();
</script>""".replace("__ITEMS__", json.dumps(items, ensure_ascii=False, separators=(",", ":")))

page = shell(title="Posters, cards and memes · NEW YORKERS by MLow",
             description=f"{len(items)} posters, trading cards and memes from NEW YORKERS by MLow: street posters for the city, a movie poster or a card for a New Yorker, memes for the commute.",
             body=body, path="posters.html", active="posters.html", extra_css=css, scripts_after=js,
             image=URL + "/" + items[0]["l"], keywords=["NEW YORKERS", "MLow", "posters", "trading cards", "memes", "New York City art"],
             jsonld={"@context": "https://schema.org", "@type": "CollectionPage", "name": "Posters, cards and memes", "url": URL + "/posters.html",
                     "creator": {"@type": "Person", "name": "MLow"}, "isPartOf": {"@id": URL + "/#collection"}})
open(os.path.join(SITE, "posters.html"), "w").write(page)
print(f"posters.html: {len(items)} on the wall ({', '.join(f'{v} {k}' for k, v in count.items())})")
