#!/usr/bin/env python3
"""THE READING ROOM and the room pages.
Reads  _build/rooms.json (registry), _build/learn/room_facts_*.json (sourced facts per room), _build/learn/articles_*.json (the articles)
Writes assets/counts.js   (the headline numbers for pages that do not load data.js)
       assets/rooms.js    (window.NY_ROOMS: registry + facts, read by museum.html and index.html)
       assets/articles.js (window.NY_ARTICLES: summaries for the home page and the museum)
       learn.html, learn/<slug>.html, rooms/<id>.html
Run after rooms_registry.py and build_room_thumbs.py, before build_seo.py."""
import json, os, glob, re, html, datetime
from page_shell import shell, esc, no_dash, cfg
from match_pieces import rank as rank_pieces, load as load_match
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]
TODAY = datetime.date.today().isoformat()

def jload(p): return json.load(open(p, encoding="utf-8"))
rooms = jload(os.path.join(HERE, "rooms.json"))
facts = {}
for f in sorted(glob.glob(os.path.join(HERE, "learn", "room_facts_*.json"))):
    for r in jload(f): facts[r["id"]] = r
articles = []
for f in sorted(glob.glob(os.path.join(HERE, "learn", "articles_*.json"))):
    articles += jload(f)
_MD, _MR = load_match()   # the census and the room registry, for picking relevant pieces per article
seen = set()
for a in articles:
    assert a["slug"] not in seen, "duplicate slug " + a["slug"]; seen.add(a["slug"])
by_room_articles = {}
for a in articles:
    for r in a.get("rooms", []): by_room_articles.setdefault(r, []).append(a)

# ---------- counts.js ----------
d = open(os.path.join(SITE, "assets", "data.js")).read(); D = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
rel = jload(os.path.join(HERE, "releases.json"))
counts = {"releases": rel, "counts": D["counts"], "eras": [{"i": e["i"], "roman": e["roman"], "title": e["title"], "range": e["range"]} for e in D["story"]["eras"]], "rooms": len(rooms), "articles": len(articles), "built": TODAY}
open(os.path.join(SITE, "assets", "counts.js"), "w").write("window.NY_COUNTS = " + json.dumps(counts, separators=(",", ":")) + ";\n")

# ---------- rooms.js ----------
merged = []
for r in rooms:
    f = facts.get(r["id"], {})
    arts = by_room_articles.get(r["id"], [])
    merged.append({**r, "place": f.get("place", r["name"]), "fact": no_dash(f.get("fact", "")), "year": f.get("year", ""), "learn": no_dash(f.get("learn", "")), "source": f.get("source"), "keywords": f.get("keywords", []), "article": arts[0]["slug"] if arts else None, "articles": [a["slug"] for a in arts]})
open(os.path.join(SITE, "assets", "rooms.js"), "w").write("window.NY_ROOMS = " + json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + ";\n")
json.dump(merged, open(os.path.join(HERE, "rooms_full.json"), "w"), indent=1, ensure_ascii=False)

# ---------- articles.js ----------
summ = [{"slug": a["slug"], "title": a["title"], "kicker": a["kicker"], "summary": a["summary"], "rooms": a.get("rooms", []), "readMinutes": a.get("readMinutes", 4), "image": (f"assets/museum/rooms/{a['rooms'][0]}.jpg" if a.get("rooms") else "og.jpg")} for a in articles]
open(os.path.join(SITE, "assets", "articles.js"), "w").write("window.NY_ARTICLES = " + json.dumps(summ, ensure_ascii=False, separators=(",", ":")) + ";\n")

room_by_id = {r["id"]: r for r in merged}
def room_tile(rid, base):
    r = room_by_id.get(rid)
    if not r: return ""
    return f'<a href="{base}museum.html#room={r["id"]}" style="--c:{r["color"]}"><img loading="lazy" src="{base}assets/museum/rooms/{r["id"]}.jpg" alt="{esc(r["name"])}"><small>{esc(r["area"])}</small><span>{esc(r["name"])}</span></a>'

# ---------- learn/<slug>.html ----------
os.makedirs(os.path.join(SITE, "learn"), exist_ok=True)
for i, a in enumerate(articles):
    base = "../"
    # Pieces from the census that belong to this article's places. They are NOT illustrations of the
    # events; they are the people the census recorded at the same ground, and the caption says so.
    picks = rank_pieces(a, _MD, _MR, want=10)
    def figure(item):
        _, p, _rid = item
        where = p.get("nb") or p.get("loc") or p.get("b") or ""
        return (f'<figure class="cenfig"><a href="../n/{p["id"]}.html">'
                f'<img loading="lazy" src="../assets/t/{p["st"][0]}.jpg" alt="{esc(p["t"])}"></a>'
                f'<figcaption><span class="n">NO. {p["n"]:04d}</span> {esc(p["t"])}'
                f'{" · " + esc(where) if where else ""}<em>From the census, painted at this place.</em>'
                f'</figcaption></figure>')
    body_html, pi = [], 0
    for b in a["body"]:
        if "h" in b:
            if body_html and pi < len(picks):        # close the previous section with a picture
                body_html.append(figure(picks[pi])); pi += 1
            body_html.append(f"<h2>{esc(b['h'])}</h2>")
        elif "p" in b: body_html.append(f"<p>{esc(b['p'])}</p>")
        elif "q" in b: body_html.append(f"<blockquote>{esc(b['q'])}<cite>{esc(b.get('by',''))}</cite></blockquote>")
    if pi < len(picks): body_html.append(figure(picks[pi])); pi += 1
    strip = "".join(
        f'<a href="../n/{p["id"]}.html" title="NO. {p["n"]:04d} {esc(p["t"])}">'
        f'<img loading="lazy" src="../assets/t/{p["st"][0]}.jpg" alt="{esc(p["t"])}"></a>'
        for _, p, _r in picks[pi:pi + 6])
    facts_html = "".join(f'<div>{esc(f["fact"])}<a href="{esc(f["url"])}" target="_blank" rel="noopener">Source · {esc(f["source"])} ↗</a></div>' for f in a.get("facts", []))
    src_html = "".join(f'<li><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["name"])}</a><em>{esc(s.get("kind","reference"))}</em><br>{esc(s.get("note",""))}</li>' for s in a.get("sources", []))
    faq_html = "".join(f'<details><summary>{esc(q["q"])}</summary><p>{esc(q["a"])}</p></details>' for q in a.get("faq", []))
    rel = "".join(room_tile(r, base) for r in a.get("rooms", []))
    nxt = articles[(i + 1) % len(articles)]
    prv = articles[(i - 1) % len(articles)]
    hero = f"assets/museum/rooms/{a['rooms'][0]}.jpg" if a.get("rooms") else "og.jpg"
    ld = [
        {"@context": "https://schema.org", "@type": "Article", "headline": a["title"], "description": a["summary"], "image": f"{URL}/{hero}", "datePublished": TODAY, "dateModified": TODAY, "author": {"@type": "Person", "name": "MLow", "url": "https://mlow.xyz"}, "publisher": {"@type": "Organization", "name": "NEW YORKERS by MLow", "logo": {"@type": "ImageObject", "url": f"{URL}/assets/brand/eye_truecolor.png"}}, "mainEntityOfPage": f"{URL}/learn/{a['slug']}.html", "keywords": ", ".join(a.get("keywords", [])), "about": [{"@type": "Place", "name": "New York City"}], "citation": [{"@type": "CreativeWork", "name": s["name"], "url": s["url"]} for s in a.get("sources", [])]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "NEW YORKERS", "item": URL + "/"}, {"@type": "ListItem", "position": 2, "name": "The Reading Room", "item": f"{URL}/learn"}, {"@type": "ListItem", "position": 3, "name": a["title"], "item": f"{URL}/learn/{a['slug']}.html"}]},
    ]
    if a.get("faq"): ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q["q"], "acceptedAnswer": {"@type": "Answer", "text": q["a"]}} for q in a["faq"]]})
    body = f"""
<section class="wrap" style="padding-top:56px;padding-bottom:24px">
  <div class="article">
    <div class="kicker"><a href="{base}learn.html" style="color:inherit">The reading room</a> · {esc(a['kicker'])}</div>
    <h1>{esc(a['title'])}</h1>
    <p class="lede" style="margin-top:22px;color:var(--slate)">{esc(a['summary'])}</p>
    <div class="meta"><span>{a.get('readMinutes',4)} MIN READ</span><span>SOURCED · {len(a.get('sources',[]))} REFERENCES</span><span>UPDATED {TODAY}</span></div>
    <div class="share" id="share" style="margin-top:22px"></div>
  </div>
</section>
<div class="wrap"><div class="article"><img src="{base}{hero}" alt="{esc(a['title'])}" style="border-radius:12px;border:1px solid var(--divider);aspect-ratio:16/9;object-fit:cover;width:100%"></div></div>
<section class="wrap" style="padding-top:36px;padding-bottom:80px">
  <article class="article">
    {''.join(body_html)}
    {('<div class="kicker" style="margin-top:52px">More of the census at these places</div><div class="cenrow">' + strip + '</div>') if strip else ''}
    <div class="kicker" style="margin-top:56px">The facts, with their sources</div>
    <div class="facts">{facts_html}</div>
    {'<div class="kicker" style="margin-top:40px">Walk it in the museum</div><div class="rooms-related">' + rel + '</div>' if rel else ''}
    <div class="kicker" style="margin-top:48px">Questions people ask</div>
    <div class="faq" style="margin-top:14px">{faq_html}</div>
    <div class="kicker" style="margin-top:48px">Sources and further reading</div>
    <ul class="sources" style="margin-top:8px">{src_html}</ul>
    <p class="body" style="margin-top:28px;font-size:14px">Corrections are welcome. Write to the census at <a href="https://x.com/degens" target="_blank" rel="noopener" style="color:var(--cyan)">@degens on X</a> and name the line. The reading room cites institutions, not the census; the census cites the reading room.</p>
    <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:56px;border-top:1px solid var(--divider);padding-top:24px">
      <a href="{prv['slug']}.html" class="btn ghost sm">← {esc(prv['title'])}</a>
      <a href="{nxt['slug']}.html" class="btn ghost sm">{esc(nxt['title'])} →</a>
    </div>
  </article>
</section>"""
    page = shell(title=f"{a['title']} · The Reading Room · NEW YORKERS by MLow", description=a["summary"], body=body, base=base, path=f"learn/{a['slug']}.html", active="READ", jsonld=ld, image=f"{URL}/{hero}", keywords=a.get("keywords"), kind="article",
                 scripts_after=f'<script>NY.shareRow(document.getElementById("share"),{{title:{json.dumps(a["title"])},text:{json.dumps(a["title"] + " · The Reading Room, NEW YORKERS by MLow.")}}});</script>')
    open(os.path.join(SITE, "learn", a["slug"] + ".html"), "w", encoding="utf-8").write(page)

# ---------- learn.html ----------
cards = "".join(f'''<a class="card" href="learn/{a['slug']}.html"><img loading="lazy" src="{(f"assets/museum/rooms/{a['rooms'][0]}.jpg" if a.get('rooms') else 'og.jpg')}" alt=""><div class="cb"><div class="plate"><span class="n">{esc(a['kicker'])}</span><span class="m">{a.get('readMinutes',4)} MIN</span></div><div class="ct">{esc(a['title'])}</div><div class="cs">{esc(a['summary'])}</div></div></a>''' for a in articles)
room_cards = "".join(f'''<a class="card rc" href="rooms/{r['id']}.html" style="--c:{r['color']}"><img loading="lazy" src="assets/museum/rooms/{r['id']}.jpg" alt="{esc(r['name'])}"><div class="cb"><div class="plate"><span class="n">{esc(r['area'])}</span><span class="m">{esc(r.get('year',''))}</span></div><div class="ct" style="font-size:20px">{esc(r['name'])}</div><div class="cs" style="font-style:normal;font-family:var(--sans);font-size:14px">{esc(r.get('learn',''))}</div></div></a>''' for r in merged)
body = f"""
<section class="wrap" style="padding-top:72px;padding-bottom:40px">
  <div class="kicker">The reading room</div>
  <h1 class="h-xl" style="margin-top:18px;max-width:1000px">New York, on the record.</h1>
  <p class="lede" style="margin-top:22px;max-width:820px;color:var(--slate)">The census paints the city. The reading room explains it: {len(articles)} short histories and {len(merged)} place records, every fact tied to a source you can check. Plain English, no hype, real dates.</p>
  <div class="share" id="share" style="margin-top:26px"></div>
</section>
<section class="wrap" style="padding-bottom:80px">
  <div class="grid3">{cards}</div>
</section>
<section class="section light wrap" id="places">
  <div class="kicker">{len(merged)} places, {len(merged)} rooms</div>
  <h2 class="h-l" style="margin-top:18px;max-width:900px">Every room in the museum has a history page.</h2>
  <p class="body" style="margin-top:16px;max-width:720px">One sourced paragraph per place, the year it is known for, the institution that keeps its record, and the door into the room itself. Type a place to filter.</p>
  <input id="roomFilter" placeholder="Filter: a place, a borough, a year" style="margin-top:24px;width:min(520px,100%);background:#fff;border:1px solid #ccd4dc;padding:14px 16px;font-family:var(--sans);font-size:15px;border-radius:6px;outline:none">
  <div class="grid3" id="roomGrid" style="margin-top:28px">{room_cards}</div>
</section>"""
extra_css = ".light .card{background:#fff;border-color:#dfe5ec;color:var(--ink)}.light .card .cs{color:#4a5260}.light .card:hover{border-color:var(--blue)}.rc img{aspect-ratio:16/9}"
ld = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": "The Reading Room · NEW YORKERS by MLow", "description": "Sourced histories of New York City places, tied to the painted census and its walkable museum.", "url": f"{URL}/learn", "hasPart": [{"@type": "Article", "name": a["title"], "url": f"{URL}/learn/{a['slug']}.html"} for a in articles]}]
page = shell(title="The Reading Room · New York history, sourced · NEW YORKERS by MLow", description=f"{len(articles)} short sourced histories of New York City and {len(merged)} place records, tied to the painted census and its 111 room museum.", body=body, path="learn.html", active="READ", jsonld=ld, keywords=["New York City history", "NYC history articles", "New York landmarks history", "history of the subway", "Brooklyn Bridge history", "Ellis Island history", "New York museums", "NEW YORKERS by MLow"], extra_css=extra_css,
             scripts_after='<script>NY.shareRow(document.getElementById("share"),{title:"The Reading Room",text:"New York, on the record. The reading room of NEW YORKERS by MLow."});const rf=document.getElementById("roomFilter"),rg=document.getElementById("roomGrid");rf.oninput=()=>{const v=rf.value.trim().toLowerCase();rg.querySelectorAll("a").forEach(a=>{a.hidden=!!v&&!a.textContent.toLowerCase().includes(v)})};</script>')
open(os.path.join(SITE, "learn.html"), "w", encoding="utf-8").write(page)

# ---------- rooms/<id>.html ----------
os.makedirs(os.path.join(SITE, "rooms"), exist_ok=True)
for i, r in enumerate(merged):
    base = "../"
    arts = by_room_articles.get(r["id"], [])
    art_html = "".join(f'<a class="card" href="{base}learn/{a["slug"]}.html"><div class="cb"><div class="plate"><span class="n">{esc(a["kicker"])}</span><span class="m">{a.get("readMinutes",4)} MIN</span></div><div class="ct" style="font-size:22px">{esc(a["title"])}</div><div class="cs">{esc(a["summary"])}</div></div></a>' for a in arts)
    prv, nxt = merged[(i - 1) % len(merged)], merged[(i + 1) % len(merged)]
    src = r.get("source") or {}
    ld = [{"@context": "https://schema.org", "@type": "TouristAttraction", "name": r["place"], "alternateName": r["name"], "description": r.get("fact") or r["description"], "image": f"{URL}/assets/museum/rooms/{r['id']}.jpg", "url": f"{URL}/rooms/{r['id']}.html", "containedInPlace": {"@type": "City", "name": "New York City"}, "sameAs": [src["url"]] if src.get("url") else [], "subjectOf": {"@type": "CreativeWork", "name": f"{r['name']} · THE MUSEUM · NEW YORKERS by MLow", "url": f"{URL}/museum#room={r['id']}"}},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "NEW YORKERS", "item": URL + "/"}, {"@type": "ListItem", "position": 2, "name": "The Museum", "item": f"{URL}/museum"}, {"@type": "ListItem", "position": 3, "name": r["name"], "item": f"{URL}/rooms/{r['id']}.html"}]}]
    body = f"""
<section class="wrap" style="padding-top:56px;padding-bottom:0">
  <div class="kicker" style="color:{r['color']}">Room {r['index']:02d} of {len(merged)} · {esc(r['area'])}{(' · ' + esc(r['year'])) if r.get('year') else ''}</div>
  <h1 class="h-xl" style="margin-top:16px;font-size:clamp(40px,6vw,96px)">{esc(r['name'])}</h1>
  <p class="lede" style="margin-top:16px;max-width:820px;color:var(--slate)">{esc(r['description'])}</p>
  <p style="margin-top:26px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="{base}museum.html#room={r['id']}">ENTER THIS ROOM</a><a class="btn ghost" href="{base}museum.html#room=random">✦ SPIN A ROOM</a><a class="btn ghost" href="{base}map.html">THE ATLAS</a></p>
  <div class="share" id="share" style="margin-top:18px"></div>
</section>
<section class="wrap" style="padding-top:36px;padding-bottom:0"><img src="{base}assets/museum/rooms/{r['id']}.jpg" alt="{esc(r['name'])}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;border:1px solid var(--divider)"></section>
<section class="wrap" style="padding-top:48px;padding-bottom:80px">
  <div class="article" style="margin:0;max-width:820px">
    <h2 style="font-size:clamp(24px,2.6vw,34px);font-weight:600">{esc(r['place'])}, the history</h2>
    <p class="body" style="font-size:18px;color:#c9d2dc;margin-top:16px">{esc(r.get('fact') or 'The record for this place is being written.')}</p>
    {('<p class="mono" style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--slate)">Source · <a href="' + esc(src['url']) + '" target="_blank" rel="noopener" style="color:var(--cyan)">' + esc(src['name']) + ' ↗</a></p>') if src.get('url') else ''}
    <h2 style="font-size:clamp(20px,2vw,26px);font-weight:600;margin-top:40px">What the room is built from</h2>
    <p class="body" style="margin-top:10px">{esc(r['signatures'])} Mood: {esc(r['mood']).lower()}. Everything is procedural geometry with painted surfaces; nothing is a scan or a photograph. The room is an interpretation, and it hangs the New Yorkers the census recorded at this place first.</p>
    {('<h2 style="font-size:clamp(20px,2vw,26px);font-weight:600;margin-top:40px">Read more</h2><div class="grid3" style="margin-top:14px;grid-template-columns:1fr">' + art_html + '</div>') if art_html else ''}
    <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:56px;border-top:1px solid var(--divider);padding-top:24px">
      <a href="{prv['id']}.html" class="btn ghost sm">← {esc(prv['name'])}</a>
      <a href="{base}learn.html#places" class="btn ghost sm">ALL {len(merged)} PLACES</a>
      <a href="{nxt['id']}.html" class="btn ghost sm">{esc(nxt['name'])} →</a>
    </div>
  </div>
</section>"""
    page = shell(title=f"{r['name']} · {r['area'].title()} · THE MUSEUM · NEW YORKERS by MLow", description=(r.get("learn") or r["description"])[:158], body=body, base=base, path=f"rooms/{r['id']}.html", active="THE MUSEUM", jsonld=ld, image=f"{URL}/assets/museum/rooms/{r['id']}.jpg", keywords=(r.get("keywords") or []) + ["NEW YORKERS by MLow", "virtual museum New York"],
                 scripts_after=f'<script>NY.shareRow(document.getElementById("share"),{{title:{json.dumps(r["name"])},text:{json.dumps(r["name"] + " (" + r["area"].title() + "), a room in THE MUSEUM, NEW YORKERS by MLow.")}}});</script>')
    open(os.path.join(SITE, "rooms", r["id"] + ".html"), "w", encoding="utf-8").write(page)

# ---------- checks ----------
bad = []
for f in glob.glob(os.path.join(SITE, "learn", "*.html")) + glob.glob(os.path.join(SITE, "rooms", "*.html")) + [os.path.join(SITE, "learn.html")]:
    t = open(f, encoding="utf-8").read()
    if "—" in t or "–" in t: bad.append(f)
print(f"articles {len(articles)} · rooms {len(merged)} (facts for {len(facts)}) · learn/ + rooms/ written · dash check {'FAILED ' + str(bad) if bad else 'clean'}")
