/* 161 to 163: three Manhattan synagogues, built the way a respectful visitor would photograph them.
   Safra on East 63rd Street, Shearith Israel on Central Park West, Park East on East 67th Street.
   The New Yorkers hang only where a congregation honestly shows art and people: the lobby, the
   vestibule, the corridors, the social hall, the school next door, and freestanding boards on the
   street front. Never on the ark wall, never in a sanctuary facing the congregation. No likeness of
   any real person, no lettered scripture: the tablets are blank, the ark curtains plain. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];

/* ---------------- shared helpers ---------------- */
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
const css = (n: number, k2 = 1) => `rgb(${(((n >> 16) & 255) * k2) | 0},${(((n >> 8) & 255) * k2) | 0},${((n & 255) * k2) | 0})`;
/* an arched window of coloured glass: transparent outside the arch, leaded panes inside */
function archGlass(seed: number, pal: number[], p: { cell?: number; lead?: string; medallion?: boolean; rose?: boolean } = {}) {
  const { cell = 22, lead = '#141210', medallion = true, rose = false } = p;
  const W = 256, H = rose ? 256 : 640;
  return canvasTex(W, H, (g) => {
    const rnd = X.mulberry(seed);
    g.save(); g.beginPath();
    if (rose) g.arc(W / 2, H / 2, W / 2 - 2, 0, PI * 2);
    else { g.moveTo(2, H); g.lineTo(2, W / 2); g.arc(W / 2, W / 2, W / 2 - 2, PI, 0); g.lineTo(W - 2, H); g.closePath(); }
    g.clip();
    g.fillStyle = lead; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += cell) for (let x = 0; x < W; x += cell) {
      const c = pal[Math.floor(rnd() * pal.length)];
      g.fillStyle = css(c, 0.8 + rnd() * 0.3);
      g.fillRect(x + 2, y + 2, cell - 4, cell - 4);
    }
    if (rose) {
      for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; g.strokeStyle = lead; g.lineWidth = 7; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + Math.cos(a) * W, H / 2 + Math.sin(a) * W); g.stroke(); }
      for (const r of [40, 82]) { g.lineWidth = 8; g.beginPath(); g.arc(W / 2, H / 2, r, 0, PI * 2); g.stroke(); }
      g.fillStyle = css(pal[0], 1.2); g.beginPath(); g.arc(W / 2, H / 2, 32, 0, PI * 2); g.fill();
    } else if (medallion) {
      for (const cy of [W * 0.62, H * 0.62]) {
        g.fillStyle = lead; g.beginPath(); g.arc(W / 2, cy, 62, 0, PI * 2); g.fill();
        g.fillStyle = css(pal[pal.length - 1], 1.1); g.beginPath(); g.arc(W / 2, cy, 54, 0, PI * 2); g.fill();
        g.fillStyle = css(pal[0], 1.15); g.beginPath();
        for (let q = 0; q < 12; q++) { const a = (q / 12) * PI * 2, rr = q % 2 ? 22 : 46; g.lineTo(W / 2 + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        g.closePath(); g.fill();
      }
    }
    g.restore();
    g.strokeStyle = lead; g.lineWidth = 10; g.beginPath();
    if (rose) g.arc(W / 2, H / 2, W / 2 - 5, 0, PI * 2);
    else { g.moveTo(5, H); g.lineTo(5, W / 2); g.arc(W / 2, W / 2, W / 2 - 5, PI, 0); g.lineTo(W - 5, H); }
    g.stroke();
  });
}
const glassMat = (t: T.Texture, tint = 0xffffff) => new T.MeshBasicMaterial({ map: t, color: tint, transparent: true, alphaTest: 0.1, side: T.DoubleSide });
/* a wall with round or horseshoe arched openings and round windows, one extrusion, centred on x, base at y 0 */
type Hole = { kind: 'arch'; cx: number; y0: number; w: number; h: number; shoe?: number } | { kind: 'circle'; cx: number; cy: number; r: number } | { kind: 'rect'; cx: number; y0: number; w: number; h: number };
function holedWall(w: number, h: number, depth: number, holes: Hole[]) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new T.Path();
    if (o.kind === 'circle') p.absarc(o.cx, o.cy, o.r, 0, PI * 2, false);
    else if (o.kind === 'rect') { p.moveTo(o.cx - o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0 + o.h); p.lineTo(o.cx - o.w / 2, o.y0 + o.h); p.closePath(); }
    else {
      /* shoe > 1 widens the arch beyond the legs: the Moorish horseshoe */
      const a = o.w / 2, R = a * (o.shoe ?? 1), cy = o.y0 + o.h - R, sd = Math.sqrt(Math.max(0, R * R - a * a)), d = Math.atan2(sd, a);
      p.moveTo(o.cx - a, o.y0); p.lineTo(o.cx - a, cy - sd);
      p.absarc(o.cx, cy, R, PI + d, -d, true);
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
/* a freestanding board on two posts on the pavement, facing +z */
function board(k: K, ms: Mount[], x: number, y0: number, z: number, w: number, h: number, style: FrameStyle, back: T.Material, post: T.Material) {
  const cy = y0 + 0.75 + h / 2 + 0.15;
  k.box(w + 0.3, h + 0.3, 0.12, x, cy, z, back);
  for (const s of [-1, 1]) { k.box(0.1, cy + h / 2, 0.1, x + s * (w / 2 + 0.05), y0 + (cy + h / 2 - y0) / 2, z - 0.1, post); k.box(0.5, 0.06, 0.5, x + s * (w / 2 + 0.05), y0 + 0.03, z - 0.1, post); }
  k.keepOut.push({ x, z: z - 0.1, r: 0.6 }, { x: x - w / 2, z: z - 0.1, r: 0.45 }, { x: x + w / 2, z: z - 0.1, r: 0.45 });
  hang(ms, x, cy, z + 0.08, 0, w, h, style, 3.2);
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
  /* side profiles extruded across the width: a body with hood and boot, a glass house with raked screens */
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
/* a row of New York house fronts: brownstone, brick and limestone, stoops and cornices; facing +z or -z */
function houses(k: K, x0: number, x1: number, z: number, facing: number, seed: number, p: { hMin?: number; hMax?: number; depth?: number } = {}) {
  const { hMin = 14, hMax = 20, depth = 12 } = p, rnd = X.mulberry(seed);
  const mats = [k.pbr('hsBrown' + seed, X.ashlar(0x6e4c3c, seed + 1, 6), 0.4, { normal: 0.4 }), k.pbr('hsBrick' + seed, X.brick(0x7a4032, seed + 2), 0.9), k.pbr('hsLime' + seed, X.ashlar(0xcdbfa4, seed + 3, 5), 0.35, { normal: 0.4 }), k.pbr('hsBrick2' + seed, X.brick(0x9a6a4e, seed + 4), 0.9)];
  const win = k.flat(0x1a2128, 0.6, 0.18), trim = k.flat(0xe8e2d4, 0, 0.6), corn = k.flat(0x4a4038, 0.2, 0.6), door = k.flat(0x2a1c14, 0, 0.5);
  let x = x0;
  while (x < x1 - 3) {
    const w = Math.min(x1 - x, 6 + Math.floor(rnd() * 3)), h = hMin + rnd() * (hMax - hMin), m = mats[Math.floor(rnd() * mats.length)], cx = x + w / 2;
    k.box(w, h, depth, cx, h / 2, z - facing * depth / 2, m);
    const floors = Math.floor((h - 1.5) / 3.3), cols = w > 7 ? 3 : 2;
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      const wx = x + ((c + 0.5) / cols) * w, wy = 2.4 + f * 3.3 + (f > 0 ? 0.6 : 0);
      if (f === 0 && c === 0) { k.box(1.3, 2.6, 0.1, wx, 1.3 + 0.9, z + facing * 0.02, door); for (let s = 0; s < 5; s++) k.box(1.8, 0.18, 0.36, wx, 0.09 + s * 0.18, z + facing * (0.18 + (4 - s) * 0.36), m); continue; }
      k.box(1.15, 1.9, 0.08, wx, wy, z + facing * 0.03, win);
      k.box(1.35, 0.14, 0.2, wx, wy + 1.02, z + facing * 0.08, trim);
    }
    k.box(w, 0.5, 0.7, cx, h - 0.25, z + facing * 0.3, corn);
    x += w;
  }
}
/* the eternal light: a bronze lamp on chains before the ark, a red flame, a light that breathes */
function nerTamid(k: K, ctx: C, x: number, y: number, z: number, top: number, bronze: T.Material) {
  for (const a of [0, 2.1, 4.2]) k.beam(v(x + Math.cos(a) * 0.22, y + 0.2, z + Math.sin(a) * 0.22), v(x, top, z), 0.012, bronze, 4);
  k.lathe([[0.02, -0.34], [0.12, -0.26], [0.24, -0.08], [0.26, 0.12], [0.2, 0.2], [0.22, 0.24], [0.02, 0.26]], x, y, z, bronze, 16);
  const flameM = new T.MeshBasicMaterial({ color: 0xff4a24, transparent: true, opacity: 0.95 });
  const flame = k.mesh(new T.SphereGeometry(0.15, 12, 10), flameM, x, y + 0.2, z, true);
  const L = k.point(x, y - 0.1, z + 0.3, 0xff6a30, 5, 9, 2);
  if (!ctx.reduced) k.ticks.push((t) => { const f = 0.86 + 0.08 * Math.sin(t * 6.1) + 0.06 * Math.sin(t * 13.7 + 1.3); L.intensity = 5 * f; flame.scale.setScalar(0.94 + 0.08 * f); });
  return flame;
}
/* a brass ring chandelier with candle bulbs; the bulbs are one instanced glow */
function chandelier(k: K, x: number, y: number, z: number, r: number, arms: number, brass: T.Material, top: number, bulbs: { x: number; y: number; z: number }[]) {
  k.beam(v(x, y + 0.6, z), v(x, top, z), 0.03, brass, 5);
  k.torus(r, 0.05, x, y, z, brass, 32).rotation.x = PI / 2;
  k.torus(r * 0.55, 0.04, x, y - 0.35, z, brass, 24).rotation.x = PI / 2;
  k.lathe([[0.02, -0.7], [0.14, -0.5], [0.18, -0.2], [0.1, 0.2], [0.05, 0.6]], x, y, z, brass, 12);
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * PI * 2, bx = x + Math.cos(a) * r, bz = z + Math.sin(a) * r;
    k.beam(v(x, y - 0.35, z), v(bx, y, bz), 0.025, brass, 4);
    k.cyl(0.035, 0.22, bx, y + 0.13, bz, brass, 0.035, 6);
    bulbs.push({ x: bx, y: y + 0.3, z: bz });
  }
}
function bulbsMesh(k: K, bulbs: { x: number; y: number; z: number }[], color = 0xffe2a8, size = 0.07) {
  if (!bulbs.length) return;
  k.instances(new T.SphereGeometry(size, 8, 6), new T.MeshBasicMaterial({ color }), bulbs.map((b) => new T.Matrix4().makeTranslation(b.x, b.y, b.z)));
}
/* people sitting or standing still: one instanced figure each, dark clothes */
function still(k: K, pts: { x: number; y: number; z: number; ry: number; sit?: boolean }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0]) {
  if (!pts.length) return;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y + (p.sit ? 0.12 : 0), p.z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), p.ry), v(1, p.sit ? 0.82 : 1.1 + rnd() * 0.12, 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
}
/* pigeons: some pecking on the pavement, a flock wheeling overhead */
function pigeons(k: K, ctx: C, ground: T.Vector3[], flock: { x: number; y: number; z: number; r: number; n: number }, seed: number) {
  const g = new T.SphereGeometry(0.12, 8, 6); g.scale(1, 0.8, 1.7);
  const n = ground.length + flock.n, rnd = X.mulberry(seed);
  const o = k.instances(g, new T.MeshStandardMaterial({ color: 0x6a6e78, roughness: 0.8 }), Array.from({ length: n }, () => new T.Matrix4()));
  o.frustumCulled = false;
  const ph = Array.from({ length: n }, () => rnd() * 10), m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = v(0, 1, 0), one = v(1, 1, 1);
  const place = (t: number) => {
    ground.forEach((b, i) => {
      const peck = Math.max(0, Math.sin(t * 3 + ph[i] * 5)) * 0.06, turn = Math.floor((t * 0.3 + ph[i]) % 4) * 1.3 + ph[i];
      p.set(b.x + Math.sin(t * 0.2 + ph[i]) * 0.3, b.y + 0.12 - peck, b.z + Math.cos(t * 0.17 + ph[i]) * 0.3);
      q.setFromAxisAngle(up, turn); m.compose(p, q, one); o.setMatrixAt(i, m);
    });
    for (let j = 0; j < flock.n; j++) {
      const i = ground.length + j, a = t * 0.45 + (j / flock.n) * 1.4 + ph[i] * 0.05;
      p.set(flock.x + Math.cos(a) * (flock.r + ph[i] * 0.4), flock.y + Math.sin(t * 0.8 + ph[i]) * 1.2, flock.z + Math.sin(a) * (flock.r * 0.6 + ph[i] * 0.3));
      q.setFromAxisAngle(up, -a); m.compose(p, q, one); o.setMatrixAt(i, m);
    }
    o.instanceMatrix.needsUpdate = true;
  };
  place(3);
  if (!ctx.reduced) k.ticks.push(place);
}
/* blank tablets of the law over an ark: two round topped stones, no letters */
function tablets(k: K, x: number, y: number, z: number, stone: T.Material, edge: T.Material, s = 1, rotY = 0) {
  const shape = new T.Shape(); const w = 0.5 * s, h = 1.0 * s;
  shape.moveTo(-w, 0); shape.lineTo(w, 0); shape.lineTo(w, h - w); shape.absarc(0, h - w, w, 0, PI, false); shape.closePath();
  const g = new T.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 12 });
  for (const d of [-1, 1]) {
    const o = k.mesh(g, stone, x + Math.cos(rotY) * d * (w + 0.06), y, z - Math.sin(rotY) * d * (w + 0.06));
    o.rotation.y = rotY;
  }
  const r = k.box(2 * (2 * w + 0.12) + 0.1, 0.08, 0.2, x, y - 0.04, z, edge); r.rotation.y = rotY;
}

/* ================================================================== */
/* ---------------- 161 SAFRA SYNAGOGUE ---------------- */
export const safra: RoomDef = {
  id: 'safra',
  name: 'Jerusalem stone on 63rd',
  area: 'SAFRA SYNAGOGUE / EAST 63RD STREET',
  mood: 'Friday afternoon, stone and light',
  color: '#c9b89a',
  daylit: true,
  description: 'The Edmond J. Safra Synagogue, a Beaux-Arts house of Jerusalem stone on a townhouse block off Fifth Avenue, home since 2003 to a Sephardic congregation. You stand in the stone lobby inside the bronze doors, with the sanctuary open ahead: the reader\'s platform in the middle of the room, the benches around it, the ark and its lamp at the far end, and daylight falling from the oval in the ceiling. The New Yorkers hang in the lobby and in the social hall beside it, never in the sanctuary.',
  signatures: 'The Jerusalem stone front with its rusticated base, arched bronze doors and tall arched window, the stone lobby, the sanctuary with the central reader\'s platform, the benches facing it, the women\'s gallery on stone columns, the oval skylight in the coffered ceiling, the wooden ark with blank tablets and the eternal light, the social hall, and the brownstones of East 63rd Street across the road.',
  build(k, ctx) {
    k.sky({ top: 0x4f88d0, horizon: 0xd8e4ee, ground: 0x8a8478, fog: 0.0028, sun: { az: 2.2, el: 0.75, color: 0xfff4e0, size: 8 }, env: 0.6 });
    k.hemi(0xe8e4dc, 0x8a8478, 0.9);
    k.sun(0xfff0d8, 2.6, 30, 70, 40, true, 60);
    const jer = k.pbr('sfJer', X.ashlar(0xd6c298, 161, 6), 0.6, { normal: 0.3, roughness: 0.85 }),
      jerPlain = k.pbr('sfJer2', X.plaster(0xe2d3b0, 162), 0.3, { roughness: 0.85 }),
      jerDark = k.pbr('sfJer3', X.ashlar(0xbca880, 163, 4), 0.6, { normal: 0.35, roughness: 0.9 }),
      floorM = k.pbr('sfFloor', X.marble(0xb4a68a, 0x8a7a5e, 164), 0.28, { roughness: 0.4 }),
      wood = k.pbr('sfWood', X.planks(0x6a4428, 6, 165), 0.8, { roughness: 0.55 }), woodDark = k.flat(0x3e2616, 0, 0.5),
      bronze = k.flat(0x8a6434, 0.9, 0.36), brass = k.flat(0xc8a050, 1, 0.3),
      asph = k.pbr('sfAsph', X.asphalt(), 0.3), walk = k.pbr('sfWalk', X.pavers(0x9a968c, 166), 0.5), curb = k.flat(0x8a8680, 0, 0.8),
      darkGlass = k.flat(0x2c3640, 0.35, 0.22), iron = k.flat(0x1c1c1c, 0.6, 0.5), cloth = k.flat(0xe8e2d4, 0, 0.9), line = k.flat(0xe8e4d8, 0, 0.8);
    const bulbs: { x: number; y: number; z: number }[] = [];
    /* ---- East 63rd Street: pavement, road, the far pavement, brownstones opposite ---- */
    k.box(60, 0.2, 4.5, 0, -0.1, 2.25, walk); k.box(60, 0.2, 8, 0, -0.14, 8.5, asph); k.box(60, 0.2, 4.5, 0, -0.1, 14.75, walk);
    for (const z of [4.5, 12.5]) k.box(60, 0.18, 0.25, 0, -0.02, z, curb);
    for (let x = -28; x < 28; x += 3.2) k.box(1.6, 0.012, 0.12, x, 0.005, 8.5, line);
    houses(k, -34, 34, 17, -1, 630, { hMin: 15, hMax: 22 });
    houses(k, -34, -12, 0, 1, 640, { hMin: 18, hMax: 22 });
    houses(k, 12.2, 34, 0, 1, 650, { hMin: 17, hMax: 23 });
    k.block(-30, -12.1, -45, 0.4); k.block(12.1, 30, -45, 0.4);
    for (const [x, z] of [[-17, 3.4], [17.5, 3.4], [-19, 13.6], [-6, 13.6], [7, 13.6], [20, 13.6]]) { k.tree(x, 0, z, { h: 5.5, r: 2, seed: 161 }); k.box(1.4, 0.06, 1.4, x, 0.03, z, iron); k.keepOut.push({ x, z, r: 0.8 }); }
    traffic(k, ctx, { lanes: [{ z: 7.2, dir: -1, n: 4, speed: 7 }, { z: 9.8, dir: -1, n: 3, speed: 8 }, { z: 5.5, dir: 0, n: 5 }, { z: 11.6, dir: 0, n: 6 }], x0: -34, x1: 34, seed: 1612 });
    k.crowd([v(-30, 0, 2.6), v(30, 0, 2.6)], 7, { seed: 1613, spread: 1.4, animate: !ctx.reduced, speed: 1.0 });
    k.crowd([v(-30, 0, 14.6), v(30, 0, 14.6)], 8, { seed: 1614, spread: 1.6, animate: !ctx.reduced, speed: 1.1 });
    /* ---- the front: Jerusalem stone, 24 m wide, 20 m up ---- */
    const FW = 24, FH = 20;
    const front = holedWall(FW, FH, 0.6, [
      { kind: 'arch', cx: 0, y0: 0, w: 3, h: 5.2 },
      { kind: 'arch', cx: 0, y0: 7.4, w: 4, h: 7.4 },
      { kind: 'arch', cx: -6.6, y0: 1.2, w: 1.8, h: 3.2 }, { kind: 'arch', cx: 6.6, y0: 1.2, w: 1.8, h: 3.2 },
      { kind: 'rect', cx: -7.4, y0: 8.2, w: 2, h: 4.4 }, { kind: 'rect', cx: 7.4, y0: 8.2, w: 2, h: 4.4 },
      ...[-7.4, -3, 3, 7.4].map((cx) => ({ kind: 'rect' as const, cx, y0: 16.6, w: 1.4, h: 1.6 })),
    ]);
    k.mesh(front, jer, 0, 0, -0.3);
    /* rustication grooves on the base, pilasters, cornice, balustrade */
    for (let y = 0.7; y < 6; y += 0.72) for (const [a, b] of [[-12, -7.6], [-5.6, -1.9], [1.9, 5.6], [7.6, 12]]) k.box(b - a, 0.06, 0.05, (a + b) / 2, y, 0.02, jerDark);
    k.box(FW + 0.4, 0.5, 0.5, 0, 6.2, 0.1, jerDark);
    for (const x of [-10.6, -4, 4, 10.6]) { k.box(1.1, 8.6, 0.35, x, 10.6, 0.15, jer); k.box(1.4, 0.5, 0.5, x, 15.1, 0.2, jerDark); }
    k.moulding([[0, 0], [0.9, 0], [0.9, 0.3], [0.6, 0.55], [0.3, 0.7], [0, 0.72]], FW + 0.8, 0, 15.4, 0, jerDark, -PI / 2);
    k.box(FW + 0.6, 0.35, 0.8, 0, 19.2, 0.1, jerDark);
    for (let x = -11.5; x <= 11.5; x += 0.55) k.cyl(0.1, 0.8, x, 19.8, 0.1, jer, 0.14, 8);
    k.box(FW + 0.6, 0.2, 0.6, 0, 20.3, 0.1, jerDark);
    /* the arch mouldings round the door and the great window, a keystone each */
    for (const [cy, r] of [[5.2 - 1.5, 1.5], [14.8 - 2, 2]] as [number, number][]) {
      for (let i = 0; i < 13; i++) { const a = (i + 0.5) / 13 * PI, s = k.box(r * PI / 13 + 0.02, 0.32, 0.25, Math.cos(a) * (r + 0.16), cy + Math.sin(a) * (r + 0.16), 0.1, i === 6 ? jerDark : jer); s.rotation.z = a + PI / 2; }
    }
    /* glass in every window, dark; iron grilles on the ground floor */
    k.plane(4, 7.4, 0, 7.4 + 3.7, -0.28, darkGlass); k.plane(1.8, 3.2, -6.6, 2.8, -0.28, darkGlass); k.plane(1.8, 3.2, 6.6, 2.8, -0.28, darkGlass);
    for (const x of [-7.4, 7.4]) k.plane(2, 4.4, x, 10.4, -0.28, darkGlass);
    for (const x of [-7.4, -3, 3, 7.4]) k.plane(1.4, 1.6, x, 17.4, -0.28, darkGlass);
    for (const cx of [-6.6, 6.6]) for (let i = -3; i <= 3; i++) k.box(0.04, 3.1, 0.04, cx + i * 0.26, 2.75, 0.02, iron);
    for (let i = -4; i <= 4; i++) k.box(0.04, 5.5, 0.04, i * 0.45, 11, -0.2, bronze);
    k.sign('EDMOND J. SAFRA SYNAGOGUE', 9, 0.7, 0, 6.72, 0.36, 'transparent', '#5a4a30', 58);
    k.block(-12.1, -1.5, -0.9, 0.35); k.block(1.5, 12.1, -0.9, 0.35);
    /* the bronze doors, open inward, a tree worked in low relief; one leaf moves in the draught of people passing */
    const treeTex = canvasTex(128, 256, (g) => {
      g.fillStyle = '#6a4a26'; g.fillRect(0, 0, 128, 256);
      g.strokeStyle = '#a07a40'; g.lineWidth = 5; g.strokeRect(8, 8, 112, 240);
      g.lineWidth = 4; g.beginPath(); g.moveTo(64, 236); g.lineTo(64, 90);
      for (let i = 0; i < 6; i++) { const y = 200 - i * 22; g.moveTo(64, y); g.quadraticCurveTo(64 - 30, y - 12, 64 - 40 + i * 3, y - 34); g.moveTo(64, y); g.quadraticCurveTo(64 + 30, y - 12, 64 + 40 - i * 3, y - 34); }
      g.stroke();
      g.fillStyle = '#b8904a'; for (let i = 0; i < 40; i++) { const a = i * 2.4, r = 10 + (i % 7) * 7; g.beginPath(); g.arc(64 + Math.cos(a) * r, 80 + Math.sin(a) * r * 0.9, 4, 0, PI * 2); g.fill(); }
    });
    const doorM = new T.MeshStandardMaterial({ map: treeTex, metalness: 0.85, roughness: 0.4 });
    const leaves: T.Group[] = [];
    for (const s of [-1, 1]) {
      const g = new T.Group(); g.position.set(s * 1.5, 0, -0.6);
      const leaf = new T.Mesh(new T.BoxGeometry(1.45, 4.4, 0.1), doorM); leaf.position.set(-s * 0.72, 2.2, 0); g.add(leaf);
      g.rotation.y = s * 1.45; k.add(g); leaves.push(g);
    }
    if (!ctx.reduced) k.ticks.push((t) => { leaves[1].rotation.y = 1.25 + 0.2 * Math.max(0, Math.sin(t * 0.35)); });
    /* ---- the lobby: 10 m by 12 m of stone, seven metres high ---- */
    k.box(10, 0.1, 12.2, 0, 0.0, -6.4, floorM);
    k.box(2.6, 0.02, 11.4, 0, 0.06, -6.3, k.flat(0x7a6446, 0, 0.35));
    wallZ(k, -12, -0.6, -5, 7, 0.4, jer);
    wallZ(k, -12, -0.6, 5, 7, 0.4, jer, [{ c: -6.3, w: 2.2, h: 3.2 }]);
    k.box(10.4, 0.4, 12.4, 0, 7.2, -6.3, jerPlain);
    for (const z of [-3, -6.3, -9.6]) k.box(10, 0.3, 0.3, 0, 6.85, z, jerDark);
    for (const z of [-3, -9.6]) { k.cyl(0.02, 1.4, 0, 6.3, z, bronze); k.lathe([[0.05, 0], [0.32, -0.12], [0.36, -0.3], [0.06, -0.4]], 0, 5.6, z, bronze, 16); bulbs.push({ x: 0, y: 5.25, z }); }
    k.point(0, 5, -4.5, 0xffdcaa, 16, 14); k.point(0, 5, -9.5, 0xffdcaa, 14, 12);
    /* the wall between the lobby and the sanctuary: a wide arched opening, bronze doors folded back */
    wallX(k, -11, 11, -12, 15, 0.5, jer, [{ c: 0, w: 4.4, h: 5 }]);
    k.box(5.4, 0.5, 0.8, 0, 5.25, -12, jerDark); k.box(6.0, 0.25, 0.9, 0, 5.62, -12, jerDark);
    for (const x of [-2.45, 2.45]) k.box(0.5, 5, 0.8, x, 2.5, -12, jerDark);
    for (const s of [-1, 1]) { const d = k.box(0.1, 4.8, 2.1, s * 2.25, 2.4, -11.0, doorM); d.rotation.y = 0; }
    /* ---- the social hall, to the right: tables laid, a tea urn, the census wall ---- */
    k.box(6.6, 0.1, 11.6, 8.2, 0.0, -6.3, k.pbr('sfHallF', X.planks(0x8a6a48, 8, 167), 0.6, { roughness: 0.5 }));
    wallZ(k, -12, -0.6, 11.6, 4.8, 0.4, jerPlain);
    k.box(7, 0.3, 11.6, 8.3, 4.95, -6.3, jerPlain);
    for (const [x, z] of [[6.9, -3.6], [6.9, -7.2]]) {
      k.cyl(0.85, 0.05, x, 0.76, z, cloth, 0.85, 20); k.cyl(0.07, 0.74, x, 0.37, z, iron);
      for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; k.box(0.42, 0.45, 0.42, x + Math.cos(a) * 1.2, 0.23, z + Math.sin(a) * 1.2, woodDark); k.box(0.42, 0.5, 0.06, x + Math.cos(a) * 1.42, 0.7, z + Math.sin(a) * 1.42, woodDark).rotation.y = PI / 2 - a; }
      k.keepOut.push({ x, z, r: 1.45 });
    }
    k.box(2.2, 0.9, 0.6, 9.8, 0.45, -11.4, woodDark); k.lathe([[0.18, 0], [0.24, 0.1], [0.24, 0.4], [0.12, 0.55], [0.03, 0.62]], 9.4, 0.9, -11.4, k.flat(0xb8bcc0, 1, 0.25), 14);
    k.point(8.3, 3.8, -6.3, 0xffe2b8, 10, 10);
    /* ---- the sanctuary: 22 by 26 m, fifteen high ---- */
    const Z0 = -12.25, Z1 = -38, SW = 11, SH = 15, GY = 5.0;
    k.box(2 * SW, 0.1, Z0 - Z1, 0, 0, (Z0 + Z1) / 2, floorM);
    wallZ(k, Z1, Z0, -SW, SH, 0.5, jerPlain); wallZ(k, Z1, Z0, SW, SH, 0.5, jerPlain);
    wallX(k, -SW, SW, Z1, SH, 0.5, jer);
    k.box(2 * SW + 1, 0.6, Z0 - Z1 + 1, 0, SH + 0.3, (Z0 + Z1) / 2, jerPlain);
    /* the lower walls in coursed stone, the upper walls plain, arched windows above the gallery */
    for (const s of [-1, 1]) k.box(0.1, GY, Z0 - Z1, s * (SW - 0.3), GY / 2, (Z0 + Z1) / 2, jer);
    const winTex = archGlass(1611, [0xf4ecd8, 0xece2c8, 0xe0d4b4, 0xf8f2e2, 0xd8c8a0], { cell: 32, lead: '#8a7a5a', medallion: false });
    const winM = glassMat(winTex, 0xffffff);
    for (const s of [-1, 1]) for (const z of [-16.5, -21.5, -26.5, -31.5]) { k.plane(2.4, 6, s * (SW - 0.26), 10.6, z, winM, -s * PI / 2); k.box(0.3, 0.3, 2.9, s * (SW - 0.3), 7.5, z, jerDark); }
    /* the gallery on three sides, on stone columns, with a wooden balustrade */
    const colM = k.pbr('sfCol', X.marble(0xe2d6b8, 0xb8a888, 168), 0.4, { roughness: 0.3 });
    for (const s of [-1, 1]) {
      k.box(3, 0.35, Z0 - Z1 - 3.2, s * (SW - 1.5), GY, (Z0 + Z1 - 3.2) / 2 - 0.2, jerPlain);
      k.box(0.15, 1.05, Z0 - Z1 - 3.2, s * (SW - 3), GY + 0.7, (Z0 + Z1 - 3.2) / 2 - 0.2, wood);
      k.box(0.22, 0.08, Z0 - Z1 - 3.2, s * (SW - 3), GY + 1.26, (Z0 + Z1 - 3.2) / 2 - 0.2, brass);
      for (const z of [-15.5, -20.3, -25.1, -29.9, -34.7]) { k.column(s * (SW - 3), 0, z, GY - 0.18, 0.24, colM); k.keepOut.push({ x: s * (SW - 3), z, r: 0.5 }); }
    }
    k.box(2 * SW, 0.35, 3, 0, GY, Z0 - 1.5, jerPlain); k.box(2 * SW - 6, 1.05, 0.15, 0, GY + 0.7, Z0 - 3, wood); k.box(2 * SW - 6, 0.08, 0.22, 0, GY + 1.26, Z0 - 3, brass);
    for (const x of [-6, 6]) { k.column(x, 0, Z0 - 3, GY - 0.18, 0.24, colM); k.keepOut.push({ x, z: Z0 - 3, r: 0.5 }); }
    /* the coffered ceiling and the oval of light over the reader's platform */
    for (let x = -9; x <= 9; x += 3) k.box(0.35, 0.6, Z0 - Z1, x, SH - 0.3, (Z0 + Z1) / 2, jerDark);
    for (let z = Z0 - 1.5; z > Z1; z -= 3) k.box(2 * SW, 0.6, 0.35, 0, SH - 0.3, z, jerDark);
    const CZ = -25.5;
    { const g = new T.CircleGeometry(1, 48); g.rotateX(PI / 2); g.scale(5.2, 1, 7.4); k.mesh(g, jerPlain, 0, SH - 0.62, CZ); }
    { const g = new T.CircleGeometry(1, 48); g.rotateX(PI / 2); g.scale(4.4, 1, 6.6); k.mesh(g, k.glow(0xf2f4f6), 0, SH - 0.66, CZ); }
    { const g = new T.TorusGeometry(1, 0.06, 6, 64); g.rotateX(PI / 2); g.scale(4.5, 3, 6.7); k.mesh(g, brass, 0, SH - 0.7, CZ); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI; const b = k.box(0.08, 0.06, 13.2, 0, SH - 0.68, CZ, k.flat(0xd8ccb0, 0, 0.6)); b.rotation.y = a; b.scale.set(1, 1, 2 / Math.sqrt((Math.sin(a) / 4.4) ** 2 + (Math.cos(a) / 6.6) ** 2) / 13.2); }
    /* a soft shaft of daylight down onto the platform */
    { const g = new T.CylinderGeometry(4.3, 3.2, SH - 1.2, 32, 1, true); g.scale(1, 1, 1.45); const m = new T.MeshBasicMaterial({ color: 0xfff4dc, transparent: true, opacity: 0.025, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }); k.mesh(g, m, 0, (SH - 1.2) / 2, CZ, true); }
    k.point(0, 11, CZ, 0xfff6e8, 45, 26, 1.6);
    /* the reader's platform in the middle, rails of wood and brass, a lamp at each corner */
    k.box(6.2, 0.6, 4.6, 0, 0.3, CZ, wood); k.box(6.4, 0.08, 4.8, 0, 0.62, CZ, woodDark);
    for (const [w, d, x, z] of [[6.2, 0.12, 0, CZ - 2.3], [2, 0.12, -2.1, CZ + 2.3], [2, 0.12, 2.1, CZ + 2.3], [0.12, 4.6, -3.1, CZ], [0.12, 4.6, 3.1, CZ]] as number[][]) { k.box(w, 1.0, d, x, 1.1, z, wood); k.box(w + 0.06, 0.07, d + 0.1, x, 1.63, z, brass); }
    k.box(1.6, 1.1, 1.0, 0, 1.15, CZ - 0.6, woodDark); { const top = k.box(1.8, 0.08, 1.2, 0, 1.78, CZ - 0.6, wood); top.rotation.x = -0.25; }
    for (const [x, z] of [[-3.1, CZ - 2.3], [3.1, CZ - 2.3], [-3.1, CZ + 2.3], [3.1, CZ + 2.3]]) { k.cyl(0.04, 1.2, x, 2.2, z, brass); bulbs.push({ x, y: 2.9, z }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) k.box(1.4, 0.2, 0.34, 0, 0.1 + i * 0.2, CZ + s * (2.3 + 0.34 * (3 - i)), wood);
    k.block(-3.3, 3.3, CZ - 2.5, CZ + 2.5);
    /* the benches round the platform, facing it, and the congregation on them */
    const seated: { x: number; y: number; z: number; ry: number; sit?: boolean }[] = [];
    const rnd = X.mulberry(1615);
    for (const s of [-1, 1]) for (let r = 0; r < 3; r++) {
      const x = s * (4.6 + r * 1.2);
      for (const [za, zb] of [[-15.6, -24], [-27, -34.8]]) {
        const zc = (za + zb) / 2, L = za - zb;
        k.box(0.5, 0.08, L, x, 0.46, zc, wood); k.box(0.08, 0.95, L, x + s * 0.28, 0.72, zc, woodDark); k.box(0.46, 0.42, L, x, 0.21, zc, woodDark);
        for (let z = za - 0.5; z > zb; z -= 0.7) if (rnd() < 0.34) seated.push({ x: x - s * 0.02, y: 0.28, z, ry: s > 0 ? -PI / 2 : PI / 2, sit: true });
      }
    }
    for (const s of [-1, 1]) k.block(s > 0 ? 4.2 : -7.4, s > 0 ? 7.4 : -4.2, -35, -15.4);
    still(k, seated, 1616);
    /* the ark at the east wall: steps, a stone arch, wooden doors, blank tablets, the eternal light */
    k.box(8, 0.3, 3, 0, 0.15, Z1 + 1.5, floorM); k.box(7, 0.3, 2.2, 0, 0.45, Z1 + 1.1, floorM); k.box(6, 0.3, 1.4, 0, 0.75, Z1 + 0.7, floorM);
    k.mesh(holedWall(7.4, 10.5, 0.8, [{ kind: 'arch', cx: 0, y0: 0, w: 3.8, h: 7.8 }]), jerDark, 0, 0.9, Z1 + 0.4);
    for (const x of [-3.1, 3.1]) k.column(x, 0.9, Z1 + 0.9, 7.4, 0.28, colM);
    k.box(3.8, 7.6, 0.2, 0, 0.9 + 3.8, Z1 + 0.15, woodDark);
    for (const x of [-0.95, 0.95]) { k.box(1.8, 5.8, 0.08, x, 0.9 + 3.3, Z1 + 0.29, wood); for (const y of [2.2, 4.4]) k.box(1.2, 0.05, 0.03, x, 0.9 + y, Z1 + 0.34, brass); }
    k.box(0.05, 5.8, 0.1, 0, 0.9 + 3.3, Z1 + 0.34, brass);
    tablets(k, 0, 10.2, Z1 + 0.55, k.flat(0xf0e8d6, 0, 0.5), brass, 1.1);
    k.block(-4.2, 4.2, Z1 - 1, Z1 + 3.1);
    nerTamid(k, ctx, 0, 7.4, Z1 + 3.6, SH, brass);
    k.point(0, 6, Z1 + 5, 0xffd8a0, 14, 12);
    /* chandeliers down both sides of the oval */
    for (const x of [-5.5, 5.5]) for (const z of [-17.5, -33]) chandelier(k, x, 9.5, z, 1.1, 8, brass, SH - 0.6, bulbs);
    bulbsMesh(k, bulbs);
    k.point(-5.5, 9, -24, 0xffe0b0, 12, 16); k.point(5.5, 9, -24, 0xffe0b0, 12, 16);
    /* congregants arriving from the street, through the lobby, into the sanctuary */
    k.crowd([v(-16, 0, 3), v(-5, 0, 2.6), v(0, 0, 1.6), v(0, 0, -2.4), v(0.6, 0, -8), v(0, 0, -13.6), v(-1.8, 0, -16), v(-2.4, 0, -21)], 9, { seed: 1617, spread: 0.7, speed: 0.8, animate: !ctx.reduced, colors: [0x1c1e24, 0x2a2e38, 0x1a1a1c, 0x3a3230, 0xe0dcd0, 0x2c3a4a] });
    /* ---- the works: lobby walls, the social hall ---- */
    const mounts: Mount[] = [], st: FrameStyle = 'gilt';
    for (const z of [-2.8, -6.3, -9.8]) hang(mounts, -4.77, 2.5, z, PI / 2, 2.4, 1.8, st);
    for (const z of [-2.8, -9.8]) hang(mounts, 4.77, 2.5, z, -PI / 2, 2.4, 1.8, st);
    for (const x of [-3.6, 3.6]) hang(mounts, x, 2.5, -11.72, 0, 2.0, 1.5, st);
    for (const x of [-3.35, 3.35]) hang(mounts, x, 2.5, -0.63, PI, 2.0, 1.5, st);
    for (const z of [-3, -6.3, -9.6]) hang(mounts, 11.37, 2.3, z, -PI / 2, 2.2, 1.6, st, 2.2);
    for (const x of [6.8, 9.8]) hang(mounts, x, 2.3, -11.72, 0, 1.8, 1.35, st, 2.6);
    k.censusWall({ x: 8.3, y: 2.3, z: -0.63, rotY: PI, cols: 10, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(4300, 50), pieces: ctx.all, backing: jerDark });
    /* ---- what the house knows ---- */
    const src = { name: 'Edmond J. Safra Synagogue (Manhattan), Wikipedia', url: 'https://en.wikipedia.org/wiki/Edmond_J._Safra_Synagogue_(Manhattan)' };
    k.egg(v(0, 11, -0.2), { id: 'safra-despont', title: 'Beaux-Arts, new', year: '2002', text: 'The synagogue was designed by the architect Thierry Despont as a work of Beaux-Arts revival, and the building was completed in December 2002, on East 63rd Street between Madison and Fifth Avenues.', clue: 'Look up at the great arched window and ask how old the style is, and how old the stone.', source: src }, { r: 2.4 });
    k.egg(v(-4.9, 5.4, -6.3), { id: 'safra-jerusalem-stone', title: 'Stone from Judea', text: 'Both the facade and the interior are built of Jerusalem stone, quarried in Judea, which gives the whole house its warm pale gold.', clue: 'Put a hand on the lobby wall.', source: src }, { r: 1.2 });
    k.egg(v(1.5, 2.4, -1.4), { id: 'safra-bronze-doors', title: 'The Tree of Life doors', text: 'The bronze front doors carry a Tree of Life motif made by the sculptor Mark Beard.', clue: 'The way in is worked in bronze. Look at the doors you walked through.', source: src }, { r: 1.2 });
    k.egg(v(0, 2.6, CZ - 0.6), { id: 'safra-beit-yaakov', title: 'Congregation Beit Yaakov', text: 'The congregation that prays here is Congregation Beit Yaakov, an Orthodox community of the Sephardi rite.', clue: 'Find the centre of the room, where the reading is done.', source: src }, { r: 1.4 });
    k.egg(v(-17, 2.5, 13.5), { id: 'safra-historic-district', title: 'A new building in an old district', year: '2003', text: 'The house stands in the Upper East Side Historic District, so its design needed the approval of the Landmarks Preservation Commission. It was officially inaugurated in October 2003.', clue: 'Cross the street and look at the whole block of old fronts it had to fit.', source: src }, { r: 1.6 });
    return { mounts, spawn: v(0, 3, -1.9), look: v(0, 4.6, -38), eye: 3, bounds: [-11.5, 11.5, -36.4, 16.2], style: 'gilt' };
  },
};

/* ================================================================== */
/* ---------------- 162 THE SPANISH AND PORTUGUESE SYNAGOGUE ---------------- */
export const shearith: RoomDef = {
  id: 'shearith',
  name: 'The oldest congregation',
  area: 'SHEARITH ISRAEL / CENTRAL PARK WEST',
  mood: 'Morning on the avenue, candles inside',
  color: '#b8a07a',
  daylit: true,
  description: 'Congregation Shearith Israel, founded in 1654 and the oldest Jewish congregation in the country, in its fifth home: Arnold Brunner\'s 1897 temple front on Central Park West, four giant Corinthian columns over a flight of stone steps, the park across the avenue. Inside, the reader\'s desk faces the ark down the length of a Tiffany room of marble, brass and candle light, and off the lobby the Small Synagogue keeps the colonial furniture of 1730. The New Yorkers hang on boards on the pavement, in the lobby and down the corridor to the parsonage house.',
  signatures: 'The Neoclassical front with four Corinthian columns, entablature and pediment on a flight of steps, Central Park West with its traffic and the park wall and trees opposite, the lobby, the sanctuary with the reader\'s desk and its four brass candlesticks facing the ark, the benches along the walls facing each other, the galleries on marble columns, the Tiffany windows, the brass candle chandeliers, the eternal light, and the Small Synagogue in the Georgian style.',
  build(k, ctx) {
    k.sky({ top: 0x3f86d8, horizon: 0xcfe0ee, ground: 0x8a8478, fog: 0.0024, sun: { az: 1.1, el: 0.62, color: 0xfff4de, size: 9 }, env: 0.65 });
    k.hemi(0xe4ecf8, 0x8a8478, 0.95);
    /* morning sun from the east, over the park, onto the front */
    k.sun(0xfff0d8, 2.6, 20, 55, 80, true, 70);
    const FY = 1.5;
    const floorY = (x: number, z: number) => {
      if (z < 0) return FY;
      if (Math.abs(x) <= 8 && z <= 2.6) return FY;
      if (Math.abs(x) <= 8 && z < 4.6) return FY * (4.6 - z) / 2;
      return 0;
    };
    const lime = k.pbr('siLime', X.ashlar(0xd6cdb8, 171, 5), 0.5, { normal: 0.45, roughness: 0.85 }),
      limeDark = k.pbr('siLime2', X.ashlar(0xbcb29c, 172, 4), 0.5, { normal: 0.5, roughness: 0.9 }),
      colM = k.pbr('siCol', X.plaster(0xddd4c0, 173), 0.3, { roughness: 0.8 }),
      marbleW = k.pbr('siMarb', X.marble(0xe4ddcc, 0xa89c84, 174), 0.3, { roughness: 0.3 }),
      marbleG = k.pbr('siMarbG', X.marble(0x8a9a88, 0x4a5a4a, 175), 0.4, { roughness: 0.3 }),
      marbleR = k.pbr('siMarbR', X.marble(0x9a6a5a, 0x5a3a30, 176), 0.4, { roughness: 0.3 }),
      sand = k.pbr('siSand', X.concrete(0xd8c49a, 177), 0.9, { roughness: 1 }),
      plaster = k.pbr('siPlas', X.plaster(0xece2cc, 178), 0.3, { roughness: 0.85 }), marbleWall = k.pbr('siMarbWall', X.marble(0xece2ca, 0xc4b494, 185), 0.7, { roughness: 0.45 }),
      wood = k.pbr('siWood', X.planks(0x5a3a22, 6, 179), 0.8, { roughness: 0.5 }), woodDark = k.flat(0x3a2414, 0, 0.5),
      brass = k.flat(0xc89a48, 1, 0.3), white = k.flat(0xe8e2d2, 0, 0.6), cream = k.flat(0xd8ceb4, 0, 0.7),
      asph = k.pbr('siAsph', X.asphalt(), 0.3), walk = k.pbr('siWalk', X.pavers(0x9c988e, 180), 0.5), curb = k.flat(0x8a8680, 0, 0.8),
      parkWall = k.pbr('siPark', X.ashlar(0x8a8274, 181, 3), 0.6, { normal: 0.6 }), iron = k.flat(0x1e2420, 0.5, 0.5), line = k.flat(0xe8e4d8, 0, 0.8), yellow = k.flat(0xd8b830, 0, 0.8),
      darkGlass = k.flat(0x2c3640, 0.35, 0.22), soil = k.flat(0x4a3e30, 0, 1);
    const bulbs: { x: number; y: number; z: number }[] = [];
    /* ---- Central Park West: the pavement, eight lanes of avenue, the park pavement, wall and trees ---- */
    k.box(70, 0.2, 6, 0, -0.1, 3, walk); k.box(70, 0.2, 13, 0, -0.14, 12.5, asph); k.box(70, 0.2, 4.5, 0, -0.1, 21.25, walk);
    for (const z of [6, 19]) k.box(70, 0.18, 0.25, 0, -0.02, z, curb);
    k.box(70, 0.012, 0.12, 0, 0.005, 12.4, yellow); k.box(70, 0.012, 0.12, 0, 0.005, 12.6, yellow);
    for (const z of [9.3, 15.7]) for (let x = -34; x < 34; x += 3.2) k.box(1.6, 0.012, 0.12, x, 0.005, z, line);
    k.box(70, 1.0, 0.6, 0, 0.5, 23.8, parkWall); k.box(70, 0.12, 0.8, 0, 1.06, 23.8, limeDark);
    k.box(70, 0.3, 20, 0, 0.3, 34, soil); k.box(70, 0.05, 20, 0, 0.47, 34, k.pbr('siGrass', X.grass(0x4b6b3a, 182), 0.5));
    for (let i = 0; i < 14; i++) { const x = -32 + i * 5 + ((i * 37) % 5) - 2, z = 26 + ((i * 53) % 9); k.tree(x, 0.45, z, { h: 7 + (i % 3) * 1.5, r: 3 + (i % 2), seed: 162 + i }); }
    /* park benches against the wall, merged into the static batch */
    for (const x of [-16, -8, 8, 16]) {
      for (let j = 0; j < 4; j++) k.box(2.2, 0.05, 0.12, x, 0.62, 22.08 + j * 0.15, wood);
      for (let j = 0; j < 3; j++) k.box(2.2, 0.13, 0.05, x, 0.85 + j * 0.15, 22.72 + j * 0.02, wood);
      for (const dx of [-0.9, 0.9]) { k.box(0.07, 0.6, 0.72, x + dx, 0.3, 22.35, iron); k.box(0.07, 0.65, 0.06, x + dx, 0.95, 22.76, iron); }
      k.keepOut.push({ x, z: 22.3, r: 0.9 });
    }
    for (const x of [-22, 22]) { k.lathe([[0.2, 0], [0.2, 0.08], [0.1, 0.16], [0.06, 3.9], [0.09, 4.0], [0.04, 4.2]], x, 0, 20.2, iron, 10); k.sphere(0.24, x, 4.35, 20.2, k.flat(0xf4ecd8, 0, 0.3), 12); k.keepOut.push({ x, z: 20.2, r: 0.4 }); }
    traffic(k, ctx, { lanes: [{ z: 8, dir: -1, n: 4, speed: 10 }, { z: 10.6, dir: -1, n: 4, speed: 9 }, { z: 14.4, dir: 1, n: 4, speed: 9 }, { z: 17, dir: 1, n: 4, speed: 10 }], x0: -38, x1: 38, seed: 1621 });
    k.crowd([v(-34, 0, 5.2), v(34, 0, 5.2)], 7, { seed: 1622, spread: 1.2, animate: !ctx.reduced });
    k.crowd([v(-34, 0, 20.6), v(34, 0, 20.6)], 8, { seed: 1623, spread: 1.4, animate: !ctx.reduced });
    /* neighbours on the avenue: apartment houses north and south */
    const winM = k.pbr('siWin', X.windows(1624, 0.08, 0x3a3a3c, true), 0.11, { roughness: 0.6, stretch: 0.42 });
    k.box(12, 44, 20, -33, 22, -10, winM); k.box(12.2, 1, 20.2, -33, 44.5, -10, limeDark);
    k.box(14, 38, 20, 34, 19, -10, winM); k.box(14.2, 1, 20.2, 34, 38.5, -10, limeDark);
    k.block(-40, -26.9, -40, 0.3); k.block(26.9, 40, -40, 0.3);
    /* the parsonage house of 1902 to the south, a limestone front */
    k.box(12, 16, 0.5, -20.5, 8, -0.25, lime);
    for (let f = 0; f < 4; f++) for (const x of [-24.5, -20.5, -16.5]) { k.box(1.3, 2.1, 0.1, x, 3 + f * 3.4, 0.02, darkGlass); k.box(1.6, 0.2, 0.25, x, 4.2 + f * 3.4, 0.1, limeDark); }
    k.box(12.4, 0.6, 0.8, -20.5, 16.1, 0.1, limeDark);
    k.block(-26.9, -14, -0.8, 0.35);
    /* the lower north wing, over the Small Synagogue */
    k.box(12.9, 11, 0.5, 20.45, 5.5, -0.25, lime); k.box(13.2, 0.6, 0.8, 20.45, 11.1, 0.1, limeDark);
    for (const x of [16, 20.5, 25]) { k.box(1.4, 3.4, 0.1, x, FY + 3.4, 0.02, darkGlass); k.box(1.4, 2.2, 0.1, x, 8.4, 0.02, darkGlass); k.box(1.8, 0.25, 0.3, x, FY + 5.3, 0.12, limeDark); }
    k.block(14, 26.9, -0.8, 0.35);
    /* the synagogue front: wings with tall windows, the portico of four columns on its steps */
    const front = holedWall(28, 16, 0.6, [
      { kind: 'arch', cx: 0, y0: FY, w: 2.4, h: 4.6 }, { kind: 'rect', cx: -3.6, y0: FY, w: 1.8, h: 3.8 }, { kind: 'rect', cx: 3.6, y0: FY, w: 1.8, h: 3.8 },
      { kind: 'arch', cx: -10.8, y0: 5.6, w: 2.2, h: 6.6 }, { kind: 'arch', cx: 10.8, y0: 5.6, w: 2.2, h: 6.6 },
      { kind: 'rect', cx: 0, y0: 8, w: 5, h: 3.4 },
    ]);
    k.mesh(front, lime, 0, 0, -0.3);
    for (const x of [-10.8, 10.8]) k.plane(2.2, 6.6, x, 5.6 + 3.3, -0.28, darkGlass);
    k.plane(5, 3.4, 0, 9.7, -0.28, darkGlass);
    for (const x of [-14, 14, -7.6, 7.6]) k.box(1.0, 16, 0.3, x, 8, 0.12, limeDark);
    k.box(28.4, 0.6, 0.9, 0, 16.1, 0.1, limeDark);
    for (let y = 0.6; y < FY + 3.5; y += 0.7) for (const [a, b] of [[-14, -8], [8, 14]]) k.box(b - a, 0.05, 0.05, (a + b) / 2, y, 0.02, limeDark);
    /* the stylobate and the steps */
    k.box(16, FY, 2.6, 0, FY / 2, 1.3, limeDark);
    for (let i = 0; i < 6; i++) { const h = FY - i * 0.25; k.box(16, 0.25, 0.34, 0, h - 0.125, 2.6 + i * 0.333 + 0.167, lime); k.box(16, h - 0.25 > 0 ? h - 0.25 : 0.01, 0.34, 0, (h - 0.25) / 2, 2.6 + i * 0.333 + 0.167, limeDark); }
    for (const s of [-1, 1]) { k.box(0.8, FY + 0.4, 4.8, s * 8.4, (FY + 0.4) / 2, 2.3, limeDark); k.block(s > 0 ? 8 : -8.9, s > 0 ? 8.9 : -8, 0, 4.7); }
    /* four giant Corinthian columns, entablature and pediment */
    const CH = 12;
    for (const x of [-5.4, -1.8, 1.8, 5.4]) {
      k.column(x, FY, 1.4, CH, 0.55, colM, true, lime);
      /* the Corinthian bell: a flared drum ringed with two rows of acanthus */
      k.lathe([[0.5, 0], [0.62, 0.5], [0.78, 1.05], [0.95, 1.2]], x, FY + CH - 1.2, 1.4, lime, 20);
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; for (const [r, y, hh] of [[0.62, 0.25, 0.55], [0.76, 0.7, 0.5]]) { const leaf = k.box(0.22, hh, 0.12, x + Math.cos(a + (y > 0.5 ? 0.39 : 0)) * r, FY + CH - 1.2 + y, 1.4 + Math.sin(a + (y > 0.5 ? 0.39 : 0)) * r, limeDark); leaf.rotation.y = -a + PI / 2; leaf.rotation.x = 0.25; } }
      k.box(1.9, 0.22, 1.9, x, FY + CH + 0.11, 1.4, lime);
      k.keepOut.push({ x, z: 1.4, r: 0.85 });
    }
    const EY = FY + CH + 0.22;
    k.box(15.4, 1.0, 2.8, 0, EY + 0.5, 1.2, lime); k.box(15.6, 0.9, 2.9, 0, EY + 1.45, 1.2, limeDark); k.box(15.8, 0.35, 3.0, 0, EY + 2.08, 1.22, lime);
    k.sign('CONGREGATION SHEARITH ISRAEL', 4.4, 0.5, -10.8, 4.2, 0.05, '#6a5430', '#f0e4c0', 50);
    { const s = new T.Shape(); s.moveTo(-8, 0); s.lineTo(8, 0); s.lineTo(0, 3.1); s.closePath(); const g = new T.ExtrudeGeometry(s, { depth: 2.8, bevelEnabled: false }); g.translate(0, 0, -1.4); k.mesh(g, lime, 0, EY + 2.25, 1.15); }
    { const s = new T.Shape(); s.moveTo(-6.9, 0); s.lineTo(6.9, 0); s.lineTo(0, 2.4); s.closePath(); const g = new T.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false }); k.mesh(g, limeDark, 0, EY + 2.55, 2.55); }
    k.box(15.6, 0.5, 0.4, 0, FY + CH - 0.05 + 3.1, -0.05, lime);
    /* the roof of the sanctuary behind */
    k.box(28, 2, 30, 0, 17.4, -20, limeDark);
    k.block(-14, -1.2, -0.9, 0.3); k.block(1.2, 14, -0.9, 0.3);
    k.block(-27, -12.45, -8, -6.6); k.block(12.45, 27, -8, -6.6);
    /* the bronze doors, open, one swinging slowly as people come and go */
    const doorM = k.flat(0x5a4428, 0.8, 0.45);
    const leafG = new T.Group(); leafG.position.set(1.2, FY, -0.55);
    { const leaf = new T.Mesh(new T.BoxGeometry(1.18, 4.2, 0.1), doorM); leaf.position.set(-0.59, 2.1, 0); leafG.add(leaf); }
    k.add(leafG); leafG.rotation.y = -1.3;
    k.box(0.1, 4.2, 1.18, -1.2, FY + 2.1, -1.14, doorM);
    if (!ctx.reduced) k.ticks.push((t) => { leafG.rotation.y = -1.1 - 0.45 * Math.max(0, Math.sin(t * 0.3)); });
    /* pigeons on the steps, a flock over the avenue */
    pigeons(k, ctx, [v(-6.5, 0, 5.2), v(-5.8, 0, 5.6), v(-5.1, 0, 4.9), v(6, 0, 5.3), v(7, 0, 5.5), v(11, 0, 3.8), v(-12, 0, 4.4), v(-3, FY - 0.25 * 1, 2.95)], { x: 0, y: 14, z: 13, r: 9, n: 9 }, 1625);
    /* ---- the lobby ---- */
    const LZ = -6.8, LH = 5.5;
    k.box(24, 0.1, 6.4, 0, FY, -3.4, marbleW);
    for (let x = -11; x <= 11; x += 2) k.box(0.9, 0.012, 6, x, FY + 0.056, -3.4, marbleG);
    wallX(k, -12, 12, LZ, LH, 0.4, plaster, [{ c: 0, w: 2.8, h: 4.2 }], FY);
    wallZ(k, LZ, -0.6, -12, LH, 0.4, plaster, [{ c: -3.7, w: 2.2, h: 3.4 }], FY);
    wallZ(k, LZ, -0.6, 12, LH, 0.4, plaster, [{ c: -3.7, w: 2.2, h: 3.4 }], FY);
    k.box(24.4, 0.3, 6.6, 0, FY + LH + 0.15, -3.6, plaster);
    for (const [a, b] of [[-12, -1.5], [1.5, 12]]) k.box(b - a, 0.9, 0.04, (a + b) / 2, FY + 0.45, -6.58, marbleR);
    for (const x of [-7, 0, 7]) { k.cyl(0.015, 0.8, x, FY + LH - 0.4, -3.6, brass); k.lathe([[0.04, 0], [0.26, -0.1], [0.3, -0.25], [0.05, -0.34]], x, FY + LH - 0.8, -3.6, brass, 14); bulbs.push({ x, y: FY + LH - 1.1, z: -3.6 }); }
    k.point(0, FY + 4, -3.6, 0xffdcaa, 16, 16);
    /* the two millstones set at the entrance */
    for (const x of [-1.9, 1.9]) { const m = k.cyl(0.55, 0.22, x, FY + 0.11, -1.4, k.flat(0x8a8478, 0, 0.9), 0.55, 24); void m; k.keepOut.push({ x, z: -1.4, r: 0.6 }); }
    /* ---- the corridor to the parsonage house ---- */
    k.box(14.4, 0.1, 4.8, -19.2, FY, -3.6, k.pbr('siCorF', X.planks(0x6a4a30, 6, 183), 0.7, { roughness: 0.5 }));
    wallX(k, -26.2, -12, -1.0, 4.4, 0.4, plaster, [], FY); wallX(k, -26.2, -12, -6.2, 4.4, 0.4, plaster, [], FY);
    wallZ(k, -6.2, -1.0, -26.2, 4.4, 0.4, plaster, [], FY);
    k.box(14.4, 0.3, 5.6, -19.2, FY + 4.55, -3.6, plaster);
    for (const z of [-1.22, -5.98]) k.box(14, 1.0, 0.04, -19.1, FY + 0.5, z, wood);
    k.point(-19, FY + 2.6, -3.6, 0xffe0b8, 7, 12);
    /* ---- the Small Synagogue: white panelled, the colonial desk and candlesticks, pews facing across ---- */
    const SX0 = 12.2, SX1 = 24;
    k.box(SX1 - SX0, 0.1, 6, (SX0 + SX1) / 2, FY, -3.7, k.pbr('siSmF', X.planks(0x8a6440, 7, 184), 0.7, { roughness: 0.5 }));
    wallX(k, SX0, SX1, -0.8, 5.4, 0.3, white, [], FY); wallX(k, SX0, SX1, -6.7, 5.4, 0.3, white, [], FY);
    wallZ(k, -6.7, -0.8, SX1, 5.4, 0.3, white, [], FY);
    k.box(SX1 - SX0, 0.3, 6.2, (SX0 + SX1) / 2, FY + 5.5, -3.7, white);
    for (const z of [-0.97, -6.53]) { k.box(SX1 - SX0 - 0.2, 1.1, 0.04, (SX0 + SX1) / 2, FY + 0.55, z, cream); for (let x = SX0 + 1; x < SX1 - 0.5; x += 1.4) k.box(1.1, 0.8, 0.02, x + 0.5, FY + 0.55, z + (z > -3 ? -0.03 : 0.03), white); }
    for (const x of [14.6, 17.4, 20.2]) k.plane(1.1, 2.6, x, FY + 3.2, -0.97, k.flat(0xcfe0e8, 0.2, 0.1, { emissive: 0xbcd0dc, emissiveIntensity: 0.5 }), PI);
    const DX = 17.2, DZ = -3.75;
    k.box(3, 0.4, 2.2, DX, FY + 0.2, DZ, woodDark);
    for (const [w, d, x, z] of [[3, 0.08, DX, DZ - 1.1], [3, 0.08, DX, DZ + 1.1], [0.08, 2.2, DX - 1.5, DZ]] as number[][]) { k.box(w, 0.9, d, x, FY + 0.85, z, wood); k.box(w + 0.05, 0.06, d + 0.06, x, FY + 1.33, z, woodDark); }
    k.box(1.1, 1.0, 0.8, DX + 0.4, FY + 0.9, DZ, woodDark); { const tp = k.box(1.2, 0.06, 0.9, DX + 0.4, FY + 1.44, DZ, wood); tp.rotation.z = 0.25; }
    for (const [x, z] of [[DX - 1.5, DZ - 1.1], [DX + 1.5, DZ - 1.1], [DX - 1.5, DZ + 1.1], [DX + 1.5, DZ + 1.1]]) { k.lathe([[0.12, 0], [0.06, 0.1], [0.04, 0.8], [0.08, 0.95], [0.03, 1.0]], x, FY + 0.4, z, brass, 12); k.cyl(0.022, 0.2, x, FY + 1.5, z, cream, 0.022, 6); bulbs.push({ x, y: FY + 1.64, z }); }
    k.block(DX - 1.7, DX + 1.7, DZ - 1.3, DZ + 1.3);
    for (const z of [-1.5, -6.0]) for (const x of [13.8, 15.8, 19.2, 21.2]) { k.box(1.7, 0.45, 0.45, x, FY + 0.22, z, wood); k.box(1.7, 1.1, 0.07, x, FY + 0.7, z + (z > -3 ? 0.24 : -0.24), wood); }
    k.block(SX0, SX1, -2.0, -0.8); k.block(SX0, SX1, -6.7, -5.5);
    /* the small ark at the far end: a pedimented cabinet, blank tablets, its own light */
    k.box(0.5, 3.6, 2.2, SX1 - 0.4, FY + 1.8, DZ, woodDark);
    { const s = new T.Shape(); s.moveTo(-1.3, 0); s.lineTo(1.3, 0); s.lineTo(0, 0.7); s.closePath(); const g = new T.ExtrudeGeometry(s, { depth: 0.55, bevelEnabled: false }); g.translate(0, 0, -0.27); const o = k.mesh(g, woodDark, SX1 - 0.4, FY + 3.6, DZ); o.rotation.y = PI / 2; }
    for (const z of [DZ - 1.2, DZ + 1.2]) k.cyl(0.1, 3.6, SX1 - 0.7, FY + 1.8, z, white);
    tablets(k, SX1 - 0.55, FY + 4.4, DZ, white, brass, 0.45, -PI / 2);
    nerTamid(k, ctx, SX1 - 1.8, FY + 3.2, DZ, FY + 5.4, brass);
    k.block(SX1 - 1.2, SX1, DZ - 1.5, DZ + 1.5);
    chandelier(k, DX - 2.5, FY + 3.9, DZ, 0.7, 6, brass, FY + 5.4, bulbs);
    k.point(DX - 2, FY + 3.4, DZ, 0xffd8a0, 7, 9);
    /* ---- the sanctuary ---- */
    const Z0 = -7.0, Z1 = -34, SW = 13, SH = 15, GY = FY + 5.2;
    k.box(2 * SW, 0.1, Z0 - Z1, 0, FY, (Z0 + Z1) / 2, sand);
    wallZ(k, Z1, Z0, -SW, SH, 0.5, marbleWall, [], FY); wallZ(k, Z1, Z0, SW, SH, 0.5, marbleWall, [], FY);
    wallX(k, -SW, SW, Z1, SH, 0.5, marbleWall, [], FY);
    k.box(2 * SW + 1, 0.6, Z0 - Z1 + 1, 0, FY + SH + 0.3, (Z0 + Z1) / 2, plaster);
    for (const s of [-1, 1]) { k.box(0.08, 5.2, Z0 - Z1, s * (SW - 0.28), FY + 2.6, (Z0 + Z1) / 2, marbleW); k.box(0.1, 1.0, Z0 - Z1, s * (SW - 0.3), FY + 0.5, (Z0 + Z1) / 2, marbleR); }
    /* coffered ceiling in cream and gold */
    for (let x = -12; x <= 12; x += 3) k.box(0.3, 0.5, Z0 - Z1, x, FY + SH - 0.25, (Z0 + Z1) / 2, cream);
    for (let z = Z0 - 1.5; z > Z1; z -= 3) k.box(2 * SW, 0.5, 0.3, 0, FY + SH - 0.25, z, cream);
    k.box(2 * SW, 0.05, Z0 - Z1, 0, FY + SH - 0.02, (Z0 + Z1) / 2, k.flat(0xb89a5a, 0.5, 0.45));
    /* galleries on marble columns along both sides */
    for (const s of [-1, 1]) {
      k.box(3.2, 0.35, Z0 - Z1 - 4, s * (SW - 1.6), GY, (Z0 + Z1 - 4) / 2, plaster);
      k.box(0.12, 1.0, Z0 - Z1 - 4, s * (SW - 3.2), GY + 0.7, (Z0 + Z1 - 4) / 2, wood);
      for (let z = Z0 - 1.2; z > Z1 + 3.5; z -= 1.6) k.cyl(0.035, 0.9, s * (SW - 3.2), GY + 0.62, z, brass);
      k.box(0.2, 0.08, Z0 - Z1 - 4, s * (SW - 3.2), GY + 1.24, (Z0 + Z1 - 4) / 2, brass);
      for (const z of [-10.5, -15.5, -20.5, -25.5]) { k.column(s * (SW - 3.2), FY, z, 5.0, 0.26, marbleW, false, brass); k.keepOut.push({ x: s * (SW - 3.2), z, r: 0.55 }); }
    }
    /* the Tiffany windows over the galleries */
    const tiff = [archGlass(1626, [0xe8c070, 0xd8a850, 0xf0dca0, 0x9ab880, 0x7aa0a8, 0xe8e0c0, 0xc88a40], { medallion: false, cell: 28 }), archGlass(1627, [0xf0d8a0, 0xa8c088, 0xd8b060, 0xe8e4c8, 0x88a8b8, 0xb87838], { medallion: false, cell: 28 })].map((t) => glassMat(t, 0xfff4e0));
    [-11, -16, -21, -26, -31].forEach((z, i) => { for (const s of [-1, 1]) { k.plane(2.6, 6.4, s * (SW - 0.26), GY + 5.4, z, tiff[(i + (s > 0 ? 1 : 0)) % 2], -s * PI / 2); k.box(0.3, 0.3, 3.1, s * (SW - 0.3), GY + 2.1, z, cream); } });
    /* the reader's desk near the entrance, facing the ark, four brass candlesticks at its corners */
    const TZ = -12.2;
    k.box(7, 0.7, 4, 0, FY + 0.35, TZ, wood); k.box(7.2, 0.06, 4.2, 0, FY + 0.72, TZ, woodDark);
    for (const [w, d, x, z] of [[7, 0.1, 0, TZ - 2], [7, 0.1, 0, TZ + 2], [0.1, 4, -3.5, TZ], [0.1, 4, 3.5, TZ]] as number[][]) { k.box(w, 0.9, d, x, FY + 1.15, z, woodDark); k.box(w + 0.05, 0.07, d + 0.08, x, FY + 1.63, z, brass); }
    k.box(1.8, 1.1, 1.1, 0, FY + 1.25, TZ - 1.0, woodDark); { const tp = k.box(2.0, 0.07, 1.3, 0, FY + 1.86, TZ - 1.0, wood); tp.rotation.x = 0.22; }
    for (const [x, z] of [[-3.5, TZ - 2], [3.5, TZ - 2], [-3.5, TZ + 2], [3.5, TZ + 2]]) { k.lathe([[0.22, 0], [0.1, 0.15], [0.06, 1.4], [0.14, 1.6], [0.05, 1.66]], x, FY + 0.7, z, brass, 14); k.cyl(0.035, 0.34, x, FY + 2.53, z, cream, 0.035, 8); bulbs.push({ x, y: FY + 2.76, z }); }
    k.block(-3.8, 3.8, TZ - 2.3, TZ + 2.3);
    /* the benches along both walls facing each other across the room, and the congregation */
    const seated: { x: number; y: number; z: number; ry: number; sit?: boolean }[] = [];
    const rnd = X.mulberry(1628);
    for (const s of [-1, 1]) for (let r = 0; r < 3; r++) {
      const x = s * (5.4 + r * 1.25), za = -15.2, zb = -29.2, zc = (za + zb) / 2, L = za - zb;
      k.box(0.5, 0.08, L, x, FY + 0.46, zc, wood); k.box(0.08, 1.0, L, x + s * 0.28, FY + 0.75, zc, woodDark); k.box(0.46, 0.42, L, x, FY + 0.21, zc, woodDark);
      for (let z = za - 0.5; z > zb; z -= 0.7) if (rnd() < 0.3) seated.push({ x: x - s * 0.02, y: FY + 0.28, z, ry: s > 0 ? -PI / 2 : PI / 2, sit: true });
    }
    for (const s of [-1, 1]) k.block(s > 0 ? 5 : -8.4, s > 0 ? 8.4 : -5, -29.6, -14.8);
    still(k, seated, 1629);
    /* the ark at the far end: marble steps, columns, a pediment, plain doors, blank tablets, the eternal light */
    k.box(9, 0.3, 3.4, 0, FY + 0.15, Z1 + 1.7, marbleW); k.box(8, 0.3, 2.6, 0, FY + 0.45, Z1 + 1.3, marbleW); k.box(7, 0.3, 1.8, 0, FY + 0.75, Z1 + 0.9, marbleW);
    k.box(10, 9, 0.4, 0, FY + 4.5, Z1 + 0.3, marbleG);
    for (const x of [-2.6, 2.6]) k.column(x, FY + 0.9, Z1 + 1.0, 6.4, 0.28, marbleW, true, brass);
    k.box(6.6, 0.8, 1.1, 0, FY + 7.7, Z1 + 0.9, marbleW);
    { const s = new T.Shape(); s.moveTo(-3.4, 0); s.lineTo(3.4, 0); s.lineTo(0, 1.4); s.closePath(); const g = new T.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); k.mesh(g, marbleW, 0, FY + 8.1, Z1 + 0.9); }
    k.box(3.6, 5.6, 0.12, 0, FY + 0.9 + 2.8, Z1 + 0.56, woodDark);
    k.box(3.3, 5.3, 0.06, 0, FY + 0.9 + 2.8, Z1 + 0.64, k.flat(0x6a1c22, 0, 0.85));
    k.box(3.5, 0.12, 0.1, 0, FY + 0.9 + 5.55, Z1 + 0.7, brass);
    tablets(k, 0, FY + 9.7, Z1 + 0.6, white, brass, 1.0);
    k.block(-4.6, 4.6, Z1 - 1, Z1 + 3.5);
    nerTamid(k, ctx, 0, FY + 6.6, Z1 + 4.2, FY + SH, brass);
    k.point(0, FY + 6, Z1 + 5.5, 0xffd8a0, 16, 13);
    /* brass candle chandeliers down the room, candle sconces on the walls */
    for (const z of [-17, -22.5, -28]) chandelier(k, 0, FY + 9, z, 1.6, 12, brass, FY + SH - 0.5, bulbs);
    for (const s of [-1, 1]) for (const z of [-12, -18, -24, -30]) { k.box(0.1, 0.5, 0.3, s * (SW - 0.35), FY + 3.3, z, brass); k.cyl(0.03, 0.24, s * (SW - 0.55), FY + 3.7, z, cream, 0.03, 6); bulbs.push({ x: s * (SW - 0.55), y: FY + 3.88, z }); }
    bulbsMesh(k, bulbs, 0xffd890, 0.06);
    k.point(0, FY + 8.4, -17, 0xffd8a0, 16, 16); k.point(0, FY + 8.4, -28, 0xffd8a0, 16, 16);
    /* congregants climbing the steps and going in */
    k.crowd([v(-20, 0, 5.3), v(-6, 0, 5.2), v(0, 0, 4.9), v(0, FY, 2.4), v(0, FY, -0.2), v(0.4, FY, -3.6), v(0, FY, -7.6), v(-4.4, FY, -9.2), v(-4.4, FY, -14)], 8, { seed: 16210, spread: 0.7, speed: 0.75, animate: !ctx.reduced, colors: [0x1c1e24, 0x2a2e38, 0x1a1a1c, 0x3a3230, 0xe0dcd0, 0x4a3a5a] });
    /* ---- the works ---- */
    const mounts: Mount[] = [], st: FrameStyle = 'oak';
    const post = k.flat(0x2a2620, 0.5, 0.5), back = k.flat(0x3a3228, 0, 0.8);
    for (const x of [-12.9, -10.2, 10.2, 12.9]) board(k, mounts, x, 0, 1.0, 2.2, 1.6, st, back, post);
    for (const x of [-9.2, -5.2, 5.2, 9.2]) hang(mounts, x, FY + 2.3, LZ + 0.23, 0, 2.4, 1.8, st);
    for (const x of [-9.4, -6.4, 6.4, 9.4]) hang(mounts, x, FY + 2.3, -0.63, PI, 2.0, 1.5, st, 2.9);
    for (const x of [-15.5, -19.5, -23.5]) hang(mounts, x, FY + 2.1, -1.23, PI, 2.2, 1.6, st, 3.0);
    for (const x of [-15.5, -19.5, -23.5]) hang(mounts, x, FY + 2.1, -5.97, 0, 2.2, 1.6, st, 3.0);
    k.censusWall({ x: -25.97, y: FY + 2.1, z: -3.6, rotY: PI / 2, cols: 8, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(4700, 40), pieces: ctx.all, backing: woodDark });
    /* ---- eggs ---- */
    const wiki = { name: 'Congregation Shearith Israel, Wikipedia', url: 'https://en.wikipedia.org/wiki/Congregation_Shearith_Israel' };
    const dm = { name: 'Daytonian in Manhattan, The 1897 Congregation Shearith Israel Synagogue', url: 'http://daytoninmanhattan.blogspot.com/2010/09/1897-congregation-shearith-israel.html' };
    k.egg(v(-10.8, 4.2, 0.4), { id: 'shearith-1654', title: 'Since 1654', year: '1654', text: 'Shearith Israel was established in 1654 in New Amsterdam by Jews who had arrived from Dutch Brazil. It is the oldest Jewish congregation in the United States, and until 1825 it was the only one in New York City.', clue: 'Find the bronze plaque by the steps, then ask how long the name has been here.', source: wiki }, { r: 2.4 });
    k.egg(v(-1.8, FY + 6, 1.4), { id: 'shearith-brunner', title: 'Four columns on the avenue', year: '1897', text: 'Arnold Brunner designed the building, finished in 1897, with four giant Corinthian columns carrying a cornice and pediment over a grand flight of stone steps. He called his approach the sanction of antiquity, drawing on ancient synagogue ruins found near the Sea of Galilee.', clue: 'Count the columns from across the avenue.', source: dm }, { r: 1.6 });
    k.egg(v(-SW + 0.6, GY + 5.4, -16), { id: 'shearith-tiffany', title: 'Tiffany', text: 'Louis Comfort Tiffany designed the interior and the stained glass, and the building was extensively refurbished in 1921.', clue: 'Look up at the coloured light over the galleries.', source: wiki }, { r: 2 });
    k.egg(v(DX, FY + 1.2, DZ), { id: 'shearith-small-synagogue', title: 'The Small Synagogue', year: '1730', text: 'One room, the Small Synagogue, is furnished in the Georgian style, including furniture original to the 1730 Mill Street synagogue, the congregation\'s first building.', clue: 'Go through the door on the right of the lobby into the white room.', source: dm }, { r: 1.6 });
    k.egg(v(0, FY + 4.8, LZ + 0.4), { id: 'shearith-five-buildings', title: 'Five houses', text: 'The congregation has worshipped in five buildings: on Mill Street in 1730 and again in 1818, at 60 Crosby Street in 1834, on 19th Street in 1860, and here on West 70th Street in 1897.', clue: 'Stand in the lobby and look over the door to the sanctuary.', source: wiki }, { r: 1.2 });
    k.egg(v(-1.9, FY + 0.5, -1.4), { id: 'shearith-millstones', title: 'Two millstones', year: '1730', text: 'Two millstones from the site of the 1730 Mill Street synagogue were set at the entrance of this building.', clue: 'Two old round stones lie just inside the door.', source: dm }, { r: 1.2 });
    return { mounts, spawn: v(-1.5, 3, 20.8), look: v(0, 9, 0), eye: 3, floorY, bounds: [-26, 26, -33, 22.6], style: 'oak' };
  },
};

/* ================================================================== */
/* ---------------- 163 PARK EAST SYNAGOGUE ---------------- */
export const parkeast: RoomDef = {
  id: 'parkeast',
  name: 'Two towers on 67th',
  area: 'PARK EAST SYNAGOGUE / EAST 67TH STREET',
  mood: 'Afternoon, school letting out',
  color: '#a0603a',
  daylit: true,
  description: 'Park East Synagogue, built in 1890 by Schneider and Herter: a Moorish Revival front of red brick and pale stone on East 67th Street, two unequal towers, striped arches over the doors and a rose window between them, with the Park East Day School next door letting out. Inside, galleries on slender columns run round a painted and gilded room lit through coloured glass. The New Yorkers hang on boards on the pavement, in the vestibule, and down the school corridor.',
  signatures: 'The Moorish Revival front with its asymmetrical towers, the eastern one taller, the striped horseshoe arches over three doors, the rose window, the red brick banded with stone, the domes long gone from the tower tops; inside, the galleries on painted columns and horseshoe arches, the blue and gold ceiling, stained glass, the central reader\'s platform, pews facing the ark, the eternal light; the Park East Day School next door and East 67th Street.',
  build(k, ctx) {
    k.sky({ top: 0x4a86d4, horizon: 0xd4e2ee, ground: 0x8a8478, fog: 0.0026, sun: { az: 3.6, el: 0.6, color: 0xfff2da, size: 9 }, env: 0.65 });
    k.hemi(0xe4ecf8, 0x8a8478, 0.95);
    /* afternoon sun from the south west, onto the front */
    k.sun(0xfff0d8, 2.7, -40, 60, 70, true, 70);
    const brick = k.pbr('peBrick', X.brick(0x8e4430, 1631), 1.0, { roughness: 0.85 }),
      stone = k.pbr('peStone', X.ashlar(0xe0d0ac, 1632, 3), 0.4, { normal: 0.4, roughness: 0.8 }), stoneF = k.flat(0xe0d0ac, 0, 0.8),
      terra = k.flat(0xb0603a, 0, 0.8), redV = k.flat(0x6e2418, 0, 0.8), slate = k.flat(0x3a3a40, 0.2, 0.7),
      asph = k.pbr('peAsph', X.asphalt(), 0.3), walk = k.pbr('peWalk', X.pavers(0x9a968c, 1633), 0.5), curb = k.flat(0x8a8680, 0, 0.8), line = k.flat(0xe8e4d8, 0, 0.8),
      darkGlass = k.flat(0x2c3640, 0.35, 0.22), iron = k.flat(0x1c1c1c, 0.6, 0.5),
      wood = k.pbr('peWood', X.planks(0x5a3420, 6, 1634), 0.8, { roughness: 0.5 }), woodDark = k.flat(0x3a2012, 0, 0.5),
      brass = k.flat(0xc89a48, 1, 0.3), gilt = k.pbr('peGilt', X.gilt(0xd0a852), 2, { metalness: 0.9, roughness: 0.3 }),
      carpet = k.pbr('peCarpet', X.carpet(0x5a1a22, 0xb8903a), 0.6, { roughness: 1 }),
      schoolB = k.pbr('peSchool', X.brick(0xb89a78, 1635), 1.0, { roughness: 0.85 }), terr = k.pbr('peTerr', X.terrazzo(0xd8d0c0, 1636), 0.4, { roughness: 0.4 }),
      schoolWall = k.flat(0xe8e2d6, 0, 0.8), paleBlue = k.flat(0x9ab4c8, 0, 0.8);
    /* stripes of red and pale stone, world metres, for the arcades inside */
    const stripeTex = canvasTex(64, 64, (g) => { g.fillStyle = '#8e4430'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#e0d0ac'; g.fillRect(0, 0, 64, 22); }, true);
    stripeTex.repeat.set(1, 1.6);
    const stripe = new T.MeshStandardMaterial({ map: stripeTex, roughness: 0.75 });
    const bulbs: { x: number; y: number; z: number }[] = [];
    /* ---- East 67th Street ---- */
    k.box(70, 0.2, 4.5, 0, -0.1, 2.25, walk); k.box(70, 0.2, 9, 0, -0.14, 9, asph); k.box(70, 0.2, 4.5, 0, -0.1, 15.75, walk);
    for (const z of [4.5, 13.5]) k.box(70, 0.18, 0.25, 0, -0.02, z, curb);
    for (let x = -32; x < 32; x += 3.2) k.box(1.6, 0.012, 0.12, x, 0.005, 9, line);
    houses(k, -36, 36, 18, -1, 1637, { hMin: 14, hMax: 24 });
    houses(k, -36, -11.4, 0, 1, 1638, { hMin: 16, hMax: 20 });
    k.block(-40, -11.3, -40, 0.4); k.block(28.2, 40, -40, 0.4);
    for (const [x, z] of [[-16, 3.6], [-24, 14.4], [-8, 14.4], [8, 14.4], [24, 14.4]]) { k.tree(x, 0, z, { h: 5.5, r: 2, seed: 163 }); k.keepOut.push({ x, z, r: 0.8 }); }
    traffic(k, ctx, { lanes: [{ z: 8, dir: 1, n: 4, speed: 7 }, { z: 10.4, dir: 1, n: 3, speed: 8 }, { z: 5.6, dir: 0, n: 5 }, { z: 12.4, dir: 0, n: 6 }], x0: -38, x1: 38, seed: 1639 });
    k.crowd([v(-34, 0, 15.6), v(34, 0, 15.6)], 8, { seed: 16310, spread: 1.6, animate: !ctx.reduced });
    /* school children and their teachers on the near pavement, small and in pairs */
    k.crowd([v(-34, 0, 3.0), v(-12, 0, 3.4), v(12, 0, 3.4), v(19.5, 0, 2.4), v(19.5, 0, 0.8), v(19.5, 0, -2.8), v(23, 0, -3.8)], 14, { seed: 16311, spread: 1.2, scale: 0.72, speed: 0.9, animate: !ctx.reduced, colors: [0x2a4a8a, 0xd83a3a, 0xe8c040, 0x3a8a5a, 0xe8e2d6, 0x6a4a8a, 0x2a2e38] });
    k.crowd([v(-30, 0, 3.8), v(-4, 0, 3.6), v(0, 0, 2.2), v(0, 0, -1.8), v(0, 0, -5.8), v(-1.2, 0, -8.4)], 6, { seed: 16312, spread: 0.7, speed: 0.8, animate: !ctx.reduced, colors: [0x1c1e24, 0x2a2e38, 0x1a1a1c, 0x3a3230, 0xe0dcd0] });
    /* ---- the front: centre gable, two unequal towers ---- */
    const CW = 13, CHt = 16, WT = 20, ET = 24, TW = 4.5;
    k.mesh(holedWall(CW, CHt, 0.7, [
      { kind: 'arch', cx: 0, y0: 0.45, w: 2.6, h: 5, shoe: 1.18 }, { kind: 'arch', cx: -3.6, y0: 0.45, w: 1.7, h: 4, shoe: 1.18 }, { kind: 'arch', cx: 3.6, y0: 0.45, w: 1.7, h: 4, shoe: 1.18 },
      { kind: 'circle', cx: 0, cy: 10.6, r: 2.5 },
      { kind: 'arch', cx: -4.4, y0: 8.4, w: 1.2, h: 3.2 }, { kind: 'arch', cx: 4.4, y0: 8.4, w: 1.2, h: 3.2 },
    ]), brick, 0, 0, -0.35);
    /* the gable, with a striped band and a little arcaded parapet */
    { const s = new T.Shape(); s.moveTo(-CW / 2, 0); s.lineTo(CW / 2, 0); s.lineTo(0, 3.6); s.closePath(); const g = new T.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: false }); g.translate(0, 0, -0.35); k.mesh(g, brick, 0, CHt, -0.35); }
    for (let i = 0; i < 9; i++) { const x = -3.2 + i * 0.8; k.box(0.14, 1.2, 0.2, x, CHt + 0.7 + (3.2 - Math.abs(x)) * 0.5, 0.05, stoneF); }
    const towerFront = (x0: number, h: number) => {
      const holes: Hole[] = [{ kind: 'arch', cx: 0, y0: 1.4, w: 1.1, h: 2.8, shoe: 1.15 }];
      for (let y = 6.5; y < h - 3; y += 4.6) holes.push({ kind: 'arch', cx: -0.8, y0: y, w: 0.9, h: 2.4, shoe: 1.15 }, { kind: 'arch', cx: 0.8, y0: y, w: 0.9, h: 2.4, shoe: 1.15 });
      k.mesh(holedWall(TW, h, 0.9, holes), brick, x0, 0, -0.25);
      k.plane(1.1, 2.8, x0, 2.8, -0.28, darkGlass);
      for (let y = 6.5; y < h - 3; y += 4.6) for (const dx of [-0.8, 0.8]) k.plane(0.9, 2.4, x0 + dx, y + 1.2, -0.28, darkGlass);
      /* the tower body behind, bands of pale stone, corner shafts, the flat top where the dome was */
      k.box(TW, h, TW, x0, h / 2, -TW / 2 - 0.6, brick);
      const wins = holes.map((o) => o.kind === 'arch' ? [o.y0 - 0.2, o.y0 + o.h + 0.2] : [0, 0]);
      for (let y = 1.2; y < h; y += 1.6) if (!wins.some(([a, b]) => y + 0.14 > a && y - 0.14 < b)) k.box(TW + 0.06, 0.28, 0.08, x0, y, 0.24, stoneF);
      for (const dx of [-TW / 2, TW / 2]) k.cyl(0.24, h, x0 + dx, h / 2, 0.15, stone, 0.24, 10);
      k.box(TW + 0.5, 0.5, TW + 0.5, x0, h + 0.25, -TW / 2 - 0.4, stoneF);
      for (let i = 0; i < 6; i++) { const u = -TW / 2 + 0.3 + i * (TW - 0.6) / 5; k.box(0.34, 0.7, 0.34, x0 + u, h + 0.85, 0.05, terra); k.box(0.34, 0.7, 0.34, x0 + u, h + 0.85, -TW - 0.8, terra); }
      for (const dx of [-TW / 2, TW / 2]) { k.cyl(0.26, 1.4, x0 + dx, h + 1.2, 0.05, stone, 0.26, 10); k.sphere(0.34, x0 + dx, h + 2.1, 0.05, terra, 10); }
    };
    towerFront(-(CW / 2 + TW / 2), WT);
    towerFront(CW / 2 + TW / 2, ET);
    /* stone bands across the centre, striped voussoirs over the three doors and round the rose */
    for (let y = 1.2; y < CHt; y += 1.6) {
      const segs = y < 5.8 ? [[-CW / 2, -4.6], [-2.6, -1.5], [1.5, 2.6], [4.6, CW / 2]] : y < 7.8 ? [[-CW / 2, CW / 2]] : y < 14.4 ? [[-CW / 2, -5.2], [5.2, CW / 2]] : [[-CW / 2, CW / 2]];
      for (const [a, b] of segs) k.box(b - a, 0.28, 0.06, (a + b) / 2, y, 0.02, stoneF);
    }
    const voussoirs = (cx: number, cy: number, R: number, band: number, n: number, a0: number) => {
      for (let i = 0; i < n; i++) {
        const a = a0 + (PI - 2 * a0) * (i + 0.5) / n, rr = R + band / 2;
        const seg = k.box((R + band) * (PI - 2 * a0) / n + 0.01, band, 0.3, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 0.1, i % 2 ? redV : stoneF);
        seg.rotation.z = a + PI / 2;
      }
    };
    for (const [cx, w, h] of [[0, 2.6, 5], [-3.6, 1.7, 4], [3.6, 1.7, 4]] as number[][]) { const R = w / 2 * 1.18; voussoirs(cx, 0.45 + h - R, R, 0.45, 15, -0.5); }
    for (let i = 0; i < 28; i++) { const a = (i + 0.5) / 28 * PI * 2, rr = 2.85; const seg = k.box(3.15 * PI * 2 / 28 + 0.01, 0.62, 0.3, Math.cos(a) * rr, 10.6 + Math.sin(a) * rr, 0.1, i % 2 ? redV : stoneF); seg.rotation.z = a + PI / 2; }
    const rose = glassMat(archGlass(1640, [0x2a4ab8, 0x8a1a22, 0xc8a030, 0x2a7a4a, 0x5a2a7a, 0xd8c890], { rose: true, cell: 16 }), 0xffffff);
    k.plane(5, 5, 0, 10.6, -0.34, rose);
    for (const x of [-4.4, 4.4]) k.plane(1.2, 3.2, x, 10, -0.34, darkGlass);
    k.sign('PARK EAST SYNAGOGUE', 7.6, 0.62, 0, 6.35, 0.08, '#e0d0ac', '#5a2a1a', 72);
    /* steps up to the doors, the doors themselves in carved wood, open */
    for (let i = 0; i < 3; i++) k.box(10.4, 0.15, 0.5, 0, 0.075 + i * 0.15, 1.1 - i * 0.4, stoneF);
    const doorM = k.flat(0x4a2a16, 0, 0.55);
    for (const s of [-1, 1]) { const d = k.box(0.1, 4.4, 1.25, s * 1.3, 2.65, -0.95, doorM); void d; }
    k.block(-11.3, -1.3, -0.9, 0.45); k.block(1.3, 11.3, -0.9, 0.45);
    /* roof of the sanctuary behind the front */
    k.box(21, 1.2, 27, 0, 15.6, -17, slate);
    /* ---- the school next door ---- */
    const SX0 = 11.4, SX1 = 28;
    k.mesh(holedWall(SX1 - SX0, 19, 0.5, [{ kind: 'rect', cx: 19.7 - (SX0 + SX1) / 2, y0: 0, w: 2.4, h: 3 },
      ...[1, 2, 3, 4, 5].flatMap((f) => [-6, -2, 2, 6].map((dx) => ({ kind: 'rect' as const, cx: dx, y0: 0.6 + f * 3.4, w: 2.8, h: 1.8 }))),
      ...[-4.6, 4.6].map((dx) => ({ kind: 'rect' as const, cx: dx, y0: 1.2, w: 2.8, h: 1.8 }))]), schoolB, (SX0 + SX1) / 2, 0, -0.25);
    for (const f of [1, 2, 3, 4, 5]) for (const dx of [-6, -2, 2, 6]) k.plane(2.8, 1.8, (SX0 + SX1) / 2 + dx, 0.6 + f * 3.4 + 0.9, -0.3, darkGlass);
    for (const dx of [-4.6, 4.6]) k.plane(2.8, 1.8, (SX0 + SX1) / 2 + dx, 2.1, -0.3, k.flat(0xa8bcc8, 0.3, 0.2, { emissive: 0x8aa0b0, emissiveIntensity: 0.25 }));
    for (let f = 1; f <= 5; f++) k.box(SX1 - SX0, 0.35, 0.3, (SX0 + SX1) / 2, 0.45 + f * 3.4, 0.1, stoneF);
    k.box(SX1 - SX0 + 0.4, 0.6, 0.6, (SX0 + SX1) / 2, 19.2, 0, stoneF);
    k.box(SX1 - SX0, 19, 20, (SX0 + SX1) / 2, 9.5, -17.5, schoolB);
    k.box(5, 0.25, 2.2, 19.7, 3.6, 1.0, iron);
    k.sign('PARK EAST DAY SCHOOL', 6.2, 0.55, 19.7, 3.25, 2.12, '#1c2a44', '#f0ece0', 70);
    k.block(SX0, 18.5, -0.8, 0.35); k.block(20.9, SX1, -0.8, 0.35);
    /* the school doors: one swings open and shut as the children come out */
    const sd = new T.Group(); sd.position.set(18.5, 0, -0.3); { const leaf = new T.Mesh(new T.BoxGeometry(1.18, 2.9, 0.06), k.glass(0x9ab8c8, 0.45)); leaf.position.set(0.59, 1.45, 0); sd.add(leaf); const fr = new T.Mesh(new T.BoxGeometry(0.08, 2.94, 0.08), iron); fr.position.set(1.16, 1.45, 0); sd.add(fr); } k.add(sd);
    if (!ctx.reduced) k.ticks.push((t) => { sd.rotation.y = 1.3 * Math.max(0, Math.sin(t * 0.5)) ** 0.6; });
    /* the school corridor: terrazzo, pale walls, lockers, the census wall at the end */
    k.box(SX1 - SX0, 0.1, 6.6, (SX0 + SX1) / 2, 0, -3.8, terr);
    wallX(k, SX0, SX1, -7.2, 3.8, 0.4, schoolWall);
    wallZ(k, -7.2, -0.5, SX0 + 0.2, 3.8, 0.4, schoolWall); wallZ(k, -7.2, -0.5, SX1 - 0.2, 3.8, 0.4, schoolWall);
    k.box(SX1 - SX0, 0.3, 7, (SX0 + SX1) / 2, 3.95, -3.8, schoolWall);
    k.box(SX1 - SX0 - 0.8, 1.0, 0.04, (SX0 + SX1) / 2, 0.5, -6.98, paleBlue);
    for (const x of [15.6, 19.7, 23.6]) { k.box(1.2, 0.04, 0.6, x, 3.78, -3.8, k.glow(0xe8e6dc)); }
    k.point(15.6, 3.2, -3.8, 0xfff4e4, 8, 10); k.point(23.6, 3.2, -3.8, 0xfff4e4, 8, 10);
    /* ---- the vestibule ---- */
    k.box(12, 0.1, 5, 0, 0, -2.9, carpet);
    wallX(k, -6, 6, -5.4, 5.5, 0.4, stone, [{ c: 0, w: 2.6, h: 4 }]);
    wallZ(k, -5.4, -0.7, -6, 5.5, 0.4, stone); wallZ(k, -5.4, -0.7, 6, 5.5, 0.4, stone);
    k.box(12.4, 0.3, 5.2, 0, 5.6, -3, stone);
    k.cyl(0.015, 1, 0, 5.0, -3, brass); k.lathe([[0.04, 0], [0.3, -0.1], [0.34, -0.3], [0.05, -0.4]], 0, 4.5, -3, brass, 14); bulbs.push({ x: 0, y: 4.15, z: -3 });
    k.point(0, 4, -3, 0xffdcaa, 10, 10);
    /* ---- the sanctuary ---- */
    const Z0 = -5.6, Z1 = -30, SW = 10.6, SH = 14, GY = 5;
    k.box(2 * SW, 0.1, Z0 - Z1, 0, 0, (Z0 + Z1) / 2, carpet);
    wallZ(k, Z1, Z0, -SW, SH, 0.5, stone); wallZ(k, Z1, Z0, SW, SH, 0.5, stone); wallX(k, -SW, SW, Z1, SH, 0.5, stone);
    wallX(k, -SW, -6.2, Z0, SH, 0.5, stone, [], 0, false); wallX(k, 6.2, SW, Z0, SH, 0.5, stone, [], 0, false);
    k.box(12.4, SH - 5.5, 0.5, 0, 5.5 + (SH - 5.5) / 2, Z0, stone);
    k.plane(5, 5, 0, 10.6, Z0 - 0.27, rose);
    /* the ceiling: deep blue, gilt ribs, gold stars stencilled */
    const starTex = canvasTex(128, 128, (g) => { g.fillStyle = '#1c2e6a'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#d8b050'; for (const [x, y] of [[32, 32], [96, 96]]) { g.beginPath(); for (let q = 0; q < 16; q++) { const a = q / 16 * PI * 2, r = q % 2 ? 5 : 13; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); } g.strokeStyle = '#b89040'; g.lineWidth = 2; g.strokeRect(1, 1, 126, 126); }, true);
    starTex.repeat.set(9, 10);
    k.plane(2 * SW, Z0 - Z1, 0, SH - 0.05, (Z0 + Z1) / 2, new T.MeshStandardMaterial({ map: starTex, roughness: 0.7 }), 0, PI / 2);
    k.box(2 * SW + 1, 0.5, Z0 - Z1 + 1, 0, SH + 0.25, (Z0 + Z1) / 2, stone);
    for (let z = Z0 - 2; z > Z1; z -= 4) k.box(2 * SW, 0.4, 0.3, 0, SH - 0.25, z, gilt);
    for (const x of [-SW + 0.4, SW - 0.4]) k.box(0.5, 0.6, Z0 - Z1, x, SH - 0.3, (Z0 + Z1) / 2, gilt);
    /* the galleries: striped horseshoe arcades on slender painted columns, both sides and over the entrance */
    for (const s of [-1, 1]) {
      const gx = s * (SW - 3.2), len = Z0 - Z1 - 3.2, zc = (Z0 - 3.2 + Z1) / 2;
      k.box(3.2, 0.35, len + 3.2, s * (SW - 1.6), GY, (Z0 + Z1) / 2, stone);
      k.arcade(len, SH - GY - 0.5, 0.35, 5, 3.4, 5.6, gx, GY + 0.2, zc, stripe, PI / 2);
      k.box(0.14, 1.0, len, gx, GY + 0.7, zc, woodDark); k.box(0.22, 0.08, len, gx, GY + 1.25, zc, gilt);
      for (let i = 0; i <= 5; i++) { const z = Z0 - 3.2 - i * len / 5; k.cyl(0.14, GY, gx, GY / 2, z, k.flat(0x3a5a8a, 0.3, 0.5), 0.14, 10); k.box(0.5, 0.4, 0.5, gx, GY - 0.2, z, gilt); if (i > 0 && i < 5) k.keepOut.push({ x: gx, z, r: 0.45 }); }
      for (let i = 0; i < 5; i++) {
        const z = Z0 - 3.2 - (i + 0.5) * len / 5, R = len / 10 - 0.35, band = 0.3, cy = GY - 0.2 - R - band, rr = R + band / 2;
        for (let j = 0; j < 13; j++) { const a = -0.35 + (PI + 0.7) * (j + 0.5) / 13, seg = k.box(0.3, band, rr * (PI + 0.7) / 13 + 0.02, gx, cy + Math.sin(a) * rr, z + Math.cos(a) * rr, j % 2 ? brick : stoneF); seg.rotation.x = PI / 2 - a; }
      }
    }
    k.box(2 * SW, 0.35, 3.2, 0, GY, Z0 - 1.6, stone); k.box(2 * SW - 6.4, 1.0, 0.14, 0, GY + 0.7, Z0 - 3.2, woodDark); k.box(2 * SW - 6.4, 0.08, 0.22, 0, GY + 1.25, Z0 - 3.2, gilt);
    for (const x of [-4, 4]) { k.cyl(0.14, GY, x, GY / 2, Z0 - 3.2, k.flat(0x3a5a8a, 0.3, 0.5), 0.14, 10); k.keepOut.push({ x, z: Z0 - 3.2, r: 0.45 }); }
    /* stained glass along the upper walls */
    const pg = [archGlass(1641, [0x2a4ab8, 0x1c3a8a, 0xc8a030, 0x8a1a22, 0x2a7a4a, 0xd8c890]), archGlass(1642, [0x8a1a22, 0xc8a030, 0x2a4ab8, 0x3a8a8a, 0xe0d0a0])].map((t) => glassMat(t, 0xfff0e0));
    for (const s of [-1, 1]) [-9.5, -14.5, -19.5, -24.5].forEach((z, i) => k.plane(1.8, 4.8, s * (SW - 0.26), GY + 4.6, z, pg[(i + (s > 0 ? 1 : 0)) % 2], -s * PI / 2));
    for (const s of [-1, 1]) [-9.5, -14.5, -19.5, -24.5].forEach((z, i) => k.plane(1.6, 2.6, s * (SW - 0.26), 2.3, z, pg[(i + 1) % 2], -s * PI / 2));
    /* the ark: a gilt horseshoe arch on marble, plain curtain, blank tablets over it, the eternal light */
    k.box(9, 0.3, 3, 0, 0.15, Z1 + 1.5, stoneF); k.box(8, 0.3, 2.2, 0, 0.45, Z1 + 1.1, stoneF);
    k.mesh(holedWall(8, 10.5, 0.6, [{ kind: 'arch', cx: 0, y0: 0, w: 3.4, h: 6.6, shoe: 1.2 }]), gilt, 0, 0.6, Z1 + 0.5);
    k.box(3.6, 6.6, 0.1, 0, 0.6 + 3.3, Z1 + 0.25, k.flat(0x1a2a5a, 0, 0.85));
    k.box(3.2, 5.4, 0.06, 0, 0.6 + 2.7, Z1 + 0.32, k.flat(0x6a1a22, 0, 0.9));
    for (const x of [-3, 3]) k.column(x, 0.6, Z1 + 1, 6, 0.24, k.flat(0x3a5a8a, 0.3, 0.5), false, gilt);
    for (let i = 0; i < 15; i++) { const a = -0.4 + (PI + 0.8) * (i + 0.5) / 15, R = 2.2; const seg = k.box(R * (PI + 0.8) / 15 + 0.02, 0.4, 0.2, Math.cos(a) * (R + 0.2), 0.6 + 6.6 - 2.0 + Math.sin(a) * (R + 0.2), Z1 + 0.85, i % 2 ? brick : stoneF); seg.rotation.z = a + PI / 2; }
    tablets(k, 0, 9.8, Z1 + 0.85, k.flat(0xf0e8d6, 0, 0.5), gilt, 0.9);
    k.block(-4.6, 4.6, Z1 - 1, Z1 + 3.1);
    nerTamid(k, ctx, 0, 7.6, Z1 + 3.6, SH, brass);
    k.point(0, 6, Z1 + 5, 0xffd8a0, 14, 12);
    /* the reader's platform in the middle, pews facing the ark on either side */
    const BZ = -16;
    k.box(4.4, 0.5, 3.6, 0, 0.25, BZ, wood);
    for (const [w, d, x, z] of [[4.4, 0.1, 0, BZ - 1.8], [0.1, 3.6, -2.2, BZ], [0.1, 3.6, 2.2, BZ]] as number[][]) { k.box(w, 0.9, d, x, 0.95, z, woodDark); k.box(w + 0.05, 0.07, d + 0.08, x, 1.43, z, brass); }
    k.box(1.4, 1.0, 0.9, 0, 1.0, BZ - 0.9, woodDark); { const tp = k.box(1.6, 0.07, 1.1, 0, 1.55, BZ - 0.9, wood); tp.rotation.x = 0.22; }
    for (const x of [-2.2, 2.2]) { k.cyl(0.04, 1.2, x, 2.0, BZ - 1.8, brass); bulbs.push({ x, y: 2.7, z: BZ - 1.8 }); }
    k.block(-2.4, 2.4, BZ - 2, BZ + 2.2);
    const seated: { x: number; y: number; z: number; ry: number; sit?: boolean }[] = [];
    const rnd = X.mulberry(1643);
    for (let z = -9.5; z > -27; z -= 1.1) for (const [x0, x1] of [[-6.8, -1.3], [1.3, 6.8]]) {
      const inB = z < BZ + 2.6 && z > BZ - 2.6;
      const xa = x0 < 0 ? x0 : (inB ? 2.6 : x0), xb = x0 < 0 ? (inB ? -2.6 : x1) : x1;
      const L = xb - xa, xc = (xa + xb) / 2;
      k.box(L, 0.08, 0.45, xc, 0.46, z, wood); k.box(L, 0.9, 0.08, xc, 0.7, z + 0.26, woodDark); k.box(L, 0.42, 0.42, xc, 0.21, z, woodDark);
      for (let x = xa + 0.35; x < xb; x += 0.62) if (rnd() < 0.28) seated.push({ x, y: 0.28, z: z + 0.02, ry: 0, sit: true });
    }
    k.block(-7, -1.2, -27.4, -9.1); k.block(1.2, 7, -27.4, -9.1);
    k.block(-11.3, -6.2, -5.9, 0.45); k.block(6.2, 11.3, -5.9, 0.45);
    still(k, seated, 1644);
    for (const z of [-10.5, -21]) chandelier(k, 0, 9, z, 1.4, 10, brass, SH - 0.2, bulbs);
    for (const s of [-1, 1]) for (const z of [-11, -21]) chandelier(k, s * 5, 3.8, z, 0.5, 5, brass, GY - 0.2, bulbs);
    bulbsMesh(k, bulbs);
    k.point(0, 8.5, -12, 0xffdcaa, 16, 16); k.point(0, 8.5, -22, 0xffdcaa, 16, 16);
    /* pigeons on the tower tops, a flock round the east tower */
    pigeons(k, ctx, [v(-10.4, WT + 0.5, 0.2), v(-9.4, WT + 0.5, 0.2), v(-7.6, WT + 0.5, 0.2), v(8, ET + 0.5, 0.2), v(9.6, ET + 0.5, 0.2), v(-4, 0, 3.9), v(-3.2, 0, 4.1)], { x: 8.8, y: ET + 4, z: -2, r: 7, n: 8 }, 1645);
    /* ---- the works ---- */
    const mounts: Mount[] = [], st: FrameStyle = 'gilt';
    const post = k.flat(0x2a2620, 0.5, 0.5), back = k.flat(0x3a2a22, 0, 0.8);
    for (const x of [-8.75, 8.75, 14.2, 25.4]) board(k, mounts, x, 0, 1.25, 2.2, 1.6, st, back, post);
    for (const x of [-3.9, 3.9]) hang(mounts, x, 2.4, -5.17, 0, 2.2, 1.6, st, 2.9);
    for (const s of [-1, 1]) hang(mounts, s * 5.77, 2.4, -3.0, -s * PI / 2, 2.4, 1.7, st, 3.0);
    for (const x of [13.6, 16.8, 20, 23.2, 26.2]) hang(mounts, x, 2.0, -6.97, 0, 2.2, 1.5, st, 3.0);
    hang(mounts, 21.9, 2.0, -0.53, PI, 1.5, 1.1, st, 3.0);
    hang(mounts, SX0 + 0.43, 2.0, -3.8, PI / 2, 2.4, 1.6, st, 3.0);
    k.censusWall({ x: SX1 - 0.43, y: 2.0, z: -3.8, rotY: -PI / 2, cols: 11, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(6200, 55), pieces: ctx.all, backing: paleBlue });
    /* ---- eggs ---- */
    const src = { name: 'Park East Synagogue, Wikipedia', url: 'https://en.wikipedia.org/wiki/Park_East_Synagogue' };
    k.egg(v(0, 10.6, 0.2), { id: 'parkeast-1890', title: 'Schneider and Herter, 1890', year: '1890', text: 'The building was completed in 1890 to designs by the architects Schneider and Herter, in a Moorish Revival style mixed with Byzantine and Romanesque Revival elements, with a prominent rose window.', clue: 'Find the round window between the towers.', source: src }, { r: 2.6 });
    k.egg(v(CW / 2 + TW / 2, ET + 1.5, -1), { id: 'parkeast-towers', title: 'Two towers, not twins', text: 'The twin towers are asymmetrical: the eastern one is taller. Each was once topped by a bulbous dome, since removed.', clue: 'Compare the towers. Then look for what is missing from the tops.', source: src }, { r: 2.6 });
    k.egg(v(0, 5.9, 0.4), { id: 'parkeast-founding', title: 'Founded as Orthodox', year: '1890', text: 'Rabbi Bernard Drachman and Jonas Weil founded the congregation in 1890 to promote Orthodox Judaism as an alternative to Reform Judaism. A verse from Psalm 100 is carved over the doorway in granite, in Hebrew.', clue: 'Look over the main door, under the name.', source: src }, { r: 1.4 });
    k.egg(v(19.7, 3.2, 2.2), { id: 'parkeast-day-school', title: 'The school next door', text: 'The Park East Day School, beside the synagogue, teaches children from early childhood through eighth grade.', clue: 'Follow the children.', source: src }, { r: 1.6 });
    k.egg(v(-8.75, 6.8, 0.6), { id: 'parkeast-landmark', title: 'A landmark, and a visit', year: '1980', text: 'The synagogue was designated a New York City landmark on January 8, 1980, and listed on the National Register of Historic Places on August 18, 1983. In 2008 Pope Benedict XVI visited it, the only papal visit to a synagogue in the United States.', clue: 'The west tower has stood since 1890; find what the city decided about it.', source: src }, { r: 1.6 });
    return { mounts, spawn: v(-3.5, 3, 16.8), look: v(1.5, 9, 0), eye: 3, bounds: [-30, 30, -29, 17.2], style: 'gilt' };
  },
};
