#!/usr/bin/env python3
"""FILMS: one finished film a day from @n3wyorkers, from the folders the memory notes name.

Looks only inside the exact folders listed in FOLDERS (plus their masters/, cuts/ or V2/ where the note says the
films live). No search, no walk. For each family of cuts it keeps one file: the X encode when there is one,
else the 16x9, else the master; vertical and square cuts are left for Instagram. Writes post/films_queue.json,
one film a day, newest folder first, with the file, its size, its duration when ffmpeg can read it, a caption
and the link. Captions come from a CAPTIONS.md beside the film when there is one (the first fenced block, the
pick), else a plain two sentence line per folder.

Posting video needs the chunked upload in x.py (INIT, APPEND, FINALIZE, STATUS), which is implemented, so
--post sends the next film in the queue. A film over 512 MB is marked "manual": post its X cut instead, or
re-encode. A film over 140 s is noted: a standard X account cannot post it, X Premium can.

    python3 films.py              rebuild the queue, dry run the next film into outbox/
    python3 films.py --day 3      dry run the third film
    python3 films.py --queue-only
    python3 films.py --post       post the next film not yet posted"""
import os, sys, re, json, argparse, subprocess
from common import HERE, ROOT, link, no_dash, load_state, save_state, now_ny
from x import X

QUEUE = os.path.join(HERE, "films_queue.json")
FF = "/Users/degens/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"
X_CAP = 512 * 1024 * 1024
X_SECONDS = 140

# (folder under the project root, subfolders to list, link path, the second sentence of the fallback caption)
FOLDERS = [
    ("HYPE FILM EVERYTHING 2026-10-06", ["", "V2"], "", "Everything built for the census in one film: the plates, the states, the museum, the atlas, the honoraries and the arcade."),
    ("HONORARIES HYPE FILM 2026-10-05", [""], "museum", "Every honorary New Yorker now hangs in one hall, room 183, and the walk is free."),
    ("HYPE VIDEO GLASS HOUSE 2026-10-03", [""], "museum", "The Crystal Palace of 1853 rebuilt as a gallery, and Otis cuts the rope at the top."),
    ("HYPE FILM ALIVE 2026-10-03", [""], "census", "Every New Yorker now has more than one state: painted, moshed, looped, dithered and in motion."),
    ("DREAMINA HYPE FILM 2026-10-01", [""], "", "Two hundred and thirty glitch loops of New York in eighty seconds."),
    ("ZERO 10 JOB 2026-10-01/SHITCORN FILM", [""], "honoraries", "The honorees pull a banana heist at Zero 10 in Miami and nobody gets caught."),
    ("REVEAL HYPE FILM 2026-09-30", [""], "collectors", "The census revealed collector by collector, what is on chain and what is still to come."),
    ("HONORARIES HYPE FILM 2026-09-26", [""], "honoraries", "Every honorary New Yorker by name and handle, every portrait by MLow."),
    ("SHOWREEL FILMS 2026-09-25", [""], "", "Ninety seconds of the painted census with a score built from real instruments."),
    ("HYPE VIDEOS 2026-09-24 HOUSES OF PRAYER", ["masters", "cuts"], "museum", "Eight synagogues and the Ohel, walked in one take."),
    ("HYPE VIDEO WEITSMAN YARD 2026-09-24", [""], "museum", "Room 152, the yard in Owego, eighty four seconds of scrap and paint."),
    ("HYPE VIDEOS 2026-09-23", ["masters", "cuts"], "museum", "Twenty new rooms in THE MUSEUM, from the City Hall rotunda to the rink."),
    ("HYPE VIDEOS 2026-09-08", ["masters", "cuts"], "museum", "Fifteen seconds inside THE MUSEUM, every wall hung with New Yorkers."),
]
DROP = re.compile(r"\b(16x9|9x16|1x1|sq|x|ig|youtube|master|for x|1080p|cuts|v1|\d{4}-\d{2}-\d{2})\b", re.I)


def family(name):
    s = os.path.splitext(name)[0].lower().replace("(", " ").replace(")", " ").replace("_", " ")
    return " ".join(DROP.sub(" ", s).split())


def score(name):
    s = os.path.splitext(name)[0].lower().replace("(", " ").replace(")", " ").replace("_", " ")
    toks = set(s.split())
    if "9x16" in toks or "1x1" in toks or "sq" in toks: return -1
    return (3 if "x" in toks else 0) + (2 if "16x9" in toks else 0) + (1 if "v1" not in toks else 0) + (0 if "master" in toks else 1)


def duration(path):
    if not os.path.exists(FF): return None
    r = subprocess.run([FF, "-i", path], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+)\.(\d+)", r.stderr)
    return round(int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) + int(m[4]) / 100, 1) if m else None


def captions_md(folder):
    p = os.path.join(folder, "CAPTIONS.md")
    if not os.path.exists(p): return None
    m = re.search(r"```\n(.*?)\n```", open(p, encoding="utf-8").read(), re.S)
    return m.group(1).strip() if m else None


def title_of(name):
    t = os.path.splitext(name)[0].replace("_", " ")
    t = re.sub(r"\s*\((?:for )?X(?: IG)?\)\s*|\s+(16x9|9x16|1x1)\b.*$|\s+master$", "", t, flags=re.I).strip()
    return t.upper()


def build_queue():
    films = []
    for rel, subs, path, second in FOLDERS:
        base = os.path.join(ROOT, rel)
        if not os.path.isdir(base): continue
        cands = []
        for sub in subs:
            d = os.path.join(base, sub)
            if not os.path.isdir(d): continue
            for f in sorted(os.listdir(d)):
                if f.lower().endswith(".mp4") and not f.startswith("."): cands.append((d, f))
        best = {}
        for d, f in cands:
            k = (d if "V2" in d else base, family(f))
            if k not in best or score(f) > score(best[k][1]): best[k] = (d, f)
        for (d, _), (dd, f) in sorted(best.items(), key=lambda kv: kv[1][1]):
            full = os.path.join(dd, f); size = os.path.getsize(full); dur = duration(full)
            cap = captions_md(dd) or captions_md(base)
            caption = cap if cap else no_dash(f"{title_of(f)}. {second}")
            notes = []
            status = "ready"
            if size > X_CAP: status = "manual"; notes.append(f"{size // 2**20} MB is over the 512 MB X cap; post the X cut or re-encode")
            if dur and dur > X_SECONDS: notes.append(f"{dur:.0f} s is over 140 s; needs X Premium")
            films.append({"folder": rel, "file": full, "size_mb": round(size / 2**20, 1), "duration_s": dur,
                          "caption": caption, "caption_source": "CAPTIONS.md" if cap else "fallback",
                          "link": "https://" + link(path), "status": status, "notes": notes})
    for i, f in enumerate(films): f["day"] = i + 1
    q = {"generated": now_ny().isoformat(timespec="seconds"), "films": len(films), "folders_listed": [f[0] for f in FOLDERS], "queue": films}
    json.dump(q, open(QUEUE, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    return q


def main(argv):
    ap = argparse.ArgumentParser(description="Queue and post the films. Dry run unless --post.")
    ap.add_argument("--day", type=int); ap.add_argument("--queue-only", action="store_true"); ap.add_argument("--post", action="store_true")
    a = ap.parse_args(argv)
    q = build_queue()
    manual = sum(1 for f in q["queue"] if f["status"] == "manual")
    print(f"queue: {q['films']} films from {len(q['folders_listed'])} folders, {manual} marked manual. Written to {os.path.relpath(QUEUE, os.path.dirname(HERE))}")
    if a.queue_only: return
    st = load_state(); fs = st.setdefault("films", {}); posted = fs.setdefault("posted", {})
    item = None
    if a.day: item = next((f for f in q["queue"] if f["day"] == a.day), None)
    else: item = next((f for f in q["queue"] if f["file"] not in posted and f["status"] == "ready"), None)
    if not item: print("nothing left to post" if not a.day else f"no day {a.day}"); return
    if a.post and item["status"] != "ready": raise SystemExit(f"day {item['day']} is marked manual: {item['notes']}")
    text = no_dash(item["caption"] + "\n\n" + item["link"].replace("https://", ""))
    rec = X(dry_run=not a.post, tag="films").post(text, [item["file"]])
    if a.post:
        posted[item["file"]] = {"at": now_ny().isoformat(timespec="seconds"), "url": rec.get("url")}; save_state(st)
    print(("posted " if a.post else "dry run ") + rec["outbox"])
    print(f"  film: {os.path.relpath(item['file'], ROOT)} ({item['size_mb']} MB, {item['duration_s']} s)")
    print("  " + text.replace("\n", "\n  "))


if __name__ == "__main__":
    main(sys.argv[1:])
