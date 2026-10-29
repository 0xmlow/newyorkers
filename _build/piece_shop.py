#!/usr/bin/env python3
"""assets/piece_prints.js: the pieces that have their own listing on mlow.nyc.

THE MARKS (159), the curator's NEW YORKERS picks and the honorary portraits each got their own Shopify
product on 2026-10-28 (45 size and surface variants, the NEW YORKERS Print prices), in the collections
the-marks, new-yorkers and honorary-new-yorkers. api/piece_prints.json is the join:

  - n: census number -> product handle
  - h: honorary id -> {work title: product handle}
  - noprint: census numbers that are never sold as prints (children in the picture); every buy button hides
  - status: "draft" while the products are drafts. Every buy button then keeps its old path (the shared
    NEW YORKERS Print product with the piece as a line item property, or no button for an honorary).
    Set it to "live" once the products are ACTIVE on the Online Store and rerun this script: the record
    pages, the museum panel and the honorary pages then send buyers to the piece's own product.

Keystone keeps its own file (keystone_prints.js, keystone_shop.py). Read by build_seo.py (n/ pages), the
museum bundle (main.ts printHref) and build_honoraries.py. Part of build_all.sh.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
SRC = os.path.join(HERE, "api", "piece_prints.json")
JS = os.path.join(SITE, "assets", "piece_prints.js")

def main():
    d = json.load(open(SRC, encoding="utf-8"))
    assert d["status"] in ("live", "draft"), "status must be live or draft"
    js = {"status": d["status"], "shop": d["shop"], "n": d["n"], "h": d["h"], "no": d.get("noprint", [])}
    open(JS, "w", encoding="utf-8").write("window.NY_PIECE_PRINTS = " + json.dumps(js, separators=(",", ":"), ensure_ascii=False) + ";\n")
    print(f"piece_prints.js  {d['status']}  {len(d['n'])} pieces  {len(d['h'])} honoraries")

if __name__ == "__main__":
    main()
