#!/usr/bin/env python3
"""audit_walk.py <gallery dir> [--rooms a,b] [--wait 12]
Can you walk every room? Each room is loaded headless (the Playwright Chromium), then the floor is flood filled on a
10 cm grid from the spawn point with the engine's own colliders (window.__colliders, radius 0.32 like collide()). For
every room it reports whether the west and the east door can be reached from the spawn and straight through, and the
narrowest squeeze on the widest route. Non zero exit when a door is unreachable or a route is under 1.0 m.
Ported from LIVE FROM THE SEWERS' audit (CDP) to the Playwright shooter."""
import argparse, json, os, re, subprocess, sys
ap = argparse.ArgumentParser(); ap.add_argument('gallery'); ap.add_argument('--rooms', default=''); ap.add_argument('--wait', type=float, default=12); ap.add_argument('--min', type=float, default=1.0)
a = ap.parse_args(); G = os.path.abspath(a.gallery); HERE = os.path.dirname(os.path.abspath(__file__))
IDS = re.findall(r"\{ id: '(\w+)'", open(os.path.join(G, "_build", "src", "rooms.js")).read())
if a.rooms: IDS = [i for i in a.rooms.split(',') if i in IDS]
FILL = r"""(() => {
  const R = __ROOMS[Math.floor(__P.x / 20)], W = 20, D = 16, x0 = R.x0, RAD = 0.32, CELL = 0.1;
  const cols = __colliders.filter((c) => !c.off && !c.timed && (c.r !== undefined ? (c.x > x0 - 1 && c.x < x0 + W + 1) : (Math.max(c.x1, c.x2) > x0 - 1 && Math.min(c.x1, c.x2) < x0 + W + 1)));
  const clear = (x, z) => { let m = 9; for (const c of cols) { if (c.r !== undefined) { m = Math.min(m, Math.hypot(x - c.x, z - c.z) - c.r); continue; }
    const ex = c.x2 - c.x1, ez = c.z2 - c.z1, L2 = ex * ex + ez * ez || 1e-9; let t = ((x - c.x1) * ex + (z - c.z1) * ez) / L2; t = Math.max(0, Math.min(1, t)); m = Math.min(m, Math.hypot(x - (c.x1 + ex * t), z - (c.z1 + ez * t))); } return m; };
  const NX = Math.round(W / CELL) + 1, NZ = Math.round(D / CELL) + 1, cl = new Float32Array(NX * NZ);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) cl[j * NX + i] = clear(x0 + i * CELL, -D / 2 + j * CELL);
  const sx = Math.round((__P.x - x0) / CELL), sz = Math.round((__P.z + D / 2) / CELL);
  const isWest = (i, j) => i * CELL <= 0.6 && j * CELL - D / 2 > 2.3 && j * CELL - D / 2 < 5.3, isEast = (i, j) => i * CELL >= W - 0.6 && j * CELL - D / 2 > 2.3 && j * CELL - D / 2 < 5.3;
  const starts = { spawn: [], west: [] };
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { if (isWest(i, j)) starts.west.push(j * NX + i); if (Math.hypot(i - sx, j - sz) * CELL <= 1.0) starts.spawn.push(j * NX + i); }
  const bfs = (T, from) => { const seen = new Uint8Array(NX * NZ), q = starts[from].filter((k) => cl[k] >= T); let west = false, east = false, n = 0; for (const k of q) seen[k] = 1;
    while (q.length) { const k = q.pop(), i = k % NX, j = (k - i) / NX; n++; if (isWest(i, j)) west = true; if (isEast(i, j)) east = true;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || ii >= NX || jj < 0 || jj >= NZ) continue; const kk = jj * NX + ii; if (seen[kk] || cl[kk] < T) continue; seen[kk] = 1; q.push(kk); } }
    return { west, east, n }; };
  const base = bfs(RAD, 'spawn'), thru = bfs(RAD, 'west'); let bt = 0; for (const T of [0.32, 0.36, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 1.0]) { if (bfs(T, 'west').east) bt = T; else break; }
  return { id: R.id, i: R.i, first: R.i === 0, last: !__ROOMS[R.i + 1], west: base.west, east: base.east, cells: base.n, through: thru.east, throughWidth: +(bt * 2).toFixed(2), spawnClear: +cl[sz * NX + sx].toFixed(2), colliders: cols.length };
})()"""
js = os.path.join(HERE, 'shot.js'); out = os.path.join(G, 'work', 'audit'); os.makedirs(out, exist_ok=True)
r = subprocess.run(['node', js, os.path.join(G, 'site'), out, json.dumps([f"{i}=room={i}" for i in IDS]), str(a.wait), FILL, '640', '360', '0'], capture_output=True, text=True)
res = []
for line in r.stdout.splitlines():
    m = re.match(r"(\w+) eval: (.*)", line)
    if m:
        try: res.append(json.loads(m.group(2)))
        except Exception: res.append({'id': m.group(1), 'error': m.group(2)[:200]})
bad = []
for o in res:
    if 'error' in o: print(f"{o['id']:12s} ERROR {o['error']}"); bad.append(o); continue
    west = o['west'] or o['first']; east = o['east'] or o['last']; thru = o['through'] or o['first'] or o['last']
    ok = west and east and thru and (o['throughWidth'] >= a.min or o['first'] or o['last'])
    print(f"{o['id']:12s} spawn>west {'ok ' if west else 'NO '} spawn>east {'ok ' if east else 'NO '} west>east {'ok ' if thru else 'NO '} width {o['throughWidth']:.2f}  spawnClear {o['spawnClear']:5.2f}  cells {o['cells']}  colliders {o['colliders']}{'' if ok else '  <-- '}")
    if not ok: bad.append(o)
print(f"\n{len(res)} rooms, {len(bad)} to look at: {' '.join(o['id'] for o in bad)}")
if r.returncode: print(r.stderr[-800:])
sys.exit(1 if bad or len(res) < len(IDS) else 0)
