#!/usr/bin/env python3
"""stop.html, YOUR STOP: type a subway station, see the New Yorkers painted around it.

Hyperlocal shares are how New Yorkers actually post. The atlas already places 7,308 pieces; this
page turns that into the one question people ask of a city map: what is near my stop?

Reads  _build/stop/stations.csv   MTA Subway Stations (data.ny.gov 39hk-dx4f), 496 platforms
       assets/geo.js              every piece's lat/lon and precision (map/build_geo2.py)
       assets/data.js             titles, thumbs, boroughs
Writes assets/stop/stations.json  one entry per station complex: name, borough, routes, lat, lon
       assets/stop/near.json      station id to the pieces within the radius, nearest first
       assets/stop/pieces.json    the light index of only the pieces that appear near any station
       stop.html

Radius: 400 m is about three avenue blocks or five street blocks. If a station has fewer than
eight pieces inside it, the ring widens to 800 m so no stop is ever empty. Pieces placed at a
site or an area read first; pieces inferred from the scene (the neighborhood centroid) read last
and are marked, the way the atlas marks them hollow.
"""
import csv, json, math, os, re, html
from collections import defaultdict
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
OUT = os.path.join(SITE, "assets", "stop")
os.makedirs(OUT, exist_ok=True)
C = cfg()

def load_js(path):
    s = open(path, encoding="utf-8").read()
    return json.loads(s[s.index("=") + 1:].rstrip().rstrip(";"))

G = load_js(os.path.join(SITE, "assets", "geo.js"))
D = load_js(os.path.join(SITE, "assets", "data.js"))
BY_ID = {p["id"]: p for p in D["pieces"]}
BORO = {"M": "Manhattan", "Bk": "Brooklyn", "Q": "Queens", "Bx": "The Bronx", "SI": "Staten Island"}

# ---- stations: fold platforms into complexes (Times Sq has four rows, one stop) ----
cx = {}
with open(os.path.join(HERE, "stop", "stations.csv"), newline="", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        try: lat, lon = float(r["GTFS Latitude"]), float(r["GTFS Longitude"])
        except ValueError: continue
        k = r["Complex ID"] or r["Station ID"]
        e = cx.setdefault(k, {"id": k, "names": [], "boro": BORO.get(r["Borough"], r["Borough"]), "routes": set(), "lat": [], "lon": []})
        e["names"].append(r["Stop Name"].strip())
        e["routes"].update(x for x in r["Daytime Routes"].split() if x)
        e["lat"].append(lat); e["lon"].append(lon)

def clean(n):
    n = re.sub(r"\s+", " ", n).strip()
    return n.replace(" - ", " / ")

ORDER = "1234567ACEBDFMGJZLNQRWS"
def route_sort(x): return (ORDER.index(x[0]) if x[0] in ORDER else 99, x)
stations = []
for e in cx.values():
    names = sorted(set(clean(n) for n in e["names"]), key=lambda s: -e["names"].count(s))
    nm = names[0] if len(names) == 1 else " / ".join(dict.fromkeys(names))
    stations.append({"id": e["id"], "name": nm, "boro": e["boro"], "routes": sorted(e["routes"], key=route_sort),
                     "lat": round(sum(e["lat"]) / len(e["lat"]), 6), "lon": round(sum(e["lon"]) / len(e["lon"]), 6)})
stations.sort(key=lambda s: (s["boro"], s["name"]))

# ---- pieces near each station ----
def dist(a_lat, a_lon, b_lat, b_lon):
    y = (b_lat - a_lat) * 111_320
    x = (b_lon - a_lon) * 111_320 * math.cos(math.radians((a_lat + b_lat) / 2))
    return math.hypot(x, y)

PREC_RANK = {"site": 0, "area": 1, "borough": 3, "citywide": 4}
geo_pieces = [g for g in G["pieces"] if g.get("lat") and g.get("lon") and g.get("prec") not in ("borough", "citywide")]
near, used = {}, set()
for s in stations:
    cand, far = [], []
    for g in geo_pieces:
        d = dist(s["lat"], s["lon"], g["lat"], g["lon"])
        if d <= 800: cand.append((d, g))
        elif d <= 1600: far.append((d, g))
    inner = [c for c in cand if c[0] <= 400]
    # three rings: three blocks, half a mile, then a mile for the outer stops (80 of them had nothing in 800 m)
    radius = 400 if len(inner) >= 8 else (800 if len(cand) >= 4 else 1600)
    pick = inner if radius == 400 else (cand if radius == 800 else cand + far)
    pick.sort(key=lambda c: (PREC_RANK.get(c[1].get("prec"), 2), 1 if c[1].get("inf") else 0, c[0]))
    rows = []
    for d, g in pick[:36]:
        p = BY_ID.get(g["id"])
        if not p or not p.get("st"): continue
        rows.append([g["id"], int(d), 1 if g.get("inf") else 0]); used.add(g["id"])
    near[s["id"]] = {"r": radius, "p": rows}

idx = {}
for pid in used:
    p = BY_ID[pid]
    idx[pid] = [p.get("n"), p["t"], p["st"][0], p.get("nb") or p.get("loc") or "", p.get("e")]

json.dump(stations, open(os.path.join(OUT, "stations.json"), "w"), separators=(",", ":"), ensure_ascii=False)
json.dump(near, open(os.path.join(OUT, "near.json"), "w"), separators=(",", ":"))
json.dump(idx, open(os.path.join(OUT, "pieces.json"), "w"), separators=(",", ":"), ensure_ascii=False)
empty = sum(1 for v in near.values() if not v["p"])
print(f"stop: {len(stations)} stations, {len(used)} pieces placed near a stop, {empty} stops with nothing in a mile")

# ---- the page ----
esc = lambda s: html.escape(str(s or ""), quote=True)
URL = C["siteUrl"]
LINE_COLORS = {"1": "#EE352E", "2": "#EE352E", "3": "#EE352E", "4": "#00933C", "5": "#00933C", "6": "#00933C", "7": "#B933AD",
               "A": "#0039A6", "C": "#0039A6", "E": "#0039A6", "B": "#FF6319", "D": "#FF6319", "F": "#FF6319", "M": "#FF6319",
               "G": "#6CBE45", "J": "#996633", "Z": "#996633", "L": "#A7A9AC", "N": "#FCCC0A", "Q": "#FCCC0A", "R": "#FCCC0A", "W": "#FCCC0A",
               "S": "#808183", "SIR": "#0039A6"}

css = """
.stop-hero{padding:72px 0 28px}
.stop-hero h1{font-family:var(--serif);font-weight:500;font-size:clamp(40px,7vw,88px);line-height:.98;letter-spacing:-.02em;margin:14px 0 18px}
.stop-hero h1 i{font-style:italic;color:var(--cyan)}
.stop-form{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:26px}
.stop-form input{flex:1 1 320px;min-width:0;font:500 17px var(--sans);background:var(--card);color:var(--cloud);border:1px solid var(--divider);border-radius:var(--r);padding:16px 18px}
.stop-form input:focus{outline:none;border-color:var(--cyan)}
.stop-form .btn{padding:15px 22px}
.stop-list{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:4px;max-height:280px;overflow:auto;border:1px solid var(--divider);border-radius:var(--r);background:var(--card)}
.stop-list:empty{display:none}
.stop-list li{display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;font-family:var(--sans);font-size:15px}
.stop-list li:hover,.stop-list li.on{background:rgba(97,201,226,.08)}
.stop-list small{font:11px var(--mono);letter-spacing:.14em;color:var(--slate);margin-left:auto;text-transform:uppercase}
.bullets{display:inline-flex;gap:4px;flex:0 0 auto}
.bullets b{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font:700 11px var(--sans);color:#fff}
.bullets b.y{color:#080D16}
.stop-result{padding:36px 0 80px}
.stop-result[hidden]{display:none}
.stop-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:1px solid var(--divider);padding-bottom:20px;margin-bottom:26px}
.stop-head h2{font-family:var(--serif);font-weight:500;font-size:clamp(30px,4.6vw,56px);line-height:1;letter-spacing:-.02em;margin:10px 0 8px}
.stop-head .bullets b{width:30px;height:30px;font-size:14px}
.stop-head .share{display:flex;gap:8px;flex-wrap:wrap}
.stop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.stop-grid a{display:block;color:inherit;text-decoration:none;background:var(--card);border:1px solid var(--divider);border-radius:var(--r);overflow:hidden;transition:transform .2s var(--ease),border-color .2s}
.stop-grid a:hover{transform:translateY(-2px);border-color:var(--cyan)}
.stop-grid img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#111}
.stop-grid .c{padding:10px 12px 12px}
.stop-grid small{display:block;font:10.5px var(--mono);letter-spacing:.16em;color:var(--slate);text-transform:uppercase}
.stop-grid b{display:block;font-family:var(--serif);font-weight:500;font-size:16px;line-height:1.25;margin-top:4px}
.stop-grid a.inf img{filter:saturate(.7)}
.stop-grid a.inf small:after{content:" · placed by scene";color:#55657a}
.stop-foot{margin-top:28px;font-family:var(--sans);color:var(--slate);font-size:14px;line-height:1.7;max-width:720px}
.stop-empty{font-family:var(--sans);color:var(--slate);font-size:16px}
@media (max-width:720px){.stop-grid{grid-template-columns:repeat(2,1fr);gap:10px}.stop-grid b{font-size:14px}}
"""

body = f"""
<main class="wrap">
  <section class="stop-hero">
    <p class="kicker">YOUR STOP</p>
    <h1>Which New Yorkers <i>get off here?</i></h1>
    <p class="body" style="max-width:680px">Type a subway station. The census shows every painted New Yorker within about three blocks of it, nearest first, with a link into each record. Share your stop.</p>
    <form class="stop-form" id="stopForm" autocomplete="off">
      <input id="stopQ" type="search" placeholder="Bedford Av, 125 St, Jamaica Center..." aria-label="Station name" inputmode="search">
      <button type="button" class="btn ghost" id="stopNear">Nearest to me</button>
      <button type="button" class="btn ghost" id="stopRandom">Any stop</button>
    </form>
    <ul class="stop-list" id="stopList" role="listbox"></ul>
  </section>
  <section class="stop-result" id="stopResult" hidden>
    <div class="stop-head">
      <div><p class="kicker" id="rKick">STATION</p><h2 id="rName"></h2><div class="bullets" id="rBullets"></div></div>
      <div><p class="plate" style="margin-bottom:10px"><span class="n" id="rCount"></span><span class="m" id="rRadius"></span></p><div class="share" id="rShare"></div></div>
    </div>
    <div class="stop-grid" id="rGrid"></div>
    <p class="stop-empty" id="rEmpty" hidden>Nothing painted within a mile of this stop yet. The census is still being painted. <a href="counted#nominate" style="color:var(--cyan)">Nominate someone who belongs here.</a></p>
    <p class="stop-foot">Places come from the atlas: a piece placed at a site or an area reads first; a piece placed by its scene sits at its neighborhood's centre and is marked. Open the <a href="map" style="color:var(--cyan)">atlas</a> for the whole map, or walk the <a href="museum" style="color:var(--cyan)">museum</a>.</p>
  </section>
</main>
"""

js = """
<script>
(function(){
  "use strict";
  var B = window.NY_BASE || "";
  var COL = %s;
  var S, NEAR, IDX, cur = null;
  var q = document.getElementById("stopQ"), list = document.getElementById("stopList");
  function bullets(routes, big){ return routes.map(function(r){ var c = COL[r] || "#808183"; var y = /^[NQRW]$/.test(r); return '<b style="background:'+c+'" class="'+(y?"y":"")+'">'+r+'</b>'; }).join(""); }
  function load(){
    if (S) return Promise.resolve();
    return Promise.all([fetch(B+"assets/stop/stations.json").then(function(r){return r.json()}), fetch(B+"assets/stop/near.json").then(function(r){return r.json()}), fetch(B+"assets/stop/pieces.json").then(function(r){return r.json()})])
      .then(function(a){ S = a[0]; NEAR = a[1]; IDX = a[2]; });
  }
  function norm(s){ return String(s).toLowerCase().replace(/street/g,"st").replace(/avenue/g,"av").replace(/[^a-z0-9 ]/g," ").replace(/\\s+/g," ").trim(); }
  function matches(v){
    v = norm(v); if (!v) return [];
    var toks = v.split(" ");
    return S.filter(function(s){ var n = norm(s.name+" "+s.boro+" "+s.routes.join(" ")); return toks.every(function(t){ return n.indexOf(t) >= 0; }); }).slice(0, 12);
  }
  function paintList(items){
    list.innerHTML = items.map(function(s, i){ return '<li role="option" data-i="'+s.id+'"><span class="bullets">'+bullets(s.routes)+'</span>'+NY.esc(s.name)+'<small>'+NY.esc(s.boro)+'</small></li>'; }).join("");
    Array.prototype.forEach.call(list.children, function(li){ li.onclick = function(){ show(li.dataset.i); list.innerHTML = ""; }; });
  }
  function show(id, quiet){
    var s = S.filter(function(x){ return x.id === id; })[0]; if (!s) return;
    cur = s; q.value = s.name;
    var n = NEAR[id] || {r: 800, p: []};
    document.getElementById("rKick").textContent = s.boro.toUpperCase() + " · " + (s.routes.length ? s.routes.join(" ") + " TRAIN" + (s.routes.length > 1 ? "S" : "") : "STATION");
    document.getElementById("rName").textContent = s.name;
    document.getElementById("rBullets").innerHTML = bullets(s.routes, true);
    document.getElementById("rCount").textContent = n.p.length + " NEW YORKER" + (n.p.length === 1 ? "" : "S");
    document.getElementById("rRadius").textContent = "WITHIN " + (n.r === 400 ? "THREE BLOCKS" : n.r === 800 ? "HALF A MILE" : "A MILE");
    var grid = document.getElementById("rGrid");
    grid.innerHTML = n.p.map(function(row){ var p = IDX[row[0]]; if (!p) return ""; var num = p[0] != null ? "NO. " + String(p[0]).padStart(4, "0") : "UNCOUNTED";
      return '<a href="'+B+'n/'+row[0]+'" class="'+(row[2] ? "inf" : "")+'"><img src="'+B+'assets/t/'+p[2]+'.jpg" alt="'+NY.esc(p[1])+'" loading="lazy" width="320" height="180"><div class="c"><small>'+num+' · '+row[1]+' M</small><b>'+NY.esc(p[1])+'</b></div></a>'; }).join("");
    document.getElementById("rEmpty").hidden = n.p.length > 0;
    var url = location.origin + location.pathname.replace(/\\.html$/, "") + "#s=" + id;
    NY.shareRow(document.getElementById("rShare"), {url: url, text: n.p.length + " painted New Yorkers get off at " + s.name + ". Which stop is yours?"});
    document.getElementById("stopResult").hidden = false;
    if (!quiet) { history.replaceState(null, "", "#s=" + id); document.getElementById("stopResult").scrollIntoView({behavior: "smooth", block: "start"}); }
    if (window.NY && NY.hit) NY.hit("stop", s.name);
  }
  q.addEventListener("input", function(){ load().then(function(){ paintList(matches(q.value)); }); });
  q.addEventListener("keydown", function(e){ if (e.key === "Enter") { e.preventDefault(); load().then(function(){ var m = matches(q.value); if (m[0]) { show(m[0].id); list.innerHTML = ""; } }); } });
  document.getElementById("stopRandom").onclick = function(){ load().then(function(){ var withArt = S.filter(function(s){ return (NEAR[s.id] || {p: []}).p.length >= 6; }); show(withArt[Math.floor(Math.random() * withArt.length)].id); }); };
  document.getElementById("stopNear").onclick = function(){
    if (!navigator.geolocation) { NY.toast("No location on this device. Type your stop."); return; }
    navigator.geolocation.getCurrentPosition(function(pos){ load().then(function(){
      var la = pos.coords.latitude, lo = pos.coords.longitude, best = null, bd = 1e12;
      S.forEach(function(s){ var y = (s.lat - la) * 111320, x = (s.lon - lo) * 111320 * Math.cos((la + s.lat) / 2 * Math.PI / 180), d = x * x + y * y; if (d < bd) { bd = d; best = s; } });
      if (bd > 4e8) { NY.toast("You are not in New York. Type a stop anyway."); }
      if (best) show(best.id);
    }); }, function(){ NY.toast("Location was not shared. Type your stop."); }, {timeout: 8000});
  };
  var m = location.hash.match(/s=([^&]+)/);
  if (m) load().then(function(){ show(decodeURIComponent(m[1]), true); });
})();
</script>
""" % json.dumps(LINE_COLORS)

page = shell(title="Your Stop · which New Yorkers get off here · NEW YORKERS by MLow",
             description="Type a subway station and see every painted New Yorker within three blocks of it. 496 stops, 7,000 placed pieces, one census. Share your stop.",
             body=body, path="stop.html", active="STOP", extra_css=css, scripts_after=js,
             keywords=["New York subway art", "NYC subway stations", "New Yorkers near my stop", "painted census of New York", "NEW YORKERS by MLow"],
             jsonld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "Your Stop · NEW YORKERS by MLow", "url": f"{URL}/stop", "isPartOf": {"@id": URL + "/#site"},
                      "description": "Every painted New Yorker within three blocks of any subway station."}])
open(os.path.join(SITE, "stop.html"), "w", encoding="utf-8").write(page)
print("wrote stop.html")
