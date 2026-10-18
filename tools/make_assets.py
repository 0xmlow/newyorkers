"""make_assets.py: everything BIGGER ON THE INSIDE loads, gathered into public/ from MLow's own files.

  art        New Yorkers per room, picked by keyword from NEW YORKERS SITE/assets/data.js (1000 px thumbs, cloned)
  posters    MLow's NEW YORKERS posters (ChatGPT project outputs/ALL-NEW-YORKERS-POSTERS), 768 px tall jpg
  stickers   MLow's stickers (ON LOCATION work/stickers), 256 px png
  glb        props from the museum pack (NEW YORKERS SITE/assets/museum/props), unchanged
  tex        CC0 PBR surfaces from the museum (Poly Haven / ambientCG via the museum's surfaces folder)
  hdri       Poly Haven CC0 night HDRI (shanghai_bund, 1k)
  plates     ImageGen plates: window interiors (jpg 1024) and depth plates (jpg + Depth Anything V2 depth png)

Writes public/manifest.json (art by room, posters, stickers, provenance). Rerun after changing a list.
Run with the system python3 (needs Pillow; depth plates need torch + transformers, as THE MARKS gallery's depth.py)."""
import json, os, re, shutil, subprocess, sys, hashlib
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); PUB = os.path.join(ROOT, "public")
NY = os.path.dirname(ROOT)
SITE = os.path.join(NY, "NEW YORKERS SITE", "assets")
POSTERS = os.path.expanduser("~/.codex/.chatgpt-projects/g-p-6a6ac4d467dc8191a6b1f94b7eb3c2d0/outputs/ALL-NEW-YORKERS-POSTERS")
STICKERS = os.path.join(NY, "ON LOCATION 2026-10-10", "work", "stickers")

def clone(a, b):
    if os.path.exists(b): return
    os.makedirs(os.path.dirname(b), exist_ok=True)
    if subprocess.run(["cp", "-c", a, b], capture_output=True).returncode: shutil.copy2(a, b)

def sha(p): return hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]

# ---------- art: each room's New Yorkers, by keyword in the title, never the same piece twice ----------
s = open(os.path.join(SITE, "data.js")).read(); d = json.loads(s[s.index("{"):s.rindex("}") + 1])
pieces = [p for p in d["pieces"] if p.get("st")]
ROOMS = [  # room, how many, title keywords (whole words), pinned numbers first
    ("bodega", 28, r"bodega|deli|cat|coffee|bagel|bialy|sandwich|chopped|lotto|lottery|egg|seltzer|soda|candy|chips|hero|knish|pickle|counter|grocer|corner store", [932, 780, 971, 1113, 1015]),
    ("walkup", 64, r"landlord|super|tenant|neighbor|neighbour|walkup|walk-up|radiator|apartment|roommate|sublet|rent|lease|stoop|fire escape|hallway|stairs|stair|doorman|buzzer|skeleton key|door|window|kitchen|bed|couch|moving|elevator|mailbox|intercom", [1278, 899, 1354, 1361, 1570, 791, 888, 889]),
    ("studio", 8, r"murphy|studio|tiny|closet|tub|loft|bunk|futon", [1356, 1355, 1153, 1152]),
    ("laundromat", 12, r"laundr|wash\b|washer|dryer|sock|quarter|iron|tailor|dry clean|seamstress|sewing|knit", []),
    ("subway", 22, r"subway|train|mta|platform|metro|token|metrocard|turnstile|conductor|motorman|straphang|express|local|tunnel|el\b|line", [1502, 1499, 1331, 1323, 1040, 927]),
    ("rooftop", 14, r"roof|water tower|pigeon|skyline|tar beach|fireworks|moon|star|sky|antenna|chimney|helicopter|blimp|kite", [1464]),
    ("block", 18, r"street|block|corner|hydrant|lamppost|cab|taxi|pothole|sidewalk|crosswalk|bike|scaffold|graffiti|mural|vendor|cart|pizza|hot dog|halal", [1512, 1053, 548]),
]
used, art = set(), {}
by_n = {p["n"]: p for p in pieces}
for room, want, kw, pins in ROOMS:
    rx = re.compile(r"\b(" + kw + r")", re.I); out = []
    for n in pins:
        if n in by_n and n not in used: out.append(by_n[n]); used.add(n)
    for p in pieces:
        if len(out) >= want: break
        if p["n"] in used or not rx.search(p["t"]): continue
        if abs((p.get("ar") or 1.776) - 1.776) > 0.05: continue
        out.append(p); used.add(p["n"])
    art[room] = []
    for p in out:
        f = p["st"][0] + ".jpg"; src = os.path.join(SITE, "t", f)
        if not os.path.exists(src): continue
        clone(src, os.path.join(PUB, "art", f))
        art[room].append(dict(n=p["n"], t=p["t"], story=p.get("story", ""), ar=p.get("ar") or 1.776, f="art/" + f, place=p.get("nb") or p.get("b") or ""))
    print(f"art {room}: {len(art[room])}")

# ---------- posters ----------
posters = []
if os.path.isdir(POSTERS):
    names = sorted(f for f in os.listdir(POSTERS) if f.endswith(".png"))
    pick = [f for f in names if f.startswith("MOVIE-")] + [f for f in names if f.startswith("CLASSIC-")][::3]
    for f in pick:
        dst = os.path.join(PUB, "posters", f.replace(".png", ".jpg").lower())
        if not os.path.exists(dst):
            im = Image.open(os.path.join(POSTERS, f)).convert("RGB"); im.thumbnail((768, 1152), Image.LANCZOS); im.save(dst, quality=82, optimize=True, progressive=True)
        w, h = Image.open(dst).size
        posters.append(dict(f="posters/" + os.path.basename(dst), ar=round(w / h, 4), src="ALL-NEW-YORKERS-POSTERS/" + f))
print("posters", len(posters))

# ---------- stickers ----------
stickers = []
if os.path.isdir(STICKERS):
    names = sorted(os.listdir(STICKERS))
    named = [f for f in names if not f.startswith("lbl") and f.endswith(".png")]
    labels = [f for f in names if f.startswith("lbl") and f.endswith(".png")][::12]
    for f in named + labels:
        dst = os.path.join(PUB, "stickers", f)
        if not os.path.exists(dst):
            im = Image.open(os.path.join(STICKERS, f)).convert("RGBA"); im.thumbnail((256, 256), Image.LANCZOS); im.save(dst, optimize=True)
        w, h = Image.open(dst).size
        stickers.append(dict(f="stickers/" + f, ar=round(w / h, 4), kind="label" if f.startswith("lbl") else "mark"))
print("stickers", len(stickers))

# ---------- glb props from the museum pack ----------
GLB = ["fire_escape", "water_tower", "stoop", "hydrant", "mailbox", "lamppost", "utility_pole", "storm_drain", "h_taxi", "h_taxi_camry", "h_taxi_escape", "h_taxi_nv200", "h_taxi_sienna",
       "h_irt_kiosk", "npc_broker", "npc_cabbie", "npc_clerk", "npc_hustler", "npc_workgirl", "npc_wiseguy", "npc_actress", "npc_editor",
       "barney_bagel", "ph_cash_register", "pigeon", "dog", "bronze_figure", "mlow_eye_monument", "blossom_01", "blossom_03",
       "museum_bench", "penn_newsstand", "penn_turnstile", "tree", "quiet_bench", "turtle"]
for g in GLB: clone(os.path.join(SITE, "museum", "props", g + ".glb"), os.path.join(PUB, "glb", g + ".glb"))
print("glb", len(GLB))

# ---------- PBR surfaces and the night HDRI ----------
for m in ["brick", "asphalt", "concrete", "pavers", "plaster", "planks", "terrazzo", "marble", "steel", "cobble", "patina"]:
    for k in "cnr": clone(os.path.join(SITE, "museum", "surfaces", f"{m}_{k}.jpg"), os.path.join(PUB, "tex", f"{m}_{k}.jpg"))
clone(os.path.join(SITE, "museum", "hdri", "night.hdr"), os.path.join(PUB, "hdri", "night.hdr"))
# MLow's cab toppers: 12 screens (the MLOW mark, his topper creative, Keystone works), from the museum
for f in ("screens.jpg", "SOURCES.txt"): clone(os.path.join(SITE, "museum", "taxi", f), os.path.join(PUB, "taxi", f))

# ---------- ImageGen plates ----------
PL = os.path.join(ROOT, "plates"); interiors = []
for f in sorted(os.listdir(PL)) if os.path.isdir(PL) else []:
    if f.startswith("win_") and f.endswith(".png"):
        dst = os.path.join(PUB, "plates", f.replace(".png", ".jpg"))
        if not os.path.exists(dst):
            im = Image.open(os.path.join(PL, f)).convert("RGB").resize((1024, 1024), Image.LANCZOS); im.save(dst, quality=84, optimize=True, progressive=True)
        interiors.append("plates/" + os.path.basename(dst))
    elif f.startswith("win_") and f.endswith(".png"): pass
# the interior atlas: 3 x 3 tiles of 1024, read by the interior mapping shader (src/core/interior.ts)
if interiors:
    tiles = interiors[:9]; A = Image.new("RGB", (3072, 3072))
    for i, f in enumerate(tiles): A.paste(Image.open(os.path.join(PUB, f)).convert("RGB"), ((i % 3) * 1024, (i // 3) * 1024))
    A.resize((2048, 2048), Image.LANCZOS).save(os.path.join(PUB, "plates", "interiors.jpg"), quality=86, optimize=True, progressive=True)
    for f in interiors: os.remove(os.path.join(PUB, f))
    interiors = [os.path.basename(f) for f in tiles]
depth_todo = [os.path.join(PL, n + ".png") for n in ("skyline", "aisle_end", "tunnel") if os.path.exists(os.path.join(PL, n + ".png"))
              and not os.path.exists(os.path.join(PUB, "plates", n + "_d.png"))]
if depth_todo:
    import numpy as np, torch
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation
    from PIL import ImageFilter
    M = "depth-anything/Depth-Anything-V2-Small-hf"
    proc = AutoImageProcessor.from_pretrained(M); model = AutoModelForDepthEstimation.from_pretrained(M).eval()
    for f in depth_todo:
        n = os.path.splitext(os.path.basename(f))[0]; im = Image.open(f).convert("RGB")
        with torch.no_grad(): out = model(**proc(images=im, return_tensors="pt")).predicted_depth
        dd = torch.nn.functional.interpolate(out[None], size=(im.height, im.width), mode="bicubic")[0, 0].numpy()
        lo, hi = np.percentile(dd, 0.5), np.percentile(dd, 99.5); dd = np.clip((dd - lo) / (hi - lo), 0, 1)
        dm = Image.fromarray((dd * 255).astype(np.uint8)).resize((768, round(768 * im.height / im.width)), Image.LANCZOS)
        dm.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.2)).save(os.path.join(PUB, "plates", n + "_d.png"))
        im.resize((1600, round(1600 * im.height / im.width)), Image.LANCZOS).save(os.path.join(PUB, "plates", n + ".jpg"), quality=85, optimize=True, progressive=True)
        print("depth", n)

json.dump(dict(art=art, posters=posters, stickers=stickers, interiors=interiors, glb=GLB,
               provenance=dict(art="NEW YORKERS SITE/assets/t (1000 px display copies of MLow's census pieces)",
                               posters="MLow's ALL-NEW-YORKERS-POSTERS (ChatGPT project outputs), downsized, never cropped or recoloured",
                               stickers="MLow's stickers from ON LOCATION 2026-10-10/work/stickers, downsized",
                               glb="NEW YORKERS SITE/assets/museum/props (MLow's museum pack, Tripo and authored), unchanged",
                               tex="CC0 PBR surfaces via the museum's surfaces folder", hdri="Poly Haven CC0 shanghai_bund 1k",
                               plates="ImageGen (ChatGPT, through the Codex CLI) 2026-10-17, prompts in tools/concepts.py; depth by Depth Anything V2 Small")),
          open(os.path.join(PUB, "manifest.json"), "w"), indent=1, ensure_ascii=False)
print("manifest written")
