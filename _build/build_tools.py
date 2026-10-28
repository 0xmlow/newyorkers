#!/usr/bin/env python3
"""tools.html: MLow's art tools at /tools.

The tools themselves live on mvibe (github.com/0xmlow/mvibe, served at 0xmlow.github.io/mvibe), where each
one runs in the browser and signs what it exports. This page is the NEW YORKERS door to them: one card per
tool, each hung with a New Yorker from the census whose title fits the job. MOSH LAB opens here at /moshlab,
the site's own copy; every other card opens the tool on mvibe in a new tab.

To add a tool: add a row to TOOLS with its mvibe slug and a census number. Nothing is copied, so the page
stays a few KB and the tools update on mvibe without a rebuild here.
Part of build_all.sh, before build_seo.py.
"""
import os, json, html
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
URL = cfg()["siteUrl"]
MVIBE = "https://0xmlow.github.io/mvibe/"

# slug on mvibe (None: the site's own page), name, kind, formats, the line, census number for the art
TOOLS = [
    ("moshlab", "MOSH LAB", "GLITCH", "GIF · MP4 · WebM · PNG",
     "The glitch instrument behind the mosh states. Sixty stackable effects, 48 presets, seeded looks, loops that never show a seam.", 891),
    ("svg-forge-3d", "SVG FORGE 3D", "3D", "SVG in, GLB · STL · PNG out",
     "Turn flat artwork into real extruded 3D. Bevel it, light it, export a GLB for the web or an STL for the printer.", 1140),
    ("spinlab", "SPINLAB", "3D", "GLB in, GIF · WebM out",
     "A hype studio for 3D models. Drop a GLB into a world, pick a camera move, export a GIF that loops perfectly.", 1842),
    ("m-texture", "~M.TEXTURE~", "3D", "GLB and art in, GLB out",
     "Wrap any 3D model in a painting. Skin it, drape it or dissolve it, then download the new model.", 3175),
    ("art-sheets", "ART SHEETS", "PAINT", "Image in, XLSX · SVG · PNG out",
     "Repaint any image cell by cell as a spreadsheet painting: a real Excel workbook, a vector SVG and a PNG.", 1525),
    ("mp4-to-gif", "MP4 TO GIF", "CONVERT", "Video or stills in, GIF out",
     "Every video becomes its own max quality GIF. Drop a stack of images instead and they become one slideshow.", 3898),
    ("mp4-to-gif-50mb", "MP4 TO GIF, UNDER 50MB", "CONVERT", "Video in, GIF under a size limit",
     "The same engine fitted under a limit. It gives up colours first, then frames, and resolution only last.", 4218),
    ("movie-to-images", "MOVIE TO IMAGES", "CONVERT", "Video in, PNG frames out",
     "Pull full resolution stills out of any clip, a few a second, for references, posters or contact sheets.", 1149),
    ("heic-to-png", "HEIC TO PNG", "CONVERT", "HEIC in, PNG out",
     "iPhone photos to upright, full resolution PNGs. No sideways portraits.", 1788),
    ("raw-heic-to-png", "RAW + HEIC TO PNG", "CONVERT", "Camera RAW and HEIC in, PNG out",
     "RAW from Nikon, Canon, Sony, Fuji and more, plus HEIC, out as clean PNGs.", 2247),
    ("spinlab-v2", "SPINLAB V2", "3D", "The original, kept as it was",
     "The first Safe Orbit Studio, here for the record. Spinlab is the one to use.", 3873),
]
KINDS = [("ALL", "lN"), ("GLITCH", "l1"), ("3D", "lA"), ("PAINT", "lJ"), ("CONVERT", "l4")]
LINE = dict(KINDS)

_d = open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read()
pieces = {int(p["n"]): p for p in json.loads(_d[_d.index("{"):_d.rindex("}") + 1])["pieces"]}

cards = []
for slug, name, kind, fmt, line, n in TOOLS:
    p = pieces.get(n)
    if not p or not p.get("st"): raise SystemExit(f"tools: New Yorker #{n} for {name} is not in the census")
    thumb = f"assets/t/{p['st'][0]}.jpg"
    if not os.path.exists(os.path.join(SITE, thumb)): raise SystemExit(f"tools: {thumb} missing for {name}")
    href, ext = ("moshlab", "") if slug == "moshlab" else (MVIBE + "tools/" + slug + "/", ' target="_blank" rel="noopener"')
    go = "OPEN IT HERE" if slug == "moshlab" else "OPEN ON MVIBE"
    cards.append(f"""<article class="card tl" data-kind="{kind}" style="--lc:var(--{LINE[kind]})">
  <a class="tl-art" href="{href}"{ext} aria-label="Open {html.escape(name)}"><img src="{thumb}" alt="{html.escape(p['t'])}, a New Yorker by MLow" loading="lazy" decoding="async"></a>
  <div class="tl-body">
    <p class="tl-kind"><span class="bullet" style="--lc:var(--{LINE[kind]})"></span>{kind}</p>
    <h2>{html.escape(name)}</h2>
    <p class="tl-fmt">{html.escape(fmt)}</p>
    <p>{html.escape(line)}</p>
    <div class="tl-foot"><a class="btn" href="{href}"{ext}>{go}</a><a class="tl-ny" href="n/{n}">#{n} {html.escape(p['t'])}</a></div>
  </div>
</article>""")

for _, name, _, fmt, line, _ in TOOLS:
    for s in (name, fmt, line):
        if "—" in s or "–" in s: raise SystemExit(f"tools: a dash character in {name}; the brand rule forbids it")

desc = ("MLow's art tools, free in your browser: MOSH LAB, SVG Forge 3D, Spinlab, ~M.Texture~, Art Sheets and five converters for "
        "GIFs, frames, HEIC and camera RAW. Nothing to install, and your files never leave your machine.")
extra_css = """
.tools{max-width:1240px;margin:0 auto;padding:28px 16px 80px}
.tools-head{max-width:760px;margin:0 0 26px}
.tools-head h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(36px,6vw,64px);line-height:1.02;margin:10px 0 14px;color:var(--cloud)}
.tools-head h1 em{color:var(--gold)}
.tools-head p{color:var(--slate);line-height:1.65;margin:0 0 10px;font-size:17px}
.tl-filters{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}
.tl-filters button{font:600 12px/1 'IBM Plex Mono',monospace;letter-spacing:.14em;padding:10px 14px;border-radius:999px;cursor:pointer;
  border:1px solid var(--divider);background:var(--card);color:var(--slate);display:inline-flex;align-items:center;gap:8px}
.tl-filters button[aria-pressed="true"]{background:var(--cloud);color:var(--ink);border-color:var(--cloud)}
.tl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr));gap:18px}
.tl{display:grid;grid-template-rows:auto 1fr}
.tl[hidden]{display:none}
.tl-art{display:block;aspect-ratio:16/10;overflow:hidden;background:var(--ink)}
.tl-art img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 1s var(--ease)}
.tl:hover .tl-art img{transform:scale(1.05)}
.tl-body{padding:16px 18px 18px;display:grid;gap:8px;align-content:start}
.tl-kind{margin:0;display:flex;align-items:center;gap:8px;font:600 11px/1 'IBM Plex Mono',monospace;letter-spacing:.2em;color:var(--slate)}
.tl-kind .bullet{width:14px;height:14px}
.tl h2{margin:0;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:24px;color:var(--cloud);letter-spacing:.01em}
.tl-fmt{margin:0;font:500 12px/1.4 'IBM Plex Mono',monospace;color:var(--gold)}
.tl p{margin:0;color:var(--slate);line-height:1.55;font-size:15px}
.tl-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:6px}
.tl-ny{font:500 11px/1.3 'IBM Plex Mono',monospace;color:var(--slate);text-decoration:none;max-width:52%;text-align:right}
.tl-ny:hover{color:var(--sky)}
.tools-note{margin:34px 0 0;color:var(--slate);font-size:14px;line-height:1.7;max-width:760px}
.tools-note a{color:var(--sky)}
"""
filters = "".join(f'<button type="button" data-k="{k}" aria-pressed="{str(k == "ALL").lower()}"><span class="bullet" style="--lc:var(--{c})"></span>{k}</button>' for k, c in KINDS)
body = f"""<main class="tools">
  <header class="tools-head">
    <p class="kicker">THE TOOLBOX · FREE IN YOUR BROWSER</p>
    <h1>The tools MLow <em>makes the art with.</em></h1>
    <p>Glitch it, extrude it, spin it, wrap it, repaint it, convert it. Every tool here started as something MLow needed in the studio and asked an AI to build. Nothing to install, and your files never leave your machine.</p>
  </header>
  <div class="tl-filters" role="group" aria-label="Filter the tools">{filters}</div>
  <div class="tl-grid">
{chr(10).join(cards)}
  </div>
  <p class="tools-note">Each card is hung with a New Yorker from the census whose job fits the tool. The tools live on <a href="{MVIBE}" target="_blank" rel="noopener">mvibe</a>, MLow's home for them, with the source for every one at <a href="https://github.com/0xmlow/mvibe" target="_blank" rel="noopener">github.com/0xmlow/mvibe</a>. Files you export carry a small maker's mark from MLow.</p>
</main>
<script>
(function(){{
  var bs=document.querySelectorAll('.tl-filters button'), cs=document.querySelectorAll('.tl');
  bs.forEach(function(b){{ b.addEventListener('click', function(){{
    bs.forEach(function(x){{ x.setAttribute('aria-pressed', x===b ? 'true' : 'false'); }});
    var k=b.getAttribute('data-k');
    cs.forEach(function(c){{ c.hidden = k!=='ALL' && c.getAttribute('data-kind')!==k; }});
  }}); }});
}})();
</script>"""

jsonld = {"@context": "https://schema.org", "@type": "CollectionPage", "@id": URL + "/tools", "name": "The toolbox",
          "url": URL + "/tools", "description": desc, "author": {"@type": "Person", "name": "MLow"},
          "isPartOf": {"@id": URL + "/#site"},
          "hasPart": [{"@type": "WebApplication", "name": t[1], "url": (URL + "/moshlab") if t[0] == "moshlab" else MVIBE + "tools/" + t[0] + "/",
                       "applicationCategory": "MultimediaApplication", "operatingSystem": "Web browser", "isAccessibleForFree": True} for t in TOOLS]}

page = shell(title="The toolbox · MLow's art tools, free in your browser", description=desc, body=body, path="tools.html",
             active="TOOLS", extra_css=extra_css, jsonld=jsonld,
             keywords=["MLow", "NEW YORKERS", "art tools", "MOSH LAB", "Spinlab", "SVG to 3D", "MP4 to GIF", "HEIC to PNG", "RAW to PNG", "spreadsheet art"])
open(os.path.join(SITE, "tools.html"), "w", encoding="utf-8").write(page)
print(f"tools.html: {len(TOOLS)} tools, {len(page) // 1024} KB")
