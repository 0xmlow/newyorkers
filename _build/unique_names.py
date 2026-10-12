#!/usr/bin/env python3
"""Every New Yorker gets a name nobody else in the census carries.

Eras XVI to XIX drew first and last names from a small pool (SEEDREAM5_*/_build/names.py: about
15 first names per gender per cultural group, 20 surnames per group), so 2,134 named pieces came
out with only 899 distinct names. On 2026-10-08 MLow saw two Everton Charlemagnes minted and ruled
that no name may repeat.

  python3 unique_names.py plan        write unique_names_plan.json + unique_names_report.md, change nothing
                                      (a plan already applied is kept as unique_names_plan_<made>.json)
  python3 unique_names.py apply       write the plan into every file that carries a name (see below)
  python3 unique_names.py check       exit 1 if any name repeats (preflight and validate call this)

Who keeps the name: inside a clash the minted token with the lowest id keeps it; if none is minted
the lowest census number keeps it. Everyone else gets a new first name from the SAME cultural
group (by surname) and the SAME gender (by the old first name), not yet used with that surname
anywhere in the census, picked deterministically from the piece number. Surnames never change,
because the surname carries the character's background and the house that painted them.

What apply rewrites (all plain string edits of the old first name, whole word, inside that one
piece's own records):
  SEEDREAM5_*/roster.json name                     the site builder reads titles from here
  SEEDREAM5_*/character_bible.json handle, title
  NEW YORKERS SITE/_build/stories/stories_v4_*.json   the story opens with the first name
  NEW YORKERS SITE/_build/collectors/census_traits.json t   (a one time snapshot, never rebuilt)
  CENSUS RELEASE 2026-09-23/metadata/<token>.json name, description (story part only, never the tail)
  CENSUS RELEASE 2026-09-23/TOKEN_MAP.csv, MANIFEST.csv name
  CENSUS RELEASE 2026-09-23/_build/states.json name     (the viewer page title; rerun states.py build)
  THE MARKS 2026-10-07/MARKS_150.csv name               (cut pieces only)
Image files in SEEDREAM5_*/images keep their old file names: the roster wins over the file name in
build_data_v4.py, and MASTER MANIFEST.csv points at those paths.

After apply: states.py build, pin-viewer, apply; validate.py; pin_metadata.py --api v2 for a new
baseURI that MLow sets; then build_all.sh on the site. unique_names_plan.json holds old and new, so
`apply --revert` puts every name back.
"""
import argparse, csv, glob, json, os, random, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
ROOT = os.path.dirname(SITE)
KIT = os.path.join(ROOT, "CENSUS RELEASE 2026-09-23")
MARKS = os.path.join(ROOT, "THE MARKS 2026-10-07", "MARKS_150.csv")
ERAS = {16: "SEEDREAM5_5491-6490", 17: "SEEDREAM5_6491-6990", 18: "SEEDREAM5_6991-7490", 19: "SEEDREAM5_7491-7990"}
PLAN = os.path.join(HERE, "unique_names_plan.json")
REPORT = os.path.join(HERE, "unique_names_report.md")
CONTRACT = "0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4"
PERSON = re.compile(r"^([^,]+?), (a|an|the) ")
TAIL = "\n\n//-----------"


def jload(p, default=None):
    try:
        return json.load(open(p, encoding="utf-8"))
    except (OSError, ValueError):
        return default


def jsave(p, obj, indent=1):
    with open(p + ".tmp", "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=indent, ensure_ascii=False)
        f.write("\n")
    os.replace(p + ".tmp", p)


def pools():
    sys.path.insert(0, os.path.join(ROOT, ERAS[19], "_build"))
    from names import GROUPS  # noqa
    by_sur, by_first = {}, {}
    for g, (men, women, surs) in GROUPS.items():
        for s in surs:
            by_sur[s] = g
        for x in men:
            by_first.setdefault(x, set()).add((g, "M"))
        for x in women:
            by_first.setdefault(x, set()).add((g, "F"))
    return GROUPS, by_sur, by_first


def supply():
    """Minted tokens are 1..totalSupply (SeaDrop deals in order). Live read, else the site snapshot."""
    data = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "eth_call",
                       "params": [{"to": CONTRACT, "data": "0x18160ddd"}, "latest"]}).encode()
    for url in ("https://ethereum-rpc.publicnode.com", "https://eth.drpc.org", "https://rpc.mevblocker.io"):
        try:
            req = urllib.request.Request(url, data, {"Content-Type": "application/json", "User-Agent": "unique_names"})
            return int(json.load(urllib.request.urlopen(req, timeout=15))["result"], 16), "chain"
        except Exception:
            continue
    m = jload(os.path.join(SITE, "api", "mint.json"), {}) or {}
    return int(m.get("census", {}).get("minted", 0)), "api/mint.json snapshot"


def census():
    """token id -> (census number, title) from the kit snapshot the site already keys everything on."""
    tr = jload(os.path.join(HERE, "collectors", "census_traits.json"))
    return {int(t): (v["n"], v["t"]) for t, v in tr.items()}


def holders():
    m = jload(os.path.join(SITE, "api", "minted.json"), {}) or {}
    return {int(n): v.get("o", "") for n, v in (m.get("census") or {}).items()}


FEM = re.compile(r"\b(woman|her|she|girl|mother|grandmother|daughter|wife|sister|aunt|widow|niece|bride)\b", re.I)
MASC = re.compile(r"\b(man|his|he|boy|father|grandfather|son|husband|brother|uncle|widower|nephew|groom)\b", re.I)


def role_gender(rest):
    """F or M when the role text says so plainly about the subject, None when it says both or neither.
    "whose grandmother did the same trade" is about the grandmother, so that clause is dropped first."""
    rest = re.sub(r"\bwhose\b.*$", "", rest)
    f, m = bool(FEM.search(rest)), bool(MASC.search(rest))
    return "F" if f and not m else "M" if m and not f else None


def split(title):
    mt = PERSON.match(title)
    if not mt:
        return None
    full = mt.group(1)
    first, sur = full.rsplit(" ", 1)
    return first, sur, title[len(full):]


def plan(_):
    GROUPS, by_sur, by_first = pools()
    sup, src = supply()
    cen = census()
    own = holders()
    people = {}  # n -> dict
    for tok, (n, t) in cen.items():
        sp = split(t)
        if not sp:
            continue
        first, sur, rest = sp
        if sur not in by_sur or first not in by_first:
            sys.exit("piece %d: %r is not from the pool, cannot place it in a group" % (n, t))
        g = by_sur[sur]
        gender = next((gd for gg, gd in by_first[first] if gg == g), None) or next(iter(by_first[first]))[1]
        # the role text outranks the old first name: "an appliance repair woman" called Reynaldo gets a woman's name
        said = role_gender(rest)
        people[n] = {"n": n, "tok": tok, "first": first, "sur": sur, "rest": rest, "group": g, "gender": said or gender,
                     "gender_fixed": bool(said and said != gender), "minted": tok <= sup, "holder": own.get(n, "")}
    used = {}  # surname -> set of first names in use
    for p in people.values():
        used.setdefault(p["sur"], set()).add(p["first"])
    clashes = {}
    for p in people.values():
        clashes.setdefault(p["first"] + " " + p["sur"], []).append(p)
    renames = []
    for full, ps in sorted(clashes.items()):
        if len(ps) < 2:
            continue
        ps.sort(key=lambda p: (not p["minted"], p["tok"] if p["minted"] else p["n"]))
        keep = ps[0]
        for p in ps[1:]:
            men, women, _ = GROUPS[p["group"]]
            cands = [x for x in (men if p["gender"] == "M" else women) if x not in used[p["sur"]]]
            if not cands:
                sys.exit("piece %d: every %s first name is already used with %s" % (p["n"], p["gender"], p["sur"]))
            random.Random(p["n"]).shuffle(cands)
            new = cands[0]
            used[p["sur"]].add(new)
            renames.append({"n": p["n"], "tok": p["tok"], "minted": p["minted"], "holder": p["holder"],
                            "old_first": p["first"], "new_first": new, "sur": p["sur"],
                            "old": p["first"] + " " + p["sur"] + p["rest"], "new": new + " " + p["sur"] + p["rest"],
                            "gender_fixed": p["gender_fixed"],
                            "keeps": {"n": keep["n"], "tok": keep["tok"], "minted": keep["minted"]}})
    # a first name whose gender the role contradicts gets fixed even when nobody else has the name
    done = {r["n"] for r in renames}
    for p in sorted(people.values(), key=lambda p: p["n"]):
        if p["n"] in done or not p["gender_fixed"]:
            continue
        men, women, _ = GROUPS[p["group"]]
        cands = [x for x in (men if p["gender"] == "M" else women) if x not in used[p["sur"]]]
        if not cands:
            sys.exit("piece %d: every %s first name is already used with %s" % (p["n"], p["gender"], p["sur"]))
        random.Random(p["n"]).shuffle(cands)
        new = cands[0]
        used[p["sur"]].add(new)
        renames.append({"n": p["n"], "tok": p["tok"], "minted": p["minted"], "holder": p["holder"],
                        "old_first": p["first"], "new_first": new, "sur": p["sur"],
                        "old": p["first"] + " " + p["sur"] + p["rest"], "new": new + " " + p["sur"] + p["rest"],
                        "gender_fixed": True, "keeps": None})
    renames.sort(key=lambda r: (not r["minted"], r["tok"] if r["minted"] else r["n"]))
    out = {"made": __import__("time").strftime("%Y-%m-%d %H:%M"), "supply": sup, "supply_source": src,
           "named_pieces": len(people), "distinct_before": len(clashes), "renames": renames}
    old = jload(PLAN)
    if old and old.get("applied"):
        os.replace(PLAN, PLAN.replace(".json", "_" + old["made"].replace(" ", "_").replace(":", "") + ".json"))
    jsave(PLAN, out)
    minted = [r for r in renames if r["minted"]]
    lines = ["# Unique names plan", "", "Supply %d (%s). %d named pieces, %d distinct names before, %d renames, %d of them on minted tokens."
             % (sup, src, len(people), len(clashes), len(renames), len(minted)), "",
             "## Minted tokens renamed (the lower token keeps the name)", "", "| token | piece | holder | was | becomes | keeps it |", "|---|---|---|---|---|---|"]
    for r in minted:
        k = "token %d #%d" % (r["keeps"]["tok"], r["keeps"]["n"]) if r["keeps"] else "no clash"
        lines.append("| %d | #%d | %s | %s | %s | %s%s |" % (r["tok"], r["n"], r["holder"], r["old"], r["new"], k,
                                                         " (gender fixed)" if r["gender_fixed"] else ""))
    gf = [r for r in renames if r["gender_fixed"]]
    lines += ["", "%d renames also correct a first name whose gender the role contradicted." % len(gf)]
    lines += ["", "## Unminted pieces renamed", "", "| token | piece | was | becomes |", "|---|---|---|---|"]
    for r in renames:
        if not r["minted"]:
            lines.append("| %d | #%d | %s | %s |" % (r["tok"], r["n"], r["old"], r["new"]))
    open(REPORT, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print("supply %d (%s); %d named pieces, %d distinct, %d renames (%d minted) -> %s, %s"
          % (sup, src, len(people), len(clashes), len(renames), len(minted), PLAN, REPORT))


def era_of(n):
    for e, d in ERAS.items():
        lo, hi = map(int, d.split("_")[1].split("-"))
        if lo <= n <= hi:
            return d
    sys.exit("piece %d is outside eras XVI to XIX" % n)


def swap(text, old, new):
    return re.sub(r"\b%s\b" % re.escape(old), new, text) if text else text


def apply(a):
    P = jload(PLAN)
    if not P:
        sys.exit("no plan. Run: unique_names.py plan")
    R = P["renames"]
    if a.revert:
        R = [dict(r, old=r["new"], new=r["old"], old_first=r["new_first"], new_first=r["old_first"]) for r in R]
    by_n = {r["n"]: r for r in R}
    by_tok = {r["tok"]: r for r in R}
    touched = {}

    def count(k, v=1):
        touched[k] = touched.get(k, 0) + v

    # eras: roster + bible
    for d in set(era_of(n) for n in by_n):
        rp = os.path.join(ROOT, d, "roster.json")
        rj = jload(rp)
        chars = rj.get("characters", rj if isinstance(rj, list) else [])
        for c in chars:
            r = by_n.get(int(c["num"]))
            if r and c.get("name") == r["old"]:
                c["name"] = r["new"]
                count(d + "/roster.json")
        jsave(rp, rj)
        bp = os.path.join(ROOT, d, "character_bible.json")
        bible = jload(bp, [])
        for c in bible:
            r = by_n.get(int(c["num"]))
            if r:
                if c.get("title") == r["old"]:
                    c["title"] = r["new"]
                    count(d + "/character_bible.json title")
                if c.get("handle") == r["old_first"] + " " + r["sur"]:
                    c["handle"] = r["new_first"] + " " + r["sur"]
                    count(d + "/character_bible.json handle")
        jsave(bp, bible)
    # stories
    for sp in sorted(glob.glob(os.path.join(HERE, "stories", "stories_v4_*.json"))):
        st = jload(sp)
        dirty = False
        for n, r in by_n.items():
            k = str(n)
            if k in st and isinstance(st[k], str):
                new = swap(st[k], r["old_first"], r["new_first"])
                if new != st[k]:
                    st[k] = new
                    dirty = True
                    count("stories")
        if dirty:
            jsave(sp, st)
    # census_traits snapshot
    tp = os.path.join(HERE, "collectors", "census_traits.json")
    tr = jload(tp)
    for tok, r in by_tok.items():
        if tr[str(tok)]["t"] == r["old"]:
            tr[str(tok)]["t"] = r["new"]
            count("census_traits.json")
    with open(tp + ".tmp", "w", encoding="utf-8") as f:
        json.dump(tr, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tp + ".tmp", tp)
    # kit metadata
    for tok, r in by_tok.items():
        mp = os.path.join(KIT, "metadata", "%d.json" % tok)
        m = jload(mp)
        if not m:
            sys.exit("no metadata for token %d" % tok)
        want = "%s #%d" % (r["new"], r["n"])
        if m["name"] == "%s #%d" % (r["old"], r["n"]):
            m["name"] = want
            count("metadata name")
        d = m["description"]
        i = d.find(TAIL)
        head, tail = (d, "") if i < 0 else (d[:i], d[i:])
        nh = swap(head, r["old_first"], r["new_first"])
        if nh != head:
            m["description"] = nh + tail
            count("metadata description")
        jsave(mp, m)
    # kit csv maps
    for fn in ("TOKEN_MAP.csv", "MANIFEST.csv"):
        p = os.path.join(KIT, fn)
        rows = list(csv.DictReader(open(p, encoding="utf-8")))
        for row in rows:
            r = by_tok.get(int(row["token_id"]))
            if r and row["name"] == "%s #%d" % (r["old"], r["n"]):
                row["name"] = "%s #%d" % (r["new"], r["n"])
                count(fn)
        with open(p + ".tmp", "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=rows[0].keys())
            w.writeheader()
            w.writerows(rows)
        os.replace(p + ".tmp", p)
    # states.json (viewer titles)
    sp = os.path.join(KIT, "_build", "states.json")
    S = jload(sp)
    for tok, r in by_tok.items():
        s = S.get(str(tok))
        if s and s.get("name") == "%s #%d" % (r["old"], r["n"]):
            s["name"] = "%s #%d" % (r["new"], r["n"])
            count("states.json")
    jsave(sp, S)
    # THE MARKS 150 (cut pieces)
    if os.path.exists(MARKS):
        rows = list(csv.DictReader(open(MARKS, encoding="utf-8")))
        hit = 0
        for row in rows:
            r = by_n.get(int(row["census_number"]))
            if r and row["name"].startswith(r["old"]):
                row["name"] = r["new"] + row["name"][len(r["old"]):]
                hit += 1
        if hit:
            with open(MARKS + ".tmp", "w", encoding="utf-8", newline="") as f:
                w = csv.DictWriter(f, fieldnames=rows[0].keys())
                w.writeheader()
                w.writerows(rows)
            os.replace(MARKS + ".tmp", MARKS)
            count("MARKS_150.csv", hit)
    for k in sorted(touched):
        print("%6d  %s" % (touched[k], k))
    P["applied"] = not a.revert
    jsave(PLAN, P)
    print("%s %d renames" % ("reverted" if a.revert else "applied", len(R)))


def check(_):
    """Names in the site data and in the kit metadata. Exit 1 on a repeat."""
    bad = []
    tr = jload(os.path.join(HERE, "collectors", "census_traits.json"), {})
    seen = {}
    for tok, v in tr.items():
        sp = split(v["t"])
        if not sp:
            continue
        full = sp[0] + " " + sp[1]
        if full in seen:
            bad.append("census_traits: %s on #%d and #%d" % (full, seen[full], v["n"]))
        seen[full] = v["n"]
    md = os.path.join(KIT, "metadata")
    seen = {}
    if os.path.isdir(md):
        for f in os.listdir(md):
            if not f.endswith(".json"):
                continue
            m = jload(os.path.join(md, f), {})
            sp = split(m.get("name", "").rsplit(" #", 1)[0])
            if not sp:
                continue
            full = sp[0] + " " + sp[1]
            if full in seen:
                bad.append("metadata: %s on %s and %s" % (full, seen[full], f))
            seen[full] = f
    for b in bad[:20]:
        print(" !", b)
    print("%d repeated names" % len(bad) if bad else "every New Yorker has a name of their own")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "apply", "check"])
    ap.add_argument("--revert", action="store_true", help="apply the plan backwards")
    a = ap.parse_args()
    {"plan": plan, "apply": apply, "check": check}[a.cmd](a)
