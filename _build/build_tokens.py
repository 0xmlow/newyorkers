#!/usr/bin/env python3
"""api/tokens.json: what is on each census token, for the census viewer (census.html) and anything else
that wants to show the REAL states of a New Yorker rather than the painted ones the site holds.

Three facts per census number, none of which the site data carried before 2026-10-08:
  map    census number -> token id in THE CENSUS RELEASE draw (TOKEN_MAP.csv, all 6,666 of the draw)
  pool   the census numbers the release can actually deal (api/minted.json "pool": token ids 1 to the cap)
  s      the stack of states on the token, with their IPFS CIDs, same files the token's own viewer uses
         (_build/tokens/token_states.json, written by CENSUS RELEASE 2026-09-23/_build/states.py site)

Why a separate file and not data.js: 1,631 stacks of five to thirteen CIDs is about 400 KB, and only the
detail panel needs it. The page fetches it once, on the first record opened. Minted status is NOT in here:
it moves every hour and api/minted.json already carries it, so the page reads that beside this.

Runs after build_mint.py (pool) and before build_seo.py and build_deploy.py (which copies api/ whole).
"""
import csv, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
ROOT = os.path.dirname(SITE)
KIT = os.path.join(ROOT, "CENSUS RELEASE 2026-09-23")

TOKEN_MAP = os.path.join(KIT, "TOKEN_MAP.csv")
STATES = os.path.join(HERE, "tokens", "token_states.json")
MINTED = os.path.join(SITE, "api", "minted.json")
MINT = os.path.join(SITE, "api", "mint.json")
OUT = os.path.join(SITE, "api", "tokens.json")

GATEWAYS = ["https://gateway.pinata.cloud", "https://ipfs.filebase.io", "https://ipfs.raribleuserdata.com"]

for p in (TOKEN_MAP, STATES, MINTED, MINT):
    if not os.path.exists(p):
        sys.exit("build_tokens: missing " + p)

tmap = {}
for r in csv.DictReader(open(TOKEN_MAP, encoding="utf-8")):
    tmap[int(r["census_number"])] = int(r["token_id"])

states = json.load(open(STATES))
minted = json.load(open(MINTED))
mint = json.load(open(MINT))
pool = sorted(int(n) for n in minted.get("pool", []))
k111 = sorted(int(n) for n in minted.get("k111", []))

# States only for pieces the release can deal: a stack pre rendered for token 4,483 is real on IPFS but the
# token is beyond the cut, and showing it as "on the token" would promise a token that is not for sale.
pool_set = set(pool)
s = {}
for n, t in states.items():
    if int(n) not in pool_set:
        continue
    if t["tok"] != tmap.get(int(n)):
        sys.exit(f"build_tokens: token id disagrees for census {n}: states say {t['tok']}, TOKEN_MAP says {tmap.get(int(n))}")
    s[n] = t["s"]

out = {
    "asOf": mint.get("asOf"),
    "contract": mint["census"]["contract"],
    "standard": "ERC-721",
    "cap": mint["census"]["cap"],
    "url": mint["census"]["url"],
    "gw": GATEWAYS,
    "map": {str(n): tok for n, tok in sorted(tmap.items())},
    "pool": pool,
    "k111": k111,
    "s": s,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, "w"), separators=(",", ":"))
nst = sum(len(v) for v in s.values())
print(f"api/tokens.json: {len(tmap)} census numbers mapped to token ids, pool {len(pool)}, "
      f"{len(s)} tokens with their stacks ({nst} states), {os.path.getsize(OUT) // 1024} KB")
