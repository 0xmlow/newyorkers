#!/usr/bin/env python3
"""Mint awareness for the site, read off the chain snapshot. No network: collectors/fetch_chain.py refreshes
collectors/chain.json earlier in build_all.sh and this only reads it, so it is fast and gives the same output
for the same snapshot.

Writes
  api/mint.json     the two drops as numbers: minted of the cap, holders, window, price, the last mint, the
                    twelve most recent census mints. assets/mint.js reads it to put the live count on the bar.
  api/minted.json   piece number to token: who holds it, how they are named on the collectors board, their X
                    handle, their address, when it moved. build_seo.py reads it for the TOKEN block on n/ pages,
                    flywheel.js reads it to send a quiz result to the right OpenSea page.
                    Also "pool": the 1,111 census piece numbers THE CENSUS RELEASE can deal (see below).

THE POOL. census_traits.json maps every census token id to the New Yorker it reveals as. SeaDrop deals token
ids in order from 1 and every id minted so far is contiguous from 1, so with the release cut to 1,111 the pool
is the pieces behind token ids 1 to 1,111. That is an inference from the metadata and the dealing order, not a
read of the contract's max supply, and it is stated as such in the report that shipped it.

Run after collectors/fetch_chain.py and build_collectors.py (it reads api/collectors.json for display names),
before build_seo.py and build_mosaic.py."""
import os, re, json, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
ZERO = "0x0000000000000000000000000000000000000000"
CENSUS = {"contract": "0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4", "cap": 1111, "price": "0.0042 ETH",
          "open": "2026-09-23T11:11:00-04:00", "close": "2026-10-23T11:11:00-04:00",
          "url": "https://opensea.io/collection/newyorkers/overview"}
KEYSTONE = {"contract": "0x2dbfcca230979a91863be63ebce55dd5aae2b5c9", "painted": 111, "price": "0.069 ETH",
            "url": "https://transient.xyz/mint/newyorkers"}
ET = datetime.timezone(datetime.timedelta(hours=-4))


def iso(t):
    return datetime.datetime.fromtimestamp(int(t), ET).isoformat(timespec="seconds") if t else ""


def jload(p, default=None):
    try:
        return json.load(open(p, encoding="utf-8"))
    except (OSError, ValueError):
        return default


def main():
    ch = json.load(open(os.path.join(HERE, "collectors", "chain.json")))
    tr = jload(os.path.join(HERE, "collectors", "census_traits.json"), {})

    # how the collectors board names a wallet, else ENS, else X, else the short address
    ident = {}
    for r in (jload(os.path.join(SITE, "api", "collectors.json"), {}) or {}).get("collectors", []):
        for a in [r["a"]] + (r.get("also") or []):
            ident[a.lower()] = (r.get("nm") or "", r.get("x") or "")
    ens, tw = ch.get("ens", {}), ch.get("twitter", {})

    def who(a):
        nm, x = ident.get(a, ("", ""))
        nm = nm or ens.get(a, "")
        x = x or tw.get(a, "")
        return (nm or x or (a[:6] + "…" + a[-4:])), x

    # the Keystone wall: census number to kit id and title, for naming chain tokens that do not say their number
    kit = {}
    try:
        s = open(os.path.join(HERE, "keystone", "src.html"), encoding="utf-8").read()
        kit = {p["n"]: p for p in json.loads(re.search(r"var K111 = (\[.*?\]);\n</script>", s, re.S).group(1))}
    except (OSError, AttributeError, ValueError):
        pass
    by_title = {p["t"].strip().lower(): n for n, p in kit.items()}
    km = ch.get("keystone_meta", {})

    def keystone_n(tok):
        name = km.get(str(tok), {}).get("name", "")
        if "#" in name and name.rsplit("#", 1)[1].strip().isdigit():
            return int(name.rsplit("#", 1)[1])
        return by_title.get(name.strip().lower())

    out = {"census": {}, "keystone": {}}
    stats = {}
    for c in ("census", "keystone"):
        logs = sorted((l for l in ch["logs"] if l["c"] == c), key=lambda l: (l["b"], l["i"]))
        owner, moved, minted_at = {}, {}, {}
        for l in logs:
            owner[l["id"]] = l["to"].lower(); moved[l["id"]] = l["t"]
            if l["from"] == ZERO: minted_at[l["id"]] = l["t"]
        live = {t: a for t, a in owner.items() if a != ZERO}
        stats[c] = {"count": len(live), "holders": len(set(live.values())), "lastMintAt": iso(max(minted_at.values(), default=0)),
                    "mints": sorted(minted_at.items(), key=lambda kv: kv[1])}
        for tok, a in sorted(live.items()):
            if c == "census":
                t = tr.get(str(tok)); key = str(t["n"]) if t else None
            else:
                n = keystone_n(tok); key = str(n) if n else f"k{tok}"
            if not key: continue
            nm, x = who(a)
            rec = {"t": tok, "o": nm, "x": x, "a": a, "at": moved[tok]}
            if c == "keystone" and not keystone_n(tok): rec["name"] = km.get(str(tok), {}).get("name", "")
            out[c][key] = rec

    recent = []
    for tok, t in stats["census"]["mints"][-12:][::-1]:
        tt = tr.get(str(tok)); a = next((r["a"] for r in out["census"].values() if r["t"] == tok), "")
        recent.append({"t": tok, "n": tt["n"] if tt else None, "o": who(a)[0] if a else "", "at": t})

    pool = sorted({tr[str(i)]["n"] for i in range(1, CENSUS["cap"] + 1) if str(i) in tr})
    out["pool"] = pool
    out["k111"] = sorted(kit)        # every Keystone New Yorker by census number, minted or not, so the quiz can point at Transient
    mint = {"asOf": iso(ch.get("fetched")), "block": ch.get("to"),
            "census": dict(CENSUS, minted=stats["census"]["count"], holders=stats["census"]["holders"],
                           lastMintAt=stats["census"]["lastMintAt"]),
            "keystone": dict(KEYSTONE, onChain=stats["keystone"]["count"], holders=stats["keystone"]["holders"],
                             lastMintAt=stats["keystone"]["lastMintAt"]),
            "recent": recent}
    api = os.path.join(SITE, "api"); os.makedirs(api, exist_ok=True)
    for name, obj in (("mint.json", mint), ("minted.json", out)):
        json.dump(obj, open(os.path.join(api, name), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    unnamed = [k for k in out["keystone"] if k.startswith("k")]
    print(f"  mint: census {stats['census']['count']} of {CENSUS['cap']} to {stats['census']['holders']} holders, "
          f"keystone {stats['keystone']['count']} on chain to {stats['keystone']['holders']} holders "
          f"({len(unnamed)} tokens not matched to a census number), pool {len(pool)}, as of {mint['asOf']}")


if __name__ == "__main__":
    main()
