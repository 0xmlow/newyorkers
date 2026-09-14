/* Rooms 129 to 133: Greenacre Park, Paley Park, St. Mark's in-the-Bowery, the Kings Theatre foyer, Loew's Valencia.
   Real places first: the street, the block, the facade, the door, then the room and the hang. */
import * as T from 'three';
import * as X from '../textures';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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
  // the churn at the foot: white water boiling where the sheet lands, one instanced mesh
  const fn = Math.round(w * 2.6), fr = X.mulberry(fn + 7), fst: { x: number; z: number; p: number; s: number }[] = [], fm: T.Matrix4[] = [];
  for (let i = 0; i < fn; i++) { const s = { x: x - w / 2 + 0.3 + fr() * (w - 0.6), z: z + 0.55 + fr() * 0.8, p: fr() * PI * 2, s: 0.6 + fr() * 0.8 }; fst.push(s); fm.push(new T.Matrix4().compose(v(s.x, base + 0.45, s.z), new T.Quaternion(), v(s.s, s.s * 0.6, s.s))); }
  const foam = k.instances(new T.IcosahedronGeometry(0.2, 0), new T.MeshStandardMaterial({ color: 0xf2f8fa, roughness: 0.5, transparent: true, opacity: 0.8, depthWrite: false }), fm);
  foam.castShadow = false;
  if (!ctx.reduced) {
    const m = new T.Matrix4(), fq = new T.Quaternion(), fe = new T.Euler(), fp = new T.Vector3(), fsc = new T.Vector3();
    k.ticks.push((t, dt) => {
      const d = Math.min(dt, 0.1);
      for (let i = 0; i < n; i++) { const a = st[i]; a.y -= a.s * d; if (a.y < base + 0.4) a.y = base + h - 0.1; m.makeTranslation(a.x + Math.sin(t * 3 + i) * 0.02, a.y, z + 0.46); rib.setMatrixAt(i, m); }
      rib.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < fn; i++) { const f = fst[i], k2 = 0.5 + 0.5 * Math.sin(t * 4.3 + f.p), sc = f.s * (0.55 + 0.7 * k2); fq.setFromEuler(fe.set(t * 0.7 + f.p, t * 1.1 + f.p, 0)); m.compose(fp.set(f.x, base + 0.38 + 0.14 * k2, f.z), fq, fsc.set(sc, sc * 0.6, sc)); foam.setMatrixAt(i, m); }
      foam.instanceMatrix.needsUpdate = true;
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
function leaves(k: Kit, ctx: RoomCtx, n: number, b: { x0: number; x1: number; z0: number; z1: number; top: number; floor?: number; around?: { x: number; z: number; r: number }[] }, seed = 9) {
  const rnd = X.mulberry(seed), floor = b.floor ?? 0;
  const spot = (p: T.Vector3) => { if (b.around) { const t = b.around[Math.floor(rnd() * b.around.length)]; p.x = t.x + (rnd() - 0.5) * 2 * t.r; p.z = t.z + (rnd() - 0.5) * 2 * t.r; } else { p.x = b.x0 + rnd() * (b.x1 - b.x0); p.z = b.z0 + rnd() * (b.z1 - b.z0); } return p; };
  const mats: T.Matrix4[] = [], sp = new T.Vector3();
  for (let i = 0; i < n; i++) { spot(sp); mats.push(new T.Matrix4().makeTranslation(sp.x, floor + rnd() * b.top, sp.z)); }
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
      if (p.y < floor + 0.04) { p.y = floor + b.top * (0.7 + 0.3 * rnd()); spot(p); }
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

/* ---------- shared: sparrows, dappled sun, trickles, the runnel, the stained glass ---------- */
/* House sparrows: one instanced mesh. They hop and peck inside a box, and now and then one flies across. */
function sparrows(k: Kit, ctx: RoomCtx, n: number, b: { x0: number; x1: number; z0: number; z1: number }, floor: (x: number, z: number) => number, seed = 17) {
  const body = new T.SphereGeometry(0.075, 8, 6); body.scale(1, 0.82, 1.5);
  const head = new T.SphereGeometry(0.048, 8, 6); head.translate(0, 0.055, 0.09);
  const tail = new T.BoxGeometry(0.06, 0.014, 0.1); tail.rotateX(0.35); tail.translate(0, 0.025, -0.14);
  const beak = new T.ConeGeometry(0.014, 0.04, 4); beak.rotateX(PI / 2); beak.translate(0, 0.05, 0.15);
  const g = mergeGeometries([body, head, tail, beak])!; g.translate(0, 0.06, 0);
  const rnd = X.mulberry(seed), up = new T.Vector3(0, 1, 0), one = new T.Vector3(1, 1, 1);
  const rx = () => b.x0 + rnd() * (b.x1 - b.x0), rz = () => b.z0 + rnd() * (b.z1 - b.z0);
  const st = Array.from({ length: n }, () => { const x = rx(), z = rz(); return { x, z, fx: x, fz: z, tx: x, tz: z, yaw: rnd() * PI * 2, ph: rnd() * 10, fly: -1, wait: 3 + rnd() * 12 }; });
  const inst = k.instances(g, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), st.map((s) => new T.Matrix4().compose(v(s.x, floor(s.x, s.z), s.z), new T.Quaternion().setFromAxisAngle(up, s.yaw), one)));
  const c = new T.Color();
  for (let i = 0; i < n; i++) inst.setColorAt(i, c.set([0x7b5b3e, 0x8a6a48, 0x6a5040, 0x9a8a70][i % 4]));
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  inst.castShadow = false;
  if (ctx.reduced) return;
  const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ'), p = new T.Vector3();
  k.ticks.push((_t, dt) => {
    const d = Math.min(dt, 0.1);
    for (let i = 0; i < n; i++) {
      const s = st[i];
      let y: number, pitch = 0;
      if (s.fly >= 0) {
        s.fly = Math.min(1, s.fly + d / 1.8);
        const u = s.fly, uu = u * u * (3 - 2 * u);
        s.x = s.fx + (s.tx - s.fx) * uu; s.z = s.fz + (s.tz - s.fz) * uu;
        y = floor(s.x, s.z) + Math.sin(u * PI) * 2.4;
        s.yaw = Math.atan2(s.tx - s.fx, s.tz - s.fz);
        if (u >= 1) { s.fly = -1; s.wait = 4 + rnd() * 12; }
      } else {
        const before = s.ph % 0.9;
        s.ph += d;
        const hop = s.ph % 0.9;
        if (hop < before) s.yaw += (rnd() - 0.5) * 1.8;
        if (hop < 0.22) { y = floor(s.x, s.z) + Math.sin((hop / 0.22) * PI) * 0.07; s.x += Math.sin(s.yaw) * d * 0.45; s.z += Math.cos(s.yaw) * d * 0.45; }
        else { y = floor(s.x, s.z); pitch = hop > 0.45 && hop < 0.7 ? 0.55 : 0; }
        s.x = Math.min(b.x1, Math.max(b.x0, s.x)); s.z = Math.min(b.z1, Math.max(b.z0, s.z));
        s.wait -= d;
        if (s.wait < 0) { s.fx = s.x; s.fz = s.z; s.tx = rx(); s.tz = rz(); s.fly = 0; }
      }
      q.setFromEuler(e.set(pitch, s.yaw, 0)); m.compose(p.set(s.x, y, s.z), q, one); inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });
}
/* Sun through the leaves: soft pools of light on the floor that sway with the canopy. Daytime only. */
function dapple(k: Kit, ctx: RoomCtx, n: number, b: { x0: number; x1: number; z0: number; z1: number }, y: number, seed = 23) {
  if (k.night > 0.75) return;
  const rnd = X.mulberry(seed), qf = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), -PI / 2);
  const st = Array.from({ length: n }, () => ({ x: b.x0 + rnd() * (b.x1 - b.x0), z: b.z0 + rnd() * (b.z1 - b.z0), s: 0.5 + rnd() * 0.9, p: rnd() * 6 }));
  const inst = k.instances(new T.PlaneGeometry(1.2, 1.2), new T.MeshBasicMaterial({ map: X.pool(), color: 0xfff0c0, transparent: true, opacity: 0.5 * (1 - k.night), depthWrite: false, blending: T.AdditiveBlending }), st.map((s) => new T.Matrix4().compose(v(s.x, y, s.z), qf, v(s.s, s.s, 1))));
  inst.castShadow = inst.receiveShadow = false;
  if (ctx.reduced) return;
  const m = new T.Matrix4(), p = new T.Vector3(), sc = new T.Vector3();
  k.ticks.push((t) => {
    for (let i = 0; i < n; i++) { const s = st[i], w = s.s * (0.85 + 0.15 * Math.sin(t * 1.1 + s.p)); m.compose(p.set(s.x + 0.25 * Math.sin(t * 0.6 + s.p), y, s.z + 0.2 * Math.cos(t * 0.45 + s.p * 1.3)), qf, sc.set(w, w, 1)); inst.setMatrixAt(i, m); }
    inst.instanceMatrix.needsUpdate = true;
  });
}
/* Trickles of water sliding down the foot of a wall that faces -x (x is the face), in a band from y0 to y1. */
function trickles(k: Kit, ctx: RoomCtx, x: number, z0: number, z1: number, y0: number, y1: number, n: number, seed = 31) {
  const rnd = X.mulberry(seed), q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -PI / 2), one = new T.Vector3(1, 1, 1);
  const st = Array.from({ length: n }, () => ({ z: z0 + rnd() * (z1 - z0), y: y0 + rnd() * (y1 - y0), s: 0.25 + rnd() * 0.35 }));
  const inst = k.instances(new T.PlaneGeometry(0.07, 0.55), new T.MeshBasicMaterial({ map: streak(), color: 0xe8f4f8, transparent: true, opacity: 0.6, depthWrite: false, side: T.DoubleSide }), st.map((s) => new T.Matrix4().compose(v(x, s.y, s.z), q, one)));
  inst.castShadow = inst.receiveShadow = false;
  if (ctx.reduced) return;
  const m = new T.Matrix4(), p = new T.Vector3();
  k.ticks.push((_t, dt) => {
    for (const [i, s] of st.entries()) { s.y -= s.s * Math.min(dt, 0.1); if (s.y < y0) s.y = y1; m.compose(p.set(x, s.y, s.z), q, one); inst.setMatrixAt(i, m); }
    inst.instanceMatrix.needsUpdate = true;
  });
}
/* A flowing water surface: light ripples on a texture that scrolls along the channel. */
function runnel(k: Kit, ctx: RoomCtx, x: number, y: number, z: number, w: number, len: number, speed = 0.35) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2;
  const rnd = X.mulberry(71);
  for (let i = 0; i < 12; i++) { const yy = rnd() * 128; g.beginPath(); g.moveTo(rnd() * 20, yy); g.quadraticCurveTo(32, yy + 6, 44 + rnd() * 20, yy + 1); g.stroke(); }
  const tex = new T.CanvasTexture(c); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(1, len / 2);
  const o = k.mesh(new T.PlaneGeometry(w, len), new T.MeshBasicMaterial({ map: tex, color: 0xd8eef4, transparent: true, opacity: 0.45, depthWrite: false }), x, y, z, true);
  o.rotation.x = -PI / 2;
  if (!ctx.reduced) k.ticks.push((_t, dt) => { tex.offset.y -= speed * Math.min(dt, 0.1); });
  return o;
}
/* Abstract stained glass: colored panes and lead lines, one canvas shared by every window that uses it. */
let stainedTex: T.CanvasTexture | null = null;
function stained() {
  if (stainedTex) return stainedTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d')!, rnd = X.mulberry(1978), cols = ['#5a2a7a', '#e8e0c8', '#2f6a3a', '#a8242a', '#2a4a9a', '#d8a030'];
  g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 70; i++) { g.fillStyle = cols[Math.floor(rnd() * cols.length)]; const w = 8 + rnd() * 40, h = 8 + rnd() * 60; g.fillRect(rnd() * 128 - w / 2, rnd() * 256 - h / 2, w, h); }
  g.strokeStyle = '#141414'; g.lineWidth = 3;
  for (let i = 0; i < 22; i++) { g.beginPath(); g.moveTo(rnd() * 128, rnd() * 256); g.lineTo(rnd() * 128, rnd() * 256); g.stroke(); }
  stainedTex = new T.CanvasTexture(c); stainedTex.colorSpace = T.SRGBColorSpace;
  return stainedTex;
}
/* A theatre organ console, static: body, hood, four stepped manuals, stop rail, pedals and bench. The player's side faces local +z. */
function organConsole(k: Kit, x: number, y: number, z: number, rotY: number, m: { body: T.Material; trim: T.Material; keys: T.Material; black: T.Material; stops: T.Material }) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const bx = (w: number, h: number, d: number, lx: number, ly: number, lz: number, mat: T.Material) => { const o = k.box(w, h, d, x + lx * c + lz * s, y + ly, z - lx * s + lz * c, mat); o.rotation.y = rotY; return o; };
  bx(2.4, 1.0, 1.2, 0, 0.5, -0.1, m.body);
  bx(2.5, 0.08, 1.3, 0, 1.02, -0.1, m.trim);
  bx(2.4, 0.7, 0.7, 0, 1.4, -0.4, m.body);
  const hood = k.cyl(0.36, 2.44, x - 0.4 * s, y + 1.75, z - 0.4 * c, m.trim, 0.36, 16); hood.rotation.set(0, rotY, PI / 2);
  for (const sx of [-1, 1]) { bx(0.1, 0.75, 0.9, sx * 1.2, 1.35, 0.1, m.trim); k.torus(0.2, 0.05, x + sx * 1.26 * c + 0.3 * s, y + 1.2, z - sx * 1.26 * s + 0.3 * c, m.trim, 16).rotation.y = rotY + PI / 2; }
  for (let j = 0; j < 4; j++) { bx(1.9, 0.045, 0.15, 0, 1.06 + j * 0.09, 0.45 - j * 0.12, m.keys); bx(1.9, 0.02, 0.16, 0, 1.03 + j * 0.09, 0.45 - j * 0.12, m.black); }
  bx(2.1, 0.12, 0.06, 0, 1.62, 0.02, m.stops);
  bx(1.7, 0.06, 0.6, 0, 0.04, 0.75, m.black);
  bx(1.3, 0.08, 0.42, 0, 0.56, 1.1, m.trim);
  for (const sx of [-1, 1]) bx(0.08, 0.52, 0.38, sx * 0.55, 0.27, 1.1, m.trim);
  k.keepOut.push({ x, z, r: 1.6 });
}
/* Saarinen's tulip table and three Bertoia wire chairs around it (Paley Park's furniture). */
function bertoia(k: Kit, x: number, y: number, z: number, rotY: number, mesh: T.Material, rod: T.Material) {
  const sx = Math.sin(rotY), cz = Math.cos(rotY);
  const seat = k.mesh(new T.BoxGeometry(0.46, 0.02, 0.42, 4, 1, 4), mesh, x, y + 0.44, z); seat.rotation.y = rotY;
  const back = k.mesh(new T.CylinderGeometry(0.25, 0.23, 0.32, 10, 3, true, PI - 0.95, 1.9), mesh, x, y + 0.64, z); back.rotation.y = rotY;
  for (const lx of [-0.2, 0.2]) { const px = x + lx * cz, pz = z - lx * sx; k.box(0.02, 0.02, 0.46, px, y + 0.02, pz, rod).rotation.y = rotY; k.cyl(0.011, 0.42, px, y + 0.23, pz, rod, 0.011, 4); }
}
function tulipSet(k: Kit, x: number, y: number, z: number, n: number, seed: number, mesh: T.Material, rod: T.Material, white: T.Material, top: T.Material): Seat[] {
  k.lathe([[0.27, 0], [0.24, 0.025], [0.07, 0.12], [0.045, 0.3], [0.05, 0.62], [0.16, 0.7], [0.001, 0.7]], x, y, z, white, 16);
  k.cyl(0.4, 0.03, x, y + 0.715, z, top, 0.4, 24);
  k.keepOut.push({ x, z, r: 1.15 });
  const rnd = X.mulberry(seed), a0 = rnd() * PI * 2, out: Seat[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i * PI * 2) / n + (rnd() - 0.5) * 0.4, cx = x + Math.cos(a) * 0.8, cz = z + Math.sin(a) * 0.8, rotY = Math.atan2(x - cx, z - cz);
    bertoia(k, cx, y, cz, rotY, mesh, rod);
    out.push({ x: cx, z: cz, rotY, y });
  }
  return out;
}

/* ---------------- 129 GREENACRE PARK ---------------- */
export const greenacre: RoomDef = {
  id: 'greenacre',
  name: 'The waterfall room',
  area: 'GREENACRE PARK / EAST 51ST STREET',
  mood: 'Lunch hour under the water',
  color: '#94b8a0',
  description: 'East 51st Street, then the vest pocket park between two buildings: honey locusts, movable chairs, the raised west terrace under its trellis and acrylic domes, the runnel under the rough east wall, and the 25 foot waterfall filling the back, the works hung on the walls.',
  signatures: 'The 1971 park by Sasaki, Dawson, DeMay, roughly sixty feet by one hundred twenty, a higher terrace along the west side under trellising, acrylic domes and heaters, honey locusts, a runnel along the ashlar east wall, and the 25 foot cascade across the back.',
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
    // the park: paving, the ivy on the west, the rough ashlar on the east, the front wall with its bronze sign, the runnel, the terrace
    const ashlarE = k.pbr('gaAshlar', X.ashlar(0x8a847a, 81, 7), 0.45, { roughness: 0.95, normal: 2 });
    k.box(18.6, 0.3, 36, 0, -0.15, 0, pavers);
    k.box(0.3, 8.4, 36, -9.0, 4.2, 0, ivy); k.box(0.3, 8.4, 36, 9.0, 4.2, 0, ashlarE); k.box(0.34, 1.0, 36, 9.0, 8.3, 0, ivy);
    for (const s of [-1, 1]) k.block(Math.min(s * 8.7, s * 9.8), Math.max(s * 8.7, s * 9.8), -18, 18);
    for (const s of [-1, 1]) { k.box(4, 4.4, 0.6, s * 7, 2.2, 18, brick); k.box(4.2, 0.2, 0.8, s * 7, 4.5, 18, granite); k.block(s * 5, s * 9.2, 17.7, 18.3); }
    k.box(18.6, 0.5, 0.4, 0, 4.9, 18, bronze);
    k.sign('GREENACRE PARK', 7, 0.42, 0, 4.9, 18.22, 'transparent', '#e8dcc0', 92, 0);
    k.sign('A PRIVATELY OWNED PARK OPEN TO THE PUBLIC  ·  ESTABLISHED 1971', 5, 0.24, -7, 3.6, 18.32, 'transparent', '#e8dcc0', 52, 0);
    // the waterfall across the back; the runnel at the foot of the rough east wall, fed by trickles
    waterWall(k, ctx, { x: 0, z: -17.6, w: 18, h: 7.6, pool: 2.8 });
    k.box(1.4, 0.3, 24.6, 8.0, -0.1, -2, brookM);
    for (const s of [-1, 1]) k.box(0.22, 0.34, 24.6, 8.0 + s * 0.8, 0.12, -2, granite);
    k.box(1.8, 0.06, 1.2, 8.0, 0.32, 3.5, wood);
    k.block(7.15, 8.9, -14.3, 10.3);
    runnel(k, ctx, 8.05, 0.07, -2, 1.3, 24.4);
    trickles(k, ctx, 8.82, -13.5, 9.5, 0.25, 2.0, 34);
    // the small fountain at the entrance
    const FX = 4.4, FZ = 14.6;
    k.cyl(0.95, 0.5, FX, 0.25, FZ, granite, 0.95, 20); k.cyl(0.8, 0.02, FX, 0.49, FZ, brookM, 0.8, 20); k.cyl(0.12, 0.3, FX, 0.65, FZ, bronze, 0.16, 10);
    k.block(FX - 1, FX + 1, FZ - 1, FZ + 1);
    const jetG = new T.CylinderGeometry(0.02, 0.05, 1, 8); jetG.translate(0, 0.5, 0);
    const jet = k.mesh(jetG, k.glow(0xe8f6ff, 0.75), FX, 0.8, FZ, true); jet.scale.y = 0.9;
    if (!ctx.reduced) k.ticks.push((t) => { jet.scale.y = 0.8 + 0.22 * Math.sin(t * 5.3) + 0.08 * Math.sin(t * 13.1); });
    // the higher terrace along the west side: trellis, acrylic domes, heaters
    const TX0 = 3.6, TY = 0.9;
    k.box(5.2, TY, 23, -6.2, TY / 2, -0.5, brick);
    for (let j = 0; j < 3; j++) k.box(0.36, TY - 0.3 * j, 23, -(TX0 - 0.18 - j * 0.35), (TY - 0.3 * j) / 2, -0.5, granite);
    for (const z of [-12.3, 11.3]) { k.box(5.2, 1.2, 0.6, -6.2, 0.6, z, brick); k.box(4.6, 0.5, 0.4, -6.2, 1.4, z, ivy); k.block(-8.8, -3.4, z - 0.3, z + 0.3); }
    for (const z of [-11, -5.5, 0, 5.5, 11]) k.box(0.16, 3.7, 0.16, -4.0, TY + 1.85, z, iron);
    for (const x of [-4.0, -8.7]) k.box(0.26, 0.26, 23.4, x, TY + 3.7, -0.5, wood);
    for (let z = -11.7; z <= 11; z += 0.55) k.box(5.0, 0.06, 0.14, -6.35, TY + 3.85, z, wood);
    const acrylic = k.glass(0xdde8ee, 0.3, 0.05);
    for (const z of [-9.5, -5.5, -1.5, 2.5, 6.5, 10]) k.mesh(new T.SphereGeometry(1.15, 14, 6, 0, PI * 2, 0, PI / 2), acrylic, -6.35, TY + 3.9, z);
    for (const z of [-8.5, -2.5, 3.5, 9.5]) { k.cyl(0.2, 0.5, -6.4, TY + 3.3, z, iron, 0.26, 10); k.cyl(0.18, 0.04, -6.4, TY + 3.03, z, heater, 0.18, 10); const l = k.point(-6.4, TY + 2.8, z, 0xff9a4a, 3 + 12 * k.night, 7); if (!ctx.reduced) k.ticks.push((t) => { l.intensity = (3 + 12 * k.night) * (0.85 + 0.15 * Math.sin(t * 2.1 + z)); }); }
    // trees, chairs, tables, the people sitting and the people passing
    locust(k, 5.0, 0, -9, 9.2, 2.0, 1, 0x93b85a); locust(k, 3.2, 0, -1, 9.6, 1.9, 2, 0x93b85a); locust(k, 5.4, 0, 7, 8.8, 2.0, 3, 0x93b85a); locust(k, -2.4, 0, 3, 9.4, 1.9, 4, 0x93b85a);
    locust(k, -7.4, TY, -9.5, 8.2, 1.8, 5, 0x93b85a); locust(k, -7.4, TY, 4, 8.0, 1.8, 6, 0x93b85a);
    const seats: Seat[] = [];
    for (const [x, z, n] of [[5.2, -5, 3], [5.4, 1.2, 2], [5.0, 10.6, 3], [-1.8, -4, 3], [-1.9, 7.8, 2], [-1.7, 11.2, 2], [1.5, -12, 2]]) seats.push(...cafeSet(k, x, 0, z, n, 11 - x * 3 + z, wire, top));
    for (const z of [-6.75, -2.25, 2.25, 6.75]) seats.push(...cafeSet(k, -6.5, TY, z, 3, 31 + z, wire, top));
    seated(k, seats, 5, 0.6);
    k.crowd([v(16, 0.14, 20.8), v(4, 0.14, 19.3), v(1.4, 0, 15), v(1.4, 0, 6), v(0.9, 0, -3), v(0.4, 0, -9), v(-0.6, 0, -13.2)], 12, { seed: 41, speed: 0.6, spread: 0.9, animate: !ctx.reduced });
    k.crowd([v(-40, 0.14, 21), v(40, 0.14, 21)], 10, { seed: 42, speed: 1.0, spread: 1.6, animate: !ctx.reduced });
    leaves(k, ctx, 80, { x0: -8.5, x1: 8, z0: -13, z1: 15, top: 8 }, 12);
    sparrows(k, ctx, 12, { x0: -2.8, x1: 6.2, z0: -12.5, z1: 13 }, () => 0, 51);
    placard(k, '"WATERFALL"', -3.2, 1.25, -13.6, -0.2);
    for (const z of [9, 0, -9]) lantern(k, 8.85, 4.6, z, -PI / 2, k.night);
    lantern(k, -8.85, TY + 4.9, -11.5, PI / 2, k.night);
    k.point(0, 7, 4, 0xffe6c0, 12 * k.night, 18);
    // landmark eggs
    const tclf = { name: 'The Cultural Landscape Foundation', url: 'https://www.tclf.org/landscapes/greenacre-park' };
    k.egg(v(0, 5, -17.1), { id: 'waterfall', title: 'A 25 foot cascade', year: '1971', text: 'The cascade at the back of the sunken rear terrace stands 25 feet high. Sasaki, Dawson, DeMay Associates designed the park, with Masao Kinoshita as lead designer and Hideo Sasaki and Tom Wirth involved.', clue: 'Follow the roar to the back of the room.', source: tclf }, { r: 3.2 });
    k.egg(v(8.0, 0.7, -4), { id: 'runnel', title: 'The runnel under the east wall', text: 'Water enters Greenacre first as a fountain, then as a runnel collecting trickles from the base of the rough ashlar masonry of the east wall.', clue: 'Listen for the quieter water, down low along the stone.', source: tclf }, { r: 1.4 });
    k.egg(v(-6.3, TY + 3.9, 0.5), { id: 'trellis', title: 'The covered overlook', text: 'On the west side a higher terrace, covered by trellising and acrylic domes, gives a protected overlook down into the garden.', clue: 'Climb the low steps and look up through the slats.', source: tclf }, { r: 1.8 });
    k.egg(v(-1.8, 0.8, -4), { id: 'chairs', title: 'Knoll chairs and warm heaters', text: 'Knoll tables and chairs fill the central plaza, and the walls around the planting beds and brook double as built in benches. The covered seating area has overhead heating elements for cooler weather.', clue: 'Pull up a chair, any chair, in the middle of the park.', source: { name: 'Greenacre Park, Design', url: 'https://www.greenacrepark.org/design' } }, { r: 1.1 });
    k.egg(v(0, 4.9, 18.1), { id: 'founder', title: 'A gift from Abby Rockefeller Mauzé', year: '1968 to 1971', text: 'Abby Rockefeller Mauzé, a lifelong New Yorker, set up the Greenacre Foundation in 1968, inspired by Paley Park and the lack of parks in midtown. Greenacre Park officially opened on October 14, 1971.', clue: 'Read the bronze over the gate on your way in.', source: { name: 'Greenacre Park, History', url: 'https://www.greenacrepark.org/history' }, room: 'paley' }, { r: 1.5 });
    // the hang: two rows on the east wall, a row over the west terrace, two by the gate
    const mounts: Mount[] = [];
    for (let i = 0; i < 7; i++) { const z = 13 - i * 4.5; mounts.push({ position: v(8.8, 3.3, z), rotation: -PI / 2, target: v(3.0, 3, z), width: 3.4, height: 2.3, style: 'black', wash: false }); }
    for (let i = 0; i < 6; i++) { const z = 10.75 - i * 4.5; mounts.push({ position: v(8.8, 6.15, z), rotation: -PI / 2, target: v(3.0, 3, z), width: 3.0, height: 2.0, style: 'black', wash: false }); }
    for (let i = 0; i < 5; i++) { const z = -9 + i * 4.5; mounts.push({ position: v(-8.8, TY + 3.25, z), rotation: PI / 2, target: v(-5.0, 3, z), width: 3.2, height: 2.2, style: 'oak', wash: false }); }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 7, 3.15, 17.65), rotation: PI, target: v(s * 6, 3, 13.5), width: 3.0, height: 1.9, style: 'black', wash: false });
    return {
      mounts, spawn: v(1.2, 3, 15.6), look: v(0, 4.4, -17.6), eye: 3, bounds: [-8.5, 8.5, -14.0, 22.4], style: 'black',
      floorY: (x, z) => { if (z < -12.3 || z > 11.3) return 0; if (x < -TX0) return TY; if (x < -(TX0 - 1.05)) return (TY * (-x - (TX0 - 1.05))) / 1.05; return 0; },
    };
  },
};

/* ---------------- 130 PALEY PARK ---------------- */
export const paley: RoomDef = {
  id: 'paley',
  name: 'Seventeen honey locusts',
  area: 'PALEY PARK / EAST 53RD STREET',
  mood: 'Dappled noon',
  color: '#acc4a1',
  description: 'Granite steps up from 53rd Street into the original vest pocket park: seventeen honey locusts on a grid, vertical lawns of ivy, Bertoia wire chairs and Saarinen tables, and the water wall drowning the traffic, a portrait in every tree bay.',
  signatures: 'The 1967 park by Robert Zion of Zion and Breen, a tenth of an acre on the site of the Stork Club, seventeen honey locusts on a grid, English ivy on both side walls, a twenty foot water wall across the back, 20 Saarinen tables and 60 Bertoia chairs, a kiosk at the entrance.',
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
    k.sign('IN MEMORY OF SAMUEL PALEY', 2.2, 0.16, 6.5, 2.2, 17.63, 'transparent', '#d8c8a0', 44, 0);
    k.box(0.06, 0.06, 2.2, 6.5, 2.85, 16.3, bronze);
    // the water wall across the whole back
    waterWall(k, ctx, { x: 0, z: -15.4, w: 13.4, h: 6.2, pool: 1.6, base: F });
    // seventeen honey locusts on the grid: three files, six ranks, one rank short where the kiosk stands
    let seed = 20;
    for (const x of [-4.0, 0, 4.0]) for (const z of [12, 7.5, 3, -1.5, -6, -10.5]) { if (x < -3 && z === 12) continue; locust(k, x, F, z, 10.8, 1.5, seed++, 0xa4c65e); }
    // the kiosk by the entrance
    const KX = -4.9, KZ = 13.4;
    k.box(3.4, 2.6, 2.6, KX, F + 1.3, KZ, k.flat(0x2a3a34, 0.3, 0.6));
    k.box(3.0, 1.1, 0.1, KX, F + 1.85, KZ + 1.32, glass);
    k.box(3.0, 0.9, 0.2, KX, F + 0.45, KZ + 1.35, k.pbr('ppKiosk', X.planks(0x6a4a30, 3, 80), 1.0));
    k.box(3.0, 0.5, 0.1, KX, F + 2.2, KZ + 1.36, warm);
    k.sign('ESPRESSO  ·  TEA  ·  PASTRIES', 2.8, 0.36, KX, F + 2.2, KZ + 1.42, 'transparent', '#1a1410', 78, 0);
    k.point(KX, F + 2.0, KZ + 0.6, 0xffd9a0, 8, 6);
    k.block(KX - 1.8, KX + 1.8, KZ - 1.4, KZ + 1.5);
    // twenty Saarinen tulip tables between the tree ranks, sixty Bertoia wire chairs, the walking lane down the west side
    const meshW = k.flat(0xe4e6e4, 0.7, 0.35, { wireframe: true }), rod = k.flat(0xd6dad6, 0.7, 0.4), tulipW = k.flat(0xf2f0ea, 0.1, 0.35);
    const seats: Seat[] = [];
    for (const x of [-5.3, 2.0, 5.3]) for (const z of [9.75, 5.25, 0.75, -3.75, -8.25, -12.0]) seats.push(...tulipSet(k, x, F, z, 3, 50 + x * 7 + z, meshW, rod, tulipW, top));
    for (const x of [2.0, 5.3]) seats.push(...tulipSet(k, x, F, 12.9, 3, 90 + x, meshW, rod, tulipW, top));
    void wire;
    seated(k, seats, 8, 0.5);
    k.crowd([v(-11, 0.14, 19.6), v(-2.0, 0.3, 17), v(-2.0, F, 14), v(-2.0, F, 4), v(-2.0, F, -6), v(-1.2, F, -12.2), v(2.6, F, -12.6)], 10, { seed: 43, speed: 0.55, spread: 0.7, animate: !ctx.reduced });
    k.crowd([v(-40, 0.14, 20), v(40, 0.14, 20)], 10, { seed: 44, speed: 1.0, spread: 1.6, animate: !ctx.reduced });
    leaves(k, ctx, 70, { x0: -6, x1: 6, z0: -12, z1: 13, top: 9, floor: F }, 13);
    sparrows(k, ctx, 14, { x0: -5.8, x1: 5.8, z0: -12, z1: 13 }, () => F, 52);
    dapple(k, ctx, 28, { x0: -6, x1: 6, z0: -12.5, z1: 14 }, F + 0.02, 24);
    placard(k, '"WATER"', 4.6, F + 1.25, -12.9, 0.2, 1.1);
    // landmark eggs
    const tclf = { name: 'The Cultural Landscape Foundation', url: 'https://www.tclf.org/landscapes/paley-park' };
    k.egg(v(0, F + 3.4, -15.0), { id: 'waterwall', title: 'The 20 foot water wall', year: '1967', text: 'A 20 foot high wall of water fills the back of this one tenth of an acre park. Robert Zion of Zion and Breen Associates designed it, and it opened in 1967 as the original vest pocket park.', clue: 'Walk toward the loudest thing in the park.', source: tclf }, { r: 3 });
    k.egg(v(6.5, 2.4, 17.75), { id: 'storkclub', title: 'Where the Stork Club stood', text: 'William Paley, former chairman of CBS, offered the site of the Stork Club for this park and was closely involved in making it. The park is a memorial to his father, Samuel Paley.', clue: 'The bronze on the pier by the street names a father.', source: tclf }, { r: 0.9 });
    k.egg(v(0, F + 9.6, 3), { id: 'locusts', title: 'Seventeen honey locusts', text: 'Seventeen honey locust trees, planted on a grid over the central seating area, give dappled shade to the movable wire chairs and marble tables on the granite pavers.', clue: 'Count the trunks, then look up.', source: tclf }, { r: 1.6 });
    k.egg(v(5.3, F + 0.8, -3.75), { id: 'bertoia', title: 'Saarinen tables, Bertoia chairs', year: '1967', text: 'The park is furnished with 20 tables designed by Eero Saarinen and 60 modern style Bertoia wire chairs. Paley Park opened to the public on May 23, 1967.', clue: 'Sit down: the answer is under you.', source: { name: 'Paley Park', url: 'https://www.paleypark.org/about' } }, { r: 1.1 });
    k.egg(v(-6.3, F + 1.3, 6.4), { id: 'ivy', title: 'Vertical lawns of ivy', text: 'The two side walls are covered with vertical lawns of English ivy. A food kiosk stands at the park entrance.', clue: 'The walls here are alive: find the green between the frames.', source: tclf }, { r: 0.9 });
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
  signatures: 'The fieldstone body of 1799, the 1828 steeple by Thompson and Town, the cast iron portico of 1856, Borglum\'s Aspiration and Inspiration, the lions of St. Mark, the flat vault markers, the Stuyvesant vault under the east wall and the Dupuis bust, the Edelman windows, the white sanctuary with folding chairs and a lectern.',
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
    // the east yard behind the church: more grass, the walls carried round, a back wall
    k.box(44, 0.3, 10.4, 0, -0.15, -28.2, grass);
    for (const s of [-1, 1]) { k.box(0.5, 4.6, 11.4, s * 20.5, 2.3, -27.7, brickY); k.box(0.7, 0.9, 11.4, s * 20.5, 4.6, -27.7, ivy); k.block(Math.min(s * 20.2, s * 21), Math.max(s * 20.2, s * 21), -33.4, -21.8); }
    k.box(41.5, 3.4, 0.5, 0, 1.7, -33.2, brickY); k.box(41.5, 0.8, 0.7, 0, 3.6, -33.2, ivy); k.block(-21, 21, -33.6, -32.8);
    // gravestones: flat slabs and a few standing stones, the Stuyvesant vault against the east wall
    const rnd = X.mulberry(105);
    const slabs: T.Matrix4[] = [], heads: T.Matrix4[] = [];
    for (const s of [-1, 1]) for (let r = 0; r < 12; r++) for (let c = 0; c < 5; c++) {
      const x = s * (11 + c * 1.7), z = 11 - r * 2.7 + (rnd() - 0.5) * 0.4;
      if (Math.abs(z + 6) < 2 && s > 0 && c < 1) continue;
      if (rnd() > 0.82) { heads.push(new T.Matrix4().compose(v(x, 0.42, z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), (rnd() - 0.5) * 0.12), new T.Vector3(1, 1, 1))); if (Math.abs(x) < 14.6) k.keepOut.push({ x, z, r: 0.45 }); }
      else slabs.push(new T.Matrix4().makeTranslation(x, 0.07, z));
    }
    // the flat vault markers of the east yard, among the newer paving
    for (let x = -18.5; x <= 18.5; x += 1.7) for (const z of [-27.4, -30.2]) { if (Math.abs(x) < 1.6 || (Math.abs(x - 5) < 1.8 && z < -28)) continue; if (rnd() < 0.8) slabs.push(new T.Matrix4().makeTranslation(x, 0.07, z + (rnd() - 0.5) * 0.3)); }
    k.instances(new T.BoxGeometry(1.0, 0.14, 2.0), slab, slabs);
    k.instances(new T.BoxGeometry(0.7, 0.85, 0.12), slab, heads);
    // the Stuyvesant vault under the east wall: a marble tablet on the chancel end, a ledger stone below
    const marbleW = k.flat(0xe8e4da, 0, 0.55);
    k.box(2.6, 1.5, 0.12, 0, 2.2, -24.42, marbleW); k.box(2.9, 0.16, 0.2, 0, 3.0, -24.44, stone); k.box(2.8, 0.12, 1.8, 0, 0.06, -25.6, stone);
    k.sign('THE STUYVESANT VAULT  ·  PETRUS STUYVESANT', 2.3, 0.5, 0, 2.2, -24.5, 'transparent', '#3a352c', 60, PI);
    // Toon Dupuis's bust of Stuyvesant in the east yard
    k.prop('bust_plinth', 5, 0, -29.2, { height: 2.1, keepOut: 0.7 });
    for (const [x, z] of [[-14, 15], [14, 15], [-14, -3], [14, -3], [-15.5, -20], [15.5, -20]]) { k.tree(x, 0, z, { h: 6.5, r: 2.6, seed: Math.round(x + z), leaf: 0x3f6b36 }); k.keepOut.push({ x, z, r: 0.45 }); }
    k.bench(-6, 16, PI / 2, k.pbr('smBench', X.planks(0x5d4939, 3, 106), 1.2), iron, 2.2);
    k.bench(6, 16, -PI / 2, k.pbr('smBench', X.planks(0x5d4939, 3, 106), 1.2), iron, 2.2);
    // the church: fieldstone body with arched windows cut through both skins, the roof, the tower, the spire
    const CF = 0.6; // the church floor above the yard
    // Harold Edelman's abstract windows after the 1978 fire: one shared stained glass material, dimmer at night
    const stainedM = new T.MeshBasicMaterial({ map: stained(), color: new T.Color(0xffffff).lerp(new T.Color(0x6a6a6a), k.night * 0.5) });
    void glass;
    const wall = (x: number, m: T.Material, th: number) => {
      for (const z of [-19, -13, -7, -1]) { const a = k.arch(2.2, 5.4, th, x, 1.6, z, m, false, 6 / 4.4); a.rotation.y = PI / 2; k.box(th, 1.6, 6, x, 0.8, z, m); k.box(th, 3.3, 6, x, 9.35, z, m); }
      for (const z of [-23, 3]) k.box(th, 11, 2, x, 5.5, z, m);
    };
    for (const s of [-1, 1]) { wall(s * 8.15, fs, 0.3); wall(s * 7.85, white, 0.3); k.block(s * 7.6, s * 8.4, -24.3, 4.3); for (const z of [-19, -13, -7, -1]) k.box(0.08, 5.3, 2.2, s * 8.0, 4.32, z, stainedM); }
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
    // the clock faces keep New York time: hour and minute hands on pivots
    const hands: { m: T.Mesh; s: number; minute: boolean }[] = [];
    for (const s of [-1, 1]) {
      const f = k.cyl(0.9, 0.1, 0, BY + 5.4, 7 + s * 1.92, k.flat(0xf4f0e6, 0, 0.6), 0.9, 24); f.rotation.x = PI / 2;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.box(0.05, i % 3 ? 0.1 : 0.18, 0.02, Math.sin(a) * 0.76, BY + 5.4 + Math.cos(a) * 0.76, 7 + s * 1.98, iron).rotation.z = -a; }
      for (const minute of [false, true]) { const g = new T.BoxGeometry(minute ? 0.05 : 0.08, minute ? 0.72 : 0.46, 0.03); g.translate(0, minute ? 0.3 : 0.19, 0); hands.push({ m: k.mesh(g, iron, 0, BY + 5.4, 7 + s * (minute ? 2.02 : 2.0), true), s, minute }); }
    }
    const setClock = () => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })), h = (d.getHours() % 12) + d.getMinutes() / 60, mi = d.getMinutes() + d.getSeconds() / 60; for (const hd of hands) hd.m.rotation.z = -hd.s * (hd.minute ? (mi / 60) * PI * 2 : (h / 12) * PI * 2); };
    setClock();
    if (!ctx.reduced) { let acc = 0; k.ticks.push((_t, dt) => { acc += dt; if (acc > 1) { acc = 0; setClock(); } }); }
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
    const carved = k.flat(0xbdb6aa, 0, 0.8);
    lion(k, -4.6, 16.4, carved); lion(k, 4.6, 16.4, carved);
    // Borglum's Aspiration and Inspiration either side of the door, on the porch
    for (const s of [-1, 1]) {
      const sx = s * 4.1, sz = 10.9;
      k.box(0.8, 0.6, 0.8, sx, CF + 0.3, sz, stone);
      k.lathe([[0.3, 0], [0.27, 0.9], [0.21, 1.3], [0.26, 1.52], [0.12, 1.68], [0.001, 1.7]], sx, CF + 0.6, sz, marbleW, 14);
      k.sphere(0.14, sx, CF + 2.42, sz, marbleW, 12);
      k.box(0.12, 0.55, 0.12, sx + s * 0.28, CF + 1.95, sz + 0.05, marbleW).rotation.z = -s * 0.25;
      k.keepOut.push({ x: sx, z: sz, r: 0.6 });
    }
    // the third lion, on the sidewalk outside the fence, after Donatello's Marzocco: seated, a shield under one paw
    { const lx = 3.4, lz = 21.3, b = 0.14;
      k.box(1.1, 1.0, 1.3, lx, b + 0.5, lz, stone); k.box(1.2, 0.12, 1.4, lx, b + 1.06, lz, stone);
      k.rounded(0.62, 0.95, 0.8, lx, b + 1.6, lz - 0.1, carved, 0.2);
      k.sphere(0.3, lx, b + 2.25, lz + 0.12, carved, 12); k.torus(0.26, 0.11, lx, b + 2.2, lz + 0.05, carved, 20);
      for (const s of [-1, 1]) k.box(0.16, 0.7, 0.18, lx + s * 0.2, b + 1.45, lz + 0.35, carved);
      k.rounded(0.46, 0.7, 0.06, lx - 0.42, b + 1.5, lz + 0.42, carved, 0.08);
      k.block(lx - 0.6, lx + 0.6, lz - 0.7, lz + 0.7); }
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
    // a reader at the lectern, swaying through a poem
    const rb = new T.CapsuleGeometry(0.21, 0.8, 3, 8); rb.translate(0, 0.62, 0);
    const rh = new T.SphereGeometry(0.13, 10, 8); rh.translate(0, 1.38, 0);
    const reader = k.mesh(mergeGeometries([rb, rh])!, k.flat(0x1c1e24, 0, 0.8), 0, CF + 0.3, -21.3, true);
    if (!ctx.reduced) k.ticks.push((t) => { reader.rotation.z = 0.04 * Math.sin(t * 0.9); reader.rotation.x = 0.05 * Math.max(0, Math.sin(t * 0.37)); reader.rotation.y = 0.2 * Math.sin(t * 0.23); });
    // sparrows on the front lawn, leaves off the yard trees
    sparrows(k, ctx, 12, { x0: -17, x1: 17, z0: 16.6, z1: 19.4 }, () => 0, 53);
    leaves(k, ctx, 40, { x0: -17, x1: 17, z0: -21, z1: 16, top: 6, around: [[-14, 15], [14, 15], [-14, -3], [14, -3], [-15.5, -20], [15.5, -20]].map(([x, z]) => ({ x, z, r: 2.4 })) }, 14);
    // landmark eggs
    const church = { name: "St. Mark's Church in-the-Bowery", url: 'https://stmarksbowery.org/history' }, durante = { name: 'Dianne L. Durante, Sculptures at St. Mark\'s', url: 'https://diannedurantewriter.com/sculptures-at-st-marks-in-the-bowery-and-tompkins-square-park' };
    k.egg(v(0, BY + 9, 7), { id: 'steeple', title: 'Fieldstone church, 1828 steeple', year: '1799', text: 'John McComb Jr. built the fieldstone church, consecrated on May 9, 1799. The steeple, designed by Martin Euclid Thompson and Ithiel Town, went up in 1828, and the Italianate cast iron portico was added in 1856.', clue: 'Look up past the portico to the tip of the spire.', source: church }, { r: 2.5 });
    k.egg(v(3.4, 1.8, 21.3), { id: 'lions', title: 'The lions of St. Mark', text: "The lion is the symbol of St. Mark. Two lions guard the entrance doors, and a third sits outside the fence, modeled on Donatello's Marzocco, the lion that became a symbol of Florence in the 15th century.", clue: 'One of the three is waiting on the sidewalk.', source: durante }, { r: 1.0 });
    k.egg(v(4.1, CF + 1.6, 10.9), { id: 'borglum', title: 'Aspiration and Inspiration', year: '1920', text: "Solon Borglum's over life size marble figures of Native Americans, Aspiration and Inspiration, flank the porch. They were unveiled in 1920.", clue: 'Two marble figures keep watch either side of the door.', source: durante }, { r: 1.0 });
    k.egg(v(7.2, CF + 4.3, -7), { id: 'windows', title: 'After the fire of 1978', year: '1978', text: "On July 12, 1978 a fire, apparently started by a restoration worker's acetylene torch, destroyed 9 of the 23 stained glass windows. Harold Edelman designed the abstract replacements, and their colors represent the liturgical year.", clue: 'Step inside and let the colored light find you.', source: church }, { r: 1.1 });
    k.egg(v(0, CF + 1.3, -20.6), { id: 'poetry', title: 'The Poetry Project, since 1966', year: '1966', text: "The Poetry Project was founded at St. Mark's in 1966, and the church has hosted the Danspace Project since 1974. The church calls itself New York's oldest site of continuous religious practice.", clue: 'Walk to the far end of the sanctuary and take the lectern.', source: church }, { r: 1.0 });
    k.egg(v(0, 1.8, -24.9), { id: 'vault', title: 'The Stuyvesant vault', text: 'The Stuyvesant family vault is still under the east wall of the church. It was closed for good when the last family member was interred there in 1953. Many flat vault markers can still be seen among the newer pavements.', clue: 'Walk all the way around behind the church, to its east end.', source: { name: 'New York City Cemetery Project', url: 'https://nycemetery.wordpress.com/2011/06/04/st-marks-in-the-bowery-churchyard-and-cemetery/' } }, { r: 1.3 });
    k.egg(v(5, 1.7, -29.2), { id: 'bust', title: 'A bust from the Netherlands', year: '1915', text: 'Dutch sculptor Toon Dupuis made this bust of Peter Stuyvesant. Queen Wilhelmina and the Dutch government presented it as a token of goodwill, and it was unveiled on December 5, 1915.', clue: 'In the yard behind the church, a governor keeps watch from a plinth.', source: { name: 'The Low Countries', url: 'https://www.the-low-countries.com/article/how-peter-stuyvesant-became-an-anachronistic-symbol-of-dutch-american-friendship/' } }, { r: 1.0 });
    // the hang: the yard walls, then the sanctuary between the windows and either side of the door
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = 10 - i * 5.5; mounts.push({ position: v(s * 20.2, 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 16.5, 3, z), width: 3.2, height: 2.2, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (const z of [-16, -10, -4, 2.1]) mounts.push({ position: v(s * 7.68, CF + 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 6.6, 3, z), width: 2.7, height: 2.1, style: 'white', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 5.2, CF + 3.4, 3.38), rotation: PI, target: v(s * 4.5, 3, 0.6), width: 3.0, height: 2.1, style: 'white', wash: true });
    return {
      mounts, spawn: v(0, 3, 25.2), look: v(0, 9.5, 4), eye: 3, bounds: [-19.6, 19.6, -32.4, 27], style: 'white',
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
      mirror = k.flat(0x7c848c, 1, 0.08),
      walnut = k.pbr('ktWalnut', X.planks(0x4a2c1a, 8, 119), 0.8, { roughness: 0.45 }),
      redMarble = k.pbr('ktRedMarble', X.marble(0x8a2a26, 0x3a1010, 118), 0.4, { roughness: 0.25 }),
      tileP = k.pbr('ktTileP', X.marble(0xe2b4ac, 0xa07070, 120), 0.5, { roughness: 0.3 });
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
    // the lobby floor: pink and white tiles inside a red and black border
    for (let ix = 0; ix < 20; ix++) for (let iz = 0; iz < 24; iz++) { if ((ix + iz) % 2) continue; k.plane(1.25, 1.25, -11.875 + ix * 1.25, 0.004, 4.4 - iz * 1.25, tileP, 0, -PI / 2); }
    const redB = k.flat(0x8a1a1a, 0, 0.4), blackB = k.flat(0x141012, 0, 0.35);
    for (const s of [-1, 1]) { k.box(0.5, 0.012, 30.6, s * 12.85, 0.006, -10.2, redB); k.box(0.16, 0.014, 30.6, s * 12.52, 0.007, -10.2, blackB); }
    for (const z of [5.1, -25.5]) { k.box(26.2, 0.012, 0.5, 0, 0.006, z, redB); k.box(25.2, 0.014, 0.16, 0, 0.007, z - Math.sign(z) * 0.33, blackB); }
    for (const s of [-1, 1]) { k.box(9, 16, 0.6, s * 9.5, 8, Z0, cream); k.block(s * 5, s * 14.3, Z0 - 0.3, Z0 + 0.3); }
    k.box(10.2, 11.8, 0.6, 0, 4.2 + 5.9, Z0, cream);
    k.moulding([[0, 0], [0.4, 0], [0.5, 0.2], [0.2, 0.4], [0, 0.5]], 10.4, 0, 4.2, Z0 - 0.3, gilt, 0);
    k.box(0.6, 16, Z0 - Z1, -14, 8, (Z0 + Z1) / 2, cream);
    k.box(0.6, 16, 14.1, 14, 8, Z0 - 7.05, cream); k.box(0.6, 16, 22.1, 14, 8, -15.9 - 11.05, cream); k.box(0.6, 7.5, 7.8, 14, 12.25, -12, cream);
    for (const s of [-1, 1]) { k.box(0.7, 1.3, Z0 - Z1, s * 13.95, 0.65, (Z0 + Z1) / 2, redMarble); k.box(0.8, 0.1, Z0 - Z1, s * 13.9, 1.33, (Z0 + Z1) / 2, gilt); }
    k.box(28, 11.2, 0.6, 0, 10.4, Z1, cream);
    k.box(28.6, 0.4, 17.2, 0, 16.2, Z0 - 8.6, cream); k.box(28.6, 0.4, 17.2, 0, 16.2, -29.4, cream); for (const s of [-1, 1]) k.box(9.5, 0.4, 9.6, s * 9.55, 16.2, -16, cream);
    for (let z = Z0 - 2; z > Z1; z -= 3.5) k.box(28, 0.4, 0.5, 0, 15.8, z, giltD);
    for (let x = -12; x <= 12; x += 3.5) k.box(0.5, 0.4, Z0 - Z1, x, 15.8, (Z0 + Z1) / 2, giltD);
    // octagonal coffers in the square bays, each with a gilt rosette
    for (let cx = -10.25; cx <= 11; cx += 3.5) for (let cz = Z0 - 3.75; cz > Z1 + 1; cz -= 3.5) {
      if (Math.abs(cx) < 4.8 && cz < -11 && cz > -21) continue;
      const o = k.torus(1.15, 0.08, cx, 15.56, cz, gilt, 8); o.rotation.set(PI / 2, 0, PI / 8);
      k.sphere(0.14, cx, 15.55, cz, gilt, 8);
    }
    k.prop('coffered_dome', 0, 15.9, -16, { height: 5.3 }); for (const s of [-1, 1]) k.point(s * 4, 17.5, -16, 0xffe0b0, 40, 12);
    // pilasters, columns, the chandeliers, the auditorium arch and its curtain
    for (const s of [-1, 1]) for (const z of [3, -2.5, -8, -13.5, -19, -24.5]) { k.box(1.0, 14, 0.5, s * 13.7, 7.3, z, gilt); k.box(1.3, 0.6, 0.7, s * 13.7, 14.4, z, gilt); k.box(0.5, 0.5, 0.5, s * 13.4, 6.2, z, gilt); k.sphere(0.16, s * 13.3, 6.55, z, warm, 8); k.point(s * 12.9, 6.6, z, 0xffd9a0, 6, 6); }
    for (const s of [-1, 1]) k.moulding([[0, 0], [0.6, 0], [0.7, 0.25], [0.35, 0.45], [0.5, 0.7], [0, 0.85]], Z0 - Z1, s * 13.7, 15.0, (Z0 + Z1) / 2, gilt, s < 0 ? PI / 2 : -PI / 2);
    for (const s of [-1, 1]) for (const z of [0.25, -5.25, -10.75, -16.25, -21.75]) { if (s > 0 && z === -10.75) continue; k.box(0.2, 5.2, 4.8, s * 13.55, 4.3, z, walnut); for (const dz of [-2.45, 2.45]) k.box(0.24, 5.3, 0.1, s * 13.55, 4.3, z + dz, giltD); }
    for (const s of [-1, 1]) for (const z of [-1, -9, -17]) { k.column(s * 8.5, 0, z, 13.8, 0.55, pink, false, gilt); k.keepOut.push({ x: s * 8.5, z, r: 1.0 }); }
    // three Art Deco lantern chandeliers with prisms and fleurs de lis, about a ton each
    const chand: T.PointLight[] = [], prismT: T.Matrix4[] = [];
    const lanternGlass = k.glass(0xffe8c0, 0.38, 0.12), core = k.glow(0xffe6b8, 0.85);
    for (const [z, R] of [[-1.5, 1.3], [-16, 2.0], [-30.5, 1.3]]) {
      const top = 15.0, H = R * 2.0, yb = top - 1.3 - H;
      k.beam(v(0, 16, z), v(0, top - 1.1, z), 0.05, gilt, 4);
      k.torus(R * 0.6, 0.06, 0, top - 1.15, z, gilt, 24).rotation.x = PI / 2;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.mesh(new T.ConeGeometry(0.08, 0.34, 4), gilt, Math.cos(a) * R * 0.6, top - 0.92, z + Math.sin(a) * R * 0.6); k.sphere(0.06, Math.cos(a) * R * 0.66, top - 1.0, z + Math.sin(a) * R * 0.66, gilt, 6); }
      k.lathe([[0.02, 0], [R * 0.3, 0.05], [R * 0.55, H * 0.25], [R * 0.68, H * 0.6], [R * 0.62, H * 0.9], [R * 0.45, H], [0.02, H]], 0, yb, z, lanternGlass, 16);
      k.cyl(R * 0.3, H * 0.7, 0, yb + H * 0.45, z, core, R * 0.22, 10);
      for (const [rr, hh] of [[0.55, 0.25], [0.68, 0.6], [0.45, 1]]) k.torus(R * rr, 0.035, 0, yb + H * hh, z, gilt, 24).rotation.x = PI / 2;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2, cx = Math.cos(a), sz = Math.sin(a); k.beam(v(cx * R * 0.55, yb + H * 0.25, z + sz * R * 0.55), v(cx * R * 0.68, yb + H * 0.6, z + sz * R * 0.68), 0.025, gilt, 4); k.beam(v(cx * R * 0.68, yb + H * 0.6, z + sz * R * 0.68), v(cx * R * 0.45, yb + H, z + sz * R * 0.45), 0.025, gilt, 4); }
      k.sphere(0.13, 0, yb - 0.1, z, gilt, 8);
      for (const [rr, hh] of [[0.74, 0.58], [0.66, 0.86], [0.58, 0.2], [0.36, 0.0]]) { const cnt = Math.round(R * rr * 16); for (let i = 0; i < cnt; i++) { const a = (i / cnt) * PI * 2; prismT.push(new T.Matrix4().makeTranslation(Math.cos(a) * R * rr, yb + H * hh - 0.14, z + Math.sin(a) * R * rr)); } }
      chand.push(k.point(0, yb + H * 0.5, z, 0xffe6c0, 36, 26));
    }
    const prismG = new T.OctahedronGeometry(0.05, 0); prismG.scale(1, 2.6, 1);
    const prisms = k.instances(prismG, new T.MeshBasicMaterial({ color: 0xffffff }), prismT); prisms.castShadow = false;
    const pc = new T.Color(), np = prismT.length;
    const glitter = (t: number) => { for (let i = 0; i < np; i++) { const g = Math.pow(Math.max(0, Math.sin(t * 1.9 + i * 2.399 * 7)), 12); prisms.setColorAt(i, pc.setRGB(0.78 + 0.6 * g, 0.7 + 0.55 * g, 0.52 + 0.5 * g)); } if (prisms.instanceColor) prisms.instanceColor.needsUpdate = true; };
    glitter(0); if (!ctx.reduced) k.ticks.push(glitter);
    for (const s of [-1, 1]) for (const z of [-5, -20, -33]) k.point(s * 11, 10, z, 0xffd9a0, 18, 14);
    const ar = k.arch(6, 7.5, 0.6, 14, 0, -12, gilt, false, 0.65); ar.rotation.y = PI / 2;
    k.box(0.4, 9, 6.2, 17.2, 4.5, -12, dark); for (const dz of [-3.1, 3.1]) k.box(3.4, 9, 0.4, 15.5, 4.5, -12 + dz, dark); k.box(3.4, 0.4, 6.2, 15.5, 8.8, -12, dark); k.box(3.4, 0.3, 6.2, 15.5, -0.15, -12, carpet);
    const curtG = new T.BoxGeometry(0.5, 7.6, 5.6); curtG.translate(0, -3.8, 0);
    const curtain = k.mesh(curtG, velvet, 16.6, 7.9, -12, true);
    for (let z = -14.6; z <= -9.4; z += 0.8) k.box(0.7, 7.6, 0.4, 16.5, 4.1, z, velvet);
    const curtainL = k.point(15.6, 6, -12, 0xff5030, 24, 8);
    // the house lights: every so often the chandeliers dim and the curtain glows, as if for a show
    const cue = (t: number) => { const ph = t % 80; return ph < 62 ? 1 : ph < 65 ? 1 - (0.45 * (ph - 62)) / 3 : ph < 74 ? 0.55 : ph < 77 ? 0.55 + (0.45 * (ph - 74)) / 3 : 1; };
    if (!ctx.reduced) k.ticks.push((t) => { const f = cue(t); chand.forEach((l, i) => { l.intensity = (36 + 8 * Math.sin(t * 0.7 + i * 1.3)) * f; }); curtainL.intensity = 24 + 50 * (1 - f); });
    // the Wonder Morton console, glimpsed under the arch in front of the curtain
    organConsole(k, 15.4, 0, -12, -PI / 2, { body: cream, trim: gilt, keys: k.flat(0xf4efe2, 0, 0.35), black: dark, stops: k.flat(0xc83a2a, 0, 0.4) });
    // ushers in maroon at the auditorium arch, one with a flashlight
    const usherM = k.flat(0x5a1420, 0, 0.7), capM = k.flat(0x1a1416, 0, 0.6), skinU = k.flat(0xc8a284, 0, 0.7);
    const usher = (x: number, z: number) => { k.mesh(new T.CapsuleGeometry(0.21, 0.82, 3, 8), usherM, x, 0.63, z); k.sphere(0.125, x, 1.37, z, skinU, 10); k.cyl(0.13, 0.1, x, 1.52, z, capM, 0.12, 10); for (let b = 0; b < 4; b++) k.sphere(0.022, x - 0.2, 0.75 + b * 0.12, z, gilt, 5); k.keepOut.push({ x, z, r: 0.5 }); };
    usher(12.3, -15.0); usher(12.3, -8.95);
    const beamG = new T.ConeGeometry(0.38, 2.6, 12, 1, true); beamG.translate(0, -1.3, 0); beamG.rotateX(-PI / 2);
    const torch = k.mesh(beamG, new T.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.1, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), 12.05, 1.05, -9.2, true);
    const aim = new T.Vector3();
    const sweep = (t: number) => { torch.lookAt(aim.set(10 + 1.2 * Math.sin(t * 0.5), 0, -9.2 + 2.2 * Math.sin(t * 0.31))); };
    sweep(0); if (!ctx.reduced) k.ticks.push(sweep);
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
    k.crowd([v(2.4, 0, -19), v(2.4, 0, -25.6), v(2.4, RISE, -32.4), v(4.5, RISE, -35.8)], 7, { seed: 50, speed: 0.45, spread: 1.4, animate: !ctx.reduced, colors: [0x151517, 0x8a1a22, 0xd8d0c0, 0x1a2a4a, 0xc9a25a] });
    // landmark eggs
    const brown = { name: 'Brownstoner', url: 'https://www.brownstoner.com/history/kings-theatre-brooklyn-restoration-history/' };
    k.egg(v(0, 11.6, -16), { id: 'chandeliers', title: 'Three one ton lanterns', text: 'Three Art Deco lantern shaped chandeliers with prisms and fleurs de lis hang in the main lobby, each weighing about a ton. The ceiling around them is divided into octagonal and square coffers inspired by the Palazzo Medici Riccardi.', clue: 'Look up. No, higher, and count them.', source: { name: 'Wikipedia, Kings Theatre (Brooklyn)', url: 'https://en.wikipedia.org/wiki/Kings_Theatre_(Brooklyn)' } }, { r: 2.4 });
    k.egg(v(0, RISE + 4.6, Z1 + 0.8), { id: 'versailles', title: 'Versailles on Flatbush', year: '1929', text: 'Rapp and Rapp designed the Kings in 1929 in their signature French Baroque, drawing on Versailles and the Paris Opera, with nearly every surface decorated and gilded.', clue: 'The mirror at the top of the stair shows you the answer, and you.', source: brown }, { r: 2.4 });
    k.egg(v(15.2, 1.3, -12), { id: 'organ', title: 'The Wonder Morton', text: "Each of the five Loew's Wonder Theatres, the Kings among them, had a Morton Wonder organ, apparently the origin of the name Wonder Theatres. The Valencia in Jamaica, Queens was the first of the five to open.", clue: 'Four keyboards wait under the arch by the curtain.', source: { name: 'NYC Landmarks Preservation Commission, LP-2036', url: 'https://s-media.nyc.gov/agencies/lpc/lp/2036.pdf' }, room: 'valencia' }, { r: 1.2 });
    k.egg(v(12.3, 1.0, -15.0), { id: 'ushers', title: 'Ushers Stallone and Winkler', text: 'Sylvester Stallone and Henry Winkler were among the many teenage Brooklynites who worked here as ushers. The opening show, on September 7, 1929, featured the film Evangeline.', clue: 'The ones in uniform by the auditorium arch know a famous secret.', source: brown }, { r: 0.9 });
    k.egg(v(0, 4.9, FZ + 6.9), { id: 'restoration', title: 'Dark, then golden again', year: '1929 to today', text: "The Kings ended its run as a Loew's theatre in 1977 and gave its final curtain on July 18, 1980. A 95 million dollar restoration led to a grand reopening in January 2015, and Diana Ross played the opening concert on February 3.", clue: 'Step back out under the marquee and read the lights.', source: brown }, { r: 1.7 });
    // the hang: gilt frames between the pilasters, two above, the stair walls, the landing, the lobby
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (const z of [0.25, -5.25, -10.75, -16.25, -21.75]) { if (s > 0 && z === -10.75) continue; mounts.push({ position: v(s * 13.42, 4.3, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 11.3, 3, z), width: 3.6, height: 2.8, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (const z of [-5.25, -16.25]) mounts.push({ position: v(s * 13.42, 9.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 11.3, 3, z), width: 3.2, height: 2.2, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 13.66, RISE * 0.5 + 3.8, -29), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 11.3, 3, -29), width: 3.4, height: 2.4, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 9.2, RISE + 3.8, Z1 + 0.34), rotation: 0, target: v(s * 7, 3, Z1 + 4.2), width: 3.8, height: 2.6, style: 'gilt', wash: true });
    mounts.push({ position: v(13.66, 3.1, FZ - 4), rotation: -PI / 2, target: v(10, 3, FZ - 4), width: 3.2, height: 2.0, style: 'gilt', wash: true });
    return {
      mounts, spawn: v(0, 3, 0.5), look: v(0, 7.5, Z1), eye: 3, bounds: [-13.4, 13.4, Z1 + 0.8, 20.6], style: 'gilt',
      floorY: (_x, z) => (z > S0 ? 0 : z < S1 ? RISE : ((S0 - z) / (S0 - S1)) * RISE),
    };
  },
};

/* The Jamaica Avenue front of the Valencia, after the LPC description: a 40 foot frontispiece of yellow brick and glazed
   terra cotta, twisted paired pilasters with cherubs and shells, the big window, volutes and sphinxes above it, the
   curvilinear gable with three finials, a ticket booth of eight slender columns, twin metal volutes, the marquee.
   FZ is the street face of the lobby wall; the facade faces +z onto the sidewalk. */
function valenciaFront(k: Kit, ctx: RoomCtx, FZ: number) {
  const terra = k.pbr('lvTerra', X.plaster(0xead7b0, 137), 0.5, { roughness: 0.35 }),
    ybrick = k.pbr('lvYBrick', X.brick(0xc9a45a, 138), 0.3),
    rbrick = k.pbr('lvRBrick', X.brick(0x7a3a2c, 139), 0.28),
    tileC = k.flat(0x2a7a8a, 0.1, 0.3),
    bronze = k.flat(0x5a4028, 0.85, 0.35),
    gilt = k.pbr('lvGilt', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
    darkM = k.flat(0x16120f, 0.5, 0.5),
    winGlow = k.glow(0xffc98a, 0.85),
    doorGlow = k.glow(0xffe0b0, 0.55),
    glassW = k.glass(0xffe0b0, 0.3, 0.1),
    win = k.pbr('raWin', X.windows(44, 0.3, 0x2e3a48, true), 0.24, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.3, stretch: 0.42 }),
    shop = k.glow(0xffd9a0), cornice = k.pbr('raCornice', X.plaster(0xb8ad9a, 3), 0.6);
  const f = FZ + 0.5; // the face of the frontispiece
  // the street, the far side, parked cars
  avenue(k, { w: 14, len: 170, z: FZ + 12 });
  rowAcross(k, { z: FZ + 24, x0: -75, count: 16, face: -1, seed: 140, h: [8, 16] });
  rowAcross(k, { z: FZ, x0: -64.5, count: 5, face: 1, seed: 141, h: [12, 20] });
  rowAcross(k, { z: FZ, x0: 24.5, count: 5, face: 1, seed: 142, h: [12, 20] });
  cars(k, { z: FZ + 6.1, x0: -60, x1: -9, seed: 16 }); cars(k, { z: FZ + 6.1, x0: 12, x1: 60, seed: 17 }); cars(k, { z: FZ + 17.9, x0: -60, x1: 60, seed: 18 });
  k.skyline({ z: FZ + 130, count: 14, spacing: 10, scale: 1.4, base: -2, seed: 143, lit: 0.2, glow: 0.3, tint: 0x5e6270, rows: 1 });
  k.prop('lamppost', -14, 0.14, FZ + 4.4, { height: 6, keepOut: 0.5 }); k.prop('lamppost', 14, 0.14, FZ + 4.4, { height: 6, keepOut: 0.5 });
  // the neighbours' skin either side of the frontispiece, with the side doors out of the lobby at x = +-11
  for (const s of [-1, 1]) {
    k.box(3.9, 18.6, 0.3, s * 8.05, 9.3, FZ + 0.15, rbrick); k.box(7.3, 18.6, 0.3, s * 15.65, 9.3, FZ + 0.15, rbrick); k.box(2, 15.8, 0.3, s * 11, 10.7, FZ + 0.15, rbrick);
    k.box(3.2, 9, 0.1, s * 8.05, 11.5, FZ + 0.32, win); k.box(6.4, 9, 0.1, s * 15.65, 11.5, FZ + 0.32, win);
    k.box(6, 2.4, 0.1, s * 15.65, 1.5, FZ + 0.32, shop); k.box(13.4, 0.6, 0.8, s * 12.7, 18.5, FZ + 0.4, cornice);
    for (const dx of [-1.05, 1.05]) k.box(0.12, 2.9, 0.2, s * 11 + dx, 1.45, FZ + 0.3, bronze); k.box(2.2, 0.14, 0.2, s * 11, 2.87, FZ + 0.3, bronze);
  }
  // the brick field, the diaper of headers with coloured tiles at the crossings
  k.box(12.2, 18, 0.5, 0, 9, FZ + 0.25, ybrick); k.box(7.6, 1, 0.5, 0, 18.5, FZ + 0.25, ybrick);
  for (let x = -5.5; x <= 5.6; x += 1.1) for (let y = 6.2; y < 17.5; y += 1.1) { if (Math.abs(x) < 3.5 && y > 7.2 && y < 16.2) continue; k.box(0.14, 0.14, 0.05, x + ((Math.round(y / 1.1) % 2) * 0.55), y, f + 0.02, tileC).rotation.z = PI / 4; }
  // the base: glass doors, transom, twin volutes and the overhead panel
  k.box(9.4, 3.6, 0.1, 0, 1.94, f + 0.02, doorGlow);
  for (let x = -4.7; x <= 4.7; x += 1.175) k.box(0.1, 3.7, 0.14, x, 1.94, f + 0.06, bronze);
  k.box(9.6, 0.14, 0.14, 0, 3.8, f + 0.06, bronze); k.box(9.4, 0.7, 0.1, 0, 4.2, f + 0.02, glassW);
  for (const s of [-1, 1]) { k.box(0.22, 3.6, 0.22, s * 5.3, 1.94, f + 0.4, bronze); const vg = new T.TorusGeometry(0.55, 0.1, 6, 16, PI * 1.5); const vo = k.mesh(vg, bronze, s * 5.3, 4.0, f + 0.8); vo.rotation.y = PI / 2; }
  k.box(11, 0.3, 1.4, 0, 4.72, f + 0.7, bronze);
  // the ticket booth: glass, eight slender columns rising to finials, a foliate screen, a fret base
  const bz = f + 1.7;
  k.cyl(0.9, 0.36, 0, 0.32, bz, bronze, 0.9, 8); k.cyl(0.72, 2.2, 0, 1.6, bz, glassW, 0.72, 8); k.cyl(0.4, 1.4, 0, 1.3, bz, k.glow(0xffd9a0, 0.7), 0.4, 8);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8, cx = Math.cos(a) * 0.82, cz = bz + Math.sin(a) * 0.82; k.cyl(0.035, 2.8, cx, 1.9, cz, gilt, 0.035, 6); k.mesh(new T.ConeGeometry(0.07, 0.34, 6), gilt, cx, 3.47, cz); }
  k.cyl(0.88, 0.28, 0, 2.95, bz, gilt, 0.88, 8); k.mesh(new T.ConeGeometry(0.95, 0.5, 8), bronze, 0, 3.35, bz);
  k.block(-1, 1, bz - 1, bz + 1);
  // the marquee, with its pinnacles and the sign spelling out LOEW'S VALENCIA
  const mz = f + 2.0, mf = mz + 1.85;
  k.box(13.4, 1.8, 3.7, 0, 5.8, mz, darkM); for (const y of [4.86, 6.74]) k.box(13.6, 0.16, 3.9, 0, y, mz, gilt);
  k.box(13, 0.04, 3.4, 0, 4.88, mz, k.glow(0xffe8b8));
  for (const x of [-4.2, 0, 4.2]) { k.mesh(new T.ConeGeometry(0.2, 1.3, 6), gilt, x, 7.5, mf - 0.3); k.sphere(0.12, x, 8.2, mf - 0.3, gilt, 8); }
  for (const x of [-2.1, 2.1]) { const a = k.mesh(new T.TorusGeometry(1.6, 0.08, 6, 20, PI), gilt, x, 6.82, mf - 0.3); void a; }
  k.sign("LOEW'S VALENCIA", 10, 1.1, 0, 5.8, mf + 0.02, '#14090a', '#ffe9b0', 150, 0, { border: true });
  const bT: T.Matrix4[] = [];
  for (let x = -6.5; x <= 6.5; x += 0.5) for (const y of [5.02, 6.58]) bT.push(new T.Matrix4().makeTranslation(x, y, mf + 0.05));
  for (const s of [-1, 1]) for (let z = f + 0.4; z <= mf; z += 0.5) bT.push(new T.Matrix4().makeTranslation(s * 6.75, 5.8, z));
  const bulbs = k.instances(new T.SphereGeometry(0.08, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff }), bT); bulbs.castShadow = false;
  const bc = new T.Color(), nb = bT.length;
  const chase = (t: number) => { for (let i = 0; i < nb; i++) bulbs.setColorAt(i, bc.set((Math.floor(t * 5) + i) % 4 === 0 ? 0xfff4c8 : 0x8a6a2a)); if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true; };
  chase(0); if (!ctx.reduced) k.ticks.push(chase);
  k.point(0, 3.6, mz + 1.2, 0xffe0b0, 10, 10);
  // the big central window: three sections of multi light sash in a terra cotta surround
  k.box(5.8, 7.4, 0.1, 0, 11.5, f + 0.02, winGlow);
  for (const x of [-2.35, -1.8, -1.08, -0.36, 0.36, 1.08, 1.8, 2.35]) k.box(Math.abs(x) === 1.8 ? 0.16 : 0.06, 7.4, 0.1, x, 11.5, f + 0.08, bronze);
  for (let y = 8.8; y < 15.2; y += 1.05) k.box(5.8, 0.06, 0.1, 0, y, f + 0.08, bronze);
  for (const s of [-1, 1]) k.box(0.5, 7.9, 0.6, s * 3.15, 11.5, f + 0.25, terra);
  k.box(6.8, 0.5, 0.6, 0, 15.45, f + 0.25, terra); k.box(6.8, 0.4, 0.7, 0, 7.6, f + 0.3, terra);
  // paired twisted pilasters, cherubs under the capitals, larger cherub heads and half shells on the shafts
  for (const s of [-1, 1]) for (const px of [3.72, 4.42]) {
    const x = s * px;
    k.cyl(0.15, 9.4, x, 11.2, f + 0.35, terra, 0.15, 10);
    const hel: T.Vector3[] = []; for (let i = 0; i <= 60; i++) { const a = i * 0.55; hel.push(v(x + Math.cos(a) * 0.16, 6.5 + i * 0.156, f + 0.35 + Math.sin(a) * 0.16)); }
    k.curve(hel, 0.05, terra, 120);
    k.box(0.5, 0.36, 0.5, x, 16.05, f + 0.35, terra); k.box(0.42, 0.3, 0.42, x, 6.4, f + 0.35, terra);
    k.sphere(0.09, x, 15.72, f + 0.62, terra, 8);
  }
  for (const s of [-1, 1]) {
    const x = s * 4.07;
    for (const y of [9.2, 12.6]) { k.sphere(0.15, x, y, f + 0.62, terra, 10); for (const w of [-1, 1]) k.box(0.18, 0.06, 0.05, x + w * 0.2, y + 0.04, f + 0.6, terra).rotation.z = w * 0.4; }
    const sh = k.mesh(new T.CylinderGeometry(0.3, 0.3, 0.06, 12, 1, false, -PI / 2, PI), terra, x, 10.9, f + 0.6); sh.rotation.x = PI / 2;
  }
  // floral swags under the window head
  for (const s of [-1, 1]) k.curve([v(s * 2.9, 15.1, f + 0.62), v(s * 1.45, 14.55, f + 0.7), v(0, 15.1, f + 0.62)], 0.07, terra, 16);
  // spiral volutes, the small curving gable with its sash, the infill with sphinxes
  for (const s of [-1, 1]) { k.torus(0.38, 0.08, s * 2.3, 16.15, f + 0.4, terra, 20); k.torus(0.18, 0.06, s * 2.3, 16.15, f + 0.45, terra, 16); }
  const sg = new T.Shape(); sg.moveTo(-2.6, 0); sg.quadraticCurveTo(0, 2.6, 2.6, 0); sg.closePath();
  k.mesh(new T.ExtrudeGeometry(sg, { depth: 0.4, bevelEnabled: false, curveSegments: 12 }), terra, 0, 15.7, f);
  k.box(1.6, 0.7, 0.1, 0, 16.3, f + 0.45, winGlow);
  k.box(4.6, 2.0, 0.3, 0, 18.1, f + 0.1, terra);
  for (const s of [-1, 1]) { const sx = s * 1.35; k.box(0.8, 0.32, 0.36, sx, 17.4, f + 0.4, terra); k.sphere(0.16, sx - s * 0.46, 17.72, f + 0.42, terra, 10); k.box(0.3, 0.26, 0.14, sx - s * 0.46, 17.72, f + 0.34, terra); for (const pz of [-0.12, 0.12]) k.box(0.3, 0.08, 0.08, sx - s * 0.5, 17.3, f + 0.42 + pz, terra); }
  for (let i = 0; i < 5; i++) k.sphere(0.12, -0.6 + i * 0.3, 18.6 + Math.sin(i) * 0.15, f + 0.3, terra, 8);
  // the curvilinear roofline gable crowned by three finials; the lower side rooflines with a finial each; the lancets
  const rg = new T.Shape();
  rg.moveTo(-4.3, 0); rg.bezierCurveTo(-4.3, 1.4, -3.0, 1.2, -2.6, 2.0); rg.bezierCurveTo(-2.2, 2.9, -1.2, 2.6, -0.9, 3.3); rg.quadraticCurveTo(-0.5, 4.2, 0, 4.3);
  rg.quadraticCurveTo(0.5, 4.2, 0.9, 3.3); rg.bezierCurveTo(1.2, 2.6, 2.2, 2.9, 2.6, 2.0); rg.bezierCurveTo(3.0, 1.2, 4.3, 1.4, 4.3, 0); rg.closePath();
  k.mesh(new T.ExtrudeGeometry(rg, { depth: 0.5, bevelEnabled: false, curveSegments: 10 }), terra, 0, 18.9, FZ);
  for (const [x, y] of [[0, 23.2], [-2.6, 20.9], [2.6, 20.9]]) { k.box(0.4, 0.3, 0.4, x, y + 0.15, f, terra); k.mesh(new T.ConeGeometry(0.18, 1.1, 8), terra, x, y + 0.85, f); k.sphere(0.15, x, y + 1.5, f, terra, 8); }
  for (const s of [-1, 1]) {
    k.box(2.5, 0.3, 0.7, s * 4.95, 18.15, FZ + 0.35, terra);
    k.box(0.5, 0.4, 0.5, s * 4.95, 18.5, FZ + 0.35, terra); k.mesh(new T.ConeGeometry(0.28, 1.6, 8), terra, s * 4.95, 19.5, FZ + 0.35); k.sphere(0.2, s * 4.95, 20.4, FZ + 0.35, terra, 8);
    k.box(0.55, 3.4, 0.1, s * 5.0, 9.4, f + 0.02, winGlow); const lt = k.box(0.4, 0.4, 0.1, s * 5.0, 11.1, f + 0.02, winGlow); lt.rotation.z = PI / 4;
  }
  // polychrome tiles in the pavement in front of the doors, and light on the front
  k.plane(9, 2.6, 0, 0.146, f + 1.8, k.pbr('lvMinton', X.minton(), 0.6), 0, -PI / 2);
  k.spot(0, 0.4, FZ + 11, 0, 13, FZ, 0xffd9a0, 60, 0.55, 0.7, 34);
  // Jamaica Avenue traffic: one instanced set of bodies, one of cabins
  const cn = 7, rnd = X.mulberry(144), cst = Array.from({ length: cn }, (_, i) => ({ x: -80 + i * 23 + rnd() * 8, lane: i % 2, v: 5 + rnd() * 4 }));
  const bodyT = cst.map(() => new T.Matrix4()), cabT = cst.map(() => new T.Matrix4());
  const cb = k.instances(new T.BoxGeometry(4.4, 0.75, 1.8), new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.6 }), bodyT), cc = k.instances(new T.BoxGeometry(2.3, 0.6, 1.62), k.flat(0x1a2026, 0.6, 0.2), cabT);
  const ccol = new T.Color(); cst.forEach((_c, i) => cb.setColorAt(i, ccol.set([0x1a1c22, 0xd8d6cf, 0x8a1a22, 0x2a3a5a, 0xe8c030, 0x5a5e66, 0x1f3a2a][i]))); if (cb.instanceColor) cb.instanceColor.needsUpdate = true;
  const drive = (_t: number, dt: number) => { for (let i = 0; i < cn; i++) { const c = cst[i], dir = c.lane ? -1 : 1; c.x += dir * c.v * Math.min(dt, 0.1); if (c.x > 85) c.x = -85; if (c.x < -85) c.x = 85; const z = FZ + (c.lane ? 15.2 : 12.2); bodyT[i].makeTranslation(c.x, 0.6, z); cabT[i].makeTranslation(c.x - dir * 0.2, 1.22, z); cb.setMatrixAt(i, bodyT[i]); cc.setMatrixAt(i, cabT[i]); } cb.instanceMatrix.needsUpdate = cc.instanceMatrix.needsUpdate = true; };
  drive(0, 0); if (!ctx.reduced) k.ticks.push(drive);
  k.crowd([v(-40, 0.14, FZ + 3.2), v(40, 0.14, FZ + 3.2)], 12, { seed: 145, speed: 1.0, spread: 1.8, animate: !ctx.reduced });
  return { booth: v(0, 1.6, bz), marquee: v(0, 5.8, mf + 0.1), front: v(0, 13.5, f + 0.4) };
}

/* ---------------- 133 LOEW'S VALENCIA ---------------- */
export const valencia: RoomDef = {
  id: 'valencia',
  name: 'A sky inside Jamaica',
  area: "LOEW'S VALENCIA / JAMAICA, QUEENS",
  mood: '1929, the clouds are on',
  color: '#b8a089',
  daylit: false,
  description: 'John Eberson\'s atmospheric theatre: the auditorium is a Spanish courtyard at night, tiled roofs and balconies along the walls, a proscenium arch and a red curtain at the end, and over it all a deep blue sky with stars and drifting clouds. The works hang on the courtyard walls.',
  signatures: 'The 1929 atmospheric auditorium: Spanish and Moorish courtyard facades with balconies, tiled roofs and corner towers, the proscenium arch, the blue plaster sky with its star bulbs and drifting clouds, the Wonder organ, and outside on Jamaica Avenue the Churrigueresque front of yellow brick and glazed terra cotta with its ticket booth and marquee. A 1929 inspired exhibition, not the present congregation\'s interior.',
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
    // the curtain and its pleats are one mesh hung from the top, so it can rise for the show
    const curtParts = [new T.BoxGeometry(22, 14.2, 0.6)]; curtParts[0].translate(0, -7.1, 0);
    for (let x = -10.5; x <= 10.5; x += 1.0) { const pg = new T.BoxGeometry(0.7, 14, 0.5); pg.translate(x, -7, 0.2); curtParts.push(pg); }
    const curtain = k.mesh(mergeGeometries(curtParts)!, velvet, 0, PB + 15.0, PZ - 1.2, true);
    // behind it, the stage and the back wall, lit warm
    k.box(22, 0.3, 5, 0, PB + 0.85, PZ - 3.6, planks); k.box(24, 16, 0.4, 0, PB + 8, PZ - 6.2, dark);
    k.point(0, PB + 5, PZ - 3.5, 0xffd9a0, 30, 12);
    for (let i = 0; i < 5; i++) k.spot(-8 + i * 4, PB + 18, PZ + 10, -8 + i * 4, PB + 6, PZ - 1, 0xffd9a0, 90, 0.35, 0.6, 30);
    // every ninety seconds the curtain rises part way, holds, and falls again
    const lift = (t: number) => { const ph = t % 90, e = (u: number) => u * u * (3 - 2 * u); return ph < 60 ? 0 : ph < 66 ? e((ph - 60) / 6) : ph < 78 ? 1 : ph < 84 ? 1 - e((ph - 78) / 6) : 0; };
    if (!ctx.reduced) k.ticks.push((t) => { curtain.scale.y = (1 - 0.38 * lift(t)) * (1 + 0.018 * Math.sin(t * 0.7)); curtain.scale.x = 1 + 0.01 * Math.sin(t * 0.45 + 1); });
    // the rear wall with three doors into the lobby, the exit signs, the lobby with its ticket board
    const RZ = 26;
    for (const x of [-15.5, -5, 5, 15.5]) k.box(7, 14, 0.6, x, 7, RZ, plasterD);
    for (const x of [-10, 0, 10]) { k.box(3.6, 10.6, 0.6, x, 3.4 + 5.3, RZ, plasterD); k.box(3.2, 0.4, 0.3, x, 3.55, RZ + 0.1, exitG); }
    k.sign('EXIT', 1.2, 0.36, -10, 3.55, RZ - 0.32, 'transparent', '#ffffff', 100, PI); k.sign('"EXIT"', 1.4, 0.36, 0, 3.55, RZ - 0.32, 'transparent', '#ffffff', 100, PI); k.sign('EXIT', 1.2, 0.36, 10, 3.55, RZ - 0.32, 'transparent', '#ffffff', 100, PI);
    for (const x of [-15.5, -5, 5, 15.5]) k.block(x - 3.5, x + 3.5, RZ - 0.3, RZ + 0.3);
    k.box(38, 0.3, 6, 0, -0.15, RZ + 3, terrazzo);
    k.box(38, 0.4, 6, 0, 4.6, RZ + 3, plasterD);
    for (const s of [-1, 1]) k.box(0.6, 4.8, 6, s * 19, 2.4, RZ + 3, plasterD);
    // the lobby's street wall, with a door either side of the census out to Jamaica Avenue
    for (const s of [-1, 1]) { k.box(7.3, 4.8, 0.6, s * 15.65, 2.4, RZ + 6, plasterD); k.box(2, 2.0, 0.6, s * 11, 3.8, RZ + 6, plasterD); k.block(Math.min(s * 12, s * 19.3), Math.max(s * 12, s * 19.3), RZ + 5.7, RZ + 6.6); }
    k.box(20, 4.8, 0.6, 0, 2.4, RZ + 6, plasterD); k.block(-10, 10, RZ + 5.7, RZ + 6.6);
    for (const s of [-1, 1]) { k.box(2.2, 0.4, 0.3, s * 11, 3.0, RZ + 5.62, exitG); }
    k.censusWall({ x: 0, y: 2.5, z: RZ + 5.66, rotY: PI, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(6200, 150), pieces: ctx.all, backing: gilt });
    k.sign('TONIGHT  ·  THE NEW YORKERS  ·  CONTINUOUS FROM 11 AM', 8, 0.5, 0, 4.2, RZ + 5.62, 'transparent', '#f0e0b0', 80, PI);
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
    // out through the lobby: Jamaica Avenue and the front
    const front = valenciaFront(k, ctx, RZ + 6.3);
    // the Wonder organ console at the pit, stage left
    organConsole(k, -13.2, PB + 1.0, -23.8, 0, { body: cream, trim: gilt, keys: k.flat(0xf4efe2, 0, 0.35), black: dark, stops: k.flat(0xc83a2a, 0, 0.4) });
    k.point(-13.2, PB + 3.2, -21.4, 0xffd9a0, 3, 5);
    // landmark eggs
    const lpc = { name: 'NYC Landmarks Preservation Commission, LP-2036', url: 'https://s-media.nyc.gov/agencies/lpc/lp/2036.pdf' };
    k.egg(v(0, 21, -2), { id: 'sky', title: 'A plaster sky', text: 'John Eberson invented the atmospheric theatre. In place of a domed ceiling he made a blue plaster sky with electric bulbs for stars, and a hidden machine projected clouds drifting across it.', clue: 'Tonight the best seat faces up.', source: lpc }, { r: 3.5 });
    k.egg(v(-13.2, PB + 2.0, -23.6), { id: 'organ', title: 'Where the Wonder organ went', text: "The Valencia's Wonder Morton was bought in 1965 by Peter Schaeble, who installed it in an underground studio at his home in Rosedale. Restored, it now plays in the Balboa Theatre in San Diego.", clue: 'The console by the stage has an empty bench and a long way to travel.', source: { name: 'Garden State Theatre Organ Society', url: 'https://gstos.org/organs/the-bob-balfour-memorial-wonder-morton-theatre-pipe-organ/the-5-wonder-mortons-where-are-they-now/' }, room: 'kingsfoyer' }, { r: 1.3 });
    k.egg(front.front, { id: 'facade', title: 'Churrigueresque on Jamaica Avenue', text: 'For the 40 foot wide Jamaica Avenue front, Eberson set glazed terra cotta against yellow brick in the manner of Spanish and Mexican Baroque churches: twisted forms, cherubs, shells, sphinxes and a curving gable crowned by three finials.', clue: 'Walk out through the lobby and turn around.', source: lpc }, { r: 3 });
    k.egg(front.booth, { id: 'opening', title: 'Opening day, January 12, 1929', year: '1929', text: "The Valencia opened on Saturday, January 12, 1929, the first of the five Loew's Wonder Theatres. The opening program ran continuously from 11 a.m. until midnight and drew an estimated 17,000 customers.", clue: 'Buy your ticket at the little booth with eight columns.', source: lpc }, { r: 1.1 });
    k.egg(front.marquee, { id: 'tabernacle', title: 'A church since 1977', year: '1977', text: 'The Valencia entertained Queens for half a century. Since 1977 it has housed the Tabernacle of Prayer for All People, and the city designated it a landmark on May 25, 1999.', clue: 'Under the marquee lights, think of Sunday morning.', source: lpc }, { r: 1.5 });
    // the hang: the piers of the arcades, the upper storeys of the houses, the organ grilles
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) {
      for (const z of [13, 6.5, 0, -6.5, -13]) mounts.push({ position: v(s * 16.68, ramp(z) + 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 15.6, 3, z), width: 2.5, height: 1.9, style: 'oak', wash: true });
      for (const zc of [19.5, 6.5, -6.5, -19.5]) mounts.push({ position: v(s * 17.16, ramp(zc) + 8.9 + ((zc === 6.5 || zc === -19.5) ? 0.8 : 0), zc), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, zc), width: 3.2, height: 2.3, style: 'gilt', wash: true, tilt: 0.25 });
      mounts.push({ position: v(s * 15, PB + 4.4, PZ + 1.52), rotation: 0, target: v(s * 13.5, 3, PZ + 5.2), width: 4.0, height: 2.9, style: 'gilt', wash: true });
    }
    return {
      mounts, spawn: v(0, 3, 22.5), look: v(0, 6, PZ), eye: 3, bounds: [-17.8, 17.8, PZ + 4.5, RZ + 15.8], style: 'gilt',
      floorY: (_x, z) => (z > RZ + 11.3 ? 0 : z > RZ + 6.3 ? 0.14 : z > RZ ? 0 : ramp(z)),
    };
  },
};
