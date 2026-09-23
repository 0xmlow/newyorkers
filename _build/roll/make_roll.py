#!/usr/bin/env python3
"""Publish THE ROLL: api/roll.json, the hashed list the checker page (roll.html) reads.

Nothing here is plaintext. Every wallet becomes sha256(lowercase(address) + salt) and only the hashes
ship. The salt is public (roll/salt.txt, generated once) and exists to stop a trivial reversal of the
address set, not to be a secret.

Inputs, any of:
  --from out.json        a wrangler d1 --json export (READ_THE_SUBMISSIONS.md), allowlist rows only
  --from wallets.csv     any CSV with a `wallet` column
  --from wallets.txt     one address per line
  (no --from)            keep whatever entries api/roll.json already holds

States, in order, one flip each:
  open      the roll is open. The page gives the reading and points at the list. No lookup yet.
  results   the roll is closed and published. Lookup is live. This is results day.
  closed    after mint. Archive. Reading still works, no registration language anywhere.

Examples:
  python3 roll/make_roll.py --state open --closes-at 2026-10-02T11:11:00-04:00
  python3 roll/make_roll.py --state results --from out.json --publish-count
  python3 roll/make_roll.py --state closed
  python3 roll/make_roll.py --demo          # three test wallets, printed, for a local check only
  python3 roll/make_roll.py --state open --clear   # drop the demo entries again before anything ships

The count ships as 0 unless --publish-count is given: never publish a number you are not proud of.
Rerun build_deploy.py afterwards; the package copies api/ whole.
"""
import argparse, csv, hashlib, json, os, secrets, sys
HERE = os.path.dirname(os.path.abspath(__file__)); BUILD = os.path.dirname(HERE); SITE = os.path.dirname(BUILD)
OUT = os.path.join(SITE, "api", "roll.json")
SALT_FILE = os.path.join(HERE, "salt.txt")
ADDR = lambda s: len(s) == 42 and s.startswith("0x") and all(c in "0123456789abcdef" for c in s[2:])

def salt():
    if not os.path.exists(SALT_FILE):
        open(SALT_FILE, "w").write(secrets.token_hex(16) + "\n"); print("  new public salt written to roll/salt.txt")
    return open(SALT_FILE).read().strip()

def load_wallets(path):
    """Returns (wallet, ref) pairs. ref is the code the filer arrived with, or empty."""
    raw = open(path, encoding="utf-8").read()
    if path.endswith(".json"):
        j = json.loads(raw)
        rows = j[0]["results"] if isinstance(j, list) and j and isinstance(j[0], dict) and "results" in j[0] else j
        return [(str(r.get("wallet", "")), str(r.get("ref", "") or "")) for r in rows if str(r.get("kind", "allowlist")).lower() == "allowlist"]
    if path.endswith(".csv"):
        return [(r.get("wallet", ""), r.get("ref", "") or "") for r in csv.DictReader(raw.splitlines())]
    return [(l.strip(), "") for l in raw.splitlines() if l.strip()]

ap = argparse.ArgumentParser()
ap.add_argument("--from", dest="src"); ap.add_argument("--state", choices=["open", "results", "closed"])
ap.add_argument("--closes-at"); ap.add_argument("--results-at"); ap.add_argument("--mint-at")
ap.add_argument("--publish-count", action="store_true"); ap.add_argument("--demo", action="store_true")
ap.add_argument("--share-url", help="url the share button carries. list page while open, mint page after")
ap.add_argument("--clear", action="store_true", help="drop every entry. Use after a --demo run, before anything ships")
ap.add_argument("--add", action="append", default=[], help="extra wallets to put on the roll by hand, one per line: the private wave. Repeatable")
ap.add_argument("--referral-line", help="the sentence under your link on the page. Change it here, no rebuild")
a = ap.parse_args()

cur = json.load(open(OUT)) if os.path.exists(OUT) else {}
S = salt()
doc = {
    "version": int(cur.get("version", 0)) + 1,
    "state": a.state or cur.get("state", "open"),
    "closes_at": a.closes_at or cur.get("closes_at"),
    "results_at": a.results_at or cur.get("results_at"),
    "mint_at": a.mint_at or cur.get("mint_at"),
    "share_url": a.share_url or cur.get("share_url"),
    "salt": S,
    "reading_salt": cur.get("reading_salt", "the-roll"),   # option A, flavor only: public from day one, never changes
    "referral_line": a.referral_line or cur.get("referral_line"),
    "count": 0,
    "entries": [] if a.clear else cur.get("entries", []),
    "brought": {} if a.clear else cur.get("brought", {}),
}
wallets = []
if a.demo:
    wallets = [("0x" + "1" * 40, ""), ("0x" + "abcdef" * 6 + "abcd", ""), ("0xA835000000000000000000000000000000000000", "")]
    print("  DEMO roll. These three addresses will read as on the roll. Do not deploy this file:")
    for w, _ in wallets: print("   ", w)
elif a.src:
    wallets = load_wallets(a.src)
for extra in a.add:
    added = load_wallets(extra); wallets += added; print(f"  {len(added)} wallets added by hand from {extra}")
if wallets:
    good, bad, refs = [], [], {}
    for w, r in wallets:
        w = w.strip().lower()
        if ADDR(w):
            good.append(w)
            if r: refs.setdefault(w, r.strip().lower())
        else: bad.append(w)
    if bad: print(f"  skipped {len(bad)} rows that are not addresses, e.g. {bad[:3]}")
    uniq = sorted(set(good))
    full = {w: hashlib.sha256((w + S).encode()).hexdigest() for w in uniq}
    doc["entries"] = sorted(full.values())
    # Referral credit. A filer's code is the first ten hex of their entry hash, the same code the page
    # prints as their link. Only codes that belong to a wallet on the roll are credited; only counts ship.
    codes = {h[:10] for h in full.values()}
    brought = {}
    for w in uniq:
        r = refs.get(w, "")
        if r in codes and full[w][:10] != r: brought[r] = brought.get(r, 0) + 1
    doc["brought"] = brought
    print(f"  {len(uniq)} unique wallets hashed, {sum(brought.values())} arrived through {len(brought)} filers' links")
if a.publish_count: doc["count"] = len(doc["entries"])
if doc["state"] == "open" and doc["entries"] and not a.demo:
    print("  note: state is open but entries are present. The page ignores entries until state is results.")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(doc, open(OUT, "w"), indent=1)
print(f"api/roll.json written: state={doc['state']} entries={len(doc['entries'])} count={doc['count']} version={doc['version']}")
