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
import hashlib, json, os, re, sys
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


# ---------- every state of every token, for the card's state buttons ----------
# One flat file per state beside the wall images (the deploy packager does not descend into folders):
#   {id}_{nn}.jpg  extra painted states and memes, 2400 wide at most like the lead
#   {id}_{nn}.png  dithers, kept PNG so the pattern survives, nearest-neighbour down to 2560 wide at most
#   {id}_{nn}.mp4  motion clips and glitch loops, up to 1920 wide, no audio
# The lead painting is state 1 and uses the tiered s/m/l above. The MOSH LAB glitch reuses {id}g.mp4.
# Writes keystone_states.json, which build_keystone.py puts on each piece as st.
import re as _re, subprocess as _sp

def _probe(path):
    e = _sp.run([FF, "-i", path], capture_output=True, text=True).stderr
    m = _re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", e)
    return (int(m.group(1)), int(m.group(2))) if m else None

def _fresh(dst, src): return os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(src)

def state_job(job):
    pid, st, gsrc = job
    src, kind, nn = st["source"], st["kind"], st["state"]
    rec = {"k": kind, "l": st["label"]}
    if kind == "still" and nn == 1:
        rec["u"] = None
        w, h = Image.open(src).size; rec["a"] = round(w / h, 4); return rec
    if kind in ("still", "meme", "poster", "card"):
        dst = os.path.join(OUT, st.get("site_file") or f"{pid}_{nn:02d}.jpg")
        im = Image.open(src)
        if not _fresh(dst, src):
            im = im.convert("RGB"); ww = min(2400, im.width)
            if ww < im.width:
                im = im.resize((ww, round(im.height * ww / im.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=0.6, percent=55, threshold=2))
            im.save(dst, "JPEG", quality=90, subsampling=0, optimize=True, progressive=True)
        w, h = Image.open(dst).size
    elif kind == "dither":
        dst = os.path.join(OUT, f"{pid}_{nn:02d}.png")
        if not _fresh(dst, src):
            im = Image.open(src)
            if im.width > 2560: im = im.resize((2560, round(im.height * 2560 / im.width)), Image.NEAREST)
            im.save(dst, "PNG", optimize=True)
        w, h = Image.open(dst).size
    else:
        if kind == "glitch" and src == gsrc and os.path.exists(os.path.join(OUT, f"{pid}g.mp4")):
            dst = os.path.join(OUT, f"{pid}g.mp4")
        else:
            dst = os.path.join(OUT, f"{pid}_{nn:02d}.mp4")
            if not _fresh(dst, src):
                r = _sp.run([FF, "-y", "-loglevel", "error", "-i", src, "-vf", "scale='min(1920,iw)':-2:flags=lanczos,format=yuv420p",
                             "-c:v", "libx264", "-movflags", "+faststart", "-crf", "23" if kind == "glitch" else "21", "-preset", "slow", "-an", dst], capture_output=True)
                if r.returncode: raise SystemExit(f"keystone state {pid}/{nn}: {r.stderr.decode()[-200:]}")
        w, h = _probe(dst)
        rec["v"] = 1
    rec["u"] = "assets/keystone/" + os.path.basename(dst); rec["a"] = round(w / h, 4)
    return rec

def states_all(k):
    tok = {}
    for d in os.listdir(KIT):
        tj = os.path.join(KIT, d, "token.json")
        if os.path.exists(tj):
            t = json.load(open(tj)); tok[t["census_number"]] = t["states"]
    # site only states (the later Canal Street bootlegs, the memes) go after the kit's, numbered on from them
    EX = os.path.join(HERE, "keystone_extra_states.json"); p_id = {p["n"]: p["id"] for p in k}
    if os.path.exists(EX):
        root = os.path.dirname(SITE)
        for n, xs in json.load(open(EX))["states"].items():
            base = tok[int(n)]
            if any(x["source"].endswith(os.path.basename(e["source"])) for e in xs for x in base):
                raise SystemExit(f"keystone extras: NO. {n} already has one of these in the mint kit, drop it from the extras")
            tok[int(n)] = base + [{"kind": e["kind"], "label": e["label"], "source": os.path.join(root, e["source"]), "state": len(base) + i + 1,
                                        # named by source, not position: reordering the extras must never leave a stale file under a reused name
                                        "site_file": f"{p_id[int(n)]}_x{hashlib.md5(e['source'].encode()).hexdigest()[:8]}.jpg"} for i, e in enumerate(xs)]
    jobs, where = [], []
    for p in k:
        gsrc = glitch_src(p["n"])
        for i, st in enumerate(tok[p["n"]]):
            jobs.append((p["id"], st, gsrc)); where.append((p["n"], i))
    with ProcessPoolExecutor(4) as ex: recs = list(ex.map(state_job, jobs, chunksize=2))
    out = {}
    for (n, i), r in zip(where, recs): out.setdefault(str(n), []).append(r)
    json.dump(out, open(os.path.join(HERE, "keystone_states.json"), "w"), separators=(",", ":"))
    print(f"keystone states: {len(recs)} across {len(out)} pieces")

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
    states_all(k)
    print(f"keystone images: {sum(len(d) for _, d in res)} rendered, {3*len(k) - sum(len(d) for _, d in res)} current")

