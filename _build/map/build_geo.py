# -*- coding: utf-8 -*-
"""Build assets/geo.js : geolocates every NEW YORKERS piece and packs the NYC basemap."""
import json, re, math, random, os, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gazetteer as G

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))

# ---------------------------------------------------------------- basemap
def load_geo(p):
    with open(p) as f: return json.load(f)

def rings_of(geom):
    t, c = geom['type'], geom['coordinates']
    if t == 'Polygon': return [c[0]]
    if t == 'MultiPolygon': return [poly[0] for poly in c]
    return []

def ring_area(r):
    a = 0.0
    for i in range(len(r)):
        x1,y1 = r[i]; x2,y2 = r[(i+1)%len(r)]
        a += x1*y2 - x2*y1
    return abs(a)/2

def ring_centroid(r):
    a=0.0; cx=0.0; cy=0.0
    for i in range(len(r)):
        x1,y1=r[i]; x2,y2=r[(i+1)%len(r)]
        f=x1*y2-x2*y1; a+=f; cx+=(x1+x2)*f; cy+=(y1+y2)*f
    if abs(a) < 1e-12:
        xs=[p[0] for p in r]; ys=[p[1] for p in r]
        return (sum(xs)/len(xs), sum(ys)/len(ys))
    a*=0.5
    return (cx/(6*a), cy/(6*a))

def point_in_ring(x,y,r):
    inside=False; n=len(r); j=n-1
    for i in range(n):
        xi,yi=r[i]; xj,yj=r[j]
        if ((yi>y)!=(yj>y)) and (x < (xj-xi)*(y-yi)/((yj-yi) or 1e-12)+xi): inside = not inside
        j=i
    return inside

def rdp(pts, eps):
    if len(pts) < 3: return pts
    def d(p,a,b):
        (x,y),(x1,y1),(x2,y2)=p,a,b
        dx,dy=x2-x1,y2-y1
        if dx==0 and dy==0: return math.hypot(x-x1,y-y1)
        t=max(0,min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy)))
        return math.hypot(x-(x1+t*dx), y-(y1+t*dy))
    dmax=0; idx=0
    for i in range(1,len(pts)-1):
        dd=d(pts[i],pts[0],pts[-1])
        if dd>dmax: dmax=dd; idx=i
    if dmax>eps:
        return rdp(pts[:idx+1],eps)[:-1] + rdp(pts[idx:],eps)
    return [pts[0],pts[-1]]

def pack(ring, prec=5):
    return [[round(p[0],prec), round(p[1],prec)] for p in ring]

# representative interior point: try centroid, else sample grid inside
def interior_point(ring):
    cx,cy = ring_centroid(ring)
    if point_in_ring(cx,cy,ring): return (cx,cy)
    xs=[p[0] for p in ring]; ys=[p[1] for p in ring]
    x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
    best=None; bestd=-1
    for i in range(1,20):
        for j in range(1,20):
            x=x0+(x1-x0)*i/20; y=y0+(y1-y0)*j/20
            if point_in_ring(x,y,ring):
                d=min(x-x0,x1-x,y-y0,y1-y)
                if d>bestd: bestd=d; best=(x,y)
    return best or (cx,cy)

print("· loading basemap")
nta = load_geo(os.path.join(HERE,'nta_raw.json'))
boro = load_geo(os.path.join(HERE,'boro_raw.json'))

SKIP_KIND = re.compile(r"Cemeter|Airport|Rikers|Hart Island|Hoffman|Brother Islands|Freshkills Park|Yards \(", re.I)

# borough outlines (simplified)
boro_shapes=[]
for f in boro['features']:
    name=f['properties']['BoroName']
    rs=[r for r in rings_of(f['geometry']) if ring_area(r) > 2e-6]
    rs.sort(key=ring_area, reverse=True)
    boro_shapes.append({"n":name,"r":[pack(rdp(r,0.00045)) for r in rs[:14]]})
print("  boroughs:", [(b['n'], len(b['r'])) for b in boro_shapes])

# neighborhoods, merged by clean display name
nb = collections.OrderedDict()
for f in nta['features']:
    p=f['properties']; raw=p['ntaname']
    disp=G.clean_nta(raw)
    rs=[r for r in rings_of(f['geometry']) if ring_area(r)>1e-7]
    if not rs: continue
    rs.sort(key=ring_area, reverse=True)
    e=nb.setdefault(disp, {"name":disp,"boro":p['boroname'],"rings":[],"area":0.0,"parkish":bool(SKIP_KIND.search(raw)),"raw":[]})
    e['raw'].append(raw)
    for r in rs[:4]:
        e['rings'].append(r); e['area'] += ring_area(r)
print("  neighborhoods merged:", len(nb))

for e in nb.values():
    e['rings'].sort(key=ring_area, reverse=True)
    big = e['rings'][0]
    e['lon'], e['lat'] = interior_point(big)
    e['poly'] = [pack(rdp(r,0.00035)) for r in e['rings'][:3] if len(r)>6]

# ---------------------------------------------------------------- gazetteer
SPEC = {"landmark":10,"venue":10,"institution":10,"park":9,"island":9,"bridge":9,
        "corridor":8,"neighborhood":7,"line":6,"water":5,"transit":6,"borough":2}

places = {}   # key -> dict
def add(key, disp, kind, boro_, lat, lon, pats):
    places[key] = {"k":key,"name":disp,"kind":kind,"boro":boro_,"lat":lat,"lon":lon,
                   "pats":[p.lower() for p in pats],"spec":SPEC.get(kind,5)}

for row in G.LANDMARKS + G.LINES + G.BOROUGHS:
    add(*row)

# neighborhoods from NTA
alias_by_target = collections.defaultdict(list)
for a,t in G.NTA_ALIASES.items(): alias_by_target[t].append(a)
for disp,e in nb.items():
    if e['parkish']: continue
    key = "nb_"+re.sub(r"[^a-z0-9]+","_",disp.lower()).strip("_")
    pats = {disp.lower()} | set(alias_by_target.get(disp,[]))
    if key in places: continue
    add(key, disp, "neighborhood", e['boro'], e['lat'], e['lon'], sorted(pats))
# aliases whose target has no NTA polygon -> still register at a nearby NTA if possible
for a,t in G.NTA_ALIASES.items():
    key="nb_"+re.sub(r"[^a-z0-9]+","_",t.lower()).strip("_")
    if key in places:
        if a not in places[key]['pats']: places[key]['pats'].append(a)
print("  gazetteer places:", len(places))

# compiled patterns, longest first so "brighton beach" beats "brighton"
COMPILED=[]
for pk,p in places.items():
    for pat in p['pats']:
        COMPILED.append((len(pat), pat, re.compile(r"(?<![a-z0-9])"+re.escape(pat)+r"(?![a-z0-9])"), pk))
COMPILED.sort(key=lambda x:-x[0])

# ---------------------------------------------------------------- pieces
src=open(os.path.join(SITE,'assets','data.js')).read()
DATA=json.loads(src[src.index('=')+1:].strip().rstrip(';'))
pieces=DATA['pieces']
print("· geocoding", len(pieces), "pieces")

BORO_CANON={"manhattan":"Manhattan","brooklyn":"Brooklyn","queens":"Queens","bronx":"Bronx",
            "the bronx":"Bronx","staten island":"Staten Island"}

def parse_bfield(b):
    """'Manhattan (Harlem)' -> ('Manhattan','Harlem')"""
    if not b: return (None,None)
    m=re.match(r"^([^(/]+?)(?:\s*\((.+)\))?$", b.strip())
    if not m: return (None,None)
    head=m.group(1).strip().lower(); inner=(m.group(2) or '').strip()
    return (BORO_CANON.get(head), inner or None)

def norm(s):
    return (s or '').lower().replace('’',"'").replace('—',' ').replace('–',' ')

matched=collections.Counter()
out_pieces=[]
place_hits=collections.Counter()

for x in pieces:
    title=norm(x.get('t')); story=norm(x.get('story')); bfield=x.get('b') or ''
    bboro, binner = parse_bfield(bfield)
    hay_b = norm(binner or '')
    best=None
    for ln, pat, rx, pk in COMPILED:
        p=places[pk]
        sc=0; where=None; pos=999
        m=rx.search(hay_b)
        if m: sc=max(sc, p['spec']*4); where='boro-field'; pos=m.start()
        m=rx.search(title)
        if m: 
            v=p['spec']*3
            if v>sc: sc=v; where='title'; pos=m.start()
        m=rx.search(story)
        if m:
            v=p['spec']*1 + (2 if m.start()<60 else 0)
            if v>sc: sc=v; where='story'; pos=m.start()
        if not sc: continue
        if bboro and p['boro']==bboro: sc+=3
        if bboro and p['boro'] not in (bboro,'Citywide') and p['kind']!='line': sc-=4
        sc += ln*0.01
        if best is None or sc>best[0]: best=(sc,pk,where,ln)
    rec={"n":x['n']}
    if best and best[0]>0:
        pk=best[1]; p=places[pk]
        rec.update({"p":pk,"lat":p['lat'],"lon":p['lon'],"src":best[2],
                    "prec":("exact" if p['spec']>=8 else "area" if p['spec']>=6 else "boro")})
        matched[best[2]]+=1; place_hits[pk]+=1
    else:
        rec["p"]=None
        matched['none']+=1
    # fallback borough from the b field even when unmatched
    if rec.get("p") is None and bboro:
        pk="boro_"+bboro.lower().replace(' ','_')
        pk={"boro_manhattan":"boro_manhattan","boro_brooklyn":"boro_brooklyn","boro_queens":"boro_queens",
            "boro_bronx":"boro_bronx","boro_staten_island":"boro_staten"}.get(pk,pk)
        if pk in places:
            p=places[pk]
            rec.update({"p":pk,"lat":p['lat'],"lon":p['lon'],"src":"boro-field","prec":"boro"})
            matched['none']-=1; matched['boro-fallback']+=1; place_hits[pk]+=1
    out_pieces.append(rec)

print("  match sources:", dict(matched))
print("  distinct places used:", len(place_hits))
print("  top places:", place_hits.most_common(25))
json.dump({"pieces":out_pieces,"places":places,"nb":{k:{"name":v['name'],"boro":v['boro'],"lat":v['lat'],"lon":v['lon'],"poly":v['poly'],"park":v['parkish']} for k,v in nb.items()},"boro":boro_shapes},
          open(os.path.join(HERE,'geo_stage1.json'),'w'))
print("· stage1 written")
