#!/usr/bin/env python3
"""Preflight the GO LIVE package: every referenced asset exists, links resolve, copy is clean."""
import json, os, re, sys, glob
PKG="/Users/degens/Desktop/NEW YORKERS BY MLOW/GO LIVE PACKAGE/site"
probs=[]; warns=[]
d=open(os.path.join(PKG,"assets","data.js")).read(); D=json.loads(d[d.index("=")+1:].rstrip().rstrip(";"))
P=D["pieces"]
print("pieces",len(P),"cutPieces",len(D["cutPieces"]),"counts",{k:D["counts"][k] for k in ("pieces","states","glitch","located","eras")})
if D["cutPieces"]: probs.append(f"cutPieces still shipped: {len(D['cutPieces'])}")
if any(p["id"]=="802" for p in P): probs.append("802 The Double Dutch Queens is in the public pieces")
dd=[(p["n"],p["t"]) for p in P if "double dutch" in p["t"].lower()]
if dd: warns.append(f"other Double Dutch titled pieces still public (not 802): {dd}")
# assets referenced
missing_t=[k for p in P for k in p["st"] if not os.path.exists(os.path.join(PKG,"assets","t",k+".jpg"))]
missing_gl=[p["gl"]["mp4"] for p in P if p.get("gl") and not os.path.exists(os.path.join(PKG,p["gl"]["mp4"]))]
missing_glst=[p["gl"]["st"] for p in P if p.get("gl") and p["gl"].get("st") and not os.path.exists(os.path.join(PKG,"assets","t",p["gl"]["st"]+".jpg"))]
missing_mv=[m["mp4"] for p in P for m in (p.get("mv") or []) if not os.path.exists(os.path.join(PKG,m["mp4"]))]
missing_media=[m for p in P for m in (p.get("g") or [])+(p.get("v") or []) if not os.path.exists(os.path.join(PKG,m))]
missing_motion=[m["src"] for m in D["motion"] if not os.path.exists(os.path.join(PKG,m["src"]))]+[m["alt"] for m in D["motion"] if m.get("alt") and not os.path.exists(os.path.join(PKG,m["alt"]))]
missing_mt=[m["key"] for m in D["motion"] if not os.path.exists(os.path.join(PKG,"assets","mt",m["key"]+".jpg"))]
missing_live=[v["src"] for v in D["story"]["living"]["videos"]+D["story"]["living"]["gifs"] if not os.path.exists(os.path.join(PKG,v["src"]))]
missing_atlas=[a for a in range(D["counts"]["atlases"]) if not os.path.exists(os.path.join(PKG,"assets","atlas",f"{D['counts']['atlasPrefix']}{a}.jpg"))]
missing_stk=[s["f"] for s in D["stickers"] if not os.path.exists(os.path.join(PKG,"assets","stickers",s["f"]))]
for name,lst in [("thumbs",missing_t),("glitch mp4",missing_gl),("glitch stills",missing_glst),("motion variants",missing_mv),("piece media",missing_media),("motion",missing_motion),("motion posters",missing_mt),("living city",missing_live),("atlases",missing_atlas),("stickers",missing_stk)]:
    if lst: probs.append(f"missing {name}: {len(lst)} e.g. {lst[:3]}")
# orphan thumbs shipped (bloat)
used=set(k for p in P for k in p["st"])|set(p["gl"]["st"] for p in P if p.get("gl") and p["gl"].get("st"))
shipped=set(f[:-4] for f in os.listdir(os.path.join(PKG,"assets","t")))
orphans=shipped-used
if orphans: warns.append(f"{len(orphans)} thumbs shipped that no public piece uses")
# geo
g=open(os.path.join(PKG,"assets","geo.js")).read(); G=json.loads(g[g.index("=")+1:].rstrip().rstrip(";"))
ids={p["id"] for p in P}; gids={r["id"] for r in G["pieces"]}
if ids-gids: probs.append(f"pieces missing from geo: {len(ids-gids)}")
if gids-ids: warns.append(f"geo has ids not public: {len(gids-ids)}")
print("geo stats",G["stats"])
# html pages: links, assets, dashes, stale numbers
pages=[f for f in os.listdir(PKG) if f.endswith(".html")]+[os.path.join(d,f) for d in ("learn","rooms") if os.path.isdir(os.path.join(PKG,d)) for f in os.listdir(os.path.join(PKG,d)) if f.endswith(".html")]
import random
nd=os.path.join(PKG,"n")
if os.path.isdir(nd): pages+= [os.path.join("n",f) for f in random.sample(os.listdir(nd), min(40, len(os.listdir(nd))))]
for pg in pages:
    h=open(os.path.join(PKG,pg)).read()
    base=os.path.dirname(os.path.join(PKG,pg))
    for m in re.findall(r'(?:href|src)="([^"#?]+)[^"]*"',h):
        # skip anything built by script rather than written: template literals and string concatenation
        if m.startswith(("http","mailto","data:","//")) or "${" in m or "'+" in m or '"+' in m or "+" in m: continue
        # a leading slash means the package root, not the filesystem root
        target = os.path.join(PKG, m.lstrip("/")) if m.startswith("/") else os.path.join(base, m)
        target = os.path.normpath(target)
        # Pages serves /x for x.html, so accept either spelling
        if not (os.path.exists(target) or os.path.exists(target + ".html")):
            probs.append(f"{pg}: broken ref {m}")
    for bad in ("—","–"):
        if bad in h: probs.append(f"{pg}: contains a dash character")
    # MLow asked for his personal address off every public surface; contact goes to @degens on X.
    if "PERSONAL_EMAIL" in h: probs.append(f"{pg}: exposes the personal email address")
    for stale in ("1,841","2,266 characters","3,466","802 cuts"):
        if stale in h: warns.append(f"{pg}: stale number {stale!r}")
    if "<title>" not in h: probs.append(f"{pg}: no title")
for req in ("robots.txt","404.html","_headers","_redirects","og.jpg","assets/config.js","sitemap.xml","llms.txt","llms-full.txt","humans.txt","agents.html","learn.html","brand.html","api/census.json","api/pieces.json","api/rooms.json","feeds/google-merchant.xml","feeds/meta-catalog.csv","feeds/catalog.json","assets/rooms.js","assets/counts.js","assets/eggs.js"):
    if not os.path.exists(os.path.join(PKG,req)): probs.append(f"missing {req}")
cfg=open(os.path.join(PKG,"assets","config.js")).read()
# Forms post to our own /api/submit backed by D1. The function must actually ship or every form
# silently fails; it is shipped from GO LIVE PACKAGE/functions, beside wrangler.toml, not inside site/.
_fn = os.path.join(os.path.dirname(PKG), "functions", "api", "submit.js")
if not os.path.exists(_fn): probs.append("the form intake function is missing: forms would collect nothing")
_tm = os.path.join(os.path.dirname(PKG), "wrangler.toml")
if not os.path.exists(_tm): probs.append("wrangler.toml missing: the D1 binding would not be applied")
elif "d1_databases" not in open(_tm).read(): probs.append("wrangler.toml has no D1 binding")
for pg in ("counted.html","whitelist.html","census.html"):
    _p=os.path.join(PKG,pg)
    if os.path.exists(_p) and "/api/submit" not in open(_p).read():
        probs.append(f"{pg}: form is not wired to /api/submit")
if "claimSigned: false" in cfg: warns.append("claimSigned false: every surface says the Oct 8 date is recommended, not signed")
if "curate: false" not in cfg: probs.append("public config does not force curate off")
# size
n=0; big=[]; total=0
for root,dirs,files in os.walk(PKG):
    for f in files:
        sz=os.path.getsize(os.path.join(root,f)); total+=sz; n+=1
        if sz>24*1024*1024: big.append(f)
print(f"files {n} total {total/1e9:.2f} GB, over 24MB: {big}")
if n>20000: probs.append("over Cloudflare Pages 20,000 file cap")
elif n>18500: warns.append(f"{n} files: within 1,500 of the Cloudflare Pages 20,000 file cap")
# SEO: every top level page carries a canonical, a description and JSON-LD; the sitemap parses and points inside the package
for pg in [f for f in os.listdir(PKG) if f.endswith(".html") and f!="404.html"]:
    h=open(os.path.join(PKG,pg)).read()
    if 'content="noindex' in h: continue          # internal tools and hidden pages are exempt on purpose
    for need in ('rel="canonical"','name="description"','application/ld+json'):
        if need not in h: probs.append(f"{pg}: missing {need}")
# Inline JS must PARSE. A generated script that dies on a syntax error takes every button on
# the page with it, and the page still looks perfectly fine: correct markup, no server error,
# no clue. That shipped once, from an escape sequence that collapsed into a real newline in a
# generated string, and it disabled sign in entirely. Never again without the build saying so.
import subprocess, tempfile, shutil, glob as _glob, jscheck
if shutil.which("node"):
    # Only real scripts. application/ld+json blocks are data, and node would reject them.
    _js_re = re.compile(r'<script([^>]*)>([\s\S]*?)</script>', re.I)
    _type_re = re.compile(r'''type\s*=\s*["']([^"']+)''', re.I)
    _JS_TYPES = ("", "module", "text/javascript", "application/javascript")
    _pages = [os.path.join(PKG, f) for f in os.listdir(PKG) if f.endswith(".html")]
    for _sub in ("n", "rooms", "learn"):                     # generated in bulk: sample a few
        _pages += sorted(_glob.glob(os.path.join(PKG, _sub, "*.html")))[:3]
    _bad = 0
    for _pg in _pages:
        _src = open(_pg, encoding="utf-8").read()
        _blocks = []
        for _i, (_attrs, _blk) in enumerate(_js_re.findall(_src)):
            if "src=" in _attrs: continue
            _m = _type_re.search(_attrs)
            if (_m.group(1).strip().lower() if _m else "") not in _JS_TYPES: continue
            if not _blk.strip(): continue
            with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as _t:
                _t.write(_blk); _tp = _t.name
            _r = subprocess.run(["node", "--check", _tp], capture_output=True, text=True)
            os.unlink(_tp)
            if _r.returncode:
                _line = next((l.strip() for l in _r.stderr.splitlines() if "Error" in l), "parse error")
                probs.append(f"{os.path.relpath(_pg, PKG)}: inline script {_i} does not parse: {_line}")
                _bad += 1
            _blocks.append(_blk)
        # A script can parse perfectly and still call a helper that an edit deleted. That is a
        # ReferenceError on click, on a page that looks entirely healthy, and it shipped once.
        _decl = jscheck.declared_in(_blocks)
        for _i, _blk in enumerate(_blocks):
            _u = jscheck.undefined_calls(_blk, _decl)
            if _u:
                probs.append(f"{os.path.relpath(_pg, PKG)}: inline script {_i} calls undefined {_u}")
                _bad += 1
    if not _bad: print(f"inline js parses and resolves in {len(_pages)} pages")
else:
    warns.append("node not found: inline JS was not syntax checked")

import xml.etree.ElementTree as ET
try:
    tree=ET.parse(os.path.join(PKG,"sitemap.xml")); locs=[e.text for e in tree.iter() if e.tag.endswith("loc")]
    site=re.search(r'siteUrl:\s*"([^"]*)"',cfg).group(1).rstrip("/")
    # Sitemap urls are extensionless because that is what Pages serves; on disk they are .html.
    def _served(loc):
        rel = loc[len(site)+1:] or "index.html"
        for cand in (rel, rel + ".html", os.path.join(rel, "index.html")):
            if os.path.exists(os.path.join(PKG, cand)): return True
        return False
    missing=[l for l in locs if not _served(l)]
    if missing: probs.append(f"sitemap: {len(missing)} urls with no file e.g. {missing[:3]}")
    stale=[l for l in locs if l.endswith(".html")]
    if stale: probs.append(f"sitemap: {len(stale)} urls still end .html and would be indexed as redirects e.g. {stale[:3]}")
    print("sitemap urls",len(locs))
except Exception as ex: probs.append(f"sitemap unreadable: {ex}")
# the product feeds must parse and must not carry an item with no image (Google rejects those)
import xml.etree.ElementTree as _ET
try:
    _g=_ET.parse(os.path.join(PKG,"feeds","google-merchant.xml")); _items=_g.findall(".//item")
    _noimg=[i for i in _items if i.find("{http://base.google.com/ns/1.0}image_link") is None]
    if _noimg: probs.append(f"google feed: {len(_noimg)} items with no image_link")
    print("google feed items",len(_items))
except Exception as _e: probs.append(f"google feed unreadable: {_e}")
rd=open(os.path.join(PKG,"_redirects")).read()
# The census lives on its own domain and never hosted a shop, so there are no old shop urls to rescue.
# What must hold is that the campaign short links exist and none of them point back at a .html name,
# which is what caused the redirect loops on the first live deploy.
for need in ("/spin","/atlas","/read"):
    if need not in rd: probs.append(f"_redirects: the {need} short link is missing")
for line in rd.splitlines():
    if line.startswith("/") and ".html" in line.split()[-2:][0] if len(line.split())>1 else False:
        probs.append(f"_redirects: {line.split()[0]} targets a .html name and will loop")
rb=open(os.path.join(PKG,"robots.txt")).read()
if "Sitemap:" not in rb: probs.append("robots.txt has no Sitemap line")
rooms_dir=os.path.join(PKG,"assets","museum","rooms")
if not os.path.isdir(rooms_dir) or len(os.listdir(rooms_dir))<100: probs.append("museum room thumbnails missing")
if big: probs.append(f"files over 24MB: {big}")
print("\nPROBLEMS" if probs else "\nno problems"); [print(" !",x) for x in probs]
print("WARNINGS"); [print(" ~",x) for x in warns]
sys.exit(1 if probs else 0)
