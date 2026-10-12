#!/usr/bin/env python3
"""HONOREE ROLL CALL: every honorary New Yorker with an X handle hears that their face is on the wall in room 183.

Reads _build/honoraries/honoraries.json (the people, handles, categories), cards.json (one share card per
honoree under assets/cards/) and collectors/honor_links.json (which honorees hold pieces). Builds waves of
forty a day in a fixed order: collectors who hold pieces first (most pieces first), then the artists, then
everyone else by category, each group sorted by id so a rebuild never reshuffles a wave. Skipped: anyone
without an X handle, anyone in honoraries/banned.json, anyone named in post/holds.txt.

Each post:

    @handle your face is on the wall in room 183.
    Portrait by MLow, hung in the Hall of Fame.

    n3wyorkers.com/h/<id>

with the honoree's card attached. X hides a post that STARTS with @handle from the home timeline of anyone who
does not follow both accounts; --name-first writes "Your face is on the wall in room 183, @handle." instead,
which reaches everyone. MLow's call; the default is the brief's wording.

The whole plan is written to post/rollcall_plan.json first, so it can be read before anything fires.

    python3 rollcall.py                 rebuild the plan, dry run the next unfired day into outbox/
    python3 rollcall.py --day 3         dry run day three
    python3 rollcall.py --plan-only     write the plan and stop
    python3 rollcall.py --day 3 --post  post day three, ninety seconds between posts, and mark it fired
    python3 rollcall.py --post          post the next unfired day (what the 10:00 launchd job runs once armed)"""
import os, sys, json, re, argparse, time
from common import HERE, BUILD, SITE, link, no_dash, load_state, save_state, now_ny
from x import X

HON = os.path.join(BUILD, "honoraries")
PLAN = os.path.join(HERE, "rollcall_plan.json")
HOLDS = os.path.join(HERE, "holds.txt")
WAVE = 40
GAP = 90


def norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def read_holds():
    out = set()
    if not os.path.exists(HOLDS): return out
    for line in open(HOLDS, encoding="utf-8"):
        line = line.split("#", 1)[0].strip()
        if line: out.add(norm(line))
    return out


def held(p, holds):
    keys = {norm(p["id"]), norm(p.get("name")), norm(p.get("x")), norm(p.get("handle"))}
    return bool(keys & holds)


def banned(p, ban):
    return norm(p.get("x")) in ban or norm(p.get("name")) in ban


def text_for(p, name_first):
    x = p["x"].lstrip("@")
    s1 = f"Your face is on the wall in room 183, @{x}." if name_first else f"@{x} your face is on the wall in room 183."
    return no_dash("\n".join([s1, "Portrait by MLow, hung in the Hall of Fame.", "", link(f"h/{p['id']}")]))


def build_plan(name_first):
    H = json.load(open(os.path.join(HON, "honoraries.json"), encoding="utf-8"))
    cards = json.load(open(os.path.join(HON, "cards.json"), encoding="utf-8"))
    links = json.load(open(os.path.join(BUILD, "collectors", "honor_links.json"), encoding="utf-8"))
    ban = {norm(b["handle"]) for b in json.load(open(os.path.join(HON, "banned.json")))["people"]} | \
          {norm(b["name"]) for b in json.load(open(os.path.join(HON, "banned.json")))["people"]}
    holds = read_holds()
    cat_order = {c["code"]: i for i, c in enumerate(H["cats"])}

    skipped = {"no_handle": [], "held": [], "banned": [], "no_card": []}
    ok = []
    for p in H["people"]:
        if not p.get("x"): skipped["no_handle"].append(p["id"]); continue
        if banned(p, ban): skipped["banned"].append(p["id"]); continue
        if held(p, holds): skipped["held"].append(p["id"]); continue
        c = cards.get(p["id"])
        if not c or not os.path.exists(os.path.join(SITE, "assets", "cards", c["card"])): skipped["no_card"].append(p["id"]); continue
        ok.append(p)

    holders = sorted([p for p in ok if p["id"] in links], key=lambda p: (-(links[p["id"]].get("n") or 0), p["id"]))
    hid = {p["id"] for p in holders}
    artists = sorted([p for p in ok if p["cat"] == "A" and p["id"] not in hid], key=lambda p: p["id"])
    aid = hid | {p["id"] for p in artists}
    rest = sorted([p for p in ok if p["id"] not in aid], key=lambda p: (cat_order.get(p["cat"], 99), p["id"]))
    order = holders + artists + rest

    waves = []
    for i in range(0, len(order), WAVE):
        posts = []
        for p in order[i:i + WAVE]:
            posts.append({"handle": "@" + p["x"].lstrip("@"), "id": p["id"], "name": p["name"], "cat": p["cat"],
                          "holder": p["id"] in links, "text": text_for(p, name_first),
                          "image": "assets/cards/" + cards[p["id"]]["card"], "link": "https://" + link(f"h/{p['id']}")})
        waves.append({"day": len(waves) + 1, "posts": posts})
    plan = {"generated": now_ny().isoformat(timespec="seconds"), "wave_size": WAVE, "gap_seconds": GAP, "people": len(order),
            "days": len(waves), "order": "holders by pieces held, then artists, then the rest by category; each group by id",
            "style": "name-first" if name_first else "handle-first",
            "skipped": {k: {"count": len(v), "ids": v} for k, v in skipped.items()}, "waves": waves}
    json.dump(plan, open(PLAN, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    return plan


def main(argv):
    ap = argparse.ArgumentParser(description="Honoree roll call from @n3wyorkers. Dry run unless --post.")
    ap.add_argument("--day", type=int, help="which wave; default the next unfired one")
    ap.add_argument("--plan-only", action="store_true", help="write rollcall_plan.json and stop")
    ap.add_argument("--name-first", action="store_true", help="put the @handle at the end of the first sentence")
    ap.add_argument("--post", action="store_true")
    a = ap.parse_args(argv)

    plan = build_plan(a.name_first)
    sk = plan["skipped"]
    print(f"plan: {plan['people']} honorees with a handle and a card, {plan['days']} days of {WAVE}; skipped "
          f"{sk['no_handle']['count']} without a handle, {sk['held']['count']} held, {sk['banned']['count']} banned, {sk['no_card']['count']} without a card. Written to {os.path.relpath(PLAN, SITE)}")
    if a.plan_only: return

    st = load_state(); rs = st.setdefault("rollcall", {}); fired = rs.setdefault("fired", {})
    day = a.day or next((w["day"] for w in plan["waves"] if str(w["day"]) not in fired), None)
    if day is None: print("every wave has fired"); return
    wave = next((w for w in plan["waves"] if w["day"] == day), None)
    if not wave: raise SystemExit(f"no day {day}; the plan has {plan['days']}")
    if a.post and str(day) in fired: raise SystemExit(f"day {day} already fired on {fired[str(day)]['at']}; pick another --day")

    x = X(dry_run=not a.post, tag="rollcall")
    recs = []
    for i, p in enumerate(wave["posts"]):
        recs.append(x.post(p["text"], [os.path.join(SITE, p["image"])]))
        if a.post and i < len(wave["posts"]) - 1: time.sleep(GAP)
    if a.post:
        fired[str(day)] = {"at": now_ny().isoformat(timespec="seconds"), "count": len(recs), "ids": [r.get("id") for r in recs]}
        save_state(st)
    print(f"day {day}: {len(recs)} posts " + ("posted" if a.post else "dry run, in outbox/"))
    print("  first: " + recs[0]["text"].replace("\n", "\n  ") + f"\n  image: {wave['posts'][0]['image']}")


if __name__ == "__main__":
    main(sys.argv[1:])
