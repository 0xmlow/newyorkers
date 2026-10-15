#!/usr/bin/env python3
"""rig.py: frame exact capture of BREAK GLASS.

Headless Chrome loads the piece with a virtual clock (performance.now and requestAnimationFrame replaced
before the bundle runs) and window.__FILM set, so the piece only moves when we tick it and exposes its
film hooks. renderer.render is wrapped so window.__cam = {p, l, fov, roll} puts the camera anywhere.
A director script (film.js) is injected after load; it owns the cue sheet, the camera rigs, the type
overlay and the piece's events, all as functions of film time. JPEG grabs go straight into ffmpeg.
"""
import subprocess, time, os, sys, json, urllib.request, tempfile, base64, shutil, socket
import numpy as np, cv2
sys.path.insert(0, "/Users/degens/Desktop/NEW YORKERS BY MLOW/NEW YORKERS SITE/_build/museum")
import websocket

HERE = os.path.dirname(os.path.abspath(__file__))
PIECE = "/Users/degens/Desktop/NEW YORKERS BY MLOW/BREAK GLASS 1 OF 1 2026-10-15/site"
STAGE = "/private/tmp/claude-501/-Users-degens-Desktop-NEW-YORKERS-BY-MLOW/14917f2a-a913-4deb-a583-7416d413bd06/scratchpad/filmstage"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

SHIM = r"""
(() => {
  const realRAF = window.requestAnimationFrame.bind(window);
  let vt = 0, cbs = [];
  performance.now = () => vt;
  window.requestAnimationFrame = (cb) => { cbs.push(cb); return cbs.length; };
  window.cancelAnimationFrame = () => {};
  window.__realRAF = realRAF; window.__vt = () => vt; window.__FILM = true;
  window.__tick = (dt) => { vt += dt * 1000; const c = cbs; cbs = []; for (const f of c) f(vt); };
  // seeded random, so a take can be repeated
  let s = 20261015; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
})();
"""

HOOK = r"""
(() => {
  const T = window.__breakglass._three, R = T.renderer, orig = R.render.bind(R);
  window.__cam = null;
  R.render = (scene, cam) => {
    const c = window.__cam;
    if (c) { cam.position.set(c.p[0], c.p[1], c.p[2]); cam.up.set(0, 1, 0); cam.lookAt(c.l[0], c.l[1], c.l[2]); if (c.roll) cam.rotateZ(c.roll); cam.fov = c.fov || 36; cam.updateProjectionMatrix(); }
    orig(scene, cam);
  };
  const st = document.createElement('style');
  st.textContent = '#top,#hint,#card,#pulls,#flash{display:none!important}';
  document.head.appendChild(st);
})();
"""

def _free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p

class Rig:
    def __init__(self, size=(1920, 1080), extra_js=None):
        self.size = size
        os.makedirs(STAGE, exist_ok=True)
        shutil.copy2(os.path.join(PIECE, "index.html"), os.path.join(STAGE, "index.html"))
        self.http = _free_port(); self.port = _free_port()
        self.srv = subprocess.Popen([sys.executable, "-I", "-c", f"import os,http.server;os.chdir({STAGE!r});http.server.ThreadingHTTPServer(('127.0.0.1',{self.http}),http.server.SimpleHTTPRequestHandler).serve_forever()"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.prof = tempfile.mkdtemp(prefix='bgf-')
        self.chrome = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={self.port}", f"--window-size={size[0]},{size[1]}",
            "--user-data-dir=" + self.prof, "--use-angle=metal", "--enable-gpu-rasterization", "--mute-audio", "--disk-cache-size=1",
            "--disable-component-update", "--no-first-run", "--hide-scrollbars", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        host = f'http://127.0.0.1:{self.port}'
        for _ in range(100):
            try: urllib.request.urlopen(host + "/json/version"); break
            except Exception: time.sleep(0.2)
        r = json.load(urllib.request.urlopen(urllib.request.Request(f'{host}/json/new?about:blank', method='PUT')))
        self.ws = websocket.create_connection(r['webSocketDebuggerUrl'], max_size=None, suppress_origin=True, timeout=180); self.n = 0; self.logs = []
        self.send('Page.enable'); self.send('Runtime.enable')
        self.send('Emulation.setDeviceMetricsOverride', width=size[0], height=size[1], deviceScaleFactor=1, mobile=False)
        self.send('Page.addScriptToEvaluateOnNewDocument', source=SHIM)
        self.send('Page.navigate', url=f"http://127.0.0.1:{self.http}/index.html")
        for _ in range(240):
            time.sleep(0.25)
            try:
                if self.ev("!!(window.__breakglass && window.__breakglass.film)"): break
            except Exception: pass
        self.ev(HOOK)
        if extra_js: self.ev(open(extra_js).read() if os.path.exists(extra_js) else extra_js)
        for _ in range(6): self.ev("window.__tick(1/30)")   # compile shaders

    def send(self, method, **params):
        self.n += 1; mid = self.n; self.ws.send(json.dumps({'id': mid, 'method': method, 'params': params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get('method') == 'Runtime.exceptionThrown': self.logs.append('EXC ' + str(m['params']['exceptionDetails'].get('exception', {}).get('description', m['params']['exceptionDetails'].get('text')))[:300])
            if m.get('id') == mid:
                if 'error' in m: raise RuntimeError(f"{method}: {m['error']}")
                return m.get('result', {})

    def ev(self, js):
        r = self.send('Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
        if 'exceptionDetails' in r: raise RuntimeError(r['exceptionDetails'].get('exception', {}).get('description') or r['exceptionDetails'].get('text'))
        return r.get('result', {}).get('value')

    def grab(self):
        self.ev("new Promise(r=>window.__realRAF(()=>window.__realRAF(r)))")
        r = self.send('Page.captureScreenshot', format='jpeg', quality=95, fromSurface=True)
        img = cv2.imdecode(np.frombuffer(base64.b64decode(r['data']), np.uint8), cv2.IMREAD_COLOR)
        return img   # BGR

    def close(self):
        for p in (self.chrome, self.srv):
            try: p.kill()
            except Exception: pass
        time.sleep(0.3); shutil.rmtree(self.prof, ignore_errors=True)

class Writer:
    def __init__(self, path, size=(1920, 1080), fps=30, crf=16):
        self.p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{size[0]}x{size[1]}', '-r', str(fps), '-i', '-',
            '-c:v', 'libx264', '-crf', str(crf), '-preset', 'fast', '-g', '15', '-pix_fmt', 'yuv420p', path], stdin=subprocess.PIPE)
    def write(self, frame): self.p.stdin.write(np.ascontiguousarray(frame).tobytes())
    def close(self): self.p.stdin.close(); self.p.wait()

if __name__ == '__main__':
    # probe cameras: python3 rig.py out.jpg '[[px,py,pz],[lx,ly,lz],fov]' ...
    out = sys.argv[1]; cams = [json.loads(a) for a in sys.argv[2:]]
    g = Rig(size=(960, 540))
    try:
        tiles = []
        for c in cams:
            g.ev(f"window.__cam={{p:{c[0]},l:{c[1]},fov:{c[2]}}}")
            for _ in range(3): g.ev("window.__tick(1/30)")
            tiles.append(g.grab())
        while len(tiles) % 2: tiles.append(np.zeros_like(tiles[0]))
        rows = [np.hstack(tiles[i:i + 2]) for i in range(0, len(tiles), 2)]
        cv2.imwrite(out, np.vstack(rows))
        for l in dict.fromkeys(g.logs): print(l)
    finally: g.close()
