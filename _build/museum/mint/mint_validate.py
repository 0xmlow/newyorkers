#!/usr/bin/env python3
"""Check THE MUSEUM mint kit before anything is pinned. Exit 0 or do not pin.

  python3 validate.py            # the source kit: every file referenced exists, pages and doors resolve, copy is clean
  python3 validate.py --final    # also final/: every URI is ipfs:// or http, no relative paths left, royalty wallet set

Errors: bad JSON, missing keys, a referenced file missing, a door or page asset that does not resolve, a room page
without its base tag or mint lock, an em or en dash anywhere in the copy, a leaked internal field, numbering gaps,
a web GLB over 100 MB (OpenSea's 3D limit), a preview GIF over 20 MB. Warnings: GIF over 15 MB, full GLB over 100 MB.
"""
import argparse, glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument("--final", action="store_true")
ap.add_argument("--limit", type=int, default=80, help="how many errors to print")
A = ap.parse_args()
errors, warns = [], []
DASH = re.compile("[–—]")
LEAK = re.compile(r"prompt|seed|uuid|workflow|source_", re.I)
REQ = ("name", "description", "image", "animation_url", "external_url", "attributes")


def strings(x, path=""):
    if isinstance(x, dict):
        for k, v in x.items():
            if LEAK.search(k):
                errors.append(f"{path}: leaked field name '{k}'")
            yield from strings(v, f"{path}.{k}")
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from strings(v, f"{path}[{i}]")
    elif isinstance(x, str):
        yield path, x


def check_meta(folder, final):
    files = glob.glob(os.path.join(folder, "*"))
    nums = sorted(int(re.sub(r"\.json$", "", os.path.basename(f))) for f in files if re.fullmatch(r"\d+(\.json)?", os.path.basename(f)))
    if not nums:
        errors.append(f"{folder}: no metadata"); return 0
    if nums != list(range(1, len(nums) + 1)):
        errors.append(f"{folder}: numbering is not contiguous from 1 ({len(nums)} files, max {nums[-1]})")
    for f in files:
        tag = os.path.relpath(f, HERE)
        try:
            m = json.load(open(f))
        except Exception as e:
            errors.append(f"{tag}: bad JSON {e}"); continue
        for k in REQ:
            if not m.get(k):
                errors.append(f"{tag}: missing {k}")
        if not all(isinstance(a, dict) and "trait_type" in a and "value" in a for a in m.get("attributes", [])):
            errors.append(f"{tag}: attributes are not a trait list")
        for p, s in strings(m, tag):
            if DASH.search(s):
                errors.append(f"{p}: em or en dash in {s[:60]!r}")
            if "REPLACE" in s or "SET_" in s:
                errors.append(f"{p}: placeholder left: {s[:60]}")
            if s.startswith(("network/", "tokens/")):
                if final:
                    errors.append(f"{p}: relative path left in final metadata: {s}")
                elif not os.path.exists(os.path.join(HERE, s)):
                    errors.append(f"{p}: file not found: {s}")
        if final:
            for k in ("image", "animation_url"):
                if not re.match(r"(ipfs://|https?://)", m.get(k, "")):
                    errors.append(f"{tag}: {k} is not a URI: {m.get(k)}")
    return len(nums)


def check_network():
    net = os.path.join(HERE, "network")
    pages = sorted(glob.glob(os.path.join(net, "rooms", "*", "index.html")))
    if not pages:
        errors.append("network: no room pages"); return
    for p in pages:
        s = open(p).read()
        tag = os.path.relpath(p, HERE)
        if '<base href="../../">' not in s:
            errors.append(f"{tag}: no base tag")
        if "window.NY_MINT=" not in s or "window.NY_NET=" not in s:
            errors.append(f"{tag}: mint lock or network data missing")
        for ref in set(re.findall(r'(?:src|href)="(?![a-z]+:)([^"#?]+)', s)):
            if ref.startswith(("javascript", "mailto")) or ref.endswith("/"):
                continue
            if not os.path.exists(os.path.join(net, ref)):
                errors.append(f"{tag}: {ref} does not resolve in network/")
        m = re.search(r"window\.NY_NET=(\{.*?\});\(function", s, re.S)
        if m:
            for d in json.loads(m.group(1))["doors"]:
                if not os.path.exists(os.path.join(net, d["href"])):
                    errors.append(f"{tag}: door to {d['href']} goes nowhere")
    for f in ("index.html", "viewer.html", "network.json", "assets/mint/viewer.js", "assets/mint/network.js", "assets/mint/network.css"):
        if not os.path.exists(os.path.join(net, f)):
            errors.append(f"network/{f} missing")
    lobby = os.path.join(net, "index.html")
    if os.path.exists(lobby):
        s = open(lobby).read()
        if DASH.search(s):
            errors.append("network/index.html: em or en dash in the lobby")
        for ref in set(re.findall(r'(?:src|href)="(?![a-z]+:)([^"#?]+)', s)):
            if not os.path.exists(os.path.join(net, ref)):
                errors.append(f"network/index.html: {ref} does not resolve")


def check_sizes():
    for g in glob.glob(os.path.join(HERE, "tokens", "*", "*.gif")):
        mb = os.path.getsize(g) / 1e6
        if mb > 20:
            errors.append(f"{os.path.relpath(g, HERE)}: {mb:.1f} MB GIF, over the 20 MB card budget")
        elif mb > 15:
            warns.append(f"{os.path.relpath(g, HERE)}: {mb:.1f} MB GIF")
    for g in glob.glob(os.path.join(HERE, "tokens", "*", "room.web.glb")):
        if os.path.getsize(g) > 100e6:
            errors.append(f"{os.path.relpath(g, HERE)}: web GLB over 100 MB")
    for g in glob.glob(os.path.join(HERE, "tokens", "*", "room.glb")):
        if os.path.getsize(g) > 100e6:
            warns.append(f"{os.path.relpath(g, HERE)}: full GLB over 100 MB (listed in files only, never animation_url)")
    for t in glob.glob(os.path.join(HERE, "tokens", "*")):
        if not os.path.exists(os.path.join(t, "preview.gif")):
            errors.append(f"{os.path.relpath(t, HERE)}: no preview.gif")


n = check_meta(os.path.join(HERE, "metadata"), False)
check_meta(os.path.join(HERE, "metadata-object"), False)
check_network()
check_sizes()
c = json.load(open(os.path.join(HERE, "collection.json")))
for p, s in strings(c, "collection.json"):
    if DASH.search(s):
        errors.append(f"{p}: em or en dash")
if not re.fullmatch(r"0x[0-9a-fA-F]{40}", c.get("fee_recipient", "")):
    (errors if A.final else warns).append(f"collection.json: fee_recipient is not a wallet yet ({c.get('fee_recipient')}); royalty {c.get('seller_fee_basis_points')} bps needs MLow's sign off")
if A.final:
    fin = os.path.join(HERE, "final")
    check_meta(os.path.join(fin, "metadata"), True)
    check_meta(os.path.join(fin, "metadata-object"), True)
for w in warns:
    print("warn ", w)
for e in errors[:A.limit]:
    print("ERROR", e)
if len(errors) > A.limit:
    print(f"... and {len(errors) - A.limit} more errors")
print(f"{n} tokens checked · {len(errors)} errors · {len(warns)} warnings")
sys.exit(1 if errors else 0)
