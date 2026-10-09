#!/usr/bin/env python3
"""keystone.html: KEYSTONE 111, the founding 111 hung along one spiral ramp (Three.js).

The design is hand made and lives in _build/keystone/src.html. It was delivered as a standalone
folder (KEYSTONE 111 MARKETING KIT 2026-09-18/06_3D_GALLERY) with its own img/ and a CDN copy of
Three.js. This script turns that file into a page of the census site:

  - IMG points at assets/keystone/, three sizes per piece from the masters (keystone_images.py); the
    page swaps each piece to the size it fills on screen, so near pieces are sharp and far ones light
  - Three.js comes from assets/three.min.js (the same r128 the museum ships) instead of cdnjs
  - the logo goes home to index.html and "See it in the census" opens the piece's own record page,
    n/<site id>.html. The site keys records by data.js id, not by census number: the three Era I
    leads NO. 1, 2 and 3 are x000, x001 and x002, so every piece is resolved here by its number
  - head gets the site's icon, theme colour and Open Graph tags; build_seo.py adds the rest

To take a new design drop: copy the new index.html over _build/keystone/src.html and rerun.
Run before build_seo.py; part of build_all.sh.

ON CHAIN (2026-10-07): a static, crawlable panel beside the canvas lists what the Keystone contract
actually holds, read from _build/collectors/chain.json (collectors/fetch_chain.py): every minted token,
its name, its holder, an OpenSea link each, and the mint link on Transient Labs. The same data goes to
api/keystone.json. The panel is plain HTML in the page (open by default without JavaScript, a button in
the HUD with it), so the words Transient and the mint URL are in the source, not injected.
"""
import json, os, re, shutil, sys, datetime, collections
from page_shell import cfg, esc

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
SRC = os.path.join(HERE, "keystone", "src.html")
IMG_DST = os.path.join(SITE, "assets", "keystone")
URL = cfg()["siteUrl"]

s = open(SRC, encoding="utf-8").read()
m = re.search(r"var K111 = (\[.*?\]);\n</script>", s, re.S)
if not m: raise SystemExit("keystone: K111 array not found in src.html")
k = json.loads(m.group(1))

# ---------- resolve every piece to its record page ----------
d = open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read()
D = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
byn = {p["n"]: p for p in D["pieces"] if p.get("n") is not None}
missing = []
for piece in k:
    p = byn.get(piece["n"])
    if not p: missing.append((piece["n"], piece["t"])); continue
    if piece["t"].strip().lower() != p["t"].strip().lower():
        print(f"  note: NO. {piece['n']} is titled {piece['t']!r} here and {p['t']!r} in data.js")
    piece["sid"] = p["id"]
if missing: raise SystemExit("keystone: no record in data.js for " + ", ".join(f"NO. {n} {t}" for n, t in missing))

# ---------- glitch loops and state counts ----------
# The card's GLITCH chip plays the piece's glitch loop on the wall, from the same assets/glitch MP4 the
# census record uses. The chips and the state count follow the mint kit when it is on disk, so they
# stop going stale every time the kit gains a state; without it the design's own values stand.
for piece in k:
    g = byn[piece["n"]].get("gl")
    if g and g.get("mp4"): piece["gl"] = g["mp4"]
KIT = os.path.join(os.path.dirname(SITE), "KEYSTONE 111 MINT KIT 2026-09-17", "tokens")
if os.path.isdir(KIT):
    tok = {}
    for d_ in os.listdir(KIT):
        tj = os.path.join(KIT, d_, "token.json")
        if os.path.exists(tj):
            t_ = json.load(open(tj)); tok[t_["census_number"]] = t_["states"]
    for piece in k:
        st_ = tok.get(piece["n"])
        if st_:
            piece["v"] = len(st_)
            piece["k"] = sorted({x["kind"] for x in st_})
# Twelve monuments have no MOSH LAB glitch; their glitch state is a Still Waiting mosh the site files under
# MOTION. The kit's resolved.json ties each source GIF to its site MP4, so the wall plays that one.
RES = os.path.join(os.path.dirname(KIT), "_build", "resolved.json")
if os.path.exists(RES):
    res = json.load(open(RES))
    for piece in k:
        if piece.get("gl"): continue
        cands = [x for x in res.get(str(piece["n"]), {}).get("states", []) if x["kind"] == "motion" and x.get("web")
                 and x["src"].lower().endswith(".gif") and any(w in os.path.basename(x["src"]).lower() for w in ("stillwaiting", "mosh", "vhs", "glitch"))]
        cands.sort(key=lambda x: "stillwaiting_v1" not in x["src"].lower())
        for x in cands:
            web = x["web"].split("NEW YORKERS SITE/", 1)[1]
            if os.path.exists(os.path.join(SITE, web)): piece["gl"] = web; break
nogl = [p["n"] for p in k if not p.get("gl")]
print(f"  glitch loops on the wall: {len(k) - len(nogl)} of {len(k)}" + (f", none for NO. {nogl}" if nogl else ""))

# ---------- images ----------
# keystone_images.py renders {id}s/m/l.jpg (640, 1280, 2400) from the mint kit's lead masters and the
# wall's 1920 glitch loops {id}g.mp4. It runs first in build_all.sh; this only checks they are there.
lost = [f"{p['id']}{sz}.jpg" for p in k for sz in ("s", "m", "l") if not os.path.exists(os.path.join(IMG_DST, f"{p['id']}{sz}.jpg"))]
if lost: raise SystemExit(f"keystone: {len(lost)} images missing from assets/keystone, e.g. {lost[:4]}. Run keystone_images.py")
STATES = json.load(open(os.path.join(HERE, "keystone_states.json")))
for p in k:
    st_ = STATES.get(str(p["n"]))
    if not st_: raise SystemExit(f"keystone: no states for NO. {p['n']}. Run keystone_images.py")
    for x in st_:
        # phones play the census's lighter 1280 copy of the MOSH LAB glitch
        if x.get("u") == f"assets/keystone/{p['id']}g.mp4" and p.get("gl"): x["u2"] = p["gl"]
    p["st"] = st_
    for key in ("gl", "k", "v"): p.pop(key, None)

# ---------- on chain ----------
CONTRACT = "0x2dbfcca230979a91863be63ebce55dd5aae2b5c9"
MINT_URL = "https://transient.xyz/mint/newyorkers"
ZERO = "0x" + "0" * 40
ET = datetime.timezone(datetime.timedelta(hours=-4))   # EDT through 1 November
CH = json.load(open(os.path.join(HERE, "collectors", "chain.json")))
ENS = {a.lower(): n for a, n in CH.get("ens", {}).items()}
KM = CH.get("keystone_meta", {})
owner, minted_at = {}, {}
for lg in sorted(CH["logs"], key=lambda l: (l["b"], l["i"])):
    if lg["c"] != "keystone": continue
    owner[lg["id"]] = lg["to"]
    if lg["from"] == ZERO: minted_at[lg["id"]] = lg["t"]
on_chain = sorted(i for i, a in owner.items() if a != ZERO)
holders = sorted({owner[i] for i in on_chain})
short = lambda a: a[:6] + "\u2026" + a[-4:]
def holder_name(a): return ENS.get(a.lower()) or short(a)
def kthumb(i, name):
    """a same origin thumbnail: the census thumb when the name carries a census number, else the token's own image fetched by build_collectors.py"""
    n = int(name.rsplit("#", 1)[1]) if "#" in name and name.rsplit("#", 1)[1].isdigit() else None
    p = byn.get(n) if n else None
    if p and p.get("st"): return f"assets/t/{p['st'][0]}.jpg"
    rel = f"assets/collectors/k{i}.jpg"
    return rel if os.path.exists(os.path.join(SITE, rel)) else None
# the first tokens on the contract were minted before the Keystone release (the kit's first token, The Bodega
# Matriarch, went on chain September 19, 2026) and were folded into it: ten in June and July, one on September 6
pre = [i for i in on_chain if minted_at.get(i, 0) < datetime.datetime(2026, 9, 15, tzinfo=ET).timestamp()]
pre_from = datetime.datetime.fromtimestamp(min(minted_at[i] for i in pre), ET).strftime("%B %-d") if pre else ""
pre_to = datetime.datetime.fromtimestamp(max(minted_at[i] for i in pre), ET).strftime("%B %-d, %Y") if pre else ""
asof = datetime.datetime.fromtimestamp(CH["fetched"], ET).strftime("%B %-d, %Y at %-I:%M %p ET")
tokens = []
for i in on_chain:
    name = (KM.get(str(i)) or {}).get("name") or f"Keystone #{i}"
    tokens.append({"id": i, "name": name, "holder": owner[i], "holderName": holder_name(owner[i]), "th": kthumb(i, name),
                   "opensea": f"https://opensea.io/assets/ethereum/{CONTRACT}/{i}",
                   "mintedAt": datetime.datetime.fromtimestamp(minted_at[i], ET).isoformat() if i in minted_at else None})
os.makedirs(os.path.join(SITE, "api"), exist_ok=True)
json.dump({"asOf": asof, "block": CH["to"], "contract": CONTRACT, "chain": "Ethereum", "standard": "ERC-7160TL",
           "painted": len(k), "paintedNote": "111 and counting: KEYSTONE is open ended and grows as new Keystone New Yorkers are painted.",
           "onChain": len(on_chain), "holders": len(holders), "price": "0.069 ETH", "mint": MINT_URL,
           "foldedIn": {"count": len(pre), "from": pre_from, "to": pre_to, "note": "Minted on the contract before the Keystone release and folded into it. Token ids are mint order."},
           "tokens": [{k_: v for k_, v in t.items() if k_ != "th"} for t in tokens]},
          open(os.path.join(SITE, "api", "keystone.json"), "w"), ensure_ascii=False, separators=(",", ":"))
def tok_li(t):
    img = f'<img src="{t["th"]}" alt="" loading="lazy">' if t["th"] else '<span class="ph" aria-hidden="true"></span>'
    return (f'<li><a href="{t["opensea"]}" target="_blank" rel="noopener">{img}<div><b>{esc(t["name"])}</b><i>held by {esc(t["holderName"])}</i></div>'
            f'<span>#{t["id"]}</span></a></li>')
ONCHAIN_HTML = f"""
<section id="onchain" class="open" tabindex="-1" aria-label="Keystone on chain">
  <button class="close" id="chainx" type="button" aria-label="Close">×</button>
  <div class="eyebrow">Keystone · Ethereum · ERC-7160</div>
  <h2>ON CHAIN</h2>
  <p class="big"><b>{len(k)} painted and counting.</b> <b>{len(on_chain)} on chain.</b> <b>{len(holders)} holders.</b></p>
  <p class="note">Read off Ethereum on {esc(asof)}, block {CH["to"]:,}. Contract <a href="https://etherscan.io/address/{CONTRACT}" target="_blank" rel="noopener">{CONTRACT[:6]}\u2026{CONTRACT[-4:]}</a> on Transient Labs, 0.069 ETH each, one price and no ladder. Token ids are mint order; {len(pre)} were minted before the Keystone release, {esc(pre_from)} to {esc(pre_to)}, and were folded in. Raw data at <a href="api/keystone.json">api/keystone.json</a>.</p>
  <a class="mintk" href="{MINT_URL}" target="_blank" rel="noopener">Mint a Keystone on Transient</a>
  <h3>The {len(on_chain)} minted</h3>
  <ol>{"".join(tok_li(t) for t in tokens)}</ol>
</section>
"""
ONCHAIN_CSS = """
  /* ON CHAIN: the ledger of what is minted, plain HTML beside the canvas. Open when there is no script; a HUD button otherwise */
  #onchain{position:fixed;z-index:7;top:0;right:0;bottom:0;width:min(460px,100vw);background:var(--scrim);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-left:1px solid var(--line);padding:calc(env(safe-area-inset-top,0px) + 24px) 24px calc(env(safe-area-inset-bottom,0px) + 96px);overflow:auto;-webkit-overflow-scrolling:touch;outline:none;transition:transform .45s cubic-bezier(.2,.7,.2,1)}
  .js #onchain:not(.open){transform:translateX(104%);pointer-events:none}
  #onchain .close{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid transparent;background:transparent;color:var(--slate);font:16px/1 var(--mono);cursor:pointer}
  #onchain .close:hover{color:var(--cloud);border-color:var(--line)}
  #onchain .eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--slate);padding-right:36px}
  #onchain h2{font-family:var(--display);font-weight:300;font-size:clamp(26px,3vw,34px);line-height:1.05;margin:10px 0 14px}
  #onchain .big{font-family:var(--display);font-weight:300;font-size:17px;line-height:1.5;margin:0 0 10px;color:var(--cloud)}
  #onchain .big b{font-weight:500;color:#ECC981}
  #onchain .note{font-family:var(--mono);font-size:11px;line-height:1.7;letter-spacing:.04em;color:var(--slate);margin:0 0 18px}
  #onchain .note a{color:var(--cloud)}
  #onchain .mintk{display:inline-block;font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;background:#ECC981;color:#080D16;border:1px solid #ECC981;border-radius:999px;padding:13px 22px;text-decoration:none;margin:0 0 24px}
  #onchain .mintk:hover{background:var(--cloud);border-color:var(--cloud)}
  #onchain .mintk:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  #onchain h3{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--slate);font-weight:500;margin:0 0 6px;border-top:1px solid var(--line);padding-top:16px}
  #onchain ol{list-style:none;margin:0;padding:0}
  #onchain li a{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);color:var(--cloud);text-decoration:none}
  #onchain li a:hover b{color:var(--blue-soft)}
  #onchain li img,#onchain li .ph{width:44px;height:44px;border-radius:6px;object-fit:cover;background:var(--drum);display:block}
  #onchain li b{display:block;font-family:var(--display);font-weight:400;font-size:15px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #onchain li i{display:block;font-style:normal;font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--slate);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #onchain li span{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--slate);white-space:nowrap}
  @media (max-width:720px){#onchain{width:100vw;border-left:0}}
"""
ONCHAIN_JS = """<script>
(function(){
  var p=document.getElementById('onchain'), b=document.getElementById('chainb'), x=document.getElementById('chainx');
  if(!p||!b||!x) return;
  function set(o){ p.classList.toggle('open',o); p.setAttribute('aria-hidden',o?'false':'true'); b.setAttribute('aria-expanded',o?'true':'false'); b.classList.toggle('on',o); if(o) p.focus(); }
  set(location.hash==='#onchain');
  b.addEventListener('click',function(){ set(!p.classList.contains('open')); });
  x.addEventListener('click',function(){ set(false); b.focus(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&p.classList.contains('open')) set(false); });
})();
</script>"""
print(f"  on chain: {len(on_chain)} Keystone tokens, {len(holders)} holders, {len(pre)} folded in, read {asof}")

# ---------- rewrite the page ----------
s = s.replace(m.group(1), json.dumps(k, ensure_ascii=False, separators=(",", ":")), 1)
subs = [
    ("var IMG = 'img/';", "var IMG = 'assets/keystone/';"),
    # the image names never change and Cloudflare holds them in browsers for at least 4 hours, so every
    # request carries the render version from keystone_images.py; a re-render reaches everyone at once
    ("loader.load(IMG+f.d.id+'s.jpg', function(t){", "loader.load(IMG+f.d.id+'s.jpg?v='+IMGV, function(t){"),
    ('<a href="https://n3wyorkers.com" target="_blank" rel="noopener" aria-label="NEW YORKERS by MLow">', '<a href="index.html" aria-label="NEW YORKERS home">'),
    ('<a class="out" id="kLink" href="https://n3wyorkers.com/n/1" target="_blank" rel="noopener">', '<a class="out" id="kLink" href="n/x000.html">'),
    # ORDER A PRINT, beside the census link. Every Keystone piece has its own print on mlow.nyc
    # (keystone_shop.py). While those are drafts (NY_KEYSTONE_PRINTS.status) the link goes to the piece's
    # record page, whose order block sells it through NEW YORKERS Print with the piece named on the order.
    # No link at all unless NY_PRINTS is live, the same switch that governs every buy button on the site.
    ('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
     '<script src="assets/three.min.js"></script>\n<script src="assets/prints.js"></script>\n<script src="assets/keystone_prints.js"></script>'),
    ('  #card a.out:hover{color:var(--blue-soft)}\n',
     '  #card a.out:hover{color:var(--blue-soft)}\n  #card a.out + a.out{margin-left:18px}\n'
     '  #card .ksave{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 16px}\n'
     '  #card .ksave button,#card .ksave a{font-family:var(--mono);font-size:11px;letter-spacing:.12em;padding:9px 14px;border:1px solid var(--blue);color:#fff;background:transparent;cursor:pointer;text-decoration:none}\n'
     '  #card .ksave button{background:var(--blue)}\n'
     '  #card #kSaveMsg{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--slate)}\n'),
    ('See it in the census</a>', 'See it in the census</a><a class="out" id="kPrint" href="#" target="_blank" rel="noopener" hidden>Order a print</a>'),
    ("kLink').href='https://n3wyorkers.com/n/'+d.n",
     "kLink').href='n/'+d.sid+'.html';\n  (function(){ var a=document.getElementById('kPrint'), P=window.NY_PRINTS, K=window.NY_KEYSTONE_PRINTS, kp=K&&K.pieces[String(d.n)];"
     " if(!P||P.status!=='live'){ a.hidden=true; return; }"
     " a.href=(K&&K.status==='live'&&kp)?K.shop+'/products/'+kp.handle:'n/'+d.sid+'.html#orderbox'; a.hidden=false; })()"),
    ("<title>Keystone 111</title>", "<title>NEW YORKERS · Keystone 111</title>"),
    # state buttons: every chip on the card is a button that puts that state in the frame on the wall;
    # pressing the same chip again steps through that kind's states (motion 2/5)
    ("  #card .chip.live{border-color:var(--blue);color:var(--blue-soft)}\n",
     "  #card .chip.live{border-color:var(--blue);color:var(--blue-soft)}\n"
     "  #card button.chip{background:transparent;cursor:pointer}\n"
     "  #card button.chip:hover{background:rgba(70,146,194,.14)}\n"
     "  #card button.chip[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#fff}\n"
     "  #card button.chip:focus-visible{outline:2px solid var(--blue);outline-offset:2px}\n"
     "  #card .statelbl{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--slate);margin:-8px 0 16px;min-height:14px}\n"
     "  #card .statelbl.loading::after{content:' · loading';color:var(--blue-soft)}\n"),
    ('<div class="states" id="kStates"></div>', '<div class="states" id="kStates"></div>\n  <div class="statelbl" id="kStateLbl" aria-live="polite"></div>'
     '\n  ''<div class="ksave"><button type="button" id="kSave">SAVE</button><a id="kX" href="#" target="_blank" rel="noopener">POST ON X</a><span id="kSaveMsg" aria-live="polite"></span></div>'),
    ("  ['still','motion','glitch','dither'].forEach(function(k){ var c=document.createElement('span'); c.className='chip'+(d.k.indexOf(k)>=0?' live':''); c.textContent=k==='still'?'painted':k; c.style.opacity=d.k.indexOf(k)>=0?'1':'.35'; st.appendChild(c); });",
     "  stateOff(); renderChips(f);"),
    ("function closeCard(){ card.classList.remove('open'); hudBottom.classList.remove('hidden-by-card'); }",
     """function closeCard(){ stateOff(); card.classList.remove('open'); hudBottom.classList.remove('hidden-by-card'); }
// ---------- states ----------
// d.st lists every state on the token in mint order, then the site only ones: {k: still|motion|glitch|dither|poster|card|meme, l: label, u: url
// (null for the lead painting, which is the tiered s/m/l), v: 1 for video, a: aspect}. One state shows at a
// time, on the open piece, in its own frame. Media of another shape (the square loops) is matted inside the
// frame rather than stretched. The painting's texture is kept and put back when the state is closed.
var ST = {f:null, i:0};
function stateOff(){
  if (!ST.f) return;
  var f = ST.f, m = f.art.material;
  if (ST.t && m.map === ST.t) { m.map = ST.prev; m.needsUpdate = true; }
  if (ST.v) { ST.v.pause(); ST.v.removeAttribute('src'); ST.v.load(); }
  if (ST.t) ST.t.dispose();
  fitArt(f, 0);
  ST = {f:null, i:0};
}
function fitArt(f, a){
  // contain: the media keeps its shape inside the frame, on an ink backing between the matte and the art
  var fa = f.d.ar, sx = 1, sy = 1;
  if (a && Math.abs(a-fa)/fa >= 0.02) { if (a < fa) sx = a/fa; else sy = fa/a; }
  f.art.scale.set(sx, sy, 1);
  if (sx < 1 || sy < 1) {
    if (!f.back) { f.back = new THREE.Mesh(f.art.geometry, new THREE.MeshBasicMaterial({color:0x0d0d0d})); f.back.position.z = 0.035; f.group.add(f.back); }
    f.back.visible = true;
  } else if (f.back) f.back.visible = false;
}
function showState(f, i){
  stateOff();
  if (i) {
    var s = f.d.st[i], tok = {};
    ST = {f:f, i:i, t:null, v:null, prev:f.art.material.map, tok:tok};
    var apply = function(t){
      if (ST.tok !== tok) { t.dispose(); return; }
      ST.t = t; f.art.material.map = t; f.art.material.color.set(0xffffff); f.art.material.needsUpdate = true; fitArt(f, s.a);
      document.getElementById('kStateLbl').classList.remove('loading');
    };
    if (s.v) {
      var v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline',''); v.preload = 'auto'; ST.v = v;
      v.addEventListener('playing', function(){ if (ST.tok !== tok || ST.t) return; var t = new THREE.VideoTexture(v); t.encoding = THREE.sRGBEncoding; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; apply(t); });
      v.src = (narrow && s.u2) ? s.u2 : s.u+'?v='+IMGV;
      var p = v.play(); if (p && p.catch) p.catch(function(){ if (ST.tok === tok) { stateOff(); renderChips(f); } });
    } else {
      loader.load(s.u+'?v='+IMGV, function(t){ prepTex(t); if (s.k === 'dither') t.magFilter = THREE.NearestFilter; apply(t); }, undefined, function(){ if (ST.tok === tok) { stateOff(); renderChips(f); } });
    }
  }
  renderChips(f);
  if (i) document.getElementById('kStateLbl').classList.add('loading');
}
function renderChips(f){
  KS.f = f; KS.x();
  var d = f.d, st = document.getElementById('kStates'); st.innerHTML = '';
  var n = document.createElement('span'); n.className = 'n'; n.textContent = d.st.length+' state'+(d.st.length===1?'':'s'); st.appendChild(n);
  var curI = ST.f === f ? ST.i : 0, cur = d.st[curI].k;
  ['still','motion','glitch','dither','poster','card','meme'].forEach(function(k){
    var idx = []; d.st.forEach(function(s,j){ if (s.k === k) idx.push(j); });
    var name = k === 'still' ? 'painted' : k, on = idx.length > 0, pos = idx.indexOf(curI);
    if (!on && (k === 'poster' || k === 'card' || k === 'meme')) return;   // the ChatGPT kinds only show where a piece has one
    var c = document.createElement(on ? 'button' : 'span');
    c.className = 'chip'+(on ? ' live' : ''); c.style.opacity = on ? '1' : '.35';
    c.textContent = name + (k === cur && idx.length > 1 ? ' '+(pos+1)+'/'+idx.length : (idx.length > 1 ? ' '+idx.length : ''));
    if (on) {
      c.type = 'button'; c.setAttribute('aria-pressed', k === cur ? 'true' : 'false');
      c.title = idx.length > 1 ? 'Show the '+name+' states on the wall. Press again for the next one' : 'Show the '+name+' state on the wall';
      c.addEventListener('click', function(){ showState(f, k === cur ? idx[(pos+1) % idx.length] : idx[0]); });
    }
    st.appendChild(c);
  });
  var lb = document.getElementById('kStateLbl'); lb.classList.remove('loading');
  lb.textContent = d.st[curI].l + ' · state ' + (curI+1) + ' of ' + d.st.length;
}"""),
    # sharpness: every piece swaps between s, m and l by how wide it is on screen right now
    ("prepTex(t); if (!f.hi){ f.art.material.map = t; f.art.material.color.set(0xffffff); f.art.material.needsUpdate = true; }",
     "prepTex(t); f.sTex = t; if (!f.tier) setArt(f, t);"),
    ("""function loadHi(f){
  if (f.hi || f.hiLoading) return; f.hiLoading = true;
  loader.load(IMG+f.d.id+'l.jpg', function(t){ prepTex(t); f.art.material.map = t; f.art.material.color.set(0xffffff); f.art.material.needsUpdate = true; f.hi = true; f.hiLoading=false; }, undefined, function(){ f.hiLoading=false; });
}""",
     """// Sharpness by screen size. Every piece hangs at 640 wide; any piece wider than about 560 device pixels
// on screen swaps to the 1280, past about 1100 to the 2400, and swaps back down when it recedes, so
// only the few pieces near the camera hold big textures. The opened piece never drops below 2400
// (1280 on phones). Checked five times a second, at most two loads in flight, biggest first.
var IMGV = '__IMGV__', TIERS = ['s','m','l'], tierBusy = 0, tierAt = 0, PA = new THREE.Vector3(), PB = new THREE.Vector3();
function setArt(f, t){ if (ST.f === f) { ST.prev = t; if (ST.t) return; } f.art.material.map = t; f.art.material.color.set(0xffffff); f.art.material.needsUpdate = true; }
function screenW(f){
  var w = f.art.geometry.parameters.width/2;
  PA.set(-w,0,0).applyMatrix4(f.art.matrixWorld).project(camera);
  PB.set(w,0,0).applyMatrix4(f.art.matrixWorld).project(camera);
  if (PA.z > 1 || PB.z > 1) return 0;
  if ((PA.x > 1.2 && PB.x > 1.2) || (PA.x < -1.2 && PB.x < -1.2) || Math.abs(PA.y) > 1.3) return 0;
  return Math.abs(PB.x - PA.x) / 2 * renderer.domElement.width;
}
function tierTick(now){
  if (now - tierAt < 200) return; tierAt = now;
  var up = [];
  for (var i=0;i<N;i++){
    var f = frames[i]; if (!f.sTex || f.tierLoading) continue;
    var px = screenW(f), cur = f.tier || 0;
    var w = px > 1100 ? 2 : px > 560 ? 1 : 0;
    if (f === S.focusF) w = Math.max(w, narrow ? 1 : 2);
    var target = cur;
    if (w > cur) target = w;
    else if (w < cur && f !== S.focusF && !(cur === 2 ? px > 850 : px > 420)) target = w;
    if (target === cur) continue;
    if (target === 0){ var old = f.hiTex; f.hiTex = null; f.tier = 0; setArt(f, f.sTex); if (old) old.dispose(); }
    else up.push([px, f, target]);
  }
  up.sort(function(a,b){ return b[0]-a[0]; });
  for (var j=0; j<up.length && tierBusy<2; j++) upTier(up[j][1], up[j][2]);
}
function upTier(f, w){
  f.tierLoading = true; tierBusy++;
  loader.load(IMG+f.d.id+TIERS[w]+'.jpg?v='+IMGV, function(t){
    prepTex(t); tierBusy--; f.tierLoading = false;
    var old = f.hiTex; f.hiTex = t; f.tier = w; setArt(f, t); if (old) old.dispose();
  }, undefined, function(){ tierBusy--; f.tierLoading = false; });
}
function loadHi(f){ tierAt = 0; }"""),
    ("  loadNearest(mod(S.t, N));\n  renderer.render(scene, camera);", "  loadNearest(mod(S.t, N));\n  tierTick(now);\n  renderer.render(scene, camera);"),
]
# SAVE IT, POST IT on the card (MLow 2026-10-04), inside the page's closure where ST and IMG live: SAVE downloads the state that is on the wall right now,
# as the real file; a phone that can share files hands it to the share sheet so X gets it attached.
# POST ON X carries the line and the piece's record page, since X's post intent cannot carry media.
subs.append(("function loadHi(f){ tierAt = 0; }", """function loadHi(f){ tierAt = 0; }
var KS = {f:null, x:function(){
  var f = KS.f; if (!f) return; var d = f.d;
  document.getElementById('kX').href = 'https://x.com/intent/post?text=' + encodeURIComponent(String(d.t).toUpperCase() + ' NO. ' + d.n + '\\n\\nKEYSTONE, NEW YORKERS by MLow \\ud83d\\uddfd') + '&url=' + encodeURIComponent('__URL__/n/' + d.sid);
}};
(function(){
  var btn = document.getElementById('kSave'), msg = document.getElementById('kSaveMsg');
  var touch = matchMedia('(pointer:coarse)').matches;
  var MIME = {jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif', mp4:'video/mp4'};
  function slug(t){ return String(t).replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  btn.addEventListener('click', function(){
    var f = KS.f; if (!f) return; var d = f.d, i = ST.f === f ? ST.i : 0, s = d.st[i];
    var url = (s && s.u) ? s.u : IMG + d.id + 'l.jpg';
    var ext = (url.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
    var name = 'NEW-YORKERS-KEYSTONE-' + d.n + '-' + slug(d.t) + '-' + slug(s ? s.l : 'painted') + '.' + ext;
    msg.textContent = 'SAVING'; btn.disabled = true;
    fetch(url).then(function(r){ if (!r.ok) throw 0; return r.blob(); }).then(function(b){
      var file = new File([b], name, {type: MIME[ext] || b.type});
      if (touch && navigator.canShare && navigator.canShare({files:[file]})) {
        return navigator.share({files:[file], title: d.t}).then(function(){ msg.textContent = ''; }, function(){ msg.textContent = ''; });
      }
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
      msg.textContent = 'SAVED. NOW ATTACH IT TO YOUR POST';
    }).catch(function(){ msg.textContent = 'COULD NOT SAVE, TRY AGAIN'; }).then(function(){ btn.disabled = false; });
  });
})();""".replace("__URL__", URL)))
subs += [
    ("  @media (prefers-reduced-motion:reduce){\n    #card{transition:none}\n  }\n</style>",
     "  @media (prefers-reduced-motion:reduce){\n    #card{transition:none}\n  }\n" + ONCHAIN_CSS + "</style>"),
    # with script the panel starts closed; without it the ledger simply stands beside the canvas
    ('<body>\n\n<div class="scrim top"></div>', '<body>\n<script>document.documentElement.className+=" js";</script>\n<div class="scrim top"></div>'),
    ('<button class="btn" id="tour" type="button" aria-pressed="true">Auto tour: on</button></div>',
     f'<button class="btn" id="tour" type="button" aria-pressed="true">Auto tour: on</button><button class="btn" id="chainb" type="button" aria-expanded="false" aria-controls="onchain">On chain: {len(on_chain)} of {len(k)}</button></div>'),
    ('<aside id="card" aria-live="polite" aria-label="Selected piece">', ONCHAIN_HTML + '\n<aside id="card" aria-live="polite" aria-label="Selected piece">'),
    ("\n</body>", "\n" + ONCHAIN_JS + "\n</body>"),
]
for old, new in subs:
    if s.count(old) != 1: raise SystemExit(f"keystone: expected exactly one match for {old[:60]!r}, found {s.count(old)}. The design changed; update build_keystone.py")
    s = s.replace(old, new, 1)
if "n3wyorkers.com" in s.replace(URL, ""): print("  note: the page still carries an absolute n3wyorkers.com link")

desc = "KEYSTONE 111: the 111 founding NEW YORKERS, hung along one continuous spiral. Drag to travel the ramp, click a piece to step up to it."
head = "\n".join([
    f'<meta property="og:type" content="website">',
    f'<meta property="og:title" content="NEW YORKERS · Keystone 111">',
    f'<meta property="og:description" content="{esc(desc)}">',
    f'<meta property="og:image" content="{URL}/assets/keystone/1l.jpg">',
    f'<meta property="og:url" content="{URL}/keystone">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:site" content="@degens">',
    '<meta name="theme-color" content="#080D16">',
    '<link rel="icon" type="image/png" href="assets/brand/eye_truecolor.png">',
    '<link rel="apple-touch-icon" href="assets/brand/eye_truecolor.png">',
])
s = re.sub(r'<meta name="description" content="[^"]*">', lambda _: f'<meta name="description" content="{esc(desc)}">\n' + head, s, count=1)

s = s.replace("__IMGV__", open(os.path.join(IMG_DST, ".v")).read().strip())
out = os.path.join(SITE, "keystone.html")
open(out, "w", encoding="utf-8").write(s)
print(f"keystone.html: {len(k)} pieces on the ramp, {len(k) * 3} images and {sum(len(p['st']) for p in k)} states in assets/keystone, {os.path.getsize(out) // 1024} KB; api/keystone.json written")
