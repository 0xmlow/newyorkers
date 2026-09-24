#!/usr/bin/env python3
"""Export a range of rooms as GLB + poster + JSON through the museum's own export chain.

  python3 run_export.py <from> <to> [tag] [hour]

<from> and <to> are ZERO BASED indices into ROOMS (room 24 in the menu is index 23).
[tag] is a build_variant tag, or "" for the real bundle. [hour] forces the New York
hour so a daylit room is not exported in whatever light it happens to be.

Before running: python3 ../serve.py 4185 (or _build/serve.py) and
python3 export_server.py 4181. Files land in MUSEUM EXPORTS/<today>/.
A room is about 40 MB of GLB, so check df -h / first."""
import subprocess, time, os, sys, json, urllib.request, urllib.parse, tempfile, datetime
frm, to = int(sys.argv[1]), int(sys.argv[2]); tag = sys.argv[3] if len(sys.argv) > 3 else ''
hour = sys.argv[4] if len(sys.argv) > 4 else ''
PORT = 9381
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
prof = tempfile.mkdtemp(prefix='export-')
chrome = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={PORT}", "--window-size=1600,900", "--user-data-dir=" + prof, "--use-angle=metal", "--disable-extensions", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
HOST = f'http://127.0.0.1:{PORT}'
for _ in range(80):
    try: urllib.request.urlopen(HOST + "/json/version"); break
    except Exception: time.sleep(0.25)
page = f"museum.{tag}.html" if tag else "museum.html"
url = f"http://127.0.0.1:4185/{page}?export=all&from={frm}&to={to}&auto=1&post=http://127.0.0.1:4181/&v={int(time.time())}" + (f"&hour={hour}" if hour else "")
ROOT = "/Users/degens/Desktop/NEW YORKERS BY MLOW"
OUT = os.path.join(ROOT, "MUSEUM EXPORTS", datetime.date.today().isoformat())
# the page writes done.txt after the last room and chunk-<to>.txt otherwise; watch for both
# rather than guess the room count, which grows (a hard coded 145 once hung this runner)
markers = [os.path.join(OUT, 'done.txt'), os.path.join(OUT, f'chunk-{to}.txt')]
for m in markers:
    if os.path.exists(m): os.remove(m)
try:
    r = json.load(urllib.request.urlopen(urllib.request.Request(f'{HOST}/json/new?{urllib.parse.quote(url, safe="")}', method='PUT')))
    print('opened', r.get('url'))
    t0 = time.time()
    while time.time() - t0 < 900:
        hit = next((m for m in markers if os.path.exists(m)), None)
        if hit: print('done:', open(hit).read()); break
        time.sleep(2)
    else: print('TIMEOUT')
    print(sorted(f for f in os.listdir(OUT) if f.endswith('.png')))
finally:
    chrome.terminate()
