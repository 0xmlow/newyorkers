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
missing_media=[m for p in P for m in (p.get("g") or [])+(p.get("v") or []) if not os.path.exists(os.path.join(PKG,m))]
missing_motion=[m["src"] for m in D["motion"] if not os.path.exists(os.path.join(PKG,m["src"]))]+[m["alt"] for m in D["motion"] if m.get("alt") and not os.path.exists(os.path.join(PKG,m["alt"]))]
missing_mt=[m["key"] for m in D["motion"] if not os.path.exists(os.path.join(PKG,"assets","mt",m["key"]+".jpg"))]
missing_live=[v["src"] for v in D["story"]["living"]["videos"]+D["story"]["living"]["gifs"] if not os.path.exists(os.path.join(PKG,v["src"]))]
missing_atlas=[a for a in range(D["counts"]["atlases"]) if not os.path.exists(os.path.join(PKG,"assets","atlas",f"{D['counts']['atlasPrefix']}{a}.jpg"))]
missing_stk=[s["f"] for s in D["stickers"] if not os.path.exists(os.path.join(PKG,"assets","stickers",s["f"]))]
for name,lst in [("thumbs",missing_t),("glitch mp4",missing_gl),("glitch stills",missing_glst),("piece media",missing_media),("motion",missing_motion),("motion posters",missing_mt),("living city",missing_live),("atlases",missing_atlas),("stickers",missing_stk)]:
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
pages=[f for f in os.listdir(PKG) if f.endswith(".html")]
for pg in pages:
    h=open(os.path.join(PKG,pg)).read()
    for m in re.findall(r'(?:href|src)="([^"#?]+)[^"]*"',h):
        if m.startswith(("http","mailto","data:","//")) or "${" in m: continue
        if not os.path.exists(os.path.join(PKG,m)): probs.append(f"{pg}: broken ref {m}")
    for bad in ("—","–"):
        if bad in h: probs.append(f"{pg}: contains a dash character")
    for stale in ("1,841","2,266 characters","3,466","802 cuts"):
        if stale in h: warns.append(f"{pg}: stale number {stale!r}")
    if "<title>" not in h: probs.append(f"{pg}: no title")
for req in ("robots.txt","404.html","_headers","og.jpg","assets/config.js"):
    if not os.path.exists(os.path.join(PKG,req)): probs.append(f"missing {req}")
cfg=open(os.path.join(PKG,"assets","config.js")).read()
if 'formspree: ""' in cfg: warns.append("formspree id empty: the census form falls back to an email draft")
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
if big: probs.append(f"files over 24MB: {big}")
print("\nPROBLEMS" if probs else "\nno problems"); [print(" !",x) for x in probs]
print("WARNINGS"); [print(" ~",x) for x in warns]
sys.exit(1 if probs else 0)
