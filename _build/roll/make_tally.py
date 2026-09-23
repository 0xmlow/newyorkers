#!/usr/bin/env python3
"""THE TALLY: api/tally.json, the public standings of THE ROLL. The y00tslist move, in-world.

Reads the same D1 export make_roll.py reads (wallet, ref, payload, submitted_at; allowlist rows) and
publishes standings with no addresses in them: every filer appears as a code (the first ten hex of
their entry hash, the same code on their link), with a display name only if they typed an X handle or
came in through an ENS name. Rank, stamps, borough standings. Refresh as often as you like during the
window; the page reads it with a ten minute cache buster.

Stamps, the whole scoring rule in one place:
  FILED     1   the wallet is on the roll
  POSTED    3   they posted their card and pasted the link to the post (post_url in the payload)
  BROUGHT   2   per wallet that filed through their link
Tiers: COUNTED (filed) · STAMPED (posted) · BLOCK CAPTAIN (brought three or more) ·
       BOROUGH PRESIDENT (most stamps in a borough at the close, one per borough, never before close).

  python3 roll/make_tally.py --from roll/out.json                 # standings, total withheld
  python3 roll/make_tally.py --from roll/out.json --publish-count # ...and the total, only if strong
  python3 roll/make_tally.py --from roll/out.json --close         # crowns the borough presidents
"""
import argparse, hashlib, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); BUILD = os.path.dirname(HERE); SITE = os.path.dirname(BUILD)
SALT_FILE = os.path.join(HERE, "salt.txt")
ADDR = lambda s: len(s) == 42 and s.startswith("0x") and all(c in "0123456789abcdef" for c in s[2:])
def salt():
    if not os.path.exists(SALT_FILE): raise SystemExit("roll/salt.txt is missing: run make_roll.py first")
    return open(SALT_FILE).read().strip()
OUT = os.path.join(SITE, "api", "tally.json")
STAMPS = {"filed": 1, "posted": 3, "brought": 2}
CAPTAIN_AT = 3
BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"]

def rows_from(path):
    raw = json.load(open(path, encoding="utf-8"))
    rows = raw[0]["results"] if isinstance(raw, list) and raw and isinstance(raw[0], dict) and "results" in raw[0] else raw
    out = {}
    for r in rows:
        if str(r.get("kind", "allowlist")).lower() != "allowlist": continue
        w = str(r.get("wallet", "")).strip().lower()
        if not ADDR(w): continue
        try: pl = json.loads(r.get("payload") or "{}")
        except Exception: pl = {}
        out[w] = {"ref": (r.get("ref") or pl.get("ref") or "").strip().lower(), "pl": pl, "at": r.get("submitted_at") or ""}
    return out

def handle(pl):
    h = str(pl.get("x_handle") or "").strip().lstrip("@")
    h = re.sub(r"[^A-Za-z0-9_]", "", h)[:15]
    if h: return "@" + h
    n = str(pl.get("name") or "").strip().lower()
    if re.fullmatch(r"[a-z0-9_-]+(\.[a-z0-9_-]+)*\.[a-z]{2,}", n): return n
    return ""

ap = argparse.ArgumentParser()
ap.add_argument("--from", dest="src", required=True); ap.add_argument("--publish-count", action="store_true")
ap.add_argument("--close", action="store_true", help="the roll is closed: crown one borough president per borough")
ap.add_argument("--top", type=int, default=25)
a = ap.parse_args()
S = salt()
R = rows_from(a.src)
code = {w: hashlib.sha256((w + S).encode()).hexdigest()[:10] for w in R}
codes = set(code.values())
brought = {}
for w, r in R.items():
    if r["ref"] in codes and r["ref"] != code[w]: brought[r["ref"]] = brought.get(r["ref"], 0) + 1
people = []
boro = {b: 0 for b in BOROUGHS}
for w, r in R.items():
    pl = r["pl"]; c = code[w]
    posted = bool(re.match(r"https?://(x|twitter)\.com/\S+/status/\d+", str(pl.get("post_url") or "")))
    b = brought.get(c, 0)
    st = STAMPS["filed"] + (STAMPS["posted"] if posted else 0) + STAMPS["brought"] * b
    reading = str(pl.get("reading") or ""); borough = reading.split(" / ")[0] if " / " in reading else ""
    if borough in boro: boro[borough] += 1
    tier = "BLOCK CAPTAIN" if b >= CAPTAIN_AT else ("STAMPED" if posted else "COUNTED")
    people.append({"c": c, "n": handle(pl), "s": st, "b": b, "p": posted, "t": tier, "bo": borough, "at": r["at"]})
people.sort(key=lambda p: (-p["s"], p["at"]))
if a.close:
    seen = set()
    for p in people:
        if p["bo"] and p["bo"] not in seen: p["t"] = "BOROUGH PRESIDENT"; seen.add(p["bo"])
for i, p in enumerate(people): p["r"] = i + 1
doc = {
    "updated": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "closed": bool(a.close),
    "count": len(people) if a.publish_count else 0,
    "stamps": STAMPS, "captain_at": CAPTAIN_AT,
    "boroughs": [{"name": b, "n": boro[b]} for b in sorted(BOROUGHS, key=lambda b: -boro[b])],
    "top": [{k: p[k] for k in ("r", "c", "n", "s", "b", "t")} for p in people[: a.top]],
    "all": {p["c"]: [p["r"], p["s"], p["b"], p["t"]] for p in people},
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(doc, open(OUT, "w"), separators=(",", ":"))
print(f"api/tally.json written: {len(people)} filers, {sum(brought.values())} brought, {sum(1 for p in people if p['p'])} posted, boroughs {[(b['name'], b['n']) for b in doc['boroughs']]}")
