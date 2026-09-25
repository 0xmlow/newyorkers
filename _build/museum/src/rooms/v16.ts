/* 167 and 168: Union Square with the Greenmarket, the south steps and the Metronome keeping the real
   New York time on its fifteen digits, and Bryant Park behind the library with its chairs, its fountain,
   Le Carrousel and the film screen that lights after dark. Helpers are copied from v14 and v3; nothing
   there is exported. Rules kept: no likeness of any real person (Washington is a plain bronze form on a
   plain bronze horse), no lettered text beyond public signage, no brand on any stall or kiosk. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];
const one = new T.Vector3(1, 1, 1), up = new T.Vector3(0, 1, 0);

/* ---------------- helpers, copied from v14 and v3 (not exported there) ---------------- */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
/* a mount on a wall: rotation r faces the normal (sin r, 0, cos r); the target is d metres out */
function hang(ms: Mount[], x: number, y: number, z: number, r: number, w: number, h: number, style: FrameStyle, d = 3.2) {
  ms.push({ position: v(x, y, z), rotation: r, target: v(x + Math.sin(r) * d, y, z + Math.cos(r) * d), width: w, height: h, style, wash: true });
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
  const pal = [0xf2c318, 0xf2c318, 0x1c1e22, 0xe8e8ea, 0x6a7078, 0x2a3a5a, 0x7a1e22, 0xb8bcc2, 0x1a3a2a, 0xf2c318];
  const c = new T.Color();
  cars.forEach((a, i) => body.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])));
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3();
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
/* people sitting or standing still: one instanced figure each */
function still(k: K, pts: { x: number; y: number; z: number; ry: number; sit?: boolean }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0]) {
  if (!pts.length) return;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y + (p.sit ? 0.12 : 0), p.z), new T.Quaternion().setFromAxisAngle(up, p.ry), v(1, p.sit ? 0.82 : 1.1 + rnd() * 0.12, 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
}
/* translucent puffs that rise, spread and fade: spray, steam, smoke (v3) */
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
/* a wall along x with rectangular holes, one extrusion, centred on x, base at y 0 */
function holedWall(w: number, h: number, depth: number, holes: { cx: number; y0: number; w: number; h: number; arch?: boolean }[]) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new T.Path();
    if (o.arch) { const a = o.w / 2; p.moveTo(o.cx - a, o.y0); p.lineTo(o.cx - a, o.y0 + o.h - a); p.absarc(o.cx, o.y0 + o.h - a, a, PI, 0, true); p.lineTo(o.cx + a, o.y0); p.closePath(); }
    else { p.moveTo(o.cx - o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0 + o.h); p.lineTo(o.cx - o.w / 2, o.y0 + o.h); p.closePath(); }
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  return g;
}
/* box parts merged into one geometry: horses, chairs, kiosks */
const part = (w: number, h: number, d: number, x: number, y: number, z: number, rz = 0) => { const g = new T.BoxGeometry(w, h, d); g.rotateZ(rz); g.translate(x, y, z); return g; };
function horseGeo() {
  return mergeGeometries([
    part(1.35, 0.5, 0.42, 0, 1.05, 0), part(0.5, 0.6, 0.28, 0.62, 1.42, 0, -0.6), part(0.5, 0.24, 0.24, 0.98, 1.66, 0, 0.25),
    part(0.08, 0.16, 0.06, 0.92, 1.84, 0.08), part(0.08, 0.16, 0.06, 0.92, 1.84, -0.08),
    part(0.12, 0.62, 0.12, 0.5, 0.55, 0.14, 0.55), part(0.12, 0.62, 0.12, 0.5, 0.55, -0.14, 0.55),
    part(0.12, 0.62, 0.12, -0.5, 0.55, 0.14, -0.55), part(0.12, 0.62, 0.12, -0.5, 0.55, -0.14, -0.55),
    part(0.55, 0.12, 0.1, -0.88, 1.15, 0, 0.5),
  ])!;
}
/* the real New York clock, read through Intl, never Date.now() alone */
const nyFmt = typeof Intl !== 'undefined' ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;
function nyClock() {
  const now = Date.now();
  let h = 0, m = 0, s = 0;
  if (nyFmt) for (const p of nyFmt.formatToParts(new Date(now))) { if (p.type === 'hour') h = +p.value % 24; else if (p.type === 'minute') m = +p.value; else if (p.type === 'second') s = +p.value; }
  const ms = now % 1000;
  return { h, m, s, ms, since: ((h * 60 + m) * 60 + s) * 1000 + ms };
}
/* the visitor's eye, or null in the audit and the check scripts (node has no window) */
function eye(): T.Vector3 | null {
  if (typeof window === 'undefined') return null;
  const mu = (window as unknown as { __museum?: { camera?: T.Camera } }).__museum;
  return mu && mu.camera ? mu.camera.position : null;
}
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/* ================================================================== */
/* ---------------- 167 UNION SQUARE ---------------- */
export const unionsquare: RoomDef = {
  id: 'unionsquare',
  name: 'The Greenmarket and the Metronome',
  area: 'UNION SQUARE / 14TH STREET',
  mood: 'Market day, the whole city passing through',
  color: '#6a8a4a',
  daylit: true,
  description: 'Union Square Park on a market day: white canopy stalls on the north and west plazas, the lawn behind its iron fence under the London planes, the 1932 pavilion at the north end, the equestrian Washington of 1856 at the south end, skaters on the south steps and the subway kiosks beside them. Across 14th Street the Metronome counts the real New York time on fifteen digits, the seconds since midnight on the left and the seconds to midnight on the right. The New Yorkers hang on the stalls, the fence, the pavilion and the boards by the steps.',
  signatures: 'The fifteen orange digits keeping New York time over the brick wall and its hole, the plain bronze horseman on his granite pedestal, the wide south steps with skaters, the glass subway kiosks, the rows of white market canopies with produce and flowers, the fenced lawn, the columned pavilion, the four pyramid topped towers on the south east corner, and 14th Street traffic.',
  build(k, ctx) {
    k.sky({ top: 0x5a90d2, horizon: 0xdbe5ee, ground: 0x6a6a60, fog: 0.0022, sun: { az: 2.5, el: 0.72, color: 0xfff2dc, size: 8 }, env: 0.6 });
    k.hemi(0xe4e8ec, 0x6a6a60, 0.9);
    k.sun(0xfff0d8, 2.5, -40, 80, -30, true, 110);
    const pave = k.pbr('usPave', X.pavers(0x9a9488, 167), 0.5),
      pave2 = k.pbr('usPave2', X.pavers(0x8c8880, 171), 0.5),
      grass = k.pbr('usGrass', X.grass(0x4b6b3a, 167), 0.4),
      asph = k.pbr('usAsph', X.asphalt(), 0.3),
      granite = k.pbr('usGranite', X.ashlar(0x8a8480, 168, 4), 0.6, { normal: 0.3, roughness: 0.8 }),
      lime = k.pbr('usLime', X.ashlar(0xd6cdb6, 169, 5), 0.6, { normal: 0.3, roughness: 0.85 }),
      brick = k.pbr('usBrick', X.brick(0x8a5a44, 170), 0.9, { side: T.DoubleSide }),
      concrete = k.pbr('usConc', X.concrete(0xa8a49a, 172), 0.4),
      glow = 1.3 * (1 + 2.2 * k.night),
      facade = k.pbr('usWin', X.windows(1671, 0.3, 0x26313d, true), 0.11, { emissive: 0xffffff, emissiveIntensity: glow, roughness: 0.6, stretch: 0.42 }),
      facade2 = k.pbr('usWin2', X.windows(1673, 0.28, 0x3a3630, true), 0.11, { emissive: 0xffffff, emissiveIntensity: glow, roughness: 0.6, stretch: 0.42 }),
      iron = k.flat(0x1c1c1c, 0.6, 0.5), bronze = k.flat(0x4a5a48, 0.85, 0.5), gilt = k.flat(0xd8b040, 1, 0.3),
      white = k.flat(0xf2f2ee, 0, 0.9, { side: T.DoubleSide }), whiteBoard = k.flat(0xe8e6e0, 0, 0.8), post = k.flat(0xd8d8d8, 0.7, 0.4),
      cloth = k.flat(0x2e5a3a, 0, 0.9), wood = k.flat(0x8a6a48, 0, 0.8), curb = k.flat(0x8a8680, 0, 0.8), line = k.flat(0xe8e4d8, 0, 0.8),
      darkGlass = k.flat(0x24303a, 0.4, 0.2), greenGlobe = k.glow(0x3cd070), pyramid = k.flat(0x5a7a6a, 0.5, 0.35, { emissive: 0x2a4a3a, emissiveIntensity: k.night });
    const mounts: Mount[] = [], st: FrameStyle = 'black';
    const SY = -0.8; /* the sidewalk and the street sit below the plaza */

    /* ---- the ground: the south plaza, the paths, the lawn, the plazas of the market ---- */
    k.box(104, 0.2, 108, 0, -0.1, -27, pave);
    k.box(56, 0.02, 40, 0, 0.011, -31, pave2);
    /* the lawn, fenced, blocked */
    k.box(52, 0.12, 30, 0, 0.06, -31, grass); k.block(-26, 26, -46, -16);
    { const fp: T.Matrix4[] = []; const put = (x: number, z: number) => fp.push(new T.Matrix4().makeTranslation(x, 0.62, z));
      for (let x = -26; x <= 26; x += 1.5) { put(x, -16); put(x, -46); }
      for (let z = -44.5; z <= -17.5; z += 1.5) { put(-26, z); put(26, z); }
      k.instances(new T.BoxGeometry(0.05, 1.1, 0.05), iron, fp);
      for (const y of [0.55, 1.12]) { k.box(52.1, 0.06, 0.06, 0, y, -16, iron); k.box(52.1, 0.06, 0.06, 0, y, -46, iron); k.box(0.06, 0.06, 30, -26, y, -31, iron); k.box(0.06, 0.06, 30, 26, y, -31, iron); } }
    /* the steps down to 14th Street: four risers over three metres, y 0 to y -0.8, with granite cheek walls */
    for (let i = 0; i < 4; i++) k.box(60, 0.2, 0.8, 0, -0.1 - i * 0.2, 22.4 + i * 0.8, granite);
    for (const s of [-1, 1]) { k.box(14, 0.9, 3.2, s * 37, -0.45, 23.6, granite); k.box(14.2, 0.1, 3.4, s * 37, 0.05, 23.6, granite); k.block(s > 0 ? 30 : -44, s > 0 ? 44 : -30, 22, 25.3); }
    /* the sidewalk, the street, the far sidewalk (blocked at the curb) */
    k.box(120, 0.2, 5.8, 0, SY - 0.1, 28.1, pave); k.box(120, 0.18, 0.25, 0, SY - 0.02, 31, curb);
    k.box(120, 0.2, 14, 0, SY - 0.14, 38, asph); for (let x = -58; x < 58; x += 3.2) k.box(1.6, 0.012, 0.12, x, SY - 0.06, 38, line);
    k.box(120, 0.18, 0.25, 0, SY - 0.02, 45, curb); k.box(120, 0.2, 4, 0, SY - 0.1, 47, pave);
    k.block(-60, 60, 30.7, 49);
    traffic(k, ctx, { lanes: [{ z: 34, dir: -1, n: 5, speed: 7 }, { z: 37.5, dir: -1, n: 4, speed: 8 }, { z: 41, dir: 1, n: 5, speed: 7.5 }, { z: 33, dir: 0, n: 0 }], x0: -58, x1: 58, seed: 1672, y: SY - 0.04 });
    k.crowd([v(-50, SY, 47.5), v(50, SY, 47.5)], 10, { seed: 1673, spread: 1.4, animate: !ctx.reduced, speed: 1.0 });
    k.crowd([v(-44, SY, 28), v(44, SY, 28)], 12, { seed: 1674, spread: 1.6, animate: !ctx.reduced, speed: 1.1 });
    /* Union Square West and East: the sidewalks, the avenues, the fronts (blocked at the curbs) */
    for (const s of [-1, 1]) {
      k.box(0.25, 0.18, 108, s * 48, 0.06, -27, curb); k.box(10, 0.2, 108, s * 55, -0.14, -27, asph); k.block(s > 0 ? 49 : -62, s > 0 ? 62 : -49, -82, 30);
      const rnd = X.mulberry(1675 + s);
      for (let z = -82; z < 6; ) { const w = 10 + rnd() * 8, h = 18 + rnd() * 28; k.box(16, h, w, s * 68, h / 2, z + w / 2, rnd() > 0.5 ? facade : facade2); k.box(16.2, 0.4, w + 0.2, s * 68, h, z + w / 2, k.flat(0x2a2a2a, 0, 0.8)); z += w + 1.5; }
    }
    /* the four pyramid topped towers on the south east corner of the square */
    for (const [x, z] of [[54, 8], [70, 8], [54, 24], [70, 24]]) { k.box(12, 62, 12, x, 31, z, facade); const p = k.mesh(new T.ConeGeometry(8.6, 9, 4), pyramid, x, 66.5, z); p.rotation.y = PI / 4; }
    k.box(30, 12, 30, 62, 6, 16, facade2);
    k.skyline({ z: -112, count: 28, spacing: 6.5, seed: 1676, base: 0, lit: 0.25, x: 0 });
    k.skyline({ z: 96, count: 26, spacing: 7, seed: 1677, base: 0, lit: 0.25, x: 10 });

    /* ---- One Union Square South and the Metronome across 14th Street ---- */
    const MZ = 49.2;
    k.box(44, 96, 26, 0, 47, MZ + 13, facade);
    k.box(44.4, 0.5, 26.4, 0, 95, MZ + 13, k.flat(0x2a2a2a, 0, 0.8));
    /* the brick wall, a wave of concentric ripples round the hole, the gold form to the left */
    k.box(36, 21.2, 0.5, 0, SY + 10.6, MZ - 0.25, brick);
    for (let r = 1.6; r < 12; r += 1.5) { const t = k.torus(r, 0.22, 3.5, SY + 9.5, MZ - 0.5, brick, 64); t.rotation.x = 0; }
    k.cyl(1.5, 3, 3.5, SY + 9.5, MZ - 0.4, k.flat(0x050505, 0, 1), 1.5, 32).rotation.x = PI / 2;
    k.torus(1.55, 0.3, 3.5, SY + 9.5, MZ - 0.6, k.flat(0x2a1e18, 0, 0.9), 40);
    { const g = new T.SphereGeometry(1.8, 24, 16, 0, PI * 2, 0, PI / 2); g.rotateX(-PI / 2); k.mesh(g, gilt, -11, SY + 12, MZ - 0.6); }
    k.mesh(new T.ConeGeometry(0.9, 5.5, 16), gilt, -11, SY + 7.5, MZ - 1.2).rotation.x = -0.12;
    /* the sphere on the corner that shows the moon, half gold and half dark */
    k.mesh(new T.SphereGeometry(2.2, 24, 16, 0, PI), gilt, 16, SY + 24, MZ - 1.0);
    k.mesh(new T.SphereGeometry(2.2, 24, 16, PI, PI), k.flat(0x101010, 0.2, 0.7), 16, SY + 24, MZ - 1.0);
    /* the fifteen digits: a canvas redrawn every frame from the New York clock */
    const DW = 1024, DH = 96;
    const digC = document.createElement('canvas'); digC.width = DW; digC.height = DH;
    const digTex = new T.CanvasTexture(digC); digTex.colorSpace = T.SRGBColorSpace;
    const digits = k.mesh(new T.PlaneGeometry(30, 2.8), new T.MeshBasicMaterial({ map: digTex }), 0, SY + 23.1, MZ - 0.55, true); digits.rotation.y = PI;
    k.box(31, 3.4, 0.4, 0, SY + 23.1, MZ - 0.3, k.flat(0x0b0a0a, 0, 0.9));
    const drawDigits = () => {
      const g = digC.getContext('2d'); if (!g) return;
      const c = nyClock(), until = Math.max(0, 86400000 - c.since), pad = (n: number, w: number) => String(n).padStart(w, '0');
      const left = pad(c.h, 2) + pad(c.m, 2) + pad(c.s, 2) + String(Math.floor(c.ms / 100));
      const right = String(Math.floor(until / 100) % 10) + pad(Math.floor(until / 1000) % 60, 2) + pad(Math.floor(until / 60000) % 60, 2) + pad(Math.floor(until / 3600000), 2);
      const s = left + String(Math.floor(c.ms / 10) % 10) + right;
      g.fillStyle = '#0b0a0a'; g.fillRect(0, 0, DW, DH);
      g.fillStyle = '#ff7a18'; g.font = 'bold 84px "Courier New", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let i = 0; i < 15; i++) g.fillText(s[i], (i + 0.5) * (DW / 15), DH / 2 + 4);
      digTex.needsUpdate = true;
    };
    /* the hole breathes a little all day and erupts at noon and midnight */
    const wisp = vapour(k, [v(3.5, SY + 9.5, MZ - 1.2)], 10, { rise: 5, spread: 1.2, size: 0.45, opacity: 0.1, seed: 1678, speed: 0.16, animate: !ctx.reduced });
    const plume = vapour(k, [v(3.5, SY + 9.5, MZ - 1.4), v(3.2, SY + 9.8, MZ - 2.2)], 36, { rise: 16, spread: 3, size: 0.9, opacity: 0.4, seed: 1679, speed: 0.22, animate: !ctx.reduced });
    plume.visible = false;
    k.point(3.5, SY + 12, MZ - 4, 0xffd0a0, 12 + 30 * k.night, 24);
    if (!ctx.reduced) {
      k.ticks.push(() => {
        drawDigits();
        const c = nyClock();
        plume.visible = (c.h === 12 || c.h === 0) && c.m < 2;
        wisp.visible = !plume.visible;
      });
    } else { drawDigits(); }
    void digits;

    /* ---- the south end: Washington on his horse, a plain bronze form of 1856 ---- */
    k.box(6.4, 0.5, 5.4, 0, 0.25, 13, granite); k.box(5.2, 3.4, 3.4, 0, 2.2, 13, granite); k.box(5.6, 0.4, 3.8, 0, 4.1, 13, granite);
    {
      const hg = horseGeo(); hg.scale(2.2, 2.2, 2.2);
      const rider = mergeGeometries([
        (() => { const g = new T.CapsuleGeometry(0.42, 1.0, 4, 10); g.translate(0.05, 3.85, 0); return g; })(),
        (() => { const g = new T.SphereGeometry(0.28, 12, 10); g.translate(0.12, 4.9, 0); return g; })(),
        part(0.3, 0.3, 0.3, 0.1, 5.2, 0), part(1.6, 0.16, 0.16, 1.05, 4.2, 0.1, -0.15), part(0.22, 0.9, 0.22, -0.2, 3.1, 0.55, 0.2), part(0.22, 0.9, 0.22, -0.2, 3.1, -0.55, 0.2),
      ])!;
      const statue = k.mesh(mergeGeometries([hg, rider])!, bronze, 0, 4.3, 13); statue.rotation.y = -PI / 2;
    }
    k.keepOut.push({ x: 0, z: 13, r: 4 });
    k.egg(v(0, 3.5, 13), { id: 'us-washington-1856', title: 'The oldest statue in the parks', year: '1856', text: 'The equestrian George Washington at the south end was modelled by Henry Kirke Brown and unveiled in 1856. He is shown here as a plain bronze form, no face, as the rules of this museum ask.', clue: 'The horseman at the south end has been there longer than any other statue in a city park.', source: { name: 'Union Square, Manhattan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Union_Square,_Manhattan' } }, { r: 3.6 });
    /* the subway kiosks flanking the steps: glass canopies on steel, a green globe, the stair down */
    for (const s of [-1, 1]) {
      const kx = s * 24, kz = 17;
      for (const [dx, dz] of [[-2, -3], [2, -3], [-2, 3], [2, 3]]) k.box(0.16, 2.8, 0.16, kx + dx, 1.4, kz + dz, post);
      k.box(4.6, 0.12, 6.6, kx, 2.85, kz, k.glass(0xc8e0e8, 0.35, 0.1)); k.box(4.6, 0.16, 0.16, kx, 2.78, kz - 3.3, post); k.box(4.6, 0.16, 0.16, kx, 2.78, kz + 3.3, post);
      k.box(3.4, 0.1, 5.4, kx, -0.02, kz, k.flat(0x101010, 0, 1)); k.box(0.1, 1.0, 5.4, kx - 1.75, 0.5, kz, iron); k.box(0.1, 1.0, 5.4, kx + 1.75, 0.5, kz, iron); k.block(kx - 2.4, kx + 2.4, kz - 3.6, kz + 3.6);
      k.cyl(0.06, 3.2, kx + s * 2.6, 1.6, kz + 3.6, iron, 0.06, 8); k.sphere(0.32, kx + s * 2.6, 3.4, kz + 3.6, greenGlobe, 14); k.point(kx + s * 2.6, 3.4, kz + 3.6, 0x40e080, 6 + 14 * k.night, 8);
      k.sign('14 ST UNION SQ', 3.6, 0.5, kx, 3.2, kz - 3.32, '#111111', '#ffffff', 96, PI);
    }
    k.egg(v(24, 2.2, 21.5), { id: 'us-subway-1904', title: 'Down the stairs since 1904', year: '1904', text: 'The 14th Street Union Square subway station under the south end of the park opened in 1904, with the first line of the subway.', clue: 'The green globes by the steps mark the way down.', source: { name: 'Union Square, Manhattan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Union_Square,_Manhattan' } }, { r: 3 });
    /* the two boards by the steps, facing north into the plaza, and the chess tables in the south west corner */
    for (const x of [-35, 35]) {
      k.box(2.6, 2.0, 0.14, x, 1.85, 20.2, whiteBoard); for (const s of [-1, 1]) { k.box(0.1, 2.85, 0.1, x + s * 1.25, 1.42, 20.3, iron); k.box(0.5, 0.06, 0.5, x + s * 1.25, 0.03, 20.3, iron); }
      k.keepOut.push({ x, z: 20.3, r: 0.7 }, { x: x - 1.25, z: 20.3, r: 0.4 }, { x: x + 1.25, z: 20.3, r: 0.4 });
      hang(mounts, x, 1.85, 20.12, PI, 2.2, 1.55, st, 3.2);
    }
    {
      const seated: { x: number; y: number; z: number; ry: number; sit?: boolean }[] = [];
      for (const [x, z] of [[-33, 4], [-33, 9], [-27, 4], [-27, 9]]) {
        k.box(0.8, 0.06, 0.8, x, 0.74, z, k.flat(0xd8d0c0, 0, 0.8)); k.cyl(0.06, 0.72, x, 0.36, z, iron, 0.06, 8);
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) k.box(0.09, 0.005, 0.09, x - 0.36 + i * 0.09 + 0.045, 0.775, z - 0.36 + j * 0.09 + 0.045, k.flat(0x2a2a2a, 0, 0.9));
        for (const s of [-1, 1]) { k.box(0.45, 0.45, 0.45, x + s * 0.85, 0.22, z, wood); seated.push({ x: x + s * 0.85, y: 0.34, z, ry: s > 0 ? -PI / 2 : PI / 2, sit: true }); }
        k.keepOut.push({ x, z, r: 1.5 });
      }
      still(k, seated, 1680);
    }
    /* skaters ride a loop over the plaza edge and down the steps */
    if (!ctx.reduced) {
      const loop = k.spline([v(-20, 0, 12), v(-9, 0, 19.5), v(0, -0.3, 23.6), v(9, SY, 27.5), v(20, SY, 27.5), v(27, -0.4, 23.5), v(22, 0, 14), v(2, 0, 9)], true, 0.5);
      const cols = [0xe83a5a, 0x2a2a34, 0x3a8ae8, 0xf0d24a];
      cols.forEach((c, i) => {
        const g = new T.Group();
        const bd = new T.Mesh(new T.BoxGeometry(0.22, 0.03, 0.82), k.flat(0x2a1a10, 0, 0.7)); bd.position.y = 0.09; g.add(bd);
        for (const dz of [-0.28, 0.28]) { const w = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.28, 8).rotateZ(PI / 2), k.flat(0xe8e8e8, 0, 0.6)); w.position.set(0, 0.04, dz); g.add(w); }
        const body = new T.Mesh(figureGeo(0.19, 0.7, 1.22), k.flat(c, 0, 0.85)); body.position.y = 0.1; body.rotation.x = 0.12; g.add(body);
        k.add(g); k.rider(g, loop, 3.6 + i * 0.4, i * 18);
      });
    }
    /* the dog walker rounds the lawn */
    if (!ctx.reduced) {
      const walk = k.spline([v(-33, 0, -11), v(33, 0, -11), v(33, 0, -50), v(-33, 0, -50)], true, 0.5);
      const g = new T.Group();
      const body = new T.Mesh(figureGeo(0.19, 0.72, 1.24), k.flat(0x5a4a3a, 0, 0.85)); g.add(body);
      const dog = new T.Mesh(mergeGeometries([part(0.5, 0.26, 0.2, 0, 0.35, 0), part(0.2, 0.2, 0.18, 0.32, 0.5, 0), part(0.06, 0.24, 0.06, 0.18, 0.12, 0.07), part(0.06, 0.24, 0.06, 0.18, 0.12, -0.07), part(0.06, 0.24, 0.06, -0.18, 0.12, 0.07), part(0.06, 0.24, 0.06, -0.18, 0.12, -0.07)])!, k.flat(0x7a5a3a, 0, 0.9));
      dog.position.set(0.7, 0, 1.2); dog.rotation.y = PI / 2; g.add(dog);
      const lead = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 1.4, 4), iron); lead.position.set(0.45, 0.7, 0.6); lead.rotation.x = -1.0; lead.rotation.z = 0.35; g.add(lead);
      k.add(g); k.rider(g, walk, 1.3, 40);
    }

    /* ---- the London planes and the lamps ---- */
    { let i = 0; for (const [x, z] of [[-33, -12], [-33, -20], [-33, -28], [-33, -36], [-33, -44], [33, -12], [33, -20], [33, -28], [33, -36], [33, -44], [-38, 2], [-40, 12], [38, 2], [40, 12], [-14, 2], [14, 2], [-44, -46], [44, -46], [44, -30], [44, -14], [-8, -8], [8, -8], [-20, -8], [20, -8]]) {
      k.tree(x, 0, z, { h: 8.5 + (i % 3), r: 4 + (i % 2) * 0.6, seed: 1681 + i }); k.box(1.6, 0.06, 1.6, x, 0.03, z, iron); k.keepOut.push({ x, z, r: 0.9 }); i++;
    } }
    for (const [x, z] of [[-28, 4], [28, 4], [-28, -50], [28, -50], [-42, -20], [42, -6], [-16, 17], [16, 17]]) k.lamp(x, z, 4.2, iron, 0xffd7a0, 14 + 22 * k.night);
    k.egg(v(0, 1.4, 5), { id: 'us-labor-day-1882', title: 'The first Labor Day', year: '1882', text: 'On September 5, 1882, the first Labor Day celebration paraded through Union Square. The park itself was completed and opened in July 1839, and it was named for the union of the two principal roads of the island that met here. It was designated a National Historic Landmark on December 9, 1997.', clue: 'Stand in the middle of the south plaza, where the marchers came through.', source: { name: 'Union Square, Manhattan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Union_Square,_Manhattan' } }, { r: 3.4 });
    k.egg(v(0, 1.6, 28.5), { id: 'us-metronome-1999', title: 'Fifteen digits over 14th Street', year: '1999', text: 'The Metronome on One Union Square South is by Kristin Jones and Andrew Ginzel. Installation began in February 1999 and it was dedicated on October 26, 1999, one of the largest private commissions of public art in the city. Its fifteen digits show the hours, minutes, seconds and tenths since midnight on the left, the same to midnight on the right, hundredths in the middle, and at noon and midnight the hole erupts with a plume of steam. On September 19, 2020 the digits were turned into a climate clock; here they keep the time of day.', clue: 'Go down the steps to the curb and look at the wall across the street. Do not look away for long, the digits will not wait.', source: { name: 'Metronome (public artwork), Wikipedia', url: 'https://en.wikipedia.org/wiki/Metronome_(public_artwork)' } }, { r: 3.2 });

    /* ---- the pavilion of 1932 at the north end, on its platform, with the census wall inside ---- */
    const PZ = -75, PY = 1.0;
    k.box(28, PY, 13, 0, PY / 2, PZ, lime); k.box(28.4, 0.12, 13.4, 0, PY + 0.02, PZ, k.pbr('usTerr', X.terrazzo(0xd8d0c0, 173), 0.6));
    for (let i = 0; i < 3; i++) k.box(28, 0.34, 0.85, 0, 0.17 + i * 0.33, -66.5 - 0.42 - i * 0.84, lime);
    for (const x of [-10.5, -6.3, -2.1, 2.1, 6.3, 10.5]) { k.column(x, PY, -70, 5.6, 0.38, lime, true); k.keepOut.push({ x, z: -70, r: 0.7 }); }
    k.box(28.6, 0.8, 13.6, 0, PY + 6.0, PZ, lime); k.box(29, 0.3, 14, 0, PY + 6.5, PZ, k.flat(0x5a5a56, 0, 0.7));
    k.box(28, 5.6, 0.6, 0, PY + 2.8, -81.2, lime); k.block(-14.2, 14.2, -81.6, -80.8);
    for (const s of [-1, 1]) { k.box(0.6, 5.6, 8, s * 13.7, PY + 2.8, -77.2, lime); k.block(s > 0 ? 13.3 : -14.1, s > 0 ? 14.1 : -13.3, -81.5, -73); }
    k.block(-14.2, -13.5, -81.5, -66.6); k.block(13.5, 14.2, -81.5, -66.6);
    k.point(0, PY + 5, -76, 0xffe0b8, 8 + 20 * k.night, 18); k.point(-8, PY + 5, -76, 0xffe0b8, 6 + 14 * k.night, 14); k.point(8, PY + 5, -76, 0xffe0b8, 6 + 14 * k.night, 14);
    for (const s of [-1, 1]) for (const z of [-78.2, -74.8]) hang(mounts, s * 13.38, PY + 1.75, z, s > 0 ? -PI / 2 : PI / 2, 2.3, 1.6, st, 3.2);
    k.censusWall({ x: 0, y: PY + 2.6, z: -80.85, rotY: 0, cols: 12, rows: 4, tile: 0.5, gap: 0.04, start: ctx.wallStart(450, 48), pieces: ctx.all, backing: k.flat(0x3a3632, 0, 0.8) });
    k.egg(v(0, PY + 2.2, -72), { id: 'us-pavilion-1932', title: 'The pavilion', year: '1932', text: 'The contract for the bandstand at the north end was awarded in August 1931, and in June 1932 civic groups started landscaping the park round it for free.', clue: 'Climb the three steps at the north end and stand between the columns.', source: { name: 'Union Square, Manhattan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Union_Square,_Manhattan' } }, { r: 3.2 });

    /* ---- the Greenmarket: white canopies in rows on the north and west plazas ---- */
    type Stall = { x: number; z: number; ry: number; kind: number };
    const stalls: Stall[] = [];
    const rows: { xs: number[]; z: number; ry: number }[] = [
      { xs: Array.from({ length: 18 }, (_, i) => -28.9 + i * 3.4), z: -51, ry: PI },
      { xs: Array.from({ length: 18 }, (_, i) => -28.9 + i * 3.4), z: -57.5, ry: 0 },
      { xs: Array.from({ length: 18 }, (_, i) => -28.9 + i * 3.4), z: -61.5, ry: PI },
    ];
    let kind = 0;
    for (const r of rows) for (const x of r.xs) stalls.push({ x, z: r.z, ry: r.ry, kind: kind++ % 6 });
    for (let i = 0; i < 15; i++) { const z = -43.5 + i * 3.4; stalls.push({ x: -46.5, z, ry: PI / 2, kind: kind++ % 6 }); stalls.push({ x: -38.5, z, ry: -PI / 2, kind: kind++ % 6 }); }
    const canopyM: T.Matrix4[] = [], postM: T.Matrix4[] = [], tableM: T.Matrix4[] = [], skirtM: T.Matrix4[] = [], crateM: T.Matrix4[] = [], crateC: number[] = [], skirtC: number[] = [];
    const vend: { x: number; z: number; ry: number; cur: number }[] = [];
    const pal = [[0xb8202a, 0xc83a2a, 0x3d7a2a, 0x2e6a2a], [0x3d7a2a, 0x4a8a3a, 0x8ab040, 0x2e5a2a], [0xe08a20, 0xd06a18, 0xf0b040, 0x8a5a2a], [0xe85a8a, 0xf0d040, 0xf4f0e8, 0xd84070], [0xd8a020, 0xc88a18, 0xe8b830, 0xb87a10], [0xc08a40, 0xa87030, 0xd8a860, 0x8a5a2a]];
    const skirts = [0x2e5a3a, 0xf2f2ee, 0x2a3a6a, 0x8a2a2a, 0xf2f2ee, 0x2e5a3a];
    const rnd = X.mulberry(1682), q = new T.Quaternion(), tmp = new T.Vector3();
    const local = (s: Stall, lx: number, ly: number, lz: number) => tmp.set(s.x + lx * Math.cos(s.ry) + lz * Math.sin(s.ry), ly, s.z - lx * Math.sin(s.ry) + lz * Math.cos(s.ry)).clone();
    for (const s of stalls) {
      q.setFromAxisAngle(up, s.ry);
      canopyM.push(new T.Matrix4().compose(local(s, 0, 2.75, 0), new T.Quaternion().setFromAxisAngle(up, s.ry + PI / 4), one));
      for (const [lx, lz] of [[-1.5, -1.4], [1.5, -1.4], [-1.5, 1.4], [1.5, 1.4]]) postM.push(new T.Matrix4().compose(local(s, lx, 1.15, lz), q, one));
      tableM.push(new T.Matrix4().compose(local(s, 0, 0.85, 0.9), q, one));
      skirtM.push(new T.Matrix4().compose(local(s, 0, 0.42, 0.9), q, one)); skirtC.push(skirts[s.kind]);
      const n = 4 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) { crateM.push(new T.Matrix4().compose(local(s, -1.05 + (i / (n - 1)) * 2.1, 1.06, 0.9 + (rnd() - 0.5) * 0.2), q, v(1, 0.8 + rnd() * 0.5, 1))); crateC.push(pal[s.kind][Math.floor(rnd() * 4)]); }
      vend.push({ x: local(s, (rnd() - 0.5) * 1.2, 0, -0.4).x, z: local(s, 0, 0, -0.4).z, ry: s.ry, cur: s.ry });
      const w = Math.abs(Math.cos(s.ry)) > 0.5 ? [1.7, 1.6] : [1.6, 1.7];
      k.block(s.x - w[0], s.x + w[0], s.z - w[1], s.z + w[1]);
    }
    k.instances(new T.ConeGeometry(2.2, 1.0, 4, 1, false), white, canopyM);
    k.instances(new T.CylinderGeometry(0.04, 0.04, 2.3, 6), post, postM);
    k.instances(new T.BoxGeometry(2.8, 0.06, 0.8), wood, tableM);
    { const sk = k.instances(new T.BoxGeometry(2.8, 0.8, 0.78), k.flat(0xffffff, 0, 0.9), skirtM); const c = new T.Color(); skirtC.forEach((h, i) => sk.setColorAt(i, c.set(h))); if (sk.instanceColor) sk.instanceColor.needsUpdate = true; }
    { const cr = k.instances(new T.BoxGeometry(0.46, 0.3, 0.36), k.flat(0xffffff, 0, 0.85), crateM); const c = new T.Color(); crateC.forEach((h, i) => cr.setColorAt(i, c.set(h))); if (cr.instanceColor) cr.instanceColor.needsUpdate = true; }
    /* the vendors: one instanced figure with a tray, and they turn to face a visitor at their table */
    {
      const vg = mergeGeometries([figureGeo(0.2, 0.7, 1.24), part(0.4, 0.06, 0.26, 0, 1.0, 0.3), part(0.5, 0.12, 0.5, 0, 1.72, 0)])!;
      const vm = k.instances(vg, new T.MeshStandardMaterial({ roughness: 0.9 }), vend.map((p) => new T.Matrix4().compose(v(p.x, 0, p.z), new T.Quaternion().setFromAxisAngle(up, p.ry), one)));
      vm.frustumCulled = false;
      const c = new T.Color(), vc = [0x2a3a6a, 0x8a2a2a, 0x3a5a2a, 0x2a2a2a, 0xe0dcd0, 0x5a4a3a, 0x6a3a8a];
      vend.forEach((_, i) => vm.setColorAt(i, c.set(vc[i % vc.length]))); if (vm.instanceColor) vm.instanceColor.needsUpdate = true;
      if (!ctx.reduced) {
        const m = new T.Matrix4(), qq = new T.Quaternion(), pos = new T.Vector3();
        k.ticks.push((_t, dt) => {
          const e = eye(); if (!e) return;
          const r = Math.min(1, dt * 4);
          vend.forEach((p, i) => {
            const dx = e.x - p.x, dz = e.z - p.z, want = dx * dx + dz * dz < 16 ? Math.atan2(dx, dz) : p.ry;
            let d = want - p.cur; d = Math.atan2(Math.sin(d), Math.cos(d)); p.cur += d * r;
            m.compose(pos.set(p.x, 0, p.z), qq.setFromAxisAngle(up, p.cur), one); vm.setMatrixAt(i, m);
          });
          vm.instanceMatrix.needsUpdate = true;
        });
      }
    }
    /* the shoppers in the lanes */
    const lanes: T.Vector3[][] = [[v(-31, 0, -54.2), v(31, 0, -54.2)], [v(-31, 0, -65), v(31, 0, -65)], [v(-42.5, 0, -46), v(-42.5, 0, 8)], [v(-31, 0, -47.5), v(31, 0, -47.5)]];
    lanes.forEach((l, i) => k.crowd(l, 14, { seed: 1683 + i, spread: 1.2, animate: !ctx.reduced, speed: 0.7 }));
    k.crowd([v(-22, 0, 4), v(-8, 0, -4), v(0, 0, -10), v(12, 0, -8), v(24, 0, 2)], 12, { seed: 1690, spread: 2.2, animate: !ctx.reduced, speed: 0.9 });
    /* the works on the end stalls' side panels: three rows east and west, the two west rows at their north ends */
    for (const r of rows) for (const s of [-1, 1]) {
      const x = s * 30.62; k.box(0.08, 2.0, 2.9, x, 1.4, r.z, whiteBoard);
      hang(mounts, s * 30.68, 1.5, r.z, s > 0 ? PI / 2 : -PI / 2, 2.2, 1.5, st, 3.2);
    }
    for (const x of [-46.5, -38.5]) { k.box(2.9, 2.0, 0.08, x, 1.4, -45.72, whiteBoard); hang(mounts, x, 1.5, -45.78, PI, 2.2, 1.5, st, 3.2); }
    k.egg(v(0, 1.6, -54.2), { id: 'us-greenmarket-1976', title: 'Seven farmers, sold out by noon', year: '1976', text: 'The Union Square Greenmarket opened in 1976 with seven farmers, and their selection sold out by noon. Set up by the Council on the Environment of New York City, now GrowNYC, it runs year round on Mondays, Wednesdays, Fridays and Saturdays from 8 am to 6 pm. In peak season it serves more than 250,000 customers a week, and the average farm is 90 miles from the square.', clue: 'Walk the north lane between the canopies. Honey, greens, apples, flowers.', source: { name: 'Union Square Greenmarket, Wikipedia', url: 'https://en.wikipedia.org/wiki/Union_Square_Greenmarket' } }, { r: 3.4 });
    /* the works on the fence, facing the paths either side of the lawn */
    for (const s of [-1, 1]) for (const z of [-22, -28, -34, -40]) {
      k.box(0.08, 1.9, 2.6, s * 26.15, 1.55, z, k.flat(0x2a2a2a, 0, 0.8));
      hang(mounts, s * 26.22, 1.55, z, s > 0 ? PI / 2 : -PI / 2, 2.2, 1.5, st, 3.2);
    }

    const floorY = (x: number, z: number) => {
      if (z > 25.2) return SY;
      if (z > 22) return SY * clamp01((z - 22) / 3.2);
      if (Math.abs(x) < 14.3 && z < -69) return PY;
      if (Math.abs(x) < 14.3 && z < -66.5) return PY * clamp01((-66.5 - z) / 2.5);
      return 0;
    };
    return { mounts, spawn: v(-9, 3, 5), look: v(2, 5.5, MZ), eye: 3, floorY, bounds: [-51.5, 47.5, -81.2, 30.4], style: st };
  },
};

/* ================================================================== */
/* ---------------- 168 BRYANT PARK ---------------- */
export const bryantpark: RoomDef = {
  id: 'bryantpark',
  name: 'The lawn behind the library',
  area: 'BRYANT PARK / 42ND STREET',
  mood: 'Lunch hour on the lawn, a film after dark',
  color: '#5a8a5a',
  daylit: true,
  description: 'Bryant Park on the block behind the New York Public Library, with the stacks under the lawn. Green folding chairs by the hundred on the gravel promenades under the London planes, the granite fountain playing on the upper terrace at the Sixth Avenue end, Le Carrousel turning on the south side, the reading room and the kiosks, ping pong, and the library\'s long rear elevation over its terrace. After dark the film screen at the west end lights up and the lawn fills with people sitting to watch. The New Yorkers hang on the library\'s arcade, the kiosk flanks and boards on the fountain terrace.',
  signatures: 'The green folding chairs everywhere, the sunk lawn between two allées of London planes, the pink granite fountain, Le Carrousel with its fourteen animals, the library\'s arched rear arcade and terrace, the green kiosks, the reading room under its umbrellas, the ping pong tables, the film screen at the west end, and the sloped face of the Grace Building over 42nd Street.',
  build(k, ctx) {
    k.sky({ top: 0x5c92d4, horizon: 0xdde6ee, ground: 0x6a6a60, fog: 0.0024, sun: { az: 2.3, el: 0.68, color: 0xfff2dc, size: 8 }, env: 0.6 });
    k.hemi(0xe4e8ec, 0x6a6a60, 0.9);
    k.sun(0xfff0d8, 2.4, -30, 80, 50, true, 110);
    const night = k.night > 0.5;
    const gravel = k.pbr('bpGravel', X.concrete(0xb8ad98, 168), 0.4),
      grass = k.pbr('bpGrass', X.grass(0x4e7a3c, 168), 0.4),
      lime = k.pbr('bpLime', X.ashlar(0xd8d0bc, 181, 5), 0.6, { normal: 0.3, roughness: 0.85 }),
      rust = k.pbr('bpRust', X.ashlar(0xc8bea6, 182, 3), 0.6, { normal: 0.45, roughness: 0.9 }),
      granite = k.pbr('bpGranite', X.ashlar(0x8a8480, 183, 4), 0.6, { normal: 0.3, roughness: 0.8 }),
      pink = k.pbr('bpPink', X.marble(0xc8a090, 0x8a6a5a, 184), 0.5, { roughness: 0.55 }),
      asph = k.pbr('bpAsph', X.asphalt(), 0.3), walk = k.pbr('bpWalk', X.pavers(0x9a968c, 185), 0.5),
      glow = 1.3 * (1 + 2.2 * k.night),
      facade = k.pbr('bpWin', X.windows(1681, 0.3, 0x26313d, true), 0.11, { emissive: 0xffffff, emissiveIntensity: glow, roughness: 0.6, stretch: 0.42 }),
      facadeDark = k.pbr('bpWin2', X.windows(1683, 0.3, 0x1a1a1c, true), 0.11, { emissive: 0xffffff, emissiveIntensity: glow, roughness: 0.6, stretch: 0.42 }),
      green = k.flat(0x2f5f3a, 0.2, 0.6), greenDark = k.flat(0x1f4a30, 0, 0.7), iron = k.flat(0x1c1c1c, 0.6, 0.5), brass = k.flat(0xc8a050, 1, 0.3),
      darkGlass = k.flat(0x24303a, 0.4, 0.2), cream = k.flat(0xf0e8d8, 0, 0.8), red = k.flat(0x9a2a2a, 0, 0.7), gilt = k.flat(0xd8b040, 1, 0.3),
      burgundy = k.flat(0x6a1e2a, 0, 0.9, { side: T.DoubleSide }), wood = k.flat(0x8a6a48, 0, 0.8), curb = k.flat(0x8a8680, 0, 0.8), line = k.flat(0xe8e4d8, 0, 0.8),
      hedge = k.flat(0x2e5a2a, 0, 0.95), soil = k.flat(0x3a2a1c, 0, 1);
    const mounts: Mount[] = [], st: FrameStyle = 'black';
    const TY = 1.5, WY = 1.2; /* the library terrace and the fountain terrace stand above the lawn */

    /* ---- the ground: lawn, promenades, the two terraces ---- */
    k.box(100, 0.2, 76, -6, -0.1, 0, gravel);
    k.box(60, 0.1, 40, 0, 0.05, 0, grass);
    /* a low hedge round the lawn, open for three metres at each corner and in the middle of each long side */
    for (const s of [-1, 1]) {
      for (const [a, b] of [[-27, -2], [2, 27]]) { k.box(b - a, 0.5, 0.5, (a + b) / 2, 0.25, s * 20.25, hedge); k.block(a, b, s * 20.25 - 0.4, s * 20.25 + 0.4); }
      k.box(0.5, 0.5, 34, s * 30.25, 0.25, 0, hedge); k.block(s * 30.25 - 0.4, s * 30.25 + 0.4, -17, 17);
    }
    /* the lower level's edges to the terraces: retaining walls, balustrades and stairs */
    const S1 = -31, S2 = 18; /* the two stairs up to the library terrace */
    k.box(16, TY, 70, 38, TY / 2, 0, rust);
    for (let i = 0; i < 6; i++) for (const sz of [S1, S2]) k.box(0.42, TY - i * 0.25, 4.6, 30 - 0.21 - i * 0.42, (TY - i * 0.25) / 2, sz, granite);
    k.box(17, WY, 76, -44.5, WY / 2, 0, lime);
    for (let i = 0; i < 5; i++) { k.box(0.42, WY - i * 0.24, 6, -36 + 0.21 + i * 0.42, (WY - i * 0.24) / 2, -24, granite); k.box(0.42, WY - i * 0.24, 6, -36 + 0.21 + i * 0.42, (WY - i * 0.24) / 2, 24, granite); }
    const balustrade = (x0: number, x1: number, z0: number, z1: number, y: number, gaps: [number, number][] = []) => {
      const along = Math.abs(x1 - x0) > Math.abs(z1 - z0), len = along ? x1 - x0 : z1 - z0, n = Math.max(1, Math.round(Math.abs(len) / 0.45));
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, u = along ? x : z;
        if (gaps.some(([a, b]) => u > a && u < b)) continue;
        k.cyl(0.07, 0.8, x, y + 0.45, z, lime, 0.05, 8);
      }
      let cur = along ? x0 : z0;
      const segs: [number, number][] = [];
      for (const [a, b] of [...gaps].sort((p, q) => p[0] - q[0])) { segs.push([cur, a]); cur = b; }
      segs.push([cur, along ? x1 : z1]);
      for (const [a, b] of segs) { if (b - a < 0.2) continue; if (along) { k.box(b - a, 0.14, 0.3, (a + b) / 2, y + 0.92, z0, lime); k.box(b - a, 0.1, 0.24, (a + b) / 2, y + 0.06, z0, lime); } else { k.box(0.3, 0.14, b - a, x0, y + 0.92, (a + b) / 2, lime); k.box(0.24, 0.1, b - a, x0, y + 0.06, (a + b) / 2, lime); } }
    };
    balustrade(30.2, 30.2, -35, 35, TY, [[S1 - 2.5, S1 + 2.5], [S2 - 2.5, S2 + 2.5]]); k.block(29.9, 30.5, -35, S1 - 2.5); k.block(29.9, 30.5, S1 + 2.5, S2 - 2.5); k.block(29.9, 30.5, S2 + 2.5, 35);
    balustrade(-36.2, -36.2, -38, 38, WY, [[-27, -21], [21, 27]]); k.block(-36.5, -35.9, -21, 21); k.block(-36.5, -35.9, -38, -27); k.block(-36.5, -35.9, 27, 38);
    balustrade(-53, -53, -38, 38, WY); k.block(-53.4, -52.6, -38, 38);
    /* the library's rear elevation: rusticated base with a round arched arcade over the terrace, tall windows above, a cornice */
    const LX = 42.6;
    { const arches = Array.from({ length: 12 }, (_, i) => ({ cx: -33 + i * 6, y0: 0, w: 3.2, h: 6.2, arch: true }));
      const g = holedWall(72, 7.5, 1.2, arches); g.rotateY(-PI / 2); k.mesh(g, rust, LX, TY, 0);
      for (const a of arches) k.plane(3.2, 6.2, LX + 0.2, TY + 3.1, a.cx, darkGlass, -PI / 2);
      k.block(LX - 0.9, LX + 8, -37, 37); }
    k.box(1.4, 0.7, 73, LX, TY + 7.8, 0, lime);
    k.box(6, 15, 73, LX + 3, TY + 15.6, 0, lime);
    for (let i = 0; i < 11; i++) { const z = -30 + i * 6; k.box(0.4, 13.5, 1.3, LX - 0.2, TY + 15, z, lime); }
    for (let i = 0; i < 12; i++) for (const y of [TY + 10.5, TY + 17.5]) { const z = -33 + i * 6; k.plane(2.6, 4.6, LX - 0.02, y, z, darkGlass, -PI / 2); k.box(0.3, 0.3, 3.2, LX - 0.1, y + 2.5, z, lime); }
    k.moulding([[0, 0], [0.9, 0], [0.9, 0.3], [0.6, 0.55], [0.3, 0.7], [0, 0.72]], 74, LX - 0.6, TY + 23.2, 0, lime, 0);
    k.box(7, 0.6, 74, LX + 2.5, TY + 24.2, 0, lime);
    for (let z = -36; z <= 36; z += 0.6) k.cyl(0.1, 0.9, LX - 0.5, TY + 24.9, z, lime, 0.12, 8);
    k.box(7, 0.25, 74, LX + 2.5, TY + 25.4, 0, lime);
    k.box(30, 2.5, 70, LX + 18, TY + 26.6, 0, k.flat(0x4a4a46, 0.2, 0.7));
    /* the wings of the library run on east past the park to Fifth Avenue */
    k.box(40, 22, 20, LX + 20, 11, -44, lime); k.box(40, 22, 20, LX + 20, 11, 44, lime);
    /* the terrace: umbrellas, tables, a low pavilion at the south end that carries the census wall */
    for (const [x, z] of [[35, -22], [35, -10], [35, 2], [35, 11]]) { k.cyl(0.04, 2.6, x, TY + 1.3, z, iron, 0.04, 6); const u = k.mesh(new T.ConeGeometry(1.6, 0.5, 8, 1, true), k.flat(0xe8e0c8, 0, 0.9, { side: T.DoubleSide }), x, TY + 2.75, z); void u; k.cyl(0.4, 0.04, x, TY + 0.72, z, wood, 0.4, 14); k.cyl(0.03, 0.7, x, TY + 0.36, z, iron, 0.03, 6); k.keepOut.push({ x, z, r: 0.8 }); }
    k.box(12, 4.4, 6, 36, TY + 2.2, 31, lime); k.box(12.6, 0.4, 6.6, 36, TY + 4.5, 31, k.flat(0x4a4a46, 0.2, 0.7)); k.block(29.9, 42.1, 27.9, 34.1);
    k.censusWall({ x: 36, y: TY + 2.3, z: 27.94, rotY: PI, cols: 12, rows: 4, tile: 0.42, gap: 0.04, start: ctx.wallStart(550, 48), pieces: ctx.all, backing: k.flat(0x3a3632, 0, 0.8) });
    k.point(36, TY + 4, 24, 0xffe0b8, 6 + 16 * k.night, 14);
    /* the works on the arcade's piers, facing the terrace */
    for (const z of [-30, -24, -18, -6, 6, 12, 18, 24]) hang(mounts, LX - 0.62, TY + 2.1, z, -PI / 2, 2.1, 1.5, st, 3.2);
    k.egg(v(36, TY + 1.6, 0), { id: 'bp-library-1911', title: 'The block behind the library', year: '1911', text: 'The library\'s main branch on the east side of the park opened on May 23, 1911. The square behind it was renamed Bryant Park in 1884 for the poet and editor William Cullen Bryant. Before that the Croton Distributing Reservoir stood on the east of the site, demolished by 1900, and in 1853 the Exhibition of the Industry of All Nations was held here in the New York Crystal Palace, which burned down in 1858. The park is 9.6 acres.', clue: 'Stand on the library\'s terrace and look along its back. Neither the reservoir nor the palace of glass left a trace.', source: { name: 'Bryant Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bryant_Park' } }, { r: 3.4 });

    /* ---- 42nd Street and 40th Street beyond the promenades, the Grace Building and the towers ---- */
    for (const s of [-1, 1]) {
      const z0 = s * 34;
      k.box(100, 0.2, 5, -6, -0.1, z0 + s * 2.5, walk); k.box(100, 0.18, 0.25, -6, -0.02, z0 + s * 5, curb);
      k.box(100, 0.2, 12, -6, -0.14, z0 + s * 11, asph); for (let x = -56; x < 44; x += 3.2) k.box(1.6, 0.012, 0.12, x, -0.06, z0 + s * 11, line);
      k.box(100, 0.18, 0.25, -6, -0.02, z0 + s * 17, curb); k.box(100, 0.2, 4, -6, -0.1, z0 + s * 19, walk);
      k.block(-60, 50, s > 0 ? z0 + 4.8 : z0 - 22, s > 0 ? z0 + 22 : z0 - 4.8);
      traffic(k, ctx, { lanes: [{ z: z0 + s * 8, dir: s, n: 5, speed: 7 }, { z: z0 + s * 11.5, dir: s, n: 4, speed: 8 }, { z: z0 + s * 14.5, dir: -s, n: 4, speed: 7.5 }], x0: -58, x1: 46, seed: 1684 + s, y: -0.04 });
      k.crowd([v(-50, 0, z0 + s * 2.5), v(42, 0, z0 + s * 2.5)], 10, { seed: 1686 + s, spread: 1.2, animate: !ctx.reduced, speed: 1.0 });
    }
    /* the Grace Building: a swooping concave face to the park, up out of the frame */
    {
      const sh = new T.Shape(); sh.moveTo(-55, 0); sh.lineTo(-88, 0); sh.lineTo(-88, 125); sh.lineTo(-74, 125); sh.quadraticCurveTo(-74, 22, -55, 0); sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: 52, bevelEnabled: false, curveSegments: 24 }); g.rotateY(-PI / 2);
      k.mesh(g, facadeDark, 12, 0, 0);
    }
    { const rnd = X.mulberry(1688); for (let x = -60; x < 44; ) { const w = 10 + rnd() * 10, h = 24 + rnd() * 40; k.box(w, h, 24, x + w / 2, h / 2, -70, facade); x += w + 2; } }
    /* the black and gold tower on the 40th Street side, and the rest of the block */
    k.box(16, 78, 16, -26, 39, 66, facadeDark); for (let i = 0; i < 3; i++) k.box(12 - i * 3, 3, 12 - i * 3, -26, 79.5 + i * 3, 66, gilt);
    { const rnd = X.mulberry(1689); for (let x = -60; x < 44; ) { const w = 9 + rnd() * 10, h = 18 + rnd() * 36; if (x + w / 2 > -36 && x + w / 2 < -16) { x += w + 2; continue; } k.box(w, h, 24, x + w / 2, h / 2, 70, facade); x += w + 2; } }
    /* Sixth Avenue towers behind the fountain terrace */
    { const rnd = X.mulberry(1690); for (let z = -60; z < 60; ) { const w = 10 + rnd() * 10, h = 30 + rnd() * 50; k.box(20, h, w, -76, h / 2, z + w / 2, rnd() > 0.5 ? facade : facadeDark); z += w + 2; } }
    k.block(-70, -53.4, -60, 60);

    /* ---- the London planes on both promenades, in two rows each, and the lamps ---- */
    { let i = 0; for (const s of [-1, 1]) for (let x = -32; x <= 26; x += 5.8) for (const dz of [23.5, 29.5]) { const z = s * dz; if (s > 0 && x > -22 && x < -8) continue; k.tree(x, 0, z, { h: 8.5 + (i % 3) * 0.6, r: 3.8 + (i % 2) * 0.5, seed: 1691 + i }); k.box(1.4, 0.06, 1.4, x, 0.03, z, iron); k.keepOut.push({ x, z, r: 0.8 }); i++; } }
    for (const [x, z] of [[-34, -21], [-34, 21], [28, -21], [28, 21], [0, -33], [0, 33], [-50, -20], [-50, 20]]) k.lamp(x, z, 4.4, iron, 0xffd7a0, 14 + 22 * k.night);

    /* ---- the chairs, by the hundred, one instanced mesh, and the little round tables ---- */
    {
      const chairG = mergeGeometries([part(0.44, 0.03, 0.44, 0, 0.45, 0), part(0.44, 0.42, 0.03, 0, 0.72, -0.21, 0), part(0.03, 0.45, 0.03, -0.2, 0.225, -0.2), part(0.03, 0.45, 0.03, 0.2, 0.225, -0.2), part(0.03, 0.45, 0.03, -0.2, 0.225, 0.2), part(0.03, 0.45, 0.03, 0.2, 0.225, 0.2), part(0.03, 0.42, 0.03, -0.2, 0.72, -0.21), part(0.03, 0.42, 0.03, 0.2, 0.72, -0.21)])!;
      const tableG = mergeGeometries([(() => { const g = new T.CylinderGeometry(0.36, 0.36, 0.03, 14); g.translate(0, 0.72, 0); return g; })(), (() => { const g = new T.CylinderGeometry(0.03, 0.03, 0.7, 6); g.translate(0, 0.36, 0); return g; })(), (() => { const g = new T.CylinderGeometry(0.26, 0.26, 0.02, 12); g.translate(0, 0.01, 0); return g; })()])!;
      const rnd = X.mulberry(1692), cm: T.Matrix4[] = [], tm: T.Matrix4[] = [];
      const zones: [number, number, number, number, number][] = [[-30, 28, -32, -21, 150], [-30, 28, 21, 32, 120], [-34, -31, -19, 19, 24], [-35, -21, -19, 19, 60], [31, 41, -34, 26, 60], [-52, -37, -36, -8, 40], [-52, -37, 8, 36, 40]];
      const clear = (x: number, z: number) => k.keepOut.every((o) => (x - o.x) ** 2 + (z - o.z) ** 2 > (o.r + 0.4) ** 2) && !mounts.some((m) => (x - m.target.x) ** 2 + (z - m.target.z) ** 2 < 4) && !(x > -22 && x < -10 && z > 21 && z < 32) && !(x > -20 && x < -8 && z > 20 && z < 30);
      for (const [x0, x1, z0, z1, n] of zones) {
        const y = x1 <= -36 ? WY : x0 >= 31 ? TY : 0;
        for (let i = 0; i < n; i++) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (!clear(x, z)) continue; cm.push(new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromAxisAngle(up, rnd() * PI * 2), one)); }
        for (let i = 0; i < n / 5; i++) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (!clear(x, z)) continue; tm.push(new T.Matrix4().makeTranslation(x, y, z)); k.keepOut.push({ x, z, r: 0.5 }); }
      }
      k.instances(chairG, green, cm); k.instances(tableG, greenDark, tm);
      k.egg(v(0, 1.2, -26), { id: 'bp-chairs-1988', title: 'Two thousand chairs', year: '1988', text: 'The movable chairs are the mark of the park: 2,000 of them were put out in the redesign begun in 1988. The park closed for that renovation on July 11, 1988 and soft reopened on April 21, 1992, run by the Bryant Park Restoration Corporation that Dan Biederman founded in 1980.', clue: 'Pick a chair on the north promenade. Nobody will mind if you move it.', source: { name: 'Bryant Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bryant_Park' } }, { r: 3.2 });
    }
    /* people: walkers on the promenades, a few sitting on the lawn by day, the film crowd after dark */
    k.crowd([v(-33, 0, -26.5), v(28, 0, -26.5)], 16, { seed: 1693, spread: 3.6, animate: !ctx.reduced, speed: 0.8 });
    k.crowd([v(-33, 0, 26.5), v(28, 0, 26.5)], 12, { seed: 1694, spread: 3.2, animate: !ctx.reduced, speed: 0.8 });
    k.crowd([v(32, TY, -33), v(32, TY, 26)], 8, { seed: 1695, spread: 1.6, animate: !ctx.reduced, speed: 0.7 });
    {
      const rnd = X.mulberry(1696), pts: { x: number; y: number; z: number; ry: number; sit?: boolean }[] = [], bm: T.Matrix4[] = [], bc: number[] = [];
      const n = night ? 220 : 26;
      for (let i = 0; i < n; i++) {
        const x = -27 + rnd() * 52, z = -18 + rnd() * 36;
        pts.push({ x, y: 0.1, z, ry: night ? -PI / 2 : rnd() * PI * 2, sit: true });
        bm.push(new T.Matrix4().compose(v(x, 0.11, z), new T.Quaternion().setFromAxisAngle(up, rnd() * 0.6 - 0.3), one)); bc.push([0x8a2a2a, 0x2a3a6a, 0xe0dcd0, 0x3a5a2a, 0xd8a020, 0x5a4a8a][Math.floor(rnd() * 6)]);
      }
      still(k, pts, 1697);
      const bl = k.instances(new T.BoxGeometry(1.6, 0.02, 1.2), k.flat(0xffffff, 0, 0.95), bm); const c = new T.Color(); bc.forEach((h, i) => bl.setColorAt(i, c.set(h))); if (bl.instanceColor) bl.instanceColor.needsUpdate = true;
    }
    k.egg(v(0, 1.0, 0), { id: 'bp-stacks', title: 'The books are under your feet', year: '1992', text: 'When the park was rebuilt between 1988 and 1992 the library extended its stacks under the lawn: 84 miles of shelving that could hold 3.2 million books, beneath the grass you are standing on.', clue: 'Walk to the middle of the lawn and think about what holds it up.', source: { name: 'Bryant Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bryant_Park' } }, { r: 4.2 });

    /* ---- the fountain on the upper terrace at the Sixth Avenue end ---- */
    const FX = -44.5, FZ = 0;
    k.lathe([[4.8, 0], [4.8, 0.6], [4.4, 0.9], [4.2, 0.9], [4.2, 0.3], [0.9, 0.3], [0.7, 0.9], [0.55, 2.2], [1.9, 2.5], [2.1, 2.9], [1.7, 2.9], [0.2, 2.6], [0.12, 3.6], [0.0, 3.7]], FX, WY, FZ, pink, 40);
    k.lathe([[0.4, 0.92], [3.9, 0.92], [3.9, 0.94], [0.4, 0.94]], FX, WY, FZ, k.flat(0x3a6a7a, 0.05, 0.1, { envMapIntensity: 0.25, transparent: true, opacity: 0.85 }), 40);
    k.mesh(new T.CylinderGeometry(1.95, 1.95, 0.9, 40, 1, true), k.flat(0xcfe6ee, 0.05, 0.1, { transparent: true, opacity: 0.35, side: T.DoubleSide, depthWrite: false }), FX, WY + 2.5, FZ);
    vapour(k, [v(FX, WY + 3.6, FZ)], 40, { rise: 2.6, spread: 0.5, size: 0.14, opacity: 0.45, seed: 1698, speed: 0.5, animate: !ctx.reduced, additive: true });
    vapour(k, [v(FX - 1.6, WY + 2.9, FZ), v(FX + 1.6, WY + 2.9, FZ), v(FX, WY + 2.9, FZ - 1.6), v(FX, WY + 2.9, FZ + 1.6)], 10, { rise: -1.6, spread: 0.6, size: 0.1, opacity: 0.3, seed: 1699, speed: 0.6, animate: !ctx.reduced, additive: true });
    k.keepOut.push({ x: FX, z: FZ, r: 5.1 });
    k.egg(v(FX, WY + 2.4, FZ), { id: 'bp-lowell-fountain-1912', title: 'The first woman honoured by a monument', year: '1912', text: 'The Josephine Shaw Lowell Memorial Fountain, designed by Charles A. Platt and dedicated on May 21, 1912, is the first monument in New York City to honour a woman. Lowell was a social worker who founded the Charity Organization Society and was the first woman on the New York State Board of Charities. The fountain, Stony Creek granite and bronze, stood on the east side of the park until 1936, when it was moved here to the west. Since 2009 it has been heated inside so it can run in winter and gather icicles.', clue: 'Climb to the upper terrace at the Sixth Avenue end and stand at the basin.', source: { name: 'Josephine Shaw Lowell Memorial Fountain, Wikipedia', url: 'https://en.wikipedia.org/wiki/Josephine_Shaw_Lowell_Memorial_Fountain' } }, { r: 6 });
    /* four boards on the terrace against the Sixth Avenue balustrade, facing the fountain and the lawn */
    for (const z of [-14, -8, 8, 14]) {
      k.box(0.14, 2.0, 2.6, -50.5, WY + 1.85, z, k.flat(0x2a2a2a, 0, 0.8)); for (const s of [-1, 1]) { k.box(0.1, 2.85, 0.1, -50.6, WY + 1.42, z + s * 1.25, iron); k.box(0.5, 0.06, 0.5, -50.6, WY + 0.03, z + s * 1.25, iron); }
      k.keepOut.push({ x: -50.6, z, r: 0.7 });
      hang(mounts, -50.42, WY + 1.85, z, PI / 2, 2.2, 1.55, st, 3.2);
    }
    /* the film screen at the west end of the lawn: a scaffold, a wide screen, lit and flickering after dark */
    {
      const SX = -33.2;
      for (const z of [-7.5, 7.5]) { k.box(0.3, 9.6, 0.3, SX, 4.8, z, iron); k.box(0.3, 9.6, 0.3, SX - 1.2, 4.8, z, iron); k.box(1.5, 0.2, 0.2, SX - 0.6, 9.5, z, iron); k.box(1.5, 0.2, 0.2, SX - 0.6, 1.4, z, iron); }
      k.box(0.2, 0.2, 15.4, SX, 9.5, 0, iron); k.box(0.2, 0.2, 15.4, SX, 1.4, 0, iron);
      k.block(SX - 1.6, SX + 0.4, -8, 8);
      const SC = document.createElement('canvas'); SC.width = 256; SC.height = 144;
      const scTex = new T.CanvasTexture(SC); scTex.colorSpace = T.SRGBColorSpace;
      /* by day the screen is rolled on its top bar, the way it waits between film nights; after dark it is down and lit */
      if (night) { const screen = k.mesh(new T.PlaneGeometry(14.4, 8.1), new T.MeshBasicMaterial({ map: scTex }), SX + 0.2, 5.45, 0, true); screen.rotation.y = PI / 2; }
      else k.cyl(0.42, 14.6, SX + 0.2, 9.0, 0, k.flat(0xd8d8d4, 0, 0.9), 0.42, 12).rotation.x = PI / 2;
      if (night) k.point(SX + 4, 5, 0, 0xc8d8ff, 30, 30, 1.6);
      if (night && !ctx.reduced) {
        const rnd = X.mulberry(1700), blobs = Array.from({ length: 7 }, () => ({ x: rnd(), y: rnd(), r: 0.15 + rnd() * 0.3, vx: (rnd() - 0.5) * 0.08, vy: (rnd() - 0.5) * 0.05, h: rnd() * 360 }));
        k.ticks.push((t, dt) => {
          const g = SC.getContext('2d'); if (!g) return;
          const flick = 0.82 + 0.18 * Math.sin(t * 23.7) * Math.sin(t * 5.1);
          g.fillStyle = `rgb(${(12 * flick) | 0},${(14 * flick) | 0},${(24 * flick) | 0})`; g.fillRect(0, 0, 256, 144);
          for (const b of blobs) {
            b.x = (b.x + b.vx * dt + 1) % 1; b.y = (b.y + b.vy * dt + 1) % 1;
            const grd = g.createRadialGradient(b.x * 256, b.y * 144, 2, b.x * 256, b.y * 144, b.r * 200);
            grd.addColorStop(0, `hsla(${(b.h + t * 6) % 360},40%,${(60 * flick) | 0}%,0.85)`); grd.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = grd; g.fillRect(0, 0, 256, 144);
          }
          if (Math.floor(t * 24) % 96 === 0) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 0, 256, 144); }
          scTex.needsUpdate = true;
        });
      }
    }

    /* ---- Le Carrousel on the south side: the rig from v3 at Bryant Park's size, fourteen animals ---- */
    {
      const CX = -15, CZ = 26, PR = 3.6;
      const planks = k.pbr('bpPlank', X.planks(0x8a6a48, 8, 186), 0.8, { roughness: 0.6 });
      const rig = new T.Group(); rig.position.set(CX, 0, CZ); k.add(rig);
      const plat = new T.Mesh(new T.CylinderGeometry(PR, PR, 0.3, 36), planks); plat.position.y = 0.3; rig.add(plat);
      const rim = new T.Mesh(new T.CylinderGeometry(PR + 0.06, PR + 0.06, 0.34, 36, 1, true), red); rim.position.y = 0.3; rig.add(rim);
      k.cyl(PR + 0.4, 0.15, CX, 0.075, CZ, wood, PR + 0.4, 36);
      k.keepOut.push({ x: CX, z: CZ, r: PR + 1.3 });
      const NA = 14, hg = horseGeo(); hg.scale(0.72, 0.72, 0.72);
      const animals = new T.InstancedMesh(hg, new T.MeshStandardMaterial({ roughness: 0.5 }), NA);
      const poles = new T.InstancedMesh(new T.CylinderGeometry(0.03, 0.03, 3.2, 6), brass, NA);
      const riders = new T.InstancedMesh(figureGeo(0.11, 0.3, 0.7), new T.MeshStandardMaterial({ roughness: 0.85 }), NA);
      for (const o of [animals, poles, riders]) { o.frustumCulled = false; rig.add(o); }
      const rnd = X.mulberry(1701), c = new T.Color(), coats = [0xf4f0e8, 0x6a8a3a, 0x8a8a90, 0xd8b070, 0x3a6a9a, 0xe8d8c8, 0x8a4a2a], coats2 = [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0x8a4ad8];
      const hs = Array.from({ length: NA }, (_, i) => ({ a: (i / NA) * PI * 2, r: i % 2 ? 2.9 : 2.0, ph: rnd() * PI * 2, rider: rnd() > 0.4 }));
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), hide = new T.Vector3(0.0001, 0.0001, 0.0001);
      hs.forEach((h, i) => { animals.setColorAt(i, c.set(coats[i % coats.length])); riders.setColorAt(i, c.set(coats2[Math.floor(rnd() * coats2.length)])); q.setFromAxisAngle(up, -h.a - PI / 2); p.set(Math.cos(h.a) * h.r, 0.45 + 1.6, Math.sin(h.a) * h.r); m.compose(p, q, one); poles.setMatrixAt(i, m); });
      poles.instanceMatrix.needsUpdate = true; if (animals.instanceColor) animals.instanceColor.needsUpdate = true; if (riders.instanceColor) riders.instanceColor.needsUpdate = true;
      const place = (t: number) => {
        hs.forEach((h, i) => {
          q.setFromAxisAngle(up, -h.a - PI / 2);
          p.set(Math.cos(h.a) * h.r, 0.45 + 0.26 * Math.sin(t * 2.4 + h.ph), Math.sin(h.a) * h.r);
          m.compose(p, q, one); animals.setMatrixAt(i, m);
          p.y += 1.1; m.compose(p, q, h.rider ? one : hide); riders.setMatrixAt(i, m);
        });
        animals.instanceMatrix.needsUpdate = riders.instanceMatrix.needsUpdate = true;
      };
      place(0);
      const cone = new T.Mesh(new T.CylinderGeometry(0.3, PR + 0.9, 1.6, 20, 1, true), cream); cone.position.y = 4.1; rig.add(cone);
      for (let j = 0; j < 10; j++) { const s = new T.Mesh(new T.CylinderGeometry(0.3, PR + 0.92, 1.6, 20, 1, true, (j / 10) * PI * 2, PI / 10), green); s.position.y = 4.11; rig.add(s); }
      const board = new T.Mesh(new T.CylinderGeometry(PR + 0.95, PR + 0.95, 0.5, 24, 1, true), cream); board.position.y = 3.1; rig.add(board);
      for (const y of [2.86, 3.34]) { const tr = new T.Mesh(new T.TorusGeometry(PR + 0.96, 0.04, 6, 48), gilt); tr.rotation.x = PI / 2; tr.position.y = y; rig.add(tr); }
      const NB = 40, bulbs = new T.InstancedMesh(new T.SphereGeometry(0.07, 6, 5), new T.MeshBasicMaterial({ color: 0xffd27a }), NB);
      for (let j = 0; j < NB; j++) { const a = (j / NB) * PI * 2; m.identity(); m.setPosition(Math.cos(a) * (PR + 1.0), 3.42, Math.sin(a) * (PR + 1.0)); bulbs.setMatrixAt(j, m); }
      bulbs.instanceMatrix.needsUpdate = true; bulbs.frustumCulled = false; rig.add(bulbs);
      k.cyl(1.0, 2.6, CX, 1.75, CZ, cream, 1.0, 12); for (let j = 0; j < 6; j++) { const a = (j / 6) * PI * 2 + PI / 6; k.box(0.7, 1.4, 0.05, CX + Math.cos(a) * 1.02, 1.9, CZ + Math.sin(a) * 1.02, k.flat(0xdfe8f0, 1, 0.08)).rotation.y = PI / 2 - a; }
      k.point(CX, 3.8, CZ, 0xffe4b8, 10 + 30 * k.night, 12);
      if (!ctx.reduced) k.ticks.push((t) => { rig.rotation.y = t * 0.42; place(t); });
      k.egg(v(CX, 2.0, CZ), { id: 'bp-carrousel-2002', title: 'Fourteen animals, French songs', year: '2002', text: 'Le Carrousel on the south side of the park was installed in 2002, designed by Marvin Sylvor. It carries fourteen animal casts and plays French music.', clue: 'Find the ride on the 40th Street side and count what goes round.', source: { name: 'Bryant Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bryant_Park' } }, { r: 6 });
    }

    /* ---- the kiosks on the promenades, the reading room, and ping pong ---- */
    const kiosks: [number, number][] = [[-20, -30], [0, -30], [20, -30], [12, 30]];
    for (const [x, z] of kiosks) {
      k.box(2.8, 2.6, 2.8, x, 1.3, z, greenDark); k.box(3.4, 0.16, 3.4, x, 2.7, z, iron);
      const r = k.mesh(new T.ConeGeometry(2.5, 0.9, 4, 1, false), greenDark, x, 3.2, z); r.rotation.y = PI / 4;
      const f = z < 0 ? 1 : -1; k.plane(2.0, 1.2, x, 1.5, z + f * 1.41, k.flat(0x1a1a1a, 0.2, 0.4)); k.box(2.2, 0.06, 0.5, x, 0.95, z + f * 1.6, wood);
      k.block(x - 1.5, x + 1.5, z - 1.5, z + 1.5);
      for (const s of [-1, 1]) { k.box(0.06, 1.9, 2.5, x + s * 1.44, 1.45, z, k.flat(0x2a2a2a, 0, 0.8)); hang(mounts, x + s * 1.48, 1.45, z, s > 0 ? PI / 2 : -PI / 2, 2.1, 1.5, st, 3.2); }
      k.point(x, 2.4, z + f * 2.2, 0xffe0b8, 4 + 12 * k.night, 8);
    }
    k.sign('BRYANT PARK', 2.4, 0.4, 0, 2.95, -28.55, '#1f4a30', '#f0e8d0', 96);
    /* the reading room: umbrellas, carts of books with no lettering, tables */
    {
      const RX = 22, RZ = -26;
      for (const [dx, dz] of [[-4.5, -1.5], [0, -1.5], [4.5, -1.5], [-4.5, 2.5], [4.5, 2.5]]) { const x = RX + dx, z = RZ + dz; k.cyl(0.04, 2.7, x, 1.35, z, iron, 0.04, 6); k.mesh(new T.ConeGeometry(1.7, 0.55, 8, 1, true), burgundy, x, 2.85, z); k.keepOut.push({ x, z, r: 0.3 }); }
      const bm: T.Matrix4[] = [], bc: number[] = [], rnd = X.mulberry(1702), bpal = [0x6e1420, 0x123b6b, 0x1e5b4f, 0x4a2c6b, 0x7a5a30, 0x2a2a2a, 0xb89a5a, 0xe8e0c8];
      for (const [cx, cz] of [[RX - 2, RZ + 0.6], [RX + 2, RZ + 0.6]]) {
        k.box(1.6, 1.0, 0.7, cx, 0.6, cz, wood); for (const [dx, dz] of [[-0.65, -0.25], [0.65, -0.25], [-0.65, 0.25], [0.65, 0.25]]) k.cyl(0.07, 0.1, cx + dx, 0.05, cz + dz, iron, 0.07, 8);
        for (let x = cx - 0.72; x < cx + 0.72;) { const w = 0.04 + rnd() * 0.04; bm.push(new T.Matrix4().compose(v(x + w / 2, 1.24, cz), new T.Quaternion(), v(w, 0.24 + rnd() * 0.1, 0.5))); bc.push(bpal[Math.floor(rnd() * bpal.length)]); x += w + 0.004; }
        k.keepOut.push({ x: cx, z: cz, r: 1.0 });
      }
      const bk = k.instances(new T.BoxGeometry(1, 1, 1), k.flat(0xffffff, 0, 0.75), bm); const c = new T.Color(); bc.forEach((h, i) => bk.setColorAt(i, c.set(h))); if (bk.instanceColor) bk.instanceColor.needsUpdate = true;
      k.egg(v(RX, 1.4, RZ - 1.5), { id: 'bp-reading-room-2003', title: 'The open air reading room', year: '2003', text: 'The Reading Room, an open air library on the promenade, was revived in 2003. The park also runs a winter village with an ice rink, opened in 2005, and its summer film nights on the lawn.', clue: 'The books under the burgundy umbrellas on the 42nd Street side. Nobody checks them out.', source: { name: 'Bryant Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bryant_Park' } }, { r: 3.4 });
    }
    /* ping pong: the rally starts when the visitor comes to the table */
    {
      const tables: { x: number; z: number; ball: T.Mesh; pads: T.Mesh[]; ph: number }[] = [];
      for (const x of [-18, -12]) {
        const z = 25.5;
        k.box(2.74, 0.04, 1.52, x, 0.76, z, k.flat(0x1e4a8a, 0, 0.6)); k.box(2.78, 0.02, 0.04, x, 0.785, z - 0.76, cream); k.box(2.78, 0.02, 0.04, x, 0.785, z + 0.76, cream); k.box(0.04, 0.02, 1.52, x, 0.785, z, cream);
        k.box(0.02, 0.15, 1.7, x, 0.84, z, k.flat(0x2a2a2a, 0, 0.8, { transparent: true, opacity: 0.7 }));
        for (const [dx, dz] of [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]]) k.box(0.06, 0.74, 0.06, x + dx, 0.37, z + dz, iron);
        k.keepOut.push({ x, z, r: 1.6 });
        const pads: T.Mesh[] = [];
        for (const s of [-1, 1]) { k.mesh(figureGeo(0.19, 0.7, 1.22), k.flat(s > 0 ? 0x3a8ae8 : 0xe83a5a, 0, 0.85), x + s * 2.0, 0, z); const pd = k.mesh(new T.CylinderGeometry(0.09, 0.09, 0.02, 12).rotateZ(PI / 2), red, x + s * 1.75, 1.0, z + 0.2, true); pads.push(pd); }
        const ball = k.mesh(new T.SphereGeometry(0.03, 8, 6), k.flat(0xffffff, 0, 0.5), x, 0.82, z, true);
        tables.push({ x, z, ball, pads, ph: x });
      }
      if (!ctx.reduced) k.ticks.push((t) => {
        const e = eye();
        for (const tb of tables) {
          const near = e ? (e.x - tb.x) ** 2 + (e.z - tb.z) ** 2 < 36 : false;
          if (!near) { tb.ball.position.set(tb.x + 1.2, 0.82, tb.z - 0.5); tb.pads[0].position.y = tb.pads[1].position.y = 1.0; continue; }
          const u = Math.sin(t * 2.6 + tb.ph);
          tb.ball.position.set(tb.x + u * 1.5, 0.82 + 0.35 * (1 - u * u), tb.z + 0.15 * Math.sin(t * 1.1));
          tb.pads[0].position.y = 1.0 + 0.2 * Math.max(0, -u); tb.pads[1].position.y = 1.0 + 0.2 * Math.max(0, u);
        }
      });
    }

    const floorY = (x: number, z: number) => {
      if (x >= 30.1 && x < 42) return TY;
      if (x > 27.5 && x < 30.1 && (Math.abs(z - S1) < 2.4 || Math.abs(z - S2) < 2.4)) return TY * clamp01((x - 27.5) / 2.6);
      if (x <= -36 && x > -53) return WY;
      if (x < -33.8 && x >= -36 && Math.abs(Math.abs(z) - 24) < 3.1) return WY * clamp01((-33.8 - x) / 2.2);
      return 0;
    };
    return { mounts, spawn: v(34, TY + 3, 0), look: v(-44, 4, 0), eye: 3, floorY, bounds: [-52.6, 41.6, -37.5, 37.5], style: st };
  },
};
