"""post.py: the camera finish on the Cycles stills (Astra round 3, item 18). Restrained on purpose:
highlight-only glow ~2%, 0.2 stop corner vignette, 0.25 px lateral colour fringe at the corners (none in the centre),
0.45% luminance grain. Reads renders/<view>_full.png, writes renders/<view>_full.jpg.
  python3 blender/post.py [view ...]"""
import os, sys, glob
import numpy as np
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(HERE, 'renders')

def lin(a): return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
def srgb(a): a = np.clip(a, 0, 1); return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)

def finish(src, dst, seed=0):
    im = Image.open(src).convert('RGB'); W, H = im.size; a = lin(np.asarray(im, np.float32) / 255)
    # lateral colour: red a hair larger, blue a hair smaller, 0.25 px at the corner
    half = np.hypot(W, H) / 2; k = 0.25 / half
    def zoom(ch, f):
        c = Image.fromarray(ch.astype(np.float32), 'F'); w2, h2 = round(W * f), round(H * f); c = c.resize((w2, h2), Image.BICUBIC)
        x0, y0 = (w2 - W) // 2, (h2 - H) // 2
        if f >= 1: return np.asarray(c.crop((x0, y0, x0 + W, y0 + H)))
        out = Image.new('F', (W, H)); out.paste(Image.fromarray(ch.astype(np.float32), 'F')); out.paste(c, (-x0, -y0)); return np.asarray(out)
    a = np.stack([zoom(a[..., 0], 1 + k), a[..., 1], zoom(a[..., 2], 1 - k)], -1)
    # glow from the highlights only (the LEDs, the fixtures), blurred wide at quarter size
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]; hi = a * (np.clip((lum - 0.55) / 0.45, 0, 1))[..., None]
    sm = Image.fromarray((np.clip(hi, 0, 1) * 255).astype(np.uint8)).resize((W // 4, H // 4), Image.BILINEAR)
    g = np.zeros_like(a)
    for r_, w_ in ((4, 0.6), (16, 0.4)): g += w_ * np.asarray(sm.filter(ImageFilter.GaussianBlur(r_)).resize((W, H), Image.BILINEAR), np.float32) / 255
    a = a + 0.02 * g * 6
    # vignette: 0.2 stop at the corners, smooth
    yy, xx = np.mgrid[0:H, 0:W]; r2 = (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 2
    a = a * (2 ** (-0.2 * r2))[..., None]
    out = srgb(a)
    # grain in display space, slightly soft, mostly luminance
    rng = np.random.default_rng(seed); n = rng.normal(0, 0.0045, (H, W)).astype(np.float32)
    n = (n * 2 + np.roll(n, 1, 0) + np.roll(n, 1, 1) + np.roll(n, -1, 0) + np.roll(n, -1, 1)) / 6 * 1.6
    out = out + n[..., None] + rng.normal(0, 0.0012, out.shape).astype(np.float32)
    Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(dst, quality=92)

if __name__ == '__main__':
    views = sys.argv[1:] or [os.path.basename(p)[:-9] for p in sorted(glob.glob(os.path.join(R, '*_full.png'))) if not os.path.basename(p).startswith('ext_')]
    for i, v in enumerate(views):
        finish(os.path.join(R, v + '_full.png'), os.path.join(R, v + '_full.jpg'), i); print('finished', v)
