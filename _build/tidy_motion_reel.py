#!/usr/bin/env python3
"""Tidy the MOTION reel in assets/data.js. Idempotent, runs on every build.
1. STILL WAITING is a separate collection: its clips (the "Empty scene" plates) never ship here.
2. One card per subject: every loop and film of the same census piece, and every gif/mp4 cut of the
   same unnumbered scene, collapse into one entry whose `cuts` list holds them all as variants."""
import json, os, re
import numpy as np
np.seterr(all="ignore")
from PIL import Image
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(SITE, "assets", "data.js")
s = open(path).read()
head = s[:s.index("{")]; data = json.loads(s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1])

STILL_WAITING = re.compile(r"empty-scene", re.I)
# pairs confirmed by eye below the automatic threshold (poster frames differ between cuts)
SAME_SCENE = [("The Platform Violinist", "The Platform Violinist"), ("Oud Under The Neon", "The Hookah Lounge Oud"),
              ("The Central Park Carriage", "Top Hat And Horse"), ("The Subway Mariachi", "Serenade On The Local")]
AUTO = 0.85
# reel clips of numbered pieces, confirmed side by side on 2026-09-16: roll them into the piece
ATTACH = {"The Jamaica Queens Diva": "639", "The Sidewalk Book Stacks": "491", "The Red Carpet Descent": "626", "The Empire State Doorman": "572"}

# flatten any earlier tidy so the step can rerun from its own output
flat = []
for m in data["motion"]:
    for c in (m.get("cuts") or [{"src": m["src"], "kind": m["kind"], "key": m["key"], "t": m["t"], "w": m.get("w"), "h": m.get("h")}]):
        flat.append({"key": c["key"], "src": c["src"], "kind": c["kind"], "pid": m.get("pid"), "t": c.get("t") or m["t"], "w": c.get("w"), "h": c.get("h")})
    if m.get("alt") and not m.get("cuts"):
        flat.append({"key": m["key"] + "~alt", "src": m["alt"], "kind": "video", "pid": m.get("pid"), "t": m["t"], "w": m.get("w"), "h": m.get("h"), "poster": m["key"]})
extra = os.path.join(SITE, "_build", "motion_reel_extra.json")
if os.path.exists(extra):
    have = {m["src"] for m in flat}
    flat += [dict(m) for m in json.load(open(extra)) if m["src"] not in have]
by_id = {p["id"]: p for p in data["pieces"]}
for m in flat:
    pid = ATTACH.get(m["t"])
    if not m["pid"] and pid in by_id:
        m["pid"] = pid; p = by_id[pid]
        lst = p.setdefault("g" if m["kind"] == "gif" else "v", [])
        if m["src"] not in lst: lst.append(m["src"])
dropped = [m["src"] for m in flat if STILL_WAITING.search(m["src"])]
for f in os.listdir(os.path.join(SITE, "assets", "mt")):
    if STILL_WAITING.search(f): os.remove(os.path.join(SITE, "assets", "mt", f)); dropped.append("poster " + f)
flat = [m for m in flat if not STILL_WAITING.search(m["src"])]

def vec(key):
    try:
        im = Image.open(os.path.join(SITE, "assets", "mt", key.split("~")[0] + ".jpg")).convert("RGB").resize((24, 14), Image.BILINEAR)
        v = np.asarray(im, dtype=np.float64).ravel(); v -= v.mean(); n = np.linalg.norm(v); return v / n if n else None
    except Exception: return None
V = [vec(m["key"]) for m in flat]
par = list(range(len(flat)))
def root(i):
    while par[i] != i: par[i] = par[par[i]]; i = par[i]
    return i
def join(i, j): par[root(i)] = root(j)
for i, a in enumerate(flat):
    for j in range(i + 1, len(flat)):
        b = flat[j]
        if a["pid"] or b["pid"]:
            if a["pid"] == b["pid"]: join(i, j)
            continue
        if a["key"].split("~")[0] == b["key"].split("~")[0]: join(i, j); continue
        if V[i] is not None and V[j] is not None and float(np.nan_to_num(V[i] @ V[j])) > AUTO: join(i, j); continue
        if (a["t"], b["t"]) in SAME_SCENE or (b["t"], a["t"]) in SAME_SCENE: join(i, j)
groups = {}
for i in range(len(flat)): groups.setdefault(root(i), []).append(flat[i])

motion = []
for g in groups.values():
    g.sort(key=lambda m: (m["kind"] != "gif", m["src"]))  # loops first, then films
    lead = g[0]
    motion.append({"key": lead["key"].split("~")[0], "src": lead["src"], "kind": lead["kind"], "pid": lead["pid"], "t": lead["t"],
                   "w": lead.get("w"), "h": lead.get("h"),
                   "cuts": [{"key": m.get("poster") or m["key"].split("~")[0], "src": m["src"], "kind": m["kind"], "t": m["t"], "w": m.get("w"), "h": m.get("h")} for m in g]})
motion.sort(key=lambda m: (m["pid"] is None, int(m["pid"]) if (m["pid"] or "").isdigit() else 0, m["t"]))
before = len(data["motion"])
data["motion"] = motion
data["counts"]["motionAttached"] = sum(1 for m in motion if m["pid"])
data["counts"]["loopReel"] = sum(1 for m in motion if not m["pid"])
open(path, "w").write(head + json.dumps(data, separators=(",", ":")) + ";\n")
print(f"motion reel: {before} cards -> {len(motion)} ({len(flat)} cuts) | STILL WAITING removed: {dropped}")
