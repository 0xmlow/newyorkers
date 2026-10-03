#!/usr/bin/env python3
"""Share cards: the picture X, iMessage, Discord and Slack show when someone pastes a link.
Reads og/cards.json and the masters in og/src/. Writes assets/og/<card>-<hash>.jpg at 1200x630, copies
the default card over og.jpg, and sets og:image, twitter:image and their size and alt on every listed page.
Runs after build_seo.py, because the page builders write the generic og.jpg and this has to land last.
Idempotent. The file name carries a content hash: X caches a card by URL, so a changed picture needs a new URL.
Piece pages (n/) and room pages (rooms/) take a banner each from the rotation in cards.json. Honoree share pages (h/)
and reading room articles (learn/) keep their own picture: the honoree's card, the article's room."""
import hashlib, io, json, os, re, sys
from PIL import Image
from page_shell import cfg, esc
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
URL = cfg()["siteUrl"]
M = json.load(open(os.path.join(HERE, "og", "cards.json"), encoding="utf-8"))
W, H = 1200, 630
out = os.path.join(SITE, "assets", "og"); os.makedirs(out, exist_ok=True)

def render(card):
    im = Image.open(os.path.join(HERE, "og", "src", card + ".webp")).convert("RGB")
    # centre crop to exactly 1.905:1, then resize; the masters are 1.91 give or take a few pixels
    w, h = im.size; r = W / H
    if w / h > r: nw = round(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = round(w / r); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im = im.resize((W, H), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=88, optimize=True, progressive=True, subsampling=0)
    return b.getvalue()

files = {}
for card in sorted(set(M["pages"].values()) | {M["default"]} | set(M.get("rotation", []))):
    data = render(card); name = f"{card}-{hashlib.sha256(data).hexdigest()[:10]}.jpg"
    files[card] = name
    if not os.path.exists(os.path.join(out, name)): open(os.path.join(out, name), "wb").write(data)
for f in os.listdir(out):                       # drop superseded renders so the folder holds only live cards
    if f.endswith(".jpg") and f not in files.values(): os.remove(os.path.join(out, f))
dflt = open(os.path.join(out, files[M["default"]]), "rb").read()
og = os.path.join(SITE, "og.jpg")
if not os.path.exists(og) or open(og, "rb").read() != dflt: open(og, "wb").write(dflt)

TAGS = re.compile(r'\s*<meta (?:property="og:image(?::(?:width|height|alt|type))?"|name="twitter:image(?::alt)?") content="[^"]*">')
def apply(path, card):
    s = open(path, encoding="utf-8").read()
    m = re.search(r'<meta property="og:image" content="[^"]*">', s)
    if not m: sys.exit(f"{os.path.relpath(path, SITE)}: no og:image tag to replace; run build_seo.py first")
    img, alt = f"{URL}/assets/og/{files[card]}", esc(M["alt"][card])
    block = (f'<meta property="og:image" content="{img}">\n<meta property="og:image:type" content="image/jpeg">\n'
             f'<meta property="og:image:width" content="{W}">\n<meta property="og:image:height" content="{H}">\n'
             f'<meta property="og:image:alt" content="{alt}">\n<meta name="twitter:image" content="{img}">\n'
             f'<meta name="twitter:image:alt" content="{alt}">')
    t = s[:m.start()] + "\x00" + s[m.end():]   # mark the first og:image, drop every other image tag, put the block on the mark
    t = TAGS.sub("", t).replace("\x00", block)
    if t != s: open(path, "w", encoding="utf-8").write(t); return 1
    return 0

n = 0
for page, card in M["pages"].items():
    p = os.path.join(SITE, page)
    if os.path.exists(p): n += apply(p, card)
rot = M.get("rotation", []); nf = tf = 0
for folder in M.get("folders", []):
    d = os.path.join(SITE, folder)
    for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        if not f.endswith(".html"): continue
        # a hash, not the position in the folder: adding piece 7543 must not reshuffle every banner after it
        card = rot[int(hashlib.sha256(f"{folder}/{f}".encode()).hexdigest(), 16) % len(rot)]
        nf += apply(os.path.join(d, f), card); tf += 1
print(f"  folders: {nf} pages changed of {tf} in {', '.join(f + '/' for f in M.get('folders', []))}")
print(f"share cards: {len(files)} cards, {n} pages changed of {len(M['pages'])}, og.jpg = {M['default']}")
