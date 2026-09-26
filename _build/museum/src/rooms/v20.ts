/* 175 and 176: two places that move. Astor Place, where Tony Rosenthal's Alamo turns on its corner
   when a visitor walks up and pushes it, with the 1986 kiosk beside it, Cooper Union's Foundation
   Building across Cooper Square and the slotted steel skin of 41 Cooper Square beyond; and the Queens
   Night Market on a Saturday night in Flushing Meadows, a hundred white tents in three lanes under
   string lights, grills smoking, a band on the stage, the Hall of Science's wall of cobalt glass behind
   and the Unisphere lit far off. Helpers are copied from v14 and v3, nothing there is exported.
   Rules kept: no lettered text beyond public signage, no business names, no likeness of anyone. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];

/* ---------------- helpers (v14, v3), with an axis option on traffic and houses ---------------- */
/* the museum camera, read at tick time; undefined under node (audit and check scripts) */
const cam = (): T.Camera | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { __museum?: { camera?: T.Camera } }).__museum?.camera);
function figureGeo(r = 0.2, len = 0.82, headY = 1.35, seg = 8) {
  const body = new T.CapsuleGeometry(r, len, seg > 6 ? 3 : 2, seg); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, seg + 2, Math.max(5, seg - 2)); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
/* a wall with arched, round, square or polygonal openings, one extrusion, centred on x, base at y 0 */
type Hole = { kind: 'arch'; cx: number; y0: number; w: number; h: number } | { kind: 'circle'; cx: number; cy: number; r: number } | { kind: 'rect'; cx: number; y0: number; w: number; h: number } | { kind: 'poly'; pts: [number, number][] };
function holedWall(w: number, h: number, depth: number, holes: Hole[]) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new T.Path();
    if (o.kind === 'circle') p.absarc(o.cx, o.cy, o.r, 0, PI * 2, false);
    else if (o.kind === 'rect') { p.moveTo(o.cx - o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0 + o.h); p.lineTo(o.cx - o.w / 2, o.y0 + o.h); p.closePath(); }
    else if (o.kind === 'poly') { p.moveTo(o.pts[0][0], o.pts[0][1]); for (const q of o.pts.slice(1)) p.lineTo(q[0], q[1]); p.closePath(); }
    else { const a = o.w / 2, cy = o.y0 + o.h - a; p.moveTo(o.cx - a, o.y0); p.lineTo(o.cx - a, cy); p.absarc(o.cx, cy, a, PI, 0, true); p.lineTo(o.cx + a, o.y0); p.closePath(); }
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 16 });
  g.translate(0, 0, -depth / 2);
  return g;
}
/* a mount on a wall: rotation r faces the normal (sin r, 0, cos r); the target is d metres out */
function hang(ms: Mount[], x: number, y: number, z: number, r: number, w: number, h: number, style: FrameStyle, d = 3.2) {
  ms.push({ position: v(x, y, z), rotation: r, target: v(x + Math.sin(r) * d, y, z + Math.cos(r) * d), width: w, height: h, style, wash: true });
}
/* a freestanding board on two posts, facing +z */
function board(k: K, ms: Mount[], x: number, y0: number, z: number, w: number, h: number, style: FrameStyle, back: T.Material, post: T.Material) {
  const cy = y0 + 0.75 + h / 2 + 0.15;
  k.box(w + 0.3, h + 0.3, 0.12, x, cy, z, back);
  for (const s of [-1, 1]) { k.box(0.1, cy + h / 2, 0.1, x + s * (w / 2 + 0.05), y0 + (cy + h / 2 - y0) / 2, z - 0.1, post); k.box(0.5, 0.06, 0.5, x + s * (w / 2 + 0.05), y0 + 0.03, z - 0.1, post); }
  k.keepOut.push({ x, z: z - 0.1, r: 0.6 }, { x: x - w / 2, z: z - 0.1, r: 0.45 }, { x: x + w / 2, z: z - 0.1, r: 0.45 });
  hang(ms, x, cy, z + 0.08, 0, w, h, style, 3.2);
}
/* a park bench built from boxes so it batches with everything else (k.bench costs 23 draw calls) */
function benchB(k: K, x: number, z: number, rotY: number, slats: T.Material, frame: T.Material, len = 2.2) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const put = (w: number, h: number, d: number, px: number, py: number, pz: number, m: T.Material) => { const o = k.box(w, h, d, x + px * c + pz * s, py, z - px * s + pz * c, m); o.rotation.y = rotY; };
  for (let j = 0; j < 4; j++) put(0.12, 0.05, len, j * 0.15 - 0.22, 0.62, 0, slats);
  for (let j = 0; j < 3; j++) put(0.05, 0.13, len, 0.42 + j * 0.02, 0.85 + j * 0.15, 0, slats);
  for (const dz of [-len / 2 + 0.2, len / 2 - 0.2]) { put(0.72, 0.06, 0.07, 0.05, 0.6, dz, frame); put(0.06, 0.6, 0.07, -0.28, 0.3, dz, frame); put(0.06, 0.6, 0.07, 0.38, 0.3, dz, frame); put(0.06, 0.65, 0.07, 0.46, 0.95, dz, frame); }
  k.keepOut.push({ x, z, r: 0.9 });
}
/* cars and buses on a street along x or along z: instanced bodies, cabins and wheels; dir 0 is parked */
type Lane = { at: number; dir: number; n: number; speed?: number; bus?: boolean };
type Car = { s: number; at: number; dir: number; v: number; len: number };
function traffic(k: K, ctx: C, p: { along: 'x' | 'z'; lanes: Lane[]; s0: number; s1: number; seed: number; y?: number }) {
  const { along, lanes, s0, s1, seed, y = 0 } = p, rnd = X.mulberry(seed), span = s1 - s0;
  const cars: Car[] = [], buses: Car[] = [];
  for (const l of lanes) for (let i = 0; i < l.n; i++) {
    const a: Car = { s: s0 + ((i + rnd() * 0.5) / l.n) * span, at: l.at, dir: l.dir, v: l.dir === 0 ? 0 : (l.speed ?? 8) * (0.8 + rnd() * 0.35), len: l.bus ? 12 : 4.2 + rnd() * 0.8 };
    (l.bus ? buses : cars).push(a);
  }
  const prof = (pts: number[][], depth: number) => { const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) sh.lineTo(q[0], q[1]); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g; };
  const heading = (dir: number) => (along === 'x' ? (dir < 0 ? PI : 0) : dir > 0 ? -PI / 2 : PI / 2);
  const at = (pos: T.Vector3, s: number, a: number, yy: number) => (along === 'x' ? pos.set(s, yy, a) : pos.set(a, yy, s));
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0), c = new T.Color();
  const mk = (g: T.BufferGeometry, mat: T.Material, n: number) => { const o = k.instances(g, mat, Array.from({ length: n }, () => new T.Matrix4())); o.frustumCulled = false; return o; };
  const wheelG = new T.CylinderGeometry(0.34, 0.34, 1.9, 10).rotateX(PI / 2), wheelM = new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
  const sets: { list: Car[]; parts: { o: T.InstancedMesh; dy: number; per: number }[]; wheel: T.InstancedMesh; wy: number }[] = [];
  if (cars.length) {
    const body = mk(prof([[-0.5, 0.28], [0.5, 0.28], [0.5, 0.62], [0.47, 0.76], [0.22, 0.84], [-0.3, 0.86], [-0.48, 0.8], [-0.5, 0.64]], 1.8), new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }), cars.length);
    const cab = mk(prof([[-0.3, 0.84], [0.2, 0.84], [0.06, 1.34], [-0.24, 1.34]], 1.66), new T.MeshStandardMaterial({ color: 0x1a2026, roughness: 0.15, metalness: 0.7 }), cars.length);
    const pal = [0xf2c318, 0xf2c318, 0x1c1e22, 0xe8e8ea, 0x6a7078, 0x2a3a5a, 0x7a1e22, 0xb8bcc2, 0x1a3a2a, 0xf2c318];
    cars.forEach((_, i) => body.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])));
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    sets.push({ list: cars, parts: [{ o: body, dy: 0, per: 1 }, { o: cab, dy: 0, per: 1 }], wheel: mk(wheelG, wheelM, cars.length * 2), wy: 0.34 });
  }
  if (buses.length) {
    const bodyG = new T.BoxGeometry(1, 2.7, 2.55); bodyG.translate(0, 0.5 + 1.35, 0);
    const bandG = new T.BoxGeometry(1.002, 1.1, 2.58); bandG.translate(0, 2.35, 0);
    const stripeG = new T.BoxGeometry(1.002, 0.3, 2.58); stripeG.translate(0, 1.35, 0);
    const body = mk(bodyG, new T.MeshStandardMaterial({ color: 0xe4e8ec, roughness: 0.4, metalness: 0.3 }), buses.length);
    const band = mk(bandG, new T.MeshStandardMaterial({ color: 0x141a20, roughness: 0.15, metalness: 0.6 }), buses.length);
    const stripe = mk(stripeG, new T.MeshStandardMaterial({ color: 0x1f4fa0, roughness: 0.4 }), buses.length);
    sets.push({ list: buses, parts: [{ o: body, dy: 0, per: 1 }, { o: band, dy: 0, per: 1 }, { o: stripe, dy: 0, per: 1 }], wheel: mk(wheelG, wheelM, buses.length * 2), wy: 0.34 });
  }
  const place = (dt: number) => {
    for (const set of sets) {
      set.list.forEach((a, i) => {
        a.s += a.v * a.dir * Math.min(dt, 0.1);
        if (a.s > s1) a.s -= span; if (a.s < s0) a.s += span;
        q.setFromAxisAngle(up, heading(a.dir));
        at(pos, a.s, a.at, y); sc.set(a.len, 1, 1); m.compose(pos, q, sc);
        for (const pt of set.parts) pt.o.setMatrixAt(i, m);
        for (const s of [-1, 1]) { at(pos, a.s + s * a.len * 0.32, a.at, y + set.wy); sc.set(1, 1, 1); m.compose(pos, q, sc); set.wheel.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), m); }
      });
      for (const pt of set.parts) pt.o.instanceMatrix.needsUpdate = true;
      set.wheel.instanceMatrix.needsUpdate = true;
    }
  };
  place(0);
  if (!ctx.reduced) k.ticks.push((_t, dt) => place(dt));
}
/* a row of New York house fronts along x (line is z) or along z (line is x); facing is the front normal's sign */
function houses(k: K, u0: number, u1: number, line: number, facing: number, seed: number, p: { hMin?: number; hMax?: number; depth?: number; along?: 'x' | 'z' } = {}) {
  const { hMin = 14, hMax = 20, depth = 12, along = 'x' } = p, rnd = X.mulberry(seed);
  const mats = [k.pbr('hsBrown' + seed, X.ashlar(0x6e4c3c, seed + 1, 6), 0.4, { normal: 0.4 }), k.pbr('hsBrick' + seed, X.brick(0x7a4032, seed + 2), 0.9), k.pbr('hsLime' + seed, X.ashlar(0xcdbfa4, seed + 3, 5), 0.35, { normal: 0.4 }), k.pbr('hsBrick2' + seed, X.brick(0x9a6a4e, seed + 4), 0.9)];
  const win = k.flat(0x1a2128, 0.6, 0.18), trim = k.flat(0xe8e2d4, 0, 0.6), corn = k.flat(0x4a4038, 0.2, 0.6), door = k.flat(0x2a1c14, 0, 0.5);
  const put = (wu: number, h: number, wn: number, u: number, y: number, n: number, m: T.Material) => (along === 'x' ? k.box(wu, h, wn, u, y, n, m) : k.box(wn, h, wu, n, y, u, m));
  let u = u0;
  while (u < u1 - 3) {
    const w = Math.min(u1 - u, 6 + Math.floor(rnd() * 3)), h = hMin + rnd() * (hMax - hMin), m = mats[Math.floor(rnd() * mats.length)], cu = u + w / 2;
    put(w, h, depth, cu, h / 2, line - facing * depth / 2, m);
    const floors = Math.floor((h - 1.5) / 3.3), cols = w > 7 ? 3 : 2;
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      const wu = u + ((c + 0.5) / cols) * w, wy = 2.4 + f * 3.3 + (f > 0 ? 0.6 : 0);
      if (f === 0 && c === 0) { put(1.3, 2.6, 0.1, wu, 1.3 + 0.9, line + facing * 0.02, door); for (let s = 0; s < 5; s++) put(1.8, 0.18, 0.36, wu, 0.09 + s * 0.18, line + facing * (0.18 + (4 - s) * 0.36), m); continue; }
      put(1.15, 1.9, 0.08, wu, wy, line + facing * 0.03, win);
      put(1.35, 0.14, 0.2, wu, wy + 1.02, line + facing * 0.08, trim);
    }
    put(w, 0.5, 0.7, cu, h - 0.25, line + facing * 0.3, corn);
    u += w;
  }
}
/* people standing still: one instanced figure each; low = fewer segments for a crowd of hundreds */
function still(k: K, pts: { x: number; y: number; z: number; ry: number; sit?: boolean }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0], low = false) {
  if (!pts.length) return null;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12, low ? 6 : 8), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y + (p.sit ? 0.12 : 0), p.z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), p.ry), v(1, p.sit ? 0.82 : 1.1 + rnd() * 0.12, 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
  return o;
}
/* translucent puffs that rise, spread and fade: steam, smoke */
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
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/* ================================================================== */
/* ---------------- 175 ASTOR PLACE ---------------- */
export const astorplace: RoomDef = {
  id: 'astorplace',
  name: 'The cube at Astor Place',
  area: 'ASTOR PLACE / COOPER SQUARE',
  mood: 'Push it and it turns',
  color: '#3a3a3c',
  daylit: true,
  description: 'Astor Place, where the East Village meets NoHo: Tony Rosenthal\'s black steel cube balanced on one corner in the middle of the plaza, the cast iron subway kiosk beside it, Cooper Union\'s brownstone Foundation Building across Cooper Square and the slotted steel skin of 41 Cooper Square beyond, skaters going round, students crossing, buses on Fourth Avenue. Walk up to the cube and lean on it: it turns, and slowly comes to rest. The New Yorkers hang under the Foundation Building\'s arcade, on the plaza face of 41 Cooper Square, in the theatre\'s poster cases on Lafayette Street and on boards round the plaza.',
  signatures: 'The Alamo (1967), fifteen feet of Cor-Ten steel on one corner, the 1986 replica IRT kiosk in cast iron and glass, the Foundation Building (1859) with its round arched arcade and five brownstone storeys, 41 Cooper Square (2009) with the slot cut up through its perforated skin, the black glass of 51 Astor Place, the colonnade and the theatre on Lafayette Street, the skaters, the students and the buses.',
  build(k, ctx) {
    k.sky({ top: 0x4f88d0, horizon: 0xd8e4ee, ground: 0x6a6a68, fog: 0.0024, sun: { az: 2.4, el: 0.7, color: 0xfff4e0, size: 8 }, env: 0.6 });
    k.hemi(0xe8ecf2, 0x6a6a68, 0.95);
    k.sun(0xfff0d8, 2.4, -30, 70, -20, true, 90);
    const pave = k.pbr('apPave', X.pavers(0x8e8b84, 175), 0.5), asph = k.pbr('apAsph', X.asphalt(), 0.3), walk = k.pbr('apWalk', X.concrete(0x9c9a92, 176), 0.5),
      curb = k.flat(0x8a8680, 0, 0.8), lineM = k.flat(0xe8e4d8, 0, 0.8), corten = k.flat(0x16171a, 0.55, 0.48), granite = k.pbr('apGran', X.ashlar(0x3a3a3e, 177, 6), 0.6),
      brown = k.pbr('apBrown', X.ashlar(0x6a4a3a, 178, 6), 0.4, { normal: 0.4 }), brownDark = k.flat(0x44302a, 0.1, 0.7), win = k.flat(0x1a2128, 0.6, 0.18),
      iron = k.flat(0x1e2a22, 0.6, 0.45), glassM = k.glass(0xb9dde8, 0.25), marble = k.pbr('apMarb', X.ashlar(0xcdc7b8, 180, 5), 0.35, { normal: 0.3 }),
      black = k.flat(0x101214, 0.2, 0.6), steel = k.flat(0x9aa4ae, 0.8, 0.35), wood = k.flat(0x5a4030, 0, 0.7), green = k.flat(0x0b6b3a, 0.1, 0.6),
      darkGlass = k.pbr('apGlass', X.windows(179, 0.25, 0x1c2433, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.5, stretch: 0.42 });
    const mounts: Mount[] = [];

    /* ---- ground: asphalt everywhere, then the plaza, the sidewalks and the curbs on top ---- */
    k.box(150, 0.2, 170, 4, -0.14, 20, asph);
    k.box(17, 0.12, 68, 0.5, -0.04, 26, pave);                 /* the plaza, x -8 to 9, z -8 to 60 */
    k.box(6, 0.12, 68, -17, -0.04, 26, walk);                  /* west sidewalk of Lafayette */
    k.box(2.5, 0.12, 32, 16.75, -0.04, 8, walk);               /* east sidewalk of Cooper Square */
    k.box(6.5, 0.12, 28, 18.75, -0.04, 44, pave);              /* the plaza in front of 41 Cooper */
    k.box(95, 0.12, 2, 1.5, -0.04, -15, walk);                 /* north sidewalk of Astor Place */
    for (const [w, d, x, z] of [[0.25, 68, -8.1, 26], [0.25, 68, 9.1, 26], [0.25, 68, -13.9, 26], [0.25, 32, 15.4, 8], [0.25, 28, 15.4, 44], [95, 0.25, 1.5, -14.1]] as number[][]) k.box(w, 0.14, d, x, -0.03, z, curb);
    for (let z = -6; z < 60; z += 3.2) { k.box(0.12, 0.012, 1.6, -11, 0.0, z, lineM); k.box(0.12, 0.012, 1.6, 12.3, 0.0, z, lineM); }
    for (let x = -44; x < 48; x += 3.2) k.box(1.6, 0.012, 0.12, x, 0.0, -11, lineM);

    /* ---- the cube: 4.6 m of Cor-Ten on its corner, on a hidden pole, and it turns when pushed ---- */
    const CX = 0, CZ = 0, BASE = 0.9, EDGE = 4.6;
    k.cyl(1.5, 0.5, CX, 0.25, CZ, granite, 1.5, 28); k.cyl(1.0, 0.4, CX, 0.7, CZ, granite, 1.0, 24); k.cyl(0.16, 0.5, CX, 0.95, CZ, black, 0.16, 8);
    const rig = new T.Group(); rig.position.set(CX, BASE + (EDGE * Math.sqrt(3)) / 2, CZ);
    const cube = new T.Mesh(new T.BoxGeometry(EDGE, EDGE, EDGE), corten);
    cube.quaternion.setFromUnitVectors(v(1, 1, 1).normalize(), v(0, 1, 0));
    cube.castShadow = ctx.quality === 'high';
    rig.add(cube);
    /* the faces carry a shallow inset panel each, as the real cube does */
    const inset = k.flat(0x0e0f11, 0.5, 0.5);
    for (const n of [v(1, 0, 0), v(-1, 0, 0), v(0, 1, 0), v(0, -1, 0), v(0, 0, 1), v(0, 0, -1)]) {
      const p = new T.Mesh(new T.BoxGeometry(3.0, 3.0, 0.06), inset);
      p.position.copy(n).multiplyScalar(EDGE / 2 + 0.02); p.quaternion.setFromUnitVectors(v(0, 0, 1), n); cube.add(p);
    }
    k.add(rig);
    k.keepOut.push({ x: CX, z: CZ, r: 1.9 });
    let omega = 0.35, cool = 0;
    const dir = new T.Vector3();
    if (!ctx.reduced) k.ticks.push((_t, dt) => {
      const c = cam();
      if (c) {
        const dx = c.position.x - CX, dz = c.position.z - CZ;
        if (Math.hypot(dx, dz) < 2.2 && cool <= 0) {
          c.getWorldDirection(dir);
          const torque = dx * dir.z - dz * dir.x;                 /* the side you lean on is the side that goes */
          omega = clamp(omega + (torque >= 0 ? 0.7 : -0.7), -1.8, 1.8);
          cool = 0.7;
        }
      }
      cool -= dt;
      omega *= Math.exp(-dt * 0.28);                              /* a push lasts several seconds */
      if (Math.abs(omega) < 0.003) omega = 0;
      rig.rotation.y += omega * dt;
    });

    /* ---- the kiosk: cast iron and glass, 4 m by 6.7 m, 4.9 m to the finial, the lamp on top ---- */
    const KX = 6, KZ = -3, KW = 4.0, KL = 6.7;
    k.box(KW + 0.5, 0.12, KL + 0.5, KX, 0.06, KZ, granite);
    k.box(KW - 0.5, 0.06, KL - 0.5, KX, 0.14, KZ, black);
    for (const sx of [-1, 0, 1]) for (const sz of [-1, 0, 1]) if (sx || sz) k.box(0.16, 3.1, 0.16, KX + sx * (KW / 2 - 0.08), 1.55, KZ + sz * (KL / 2 - 0.08), iron);
    for (const sx of [-1, 1]) { k.box(0.08, 0.9, KL, KX + sx * (KW / 2), 0.57, KZ, iron); k.plane(KL, 1.9, KX + sx * (KW / 2), 2.05, KZ, glassM, sx * PI / 2); for (let i = -2; i <= 2; i++) k.box(0.05, 1.9, 0.05, KX + sx * (KW / 2), 2.05, KZ + i * 1.34, iron); }
    k.box(KW, 0.9, 0.08, KX, 0.57, KZ - KL / 2, iron); k.plane(KW, 1.9, KX, 2.05, KZ - KL / 2, glassM, PI);
    k.plane(KW, 0.9, KX, 2.55, KZ + KL / 2, glassM, 0);
    k.box(KW + 0.6, 0.36, KL + 0.6, KX, 3.28, KZ, iron);
    { const roof = k.lathe([[3.6, 0], [3.45, 0.3], [2.75, 0.7], [1.85, 1.05], [1.05, 1.35], [0.5, 1.55], [0.2, 1.7], [0.0, 1.72]], KX, 3.46, KZ, iron, 28); roof.scale.set(KW / 6.9, 1, KL / 6.9); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(0.05, 0.5, KX + sx * (KW / 2 + 0.2), 3.7, KZ + sz * (KL / 2 + 0.2), iron, 0.02, 6);
    k.cyl(0.06, 0.7, KX, 5.5, KZ, iron, 0.03, 6);
    const lampBall = k.mesh(new T.SphereGeometry(0.28, 14, 10), k.glow(0xffe0a8), KX, 5.95, KZ, true);
    const lampL = k.point(KX, 5.9, KZ, 0xffd9a0, 4 + 30 * k.night, 18);
    if (!ctx.reduced) k.ticks.push((t) => { const f = 0.92 + 0.08 * Math.sin(t * 7.3) * Math.sin(t * 2.1); lampL.intensity = (4 + 30 * k.night) * f; lampBall.scale.setScalar(0.96 + 0.06 * f); });
    k.sign('ASTOR PLACE', 2.4, 0.3, KX - KW / 2 - 0.32, 3.28, KZ, 'transparent', '#d8c890', 60, -PI / 2);
    k.sign('ASTOR PLACE', 2.4, 0.3, KX + KW / 2 + 0.32, 3.28, KZ, 'transparent', '#d8c890', 60, PI / 2);
    k.block(KX - KW / 2 - 0.35, KX + KW / 2 + 0.35, KZ - KL / 2 - 0.35, KZ + KL / 2 + 0.35);

    /* ---- the Foundation Building: brownstone, five storeys over a round arched arcade, x 18 to 48 ---- */
    const FX0 = 18, FX1 = 48, FZ0 = -8, FZ1 = 24, FH = 27, FD = FZ1 - FZ0, FCZ = (FZ0 + FZ1) / 2;
    k.box(FX1 - 21.8, FH, FD, (21.8 + FX1) / 2, FH / 2, FCZ, brown);
    k.box(FX1 - FX0, FH - 5.5, FD, (FX0 + FX1) / 2, 5.5 + (FH - 5.5) / 2, FCZ, brown);
    const arcHoles: Hole[] = Array.from({ length: 9 }, (_, i) => ({ kind: 'arch' as const, cx: -13.6 + i * 3.4, y0: 0, w: 2.6, h: 4.6 }));
    k.mesh(holedWall(FD, 5.5, 1.2, arcHoles), brown, 18.6, 0, FCZ).rotation.y = PI / 2;
    for (let i = 0; i <= 9; i++) { const z = FCZ - 15.3 + i * 3.4; k.block(17.9, 19.3, z - 0.5, z + 0.5); }
    k.block(17.9, 19.3, FZ0 - 0.2, -6.5); k.block(17.9, 19.3, 22.5, FZ1 + 0.2);
    k.box(0.6, 5.5, FD, 21.5, 2.75, FCZ, k.pbr('apPlaster', X.plaster(0xb8a48c, 181), 0.4, { roughness: 0.85 }));
    k.box(3.2, 0.3, FD, 20.2, 5.35, FCZ, k.flat(0xc8b8a0, 0, 0.85));
    k.block(21.1, 22.6, FZ0 - 0.2, FZ1 + 0.2);
    k.box(3.2, 0.12, FD, 19.7, -0.04, FCZ, marble);
    for (let i = 0; i < 9; i++) { const z = FCZ - (-13.6 + i * 3.4); if (i === 4) { k.box(0.2, 4.2, 2.4, 21.25, 2.1, z, black); k.box(0.24, 0.5, 2.8, 21.22, 4.55, z, brownDark); continue; } k.box(0.1, 0.3, 2.8, 21.15, 4.6, z, brownDark); }
    for (const z of [FCZ - 10.2, FCZ, FCZ + 10.2]) { k.cyl(0.02, 0.5, 20, 5.2, z, iron, 0.02, 6); k.sphere(0.16, 20, 4.9, z, k.glow(0xfff0d0), 10); }
    for (const z of [FCZ - 11, FCZ - 4, FCZ + 4, FCZ + 11]) k.point(19.8, 4.4, z, 0xffe6c0, 14 + 12 * k.night, 11);
    for (let f = 0; f < 5; f++) {
      const y = 8.2 + f * 4.2;
      for (let i = 0; i < 9; i++) for (const s of [-1, 1]) { const z = FCZ - (-13.6 + i * 3.4) + s * 0.72; k.box(0.06, 2.3, 1.05, 17.97, y, z, win); k.box(0.22, 0.12, 1.3, 17.9, y - 1.22, z, brownDark); k.box(0.2, 0.18, 1.3, 17.9, y + 1.25, z, brownDark); }
      for (let x = 20.5; x < 47; x += 3.4) { k.box(1.05, 2.3, 0.06, x, y, FZ0 - 0.03, win); k.box(1.3, 0.12, 0.22, x, y - 1.22, FZ0 - 0.1, brownDark); k.box(1.05, 2.3, 0.06, x, y, FZ1 + 0.03, win); }
    }
    for (const y of [6.0, 14.6, 23.0]) { k.box(0.3, 0.3, FD + 0.3, 17.9, y, FCZ, brownDark); k.box(FX1 - FX0 + 0.3, 0.3, 0.3, (FX0 + FX1) / 2, y, FZ0 - 0.15, brownDark); }
    k.box(1.0, 0.8, FD + 1.0, 17.6, FH + 0.2, FCZ, brownDark); k.box(FX1 - FX0 + 1.0, 0.8, 1.0, (FX0 + FX1) / 2, FH + 0.2, FZ0 - 0.4, brownDark); k.box(FX1 - FX0 + 1.0, 0.8, 1.0, (FX0 + FX1) / 2, FH + 0.2, FZ1 + 0.4, brownDark);
    for (let z = FZ0 + 1; z < FZ1; z += 1.1) k.box(0.4, 0.5, 0.5, 17.75, FH - 0.55, z, brownDark);
    k.sign('COOPER UNION', 6, 0.7, 17.84, 6.95, FCZ, 'transparent', '#e8dcc0', 80, -PI / 2);
    /* the works, under the arcade, one to a bay, the middle bay being the door */
    for (let i = 0; i < 9; i++) { if (i === 4) continue; const z = FCZ - (-13.6 + i * 3.4); hang(mounts, 21.18, 2.7, z, -PI / 2, 2.0, 1.5, 'gilt', 3.2); }

    /* ---- 41 Cooper Square: nine storeys of glass behind a perforated steel skin with a slot cut up through it ---- */
    const QX0 = 22, QX1 = 50, QZ0 = 30, QZ1 = 58, QH = 40, QCX = (QX0 + QX1) / 2, QCZ = (QZ0 + QZ1) / 2;
    k.box(QX1 - QX0 - 0.8, QH, QZ1 - QZ0 - 0.8, QCX + 0.4, QH / 2, QCZ, darkGlass);
    const skinTex = canvasTex(128, 128, (g) => { g.fillStyle = '#b4bac0'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#343a42'; for (let y = 8; y < 128; y += 16) for (let x = 8; x < 128; x += 16) { g.beginPath(); g.arc(x, y, 4.6, 0, PI * 2); g.fill(); } }, true);
    skinTex.repeat.set(0.5, 0.5);
    const skin = new T.MeshStandardMaterial({ map: skinTex, metalness: 0.7, roughness: 0.35, side: T.DoubleSide });
    const slot: Hole[] = [{ kind: 'rect', cx: 0, y0: 0, w: 6, h: 5 }, { kind: 'poly', pts: [[-8, 5.6], [-4.6, 5.6], [-1.2, 17], [7.2, 38.5], [3.8, 38.5], [-4.2, 17]] }];
    k.mesh(holedWall(QZ1 - QZ0, QH, 0.25, slot), skin, QX0, 0, QCZ).rotation.y = PI / 2;
    k.mesh(holedWall(QX1 - QX0, QH, 0.25, []), skin, QCX, 0, QZ0);
    k.mesh(holedWall(QX1 - QX0, QH, 0.25, []), skin, QCX, 0, QZ1);
    k.box(QX1 - QX0 + 0.6, 0.6, QZ1 - QZ0 + 0.6, QCX, QH + 0.3, QCZ, steel);
    for (const z of [QZ0 + 2, QZ1 - 2]) k.box(0.3, 5, 0.3, QX0 - 0.6, 2.5, z, steel);
    k.block(21.6, QX1 + 1, QZ0 - 0.4, QZ1 + 0.4);
    for (const z of [34, 38, 50, 54]) hang(mounts, 21.84, 2.6, z, -PI / 2, 2.4, 1.6, 'steel', 3.2);

    /* ---- Lafayette Street: the colonnade and the theatre's poster cases, west of the street ---- */
    k.box(12, 20, 30, -26, 10, 15, marble);
    k.box(1.6, 0.6, 30, -19.4, 5.3, 15, marble);
    for (let i = 0; i < 9; i++) k.column(-19.4, 5.6, 1.6 + i * 3.35, 8.4, 0.42, marble, true, marble);
    k.box(1.8, 0.8, 30.4, -19.4, 14.4, 15, marble);
    k.box(12.4, 0.6, 30.4, -26, 20.3, 15, brownDark);
    for (const y of [7.6, 11.4]) for (let i = 0; i < 8; i++) k.box(0.06, 2.4, 1.3, -19.97, y, 3.3 + i * 3.35, win);
    for (let i = 0; i < 8; i++) k.box(0.06, 1.8, 1.3, -19.97, 17.2, 3.3 + i * 3.35, win);
    k.box(0.3, 3.6, 3.0, -19.85, 1.8, 12, black);
    k.box(3.4, 0.4, 4.4, -18.3, 3.9, 12, black);
    for (const z of [5, 8.5, 15.5, 19]) { k.box(0.14, 2.6, 1.9, -19.93, 2.3, z, black); hang(mounts, -19.85, 2.3, z, PI / 2, 1.5, 2.1, 'black', 3.2); }
    for (let i = 0; i < 9; i++) k.box(0.7, 0.4, 0.06, -19.5, 0.2, 0.05 + i * 3.35, marble);
    k.block(-33, -19.6, -0.5, 30.5);
    houses(k, -14, -1, -20, 1, 1751, { along: 'z', hMin: 15, hMax: 20 });
    houses(k, 31, 62, -20, 1, 1752, { along: 'z', hMin: 14, hMax: 22 });

    /* ---- the rest of the square: 51 Astor Place in black glass, the north and south rows, the skyline ---- */
    k.box(36, 50, 28, 30, 25, -32, darkGlass);
    for (let y = 4; y < 50; y += 4.2) k.box(36.1, 0.25, 28.1, 30, y, -32, steel);
    k.box(36.6, 0.5, 28.6, 30, 50.2, -32, steel);
    houses(k, -46, 10, -16, 1, 1750, { hMin: 16, hMax: 24 });
    houses(k, -46, 15, 62, -1, 1753, { hMin: 15, hMax: 22 });
    k.box(30, 22, 30, 37, 11, 77, brown);
    k.skyline({ z: -100, count: 24, spacing: 7, seed: 1754, base: 0, lit: 0.2, scale: 1.4 });
    k.skyline({ z: 120, count: 20, spacing: 8, seed: 1755, base: 0, lit: 0.2, scale: 1.1 });

    /* ---- the plaza: trees, benches, lamps, the street signs, boards and the census wall ---- */
    for (const [x, z] of [[-5.5, 6], [-5.5, 26], [-5.5, 36], [-5.5, 46], [6, 26], [6, 36], [6, 48], [-15.5, 2], [-15.5, 10], [-15.5, 18], [-15.5, 26], [-15.5, 40], [-15.5, 50], [17, 0], [17, 16]]) {
      k.tree(x, 0, z, { h: 6.5, r: 2.4, seed: 175 }); k.box(1.4, 0.04, 1.4, x, 0.03, z, iron); k.keepOut.push({ x, z, r: 0.8 });
    }
    for (const z of [10, 20, 30, 40]) benchB(k, -6.4, z, PI / 2, wood, iron);
    for (const z of [22, 32, 44]) benchB(k, 7.2, z, -PI / 2, wood, iron);
    for (const [x, z] of [[-7.5, -7], [8, 10], [-7.5, 52], [8, 56]]) k.lamp(x, z, 5.2, iron, 0xffd7a0, 5 + 26 * k.night);
    {
      const post = (x: number, z: number, top: string, side: string, rotY: number) => {
        k.cyl(0.04, 3.6, x, 1.8, z, iron, 0.04, 8);
        k.sign(top, 1.3, 0.3, x, 3.35, z, '#0b6b3a', '#ffffff', 96, rotY); k.sign(side, 1.3, 0.3, x, 3.0, z, '#0b6b3a', '#ffffff', 84, rotY + PI / 2);
      };
      post(-8.6, -8.6, 'ASTOR PL', 'LAFAYETTE ST', 0); post(9.6, -8.6, 'ASTOR PL', 'COOPER SQ', 0);
      k.keepOut.push({ x: -8.6, z: -8.6, r: 0.3 }, { x: 9.6, z: -8.6, r: 0.3 });
    }
    void green;
    board(k, mounts, -3.5, 0, 14, 2.4, 1.8, 'steel', black, iron);
    board(k, mounts, 4, 0, 14, 2.4, 1.8, 'steel', black, iron);
    board(k, mounts, 0, 0, 44, 2.4, 1.8, 'steel', black, iron);
    k.censusWall({ x: -3, y: 2.4, z: 22, rotY: PI, cols: 10, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(1250, 50), pieces: ctx.all, backing: black });
    for (const s of [-1, 1]) k.box(0.12, 3.9, 0.12, -3 + s * 2.85, 1.95, 22.1, iron);
    k.block(-6.0, 0.0, 21.7, 22.5);

    /* ---- what moves: traffic on three streets, skaters round the cube, students everywhere ---- */
    traffic(k, ctx, { along: 'z', lanes: [{ at: -12.6, dir: -1, n: 4, speed: 7 }, { at: -9.6, dir: -1, n: 3, speed: 8 }], s0: -60, s1: 75, seed: 1756 });
    traffic(k, ctx, { along: 'z', lanes: [{ at: 10.9, dir: -1, n: 2, speed: 5, bus: true }, { at: 13.8, dir: -1, n: 3, speed: 7 }], s0: -60, s1: 75, seed: 1757 });
    traffic(k, ctx, { along: 'x', lanes: [{ at: -12.6, dir: -1, n: 4, speed: 7 }, { at: -9.5, dir: 1, n: 3, speed: 7 }], s0: -50, s1: 52, seed: 1758 });
    {
      const loop = k.spline([v(-6, 0, -2), v(-3, 0, -6), v(2, 0, -6.5), v(3.8, 0, 3), v(2.5, 0, 8), v(-3, 0, 10), v(-7, 0, 6)], true);
      const NS = 5, len = loop.getLength(), rnd = X.mulberry(1759), c = new T.Color();
      const sk = k.instances(figureGeo(0.18, 0.7, 1.22), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: NS }, () => new T.Matrix4()));
      const bd = k.instances(new T.BoxGeometry(0.82, 0.05, 0.22), k.flat(0x2a2a2e, 0.1, 0.6), Array.from({ length: NS }, () => new T.Matrix4()));
      sk.frustumCulled = bd.frustumCulled = false;
      const pal = [0x1c1e24, 0xd8442a, 0x2a3f6a, 0xe8e2d4, 0x3a5a3a];
      const st = Array.from({ length: NS }, (_, i) => { sk.setColorAt(i, c.set(pal[i])); return { s: (i / NS) * len, v: 3.2 + rnd() * 1.2 }; });
      if (sk.instanceColor) sk.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), pos = new T.Vector3(), tan = new T.Vector3(), tan2 = new T.Vector3(), sc = new T.Vector3();
      const place = (t: number, dt: number) => {
        st.forEach((a, i) => {
          a.s = (a.s + a.v * Math.min(dt, 0.1)) % len;
          const u = a.s / len;
          loop.getPointAt(u, pos); loop.getTangentAt(u, tan); loop.getTangentAt((u + 0.02) % 1, tan2);
          const yaw = Math.atan2(tan.x, tan.z), turn = Math.atan2(tan2.x, tan2.z) - yaw;
          const lean = clamp(((turn + PI) % (2 * PI)) - PI, -0.5, 0.5) * -1.6;
          e.set(0, yaw, lean, 'YXZ'); q.setFromEuler(e);
          pos.y = 0.08 + 0.03 * Math.abs(Math.sin(t * 3 + i));
          sc.set(1, 0.92, 1); m.compose(pos, q, sc); sk.setMatrixAt(i, m);
          pos.y = 0.06; e.set(0, yaw, 0, 'YXZ'); q.setFromEuler(e); sc.set(1, 1, 1); m.compose(pos, q, sc); bd.setMatrixAt(i, m);
        });
        sk.instanceMatrix.needsUpdate = bd.instanceMatrix.needsUpdate = true;
      };
      place(0, 0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    const walkOpts = { animate: !ctx.reduced, speed: 1.0 };
    k.crowd([v(-7, 0, -7), v(-7, 0, 56)], 12, { seed: 1760, spread: 1.0, ...walkOpts });
    k.crowd([v(16.8, 0, -7), v(16.8, 0, 22), v(18.5, 0, 30), v(18.5, 0, 57)], 12, { seed: 1761, spread: 1.0, ...walkOpts });
    k.crowd([v(-17, 0, -7), v(-17, 0, 58)], 10, { seed: 1762, spread: 1.4, ...walkOpts });
    k.crowd([v(-7, 0, 46), v(5, 0, 30), v(6, 0, 12), v(-5, 0, 6), v(-7.5, 0, -6)], 9, { seed: 1763, spread: 0.8, ...walkOpts });
    still(k, [3.4, 3.9, 3.6, 4.2, 3.5, 3.8].map((r, i) => { const a = 0.5 + i * 1.05; return { x: Math.sin(a) * r, y: 0, z: Math.cos(a) * r, ry: a + PI }; }), 1764);
    still(k, [[18.6, 36], [19.2, 41], [17.8, 47], [20.2, 52], [-16.2, 12.5], [-16.5, 14.2]].map(([x, z], i) => ({ x, y: 0, z, ry: i * 1.3 })), 1765);

    /* ---- what the house knows ---- */
    const cubeSrc = { name: 'Alamo (sculpture), Wikipedia', url: 'https://en.wikipedia.org/wiki/Alamo_(sculpture)' };
    k.egg(v(CX, 6.6, CZ), { id: 'ap-alamo', title: 'Six months that became sixty years', year: '1967', text: 'Tony Rosenthal\'s Alamo, fifteen feet of Cor-Ten steel weighing about 1,800 pounds, arrived in 1967 as one of 25 temporary works in the city\'s Sculpture and the Environment show, meant to stay six months. The neighbours petitioned the city to keep it. The name was chosen by the artist\'s wife, because its mass reminded her of the Alamo Mission.', clue: 'The big black thing in the middle of the plaza. Lean on it.', source: cubeSrc }, { r: 2.4 });
    k.egg(v(CX, 1.3, CZ), { id: 'ap-pole', title: 'The hidden pole', text: 'The cube turns round a hidden pole in its centre. Rosenthal never meant it to: he said in 2005 that they had turned it to the position they wanted and left it there, and it was never locked. It has left the plaza three times, for work in 2005, from October 2015 until November 1, 2016, and from May until August 2023, and come back each time.', clue: 'Look at what the whole cube stands on.', source: cubeSrc }, { r: 0.9 });
    k.egg(v(KX, 3.2, KZ), { id: 'ap-kiosk', title: 'The kiosk that came back', year: '1986', text: 'Astor Place station opened on October 27, 1904 as one of the original 28 IRT stations; its plaques carry beavers because John Jacob Astor\'s fortune came from the beaver pelt trade. This cast iron and glass kiosk is a replica, 13 feet wide, 22 feet long and 16 feet tall, made at the same factory as the originals and installed in the renovation finished in May 1986, at the urging of the architect Rolf Ohlhausen, who had photographed the originals as a Cooper Union student.', clue: 'The way down to the 6 train, under a cast iron hood.', source: { name: 'Astor Place station, Wikipedia', url: 'https://en.wikipedia.org/wiki/Astor_Place_station' } }, { r: 2.8 });
    k.egg(v(19.6, 3.2, FCZ), { id: 'ap-foundation', title: 'Iron beams and an elevator shaft', year: '1859', text: 'Fred A. Petersen\'s Foundation Building, 1858 to 1859, Italianate brownstone, was the first building in New York to use rolled iron I beams and the first in the world built with an elevator shaft, round, years before the elevator. Abraham Lincoln spoke in its Great Hall on February 27, 1860 to about 1,500 people. It became a National Historic Landmark on July 4, 1961.', clue: 'Walk under the brown arches across Cooper Square.', source: { name: 'Cooper Union Foundation Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Cooper_Union_Foundation_Building' } }, { r: 2.4 });
    k.egg(v(QX0, 9, QCZ), { id: 'ap-41cooper', title: 'The slot in the skin', year: '2009', text: '41 Cooper Square, by Thom Mayne of Morphosis, built 2006 to September 2009: nine storeys and 175,000 square feet behind a perforated stainless steel curtain wall, wrapped round a central atrium the architects call a vertical piazza, with a grand stair from the ground to the fourth floor. It was the first institutional building in New York to reach LEED Platinum. A three ton marble eagle from the 1910 Pennsylvania Station sits on its eighth floor green roof.', clue: 'Follow the gash cut up through the steel skin, south of the arcade.', source: { name: '41 Cooper Square, Wikipedia', url: 'https://en.wikipedia.org/wiki/41_Cooper_Square' } }, { r: 3.5 });
    k.egg(v(-8.6, 3.3, -8.6), { id: 'ap-riot', title: 'Named for Astor, remembered for a riot', year: '1849', text: 'Astor Place was named for John Jacob Astor soon after his death in 1848. On May 10, 1849 the Astor Place Riot, over the rival Macbeths of the American Edwin Forrest and the Englishman William Charles Macready, killed at least 18 people outside the Astor Opera House, which never recovered. The reconstruction begun in 2013 and finished in 2016 widened these plazas and made Fourth Avenue south of East 9th Street bus only.', clue: 'The green sign at the corner where the street meets the plaza.', source: { name: 'Astor Place, Wikipedia', url: 'https://en.wikipedia.org/wiki/Astor_Place' } }, { r: 1.0 });

    return { mounts, spawn: v(-7.5, 3, -13.85), look: v(4, 4.8, 3), eye: 3, bounds: [-19.5, 21.5, -15.5, 58], style: 'gilt' };
  },
};

/* ================================================================== */
/* ---------------- 176 THE QUEENS NIGHT MARKET ---------------- */
export const nightmarket: RoomDef = {
  id: 'nightmarket',
  name: 'The Queens Night Market',
  area: 'QUEENS NIGHT MARKET / FLUSHING MEADOWS',
  mood: 'Saturday night, a hundred tents, eighty countries',
  color: '#c85a2a',
  daylit: false,
  description: 'The Queens Night Market on a Saturday night in Flushing Meadows Corona Park, on the lot beside the New York Hall of Science: a hundred white tents in three lanes under string lights and paper lanterns, grills smoking, thousands of people eating their way from one country to the next, a band on the stage at the far end, the Great Hall\'s wall of cobalt glass glowing behind it, the rockets of Rocket Park standing in the dark and the Unisphere lit far off across the park. Walk into the crowd at the stage and it cheers. The New Yorkers hang on the tents\' end panels, on boards by the entrance, beside the stage and on the Great Hall\'s wall.',
  signatures: 'The white pop up tents in their rows, the string lights swaying across the lanes, the country flags, the grill smoke, the lanterns, the stage with its band and its swinging lights, the Great Hall\'s undulating wall of dark blue glass, the Atlas and Titan rockets of Rocket Park, and the Unisphere lit in the distance.',
  build(k, ctx) {
    k.sky({ top: 0x04060e, horizon: 0x141a2a, ground: 0x05060a, fog: 0.0022, stars: 800, env: 0.4 });
    k.hemi(0x3a4468, 0x0c0d12, 0.7);
    k.sun(0x9fb0e0, 0.18, 40, 80, 30, false, 90);
    const asph = k.pbr('nmAsph', X.asphalt(0x1e2126), 0.3), lineM = k.flat(0xb8b4a8, 0, 0.9), black = k.flat(0x0e1014, 0.2, 0.7), steel = k.flat(0x7a848e, 0.8, 0.4),
      poleM = k.flat(0x2a2620, 0.2, 0.8), stageM = k.flat(0x1a1c20, 0.1, 0.8), stageTop = k.flat(0x2a2c30, 0.1, 0.7), fence = k.flat(0x3a3f46, 0.6, 0.5),
      rocketM = k.flat(0xe6e6e2, 0.1, 0.6, { emissive: 0x2c2c2a }), rocketDark = k.flat(0x1a1a1a, 0.2, 0.6, { emissive: 0x080808 }), concrete = k.pbr('nmConc', X.concrete(0x55585e, 1761), 0.5),
      uniM = new T.MeshBasicMaterial({ color: 0x9aa6b4 }), grillM = k.flat(0x141414, 0.5, 0.6), coals = k.glow(0xff6a20);
    const mounts: Mount[] = [];
    const rnd = X.mulberry(1760);

    /* ---- the lot: asphalt with its parking lines, trees round the edge, the museum's low wings ---- */
    k.box(170, 0.2, 180, 10, -0.14, -20, asph);
    for (let x = -22; x <= 22; x += 2.7) for (const z of [-30, -2]) k.box(0.1, 0.012, 5.2, x, -0.03, z, lineM);
    for (const x of [-31, 31]) for (let z = -66; z < 24; z += 9) { k.tree(x + (rnd() - 0.5) * 2, 0, z, { h: 7.5, r: 3.2, seed: 176, leaf: 0x1a2a18 }); k.keepOut.push({ x, z, r: 1.0 }); }
    for (let x = -26; x <= 26; x += 8) k.tree(x, 0, 32, { h: 7, r: 3, seed: 177, leaf: 0x1a2a18 });
    k.skyline({ z: 70, count: 22, spacing: 8, seed: 1762, base: 0, lit: 0.3, scale: 0.6, spires: false });
    k.skyline({ z: -125, count: 26, spacing: 7, seed: 1763, base: 0, lit: 0.25, scale: 0.8, spires: false });

    /* ---- the tents: six rows of seventeen, three lanes between them, counters, vendors, grills, flags ---- */
    const ROWS = [-18, -9.4, -6, 6, 9.4, 18], FACE = [1, -1, 1, -1, 1, -1], NT = 17, Z0 = -40.4, PITCH = 3.2, ZEND = Z0 + (NT - 1) * PITCH;
    const tentM = new T.MeshStandardMaterial({ color: 0xf0f0ec, roughness: 0.95, emissive: 0x2a2620 });
    const canopy = (() => { const pyr = new T.ConeGeometry(2.15, 0.95, 4, 1, false); pyr.rotateY(PI / 4); pyr.translate(0, 2.6 + 0.475, 0); const skirt = new T.BoxGeometry(3.04, 0.32, 3.04); skirt.translate(0, 2.46, 0); return mergeGeometries([pyr, skirt])!; })();
    const legG = new T.CylinderGeometry(0.035, 0.035, 2.6, 6); legG.translate(0, 1.3, 0);
    const counterG = new T.BoxGeometry(2.6, 0.9, 0.7); counterG.translate(0, 0.45, 0);
    const tents: T.Matrix4[] = [], legs: T.Matrix4[] = [], counters: T.Matrix4[] = [], counterCol: number[] = [], vendors: { x: number; y: number; z: number; ry: number }[] = [], queue: { x: number; y: number; z: number; ry: number }[] = [];
    const grills: T.Vector3[] = [], flagPoles: { x: number; z: number }[] = [];
    const cloth = [0xe8e8e4, 0x1a1a1e, 0x8a1e1e, 0x1e3a7a, 0xe8e8e4, 0xd8a020, 0x2a6a3a, 0xe8e8e4];
    const q0 = new T.Quaternion(), one = v(1, 1, 1);
    ROWS.forEach((rx, r) => {
      const f = FACE[r];
      for (let i = 0; i < NT; i++) {
        const z = Z0 + i * PITCH;
        tents.push(new T.Matrix4().compose(v(rx, 0, z), q0, one));
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) legs.push(new T.Matrix4().compose(v(rx + sx * 1.42, 0, z + sz * 1.42), q0, one));
        counters.push(new T.Matrix4().compose(v(rx + f * 1.05, 0, z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), PI / 2), one)); counterCol.push(cloth[Math.floor(rnd() * cloth.length)]);
        vendors.push({ x: rx - f * 0.15, y: 0, z: z + (rnd() - 0.5) * 1.2, ry: f > 0 ? PI / 2 : -PI / 2 });
        if ((i + r) % 4 === 1) { const gx = rx + f * 1.85, gz = z + 1.05; k.box(0.9, 0.85, 0.5, gx, 0.43, gz, grillM); k.box(0.7, 0.04, 0.34, gx, 0.87, gz, coals); grills.push(v(gx, 1.0, gz)); }
        if ((i + r) % 3 === 0) flagPoles.push({ x: rx + f * 1.5, z: z - 1.42 });
        const nq = rnd() < 0.55 ? 1 + Math.floor(rnd() * 3) : 0;
        for (let j = 0; j < nq; j++) queue.push({ x: rx + f * (2.0 + rnd() * 0.8 + j * 0.25), y: 0, z: z + (rnd() - 0.5) * 2.2, ry: f > 0 ? -PI / 2 : PI / 2 });
      }
      k.block(rx - 1.55, rx + 1.55, Z0 - 1.6, ZEND + 1.6);
    });
    k.instances(canopy, tentM, tents);
    k.instances(legG, k.flat(0xd8dce0, 0.6, 0.4), legs);
    { const c = new T.Color(), o = k.instances(counterG, new T.MeshStandardMaterial({ roughness: 0.9 }), counters); counterCol.forEach((h, i) => o.setColorAt(i, c.set(h))); if (o.instanceColor) o.instanceColor.needsUpdate = true; }
    still(k, vendors, 1764, [0x1c1e24, 0xe0dcd0, 0x8a2a2a, 0x2a2e38, 0xd8a020], true);
    still(k, queue, 1765, undefined, true);
    k.block(-8.0, -7.4, Z0 - 1.6, ZEND + 1.6); k.block(7.4, 8.0, Z0 - 1.6, ZEND + 1.6);
    k.block(-27, -19.4, Z0 - 1.6, ZEND + 1.6); k.block(19.4, 27, Z0 - 1.6, ZEND + 1.6);
    vapour(k, grills, 6, { rise: 2.6, spread: 0.9, size: 0.14, opacity: 0.14, colour: 0xc8c4c0, seed: 1766, speed: 0.2, animate: !ctx.reduced });
    /* country flags on the tent corners: tricolours in three instanced stripes, no words, no emblems */
    {
      const tri = [[0x009246, 0xffffff, 0xce2b37], [0x0055a4, 0xffffff, 0xef4135], [0xce1126, 0xffffff, 0x006b3f], [0x000000, 0xdd0000, 0xffce00], [0xfcd116, 0x003893, 0xce1126], [0x006847, 0xffffff, 0xce1126], [0x0038a8, 0xffffff, 0xce1126], [0x078930, 0xfcdd09, 0xda121a], [0xed2939, 0xffffff, 0x002395], [0xffffff, 0x0038a8, 0xce1126], [0x00966e, 0xffffff, 0xd62612], [0xd21034, 0xffffff, 0x000000]];
      const stripeG = new T.BoxGeometry(0.62, 0.14, 0.02);
      const stripes = [0, 1, 2].map(() => k.instances(stripeG, new T.MeshStandardMaterial({ roughness: 0.9, emissive: 0x181818 }), flagPoles.map((p) => new T.Matrix4().compose(v(p.x + 0.33, 3.55, p.z), q0, one))));
      const c = new T.Color();
      flagPoles.forEach((p, i) => { const t = tri[i % tri.length]; k.cyl(0.02, 3.8, p.x, 1.9, p.z, steel, 0.02, 6); stripes.forEach((s, j) => { s.setMatrixAt(i, new T.Matrix4().compose(v(p.x + 0.33, 3.55 + (1 - j) * 0.14, p.z), q0, one)); s.setColorAt(i, c.set(t[j])); }); });
      stripes.forEach((s) => { s.instanceMatrix.needsUpdate = true; if (s.instanceColor) s.instanceColor.needsUpdate = true; });
    }
    /* the end panels of the rows carry the works, facing the entrance and facing the stage */
    ROWS.forEach((rx) => {
      k.box(3.0, 2.4, 0.06, rx, 1.3, ZEND + 1.53, tentM); hang(mounts, rx, 1.45, ZEND + 1.58, 0, 2.2, 1.5, 'white', 3.2);
      k.box(3.0, 2.4, 0.06, rx, 1.3, Z0 - 1.53, tentM); hang(mounts, rx, 1.45, Z0 - 1.58, PI, 2.2, 1.5, 'white', 3.2);
    });

    /* ---- the crowd: fourteen hundred in the lanes, one instanced figure, walking both ways ---- */
    type LaneDef = { axis: 'x' | 'z'; at: number; hw: number; a: number; b: number };
    const lanes: LaneDef[] = [{ axis: 'z', at: -13.7, hw: 2.3, a: -46, b: 18 }, { axis: 'z', at: 0, hw: 3.6, a: -46, b: 18 }, { axis: 'z', at: 13.7, hw: 2.3, a: -46, b: 18 }, { axis: 'x', at: 15.5, hw: 1.6, a: -19, b: 19 }];
    {
      const N = 1400, lens = lanes.map((l) => l.b - l.a), total = lens.reduce((s, x) => s + x, 0);
      const ppl = Array.from({ length: N }, (_, i) => { let li = 0, acc = 0; const pick = (i / N) * total; for (let j = 0; j < lanes.length; j++) { if (pick < acc + lens[j]) { li = j; break; } acc += lens[j]; } const l = lanes[li]; return { l, off: (rnd() - 0.5) * 2 * l.hw, s: l.a + rnd() * (l.b - l.a), dir: rnd() > 0.5 ? 1 : -1, v: 0.35 + rnd() * 0.75, h: 0.9 + rnd() * 0.25, ph: rnd() * 6.3 }; });
      const crowd = k.instances(figureGeo(0.19, 0.6, 1.1, 6), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: N }, () => new T.Matrix4()));
      crowd.frustumCulled = false;
      const pal = [0x1c232c, 0xe8e2d4, 0x2a3f6a, 0x8a2a2a, 0xd8c04a, 0x3a5a3a, 0xf0f0f0, 0x6a4a8a, 0x2b5f6e, 0xd07a3a, 0x151517, 0x24262c];
      const c = new T.Color(); ppl.forEach((_, i) => crowd.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]))); if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const place = (t: number, dt: number) => {
        ppl.forEach((a, i) => {
          a.s += a.v * a.dir * Math.min(dt, 0.1);
          if (a.s > a.l.b) { a.s = a.l.b; a.dir = -1; } else if (a.s < a.l.a) { a.s = a.l.a; a.dir = 1; }
          if (a.l.axis === 'z') { pos.set(a.l.at + a.off, 0, a.s); q.setFromAxisAngle(up, a.dir > 0 ? 0 : PI); } else { pos.set(a.s, 0, a.l.at + a.off); q.setFromAxisAngle(up, a.dir > 0 ? PI / 2 : -PI / 2); }
          sc.set(1, a.h * (1 + 0.02 * Math.sin(t * 6 + a.ph)), 1);
          m.compose(pos, q, sc); crowd.setMatrixAt(i, m);
        });
        crowd.instanceMatrix.needsUpdate = true;
      };
      place(0, 0);
      if (!ctx.reduced) k.ticks.push(place);
    }

    /* ---- string lights: poles at the lane edges, cables across and diagonal, one instanced mesh of bulbs that sways ---- */
    const bulbs: { x: number; y: number; z: number; cable: number; u: number }[] = [], cablePh: number[] = [], linePts: number[] = [];
    {
      const addCable = (a: T.Vector3, b: T.Vector3, sag: number, amp: number) => {
        const ci = cablePh.length; cablePh.push(amp);
        const n = Math.max(2, Math.round(a.distanceTo(b) / 0.45));
        let prev: T.Vector3 | null = null;
        for (let i = 0; i <= n; i++) {
          const u = i / n, p = a.clone().lerp(b, u); p.y -= sag * 4 * u * (1 - u);
          if (prev) linePts.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
          prev = p;
          if (i > 0 && i < n) bulbs.push({ x: p.x, y: p.y - 0.12, z: p.z, cable: ci, u });
        }
      };
      for (const l of lanes.slice(0, 3)) {
        const xs = [l.at - l.hw - 0.3, l.at + l.hw + 0.3], zs: number[] = [];
        for (let z = -40; z <= 12.5; z += 6.5) zs.push(z);
        for (const z of zs) for (const x of xs) { k.cyl(0.06, 4.3, x, 2.15, z, poleM, 0.05, 8); k.keepOut.push({ x, z, r: 0.25 }); }
        zs.forEach((z, i) => {
          addCable(v(xs[0], 4.25, z), v(xs[1], 4.25, z), 0.45, 1);
          if (i < zs.length - 1) addCable(v(xs[0], 4.25, z), v(xs[1], 4.25, zs[i + 1]), 0.7, 1.4);
        });
      }
      /* the entrance: a banner over the main lane with a straight run of bulbs */
      for (const x of [-5.4, 5.4]) k.cyl(0.08, 5.4, x, 2.7, 14, steel, 0.08, 10);
      k.box(11.2, 0.16, 0.16, 0, 5.3, 14, steel);
      k.sign('QUEENS NIGHT MARKET', 9.6, 1.0, 0, 4.6, 14, '#101418', '#ffd27a', 78, 0, { border: true, double: true });
      addCable(v(-5.4, 5.35, 14.02), v(5.4, 5.35, 14.02), 0.0, 0);
      k.keepOut.push({ x: -5.4, z: 14, r: 0.3 }, { x: 5.4, z: 14, r: 0.3 });
      const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(linePts, 3));
      k.add(new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x3a3630 })));
      const NB = bulbs.length, bm = k.instances(new T.SphereGeometry(0.07, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff }), Array.from({ length: NB }, () => new T.Matrix4()));
      bm.frustumCulled = false;
      const c = new T.Color(); bulbs.forEach((b, i) => bm.setColorAt(i, c.set(rnd() < 0.85 ? 0xffd9a0 : 0xfff4dc))); if (bm.instanceColor) bm.instanceColor.needsUpdate = true;
      const m = new T.Matrix4();
      const place = (t: number) => {
        for (let i = 0; i < NB; i++) { const b = bulbs[i], amp = cablePh[b.cable], w = Math.sin(PI * b.u); m.makeTranslation(b.x + 0.06 * amp * w * Math.sin(t * 1.1 + b.cable * 0.7), b.y + 0.03 * amp * w * Math.sin(t * 1.7 + b.cable), b.z + 0.06 * amp * w * Math.cos(t * 0.9 + b.cable * 0.4)); bm.setMatrixAt(i, m); }
        bm.instanceMatrix.needsUpdate = true;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* paper lanterns along the main lane, red, orange and gold, bobbing */
    {
      const pts: T.Vector3[] = [];
      for (let z = -37; z <= 10; z += 4.7) for (const s of [-1, 1]) pts.push(v(s * 2.2, 3.55, z));
      const cols = [0xff3a1e, 0xff7a20, 0xffc030, 0xff3a1e];
      const lm = k.instances(new T.SphereGeometry(0.27, 10, 7), new T.MeshBasicMaterial({ color: 0xffffff }), pts.map((p) => new T.Matrix4().makeTranslation(p.x, p.y, p.z)));
      lm.frustumCulled = false;
      const c = new T.Color(); pts.forEach((_, i) => lm.setColorAt(i, c.set(cols[i % cols.length]))); if (lm.instanceColor) lm.instanceColor.needsUpdate = true;
      const m = new T.Matrix4();
      if (!ctx.reduced) k.ticks.push((t) => { pts.forEach((p, i) => { m.makeTranslation(p.x + 0.05 * Math.sin(t * 0.8 + i), p.y + 0.03 * Math.sin(t * 1.3 + i * 0.6), p.z); lm.setMatrixAt(i, m); }); lm.instanceMatrix.needsUpdate = true; });
    }
    for (const l of lanes.slice(0, 3)) for (const z of [-32, -14, 4]) k.point(l.at, 4.0, z, 0xffd2a0, 55, 18, 1.8);

    /* ---- the stage at the north end: a band of four, lights that swing, a crowd that cheers when you join it ---- */
    const SZ = -55;
    k.box(12, 1.2, 6, 0, 0.6, SZ, stageM); k.box(12.4, 0.12, 6.4, 0, 1.26, SZ, stageTop);
    k.box(12, 5.4, 0.3, 0, 1.2 + 2.7, SZ - 3.15, black);
    {
      const back = canvasTex(256, 128, (g) => { g.fillStyle = '#12142a'; g.fillRect(0, 0, 256, 128); const pal = ['#ff3a6a', '#ffb020', '#20c0ff', '#a040ff']; for (let i = 0; i < 40; i++) { g.fillStyle = pal[i % 4]; g.globalAlpha = 0.55; g.beginPath(); g.arc((i * 47) % 256, (i * 31) % 128, 6 + (i % 5) * 4, 0, PI * 2); g.fill(); } });
      k.mesh(new T.PlaneGeometry(10.5, 4.2), new T.MeshStandardMaterial({ map: back, emissive: 0xffffff, emissiveMap: back, emissiveIntensity: 0.7, roughness: 0.9 }), 0, 4.1, SZ - 2.95);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(0.25, 7.2, 0.25, sx * 6.2, 3.6, SZ + sz * 3.0, steel);
    for (const sz of [-1, 1]) k.box(12.8, 0.28, 0.28, 0, 7.15, SZ + sz * 3.0, steel);
    for (const sx of [-1, 1]) k.box(0.28, 0.28, 6.3, sx * 6.2, 7.15, SZ, steel);
    for (let i = 0; i < 7; i++) { const x = -4.5 + i * 1.5; k.cyl(0.13, 0.32, x, 6.85, SZ + 2.95, black, 0.1, 10); k.plane(0.22, 0.22, x, 6.68, SZ + 2.95, k.glow([0xff3a6a, 0xffb020, 0x20c0ff][i % 3]), 0, PI / 2); }
    for (const s of [-1, 1]) { k.box(0.8, 1.7, 0.8, s * 6.9, 0.85, SZ + 2.4, black); k.box(0.7, 1.2, 0.7, s * 6.9, 2.3, SZ + 2.4, black); }
    k.block(-6.6, 6.6, SZ - 3.4, SZ + 3.4); k.block(6.4, 7.4, SZ + 1.9, SZ + 2.9); k.block(-7.4, -6.4, SZ + 1.9, SZ + 2.9);
    k.point(0, 6.2, SZ + 0.5, 0xffe0c0, 30, 16, 1.8);
    const band: { g: T.Group; ph: number; base: number }[] = [], arms: T.Object3D[] = [];
    {
      const skinM = k.flat(0xc8a284, 0, 0.7), instM = k.flat(0x6a3a1a, 0.1, 0.5), chrome = k.flat(0xd8dce0, 1, 0.25);
      const member = (x: number, z: number, coat: number, kind: 'guitar' | 'bass' | 'mic' | 'drums') => {
        const g = new T.Group(); g.position.set(x, 1.32, SZ + z);
        const sit = kind === 'drums';
        const body = new T.Mesh(new T.CapsuleGeometry(0.2, sit ? 0.5 : 0.72, 3, 8), k.flat(coat, 0, 0.8)); body.position.y = sit ? 0.45 : 0.56; g.add(body);
        const head = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), skinM); head.position.y = sit ? 0.95 : 1.22; g.add(head);
        if (kind === 'guitar' || kind === 'bass') { const ins = new T.Mesh(new T.BoxGeometry(kind === 'bass' ? 1.1 : 0.9, 0.3, 0.1), instM); ins.position.set(0.05, 0.6, 0.26); ins.rotation.z = -0.55; g.add(ins); }
        if (kind === 'mic') { const st = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 1.5, 6), chrome); st.position.set(0, 0.0, 0.42); g.add(st); const mic = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), black); mic.position.set(0, 0.78, 0.42); g.add(mic); }
        if (kind === 'drums') for (const s of [-1, 1]) { const arm = new T.Group(); arm.position.set(s * 0.22, 0.75, 0.1); const a = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.5, 5), chrome); a.position.set(0, 0, 0.25); a.rotation.x = PI / 2; arm.add(a); g.add(arm); arms.push(arm); }
        k.add(g); band.push({ g, ph: band.length * 1.7, base: g.rotation.y });
      };
      member(-3.2, 0.2, 0x8a1e1e, 'guitar'); member(3.0, 0.4, 0x1e3a7a, 'bass'); member(0.6, 1.6, 0xe8e2d4, 'mic'); member(-0.6, -1.6, 0x1c1e24, 'drums');
      /* the kit in front of the drummer */
      for (const [x, z, r, h] of [[-1.0, -0.6, 0.32, 0.4], [-0.2, -0.6, 0.3, 0.38], [-1.5, -1.2, 0.36, 0.5], [0.3, -1.3, 0.34, 0.5]]) { k.cyl(r, h, x, 1.32 + 0.35, SZ + z, k.flat(0x3a1a1a, 0.2, 0.5), r, 14); k.cyl(r + 0.02, 0.02, x, 1.32 + 0.35 + h / 2, SZ + z, k.flat(0xf0eee6, 0, 0.6), r + 0.02, 14); }
      for (const [x, z] of [[-1.9, -0.9], [0.7, -0.9]]) { k.cyl(0.015, 1.3, x, 1.32 + 0.65, SZ + z, chrome, 0.015, 6); k.cyl(0.42, 0.02, x, 1.32 + 1.3, SZ + z, k.flat(0xd8b860, 0.9, 0.3), 0.42, 18); }
    }
    const spots: { l: T.SpotLight; cone: T.Mesh; ph: number }[] = [];
    {
      const coneG = new T.ConeGeometry(1.5, 7, 16, 1, true); coneG.translate(0, -3.5, 0);
      const coneM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
      for (const s of [-1, 1]) {
        const l = k.spot(s * 4.2, 6.9, SZ + 2.8, -s * 2, 1.3, SZ, 0xff5a8a, 160, 0.42, 0.6, 24);
        const cone = new T.Mesh(coneG, coneM.clone()); cone.position.copy(l.position); k.add(cone);
        spots.push({ l, cone, ph: s > 0 ? 0 : 2.1 });
      }
    }
    const yard: { x: number; z: number; h: number; ph: number }[] = [];
    for (let i = 0; i < 300; i++) yard.push({ x: -11 + rnd() * 22, z: SZ + 4.4 + rnd() * 7.5, h: 0.9 + rnd() * 0.25, ph: rnd() * 6.3 });
    const yardM = k.instances(figureGeo(0.19, 0.6, 1.1, 6), new T.MeshStandardMaterial({ roughness: 0.9 }), yard.map(() => new T.Matrix4()));
    yardM.frustumCulled = false;
    { const c = new T.Color(), pal = [0x1c232c, 0xe8e2d4, 0x2a3f6a, 0x8a2a2a, 0xd8c04a, 0x151517, 0x6a4a8a]; yard.forEach((_, i) => yardM.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]))); if (yardM.instanceColor) yardM.instanceColor.needsUpdate = true; }
    let cheer = 0;
    {
      const m = new T.Matrix4(), q = new T.Quaternion().setFromAxisAngle(v(0, 1, 0), PI), pos = new T.Vector3(), sc = new T.Vector3(), dirv = new T.Vector3(), tgt = new T.Vector3();
      const placeYard = (t: number) => { yard.forEach((a, i) => { const lift = cheer * 0.28 * Math.abs(Math.sin(t * 5.5 + a.ph)); pos.set(a.x, lift, a.z); sc.set(1, a.h + 0.4 * lift, 1); m.compose(pos, q, sc); yardM.setMatrixAt(i, m); }); yardM.instanceMatrix.needsUpdate = true; };
      placeYard(0);
      if (!ctx.reduced) k.ticks.push((t, dt) => {
        const c = cam();
        if (c && Math.abs(c.position.x) < 11.5 && c.position.z > SZ + 3.4 && c.position.z < SZ + 12.5) cheer = 1;
        cheer = Math.max(0, cheer - dt * 0.35);
        placeYard(t);
        band.forEach((b, i) => { b.g.position.y = 1.32 + 0.06 * Math.abs(Math.sin(t * 4.4 + b.ph)); b.g.rotation.z = 0.06 * Math.sin(t * 2.2 + b.ph); b.g.rotation.y = 0.18 * Math.sin(t * 0.7 + b.ph) + (i === 2 && c && cheer > 0.5 ? Math.atan2(c.position.x - b.g.position.x, c.position.z - b.g.position.z) * 0.3 : 0); });
        arms.forEach((a, i) => { a.rotation.x = -0.5 + 0.45 * Math.sin(t * 8.8 + i * PI); });
        spots.forEach((s, i) => {
          const swing = Math.sin(t * 0.6 + s.ph);
          tgt.set(swing * 3.5 * (i ? 1 : -1), 1.3, SZ + 0.6 * Math.cos(t * 0.45 + s.ph));
          if (c && cheer > 0.6) tgt.set(clamp(c.position.x, -6, 6), 1.5, clamp(c.position.z, SZ + 3.4, SZ + 9));
          s.l.target.position.copy(tgt);
          s.l.color.setHSL(((t * 0.04 + s.ph * 0.2) % 1 + 1) % 1, 0.8, 0.6);
          (s.cone.material as T.MeshBasicMaterial).color.copy(s.l.color);
          dirv.copy(tgt).sub(s.l.position).normalize();
          s.cone.quaternion.setFromUnitVectors(v(0, -1, 0), dirv);
        });
      });
    }
    board(k, mounts, -7.6, 0, SZ + 2.6, 2.4, 1.8, 'steel', black, steel);
    board(k, mounts, 7.6, 0, SZ + 2.6, 2.4, 1.8, 'steel', black, steel);

    /* ---- the Great Hall: Wallace Harrison's undulating wall, 24 m of concrete and cobalt glass, glowing at night ---- */
    {
      const WZ = -80, WA = 5, WL = 16, N = 144, X0 = -40, X1 = 40, H = 24;
      const pos: number[] = [], uv: number[] = [], idx: number[] = [];
      for (let i = 0; i <= N; i++) {
        const x = X0 + ((X1 - X0) * i) / N, z = WZ + WA * Math.cos((2 * PI * x) / WL);
        pos.push(x, 0, z, x, H, z); uv.push(i / 6, 0, i / 6, 6);
        if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const cobalt = canvasTex(256, 256, (gg) => {
        gg.fillStyle = '#07080e'; gg.fillRect(0, 0, 256, 256); const r2 = X.mulberry(1767);
        for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 12) { const b = 90 + r2() * 90; gg.fillStyle = `rgb(${10 + r2() * 25 | 0},${30 + r2() * 40 | 0},${b | 0})`; gg.fillRect(x + 1.5, y + 1.5, 12 - 3 - r2() * 3, 16 - 3 - r2() * 3); }
      }, true);
      const wallM = new T.MeshStandardMaterial({ map: cobalt, emissive: 0xffffff, emissiveMap: cobalt, emissiveIntensity: 0.75, roughness: 0.75, side: T.DoubleSide });
      k.mesh(g, wallM, 0, 0, 0);
      /* a concrete coping rides the top; the rest of the museum sits dark behind */
      for (let i = 0; i < N; i++) { const xa = X0 + ((X1 - X0) * i) / N, xb = X0 + ((X1 - X0) * (i + 1)) / N; k.bar(v(xa, H + 0.3, WZ + WA * Math.cos((2 * PI * xa) / WL)), v(xb, H + 0.3, WZ + WA * Math.cos((2 * PI * xb) / WL)), 0.9, 0.6, concrete); }
      k.box(80, 12, 40, 0, 6, WZ - 30, concrete);
      k.box(30, 14, 30, -55, 7, WZ - 5, concrete);
      k.block(-44, 44, WZ - 40, -72.4);
      for (const x of [-16, 0, 16]) { k.box(3.2, 2.4, 0.12, x, 3.2, WZ + WA - 0.02, black); hang(mounts, x, 3.2, WZ + WA + 0.06, 0, 2.6, 1.8, 'steel', 3.2); }
      k.point(-16, 3.5, WZ + WA + 2.5, 0xffe0c0, 20, 12); k.point(16, 3.5, WZ + WA + 2.5, 0xffe0c0, 20, 12);
    }

    /* ---- Rocket Park to the north east: the Atlas and the Titan II standing in the dark ---- */
    {
      const RX = 34, RZ = -64;
      k.box(18, 0.4, 12, RX + 4, 0.2, RZ, concrete);
      for (let x = RX - 5; x <= RX + 13; x += 1.5) { k.cyl(0.04, 1.4, x, 1.1, RZ - 6, fence, 0.04, 6); k.cyl(0.04, 1.4, x, 1.1, RZ + 6, fence, 0.04, 6); }
      for (const z of [RZ - 6, RZ + 6]) k.box(19, 0.05, 0.05, RX + 4, 1.75, z, fence);
      k.cyl(1.5, 24, RX, 12.4, RZ, rocketM, 1.5, 20); k.cyl(1.55, 1.5, RX, 1.15, RZ, rocketDark, 1.9, 20);
      k.cyl(0.7, 2.8, RX, 25.8, RZ, rocketDark, 1.5, 16); k.cyl(0.3, 1.6, RX, 28, RZ, rocketM, 0.7, 12);
      k.cyl(1.5, 28, RX + 8, 14.4, RZ + 2, rocketM, 1.5, 20); k.cyl(1.55, 2.0, RX + 8, 1.4, RZ + 2, rocketDark, 1.9, 20);
      k.cyl(1.52, 3.0, RX + 8, 15.5, RZ + 2, rocketDark, 1.52, 20);
      k.cyl(0.9, 2.6, RX + 8, 29.7, RZ + 2, rocketDark, 1.5, 16); k.cyl(0.35, 1.8, RX + 8, 31.9, RZ + 2, rocketM, 0.9, 12);
      k.block(RX - 6, RX + 14, RZ - 7, RZ + 7);
    }

    /* ---- the Unisphere, 150 m east: rings of steel on its tripod, lit ---- */
    {
      const UX = 150, UZ = -30, R = 18.5, UY = 24.5;
      for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; k.beam(v(UX + 7 * Math.cos(a), 0, UZ + 7 * Math.sin(a)), v(UX, UY - R + 2.5, UZ), 0.55, uniM, 8); }
      for (let i = 0; i < 6; i++) k.torus(R, 0.2, UX, UY, UZ, uniM, 48).rotation.y = (i / 6) * PI;
      for (const ph of [-60, -30, 0, 30, 60]) { const r = R * Math.cos((ph * PI) / 180); k.torus(r, 0.2, UX, UY + R * Math.sin((ph * PI) / 180), UZ, uniM, 48).rotation.x = PI / 2; }
      for (const [rx, rz] of [[1.15, 0.3], [1.9, -0.5], [0.6, 1.1]]) { const o = k.torus(R + 2.6, 0.32, UX, UY, UZ, uniM, 56); o.rotation.set(rx, 0, rz); }
      k.cyl(28, 0.4, UX, 0.2, UZ, concrete, 28, 32);
    }

    /* ---- the entrance: boards and the census wall where the crowd comes in ---- */
    board(k, mounts, -15.5, 0, 19.5, 2.4, 1.8, 'steel', black, steel);
    board(k, mounts, -10.5, 0, 19.5, 2.4, 1.8, 'steel', black, steel);
    k.censusWall({ x: 13.5, y: 2.4, z: 17.6, rotY: 0, cols: 10, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(1350, 50), pieces: ctx.all, backing: black });
    for (const s of [-1, 1]) k.box(0.12, 3.9, 0.12, 13.5 + s * 2.85, 1.95, 17.5, steel);
    k.block(10.5, 16.5, 17.2, 18.0);
    k.point(0, 4.4, 20, 0xffd9a0, 30, 16, 1.8);

    /* ---- what the house knows ---- */
    const qnm = { name: 'Queens Night Market, Wikipedia', url: 'https://en.wikipedia.org/wiki/Queens_Night_Market' };
    const nysci = { name: 'New York Hall of Science, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_Hall_of_Science' };
    k.egg(v(0, 4.6, 14), { id: 'nm-launch', title: 'Forty vendors and a price cap', year: '2015', text: 'The Queens Night Market launched in April 2015 with 40 vendors and a fixed price cap on every dish, which has been raised only once since. It runs on Saturday nights from April through October, taking a break while the US Open is played in the park.', clue: 'Read the banner over the way in.', source: qnm }, { r: 2.4 });
    k.egg(grills[Math.floor(grills.length / 2)] ?? v(-4.1, 1.2, -8), { id: 'nm-countries', title: 'Eighty countries on one lot', year: '2019', text: 'As of 2019 the market had served food from more than 80 countries, and as of 2023 it averages around 20,000 visitors on a Saturday night.', clue: 'Follow the smoke to a grill.', source: qnm }, { r: 1.3 });
    k.egg(v(0, 3.6, SZ), { id: 'nm-stage', title: 'Two hundred free shows', text: 'The market has hosted about 200 free live performances on its stage. It paused in 2020, came back with ticketed entry in June 2021 and returned to regular nights in July 2021.', clue: 'Walk to the far end of the main lane, where the band is.', source: qnm }, { r: 4 });
    k.egg(v(0, 10, -75), { id: 'nm-greathall', title: 'Harrison\'s wall of blue glass', year: '1964', text: 'The New York Hall of Science began as Wallace Harrison\'s Great Hall, an 80 foot curving concrete structure for the 1964 World\'s Fair. Its basement exhibits opened on June 16, 1964, it opened to the public as a museum on September 21, 1966, and the north wing by Polshek Partnership opened on November 24, 2004.', clue: 'The dark blue wall rising behind the stage.', source: nysci }, { r: 6 });
    k.egg(v(38, 14, -63), { id: 'nm-rockets', title: 'Rocket Park', year: '1964', text: 'The museum\'s Space Park showed three rockets 90 to 110 feet tall along with spacecraft. The rockets were taken down for restoration in August 2001 and later put back.', clue: 'Two white rockets standing behind a fence to the north east.', source: nysci }, { r: 9 });
    k.egg(v(150, 24.5, -30), { id: 'nm-unisphere', title: 'The Unisphere', year: '1964', text: 'Designed by Gilmore D. Clarke and built by U.S. Steel\'s American Bridge division from March to August 1963 in Type 304L stainless steel for the 1964 World\'s Fair: 140 feet tall, 120 feet across, 700,000 pounds, tilted at 23.5 degrees like the Earth. Its three rings are believed to trace Yuri Gagarin, John Glenn and Telstar. It became a city landmark on May 16, 1995.', clue: 'Look east, past the rockets, for the globe lit in the distance.', source: { name: 'Unisphere, Wikipedia', url: 'https://en.wikipedia.org/wiki/Unisphere' } }, { r: 22 });

    return { mounts, spawn: v(0, 3, 24), look: v(0, 4.2, -20), eye: 3, bounds: [-23, 23, -72, 27], style: 'steel' };
  },
};
