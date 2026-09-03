#!/usr/bin/env python3
"""Validate a NEW YORKERS story file against the voice law.

usage: python3 validate_stories.py <input_chunk.json> <stories_out.json>

stories_out.json is {"<num>": "Sentence one. Sentence two lands bare"}.
Exit code 0 when clean. Prints every violation otherwise.
"""
import json, re, sys

BANNED = ["utilize", "vibrant", "bustling", "iconic", "tapestry", "boasts", "nestled",
          "innovative", "robust", "synergy", "wagmi", "lfg", "moon", "arguably", "perhaps",
          "one of the most", "in a city that never sleeps", "nestled in the heart",
          "few figures loom", "testament", "delve", "unlock", "vibe", "elevate"]

inp = {str(o["num"]): o for o in json.load(open(sys.argv[1]))}
out = json.load(open(sys.argv[2]))
bad = 0
def err(n, msg):
    global bad; bad += 1; print(f"{n}: {msg}")

for n in inp:
    if n not in out or not str(out[n]).strip():
        err(n, "MISSING"); continue
for n, s in out.items():
    s = str(s).strip()
    if "—" in s or "–" in s: err(n, "DASH")
    if s.endswith("."): err(n, "second sentence must land bare (no terminal period)")
    # split into sentences on ". " (period + space); allow abbreviations like 4am, No. rarely
    parts = re.split(r"(?<=[.!?])\s+", s)
    if len(parts) != 2: err(n, f"expected exactly 2 sentences, got {len(parts)}: {s[:90]}")
    else:
        w1, w2 = len(parts[0].split()), len(parts[1].split())
        if w1 < 5 or w1 > 20: err(n, f"sentence one is {w1} words (aim 6 to 16)")
        if w2 < 4 or w2 > 22: err(n, f"sentence two is {w2} words (aim 6 to 16)")
    low = " " + s.lower() + " "
    for b in BANNED:
        if " " + b + " " in low or low.startswith(" " + b + " "): err(n, f"banned word: {b}")
    if "color story" in low or "over ink black" in low: err(n, "reads like a prompt (color story)")
    if re.search(r"\beye[- ]?flowers?\b.*\beye[- ]?flowers?\b", low): err(n, "mentions eye flowers twice")

# repeated openings: three in a row starting with the same first word
keys = sorted(out.keys(), key=lambda k: int(k))
run = 1
for a, b in zip(keys, keys[1:]):
    fa = str(out[a]).split()[:1]; fb = str(out[b]).split()[:1]
    if fa and fb and fa[0].lower() == fb[0].lower(): run += 1
    else: run = 1
    if run >= 3: err(b, f"three consecutive stories open with '{fb[0]}'"); run = 1

extra = [n for n in out if n not in inp]
if extra: err("-", f"{len(extra)} numbers not in the input chunk: {extra[:5]}")
print(f"checked {len(out)} stories, {bad} problems")
sys.exit(1 if bad else 0)
