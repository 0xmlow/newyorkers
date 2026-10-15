"""Stills for the site page and the README: python3 tools/shots.py (serves site/ on 8611 itself). 1280 x 720 JPEGs in site/assets/shots/, poster.jpg at 1600 x 900."""
import os, sys, time, threading, http.server, socketserver, functools
sys.path.insert(0, '/Users/degens/.claude/skills/premium-site-design/scripts')
from cdp import Page
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, '..', 'site'); OUT = os.path.join(SITE, 'assets', 'shots'); os.makedirs(OUT, exist_ok=True)
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=SITE); H.log_message = lambda *a: None
socketserver.TCPServer.allow_reuse_address = True
try:
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 8612), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
except OSError: pass
HIDE = "document.head.insertAdjacentHTML('beforeend','<style>header,footer,#rooms,#meter,#room-label,#toast,#hint,#intro,#cross,body::before{display:none!important}body::before{content:none!important}</style>');document.body.classList.add('started');"
L = "galleryDebug.look"
SHOTS = [
 ("working-floor", f"{L}('loft',[-1.5,1.68,9.4],[-.4,2.6,-10])"),
 ("the-hang", f"{L}('loft',[-6.4,1.68,1.5],[-11.7,2.6,-3.4])"),
 ("impossible-lease", f"{L}('loft',[0,1.68,8],[0,2.2,-2])"),
 ("the-rebrand", "galleryDebug.hype();galleryDebug.hype();galleryDebug.hype();" + f"{L}('loft',[-7.6,1.68,9.6],[2.6,2.9,-10.7])", 7),
 ("the-rebrand-broken", "galleryDebug.hype();galleryDebug.hype();galleryDebug.hype();" + f"{L}('loft',[-3.2,1.68,6.4],[1.2,2.6,-10.7])", 7),
 ("the-corridor", "galleryDebug.hype();galleryDebug.hype();galleryDebug.hype();" + f"{L}('loft',[-11,1.68,7.5],[-11.6,1.7,-6])", 7),
 ("sales-suite", f"{L}('sales',[3.9,1.68,8.3],[1.4,1.6,-1])"),
 ("bottomless-value", f"{L}('sales',[-4.45,1.68,2.25],[-5.3,-6.5,-.4])"),
 ("the-holdouts", f"{L}('basement',[1.2,1.68,7.6],[-6,1.9,-5])"),
 ("common-ground", f"{L}('roof',[-3.2,1.68,8.8],[0,2.4,-4])"),
 ("the-commons", "localStorage.setItem('mlow-tenants-v1',JSON.stringify(['lease','petition','seed','letter','key','negative']));location.reload()", 9,
  "galleryDebug.go('roof');galleryDebug.targets.find(t=>t.title==='Reclaim the building').fn();document.querySelector('#modal').close();" + f"{L}('loft',[-1.5,1.68,9.4],[-.4,3.4,-10])"),
]
pg = Page(1280, 720)
try:
    for sh in SHOTS:
        name, js = sh[0], sh[1]; wait = sh[2] if len(sh) > 2 else 4
        pg.send("Page.navigate", url="http://127.0.0.1:8612/?shot"); time.sleep(7)
        pg.ev("localStorage.clear()" if name != 'the-commons' else "1")
        pg.ev(HIDE + js); time.sleep(wait)
        if len(sh) > 3: time.sleep(2); pg.ev(HIDE + sh[3]); time.sleep(5)
        pg.shot(os.path.join(OUT, name + '.jpg')); print(name, pg.ev("JSON.stringify(galleryDebug.errors)"))
finally:
    pg.close()
Image.open(os.path.join(OUT, 'the-rebrand.jpg')).resize((1600, 900), Image.LANCZOS).save(os.path.join(SITE, 'assets', 'poster.jpg'), quality=86)
