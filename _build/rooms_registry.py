#!/usr/bin/env python3
"""Write _build/rooms.json: the museum room registry in ROOMS order (id, name, area, mood, color, description, signatures, daylit).
Reads the TypeScript room files the same way mint_kit.py does. Every consumer of the room list (home tiles, thumbs,
sitemap, llms.txt, the learn pages, the handoff) reads this file instead of parsing the TypeScript again."""
import json, os, re, glob, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "museum", "src", "rooms")

def rooms_in_order():
    idx = open(os.path.join(SRC, "index.ts")).read()
    # The ROOMS array may spread named lists (...NEW_WORKING_ROOMS) that live in the room files.
    spreads = {}
    for f in glob.glob(os.path.join(SRC, "*.ts")):
        for m in re.finditer(r"export const ([A-Z_]+)\s*=\s*\[([^\]]*)\]", open(f).read()):
            spreads[m.group(1)] = re.findall(r"\b([a-z0-9]+)\b", m.group(2))
    order = []
    for tok in re.findall(r"\.\.\.([A-Z_]+)|\b([a-z0-9]+)\b", idx[idx.index("export const ROOMS"):]):
        if tok[0]: order.extend(spreads.get(tok[0], []))
        else: order.append(tok[1])
    defs = {}
    for f in sorted(glob.glob(os.path.join(SRC, "*.ts"))):
        s = open(f).read()
        for m in re.finditer(r"export const (\w+)\s*:\s*RoomDef\s*=\s*\{([\s\S]*?)(?:\n\s*|,)build\(", s):
            head = m.group(2)
            def g(k):
                mm = re.search(rf"\b{k}:\s*(?:'((?:[^'\\]|\\.)*)'|\"([^\"]*)\")", head)
                if not mm: return ""
                return (mm.group(1) if mm.group(1) is not None else mm.group(2)).replace("\\'", "'")
            d = dict(id=g("id"), name=g("name"), area=g("area"), mood=g("mood"), color=g("color"), description=g("description"), signatures=g("signatures"))
            d["daylit"] = not re.search(r"daylit:\s*false", head)
            defs[m.group(1)] = d
    seq, seen = [], set()
    for r in order:
        if r in defs and r not in seen: seen.add(r); seq.append(defs[r])
    for i, d in enumerate(seq, 1): d["index"] = i
    return seq

if __name__ == "__main__":
    rooms = rooms_in_order()
    out = os.path.join(HERE, "rooms.json")
    json.dump(rooms, open(out, "w"), indent=1, ensure_ascii=False)
    print(len(rooms), "rooms ->", out)
