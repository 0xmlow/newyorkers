#!/usr/bin/env python3
"""Rewrite a room folder's metadata.json with ipfs:// URIs once the folder is pinned.

  python3 finalize.py --cid bafy... 39-cathedral
  python3 finalize.py --csv cids.csv            # rows of folder,cid
  python3 finalize.py --gateway https://w3s.link/ipfs/ --cid bafy... 39-cathedral   # http URIs instead

Relative paths in image, animation_url and properties.files become <base>/<path>.
The original file is kept as metadata.relative.json the first time it is rewritten.
"""
import argparse, csv, json, os, shutil

ap = argparse.ArgumentParser()
ap.add_argument("folders", nargs="*")
ap.add_argument("--cid")
ap.add_argument("--csv")
ap.add_argument("--gateway", default="", help="prefix instead of ipfs://, e.g. https://w3s.link/ipfs/")
A = ap.parse_args()


def finalize(folder, cid):
    p = os.path.join(folder, "metadata.json")
    keep = os.path.join(folder, "metadata.relative.json")
    if not os.path.exists(keep):
        shutil.copy2(p, keep)
    m = json.load(open(keep))
    base = (A.gateway.rstrip("/") + "/" + cid) if A.gateway else f"ipfs://{cid}"
    for k in ("image", "animation_url"):
        if m.get(k) and "://" not in m[k]:
            m[k] = f"{base}/{m[k]}"
    for f in m.get("properties", {}).get("files", []):
        if "://" not in f["uri"]:
            f["uri"] = f"{base}/{f['uri']}"
    m.setdefault("properties", {})["cid"] = cid
    json.dump(m, open(p, "w"), indent=1, ensure_ascii=False)
    print(f"{os.path.basename(folder)} -> {base}")


jobs = []
if A.csv:
    for row in csv.reader(open(A.csv)):
        if len(row) >= 2 and row[0].strip() and not row[0].startswith("#"):
            jobs.append((row[0].strip(), row[1].strip()))
for f in A.folders:
    if not A.cid:
        raise SystemExit("--cid is required with folder arguments")
    jobs.append((f, A.cid))
if not jobs:
    raise SystemExit(__doc__)
for folder, cid in jobs:
    finalize(folder, cid)
