#!/usr/bin/env python3
"""shot_room.py <room id> <out.png> [--tag T] [--port 93xx] [--hour 14] [--turn deg] [--w 1600 --h 900]
Screenshot a room from its spawn (or --at x,y,z --yaw deg --pitch deg) in headless Chrome against the local server on :4185.
--tag opens museum.<tag>.html (see build_variant.mjs) instead of museum.html.
--port picks the Chrome debugging port (use your own so parallel runs do not collide)."""
import subprocess, time, os, sys, json, urllib.request, urllib.parse, argparse, tempfile
ap = argparse.ArgumentParser(); ap.add_argument('room'); ap.add_argument('out'); ap.add_argument('--tag', default=''); ap.add_argument('--port', type=int, default=9333)
ap.add_argument('--hour', default=''); ap.add_argument('--turn', type=float, default=0); ap.add_argument('--w', type=int, default=1600); ap.add_argument('--h', type=int, default=900); ap.add_argument('--wait', type=float, default=6); ap.add_argument('--at', default=''); ap.add_argument('--eval', default=''); ap.add_argument('--yaw', default=''); ap.add_argument('--pitch', default=''); ap.add_argument('--mobile', action='store_true', help='390 x 844 at 3x with touch, so the page takes its phone path'); ap.add_argument('--landscape', action='store_true', help='with --mobile: the phone on its side, 844 x 390'); ap.add_argument('--egg', default='', help='walk to four metres from this egg id, facing it, before the shot')
a = ap.parse_args()
if a.mobile: a.w, a.h = (844, 390) if a.landscape else (390, 844)
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
    # open blank, emulate, then navigate: the page reads pointer: coarse and its width at load
    r = json.load(urllib.request.urlopen(urllib.request.Request(f'{HOST}/json/new?about:blank', method='PUT')))
    ws = websocket.create_connection(r['webSocketDebuggerUrl'], max_size=None, suppress_origin=True); n = [0]
    def send(method, **params):
        n[0] += 1; ws.send(json.dumps({'id': n[0], 'method': method, 'params': params}))
        while True:
            m = json.loads(ws.recv())
            if m.get('id') == n[0]: return m.get('result', {})
    send('Page.enable'); send('Runtime.enable')
    send('Emulation.setDeviceMetricsOverride', width=a.w, height=a.h, deviceScaleFactor=3 if a.mobile else 1, mobile=a.mobile)
    if a.mobile:
        send('Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=5)
        send('Emulation.setEmitTouchEventsForMouse', enabled=True, configuration='mobile')
    send('Page.navigate', url=url)
    time.sleep(a.wait)
    if a.egg:
        js = "(()=>{const m=window.__museum;const e=m.kit&&m.kit.eggs.find(x=>x.data.id==%s);if(!e)return 'no egg';const c=m.camera.position;const d=c.clone().sub(e.center);d.y=0;if(d.lengthSq()<1e-4)d.set(0,0,1);d.normalize();return m.walkTo(e.center.clone().addScaledVector(d,4),e.center)?'walked':'no stand'})()" % json.dumps(a.egg)
        print('egg', send('Runtime.evaluate', expression=js, returnByValue=True).get('result', {}).get('value'))
        time.sleep(4)
    if a.turn:
        send('Runtime.evaluate', expression=f"(()=>{{const m=window.__museum;if(!m)return 'no museum';m.camera.rotation.y+={a.turn}*Math.PI/180;return 'turned'}})()", returnByValue=True)
        time.sleep(1.2)
    if a.eval:
        r = send('Runtime.evaluate', expression=a.eval, returnByValue=True, awaitPromise=True)
        print('eval', r.get('result', {}).get('value'), r.get('exceptionDetails', {}).get('text', ''))
    info = send('Runtime.evaluate', expression="(()=>{const m=window.__museum;if(!m)return 'no museum';const d=document.querySelector('#debug');return JSON.stringify({room:m.ROOMS[m.state.room].id,stats:d?d.textContent:'',mounts:m.build&&m.build.mounts.length,eggs:m.kit?m.kit.eggs.map(e=>e.data.id):[],touch:document.body.classList.contains('touch')})})()", returnByValue=True).get('result', {}).get('value')
    errs = send('Runtime.evaluate', expression="JSON.stringify((window.__errors||[]).slice(0,5))", returnByValue=True).get('result', {}).get('value')
    import base64
    shot = send('Page.captureScreenshot', format='png', fromSurface=True)
    open(a.out, 'wb').write(base64.b64decode(shot['data']))
    print('saved', a.out, info, 'errors', errs)
finally:
    chrome.terminate()
    # the profile is junk once Chrome is gone; 184 of them once ate 8 GB of the disk
    try: chrome.wait(timeout=10)
    except Exception: pass
    import shutil; shutil.rmtree(prof, ignore_errors=True)
