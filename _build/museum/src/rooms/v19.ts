/* 173 and 174: two Brooklyn places in the open air.
   The Cherry Esplanade at Brooklyn Botanic Garden in the last week of April, with the Japanese
   Hill and Pond Garden beside it and the Palm House at the head of the lawn, and the Brooklyn
   Heights Promenade on its shelf over the two decks of the expressway with the harbour and Lower
   Manhattan across. Everything that moves is one instanced rig rewritten in place or one group
   on k.ticks; every tick sits behind ctx.reduced; the props (koi, turtles, gulls, a dog) arrive
   as promises and attach their motion inside .then(). No lettered text beyond public signage,
   no likeness of anyone, no dates on anything a visitor reads except the eggs, which are sourced. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];
const ONE = new T.Vector3(1, 1, 1);

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
/* a wall with arched, round or square openings, one extrusion, centred on x, base at y 0, facing z */
type Hole = { kind: 'arch'; cx: number; y0: number; w: number; h: number } | { kind: 'circle'; cx: number; cy: number; r: number } | { kind: 'rect'; cx: number; y0: number; w: number; h: number };
function holedWall(w: number, h: number, depth: number, holes: Hole[]) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new T.Path();
    if (o.kind === 'circle') p.absarc(o.cx, o.cy, o.r, 0, PI * 2, false);
    else if (o.kind === 'rect') { p.moveTo(o.cx - o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0 + o.h); p.lineTo(o.cx - o.w / 2, o.y0 + o.h); p.closePath(); }
    else {
      /* a pointed arch when h is well over w: two arcs meeting at the crown, as on the Brooklyn Bridge */
      const a = o.w / 2, top = o.y0 + o.h, sh = top - a;
      p.moveTo(o.cx - a, o.y0); p.lineTo(o.cx - a, sh);
      if (o.h > o.w * 1.6) { p.quadraticCurveTo(o.cx - a, top - a * 0.15, o.cx, top); p.quadraticCurveTo(o.cx + a, top - a * 0.15, o.cx + a, sh); }
      else p.absarc(o.cx, sh, a, PI, 0, true);
      p.lineTo(o.cx + a, o.y0); p.closePath();
    }
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  return g;
}
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
/* a freestanding board on two posts, facing the normal (sin r, 0, cos r) */
function boardR(k: K, ms: Mount[], x: number, y0: number, z: number, r: number, w: number, h: number, style: FrameStyle, back: T.Material, post: T.Material) {
  const cy = y0 + 0.75 + h / 2 + 0.15, nx = Math.sin(r), nz = Math.cos(r), ax = Math.cos(r), az = -Math.sin(r);
  k.box(w + 0.3, h + 0.3, 0.12, x, cy, z, back).rotation.y = r;
  for (const s of [-1, 1]) {
    const px = x + s * (w / 2 + 0.05) * ax - nx * 0.1, pz = z + s * (w / 2 + 0.05) * az - nz * 0.1;
    k.box(0.1, cy + h / 2 - y0, 0.1, px, y0 + (cy + h / 2 - y0) / 2, pz, post).rotation.y = r;
    k.box(0.5, 0.06, 0.5, px, y0 + 0.03, pz, post).rotation.y = r;
    k.keepOut.push({ x: px, z: pz, r: 0.45 });
  }
  k.keepOut.push({ x: x - nx * 0.1, z: z - nz * 0.1, r: 0.6 });
  hang(ms, x + nx * 0.08, cy, z + nz * 0.08, r, w, h, style, 3.2);
}
/* cars on a road along x: one instanced body, one instanced cabin, one set of wheels; a lane with dir 0 is parked */
function traffic(k: K, ctx: C, p: { lanes: { z: number; dir: number; n: number; speed?: number }[]; x0: number; x1: number; seed: number; y?: number }) {
  const { lanes, x0, x1, seed, y = 0 } = p, rnd = X.mulberry(seed), span = x1 - x0;
  const cars: { x: number; z: number; dir: number; v: number; len: number }[] = [];
  for (const l of lanes) for (let i = 0; i < l.n; i++) {
    const len = 4.2 + rnd() * 0.8;
    cars.push({ x: x0 + ((i + rnd() * 0.5) / l.n) * span, z: l.z, dir: l.dir, v: l.dir === 0 ? 0 : (l.speed ?? 8) * (0.8 + rnd() * 0.35), len });
  }
  const n = cars.length;
  const prof = (pts: number[][], depth: number) => { const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) sh.lineTo(q[0], q[1]); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g; };
  const bodyG = prof([[-0.5, 0.28], [0.5, 0.28], [0.5, 0.62], [0.47, 0.76], [0.22, 0.84], [-0.3, 0.86], [-0.48, 0.8], [-0.5, 0.64]], 1.8);
  const cabG = prof([[-0.3, 0.84], [0.2, 0.84], [0.06, 1.34], [-0.24, 1.34]], 1.66);
  const body = k.instances(bodyG, new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }), Array.from({ length: n }, () => new T.Matrix4()));
  const cab = k.instances(cabG, new T.MeshStandardMaterial({ color: 0x1a2026, roughness: 0.15, metalness: 0.7 }), Array.from({ length: n }, () => new T.Matrix4()));
  const wheel = k.instances(new T.CylinderGeometry(0.34, 0.34, 1.9, 10).rotateX(PI / 2), new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }), Array.from({ length: n * 2 }, () => new T.Matrix4()));
  body.frustumCulled = cab.frustumCulled = wheel.frustumCulled = false;
  const pal = [0xf2c318, 0x1c1e22, 0xe8e8ea, 0x6a7078, 0x2a3a5a, 0x7a1e22, 0xb8bcc2, 0x1a3a2a, 0xe8e8ea, 0x3a3a3c];
  const c = new T.Color();
  cars.forEach((_a, i) => body.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])));
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
/* the backs of a row of Heights houses: brick, brownstone and limestone, rear windows, iron balconies, no stoops; facing +z or -z */
function houseBacks(k: K, x0: number, x1: number, z: number, facing: number, seed: number, p: { hMin?: number; hMax?: number; depth?: number } = {}) {
  const { hMin = 12, hMax = 17, depth = 14 } = p, rnd = X.mulberry(seed);
  const mats = [k.pbr('hbBrown' + seed, X.ashlar(0x6e4c3c, seed + 1, 6), 0.4, { normal: 0.4 }), k.pbr('hbBrick' + seed, X.brick(0x7a4032, seed + 2), 0.9), k.pbr('hbLime' + seed, X.ashlar(0xcdbfa4, seed + 3, 5), 0.35, { normal: 0.4 }), k.pbr('hbBrick2' + seed, X.brick(0x9a6a4e, seed + 4), 0.9)];
  const win = k.flat(0x1a2128, 0.6, 0.18), trim = k.flat(0xe8e2d4, 0, 0.6), corn = k.flat(0x4a4038, 0.2, 0.6), iron = k.flat(0x1c1c1c, 0.6, 0.5);
  let x = x0;
  while (x < x1 - 3) {
    const w = Math.min(x1 - x, 6 + Math.floor(rnd() * 3)), h = hMin + rnd() * (hMax - hMin), m = mats[Math.floor(rnd() * mats.length)], cx = x + w / 2;
    k.box(w, h, depth, cx, h / 2, z - facing * depth / 2, m);
    const floors = Math.floor((h - 1.5) / 3.3), cols = w > 7 ? 3 : 2;
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      const wx = x + ((c + 0.5) / cols) * w, wy = 2.4 + f * 3.3;
      k.box(1.15, 1.9, 0.08, wx, wy, z + facing * 0.03, win);
      k.box(1.35, 0.14, 0.2, wx, wy + 1.02, z + facing * 0.08, trim);
      if (f === 1 && c === 0 && rnd() < 0.6) { k.box(2.2, 0.06, 0.9, wx + 0.5, wy - 1.0, z + facing * 0.5, iron); for (let i = -4; i <= 4; i++) k.box(0.03, 0.9, 0.03, wx + 0.5 + i * 0.26, wy - 0.55, z + facing * 0.95, iron); }
    }
    k.box(w, 0.5, 0.7, cx, h - 0.25, z + facing * 0.3, corn);
    x += w;
  }
}
/* people sitting or standing still: one instanced figure each */
function still(k: K, pts: { x: number; y: number; z: number; ry: number; sit?: boolean }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0xe8c8d0, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0, 0xf0e0a0, 0x8ab0d0]) {
  if (!pts.length) return;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y + (p.sit ? 0.12 : 0), p.z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), p.ry), v(1, p.sit ? 0.82 : 1.1 + rnd() * 0.12, 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
}
/* translucent puffs that rise, spread and fade: spray and mist (v3) */
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
      s.setScalar(sc * (1 - u * 0.35)); m.compose(pos, q, s); o.setMatrixAt(i, m);
    });
    o.instanceMatrix.needsUpdate = true;
  };
  place(0.4);
  if (animate) k.ticks.push(place);
  return o;
}
/* a park bench of boxes, batched with everything else of its material: the kit bench is a group of 23 draw calls */
function bench(k: K, x: number, z: number, rotY: number, slats: T.Material, frame: T.Material, len = 2.0) {
  const put = (w: number, h: number, d: number, lx: number, ly: number, lz: number, m: T.Material) => {
    const c = Math.cos(rotY), s = Math.sin(rotY);
    const o = k.box(w, h, d, x + lx * c + lz * s, ly, z - lx * s + lz * c, m); o.rotation.y = rotY;
  };
  for (let j = 0; j < 4; j++) put(len, 0.05, 0.11, 0, 0.62, j * 0.14 - 0.2, slats);
  for (let j = 0; j < 3; j++) put(len, 0.12, 0.05, 0, 0.86 + j * 0.15, 0.4 + j * 0.02, slats);
  for (const dx of [-len / 2 + 0.2, len / 2 - 0.2]) { put(0.07, 0.06, 0.7, dx, 0.6, 0.05, frame); put(0.07, 0.6, 0.06, dx, 0.3, -0.26, frame); put(0.07, 0.6, 0.06, dx, 0.3, 0.36, frame); put(0.07, 0.65, 0.06, dx, 0.95, 0.44, frame); }
  k.keepOut.push({ x, z, r: 0.85 });
}
/* the ground as one extruded slab with a hole in it, so water sits in a real hole and never on a slab; shape points are (x, z) */
function groundWithHole(k: K, x0: number, x1: number, z0: number, z1: number, hole: { x: number; z: number }[], depth: number, m: T.Material) {
  const s = new T.Shape(); s.moveTo(x0, -z0); s.lineTo(x1, -z0); s.lineTo(x1, -z1); s.lineTo(x0, -z1); s.closePath();
  const p = new T.Path(); hole.forEach((h, i) => (i ? p.lineTo(h.x, -h.z) : p.moveTo(h.x, -h.z))); p.closePath(); s.holes.push(p);
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.rotateX(-PI / 2); g.translate(0, -depth, 0);
  return k.mesh(g, m);
}
/* a flat ring between two ellipses, lying on the ground at y */
function ellipseRing(k: K, cx: number, cz: number, a0: number, b0: number, a1: number, b1: number, y: number, m: T.Material) {
  const s = new T.Shape(); s.absellipse(cx, -cz, a1, b1, 0, PI * 2, false, 0);
  const p = new T.Path(); p.absellipse(cx, -cz, a0, b0, 0, PI * 2, true, 0); s.holes.push(p);
  const g = new T.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false, curveSegments: 40 }); g.rotateX(-PI / 2); g.translate(0, y - 0.04, 0);
  return k.mesh(g, m);
}
/* gulls that circle: one instanced body, one instanced pair of wings (up1) */
function gulls(k: K, ctx: C, cx: number, cz: number, n: number, p: { r0: number; r1: number; y0: number; y1: number; seed: number }) {
  const bodyG = new T.ConeGeometry(0.16, 0.8, 5); bodyG.rotateX(PI / 2);
  const g = k.instances(bodyG, k.flat(0xdde2e6, 0, 0.85), Array.from({ length: n }, () => new T.Matrix4()));
  const w = k.instances(new T.BoxGeometry(1.5, 0.04, 0.34), k.flat(0xe8ecee, 0, 0.9), Array.from({ length: n }, () => new T.Matrix4()));
  g.frustumCulled = w.frustumCulled = false;
  const rnd = X.mulberry(p.seed), st = Array.from({ length: n }, () => ({ a: rnd() * PI * 2, r: p.r0 + rnd() * (p.r1 - p.r0), y: p.y0 + rnd() * (p.y1 - p.y0), w: 0.5 + rnd() * 0.6, f: rnd() * 6.3 }));
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  const place = (t: number) => {
    st.forEach((b, i) => {
      const a = b.a + t * 0.16 * b.w;
      pos.set(cx + Math.cos(a) * b.r, b.y + Math.sin(t * 0.6 + b.f) * 2.2, cz + Math.sin(a) * b.r);
      q.setFromAxisAngle(up, -a + PI / 2);
      m.compose(pos, q, ONE); g.setMatrixAt(i, m);
      sc.set(1, 1, 0.3 + 0.7 * Math.abs(Math.sin(t * 5 + b.f)));
      m.compose(pos, q, sc); w.setMatrixAt(i, m);
    });
    g.instanceMatrix.needsUpdate = w.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (!ctx.reduced) k.ticks.push(place);
}
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const camera = () => (typeof window !== 'undefined' ? ((window as unknown as { __museum?: { camera?: T.Camera } }).__museum?.camera ?? null) : null);

/* ================================================================== */
/* ---------------- 173 THE CHERRY ESPLANADE ---------------- */
export const cherryesplanade: RoomDef = {
  id: 'cherryesplanade',
  name: 'The last week of April',
  area: 'BROOKLYN BOTANIC GARDEN / FLATBUSH AVENUE',
  mood: 'Petals on everything',
  color: '#e8a8b8',
  daylit: true,
  description: 'Brooklyn Botanic Garden at the top of the cherry season: the Cherry Esplanade with its double rows of Kanzan cherries in full pink bloom either side of the long lawn, the Sakura Matsuri crowd picnicking under them, and beside it the Japanese Hill and Pond Garden with its vermilion torii standing in the water, the viewing deck, the shrine on the hill and the koi that come to the rail when you do. The New Yorkers hang on screens inside the Palm House at the head of the lawn, on the back wall of the viewing deck, and on boards between the benches.',
  signatures: 'Two rows of tall Kanzan cherries each side of the broad lawn with the shorter rows and the scarlet oaks outside them, petals falling and lying pink on the grass, the picnic crowd, the glass and iron Palm House with its barrel roof at the north end, the Japanese Hill and Pond Garden: the pond, the vermilion torii in the water, the wooden viewing deck, the Shinto shrine on its hill, the waterfall, the stone lanterns, the little arched bridge, the koi and the turtles on their rock.',
  build(k, ctx) {
    k.sky({ top: 0x5a9be0, horizon: 0xe2ecf4, ground: 0x6a7a5a, fog: 0.0021, sun: { az: 2.35, el: 0.72, color: 0xfff4e4, size: 8 }, env: 0.7 });
    k.hemi(0xe4ecf8, 0x5a6a4a, 0.95);
    k.sun(0xfff0dc, 2.4, 40, 70, 30, true, 120);
    const grass = k.pbr('ceGrass', X.grass(0x4d7a3a, 173), 0.08, { roughness: 1 }),
      gravel = k.pbr('ceGravel', X.pavers(0xb8ae9c, 174), 0.6, { roughness: 1, normal: 0.3 }),
      gravelD = k.pbr('ceGravelD', X.pavers(0xa89e8c, 175), 0.6, { roughness: 1, normal: 0.3 }),
      bark = k.pbr('bark', X.bark(), 0.7, { roughness: 1 }),
      stone = k.pbr('ceStone', X.ashlar(0xcdbfa4, 176, 5), 0.5, { normal: 0.4, roughness: 0.85 }),
      terra = k.pbr('ceTerra', X.terrazzo(0xb8785a, 177), 0.5, { roughness: 0.6 }),
      plank = k.pbr('cePlank', X.planks(0x8a6a48, 8, 178), 0.8, { roughness: 0.7 }),
      darkWood = k.flat(0x3a2818, 0, 0.7), vermilion = k.flat(0xc8321e, 0, 0.55), iron = k.flat(0x1e2226, 0.6, 0.5),
      white = k.flat(0xf2f0ea, 0, 0.6), whiteD = k.flat(0xf2f0ea, 0, 0.6, { side: T.DoubleSide }), rock = k.flat(0x6e6a62, 0, 0.95), rockD = k.flat(0x5a5650, 0, 0.95),
      granite = k.flat(0x8a8680, 0, 0.9), tile = k.flat(0x3a3c40, 0.1, 0.8), soil = k.flat(0x3a2a1c, 0, 1),
      glass = k.glass(0xdcecf4, 0.16, 0.06), leafG = k.flat(0x3a6a34, 0, 0.95), leafR = k.flat(0x7a2a2e, 0, 0.95), leafP = k.flat(0x2c4a2c, 0, 0.95);
    const mounts: Mount[] = [], st: FrameStyle = 'white';
    const rnd = X.mulberry(1730);

    /* ---- the pond is a real hole in the ground: shape it first, then cut the ground round it ---- */
    const PX = -54, PZ = -4, PA = 14, PB = 13;
    const pondR = (a: number) => 1 + 0.07 * Math.sin(3 * a + 0.4) + 0.05 * Math.cos(5 * a + 1.1) + (Math.abs(a - 1.31) < 0.09 ? 0.38 * (1 - Math.abs(a - 1.31) / 0.09) : 0);
    const pond: { x: number; z: number }[] = [];
    for (let i = 0; i < 96; i++) { const a = (i / 96) * PI * 2, f = pondR(a); pond.push({ x: PX + PA * Math.cos(a) * f, z: PZ + PB * Math.sin(a) * f }); }
    groundWithHole(k, -98, 44, -76, 46, pond, 0.7, grass);
    /* the water, deep in the hole, dull green under the sky, as the brief wants it */
    { const w = k.water({ y: -0.42, color: 0x2e4a3a, w: 46, d: 42, x: PX, z: PZ, amp: 0.25 }); const wm = w.material as T.MeshStandardMaterial; wm.metalness = 0.05; wm.roughness = 0.35; wm.envMapIntensity = 0.25; }
    /* nobody walks on the pond: strips across the ellipse, and the inlet under the bridge */
    for (let z = PZ - PB + 1; z < PZ + PB; z += 2) { const w = PA * Math.sqrt(Math.max(0, 1 - ((z - PZ) / PB) ** 2)) * 0.92; if (w > 0.5) k.block(PX - w, PX + w, z - 1, z + 1); }
    k.block(-51.4, -46.8, 8.2, 11.6);
    /* rocks along the bank, one instanced mesh */
    { const ms: T.Matrix4[] = []; for (let i = 0; i < 96; i += 2) { const p = pond[i], s = 0.5 + rnd() * 0.7; ms.push(new T.Matrix4().compose(v(p.x + (rnd() - 0.5) * 0.6, -0.15 + rnd() * 0.15, p.z + (rnd() - 0.5) * 0.6), new T.Quaternion().setFromEuler(new T.Euler(rnd() * 3, rnd() * 3, 0)), v(s * 1.3, s * 0.8, s))); } k.instances(new T.IcosahedronGeometry(0.5, 0), rock, ms); }
    /* the gravel path round the pond, and a wide gravel walk each side of the lawn */
    ellipseRing(k, PX, PZ, PA + 1.8, PB + 1.8, PA + 4.6, PB + 4.6, 0.03, gravelD);
    for (const s of [-1, 1]) k.box(10, 0.04, 78, s * 17, 0.02, -6, gravel);
    k.box(30, 0.04, 8, 0, 0.02, 32, gravel); k.box(34, 0.04, 6, 0, 0.02, -45, gravel);
    k.box(6, 0.04, 30, -27, 0.02, -2, gravelD);

    /* ---- the Cherry Esplanade: two rows of tall Kanzan each side, a shorter row outside, the oaks outside that ---- */
    const canopies: { x: number; y: number; z: number; s: number; ph: number; c: number }[] = [];
    const cherryTrunk = (x: number, z: number, h: number, r: number) => {
      k.lathe([[r * 1.5, 0], [r, h * 0.15], [r * 0.7, h * 0.75], [r * 0.4, h]], x, 0, z, bark, 9);
      for (let b = 0; b < 4; b++) { const a = (b / 4) * PI * 2 + rnd(); k.beam(v(x, h * 0.72, z), v(x + Math.cos(a) * h * 0.42, h + 0.9, z + Math.sin(a) * h * 0.42), r * 0.32, darkWood, 5); }
      k.keepOut.push({ x, z, r: r + 0.35 });
    };
    const pinks = [0xf4b4c8, 0xf0a4bc, 0xf8c4d4, 0xeea0b8, 0xf6bcd0];
    for (const s of [-1, 1]) {
      for (let i = 0; i < 12; i++) {
        const z = -37 + i * 6;
        for (const x of [s * 14.5, s * 20]) { const h = 5.6 + rnd() * 0.8; cherryTrunk(x, z + (rnd() - 0.5), h, 0.26); for (let b = 0; b < 4; b++) canopies.push({ x: x + (rnd() - 0.5) * 2.4, y: h + 0.6 + rnd() * 1.4, z: z + (rnd() - 0.5) * 2.4, s: 2.3 + rnd() * 0.9, ph: rnd() * 6.3, c: pinks[Math.floor(rnd() * pinks.length)] }); }
      }
      for (let i = 0; i < 14; i++) { const z = -38 + i * 5.2, x = s * 25.5, h = 3.6 + rnd() * 0.6; cherryTrunk(x, z, h, 0.18); for (let b = 0; b < 3; b++) canopies.push({ x: x + (rnd() - 0.5) * 1.8, y: h + 0.4 + rnd() * 0.9, z: z + (rnd() - 0.5) * 1.8, s: 1.6 + rnd() * 0.6, ph: rnd() * 6.3, c: pinks[Math.floor(rnd() * pinks.length)] }); }
      for (let i = 0; i < 10; i++) { const z = -36 + i * 7.4, x = s * 31; k.tree(x, 0, z, { h: 9, r: 3.6, seed: 1731 + i, leaf: 0x3a6a34 }); k.keepOut.push({ x, z, r: 0.7 }); }
    }
    /* the canopies: one instanced blossom cloud, swaying, coloured by instance */
    const NC = canopies.length;
    const canopy = k.instances(new T.IcosahedronGeometry(1, 1), new T.MeshStandardMaterial({ roughness: 0.95 }), Array.from({ length: NC }, () => new T.Matrix4()));
    canopy.frustumCulled = false;
    {
      const c = new T.Color(); canopies.forEach((a, i) => canopy.setColorAt(i, c.set(a.c))); if (canopy.instanceColor) canopy.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const place = (t: number) => {
        canopies.forEach((a, i) => {
          const sw = Math.sin(t * 0.9 + a.ph) * 0.18 + Math.sin(t * 2.3 + a.ph * 1.7) * 0.05;
          pos.set(a.x + sw, a.y + Math.sin(t * 1.4 + a.ph) * 0.05, a.z + sw * 0.4);
          q.setFromAxisAngle(up, a.ph + sw * 0.3); sc.set(a.s, a.s * 0.82, a.s);
          m.compose(pos, q, sc); canopy.setMatrixAt(i, m);
        });
        canopy.instanceMatrix.needsUpdate = true;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* the petals: a carpet already down, and a few thousand more on their way, drifting, tumbling, settling */
    {
      const petalG = new T.PlaneGeometry(0.13, 0.09), petalM = new T.MeshBasicMaterial({ color: 0xf6c2d2, side: T.DoubleSide });
      const zone = () => { const s = rnd() < 0.5 ? -1 : 1, r = rnd(); return r < 0.75 ? { x: s * (12 + rnd() * 16), z: -40 + rnd() * 72 } : { x: (rnd() - 0.5) * 24, z: -40 + rnd() * 72 }; };
      const flat = new T.Quaternion().setFromEuler(new T.Euler(-PI / 2, 0, 0));
      const carpet: T.Matrix4[] = [];
      for (let i = 0; i < 2600; i++) { const p = zone(); carpet.push(new T.Matrix4().compose(v(p.x, 0.02 + rnd() * 0.01, p.z), new T.Quaternion().setFromEuler(new T.Euler(-PI / 2, 0, rnd() * PI)), v(1, 1, 1))); }
      for (let i = 0; i < 260; i++) { const a = rnd() * PI * 2, f = 0.2 + rnd() * 0.75; carpet.push(new T.Matrix4().compose(v(PX + PA * Math.cos(a) * f, -0.3, PZ + PB * Math.sin(a) * f), flat, v(1, 1, 1))); }
      k.instances(petalG, petalM, carpet);
      const NP = 2400, fall = k.instances(petalG, petalM, Array.from({ length: NP }, () => new T.Matrix4()));
      fall.frustumCulled = false;
      const ps = Array.from({ length: NP }, () => { const p = zone(); return { x: p.x, z: p.z, top: 5.5 + rnd() * 3.5, sp: 0.045 + rnd() * 0.035, off: rnd(), ph: rnd() * 6.3, dx: (rnd() - 0.5) * 2.4, dz: (rnd() - 0.5) * 2.4 }; });
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), pos = new T.Vector3();
      const place = (t: number) => {
        ps.forEach((a, i) => {
          const u = (t * a.sp + a.off) % 1;
          if (u < 0.72) {
            const f = u / 0.72;
            pos.set(a.x + a.dx * f + Math.sin(t * 1.3 + a.ph) * 0.5, a.top * (1 - f), a.z + a.dz * f + Math.cos(t * 1.1 + a.ph) * 0.4);
            e.set(t * 2.1 + a.ph, t * 1.6, a.ph); q.setFromEuler(e);
          } else { pos.set(a.x + a.dx, 0.03, a.z + a.dz); q.copy(flat); }
          m.compose(pos, q, ONE); fall.setMatrixAt(i, m);
        });
        fall.instanceMatrix.needsUpdate = true;
      };
      place(0.5);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* benches along the lawn edge facing in, the works on boards between them; a Sakura Matsuri crowd on the grass and the walks */
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) bench(k, s * 12.9, -34 + i * 12.5, s > 0 ? PI / 2 : -PI / 2, plank, iron);
      for (const z of [-27.5, -3.5, 20.5]) boardR(k, mounts, s * 13.1, 0, z, s > 0 ? -PI / 2 : PI / 2, 2.4, 1.7, st, white, iron);
    }
    {
      const seated: { x: number; y: number; z: number; ry: number; sit?: boolean }[] = [];
      const blankets = [0xc83a4a, 0x2a4a8a, 0xe8d8a0, 0x4a8a5a, 0xf0f0f0, 0x8a4a9a];
      for (let g = 0; g < 16; g++) {
        const cx = (rnd() - 0.5) * 20, cz = -34 + rnd() * 60, n = 2 + Math.floor(rnd() * 4);
        k.box(2.2, 0.02, 1.7, cx, 0.02, cz, k.flat(blankets[g % blankets.length], 0, 0.9)).rotation.y = rnd();
        for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2 + rnd(); seated.push({ x: cx + Math.cos(a) * 0.9, y: 0, z: cz + Math.sin(a) * 0.7, ry: a + PI, sit: true }); }
        k.keepOut.push({ x: cx, z: cz, r: 1.5 });
      }
      for (let i = 0; i < 14; i++) seated.push({ x: (rnd() - 0.5) * 22, y: 0, z: -36 + rnd() * 64, ry: rnd() * 6.3 });
      still(k, seated, 1733);
      for (const s of [-1, 1]) k.crowd([v(s * 17, 0, 33), v(s * 17.5, 0, 0), v(s * 17, 0, -40)], 14, { seed: 1734 + s, spread: 3.5, speed: 0.7, animate: !ctx.reduced });
      const loop: T.Vector3[] = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; loop.push(v(PX + (PA + 3.2) * Math.cos(a), 0, PZ + (PB + 3.2) * Math.sin(a))); }
      k.crowd(loop, 10, { seed: 1736, spread: 1.0, speed: 0.55, animate: !ctx.reduced, closed: true });
      k.crowd([v(0, 0, 30), v(0, 0, 0), v(0, 0, -44), v(0, 0, -50)], 8, { seed: 1737, spread: 6, speed: 0.6, animate: !ctx.reduced });
    }
    /* the gate at the south end, where you come in from the walk */
    for (const s of [-1, 1]) { k.box(0.8, 3.6, 0.8, s * 5.5, 1.8, 36.5, stone); k.block(s * 5.5 - 0.5, s * 5.5 + 0.5, 36, 37); }
    k.box(12.4, 0.5, 0.6, 0, 3.75, 36.5, stone);
    k.sign('BROOKLYN BOTANIC GARDEN', 8, 0.5, 0, 3.05, 36.15, 'transparent', '#3a3428', 60);
    k.sign('CHERRY ESPLANADE', 4, 0.36, 0, 2.5, 36.15, 'transparent', '#7a2a3a', 60);
    /* a screen of trees round the edge of the room */
    for (let i = 0; i < 26; i++) { const a = (i / 26) * PI * 2, x = -27 + Math.cos(a) * 66, z = -14 + Math.sin(a) * 56; if (x > -35 && x < 35 && z > -48 && z < 40) continue; k.tree(x, 0, z, { h: 8 + rnd() * 3, r: 3.6 + rnd(), seed: 1740 + i, leaf: i % 3 ? 0x3a6a34 : 0x4e7c3c }); }

    /* ---- the Palm House at the head of the lawn: a stone base, glass and iron, a barrel roof ---- */
    const CX0 = -15, CX1 = 15, CZ0 = -64, CZ1 = -48, EH = 6;
    k.box(31, 0.12, 17, 0, 0.0, -56, terra);
    wallX(k, CX0, CX1, CZ1, 1.0, 0.5, stone, [{ c: 0, w: 4.2, h: 1.0 }]);
    wallX(k, CX0, CX1, CZ0, 1.0, 0.5, stone);
    wallZ(k, CZ0, CZ1, CX0, 1.0, 0.5, stone); wallZ(k, CZ0, CZ1, CX1, 1.0, 0.5, stone);
    k.plane(30, EH - 1, 0, 1 + (EH - 1) / 2, CZ1, glass); k.plane(30, EH - 1, 0, 1 + (EH - 1) / 2, CZ0, glass);
    k.plane(16, EH - 1, CX0, 1 + (EH - 1) / 2, -56, glass, PI / 2); k.plane(16, EH - 1, CX1, 1 + (EH - 1) / 2, -56, glass, PI / 2);
    for (let x = -15; x <= 15; x += 2.5) { for (const z of [CZ0, CZ1]) k.box(0.12, EH, 0.14, x, EH / 2, z, white); }
    for (let z = CZ0; z <= CZ1; z += 2) for (const x of [CX0, CX1]) k.box(0.14, EH, 0.12, x, EH / 2, z, white);
    for (const z of [CZ0, CZ1]) k.box(30.4, 0.3, 0.3, 0, EH, z, white);
    for (const x of [CX0, CX1]) k.box(0.3, 0.3, 16.4, x, EH, -56, white);
    {
      /* the roof: an arc of glass over the 16 m span, ribs every 2.5 m, a ridge lantern */
      const R = 10, half = Math.asin(8 / R), g = new T.CylinderGeometry(R, R, 30, 40, 1, true, PI / 2 - half, half * 2);
      g.rotateZ(PI / 2); k.mesh(g, glass, 0, EH - Math.sqrt(R * R - 64), -56);
      for (let x = -15; x <= 15; x += 2.5) { const pts: T.Vector3[] = []; for (let i = 0; i <= 12; i++) { const a = -half + (i / 12) * half * 2; pts.push(v(x, EH - Math.sqrt(R * R - 64) + R * Math.cos(a), -56 + R * Math.sin(a))); } k.curve(pts, 0.08, white, 24); }
      const cy = EH - Math.sqrt(R * R - 64) + R;
      for (const z of [-56 - 1.2, -56 + 1.2]) k.box(30.4, 0.9, 0.06, 0, cy + 0.5, z, glass);
      k.box(30.8, 0.2, 2.8, 0, cy + 1.0, -56, white);
      /* the gable ends of the arc, glass with a fan of iron */
      const es = new T.Shape(); es.moveTo(-8, 0); es.lineTo(8, 0); for (let i = 0; i <= 16; i++) { const a = half - (i / 16) * half * 2; es.lineTo(R * Math.sin(a), R * Math.cos(a) - Math.sqrt(R * R - 64)); } es.closePath();
      const eg = new T.ShapeGeometry(es, 16); eg.rotateY(PI / 2);
      for (const x of [CX0, CX1]) k.mesh(eg, glass, x, EH, -56);
    }
    k.sign('PALM HOUSE', 3.2, 0.42, 0, 1.45, CZ1 + 0.3, 'transparent', '#3a3428', 80);
    /* palms in urns, the planting beds, the stone back wall with the census, and three screens of works */
    for (const [x, z] of [[-5, -50.5], [5, -50.5], [-13, -61.5], [13, -61.5], [-13, -50.5], [13, -50.5], [-5, -61.5], [5, -61.5]]) { k.cyl(0.6, 0.9, x, 0.45, z, terra, 0.45, 12); k.tree(x, 0.8, z, { h: 3.2, r: 1.6, kind: 'palm', seed: 1750 + x, leaf: 0x3c7a3c }); k.keepOut.push({ x, z, r: 0.9 }); }
    for (const x of [-12, 12]) { k.box(3, 0.5, 5, x, 0.25, -56, stone); k.box(2.8, 0.05, 4.8, x, 0.52, -56, soil); k.keepOut.push({ x, z: -56, r: 2.6 }); for (let i = 0; i < 6; i++) k.sphere(0.35 + rnd() * 0.3, x + (rnd() - 0.5) * 2.2, 0.8, -56 + (rnd() - 0.5) * 4, leafP, 8); }
    k.box(13, 4.2, 0.5, 0, 2.1, -63.5, stone); k.block(-6.6, 6.6, -63.9, -63.1);
    k.censusWall({ x: 0, y: 2.2, z: -63.22, rotY: 0, cols: 12, rows: 4, tile: 0.5, gap: 0.04, start: ctx.wallStart(1050, 48), pieces: ctx.all, backing: white });
    for (const x of [-9, 0, 9]) {
      k.box(6.4, 0.3, 0.9, x, 0.15, -56, stone); k.box(6.2, 3.2, 0.16, x, 1.9, -56, white);
      k.block(x - 3.2, x + 3.2, -56.5, -55.5);
      for (const dx of [-1.6, 1.6]) { hang(mounts, x + dx, 1.95, -56 + 0.09, 0, 2.3, 1.6, st, 3.2); hang(mounts, x + dx, 1.95, -56 - 0.09, PI, 2.3, 1.6, st, 3.2); }
    }
    k.point(0, 6, -52, 0xfff0e0, 14, 24); k.point(0, 6, -60, 0xfff0e0, 14, 24);

    /* ---- the Japanese Hill and Pond Garden ---- */
    /* the torii, standing in the water */
    { const tx = -50, tz = -12; for (const s of [-1, 1]) k.cyl(0.3, 5.4, tx + s * 2.4, 1.7, tz, vermilion, 0.34, 12); k.box(6.8, 0.42, 0.5, tx, 4.55, tz, vermilion); k.box(7.3, 0.22, 0.56, tx, 4.9, tz, tile); k.box(5.6, 0.3, 0.3, tx, 3.5, tz, vermilion); k.box(0.4, 0.75, 0.3, tx, 4.0, tz, vermilion); }
    /* the viewing deck on the east bank, its back wall carrying three works */
    { const DX0 = -46, DX1 = -38, DZ0 = 2, DZ1 = 10, DY = 0.3;
      k.box(DX1 - DX0, 0.16, DZ1 - DZ0, (DX0 + DX1) / 2, DY - 0.08, (DZ0 + DZ1) / 2, plank);
      for (const [x, z] of [[DX0 + 0.3, DZ0 + 0.3], [DX0 + 0.3, DZ1 - 0.3], [DX1 - 0.3, DZ0 + 0.3], [DX1 - 0.3, DZ1 - 0.3], [DX0 + 0.3, 6], [DX1 - 0.3, 6]]) { k.cyl(0.14, 4.0, x, DY + 2.0, z, darkWood, 0.14, 8); k.cyl(0.16, 1.4, x, -0.4, z, darkWood, 0.16, 8); k.keepOut.push({ x, z, r: 0.3 }); }
      k.box(0.24, 3.6, DZ1 - DZ0 + 0.2, DX1 - 0.12, DY + 1.8, 6, plank); k.block(DX1 - 0.4, DX1 + 0.2, DZ0 - 0.2, DZ1 + 0.2);
      /* the hip roof: a pyramid of grey tile just wider than the deck, a light under it */
      { const g = new T.ConeGeometry(6.6, 2.4, 4, 1); g.rotateY(PI / 4); g.scale(1.1, 1, 1.1); k.mesh(g, k.flat(0x6a625c, 0.05, 0.75), (DX0 + DX1) / 2, DY + 4.0 + 1.2, 6); }
      k.box(DX1 - DX0 + 2.0, 0.14, DZ1 - DZ0 + 2.0, (DX0 + DX1) / 2, DY + 3.95, 6, plank);
      k.point((DX0 + DX1) / 2, DY + 3.5, 6, 0xfff0e0, 8, 12);
      /* a rail on the water side, a bench along it */
      k.box(0.08, 0.08, DZ1 - DZ0, DX0 + 0.3, DY + 0.95, 6, darkWood); for (let z = DZ0 + 0.3; z <= DZ1 - 0.3; z += 1.0) k.box(0.06, 0.95, 0.06, DX0 + 0.3, DY + 0.5, z, darkWood);
      for (const z of [DZ0, DZ1]) { k.box(DX1 - DX0 - 0.6, 0.08, 0.08, (DX0 + DX1) / 2, DY + 0.95, z + (z === DZ0 ? 0.3 : -0.3), darkWood); }
      k.block(DX0 + 0.05, DX0 + 0.5, DZ0, DZ1);
      for (const z of [3.6, 6, 8.4]) hang(mounts, DX1 - 0.25, DY + 1.55, z, -PI / 2, 1.5, 1.1, 'oak', 3.0);
      /* stone steps from the path down onto the deck */
      k.box(2.4, 0.3, 1.2, DX1 + 1.0, 0.15, 6, granite);
      /* the rail the koi come to: the west edge of the deck */
      k.egg(v(DX0 + 0.4, DY + 1.0, 6), { id: 'cherry-shiota', title: 'Shiota\'s garden', year: '1915', text: 'The Japanese Hill and Pond Garden was created by the Japanese landscape designer Takeo Shiota and opened in June 1915, a gift of the early benefactor and trustee Alfred Tredway White that cost $13,000. Its three acres hold three man made hills signifying earth, heaven and humanity, an artificial waterfall and island, and a curved pond with hundreds of koi. It was one of the first Japanese gardens created in an American botanic garden, and reportedly the first anyone could visit free of charge.', clue: 'Stand at the deck rail and wait for the koi.', source: { name: 'Brooklyn Botanic Garden, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Botanic_Garden' } }, { r: 1.6 });
    }
    /* the hill with the shrine on top, stone steps up its east face, the visitor can climb it */
    const HX = -80, HZ = -8, HR = 10, HH = 5;
    const hillY = (x: number, z: number) => { const d = Math.hypot(x - HX, z - HZ); return d < HR ? HH * (1 - d / HR) : 0; };
    { const g = new T.ConeGeometry(HR, HH, 28, 1); k.mesh(g, grass, HX, HH / 2, HZ); }
    for (let i = 0; i < 12; i++) { const x = HX + HR - 0.5 - i * 0.7, y = hillY(x, HZ); k.box(0.7, 0.14, 1.8, x, y + 0.07, HZ, granite); }
    { const sx = HX, sy = HH, sz = HZ;
      k.box(3.2, 0.3, 3.2, sx, sy + 0.15, sz, granite); k.keepOut.push({ x: sx, z: sz, r: 1.4 });
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.cyl(0.1, 2.2, sx + dx * 0.95, sy + 1.4, sz + dz * 0.95, vermilion, 0.1, 8);
      k.box(1.5, 1.5, 1.5, sx, sy + 1.05, sz, darkWood); k.box(0.7, 1.1, 0.06, sx + 0.78, sy + 0.95, sz, vermilion);
      k.box(2.8, 0.18, 2.6, sx, sy + 2.55, sz, tile); k.box(2.4, 0.16, 2.2, sx, sy + 2.75, sz, tile); k.box(1.6, 0.16, 1.4, sx, sy + 2.93, sz, tile); k.box(0.3, 0.5, 2.6, sx, sy + 3.1, sz, tile);
      for (const s of [-1, 1]) { k.cyl(0.12, 2.4, sx + 3.4, sy - 0.3 + 1.2, sz + s * 1.1, vermilion, 0.13, 8); } k.box(2.9, 0.2, 0.28, sx + 3.4, sy + 1.95, sz, vermilion); k.box(2.4, 0.16, 0.2, sx + 3.4, sy + 1.5, sz, vermilion);
      k.egg(v(sx, sy + 1.8, sz), { id: 'cherry-shrine', title: 'Twice burned, twice rebuilt', year: '1960', text: 'The garden\'s Shinto shrine burned down in January 1938, and a shrine was dedicated again in May 1960, replacing one that vandals had burned. The shrine and the viewing pavilion were both rebuilt in the 1960s after burning down, and the whole garden had a restoration in 2000 that cost about $3 million and won a preservation award.', clue: 'Climb the stone steps to the top of the hill.', source: { name: 'Brooklyn Botanic Garden, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Botanic_Garden' } }, { r: 1.6 });
    }
    /* the waterfall on the north bank: a mound of rock, a white sheet of water, mist at its foot */
    { const wx = -56, wz = PZ - PB - 0.6;
      for (const [dx, dy, dz, s] of [[0, 0.9, 0.2, 2.2], [-1.6, 0.5, 0.6, 1.6], [1.7, 0.6, 0.5, 1.7], [0.3, 2.0, -0.6, 1.5], [-0.9, 1.6, -0.2, 1.3]]) { const o = k.mesh(new T.IcosahedronGeometry(1, 0), rockD, wx + dx, dy, wz + dz); o.scale.set(s, s * 0.8, s); o.rotation.set(dx, dy, dz); }
      k.keepOut.push({ x: wx, z: wz, r: 3.4 });
      const sheet = k.mesh(new T.PlaneGeometry(0.9, 2.8), new T.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.38, side: T.DoubleSide, depthWrite: false }), wx, 1.0, wz + 1.7, true);
      sheet.rotation.x = 0.12;
      if (!ctx.reduced) k.ticks.push((t) => { (sheet.material as T.MeshBasicMaterial).opacity = 0.32 + 0.1 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23); sheet.scale.x = 1 + 0.08 * Math.sin(t * 5.3); });
      vapour(k, [v(wx, -0.3, wz + 2.0), v(wx + 0.5, -0.3, wz + 2.3), v(wx - 0.5, -0.3, wz + 2.2)], 8, { rise: 1.6, spread: 0.9, size: 0.14, opacity: 0.16, seed: 1751, speed: 0.22, animate: !ctx.reduced });
    }
    /* stone lanterns round the path, lit after dark; maples and pines; the little arched bridge over the inlet; turtles on their rock */
    const lit = k.night > 0.3;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2 + 0.5, x = PX + (PA + 5.6) * Math.cos(a), z = PZ + (PB + 5.6) * Math.sin(a);
      k.lathe([[0.42, 0], [0.42, 0.14], [0.16, 0.2], [0.16, 1.05], [0.34, 1.1], [0.34, 1.16], [0.28, 1.56], [0.5, 1.62], [0.56, 1.76], [0.06, 2.0]], x, hillY(x, z), z, granite, 10);
      if (lit) k.box(0.22, 0.3, 0.22, x, hillY(x, z) + 1.36, z, k.glow(0xffd890));
      k.keepOut.push({ x, z, r: 0.6 });
    }
    for (const [x, z, kind, leaf] of [[-70, 12, 'round', 0x8a2a2e], [-40, -22, 'round', 0x7a2a2e], [-66, -24, 'column', 0x2c4a2c], [-36, 14, 'column', 0x2c4a2c], [-72, 8, 'column', 0x2c4a2c], [-44, 18, 'round', 0xe8a8bc], [-62, 16, 'round', 0x9a3a2e], [-88, 6, 'column', 0x2c4a2c], [-90, -20, 'round', 0x3a6a34], [-34, -16, 'round', 0x3a6a34]] as [number, number, 'round' | 'column', number][]) { k.tree(x, hillY(x, z), z, { h: kind === 'column' ? 6.5 : 4.2, r: kind === 'column' ? 1.6 : 2.6, kind, seed: 1760 + x, leaf }); k.keepOut.push({ x, z, r: 0.6 }); }
    void leafG; void leafR;
    { const bx0 = -51.6, bx1 = -46.6, bz = 12.4, n = 10;
      for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, x0 = bx0 + (bx1 - bx0) * u0, x1 = bx0 + (bx1 - bx0) * u1, y0 = 0.25 + 0.7 * Math.sin(u0 * PI), y1 = 0.25 + 0.7 * Math.sin(u1 * PI); k.bar(v(x0, y0, bz), v(x1, y1, bz), 1.5, 0.08, plank); for (const s of [-1, 1]) { k.bar(v(x0, y0 + 0.95, bz + s * 0.72), v(x1, y1 + 0.95, bz + s * 0.72), 0.08, 0.08, vermilion); k.cyl(0.04, 0.95, (x0 + x1) / 2, (y0 + y1) / 2 + 0.47, bz + s * 0.72, vermilion, 0.04, 6); } }
      k.block(bx0 - 0.4, bx1 + 0.4, bz - 0.9, bz - 0.72); k.block(bx0 - 0.4, bx1 + 0.4, bz + 0.72, bz + 0.9);
      k.box(0.9, 0.3, 1.6, bx0 - 0.4, 0.15, bz, granite); k.box(0.9, 0.3, 1.6, bx1 + 0.4, 0.15, bz, granite);
    }
    { const rx = -62, rz = 8.6; const o = k.mesh(new T.IcosahedronGeometry(1.3, 0), rock, rx, -0.25, rz); o.scale.set(1.6, 0.55, 1.2); o.rotation.y = 0.7;
      for (const [dx, dz, ry] of [[-0.6, 0.2, 0.4], [0.5, -0.3, 2.6], [0.1, 0.6, 4.2]]) k.prop('turtle', rx + dx, 0.36, rz + dz, { height: 0.16, rotY: ry }); }

    /* the koi: eight of them cruising the pond just under the surface, gathering at the deck rail when you stand there */
    {
      const N = 8, fish: T.Object3D[] = [];
      const st2 = Array.from({ length: N }, (_, i) => ({ a: (i / N) * PI * 2, r: 0.45 + rnd() * 0.35, w: 0.12 + rnd() * 0.08, ph: rnd() * 6.3 }));
      const feedAt = v(-47.6, -0.36, 6), rail = v(-46, 0, 6);
      let feed = 0;
      const pos = new T.Vector3(), last: T.Vector3[] = Array.from({ length: N }, () => new T.Vector3());
      const place = (t: number, dt: number) => {
        const cam = camera();
        const near = cam ? Math.hypot(cam.position.x - rail.x, cam.position.z - rail.z) < 4.5 : false;
        feed = clamp01(feed + (near ? dt * 0.5 : -dt * 0.25));
        st2.forEach((s, i) => {
          const f = fish[i]; if (!f) return;
          const a = s.a + t * s.w;
          const cx = PX + PA * s.r * Math.cos(a) * 0.9, cz = PZ + PB * s.r * Math.sin(a) * 0.9;
          const fa = a * 2.2 + s.ph, fx = feedAt.x + Math.cos(fa) * 1.7, fz = feedAt.z + Math.sin(fa) * 1.4;
          pos.set(cx + (fx - cx) * feed, -0.36 + 0.05 * Math.sin(t * 2 + s.ph), cz + (fz - cz) * feed);
          const dx = pos.x - last[i].x, dz = pos.z - last[i].z;
          if (dx * dx + dz * dz > 1e-6) f.rotation.y = Math.atan2(-dx, -dz);
          f.rotation.z = 0.15 * Math.sin(t * 6 + s.ph);
          f.position.copy(pos); last[i].copy(pos);
        });
      };
      for (let i = 0; i < N; i++) k.prop('koi', PX, -0.36, PZ, { height: 0.22, rotY: 0 }).then((o) => { if (o) { fish[i] = o; last[i].copy(o.position); } });
      place(0, 0);
      if (!ctx.reduced) k.ticks.push(place);
    }

    /* ---- what the garden knows ---- */
    const src = { name: 'Brooklyn Botanic Garden, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Botanic_Garden' };
    k.egg(v(-14.5, 3.4, -1), { id: 'cherry-esplanade-1941', title: 'Four rows from the Women\'s Auxiliary', year: '1941', text: 'The Cherry Esplanade was created in 1941 when the garden\'s Women\'s Auxiliary donated four rows of cherry trees. It has two rows of tall cherry trees and several rows of shorter ones, 76 trees representing 21 varieties, and the garden as a whole has more than 200 cherry trees of 42 Asian species and cultivated varieties across the Cherry Walk and the Esplanade. The garden has held a cherry blossom festival every year since 1982.', clue: 'Stand under the first tall tree on the west side of the lawn.', source: src }, { r: 2.0 });
    k.egg(v(25.5, 2.6, -12), { id: 'cherry-kanzan', title: 'Kanzan', text: 'The double flowering Kanzan cherries typically bloom at the end of April, one of the highlights of the spring, while the garden\'s different cherry trees open over five to six weeks from late March. Along the eastern and western edges of the Esplanade stand allees of scarlet oak, the Liberty Oaks, planted in remembrance of September 11, 2001.', clue: 'Walk out past the tall rows to the shorter cherries and the oaks beyond them.', source: { name: 'Cherry Esplanade, Brooklyn Botanic Garden', url: 'https://www.bbg.org/collections/gardens/cherry_esplanade' } }, { r: 2.0 });
    k.egg(v(0, 3.4, CZ1 + 0.4), { id: 'cherry-palm-house', title: 'McKim, Mead and White\'s glass house', year: '1917', text: 'McKim, Mead and White began drawing up plans for a laboratory and administration building in late 1910, and the Laboratory Administration Building and the Palm House were dedicated in April 1917. The Steinhardt Conservatory opened on May 19, 1988.', clue: 'The door of the glass house at the head of the lawn.', source: src }, { r: 1.8 });
    k.egg(v(0, 2.6, 36), { id: 'cherry-garden-1911', title: 'Fifty two acres since 1911', year: '1911', text: 'The site of Brooklyn Botanic Garden was first designated in 1897 and the garden opened in May 1911 at 990 Washington Avenue. It occupies 52 acres and draws over 800,000 visitors a year.', clue: 'The gate you came in by.', source: src }, { r: 1.6 });
    k.egg(v(-50, 3.2, -12), { id: 'cherry-torii', title: 'The gateway in the water', text: 'The Japanese Hill and Pond Garden has a torii, a gateway, standing in its pond, and a Shinto shrine on the hill above. The garden\'s features include the pond, a waterfall, an island, stone lanterns, wooden bridges and a viewing pavilion, and its pond holds hundreds of Japanese koi.', clue: 'Look at the red gate from the deck, then find the closest point on the path to it.', source: src }, { r: 2.2 });

    const floorY = (x: number, z: number) => hillY(x, z);
    return { mounts, spawn: v(0, 3, 30), look: v(0, 4, -50), eye: 3, floorY, bounds: [-95, 40, -72, 42], style: 'white' };
  },
};

/* ================================================================== */
/* ---------------- 174 THE PROMENADE OVER THE BQE ---------------- */
export const promenade: RoomDef = {
  id: 'promenade',
  name: 'The shelf over the expressway',
  area: 'BROOKLYN HEIGHTS PROMENADE / COLUMBIA HEIGHTS',
  mood: 'Late afternoon, the harbour going gold',
  color: '#5a6a8a',
  daylit: true,
  description: 'The Brooklyn Heights Promenade: a third of a mile of hexagonal block pavement and iron railing cantilevered over the two decks of the Brooklyn Queens Expressway, with Brooklyn Bridge Park and the harbour below and all of Lower Manhattan straight across the water. Behind you the gardens and the backs of the Heights houses, beside you the benches, the dog walkers and the kids on scooters, and under your feet the traffic you can hear but only glimpse through the railing. The New Yorkers hang on the garden fences facing the walk, on the walls of the Montague Street entrance and in the pergola at the north end.',
  signatures: 'The iron railing and the hex block pavement, the benches facing the view, the flower beds and the garden fences with the brownstone and brick backs of the Heights houses above them, the two roadway decks stepping out below the walk with the expressway traffic on them, Furman Street and the lawns and piers of Brooklyn Bridge Park, the harbour with its ferries, Governors Island and the Statue of Liberty far to the south, the Brooklyn Bridge to the north, and the whole of Lower Manhattan with One World Trade across the river.',
  build(k, ctx) {
    k.sky({ top: 0x4f8ed4, horizon: 0xe6dcc8, ground: 0x4a5058, fog: 0.0011, sun: { az: 3.6, el: 0.42, color: 0xffe8c8, size: 12 }, env: 0.8 });
    k.hemi(0xdce8fa, 0x5a5a52, 0.85);
    k.sun(0xffe6c4, 2.2, -80, 60, -60, true, 140);
    const hexTex = canvasTex(256, 222, (g) => {
      g.fillStyle = '#7a7670'; g.fillRect(0, 0, 256, 222);
      const r = 36.95, w = 64, hh = 55.4;
      for (let row = -1; row < 6; row++) for (let col = -1; col < 6; col++) {
        const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * hh;
        const sh = 0x9a + Math.floor(((row * 7 + col * 13) % 5) * 5);
        g.fillStyle = `rgb(${sh},${sh - 4},${sh - 10})`; g.beginPath();
        for (let i = 0; i < 6; i++) { const a = PI / 6 + (i / 6) * PI * 2; g.lineTo(cx + Math.cos(a) * (r - 1.5), cy + Math.sin(a) * (r - 1.5)); }
        g.closePath(); g.fill();
      }
    }, true);
    const hex = new T.MeshStandardMaterial({ map: hexTex, roughness: 0.92 }); hex.userData.density = 0.55;
    const asph = k.pbr('prAsph', X.asphalt(), 0.3), conc = k.pbr('prConc', X.concrete(0x9a9890, 174), 0.4, { roughness: 0.9 }), concD = k.pbr('prConcD', X.concrete(0x6e6c66, 175), 0.4, { roughness: 0.9 }),
      grass = k.pbr('prGrass', X.grass(0x4a7238, 176), 0.08, { roughness: 1 }), stone = k.pbr('prStone', X.ashlar(0xb8ab92, 177, 4), 0.4, { normal: 0.4, roughness: 0.85 }),
      brick = k.pbr('prBrick', X.brick(0x7a4838, 178), 0.9), plank = k.pbr('prPlank', X.planks(0x6a4a30, 6, 179), 0.9, { roughness: 0.7 }), fenceW = k.pbr('prFence', X.planks(0x8a7a62, 10, 180), 1.2, { roughness: 0.9 }),
      iron = k.flat(0x1a1c20, 0.6, 0.5), ironG = k.flat(0x2a3a30, 0.5, 0.5), white = k.flat(0xe8e6de, 0.1, 0.6), soil = k.flat(0x3a2a1c, 0, 1), line = k.flat(0xe8e4d8, 0, 0.8),
      granite = k.pbr('prGranite', X.ashlar(0x8a8278, 181, 3), 0.25, { roughness: 0.9 }), steel = k.flat(0x8a929c, 0.8, 0.4), cable = k.flat(0x6a6e74, 0.6, 0.5),
      glassT = k.flat(0x9fb6cc, 0.7, 0.25), copper = k.flat(0x5f9a8c, 0.2, 0.7), hull = k.flat(0xf0f0ee, 0.2, 0.5), hullD = k.flat(0x1c2a44, 0.3, 0.6);
    const mounts: Mount[] = [], st: FrameStyle = 'black';
    const rnd = X.mulberry(1740);
    const L0 = -78, L1 = 78;

    /* ---- the walk: the slab, the hex blocks, the railing on the harbour side ---- */
    k.box(L1 - L0, 1.2, 14, 0, -0.6, 2, conc);
    k.box(L1 - L0, 0.06, 10.6, 0, 0.03, 0.8, hex);
    k.box(L1 - L0, 0.2, 0.5, 0, -0.1, -4.75, concD);
    { const posts: T.Matrix4[] = [], pickets: T.Matrix4[] = [];
      for (let x = L0; x <= L1; x += 1.5) posts.push(new T.Matrix4().makeTranslation(x, 0.62, -4.5));
      for (let x = L0 + 0.15; x <= L1; x += 0.15) pickets.push(new T.Matrix4().makeTranslation(x, 0.6, -4.5));
      k.instances(new T.BoxGeometry(0.07, 1.24, 0.07), iron, posts);
      k.instances(new T.BoxGeometry(0.022, 1.08, 0.022), iron, pickets);
      k.box(L1 - L0, 0.07, 0.09, 0, 1.24, -4.5, iron); k.box(L1 - L0, 0.05, 0.05, 0, 0.1, -4.5, iron); k.box(L1 - L0, 0.04, 0.04, 0, 0.95, -4.5, iron);
      k.block(L0, L1, -5.2, -4.35);
    }
    /* benches facing the view, lamp posts, litter bins */
    for (let i = 0; i < 12; i++) { const x = -66 + i * 12; bench(k, x, 4.6, PI, plank, iron, 2.2); }
    for (let i = 0; i < 6; i++) { const x = -60 + i * 24; k.cyl(0.07, 3.6, x, 1.8, -3.8, iron, 0.09, 8); k.sphere(0.24, x, 3.75, -3.8, k.glow(k.night > 0.3 ? 0xffe0a8 : 0xf4f2ee), 10); k.keepOut.push({ x, z: -3.8, r: 0.3 }); }
    /* the flower beds and the garden fences, with the works on the panels facing the walk */
    /* the beds stop for the pergola at the north end and the Montague Street plaza */
    const beds: [number, number][] = [[L0 + 1, -71.5], [-54.5, 35.5], [56.5, L1 - 1]];
    for (const [b0, b1] of beds) { k.box(b1 - b0, 0.5, 2.6, (b0 + b1) / 2, 0.25, 7.2, brick); k.box(b1 - b0 - 0.2, 0.06, 2.4, (b0 + b1) / 2, 0.52, 7.2, soil); k.block(b0, b1, 5.9, 8.5); }
    { const fl: T.Matrix4[] = [], col: number[] = [], pal = [0xe83a5a, 0xf0d24a, 0xff8c3b, 0xe8e2e8, 0x8a4ad8, 0xd83a8a, 0x3a8a4a];
      for (let i = 0; i < 1400; i++) { const [b0, b1] = beds[i % 3], s = 0.07 + rnd() * 0.09; fl.push(new T.Matrix4().compose(v(b0 + 0.3 + rnd() * (b1 - b0 - 0.6), 0.6 + rnd() * 0.25, 6.2 + rnd() * 2.0), new T.Quaternion(), v(s, s, s))); col.push(pal[Math.floor(rnd() * pal.length)]); }
      const o = k.instances(new T.IcosahedronGeometry(1, 0), new T.MeshStandardMaterial({ roughness: 0.9 }), fl); const c = new T.Color(); col.forEach((h, i) => o.setColorAt(i, c.set(h))); if (o.instanceColor) o.instanceColor.needsUpdate = true;
    }
    const FZ = 9.2;
    const panelXs = [-75, -51, -39, -27, -15, -3, 9, 21, 63, 69];
    {
      /* brick piers every six metres, a wooden panel between, iron near the entrance, nothing across the Montague Street plaza */
      for (let x = L0; x <= L1; x += 6) { if (x > 36 && x < 56) continue; k.box(0.5, 3.0, 0.5, x, 1.5, FZ, brick); k.box(0.62, 0.12, 0.62, x, 3.03, FZ, stone); }
      for (let x = L0 + 3; x < L1; x += 6) { if (x > 36 && x < 56) continue; if (x > 26 && x < 66) { for (let i = -10; i <= 10; i++) k.box(0.03, 2.6, 0.03, x + i * 0.26, 1.5, FZ, iron); k.box(5.4, 0.05, 0.05, x, 2.75, FZ, iron); continue; } k.box(5.4, 2.6, 0.1, x, 1.5, FZ, fenceW); k.box(5.5, 0.08, 0.16, x, 2.82, FZ, stone); }
      k.block(L0, 36, FZ - 0.4, FZ + 0.4); k.block(56, L1, FZ - 0.4, FZ + 0.4);
      for (const x of panelXs) hang(mounts, x, 1.8, FZ - 0.06, PI, 2.2, 1.5, st, 3.4);
    }
    /* the gardens behind the fence, then the backs of the houses */
    k.box(L1 - L0, 0.08, 5, 0, 0.04, 11.7, grass);
    for (let x = L0 + 4; x < L1; x += 11) { if (x > 36 && x < 56) continue; k.tree(x, 0, 11.5 + (rnd() - 0.5) * 2, { h: 5 + rnd() * 2, r: 2.2 + rnd(), seed: 1741 + x, leaf: rnd() < 0.3 ? 0x8a3a3a : 0x3a6a34 }); }
    houseBacks(k, L0, 36, 14.2, -1, 1742, { hMin: 12, hMax: 17, depth: 14 });
    houseBacks(k, 56, L1 + 2, 14.2, -1, 1743, { hMin: 13, hMax: 18, depth: 14 });
    k.block(L0, L1, 13.8, 30);
    /* Montague Street comes in between the two blocks: a paved plaza, two stone walls carrying works, the street sign */
    { const EX0 = 36, EX1 = 56;
      k.box(EX1 - EX0, 0.08, 6, (EX0 + EX1) / 2, 0.05, 11.2, hex);
      k.box(EX1 - EX0 - 6, 0.1, 18, (EX0 + EX1) / 2, -0.02, 23, asph); for (const s of [-1, 1]) k.box(3, 0.14, 18, (EX0 + EX1) / 2 + s * 8.5, 0.02, 23, conc);
      for (let z = 15; z < 32; z += 3.2) k.box(0.12, 0.012, 1.6, (EX0 + EX1) / 2, 0.09, z, line);
      for (const [x0, x1] of [[EX0 - 8, EX0], [EX1, EX1 + 8]]) { const cx = (x0 + x1) / 2; k.box(x1 - x0, 3.2, 0.6, cx, 1.6, FZ, stone); k.box(x1 - x0 + 0.3, 0.3, 0.9, cx, 3.3, FZ, granite); k.block(x0, x1, FZ - 0.6, FZ + 0.6); for (const dx of [-2.1, 2.1]) hang(mounts, cx + dx, 1.95, FZ - 0.32, PI, 2.4, 1.7, st, 3.4); }
      k.sign('BROOKLYN HEIGHTS PROMENADE', 9.4, 0.56, (EX0 + EX1) / 2, 3.6, 8.6, 'transparent', '#e8e6de', 60);
      k.box(11, 0.7, 0.4, (EX0 + EX1) / 2, 3.6, 8.9, ironG);
      k.cyl(0.05, 3.0, EX1 + 0.6, 1.5, 12.5, iron, 0.05, 8); k.sign('MONTAGUE ST', 1.2, 0.26, EX1 + 0.6, 2.85, 12.5, '#1d7a3a', '#ffffff', 90, PI / 2, { border: true });
      k.crowd([v(46, 0, 34), v(46, 0, 12), v(40, 0, 4), v(20, 0, 1), v(-20, 0, 0.5), v(-60, 0, 1)], 16, { seed: 1744, spread: 2.2, speed: 0.9, animate: !ctx.reduced });
      traffic(k, ctx, { lanes: [{ z: 25, dir: 0, n: 2 }], x0: 43.5, x1: 48.5, seed: 1745 });
    }
    /* the pergola at the north end: timber on brick piers, a back panel of works */
    { const PX0 = -70, PX1 = -56, PZ0 = 3.5, PZ1 = 8.4;
      for (const x of [PX0, PX1]) for (const z of [PZ0, PZ1]) { k.box(0.55, 2.9, 0.55, x, 1.45, z, brick); k.keepOut.push({ x, z, r: 0.5 }); }
      for (const x of [PX0 - 7, PX0 + 7]) { k.box(0.55, 2.9, 0.55, x, 1.45, PZ0, brick); k.keepOut.push({ x, z: PZ0, r: 0.5 }); }
      for (const z of [PZ0, PZ1]) k.box(PX1 - PX0 + 1.2, 0.22, 0.3, (PX0 + PX1) / 2, 3.0, z, plank);
      for (let x = PX0 - 0.3; x <= PX1 + 0.3; x += 0.7) k.box(0.12, 0.2, PZ1 - PZ0 + 1.4, x, 3.2, (PZ0 + PZ1) / 2, plank);
      k.box(PX1 - PX0, 2.9, 0.14, (PX0 + PX1) / 2, 1.5, FZ - 0.35, fenceW);
      for (const x of [-68.2, -64.2, -60.2]) { /* three works inside the pergola, one on the west end wall */ hang(mounts, x, 1.8, FZ - 0.43, PI, 2.2, 1.5, st, 3.2); }
      k.box(0.3, 2.9, PZ1 - PZ0 + 0.6, PX0 - 0.2, 1.45, (PZ0 + PZ1) / 2, brick); k.block(PX0 - 0.4, PX0, PZ0 - 0.4, PZ1 + 0.4);
      hang(mounts, PX0 - 0.02, 1.75, (PZ0 + PZ1) / 2, PI / 2, 1.9, 1.4, st, 3.0);
      bench(k, -63, 6.5, 0, plank, iron, 2.2);
    }
    /* the west end of the walk: a stone wall across it, with the census on it */
    k.box(0.6, 3.6, 14, L0 + 0.3, 1.8, 2, stone); k.block(L0 - 0.4, L0 + 0.8, -5, 9);
    k.censusWall({ x: L0 + 0.62, y: 2.0, z: 0.5, rotY: PI / 2, cols: 12, rows: 4, tile: 0.5, gap: 0.04, start: ctx.wallStart(1150, 48), pieces: ctx.all, backing: white });
    k.box(0.6, 3.6, 14, L1 - 0.3, 1.8, 2, stone); k.block(L1 - 0.8, L1 + 0.4, -5, 9);

    /* ---- below: the two roadway decks stepping out from the escarpment wall, Furman Street, the park, the water ---- */
    const D1 = -6.2, D2 = -12.4, G = -18.6, W = -19.4;
    k.box(L1 - L0 + 12, 19, 1.5, 0, G + 9.5, 8.6, concD);
    for (const [y, z0, z1] of [[D1, -15, -4.8], [D2, -17, -4.8]] as number[][]) {
      k.box(L1 - L0 + 12, 1.0, z1 - z0, 0, y - 0.5, (z0 + z1) / 2, concD);
      k.box(L1 - L0 + 12, 0.05, z1 - z0 - 0.4, 0, y + 0.02, (z0 + z1) / 2, asph);
      k.box(L1 - L0 + 12, 0.9, 0.4, 0, y + 0.45, z0 + 0.2, conc);
      for (let x = L0 - 4; x <= L1 + 4; x += 3.6) { k.box(1.8, 0.012, 0.12, x, y + 0.05, (z0 + z1) / 2 - 1.5, line); k.box(1.8, 0.012, 0.12, x, y + 0.05, (z0 + z1) / 2 + 1.5, line); }
      for (let x = L0 - 4; x <= L1 + 4; x += 12) k.box(1.2, y - G, 1.2, x, (y + G) / 2, z0 + 1.6, concD);
    }
    k.box(L1 - L0 + 12, 4.4, 1.2, 0, D1 - 3.2, -4.8, concD);
    traffic(k, ctx, { lanes: [{ z: -13.2, dir: 1, n: 7, speed: 12 }, { z: -10.2, dir: 1, n: 6, speed: 11 }, { z: -7.2, dir: 1, n: 5, speed: 10 }], x0: L0 - 6, x1: L1 + 6, seed: 1746, y: D1 });
    traffic(k, ctx, { lanes: [{ z: -15.2, dir: -1, n: 7, speed: 12 }, { z: -12.2, dir: -1, n: 6, speed: 11 }, { z: -9.2, dir: -1, n: 5, speed: 10 }], x0: L0 - 6, x1: L1 + 6, seed: 1747, y: D2 });
    /* Furman Street, then Brooklyn Bridge Park: lawns, a path, trees, the piers on their piles */
    k.box(L1 - L0 + 40, 0.3, 14, 0, G - 0.15, -24, asph);
    k.box(L1 - L0 + 40, 0.3, 36, 0, G - 0.15, -48, grass);
    k.box(L1 - L0 + 40, 0.32, 3, 0, G - 0.14, -40, conc);
    for (let x = L0 - 16; x <= L1 + 16; x += 9) k.tree(x, G, -34 + (rnd() - 0.5) * 8, { h: 6 + rnd() * 3, r: 3 + rnd(), seed: 1748 + x, leaf: 0x3e6e36 });
    for (let x = L0 - 16; x <= L1 + 16; x += 13) k.tree(x, G, -56 + (rnd() - 0.5) * 6, { h: 5 + rnd() * 2, r: 2.6, seed: 1749 + x, leaf: 0x4e7c3c });
    for (const px of [-40, 40]) { k.box(44, 1.2, 60, px, G - 0.2, -96, conc); for (let z = -70; z > -126; z -= 8) for (const dx of [-20, 0, 20]) k.cyl(0.5, 3, px + dx, W - 1, z, concD, 0.5, 8); }
    k.box(6, 1.0, 40, 0, G - 0.4, -86, plank);
    k.water({ y: W, color: 0x365a6c, w: 1500, d: 1300, x: -100, z: -700, amp: 1.0 });
    { const wm = (k.scene.children.find((o) => (o as T.Mesh).isMesh && ((o as T.Mesh).material as T.MeshStandardMaterial).color?.getHex() === 0x365a6c) as T.Mesh | undefined)?.material as T.MeshStandardMaterial | undefined; if (wm) { wm.metalness = 0.05; wm.envMapIntensity = 0.25; wm.roughness = 0.3; } }
    /* ---- across the water: Lower Manhattan, One World Trade, the Brooklyn Bridge to the north, Governors Island and Liberty to the south ---- */
    k.skyline({ z: -540, count: 46, spacing: 11.5, scale: 3.2, base: W, seed: 1174, lit: 0.3, glow: 0.7, tint: 0x6e7684, spires: true, x: -20, rows: 2 });
    k.skyline({ z: -640, count: 30, spacing: 16, scale: 2.4, base: W, seed: 1175, lit: 0.25, glow: 0.5, tint: 0x7a8290, spires: false, x: -140, rows: 1 });
    { const g = new T.CylinderGeometry(14, 21, 160, 4, 1); g.rotateY(PI / 4); k.mesh(g, glassT, -40, W + 80, -560); k.cyl(0.9, 44, -40, W + 160 + 22, -560, steel, 0.2, 8); k.box(46, 6, 46, -40, W + 3, -560, concD); }
    { const gx = -260, gz = -360; k.mesh(new T.CylinderGeometry(70, 76, 3, 18), grass, gx, W + 0.5, gz); for (let i = 0; i < 7; i++) k.box(10 + rnd() * 8, 6 + rnd() * 6, 10 + rnd() * 6, gx + (rnd() - 0.5) * 90, W + 5, gz + (rnd() - 0.5) * 70, brick); }
    { const lx = -420, lz = -560; k.mesh(new T.CylinderGeometry(22, 26, 3, 11), granite, lx, W + 1.5, lz); k.box(16, 27, 16, lx, W + 16, lz, granite); k.lathe([[0, 0], [6.5, 0.2], [5, 12], [4, 22], [3, 30], [2.2, 38], [0, 40]], lx, W + 29.5, lz, copper, 14); k.sphere(2.2, lx, W + 71, lz, copper, 10); k.cyl(0.7, 16, lx + 3.5, W + 76, lz, copper, 0.7, 8); k.sphere(1.3, lx + 3.5, W + 84.5, lz, k.glow(0xffd070), 8); }
    { /* the Brooklyn Bridge: two granite towers with pointed arches, the deck, the four main cables */
      const BX = 150, TY = W + 84, DY = W + 40;
      for (const tz of [-120, -400]) { const g = holedWall(28, 84, 12, [{ kind: 'arch', cx: -7, y0: 40, w: 9, h: 34 }, { kind: 'arch', cx: 7, y0: 40, w: 9, h: 34 }]); k.mesh(g, granite, BX, W, tz); k.box(30, 3, 14, BX, TY + 1.5, tz, granite); }
      k.box(26, 3, 500, BX, DY, -260, concD); k.box(26, 2, 60, BX, DY - 4, -10, granite); k.box(30, 30, 30, BX, W + 15, 12, granite);
      for (const dx of [-11, -4, 4, 11]) {
        const pts: T.Vector3[] = [];
        /* main cables: at the tower tops, sagging to the deck at mid span, down to the anchorages beyond the towers */
        for (let i = 0; i <= 40; i++) { const z = 12 - (i / 40) * 552; let y: number; if (z > -120) y = TY - (TY - DY) * ((z + 120) / 132) ** 2; else if (z < -400) y = TY - (TY - DY) * ((-400 - z) / 140) ** 2; else { const t = (z + 120) / -280; y = TY - (TY - DY - 4) * 4 * t * (1 - t); } pts.push(v(BX + dx, Math.min(TY, Math.max(DY, y)), z)); }
        k.curve(pts, 0.35, cable, 80);
      }
      for (let z = -130; z > -395; z -= 9) for (const dx of [-11, 11]) { const u = (z + 260) / 140, y = DY + 4 + (TY - DY - 4) * u * u; k.beam(v(BX + dx, DY + 1.5, z), v(BX + dx, y, z), 0.08, cable, 4); }
    }
    /* ferries on the harbour, gulls over the piers */
    if (!ctx.reduced) {
      for (let i = 0; i < 3; i++) {
        const g = new T.Group();
        const h = new T.Mesh(new T.BoxGeometry(8, 3.2, 26), i ? hull : hullD); h.position.y = 1.2; g.add(h);
        const deck = new T.Mesh(new T.BoxGeometry(8.4, 0.4, 26), white); deck.position.y = 2.9; g.add(deck);
        const cab = new T.Mesh(new T.BoxGeometry(6.4, 3.0, 14), i ? hullD : hull); cab.position.set(0, 4.5, -1); g.add(cab);
        const bridge = new T.Mesh(new T.BoxGeometry(5, 2.2, 5), white); bridge.position.set(0, 7.1, -3); g.add(bridge);
        k.add(g);
        const route = k.spline([v(-40 - i * 30, W + 0.4, -150), v(-200 - i * 20, W + 0.4, -240), v(-320, W + 0.4, -420), v(-120, W + 0.4, -480), v(120 + i * 30, W + 0.4, -330), v(80, W + 0.4, -170)], true);
        k.rider(g, route, 6 + i * 1.5, i * 160);
      }
    }
    gulls(k, ctx, -20, -90, 22, { r0: 30, r1: 90, y0: 4, y1: 28, seed: 1750 });
    /* the walk's own life: strollers, a dog walker on a loop, three kids on scooters, and gulls on the railing that lift off when you come close */
    k.crowd([v(-74, 0, 1.5), v(-30, 0, 2.5), v(20, 0, 1.2), v(74, 0, 2.2)], 22, { seed: 1751, spread: 3.2, speed: 0.8, animate: !ctx.reduced });
    if (!ctx.reduced) {
      const loop = k.spline([v(-72, 0, 0), v(-20, 0, -1.0), v(30, 0, -0.5), v(72, 0, 0.5), v(72, 0, 3.6), v(20, 0, 4.2), v(-30, 0, 3.4), v(-72, 0, 3.8)], true);
      const walker = new T.Group();
      const fig = new T.Mesh(figureGeo(0.2, 0.8, 1.32), k.flat(0x2c3a4a, 0, 0.9)); fig.position.set(0.5, 0, 0); walker.add(fig);
      const lead = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 1.3, 4), iron); lead.position.set(0.1, 0.7, 0.6); lead.rotation.z = 0.9; lead.rotation.x = 0.3; walker.add(lead);
      k.add(walker); k.rider(walker, loop, 1.1, 40);
      k.prop('dog', 0, 0, 0, { height: 0.55 }).then((d) => { if (!d) return; k.scene.remove(d); d.position.set(-0.4, 0, 0.9); d.rotation.y = 0; walker.add(d); });
      for (let i = 0; i < 3; i++) {
        const kid = new T.Group();
        const body = new T.Mesh(figureGeo(0.15, 0.5, 0.95), k.flat([0xe83a5a, 0x3a8ae8, 0xf0d24a][i], 0, 0.9)); body.position.y = 0.12; kid.add(body);
        const deck = new T.Mesh(new T.BoxGeometry(0.14, 0.04, 0.8), iron); deck.position.y = 0.1; kid.add(deck);
        const bar = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.9, 5), iron); bar.position.set(0, 0.55, 0.42); kid.add(bar);
        k.add(kid); k.rider(kid, loop, 3.4, 90 + i * 55);
      }
      const perches = [-44, -30, -18, 12, 26, 40];
      perches.forEach((px, i) => {
        k.prop('gull', px, 1.28, -4.5, { height: 0.34, rotY: PI * (i % 2 ? 0.85 : 1.15) }).then((g) => {
          if (!g) return;
          const home = g.position.clone(); let fly = -1, ph = i * 1.3;
          k.ticks.push((t, dt) => {
            const cam = camera();
            if (fly < 0 && cam && Math.hypot(cam.position.x - home.x, cam.position.z - home.z) < 4.2) fly = 0;
            if (fly < 0) return;
            fly += dt;
            const T0 = 9, u = fly / T0;
            if (u >= 1) { fly = -1; g.position.copy(home); g.rotation.set(0, PI * (i % 2 ? 0.85 : 1.15), 0); return; }
            const a = u * PI * 2 + ph, r = 6 * Math.sin(u * PI), h = 4.5 * Math.sin(u * PI);
            g.position.set(home.x + Math.cos(a) * r, home.y + h, home.z - 2 - Math.abs(Math.sin(a)) * r);
            g.rotation.set(0, -a + PI, 0.25 * Math.sin(t * 9));
          });
        });
      });
    }

    /* ---- what the Heights know ---- */
    const srcP = { name: 'Brooklyn Heights Promenade, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Heights_Promenade' };
    const srcB = { name: 'Brooklyn Queens Expressway, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn%E2%80%93Queens_Expressway' };
    k.egg(v(0, 1.3, -4.5), { id: 'prom-length', title: 'Remsen to Orange', text: 'The Promenade is a platform and pedestrian walkway 1,826 feet long, cantilevered over the Brooklyn Queens Expressway, Interstate 278. It runs from the west end of Remsen Street to the west end of Orange Street, with views of the Lower Manhattan skyline and New York Harbor.', clue: 'Lean on the railing halfway along the walk.', source: srcP }, { r: 1.8 });
    k.egg(v(46, 3.2, 8.6), { id: 'prom-opened', title: 'Two halves, two winters', year: '1950', text: 'The southern half of the Promenade opened to the public on October 7, 1950, and the northern half on December 7, 1951. It can be reached from Montague Street and Pierrepont Place and from the west ends of Pierrepont Street, Clark Street and Pineapple Street.', clue: 'The sign over the Montague Street entrance.', source: srcP }, { r: 2.0 });
    k.egg(v(-63, 2.6, 7), { id: 'prom-escarpment', title: 'The route the Heights chose', text: 'The leaders of the Brooklyn Heights Association, Roy M. D. Richardson and Ferdinand W. Nitardy among them, lobbied hard for a route that would move the highway westward to run along the escarpment above the water, and the engineers of Andrews and Clark, the firm commissioned to build it, supported that route because it cost less. The two tiered section in Brooklyn Heights that Robert Moses designed had originally been planned to go straight through Hicks Street.', clue: 'The pergola at the north end of the walk.', source: srcP }, { r: 2.0 });
    k.egg(v(-20, 0.6, -4.9), { id: 'prom-two-lanes', title: 'Two lanes each way', year: '2021', text: 'Since October 2021 the expressway under the Promenade has been reduced to two lanes in each direction between Atlantic Avenue and the Brooklyn Bridge. The road runs along the East River in Downtown Brooklyn and Brooklyn Heights and is partly covered to create the Promenade.', clue: 'Look down through the railing at the traffic on the decks.', source: srcB }, { r: 1.8 });
    k.egg(v(30, 0.6, -4.9), { id: 'prom-repair', title: 'The cantilever\'s next decade', year: '2017', text: 'In 2017 the city\'s Department of Transportation began a project to repair this section of the expressway, and in August 2026 the city government announced a proposal to spend about $4 billion repairing the existing cantilever over ten years.', clue: 'The railing over the decks, towards the Montague Street end.', source: srcB }, { r: 1.8 });
    k.egg(v(-6, 1.2, 4.6), { id: 'prom-park', title: 'A new foreground', text: 'With the construction of Brooklyn Bridge Park on the piers and the shore below, the foreground of the view from the Promenade was given a more landscape like look.', clue: 'Sit on a bench facing the harbour.', source: srcP }, { r: 1.6 });

    return { mounts, spawn: v(0, 3, 1.5), look: v(-30, 8, -200), eye: 3, bounds: [L0 + 1.2, L1 - 1.2, -4.3, 13.6], style: 'black' };
  },
};
