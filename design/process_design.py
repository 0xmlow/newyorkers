"""FLORA design plates and sprites -> web assets for skelly.html.

raw/ holds the FLORA outputs (2026-10-09, project prj_ns765drs0xtf1d940e77ax6tq98fzkt3).
Writes NEW YORKERS SITE/assets/skelly/ui/:
  cap-<lane>.png      five bottle caps, cut on black with a circle mask, 256 px
  pigeon.png flower.png marble.png nazar.png cup.png   sprites cut on black, alpha from brightness
  hero.jpg  bodega.jpg  stoop.jpg  brick.jpg  chalk.jpg  web plates
  bodega.json         where the black TV screen sits in bodega.jpg, as percentages, so the iframe lands in it
"""
import json, os
import numpy as np
from PIL import Image, ImageFilter

H = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(H, 'raw')
OUT = os.path.join(H, '..', '..', 'NEW YORKERS SITE', 'assets', 'skelly', 'ui')
os.makedirs(OUT, exist_ok=True)

def spans(mask_cols, min_gap=12):
    """Runs of True columns, merged across gaps shorter than min_gap."""
    runs, start, gap = [], None, 0
    for x, on in enumerate(mask_cols):
        if on:
            if start is None: start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                runs.append((start, x - gap + 1)); start, gap = None, 0
    if start is not None: runs.append((start, len(mask_cols)))
    return [r for r in runs if r[1] - r[0] > 40]

def cut_row(path, names, thresh=28, circle=False, size=256):
    im = Image.open(path).convert('RGB'); a = np.asarray(im).astype(int)
    lum = a.max(axis=2)
    cols = (lum > thresh).sum(axis=0) > 3
    runs = spans(cols)
    assert len(runs) == len(names), f'{path}: found {len(runs)} objects, expected {len(names)}'
    for (x0, x1), name in zip(runs, names):
        rows = (lum[:, x0:x1] > thresh).sum(axis=1) > 3
        ys = np.where(rows)[0]; y0, y1 = ys[0], ys[-1] + 1
        pad = 8; box = (max(x0 - pad, 0), max(y0 - pad, 0), min(x1 + pad, im.width), min(y1 + pad, im.height))
        crop = im.crop(box); c = np.asarray(crop).astype(int)
        if circle:
            w, h = crop.size; r = min(w, h) / 2 - pad + 2
            yy, xx = np.mgrid[0:h, 0:w]; d = np.hypot(xx - w / 2, yy - h / 2)
            alpha = np.clip((r - d) * 2 + 1, 0, 1) * 255
        else:
            # brightness ramp for the black ground, then a soft edge; keeps steam and drips semi transparent
            m = c.max(axis=2)
            alpha = np.clip((m - 14) * 6, 0, 255)
        rgba = np.dstack([c, alpha]).astype(np.uint8)
        sprite = Image.fromarray(rgba, 'RGBA')
        if not circle:
            sprite.putalpha(sprite.getchannel('A').filter(ImageFilter.GaussianBlur(0.8)))
        sprite.thumbnail((size, size), Image.LANCZOS)
        sprite.save(os.path.join(OUT, name + '.png'), optimize=True)

def plate(src, name, w, q=80):
    im = Image.open(os.path.join(RAW, src)).convert('RGB')
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.jpg'), 'JPEG', quality=q, optimize=True, progressive=True)
    return im

def tv_screen(path, seed=(.57, .66), thresh=60, inset=.035):
    """Flood fill the dark CRT screen from a seed inside it, take its bounding box, inset past the rounded corners."""
    import collections
    im = Image.open(path).convert('L'); a = np.asarray(im).astype(int); h, w = a.shape
    sy, sx = int(seed[1] * h), int(seed[0] * w)
    assert a[sy, sx] < thresh, 'seed is not on the screen'
    seen = np.zeros_like(a, bool); q = collections.deque([(sy, sx)]); seen[sy, sx] = True
    while q:
        y, x = q.popleft()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < h and 0 <= xx < w and not seen[yy, xx] and a[yy, xx] < thresh:
                seen[yy, xx] = True; q.append((yy, xx))
    ys, xs = np.where(seen); t, b, l, r = ys.min(), ys.max(), xs.min(), xs.max()
    dy, dx = (b - t) * inset, (r - l) * inset
    t, b, l, r = t + dy, b - dy, l + dx, r - dx
    return {'left': round(l / w * 100, 2), 'top': round(t / h * 100, 2), 'width': round((r - l) / w * 100, 2), 'height': round((b - t) / h * 100, 2)}

def main():
    cut_row(os.path.join(RAW, 'caps.png'), ['cap-red', 'cap-blue', 'cap-yellow', 'cap-green', 'cap-cream'], circle=True)
    cut_row(os.path.join(RAW, 'sprites.png'), ['pigeon', 'flower', 'marble', 'nazar', 'cup'], size=320)
    plate('brick.png', 'brick', 1600, 74)
    plate('chalk.png', 'chalk', 1800, 72)
    for src, name, w in (('hero.png', 'hero', 2400), ('bodega.png', 'bodega', 1920), ('stoop.png', 'stoop', 2200)):
        if os.path.exists(os.path.join(RAW, src)): plate(src, name, w)
    if os.path.exists(os.path.join(RAW, 'bodega.png')):
        s = tv_screen(os.path.join(RAW, 'bodega.png'))
        json.dump(s, open(os.path.join(OUT, 'bodega.json'), 'w')); print('tv screen', s)
    tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(len(os.listdir(OUT)), 'files,', round(tot / 1e6, 2), 'MB in assets/skelly/ui')

if __name__ == '__main__':
    main()
