#!/usr/bin/env python3
"""The shared HTML shell for generated pages (the reading room, the room pages, the record pages, agents, brand).
Every generated page uses the same head (fonts, site.css, icons, theme), the shared nav and footer from site.js, the light
counts.js instead of the 5 MB data.js, and the easter eggs. `base` is "" at the site root or "../" one folder down."""
import json, os, re, html
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)

def cfg():
    s = open(os.path.join(SITE, "assets", "config.js")).read()
    g = lambda k, d="": (re.search(rf'{k}:\s*"([^"]*)"', s) or [None, d])[1]
    return {"domain": g("domain", "MLOW.NYC"), "siteUrl": g("siteUrl", "https://mlow.nyc").rstrip("/"), "contactEmail": g("contactEmail"),
            "printsUrl": g("printsUrl", "https://mlow.xyz/prints"), "printsHost": g("printsHost", "https://prints.mlow.xyz"), "artistUrl": g("artistUrl", "https://mlow.xyz"),
            "loginEnabled": re.search(r'loginEnabled:\s*true', s) is not None}

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">')

def esc(s): return html.escape(str(s or ""), quote=True)

# Cloudflare Pages serves every page extensionless and 308s /x.html to /x. The .html form
# therefore never answers 200, so naming it in a canonical, an og:url, a sitemap or a
# JSON-LD url tells Google to index a redirect. Every ABSOLUTE url the site publishes goes
# through here first. Relative links in the body may keep .html: they still resolve.
def pub(u):
    """Normalise one absolute site url to the form the server actually answers."""
    if not isinstance(u, str) or not u.endswith(".html"):
        return u
    site = cfg()["siteUrl"]
    if not u.startswith(site):
        return u                                  # someone else's url, leave it alone
    return site + "/" if u == site + "/index.html" else u[:-5]

def pub_deep(o):
    """Same, applied through a JSON-LD structure."""
    if isinstance(o, str): return pub(o)
    if isinstance(o, list): return [pub_deep(x) for x in o]
    if isinstance(o, dict): return {k: pub_deep(v) for k, v in o.items()}
    return o

def no_dash(s):
    """Brand rule: no em or en dashes in anything public."""
    return str(s).replace("—", ",").replace("–", " to ")

def shell(*, title, description, body, base="", path="", active=None, extra_head="", extra_css="", jsonld=None, image=None, keywords=None, scripts_after="", noindex=False, kind="website"):
    C = cfg()
    url = pub(f"{C['siteUrl']}/{path}".rstrip("/")) if path != "index.html" else C["siteUrl"] + "/"
    img = image or f"{C['siteUrl']}/og.jpg"
    ld = ""
    if jsonld:
        ld = "".join(f'<script type="application/ld+json">{json.dumps(pub_deep(j), ensure_ascii=False, separators=(",", ":"))}</script>\n' for j in (jsonld if isinstance(jsonld, list) else [jsonld]))
    kw = f'<meta name="keywords" content="{esc(", ".join(keywords))}">\n' if keywords else ""
    robots = '<meta name="robots" content="noindex,follow">' if noindex else '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">'
    return no_dash(f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
{kw}{robots}
<link rel="canonical" href="{esc(url)}">
<meta property="og:type" content="{kind}">
<meta property="og:site_name" content="NEW YORKERS by MLow">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:image" content="{esc(img)}">
<meta property="og:url" content="{esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@degens">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{esc(img)}">
<meta name="theme-color" content="#0D0D0D">
<link rel="icon" type="image/png" href="{base}assets/brand/eye_truecolor.png">
<link rel="apple-touch-icon" href="{base}assets/brand/eye_truecolor.png">
<link rel="alternate" type="text/plain" title="llms.txt" href="{base}llms.txt">
{FONTS}
<link rel="stylesheet" href="{base}assets/site.css">
{ld}{extra_head}
<style>{extra_css}</style>
</head>
<body>
<div id="nav"></div>
{body}
<div id="foot"></div>
<script>window.NY_BASE="{base}";</script>
<script src="{base}assets/config.js"></script>
<script src="{base}assets/counts.js"></script>
<script src="{base}assets/site.js"></script>
<script>NY.nav({json.dumps(active)});NY.foot();</script>
{scripts_after}
<script src="{base}assets/eggs.js" defer></script>
</body>
</html>
""")
