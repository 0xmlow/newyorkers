#!/usr/bin/env python3
"""Pull the honoraries into the site: one entry per portrait, in the film's chapter order, plus two web images each.

Source of truth for WHO is the roll call film's collector (HONORARIES HYPE FILM 2026-09-26/_engine/collect.py,
which reads the honoraries folders and the census). Run that first when a wave lands, then this, then
build_honoraries.py. Images go to assets/honoraries/ (gitignored), named by content hash so the immutable
cache can never serve a stale face after a redo. Writes _build/honoraries/honoraries.json, which is committed.
"""
import os, sys, json, re, hashlib, glob
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(os.path.dirname(HERE))
ROOT = os.path.dirname(SITE)
FILM = os.path.join(ROOT, "HONORARIES HYPE FILM 2026-09-26", "_engine")
OUT = os.path.join(SITE, "assets", "honoraries")
sys.path.insert(0, FILM)
import timeline as TL  # reads the film's manifest.json; nothing heavy

_s = open(os.path.join(SITE, "assets", "data.js")).read()
BY_N = {p["n"]: p for p in json.loads(_s[_s.index("{"):_s.rstrip().rstrip(";").rindex("}") + 1])["pieces"]}
HANDLE = re.compile(r"^@[A-Za-z0-9_]{1,15}$")
os.makedirs(OUT, exist_ok=True)


def slug(k):
    return re.sub(r"[^a-z0-9]+", "-", k.lower()).strip("-")


def save(im, path, q):
    im.save(path, "JPEG", quality=q, optimize=True, progressive=True)


entries, keep = [], set()
for ci, ch in enumerate(TL.CHAPTERS):
    for p in ch["people"]:
        sid = slug(p["key"])
        h = hashlib.sha256(open(p["hero"], "rb").read() + open(p["pfp"], "rb").read()).hexdigest()[:8]
        s_name, l_name = f"{sid}-{h}s.jpg", f"{sid}-{h}l.jpg"
        keep |= {s_name, l_name}
        sp, lp = os.path.join(OUT, s_name), os.path.join(OUT, l_name)
        if not os.path.exists(sp):
            save(Image.open(p["pfp"]).convert("RGB").resize((400, 400), Image.LANCZOS), sp, 80)
        if not os.path.exists(lp):
            im = Image.open(p["hero"]).convert("RGB")
            im.thumbnail((1280, 1280), Image.LANCZOS)
            save(im, lp, 78)
        W, H = Image.open(lp).size
        hd = p["handle"] or ""
        census = p.get("kind") == "census"
        e = dict(id=sid, name=p["disp"], handle=hd, x=hd[1:] if HANDLE.match(hd) else "", ch=ci,
                 title=p["title"] or "", s=s_name, l=l_name, w=W, h=H)
        if census:
            e.update(num=p["num"], era="I" if p["group"] == "ERA1" else "XVIII", key=bool(p.get("keystone")),
                     rec=BY_N[p["num"]]["id"])
        entries.append(e)

for f in os.listdir(OUT):  # images no longer referenced
    if f.endswith(".jpg") and f not in keep:
        os.remove(os.path.join(OUT, f))
chapters = [dict(num=c["num"], name=c["name"], sub=c["sub"], color=c["color"]) for c in TL.CHAPTERS]
json.dump(dict(chapters=chapters, people=entries), open(os.path.join(HERE, "honoraries.json"), "w"), indent=0, ensure_ascii=False)
mb = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) / 1e6
print(f"honoraries: {len(entries)} portraits in {len(chapters)} chapters, {mb:.0f} MB of images")
