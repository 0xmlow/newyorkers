#!/usr/bin/env python3
"""interviews.json: every published MLow interview that involves an honoree, keyed by their normalised name.

Source of truth is MLow's own list at https://www.mlow.xyz/interviews (fetched live, snapshot kept in
interviews_source.json so the build still works offline), plus the crossover shows where MLow was the guest,
which are listed in CROSSOVERS below. Dates come from the X post id itself (snowflake), not from any notes.
Rerun after a new episode goes up, then sync.py and build_honoraries.py.
"""
import os, json, re, html, urllib.request, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SNAP = os.path.join(HERE, "interviews_source.json")
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())

# MLow as the guest on someone else's show: (post url, show label, the honorees who host it)
CROSSOVERS = [
    ("https://x.com/art1stshow/status/1801698252146061547", "MLow on Art1st", ["Bryan Brinkman", "Adamtastic"]),
    ("https://x.com/MuseumofCrypto/status/1712946815580995793", "MLow on MOCA Live", ["Max Cohen", "Colborn Bell"]),
    ("https://x.com/justinaversano/status/1948412890609823819", "MLow on Moments of the Unknown", ["Justin Aversano"]),
]
SKIP = re.compile(r"journey|davincithreads|hot takes|ogiworlds", re.I)


def fetch():
    try:
        req = urllib.request.Request("https://www.mlow.xyz/interviews", headers={"User-Agent": "Mozilla/5.0"})
        s = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")
    except Exception as e:
        print("  live list unreachable, using the snapshot:", e)
        return json.load(open(SNAP))
    s = re.sub(r"<(script|style)[\s\S]*?</\1>", "", s)
    items, seen = [], set()
    for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)</a>', s):
        u = html.unescape(m.group(1)).split("?")[0]
        t = " ".join(html.unescape(re.sub(r"<[^>]+>", " ", m.group(2))).split())
        if "/status/" in u and t and u not in seen:
            seen.add(u); items.append(dict(url=u, title=t))
    json.dump(items, open(SNAP, "w"), indent=1, ensure_ascii=False)
    return items


def when(url):
    ms = (int(url.rsplit("/", 1)[1]) >> 22) + 1288834974657
    return datetime.datetime.utcfromtimestamp(ms / 1000).strftime("%Y-%m-%d")


def guest(title):
    t = re.sub(r"^(M\.? ?Low x|MLow X|Interview with)\s+", "", title, flags=re.I)
    t = re.sub(r"\s*(//.*|,.*|\(.*|\bof\b.*|\bInterview\b.*|\bPart \d+\b.*)$", "", t, flags=re.I)
    return t.strip()


names = {norm(p["name"]): p["name"] for p in json.load(open(os.path.join(HERE, "honoraries.json")))["people"]}


def match(g):
    k = norm(g)
    return next((n for n in names if n == k or (len(k) > 4 and (n.startswith(k) or k.startswith(n)))), None)


out, unmatched = {}, []
for it in fetch():
    if SKIP.search(it["title"]) or "art1stshow" in it["url"] or "MuseumofCrypto" in it["url"]:
        continue
    g = guest(it["title"])
    k = match(g)
    if not k:
        unmatched.append(g); continue
    part = re.search(r"Part (\d+)", it["title"])
    out.setdefault(k, []).append(dict(url=it["url"], date=when(it["url"]), show="The MLow Show",
                                      label=("Part " + part.group(1)) if part else ""))
for url, show, hosts in CROSSOVERS:
    for h in hosts:
        k = match(h)
        if k:
            out.setdefault(k, []).append(dict(url=url, date=when(url), show=show, label=""))
        else:
            unmatched.append(h)
# MLow's own card: his solo episode and every show where he was the guest
if match("MLow"):
    k = match("MLow")
    out.setdefault(k, []).append(dict(url="https://x.com/0xmlow/status/1722806325455798573", date=when("https://x.com/0xmlow/status/1722806325455798573"),
                                      show="The MLow Show solo", label=""))
    for url, show, hosts in CROSSOVERS:
        out[k].append(dict(url=url, date=when(url), show=show, label=""))
for v in out.values():
    v.sort(key=lambda x: x["date"])
json.dump(out, open(os.path.join(HERE, "interviews.json"), "w"), indent=1, ensure_ascii=False)
print(f"interviews: {len(out)} honorees, {sum(map(len, out.values()))} links; not honorees: {sorted(set(unmatched))}")
