#!/usr/bin/env python3
"""The site palette, pulled from MLow's paintings instead of picked (MLow 2026-10-09: "the shades of colors you use
on the site now are kind of nauseating, pull color hexes from my actual art").

  python3 palette_from_art.py --measure   samples 600 census thumbnails (assets/t) and prints the grounds and the
                                          vivid accents, the numbers the mapping below was chosen from
  python3 palette_from_art.py             rewrites the old electric palette (#2962FF blue, #00E5FF cyan, #FF2E63
                                          pink, #D7FF1F acid, the cold greys) in the CSS, JS and page builders

What the art is made of (2026-10-09 sample): midnight navy grounds (#070C16, #0A1C2B, #172F43), slate teal
(#3C6B7E, #83A9AE), brick and skin (#895146, #A1725E, #B89179), paper (#E7E9E1, #C5C3B7). The vivid pixels are
streetlight gold #ECC981, amber #E79650, coral #DC6F57, brick red #A23231, sky teal #61C9E2, harbor blue #4692C2,
mist #9CCCCF. None of the old electric colours appear in the paintings.
"""
import os, re, sys, random, colorsys

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)

# old -> new, hex and the same colour as an rgb triplet (rgba() uses)
MAP = [
    ("#2962FF", "#4692C2", "41,98,255", "70,146,194"),     # electric blue -> harbor blue
    ("#00E5FF", "#61C9E2", "0,229,255", "97,201,226"),     # neon cyan -> sky teal
    ("#FF2E63", "#DC6F57", "255,46,99", "220,111,87"),     # hot pink -> coral
    ("#ff4d7a", "#E59989", None, None),                    # pink hover -> blush
    ("#D7FF1F", "#ECC981", "215,255,31", "236,201,129"),   # acid -> streetlight gold
    ("#0D0D0D", "#080D16", "13,13,13", "8,13,22"),         # ink -> night navy
    ("#141820", "#0F1A26", "20,24,32", "15,26,38"),        # card
    ("#1A2030", "#152536", None, None),                    # card2
    ("#2A3040", "#24394A", None, None),                    # divider
    ("#F0F4F8", "#ECE8DD", "240,244,248", "236,232,221"),  # cloud -> paper white
    ("#8899AA", "#8FA7AB", None, None),                    # slate -> harbor mist
    ("#F4F1EA", "#EEE6D3", None, None),                    # paper
    ("#C9D2DC", "#CFD3CC", None, None),                    # body copy grey
    ("#1B4FD8", "#3A7FAE", None, None),                    # blue hover -> deep harbor
    ("#e6ff6b", "#F2D99A", None, None),                    # acid hover -> pale gold
    ("#2F6BFF", "#4692C2", None, None),                    # design pass blue -> harbor
]
FILES = [os.path.join(SITE, "assets", f) for f in os.listdir(os.path.join(SITE, "assets")) if f.endswith((".css", ".js"))
         and not f.startswith(("data", "rooms", "geo", "counts", "census_index"))]
FILES += [os.path.join(HERE, f) for f in os.listdir(HERE) if f.startswith("build_") and f.endswith(".py")] + [os.path.join(HERE, "page_shell.py")]
FILES += [os.path.join(SITE, f) for f in os.listdir(SITE) if f.endswith(".html")]  # hand written pages; generated ones come out the same from the builders


def measure():
    from PIL import Image
    t = os.path.join(SITE, "assets", "t"); fs = sorted(f for f in os.listdir(t) if f.endswith(".jpg"))
    random.seed(7); fs = random.sample(fs, 600)
    tile = Image.new("RGB", (1500, 1440))
    for i, f in enumerate(fs):
        tile.paste(Image.open(os.path.join(t, f)).convert("RGB").resize((60, 60)), ((i % 25) * 60, (i // 25) * 60))
    def show(im, n, title):
        q = im.quantize(colors=n, method=Image.Quantize.MEDIANCUT); pal = q.getpalette(); tot = sum(c for c, _ in q.getcolors())
        print(title)
        for c, i in sorted(q.getcolors(), reverse=True):
            print(f"  {c / tot * 100:5.1f}%  #{pal[i*3]:02X}{pal[i*3+1]:02X}{pal[i*3+2]:02X}")
    show(tile, 24, "grounds")
    px = [p for p in tile.getdata() if (lambda h, l, s: s > .5 and .3 < l < .78)(*colorsys.rgb_to_hls(*[c / 255 for c in p]))]
    v = Image.new("RGB", (len(px), 1)); v.putdata(px); show(v, 16, "vivid accents")


def apply():
    n = 0
    for f in FILES:
        s = o = open(f).read()
        for old, new, orgb, nrgb in MAP:
            s = re.sub(re.escape(old), new, s, flags=re.I)
            if orgb:
                s = re.sub(r"\b" + re.escape(orgb).replace(",", r",\s*") + r"\b", nrgb, s)
        if s != o:
            open(f, "w").write(s); n += 1; print("  repainted", os.path.relpath(f, SITE))
    print(n, "files repainted")


measure() if "--measure" in sys.argv else apply()
