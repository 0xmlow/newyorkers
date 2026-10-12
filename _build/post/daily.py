#!/usr/bin/env python3
"""NEW YORKER OF THE DAY, posted from @n3wyorkers at eight in the morning New York time.

Reads api/daily.json, the year ahead that _build/build_daily.py writes, and picks the entry for today's New York
date exactly the way the home page does (Intl en-CA date in America/New_York, matched on the "d" field), so the
post and the site always show the same New Yorker. Two sentences: who it is, then the first sentence of the
story. The painting is attached and the link is the piece's own page.

    python3 daily.py                dry run for today, writes outbox/<timestamp>-daily.json
    python3 daily.py --date 2026-10-09   compose another day's entry
    python3 daily.py --post         post it. Idempotent: a day that was posted is never posted again
    python3 daily.py --post --force post again anyway"""
import os, sys, json, argparse
from common import SITE, link, ny_day, no_dash, first_sentence, pieces_by_id, load_state, save_state, now_ny
from x import X


def entry_for(day):
    j = json.load(open(os.path.join(SITE, "api", "daily.json"), encoding="utf-8"))
    return next((d for d in j["days"] if d["d"] == day), None)


def compose(d):
    p = pieces_by_id().get(str(d["id"])) or {}
    place = d.get("b") or ""
    where = f", from {place}" if place and place.lower() != "citywide" else ""
    s1 = f"The New Yorker of the day is {d['t']}, No. {d['n']}{where}."
    story = first_sentence(p.get("story") or d.get("s") or "")
    if len(story) > 230: story = d.get("s") or story      # daily.json already carries a word boundary clip
    text = "\n".join([s1, story, "", link(f"n/{d['id']}")])
    img = os.path.join(SITE, d["img"])
    return no_dash(text), (img if os.path.exists(img) else None)


def main(argv):
    ap = argparse.ArgumentParser(description="Post the New Yorker of the day. Dry run unless --post.")
    ap.add_argument("--date", help="YYYY-MM-DD New York date, default today")
    ap.add_argument("--post", action="store_true"); ap.add_argument("--force", action="store_true")
    a = ap.parse_args(argv)
    day = a.date or ny_day()
    st = load_state(); ds = st.setdefault("daily", {})
    if a.post and day in ds and not a.force:
        print(f"{day}: already posted ({ds[day].get('url') or ds[day].get('outbox')}), nothing to do"); return
    d = entry_for(day)
    if not d: raise SystemExit(f"{day} is outside api/daily.json; run _build/build_daily.py")
    text, img = compose(d)
    rec = X(dry_run=not a.post, tag="daily").post(text, [img] if img else [])
    if a.post:
        ds[day] = {"id": d["id"], "at": now_ny().isoformat(timespec="seconds"), "url": rec.get("url"), "outbox": rec["outbox"]}
        save_state(st)
    print(("posted " if a.post else "dry run ") + rec["outbox"])
    print("  " + text.replace("\n", "\n  "))


if __name__ == "__main__":
    main(sys.argv[1:])
