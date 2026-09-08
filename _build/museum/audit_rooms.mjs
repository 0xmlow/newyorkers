/* audit_rooms.mjs
   Build all 111 rooms headlessly and report every work a visitor cannot see.

   Why headless. The rooms only ever touch the world through the `k` they are
   handed, so they will run against a stub that records the collision model and
   throws the geometry away. That turns a twenty five minute walk through the
   museum in a browser into about a second, which is the difference between
   checking this once and checking it on every build.

   Two faults are reported, both measured against the room's own rules:

     unreachable  the viewing position sits inside a block, inside a keep out,
                  or outside the room's bounds. constrain() pushes the camera
                  out of all three, so it is a spot the visitor can never hold.
     backwards    the work's normal points away from the place the visitor is
                  sent to see it from, so they arrive behind the picture.

   `rescued` counts the ones viewpoint() in main.ts can still save by standing
   the visitor squarely in front of the work. `stuck` is what is left, and that
   is the number that needs a room fixing by hand.

     node audit_rooms.mjs             summary plus the rooms that are stuck
     node audit_rooms.mjs --all       every room, including the clean ones
     node audit_rooms.mjs --room=id   one room, mount by mount
     node audit_rooms.mjs --json      machine readable
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import * as T from 'three';

const here = path.dirname(fileURLToPath(import.meta.url));

/* ---------- a canvas shaped enough for the texture generators ---------- */
/* The rooms build their own textures on a 2D canvas at construction time. None
   of those pixels matter here, so a context that accepts every call and returns
   plausible shapes is enough to let the geometry run. */
const ctx2d = new Proxy({}, {
  get: (_, k) => {
    if (k === 'canvas') return { width: 256, height: 256 };
    if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern')
      return () => ({ addColorStop() {} });
    if (k === 'getImageData' || k === 'createImageData') return (a, b, c, d) => {
      /* createImageData(w, h) and getImageData(x, y, w, h) both land here. */
      const w = d === undefined ? a : c, h = d === undefined ? b : d;
      return { data: new Uint8ClampedArray(Math.max(4, (w || 1) * (h || 1) * 4)), width: w || 1, height: h || 1 };
    };
    if (k === 'measureText') return () => ({ width: 10 });
    return () => {};
  },
  set: () => true,
});
globalThis.document = {
  createElement: () => ({
    width: 256, height: 256, style: {},
    getContext: () => ctx2d,
    toDataURL: () => 'data:,',
  }),
  createElementNS: () => ({ style: {}, setAttribute() {} }),
};
globalThis.self = globalThis;
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });

/* ---------- bundle the room definitions for node ---------- */
/* Both files land beside node_modules so node can resolve three from the bundle. */
const entry = path.join(here, '.audit_entry.mjs');
const outfile = path.join(here, '.audit_bundle.mjs');
fs.writeFileSync(entry, `export { ROOMS } from ${JSON.stringify(path.join(here, 'src', 'rooms', 'index.ts'))};\n`);
await esbuild.build({
  entryPoints: [entry], outfile, bundle: true, format: 'esm', platform: 'node',
  external: ['three'], logLevel: 'error',
});
const { ROOMS } = await import('file://' + outfile + '?t=' + Date.now());
for (const f of [entry, outfile]) try { fs.unlinkSync(f); } catch { /* already gone */ }

/* ---------- a Kit that records the collision model and nothing else ---------- */
/* Real Object3Ds rather than hand rolled fakes: the rooms copy vectors, rotate
   things, traverse children and read back positions, and three already does all
   of that correctly. Only the parts we do not model fall through to the proxy. */
const permissive = () => {
  const o = new T.Object3D();
  /* Rooms reach into material.color and material.emissive to tint things, so
     those have to be real Colors rather than empty objects. */
  o.material = new Proxy({ color: new T.Color(), emissive: new T.Color(), map: null, dispose() {} },
    { get: (t, k) => (k in t ? t[k] : () => permissive()), set: (t, k, v) => { t[k] = v; return true; } });
  o.geometry = new Proxy({ dispose() {}, attributes: {}, boundingBox: null },
    { get: (t, k) => (k in t ? t[k] : () => permissive()), set: (t, k, v) => { t[k] = v; return true; } });
  return new Proxy(o, {
    get(t, k) {
      const val = Reflect.get(t, k);
      if (val !== undefined) return typeof val === 'function' ? val.bind(t) : val;
      if (typeof k === 'symbol') return undefined;
      return () => permissive();
    },
    set(t, k, v) { Reflect.set(t, k, v); return true; },
  });
};

function stubKit() {
  const k = {
    blocks: [], keepOut: [], objects: [], extras: [], ticks: [], live: [], clickables: [],
    dynamic: new T.Object3D(), scene: new T.Object3D(), mats: {}, pending: [], night: false, dusk: false,
    o: { quality: 'high' },
    used: { atlases: new Set(), thumbs: new Set(), props: new Set(), images: new Set() },
    block(x0, x1, z0, z1) { k.blocks.push({ x0, x1, z0, z1 }); },
    /* the four kit helpers that add a keep out of their own */
    bench(x, z) { k.keepOut.push({ x, z, r: 0.9 }); return permissive(); },
    lamp(x, z) { k.keepOut.push({ x, z, r: 0.4 }); return permissive(); },
    plinth(x, z, w, h, d) { k.keepOut.push({ x, z, r: Math.max(w, d) * 0.7 }); return permissive(); },
    prop(name, x, y, z, p) { if (p && p.keepOut) k.keepOut.push({ x, z, r: p.keepOut }); return permissive(); },
    /* Pure helpers with no scene side effect: rooms read real geometry back
       out of these, so they have to be the real thing, not a stub. */
    spline(points, closed = false, tension = 0.5) { return new T.CatmullRomCurve3(points, closed, 'catmullrom', tension); },
  };
  const push = (fn) => (...a) => { const m = permissive(); k.objects.push(m); return fn ? fn(...a) || m : m; };
  for (const name of ['box', 'mesh', 'cyl', 'sphere', 'rounded', 'beam', 'column', 'arch', 'lathe', 'torus', 'moulding', 'rail', 'tree', 'sign', 'water', 'skyline', 'crowd', 'censusWall', 'blockFront'])
    if (!k[name]) k[name] = push();
  return new Proxy(k, {
    get(t, key) {
      if (key in t) return t[key];
      if (typeof key === 'symbol') return undefined;
      return (...a) => { void a; const m = permissive(); t.objects.push(m); return m; };
    },
  });
}

const CTX = {
  pieces: [], all: [],
  thumb: () => 'x', reduced: false, quality: 'high',
  wallStart: () => 0,
};

/* ---------- run every room ---------- */
const rows = [];
for (const def of ROOMS) {
  const k = stubKit();
  let build;
  try {
    build = def.build(k, CTX);
  } catch (e) {
    rows.push({ id: def.id, error: String(e && e.message || e).slice(0, 120), stack: (e && e.stack || '').split('\n').slice(1, 4).join(' | ') });
    continue;
  }
  const [x0, x1, z0, z1] = build.bounds;
  const inBlock = (x, z) => k.blocks.some((q) => x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1);
  const inKeep = (x, z) => k.keepOut.some((q) => Math.hypot(x - q.x, z - q.z) < q.r);
  const standable = (x, z) => !(x < x0 || x > x1 || z < z0 || z > z1) && !inBlock(x, z) && !inKeep(x, z);

  const bad = [];
  build.mounts.forEach((m, i) => {
    const p = m.position, t = m.target;
    /* Same order as loadRoom: a work facing away from its viewer is turned to
       face them first, and only then is a place to stand chosen. Evaluating
       these the other way round reports rooms as broken that the museum
       actually handles. */
    const backwards = (t.x - p.x) * Math.sin(m.rotation) + (t.z - p.z) * Math.cos(m.rotation) < 0;
    const rot = backwards ? m.rotation + Math.PI : m.rotation;
    const unreachable = !standable(t.x, t.z);
    if (!unreachable && !backwards) return;
    /* Mirrors viewpoint() in main.ts exactly. If these drift apart the audit
       stops describing the museum a visitor actually walks. */
    const back = Math.max(3, (m.width || 4) * 0.9);
    /* viewpoint() keeps the authored spot whenever the turned work faces it. */
    let rescued = !unreachable;
    outer: for (const d of [back, back * 1.4, back * 0.7, back * 1.9, back * 2.5, back * 3.2])
      for (const a of [0, 0.3, -0.3, 0.6, -0.6, 0.95, -0.95, 1.25, -1.25])
        if (standable(p.x + Math.sin(rot + a) * d, p.z + Math.cos(rot + a) * d)) { rescued = true; break outer; }
    bad.push({ i, unreachable, backwards, rescued, pos: [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)], tgt: [+t.x.toFixed(1), +t.z.toFixed(1)] });
  });
  rows.push({
    id: def.id, mounts: build.mounts.length,
    unreachable: bad.filter((b) => b.unreachable).length,
    backwards: bad.filter((b) => b.backwards).length,
    rescued: bad.filter((b) => b.rescued).length,
    stuck: bad.filter((b) => !b.rescued).length,
    bounds: build.bounds,
    blocks: k.blocks.map((q) => [q.x0, q.x1, q.z0, q.z1]),
    keepOut: k.keepOut.map((q) => [+q.x.toFixed(1), +q.z.toFixed(1), +q.r.toFixed(2)]),
    bad,
  });
}

/* ---------- report ---------- */
const arg = (n) => (process.argv.find((a) => a.startsWith('--' + n + '=')) || '').split('=')[1];
const ok = rows.filter((r) => !r.error);
const errored = rows.filter((r) => r.error);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rooms: rows }, null, 1));
} else if (arg('room')) {
  const r = rows.find((x) => x.id === arg('room'));
  if (!r) { console.error('no room ' + arg('room')); process.exit(1); }
  if (r.error) { console.log(r.id, 'FAILED TO BUILD:', r.error); process.exit(1); }
  console.log(`${r.id}: ${r.mounts} mounts, ${r.unreachable} unreachable, ${r.backwards} backwards, ${r.stuck} stuck`);
  console.log('  bounds ' + JSON.stringify(r.bounds) + '\n  blocks ' + JSON.stringify(r.blocks) + '\n  keepOut ' + JSON.stringify(r.keepOut));
  for (const b of r.bad) console.log(`  mount ${String(b.i).padStart(2)} at ${JSON.stringify(b.pos)} -> ${JSON.stringify(b.tgt)}  ${b.unreachable ? 'unreachable' : '           '} ${b.backwards ? 'backwards' : '         '} ${b.rescued ? '(rescued)' : 'STUCK'}`);
} else {
  const sum = (f) => ok.reduce((s, r) => s + r[f], 0);
  const stuckRooms = ok.filter((r) => r.stuck).sort((a, b) => b.stuck - a.stuck);
  console.log(`${ok.length} rooms, ${sum('mounts')} mounts`);
  console.log(`  unreachable ${sum('unreachable')}, backwards ${sum('backwards')}`);
  console.log(`  rescued by viewpoint() ${sum('rescued')}, still stuck ${sum('stuck')} in ${stuckRooms.length} rooms`);
  if (errored.length) { console.log(`  rooms that failed to build: ${errored.length}`); for (const e of errored) console.log(`    ${e.id}: ${e.error}`); }
  const list = process.argv.includes('--all') ? ok.filter((r) => r.unreachable || r.backwards) : stuckRooms;
  if (list.length) {
    console.log('\nroom                 mounts  unreach  backwards  stuck');
    for (const r of list) console.log(`  ${r.id.padEnd(18)} ${String(r.mounts).padStart(5)} ${String(r.unreachable).padStart(8)} ${String(r.backwards).padStart(10)} ${String(r.stuck).padStart(6)}`);
  }
  process.exitCode = sum('stuck') ? 1 : 0;
}
