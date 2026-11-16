#!/usr/bin/env python3
"""perf.py [--rooms a,b] [--walk] [--mobile] [--site DIR]: what the gallery costs, measured in headless Chrome on Metal
(never SwiftShader, which measures the CPU and not the GPU). One fresh Chrome per room, one at a time.
Per room: seconds until the Swipe in button wakes, the files and megabytes fetched by then, frames a second over four
seconds with the power throttle held awake, the frame time p50 / p95 / worst, draw calls and triangles for one whole
frame (every pass), and the milliseconds one bare scene render takes to finish on the GPU.
--walk instead opens the first room and jumps through every room in order, three seconds each, and reports the
worst frame and the frames over 50 ms after each jump: the hitch you feel walking through a door.
--glide walks instead of jumping: the visitor slides from the middle of each room through the door to the middle of the
next at running pace (6.7 m/s, three seconds a room), which is what a person actually does."""
import subprocess, time, os, sys, json, urllib.request, tempfile, argparse, re, shutil
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "NEW YORKERS SITE", "_build", "museum"))
import websocket
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--rooms', default=''); ap.add_argument('--walk', action='store_true'); ap.add_argument('--glide', action='store_true'); ap.add_argument('--mobile', action='store_true')
ap.add_argument('--site', default=os.path.join(os.path.dirname(HERE), 'site')); ap.add_argument('--http', type=int, default=4288); ap.add_argument('--port', type=int, default=9388)
ap.add_argument('--q', default=''); ap.add_argument('--json', default='')
a = ap.parse_args()
IDS = re.findall(r"\{ id: '(\w+)'", open(os.path.join(HERE, 'src', 'rooms.js')).read())
rooms = a.rooms.split(',') if a.rooms else IDS
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(a.http), "-d", a.site], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
W, H = (390, 844) if a.mobile else (1440, 900)
PROBE = r"""(async () => {
  const P = window.__POWER, R = window.__renderer, gl = R.getContext();
  const awake = setInterval(() => { P.last = performance.now(); P.blurred = false; }, 100);
  const ts = []; let on = true; const f = (t) => { ts.push(t); if (on) requestAnimationFrame(f); }; requestAnimationFrame(f);
  const f0 = P.frames; await new Promise((r) => setTimeout(r, 4000)); on = false; const drawn = P.frames - f0;
  const dts = ts.slice(1).map((t, i) => t - ts[i]).sort((x, y) => x - y), q = (p) => dts[Math.min(dts.length - 1, Math.floor(p * dts.length))] || 0;
  R.info.autoReset = false; R.info.reset(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const calls = R.info.render.calls, tris = R.info.render.triangles; R.info.autoReset = true;
  const px = new Uint8Array(4), S = window.__scene, C = window.__camera; R.setRenderTarget(null);
  for (let i = 0; i < 3; i++) { R.render(S, C); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
  const t0 = performance.now(); for (let i = 0; i < 10; i++) { R.render(S, C); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } const scene = (performance.now() - t0) / 10;
  clearInterval(awake);
  return { fps: +(drawn / 4).toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), worst: +q(1).toFixed(1), calls, tris, scene_ms: +scene.toFixed(1),
    geos: R.info.memory.geometries, texs: R.info.memory.textures, progs: R.info.programs.length, heap_mb: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null };
})()"""
LOADED = r"""(() => { const e = performance.getEntriesByType('resource'); return { files: e.length, mb: +(e.reduce((s, x) => s + (x.encodedBodySize || x.transferSize || 0), 0) / 1e6).toFixed(1) }; })()"""
WALK = r"""(async () => {
  const out = [], N = window.__ROOMS.length, P = window.__POWER;
  const awake = setInterval(() => { P.last = performance.now(); P.blurred = false; }, 100);
  for (let i = 0; i < N; i++) {
    const ts = []; let on = true; const f = (t) => { ts.push(t); if (on) requestAnimationFrame(f); };
    const t0 = performance.now(); window.__go(i); requestAnimationFrame(f);
    await new Promise((r) => setTimeout(r, 3000)); on = false;
    const dts = ts.slice(1).map((t, k) => t - ts[k]);
    out.push({ room: window.__ROOMS[i].id, first_ms: +((ts[0] || t0) - t0).toFixed(0), worst: +Math.max(0, ...dts).toFixed(0), over50: dts.filter((d) => d > 50).length, fps: +(dts.length / 3).toFixed(1) });
  }
  clearInterval(awake); return out;
})()"""
GLIDE = r"""(async () => {
  const out = [], R = window.__ROOMS, N = R.length, P = window.__POWER, V = window.__P, W = 20;
  const gl = window.__renderer.getContext(), C = { tex: [], buf: 0, bufB: 0, link: 0, comp: 0 };
  const lab = (a) => { for (const x of a) if (x && typeof x === 'object' && (x.src || x.width)) return (x.src ? x.src.split('/').slice(-2).join('/') : x.constructor.name + ' ' + x.width + 'x' + x.height); return 'data'; };
  for (const f of ['texImage2D', 'texSubImage2D', 'texStorage2D', 'compressedTexImage2D']) { const o = gl[f].bind(gl); gl[f] = (...a) => { if (f !== 'texStorage2D') C.tex.push(f[3] + ':' + lab(a)); return o(...a); }; }
  { const o = gl.bufferData.bind(gl); gl.bufferData = (...a) => { C.buf++; C.bufB += a[1]?.byteLength || 0; return o(...a); }; }
  { const o = gl.linkProgram.bind(gl); gl.linkProgram = (...a) => { C.link++; return o(...a); }; }
  const big = []; let progs = new Set(window.__renderer.info.programs);
  const keyDiff = (a, b) => { const A = a.split(','), B = b.split(','); const d = []; for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) d.push(i + ':' + A[i] + '/' + B[i]); return d.slice(0, 6).join(' '); };
  const awake = setInterval(() => { P.last = performance.now(); P.blurred = false; }, 100);
  for (let i = 0; i < N - 1; i++) {
    const ts = []; const x0 = i * W + W / 2, x1 = x0 + W, t0 = performance.now();
    await new Promise((res) => { const f = (t) => { if (ts.length && t - ts[ts.length - 1] > 50 && big.length < 40) big.push({ at: R[i].id, ms: Math.round(t - ts[ts.length - 1]), newp: window.__renderer.info.programs.filter((q) => !progs.has(q)).slice(0, 3).map((q) => { const old = [...progs].filter((o) => o.name === q.name); const best = old.map((o) => keyDiff(q.cacheKey, o.cacheKey)).sort((x, y) => x.length - y.length)[0]; return q.name + ' | ' + (best ?? 'no old program with this name'); }), links: C.link, bufs: C.buf, bufMB: +(C.bufB / 1e6).toFixed(1), texN: C.tex.length, tex: [...new Set(C.tex)].slice(0, 14) }); C.tex = []; C.buf = C.bufB = C.link = 0; progs = new Set(window.__renderer.info.programs); ts.push(t); const u = Math.min(1, (t - t0) / 3000); V.x = x0 + (x1 - x0) * u; V.z = 3.2; V.yaw = -Math.PI / 2; if (u < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    const dts = ts.slice(1).map((t, k) => t - ts[k]);
    out.push({ room: R[i].id + '>' + R[i + 1].id, first_ms: 0, worst: +Math.max(0, ...dts).toFixed(0), over50: dts.filter((d) => d > 50).length, fps: +(dts.length / 3).toFixed(1) });
  }
  clearInterval(awake); return { out, slow: big.concat((window.__SLOW || []).filter((x) => x.ms > 90)) };
})()"""
def chrome_session(url, fn):
    prof = tempfile.mkdtemp(prefix='perf-')
    ch = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={a.port}", f"--window-size={W},{H}", "--user-data-dir=" + prof, "--use-angle=metal",
                           "--enable-precise-memory-info", "--disable-gpu-shader-disk-cache", "--disk-cache-dir=/dev/null", "--autoplay-policy=no-user-gesture-required", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    host = f'http://127.0.0.1:{a.port}'
    try:
        for _ in range(80):
            try: urllib.request.urlopen(host + "/json/version"); break
            except Exception: time.sleep(0.25)
        r = json.load(urllib.request.urlopen(urllib.request.Request(f'{host}/json/new?about:blank', method='PUT')))
        ws = websocket.create_connection(r['webSocketDebuggerUrl'], max_size=None, suppress_origin=True); n = [0]; errs = []
        def send(m, **p):
            n[0] += 1; ws.send(json.dumps({'id': n[0], 'method': m, 'params': p}))
            while True:
                x = json.loads(ws.recv())
                if x.get('method') == 'Runtime.exceptionThrown': errs.append(str(x['params']['exceptionDetails'].get('exception', {}).get('description', ''))[:200])
                if x.get('id') == n[0]: return x.get('result', {})
        def ev(js, timeout=60):
            ws.settimeout(timeout + 10); r = send('Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True, timeout=timeout * 1000)
            return r.get('result', {}).get('value')
        send('Page.enable'); send('Runtime.enable')
        send('Emulation.setDeviceMetricsOverride', width=W, height=H, deviceScaleFactor=3 if a.mobile else 2, mobile=a.mobile)
        if a.mobile: send('Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=5)
        t0 = time.time(); send('Page.navigate', url=url)
        ready = None
        while time.time() - t0 < 40:
            time.sleep(0.25)
            if ev("!!(window.__P && document.querySelector('#go') && !document.querySelector('#go').disabled)", 5): ready = round(time.time() - t0, 1); break
        return fn(ev, ready), errs
    finally:
        ch.kill(); time.sleep(0.4); shutil.rmtree(prof, ignore_errors=True)
res = []
try:
    if a.walk or a.glide:
        out, errs = chrome_session(f"http://127.0.0.1:{a.http}/index.html?auto=1&nolock&{a.q}&v={time.time()}", lambda ev, ready: (time.sleep(6), ev(GLIDE if a.glide else WALK, 120))[1])
        if isinstance(out, dict): slow = out['slow']; out = out['out']; [print('  SLOW', x) for x in slow]
        for o in out: print(f"{o['room']:10} first frame {o['first_ms']:5} ms  worst {o['worst']:5} ms  over 50 ms {o['over50']:3}  {o['fps']} fps", flush=True)
        res = out
    else:
        print(f"{'room':10} ready  files    MB   fps   p50   p95  worst  calls     tris  scene_ms texs progs heap", flush=True)
        for rid in rooms:
            def fn(ev, ready):
                ld = ev(LOADED); time.sleep(3); p = ev(PROBE, 30) or {}
                return dict(room=rid, ready=ready, **(ld or {}), **p)
            o, errs = chrome_session(f"http://127.0.0.1:{a.http}/index.html?auto=1&nolock&room={rid}&{a.q}&v={time.time()}", fn)
            print(f"{rid:10} {o.get('ready')!s:>5} {o.get('files','?'):>6} {o.get('mb','?'):>5} {o.get('fps','?'):>5} {o.get('p50','?'):>5} {o.get('p95','?'):>5} {o.get('worst','?'):>6} {o.get('calls','?'):>6} {o.get('tris','?'):>8} {o.get('scene_ms','?'):>8} {o.get('texs','?'):>4} {o.get('progs','?'):>5} {o.get('heap_mb','?')}" + (f"  ERR {errs[:1]}" if errs else ''), flush=True)
            res.append(o)
    if a.json: json.dump(res, open(a.json, 'w'), indent=1)
finally:
    srv.kill()
