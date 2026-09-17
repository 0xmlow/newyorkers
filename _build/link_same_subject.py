#!/usr/bin/env python3
"""Add SAME SUBJECT links from _build/same_subject.json to assets/data.js. Idempotent, runs on every build."""
import json, os, itertools
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(SITE, "assets", "data.js")
s = open(path).read(); head = s[:s.index("{")]; d = json.loads(s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1])
ids = {p["id"] for p in d["pieces"]}
edges = [e for e in d["edges"] if not e[2].startswith("subject:")]
n, missing = 0, []
for name, members in json.load(open(os.path.join(SITE, "_build", "same_subject.json")))["clusters"]:
    present = [m for m in members if m in ids]; missing += [m for m in members if m not in ids]
    for a, b in itertools.combinations(present, 2):
        edges.append([a, b, "subject:" + name]); n += 1
d["edges"] = edges; d["counts"]["edges"] = len(edges)
open(path, "w").write(head + json.dumps(d, separators=(",", ":")) + ";\n")
print("same subject links:", n, "| missing ids:", missing)
