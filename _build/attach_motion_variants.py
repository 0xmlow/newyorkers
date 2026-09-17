#!/usr/bin/env python3
"""Attach motion variants (p.mv) to the existing assets/data.js without a full data rebuild.
build_data_v4.py attaches the same field on its next run; this exists so adding videos does not
pull unrelated source drift (locations, edges, monuments) into data.js and reshuffle the museum hang."""
import json, os
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(SITE, "assets", "data.js")
s = open(path).read()
head, body = s[:s.index("{")], s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1]
data = json.loads(body)
MV = json.load(open(os.path.join(SITE, "_build", "motion_variants_index.json")))
n = 0
for p in data["pieces"]:
    p.pop("mv", None)
    if MV.get(p["id"]): p["mv"] = MV[p["id"]]; n += 1
data["counts"]["motionVariants"] = sum(len(v) for p in data["pieces"] for v in [p.get("mv") or []])
open(path, "w").write(head + json.dumps(data, separators=(",", ":")) + ";\n")
missing = sorted((k for k in MV if k not in {p["id"] for p in data["pieces"]}), key=int)
print("motion variants attached:", n, "pieces | not in the census:", missing)
