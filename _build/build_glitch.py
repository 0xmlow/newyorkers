#!/usr/bin/env python3
"""Pack the MOSHED VARIANTS glitch editions for the site: GIF -> small MP4, still -> thumb, index json."""
import json, os, hashlib, subprocess, sys
from multiprocessing import Pool
ROOT="/Users/degens/Desktop/NEW YORKERS BY MLOW"; SRC=os.path.join(ROOT,"MOSHED VARIANTS 2026-08-30")
SITE=os.path.join(ROOT,"NEW YORKERS SITE"); OUT=os.path.join(SITE,"assets","glitch"); THUMB=os.path.join(SITE,"assets","t")
FF="/Users/degens/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"
os.makedirs(OUT,exist_ok=True)
def tkey(rel): return "h"+hashlib.md5(rel.encode()).hexdigest()[:10]
def mkey(rel): return hashlib.md5(rel.encode()).hexdigest()[:12]
rows=[json.loads(l) for l in open(os.path.join(SRC,"manifest.jsonl"))]
def job(r):
    gif=os.path.join(SRC,r["gif"]); still=os.path.join(SRC,r["still"])
    if not os.path.exists(gif): return (r["token"],None)
    rel_gif="MOSHED VARIANTS 2026-08-30/"+r["gif"]; rel_still="MOSHED VARIANTS 2026-08-30/"+r["still"]
    mp4=os.path.join(OUT,mkey(rel_gif)+".mp4")
    if not os.path.exists(mp4):
        p=subprocess.run([FF,"-y","-loglevel","error","-i",gif,"-vf","scale=1280:-2","-pix_fmt","yuv420p","-movflags","+faststart","-crf","26","-an",mp4],capture_output=True)
        if p.returncode!=0: return (r["token"],"ffmpeg: "+p.stderr.decode()[-120:])
    th=os.path.join(THUMB,tkey(rel_still)+".jpg")
    if not os.path.exists(th) and os.path.exists(still):
        from PIL import Image
        im=Image.open(still).convert("RGB"); im.thumbnail((1000,1000),Image.LANCZOS); im.save(th,"JPEG",quality=78,optimize=True)
    return (r["token"],{"mp4":"assets/glitch/"+os.path.basename(mp4),"st":tkey(rel_still) if os.path.exists(th) else None,"fam":r.get("familyName"),"tag":r.get("tag"),"loop":r.get("loopSec")})
if __name__=="__main__":
    with Pool(4) as pool: res=pool.map(job,rows,chunksize=4)
    idx={t:v for t,v in res if isinstance(v,dict)}; errs=[(t,v) for t,v in res if isinstance(v,str)]
    json.dump(idx,open(os.path.join(SITE,"_build","glitch_index.json"),"w"))
    print("glitch index:",len(idx),"errors:",len(errs),errs[:3])
