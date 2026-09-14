#!/usr/bin/env python3
"""shot_room.py <room id> <out.png> [--tag T] [--port 93xx] [--hour 14] [--turn deg] [--w 1600 --h 900]
Screenshot a room from its spawn (or --at x,y,z --yaw deg --pitch deg) in headless Chrome against the local server on :4185.
--tag opens museum.<tag>.html (see build_variant.mjs) instead of museum.html.
--port picks the Chrome debugging port (use your own so parallel runs do not collide)."""
import subprocess, time, os, sys, json, urllib.request, urllib.parse, argparse, tempfile
ap = argparse.ArgumentParser(); ap.add_argument('room'); ap.add_argument('out'); ap.add_argument('--tag', default=''); ap.add_argument('--port', type=int, default=9333)
ap.add_argument('--hour', default=''); ap.add_argument('--turn', type=float, default=0); ap.add_argument('--w', type=int, default=1600); ap.add_argument('--h', type=int, default=900); ap.add_argument('--wait', type=float, default=6); ap.add_argument('--at', default=''); ap.add_argument('--eval', default=''); ap.add_argument('--yaw', default=''); ap.add_argument('--pitch', default='')
a = ap.parse_args()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import websocket
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
prof = tempfile.mkdtemp(prefix=f'shot-{a.port}-')
chrome = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={a.port}", f"--window-size={a.w},{a.h}", "--user-data-dir=" + prof, "--use-angle=metal", "--disable-extensions", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
HOST = f'http://127.0.0.1:{a.port}'
for _ in range(80):
    try: urllib.request.urlopen(HOST + "/json/version"); break
    except Exception: time.sleep(0.25)
page = f"museum.{a.tag}.html" if a.tag else "museum.html"
extra = (f"&at={a.at}" if a.at else '') + (f"&yaw={a.yaw}" if a.yaw else '') + (f"&pitch={a.pitch}" if a.pitch else '')
url = f"http://127.0.0.1:4185/{page}?auto=1&debug=1{'&hour=' + a.hour if a.hour else ''}{extra}&v={int(time.time())}#room={a.room}&hang=place"
try:
    r = json.load(urllib.request.urlopen(urllib.request.Request(f'{HOST}/json/new?{urllib.parse.quote(url, safe="")}', method='PUT')))
    ws = websocket.create_connection(r['webSocketDebuggerUrl'], max_size=None, suppress_origin=True); n = [0]
    def send(method, **params):
        n[0] += 1; ws.send(json.dumps({'id': n[0], 'method': method, 'params': params}))
        while True:
            m = json.loads(ws.recv())
            if m.get('id') == n[0]: return m.get('result', {})
    send('Page.enable'); send('Runtime.enable')
    send('Emulation.setDeviceMetricsOverride', width=a.w, height=a.h, deviceScaleFactor=1, mobile=False)
    time.sleep(a.wait)
    if a.turn:
        send('Runtime.evaluate', expression=f"(()=>{{const m=window.__museum;if(!m)return 'no museum';m.camera.rotation.y+={a.turn}*Math.PI/180;return 'turned'}})()", returnByValue=True)
        time.sleep(1.2)
    info = send('Runtime.evaluate', expression="(()=>{const m=window.__museum;if(!m)return 'no museum';const d=document.querySelector('#debug');return JSON.stringify({room:m.ROOMS[m.state.room].id,stats:d?d.textContent:'',mounts:m.build&&m.build.mounts.length})})()", returnByValue=True).get('result', {}).get('value')
    errs = send('Runtime.evaluate', expression="JSON.stringify((window.__errors||[]).slice(0,5))", returnByValue=True).get('result', {}).get('value')
    import base64
    shot = send('Page.captureScreenshot', format='png', fromSurface=True)
    open(a.out, 'wb').write(base64.b64decode(shot['data']))
    print('saved', a.out, info, 'errors', errs)
finally:
    chrome.terminate()
