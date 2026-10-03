#!/usr/bin/env python3
"""Who holds what, read straight off Ethereum. Feeds build_collectors.py.

Reads every ERC-721 Transfer on the two NEW YORKERS contracts and replays them into
current owners, first mint time and whether a wallet ever let a piece go. Cached in
chain.json and incremental: a rerun only asks for the blocks since the last one.

  KEYSTONE           0x2dbf...c9  Transient Labs ERC-7160TL, the founding ones of one
  THE CENSUS RELEASE 0x3386...c4  the 6,666 on OpenSea

No key anywhere. Logs come from Blockscout's free Etherscan style API, which has no
block range cap (public nodes do: publicnode refuses anything not recent without a
token, drpc caps at 10k blocks, 1rpc at 50, cloudflare at 800). It returns 1,000 logs a
page, so a full page restarts from its last block and drops the overlap by tx and index.
ENS names come from the ENS ReverseRecords helper over a public node, one batched
eth_call, forward checked by the contract itself.

  python3 fetch_chain.py            incremental
  python3 fetch_chain.py --from N   rescan from block N (forgets the cache)
"""
import json, os, sys, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "chain.json")
RPCS = ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org", "https://rpc.mevblocker.io"]
SCOUT = "https://eth.blockscout.com/api?module=logs&action=getLogs&address={a}&topic0={t}&fromBlock={b}&toBlock=latest"
TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
ZERO = "0x" + "0" * 40
CONTRACTS = {"keystone": "0x2dbfcca230979a91863be63ebce55dd5aae2b5c9",
             "census": "0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4"}
# Nothing NEW YORKERS existed on chain before July 2026 (Keystone token 1 is block 25,398,308); scanning from here is safe and cheap.
START_BLOCK = 25_300_000
GATEWAYS = ["https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/", "https://dweb.link/ipfs/"]
REVERSE_RECORDS = "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C"


def rpc(method, params):
    last = None
    for attempt in range(6):
        url = RPCS[attempt % len(RPCS)]
        req = urllib.request.Request(url, json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
                                     {"Content-Type": "application/json", "User-Agent": "n3wyorkers-collectors/1"})
        try:
            r = json.load(urllib.request.urlopen(req, timeout=40))
            if "result" in r: return r["result"]
            last = r.get("error")
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            last = e
        time.sleep(1.5 * (attempt + 1))
    raise SystemExit(f"{method} failed on every node: {last}")


def scout(addr, frm):
    for attempt in range(5):
        try:
            req = urllib.request.Request(SCOUT.format(a=addr, t=TRANSFER, b=frm), headers={"User-Agent": "n3wyorkers-collectors/1"})
            r = json.load(urllib.request.urlopen(req, timeout=90))
            if r.get("status") == "1" or r.get("message", "").startswith("No"): return r.get("result") or []
            last = r
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            last = e
        time.sleep(15 * (attempt + 1))   # blockscout rate limits bursts with 429
    raise SystemExit(f"blockscout getLogs failed: {last}")


def ens_names(addrs):
    """ReverseRecords.getNames(address[]) returns '' where the reverse record does not resolve forward."""
    out = {}
    for i in range(0, len(addrs), 200):
        chunk = addrs[i:i + 200]
        data = "0xcbf8b66c" + "%064x" % 32 + "%064x" % len(chunk) + "".join(a[2:].lower().rjust(64, "0") for a in chunk)
        try: raw = bytes.fromhex(rpc("eth_call", [{"to": REVERSE_RECORDS, "data": data}, "latest"])[2:])
        except SystemExit: continue
        word = lambda o: int.from_bytes(raw[o:o + 32], "big")
        base = word(0); n = word(base); heads = base + 32
        for k, a in enumerate(chunk):
            off = heads + word(heads + 32 * k); ln = word(off)
            name = raw[off + 32:off + 32 + ln].decode("utf-8", "replace")
            if name and name.isprintable() and len(name) < 64: out[a] = name
    return out


def _namehash(name):
    from Crypto.Hash import keccak
    def k(b):
        h = keccak.new(digest_bits=256); h.update(b); return h.digest()
    n = b"\0" * 32
    for label in reversed(name.split(".")): n = k(n + k(label.encode()))
    return n.hex()


def ens_twitter(names):
    """The com.twitter text record each holder set on their own ENS name. Only the name's owner can set
    it, so it is the honest link from a wallet to an X handle, and from there to an honoree."""
    out = {}
    reg = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"
    for a, name in names.items():
        try:
            node = _namehash(name)
            res = "0x" + rpc("eth_call", [{"to": reg, "data": "0x0178b8bf" + node}, "latest"])[-40:]
            if int(res, 16) == 0: continue
            key = b"com.twitter"
            data = "0x59d1d43c" + node + "%064x" % 64 + "%064x" % len(key) + key.hex().ljust(64, "0")
            raw = bytes.fromhex(rpc("eth_call", [{"to": res, "data": data}, "latest"])[2:])
            if len(raw) < 64: continue
            ln = int.from_bytes(raw[32:64], "big")
            v = raw[64:64 + ln].decode("utf-8", "replace").strip().lstrip("@").split("/")[-1].lower()
            if v: out[a] = v
        except (SystemExit, ValueError, ImportError):
            continue
    return out


def keystone_meta(ids, old):
    """Keystone token ids on chain are mint order, not the kit's numbering (token 1 is THE DOULA,
    the kit's token 1 is The Bodega Matriarch), so each token's name is read from its own tokenURI.
    The tokens are dynamic and the URI moves with the state, so this is refreshed every run."""
    out = {}
    for i in ids:
        try:
            raw = bytes.fromhex(rpc("eth_call", [{"to": CONTRACTS["keystone"], "data": "0xc87b56dd" + "%064x" % i}, "latest"])[2:])
            uri = raw[64:64 + int.from_bytes(raw[32:64], "big")].decode()
            for g in GATEWAYS:
                try:
                    req = urllib.request.Request(g + uri.replace("ipfs://", ""), headers={"User-Agent": "n3wyorkers-collectors/1"})
                    d = json.load(urllib.request.urlopen(req, timeout=30)); break
                except (urllib.error.URLError, TimeoutError, ValueError): d = None
            if d: out[str(i)] = {"name": d.get("name", ""), "image": d.get("image", "")}
            elif str(i) in old: out[str(i)] = old[str(i)]
        except SystemExit:
            if str(i) in old: out[str(i)] = old[str(i)]
    return out


def _read_logs(start, logs, seen):
    for name, addr in CONTRACTS.items():
        frm = start
        while True:
            page = scout(addr, frm)
            for lg in page:
                if len(lg["topics"]) < 4 or lg["topics"][3] is None: continue   # ERC-20 shaped Transfer, not ours
                key = (lg["transactionHash"], int(lg["logIndex"], 16))
                if key in seen: continue
                seen.add(key)
                logs.append({"c": name, "b": int(lg["blockNumber"], 16), "i": key[1], "tx": key[0], "t": int(lg["timeStamp"], 16),
                             "from": "0x" + lg["topics"][1][-40:], "to": "0x" + lg["topics"][2][-40:], "id": int(lg["topics"][3], 16)})
            print(f"  {name}: {sum(1 for x in logs if x['c'] == name)} transfers", flush=True)
            if len(page) < 1000: break
            frm = int(page[-1]["blockNumber"], 16)


def main():
    c = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    if "--from" in sys.argv: c = {"from": int(sys.argv[sys.argv.index("--from") + 1])}
    start = c.get("to", c.get("from", START_BLOCK) - 1) + 1
    logs = c.get("logs", [])
    head = start
    seen = {(lg["tx"], lg["i"]) for lg in logs}
    before = list(logs); fetched = int(time.time())
    try:
        _read_logs(start, logs, seen)
        head = max([start - 1] + [lg["b"] for lg in logs]) - 1 if logs else start - 1
    except SystemExit as e:
        # Blockscout rate limits bursts. Keep the holders we had and still refresh names and handles.
        print(f"  {e}; keeping the cached transfers through block {c.get('to')}")
        logs[:] = before; head = c.get("to", start - 1); fetched = c.get("fetched", fetched)   # the page must not claim a read it did not make
    # the next run starts after the newest block we saw; one block of overlap is dropped by the seen set
    logs.sort(key=lambda x: (x["b"], x["i"]))
    c.update({"from": c.get("from", START_BLOCK), "to": head, "logs": logs, "fetched": fetched})
    holders = sorted({lg["to"] for lg in logs if lg["to"] != ZERO} | {lg["from"] for lg in logs if lg["from"] != ZERO})
    c["ens"] = ens_names(holders)
    c["twitter"] = ens_twitter(c["ens"])
    c["keystone_meta"] = keystone_meta(sorted({lg["id"] for lg in logs if lg["c"] == "keystone"}), c.get("keystone_meta", {}))
    json.dump(c, open(CACHE, "w"), separators=(",", ":"))
    per = {k: sum(1 for lg in logs if lg["c"] == k) for k in CONTRACTS}
    print(f"chain.json: through block {head}, {per}, {len(c['ens'])} ENS names, {len(c['keystone_meta'])} Keystone names, {len(c['twitter'])} X handles")


if __name__ == "__main__":
    main()
