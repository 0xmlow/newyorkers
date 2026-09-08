#!/usr/bin/env python3
"""Write _build/rooms.json: the museum room registry in ROOMS order (id, name, area, mood, color, description, signatures, daylit).
Reads the TypeScript room files the same way mint_kit.py does. Every consumer of the room list (home tiles, thumbs,
sitemap, llms.txt, the learn pages, the handoff) reads this file instead of parsing the TypeScript again."""
import json, os, re, glob, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "museum", "src", "rooms")

def rooms_in_order():
    idx = open(os.path.join(SRC, "index.ts")).read()
    order = re.findall(r"\b([a-z0-9]+)\b", idx[idx.index("ROOMS"):])
    defs = {}
    for f in sorted(glob.glob(os.path.join(SRC, "[a-z].ts"))):
        s = open(f).read()
        for m in re.finditer(r"export const (\w+): RoomDef = \{([\s\S]*?)\n  build\(", s):
            head = m.group(2)
            def g(k):
                mm = re.search(rf"\b{k}: (?:'((?:[^'\\]|\\.)*)'|\"([^\"]*)\")", head)
                if not mm: return ""
                return (mm.group(1) if mm.group(1) is not None else mm.group(2)).replace("\\'", "'")
            d = dict(id=g("id"), name=g("name"), area=g("area"), mood=g("mood"), color=g("color"), description=g("description"), signatures=g("signatures"))
            d["daylit"] = "daylit: false" not in head
            defs[d["id"]] = d
    seq = []
    for r in order:
        if r in defs and r not in seq: seq.append(defs[r])
    for i, d in enumerate(seq, 1): d["index"] = i
    return seq

if __name__ == "__main__":
    rooms = rooms_in_order()
    out = os.path.join(HERE, "rooms.json")
    json.dump(rooms, open(out, "w"), indent=1, ensure_ascii=False)
    print(len(rooms), "rooms ->", out)
