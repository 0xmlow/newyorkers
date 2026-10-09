#!/usr/bin/env python3
"""moshlab.html: MOSH LAB, MLow's glitch instrument, as a NEW YORKERS page at /moshlab.

The instrument is edited in its own repository, MOSH LAB/moshlab (pushed to github.com/0xmlow/newyorkers
on the mosh-lab branch). Its app/ folder is plain HTML and JavaScript with no build step and no outside
requests, and the same files run inside the Electron desktop app. This script copies app/ into
assets/moshlab/ unchanged except for a version on each script reference, checks it, and writes the page:
the instrument in a large iframe inside the site shell, with a full screen link for real work.

If the MOSH LAB repository is not on this machine the last copy in assets/moshlab/ stands, so the site
still builds anywhere. The share card, _build/moshlab/poster.png, is a 1200x630 headless Chrome capture
of the instrument; recapture it only when the interface changes.
Part of build_all.sh, before build_seo.py.
"""
import os, re, shutil, hashlib, subprocess, tempfile
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
URL = cfg()["siteUrl"]
REPO = os.path.join(os.path.dirname(SITE), "MOSH LAB", "moshlab")
SRC = os.path.join(REPO, "app")
DST = os.path.join(SITE, "assets", "moshlab")
FILES = ("index.html", "brand-assets.js", "effects.js", "overlays.js", "app.js", "casino.js")

# ---------- copy and check the instrument ----------
commit = ""
if os.path.isdir(SRC):
    os.makedirs(DST, exist_ok=True)
    for f in os.listdir(DST):
        if f not in FILES and f not in ("poster.png", "ny.json"): os.remove(os.path.join(DST, f))
    for f in FILES:
        if not os.path.exists(os.path.join(SRC, f)): raise SystemExit(f"moshlab: {f} missing from {SRC}")
    r = subprocess.run(["git", "-C", REPO, "rev-parse", "--short", "HEAD"], capture_output=True, text=True)
    commit = r.stdout.strip()
    if subprocess.run(["git", "-C", REPO, "status", "--porcelain", "app"], capture_output=True, text=True).stdout.strip():
        print("  moshlab: NOTE app/ has uncommitted changes; the site gets them, the mosh-lab branch does not yet")
    vers = {}
    for f in FILES[1:]:
        b = open(os.path.join(SRC, f), "rb").read()
        vers[f] = hashlib.sha256(b).hexdigest()[:10]
        shutil.copy2(os.path.join(SRC, f), os.path.join(DST, f))
    # the script names never change, so a returning visitor only sees new code if the reference does
    html = open(os.path.join(SRC, "index.html"), encoding="utf-8").read()
    for f, v in vers.items():
        html, n = re.subn(r'src="' + re.escape(f) + r'(\?v=[0-9a-f]+)?"', f'src="{f}?v={v}"', html)
        if n != 1: raise SystemExit(f"moshlab: index.html should load {f} exactly once, found {n}")
    open(os.path.join(DST, "index.html"), "w", encoding="utf-8").write(html)
elif not all(os.path.exists(os.path.join(DST, f)) for f in FILES):
    raise SystemExit(f"moshlab: no MOSH LAB repository at {REPO} and no previous copy in assets/moshlab")
else:
    print("  moshlab: MOSH LAB repository not found, keeping the last copy in assets/moshlab")

for f in FILES:
    s = open(os.path.join(DST, f), encoding="utf-8").read()
    for bad in ("—", "–"):
        if bad in s: raise SystemExit(f"moshlab: a dash character is in {f}; the brand rule forbids it")
    # nothing loads from another host: the art comes from this site (casino.js builds its URLs from a base,
    # which is this origin when served here and n3wyorkers.com in the desktop app)
    stray = re.findall(r"""(?:src|href)\s*=\s*["'](https?://[^"']+)""", s) + re.findall(r"""fetch\(\s*["'`](https?://[^"'`]+)""", s)
    if stray: raise SystemExit(f"moshlab: {f} would load from outside the site: {stray[:3]}")
    if f.endswith(".js"):
        r = subprocess.run(["node", "--check", os.path.join(DST, f)], capture_output=True, text=True)
        if r.returncode: raise SystemExit(f"moshlab: {f} does not parse\n" + r.stderr)
shutil.copy2(os.path.join(HERE, "moshlab", "poster.png"), os.path.join(DST, "poster.png"))

# ny.json: the census index the New Yorkers panel and the slot machine pull from. One row per public
# piece, [number, title, first state's thumbnail key, era, family, borough]. The desktop app fetches it
# from n3wyorkers.com, so it ships with the site and is the only thing the app needs to know the census.
import json
_d = open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read()
_d = json.loads(_d[_d.index("{"):_d.rindex("}")+1])
rows = [[int(p["n"]), p["t"], p["st"][0], int(p.get("e") or 0), p.get("f") or "", p.get("b") or ""] for p in _d["pieces"] if p.get("st")]
rows.sort()
with open(os.path.join(DST, "ny.json"), "w", encoding="utf-8") as f:
    json.dump({"v": 1, "site": URL, "p": rows}, f, ensure_ascii=False, separators=(",", ":"))
print(f"  moshlab: ny.json {len(rows)} New Yorkers, {os.path.getsize(os.path.join(DST, 'ny.json')) // 1024} KB")
v = hashlib.sha256(b"".join(open(os.path.join(DST, f), "rb").read() for f in FILES + ("poster.png",))).hexdigest()[:10]

# ---------- the page ----------
desc = ("MOSH LAB, MLow's glitch instrument, free in your browser. Pull any New Yorker from the census, your own or a random one, spin THE MOSH MACHINE, or stack 60 WebGL effects on your own image, "
        "video or camera, roll a seed, and export a loop perfect GIF, MP4, WebM or PNG. Nothing leaves your machine.")
extra_css = """
.ml{max-width:1500px;margin:0 auto;padding:14px 16px 72px;text-align:center}
.ml .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.3em;color:#8FA7AB;text-transform:uppercase}
.ml h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(30px,5vw,48px);margin:8px 0 10px;letter-spacing:.02em}
.ml h1 em{color:#FF2E88}
.ml p{color:#AAB6C4;line-height:1.6;max-width:600px;margin:0 auto 18px}
.ml .frame{width:100%;height:max(620px,calc(100vh - 190px));margin:0 auto;border:1px solid #223;border-radius:16px;overflow:hidden;
  box-shadow:0 0 60px rgba(70,146,194,.25);background:#080D16}
.ml iframe{width:100%;height:100%;border:0;display:block}
.ml .how{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.12em;color:#8FA7AB;margin-top:18px;line-height:1.8}
.ml .how a{color:#4692C2;text-decoration:none}
.ml .under{margin-top:26px}
.ml .phone{display:none;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.1em;color:#FFD600;margin:0 auto 14px;max-width:520px;line-height:1.7}
@media (max-width:820px){ .ml .phone{display:block} .ml .frame{height:80vh;min-height:520px} }
"""
body = f"""<main class="ml">
  <div class="phone">MOSH LAB is built for a big screen. It runs on a phone, but a laptop is where it sings.</div>
  <div class="frame"><iframe id="mlFrame" src="assets/moshlab/?v={v}" title="MOSH LAB by MLow" allow="camera; fullscreen; clipboard-write"></iframe></div>
  <div class="how">Pull a New Yorker, paste your wallet, or drop your own image. Hit SPIN for THE MOSH MACHINE: three reels, five rarities, play chips only.<br><a href="assets/moshlab/?v={v}" target="_blank" rel="noopener">Open full screen</a> &nbsp;·&nbsp; <a href="https://github.com/0xmlow/newyorkers/tree/mosh-lab" target="_blank" rel="noopener">The code</a></div>
  <div class="under">
    <div class="eyebrow">A NEW YORKERS instrument by MLow</div>
    <h1>MOSH <em>LAB</em></h1>
    <p>The glitch instrument behind the NEW YORKERS mosh states, now yours. Sixty effects in five stages, forty eight presets to start from, from geometry to the final scanline. A dither lab with eight algorithms and seven palettes. Every loop closes on itself, every look is reproducible from its seed, and every file you make is rendered right here in your browser and signed with the MLOW mark. Your images never leave your machine.</p>
  </div>
</main>"""

jsonld = {"@context": "https://schema.org", "@type": "WebApplication", "@id": URL + "/moshlab",
          "name": "MOSH LAB", "url": URL + "/moshlab", "description": desc,
          "author": {"@type": "Person", "name": "MLow"}, "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web browser", "isAccessibleForFree": True,
          "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
          "image": f"{URL}/assets/moshlab/poster.png?v={v}", "codeRepository": "https://github.com/0xmlow/newyorkers/tree/mosh-lab",
          "isPartOf": {"@id": URL + "/#site"}}

page = shell(title="MOSH LAB · MLow's glitch instrument, free in your browser", description=desc,
             body=body, path="moshlab.html", active="MOSH LAB", extra_css=extra_css, jsonld=jsonld,
             image=f"{URL}/assets/moshlab/poster.png?v={v}",
             keywords=["MOSH LAB", "MLow", "NEW YORKERS", "glitch art", "datamosh", "dither", "GIF maker", "WebGL effects", "PhotoMosh"])
open(os.path.join(SITE, "moshlab.html"), "w", encoding="utf-8").write(page)
print(f"moshlab.html: instrument {sum(os.path.getsize(os.path.join(DST, f)) for f in FILES) // 1024} KB from MOSH LAB {commit or '(last copy)'}, scripts parse, v={v}")
