#!/usr/bin/env python3
"""collectors.html: the collectors leaderboard and its badges.

Every wallet holding NEW YORKERS, ranked by points, with badges for what its pieces add up to:
the five boroughs, every family, every era, a whole set, Keystone, day one. The same idea Good
Vibes Club and Azuki run on their sites, built from the census's own traits.

Sources, all local, nothing fetched here:
  collectors/chain.json          who holds what, from collectors/fetch_chain.py (run that first to refresh)
  collectors/census_traits.json  token id to census number, era, borough, family, set, neighbourhood.
                                 Snapshotted once from the mint kit's metadata, which is fixed per token.
  collectors/badges.json         the badges: name, rule, points. Edit there, not here.
Writes collectors.html and api/collectors.json. A snapshot, not live: the page says when it was read.
The artist's and the team's wallets are ranked like everyone else and labelled from badges.json "tags".
Keystone thumbnails are fetched once into assets/collectors/k<token>.jpg so every piece, and the
downloadable collector card, has a same origin image.
"""
import json, os, re, time, datetime, collections, io, urllib.request
from PIL import Image
from page_shell import shell, esc, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
COL = os.path.join(HERE, "collectors")
KIT_META = os.path.join(ROOT, "CENSUS RELEASE 2026-09-23", "metadata")
TRAITS = os.path.join(COL, "census_traits.json")
C = cfg(); URL = C["siteUrl"]
ZERO = "0x" + "0" * 40
ET = datetime.timezone(datetime.timedelta(hours=-4))   # EDT through 1 November
FIVE = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]

# ---------- census traits, snapshotted from the kit once ----------
if not os.path.exists(TRAITS):
    want = {"CENSUS NUMBER": "n", "ERA": "era", "BOROUGH": "b", "FAMILY": "f", "SET": "set", "NEIGHBORHOOD": "nb", "ANIMATION": "anim", "GLITCH EDITION": "gl"}
    snap = {}
    for i in range(1, 6667):
        d = json.load(open(os.path.join(KIT_META, f"{i}.json")))
        a = {want[x["trait_type"]]: x["value"] for x in d["attributes"] if x["trait_type"] in want}
        a["anim"] = a.get("anim") == "YES"; a["gl"] = a.get("gl") == "YES"; a["t"] = d["name"].rsplit(" #", 1)[0]; a["img"] = d["image"].replace("ipfs://", "")
        snap[str(i)] = a
    json.dump(snap, open(TRAITS, "w"), ensure_ascii=False, separators=(",", ":"))
T = json.load(open(TRAITS))
CH = json.load(open(os.path.join(COL, "chain.json")))
B = json.load(open(os.path.join(COL, "badges.json")))
TAGS = {a.lower(): t for a, t in B.get("tags", {}).items()}
KTH = os.path.join(SITE, "assets", "collectors"); os.makedirs(KTH, exist_ok=True)
GATEWAYS = ["https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/", "https://dweb.link/ipfs/"]
ENS = CH.get("ens", {})
HOMES = {k.lower(): v for k, v in json.load(open(os.path.join(COL, "homes.json"))).items() if k.startswith("0x")}
for a, v in HOMES.items():
    if v.get("name") and a not in ENS: ENS[a] = v["name"]   # forward resolved name, never set as primary
ROOMS = {r["id"]: r for r in json.load(open(os.path.join(HERE, "rooms.json")))}
# who each wallet is, and its honorary if MLow painted them: collectors/link_identities.py lines every holder up
# against homes.json, MLow's handle rulings, ENS records, the collector CRM and OpenSea profiles
_HON = json.load(open(os.path.join(HERE, "honoraries", "honoraries.json")))["people"]
_HCARDS = json.load(open(os.path.join(HERE, "honoraries", "cards.json")))
_BYID = {p["id"]: p for p in _HON}
_IDF = os.path.join(COL, "identity.json")
IDENT = json.load(open(_IDF))["wallets"] if os.path.exists(_IDF) else {}
HONOR = {a: _BYID[v["honoree"]] for a, v in IDENT.items() if v.get("honoree") in _BYID}
for a, v in HOMES.items():
    if v.get("honoree") in _BYID: HONOR[a] = _BYID[v["honoree"]]

def honor(a):
    p = HONOR.get(a)
    if not p: return None
    w = (p.get("works") or [{}])[0]
    card = (_HCARDS.get(p["id"]) or {}).get("card")
    return {"id": p["id"], "name": p["name"], "handle": p.get("handle", ""), "bio": p.get("bio", ""), "title": w.get("title", ""),
            "img": f"assets/honoraries/{w['l']}" if w.get("l") else None, "card": f"assets/cards/{card}" if card else None, "page": f"h/{p['id']}.html"}
_ho = open(os.path.join(HERE, "museum", "src", "hang_owned.ts")).read()
_ow = _ho[_ho.index("{", _ho.index("export const OWNED")):_ho.index("export const LEADS")]
OWNED = json.loads(re.sub(r",\s*}", "}", _ow[:_ow.rindex("}") + 1]))
ROOM_OF = {n: rid for rid, ns in OWNED.items() for n in ns}
KM = CH.get("keystone_meta", {})

s = open(os.path.join(SITE, "assets", "data.js")).read()
DATA = json.loads(s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1])
BYN = {p["n"]: p for p in DATA["pieces"] if p.get("n") is not None}
ERAS = sorted({v["era"] for v in T.values()}, key=lambda r: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV"].index(r))
FAMS = sorted({v["f"] for v in T.values() if v.get("f")})
SETSIZE = collections.Counter(v["set"] for v in T.values() if v.get("set"))   # some pieces belong to no set

# ---------- replay the transfers ----------
owner, minted_by, mint_t, sent = {}, {}, {}, collections.Counter()
for lg in CH["logs"]:
    k = (lg["c"], lg["id"])
    if lg["from"] == ZERO: minted_by[k] = lg["to"]; mint_t[k] = lg["t"]
    else: sent[lg["from"]] += 1
    owner[k] = lg["to"]
held = collections.defaultdict(lambda: {"census": [], "keystone": []})
for (c, i), a in owner.items():
    if a != ZERO: held[a][c].append(i)
minted = collections.defaultdict(list)
for k, a in minted_by.items(): minted[a].append(k)
day_one_end = datetime.datetime(2026, 9, 24, 0, 0, tzinfo=ET).timestamp()
sold_out = sum(1 for k in owner if k[0] == "census")


IPFS = "https://gateway.pinata.cloud/ipfs/"


def media(n):
    """Motion clip and aspect ratio from data.js, for the TV and the wall."""
    p = BYN.get(n) or {}
    mv = p.get("mv")
    if isinstance(mv, str):
        try: mv = json.loads(mv.replace("'", '"'))
        except ValueError: mv = None
    clip = next((m["mp4"] for m in (mv or []) if isinstance(m, dict) and m.get("cast", 1) == 1 and m.get("mp4")), None)
    return clip, round(float(p.get("ar") or 1), 3)


def thumb(n):
    p = BYN.get(n)
    return (f"assets/t/{p['st'][0]}.jpg", p["id"]) if p and p.get("st") else (None, None)


def keystone_thumb(i):
    """A same origin thumbnail for a Keystone token, from its own metadata image. Fetched once."""
    rel = f"assets/collectors/k{i}.jpg"; dst = os.path.join(SITE, rel)
    if os.path.exists(dst): return rel
    img = KM.get(str(i), {}).get("image", "")
    if not img.startswith("ipfs://"): return None
    for g in GATEWAYS:
        try:
            raw = urllib.request.urlopen(urllib.request.Request(g + img[7:], headers={"User-Agent": "n3wyorkers-collectors/1"}), timeout=60).read()
            im = Image.open(io.BytesIO(raw)); im.seek(0); im = im.convert("RGB")
            w, h = im.size; c = min(w, h); im = im.crop(((w - c) // 2, (h - c) // 2, (w - c) // 2 + c, (h - c) // 2 + c))
            im.thumbnail((480, 480), Image.LANCZOS); im.save(dst, "JPEG", quality=84, optimize=True, progressive=True)
            return rel
        except Exception:
            continue
    return None


def keystone_piece(i):
    name = KM.get(str(i), {}).get("name") or f"Keystone #{i}"
    n = int(name.rsplit("#", 1)[1]) if "#" in name and name.rsplit("#", 1)[1].isdigit() else None
    return name.rsplit(" #", 1)[0], n


# ---------- badges ----------
# a badge's icon: assets/badges/<id>.png when it has been made, the emoji in badges.json until then
for b in B["badges"]:
    for ext in ("png", "webp", "jpg"):
        if os.path.exists(os.path.join(SITE, "assets", "badges", f"{b['id']}.{ext}")):
            b["img"] = f"assets/badges/{b['id']}.{ext}"; break
DEF = {b["id"]: b for b in B["badges"]}
earned = collections.Counter()
rows = []
for a, h in held.items():
    cen, key = sorted(h["census"]), sorted(h["keystone"])
    if not cen and not key: continue
    tr = [T[str(i)] for i in cen]
    boros = {t.get("b") for t in tr}; fams = {t["f"] for t in tr if t.get("f")}; eras = {t["era"] for t in tr}
    sets = collections.Counter(t["set"] for t in tr if t.get("set")); nbs = collections.Counter(t["nb"] for t in tr if t.get("nb"))
    total = len(cen) + len(key)
    got = []
    for tid, need in (("borough_president", 50), ("landlord", 25), ("block_captain", 11), ("regular", 5), ("counted", 1)):
        if total >= need: got.append(tid); break
    if all(x in boros for x in FIVE): got.append("five_boroughs")
    elif len([x for x in FIVE if x in boros]) >= 3: got.append("bridge_and_tunnel")
    if len(fams) == len(FAMS): got.append("whole_family")
    if len(eras) == len(ERAS): got.append("whole_timeline")
    elif len(eras) >= 5: got.append("time_traveler")
    full = [st for st, n in sets.items() if n >= SETSIZE[st]]
    if full: got.append("set_complete")
    if any(n >= 3 for st, n in sets.items() if st not in full): got.append("set_started")
    if nbs and nbs.most_common(1)[0][1] >= 3: got.append("local")
    if key: got.append("keystone")
    if key and cen: got.append("founder")
    mine = minted.get(a, [])
    if any(mint_t[k] < day_one_end for k in mine if k[0] == "census"): got.append("day_one")
    if any(k[0] == "census" and k[1] <= 111 for k in mine): got.append("first_111")
    if mine and not sent[a]: got.append("lifer")
    if any(t.get("anim") for t in tr): got.append("moving_picture")
    if any(t.get("gl") for t in tr): got.append("glitched")
    pts = len(cen) * B["points"]["census"] + len(key) * B["points"]["keystone"] + sum(DEF[g]["points"] for g in got) \
        + sum(SETSIZE[st] * B["points"]["per_piece_in_complete_set"] for st in full)
    best = max(sets.items(), key=lambda x: (x[1] / SETSIZE[x[0]], x[1]), default=None)
    pieces = []
    for i in cen:
        t = T[str(i)]; th, pid = thumb(t["n"])
        mv, ar = media(t["n"])
        pieces.append({"c": "census", "tok": i, "n": t["n"], "t": t["t"], "th": th, "id": pid, "big": IPFS + t["img"] if t.get("img") else None, "mv": mv, "ar": ar})
    for i in key:
        name, n = keystone_piece(i); th, pid = thumb(n) if n else (None, None)
        th = th or keystone_thumb(i)
        mv, ar = media(n) if n and pid else (None, 1.0)
        pieces.append({"c": "keystone", "tok": i, "n": n, "t": name, "th": th, "id": pid, "big": None, "mv": mv, "ar": ar})
    for g in got: earned[g] += 1
    nums = [p["n"] for p in pieces if p.get("id")]
    where = collections.Counter(ROOM_OF[n] for n in nums if n in ROOM_OF)
    home = (HOMES.get(a) or {}).get("room") or (where.most_common(1)[0][0] if where else "metgreathall")
    idn = IDENT.get(a, {})
    rows.append({"a": a, "ens": ENS.get(a, ""), "nm": ENS.get(a, "") or idn.get("user", "") or ("@" + idn["x"] if idn.get("x") else ""), "x": idn.get("x", ""),
                 "also": [w for w in idn.get("wallets", []) if w != a], "tag": TAGS.get(a, ""), "pts": pts, "census": len(cen), "keystone": len(key), "badges": got,
                 "boros": [x for x in FIVE if x in boros], "fams": len(fams), "eras": len(eras),
                 "set": {"name": best[0], "have": best[1], "of": SETSIZE[best[0]]} if best else None,
                 "local": {"name": nbs.most_common(1)[0][0], "have": nbs.most_common(1)[0][1]} if nbs else None,
                 "honor": honor(a), "home": home, "where": [{"room": r_, "name": ROOMS[r_]["name"], "n": c_} for r_, c_ in where.most_common() if r_ in ROOMS],
                 "pieces": pieces})

rows.sort(key=lambda r: (-r["pts"], -(r["census"] + r["keystone"]), r["a"]))
for k, r in enumerate(rows): r["rank"] = k + 1
ranked = rows
if ranked:
    ranked[0]["badges"].insert(0, "mayor"); ranked[0]["pts"] += DEF["mayor"]["points"]; earned["mayor"] = 1

asof = datetime.datetime.fromtimestamp(CH["fetched"], ET)
meta = {"asOf": asof.strftime("%B %-d, %Y at %-I:%M %p ET"), "block": CH["to"], "collectors": len(ranked),
        "census": sold_out, "keystone": sum(1 for k in owner if k[0] == "keystone"),
        "eras": len(ERAS), "families": len(FAMS)}
badges_out = [{**b, "holders": earned.get(b["id"], 0)} for b in B["badges"]]

os.makedirs(os.path.join(SITE, "api"), exist_ok=True)
# one file per wallet with every piece, for my.html, tv.html and wall.html; small enough to load on a TV
CDIR = os.path.join(SITE, "api", "c"); os.makedirs(CDIR, exist_ok=True)
for f in os.listdir(CDIR):
    if f.endswith(".json"): os.remove(os.path.join(CDIR, f))
for r in rows:
    json.dump({**r, "homeName": ROOMS.get(r["home"], {}).get("name", ""), "of": len(rows), "asOf": meta["asOf"], "badgeDefs": {b["id"]: {k: b.get(k) for k in ("id", "name", "icon", "color", "rule", "img")} for b in B["badges"] if b["id"] in r["badges"]}}, open(os.path.join(CDIR, r["a"] + ".json"), "w"), ensure_ascii=False, separators=(",", ":"))
# the other direction, for the honoraries page and h/<id>.html: which honorees collect, and what
# one person can hold from several wallets: the link goes to the wallet holding most, the count adds them all up
_hl = {}
for r in rows:
    if not r.get("honor"): continue
    hid = r["honor"]["id"]; n = r["census"] + r["keystone"]; cur = _hl.get(hid)
    if not cur:
        _hl[hid] = {"key": (r["ens"] or r["a"]).lower(), "name": r["nm"] or (r["a"][:6] + "\u2026" + r["a"][-4:]), "n": n, "rank": r["rank"], "of": len(rows), "_top": n, "held": []}
    else:
        cur["n"] += n; cur["rank"] = min(cur["rank"], r["rank"])
        if n > cur["_top"]: cur.update({"key": (r["ens"] or r["a"]).lower(), "name": r["nm"] or (r["a"][:6] + "\u2026" + r["a"][-4:]), "_top": n})
    # the pieces themselves, so their portrait can hang beside what they own
    _hl[hid]["held"] += [{"th": x["th"], "id": x["id"], "t": x["t"], "k": x["c"] == "keystone"} for x in r["pieces"] if x.get("th")]
for v in _hl.values():
    v.pop("_top"); v["held"].sort(key=lambda x: not x["k"]); v["held"] = v["held"][:12]
json.dump(_hl, open(os.path.join(COL, "honor_links.json"), "w"), ensure_ascii=False, indent=1)
json.dump({r["a"]: r["ens"] for r in rows}, open(os.path.join(SITE, "api", "c", "index.json"), "w"), separators=(",", ":"))
json.dump({"meta": meta, "badges": badges_out,
           "collectors": [{k: v for k, v in r.items() if k != "pieces"} | {"tokens": {"census": [p["tok"] for p in r["pieces"] if p["c"] == "census"], "keystone": [p["tok"] for p in r["pieces"] if p["c"] == "keystone"]}} for r in rows]},
          open(os.path.join(SITE, "api", "collectors.json"), "w"), ensure_ascii=False, separators=(",", ":"))

# ---------- page ----------
body = f"""
<section class="wrap" style="padding-top:64px;padding-bottom:8px;position:relative">
  <img class="herologo" id="cLogo" alt="N3W YORKERS by MLow" hidden>
  <div class="kicker" style="color:var(--acid)">The collectors</div>
  <h1 class="h-xl" style="margin-top:14px;max-width:1000px">Who's counting.</h1>
  <p class="lede" style="margin-top:16px;max-width:820px">Every wallet holding NEW YORKERS, ranked. Points for every piece and every badge: hold all five boroughs, every family, a whole set, a Keystone. Find yourself, open any collector to see their New Yorkers, and share your card.</p>
  <div class="cstats">
    <div><b>{meta['collectors']}</b><span>collectors</span></div>
    <div><b>{meta['census']}</b><span>census minted</span></div>
    <div><b>{meta['keystone']}</b><span>Keystone on chain</span></div>
    <div><b>{len(B['badges'])}</b><span>badges</span></div>
  </div>
  <form class="cfind" id="cfind" autocomplete="off"><input id="cq" placeholder="Your wallet or ENS name" aria-label="Wallet address or ENS name" spellcheck="false"><button class="btn" type="submit">Find me</button><a class="btn ghost" href="my.html">My NEW YORKERS</a></form>
  <p class="cmsg" id="cmsg" role="status"></p>
</section>
<section class="wrap" style="padding-top:8px">
  <div class="ctabs" role="tablist"><button type="button" role="tab" data-k="board" aria-selected="true">Leaderboard</button><button type="button" role="tab" data-k="badges" aria-selected="false">The badges</button></div>
</section>
<section class="wrap" style="padding-top:18px;padding-bottom:40px" id="paneBoard"><div class="cboard" id="cboard"></div><button class="btn ghost" type="button" id="cmore" hidden>Show more</button></section>
<section class="wrap" style="padding-top:18px;padding-bottom:40px" id="paneBadges" hidden><div class="cbadges" id="cbadges"></div></section>
<section class="wrap" style="padding-bottom:90px"><p class="cfoot">Read off Ethereum on {esc(meta['asOf'])}, block {meta['block']:,}. THE CENSUS RELEASE and KEYSTONE both count. Wallets marked Artist and Team belong to MLow and the NEW YORKERS team, and rank like everyone else. Points: {B['points']['census']} a census piece, {B['points']['keystone']} a Keystone, plus every badge. Raw data at <a href="api/collectors.json">api/collectors.json</a>.</p></section>
"""

css = """
.cstats{display:flex;flex-wrap:wrap;gap:28px;margin-top:26px}
.cstats div{display:flex;flex-direction:column}
.cstats b{font-family:var(--serif);font-size:34px;font-weight:500;color:var(--cloud);line-height:1}
.cstats span{font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--slate);margin-top:6px}
.cfind{display:flex;gap:10px;margin-top:28px;max-width:560px}
.cfind input{flex:1;min-width:0;background:var(--card);border:1px solid var(--divider);color:var(--cloud);border-radius:999px;padding:12px 18px;font-family:var(--mono);font-size:13px}
.cfind input:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.cmsg{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--slate);min-height:16px;margin-top:10px}
.ctabs{display:flex;gap:8px;border-bottom:1px solid var(--divider);padding-bottom:12px}
.ctabs button{background:transparent;border:1px solid var(--divider);color:var(--cloud);font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;padding:9px 14px;border-radius:999px;cursor:pointer}
.ctabs button[aria-selected=true]{background:var(--blue);border-color:var(--blue);color:#fff}
.ctabs button:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.ctag.hon{border-color:#FF2E63;color:#FF2E63}
.chon{display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px;align-items:center;margin:14px 0 4px;padding:10px;border:1px solid var(--divider);border-radius:10px;text-decoration:none;background:#11151C}
.chon:hover{border-color:#FF2E63}
.chon img{width:120px;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block}
.chon span{font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#FF2E63}
.chon b{display:block;font-family:var(--serif);font-size:20px;font-weight:500;color:var(--cloud);margin-top:3px}
.chon p{margin:5px 0 0;font-size:13.5px;line-height:1.45;color:var(--slate)}
.crow{border:1px solid var(--divider);background:var(--card);border-radius:12px;margin-bottom:10px;overflow:hidden}
.crow.me{border-color:var(--acid);box-shadow:0 0 0 1px var(--acid)}
.ctag{display:inline-block;margin-left:8px;padding:2px 7px;border-radius:999px;border:1px solid var(--acid);color:var(--acid);font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;vertical-align:middle}
.chead{display:grid;grid-template-columns:54px minmax(0,1fr) auto 86px;gap:14px;align-items:center;padding:14px 16px;cursor:pointer;width:100%;background:none;border:0;color:inherit;text-align:left;font:inherit}
.chead:focus-visible{outline:2px solid var(--blue);outline-offset:-2px}
.crk{font-family:var(--serif);font-size:26px;color:var(--cloud);text-align:center}
.crk.top{color:var(--acid)}
.cwho b{display:block;font-family:var(--sans);font-size:15px;font-weight:500;color:var(--cloud);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cwho span{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate)}
.cbs{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end;max-width:360px}
.cpts{text-align:right}
.cpts b{display:block;font-family:var(--serif);font-size:22px;color:var(--cloud)}
.cpts span{font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:var(--slate)}
.bdg{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;font-size:14px;line-height:1;background:var(--bg,#1a1a1a);border:1.5px solid currentColor}
.bdg img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
.bdg.lg{width:52px;height:52px;font-size:24px;border-width:2px;flex:none}
.cbody{padding:4px 16px 18px;border-top:1px solid var(--divider)}
.cbody[hidden]{display:none}
.cprog{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:14px 0}
.cprog div{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate)}
.cprog i{display:block;height:5px;border-radius:3px;background:var(--divider);margin-top:6px;overflow:hidden}
.cprog i u{display:block;height:100%;background:var(--acid)}
.cprog em{font-style:normal;color:var(--cloud)}
.cearn{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 14px}
.cearn span{display:inline-flex;align-items:center;gap:7px;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--cloud);border:1px solid var(--divider);border-radius:999px;padding:4px 10px 4px 4px}
.cearn .bdg{width:22px;height:22px;font-size:11px}
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
.cgrid a{display:block;border-radius:8px;overflow:hidden;border:1px solid var(--divider);background:#111;aspect-ratio:1;position:relative;text-decoration:none}
.cgrid img{width:100%;height:100%;object-fit:cover;display:block}
.cgrid a span{position:absolute;left:0;right:0;bottom:0;padding:3px 5px;font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.8))}
.cgrid a.k{border-color:var(--acid)}
.cgrid a.nt{display:flex;align-items:center;justify-content:center;padding:6px;text-align:center;font-family:var(--mono);font-size:9px;color:var(--cloud)}
.cact{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.cbadges{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.cbadge{display:flex;gap:14px;align-items:flex-start;border:1px solid var(--divider);background:var(--card);border-radius:12px;padding:16px}
.cbadge h3{margin:0;font-family:var(--sans);font-size:15px;font-weight:600;color:var(--cloud);letter-spacing:.02em}
.cbadge p{margin:5px 0 8px;font-size:13.5px;line-height:1.45;color:var(--slate)}
.cbadge small{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate)}
.cbadge small b{color:var(--cloud);font-weight:500}
.cfoot{font-family:var(--mono);font-size:11px;line-height:1.7;letter-spacing:.06em;color:var(--slate);max-width:820px}
.cfoot a{color:var(--cloud)}
#cmore{margin-top:10px}
.cwho.hasav{position:relative;padding-left:52px;min-height:42px}.cav{position:absolute;left:0;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid var(--acid)}
@media (max-width:700px){.chead{grid-template-columns:40px minmax(0,1fr) 64px;gap:10px;padding:12px}.cbs{grid-column:2/4;grid-row:2;justify-content:flex-start;max-width:none}.crk{font-size:20px}.bdg{width:24px;height:24px;font-size:12px}.cfind{flex-direction:column}.cstats{gap:20px}.cstats b{font-size:28px}}
"""

PAGE = {"meta": meta, "badges": badges_out, "five": FIVE, "rows": rows, "opensea": "https://opensea.io/", "site": URL}


js = """<script src="assets/collector-card.js"></script>
<script>
(function(){
var D=__DATA__, BASE=window.NY_BASE||'', BD={}, board=document.getElementById('cboard'), more=document.getElementById('cmore'), shown=50, me=null;
D.badges.forEach(function(b){BD[b.id]=b;});
function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function short(a){return a.slice(0,6)+'\\u2026'+a.slice(-4);}
function who(r){return r.nm||r.ens||short(r.a);}
function badge(id,big){var b=BD[id],e=h('span','bdg'+(big?' lg':''),b.img?null:b.icon);if(b.img){var bi=h('img');bi.src=BASE+b.img;bi.alt='';e.appendChild(bi);}e.style.color=b.color;e.title=b.name+': '+b.rule;e.setAttribute('aria-label',b.name);return e;}
function bar(label,have,of){var d=h('div');d.appendChild(document.createTextNode(label+' '));d.appendChild(h('em',null,have+' / '+of));var i=h('i'),u=h('u');u.style.width=Math.min(100,Math.round(100*have/of))+'%';i.appendChild(u);d.appendChild(i);return d;}
function row(r){
  var w=h('div','crow'+(me===r.a?' me':''));w.id='c-'+r.a;
  var hd=h('button','chead');hd.type='button';hd.setAttribute('aria-expanded','false');
  hd.appendChild(h('div','crk'+(r.rank===1?' top':''),r.rank));
  var nm=h('div','cwho'+(r.honor&&r.honor.img?' hasav':'')),nb=h('b',null,who(r));
  if(r.honor&&r.honor.img){var av=h('img','cav');av.loading='lazy';av.src=BASE+r.honor.img;av.alt='';nm.appendChild(av);}if(r.tag)nb.appendChild(h('span','ctag',r.tag));if(r.honor)nb.appendChild(h('span','ctag hon','Honoree'));nm.appendChild(nb);
  nm.appendChild(h('span',null,r.census+' census'+(r.keystone?' \\u00b7 '+r.keystone+' Keystone':'')));hd.appendChild(nm);
  var bs=h('div','cbs');r.badges.forEach(function(b){bs.appendChild(badge(b));});hd.appendChild(bs);
  var p=h('div','cpts');p.appendChild(h('b',null,r.pts.toLocaleString()));p.appendChild(h('span',null,'POINTS'));hd.appendChild(p);
  w.appendChild(hd);
  var bd=h('div','cbody');bd.hidden=true;w.appendChild(bd);
  hd.onclick=function(){var o=bd.hidden;if(o&&!bd.firstChild)fill(bd,r);bd.hidden=!o;hd.setAttribute('aria-expanded',o?'true':'false');};
  return w;
}
function fill(bd,r){
  if(r.honor){var ho=r.honor,hb=h('a','chon');hb.href=BASE+ho.page;var hi=h('img');hi.loading='lazy';hi.src=BASE+(ho.img||ho.card);hi.alt=ho.name+', painted by MLow';hb.appendChild(hi);
    var ht=h('div');ht.appendChild(h('span',null,'Honorary New Yorker'));ht.appendChild(h('b',null,ho.name));if(ho.bio)ht.appendChild(h('p',null,ho.bio));hb.appendChild(ht);bd.appendChild(hb);}
  var ea=h('div','cearn');r.badges.forEach(function(id){var s=h('span');s.appendChild(badge(id));s.appendChild(document.createTextNode(BD[id].name));ea.appendChild(s);});bd.appendChild(ea);
  var pg=h('div','cprog');
  pg.appendChild(bar('Boroughs',r.boros.length,5));
  pg.appendChild(bar('Families',r.fams,D.meta.families));
  pg.appendChild(bar('Eras',r.eras,D.meta.eras));
  if(r.set)pg.appendChild(bar(r.set.name,r.set.have,r.set.of));
  bd.appendChild(pg);
  var g=h('div','cgrid');
  r.pieces.forEach(function(x){
    var a=h('a',(x.c==='keystone'?'k':'')+(x.th?'':' nt'));
    a.href=x.id?BASE+'n/'+x.id+'.html':BASE+'keystone.html';
    if(x.th){var im=h('img');im.loading='lazy';im.decoding='async';im.src=BASE+x.th;im.alt=x.t;a.appendChild(im);a.appendChild(h('span',null,x.c==='keystone'?'KEYSTONE':'NO. '+x.n));}
    else a.textContent=x.t;
    a.title=x.t;g.appendChild(a);
  });
  bd.appendChild(g);
  var ac=h('div','cact');
  if(r.x){var xl=h('a','btn ghost','@'+r.x+' on X');xl.href='https://x.com/'+encodeURIComponent(r.x);xl.target='_blank';xl.rel='noopener';ac.appendChild(xl);}
  var os=h('a','btn ghost','OpenSea');os.href=D.opensea+r.a;os.target='_blank';os.rel='noopener';ac.appendChild(os);
  var ln=h('button','btn ghost','Copy link');ln.type='button';ln.onclick=function(){var u=location.origin+location.pathname+'#'+r.a;try{navigator.clipboard.writeText(u);ln.textContent='Copied';}catch(e){prompt('Copy this link',u);}};ac.appendChild(ln);
  var my=h('a','btn','Open the gallery');my.href=BASE+'my.html#'+(r.ens||r.a).toLowerCase();ac.appendChild(my);
  var dl=h('button','btn ghost','Download the card');dl.type='button';dl.onclick=function(){NYCard(r,{badges:BD,meta:D.meta},dl);};ac.appendChild(dl);
  {var tw=h('a','btn','Share on X');var txt=(r.rank===1?'Mayor of NEW YORKERS. ':'#'+r.rank+' on the NEW YORKERS collectors board. ')+(r.census+r.keystone)+' New Yorkers, '+r.badges.length+' badges.';
    tw.href='https://x.com/intent/post?text='+encodeURIComponent(txt)+'&url='+encodeURIComponent(D.site+'/collectors#'+r.a);tw.target='_blank';tw.rel='noopener';ac.appendChild(tw);}
  bd.appendChild(ac);
}
function draw(){board.innerHTML='';D.rows.slice(0,shown).forEach(function(r){board.appendChild(row(r));});more.hidden=shown>=D.rows.length;}
more.onclick=function(){shown+=100;draw();};
var bg=document.getElementById('cbadges');
D.badges.forEach(function(b){var c=h('div','cbadge');c.appendChild(badge(b.id,true));var t=h('div');t.appendChild(h('h3',null,b.name));t.appendChild(h('p',null,b.rule));
  var sm=h('small');sm.appendChild(h('b',null,b.points+' pts'));sm.appendChild(document.createTextNode(' \\u00b7 '+b.holders+' '+(b.holders===1?'collector':'collectors')));t.appendChild(sm);c.appendChild(t);bg.appendChild(c);});
var tabs=document.querySelectorAll('.ctabs button');
function tab(k){tabs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.k===k?'true':'false');});document.getElementById('paneBoard').hidden=k!=='board';document.getElementById('paneBadges').hidden=k!=='badges';}
tabs.forEach(function(b){b.onclick=function(){tab(b.dataset.k);};});
var msg=document.getElementById('cmsg');
function find(q){
  q=(q||'').trim().toLowerCase();if(!q)return;
  var i=-1;D.rows.forEach(function(r,j){if(i<0&&(r.a===q||(r.ens&&r.ens.toLowerCase()===q)||(r.x&&r.x.toLowerCase()===q.replace(/^@/,''))||(r.nm&&r.nm.toLowerCase()===q)))i=j;});
  if(i<0){msg.textContent=/^0x[0-9a-f]{40}$/.test(q)?'That wallet holds no NEW YORKERS as of this snapshot. Mint one and you are on the board at the next read.':'Not found. Paste the 0x address; only ENS names set as a primary name are known here.';return;}
  var r=D.rows[i];me=r.a;tab('board');if(i>=shown)shown=i+1;draw();
  msg.textContent=(r.tag?r.tag+' wallet. ':'')+'Number '+r.rank+' of '+D.meta.collectors+'.';
  var el=document.getElementById('c-'+r.a);el.scrollIntoView({behavior:'smooth',block:'center'});el.querySelector('.chead').click();
  try{history.replaceState(null,'','#'+r.a);}catch(e){}
}
document.getElementById('cfind').onsubmit=function(e){e.preventDefault();find(document.getElementById('cq').value);};
draw();
if(window.NY_LOGOS){var L=window.NY_LOGOS,cl=document.getElementById('cLogo');cl.src=L.url(L.LOCKUPS[Math.floor(Math.random()*L.LOCKUPS.length)]);cl.hidden=false;}
var hs=decodeURIComponent(location.hash.slice(1));if(hs){if(hs==='badges')tab('badges');else{document.getElementById('cq').value=hs;find(hs);}}
})();
</script>""".replace("__DATA__", json.dumps(PAGE, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"))

page = shell(title="Collectors · NEW YORKERS by MLow",
             description=f"The NEW YORKERS collectors leaderboard: {meta['collectors']} collectors ranked by points, with badges for holding all five boroughs, every family, a whole set, a Keystone and day one.",
             body=body, path="collectors.html", active="COLLECTORS", extra_css=css, scripts_after=js,
             keywords=["NEW YORKERS", "MLow", "collectors", "leaderboard", "badges", "NFT", "THE CENSUS RELEASE", "KEYSTONE"],
             jsonld={"@context": "https://schema.org", "@type": "CollectionPage", "name": "NEW YORKERS collectors", "url": URL + "/collectors.html",
                     "creator": {"@type": "Person", "name": "MLow"}, "isPartOf": {"@id": URL + "/#collection"}})
open(os.path.join(SITE, "collectors.html"), "w").write(page)
print(f"collectors.html: {meta['collectors']} ranked, {len(TAGS)} tagged wallets, "
      f"{meta['census']} census + {meta['keystone']} Keystone, as of block {meta['block']}; badges held: "
      + ", ".join(f"{k} {v}" for k, v in earned.most_common()))
