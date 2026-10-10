"""port.py: bring MLow's single-file ARCHITECT walkthroughs onto n3wyorkers.com.
Each becomes site/<slug>/index.html with three r128 self hosted (vendor/three.min.js) and no dash characters
(brand rule: titles take a colon, prose a comma, ranges 'to'). Rerun after a source changes."""
import os, re, shutil
SRC = os.path.expanduser("~/Documents/Claude/Projects/ARCHITECT")
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE = os.path.join(os.path.dirname(HERE), "MEME ISLAND 2026-10-07", "site", "vendor", "three.min.js")
WALKS = {"fallingwater": "fallingwater-mlow.html", "pantheon": "pantheon-mlow.html",
         "szeged": "szeged-synagogue-mlow.html", "safra": "edmond-safra-synagogue-mlow-v5.html"}
CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
for slug, f in WALKS.items():
    t = open(os.path.join(SRC, f), encoding="utf-8").read()
    assert CDN in t, slug
    t = t.replace(CDN, '<script src="vendor/three.min.js"></script>')
    t = re.sub(r"(<title>[^<]*?)\s*—\s*", r"\1: ", t)                      # title: colon
    t = re.sub(r"(\d)\s*–\s*(\d)", r"\1 to \2", t)                        # ranges
    t = re.sub(r"\s*—\s*(?=[<\"'\n])", "", t)                              # a dangling dash at a line or string end
    t = re.sub(r"\s+[—–]\s+", ", ", t)                                     # spaced dash in prose: comma
    t = t.replace("—", ", ").replace("–", " to ")
    out = os.path.join(HERE, "site", slug); os.makedirs(os.path.join(out, "vendor"), exist_ok=True)
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(t)
    shutil.copy2(THREE, os.path.join(out, "vendor", "three.min.js"))
    print(slug, len(t), "dashes left", t.count("—") + t.count("–"))
