#!/usr/bin/env python3
"""audit_walk.py [--site dir] [--rooms a,b,c] [--out work/audit_walk.json]
Can you walk every set? Each set is loaded on its own in headless Chrome (a fresh browser every six sets, since one
browser fails shader validation after about ten loads), then the floor is flood filled on a 10 cm grid from the spawn
point with the engine's own colliders (window.__colliders, radius 0.32 like collide()) and the skate park's surfaces
(the walk refuses a step up of more than 0.3 m, like the walk loop). For every set it reports whether the west and the
east door can be reached, and the narrowest squeeze on the widest route to each, so a set that is technically open but
needs a 70 cm gap behind a prop is caught too. Non zero exit when a door is unreachable or a route is under 1.0 m."""
import json, os, re, subprocess, sys, time, tempfile, urllib.request, argparse, concurrent.futures as cf, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), "NEW YORKERS SITE", "_build", "museum"))
import websocket
ap = argparse.ArgumentParser(); ap.add_argument('--site', default=os.path.join(ROOT, 'site')); ap.add_argument('--rooms', default='')
ap.add_argument('--out', default=os.path.join(ROOT, 'work', 'audit_walk.json')); ap.add_argument('--http', type=int, default=4290); ap.add_argument('--port', type=int, default=9390)
ap.add_argument('--batch', type=int, default=6); ap.add_argument('--workers', type=int, default=3); ap.add_argument('--min', type=float, default=1.0)
a = ap.parse_args()
IDS = re.findall(r"\{ id: '(\w+)'", open(os.path.join(HERE, "src", "rooms.js")).read())
if a.rooms: IDS = [i for i in a.rooms.split(',') if i in IDS]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

READY = "(() => { const R = __ROOMS.find((r) => r.id === %r); return !!(R && R.built && !(R.loadingN > 0) && __PARK.PARK[R.id]); })()"
FILL = r"""(() => {
  const ID = %r, R = __ROOMS.find((r) => r.id === ID), W = 20, D = 16, x0 = R.x0, RAD = 0.32, CELL = 0.1;
  const cols = __colliders.filter((c) => !c.off && !c.timed && (c.r !== undefined ? (c.x > x0 - 1 && c.x < x0 + W + 1) : (Math.max(c.x1, c.x2) > x0 - 1 && Math.min(c.x1, c.x2) < x0 + W + 1)));
  const clear = (x, z) => { let m = 9; for (const c of cols) { if (c.r !== undefined) { m = Math.min(m, Math.hypot(x - c.x, z - c.z) - c.r); continue; }
    const ex = c.x2 - c.x1, ez = c.z2 - c.z1, L2 = ex * ex + ez * ez || 1e-9; let t = ((x - c.x1) * ex + (z - c.z1) * ez) / L2; t = Math.max(0, Math.min(1, t)); m = Math.min(m, Math.hypot(x - (c.x1 + ex * t), z - (c.z1 + ez * t))); } return m; };
  const NX = Math.round(W / CELL) + 1, NZ = Math.round(D / CELL) + 1, cl = new Float32Array(NX * NZ), sf = new Float32Array(NX * NZ);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const x = x0 + i * CELL, z = -D / 2 + j * CELL; cl[j * NX + i] = clear(x, z); sf[j * NX + i] = __PARK.surface(R, x, z); }
  const sx = Math.round((W / 2) / CELL), sz = Math.round((D / 2 - 2.2 + D / 2) / CELL);
  const isWest = (i, j) => i * CELL <= 0.6 && j * CELL - D / 2 > 2.3 && j * CELL - D / 2 < 5.3;
  const isEast = (i, j) => i * CELL >= W - 0.6 && j * CELL - D / 2 > 2.3 && j * CELL - D / 2 < 5.3;
  // starts: the spawn point (the SETS menu and the number keys put you there), the west door and the east door
  const starts = { spawn: [], west: [], east: [] };
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { if (isWest(i, j)) starts.west.push(j * NX + i); if (isEast(i, j)) starts.east.push(j * NX + i); if (Math.hypot(i - sx, j - sz) * CELL <= 1.0) starts.spawn.push(j * NX + i); }
  const bfs = (T, from = 'spawn') => { const seen = new Uint8Array(NX * NZ), q = starts[from].filter((k) => cl[k] >= T); let west = false, east = false, n = 0;
    if (!q.length) return { west, east, n: 0, spawnBlocked: true, seen };
    for (const k of q) seen[k] = 1;
    while (q.length) { const k = q.pop(), i = k %% NX, j = (k - i) / NX; n++; if (isWest(i, j)) west = true; if (isEast(i, j)) east = true;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || ii >= NX || jj < 0 || jj >= NZ) continue; const kk = jj * NX + ii;
        if (seen[kk] || cl[kk] < T || sf[kk] > sf[k] + 0.3) continue; seen[kk] = 1; q.push(kk); } }
    return { west, east, n, seen }; };
  const out = { id: ID, name: R.name, i: R.i, colliders: cols.length, parkFeatures: (__PARK.PARK[ID].features || []).map((f) => f.type) };
  const base = bfs(RAD); out.west = base.west; out.east = base.east; out.cells = base.n; out.spawnBlocked = !!base.spawnBlocked;
  // and the walk straight through: in at the west door, out at the east door, which is how most people arrive
  const thru = bfs(RAD, 'west'); out.through = thru.east; out.throughCells = thru.n; let bt = 0, nt = 0.32; const TS = [0.32, 0.36, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 1.0];
  for (let k = 0; k < TS.length; k++) { if (bfs(TS[k], 'west').east) bt = TS[k]; else { nt = TS[k]; break; } } out.throughWidth = bt ? +(bt * 2).toFixed(2) : 0;
  // the squeeze: cells on the widest route that both doors reach, whose clearance is what stops the next width up
  if (bt && bt < 1.0) { const a = bfs(bt, 'west'), b = bfs(bt, 'east'); const ch = [];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; if (a.seen[k] && b.seen[k] && cl[k] < nt) ch.push([+(i * CELL).toFixed(1), +(j * CELL - D / 2).toFixed(1), +cl[k].toFixed(2)]); }
    ch.sort((p, q) => p[2] - q[2]); out.squeeze = ch.slice(0, 6); }
  // the widest route: the largest clearance that still reaches each door, as a corridor width
  for (const side of ['west', 'east']) { let best = 0; for (const T of [0.32, 0.36, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 1.0]) { if (bfs(T)[side]) best = T; else break; } out[side + 'Width'] = best ? +(best * 2).toFixed(2) : 0; }
  // what blocks the spawn, if anything, and the nearest colliders to it
  out.spawnClear = +cl[sz * NX + sx].toFixed(2); out.spawnSurface = +sf[sz * NX + sx].toFixed(2);
  return out;
})()"""

def batch(args):
    k, ids = args; w = k % a.workers; port = a.port + w; http = a.http
    prof = tempfile.mkdtemp(prefix='onloc-audit-')
    chrome = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={port}", "--window-size=1200,700", "--user-data-dir=" + prof, "--use-angle=metal", "--autoplay-policy=no-user-gesture-required", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    HOST = f'http://127.0.0.1:{port}'; res = []
    try:
        for _ in range(80):
            try: urllib.request.urlopen(HOST + "/json/version"); break
            except Exception: time.sleep(0.25)
        r = json.load(urllib.request.urlopen(urllib.request.Request(f'{HOST}/json/new?about:blank', method='PUT')))
        ws = websocket.create_connection(r['webSocketDebuggerUrl'], max_size=None, suppress_origin=True); n = [0]; logs = []
        def send(method, **params):
            n[0] += 1; ws.send(json.dumps({'id': n[0], 'method': method, 'params': params}))
            while True:
                m = json.loads(ws.recv())
                if m.get('method') == 'Runtime.exceptionThrown': logs.append('EXC ' + json.dumps(m['params']['exceptionDetails'].get('exception', {}).get('description', m['params']['exceptionDetails'].get('text')))[:300])
                if m.get('method') == 'Runtime.consoleAPICalled' and m['params']['type'] == 'error': logs.append('error ' + ' '.join(str(x.get('value', x.get('description', '')))[:200] for x in m['params']['args']))
                if m.get('id') == n[0]: return m.get('result', {})
        def ev(expr): return send('Runtime.evaluate', expression=expr, returnByValue=True, awaitPromise=True).get('result', {}).get('value')
        send('Page.enable'); send('Runtime.enable')
        for i in ids:
            logs.clear(); t0 = time.time()
            send('Page.navigate', url=f"http://127.0.0.1:{http}/index.html?auto=1&nolock&room={i}&v={time.time()}")
            ok = False
            for _ in range(120):
                time.sleep(0.5)
                try:
                    if ev(READY % i): ok = True; break
                except Exception: pass
            if not ok:
                try: st = ev("(() => { const R = __ROOMS.find((r) => r.id === %r); return R ? { built: !!R.built, loadingN: R.loadingN, park: !!__PARK.PARK[R.id], ready: __ready(), px: __P.x } : 'no room'; })()" % i)
                except Exception as e: st = str(e)[:120]
                res.append({'id': i, 'error': 'never ready ' + json.dumps(st), 'logs': list(dict.fromkeys(logs))[:3]}); continue
            time.sleep(0.6)
            try: out = ev(FILL % i) or {'id': i, 'error': 'fill returned nothing'}
            except Exception as e: out = {'id': i, 'error': str(e)[:200]}
            out['secs'] = round(time.time() - t0, 1); out['logs'] = list(dict.fromkeys(logs))[:3]; res.append(out)
    finally:
        chrome.kill(); shutil.rmtree(prof, ignore_errors=True)
    return res

srv = subprocess.Popen([sys.executable, "-m", "http.server", str(a.http), "-d", a.site], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)
results = []
try:
    batches = [(k, IDS[k:k + a.batch]) for k in range(0, len(IDS), a.batch)]
    batches = [(n, b) for n, (k, b) in enumerate(batches)]
    with cf.ThreadPoolExecutor(a.workers) as ex:
        for rs in ex.map(batch, batches):
            for o in rs:
                results.append(o)
                if 'error' in o: print(f"{o['id']:14s} ERROR {o['error']} {o.get('logs')}", flush=True); continue
                ok = o['west'] and o['east'] and o['through'] and min(o['westWidth'], o['eastWidth'], o['throughWidth']) >= a.min
                print(f"{o['id']:14s} spawn>west {'ok ' if o['west'] else 'NO '} {o['westWidth']:.2f}m  spawn>east {'ok ' if o['east'] else 'NO '} {o['eastWidth']:.2f}m  west>east {'ok ' if o['through'] else 'NO '} {o['throughWidth']:.2f}m  spawnClear {o['spawnClear']:5.2f}  park {','.join(o['parkFeatures'])}{'' if ok else '  <-- '}{('  squeeze at ' + str(o['squeeze'][:3])) if o.get('squeeze') else ''}", flush=True)
finally:
    srv.kill()
os.makedirs(os.path.dirname(a.out), exist_ok=True); json.dump(results, open(a.out, 'w'), indent=1)
bad = [o for o in results if 'error' in o or not (o['west'] and o['east'] and o['through']) or min(o['westWidth'], o['eastWidth'], o['throughWidth']) < a.min]
print(f"\n{len(results)} sets, {len(bad)} to look at: {' '.join(o['id'] for o in bad)}")
sys.exit(1 if bad else 0)
