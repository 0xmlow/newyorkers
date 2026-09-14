/* Rooms 129 to 133: Greenacre Park, Paley Park, St. Mark's in-the-Bowery, the Kings Theatre foyer, Loew's Valencia.
   Real places first: the street, the block, the facade, the door, then the room and the hang. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef, RoomCtx } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;

/* ---------- shared: a street running along x (street() in f.ts runs along z) ---------- */
function avenue(k: Kit, p: { w: number; len: number; z: number; x?: number; walk?: number }) {
  const { w, len, z, x = 0, walk = 5 } = p;
  const asphalt = k.pbr('asphaltA', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }),
    pav = k.pbr('sidewalkA', X.pavers(0x8e8b84, 5), 0.42),
    granite = k.pbr('curbA', X.ashlar(0x8a8a86, 4, 2), 0.35),
    white = k.flat(0xdedbd2, 0, 0.7),
    yellow = k.flat(0xe6a626, 0, 0.6);
  k.box(len, 0.3, w, x, -0.15, z, asphalt);
  for (const s of [-1, 1]) { k.box(len, 0.28, walk, x, 0, z + s * (w / 2 + walk / 2), pav); k.box(len, 0.32, 0.3, x, 0.02, z + s * (w / 2 + 0.1), granite); }
  for (const dz of [-0.14, 0.14]) k.box(len - 6, 0.012, 0.09, x, 0.01, z + dz, yellow);
  for (let cx = x - len / 2 + 8; cx < x + len / 2; cx += 30) for (let cz = -w / 2 + 1.2; cz <= w / 2 - 1; cz += 1.2) k.box(2.8, 0.014, 0.62, cx, 0.012, z + cz, white);
}

/* Parked cars along a kerb: a body, a cabin, four wheels, one colour each, all static. */
function cars(k: Kit, p: { z: number; x0: number; x1: number; seed?: number; face?: 1 | -1 }) {
  const rnd = X.mulberry(p.seed ?? 3), face = p.face ?? 1;
  const colors = [0x1a1c22, 0xd8d6cf, 0x8a1a22, 0x2a3a5a, 0x5a5e66, 0xe8c030, 0x1f3a2a];
  const tyre = k.flat(0x141416, 0.1, 0.9), glass = k.glass(0x9fb4c4, 0.5, 0.1);
  for (let x = p.x0; x < p.x1; x += 6.2) {
    if (rnd() < 0.25) continue;
    const c = k.flat(colors[Math.floor(rnd() * colors.length)], 0.6, 0.35), z = p.z + face * (rnd() - 0.5) * 0.2;
    k.rounded(4.4, 0.7, 1.8, x, 0.62, z, c, 0.12);
    k.rounded(2.4, 0.6, 1.6, x - 0.2, 1.24, z, c, 0.16);
    k.box(2.0, 0.5, 1.64, x - 0.2, 1.26, z, glass);
    for (const dx of [-1.4, 1.4]) for (const dz of [-0.85, 0.85]) { const w = k.cyl(0.34, 0.24, x + dx, 0.34, z + dz, tyre, 0.34, 12); w.rotation.x = PI / 2; }
    k.keepOut.push({ x, z, r: 2.4 });
  }
}

/* A row of neighbours along x on the far side of a street: brick, lit windows, a cornice, a shop line at the bottom. */
function rowAcross(k: Kit, p: { z: number; x0: number; count: number; face: 1 | -1; seed?: number; h?: [number, number]; w?: number }) {
  const { z, x0, count, face, seed = 5, h = [14, 24], w = 10 } = p;
  const rnd = X.mulberry(seed);
  const bricks = [k.pbr('raBrickA', X.brick(0x6b4437, 41), 0.28), k.pbr('raBrickB', X.brick(0x8a5a48, 42), 0.28), k.pbr('raStone', X.ashlar(0xb9ad97, 43, 3), 0.22)];
  const win = k.pbr('raWin', X.windows(44, 0.3, 0x2e3a48, true), 0.24, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.3, stretch: 0.42 });
  const cornice = k.pbr('raCornice', X.plaster(0xb8ad9a, 3), 0.6), shop = k.glow(0xffd9a0), dark = k.flat(0x1f242a, 0.6, 0.5);
  for (let b = 0; b < count; b++) {
    const x = x0 + b * w, hh = h[0] + Math.floor(rnd() * (h[1] - h[0])), m = bricks[Math.floor(rnd() * bricks.length)], depth = 12;
    k.box(w - 0.2, hh, depth, x, hh / 2, z - face * depth / 2, m);
    k.box(w - 1.6, hh - 5.5, 0.12, x, 4.2 + (hh - 5.5) / 2, z + face * 0.06, win);
    k.box(w - 0.2, 0.7, 0.9, x, hh - 0.3, z + face * 0.4, cornice);
    k.box(w - 1.2, 2.6, 0.12, x, 1.7, z + face * 0.06, rnd() > 0.45 ? shop : dark);
    k.box(w - 0.2, 0.5, 0.6, x, 3.4, z + face * 0.3, dark);
  }
}

/* ---------- shared: the water wall, the pool, the mist ---------- */
/* The wall stands on z, water falls down its +z face into a pool in front. Ribbons are instanced and slide; a sheet
   reads even with motion off; the mist breathes at the foot. */
let streakTex: T.CanvasTexture | null = null;
function streak() {
  if (streakTex) return streakTex;
  const c = document.createElement('canvas'); c.width = 32; c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 128);
  if (grad && grad.addColorStop) { grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(0.25, 'rgba(255,255,255,0.9)'); grad.addColorStop(0.75, 'rgba(255,255,255,0.8)'); grad.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grad; g.fillRect(0, 0, 32, 128); }
  const gx = g.createLinearGradient(0, 0, 32, 0);
  if (gx && gx.addColorStop) { gx.addColorStop(0, 'rgba(0,0,0,0.6)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,0.6)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 32, 128); }
  streakTex = new T.CanvasTexture(c);
  return streakTex;
}
function waterWall(k: Kit, ctx: RoomCtx, p: { x: number; z: number; w: number; h: number; pool?: number; base?: number }) {
  const { x, z, w, h, pool = 2.6, base = 0 } = p;
  const granite = k.pbr('wfGranite', X.ashlar(0x15181a, 77, 4), 0.5, { roughness: 0.3, metalness: 0.15 });
  const curb = k.pbr('wfCurb', X.ashlar(0x8c8c88, 4, 2), 0.35);
  k.box(w, h, 0.8, x, base + h / 2, z, granite);
  k.box(w + 0.6, 0.5, 1.3, x, base + h + 0.25, z + 0.1, curb);
  const pz = z + 0.4 + pool / 2;
  k.box(w + 0.6, 0.55, 0.3, x, base + 0.27, z + 0.4 + pool + 0.15, curb);
  for (const s of [-1, 1]) k.box(0.3, 0.55, pool + 0.3, x + s * (w / 2 + 0.15), base + 0.27, pz, curb);
  k.box(w, 0.1, pool, x, base + 0.05, pz, k.flat(0x1e2a30, 0.2, 0.6));
  k.water({ y: base + 0.38, w, d: pool, x, z: pz, color: 0x2f5f6c, amp: 0.25 });
  k.block(x - w / 2 - 0.3, x + w / 2 + 0.3, z - 0.5, z + 0.4 + pool + 0.4);
  // sheet: a translucent plane the whole face, then the ribbons
  const sheet = k.mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0.1, depthWrite: false }), x, base + h / 2, z + 0.43, true);
  void sheet;
  k.box(w, 0.14, 0.7, x, base + 0.46, z + 0.7, k.glow(0xeef6f8, 0.7));
  const n = Math.round(w * 7), rnd = X.mulberry(Math.round(w * 7 + h));
  const g = new T.PlaneGeometry(0.26, 3.2);
  const mats: T.Matrix4[] = [], st: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i < n; i++) { const rx = x - w / 2 + 0.3 + rnd() * (w - 0.6), ry = base + 0.6 + rnd() * (h - 0.6); st.push({ x: rx, y: ry, s: 4.5 + rnd() * 3 }); mats.push(new T.Matrix4().makeTranslation(rx, ry, z + 0.46)); }
  const rib = k.instances(g, new T.MeshBasicMaterial({ map: streak(), color: 0xf4fbff, transparent: true, opacity: 0.75, depthWrite: false, side: T.DoubleSide }), mats);
  const mist: T.Mesh[] = [];
  for (let i = 0; i < 5; i++) { const m = k.mesh(new T.PlaneGeometry(w / 4, 1.8), k.glow(0xe8f3f8, 0.12 + (i % 3) * 0.04), x - w / 2 + (i + 0.5) * w / 5, base + 1.0, z + 1.0, true); m.material = (m.material as T.Material).clone(); (m.material as T.MeshBasicMaterial).depthWrite = false; mist.push(m); }
  k.point(x, base + h * 0.45, z + 2.2, 0xd8ecff, 40, 20); k.point(x - w / 3, base + 1.2, z + 1.5, 0xe8f4ff, 12, 8); k.point(x + w / 3, base + 1.2, z + 1.5, 0xe8f4ff, 12, 8);
  if (!ctx.reduced) {
    const m = new T.Matrix4();
    k.ticks.push((t, dt) => {
      const d = Math.min(dt, 0.1);
      for (let i = 0; i < n; i++) { const a = st[i]; a.y -= a.s * d; if (a.y < base + 0.4) a.y = base + h - 0.1; m.makeTranslation(a.x + Math.sin(t * 3 + i) * 0.02, a.y, z + 0.46); rib.setMatrixAt(i, m); }
      rib.instanceMatrix.needsUpdate = true;
      mist.forEach((mm, i) => { const s = 1 + 0.25 * Math.sin(t * 0.9 + i * 1.7); mm.scale.set(s, 1 + 0.4 * Math.sin(t * 0.6 + i), 1); mm.position.y = base + 1.0 + 0.3 * Math.sin(t * 0.5 + i * 2); (mm.material as T.MeshBasicMaterial).opacity = 0.1 + 0.08 * (1 + Math.sin(t * 0.7 + i)); });
    });
  }
}

/* ---------- shared: cafe furniture, the people in it, honey locusts, leaves ---------- */
type Seat = { x: number; z: number; rotY: number; y: number };
function chair(k: Kit, x: number, y: number, z: number, rotY: number, wire: T.Material) {
  const sx = Math.sin(rotY), cz = Math.cos(rotY);
  k.cyl(0.21, 0.03, x, y + 0.45, z, wire, 0.21, 12);
  const back = k.box(0.42, 0.42, 0.03, x - sx * 0.2, y + 0.75, z - cz * 0.2, wire); back.rotation.y = rotY;
  for (const [lx, lz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) k.cyl(0.015, 0.45, x + lx * cz + lz * sx, y + 0.22, z - lx * sx + lz * cz, wire, 0.015, 5);
}
function cafeSet(k: Kit, x: number, y: number, z: number, n: number, seed: number, wire: T.Material, top: T.Material): Seat[] {
  k.cyl(0.36, 0.04, x, y + 0.72, z, top, 0.36, 20);
  k.cyl(0.03, 0.7, x, y + 0.35, z, wire, 0.03, 6);
  k.cyl(0.22, 0.03, x, y + 0.015, z, wire, 0.22, 12);
  k.keepOut.push({ x, z, r: 1.15 });
  const rnd = X.mulberry(seed), a0 = rnd() * PI * 2, out: Seat[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i * PI * 2) / n + (rnd() - 0.5) * 0.5, cx = x + Math.cos(a) * 0.78, cz = z + Math.sin(a) * 0.78, rotY = Math.atan2(x - cx, z - cz);
    chair(k, cx, y, cz, rotY, wire);
    out.push({ x: cx, z: cz, rotY, y });
  }
  return out;
}
/* Seated figures: a shorter capsule and a head, one instanced pair for the whole room. */
function seated(k: Kit, seats: Seat[], seed = 3, every = 0.6) {
  const rnd = X.mulberry(seed);
  const use = seats.filter(() => rnd() < every);
  if (!use.length) return;
  const body = new T.InstancedMesh(new T.CapsuleGeometry(0.2, 0.5, 3, 8), new T.MeshStandardMaterial({ roughness: 0.85 }), use.length);
  const head = new T.InstancedMesh(new T.SphereGeometry(0.125, 10, 8), new T.MeshStandardMaterial({ roughness: 0.7 }), use.length);
  const colors = [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x4a6a3a, 0x151517, 0xc9a25a, 0x6a4a8a, 0xe6e2da, 0x2b5f6e], skins = [0xf1d3b5, 0xc8a284, 0x8d5a3b, 0x5a3a26, 0xe9c2a0, 0xa77653];
  const m = new T.Matrix4(), q = new T.Quaternion(), c = new T.Color(), up = new T.Vector3(0, 1, 0), one = new T.Vector3(1, 1, 1);
  use.forEach((s, i) => {
    q.setFromAxisAngle(up, s.rotY);
    m.compose(v(s.x, s.y + 0.78, s.z), q, one); body.setMatrixAt(i, m); body.setColorAt(i, c.set(colors[Math.floor(rnd() * colors.length)]));
    m.compose(v(s.x, s.y + 1.36, s.z), q, one); head.setMatrixAt(i, m); head.setColorAt(i, c.set(skins[Math.floor(rnd() * skins.length)]));
  });
  body.castShadow = head.castShadow = k.o.quality === 'high';
  k.add(body); k.add(head);
}
function locust(k: Kit, x: number, y: number, z: number, h: number, r: number, seed: number, leaf = 0x86a851) {
  k.tree(x, y, z, { h, r, kind: 'round', seed, leaf });
  k.keepOut.push({ x, z, r: 0.45 });
}
/* Leaves drifting down through the trees: one instanced mesh, recycled from the canopy. */
function leaves(k: Kit, ctx: RoomCtx, n: number, b: { x0: number; x1: number; z0: number; z1: number; top: number; floor?: number }, seed = 9) {
  const rnd = X.mulberry(seed), floor = b.floor ?? 0;
  const mats: T.Matrix4[] = [];
  for (let i = 0; i < n; i++) mats.push(new T.Matrix4().makeTranslation(b.x0 + rnd() * (b.x1 - b.x0), floor + rnd() * b.top, b.z0 + rnd() * (b.z1 - b.z0)));
  const inst = k.instances(new T.PlaneGeometry(0.16, 0.11), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: T.DoubleSide }), mats);
  const c = new T.Color();
  for (let i = 0; i < n; i++) inst.setColorAt(i, c.set([0xc9a03a, 0xa8b048, 0xd88a2a, 0x8f9a3a][i % 4]));
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  if (ctx.reduced) return;
  const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3(1, 1, 1), e = new T.Euler();
  k.ticks.push((t, dt) => {
    const d = Math.min(dt, 0.1);
    for (let i = 0; i < n; i++) {
      inst.getMatrixAt(i, m); p.setFromMatrixPosition(m);
      p.y -= (0.32 + (i % 4) * 0.1) * d; p.x += Math.sin(t * 1.3 + i) * 0.35 * d; p.z += Math.cos(t * 0.9 + i * 0.7) * 0.25 * d;
      if (p.y < floor + 0.04) { p.y = floor + b.top * (0.7 + 0.3 * rnd()); p.x = b.x0 + rnd() * (b.x1 - b.x0); p.z = b.z0 + rnd() * (b.z1 - b.z0); }
      q.setFromEuler(e.set(t * 1.5 + i, t * 0.8 + i * 0.3, 0)); m.compose(p, q, s); inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });
}
function lantern(k: Kit, x: number, y: number, z: number, rotY: number, night: number) {
  const iron = k.flat(0x1f242a, 0.7, 0.45), glow = k.glow(0xffd9a0);
  const sx = Math.sin(rotY), cz = Math.cos(rotY);
  k.box(0.12, 0.12, 0.5, x + sx * 0.2, y + 0.3, z + cz * 0.2, iron).rotation.y = rotY;
  k.box(0.28, 0.4, 0.28, x + sx * 0.42, y, z + cz * 0.42, iron);
  k.box(0.2, 0.3, 0.2, x + sx * 0.42, y, z + cz * 0.42, glow);
  k.point(x + sx * 0.7, y - 0.1, z + cz * 0.7, 0xffd9a0, 4 + 16 * night, 9);
}
function placard(k: Kit, text: string, x: number, y: number, z: number, rotY: number, w = 1.4) {
  const post = k.flat(0x2a3040, 0.65, 0.4);
  k.cyl(0.03, y - 0.15, x, (y - 0.15) / 2, z, post);
  const b = k.box(w + 0.1, 0.34, 0.05, x, y, z, k.flat(0x0d0d0d, 0.15, 0.5)); b.rotation.y = rotY;
  k.sign(text, w, 0.26, x + Math.sin(rotY) * 0.03, y, z + Math.cos(rotY) * 0.03, 'transparent', '#f0f4f8', 84, rotY, { font: 'Helvetica' });
  k.keepOut.push({ x, z, r: 0.35 });
}

/* ---------------- 129 GREENACRE PARK ---------------- */
export const greenacre: RoomDef = {
  id: 'greenacre',
  name: 'The waterfall room',
  area: 'GREENACRE PARK / EAST 51ST STREET',
  mood: 'Lunch hour under the water',
  color: '#94b8a0',
  description: 'East 51st Street, then the vest pocket park between two buildings: honey locusts, movable chairs, the raised terrace under its trellis, and the 25 foot waterfall filling the back wall, the works hung on the ivy.',
  signatures: 'The 1971 vest pocket park, sixty feet wide, brick and granite, a raised terrace along the east side under a trellis with heaters, honey locusts, a brook along the west wall, and the 25 foot waterfall across the north wall.',
  build(k, ctx) {
    k.sky({ top: 0x6f9dd2, horizon: 0xe4e8e4, ground: 0x4c5648, fog: 0.0028, sun: { az: 0.9, el: 0.8, color: 0xfff1d8, size: 14 }, env: 0.9 });
    k.hemi(0xf0f6ff, 0x3f4a3a, 0.95);
    k.sun(0xfff0d4, 2.2, 18, 52, 26, true, 60);
    const brick = k.pbr('gaBrick', X.brick(0x7a4a3c, 61), 0.28),
      granite = k.pbr('gaGranite', X.ashlar(0x8c8a84, 62, 3), 0.35),
      pavers = k.pbr('gaPavers', X.pavers(0x8a8074, 63), 0.5),
      ivy = k.pbr('ivyWall', X.grass(0x3a5a2c, 64), 0.22, { roughness: 1 }),
      wood = k.pbr('gaTrellis', X.planks(0x5a3f2c, 4, 65), 0.9),
      wire = k.flat(0xd6dad6, 0.7, 0.4),
      top = k.pbr('gaTable', X.marble(0xe8e4dc, 0x9a948a, 66), 0.6, { roughness: 0.3 }),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      bronze = k.flat(0x6a4a2a, 0.8, 0.4),
      brookM = k.flat(0x2f5a66, 0.6, 0.2),
      heater = k.glow(0xff8a3a);
    // 51st Street, the neighbours either side, the block across, midtown behind
    avenue(k, { w: 14, len: 140, z: 30 });
    rowAcross(k, { z: 42, x0: -60, count: 13, face: -1, seed: 68, h: [16, 28] });
    cars(k, { z: 35.6, x0: -50, x1: 50, seed: 4 }); cars(k, { z: 24.4, x0: -46, x1: -12, seed: 5 }); cars(k, { z: 24.4, x0: 12, x1: 46, seed: 6 });
    blockFront(k, { x: -9.4, z0: 18, count: 5, face: 1, seed: 67, h: [16, 24] });
    blockFront(k, { x: 9.4, z0: 18, count: 5, face: -1, seed: 71, h: [16, 24] });
    k.box(40, 24, 12, 0, 12, -25, brick);
    k.skyline({ z: -110, count: 18, spacing: 9, scale: 2.6, base: -2, seed: 69, lit: 0.15, glow: 0.4, tint: 0x6e7684, rows: 1 });
    k.skyline({ z: 150, count: 18, spacing: 9, scale: 2.4, base: -2, seed: 70, lit: 0.12, glow: 0.3, tint: 0x7e8290, rows: 1 });
    k.prop('lamppost', -15, 0.14, 20.5, { height: 6, keepOut: 0.5 });
    k.prop('lamppost', 15, 0.14, 20.5, { height: 6, keepOut: 0.5 });
    k.prop('hydrant', 12, 0.14, 19.5, { height: 1.1, keepOut: 0.5 });
    k.prop('tree', -20, 0.14, 21, { height: 6, keepOut: 0.6 });
    k.prop('tree', 22, 0.14, 21, { height: 6.5, keepOut: 0.6 });
    // the park: paving, the ivy walls, the front wall with its bronze sign, the brook, the terrace
    k.box(18.6, 0.3, 36, 0, -0.15, 0, pavers);
    for (const s of [-1, 1]) { k.box(0.3, 8.4, 36, s * 9.0, 4.2, 0, ivy); k.block(s * 8.7, s * 9.8, -18, 18); }
    for (const s of [-1, 1]) { k.box(4, 4.4, 0.6, s * 7, 2.2, 18, brick); k.box(4.2, 0.2, 0.8, s * 7, 4.5, 18, granite); k.block(s * 5, s * 9.2, 17.7, 18.3); }
    k.box(18.6, 0.5, 0.4, 0, 4.9, 18, bronze);
    k.sign('GREENACRE PARK', 7, 0.42, 0, 4.9, 18.22, 'transparent', '#e8dcc0', 92, 0);
    k.sign('A PRIVATELY OWNED PARK OPEN TO THE PUBLIC  ·  ESTABLISHED 1971', 5, 0.24, -7, 3.6, 18.32, 'transparent', '#e8dcc0', 52, 0);
    // the waterfall across the back, the brook down the west side
    waterWall(k, ctx, { x: 0, z: -17.6, w: 18, h: 7.6, pool: 2.8 });
    k.box(1.4, 0.3, 24.6, -8.0, -0.1, -2, brookM);
    for (const s of [-1, 1]) k.box(0.22, 0.34, 24.6, -8.0 + s * 0.8, 0.12, -2, granite);
    k.box(1.8, 0.06, 1.2, -8.0, 0.32, 3.5, wood);
    k.block(-8.9, -7.15, -14.3, 10.3);
    const TX0 = 3.6, TY = 0.9;
    k.box(5.2, TY, 23, 6.2, TY / 2, -0.5, brick);
    for (let j = 0; j < 3; j++) k.box(0.36, TY - 0.3 * j, 23, TX0 - 0.18 - j * 0.35, (TY - 0.3 * j) / 2, -0.5, granite);
    for (const z of [-12.3, 11.3]) { k.box(5.2, 1.2, 0.6, 6.2, 0.6, z, brick); k.box(4.6, 0.5, 0.4, 6.2, 1.4, z, ivy); k.block(3.4, 8.8, z - 0.3, z + 0.3); }
    for (const z of [-11, -5.5, 0, 5.5, 11]) k.box(0.16, 3.7, 0.16, 4.0, TY + 1.85, z, iron);
    for (const x of [4.0, 8.7]) k.box(0.26, 0.26, 23.4, x, TY + 3.7, -0.5, wood);
    for (let z = -11.7; z <= 11; z += 0.55) k.box(5.0, 0.06, 0.14, 6.35, TY + 3.85, z, wood);
    for (const z of [-8.5, -2.5, 3.5, 9.5]) { k.cyl(0.2, 0.5, 6.4, TY + 3.3, z, iron, 0.26, 10); k.cyl(0.18, 0.04, 6.4, TY + 3.03, z, heater, 0.18, 10); const l = k.point(6.4, TY + 2.8, z, 0xff9a4a, 3 + 12 * k.night, 7); if (!ctx.reduced) k.ticks.push((t) => { l.intensity = (3 + 12 * k.night) * (0.85 + 0.15 * Math.sin(t * 2.1 + z)); }); }
    // trees, chairs, tables, the people sitting and the people passing
    locust(k, -5.0, 0, -9, 9.2, 2.0, 1, 0x93b85a); locust(k, -3.2, 0, -1, 9.6, 1.9, 2, 0x93b85a); locust(k, -5.4, 0, 7, 8.8, 2.0, 3, 0x93b85a); locust(k, 2.4, 0, 3, 9.4, 1.9, 4, 0x93b85a);
    locust(k, 7.4, TY, -9.5, 8.2, 1.8, 5, 0x93b85a); locust(k, 7.4, TY, 4, 8.0, 1.8, 6, 0x93b85a);
    const seats: Seat[] = [];
    for (const [x, z, n] of [[-5.2, -5, 3], [-5.4, 1.2, 2], [-5.0, 10.6, 3], [1.8, -4, 3], [1.9, 7.8, 2], [1.7, 11.2, 2], [-1.5, -12, 2]]) seats.push(...cafeSet(k, x, 0, z, n, 11 + x * 3 + z, wire, top));
    for (const z of [-6.75, -2.25, 2.25, 6.75]) seats.push(...cafeSet(k, 6.5, TY, z, 3, 31 + z, wire, top));
    seated(k, seats, 5, 0.6);
    k.crowd([v(-16, 0.14, 20.8), v(-4, 0.14, 19.3), v(-1.4, 0, 15), v(-1.4, 0, 6), v(-0.9, 0, -3), v(-0.4, 0, -9), v(0.6, 0, -13.2)], 12, { seed: 41, speed: 0.6, spread: 0.9, animate: !ctx.reduced });
    k.crowd([v(-40, 0.14, 21), v(40, 0.14, 21)], 10, { seed: 42, speed: 1.0, spread: 1.6, animate: !ctx.reduced });
    leaves(k, ctx, 80, { x0: -8, x1: 8.5, z0: -13, z1: 15, top: 8 }, 12);
    placard(k, '"WATERFALL"', 3.2, 1.25, -13.6, 0.2);
    for (const z of [9, 0, -9]) lantern(k, -8.85, 4.6, z, PI / 2, k.night);
    lantern(k, 8.85, TY + 4.9, -11.5, -PI / 2, k.night);
    k.point(0, 7, 4, 0xffe6c0, 12 * k.night, 18);
    // the hang: two rows on the west ivy, a row over the terrace, two by the gate
    const mounts: Mount[] = [];
    for (let i = 0; i < 7; i++) { const z = 13 - i * 4.5; mounts.push({ position: v(-8.8, 3.3, z), rotation: PI / 2, target: v(-3.0, 3, z), width: 3.4, height: 2.3, style: 'black', wash: false }); }
    for (let i = 0; i < 6; i++) { const z = 10.75 - i * 4.5; mounts.push({ position: v(-8.8, 6.15, z), rotation: PI / 2, target: v(-3.0, 3, z), width: 3.0, height: 2.0, style: 'black', wash: false }); }
    for (let i = 0; i < 5; i++) { const z = -9 + i * 4.5; mounts.push({ position: v(8.8, TY + 3.25, z), rotation: -PI / 2, target: v(5.0, 3, z), width: 3.2, height: 2.2, style: 'oak', wash: false }); }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 7, 3.15, 17.65), rotation: PI, target: v(s * 6, 3, 13.5), width: 3.0, height: 1.9, style: 'black', wash: false });
    return {
      mounts, spawn: v(-1.2, 3, 15.6), look: v(0, 4.4, -17.6), eye: 3, bounds: [-8.5, 8.5, -14.0, 22.4], style: 'black',
      floorY: (x, z) => { if (z < -12.3 || z > 11.3) return 0; if (x > TX0) return TY; if (x > TX0 - 1.05) return (TY * (x - (TX0 - 1.05))) / 1.05; return 0; },
    };
  },
};

/* ---------------- 130 PALEY PARK ---------------- */
export const paley: RoomDef = {
  id: 'paley',
  name: 'Twelve honey locusts',
  area: 'PALEY PARK / EAST 53RD STREET',
  mood: 'Dappled noon',
  color: '#acc4a1',
  description: 'Four granite steps up from 53rd Street into the first vest pocket park: twelve honey locusts on a grid, ivy walls, wire chairs and marble tables, and the water wall drowning the traffic, a portrait in every tree bay.',
  signatures: 'The 1967 park by Zion and Breen, 42 by 100 feet, raised four steps above the sidewalk, twelve honey locusts on a twelve foot grid, ivy on both walls, a twenty foot water wall across the back, wire chairs and marble tables, a kiosk at the entrance.',
  build(k, ctx) {
    k.sky({ top: 0x5f93cf, horizon: 0xe9ece8, ground: 0x505a4a, fog: 0.0026, sun: { az: 0.4, el: 1.2, color: 0xfff6e4, size: 12 }, env: 1.0 });
    k.hemi(0xf4f8ff, 0x46523e, 1.3);
    k.sun(0xfff4dc, 2.6, 8, 70, 14, true, 50);
    const F = 0.8;
    const granite = k.pbr('ppGranite', X.ashlar(0x8e8c86, 72, 3), 0.35),
      pavers = k.pbr('ppPavers', X.pavers(0x9a9488, 73), 0.45),
      ivy = k.pbr('ivyWall', X.grass(0x3a5a2c, 64), 0.22, { roughness: 1 }),
      wire = k.flat(0xd6dad6, 0.7, 0.4),
      top = k.pbr('ppTable', X.marble(0xe8e4dc, 0x9a948a, 66), 0.6, { roughness: 0.3 }),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      bronze = k.flat(0x5a4530, 0.8, 0.4),
      glass = k.glass(0xdcecf2, 0.2, 0.05),
      warm = k.glow(0xffe0b0);
    // 53rd Street, the tall neighbours the park hides between, the block across
    avenue(k, { w: 14, len: 140, z: 29 });
    rowAcross(k, { z: 41, x0: -60, count: 13, face: -1, seed: 74, h: [18, 30] });
    cars(k, { z: 34.6, x0: -50, x1: 50, seed: 7 }); cars(k, { z: 23.4, x0: -46, x1: -10, seed: 8 }); cars(k, { z: 23.4, x0: 10, x1: 46, seed: 9 });
    blockFront(k, { x: -7.2, z0: 18, count: 5, face: 1, seed: 75, h: [24, 36] });
    blockFront(k, { x: 7.2, z0: 18, count: 5, face: -1, seed: 76, h: [24, 36] });
    k.box(30, 30, 12, 0, 15, -22.4, k.pbr('ppBack', X.brick(0x5a4038, 79), 0.28));
    k.skyline({ z: -120, count: 18, spacing: 9, scale: 2.8, base: -2, seed: 77, lit: 0.15, glow: 0.4, tint: 0x6e7684, rows: 1 });
    k.skyline({ z: 150, count: 18, spacing: 9, scale: 2.4, base: -2, seed: 78, lit: 0.12, glow: 0.3, tint: 0x7e8290, rows: 1 });
    k.prop('lamppost', -12, 0.14, 19.6, { height: 6, keepOut: 0.5 });
    k.prop('lamppost', 12, 0.14, 19.6, { height: 6, keepOut: 0.5 });
    k.prop('mailbox', -15.5, 0.14, 18.2, { height: 1.5, rotY: PI, keepOut: 0.6 });
    k.prop('tree', 20, 0.14, 20, { height: 6, keepOut: 0.6 });
    // the raised floor, the four steps, the piers with the bronze letters, the ivy walls
    k.box(13.4, F, 30.4, 0, F / 2, -0.2, pavers);
    for (let j = 1; j <= 3; j++) { const h = F - 0.2 * j; k.box(13.4, h, 0.6, 0, h / 2, 15 + 0.6 * j - 0.3, granite); }
    for (const s of [-1, 1]) {
      k.box(0.3, 9, 30.4, s * 6.65, 4.5, -0.2, ivy); k.block(s * 6.5, s * 7.8, -15.6, 15);
      k.box(0.7, 3.2, 2.6, s * 6.5, 1.6, 16.3, granite); k.block(s * 6.1, s * 7, 15, 17.6);
      k.box(0.7, 1.0, 2.6, s * 6.5, 3.3, 16.3, ivy);
    }
    k.sign('PALEY PARK', 2.2, 0.36, 6.5, 2.6, 17.63, 'transparent', '#d8c8a0', 92, 0);
    k.sign('SET ASIDE IN MEMORY OF SAMUEL PALEY', 2.2, 0.16, 6.5, 2.2, 17.63, 'transparent', '#d8c8a0', 44, 0);
    k.sign('FOR THE ENJOYMENT OF THE PUBLIC', 2.2, 0.16, 6.5, 2.0, 17.63, 'transparent', '#d8c8a0', 44, 0);
    k.box(0.06, 0.06, 2.2, 6.5, 2.85, 16.3, bronze);
    // the water wall across the whole back
    waterWall(k, ctx, { x: 0, z: -15.4, w: 13.4, h: 6.2, pool: 1.6, base: F });
    // twelve honey locusts on the grid
    let seed = 20;
    for (const x of [-4.0, 0, 4.0]) for (const z of [10.5, 4.5, -1.5, -7.5]) locust(k, x, F, z, 10.8, 1.7, seed++, 0xa4c65e);
    // the kiosk by the entrance
    const KX = -4.9, KZ = 13.4;
    k.box(3.4, 2.6, 2.6, KX, F + 1.3, KZ, k.flat(0x2a3a34, 0.3, 0.6));
    k.box(3.0, 1.1, 0.1, KX, F + 1.85, KZ + 1.32, glass);
    k.box(3.0, 0.9, 0.2, KX, F + 0.45, KZ + 1.35, k.pbr('ppKiosk', X.planks(0x6a4a30, 3, 80), 1.0));
    k.box(3.0, 0.5, 0.1, KX, F + 2.2, KZ + 1.36, warm);
    k.sign('ESPRESSO  ·  TEA  ·  PASTRIES', 2.8, 0.36, KX, F + 2.2, KZ + 1.42, 'transparent', '#1a1410', 78, 0);
    k.point(KX, F + 2.0, KZ + 0.6, 0xffd9a0, 8, 6);
    k.block(KX - 1.8, KX + 1.8, KZ - 1.4, KZ + 1.5);
    // tables under the trees, the walking lane down the west side
    const seats: Seat[] = [];
    for (const z of [11, 6.75, 2.25, -2.25, -6.75, -11]) seats.push(...cafeSet(k, 5.0, F, z, 3, 50 + z, wire, top));
    for (const z of [6.75, 2.25, -2.25, -6.75, -11]) seats.push(...cafeSet(k, -5.0, F, z, 2, 60 + z, wire, top));
    for (const z of [7.5, 1.5, -4.5, -10.5]) seats.push(...cafeSet(k, 2.0, F, z, 3, 70 + z, wire, top));
    seated(k, seats, 8, 0.62);
    k.crowd([v(-11, 0.14, 19.6), v(-2.0, 0.3, 17), v(-2.0, F, 14), v(-2.0, F, 4), v(-2.0, F, -6), v(-1.2, F, -12.2), v(2.6, F, -12.6)], 10, { seed: 43, speed: 0.55, spread: 0.7, animate: !ctx.reduced });
    k.crowd([v(-40, 0.14, 20), v(40, 0.14, 20)], 10, { seed: 44, speed: 1.0, spread: 1.6, animate: !ctx.reduced });
    leaves(k, ctx, 70, { x0: -6, x1: 6, z0: -12, z1: 13, top: 9, floor: F }, 13);
    placard(k, '"WATER"', 4.6, F + 1.25, -12.9, 0.2, 1.1);
    for (const s of [-1, 1]) for (const z of [8.8, -2.2, -11]) lantern(k, s * 6.5, F + 4.9, z, s < 0 ? PI / 2 : -PI / 2, k.night);
    for (const s of [-1, 1]) k.point(s * 4, F + 6, 0, 0xffe6c0, 10 * k.night, 16);
    // the hang: one portrait per tree bay on each wall, a second row above
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) { const z = 13 - i * 4.4; mounts.push({ position: v(s * 6.45, F + 3.3, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s < 0 && z === 13 ? -2.3 : s * 3.3, 3, z), width: 3.0, height: 2.2, style: 'black', wash: false }); }
      for (let i = 0; i < 5; i++) { const z = 10.8 - i * 4.4; mounts.push({ position: v(s * 6.45, F + 6.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 3.3, 3, z), width: 2.7, height: 1.9, style: 'black', wash: false }); }
    }
    return {
      mounts, spawn: v(1.5, 3, 19.8), look: v(0.3, 4.2, -15.4), eye: 3, bounds: [-6.2, 6.2, -13.2, 22], style: 'black',
      floorY: (_x, z) => (z <= 15 ? F : z < 16.8 ? F - ((z - 15) / 1.8) * (F - 0.14) : 0.14),
    };
  },
};

/* ---------------- 131 ST. MARK'S CHURCH IN-THE-BOWERY ---------------- */
/* a couched stone lion from primitives, facing +z */
function lion(k: Kit, x: number, z: number, stone: T.Material) {
  k.box(1.3, 0.9, 1.9, x, 0.45, z, stone);
  k.rounded(0.66, 0.6, 1.5, x, 1.25, z - 0.1, stone, 0.2);
  k.sphere(0.36, x, 1.45, z + 0.55, stone, 12);
  k.sphere(0.3, x, 1.85, z + 0.7, stone, 12);
  const mane = k.torus(0.3, 0.13, x, 1.85, z + 0.58, stone, 24); void mane;
  for (const s of [-1, 1]) k.box(0.2, 0.2, 0.7, x + s * 0.22, 1.05, z + 0.55, stone);
  k.curve([v(x + 0.2, 1.1, z - 0.85), v(x + 0.5, 1.0, z - 0.95), v(x + 0.6, 1.2, z - 0.7)], 0.05, stone, 10);
  k.keepOut.push({ x, z, r: 1.2 });
}
export const stmarks: RoomDef = {
  id: 'stmarksyard',
  name: 'Poetry in the yard',
  area: "ST. MARK'S CHURCH IN-THE-BOWERY",
  mood: 'East Village, a reading at eight',
  color: '#bdc5bb',
  description: 'Second Avenue at Tenth Street: the fieldstone church of 1799 under its 1828 steeple, the cast iron portico, the lions, the flat gravestones of the old Stuyvesant farm, then the plain white sanctuary set with folding chairs for the Poetry Project.',
  signatures: 'The fieldstone body, the Greek Revival steeple, the cast iron portico of 1854, two lions at the steps, the churchyard of flat slabs and the Stuyvesant vault, the iron fence on the avenue, the white sanctuary with folding chairs and a lectern.',
  build(k, ctx) {
    k.sky({ top: 0x5c8ecb, horizon: 0xe6d9c4, ground: 0x4a4a42, fog: 0.0026, sun: { az: 3.6, el: 0.42, color: 0xffe0b8, size: 16 }, haze: 0.3, env: 0.85 });
    k.hemi(0xf0e8ff, 0x3a3a34, 0.85);
    k.sun(0xffe6c0, 2.2, 22, 34, 46, true, 70);
    const fs = k.pbr('fieldstone', X.cobble(0x8f887b, 91), 1.7, { roughness: 0.95 }),
      cream = k.pbr('smCream', X.plaster(0xe9e3d4, 92), 0.5),
      white = k.pbr('smWhite', X.plaster(0xf2efe6, 93), 0.6),
      slate = k.pbr('smSlate', X.ashlar(0x3a3d42, 94, 6), 0.8, { roughness: 0.7 }),
      planks = k.pbr('smPlanks', X.planks(0x8a6a48, 5, 95), 1.0),
      grass = k.pbr('smGrass', X.grass(0x4e6e3c, 96), 0.15),
      gravel = k.pbr('smGravel', X.cobble(0xa39a86, 97), 1.1),
      brickY = k.pbr('smBrick', X.brick(0x6b4a3d, 98), 0.28),
      ivy = k.pbr('ivyWall', X.grass(0x3a5a2c, 64), 0.22, { roughness: 1 }),
      stone = k.pbr('smStone', X.ashlar(0xb5b0a4, 109, 5), 0.9, { roughness: 0.85 }),
      slab = k.flat(0x8f8a80, 0, 0.9),
      iron = k.flat(0x22272b, 0.7, 0.45),
      ironGreen = k.flat(0x33403a, 0.6, 0.5), portico = k.pbr('smPortico', X.plaster(0xd6cfbf, 108), 0.5),
      glass = k.glass(0xcfe0e6, 0.3, 0.08),
      wood = k.pbr('smDoor', X.planks(0x4a3020, 3, 99), 0.8),
      candle = k.glow(0xffd28a);
    // Second Avenue, the tenements either side, the block across
    avenue(k, { w: 14, len: 150, z: 32 });
    rowAcross(k, { z: 44, x0: -70, count: 15, face: -1, seed: 101, h: [14, 22] });
    cars(k, { z: 37.6, x0: -60, x1: 60, seed: 10 }); cars(k, { z: 26.4, x0: -60, x1: -8, seed: 11 }); cars(k, { z: 26.4, x0: 12, x1: 60, seed: 12 });
    blockFront(k, { x: -21, z0: 14, count: 4, face: 1, seed: 102, h: [16, 22] });
    blockFront(k, { x: 21, z0: 14, count: 4, face: -1, seed: 103, h: [16, 22] });
    k.skyline({ z: -120, count: 16, spacing: 9, scale: 2.0, base: -2, seed: 104, lit: 0.12, glow: 0.3, tint: 0x7e8290, rows: 1 });
    k.prop('lamppost', -6, 0.14, 22.8, { height: 6, keepOut: 0.5 });
    k.prop('lamppost', 8, 0.14, 22.8, { height: 6, keepOut: 0.5 });
    k.prop('hydrant', 13, 0.14, 21.5, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -13, 0.14, 21.5, { height: 1.5, rotY: PI, keepOut: 0.6 });
    // the yard: grass, gravel paths, the fence on the avenue, the neighbours' ivy walls
    k.box(44, 0.3, 44, 0, -0.15, -1, grass);
    k.box(4, 0.04, 6, 0, 0.02, 17.5, gravel);
    for (const s of [-1, 1]) k.box(2.4, 0.04, 40, s * 9.8, 0.02, -3, gravel);
    k.box(22, 0.04, 2.4, 0, 0.02, -25.4, gravel);
    for (const s of [-1, 1]) { k.rail(s * 11.1, 20, 17.8, iron, 1.7, 'x', 1.2); k.box(0.6, 2.4, 0.6, s * 2.2, 1.2, 20, stone); k.box(0.5, 0.5, 0.5, s * 2.2, 2.6, 20, stone); k.block(s * 1.9, s * 20.2, 19.8, 20.2); }
    for (const s of [-1, 1]) { k.box(0.5, 4.6, 42, s * 20.5, 2.3, -1, brickY); k.box(0.7, 0.9, 42, s * 20.5, 4.6, -1, ivy); k.block(s * 20.2, s * 21, -22, 20); }
    // gravestones: flat slabs and a few standing stones, the Stuyvesant vault against the east wall
    const rnd = X.mulberry(105);
    const slabs: T.Matrix4[] = [], heads: T.Matrix4[] = [];
    for (const s of [-1, 1]) for (let r = 0; r < 12; r++) for (let c = 0; c < 5; c++) {
      const x = s * (11 + c * 1.7), z = 11 - r * 2.7 + (rnd() - 0.5) * 0.4;
      if (Math.abs(z + 6) < 2 && s > 0 && c < 1) continue;
      if (rnd() > 0.82) { heads.push(new T.Matrix4().compose(v(x, 0.42, z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), (rnd() - 0.5) * 0.12), new T.Vector3(1, 1, 1))); if (Math.abs(x) < 14.6) k.keepOut.push({ x, z, r: 0.45 }); }
      else slabs.push(new T.Matrix4().makeTranslation(x, 0.07, z));
    }
    k.instances(new T.BoxGeometry(1.0, 0.14, 2.0), slab, slabs);
    k.instances(new T.BoxGeometry(0.7, 0.85, 0.12), slab, heads);
    k.box(2.6, 0.7, 1.6, 9.9, 0.35, -6, stone); k.box(2.8, 0.15, 1.8, 9.9, 0.75, -6, stone); k.keepOut.push({ x: 9.9, z: -6, r: 1.6 });
    k.sign('PETRUS STUYVESANT  ·  CAPTAIN GENERAL AND GOVERNOR IN CHIEF OF NEW NETHERLAND  ·  DIED 1672', 2.4, 0.3, 9.9, 0.84, -6, 'transparent', '#3a352c', 40, 0).rotation.set(-PI / 2, 0, 0);
    for (const [x, z] of [[-14, 15], [14, 15], [-14, -3], [14, -3], [-15.5, -20], [15.5, -20]]) { k.tree(x, 0, z, { h: 6.5, r: 2.6, seed: Math.round(x + z), leaf: 0x3f6b36 }); k.keepOut.push({ x, z, r: 0.45 }); }
    k.bench(-6, 16, PI / 2, k.pbr('smBench', X.planks(0x5d4939, 3, 106), 1.2), iron, 2.2);
    k.bench(6, 16, -PI / 2, k.pbr('smBench', X.planks(0x5d4939, 3, 106), 1.2), iron, 2.2);
    // the church: fieldstone body with arched windows cut through both skins, the roof, the tower, the spire
    const CF = 0.6; // the church floor above the yard
    const wall = (x: number, m: T.Material, th: number) => {
      for (const z of [-19, -13, -7, -1]) { const a = k.arch(2.2, 5.4, th, x, 1.6, z, m, false, 6 / 4.4); a.rotation.y = PI / 2; k.box(th, 1.6, 6, x, 0.8, z, m); k.box(th, 3.3, 6, x, 9.35, z, m); }
      for (const z of [-23, 3]) k.box(th, 11, 2, x, 5.5, z, m);
    };
    for (const s of [-1, 1]) { wall(s * 8.15, fs, 0.3); wall(s * 7.85, white, 0.3); k.block(s * 7.6, s * 8.4, -24.3, 4.3); for (const z of [-19, -13, -7, -1]) k.box(0.08, 5.3, 2.2, s * 8.0, 4.32, z, glass); }
    k.box(16.6, 11, 0.6, 0, 5.5, -24.05, fs); k.box(15.6, 11, 0.3, 0, 5.5, -23.6, white); k.block(-8.4, 8.4, -24.4, -23.4);
    for (const s of [-1, 1]) { k.box(5.2, 11, 0.6, s * 5.6, 5.5, 4, fs); k.box(4.8, 11, 0.3, s * 5.6, 5.5, 3.55, white); k.block(s * 3, s * 8.4, 3.6, 4.4); }
    for (const s of [-1, 1]) { k.box(1.2, 3.6, 0.6, s * 2.4, 1.8, 4, fs); k.block(s * 1.8, s * 3, 3.6, 4.4); }
    k.box(6, 7.4, 0.6, 0, 3.6 + 3.7, 4, fs);
    k.box(6, 7.4, 0.3, 0, 3.6 + 3.7, 3.55, white);
    const gable = (z: number) => { const sh = new T.Shape(); sh.moveTo(-8.6, 10.9); sh.lineTo(8.6, 10.9); sh.lineTo(0, 15.6); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }); g.translate(0, 0, -0.3); k.mesh(g, fs, 0, 0, z); };
    gable(-24.05); gable(4);
    for (const s of [-1, 1]) { const r = k.box(9.9, 0.32, 29.4, s * 4.25, 13.25, -10, slate); r.rotation.z = -s * 0.49; }
    k.box(0.5, 0.5, 29.6, 0, 15.75, -10, slate);
    // inside: wood floor, white plaster, the flat ceiling with its beams
    k.box(15.4, CF, 27.4, 0, CF / 2, -10, planks);
    k.box(15.6, 0.3, 27.6, 0, 9.65, -10, white);
    for (let z = -22; z <= 2; z += 3) k.box(15.6, 0.3, 0.3, 0, 9.4, z, wood);
    // the tower: vestibule, belfry with the bell, clock stage, spire
    for (const s of [-1, 1]) { k.box(0.6, 20, 6.6, s * 3, 10, 7, fs); k.block(s * 2.7, s * 3.3, 3.7, 10.3); }
    for (const s of [-1, 1]) { k.box(1.4, 3.6, 0.6, s * 2.3, 1.8, 10, fs); k.block(s * 1.6, s * 3, 9.7, 10.3); }
    k.box(6.6, 16.4, 0.6, 0, 3.6 + 8.2, 10, fs);
    k.box(6.6, 0.6, 6.6, 0, 20, 7, fs);
    k.box(5.4, CF, 5.4, 0, CF / 2, 7, planks);
    k.box(5.4, 0.3, 5.4, 0, 4.0, 7, white);
    for (const s of [-1, 1]) { const d = k.box(1.5, 3.3, 0.1, s * 1.55, CF + 1.65, 9.2, wood); d.rotation.y = s * PI / 2.2; }
    k.sign('THE POETRY PROJECT', 1.3, 0.3, 2.3, 2.6, 10.32, '#0d0d0d', '#f0f4f8', 90, 0, { border: true });
    k.sign('WEDNESDAY NIGHT READING SERIES  ·  8 PM  ·  ALL WELCOME', 1.3, 0.34, 2.3, 2.2, 10.32, '#0d0d0d', '#8899aa', 40, 0);
    k.moulding([[0, 0], [0.5, 0], [0.6, 0.2], [0.3, 0.4], [0, 0.5]], 7.2, 0, 19.9, 7, cream, 0);
    k.moulding([[0, 0], [0.5, 0], [0.6, 0.2], [0.3, 0.4], [0, 0.5]], 7.2, 0, 19.9, 7, cream, PI / 2);
    const BY = 20.6;
    for (const s of [-1, 1]) { const a = k.arch(1.6, 3.4, 0.4, 0, BY, 7 + s * 2.2, cream, false, 4.4 / 3.2); void a; const b = k.arch(1.6, 3.4, 0.4, s * 2.2, BY, 7, cream, false, 4.4 / 3.2); b.rotation.y = PI / 2; }
    k.box(4.4, 0.4, 4.4, 0, BY + 3.9, 7, cream);
    k.box(0.16, 0.16, 4.0, 0, BY + 3.2, 7, iron);
    k.prop('bell', 0, BY + 1.4, 7, { height: 1.7 }).then((o) => { if (!o || ctx.reduced) return; k.ticks.push((t) => { const swing = Math.max(0, Math.sin(t * 0.21)) ; o.rotation.z = 0.5 * swing * Math.sin(t * 2.6); }); });
    k.box(3.8, 2.6, 3.8, 0, BY + 5.4, 7, cream);
    for (const s of [-1, 1]) { const f = k.cyl(0.9, 0.1, 0, BY + 5.4, 7 + s * 1.92, k.flat(0xf4f0e6, 0, 0.6), 0.9, 24); f.rotation.x = PI / 2; const h = k.box(0.08, 0.7, 0.05, 0, BY + 5.65, 7 + s * 1.98, iron); void h; const h2 = k.box(0.5, 0.08, 0.05, 0.2, BY + 5.4, 7 + s * 1.98, iron); void h2; }
    k.mesh(new T.ConeGeometry(2.3, 12.5, 8), slate, 0, BY + 6.7 + 6.25, 7);
    k.box(0.12, 2.2, 0.12, 0, BY + 6.7 + 12.5 + 0.9, 7, iron);
    // the cast iron portico, the steps, the lions
    const PZ = 12.2;
    k.box(11, CF, 4.6, 0, CF / 2, PZ, stone);
    for (let j = 1; j <= 3; j++) { const h = CF - 0.15 * j; k.box(11, h, 0.6, 0, h / 2, 14.5 + 0.6 * (j - 1) + 0.3, stone); }
    for (const x of [-4.5, -1.5, 1.5, 4.5]) { k.cyl(0.16, 5.4, x, CF + 2.7, 14.2, ironGreen, 0.19, 12); k.box(0.5, 0.3, 0.5, x, CF + 5.45, 14.2, ironGreen); k.box(0.5, 0.12, 0.5, x, CF + 0.06, 14.2, ironGreen); k.keepOut.push({ x, z: 14.2, r: 0.4 }); }
    k.box(11.4, 0.8, 4.8, 0, CF + 6.0, PZ, portico); for (let x = -5.4; x <= 5.4; x += 0.45) k.box(0.2, 0.2, 4.9, x, CF + 5.7, PZ, portico);
    k.box(11.4, 0.2, 4.8, 0, CF + 6.5, PZ, slate);
    const ped = new T.Shape(); ped.moveTo(-5.7, 0); ped.lineTo(5.7, 0); ped.lineTo(0, 1.9); ped.closePath();
    k.mesh(new T.ExtrudeGeometry(ped, { depth: 0.4, bevelEnabled: false }), portico, 0, CF + 6.4, 14.3); k.box(11.6, 0.25, 0.5, 0, CF + 6.45, 14.5, ironGreen);
    for (const s of [-1, 1]) { k.sphere(0.2, s * 3, CF + 5.2, 14.4, candle, 10); k.point(s * 3, CF + 5.0, 14.6, 0xffd9a0, 6 + 16 * k.night, 12); }
    lion(k, -4.6, 16.4, stone); lion(k, 4.6, 16.4, stone);
    k.sign("ST. MARK'S CHURCH IN-THE-BOWERY  ·  1799", 4.2, 0.4, -6.5, 1.9, 18.6, '#0d0d0d', '#f0f4f8', 68, 0, { border: true });
    k.sign('SERVICES SUNDAY 11 AM  ·  THE POETRY PROJECT  ·  DANSPACE  ·  THE OLDEST SITE OF CONTINUOUS WORSHIP IN THE CITY', 4.2, 0.5, -6.5, 1.45, 18.6, '#0d0d0d', '#8899aa', 38, 0);
    for (const x of [-7.6, -5.4]) k.box(0.1, 1.9, 0.1, x, 0.95, 18.55, iron);
    // the sanctuary: folding chairs, the platform, the lectern under a spot, the readers on the back wall, candles at night
    const seatG = new T.BoxGeometry(0.44, 0.04, 0.44), backG = new T.BoxGeometry(0.44, 0.4, 0.03), legG = new T.BoxGeometry(0.03, 0.46, 0.03);
    const seats: T.Matrix4[] = [], backs: T.Matrix4[] = [], legs: T.Matrix4[] = [], sit: Seat[] = [];
    for (let r = 0; r < 17; r++) for (let x = -5.6; x <= 5.6; x += 0.56) {
      if (Math.abs(x) < 1.0) continue;
      const z = -1 - r; seats.push(new T.Matrix4().makeTranslation(x, CF + 0.46, z)); backs.push(new T.Matrix4().makeTranslation(x, CF + 0.68, z + 0.22));
      for (const [lx, lz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) legs.push(new T.Matrix4().makeTranslation(x + lx, CF + 0.23, z + lz));
      if (rnd() < 0.2) sit.push({ x, z, rotY: PI, y: CF });
    }
    const chairM = k.flat(0x2a2c30, 0.4, 0.5);
    k.instances(seatG, chairM, seats); k.instances(backG, chairM, backs); k.instances(legG, chairM, legs);
    seated(k, sit, 7, 1);
    k.block(-5.9, -1.0, -17.6, -0.5); k.block(1.0, 5.9, -17.6, -0.5);
    k.box(6, 0.3, 3, 0, CF + 0.15, -21.2, planks); k.keepOut.push({ x: 0, z: -21.2, r: 2.4 });
    k.box(0.6, 1.1, 0.5, 0, CF + 0.85, -20.6, wood); k.box(0.7, 0.05, 0.6, 0, CF + 1.42, -20.6, wood).rotation.x = 0.35;
    k.cyl(0.02, 1.4, 0.5, CF + 1.0, -20.4, iron, 0.02, 6); k.cyl(0.06, 0.16, 0.5, CF + 1.75, -20.4, iron, 0.03, 8);
    k.spot(0, 9.3, -16, 0, CF + 1.2, -20.6, 0xfff0d8, 160, 0.42, 0.6, 24);
    k.censusWall({ x: 0, y: 5.6, z: -23.4, rotY: 0, cols: 22, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(3200, 132), pieces: ctx.all, backing: k.flat(0x14161a, 0.3, 0.5) });
    k.sign('THE POETRY PROJECT  ·  READERS SINCE 1966', 6, 0.36, 0, 8.3, -23.4, 'transparent', '#0d0d0d', 70, 0);
    placard(k, '"LECTERN"', -2.2, CF + 1.2, -19.6, 0.4, 1.2);
    for (let i = 0; i < 8; i++) { const s = i < 4 ? -1 : 1, z = [-19, -13, -7, -1][i % 4]; k.cyl(0.05, 0.22, s * 7.5, CF + 1.65, z, candle, 0.05, 6); const l = k.point(s * 7.3, CF + 1.9, z, 0xffb060, 1.5 + 9 * k.night, 8); if (!ctx.reduced) k.ticks.push((t) => { l.intensity = (1.5 + 9 * k.night) * (0.8 + 0.2 * Math.sin(t * 9 + i * 2.1) * Math.sin(t * 3.3 + i)); }); }
    for (const s of [-1, 1]) k.point(s * 4, 8.5, -10, 0xfff0dc, 18, 16);
    k.point(0, 3.6, 7, 0xffe6c0, 10, 8);
    k.crowd([v(-14, 0.14, 22.6), v(0, 0.14, 21.6), v(0, 0, 18.4), v(-6.5, 0, 13.5), v(-10.5, 0, 6), v(-10.5, 0, -8), v(-9.6, 0, -19), v(0, 0, -26)], 16, { seed: 45, speed: 0.6, spread: 0.9, animate: !ctx.reduced });
    k.crowd([v(-50, 0.14, 21.5), v(50, 0.14, 21.5)], 12, { seed: 46, speed: 1.1, spread: 1.8, animate: !ctx.reduced });
    // the hang: the yard walls, then the sanctuary between the windows and either side of the door
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = 10 - i * 5.5; mounts.push({ position: v(s * 20.2, 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 16.5, 3, z), width: 3.2, height: 2.2, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (const z of [-16, -10, -4, 2.1]) mounts.push({ position: v(s * 7.68, CF + 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 6.6, 3, z), width: 2.7, height: 2.1, style: 'white', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 5.2, CF + 3.4, 3.38), rotation: PI, target: v(s * 4.5, 3, 0.6), width: 3.0, height: 2.1, style: 'white', wash: true });
    return {
      mounts, spawn: v(0, 3, 25.2), look: v(0, 9.5, 4), eye: 3, bounds: [-19.6, 19.6, -22.6, 27], style: 'white',
      floorY: (x, z) => { if (Math.abs(x) < 8 && z > -24 && z < 14.5) return CF; if (Math.abs(x) < 5.6 && z >= 14.5 && z < 16.3) return CF * (16.3 - z) / 1.8; return z > 20 ? 0.14 : 0; },
    };
  },
};

/* ---------------- 132 THE KINGS THEATRE, THE GRAND FOYER ---------------- */
export const kings: RoomDef = {
  id: 'kingsfoyer',
  name: 'Before the curtain',
  area: 'KINGS THEATRE / FLATBUSH AVENUE',
  mood: 'The grand foyer, doors at seven',
  color: '#c2a272',
  daylit: false,
  description: 'Flatbush Avenue under the marquee and the vertical sign, through the bronze doors and the low ticket lobby into the foyer: gilt plaster, pink marble, a coffered ceiling with chandeliers, the red carpet to the grand stair, the auditorium curtain glimpsed through an arch.',
  signatures: 'The 1929 Loew\'s Wonder Theatre by Rapp and Rapp, French Baroque after Versailles and the Paris Opera: the marquee and blade sign on Flatbush, the three storey foyer with gilt pilasters, pink marble columns, coffered ceilings, chandeliers, and the grand stair to the mezzanine.',
  build(k, ctx) {
    k.sky({ top: 0x1e2a4e, horizon: 0x8a6a70, ground: 0x14141a, fog: 0.003, sun: { az: 4.4, el: 0.08, color: 0xff9a60, size: 18 }, haze: 0.4, stars: 100, env: 0.7 });
    k.hemi(0xffe0c8, 0x2a2226, 0.6);
    k.sun(0xffb890, 1.2, -50, 18, 60, false, 80);
    const limestone = k.pbr('ktLimestone', X.ashlar(0xc8b998, 111, 3), 0.7),
      terra = k.pbr('ktTerra', X.plaster(0xd9c4a0, 112), 0.4),
      graniteD = k.pbr('ktGranite', X.ashlar(0x3a3a3c, 113, 3), 0.4, { roughness: 0.4 }),
      gilt = k.pbr('ktGilt', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 }),
      giltD = k.pbr('ktGiltD', X.gilt(0x9a7a3a), 2, { metalness: 0.8, roughness: 0.4 }),
      cream = k.pbr('ktCream', X.plaster(0xe8dcc4, 114), 0.4),
      pink = k.pbr('ktPink', X.marble(0xd8b4a8, 0x8a5a5a, 115), 0.4, { roughness: 0.25 }),
      floorM = k.pbr('ktFloor', X.marble(0xe2d8c8, 0x9a8a78, 116), 0.5, { roughness: 0.3 }),
      terrazzo = k.pbr('ktTerrazzo', X.terrazzo(0xc6c1b2, 117), 0.6),
      carpet = k.pbr('ktCarpet', X.carpet(0x7a1a22, 0xc79a4a), 0.5, { roughness: 0.95 }),
      velvet = k.pbr('ktVelvet', X.velvet(0x8a1420), 0.3, { roughness: 0.9 }),
      bronze = k.flat(0x6a4a2a, 0.85, 0.35),
      dark = k.flat(0x14090a, 0.4, 0.8),
      neon = k.glow(0xff4a3a),
      warm = k.glow(0xffe0b0),
      glassW = k.glass(0xffe0b0, 0.3, 0.1),
      mirror = k.flat(0x7c848c, 1, 0.08);
    // Flatbush Avenue: the block, the facade, the marquee, the blade sign
    const FZ = 14;
    avenue(k, { w: 18, len: 160, z: 30 });
    rowAcross(k, { z: 44, x0: -75, count: 16, face: -1, seed: 118, h: [10, 18] });
    cars(k, { z: 37.6, x0: -70, x1: 70, seed: 13 }); cars(k, { z: 22.4, x0: -70, x1: -18, seed: 14 }); cars(k, { z: 22.4, x0: 18, x1: 70, seed: 15 });
    rowAcross(k, { z: FZ, x0: -57, count: 4, face: 1, seed: 119, h: [10, 14] });
    rowAcross(k, { z: FZ, x0: 27, count: 4, face: 1, seed: 120, h: [10, 14] });
    k.skyline({ z: 170, count: 14, spacing: 10, scale: 1.8, base: -2, seed: 121, lit: 0.1, glow: 0.3, tint: 0x7e8290, rows: 1 });
    for (const s of [-1, 1]) k.box(4.4, 24, 64, s * 19.8, 12, FZ - 32, limestone);
    k.box(28.6, 18.6, 8, 0, 5.4 + 9.3, FZ - 4, limestone);
    k.box(28.6, 24, 56, 0, 12, FZ - 8 - 28, limestone);
    for (const s of [-1, 1]) k.box(12.7, 6, 0.4, s * 15.85, 3, FZ + 0.2, graniteD);
    for (let x = -20; x <= 20; x += 5) k.box(1.2, 18, 0.6, x, 15, FZ + 0.3, terra);
    k.arch(10, 9, 0.8, 0, 9, FZ + 0.4, terra, false, 0.7);
    k.box(9.6, 8.6, 0.1, 0, 13.4, FZ + 0.2, warm); for (const x of [-3.2, 0, 3.2]) k.box(0.3, 8.6, 0.2, x, 13.4, FZ + 0.28, terra); for (const y of [11, 13.8, 16.6]) k.box(9.6, 0.3, 0.2, 0, y, FZ + 0.28, terra); k.point(0, 13, FZ + 3, 0xffd9a0, 30, 16);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], 44.4, 0, 23, FZ + 0.05, terra, 0);
    for (let i = 0; i < 5; i++) { const ch = 'KINGS'[i], y = 22 - i * 2.5; k.box(2.6, 2.4, 1.0, -17, y, FZ + 3.4, dark); k.sign(ch, 2.2, 2.1, -17, y, FZ + 3.92, '#14090a', '#ff5a4a', 170, 0); k.sign(ch, 2.2, 2.1, -17, y, FZ + 2.88, '#14090a', '#ff5a4a', 170, PI); }
    for (const dx of [-1.4, 1.4]) k.mesh(new T.BoxGeometry(0.08, 13, 0.08), neon, -17 + dx, 17, FZ + 3.4);
    k.point(-17, 17, FZ + 6, 0xff5a4a, 50, 24);
    k.box(26, 2.4, 6.4, 0, 6.6, FZ + 3.2, dark);
    for (const y of [5.5, 7.7]) k.mesh(new T.BoxGeometry(26.2, 0.08, 6.6), neon, 0, y, FZ + 3.2);
    k.sign('KINGS', 8, 1.9, -8, 6.6, FZ + 6.45, '#14090a', '#ffe9b0', 190, 0, { border: true });
    k.sign('THE MUSEUM  ·  NEW YORKERS  ·  TONIGHT AT SEVEN', 15, 1.9, 4.5, 6.6, FZ + 6.45, '#14090a', '#ffe9b0', 96, 0, { border: true });
    for (const s of [-1, 1]) k.sign('KINGS', 5.6, 1.9, s * 13.05, 6.6, FZ + 3.2, '#14090a', '#ffe9b0', 170, s * PI / 2, { border: true });
    const bulbG = new T.SphereGeometry(0.1, 6, 5), bulbT: T.Matrix4[] = [];
    for (let x = -12.7; x <= 12.7; x += 0.6) for (const y of [5.3, 7.9]) bulbT.push(new T.Matrix4().makeTranslation(x, y, FZ + 6.42));
    for (let z = FZ + 0.4; z <= FZ + 6.2; z += 0.6) for (const s of [-1, 1]) bulbT.push(new T.Matrix4().makeTranslation(s * 13.05, 7.9, z));
    const bulbs = k.instances(bulbG, new T.MeshBasicMaterial({ color: 0xffffff }), bulbT);
    const bc = new T.Color(); const nb = bulbT.length;
    const chase = (t: number) => { for (let i = 0; i < nb; i++) bulbs.setColorAt(i, bc.set((Math.floor(t * 6) + i) % 3 === 0 ? 0xfff4c8 : 0x8a6a2a)); if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true; };
    chase(0); if (!ctx.reduced) k.ticks.push((t) => chase(t));
    for (let x = -10; x <= 10; x += 5) k.point(x, 5.2, FZ + 3.2, 0xffd9a0, 10, 8);
    for (let z = FZ + 0.4; z <= FZ + 6.2; z += 1.2) k.mesh(new T.BoxGeometry(24, 0.06, 0.06), warm, 0, 5.42, z);
    // the doors: five bays of bronze and glass, the leaves folded open, the box office windows either side
    for (const x of [-2, -6, 2, 6]) { k.box(1.0, 5.2, 0.6, x, 2.6, FZ, bronze); k.block(x - 0.5, x + 0.5, FZ - 0.3, FZ + 0.3); }
    k.box(20, 0.9, 0.6, 0, 5.05, FZ, bronze);
    for (const x of [-8, -4, 0, 4, 8]) for (const s of [-1, 1]) { const d = k.box(0.08, 4.4, 1.36, x + s * 1.42, 2.3, FZ - 0.72, glassW); void d; const f = k.box(0.12, 4.44, 0.08, x + s * 1.42, 2.3, FZ - 1.4, bronze); void f; }
    for (const s of [-1, 1]) { k.box(12.5, 6, 0.6, s * 15.75, 3, FZ, graniteD); k.block(s * 9.5, s * 22.2, FZ - 0.3, FZ + 0.3); k.box(3, 1.6, 0.1, s * 13, 2.2, FZ + 0.32, glassW); k.box(3.2, 0.5, 0.06, s * 13, 3.3, FZ + 0.33, warm); k.sign('BOX OFFICE', 2.8, 0.36, s * 13, 3.3, FZ + 0.37, 'transparent', '#1a1410', 90, 0); }
    // the ticket lobby: low, dark gilt, the census on the west wall, one work on the east
    k.box(28.6, 0.3, 8, 0, -0.15, FZ - 4, terrazzo);
    for (const s of [-1, 1]) k.box(0.6, 4.4, 8, s * 14, 2.2, FZ - 4, pink);
    k.box(28.6, 0.4, 8, 0, 4.4, FZ - 4, giltD);
    for (let x = -12; x <= 12; x += 4) for (let z = FZ - 7; z <= FZ - 1; z += 3) k.box(3.6, 0.12, 2.6, x, 4.15, z, cream);
    for (const x of [-7, 0, 7]) { k.point(x, 3.9, FZ - 4, 0xffe0b0, 16, 10); k.cyl(0.5, 0.06, x, 4.17, FZ - 4, warm, 0.5, 16); }
    k.censusWall({ x: -13.66, y: 2.5, z: FZ - 4, rotY: PI / 2, cols: 12, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(1800, 48), pieces: ctx.all, backing: giltD });
    k.sign('THE CAST', 2.4, 0.3, -13.62, 4.0, FZ - 4, 'transparent', '#f0e0b0', 80, PI / 2);
    // the foyer envelope: floor, carpet, walls, the portal from the lobby, the ceiling with its dome
    const Z0 = 6, Z1 = -38;
    k.box(28, 0.3, Z0 - Z1, 0, -0.15, (Z0 + Z1) / 2, floorM);
    k.box(6, 0.04, 32, 0, 0.02, -10, carpet);
    for (const s of [-1, 1]) { k.box(9, 16, 0.6, s * 9.5, 8, Z0, cream); k.block(s * 5, s * 14.3, Z0 - 0.3, Z0 + 0.3); }
    k.box(10.2, 11.8, 0.6, 0, 4.2 + 5.9, Z0, cream);
    k.moulding([[0, 0], [0.4, 0], [0.5, 0.2], [0.2, 0.4], [0, 0.5]], 10.4, 0, 4.2, Z0 - 0.3, gilt, 0);
    k.box(0.6, 16, Z0 - Z1, -14, 8, (Z0 + Z1) / 2, cream);
    k.box(0.6, 16, 14.1, 14, 8, Z0 - 7.05, cream); k.box(0.6, 16, 22.1, 14, 8, -15.9 - 11.05, cream); k.box(0.6, 7.5, 7.8, 14, 12.25, -12, cream);
    for (const s of [-1, 1]) k.box(0.7, 1.3, Z0 - Z1, s * 13.95, 0.65, (Z0 + Z1) / 2, pink);
    k.box(28, 11.2, 0.6, 0, 10.4, Z1, cream);
    k.box(28.6, 0.4, 17.2, 0, 16.2, Z0 - 8.6, cream); k.box(28.6, 0.4, 17.2, 0, 16.2, -29.4, cream); for (const s of [-1, 1]) k.box(9.5, 0.4, 9.6, s * 9.55, 16.2, -16, cream);
    for (let z = Z0 - 2; z > Z1; z -= 3.5) k.box(28, 0.4, 0.5, 0, 15.8, z, giltD);
    for (let x = -12; x <= 12; x += 3.5) k.box(0.5, 0.4, Z0 - Z1, x, 15.8, (Z0 + Z1) / 2, giltD);
    k.prop('coffered_dome', 0, 15.9, -16, { height: 5.3 }); for (const s of [-1, 1]) k.point(s * 4, 17.5, -16, 0xffe0b0, 40, 12);
    // pilasters, columns, the chandeliers, the auditorium arch and its curtain
    for (const s of [-1, 1]) for (const z of [3, -2.5, -8, -13.5, -19, -24.5]) { k.box(1.0, 14, 0.5, s * 13.7, 7.3, z, gilt); k.box(1.3, 0.6, 0.7, s * 13.7, 14.4, z, gilt); k.box(0.5, 0.5, 0.5, s * 13.4, 6.2, z, gilt); k.sphere(0.16, s * 13.3, 6.55, z, warm, 8); k.point(s * 12.9, 6.6, z, 0xffd9a0, 6, 6); }
    for (const s of [-1, 1]) k.moulding([[0, 0], [0.6, 0], [0.7, 0.25], [0.35, 0.45], [0.5, 0.7], [0, 0.85]], Z0 - Z1, s * 13.7, 15.0, (Z0 + Z1) / 2, gilt, s < 0 ? PI / 2 : -PI / 2);
    for (const s of [-1, 1]) for (const z of [0.25, -5.25, -10.75, -16.25, -21.75]) { if (s > 0 && z === -10.75) continue; k.box(0.2, 5.2, 4.8, s * 13.55, 4.3, z, giltD); }
    for (const s of [-1, 1]) for (const z of [-1, -9, -17]) { k.column(s * 8.5, 0, z, 13.8, 0.55, pink, false, gilt); k.keepOut.push({ x: s * 8.5, z, r: 1.0 }); }
    const chand: T.PointLight[] = [];
    for (const [z, r] of [[-1.5, 1.4], [-16, 2.2], [-30.5, 1.4]]) {
      k.beam(v(0, 16, z), v(0, 12.6, z), 0.05, gilt, 4);
      for (let i = 0; i < 5; i++) k.cyl(r - i * 0.24, 0.9, 0, 12.2 - i * 0.95, z, k.glass(0xffe8c0, 0.32, 0.15), (r - i * 0.24) * 0.5, 18);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; k.sphere(0.1, Math.cos(a) * r, 12.4, z + Math.sin(a) * r, warm, 6); }
      chand.push(k.point(0, 11.2, z, 0xffe6c0, 36, 26));
    }
    if (!ctx.reduced) k.ticks.push((t) => chand.forEach((l, i) => { l.intensity = 36 + 8 * Math.sin(t * 0.7 + i * 1.3); }));
    for (const s of [-1, 1]) for (const z of [-5, -20, -33]) k.point(s * 11, 10, z, 0xffd9a0, 18, 14);
    const ar = k.arch(6, 7.5, 0.6, 14, 0, -12, gilt, false, 0.65); ar.rotation.y = PI / 2;
    k.box(0.4, 9, 6.2, 17.2, 4.5, -12, dark); for (const dz of [-3.1, 3.1]) k.box(3.4, 9, 0.4, 15.5, 4.5, -12 + dz, dark); k.box(3.4, 0.4, 6.2, 15.5, 8.8, -12, dark); k.box(3.4, 0.3, 6.2, 15.5, -0.15, -12, carpet);
    const curtG = new T.BoxGeometry(0.5, 7.6, 5.6); curtG.translate(0, -3.8, 0);
    const curtain = k.mesh(curtG, velvet, 16.6, 7.9, -12, true);
    for (let z = -14.6; z <= -9.4; z += 0.8) k.box(0.7, 7.6, 0.4, 16.5, 4.1, z, velvet);
    k.point(15.6, 6, -12, 0xff5030, 24, 8);
    if (!ctx.reduced) k.ticks.push((t) => { curtain.scale.y = 1 + 0.02 * Math.sin(t * 0.8); curtain.scale.z = 1 + 0.015 * Math.sin(t * 0.55 + 1); });
    k.block(14, 17.4, -15.6, -8.4);
    placard(k, '"AUDITORIUM"', 12.6, 1.25, -8.2, -PI / 2, 1.5);
    // the grand stair, the landing, the mirror, the urns and torcheres
    const S0 = -26, S1 = -32, RISE = 5;
    for (let i = 1; i <= 25; i++) { const h = (i / 25) * RISE, z = S0 - (i - 0.5) * ((S0 - S1) / 25); k.box(28, h, (S0 - S1) / 25 + 0.02, 0, h / 2, z, carpet); }
    k.box(28, RISE, S1 - Z1, 0, RISE / 2, (S1 + Z1) / 2, carpet);
    k.box(28, 0.05, S1 - Z1, 0, RISE + 0.02, (S1 + Z1) / 2, floorM);
    k.box(6, 0.04, S1 - Z1, 0, RISE + 0.06, (S1 + Z1) / 2, carpet);
    for (const s of [-1, 1]) { k.prop('newel_urn', s * 6.2, 0, S0 + 0.6, { height: 2.2, keepOut: 0.7 }); k.prop('newel_urn', s * 6.2, RISE, S1 - 0.5, { height: 2.2, keepOut: 0.7 }); k.prop('torchere', s * 11.5, 0, S0 + 1.2, { height: 2.9, keepOut: 0.6 }); k.point(s * 11.5, 3.0, S0 + 1.2, 0xffd9a0, 14, 9); }
    for (const s of [-1, 1]) { const b = k.bar(v(s * 6.2, 1.0, S0), v(s * 6.2, RISE + 1.0, S1), 0.08, 0.08, gilt); void b; for (let i = 0; i <= 12; i++) { const u = i / 12; k.cyl(0.03, 0.95, s * 6.2, u * RISE + 0.5, S0 - u * (S0 - S1), gilt, 0.03, 6); } }
    k.box(8.4, 8.4, 0.3, 0, RISE + 4.6, Z1 + 0.35, gilt); k.box(7.6, 7.6, 0.12, 0, RISE + 4.6, Z1 + 0.52, mirror);
    k.sign('KINGS', 3, 0.7, 0, RISE + 9.4, Z1 + 0.32, 'transparent', '#f0e0b0', 130, 0);
    k.point(0, RISE + 5, Z1 + 3, 0xffe6c0, 30, 16);
    // the crowd at the doors and along the carpet
    k.crowd([v(-22, 0.14, 18.6), v(-8, 0.14, 17.2), v(-1, 0.14, 15), v(0, 0, 11), v(0.5, 0, 4), v(-1, 0, -6), v(1, 0, -16), v(0, 0, -24)], 18, { seed: 47, speed: 0.6, spread: 1.4, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x8a1a22, 0xd8d0c0, 0x1a2a4a, 0xc9a25a, 0x6a4a8a] });
    k.crowd([v(-60, 0.14, 19), v(60, 0.14, 19)], 14, { seed: 48, speed: 1.0, spread: 1.6, animate: !ctx.reduced });
    // the hang: gilt frames between the pilasters, two above, the stair walls, the landing, the lobby
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (const z of [0.25, -5.25, -10.75, -16.25, -21.75]) { if (s > 0 && z === -10.75) continue; mounts.push({ position: v(s * 13.42, 4.3, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 11.3, 3, z), width: 3.6, height: 2.8, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (const z of [-5.25, -16.25]) mounts.push({ position: v(s * 13.42, 9.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 11.3, 3, z), width: 3.2, height: 2.2, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 13.66, RISE * 0.5 + 3.8, -29), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 11.3, 3, -29), width: 3.4, height: 2.4, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 9.2, RISE + 3.8, Z1 + 0.34), rotation: 0, target: v(s * 7, 3, Z1 + 4.2), width: 3.8, height: 2.6, style: 'gilt', wash: true });
    mounts.push({ position: v(13.66, 3.1, FZ - 4), rotation: -PI / 2, target: v(10, 3, FZ - 4), width: 3.2, height: 2.0, style: 'gilt', wash: true });
    return {
      mounts, spawn: v(0, 3, 3.6), look: v(0, 7.5, Z1), eye: 3, bounds: [-13.4, 13.4, Z1 + 0.8, 20.6], style: 'gilt',
      floorY: (_x, z) => (z > S0 ? 0 : z < S1 ? RISE : ((S0 - z) / (S0 - S1)) * RISE),
    };
  },
};

/* ---------------- 133 LOEW'S VALENCIA ---------------- */
export const valencia: RoomDef = {
  id: 'valencia',
  name: 'A sky inside Jamaica',
  area: "LOEW'S VALENCIA / JAMAICA, QUEENS",
  mood: '1929, the clouds are on',
  color: '#b8a089',
  daylit: false,
  description: 'John Eberson\'s atmospheric theatre: the auditorium is a Spanish courtyard at night, tiled roofs and balconies along the walls, a proscenium arch and a red curtain at the end, and over it all a deep blue sky with stars and drifting clouds. The works hang on the courtyard walls.',
  signatures: 'The 1929 atmospheric auditorium: Spanish and Moorish courtyard facades with balconies, tiled roofs and corner towers, the proscenium arch, the Brenograph cloud machine and the star studded sky ceiling. A 1929 inspired exhibition, not the present congregation\'s interior.',
  build(k, ctx) {
    k.sky({ top: 0x050c26, horizon: 0x1c2a5c, ground: 0x07080c, fog: 0.0018, stars: 1400, haze: 0.2, env: 0.45 });
    k.hemi(0x6f86c8, 0x2a1c16, 0.95);
    const cream = k.pbr('lvCream', X.plaster(0xd9c6a4, 131), 0.45),
      plasterD = k.pbr('lvDark', X.plaster(0x8a7458, 132), 0.45),
      tile = k.pbr('lvTile', X.brick(0xa8563a, 133), 0.5, { roughness: 0.8 }),
      gilt = k.pbr('lvGilt', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      velvet = k.pbr('lvVelvet', X.velvet(0x8a1420), 0.3, { roughness: 0.9 }),
      carpet = k.pbr('lvCarpet', X.carpet(0x4a1a22, 0xc79a4a), 0.5, { roughness: 0.95 }),
      seatM = k.pbr('lvSeats', X.velvet(0x7a1a22), 0.4, { roughness: 0.95 }),
      planks = k.pbr('lvStage', X.planks(0x2a2018, 6, 134), 1.2, { roughness: 0.6 }),
      terrazzo = k.pbr('lvTerrazzo', X.terrazzo(0xb8b0a0, 135), 0.6),
      dark = k.flat(0x0e0c10, 0.3, 0.8),
      bronze = k.flat(0x6a4a2a, 0.85, 0.35),
      warm = k.glow(0xffd9a0),
      warmD = k.glow(0xd88a40),
      exitG = k.glow(0xff3a3a),
      ironB = k.flat(0x2a2a30, 0.6, 0.5);
    const RAKE = 0.07, floorAt = (z: number) => (z < 19 ? -(19 - z) * RAKE : 0);
    // the floor, raked to the pit
    for (let z = 19; z > -23; z -= 2) { const y = floorAt(z - 1); k.box(36.4, 0.3, 2.02, 0, y - 0.15, z - 1, carpet); }
    k.box(36.4, 0.3, 7, 0, -0.15, 22.5, carpet);
    const ramp = (z: number) => floorAt(z);
    // the seats, in two blocks, on the rake
    const seatG = new T.BoxGeometry(0.52, 0.62, 0.5); seatG.translate(0, 0.31, 0);
    const seatT: T.Matrix4[] = [];
    for (let r = 0; r < 38; r++) { const z = 17 - r * 0.95; for (let x = 1.6; x <= 14.6; x += 0.58) for (const s of [-1, 1]) seatT.push(new T.Matrix4().makeTranslation(s * x, ramp(z), z)); }
    k.instances(seatG, seatM, seatT);
    k.block(-14.9, -1.4, -19.7, 17.6); k.block(1.4, 14.9, -19.7, 17.6);
    // the courtyard walls: four houses a side, each on its own floor level, with an arcade, a balcony, a lit upper storey and a tiled roof
    const balT: T.Matrix4[] = [];
    for (const s of [-1, 1]) {
      k.box(0.6, 26, 54, s * 18.6, 6, 0, plasterD);
      for (let seg = 0; seg < 4; seg++) {
        const zc = 19.5 - seg * 13, base = ramp(zc) - 0.2, vary = (seg % 2) * 0.8;
        const arc = k.arcade(13, 5.6, 0.6, 2, 3.4, 4.6, s * 17.0, base, zc, cream, PI / 2); void arc;
        for (const dz of [-3.25, 3.25]) k.box(0.1, 4.0, 2.6, s * 18.2, base + 2.2, zc + dz, warmD);
        k.box(1.4, 0.3, 13, s * 16.5, base + 5.75, zc, cream);
        k.box(1.6, 0.14, 13.2, s * 16.4, base + 5.95, zc, tile);
        for (let z = zc - 6.2; z <= zc + 6.2; z += 0.42) balT.push(new T.Matrix4().makeTranslation(s * 15.85, base + 6.45, z));
        k.box(0.1, 0.1, 13, s * 15.85, base + 6.95, zc, bronze);
        k.box(0.6, 5.6 + vary, 13, s * 17.5, base + 5.9 + (5.6 + vary) / 2, zc, seg % 2 ? cream : plasterD);
        for (const dz of [-4.2, 0, 4.2]) k.box(0.1, 1.7, 1.1, s * 17.16, base + 8.7, zc + dz, warm);
        for (const dz of [-4.2, 0, 4.2]) k.box(0.16, 1.9, 1.3, s * 17.14, base + 8.7, zc + dz, ironB);
        const roofY = base + 11.5 + vary;
        const roof = k.box(2.6, 0.26, 13.4, s * 16.9, roofY + 0.5, zc, tile); roof.rotation.z = s * 0.42;
        k.box(0.6, 3, 13, s * 18.2, roofY + 1.6, zc, plasterD);
        k.point(s * 15.5, base + 4.2, zc, 0xffc070, 22, 14);
      }
      // the corner tower by the proscenium
      const tz = -23.5, tb = ramp(tz) - 0.2;
      k.box(4.2, 18, 4.2, s * 15.6, tb + 9, tz, cream);
      for (const y of [tb + 5, tb + 9.5, tb + 14]) k.box(0.1, 1.6, 0.9, s * 13.44, y, tz, warm);
      k.mesh(new T.ConeGeometry(3.2, 3.2, 4), tile, s * 15.6, tb + 19.6, tz).rotation.y = PI / 4;
      k.block(s * 13.4, s * 18, tz - 2.2, tz + 2.2);
    }
    k.instances(new T.CylinderGeometry(0.06, 0.08, 0.9, 6), cream, balT);
    // the proscenium, the pit rail, the apron, the curtain that breathes
    const PZ = -26, PB = ramp(-20) - 0.2;
    const pro = k.arch(20, 15, 2, 0, PB, PZ, gilt, false, 0.92); void pro;
    k.box(37, 8, 2, 0, PB + 17 + 4, PZ, plasterD); k.box(37, 0.5, 0.3, 0, PB + 20.5, PZ + 1.1, gilt); for (let x = -15; x <= 15; x += 5) k.box(0.1, 1.2, 0.8, x, PB + 18.6, PZ + 1.05, warmD);
    for (const s of [-1, 1]) { k.box(5.5, 16.9, 0.4, s * 15, PB + 8.45, PZ + 1.2, plasterD); for (let y = 2; y < 15; y += 1.1) k.box(4.6, 0.25, 0.1, s * 15, PB + y, PZ + 1.45, gilt); }
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], 37, 0, PB + 17, PZ + 1.0, gilt, 0);
    k.box(24, 1.4, 5, 0, PB + 0.3, PZ + 1.5, planks);
    k.rail(0, PZ + 3.9, 30, bronze, 1.0, 'x', 1.5); k.block(-18, 18, PZ + 3.5, PZ + 4.3);
    k.box(30, 10, 4, 0, PB + 1 - 5, PZ + 1.5, dark);
    k.box(22, 1.2, 0.5, 0, PB + 14.6, PZ - 0.8, gilt);
    const curtG = new T.BoxGeometry(22, 14.2, 0.6); curtG.translate(0, -7.1, 0);
    const curtain = k.mesh(curtG, velvet, 0, PB + 15.0, PZ - 1.2, true);
    for (let x = -10.5; x <= 10.5; x += 1.0) k.box(0.7, 14, 0.5, x, PB + 8, PZ - 1.0, velvet);
    for (let i = 0; i < 5; i++) k.spot(-8 + i * 4, PB + 18, PZ + 10, -8 + i * 4, PB + 6, PZ - 1, 0xffd9a0, 90, 0.35, 0.6, 30);
    if (!ctx.reduced) k.ticks.push((t) => { curtain.scale.y = 1 + 0.018 * Math.sin(t * 0.7); curtain.scale.x = 1 + 0.01 * Math.sin(t * 0.45 + 1); });
    // the rear wall with three doors into the lobby, the exit signs, the lobby with its ticket board
    const RZ = 26;
    for (const x of [-15.5, -5, 5, 15.5]) k.box(7, 14, 0.6, x, 7, RZ, plasterD);
    for (const x of [-10, 0, 10]) { k.box(3.6, 10.6, 0.6, x, 3.4 + 5.3, RZ, plasterD); k.box(3.2, 0.4, 0.3, x, 3.55, RZ + 0.1, exitG); }
    k.sign('EXIT', 1.2, 0.36, -10, 3.55, RZ - 0.32, 'transparent', '#ffffff', 100, PI); k.sign('"EXIT"', 1.4, 0.36, 0, 3.55, RZ - 0.32, 'transparent', '#ffffff', 100, PI); k.sign('EXIT', 1.2, 0.36, 10, 3.55, RZ - 0.32, 'transparent', '#ffffff', 100, PI);
    for (const x of [-15.5, -5, 5, 15.5]) k.block(x - 3.5, x + 3.5, RZ - 0.3, RZ + 0.3);
    k.box(38, 0.3, 6, 0, -0.15, RZ + 3, terrazzo);
    k.box(38, 0.4, 6, 0, 4.6, RZ + 3, plasterD);
    for (const s of [-1, 1]) k.box(0.6, 4.8, 6, s * 19, 2.4, RZ + 3, plasterD);
    k.box(38, 4.8, 0.6, 0, 2.4, RZ + 6, plasterD);
    k.censusWall({ x: 0, y: 2.5, z: RZ + 5.66, rotY: PI, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(6200, 150), pieces: ctx.all, backing: gilt });
    k.sign('TONIGHT  ·  THE NEW YORKERS  ·  ALL SEATS 25 CENTS', 8, 0.5, 0, 4.2, RZ + 5.62, 'transparent', '#f0e0b0', 80, PI);
    for (const x of [-12, 0, 12]) k.point(x, 4.2, RZ + 3, 0xffe0b0, 14, 10);
    for (const x of [-15.5, -5, 5, 15.5]) { k.point(x, 6.5, RZ - 1.6, 0xffc890, 18, 12); k.box(0.5, 0.5, 0.3, x, 6.0, RZ - 0.35, warm); }
    k.box(36, 14, 0.6, 0, 7 + 4.6, RZ + 6, plasterD);
    // the sky: the dome above the walls is the real sky, then the twinkling stars and the clouds on the machine
    const starN = 260, starT: T.Matrix4[] = [], rs = X.mulberry(136), starA: number[] = [];
    for (let i = 0; i < starN; i++) { const az = rs() * PI * 2, el = 0.35 + rs() * 1.2, r = 70; const p = v(Math.cos(az) * Math.cos(el) * r, Math.sin(el) * r + 4, Math.sin(az) * Math.cos(el) * r); starA.push(rs() * PI * 2); starT.push(new T.Matrix4().compose(p, new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(p, v(0, 6, 0), new T.Vector3(0, 1, 0))), new T.Vector3(1, 1, 1))); }
    const stars = k.instances(new T.PlaneGeometry(0.45, 0.45), new T.MeshBasicMaterial({ color: 0xeaf0ff, transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide }), starT);
    const cloudN = 9, cloudT: T.Matrix4[] = [], cx: number[] = [], cz: number[] = [];
    for (let i = 0; i < cloudN; i++) { cx.push(-60 + i * 14 + rs() * 8); cz.push(-70 + rs() * 90); cloudT.push(new T.Matrix4().compose(v(cx[i], 26 + rs() * 10, cz[i]), new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), -PI / 2), new T.Vector3(1 + rs(), 1 + rs(), 1))); }
    const clouds = k.instances(new T.PlaneGeometry(26, 14), new T.MeshBasicMaterial({ map: X.pool(), color: 0xc4cfe8, transparent: true, opacity: 0.6, depthWrite: false, side: T.DoubleSide }), cloudT);
    if (!ctx.reduced) {
      const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), sc = new T.Vector3();
      k.ticks.push((t, dt) => {
        for (let i = 0; i < starN; i++) { stars.getMatrixAt(i, m); m.decompose(p, q, sc); const s = 0.7 + 0.5 * Math.max(0, Math.sin(t * 1.7 + starA[i])); sc.set(s, s, 1); m.compose(p, q, sc); stars.setMatrixAt(i, m); }
        stars.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < cloudN; i++) { clouds.getMatrixAt(i, m); m.decompose(p, q, sc); p.x += 0.6 * Math.min(dt, 0.1); if (p.x > 70) p.x = -70; m.compose(p, q, sc); clouds.setMatrixAt(i, m); }
        clouds.instanceMatrix.needsUpdate = true;
      });
    }
    k.point(0, 14, 0, 0x8a9ee0, 16, 40); for (const z of [14, 2, -10]) for (const s of [-1, 1]) k.point(s * 8, 9, z, 0xffd0a0, 22, 18);
    k.crowd([v(-13, 0, 22), v(13, 0, 22)], 10, { seed: 49, speed: 0.4, spread: 1.6, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x8a1a22, 0xd8d0c0, 0x1a2a4a] });
    // the hang: the piers of the arcades, the upper storeys of the houses, the organ grilles
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) {
      for (const z of [13, 6.5, 0, -6.5, -13]) mounts.push({ position: v(s * 16.68, ramp(z) + 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 15.6, 3, z), width: 2.5, height: 1.9, style: 'oak', wash: true });
      for (const zc of [19.5, 6.5, -6.5, -19.5]) mounts.push({ position: v(s * 17.16, ramp(zc) + 8.9 + ((zc === 6.5 || zc === -19.5) ? 0.8 : 0), zc), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, zc), width: 3.2, height: 2.3, style: 'gilt', wash: true, tilt: 0.25 });
      mounts.push({ position: v(s * 15, PB + 4.4, PZ + 1.52), rotation: 0, target: v(s * 13.5, 3, PZ + 5.2), width: 4.0, height: 2.9, style: 'gilt', wash: true });
    }
    return {
      mounts, spawn: v(0, 3, 22.5), look: v(0, 6, PZ), eye: 3, bounds: [-17.8, 17.8, PZ + 4.5, RZ + 5.2], style: 'gilt',
      floorY: (_x, z) => (z > RZ ? 0 : ramp(z)),
    };
  },
};
