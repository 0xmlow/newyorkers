"""CC0 props from Poly Haven: the 1k glTF with its bin and textures into site/assets/props/<id>/, textures cut to 512 px.
Credit: Poly Haven, CC0. Run once; the page loads them with GLTFLoader."""
import json, os, urllib.request
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, "..", "site", "assets", "props")
UA = {"User-Agent": "skelly-spiral/0.1 (NEW YORKERS x Marble Run)"}
IDS = ["painted_wooden_bench", "planter_box_01", "metal_trash_can", "modular_street_seating", "Barrel_01", "marble_bust_01", "WetFloorSign_01"]
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
for pid in IDS:
    d = os.path.join(OUT, pid); os.makedirs(d, exist_ok=True)
    f = json.loads(get(f"https://api.polyhaven.com/files/{pid}"))["gltf"]["1k"]["gltf"]
    open(os.path.join(d, "model.gltf"), "wb").write(get(f["url"]))
    g = json.load(open(os.path.join(d, "model.gltf")))
    for rel, inc in f.get("include", {}).items():
        p = os.path.join(d, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(get(inc["url"]))
        if rel.lower().endswith((".jpg", ".png")):
            im = Image.open(p); im.thumbnail((512, 512), Image.LANCZOS); im.save(p, quality=86) if p.lower().endswith(".jpg") else im.save(p, optimize=True)
    print(pid, sum(os.path.getsize(os.path.join(r, x)) for r, _, fs in os.walk(d) for x in fs) // 1000, "KB")
