"""Before and after views for THE BIG UPGRADE (2026-11-23), same cameras every time.
  python3 tools/upgrade_shots.py before|after [name ...]   (serves nothing: expects site/ on 127.0.0.1:4303)
Writes <room>-<tag>-N.png into /Volumes/mlow2026/GALLERY UPGRADE 2026-11-23/gentrifying/. Headless Chrome on port 9403,
its profile is a temp folder deleted on exit."""
import os, sys, time, json, base64
sys.path.insert(0, '/Users/degens/.claude/skills/premium-site-design/scripts')
from cdp import Page
OUT = '/Volumes/mlow2026/GALLERY UPGRADE 2026-11-23/gentrifying'; os.makedirs(OUT, exist_ok=True)
TAG = sys.argv[1] if len(sys.argv) > 1 else 'after'; ONLY = set(sys.argv[2:])
URL = os.environ.get('SHOT_URL', 'http://127.0.0.1:4303/?shot')
HIDE = "document.head.insertAdjacentHTML('beforeend','<style>header,footer,nav,#rooms,#meter,#room-label,#toast,#hint,#intro,#cross,#touch{display:none!important}body::before{content:none!important}</style>');document.body.classList.add('started');"
L = "galleryDebug.look"; HYPE = "galleryDebug.hype();galleryDebug.hype();galleryDebug.hype();"
VIEWS = [
 ("loft-1", f"{L}('loft',[-1.5,1.68,9.4],[-.4,2.6,-10])"),
 ("loft-2", f"{L}('loft',[-1,1.68,4],[-6.5,1.3,-1.5])"),
 ("loft-3", f"{L}('loft',[-6.4,1.68,1.5],[-11.7,2.6,-3.4])"),
 ("loft-4", f"{L}('loft',[-4,1.68,6],[8,4.2,-4])"),
 ("loft-5", HYPE + f"{L}('loft',[-7.6,1.68,9.6],[2.6,2.9,-10.7])", 8),
 ("loft-6", HYPE + f"{L}('loft',[-1,1.68,2],[8.5,3,17])", 8),
 ("sales-1", f"{L}('sales',[3.9,1.68,8.3],[1.4,1.6,-1])"),
 ("sales-2", f"{L}('sales',[3.5,1.9,4.2],[0,1.6,0])"),
 ("sales-3", f"{L}('sales',[5,1.68,2],[-9,2,-6])"),
 ("basement-1", f"{L}('basement',[1.2,1.68,7.6],[-6,1.9,-5])"),
 ("basement-2", f"{L}('basement',[3,1.5,7.8],[7,.9,4.5])"),
 ("basement-3", f"{L}('basement',[-4,1.68,6],[6,2.3,-6])"),
 ("roof-1", f"{L}('roof',[-3.2,1.68,8.8],[0,2.4,-4])"),
 ("roof-2", f"{L}('roof',[6,1.68,9],[-3,3,-6])"),
 ("roof-3", f"{L}('roof',[-8,1.68,6],[8,2.5,-9])"),
]
pg = Page(1600, 900, port=int(os.environ.get('SHOT_PORT', '9403')))
try:
    for v in VIEWS:
        name, js = v[0], v[1]; wait = v[2] if len(v) > 2 else 6
        if ONLY and name not in ONLY: continue
        pg.send("Page.navigate", url=URL)
        for _ in range(60):
            time.sleep(1)
            if pg.ev("!!window.galleryDebug && !document.querySelector('#loading')"): break
        time.sleep(3); pg.ev("localStorage.clear()")
        pg.ev(HIDE + js); time.sleep(wait)
        data = pg.send("Page.captureScreenshot", format="png")["data"]
        room, n = name.rsplit('-', 1)
        open(os.path.join(OUT, f"{room}-{TAG}-{n}.png"), "wb").write(base64.b64decode(data))
        print(name, pg.ev("JSON.stringify(galleryDebug.errors)"), pg.ev("JSON.stringify(galleryDebug.getStats())"), flush=True)
finally:
    pg.close()
