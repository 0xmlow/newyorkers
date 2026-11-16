"""tools/atlas.py: the four 2x2 interior grids (work/v2/grid_*.jpg) into one 4x4 atlas, site/assets/arch/interiors.jpg.
Cells 0 to 3 grid_shops_a, 4 to 7 grid_shops_b, 8 to 11 grid_apts_a, 12 to 15 grid_apts_b, each in reading order.
The shader insets each cell by 6% so the grids' black gutters never show."""
import os
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); C = 1024
A = Image.new("RGB", (4 * C, 4 * C))
for gi, n in enumerate(["grid_shops_a", "grid_shops_b", "grid_apts_a", "grid_apts_b"]):
    im = Image.open(os.path.join(R, "work", "v2", n + ".jpg")).convert("RGB"); w, h = im.size
    for k in range(4):
        x0, y0, x1, y1 = (k % 2) * w // 2, (k // 2) * h // 2, (k % 2 + 1) * w // 2, (k // 2 + 1) * h // 2
        if n == "grid_shops_b":   # these came back with painted shopfront frames, thickest at the sill: crop to the display
            cw, ch = x1 - x0, y1 - y0; x0 += int(cw * 0.05); x1 -= int(cw * 0.05); y0 += int(ch * 0.03); y1 -= int(ch * 0.12)
        cell = im.crop((x0, y0, x1, y1)).resize((C, C), Image.LANCZOS)
        idx = gi * 4 + k; A.paste(cell, ((idx % 4) * C, (idx // 4) * C))
os.makedirs(os.path.join(R, "site", "assets", "arch"), exist_ok=True)
A.save(os.path.join(R, "site", "assets", "arch", "interiors.jpg"), quality=86); A.resize((1024, 1024)).save(os.path.join(R, "work", "atlas_proof.jpg"), quality=80)
print("atlas", os.path.getsize(os.path.join(R, "site", "assets", "arch", "interiors.jpg")) // 1024, "KB")
