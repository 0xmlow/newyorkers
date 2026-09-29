#!/usr/bin/env python3
"""Attach glitch editions (p.gl) to the existing assets/data.js without a full data rebuild.
build_glitch.py packs MOSHED VARIANTS into assets/glitch and writes glitch_index.json keyed by census
number; build_data_v4.py attaches the same field on its next run. This exists so new glitch loops
(the 87 Keystone ones, 2026-09-29) do not pull unrelated source drift into data.js.
Records are keyed by data.js id, which is the census number except for the Era I leads:
NO. 1, 2 and 3 are x000, x001 and x002, so an x id falls back to its number."""
import json, os
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(SITE, "assets", "data.js")
s = open(path).read()
head, body = s[:s.index("{")], s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1]
data = json.loads(body)
GL = json.load(open(os.path.join(SITE, "_build", "glitch_index.json")))
n, used = 0, set()
for p in data["pieces"]:
    key = p["id"] if p["id"] in GL else (str(p.get("n")) if p["id"].startswith("x") and str(p.get("n")) in GL else None)
    p.pop("gl", None)
    g = GL.get(key) if key else None
    if g and g.get("mp4"):
        p["gl"] = {"mp4": g["mp4"], "st": g.get("st"), "fam": g.get("fam"), "tag": g.get("tag")}; n += 1; used.add(key)
data["counts"]["glitch"] = n
open(path, "w").write(head + json.dumps(data, separators=(",", ":")) + ";\n")
print("glitch editions attached:", n, "| not in the census:", sorted(set(GL) - used, key=lambda k: int(k) if k.isdigit() else 0))
