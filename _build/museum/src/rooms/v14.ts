/* 161, merged: the Edmond J. Safra Synagogue on East 63rd Street, with the round domed sanctuary of
   MLow's July ARCHITECT build brought inside today's house standard room. The street front, the
   lobby, the social hall and the census wall come from v12; the ring of twelve stone piers, the ribbed
   wooden dome with its lit cove and oculus, the bronze mesh ark in its niche, the round reader's
   platform, the curved benches, the gallery, the lantern on its chain, the Heritage Library below
   and the roof garden above come from July. Rules kept: no likeness of any real person, no lettered
   scripture anywhere (the band over the ark is plain stone, the tablets are blank), and no New Yorker
   in the sanctuary: the art hangs in the lobby, the library, the social hall and on the roof. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];

/* ---------------- helpers, copied from v12 (not exported there) ---------------- */
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

/* a flat ring or ring segment on the floor plan, in the room's angle convention (x = r sin a, z = r cos a) */
function ringXZ(r0: number, r1: number, a0: number, a1: number, seg = 48) {
  const g = new T.RingGeometry(r0, r1, seg, 1, 0, a1 - a0);
  g.rotateX(PI / 2); g.rotateY(a1 - PI / 2);
  return g;
}
/* an arc of points at radius r, height y, round centre (cx, cz) */
function arcPts(cx: number, cz: number, r: number, y: number, a0: number, a1: number, n = 32) {
  return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / n); return v(cx + r * Math.sin(a), y, cz + r * Math.cos(a)); });
}
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/* ================================================================== */
/* ---------------- 161 SAFRA SYNAGOGUE, merged with the July build ---------------- */
export const safra2: RoomDef = {
  id: 'safra',
  name: 'Jerusalem stone on 63rd',
  area: 'SAFRA SYNAGOGUE / EAST 63RD STREET',
  mood: 'Friday afternoon, stone, wood and light',
  color: '#c9b89a',
  daylit: true,
  description: 'The Edmond J. Safra Synagogue, a Beaux-Arts house of Jerusalem stone on a townhouse block off Fifth Avenue, home since 2003 to a Sephardic congregation. You stand in the stone lobby with the bronze doors open onto the round sanctuary: twelve stone piers, a ribbed wooden dome lit round its rim and open to the sky at its crown, the reader\'s platform in the middle and the bronze ark in its niche with the lamp burning before it. The New Yorkers hang in the lobby, the Heritage Library downstairs, the social hall and the roof garden, never in the sanctuary.',
  signatures: 'The Jerusalem stone front with its arched bronze doors and tall arched window, the stone lobby, the round sanctuary on a ring of twelve piers, the ribbed wooden dome with its lit cove and oculus, the gallery between the piers, the round reader\'s platform with the curved benches round it, the cylindrical bronze ark in its stone niche with blank tablets, the lamp on its long chain, the wood panelled Heritage Library, the social hall, the roof garden over the dome, and the brownstones of East 63rd Street.',
  build(k, ctx) {
    k.sky({ top: 0x4f88d0, horizon: 0xd8e4ee, ground: 0x8a8478, fog: 0.0026, sun: { az: 2.2, el: 0.75, color: 0xfff4e0, size: 8 }, env: 0.6 });
    k.hemi(0xe8e4dc, 0x8a8478, 0.9);
    k.sun(0xfff0d8, 2.6, 30, 70, 40, true, 70);
    const plasterS = X.plaster(0xe2d3b0, 162);
    const jer = k.pbr('sfJer', X.ashlar(0xd6c298, 161, 6), 0.6, { normal: 0.3, roughness: 0.85 }),
      jerPlain = k.pbr('sfJer2', plasterS, 0.3, { roughness: 0.85 }),
      jerPlain2 = k.pbr('sfJer2d', plasterS, 0.3, { roughness: 0.85, side: T.DoubleSide }),
      jerDark = k.pbr('sfJer3', X.ashlar(0xbca880, 163, 4), 0.6, { normal: 0.35, roughness: 0.9 }),
      jer2 = k.pbr('sfJerD', X.ashlar(0xd6c298, 161, 6), 0.6, { normal: 0.3, roughness: 0.85, side: T.DoubleSide }),
      floorM = k.pbr('sfFloor', X.marble(0xb4a68a, 0x8a7a5e, 164), 0.28, { roughness: 0.4 }),
      wood = k.pbr('sfWood', X.planks(0x6a4428, 6, 165), 0.8, { roughness: 0.55 }), woodDark = k.flat(0x3e2616, 0, 0.5),
      wood2 = k.pbr('sfWoodD', X.planks(0x8a5a30, 6, 165), 0.8, { roughness: 0.55, side: T.DoubleSide }),
      domeWood = k.pbr('sfDome', X.planks(0xb4834c, 10, 169), 0.5, { roughness: 0.6, side: T.BackSide }),
      bronze = k.flat(0x8a6434, 0.9, 0.36), brass = k.flat(0xc8a050, 1, 0.3), silver = k.flat(0xd8dce0, 1, 0.22),
      leather = k.flat(0x7a1e22, 0, 0.6), lead = k.flat(0x9a968a, 0.3, 0.6),
      asph = k.pbr('sfAsph', X.asphalt(), 0.3), walk = k.pbr('sfWalk', X.pavers(0x9a968c, 166), 0.5), curb = k.flat(0x8a8680, 0, 0.8),
      darkGlass = k.flat(0x2c3640, 0.35, 0.22), iron = k.flat(0x1c1c1c, 0.6, 0.5), cloth = k.flat(0xe8e2d4, 0, 0.9), line = k.flat(0xe8e4d8, 0, 0.8),
      colM = k.pbr('sfCol', X.marble(0xe2d6b8, 0xb8a888, 168), 0.4, { roughness: 0.3 }),
      deck = k.pbr('sfDeck', X.planks(0x8a6a4a, 8, 171), 0.7, { roughness: 0.8 }), soil = k.flat(0x3a2a1c, 0, 1);
    const coveGlow = new T.MeshBasicMaterial({ color: 0xffe2b0, side: T.DoubleSide });
    const bulbs: { x: number; y: number; z: number }[] = [];
    const mounts: Mount[] = [], st: FrameStyle = 'gilt';

    /* ---- East 63rd Street: pavement, road, the far pavement, brownstones opposite ---- */
    k.box(76, 0.2, 4.5, 0, -0.1, 2.25, walk); k.box(76, 0.2, 8, 0, -0.14, 8.5, asph); k.box(76, 0.2, 4.5, 0, -0.1, 14.75, walk);
    for (const z of [4.5, 12.5]) k.box(76, 0.18, 0.25, 0, -0.02, z, curb);
    for (let x = -36; x < 36; x += 3.2) k.box(1.6, 0.012, 0.12, x, 0.005, 8.5, line);
    houses(k, -38, 38, 17, -1, 630, { hMin: 15, hMax: 22 });
    houses(k, -38, -12, 0, 1, 640, { hMin: 18, hMax: 22 });
    houses(k, 14.4, 38, 0, 1, 650, { hMin: 17, hMax: 23 });
    /* the backs of the 62nd Street houses across the yards, seen from the roof */
    houses(k, -38, 40, -60, 1, 670, { hMin: 16, hMax: 26 });
    k.box(80, 0.1, 48, 0, -0.06, -36.5, k.flat(0x6e6a60, 0, 0.95));
    k.block(-40, -12.1, -0.9, 0.4); k.block(14.2, 40, -0.9, 0.4);
    for (const [x, z] of [[-17, 3.4], [19.5, 3.4], [-19, 13.6], [-6, 13.6], [7, 13.6], [20, 13.6]]) { k.tree(x, 0, z, { h: 5.5, r: 2, seed: 161 }); k.box(1.4, 0.06, 1.4, x, 0.03, z, iron); k.keepOut.push({ x, z, r: 0.8 }); }
    traffic(k, ctx, { lanes: [{ z: 7.2, dir: -1, n: 4, speed: 7 }, { z: 9.8, dir: -1, n: 3, speed: 8 }, { z: 5.5, dir: 0, n: 5 }, { z: 11.6, dir: 0, n: 6 }], x0: -38, x1: 38, seed: 1612 });
    k.crowd([v(-34, 0, 2.6), v(34, 0, 2.6)], 7, { seed: 1613, spread: 1.4, animate: !ctx.reduced, speed: 1.0 });
    k.crowd([v(-34, 0, 14.6), v(34, 0, 14.6)], 8, { seed: 1614, spread: 1.6, animate: !ctx.reduced, speed: 1.1 });

    /* ---- the front: Jerusalem stone, 24 m wide, 20 m up (from v12) ---- */
    const FW = 24, FH = 20;
    const front = holedWall(FW, FH, 0.6, [
      { kind: 'arch', cx: 0, y0: 0, w: 3, h: 5.2 },
      { kind: 'arch', cx: 0, y0: 7.4, w: 4, h: 7.4 },
      { kind: 'arch', cx: -6.6, y0: 1.2, w: 1.8, h: 3.2 }, { kind: 'arch', cx: 6.6, y0: 1.2, w: 1.8, h: 3.2 },
      { kind: 'rect', cx: -7.4, y0: 8.2, w: 2, h: 4.4 }, { kind: 'rect', cx: 7.4, y0: 8.2, w: 2, h: 4.4 },
      ...[-7.4, -3, 3, 7.4].map((cx) => ({ kind: 'rect' as const, cx, y0: 16.6, w: 1.4, h: 1.6 })),
    ]);
    k.mesh(front, jer, 0, 0, -0.3);
    for (let y = 0.7; y < 6; y += 0.72) for (const [a, b] of [[-12, -7.6], [-5.6, -1.9], [1.9, 5.6], [7.6, 12]]) k.box(b - a, 0.06, 0.05, (a + b) / 2, y, 0.02, jerDark);
    k.box(FW + 0.4, 0.5, 0.5, 0, 6.2, 0.1, jerDark);
    for (const x of [-10.6, -4, 4, 10.6]) { k.box(1.1, 8.6, 0.35, x, 10.6, 0.15, jer); k.box(1.4, 0.5, 0.5, x, 15.1, 0.2, jerDark); }
    k.moulding([[0, 0], [0.9, 0], [0.9, 0.3], [0.6, 0.55], [0.3, 0.7], [0, 0.72]], FW + 0.8, 0, 15.4, 0, jerDark, -PI / 2);
    k.box(FW + 0.6, 0.35, 0.8, 0, 19.2, 0.1, jerDark);
    for (let x = -11.5; x <= 11.5; x += 0.55) k.cyl(0.1, 0.8, x, 19.8, 0.1, jer, 0.14, 8);
    k.box(FW + 0.6, 0.2, 0.6, 0, 20.3, 0.1, jerDark);
    for (const [cy, r] of [[5.2 - 1.5, 1.5], [14.8 - 2, 2]] as [number, number][]) {
      for (let i = 0; i < 13; i++) { const a = (i + 0.5) / 13 * PI, s = k.box(r * PI / 13 + 0.02, 0.32, 0.25, Math.cos(a) * (r + 0.16), cy + Math.sin(a) * (r + 0.16), 0.1, i === 6 ? jerDark : jer); s.rotation.z = a + PI / 2; }
    }
    k.plane(4, 7.4, 0, 7.4 + 3.7, -0.28, darkGlass); k.plane(1.8, 3.2, -6.6, 2.8, -0.28, darkGlass); k.plane(1.8, 3.2, 6.6, 2.8, -0.28, darkGlass);
    for (const x of [-7.4, 7.4]) k.plane(2, 4.4, x, 10.4, -0.28, darkGlass);
    for (const x of [-7.4, -3, 3, 7.4]) k.plane(1.4, 1.6, x, 17.4, -0.28, darkGlass);
    for (const cx of [-6.6, 6.6]) for (let i = -3; i <= 3; i++) k.box(0.04, 3.1, 0.04, cx + i * 0.26, 2.75, 0.02, iron);
    for (let i = -4; i <= 4; i++) k.box(0.04, 5.5, 0.04, i * 0.45, 11, -0.2, bronze);
    k.sign('EDMOND J. SAFRA SYNAGOGUE', 9, 0.7, 0, 6.72, 0.36, 'transparent', '#5a4a30', 58);
    /* the narrow stone bay to the east that carries the stair up to the roof garden */
    k.box(2.4, 20.6, 0.6, 13.2, 10.3, -0.3, jer);
    for (const y of [3, 9, 15]) k.plane(1.1, 2.2, 13.2, y, 0.02, darkGlass);
    k.block(-12.1, -1.5, -0.9, 0.35); k.block(1.5, 14.4, -0.9, 0.35);
    /* the bronze doors, a tree worked in low relief (Mark Beard's Tree of Life, drawn abstractly) */
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
    wallZ(k, -12, -0.6, -5, 7, 0.4, jer, [{ c: -9.3, w: 2.2, h: 3.9 }]);
    wallZ(k, -12, -0.6, 5, 7, 0.4, jer, [{ c: -6.3, w: 2.2, h: 3.4 }]);
    k.box(10.4, 0.4, 12.4, 0, 7.2, -6.3, jerPlain);
    for (const z of [-3, -6.3, -9.6]) k.box(10, 0.3, 0.3, 0, 6.85, z, jerDark);
    for (const z of [-3, -9.6]) { k.cyl(0.02, 1.4, 0, 6.3, z, bronze); k.lathe([[0.05, 0], [0.32, -0.12], [0.36, -0.3], [0.06, -0.4]], 0, 5.6, z, bronze, 16); bulbs.push({ x: 0, y: 5.25, z }); }
    k.point(0, 5, -4.5, 0xffdcaa, 16, 14); k.point(0, 5, -9.5, 0xffdcaa, 14, 12);
    k.sign('HERITAGE LIBRARY', 2.2, 0.26, -4.78, 4.3, -9.3, 'transparent', '#5a4a30', 44, PI / 2);
    k.sign('SOCIAL HALL', 2.0, 0.26, 4.78, 3.8, -6.3, 'transparent', '#5a4a30', 44, -PI / 2);
    /* the wall between the lobby and the sanctuary: one round arched opening, bronze doors folded back */
    k.mesh(holedWall(22.5, 12.2, 0.5, [{ kind: 'arch', cx: 0, y0: 0, w: 5, h: 6.8 }]), jer, 0, 0, -12);
    k.block(-11.3, -2.5, -12.45, -11.55); k.block(2.5, 11.3, -12.45, -11.55);
    for (let i = 0; i < 17; i++) { const a = (i + 0.5) / 17 * PI, s = k.box(2.8 * PI / 17 + 0.03, 0.34, 0.7, Math.cos(a) * 2.8, 4.3 + Math.sin(a) * 2.8, -12, i === 8 ? jerDark : jer); s.rotation.z = a + PI / 2; }
    for (const x of [-2.75, 2.75]) k.box(0.5, 4.3, 0.7, x, 2.15, -12, jerDark);
    for (const s of [-1, 1]) k.box(0.1, 5.4, 2.4, s * 2.35, 2.7, -10.75, doorM);
    /* the vestibule under a barrel vault, into the round room */
    wallZ(k, -15.3, -12.25, -2.55, 4.3, 0.2, jerPlain); wallZ(k, -15.3, -12.25, 2.55, 4.3, 0.2, jerPlain);
    { const g = new T.CylinderGeometry(2.55, 2.55, 3.1, 24, 1, true, PI / 2, PI); g.rotateX(PI / 2); k.mesh(g, jerPlain2, 0, 4.3, -13.75); }
    k.box(5.1, 0.1, 3.2, 0, 0.0, -13.75, floorM);

    /* ---- the round sanctuary: twelve piers, a gallery, a ribbed wooden dome ---- */
    const CZ = -25.5, RW = 10.6, RC = 8.0, SPR = 11, DH = 6, RD = RW - 0.25, GY = 5.2, EA = 0.287, AA = 0.3;
    k.box(22, 0.1, 26.6, 0, 0, -25.4, floorM);
    for (const [a, b] of [[2.9, 3.25], [7.0, 7.3]]) { const g = new T.RingGeometry(a, b, 72); g.rotateX(-PI / 2); k.mesh(g, jerDark, 0, 0.06, CZ); }
    /* the outer wall: coursed stone to the gallery, plain above, open at the entry and at the ark */
    for (const [t0, t1] of [[EA, PI - AA], [PI + AA, 2 * PI - EA]]) {
      k.mesh(new T.CylinderGeometry(RW, RW, GY, 48, 1, true, t0, t1 - t0), jer2, 0, GY / 2, CZ);
      k.mesh(new T.CylinderGeometry(RW, RW, SPR - GY, 48, 1, true, t0, t1 - t0), jerPlain2, 0, (GY + SPR) / 2, CZ);
    }
    k.mesh(new T.CylinderGeometry(RW, RW, SPR - 9.6, 8, 1, true, PI - AA, 2 * AA), jerPlain2, 0, (SPR + 9.6) / 2, CZ);
    /* the inner face of the entry: a flat stone wall with the arch, meeting the ring */
    k.mesh(holedWall(6.2, SPR, 0.4, [{ kind: 'arch', cx: 0, y0: 0, w: 5.1, h: 6.8 }]), jerPlain, 0, 0, CZ + RW * Math.cos(EA) + 0.05);
    for (const s of [-1, 1]) k.block(s > 0 ? 2.5 : -3.3, s > 0 ? 3.3 : -2.5, -15.8, -14.8);
    /* the ring is solid: a chain of blocks round it, leaving the entry and the ark */
    for (let i = 0; i < 48; i++) {
      const a = ((i + 0.5) / 48) * PI * 2, w = Math.min(a, 2 * PI - a);
      if (w < EA + 0.02 || Math.abs(a - PI) < AA) continue;
      const x = Math.sin(a) * 11, z = CZ + Math.cos(a) * 11;
      k.block(x - 0.85, x + 0.85, z - 0.85, z + 0.85);
    }
    /* the square shell outside the ring, seen from the roof garden and the stair */
    wallZ(k, -38.6, -12.25, -11, 12.2, 0.5, jer, [], 0, false); wallZ(k, -38.6, -12.25, 11, 12.2, 0.5, jer, [], 0, false);
    wallX(k, -11.25, 11.25, -38.6, 12.2, 0.5, jer, [], 0, false);
    {
      const sh = new T.Shape(); sh.moveTo(-11.25, -13.2); sh.lineTo(11.25, -13.2); sh.lineTo(11.25, 13.2); sh.lineTo(-11.25, 13.2); sh.closePath();
      const hole = new T.Path(); hole.absarc(0, 0, RW + 0.35, 0, PI * 2, false); sh.holes.push(hole);
      const g = new T.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false, curveSegments: 48 }); g.rotateX(-PI / 2);
      k.mesh(g, jerPlain, 0, 12.2, CZ);
      k.box(22.6, 0.5, 0.6, 0, 12.8, -38.6, jerDark); for (const s of [-1, 1]) k.box(0.6, 0.5, 26.6, s * 11, 12.8, CZ, jerDark);
    }
    /* the drum and dome as seen from outside, with a small lantern over the oculus */
    k.mesh(new T.CylinderGeometry(RW + 0.35, RW + 0.35, 1.6, 64, 1, true), jer2, 0, 12.2 + 0.8, CZ);
    { const g = new T.SphereGeometry(RW + 0.35, 48, 12, 0, PI * 2, 0, PI / 2); g.scale(1, 5.4 / (RW + 0.35), 1); k.mesh(g, lead, 0, 13.8, CZ); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; const p0 = (ph: number) => v(Math.sin(a) * (RW + 0.42) * Math.sin(ph), 13.8 + 5.45 * Math.cos(ph), CZ + Math.cos(a) * (RW + 0.42) * Math.sin(ph)); for (let s = 0; s < 4; s++) k.bar(p0(0.2 + s * 0.34), p0(0.2 + (s + 1) * 0.34), 0.14, 0.12, jerPlain); }
    k.cyl(1.8, 1.4, 0, 19.7, CZ, jer, 1.8, 16); k.lathe([[1.95, 0], [1.2, 0.5], [0.3, 0.9], [0.05, 1.3]], 0, 20.4, CZ, lead, 16);
    /* the twelve piers, set off the two axes so the aisles to the ark and the door stay clear */
    for (let i = 0; i < 12; i++) {
      const a = ((i + 0.5) / 12) * PI * 2, x = Math.sin(a) * RC, z = CZ + Math.cos(a) * RC;
      for (const [w, h, d, y, m] of [[1.2, SPR, 1.1, SPR / 2, jer], [1.55, 0.45, 1.45, 0.22, jerDark], [1.55, 0.5, 1.45, SPR - 0.25, jerDark], [1.35, 0.25, 1.25, GY + 0.15, jerDark]] as [number, number, number, number, T.Material][]) { const o = k.box(w, h, d, x, y, z, m); o.rotation.y = a; }
      const sx = Math.sin(a) * (RC - 0.62), sz = CZ + Math.cos(a) * (RC - 0.62);
      const br = k.box(0.08, 0.34, 0.2, sx, 3.5, sz, brass); br.rotation.y = a;
      bulbs.push({ x: Math.sin(a) * (RC - 0.8), y: 3.75, z: CZ + Math.cos(a) * (RC - 0.8) });
      k.keepOut.push({ x, z, r: 0.85 });
    }
    const winM = glassMat(archGlass(1611, [0xf4ecd8, 0xece2c8, 0xe0d4b4, 0xf8f2e2, 0xd8c8a0], { cell: 32, lead: '#8a7a5a', medallion: false }), 0xffffff);
    /* the women's gallery between the piers, all round except over the door and the ark */
    for (const [a0, a1] of [[PI / 12, PI - PI / 12], [PI + PI / 12, 2 * PI - PI / 12]]) {
      k.mesh(ringXZ(8.35, RW, a0, a1, 40), jerPlain2, 0, GY, CZ);
      k.mesh(ringXZ(8.35, RW, a0, a1, 40), jerPlain2, 0, GY - 0.35, CZ);
      k.mesh(new T.CylinderGeometry(8.35, 8.35, 1.45, 40, 1, true, a0, a1 - a0), wood2, 0, GY + 0.35, CZ);
      k.curve(arcPts(0, CZ, 8.3, GY + 1.1, a0, a1, 40), 0.06, brass, 80);
      /* clerestory windows above it, one to a bay */
      for (let b = 0; b < 5; b++) {
        const a = a0 + (b + 0.5) * (a1 - a0) / 5;
        k.plane(1.7, 3.6, Math.sin(a) * (RW - 0.06), 8.3, CZ + Math.cos(a) * (RW - 0.06), winM, a + PI);
      }
    }
    /* the lit cove where the dome springs: a stone ledge with a lip, light hidden behind it */
    k.mesh(ringXZ(RD - 0.95, RW, 0, 2 * PI, 72), jerPlain2, 0, SPR, CZ);
    k.mesh(new T.CylinderGeometry(RD - 0.95, RD - 0.95, 0.75, 72, 1, true), jerPlain2, 0, SPR - 0.2, CZ);
    k.mesh(new T.CylinderGeometry(RD - 0.15, RD - 0.15, 0.7, 72, 1, true), coveGlow, 0, SPR + 0.4, CZ);
    /* the dome: a warm wooden shell, twenty four ribs, two hoops, and the oculus at the crown */
    { const phi0 = 0.14, g = new T.SphereGeometry(RD, 64, 18, 0, PI * 2, phi0, PI / 2 - phi0); g.scale(1, DH / RD, 1); k.mesh(g, domeWood, 0, SPR, CZ); }
    const dp = (ph: number, a: number, r = RD - 0.1) => v(Math.sin(a) * r * Math.sin(ph), SPR + DH * (r / RD) * Math.cos(ph), CZ + Math.cos(a) * r * Math.sin(ph));
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; for (let s = 0; s < 8; s++) { const p0 = 0.14 + (s / 8) * (PI / 2 - 0.14), p1 = 0.14 + ((s + 1) / 8) * (PI / 2 - 0.14); k.bar(dp(p0, a), dp(p1, a), 0.2, 0.18, woodDark); } }
    for (const ph of [0.62, 1.1]) k.curve(Array.from({ length: 73 }, (_, i) => dp(ph, (i / 72) * PI * 2, RD - 0.16)), 0.07, woodDark, 144, true);
    const OR = RD * Math.sin(0.14);
    k.mesh(new T.CylinderGeometry(OR, OR, 1.3, 32, 1, true), jerPlain2, 0, SPR + DH + 0.5, CZ);
    { const g = new T.CircleGeometry(OR, 32); g.rotateX(PI / 2); k.mesh(g, k.glow(0xfff6e4), 0, SPR + DH + 1.1, CZ); }
    k.torus(OR + 0.04, 0.09, 0, SPR + DH - 0.05, CZ, brass, 40).rotation.x = PI / 2;
    { const g = new T.CylinderGeometry(OR * 0.95, 3.4, SPR + DH - 1.5, 32, 1, true); const m = new T.MeshBasicMaterial({ color: 0xfff4dc, transparent: true, opacity: 0.03, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }); k.mesh(g, m, 0, (SPR + DH - 1.5) / 2 + 1.2, CZ, true); }
    k.point(0, 14, CZ, 0xfff4e4, 60, 30, 1.5);
    k.point(0, 7.5, CZ + 4, 0xffe6c0, 22, 22, 1.6);

    /* the ark: a niche in the ring, three steps, a cylinder of woven bronze, blank tablets above */
    const AZ = CZ - RW * Math.cos(AA);
    wallZ(k, -38.4, AZ, -3.1, 9.6, 0.3, jerDark, [], 0, false); wallZ(k, -38.4, AZ, 3.1, 9.6, 0.3, jerDark, [], 0, false);
    k.box(6.5, 9.6, 0.3, 0, 4.8, -38.4, jerDark); k.box(6.5, 0.3, 3.1, 0, 9.6, (AZ - 38.4) / 2, jerPlain);
    for (let s = 0; s < 3; s++) k.box(6.0 - s * 0.9, 0.3, 2.6 - s * 0.5, 0, 0.15 + s * 0.3, -34.4 - s * 0.3 - 1, floorM);
    k.box(6.1, 0.9, 3.1, 0, 0.45, -37, floorM);
    for (const x of [-2.55, 2.55]) k.column(x, 0.9, -35.9, 6.6, 0.24, colM);
    k.box(6.1, 0.55, 0.5, 0, 7.75, -35.9, jerDark);
    const hx = 0, hz = -37.0, hy = 0.9, hr = 1.4, hh = 3.4;
    k.cyl(hr - 0.18, hh - 0.1, hx, hy + hh / 2, hz, k.flat(0x4a1016, 0, 0.9), hr - 0.18, 24);
    for (let i = 0; i < 44; i++) { const a = (i / 44) * PI * 2; const o = k.box(0.07, hh, 0.05, hx + Math.sin(a) * hr, hy + hh / 2, hz + Math.cos(a) * hr, bronze); o.rotation.y = a; }
    for (let j = 1; j < 8; j++) k.torus(hr + 0.01, 0.018, hx, hy + (j / 8) * hh, hz, bronze, 44).rotation.x = PI / 2;
    for (const y of [hy, hy + hh]) k.torus(hr + 0.02, 0.07, hx, y, hz, brass, 44).rotation.x = PI / 2;
    { const g = new T.SphereGeometry(hr + 0.02, 32, 10, 0, PI * 2, 0, PI / 2); g.scale(1, 0.55, 1); k.mesh(g, bronze, hx, hy + hh, hz); }
    k.sphere(0.12, hx, hy + hh + 0.85, hz, brass, 12);
    /* a plain stone band where the July build carried an inscription, and blank tablets */
    k.box(5.2, 0.62, 0.14, 0, 8.7, -38.2, jerPlain); for (const y of [8.38, 9.02]) k.box(5.2, 0.05, 0.16, 0, y, -38.2, brass);
    tablets(k, 0, 6.35, -38.1, k.flat(0xf0e8d6, 0, 0.5), brass, 0.9);
    k.block(-3.4, 3.4, -39.2, -33.6);
    k.point(0, 6.2, -33.2, 0xffd8a0, 16, 12);
    /* the eternal light: a brass lantern on a long chain from the dome, burning before the ark */
    {
      const lx = 0, lz = -32.2, ly = 5.4, top = SPR + DH * Math.sqrt(1 - ((CZ - lz) / RD) ** 2) - 0.05;
      k.beam(v(lx, ly + 0.95, lz), v(lx, top, lz), 0.018, brass, 5);
      k.torus(0.12, 0.025, lx, ly + 0.92, lz, brass, 16);
      k.lathe([[0.02, 0.9], [0.2, 0.72], [0.46, 0.5], [0.5, 0.44]], lx, ly, lz, brass, 6);
      k.lathe([[0.5, -0.46], [0.36, -0.62], [0.12, -0.8], [0.02, -1.05]], lx, ly, lz, brass, 6);
      for (const y of [0.44, -0.46]) k.torus(0.5, 0.03, lx, ly + y, lz, brass, 24).rotation.x = PI / 2;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; k.beam(v(lx + Math.sin(a) * 0.5, ly - 0.46, lz + Math.cos(a) * 0.5), v(lx + Math.sin(a) * 0.5, ly + 0.44, lz + Math.cos(a) * 0.5), 0.02, brass, 4); }
      k.mesh(new T.CylinderGeometry(0.48, 0.48, 0.88, 6, 1, true), k.glass(0xfff2d8, 0.18, 0.1), lx, ly, lz);
      const flame = k.mesh(new T.SphereGeometry(0.26, 16, 12), new T.MeshBasicMaterial({ color: 0xffa040 }), lx, ly, lz, true);
      const L = k.point(lx, ly - 0.2, lz + 0.6, 0xff8a3a, 9, 12, 1.8);
      if (!ctx.reduced) k.ticks.push((t) => { const f = 0.86 + 0.08 * Math.sin(t * 6.1) + 0.06 * Math.sin(t * 13.7 + 1.3); L.intensity = 9 * f; flame.scale.setScalar(0.92 + 0.1 * f); });
    }
    /* the reader's platform in the middle: a round stone base, a ring of wood with an opening to the door */
    k.cyl(2.75, 0.45, 0, 0.225, CZ, jerDark, 2.75, 48);
    k.mesh(new T.CylinderGeometry(2.6, 2.6, 1.15, 48, 1, true, 0.3, 2 * PI - 0.6), wood2, 0, 0.45 + 0.575, CZ);
    k.curve(arcPts(0, CZ, 2.62, 1.62, 0.3, 2 * PI - 0.3, 48), 0.05, brass, 96);
    for (let i = 0; i < 42; i++) { const a = 0.3 + (i / 41) * (2 * PI - 0.6); const o = k.box(0.07, 1.15, 0.06, Math.sin(a) * 2.66, 1.02, CZ + Math.cos(a) * 2.66, woodDark); o.rotation.y = a; }
    for (const a of [0.3, -0.3]) { k.cyl(0.05, 1.35, Math.sin(a) * 2.62, 1.12, CZ + Math.cos(a) * 2.62, brass, 0.05, 8); bulbs.push({ x: Math.sin(a) * 2.62, y: 1.95, z: CZ + Math.cos(a) * 2.62 }); }
    for (let s = 0; s < 2; s++) k.box(1.8 - s * 0.3, 0.15, 0.4, 0, 0.075 + s * 0.15, CZ + 2.95 - s * 0.3, jerDark);
    k.box(1.7, 1.0, 0.9, 0, 0.95, CZ - 0.6, woodDark); { const top = k.box(1.9, 0.08, 1.1, 0, 1.5, CZ - 0.6, wood); top.rotation.x = -0.28; }
    /* the Torah case standing upright in the Sephardic way: silver, plain, no lettering */
    k.cyl(0.32, 1.1, 0, 0.45 + 0.55, CZ - 1.6, silver, 0.32, 24);
    { const g = new T.SphereGeometry(0.32, 20, 8, 0, PI * 2, 0, PI / 2); k.mesh(g, silver, 0, 1.55, CZ - 1.6); }
    for (const s of [-1, 1]) { k.cyl(0.025, 0.5, s * 0.16, 1.9, CZ - 1.6, silver, 0.025, 6); k.cyl(0.06, 0.16, s * 0.16, 2.2, CZ - 1.6, brass, 0.09, 10); }
    k.keepOut.push({ x: 0, z: CZ, r: 2.95 });
    /* the benches in arcs round the platform, facing it, split by the aisles to the door and the ark */
    const seated: { x: number; y: number; z: number; ry: number; sit?: boolean }[] = [];
    const rnd = X.mulberry(1615);
    for (const r of [3.9, 4.9, 5.9]) for (const sgn of [1, -1]) {
      const a0 = 0.42, a1 = PI - 0.52, n = Math.floor((r * (a1 - a0)) / 0.82);
      for (let i = 0; i < n; i++) {
        const a = sgn * (a0 + ((i + 0.5) / n) * (a1 - a0)), cx = Math.sin(a), cz = Math.cos(a), W = (r * (a1 - a0)) / n + 0.02;
        const put = (w: number, h: number, d: number, rr: number, y: number, m: T.Material) => { const o = k.box(w, h, d, cx * rr, y, CZ + cz * rr, m); o.rotation.y = a; };
        put(W, 0.4, 0.5, r, 0.2, woodDark); put(W, 0.1, 0.48, r, 0.45, leather); put(W, 0.62, 0.08, r + 0.27, 0.72, wood); put(W, 0.06, 0.2, r + 0.38, 0.86, wood);
        if (rnd() < 0.32) seated.push({ x: cx * r, y: 0.3, z: CZ + cz * r, ry: a, sit: true });
      }
    }
    for (const sgn of [1, -1]) for (let i = 0; i < 9; i++) { const a = sgn * (0.62 + (i / 8) * (PI - 1.24)); k.keepOut.push({ x: Math.sin(a) * 4.9, z: CZ + Math.cos(a) * 4.9, r: 1.28 }); }
    /* a few in the gallery */
    for (let i = 0; i < 10; i++) { const a = (i < 5 ? 0.5 : PI + 0.5) + (i % 5) * 0.46; seated.push({ x: Math.sin(a) * 9.3, y: GY + 0.02, z: CZ + Math.cos(a) * 9.3, ry: a, sit: true }); }
    still(k, seated, 1616);
    /* congregants arriving from the street, through the lobby, into the sanctuary */
    k.crowd([v(-16, 0, 3), v(-5, 0, 2.6), v(0, 0, 1.6), v(0.8, 0, -2.4), v(0.9, 0, -8), v(0.4, 0, -13.6), v(0.6, 0, -18.5), v(1.2, 0, -21.4)], 9, { seed: 1617, spread: 0.6, speed: 0.8, animate: !ctx.reduced, colors: [0x1c1e24, 0x2a2e38, 0x1a1a1c, 0x3a3230, 0xe0dcd0, 0x2c3a4a] });

    /* ---- the social hall, to the right of the lobby (from v12) ---- */
    k.box(6.6, 0.1, 11.6, 8.2, 0.0, -6.3, k.pbr('sfHallF', X.planks(0x8a6a48, 8, 167), 0.6, { roughness: 0.5 }));
    k.box(6.9, 0.3, 11.6, 8.2, 4.95, -6.3, jerPlain);
    for (const [x, z] of [[6.9, -3.8], [6.9, -7.4]]) {
      k.cyl(0.85, 0.05, x, 0.76, z, cloth, 0.85, 20); k.cyl(0.07, 0.74, x, 0.37, z, iron);
      for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; k.box(0.42, 0.45, 0.42, x + Math.cos(a) * 1.2, 0.23, z + Math.sin(a) * 1.2, woodDark); k.box(0.42, 0.5, 0.06, x + Math.cos(a) * 1.42, 0.7, z + Math.sin(a) * 1.42, woodDark).rotation.y = PI / 2 - a; }
      k.keepOut.push({ x, z, r: 1.45 });
    }
    k.box(2.2, 0.9, 0.6, 9.8, 0.45, -11.4, woodDark); k.lathe([[0.18, 0], [0.24, 0.1], [0.24, 0.4], [0.12, 0.55], [0.03, 0.62]], 9.4, 0.9, -11.4, k.flat(0xb8bcc0, 1, 0.25), 14);
    k.point(8.3, 3.8, -6.3, 0xffe2b8, 10, 10);
    k.sign('ROOF GARDEN', 1.8, 0.24, 11.33, 3.7, -2.4, 'transparent', '#5a4a30', 44, -PI / 2);

    /* ---- the stair to the roof garden, beside the social hall and the sanctuary ---- */
    const RY = 12, S0 = -4, S1 = -31;
    wallZ(k, -12, -0.6, 11.45, 18, 0.2, jerPlain, [{ c: -2.4, w: 2.2, h: 3.8 }]);
    wallZ(k, S1, -12, 11.45, 18, 0.2, jerPlain);
    wallZ(k, S1, -0.6, 13.95, 18, 0.3, jer);
    k.box(2.5, 0.1, 3.4, 12.7, 0, -2.3, floorM);
    { const N = 48; for (let i = 0; i < N; i++) { const z = S0 + ((i + 0.5) / N) * (S1 - S0), y = RY * ((i + 1) / N); k.box(2.4, y, Math.abs(S1 - S0) / N + 0.02, 12.7, y / 2, z, i % 2 ? floorM : colM); } }
    k.box(2.6, 0.3, 3.6, 12.7, 5.75, -2.2, jerPlain);
    { const len = Math.hypot(S1 - S0, RY), o = k.box(2.6, 0.3, len, 12.7, 5.75 + RY / 2, (S0 + S1) / 2, jerPlain); o.rotation.x = Math.atan2(RY, Math.abs(S1 - S0)); }
    k.box(2.6, 2.0, 0.3, 12.7, RY + 5.2, S1, jer);
    for (let i = 0; i < 5; i++) { const z = S0 - 2 - i * 5.5, y = RY * clamp01((S0 - z) / (S0 - S1)); bulbs.push({ x: 13.75, y: y + 3.4, z }); k.box(0.12, 0.3, 0.2, 13.8, y + 3.4, z, brass); }
    k.point(12.7, 4, -9, 0xffe0b4, 10, 14); k.point(12.7, 11.5, -24, 0xffe0b4, 10, 14);

    /* ---- the roof garden over the east wing, level with the drum of the dome ---- */
    const RX0 = 11.3, RX1 = 28.2, RZ0 = -31, RZ1 = -45.2;
    k.box(RX1 - RX0, 0.3, RZ0 - RZ1, (RX0 + RX1) / 2, RY - 0.15, (RZ0 + RZ1) / 2, deck);
    wallZ(k, RZ1, RZ0, RX1, RY, 0.4, jer, [], 0, false); wallX(k, RX0, RX1, RZ1, RY, 0.4, jer, [], 0, false); wallX(k, 13.95, RX1, RZ0, RY, 0.4, jer, [], 0, false);
    wallZ(k, RZ1, RZ0, RX1, 1.1, 0.4, jerDark, [], RY); wallX(k, RX0, RX1, RZ1, 1.1, 0.4, jerDark, [], RY); wallX(k, 13.95, RX1, RZ0, 1.1, 0.4, jerDark, [], RY);
    wallZ(k, RZ1, -38.6, RX0, 1.1, 0.4, jerDark, [], RY); k.block(RX0 - 0.4, RX0 + 0.3, -38.6, RZ0);
    for (const [w, d, x, z] of [[RX1 - RX0 + 0.5, 0.6, (RX0 + RX1) / 2, RZ1], [0.6, RZ0 - RZ1, RX1, (RZ0 + RZ1) / 2], [RX1 - 13.95, 0.6, (13.95 + RX1) / 2, RZ0]] as number[][]) k.box(w, 0.1, d, x, RY + 1.15, z, colM);
    /* planters along the parapets, shrubs in them, two trees in the corners */
    const shrubAt: T.Matrix4[] = [], srnd = X.mulberry(1618);
    for (const [x, z, w, d] of [[27.3, -38, 1.0, 9], [18.5, -31.9, 8, 1.0]] as number[][]) {
      k.box(w, 0.6, d, x, RY + 0.3, z, jerDark); k.box(w - 0.15, 0.05, d - 0.15, x, RY + 0.61, z, soil); k.block(x - w / 2 - 0.2, x + w / 2 + 0.2, z - d / 2 - 0.2, z + d / 2 + 0.2);
      const n = Math.round((w * d) * 1.6);
      for (let i = 0; i < n; i++) { const s = 0.6 + srnd() * 0.7; shrubAt.push(new T.Matrix4().compose(v(x + (srnd() - 0.5) * (w - 0.4), RY + 0.8 + srnd() * 0.2, z + (srnd() - 0.5) * (d - 0.4)), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), srnd() * 6), v(s, s * 1.15, s))); }
    }
    k.instances(new T.IcosahedronGeometry(0.42, 0), k.flat(0x3e6a38, 0, 0.9), shrubAt);
    for (const [x, z] of [[26.9, -31.9], [26.9, -44.3]]) { k.tree(x, RY, z, { h: 4.2, r: 1.6, seed: 1619 }); k.keepOut.push({ x, z, r: 0.9 }); }
    /* the pergola and its benches, and the stone basin of still water */
    for (const [x, z] of [[20.5, -34], [25, -34], [20.5, -38.5], [25, -38.5]]) { k.box(0.2, 2.9, 0.2, x, RY + 1.45, z, woodDark); k.keepOut.push({ x, z, r: 0.35 }); }
    for (let z = -33.6; z >= -38.9; z -= 0.6) k.box(5.0, 0.12, 0.14, 22.75, RY + 2.95, z, wood);
    for (const x of [20.9, 24.6]) k.box(0.14, 0.2, 5.0, x, RY + 2.8, -36.25, woodDark);
    for (const [z, s] of [[-34.8, 1], [-37.7, -1]]) { k.box(3.2, 0.1, 0.55, 22.75, RY + 0.46, z, wood); k.box(3.2, 0.5, 0.08, 22.75, RY + 0.75, z - s * 0.26, wood); for (const dx of [-1.4, 1.4]) k.box(0.08, 0.46, 0.5, 22.75 + dx, RY + 0.23, z, iron); }
    k.keepOut.push({ x: 22.75, z: -34.8, r: 1.1 }, { x: 22.75, z: -37.7, r: 1.1 });
    k.box(3.4, 0.4, 1.8, 16.5, RY + 0.2, -37.5, jerDark);
    { const g = new T.PlaneGeometry(3.0, 1.4); g.rotateX(-PI / 2); k.mesh(g, k.flat(0x2a4a5a, 0.05, 0.08, { envMapIntensity: 0.4 }), 16.5, RY + 0.41, -37.5); }
    k.keepOut.push({ x: 16.5, z: -37.5, r: 1.6 });
    for (const [x, z] of [[14.6, -33], [14.6, -42], [27.4, -44.4], [20, -44.4]]) { k.cyl(0.05, 0.6, x, RY + 0.3, z, bronze, 0.05, 8); bulbs.push({ x, y: RY + 0.66, z }); }
    /* three works on stone boards along the south parapet, facing the way in */
    for (const x of [15.6, 20.1, 24.6]) board(k, mounts, x, RY, -44.4, 2.2, 1.6, st, jerDark, bronze);
    k.skyline({ z: -95, count: 30, spacing: 6, seed: 1620, base: 0, lit: 0.2, x: 0 });
    k.point(20, RY + 3.5, -40, 0xfff0d8, 8, 16);

    /* ---- the Heritage Library, down a stair from the lobby, under the houses to the west ---- */
    const LD = 5.5, LX0 = -27, LX1 = -14, LZ0 = -1, LZ1 = -17, LY = -LD;
    wallX(k, LX1, -5.2, -8.05, LD + 4.9, 0.2, jerPlain, [], LY); wallX(k, LX1, -5.2, -10.55, LD + 4.9, 0.2, jerPlain, [], LY);
    k.box(9.2, 0.3, 2.8, -9.6, 4.75, -9.3, jerPlain);
    { const N = 24; for (let i = 0; i < N; i++) { const x = -5.2 - ((i + 0.5) / N) * 8.8, y = -LD * ((i + 1) / N); k.box(8.8 / N + 0.02, LD + y + 0.02, 2.3, x, LY + (LD + y) / 2, -9.3, i % 2 ? floorM : colM); } }
    k.box(0.9, 0.1, 2.3, -4.95, 0, -9.3, floorM);
    for (const x of [-7, -11.5]) bulbs.push({ x, y: x === -7 ? 3.2 : 0.2, z: -8.25 });
    k.point(-9.5, 0.5, -9.3, 0xffe0b0, 9, 12);
    k.box(LX1 - LX0, 0.1, LZ0 - LZ1, (LX0 + LX1) / 2, LY, (LZ0 + LZ1) / 2, wood);
    wallZ(k, LZ1, LZ0, LX1, LD, 0.3, jerPlain, [{ c: -9.3, w: 2.4, h: 3.9 }], LY);
    wallZ(k, LZ1, LZ0, LX0, LD, 0.3, jerPlain, [], LY);
    wallX(k, LX0, LX1, LZ0, LD, 0.3, jerPlain, [], LY); wallX(k, LX0, LX1, LZ1, LD, 0.3, jerPlain, [], LY);
    k.box(LX1 - LX0 + 0.6, 0.3, LZ0 - LZ1 + 0.6, (LX0 + LX1) / 2, -0.2, (LZ0 + LZ1) / 2, jerPlain);
    /* the coffered ceiling in oak, a lamp in each coffer */
    for (let x = LX0 + 1.6; x < LX1; x += 2.6) k.box(0.22, 0.34, LZ0 - LZ1, x, -0.5, (LZ0 + LZ1) / 2, woodDark);
    for (let z = LZ0 - 1.6; z > LZ1; z -= 2.6) k.box(LX1 - LX0, 0.34, 0.22, (LX0 + LX1) / 2, -0.5, z, woodDark);
    for (let x = LX0 + 2.9; x < LX1 - 0.5; x += 2.6) for (let z = LZ0 - 2.9; z > LZ1 + 0.5; z -= 2.6) k.plane(0.4, 0.4, x, -0.37, z, k.glow(0xfff0d0), 0, PI / 2);
    /* oak panelling round the walls with a dado and a cornice */
    for (const [w, d, x, z] of [[LX1 - LX0, 0.1, (LX0 + LX1) / 2, LZ0 - 0.2], [LX1 - LX0, 0.1, (LX0 + LX1) / 2, LZ1 + 0.2], [0.1, LZ0 - LZ1, LX1 - 0.2, (LZ0 + LZ1) / 2]] as number[][]) {
      k.box(w, 3.3, d, x, LY + 1.65, z, wood); k.box(w + (d > 0.5 ? 0.1 : 0), 0.12, d + (d > 0.5 ? 0 : 0.1), x, LY + 1.1, z, woodDark); k.box(w, 0.3, d + 0.12, x, LY + 3.45, z, woodDark);
    }
    /* the west wall is all books, spines in cloth and leather, nothing lettered */
    const books: T.Matrix4[] = [], bcol: number[] = [], brnd = X.mulberry(1621), bpal = [0x6e1420, 0x123b6b, 0x1e5b4f, 0x4a2c6b, 0x7a5a30, 0x8b5a2b, 0x2a2a2a, 0x3a2410, 0x0e1b3a, 0xb89a5a];
    const shelf = (zA: number, zB: number, x: number, face: number) => {
      k.box(0.5, 4.2, Math.abs(zB - zA), x, LY + 2.1, (zA + zB) / 2, woodDark);
      for (let s = 0; s < 6; s++) {
        const y = LY + 0.35 + s * 0.66; k.box(0.46, 0.05, Math.abs(zB - zA), x + face * 0.04, y, (zA + zB) / 2, wood);
        if (s === 5) continue;
        for (let z = Math.min(zA, zB) + 0.1; z < Math.max(zA, zB) - 0.1;) { const w = 0.05 + brnd() * 0.04, h = 0.38 + brnd() * 0.18; books.push(new T.Matrix4().compose(v(x + face * 0.1, y + 0.025 + h / 2, z + w / 2), new T.Quaternion(), v(0.3, h, w))); bcol.push(bpal[Math.floor(brnd() * bpal.length)]); z += w + 0.004; }
      }
    };
    shelf(LZ0 - 0.6, -8.4, LX0 + 0.45, 1); shelf(-10.2, LZ1 + 0.6, LX0 + 0.45, 1);
    k.block(LX0 - 0.3, LX0 + 1.0, LZ1, LZ0);
    { const bm = k.instances(new T.BoxGeometry(1, 1, 1), k.flat(0xffffff, 0, 0.75), books); const c = new T.Color(); bcol.forEach((h, i) => bm.setColorAt(i, c.set(h))); if (bm.instanceColor) bm.instanceColor.needsUpdate = true; }
    /* a small bronze reading ark in the book wall, closed, with a lamp over it, as in July */
    k.box(1.8, 3.2, 0.5, LX0 + 0.5, LY + 1.6, -9.3, woodDark); { const o = k.box(0.12, 2.4, 1.3, LX0 + 0.78, LY + 1.5, -9.3, bronze); void o; }
    for (let i = -4; i <= 4; i++) k.box(0.06, 2.4, 0.04, LX0 + 0.86, LY + 1.5, -9.3 + i * 0.14, brass);
    bulbs.push({ x: LX0 + 0.9, y: LY + 3.4, z: -9.3 });
    /* oak columns, reading tables with green lamps and open books, a rug */
    for (const [x, z] of [[-15.8, -4.4], [-25.2, -4.4], [-15.8, -14.2], [-25.2, -14.2]]) { k.column(x, LY, z, LD - 0.7, 0.3, wood); k.keepOut.push({ x, z, r: 0.6 }); }
    const green = k.flat(0x1e6b4f, 0.2, 0.4, { emissive: 0x2e8b57, emissiveIntensity: 0.5 }), parch = k.flat(0xefe4c8, 0, 0.9);
    for (const [x, z] of [[-22.4, -7.0], [-18.4, -7.0], [-22.4, -11.6], [-18.4, -11.6]]) {
      k.box(2.6, 0.1, 1.2, x, LY + 0.8, z, wood); for (const [dx, dz] of [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]]) k.box(0.1, 0.8, 0.1, x + dx, LY + 0.4, z + dz, woodDark);
      k.sphere(0.2, x, LY + 1.1, z, green, 10); k.cyl(0.02, 0.28, x, LY + 0.95, z, brass, 0.02, 6);
      for (const s of [-1, 1]) { k.box(0.5, 0.03, 0.36, x + s * 0.7, LY + 0.87, z, parch); for (const cz of [-0.95, 0.95]) { k.box(0.45, 0.45, 0.45, x + s * 0.7, LY + 0.23, z + cz, woodDark); k.box(0.45, 0.55, 0.06, x + s * 0.7, LY + 0.72, z + cz * 1.22, woodDark); } }
      k.keepOut.push({ x: x - 0.7, z, r: 1.35 }, { x: x + 0.7, z, r: 1.35 });
    }
    {
      const rug = canvasTex(256, 384, (g) => {
        g.fillStyle = '#6e1420'; g.fillRect(0, 0, 256, 384); g.fillStyle = '#14213d'; g.fillRect(0, 0, 256, 28); g.fillRect(0, 356, 256, 28); g.fillRect(0, 0, 24, 384); g.fillRect(232, 0, 24, 384);
        g.strokeStyle = '#c9a227'; g.lineWidth = 4; g.strokeRect(30, 34, 196, 316);
        for (const [r, c] of [[70, '#14213d'], [50, '#c9a227'], [28, '#6e1420'], [10, '#e9dfc0']] as [number, string][]) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, rr = i % 2 ? r * 0.72 : r; g.lineTo(128 + Math.cos(a) * rr, 192 + Math.sin(a) * rr * 1.5); } g.closePath(); g.fill(); }
      });
      const g = new T.PlaneGeometry(4.6, 9.6); g.rotateX(-PI / 2); g.rotateY(PI / 2); k.mesh(g, new T.MeshStandardMaterial({ map: rug, roughness: 0.95 }), -20.4, LY + 0.06, -9.3);
    }
    k.point(-20.4, -1.5, -5.6, 0xffe2b0, 16, 14); k.point(-20.4, -1.5, -13, 0xffe2b0, 16, 14);
    for (const [x, z] of [[-22.4, -7.0], [-18.4, -7.0], [-22.4, -11.6], [-18.4, -11.6]]) bulbs.push({ x, y: LY + 1.02, z });

    /* ---- the works: lobby walls, the library panelling, the social hall, the roof (boards above) ---- */
    for (const z of [-2.8, -6.3]) hang(mounts, -4.77, 2.5, z, PI / 2, 2.4, 1.8, st);
    for (const z of [-2.8, -9.8]) hang(mounts, 4.77, 2.5, z, -PI / 2, 2.4, 1.8, st);
    for (const x of [-3.9, 3.9]) hang(mounts, x, 2.6, -11.72, 0, 1.7, 1.3, st);
    for (const x of [-3.35, 3.35]) hang(mounts, x, 2.5, -0.63, PI, 2.0, 1.5, st);
    for (const x of [-23.4, -18.2]) { hang(mounts, x, LY + 2.4, LZ0 - 0.3, PI, 2.2, 1.6, st, 3.0); hang(mounts, x, LY + 2.4, LZ1 + 0.3, 0, 2.2, 1.6, st, 3.0); }
    for (const z of [-6.3, -9.6]) hang(mounts, 11.3, 2.3, z, -PI / 2, 2.2, 1.6, st, 2.2);
    for (const x of [6.8, 9.8]) hang(mounts, x, 2.3, -11.72, 0, 1.8, 1.35, st, 2.6);
    k.censusWall({ x: 8.3, y: 2.3, z: -0.63, rotY: PI, cols: 10, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(4300, 50), pieces: ctx.all, backing: jerDark });
    bulbsMesh(k, bulbs);

    /* ---- what the house knows ---- */
    const src = { name: 'Edmond J. Safra Synagogue (Manhattan), Wikipedia', url: 'https://en.wikipedia.org/wiki/Edmond_J._Safra_Synagogue_(Manhattan)' };
    k.egg(v(0, 11, -0.2), { id: 'safra-despont', title: 'Beaux-Arts, new', year: '2002', text: 'The synagogue was designed by the architect Thierry Despont as a work of Beaux-Arts revival, and the building was completed in December 2002, on East 63rd Street between Madison and Fifth Avenues.', clue: 'Look up at the great arched window and ask how old the style is, and how old the stone.', source: src }, { r: 2.4 });
    k.egg(v(-4.9, 5.4, -4.5), { id: 'safra-jerusalem-stone', title: 'Stone from Judea', text: 'Both the facade and the interior are built of Jerusalem stone, quarried in Judea, which gives the whole house its warm pale gold.', clue: 'Put a hand on the lobby wall.', source: src }, { r: 1.2 });
    k.egg(v(1.5, 2.4, -1.4), { id: 'safra-bronze-doors', title: 'The Tree of Life doors', text: 'The bronze front doors carry a Tree of Life motif made by the sculptor Mark Beard.', clue: 'The way in is worked in bronze. Look at the doors you walked through.', source: src }, { r: 1.2 });
    k.egg(v(0, 2.6, CZ - 0.6), { id: 'safra-beit-yaakov', title: 'Congregation Beit Yaakov', text: 'The congregation that prays here is Congregation Beit Yaakov, an Orthodox community of the Sephardi rite.', clue: 'Find the centre of the room, where the reading is done.', source: src }, { r: 1.4 });
    k.egg(v(-17, 2.5, 13.5), { id: 'safra-historic-district', title: 'A new building in an old district', year: '2003', text: 'The house stands in the Upper East Side Historic District, so its design needed the approval of the Landmarks Preservation Commission. It was officially inaugurated in October 2003.', clue: 'Cross the street and look at the whole block of old fronts it had to fit.', source: src }, { r: 1.6 });
    k.egg(v(LX0 + 1.0, LY + 3.0, -9.3), { id: 'safra-community-house', title: 'A house and a community centre', year: '1999', text: 'Edmond Safra began the project before his death in 1999. On his frequent Shabbat visits to Manhattan he had found no Sephardic house of worship on the Upper East Side, and he meant this one to be a synagogue and a community centre both.', clue: 'Go down to the books and look at the wall they fill.', source: src }, { r: 1.3 });

    const floorY = (x: number, z: number) => {
      if (x > -14.3 && x < -4.9 && z > -10.6 && z < -8.0) return -LD * clamp01((-5.2 - x) / 8.8);
      if (x <= -14.3 && x > LX0 - 0.5 && z < -0.8 && z > LZ1 - 0.5) return -LD;
      if (x > 11.3 && x < 14.1 && z < -0.7 && z >= S1) return RY * clamp01((S0 - z) / (S0 - S1));
      if (x > 11.0 && x < RX1 + 0.3 && z < S1 && z > RZ1 - 0.3) return RY;
      return 0;
    };
    return { mounts, spawn: v(0, 3, -1.9), look: v(0, 5.6, -36), eye: 3, floorY, bounds: [LX0 + 0.3, RX1 - 0.3, RZ1 + 0.3, 16.2], style: 'gilt' };
  },
};
