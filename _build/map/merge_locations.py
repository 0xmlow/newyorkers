#!/usr/bin/env python3
"""Merge the agent location reads into locations.json (the curated sidecar) and a CSV for the records."""
import json,glob,os,csv,sys
SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),"handoff")  # loc_out, loc2_out, loc3_out live in _build/handoff
HERE=os.path.dirname(os.path.abspath(__file__))
out={}
for folder,default_conf in (("loc_out","stated"),("loc2_out",None),("loc3_out",None),("loc4_out",None)):
    for f in sorted(glob.glob(SC+"/"+folder+"/out_*.json")):
        for k,v in json.load(open(f)).items():
            if v and v.get("place"):
                conf=v.get("conf") or default_conf or "inferred"
                # a stated read never gets overwritten by an inferred one
                if k in out and out[k].get("conf")=="stated" and conf=="inferred": continue
                out[k]={"place":v["place"],"conf":conf,"why":v.get("why","")}
existing=dict(out)  # rebuilt from the read folders every time, so a renumber never leaves stale keys behind
json.dump({"note":"Curated location metadata read from each piece's painting prompt, title and story. place forms: key:<gazetteer key>, nb:<NTA name>, boro:<Borough>. Highest trust source for build_geo2.py.","pieces":existing},open(HERE+"/locations.json","w"),indent=1)
src=open(os.path.join(HERE,"..","..","assets","data.js")).read(); D=json.loads(src[src.index("=")+1:].strip().rstrip(";"))
by={p["id"]:p for p in D["pieces"]}
with open(HERE+"/locations.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["num","id","title","place","confidence","why"])
    for k,v in sorted(existing.items(), key=lambda kv:(by.get(kv[0],{}).get("n") or 0)):
        p=by.get(k,{}); w.writerow([p.get("n"),k,p.get("t"),v["place"],v.get("conf","stated"),v["why"]])
print("merged",len(out),"new; total curated",len(existing))
