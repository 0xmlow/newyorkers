#!/usr/bin/env python3
"""Pull archive files filed under the wrong New Yorker out of data.js without a full data rebuild.

curation.json "misfiled" lists archive paths that belong to someone else (first case: the Grand Central
Oyster Bar waiter saved as 522 Spider-Man). build_data_v4.py skips the same paths, so a --data build agrees.
Drops the matching state keys, gifs, videos and loop reel entries, then corrects the counts by what it dropped. Idempotent."""
import json, os, hashlib
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(SITE, "_build")
_cur = json.load(open(os.path.join(BUILD, "curation.json")))
# adopted files keep their place on the new record, so they are not dropped
_kept = {r for a in _cur.get("adopted", []) for r in a["files"] + a.get("gifs", []) + a.get("videos", [])}
MIS = set(_cur.get("misfiled", [])) - _kept

def key(rel): return "h" + hashlib.md5(rel.encode()).hexdigest()[:10]

path = os.path.join(SITE, "assets", "data.js")
s = open(path).read()
head = s[:s.index("{")]
data = json.loads(s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1])
keys = {key(r) for r in MIS}
C = data["counts"]
dropped = 0
for p in data["pieces"]:
    st = p.get("st") or []
    keep = [k for k in st if k not in keys]
    if keep and len(keep) != len(st):
        C["states"] -= len(st) - len(keep)
        if len(keep) == 1: C["multiState"] -= 1
        dropped += len(st) - len(keep); p["st"] = keep
    for f, c in (("g", "gifs"), ("v", "videos")):
        if p.get(f):
            n = len(p[f]); p[f] = [r for r in p[f] if r not in MIS]
            C[c] -= n - len(p[f]); dropped += n - len(p[f])
motion = []
for m in data["motion"]:
    if m.get("src") in MIS:
        C["motionAttached" if m.get("pid") else "loopReel"] -= 1
        if not m.get("pid"): C["gifs" if m["kind"] == "gif" else "videos"] -= 1
        dropped += 1
    else: motion.append(m)
data["motion"] = motion
if dropped:
    open(path, "w").write(head + json.dumps(data, separators=(",", ":")) + ";\n")
print(f"misfiled: dropped {dropped} references" if dropped else "misfiled: nothing to drop")
