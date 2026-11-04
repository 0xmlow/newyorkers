"""depth.py: plate -> depth map with Depth Anything V2 (local, free), the MONA geometry pass.
usage: python3 _build/depth.py work/plates_raw/street.png ...   writes site/assets/plates/<n>.jpg (2048 wide)
and site/assets/depth/<n>.png (1024 wide, 8 bit, near = white), smoothed so edges do not tear."""
import sys, os, numpy as np, torch
from PIL import Image, ImageFilter
from transformers import AutoImageProcessor, AutoModelForDepthEstimation
M = "depth-anything/Depth-Anything-V2-Small-hf"
proc = AutoImageProcessor.from_pretrained(M); model = AutoModelForDepthEstimation.from_pretrained(M).eval()
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for f in sys.argv[1:]:
    n = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f).convert("RGB")
    with torch.no_grad():
        out = model(**proc(images=im, return_tensors="pt")).predicted_depth
    d = torch.nn.functional.interpolate(out[None], size=(im.height, im.width), mode="bicubic")[0, 0].numpy()
    lo, hi = np.percentile(d, 0.5), np.percentile(d, 99.5)
    d = np.clip((d - lo) / (hi - lo), 0, 1)          # relative inverse depth, near = 1
    dm = Image.fromarray((d * 255).astype(np.uint8)).resize((1024, round(1024 * im.height / im.width)), Image.LANCZOS)
    dm = dm.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    dm.save(os.path.join(HERE, "site/assets/depth", n + ".png"))
    w = 2048; im.resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(os.path.join(HERE, "site/assets/plates", n + ".jpg"), quality=86, optimize=True, progressive=True)
    print(n, im.size, "ok")
