#!/usr/bin/env python3
"""Pick census pieces that genuinely relate to a reading room article.

Scored, not random. A bad match looks worse than no image, so anything under the floor is dropped and
an article simply gets fewer pictures rather than irrelevant ones.
"""
import json, os, re
from collections import defaultdict
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)

STOP = set("""the a an and or of in on at to for from with by is are was were be been it its this that
those these as into over under near about after before during between new york city nyc n y he she they
his her their you your who what when where why how one two three first also more most than then them
had has have not but if so all any some each every other another such own same only very can will just
don t s said says over under out up down off""".split())

def terms(*chunks):
    out = defaultdict(float)
    for text, weight in chunks:
        for w in re.findall(r"[a-z']{3,}", (text or "").lower()):
            if w in STOP: continue
            out[w] = max(out[w], weight)
    return out

def load():
    d = open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read()
    D = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
    rooms = {r["id"]: r for r in json.load(open(os.path.join(HERE, "rooms_full.json"), encoding="utf-8"))}
    return D, rooms

def piece_text(p):
    return " ".join(str(x) for x in (p.get("t"), p.get("story"), p.get("loc"), p.get("nb"),
                                     p.get("cat"), p.get("set"), p.get("b")) if x)

def _score(q, hoods, D, floor):
    out = []
    for p in D["pieces"]:
        if p.get("e") == 1 or not p.get("st"):
            continue
        txt = piece_text(p).lower()
        s = 0.0
        for w, wt in q.items():
            if w in txt: s += wt
        place = (str(p.get("nb") or "") + " " + str(p.get("loc") or "")).lower()
        if place and any(h and h in place for h in hoods): s += 3.0
        if s >= floor: out.append((s, p))
    out.sort(key=lambda x: (-x[0], x[1].get("n") or 0))
    return out

def rank(article, D, rooms, want=8, floor=3.0):
    """Spread the picks across the article's rooms rather than letting the loudest room take them all.
    Ranking globally gave the subway article eight Grand Central pieces and nothing from the subway."""
    art_q = terms((" ".join(article.get("keywords", [])), 3.0), (article.get("title", ""), 2.0),
                  (article.get("summary", ""), 1.0),
                  (" ".join(b.get("h", "") for b in article.get("body", [])), 1.5))
    rids = [r for r in article.get("rooms", []) if r in rooms]
    picked, seen = [], set()

    if rids:
        per = max(1, -(-want // len(rids)))          # ceiling divide, so every room gets a turn
        rounds = [[] for _ in rids]
        for i, rid in enumerate(rids):
            r = rooms[rid]
            q = dict(art_q)
            q.update(terms((r.get("place", ""), 4.0), (r.get("name", ""), 3.0), (r.get("area", ""), 3.0),
                           (" ".join(r.get("keywords", [])), 2.5), (r.get("learn", ""), 1.5)))
            hoods = {(r.get("area") or "").lower()}
            rounds[i] = _score(q, hoods, D, floor)
        # interleave: one from each room in turn, so the spread survives even if a room is thin
        idx = [0] * len(rids)
        while len(picked) < want and any(idx[i] < len(rounds[i]) for i in range(len(rids))):
            for i in range(len(rids)):
                if len(picked) >= want: break
                while idx[i] < len(rounds[i]):
                    sc, p = rounds[i][idx[i]]; idx[i] += 1
                    if p["st"][0] in seen: continue
                    seen.add(p["st"][0]); picked.append((round(sc, 1), p, rids[i]))
                    break

    if len(picked) < want:                            # top up from the article terms alone
        for sc, p in _score(art_q, set(), D, floor):
            if len(picked) >= want: break
            if p["st"][0] in seen: continue
            seen.add(p["st"][0]); picked.append((round(sc, 1), p, None))
    return picked

if __name__ == "__main__":
    import sys
    D, rooms = load()
    arts = []
    import glob
    for f in sorted(glob.glob(os.path.join(HERE, "learn", "articles_*.json"))):
        arts += json.load(open(f, encoding="utf-8"))
    which = sys.argv[1:] or [a["slug"] for a in arts[:3]]
    for a in arts:
        if a["slug"] not in which: continue
        print(f"\n=== {a['slug']}  (rooms: {', '.join(a.get('rooms', []))})")
        for s, p, rid in rank(a, D, rooms):
            print(f"   {s:5.1f}  [{(rid or '-'):>9}]  NO.{p['n']:>4}  {p['t'][:46]:48s} {p.get('nb') or p.get('loc') or ''}")
