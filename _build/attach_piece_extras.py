#!/usr/bin/env python3
"""Put ChatGPT's posters, memes and Keystone Legendary cards on their census pieces, without a data rebuild.

piece_extras.json lists each one by census number, kind (poster, meme, card) and source under the project
root. Each gets its own thumb key in assets/t, 1400 on the long side so poster type stays readable, and
lands on the piece as p.fx = [{k: key, t: kind, a: aspect}], shown after the states in the record's strip
and on the piece page. Never the lead image. Idempotent; run after attach_likeness_swaps.py."""
import json, os, hashlib
from PIL import Image
ROOT = "/Users/degens/Desktop/NEW YORKERS BY MLOW"
SITE = os.path.join(ROOT, "NEW YORKERS SITE")
T = os.path.join(SITE, "assets", "t")
EX = json.load(open(os.path.join(SITE, "_build", "piece_extras.json")))["items"]
ORDER = {"poster": 0, "card": 1, "meme": 2}

def key(rel): return "h" + hashlib.md5(rel.encode()).hexdigest()[:10]

def make_thumbs():
    out = {}
    for x in EX:
        k = key(x["src"]); dst = os.path.join(T, k + ".jpg")
        if not os.path.exists(dst):
            im = Image.open(os.path.join(ROOT, x["src"])).convert("RGB"); im.thumbnail((1400, 1400), Image.LANCZOS)
            im.save(dst, "JPEG", quality=84, optimize=True, progressive=True)
        with Image.open(dst) as im: out[k] = round(im.size[0] / im.size[1], 3)
    return out

def apply(pieces, ar):
    by = {}
    for x in sorted(EX, key=lambda x: (ORDER[x["type"]], x["src"])):
        by.setdefault(x["n"], []).append({"k": key(x["src"]), "t": x["type"], "a": ar[key(x["src"])]})
    n = 0
    for p in pieces:
        p.pop("fx", None)
        if p.get("n") in by: p["fx"] = by[p["n"]]; n += 1
    missing = set(by) - {p.get("n") for p in pieces}
    if missing: raise SystemExit(f"piece extras: no census piece NO. {sorted(missing)}")
    return n

if __name__ == "__main__":
    ar = make_thumbs()
    path = os.path.join(SITE, "assets", "data.js")
    s = open(path).read()
    head, body = s[:s.index("{")], s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1]
    data = json.loads(body)
    n = apply(data["pieces"], ar)
    open(path, "w").write(head + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"piece extras: {len(EX)} on {n} pieces")
