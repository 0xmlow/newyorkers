"""figs.py: the painted figures (Firefly, from MLow's own paintings, on white) as relief cutouts.
The white is keyed out by a flood fill from the border, so the white of a skull or a shirt inside the figure stays.
Then Depth Anything V2 gives the relief. Writes site/assets/figs/<n>.png (RGBA, 768 tall... 1024 tall) and <n>_d.png.
usage: python3 _build/figs.py work/figs_raw/eviction.png ..."""
import sys, os, numpy as np, cv2, torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "site/assets/figs"); os.makedirs(OUT, exist_ok=True)
M = "depth-anything/Depth-Anything-V2-Small-hf"
proc = AutoImageProcessor.from_pretrained(M); model = AutoModelForDepthEstimation.from_pretrained(M).eval()
for f in sys.argv[1:]:
    n = os.path.splitext(os.path.basename(f))[0]
    im = np.asarray(Image.open(f).convert("RGB"))
    H, W = im.shape[:2]
    white = (im.min(axis=2) > 232) & (np.ptp(im, axis=2) < 22)
    mask = np.zeros((H + 2, W + 2), np.uint8); bg = white.astype(np.uint8)
    seeds = [(x, 0) for x in range(0, W, 16)] + [(x, H - 1) for x in range(0, W, 16)] + [(0, y) for y in range(0, H, 16)] + [(W - 1, y) for y in range(0, H, 16)]
    fill = np.zeros((H, W), np.uint8)
    work = bg.copy()
    for (x, y) in seeds:
        if work[y, x] == 1:
            m2 = np.zeros((H + 2, W + 2), np.uint8); cv2.floodFill(work, m2, (x, y), 2)
    fill = (work == 2)
    alpha = np.where(fill, 0, 255).astype(np.uint8)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8)); alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    ys, xs = np.where(alpha > 128); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    pad = 8; y0, x0 = max(0, y0 - pad), max(0, x0 - pad); y1, x1 = min(H, y1 + pad), min(W, x1 + pad)
    rgba = np.dstack([im, alpha])[y0:y1, x0:x1]
    with torch.no_grad():
        out = model(**proc(images=Image.fromarray(im), return_tensors="pt")).predicted_depth
    d = torch.nn.functional.interpolate(out[None], size=(H, W), mode="bicubic")[0, 0].numpy()[y0:y1, x0:x1]
    a = rgba[..., 3] > 128; lo, hi = np.percentile(d[a], 2), np.percentile(d[a], 99.5)
    d = np.clip((d - lo) / (hi - lo), 0, 1) * a
    d = cv2.GaussianBlur((d * 255).astype(np.uint8), (9, 9), 0)
    h = 1024; w = round(h * rgba.shape[1] / rgba.shape[0])
    Image.fromarray(rgba).resize((w, h), Image.LANCZOS).save(os.path.join(OUT, n + ".png"), optimize=True)
    Image.fromarray(d).resize((w // 4, h // 4), Image.LANCZOS).save(os.path.join(OUT, n + "_d.png"))
    print(n, (w, h), "figure", int(a.mean() * 100), "% of the box")
