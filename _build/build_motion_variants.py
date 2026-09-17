#!/usr/bin/env python3
"""Pack the Dreamina image to video variants for the site: 1080p MP4 -> small web MP4, index json keyed by piece id.
Source: DREAMINA ARCHIVE 2026-08-14 to 2026-09-08/generations.json (inputs matched to stills by image content)."""
import json, os, hashlib, subprocess
from multiprocessing import Pool
ROOT = "/Users/degens/Desktop/NEW YORKERS BY MLOW"
SRC = "/Users/degens/Desktop/DREAMINA ARCHIVE 2026-08-14 to 2026-09-08"
SITE = os.path.join(ROOT, "NEW YORKERS SITE"); OUT = os.path.join(SITE, "assets", "motion")
FF = "/Users/degens/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"
os.makedirs(OUT, exist_ok=True)
MATCHED = ("exact", "variant")

def job(r):
    src = os.path.join(SRC, "videos", r["file"])
    mp4 = os.path.join(OUT, hashlib.md5(("dreamina/" + r["file"]).encode()).hexdigest()[:12] + ".mp4")
    if not os.path.exists(mp4):
        p = subprocess.run([FF, "-y", "-loglevel", "error", "-i", src, "-vf", "scale=1280:-2", "-pix_fmt", "yuv420p",
                            "-movflags", "+faststart", "-crf", "26", "-preset", "slow", "-an", mp4], capture_output=True)
        if p.returncode != 0: return r["file"], "ffmpeg: " + p.stderr.decode()[-160:]
    return r["file"], "assets/motion/" + os.path.basename(mp4)

if __name__ == "__main__":
    rows = json.load(open(os.path.join(SRC, "generations.json")))
    use = []
    for r in rows:
        ids = list(dict.fromkeys(str(int(i["match_num"])) for i in r["inputs"]
                                 if i.get("match_num") and i.get("source") == "NEW YORKERS character" and str(i.get("confidence", "")).startswith(MATCHED)))
        if ids: use.append((r, ids))
    with Pool(4) as pool: res = dict(pool.map(job, [r for r, _ in use]))
    idx, errs = {}, [(f, v) for f, v in res.items() if v.startswith("ffmpeg")]
    for r, ids in sorted(use, key=lambda x: x[0]["created_ny"]):
        out = res[r["file"]]
        if out.startswith("ffmpeg"): continue
        for pid in ids:
            idx.setdefault(pid, []).append({"mp4": out, "sec": r["duration_s"], "cast": len(ids)})
    json.dump(idx, open(os.path.join(SITE, "_build", "motion_variants_index.json"), "w"))
    mb = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) / 1e6
    print("motion variants:", len(use), "videos,", len(idx), "pieces,", round(mb), "MB, errors:", len(errs), errs[:3])
