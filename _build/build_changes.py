#!/usr/bin/env python3
"""api/changes.json: what is new on the site and when it arrived, for "since your last visit".

MLow 2026-10-06 (collector alerts): collectors.html and my.html tell a returning visitor which rooms opened
and which honorees were painted since they last looked, read from this file by NY.since() in site.js.

When something arrived is read from git: the first commit of _build/rooms.json that carries a room id, and
the first commit of _build/honoraries/honoraries.json that carries an honoree id. Commit dates are New York
dates. The answer is cached in _build/changes_seen.json, so later builds only read the new commits, and
anything that is in the data but not yet committed is dated today."""
import json, os, subprocess, datetime

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "changes_seen.json")
TODAY = datetime.date.today().isoformat()
SOURCES = {
    "rooms": ("_build/rooms.json", lambda d: [r["id"] for r in d]),
    "honorees": ("_build/honoraries/honoraries.json", lambda d: [p["id"] for p in d["people"]]),
}


def git(*a):
    return subprocess.run(["git", *a], cwd=SITE, capture_output=True, text=True, check=True).stdout


seen = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
for kind, (path, ids_of) in SOURCES.items():
    s = seen.setdefault(kind, {"commit": None, "first": {}})
    rng = [f'{s["commit"]}..HEAD'] if s["commit"] else []
    log = [l.split() for l in git("log", "--reverse", "--format=%H %cs", *rng, "--", path).splitlines() if l.strip()]
    for h, day in log:
        try: ids = ids_of(json.loads(git("show", f"{h}:{path}")))
        except Exception: continue  # a commit where the file did not parse: skip it, the next one carries the ids
        for i in ids: s["first"].setdefault(i, day)
        s["commit"] = h
json.dump(seen, open(CACHE, "w"), indent=0, sort_keys=True)

rooms = json.load(open(os.path.join(HERE, "rooms.json")))
people = json.load(open(os.path.join(HERE, "honoraries", "honoraries.json")))["people"]
out = {
    "built": TODAY,
    "rooms": sorted(({"id": r["id"], "name": r["name"], "index": r["index"],
                      "added": seen["rooms"]["first"].get(r["id"], TODAY)} for r in rooms), key=lambda x: (x["added"], x["index"])),
    "honorees": sorted(({"id": p["id"], "name": p["name"], "added": seen["honorees"]["first"].get(p["id"], TODAY)} for p in people),
                       key=lambda x: x["added"]),
}
os.makedirs(os.path.join(SITE, "api"), exist_ok=True)
json.dump(out, open(os.path.join(SITE, "api", "changes.json"), "w"), ensure_ascii=False, separators=(",", ":"))
last = lambda k: out[k][-1]["added"] if out[k] else "none"
print(f"changes.json: {len(out['rooms'])} rooms (newest {last('rooms')}), {len(out['honorees'])} honorees (newest {last('honorees')})")
