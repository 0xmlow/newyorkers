#!/usr/bin/env python3
"""Build the mint kit: one self contained folder per museum room, ready to pin and mint.

  python3 mint_kit.py                       # reads MUSEUM EXPORTS/<today>, writes MUSEUM MINT KIT <today>/
  python3 mint_kit.py --exports "MUSEUM EXPORTS/2026-09-06" --out "MUSEUM MINT KIT 2026-09-06"
  python3 mint_kit.py --rooms cathedral,vessel   # a subset

Each room folder holds
  index.html        the museum locked to that room, hang pinned to the export day, light on the New York clock
  assets/           only what the room touches: bundle, css, data, its atlases, its thumbs, its props, brand
  room.glb          the whole room as one binary glTF (textures inside), usable in any viewer or engine
  poster.png/jpg    the poster rendered at export time
  metadata.json     ERC 721 metadata, relative paths (run finalize.py after pinning to write ipfs:// URIs)
  room.json         the raw export record (hang, stats)
The kit root holds collection.json, manifest.json, manifest.csv, finalize.py and README.md.
"""
import argparse, csv, datetime, glob, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, "..", ".."))
ROOT = os.path.abspath(os.path.join(SITE, ".."))
TODAY = datetime.date.today().isoformat()

ap = argparse.ArgumentParser()
ap.add_argument("--exports", default=os.path.join(ROOT, "MUSEUM EXPORTS", TODAY))
ap.add_argument("--out", default=os.path.join(ROOT, f"MUSEUM MINT KIT {TODAY}"))
ap.add_argument("--rooms", default="")
ap.add_argument("--base-url", default="https://mlow.nyc")
ap.add_argument("--poster-width", type=int, default=1600)
A = ap.parse_args()
ONLY = set(x for x in A.rooms.split(",") if x)


def rooms_in_order():
    idx = open(os.path.join(HERE, "src/rooms/index.ts")).read()
    order = re.findall(r"\b([a-z]+)\b", idx[idx.index("ROOMS"):])
    defs = {}
    for f in sorted(glob.glob(os.path.join(HERE, "src/rooms/[a-z].ts"))):
        s = open(f).read()
        for m in re.finditer(r"export const (\w+): RoomDef = \{([\s\S]*?)\n  build\(", s):
            head = m.group(2)

            def g(k):
                mm = re.search(rf"\b{k}: (?:'((?:[^'\\]|\\.)*)'|\"([^\"]*)\")", head)
                if not mm:
                    return ""
                return (mm.group(1) if mm.group(1) is not None else mm.group(2)).replace("\\'", "'")

            d = dict(id=g("id"), name=g("name"), area=g("area"), mood=g("mood"), color=g("color"), description=g("description"), signatures=g("signatures"))
            d["daylit"] = "daylit: false" not in head
            defs[d["id"]] = d
    seq = []
    for r in order:
        if r in defs and r not in seq:
            seq.append(defs[r])
    return seq


def load_data():
    raw = open(os.path.join(SITE, "assets/data.js")).read()
    return json.loads(raw[raw.index("{"):raw.rindex("}") + 1])


def poster_jpg(src, dst, width):
    try:
        from PIL import Image
    except ImportError:
        return False
    im = Image.open(src).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=90, optimize=True, progressive=True)
    return True


def main():
    rooms = rooms_in_order()
    data = load_data()
    by_n = {p["n"]: p for p in data["pieces"]}
    eras = {int(e.get("n", e.get("i", 0)) or 0): e for e in data.get("eras", [])} if isinstance(data.get("eras"), list) else {}
    html = open(os.path.join(SITE, "museum.html")).read()
    brand = sorted(set(re.findall(r'assets/brand/[\w.\-]+', html)))
    os.makedirs(A.out, exist_ok=True)
    manifest, missing = [], []
    for i, d in enumerate(rooms, start=1):
        if ONLY and d["id"] not in ONLY:
            continue
        stem = f"new-yorkers-museum-{i:02d}-{d['id']}"
        src = {ext: os.path.join(A.exports, f"{stem}.{ext}") for ext in ("glb", "png", "json")}
        if not all(os.path.exists(p) for p in src.values()):
            missing.append(stem)
            continue
        info = json.load(open(src["json"]))
        folder = os.path.join(A.out, f"{i:02d}-{d['id']}")
        assets = os.path.join(folder, "assets")
        for sub in ("museum/props", "atlas", "t", "brand"):
            os.makedirs(os.path.join(assets, sub), exist_ok=True)
        # the engine and its data
        for rel in ("assets/config.js", "assets/data.js", "assets/museum/museum.js", "assets/museum/museum.css"):
            shutil.copy2(os.path.join(SITE, rel), os.path.join(folder, rel))
        for rel in brand:
            if os.path.exists(os.path.join(SITE, rel)):
                shutil.copy2(os.path.join(SITE, rel), os.path.join(folder, rel))
        used = info.get("assets", {})
        prefix = data["counts"].get("atlasPrefix", "d")
        for a in used.get("atlases", []):
            p = os.path.join(SITE, f"assets/atlas/{prefix}{a}.jpg")
            if os.path.exists(p):
                shutil.copy2(p, os.path.join(assets, "atlas", os.path.basename(p)))
        for t in used.get("thumbs", []):
            p = os.path.join(SITE, t)
            if os.path.exists(p):
                shutil.copy2(p, os.path.join(assets, "t", os.path.basename(p)))
        for name in used.get("props", []):
            p = os.path.join(SITE, f"assets/museum/props/{name}.glb")
            if os.path.exists(p):
                shutil.copy2(p, os.path.join(assets, "museum/props", f"{name}.glb"))
        # the page, locked to this room and pinned to the export day
        pin = f"<script>window.NY_MINT={json.dumps({'room': d['id'], 'day': info.get('day', TODAY), 'token': i})};</script>\n"
        page = html.replace('<script src="assets/museum/museum.js"></script>', pin + '<script src="assets/museum/museum.js"></script>')
        page = page.replace('<link rel="canonical" href="', '<link rel="canonical" data-live="').replace("</title>", f" · Room {i:02d} · {d['name']}</title>", 1)
        open(os.path.join(folder, "index.html"), "w").write(page)
        # the room as an object, the poster, the record
        shutil.copy2(src["glb"], os.path.join(folder, "room.glb"))
        shutil.copy2(src["png"], os.path.join(folder, "poster.png"))
        has_jpg = poster_jpg(src["png"], os.path.join(folder, "poster.jpg"), A.poster_width)
        shutil.copy2(src["json"], os.path.join(folder, "room.json"))
        # metadata
        hang = info.get("hang", [])
        pieces = [by_n[h["n"]] for h in hang if h.get("n") in by_n]
        era_set = sorted(set(p.get("e") for p in pieces if p.get("e")))
        fam_set = sorted(set(p.get("f") for p in pieces if p.get("f")))
        boro_set = sorted(set(p.get("b") for p in pieces if p.get("b")))
        attributes = [
            {"trait_type": "Room", "value": f"{i:02d}"},
            {"trait_type": "Place", "value": d["area"].title()},
            {"trait_type": "Title", "value": d["name"]},
            {"trait_type": "Mood", "value": d["mood"]},
            {"trait_type": "Light", "value": "New York clock" if d["daylit"] else "Fixed hour"},
            {"trait_type": "Hang", "value": f"Pinned to {info.get('day', TODAY)}"},
            {"trait_type": "Works on the walls", "value": len(hang), "display_type": "number"},
            {"trait_type": "Mounts", "value": info.get("mounts", 0), "display_type": "number"},
            {"trait_type": "Eras on the walls", "value": len(era_set), "display_type": "number"},
            {"trait_type": "Triangles", "value": info.get("triangles", 0), "display_type": "number"},
            {"trait_type": "Draw calls", "value": info.get("calls", 0), "display_type": "number"},
        ]
        for f in fam_set:
            attributes.append({"trait_type": "Family present", "value": f})
        for b in boro_set:
            attributes.append({"trait_type": "Borough present", "value": b})
        meta = {
            "name": f"NEW YORKERS · The Museum · Room {i:02d} · {d['name']}",
            "description": (
                f"{d['description']} A walkable Three.js room from THE MUSEUM, the virtual gallery of NEW YORKERS by MLow. "
                f"The light follows the New York clock; the hang is pinned to {info.get('day', TODAY)} in this token and reshuffles daily on the live site. "
                f"{len(hang)} works from the census on the walls. The room ships as a GLB alongside the playable page."
            ),
            "image": "poster.jpg" if has_jpg else "poster.png",
            "animation_url": "index.html",
            "external_url": f"{A.base_url}/museum.html#room={d['id']}",
            "background_color": d["color"].lstrip("#"),
            "attributes": attributes,
            "properties": {
                "collection": "NEW YORKERS · The Museum",
                "artist": "MLow",
                "room_id": d["id"],
                "token": i,
                "signatures": d["signatures"],
                "dynamic": {
                    "light": "The sky, sun, moon, fog and window glow blend by the hour in America/New_York when the room is daylit.",
                    "hang": "Curated New Yorkers for the place, reshuffled from the New York date seed; the token pins day " + info.get("day", TODAY) + ".",
                    "live": f"{A.base_url}/museum.html#room={d['id']}",
                },
                "files": [
                    {"uri": "room.glb", "type": "model/gltf-binary", "bytes": info.get("glbBytes", 0)},
                    {"uri": "poster.png", "type": "image/png"},
                    {"uri": "index.html", "type": "text/html"},
                    {"uri": "room.json", "type": "application/json"},
                ],
                "works": [{"n": h.get("n"), "title": h.get("t")} for h in hang],
            },
        }
        json.dump(meta, open(os.path.join(folder, "metadata.json"), "w"), indent=1, ensure_ascii=False)
        size = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(folder) for f in fs)
        manifest.append({"token": i, "id": d["id"], "folder": os.path.basename(folder), "name": d["name"], "area": d["area"], "works": len(hang), "glb_bytes": info.get("glbBytes", 0), "folder_bytes": size, "day": info.get("day", TODAY)})
        print(f"{i:02d} {d['id']:<12} works {len(hang):>2}  glb {info.get('glbBytes', 0)/1e6:6.1f} MB  folder {size/1e6:6.1f} MB")
    # kit level files
    collection = {
        "name": "NEW YORKERS · The Museum",
        "description": "Forty one walkable New York rooms built as a virtual museum for the NEW YORKERS census by MLow. Each token is one room: a playable page, the room as a GLB, a poster and the record of what hung on its walls the day it was minted. The light follows the New York clock.",
        "image": "01-bowery/poster.jpg" if manifest and manifest[0]["id"] == "bowery" else (manifest[0]["folder"] + "/poster.jpg" if manifest else ""),
        "external_link": f"{A.base_url}/museum.html",
        "seller_fee_basis_points": 500,
        "fee_recipient": "0x0000000000000000000000000000000000000000",
    }
    json.dump(collection, open(os.path.join(A.out, "collection.json"), "w"), indent=1, ensure_ascii=False)
    json.dump({"built": TODAY, "exports": A.exports, "rooms": manifest, "missing": missing}, open(os.path.join(A.out, "manifest.json"), "w"), indent=1)
    with open(os.path.join(A.out, "manifest.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(manifest[0].keys()) if manifest else ["token"])
        w.writeheader()
        w.writerows(manifest)
    shutil.copy2(os.path.join(HERE, "mint_finalize.py"), os.path.join(A.out, "finalize.py"))
    open(os.path.join(A.out, "README.md"), "w").write(README.format(n=len(manifest), day=TODAY, base=A.base_url))
    print(f"\n{len(manifest)} rooms in {A.out}")
    if missing:
        print("missing exports:", ", ".join(missing))


README = """# NEW YORKERS · The Museum · mint kit ({day})

{n} room folders. Each is a complete token: a playable page, the room as a GLB, a poster, the record.

## What is in a folder

- `index.html` opens the museum locked to this room. Every asset it needs sits beside it under `assets/`, so the folder works from a local disk, a web host or an IPFS gateway. Google Fonts are the only external call and the page falls back to system fonts without them.
- `room.glb` is the whole room as one binary glTF with the textures inside. Drop it in Blender, three.js, Spline, Unity, a Vision Pro viewer or any glTF reader.
- `poster.jpg` is the image marketplaces show. `poster.png` is the full render.
- `metadata.json` is ERC 721 metadata with relative paths. `room.json` is the raw export record: the hang, the mount count, triangles, draw calls.

## What is dynamic

- **Light.** Daylit rooms read the clock in America/New_York and blend sky, sun, moon, fog and window glow by the hour. Open the token at noon and at midnight and it is two different rooms. Fixed hour rooms (the Bowery after hours, the subway, Times Square, Grand Central, the library, the Apollo, the bleachers) keep their night.
- **Hang.** On the live site each room reshuffles its curated New Yorkers from the date seed every day. The token pins the day it was exported (`window.NY_MINT.day` in `index.html`) so the minted hang is stable and the record in `room.json` stays true. Remove the `day` key to make the token reshuffle daily like the site.
- **Live link.** `external_url` points at the live room on {base}. Whatever the contract stores, the museum keeps moving.

## Pinning and minting

1. Pin each folder to IPFS as a directory (web3.storage, Pinata or `ipfs add -r`). Note the folder CID.
2. Run `python3 finalize.py --cid <folderCID> <folder>` to rewrite that folder's `metadata.json` with `ipfs://<CID>/...` URIs. Repeat per room, or pass `--csv` with a two column file of folder,cid.
3. Pin the finalized `metadata.json` files (or a `metadata/` directory of all of them) and point `tokenURI` at them.
4. `collection.json` is contract level metadata. Set `fee_recipient` before use.

## A dynamic contract, if wanted

The tokens are dynamic without any contract help because the page reads the clock. For on chain state as well:
- ERC 7160 (multi metadata) lets a token carry several metadata URIs, one per light state or per hang day, with the holder or the contract choosing the pinned one.
- ERC 4906 lets the contract emit `MetadataUpdate` when the hang of the day changes, so marketplaces refresh the poster.
- Re export a room on any day with `museum.html?export=one&day=YYYY-MM-DD#room=<id>` and the export server running (`python3 _build/museum/export_server.py`), then rerun this kit for a new pinned state.

## Provenance

Built from the NEW YORKERS census site source in `NEW YORKERS SITE/_build/museum`. Rooms are procedural Three.js, textures are generated canvases, props are the enamel GLB set, the works are the census thumbnails and atlases. The GLB is exported with three.js GLTFExporter at 1024 px textures, PNG images only. Rooms with repeated seating or piles (the subway, the Met roof, Penn, the High Line, the Bleachers, Little Island) require `EXT_mesh_gpu_instancing`, which Blender 4, three.js, Babylon and glTF Sample Viewer all read.
"""

if __name__ == "__main__":
    main()
