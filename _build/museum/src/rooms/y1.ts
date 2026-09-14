/* 122 to 126: five New York landmarks, each with its street, its skin and its life.
   Astor Hall, Jefferson Market, Eldridge Street, the City Hall rotunda, Castle Clinton.
   Landmark inspired exhibition adaptations, not measured reconstructions. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef, RoomCtx } from './types';
import { street, blockFront } from './f';
import { liberty } from './b';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const PI = Math.PI;

/* ---------- shared helpers for this file ---------- */
/* A street running along x: street() runs along z, the cross streets need this. */
function avenueX(k: Kit, p: { w: number; len: number; z: number; x?: number; walk?: number; drop?: number }) {
  const { w, len, z, x = 0, walk = 5, drop = 0 } = p;
  const asphalt = k.pbr('asphaltS', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }),
    pav = k.pbr('sidewalkS', X.pavers(0x8e8b84, 5), 0.42),
    granite = k.pbr('curbS', X.ashlar(0x8a8a86, 4, 2), 0.35),
    white = k.flat(0xdedbd2, 0, 0.7),
    yellow = k.flat(0xe6a626, 0, 0.6);
  k.box(len, 0.3, w, x, -0.15 - drop, z, asphalt);
  for (const s of [-1, 1]) {
    k.box(len, 0.28, walk, x, -drop, z + s * (w / 2 + walk / 2), pav);
    k.box(len, 0.32, 0.3, x, 0.02 - drop, z + s * (w / 2 + 0.1), granite);
  }
  for (const dz of [-0.14, 0.14]) k.box(len - 6, 0.012, 0.09, x, 0.01 - drop, z + dz, yellow);
  for (let cx = x - len / 2 + 6; cx < x + len / 2; cx += 28) for (let cz = -w / 2 + 1.2; cz <= w / 2 - 1; cz += 1.2) k.box(2.8, 0.014, 0.62, cx, 0.012 - drop, z + cz, white);
}

/* A row of brick neighbours along x. face 1: the buildings stand on the -z side of z and look toward +z. */
function rowX(k: Kit, p: { z: number; x0: number; count: number; face: 1 | -1; seed?: number; h?: [number, number]; depth?: number; w?: number }) {
  const { z, x0, count, face, seed = 1, h = [14, 24], depth = 10, w = 9 } = p;
  const rnd = X.mulberry(seed);
  const bricks = [k.pbr('nbBrickA', X.brick(0x6b4437, 21), 0.28), k.pbr('nbBrickB', X.brick(0x4f3b36, 22), 0.28), k.pbr('nbStone', X.ashlar(0xb9ad97, 23, 3), 0.22)];
  const cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6), glassDark = k.glass(0x9fc4d8, 0.35, 0.08), warm = k.glow(0xffd28a), iron = k.flat(0x1f262b, 0.75, 0.45);
  for (let b = 0; b < count; b++) {
    const x = x0 + b * w, hh = h[0] + Math.floor(rnd() * (h[1] - h[0])), m = bricks[Math.floor(rnd() * bricks.length)];
    k.box(w - 0.1, hh, depth, x, hh / 2, z - face * depth / 2, m);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], w + 0.1, x, hh - 0.5, z + face * 0.05, cornice, face > 0 ? -PI / 2 : PI / 2);
    for (let y = 3.2; y < hh - 1.5; y += 2.7) for (const dx of [-2.6, 0, 2.6]) {
      k.box(1.35, 1.9, 0.2, x + dx, y, z + face * 0.06, cornice);
      k.box(1.1, 1.65, 0.05, x + dx, y, z + face * 0.1, rnd() > 0.72 ? warm : glassDark);
      k.box(0.05, 1.7, 0.05, x + dx, y, z + face * 0.12, iron);
    }
    if (rnd() > 0.5) k.prop('fire_escape', x, 6.6 + rnd() * 3, z + face * 1.05, { height: 3.2, rotY: face > 0 ? PI : 0 });
    if (rnd() > 0.6) k.prop('water_tower', x + 1.5, hh, z - face * depth / 2, { height: 5 });
  }
}

/* A waving flag on a pole. colorAt(u, v) paints the cloth, u along the fly, v up. One draw, one tick. */
function flag(k: Kit, ctx: RoomCtx, x: number, y: number, z: number, w: number, h: number, colorAt: (u: number, vv: number) => number, rotY = 0) {
  const g = new T.PlaneGeometry(w, h, 18, 8);
  const pos = g.attributes.position as T.BufferAttribute, col: number[] = [], c = new T.Color();
  for (let i = 0; i < pos.count; i++) { const u = (pos.getX(i) + w / 2) / w, vv = (pos.getY(i) + h / 2) / h; c.set(colorAt(u, vv)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  g.translate(w / 2, 0, 0);
  const m = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: T.DoubleSide }));
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  k.add(m);
  const start = Float32Array.from(pos.array as Float32Array);
  if (!ctx.reduced) k.ticks.push((t) => {
    for (let i = 0; i < pos.count; i++) { const u = start[i * 3] / w; pos.setZ(i, Math.sin(u * 5 - t * 4.5) * 0.16 * u + Math.sin(u * 9 + t * 3.1) * 0.05 * u); }
    pos.needsUpdate = true;
    g.computeVertexNormals();
  });
  return m;
}
const US_FLAG = (u: number, vv: number) => (u < 0.4 && vv > 0.46 ? 0x1d2f5c : Math.floor((1 - vv) * 13) % 2 ? 0xf4f0e8 : 0xb8202a);
const NYC_FLAG = (u: number) => (u < 1 / 3 ? 0x1d4b9b : u < 2 / 3 ? 0xf4f0e8 : 0xf58a1f);
function flagpole(k: Kit, ctx: RoomCtx, x: number, y: number, z: number, h: number, paint: (u: number, vv: number) => number, w = 3.2, rotY = 0) {
  k.cyl(0.07, h, x, y + h / 2, z, k.flat(0xd8d8d0, 0.8, 0.35), 0.05, 8);
  k.sphere(0.16, x, y + h + 0.1, z, k.flat(0xc9a44a, 0.8, 0.3), 8);
  k.keepOut.push({ x, z, r: 0.5 });
  flag(k, ctx, x, y + h - w * 0.36, z, w, w * 0.62, paint, rotY);
}

/* A clock face with hands set to the New York hour and ticking on. */
function clockFace(k: Kit, ctx: RoomCtx, x: number, y: number, z: number, r: number, rotY: number, face: T.Material, hand: T.Material) {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  g.add(new T.Mesh(new T.CircleGeometry(r, 40), face));
  const ring = new T.Mesh(new T.TorusGeometry(r, r * 0.07, 8, 40), hand);
  ring.position.z = 0.02;
  g.add(ring);
  for (let t = 0; t < 12; t++) { const tick = new T.Mesh(new T.BoxGeometry(r * 0.05, t % 3 === 0 ? r * 0.2 : r * 0.1, 0.03), hand); const a = (t * PI) / 6; tick.position.set(Math.sin(a) * r * 0.85, Math.cos(a) * r * 0.85, 0.03); tick.rotation.z = -a; g.add(tick); }
  const hr = new T.Mesh(new T.BoxGeometry(r * 0.09, r * 0.55, 0.03), hand);
  hr.geometry.translate(0, r * 0.22, 0);
  hr.position.z = 0.05;
  const mn = new T.Mesh(new T.BoxGeometry(r * 0.06, r * 0.82, 0.03), hand);
  mn.geometry.translate(0, r * 0.36, 0);
  mn.position.z = 0.07;
  g.add(hr, mn);
  k.add(g);
  const set = (t: number) => { const h = k.o.hour + t / 3600; hr.rotation.z = -((h % 12) / 12) * PI * 2; mn.rotation.z = -((h % 1) * 60 / 60) * PI * 2; };
  set(0);
  if (!ctx.reduced) k.ticks.push((t) => set(t));
}

/* Gulls: one instanced mesh, each bird on its own stretch of a shared loop, flapping. */
function gulls(k: Kit, ctx: RoomCtx, route: T.Vector3[], n: number, seed = 7, color = 0xf2f2ee, size = 1) {
  const g = new T.BoxGeometry(1.3 * size, 0.04 * size, 0.34 * size), m = new T.MeshStandardMaterial({ color, roughness: 0.8 });
  const curve = k.spline(route, true), len = curve.getLength(), rnd = X.mulberry(seed);
  const st = Array.from({ length: n }, () => ({ s: rnd() * len, v: 3 + rnd() * 3, ph: rnd() * 6, dy: rnd() * 6 }));
  const mesh = new T.InstancedMesh(g, m, n);
  k.add(mesh);
  const M = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), tan = new T.Vector3(), sc = new T.Vector3(1, 1, 1), e = new T.Euler();
  const place = (t: number, dt: number) => {
    for (let i = 0; i < n; i++) {
      const a = st[i];
      a.s = (a.s + a.v * Math.min(dt, 0.1)) % len;
      const u = a.s / len;
      curve.getPointAt(u, p);
      curve.getTangentAt(u, tan);
      p.y += a.dy + Math.sin(t * 0.7 + a.ph) * 1.5;
      e.set(0, Math.atan2(tan.x, tan.z), Math.sin(t * 9 + a.ph) * 0.55);
      q.setFromEuler(e);
      M.compose(p, q, sc);
      mesh.setMatrixAt(i, M);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  mesh.frustumCulled = false;
  place(0, 0);
  if (!ctx.reduced) k.ticks.push(place);
}

/* Pigeons on the ground: one instanced mesh, each bird pottering round its own spot, pecking and now and then hopping. */
function pigeons(k: Kit, ctx: RoomCtx, spots: T.Vector3[], n: number, seed = 5, spread = 2.5) {
  const body = new T.SphereGeometry(0.13, 8, 6); body.scale(1, 0.85, 1.6);
  const head = new T.SphereGeometry(0.07, 6, 5); head.translate(0, 0.12, 0.18);
  const tail = new T.BoxGeometry(0.09, 0.02, 0.16); tail.translate(0, 0.03, -0.25);
  const g = mergeGeometries([body.toNonIndexed(), head.toNonIndexed(), tail.toNonIndexed()]); g.translate(0, 0.12, 0);
  const mesh = new T.InstancedMesh(g, new T.MeshStandardMaterial({ roughness: 0.8 }), n);
  const rnd = X.mulberry(seed), c = new T.Color(), greys = [0x6a6e78, 0x7c808a, 0x5a5e66, 0x8a8e96, 0x4a4640, 0xb8b4ac];
  const st = Array.from({ length: n }, (_, i) => { const h = spots[i % spots.length]; return { x: h.x + (rnd() - 0.5) * spread, y: h.y, z: h.z + (rnd() - 0.5) * spread, ph: rnd() * 6.28, sp: (0.15 + rnd() * 0.25) * (rnd() > 0.5 ? 1 : -1), r: 0.25 + rnd() * 0.7 }; });
  for (let i = 0; i < n; i++) mesh.setColorAt(i, c.set(greys[Math.floor(rnd() * greys.length)]));
  mesh.frustumCulled = false;
  k.add(mesh);
  const M = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ'), p = new T.Vector3(), one = new T.Vector3(1, 1, 1);
  const place = (t: number) => {
    for (let i = 0; i < n; i++) {
      const a = st[i], w = a.ph + t * a.sp;
      const hop = Math.pow(Math.max(0, Math.sin(t * 0.9 + a.ph * 3)), 40) * 0.22;
      p.set(a.x + Math.cos(w) * a.r, a.y + hop, a.z + Math.sin(w) * a.r);
      const peck = Math.pow(Math.max(0, Math.sin(t * 4.2 + a.ph)), 6) * 0.7;
      e.set(peck, a.sp > 0 ? -w : PI - w, 0);
      q.setFromEuler(e);
      M.compose(p, q, one);
      mesh.setMatrixAt(i, M);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (!ctx.reduced) k.ticks.push((t) => place(t));
  return mesh;
}

/* Traffic: cars, cabs and the odd bus in one instanced mesh, each lane one way at one speed so nobody overtakes. */
function traffic(k: Kit, ctx: RoomCtx, lanes: { a: T.Vector3; b: T.Vector3; n: number }[], speed = 8, seed = 3) {
  const body = new T.BoxGeometry(1.9, 0.75, 4.6); body.translate(0, 0.62, 0);
  const cab = new T.BoxGeometry(1.7, 0.62, 2.4); cab.translate(0, 1.3, -0.25);
  const g = mergeGeometries([body, cab]);
  const total = lanes.reduce((s, l) => s + l.n, 0);
  const mesh = new T.InstancedMesh(g, new T.MeshStandardMaterial({ roughness: 0.45, metalness: 0.35 }), total);
  const cols = [0xf2c21a, 0xf2c21a, 0xf2c21a, 0x1a1c20, 0xe8e8e4, 0x6a7078, 0x8a1c1c, 0x2a3a5a];
  const rnd = X.mulberry(seed), c = new T.Color();
  const cars: { li: number; len: number; s: number; v: number; sc: T.Vector3 }[] = [];
  lanes.forEach((l, li) => { const len = l.a.distanceTo(l.b), lv = speed * (0.85 + rnd() * 0.3); for (let j = 0; j < l.n; j++) { const bus = rnd() < 0.12; cars.push({ li, len, s: ((j + rnd() * 0.4) * len) / l.n, v: lv, sc: bus ? new T.Vector3(1.3, 1.9, 2.5) : new T.Vector3(1, 1, 1) }); mesh.setColorAt(cars.length - 1, c.set(bus ? 0x2a5aa8 : cols[Math.floor(rnd() * cols.length)])); } });
  mesh.frustumCulled = false;
  k.add(mesh);
  const M = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), d = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  const place = (_t: number, dt: number) => {
    cars.forEach((car, i) => {
      const l = lanes[car.li];
      car.s = (car.s + car.v * Math.min(dt, 0.1)) % car.len;
      d.subVectors(l.b, l.a);
      p.copy(l.a).addScaledVector(d, car.s / car.len);
      q.setFromAxisAngle(up, Math.atan2(d.x, d.z));
      M.compose(p, q, car.sc);
      mesh.setMatrixAt(i, M);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  place(0, 0);
  if (!ctx.reduced) k.ticks.push(place);
  return mesh;
}

/* A standing robed figure from static parts, so it merges into the room's draws. Hands are given in the
   figure's own frame (x to its left, z forward, in units of its height / 3.2). Returns the frame mapper. */
function figure(k: Kit, x: number, y: number, z: number, h: number, m: T.Material, rotY = 0, hands: [number, number, number][] = [[0.5, 1.6, 0.2], [-0.5, 1.6, 0.2]]) {
  const s = h / 3.2, c = Math.cos(rotY), sn = Math.sin(rotY);
  const at = (lx: number, ly: number, lz: number) => v(x + (lx * c + lz * sn) * s, y + ly * s, z + (-lx * sn + lz * c) * s);
  k.lathe([[0.62, 0], [0.64, 0.12], [0.52, 0.8], [0.44, 1.5], [0.38, 2.0], [0.46, 2.3], [0.42, 2.52], [0.14, 2.66], [0, 2.68]].map(([r, yy]) => [r * s, yy * s]), x, y, z, m, 14);
  const hd = at(0, 2.9, 0.02);
  k.sphere(0.21 * s, hd.x, hd.y, hd.z, m, 10);
  const nk = at(0, 2.66, 0);
  k.cyl(0.1 * s, 0.2 * s, nk.x, nk.y + 0.06 * s, nk.z, m, 0.1 * s, 8);
  hands.forEach(([hx, hy, hz], i) => { const sh = at(i ? -0.4 : 0.4, 2.45, 0); const el = at(hx * 0.8 + (i ? -0.1 : 0.1), (hy + 2.45) / 2 - 0.1, hz * 0.5); k.beam(sh, el, 0.09 * s, m, 6); k.beam(el, at(hx, hy, hz), 0.08 * s, m, 6); });
  return { at, s };
}

/* A small painted canvas material for murals and portraits. draw() paints it once. */
function canvasMat(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, glow = 0) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  const m = new T.MeshStandardMaterial({ map: t, roughness: 0.85 });
  if (glow) { m.emissive = new T.Color(0xffffff); m.emissiveMap = t; m.emissiveIntensity = glow; }
  return m;
}
/* A plane showing one cell of a canvas strip of `cells` pictures side by side. Static, so it merges. */
function stripPanel(k: Kit, m: T.Material, cell: number, cells: number, w: number, h: number, x: number, y: number, z: number, rotY: number) {
  const g = new T.PlaneGeometry(w, h), uv = g.attributes.uv as T.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, (cell + uv.getX(i)) / cells);
  const o = k.mesh(g, m, x, y, z);
  o.rotation.y = rotY;
  return o;
}

/* A bell hung from a pivot: returns the group so a tick can swing it. */
function hungBell(k: Kit, x: number, y: number, z: number, r: number, m: T.Material) {
  const g = new T.Group();
  g.position.set(x, y, z);
  const prof = [[0.05, 0], [0.3, -0.05], [0.42, -0.35], [0.5, -0.8], [0.72, -1.15], [0.78, -1.25], [0.7, -1.25]].map(([a, b]) => new T.Vector2(a * r, b * r));
  const bell = new T.Mesh(mergeGeometries([new T.LatheGeometry(prof, 16).toNonIndexed(), new T.BoxGeometry(0.12 * r, 0.3 * r, 0.9 * r).translate(0, 0.08 * r, 0).toNonIndexed()]), m);
  g.add(bell);
  k.add(g);
  return g;
}

/* A park bench from static boxes (merged into the room's slat and iron draws). */
function parkBench(k: Kit, x: number, z: number, rotY: number, slats: T.Material, iron: T.Material, len = 2.2) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const at = (lx: number, lz: number) => [x + lx * c + lz * s, z - lx * s + lz * c];
  const put = (w: number, h: number, d: number, lx: number, y: number, lz: number, m: T.Material) => { const [px, pz] = at(lx, lz); const o = k.box(w, h, d, px, y, pz, m); o.rotation.y = rotY; };
  for (let j = 0; j < 4; j++) put(0.12, 0.05, len, j * 0.15 - 0.22, 0.62, 0, slats);
  for (let j = 0; j < 3; j++) put(0.05, 0.13, len, 0.42 + j * 0.02, 0.85 + j * 0.15, 0, slats);
  for (const dz of [-len / 2 + 0.2, len / 2 - 0.2]) { put(0.72, 0.06, 0.07, 0.05, 0.6, dz, iron); put(0.06, 0.6, 0.07, -0.28, 0.3, dz, iron); put(0.06, 0.6, 0.07, 0.38, 0.3, dz, iron); put(0.06, 0.65, 0.07, 0.46, 0.95, dz, iron); }
  k.keepOut.push({ x, z, r: 0.9 });
}

/* A lying marble lion on a plinth, facing +z. */
function lion(k: Kit, x: number, z: number, stone: T.Material, plinth: T.Material) {
  k.box(3.2, 1.5, 6.2, x, 0.75, z, plinth);
  k.box(3.5, 0.16, 6.5, x, 1.58, z, plinth);
  const B = 1.66;
  const body = k.sphere(1.0, x, B + 0.95, z - 0.5, stone, 16); body.scale.set(1.05, 0.8, 1.9);
  const chest = k.sphere(0.9, x, B + 1.15, z + 1.2, stone, 16); chest.scale.set(1.05, 1.0, 1.0);
  const mane = k.sphere(0.8, x, B + 1.9, z + 1.55, stone, 16); mane.scale.set(1.0, 1.1, 0.9);
  k.sphere(0.55, x, B + 2.05, z + 2.05, stone, 14);
  k.box(0.5, 0.36, 0.5, x, B + 1.85, z + 2.5, stone);
  for (const s of [-1, 1]) {
    k.box(0.46, 0.5, 2.0, x + s * 0.5, B + 0.35, z + 2.1, stone);
    k.box(0.5, 0.3, 0.7, x + s * 0.5, B + 0.15, z + 3.2, stone);
    const h = k.sphere(0.72, x + s * 0.7, B + 0.75, z - 1.7, stone, 14); h.scale.set(1, 0.95, 1.1);
    k.box(0.4, 0.3, 1.0, x + s * 0.9, B + 0.15, z - 2.0, stone);
    const ear = k.sphere(0.14, x + s * 0.4, B + 2.5, z + 1.9, stone, 8); void ear;
  }
  k.curve([v(x + 0.6, B + 0.9, z - 2.3), v(x + 1.2, B + 0.5, z - 2.6), v(x + 1.6, B + 0.2, z - 1.9)], 0.09, stone, 10);
  k.block(x - 1.9, x + 1.9, z - 3.4, z + 3.4);
}

/* ---------------- 122 ASTOR HALL, THE NEW YORK PUBLIC LIBRARY ---------------- */
export const astor: RoomDef = {
  id: 'astorhall',
  name: 'Between the lions',
  area: 'NYPL / ASTOR HALL',
  mood: 'Fifth Avenue, mid afternoon',
  color: '#e4ddcf',
  description: 'Fifth Avenue, Patience and Fortitude on their plinths, the readers on the steps, the three arched portals, then Astor Hall: white Vermont marble under a vault, twin stair flights to the landings, bronze candelabra, the rotunda beyond.',
  signatures: 'The Beaux Arts marble front with paired Corinthian columns between three round portals, the two marble lions flanking the broad steps, the vaulted white marble entrance hall with its lateral stair flights and bronze torcheres.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.0018, sun: { az: 2.6, el: 0.6, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.9);
    k.sun(0xfff2dc, 2.4, 70, 60, 50, true, 110);
    const ashlar = k.pbr('astorAshlar', X.ashlar(0xe2ddd2, 442, 3), 0.25, { roughness: 0.55 }),
      wall = k.pbr('astorWall', X.marble(0xece8e0, 0xc4beb4, 443), 0.7, { roughness: 0.45 }),
      vaultM = k.pbr('astorVault', X.marble(0xf0ece4, 0xcfc9bf, 443), 0.7, { roughness: 0.6, side: T.BackSide }),
      floorG = k.pbr('astorFloor', X.marble(0xb4b0a8, 0x6e6a62, 444), 0.55, { roughness: 0.3 }),
      pink = k.pbr('lionMarble', X.marble(0xd9c8ba, 0xb39a8c, 445), 0.4, { roughness: 0.5 }),
      plinth = k.pbr('lionPlinth', X.ashlar(0xc9bfb0, 446, 2), 0.3),
      bronze = k.flat(0x5a4a2e, 0.8, 0.4),
      glass = k.glass(0xdcecf6, 0.16, 0.05),
      warm = k.glow(0xffe4b8),
      winGlow = k.flat(0xd8ccb0, 0.2, 0.4, { emissive: 0xffc070, emissiveIntensity: 0.28 }),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      iron = k.flat(0x1f262b, 0.75, 0.45),
      slat = k.pbr('benchW', X.planks(0x5d4939, 3, 32), 1.2),
      lawn = k.pbr('bryantLawn', X.grass(0x4a7a3a, 447), 0.08);
    const FZ = 0, TY = 3.4;
    // Fifth Avenue, the plaza, the neighbours and the skyline behind Bryant Park
    avenueX(k, { w: 22, len: 150, z: FZ + 36, x: 0, walk: 6, drop: 0.02 });
    k.box(116, 0.3, 16, 0, -0.15, FZ + 11, k.pbr('sidewalkS', X.pavers(0x8e8b84, 5), 0.42));
    k.skyline({ z: FZ + 72, count: 16, spacing: 7, scale: 1.9, base: -1, seed: 446, lit: 0.2, glow: 0.4, tint: 0x6e7684, rows: 1 });
    k.skyline({ z: FZ - 95, count: 18, spacing: 8, scale: 2.6, base: -1, seed: 449, lit: 0.22, glow: 0.4, tint: 0x5e6674, rows: 2 });
    k.box(140, 0.3, 40, 0, -0.16, FZ - 50, lawn);
    blockFront(k, { x: -58, z0: FZ + 22, count: 5, face: 1, seed: 447, h: [18, 30] });
    blockFront(k, { x: 58, z0: FZ + 22, count: 5, face: -1, seed: 448, h: [18, 30] });
    for (const s of [-1, 1]) { k.box(6, 0.3, 60, s * 54, -0.15, FZ - 8, k.pbr('asphaltS', X.asphalt(0x24282d), 0.11)); }
    for (const x of [-30, -42, 30, 42]) k.tree(x, 0, FZ + 21.5, { kind: 'round', h: 6, r: 2.8, seed: 40 + x, leaf: 0x3f6b36 });
    for (const x of [-18, 18, -48, 48]) k.lamp(x, FZ + 21.5, 6.2, iron, 0xffe0b0, 26);
    for (const x of [-24, 24]) parkBench(k, x, FZ + 9, PI, slat, iron, 2.6);
    k.prop('hydrant', 20, 0, FZ + 24, { height: 1.1, keepOut: 0.5 });
    // the steps and the terrace, the cheek walls, the lions
    for (let i = 0; i < 12; i++) k.box(16, (i + 1) * 0.2833, 1.0, 0, ((i + 1) * 0.2833) / 2, FZ + 14.5 - i, ashlar);
    k.box(46, TY, 4.2, 0, TY / 2, FZ + 1, ashlar);
    for (const s of [-1, 1]) { k.box(1.2, 3.8, 12.8, s * 8.6, 1.9, FZ + 9.2, ashlar); k.box(1.4, 0.2, 13, s * 8.6, 3.9, FZ + 9.2, ashlar); k.block(s * 8 - (s < 0 ? 1.2 : 0), s * 8 + (s > 0 ? 1.2 : 0), FZ + 2.8, FZ + 15.6); }
    lion(k, -11, FZ + 13, pink, plinth);
    lion(k, 11, FZ + 13, pink, plinth);
    k.sign('PATIENCE', 2.4, 0.42, -11, 1.0, FZ + 16.13, '#3a3430', '#e8dcc0', 70, 0);
    k.sign('FORTITUDE', 2.4, 0.42, 11, 1.0, FZ + 16.13, '#3a3430', '#e8dcc0', 70, 0);
    // the facade: the central pavilion with three portals and paired columns, the wings with pilasters
    for (const x of [-8.4, 0, 8.4]) k.arch(4.4, 9, 1.2, x, TY, FZ, ashlar, false, 0.955);
    for (const s of [-1, 1]) k.box(7.4, 10.2, 1.2, s * 16.3, TY + 5.1, FZ, ashlar);
    k.box(40, 12, 1.2, 0, TY + 16.2, FZ, ashlar);
    k.box(40, 1.6, 2.6, 0, TY + 10.9, FZ + 1.4, ashlar);
    k.box(40, 3.0, 3.0, 0, TY + 23.6, FZ - 0.4, ashlar);
    k.moulding([[0, 0], [1.1, 0], [1.2, 0.3], [0.8, 0.55], [1.0, 0.85], [0.4, 1.05], [0, 1.15]], 40.4, 0, TY + 22.2, FZ + 0.6, ashlar, -PI / 2);
    for (let i = 0; i < 7; i++) k.lathe([[0.32, 0], [0.4, 0.08], [0.22, 0.2], [0.34, 0.7], [0.5, 1.0], [0.2, 1.15], [0, 1.2]], -18 + i * 6, TY + 25.1, FZ - 0.4, ashlar, 12);
    for (const x of [-13.4, -11.8, -5.0, -3.5, 3.5, 5.0, 11.8, 13.4]) { k.column(x, TY, FZ + 1.6, 9.4, 0.5, ashlar, true); k.keepOut.push({ x, z: FZ + 1.6, r: 0.85 }); }
    for (const x of [-13.4, -11.8, -5.0, -3.5, 3.5, 5.0, 11.8, 13.4]) k.prop('corinthian_capital', x, TY + 9.4, FZ + 1.6, { height: 1.0 });
    k.sign('THE NEW YORK PUBLIC LIBRARY', 18, 1.0, 0, TY + 10.9, FZ + 2.72, 'transparent', '#5a544a', 92, 0);
    for (const s of [-1, 1]) {
      k.box(30, 24, 26, s * 35, 12, FZ - 12, ashlar);
      k.box(30.2, TY + 0.2, 0.3, s * 35, (TY + 0.2) / 2, FZ + 1.15, plinth);
      k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0.3, 1.0], [0, 1.1]], 30.2, s * 35, 23.2, FZ + 1.05, ashlar, -PI / 2);
      for (let i = 0; i < 5; i++) k.box(1.4, 16, 0.5, s * (21.5 + i * 6), TY + 8, FZ + 1.25, ashlar);
      for (let i = 0; i < 4; i++) {
        const x = s * (24.5 + i * 6);
        if (i !== 2) { k.box(4.8, 5.4, 0.2, x, TY + 4.5, FZ + 1.1, ashlar); k.box(4.2, 4.8, 0.14, x, TY + 4.5, FZ + 1.14, i === 0 ? winGlow : glass); k.box(0.14, 4.8, 0.2, x, TY + 4.5, FZ + 1.16, ashlar); for (const dy of [-1.2, 0.6]) k.box(4.2, 0.12, 0.2, x, TY + 4.5 + dy, FZ + 1.16, ashlar); }
        k.box(4.8, 4.4, 0.2, x, TY + 12.5, FZ + 1.1, ashlar); k.box(4.2, 3.8, 0.14, x, TY + 12.5, FZ + 1.14, i % 2 ? glass : winGlow); k.box(0.14, 3.8, 0.2, x, TY + 12.5, FZ + 1.16, ashlar); k.box(4.2, 0.12, 0.2, x, TY + 12.9, FZ + 1.16, ashlar);
      }
      k.block(s * 20, s * 50, FZ - 25, FZ + 1.3);
    }
    flagpole(k, ctx, -20, TY, FZ + 1.6, 12, US_FLAG, 3.4);
    flagpole(k, ctx, 20, TY, FZ + 1.6, 12, US_FLAG, 3.4);
    k.point(0, TY + 6, FZ + 2, 0xfff0d8, 30, 16);
    // the hall: floor, end walls, back wall with the arch to the rotunda, the vault and its ribs
    k.box(34, 0.3, 17.2, 0, TY - 0.15, FZ - 8, floorG);
    for (const s of [-1, 1]) { k.box(4, 22.2, 17.2, s * 18, TY + 11.1, FZ - 8, ashlar); k.block(s * 16, s * 20, FZ - 16.6, FZ + 0.6); }
    k.arch(7, 9.5, 1.2, 0, TY, FZ - 16, wall, false, 0.5);
    for (const s of [-1, 1]) k.box(12.5, 10.75, 1.2, s * 9.75, TY + 5.375, FZ - 16, wall);
    k.box(40, 12, 1.2, 0, TY + 16.75, FZ - 16, wall);
    k.box(40, 0.6, 17.2, 0, TY + 22.5, FZ - 8, ashlar);
    const vault = k.mesh(new T.CylinderGeometry(8, 8, 33, 40, 1, true, 0, PI), vaultM, 0, TY + 10, FZ - 8);
    vault.rotation.z = PI / 2;
    for (const x of [-12.6, -4.2, 4.2, 12.6]) k.curve(Array.from({ length: 25 }, (_, j) => { const t = (j / 24) * PI; return v(x, TY + 10 + Math.sin(t) * 7.85, FZ - 8 - Math.cos(t) * 7.85); }), 0.22, wall, 24);
    for (const z of [FZ - 2, FZ - 14]) k.curve(Array.from({ length: 2 }, (_, j) => v(-16 + j * 32, TY + 10 + Math.sqrt(Math.max(0, 64 - Math.pow(z - (FZ - 8), 2))), z)), 0.14, wall, 2);
    k.moulding([[0, 0], [0.5, 0], [0.55, 0.15], [0.3, 0.3], [0.4, 0.5], [0, 0.6]], 32, 0, TY + 9.4, FZ - 0.6, wall, PI / 2);
    k.moulding([[0, 0], [0.5, 0], [0.55, 0.15], [0.3, 0.3], [0.4, 0.5], [0, 0.6]], 32, 0, TY + 9.4, FZ - 15.4, wall, -PI / 2);
    // blocks for the front wall piers and the back wall
    for (const [a, b] of [[-20, -10.6], [-6.2, -2.2], [2.2, 6.2], [10.6, 20]]) k.block(a, b, FZ - 0.6, FZ + 0.6);
    k.block(-16, -3.5, FZ - 16.6, FZ - 15.4);
    k.block(3.5, 16, FZ - 16.6, FZ - 15.4);
    // the twin flights and their landings, with bronze rails
    for (const s of [-1, 1]) {
      const x = s * 13.6;
      for (let i = 0; i < 15; i++) k.box(3.6, (i + 1) * 0.3, 0.567, x, TY + ((i + 1) * 0.3) / 2, FZ - 3 - (i + 0.5) * 0.567, floorG);
      k.box(3.6, 4.5, 3.9, x, TY + 2.25, FZ - 13.45, floorG);
      const xr = s * 11.9;
      k.beam(v(xr, TY + 1.0, FZ - 3), v(xr, TY + 5.5, FZ - 11.5), 0.05, bronze, 6);
      k.beam(v(xr, TY + 5.5, FZ - 11.5), v(xr, TY + 5.5, FZ - 15.4), 0.05, bronze, 6);
      for (let j = 0; j <= 14; j++) { const z = FZ - 3 - j * 0.6; const y0 = TY + 4.5 * ((FZ - 3 - z) / 8.5); k.beam(v(xr, y0, z), v(xr, y0 + 1.0, z), 0.022, bronze, 5); }
      for (let j = 0; j < 6; j++) { const z = FZ - 11.8 - j * 0.6; k.beam(v(xr, TY + 4.5, z), v(xr, TY + 5.5, z), 0.022, bronze, 5); }
      k.lathe([[0.16, 0], [0.16, 0.2], [0.1, 0.3], [0.1, 1.1], [0.2, 1.2], [0.2, 1.35]], xr, TY, FZ - 2.8, bronze, 12);
      k.block(s * 11.5 - (s < 0 ? 0.6 : 0), s * 11.5 + (s > 0 ? 0.6 : 0), FZ - 15.4, FZ - 3.2);
      k.prop('torchere', s * 10.6, TY, FZ - 2.4, { height: 3.0, keepOut: 0.7 });
      k.point(s * 10.6, TY + 3.2, FZ - 2.4, 0xffd9a0, 18, 9);
      k.point(s * 11, TY + 8, FZ - 8, 0xfff0dc, 22, 16);
    }
    k.point(0, TY + 9, FZ - 8, 0xfff2e0, 40, 26);
    k.sign('"HALL"', 3.2, 0.7, 0, TY + 11.6, FZ - 15.34, 'transparent', '#2a2a2a', 120, 0);
    // the rotunda room beyond: a vaulted marble room with the census as its mural
    k.box(20.4, 0.3, 16.6, 0, TY - 0.15, FZ - 24.3, floorG);
    for (const s of [-1, 1]) { k.box(1.2, 17.2, 16.6, s * 9.6, TY + 8.6, FZ - 24.3, wall); k.block(s * 9, s * 10.2, FZ - 32.6, FZ - 16.6); }
    k.box(20.4, 17.2, 1.2, 0, TY + 8.6, FZ - 32.6, wall);
    k.block(-10.2, 10.2, FZ - 33.2, FZ - 32);
    k.box(20.4, 0.6, 16.6, 0, TY + 17.4, FZ - 24.3, ashlar);
    const rv = k.mesh(new T.CylinderGeometry(9, 9, 16, 32, 1, true, 0, PI), vaultM, 0, TY + 8, FZ - 24.3);
    rv.rotation.set(0, 0, PI / 2);
    rv.rotateX(PI / 2);
    for (const z of [FZ - 20.5, FZ - 28]) k.curve(Array.from({ length: 25 }, (_, j) => { const t = (j / 24) * PI; return v(Math.cos(t) * 8.85, TY + 8 + Math.sin(t) * 8.85, z); }), 0.2, wall, 24);
    k.point(0, TY + 7, FZ - 24.3, 0xfff0dc, 40, 24);
    k.censusWall({ x: 0, y: TY + 6.2, z: FZ - 31.92, rotY: 0, cols: 20, rows: 6, tile: 0.7, gap: 0.06, start: ctx.wallStart(1200, 120), pieces: ctx.all, backing: dark });
    k.sign('THE McGRAW ROTUNDA', 7, 0.7, 0, TY + 11.4, FZ - 31.9, 'transparent', '#5a544a', 90, 0);
    for (const x of [-6, 6]) k.prop('museum_bench', x, TY, FZ - 24.3, { height: 0.58, rotY: PI / 2, keepOut: 1.5 });
    // life: the readers on the steps, the avenue, the hall
    k.crowd([v(-7, 0, FZ + 17), v(-5.5, 1.7, FZ + 9), v(-3, TY, FZ + 2.4), v(3, TY, FZ + 2.4), v(5.5, 1.7, FZ + 9), v(7, 0, FZ + 17)], 16, { seed: 61, speed: 0.3, spread: 2.4, animate: !ctx.reduced });
    k.crowd([v(-70, 0, FZ + 22), v(70, 0, FZ + 22)], 26, { seed: 62, speed: 1.0, spread: 3, animate: !ctx.reduced });
    k.crowd([v(-9, TY, FZ - 9), v(0, TY, FZ - 22), v(9, TY, FZ - 9)], 10, { seed: 63, speed: 0.45, spread: 2.5, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517] });
    // the Fifth Avenue front in detail: Bartlett's six attic figures and their three plaques
    const carrara = k.pbr('astorCarrara', X.marble(0xf2efe8, 0xd0cbc0, 448), 0.6, { roughness: 0.5 }),
      niche = k.flat(0xbdb6aa, 0, 0.85),
      pool = k.flat(0x6a9aa8, 0.3, 0.1, { transparent: true, opacity: 0.82 });
    for (const x of [-8.4, 0, 8.4]) { k.box(3.6, 2.8, 0.3, x, TY + 14.6, FZ + 0.72, ashlar); k.box(3.0, 2.2, 0.14, x, TY + 14.6, FZ + 0.9, carrara); for (const dy of [-0.4, 0, 0.4]) k.box(2.2, 0.12, 0.08, x, TY + 14.6 + dy, FZ + 0.99, ashlar); }
    const poses: [number, number, number][][] = [[[0.5, 1.7, 0.4], [-0.3, 2.1, 0.5]], [[0.2, 2.6, 0.4], [-0.5, 1.5, 0.2]], [[0.35, 1.9, 0.55], [-0.35, 1.9, 0.55]], [[0.35, 1.9, 0.55], [-0.35, 1.9, 0.55]], [[0.5, 1.5, 0.2], [-0.2, 2.6, 0.4]], [[0.3, 2.1, 0.5], [-0.5, 1.7, 0.4]]];
    [-10.7, -6.1, -2.3, 2.3, 6.1, 10.7].forEach((x, i) => figure(k, x, TY + 11.7, FZ + 1.75, 3.4, carrara, 0, poses[i]));
    // MacMonnies's fountains in their alcoves either side of the portico: Beauty on Pegasus to the south, Truth on a Sphinx to the north
    const jetSpots: T.Vector3[] = [];
    for (const s of [-1, 1]) {
      const x = s * 16.3, d = -s, zc = FZ + 1.15;
      k.arch(3.2, 5.0, 0.4, x, TY, FZ + 0.8, ashlar, false, 0.75);
      k.box(3.2, 5.0, 0.05, x, TY + 2.5, FZ + 0.63, niche);
      k.mesh(new T.CylinderGeometry(1.5, 1.6, 0.9, 20, 1, false, -PI / 2, PI), carrara, x, TY + 0.45, FZ + 0.62);
      k.mesh(new T.CylinderGeometry(1.36, 1.36, 0.06, 20, 1, false, -PI / 2, PI), pool, x, TY + 0.86, FZ + 0.62);
      k.box(2.2, 1.3, 1.0, x, TY + 1.5, FZ + 0.95, carrara);
      k.moulding([[0, 0], [0.18, 0], [0.24, 0.1], [0.12, 0.2], [0, 0.24]], 2.3, x, TY + 2.15, FZ + 1.45, carrara, PI / 2);
      if (s < 0) {
        const b = k.sphere(0.55, x, TY + 2.75, zc, carrara, 14); b.scale.set(1.9, 0.8, 0.9);
        k.beam(v(x + d * 0.8, TY + 2.9, zc), v(x + d * 1.15, TY + 3.55, zc), 0.22, carrara, 8);
        const hd = k.sphere(0.24, x + d * 1.35, TY + 3.62, zc, carrara, 10); hd.scale.set(1.6, 0.9, 0.9);
        for (const w of [-1, 1]) { const wing = k.box(1.5, 0.06, 0.55, x - d * 0.25, TY + 3.45, zc + w * 0.32, carrara); wing.rotation.set(w * 0.35, 0, d * 0.75); }
      } else {
        k.box(1.9, 0.62, 0.9, x, TY + 2.45, zc, carrara);
        k.box(0.9, 0.22, 0.8, x + d * 1.2, TY + 2.25, zc, carrara);
        k.box(0.5, 0.62, 0.5, x + d * 0.8, TY + 3.05, zc, carrara);
        const nemes = k.box(0.72, 0.5, 0.2, x + d * 0.72, TY + 2.95, zc, carrara); nemes.rotation.y = PI / 2;
      }
      k.lathe([[0.34, 0], [0.38, 0.22], [0.29, 0.72], [0.18, 0.86], [0, 0.88]], x - d * 0.1, TY + 3.0, zc, carrara, 12);
      k.sphere(0.17, x - d * 0.1, TY + 4.05, zc, carrara, 10);
      k.beam(v(x - d * 0.1, TY + 3.7, zc + 0.15), v(x + d * 0.45, TY + (s < 0 ? 4.3 : 3.4), zc + 0.35), 0.07, carrara, 6);
      k.beam(v(x - d * 0.1, TY + 3.1, zc + 0.2), v(x + d * 0.35, TY + 2.6, zc + 0.45), 0.1, carrara, 6);
      if (s > 0) k.mesh(new T.ConeGeometry(0.12, 0.3, 8), carrara, x - d * 0.1, TY + 3.82, zc + 0.12).rotation.x = PI;
      k.keepOut.push({ x, z: FZ + 1.3, r: 1.8 });
      for (const dx of [-0.6, 0, 0.6]) jetSpots.push(v(x + dx, TY + 0.9, FZ + 1.5));
    }
    const jets = new T.InstancedMesh(new T.CylinderGeometry(0.03, 0.06, 1, 6), k.glow(0xdff4ff, 0.75), jetSpots.length);
    k.add(jets);
    const placeJets = (t: number) => { const M = new T.Matrix4(); jetSpots.forEach((p, i) => { const h = 0.55 + 0.12 * Math.sin(t * 2.6 + i * 1.7); M.makeScale(1, h, 1).setPosition(p.x, p.y + h / 2, p.z); jets.setMatrixAt(i, M); }); jets.instanceMatrix.needsUpdate = true; };
    placeJets(0);
    if (!ctx.reduced) k.ticks.push((t) => placeJets(t));
    // the architects in their niches at the foot of the stairs
    for (const s of [-1, 1]) {
      const bn = k.arch(1.3, 2.5, 0.3, s * 15.92, TY + 0.1, FZ - 1.3, wall, false, 0.72); bn.rotation.y = PI / 2;
      k.box(0.62, 1.1, 0.62, s * 15.45, TY + 0.55, FZ - 1.3, wall);
      k.lathe([[0.34, 0], [0.36, 0.1], [0.3, 0.34], [0.13, 0.5], [0.1, 0.6], [0, 0.62]], s * 15.45, TY + 1.1, FZ - 1.3, bronze, 12);
      k.sphere(0.19, s * 15.45, TY + 1.9, FZ - 1.3, bronze, 10);
      k.keepOut.push({ x: s * 15.4, z: FZ - 1.3, r: 0.55 });
    }
    // McGraw Rotunda: Edward Laning's four arched panels above the frames
    const mural = canvasMat(1024, 256, (g, w, h) => {
      const cw = w / 4;
      for (let c = 0; c < 4; c++) {
        const x0 = c * cw, sky = g.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, ['#8aa6c8', '#6a5a4a', '#a8b4c0', '#7a8aa0'][c]); sky.addColorStop(1, ['#e8cfa0', '#c87a3a', '#d8c8a0', '#c8b890'][c]);
        g.fillStyle = sky; g.fillRect(x0, 0, cw, h);
        g.fillStyle = ['#7a5a3a', '#3a2a22', '#5a4a3a', '#4a4a4a'][c];
        g.beginPath(); g.moveTo(x0, h); g.lineTo(x0 + cw * 0.35, h * 0.35); g.lineTo(x0 + cw * 0.7, h); g.fill();
        g.fillRect(x0, h * 0.82, cw, h * 0.18);
        const fig = (fx: number, col: string, hh = 0.5) => { g.fillStyle = col; g.beginPath(); g.moveTo(x0 + fx - 16, h * 0.9); g.lineTo(x0 + fx - 8, h * (0.9 - hh)); g.lineTo(x0 + fx + 8, h * (0.9 - hh)); g.lineTo(x0 + fx + 16, h * 0.9); g.fill(); g.fillStyle = '#d8b090'; g.beginPath(); g.arc(x0 + fx, h * (0.9 - hh) - 10, 10, 0, PI * 2); g.fill(); };
        if (c === 0) { fig(140, '#a83a2a', 0.55); g.fillStyle = '#9a9a96'; g.fillRect(x0 + 160, h * 0.42, 22, 34); g.fillRect(x0 + 184, h * 0.42, 22, 34); }
        if (c === 1) { g.fillStyle = '#e8702a'; for (let i = 0; i < 6; i++) g.fillRect(x0 + 150 + i * 16, h * (0.3 + (i % 3) * 0.08), 12, h * 0.5); fig(90, '#5a3a22', 0.45); g.fillStyle = '#6a4a2a'; g.fillRect(x0 + 108, h * 0.62, 50, 8); g.fillStyle = '#f4ecd8'; g.fillRect(x0 + 112, h * 0.58, 34, 5); }
        if (c === 2) { g.fillStyle = '#2a2420'; g.fillRect(x0 + 40, h * 0.3, 14, h * 0.6); g.fillRect(x0 + 100, h * 0.3, 14, h * 0.6); g.fillRect(x0 + 40, h * 0.3, 74, 12); fig(160, '#2a4a8a', 0.55); fig(215, '#8a2a2a', 0.5); g.fillStyle = '#f4ecd8'; g.fillRect(x0 + 170, h * 0.5, 30, 22); }
        if (c === 3) { g.fillStyle = '#2a2a2a'; g.fillRect(x0 + 30, h * 0.5, 120, h * 0.4); g.fillStyle = '#8a8a8a'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x0 + 55 + i * 35, h * 0.62, 12, 0, PI * 2); g.fill(); } fig(200, '#3a3a5a', 0.55); g.fillStyle = '#f4ecd8'; g.fillRect(x0 + 60, h * 0.4, 70, 16); }
        g.strokeStyle = '#c8a860'; g.lineWidth = 8; g.strokeRect(x0 + 4, 4, cw - 8, h - 8);
      }
    }, 0.15);
    for (const s of [-1, 1]) for (const [j, z] of [FZ - 21.8, FZ - 26.8].entries()) {
      k.box(0.14, 2.45, 4.35, s * 8.99, TY + 6.6, z, wall);
      stripPanel(k, mural, (s < 0 ? 0 : 2) + j, 4, 4.0, 2.1, s * 8.9, TY + 6.6, z, s < 0 ? PI / 2 : -PI / 2);
    }
    // Fifth Avenue runs one way downtown, pigeons work the plaza
    traffic(k, ctx, [28.5, 32, 35.5, 39].map((z, i) => ({ a: v(75, 0, FZ + z), b: v(-75, 0, FZ + z), n: 4 + (i % 2) })), 9, 461);
    pigeons(k, ctx, [v(-4, 0, FZ + 19), v(4, 0, FZ + 18.4), v(-15, 0, FZ + 18.2), v(15, 0, FZ + 19.4), v(0, 0, FZ + 21)], 18, 462, 2.6);
    // landmark eggs
    const NYPL = { name: 'NYC Landmarks Preservation Commission, LP-2592', url: 'https://s-media.nyc.gov/agencies/lpc/lp/2592.pdf' };
    k.egg(v(-11, 3.3, FZ + 13.6), { id: 'patience', title: 'Patience, on the south plinth', year: '1911', text: 'Edward Clark Potter designed the lions and the Piccirilli Brothers carved them in Tennessee marble for the 1911 opening. In the 1930s Mayor Fiorello La Guardia named them Patience and Fortitude, the qualities he said New Yorkers would need to get through the Depression.', clue: 'Two stone cats guard the steps. Start with the one on your left.', source: { name: 'Wikipedia, Stephen A. Schwarzman Building', url: 'https://en.wikipedia.org/wiki/Stephen_A._Schwarzman_Building' } }, { r: 2.6 });
    k.egg(v(11, 3.3, FZ + 13.6), { id: 'fortitude', title: 'Fortitude, and the older names', text: 'Before the mayor\'s names stuck, New Yorkers called the pair Leo Astor and Leo Lenox, after two of the libraries merged to make this one. Later they were Lord Astor and Lady Lenox. Fortitude sits on the north side, to the right of the steps.', clue: 'The other stone cat, on the right, has had more than one name.', source: { name: 'Wikipedia, Patience and Fortitude', url: 'https://en.wikipedia.org/wiki/Patience_and_Fortitude' } }, { r: 2.6 });
    k.egg(v(-16.3, TY + 3.2, FZ + 1.4), { id: 'beauty-truth', title: 'Beauty and Truth', text: 'Frederick MacMonnies carved the marble figures above the two fountains on the Fifth Avenue front. Beauty rides the winged horse Pegasus on the south side, and Truth sits on a Sphinx on the north.', clue: 'Up on the terrace, listen for water in the alcoves either side of the portico.', source: { name: 'The New York Public Library', url: 'https://www.nypl.org/press/new-york-public-library-restores-fountains-fifth-avenue-facade' } }, { r: 2.0 });
    k.egg(v(0, TY + 13.4, FZ + 1.9), { id: 'attic', title: 'Six figures on the attic', text: 'Six marble figures by Paul Wayland Bartlett stand on the attic above the columns, each 11 feet tall, flanking three carved plaques. In pairs they stand for History and Philosophy, Romance and Religion, Poetry and Drama.', clue: 'Look high above the columns, where six stand in a row.', source: { name: 'Wikipedia, Stephen A. Schwarzman Building', url: 'https://en.wikipedia.org/wiki/Stephen_A._Schwarzman_Building' } }, { r: 3.2 });
    k.egg(v(-15.45, TY + 1.8, FZ - 1.3), { id: 'architects', title: 'The architects at the stair', year: '1911', text: 'Busts of the architects stand in niches at the foot of these stairs: Thomas Hastings by Frederick MacMonnies, 1935, and John Carrère by Jo Davidson, 1940. The pair won the 1897 competition, and President Taft dedicated the library on May 23, 1911.', clue: 'At the foot of the marble stairs, two men watch everyone come in.', source: NYPL }, { r: 1.1 });
    k.egg(v(0, TY + 15.5, FZ - 8), { id: 'first-interior', title: 'The first interior landmark', year: '1974', text: 'Astor Hall, the central stairs and the McGraw Rotunda became New York City\'s first interior landmark in November 1974. The first block of Vermont marble for the building was set in August 1902.', clue: 'Stand under the white vault and look up at the hall itself.', source: NYPL }, { r: 2.2 });
    k.egg(v(-8.9, TY + 6.6, FZ - 24.3), { id: 'recorded-word', title: 'The Story of the Recorded Word', year: '1938 to 1942', room: 'library', text: 'Edward Laning painted these panels for the McGraw Rotunda as a WPA project from 1938 to 1942: Moses with the tablets, a medieval scribe, Gutenberg showing a proof. The rotunda adjoins the catalog room and the Rose Main Reading Room beyond it.', clue: 'In the rotunda, look above the frames for four painted arches.', source: { name: 'NYPL Research Guides, History of the 42nd Street Library', url: 'https://libguides.nypl.org/sasbhistory/architecture' } }, { r: 3.0 });
    // the works: blind arched bays on the hall walls, above the flights, on the landings, in the rotunda, on the wings
    const mounts: Mount[] = [];
    const bay = (x: number, zc: number, dir: 1 | -1, w: number) => { const a = k.arch(w + 1.3, 6.8, 0.25, x, TY, zc - dir * 0.13, wall, false, 0.7); void a; };
    for (const s of [-1, 1]) {
      bay(s * 4.2, FZ - 0.6, -1, 3.0); mounts.push({ position: v(s * 4.2, TY + 3.6, FZ - 0.9), rotation: PI, target: v(s * 4.2, TY + 3, FZ - 6), width: 3.0, height: 2.1, style: 'gilt', wash: false });
      bay(s * 13.3, FZ - 0.6, -1, 3.4); mounts.push({ position: v(s * 13.3, TY + 3.7, FZ - 0.9), rotation: PI, target: v(s * 13.3, TY + 3, FZ - 5), width: 3.4, height: 2.4, style: 'gilt', wash: false });
      bay(s * 7.7, FZ - 15.4, 1, 4.2); mounts.push({ position: v(s * 7.7, TY + 3.9, FZ - 15.1), rotation: 0, target: v(s * 7.7, TY + 3, FZ - 10), width: 4.2, height: 2.8, style: 'gilt', wash: false });
      mounts.push({ position: v(s * 15.94, TY + 5.4, FZ - 6.5), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 13.6, TY + 4.5, FZ - 6.5), width: 3.2, height: 2.2, style: 'gilt', wash: false });
      mounts.push({ position: v(s * 15.94, TY + 8.3, FZ - 13.45), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 13.6, TY + 7.5, FZ - 13.45), width: 3.0, height: 2.2, style: 'gilt', wash: false });
      mounts.push({ position: v(s * 13.6, TY + 8.3, FZ - 15.34), rotation: 0, target: v(s * 13.6, TY + 7.5, FZ - 12.5), width: 3.2, height: 2.2, style: 'gilt', wash: false });
      for (const z of [FZ - 19.6, FZ - 24.3, FZ - 29]) mounts.push({ position: v(s * 8.94, TY + 3.9, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 4, TY + 3, z), width: 3.6, height: 2.5, style: 'gilt', wash: true });
      mounts.push({ position: v(s * 36.5, 3.7, FZ + 1.36), rotation: 0, target: v(s * 36.5, 3, FZ + 8), width: 3.6, height: 2.4, style: 'gilt', wash: false });
    }
    return {
      mounts, spawn: v(0, 3, FZ + 49.5), look: v(0, 11, FZ), eye: 3, bounds: [-50, 50, FZ - 31.6, FZ + 52], style: 'gilt',
      floorY: (x, z) => {
        if (z > FZ + 15) return 0;
        if (z > FZ + 3) return Math.abs(x) < 8 ? (TY * (FZ + 15 - z)) / 12 : 0;
        if (z > FZ + 0.6) return Math.abs(x) < 23 ? TY : 0;
        const ax = Math.abs(x);
        if (z < FZ - 0.6 && z > FZ - 15.4 && ax > 11.8 && ax < 15.4) {
          if (z > FZ - 3) return TY;
          if (z > FZ - 11.5) return TY + (4.5 * (FZ - 3 - z)) / 8.5;
          return TY + 4.5;
        }
        return TY;
      },
    };
  },
};

/* ---------------- 123 JEFFERSON MARKET LIBRARY ---------------- */
export const jefferson: RoomDef = {
  id: 'jefferson',
  name: 'The clock keeps stories',
  area: 'JEFFERSON MARKET LIBRARY',
  mood: 'Village Gothic, a bright morning',
  color: '#be8b75',
  description: 'Sixth Avenue at Tenth Street: the polychrome brick tower with its working clock, the stair turret, the garden through the fence, then the Gothic reading room under timber trusses, stained glass in the pointed windows, green lamps on the tables, the stacks.',
  signatures: 'Victorian Gothic in red brick banded with limestone, the clock tower with its steep pyramid roof and four faces, the round stair turret, pointed arches everywhere, the timber trussed reading room, the garden on the old prison site.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xf0e8dc, ground: 0x4a5a5c, fog: 0.002, sun: { az: 4.0, el: 0.5, color: 0xfff0d8, size: 12 }, env: 0.9 });
    k.hemi(0xeef4ff, 0x4a4238, 0.85);
    k.sun(0xffe8c8, 2.2, 55, 60, 45, true, 90);
    const brick = k.pbr('jmBrick', X.brick(0x8a3f34, 461), 0.28),
      stone = k.pbr('jmStone', X.ashlar(0xd8cdb4, 462, 3), 0.25),
      slate = k.pbr('jmSlate', X.ashlar(0x3a3f46, 463, 8), 0.4, { roughness: 0.8 }),
      timber = k.pbr('jmTimber', X.planks(0x4a3020, 3, 464), 1.2, { roughness: 0.6 }),
      boards = k.pbr('jmBoards', X.planks(0x6a4a30, 8, 465), 0.5, { roughness: 0.7 }),
      floorW = k.pbr('jmFloor', X.planks(0x7a5334, 8, 466), 0.6, { roughness: 0.55 }),
      plaster = k.pbr('jmPlaster', X.plaster(0xe4dccb, 467), 0.4, { roughness: 0.85 }),
      books = k.pbr('jmBooks', X.planks(0x6a3a2a, 14, 468, 0.5), 0.35, { roughness: 0.85, stretch: 0.3 }),
      books2 = k.pbr('jmBooks2', X.planks(0x2f4a5a, 12, 469, 0.5), 0.35, { roughness: 0.85, stretch: 0.3 }),
      oak = k.pbr('jmOak', X.planks(0x5c3d26, 4, 470), 1.0, { roughness: 0.5 }),
      lawn = k.pbr('jmLawn', X.grass(0x4b7a3a, 471), 0.12),
      path = k.pbr('jmPath', X.pavers(0x9a9488, 472), 0.35),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      brass = k.flat(0x8a6a2a, 0.85, 0.35),
      lead = k.flat(0x2a2a2e, 0.5, 0.6),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      green = k.glow(0x8ad48a),
      opal = k.glow(0xfff1d2),
      clockWhite = k.glow(0xf8f2e0),
      pane = [k.glow(0xd8a850), k.glow(0x4a6ad8), k.glow(0xd84a4a), k.glow(0x4ab070)],
      petalA = k.flat(0xd86a8a, 0, 0.9), petalB = k.flat(0xf4e6c0, 0, 0.9), petalC = k.flat(0x7a4ad8, 0, 0.9);
    // Sixth Avenue and Tenth Street, the neighbours
    street(k, { w: 24, len: 150, z: -15, x: 0, walk: 5 });
    avenueX(k, { w: 12, len: 60, z: 28, x: -47, walk: 5, drop: 0.02 });
    blockFront(k, { x: 17, z0: 46, count: 9, face: -1, seed: 473, h: [14, 22] });
    blockFront(k, { x: -17, z0: 66, count: 4, face: 1, seed: 474, h: [14, 20] });
    blockFront(k, { x: -17, z0: -46, count: 3, face: 1, seed: 475, h: [12, 18] });
    k.skyline({ z: -150, count: 20, spacing: 7, scale: 2.4, base: -1, seed: 476, lit: 0.2, glow: 0.4, tint: 0x6e7684, rows: 2 });
    k.skyline({ z: 150, count: 20, spacing: 7, scale: 2.4, base: -1, seed: 477, lit: 0.2, glow: 0.4, tint: 0x6e7684, rows: 1 });
    for (const z of [-30, 10, 40]) k.prop('lamppost', 13, 0, z, { height: 6.5, keepOut: 0.5 });
    for (const z of [-8, 24]) k.prop('lamppost', -13.2, 0, z, { height: 6.5, keepOut: 0.5 });
    k.prop('hydrant', -12.6, 0, 2, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', 12.8, 0, -14, { height: 1.5, rotY: -PI / 2, keepOut: 0.6 });
    for (const z of [-40, 16, 32]) k.tree(13.5, 0, z, { kind: 'round', h: 6, r: 2.6, seed: 30 + z, leaf: 0x3f6b36 });
    // the main block: brick with stone bands, the pointed windows, the slate roof on timber trusses
    const X0 = -17.5, X1 = -33.5, XC = (X0 + X1) / 2, Z0 = 10, Z1 = -14, ZC = (Z0 + Z1) / 2, H = 9, RIDGE = 14;
    k.box(16.4, 0.3, 24.4, XC, -0.15, ZC, floorW);
    k.box(1.0, H, 18.8, X0, H / 2, -4.6, brick);
    const door = k.arch(3.4, 5, 1.0, X0, 0, 7.7, stone, true, 0.85);
    door.rotation.y = PI / 2;
    k.box(1.0, H - 5.65, 5.8, X0, 5.65 + (H - 5.65) / 2, 7.7, brick);
    k.box(1.0, H, 24.4, X1, H / 2, ZC, brick);
    k.box(16.4, H, 1.0, XC, H / 2, Z1, brick);
    k.box(16.4, H, 1.0, XC, H / 2, Z0, brick);
    for (const y of [2.6, 5.6, 8.6]) { k.box(0.1, 0.3, 24.6, X0 + 0.5, y, ZC, stone); k.box(0.1, 0.3, 24.6, X1 - 0.5, y, ZC, stone); k.box(16.5, 0.3, 0.1, XC, y, Z1 - 0.52, stone); }
    // plaster liners on the inside of the brick walls
    k.box(0.12, H, 18.8, X0 - 0.56, H / 2, -4.6, plaster); k.box(0.12, H - 5.65, 5.8, X0 - 0.56, 5.65 + (H - 5.65) / 2, 7.7, plaster);
    k.box(0.12, H, 24.4, X1 + 0.56, H / 2, ZC, plaster); k.box(16.4, H, 0.12, XC, H / 2, Z1 + 0.56, plaster); k.box(16.4, H, 0.12, XC, H / 2, Z0 - 0.56, plaster);
    const tri = new T.Shape(); tri.moveTo(-8.2, 0); tri.lineTo(8.2, 0); tri.lineTo(0, RIDGE - H); tri.closePath();
    for (const z of [Z0, Z1]) { const g = new T.ExtrudeGeometry(tri, { depth: 1.0, bevelEnabled: false }); g.translate(0, 0, -0.5); k.mesh(g, brick, XC, H, z); }
    for (const s of [-1, 1]) {
      const cx = XC + s * 4.25;
      const roof = k.box(9.9, 0.3, 26, cx, 11.5, ZC, slate); roof.rotation.z = -s * 0.532;
      const under = k.box(9.6, 0.06, 24.2, cx, 11.3, ZC, boards); under.rotation.z = -s * 0.532;
    }
    for (let z = Z1 + 2; z < Z0; z += 4) {
      k.beam(v(X0 + 0.4, H - 0.2, z), v(X1 - 0.4, H - 0.2, z), 0.16, timber, 8);
      k.beam(v(X0 + 0.4, H - 0.1, z), v(XC, RIDGE - 0.4, z), 0.15, timber, 8);
      k.beam(v(X1 - 0.4, H - 0.1, z), v(XC, RIDGE - 0.4, z), 0.15, timber, 8);
      k.beam(v(XC, H - 0.2, z), v(XC, RIDGE - 0.4, z), 0.13, timber, 8);
      for (const s of [-1, 1]) { k.beam(v(XC + s * 3.6, H - 0.2, z), v(XC + s * 1.6, RIDGE - 1.6, z), 0.1, timber, 6); k.beam(v(XC + s * 7.6, H - 1.2, z), v(XC + s * 5.6, H - 0.2, z), 0.1, timber, 6); }
    }
    for (const s of [-1, 1]) for (const [dx, y] of [[2.1, 12.5], [4.2, 11.3], [6.3, 10.1]] as const) k.beam(v(XC + s * dx, y, Z1 + 0.5), v(XC + s * dx, y, Z0 - 0.5), 0.09, timber, 6);
    k.beam(v(XC, RIDGE + 0.1, Z1 - 0.6), v(XC, RIDGE + 0.1, Z0 + 0.6), 0.14, timber, 8);
    // windows: pointed stone surrounds outside, a glow pane and lead lattice inside and out
    const win = (x: number, z: number, w: number, h: number, y0: number, along: 'x' | 'z', dir: 1 | -1, col: T.Material) => {
      const rotY = along === 'z' ? (dir > 0 ? PI / 2 : -PI / 2) : dir > 0 ? 0 : PI;
      const px = along === 'z' ? x + dir * 0.06 : x, pz = along === 'z' ? z : z + dir * 0.06;
      const sur = k.arch(w, h, 0.3, along === 'z' ? x + dir * 0.15 : x, y0, along === 'z' ? z : z + dir * 0.15, stone, true, 0.72);
      sur.rotation.y = along === 'z' ? PI / 2 : 0;
      k.plane(w, h * 0.95, px, y0 + h * 0.48, pz, col, rotY);
      for (let i = 1; i < 3; i++) { const o = i * w / 3 - w / 2; along === 'z' ? k.box(0.04, h * 0.9, 0.06, px + dir * 0.02, y0 + h * 0.46, z + o, lead) : k.box(0.06, h * 0.9, 0.04, x + o, y0 + h * 0.46, pz + dir * 0.02, lead); }
      for (let j = 1; j < 6; j++) { const oy = y0 + (j * h * 0.9) / 6; along === 'z' ? k.box(0.04, 0.06, w, px + dir * 0.02, oy, z, lead) : k.box(w, 0.06, 0.04, x, oy, pz + dir * 0.02, lead); }
    };
    for (const [i, z] of [-11, -4.5, 2].entries()) { win(X0 - 0.62, z, 2.4, 5, 2.6, 'z', -1, pane[i % 4]); win(X0 + 0.5, z, 2.4, 5, 2.6, 'z', 1, pane[i % 4]); }
    for (const [i, z] of [-7, -1, 4.7].entries()) { win(X1 - 0.5, z, 2.0, 4.4, 3.0, 'z', -1, pane[(i + 1) % 4]); win(X1 + 0.62, z, 2.0, 4.4, 3.0, 'z', 1, pane[(i + 1) % 4]); }
    win(XC, Z1 - 0.5, 4.2, 7.2, 2.6, 'x', -1, pane[1]); win(XC, Z1 + 0.62, 4.2, 7.2, 2.6, 'x', 1, pane[1]);
    for (const [x, z] of [[X0 - 1.2, -11], [X0 - 1.2, -4.5], [X0 - 1.2, 2], [XC, Z1 - 1.2]]) k.point(x, 5, z, 0xffe8c0, 6, 6);
    for (const z of [-8, -1, 5]) k.point(XC, 7.5, z, 0xfff0dc, 32, 16);
    for (const x of [-20, -31]) k.point(x, 6.5, -2, 0xffe8d0, 14, 12);
    // the clock tower on the corner, the pyramid roof, the four faces, the stair turret
    const TX = -21.5, TZ = 14, TH = 26;
    // the shaft, then the open fire lookout stage between stone piers, then the clock stage
    k.box(8, 16.6, 8, TX, 8.3, TZ, brick);
    k.box(8, TH - 20.6, 8, TX, (TH + 20.6) / 2, TZ, brick);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(1.5, 4, 1.5, TX + sx * 3.25, 18.6, TZ + sz * 3.25, brick);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      for (const o of [-0.85, 0.85]) { const px = TX + dx * 3.7 + (dz ? o : 0), pz = TZ + dz * 3.7 + (dx ? o : 0); k.cyl(0.14, 3.2, px, 18.3, pz, stone, 0.14, 8); }
      const la = k.arcade(5, 1.1, 0.3, 3, 1.5, 1.1, TX + dx * 3.7, 19.5, TZ + dz * 3.7, stone, dx ? PI / 2 : 0, true); void la;
      k.box(dx ? 0.3 : 5, 0.9, dx ? 5 : 0.3, TX + dx * 3.85, 17.25, TZ + dz * 3.85, stone);
    }
    k.box(7.2, 0.2, 7.2, TX, 20.5, TZ, boards);
    for (const y of [2.6, 5.6, 8.6, 12.6, 16.6, 20.6]) k.box(8.2, 0.3, 8.2, TX, y, TZ, stone);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.mesh(new T.ConeGeometry(0.34, 2.6, 6), stone, TX + sx * 3.8, TH + 1.3, TZ + sz * 3.8);
    for (let i = 0; i < 2; i++) { const y = 11 + i * 3.6; for (const [dx, dz, ry] of [[4.05, 0, PI / 2], [0, 4.05, 0]] as const) { k.plane(0.9, 2.6, TX + dx, y, TZ + dz, pane[(i + 2) % 4], ry); k.box(dx ? 0.1 : 1.2, 2.9, dx ? 1.2 : 0.1, TX + dx * 1.01, y, TZ + dz * 1.01, stone); } }
    for (const [dx, dz, ry] of [[4.05, 0, PI / 2], [-4.05, 0, -PI / 2], [0, 4.05, 0], [0, -4.05, PI]] as const) {
      clockFace(k, ctx, TX + dx, 23.2, TZ + dz, 1.5, ry, clockWhite, lead);
      const gg = new T.Shape(); gg.moveTo(-4.1, 0); gg.lineTo(4.1, 0); gg.lineTo(0, 3.2); gg.closePath();
      const g = new T.ExtrudeGeometry(gg, { depth: 0.6, bevelEnabled: false }); g.translate(0, 0, -0.3);
      const gable = k.mesh(g, stone, TX + dx * 0.93, TH, TZ + dz * 0.93); gable.rotation.y = ry;
    }
    k.point(TX + 6, 23, TZ, 0xffe8c0, 12, 9); k.point(TX, 23, TZ + 6, 0xffe8c0, 12, 9);
    const pyr = k.mesh(new T.ConeGeometry(5.9, 10, 4), slate, TX, TH + 5, TZ); pyr.rotation.y = PI / 4;
    k.cyl(0.08, 3, TX, TH + 11.4, TZ, iron, 0.03, 6);
    k.sphere(0.3, TX, TH + 13, TZ, brass, 10);
    k.block(TX - 4, TX + 4, TZ - 4, TZ + 4);
    const UX = X0 + 0.4, UZ = Z1 - 0.4;
    k.cyl(1.7, 15, UX, 7.5, UZ, brick, 1.7, 16);
    for (const y of [2.6, 5.6, 8.6, 11.6]) k.cyl(1.78, 0.3, UX, y, UZ, stone, 1.78, 16);
    for (let i = 0; i < 4; i++) k.plane(0.4, 1.4, UX + Math.sin(i * 1.3 + 0.4) * 1.72, 4 + i * 2.8, UZ + Math.cos(i * 1.3 + 0.4) * 1.72, opal, i * 1.3 + 0.4);
    k.mesh(new T.ConeGeometry(2.0, 3.2, 16), slate, UX, 16.6, UZ);
    k.keepOut.push({ x: UX, z: UZ, r: 2.1 });
    k.sign('JEFFERSON MARKET LIBRARY', 6.4, 0.6, X0 + 0.52, 6.6, 7.7, 'transparent', '#e8dcc0', 80, PI / 2);
    k.sign('THE NEW YORK PUBLIC LIBRARY  ·  BRANCH  ·  1877', 5, 0.42, X0 + 0.52, 1.6, 1.4, '#3a2a24', '#e8dcc0', 60, PI / 2);
    // blocks for the walls
    k.block(X0 - 0.5, X0 + 0.5, Z1 - 0.5, 6.0); k.block(X0 - 0.5, X0 + 0.5, 9.4, Z0 + 0.5);
    k.block(X1 - 0.5, X1 + 0.5, Z1 - 0.5, Z0 + 0.5); k.block(X1, X0, Z1 - 0.5, Z1 + 0.5); k.block(X1, X0, Z0 - 0.5, Z0 + 0.5);
    // inside: the stacks along the west wall, the reading tables with green lamps, chairs
    for (let i = 0; i < 5; i++) {
      const z = -11 + i * 4.6;
      k.box(0.7, 2.5, 4.2, X1 + 0.97, 1.25, z, oak);
      for (let j = 0; j < 4; j++) k.box(0.5, 0.5, 3.9, X1 + 1.07, 0.5 + j * 0.54, z, j % 2 ? books : books2);
    }
    k.block(X1 + 0.5, X1 + 1.25, Z1 + 0.5, Z0 - 0.5);
    for (const z of [-8, -1.5, 5]) {
      const x = -25.3;
      k.rounded(5.0, 0.14, 3.2, x, 1.05, z, oak);
      for (const dx of [-2.2, 2.2]) for (const dz of [-1.3, 1.3]) k.box(0.14, 1.0, 0.14, x + dx, 0.5, z + dz, oak);
      k.box(5.0, 0.5, 0.3, x, 1.35, z, oak);
      for (const dx of [-1.6, 0, 1.6]) { k.lathe([[0.2, 0], [0.2, 0.05], [0.05, 0.1], [0.05, 0.55], [0.28, 0.6]], x + dx, 1.12, z, brass, 12); k.rounded(0.34, 0.16, 0.56, x + dx, 1.8, z, green, 0.05); k.point(x + dx, 1.7, z, 0xd8ffc8, 4, 3.4); }
      for (const dz of [-2.05, 2.05]) for (const dx of [-1.5, 0, 1.5]) { k.box(0.48, 0.06, 0.48, x + dx, 0.6, z + dz, oak); k.box(0.48, 1.0, 0.06, x + dx, 1.0, z + dz + (dz > 0 ? 0.22 : -0.22), oak); for (const lx of [-0.2, 0.2]) for (const lz of [-0.2, 0.2]) k.box(0.05, 0.6, 0.05, x + dx + lx, 0.3, z + dz + lz, oak); }
      k.block(x - 2.9, x + 2.9, z - 2.3, z + 2.3);
    }
    k.prop('globe_stand', -19.5, 0, -11.5, { height: 1.6, keepOut: 0.8 });
    k.censusWall({ x: -25.5, y: 4.4, z: Z0 - 0.68, rotY: PI, cols: 14, rows: 5, tile: 0.6, gap: 0.05, start: ctx.wallStart(2400, 70), pieces: ctx.all, backing: oak });
    k.sign('"READING ROOM"', 3.6, 0.6, -25.5, 7.4, Z0 - 0.7, 'transparent', '#2a2a2a', 100, PI);
    // the garden through its iron fence: lawn, a looping path, flowers, trees, benches, the easels
    const GX0 = -18, GX1 = -46, GZ0 = -15, GZ1 = -41;
    k.box(GX0 - GX1, 0.28, GZ0 - GZ1, (GX0 + GX1) / 2, -0.02, (GZ0 + GZ1) / 2, lawn);
    k.box(2.4, 0.3, GZ0 - GZ1 - 2, GX0 - 4, 0.0, (GZ0 + GZ1) / 2, path);
    k.box(GX0 - GX1 - 2, 0.3, 2.4, (GX0 + GX1) / 2, 0.0, GZ1 + 4, path);
    k.box(GX0 - GX1 - 2, 0.3, 2.4, (GX0 + GX1) / 2, 0.0, GZ0 - 3.5, path);
    k.box(2.4, 0.3, GZ0 - GZ1 - 2, GX1 + 4, 0.0, (GZ0 + GZ1) / 2, path);
    k.rail(GX0 - 0.1, (GZ1 + GZ0 - 5) / 2 - 2.5, GZ0 - GZ1 - 5.4, iron, 1.4, 'z', 1.0);
    k.rail((GX0 + GX1) / 2, GZ1 + 0.1, GX0 - GX1, iron, 1.4, 'x', 1.0);
    k.block(GX0 - 0.3, GX0 + 0.3, GZ1, GZ0 - 5.4); k.block(GX1, GX0, GZ1 - 0.3, GZ1 + 0.3);
    for (const [x, z] of [[GX0 - 2.8, GZ0 - 2.4], [GX0 - 2.8, GZ1 + 1.6]]) k.lathe([[0.16, 0], [0.16, 1.5], [0.3, 1.6], [0.3, 1.9], [0.2, 2.1]], x, 0, z, stone, 10);
    const rnd = X.mulberry(478);
    for (let i = 0; i < 150; i++) { const x = GX1 + 6 + rnd() * (GX0 - GX1 - 12), z = GZ1 + 6 + rnd() * (GZ0 - GZ1 - 12); if (Math.abs(x - (GX0 - 4)) < 1.6 || Math.abs(x - (GX1 + 4)) < 1.6) continue; k.cyl(0.02, 0.4, x, 0.2, z, iron, 0.02, 4); k.sphere(0.16, x, 0.45, z, rnd() < 0.4 ? petalA : rnd() < 0.7 ? petalB : petalC, 6); }
    for (const [x, z, h] of [[-27, -21, 7], [-36, -20, 6], [-24, -33, 6.5], [-38, -30, 8], [-31, -27, 5.5]]) { k.tree(x, 0, z, { kind: 'round', h, r: 2.6 + h * 0.1, seed: 10 + x, leaf: 0x3f6b36 }); k.keepOut.push({ x, z, r: 0.7 }); }
    for (const [x, z, r] of [[-22, -24, PI / 2], [-22, -32, PI / 2], [-40, -26, -PI / 2]]) parkBench(k, x, z, r, k.pbr('benchW', X.planks(0x5d4939, 3, 32), 1.2), iron, 2.2);
    for (const z of [-24, -30, -36]) k.lamp(GX0 - 5.4, z, 4.5, iron, 0xffe0b0, 20);
    // life: the avenue, the readers, the clock
    k.crowd([v(14.5, 0, -70), v(14.5, 0, 48), v(-14.5, 0, 48), v(-14.5, 0, -70)], 30, { seed: 64, speed: 1.0, spread: 2.4, animate: !ctx.reduced, closed: true });
    k.crowd([v(-19.6, 0, -12), v(-19.6, 0, 8), v(-30.6, 0, 8), v(-30.6, 0, -12)], 8, { seed: 65, speed: 0.3, spread: 1.0, animate: !ctx.reduced, closed: true, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517, 0x4a6a3a] });
    // iron cresting along the ridge and stone finials on the two gables
    for (let z = Z1 + 0.5; z <= Z0 - 0.5; z += 1.2) k.mesh(new T.ConeGeometry(0.09, 0.7, 4), iron, XC, RIDGE + 0.55, z);
    for (const z of [Z0, Z1]) { k.cyl(0.22, 1.2, XC, RIDGE + 0.5, z, stone, 0.3, 8); k.mesh(new T.ConeGeometry(0.28, 1.4, 8), stone, XC, RIDGE + 1.8, z); }
    // the bell in the lookout, striking the hour on the clock above it
    const bell = hungBell(k, TX, 20.35, TZ, 1.25, brass);
    k.beam(v(TX - 2.6, 20.35, TZ), v(TX + 2.6, 20.35, TZ), 0.12, timber, 6);
    if (!ctx.reduced) k.ticks.push((t) => { const since = (((k.o.hour + t / 3600) % 1) + 1) % 1 * 3600, amp = since < 24 ? 0.45 * (1 - since / 24) : 0; bell.rotation.x = amp * Math.sin(t * 3.4); });
    // Sixth Avenue runs one way uptown; pigeons circle the tower and work the sidewalk; leaves come down in the garden
    traffic(k, ctx, [-9, -5, -1, 3, 7].map((x, i) => ({ a: v(x, 0, -75), b: v(x, 0, 75), n: 4 + (i % 2) })), 8, 481);
    gulls(k, ctx, Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * PI * 2; return v(TX + Math.cos(a) * 13, 29 + (i % 2) * 2, TZ + Math.sin(a) * 13); }), 12, 482, 0x80848e, 0.42);
    pigeons(k, ctx, [v(-14.2, 0, 1), v(-14.4, 0, -9), v(14.6, 0, 20), v(GX0 - 4, 0.15, -27)], 14, 483, 2.2);
    {
      const n = 36, leaf = new T.InstancedMesh(new T.PlaneGeometry(0.16, 0.11), k.flat(0xb8862a, 0, 0.9, { side: T.DoubleSide }), n), rs = X.mulberry(484);
      const st = Array.from({ length: n }, () => ({ x: GX1 + 5 + rs() * (GX0 - GX1 - 10), z: GZ1 + 5 + rs() * (GZ0 - GZ1 - 10), h: 5 + rs() * 3, v: 0.35 + rs() * 0.3, ph: rs() * 6.28 }));
      leaf.frustumCulled = false;
      k.add(leaf);
      const M = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), one = new T.Vector3(1, 1, 1);
      const place = (t: number) => { st.forEach((a, i) => { const y = a.h - ((t * a.v + a.ph) % a.h); p.set(a.x + Math.sin(t * 0.8 + a.ph) * 0.7, Math.max(0.2, y), a.z + Math.cos(t * 0.6 + a.ph) * 0.5); e.set(t * 2 + a.ph, t * 1.3, a.ph); q.setFromEuler(e); M.compose(p, q, one); leaf.setMatrixAt(i, M); }); leaf.instanceMatrix.needsUpdate = true; };
      place(0);
      if (!ctx.reduced) k.ticks.push((t) => place(t));
    }
    // landmark eggs
    const VP = { name: 'Village Preservation', url: 'https://villagepreservation.org/2012/02/01/the-jefferson-market-library-a-striking-landmark-shines-again/' };
    k.egg(v(TX + 4.15, 23.2, TZ), { id: 'clock', title: 'The clock the Village restarted', year: '1950s', text: 'In the late 1950s Margot Gayle formed the Village Neighborhood Committee to get this clock running again. The courthouse survived, and in 1967 it reopened as a branch of the New York Public Library.', clue: 'Four faces keep New York time up high. The one over Sixth Avenue has a story.', source: VP }, { r: 1.7 });
    k.egg(v(TX, 19.2, TZ), { id: 'fire-watch', title: 'The fire watch in the tower', year: '1877 to 1945', text: 'The tower went up in 1877 as a fire watchtower as well as a clock. A watchman up here rang the bell to call out firefighters, and the tower kept watch until 1945, when the building became a police academy.', clue: 'Below the clocks, between the stone piers, something waits to ring.', source: { name: 'Village Preservation, Village Firehouses Past and Present', url: 'https://villagepreservation.org/2019/08/13/village-firehouse-architecture-is-hot/' } }, { r: 2.2 });
    k.egg(v(X0 + 0.7, 3.2, 7.7), { id: 'fifth-most-beautiful', title: 'Fifth most beautiful in America', year: '1877', text: 'Frederick Clarke Withers and Calvert Vaux built this courthouse between 1874 and 1877. In an 1880s poll, their fellow architects voted it the fifth most beautiful building in the United States.', clue: 'The pointed stone doorway on Sixth Avenue leads into an old courthouse.', source: VP }, { r: 1.9 });
    k.egg(v(-31, 1.3, -35.5), { id: 'garden', title: 'A garden where a jail stood', year: '1975', text: 'This garden grows on the site of the Women\'s House of Detention, an eleven story Art Deco jail demolished in 1973 and 1974. The Jefferson Market Garden was founded here in 1975.', clue: 'Follow the iron fence round to the flowers behind the library.', source: { name: 'Jefferson Market Garden', url: 'https://www.jeffersonmarketgarden.org/history' } }, { r: 2.4 });
    k.egg(v(-25.3, 1.9, -1.5), { id: 'cavaglieri', title: 'From courtroom to reading room', year: '1967', text: 'Preservation architect Giorgio Cavaglieri turned the old courthouse into this library, which opened in 1967. His conversion won an American Institute of Architects Honor Award in 1968.', clue: 'Sit at a table under the green lamps and read the room.', source: VP }, { r: 1.6 });
    // the works: between the pointed windows inside and out, flanking the great window, above the stacks, the easels in the garden
    const mounts: Mount[] = [];
    for (const z of [-7.75, -1.25]) {
      mounts.push({ position: v(X0 - 0.68, 3.5, z), rotation: -PI / 2, target: v(X0 - 3.2, 3, z), width: 3.0, height: 2.0, style: 'oak', wash: true });
      const sur = k.arch(3.6, 6.0, 0.25, X0 + 0.625, 0.2, z, stone, true, 0.55); sur.rotation.y = PI / 2;
      mounts.push({ position: v(X0 + 0.8, 3.6, z), rotation: PI / 2, target: v(X0 + 3.4, 3, z), width: 3.0, height: 2.1, style: 'oak', wash: false });
    }
    const tsur = k.arch(4.6, 6.4, 0.25, TX + 4.12, 0.2, TZ, stone, true, 0.7); tsur.rotation.y = PI / 2;
    mounts.push({ position: v(TX + 4.3, 3.7, TZ), rotation: PI / 2, target: v(TX + 8.6, 3, TZ), width: 3.4, height: 2.3, style: 'oak', wash: false });
    for (const x of [-20.5, -30.5]) mounts.push({ position: v(x, 3.6, Z1 + 0.68), rotation: 0, target: v(x, 3, Z1 + 4.2), width: 3.2, height: 2.2, style: 'oak', wash: true });
    for (const x of [-19.2, -31.5]) mounts.push({ position: v(x, 3.6, Z0 - 0.68), rotation: PI, target: v(x, 3, Z0 - 4.2), width: 2.4, height: 1.9, style: 'oak', wash: true });
    for (const z of [-10, -4, 2, 7.5]) mounts.push({ position: v(X1 + 0.68, 4.5, z), rotation: PI / 2, target: v(X1 + 4.5, 3, z), width: 3.4, height: 2.4, style: 'oak', wash: true });
    const easel = (x: number, z: number, rot: number, tx: number, tz: number) => { const b = k.box(0.3, 4.4, 5.2, 0, 0, 0, steel); b.position.set(x, 2.3, z); b.rotation.y = rot; const f = k.box(1.0, 0.25, 5.6, 0, 0, 0, stone); f.position.set(x, 0.12, z); f.rotation.y = rot; k.keepOut.push({ x, z, r: 2.9 }); const dir = Math.atan2(tx - x, tz - z); mounts.push({ position: v(x + Math.sin(dir) * 0.2, 3.4, z + Math.cos(dir) * 0.2), rotation: dir, target: v(tx, 3, tz), width: 3.6, height: 2.4, style: 'steel', wash: false }); };
    for (const z of [-21, -28, -35]) easel(GX1 + 1.4, z, 0, GX1 + 6, z);
    for (const x of [-24, -31, -38]) easel(x, GZ1 + 1.4, PI / 2, x, GZ1 + 6.2);
    return { mounts, spawn: v(13.5, 3, -2), look: v(-19, 12, 8), eye: 3, bounds: [-45.4, 16.4, -42, 40], style: 'oak' };
  },
};

/* ---------------- 124 THE ELDRIDGE STREET SYNAGOGUE ---------------- */
export const eldridge: RoomDef = {
  id: 'eldridge',
  name: 'An immigrant constellation',
  area: 'ELDRIDGE STREET SYNAGOGUE',
  mood: 'Candle light under painted stars',
  color: '#819cbd',
  description: 'A narrow Lower East Side street of tenements, the Moorish facade with its wheel window and horseshoe doors, then the sanctuary: a vault of gold stars on blue, the women\'s gallery on slender columns, brass chandeliers swaying, the round blue window over the ark.',
  signatures: 'The 1887 Moorish Revival front with the rose window and horseshoe arches, the barrel vaulted sanctuary painted with stars, the horseshoe arcaded galleries, the central bimah and the ark, the round east window of blue glass and gold stars, the pews.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e2d8, ground: 0x4a4a48, fog: 0.0024, sun: { az: 1.4, el: 0.45, color: 0xfff0d8, size: 12 }, env: 0.8 });
    k.hemi(0xe8ecff, 0x3a3230, 0.6);
    k.sun(0xffe8c8, 1.8, 50, 50, 30, true, 70);
    const brick = k.pbr('eldBrick', X.brick(0xa25a3f, 453), 0.28),
      stone = k.pbr('eldStone', X.ashlar(0xd8ccb4, 455, 3), 0.25),
      terra = k.flat(0xc9866a, 0, 0.7),
      floorW = k.pbr('eldFloor', X.planks(0x7a5a3c, 8, 456), 0.6, { roughness: 0.6 }),
      plaster = k.pbr('eldPlaster', X.plaster(0xd8cfbe, 457), 0.4, { roughness: 0.85 }),
      stars = k.flat(0x1b2a5e, 0, 0.92, { side: T.BackSide }),
      ivory = k.pbr('eldIvory', X.marble(0xe8e0d0, 0xc8b898, 458), 0.6, { roughness: 0.5 }),
      walnut = k.pbr('eldWalnut', X.planks(0x4a2e1a, 3, 459, 0.2), 1.6, { roughness: 0.45 }),
      pew = k.pbr('eldPew', X.planks(0x6a4428, 4, 460, 0.2), 1.4, { roughness: 0.5 }),
      gilt = k.pbr('eldGilt', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      brass = k.flat(0xb08a3a, 0.8, 0.35),
      iron = k.flat(0x1f262b, 0.75, 0.45),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      lead = k.flat(0x3a3e46, 0.4, 0.6),
      blue = k.glow(0x2652d8),
      blueDeep = k.glow(0x123a9a),
      gold = k.glow(0xffd27a),
      pane = [k.glow(0xd8a850), k.glow(0x4a6ad8), k.glow(0xd84a4a), k.glow(0x4ab070), k.glow(0xd88ad0)];
    // Eldridge Street: narrow, tenements both sides, fire escapes, the Manhattan Bridge side far off
    street(k, { w: 9, len: 130, z: 0, x: 0, walk: 3.5 });
    blockFront(k, { x: -8, z0: 34, count: 3, face: 1, seed: 445, h: [16, 22] });
    blockFront(k, { x: -8, z0: -14, count: 4, face: 1, seed: 446, h: [16, 22] });
    blockFront(k, { x: 8, z0: 34, count: 7, face: -1, seed: 457, h: [16, 22] });
    k.skyline({ z: -110, count: 20, spacing: 5, scale: 2.2, base: -1, seed: 482, lit: 0.22, glow: 0.4, tint: 0x5e6674, rows: 2 });
    k.skyline({ z: 110, count: 20, spacing: 5, scale: 2.0, base: -1, seed: 483, lit: 0.22, glow: 0.4, tint: 0x5e6674, rows: 1 });
    for (const z of [-24, -4, 30]) k.prop('lamppost', 5.6, 0, z, { height: 6, keepOut: 0.5 });
    k.prop('lamppost', -5.6, 0, -18, { height: 6, keepOut: 0.5 });
    k.prop('hydrant', -5.4, 0, 12.4, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', 5.6, 0, 16, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    k.tree(5.8, 0, -8, { kind: 'round', h: 5.5, r: 2.2, seed: 21, leaf: 0x3f6b36 });
    k.keepOut.push({ x: 5.8, z: -8, r: 0.6 });
    for (const s of [-1, 1]) { k.box(0.4, 2.4, 3.6, -8.2, 1.2, s * 12, brick); k.block(-8.6, -7.8, s * 12 - 1.8, s * 12 + 1.8); }
    // the facade: brick with terra cotta and stone, three horseshoe doors, keyhole windows, the wheel window, twin finials
    const FX = -8, DEPTH = 30, EX = FX - DEPTH;
    k.box(1.2, 12.35, 20, FX, 5.65 + 6.175, 0, brick);
    k.box(1.3, 0.5, 20.2, FX, 5.9, 0, stone);
    k.box(1.3, 0.5, 20.2, FX, 10.4, 0, stone);
    const cd = k.arch(3.4, 5, 1.24, FX, 0, 0, stone, false, 0.9); cd.rotation.y = PI / 2;
    for (const s of [-1, 1]) { const sd = k.arch(2.4, 4.2, 1.22, FX, 0, s * 6, stone, false, 0.9); sd.rotation.y = PI / 2; k.box(1.2, 5.65, 1.85, FX, 2.825, s * 9.08, brick); k.box(1.2, 5.65, 0.8, FX, 2.825, s * 3.45, brick); }
    const horseshoe = (x: number, y: number, z: number, r: number, tube: number, arc: number, m: T.Material) => { const h = k.mesh(new T.TorusGeometry(r, tube, 8, 40, arc), m, x, y, z); h.rotation.y = PI / 2; h.rotateZ(PI / 2 - arc / 2); return h; };
    horseshoe(FX + 0.66, 3.25, 0, 1.95, 0.16, PI * 1.28, terra);
    for (const s of [-1, 1]) horseshoe(FX + 0.66, 2.73, s * 6, 1.42, 0.13, PI * 1.28, terra);
    for (const s of [-1, 1]) for (const z of [3.6, 8.4]) { k.box(0.08, 3.6, 1.3, FX + 0.64, 8.1, s * z, stone); k.plane(0.9, 2.6, FX + 0.72, 7.9, s * z, pane[(z > 5 ? 1 : 0)], PI / 2); k.mesh(new T.CircleGeometry(0.45, 16), pane[(z > 5 ? 1 : 0)], FX + 0.72, 9.25, s * z).rotation.y = PI / 2; horseshoe(FX + 0.78, 9.25, s * z, 0.5, 0.07, PI * 1.3, terra); }
    k.block(FX - 0.6, FX + 0.6, -10, -7.2); k.block(FX - 0.6, FX + 0.6, -4.8, -1.7); k.block(FX - 0.6, FX + 0.6, 1.7, 4.8); k.block(FX - 0.6, FX + 0.6, 7.2, 10);
    const rose = (x: number, dir: 1 | -1, y: number) => {
      k.mesh(new T.CircleGeometry(3.5, 48), lead, x, y, 0).rotation.y = dir * PI / 2;
      k.torus(3.4, 0.28, x, y, 0, terra, 48).rotation.y = PI / 2;
      k.mesh(new T.CircleGeometry(0.8, 20), gold, x + dir * 0.03, y, 0).rotation.y = dir * PI / 2;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.mesh(new T.CircleGeometry(0.62, 12), pane[i % 5], x + dir * 0.03, y + Math.sin(a) * 2.3, Math.cos(a) * 2.3).rotation.y = dir * PI / 2; k.beam(v(x + dir * 0.02, y, 0), v(x + dir * 0.02, y + Math.sin(a) * 3.2, Math.cos(a) * 3.2), 0.05, terra, 5); }
      for (const t of [0, 1]) for (let i = 0; i < 3; i++) { const a0 = (i / 3) * PI * 2 + t * PI, a1 = ((i + 1) / 3) * PI * 2 + t * PI; k.beam(v(x + dir * 0.05, y + Math.sin(a0) * 2.9, Math.cos(a0) * 2.9), v(x + dir * 0.05, y + Math.sin(a1) * 2.9, Math.cos(a1) * 2.9), 0.05, gilt, 5); }
    };
    rose(FX - 0.74, -1, 13.5);
    rose(FX + 0.62, 1, 13.5);
    k.point(FX - 3, 13.5, 0, 0xffc890, 20, 12);
    k.point(FX + 4, 13.5, 0, 0xffc890, 30, 16);
    for (const s of [-1, 1]) { k.box(2.6, 22, 2.6, FX - 0.2, 11, s * 8.7, brick); k.box(2.8, 0.5, 2.8, FX - 0.2, 18.2, s * 8.7, stone); k.sphere(1.0, FX - 0.2, 22.6, s * 8.7, terra, 12); k.cyl(0.05, 1.6, FX - 0.2, 24.2, s * 8.7, brass, 0.02, 6); k.sphere(0.18, FX - 0.2, 25, s * 8.7, gold, 8); }
    const gable = new T.Shape(); gable.moveTo(-6.5, 0); gable.lineTo(6.5, 0); gable.lineTo(0, 3.2); gable.closePath();
    const gg = new T.ExtrudeGeometry(gable, { depth: 1.2, bevelEnabled: false }); gg.translate(0, 0, -0.6);
    k.mesh(gg, brick, FX, 18, 0).rotation.y = PI / 2;
    k.sign('K\'HAL ADATH JESHURUN  ·  1887', 6, 0.5, FX + 0.62, 6.3, 0, 'transparent', '#e8dcc0', 70, PI / 2);
    k.sign('MUSEUM AT ELDRIDGE STREET', 3.2, 0.42, FX + 0.62, 2.0, -8.6, '#1d2f5c', '#f4f0e8', 60, PI / 2);
    // the building shell and the sanctuary: floor, side walls, east wall, the vault of stars
    k.box(DEPTH + 1.2, 0.4, 21.2, FX - DEPTH / 2, 18.6, 0, brick);
    k.box(DEPTH - 1.2, 0.3, 20, (FX + EX) / 2, -0.15, 0, floorW);
    for (const s of [-1, 1]) { k.box(DEPTH - 0.6, 18.4, 1.2, (FX + EX) / 2, 9.2, s * 10.6, plaster); k.block(EX, FX, s * 10 - (s < 0 ? 1.2 : 0), s * 10 + (s > 0 ? 1.2 : 0)); }
    k.box(1.2, 18.4, 21.2, EX, 9.2, 0, plaster);
    k.block(EX - 0.6, EX + 0.6, -10.6, 10.6);
    const vault = k.mesh(new T.CylinderGeometry(10, 10, DEPTH - 1.2, 40, 1, true, 0, PI), stars, (FX + EX) / 2, 9, 0);
    vault.rotation.z = PI / 2;
    const vaultStars: T.InstancedMesh[] = [];
    { const star = new T.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2 - PI / 2, r = i % 2 ? 0.1 : 0.24; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); } star.closePath();
      const sg = new T.ShapeGeometry(star), mats: T.Matrix4[] = [], q = new T.Quaternion(), up = new T.Vector3(0, 0, 1), nrm = new T.Vector3(), rs = X.mulberry(462);
      for (let row = 0; row < 13; row++) for (let col = 0; col < 19; col++) { const th = ((row + 1) / 14) * PI + (rs() - 0.5) * 0.05, x = FX - 1.6 - col * 1.5 + (rs() - 0.5) * 0.4; nrm.set(0, -Math.sin(th), Math.cos(th)); q.setFromUnitVectors(up, nrm); const sc = 0.8 + rs() * 0.5; mats.push(new T.Matrix4().compose(v(x, 9 + Math.sin(th) * 9.9, -Math.cos(th) * 9.9), q, new T.Vector3(sc, sc, sc))); }
      vaultStars.push(k.instances(sg, new T.MeshBasicMaterial({ color: 0xffffff }), mats)); }
    for (let i = 0; i <= 8; i++) { const x = FX - 1.0 - i * (DEPTH - 2.0) / 8; k.curve(Array.from({ length: 25 }, (_, j) => { const t = (j / 24) * PI; return v(x, 9 + Math.sin(t) * 9.85, -Math.cos(t) * 9.85); }), 0.16, gilt, 24); }
    // the galleries: slender columns, the parapet fronts that carry the works, the horseshoe arcades above
    const GY = 4.6, cols = Array.from({ length: 8 }, (_, i) => FX - 3 - i * 3.75);
    for (const s of [-1, 1]) {
      k.box(DEPTH - 1.2, 0.3, 3.0, (FX + EX) / 2, GY, s * 8.5, walnut);
      k.box(DEPTH - 1.2, 0.05, 3.0, (FX + EX) / 2, GY - 0.17, s * 8.5, plaster);
      k.box(DEPTH - 1.2, 1.5, 0.35, (FX + EX) / 2, GY + 0.75, s * 7.0, ivory);
      k.moulding([[0, 0], [0.12, 0], [0.16, 0.06], [0.08, 0.12], [0, 0.16]], DEPTH - 1.2, (FX + EX) / 2, GY + 1.5, s * 7.0 - s * 0.17, gilt, s > 0 ? PI / 2 : -PI / 2);
      k.arcade(DEPTH - 1.2, 3.1, 0.25, 8, 2.9, 2.9, (FX + EX) / 2, GY + 1.5, s * 7.0, ivory, 0);
      for (const x of cols) { k.column(x, 0, s * 7.0, 9.0, 0.26, ivory, false, gilt); k.keepOut.push({ x, z: s * 7.0, r: 0.55 }); }
      for (let i = 0; i < 4; i++) k.point(FX - 5 - i * 7, GY + 2.2, s * 8.6, 0xffe0b8, 8, 7);
    }
    k.box(3, 0.3, 14, FX - 2.1, GY, 0, walnut);
    k.box(3, 0.05, 14, FX - 2.1, GY - 0.17, 0, plaster);
    k.box(0.12, 12.2, 20, FX - 0.65, 5.9 + 6.1, 0, plaster);
    k.box(0.35, 1.5, 14, FX - 3.6, GY + 0.75, 0, ivory);
    k.arcade(14, 3.1, 0.25, 4, 2.6, 2.9, FX - 3.6, GY + 1.5, 0, ivory, PI / 2);
    for (const z of [-3.5, 3.5]) { k.column(FX - 3.6, 0, z, GY, 0.26, ivory, false, gilt); k.keepOut.push({ x: FX - 3.6, z, r: 0.55 }); }
    for (const s of [-1, 1]) k.keepOut.push({ x: FX - 3.6, z: s * 7.0, r: 0.5 });
    k.sign('"VESTIBULE"', 2.6, 0.5, FX - 0.74, 5.2, 0, 'transparent', '#3a3430', 100, -PI / 2);
    k.censusWall({ x: FX - 0.76, y: 9.5, z: 0, rotY: -PI / 2, cols: 18, rows: 5, tile: 0.62, gap: 0.05, start: ctx.wallStart(3600, 90), pieces: ctx.all, backing: walnut });
    // the pews in two banks, the bimah, the ark under the round blue window
    for (let r = 0; r < 16; r++) for (const s of [-1, 1]) { const x = FX - 6 - r * 1.15, z = s * 3.95; k.box(0.5, 0.06, 5.0, x, 0.48, z, pew); k.box(0.08, 0.62, 5.0, x - 0.25, 0.8, z, pew); k.box(0.5, 0.45, 0.06, x, 0.24, z - 2.47, pew); k.box(0.5, 0.45, 0.06, x, 0.24, z + 2.47, pew); }
    k.block(FX - 23.6, FX - 5.5, -6.8, -1.1); k.block(FX - 23.6, FX - 5.5, 1.1, 6.8);
    const BX = EX + 3.6;
    k.cyl(1.8, 0.6, BX, 0.3, 0, walnut, 1.8, 8);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.cyl(0.03, 0.9, BX + Math.cos(a) * 1.6, 1.05, Math.sin(a) * 1.6, brass, 0.03, 6); }
    k.torus(1.6, 0.03, BX, 1.5, 0, brass, 24).rotation.x = PI / 2;
    k.box(1.2, 1.1, 0.8, BX, 1.15, 0, walnut);
    k.keepOut.push({ x: BX, z: 0, r: 2.1 });
    k.box(3, 0.5, 8, EX + 1.5, 0.25, 0, walnut);
    for (let i = 0; i < 3; i++) k.box(0.4, 0.5 - i * 0.16, 8, EX + 3 + 0.2 + i * 0.4, (0.5 - i * 0.16) / 2, 0, walnut);
    k.block(EX, EX + 3.2, -4.2, 4.2);
    k.box(1.4, 5.4, 4.2, EX + 1.3, 3.2, 0, walnut);
    for (const s of [-1, 1]) k.column(EX + 2.0, 0.5, s * 2.4, 5.6, 0.22, gilt);
    k.box(2.0, 0.5, 5.4, EX + 1.6, 6.15, 0, gilt);
    k.box(0.1, 1.4, 1.4, EX + 2.05, 4.0, 0, gilt);
    for (const s of [-1, 1]) k.box(0.1, 1.9, 1.1, EX + 2.05, 3.0, s * 0.8, k.pbr('eldVelvet', X.velvet(0x7a1f2b), 0.5, { roughness: 0.9 }));
    k.mesh(new T.CircleGeometry(3.2, 48), blueDeep, EX + 0.62, 12.5, 0).rotation.y = PI / 2;
    k.mesh(new T.CircleGeometry(2.4, 48), blue, EX + 0.66, 12.5, 0).rotation.y = PI / 2;
    k.torus(3.2, 0.24, EX + 0.62, 12.5, 0, gilt, 48).rotation.y = PI / 2;
    for (let i = 0; i < 48; i++) { const t = i * 2.4, r = Math.sqrt(i / 48) * 2.9; k.sphere(0.07 + (i % 3) * 0.02, EX + 0.72, 12.5 + Math.sin(t) * r, Math.cos(t) * r, gold, 6); }
    for (const t of [0, 1]) for (let i = 0; i < 3; i++) { const a0 = (i / 3) * PI * 2 + t * PI + PI / 6, a1 = ((i + 1) / 3) * PI * 2 + t * PI + PI / 6; k.beam(v(EX + 0.7, 12.5 + Math.sin(a0) * 2.7, Math.cos(a0) * 2.7), v(EX + 0.7, 12.5 + Math.sin(a1) * 2.7, Math.cos(a1) * 2.7), 0.04, gold, 5); }
    k.point(EX + 3, 12.5, 0, 0x6a8aff, 60, 26);
    k.point(EX + 3, 3.5, 0, 0xffd8a0, 16, 10);
    // brass chandeliers on chains, swaying, candles that flicker
    const chands: T.Group[] = [];
    const candleG = mergeGeometries(Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * PI * 2; const g = new T.CylinderGeometry(0.03, 0.03, 0.3, 6); g.translate(Math.cos(a) * 1.5, -9.85, Math.sin(a) * 1.5); return g; }));
    const flameG = mergeGeometries(Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * PI * 2; const g = new T.SphereGeometry(0.07, 6, 5); g.scale(1, 1.5, 1); g.translate(Math.cos(a) * 1.5, -9.6, Math.sin(a) * 1.5); return g; }));
    const flameM = new T.MeshBasicMaterial({ color: 0xffb060 });
    for (const x of [FX - 7, FX - 15, FX - 23]) {
      const g = new T.Group(); g.position.set(x, 17.5, 0);
      const chain = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 10, 6), iron); chain.position.y = -5; g.add(chain);
      const ring = new T.Mesh(new T.TorusGeometry(1.5, 0.08, 8, 40), brass); ring.rotation.x = PI / 2; ring.position.y = -10; g.add(ring);
      const ring2 = new T.Mesh(new T.TorusGeometry(0.9, 0.06, 8, 32), brass); ring2.rotation.x = PI / 2; ring2.position.y = -9.3; g.add(ring2);
      g.add(new T.Mesh(candleG, k.flat(0xf4e8d0, 0, 0.6)));
      g.add(new T.Mesh(flameG, flameM));
      const light = new T.PointLight(0xffc888, 30, 16, 2); light.position.y = -9.4; g.add(light);
      k.add(g); chands.push(g);
    }
    if (!ctx.reduced) k.ticks.push((t) => { chands.forEach((g, i) => { g.rotation.z = Math.sin(t * 0.6 + i * 1.9) * 0.035; g.rotation.x = Math.cos(t * 0.45 + i * 1.3) * 0.028; }); flameM.color.setHSL(0.08, 1, 0.62 + 0.1 * Math.sin(t * 9) * Math.sin(t * 6.3 + 1)); });
    k.point(FX - 12, 5, 0, 0xffd8a8, 14, 12);
    k.point(FX - 2, 3.6, 0, 0xffe0b8, 14, 9);
    // life on the street
    k.crowd([v(6.2, 0, -50), v(6.2, 0, 44), v(-6.2, 0, 44), v(-6.2, 0, -50)], 22, { seed: 66, speed: 0.9, spread: 1.8, animate: !ctx.reduced, closed: true });
    k.crowd([v(FX - 8, 0, 0), v(FX - 24, 0, 0)], 6, { seed: 67, speed: 0.25, spread: 1.4, animate: !ctx.reduced, colors: [0x24262c, 0x151517, 0x3a3a4a, 0x8a3a3a] });
    // stars of David: on the tower finials and carved into the wooden doors; the side doors closed, the centre one open
    const hexagram = (r: number) => mergeGeometries([0, PI].map((rot) => { const s = new T.Shape(), hole = new T.Path(); for (let i = 0; i < 3; i++) { const a = rot + (i / 3) * PI * 2 + PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); i ? hole.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62) : hole.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); } s.closePath(); hole.closePath(); s.holes.push(hole); return new T.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }); }));
    for (const s of [-1, 1]) { k.cyl(0.04, 0.8, FX - 0.2, 25.5, s * 8.7, brass, 0.04, 6); for (const ry of [PI / 2, 0]) k.mesh(hexagram(0.55), gold, FX - 0.2, 26.3, s * 8.7).rotation.y = ry; }
    for (const s of [-1, 1]) {
      const zc = s * 6;
      for (const o of [-0.6, 0.6]) { k.box(0.12, 2.72, 1.16, FX + 0.1, 1.36, zc + o, walnut); for (const y of [0.8, 1.95]) k.mesh(hexagram(0.3), gilt, FX + 0.17, y, zc + o).rotation.y = PI / 2; }
      k.mesh(new T.CircleGeometry(1.2, 20, 0, PI), pane[1], FX + 0.1, 2.73, zc).rotation.y = PI / 2;
      k.block(FX - 0.6, FX + 0.6, zc - 1.25, zc + 1.25);
    }
    for (const s of [-1, 1]) { const leaf = k.box(1.5, 3.1, 0.1, FX - 1.35, 1.55, s * 1.62, walnut); void leaf; for (const y of [0.9, 2.2]) k.mesh(hexagram(0.34), gilt, FX - 1.35, y, s * 1.56).rotation.y = s > 0 ? PI : 0; }
    // the iron fence between the building and the sidewalk
    for (const [z0, z1] of [[-10, -1.9], [1.9, 10]]) { k.rail(FX + 0.95, (z0 + z1) / 2, z1 - z0, iron, 1.0, 'z', 1.0); k.block(FX + 0.8, FX + 1.1, z0, z1); }
    // the floorboards, worn pale where people stood to pray in front of each pew
    const worn = k.flat(0x9c7c58, 0, 0.95);
    for (let r = 0; r < 16; r++) for (const s of [-1, 1]) k.plane(0.46, 4.3, FX - 6 - r * 1.15 + 0.56, 0.012, s * 3.95, worn, 0, -PI / 2);
    // afternoon light through the west rose window, dust turning in it; the painted stars catch the candles
    {
      const top = v(FX - 0.9, 13.5, 0), end = v(FX - 16, 0.2, 1.6), len = top.distanceTo(end);
      const beamM = new T.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      const beamG = new T.CylinderGeometry(3.0, 4.2, len, 24, 1, true); beamG.translate(0, -len / 2, 0);
      const beam = new T.Mesh(beamG, beamM);
      beam.position.copy(top);
      const aim = (dx: number, dz: number) => { const d = v(end.x + dx, end.y, end.z + dz).sub(top).normalize(); beam.quaternion.setFromUnitVectors(v(0, -1, 0), d); };
      aim(0, 0);
      k.add(beam);
      const sun = (h: number) => T.MathUtils.clamp((h - 11) / 3, 0, 1) * T.MathUtils.clamp((20 - h) / 2, 0, 1);
      const n = 160, pos = new Float32Array(n * 3), rs = X.mulberry(463), mote = Array.from({ length: n }, () => ({ u: rs(), a: rs() * 6.28, r: Math.sqrt(rs()), s: 0.004 + rs() * 0.01 }));
      const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
      const pm = new T.PointsMaterial({ color: 0xfff0c8, size: 0.07, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false });
      const motes = new T.Points(pg, pm); motes.frustumCulled = false;
      k.add(motes);
      const axis = end.clone().sub(top), side = v(0, 0, 1), up2 = axis.clone().cross(side).normalize();
      const placeMotes = (t: number) => { mote.forEach((m, i) => { m.u = (m.u + m.s * 0.02) % 1; const rr = (3.0 + 1.2 * m.u) * m.r * 0.8, a = m.a + t * 0.05; const p = top.clone().addScaledVector(axis, m.u).addScaledVector(side, Math.cos(a) * rr).addScaledVector(up2, Math.sin(a) * rr); pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; }); pg.attributes.position.needsUpdate = true; };
      placeMotes(0);
      const light = (t: number) => { const f = sun(k.o.hour + t / 3600) * (0.8 + 0.2 * Math.sin(t * 0.13) * Math.sin(t * 0.31 + 1)); beamM.opacity = 0.075 * f; pm.opacity = 0.75 * f; beam.visible = motes.visible = f > 0.01; };
      light(0);
      const sc = new T.Color(0xffd27a);
      vaultStars.forEach((m) => { for (let i = 0; i < m.count; i++) m.setColorAt(i, sc); if (m.instanceColor) m.instanceColor.needsUpdate = true; });
      const ph = Array.from({ length: vaultStars[0]?.count ?? 0 }, () => rs() * 6.28), c = new T.Color();
      if (!ctx.reduced) k.ticks.push((t) => {
        aim(Math.sin(t * 0.04) * 1.5, Math.cos(t * 0.05) * 1.2);
        light(t);
        placeMotes(t);
        vaultStars.forEach((m) => { for (let i = 0; i < m.count; i++) { const b = 0.72 + 0.28 * Math.sin(t * (0.8 + (i % 7) * 0.23) + ph[i]); m.setColorAt(i, c.setRGB(1 * b, 0.82 * b, 0.48 * b)); } if (m.instanceColor) m.instanceColor.needsUpdate = true; });
      });
    }
    // pigeons on the Eldridge Street sidewalks
    pigeons(k, ctx, [v(-6.4, 0, 16), v(6.4, 0, -12), v(-6.2, 0, -26), v(6.3, 0, 26)], 14, 464, 2.0);
    // landmark eggs
    const LPC = { name: 'NYC Landmarks Preservation Commission, LP-1107', url: 'https://s-media.nyc.gov/agencies/lpc/lp/1107.pdf' };
    k.egg(v(FX + 0.8, 13.5, 0), { id: 'rose-window', title: 'The Herter Brothers\' rose window', year: '1887', text: 'Peter and Francis William Herter built this front in 1886 and 1887. Heavy terra cotta cornices make the whole centre bay and its rose window read as one giant horseshoe arch, and stars of David fill the roundels.', clue: 'Look up at the wheel of glass crowning the front.', source: LPC }, { r: 3.2 });
    k.egg(v(FX + 0.8, 2.2, -6), { id: 'doors', title: 'Built by immigrants, 1887', year: '1887', text: 'Opened in 1887, this was the first synagogue in America purpose built by immigrants from Eastern Europe. Stars of David are carved into its wooden front doors.', clue: 'Before you go in, study the wooden doors.', source: { name: 'Museum at Eldridge Street', url: 'https://www.eldridgestreet.org/history/' } }, { r: 1.6 });
    k.egg(v(FX - 5.44, 0.35, 3.95), { id: 'floorboards', title: 'Grooves in the floorboards', text: 'The restoration kept the original pine floorboards rather than sanding them smooth. The worn grooves are the imprint of the people who stood and prayed here for decades.', clue: 'Look down in front of the pews, where the wood has gone pale.', source: { name: 'Museum at Eldridge Street, Architectural Restoration', url: 'https://www.eldridgestreet.org/restoration' } }, { r: 1.3 });
    k.egg(v(FX - 15, 7.6, 0), { id: 'chandeliers', title: 'Brass chandeliers, gas to electric', text: 'The brass chandeliers were made for gas flames. Early in the 1900s they were wired for electricity as the congregation modernised, and they still hang in the sanctuary today.', clue: 'Something overhead sways gently on a long chain.', source: { name: 'Museum at Eldridge Street, Architectural Restoration', url: 'https://www.eldridgestreet.org/restoration' } }, { r: 2.0 });
    k.egg(v(EX + 1.6, 3.6, 0), { id: 'ark', title: 'The ark on the east wall', text: 'The ark of carved Italian walnut stands on the east wall, the side closest to Jerusalem. Gold stars painted on dark blue walls carry the night sky across the sanctuary.', clue: 'Walk to the far end, where the congregation faces.', source: LPC }, { r: 2.0 });
    k.egg(v(EX + 0.9, 12.5, 0), { id: 'east-window', title: 'The window of stars', year: '2010', text: 'Artist Kiki Smith and architect Deborah Gans designed the round east window over the ark, installed in 2010: deep blue glass scattered with stars around a Star of David.', clue: 'Face the ark and raise your eyes to the blue.', source: { name: 'Museum at Eldridge Street, Architectural Restoration', url: 'https://www.eldridgestreet.org/restoration' } }, { r: 3.0 });
    // the works: the gallery fronts, gilt, and the side walls under the galleries
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) {
      for (const x of [-16.625, -20.375, -24.125, -27.875, -31.625]) mounts.push({ position: v(x, GY + 0.78, s * 6.78), rotation: s > 0 ? PI : 0, target: v(x, 3, 0), width: 3.0, height: 1.3, style: 'gilt', wash: false });
      mounts.push({ position: v(FX - 3.42, GY + 0.78, s * 3.4), rotation: -PI / 2, target: v(-15, 3, 0), width: 3.2, height: 1.3, style: 'gilt', wash: false });
      for (const x of [-14, -20, -26, -32]) mounts.push({ position: v(x, 3.15, s * 9.94), rotation: s > 0 ? PI : 0, target: v(x, 3, s * 8.4), width: 3.6, height: 2.0, style: 'gilt', wash: true });
    }
    return { mounts, spawn: v(6.2, 3, 7), look: v(FX, 9, 0), eye: 3, bounds: [EX + 1.2, 7.6, -44, 44], style: 'gilt' };
  },
};

/* ---------------- 125 THE CITY HALL ROTUNDA ---------------- */
export const cityhall: RoomDef = {
  id: 'cityhallrotunda',
  name: 'The public portrait',
  area: 'CITY HALL ROTUNDA',
  mood: 'Civic daylight',
  color: '#d4c4aa',
  description: 'City Hall Park and its fountain, the marble front under the cupola, then the rotunda: twin marble stairs sweeping up to a ring of ten Corinthian columns under a coffered dome, the Governor\'s Room through its door, the portraits of the city between the columns.',
  signatures: 'The 1812 Federal front in white marble with its arcade, colonnade and cupola, the circular rotunda with a coffered dome on ten columns, the self supporting curved twin stairs, the second floor gallery, the Governor\'s Room and its portrait collection, the park and its fountain.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x556546, fog: 0.0018, sun: { az: 2.2, el: 0.7, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x56564c, 0.95);
    k.sun(0xfff2dc, 2.4, 20, 80, 60, true, 110);
    const marble = k.pbr('chMarbleF', X.ashlar(0xe6e1d6, 491, 3), 0.25, { roughness: 0.5 }),
      inner = k.pbr('chMarbleIn', X.marble(0xece8e0, 0xc4beb4, 492), 0.7, { roughness: 0.45 }),
      innerB = k.pbr('chMarbleInB', X.marble(0xece8e0, 0xc4beb4, 492), 0.7, { roughness: 0.45, side: T.BackSide }),
      floorT = k.pbr('chFloorR', X.terrazzo(0xc8c0b0, 493), 0.4, { roughness: 0.3 }),
      floorD = k.pbr('chFloorD', X.marble(0x8a8680, 0x4a4640, 494), 0.5, { roughness: 0.3 }),
      dome = k.pbr('chDomeP', X.plaster(0xe8e2d4, 495), 0.5, { roughness: 0.85, side: T.DoubleSide }),
      slate = k.pbr('chRoof', X.ashlar(0x6a6e74, 496, 8), 0.4, { roughness: 0.8 }),
      lawn = k.pbr('chLawn', X.grass(0x4a7a3a, 497), 0.12),
      hex = k.pbr('chPath', X.pavers(0x9a968c, 498), 0.35),
      granite = k.pbr('chGranite', X.ashlar(0x8c8c88, 499, 3), 0.3),
      water = k.flat(0x3a6a78, 0.6, 0.15, { transparent: true, opacity: 0.9 }),
      bronze = k.flat(0x4a3a28, 0.8, 0.4),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      slat = k.pbr('benchW', X.planks(0x5d4939, 3, 32), 1.2),
      glass = k.glass(0xcfe0e8, 0.16, 0.06),
      warm = k.glow(0xffe4b8),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      velvet = k.pbr('chGovGreen', X.plaster(0x5f7a5c, 505), 0.5, { roughness: 0.85 }),
      jet = k.glow(0xdff4ff);
    const FZ = 0, TY = 2.4, CZ = -12, R = 9, GY = TY + 5.5;
    void FZ;
    // City Hall Park: lawn, paths, the fountain, trees, benches, Broadway and Park Row beyond, the Municipal Building behind
    k.box(160, 0.4, 140, 0, -0.2, 40, lawn);
    k.mesh(new T.CylinderGeometry(16, 16, 0.3, 64), hex, 0, 0.0, 32);
    k.box(8, 0.28, 60, 0, 0.0, 42, hex);
    for (const a of [PI / 4, -PI / 4]) { const p = k.box(4, 0.28, 90, 0, 0.0, 32, hex); p.rotation.y = a; }
    k.box(70, 0.28, 6, 0, 0.0, 9, hex);
    k.mesh(new T.CylinderGeometry(7, 7.4, 0.9, 48), granite, 0, 0.45, 32);
    k.mesh(new T.CylinderGeometry(6.4, 6.4, 0.9, 48), water, 0, 0.5, 32);
    k.lathe([[0, 0], [1.2, 0], [1.0, 0.6], [0.5, 1.8], [0.6, 2.2], [1.6, 2.4], [1.7, 2.6], [0.4, 2.8], [0.3, 3.8], [0, 3.9]], 0, 0.9, 32, granite, 24);
    const jets: T.Mesh[] = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; const j = k.mesh(new T.CylinderGeometry(0.05, 0.14, 3.6, 6), jet, Math.cos(a) * 1.7, 3.2, 32 + Math.sin(a) * 1.7, true); jets.push(j); }
    const jet0 = k.mesh(new T.CylinderGeometry(0.1, 0.28, 6, 8), jet, 0, 6.5, 32, true);
    if (!ctx.reduced) k.ticks.push((t) => { jets.forEach((j, i) => { j.scale.y = 0.7 + 0.3 * Math.sin(t * 2 + i); j.position.y = 2.6 + 1.8 * j.scale.y; }); jet0.scale.y = 0.8 + 0.2 * Math.sin(t * 1.3); jet0.position.y = 4.7 + 3 * jet0.scale.y; });
    k.keepOut.push({ x: 0, z: 32, r: 8 });
    const rnd = X.mulberry(500);
    for (let i = 0; i < 26; i++) { const x = -70 + rnd() * 140, z = 12 + rnd() * 90; if (Math.abs(x) < 10 && z < 64) continue; if (Math.hypot(x, z - 32) < 20) continue; if (Math.abs(x) < 6 && z > 40) continue; k.tree(x, 0, z, { kind: rnd() > 0.5 ? 'round' : 'column', h: 5 + rnd() * 4, r: 2.6 + rnd() * 2, leaf: 0x3f6b36, seed: i }); k.keepOut.push({ x, z, r: 0.7 }); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; if (Math.abs(Math.sin(a)) < 0.3) continue; parkBench(k, Math.cos(a) * 13, 32 + Math.sin(a) * 13, -a + PI / 2, slat, iron, 2.4); }
    for (const a of [0.5, 1.5, 2.6, 3.7, 4.7, 5.8]) k.lamp(Math.cos(a) * 18, 32 + Math.sin(a) * 18, 5.5, iron, 0xffe0b0, 22);
    k.prop('equestrian', -24, 0, 22, { height: 5.2, rotY: PI / 2, keepOut: 3.2 });
    k.prop('bronze_figure', 24, 0, 22, { height: 3.6, rotY: -PI / 2, keepOut: 2.4 });
    k.skyline({ z: 105, count: 22, spacing: 8, scale: 2.8, base: -1, seed: 501, lit: 0.22, glow: 0.4, tint: 0x6e7684, rows: 2 });
    k.box(28, 96, 28, 36, 47, -74, k.pbr('chMunicipal', X.windows(502, 0.3, 0x8a8680, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.6, stretch: 0.42 }));
    k.cyl(5, 8, 36, 99, -74, marble, 6, 16); k.cyl(2.2, 6, 36, 106, -74, marble, 3.6, 12); k.sphere(1.0, 36, 110, -74, k.flat(0xc9a44a, 0.8, 0.3), 10);
    k.box(40, 22, 30, -38, 11, -55, k.pbr('chTweed', X.ashlar(0xb8b0a0, 503, 3), 0.25));
    k.box(60, 0.3, 80, 0, -0.16, -60, hex);
    // the building: podium, wings with pilasters and windows, the central pavilion with its arcade, loggia and cupola, the steps
    k.box(70, TY, 28, 0, TY / 2, -10, marble);
    for (let i = 0; i < 8; i++) k.box(30, (i + 1) * 0.3, 1.0, 0, ((i + 1) * 0.3) / 2, FZ + 11.5 - i, marble);
    for (const s of [-1, 1]) { k.box(1.0, TY + 0.4, 9.6, s * 15.5, (TY + 0.4) / 2, FZ + 8.2, marble); k.block(s * 15 - (s < 0 ? 1 : 0), s * 15 + (s > 0 ? 1 : 0), FZ + 3.4, FZ + 13); }
    for (const s of [-1, 1]) {
      k.box(22, 15, 24, s * 24, TY + 7.5, -12, marble);
      k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0.3, 1.0], [0, 1.1]], 22.2, s * 24, TY + 14.2, FZ + 0.05, marble, -PI / 2);
      for (let i = 0; i < 5; i++) k.box(1.1, 13, 0.4, s * (15 + i * 4.5), TY + 7, FZ + 0.2, marble);
      for (let i = 0; i < 4; i++) {
        const x = s * (17.25 + i * 4.5);
        k.arch(2.4, 4.6, 0.3, x, TY + 0.6, FZ + 0.1, marble, false, 0.72);
        k.box(2.3, 4.2, 0.1, x, TY + 2.9, FZ + 0.05, i % 2 ? warm : glass); k.box(2.3, 4.2, 0.1, x, TY + 2.9, FZ - 0.06, dark);
        k.box(2.8, 3.6, 0.3, x, TY + 9.5, FZ + 0.1, marble);
        k.box(2.3, 3.1, 0.1, x, TY + 9.5, FZ + 0.16, i % 2 ? glass : warm); k.box(2.3, 3.1, 0.1, x, TY + 9.5, FZ + 0.04, dark);
      }
      k.rail(s * 24, FZ - 0.4, 22, marble, 1.1, 'x', 1.1);
      k.block(s * 13, s * 46, -24, FZ + 0.4);
      k.box(1.0, 1.4, 3.0, s * 14.6, TY + 0.7, FZ + 3.2, marble);
    }
    k.box(26, 17, 27, 0, TY + 8.5, -10.5, marble);
    k.moulding([[0, 0], [1.0, 0], [1.1, 0.3], [0.7, 0.5], [0.9, 0.8], [0.3, 1.0], [0, 1.2]], 26.2, 0, TY + 16.2, FZ + 3.05, marble, -PI / 2);
    for (const x of [-9.6, -4.8, 0, 4.8, 9.6]) { k.arch(3.2, 5, 1.2, x, TY, FZ + 3, marble, false, 0.75); if (x !== 0) { k.box(2.8, 4.4, 0.1, x, TY + 2.6, FZ + 3.1, glass); k.box(2.8, 4.4, 0.1, x, TY + 2.6, FZ + 2.98, dark); } }
    k.block(-13, -1.6, FZ + 2.4, FZ + 3.6); k.block(1.6, 13, FZ + 2.4, FZ + 3.6);
    k.box(26, 1.4, 1.2, 0, TY + 6.4, FZ + 3, marble);
    for (const x of [-12, -7.2, -2.4, 2.4, 7.2, 12]) { k.column(x, TY + 7, FZ + 3.7, 6.2, 0.5, marble, true); k.prop('corinthian_capital', x, TY + 13.2, FZ + 3.7, { height: 0.9 }); }
    for (const x of [-9.6, -4.8, 0, 4.8, 9.6]) { k.box(2.4, 3.4, 0.1, x, TY + 9.8, FZ + 3.06, x ? glass : warm); k.box(2.4, 3.4, 0.1, x, TY + 9.8, FZ + 2.96, dark); }
    k.box(26, 1.6, 2.6, 0, TY + 14.9, FZ + 3.2, marble);
    k.rail(0, FZ + 2.6, 26, marble, 1.1, 'x', 1.1);
    k.box(26, 3, 28, 0, TY + 18.4, -10.5, slate);
    k.cyl(4.6, 4, 0, TY + 21.9, CZ, marble, 4.6, 32);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.column(Math.cos(a) * 4.0, TY + 23.9, CZ + Math.sin(a) * 4.0, 4.8, 0.3, marble); }
    k.mesh(new T.CylinderGeometry(3.4, 3.4, 4.8, 24, 1, true), glass, 0, TY + 26.3, CZ);
    k.cyl(4.6, 0.8, 0, TY + 29.1, CZ, marble, 4.4, 32);
    k.mesh(new T.SphereGeometry(4.4, 24, 12, 0, PI * 2, 0, PI / 2), k.flat(0xd8d2c4, 0, 0.7), 0, TY + 29.5, CZ);
    k.cyl(1.2, 2.4, 0, TY + 35, CZ, marble, 1.4, 12);
    // Justice on the cupola: no blindfold, the scale raised in her left hand, the sword in her right
    const justiceM = k.flat(0xd9d3c4, 0.2, 0.55);
    const J = figure(k, 0, TY + 36.2, CZ, 3.6, justiceM, 0, [[0.6, 3.3, 0.35], [-0.55, 1.5, 0.35]]);
    k.beam(J.at(-0.55, 1.55, 0.35), J.at(-0.62, 0.25, 0.55), 0.035 * J.s, justiceM, 5);
    k.beam(J.at(-0.8, 1.35, 0.38), J.at(-0.3, 1.35, 0.38), 0.03 * J.s, justiceM, 5);
    const scaleG = new T.Group(); scaleG.position.copy(J.at(0.6, 3.42, 0.35));
    { const s = J.s, parts: T.BufferGeometry[] = [new T.BoxGeometry(1.1 * s, 0.05 * s, 0.05 * s)]; for (const sx of [-1, 1]) { for (const o of [-0.08, 0.08]) parts.push(new T.CylinderGeometry(0.008 * s, 0.008 * s, 0.55 * s, 4).translate(sx * 0.52 * s + o * s, -0.28 * s, 0)); parts.push(new T.CylinderGeometry(0.2 * s, 0.12 * s, 0.06 * s, 12).translate(sx * 0.52 * s, -0.56 * s, 0)); } scaleG.add(new T.Mesh(mergeGeometries(parts), justiceM)); }
    k.add(scaleG);
    if (!ctx.reduced) k.ticks.push((t) => { scaleG.rotation.z = Math.sin(t * 0.7) * 0.07; });
    k.point(0, TY + 12, FZ + 5, 0xfff0d8, 30, 18);
    k.sign('CITY HALL  ·  1812  ·  MANGIN AND McCOMB', 10, 0.7, 0, TY + 6.4, FZ + 3.62, 'transparent', '#5a544a', 80, 0);
    flagpole(k, ctx, -21, 0, FZ + 8, 12, US_FLAG, 3.4);
    flagpole(k, ctx, 21, 0, FZ + 8, 12, NYC_FLAG, 3.4);
    // inside: the vestibule, then the rotunda: floor, wall, twin stairs, gallery and its parapet, the ten columns, the dome
    k.box(6, 0.3, 6.5, 0, TY - 0.15, FZ, floorD);
    for (const s of [-1, 1]) { k.box(1.2, 8, 6.6, s * 3.6, TY + 4, FZ - 0.3, inner); k.block(s * 3 - (s < 0 ? 1.2 : 0), s * 3 + (s > 0 ? 1.2 : 0), FZ - 3.6, FZ + 2.4); }
    k.box(7.2, 0.4, 6.6, 0, TY + 8.2, FZ - 0.3, inner);
    k.arch(3.4, 5.6, 1.0, 0, TY, CZ + R, inner, false, 0.62);
    k.sign('"ROTUNDA"', 2.4, 0.5, 0, TY + 7.0, CZ + R + 0.52, 'transparent', '#3a3430', 100, 0);
    k.mesh(new T.CylinderGeometry(R + 0.6, R + 0.6, 0.3, 64), floorT, 0, TY - 0.15, CZ);
    k.mesh(new T.RingGeometry(0.6, 3.2, 48), floorD, 0, TY + 0.012, CZ).rotation.x = -PI / 2;
    k.mesh(new T.CylinderGeometry(R, R, GY + 7.8 - TY, 64, 1, true), innerB, 0, (TY + GY + 7.8) / 2, CZ);
    for (let i = 0; i < 90; i++) { const a = (i / 90) * PI * 2; if (Math.abs(a) < 0.22 || Math.abs(a - PI * 2) < 0.22) continue; const x = Math.sin(a) * (R + 0.3), z = CZ + Math.cos(a) * (R + 0.3); k.block(x - 0.4, x + 0.4, z - 0.4, z + 0.4); }
    const ring = k.mesh(new T.RingGeometry(6.8, R + 0.2, 64), inner, 0, GY - 0.02, CZ); ring.rotation.x = -PI / 2;
    const ringB = k.mesh(new T.RingGeometry(6.8, R + 0.2, 64), innerB, 0, GY - 0.3, CZ); ringB.rotation.x = -PI / 2;
    k.mesh(new T.CylinderGeometry(6.8, 6.8, 0.3, 64, 1, true), inner, 0, GY - 0.15, CZ);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2 + PI / 10;
      const px = Math.sin(a) * 6.62, pz = CZ + Math.cos(a) * 6.62;
      const b = k.box(4.0, 1.1, 0.34, 0, 0, 0, inner); b.position.set(px, GY + 0.55, pz); b.rotation.y = a;
      const c = k.box(4.0, 0.12, 0.44, 0, 0, 0, bronze); c.position.set(px, GY + 1.14, pz); c.rotation.y = a;
      const cx = Math.sin(a) * 7.7, cz = CZ + Math.cos(a) * 7.7;
      k.column(cx, GY, cz, 5.8, 0.42, inner, true);
      k.prop('corinthian_capital', cx, GY + 5.8, cz, { height: 0.9 });
      k.keepOut.push({ x: cx, z: cz, r: 0.75 });
    }
    for (let i = 0; i < 40; i++) { const a = -0.85 + (i / 39) * 1.7; const x = Math.sin(a) * 6.75, z = CZ + Math.cos(a) * 6.75; k.block(x - 0.3, x + 0.3, z - 0.3, z + 0.3); }
    k.mesh(new T.CylinderGeometry(8.6, 8.6, 1.3, 64, 1, true), inner, 0, GY + 7.35, CZ);
    k.mesh(new T.CylinderGeometry(8.6, 8.6, 1.3, 64, 1, true), innerB, 0, GY + 7.35, CZ);
    const cornice = k.mesh(new T.RingGeometry(7.4, R + 0.2, 64), dome, 0, GY + 8.0, CZ); cornice.rotation.x = PI / 2;
    k.prop('coffered_dome', 0, GY + 8.0, CZ, { height: 7.6 });
    k.mesh(new T.CircleGeometry(2.2, 32), k.glow(0xfff4e0, 0.8), 0, GY + 15.3, CZ).rotation.x = PI / 2;
    const orbit = k.point(0, GY + 9.5, CZ, 0xfff4e6, 45, 34);
    k.point(0, TY + 4, CZ, 0xfff0dc, 24, 16);
    if (!ctx.reduced) k.ticks.push((t) => { orbit.position.set(Math.sin(t * 0.25) * 4, GY + 9.5, CZ + Math.cos(t * 0.25) * 4); });
    // the twin stairs: treads cantilevered from the wall, marble stringers, bronze rails with balusters
    for (const s of [-1, 1]) {
      const pts: T.Vector3[] = [], ptsI: T.Vector3[] = [];
      for (let i = 0; i <= 25; i++) {
        const a = s * (140 - i * 3.6) * (PI / 180), y = TY + (5.5 * i) / 25;
        const px = Math.sin(a) * 8.0, pz = CZ + Math.cos(a) * 8.0;
        if (i < 25) { const tr = k.box(2.0, 0.3, 0.62, 0, 0, 0, inner); tr.position.set(px, y + 0.15, pz); tr.rotation.y = PI / 2 - a; }
        pts.push(v(Math.sin(a) * 8.95, y - 0.35, CZ + Math.cos(a) * 8.95));
        ptsI.push(v(Math.sin(a) * 7.05, y - 0.35, CZ + Math.cos(a) * 7.05));
        k.beam(v(Math.sin(a) * 7.1, y + 0.25, CZ + Math.cos(a) * 7.1), v(Math.sin(a) * 7.1, y + 1.2, CZ + Math.cos(a) * 7.1), 0.02, bronze, 5);
      }
      k.curve(pts, 0.22, inner, 40);
      k.curve(ptsI, 0.3, inner, 40);
      k.curve(ptsI.map((p) => v(p.x + Math.sign(p.x) * 0.05, p.y + 1.55, p.z)), 0.045, bronze, 40);
      for (let i = 0; i < 26; i++) { const a = s * (141 - i * 3.6) * (PI / 180); const x = Math.sin(a) * 6.9, z = CZ + Math.cos(a) * 6.9; k.block(x - 0.25, x + 0.25, z - 0.25, z + 0.25); }
    }
    // the Governor's Room glimpsed through a barred door off the gallery: a red walled room of portraits
    const GA = PI / 5, GR = R + 3.0, gsx = Math.sin(GA), gcx = Math.cos(GA);
    const gAt = (rad: number, side: number) => [Math.sin(GA) * rad + Math.cos(GA) * side, CZ + Math.cos(GA) * rad - Math.sin(GA) * side] as const;
    const gBox = (w: number, h: number, d: number, rad: number, side: number, y: number, m: T.Material) => { const [x, z] = gAt(rad, side); const o = k.box(w, h, d, x, y, z, m); o.rotation.y = GA; return o; };
    gBox(8, 0.3, 5.6, GR, 0, GY - 0.15, floorD);
    gBox(0.4, 5, 5.6, GR, 4, GY + 2.5, velvet); gBox(0.4, 5, 5.6, GR, -4, GY + 2.5, velvet);
    gBox(8.4, 5, 0.4, GR + 2.6, 0, GY + 2.5, velvet);
    for (const sd of [-2.7, 2.7]) gBox(2.6, 5, 0.4, GR - 2.6, sd, GY + 2.5, velvet);
    gBox(3.2, 1.2, 0.4, GR - 2.6, 0, GY + 4.4, velvet);
    gBox(8.4, 0.4, 5.8, GR, 0, GY + 5.2, inner);
    const gd = k.arch(2.4, 4.0, 1.4, 0, 0, 0, inner, false, 0.65); const [gdx, gdz] = gAt(R, 0); gd.position.set(gdx, GY, gdz); gd.rotation.y = GA;
    const [glx, glz] = gAt(GR, 0); k.point(glx, GY + 4, glz, 0xffe0b8, 30, 10); const [glx2, glz2] = gAt(GR + 1.6, 0); k.point(glx2, GY + 2.6, glz2, 0xffe8c8, 16, 7);
    for (const sd of [-0.9, 0.9]) { const [sx, sz] = gAt(R - 1.0, sd); k.prop('rope_stanchion', sx, GY, sz, { height: 1.0 }); }
    void gsx; void gcx;
    const [gsg, gszg] = gAt(R - 0.55, 0); k.sign('THE GOVERNOR\'S ROOM', 2.2, 0.36, gsg, GY + 4.4, gszg, 'transparent', '#3a3430', 70, GA + PI);
    k.censusWall({ x: 0, y: TY + 3.6, z: CZ - 8.45, rotY: 0, cols: 14, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(600, 56), pieces: ctx.all, backing: dark });
    k.box(9.2, 3.2, 0.3, 0, TY + 3.6, CZ - 8.62, dark);
    for (const x of [-5.6, 5.6]) k.prop('museum_bench', x, TY, CZ, { height: 0.58, rotY: 0, keepOut: 1.2 });
    // the Governor's Room: a desk Washington used, and a full length portrait on the side wall
    const walnutM = k.pbr('chWalnut', X.planks(0x4a2e1a, 3, 507, 0.2), 1.6, { roughness: 0.45 }), giltF = k.flat(0xc9a44a, 0.8, 0.3);
    gBox(0.9, 0.08, 1.9, GR + 1.3, 0, GY + 0.92, walnutM);
    gBox(0.8, 0.8, 1.8, GR + 1.3, 0, GY + 0.46, walnutM);
    gBox(0.6, 0.35, 1.2, GR + 1.55, 0, GY + 1.14, walnutM);
    gBox(0.08, 3.1, 1.9, GR + 0.4, 3.76, GY + 2.6, giltF);
    const portrait = canvasMat(256, 448, (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#5a4a3a'); bg.addColorStop(1, '#2a2018'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = '#7a8aa0'; g.fillRect(0, 0, w, h * 0.45); g.fillStyle = '#4a4030'; g.fillRect(0, h * 0.8, w, h * 0.2);
      g.fillStyle = '#1c2438'; g.beginPath(); g.moveTo(w * 0.36, h * 0.86); g.lineTo(w * 0.4, h * 0.3); g.lineTo(w * 0.6, h * 0.3); g.lineTo(w * 0.66, h * 0.86); g.fill();
      g.fillStyle = '#e8dcc0'; g.fillRect(w * 0.42, h * 0.66, w * 0.07, h * 0.2); g.fillRect(w * 0.53, h * 0.66, w * 0.07, h * 0.2);
      g.fillStyle = '#e0c0a0'; g.beginPath(); g.arc(w * 0.5, h * 0.24, w * 0.07, 0, PI * 2); g.fill();
      g.fillStyle = '#e8e4dc'; g.beginPath(); g.arc(w * 0.5, h * 0.2, w * 0.075, PI, 0); g.fill();
      g.strokeStyle = '#c9a44a'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    });
    { const [px, pz] = gAt(GR + 0.4, 3.7); k.plane(1.7, 2.9, px, GY + 2.6, pz, portrait, GA - PI / 2); }
    // the Mould fountain's gas candelabra, flickering
    const gasM = new T.MeshBasicMaterial({ color: 0xffd490 });
    for (const a of [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4]) {
      const x = Math.cos(a) * 8.6, z = 32 + Math.sin(a) * 8.6;
      k.lathe([[0.3, 0], [0.3, 0.3], [0.14, 0.5], [0.1, 3.2], [0.18, 3.4], [0, 3.45]], x, 0.15, z, bronze, 10);
      for (let j = 0; j < 4; j++) { const b = (j / 4) * PI * 2 + a; k.beam(v(x, 3.35, z), v(x + Math.cos(b) * 0.6, 3.7, z + Math.sin(b) * 0.6), 0.04, bronze, 5); k.sphere(0.2, x + Math.cos(b) * 0.6, 3.92, z + Math.sin(b) * 0.6, gasM, 8); }
      k.sphere(0.24, x, 3.8, z, gasM, 8);
      k.keepOut.push({ x, z, r: 0.5 });
    }
    if (!ctx.reduced) k.ticks.push((t) => { gasM.color.setHSL(0.1, 1, 0.72 + 0.06 * Math.sin(t * 11) * Math.sin(t * 7.3 + 2)); });
    // Civic Fame on the Municipal Building, gilded, barefoot on her sphere, the five pointed crown held up
    const gildM = k.pbr('chGilt', X.gilt(0xd8b050), 1, { metalness: 0.85, roughness: 0.3 });
    const CF = figure(k, 36, 110.9, -74, 6, gildM, 0, [[0.75, 3.5, 0.3], [-0.6, 1.7, 0.3]]);
    { const c = CF.at(0.75, 3.75, 0.3); k.torus(0.32 * CF.s, 0.05 * CF.s, c.x, c.y, c.z, gildM, 16).rotation.x = PI / 2; for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2; k.mesh(new T.ConeGeometry(0.06 * CF.s, 0.3 * CF.s, 5), gildM, c.x + Math.cos(a) * 0.32 * CF.s, c.y + 0.15 * CF.s, c.z + Math.sin(a) * 0.32 * CF.s); } }
    // Broadway along the west side of the park, and Cass Gilbert's Woolworth Building on it
    k.box(14, 0.3, 190, -88, -0.14, 20, k.pbr('asphaltS', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }));
    {
      const terra = k.pbr('woolTerra', X.windows(506, 0.28, 0xd8ceb4, true), 0.14, { emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.6, stretch: 0.42 }),
        pier = k.flat(0xe2d6bc, 0, 0.7), roof = k.pbr('woolRoof', X.patina(0x6a9a8a), 0.3, { roughness: 0.6, metalness: 0.2 });
      const WX = -114, WZ = -8, TXW = -107;
      k.box(34, 72, 30, WX, 35, WZ, terra);
      for (let i = 0; i < 9; i++) k.box(0.7, 72, 0.7, -96.8, 35, WZ - 13 + i * 3.25, pier);
      k.box(35, 1.4, 31, WX, 71.2, WZ, pier);
      k.box(20, 56, 20, TXW, 99, WZ, terra);
      for (let i = 0; i < 6; i++) { k.box(0.6, 56, 0.6, TXW + 10.2, 99, WZ - 7.5 + i * 3, pier); k.box(0.6, 56, 0.6, TXW - 7.5 + i * 3, 99, WZ + 10.2, pier); }
      k.box(15, 12, 15, TXW, 133, WZ, terra);
      for (const [y, hw] of [[127, 10], [139, 7.5]] as const) for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.mesh(new T.ConeGeometry(0.9, 5, 6), pier, TXW + sx * hw, y + 2.5, WZ + sz * hw);
      const crown = k.mesh(new T.ConeGeometry(10.6, 12, 4), roof, TXW, 145, WZ); crown.rotation.y = PI / 4;
      k.cyl(1.6, 3, TXW, 152.5, WZ, pier, 1.2, 8); k.mesh(new T.ConeGeometry(1.2, 4, 8), roof, TXW, 156, WZ);
    }
    // Broadway runs one way downtown; pigeons in the park, and a flock over it
    traffic(k, ctx, [-91, -87.5, -84].map((x) => ({ a: v(x, 0, -70), b: v(x, 0, 110), n: 5 })), 8.5, 508);
    pigeons(k, ctx, [v(-10, 0.15, 24), v(9, 0.15, 40), v(-12, 0.15, 38), v(4, 0.15, 20), v(0, 0.15, 50), v(-6, 0.15, 45)], 22, 509, 2.4);
    gulls(k, ctx, Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * PI * 2; return v(Math.cos(a) * 24, 16 + (i % 3) * 2, 40 + Math.sin(a) * 18); }), 14, 510, 0x7c808a, 0.45);
    // landmark eggs
    k.egg(v(0, TY + 38, CZ), { id: 'justice', title: 'Justice without a blindfold', text: 'Justice on the cupola is sheet copper over a steel frame, and she wears no blindfold: the scale is in her left hand, the sword in her right. She is the building\'s third Justice, after two wooden figures lost to fire and decay.', clue: 'Look to the very top of the cupola.', source: { name: 'Untapped New York, rooftop statues', url: 'https://www.untappedcities.com/rooftop-statues-new-york-city/' } }, { r: 2.4 });
    k.egg(v(-7.2, TY + 3.2, FZ + 3.9), { id: 'marble-front', title: 'Marble in front, brownstone behind', year: '1812', text: 'The front was first built of Massachusetts marble from Alford, with brownstone on the rear. Pollution and pigeons wore it down, and from 1954 to 1956 the building was reclad in Alabama limestone above a Missouri granite base.', clue: 'Run a hand along the arcade on the front and ask what it is made of.', source: { name: 'Wikipedia, New York City Hall', url: 'https://en.wikipedia.org/wiki/New_York_City_Hall' } }, { r: 1.8 });
    k.egg(v(Math.sin(0.87) * 8, GY + 0.9, CZ + Math.cos(0.87) * 8), { id: 'lincoln', title: 'Lincoln under the dome', year: '1865', text: 'When Abraham Lincoln lay in state here in April 1865, his coffin rested on the stair landing beneath this dome. Ulysses S. Grant would also lie in state under the rotunda.', clue: 'Climb the curving stair to the landing where both flights arrive.', source: { name: 'Wikipedia, New York City Hall', url: 'https://en.wikipedia.org/wiki/New_York_City_Hall' } }, { r: 1.6 });
    { const [gx, gz] = gAt(GR + 1.3, 0); k.egg(v(gx, GY + 1.5, gz), { id: 'governors-room', title: 'The Governor\'s Room', year: '1815 to 1816', text: 'Since 1815 and 1816 this has been a reception hall and a museum of the city\'s portraits, John Trumbull among the painters. The desk here was used by George Washington and brought to City Hall in 1844.', clue: 'From the gallery, peer through the barred door at a room of portraits.', source: { name: 'NYC Public Design Commission, Governor\'s Room', url: 'https://www.nyc.gov/site/designcommission/archive/city-hall/governors-room.page' } }, { r: 1.8 }); }
    k.egg(v(0, 3.0, 32), { id: 'mould-fountain', title: 'The fountain that came home', year: '1871', text: 'Jacob Wrey Mould, later chief architect of the Parks Department, designed this fountain in 1871. It was moved to Crotona Park in the Bronx in 1920, and came back for the park\'s reopening in 2000 with its gas lamps made new.', clue: 'Follow the paths to the water at the heart of the park.', source: { name: 'EverGreene, Jacob Wrey Mould Fountain', url: 'https://evergreene.com/projects/jacob-wrey-mould-fountain-city-hall-park/' } }, { r: 3.0 });
    k.egg(v(36, 114, -74), { id: 'civic-fame', title: 'Civic Fame and her crown', text: 'Adolph Weinman\'s Civic Fame, gilded copper, stands barefoot on a sphere atop the Municipal Building, built 1909 to 1914. The five pointed crown in her hand stands for the five boroughs.', clue: 'Behind City Hall, the tallest tower wears something gold.', source: { name: 'NYC DCAS, David N. Dinkins Municipal Building', url: 'https://www.nyc.gov/site/dcas/business/dcasmanagedbuildings/david-n-dinkins-manhattan-municipal-building.page' } }, { r: 5 });
    k.egg(v(-107, 112, -8), { id: 'woolworth', title: 'The cathedral of commerce', year: '1913', room: 'woolworth', text: 'Across Broadway rises Cass Gilbert\'s Woolworth Building, completed in 1913. At 792 feet it was hailed as the cathedral of commerce and stayed the tallest building in the world until 1930.', clue: 'Turn west toward Broadway and look for the tallest crown.', source: { name: 'New York Landmarks Conservancy', url: 'https://nylandmarks.org/explore-ny/the-woolworth-building/' } }, { r: 14 });
    // life: the park, the stairs
    k.crowd([v(-24, 0, 60), v(-14, 0, 40), v(-6, 0, 22), v(6, 0, 22), v(14, 0, 40), v(24, 0, 60)], 30, { seed: 68, speed: 0.6, spread: 3, animate: !ctx.reduced });
    const stairRoute: T.Vector3[] = [v(0, TY, FZ + 1), v(0, TY, CZ + 5)];
    for (let i = 0; i <= 6; i++) { const a = (140 - i * 15) * (PI / 180); stairRoute.push(v(Math.sin(a) * 8, TY + (5.5 * i) / 6, CZ + Math.cos(a) * 8)); }
    for (let i = 1; i <= 4; i++) { const a = (50 - i * 25) * (PI / 180); stairRoute.push(v(Math.sin(a) * 8, GY, CZ + Math.cos(a) * 8)); }
    for (let i = 1; i <= 6; i++) { const a = -(50 + i * 15) * (PI / 180); stairRoute.push(v(Math.sin(a) * 8, GY - (5.5 * i) / 6, CZ + Math.cos(a) * 8)); }
    stairRoute.push(v(-4, TY, CZ + 2));
    k.crowd(stairRoute, 14, { seed: 69, speed: 0.32, spread: 0.7, animate: !ctx.reduced, closed: true, colors: [0x24262c, 0x151517, 0x3a3a4a, 0x8a3a3a, 0xd8d0c0] });
    // the works: the parapet between the columns, the gallery wall, the Governor's Room, the ground floor north wall, the vestibule
    const mounts: Mount[] = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2 + PI / 10; mounts.push({ position: v(Math.sin(a) * 6.42, GY + 0.55, CZ + Math.cos(a) * 6.42), rotation: a + PI, target: v(Math.sin(a) * 3, TY + 3, CZ + Math.cos(a) * 3), width: 3.0, height: 0.9, style: 'gilt', wash: false }); }
    for (const a of [-0.56, 0.56]) { const bk = k.box(4.2, 3.0, 0.24, 0, 0, 0, inner); bk.position.set(Math.sin(a) * 8.86, GY + 3.4, CZ + Math.cos(a) * 8.86); bk.rotation.y = a; mounts.push({ position: v(Math.sin(a) * 8.7, GY + 3.4, CZ + Math.cos(a) * 8.7), rotation: a + PI, target: v(Math.sin(a) * 7.8, GY + 3, CZ + Math.cos(a) * 7.8), width: 3.2, height: 2.2, style: 'gilt', wash: true }); }
    for (const sd of [-1.3, 1.3]) { const [px, pz] = gAt(GR + 2.38, sd), [tx, tz] = gAt(R - 1.4, 0); mounts.push({ position: v(px, GY + 3.2, pz), rotation: GA + PI, target: v(tx, GY + 3, tz), width: 2.2, height: 1.6, style: 'gilt', wash: true }); }
    for (const a of [2.55, 3.73]) { const bk = k.box(4.4, 3.0, 0.24, 0, 0, 0, inner); bk.position.set(Math.sin(a) * 8.86, TY + 3.5, CZ + Math.cos(a) * 8.86); bk.rotation.y = a; mounts.push({ position: v(Math.sin(a) * 8.7, TY + 3.5, CZ + Math.cos(a) * 8.7), rotation: a + PI, target: v(Math.sin(a) * 5.5, TY + 3, CZ + Math.cos(a) * 5.5), width: 3.4, height: 2.2, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 2.95, TY + 3.4, FZ - 0.4), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, TY + 3, FZ - 0.4), width: 3.2, height: 2.2, style: 'gilt', wash: true });
    const deg = 180 / PI;
    return {
      mounts, spawn: v(-13, 3, FZ + 47), look: v(1, 13, FZ), eye: 3, bounds: [-40, 40, CZ - R + 0.6, FZ + 62], style: 'gilt',
      floorY: (x, z) => {
        if (z > FZ + 12) return 0;
        if (z > FZ + 4) return Math.abs(x) < 15 ? (TY * (FZ + 12 - z)) / 8 : 0;
        if (z > FZ + 2.4) return Math.abs(x) < 35 ? TY : 0;
        const r = Math.hypot(x, z - CZ), a = Math.abs(Math.atan2(x, z - CZ)) * deg;
        if (r >= 7.0 && r <= R + 0.3) {
          if (a >= 50 && a <= 140) return TY + (5.5 * (140 - a)) / 90;
          if (a < 50) return GY;
        }
        return TY;
      },
    };
  },
};

/* ---------------- 126 CASTLE CLINTON AT THE BATTERY ---------------- */
export const castle: RoomDef = {
  id: 'castleclinton',
  name: 'Arrivals in the round',
  area: 'CASTLE CLINTON / THE BATTERY',
  mood: 'Harbor morning',
  color: '#be9775',
  description: 'The Battery promenade, the harbor with the Statue on the horizon, gulls, a ferry passing, then the round brownstone fort: an open court under a flag, cannon at the embrasures, the ticket booth, the works set into the gun ports around the ring.',
  signatures: 'The circular 1811 sandstone battery with its deep embrasures and arched gate, the open courtyard, the flagpole, the Battery lawn and benches, the seawall promenade, Liberty and the harbor beyond.',
  build(k, ctx) {
    k.sky({ top: 0x5f94d0, horizon: 0xe6eef0, ground: 0x4a5a5c, fog: 0.0016, sun: { az: 2.4, el: 0.55, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xeaf2ff, 0x3a4a48, 0.95);
    k.sun(0xfff0dc, 2.4, 60, 70, 40, true, 120);
    const brown = k.pbr('ccBrownstone', X.ashlar(0x8a6a52, 511, 3), 0.28, { roughness: 0.85 }),
      brownIn = k.pbr('ccBrownIn', X.ashlar(0x7a5c46, 512, 3), 0.28, { roughness: 0.85 }),
      gravel = k.pbr('ccCourt', X.concrete(0xb8a890, 513), 3.0, { roughness: 0.95 }),
      lawn = k.pbr('ccLawn', X.grass(0x4b7a3a, 514), 0.12),
      prom = k.pbr('ccProm', X.pavers(0x9a968c, 515), 0.4),
      granite = k.pbr('ccGranite', X.ashlar(0x8c8c88, 516, 3), 0.3),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      ironG = k.flat(0x2a2e30, 0.6, 0.5),
      slat = k.pbr('benchW', X.planks(0x5d4939, 3, 32), 1.2),
      oak = k.pbr('ccOak', X.planks(0x5c4230, 4, 517), 1.0),
      white = k.flat(0xf1ede4, 0, 0.7),
      navy = k.flat(0x1d2f5c, 0, 0.7),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      orange = k.flat(0xf1c531, 0.2, 0.6),
      cream = k.flat(0xe6e2da, 0.2, 0.6),
      island = k.pbr('ccIsland', X.grass(0x4a6a3a, 518), 0.2);
    const CX = 0, CZ = -6, RO = 26, RI = 23, H = 6.5;
    // the harbor: water, Liberty, Governors Island, the Jersey shore, Brooklyn, the towers behind the Battery
    k.water({ y: -1.0, color: 0x30586a, w: 1400, d: 1400, x: 0, z: -300, amp: 1.2 });
    k.box(220, 1.2, 130, 10, -0.6, CZ + 25, lawn);
    liberty(k, -260, -1.0, CZ - 110, 1.3);
    k.box(120, 2, 60, 170, -0.5, -230, island);
    for (const [x, z, h] of [[150, -225, 8], [175, -240, 10], [195, -222, 7]]) k.box(16, h, 12, x, h / 2 - 0.5, z, k.pbr('nbBrickA', X.brick(0x6b4437, 21), 0.28));
    k.skyline({ z: -330, count: 16, spacing: 7, scale: 3.0, base: -1, seed: 519, lit: 0.22, glow: 0.4, tint: 0x6e7684, rows: 1, x: -250 });
    k.skyline({ z: -300, count: 12, spacing: 7, scale: 2.6, base: -1, seed: 520, lit: 0.2, glow: 0.4, tint: 0x7e8290, rows: 1, x: 190 });
    k.skyline({ z: CZ + 128, count: 26, spacing: 7, scale: 3.6, base: -1, seed: 521, lit: 0.25, glow: 0.5, tint: 0x6e7684, rows: 2, x: 20 });
    // the promenade and the seawall, the lawn, trees, benches, lampposts
    k.box(200, 0.3, 7, 10, 0.0, CZ - 36.5, prom);
    k.box(200, 0.9, 1.0, 10, 0.3, CZ - 40, granite);
    k.rail(10, CZ - 39.6, 200, iron, 1.1, 'x', 2);
    k.block(-90, 110, CZ - 40.5, CZ - 39.2);
    k.box(6, 0.3, 46, 34, 0.0, CZ + 17, prom);
    k.box(6, 0.3, 40, -34, 0.0, CZ + 14, prom);
    k.mesh(new T.CylinderGeometry(RO + 5, RO + 5, 0.32, 48), prom, CX, -0.14, CZ);
    const rnd = X.mulberry(522);
    for (let i = 0; i < 18; i++) { const x = -60 + rnd() * 130, z = CZ + 2 + rnd() * 60; if (Math.hypot(x - CX, z - CZ) < RO + 8) continue; if (Math.abs(x - 34) < 4 || Math.abs(x + 34) < 4) continue; k.tree(x, 0, z, { kind: 'round', h: 5 + rnd() * 4, r: 2.6 + rnd() * 2, leaf: 0x3f6b36, seed: i }); k.keepOut.push({ x, z, r: 0.7 }); }
    for (const x of [-30, -10, 10, 30, 50, 70]) parkBench(k, x, CZ - 34.4, PI, slat, iron, 2.4);
    for (const x of [-46, -20, 20, 46, 72]) k.prop('lamppost', x, 0, CZ - 33.2, { height: 6.5, keepOut: 0.5 });
    k.prop('hydrant', 36.8, 0, CZ + 20, { height: 1.1, keepOut: 0.5 });
    k.prop('buoy', -14, -1.2, CZ - 62, { height: 2.4 });
    k.prop('buoy', 60, -1.2, CZ - 80, { height: 2.4 });
    k.sign('THE BATTERY  ·  CASTLE CLINTON NATIONAL MONUMENT', 6, 0.5, 34, 2.2, CZ + 30, '#2a3a2a', '#e8dcc0', 60, PI / 2);
    // the fort: twenty brownstone segments with embrasures, the arched gate on the east, the court, the flag
    const segs: { a: number; kind: 'embrasure' | 'solid' | 'gate' }[] = [];
    for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2; segs.push({ a, kind: i === 5 ? 'gate' : i === 4 || i === 6 ? 'solid' : 'embrasure' }); }
    const rc = (RO + RI) / 2;
    for (const s of segs) {
      const px = CX + Math.sin(s.a) * rc, pz = CZ + Math.cos(s.a) * rc;
      const put = (o: T.Object3D) => { o.position.set(px, o.position.y, pz); o.rotation.y = s.a; };
      if (s.kind === 'gate') {
        put(k.arch(4.2, 5.2, RO - RI, 0, 0, 0, brown, false, 0.99));
        put(k.box(8.3, H - 5.88, RO - RI, 0, 5.88 + (H - 5.88) / 2, 0, brown));
      } else if (s.kind === 'solid') {
        put(k.box(8.3, H, RO - RI, 0, H / 2, 0, brown));
      } else {
        put(k.box(8.3, 1.3, RO - RI, 0, 0.65, 0, brown));
        put(k.arch(2.4, 2.4, RO - RI, 0, 1.3, 0, brown, false, 1.73));
        put(k.box(8.3, H - 4.01, RO - RI, 0, 4.01 + (H - 4.01) / 2, 0, brown));
      }
      const cap = k.box(8.5, 0.3, RO - RI + 0.4, 0, H + 0.15, 0, brownIn); put(cap);
      const tx = Math.cos(s.a), tz = -Math.sin(s.a);
      for (const off of s.kind === 'gate' ? [-3.1, 3.1] : [-2.8, 0, 2.8]) { const bx = px + tx * off, bz = pz + tz * off, hs = s.kind === 'gate' ? 1.2 : 1.5; k.block(bx - hs, bx + hs, bz - hs, bz + hs); }
    }
    k.mesh(new T.CylinderGeometry(RI + 0.4, RI + 0.4, 0.3, 48), gravel, CX, 0.02, CZ);
    k.mesh(new T.RingGeometry(RI + 0.4, RO + 0.4, 48), brownIn, CX, H + 0.32, CZ).rotation.x = -PI / 2;
    flagpole(k, ctx, CX, 0, CZ, 16, US_FLAG, 4.0);
    k.mesh(new T.CylinderGeometry(1.2, 1.4, 0.5, 16), granite, CX, 0.25, CZ);
    k.keepOut.push({ x: CX, z: CZ, r: 1.6 });
    // cannon on carriages at four embrasures
    for (const i of [0, 2, 13, 15]) {
      const a = (i / 20) * PI * 2, r = 20.2, x = CX + Math.sin(a) * r, z = CZ + Math.cos(a) * r, ux = Math.sin(a), uz = Math.cos(a);
      const car = k.box(1.0, 0.7, 1.8, 0, 0, 0, oak); car.position.set(x, 0.75, z); car.rotation.y = a;
      for (const s of [-1, 1]) for (const d of [-0.6, 0.7]) { const w = k.cyl(0.5, 0.12, x + Math.cos(a) * s * 0.62 + ux * d, 0.5, z - Math.sin(a) * s * 0.62 + uz * d, ironG, 0.5, 14); w.rotation.set(0, a, PI / 2); }
      k.beam(v(x - ux * 1.2, 1.25, z - uz * 1.2), v(x + ux * 1.7, 1.75, z + uz * 1.7), 0.2, ironG, 12);
      k.sphere(0.24, x - ux * 1.25, 1.24, z - uz * 1.25, ironG, 8);
      k.keepOut.push({ x, z, r: 1.6 });
    }
    // the ticket booth and the benches in the court
    const BX = 8, BZ = CZ + 9;
    k.box(6, 4.2, 4, BX, 2.1, BZ, oak);
    k.box(6.6, 0.3, 4.6, BX, 4.35, BZ, dark);
    k.box(0.1, 1.1, 2.4, BX - 3.02, 1.7, BZ, k.glass(0xdcecf6, 0.2, 0.05));
    k.box(0.2, 0.06, 2.6, BX - 3.1, 1.12, BZ, white);
    k.block(BX - 3.2, BX + 3.2, BZ - 2.2, BZ + 2.2);
    k.sign('"TICKETS"', 2.6, 0.5, BX - 3.06, 3.6, BZ, '#1d2f5c', '#f4f0e8', 110, -PI / 2);
    k.sign('LIBERTY AND ELLIS ISLAND FERRY', 3.6, 0.36, BX, 3.7, BZ + 2.06, 'transparent', '#e8dcc0', 60, 0);
    for (let i = 0; i < 4; i++) k.prop('rope_stanchion', BX - 6 - i * 1.5, 0, BZ - 3.4, { height: 1.0 });
    for (const [x, z, r] of [[-10, CZ + 8, PI / 4], [-10, CZ - 8, (3 * PI) / 4], [10, CZ - 10, -(3 * PI) / 4]]) parkBench(k, x, z, r, slat, iron, 2.4);
    k.lamp(-6, CZ + 14, 4.5, iron, 0xffe0b0, 22); k.lamp(6, CZ - 14, 4.5, iron, 0xffe0b0, 22);
    k.censusWall({ x: BX + 3.06, y: 2.4, z: BZ, rotY: PI / 2, cols: 6, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(5200, 24), pieces: ctx.all, backing: dark });
    k.point(CX, 8, CZ, 0xfff0dc, 20, 30);
    for (const dz of [-5, 5]) k.point(CX + RO + 4, 5, CZ + dz, 0xffe0b0, 24, 18);
    // the harbor moves: gulls, the Staten Island ferry far out, a Liberty ferry nearer, and the water itself
    gulls(k, ctx, [v(0, 12, CZ - 30), v(-40, 14, CZ - 70), v(10, 10, CZ - 95), v(50, 16, CZ - 50), v(30, 12, CZ + 4)], 14, 523);
    const ferry = new T.Group();
    const hull = new T.Mesh(new T.BoxGeometry(12, 3, 44), orange); hull.position.y = 1.4; ferry.add(hull);
    const cab = new T.Mesh(new T.BoxGeometry(10, 4, 34), cream); cab.position.y = 4.9; ferry.add(cab);
    const top = new T.Mesh(new T.BoxGeometry(8, 2.4, 18), orange); top.position.y = 8.1; ferry.add(top);
    k.add(ferry);
    if (!ctx.reduced) k.rider(ferry, k.spline([v(80, -0.8, CZ - 170), v(-40, -0.8, CZ - 240), v(-140, -0.8, CZ - 170), v(-60, -0.8, CZ - 100)], true), 4, 0);
    const lib = new T.Group();
    const lh = new T.Mesh(new T.BoxGeometry(6, 2.4, 24), white); lh.position.y = 1.0; lib.add(lh);
    const lc = new T.Mesh(new T.BoxGeometry(5, 2.6, 16), navy); lc.position.y = 3.5; lib.add(lc);
    k.add(lib);
    if (!ctx.reduced) k.rider(lib, k.spline([v(-30, -0.8, CZ - 78), v(30, -0.8, CZ - 70), v(80, -0.8, CZ - 120), v(0, -0.8, CZ - 150), v(-80, -0.8, CZ - 120)], true), 3, 30);
    // life on the promenade and in the court
    k.crowd([v(-70, 0, CZ - 34), v(90, 0, CZ - 34)], 26, { seed: 70, speed: 0.9, spread: 2.2, animate: !ctx.reduced });
    k.crowd([v(28, 0, CZ), v(14, 0, CZ + 12), v(-8, 0, CZ + 14), v(-16, 0, CZ), v(-6, 0, CZ - 14), v(12, 0, CZ - 12)], 10, { seed: 71, speed: 0.4, spread: 2.5, animate: !ctx.reduced, closed: true });
    // Ellis Island to the west: the red brick main building with its four domed towers
    {
      const eb = k.pbr('ellisBrick', X.brick(0x9a4a36, 524), 0.28), trim = k.flat(0xd8cfbc, 0, 0.7), dome = k.pbr('patina', X.patina(), 0.4, { roughness: 0.55, metalness: 0.25 }), slateE = k.flat(0x4a4e56, 0, 0.8), darkE = k.flat(0x2a3038, 0.3, 0.4);
      const EXx = -215, EZ = -25;
      k.box(80, 2.2, 46, EXx, -0.5, EZ, island);
      k.box(13, 11, 40, EXx, 6.1, EZ, eb);
      for (const y of [4, 11.4]) k.box(13.3, 0.45, 40.3, EXx, y, EZ, trim);
      k.box(12.4, 1.2, 39.4, EXx, 12.2, EZ, slateE);
      for (const dz of [-4.2, 0, 4.2]) { k.box(0.12, 5, 3, EXx + 6.52, 7.2, EZ + dz, darkE); k.box(0.2, 0.4, 3.4, EXx + 6.6, 9.9, EZ + dz, trim); }
      for (const y of [6, 9.4]) for (const dz of [-15.5, -12, -8.5, 8.5, 12, 15.5]) k.box(0.12, 2, 1.4, EXx + 6.52, y, EZ + dz, darkE);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const tx = EXx + sx * 4.8, tz = EZ + sz * 7; k.box(3, 19, 3, tx, 10.1, tz, eb); k.box(3.3, 0.4, 3.3, tx, 19.6, tz, trim); const d = k.sphere(1.7, tx, 20.4, tz, dome, 12); d.scale.y = 1.35; k.cyl(0.3, 1.4, tx, 23, tz, trim, 0.2, 6); }
    }
    // Castle Williams on Governors Island, the round red sandstone twin of this fort
    {
      const sand = k.pbr('cwSand', X.ashlar(0x9a5a44, 525, 4), 0.25, { roughness: 0.85 }), darkW = k.flat(0x2a2624, 0.2, 0.7), CWX = 118, CWZ = -206;
      k.cyl(11, 12, CWX, 6.5, CWZ, sand, 11, 32);
      k.cyl(11.3, 0.6, CWX, 12.8, CWZ, sand, 11.3, 32);
      for (const y of [3, 6.6, 10.2]) for (let i = 0; i < 26; i++) { const a = (i / 26) * PI * 2; const w = k.box(0.9, 1.4, 0.3, CWX + Math.sin(a) * 11.02, y, CWZ + Math.cos(a) * 11.02, darkW); w.rotation.y = a; }
    }
    // cannonballs piled by two of the guns
    for (const i of [0, 13]) {
      const a = (i / 20) * PI * 2, px = CX + Math.sin(a) * 18.4 + Math.cos(a) * 1.8, pz = CZ + Math.cos(a) * 18.4 - Math.sin(a) * 1.8;
      for (let l = 0; l < 3; l++) for (let u = 0; u < 3 - l; u++) for (let w = 0; w < 3 - l; w++) k.sphere(0.16, px + (u - (2 - l) / 2) * 0.33, 0.33 + l * 0.27, pz + (w - (2 - l) / 2) * 0.33, ironG, 8);
      k.keepOut.push({ x: px, z: pz, r: 0.7 });
    }
    // a tug pushing a barge down the harbor, sailboats beating about, pigeons in the court
    {
      const tug = new T.Group(), red = new T.MeshStandardMaterial({ color: 0xa8342a, roughness: 0.6 }), wht = new T.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.6 }), barge = new T.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.8 });
      tug.add(new T.Mesh(mergeGeometries([new T.BoxGeometry(4, 2.2, 9).translate(0, 0.6, 0), new T.CylinderGeometry(0.4, 0.4, 2.6, 8).translate(0, 4.6, -2.4)]), red));
      tug.add(new T.Mesh(mergeGeometries([new T.BoxGeometry(3, 2.2, 3.4).translate(0, 2.8, -0.8), new T.BoxGeometry(2.4, 1.6, 2.4).translate(0, 4.7, -0.4)]), wht));
      tug.add(new T.Mesh(new T.BoxGeometry(8, 1.8, 22).translate(0, 0.5, 15.8), barge));
      k.add(tug);
      if (!ctx.reduced) k.rider(tug, k.spline([v(130, -0.8, CZ - 70), v(-40, -0.8, CZ - 60), v(-170, -0.8, CZ - 95), v(-60, -0.8, CZ - 135), v(90, -0.8, CZ - 125)], true), 2.6, 0);
      else { tug.position.set(40, -0.8, CZ - 66); tug.rotation.y = -PI / 2; }
      const col = (g: T.BufferGeometry, c: number) => { const cc = new T.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; } g.setAttribute('color', new T.BufferAttribute(a, 3)); return g; };
      const sailS = new T.Shape(); sailS.moveTo(0, 0); sailS.lineTo(0, 7); sailS.lineTo(3.4, 0); sailS.closePath();
      const sailG = new T.ShapeGeometry(sailS); sailG.rotateY(PI / 2); sailG.translate(0, 1.4, -0.4);
      const boatG = mergeGeometries([col(new T.BoxGeometry(1.6, 0.8, 5.4).toNonIndexed().translate(0, 0.3, 0), 0xf2f0ea), col(new T.CylinderGeometry(0.05, 0.05, 7.4, 5).toNonIndexed().translate(0, 4.4, 0), 0x6a6e74), col(sailG.toNonIndexed(), 0xf8f6ee)]);
      const boats = new T.InstancedMesh(boatG, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: T.DoubleSide }), 3);
      boats.frustumCulled = false;
      k.add(boats);
      const bs = [{ cx: -70, cz: CZ - 120, rx: 45, rz: 18, w: 0.05, ph: 0 }, { cx: 20, cz: CZ - 150, rx: 35, rz: 22, w: -0.04, ph: 2 }, { cx: -120, cz: CZ - 170, rx: 30, rz: 14, w: 0.06, ph: 4 }];
      const M = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ'), p = new T.Vector3(), one = new T.Vector3(1, 1, 1);
      const sail = (t: number) => { bs.forEach((b, i) => { const a = b.ph + t * b.w; p.set(b.cx + Math.cos(a) * b.rx, -0.9 + Math.sin(t * 1.1 + i) * 0.08, b.cz + Math.sin(a) * b.rz); const vx = -Math.sin(a) * b.rx * Math.sign(b.w), vz = Math.cos(a) * b.rz * Math.sign(b.w); e.set(0, Math.atan2(vx, vz), 0.14 + Math.sin(t * 0.7 + i) * 0.04); q.setFromEuler(e); M.compose(p, q, one); boats.setMatrixAt(i, M); }); boats.instanceMatrix.needsUpdate = true; };
      sail(0);
      if (!ctx.reduced) k.ticks.push((t) => sail(t));
    }
    pigeons(k, ctx, [v(-8, 0.17, CZ + 4), v(6, 0.17, CZ - 6), v(-4, 0.17, CZ - 12), v(13, 0.17, CZ + 2), v(20, 0, CZ - 30)], 16, 526, 2.4);
    // landmark eggs
    const NPS = { name: 'National Park Service, Castle Clinton', url: 'https://www.nps.gov/cacl/learn/historyculture/index.htm' };
    k.egg(v(-260, 14, CZ - 110), { id: 'liberty', title: 'Liberty across the water', year: '1886', room: 'liberty', text: 'The Statue of Liberty was dedicated on October 28, 1886. Her pedestal stands on Fort Wood, part of the same system of harbor forts as Castle Clinton.', clue: 'Out past the seawall, someone is holding up a light.', source: { name: 'National Park Service, Statue of Liberty', url: 'https://www.nps.gov/stli/learn/historyculture/index.htm' } }, { r: 12 });
    k.egg(v(-215, 9, -25), { id: 'ellis', title: 'Ellis Island, the next door', year: '1892 to 1924', room: 'ellis', text: 'From 1892 to 1924 Ellis Island was America\'s largest and most active immigration station, processing more than 12 million people. It opened two years after Castle Garden, the depot inside these walls, closed in 1890.', clue: 'West across the water, four domed towers stand over a red brick hall.', source: { name: 'National Park Service, Ellis Island', url: 'https://www.nps.gov/elis/learn/historyculture/index.htm' } }, { r: 13 });
    k.egg(v(118, 7, -206), { id: 'castle-williams', title: 'Castle Williams, the twin fort', year: '1807 to 1811', room: 'governors', text: 'On Governors Island stands Castle Williams, designed by Lt. Col. Jonathan Williams and built from 1807 to 1811. It guarded the harbor alongside this fort, and later served the Army as a prison until 1965.', clue: 'Look across the harbor for another round fort on an island.', source: { name: 'National Park Service, Castle Williams', url: 'https://www.nps.gov/gois/learn/historyculture/castle-williams.htm' } }, { r: 12 });
    k.egg(v(0, 1.3, CZ + 20.2), { id: 'cannons', title: 'Twenty eight guns', year: '1811', text: 'When the fort was finished in 1811 it was fully armed with 28 cannons. Each could fire a 32 pound cannonball a mile and a half out over the harbor.', clue: 'In the court, one of the guns still points out through its embrasure.', source: NPS }, { r: 1.8 });
    k.egg(v(24.5, 2.6, CZ), { id: 'castle-garden', title: 'Castle Garden, 1855 to 1890', year: '1855 to 1890', text: 'From August 3, 1855 to April 18, 1890 this fort was Castle Garden, an immigrant landing depot. More than 8 million people entered the United States through it, about two thirds of all immigrants in those years.', clue: 'Walk through the arched gate, the way millions did.', source: NPS }, { r: 2.6 });
    k.egg(v(-7, 1.4, CZ + 2), { id: 'nightingale', title: 'A concert hall, then an aquarium', year: '1850', room: 'coney', text: 'In 1850 the soprano Jenny Lind, the Swedish Nightingale, made her American debut here. From 1896 the fort was the New York Aquarium, until the aquarium moved to Coney Island in 1941.', clue: 'Stand in the open court and picture the crowds it once held.', source: NPS }, { r: 2.0 });
    // the works: set into the embrasures round the ring, on the ticket booth, flanking the gate outside
    const mounts: Mount[] = [];
    for (const s of segs) {
      if (s.kind !== 'embrasure') continue;
      const rr = RI - 0.06;
      mounts.push({ position: v(CX + Math.sin(s.a) * rr, 2.75, CZ + Math.cos(s.a) * rr), rotation: s.a + PI, target: v(CX + Math.sin(s.a) * 17, 3, CZ + Math.cos(s.a) * 17), width: 2.1, height: 1.35, style: 'steel', wash: false });
    }
    mounts.push({ position: v(BX - 3.06, 3.0, BZ), rotation: -PI / 2, target: v(BX - 7.5, 3, BZ), width: 3.0, height: 1.4, style: 'steel', wash: false });
    mounts.push({ position: v(BX, 3.0, BZ - 2.06), rotation: PI, target: v(BX, 3, BZ - 6.5), width: 3.4, height: 1.4, style: 'steel', wash: false });
    for (const i of [4, 6]) { const a = (i / 20) * PI * 2, rr = RO + 0.06; mounts.push({ position: v(CX + Math.sin(a) * rr, 3.6, CZ + Math.cos(a) * rr), rotation: a, target: v(CX + Math.sin(a) * 31, 3, CZ + Math.cos(a) * 31), width: 3.6, height: 2.2, style: 'steel', wash: false }); }
    return { mounts, spawn: v(48, 3, CZ - 22), look: v(-20, 6, CZ - 14), eye: 3, bounds: [-70, 90, CZ - 39.6, CZ + 70], style: 'steel' };
  },
};
