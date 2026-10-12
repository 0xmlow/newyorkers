"""Headless stills of THE SPIRAL. python3 shot.py name 'js to place the camera' [w h]. Serve site/ (staged) on 4311 and Chrome on 9333 first."""
import sys, time, base64, json
from cdp import Page
name, js = sys.argv[1], sys.argv[2]
W, H = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (1440, 900)
q = sys.argv[5] if len(sys.argv) > 5 else ''
p = Page.open('http://127.0.0.1:4311/index.html?go=1&lock=0' + q, W, H)
time.sleep(2)
for _ in range(60):
    if p.eval('!!(window.__game && __game.turnObjs.length)'): break
    time.sleep(.5)
print(p.eval('JSON.stringify({nt: __game.NT, top: __game.Y_TOP, live: __game.LIVE.tid})'))
logs = []
print(p.eval(js))
time.sleep(float(sys.argv[6]) if len(sys.argv) > 6 else 4)
print(p.eval("document.getElementById('zone').innerText.replace(/\\n/g,' | ')"))
p.screenshot(f'/private/tmp/claude-501/sk/{name}.jpg', 'jpeg', 82)
p.close()
