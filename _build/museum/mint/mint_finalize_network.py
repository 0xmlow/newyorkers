#!/usr/bin/env python3
"""Write the final, pinned metadata for THE MUSEUM once the folders are on IPFS. Never edits the source metadata.

  # tokens/ pinned as one directory
  python3 finalize.py --network-cid bafyNET --tokens-cid bafyTOK
  # tokens pinned file by file: fill the cid column of pin_plan.csv first
  python3 finalize.py --network-cid bafyNET --cids pin_plan.csv
  # options
  --platform erc721 (N.json, default) | studio-drops (bare N, OpenSea Studio Drops appends the bare token id)
  --gateway https://ipfs.io/ipfs/   http URIs instead of ipfs://
  --out final                       where to write (default final/)

Every string in the metadata that starts with network/ or tokens/ becomes an IPFS URI. The network directory
must be pinned as ONE CID: its room pages reach the shared engine and each other through relative paths.
Writes final/metadata/, final/metadata-object/ and final/collection.json, then run validate.py --final.
"""
import argparse, csv, glob, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument("--network-cid", required=True)
ap.add_argument("--tokens-cid", default="")
ap.add_argument("--cids", default="", help="pin_plan.csv with the cid column filled")
ap.add_argument("--platform", choices=["erc721", "studio-drops"], default="erc721")
ap.add_argument("--gateway", default="")
ap.add_argument("--out", default=os.path.join(HERE, "final"))
A = ap.parse_args()
if not (A.tokens_cid or A.cids):
    sys.exit("give --tokens-cid (one directory) or --cids pin_plan.csv (per file)")
root = (lambda cid: A.gateway.rstrip("/") + "/" + cid) if A.gateway else (lambda cid: "ipfs://" + cid)
per_file = {}
if A.cids:
    for row in csv.DictReader(open(A.cids)):
        if row.get("cid", "").strip():
            per_file[row["path"]] = row["cid"].strip()
missing = set()


def uri(s):
    if s.startswith("network/"):
        return root(A.network_cid) + "/" + s[len("network/"):]
    if s.startswith("tokens/"):
        if A.tokens_cid:
            return root(A.tokens_cid) + "/" + s[len("tokens/"):]
        if s in per_file:
            return root(per_file[s])
        missing.add(s)
    return s


def walk(x):
    if isinstance(x, dict):
        return {k: walk(v) for k, v in x.items()}
    if isinstance(x, list):
        return [walk(v) for v in x]
    if isinstance(x, str):
        return uri(x)
    return x


count = 0
for sub in ("metadata", "metadata-object"):
    src = os.path.join(HERE, sub)
    dst = os.path.join(A.out, sub)
    os.makedirs(dst, exist_ok=True)
    for p in sorted(glob.glob(os.path.join(src, "*.json")), key=lambda q: int(os.path.basename(q)[:-5])):
        m = walk(json.load(open(p)))
        n = os.path.basename(p)[:-5]
        name = n if A.platform == "studio-drops" else n + ".json"
        json.dump(m, open(os.path.join(dst, name), "w"), indent=1, ensure_ascii=False)
        count += 1
c = walk(json.load(open(os.path.join(HERE, "collection.json"))))
json.dump(c, open(os.path.join(A.out, "collection.json"), "w"), indent=1, ensure_ascii=False)
if missing:
    print(f"{len(missing)} token files have no CID yet, e.g. {sorted(missing)[:3]}. Fill pin_plan.csv and run again.")
    sys.exit(1)
print(f"{count} metadata files written to {A.out} ({A.platform}). Next: python3 validate.py --final, then pin {A.out}/metadata as one folder.")
