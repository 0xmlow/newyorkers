#!/usr/bin/env python3
"""shots.py: fixed camera views of every room, headless Chrome, for before and after pairs.
  python3 checks/shots.py OUT_DIR SUFFIX [view ...] [--http 4302] [--port 9402] [--query look=0] [--mobile]
Needs site/ served on --http (python3 -m http.server 4302 -d site). Each view is placed with the overview camera
(the walk camera rewrites its own rotation every frame), so the same script shoots any version of the gallery.
Writes OUT_DIR/<view>-<SUFFIX>.png and prints console errors and the frame time."""
import subprocess, time, os, sys, json, urllib.request, tempfile, base64, argparse, shutil
import websocket

VIEWS = {  # name: (room, eye, target)
    'store-1': ('walk', (0, 1.72, 7.6), (0, 1.55, -4)),
    'store-2': ('walk', (0.2, 1.85, 7.2), (4.2, 1.45, 3.6)),
    'store-3': ('walk', (-1.2, 2.0, 17.5), (0, 2.4, 6)),
    'store-4': ('walk', (19, 12, 24), (-3, 1, -1)),
    'archive-1': ('archive', (0, 1.72, -14), (0, 1.72, -30)),
    'archive-2': ('archive', (-3.5, 1.9, -24), (0, 2.3, -33)),
    'laundry-1': ('laundry', (-34, 1.72, 4.6), (-34, 1.5, -5)),
    'laundry-2': ('laundry', (-30.6, 1.6, 0.8), (-36.5, 1.15, -4.6)),
    'mail-1': ('mail', (34, 1.72, 5.4), (34, 1.8, -6)),
    'mail-2': ('mail', (36.4, 1.75, 3.2), (31.6, 1.35, -0.3)),
    'roof-1': ('roof', (0, 1.72, 44.2), (0, 1.6, 30)),
    'roof-2': ('roof', (2.8, 1.85, 41.2), (0, 1.3, 37.5)),
    'store-5': ('walk', (-4.7, 1.65, 8.3), (-5.8, 1.55, 6.3)),
    'store-6': ('walk', (1.5, 1.7, -1), (-2.5, 3.2, 8)),
    'laundry-3': ('laundry', (-29.5, 1.72, -2.35), (-35, .35, -2.35)),
    'mail-3': ('mail', (31.2, 1.6, 4.6), (35.5, 2.6, -2)),
    'roof-3': ('roof', (.6, 1.7, 40.4), (-2.6, .9, 43.6)),
}
ap = argparse.ArgumentParser()
ap.add_argument('out'); ap.add_argument('suffix'); ap.add_argument('views', nargs='*')
ap.add_argument('--http', type=int, default=4302); ap.add_argument('--port', type=int, default=9402)
ap.add_argument('--query', default=''); ap.add_argument('--w', type=int, default=1600); ap.add_argument('--h', type=int, default=900)
ap.add_argument('--mobile', action='store_true'); ap.add_argument('--wait', type=float, default=4)
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
names = a.views or list(VIEWS)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
prof = tempfile.mkdtemp(prefix='bodega-shot-')
chrome = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={a.port}", f"--window-size={a.w},{a.h}",
                           "--user-data-dir=" + prof, "--use-angle=metal", "--enable-unsafe-swiftshader", "about:blank"],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
HOST = f'http://127.0.0.1:{a.port}'
for _ in range(80):
    try: urllib.request.urlopen(HOST + "/json/version"); break
    except Exception: time.sleep(0.25)
try:
    r = json.load(urllib.request.urlopen(urllib.request.Request(f'{HOST}/json/new?about:blank', method='PUT')))
    ws = websocket.create_connection(r['webSocketDebuggerUrl'], max_size=None, suppress_origin=True); n = [0]; logs = []
    def send(method, **params):
        n[0] += 1; ws.send(json.dumps({'id': n[0], 'method': method, 'params': params}))
        while True:
            m = json.loads(ws.recv())
            if m.get('method') == 'Runtime.exceptionThrown': logs.append('EXC ' + json.dumps(m['params']['exceptionDetails'].get('exception', {}).get('description', m['params']['exceptionDetails'].get('text')))[:400])
            if m.get('method') == 'Runtime.consoleAPICalled' and m['params']['type'] in ('error', 'warning'): logs.append(m['params']['type'] + ' ' + ' '.join(str(x.get('value', x.get('description', '')))[:300] for x in m['params']['args']))
            if m.get('method') == 'Log.entryAdded' and m['params']['entry']['level'] == 'error': logs.append('LOG ' + m['params']['entry']['text'][:300] + ' ' + m['params']['entry'].get('url', ''))
            if m.get('id') == n[0]: return m.get('result', {})
    ev = lambda js: send('Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True).get('result', {}).get('value')
    send('Page.enable'); send('Runtime.enable'); send('Log.enable')
    send('Emulation.setDeviceMetricsOverride', width=(390 if a.mobile else a.w), height=(844 if a.mobile else a.h), deviceScaleFactor=(2 if a.mobile else 1), mobile=a.mobile)
    if a.mobile: send('Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=5)
    send('Page.navigate', url=f"http://127.0.0.1:{a.http}/index.html?{a.query}&v={time.time()}")
    for _ in range(240):
        time.sleep(0.5)
        if ev("!!(window.__bodega&&window.__bodega.expansion)"): break
    ev("window.__bodega.expansion.allReady")
    ev("document.head.insertAdjacentHTML('beforeend','<style>header,footer,#place,#crosshair,#interact,#toast,#walk-help,#intro,#touch-controls{display:none!important}</style>');window.__POWER.blurred=false;1")
    for name in names:
        room, eye, tgt = VIEWS[name]
        ev(f"window.__bodega.go('overview');1"); time.sleep(1.4)
        ev(f"""(()=>{{const b=window.__bodega;b.expansion.setRoom('{room}');const md='{name}'==='store-4'?'overview':'walk';if(b.upgrade)b.upgrade.room('{room}',md);if(b.look)b.look.room('{room}',b.upgrade&&b.upgrade.ready('{room}'));b.camera.position.set({eye[0]},{eye[1]},{eye[2]});b.camera.lookAt({tgt[0]},{tgt[1]},{tgt[2]});window.__POWER.blurred=false;return 1}})()""")
        time.sleep(a.wait)
        ft = ev("new Promise(r=>{const f0=window.__POWER.frames,t0=performance.now();setTimeout(()=>r(Math.round((performance.now()-t0)/Math.max(1,window.__POWER.frames-f0))),2000)})")
        png = send('Page.captureScreenshot', format='png')['data']
        open(os.path.join(a.out, f'{name}-{a.suffix}.png'), 'wb').write(base64.b64decode(png)); info = ev("new Promise(res=>{const r=window.__bodega.renderer,P=window.__POWER;r.info.autoReset=false;r.info.reset();const f0=P.frames;setTimeout(()=>{const n=Math.max(1,P.frames-f0),i=r.info.render;res(Math.round(i.calls/n)+' calls, '+Math.round(i.triangles/n/1000)+'k tris a frame');r.info.autoReset=true},600)})")
        print('shot', name, f'{ft} ms/frame', info)
    print('errors', ev("JSON.stringify((window.__bodega.expansion.errors||[]).concat(window.__bodega.assetErrors||[]))"))
    for l in dict.fromkeys(logs): print(l)
finally:
    chrome.kill(); time.sleep(0.5); shutil.rmtree(prof, ignore_errors=True)
