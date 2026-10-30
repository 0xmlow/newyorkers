"""shell.py <gallery dir>: write <gallery>/_build/shell.html from the pristine LIVE FROM THE SEWERS shell and
<gallery>/_build/shell.json (title, description, the intro, the finale, the HUD extras)."""
import json, os, re, sys
G = os.path.abspath(sys.argv[1]); HERE = os.path.join(G, "_build"); J = json.load(open(os.path.join(HERE, "shell.json")))
pristine = os.path.join(HERE, "shell.sewers.html")
if not os.path.exists(pristine): os.rename(os.path.join(HERE, "shell.html"), pristine)
s = open(pristine).read()
def sub(pat, rep, flags=re.S):
    global s
    if not re.search(pat, s, flags=flags): sys.exit("shell anchor missing: " + pat[:60])
    s = re.sub(pat, lambda m: rep, s, count=1, flags=flags)
sub(r"<title>.*?</title>", f"<title>{J['title']} · {J['sub']} · NEW YORKERS by MLow</title>")
sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{J["description"]}">')
sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{J["title"]} · {J["sub"]}">')
sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{J["og"]}">')
sub(r'<div class="k">LIVE FROM THE SEWERS · <span id="rf"></span></div>', f'<div class="k">{J["title"]} · <span id="rf"></span></div>')
sub(r'<button id="setsbtn" type="button" aria-controls="rooms">FLOORS <b id="setsn"></b></button>', f'<button id="setsbtn" type="button" aria-controls="rooms">{J.get("navWord", "ROOMS")} <b id="setsn"></b></button>')
sub(r'<nav id="rooms" aria-label="Floors"></nav>', '<nav id="rooms" aria-label="Rooms"></nav>')
sub(r'<div id="eggbox">EGGS <b id="eggs">0 / 0</b></div>', '<div id="eggbox">EGGS <b id="eggs">0 / 0</b></div>' + J.get("hud", ""))
sub(r'<div id="intro">.*?</div>\n</div>\n<div id="riderbox"', '<div id="intro">\n  <div class="wrap">\n' + J["intro"] + '\n  </div>\n</div>\n<div id="riderbox"')
sub(r'<div class="k">SKATE THE SEWER</div><h3>Pick your rider</h3><p>The residents\. Every one of them skates\.</p>', f'<div class="k">{J.get("skateTitle", "SKATE IT")}</div><h3>Pick your rider</h3><p>{J.get("riderLine", "The cast. Every one of them skates.")}</p>')
sub(r'<div id="finale">.*?</div>\n</div>\n<script', '<div id="finale">\n' + J["finale"] + '\n</div>\n<script')
s = s.replace("</style>\n</head>", J.get("css", "") + "</style>\n</head>")
bad = re.findall(r"[–—→]", s)
if bad: sys.exit(f"house rule: dashes or arrows in the shell: {bad}")
open(os.path.join(HERE, "shell.html"), "w").write(s); print("shell.html written for", J["title"])
