"""Books for the PFP likeness redo. Stage 1 Krea Seedream 5 Pro (painting + PFP as refs), stage 2 FLORA FLUX 3 Image
(Krea result + PFP, the final edit pass). Krea and FLORA are driven over MCP, this only keeps the books.
  python3 books.py krea N        next N Krea inputs (JSON)
  python3 books.py set M field value   record k1_job / k1_url / f3_run / f3_url for marble M
  python3 books.py flux N        next N FLORA FLUX 3 items (JSON)
  python3 books.py get           download every finished url into k1/ and f3/
  python3 books.py status"""
import json, os, sys, urllib.request
import prompts
H = os.path.dirname(os.path.abspath(__file__)); B = f"{H}/books.json"
WS, PRJ = "ws_qd74cjtasft9ydr6yqneqjkqax822mhs", "prj_ns765drs0xtf1d940e77ax6tq98fzkt3"
r = json.load(open(f"{H}/redo.json")); IDS = r["invented"] + r["avatar_weak"]
h = json.load(open(f"{H}/hosted.json")); b = json.load(open(B)) if os.path.exists(B) else {}
cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
if cmd == "krea":
    n = int(sys.argv[2]); out = []
    for m in IDS:
        if "k1_job" in b.get(m, {}): continue
        src = h.get(f"orig_{m}") or h[f"paint_{m}"]
        out.append(dict(m=m, input=dict(prompt=prompts.krea(m), width=2560, height=1440, seed=11,
                   style_images=[dict(url=src, strength=1), dict(url=h[f"pfp_{m}"], strength=1)])))
    print(json.dumps(out[:n]))
elif cmd == "set":
    m, k, v = sys.argv[2:5]; b.setdefault(m, {})[k] = v; json.dump(b, open(B, "w"), indent=1)
elif cmd == "flux":
    n = int(sys.argv[2]); out = []
    for m in IDS:
        e = b.get(m, {})
        if "k1_url" not in e or "f3_run" in e: continue
        out.append(dict(workspace_id=WS, project_id=PRJ, type="image", model="is2i-flux-3-image-is2i", prompt=prompts.flux(m),
                        params=dict(image_urls=[e["k1_url"], h[f"pfp_{m}"]], aspect_ratio="16:9", resolution="2k")))
    print(json.dumps(out[:n]))
elif cmd == "get":
    for m, e in b.items():
        for st in ("k1", "f3"):
            p = f"{H}/{st}/{m}.jpg"
            if e.get(f"{st}_url") and not os.path.exists(p):
                d = urllib.request.urlopen(urllib.request.Request(e[f"{st}_url"], headers={"User-Agent": "Mozilla/5.0"}), timeout=120).read()
                from PIL import Image; from io import BytesIO
                Image.open(BytesIO(d)).convert("RGB").save(p, "JPEG", quality=94)
    print("got")
else:
    for m in IDS: print(m, {k: (v[:12] if k.endswith('url') else v) for k, v in b.get(m, {}).items()})
