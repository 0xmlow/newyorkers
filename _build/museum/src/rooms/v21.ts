/* 177 and 178: two night rooms whose subject is work done after dark.
   A block of Dyker Heights in December, every house dressed in thousands of lights, tour buses at the
   kerb and crowds with cups on the sidewalk; and the Hunts Point Produce Market at three in the
   morning, the long refrigerated dock with its numbered doors, trailers backed in, forklifts racing
   pallets under sodium light and buyers with hand trucks. Rules kept: no likeness of any real person,
   no house named after its real owners, no brand on any bus, truck, trailer or crate, no lettered text
   beyond door numbers and a clock. Every moving thing is one InstancedMesh rewritten in place or one
   Group on k.ticks, and every tick is guarded by ctx.reduced. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];

/* ---------------- helpers, copied from v14 and v3 (nothing there is exported) ---------------- */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  try { draw(c.getContext('2d')!); } catch { /* the audit has no canvas */ }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
/* translucent puffs that rise, spread and fade: breath, steam, exhaust */
function vapour(k: K, pts: T.Vector3[], perPt: number, p: { rise?: number; spread?: number; size?: number; opacity?: number; colour?: number; seed?: number; speed?: number; animate: boolean; additive?: boolean }) {
  const { rise = 1.4, spread = 0.5, size = 0.1, opacity = 0.2, colour = 0xffffff, seed = 1, speed = 0.28, animate, additive = false } = p;
  const n = pts.length * perPt, rnd = X.mulberry(seed);
  const o = k.instances(new T.SphereGeometry(size, 6, 5), new T.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending }), Array.from({ length: n }, () => new T.Matrix4()));
  o.frustumCulled = false;
  const ph = Array.from({ length: n }, (_, i) => ({ b: pts[i % pts.length], o: rnd(), dx: (rnd() - 0.5) * spread, dz: (rnd() - 0.5) * spread }));
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), s = new T.Vector3();
  const place = (t: number) => {
    ph.forEach((a, i) => {
      const u = (t * speed + a.o) % 1, sc = 0.6 + u * 2.4;
      pos.set(a.b.x + a.dx * (1 + u * 3), a.b.y + u * rise, a.b.z + a.dz * (1 + u * 3));
      s.setScalar(sc * (1 - u * 0.35));
      m.compose(pos, q, s);
      o.setMatrixAt(i, m);
    });
    o.instanceMatrix.needsUpdate = true;
  };
  place(0.4);
  if (animate) k.ticks.push(place);
  return o;
}
/* a mount on a wall: rotation r faces the normal (sin r, 0, cos r); the target is d metres out */
function hang(ms: Mount[], x: number, y: number, z: number, r: number, w: number, h: number, style: FrameStyle, d = 3.2, tilt?: number) {
  ms.push({ position: v(x, y, z), rotation: r, target: v(x + Math.sin(r) * d, y, z + Math.cos(r) * d), width: w, height: h, style, wash: true, tilt });
}
/* cars on a street along x: one instanced body, one instanced cabin; parked ones never move */
function traffic(k: K, ctx: C, p: { lanes: { z: number; dir: number; n: number; speed?: number }[]; x0: number; x1: number; seed: number; y?: number }) {
  const { lanes, x0, x1, seed, y = 0 } = p, rnd = X.mulberry(seed), span = x1 - x0;
  const cars: { x: number; z: number; dir: number; v: number; len: number }[] = [];
  for (const l of lanes) for (let i = 0; i < l.n; i++) {
    const len = 4.2 + rnd() * 0.8;
    cars.push({ x: x0 + ((i + rnd() * 0.5) / l.n) * span, z: l.z, dir: l.dir, v: l.dir === 0 ? 0 : (l.speed ?? 8) * (0.8 + rnd() * 0.35), len });
  }
  const n = cars.length;
  const prof = (pts: number[][], depth: number) => { const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) sh.lineTo(p[0], p[1]); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g; };
  const bodyG = prof([[-0.5, 0.28], [0.5, 0.28], [0.5, 0.62], [0.47, 0.76], [0.22, 0.84], [-0.3, 0.86], [-0.48, 0.8], [-0.5, 0.64]], 1.8);
  const cabG = prof([[-0.3, 0.84], [0.2, 0.84], [0.06, 1.34], [-0.24, 1.34]], 1.66);
  const body = k.instances(bodyG, new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }), Array.from({ length: n }, () => new T.Matrix4()));
  const cab = k.instances(cabG, new T.MeshStandardMaterial({ color: 0x1a2026, roughness: 0.15, metalness: 0.7 }), Array.from({ length: n }, () => new T.Matrix4()));
  const wheel = k.instances(new T.CylinderGeometry(0.34, 0.34, 1.9, 10).rotateX(PI / 2), new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }), Array.from({ length: n * 2 }, () => new T.Matrix4()));
  body.frustumCulled = cab.frustumCulled = wheel.frustumCulled = false;
  const pal = [0x1c1e22, 0xe8e8ea, 0x6a7078, 0x2a3a5a, 0x7a1e22, 0xb8bcc2, 0x1a3a2a, 0x3a3a44];
  const c = new T.Color();
  cars.forEach((a, i) => body.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])));
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  const place = (dt: number) => {
    cars.forEach((a, i) => {
      a.x += a.v * a.dir * Math.min(dt, 0.1);
      if (a.x > x1) a.x -= span; if (a.x < x0) a.x += span;
      q.setFromAxisAngle(up, a.dir < 0 ? PI : 0);
      pos.set(a.x, y, a.z); sc.set(a.len, 1, 1); m.compose(pos, q, sc); body.setMatrixAt(i, m); cab.setMatrixAt(i, m);
      for (const s of [-1, 1]) { pos.set(a.x + s * a.len * 0.32, y + 0.34, a.z); sc.set(1, 1, 1); q.identity(); m.compose(pos, q, sc); wheel.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), m); }
    });
    body.instanceMatrix.needsUpdate = cab.instanceMatrix.needsUpdate = wheel.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (!ctx.reduced) k.ticks.push((_t, dt) => place(dt));
}
/* a row of New York house fronts: brick and stone, stoops and cornices; facing +z or -z */
function houses(k: K, x0: number, x1: number, z: number, facing: number, seed: number, p: { hMin?: number; hMax?: number; depth?: number; lit?: number } = {}) {
  const { hMin = 14, hMax = 20, depth = 12, lit = 0.35 } = p, rnd = X.mulberry(seed);
  const mats = [k.pbr('hsBrown' + seed, X.ashlar(0x6e4c3c, seed + 1, 6), 0.4, { normal: 0.4 }), k.pbr('hsBrick' + seed, X.brick(0x7a4032, seed + 2), 0.9), k.pbr('hsLime' + seed, X.ashlar(0xcdbfa4, seed + 3, 5), 0.35, { normal: 0.4 }), k.pbr('hsBrick2' + seed, X.brick(0x9a6a4e, seed + 4), 0.9)];
  const win = k.flat(0x1a2128, 0.6, 0.18), warm = k.flat(0xffd9a0, 0, 0.6, { emissive: 0xffc070, emissiveIntensity: 0.9 }), trim = k.flat(0xd8d2c4, 0, 0.6), corn = k.flat(0x4a4038, 0.2, 0.6), door = k.flat(0x2a1c14, 0, 0.5);
  let x = x0;
  while (x < x1 - 3) {
    const w = Math.min(x1 - x, 6 + Math.floor(rnd() * 3)), h = hMin + rnd() * (hMax - hMin), m = mats[Math.floor(rnd() * mats.length)], cx = x + w / 2;
    k.box(w, h, depth, cx, h / 2, z - facing * depth / 2, m);
    const floors = Math.floor((h - 1.5) / 3.3), cols = w > 7 ? 3 : 2;
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      const wx = x + ((c + 0.5) / cols) * w, wy = 2.4 + f * 3.3 + (f > 0 ? 0.6 : 0);
      if (f === 0 && c === 0) { k.box(1.3, 2.6, 0.1, wx, 1.3 + 0.9, z + facing * 0.02, door); for (let s = 0; s < 5; s++) k.box(1.8, 0.18, 0.36, wx, 0.09 + s * 0.18, z + facing * (0.18 + (4 - s) * 0.36), m); continue; }
      k.box(1.15, 1.9, 0.08, wx, wy, z + facing * 0.03, rnd() < lit ? warm : win);
      k.box(1.35, 0.14, 0.2, wx, wy + 1.02, z + facing * 0.08, trim);
    }
    k.box(w, 0.5, 0.7, cx, h - 0.25, z + facing * 0.3, corn);
    x += w;
  }
}
/* people sitting or standing still: one instanced figure each */
function still(k: K, pts: { x: number; y: number; z: number; ry: number; sit?: boolean }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0]) {
  if (!pts.length) return null;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y + (p.sit ? 0.12 : 0), p.z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), p.ry), v(1, p.sit ? 0.82 : 1.1 + rnd() * 0.12, 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
  return o;
}
/* a box part translated into place, for merged prop geometries */
const part = (w: number, h: number, d: number, x: number, y: number, z: number, rz = 0, ry = 0) => { const g = new T.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; };
/* the visitor's camera, or null in the audit and the check scripts (no window there) */
function cam(): T.Camera | null {
  if (typeof window === 'undefined') return null;
  const m = (window as unknown as { __museum?: { camera?: T.Camera } }).__museum;
  return m && m.camera ? m.camera : null;
}
/* a group that never moves is baked into the static merge: one draw call per material instead of one per part */
function bake(k: K, g: T.Group) {
  g.updateMatrixWorld(true);
  g.traverse((c) => { if (c instanceof T.Mesh) { const geo = c.geometry.clone(); geo.applyMatrix4(c.matrixWorld); k.mesh(geo, c.material as T.Material); } });
}
/* the New York clock, read in a tick. A ?hour= on the page overrides the hour and minute; the seconds are real. */
const nyFmt = typeof Intl !== 'undefined' ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;
const hourParam = (() => { try { return typeof location !== 'undefined' ? new URLSearchParams(location.search).get('hour') : null; } catch { return null; } })();
function nyClock() {
  let h = 0, m = 0, s = 0;
  if (nyFmt) for (const p of nyFmt.formatToParts(new Date())) { if (p.type === 'hour') h = Number(p.value) % 24; else if (p.type === 'minute') m = Number(p.value); else if (p.type === 'second') s = Number(p.value); }
  if (hourParam != null && hourParam !== '' && !Number.isNaN(Number(hourParam))) { const f = Number(hourParam); h = Math.floor(f) % 24; m = Math.floor((f - Math.floor(f)) * 60 + 1e-6); }
  return { h, m, s };
}
const one = new T.Vector3(1, 1, 1), up = new T.Vector3(0, 1, 0), hide = new T.Vector3(0.0001, 0.0001, 0.0001);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
/* falling snow over a box of the room: one InstancedMesh of small octahedra, wrapped as they fall */
function snowfall(k: K, ctx: C, n: number, box: { x0: number; x1: number; z0: number; z1: number; h: number }, seed: number) {
  const rnd = X.mulberry(seed);
  const o = k.instances(new T.OctahedronGeometry(0.024, 0), new T.MeshBasicMaterial({ color: 0xd8e2ee }), Array.from({ length: n }, () => new T.Matrix4()));
  o.frustumCulled = false;
  const px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n), ph = new Float32Array(n), sp = new Float32Array(n);
  for (let i = 0; i < n; i++) { px[i] = box.x0 + rnd() * (box.x1 - box.x0); py[i] = rnd() * box.h; pz[i] = box.z0 + rnd() * (box.z1 - box.z0); ph[i] = rnd() * 6.3; sp[i] = 0.6 + rnd() * 0.5; }
  const m = new T.Matrix4();
  const place = (t: number, dt: number) => {
    const d = Math.min(dt, 0.1);
    for (let i = 0; i < n; i++) {
      py[i] -= sp[i] * d; if (py[i] < 0) py[i] += box.h;
      m.setPosition(px[i] + Math.sin(t * 0.7 + ph[i]) * 0.5, py[i], pz[i] + Math.cos(t * 0.5 + ph[i]) * 0.4);
      o.setMatrixAt(i, m);
    }
    o.instanceMatrix.needsUpdate = true;
  };
  place(0, 0);
  if (!ctx.reduced) k.ticks.push(place);
}

/* ================================================================== */
/* ---------------- 177 THE LIGHTS OF DYKER HEIGHTS ---------------- */
export const dykerheights: RoomDef = {
  id: 'dykerheights',
  name: 'The lights of Dyker Heights',
  area: 'DYKER HEIGHTS / 84TH STREET',
  mood: 'December, snow, every bulb on the block',
  color: '#c8283a',
  daylit: false,
  description: 'A block of Dyker Heights in the middle of December, after dark, with snow coming down: detached brick and stone houses on their lawns, every roofline, column, window and tree wrapped in thousands of lights, toy soldiers, nutcrackers, snowmen, angels and reindeer on the lawns, a display that turns, tour buses at the kerb and a crowd on the sidewalk with hot cups. The New Yorkers hang in lit gilt frames on the fences and lawn displays and on the garage doors, facing the sidewalk with everything else.',
  signatures: 'The two rows of detached houses with their lawns and low iron fences, roof outlines and wrapped columns in white and coloured bulbs, bare trees spiralled in light, the toy soldiers at the gates, the nutcracker that turns, the reindeer that rock, the snowmen and the angels, the turning display, the tour bus that pulls in and lets its crowd out when you stand at the kerb, the snow on the lawns and in the air, and the bridge lights far off to the south.',
  build(k, ctx) {
    k.sky({ top: 0x04060c, horizon: 0x1a1a2a, ground: 0x06070b, fog: 0.007, stars: 260, env: 0.3 });
    k.hemi(0x3a4a7a, 0x14161c, 1.1);
    k.sun(0xaebde8, 0.22, -60, 70, 30, true, 90);
    const asph = k.pbr('dhAsph', X.asphalt(0x1e2126), 0.3, { roughness: 0.6 }), walk = k.pbr('dhWalk', X.pavers(0x8a8c90, 177), 0.5),
      snow = k.flat(0xbfc9d6, 0, 1), snowRoof = k.flat(0xb4bfcc, 0, 1), curb = k.flat(0x7a7c80, 0, 0.8),
      brick = k.pbr('dhBrick', X.brick(0x7a4638, 178), 0.9), brick2 = k.pbr('dhBrick2', X.brick(0x9a6a50, 179), 0.9), stone = k.pbr('dhStone', X.ashlar(0xbcb2a0, 180, 5), 0.4, { normal: 0.4 }), stucco = k.pbr('dhStucco', X.plaster(0xd2c8b4, 181), 0.3, { roughness: 0.9 }),
      slate = k.flat(0x2a2c32, 0.1, 0.8), trim = k.flat(0xd6d0c4, 0, 0.6), iron = k.flat(0x1a1c20, 0.6, 0.5), doorM = k.flat(0x3a1c14, 0, 0.5), bark = k.pbr('dhBark', X.bark(), 0.7, { roughness: 1 }),
      winLit = k.flat(0xffd9a0, 0, 0.6, { emissive: 0xffc070, emissiveIntensity: 0.9 }), winDark = k.flat(0x1a2128, 0.6, 0.18),
      wSnow = k.flat(0xe0e6ee, 0, 0.9, { emissive: 0x8a96a8, emissiveIntensity: 0.35 }), red = k.flat(0xc0202a, 0, 0.5, { emissive: 0x7a0a12, emissiveIntensity: 0.6 }),
      gold = k.flat(0xd8a850, 0.9, 0.3, { emissive: 0x7a5a20, emissiveIntensity: 0.4 }), green = k.flat(0x1e6a34, 0, 0.6, { emissive: 0x0a3a18, emissiveIntensity: 0.6 }),
      black = k.flat(0x141416, 0.2, 0.6), skin = k.flat(0xf0d2b8, 0, 0.7), tan = k.flat(0x8a6a4a, 0, 0.8), navy = k.flat(0x1e2a5a, 0.2, 0.5),
      haloM = k.glow(0xfff1cc), wire = new T.MeshBasicMaterial({ color: 0xfff1cc, wireframe: true, transparent: true, opacity: 0.85 });
    const mounts: Mount[] = [], st: FrameStyle = 'gilt';
    const blk = (x0: number, x1: number, z0: number, z1: number) => k.block(Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1));

    /* ---- the street: 84th Street along x, nine metres of asphalt, kerbs, sidewalks under snow ---- */
    k.box(120, 0.2, 9, 0, -0.1, 0, asph);
    for (const s of [-1, 1]) { k.box(120, 0.2, 3.7, 0, -0.06, s * 6.35, walk); k.box(120, 0.14, 0.25, 0, 0.0, s * 4.6, curb); k.box(120, 0.02, 1.4, 0, 0.09, s * 7.5, snow); }
    for (let x = -58; x < 60; x += 4) for (const s of [-1, 1]) k.box(2.2, 0.03, 0.5, x + s * 0.7, 0.0, s * 4.0, snow);
    for (let x = -50; x <= 50; x += 20) for (const s of [-1, 1]) k.lamp(x + s * 7.6, s * 4.9, 5.2, iron, 0xffd7a0, 22);
    /* the cross streets at both ends and the dark rows behind the block */
    houses(k, -60, 60, -36, 1, 1770, { hMin: 8, hMax: 12, depth: 10, lit: 0.3 });
    houses(k, -60, 60, 36, -1, 1771, { hMin: 8, hMax: 12, depth: 10, lit: 0.3 });
    k.box(120, 0.02, 28, 0, 0.03, -22, snow); k.box(120, 0.02, 28, 0, 0.03, 22, snow);
    for (let i = 0; i < 12; i++) { const x = -55 + i * 10; for (const s of [-1, 1]) k.tree(x, 0, s * 30, { h: 6, r: 2.4, kind: 'bare', seed: 1772 + i }); }
    /* the bridge lights far to the south west, seen over the roofs: two towers and a drooping cable of bulbs */
    const bulbs: { x: number; y: number; z: number; g: number; c: number }[] = [];
    {
      const bx = -170, bz = 230, span = 140;
      for (const s of [-1, 1]) { k.box(6, 90, 6, bx + s * span / 2, 45, bz, black); k.box(8, 3, 8, bx + s * span / 2, 91, bz, black); }
      k.box(span + 60, 3, 10, bx, 32, bz, black);
      for (let i = 0; i <= 90; i++) { const u = i / 90, x = bx - span / 2 + u * span, y = 34 + 54 * Math.pow(2 * u - 1, 2); bulbs.push({ x, y, z: bz, g: 0, c: 0xfff4d8 }); }
      for (let i = 0; i <= 24; i++) { const x = bx - span / 2 - 30 + (i / 24) * (span + 60); bulbs.push({ x, y: 34.4, z: bz, g: 0, c: 0xffd8a0 }); }
      for (const s of [-1, 1]) for (const y of [92.5]) bulbs.push({ x: bx + s * span / 2, y, z: bz, g: 0, c: 0xff3030 });
    }

    /* ---- the houses: five lots a side, fourteen metres wide, each with its own display and its own light pattern ---- */
    const lots: { cx: number; s: number; kind: number }[] = [];
    let kind = 0;
    for (const s of [-1, 1]) for (const cx of [-28, -14, 0, 14, 28]) lots.push({ cx, s, kind: kind++ });
    const bodyMats = [brick, stone, brick2, stucco, brick], winRnd = X.mulberry(1773);
    const patterns: { speed: number; mode: number }[] = [];
    const reindeer: T.Group[] = [], turnStands: T.Group[] = [], soldiers: { x: number; z: number; ry: number }[] = [];
    let nutcrackerG: T.Object3D | null = null;
    const bulb = (x: number, y: number, z: number, g: number, c: number) => bulbs.push({ x, y, z, g, c });
    const lineBulbs = (a: T.Vector3, b: T.Vector3, pitch: number, g: number, cols: number[]) => { const n = Math.max(1, Math.round(a.distanceTo(b) / pitch)); for (let i = 0; i <= n; i++) { const u = i / n; bulb(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u, g, cols[i % cols.length]); } };
    const wrap = (x: number, y0: number, y1: number, z: number, r: number, turns: number, g: number, cols: number[], n = 40) => { for (let i = 0; i <= n; i++) { const u = i / n, a = u * turns * PI * 2; bulb(x + Math.cos(a) * r, y0 + (y1 - y0) * u, z + Math.sin(a) * r, g, cols[i % cols.length]); } };
    const wireTree = (x: number, z: number, h: number, g: number, cols: number[], seed: number) => {
      const rnd = X.mulberry(seed);
      k.lathe([[0.22, 0], [0.16, h * 0.15], [0.11, h * 0.62], [0.06, h]], x, 0, z, bark, 8);
      wrap(x, 0.3, h * 0.62, z, 0.2, 7, g, cols, 60);
      for (let b = 0; b < 6; b++) {
        const a = rnd() * PI * 2, len = 1.6 + rnd() * 1.4, y0 = h * (0.55 + rnd() * 0.15);
        const p0 = v(x, y0, z), p1 = v(x + Math.cos(a) * len, y0 + 0.6 + rnd() * 1.4, z + Math.sin(a) * len);
        k.beam(p0, p1, 0.05, bark, 5);
        lineBulbs(p0, p1, 0.22, g, cols);
      }
    };
    const snowman = (x: number, z: number, s = 1) => {
      k.sphere(0.62 * s, x, 0.6 * s, z, wSnow, 14); k.sphere(0.46 * s, x, 1.5 * s, z, wSnow, 14); k.sphere(0.34 * s, x, 2.18 * s, z, wSnow, 12);
      k.cyl(0.28 * s, 0.32 * s, x, 2.62 * s, z, black, 0.28 * s, 12); k.cyl(0.42 * s, 0.05 * s, x, 2.47 * s, z, black, 0.42 * s, 12);
      k.cyl(0.03 * s, 0.34 * s, x, 2.18 * s, z + 0.5 * s, k.flat(0xf08a20, 0, 0.7), 0.06 * s, 6).rotation.x = PI / 2;
      k.box(0.7 * s, 0.14 * s, 0.6 * s, x, 1.9 * s, z, red);
      for (const yy of [1.3, 1.55, 1.8]) k.sphere(0.05 * s, x, yy * s, z + 0.44 * s, black, 6);
      for (const sgn of [-1, 1]) k.beam(v(x + sgn * 0.4 * s, 1.55 * s, z), v(x + sgn * 1.05 * s, 2.1 * s, z + 0.1), 0.03, bark, 5);
      k.keepOut.push({ x, z, r: 0.8 * s });
    };
    const soldier = (x: number, z: number, ry: number, h = 2.6) => {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
      const add = (geo: T.BufferGeometry, m: T.Material, px: number, py: number, pz: number) => { const o = new T.Mesh(geo, m); o.position.set(px, py, pz); g.add(o); return o; };
      const u = h / 2.6;
      add(new T.BoxGeometry(0.5 * u, 0.12 * u, 0.5 * u), black, 0, 0.06 * u, 0);
      for (const sgn of [-1, 1]) add(new T.CylinderGeometry(0.11 * u, 0.13 * u, 0.9 * u, 8), navy, sgn * 0.15 * u, 0.57 * u, 0);
      add(new T.CylinderGeometry(0.3 * u, 0.3 * u, 0.9 * u, 12), red, 0, 1.47 * u, 0);
      add(new T.BoxGeometry(0.08 * u, 0.7 * u, 0.06 * u), gold, 0, 1.47 * u, 0.29 * u);
      for (const sgn of [-1, 1]) { add(new T.CylinderGeometry(0.09 * u, 0.09 * u, 0.8 * u, 8), red, sgn * 0.39 * u, 1.45 * u, 0); add(new T.SphereGeometry(0.1 * u, 8, 6), wSnow, sgn * 0.39 * u, 1.02 * u, 0); }
      add(new T.SphereGeometry(0.24 * u, 12, 9), skin, 0, 2.08 * u, 0);
      add(new T.CylinderGeometry(0.25 * u, 0.24 * u, 0.42 * u, 12), black, 0, 2.5 * u, 0);
      add(new T.BoxGeometry(0.52 * u, 0.08 * u, 0.06 * u), gold, 0, 2.32 * u, 0.24 * u);
      for (const sgn of [-1, 1]) { add(new T.SphereGeometry(0.04 * u, 6, 4), black, sgn * 0.08 * u, 2.13 * u, 0.22 * u); add(new T.SphereGeometry(0.06 * u, 6, 4), red, sgn * 0.13 * u, 2.02 * u, 0.2 * u); }
      bake(k, g); k.keepOut.push({ x, z, r: 0.5 * u });
      soldiers.push({ x, z, ry });
      return g;
    };
    const deer = (x: number, z: number, ry: number) => {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
      const geo = mergeGeometries([part(0.5, 0.55, 1.2, 0, 1.15, 0), part(0.28, 0.5, 0.3, 0, 1.6, 0.6, -0.5), part(0.24, 0.22, 0.42, 0, 1.92, 0.86), ...[-1, 1].flatMap((sx) => [part(0.1, 0.9, 0.1, sx * 0.17, 0.45, 0.45), part(0.1, 0.9, 0.1, sx * 0.17, 0.45, -0.45)]), part(0.06, 0.06, 0.25, 0, 1.4, -0.68, 0.6)])!;
      g.add(new T.Mesh(geo, tan));
      const ant: T.BufferGeometry[] = [];
      for (const sx of [-1, 1]) for (const [dx, dy, dz] of [[0.35, 0.45, 0], [0.22, 0.4, 0.14], [0.4, 0.25, -0.1]]) { const a = new T.CylinderGeometry(0.02, 0.03, 0.5, 5); a.rotateX(dz * 1.2); a.rotateZ(-sx * 0.6); a.translate(sx * dx * 0.5 + sx * 0.05, 2.12 + dy * 0.5, 0.86 + dz); ant.push(a); }
      g.add(new T.Mesh(mergeGeometries(ant)!, trim));
      const nose = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), k.glow(0xff2a2a)); nose.position.set(0, 1.9, 1.09); g.add(nose);
      const lights = new T.Mesh(new T.BoxGeometry(0.56, 0.6, 1.26), wire); lights.position.set(0, 1.15, 0); g.add(lights);
      k.add(g); k.keepOut.push({ x, z, r: 0.9 }); reindeer.push(g);
    };
    const angel = (x: number, z: number, ry: number) => {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
      const body = new T.Mesh(new T.ConeGeometry(0.5, 2.0, 10, 3, true), wSnow); body.position.y = 1.0; g.add(body);
      const head = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), skin); head.position.y = 2.2; g.add(head);
      const halo = new T.Mesh(new T.TorusGeometry(0.26, 0.025, 4, 16), haloM); halo.position.y = 2.48; halo.rotation.x = PI / 2; g.add(halo);
      for (const w of [-1, 1]) { const wing = new T.Mesh(new T.PlaneGeometry(0.9, 1.4), wire); wing.position.set(w * 0.55, 1.6, -0.25); wing.rotation.y = -w * 0.7; g.add(wing); }
      const horn = new T.Mesh(new T.CylinderGeometry(0.03, 0.12, 1.1, 8), gold); horn.position.set(0.3, 2.1, 0.4); horn.rotation.z = -1.1; horn.rotation.x = 0.5; g.add(horn);
      bake(k, g); k.keepOut.push({ x, z, r: 0.6 });
    };
    const cane = (x: number, z: number, h = 2.2) => {
      const pts = [v(x, 0, z), v(x, h * 0.8, z), v(x + 0.05, h * 0.97, z), v(x + 0.3, h, z), v(x + 0.55, h * 0.9, z), v(x + 0.6, h * 0.72, z)];
      k.curve(pts, 0.07, red, 24);
      for (let i = 0; i < 8; i++) k.torus(0.075, 0.035, x, 0.15 + i * (h * 0.78) / 8, z, wSnow, 12).rotation.x = PI / 2;
      k.keepOut.push({ x: x + 0.3, z, r: 0.45 });
    };
    const bauble = (x: number, y: number, z: number, r: number, c: number) => { k.sphere(r, x, y, z, k.flat(c, 0.6, 0.25, { emissive: c, emissiveIntensity: 0.5 }), 16); k.cyl(r * 0.2, r * 0.3, x, y + r + r * 0.12, z, gold, r * 0.2, 8); };
    const palettes = [[0xfff4d8], [0xff3b3b, 0x3bff6a, 0x3b8cff, 0xffd23b, 0xffffff], [0x9ad8ff, 0xffffff], [0xff3b3b, 0xffffff], [0xffd23b, 0xff8c3b], [0x3bff6a, 0xff3b3b], [0xfff4d8, 0x3b8cff], [0xff5aa0, 0xffffff, 0x8a5aff], [0xffd23b], [0xffffff, 0xff3b3b, 0x3bff6a]];
    const modes = [1, 2, 3, 0, 4, 2, 1, 3, 0, 2];

    lots.forEach((L, li) => {
      const { cx, s } = L, g = li + 1, rnd = X.mulberry(1780 + li), cols = palettes[li % palettes.length];
      patterns[g] = { speed: 1.4 + rnd() * 1.6, mode: modes[li] };
      /* the lot: lawn under snow, a walk to the door, the driveway beside the house, the iron fence with its gate */
      const fz = s * 8.2, hz0 = s * 13.5, hz1 = s * 23.5, hw = 8.5, hx = cx - 1.5, gx = cx + 4.95, gw = 4.1, dz0 = s * 15.5, dz1 = s * 21.5;
      k.box(14, 0.16, 5.3, cx, 0.08, s * 10.85, snow);
      k.box(1.2, 0.02, 5.4, hx, 0.17, s * 10.85, walk);
      k.box(3.6, 0.02, 7.4, gx, 0.17, s * 11.85, asph);
      for (let x = cx - 7; x <= cx + 7.01; x += 1.75) { if (Math.abs(x - gx) < 2.0) continue; k.box(0.08, 1.1, 0.08, x, 0.55, fz, iron); k.sphere(0.07, x, 1.14, fz, iron, 6); }
      for (const [a, b] of [[cx - 7, hx - 0.6], [hx + 0.6, gx - 1.8]]) for (const y of [0.4, 1.0]) k.box(b - a, 0.05, 0.05, (a + b) / 2, y, fz, iron);
      for (const y of [0.3, 0.75, 1.0]) k.box(1.2, 0.04, 0.04, hx, y, fz, iron);
      for (let x = hx - 0.5; x <= hx + 0.5; x += 0.1) k.box(0.025, 1.0, 0.025, x, 0.5, fz, iron);
      blk(cx - 7.1, gx - 1.8, fz - 0.4, hz0);            /* the fenced lawn */
      blk(cx - 7.1, gx - 1.8, hz0, hz1 + 0.5);            /* the house */
      blk(gx - 1.8, cx + 7.1, dz0, hz1 + 0.5);            /* the garage */
      blk(gx + 1.8, cx + 7.1, fz - 0.4, dz0);             /* the side yard past the drive */
      /* the house: two floors, a pitched roof under snow, a porch on two columns, lit windows */
      const bm = bodyMats[li % bodyMats.length], hH = 6.8, hd = Math.abs(hz1 - hz0);
      k.box(hw, hH, hd, hx, hH / 2, (hz0 + hz1) / 2, bm);
      {
        const sh = new T.Shape(); sh.moveTo(-hd / 2 - 0.5, 0); sh.lineTo(hd / 2 + 0.5, 0); sh.lineTo(0, 3.2); sh.closePath();
        const roof = new T.ExtrudeGeometry(sh, { depth: hw + 0.8, bevelEnabled: false }); roof.rotateY(PI / 2); roof.translate(hx + (hw + 0.8) / 2, hH, (hz0 + hz1) / 2);
        k.mesh(roof, slate);
        const sh2 = new T.Shape(); sh2.moveTo(-hd / 2 - 0.55, 0); sh2.lineTo(hd / 2 + 0.55, 0); sh2.lineTo(0, 3.25); sh2.closePath();
        const snowG = new T.ExtrudeGeometry(sh2, { depth: hw + 0.9, bevelEnabled: false }); snowG.rotateY(PI / 2); snowG.translate(hx + (hw + 0.9) / 2, hH + 0.12, (hz0 + hz1) / 2);
        k.mesh(snowG, snowRoof);
        k.box(0.8, 1.6, 0.8, hx + 2.6, hH + 2.6, (hz0 + hz1) / 2 + 1.5, brick);
      }
      for (let f = 0; f < 2; f++) for (const wx of [hx - 2.6, hx + 2.6, ...(f === 1 ? [hx] : [])]) {
        k.box(1.3, 1.7, 0.1, wx, 2.0 + f * 3.1, hz0 - s * 0.03, winRnd() < 0.7 ? winLit : winDark);
        k.box(1.5, 0.12, 0.2, wx, 2.95 + f * 3.1, hz0 - s * 0.1, trim);
        const y0 = 2.0 + f * 3.1 - 0.85, y1 = y0 + 1.7, zz = hz0 - s * 0.12;
        lineBulbs(v(wx - 0.7, y0, zz), v(wx + 0.7, y0, zz), 0.24, g, cols); lineBulbs(v(wx - 0.7, y1, zz), v(wx + 0.7, y1, zz), 0.24, g, cols);
        lineBulbs(v(wx - 0.7, y0, zz), v(wx - 0.7, y1, zz), 0.24, g, cols); lineBulbs(v(wx + 0.7, y0, zz), v(wx + 0.7, y1, zz), 0.24, g, cols);
      }
      k.box(1.2, 2.4, 0.12, hx, 1.2, hz0 - s * 0.05, doorM); k.sphere(0.04, hx + 0.45, 1.1, hz0 - s * 0.12, gold, 6);
      k.torus(0.42, 0.1, hx, 2.0, hz0 - s * 0.16, green, 20);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; bulb(hx + Math.cos(a) * 0.42, 2.0 + Math.sin(a) * 0.42, hz0 - s * 0.28, g, cols[i % cols.length]); }
      for (let i = 0; i < 4; i++) k.box(2.0, 0.16, 0.5, hx, 0.08 + i * 0.16, hz0 - s * (0.3 + (3 - i) * 0.5), stone);
      for (const px of [hx - 1.3, hx + 1.3]) { k.cyl(0.14, 3.2, px, 1.6 + 0.64, hz0 - s * 2.2, trim, 0.14, 12); wrap(px, 0.8, 3.7, hz0 - s * 2.2, 0.2, 6, g, cols, 44); }
      k.box(3.6, 0.25, 2.6, hx, 3.95, hz0 - s * 1.3, slate); k.box(3.7, 0.1, 2.7, hx, 4.12, hz0 - s * 1.3, snowRoof);
      lineBulbs(v(hx - 1.85, 3.85, hz0 - s * 2.65), v(hx + 1.85, 3.85, hz0 - s * 2.65), 0.2, g, cols);
      /* the roof outline: eaves, the two gable edges facing the street, the ridge */
      const ez = hz0 - s * 0.5, fz2 = hz1 + s * 0.5, ry = hH + 0.14, top = hH + 3.35;
      lineBulbs(v(hx - hw / 2 - 0.4, ry, ez), v(hx + hw / 2 + 0.4, ry, ez), 0.2, g, cols);
      lineBulbs(v(hx - hw / 2 - 0.45, ry, ez), v(hx - hw / 2 - 0.45, top, (hz0 + hz1) / 2), 0.22, g, cols); lineBulbs(v(hx - hw / 2 - 0.45, top, (hz0 + hz1) / 2), v(hx - hw / 2 - 0.45, ry, fz2), 0.22, g, cols);
      lineBulbs(v(hx + hw / 2 + 0.45, ry, ez), v(hx + hw / 2 + 0.45, top, (hz0 + hz1) / 2), 0.22, g, cols); lineBulbs(v(hx + hw / 2 + 0.45, top, (hz0 + hz1) / 2), v(hx + hw / 2 + 0.45, ry, fz2), 0.22, g, cols);
      lineBulbs(v(hx - hw / 2 - 0.45, top + 0.05, (hz0 + hz1) / 2), v(hx + hw / 2 + 0.45, top + 0.05, (hz0 + hz1) / 2), 0.22, g, cols);
      /* the garage with its double door, the roof line lit too */
      k.box(gw, 3.4, Math.abs(dz1 - dz0), gx, 1.7, (dz0 + dz1) / 2, bm);
      k.box(gw + 0.3, 0.3, Math.abs(dz1 - dz0) + 0.3, gx, 3.55, (dz0 + dz1) / 2, slate); k.box(gw + 0.3, 0.1, Math.abs(dz1 - dz0) + 0.3, gx, 3.75, (dz0 + dz1) / 2, snowRoof);
      k.box(gw - 0.4, 2.7, 0.1, gx, 1.4, dz0 - s * 0.04, trim);
      for (let i = 1; i < 4; i++) k.box(gw - 0.5, 0.03, 0.12, gx, 0.05 + i * 0.66, dz0 - s * 0.08, iron);
      lineBulbs(v(gx - gw / 2 - 0.2, 3.7, dz0 - s * 0.2), v(gx + gw / 2 + 0.2, 3.7, dz0 - s * 0.2), 0.2, g, cols);
      lineBulbs(v(gx - gw / 2 - 0.2, 0.2, dz0 - s * 0.2), v(gx - gw / 2 - 0.2, 3.7, dz0 - s * 0.2), 0.2, g, cols); lineBulbs(v(gx + gw / 2 + 0.2, 0.2, dz0 - s * 0.2), v(gx + gw / 2 + 0.2, 3.7, dz0 - s * 0.2), 0.2, g, cols);
      /* the fence lit along its top rail, the gate posts capped */
      lineBulbs(v(cx - 7, 1.16, fz), v(gx - 1.9, 1.16, fz), 0.3, g, cols);
      for (const px of [gx - 1.9, gx + 1.9]) { k.box(0.3, 1.5, 0.3, px, 0.75, fz, stone); k.sphere(0.16, px, 1.62, fz, k.glow(cols[0]), 10); }
      /* a wrapped bare tree on every lawn, a warm light in the middle of it */
      const tx = cx - 4.8 + rnd() * 1.2, tz = s * (9.8 + rnd() * 1.6);
      wireTree(tx, tz, 4.2 + rnd() * 1.4, g, cols, 1790 + li); k.keepOut.push({ x: tx, z: tz, r: 0.5 });
      k.point(cx - 1, 2.6, s * 10.6, 0xffd8a0, 22, 15);
      /* the display: each lot its own cast */
      const face = s > 0 ? PI : 0;
      switch (li % 10) {
        case 0: snowman(cx + 1.2, s * 10.4, 1.1); snowman(cx - 1.4, s * 11.6, 0.8); cane(cx + 2.4, s * 9.4); cane(cx - 2.8, s * 9.6); break;
        case 1: soldier(hx - 1.2, s * 9.2, face, 2.8); soldier(hx + 1.2, s * 9.2, face, 2.8); bauble(cx + 1.6, 0.9, s * 11.4, 0.75, 0xc0202a); bauble(cx + 0.4, 0.6, s * 10.2, 0.5, 0xd8a850); break;
        case 2: {
          /* the motorised display: a turning stand of small figures and stars under a lit canopy, and the nutcracker */
          const tg = new T.Group(); tg.position.set(cx + 1.4, 0.16, s * 10.6);
          const base = new T.Mesh(new T.CylinderGeometry(1.6, 1.7, 0.3, 24), red); base.position.y = 0.15; tg.add(base);
          for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; const f = new T.Mesh(figureGeo(0.13, 0.4, 0.86), i % 2 ? green : wSnow); f.position.set(Math.cos(a) * 1.15, 0.3, Math.sin(a) * 1.15); f.rotation.y = -a + PI / 2; tg.add(f); const s2 = new T.Mesh(new T.OctahedronGeometry(0.14, 0), k.glow(cols[i % cols.length])); s2.position.set(Math.cos(a + 0.5) * 0.7, 1.4 + 0.2 * (i % 2), Math.sin(a + 0.5) * 0.7); tg.add(s2); }
          const pole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.6, 8), gold); pole.position.y = 1.3; tg.add(pole);
          const cap = new T.Mesh(new T.ConeGeometry(1.9, 0.7, 16, 1, true), red); cap.position.y = 2.75; cap.material = k.flat(0xc0202a, 0, 0.5, { emissive: 0x7a0a12, emissiveIntensity: 0.6, side: T.DoubleSide }); tg.add(cap);
          k.add(tg); turnStands.push(tg); k.keepOut.push({ x: cx + 1.4, z: s * 10.6, r: 2.0 });
          for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2; bulb(cx + 1.4 + Math.cos(a) * 1.9, 2.55, s * 10.6 + Math.sin(a) * 1.9, g, cols[i % cols.length]); }
          k.prop('nutcracker', cx - 3.2, 0.16, s * 9.6, { height: 3.5, rotY: face, keepOut: 0.7 }).then((o) => { if (o) nutcrackerG = o; });
          break;
        }
        case 3: deer(cx - 2.6, s * 10.2, face + 0.3); deer(cx + 0.2, s * 10.6, face - 0.2); deer(cx + 2.8, s * 10.0, face + 0.15); {
          /* the sleigh behind them */
          const sx = cx - 0.2, sz = s * 12.2; k.box(2.2, 0.9, 1.2, sx, 0.75, sz, red); k.box(2.4, 0.12, 0.2, sx, 0.34, sz - 0.5, gold); k.box(2.4, 0.12, 0.2, sx, 0.34, sz + 0.5, gold); k.box(0.9, 0.6, 1.1, sx - 0.6, 1.5, sz, red); k.keepOut.push({ x: sx, z: sz, r: 1.4 });
          for (let i = 0; i < 8; i++) bulb(sx - 1.05 + i * 0.3, 1.24, sz - 0.62, g, cols[i % cols.length]);
        } break;
        case 4: angel(cx + 1.0, s * 9.6, face); angel(cx - 1.6, s * 10.8, face + 0.2); angel(cx + 3.0, s * 11.2, face - 0.2); bauble(cx - 3.2, 0.8, s * 12.4, 0.65, 0x3b8cff); break;
        case 5: soldier(cx - 6.2, s * 9.0, face, 3.2); soldier(cx + 1.8, s * 9.0, face, 3.2); snowman(cx - 2.6, s * 11.4, 1.3); cane(cx + 0.6, s * 11.6, 2.6); break;
        case 6: { /* an inflatable snowman, three metres of glowing white, and a ring of baubles */
          snowman(cx - 0.4, s * 11.2, 1.7);
          for (let i = 0; i < 5; i++) bauble(cx - 5.4 + i * 1.3, 0.55, s * 9.6, 0.42, [0xc0202a, 0xd8a850, 0x1e6a34, 0x3b8cff, 0xff5aa0][i]);
          break;
        }
        case 7: deer(cx + 1.4, s * 10.4, face + 0.4); deer(cx + 3.6, s * 11.4, face - 0.3); angel(cx - 2.8, s * 10.2, face); cane(cx - 5.6, s * 9.4); cane(cx - 0.6, s * 9.4); break;
        case 8: soldier(hx - 1.3, s * 9.0, face); soldier(hx + 1.3, s * 9.0, face); soldier(cx - 6.0, s * 10.4, face + 0.4, 2.2); bauble(cx + 2.0, 0.9, s * 11.6, 0.8, 0x1e6a34); break;
        default: snowman(cx + 2.0, s * 10.6, 1.0); angel(cx - 1.0, s * 11.4, face); cane(cx - 3.6, s * 9.6); bauble(cx + 0.6, 0.5, s * 9.6, 0.42, 0xd8a850); break;
      }
      /* the works: two lit gilt frames standing on the lawn edge behind the fence, facing the sidewalk */
      for (const fx of [cx - 5.2, cx + 0.9]) {
        const fzz = fz + s * 0.45;
        k.box(1.9, 1.45, 0.1, fx, 1.55, fzz + s * 0.08, black);
        for (const sx of [-1, 1]) k.box(0.08, 2.25, 0.08, fx + sx * 0.98, 1.125, fzz + s * 0.12, iron);
        lineBulbs(v(fx - 1.0, 2.34, fzz - s * 0.02), v(fx + 1.0, 2.34, fzz - s * 0.02), 0.2, g, [0xfff4d8]);
        hang(mounts, fx, 1.55, fzz, face, 1.6, 1.15, st, 3.4);
      }
      /* a garage door carries a frame on two of the north lots, the census wall on the middle one */
      if (s < 0 && (cx === -14 || cx === 14)) hang(mounts, gx, 1.75, dz0 + 0.06, 0, 2.0, 1.4, st, 3.4);
      if (s < 0 && cx === 0) k.censusWall({ x: gx, y: 1.75, z: dz0 + 0.07, rotY: 0, cols: 9, rows: 5, tile: 0.34, gap: 0.03, start: ctx.wallStart(1450, 45), pieces: ctx.all, backing: black });
    });

    /* ---- the bulbs: one InstancedMesh, per house colour groups, per frame brightness by pattern ---- */
    {
      const NB = bulbs.length, lights = k.instances(new T.SphereGeometry(0.06, 5, 3), new T.MeshBasicMaterial({ color: 0xffffff }), bulbs.map((b) => new T.Matrix4().makeTranslation(b.x, b.y, b.z)));
      lights.frustumCulled = false;
      const c = new T.Color(), base = new Int32Array(NB), grp = new Uint8Array(NB), ph = new Float32Array(NB), rnd = X.mulberry(1799);
      bulbs.forEach((b, i) => { base[i] = b.c; grp[i] = b.g; ph[i] = rnd() * 6.3; lights.setColorAt(i, c.set(b.c)); });
      if (lights.instanceColor) lights.instanceColor.needsUpdate = true;
      let show = 0, lastClock = -1;
      if (!ctx.reduced) k.ticks.push((t) => {
        /* on the quarter hour by the New York clock, for its first thirty seconds, every house chases together */
        const ts = Math.floor(t);
        if (ts !== lastClock) { lastClock = ts; const { m, s } = nyClock(); show = m % 15 === 0 && s < 30 ? 1 : 0; }
        for (let i = 0; i < NB; i++) {
          const g = grp[i]; let b = 1;
          if (g === 0) b = 0.9;
          else if (show) b = ((i + Math.floor(t * 8)) % 4) === 0 ? 1 : 0.18;
          else {
            const p = patterns[g], sp = p.speed;
            if (p.mode === 0) b = 1;
            else if (p.mode === 1) b = 0.55 + 0.45 * Math.sin(t * sp * 0.8 + ph[i] * 0.2);
            else if (p.mode === 2) b = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * sp + ph[i]));
            else if (p.mode === 3) b = ((i + Math.floor(t * sp * 2)) % 3) === 0 ? 1 : 0.3;
            else b = Math.sin(t * sp * 3 + ph[i] * 7) > 0.6 ? 1 : 0.5;
          }
          lights.setColorAt(i, c.set(base[i]).multiplyScalar(b));
        }
        if (lights.instanceColor) lights.instanceColor.needsUpdate = true;
      });
    }
    /* the reindeer rock, the stand turns, the nutcracker turns */
    if (!ctx.reduced) k.ticks.push((t) => {
      reindeer.forEach((g, i) => { g.rotation.x = 0.12 * Math.sin(t * 1.6 + i * 1.1); g.position.y = 0.16 + 0.03 * Math.abs(Math.sin(t * 1.6 + i * 1.1)); });
      turnStands.forEach((g) => { g.rotation.y = t * 0.45; });
      if (nutcrackerG) nutcrackerG.rotation.y = t * 0.35;
    });

    /* ---- the traffic: slow cars, parked cars, and the tour bus that stops when you stand at the kerb ---- */
    traffic(k, ctx, { lanes: [{ z: -1.6, dir: -1, n: 4, speed: 3.2 }, { z: -3.5, dir: 0, n: 7 }], x0: -60, x1: 60, seed: 1774 });
    const busSpill: T.InstancedMesh | null = null; void busSpill;
    {
      const bus = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(11, 2.4, 2.5), k.flat(0xb0b6be, 0.5, 0.4)); body.position.y = 1.9; bus.add(body);
      const skirt = new T.Mesh(new T.BoxGeometry(11.02, 0.7, 2.54), k.flat(0x1e2a5a, 0.3, 0.45)); skirt.position.y = 1.05; bus.add(skirt);
      const roof = new T.Mesh(new T.BoxGeometry(11.2, 0.35, 2.6), k.flat(0x3a4048, 0.3, 0.6)); roof.position.y = 3.25; bus.add(roof);
      const glass = new T.Mesh(new T.BoxGeometry(10.6, 0.9, 2.56), k.flat(0xffe0b0, 0, 0.4, { emissive: 0xffc890, emissiveIntensity: 0.7 })); glass.position.y = 2.45; bus.add(glass);
      const shield = new T.Mesh(new T.BoxGeometry(0.3, 1.6, 2.3), k.flat(0x1a2028, 0.7, 0.15)); shield.position.set(5.5, 2.3, 0); bus.add(shield);
      for (const sx of [-3.6, 3.6]) for (const sz of [-1.1, 1.1]) { const w = new T.Mesh(new T.CylinderGeometry(0.52, 0.52, 0.4, 12), black); w.position.set(sx, 0.52, sz); w.rotation.x = PI / 2; bus.add(w); }
      for (const sz of [-0.8, 0.8]) { const h = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), k.glow(0xfff4d8)); h.position.set(5.55, 1.1, sz); bus.add(h); const tl = new T.Mesh(new T.BoxGeometry(0.1, 0.25, 0.4), k.glow(0xff2a2a)); tl.position.set(-5.55, 1.3, sz); bus.add(tl); }
      const doorL = new T.Mesh(new T.BoxGeometry(1.1, 2.1, 0.08), k.flat(0x2a3a6a, 0.3, 0.4)); doorL.position.set(3.6, 1.75, 1.27); bus.add(doorL);
      const hl = k.spot(0, 1.1, 0, 10, 0.2, 0, 0xfff0d8, 60, 0.5, 0.6, 22); if (hl instanceof T.SpotLight && hl.target instanceof T.Object3D) { bus.add(hl); bus.add(hl.target); hl.target.position.set(10, 0.2, 0); }
      bus.position.set(-70, 0, 1.9); k.add(bus);
      /* its crowd: fourteen people who step down to the sidewalk when it stops, and climb back in before it leaves */
      const NP = 14, ppl = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: NP }, () => new T.Matrix4().compose(v(0, -5, 0), new T.Quaternion(), hide)));
      ppl.frustumCulled = false;
      const c = new T.Color(), rnd = X.mulberry(1775), winter = [0x1c232c, 0xd82a3a, 0x2a2a34, 0xe8e2d4, 0x2a5fb8, 0x3a3a3a, 0x8a4a2a, 0xf0c22a];
      const dest = Array.from({ length: NP }, () => ({ x: (rnd() - 0.5) * 9, z: 5.2 + rnd() * 2.2, ry: -PI / 2 + (rnd() - 0.5) * 0.8, delay: rnd() * 6, h: 1.0 + rnd() * 0.16 }));
      for (let i = 0; i < NP; i++) ppl.setColorAt(i, c.set(winter[Math.floor(rnd() * winter.length)]));
      if (ppl.instanceColor) ppl.instanceColor.needsUpdate = true;
      const STOP = -22, m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3();
      let x = -70, vel = 6, state = 0, held = 0, since = 0;   /* 0 driving, 1 braking, 2 stopped with doors open, 3 boarding, 4 leaving */
      if (!ctx.reduced) k.ticks.push((_t, dt) => {
        const d = Math.min(dt, 0.1), camera = cam();
        const atKerb = !!camera && camera.position.z > 1.6 && camera.position.z < 7.8 && Math.abs(camera.position.x - STOP) < 9;
        if (state === 0) { x += vel * d; if (x > 70) x = -70; if (atKerb && x > STOP - 30 && x < STOP - 1) state = 1; }
        else if (state === 1) { const rem = Math.max(0.2, STOP - x); vel = Math.max(0.6, Math.min(vel, Math.sqrt(2 * 1.2 * rem))); x += vel * d; if (x >= STOP - 0.05) { x = STOP; state = 2; held = 0; since = 0; } }
        else if (state === 2) { held += d; since += d; if (held > 26 || (!atKerb && held > 12)) { state = 3; since = 0; } }
        else if (state === 3) { since += d; if (since > 7) { state = 4; vel = 0.5; } }
        else { vel = Math.min(6, vel + 1.6 * d); x += vel * d; if (x > STOP + 12) state = 0; }
        doorL.position.z = state === 2 || state === 3 ? 0.9 : 1.27; doorL.position.x = state === 2 || state === 3 ? 4.7 : 3.6;
        bus.position.x = x;
        for (let i = 0; i < NP; i++) {
          const a = dest[i]; let u = 0;
          if (state === 2) u = clamp01((since - a.delay) / 4);
          else if (state === 3) u = 1 - clamp01((since - a.delay * 0.5) / 4);
          if (u <= 0.001) { m.compose(p.set(0, -5, 0), q, hide); ppl.setMatrixAt(i, m); continue; }
          const sx = STOP + 3.6, sz = 3.2;
          p.set(sx + (a.x - sx) * u, 0.08 * Math.abs(Math.sin(u * 14)) * (u < 1 ? 1 : 0), sz + (a.z - sz) * u); q.setFromAxisAngle(up, u < 0.98 ? Math.atan2(a.x - sx, a.z - sz) : a.ry); sc.set(1, a.h, 1);
          m.compose(p, q, sc); ppl.setMatrixAt(i, m);
        }
        ppl.instanceMatrix.needsUpdate = true;
      });
      /* a second coach already parked further up the block, dark, engine off */
      const parked = bus.clone(true); parked.position.set(26, 0, 1.9); parked.remove(...parked.children.filter((ch) => !(ch instanceof T.Mesh))); bake(k, parked);
      blk(20.4, 31.6, 0.5, 3.3);
    }
    /* the sidewalk crowd: walkers both ways, and knots of people standing at the fences with their cups */
    if (!ctx.reduced) {
      const winter = [0x1c232c, 0xd82a3a, 0x2a2a34, 0xe8e2d4, 0x2a5fb8, 0x3a3a3a, 0x8a4a2a, 0xf0c22a];
      k.crowd([v(-34, 0.1, -6.4), v(34, 0.1, -6.4)], 18, { seed: 1776, speed: 0.55, spread: 1.6, colors: winter });
      k.crowd([v(-34, 0.1, 6.4), v(34, 0.1, 6.4)], 16, { seed: 1777, speed: 0.5, spread: 1.6, colors: winter });
    }
    {
      const rnd = X.mulberry(1778), pts: { x: number; y: number; z: number; ry: number }[] = [];
      for (const L of lots) for (let i = 0; i < 4; i++) { const x = L.cx - 5 + rnd() * 10, z = L.s * (6.4 + rnd() * 1.2); pts.push({ x, y: 0.1, z, ry: L.s > 0 ? 0 : PI }); }
      const o = still(k, pts, 1779, [0x1c232c, 0xd82a3a, 0x2a2a34, 0xe8e2d4, 0x2a5fb8, 0x3a3a3a, 0x8a4a2a, 0xf0c22a]);
      void o;
      const cups = k.instances(new T.CylinderGeometry(0.04, 0.035, 0.11, 6), k.flat(0xf0ece4, 0, 0.8), pts.map((p) => new T.Matrix4().makeTranslation(p.x + (p.ry ? -0.25 : 0.25), 1.05, p.z + (p.ry ? -0.15 : 0.15))));
      void cups;
      vapour(k, pts.filter((_, i) => i % 3 === 0).map((p) => v(p.x + (p.ry ? -0.25 : 0.25), 1.15, p.z + (p.ry ? -0.15 : 0.15))), 3, { rise: 0.5, spread: 0.15, size: 0.04, opacity: 0.14, colour: 0xe8f0ff, seed: 1781, speed: 0.35, animate: !ctx.reduced });
    }
    snowfall(k, ctx, 1400, { x0: -42, x1: 42, z0: -16, z1: 16, h: 14 }, 1782);

    /* ---- what the block knows ---- */
    const src = { name: 'Dyker Heights, Brooklyn, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dyker_Heights,_Brooklyn' };
    k.egg(v(0, 3.6, -13.4), { id: 'dyker-1980s', title: 'Sometime in the 1980s', text: 'Nobody agrees on which December the lights began. Newspaper reports and the tours of the area suggest the tradition started sometime in the 1980s, and it grew house by house from there.', clue: 'The most lit house on the block. Ask how long this has been going on.', source: src }, { r: 3 });
    k.egg(v(-14, 1.2, -8.2), { id: 'dyker-84th', title: '84th Street, between 11th and 12th', text: 'Early on, the two most noted homes were on 84th Street between 11th and 12th Avenues, directly across from one another, and that stretch is still the heart of the display.', clue: 'Stand at a gate and look across the street at the house facing it.', source: src }, { r: 2.4 });
    k.egg(v(26, 2.2, 1.9), { id: 'dyker-tours-1985', title: 'The first tours, 1985', year: '1985', text: 'In 1985 Lou Singer began running tours, Singer\'s Brooklyn, through the most elaborately lit parts of Bensonhurst, Canarsie, Bay Ridge and Dyker Heights. The coaches have been coming ever since.', clue: 'The coach parked up the block with its engine off.', source: src }, { r: 5 });
    k.egg(v(14, 1.8, 8.2), { id: 'dyker-season', title: 'Thanksgiving to the first days of January', text: 'Formally the lighting and the decorations begin on the last Thursday of November, Thanksgiving, and stay up until the first days of January, with mid December the most visited.', clue: 'A fence on the south side, lit along its rail.', source: src }, { r: 2.4 });
    k.egg(v(28, 4, 13.4), { id: 'dyker-1895', title: 'A speculative luxury development, 1895', year: '1895', text: 'Dyker Heights was laid out by Walter Loveridge Johnson from October 1895, and built between 1895 and 1902 as a speculative luxury housing development on the high ground above Gravesend Bay.', clue: 'The oldest thing on the block is the plan of the block. Look at the house at the east end.', source: src }, { r: 3 });
    k.egg(v(-28, 3, 13.4), { id: 'dyker-italian', title: 'Since the 1940s', text: 'Since the 1940s Dyker Heights has had a majority Italian American population, which is the tradition the lights grew out of. By 2020 the neighbourhood\'s Asian population had passed its white population.', clue: 'The house at the west end of the south side.', source: src }, { r: 3 });

    return { mounts, spawn: v(-9, 3.1, 5.6), look: v(-3, 4.5, -13), eye: 3, bounds: [-35, 35, -15.3, 15.3], style: 'gilt' };
  },
};

/* ================================================================== */
/* ---------------- 178 THREE IN THE MORNING AT HUNTS POINT ---------------- */
export const huntspoint: RoomDef = {
  id: 'huntspoint',
  name: 'Three in the morning at Hunts Point',
  area: 'HUNTS POINT PRODUCE MARKET / THE BRONX',
  mood: 'Sodium light, cold air, forklifts',
  color: '#3a5a3a',
  daylit: false,
  description: 'The Hunts Point Produce Market at three in the morning, the busiest hour of its day: a refrigerated warehouse a third of a mile long with numbered dock doors, trailers backed in with their reefers running, forklifts racing pallets along the dock under sodium light, buyers with hand trucks, a coffee cart, breath in the cold and the Bronx night over the yard. The New Yorkers hang on the dock wall between the doors, in the dispatcher\'s office, and on a pallet of framed works stacked on the dock as if they came in with the produce.',
  signatures: 'The long dock under its steel canopy, the numbered roll up doors, the door that rolls up as you reach it and the cold room behind it, the trailers backed to the bumpers with their reefer units, the tractors with their marker lights, the trailer backing in from the yard, six forklifts on the dock with pallets and amber beacons, the stacked cases and open bins of oranges, the buyers with hand trucks, the coffee cart and its steam, the dispatcher\'s office with its clock on New York time, the far warehouse row and the high mast lights over the yard.',
  build(k, ctx) {
    k.sky({ top: 0x04050a, horizon: 0x2a1c10, ground: 0x07070a, fog: 0.0065, stars: 220, env: 0.35 });
    k.hemi(0x5a5040, 0x141418, 2.0);
    k.sun(0xaebde8, 0.18, 40, 70, 60, true, 120);
    const sodium = 0xffa848;
    const conc = k.pbr('hpConc', X.concrete(0x8a8c8a, 182), 0.35, { roughness: 0.95 }), block = k.pbr('hpBlock', X.concrete(0xb4b8b4, 183), 0.25, { roughness: 0.85 }), panel = k.flat(0xaeb2b2, 0.25, 0.6),
      asph = k.pbr('hpAsph', X.asphalt(0x1c1e22), 0.3, { roughness: 0.65 }), steel = k.pbr('hpSteel', X.steel(0x4a5058, false, 184), 0.5, { roughness: 0.5, metalness: 0.6 }),
      steelD = k.flat(0x2a2e34, 0.7, 0.45), gal = k.flat(0x8a9098, 0.8, 0.35), doorM = k.flat(0x9a9ea2, 0.6, 0.4), doorD = k.flat(0x6a6e72, 0.6, 0.45), bumper = k.flat(0x141416, 0.2, 0.9),
      yellow = k.flat(0xe8c020, 0.2, 0.55), white = k.flat(0xb8bcc0, 0.4, 0.45), reefer = k.flat(0xd0d4d8, 0.5, 0.4), black = k.flat(0x141416, 0.2, 0.8),
      wood = k.pbr('hpWood', X.planks(0x9a7a50, 4, 185), 1.2, { roughness: 0.9 }), card = k.flat(0xb08a5a, 0, 0.95), glassM = k.glass(0xa8c8d8, 0.25, 0.1),
      cold = k.flat(0xdfeaf4, 0, 0.9, { emissive: 0x9ac0e0, emissiveIntensity: 0.5 }), sodGlow = k.flat(0xffc070, 0, 0.6, { emissive: sodium, emissiveIntensity: 0.8 }),
      amber = k.glow(0xffa020), red = k.glow(0xff3020), lineM = k.flat(0xe8e0b0, 0, 0.8), hiVis = 0xd8e83a;
    const mounts: Mount[] = [], st: FrameStyle = 'steel';
    const blk = (x0: number, x1: number, z0: number, z1: number) => k.block(Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1));
    const DY = 1.3, DOCK = -6, X0 = -66, X1 = 66;

    /* ---- the building: a refrigerated warehouse along x, its dock face at z = -6, doors every 6.6 m ---- */
    k.box(X1 - X0 + 40, 11, 24.8, 0, 5.5, DOCK - 17.6, block);
    k.box(X1 - X0 + 40, 0.5, 5.6, 0, 10.75, DOCK - 2.6, block);
    k.box(X1 - X0 + 40.4, 0.6, 30.4, 0, 11.2, DOCK - 15, steelD);
    /* the dock face: insulated panel in one long wall with a gap for every door, the doors themselves fill the gaps */
    {
      const doorXs = Array.from({ length: 20 }, (_, i) => X0 + 3.3 + i * 6.6);
      let cur = X0 - 20;
      for (const dx of doorXs) { k.box(dx - 1.65 - cur, 9.6, 0.2, (cur + dx - 1.65) / 2, DY + 4.8 + 0.5, DOCK + 0.02, panel); k.box(3.3, 9.6 - 3.2, 0.2, dx, DY + 3.2 + (9.6 - 3.2) / 2 + 0.5, DOCK + 0.02, panel); cur = dx + 1.65; }
      k.box(X1 + 20 - cur, 9.6, 0.2, (cur + X1 + 20) / 2, DY + 4.8 + 0.5, DOCK + 0.02, panel);
      for (let y = DY + 0.9; y < 11; y += 1.0) { if (y < DY + 3.3) { let c2 = X0 - 20; for (const dx of doorXs) { k.box(dx - 1.65 - c2, 0.04, 0.24, (c2 + dx - 1.65) / 2, y, DOCK + 0.02, steelD); c2 = dx + 1.65; } k.box(X1 + 20 - c2, 0.04, 0.24, (c2 + X1 + 20) / 2, y, DOCK + 0.02, steelD); } else k.box(X1 - X0 + 40, 0.04, 0.24, 0, y, DOCK + 0.02, steelD); }
    }
    for (let x = -60; x <= 60; x += 30) k.box(4, 2.2, 5, x, 12.2, DOCK - 12, gal);
    /* the dock: platform, bumpers, the yellow edge line, the canopy on steel columns with sodium fixtures under it */
    k.box(X1 - X0, DY, -DOCK, 0, DY / 2, DOCK / 2, conc);
    k.box(X1 - X0, 0.06, 0.3, 0, DY + 0.02, -0.15, yellow);
    k.box(X1 - X0 + 0.4, 0.5, 0.6, 0, 6.6, -1.5, steel);
    k.box(X1 - X0 + 0.4, 0.14, 9.6, 0, 6.95, -1.2, k.flat(0x9a9ea2, 0.3, 0.7));
    for (let x = X0 + 3.3; x < X1; x += 6.6) { k.box(0.3, 6.6 - DY, 0.3, x, DY + (6.6 - DY) / 2, -0.8, steel); k.keepOut.push({ x, z: -0.8, r: 0.4 }); for (let zz = -5; zz <= 3; zz += 1.6) k.box(0.2, 0.3, 0.2, x, 6.65, zz, steelD); }
    for (let x = X0 + 6.6; x < X1; x += 6.6) k.box(0.6, 0.12, 1.4, x, 6.55, -3, sodGlow);
    for (let x = X0 + 6.6; x < X1; x += 6.6) k.point(x, 6.2, -3, sodium, 22, 16, 1.8);
    for (let x = X0 + 3.3; x < X1; x += 13.2) k.point(x, 6.0, 3.0, sodium, 26, 18, 1.6);
    /* the yard: asphalt, lane lines, the far warehouse row facing us, the high masts */
    k.box(X1 - X0 + 40, 0.2, 60, 0, -0.1, 30, asph);
    for (let x = X0 - 10; x < X1 + 10; x += 6) k.box(3, 0.01, 0.16, x, 0.01, 30, lineM);
    k.box(X1 - X0 + 40, 11, 26, 0, 5.5, 71, block); k.box(X1 - X0 + 40.4, 0.6, 26.4, 0, 11.2, 71, steelD);
    k.box(X1 - X0 + 40, DY, 6, 0, DY / 2, 55, conc); k.box(X1 - X0 + 40.4, 0.5, 8, 0, 6.6, 54, steel);
    for (let x = X0 - 10 + 3.3; x < X1 + 10; x += 6.6) { k.box(3.0, 3.0, 0.1, x, DY + 1.5, 58.0, doorD); k.box(0.6, 0.12, 1.4, x + 3.3, 6.55, 55, sodGlow); }
    for (const x of [-45, 0, 45]) { k.cyl(0.3, 20, x, 10, 36, gal, 0.2, 8); k.box(2.4, 0.5, 1.0, x, 20.2, 36, steelD); k.box(2.2, 0.3, 0.5, x, 19.9, 35.6, sodGlow); k.spot(x, 20, 36, x, 0, 18, sodium, 900, 0.8, 0.5, 70); k.keepOut.push({ x, z: 36, r: 0.6 }); }
    k.skyline({ z: 150, count: 34, spacing: 6, scale: 0.9, base: 0, seed: 186, lit: 0.18, x: 0, glow: 0.3, spires: false });

    /* ---- the doors: twenty roll up doors numbered 201 to 220, three of them alive ---- */
    const doors: { x: number; i: number }[] = [];
    for (let i = 0; i < 20; i++) doors.push({ x: X0 + 3.3 + i * 6.6, i });
    const alive = new Set([5, 10, 15]), backing = 17, noTrailer = new Set([5, 10, 15, 17, 2, 12]);
    const rolling: { mesh: T.Mesh; x: number; open: number; light: T.PointLight }[] = [];
    for (const d of doors) {
      const y0 = DY, DW = 3.0, DH = 3.0;
      k.box(DW + 0.5, 0.5, 0.5, d.x, y0 + DH + 0.3, DOCK + 0.1, doorD);
      for (const sx of [-1, 1]) k.box(0.2, DH + 0.2, 0.2, d.x + sx * (DW / 2 + 0.1), y0 + DH / 2, DOCK + 0.08, steelD);
      k.box(2.2, 0.25, 0.7, d.x, y0 - 0.45, DOCK + 6.15, steelD);
      for (const sx of [-1.1, 1.1]) k.box(0.36, 0.5, 0.2, d.x + sx, y0 - 0.25, -0.1, bumper);
      k.sign(String(201 + d.i), 1.0, 0.42, d.x, y0 + DH + 0.32, DOCK + 0.36, '#16181c', '#f0e8d0', 150);
      if (alive.has(d.i)) {
        /* a cold room behind it: white walls, blue light, racks of cases, and the door that rolls up */
        const rz = DOCK - 2.6;
        k.box(3.6, 0.1, 5, d.x, y0, rz, conc);
        for (const sx of [-1, 1]) k.box(0.1, 3.6, 5, d.x + sx * 1.8, y0 + 1.8, rz, cold);
        k.box(3.6, 0.1, 5, d.x, y0 + 3.6, rz, cold); k.box(3.6, 3.6, 0.1, d.x, y0 + 1.8, rz - 2.5, cold); k.box(3.6, 6, 5.2, d.x, y0 + 3.6 + 3, rz, block);
        for (const sx of [-1.15, 1.15]) for (let r = 0; r < 3; r++) k.box(1.1, 0.05, 4.4, d.x + sx, y0 + 0.9 + r * 1.0, rz, gal);
        const light = k.point(d.x, y0 + 3.3, rz, 0xcfe4ff, 0, 7, 1.8);
        const mesh = k.mesh(new T.BoxGeometry(DW, DH, 0.1), doorM, d.x, y0 + DH / 2, DOCK + 0.05, true);
        for (let i = 1; i < 8; i++) { const s = new T.Mesh(new T.BoxGeometry(DW - 0.1, 0.02, 0.12), steelD); s.position.y = -DH / 2 + i * (DH / 8); mesh.add(s); }
        rolling.push({ mesh, x: d.x, open: 0, light });
        blk(d.x - 1.9, d.x + 1.9, DOCK - 5.2, DOCK - 4.8);
      } else {
        k.box(DW, DH, 0.1, d.x, y0 + DH / 2, DOCK + 0.05, doorM);
        for (let i = 1; i < 8; i++) k.box(DW - 0.1, 0.02, 0.12, d.x, y0 + i * (DH / 8), DOCK + 0.05, steelD);
      }
    }
    /* the dock wall is solid except where an alive door opens onto its cold room */
    {
      let cur = X0 - 1;
      for (const d of doors) { if (!alive.has(d.i)) continue; blk(cur, d.x - 1.5, DOCK - 0.6, DOCK + 0.3); cur = d.x + 1.5; }
      blk(cur, X1 + 1, DOCK - 0.6, DOCK + 0.3);
    }
    /* the visitor cannot step off the dock except at the two stairs; the yard is reached down them */
    const stairs = [-36.5, 36.5];
    { let cur = X0 - 1; for (const sx of stairs) { blk(cur, sx - 1.6, -0.3, 0.9); cur = sx + 1.6; } blk(cur, X1 + 1, -0.3, 0.9); }
    for (const sx of stairs) { for (let i = 0; i < 6; i++) k.box(3.0, DY * (1 - i / 6), 0.5, sx, DY * (1 - i / 6) / 2, 0.25 + i * 0.5, conc); for (const s of [-1, 1]) k.rail(sx + s * 1.55, 1.75, 3.2, gal, 1.0, 'z', 1.6); k.box(3.0, 0.06, 0.3, sx, DY + 0.02, -0.15, yellow); }
    const floorY = (x: number, z: number) => {
      if (z <= 0) return DY;
      for (const sx of stairs) if (Math.abs(x - sx) < 1.6 && z < 3.2) return DY * clamp01(1 - z / 3.0);
      return 0;
    };

    /* ---- trailers backed to the doors, tractors on some; the parked row in the yard ---- */
    {
      const bodyG = new T.BoxGeometry(2.55, 2.7, 14.6); bodyG.translate(0, DY + 1.35 + 0.15, 7.3 + 0.3);
      const ribs = mergeGeometries(Array.from({ length: 24 }, (_, i) => part(2.6, 2.6, 0.06, 0, DY + 1.5, 1.0 + i * 0.6)))!;
      const rear = part(2.4, 2.55, 0.06, 0, DY + 1.4, 0.3);
      const trailerG = mergeGeometries([bodyG, ribs])!;
      const wheelG = new T.CylinderGeometry(0.5, 0.5, 0.35, 12); wheelG.rotateZ(PI / 2);
      const wheels = (sx: number, dz: number) => { const g = wheelG.clone(); g.translate(sx, 0.5, dz); return g; };
      const gearG = mergeGeometries([wheels(-1.05, 2.0), wheels(1.05, 2.0), wheels(-1.05, 3.3), wheels(1.05, 3.3), part(0.16, 1.2, 0.16, -0.9, 0.6, 12.6), part(0.16, 1.2, 0.16, 0.9, 0.6, 12.6), part(2.4, 0.3, 12, 0, DY - 0.05, 8), rear])!;
      const reeferG = mergeGeometries([part(2.2, 2.0, 0.5, 0, DY + 1.7, 15.2), part(1.6, 0.9, 0.2, 0, DY + 1.9, 15.55)])!;
      const spots: { x: number; z: number; ry: number; tractor: boolean }[] = [];
      const rnd = X.mulberry(187);
      for (const d of doors) if (!noTrailer.has(d.i)) spots.push({ x: d.x, z: 0.0, ry: 0, tractor: rnd() < 0.45 });
      const parkedRow = [-52, -38, -24, 14, 28, 44];
      for (const x of parkedRow) spots.push({ x, z: 24, ry: 0, tractor: false });
      const N = spots.length, c = new T.Color(), greys = [0xb8bcc0, 0xc8ccd0, 0xa8acb0, 0xd0d0d4, 0x9aa0a4];
      const mk = (g: T.BufferGeometry, m: T.Material) => { const o = k.instances(g, m, spots.map((s) => new T.Matrix4().compose(v(s.x, 0, s.z), new T.Quaternion().setFromAxisAngle(up, s.ry), one))); return o; };
      const tb = mk(trailerG, new T.MeshStandardMaterial({ roughness: 0.45, metalness: 0.5 })); spots.forEach((_, i) => tb.setColorAt(i, c.set(greys[i % greys.length]))); if (tb.instanceColor) tb.instanceColor.needsUpdate = true;
      mk(gearG, black); mk(reeferG, reefer);
      for (const s of spots) { blk(s.x - 1.45, s.x + 1.45, s.z + 0.2, s.z + 15.8); }
      /* tractors: a cab with a sleeper, a stack, marker lights */
      const tract = spots.filter((s) => s.tractor);
      const cabG = mergeGeometries([part(2.4, 1.9, 2.0, 0, 1.45, 17.6), part(2.4, 2.3, 1.6, 0, 1.75, 16.2), part(2.5, 0.5, 4.2, 0, 0.55, 17.4), part(0.3, 1.3, 0.3, 1.3, 2.9, 16.2), part(0.3, 1.3, 0.3, -1.3, 2.9, 16.2), part(2.2, 0.9, 0.1, 0, 2.1, 18.62), part(0.9, 0.4, 0.5, 0, 0.6, 15.6)])!;
      const cabW = mergeGeometries([wheels(-1.05, 14.6), wheels(1.05, 14.6), wheels(-1.05, 18.0), wheels(1.05, 18.0)])!;
      const cabs = k.instances(cabG, new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.4 }), tract.map((s) => new T.Matrix4().compose(v(s.x, 0, s.z), new T.Quaternion(), one)));
      const cpal = [0xa82a2a, 0x2a4a9a, 0xe0e0e0, 0x1e6a3a, 0x3a3a40];
      tract.forEach((_, i) => cabs.setColorAt(i, c.set(cpal[i % cpal.length]))); if (cabs.instanceColor) cabs.instanceColor.needsUpdate = true;
      k.instances(cabW, black, tract.map((s) => new T.Matrix4().compose(v(s.x, 0, s.z), new T.Quaternion(), one)));
      const markers: T.Matrix4[] = [];
      for (const s of tract) for (const dx of [-1.0, -0.5, 0, 0.5, 1.0]) markers.push(new T.Matrix4().makeTranslation(s.x + dx, 3.6, s.z + 16.9));
      k.instances(new T.BoxGeometry(0.12, 0.08, 0.1), amber, markers);
      for (const s of tract) blk(s.x - 1.3, s.x + 1.3, s.z + 15.8, s.z + 19.0);
      /* the one backing in: door 218, a trailer and tractor as one group on a slow cycle through the yard */
      const bx = doors[backing].x, truck = new T.Group();
      truck.add(new T.Mesh(trailerG, new T.MeshStandardMaterial({ color: 0xc0c4c8, roughness: 0.45, metalness: 0.5 })), new T.Mesh(gearG, black), new T.Mesh(reeferG, reefer), new T.Mesh(cabG, k.flat(0x2a4a9a, 0.4, 0.35)), new T.Mesh(cabW, black));
      for (const dx of [-1.0, -0.5, 0, 0.5, 1.0]) { const mk2 = new T.Mesh(new T.BoxGeometry(0.12, 0.08, 0.1), amber); mk2.position.set(dx, 3.6, 16.9); truck.add(mk2); }
      for (const dx of [-0.9, 0.9]) { const tl = new T.Mesh(new T.BoxGeometry(0.3, 0.14, 0.06), red); tl.position.set(dx, DY + 0.35, 0.26); truck.add(tl); const hl = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), k.glow(0xfff0d0)); hl.position.set(dx * 1.1, 1.1, 18.66); truck.add(hl); }
      const revL = new T.Mesh(new T.BoxGeometry(0.2, 0.12, 0.06), k.glow(0xffffff)); revL.position.set(0, DY + 0.35, 0.26); truck.add(revL);
      truck.position.set(-95, 0, 30); truck.rotation.y = -PI / 2; k.add(truck);
      const exhaust = vapour(k, [v(1.3, 3.6, 16.2)], 14, { rise: 3, spread: 0.4, size: 0.08, opacity: 0.22, colour: 0xb8c0c8, seed: 188, speed: 0.5, animate: !ctx.reduced });
      exhaust.position.set(0, 0, 0); truck.add(exhaust);
      const beep = k.point(bx, 1.5, 6, 0xffb040, 0, 10, 1.8);
      let phase = 0, u = 0;   /* 0 along the yard lane, 1 swinging round, 2 backing, 3 at the door, 4 pulling out, 5 swinging back, 6 away */
      if (!ctx.reduced) k.ticks.push((t, dt) => {
        const d = Math.min(dt, 0.1);
        if (phase === 0) { truck.position.x += 5.5 * d; truck.rotation.y = -PI / 2; if (truck.position.x >= bx) { truck.position.x = bx; phase = 1; u = 0; } }
        else if (phase === 1) { u += d / 3.5; truck.rotation.y = -PI / 2 + u * (PI / 2); if (u >= 1) { truck.rotation.y = 0; phase = 2; } }
        else if (phase === 2) { truck.position.z -= 1.1 * d; revL.visible = Math.sin(t * 8) > 0; beep.intensity = Math.sin(t * 8) > 0 ? 6 : 0; if (truck.position.z <= 0.05) { truck.position.z = 0.05; phase = 3; u = 0; revL.visible = false; beep.intensity = 0; } }
        else if (phase === 3) { u += d; if (u > 28) { phase = 4; } }
        else if (phase === 4) { truck.position.z += 1.6 * d; if (truck.position.z >= 30) { truck.position.z = 30; phase = 5; u = 0; } }
        else if (phase === 5) { u += d / 3.5; truck.rotation.y = -u * (PI / 2); if (u >= 1) { truck.rotation.y = -PI / 2; phase = 6; } }
        else { truck.position.x += 5.5 * d; if (truck.position.x > 100) { truck.position.x = -95; phase = 0; } }
        exhaust.visible = phase !== 3 || Math.sin(t * 0.7) > -0.4;
      });
      blk(bx - 1.5, bx + 1.5, 0.2, 19.2);
    }

    /* ---- pallets, cases and open bins along the dock, hand trucks, the coffee cart ---- */
    {
      const rnd = X.mulberry(189), pal: T.Matrix4[] = [], cases: T.Matrix4[] = [], ccol: number[] = [], fruit: T.Matrix4[] = [], fcol: number[] = [];
      const casePal = [0xb08a5a, 0x9a7a4c, 0xc09a66, 0x2e7a3a, 0xa83a2a, 0x2a5aa8, 0xe8e0c8];
      const stack = (x: number, z: number, ry: number, high: number, open = false) => {
        pal.push(new T.Matrix4().compose(v(x, DY + 0.07, z), new T.Quaternion().setFromAxisAngle(up, ry), one));
        const col = casePal[Math.floor(rnd() * casePal.length)];
        for (let r = 0; r < high; r++) for (const [dx, dz] of [[-0.29, -0.24], [0.29, -0.24], [-0.29, 0.24], [0.29, 0.24]]) {
          if (open && r === high - 1) continue;
          cases.push(new T.Matrix4().compose(v(x + dx * Math.cos(ry) - dz * Math.sin(ry), DY + 0.14 + 0.16 + r * 0.32, z + dx * Math.sin(ry) + dz * Math.cos(ry)), new T.Quaternion().setFromAxisAngle(up, ry), one)); ccol.push(col);
        }
        if (open) { const fc = [0xff8a2a, 0xd82a2a, 0x7ac83a, 0xf0d040][Math.floor(rnd() * 4)]; for (let i = 0; i < 26; i++) { fruit.push(new T.Matrix4().makeTranslation(x + (rnd() - 0.5) * 1.0, DY + 0.14 + (high - 1) * 0.32 + 0.1 + rnd() * 0.08, z + (rnd() - 0.5) * 0.8)); fcol.push(fc); } }
        k.keepOut.push({ x, z, r: 0.85 });
      };
      for (const d of doors) {
        if (d.x < X0 + 11.5 || Math.abs(d.x - 45.2) < 4) continue;   /* not in the office, not round the pallet of works */
        if (rnd() < 0.7) stack(d.x - 2.4 + rnd() * 0.4, DOCK + 1.0, rnd() * 0.3, 2 + Math.floor(rnd() * 4), rnd() < 0.3);
        if (rnd() < 0.5) stack(d.x + 2.3, DOCK + 1.2, rnd() * 0.3, 1 + Math.floor(rnd() * 3), rnd() < 0.3);
        if (rnd() < 0.4) stack(d.x + (rnd() - 0.5) * 2, -1.3, rnd() * 0.5, 1 + Math.floor(rnd() * 2), rnd() < 0.4);
      }
      /* the pallet of framed works, four cases high, three frames leaning against its front */
      const PX = 45.2, PZ = DOCK + 1.6;
      pal.push(new T.Matrix4().compose(v(PX, DY + 0.07, PZ), new T.Quaternion(), one));
      for (let r = 0; r < 4; r++) for (const [dx, dz] of [[-0.29, -0.24], [0.29, -0.24], [-0.29, 0.24], [0.29, 0.24]]) { cases.push(new T.Matrix4().compose(v(PX + dx, DY + 0.3 + r * 0.32, PZ + dz), new T.Quaternion(), one)); ccol.push(0xe8e0c8); }
      k.keepOut.push({ x: PX, z: PZ, r: 1.0 });
      for (const [dx, w, h] of [[-1.35, 1.1, 0.85], [0, 1.3, 0.95], [1.35, 1.1, 0.85]]) { const o = k.box(w + 0.2, h + 0.2, 0.08, PX + dx, DY + h / 2 + 0.12, PZ + 0.62, black); o.rotation.x = -0.14; hang(mounts, PX + dx, DY + h / 2 + 0.14, PZ + 0.68, 0, w, h, st, 2.6, -0.14); }
      k.instances(new T.BoxGeometry(1.2, 0.14, 1.0), wood, pal);
      const cm = k.instances(new T.BoxGeometry(0.56, 0.3, 0.46), new T.MeshStandardMaterial({ roughness: 0.95 }), cases); const c = new T.Color(); ccol.forEach((h, i) => cm.setColorAt(i, c.set(h))); if (cm.instanceColor) cm.instanceColor.needsUpdate = true;
      const fm = k.instances(new T.SphereGeometry(0.06, 7, 5), new T.MeshStandardMaterial({ roughness: 0.6 }), fruit); fcol.forEach((h, i) => fm.setColorAt(i, c.set(h))); if (fm.instanceColor) fm.instanceColor.needsUpdate = true;
      /* hand trucks leaning by the pallets */
      const htG = mergeGeometries([part(0.05, 1.3, 0.05, -0.22, 0.65, 0, 0.25), part(0.05, 1.3, 0.05, 0.22, 0.65, 0, 0.25), part(0.5, 0.05, 0.05, 0, 1.28, -0.32), part(0.5, 0.04, 0.4, 0, 0.02, 0.2)])!;
      const wG = new T.CylinderGeometry(0.12, 0.12, 0.05, 10); wG.rotateZ(PI / 2);
      const htW = mergeGeometries([wG.clone().translate(-0.3, 0.12, 0), wG.clone().translate(0.3, 0.12, 0)])!;
      const hts: T.Matrix4[] = [];
      for (const [x, z, ry] of [[-50, -2.2, 0.4], [-31, -3.8, 2.6], [-8, -1.4, 1.2], [3, -4.6, 0.2], [21, -2.0, 3.0], [37, -3.9, 1.9], [52, -1.6, 0.6], [60, -4.4, 2.2]]) hts.push(new T.Matrix4().compose(v(x, DY, z), new T.Quaternion().setFromAxisAngle(up, ry), one));
      k.instances(htG, gal, hts); k.instances(htW, black, hts);
      /* the coffee cart under the canopy, with steam, and the knot of buyers round it */
      const CX = -30, CZ = DOCK + 1.5;
      k.box(1.8, 0.9, 0.9, CX, DY + 0.55, CZ, k.flat(0xd8d8dc, 0.6, 0.35)); k.box(1.9, 0.06, 1.0, CX, DY + 1.02, CZ, gal);
      for (const [dx, dz] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) { const w = k.mesh(new T.CylinderGeometry(0.16, 0.16, 0.08, 10), black, CX + dx, DY + 0.16, CZ + dz); w.rotation.z = PI / 2; }
      k.box(0.5, 0.5, 0.4, CX - 0.5, DY + 1.3, CZ - 0.1, k.flat(0x8a8a90, 0.7, 0.3)); k.box(0.2, 0.3, 0.2, CX + 0.5, DY + 1.2, CZ - 0.2, k.flat(0xf0ece4, 0, 0.8));
      for (const dx of [-0.85, 0.85]) k.box(0.05, 2.0, 0.05, CX + dx, DY + 2.0, CZ + 0.4, gal);
      k.box(2.1, 0.06, 1.3, CX, DY + 3.0, CZ + 0.2, k.flat(0xa82a2a, 0, 0.7)); k.point(CX, DY + 2.6, CZ + 0.4, 0xffe0b0, 10, 6);
      k.keepOut.push({ x: CX, z: CZ, r: 1.2 });
      vapour(k, [v(CX - 0.5, DY + 1.6, CZ - 0.1), v(CX + 0.3, DY + 1.1, CZ)], 10, { rise: 1.4, spread: 0.3, size: 0.06, opacity: 0.22, colour: 0xe8f0ff, seed: 190, speed: 0.35, animate: !ctx.reduced });
      const knot = [{ x: CX - 1.6, z: CZ + 1.6, ry: -0.8 }, { x: CX + 1.4, z: CZ + 1.8, ry: 0.9 }, { x: CX, z: CZ + 2.4, ry: 0 }, { x: CX + 0.8, z: CZ + 3.2, ry: 0.4 }, { x: CX - 0.9, z: CZ + 3.0, ry: -0.3 }].map((p) => ({ ...p, y: DY }));
      still(k, knot, 191, [0x1c1e24, 0x2a2e38, hiVis, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, hiVis, 0x5a4a3a]);
      vapour(k, knot.map((p) => v(p.x + Math.sin(p.ry) * 0.25, DY + 1.5, p.z + Math.cos(p.ry) * 0.25)), 3, { rise: 0.5, spread: 0.15, size: 0.04, opacity: 0.13, colour: 0xe8f0ff, seed: 192, speed: 0.4, animate: !ctx.reduced });
      /* buyers and drivers standing at the doors */
      const standers: { x: number; y: number; z: number; ry: number }[] = [];
      for (const d of doors) if (d.x > X0 + 11.5 && Math.abs(d.x - 45.2) > 4 && rnd() < 0.5) standers.push({ x: d.x + (rnd() - 0.5) * 3, y: DY, z: DOCK + 1.6 + rnd() * 2.6, ry: rnd() * 6.3 });
      still(k, standers, 193, [0x1c1e24, hiVis, 0x2a2e38, 0x1a1a1c, 0x4a4a52, hiVis, 0x2c3a4a, 0x5a4a3a]);
      for (const p of standers) k.keepOut.push({ x: p.x, z: p.z, r: 0.4 });
    }
    /* the walking buyers with hand trucks: the crowd helper along the dock, both ways */
    if (!ctx.reduced) {
      const coats = [0x1c1e24, hiVis, 0x2a2e38, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, hiVis];
      k.crowd([v(X0 + 4, DY, DOCK + 3.2), v(X1 - 4, DY, DOCK + 3.2)], 16, { seed: 194, speed: 0.9, spread: 1.4, colors: coats });
      k.crowd([v(X0 + 6, 0, 18), v(X1 - 6, 0, 18)], 6, { seed: 195, speed: 0.8, spread: 1.4, colors: coats });
    }

    /* ---- six forklifts on the dock: bodies, masts and forks, loads, drivers, beacons, one InstancedMesh each ---- */
    {
      const NF = 6, bodyG = mergeGeometries([part(1.1, 0.6, 1.9, 0, 0.55, 0), part(1.0, 0.7, 0.9, 0, 1.2, -0.4), part(0.14, 1.4, 0.14, -0.5, 1.75, 0.4), part(0.14, 1.4, 0.14, 0.5, 1.75, 0.4), part(0.14, 1.4, 0.14, -0.5, 1.75, -0.9), part(0.14, 1.4, 0.14, 0.5, 1.75, -0.9), part(1.2, 0.08, 1.4, 0, 2.45, -0.25), part(0.8, 0.5, 0.06, 0, 0.6, -0.98)])!;
      const mastG = mergeGeometries([part(0.1, 2.2, 0.1, -0.42, 1.2, 1.0), part(0.1, 2.2, 0.1, 0.42, 1.2, 1.0), part(0.95, 0.1, 0.1, 0, 2.3, 1.0), part(0.9, 0.35, 0.06, 0, 0.5, 1.02), part(0.12, 0.05, 1.15, -0.3, 0.16, 1.62), part(0.12, 0.05, 1.15, 0.3, 0.16, 1.62)])!;
      const wG = new T.CylinderGeometry(0.28, 0.28, 0.22, 10); wG.rotateZ(PI / 2);
      const wheelsG = mergeGeometries([wG.clone().translate(-0.62, 0.28, 0.65), wG.clone().translate(0.62, 0.28, 0.65), wG.clone().translate(-0.62, 0.28, -0.6), wG.clone().translate(0.62, 0.28, -0.6)])!;
      const loadG = mergeGeometries([part(1.15, 0.13, 0.95, 0, 0.26, 1.62), ...[0, 1, 2].flatMap((r) => [[-0.29, -0.24], [0.29, -0.24], [-0.29, 0.24], [0.29, 0.24]].map(([dx, dz]) => part(0.56, 0.3, 0.46, dx, 0.33 + 0.16 + r * 0.32, 1.62 + dz)))])!;
      const driverG = figureGeo(0.17, 0.42, 0.95); driverG.translate(0, 0.62, -0.35);
      const mats = Array.from({ length: NF }, () => new T.Matrix4());
      const bodies = k.instances(bodyG, new T.MeshStandardMaterial({ roughness: 0.5, metalness: 0.3 }), mats), masts = k.instances(mastG, black, mats), wheels = k.instances(wheelsG, black, mats), loads = k.instances(loadG, card, mats), drivers = k.instances(driverG, new T.MeshStandardMaterial({ roughness: 0.9 }), mats), beacons = k.instances(new T.SphereGeometry(0.1, 8, 6), amber, mats);
      for (const o of [bodies, masts, wheels, loads, drivers, beacons]) o.frustumCulled = false;
      const c = new T.Color(), fpal = [0xe8a020, 0xe8a020, 0xd8c020, 0x2a7ad8, 0xe8a020, 0xc83a2a], dpal = [hiVis, 0x1c1e24, hiVis, 0x2a2e38, hiVis, 0x4a4a52];
      for (let i = 0; i < NF; i++) { bodies.setColorAt(i, c.set(fpal[i])); drivers.setColorAt(i, c.set(dpal[i])); }
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true; if (drivers.instanceColor) drivers.instanceColor.needsUpdate = true;
      const rnd = X.mulberry(196);
      const fl = Array.from({ length: NF }, (_, i) => ({ x: X0 + 8 + rnd() * (X1 - X0 - 16), z: i % 2 ? DOCK + 1.9 : DOCK + 4.4, dir: rnd() < 0.5 ? 1 : -1, v: 3.2 + rnd() * 2.2, x0: X0 + 4 + rnd() * 20, x1: X1 - 4 - rnd() * 20, loaded: rnd() < 0.7, ph: rnd() * 6 }));
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3();
      let busy = 1, lastSec = -1;
      const place = (t: number, dt: number) => {
        const d = Math.min(dt, 0.1), ts = Math.floor(t);
        if (ts !== lastSec) { lastSec = ts; const { h } = nyClock(); busy = h >= 21 || h < 9 ? 1 : 0.4; }   /* the market works the night; by day it thins */
        fl.forEach((a, i) => {
          a.x += a.dir * a.v * busy * d;
          if (a.x > a.x1) { a.x = a.x1; a.dir = -1; a.loaded = !a.loaded; } if (a.x < a.x0) { a.x = a.x0; a.dir = 1; a.loaded = !a.loaded; }
          const yaw = a.dir > 0 ? PI / 2 : -PI / 2;
          q.setFromAxisAngle(up, yaw); p.set(a.x, DY, a.z); m.compose(p, q, one);
          bodies.setMatrixAt(i, m); masts.setMatrixAt(i, m); wheels.setMatrixAt(i, m); drivers.setMatrixAt(i, m);
          m.compose(p, q, a.loaded ? one : hide); loads.setMatrixAt(i, m);
          const on = Math.sin(t * 6 + a.ph) > 0.2; p.set(a.x, DY + 2.55, a.z - Math.cos(yaw) * 0.25); m.compose(p, q, on ? one : hide); beacons.setMatrixAt(i, m);
        });
        for (const o of [bodies, masts, wheels, loads, drivers, beacons]) o.instanceMatrix.needsUpdate = true;
      };
      place(0, 0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* the alive doors roll up as the visitor comes to them and roll down when they go */
    if (!ctx.reduced) k.ticks.push((_t, dt) => {
      const camera = cam(); if (!camera) return;
      const d = Math.min(dt, 0.1);
      for (const r of rolling) {
        const near = Math.abs(camera.position.x - r.x) < 4.5 && camera.position.z < 1.5 && camera.position.z > DOCK - 1;
        r.open = clamp01(r.open + (near ? d / 1.8 : -d / 2.6));
        r.mesh.position.y = DY + 1.5 + r.open * 2.85; r.mesh.scale.y = 1 - r.open * 0.92;
        r.light.intensity = 14 * r.open;
      }
    });

    /* ---- the dispatcher's office at the west end of the dock: glass front, a desk, screens, the clock ---- */
    {
      const OX0 = X0, OX1 = X0 + 10, OZ0 = DOCK, OZ1 = DOCK + 5.2, OY = DY, OH = 3.2;
      k.box(OX1 - OX0, 0.1, OZ1 - OZ0, (OX0 + OX1) / 2, OY + 0.02, (OZ0 + OZ1) / 2, k.flat(0x6a6e6a, 0, 0.9));
      k.box(OX1 - OX0 + 0.4, 0.3, OZ1 - OZ0 + 0.4, (OX0 + OX1) / 2, OY + OH + 0.15, (OZ0 + OZ1) / 2, steelD);
      k.box(0.2, OH, OZ1 - OZ0, OX0 + 0.1, OY + OH / 2, (OZ0 + OZ1) / 2, block);
      /* the east wall facing the dock carries the census wall; the front is glass over a low wall with a door */
      k.box(0.2, OH, OZ1 - OZ0, OX1 - 0.1, OY + OH / 2, (OZ0 + OZ1) / 2, block); blk(OX1 - 0.4, OX1 + 0.2, OZ0 - 0.2, OZ1 + 0.2);
      k.box(OX1 - OX0, 1.0, 0.2, (OX0 + OX1) / 2, OY + 0.5, OZ1 - 0.1, block);
      k.box(OX1 - OX0, OH - 1.0, 0.04, (OX0 + OX1) / 2, OY + 1.0 + (OH - 1.0) / 2, OZ1 - 0.1, glassM);
      for (const x of [OX0 + 2.5, OX0 + 5, OX0 + 7.5]) k.box(0.1, OH, 0.1, x, OY + OH / 2, OZ1 - 0.1, steelD);
      k.box(1.1, 2.3, 0.12, OX1 - 1.4, OY + 1.15, OZ1 - 0.1, k.flat(0x3a3e44, 0.4, 0.5));
      blk(OX0 - 0.2, OX1 - 2.1, OZ1 - 0.4, OZ1 + 0.2); blk(OX1 - 0.7, OX1 + 0.2, OZ1 - 0.4, OZ1 + 0.2);
      for (let i = 0; i < 3; i++) k.plane(0.6, 0.6, OX0 + 2 + i * 3, OY + OH - 0.02, OZ0 + 2.6, k.glow(0xfff0d8), 0, PI / 2);
      k.point((OX0 + OX1) / 2, OY + 2.8, OZ0 + 2.6, 0xfff0d8, 14, 10);
      /* the desk along the back wall, two screens, a chair, a dispatcher */
      k.box(4.4, 0.08, 0.8, OX0 + 3.6, OY + 0.78, OZ0 + 0.6, k.flat(0x5a4a3a, 0, 0.7)); for (const dx of [-2.0, 2.0]) k.box(0.1, 0.76, 0.7, OX0 + 3.6 + dx, OY + 0.38, OZ0 + 0.6, steelD);
      for (const dx of [-1.0, 0.4]) { k.box(0.7, 0.42, 0.04, OX0 + 3.6 + dx, OY + 1.12, OZ0 + 0.45, k.flat(0x6ab0ff, 0, 0.5, { emissive: 0x4a90e0, emissiveIntensity: 0.9 })); k.box(0.08, 0.1, 0.08, OX0 + 3.6 + dx, OY + 0.86, OZ0 + 0.45, black); }
      k.box(0.5, 0.06, 0.5, OX0 + 3.3, OY + 0.5, OZ0 + 1.5, black); k.box(0.5, 0.5, 0.06, OX0 + 3.3, OY + 0.8, OZ0 + 1.75, black);
      still(k, [{ x: OX0 + 3.3, y: OY, z: OZ0 + 1.5, ry: PI, sit: true }], 197, [0x2a2e38]);
      k.keepOut.push({ x: OX0 + 3.6, z: OZ0 + 1.0, r: 2.2 });
      /* the clock: New York time, redrawn every second */
      const clockTex = canvasTex(256, 96, (g) => { g.fillStyle = '#101214'; g.fillRect(0, 0, 256, 96); });
      const drawClock = (h: number, m: number, s: number) => {
        const cnv = clockTex.image as HTMLCanvasElement; const g = cnv && cnv.getContext ? cnv.getContext('2d') : null; if (!g) return;
        g.fillStyle = '#101214'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#ff3a2a'; g.font = '700 64px Helvetica Neue, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, 128, 50); clockTex.needsUpdate = true;
      };
      { const { h, m, s } = nyClock(); drawClock(h, m, s); }
      k.mesh(new T.PlaneGeometry(1.4, 0.52), new T.MeshBasicMaterial({ map: clockTex }), OX0 + 7.6, OY + 2.5, OZ0 + 0.12, true);
      k.box(1.5, 0.62, 0.06, OX0 + 7.6, OY + 2.5, OZ0 + 0.08, black);
      let lastS = -1;
      if (!ctx.reduced) k.ticks.push(() => { const { h, m, s } = nyClock(); if (s !== lastS) { lastS = s; drawClock(h, m, s); } });
      /* the works inside: on the back wall and the west wall; the census wall on the outside of the east wall */
      for (const x of [OX0 + 1.4, OX0 + 8.6]) hang(mounts, x, OY + 2.1, OZ0 + 0.12, 0, 1.6, 1.15, st, 3.0);
      hang(mounts, OX0 + 0.22, OY + 2.1, OZ0 + 3.2, PI / 2, 1.6, 1.15, st, 3.0);
      k.censusWall({ x: OX1 + 0.02, y: OY + 1.8, z: OZ0 + 2.6, rotY: PI / 2, cols: 8, rows: 5, tile: 0.44, gap: 0.04, start: ctx.wallStart(1550, 40), pieces: ctx.all, backing: steelD });
      k.sign('DISPATCH', 1.6, 0.4, (OX0 + OX1) / 2, OY + OH + 0.55, OZ1 + 0.1, '#16181c', '#f0e8d0', 120);
    }
    /* ---- the works on the dock wall between the doors ---- */
    {
      const gaps = [2, 3, 4, 6, 8, 9, 11, 13, 14, 16, 18, 19];
      for (const i of gaps) { const x = doors[i - 1].x + 3.3; if (x < X0 + 10.5) continue; k.box(2.1, 1.55, 0.06, x, DY + 2.3, DOCK + 0.14, steelD); hang(mounts, x, DY + 2.3, DOCK + 0.18, 0, 1.7, 1.2, st, 3.2); }
    }

    /* ---- what the market knows ---- */
    const srcHP = { name: 'Hunts Point, Bronx, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hunts_Point,_Bronx' };
    const srcFDC = { name: 'Hunts Point Food Distribution Center, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hunts_Point_Food_Distribution_Center' };
    const srcCoop = { name: 'Hunts Point Cooperative Market, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hunts_Point_Cooperative_Market' };
    const srcMkt = { name: 'Hunts Point Produce Market', url: 'https://www.huntspointproducemkt.com/' };
    k.egg(v(doors[9].x, DY + 3.6, DOCK + 0.3), { id: 'hp-1967', title: 'Opened 1967', year: '1967', text: 'The produce market opened here in 1967, in four buildings each a third of a mile long, with 475,000 square feet of warehouse space. It sells approximately 2.7 billion pounds of produce a year, and in 1998 it posted 1.5 billion dollars in revenue.', clue: 'Read the number over the door in the middle of the dock.', source: srcHP }, { r: 2.4 });
    k.egg(v(0, 8, 30), { id: 'hp-329-acres', title: '329 acres of food', text: 'The Food Distribution Center covers 329 acres of the Hunts Point peninsula and holds over 800 businesses employing over 25,000 workers. The produce market opened in 1967 and the meat market followed in 1974.', clue: 'The yard between the two dock rows, under the high mast lights.', source: srcHP }, { r: 8 });
    k.egg(v(doors[backing].x, DY + 1.5, 8), { id: 'hp-peninsula', title: 'Where two rivers meet', text: 'Hunts Point is a peninsula at the confluence of the Bronx River and the East River, bounded by the Bruckner Expressway to the west and north. The Fulton Fish Market moved here from downtown Manhattan in 2005, into a 450,000 square foot building that cost 85 million dollars, after 180 years by the South Street piers.', clue: 'The trailer backing in at the east end of the dock.', source: srcFDC }, { r: 4 });
    k.egg(v(X0 + 5, DY + 2, DOCK + 2.6), { id: 'hp-2021-strike', title: 'January 2021', year: '2021', text: 'In January 2021 over 1,400 workers at the market went on strike for a wage increase, in the middle of the pandemic, the first strike here in decades.', clue: 'The office where the shifts are called.', source: srcCoop }, { r: 3 });
    k.egg(v(-38, DY + 1.5, 24), { id: 'hp-rail', title: 'Twenty seven hundred rail cars', text: 'The market is served by rail through the Oak Point Yard, and receives around 2,700 rail cars a year, the rest of the produce arriving by truck.', clue: 'The parked trailers in the yard came by road. Something else comes by rail.', source: srcCoop }, { r: 4 });
    k.egg(v(45.2, DY + 1, DOCK + 1.6), { id: 'hp-merchants', title: 'More than thirty merchants', text: 'The Hunts Point Produce Market spans over a million square feet at 772 Edgewater Road and houses more than thirty produce merchants, in a trade with a history going back more than two hundred years.', clue: 'A pallet on the dock that did not come in with the produce.', source: srcMkt }, { r: 1.8 });

    return { mounts, spawn: v(14, DY + 3, DOCK + 4.4), look: v(-34, 3.2, DOCK + 3.2), eye: 3, floorY, bounds: [X0 + 0.4, X1 - 0.4, DOCK + 0.4, 42], style: 'steel' };
  },
};
