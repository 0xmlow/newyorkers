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
"""
import json, os, re, shutil, sys
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
for p in k:
    if os.path.exists(os.path.join(IMG_DST, f"{p['id']}g.mp4")): p["gh"] = f"assets/keystone/{p['id']}g.mp4"

# ---------- rewrite the page ----------
s = s.replace(m.group(1), json.dumps(k, ensure_ascii=False, separators=(",", ":")), 1)
subs = [
    ("var IMG = 'img/';", "var IMG = 'assets/keystone/';"),
    # the image names never change and Cloudflare holds them in browsers for at least 4 hours, so every
    # request carries the render version from keystone_images.py; a re-render reaches everyone at once
    ("loader.load(IMG+f.d.id+'s.jpg', function(t){", "loader.load(IMG+f.d.id+'s.jpg?v='+IMGV, function(t){"),
    ('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>', '<script src="assets/three.min.js"></script>'),
    ('<a href="https://n3wyorkers.com" target="_blank" rel="noopener" aria-label="NEW YORKERS by MLow">', '<a href="index.html" aria-label="NEW YORKERS home">'),
    ('<a class="out" id="kLink" href="https://n3wyorkers.com/n/1" target="_blank" rel="noopener">', '<a class="out" id="kLink" href="n/x000.html">'),
    ("kLink').href='https://n3wyorkers.com/n/'+d.n", "kLink').href='n/'+d.sid+'.html'"),
    ("<title>Keystone 111</title>", "<title>NEW YORKERS · Keystone 111</title>"),
    # glitch chip: a button that swaps the framed painting for its glitch loop, and back
    ("  #card .chip.live{border-color:var(--blue);color:var(--blue-soft)}\n",
     "  #card .chip.live{border-color:var(--blue);color:var(--blue-soft)}\n"
     "  #card button.chip{background:transparent;cursor:pointer}\n"
     "  #card button.chip:hover{background:rgba(41,98,255,.14)}\n"
     "  #card button.chip[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#fff}\n"
     "  #card button.chip:focus-visible{outline:2px solid var(--blue);outline-offset:2px}\n"),
    ("  ['still','motion','glitch','dither'].forEach(function(k){ var c=document.createElement('span'); c.className='chip'+(d.k.indexOf(k)>=0?' live':''); c.textContent=k==='still'?'painted':k; c.style.opacity=d.k.indexOf(k)>=0?'1':'.35'; st.appendChild(c); });",
     "  glitchOff();\n"
     "  ['still','motion','glitch','dither'].forEach(function(k){ var play=k==='glitch'&&d.gl, c=document.createElement(play?'button':'span'); c.className='chip'+(d.k.indexOf(k)>=0?' live':''); c.textContent=k==='still'?'painted':k; c.style.opacity=d.k.indexOf(k)>=0?'1':'.35';\n"
     "    if (play){ c.type='button'; c.id='kGl'; c.title='Play the glitch loop on the wall'; c.setAttribute('aria-pressed','false'); c.addEventListener('click',function(){ if (GL.f===f) glitchOff(); else glitchOn(f); }); }\n"
     "    st.appendChild(c); });"),
    ("function closeCard(){ card.classList.remove('open'); hudBottom.classList.remove('hidden-by-card'); }",
     "function closeCard(){ glitchOff(); card.classList.remove('open'); hudBottom.classList.remove('hidden-by-card'); }\n"
     "// One glitch plays at a time, on the open piece. The painting's texture is kept and put back on stop.\n"
     "var GL = {f:null, v:null, t:null, prev:null};\n"
     "function glitchOff(){\n"
     "  if (!GL.f) return;\n"
     "  var m = GL.f.art.material; if (m.map === GL.t) { m.map = GL.prev; m.needsUpdate = true; }\n"
     "  GL.v.pause(); GL.v.removeAttribute('src'); GL.v.load(); if (GL.t) GL.t.dispose();\n"
     "  GL = {f:null, v:null, t:null, prev:null};\n"
     "  var b = document.getElementById('kGl'); if (b) b.setAttribute('aria-pressed','false');\n"
     "}\n"
     "function glitchOn(f){\n"
     "  glitchOff();\n"
     "  var v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline',''); v.preload = 'auto';\n"
     "  GL = {f:f, v:v, t:null, prev:f.art.material.map};\n"
     "  v.addEventListener('playing', function(){ if (GL.v !== v || GL.t) return; var t = new THREE.VideoTexture(v); t.encoding = THREE.sRGBEncoding; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; GL.t = t; f.art.material.map = t; f.art.material.color.set(0xffffff); f.art.material.needsUpdate = true; });\n"
     "  v.src = (!narrow && f.d.gh) ? f.d.gh : f.d.gl; var p = v.play(); if (p && p.catch) p.catch(function(){ if (GL.v === v) glitchOff(); });\n"
     "  var b = document.getElementById('kGl'); if (b) b.setAttribute('aria-pressed','true');\n"
     "}"),
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
function setArt(f, t){ if (GL.f === f) { GL.prev = t; return; } f.art.material.map = t; f.art.material.color.set(0xffffff); f.art.material.needsUpdate = true; }
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
    '<meta name="theme-color" content="#0D0D0D">',
    '<link rel="icon" type="image/png" href="assets/brand/eye_truecolor.png">',
    '<link rel="apple-touch-icon" href="assets/brand/eye_truecolor.png">',
])
s = re.sub(r'<meta name="description" content="[^"]*">', lambda _: f'<meta name="description" content="{esc(desc)}">\n' + head, s, count=1)

s = s.replace("__IMGV__", open(os.path.join(IMG_DST, ".v")).read().strip())
out = os.path.join(SITE, "keystone.html")
open(out, "w", encoding="utf-8").write(s)
print(f"keystone.html: {len(k)} pieces on the ramp, {len(k) * 3} images and {sum(1 for p in k if p.get('gh'))} wall loops in assets/keystone, {os.path.getsize(out) // 1024} KB")
