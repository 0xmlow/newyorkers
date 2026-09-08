#!/usr/bin/env python3
"""Writes assets/prints.js from the Shopify variant map.

One Shopify product ("NEW YORKERS Print") covers all 7,541 pieces. The specific
New Yorker travels to the shop as a line item property on /cart/add, so the cart,
the order and the packing slip all name the piece. Cart PERMALINKS reject
properties[] with a 422; /cart/add accepts them. Do not "simplify" it back.

status must be "live" for the order block to appear. Set it to "draft" to pull
every order button off the site without a code change.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
SRC = os.path.join(HERE, "api", "ny_print_variants.json")
OUT = os.path.join(SITE, "assets", "prints.js")

d = json.load(open(SRC, encoding="utf-8"))
for k in ("product", "shop", "status", "sizes", "formats", "variants"):
    assert k in d, "ny_print_variants.json is missing " + k
assert d["status"] in ("live", "draft"), "status must be live or draft"
assert len(d["variants"]) == len(d["sizes"]) * len(d["formats"]), "variant grid is incomplete"

open(OUT, "w", encoding="utf-8").write(
    "window.NY_PRINTS = " + json.dumps(d, separators=(",", ":")) + ";\n")
print("prints.js  %s  %d variants  %s" % (d["status"], len(d["variants"]), d["shop"]))
