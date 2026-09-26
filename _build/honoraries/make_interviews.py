#!/usr/bin/env python3
"""interviews.json: which honorees were interviewed on The MLow Show, with the episode posts on X.

Reads the podcast corpus (episodes.json, guests.json) and matches guests to the honoraries by name.
Only published episodes with a post URL are kept. Rerun when an episode is published.
"""
import os, json, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
PC = "/Users/degens/Desktop/MLow Degens Desktop Sept 2026/MLow Degens Desktop Sept 2026_Duplicates/ALL IN PODCAST ANALYSIS/mlow-show/pc"
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
E = json.load(open(f"{PC}/data/episodes.json"))
G = json.load(open(f"{PC}/guests.json"))
alias = {}
for g in G:
    for m in g["match"] + [g["name"]]:
        alias[norm(m)] = g["name"]
names = {norm(p["name"]): p["name"] for p in json.load(open(os.path.join(HERE, "honoraries.json")))["people"]}
out, unmatched = {}, set()
for e in E:
    if e.get("status") != "published" or not e.get("url"):
        continue
    for part in re.split(r"\s*(?:&|,|\bwith\b|\band\b)\s*", e.get("guest") or ""):
        k = norm(re.sub(r"\(.*?\)|\bof\b.*|interview", "", part, flags=re.I))
        if not k:
            continue
        k = norm(alias.get(k, k))
        hit = next((n for n in names if n == k or (len(k) > 4 and (n.startswith(k) or k.startswith(n)))), None)
        if not hit:
            unmatched.add(e["guest"]); continue
        guest_is_mlow = "MLow is the guest" in (e.get("guest") or "") or e["title"].lower().startswith(names[hit].lower())
        out.setdefault(hit, []).append(dict(url=e["url"].replace("x.com/0xMLow", "x.com/0xmlow"), date=e["date"], title=e["title"]))
for v in out.values():
    v.sort(key=lambda x: x["date"])
json.dump(out, open(os.path.join(HERE, "interviews.json"), "w"), indent=1, ensure_ascii=False)
print(f"interviews: {len(out)} honorees, {sum(map(len, out.values()))} episodes; unmatched guests: {sorted(unmatched)}")
