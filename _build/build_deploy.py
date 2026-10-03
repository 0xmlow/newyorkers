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
    if rel.startswith("assets/"): return rel  # already a site asset (packed motion), shipped with its folder
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
    cut_media.update(m["mp4"] for m in p.get("mv") or [])
cut_media -= {m["mp4"] for p in data["pieces"] for m in p.get("mv") or []}  # an ensemble clip stays if any public piece is in it
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
    for c in m.get("cuts") or []: c["src"] = repath(c["src"])
for v in data["story"]["living"]["videos"]: v["src"] = repath(v["src"])
for g in data["story"]["living"]["gifs"]: g["src"] = repath(g["src"])
print("media packed:", len(packed), "failed:", len(failed), failed[:5])

# ---------- copy site shell + assets ----------
SITE_PAGES = ("index.html", "census.html", "map.html", "count.html", "counted.html", "press.html",
              "museum.html", "learn.html", "brand.html", "agents.html", "pigeon.html", "links.html",
              "profile.html", "faq.html", "vault.html", "shipping.html", "new-rooms.html",
              "keystone.html", "honoraries.html", "bloomrun.html", "posters.html", "collectors.html", "tv.html", "my.html", "wall.html")
SITE_FILES = SITE_PAGES + ("og.jpg", "sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt",
                           "humans.txt", "_redirects")
for page in SITE_FILES:
    if os.path.exists(os.path.join(SITE, page)):
        shutil.copy2(os.path.join(SITE, page), os.path.join(OUT, page))
# Prune anything the package still carries that this build no longer produces. Without this a page
# that gets deleted from the site lives on in the package and stays live forever; shop.html did
# exactly that after the print catalogue was pulled.
PAGES = SITE_PAGES + ("404.html",)      # one list only: two copies drift and silently delete a page
for f in os.listdir(OUT):
    if f.endswith(".html") and f not in PAGES:
        os.remove(os.path.join(OUT, f)); print("  pruned stale page:", f)
# Copied verbatim. config.js and data.js are rewritten further down, so they are kept
# but never copied here. One tuple drives both the copy and the prune: two lists drift,
# and the drift is silent (an asset stops shipping and every page that needs it breaks).
COPY_ASSETS = ("three.min.js", "site.css", "site.js", "geo.js", "eggs.js", "counts.js",
               "rooms.js", "articles.js", "shipping.js", "prints.js", "keystone_prints.js", "qrcode.min.js", "sha3.min.js",
               "home.css", "flywheel.js", "cast.json", "mint.js", "collector-card.js")
KEEP_ASSETS = set(COPY_ASSETS) | {"config.js", "data.js"}
_ad = os.path.join(OUT, "assets")
for f in os.listdir(_ad):
    if os.path.isfile(os.path.join(_ad, f)) and f not in KEEP_ASSETS:
        os.remove(os.path.join(_ad, f)); print("  pruned stale asset:", f)
os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
for a in COPY_ASSETS:
    src = os.path.join(SITE, "assets", a)
    if not os.path.exists(src):
        raise SystemExit("missing asset the site references: assets/" + a)
    shutil.copy2(src, os.path.join(OUT, "assets", a))

# geo.js integrity: every piece's place and neighbourhood key must resolve. A key that does
# not (a hand repin wrote key:subway on 2026-09-08) throws inside map.html's recompute and the
# atlas never gets past its boot screen, so the package refuses to build rather than ship it.
_geo_src = open(os.path.join(SITE, "assets", "geo.js"), encoding="utf-8").read()
_geo = json.loads(_geo_src[_geo_src.index("=") + 1:].rstrip().rstrip(";"))
_bad_p = sorted({g["p"] for g in _geo["pieces"] if g.get("p") and g["p"] not in _geo["places"]})
_bad_nb = sorted({g["nb"] for g in _geo["pieces"] if g.get("nb") and g["nb"] not in _geo["nb"]})
if _bad_p or _bad_nb:
    raise SystemExit("geo.js has keys that do not resolve; the atlas would crash. places=%s nb=%s "
                     "(fix _build/map/locations.json or the gazetteer, then python3 map/build_geo2.py)"
                     % (_bad_p, _bad_nb))
print("  geo.js keys resolve: %d places, %d neighbourhoods" % (len(_geo["places"]), len(_geo["nb"])))

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

# generated folders (the reading room, the room pages, the record pages, the api): always mirrored whole
for sub in ("learn", "rooms", "n", "h", "api", "feeds"):
    src = os.path.join(SITE, sub); dst = os.path.join(OUT, sub)
    if os.path.isdir(dst): shutil.rmtree(dst)
    if os.path.isdir(src): shutil.copytree(src, dst)
with open(os.path.join(OUT, "404.html"), "w") as f:
    f.write('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>NEW YORKERS · Not Found</title></head>'
            '<body style="background:#0D0D0D;color:#F0F4F8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:Georgia,serif;text-align:center">'
            '<div><div style="font-size:64px;letter-spacing:.08em;color:#fff">404</div>'
            '<p style="color:#8899AA;max-width:420px;line-height:1.6">This number has not been painted yet. The census keeps going anyway.</p>'
            '<p><a href="/" style="color:#2962FF;text-decoration:none;font-family:Menlo,monospace;font-size:13px;letter-spacing:.2em">ENTER THE CENSUS</a></p></div></body></html>')
def sync_dir(src, dst):
    """sync-lite: copy missing files, recopy any file whose size or mtime changed (a rebuilt asset keeps its name),
    drop what the source no longer has. Recurses: it used to skip subfolders once the folder existed in the package,
    so a new assets/film/<name>/ never shipped and a re-encoded film inside an old one never updated."""
    os.makedirs(dst, exist_ok=True)
    for f in os.listdir(src):
        a, b = os.path.join(src, f), os.path.join(dst, f)
        if os.path.isdir(a):
            if os.path.exists(b) and not os.path.isdir(b): os.remove(b)
            sync_dir(a, b)
            continue
        if not os.path.exists(b) or os.path.getsize(a) != os.path.getsize(b) or int(os.path.getmtime(a)) != int(os.path.getmtime(b)):
            # APFS clone keeps the package from doubling the disk (the Keystone wall loops alone are a GB);
            # -p keeps the mtime this comparison reads. Plain copy wherever cloning is not possible.
            if os.path.isdir(b): shutil.rmtree(b)
            elif os.path.exists(b): os.remove(b)
            if subprocess.run(["cp", "-c", "-p", a, b], capture_output=True).returncode != 0: shutil.copy2(a, b)
    keep = set(os.listdir(src))
    for f in os.listdir(dst):
        if f not in keep:
            fp = os.path.join(dst, f)
            shutil.rmtree(fp) if os.path.isdir(fp) else os.remove(fp)


for sub in ("brand", "brand/logos", "stickers", "atlas", "mt", "t", "launch", "glitch", "motion", "keystone", "honoraries", "cards", "posters", "collectors", "badges", "film", "bloomrun", "museum", "press"):
    src = os.path.join(SITE, "assets", sub); dst = os.path.join(OUT, "assets", sub)
    if sub == "museum":
        # the museum bundle changes with every build: always overwrite
        if os.path.isdir(dst): shutil.rmtree(dst)
        # build_variant.mjs writes preview bundles (museum.<tag>.js) beside the real one; they are
        # gitignored and were never meant to ship, but this copy took them along, 47 MB of them
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns('museum.*.js'))
        continue
    if os.path.isdir(dst):
        sync_dir(src, dst)
    else:
        shutil.copytree(src, dst)
    # never ship the cut pieces' own files, nor thumbs no public piece references
    if sub == "t":
        used = set(k for p in data["pieces"] for k in (p.get("st") or [])) | {(p.get("gl") or {}).get("st") for p in data["pieces"] if p.get("gl")}
        used |= {f["k"] for p in data["pieces"] for f in (p.get("fx") or [])}   # ChatGPT posters, memes, cards (attach_piece_extras.py)
        pruned = 0
        for f in os.listdir(dst):
            if f.endswith(".jpg") and f[:-4] not in used:
                os.remove(os.path.join(dst, f)); pruned += 1
        print("  pruned unreferenced thumbs:", pruned)
        for k in CUT_THUMBS:
            fp = os.path.join(dst, k + ".jpg")
            if os.path.exists(fp): os.remove(fp); print("  removed cut thumb", k)
    if sub in ("glitch", "motion"):
        for m in CUT_MEDIA:
            fp = os.path.join(OUT, m)
            if os.path.exists(fp): os.remove(fp); print("  removed cut glitch", m)

with open(os.path.join(OUT, "assets", "data.js"), "w") as f:
    f.write("window.NY_DATA = "); json.dump(data, f, separators=(",",":")); f.write(";\n")

# Pages Functions: the form intake endpoint. Lives in _build/api/functions and is copied in whole,
# so the API deploys with the site and there is no second service to keep alive.
_fn_src = os.path.join(SITE, "_build", "api", "functions")
# NOTE: with a wrangler.toml present, Pages expects functions/ BESIDE the config file, not inside
# pages_build_output_dir. Putting it in site/ ships it as a static asset and every POST returns 405.
_fn_dst = os.path.join(PKG, "functions")
if os.path.isdir(_fn_dst): shutil.rmtree(_fn_dst)
if os.path.isdir(_fn_src):
    shutil.copytree(_fn_src, _fn_dst)
    print("functions copied:", sum(len(f) for _, _, f in os.walk(_fn_dst)), "file(s)")

# config.js and prints.js are control files: they carry the Privy App ID and the print switch,
# their names never change, and Cloudflare pins any browser max-age below four hours to four
# hours, so _headers alone cannot make a flip land. Version the REFERENCE instead. Every HTML
# page is served max-age=0 must-revalidate, so a new hash reaches every visitor on the next
# page load, and the file itself can stay cached for as long as the edge likes.
import hashlib
_stamped = 0
_vers = {}
# Every asset whose NAME never changes. Cloudflare pins a browser max-age below four hours up
# to four hours, so a change to any of these can sit invisible in a warm browser. Versioning
# the reference is the only reliable fix: the HTML always revalidates. A stale site.js is how
# a hidden footer link stayed visible after the switch was flipped.
# cast.json is fetched by flywheel.js, not referenced from any HTML, so the loop below
# never sees it and the edge would serve a stale census for up to four hours after a
# rebuild. Stamp its URL inside the script first, so flywheel.js is already final when
# its own hash is taken and one pass stays consistent.
_castp = os.path.join(OUT, "assets", "cast.json")
_flyp = os.path.join(OUT, "assets", "flywheel.js")
if os.path.exists(_castp) and os.path.exists(_flyp):
    _cv = hashlib.sha256(open(_castp, "rb").read()).hexdigest()[:10]
    _fs = open(_flyp, encoding="utf-8").read()
    _fn2 = re.sub(r'(assets/cast\.json)(\?v=[0-9a-f]+)?', r'\1?v=' + _cv, _fs)
    if _fn2 != _fs:
        open(_flyp, "w", encoding="utf-8").write(_fn2)
    print("  cast.json versioned %s inside flywheel.js" % _cv)

# api/c/<wallet>.json is the same kind of trap: my.html, tv.html, wall.html and the museum fetch it,
# /api/* is max-age 3600 and Cloudflare stretches that to four hours, so a wallet whose honorary was
# just linked kept downloading its old file and a card with no portrait (Orkhan, 2026-10-03). One
# hash over every collector file goes on each of those fetch URLs, so a new snapshot lands at once.
_apic = os.path.join(OUT, "api", "c")
if os.path.isdir(_apic):
    _h = hashlib.sha256()
    for _fn in sorted(os.listdir(_apic)):
        if _fn.endswith(".json"): _h.update(_fn.encode()); _h.update(open(os.path.join(_apic, _fn), "rb").read())
    _av = _h.hexdigest()[:10]
    _targets = [os.path.join(OUT, p) for p in ("my.html", "tv.html", "wall.html", os.path.join("assets", "museum", "museum.js"))]
    _n = 0
    for _fp in _targets:
        if not os.path.exists(_fp): continue
        _s = open(_fp, encoding="utf-8").read(); _o = _s
        _s = re.sub(r"(api/c/index\.json)(\?v=[0-9a-f]+)?", r"\1?v=" + _av, _s)
        _s = re.sub(r"(api/c/'\s*\+[^;\n]*?\+\s*')\.json(\?v=[0-9a-f]+)?'", r"\1.json?v=" + _av + "'", _s)
        _s = re.sub(r"(api/c/\$\{[^}]+\})\.json(\?v=[0-9a-f]+)?", r"\1.json?v=" + _av, _s)
        if _s != _o: open(_fp, "w", encoding="utf-8").write(_s); _n += 1
    print("  collector data versioned %s inside %d files" % (_av, _n))

for _asset in tuple(COPY_ASSETS) + ("config.js", "data.js"):
    _fp = os.path.join(OUT, "assets", _asset)
    if os.path.exists(_fp):
        _vers[_asset] = hashlib.sha256(open(_fp, "rb").read()).hexdigest()[:10]
for _root, _dirs, _files in os.walk(OUT):
    _dirs[:] = [d for d in _dirs if d not in ("media", "assets")]   # no HTML lives in these
    for _fn in _files:
        if not _fn.endswith(".html"): continue
        _fp = os.path.join(_root, _fn)
        _s = open(_fp, encoding="utf-8").read(); _o = _s
        for _asset, _v in _vers.items():
            _s = re.sub(r'(assets/' + re.escape(_asset) + r')(\?v=[0-9a-f]+)?', r'\1?v=' + _v, _s)
        if _s != _o:
            open(_fp, "w", encoding="utf-8").write(_s); _stamped += 1
print("  control files versioned %s, stamped into %d pages" % (_vers, _stamped))


# A build id, written into every page and to /build.json. While iterating on a bug it is
# vital to know WHICH build a report came from: a stale tab reports a fixed bug as still
# broken, and there is no way to tell from the error alone. The page compares the two and
# says so out loud.
BUILD_ID = __import__("datetime").datetime.utcnow().strftime("%Y%m%d-%H%M%S")
with open(os.path.join(OUT, "build.json"), "w") as f:
    json.dump({"build": BUILD_ID}, f)
_bstamped = 0
for _root, _dirs, _files in os.walk(OUT):
    _dirs[:] = [d for d in _dirs if d not in ("media", "assets")]
    for _fn in _files:
        if not _fn.endswith(".html"): continue
        _fp = os.path.join(_root, _fn)
        _s = open(_fp, encoding="utf-8").read()
        if "__BUILD_ID__" not in _s: continue
        open(_fp, "w", encoding="utf-8").write(_s.replace("__BUILD_ID__", BUILD_ID))
        _bstamped += 1
print("  build %s stamped into %d pages" % (BUILD_ID, _bstamped))

with open(os.path.join(OUT, "_headers"), "w") as f:
    # config.js is the control file: it carries the Privy App ID and the feature switches, and its
    # name never changes, so a long cache means a flip does not reach returning visitors for hours.
    # Keep it short and revalidated. prints.js is the same kind of switch.
    f.write("""/assets/config.js
  Cache-Control: public, max-age=60, must-revalidate
/assets/prints.js
  Cache-Control: public, max-age=300, must-revalidate
/assets/t/*
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
/assets/motion/*
  Cache-Control: public, max-age=31536000, immutable
/assets/keystone/*
  Cache-Control: public, max-age=31536000, immutable
/assets/honoraries/*
  Cache-Control: public, max-age=31536000, immutable
/assets/cards/*
  Cache-Control: public, max-age=31536000, immutable
/assets/posters/*
  Cache-Control: public, max-age=31536000, immutable
/assets/museum/props/*
  Cache-Control: public, max-age=31536000, immutable
/assets/museum/rooms/*
  Cache-Control: public, max-age=604800
/assets/museum/*
  Cache-Control: public, max-age=3600
/api/*
  Cache-Control: public, max-age=3600
  Access-Control-Allow-Origin: *
/feeds/*
  Cache-Control: public, max-age=3600
  Access-Control-Allow-Origin: *
/llms.txt
  Cache-Control: public, max-age=3600
  Access-Control-Allow-Origin: *
/llms-full.txt
  Cache-Control: public, max-age=3600
  Access-Control-Allow-Origin: *
/n/*
  Cache-Control: public, max-age=86400
/rooms/*
  Cache-Control: public, max-age=86400
/learn/*
  Cache-Control: public, max-age=86400
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
