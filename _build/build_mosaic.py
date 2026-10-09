#!/usr/bin/env python3
"""THE MOSAIC: MLow in his cab, made of New Yorkers. Every tile is a real record and opens it.

Writes
  assets/mosaic/m00.jpg m01.jpg m10.jpg m11.jpg   the mosaic in four 2304 px quarters (phones cap textures at 4096)
  assets/mosaic/preview.jpg                       1200 px, for the share card and the NFT image
  assets/mosaic/data.js                           window.MOSAIC: grid, cell to thumbnail to piece, piece facts, minted snapshot
  api/mosaic.json                                 the live layer: which pieces are minted and who holds them. The NFT reads this
  mosaic.html                                     the page
  --nft                                           also writes the single file NFT into ../../MOSAIC NFT 2026-10-06/

The tile picker is the one from the EVERYTHING V2 film (seed 3, same weights), restricted to thumbnails that belong to a
current record, so no tile is a dead end. The picture is only rebuilt when that set of thumbnails or the target changes.
Run after build_collectors.py (it reads the chain snapshot)."""
import os, sys, json, glob, hashlib, base64, re, datetime
import numpy as np, cv2
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
SRC = os.path.join(HERE, "mosaic")
OUT = os.path.join(SITE, "assets", "mosaic")
T = os.path.join(SITE, "assets", "t")
CACHE = os.path.join(SRC, "cells.json")
GC, GR, TW, TH = 72, 128, 64, 36
VERSION = 1
sys.path.insert(0, HERE)
from page_shell import shell, cfg, esc

ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII"]


def load_data():
    s = open(os.path.join(SITE, "assets", "data.js")).read()
    return json.loads(s[s.index("{"):s.rindex("}") + 1])


def key_map(D):
    """thumbnail key -> (piece n, what the tile shows)"""
    h = {}
    for p in D["pieces"]:
        st = p.get("st", [])
        for i, k in enumerate(st):
            h.setdefault(k, (p["n"], "Painted" if i == 0 else f"State {i + 1} of {len(st)}"))
        if p.get("gl"):
            h.setdefault(p["gl"]["st"], (p["n"], "Glitch edition"))
        for f in p.get("fx", []) or []:
            h.setdefault(f["k"], (p["n"], {"card": "Card", "poster": "Poster", "meme": "Meme"}.get(f.get("t"), "Extra")))
    return h


def _tile(f):
    im = cv2.imread(f, cv2.IMREAD_REDUCED_COLOR_4)
    if im is None:
        return None
    return f, cv2.resize(im, (TW, TH), interpolation=cv2.INTER_AREA)


def build_picture(keys):
    fs = [os.path.join(T, k + ".jpg") for k in keys]
    with Pool(8) as p:
        res = [r for r in p.map(_tile, fs, chunksize=64) if r]
    names = [os.path.basename(r[0])[:-4] for r in res]
    tiles = np.stack([r[1] for r in res])
    lab = cv2.cvtColor(tiles.reshape(-1, TW, 3), cv2.COLOR_BGR2LAB).reshape(len(tiles), TH, TW, 3).astype(np.float32)
    tmean = lab.mean((1, 2))
    tgt = cv2.imread(os.path.join(SRC, "target.jpg"))[90:1170]
    tgt = cv2.resize(tgt, (GC * TW, GR * TH), interpolation=cv2.INTER_CUBIC)
    small = cv2.resize(tgt, (GC, GR), interpolation=cv2.INTER_AREA)
    slab = cv2.cvtColor(small, cv2.COLOR_BGR2LAB).astype(np.float32).reshape(-1, 3)
    use = np.zeros(len(tiles))
    order = np.random.default_rng(3).permutation(GC * GR)
    pick = np.zeros(GC * GR, int)
    for c in order:
        d = ((tmean - slab[c]) ** 2 * np.array([1.0, 1.4, 1.4])).sum(1) + use * 600
        k = int(np.argmin(d)); pick[c] = k; use[k] += 1
    M = np.zeros((GR * TH, GC * TW, 3), np.uint8)
    for c in range(GC * GR):
        r, q = divmod(c, GC)
        t = tiles[pick[c]].astype(np.float32)
        cell = tgt[r * TH:(r + 1) * TH, q * TW:(q + 1) * TW].astype(np.float32)
        t = t + (cell.mean((0, 1)) - t.mean((0, 1))) * 0.55          # pull each tile toward its cell so the portrait reads
        M[r * TH:(r + 1) * TH, q * TW:(q + 1) * TW] = np.clip(t * 0.8 + cell * 0.2, 0, 255).astype(np.uint8)
    os.makedirs(OUT, exist_ok=True)
    h, w = M.shape[:2]
    for a in range(2):
        for b in range(2):
            cv2.imwrite(os.path.join(OUT, f"m{a}{b}.jpg"), M[a * h // 2:(a + 1) * h // 2, b * w // 2:(b + 1) * w // 2], [cv2.IMWRITE_JPEG_QUALITY, 84])
    cv2.imwrite(os.path.join(OUT, "preview.jpg"), cv2.resize(M, (1200, 1200), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    cv2.imwrite(os.path.join(SRC, "full.jpg"), M, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return [names[i] for i in pick]


def minted(D):
    """Census pieces on chain, newest owner per token, named the way the collectors board names them."""
    ch = json.load(open(os.path.join(HERE, "collectors", "chain.json")))
    tr = json.load(open(os.path.join(HERE, "collectors", "census_traits.json")))
    ident = {}
    try:
        api = json.load(open(os.path.join(SITE, "api", "collectors.json")))
        for r in api["collectors"]:
            for a in [r["a"]] + r.get("also", []):
                ident[a.lower()] = (r.get("nm") or "", r.get("x") or "")
    except (OSError, KeyError):
        api = {"meta": {}}
    owner = {}
    for lg in sorted((l for l in ch["logs"] if l["c"] == "census"), key=lambda l: (l["b"], l["i"])):
        owner[lg["id"]] = lg["to"].lower()
    out = {}
    for tok, a in owner.items():
        t = tr.get(str(tok))
        if not t or a == "0x0000000000000000000000000000000000000000":
            continue
        nm, x = ident.get(a, (ch.get("ens", {}).get(a, ""), ch.get("twitter", {}).get(a, "")))
        out.setdefault(str(t["n"]), []).append([tok, nm or (a[:6] + "…" + a[-4:]), x, a])
    return out, api.get("meta", {})


def main():
    D = load_data()
    km = key_map(D)
    keys = sorted(k for k in km if os.path.exists(os.path.join(T, k + ".jpg")))
    sig = hashlib.sha256(("|".join(keys) + str(VERSION) + hashlib.sha256(open(os.path.join(SRC, "target.jpg"), "rb").read()).hexdigest()).encode()).hexdigest()[:16]
    cached = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    if cached.get("sig") != sig or not os.path.exists(os.path.join(OUT, "m00.jpg")):
        print("  mosaic: picking", len(keys), "thumbnails into", GC * GR, "cells")
        cells = build_picture(keys)
        json.dump({"sig": sig, "cells": cells}, open(CACHE, "w"))
    else:
        cells = cached["cells"]

    P = {p["n"]: p for p in D["pieces"]}
    K = sorted(set(cells)); ki = {k: i for i, k in enumerate(K)}
    ns = sorted({km[k][0] for k in K}); pi = {n: i for i, n in enumerate(ns)}
    pieces = []
    for n in ns:
        p = P[n]
        place = p.get("nb") or p.get("loc") or p.get("b") or ""
        if p.get("b") and p.get("b") not in place and p.get("b") != "Citywide":
            place = f"{place}, {p['b']}" if place else p["b"]
        pieces.append([n, p.get("t", ""), p.get("f", ""), ROMAN[p.get("e", 0)] if p.get("e", 0) < len(ROMAN) else str(p.get("e")),
                       place, p.get("story", ""), len(p.get("st", [])), (p.get("gl") or {}).get("fam", "")])
    mint, meta = minted(D)
    live = {"asOf": meta.get("asOf", ""), "block": meta.get("block", 0), "release": 1111, "mintedCount": meta.get("census", 0),
            "contract": "0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4", "minted": mint}
    os.makedirs(os.path.join(SITE, "api"), exist_ok=True)
    json.dump(live, open(os.path.join(SITE, "api", "mosaic.json"), "w"), separators=(",", ":"))
    payload = {"grid": [GC, GR, TW, TH], "hero": GC * 26 + 39, "K": K, "KP": [pi[km[k][0]] for k in K], "KS": [km[k][1] for k in K],
               "C": [ki[c] for c in cells], "P": pieces, "live": live, "built": datetime.date.today().isoformat(), "v": sig[:10]}
    js = "window.MOSAIC=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";"
    open(os.path.join(OUT, "data.js"), "w").write(js)
    for f in ("app.js", "app.css"):
        open(os.path.join(OUT, f), "w").write(open(os.path.join(SRC, f)).read())
    og = cv2.imread(os.path.join(OUT, "preview.jpg"))[260:890]
    cv2.imwrite(os.path.join(OUT, "og.jpg"), og, [cv2.IMWRITE_JPEG_QUALITY, 86])
    write_page(len(ns), len(cells))
    print(f"  mosaic: {len(cells)} tiles, {len(ns)} New Yorkers, {len(K)} images, {len(mint)} minted, data.js {len(js) // 1024} KB")
    if "--nft" in sys.argv:
        write_nft(js)


def body_html():
    return open(os.path.join(SRC, "body.html")).read()


def _v(f):
    return hashlib.sha256(open(os.path.join(OUT, f), "rb").read()).hexdigest()[:10]


def write_page(n_pieces, n_cells):
    C = cfg()
    desc = f"MLow in his cab, made of {n_pieces:,} New Yorkers in {n_cells:,} tiles. Click any tile to open the painting, its story and who holds it."
    page = shell(title="THE MOSAIC · NEW YORKERS by MLow", description=desc, path="mosaic.html", active="mosaic",
                 image=C["siteUrl"] + "/assets/mosaic/og.jpg?v=" + _v("og.jpg"),
                 keywords=["NEW YORKERS mosaic", "MLow mosaic", "photomosaic NFT", "interactive NFT", "census of New York"],
                 extra_head=f'<link rel="stylesheet" href="assets/mosaic/app.css?v={_v("app.css")}">',
                 jsonld={"@context": "https://schema.org", "@type": "VisualArtwork", "name": "THE MOSAIC", "url": C["siteUrl"] + "/mosaic.html",
                         "description": desc, "image": C["siteUrl"] + "/assets/mosaic/preview.jpg", "artform": "Interactive photomosaic",
                         "creator": {"@type": "Person", "name": "MLow", "url": C["artistUrl"]},
                         "isPartOf": {"@type": "CreativeWork", "name": "NEW YORKERS by MLow", "url": C["siteUrl"] + "/"}},
                 body=body_html(),
                 scripts_after=f'<script src="assets/three.min.js"></script>\n<script src="assets/mosaic/data.js?v={_v("data.js")}"></script>\n'
                               f'<script>window.MOSAIC_BASE="";</script>\n<script src="assets/mosaic/app.js?v={_v("app.js")}"></script>')
    open(os.path.join(SITE, "mosaic.html"), "w").write(page)


def write_nft(js):
    """One file, no dependencies on anything but the open web: three.js, the picture and the data are inline.
    The live layer and the full size paintings come from n3wyorkers.com when it answers, and the snapshot when it does not."""
    dest = os.path.join(os.path.dirname(SITE), "MOSAIC NFT 2026-10-06")
    os.makedirs(dest, exist_ok=True)
    three = open(os.path.join(SITE, "assets", "three.min.js")).read()
    tex = {}
    for a in range(2):
        for b in range(2):
            im = cv2.imread(os.path.join(OUT, f"m{a}{b}.jpg"))
            ok, buf = cv2.imencode(".jpg", im, [cv2.IMWRITE_JPEG_QUALITY, 80])
            tex[f"m{a}{b}"] = "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode()
    css = open(os.path.join(SRC, "app.css")).read()
    app = open(os.path.join(SRC, "app.js")).read()
    html = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>THE MOSAIC · NEW YORKERS by MLow</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>:root{{--ink:#080D16;--card:#0F1A26;--card2:#152536;--divider:#24394A;--cloud:#ECE8DD;--slate:#8FA7AB;--blue:#4692C2;--cyan:#61C9E2;--pink:#DC6F57;--acid:#ECC981;
--serif:"Fraunces",Georgia,serif;--sans:"Space Grotesk",-apple-system,Helvetica,Arial,sans-serif;--mono:"IBM Plex Mono",Menlo,monospace}}
*{{margin:0;padding:0;box-sizing:border-box}}html,body{{height:100%;background:#080D16;color:#ECE8DD;overflow:hidden}}a{{color:inherit}}
{css}
.mz{{height:100vh;height:100svh}}</style></head>
<body>
{body_html()}
<script>{three}</script>
<script>{js}</script>
<script>window.MOSAIC_BASE="https://n3wyorkers.com/";window.MOSAIC_NFT=true;window.MOSAIC_TEX={json.dumps(tex)};</script>
<script>{app}</script>
</body></html>"""
    p = os.path.join(dest, "new-yorkers-mosaic.html")
    open(p, "w").write(html)
    cv2.imwrite(os.path.join(dest, "new-yorkers-mosaic-image.jpg"), cv2.imread(os.path.join(SRC, "full.jpg")), [cv2.IMWRITE_JPEG_QUALITY, 92])
    print(f"  nft: {p} {os.path.getsize(p) / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
