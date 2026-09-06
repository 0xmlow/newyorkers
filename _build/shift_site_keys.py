#!/usr/bin/env python3
"""Move the site side story and location keys by +24 for 5467..6966, matching the
2026-09-04 renumber of the SEEDREAM folders. Reversible from the backup folder."""
import json, glob, os, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
LO, HI, BY = 5467, 6966, 24
stamp = "_preshift_2026-09-06"
def shift(d):
    out = {}
    for k, v in d.items():
        if k.isdigit() and LO <= int(k) <= HI: out[str(int(k) + BY)] = v
        else: out[k] = v
    return out
done = 0
for pattern, bdir in [("stories/stories_v4_*.json", "stories/" + stamp), ("handoff/loc_out/out_*.json", "handoff/loc_out/" + stamp), ("handoff/loc2_out/out_*.json", "handoff/loc2_out/" + stamp), ("handoff/loc3_out/out_*.json", "handoff/loc3_out/" + stamp)]:
    for f in sorted(glob.glob(os.path.join(HERE, pattern))):
        d = json.load(open(f))
        if not any(k.isdigit() and LO <= int(k) <= HI for k in d): continue
        bd = os.path.join(HERE, bdir); os.makedirs(bd, exist_ok=True)
        b = os.path.join(bd, os.path.basename(f))
        if os.path.exists(b): print("already shifted (backup exists):", f); continue
        shutil.copy2(f, b)
        json.dump(shift(d), open(f, "w"), indent=1, ensure_ascii=False)
        done += 1; print("shifted", os.path.relpath(f, HERE), len(d))
print("files shifted:", done, datetime.datetime.now().isoformat(timespec="seconds"))
