#!/usr/bin/env python3
"""api/daily.json: the New Yorker of the day, a year ahead, for the home page.

MLow 2026-10-06 (retention): one New Yorker a day gives a reason to come back tomorrow. The home page reads
this file and shows the entry for today's New York date, so it turns over at midnight without a rebuild.

The order is a seeded shuffle and the start date is fixed, so a rebuild never changes a day that has already
been shown. Drawn from eras II onward (Era I paints real public figures), pieces with a written story and a
landscape painting. A piece that has since left the census is skipped on the day, not replaced."""
import json, os, random, datetime

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
START, DAYS, SEED = datetime.date(2026, 10, 6), 400, "new-yorker-of-the-day-2026"
d = open(os.path.join(SITE, "assets", "data.js")).read()
D = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
pool = [p for p in D["pieces"] if (p.get("e") or 0) >= 2 and len(p.get("story") or "") > 80 and p.get("st") and 1.6 < (p.get("ar") or 0) < 1.9]
pool.sort(key=lambda p: int(p["id"]) if str(p["id"]).isdigit() else 10**9)
random.Random(SEED).shuffle(pool)


def clip(s, n=240):
    s = " ".join(s.split())
    return s if len(s) <= n else s[:s.rfind(" ", 0, n)].rstrip(",;:") + "…"


days = []
for i in range(DAYS):
    p = pool[i % len(pool)]
    days.append({"d": (START + datetime.timedelta(days=i)).isoformat(), "id": p["id"], "n": p.get("n"), "t": p["t"],
                 "s": clip(p["story"]), "img": f"assets/t/{p['st'][0]}.jpg", "b": p.get("nb") or p.get("b") or ""})
json.dump({"start": START.isoformat(), "days": days}, open(os.path.join(SITE, "api", "daily.json"), "w"), ensure_ascii=False, separators=(",", ":"))
today = datetime.date.today().isoformat()
t = next((x for x in days if x["d"] == today), None)
print(f"daily.json: {DAYS} days from {START}, pool {len(pool)}, today {t['t'] if t else 'outside the range'}")
