# -*- coding: utf-8 -*-
"""Final geo build -> assets/geo.js"""
import json, re, math, random, os, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gazetteer as G
from gazetteer_extra import EXTRA
from gazetteer_extra2 import EXTRA2, BOARD_ANCHORS, NUMBER_WORDS

HERE=os.path.dirname(os.path.abspath(__file__)); SITE=os.path.abspath(os.path.join(HERE,'..','..'))
exec(open(os.path.join(HERE,'build_geo.py')).read().split("# ---------------------------------------------------------------- gazetteer")[0].split("print(\"· loading basemap\")")[0])

def load_geo(p):
    with open(p) as f: return json.load(f)

nta=load_geo(os.path.join(HERE,'nta_raw.json')); boro=load_geo(os.path.join(HERE,'boro_raw.json'))
SKIP_KIND=re.compile(r"Cemeter|Airport|Rikers|Hart Island|Hoffman|Brother Islands|Freshkills Park|Yards \(",re.I)

boro_shapes=[]; boro_rings={}
for f in boro['features']:
    name=f['properties']['BoroName']
    rs=[r for r in rings_of(f['geometry']) if ring_area(r)>2e-6]
    rs.sort(key=ring_area,reverse=True)
    boro_shapes.append({"n":name,"r":[pack(rdp(r,0.00040)) for r in rs[:14]]})
    boro_rings[name]=rs[:14]

nb=collections.OrderedDict()
for f in nta['features']:
    p=f['properties']; disp=G.clean_nta(p['ntaname'])
    rs=[r for r in rings_of(f['geometry']) if ring_area(r)>1e-7]
    if not rs: continue
    rs.sort(key=ring_area,reverse=True)
    e=nb.setdefault(disp,{"name":disp,"boro":p['boroname'],"rings":[],"parkish":bool(SKIP_KIND.search(p['ntaname']))})
    for r in rs[:4]: e['rings'].append(r)
for e in nb.values():
    e['rings'].sort(key=ring_area,reverse=True)
    e['lon'],e['lat']=interior_point(e['rings'][0])
    e['poly']=[pack(rdp(r,0.00035)) for r in e['rings'][:3] if len(r)>6]

SPEC={"landmark":10,"venue":10,"institution":10,"park":9,"island":9,"bridge":9,
      "corridor":8,"neighborhood":7,"line":6,"water":5,"transit":6,"borough":2}
places={}
def add(key,disp,kind,boro_,lat,lon,pats):
    if key in places:
        for p in pats:
            if p.lower() not in places[key]['pats']: places[key]['pats'].append(p.lower())
        return
    places[key]={"k":key,"name":disp,"kind":kind,"boro":boro_,"lat":lat,"lon":lon,
                 "pats":[p.lower() for p in pats],"spec":SPEC.get(kind,5)}
for row in G.LANDMARKS+EXTRA+EXTRA2+G.LINES+G.BOROUGHS: add(*row)
# the 59 community boards, anchored on their signature neighbourhood
BORO_WORDS={"Manhattan":["manhattan"],"Brooklyn":["brooklyn"],"Queens":["queens"],"Bronx":["the bronx","bronx"],"Staten Island":["staten island"]}
for bname,anchors in BOARD_ANCHORS.items():
    for i,nbname in enumerate(anchors,1):
        e=nb.get(nbname)
        if not e: print("  ! no NTA for board anchor",nbname); continue
        pats=[]
        for w in BORO_WORDS[bname]:
            pats+= [f"{w} board {NUMBER_WORDS[i]}", f"{w} board {i}", f"{w} community board {i}", f"community board {i} {w}"]
        key=f"cb_{bname.lower().replace(' ','_')}_{i}"
        add(key,f"{bname} Community Board {i}","neighborhood",bname,e['lat'],e['lon'],pats)
# spelled-out ordinals for every numbered street pattern ("14th street" -> "fourteenth street")
def ordinal_words(n):
    ones=["","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth","eleventh","twelfth",
          "thirteenth","fourteenth","fifteenth","sixteenth","seventeenth","eighteenth","nineteenth"]
    tens=["","","twent","thirt","fort","fift","sixt","sevent","eight","ninet"]
    onesc=["","one","two","three","four","five","six","seven","eight","nine"]
    if n<20: return [ones[n]]
    if n<100:
        t,o=divmod(n,10)
        if o==0: return [tens[t]+"ieth"]
        return [f"{tens[t]}y {ones[o]}", f"{tens[t]}y-{ones[o]}"]
    h,r=divmod(n,100)
    rest=ordinal_words(r) if r else ["hundredth"]
    out=[]
    for w in rest:
        if r: out+= [f"{onesc[h]} hundred {w}", f"{onesc[h]} hundred and {w}", f"hundred {w}"]
        else: out.append(f"{onesc[h]} {w}")
    return out
for pk,p in list(places.items()):
    extra=[]
    for pat in p['pats']:
        m=re.match(r"^(\d+)(?:st|nd|rd|th) (street|avenue)$",pat)
        if m:
            for w in ordinal_words(int(m.group(1))): extra.append(f"{w} {m.group(2)}")
    for x in extra:
        if x not in p['pats']: p['pats'].append(x)
alias_by_target=collections.defaultdict(list)
for a,t in G.NTA_ALIASES.items(): alias_by_target[t].append(a)
for disp,e in nb.items():
    if e['parkish']: continue
    key="nb_"+re.sub(r"[^a-z0-9]+","_",disp.lower()).strip("_")
    add(key,disp,"neighborhood",e['boro'],e['lat'],e['lon'],sorted({disp.lower()}|set(alias_by_target.get(disp,[]))))
for a,t in G.NTA_ALIASES.items():
    key="nb_"+re.sub(r"[^a-z0-9]+","_",t.lower()).strip("_")
    if key in places and a not in places[key]['pats']: places[key]['pats'].append(a)

COMPILED=[]
for pk,p in places.items():
    for pat in p['pats']:
        COMPILED.append((len(pat),pat,re.compile(r"(?<![a-z0-9])"+re.escape(pat)+r"(?![a-z0-9])"),pk))
COMPILED.sort(key=lambda x:-x[0])
print("· gazetteer:",len(places),"places /",len(COMPILED),"patterns")

# --------------------------------------------------- scene taxonomy
SCENES=[
 ("Subway",  ["subway","platform","turnstile","turnstiles","straphanger","metrocard","omny","token","conductor","mezzanine","showtime","swipe","fare","station","train","trains","rails","tracks","tunnel","express","local","car","carriage","strap","booth","transfer","stops","stop","commute","commuters","rider","riders","l train","7 train","a train","g train","the el","elevated"]),
 ("Street",  ["sidewalk","crosswalk","curb","corner","intersection","avenue","block","jaywalk","traffic","street","hydrant","scaffold","scaffolding","construction","pothole","potholes","asphalt","pavement","gutter","crossing","lights","signal","honk","horns","cones","meter","parking","alternate","garbage","trash","bags","cart","carts","delivery","bike","bikes","e-bike","cab","taxi","bus","truck","van","siren","sirens"]),
 ("Stoop",   ["stoop","stoops","steps","brownstone","brownstones","neighbor","neighbors","super","buzzer","vestibule","block party","doorway","porch","railing","banister","tenement","walk-up","landlord","tenant","rent","lease","eviction","building","super's"]),
 ("Rooftop", ["rooftop","rooftops","roof","roofs","tar beach","water tower","water towers","fire escape","skyline","penthouse","terrace","pigeon coop","antenna","chimney","cornice","above the city","tower","towers","spire","crane","cranes","window washer","sky","clouds","helicopter"]),
 ("Bodega",  ["bodega","deli","egg and cheese","bacon egg","chopped cheese","corner store","register","counter","awning","lotto","cat","sandwich","coffee","cup","halal","cart","dollar slice","slice","pizza","bagel","bagels","donut","diner","luncheonette","takeout","menu"]),
 ("Interior",["apartment","kitchen","radiator","hallway","elevator","lobby","sublet","bathroom","couch","bed","closet","mailbox","basement","laundry","laundromat","bedroom","living room","fridge","stove","sink","shower","wall","walls","ceiling","floorboards","doorman","studio","loft","roommate","roommates","furniture","lamp"]),
 ("Park",    ["park","bench","benches","playground","lawn","tree","trees","pigeon","pigeons","squirrel","squirrels","garden","field","dog run","reservoir","pond","grass","leaves","blossom","blossoms","petals","branches","meadow","path","paths","fountain","carousel","zoo","picnic","hawk","owl","geese","raccoon","flowers"]),
 ("Water",   ["river","harbor","ferry","pier","piers","water","beach","boardwalk","tide","bay","shore","dock","bridge","bridges","waves","surf","boat","boats","tug","tugboat","barge","ship","ships","gulls","seagull","canal","creek","waterfront","esplanade","lighthouse","channel","sand","ocean"]),
 ("Night",   ["club","bar","dj","dance floor","afters","bouncer","last call","party","rave","4am","3am","2am","after hours","speakeasy","dive","neon","cocktail","bottle","doorman rope","velvet rope","booth","sound system","basement party","warehouse party","set","midnight","nightlife","drinks","karaoke"]),
 ("Work",    ["shift","crew","job","site","office","driver","vendor","warehouse","shop","union","boss","desk","uniform","apron","tools","ladder","helmet","clipboard","register","overtime","paycheck","interview","resume","meeting","clock","nurse","teacher","cook","barber","tailor","mechanic","porter","doorman","dispatcher","operator","inspector"]),
 ("Civic",   ["school","library","hospital","precinct","courthouse","church","synagogue","mosque","temple","firehouse","polling","dmv","clinic","classroom","city hall","mayor","parade","ballot","vote","protest","march","hearing","permit","census","jury","flag","memorial","monument","statue","museum","gallery","exhibit"]),
 ("Weather", ["snow","rain","heat wave","blizzard","storm","fog","ice","humidity","sun","sunrise","sunset","moon","spring","summer","autumn","fall","winter","season","january","february","march","april","may","june","july","august","september","october","november","december","cold","hot","steam","frost","wind","puddle","slush","umbrella","thunder"]),
]
SC_RX=[(n,[re.compile(r"(?<![a-z])"+re.escape(w)+r"(?![a-z])") for w in ws]) for n,ws in SCENES]
SC_W={"Subway":1.25,"Bodega":1.2,"Stoop":1.15,"Rooftop":1.15,"Night":1.15,"Water":1.1,
      "Park":1.05,"Civic":1.0,"Interior":1.0,"Work":1.0,"Weather":0.95,"Street":0.85}
def scene_of(t,s):
    hay=(t+' . '+t+' . '+s).lower()
    best=None;bestc=0
    for name,rxs in SC_RX:
        c=sum(1 for rx in rxs if rx.search(hay))*SC_W.get(name,1.0)
        if c>bestc: bestc=c;best=name
    return best or "Citywide"

# --------------------------------------------------- geocode
src=open(os.path.join(SITE,'assets','data.js')).read()
DATA=json.loads(src[src.index('=')+1:].strip().rstrip(';'))
pieces=DATA['pieces']
BORO_CANON={"manhattan":"Manhattan","brooklyn":"Brooklyn","queens":"Queens","bronx":"Bronx","the bronx":"Bronx","staten island":"Staten Island"}
def parse_bfield(b):
    if not b: return (None,None)
    m=re.match(r"^([^(/]+?)(?:\s*\((.+)\))?$",b.strip())
    if not m: return (None,None)
    return (BORO_CANON.get(m.group(1).strip().lower()),(m.group(2) or '').strip() or None)
def norm(s): return (s or '').lower().replace('’',"'").replace('—',' ').replace('–',' ')

# curated location metadata (locations.json, written from the painting prompts 2026-09-03)
CURATED={}
cur_path=os.path.join(HERE,'locations.json')
if os.path.exists(cur_path):
    CURATED=json.load(open(cur_path)).get('pieces',{})
NB_KEY={disp:"nb_"+re.sub(r"[^a-z0-9]+","_",disp.lower()).strip("_") for disp in nb}
BORO_KEY={"Manhattan":"boro_manhattan","Brooklyn":"boro_brooklyn","Queens":"boro_queens","Bronx":"boro_bronx","Staten Island":"boro_staten"}
def resolve_curated(entry):
    pl=(entry or {}).get('place')
    if not pl: return None
    if pl.startswith('key:'): k=pl[4:]; return k if k in places else None
    if pl.startswith('nb:'):
        k=NB_KEY.get(pl[3:]);
        if k and k in places: return k
        # parkish NTAs are not in places; anchor on the NTA centroid directly
        e=nb.get(pl[3:])
        if e:
            add("nbp_"+re.sub(r"[^a-z0-9]+","_",pl[3:].lower()),pl[3:],"park",e['boro'],e['lat'],e['lon'],[pl[3:].lower()])
            return "nbp_"+re.sub(r"[^a-z0-9]+","_",pl[3:].lower())
        return None
    if pl.startswith('boro:'): return BORO_KEY.get(pl[5:])
    return None
print("· curated locations:",len(CURATED))
stats=collections.Counter(); place_hits=collections.Counter(); recs=[]; n_cur=0
for x in pieces:
    title=norm(x.get('t')); story=norm(x.get('story')); prompt=norm(x.get('p')); bboro,binner=parse_bfield(x.get('b') or '')
    hay_b=norm(binner or ''); best=None
    for ln,pat,rx,pk in COMPILED:
        p=places[pk]; sc=0; where=None
        m=rx.search(hay_b)
        if m: sc=p['spec']*4; where='borough field'
        m=rx.search(title)
        if m and p['spec']*3>sc: sc=p['spec']*3; where='title'
        m=rx.search(story)
        if m:
            v=p['spec']+(2 if m.start()<60 else 0)
            if v>sc: sc=v; where='story'
        m=rx.search(prompt)
        if m:
            v=p['spec']*0.9+(1 if m.start()<80 else 0)
            if v>sc: sc=v; where='prompt'
        if not sc: continue
        if bboro and p['boro']==bboro: sc+=3
        if bboro and p['boro'] not in (bboro,'Citywide') and p['kind']!='line': sc-=4
        sc+=ln*0.01
        if best is None or sc>best[0]: best=(sc,pk,where)
    if best is None and bboro:
        pk={"Manhattan":"boro_manhattan","Brooklyn":"boro_brooklyn","Queens":"boro_queens","Bronx":"boro_bronx","Staten Island":"boro_staten"}[bboro]
        best=(1,pk,'borough field')
    # the curated read of the prompt wins whenever it is more specific than what the regexes found
    ck=resolve_curated(CURATED.get(x['id']))
    inferred=False
    if ck and (best is None or places[ck]['spec']>=places[best[1]]['spec']):
        inferred=(CURATED.get(x['id']) or {}).get('conf')=='inferred'
        best=(99,ck,'inferred from the scene' if inferred else 'the prompt, read by hand'); n_cur+=1
    rec={"id":x['id'],"n":x.get('n'),"sc":scene_of(x.get('t') or '',x.get('story') or '')}
    if best:
        pk=best[1]; p=places[pk]
        rec.update({"p":pk,"lat":p['lat'],"lon":p['lon'],"src":best[2],
                    "prec":"site" if p['spec']>=8 else ("area" if p['spec']>=5 else "borough")})
        if inferred: rec["inf"]=1
        stats[rec['prec']]+=1; place_hits[pk]+=1
    else:
        rec["p"]=None; rec["prec"]="citywide"; stats['citywide']+=1
    recs.append(rec)
print("· precision:",dict(stats),"· curated placements used:",n_cur)

# --------------------------------------------------- deterministic jitter + ambient scatter
def rng_for(key):
    import hashlib
    h=int(hashlib.md5(str(key).encode()).hexdigest()[:12],16)
    return random.Random(h)
# fan out co-located pins on a golden-angle spiral (~ up to 260 m)
bucket=collections.Counter()
for r in recs:
    if r["p"]:
        i=bucket[r["p"]]; bucket[r["p"]]+=1
        if i:
            ang=i*2.39996; rad=0.00028*math.sqrt(i)
            r["lat"]=round(r["lat"]+rad*math.sin(ang),6)
            r["lon"]=round(r["lon"]+rad*math.cos(ang)/0.757,6)
        else:
            r["lat"]=round(r["lat"],6); r["lon"]=round(r["lon"],6)

allrings=[(n,r) for n,rs in boro_rings.items() for r in rs]
bbox=(min(p[0] for _,r in allrings for p in r),max(p[0] for _,r in allrings for p in r),
      min(p[1] for _,r in allrings for p in r),max(p[1] for _,r in allrings for p in r))
def scatter(n):
    rr=rng_for(n)
    for _ in range(400):
        x=rr.uniform(bbox[0],bbox[1]); y=rr.uniform(bbox[2],bbox[3])
        for bn,ring in allrings:
            if point_in_ring(x,y,ring): return round(y,6),round(x,6),bn
    return 40.72,-73.95,"Brooklyn"
for r in recs:
    if not r["p"]:
        la,lo,bn=scatter(r["id"]); r["lat"]=la; r["lon"]=lo; r["amb"]=1; r["boro"]=bn

# --------------------------------------------------- neighborhood assignment for every piece
nb_rings=[(k,rr) for k,v in nb.items() for rr in v['rings'][:3]]
def nb_at(lat,lon):
    for k,ring in nb_rings:
        if point_in_ring(lon,lat,ring): return k
    return None
# a piece counts toward a neighbourhood only when it is pinned to a real ground
# feature. Borough scatter, whole boroughs, subway lines and the system as a whole
# are diffuse by nature and would otherwise pile into whichever NTA holds their anchor.
DIFFUSE={'borough','line','transit'}
cnt_loc=collections.Counter(); cnt_amb=collections.Counter(); cnt_diff=collections.Counter()
for r in recs:
    k=nb_at(r["lat"],r["lon"])
    if k: r["nb"]=k
    if r["p"]:
        pl=places[r["p"]]; r["boro"]=pl["boro"]
        solid = (not r.get("spread")) and pl["kind"] not in DIFFUSE
        r["hd"]=1 if solid else 0
        if k:
            if solid: cnt_loc[k]+=1
            else: cnt_diff[k]+=1
    else:
        if k: cnt_amb[k]+=1

# --------------------------------------------------- pack output
out_places={}
for k,c in place_hits.items():
    p=places[k]
    out_places[k]={"name":p['name'],"kind":p['kind'],"boro":p['boro'],
                   "lat":round(p['lat'],6),"lon":round(p['lon'],6),"n":c}
out_nb={}
for k,v in nb.items():
    out_nb[k]={"name":v['name'],"boro":v['boro'],"lat":round(v['lat'],5),"lon":round(v['lon'],5),
               "poly":v['poly'],"park":1 if v['parkish'] else 0,
               "nl":cnt_loc.get(k,0),"na":cnt_amb.get(k,0),"nd":cnt_diff.get(k,0)}
out={"generated":"build_geo2","boro":boro_shapes,"nb":out_nb,"places":out_places,
     "pieces":[{k:v for k,v in r.items() if v is not None} for r in recs],
     "scenes":[s[0] for s in SCENES]+["Citywide"],
     "stats":{"site":stats['site'],"area":stats['area'],"borough":stats['borough'],"citywide":stats['citywide'],"inferred":sum(1 for r in recs if r.get("inf")),
              "places":len(out_places),"neighborhoods":len(out_nb),"gazetteer":len(places),"patterns":len(COMPILED)}}
path=os.path.join(SITE,'assets','geo.js')
with open(path,'w') as f:
    f.write("window.NY_GEO=")
    json.dump(out,f,separators=(',',':'))
    f.write(";\n")
print("· wrote",path,round(os.path.getsize(path)/1024),"KB")
# ---- write the location back into data.js (loc, b, prec) and a full tracking sheet
by_rec={r['id']:r for r in recs}
PREC_TXT={"site":"site","area":"area","borough":"borough","citywide":"citywide"}
for x in pieces:
    r=by_rec[x['id']]
    if r.get('p'):
        pl=places[r['p']]; x['loc']=pl['name']; x['prec']=r['prec']
        if not x.get('b'): x['b']=pl['boro'] if pl['boro']!='Citywide' else ''
        x['locsrc']=r.get('src','')
        if r.get('inf'): x['inf']=1
        elif 'inf' in x: del x['inf']
    else:
        x['loc']=''; x['prec']='citywide'; x['locsrc']=''
    if r.get('nb') and r.get('p') and places[r['p']]['kind'] not in DIFFUSE: x['nb']=r['nb']
    elif 'nb' in x: del x['nb']
DATA['counts']['located']=sum(1 for x in pieces if x.get('loc'))
with open(os.path.join(SITE,'assets','data.js'),'w') as f:
    f.write("window.NY_DATA = "); json.dump(DATA,f,separators=(',',':')); f.write(";\n")
print("· data.js updated with loc/b/prec for",len(pieces),"pieces")
import csv
sheet=os.path.join(SITE,'..','00_TRACKING_SPREADSHEETS','NEW_YORKERS_LOCATIONS.csv')
with open(sheet,'w',newline='') as f:
    w=csv.writer(f); w.writerow(["Piece #","Name","Era","Family","Borough","Place","Place kind","Neighbourhood","Precision","Confidence","Matched on","Lat","Lon"])
    for x in sorted(pieces,key=lambda x:(x.get('n') is None, x.get('n') or 0)):
        r=by_rec[x['id']]; pl=places[r['p']] if r.get('p') else None
        w.writerow([x.get('n'),x['t'],x['e'],x.get('f',''),(x.get('b') or '') if pl else '',pl['name'] if pl else '',pl['kind'] if pl else '',(r.get('nb','') if (pl and pl['kind'] not in DIFFUSE) else ''),r['prec'],('inferred' if r.get('inf') else ('stated' if pl else '')),r.get('src',''),r['lat'] if pl else '',r['lon'] if pl else ''])
print("· wrote",sheet)
print("· scenes:",collections.Counter(r['sc'] for r in recs).most_common())
print("· top places:",place_hits.most_common(20))
print("· neighborhoods with located pieces:",sum(1 for v in out_nb.values() if v['nl']))
print("· top neighbourhoods:",sorted(((v["nl"],v["name"]) for v in out_nb.values()),reverse=True)[:14])
