#!/usr/bin/env python3
"""The curator: learns MLow's taste from what he has already chosen, gates every piece on picture quality, and hangs
the museum by theme and by floor. Imported by build_data.py; run on its own for the report.

Taste. Positives are the census pieces MLow holds himself (minted.json, his handle and wallet), the Keystone picks
(keystone.json token names matched to titles), the faces on the home page, the pieces he made posters and cards for
(posters_cut.json), and the likes in taste.json. Every piece is a bag of tokens (words of its title and story, family,
set, borough, neighbourhood, era). Each token gets a smoothed log odds: how much more often it appears in what MLow
chose than in the census at large. A piece's taste score is the sum of its tokens' odds, scaled by its length, plus the
hand weights from taste.json. The report prints the tokens that carry the most weight, so the model can be read and argued with.

Quality. Sharpness is the variance of the Laplacian of the 1000 px thumb; contrast the standard deviation of luminance;
dark fraction the share of pixels under 40. Pieces under the thresholds in taste.json never hang (the curator keeps a
list of what it refused and why). Cached in _build/qc_cache.json because 7,542 thumbs take a couple of minutes.

Themes. Each theme in taste.json is a bag of words; a piece's theme score is its taste score plus how many theme words
it carries. The best pieces for each theme fill its room on the sixth floor. The eras and families keep their own
floors, but inside each the order is the curator's: the best first, so the main wall is the strongest wall.
"""
import json, math, os, re, collections
from PIL import Image, ImageFilter, ImageStat

H = os.path.dirname(os.path.abspath(__file__)); GAL = os.path.dirname(H); ROOT = os.path.dirname(GAL)
SITE = os.path.join(ROOT, "NEW YORKERS SITE")
J = lambda p: json.load(open(p, encoding="utf-8"))
TASTE = J(os.path.join(H, "taste.json"))
STOP = set("the a an and of to in on at for with by from is are was were be been it its his her their he she they them this that these those as or but not no into out up down over under off than then so if who what when where which while about after before between through across again against all any both each few more most other some such only own same too very can will just one two three".split())

def tokens(p):
    text = (p.get("title", "") + " " + (p.get("story") or "")).lower()
    words = [w for w in re.findall(r"[a-z][a-z'\-]+", text) if w not in STOP and len(w) > 2]
    bigrams = [a + " " + b for a, b in zip(words, words[1:])]
    t = set(words) | set(bigrams)
    for k in ("family", "set", "borough", "neighborhood", "location"):
        if p.get(k): t.add(k + ":" + str(p[k]).lower())
    t.add("era:" + str(p.get("era")))
    return t

class Curator:
    def __init__(self, P):
        self.P = P; self.by_n = {p["n"]: p for p in P}
        self.tok = {p["n"]: tokens(p) for p in P}
        self.positives, self.sources = self.find_positives()
        self.weights = self.learn()
        self.qc = self.quality()
        self.score = {p["n"]: self.taste(p) for p in P}

    # ---- what MLow already chose ----
    def find_positives(self):
        pos, src = set(), collections.defaultdict(list)
        M = J(os.path.join(SITE, "api", "minted.json"))["census"]
        for k, v in M.items():
            if v.get("x") == "degens" or v.get("o") == "mlow.eth": pos.add(int(k)); src["his own mints"].append(int(k))
        K = J(os.path.join(SITE, "api", "keystone.json"))
        titles = {p["title"].strip().lower(): p["n"] for p in self.P}
        for t in K.get("tokens", []):
            name = (t.get("name") or "").strip().lower()
            for cand in (name, "the " + name, name.replace("the ", "")):
                if cand in titles: pos.add(titles[cand]); src["Keystone"].append(titles[cand]); break
        home = open(os.path.join(SITE, "index.html"), encoding="utf-8").read()
        for n in re.findall(r'class="art-card" href="n/(\d+)"', home): pos.add(int(n)); src["the home page faces"].append(int(n))
        try:
            cut = J(os.path.join(SITE, "_build", "posters_cut.json"))
            for n in cut.get("card_pieces", []): pos.add(int(n)); src["posters and cards"].append(int(n))
        except Exception: pass
        rejected = set()
        try: rejected = {int(n) for n in J(os.path.join(SITE, "_build", "curation.json")).get("rejected", [])}
        except Exception: pass
        self.rejected = rejected
        return {n for n in pos if n in self.by_n}, src

    # ---- the model ----
    def learn(self):
        pos_c, bg_c = collections.Counter(), collections.Counter()
        for n, t in self.tok.items():
            bg_c.update(t)
            if n in self.positives: pos_c.update(t)
        npos, nbg = max(1, len(self.positives)), len(self.tok)
        w = {}
        for tok, c in bg_c.items():
            if c < 12: continue                      # a word has to be common enough in the census to mean anything
            lo = math.log((pos_c[tok] + 0.5) / (npos + 1)) - math.log((c + 0.5) / (nbg + 1))
            lo *= pos_c[tok] / (pos_c[tok] + 3.0)    # shrink: one appearance in his picks is a hint, five is a taste
            w[tok] = max(-1.0, min(1.2, lo))
        for k, v in TASTE.get("likes", {}).items(): w[k] = w.get(k, 0) + v * 1.5
        for k, v in TASTE.get("dislikes", {}).items(): w[k] = w.get(k, 0) + v * 1.5
        for k, v in TASTE.get("families", {}).items(): w["family:" + k.lower()] = w.get("family:" + k.lower(), 0) + v
        return w

    def taste(self, p):
        t = self.tok[p["n"]]
        vals = sorted((self.weights.get(x, 0) for x in t), reverse=True)
        # the strongest handful of signals, not the length of the story
        return sum(vals[:6]) + 0.15 * sum(vals[6:]) / math.sqrt(max(8, len(t)))

    # ---- the picture ----
    def quality(self):
        cache_p = os.path.join(H, "qc_cache.json")
        cache = J(cache_p) if os.path.exists(cache_p) else {}
        changed = 0
        for p in self.P:
            f = p["image"].split("/assets/t/")[-1]
            if f in cache: continue
            path = os.path.join(SITE, "assets", "t", f)
            try:
                im = Image.open(path).convert("L").resize((500, 281))
                lap = im.filter(ImageFilter.Kernel((3, 3), [0, 1, 0, 1, -4, 1, 0, 1, 0], scale=1, offset=128))
                sharp = ImageStat.Stat(lap).var[0]
                st = ImageStat.Stat(im); contrast = st.stddev[0]
                hist = im.histogram(); dark = sum(hist[:40]) / sum(hist)
                cache[f] = [round(sharp, 1), round(contrast, 1), round(dark, 3)]
            except Exception:
                cache[f] = [0, 0, 1]
            changed += 1
        if changed: json.dump(cache, open(cache_p, "w"))
        q = TASTE["quality"]
        sharps = sorted(v[0] for v in cache.values() if v[0] > 0)
        cut = sharps[int(len(sharps) * q["min_sharpness_percentile"] / 100)] if sharps else 0
        self.refused = {}
        out = {}
        for p in self.P:
            f = p["image"].split("/assets/t/")[-1]; sharp, contrast, dark = cache.get(f, [0, 0, 1])
            why = None
            if sharp < cut: why = f"soft (sharpness {sharp:.0f} under {cut:.0f})"
            elif contrast < q["min_contrast"]: why = f"flat (contrast {contrast:.0f})"
            elif dark > q["max_dark_fraction"]: why = f"mud (dark {dark:.0%})"
            if p["n"] in self.rejected: why = "cut by MLow"
            if why: self.refused[p["n"]] = why
            out[p["n"]] = {"sharp": sharp, "contrast": contrast, "dark": dark, "ok": why is None}
        self.sharp_cut = cut
        return out

    def ok(self, p): return self.qc[p["n"]]["ok"]

    # ---- hanging ----
    def rank(self, pool, key=None):
        """Best first by taste (plus a theme bonus when `key` is a theme), quality gated."""
        pool = [p for p in pool if self.ok(p)]
        theme = next((t for t in TASTE["themes"] if t["key"] == key), None)
        def s(p):
            v = self.score[p["n"]]
            if theme:
                t = self.tok[p["n"]]; hits = sum(1 for w in theme["words"] if w in t or any(w in x for x in t if " " in x or len(w) > 4))
                v += 0.9 * hits
            return v
        return sorted(pool, key=s, reverse=True)

    def theme_pool(self, key):
        theme = next(t for t in TASTE["themes"] if t["key"] == key)
        def hits(p): t = self.tok[p["n"]]; return sum(1 for w in theme["words"] if w in t)
        return [p for p in self.P if hits(p) >= 1]

    def report(self):
        top = sorted(((v, k) for k, v in self.weights.items() if ":" not in k and k not in TASTE.get("likes", {})), reverse=True)[:40]
        lines = ["# The curator's notes", "",
                 f"Positives: {len(self.positives)} pieces MLow already chose: " + ", ".join(f"{k} ({len(v)})" for k, v in self.sources.items()) + ".",
                 f"Quality gate: sharpness under {self.sharp_cut:.0f} (the {TASTE['quality']['min_sharpness_percentile']}th percentile), contrast under {TASTE['quality']['min_contrast']}, dark over {TASTE['quality']['max_dark_fraction']:.0%}. Refused {len(self.refused)} of {len(self.P)}.", "",
                 "## What the model learned he likes (words that appear more in his picks than in the census)", "",
                 ", ".join(f"{k} ({v:+.2f})" for v, k in top), "",
                 "## The twenty pieces it would hang first, anywhere", ""]
        best = self.rank(self.P)[:20]
        for p in best: lines.append(f"- No. {p['n']} {p['title']} ({p['family']}, Era {p['era']}): taste {self.score[p['n']]:+.2f}")
        lines += ["", "## Refused, a sample", ""]
        for n, why in list(self.refused.items())[:25]: lines.append(f"- No. {n} {self.by_n[n]['title']}: {why}")
        return "\n".join(lines) + "\n"

if __name__ == "__main__":
    P = J(os.path.join(SITE, "api", "pieces.json"))
    c = Curator(P)
    print(c.report())
