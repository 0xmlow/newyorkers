#!/usr/bin/env python3
"""Derive keystone_extra_states.json from piece_extras.json, so the Keystone wall and the census never disagree.

The wall's site only states are: the Canal Street bootlegs the mint kit never got (kept as they are, kind
still), then every poster, card and meme in piece_extras.json whose piece is on the ramp, in that order.
Run before keystone_images.py whenever piece_extras.json changes (build_all.sh does)."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(HERE, "keystone", "src.html"), encoding="utf-8").read()
K = {p["n"] for p in json.loads(re.search(r"var K111 = (\[.*?\]);\n</script>", s, re.S).group(1))}
path = os.path.join(HERE, "keystone_extra_states.json")
old = json.load(open(path))
out = {}
for n, v in old["states"].items():
    for e in v:
        if e["kind"] == "still": out.setdefault(n, []).append(e)
LBL = {"poster": "Poster", "card": "Card, Keystone Legendary", "meme": "Meme"}
items = [i for i in json.load(open(os.path.join(HERE, "piece_extras.json")))["items"] if i["n"] in K]
for i in sorted(items, key=lambda i: ({"poster": 0, "card": 1, "meme": 2}[i["type"]], i["src"])):
    lab = LBL[i["type"]] + (", Canal Street" if i["type"] == "meme" and "canal" in i["src"] else "")
    out.setdefault(str(i["n"]), []).append({"kind": i["type"], "label": lab, "source": i["src"]})
old["states"] = out
json.dump(old, open(path, "w"), indent=1)
print(f"keystone extras: {sum(len(v) for v in out.values())} states on {len(out)} pieces")
