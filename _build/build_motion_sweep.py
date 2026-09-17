#!/usr/bin/env python3
"""Pack the motion sweep (_build/motion_sweep.json) for the site.
attach -> assets/motion/<md5>.mp4, merged into motion_variants_index.json per piece (shown as MOTION variants)
reel   -> assets/motion/<md5>.mp4 + assets/mt/<key>.jpg poster, listed in motion_reel_extra.json for the MOTION reel
A gif and an mp4 of the same animation for the same piece are packed once."""
import json, os, hashlib, subprocess, io, numpy as np
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
np.seterr(all="ignore")
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(SITE, "_build"); OUT = os.path.join(SITE, "assets", "motion"); MT = os.path.join(SITE, "assets", "mt")
FF = "/Users/degens/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"
items = [x for x in json.load(open(os.path.join(B, "motion_sweep.json")))["items"] if x["decision"] in ("attach", "reel") and os.path.exists(x["src"])]
def key(src, dur=None):
    # looped short clips get their own name: the first encode of these shipped unlooped under the old name and sits in edge caches as immutable
    tag = "sweep-loop/" if (dur or 99) < 2.5 else "sweep/"
    return hashlib.md5((tag + src).encode()).hexdigest()[:12]
def pack(x):
    k = key(x["src"], x.get("dur")); mp4 = os.path.join(OUT, k + ".mp4")
    if not os.path.exists(mp4):
        vf = "scale='min(1280,iw)':-2,fps=30" if x["src"].lower().endswith(".gif") else "scale='min(1280,iw)':-2"
        loop = []
        if (x.get("dur") or 99) < 2.5:  # sub second loops stall in browsers: loop the source at encode time to about 3 seconds
            loop = ["-stream_loop", str(max(1, int(3.0 / max(x["dur"], 0.1))))]
        p = subprocess.run([FF, "-y", "-loglevel", "error", *loop, "-i", x["src"], "-vf", vf, "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-crf", "26", "-preset", "slow", "-an", mp4], capture_output=True)
        if p.returncode != 0 or not os.path.exists(mp4): return x, None, "ffmpeg: " + p.stderr.decode()[-120:]
    dur = None
    m = subprocess.run([FF, "-i", mp4], capture_output=True, text=True).stderr
    import re
    mm = re.search(r"Duration: (\d+):(\d+):([\d.]+)", m)
    if mm: dur = round(int(mm.group(2)) * 60 + float(mm.group(3)), 1)
    sig = []
    for t in ("0.05", str(max(0.1, (dur or 2) / 2))):
        fr = subprocess.run([FF, "-v", "error", "-ss", t, "-i", mp4, "-frames:v", "1", "-vf", "scale=48:-2", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
        if fr:
            im = Image.open(io.BytesIO(fr)).convert("L").resize((32, 18)); v = np.asarray(im, dtype=np.float64).ravel(); v -= v.mean(); sig.append((v / (np.linalg.norm(v) or 1)).tolist())
            if t == "0.05" and x["decision"] == "reel" and not os.path.exists(os.path.join(MT, "sw_" + k + ".jpg")):
                big = subprocess.run([FF, "-v", "error", "-ss", "0.05", "-i", mp4, "-frames:v", "1", "-vf", "scale=640:-2", "-f", "image2pipe", "-vcodec", "mjpeg", "-q:v", "4", "-"], capture_output=True).stdout
                open(os.path.join(MT, "sw_" + k + ".jpg"), "wb").write(big)
    return x, {"mp4": "assets/motion/" + k + ".mp4", "sec": dur, "key": "sw_" + k, "sig": sig}, None
with ThreadPoolExecutor(6) as ex: res = list(ex.map(pack, items))
errs = [(x["src"], e) for x, r, e in res if e]
idx = json.load(open(os.path.join(B, "motion_variants_index.json")))
idx = {pid: [m for m in lst if not m.get("sweep")] for pid, lst in idx.items()}
reel, dropped = [], 0
seen = {}
for x, r, e in sorted(res, key=lambda t: (-(t[0]["score"]), t[0]["src"].lower().endswith(".gif"))):
    if not r: continue
    grp = seen.setdefault((x["decision"], x["pid"]), [])
    if any(len(r["sig"]) == len(s) and np.mean([np.dot(a, b) for a, b in zip(r["sig"], s)]) > 0.97 for s in grp):
        dropped += 1; continue
    grp.append(r["sig"])
    if x["decision"] == "attach":
        idx.setdefault(x["pid"], []).append({"mp4": r["mp4"], "sec": r["sec"], "cast": 1, "sweep": True})
    else:
        reel.append({"key": r["key"], "src": r["mp4"], "kind": "video", "pid": None, "t": x["title"] if not x["pid"].startswith("x") else x["title"], "w": None, "h": None, "sweep": True})
json.dump({k: v for k, v in idx.items() if v}, open(os.path.join(B, "motion_variants_index.json"), "w"))
json.dump(reel, open(os.path.join(B, "motion_reel_extra.json"), "w"))
mb = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) / 1e6
print(f"sweep packed: attach {sum(1 for x, r, e in res if r and x['decision']=='attach')}, reel {sum(1 for x, r, e in res if r and x['decision']=='reel')}, twins dropped {dropped}, reel cards {len(reel)}, motion folder {round(mb)} MB, errors {len(errs)} {errs[:3]}")
