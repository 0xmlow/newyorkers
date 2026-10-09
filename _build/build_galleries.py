#!/usr/bin/env python3
"""island.html and basement.html: the two standalone walkable galleries as NEW YORKERS pages.

MEME ISLAND (../MEME ISLAND 2026-10-07/) and YOUR MOM'S BASEMENT (../YOUR MOMS BASEMENT 2026-10-08/) are each a
plain three.js r128 site folder in its own repository, with no build step to play: index.html with all the code
inline, vendor/ (three.js, GLTFLoader, meshopt), fonts/ and assets/. They are not museum rooms: the museum engine
is r160 and bundled, these are their own lane, so they ship whole, as MOSH LAB does.

This script copies each gallery's site/ into assets/<slug>/ unchanged (APFS clones, so the disk does not pay for
a second copy), skips the island's hi res sculpture sources (139 MB that the page never loads) and the artifact
fragments, checks the copy (no dash characters, no script or stylesheet from another host, every inline script
parses), writes a 1200x630 share card and a 960x540 home card from one chosen still, and writes the page: the
gallery in a large iframe inside the site shell, with a full screen link and a link to its branch on GitHub.

If a gallery's repository is not on this machine the last copy in assets/<slug>/ stands, so the site still builds
anywhere. Part of build_all.sh, after build_arcade.py and before build_seo.py.
"""
import os, re, sys, json, shutil, hashlib, subprocess
from PIL import Image, ImageDraw, ImageFont
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
URL = cfg()["siteUrl"]
GITHUB = "https://github.com/0xmlow/newyorkers/tree/"
FONT = os.path.join(HERE, "honoraries", "fonts", "IBMPlexMono-Medium.ttf")

GALLERIES = [
    dict(slug="island", page="island.html", nav="ISLAND", branch="meme-island",
         repo=os.path.join(ROOT, "MEME ISLAND 2026-10-07"),
         skip=("assets/sculpt_hi", "assets/sculpts_hi.json", "artifact.html"),
         still=os.path.join("DELIVERABLES", "promo", "meme_island_cover.jpg"),
         tag="MEME ISLAND", name="MEME ISLAND", h1="MEME <em>ISLAND</em>",
         title="MEME ISLAND · a walkable island for The Memes by 6529 and NEW YORKERS",
         desc=("MEME ISLAND, a walkable three.js island by MLow for The Memes by 6529 and NEW YORKERS. Every one of the 527 meme cards hung twice, "
               "on THE FLOOR, a terrazzo mountain stacked by floor price, and in its own district of eighteen. 144 New Yorkers from the crypto eras, "
               "66 of MLow's meme sculptures on plinths, forty residents carrying their portraits, six hidden keys, fifteen typed easter eggs and the "
               "Konami code, a sun and moon that keep New York time, and a Windows 98 desktop to run it from. Free in your browser."),
         controls="WASD walk, SHIFT stride, SPACE jump, drag or arrows to look, E interact, click any card, ENTER to type.",
         phone="MEME ISLAND is built for a keyboard and a big screen. It opens on a phone, but a laptop is where it sings.",
         blurb=("An island for the two collections that live on the same timeline. The Memes by 6529 are hung as a city: eighteen districts, "
                "every card on a terrazzo mountain stacked by floor price, and MLow's 66 meme sculptures on plinths along the colonnade. "
                "Forty New Yorkers from the crypto eras walk the paths carrying their own portraits. Find the six keys, type the words the "
                "island listens for, and watch the sun come down over the harbour at the real New York hour."),
         keywords=["MEME ISLAND", "The Memes by 6529", "6529", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "3D gallery", "meme sculptures", "virtual museum"]),
    dict(slug="basement", page="basement.html", nav="BASEMENT", branch="your-moms-basement",
         repo=os.path.join(ROOT, "YOUR MOMS BASEMENT 2026-10-08"),
         skip=("artifact.html",),
         still=os.path.join("DELIVERABLES", "shots_v2", "v2_03_den_tv.jpg"),
         tag="YOUR MOM'S BASEMENT", name="YOUR MOM'S BASEMENT", h1="YOUR MOM'S <em>BASEMENT</em>",
         title="YOUR MOM'S BASEMENT · a walkable Queens basement by MLow",
         desc=("YOUR MOM'S BASEMENT, a walkable three.js basement under a two family house in Queens, by MLow. Eight rooms and five sub rooms behind "
               "doors: the stairs and the window well, the TV den with a mirror onto the wrong room, the card room, the boiler and laundry with the "
               "dryer ride and the 1998 PC, an infinite hallway, a twelve metre everything bagel in a cream cheese lake, the Rat King's court and the "
               "cold room inside the freezer. NEW YORKERS census paintings on every wall, twenty of MLow's meme sculptures as trophies, dozens of "
               "NEW YORKERS 3D props and forty easter eggs. Mom is upstairs. She texts. Free in your browser."),
         controls="WASD walk, SHIFT hurry, SPACE jump, drag or arrows to look, E use, click any painting, ENTER to type, C tour, P postcard.",
         phone="YOUR MOM'S BASEMENT is built for a keyboard and a big screen. It opens on a phone, but a laptop is where it sings.",
         blurb=("A degen dungeon under a two family house in Queens, designed with Astra on FLORA and built dense on purpose: photographic walls, "
                "real props, census New Yorkers hung in every room, twenty meme sculptures on the shelves as trophies, ten of MLow's stickers "
                "turned into objects, and five doors that should not open. Type gm at the stairs, hodl at the dryer, cope at the card table, "
                "and go say hello to the Rat King. Mom is upstairs. She texts."),
         keywords=["YOUR MOM'S BASEMENT", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "3D gallery", "Queens", "Rat King", "degen dungeon", "virtual museum"]),
]


def cover(path, w, h):
    im = Image.open(path).convert("RGB"); iw, ih = im.size; r = w / h
    if iw / ih > r: nw = round(ih * r); im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
    else: nh = round(iw / r); im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)

def tag(im, text, color=(236,201,129), fg=(8,13,22), xy=(22, 22)):
    d = ImageDraw.Draw(im); f = ImageFont.truetype(FONT, 20); tw = d.textlength(text, font=f)
    d.rounded_rectangle((xy[0], xy[1], xy[0] + tw + 28, xy[1] + 40), 8, fill=color)
    d.text((xy[0] + 14, xy[1] + 20), text, font=f, fill=fg, anchor="lm")

def clone(a, b):
    """APFS clone with the mtime kept (the sync compares it); plain copy where cloning is not possible."""
    if subprocess.run(["cp", "-c", "-p", a, b], capture_output=True).returncode != 0: shutil.copy2(a, b)

def sync(src, dst, skip):
    """Copy what is missing or changed (size or mtime), drop what the source no longer has, keep poster.jpg.
    Follows the symlinks a gallery may use to borrow another's assets, so the package carries real files."""
    os.makedirs(dst, exist_ok=True)
    copied = kept = 0
    want = set()
    for root, dirs, files in os.walk(src, followlinks=True):
        rel = os.path.relpath(root, src); rel = "" if rel == "." else rel
        dirs[:] = sorted(d for d in dirs if os.path.join(rel, d).replace("\\", "/") not in skip and not d.startswith("."))
        for f in sorted(files):
            r = os.path.join(rel, f).replace("\\", "/")
            if r in skip or f.startswith("."): continue
            want.add(r)
            a, b = os.path.join(root, f), os.path.join(dst, r)
            os.makedirs(os.path.dirname(b), exist_ok=True)
            if os.path.exists(b) and os.path.getsize(a) == os.path.getsize(b) and int(os.path.getmtime(a)) == int(os.path.getmtime(b)):
                kept += 1; continue
            if os.path.isdir(b): shutil.rmtree(b)
            clone(a, b); copied += 1
    for root, dirs, files in os.walk(dst, topdown=False):
        for f in files:
            r = os.path.relpath(os.path.join(root, f), dst).replace("\\", "/")
            if r not in want and r != "poster.jpg": os.remove(os.path.join(root, f))
        for d in dirs:
            p = os.path.join(root, d)
            if not os.listdir(p): os.rmdir(p)
    return copied, kept

SCRIPT = re.compile(r'<script([^>]*)>([\s\S]*?)</script>', re.I)
TYPE = re.compile(r'''type\s*=\s*["']([^"']+)''', re.I)

def check(dst, slug):
    """The copy must be clean before it ships: brand dashes, outside code, and every inline script must parse."""
    html = open(os.path.join(dst, "index.html"), encoding="utf-8").read()
    for bad in ("—", "–"):
        if bad in html: raise SystemExit(f"{slug}: a dash character is in index.html; the brand rule forbids it")
    # the code is self hosted: no script or stylesheet from another origin (links out to the card originals are data, and fine)
    stray = [u for u in re.findall(r'''<(?:script|link)[^>]+(?:src|href)\s*=\s*["'](https?://[^"']+)''', html)]
    if stray: raise SystemExit(f"{slug}: index.html loads code from outside the site: {stray[:3]}")
    if shutil.which("node"):
        n = 0
        for attrs, body in SCRIPT.findall(html):
            t = (TYPE.search(attrs) or [None, ""])[1].strip().lower()
            if t not in ("", "module", "text/javascript", "application/javascript") or not body.strip(): continue
            tmp = os.path.join(dst, f".check_{n}.mjs" if t == "module" else f".check_{n}.js"); n += 1
            open(tmp, "w", encoding="utf-8").write(body)
            r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True); os.remove(tmp)
            if r.returncode: raise SystemExit(f"{slug}: inline script {n} does not parse\n" + r.stderr[:800])
    for need in ("index.html", "vendor"):
        if not os.path.exists(os.path.join(dst, need)): raise SystemExit(f"{slug}: {need} missing from the copy")
    return html

for G in GALLERIES:
    slug, repo = G["slug"], G["repo"]
    src, dst = os.path.join(repo, "site"), os.path.join(SITE, "assets", slug)
    commit = ""
    if os.path.isdir(src):
        r = subprocess.run(["git", "-C", repo, "rev-parse", "--short", "HEAD"], capture_output=True, text=True)
        commit = r.stdout.strip()
        if subprocess.run(["git", "-C", repo, "status", "--porcelain", "site"], capture_output=True, text=True).stdout.strip():
            print(f"  {slug}: NOTE site/ has uncommitted changes; the site gets them, the {G['branch']} branch does not yet")
        copied, kept = sync(src, dst, set(G["skip"]))
        print(f"  {slug}: {copied} files copied, {kept} unchanged, from {os.path.basename(repo)} {commit}")
        still = os.path.join(repo, G["still"])
        if os.path.exists(still):
            cover(still, 1200, 630).save(os.path.join(dst, "poster.jpg"), "JPEG", quality=86, optimize=True, progressive=True)
            im = cover(still, 960, 540); tag(im, G["tag"]); os.makedirs(os.path.join(SITE, "assets", "home"), exist_ok=True)
            im.save(os.path.join(SITE, "assets", "home", f"now-{slug}.jpg"), "JPEG", quality=84, optimize=True, progressive=True)
        else:
            print(f"  {slug}: NOTE still {G['still']} not found; the last poster stands")
    elif not os.path.exists(os.path.join(dst, "index.html")):
        raise SystemExit(f"{slug}: no repository at {repo} and no previous copy in assets/{slug}")
    else:
        print(f"  {slug}: repository not found, keeping the last copy in assets/{slug}")
    if not os.path.exists(os.path.join(dst, "poster.jpg")): raise SystemExit(f"{slug}: no share card at assets/{slug}/poster.jpg")
    html = check(dst, slug)
    v = hashlib.sha256(html.encode("utf-8")).hexdigest()[:10]
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(dst) for f in fs)
    img = f"{URL}/assets/{slug}/poster.jpg?v={v}"

    extra_css = """
.gl{max-width:1500px;margin:0 auto;padding:14px 16px 72px;text-align:center}
.gl .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.3em;color:#8FA7AB;text-transform:uppercase}
.gl h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(30px,5vw,48px);margin:8px 0 10px;letter-spacing:.02em}
.gl h1 em{color:#FF2E88;font-style:normal}
.gl p{color:#AAB6C4;line-height:1.6;max-width:640px;margin:0 auto 18px}
.gl .frame{width:100%;height:max(620px,calc(100vh - 190px));margin:0 auto;border:1px solid #223;border-radius:16px;overflow:hidden;
  box-shadow:0 0 60px rgba(70,146,194,.25);background:#080D16}
.gl iframe{width:100%;height:100%;border:0;display:block}
.gl .how{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.12em;color:#8FA7AB;margin-top:18px;line-height:1.8}
.gl .how a{color:#4692C2;text-decoration:none}
.gl .under{margin-top:26px}
.gl .phone{display:none;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.1em;color:#FFD600;margin:0 auto 14px;max-width:520px;line-height:1.7}
@media (max-width:820px){ .gl .phone{display:block} .gl .frame{height:80vh;min-height:520px} }
"""
    body = f"""<main class="gl">
  <div class="phone">{G['phone']}</div>
  <div class="frame"><iframe id="glFrame" src="assets/{slug}/?v={v}" title="{G['name']} by MLow" allow="fullscreen; autoplay; clipboard-write" loading="eager"></iframe></div>
  <div class="how">{G['controls']}<br><a href="assets/{slug}/?v={v}" target="_blank" rel="noopener">Open full screen</a> &nbsp;·&nbsp; <a href="{GITHUB}{G['branch']}" target="_blank" rel="noopener">The code</a></div>
  <div class="under">
    <div class="eyebrow">A walkable gallery by MLow</div>
    <h1>{G['h1']}</h1>
    <p>{G['blurb']}</p>
  </div>
</main>"""
    jsonld = {"@context": "https://schema.org", "@type": "WebApplication", "@id": f"{URL}/{slug}",
              "name": G["name"], "url": f"{URL}/{slug}", "description": G["desc"],
              "author": {"@type": "Person", "name": "MLow"}, "applicationCategory": "EntertainmentApplication",
              "operatingSystem": "Web browser", "isAccessibleForFree": True,
              "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
              "image": img, "codeRepository": GITHUB + G["branch"], "isPartOf": {"@id": URL + "/#site"}}
    page = shell(title=G["title"], description=G["desc"], body=body, path=G["page"], active=G["nav"],
                 extra_css=extra_css, jsonld=jsonld, image=img, keywords=G["keywords"])
    open(os.path.join(SITE, G["page"]), "w", encoding="utf-8").write(page)
    print(f"{G['page']}: {G['name']} {size / 1e6:.0f} MB in assets/{slug} from {os.path.basename(repo)} {commit or '(last copy)'}, scripts parse, v={v}")
