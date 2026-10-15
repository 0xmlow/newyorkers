"""Collect every painted still of the Keystone 111 from the mint kit and write art.js
(webp, embedded as data URIs) for the BREAK GLASS 1/1."""
import json, glob, os, io, base64, sys
from PIL import Image
KIT = os.path.join(os.path.dirname(__file__), "..", "..", "KEYSTONE 111 MINT KIT 2026-09-17", "tokens")
EDGE = int(sys.argv[1]) if len(sys.argv) > 1 else 1280
Q = int(sys.argv[2]) if len(sys.argv) > 2 else 72
out, total = [], 0
for tj in sorted(glob.glob(os.path.join(KIT, "*", "token.json"))):
    t = json.load(open(tj)); folder = os.path.dirname(tj)
    for s in t["states"]:
        if s["kind"] != "still": continue
        im = Image.open(os.path.join(folder, s["file"])).convert("RGB")
        im.thumbnail((EDGE, EDGE), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, "WEBP", quality=Q, method=6); data = b.getvalue(); total += len(data)
        lab = s["label"]
        tier = 3 if "bootleg" in lab.lower() else (1 if s["state"] == t["pinned_state"] else 2)
        out.append(dict(id=t["token_id"], no=t["census_number"], t=t["title"], g=t["group"], ch=t.get("chapter",""),
                        st=s["state"], lab=lab, tier=tier, w=im.width, h=im.height,
                        src="data:image/webp;base64," + base64.b64encode(data).decode()))
print(len(out), "stills from", len({o["id"] for o in out}), "works,", round(total/1e6, 2), "MB raw", file=sys.stderr)
for c in "—–":
    assert not any(c in o["t"] + o["g"] + o["ch"] + o["lab"] for o in out), "dash in copy"
open(os.path.join(os.path.dirname(__file__), "art.js"), "w").write("window.KEYSTONE=" + json.dumps(out, separators=(",", ":")) + ";")
