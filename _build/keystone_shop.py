#!/usr/bin/env python3
"""api/keystone_prints.json: the Keystone 111 as prints on mlow.nyc.

One Shopify product per Keystone piece, each with the same 45 size and surface variants as
NEW YORKERS Print (prices from api/ny_print_variants.json), grouped in the KEYSTONE 111 collection.
This file is the join between the site and the store:

  - per piece: ramp position, census number, title, site id, the mint kit lead master and its pixels
  - the Shopify handle, product id and variant ids, filled in by the store sync once products exist
  - `status`: "draft" while the products are drafts on mlow.nyc. The site then orders through the
    existing NEW YORKERS Print product with the piece as a line item property, which already works.
    Set it to "live" once the products are published and every buy button goes to the piece's own
    product page instead. No code change either way.

Default run: write assets/keystone_prints.js (window.NY_KEYSTONE_PRINTS) from the json, which the
museum's piece panel and keystone.html read. --manifest also rewrites the piece list from the Keystone
design and the mint kit masters; store ids already recorded are kept. Part of build_all.sh.
"""
import json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
OUT = os.path.join(HERE, "api", "keystone_prints.json")
JS = os.path.join(SITE, "assets", "keystone_prints.js")
SHOP = "https://mlow.nyc"
KIT = os.path.join(os.path.dirname(SITE), "KEYSTONE 111 MINT KIT 2026-09-17", "tokens")

def leads():
    by_n = {}
    for d in os.listdir(KIT):
        tj = os.path.join(KIT, d, "token.json")
        if os.path.exists(tj):
            t = json.load(open(tj))
            st = [s for s in t["states"] if s["kind"] == "still"]
            src = st[0]["source"]
            by_n[t["census_number"]] = src if os.path.isabs(src) else os.path.join(KIT, d, src)
    return by_n

def handle(n, t):
    slug = re.sub(r"[^a-z0-9]+", "-", t.lower().replace("'", "")).strip("-")
    return f"keystone-{n:04d}-{slug}"

def main():
    s = open(os.path.join(HERE, "keystone", "src.html"), encoding="utf-8").read()
    k = json.loads(re.search(r"var K111 = (\[.*?\]);\n</script>", s, re.S).group(1))
    d = open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read()
    D = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
    byn = {p["n"]: p for p in D["pieces"] if p.get("n") is not None}
    old = json.load(open(OUT)) if os.path.exists(OUT) else {"status": "draft", "pieces": []}
    keep = {p["n"]: p for p in old["pieces"]}
    L = leads(); out = []; missing = []
    for p in k:
        src = L.get(p["n"])
        if not src or not os.path.exists(src): missing.append(p["n"]); continue
        w, h = Image.open(src).size
        row = {"pos": p["id"], "n": p["n"], "t": p["t"], "sid": byn[p["n"]]["id"], "w": p["w"],
               "e": p["e"], "s": p["s"], "master": src, "px": [w, h], "handle": handle(p["n"], p["t"])}
        for f in ("product", "variants", "image"):
            if f in keep.get(p["n"], {}): row[f] = keep[p["n"]][f]
        out.append(row)
    if missing: raise SystemExit(f"keystone_shop: no lead master for {missing}")
    json.dump({"status": old.get("status", "draft"), "collection": old.get("collection"), "pieces": out},
              open(OUT, "w"), indent=1, ensure_ascii=False)
    lo = sorted(out, key=lambda r: min(r["px"]))[:5]
    print(f"wrote {os.path.relpath(OUT, SITE)}: {len(out)} pieces, status {old.get('status','draft')}")
    print("smallest masters:", [(r["n"], r["px"]) for r in lo])

def write_js():
    d = json.load(open(OUT, encoding="utf-8"))
    assert d["status"] in ("live", "draft"), "status must be live or draft"
    missing = [p["n"] for p in d["pieces"] if not p.get("product")]
    if d["status"] == "live" and missing:
        raise SystemExit(f"keystone_shop: status is live but {len(missing)} pieces have no product: {missing[:8]}")
    js = {"status": d["status"], "shop": SHOP, "collection": SHOP + "/collections/" + d["collection"]["handle"],
          "pieces": {str(p["n"]): {"handle": p["handle"]} for p in d["pieces"]}}
    open(JS, "w", encoding="utf-8").write("window.NY_KEYSTONE_PRINTS = " + json.dumps(js, separators=(",", ":")) + ";\n")
    print(f"keystone_prints.js  {d['status']}  {len(js['pieces'])} pieces  {js['collection']}")

if __name__ == "__main__":
    if "--manifest" in sys.argv: main()
    write_js()
