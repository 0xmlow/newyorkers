/* 165 and 166: two rooms under the street.
   The loop under City Hall: the IRT's station of 1904, closed to passengers at the end of 1945 and
   still the balloon loop every 6 train uses to turn round. The curved platform under twelve
   Guastavino tile vaults, chandeliers, three leaded glass skylights, the tiled name tablets and the
   bronze plaques on the trackside wall, the mezzanine with its oak booth, and the stair up toward
   the park. A train of silver cars rides the loop slowly in and out of the tunnel mouths.
   Eighty feet under Liberty Street: the Federal Reserve Bank of New York, a Florentine palazzo of
   rusticated stone with Yellin's ironwork, the banking hall behind its arched windows, and the
   elevator down to the vault on bedrock: the steel cylinder that turns to open the way, the
   corridor, the scale room and the cages of stacked bars behind bars and mesh.
   Rules kept: no likeness of any real person, no lettered text beyond the station name, the bank's
   name and a direction sign, nothing hung on the cages, and the vault eggs are about the building
   and the vault, not about money. */
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
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
/* a wall with round arched openings, round windows and rectangles, one extrusion, centred on x, base at y 0 */
type Hole = { kind: 'arch'; cx: number; y0: number; w: number; h: number } | { kind: 'circle'; cx: number; cy: number; r: number } | { kind: 'rect'; cx: number; y0: number; w: number; h: number };
function holedWall(w: number, h: number, depth: number, holes: Hole[]) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new T.Path();
    if (o.kind === 'circle') p.absarc(o.cx, o.cy, o.r, 0, PI * 2, false);
    else if (o.kind === 'rect') { p.moveTo(o.cx - o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0 + o.h); p.lineTo(o.cx - o.w / 2, o.y0 + o.h); p.closePath(); }
    else {
      const a = o.w / 2, cy = o.y0 + o.h - a;
      p.moveTo(o.cx - a, o.y0); p.lineTo(o.cx - a, cy);
      p.absarc(o.cx, cy, a, PI, 0, true);
      p.lineTo(o.cx + a, o.y0); p.closePath();
    }
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 16 });
  g.translate(0, 0, -depth / 2);
  return g;
}
/* walls along x (at z) and along z (at x) with door gaps, blocked where solid */
type Gap = { c: number; w: number; h: number };
function wallX(k: K, x0: number, x1: number, z: number, h: number, t: number, m: T.Material, gaps: Gap[] = [], y0 = 0, block = true) {
  let cur = x0;
  for (const g of [...gaps].sort((a, b) => a.c - b.c)) {
    const a = g.c - g.w / 2, b = g.c + g.w / 2;
    if (a > cur) { k.box(a - cur, h, t, (cur + a) / 2, y0 + h / 2, z, m); if (block) k.block(cur, a, z - t / 2 - 0.3, z + t / 2 + 0.3); }
    if (h > g.h) k.box(g.w, h - g.h, t, g.c, y0 + g.h + (h - g.h) / 2, z, m);
    cur = b;
  }
  if (x1 > cur) { k.box(x1 - cur, h, t, (cur + x1) / 2, y0 + h / 2, z, m); if (block) k.block(cur, x1, z - t / 2 - 0.3, z + t / 2 + 0.3); }
}
function wallZ(k: K, z0: number, z1: number, x: number, h: number, t: number, m: T.Material, gaps: Gap[] = [], y0 = 0, block = true) {
  let cur = z0;
  for (const g of [...gaps].sort((a, b) => a.c - b.c)) {
    const a = g.c - g.w / 2, b = g.c + g.w / 2;
    if (a > cur) { k.box(t, h, a - cur, x, y0 + h / 2, (cur + a) / 2, m); if (block) k.block(x - t / 2 - 0.3, x + t / 2 + 0.3, cur, a); }
    if (h > g.h) k.box(t, h - g.h, g.w, x, y0 + g.h + (h - g.h) / 2, g.c, m);
    cur = b;
  }
  if (z1 > cur) { k.box(t, h, z1 - cur, x, y0 + h / 2, (cur + z1) / 2, m); if (block) k.block(x - t / 2 - 0.3, x + t / 2 + 0.3, cur, z1); }
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
/* translucent puffs that rise, spread and fade: steam from a stack (from v3) */
function vapour(k: K, pts: T.Vector3[], perPt: number, p: { rise?: number; spread?: number; size?: number; opacity?: number; colour?: number; seed?: number; speed?: number; animate: boolean }) {
  const { rise = 1.4, spread = 0.5, size = 0.1, opacity = 0.2, colour = 0xffffff, seed = 1, speed = 0.28, animate } = p;
  const n = pts.length * perPt, rnd = X.mulberry(seed);
  const o = k.instances(new T.SphereGeometry(size, 6, 5), new T.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false }), Array.from({ length: n }, () => new T.Matrix4()));
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
function bulbsMesh(k: K, bulbs: { x: number; y: number; z: number }[], color = 0xffe2a8, size = 0.07) {
  if (!bulbs.length) return;
  k.instances(new T.SphereGeometry(size, 8, 6), new T.MeshBasicMaterial({ color }), bulbs.map((b) => new T.Matrix4().makeTranslation(b.x, b.y, b.z)));
}
/* people standing still: one instanced figure each */
function still(k: K, pts: { x: number; y: number; z: number; ry: number }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0]) {
  if (!pts.length) return;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y, p.z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), p.ry), v(1, 1.1 + rnd() * 0.12, 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
}
/* an arc of points at radius r, height y, round centre (cx, cz), in the room's angle convention (x = r sin a, z = r cos a) */
function arcPts(cx: number, cz: number, r: number, y: number, a0: number, a1: number, n = 32) {
  return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / n); return v(cx + r * Math.sin(a), y, cz + r * Math.cos(a)); });
}
/* a flat ring segment on the floor plan facing up, angles a0 to a1 in the same convention, centred on the origin */
function ringUp(r0: number, r1: number, a0: number, a1: number, seg = 48) {
  const g = new T.RingGeometry(r0, r1, seg, 1, 0, a1 - a0);
  g.rotateX(-PI / 2); g.rotateY(a0 - PI / 2);
  return g;
}
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
/* the New York clock as a fractional hour, read from Intl, never from Date.now() raw */
function nyHour() {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
    const p: Record<string, number> = {};
    for (const q of f.formatToParts(new Date())) if (q.type === 'hour' || q.type === 'minute' || q.type === 'second') p[q.type] = Number(q.value);
    return ((p.hour ?? 12) % 24) + (p.minute ?? 0) / 60 + (p.second ?? 0) / 3600;
  } catch { return 12; }
}
/* how much daylight an hour carries, 0 at night, 1 by day */
const daylight = (h: number) => clamp01((h - 5.5) / 2) * clamp01((20.5 - h) / 2);
/* the room's base hour: the museum's hour when it has one (so ?hour= works in a shot), else the clock */
const baseHour = (k: K) => (k.o && typeof k.o.hour === 'number' && Number.isFinite(k.o.hour) ? k.o.hour : nyHour());
/* a camera position if the museum is running, undefined in the audit and the check scripts */
function visitor(): T.Vector3 | undefined {
  if (typeof window === 'undefined') return undefined;
  const m = (window as unknown as { __museum?: { camera?: T.Camera } }).__museum;
  return m && m.camera ? m.camera.position : undefined;
}
/* Guastavino tile: courses of thin tiles laid in a chevron, cream and tan, dark joints */
function guastavino(seed: number) {
  const S = 512, W = 14, L = 42, band = 84;
  return canvasTex(S, S, (g) => {
    const rnd = X.mulberry(seed), pal = ['#e6dcc4', '#dccbaa', '#cbb58e', '#e9e0cc', '#d6c39e', '#c4ad82'];
    g.fillStyle = '#7e7058'; g.fillRect(0, 0, S, S);
    for (let b = -8; b < 16; b++) {
      const s0 = b * band, s1 = s0 + band;
      g.save(); g.beginPath(); g.moveTo(s0, 0); g.lineTo(s1, 0); g.lineTo(s1 - S, S); g.lineTo(s0 - S, S); g.closePath(); g.clip();
      g.translate(S / 2, S / 2); g.rotate(b % 2 ? PI / 4 : -PI / 4);
      for (let y = -S; y < S; y += W) for (let x = -S + ((Math.round(y / W) % 2) ? L / 2 : 0); x < S; x += L) { g.fillStyle = pal[Math.floor(rnd() * pal.length)]; g.fillRect(x + 1, y + 1, L - 2, W - 2); }
      g.restore();
    }
  }, true);
}
/* a leaded glass oval: amber panes in a lead net, transparent outside the oval */
function leadedOval(seed: number) {
  return canvasTex(256, 160, (g) => {
    const rnd = X.mulberry(seed), pal = ['#f2e2b8', '#e8d09a', '#f6ecd0', '#d9c48e', '#efe0b4', '#e4d4a4'];
    g.save(); g.beginPath(); g.ellipse(128, 80, 124, 76, 0, 0, PI * 2); g.clip();
    g.fillStyle = '#2a2622'; g.fillRect(0, 0, 256, 160);
    for (let y = 0; y < 160; y += 20) for (let x = 0; x < 256; x += 20) { g.fillStyle = pal[Math.floor(rnd() * pal.length)]; g.fillRect(x + 2, y + 2, 16, 16); }
    g.restore();
    g.strokeStyle = '#2a2622'; g.lineWidth = 6; g.beginPath(); g.ellipse(128, 80, 121, 73, 0, 0, PI * 2); g.stroke();
  });
}
/* woven wire mesh, transparent between the wires */
function wireMesh() {
  return canvasTex(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.strokeStyle = '#3a3c40'; g.lineWidth = 2.2; g.beginPath();
    for (let i = -64; i < 128; i += 16) { g.moveTo(i, 0); g.lineTo(i + 64, 64); g.moveTo(i + 64, 0); g.lineTo(i, 64); }
    g.stroke();
  }, true);
}
/* a small figure geometry translated to stand at a point, for merging into a moving group */
function standing(x: number, z: number, ry: number) { const g = figureGeo(0.19, 0.62, 1.12); g.rotateY(ry); g.translate(x, 0, z); return g; }

/* ================================================================== */
/* ---------------- 165 THE LOOP UNDER CITY HALL ---------------- */
export const cityhallloop: RoomDef = {
  id: 'cityhallloop',
  name: 'The loop under City Hall',
  area: 'CITY HALL STATION / THE 1904 LOOP',
  mood: 'A 6 train turning round under 1904',
  color: '#7a6a52',
  daylit: false,
  description: 'The first station of the first subway, opened in 1904 and closed to passengers at the end of 1945, still the loop every 6 train uses to turn round under City Hall Park. You stand on the curved platform under Guastavino tile vaults with chandeliers hung from their centres and leaded glass skylights letting in a little of the park above, while a train of silver cars comes slowly out of one tunnel mouth and round into the other. The New Yorkers hang on the curved platform wall, in the mezzanine up the stair and in the passage toward the park.',
  signatures: 'The curved platform on a balloon loop, the twelve Guastavino tile vaults with their green and tan ribs, the chandeliers, the three leaded glass skylights, the tiled station name tablets and the three bronze plaques on the trackside wall, the mezzanine with its oak ticket booth under its own vault, the stair up toward City Hall Park and the iron gate at the top, a 6 train of silver cars with lit windows riding the loop, a tour group on the platform, and a rat on the track bed.',
  build(k, ctx) {
    const CZ = -36, RT = 40, RPE = 38.3, RPW = 33.6, RTW = 42.4, A0 = -0.95, A1 = 0.95, SY = 3.3, RV = 2.4, BAYS = 12, BA = (A1 - A0) / BAYS;
    const at = (r: number, a: number, y = 0) => v(r * Math.sin(a), y, CZ + r * Math.cos(a));
    const hour0 = baseHour(k);
    k.sky({ top: 0x07080b, horizon: 0x101216, ground: 0x050505, fog: 0.008, env: 0.35 });
    k.hemi(0x9a8a70, 0x201c16, 0.55);
    const tileW = k.pbr('chWall', X.subwayTile(0xe4dcc6, 0x8a8070), 1.5, { roughness: 0.35, side: T.DoubleSide }),
      vaultM = new T.MeshStandardMaterial({ map: guastavino(165), roughness: 0.6, side: T.DoubleSide }),
      green = k.flat(0x2f5e45, 0, 0.3), tan = k.flat(0xb8925a, 0, 0.35), cream = k.flat(0xe8e0cc, 0, 0.4, { side: T.DoubleSide }),
      floorM = k.pbr('chFloor', X.concrete(0x8a867e, 165), 0.4, { roughness: 0.85 }), floorM2 = k.pbr('chFloor2', X.concrete(0x9a948a, 167), 0.4, { roughness: 0.8 }),
      ballast = k.flat(0x2a2724, 0, 1), rail = k.flat(0x9a9ca0, 1, 0.3), rust = k.flat(0x4a3a30, 0.4, 0.8),
      brass = k.flat(0xc8a050, 1, 0.3), bronze = k.flat(0x6e5230, 0.9, 0.45), bronzeDark = k.flat(0x4a3620, 0.9, 0.5),
      oak = k.pbr('chOak', X.planks(0x6a4428, 6, 166), 0.8, { roughness: 0.55 }), oakDark = k.flat(0x3e2616, 0, 0.5),
      iron = k.flat(0x1c1c1e, 0.6, 0.5), yellow = k.flat(0xd8b020, 0, 0.7), edgeM = k.flat(0x6a6660, 0, 0.9, { side: T.DoubleSide }),
      tunnelM = k.flat(0x0f0d0b, 0, 1, { side: T.DoubleSide }), tieM = k.flat(0x3a2e24, 0, 0.95),
      silver = k.flat(0xd0d4d8, 0.45, 0.42), carDark = k.flat(0x2a2c30, 0.5, 0.6), glassDark = k.flat(0x1a2028, 0.5, 0.2);
    vaultM.userData.density = 0.55;
    const bulbs: { x: number; y: number; z: number }[] = [];
    const mounts: Mount[] = [], st: FrameStyle = 'gilt';

    /* ---- the platform: a concave arc inside the loop, a yellow edge, the drop to the track bed ---- */
    k.mesh(ringUp(RPW, RPE, A0, A1, 96), floorM, 0, 0, CZ);
    k.mesh(ringUp(RPE - 0.55, RPE, A0, A1, 96), yellow, 0, 0.006, CZ);
    k.mesh(new T.CylinderGeometry(RPE, RPE, 1.1, 96, 1, true, A0, A1 - A0), edgeM, 0, -0.55, CZ);
    /* the track bed: ballast, ties, two rails, the third rail under its board, all running on into the tunnels */
    k.mesh(ringUp(RPE - 0.3, RTW, A0 - 0.5, A1 + 0.5, 96), ballast, 0, -1.1, CZ);
    { const ties: T.Matrix4[] = []; const n = Math.round(((A1 - A0 + 1.0) * RT) / 0.6); for (let i = 0; i <= n; i++) { const a = A0 - 0.5 + ((A1 - A0 + 1.0) * i) / n; ties.push(new T.Matrix4().compose(at(RT, a, -1.02), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), a), v(1, 1, 1))); } k.instances(new T.BoxGeometry(2.6, 0.14, 0.24), tieM, ties); }
    for (const r of [RT - 0.72, RT + 0.72]) k.curve(arcPts(0, CZ, r, -0.9, A0 - 0.5, A1 + 0.5, 64), 0.045, rail, 128);
    k.curve(arcPts(0, CZ, RT + 1.35, -0.84, A0 - 0.5, A1 + 0.5, 64), 0.045, rust, 128);
    k.curve(arcPts(0, CZ, RT + 1.35, -0.66, A0 - 0.5, A1 + 0.5, 64), 0.1, oakDark, 128);
    /* the track is blocked with a chain of squares just past the yellow strip, on into the tunnel mouths */
    { const n = Math.round(((A1 - A0 + 0.8) * 40.3) / 1.5); for (let i = 0; i <= n; i++) { const a = A0 - 0.4 + ((A1 - A0 + 0.8) * i) / n, p = at(40.3, a); k.block(p.x - 2.0, p.x + 2.0, p.z - 2.0, p.z + 2.0); } }

    /* ---- the platform wall: tile from the floor to the spring of the vaults, with the arch to the mezzanine at the middle ---- */
    for (const [t0, t1] of [[A0, -0.06], [0.06, A1]]) k.mesh(new T.CylinderGeometry(RPW, RPW, SY, 64, 1, true, t0, t1 - t0), tileW, 0, SY / 2, CZ);
    k.mesh(holedWall(4.6, SY, 0.5, [{ kind: 'arch', cx: 0, y0: 0, w: 3.4, h: 3.0 }]), tileW, 0, 0, CZ + RPW);
    k.mesh(new T.CylinderGeometry(RPW + 0.02, RPW + 0.02, 0.9, 64, 1, true, A0, A1 - A0), green, 0, 0.45, CZ);
    k.mesh(new T.CylinderGeometry(RPW + 0.03, RPW + 0.03, 0.32, 64, 1, true, A0, A1 - A0), tan, 0, SY - 0.16, CZ);
    { const n = Math.round(((A1 - A0) * RPW) / 1.0); for (let i = 0; i <= n; i++) { const a = A0 + ((A1 - A0) * i) / n; if (Math.abs(a) < 0.062) continue; const p = at(RPW - 0.25, a); k.block(p.x - 0.7, p.x + 0.7, p.z - 0.7, p.z + 0.7); } }
    /* ---- the trackside wall: tile from the track bed to the spring, the name tablets and the three bronze plaques ---- */
    k.mesh(new T.CylinderGeometry(RTW, RTW, SY + 1.1, 64, 1, true, A0 - 0.02, A1 - A0 + 0.04), tileW, 0, (SY - 1.1) / 2, CZ);
    k.mesh(new T.CylinderGeometry(RTW - 0.02, RTW - 0.02, 0.32, 64, 1, true, A0, A1 - A0), tan, 0, SY - 0.16, CZ);
    k.mesh(new T.CylinderGeometry(RTW - 0.02, RTW - 0.02, 0.5, 64, 1, true, A0, A1 - A0), green, 0, 0.3, CZ);
    for (const a of [-0.55, 0, 0.55]) {
      const p = at(RTW - 0.08, a, 2.55);
      k.box(2.9, 0.95, 0.08, p.x, p.y, p.z, green).rotation.y = a;
      k.box(2.7, 0.75, 0.06, p.x, p.y, p.z, tan).rotation.y = a;
      const q = at(RTW - 0.14, a, 2.55);
      k.sign('CITY HALL', 2.4, 0.6, q.x, q.y, q.z, '#b8a474', '#16321f', 118, a + PI);
    }
    for (const a of [-0.32, 0.32, 0.76]) {
      const p = at(RTW - 0.1, a, 1.9);
      k.box(1.3, 1.0, 0.07, p.x, p.y, p.z, bronze).rotation.y = a;
      k.box(1.1, 0.8, 0.09, p.x, p.y, p.z, bronzeDark).rotation.y = a;
      for (let l = 0; l < 6; l++) { const q = at(RTW - 0.16, a, 2.2 - l * 0.12); k.box(0.5 + (l % 3) * 0.15, 0.03, 0.02, q.x, q.y, q.z, bronze).rotation.y = a; }
    }

    /* ---- the vaults: twelve bays of Guastavino tile across the platform and the track, green ribs between ---- */
    {
      const na = 96, ns = 14, pos: number[] = [], uv: number[] = [], idx: number[] = [];
      for (let i = 0; i <= na; i++) for (let j = 0; j <= ns; j++) {
        const a = A0 + (A1 - A0) * (i / na), r = RPW + (RTW - RPW) * (j / ns);
        const bf = Math.sin(PI * (((i / na) * BAYS) % 1)), y = SY + RV * (0.78 + 0.22 * bf) * Math.sin((PI * j) / ns);
        pos.push(r * Math.sin(a), y, CZ + r * Math.cos(a)); uv.push(a * 19, (j / ns) * 4.8);
      }
      for (let i = 0; i < na; i++) for (let j = 0; j < ns; j++) { const p = i * (ns + 1) + j; idx.push(p, p + 1, p + ns + 1, p + 1, p + ns + 2, p + ns + 1); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      k.mesh(g, vaultM, 0, 0, 0);
    }
    for (let b = 0; b <= BAYS; b++) {
      const a = A0 + b * BA, pts = Array.from({ length: 15 }, (_, j) => at(RPW + (RTW - RPW) * (j / 14), a, SY + RV * 0.78 * Math.sin((PI * j) / 14) - 0.12));
      k.curve(pts, 0.16, green, 28); k.curve(pts.map((p) => v(p.x, p.y - 0.2, p.z)), 0.07, tan, 28);
    }
    /* three of the vaults carry leaded glass skylights that open to vault lights in the park; day comes through by the clock */
    const skyMats: T.MeshBasicMaterial[] = [], skyLights: T.Light[] = [];
    for (const b of [2, 5, 8]) {
      const a = A0 + (b + 0.5) * BA, p = at(38, a, SY + RV - 0.14);
      const m = new T.MeshBasicMaterial({ map: leadedOval(1650 + b), transparent: true, side: T.DoubleSide, alphaTest: 0.2 });
      const g = new T.PlaneGeometry(4.4, 2.7); g.rotateX(PI / 2); g.rotateY(a + PI / 2);
      k.mesh(g, m, p.x, p.y, p.z, true);
      skyMats.push(m); skyLights.push(k.point(p.x, p.y - 1.2, p.z, 0xf4ead8, 8, 12));
    }
    /* twelve chandeliers, one from the centre of each vault: a chain, a brass hub, a ring of globes */
    for (let b = 0; b < BAYS; b++) {
      const a = A0 + (b + 0.5) * BA, p = at(38, a, SY + RV * 0.78 - 0.1);
      k.cyl(0.015, 1.05, p.x, p.y - 0.5, p.z, brass, 0.015, 6);
      k.lathe([[0.04, 0], [0.22, -0.1], [0.3, -0.26], [0.1, -0.4], [0.03, -0.5]], p.x, p.y - 1.0, p.z, brass, 14);
      k.torus(0.58, 0.028, p.x, p.y - 1.42, p.z, brass, 36).rotation.x = PI / 2;
      for (let i = 0; i < 6; i++) { const t = (i / 6) * PI * 2; k.cyl(0.012, 0.42, p.x + Math.cos(t) * 0.5, p.y - 1.2, p.z + Math.sin(t) * 0.5, brass, 0.012, 5); bulbs.push({ x: p.x + Math.cos(t) * 0.58, y: p.y - 1.42, z: p.z + Math.sin(t) * 0.58 }); }
      bulbs.push({ x: p.x, y: p.y - 1.62, z: p.z });
      if (b % 2 === 0) k.point(p.x, p.y - 1.9, p.z, 0xffd8a0, 13, 16);
    }

    /* ---- the ends: the platform stops at a tiled wall, the track runs on under a portal into the dark ---- */
    for (const a of [A0, A1]) {
      const p = at((RPW + RPE) / 2 + 0.1, a, (SY + RV) / 2);
      k.box(RPE - RPW + 0.4, SY + RV, 0.5, p.x, p.y, p.z, tileW).rotation.y = PI / 2 - a;
      for (let r = RPW; r <= RPE; r += 0.7) { const q = at(r, a); k.block(q.x - 0.55, q.x + 0.55, q.z - 0.55, q.z + 0.55); }
      const h = at((RPE + RTW) / 2 - 0.1, a, 4.1 + (SY + RV - 4.1) / 2);
      k.box(RTW - RPE + 0.8, SY + RV - 4.1, 0.5, h.x, h.y, h.z, tileW).rotation.y = PI / 2 - a;
      const l = at(RT + 2.6, a + (a > 0 ? 0.08 : -0.08), 1.6); bulbs.push({ x: l.x, y: l.y, z: l.z });
    }
    {
      const tor = new T.TorusGeometry(RT, 3.1, 12, 72, 2 * PI - (A1 - A0));
      tor.rotateX(PI / 2); tor.scale(-1, 1, 1); tor.rotateY(A1 + PI / 2);
      k.mesh(tor, tunnelM, 0, 1.3, CZ);
      for (let i = 1; i < 10; i++) { const a = A1 + 0.35 * i, p = at(RT + 2.6, a, 1.6); bulbs.push({ x: p.x, y: p.y, z: p.z }); const q = at(RT + 2.6, -a, 1.6); bulbs.push({ x: q.x, y: q.y, z: q.z }); }
    }

    /* ---- the train: six silver cars with lit windows, the headlight ahead, a red light behind ---- */
    const L = 15.2, cars: T.Group[] = [];
    {
      const bx = (w: number, h: number, d: number, x: number, y: number, z: number) => new T.BoxGeometry(w, h, d).translate(x, y, z);
      const silverG = mergeGeometries([bx(2.9, 2.5, L, 0, 2.15, 0), bx(2.6, 0.26, L - 0.2, 0, 3.53, 0), bx(2.92, 0.5, L - 0.6, 0, 1.15, 0)])!;
      const darkParts = [bx(2.4, 0.5, L, 0, 0.65, 0), bx(2.0, 0.5, 2.4, 0, 0.4, 5.2), bx(2.0, 0.5, 2.4, 0, 0.4, -5.2), bx(2.9, 0.16, L, 0, 3.4, 0)];
      for (const s of [-1, 1]) for (const z of [-5.6, -4.0, -0.8, 0.8, 4.0, 5.6]) darkParts.push(bx(0.06, 2.2, 0.14, s * 1.47, 2.1, z));
      const darkG = mergeGeometries(darkParts)!;
      const glowG = mergeGeometries([bx(0.04, 0.95, L - 1.2, 1.47, 2.5, 0), bx(0.04, 0.95, L - 1.2, -1.47, 2.5, 0)])!;
      const endG = mergeGeometries([bx(1.7, 0.9, 0.04, 0, 2.5, L / 2 + 0.01), bx(1.7, 0.9, 0.04, 0, 2.5, -L / 2 - 0.01)])!;
      const winM = new T.MeshBasicMaterial({ color: 0xfff0c4 });
      for (let i = 0; i < 6; i++) {
        const g = new T.Group();
        g.add(new T.Mesh(silverG, silver), new T.Mesh(darkG, carDark), new T.Mesh(glowG, winM), new T.Mesh(endG, glassDark));
        if (i === 0) {
          for (const s of [-1, 1]) { const h = new T.Mesh(new T.SphereGeometry(0.13, 8, 6), new T.MeshBasicMaterial({ color: 0xfff8e0 })); h.position.set(s * 0.95, 1.45, L / 2 + 0.02); g.add(h); }
          const lamp = new T.PointLight(0xfff2d0, 7, 16, 1.8); lamp.position.set(0, 1.6, L / 2 + 3.5); g.add(lamp);
        }
        if (i === 5) for (const s of [-1, 1]) { const r = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), new T.MeshBasicMaterial({ color: 0xff2a1a })); r.position.set(s * 0.95, 1.45, -L / 2 - 0.02); g.add(r); }
        k.add(g); cars.push(g);
      }
    }
    const loop = k.spline(Array.from({ length: 36 }, (_, i) => at(RT, (i / 36) * PI * 2, -0.9)), true);
    let trainIn = false;
    {
      const len = loop.getLength(), pos = new T.Vector3(), tan = new T.Vector3();
      let s = len * ((2 * PI + A0 - 0.3) / (2 * PI));
      const place = () => { cars.forEach((c, i) => { const u = ((((s - i * (L + 0.7)) % len) + len) % len) / len; loop.getPointAt(u, pos); loop.getTangentAt(u, tan); c.position.copy(pos); c.lookAt(tan.add(pos)); }); };
      const angOf = (p: T.Vector3) => Math.atan2(p.x, p.z - CZ);
      place();
      if (!ctx.reduced) k.ticks.push((_t, dt) => {
        const a = angOf(cars[0].position); trainIn = a > A0 - 0.3 && a < A1 + 0.45;
        s = (s + (trainIn ? 3.4 : 8.5) * Math.min(dt, 0.1)) % len;
        place();
      });
    }
    /* a rat on the track bed, the whole loop, all night */
    {
      const rat = new T.Group();
      const body = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), k.flat(0x3a3632, 0, 0.9)); body.scale.set(1, 0.8, 2.2); body.position.y = 0.08; rat.add(body);
      const tail = new T.Mesh(new T.CylinderGeometry(0.008, 0.018, 0.3, 5), k.flat(0x8a7a70, 0, 0.9)); tail.rotation.x = PI / 2; tail.position.set(0, 0.06, -0.32); rat.add(tail);
      k.add(rat);
      const ratLoop = k.spline(Array.from({ length: 36 }, (_, i) => at(RT - 1.25, (i / 36) * PI * 2 + 0.1, -1.05)), true);
      if (!ctx.reduced) k.rider(rat, ratLoop, 2.3, 40); else { ratLoop.getPointAt(0.05, rat.position); }
    }
    /* the tour group: about twenty on the platform round a guide; they turn to the train when it comes, and to you when you come close */
    {
      const rnd = X.mulberry(1651), pts: { x: number; z: number; a: number; yaw: number }[] = [];
      const gx = at(34.4, 0.42).x, gz = at(34.4, 0.42).z;
      for (let i = 0; i < 20; i++) { const a = 0.24 + rnd() * 0.36, r = 35.2 + rnd() * 2.2, p = at(r, a); pts.push({ x: p.x, z: p.z, a, yaw: Math.atan2(gx - p.x, gz - p.z) }); }
      pts.push({ x: gx, z: gz, a: 0.42, yaw: Math.atan2(pts[3].x - gx, pts[3].z - gz) });
      const N = pts.length, grp = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map(() => new T.Matrix4()));
      grp.frustumCulled = false;
      const c = new T.Color(), pal = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x8a2a2a, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0, 0xd8c04a, 0x2b5f6e];
      const hs = pts.map(() => 1.05 + rnd() * 0.16), cur = pts.map((p) => p.yaw);
      pts.forEach((_, i) => grp.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])));
      if (grp.instanceColor) grp.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), up = v(0, 1, 0), sc = new T.Vector3();
      const place = (dt: number) => {
        const cam = visitor();
        pts.forEach((p, i) => {
          let want = p.yaw;
          if (cam && Math.hypot(cam.x - p.x, cam.z - p.z) < 3.2) want = Math.atan2(cam.x - p.x, cam.z - p.z);
          else if (trainIn) want = p.a;
          let d = want - cur[i]; d = Math.atan2(Math.sin(d), Math.cos(d));
          cur[i] += d * Math.min(1, dt * 3);
          q.setFromAxisAngle(up, cur[i]); sc.set(1, hs[i], 1);
          m.compose(v(p.x, 0, p.z), q, sc); grp.setMatrixAt(i, m);
        });
        grp.instanceMatrix.needsUpdate = true;
      };
      place(1);
      if (!ctx.reduced) k.ticks.push((_t, dt) => place(dt));
      for (let i = 0; i < N; i += 3) k.keepOut.push({ x: pts[i].x, z: pts[i].z, r: 0.45 });
    }

    /* ---- the mezzanine: up sixteen steps through the arch, a vaulted room with the oak booth ---- */
    const MY = 2.4, MZ0 = -6.4, MZ1 = -18.4;
    { const N = 16; for (let i = 0; i < N; i++) { const z = -2.4 - ((i + 0.5) / N) * 4.0, y = MY * ((i + 1) / N); k.box(3.8, y, 4.0 / N + 0.02, 0, y / 2, z, i % 2 ? floorM : floorM2); } }
    for (const s of [-1, 1]) { k.box(0.3, 5.9, 4.4, s * 2.05, 2.95, -4.4, tileW); k.block(s > 0 ? 1.9 : -2.5, s > 0 ? 2.5 : -1.9, -6.6, -2.2); }
    k.box(4.4, 0.3, 4.4, 0, 5.75, -4.4, cream);
    k.box(14.6, 0.3, MZ0 - MZ1 + 0.4, 0, MY - 0.15, (MZ0 + MZ1) / 2, floorM2);
    wallZ(k, MZ1, MZ0, -7.2, 3.2, 0.3, tileW, [], MY); wallZ(k, MZ1, MZ0, 7.2, 3.2, 0.3, tileW, [], MY);
    wallX(k, -7.35, 7.35, MZ0, 3.2, 0.3, tileW, [{ c: 0, w: 3.8, h: 3.2 }], MY);
    wallX(k, -7.35, 7.35, MZ1, 3.0, 0.3, tileW, [{ c: 0, w: 4.0, h: 3.0 }], MY);
    for (const z of [MZ0, MZ1]) for (const s of [-1, 1]) k.box(4.6, 0.3, 0.3, s * 5.0, MY + 3.05, z, tan);
    {
      const g = new T.CylinderGeometry(7.35, 7.35, MZ0 - MZ1 + 0.3, 36, 1, true, -PI / 2, PI); g.rotateX(-PI / 2); g.scale(1, 2.6 / 7.35, 1);
      const a = g.attributes.uv as T.BufferAttribute; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * 6.2, a.getY(i) * 6.5);
      k.mesh(g, vaultM, 0, MY + 3.2, (MZ0 + MZ1) / 2);
      for (const z of [-8.4, -10.4, -12.4, -14.4, -16.4]) { const pts = Array.from({ length: 17 }, (_, i) => { const x = -7.2 + (14.4 * i) / 16; return v(x, MY + 3.2 + 2.5 * Math.sqrt(Math.max(0, 1 - (x / 7.35) ** 2)), z); }); k.curve(pts, 0.14, green, 32); }
      const sh = new T.Shape(); sh.absellipse(0, 0, 7.35, 2.6, 0, PI, false); sh.closePath();
      for (const z of [MZ0 - 0.16, MZ1 + 0.16]) k.mesh(new T.ShapeGeometry(sh, 24), cream, 0, MY + 3.2, z);
      const m = new T.MeshBasicMaterial({ map: leadedOval(1660), transparent: true, side: T.DoubleSide, alphaTest: 0.2 });
      const sg = new T.PlaneGeometry(4.0, 2.5); sg.rotateX(PI / 2);
      k.mesh(sg, m, 0, MY + 5.7, -12.4, true); skyMats.push(m); skyLights.push(k.point(0, MY + 4.6, -12.4, 0xf4ead8, 8, 12));
    }
    /* the oak ticket booth with brass grilles, a bench, and the lamps */
    k.box(2.4, 2.7, 2.4, 4.4, MY + 1.35, -12.2, oak); k.box(2.7, 0.2, 2.7, 4.4, MY + 2.8, -12.2, oakDark);
    for (const [x, z, ry] of [[3.15, -12.2, PI / 2], [4.4, -10.95, 0], [4.4, -13.45, PI]] as number[][]) {
      const w = k.box(1.2, 1.0, 0.04, x, MY + 1.75, z, glassDark); w.rotation.y = ry;
      for (let i = -3; i <= 3; i++) { const b = k.box(0.03, 1.0, 0.03, x + Math.cos(ry) * i * 0.16, MY + 1.75, z - Math.sin(ry) * i * 0.16, brass); b.rotation.y = ry; }
    }
    k.keepOut.push({ x: 4.4, z: -12.2, r: 1.85 });
    k.bench(-4.6, -12.2, PI / 2, oak, iron);
    for (const [x, z] of [[-3.5, -9.4], [-3.5, -15.4], [3.5, -9.4], [3.5, -15.4]]) { bulbs.push({ x, y: MY + 3.0, z }); k.cyl(0.02, 0.5, x, MY + 3.25, z, brass, 0.02, 6); }
    k.point(-2, MY + 3.2, -9.4, 0xffd8a0, 12, 14); k.point(2, MY + 3.2, -15.4, 0xffd8a0, 12, 14); k.point(0, 1.9, -4.4, 0xffd8a0, 8, 10);
    /* ---- the passage toward the park, and the stair up to the iron gate ---- */
    const PZ1 = -26.4, GZ = -32.8;
    k.box(4.6, 0.3, MZ1 - PZ1 + 0.3, 0, MY - 0.15, (MZ1 + PZ1) / 2, floorM2);
    wallZ(k, PZ1, MZ1, -2.0, 3.0, 0.3, tileW, [], MY); wallZ(k, PZ1, MZ1, 2.0, 3.0, 0.3, tileW, [], MY);
    k.box(4.6, 0.3, MZ1 - PZ1 + 0.3, 0, MY + 3.15, (MZ1 + PZ1) / 2, cream);
    for (const z of [-20.4, -24.4]) { bulbs.push({ x: 0, y: MY + 2.85, z }); k.point(0, MY + 2.6, z, 0xffd8a0, 7, 9); }
    { const N = 20; for (let i = 0; i < N; i++) { const z = PZ1 - ((i + 0.5) / N) * (PZ1 - GZ + 0.4), y = 3.0 * ((i + 1) / N); k.box(3.8, y, (PZ1 - GZ + 0.4) / N + 0.02, 0, MY + y / 2, z, i % 2 ? floorM : floorM2); } }
    wallZ(k, GZ - 0.6, PZ1, -2.0, 6.4, 0.3, tileW, [], MY); wallZ(k, GZ - 0.6, PZ1, 2.0, 6.4, 0.3, tileW, [], MY);
    { const len = Math.hypot(PZ1 - GZ + 0.6, 3.2), o = k.box(4.6, 0.3, len, 0, MY + 3.15 + 1.6, (PZ1 + GZ - 0.6) / 2, cream); o.rotation.x = Math.atan2(3.2, PZ1 - GZ + 0.6); }
    /* the gate: iron bars, closed, and the daylight of the park beyond it */
    for (let i = -9; i <= 9; i++) k.box(0.05, 3.0, 0.05, i * 0.2, MY + 3.0 + 1.5, GZ, iron);
    for (const y of [MY + 3.1, MY + 4.5, MY + 5.9]) k.box(3.9, 0.06, 0.06, 0, y, GZ, iron);
    k.box(0.2, 3.4, 0.3, -1.95, MY + 4.7, GZ, iron); k.box(0.2, 3.4, 0.3, 1.95, MY + 4.7, GZ, iron);
    const gateGlow = new T.MeshBasicMaterial({ color: 0xdfe8f0 });
    k.mesh(new T.PlaneGeometry(4.6, 3.8), gateGlow, 0, MY + 4.9, GZ - 0.9, true);
    k.box(4.6, 3.6, 0.2, 0, MY + 5.0, GZ - 1.2, k.flat(0x2a3a2a, 0, 1));
    const gateLight = k.point(0, MY + 5.2, GZ + 1.2, 0xdfe8ff, 10, 10);
    k.block(-2.3, 2.3, GZ - 1.4, GZ + 0.2);
    /* daylight by the clock: the skylights and the gate brighten by day and go to a dim glow at night */
    const setDay = (h: number) => { const d = daylight(h); for (const m of skyMats) m.color.setScalar(0.28 + 0.72 * d); for (const l of skyLights) l.intensity = 2.5 + 11 * d; gateGlow.color.setHex(0xdfe8f0).multiplyScalar(0.12 + 0.88 * d); gateLight.intensity = 1.5 + 12 * d; };
    setDay(hour0);
    if (!ctx.reduced) k.ticks.push((t) => setDay((hour0 + t / 3600) % 24));
    bulbsMesh(k, bulbs);

    /* ---- the works: the curved platform wall (its normal is the radius), the mezzanine, the passage ---- */
    for (const a of [-0.78, -0.58, -0.38, -0.18, 0.18, 0.38, 0.58, 0.78]) { const p = at(RPW + 0.16, a, 2.0); hang(mounts, p.x, p.y, p.z, a, 2.4, 1.7, st, 3.2); }
    for (const z of [-10, -14.6]) { hang(mounts, -7.03, MY + 1.8, z, PI / 2, 2.2, 1.6, st, 3.0); hang(mounts, 7.03, MY + 1.8, z, -PI / 2, 2.2, 1.6, st, 3.0); }
    for (const x of [-4.6, 4.6]) hang(mounts, x, MY + 1.7, MZ1 + 0.17, 0, 2.0, 1.5, st, 3.0);
    for (const z of [-20.6, -24.2]) { hang(mounts, -1.83, MY + 1.6, z, PI / 2, 1.6, 1.2, st, 3.0); hang(mounts, 1.83, MY + 1.6, z, -PI / 2, 1.6, 1.2, st, 3.0); }
    k.censusWall({ x: -4.5, y: MY + 1.6, z: MZ0 - 0.17, rotY: PI, cols: 8, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(250, 40), pieces: ctx.all, backing: tan });

    /* ---- what the station knows ---- */
    const src = { name: 'City Hall station (IRT Lexington Avenue Line), Wikipedia', url: 'https://en.wikipedia.org/wiki/City_Hall_station_(IRT_Lexington_Avenue_Line)' };
    k.egg(at(36, 0.06, 1.2), { id: 'cityhall-1904-1945', title: 'First in, first closed', year: '1904', text: 'The City Hall station opened on October 27, 1904 with the first subway, and its final day of service was December 31, 1945. The platform could not be lengthened for ten car trains, and the Brooklyn Bridge station was a short walk away. In its last year it counted 255,000 entries.', clue: 'Stand at the middle of the platform where the first riders stood, and ask why nobody boards here now.', source: src }, { r: 2.2 });
    k.egg(at(38, A0 + 6.5 * BA, SY + RV - 0.7), { id: 'cityhall-guastavino', title: 'Twelve vaults of tile', text: 'The ceiling is made of twelve Guastavino vaults, in the Romanesque Revival style. The main consulting architects for the station were Heins and LaFarge, who designed all the other stations of the first subway.', clue: 'Look up at the tile over your head and count the bays.', source: src }, { r: 2.0 });
    k.egg(at(38, A0 + 2.5 * BA, SY + RV - 0.3), { id: 'cityhall-skylights', title: 'A little of the park', text: 'Three of the vaults had leaded glass skylights, which opened upward to vault lights in City Hall Park.', clue: 'Find the glass in the ceiling and think about what is on the other side of it.', source: src }, { r: 1.6 });
    k.egg(at(38, A0 + 9.5 * BA, SY + RV - 1.3), { id: 'cityhall-chandeliers', title: 'Light from the centre of each vault', text: 'Additional lighting came from twelve chandeliers hung from the centre of the vaults, with floral motifs and nickel finishes.', clue: 'Stand under a chandelier near the far end of the platform.', source: src }, { r: 1.1 });
    k.egg(at(RT, -0.3, 0.6), { id: 'cityhall-loop', title: 'The loop the 6 still rides', text: 'The station has a single balloon loop track along a concave platform 240 feet long, on a curve with a radius of 147.25 feet, which left two foot gaps between the train doors and the platform. Passengers who stay on the 6 as it travels round the loop to head back uptown can still see the station go by.', clue: 'Look down at the track where it curves away into the dark.', source: src }, { r: 2.2 });
    k.egg(at(RTW - 0.3, 0.32, 1.9), { id: 'cityhall-plaques-landmark', title: 'Bronze on the trackside wall', year: '1979', text: 'On the trackside wall, facing the platform, are three bronze plaques designed by Gutzon Borglum. The city made the station a landmark in 1979 and it joined the National Register of Historic Places in 2004. By the mid 2000s the staff of the Transit Museum were again giving tours of the station, to museum members.', clue: 'Find the bronze across the track and ask who made it.', source: src }, { r: 1.2 });

    const floorY = (x: number, z: number) => {
      if (Math.abs(x) < 1.95 && z <= -2.4 && z > MZ0) return MY * clamp01((-2.4 - z) / 4.0);
      if (Math.abs(x) < 7.3 && z <= MZ0 && z > MZ1) return MY;
      if (Math.abs(x) < 2.1 && z <= MZ1 && z > PZ1) return MY;
      if (Math.abs(x) < 2.1 && z <= PZ1 && z > GZ - 1.5) return MY + 3.0 * clamp01((PZ1 - z) / (PZ1 - GZ + 0.4));
      return 0;
    };
    const sp = at(36, -0.55, 3), lk = at(37, 0.25, 3.3);
    return { mounts, spawn: sp, look: lk, eye: 3, floorY, bounds: [-33, 33, GZ - 0.4, 2.2], style: st };
  },
};

/* ================================================================== */
/* ---------------- 166 EIGHTY FEET UNDER LIBERTY STREET ---------------- */
export const goldvault: RoomDef = {
  id: 'goldvault',
  name: 'Eighty feet under Liberty Street',
  area: 'FEDERAL RESERVE GOLD VAULT / LIBERTY STREET',
  mood: 'Bedrock, steel, and a door that turns',
  color: '#c9a648',
  daylit: false,
  description: 'The Federal Reserve Bank of New York on Liberty Street, a Florentine palazzo of rusticated limestone and sandstone with wrought iron lanterns at its door, and the strangest basement in the city eighty feet below it, resting on the bedrock of Manhattan. You come in off the street through the banking hall, take the elevator down, and walk the corridor to a steel cylinder that turns to open the way into the cages of stacked bars. The New Yorkers hang in the hall, in the corridor and in the scale room, never on the cages.',
  signatures: 'The rusticated stone front with its round arched windows and iron grilles, Yellin\'s iron lanterns at the entrance, the banking hall with its stone piers and iron screen, the elevator that takes you down when you stand in it, the concrete corridor, the ninety ton steel cylinder turning in its frame, the scale room with its great balance, the cages of gold bars behind bars and mesh, the hand cart rolled through by two figures, and Liberty Street traffic with a steam stack outside.',
  build(k, ctx) {
    const VY = -24, LZ1 = -20.5, EZ0 = -23.6, EZ1 = -20.6, DZ = -36, HZ0 = -37, HZ1 = -62, EYE = 3;
    const hour0 = baseHour(k);
    k.sky({ top: 0x4f88d0, horizon: 0xd8e4ee, ground: 0x6a665e, fog: 0.0024, sun: { az: 2.4, el: 0.7, color: 0xfff4e0, size: 8 }, env: 0.6 });
    k.hemi(0xe8e4dc, 0x6a665e, 0.9);
    k.sun(0xfff0d8, 2.4, 30, 70, 40, true, 70);
    const lime = k.pbr('gvLime', X.ashlar(0xc9bfa6, 166, 6), 0.55, { normal: 0.5, roughness: 0.85 }),
      sand = k.pbr('gvSand', X.ashlar(0xb99f7c, 167, 6), 0.55, { normal: 0.5, roughness: 0.85 }),
      limeIn = k.pbr('gvLimeIn', X.ashlar(0xd8cfb8, 168, 5), 0.5, { normal: 0.3, roughness: 0.85 }),
      limeDark = k.flat(0x8a7f68, 0, 0.85), marble = k.pbr('gvMarble', X.marble(0xb4a68a, 0x7a6a50, 169), 0.3, { roughness: 0.4 }),
      iron = k.flat(0x1a1a1c, 0.6, 0.5), ironWarm = k.flat(0x2a2420, 0.5, 0.6), bronze = k.flat(0x7a5a34, 0.9, 0.4), brass = k.flat(0xc8a050, 1, 0.3),
      glassDark = k.flat(0x1e2830, 0.4, 0.2), glassSky = k.flat(0x9ab8d0, 0.6, 0.15),
      asph = k.pbr('gvAsph', X.asphalt(), 0.3), walk = k.pbr('gvWalk', X.pavers(0x9a968c, 170), 0.5), curb = k.flat(0x8a8680, 0, 0.8), line = k.flat(0xe8e4d8, 0, 0.8),
      concrete = k.pbr('gvConc', X.concrete(0x8c8a84, 171), 0.4, { roughness: 0.9 }), concDark = k.pbr('gvConc2', X.concrete(0x5e5c58, 172), 0.4, { roughness: 0.9 }),
      steel = k.flat(0x8a9098, 0.55, 0.55), steelDark = k.flat(0x5a6068, 0.5, 0.6), steelBrushed = k.flat(0xb0b6bc, 0.5, 0.5),
      gold = k.flat(0xe0b040, 0.85, 0.3, { envMapIntensity: 1.3, emissive: 0x4a3208, emissiveIntensity: 0.55 }), pale = k.flat(0xd8d4cc, 0, 0.9), cool = k.glow(0xdde8ff),
      offices = k.pbr('gvOff', X.windows(173, 0.25, 0x36404a, false), 0.28, { roughness: 0.6 });
    const bulbs: { x: number; y: number; z: number }[] = [];
    const mounts: Mount[] = [], st: FrameStyle = 'gilt';

    /* ---- Liberty Street: the pavement, the road, the far side, a steam stack, the towers behind ---- */
    k.box(90, 0.2, 4.6, 0, -0.1, 2.3, walk); k.box(90, 0.2, 9.4, 0, -0.14, 9.3, asph); k.box(90, 0.2, 4.6, 0, -0.1, 16.3, walk);
    for (const z of [4.6, 14.0]) k.box(90, 0.18, 0.25, 0, -0.02, z, curb);
    for (let x = -44; x < 44; x += 3.2) k.box(1.6, 0.012, 0.12, x, 0.005, 9.3, line);
    { const rnd = X.mulberry(1662); let x = -46; while (x < 46) { const w = 10 + rnd() * 8, h = 28 + rnd() * 34; k.box(w, h, 16, x + w / 2, h / 2, 26.6, offices); k.box(w + 0.4, 1.0, 16.4, x + w / 2, h + 0.4, 26.6, limeDark); x += w + 0.6; } }
    k.skyline({ z: 70, count: 26, spacing: 7, seed: 1663, base: 0, lit: 0.15, x: 0 });
    k.block(-46, 46, 18.4, 36);
    k.cyl(0.35, 3.6, 17, 1.8, 7.2, k.flat(0xe07a20, 0, 0.6), 0.35, 12); for (let i = 0; i < 4; i++) k.cyl(0.36, 0.3, 17, 0.5 + i * 0.9, 7.2, k.flat(0xf0f0f0, 0, 0.6), 0.36, 12);
    k.keepOut.push({ x: 17, z: 7.2, r: 0.8 });
    vapour(k, [v(17, 3.7, 7.2)], 18, { rise: 3.6, spread: 0.5, size: 0.2, opacity: 0.11, colour: 0xf2f2f2, seed: 1664, speed: 0.2, animate: !ctx.reduced });
    traffic(k, ctx, { lanes: [{ z: 6.8, dir: -1, n: 4, speed: 7 }, { z: 10.6, dir: -1, n: 3, speed: 8 }, { z: 13.0, dir: 0, n: 5 }], x0: -44, x1: 44, seed: 1665 });
    k.crowd([v(-40, 0, 2.6), v(40, 0, 2.6)], 8, { seed: 1666, spread: 1.4, animate: !ctx.reduced, speed: 1.0 });
    k.crowd([v(-40, 0, 16.2), v(40, 0, 16.2)], 7, { seed: 1667, spread: 1.4, animate: !ctx.reduced, speed: 1.1 });
    for (const x of [-16, 16]) k.lamp(x, 3.9, 6, iron, 0xffd7a0, 22);

    /* ---- the front: rusticated base, seven floors of windows, an arcade on top, the cornice ---- */
    const FW = 44, FH = 52;
    {
      const holes: Hole[] = [{ kind: 'arch', cx: 0, y0: 0, w: 3.6, h: 6.4 }];
      for (const cx of [-6, -12, -18, 6, 12, 18]) holes.push({ kind: 'arch', cx, y0: 1.2, w: 3.0, h: 6.0 });
      for (let f = 0; f < 7; f++) for (let c = -4.5; c <= 4.5; c += 1) holes.push({ kind: 'rect', cx: c * 4, y0: 11.4 + f * 3.9, w: 1.7, h: 2.6 });
      for (let c = -4.5; c <= 4.5; c += 1) holes.push({ kind: 'arch', cx: c * 4, y0: 40.6, w: 2.0, h: 4.0 });
      k.mesh(holedWall(FW, FH, 1.0, holes), lime, 0, 0, -0.5);
    }
    for (let y = 0.75; y < 10.2; y += 0.75) { k.box(FW, 0.05, 0.1, 0, y, 0.02, limeDark); if (Math.round(y / 0.75) % 2) k.box(FW, 0.62, 0.05, 0, y + 0.375, 0.02, sand); }
    k.box(FW + 0.4, 0.6, 0.7, 0, 10.5, 0.05, limeDark);
    k.box(FW + 0.4, 0.5, 0.6, 0, 38.9, 0.05, limeDark);
    k.box(FW + 1.2, 1.4, 1.8, 0, 52.6, -0.4, limeDark);
    for (let x = -FW / 2 + 1; x < FW / 2; x += 1.0) k.cyl(0.14, 1.0, x, 51.6, 0.1, lime, 0.18, 8);
    for (const x of [-22, 22]) { k.box(0.6, FH + 1.2, 30, x, (FH + 1.2) / 2, -14.5, lime); }
    for (const cx of [-6, -12, -18, 6, 12, 18]) {
      k.plane(3.0, 6.0, cx, 4.2, -0.2, glassSky);
      for (let i = -3; i <= 3; i++) k.box(0.05, 5.9, 0.06, cx + i * 0.42, 4.15, 0.02, iron);
      for (const y of [2.4, 4.0, 5.6]) k.box(2.9, 0.05, 0.06, cx, y, 0.03, iron);
      k.box(0.08, 0.5, 0.08, cx, 7.0, 0.04, iron); k.torus(0.32, 0.03, cx, 6.7, 0.04, iron, 20);
    }
    for (let f = 0; f < 7; f++) for (let c = -4.5; c <= 4.5; c += 1) k.plane(1.7, 2.6, c * 4, 12.7 + f * 3.9, -0.2, glassDark);
    for (let c = -4.5; c <= 4.5; c += 1) k.plane(2.0, 4.0, c * 4, 42.6, -0.2, glassDark);
    k.sign('FEDERAL RESERVE BANK OF NEW YORK', 19, 1.1, 0, 8.7, 0.56, 'transparent', '#1a1610', 54, 0);
    k.block(-FW / 2 - 1, -1.9, -1.2, 0.6); k.block(1.9, FW / 2 + 1, -1.2, 0.6);
    /* the entrance: two steps, bronze doors folded back, Yellin's iron lanterns either side */
    for (let s = 0; s < 2; s++) k.box(5.0 - s * 0.6, 0.15, 1.2 - s * 0.4, 0, 0.075 + s * 0.15, 1.0 - s * 0.2, limeDark);
    for (const s of [-1, 1]) { const d = k.box(0.1, 5.8, 1.7, s * 1.72, 2.9, -0.95, bronze); d.rotation.y = s * 0.1; }
    for (const s of [-1, 1]) {
      const x = s * 3.6, y = 5.2, z = 0.75;
      k.bar(v(x - s * 0.6, y - 0.9, 0.1), v(x, y - 0.5, z), 0.1, 0.16, iron);
      for (const dx of [-0.34, 0.34]) for (const dz of [-0.34, 0.34]) k.box(0.05, 1.5, 0.05, x + dx, y + 0.35, z + dz, iron);
      for (const yy of [y - 0.4, y + 1.1]) k.box(0.78, 0.06, 0.78, x, yy, z, iron);
      k.lathe([[0.42, 0], [0.3, 0.25], [0.1, 0.5], [0.03, 0.7]], x, y + 1.12, z, iron, 8);
      k.lathe([[0.36, 0], [0.42, -0.08], [0.1, -0.3]], x, y - 0.42, z, iron, 8);
      const core = k.mesh(new T.SphereGeometry(0.2, 12, 8), k.glow(0xffd8a0), x, y + 0.35, z, true); void core;
      k.point(x, y + 0.3, z + 0.3, 0xffd8a0, 16, 12);
    }

    /* ---- the banking hall: marble floor, stone walls and piers, the iron screen, the elevator at the back ---- */
    k.box(24, 0.1, LZ1 * -1 - 1, 0, 0, (LZ1 - 1) / 2, marble);
    k.box(6, 0.02, LZ1 * -1 - 1.2, 0, 0.06, (LZ1 - 1) / 2, k.flat(0x6a5a44, 0, 0.35));
    wallZ(k, LZ1, -1, -12, 8.5, 0.5, limeIn); wallZ(k, LZ1, -1, 12, 8.5, 0.5, limeIn);
    wallX(k, -12.25, 12.25, LZ1, 8.5, 0.5, limeIn, [{ c: 0, w: 3.1, h: 2.7 }]);
    k.box(24.6, 0.4, 20, 0, 8.7, (LZ1 - 1) / 2, limeIn);
    for (let z = -3; z > LZ1; z -= 3.2) k.box(24.6, 0.5, 0.4, 0, 8.25, z, limeDark);
    for (let x = -9.6; x <= 9.6; x += 4.8) k.box(0.4, 0.5, 20, x, 8.25, (LZ1 - 1) / 2, limeDark);
    for (const x of [-8.6, 8.6]) for (const z of [-5.5, -10.5, -15.5]) { k.column(x, 0, z, 8.5, 0.5, limeIn, false, limeDark); k.keepOut.push({ x, z, r: 0.85 }); k.box(0.1, 0.4, 0.2, x + (x > 0 ? -0.55 : 0.55), 3.6, z, iron); bulbs.push({ x: x + (x > 0 ? -0.75 : 0.75), y: 3.7, z }); }
    /* the iron screen across the hall with its gate folded open, tellers' stone counter behind it */
    {
      const bars: T.Matrix4[] = [];
      for (const s of [-1, 1]) for (let x = 1.9; x < 11.9; x += 0.18) bars.push(new T.Matrix4().makeTranslation(s * x, 1.7, -14));
      k.instances(new T.BoxGeometry(0.035, 3.4, 0.035), iron, bars);
      for (const s of [-1, 1]) { k.box(10.2, 0.08, 0.08, s * 6.9, 3.42, -14, iron); k.box(10.2, 0.06, 0.06, s * 6.9, 1.1, -14, iron); k.box(10.2, 0.14, 0.14, s * 6.9, 3.7, -14, ironWarm); for (let i = 0; i < 12; i++) k.torus(0.16, 0.02, s * (2.4 + i * 0.8), 3.2, -14, iron, 12); }
      for (const s of [-1, 1]) { const g = k.box(0.05, 3.2, 1.6, s * 1.75, 1.6, -14.8, iron); g.rotation.y = 0; k.block(s > 0 ? 1.6 : -1.9, s > 0 ? 1.9 : -1.6, -15.7, -13.9); }
      k.block(-12, -1.7, -14.3, -13.7); k.block(1.7, 12, -14.3, -13.7);
      for (const s of [-1, 1]) { k.box(8.0, 1.1, 0.8, s * 6.5, 0.55, -16.4, limeDark); k.box(8.2, 0.08, 1.0, s * 6.5, 1.12, -16.4, marble); k.block(s > 0 ? 2.3 : -10.8, s > 0 ? 10.8 : -2.3, -17.0, -15.8); }
    }
    for (const [x, z] of [[-4, -6], [4, -6], [-4, -11], [4, -11], [0, -17.5]]) { k.cyl(0.02, 2.4, x, 7.3, z, iron, 0.02, 5); k.lathe([[0.03, 0], [0.32, -0.2], [0.34, -0.6], [0.06, -0.8]], x, 6.1, z, iron, 8); bulbs.push({ x, y: 5.6, z }); k.point(x, 5.4, z, 0xffe0b8, 14, 16); }
    k.sign('GOLD VAULT', 2.2, 0.36, 0, 3.15, LZ1 + 0.28, 'transparent', '#3a3630', 96, 0);
    k.box(3.6, 0.3, 0.6, 0, 2.85, LZ1 + 0.1, bronze); for (const s of [-1, 1]) k.box(0.25, 2.7, 0.6, s * 1.68, 1.35, LZ1 + 0.1, bronze);
    k.crowd([v(-9, 0, -3), v(-4, 0, -9), v(3, 0, -12), v(8, 0, -4)], 6, { seed: 1668, spread: 1.2, animate: !ctx.reduced, speed: 0.8, colors: [0x1c1e24, 0x2a2e38, 0x1a1a1c, 0x3a3230, 0xe0dcd0, 0x2c3a4a] });
    still(k, [{ x: -7.4, y: 0, z: -15.3, ry: 0 }, { x: 5.2, y: 0, z: -15.3, ry: 0 }], 1669, [0xe8e4dc, 0x2a2e38]);

    /* ---- the shaft and the elevator: the cabin goes down when you stand in it, and comes back up ---- */
    k.box(3.8, 24.2, 0.5, 0, -12, LZ1, concDark);
    wallX(k, -2.6, 2.6, EZ0, 27.2, 0.5, concrete, [{ c: 0, w: 3.1, h: 2.7 }], VY);
    for (const s of [-1, 1]) { k.box(0.3, 27.4, 3.6, s * 1.8, -10.3, (EZ0 + EZ1) / 2, concDark); k.block(s > 0 ? 1.5 : -2.0, s > 0 ? 2.0 : -1.5, EZ0 - 0.2, EZ1 + 0.2); }
    k.box(3.8, 0.5, 3.6, 0, 3.4, (EZ0 + EZ1) / 2, concDark);
    for (let y = VY + 2; y < 3; y += 3) for (const s of [-1, 1]) k.box(0.04, 0.6, 0.12, s * 1.63, y, (EZ0 + EZ1) / 2, cool);
    const cab = new T.Group(); cab.position.set(0, 0, (EZ0 + EZ1) / 2); k.add(cab);
    {
      const fl = new T.Mesh(new T.BoxGeometry(3.0, 0.12, 3.0), steelDark); fl.position.y = -0.06; cab.add(fl);
      for (const s of [-1, 1]) { const w = new T.Mesh(new T.BoxGeometry(0.08, 2.6, 3.0), steelBrushed); w.position.set(s * 1.46, 1.3, 0); cab.add(w); const r = new T.Mesh(new T.BoxGeometry(0.05, 0.05, 2.6), brass); r.position.set(s * 1.38, 1.0, 0); cab.add(r); }
      const top = new T.Mesh(new T.BoxGeometry(3.0, 0.1, 3.0), steelDark); top.position.y = 2.65; cab.add(top);
      const lampP = new T.Mesh(new T.BoxGeometry(2.0, 0.03, 2.0), new T.MeshBasicMaterial({ color: 0xfff4e0 })); lampP.position.y = 2.59; cab.add(lampP);
      const pl = new T.PointLight(0xfff0d8, 10, 9, 1.8); pl.position.y = 2.2; cab.add(pl);
    }
    const lift = { y: 0, target: 0, moving: false, armed: true, dwell: 0 };
    const doorN = { x0: -1.6, x1: 1.6, z0: EZ1 - 0.45, z1: EZ1 + 0.05 }, doorS = { x0: -1.6, x1: 1.6, z0: EZ0 - 0.05, z1: EZ0 + 0.45 };
    k.blocks.push(doorS);
    const setDoors = () => {
      const up = Math.abs(lift.y) < 0.05, down = Math.abs(lift.y - VY) < 0.05;
      const has = (b: typeof doorN) => k.blocks.indexOf(b) >= 0;
      if (up) { if (has(doorN)) k.blocks.splice(k.blocks.indexOf(doorN), 1); } else if (!has(doorN)) k.blocks.push(doorN);
      if (down) { if (has(doorS)) k.blocks.splice(k.blocks.indexOf(doorS), 1); } else if (!has(doorS)) k.blocks.push(doorS);
    };
    if (!ctx.reduced) k.ticks.push((_t, dt) => {
      const cam = visitor();
      const inside = !!cam && Math.abs(cam.x) < 1.4 && cam.z > EZ0 + 0.2 && cam.z < EZ1 - 0.2;
      if (!lift.moving) {
        if (!inside) { lift.armed = true; lift.dwell = 0; }
        else if (lift.armed) { lift.dwell += dt; if (lift.dwell > 1.4) { lift.target = lift.y < -1 ? 0 : VY; lift.moving = true; lift.armed = false; } }
      } else {
        const d = lift.target - lift.y, sp = 3.2 * Math.min(1, 0.25 + Math.abs(d) / 6);
        lift.y += Math.sign(d) * Math.min(Math.abs(d), sp * Math.min(dt, 0.1));
        if (Math.abs(d) < 0.001) { lift.y = lift.target; lift.moving = false; }
      }
      cab.position.y = lift.y;
      /* the museum only re-reads floorY while the visitor walks, so a visitor standing still in the cabin rides it from here */
      if (inside && cam) cam.y = lift.y + EYE;
      setDoors();
    });

    /* ---- the corridor on bedrock, and the scale room off it ---- */
    k.box(4.4, 0.2, DZ * -1 + EZ0 + 1.2, 0, VY - 0.1, (EZ0 + DZ) / 2, concrete);
    wallZ(k, DZ + 0.6, EZ0, -2.0, 3.2, 0.4, concrete, [], VY);
    wallZ(k, DZ + 0.6, EZ0, 2.0, 3.2, 0.4, concrete, [{ c: -30, w: 1.6, h: 2.4 }], VY);
    k.box(4.8, 0.3, DZ * -1 + EZ0 + 1.2, 0, VY + 3.35, (EZ0 + DZ) / 2, concDark);
    for (const z of [-26, -29, -32, -35]) { k.box(0.16, 0.05, 1.3, 0, VY + 3.16, z, cool); if (z !== -29) k.point(0, VY + 2.9, z, 0xdde8ff, 9, 9); }
    for (let z = -25.5; z > DZ + 1; z -= 1.2) k.box(4.2, 0.04, 0.5, 0, VY + 0.005, z, k.flat(0x6e6c68, 0, 0.95));
    const SX0 = 2.2, SX1 = 8.4, SZ0 = -26.8, SZ1 = -33.2;
    k.box(SX1 - SX0, 0.2, SZ0 - SZ1, (SX0 + SX1) / 2, VY - 0.1, (SZ0 + SZ1) / 2, concrete);
    wallZ(k, SZ1, SZ0, SX1, 3.2, 0.4, concrete, [], VY);
    wallX(k, SX0, SX1 + 0.2, SZ0, 3.2, 0.4, concrete, [], VY); wallX(k, SX0, SX1 + 0.2, SZ1, 3.2, 0.4, concrete, [], VY);
    k.box(SX1 - SX0 + 0.4, 0.3, SZ0 - SZ1 + 0.4, (SX0 + SX1) / 2, VY + 3.35, (SZ0 + SZ1) / 2, concDark);
    k.box(0.16, 0.05, 1.3, 5.3, VY + 3.16, -30, cool); k.point(5.3, VY + 2.9, -30, 0xdde8ff, 10, 9);
    /* the great balance: a pedestal, a column, the beam, two pans on chains, a stack of bars on one of them */
    {
      const x = 6.8, z = -28.9;
      k.cyl(0.6, 0.3, x, VY + 0.15, z, steelDark, 0.7, 20); k.cyl(0.1, 2.4, x, VY + 1.5, z, steel, 0.1, 12);
      k.box(2.4, 0.09, 0.09, x, VY + 2.72, z, steel); k.cyl(0.32, 0.08, x, VY + 2.72, z, brass, 0.32, 24);
      k.torus(0.4, 0.03, x, VY + 2.2, z + 0.12, brass, 32); k.cyl(0.36, 0.02, x, VY + 2.2, z + 0.12, pale, 0.36, 24).rotation.x = PI / 2;
      for (const s of [-1, 1]) { for (const dz of [-0.25, 0.25]) k.cyl(0.01, 1.7, x + s * 1.15, VY + 1.85, z + dz, steel, 0.01, 4); k.cyl(0.44, 0.03, x + s * 1.15, VY + 1.0, z, brass, 0.44, 24); }
      const stack: T.BufferGeometry[] = []; for (let i = 0; i < 6; i++) stack.push(new T.BoxGeometry(0.18, 0.06, 0.08).translate(x - 1.15 + (i % 3 - 1) * 0.19, VY + 1.05 + Math.floor(i / 3) * 0.062, z));
      k.mesh(mergeGeometries(stack)!, gold, 0, 0, 0);
      k.keepOut.push({ x, z, r: 1.35 });
      k.box(1.4, 0.8, 0.7, 3.4, VY + 0.4, -32.4, steelDark); k.keepOut.push({ x: 3.4, z: -32.4, r: 0.9 });
    }

    /* ---- the vault door: a steel cylinder in its frame, turning to open the way, never on you ---- */
    k.mesh(holedWall(4.4, 3.4, 1.2, [{ kind: 'circle', cx: 0, cy: 1.7, r: 1.65 }]), steelDark, 0, VY, DZ);
    k.torus(1.74, 0.1, 0, VY + 1.7, DZ + 0.62, steel, 48); k.torus(1.74, 0.1, 0, VY + 1.7, DZ - 0.62, steel, 48);
    for (const s of [-1, 1]) { k.block(s > 0 ? 1.35 : -2.4, s > 0 ? 2.4 : -1.35, DZ - 0.8, DZ + 0.8); }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.cyl(0.05, 0.06, Math.cos(a) * 1.9, VY + 1.7 + Math.sin(a) * 1.9, DZ + 0.66, steel, 0.05, 8).rotation.x = PI / 2; }
    k.point(0, VY + 2.9, DZ + 2.6, 0xfff0e0, 4, 8); k.point(0, VY + 2.9, DZ - 2.4, 0xfff0e0, 4, 8);
    const door = new T.Group(); door.position.set(0, VY + 0.05, DZ); k.add(door);
    {
      const R = 1.55, H = 3.2, half = 0.8, t = Math.acos(half / R);
      for (const s of [-1, 1]) {
        const sh = new T.Shape(); const a0 = s > 0 ? -t : PI - t, a1 = s > 0 ? t : PI + t;
        sh.moveTo(R * Math.cos(a0), R * Math.sin(a0)); sh.absarc(0, 0, R, a0, a1, false); sh.lineTo(R * Math.cos(a1), R * Math.sin(a1)); sh.closePath();
        const g = new T.ExtrudeGeometry(sh, { depth: H, bevelEnabled: false, curveSegments: 24 }); g.rotateX(-PI / 2);
        const D = new T.Mesh(g, steel); door.add(D);
        const face = new T.Mesh(new T.BoxGeometry(0.03, H - 0.3, 2 * Math.sqrt(R * R - half * half) - 0.2), steelBrushed); face.position.set(s * (half + 0.02), H / 2, 0); door.add(face);
      }
      const cap = new T.Mesh(new T.CylinderGeometry(R + 0.02, R + 0.02, 0.12, 40), steelDark); cap.position.y = H + 0.06; door.add(cap);
    }
    const doorKeep: { x: number; z: number; r: number; lx: number; lz: number }[] = [];
    for (const sx of [-1.22, 1.22]) for (const lz of [-0.95, 0, 0.95]) { const o = { x: sx, z: DZ + lz, r: 0.72, lx: sx, lz }; doorKeep.push(o); k.keepOut.push(o); }
    const vault = { theta: 0, phase: 'open' as 'open' | 'closing' | 'closed' | 'opening', hold: 0, cartNear: false };
    const setDoor = (th: number) => { door.rotation.y = th; for (const o of doorKeep) { o.x = o.lx * Math.cos(th) + o.lz * Math.sin(th); o.z = DZ + (-o.lx * Math.sin(th) + o.lz * Math.cos(th)); } };
    setDoor(0);
    if (!ctx.reduced) k.ticks.push((_t, dt) => {
      /* it closes on its cycle unless someone is at the threshold or the cart is coming, and it opens again on its cycle or as you walk up to it */
      const cam = visitor(); const near = !!cam && Math.hypot(cam.x, cam.z - DZ) < 3.0 && Math.abs(cam.y - VY) < 6;
      vault.hold += dt;
      if (vault.phase === 'open') { if (vault.hold > 22 && !near && !vault.cartNear) { vault.phase = 'closing'; vault.hold = 0; } }
      else if (vault.phase === 'closing') { vault.theta = Math.min(PI / 2, vault.theta + dt * 0.32); if (vault.theta >= PI / 2) { vault.phase = 'closed'; vault.hold = 0; } if (near) { vault.phase = 'opening'; } }
      else if (vault.phase === 'closed') { if (vault.hold > 12 || near || vault.cartNear) { vault.phase = 'opening'; vault.hold = 0; } }
      else { vault.theta = Math.max(0, vault.theta - dt * 0.32); if (vault.theta <= 0) { vault.phase = 'open'; vault.hold = 0; } }
      setDoor(vault.theta);
    });
    /* a guard by the frame, still */
    still(k, [{ x: 1.55, y: VY, z: -34.6, ry: PI }], 1670, [0x2a2e38]);
    k.keepOut.push({ x: 1.55, z: -34.6, r: 0.4 });

    /* ---- the hall of cages: bars and mesh either side of the aisle, the stacked bars behind them ---- */
    const wire = new T.MeshStandardMaterial({ map: wireMesh(), transparent: true, alphaTest: 0.3, side: T.DoubleSide, roughness: 0.6, metalness: 0.5, color: 0xa0a4a8 });
    k.box(18.8, 0.2, HZ0 - HZ1 + 0.2, 0, VY - 0.1, (HZ0 + HZ1) / 2, concrete);
    k.box(4.4, 0.2, 1.4, 0, VY - 0.1, (DZ + HZ0) / 2 - 0.3, concrete);
    wallZ(k, HZ1, HZ0, -9.4, 3.6, 0.4, concrete, [], VY); wallZ(k, HZ1, HZ0, 9.4, 3.6, 0.4, concrete, [], VY);
    wallX(k, -9.6, 9.6, HZ0, 3.6, 0.4, concrete, [{ c: 0, w: 4.0, h: 3.4 }], VY); wallX(k, -9.6, 9.6, HZ1, 3.6, 0.4, concrete, [], VY);
    k.box(19.2, 0.3, HZ0 - HZ1 + 0.4, 0, VY + 3.75, (HZ0 + HZ1) / 2, concDark);
    for (let z = -39; z > HZ1; z -= 3) { k.box(0.16, 0.05, 1.6, 0, VY + 3.56, z, cool); if (Math.round(z) % 6 === 0 || z === -39) k.point(0, VY + 3.2, z, 0xdde8ff, 9, 10); }
    {
      const bars: T.Matrix4[] = [], goldAt: T.Matrix4[] = [], rnd = X.mulberry(1671);
      for (const s of [-1, 1]) {
        for (let z = HZ0 - 1; z > HZ1 + 0.6; z -= 0.16) bars.push(new T.Matrix4().makeTranslation(s * 1.95, VY + 1.7, z));
        k.box(0.06, 0.08, HZ0 - HZ1 - 1.4, s * 1.95, VY + 3.4, (HZ0 + HZ1) / 2 - 0.2, steelDark); k.box(0.06, 0.08, HZ0 - HZ1 - 1.4, s * 1.95, VY + 0.06, (HZ0 + HZ1) / 2 - 0.2, steelDark);
        k.plane(HZ0 - HZ1 - 1.4, 3.4, s * 1.98, VY + 1.7, (HZ0 + HZ1) / 2 - 0.2, wire, PI / 2);
        k.block(s > 0 ? 1.75 : -9.4, s > 0 ? 9.4 : -1.75, HZ1, HZ0 - 0.8);
        for (let c = 0; c < 8; c++) {
          const z0 = HZ0 - 1 - c * 2.9, zc = z0 - 1.45;
          k.plane(7.2, 3.4, s * 5.6, VY + 1.7, z0, wire, 0); k.box(0.06, 3.4, 0.06, s * 1.95, VY + 1.7, z0, steelDark);
          k.box(0.05, 3.4, 7.2, s * 9.15, VY + 1.7, zc, steelDark);
          for (let p = 0; p < 2; p++) {
            const px = s * (3.4 + p * 3.0), skip = rnd() < 0.18;
            k.box(2.4, 0.14, 1.2, px, VY + 0.07, zc, k.flat(0x6a5a44, 0, 0.9));
            if (skip) continue;
            const rows = 7 + Math.floor(rnd() * 5);
            for (let y = 0; y < rows; y++) for (let i = 0; i < 11; i++) for (let j = 0; j < 5; j++) {
              const alt = y % 2;
              goldAt.push(new T.Matrix4().compose(v(px - 1.05 + i * 0.2 + (alt ? 0.1 : 0) - (alt && i === 10 ? 0.2 : 0), VY + 0.17 + y * 0.064, zc - 0.44 + j * 0.2 + (alt ? 0.05 : 0)), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), alt ? 0 : 0.03), v(1, 1, 1)));
            }
          }
          k.keepOut.push({ x: s * 1.95, z: z0, r: 0.2 });
        }
      }
      const bm = k.instances(new T.BoxGeometry(0.035, 3.4, 0.035), steelDark, bars); bm.frustumCulled = false;
      k.instances(new T.BoxGeometry(0.18, 0.06, 0.08), gold, goldAt);
    }
    /* the cart: bars on a low steel truck, pulled by one figure and pushed by another, from the scale room to the far end and back */
    const cart = new T.Group(); k.add(cart);
    {
      const bed = new T.Mesh(new T.BoxGeometry(0.7, 0.08, 1.1), steelDark); bed.position.y = 0.32; cart.add(bed);
      for (const sx of [-0.32, 0.32]) for (const sz of [-0.4, 0.4]) { const w = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.06, 12), iron); w.rotation.z = PI / 2; w.position.set(sx, 0.14, sz); cart.add(w); }
      const hb = new T.Mesh(new T.BoxGeometry(0.03, 0.9, 0.03), steelDark); hb.position.set(0, 0.8, -0.55); cart.add(hb);
      const hd = new T.Mesh(new T.BoxGeometry(0.6, 0.03, 0.03), steelDark); hd.position.set(0, 1.25, -0.55); cart.add(hd);
      const bars: T.BufferGeometry[] = []; for (let y = 0; y < 3; y++) for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) bars.push(new T.BoxGeometry(0.18, 0.06, 0.08).translate(-0.2 + i * 0.2, 0.39 + y * 0.064, -0.36 + j * 0.24));
      cart.add(new T.Mesh(mergeGeometries(bars)!, gold));
      cart.add(new T.Mesh(standing(0, 1.15, 0), k.flat(0x2a2e38, 0, 0.9)), new T.Mesh(standing(0, -1.1, 0), k.flat(0x3a3230, 0, 0.9)));
      cart.position.set(0, VY, -30);
    }
    if (!ctx.reduced) {
      const run = { z: -30, dir: -1, pause: 0 };
      k.ticks.push((_t, dt) => {
        vault.cartNear = Math.abs(run.z - DZ) < 5.5;
        if (run.pause > 0) { run.pause -= dt; }
        else {
          const atDoor = Math.abs(run.z - DZ) < 4.2 && vault.theta > 0.03;
          if (!atDoor) run.z += run.dir * 0.85 * Math.min(dt, 0.1);
          if (run.z < HZ1 + 3.2) { run.dir = 1; run.pause = 3; } if (run.z > -26.6) { run.dir = -1; run.pause = 3; }
        }
        cart.position.z = run.z; cart.rotation.y = run.dir < 0 ? PI : 0;
      });
    }
    /* the lanterns and the hall lamps come up as the New York evening comes on */
    const lobbyLights: T.Light[] = [];
    {
      const setEve = (h: number) => { const n = 1 - daylight(h); for (const l of lobbyLights) l.intensity = 8 + 10 * n; };
      setEve(hour0);
      if (!ctx.reduced) k.ticks.push((t) => setEve((hour0 + t / 3600) % 24));
    }
    bulbsMesh(k, bulbs);

    /* ---- the works: the banking hall, the corridor, the scale room, never the cages ---- */
    for (const z of [-4.6, -9.2]) { hang(mounts, -11.72, 2.6, z, PI / 2, 2.4, 1.8, st); hang(mounts, 11.72, 2.6, z, -PI / 2, 2.4, 1.8, st); }
    for (const x of [-5.2, -9.2, 5.2, 9.2]) hang(mounts, x, 2.6, LZ1 + 0.27, 0, 2.0, 1.5, st, 3.0);
    for (const x of [-9, 9]) hang(mounts, x, 3.0, -1.0, PI, 2.2, 1.6, st, 3.2);
    for (const z of [-27.4, -33.4]) { hang(mounts, -1.78, VY + 1.6, z, PI / 2, 1.5, 1.15, st, 3.0); hang(mounts, 1.78, VY + 1.6, z, -PI / 2, 1.5, 1.15, st, 3.0); }
    hang(mounts, SX1 - 0.22, VY + 1.6, -31.6, -PI / 2, 1.8, 1.35, st, 3.0);
    hang(mounts, 4.2, VY + 1.6, SZ1 + 0.22, 0, 1.8, 1.35, st, 3.0);
    k.censusWall({ x: -11.72, y: 2.4, z: -15.2, rotY: PI / 2, cols: 10, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(350, 50), pieces: ctx.all, backing: limeDark });

    /* ---- what the bank knows ---- */
    const bank = { name: 'The Gold Vault, Federal Reserve Bank of New York', url: 'https://www.newyorkfed.org/aboutthefed/goldvault.html' };
    const wiki = { name: 'Federal Reserve Bank of New York Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Federal_Reserve_Bank_of_New_York_Building' };
    k.egg(v(0, 7.2, 0.6), { id: 'goldvault-palazzo', title: 'A palazzo on Liberty Street', year: '1924', text: 'The building was designed by York and Sawyer and erected from 1919 to 1924, with an eastward extension in 1935. Its front of limestone and sandstone is cladding over a steel frame, in the manner of early Italian Renaissance palaces such as the Palazzo Strozzi and the Palazzo Vecchio in Florence. It has fourteen storeys above ground and five basement levels, fills the block between Liberty, William and Nassau Streets and Maiden Lane, and joined the National Register of Historic Places in 1980.', clue: 'Stand back on the pavement and look up at the whole stone front.', source: wiki }, { r: 2.4 });
    k.egg(v(3.6, 5.5, 0.75), { id: 'goldvault-yellin', title: 'Two hundred tons of iron', text: 'The facade and interior carry ironwork made by Samuel Yellin of Philadelphia. The iron decorations weigh a collective 200 short tons.', clue: 'The lantern by the door was made by hand. Look at it closely.', source: wiki }, { r: 1.2 });
    k.egg(v(0, 1.6, (EZ0 + EZ1) / 2), { id: 'goldvault-depth', title: 'Eighty feet down, on bedrock', text: 'The vault sits on the bedrock of Manhattan, 80 feet below street level and 50 feet below sea level. It was built during the construction of the building in the early 1920s.', clue: 'Step into the elevator and wait.', source: bank }, { r: 1.5 });
    k.egg(v(0, VY + 1.7, DZ), { id: 'goldvault-cylinder', title: 'The door that turns', text: 'The only way in is through a 90 ton steel cylinder set in a 140 ton steel and concrete frame. The cylinder turns to open a passage through it, and when it is closed the vault is sealed airtight.', clue: 'Wait at the end of the corridor for the steel to turn.', source: bank }, { r: 2.0 });
    k.egg(v(2.6, VY + 1.5, -46), { id: 'goldvault-compartments', title: 'One hundred and twenty two compartments', year: '1973', text: 'Bars are moved into one of the vault\'s 122 compartments. In 2024 the vault housed approximately 507,000 gold bars, about 6,331 metric tons. The holdings peaked in 1973, when the vault held over 12,000 tons.', clue: 'Walk the aisle between the cages and look through the mesh.', source: bank }, { r: 2.2 });
    k.egg(v(6.8, VY + 2.0, -28.9), { id: 'goldvault-scale', title: 'Weighed to a hundredth of an ounce', text: 'Each gold bar weighs approximately 27 pounds. The vault\'s scale can weigh up to 640 pounds and down to as little as one hundredth of an ounce.', clue: 'Find the balance in the little room off the corridor.', source: bank }, { r: 1.5 });

    const floorY = (x: number, z: number) => {
      if (Math.abs(x) < 1.55 && z > EZ0 - 0.1 && z < EZ1 + 0.1) return lift.y;
      if (z <= EZ0 - 0.1) return VY;
      return 0;
    };
    return { mounts, spawn: v(-3, EYE, 15.2), look: v(0.5, 9, -0.5), eye: EYE, floorY, bounds: [-16, 16, HZ1 + 0.3, 17.6], style: st };
  },
};
