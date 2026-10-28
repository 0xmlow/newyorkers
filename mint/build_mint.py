#!/usr/bin/env python3
"""build_mint.py: the mint file for token 51 from the current source (2026-10-28 upgrade).

site/index.html loads phone-gpu.js from beside it, which is right for n3wyorkers.com and wrong for a token: on IPFS
that is a second file and a 404 if it is missing. Here the phone guard is inlined in its place, so the mint file is
one self contained HTML file with no network calls, as the metadata promises. Writes mint/v2/index.html and prints
its size and sha256. Does not pin: pin.py --piece mint/v2/index.html does that, and only when MLow says so.
"""
import os, re, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
html = open(os.path.join(ROOT, "site", "index.html"), encoding="utf-8").read()
gpu = open(os.path.join(ROOT, "site", "phone-gpu.js"), encoding="utf-8").read().replace("</script", "<\\/script")
tag = re.compile(r'<script src="phone-gpu\.js[^"]*"([^>]*)></script>')
m = tag.search(html)
if not m: raise SystemExit("no phone-gpu.js tag in site/index.html")
html = html[:m.start()] + f"<script{m.group(1)}>\n{gpu}\n</script>" + html[m.end():]
for bad in ("—", "–"): assert bad not in html, "dash in the mint file"
assert not re.search(r'<(?:script|link|img)[^>]+(?:src|href)\s*=\s*["\'](?!data:)[^"\']+', html), "the mint file still loads something from outside"
out = os.path.join(HERE, "v2", "index.html"); os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, "w", encoding="utf-8").write(html)
b = open(out, "rb").read()
print(out); print(len(b), "bytes,", round(len(b) / 1e6, 2), "MB"); print("sha256", hashlib.sha256(b).hexdigest())
