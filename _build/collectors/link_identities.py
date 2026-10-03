#!/usr/bin/env python3
"""Who each collecting wallet is: its X handle, and its honorary portrait if MLow has painted them.

Before this, a wallet reached its honoree only when it had set an X handle on its own ENS name, which
six of 137 holders had done, so the collectors board knew four honorees and missed about thirty.
This lines every holder up against every place the answer can come from, strongest first:

  1. homes.json             MLow's own word, by wallet: "x" and "honoree"
  2. 00_TOOLS/xhandles.py   the handles MLow checked by hand on 2026-09-29
  3. ENS com.twitter        set by the name's owner (chain.json "twitter", from fetch_chain.py)
  4. the collector CRM      SuperRare profile socials, newest COLLECTOR CRM folder
  5. OpenSea profile        opensea_profiles.json, snapshotted in the browser

then finds the honoree by that handle, or by an ENS name or username that is the honoree's own.
Wallets that share an honoree or a handle are one person, so a collector with a vault counts once.

Writes collectors/identity.json (read by build_collectors.py) and collectors/IDENTITY_REVIEW.md,
the list for MLow: who holds enough for an honorary and has none, which wallets are still anonymous,
and where two sources disagree. Nothing is fetched here. Run fetch_chain.py first to refresh holders.
"""
import json, os, re, csv, glob, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__)); BUILD = os.path.dirname(HERE)
SITE = os.path.dirname(BUILD); ROOT = os.path.dirname(SITE)
sys.path.insert(0, os.path.join(ROOT, "00_TOOLS"))
try:
    import xhandles
except ImportError:
    xhandles = None
ZERO = "0x" + "0" * 40
HONORARY_AT = 6   # "more than five", MLow 2026-10-03


def key(s):
    """loose key: lowercase letters and digits, .eth and a trailing vault dropped"""
    s = (s or "").lower().strip().lstrip("@")
    s = re.sub(r"\.eth$", "", s)
    s = re.sub(r"[-_.]?vault$", "", s)
    return re.sub(r"[^a-z0-9]", "", s)


CH = json.load(open(os.path.join(HERE, "chain.json")))
ENS = CH.get("ens", {})
HOMES = {k.lower(): v for k, v in json.load(open(os.path.join(HERE, "homes.json"))).items() if k.startswith("0x")}
OS_ = {k.lower(): v for k, v in json.load(open(os.path.join(HERE, "opensea_profiles.json"))).items() if k.startswith("0x")}
crm_dirs = sorted(glob.glob(os.path.join(ROOT, "COLLECTOR CRM *")))
CRM = {}
if crm_dirs:
    for r in csv.DictReader(open(os.path.join(crm_dirs[-1], "collector_crm.csv"))):
        CRM[r["address"].lower()] = r
HON = json.load(open(os.path.join(BUILD, "honoraries", "honoraries.json")))["people"]
BANNED = {key(b.get("x") or b.get("handle") or "") for b in json.load(open(os.path.join(BUILD, "honoraries", "banned.json"))).get("people", [])} - {""} \
    if os.path.exists(os.path.join(BUILD, "honoraries", "banned.json")) else set()

# holdings, from the transfer log
own = {}
for lg in sorted(CH["logs"], key=lambda l: (l["b"], l.get("i", 0))):
    own[(lg["c"], lg["id"])] = lg["to"]
held = collections.Counter(a for a in own.values() if a != ZERO)

# honoree indexes: by X handle, and by every other name that is unmistakably theirs
by_x = collections.defaultdict(list); by_name = collections.defaultdict(list)
for p in HON:
    if p.get("x"): by_x[key(p["x"])].append(p)
    for n in {p["id"], p["name"], p.get("handle", "")}:
        if n and not n.startswith("@"): by_name[key(n)].append(p)


def pick(cands, wallet_names):
    """two honorees can share a handle (Justin Aversano and twinflames, his collector account):
    take the one whose own name is this wallet's name"""
    if len(cands) == 1: return cands[0]
    for p in cands:
        if {key(p["name"]), key(p["id"]), key(p.get("handle", ""))} & wallet_names: return p
    return cands[0]


out, conflicts = {}, []
for a in sorted(held):
    h, crm, os_ = HOMES.get(a, {}), CRM.get(a, {}), OS_.get(a, {})
    ens = ENS.get(a) or h.get("name", "")
    names = {key(ens), key(crm.get("username")), key(os_.get("user"))} - {""}
    srcs = []   # (handle, source), strongest first
    if h.get("x"): srcs.append((h["x"], "MLow"))
    if xhandles and ens:
        ruled, hd = xhandles.ruling("", ens)
        if ruled: srcs.append((hd, "MLow"))
    if CH.get("twitter", {}).get(a): srcs.append((CH["twitter"][a], "ENS record"))
    if crm.get("x_handle"): srcs.append((crm["x_handle"], "artist verified" if crm.get("x_source") == "artist verified" else "SuperRare profile"))
    if os_.get("x"): srcs.append((os_["x"], "OpenSea profile"))
    srcs = [(hd.lstrip("@"), s) for hd, s in srcs]
    x, xsrc = (srcs[0] if srcs else ("", ""))
    seen = {key(hd) for hd, _ in srcs if hd}
    if len(seen) > 1:
        conflicts.append((a, ens, srcs))
    # the honoree
    p, why = None, ""
    if h.get("honoree"):
        p = next((q for q in HON if q["id"] == h["honoree"]), None); why = "MLow"
    if not p:
        for hd, s in srcs:
            if hd and key(hd) in by_x: p, why = pick(by_x[key(hd)], names), f"X handle (@{hd}, {s})"; break
    if not p:
        for n in names:
            if n in by_x: p, why = pick(by_x[n], names), "wallet name is their X handle"; break
            if n in by_name: p, why = pick(by_name[n], names), "wallet name is theirs"; break
    if p and p.get("x") and key(p["x"]) != key(x):
        if x: conflicts.append((a, ens, [(p["x"], "honoraries page")] + srcs))
        x, xsrc = p["x"], "honoraries page"   # MLow checked every honoree handle by hand on 2026-09-29
    if x and key(x) in BANNED: x, xsrc = "", ""
    out[a] = {"ens": ens, "user": crm.get("username") or os_.get("user", ""), "x": x, "x_src": xsrc,
              "honoree": p["id"] if p else "", "why": why, "n": held[a]}

# one person, many wallets: join by honoree, then by handle
parent = {a: a for a in out}
def find(a):
    while parent[a] != a: parent[a] = parent[parent[a]]; a = parent[a]
    return a
for field in ("honoree", "x"):
    first = {}
    for a, v in out.items():
        k = v[field] if field == "honoree" else key(v["x"])
        if not k: continue
        if k in first: parent[find(a)] = find(first[k])
        else: first[k] = a
people = collections.defaultdict(list)
for a in out: people[find(a)].append(a)
for root, ws in people.items():
    ws.sort(key=lambda w: -out[w]["n"])
    tot = sum(out[w]["n"] for w in ws)
    hon = next((out[w]["honoree"] for w in ws if out[w]["honoree"]), "")
    x = next((out[w]["x"] for w in ws if out[w]["x"]), "")
    for w in ws:
        out[w].update({"person": ws[0], "wallets": ws if len(ws) > 1 else [], "person_n": tot})
        if hon and not out[w]["honoree"]: out[w]["honoree"], out[w]["why"] = hon, "same person as " + (out[ws[0]]["ens"] or ws[0][:10])
        if x and not out[w]["x"]: out[w]["x"], out[w]["x_src"] = x, "same person"

json.dump({"_note": "Written by link_identities.py. Edit homes.json or the sources it lists, never this file.", "wallets": out},
          open(os.path.join(HERE, "identity.json"), "w"), ensure_ascii=False, indent=1)

# ---------- the review list for MLow ----------
TEAM = {"0xa8357ee17cb3ff5a6b9694ddc8fde0ed2ce9d788", "0xcc235a9a16fa6cf3fe749a3752af3b4b4aed9d5d"}
heads = sorted({v["person"] for v in out.values()}, key=lambda w: -out[w]["person_n"])
def label(w):
    v = out[w]; return v["ens"] or v["user"] or w
L = ["# Who the collectors are", "",
     f"Written by `link_identities.py` from {len(out)} holding wallets. {sum(1 for v in out.values() if v['x'])} have an X handle, "
     f"{sum(1 for v in out.values() if v['honoree'])} are linked to an honorary. Edit `homes.json` to rule on any of these, then rerun.", "",
     f"## Hold {HONORARY_AT} or more, no honorary yet", "",
     "| Pieces | Wallet | X | Where the handle came from |", "|---|---|---|---|"]
need = [w for w in heads if out[w]["person_n"] >= HONORARY_AT and not out[w]["honoree"] and w not in TEAM]
for w in need:
    v = out[w]; L.append(f"| {v['person_n']} | {label(w)} `{w}` | {'@' + v['x'] if v['x'] else 'none found'} | {v['x_src'] or ''} |")
L += ["", f"## Hold {HONORARY_AT} or more, already honoraries", "", "| Pieces | Wallet | Honoree | How we know |", "|---|---|---|---|"]
for w in heads:
    v = out[w]
    if v["person_n"] >= HONORARY_AT and v["honoree"]:
        L.append(f"| {v['person_n']} | {', '.join(label(x) for x in (v['wallets'] or [w]))} | {v['honoree']} | {v['why']} |")
L += ["", "## One person, several wallets", ""]
for w in heads:
    if out[w]["wallets"]: L.append(f"- {', '.join(f'{label(x)} ({out[x][chr(110)]})' for x in out[w]['wallets'])}")
L += ["", "## Sources disagree on the handle", "", "The first one wins. Put the right one in homes.json as \"x\" to overrule.", ""]
for a, ens, srcs in conflicts:
    L.append(f"- {ens or a}: " + ", ".join(f"@{hd} ({s})" for hd, s in srcs))
L += ["", "## Every holder", "", "| Pieces | Wallet | X | Source | Honoree |", "|---|---|---|---|---|"]
for w in sorted(out, key=lambda w: -out[w]["n"]):
    v = out[w]; L.append(f"| {v['n']} | {label(w)} | {'@' + v['x'] if v['x'] else ''} | {v['x_src']} | {v['honoree']} |")
open(os.path.join(HERE, "IDENTITY_REVIEW.md"), "w").write("\n".join(L) + "\n")
print(f"identity.json: {len(out)} wallets, {len(heads)} people, {sum(1 for v in out.values() if v['x'])} with X, "
      f"{sum(1 for v in out.values() if v['honoree'])} linked to an honoree; {len(need)} people hold {HONORARY_AT}+ with no honorary; "
      f"{len(conflicts)} handle conflicts")
