#!/usr/bin/env python3
"""THE PRINT SHOP layer: one catalog, four surfaces.

Reads the Shopify storefront's public products.json (no API token, nothing to expire) and writes:
  assets/shop.js          window.NY_SHOP, the catalog the census site's shop page reads
  shop.html               the selling surface on the census site (status badges, related, waitlist, reviews)
  feeds/google-merchant.xml   Google Merchant Center / Google Shopping feed
  feeds/meta-catalog.csv      Facebook and Instagram catalog feed
  feeds/catalog.json          the same data for anything else (Printful, a marketplace, an agent)

Feed design note: the store carries about 90 variants per product (size x format x frame). Feeding every
variant would be ~20,000 items with half unavailable, which is how a Merchant Center account gets flagged
for data quality. So the feeds carry ONE item per product, priced from the cheapest available variant,
with item_group_id set so variants can be added later if a channel needs them.

Run: python3 build_shop.py [--host https://prints.mlow.xyz]
It is safe to run any time; it only rewrites the four outputs.
"""
import json, os, re, csv, sys, html, urllib.request, datetime, argparse
from page_shell import shell, esc, no_dash, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]; TODAY = datetime.date.today().isoformat()
GOOGLE_CATEGORY = "500044"   # Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork

ap = argparse.ArgumentParser()
ap.add_argument("--host", default=None, help="storefront to read, default: printsHost from config then mlow.nyc")
A = ap.parse_args()

# The store is mid migration: try the new home first, fall back to the old one.
HOSTS = [h for h in [A.host, C.get("printsHost"), "https://prints.mlow.xyz", "https://mlow.nyc"] if h]
def fetch():
    seen = set()
    for h in HOSTS:
        if h in seen: continue
        seen.add(h)
        out, page = [], 1
        try:
            while True:
                req = urllib.request.Request(f"{h}/products.json?limit=250&page={page}", headers={"User-Agent": "new-yorkers-shop-build"})
                with urllib.request.urlopen(req, timeout=30) as r:
                    batch = json.load(r).get("products", [])
                if not batch: break
                out += batch; page += 1
                if page > 20: break
            if out:
                print(f"catalog read from {h}: {len(out)} published products")
                return h, out
        except Exception as e:
            print(f"  {h} did not answer ({e.__class__.__name__}), trying the next host")
    sys.exit("no storefront answered; pass --host")

HOST, RAW = fetch()
SHOP = C.get("printsUrl") or HOST          # the address shown to people
BUY = HOST                                  # the address that actually serves the store

def clean(h):
    t = re.sub(r"<br\s*/?>", " ", h or "")
    t = re.sub(r"<[^>]+>", " ", t)
    t = html.unescape(t)
    return re.sub(r"\s+", " ", t).strip()

FAMILY = [
    (re.compile(r"^transdimensional-trippers"), "Transdimensional Trippers"),
    (re.compile(r"^tokenized-garbage"), "Tokenized Garbage"),
    (re.compile(r"^flowers"), "fLOWers"),
    (re.compile(r"^impermanent-loss"), "Impermanent Loss"),
]
def family(handle):
    for rx, name in FAMILY:
        if rx.match(handle): return name
    return "Other work"

items, problems = [], []
for p in RAW:
    vs = p.get("variants") or []
    live = [v for v in vs if v.get("available")]
    imgs = [i["src"] for i in (p.get("images") or []) if i.get("src")]
    if not imgs:
        problems.append(("no image", p["handle"])); continue          # Google rejects an item with no image
    if not live:
        problems.append(("every variant unavailable", p["handle"]))
    pool = live or vs
    if not pool: continue
    cheap = min(pool, key=lambda v: float(v["price"]))
    top = max(pool, key=lambda v: float(v["price"]))
    desc = clean(p.get("body_html"))
    if len(desc) < 40:
        problems.append(("thin description", p["handle"]))
        desc = f"{p['title']} by MLow. Hand finished limited edition art print, signed and numbered."
    items.append({
        "id": str(p["id"]),
        "h": p["handle"],
        "t": p["title"],
        "fam": family(p["handle"]),
        "img": imgs[0].split("?")[0],
        "imgs": [i.split("?")[0] for i in imgs[:4]],
        "lo": round(float(cheap["price"]), 2),
        "hi": round(float(top["price"]), 2),
        "sku": cheap.get("sku") or "",
        "n": len(vs),
        "live": len(live),
        "avail": bool(live),
        "desc": desc,
        "tags": [t for t in (p.get("tags") or []) if len(t) < 40][:12],
        "new": (p.get("published_at") or "")[:10],
    })

items.sort(key=lambda x: (x["fam"], x["t"]))
fams = sorted({i["fam"] for i in items})
print(f"catalogued {len(items)} products across {len(fams)} bodies of work; "
      f"{sum(1 for i in items if not i['avail'])} fully sold out")
if problems:
    print("data problems (fix these in Shopify, they cost you listings):")
    for kind in sorted({k for k, _ in problems}):
        rows = [h for k, h in problems if k == kind]
        print(f"  {kind}: {len(rows)} -> {', '.join(rows[:6])}{' ...' if len(rows) > 6 else ''}")

# ---------------- assets/shop.js ----------------
compact = [{k: i[k] for k in ("id", "h", "t", "fam", "img", "lo", "hi", "avail", "live", "n", "desc", "tags")} for i in items]
open(os.path.join(SITE, "assets", "shop.js"), "w", encoding="utf-8").write(
    "window.NY_SHOP = " + json.dumps({"built": TODAY, "buy": BUY, "shop": SHOP, "families": fams, "items": compact}, ensure_ascii=False, separators=(",", ":")) + ";\n")

# ---------------- feeds ----------------
FEEDS = os.path.join(SITE, "feeds"); os.makedirs(FEEDS, exist_ok=True)
def buy_url(h, src):
    return f"{BUY}/products/{h}?utm_source={src}&utm_medium=feed&utm_campaign=catalog"

# Google Merchant Center, RSS 2.0
g = ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">', "<channel>",
     "<title>MLow, prints and originals</title>", f"<link>{esc(SHOP)}</link>",
     "<description>Hand finished limited edition art prints by MLow, signed and numbered. New York City.</description>"]
for i in items:
    g += ["<item>",
          f"<g:id>{esc(i['h'])}</g:id>",
          f"<g:item_group_id>{esc(i['h'])}</g:item_group_id>",
          f"<title>{esc(i['t'])}</title>",
          f"<description>{esc(i['desc'][:4900])}</description>",
          f"<link>{esc(buy_url(i['h'], 'google'))}</link>",
          f"<g:image_link>{esc(i['img'])}</g:image_link>"]
    for extra in i["imgs"][1:4]:
        g.append(f"<g:additional_image_link>{esc(extra)}</g:additional_image_link>")
    g += [f"<g:availability>{'in_stock' if i['avail'] else 'out_of_stock'}</g:availability>",
          f"<g:price>{i['lo']:.2f} USD</g:price>",
          "<g:condition>new</g:condition>",
          "<g:brand>MLow</g:brand>",
          f"<g:mpn>{esc(i['sku'] or i['h'])}</g:mpn>",
          "<g:identifier_exists>no</g:identifier_exists>",
          f"<g:google_product_category>{GOOGLE_CATEGORY}</g:google_product_category>",
          "<g:product_type>Art Print</g:product_type>",
          f"<g:custom_label_0>{esc(i['fam'])}</g:custom_label_0>",
          "</item>"]
g += ["</channel>", "</rss>"]
open(os.path.join(FEEDS, "google-merchant.xml"), "w", encoding="utf-8").write("\n".join(g))

# Meta (Facebook and Instagram) catalog CSV
with open(os.path.join(FEEDS, "meta-catalog.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand", "product_type", "google_product_category", "item_group_id", "custom_label_0", "additional_image_link"])
    for i in items:
        w.writerow([i["h"], i["t"], i["desc"][:4900], "in stock" if i["avail"] else "out of stock", "new",
                    f"{i['lo']:.2f} USD", buy_url(i["h"], "meta"), i["img"], "MLow", "Art Print",
                    GOOGLE_CATEGORY, i["h"], i["fam"], ",".join(i["imgs"][1:4])])

json.dump({"built": TODAY, "source": HOST, "shop": SHOP, "count": len(items), "items": items},
          open(os.path.join(FEEDS, "catalog.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"feeds written: google-merchant.xml, meta-catalog.csv, catalog.json ({len(items)} items each)")

# ---------------- shop.html: intentionally NOT built ----------------
# The print catalogue is Transdimensional Trippers, fLOWers, Impermanent Loss and Tokenized Garbage.
# Those are separate bodies of work and MLow wants them off the NEW YORKERS site entirely.
# This script still builds the FEEDS above, because Google and Meta need a public URL to fetch and
# those are machine files rather than pages. Move the feeds to the print shop domain once
# prints.mlow.xyz is live, then delete the feed writing from here.
print("shop.html deliberately not written: the print catalogue lives on the print shop, not here")
