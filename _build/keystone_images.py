#!/usr/bin/env python3
"""Render the Keystone wall images from the mint kit's lead masters, never from web copies.

Three sizes per piece, picked on the page by how large the piece is on screen at that moment:
  {id}s.jpg   640 wide    far on the ramp
  {id}m.jpg  1280 wide    mid distance, and phones
  {id}l.jpg  2400 wide    up close and opened, sharp on a 2x screen
{id} is the ramp position in the K111 array. The lead is the token's first painted state, so a
likeness redo shows its new likeness. Lanczos down, a light unsharp to undo the softening, 4:4:4
chroma so painted edges stay clean. Skips a file that is newer than its master. Used to be synced
from KEYSTONE 111 MARKETING KIT/06_3D_GALLERY/img (640 and 1280 only), which read soft on 2x screens.
"""
import json, os, re, sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
KIT = os.path.join(os.path.dirname(SITE), "KEYSTONE 111 MINT KIT 2026-09-17", "tokens")
OUT = os.path.join(SITE, "assets", "keystone")
SIZES = (("s", 640, 86), ("m", 1280, 88), ("l", 2400, 90))
VERSION = "2"   # bump to force a re-render

def leads():
    by_n = {}
    for d in os.listdir(KIT):
        tj = os.path.join(KIT, d, "token.json")
        if os.path.exists(tj):
            t = json.load(open(tj))
            st = [s for s in t["states"] if s["kind"] == "still"]
            by_n[t["census_number"]] = st[0]["source"]
    return by_n

def render(job):
    pid, src = job
    done = []
    im = None
    for tag, w, q in SIZES:
        dst = os.path.join(OUT, f"{pid}{tag}.jpg")
        stamp = os.path.join(OUT, ".v")
        if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(src) and open(stamp).read().strip() == VERSION if os.path.exists(stamp) else False:
            continue
        if im is None:
            im = Image.open(src); im.load(); im = im.convert("RGB")
        ww = min(w, im.width); hh = round(im.height * ww / im.width)
        r = im.resize((ww, hh), Image.LANCZOS) if ww < im.width else im.copy()
        if ww < im.width: r = r.filter(ImageFilter.UnsharpMask(radius=0.8 if tag != "l" else 0.6, percent=55, threshold=2))
        r.save(dst, "JPEG", quality=q, subsampling=0, optimize=True, progressive=True)
        done.append(tag)
    return pid, done

# ---------- glitch loops for the wall, 1920 wide from the source GIF ----------
# The census record plays a 1280 CRF 26 copy (assets/glitch), which reads soft when a piece fills the
# screen. The wall gets its own {id}g.mp4 at the GIF's full width, CRF 23. Phones keep the census copy.
FF = "/Users/degens/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"

def glitch_src(n):
    for d in os.listdir(KIT):
        tj = os.path.join(KIT, d, "token.json")
        if not os.path.exists(tj): continue
        t = json.load(open(tj))
        if t["census_number"] != n: continue
        g = [s["source"] for s in t["states"] if s["kind"] == "glitch" and s["source"].lower().endswith(".gif")]
        g.sort(key=lambda x: (0 if "MOSHED VARIANTS" in x else 1 if "stillwaiting_v1" in x.lower() else 2))
        return g[0] if g else None

def encode(job):
    pid, src = job
    dst = os.path.join(OUT, f"{pid}g.mp4")
    if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(src): return pid, False
    import subprocess
    r = subprocess.run([FF, "-y", "-loglevel", "error", "-i", src, "-vf", "scale='min(1920,iw)':-2:flags=lanczos",
                        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-crf", "23", "-preset", "slow", "-an", dst], capture_output=True)
    if r.returncode: raise SystemExit(f"keystone glitch {pid}: {r.stderr.decode()[-200:]}")
    return pid, True

def glitch_all(k):
    jobs = []
    for p in k:
        src = glitch_src(p["n"])
        if src: jobs.append((p["id"], src))
    with ProcessPoolExecutor(4) as ex: res = list(ex.map(encode, jobs))
    print(f"keystone glitch loops: {sum(1 for _, d in res if d)} encoded, {len(jobs)} total")
    return {pid for pid, _ in res}

if __name__ == "__main__":
    k = json.loads(sys.argv[1]) if len(sys.argv) > 1 else None
    if k is None:
        s = open(os.path.join(HERE, "keystone", "src.html"), encoding="utf-8").read()
        k = json.loads(re.search(r"var K111 = (\[.*?\]);\n</script>", s, re.S).group(1))
    L = leads(); os.makedirs(OUT, exist_ok=True)
    miss = [p["n"] for p in k if p["n"] not in L]
    if miss: raise SystemExit(f"keystone images: no mint kit lead for NO. {miss}")
    with ProcessPoolExecutor(6) as ex: res = list(ex.map(render, [(p["id"], L[p["n"]]) for p in k]))
    open(os.path.join(OUT, ".v"), "w").write(VERSION)
    glitch_all(k)
    print(f"keystone images: {sum(len(d) for _, d in res)} rendered, {3*len(k) - sum(len(d) for _, d in res)} current")

