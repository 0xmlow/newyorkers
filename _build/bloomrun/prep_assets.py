#!/usr/bin/env python3
"""One time asset prep for BLOOM RUN. Writes small, embeddable files into src/ that build_bloomrun.py
inlines into the single file game. Rerun only when a source changes; the outputs are committed.

  src/fonts/*.woff      the site's three faces, subset to printable ASCII plus the few symbols the
                        game prints, so the game looks like n3wyorkers.com with zero outside requests
  src/img/ny_*.jpg      MLow's N3W YORKERS logo lockups (the ChatGPT shortlist, never the SVG kit):
                        one for the title screen, the rest for the Times Square billboards
  src/blossoms.json     the seven Blossom icons as SVG path data, so the fLOWers are the real marks,
                        drawn as vectors (Path2D) instead of the old six petal doodle
"""
import os, re, json
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); B = os.path.dirname(HERE); SITE = os.path.dirname(B)
FONTS = os.path.join(B, "honoraries", "fonts"); OUT = os.path.join(HERE, "src")
os.makedirs(os.path.join(OUT, "fonts"), exist_ok=True); os.makedirs(os.path.join(OUT, "img"), exist_ok=True)

TEXT = "".join(chr(c) for c in range(32, 127)) + "×·★…’“”é"

def sub(src, dst, axes=None):
    f = TTFont(src)
    if axes: f = instancer.instantiateVariableFont(f, axes)
    o = subset.Options(); o.flavor = "woff"; o.layout_features = ["kern", "liga"]; o.name_IDs = ["*"]
    s = subset.Subsetter(o); s.populate(text=TEXT); s.subset(f)
    f.flavor = "woff"; f.save(dst); print(os.path.basename(dst), os.path.getsize(dst) // 1024, "KB")

sub(os.path.join(FONTS, "Fraunces.ttf"), os.path.join(OUT, "fonts", "fraunces.woff"), {"opsz": 72, "wght": 600, "SOFT": 0, "WONK": 0})
sub(os.path.join(FONTS, "Fraunces-Italic.ttf"), os.path.join(OUT, "fonts", "fraunces-italic.woff"), {"opsz": 72, "wght": 600, "SOFT": 0, "WONK": 1})
sub(os.path.join(FONTS, "SpaceGrotesk.ttf"), os.path.join(OUT, "fonts", "grotesk.woff"), {"wght": 500})
sub(os.path.join(FONTS, "IBMPlexMono-Medium.ttf"), os.path.join(OUT, "fonts", "plexmono.woff"))

LOGOS = os.path.join(B, "honoraries", "logos_chatgpt")
def logo(name, dst, px, q):
    im = Image.open(os.path.join(LOGOS, name)).convert("RGB"); im = im.resize((px, px), Image.LANCZOS)
    im.save(os.path.join(OUT, "img", dst), quality=q, optimize=True, progressive=True)
    print(dst, os.path.getsize(os.path.join(OUT, "img", dst)) // 1024, "KB")
logo("09-r4-19-subway-token.png", "ny_title.jpg", 360, 82)       # dark neon lockup: sits on the dark title screen
for i, n in enumerate(["09-r4-19-subway-token.png", "07-r4-04-underground.png", "01-early20-minimal-luxury.png",
                       "10-stacked-skyline.png", "02-early12-bridge-portal.png", "06-early06-n3y-monogram.png"]):
    logo(n, f"ny_bb{i}.jpg", 132, 74)                             # billboard faces

def rnd(d):
    # 3 decimals of a 512 unit box are invisible at 40 px; one is plenty. Keep the decimal point on every
    # rounded number: SVG packs ".04.5" as two numbers, and "0" followed by "0.5" would read as one (00.5)
    return re.sub(r"-?\d*\.\d+", lambda m: "%.1f" % float(m.group()), d)
icons = []
for i in range(1, 8):
    s = open(os.path.join(SITE, "assets", "brand", f"Blossom_Icons-0{i}.svg")).read()
    vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    icons.append({"vb": vb[2], "d": [rnd(d) for d in re.findall(r'<path[^>]* d="([^"]+)"', s)]})
json.dump(icons, open(os.path.join(OUT, "blossoms.json"), "w"), separators=(",", ":"))
print("blossoms.json", os.path.getsize(os.path.join(OUT, "blossoms.json")) // 1024, "KB,", [len(x["d"]) for x in icons], "paths")
