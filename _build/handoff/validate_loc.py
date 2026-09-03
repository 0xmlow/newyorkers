import json,sys
V=json.load(open(sys.argv[1])); inp={o['id']:o for o in json.load(open(sys.argv[2]))}; out=json.load(open(sys.argv[3]))
keys=set(V['keys']); ntas=set(V['ntas']); boros={"Manhattan","Brooklyn","Queens","Bronx","Staten Island"}
bad=0
for i in inp:
    if i not in out: print(i,"MISSING"); bad+=1
for i,o in out.items():
    if i not in inp: print(i,"not in chunk"); bad+=1; continue
    pl=o.get("place")
    if pl is None: continue
    if not isinstance(pl,str): print(i,"place must be string or null"); bad+=1; continue
    if pl.startswith("key:"):
        if pl[4:] not in keys: print(i,"unknown key",pl); bad+=1
    elif pl.startswith("nb:"):
        if pl[3:] not in ntas: print(i,"unknown neighbourhood",pl); bad+=1
    elif pl.startswith("boro:"):
        if pl[5:] not in boros: print(i,"unknown borough",pl); bad+=1
    else: print(i,"bad form",pl); bad+=1
    if "—" in (o.get("why") or "") or "–" in (o.get("why") or ""): print(i,"dash in why"); bad+=1
placed=sum(1 for o in out.values() if o.get("place"))
print(f"checked {len(out)}: {placed} placed, {len(out)-placed} left citywide, {bad} problems")
sys.exit(1 if bad else 0)
