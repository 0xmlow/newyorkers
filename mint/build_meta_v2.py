#!/usr/bin/env python3
"""build_meta_v2.py: token 51's next metadata version, made from the one it carries now (2026-10-28).

token51_current.json is version 0 of token 51 on the Keystone contract (tokenURI read on chain 2026-10-28:
ipfs://bafybeia4mtuids3tjjgeaaovf53k3p3vxz6gbzr3vnxim46hztscq6fe6e/0, SuperRare's own JSON). Everything is
copied as is: name, description, external_url, attributes, tags, key order. Only what describes the files changes:
animation_url (and its sha256 and media.size), and the image (the GIF remade from v2) with its sha256, unless
--keep-image, which leaves the October image in place. MEDIA is filled by pin.py with the folder CID.
Writes metadata_v2.template.json.
"""
import json, os, sys, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
cur = json.load(open(os.path.join(HERE, "token51_current.json")))
piece, gif = os.path.join(HERE, "v2", "index.html"), os.path.join(HERE, "v2_media", "break_glass.gif")
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
v2 = dict(cur)
v2["animation_url"] = "ipfs://MEDIA/index.html"
v2["animation_sha256"] = sha(piece)
v2["media"] = dict(cur["media"], size=str(os.path.getsize(piece)))
if "--keep-image" not in sys.argv:
    v2["image"] = "ipfs://MEDIA/break_glass.gif"
    v2["image_sha256"] = sha(gif)
assert [k for k in v2] == [k for k in cur], "key order changed"
for k in ("name", "description", "external_url", "attributes", "tags"): assert v2[k] == cur[k], k
json.dump(v2, open(os.path.join(HERE, "metadata_v2.template.json"), "w"), indent=2, ensure_ascii=False)
print("metadata_v2.template.json written; image", "kept" if "--keep-image" in sys.argv else "replaced")
