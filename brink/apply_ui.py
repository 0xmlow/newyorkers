"""Bryan's palette on the SKELLY CUP page plates (hero board, chalk, bottle caps, cup, marble, flower), from brink/originals/ui.
Brick, stoop and bodega are left as painted: the recolour would turn the brick pink."""
import os, sys
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
from recolor import recolor
UI = os.path.join(H, "..", "..", "NEW YORKERS SITE", "assets", "skelly", "ui")
for f in sorted(os.listdir(f"{H}/originals/ui")):
    im = Image.open(f"{H}/originals/ui/{f}"); out = recolor(im.convert("RGB"))
    if f.endswith(".png"):
        out = out.convert("RGBA"); out.putalpha(im.convert("RGBA").getchannel("A")); out.save(f"{UI}/{f}", optimize=True)
    else:
        out.save(f"{UI}/{f}", "JPEG", quality=84, optimize=True, progressive=True)
    print(f)
