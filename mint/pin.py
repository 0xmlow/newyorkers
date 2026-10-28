#!/usr/bin/env python3
"""pin.py: put BREAK GLASS on IPFS through Pinata, with the census kit's pinlib and its key.

1. dist/ (the piece, the GIF, the still, the film) goes up as ONE folder, so every URI shares a CID:
   ipfs://<media>/index.html is animation_url, ipfs://<media>/break_glass.gif is image.
2. metadata.json is filled with that CID and pinned on its own: that CID is the tokenURI.
Writes dist/metadata.json and pins.json. The key never leaves the env file and is never printed.
"""
import io, json, os, sys, shutil, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), "CENSUS RELEASE 2026-09-23", "_build"))
import pinlib

# --v2 (2026-10-28): the upgraded piece for token 51's next version. Pins mint/v2/index.html (build_mint.py) with the
# remade GIF and still (mint/v2_media) as one folder into dist_v2/, fills metadata_v2.template.json (build_meta_v2.py,
# token 51's current JSON with only the file fields changed) and writes pins_v2.json, leaving the first pin's record
# alone. The film is not re-pinned: it is already token 51's version 1.
V2 = "--v2" in sys.argv
TAG = "_v2" if V2 else ""
DIST = os.path.join(HERE, "dist" + TAG); os.makedirs(DIST, exist_ok=True)
if V2:
    SRC = {"index.html": os.path.join(HERE, "v2", "index.html"), "break_glass.gif": os.path.join(HERE, "v2_media", "break_glass.gif"),
           "preview.png": os.path.join(HERE, "v2_media", "preview.png")}
else:
    SRC = {"index.html": os.path.join(ROOT, "site", "index.html"), "break_glass.gif": os.path.join(HERE, "break_glass.gif"),
           "preview.png": os.path.join(ROOT, "PREVIEW.png"), "break_glass_film.mp4": os.path.join(HERE, "break_glass_film.mp4")}
for name, src in SRC.items():
    if not os.path.exists(src): sys.exit(f"missing {src}")
    if subprocess_ok := True:
        dst = os.path.join(DIST, name)
        if os.path.exists(dst): os.remove(dst)
        if os.system(f'cp -c "{src}" "{dst}" 2>/dev/null') != 0: shutil.copy2(src, dst)
sha = {n: hashlib.sha256(open(os.path.join(DIST, n), 'rb').read()).hexdigest() for n in SRC}
if "--dry" in sys.argv and V2:   # check the set and the metadata without touching Pinata
    meta = json.loads(open(os.path.join(HERE, "metadata_v2.template.json")).read())
    assert meta["animation_sha256"] == sha["index.html"], "animation_sha256 does not match v2/index.html"
    assert not meta["image"].endswith("break_glass.gif") or meta["image_sha256"] == sha["break_glass.gif"], "image_sha256 does not match the GIF"
    print(json.dumps({n: [os.path.getsize(os.path.join(DIST, n)), sha[n]] for n in SRC}, indent=1)); print("dry run: nothing pinned"); sys.exit(0)

jwt, _ = pinlib.load_env()
pinlib.auth_check(jwt)
pinlib.set_transport("v2")
parts = [("file", ("break-glass/" + n, open(os.path.join(DIST, n), "rb"))) for n in SRC]
media = pinlib.upload(jwt, parts, name="BREAK GLASS media" + TAG, timeout=1800)["cid"]
if not media: sys.exit("no CID returned for the media folder")
print("media folder CID:", media)

if V2:
    meta = json.loads(open(os.path.join(HERE, "metadata_v2.template.json")).read().replace("MEDIA", media))
    if meta["animation_sha256"] != sha["index.html"]: sys.exit("metadata_v2 animation_sha256 is not the pinned index.html: rerun build_meta_v2.py")
    if meta["image"].endswith("break_glass.gif") and meta["image_sha256"] != sha["break_glass.gif"]: sys.exit("metadata_v2 image_sha256 is not the pinned GIF")
else:
    meta = json.loads(open(os.path.join(HERE, "metadata.template.json")).read().replace("MEDIA", media))
    meta["properties"]["sha256"] = sha
    for f in meta["properties"]["files"]: f["size"] = os.path.getsize(os.path.join(DIST, f["uri"].rsplit("/", 1)[1]))
json.dump(meta, open(os.path.join(DIST, "metadata.json"), "w"), indent=2)
mcid = pinlib.upload(jwt, [("file", ("metadata.json", io.BytesIO(json.dumps(meta, indent=2).encode())))], name="BREAK GLASS metadata" + TAG)["cid"]
print("metadata CID:", mcid)
pins = {"media_folder": media, "animation_url": meta["animation_url"], "image": meta["image"],
        **({} if V2 else {"film": f"ipfs://{media}/break_glass_film.mp4"}), "still": f"ipfs://{media}/preview.png",
        "metadata": mcid, "tokenURI": f"ipfs://{mcid}", "sha256": sha,
        "gateway": {"piece": f"https://ipfs.io/ipfs/{media}/index.html", "metadata": f"https://ipfs.io/ipfs/{mcid}"}}
json.dump(pins, open(os.path.join(HERE, f"pins{TAG}.json"), "w"), indent=2)
print(json.dumps(pins, indent=2))
