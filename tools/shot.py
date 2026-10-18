#!/usr/bin/env python3
"""shot.py out_dir name=query [name=query ...] [--eval JS] [--wait s]
Headless Chrome against site/ served on :4230. Each name=query opens index.html?auto=1&nolock&<query>,
waits, optionally runs JS, and writes <out_dir>/<name>.png. Console errors are printed."""
import subprocess, time, os, sys, json, urllib.request, tempfile, base64, argparse
import websocket
ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('shots', nargs='+'); ap.add_argument('--wait', type=float, default=7); ap.add_argument('--eval', default=''); ap.add_argument('--w', type=int, default=1600); ap.add_argument('--h', type=int, default=900); ap.add_argument('--port', type=int, default=9341); ap.add_argument('--site', default=''); ap.add_argument('--page', default='index.html?auto=1&nolock&'); ap.add_argument('--http', type=int, default=4230); ap.add_argument('--mobile', action='store_true')
a = ap.parse_args();
if a.eval.startswith('@'): a.eval = open(a.eval[1:]).read()
os.makedirs(a.out, exist_ok=True)
SITE = a.site or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "site")
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(a.http), "--bind", "127.0.0.1", "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
prof = tempfile.mkdtemp(prefix='pigeonhole-')
chrome = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={a.port}", f"--window-size={a.w},{a.h}", "--user-data-dir=" + prof, "--use-angle=metal", "--autoplay-policy=no-user-gesture-required", "--disk-cache-size=1", "--disable-gpu-shader-disk-cache", "--disk-cache-dir=" + prof, "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
HOST = f'http://127.0.0.1:{a.port}'
for _ in range(80):
    try: urllib.request.urlopen(HOST + "/json/version"); break
    except Exception: time.sleep(0.25)
try:
    r = json.load(urllib.request.urlopen(urllib.request.Request(f'{HOST}/json/new?about:blank', method='PUT')))
    ws = websocket.create_connection(r['webSocketDebuggerUrl'], timeout=90, max_size=None, suppress_origin=True); n = [0]; logs = []
    def send(method, **params):
        n[0] += 1; ws.send(json.dumps({'id': n[0], 'method': method, 'params': params}))
        while True:
            m = json.loads(ws.recv())
            if m.get('method') == 'Runtime.exceptionThrown': logs.append('EXC ' + json.dumps(m['params']['exceptionDetails'].get('exception', {}).get('description', m['params']['exceptionDetails'].get('text')))[:400])
            if m.get('method') == 'Runtime.consoleAPICalled' and m['params']['type'] in ('error', 'warning'): logs.append(m['params']['type'] + ' ' + ' '.join(str(x.get('value', x.get('description', '')))[:300] for x in m['params']['args']))
            if m.get('method') == 'Log.entryAdded' and m['params']['entry']['level'] == 'error': logs.append('LOG ' + m['params']['entry']['text'][:300] + ' ' + m['params']['entry'].get('url', ''))
            if m.get('id') == n[0]: return m.get('result', m.get('error', {}))
    send('Page.enable'); send('Runtime.enable'); send('Log.enable')
    send('Emulation.setDeviceMetricsOverride', width=a.w, height=a.h, deviceScaleFactor=3 if a.mobile else 1, mobile=a.mobile)
    if a.mobile: send('Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=5); send('Emulation.setEmitTouchEventsForMouse', enabled=True)
    for s in a.shots:
        name, q = s.split('=', 1)
        send('Page.navigate', url=f"http://127.0.0.1:{a.http}/{a.page}{q}&v={time.time()}")
        time.sleep(a.wait)
        if a.eval: _r = send('Runtime.evaluate', expression=a.eval, returnByValue=True, awaitPromise=True, timeout=600000); print(name, 'eval:', _r.get('result', {}).get('value', _r)); open(os.path.join(a.out, name+'-evidence.json'),'w').write(str(_r.get('result', {}).get('value', json.dumps(_r))))
        time.sleep(0.5)
        png = send('Page.captureScreenshot', format='png')['data']; open(os.path.join(a.out, name + '.png'), 'wb').write(base64.b64decode(png)); print('shot', name)
    for l in dict.fromkeys(logs): print(l)
finally:
    chrome.kill(); srv.kill(); time.sleep(0.5); __import__('shutil').rmtree(prof, ignore_errors=True)   # a profile is 50 to 100 MB and the disk is nearly full
