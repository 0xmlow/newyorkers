#!/usr/bin/env python3
"""Build the GO LIVE PACKAGE: a self-contained deployable copy of the census site.

- Copies the site + all assets into GO LIVE PACKAGE/site/
- Packs every referenced motion file into site/media/ (GIFs over the size cap are
  transcoded to MP4 so every host accepts them; the site picks img vs video by extension)
- Rewrites data.js media paths from archive-relative to media/
- Emits _headers for long-lived caching of immutable assets
"""
import json, os, re, shutil, subprocess, hashlib, sys

ROOT = "/Users/degens/Desktop/NEW YORKERS BY MLOW"
SITE = os.path.join(ROOT, "NEW YORKERS SITE")
ARCHIVE = os.path.join(ROOT, "NEW YORKERS MASTER ARCHIVE")
PKG = os.path.join(ROOT, "GO LIVE PACKAGE")
OUT = os.path.join(PKG, "site")
MEDIA = os.path.join(OUT, "media")
FF = "/Users/degens/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"
GIF_CAP = 18 * 1024 * 1024  # host-safe per-file cap

os.makedirs(MEDIA, exist_ok=True)

def mkey(rel):
    return hashlib.md5(rel.encode()).hexdigest()[:12]

def pack_media(rel):
    """Copy or transcode one archive-relative media file into site/media. Returns new rel path."""
    src = os.path.join(ARCHIVE, rel)
    ext = os.path.splitext(rel)[1].lower()
    if ext in (".mp4", ".mov"):
        dst = f"media/{mkey(rel)}.mp4"
        full = os.path.join(OUT, dst)
        if not os.path.exists(full): shutil.copy2(src, full)
        return dst
    if ext == ".gif":
        if os.path.getsize(src) <= GIF_CAP:
            dst = f"media/{mkey(rel)}.gif"
            full = os.path.join(OUT, dst)
            if not os.path.exists(full): shutil.copy2(src, full)
            return dst
        dst = f"media/{mkey(rel)}.mp4"
        full = os.path.join(OUT, dst)
        if not os.path.exists(full):
            r = subprocess.run([FF, "-y", "-i", src,
                "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-crf", "27", "-an", full],
                capture_output=True)
            if r.returncode != 0:
                print("TRANSCODE FAIL", rel, r.stderr[-200:]); return None
        return dst
    return None

# ---------- load and rewrite data ----------
d = open(os.path.join(SITE, "assets", "data.js")).read()
data = json.loads(d[d.index("=")+1:].rstrip().rstrip(";"))

packed, failed = {}, []
def repath(rel):
    if rel in packed: return packed[rel]
    p = pack_media(rel)
    if p is None: failed.append(rel); p = rel
    packed[rel] = p
    return p

# final curation: cut pieces never ship. Drop them and every asset only they reference.
cut_keys = set(); kept_keys = set()
for p in data["pieces"]: kept_keys.update(p.get("st") or []); kept_keys.update([ (p.get("gl") or {}).get("st") ] if p.get("gl") else [])
cut_media = set()
for p in data["cutPieces"]:
    cut_keys.update(p.get("st") or [])
    if p.get("gl"): cut_media.add(p["gl"].get("mp4")); cut_keys.add(p["gl"].get("st"))
CUT_THUMBS = {k for k in cut_keys if k and k not in kept_keys}
CUT_MEDIA = {m for m in cut_media if m}
print("cut pieces stripped:", len(data["cutPieces"]), [p.get("t") for p in data["cutPieces"]], "| exclusive thumbs:", len(CUT_THUMBS), "| glitch files:", len(CUT_MEDIA))
data["cutPieces"] = []
data["counts"]["cut"] = 0
n = 0
for plist in (data["pieces"],):
    for p in plist:
        p["g"] = [repath(x) for x in (p.get("g") or [])]
        p["v"] = [repath(x) for x in (p.get("v") or [])]
for m in data["motion"]:
    m["src"] = repath(m["src"])
    if m.get("alt"): m["alt"] = repath(m["alt"])
for v in data["story"]["living"]["videos"]: v["src"] = repath(v["src"])
for g in data["story"]["living"]["gifs"]: g["src"] = repath(g["src"])
print("media packed:", len(packed), "failed:", len(failed), failed[:5])

# ---------- copy site shell + assets ----------
for page in ("index.html", "census.html", "map.html", "count.html", "counted.html", "press.html", "og.jpg"):
    if os.path.exists(os.path.join(SITE, page)):
        shutil.copy2(os.path.join(SITE, page), os.path.join(OUT, page))
for stale in ("gallery.html",):
    if os.path.exists(os.path.join(OUT, stale)): os.remove(os.path.join(OUT, stale))
os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
for a in ("three.min.js", "site.css", "site.js", "geo.js"):
    if os.path.exists(os.path.join(SITE, "assets", a)):
        shutil.copy2(os.path.join(SITE, "assets", a), os.path.join(OUT, "assets", a))

# public config: preserve the formspree id from the working config, hide curate mode
cfg_src = open(os.path.join(SITE, "assets", "config.js")).read()
m = re.search(r'formspree:\s*"([^"]*)"', cfg_src)
formspree = m.group(1) if m else ""
m = re.search(r'contactEmail:\s*"([^"]*)"', cfg_src)
contact = m.group(1) if m else ""
with open(os.path.join(OUT, "assets", "config.js"), "w") as f:
    f.write('// Live site configuration (public build: curate mode hidden).\n')
    # carry every other key of the working config forward untouched, then force curate off
    body = cfg_src[cfg_src.index("{")+1:cfg_src.rindex("}")].rstrip().rstrip(",")
    f.write('window.NY_CONFIG = {\n' + body + ',\n  curate: false\n};\n')
if not formspree:
    print("NOTE: formspree id is empty; allowlist falls back to email drafts until it is set in assets/config.js")

with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write("User-agent: *\nAllow: /\n")
with open(os.path.join(OUT, "404.html"), "w") as f:
    f.write('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>NEW YORKERS · Not Found</title></head>'
            '<body style="background:#0D0D0D;color:#F0F4F8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:Georgia,serif;text-align:center">'
            '<div><div style="font-size:64px;letter-spacing:.08em;color:#fff">404</div>'
            '<p style="color:#8899AA;max-width:420px;line-height:1.6">This number has not been painted yet. The census keeps going anyway.</p>'
            '<p><a href="/" style="color:#2962FF;text-decoration:none;font-family:Menlo,monospace;font-size:13px;letter-spacing:.2em">ENTER THE CENSUS</a></p></div></body></html>')
for sub in ("brand", "stickers", "atlas", "mt", "t", "launch", "glitch"):
    src = os.path.join(SITE, "assets", sub); dst = os.path.join(OUT, "assets", sub)
    if os.path.isdir(dst):
        # sync-lite: copy missing files only
        for f in os.listdir(src):
            if not os.path.exists(os.path.join(dst, f)): shutil.copy2(os.path.join(src, f), os.path.join(dst, f))
        # drop stale
        keep = set(os.listdir(src))
        for f in os.listdir(dst):
            if f not in keep: os.remove(os.path.join(dst, f))
    else:
        shutil.copytree(src, dst)
    # never ship the cut pieces' own files, nor thumbs no public piece references
    if sub == "t":
        used = set(k for p in data["pieces"] for k in (p.get("st") or [])) | {(p.get("gl") or {}).get("st") for p in data["pieces"] if p.get("gl")}
        pruned = 0
        for f in os.listdir(dst):
            if f.endswith(".jpg") and f[:-4] not in used:
                os.remove(os.path.join(dst, f)); pruned += 1
        print("  pruned unreferenced thumbs:", pruned)
        for k in CUT_THUMBS:
            fp = os.path.join(dst, k + ".jpg")
            if os.path.exists(fp): os.remove(fp); print("  removed cut thumb", k)
    if sub == "glitch":
        for m in CUT_MEDIA:
            fp = os.path.join(OUT, m)
            if os.path.exists(fp): os.remove(fp); print("  removed cut glitch", m)

with open(os.path.join(OUT, "assets", "data.js"), "w") as f:
    f.write("window.NY_DATA = "); json.dump(data, f, separators=(",",":")); f.write(";\n")

with open(os.path.join(OUT, "_headers"), "w") as f:
    f.write("""/assets/t/*
  Cache-Control: public, max-age=31536000, immutable
/assets/atlas/*
  Cache-Control: public, max-age=31536000, immutable
/assets/mt/*
  Cache-Control: public, max-age=31536000, immutable
/media/*
  Cache-Control: public, max-age=31536000, immutable
/assets/launch/*
  Cache-Control: public, max-age=31536000, immutable
/assets/glitch/*
  Cache-Control: public, max-age=31536000, immutable
/assets/data.js
  Cache-Control: public, max-age=300
/assets/geo.js
  Cache-Control: public, max-age=300
/*.html
  Cache-Control: public, max-age=300
/assets/config.js
  Cache-Control: public, max-age=300
/index.html
  Cache-Control: public, max-age=300
""")

# ---------- report ----------
def du(path):
    total = 0
    for root, dirs, files in os.walk(path):
        for f in files: total += os.path.getsize(os.path.join(root, f))
    return total
nfiles = sum(len(fs) for _,_,fs in os.walk(OUT))
print(f"site: {nfiles} files, {du(OUT)/1e9:.2f} GB total")
print(f"  media/: {du(MEDIA)/1e9:.2f} GB")
big = []
for root, dirs, files in os.walk(OUT):
    for f in files:
        s = os.path.getsize(os.path.join(root, f))
        if s > 24*1024*1024: big.append((s, os.path.relpath(os.path.join(root,f), OUT)))
print("files over 24MB (Cloudflare Pages cap is 25MB):", len(big), [(f, round(s/1e6,1)) for s,f in big[:5]])
