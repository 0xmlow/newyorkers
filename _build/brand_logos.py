#!/usr/bin/env python3
"""MLow's N3W YORKERS logos, ready for the site: brand/logos_src/<n>.webp to assets/brand/logos/.

The 2026-10-01 set of twenty ChatGPT lockups. Each one is trimmed and set on a square plate of its
own background colour, because the black lettering vanishes on the dark site; number 14 came with a
transparent background and white lettering, so it also gets a clear version for dark grounds.

Nine of them (11, 12, 13, 15 to 20) have the generated "BY MLOW" lettering garbled. A garbled MLow is
never shown, so their last line, the byline, is cut off and the N3W YORKERS mark kept. Check the
contact sheet (_build/brand/logos_contact.jpg) after any change: the cut finds the byline as the
last band of ink, which is right for these eight and would be wrong for a logo with nothing below.

Writes assets/brand/logos/n3w-<nn>.png (720 square plates), n3w-<nn>-s.jpg (240, for the site chrome), n3w-14-clear.png and logos.json.
"""
import json, os
from PIL import Image, ImageChops, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
SRC = os.path.join(HERE, "brand", "logos_src")
OUT = os.path.join(SITE, "assets", "brand", "logos"); os.makedirs(OUT, exist_ok=True)
GARBLED = {11, 12, 13, 15, 17, 18, 19, 20}
# 16 carries its garbled byline inside the black base of the sign, so no clean cut exists: kept on disk, never shown
SKIP = {16}
CLEAR = {14}
SIZE = 720


def ink_mask(im, bg):
    diff = ImageChops.difference(im.convert("RGB"), Image.new("RGB", im.size, bg)).convert("L")
    return diff.point(lambda v: 255 if v > 38 else 0)


def drop_byline(im, mask):
    """Cut the last band of ink: rows with ink, separated from the band above by a clear gap."""
    w, h = im.size
    rows = [sum(1 for x in range(0, w, 3) if mask.getpixel((x, y))) for y in range(h)]
    bands, start, gap_min = [], None, max(8, h // 90)
    blank = 0
    for y, n in enumerate(rows):
        if n > 2:
            if start is None: start = y
            blank = 0
        elif start is not None:
            blank += 1
            if blank >= gap_min:
                bands.append((start, y - blank)); start, blank = None, 0
    if start is not None: bands.append((start, h - 1))
    if len(bands) < 2: return im, False
    cut = bands[-1][0] - gap_min // 2
    return im.crop((0, 0, w, cut)), True


def plate(n):
    im = Image.open(os.path.join(SRC, f"{n}.webp"))
    clear = n in CLEAR
    if clear:
        rgba = im.convert("RGBA"); bbox = rgba.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox()
        rgba = rgba.crop(bbox)
        cl = rgba.copy(); cl.thumbnail((1200, 1200), Image.LANCZOS); cl.save(os.path.join(OUT, f"n3w-{n:02d}-clear.png"), optimize=True)
        bg = (13, 13, 13); src = Image.new("RGBA", rgba.size, bg + (255,)); src.alpha_composite(rgba); src = src.convert("RGB")
    else:
        src = im.convert("RGB"); bg = src.getpixel((4, 4))
    cut = False
    if n in GARBLED:
        src, cut = drop_byline(src, ink_mask(src, bg))
    bbox = ink_mask(src, bg).getbbox() or (0, 0) + src.size
    src = src.crop(bbox)
    tile = Image.new("RGB", (SIZE, SIZE), bg)
    s = src.copy(); s.thumbnail((int(SIZE * .84), int(SIZE * .84)), Image.LANCZOS)
    tile.paste(s, ((SIZE - s.width) // 2, (SIZE - s.height) // 2))
    f = f"n3w-{n:02d}.png"; tile.save(os.path.join(OUT, f), optimize=True)
    sm = tile.resize((240, 240), Image.LANCZOS); sm.save(os.path.join(OUT, f"n3w-{n:02d}-s.jpg"), quality=86, optimize=True)
    return {"id": n, "file": f"assets/brand/logos/{f}", "small": f"assets/brand/logos/n3w-{n:02d}-s.jpg", "bg": "#%02x%02x%02x" % bg[:3], "dark": sum(bg[:3]) < 200,
            "byline": not cut, "use": n not in SKIP, "clear": f"assets/brand/logos/n3w-{n:02d}-clear.png" if clear else None}


def main():
    ids = sorted(int(f[:-5]) for f in os.listdir(SRC) if f.endswith(".webp"))
    out = [plate(n) for n in ids]
    json.dump({"_note": "built by _build/brand_logos.py; byline false means the garbled BY MLOW line was cut", "logos": out},
              open(os.path.join(OUT, "logos.json"), "w"), indent=1)
    # contact sheet for eyes
    cs = Image.new("RGB", (5 * 260, ((len(out) + 4) // 5) * 260), (40, 40, 40))
    for i, l in enumerate(out):
        t = Image.open(os.path.join(SITE, l["file"])).resize((250, 250), Image.LANCZOS)
        cs.paste(t, ((i % 5) * 260 + 5, (i // 5) * 260 + 5))
        ImageDraw.Draw(cs).text(((i % 5) * 260 + 10, (i // 5) * 260 + 8), str(l["id"]) + ("" if l["byline"] else " cut"), fill=(255, 0, 90))
    cs.save(os.path.join(HERE, "brand", "logos_contact.jpg"), quality=85)
    print(f"logos: {len(out)} plates, {sum(1 for l in out if not l['byline'])} bylines cut, {sum(1 for l in out if l['clear'])} clear")


if __name__ == "__main__":
    main()
