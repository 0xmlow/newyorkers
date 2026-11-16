"""tools/install_v2.py: put the v2 Krea images where the gallery reads them.
wall_<room>_<l|r>.jpg -> site/assets/walls/<room>_<l|r>.jpg (2048x1024)
plate_<room>.jpg      -> work/plates_raw/<room>.jpg (old one kept in work/plates_v1), then Depth Anything V2 Small
                         (the virtual-architect skill's depth_anything.py, local and free) writes site/assets/plates + depth."""
import os, shutil, subprocess, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V2 = os.path.join(ROOT, "work", "v2"); A = os.path.join(ROOT, "site", "assets")
DEPTH = os.path.expanduser("~/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/782bdcfa-efbb-4f97-ac74-d97c73bc6dee/ab1a3ffb-cac2-4835-b4f4-489a319b8167/skills/virtual-architect/scripts/depth_anything.py")
os.makedirs(os.path.join(A, "walls"), exist_ok=True); os.makedirs(os.path.join(ROOT, "work", "plates_v1"), exist_ok=True)
plates = []
for f in sorted(os.listdir(V2)):
    if f.startswith("._") or not f.endswith(".jpg"): continue
    n = f[:-4]
    if n.startswith("wall_"):
        dst = os.path.join(A, "walls", n[5:] + ".jpg")
        if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(os.path.join(V2, f)): continue
        Image.open(os.path.join(V2, f)).convert("RGB").resize((2048, 1024), Image.LANCZOS).save(dst, quality=86); print("wall", n[5:])
    elif n.startswith("ad_"):
        os.makedirs(os.path.join(A, "ads"), exist_ok=True); dst = os.path.join(A, "ads", n + ".jpg")
        im = Image.open(os.path.join(V2, f)).convert("RGB"); im.thumbnail((1600, 1600)); im.save(dst, quality=88); print("ad", n)
    elif n.startswith("plate_"):
        room = n[6:]; raw = os.path.join(ROOT, "work", "plates_raw", room + ".jpg"); old = os.path.join(ROOT, "work", "plates_v1", room + ".jpg")
        if os.path.exists(raw) and not os.path.exists(old): shutil.copy2(raw, old)
        if os.path.exists(raw) and os.path.getmtime(raw) >= os.path.getmtime(os.path.join(V2, f)): continue
        shutil.copy2(os.path.join(V2, f), raw); plates.append(raw); print("plate", room)
if plates and "--nodepth" not in sys.argv:
    subprocess.run([sys.executable, DEPTH, "plate", A] + plates, check=True)
