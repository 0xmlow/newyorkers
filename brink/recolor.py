"""Bryan Brinkman's palette on the SKELLY CUP paintings (MLow 2026-10-09).

His four: pink f2668b, cyan 23c7d9, mint 48d9a4, yellow f2bf27. The paintings were made with primary skully lanes,
so each colour family is moved onto his twin, the way a Photoshop Hue/Saturation layer with per colour ranges does:
reds to pink, blues to cyan, greens to mint, yellows to his yellow. Weight falls off with hue distance and with low
saturation, so skin, brick, night and greys stay as painted. Usage: recolor.py SRC DST [--strength 1]
"""
import sys, colorsys, numpy as np
from PIL import Image

def hsv(hx):
    r, g, b = (int(hx[i:i + 2], 16) / 255 for i in (0, 2, 4)); return colorsys.rgb_to_hsv(r, g, b)

# (source hue centre deg, half width deg, target hex)
BANDS = [(355, 22, "f2668b"), (215, 38, "23c7d9"), (125, 40, "48d9a4"), (52, 12, "f2bf27")]

# brightness gain per colour, so shading survives and lit lanes land on his values
GAIN = {"48d9a4": 1.55, "23c7d9": 1.2, "f2668b": 1.3, "f2bf27": 1.08}

def recolor(im, k=1.0):
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255
    mx = a.max(2); mn = a.min(2); d = mx - mn; v = mx; s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; dd = np.maximum(d, 1e-6)
    h = np.where(mx == r, (g - b) / dd % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60
    h = np.where(d == 0, 0, h)
    gate = np.clip((s - 0.22) / 0.25, 0, 1) * np.clip((v - 0.12) / 0.2, 0, 1)
    deep = np.clip((v - 0.18) / 0.3, 0, 1)  # navy night skies move less than painted lanes
    nh, ns, nv = h.copy(), s.copy(), v.copy()
    for c, w, hx in BANDS:
        th, ts, tv = hsv(hx); th *= 360
        dist = np.abs((h - c + 180) % 360 - 180)
        wt = np.clip(1 - dist / w, 0, 1) ** 0.7 * gate * k
        if hx == "23c7d9": wt = wt * (0.35 + 0.65 * deep)
        shift = (th - c + 180) % 360 - 180
        # keep the pixel's offset inside the band so texture survives, compressed toward the target
        off = (h - c + 180) % 360 - 180
        newh = (c + shift + off * 0.35) % 360
        dh = (newh - nh + 180) % 360 - 180
        nh = (nh + dh * wt) % 360
        # dark pixels keep their depth (night stays night), lit ones are lifted toward his value
        gv = 1 + (GAIN[hx] - 1) * np.clip((v - 0.15) / 0.3, 0, 1)
        ns = ns + ((ts * 0.7 + s * 0.3) - ns) * wt
        nv = nv + (np.minimum(v * gv, 1) - nv) * wt
    hh = nh / 60; i = np.floor(hh) % 6; f = hh - np.floor(hh)
    p = nv * (1 - ns); q = nv * (1 - ns * f); t = nv * (1 - ns * (1 - f))
    sel = [i == j for j in range(6)]
    R = np.select(sel, [nv, q, p, p, t, nv]); G = np.select(sel, [t, nv, nv, q, p, p]); B = np.select(sel, [p, p, t, nv, nv, q])
    return Image.fromarray((np.clip(np.stack([R, G, B], 2), 0, 1) * 255 + .5).astype(np.uint8))

if __name__ == "__main__":
    k = float(sys.argv[sys.argv.index("--strength") + 1]) if "--strength" in sys.argv else 1.0
    recolor(Image.open(sys.argv[1]), k).save(sys.argv[2], "JPEG", quality=94, subsampling=0)
