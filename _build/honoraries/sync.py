#!/usr/bin/env python3
"""Pull the honoraries into the site: one entry per person, grouped by what they do (roles.json), two web images per painting.

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


ROLES = json.load(open(os.path.join(HERE, "roles.json")))  # person key -> category code, edit by hand
CATS = [("A", "Artists"), ("C", "Collectors and curators"), ("B", "Founders and investors"), ("W", "Writers and media"),
        ("M", "Music"), ("F", "Film and stage"), ("X", "Fashion"), ("S", "Sport"), ("D", "Food"), ("P", "Politics and civic")]
BANNED = json.load(open(os.path.join(HERE, "banned.json")))["people"]  # removed for good, see the file
_bn = {re.sub(r"[^a-z0-9]+", "", b["name"].lower()) for b in BANNED}; _bh = {b["handle"].lower() for b in BANNED}
bad = [p["disp"] for p in TL.PEOPLE if re.sub(r"[^a-z0-9]+", "", p["disp"].lower()) in _bn or (p["handle"] or "").lstrip("@").lower() in _bh]
assert not bad, f"banned people came through the collector: {bad}"
missing = [p["key"] for p in TL.PEOPLE if p["key"] not in ROLES]
assert not missing, f"no category in roles.json for: {missing}"


def norm(n):
    return re.sub(r"[^a-z0-9]+", "", n.lower())


people, keep = {}, set()
for p in TL.PEOPLE:  # every painting; the film shows one per person, the page keeps them all
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
    work = dict(title=p["title"] or "", s=s_name, l=l_name, w=W, h=H)
    if p.get("kind") == "census":
        work.update(num=p["num"], key=bool(p.get("keystone")), rec=BY_N[p["num"]]["id"])
    # one card per person: a census piece and a later portrait of the same person share it
    k = norm(p["disp"])
    e = people.setdefault(k, dict(id=sid, name=p["disp"], handle="", x="", cat=ROLES[p["key"]], works=[]))
    hd = p["handle"] or ""
    if hd and not e["handle"]:
        e.update(handle=hd, x=hd[1:] if HANDLE.match(hd) else "")
    # the portrait made for the person leads, the census piece follows
    if p.get("kind") == "census":
        e["works"].append(work)
    else:
        e["works"].insert(0, work)
BIOS = json.load(open(os.path.join(HERE, "bios.json"))) if os.path.exists(os.path.join(HERE, "bios.json")) else {}
INTERVIEWS = json.load(open(os.path.join(HERE, "interviews.json"))) if os.path.exists(os.path.join(HERE, "interviews.json")) else {}
for k, e in people.items():
    e["bio"] = BIOS.get(k, "")
    e["iv"] = INTERVIEWS.get(k, [])
nobio = [e["name"] for e in people.values() if not e["bio"]]
if nobio:
    print(f"  no bio yet for {len(nobio)}: {nobio[:8]}")
entries = sorted(people.values(), key=lambda e: ([c for c, _ in CATS].index(e["cat"]), e["name"] != "MLow",  # the artist leads his own section
                                                norm(re.sub(r"^the ", "", e["name"], flags=re.I))))

for f in os.listdir(OUT):  # images no longer referenced
    if f.endswith(".jpg") and f not in keep:
        os.remove(os.path.join(OUT, f))
json.dump(dict(cats=[dict(code=c, name=n) for c, n in CATS], people=entries), open(os.path.join(HERE, "honoraries.json"), "w"), indent=0, ensure_ascii=False)
mb = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) / 1e6
print(f"honoraries: {len(entries)} people, {sum(len(e['works']) for e in entries)} paintings, {mb:.0f} MB of images")
