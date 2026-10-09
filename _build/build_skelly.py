#!/usr/bin/env python3
"""skelly.html, SKELLY CUP: NEW YORKERS riders on Bryan Brinkman's Marble Run.

Marble Run (marblerun.fun) races 100 marbles forever, five to a race, from public seeds anyone
can verify. Skelly is the New York street game of bottle caps on a chalk board. Five lanes become
five boroughs, every marble gets a painted New Yorker as its rider, and every champion gets a portrait.

Reads  _build/skelly/cast.json        the 100 riders, one census piece per marble (cast in
                                      MARBLE RUN x NEW YORKERS 2026-10-08/, cut by MLow)
       _build/skelly/champions.json   the Champion's Portraits: tournament, marble, rider, seed, image
       assets/skelly/*.jpg            the portraits themselves
Writes assets/skelly/riders.json      marble id to rider, read by the page
       skelly.html

Live data comes from marblerun.fun in the browser (open CORS, one WebSocket). Picks go to our own
/api/skelly (functions/api/skelly.js, D1 table in api/schema_skelly.sql), which checks the gate with
Marble Run itself and scores from its published results. Free, nothing staked, not a bet.
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
assert len(cast) == 100 and len({c["marbleId"] for c in cast}) == 100, "need one rider per marble"

def thumb(u):
    # cast.json carries absolute n3wyorkers.com thumb urls; the page wants them relative so previews work too
    return u.split("n3wyorkers.com/", 1)[-1]

riders = {c["marbleId"]: {"m": c["marble"], "n": c["piece"], "t": c["title"], "i": thumb(c["image"])} for c in cast}
json.dump(riders, open(os.path.join(OUT, "riders.json"), "w"), ensure_ascii=False, separators=(",", ":"))

for ch in champs:
    assert os.path.exists(os.path.join(SITE, ch["image"])), "missing portrait " + ch["image"]

champ_html = "".join(f"""
  <figure class="sk-champ">
    <a href="{esc(ch['image'])}" target="_blank" rel="noopener"><img src="{esc(ch['thumb'])}" alt="{esc(ch['title'])}" loading="lazy" width="1280" height="720"></a>
    <figcaption><small>TOURNAMENT {ch['tournamentId']} · {esc(ch['borough']).upper()} LANE</small><b>{esc(ch['title'])}</b>
    <span>{esc(ch['marble'])}, ridden by <a href="n/{ch['piece']}">{esc(ch['rider'])}</a>.</span>
    <code title="Master seed, revealed by Marble Run when the tournament closed">{esc(ch['seed'])}</code></figcaption>
  </figure>""" for ch in sorted(champs, key=lambda c: -c["tournamentId"]))

cast_html = "".join(f"""<a href="n/{c['piece']}" class="sk-r"><img src="{esc(thumb(c['image']))}" alt="" loading="lazy" width="320" height="180"><b>{esc(c['marble'])}</b><small>{esc(c['title'])}</small></a>"""
                    for c in sorted(cast, key=lambda c: c["marbleId"]))

css = """
.sk-hero{padding:28px 0 8px}
.sk-hero h1{font:900 clamp(44px,9vw,110px)/.85 Fraunces,serif;margin:0;letter-spacing:-2px}
.sk-hero h1 span{color:#ffcc00}
.sk-hero p{max-width:680px;color:var(--muted,#9a978e);font-size:17px}
.sk-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,1fr);gap:18px;margin:18px 0}
@media (max-width:900px){.sk-grid{grid-template-columns:1fr}}
.sk-tv{position:relative;aspect-ratio:16/10;background:#000;border:6px solid #2b2d33;border-radius:10px;overflow:hidden}
.sk-tv iframe{width:100%;height:100%;border:0}
.sk-tv .bug{position:absolute;left:10px;top:8px;font:700 11px "IBM Plex Mono",monospace;background:#ff4d2e;color:#fff;padding:3px 7px;letter-spacing:1px}
.sk-card{border:1px solid rgba(127,127,127,.25);border-radius:4px;padding:14px;margin-bottom:16px}
.sk-card h2{font:600 11px/1 "IBM Plex Mono",monospace;letter-spacing:2px;text-transform:uppercase;color:#ffcc00;margin:0 0 12px}
.sk-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.sk-head b{font:900 26px/1 Fraunces,serif}
.sk-clock{font:600 30px/1 "IBM Plex Mono",monospace;color:#ffcc00}
.sk-meta{font:12px "IBM Plex Mono",monospace;opacity:.6;margin-top:6px;word-break:break-all}
.sk-lanes{display:grid;gap:8px;margin-top:12px}
.sk-lane{display:grid;grid-template-columns:54px 1fr auto;align-items:center;gap:10px;padding:8px 10px;border:1px solid rgba(127,127,127,.3);border-radius:4px;background:transparent;color:inherit;font:inherit;text-align:left;width:100%;cursor:pointer}
.sk-lane[disabled]{cursor:default}
.sk-lane.picked{border-color:#ffcc00;background:rgba(255,204,0,.08)}
.sk-lane.won{border-color:#3ddc84;background:rgba(61,220,132,.1)}
.sk-rider{position:relative;width:50px;height:50px}
.sk-rider img{width:50px;height:50px;object-fit:cover;border-radius:3px;display:block}
.sk-rider i{position:absolute;right:-5px;bottom:-5px;width:22px;height:22px;border-radius:50%;box-shadow:inset -4px -5px 8px rgba(0,0,0,.45),inset 3px 3px 6px rgba(255,255,255,.35)}
.sk-lane .nm{font-weight:700}.sk-lane small{opacity:.65;font-size:12px;display:block}
.sk-lane .rk{font:900 20px Fraunces,serif}
.sk-name{display:flex;gap:8px;margin-top:12px}
.sk-name input{flex:1;font:inherit;padding:10px;border-radius:4px;border:1px solid rgba(127,127,127,.4);background:transparent;color:inherit}
.sk-blow{width:100%;margin-top:10px;padding:14px;font:900 22px/1 Fraunces,serif;background:#ffcc00;color:#111;border:0;border-radius:4px;cursor:pointer}
.sk-blow[disabled]{background:#3a3c42;color:#9a978e;cursor:default}
.sk-note{font-size:12px;opacity:.65;margin-top:8px}
.sk-board{width:100%;border-collapse:collapse;font-size:14px}
.sk-board td,.sk-board th{padding:6px 6px 6px 0;border-bottom:1px solid rgba(127,127,127,.2);text-align:left}
.sk-board th{font:600 10px "IBM Plex Mono",monospace;letter-spacing:1px;opacity:.6}
.sk-bars{display:grid;gap:6px}.sk-bar{display:grid;grid-template-columns:110px 1fr 36px;gap:8px;align-items:center;font-size:13px}.sk-bar div{height:10px;border-radius:2px}
.sk-log{max-height:200px;overflow:auto;font-size:13px}.sk-log p{margin:0 0 6px;opacity:.75}
.sk-champs{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px}
.sk-champ{margin:0}.sk-champ img{width:100%;height:auto;display:block;border-radius:3px}
.sk-champ figcaption{display:flex;flex-direction:column;gap:3px;padding-top:8px}
.sk-champ small{font:600 10px "IBM Plex Mono",monospace;letter-spacing:1.5px;opacity:.6}
.sk-champ b{font:900 22px/1.05 Fraunces,serif}
.sk-champ code{font-size:10px;opacity:.5;word-break:break-all}
.sk-cast{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.sk-r{color:inherit;text-decoration:none}.sk-r img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:3px;display:block}
.sk-r b{display:block;margin-top:5px;font-size:14px}.sk-r small{display:block;font-size:11px;opacity:.6;line-height:1.3}
.sk-fine{font-size:13px;opacity:.7;max-width:760px}
"""

body = f"""
<main class="wrap">
<section class="sk-hero">
  <h1>SKELLY <span>CUP</span></h1>
  <p>Skelly is the New York street game: bottle caps flicked across a chalk board on the asphalt. Bryan Brinkman built the marbles. Five lanes, five boroughs, a hundred painted New Yorkers riding, and a champion every hundred minutes, forever. Pick free, blow on it, get counted.</p>
</section>

<div class="sk-grid">
  <section>
    <div class="sk-tv"><span class="bug">BODEGA TV</span><iframe src="https://marblerun.fun/" title="Marble Run, live" loading="lazy" allow="autoplay"></iframe></div>
    <div class="sk-card" style="margin-top:16px"><h2>Borough Wars, this tournament</h2><div class="sk-bars" id="skBoros"></div>
      <div class="sk-note">The lane a marble draws is its borough for that race. Win 5, second 3, third 1.</div></div>
    <div class="sk-card"><h2>The wire</h2><div class="sk-log" id="skLog"></div></div>
  </section>
  <aside>
    <div class="sk-card">
      <div class="sk-head"><b id="skTitle">Waiting on the gate</b><span class="sk-clock" id="skClock">--</span></div>
      <div class="sk-meta" id="skMeta"></div>
      <div class="sk-lanes" id="skLanes"></div>
      <div class="sk-name"><input id="skName" maxlength="16" placeholder="Your name on the board" autocomplete="nickname"></div>
      <button class="sk-blow" id="skBlow" disabled>BLOW ON IT</button>
      <div class="sk-note">Free. Pick a marble before the gate, then blow on it: 32 random bytes from your phone go into the race seed and are printed in the result forever. Nothing is staked. Not a bet.</div>
    </div>
    <div class="sk-card"><h2>The board, this tournament</h2>
      <table class="sk-board"><thead><tr><th>#</th><th>Name</th><th>Pts</th><th>Winners</th></tr></thead><tbody id="skBoard"><tr><td colspan="4">Loading</td></tr></tbody></table>
      <div class="sk-note">5 for the winner, 2 for second, 1 when your seed is in the race. Scored from Marble Run's own published results.</div></div>
  </aside>
</div>

<section style="margin:40px 0">
  <h2 class="kicker">THE CHAMPION'S PORTRAITS</h2>
  <p class="sk-fine">Every tournament champion gets a painting. The rider is the subject, and the master seed Marble Run reveals at the end of the tournament is printed under it, the proof that nobody chose the winner.</p>
  <div class="sk-champs">{champ_html}</div>
</section>

<section style="margin:40px 0">
  <h2 class="kicker">THE HUNDRED RIDERS</h2>
  <p class="sk-fine">Every Marble Run marble keeps its name. Each one rides with a New Yorker from the census.</p>
  <div class="sk-cast">{cast_html}</div>
</section>

<section style="margin:40px 0 60px">
  <p class="sk-fine">Race data, seeds and the simulation are Bryan Brinkman's <a href="https://marblerun.fun/api" rel="noopener">Marble Run</a>, read live and verifiable by anyone. SKELLY CUP is a free game: no entry, no stake, no odds. Art, not an investment.</p>
</section>
</main>
"""

js = """
<script>
(function(){
  var API = "https://marblerun.fun", B = (window.NY && NY.BASE) || "";
  var BORO = {RED:"Brooklyn", BLUE:"Manhattan", YELLOW:"Queens", GREEN:"Staten Island", CREAM:"The Bronx"};
  var BCOL = {Brooklyn:"#d9534f", Manhattan:"#5bc0de", Queens:"#f0ad4e", "Staten Island":"#5cb85c", "The Bronx":"#ede0c8"};
  var $ = function(id){ return document.getElementById(id); };
  var esc = function(s){ return (window.NY && NY.esc) ? NY.esc(s) : String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); };
  var get = function(k, d){ try { var v = localStorage.getItem("skelly:" + k); return v ? JSON.parse(v) : d; } catch(e) { return d; } };
  var put = function(k, v){ try { localStorage.setItem("skelly:" + k, JSON.stringify(v)); } catch(e) {} };
  var R = {}, rounds = [], race = null, tid = null, skew = 0, mine = get("mine", {});
  fetch(B + "assets/skelly/riders.json").then(function(r){ return r.json(); }).then(function(j){ R = j; paint(); }).catch(function(){});
  $("skName").value = get("name", "");
  $("skName").addEventListener("change", function(){ put("name", $("skName").value.trim()); });

  function log(h){ var p = document.createElement("p"); p.innerHTML = h; $("skLog").prepend(p); while ($("skLog").children.length > 50) $("skLog").lastChild.remove(); }
  function key(k){ return tid + ":" + k; }
  function find(k){ for (var i = 0; i < rounds.length; i++) { var rs = rounds[i].races || []; for (var j = 0; j < rs.length; j++) if (rs[j].key === k) return rs[j]; } return null; }

  function boros(){
    var b = {Brooklyn:0, Manhattan:0, Queens:0, "Staten Island":0, "The Bronx":0};
    rounds.forEach(function(rd){ (rd.races || []).forEach(function(r){ (r.result || []).forEach(function(x){ var n = BORO[x.lane]; if (n) b[n] += x.rank === 1 ? 5 : x.rank === 2 ? 3 : x.rank === 3 ? 1 : 0; }); }); });
    var max = Math.max.apply(null, [1].concat(Object.values(b)));
    $("skBoros").innerHTML = Object.keys(b).sort(function(x, y){ return b[y] - b[x]; }).map(function(n){ return '<div class="sk-bar"><span>' + n + '</span><div style="width:' + (b[n] / max * 100) + '%;background:' + BCOL[n] + '"></div><span>' + b[n] + '</span></div>'; }).join("");
  }

  function paint(){
    if (!race) return;
    var k = key(race.key), m = mine[k] || {}, open = race.status === "announced";
    var order = {}; (race.result || []).forEach(function(x){ order[x.marbleId] = x.rank; });
    $("skTitle").textContent = (race.roundTitle || race.roundKey) + " " + (race.indexInRound + 1);
    $("skMeta").textContent = "tournament " + tid + " · " + race.key + " · track " + race.trackSeed + (race.raceSeed ? " · race seed " + race.raceSeed : "");
    $("skLanes").innerHTML = race.roster.map(function(x){
      var r = R[x.marbleId] || {}, cls = "sk-lane" + (m.pick === x.marbleId ? " picked" : "") + (order[x.marbleId] === 1 ? " won" : "");
      return '<button class="' + cls + '" data-id="' + x.marbleId + '"' + (open ? "" : " disabled") + '><span class="sk-rider">' + (r.i ? '<img src="' + B + esc(r.i) + '" alt="">' : "") + '<i style="background:' + x.color + '"></i></span>' +
        '<span><span class="nm">' + esc(x.marbleName) + '</span> <small style="display:inline">for ' + (BORO[x.lane] || x.lane) + '</small><small>' + esc(r.t || "") + '</small></span>' +
        '<span class="rk">' + (order[x.marbleId] || "") + '</span></button>';
    }).join("");
    $("skBlow").disabled = !(open && m.pick != null && !m.seed);
    $("skBlow").textContent = m.seed ? "BLOWN ON" : "BLOW ON IT";
  }

  function send(k, m){
    var name = $("skName").value.trim();
    if (!/^[A-Za-z0-9._]{2,16}$/.test(name)) { if (window.NY && NY.toast) NY.toast("Add a name for the board: 2 to 16 letters, numbers, dot or underscore."); $("skName").focus(); return; }
    put("name", name);
    fetch(B + "api/skelly", {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({tournamentId: tid, raceKey: race.key, marbleId: m.pick, name: name, seed: m.seed || null})})
      .then(function(r){ return r.json(); }).then(function(j){ if (!j.ok && window.NY && NY.toast) NY.toast(j.error || "Pick not saved."); }).catch(function(){});
  }

  $("skLanes").addEventListener("click", function(e){
    var b = e.target.closest(".sk-lane"); if (!b || b.disabled || !race || race.status !== "announced") return;
    var k = key(race.key), m = mine[k] || (mine[k] = {});
    m.pick = +b.dataset.id; put("mine", mine); paint(); send(k, m);
    if (window.NY && NY.hit) NY.hit("skelly", "pick");
  });

  $("skBlow").addEventListener("click", function(){
    if (!race || race.status !== "announced") return;
    var k = key(race.key), m = mine[k]; if (!m || m.pick == null) return;
    var seed = Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(32)), function(b){ return b.toString(16).padStart(2, "0"); }).join("");
    $("skBlow").disabled = true;
    fetch(API + "/api/race/" + encodeURIComponent(race.key) + "/client-seed", {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({seed: seed})})
      .then(function(r){ return r.json().then(function(j){ return {ok: r.ok, j: j}; }); })
      .then(function(x){ if (x.ok && x.j.accepted !== false) { m.seed = seed; put("mine", mine); send(k, m); log("<b>You blew on " + race.key + ".</b> " + (x.j.count || "?") + " seeds in."); } else log("Seed not taken. One per connection per race."); paint(); })
      .catch(function(){ log("Seed did not reach the gate."); paint(); });
    if (window.NY && NY.hit) NY.hit("skelly", "blow");
  });

  function board(){
    if (!tid) return;
    fetch(B + "api/skelly?t=" + tid).then(function(r){ return r.json(); }).then(function(j){
      if (!j.ok) { $("skBoard").innerHTML = '<tr><td colspan="4">The board opens soon.</td></tr>'; return; }
      $("skBoard").innerHTML = j.top.length ? j.top.slice(0, 15).map(function(x, i){ return "<tr><td>" + (i + 1) + "</td><td>" + esc(x.name) + "</td><td>" + x.points + "</td><td>" + x.winners + "</td></tr>"; }).join("") : '<tr><td colspan="4">Nobody on the board yet. Be first.</td></tr>';
    }).catch(function(){ $("skBoard").innerHTML = '<tr><td colspan="4">The board opens soon.</td></tr>'; });
  }

  function boot(s){
    skew = s.serverNow - Date.now(); tid = s.tournament && s.tournament.id; rounds = s.rounds || [];
    race = s.current && s.current.raceKey ? find(s.current.raceKey) : null;
    boros(); paint(); board();
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
      else if (m.type === "round_built") { rounds = rounds.filter(function(r){ return r.key !== m.round.key; }).concat(m.round); }
      else if (m.type === "race_announced") { m.race.status = "announced"; race = upsert(m.race); log("<b>" + race.key + " at the gate:</b> " + race.roster.map(function(x){ return esc(x.marbleName); }).join(", ")); paint(); }
      else if (m.type === "race_start") { if (race && race.key === m.raceKey) { race.status = "running"; race.raceSeed = m.raceSeed; var me = (mine[key(m.raceKey)] || {}).seed; log("<b>" + m.raceKey + " is off.</b> " + ((m.clientSeeds || []).length) + " seeds blown in." + (me && (m.clientSeeds || []).indexOf(me) >= 0 ? " Yours is in it." : "")); paint(); } }
      else if (m.type === "race_result") {
        var r = find(m.raceKey) || race; if (!r) return; r.status = "done"; r.result = m.result;
        var w = m.result[0], rr = R[w.marbleId];
        log("<b>" + esc(w.marbleName) + "</b>" + (rr ? ", ridden by " + esc(rr.t) + "," : "") + " wins " + m.raceKey + " for " + (BORO[w.lane] || w.lane) + ".");
        boros(); paint(); setTimeout(board, 8000);
      } else if (m.type === "tournament_complete") {
        log("<b>" + esc(m.champion.name) + " takes tournament " + tid + ".</b> A new Champion's Portrait is owed.");
        setTimeout(function(){ fetch(API + "/api/state").then(function(r){ return r.json(); }).then(boot).catch(function(){}); }, 40000);
      }
    };
  }
  setInterval(function(){
    if (!race || !race.scheduledStart) return;
    var t = Math.round((race.scheduledStart - (Date.now() + skew)) / 1000);
    $("skClock").textContent = race.status === "announced" ? (t > 0 ? "0:" + String(t).padStart(2, "0") : "GATE") : race.status === "running" ? "RACING" : "FINAL";
  }, 250);
  connect();
})();
</script>
"""

og = champs and max(champs, key=lambda c: c["tournamentId"])["og"]
page = shell(title="SKELLY CUP · NEW YORKERS x Marble Run · NEW YORKERS by MLow",
             description="Bryan Brinkman's Marble Run with a hundred painted New Yorkers riding. Five lanes, five boroughs, a champion every hundred minutes. Pick free, blow on the dice, get counted. Not a bet.",
             body=body, path="skelly.html", active="SKELLY", extra_css=css, scripts_after=js,
             image=(URL + "/" + og) if og else None,
             keywords=["Marble Run", "Bryan Brinkman", "skelly", "NYC street games", "provably fair", "NEW YORKERS by MLow"],
             jsonld=[{"@context": "https://schema.org", "@type": "WebPage", "name": "SKELLY CUP · NEW YORKERS by MLow", "url": f"{URL}/skelly",
                      "isPartOf": {"@id": URL + "/#site"}, "description": "NEW YORKERS riders on Bryan Brinkman's Marble Run, with a portrait for every champion."}])
open(os.path.join(SITE, "skelly.html"), "w", encoding="utf-8").write(page)
print(f"wrote skelly.html: {len(riders)} riders, {len(champs)} champion portraits")
