"""finish.py: composite MLow's exact logo into each Firefly poster and write the deliverables.

The logo is the supplied transparent PNG from the new-yorkers-movie-posters skill, never redrawn: white on a dark
corner, black on a light one, 20% of the poster width, 4% from the bottom right edges (the prompt asked the model to
leave that corner empty). Writes final/<NN_id>.jpg, final/manifest.json, contact.jpg.
  python3 posters/finish.py
"""
import json, os, glob
from PIL import Image, ImageStat
HERE = os.path.dirname(os.path.abspath(__file__))
SK = "/Users/degens/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/782bdcfa-efbb-4f97-ac74-d97c73bc6dee/ab1a3ffb-cac2-4835-b4f4-489a319b8167/skills/new-yorkers-movie-posters/assets"
OUT = os.path.join(HERE, "final"); os.makedirs(OUT, exist_ok=True)
todo = {t["name"]: t for t in json.load(open(os.path.join(HERE, "todo.json")))}
logos = {c: Image.open(os.path.join(SK, f"MLOW_logo_{c}.png")).convert("RGBA") for c in ("white", "black")}
man, done = {}, []
for f in sorted(glob.glob(os.path.join(HERE, "raw", "sd_*.png"))):
    name = os.path.basename(f)[3:-4]; t = todo.get(name)
    if not t: continue
    im = Image.open(f).convert("RGB"); W, H = im.size
    lw = round(W * 0.20); lg = {c: l.crop(l.getbbox()) for c, l in logos.items()}
    lh = round(lw * lg["white"].height / lg["white"].width); m = round(W * 0.04)
    box = (W - m - lw, H - m - lh, W - m, H - m)
    lum = ImageStat.Stat(im.crop(box).convert("L")).mean[0]
    col = "white" if lum < 140 else "black"
    im.paste(lg[col].resize((lw, lh), Image.LANCZOS), box[:2], lg[col].resize((lw, lh), Image.LANCZOS))
    out = os.path.join(OUT, name + ".jpg"); im.save(out, quality=92, optimize=True)
    man[name + ".jpg"] = {"title": t["title"], "tagline": t["tagline"], "model": "GPT Image 2.5 Sunburst, Adobe Firefly, Tall 2:3, High",
                          "size": [W, H], "refs": t["refs"], "logo": f"MLOW_logo_{col}.png", "logo_box": box, "corner_luminance": round(lum), "prompt": t["prompt"]}
    done.append(out)
json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), indent=1, ensure_ascii=False)
if done:
    th = [Image.open(p).resize((256, 384)) for p in done]; cols = min(6, len(th)); rows = (len(th) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 256, rows * 384), "black")
    for i, t in enumerate(th): sheet.paste(t, ((i % cols) * 256, (i // cols) * 384))
    sheet.save(os.path.join(HERE, "contact.jpg"), quality=85)
print(len(done), "posters finished:", ", ".join(f"{k} ({v['logo'][10:15]}, corner {v['corner_luminance']})" for k, v in man.items()))
