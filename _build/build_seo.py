#!/usr/bin/env python3
"""SEO and GEO for the census site. Idempotent; rerun after any page or data change.
- Injects a <!-- seo --> block into the eight hand written pages: canonical, keywords, robots, og:site_name, JSON-LD, llms alternate,
  and rewrites every og:url and og:image host to config.siteUrl. Adds assets/eggs.js and assets/mint.js before </body> if missing.
- Writes sitemap.xml, robots.txt, llms.txt, llms-full.txt, humans.txt, agents.html, pigeon.html,
  api/census.json, api/rooms.json, api/articles.json, api/pieces.json, api/eras.json, and n/<id>.html for every public piece.
Reads assets/data.js, _build/rooms_full.json, _build/learn/articles_*.json. Run after build_learn.py."""
import json, os, re, glob, datetime, html
from page_shell import shell, esc, no_dash, cfg, pub, pub_deep
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]; TODAY = datetime.date.today().isoformat()
d = open(os.path.join(SITE, "assets", "data.js")).read(); D = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
P = [p for p in D["pieces"]]; S = D["story"]; K = D["counts"]
rooms = json.load(open(os.path.join(HERE, "rooms_full.json")))
articles = []
for f in sorted(glob.glob(os.path.join(HERE, "learn", "articles_*.json"))): articles += json.load(open(f, encoding="utf-8"))
ERAS = S["eras"]
fams = sorted(set(p["f"] for p in P if p.get("f")))
boros = {}
for p in P:
    b = (p.get("b") or "Citywide").split(" (")[0]; boros[b] = boros.get(b, 0) + 1
num = lambda n: f"{n:,}"
# Every host this site has ever canonicalised to. The head rewrite below maps all of them to the current
# siteUrl, so moving the site is a one line config change plus a rebuild.
OLD_HOSTS = ["https://new-yorkers.pages.dev", "https://newyorkers.mlow.xyz", "https://n3wyorkers.com", "https://www.n3wyorkers.com"]
ORG = {"@type": "Organization", "@id": URL + "/#org", "name": "NEW YORKERS by MLow", "url": URL + "/", "logo": f"{URL}/assets/brand/eye_truecolor.png", "sameAs": ["https://mlow.xyz", C.get("printsUrl") or "https://mlow.nyc", "https://x.com/degens", "https://www.instagram.com/0xmlow", "https://www.tiktok.com/@0xmlow"], "founder": {"@type": "Person", "name": "MLow", "url": "https://mlow.xyz"}}
SITE_LD = {"@context": "https://schema.org", "@type": "WebSite", "@id": URL + "/#site", "name": "NEW YORKERS by MLow", "alternateName": "NEW YORKERS", "url": URL + "/", "description": f"A living painted census of New York City: {num(K['pieces'])} characters across {K['eras']} eras, every one with a story and a place, a walkable museum of {len(rooms)} New York rooms, and a sourced reading room.", "publisher": {"@id": URL + "/#org"}, "inLanguage": "en-US"}
COLLECTION_LD = {"@context": "https://schema.org", "@type": "Collection", "@id": URL + "/#collection", "name": "NEW YORKERS", "creator": {"@type": "Person", "name": "MLow"}, "url": f"{URL}/census", "size": K["pieces"], "description": "Every New Yorker gets a portrait. Even the villains. A painted census of New York City as dynamic tokens on OpenSea and Transient Labs.", "keywords": "NEW YORKERS, MLow, New York City art, painted census, NFT, dynamic NFT, ERC-7160, NYC portraits, eye flower"}
BASE_KW = ["NEW YORKERS by MLow", "MLow", "New York City art", "painted census of New York", "NYC portraits", "dynamic NFT", "New York NFT collection 2026", "virtual museum of New York", "New York City history"]

PAGES = {
 "index.html": dict(desc=f"A living painted census of New York City by MLow: {num(K['pieces'])} characters across {K['eras']} eras, every one with a story and a place on the atlas, a walkable museum of {len(rooms)} New York rooms, and a sourced reading room. Every New Yorker gets a portrait. Even the villains.", kw=BASE_KW + ["get counted", "NYC census art project", "NFT NYC 2026"], ld=[SITE_LD, {"@context": "https://schema.org", **ORG}, COLLECTION_LD]),
 "census.html": dict(desc=f"The interactive census: {num(K['pieces'])} painted New Yorkers in five 3D formations, a gallery with filters, a story for every record, loops, films and the Still Waiting glitch editions.", kw=BASE_KW + ["3D gallery", "NYC character archive", "MLow census"], ld=[{"@context": "https://schema.org", "@type": "CollectionPage", "name": "The Census · NEW YORKERS by MLow", "url": f"{URL}/census", "isPartOf": {"@id": URL + "/#site"}, "about": {"@id": URL + "/#collection"}}]),
 "new-rooms.html": dict(desc=f"{len([r for r in rooms if r.get('index', 0) >= 112])} rooms added to THE MUSEUM after the first 111, newest first: the Hall of Fame of the honoraries, the arrival, the Crystal Palace, Penn Station as it stood, and every room since, each hung with painted New Yorkers.", kw=BASE_KW + ["virtual museum rooms", "NYC working spaces", "3D gallery of New York"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "@id": URL + "/new-rooms", "name": "The new rooms", "url": URL + "/new-rooms", "isPartOf": {"@id": URL + "/#site"}, "description": "The 25 rooms added to THE MUSEUM after the first 111, hung with painted New Yorkers."}]),
 "map.html": dict(desc=f"The Atlas: every one of the {num(K['pieces'])} painted New Yorkers placed on a map of the five boroughs, by landmark, block, neighborhood and subway line, with scenes, eras and families as layers.", kw=BASE_KW + ["map of New York characters", "NYC neighborhoods map art", "five boroughs atlas"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "The Atlas · NEW YORKERS by MLow", "url": f"{URL}/map", "isPartOf": {"@id": URL + "/#site"}, "about": {"@type": "City", "name": "New York City"}}]),
 "museum.html": dict(desc=f"THE MUSEUM: {len(rooms)} walkable 3D rooms of New York, from the Bowery to the Guggenheim ramp to the crown of the Statue, hung with {num(K['pieces'])} painted New Yorkers. The light follows the New York clock. Spin the slot machine for a random room.", kw=BASE_KW + ["walkable 3D museum", "Three.js gallery New York", "virtual gallery NYC landmarks", "Guggenheim virtual tour art"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "The Museum · NEW YORKERS by MLow", "url": f"{URL}/museum", "isPartOf": {"@id": URL + "/#site"}, "mainEntity": {"@type": "ItemList", "name": f"{len(rooms)} rooms", "numberOfItems": len(rooms), "itemListElement": [{"@type": "ListItem", "position": r["index"], "name": r["name"], "url": f"{URL}/rooms/{r['id']}.html"} for r in rooms]}}]),
 "keystone.html": dict(desc="KEYSTONE 111: the 111 founding NEW YORKERS, from the Era I leads to the Mythos spine and the threads, hung along one continuous spiral ramp. Drag to travel, click a piece to step up to it, open its record in the census.", kw=BASE_KW + ["Keystone 111", "founding New Yorkers", "3D spiral gallery", "Three.js art gallery"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "@id": URL + "/keystone", "name": "Keystone 111 · NEW YORKERS by MLow", "url": URL + "/keystone", "isPartOf": {"@id": URL + "/#site"}, "description": "The 111 founding NEW YORKERS hung along one continuous spiral ramp."}]),
 "count.html": dict(desc="THE COUNT: THE CENSUS RELEASE is minting now on OpenSea. The clock to the close, and the live census number.", kw=BASE_KW + ["NEW YORKERS mint", "THE CENSUS RELEASE", "THE CLAIM"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "The Count · NEW YORKERS by MLow", "url": f"{URL}/count", "isPartOf": {"@id": URL + "/#site"}}]),
 "counted.html": dict(desc="GET COUNTED: six questions, no wallet, and the city assigns you the New Yorker it thinks you are. Download your Resident card, mint THE CENSUS RELEASE on OpenSea, or nominate a New Yorker to be painted.", kw=BASE_KW + ["which New Yorker are you quiz", "NYC personality quiz", "nominate a New Yorker"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "Get Counted · NEW YORKERS by MLow", "url": f"{URL}/counted", "isPartOf": {"@id": URL + "/#site"}}]),
 "shipping.html": dict(desc="Estimate what it costs to ship a print from New York City anywhere in the world, including sales tax, import duty and VAT. An estimate, not a quote.", kw=BASE_KW + ["art print shipping cost", "international art shipping duty", "import VAT on art prints"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "Shipping, duty and tax", "url": f"{URL}/shipping", "isPartOf": {"@id": URL + "/#site"}, "description": "An estimator for shipping cost, sales tax and import duty on art prints sent worldwide from New York City."}]),
 # The vault is an anti hunt (build_vault.py): there is no prize. Every description here has to say so,
 # because this block overwrites what build_vault.py wrote, and for a while it put the prize back.
 "vault.html": dict(desc="A rumour the city started about itself. There is no prize, no key and no winner. Every answer is wrong on purpose. Keep looking anyway.", kw=BASE_KW + ["internet puzzle joke", "the vault", "unsolvable puzzle"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "The Vault", "url": f"{URL}/vault", "isPartOf": {"@id": URL + "/#site"}, "description": "A rumour the city started about itself. There is no prize, no key and no winner. Every answer is wrong on purpose. Keep looking anyway.", "publisher": {"@id": URL + "/#org"}}]),
 "faq.html": dict(desc="Everything about NEW YORKERS by MLow, answered: the idea, the lore, the eras and sets, the traits, how the release works, and what you actually own.", kw=BASE_KW + ["NEW YORKERS FAQ", "what is NEW YORKERS", "NEW YORKERS lore", "NEW YORKERS traits", "how to get counted"], ld=[]),
 "brand.html": dict(desc="The NEW YORKERS brand kit: the marks, the palette, the type, the one liners, the rules and the boilerplate, with files to download. Everything needed to write about or build with the census.", kw=BASE_KW + ["brand kit", "MLow logo", "brand guidelines"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "Brand · NEW YORKERS by MLow", "url": f"{URL}/brand", "isPartOf": {"@id": URL + "/#site"}, "publisher": {"@id": URL + "/#org"}}]),
 "press.html": dict(desc="Press room for NEW YORKERS by MLow: the fact sheet, four angles for four desks, the image sheet with press approved files, and contact.", kw=BASE_KW + ["press kit", "art press release New York"], ld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "Press Room · NEW YORKERS by MLow", "url": f"{URL}/press", "isPartOf": {"@id": URL + "/#site"}, "publisher": {"@id": URL + "/#org"}}]),
}
# The films on the home page (HLS, wired up in script) and the press reel (plain <video src>), as VideoObject on their
# page and as video entries in the sitemap. Press clips are read off press.html, so a new reel clip needs no edit here.
def hls_secs(d):
    try: return round(sum(float(x) for x in re.findall(r"#EXTINF:([\d.]+)", open(os.path.join(SITE, d, "720", "index.m3u8")).read())))
    except OSError: return None
def _fdate(rel):
    try: return datetime.date.fromtimestamp(os.path.getmtime(os.path.join(SITE, rel))).isoformat()
    except OSError: return TODAY
PAGE_VIDEOS = {"index.html": [
    {"name": "THE CITY IS THE ART, a film by MLow", "desc": "THE CITY IS THE ART, a film by MLow about NEW YORKERS, a living painted census of New York City.", "thumb": "assets/film/city-is-the-art/poster.jpg", "src": "assets/film/city-is-the-art/master.m3u8", "sec": hls_secs("assets/film/city-is-the-art")},
    {"name": "THE HONORARIES, a film of room 183, the Hall of Fame, by MLow", "desc": "A walk through room 183 of the NEW YORKERS museum, the Hall of Fame, where every honorary portrait MLow has painted hangs in one rotunda.", "thumb": "assets/film/hall-of-fame/home-poster.jpg", "src": "assets/film/hall-of-fame/master.m3u8", "sec": hls_secs("assets/film/hall-of-fame")}],
    "press.html": [{"name": no_dash(html.unescape(a)), "desc": no_dash(html.unescape(a)) + ". From the press reel of MLow, the artist behind NEW YORKERS.", "thumb": t, "src": s, "sec": None}
                   for s, t, a in re.findall(r'<video src="([^"]+\.mp4)" poster="([^"]+)"[^>]*aria-label="([^"]+)"', open(os.path.join(SITE, "press.html"), encoding="utf-8").read())]}
for _pg, _vs in PAGE_VIDEOS.items():
    for v in _vs: v["date"] = _fdate(v["src"])
    _page = URL + "/" if _pg == "index.html" else pub(f"{URL}/{_pg}")
    PAGES[_pg]["ld"] = PAGES[_pg]["ld"] + [dict({"@context": "https://schema.org", "@type": "VideoObject", "name": v["name"], "description": v["desc"], "thumbnailUrl": f"{URL}/{v['thumb']}", "contentUrl": f"{URL}/{v['src']}", "embedUrl": _page, "uploadDate": v["date"], "creator": {"@type": "Person", "name": "MLow"}}, **({"duration": f"PT{v['sec']}S"} if v["sec"] else {})) for v in _vs]
for pg, m in PAGES.items():
    path = os.path.join(SITE, pg); s = open(path, encoding="utf-8").read()
    for h in OLD_HOSTS:
        if h != URL: s = s.replace(h, URL)
    if 'name="description"' in s: s = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(m["desc"])}">', s, count=1)
    else: s = s.replace("</title>", f'</title>\n<meta name="description" content="{esc(m["desc"])}">', 1)
    if 'property="og:title"' not in s:
        t = re.search(r"<title>([^<]*)</title>", s).group(1)
        s = s.replace("</title>", f'</title>\n<meta property="og:type" content="website">\n<meta property="og:title" content="{esc(t)}">\n<meta property="og:description" content="{esc(m["desc"][:200])}">\n<meta property="og:image" content="{URL}/og.jpg?v=8429465c33">\n<meta property="og:url" content="{pub(f"{URL}/{pg}")}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:site" content="@degens">', 1)
    s = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{esc(m["desc"][:200])}">', s, count=1)
    canon = URL + "/" if pg == "index.html" else pub(f"{URL}/{pg}")
    block = ('<!-- seo -->\n' + f'<link rel="canonical" href="{canon}">\n<meta name="keywords" content="{esc(", ".join(m["kw"]))}">\n<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">\n<meta property="og:site_name" content="NEW YORKERS by MLow">\n<link rel="alternate" type="text/plain" title="llms.txt" href="llms.txt">\n<link rel="alternate" type="application/json" title="census api" href="api/census.json">\n'
             + "".join(f'<script type="application/ld+json">{json.dumps(pub_deep(j), ensure_ascii=False, separators=(",", ":"))}</script>\n' for j in m["ld"]) + '<!-- /seo -->')
    if "<!-- seo -->" in s: s = re.sub(r'<!-- seo -->[\s\S]*?<!-- /seo -->', lambda _: block, s, count=1)
    else: s = s.replace("</head>", block + "\n</head>", 1)
    if "assets/eggs.js" not in s: s = s.replace("</body>", '<script src="assets/eggs.js" defer></script>\n</body>', 1)
    if "assets/mint.js" not in s: s = s.replace("</body>", '<script src="assets/mint.js" defer></script>\n</body>', 1)
    open(path, "w", encoding="utf-8").write(s)
print("seo blocks injected into", len(PAGES), "pages")

# ---------- api ----------
api = os.path.join(SITE, "api"); os.makedirs(api, exist_ok=True)
# The JSON API is what AI crawlers read. Its urls go through pub() too, so an agent that
# follows one lands on a 200 instead of a redirect.
def dump(name, obj): json.dump(pub_deep(obj), open(os.path.join(api, name), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
eras_api = [{"i": e["i"], "roman": e["roman"], "title": e["title"], "sub": e.get("sub"), "description": e.get("desc"), "range": e["range"], "count": S.get("eraCounts", {}).get(str(e["i"]))} for e in ERAS]
# What is for sale comes from _build/releases.json, the one file allowed to say so (AGENTS.md). The data.js
# story block has its own "drop" text and it went stale the day the mint opened, so it is not used here.
REL = json.load(open(os.path.join(HERE, "releases.json"), encoding="utf-8"))
_rel = {r["id"]: r for r in REL["releases"]}
DROP = {"headline": "THE CENSUS RELEASE is minting now on OpenSea, 1,111 at 0.0042 ETH, until October 23, 2026, 11:11 AM ET. KEYSTONE, the founding New Yorkers, is open on Transient Labs.",
        "body": REL["promise"],
        "census": (S.get("drop") or {}).get("census"),
        "releases": [{"id": r["id"], "name": r["name"], "status": r.get("status"), "count": r.get("count"), "countIsOpen": r.get("countIsOpen", False), "platform": r.get("platform"), "price": r.get("price"), "when": r.get("when"), "url": r.get("url"), "onChainNote": r.get("onChainNote")} for r in REL["releases"]],
        "note": REL.get("note")}
census = {"name": "NEW YORKERS by MLow", "url": URL + "/", "built": TODAY, "license": "Text and data on this endpoint may be quoted with attribution to NEW YORKERS by MLow. Images are copyright MLow; press use per press.html.", "oneLine": S.get("oneLine"), "thesis": S.get("thesis"), "counts": K, "eras": eras_api, "families": [{"name": f, "count": sum(1 for p in P if p.get("f") == f)} for f in fams], "boroughs": [{"name": b, "count": n} for b, n in sorted(boros.items(), key=lambda x: -x[1])], "sets": len(S.get("sets", [])), "monuments": len(S.get("milestones", [])), "museumRooms": len(rooms), "articles": len(articles), "drop": DROP, "artist": S.get("artist"), "endpoints": {"pieces": f"{URL}/api/pieces.json", "eras": f"{URL}/api/eras.json", "rooms": f"{URL}/api/rooms.json", "articles": f"{URL}/api/articles.json", "llms": f"{URL}/llms.txt", "llmsFull": f"{URL}/llms-full.txt", "sitemap": f"{URL}/sitemap.xml"}, "contact": "https://x.com/degens"}
dump("census.json", census); dump("eras.json", eras_api); dump("rooms.json", [{**r, "url": f"{URL}/rooms/{r['id']}.html", "enter": f"{URL}/museum#room={r['id']}", "image": f"{URL}/assets/museum/rooms/{r['id']}.jpg"} for r in rooms])
dump("articles.json", [{**a, "url": f"{URL}/learn/{a['slug']}.html"} for a in articles])
dump("pieces.json", [{"id": p["id"], "n": p.get("n"), "title": p["t"], "family": p.get("f"), "borough": p.get("b"), "era": p.get("e"), "category": p.get("cat"), "set": p.get("set"), "location": p.get("loc"), "neighborhood": p.get("nb"), "story": p.get("story"), "states": len(p.get("st") or []), "glitchEdition": bool(p.get("gl")), "image": f"{URL}/assets/t/{p['st'][0]}.jpg" if p.get("st") else None, "url": f"{URL}/n/{p['id']}.html", "record": f"{URL}/census#n={p['id']}", "atlas": f"{URL}/map#p={p['id']}"} for p in P])
# api/index.json and api/index.html: the front door of the API. Several of these files are written by other
# builders (build_collectors, build_daily, build_changes, build_mosaic, the mint and keystone builders); they
# are listed here regardless, because an agent that finds /api/ should see the whole shelf, not this file's part.
INDEX_EP = {**census["endpoints"], "census": f"{URL}/api/census.json", "collectors": f"{URL}/api/collectors.json", "daily": f"{URL}/api/daily.json",
            "changes": f"{URL}/api/changes.json", "mosaic": f"{URL}/api/mosaic.json", "mint": f"{URL}/api/mint.json", "minted": f"{URL}/api/minted.json",
            "keystone": f"{URL}/api/keystone.json", "arcade": f"{URL}/api/arcade.json", "collector": f"{URL}/api/c/<wallet>.json", "hit": f"{URL}/api/hit"}
INDEX_DESC = {"census": "The summary: counts, eras, families, boroughs, the releases, the artist, every other endpoint.",
              "pieces": f"Every public piece, {num(len(P))} records: id, number, title, family, borough, era, location, story, image and urls.",
              "eras": "The nineteen eras with their ranges and counts.", "rooms": f"The {len(rooms)} museum rooms with their sourced history and a deep link into each.",
              "articles": f"The {len(articles)} reading room articles with summaries.", "collectors": "The leaderboard: who holds the city, from the chain.",
              "daily": "The New Yorker of the day, a year ahead.", "changes": "When each room and honoree arrived, for since your last visit.",
              "mosaic": "The mosaic tiles, with the minted ones marked live from the chain.", "mint": "THE CENSUS RELEASE mint state.",
              "minted": "Which census numbers are minted.", "keystone": "KEYSTONE on chain: what has been released so far.",
              "arcade": "The arcade games.", "collector": "One collector's New Yorkers by wallet.",
              "hit": "POST only. Anonymous first party hits (functions/api/hit.js). Not a feed.",
              "llms": "llms.txt, the site in plain text for language models.", "llmsFull": "llms-full.txt, with the full text of the reading room.",
              "sitemap": "The sitemap, extensionless urls only."}
json.dump({"name": "NEW YORKERS by MLow, the API", "url": f"{URL}/api/", "built": TODAY, "license": census["license"], "contact": "https://x.com/degens",
           "endpoints": INDEX_EP, "describe": INDEX_DESC}, open(os.path.join(api, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
_rows = "".join(f'<tr><td>{esc(k)}</td><td><a href="{esc(u.replace(URL + "/", "../"))}">{esc(u)}</a><br><span class="d">{esc(INDEX_DESC.get(k, ""))}</span></td></tr>' for k, u in INDEX_EP.items())
_body = f"""
<section class="wrap" style="padding-top:72px;padding-bottom:80px"><div class="article" style="margin:0;max-width:860px">
  <div class="kicker">The API</div>
  <h1 class="h-xl" style="margin-top:16px;font-size:clamp(40px,6vw,88px)">Static JSON, no key.</h1>
  <p class="lede" style="margin-top:20px;color:var(--slate)">Every endpoint is a flat file rebuilt with the site, cached for an hour, open to any origin. Quote it with attribution to NEW YORKERS by MLow. The long form is <a href="../agents">the page for bots and agents</a>.</p>
  <table class="rec">{_rows}</table>
  <p class="body" style="margin-top:22px;font-size:14px">Machine readable copy of this list: <a href="index.json">api/index.json</a>.</p>
</div></section>"""
open(os.path.join(api, "index.html"), "w", encoding="utf-8").write(shell(title="The API · NEW YORKERS by MLow", description="Every public endpoint of NEW YORKERS by MLow, one line each: the census, the pieces, the eras, the rooms, the collectors, the mosaic, the mint.", body=_body, base="../", path="api/index.html", active=None,
    jsonld=[{"@context": "https://schema.org", "@type": "WebAPI", "name": "NEW YORKERS by MLow API", "url": f"{URL}/api/", "documentation": f"{URL}/agents", "provider": ORG}], keywords=["NEW YORKERS by MLow API", "census JSON", "MLow data"],
    extra_css=".article h2{margin-top:44px}.rec{width:100%;border-collapse:collapse;font-family:var(--sans);font-size:15px;margin-top:28px}.rec td{padding:12px 0;border-bottom:1px solid var(--divider);vertical-align:top;line-height:1.55}.rec td:first-child{font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--slate);width:150px;padding-top:15px}.rec a{color:var(--cyan);word-break:break-all}.rec .d{color:var(--slate);font-size:13px}"))
print("api written, plus api/index.json and api/index.html")

# ---------- piece pages ----------
# One Shopify product covers every piece. The specific New Yorker rides along as a line item
# property on the cart permalink, so the lab and the packing slip both name it.
PRINT_JS = """
(function(){
 var P=window.NY_PRINTS; if(!P||P.status!=="live") return;      // hidden until the product is published
 var box=document.getElementById("orderbox"); if(!box) return;
 box.hidden=false;
 // The box is hidden while the page parses, so a link to #orderbox (the museum and the Keystone wall
 // send buyers here) finds nothing to scroll to. Scroll once it exists, and again after images settle.
 if(location.hash==="#orderbox"){ box.scrollIntoView({block:"center"}); window.addEventListener("load",function(){ box.scrollIntoView({block:"center"}); }); }
 var sz=document.getElementById("oSize"), fm=document.getElementById("oFmt");
 sz.innerHTML=P.sizes.map(function(s){return '<option>'+s+'</option>'}).join("");
 fm.innerHTML=P.formats.map(function(f){return '<option>'+f+'</option>'}).join("");
 function upd(){
   var v=P.variants[sz.value+"|"+fm.value];
   if(!v){ document.getElementById("oPrice").textContent="-"; return; }
   document.getElementById("oPrice").textContent="$"+v.price.toLocaleString("en-US");
   // /cart/add carries a real line item property. The /cart/{id}:{qty} permalink
   // returns 422 for properties[] and would lose the piece number. Do not swap it.
   document.getElementById("oBuy").href=P.shop+"/cart/add?id="+v.id+"&quantity=1&properties%5BPiece%5D="+encodeURIComponent(__PIECE__);
 }
 sz.onchange=fm.onchange=upd; upd();
})();
"""


def canal_html(p, base):
    """Canal Street: the replaced original under a misspelled name, plus any bootleg takes. Shown below the real piece, never instead of it."""
    cs = p.get("cs")
    if not cs: return ""
    keys = [cs["k"]] + list(cs.get("x") or [])
    tiles = "".join(f'<figure class="cs"><img src="{base}assets/t/{k}.jpg" alt="{esc(cs["name"])}" loading="lazy"><figcaption>{"THE KNOCKOFF" if i == 0 else "BOOTLEG " + str(i)}</figcaption></figure>' for i, k in enumerate(keys))
    return f'<div class="canal"><div class="kicker" style="font-size:10px">Canal Street</div><h2>{esc(cs["name"])}</h2><p>The knockoff. Same corner, wrong face. The real one is above.</p><div class="csgrid">{tiles}</div></div>'
def fx_html(p, base):
    """ChatGPT's posters, cards and memes of this piece (p.fx, attach_piece_extras.py). Below the real piece, never instead of it."""
    fx = p.get("fx")
    if not fx: return ""
    name = {"poster": "THE POSTER", "card": "THE CARD", "meme": "THE MEME"}
    tiles = "".join(f'<figure class="cs"><a href="{base}assets/t/{f["k"]}.jpg"><img src="{base}assets/t/{f["k"]}.jpg" alt="{esc(p["t"])}, {name[f["t"]].lower()[4:]}" loading="lazy"></a><figcaption>{name[f["t"]]}</figcaption></figure>' for f in fx)
    return f'<div class="canal"><div class="kicker" style="font-size:10px">Off the wall</div><h2>Posters, cards and memes</h2><p>{esc(p["t"])}, taken somewhere else. The painting is above.</p><div class="csgrid">{tiles}</div></div>'
# SAVE AND POST card (assets/save.js). A minted or stated census token gets its real states from IPFS, the same
# files its NFT viewer uses (CENSUS RELEASE 2026-09-23/_build/states.py site writes token_states.json). Any other
# piece gets what the site itself serves: the painting, its motion clips and its glitch loop.
_TS_PATH = os.path.join(SITE, "_build", "tokens", "token_states.json")
TOKSTATES = json.load(open(_TS_PATH)) if os.path.exists(_TS_PATH) else {}
SAVE_GW = ["https://gateway.pinata.cloud", "https://ipfs.filebase.io", "https://ipfs.raribleuserdata.com"]
def save_data(p, base):
    t = TOKSTATES.get(str(p["n"]))
    if t:
        s = [dict({"k": x["k"], "ext": x["ext"], "u": [g + "/ipfs/" + x["cid"] for g in SAVE_GW]}, **({"sub": no_dash(x["sub"])} if x.get("sub") else {})) for x in t["s"]]
    else:
        s = [{"k": "PAINTED", "ext": "jpg", "u": [f"{base}assets/t/{p['st'][0]}.jpg"]}]
        for m in p.get("mv") or []:
            s.append({"k": "MOTION", "ext": "mp4", "u": [base + m["mp4"]]})
        if p.get("gl") and p["gl"].get("mp4"):
            s.append({"k": "GLITCH", "ext": "mp4", "u": [base + p["gl"]["mp4"]], "sub": p["gl"].get("fam") or ""})
    return {"n": p["n"], "name": p["t"], "page": pub(f"{URL}/n/{p['id']}.html"), "s": s}
SAVE_CSS = ".saveart{margin-top:34px;border:1px solid var(--divider);border-left:3px solid var(--cyan);border-radius:12px;padding:20px 22px;background:var(--card)}.saveart h2{font-family:var(--serif);font-size:30px;margin:8px 0 4px}.saveart p{font-family:var(--sans);font-size:14px;color:var(--slate)}.sv-chips{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0}.sv-chips button{font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--cloud);background:transparent;border:1px solid var(--divider);border-radius:999px;padding:6px 11px;cursor:pointer}.sv-chips button[aria-pressed=true]{background:var(--cloud);color:var(--ink);border-color:var(--cloud)}.sv-stage{aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden}.sv-stage img,.sv-stage video{width:100%;height:100%;object-fit:contain;display:block}.sv-act{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px}.sv-msg{font-family:var(--mono);font-size:10px;letter-spacing:.14em;color:var(--slate);overflow-wrap:anywhere}"

# VIDEO: the site's own motion and glitch clips of a piece (the same files the SAVE card offers). They go on the
# page as real <video> elements, as VideoObject JSON-LD and as video entries in the sitemap. Google only indexes a
# video it can see on the page, and the SAVE card builds its player in script on a click, so it never saw one.
def piece_clips(p):
    out = [("MOTION", m["mp4"], m.get("sec")) for m in p.get("mv") or [] if m.get("mp4")]
    if p.get("gl") and p["gl"].get("mp4"): out.append(("GLITCH", p["gl"]["mp4"], None))
    return out
def clip_date(rel):
    try: return datetime.date.fromtimestamp(os.path.getmtime(os.path.join(SITE, rel))).isoformat()
    except OSError: return TODAY
def clip_name(p, kind):
    return f"NO. {p['n']:04d} · {p['t']}, {'in motion' if kind == 'MOTION' else 'the glitch loop'} · NEW YORKERS by MLow"
def clip_desc(p, kind):
    lead = "A motion clip of" if kind == "MOTION" else "The Still Waiting glitch loop of"
    return f"{lead} {p['t']}, NO. {p['n']:04d} in NEW YORKERS, MLow's painted census of New York City. {p.get('story') or ''}".strip()
def clips_ld(p, img):
    return [dict({"@context": "https://schema.org", "@type": "VideoObject", "name": clip_name(p, k), "description": clip_desc(p, k), "thumbnailUrl": f"{URL}/{img}", "contentUrl": f"{URL}/{mp4}", "embedUrl": pub(f"{URL}/n/{p['id']}.html"), "uploadDate": clip_date(mp4), "creator": {"@type": "Person", "name": "MLow"}, "isPartOf": {"@id": URL + "/#collection"}}, **({"duration": f"PT{int(round(sec))}S"} if sec else {})) for k, mp4, sec in piece_clips(p)]
def clips_html(p, base, img):
    c = piece_clips(p)
    if not c: return ""
    tiles = "".join(f'<figure class="cs"><video src="{base}{mp4}" poster="{base}{img}" controls muted loop playsinline preload="none" aria-label="{esc(clip_name(p, k))}"></video><figcaption>{k}</figcaption></figure>' for k, mp4, _ in c)
    return f'<div class="canal"><div class="kicker" style="font-size:10px">In motion</div><h2>{esc(p["t"])}, moving</h2><div class="csgrid">{tiles}</div></div>'

# THE TOKEN BLOCK (api/minted.json, written by build_mint.py from the chain snapshot). Under the story, above the
# buttons: minted and held by whom, a Keystone, in THE CENSUS RELEASE pool and not dealt yet, or not its turn.
# Era I is never sold. Without the file the block is skipped and the page is what it was.
_MINT_PATH = os.path.join(SITE, "api", "minted.json")
MINTED = json.load(open(_MINT_PATH)) if os.path.exists(_MINT_PATH) else None
POOL = set(MINTED.get("pool") or []) if MINTED else set()
# THE RECORD rows that read the token, not the site (2026-10-08). A piece in the pool with a rendered stack says what
# is on the token; anything else says what the site holds. The census contract is ERC-721, dynamic by metadata.
def _tok(p):
    t = TOKSTATES.get(str(p.get("n"))) if p.get("n") is not None and p.get("n") in POOL else None
    return t if t and len(t.get("s") or []) > 1 else None
def _on_token(p, kind):
    t = _tok(p); return bool(t and any(x["k"] == kind for x in t["s"]))
def _states_row(p):
    t = _tok(p)
    if t:
        seen = []; [seen.append(x["k"]) for x in t["s"] if x["k"] not in seen]
        return f"{len(t['s'])} on the token: {', '.join(seen)}"
    n = len(p.get("st") or []); return f"{n} finished state{'s' if n != 1 else ''}"
def _format_row(p):
    n = p.get("n")
    if n is None: return None
    if n in _K111: return "KEYSTONE, ERC-7160 on Transient Labs. The artist appends states, the holder pins the one that shows."
    if n in POOL: return "ERC-721 on OpenSea, dynamic by metadata. The states stack in the token's own viewer and the artist appends on Fridays." if _tok(p) else "ERC-721 on OpenSea, dynamic by metadata. The painting alone today, its stack lands in a Friday batch."
    return None
OS_CENSUS = "https://opensea.io/assets/ethereum/0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4/"
OS_KEY = "https://opensea.io/assets/ethereum/0x2dbfcca230979a91863be63ebce55dd5aae2b5c9/"
OS_MINT = "https://opensea.io/collection/newyorkers/overview"
TRANSIENT = "https://transient.xyz/mint/newyorkers"
_K111 = set()
try:
    _ks = open(os.path.join(HERE, "keystone", "src.html"), encoding="utf-8").read()
    _K111 = {x["n"] for x in json.loads(re.search(r"var K111 = (\[.*?\]);\n</script>", _ks, re.S).group(1))}
except (OSError, AttributeError, ValueError, KeyError):
    pass
def _holder(m, base):
    """HELD BY name, linked to their page on my.html, with their X handle when the board knows it."""
    a = m.get("a") or ""; nm = m.get("o") or (a[:6] + "…" + a[-4:] if a else "")
    out = f'<a href="{base}my.html#{esc(a)}">{esc(nm)}</a>' if a else esc(nm)
    if m.get("x"): out += f' · <a href="https://x.com/{esc(m["x"])}" target="_blank" rel="noopener">@{esc(m["x"])}</a>'
    return out
def _ext(href, label, cls=""):
    return f'<a{" class=" + chr(34) + cls + chr(34) if cls else ""} href="{href}" target="_blank" rel="noopener">{label}</a>'
def tok_html(p, base):
    """Keystone first: the founding New Yorkers are Era I leads and are sold there, so the Era I rule comes after."""
    if not MINTED: return ""
    n = p["n"]
    k = MINTED.get("keystone", {}).get(str(n))
    if k:
        return (f'<div class="tok key"><span class="tk"><b>KEYSTONE</b> · TOKEN NO. {k["t"]} · HELD BY {_holder(k, base)}</span>'
                f'<span class="ta">{_ext(OS_KEY + str(k["t"]), "View on OpenSea")}{_ext(TRANSIENT, "Mint a Keystone on Transient")}</span></div>')
    if n in _K111:
        return (f'<div class="tok key"><span class="tk"><b>KEYSTONE</b> · NOT MINTED YET · 0.069 ETH</span>'
                f'<span class="ta">{_ext(TRANSIENT, "Mint a Keystone on Transient", "go")}</span></div>')
    if p.get("e") == 1:
        return f'<div class="tok era1"><span class="tk">ERA I · NEVER SOLD</span><span class="ta"><a href="{base}faq.html">Why</a></span></div>'
    m = MINTED.get("census", {}).get(str(n))
    if m:
        return (f'<div class="tok minted"><span class="tk"><b>MINTED</b> · TOKEN NO. {m["t"]} · HELD BY {_holder(m, base)}</span>'
                f'<span class="ta">{_ext(OS_CENSUS + str(m["t"]), "View on OpenSea")}{_ext(OS_CENSUS + str(m["t"]), "Make an offer", "go")}</span></div>')
    if 2 <= (p.get("e") or 0) <= 19 and n in POOL:
        return (f'<div class="tok open"><span class="tk"><b>IN THE CENSUS RELEASE</b> · NOT MINTED YET · 0.0042 ETH</span>'
                f'<span class="ta">{_ext(OS_MINT, "Mint on OpenSea", "go")}</span>'
                f'<span class="tn">Mints are dealt in order, so you cannot pick this one. You can get counted.</span></div>')
    return (f'<div class="tok wait"><span class="tk">NOT IN A NAMED RELEASE · NOT ITS TURN YET</span>'
            f'<span class="ta"><a href="{base}faq.html">How releases work</a></span></div>')
TOK_CSS = (".tok{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;margin-top:22px;padding:12px 16px;border:1px solid var(--divider);border-left:3px solid var(--slate);border-radius:10px;background:var(--card)}"
           ".tok.minted{border-left-color:var(--acid)}.tok.key{border-left-color:var(--cyan)}.tok.open{border-left-color:var(--acid)}"
           ".tok .tk{flex:1 1 auto;font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--slate);line-height:1.8}"
           ".tok .tk b{font-weight:500;color:var(--cloud)}.tok.minted .tk b,.tok.open .tk b{color:var(--acid)}.tok.key .tk b{color:var(--cyan)}.tok .tk a{color:var(--cloud);text-decoration:none;border-bottom:1px solid rgba(240,244,248,.25)}.tok .tk a:hover{color:var(--cyan);border-color:var(--cyan)}"
           ".tok .ta{display:flex;flex-wrap:wrap;gap:8px}.tok .ta a{font-family:var(--sans);font-weight:500;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--cloud);border:1px solid rgba(240,244,248,.28);border-radius:999px;padding:8px 14px;text-decoration:none;line-height:1;white-space:nowrap}"
           ".tok .ta a:hover{border-color:var(--cyan);color:var(--cyan)}.tok .ta a.go{background:var(--acid);border-color:var(--acid);color:var(--ink);font-weight:600}.tok .ta a.go:hover{background:#e6ff6b;border-color:#e6ff6b;color:var(--ink)}"
           ".tok .tn{flex:1 1 100%;font-family:var(--sans);font-size:12.5px;line-height:1.5;color:var(--slate)}"
           # phones: the painting first, then the plate, title and story, the token block, then the buttons
           "@media (max-width:720px){.pg{display:flex;flex-direction:column}.pg .hero{order:-1;margin:0 0 22px}.tok{padding:12px 14px}.tok .ta{width:100%}.tok .ta a{flex:1 1 auto;text-align:center;justify-content:center;display:inline-flex}}")

ndir = os.path.join(SITE, "n"); os.makedirs(ndir, exist_ok=True)
for f in glob.glob(os.path.join(ndir, "*.html")): os.remove(f)
era_of = {e["i"]: e for e in ERAS}
byn = sorted([p for p in P if p.get("n") is not None], key=lambda p: p["n"])
for k, p in enumerate(byn):
    e = era_of.get(p["e"], {}); base = "../"
    prv, nxt = byn[(k - 1) % len(byn)], byn[(k + 1) % len(byn)]
    n4 = f"NO. {p['n']:04d}"; img = f"assets/t/{p['st'][0]}.jpg"
    rows = [("Number", f"{p['n']:04d}"), ("Era", f"ERA {e.get('roman','')} · {e.get('title','')}"), ("Family", p.get("f")), ("Borough", p.get("b")), ("Category", p.get("cat")), ("Location", (p.get("loc") or "") + (f" · {p['nb']}" if p.get("nb") and p.get("nb") != p.get("loc") else "")), ("Set", p.get("set")), ("States", _states_row(p)), ("Glitch edition", ("Still Waiting, a state on the token" if _on_token(p, "GLITCH") else "Still Waiting, the glitch edition") if p.get("gl") else None), ("Token format", _format_row(p))]
    table = "".join(f'<tr><td>{esc(a)}</td><td>{esc(b)}</td></tr>' for a, b in rows if b)
    ld = [{"@context": "https://schema.org", "@type": "VisualArtwork", "name": p["t"], "identifier": n4, "url": f"{URL}/n/{p['id']}.html", "image": f"{URL}/{img}", "creator": {"@type": "Person", "name": "MLow"}, "artform": "Digital painting", "artMedium": "AI generative digital painting", "description": p.get("story", ""), "isPartOf": {"@id": URL + "/#collection"}, "dateCreated": "2026", "locationCreated": {"@type": "Place", "name": (p.get("loc") or "New York City") + ", New York City"}, "keywords": ", ".join(x for x in [p.get("f"), p.get("b"), p.get("cat"), p.get("loc"), "NEW YORKERS by MLow"] if x)}] + clips_ld(p, img)
    body = f"""
<section class="wrap" style="padding-top:48px;padding-bottom:0"><div class="article pg" style="max-width:960px;margin:0">
  <div class="plate"><span class="n">{n4}</span><span class="m">ERA {esc(e.get('roman',''))} · {esc((p.get('f') or '').upper())} · {esc((p.get('b') or '').upper())}</span></div>
  <h1 class="h-xl" style="font-size:clamp(36px,5.6vw,84px);margin-top:18px">{esc(p['t'])}</h1>
  <p class="lede" style="margin-top:18px;max-width:820px">{esc(p.get('story',''))}</p>
  {tok_html(p, base)}
  <p style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="{base}census.html#n={p['id']}">OPEN THE RECORD</a><a class="btn ghost" href="{base}map.html#p={p['id']}">ON THE ATLAS</a><a class="btn ghost" href="{base}museum.html#hang=search:{p['n']}">HANG IT IN THE MUSEUM</a><a class="btn ghost" href="{base}markup.html#n={p['id']}">MARK IT UP</a><a class="btn ghost" href="{base}counted.html">GET COUNTED</a></p>
  <div class="share" id="share" style="margin-top:16px"></div>
  <figure class="hero" style="margin:32px 0 0"><img src="{base}{img}" alt="{esc(p['t'])}" style="width:100%;border-radius:12px;border:1px solid var(--divider)"></figure>
</div></section>
<section class="wrap" style="padding-top:0;padding-bottom:80px"><div class="article" style="max-width:960px;margin:0">
  {clips_html(p, base, img)}
  <div class="saveart" id="saveart"></div>
  {canal_html(p, base)}
  {fx_html(p, base)}
  <div class="orderbox" id="orderbox" hidden>
    <div class="kicker" style="font-size:10px">Order this as a print</div>
    <div class="orow">
      <label>Size<select id="oSize"></select></label>
      <label>Format<select id="oFmt"></select></label>
      <label>Price<output id="oPrice">-</output></label>
    </div>
    <a class="btn pink" id="oBuy" href="#" target="_blank" rel="noopener">ADD TO CART AT THE SHOP</a>
    <p class="ofine">Printed to order and signed. The piece number travels with the order, so the lab prints the right one. A print is not one of the works sold in a named release and does not include a token.</p>
  </div>
  <table class="rec" style="margin-top:28px;width:100%;border-collapse:collapse;font-family:var(--sans);font-size:15px">{table}</table>
  <p class="body" style="margin-top:22px;font-size:14px">Part of NEW YORKERS by MLow, a painted census of New York City: {num(K['pieces'])} characters across {K['eras']} eras. <a href="{base}learn.html" style="color:var(--cyan)">Read the history of the places</a> or <a href="{base}museum.html#room=random" style="color:var(--cyan)">spin into a room of the museum</a>.</p>
  <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:40px;border-top:1px solid var(--divider);padding-top:24px"><a href="{prv['id']}.html" class="btn ghost sm">← NO. {prv['n']:04d}</a><a href="{nxt['id']}.html" class="btn ghost sm">NO. {nxt['n']:04d} →</a></div>
</div></section>"""
    sd = json.dumps(save_data(p, base), ensure_ascii=False).replace("</", "<\\/")
    page = shell(title=f"{n4} · {p['t']} · NEW YORKERS by MLow", description=(p.get("story") or p["t"])[:158], body=body, base=base, path=f"n/{p['id']}.html", active="THE CENSUS", jsonld=ld, image=f"{URL}/{img}", keywords=[x for x in [p["t"], p.get("f"), p.get("b"), p.get("cat"), p.get("loc"), "NEW YORKERS by MLow", "MLow"] if x], noindex=(p["e"] == 1), kind="article",
                 extra_css=SAVE_CSS + TOK_CSS + ".canal{margin-top:34px;border:1px dashed var(--divider);border-radius:12px;padding:20px 22px}.canal h2{font-family:var(--serif);font-size:30px;margin:8px 0 4px}.canal p{font-family:var(--sans);font-size:14px;color:var(--slate)}.csgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:14px}.cs{margin:0}.cs img,.cs video{width:100%;border-radius:8px;border:1px solid var(--divider);display:block;background:#000}.cs figcaption{font-family:var(--mono);font-size:9.5px;letter-spacing:.22em;color:var(--slate);margin-top:6px}.orderbox{background:var(--card);border:1px solid var(--divider);border-left:3px solid var(--pink);border-radius:12px;padding:22px 24px;margin-top:26px;max-width:720px}.orderbox .orow{display:grid;grid-template-columns:1fr 1fr auto;gap:14px;margin:14px 0 16px}@media (max-width:620px){.orderbox .orow{grid-template-columns:1fr}}.orderbox label{display:flex;flex-direction:column;gap:6px;font-family:var(--mono);font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--slate)}.orderbox select{background:var(--ink);border:1px solid var(--divider);color:var(--cloud);font-family:var(--sans);font-size:15px;padding:11px 12px;border-radius:7px;outline:none}.orderbox output{font-family:var(--mono);font-size:22px;color:var(--cyan);padding-top:8px;white-space:nowrap}.orderbox .ofine{font-family:var(--sans);font-size:12.5px;line-height:1.6;color:var(--slate);margin-top:14px}.rec td{padding:10px 0;border-bottom:1px solid var(--divider);vertical-align:top}.rec td:first-child{font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--slate);width:160px;padding-top:13px}",
                 scripts_after=f'<script>window.NY_SAVE={sd};</script><script src="{base}assets/save.js"></script><script src="{base}assets/prints.js"></script><script>NY.shareRow(document.getElementById("share"),{{title:{json.dumps(n4 + " · " + p["t"])},text:{json.dumps(n4 + " · " + p["t"] + ". " + (p.get("story") or "") + " NEW YORKERS by MLow.")}}});' + PRINT_JS.replace("__PIECE__", json.dumps(f"NO. {p['n']:04d} " + p["t"])) + '</script>')
    open(os.path.join(ndir, p["id"] + ".html"), "w", encoding="utf-8").write(page)
print("piece pages", len(byn))

# ---------- agents.html ----------
ep = census["endpoints"]
body = f"""
<section class="wrap" style="padding-top:72px;padding-bottom:40px"><div class="article" style="margin:0;max-width:860px">
  <div class="kicker">For bots, crawlers and AI agents</div>
  <h1 class="h-xl" style="margin-top:16px;font-size:clamp(40px,6vw,88px)">Read the whole census.</h1>
  <p class="lede" style="margin-top:20px;color:var(--slate)">This page is written for machines and the people who send them. Everything below is plain text, static JSON, and stable URLs. Quote it with attribution. Nothing here needs a key.</p>
</div></section>
<section class="wrap" style="padding-top:0;padding-bottom:80px"><div class="article" style="margin:0;max-width:860px">
  <h2>What this is</h2>
  <p>NEW YORKERS by MLow is a living painted census of New York City by the artist MLow. It holds {num(K['pieces'])} painted characters across {K['eras']} eras, numbered to {num(K['maxNum'])}. Every character has a title, a family, a borough, a two sentence story and a place on the atlas. The collection mints as dynamic tokens on two contracts: THE CENSUS RELEASE on OpenSea as ERC-721 tokens whose states stack in each token's own viewer, and KEYSTONE on Transient Labs ERC-7160, where the artist appends and the holder pins. The site also carries a walkable 3D museum of {len(rooms)} New York rooms and a reading room of sourced New York history.</p>
  <h2>The canonical facts</h2>
  <table class="rec"><tr><td>Name</td><td>NEW YORKERS by MLow (also written NEW YORKERS)</td></tr><tr><td>Artist</td><td>MLow, New York City. mlow.xyz, mlow.nyc. X @degens, Instagram and TikTok @0xmlow.</td></tr><tr><td>Characters painted</td><td>{num(K['pieces'])} (numbered to {num(K['maxNum'])}, not every number is painted yet)</td></tr><tr><td>Finished works</td><td>{num(K['states'])} (some characters hold several finished states)</td></tr><tr><td>Eras</td><td>{K['eras']}, from I The Originals to {ERAS[-1]['roman']} {esc(ERAS[-1]['title'])}</td></tr><tr><td>Families</td><td>{len(fams)}: {esc(", ".join(fams))}</td></tr><tr><td>Museum rooms</td><td>{len(rooms)}</td></tr><tr><td>Token standard</td><td>Two drops on two contracts. THE CENSUS RELEASE mints on OpenSea as ERC-721 tokens that are dynamic by metadata. Each token carries a stack of finished states in its own viewer, and the artist appends new states on Fridays. Contract 0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4 on Ethereum. KEYSTONE, the founding New Yorkers, is 111 and counting at 0.069 ETH each, dynamic ones of one minted directly on Transient Labs ERC-7160TL, contract 0x2dbfcca230979a91863be63ebce55dd5aae2b5c9 on Ethereum, indexed on SuperRare, at https://transient.xyz/mint/newyorkers</td></tr><tr><td>The claim (mint)</td><td>Open now. THE CENSUS RELEASE, 1,111 pieces at 0.0042 ETH, mints on OpenSea from Wednesday September 23, 2026, 11:11 AM ET until Friday October 23, 2026, 11:11 AM ET, at https://opensea.io/collection/newyorkers/overview . Open to everyone, no allowlist.</td></tr><tr><td>Charity partner</td><td>Chai Lifeline</td></tr><tr><td>Tagline</td><td>Every New Yorker gets a portrait. Even the villains.</td></tr><tr><td>Not</td><td>An investment. A photograph. A survey of real residents. It is art.</td></tr></table>
  <h2>Endpoints</h2>
  <table class="rec"><tr><td>Summary</td><td><a href="api/census.json">{ep['pieces'].replace('/api/pieces.json','/api/census.json')}</a></td></tr><tr><td>Every piece</td><td><a href="api/pieces.json">{ep['pieces']}</a> ({num(len(P))} records: id, number, title, family, borough, era, location, story, image, urls)</td></tr><tr><td>Eras</td><td><a href="api/eras.json">{ep['eras']}</a></td></tr><tr><td>Museum rooms</td><td><a href="api/rooms.json">{ep['rooms']}</a> (registry, sourced history, thumbnails, deep links)</td></tr><tr><td>Articles</td><td><a href="api/articles.json">{ep['articles']}</a> (full text with sources)</td></tr><tr><td>llms.txt</td><td><a href="llms.txt">{ep['llms']}</a> and <a href="llms-full.txt">{ep['llmsFull']}</a></td></tr><tr><td>Sitemap</td><td><a href="sitemap.xml">{ep['sitemap']}</a></td></tr><tr><td>Per record pages</td><td>{URL}/n/&lt;id&gt;, one static page per painted New Yorker, with JSON-LD VisualArtwork</td></tr><tr><td>Per room pages</td><td>{URL}/rooms/&lt;id&gt;, one per museum room, with JSON-LD and a cited source</td></tr></table>
  <h2>How to cite</h2>
  <p>MLow. <i>NEW YORKERS</i>, a painted census of New York City, 2026. {URL}/. For a single character: MLow, <i>NO. 0521 Sarah Jessica Parker</i>, NEW YORKERS, 2026, {URL}/n/521. For a history article cite the reading room page and the institution it cites, in that order.</p>
  <h2>Rules of the road</h2>
  <p>Crawl anything under this domain, the video folders included. The motion and glitch clips are listed in the sitemap with their pages. Fetch the JSON once and cache it; it changes at most daily. Do not present the painted characters as real people or the census as a survey of residents. Do not state the claim date as fixed. When you are unsure, say the count is "and counting". Questions: <a href="https://x.com/degens" style="color:var(--cyan)">@degens on X</a>.</p>
  <h2>Deep links</h2>
  <p>census.html#n=&lt;id&gt; opens a record. map.html#p=&lt;id&gt; pins it. museum.html#room=&lt;id&gt; enters a room; museum.html#room=random spins the slot machine. museum.html#hang=era:3 hangs an era; hang=family:Heroes, hang=search:521. counted.html?n=&lt;id&gt; shows a result card.</p>
</div></section>"""
ld = [{"@context": "https://schema.org", "@type": "Dataset", "name": "NEW YORKERS by MLow, the census data", "description": f"{num(K['pieces'])} painted New Yorkers with titles, families, boroughs, eras, stories and locations, plus {len(rooms)} museum rooms and {len(articles)} sourced articles.", "url": f"{URL}/agents", "license": "https://creativecommons.org/licenses/by-nc-nd/4.0/", "creator": ORG, "distribution": [{"@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": u} for u in (ep["pieces"], ep["rooms"], ep["articles"], ep["eras"])], "dateModified": TODAY}]
open(os.path.join(SITE, "agents.html"), "w", encoding="utf-8").write(shell(title="For bots and AI agents · NEW YORKERS by MLow", description="Plain text, static JSON and stable URLs for crawlers and AI agents: the facts, the endpoints, how to cite NEW YORKERS by MLow.", body=body, path="agents.html", active=None, jsonld=ld, keywords=["llms.txt", "AI crawler", "NEW YORKERS by MLow API", "MLow census data"], extra_css=".article h2{margin-top:44px}.article p{color:#c9d2dc}.rec{width:100%;border-collapse:collapse;font-family:var(--sans);font-size:15px;margin-top:8px}.rec td{padding:10px 0;border-bottom:1px solid var(--divider);vertical-align:top;line-height:1.55}.rec td:first-child{font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--slate);width:170px;padding-top:13px}.rec a{color:var(--cyan);word-break:break-all}"))

# ---------- pigeon.html (the hidden one) ----------
body = f"""
<section class="wrap" style="padding-top:80px;padding-bottom:100px;text-align:center"><div class="article">
  <div class="plate" style="justify-content:center"><span class="n">NO. 0000</span><span class="m">UNCOUNTED</span></div>
  <div style="font-size:120px;line-height:1;margin:30px 0 10px">🕊️</div>
  <h1 class="h-xl" style="font-size:clamp(40px,7vw,96px)">The Pigeon</h1>
  <p class="lede" style="margin-top:18px;color:var(--slate)">Resident since the 1600s. Never registered. Never leaving. The one New Yorker the census will not count, because the pigeon does not consent to being counted.</p>
  <p class="body" style="margin-top:24px;max-width:620px;margin-left:auto;margin-right:auto">Rock dove, <i>Columba livia</i>. Brought by settlers, kept for food and mail, set loose, and now senior to every one of us. You found the page nobody links to. You are counted. Type <b>pigeon</b> on any page and see what happens.</p>
  <p style="margin-top:32px"><a class="btn" href="counted.html">GET COUNTED INSTEAD</a> <a class="btn ghost" href="museum.html#room=random" style="margin-left:8px">✦ SPIN A ROOM</a></p>
</div></section>"""
open(os.path.join(SITE, "pigeon.html"), "w", encoding="utf-8").write(shell(title="NO. 0000 · The Pigeon · NEW YORKERS by MLow", description="The one New Yorker the census will not count.", body=body, path="pigeon.html", noindex=True))

# ---------- sitemap, robots, llms, humans ----------
urls = [(URL + "/", "1.0"), *[(f"{URL}/{p}", "0.9") for p in ("census.html", "museum.html", "keystone.html", "map.html", "counted.html", "learn.html", "faq.html", "vault.html", "shipping.html", "count.html", "press.html", "brand.html", "agents.html", "new-rooms.html", "honoraries.html", "bloomrun.html", "moshlab.html", "markup.html", "mosaic.html", "posters.html", "collectors.html", "my.html", "states.html", "stop.html", "arcade.html", "wall.html", "survey.html", "island.html", "basement.html", "skelly.html")]]
urls += [(f"{URL}/learn/{a['slug']}.html", "0.8") for a in articles]
urls += [(f"{URL}/rooms/{r['id']}.html", "0.7") for r in rooms]
sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">']
X = lambda v: html.escape(str(v))
def sm_img(rel): return f"<image:image><image:loc>{X(URL + '/' + rel)}</image:loc></image:image>"
def sm_vid(thumb, title, desc, src, sec=None, date=None):
    return ("<video:video>" f"<video:thumbnail_loc>{X(URL + '/' + thumb)}</video:thumbnail_loc><video:title>{X(title[:100])}</video:title>"
            f"<video:description>{X(desc[:2048])}</video:description><video:content_loc>{X(URL + '/' + src)}</video:content_loc>"
            + (f"<video:duration>{int(sec)}</video:duration>" if sec else "") + (f"<video:publication_date>{date}</video:publication_date>" if date else "")
            + "<video:family_friendly>yes</video:family_friendly></video:video>")
_nv = 0
for u, pr in urls:
    pg = u[len(URL) + 1:] or "index.html"
    vids = "".join(sm_vid(v["thumb"], v["name"], v["desc"], v["src"], v["sec"], v["date"]) for v in PAGE_VIDEOS.get(pg, []))
    _nv += len(PAGE_VIDEOS.get(pg, []))
    sm.append(f"<url><loc>{html.escape(pub(u))}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority>{vids}</url>")
# every public piece page: each finished state as an image (image search ties the painting to its record) and each
# motion or glitch clip as a video. Era I is noindex (it is never sold) and stays out.
_np = 0
for p in byn:
    if p["e"] == 1: continue
    pu = pub(f"{URL}/n/{p['id']}.html"); img = f"assets/t/{p['st'][0]}.jpg"
    ims = "".join(sm_img(f"assets/t/{k}.jpg") for k in (p.get("st") or [])[:1000])
    vids = "".join(sm_vid(img, clip_name(p, k), clip_desc(p, k), mp4, sec, clip_date(mp4)) for k, mp4, sec in piece_clips(p))
    _nv += len(piece_clips(p)); _np += 1
    sm.append(f"<url><loc>{html.escape(pu)}</loc><lastmod>{TODAY}</lastmod><priority>0.4</priority>{ims}{vids}</url>")
# the honorees (build_honoraries.py runs first): each page with its paintings as image entries, so image search
# can tie each portrait to the person's name. Only people who have a page; banned ones never get one.
_H = json.load(open(os.path.join(HERE, "honoraries", "honoraries.json")))
_H = _H["people"] if isinstance(_H, dict) else _H
_nh = 0
for h in _H:
    if not os.path.exists(os.path.join(SITE, "h", h["id"] + ".html")):
        continue
    im = "".join(f"<image:image><image:loc>{html.escape(URL + '/assets/honoraries/' + w['l'])}</image:loc></image:image>" for w in h["works"])
    sm.append(f"<url><loc>{html.escape(pub(URL + '/h/' + h['id'] + '.html'))}</loc><lastmod>{TODAY}</lastmod><priority>0.6</priority>{im}</url>")
    _nh += 1
sm.append("</urlset>")
open(os.path.join(SITE, "sitemap.xml"), "w").write("\n".join(sm))
AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Googlebot", "Bingbot", "Applebot", "Applebot-Extended", "CCBot", "Amazonbot", "meta-externalagent", "cohere-ai", "DuckAssistBot", "YouBot"]
rb = ["# NEW YORKERS by MLow. Crawl the site, videos included. Bots and AI agents: read /agents.html and /llms.txt first.", "User-agent: *", "Allow: /", "Disallow: /assets/museum/props/", ""]
for b in AI_BOTS: rb += [f"User-agent: {b}", "Allow: /", "Disallow: /assets/museum/props/", ""]   # a named group replaces *, so it repeats the rule
rb += [f"Sitemap: {URL}/sitemap.xml", ""]
open(os.path.join(SITE, "robots.txt"), "w").write("\n".join(rb))
llm = [f"# NEW YORKERS by MLow", "", f"> A living painted census of New York City by the artist MLow: {num(K['pieces'])} characters across {K['eras']} eras, every one with a story and a place, a walkable 3D museum of {len(rooms)} New York rooms, and a reading room of sourced New York history. Every New Yorker gets a portrait. Even the villains. THE CENSUS RELEASE mints on OpenSea as ERC-721 tokens that are dynamic by metadata. Each token carries a stack of finished states in its own viewer, and the artist appends new states on Fridays. KEYSTONE is the founding New Yorkers as dynamic ones of one, 111 and counting at 0.069 ETH each, on Transient Labs ERC-7160 and indexed on SuperRare, at https://transient.xyz/mint/newyorkers . THE CENSUS RELEASE, 1,111 pieces at 0.0042 ETH, is minting now on OpenSea from September 23, 2026 until October 23, 2026 at 11:11 AM ET, open to everyone with no allowlist.", "",
       "The census is art, not a survey of real residents and not an investment. Quote with attribution to NEW YORKERS by MLow. Images are copyright MLow.", "",
       "## Start here", f"- [For bots and AI agents]({URL}/agents): the canonical facts, endpoints, how to cite", f"- [Census summary JSON]({ep['pieces'].replace('/api/pieces.json','/api/census.json')}): counts, eras, families, boroughs", f"- [Every piece JSON]({ep['pieces']}): {num(len(P))} records", f"- [Museum rooms JSON]({ep['rooms']}): {len(rooms)} rooms with sourced history", f"- [Articles JSON]({ep['articles']}): the reading room, full text with sources", f"- [Full text for LLMs]({URL}/llms-full.txt)", f"- [Print catalogue feeds]({URL}/feeds/catalog.json): the same data as [Google Merchant]({URL}/feeds/google-merchant.xml) and [Meta catalog]({URL}/feeds/meta-catalog.csv)", "",
       "## The site", f"- [Home]({URL}/)", f"- [The Census]({URL}/census): every record in 3D and a gallery", f"- [The Atlas]({URL}/map): every piece on the map of the five boroughs", f"- [The Mosaic]({URL}/mosaic): MLow in his cab made of 9,216 tiles of New Yorkers, every tile clickable, minted tiles marked live from the chain", f"- [The Museum]({URL}/museum): {len(rooms)} walkable rooms; #room=random spins the slot machine", f"- [Keystone 111]({URL}/keystone): the 111 founding New Yorkers on one spiral ramp", f"- [The Honoraries]({URL}/honoraries): every real person MLow has painted into NEW YORKERS, with their handles", f"- [Posters, cards and memes]({URL}/posters): street posters for the city, a movie poster or a trading card for a New Yorker, memes; the ones made from a painting open it", f"- [Collectors]({URL}/collectors): the collectors leaderboard, every NEW YORKERS holder ranked by points with badges for the five boroughs, every family, a whole set, Keystone and day one; raw data at {URL}/api/collectors.json", f"- [My NEW YORKERS]({URL}/my): a collector pastes a wallet or ENS name and gets their own gallery in the museum, the collection rehung in any room, a TV frame at {URL}/tv and an AR wall at {URL}/wall", f"- [Bloom Run]({URL}/bloomrun): a NEW YORKERS game by MLow: drive the art taxi through all five boroughs in sixteen levels and count the census New Yorkers", f"- [MOSH LAB]({URL}/moshlab): MLow's glitch instrument, free in the browser: 60 stackable WebGL effects and 48 presets, seeded looks, loop perfect GIF, MP4, WebM and PNG export; images never leave the visitor's machine; code at https://github.com/0xmlow/newyorkers/tree/mosh-lab", f"- [MEME ISLAND]({URL}/island): a walkable three.js island for The Memes by 6529 and NEW YORKERS: all 527 meme cards hung by district and by floor price, 144 crypto era New Yorkers, 66 of MLow's meme sculptures, hidden keys and typed easter eggs, a Windows 98 desktop; code at https://github.com/0xmlow/newyorkers/tree/meme-island", f"- [YOUR MOM'S BASEMENT]({URL}/basement): a walkable three.js basement under a two family house in Queens: eight rooms and five sub rooms, census paintings on every wall, twenty meme sculptures as trophies, the Rat King's court, forty easter eggs; code at https://github.com/0xmlow/newyorkers/tree/your-moms-basement", f"- [Your Stop]({URL}/stop): type a subway station and see every painted New Yorker within three blocks of it, 445 stations", f"- [Friday State]({URL}/states): what is already appended to the census tokens and the next four Fridays", f"- [The Arcade]({URL}/arcade): six NEW YORKERS games: THE DOOR and THE LAST TRAIN with a daily board (the day's top score on each gets a New Yorker), BODEGA COUNTER, and three 3D pinball tables, CYCLONE (Coney Island), EXPRESS (the subway) and THE DEUCE (42nd Street), where every mode counts a census New Yorker", f"- [Mark up a New Yorker]({URL}/markup): draw over any piece in the census with thirteen brushes, NYC moods and the subway line colours, then save it as a PNG or post it on X; #n=<id> opens a piece", f"- [The FAQ]({URL}/faq): the idea, the lore, the eras and sets, the traits, the release, what you own", f"- [The Reading Room]({URL}/learn): sourced New York history", f"- [Prints]({URL}/shipping): NEW YORKERS prints are not released yet, and MLow's other print catalogue is a separate body of work", f"- [Mint THE CENSUS RELEASE](https://opensea.io/collection/newyorkers/overview): 1,111 pieces at 0.0042 ETH on OpenSea, open to everyone until October 23, 2026", f"- [Mint KEYSTONE](https://transient.xyz/mint/newyorkers): the founding New Yorkers as dynamic ones of one on Transient Labs, 111 and counting at 0.069 ETH", f"- [Get Counted]({URL}/counted): the quiz, the Resident card, the nomination form", f"- [The Count]({URL}/count): the countdown", f"- [Press]({URL}/press)", f"- [Brand]({URL}/brand)", "",
       "## The reading room"] + [f"- [{a['title']}]({URL}/learn/{a['slug']}.html): {a['summary']}" for a in articles] + ["", "## The eras"] + [f"- Era {e['roman']} {e['title']} (numbers {e['range'][0]} to {e['range'][1]}): {e.get('desc','')}" for e in ERAS] + ["", "## The rooms"] + [f"- [{r['name']}]({URL}/rooms/{r['id']}.html): {r['area'].title()}. {r.get('learn','')}" for r in rooms]
open(os.path.join(SITE, "llms.txt"), "w", encoding="utf-8").write(no_dash("\n".join(llm)) + "\n")
full = llm + ["", "---", "", "# Full text", ""]
for a in articles:
    full += [f"## {a['title']}", "", a["summary"], ""]
    for b in a["body"]:
        if "h" in b: full.append(f"### {b['h']}\n")
        elif "p" in b: full.append(b["p"] + "\n")
        elif "q" in b: full.append(f"> {b['q']} ({b.get('by','')})\n")
    full += ["Facts:"] + [f"- {f['fact']} (Source: {f['source']}, {f['url']})" for f in a.get("facts", [])] + ["", "Sources:"] + [f"- {s['name']}: {s['url']}" for s in a.get("sources", [])] + [""]
full += ["## The museum rooms, with sources", ""]
for r in rooms: full += [f"### {r['name']} ({r['area'].title()})", "", r.get("fact", ""), f"Source: {(r.get('source') or {}).get('name','')} {(r.get('source') or {}).get('url','')}", f"Enter: {URL}/museum#room={r['id']}", ""]
open(os.path.join(SITE, "llms-full.txt"), "w", encoding="utf-8").write(no_dash("\n".join(full)) + "\n")
open(os.path.join(SITE, "humans.txt"), "w").write(f"/* TEAM */\nArtist: MLow (Michael Low)\nSite: mlow.xyz, mlow.nyc\nX: @degens\nIG, TikTok: @0xmlow\nLocation: New York City\n\n/* THANKS */\nEvery New Yorker. Even the villains.\n\n/* SITE */\nLast update: {TODAY}\nStandards: HTML5, CSS3, Three.js, ERC-721 dynamic by metadata, ERC-7160\nComponents: a painted census, an atlas, a museum, a reading room, a slot machine, several easter eggs\nSong: Empire State of Mind, obviously\n")
print(f"sitemap {len(urls) + _np + _nh} urls ({_np} piece pages with their states, {_nv} videos, {_nh} honorees with their paintings) · robots · llms.txt · llms-full.txt · humans.txt · agents.html · pigeon.html")
